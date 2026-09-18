/**
 * 对接 AgentScope 2.0 真实 API 的演示流程
 */

import { chatStream, loadAgentRc } from "./agentscopeClient";
import { buildToolMessage } from "./agentFlowUtils";
import { renderMarkdown } from "./markdownUtils";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function runLiveDemo({ addMsg, setProgress, setPreviewState }) {
  const { agentId, sessionId } = await loadAgentRc();
  const now = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const userText = "帮我发布这个产品，附件是实拍图";

  setProgress(5);
  addMsg({
    type: "user",
    html: userText,
    time: now(),
  });

  setProgress(15);
  addMsg({ type: "typing", id: "live-typing" });

  let aiBuffer = "";

  try {
    for await (const ev of chatStream({
      agentId,
      sessionId,
      text: `${userText}。请按 product-publish Skill 工作流：图像分析、行业规范查询、内容生成，并给出摘要。`,
    })) {
      if (ev.kind === "text") {
        aiBuffer += ev.text;
      }

      if (ev.kind === "tool_call") {
        addMsg(buildToolMessage({ id: ev.id, name: ev.name, title: ev.name }, "running"));
      }

      if (ev.kind === "tool_result") {
        addMsg(buildToolMessage({ id: ev.id, name: ev.name, title: ev.name }, "done"));
        setProgress((p) => Math.min(p + 15, 85));
      }
    }
  } finally {
    addMsg({ type: "_remove_typing", id: "live-typing" });
  }

  setProgress(90);
  if (aiBuffer) {
    addMsg({ type: "ai", html: renderMarkdown(aiBuffer), time: now() });
  } else {
    addMsg({
      type: "ai",
      html: "已完成 Agent 处理，请查看上方步骤概述。",
      time: now(),
    });
  }

  if (setPreviewState) {
    setPreviewState("empty");
  }
  setProgress(100);
}
