import http from "node:http";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (key && (!process.env[key] || !String(process.env[key]).trim())) process.env[key] = value;
  }
}

loadEnvFile(path.join(PROJECT_ROOT, ".env.server"));

const PORT = Number(process.env.CHAT_SERVER_PORT || 8787);
const AGENT_PYTHON_URL = process.env.AGENT_PYTHON_URL || "";
const CHAT_REQUEST_TIMEOUT_MS = Number(process.env.CHAT_REQUEST_TIMEOUT_MS || 0);
const AGENTSCOPE_BASE_URL = process.env.AGENTSCOPE_BASE_URL || "";
const AGENT_ID = process.env.AGENTSCOPE_AGENT_ID || "";
const SESSION_ID = process.env.AGENTSCOPE_SESSION_ID || "";
const USER_ID = process.env.AGENTSCOPE_USER_ID || "product-publish-demo";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-user-id");
}

function sendJson(res, status, data) {
  setCors(res);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function startEventStream(res) {
  setCors(res);
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });
}

function writeEvent(res, event) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

function normalizeAgentScopeEvent(event) {
  const msg = event?.msg || event?.message || event?.data;
  if (!msg?.content || !Array.isArray(msg.content)) return [{ type: "raw", event }];

  return msg.content.map((block) => {
    if (block.type === "text") return { type: "text", text: block.text || "" };
    if (block.type === "tool_call") {
      return {
        type: "tool_call",
        id: block.id,
        name: block.name,
        input: block.input,
        status: block.state || "running",
      };
    }
    if (block.type === "tool_result") {
      return {
        type: "tool_result",
        id: block.id,
        name: block.name,
        output: block.output,
        status: block.state || "done",
      };
    }
    return { type: "raw", event: block };
  });
}

async function pipeSseResponse(res, response, abortSignal) {
  if (!response.ok || !response.body) {
    const detail = await response.text();
    throw new Error(`Upstream ${response.status}: ${detail}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      if (abortSignal?.aborted || res.writableEnded || res.destroyed) {
        await reader.cancel();
        break;
      }

      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split("\n\n");
      buffer = frames.pop() || "";

      for (const frame of frames) {
        const line = frame.split("\n").find((item) => item.startsWith("data:"));
        if (!line) continue;
        const raw = line.slice(5).trim();
        if (!raw || raw === "[DONE]") continue;
        try {
          writeEvent(res, JSON.parse(raw));
        } catch {
          writeEvent(res, { type: "text", text: raw });
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

async function streamPythonAgent(res, message, imageUrls, images, sessionId, model, pageDraft, abortSignal, extras = {}) {
  const response = await fetch(`${AGENT_PYTHON_URL.replace(/\/$/, "")}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: abortSignal,
    body: JSON.stringify({
      message,
      conversation: extras.conversation || undefined,
      image_urls: imageUrls,
      images,
      session_id: sessionId || USER_ID,
      model: model || undefined,
      page_draft: pageDraft || undefined,
      draft_history: extras.draft_history || undefined,
      generation_brief: extras.generation_brief || undefined,
      client_action: extras.client_action || undefined,
    }),
  });
  await pipeSseResponse(res, response, abortSignal);
}

async function streamAgentScope(res, message) {
  const response = await fetch(`${AGENTSCOPE_BASE_URL.replace(/\/$/, "")}/chat/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": USER_ID,
    },
    body: JSON.stringify({
      agent_id: AGENT_ID,
      session_id: SESSION_ID,
      input: {
        name: "user",
        role: "user",
        content: [{ type: "text", text: message }],
      },
    }),
  });

  if (!response.ok || !response.body) {
    const detail = await response.text();
    throw new Error(`AgentScope ${response.status}: ${detail}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() || "";

    for (const frame of frames) {
      const line = frame.split("\n").find((item) => item.startsWith("data:"));
      if (!line) continue;
      const raw = line.slice(5).trim();
      if (!raw || raw === "[DONE]") continue;
      try {
        const parsed = JSON.parse(raw);
        for (const event of normalizeAgentScopeEvent(parsed)) writeEvent(res, event);
      } catch {
        writeEvent(res, { type: "text", text: raw });
      }
    }
  }
}

function detectMockScenario(message) {
  const text = message.trim();
  if (/耳机|蓝牙|3C|充电|手机|数码/.test(text)) {
    return {
      industry: "消费电子",
      category: "蓝牙耳机",
      imageOutput:
        "品类：真无线蓝牙耳机（TWS）\n行业：消费电子 / 3C 数码\n可见特征：充电盒、入耳式耳塞、USB-C 接口\n推断属性：支持蓝牙 5.x、降噪（待确认）",
      specOutput:
        "规范版本：门户-消费电子-v1\n必选模块：产品主图、核心卖点、规格参数、续航与充电、配件清单、包装内容、售后政策、SEO\n行业合规：3C 认证说明、无线电型号核准（如适用）\nSEO 要求：标题含品类+核心功能词",
      genOutput:
        "已按知识库模块生成详情页草稿\n模块覆盖率：7/8\n质量评分：82/100\n标题示例：XX 真无线降噪蓝牙耳机 | 长续航 · 低延迟",
    };
  }
  if (/食品|零食|饮料|有机|包装/.test(text)) {
    return {
      industry: "食品饮料",
      category: "包装食品",
      imageOutput:
        "品类：袋装休闲零食\n行业：食品饮料\n可见特征：品牌包装、净含量标注、配料表区域\n推断属性：规格以包装标注为准（待确认）",
      specOutput:
        "规范版本：门户-食品饮料-v1\n必选模块：产品主图、产品概述、配料与营养成分、生产日期/保质期说明、储存方式、生产许可、质检报告入口、SEO\n行业合规：食品生产许可证、营养成分表规范\nSEO 要求：标题含品牌+品类+规格",
      genOutput:
        "已按知识库模块生成详情页草稿\n模块覆盖率：6/8\n质量评分：78/100\n缺失项：质检报告附件（建议补充）",
    };
  }
  // 默认：工业设备示例（识图结果随附件变化，此处为 Mock 占位）
  return {
    industry: "工业设备",
    category: "（由识图模型返回，如阀门/泵/电机等）",
    imageOutput:
      "品类：（由识图模型返回）\n行业：（由识图模型返回，如工业设备）\n可见特征：外观、颜色、结构、铭牌线索\n推断属性：从图中可见的规格线索（如有）",
    specOutput:
      "规范版本：（由知识库按 industry+category 返回）\n必选模块：（动态列表，如主图、概述、技术参数、应用场景、认证资质、CTA 等）\n行业合规：（如 GB/API/CE 等，因行业而异）\nSEO 要求：（由知识库返回）",
    genOutput:
      "已按知识库返回的必选模块生成详情页草稿\n模块覆盖率：（实际/必选）\n质量评分：（按 scoring_rubric 计算）\n说明：Mock 占位，真实环境由 LLM 生成各板块内容",
  };
}

async function streamMock(res, message) {
  const normalized = message.trim();
  const scenario = detectMockScenario(normalized);

  writeEvent(res, {
    type: "text",
    text: `收到，我将按 product-publish Skill 处理你的需求：${normalized || "发布产品详情页"}。\n\n正在识别行业与品类，并查询对应规范...\n\n`,
  });
  await sleep(450);

  const tools = [
    {
      id: "image-analysis",
      name: "analyze_product_images",
      title: "图像智能分析",
      input: "分析产品实拍图，识别品类、行业与可见特征",
      output: scenario.imageOutput,
    },
    {
      id: "industry-page-spec",
      name: "query_industry_page_spec",
      title: "行业规范与模块查询",
      input: `查询 ${scenario.industry} / ${scenario.category} 的详情页必选模块与行业规范`,
      output: scenario.specOutput,
    },
    {
      id: "content-generator",
      name: "generate_product_content",
      title: "详情页内容生成",
      input: "按知识库模块清单与识图结果生成各板块内容",
      output: scenario.genOutput,
    },
  ];

  for (const tool of tools) {
    writeEvent(res, {
      type: "tool_call",
      id: tool.id,
      name: tool.name,
      title: tool.title,
      input: tool.input,
      status: "running",
    });
    await sleep(550);
    writeEvent(res, {
      type: "tool_result",
      id: tool.id,
      name: tool.name,
      title: tool.title,
      output: tool.output,
      status: "done",
    });
    await sleep(350);
  }

  writeEvent(res, {
    type: "text",
    text:
      "\n已完成产品详情页初稿：各必选模块已按行业规范生成。右侧预览区可展示详情页效果，你也可以继续输入修改要求。",
  });

  if (/生成预览|看看预览|打开预览|预览效果|看看效果|查看预览/.test(normalized)) {
    writeEvent(res, { type: "preview", state: "ready" });
  }

  writeEvent(res, { type: "done" });
}

async function handleChat(req, res) {
  const body = await readJson(req);
  const message = body.message || "";
  const imageUrls = Array.isArray(body.image_urls) ? body.image_urls : [];
  const images = Array.isArray(body.images) ? body.images : [];
  const model = typeof body.model === "string" ? body.model.trim() : "";

  const abortController = new AbortController();
  req.on("close", () => {
    if (!res.writableEnded) abortController.abort();
  });

  startEventStream(res);
  try {
    if (AGENT_PYTHON_URL) {
      await streamPythonAgent(
        res,
        message,
        imageUrls,
        images,
        body.session_id,
        model,
        body.page_draft,
        abortController.signal,
        {
          draft_history: body.draft_history,
          generation_brief: body.generation_brief,
          client_action: body.client_action,
          conversation: Array.isArray(body.conversation) ? body.conversation : undefined,
        },
      );
    } else if (AGENTSCOPE_BASE_URL && AGENT_ID && SESSION_ID) {
      await streamAgentScope(res, message);
      writeEvent(res, { type: "done" });
    } else {
      await streamMock(res, message);
    }
  } catch (error) {
    writeEvent(res, {
      type: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  } finally {
    res.end();
  }
}

function resolveMode() {
  if (AGENT_PYTHON_URL) return "python-agent";
  if (AGENTSCOPE_BASE_URL && AGENT_ID && SESSION_ID) return "agentscope";
  return "mock";
}

function parseModelOptions(raw) {
  if (!raw || !String(raw).trim()) return [];
  return String(raw)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const server = http.createServer(async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    if (req.method === "GET" && req.url === "/health") {
      if (AGENT_PYTHON_URL) {
        try {
          const response = await fetch(`${AGENT_PYTHON_URL.replace(/\/$/, "")}/health`);
          const data = await response.json();
          sendJson(res, 200, { mode: resolveMode(), ...data });
          return;
        } catch (error) {
          sendJson(res, 200, {
            status: "degraded",
            mode: resolveMode(),
            model: process.env.OPENAI_MODEL || "qwen3.6-plus",
            model_options: parseModelOptions(process.env.OPENAI_MODEL_OPTIONS),
            error: error instanceof Error ? error.message : "bridge_unreachable",
          });
          return;
        }
      }

      const defaultModel = process.env.OPENAI_MODEL || "qwen3.6-plus";
      const modelOptions = parseModelOptions(process.env.OPENAI_MODEL_OPTIONS);
      sendJson(res, 200, {
        status: "ok",
        mode: resolveMode(),
        model: defaultModel,
        model_options: modelOptions.length ? modelOptions : [defaultModel],
      });
      return;
    }

    if (req.method === "POST" && req.url === "/api/chat") {
      await handleChat(req, res);
      return;
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  const mode = resolveMode();
  if (CHAT_REQUEST_TIMEOUT_MS > 0) {
    server.requestTimeout = CHAT_REQUEST_TIMEOUT_MS;
  } else {
    server.requestTimeout = 0;
  }
  server.headersTimeout = 0;
  server.keepAliveTimeout = 120_000;
  console.log(`Chat server listening on http://localhost:${PORT}`);
  if (mode === "python-agent") {
    console.log(`Forwarding to Python Agent bridge: ${AGENT_PYTHON_URL}`);
  } else if (mode === "agentscope") {
    console.log(`Forwarding to AgentScope: ${AGENTSCOPE_BASE_URL}`);
  } else {
    console.log(
      "Running in mock mode. Set AGENT_PYTHON_URL or AGENTSCOPE_* in .env.server",
    );
  }
});
