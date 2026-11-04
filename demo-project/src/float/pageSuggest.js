import { streamChat } from "../chatClient";

const CAPABILITIES = [
  "发布产品（帮我发布产品）",
  "发布内容（帮我发布内容）",
  "修改产品（帮我修改产品）",
  "修改内容（帮我修改内容）",
  "商机挖掘（帮我挖掘客户）",
  "邮件营销（帮我生成邮件）",
  "创建内容发布计划（帮我创建发布内容计划）",
  "生成智能营销页（帮我生成智能营销页）",
  "查找替换内容（帮我查找并替换内容）",
  "查看运营数据（帮我查看运营数据）",
  "辅助配置消息提醒（帮我配置消息提醒）",
  "辅助配置运营报告（帮我配置运营报告）",
].join("、");

const FALLBACK = {
  board: [
    "这个周期询盘为什么少了？",
    "哪个页面把有效浏览率拉低了？",
    "帮我看看各渠道线索差在哪",
    "这份运营数据里最该先处理哪一件事？",
  ],
  dashboard: [
    "现在哪个智能体有待处理的事？",
    "帮我看一下本月运营概况",
    "有没有该发布还没发布的内容？",
  ],
  visitor: [
    "近 7 天高意向但没跟进的访客有哪些？",
    "访客主要从哪个渠道进来？",
    "停留久但没留询盘的是哪些公司？",
  ],
  marketing: [
    "帮我生成一个智能营销页",
    "现在在投的落地页，哪一张留资少？",
    "按这场活动帮我写一封营销邮件",
  ],
  content: [
    "帮我发布一篇产品内容",
    "帮我修改这个产品详情",
    "帮我创建一周的内容发布计划",
    "站内有没有需要查找替换的旧说法？",
  ],
  knowledge: [
    "知识库里缺了哪类客户常问的资料？",
    "帮我根据现有资料写一篇内容",
    "哪些已发布文档该改一下？",
  ],
  settings: [
    "帮我配置消息提醒的收件人",
    "帮我配置运营报告要发给谁",
    "当前站点的基础信息有没有缺项？",
  ],
  ready: [
    "这次 AI 友好度检测，哪几项还不行？",
    "检测完之后，优先改哪个页面？",
    "帮我看看站点内容 AI 读不读得懂",
  ],
  credits: [
    "当前积分还够做哪些运营动作？",
    "帮我看看最近积分是花在哪了",
  ],
  assistant: [
    "帮我发布一个产品",
    "帮我看看这个月的运营数据",
    "帮我挖掘一批海外客户",
    "帮我生成一封营销邮件",
  ],
  scanning: [
    "这次检测现在到哪一步了？",
    "检测完成后，先看哪一项？",
  ],
  unknown: [
    "帮我看看当前运营数据",
    "帮我发布一篇内容",
    "帮我修改一个产品详情",
    "帮我挖掘一批客户",
  ],
};

function parseQuestions(text) {
  const lines = String(text || "")
    .replace(/```[\s\S]*?```/g, "")
    .split(/\n+/)
    .map((line) => line.replace(/^[\s\-*•\d.、]+/, "").trim())
    .filter((line) => line.length >= 6 && line.length <= 80 && !line.startsWith("当前页面"));
  const unique = [];
  for (const line of lines) {
    if (!unique.includes(line)) unique.push(line);
    if (unique.length === 5) break;
  }
  return unique;
}

export function fallbackQuestions(pageId) {
  return FALLBACK[pageId] || FALLBACK.unknown;
}

/** 只问推荐问 Agent，不把这一轮写进用户会话。 */
export async function suggestPageQuestions(page, signal) {
  const message = [
    `当前页面：${page.name}`,
    `这个页面在做什么：${page.hint}`,
    `可以做的事：${CAPABILITIES}`,
    "请给 3 到 5 个推荐问。",
  ].join("\n");
  let text = "";
  try {
    for await (const event of streamChat({
      message,
      sessionId: "page-suggest-agent",
      clientAction: "suggest_questions",
      signal,
    })) {
      if (event.type === "text" && event.text) text += event.text;
      if (event.type === "error") throw new Error(event.message || "推荐问失败");
    }
  } catch (error) {
    if (signal?.aborted) throw error;
    text = "";
  }
  const parsed = parseQuestions(text);
  if (parsed.length >= 3) return parsed.slice(0, 5);
  return fallbackQuestions(page.id);
}
