/** 把当前会话窗口里已展示的内容编成 Agent 可参考的上下文。 */

const SKIP_TYPES = new Set(["typing", "thinking", "brief_card"]);
const MAX_TURNS = 40;
const MAX_BLOCK_CHARS = 12000;
const MAX_TURN_CHARS = 1600;

const ACTION_STATE_LABEL = {
  pending: "待用户确认是否群发",
  sent: "已发送（演示未真实发信）",
  skipped: "用户选择暂不发送",
};

export const WINDOW_CONTEXT_MARK = "【本会话窗口已有内容】";

export function stripHtml(html) {
  return String(html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function truncate(text, max = MAX_TURN_CHARS) {
  const value = String(text || "").trim();
  if (value.length <= max) return value;
  return `${value.slice(0, max)}\n…（已截断）`;
}

function formatLeadGen(msg) {
  const buyers = Array.isArray(msg.buyers) ? msg.buyers : [];
  const emails = Array.isArray(msg.emails) ? msg.emails : [];
  const mailed = Array.isArray(msg.mailRecipients) ? msg.mailRecipients : buyers.filter((b) => b.inDefaultMail);
  const buyerLines = buyers.map((b, i) => {
    const tags = Array.isArray(b.tags) ? b.tags.map((t) => t.label).join("、") : "";
    const mailFlag = b.inDefaultMail ? "写入通用信" : (b.canOptInMail ? "可勾选加入" : "不发送");
    return `${i + 1}. ${b.company || "未知公司"}｜开发价值 ${b.score || 0} 星｜${mailFlag}｜${tags}｜${b.reason || ""}｜${b.email || "无邮箱"}`;
  });
  const mailLines = emails.map((mail) => (
    `To: ${mail.to || ""}\nSubject: ${mail.subject || ""}\n${mail.preview || ""}`
  ));
  const state = ACTION_STATE_LABEL[msg.actionState] || msg.actionState || "未知";
  return [
    `获客结果卡片：已找到 ${buyers.length} 家采购商，开发价值五星表示高开发价值、高活跃`,
    `默认写入通用信 ${mailed.length} 家（4–5 星）`,
    buyerLines.join("\n"),
    "已生成一封通用开发信：",
    mailLines.join("\n---\n"),
    `群发状态：${state}`,
  ].filter(Boolean).join("\n");
}

function formatTool(msg) {
  const title = msg.title || msg.name || "工具";
  const status = msg.status === "done" ? "已完成" : (msg.status || "进行中");
  const lines = [`工具「${title}」${status}`];
  if (msg.input) lines.push(`参数：${truncate(msg.input, 500)}`);
  if (msg.output) lines.push(`结果：${truncate(msg.output, 800)}`);
  if (Array.isArray(msg.steps) && msg.steps.length) {
    lines.push(`步骤：${msg.steps.join(" → ")}`);
  }
  return lines.join("\n");
}

function formatTimeline(msg) {
  const steps = Array.isArray(msg.steps) ? msg.steps : [];
  const lines = steps.map((step) => {
    const title = step.title || step.summary || step.kind || "步骤";
    const status = step.status === "done" ? "完成" : (step.status || "");
    return `- ${title}${status ? `（${status}）` : ""}`;
  });
  return [`处理进度${msg.status === "done" ? "（已完成）" : ""}：`, ...lines].join("\n");
}

export function formatWindowMessage(msg) {
  if (!msg || SKIP_TYPES.has(msg.type)) return "";
  if (msg.type === "lead_gen_result") return formatLeadGen(msg);
  if (msg.type === "tool") return formatTool(msg);
  if (msg.type === "timeline") return formatTimeline(msg);
  if (msg.type === "artifact") {
    const title = msg.title || "产品详情页草稿";
    const industry = msg.industryName ? `，行业 ${msg.industryName}` : "";
    return `草稿卡片：${title}${industry}`;
  }
  if (msg.type === "success") {
    return "系统提示：产品已成功发布上线（演示）。";
  }
  const text = stripHtml(msg.html || msg.text || msg.content || "");
  if (!text) return "";
  const images = msg.attachments || msg.imageUrls;
  if (Array.isArray(images) && images.length) {
    return `${text}\n（附带 ${images.length} 张图片）`;
  }
  return text;
}

export function messagesToConversation(messages, { maxTurns = MAX_TURNS } = {}) {
  const turns = [];
  for (const msg of messages || []) {
    const text = formatWindowMessage(msg);
    if (!text) continue;
    turns.push({
      role: msg.type === "user" ? "user" : "assistant",
      text: truncate(text),
    });
  }
  if (turns.length <= maxTurns) return turns;
  return turns.slice(-maxTurns);
}

export function formatConversationBlock(conversation, { maxChars = MAX_BLOCK_CHARS } = {}) {
  const turns = Array.isArray(conversation) ? conversation : [];
  const parts = [];
  for (const turn of turns) {
    const text = String(turn?.text || "").trim();
    if (!text) continue;
    const label = turn.role === "user" ? "用户" : "助手";
    parts.push(`${label}：${text}`);
  }
  if (!parts.length) return "";

  const header = (
    `${WINDOW_CONTEXT_MARK}\n`
    + "以下内容已经显示在当前会话窗口中（含系统固定话术、工具结果、结果卡片与此前回复），"
    + "请作为上下文理解用户本轮指令。这些不是用户本轮新输入。\n\n"
  );
  const footer = "\n【窗口上下文结束】\n\n";
  let body = parts.join("\n\n");
  const budget = Math.max(400, maxChars - header.length - footer.length);
  if (body.length > budget) {
    body = `…（更早的窗口内容已省略）\n\n${body.slice(-(budget - 24))}`;
  }
  return header + body + footer;
}
