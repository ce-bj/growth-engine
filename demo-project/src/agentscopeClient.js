/**
 * AgentScope 2.0 官方服务 HTTP/SSE 客户端
 * 对接 http://<host>:8000 的 /chat/ 等接口
 */

const BASE_URL = import.meta.env.VITE_AGENTS_SCOPE_BASE_URL || "http://172.25.171.180:8000";
const USER_ID = import.meta.env.VITE_AGENTS_SCOPE_USER_ID || "product-publish-demo";

function headers(json = true) {
  const h = { "x-user-id": USER_ID };
  if (json) h["Content-Type"] = "application/json";
  return h;
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, options);
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`${res.status} ${path}: ${detail}`);
  }
  return res;
}

/** 读取初始化脚本生成的 agent_id / session_id */
export async function loadAgentRc() {
  const res = await fetch("/.agentrc.json");
  if (!res.ok) throw new Error("缺少 .agentrc.json，请先运行 agentscope-agent/scripts/setup-product-publish-agent.ps1");
  return res.json();
}

export function buildUserMsg(text) {
  return {
    name: "user",
    role: "user",
    content: [{ type: "text", text }],
  };
}

/**
 * 解析 SSE 流，产出统一事件
 * @param {ReadableStream} body
 * @returns {AsyncGenerator<{kind:string,[key:string]:any}>}
 */
export async function* parseSSE(body) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() || "";

    for (const part of parts) {
      const line = part.split("\n").find((l) => l.startsWith("data:"));
      if (!line) continue;
      const raw = line.slice(5).trim();
      if (!raw || raw === "[DONE]") continue;

      let event;
      try {
        event = JSON.parse(raw);
      } catch {
        continue;
      }
      yield* flattenAgentEvent(event);
    }
  }
}

function* flattenAgentEvent(event) {
  if (!event || typeof event !== "object") return;

  // AgentEvent 结构因版本可能略有差异，兼容常见字段
  const msg = event.msg || event.message || event.data;
  if (msg?.content && Array.isArray(msg.content)) {
    for (const block of msg.content) {
      if (block.type === "text" && block.text) {
        yield { kind: "text", text: block.text, role: msg.role || "assistant" };
      }
      if (block.type === "tool_call") {
        yield { kind: "tool_call", id: block.id, name: block.name, input: block.input, state: block.state };
      }
      if (block.type === "tool_result") {
        yield { kind: "tool_result", id: block.id, name: block.name, output: block.output, state: block.state };
      }
    }
    return;
  }

  if (event.type === "text" && event.text) {
    yield { kind: "text", text: event.text };
    return;
  }

  yield { kind: "raw", event };
}

/**
 * 发送消息并流式接收回复
 */
export async function* chatStream({ agentId, sessionId, text, input }) {
  const res = await request("/chat/", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      agent_id: agentId,
      session_id: sessionId,
      input: input || buildUserMsg(text),
    }),
  });

  yield* parseSSE(res.body);
}

/** 拉取会话历史（可用于刷新聊天列表） */
export async function listMessages(sessionId) {
  const res = await request(`/sessions/${sessionId}/messages`, { headers: headers(false) });
  return res.json();
}

export { BASE_URL, USER_ID };
