import { marked } from "marked";

marked.setOptions({
  gfm: true,
  breaks: true,
});

/** 将 Agent 返回的 Markdown 转为可安全展示的 HTML */
export function renderMarkdown(text) {
  if (!text) return "";
  return marked.parse(String(text), { async: false });
}

/** 用户是否明确要求打开详情页预览 */
export function userWantsPreview(text) {
  return /生成预览|看看预览|打开预览|预览效果|看看效果|查看预览|预览看看/.test(String(text || ""));
}
