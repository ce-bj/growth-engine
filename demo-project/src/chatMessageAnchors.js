/** 聊天区锚定消息 — 摘要卡/草稿卡固定在同一位置更新，避免被 append 到末尾 */

export const BRIEF_MSG_ID = "brief-latest";
export const ARTIFACT_MSG_ID = "artifact-latest";
export const TYPING_MSG_ID = "chat-typing";

export const PREVIEW_PANEL_MIN_PCT = 20;
export const PREVIEW_PANEL_DEFAULT_PCT = 50;

/**
 * 计算新锚定消息的插入点：紧跟本轮最后一条助手侧内容（ai/thinking/tool）之后。
 */
export function computeAnchorInsertIndex(messages) {
  const base = messages.filter((m) => m.id !== TYPING_MSG_ID);
  for (let i = base.length - 1; i >= 0; i--) {
    const t = base[i].type;
    if (t === "ai" || t === "thinking" || t === "tool") {
      return i + 1;
    }
  }
  return base.length;
}

/** 草稿卡应在所有助手内容之后（与 relocateArtifactAfterLastUser 保持一致） */
export function computeArtifactInsertIndex(messages) {
  return computeAnchorInsertIndex(messages);
}

/**
 * 在固定锚点插入或原位更新消息；typing 气泡始终保持在列表末尾。
 */
export function upsertAnchoredMessage(
  prev,
  msgId,
  buildMsg,
  anchorIndexRef,
  { insertAfterMsgId } = {},
) {
  const typing = prev.find((m) => m.id === TYPING_MSG_ID);
  const existingIdx = prev.findIndex((m) => m.id === msgId);

  if (existingIdx >= 0) {
    const next = [...prev];
    next[existingIdx] = { ...next[existingIdx], ...buildMsg() };
    return next;
  }

  const base = prev.filter((m) => m.id !== TYPING_MSG_ID);
  let insertAt = anchorIndexRef.current;

  if (insertAfterMsgId) {
    const afterIdx = base.findIndex((m) => m.id === insertAfterMsgId);
    if (afterIdx >= 0) {
      insertAt = afterIdx + 1;
    }
  }

  if (insertAt == null || insertAt > base.length) {
    insertAt = computeAnchorInsertIndex(prev);
  }
  anchorIndexRef.current = insertAt;

  const next = [...base];
  next.splice(insertAt, 0, buildMsg());
  if (typing) next.push(typing);
  return next;
}

/**
 * 将 brief 卡移动到当前最后一条助手消息之后（澄清完成后摘要应在 AI 回复下方）。
 */
export function relocateBriefCardAfterAssistant(messages, msgId = BRIEF_MSG_ID) {
  const briefMsg = messages.find((m) => m.id === msgId);
  if (!briefMsg) return messages;
  const without = messages.filter((m) => m.id !== msgId && m.id !== TYPING_MSG_ID);
  const insertAt = computeAnchorInsertIndex(without);
  const next = [...without];
  next.splice(insertAt, 0, briefMsg);
  const typing = messages.find((m) => m.id === TYPING_MSG_ID);
  if (typing) next.push(typing);
  return next;
}

/** 草稿卡应在所有助手内容（timeline/思考/文字/工具）之后，而非紧跟用户消息 */
export function relocateArtifactAfterLastUser(messages, msgId = ARTIFACT_MSG_ID) {
  const artifactMsg = messages.find((m) => m.id === msgId);
  if (!artifactMsg) return messages;
  const without = messages.filter((m) => m.id !== msgId && m.id !== TYPING_MSG_ID);
  // 找到最后一条助手侧内容（ai/timeline/tool），草稿卡放在其后
  let insertAt = without.length;
  for (let i = without.length - 1; i >= 0; i -= 1) {
    const t = without[i].type;
    if (t === "ai" || t === "timeline" || t === "tool") {
      insertAt = i + 1;
      break;
    }
  }
  const next = [...without];
  next.splice(insertAt, 0, artifactMsg);
  const typing = messages.find((m) => m.id === TYPING_MSG_ID);
  if (typing) next.push(typing);
  return next;
}

/** 纠正 localStorage 中异常的预览区占比（如预览隐藏时误存的极窄值） */
export function normalizePreviewLayout(layout) {
  const preview = Number(layout?.preview);
  if (!Number.isFinite(preview) || preview < PREVIEW_PANEL_MIN_PCT) {
    return {
      chat: 100 - PREVIEW_PANEL_DEFAULT_PCT,
      preview: PREVIEW_PANEL_DEFAULT_PCT,
    };
  }
  if (preview > 75) {
    return { chat: 25, preview: 75 };
  }
  const chat = Number.isFinite(Number(layout?.chat))
    ? Number(layout.chat)
    : 100 - preview;
  if (Math.abs(chat + preview - 100) > 1) {
    return { chat: 100 - preview, preview };
  }
  return { chat, preview };
}

export function relocateArtifactCardAfterUser(messages, msgId = ARTIFACT_MSG_ID) {
  const artifactMsg = messages.find((m) => m.id === msgId);
  if (!artifactMsg) return messages;
  const without = messages.filter((m) => m.id !== msgId && m.id !== TYPING_MSG_ID);
  const insertAt = computeArtifactInsertIndex(without);
  const next = [...without];
  next.splice(insertAt, 0, artifactMsg);
  const typing = messages.find((m) => m.id === TYPING_MSG_ID);
  if (typing) next.push(typing);
  return next;
}

export function sanitizePreviewLayout(layout) {
  if (!layout || layout.preview == null) {
    return { chat: 100 - PREVIEW_PANEL_DEFAULT_PCT, preview: PREVIEW_PANEL_DEFAULT_PCT };
  }
  const preview = Number(layout.preview);
  if (!Number.isFinite(preview) || preview < PREVIEW_PANEL_MIN_PCT) {
    return {
      chat: 100 - PREVIEW_PANEL_DEFAULT_PCT,
      preview: PREVIEW_PANEL_DEFAULT_PCT,
    };
  }
  if (preview > 75) {
    return { chat: 25, preview: 75 };
  }
  return { chat: 100 - preview, preview };
}

/**
 * 仅防止预览区窄于 1/8 屏；不强制回弹到默认宽度，避免无法拖拽。
 */
export function clampPreviewLayout(layout, previewVisible) {
  if (!previewVisible || !layout || layout.preview == null) {
    return layout;
  }
  const preview = Number(layout.preview);
  if (!Number.isFinite(preview) || preview <= 0) {
    return layout;
  }
  if (preview < PREVIEW_PANEL_MIN_PCT) {
    return {
      chat: 100 - PREVIEW_PANEL_MIN_PCT,
      preview: PREVIEW_PANEL_MIN_PCT,
    };
  }
  return layout;
}
