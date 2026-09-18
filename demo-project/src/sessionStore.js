const STORAGE_KEY = "ai-ops-chat-sessions-v1";
const ACTIVE_SESSION_KEY = "ai-ops-chat-active-session-v1";
const SESSION_IMAGES_PREFIX = "ai-ops-session-images-v1:";
const MAX_DRAFT_HISTORY = 12;

const WELCOME_MESSAGE = {
  type: "ai",
  html: "你好，我是 AI 运营助手。你可以上传产品实拍图并描述需求，我会识图、查行业规范并生成详情页内容。",
  time: formatTime(new Date()),
};

function formatTime(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { sessions: [] };
  } catch {
    return { sessions: [] };
  }
}

function sessionImagesKey(sessionId) {
  return `${SESSION_IMAGES_PREFIX}${sessionId}`;
}

function loadSessionImagePack(sessionId) {
  if (!sessionId) return { v: 2, urls: [], byMessageId: {} };
  try {
    const raw = sessionStorage.getItem(sessionImagesKey(sessionId));
    if (!raw) return { v: 2, urls: [], byMessageId: {} };
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return { v: 1, urls: parsed.filter(Boolean), byMessageId: {} };
    }
    if (parsed && Array.isArray(parsed.urls)) {
      return {
        v: parsed.v || 2,
        urls: parsed.urls.filter(Boolean),
        byMessageId: parsed.byMessageId && typeof parsed.byMessageId === "object"
          ? parsed.byMessageId
          : {},
      };
    }
  } catch {
    // ignore
  }
  return { v: 2, urls: [], byMessageId: {} };
}

function buildSessionImagePack(messages) {
  const urls = [];
  const urlIndex = new Map();
  const byMessageId = {};

  const indexOf = (u) => {
    if (urlIndex.has(u)) return urlIndex.get(u);
    const idx = urls.length;
    urls.push(u);
    urlIndex.set(u, idx);
    return idx;
  };

  for (const msg of messages || []) {
    if (msg.type !== "user") continue;
    const imgs = msg.attachments || msg.imageUrls;
    if (!Array.isArray(imgs) || !imgs.length) continue;
    const indices = [];
    for (const url of imgs) {
      const u = String(url || "").trim();
      if (!u) continue;
      indices.push(indexOf(u));
    }
    if (indices.length && msg.id) {
      byMessageId[msg.id] = indices;
    }
  }

  return { v: 2, urls, byMessageId };
}

function saveSessionImagePack(sessionId, pack) {
  if (!sessionId) return;
  const key = sessionImagesKey(sessionId);
  const urls = pack?.urls?.filter(Boolean) || [];
  try {
    if (!urls.length) {
      sessionStorage.removeItem(key);
      return;
    }
    sessionStorage.setItem(key, JSON.stringify({
      v: 2,
      urls,
      byMessageId: pack?.byMessageId || {},
    }));
  } catch {
    // sessionStorage 配额不足时忽略，同会话内 messages 仍可能带图
  }
}

/** 从消息列表按发送顺序提取用户上传图 URL。 */
function extractImageUrlsFromMessages(messages) {
  return buildSessionImagePack(messages).urls;
}

/** 恢复会话消息时，把 sessionStorage 中的图片重新挂回用户气泡。 */
export function hydrateMessagesWithSessionImages(messages, sessionId) {
  if (!Array.isArray(messages) || !sessionId) return messages;
  const pack = loadSessionImagePack(sessionId);
  if (!pack.urls.length) return messages;

  const resolveIndices = (indices) => (
    (indices || [])
      .map((i) => pack.urls[Number(i)])
      .filter(Boolean)
  );

  let legacyBound = false;
  let cursor = 0;

  return messages.map((msg) => {
    if (msg.type !== "user") return msg;
    if (msg.attachments?.length || msg.imageUrls?.length) return msg;

    let attachments = resolveIndices(pack.byMessageId[msg.id]);
    if (!attachments.length && msg.imageCount > 0) {
      attachments = pack.urls.slice(cursor, cursor + msg.imageCount).filter(Boolean);
      cursor += msg.imageCount;
    }
    if (!attachments.length && !Object.keys(pack.byMessageId).length && !legacyBound) {
      attachments = [...pack.urls];
      legacyBound = true;
    }
    if (!attachments.length) return msg;
    return { ...msg, attachments, imageUrls: [...attachments] };
  });
}

/** 读取本会话已上传图（sessionStorage，刷新后仍可解析 Hero / imageRef）。 */
export function getSessionImages(sessionId) {
  return loadSessionImagePack(sessionId).urls;
}

function clearSessionImages(sessionId) {
  if (!sessionId) return;
  try {
    sessionStorage.removeItem(sessionImagesKey(sessionId));
  } catch {
    // ignore
  }
}

/** 持久化时去掉图片 Data URL，避免撑爆 localStorage 配额。 */
function messagesForStorage(messages) {
  return messages.map(({ attachments, imageUrls, ...rest }) => ({
    ...rest,
    ...((attachments?.length || imageUrls?.length)
      ? { imageCount: (attachments || imageUrls).length }
      : {}),
  }));
}

function writeStore(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return;
  } catch {
    if (data.sessions.length <= 1) return;
    try {
      const trimmed = { ...data, sessions: data.sessions.slice(0, Math.ceil(data.sessions.length / 2)) };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // 配额仍不足时放弃写入，避免阻塞聊天
    }
  }
}

export function createSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function deriveSessionTitle(messages) {
  const userMsg = messages.find((m) => m.type === "user" && m.html);
  if (!userMsg) return "新对话";
  const plain = String(userMsg.html).replace(/<[^>]+>/g, "").trim();
  if (!plain) return "图片消息";
  return plain.length > 18 ? `${plain.slice(0, 18)}…` : plain;
}

/** 仅有欢迎语时不写入会话列表，避免刷新产生空「新对话」。定时任务会话只要有消息就保留。 */
export function shouldPersistSession(messages, kind) {
  if (!Array.isArray(messages) || messages.length === 0) return false;
  if (kind === "scheduled") return true;
  return messages.some((m) => m.type === "user");
}

/** 恢复会话消息：清理中间态 + 补回用户上传图。 */
export function restoreSessionMessages(sessionId, rawMessages) {
  const base = rawMessages?.length
    ? sanitizeMessagesForRestore(rawMessages)
    : createWelcomeMessages();
  return hydrateMessagesWithSessionImages(base, sessionId);
}

/** 恢复会话时：1) 丢弃旧 thinking / 澄清卡消息；2) running → done。 */
function sanitizeMessagesForRestore(messages) {
  if (!Array.isArray(messages)) return messages;
  return messages
    .filter((msg) => msg.type !== "thinking" && msg.type !== "brief_card")
    .map((msg) => {
      if (msg.type === "timeline" && msg.status === "running") {
        const steps = (msg.steps || []).map((s) =>
          s.status === "running" ? { ...s, status: "done" } : s,
        );
        return { ...msg, status: "done", steps };
      }
      if (msg.type === "tool" && msg.status === "running") {
        return { ...msg, status: "done" };
      }
      return msg;
    });
}

export function getActiveSessionId() {
  try {
    return localStorage.getItem(ACTIVE_SESSION_KEY) || "";
  } catch {
    return "";
  }
}

export function setActiveSessionId(sessionId) {
  if (!sessionId) {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
    return;
  }
  localStorage.setItem(ACTIVE_SESSION_KEY, sessionId);
}

export function loadSessions() {
  return readStore().sessions.sort((a, b) => {
    const aKey = a.kind === "scheduled" ? (a.createdAt || a.updatedAt) : a.updatedAt;
    const bKey = b.kind === "scheduled" ? (b.createdAt || b.updatedAt) : b.updatedAt;
    return (bKey || 0) - (aKey || 0);
  });
}

export function getSession(sessionId) {
  return loadSessions().find((s) => s.id === sessionId) || null;
}

export function upsertSession(sessionId, messages, pageDraft, draftHistory, generationBrief, extras = {}) {
  const store = readStore();
  const existingIndex = store.sessions.findIndex((s) => s.id === sessionId);
  const existing = existingIndex >= 0 ? store.sessions[existingIndex] : null;
  const kind = extras.kind || existing?.kind || "history";
  if (!shouldPersistSession(messages, kind)) return null;

  const now = Date.now();
  const title = extras.title
    || (kind === "scheduled" ? existing?.title : null)
    || deriveSessionTitle(messages);
  const triggerType = extras.triggerType || existing?.triggerType;
  const runId = extras.runId || existing?.runId;

  const imagePack = buildSessionImagePack(messages);
  if (imagePack.urls.length) {
    saveSessionImagePack(sessionId, imagePack);
  }

  const storedMessages = messagesForStorage(messages);
  const messagesChanged = !existing
    || JSON.stringify(existing.messages || []) !== JSON.stringify(storedMessages);
  const nextPageDraft = pageDraft !== undefined ? pageDraft : existing?.pageDraft;
  const draftChanged = pageDraft !== undefined
    && JSON.stringify(existing?.pageDraft || null) !== JSON.stringify(pageDraft || null);
  const nextDraftHistory = draftHistory !== undefined ? draftHistory : existing?.draftHistory;
  const historyChanged = draftHistory !== undefined
    && JSON.stringify(existing?.draftHistory || []) !== JSON.stringify(draftHistory || []);
  const bumpUpdatedAt = !existing || messagesChanged || draftChanged || historyChanged;

  const next = {
    id: sessionId,
    title,
    kind,
    ...(extras.automationTaskId || existing?.automationTaskId
      ? { automationTaskId: extras.automationTaskId || existing.automationTaskId }
      : {}),
    ...(triggerType ? { triggerType } : {}),
    ...(runId ? { runId } : {}),
    unread: extras.unread !== undefined ? Boolean(extras.unread) : Boolean(existing?.unread),
    updatedAt: bumpUpdatedAt ? now : (existing?.updatedAt ?? now),
    createdAt: existing?.createdAt ?? now,
    messages: storedMessages,
    ...(nextPageDraft ? { pageDraft: nextPageDraft } : {}),
    ...(nextDraftHistory ? { draftHistory: nextDraftHistory } : {}),
    ...(generationBrief
      ? { generationBrief }
      : generationBrief === null
        ? {}
        : existing?.generationBrief
          ? { generationBrief: existing.generationBrief }
          : {}),
  };

  if (existingIndex >= 0) {
    store.sessions[existingIndex] = next;
  } else {
    store.sessions.unshift(next);
  }

  store.sessions = store.sessions.slice(0, 30);
  writeStore(store);
  return next;
}

function draftFingerprint(draft) {
  try {
    return JSON.stringify(draft?.slots || {});
  } catch {
    return "";
  }
}

/** 成功写入 pageDraft 前压入版本栈（与 Bridge 侧版本栈对齐）。 */
export function pushDraftHistory(history, draft, meta = {}) {
  if (!draft?.slots) return history || [];
  const prev = Array.isArray(history) ? history : [];
  const fp = draftFingerprint(draft);
  const last = prev[prev.length - 1];
  if (last && draftFingerprint(last.draft) === fp) {
    return prev;
  }
  const entry = {
    version: prev.length + 1,
    label: meta.label || meta.generationMode || "更新",
    source: meta.source || "agent",
    at: Date.now(),
    draft: JSON.parse(JSON.stringify(draft)),
  };
  const next = [...prev, entry].slice(-MAX_DRAFT_HISTORY);
  return next.map((item, idx) => ({ ...item, version: idx + 1 }));
}

export function slimDraftHistoryForRequest(history) {
  return (history || []).slice(-10).map(({ version, label, source, at, draft }) => ({
    version,
    label,
    source,
    at,
    draft,
  }));
}

export function deleteSession(sessionId) {
  const store = readStore();
  store.sessions = store.sessions.filter((s) => s.id !== sessionId);
  writeStore(store);
  clearSessionImages(sessionId);
  if (getActiveSessionId() === sessionId) {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  }
}

export function createWelcomeMessages() {
  return [{ ...WELCOME_MESSAGE, time: formatTime(new Date()) }];
}

export function seedScheduledSession({ prompt, title, planId, triggerType = "scheduled" }) {
  const id = createSessionId();
  const time = formatTime(new Date());
  const safeTitle = title || "获客计划";
  const messages = [
    {
      type: "ai",
      html: `已开启「${safeTitle}」。到点后会先向外贸客户洞察提交查询，名单通常要几分钟才返回；返回后自动写好开发信，是否群发仍需你确认。`,
      time,
    },
    {
      type: "user",
      html: prompt,
      time,
    },
  ];
  upsertSession(id, messages, null, [], null, {
    kind: "scheduled",
    automationTaskId: planId,
    triggerType,
    title: safeTitle,
  });
  return id;
}

export function createScheduledRunSession({ title, messages, planId, triggerType, runId }) {
  const id = createSessionId();
  upsertSession(id, messages, null, [], null, {
    kind: "scheduled",
    automationTaskId: planId,
    triggerType,
    runId,
    title,
    unread: false,
  });
  return getSession(id);
}

export function patchSession(sessionId, patch) {
  if (!sessionId || !patch) return getSession(sessionId);
  const store = readStore();
  const idx = store.sessions.findIndex((s) => s.id === sessionId);
  if (idx < 0) return null;
  store.sessions[idx] = { ...store.sessions[idx], ...patch };
  writeStore(store);
  return store.sessions[idx];
}

export function markSessionRead(sessionId) {
  return patchSession(sessionId, { unread: false });
}

export function scheduledSessionBadge(session, run) {
  const status = String(run?.status || "");
  const failed = ["failed", "timeout", "error"].includes(status);
  const awaitingConfirm = status === "awaiting_confirm"
    || (Array.isArray(session?.messages)
      && session.messages.some((m) => m.type === "lead_gen_result" && (m.actionState || "pending") === "pending"));
  const unread = Boolean(session?.unread);
  return {
    failed,
    showDot: unread || awaitingConfirm,
  };
}

export function pruneEmptySessions() {
  const store = readStore();
  const kept = store.sessions.filter((s) => shouldPersistSession(s.messages, s.kind));
  if (kept.length === store.sessions.length) return loadSessions();
  store.sessions = kept;
  writeStore(store);
  const activeId = getActiveSessionId();
  if (activeId && !kept.some((s) => s.id === activeId)) {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  }
  return loadSessions();
}

/** 应用启动时恢复上次会话，避免刷新新建空对话。 */
export function resolveInitialChatState() {
  const sessions = pruneEmptySessions();
  const activeId = getActiveSessionId();
  const activeSession = activeId ? getSession(activeId) : null;

  if (activeSession) {
    return {
      sessionId: activeSession.id,
      kind: activeSession.kind === "scheduled" ? "scheduled" : "history",
      messages: restoreSessionMessages(activeSession.id, activeSession.messages),
      pageDraft: activeSession.pageDraft || null,
      draftHistory: activeSession.draftHistory || [],
      generationBrief: null,
      sessionImages: getSessionImages(activeSession.id),
      sessions,
    };
  }

  if (sessions.length > 0) {
    const latest = sessions[0];
    setActiveSessionId(latest.id);
    return {
      sessionId: latest.id,
      kind: latest.kind === "scheduled" ? "scheduled" : "history",
      messages: restoreSessionMessages(latest.id, latest.messages),
      pageDraft: latest.pageDraft || null,
      draftHistory: latest.draftHistory || [],
      generationBrief: null,
      sessionImages: getSessionImages(latest.id),
      sessions,
    };
  }

  return {
    sessionId: createSessionId(),
    kind: "history",
    messages: createWelcomeMessages(),
    pageDraft: null,
    draftHistory: [],
    generationBrief: null,
    sessionImages: [],
    sessions,
  };
}
