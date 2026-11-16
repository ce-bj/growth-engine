import { useCallback, useEffect, useRef, useState } from "react";
import {
  AssistantRuntimeProvider,
  ThreadPrimitive,
  useExternalStoreRuntime,
} from "@assistant-ui/react";
import { streamChat } from "../chatClient";
import { messagesToConversation } from "../conversationContext";
import { buildTimelineStep } from "../agentFlowUtils";
import { renderMarkdown } from "../markdownUtils";
import { filesToImagePayloads, toApiImages } from "../imageUtils";
import { ARTIFACT_MSG_ID } from "../chatMessageAnchors";
import { slimPageDraftForRequest } from "../templates/pageDraftUtils";
import {
  createSessionId,
  createWelcomeMessages,
  getSession,
  loadSessions,
  resolveInitialChatState,
  restoreSessionMessages,
  setActiveSessionId,
  slimDraftHistoryForRequest,
  upsertSession,
} from "../sessionStore";
import { ASSISTANT_COMMANDS as COMMANDS } from "../assistantCommands";
import { ReplyActions, withFeedback } from "../replyFeedback";
import { suggestPageQuestions } from "./pageSuggest";
import "./float.css";

const TYPING_ID = "float-typing";

function clock() {
  const date = new Date();
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function plainText(html) {
  const node = document.createElement("div");
  node.innerHTML = html || "";
  return node.textContent || "";
}

function formatWhen(ts) {
  if (!ts) return "";
  const date = new Date(ts);
  const hm = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return hm;
  return `${date.getMonth() + 1}/${date.getDate()} ${hm}`;
}

function convertMessage(message) {
  const text = message?.rawText || plainText(message?.html) || message?.title || "";
  return {
    id: message?.id || `${message?.type || "msg"}-${message?.time || ""}`,
    role: message?.type === "user" ? "user" : "assistant",
    content: [{ type: "text", text }],
  };
}

function pageContext(page) {
  if (!page?.name || page.id === "unknown") return "";
  return [
    "【当前所在功能页面】",
    `名称：${page.name}`,
    `这个页面在做什么：${page.hint || "用户正在这个页面上工作"}`,
    "这是用户此刻在增长工作台打开的后台功能页，不是浏览器地址，也不是对话历史里提到的产品页。",
    "用户问现在在哪个页面、这个页面能做什么时，按这里回答。",
    "",
    "",
  ].join("\n");
}

function threadKey(list) {
  return (list || [])
    .filter((msg) => msg && msg.type !== "typing" && msg.id !== TYPING_ID)
    .map((msg) => `${msg.id || ""}:${msg.type || ""}:${msg.html || ""}:${msg.rawText || ""}:${msg.status || ""}:${msg.feedback?.vote || ""}:${(msg.feedback?.tags || []).join(",")}:${msg.feedback?.comment || ""}`)
    .join("|");
}

function OpeningSuggestions({ visible, loading, suggestions }) {
  if (!visible) return null;
  return (
    <div className="float-suggests" aria-label="根据当前页面推荐">
      {loading ? <p className="float-suggest-status">正在根据当前页面准备问题…</p> : null}
      {suggestions.map((item) => (
        <ThreadPrimitive.Suggestion key={item.prompt} prompt={item.prompt} send className="float-suggest">
          {item.prompt}
        </ThreadPrimitive.Suggestion>
      ))}
    </div>
  );
}

function FloatRuntime({ sending, messages, suggestions, onSend, onCancel, children }) {
  const onSendRef = useRef(onSend);
  const onCancelRef = useRef(onCancel);
  onSendRef.current = onSend;
  onCancelRef.current = onCancel;
  const onNew = useCallback(async (message) => {
    const part = (message.content || []).find((item) => item.type === "text");
    const text = part?.text?.trim() || "";
    if (!text) return;
    await onSendRef.current(text);
  }, []);
  const runtime = useExternalStoreRuntime({
    isRunning: sending,
    messages,
    convertMessage,
    onNew,
    onCancel: async () => onCancelRef.current?.(),
    suggestions,
  });
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ThreadPrimitive.Root className="float-app">{children}</ThreadPrimitive.Root>
    </AssistantRuntimeProvider>
  );
}

function MessageView({ msg, onFeedback }) {
  if (!msg || msg.type === "thinking" || msg.type === "brief_card") return null;
  if (msg.type === "typing" || msg.id === TYPING_ID) {
    return <div className="float-typing">正在生成…</div>;
  }
  if (msg.type === "user") {
    const text = plainText(msg.html);
    const images = msg.attachments || msg.imageUrls || [];
    const hiddenCount = images.length ? 0 : Number(msg.imageCount) || 0;
    return (
      <div className="float-user">
        {images.map((src) => (
          <img key={src} src={src} alt="" />
        ))}
        {text ? <p>{text}</p> : null}
        {hiddenCount ? <p>附带 {hiddenCount} 张图片</p> : null}
      </div>
    );
  }
  if (msg.type === "timeline") {
    const steps = msg.steps || [];
    if (!steps.length) return null;
    return (
      <div className="float-steps">
        {steps.map((step) => (
          <div key={step._id || step.title}>
            {step.status === "running" ? "进行中" : "完成"} · {step.title || step.summary || "处理中"}
          </div>
        ))}
      </div>
    );
  }
  if (msg.type === "tool") {
    return (
      <div className="float-steps">
        {msg.status === "running" ? "进行中" : "完成"} · {msg.title || msg.name || "工具"}
      </div>
    );
  }
  if (msg.type === "artifact") {
    return <div className="float-note">已生成{msg.title || "详情页草稿"}。在 AI运营助手页面可以预览。</div>;
  }
  if (msg.html) {
    return (
      <div className="float-reply">
        <article className="float-ai chat-markdown" dangerouslySetInnerHTML={{ __html: msg.html }} />
        <ReplyActions
          text={msg.rawText || plainText(msg.html)}
          feedback={msg.feedback}
          onFeedback={onFeedback}
        />
      </div>
    );
  }
  return null;
}

export default function FloatAssistant() {
  const bootRef = useRef(null);
  if (bootRef.current === null) bootRef.current = resolveInitialChatState();
  const boot = bootRef.current;

  const [sessionId, setSessionId] = useState(boot.sessionId);
  const [sessions, setSessions] = useState(boot.sessions);
  const [messages, setMessages] = useState(boot.messages);
  const [draft, setDraft] = useState("");
  const [pendingImages, setPendingImages] = useState([]);
  const [sending, setSending] = useState(false);
  const [menu, setMenu] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [page, setPage] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [suggesting, setSuggesting] = useState(false);

  const sessionIdRef = useRef(boot.sessionId);
  const messagesRef = useRef(boot.messages);
  const pageDraftRef = useRef(boot.pageDraft || null);
  const pageRef = useRef(null);
  const draftHistoryRef = useRef(boot.draftHistory || []);
  const sendingRef = useRef(false);
  const abortRef = useRef(null);
  const streamRef = useRef(null);
  const inputRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const streamContentKey = messages
    .filter((msg) => msg && msg.type !== "typing" && msg.id !== TYPING_ID)
    .map((msg) => `${msg.id || ""}:${msg.type || ""}:${msg.html || ""}:${msg.status || ""}`)
    .join("|");
  useEffect(() => {
    const el = streamRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [streamContentKey, sending]);

  useEffect(() => {
    function onStorage(event) {
      if (event.key !== "ai-ops-chat-sessions-v1") return;
      const nextSessions = loadSessions();
      setSessions(nextSessions);
      if (sendingRef.current) return;
      const currentId = sessionIdRef.current;
      const session = nextSessions.find((item) => item.id === currentId);
      if (!session) return;
      const restored = restoreSessionMessages(currentId, session.messages);
      if (threadKey(restored) === threadKey(messagesRef.current)) return;
      messagesRef.current = restored;
      setMessages(restored);
      pageDraftRef.current = session.pageDraft || null;
      draftHistoryRef.current = session.draftHistory || [];
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!menu) return undefined;
    function onPointer(event) {
      if (!event.target.closest("[data-menu]")) setMenu(null);
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [menu]);

  useEffect(() => {
    function onPage(event) {
      if (event.source !== window.parent) return;
      const next = event.data?.page;
      if (event.data?.type !== "growth-assistant-page" || !next?.name) return;
      const incoming = {
        id: next.id || "unknown",
        name: next.name,
        hint: next.hint || "用户正在这个页面上工作",
      };
      setPage((current) => {
        if (current && current.id === incoming.id && current.name === incoming.name && current.hint === incoming.hint) {
          pageRef.current = current;
          return current;
        }
        pageRef.current = incoming;
        return incoming;
      });
    }
    window.addEventListener("message", onPage);
    window.parent.postMessage({ type: "growth-assistant-ready" }, "*");
    const timer = window.setTimeout(() => {
      setPage((current) => {
        if (current) {
          pageRef.current = current;
          return current;
        }
        const fallback = {
          id: "unknown",
          name: "当前页面",
          hint: "用户在后台里，还没说明具体页面",
        };
        pageRef.current = fallback;
        return fallback;
      });
    }, 600);
    return () => {
      window.removeEventListener("message", onPage);
      window.clearTimeout(timer);
    };
  }, []);

  const freshThread = !messages.some((msg) => msg.type === "user");

  useEffect(() => {
    if (!page || !freshThread) return undefined;
    const controller = new AbortController();
    let gone = false;
    setSuggesting(true);
    setSuggestions([]);
    suggestPageQuestions(page, controller.signal)
      .then((list) => {
        if (!gone) {
          setSuggestions(list.map((prompt) => ({ prompt, title: prompt })));
        }
      })
      .catch(() => {
        if (!gone) setSuggestions([]);
      })
      .finally(() => {
        if (!gone) setSuggesting(false);
      });
    return () => {
      gone = true;
      controller.abort();
    };
  }, [page, freshThread, sessionId]);

  useEffect(() => {
    function onKey(event) {
      if (event.key !== "Escape") return;
      if (event.target?.closest?.(".reply-feedback")) return;
      if (menu) {
        setMenu(null);
        return;
      }
      window.parent.postMessage({ type: "growth-close-assistant" }, "*");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  function setThread(updater) {
    const next = typeof updater === "function" ? updater(messagesRef.current) : updater;
    messagesRef.current = next;
    setMessages(next);
  }

  function persist(nextMessages) {
    const id = sessionIdRef.current;
    upsertSession(id, nextMessages, pageDraftRef.current, draftHistoryRef.current, null, {
      kind: getSession(id)?.kind || "history",
    });
    setActiveSessionId(id);
    setSessions(loadSessions());
  }

  function openSession(id) {
    if (sendingRef.current) return;
    const session = getSession(id);
    if (!session) return;
    const restored = restoreSessionMessages(id, session.messages);
    sessionIdRef.current = id;
    messagesRef.current = restored;
    pageDraftRef.current = session.pageDraft || null;
    draftHistoryRef.current = session.draftHistory || [];
    setSessionId(id);
    setMessages(restored);
    setActiveSessionId(id);
    setMenu(null);
  }

  function startNew() {
    if (sendingRef.current) return;
    const id = createSessionId();
    const welcome = createWelcomeMessages();
    sessionIdRef.current = id;
    messagesRef.current = welcome;
    pageDraftRef.current = null;
    draftHistoryRef.current = [];
    setSessionId(id);
    setMessages(welcome);
    setActiveSessionId(id);
    setMenu(null);
    inputRef.current?.focus();
  }

  function upsertTimeline(step) {
    if (!step) return;
    setThread((prev) => {
      const withoutTyping = prev.filter((msg) => msg.id !== TYPING_ID);
      const idx = withoutTyping.findIndex((msg) => msg.type === "timeline" && msg.status !== "done");
      if (idx >= 0) {
        const next = [...withoutTyping];
        const existing = next[idx];
        const steps = [...(existing.steps || [])];
        const stepIdx = steps.findIndex((item) => item._id === step._id);
        if (stepIdx >= 0) {
          const merged = { ...steps[stepIdx], ...step };
          if (step.detail && steps[stepIdx].detail && step.detail.length < steps[stepIdx].detail.length) {
            merged.detail = steps[stepIdx].detail;
          }
          steps[stepIdx] = merged;
        } else {
          steps.push(step);
        }
        const allDone = steps.every((item) => item.status === "done");
        next[idx] = { ...existing, steps, status: allDone ? "done" : "running" };
        return next;
      }
      return [
        ...withoutTyping,
        {
          type: "timeline",
          id: `turn-timeline-${Date.now()}`,
          status: "running",
          steps: [step],
          startedAt: Date.now(),
        },
      ];
    });
  }

  async function send(textOverride) {
    const text = String(textOverride ?? draft).trim();
    const images = pendingImages;
    if ((!text && images.length === 0) || sendingRef.current) return;

    const conversation = messagesToConversation(messagesRef.current);
    const userMsg = {
      type: "user",
      id: `user-send-${Date.now()}`,
      html: escapeHtml(text || "（上传了产品图片）"),
      time: clock(),
      attachments: images.length ? images.map((img) => img.preview) : undefined,
      imageUrls: images.length ? images.map((img) => img.preview) : undefined,
    };
    setDraft("");
    setPendingImages([]);
    setUploadError("");
    setMenu(null);
    sendingRef.current = true;
    setSending(true);
    setThread((prev) => [...prev, userMsg, { type: "typing", id: TYPING_ID }]);

    const abortController = new AbortController();
    abortRef.current = abortController;
    const textBuffers = new Map();
    const thinkingBuffers = new Map();
    let sawContent = false;
    let activeTextId = null;

    const upsertText = (id, chunk) => {
      const next = `${textBuffers.get(id) || ""}${chunk}`;
      textBuffers.set(id, next);
      setThread((prev) => {
        const previous = prev.find((msg) => msg.id === id);
        const withoutTyping = prev.filter((msg) => msg.id !== TYPING_ID && msg.id !== id);
        return [
          ...withoutTyping,
          withFeedback(previous, {
            type: "ai",
            id,
            html: renderMarkdown(next),
            rawText: next,
            time: clock(),
          }),
        ];
      });
    };

    try {
      for await (const event of streamChat({
        message: `${pageContext(pageRef.current)}${text || "请分析附件产品图，并给出详情页发布建议。"}`,
        conversation,
        images: toApiImages(images),
        sessionId: sessionIdRef.current,
        pageDraft: slimPageDraftForRequest(pageDraftRef.current),
        draftHistory: slimDraftHistoryForRequest(draftHistoryRef.current),
        signal: abortController.signal,
      })) {
        if (event.type === "text" && event.text) {
          sawContent = true;
          const id = event.id || activeTextId || `ai-${Date.now()}`;
          activeTextId = id;
          upsertText(id, event.text);
        }
        if (event.type === "text_start") {
          activeTextId = event.id || `ai-${Date.now()}`;
          textBuffers.set(activeTextId, "");
          setThread((prev) => prev.filter((msg) => msg.id !== TYPING_ID));
        }
        if (event.type === "text_end" || event.type === "text_segment_break") {
          activeTextId = null;
        }
        if (event.type === "thinking_start") {
          sawContent = true;
          const id = event.id || "thinking-main";
          thinkingBuffers.set(id, "");
          upsertTimeline(buildTimelineStep({ ...event, id }, "thinking", "start"));
        }
        if (event.type === "thinking_delta" && event.text) {
          sawContent = true;
          const id = event.id || "thinking-main";
          const detail = `${thinkingBuffers.get(id) || ""}${event.text}`;
          thinkingBuffers.set(id, detail);
          upsertTimeline(buildTimelineStep({ id, text: detail }, "thinking", "delta"));
        }
        if (event.type === "thinking_end") {
          const id = event.id || "thinking-main";
          const content = event.content || thinkingBuffers.get(id) || "";
          upsertTimeline(buildTimelineStep({ id, content, title: event.title }, "thinking", "end"));
        }
        if (event.type === "tool_call" && event.name !== "delegate_metrics_agent") {
          sawContent = true;
          activeTextId = null;
          upsertTimeline(buildTimelineStep(event, "tool", "call"));
        }
        if (event.type === "tool_progress") {
          sawContent = true;
          upsertTimeline(buildTimelineStep(event, "tool", "progress"));
        }
        if (event.type === "tool_result" && event.name !== "delegate_metrics_agent") {
          sawContent = true;
          upsertTimeline(buildTimelineStep(event, "tool", "result"));
        }
        if (event.type === "ping" && event.stage) {
          const labels = {
            connected: "正在连接",
            image_analysis: "正在分析图片",
            agent_working: "正在处理",
          };
          upsertTimeline({
            _id: `step-ping-${event.stage}`,
            kind: "status",
            title: labels[event.stage] || "处理中",
            summary: labels[event.stage] || "处理中",
            status: "running",
            startedAt: Date.now(),
          });
        }
        if (event.type === "draft_history" && event.history?.length) {
          draftHistoryRef.current = event.history;
        }
        if (event.type === "page_draft" && event.draft) {
          sawContent = true;
          pageDraftRef.current = event.draft;
          setThread((prev) => {
            const withoutTyping = prev.filter((msg) => msg.id !== TYPING_ID);
            const artifact = {
              type: "artifact",
              id: ARTIFACT_MSG_ID,
              draftId: event.draft.draftId,
              title: event.draft.draftTitle || event.title || "产品详情页草稿",
              industryName: event.draft.industryName,
              time: clock(),
            };
            const idx = withoutTyping.findIndex((msg) => msg.id === ARTIFACT_MSG_ID);
            if (idx >= 0) {
              const next = [...withoutTyping];
              next[idx] = { ...next[idx], ...artifact };
              return next;
            }
            return [...withoutTyping, artifact];
          });
        }
        if (event.type === "error") {
          throw new Error(event.message || "助手返回错误");
        }
        if (event.type === "done") {
          setThread((prev) => prev.map((msg) => {
            if (msg.type !== "timeline" || msg.status === "done") return msg;
            return {
              ...msg,
              status: "done",
              steps: (msg.steps || []).map((step) => (
                step.status === "running" ? { ...step, status: "done", endedAt: Date.now() } : step
              )),
            };
          }));
        }
      }
      setThread((prev) => prev.filter((msg) => msg.id !== TYPING_ID));
      if (!sawContent) {
        setThread((prev) => [
          ...prev.filter((msg) => msg.id !== TYPING_ID),
          {
            type: "ai",
            id: `ai-empty-${Date.now()}`,
            html: "这一轮没有收到回复。可以再发一次，或换一条指令。",
            time: clock(),
          },
        ]);
      }
    } catch (error) {
      const aborted = error?.name === "AbortError" || abortController.signal.aborted;
      const message = aborted
        ? "已停止生成。可以修改后再发送。"
        : `没有连上助手：${escapeHtml(error instanceof Error ? error.message : String(error))}`;
      setThread((prev) => [
        ...prev.filter((msg) => msg.id !== TYPING_ID),
        { type: "ai", id: `ai-err-${Date.now()}`, html: message, time: clock() },
      ]);
    } finally {
      abortRef.current = null;
      sendingRef.current = false;
      setSending(false);
      const clean = messagesRef.current.filter((msg) => msg.id !== TYPING_ID && msg.type !== "typing");
      messagesRef.current = clean;
      setMessages(clean);
      persist(clean);
    }
  }

  async function onFiles(event) {
    const files = event.target.files;
    event.target.value = "";
    if (!files?.length) return;
    try {
      const next = await filesToImagePayloads(files, pendingImages.length);
      setPendingImages((prev) => [...prev, ...next]);
      setUploadError("");
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "附件没有加上");
    }
  }

  const current = sessions.find((item) => item.id === sessionId);
  const sessionLabel = current?.title || "新会话";

  return (
    <FloatRuntime
      sending={sending}
      messages={messages}
      suggestions={suggestions}
      onSend={send}
      onCancel={() => abortRef.current?.abort()}
    >
      <header className="float-bar">
        <div className="float-title">
          <strong>AI运营助手</strong>
          <small>{sessionLabel}</small>
        </div>
        <div className="float-menu" data-menu="session">
          <button
            type="button"
            className="float-textbtn"
            aria-expanded={menu === "session"}
            aria-haspopup="listbox"
            onClick={() => setMenu((value) => (value === "session" ? null : "session"))}
          >
            会话
          </button>
          {menu === "session" ? (
            <div className="float-pop is-session" role="listbox" aria-label="选择会话">
              <button type="button" className="float-item" onClick={startNew}>
                <span>新会话</span>
                <small>从这里开始</small>
              </button>
              {sessions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`float-item${item.id === sessionId ? " is-on" : ""}`}
                  role="option"
                  aria-selected={item.id === sessionId}
                  onClick={() => openSession(item.id)}
                >
                  <span>{item.title || "新对话"}</span>
                  <small>
                    {item.kind === "scheduled" ? "定时 · " : ""}
                    {formatWhen(item.updatedAt)}
                  </small>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          className="float-iconbtn"
          aria-label="关闭运营助手"
          onClick={() => window.parent.postMessage({ type: "growth-close-assistant" }, "*")}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <div className="float-stream" ref={streamRef}>
        {messages.map((msg, index) => (
          <MessageView
            key={msg.id || `${msg.type}-${index}-${msg.time}`}
            msg={msg}
            onFeedback={(feedback) => {
              const next = messagesRef.current.map((item, itemIndex) => {
                const hit = msg.id ? item.id === msg.id : itemIndex === index;
                return hit ? { ...item, feedback } : item;
              });
              setThread(next);
              persist(next);
            }}
          />
        ))}
        <OpeningSuggestions visible={freshThread} loading={suggesting} suggestions={suggestions} />
      </div>

      <form
        className="float-composer"
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <div className="float-menu" data-menu="command">
          <button
            type="button"
            className="float-textbtn"
            aria-expanded={menu === "command"}
            aria-haspopup="listbox"
            onClick={() => setMenu((value) => (value === "command" ? null : "command"))}
          >
            指令
          </button>
          {menu === "command" ? (
            <div className="float-pop is-command" role="listbox" aria-label="选择指令">
              {COMMANDS.map(([name, prompt]) => (
                <button
                  key={name}
                  type="button"
                  className="float-item"
                  role="option"
                  onClick={() => {
                    setDraft(prompt);
                    setMenu(null);
                    inputRef.current?.focus();
                  }}
                >
                  <span>{name}</span>
                  <small>{prompt}</small>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {pendingImages.length ? (
          <div className="float-thumbs">
            {pendingImages.map((img) => (
              <button
                key={img.id}
                type="button"
                aria-label={`移除 ${img.name || "图片"}`}
                onClick={() => setPendingImages((prev) => prev.filter((item) => item.id !== img.id))}
              >
                <img src={img.preview} alt="" />
              </button>
            ))}
          </div>
        ) : null}
        {uploadError ? <p className="float-error">{uploadError}</p> : null}

        <div className="float-inputrow">
          <textarea
            ref={inputRef}
            rows={2}
            value={draft}
            aria-label="输入问题"
            placeholder="输入问题，或从指令里选一项"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
          />
          <div className="float-side">
            <button
              type="button"
              className="float-iconbtn"
              aria-label="上传附件"
              onClick={() => fileRef.current?.click()}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M8 3.2v6.2M5.4 5.6 8 3l2.6 2.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3.2 10.2V12a1 1 0 0 0 1 1h7.6a1 1 0 0 0 1-1v-1.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            {sending ? (
              <button type="button" className="float-stop" onClick={() => abortRef.current?.abort()}>
                停止
              </button>
            ) : (
              <button type="submit" className="float-send" disabled={!draft.trim() && pendingImages.length === 0}>
                发送
              </button>
            )}
          </div>
        </div>
        <input
          ref={fileRef}
          className="float-file"
          type="file"
          accept="image/*"
          multiple
          aria-label="选择图片附件"
          onChange={onFiles}
        />
      </form>
    </FloatRuntime>
  );
}
