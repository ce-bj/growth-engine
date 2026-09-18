const MAX_PAYLOAD_CHARS = 6000;

/** 格式化 ToolCallBlock 入参 / ToolResultBlock 出参 */
export function formatBlockPayload(raw) {
  if (raw == null || raw === "") return "";
  const text = String(raw).trim();
  if (!text) return "";
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

export function truncatePayload(text, max = MAX_PAYLOAD_CHARS) {
  if (!text || text.length <= max) return text;
  return `${text.slice(0, max)}\n\n…（已截断，完整内容见 Agent 日志）`;
}

const TOOL_STEP_TEXT = {
  analyze_product_images: {
    running: "正在分析产品实拍图…",
    done: "图像分析完成",
  },
  lookup_content_spec: {
    running: "正在查询行业内容规范…",
    done: "行业内容规范查询完成",
  },
  query_industry_page_spec: {
    running: "正在查询行业规范与必选模块…",
    done: "行业规范与模块查询完成",
  },
  search_agent_industries: {
    running: "正在搜索匹配行业…",
    done: "行业库搜索完成",
  },
  generate_product_content: {
    running: "正在调用 AI 生成各板块可发布文案…",
    done: "详情页内容生成完成",
  },
  patch_page_draft: {
    running: "正在局部修订详情页草稿…",
    done: "详情页局部修订完成",
  },
  Skill: {
    running: "正在读取 product-publish 技能说明…",
    done: "技能说明已加载",
  },
  skill: {
    running: "正在读取 product-publish 技能说明…",
    done: "技能说明已加载",
  },
};

const TOOL_ICON_TYPE = {
  analyze_product_images: "analysis",
  lookup_content_spec: "search",
  query_industry_page_spec: "search",
  search_agent_industries: "search",
  generate_product_content: "generate",
  patch_page_draft: "generate",
  Skill: "search",
  skill: "search",
};

export function summarizeToolStep(name, title, status = "running") {
  const phase = status === "done" ? "done" : "running";
  const mapped = TOOL_STEP_TEXT[name];
  if (mapped?.[phase]) return mapped[phase];
  const label = title || name || "Agent 工具";
  return phase === "done" ? `${label} 已完成` : `正在调用 ${label}…`;
}

export function getToolIconType(name) {
  return TOOL_ICON_TYPE[name] || "generate";
}

/**
 * 将 SSE thinking/tool 事件转为 timeline 步骤对象。
 * @param {object} event - SSE event
 * @param {"thinking"|"tool"} kind
 * @param {"start"|"delta"|"end"|"call"|"progress"|"result"} phase
 * @returns {object} timeline step update
 */
export function buildTimelineStep(event, kind, phase) {
  const now = Date.now();

  if (kind === "thinking") {
    const id = event.id || "thinking-main";
    if (phase === "start") {
      return {
        _id: `step-thinking-${id}`,
        kind: "thinking",
        title: "推理过程",
        summary: "分析用户消息，规划工具调用与回复结构…",
        detail: "",
        status: "running",
        startedAt: now,
      };
    }
    if (phase === "delta") {
      return {
        _id: `step-thinking-${id}`,
        kind: "thinking",
        title: "推理过程",
        status: "running",
        detail: event.text || "",
      };
    }
    if (phase === "end") {
      return {
        _id: `step-thinking-${id}`,
        kind: "thinking",
        title: "推理过程",
        status: "done",
        detail: event.content || "",
        endedAt: now,
      };
    }
  }

  if (kind === "tool") {
    const toolId = event.id || event.name || `tool-${now}`;
    const name = event.name || "";
    const title = event.title || name || "Agent 工具";
    const input = truncatePayload(formatBlockPayload(event.input));
    const output = truncatePayload(formatBlockPayload(event.output));
    const summary = event.summary ? String(event.summary).trim() : "";

    const progressPct =
      event.total > 0 && event.completed >= 0
        ? Math.min(100, Math.round((event.completed / event.total) * 100))
        : event.progressPct;

    if (phase === "call") {
      return {
        _id: `step-tool-${toolId}`,
        kind: "tool",
        toolName: name,
        title,
        summary: summarizeToolStep(name, title, "running"),
        status: "running",
        startedAt: now,
        ...(input ? { input } : {}),
      };
    }
    if (phase === "progress") {
      return {
        _id: `step-tool-${toolId}`,
        kind: "tool",
        toolName: name,
        title,
        status: "running",
        ...(progressPct != null ? { progressPct } : {}),
        ...(event.message ? { summary: String(event.message) } : {}),
      };
    }
    if (phase === "result") {
      const dur = summary ? summarizeToolStep(name, title, "done") : summary;
      return {
        _id: `step-tool-${toolId}`,
        kind: "tool",
        toolName: name,
        title,
        summary: summary || dur,
        status: "done",
        endedAt: now,
        ...(input ? { input } : {}),
        ...(output ? { output } : {}),
      };
    }
  }

  return null;
}

/** 将 tool_call / tool_result / tool_progress 事件转为可展示的消息块 */
export function buildToolMessage(event, status = "running") {
  const name = event.name || "";
  const title = event.title || name || "Agent 工具";
  const input = truncatePayload(formatBlockPayload(event.input));
  const output = truncatePayload(formatBlockPayload(event.output));
  const summary = event.summary ? String(event.summary).trim() : "";
  const step = summarizeToolStep(name, title, status);
  const steps = [step];
  if (event.message && status === "running") {
    steps.push(String(event.message));
  }
  if (summary && status === "done") {
    steps.push(summary);
  }

  const progressPct =
    event.total > 0 && event.completed >= 0
      ? Math.min(100, Math.round((event.completed / event.total) * 100))
      : event.progressPct;

  return {
    type: "tool",
    id: event.id || name || `tool-${Date.now()}`,
    icon: status === "done" ? "✓" : "◎",
    iconType: getToolIconType(name),
    title,
    name,
    steps,
    ...(summary ? { summary } : {}),
    ...(input ? { input } : {}),
    ...(output ? { output } : {}),
    ...(progressPct != null ? { progressPct } : {}),
    ...(event.message ? { progressText: String(event.message) } : {}),
    status,
    defaultOpen: status === "running" ? Boolean(input || event.message) : Boolean(summary || input || output),
  };
}
