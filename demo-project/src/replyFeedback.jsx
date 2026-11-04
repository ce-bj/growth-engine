import { useEffect, useState } from "react";
import "./replyFeedback.css";

const TAGS = [
  "有害/不安全",
  "信息虚假",
  "没有帮助",
  "隐私相关",
  "遗忘上下文/失忆",
  "记忆使用不当/错误",
  "其他",
];

function ThumbIcon({ down = false, filled = false }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        transform={down ? "rotate(180 8 8)" : undefined}
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
        d="M6.15 13.7H3.45A1.15 1.15 0 0 1 2.3 12.55V7.45A1.15 1.15 0 0 1 3.45 6.3h2.7V3.35c0-.62.75-.94 1.2-.52l2.15 2.05c.18.17.3.41.3.66V6.3h2.15c.7 0 1.22.64 1.1 1.32l-.55 3.7a1.15 1.15 0 0 1-1.14.98H6.15V6.3"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="5.2" y="4.2" width="8" height="9" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4.8 11.2H3.4A1.2 1.2 0 0 1 2.2 10V3.2A1.2 1.2 0 0 1 3.4 2h6.2a1.2 1.2 0 0 1 1.2 1.2V4" fill="none" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function copyWithGesture(text) {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.top = "0";
  area.style.left = "0";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.focus();
  area.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}

/** 回复气泡下的点赞、点踩、复制。关掉反馈框不会取消点踩。 */
export function ReplyActions({ text, feedback, onFeedback }) {
  const vote = feedback?.vote || null;
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState(feedback?.comment || "");
  const [tags, setTags] = useState(feedback?.tags || []);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (formOpen) return;
    setDraft(feedback?.comment || "");
    setTags(feedback?.tags || []);
  }, [feedback?.comment, feedback?.tags, formOpen]);

  function publish(next) {
    onFeedback?.({
      vote: next.vote ?? null,
      tags: next.tags || [],
      comment: next.comment || "",
    });
  }

  function like() {
    setFormOpen(false);
    publish({
      vote: vote === "up" ? null : "up",
      tags: [],
      comment: "",
    });
  }

  function dislike() {
    if (vote !== "down") {
      publish({ vote: "down", tags: feedback?.tags || tags, comment: feedback?.comment || draft });
    }
    setFormOpen(true);
  }

  function toggleTag(tag) {
    setTags((current) => (
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]
    ));
  }

  function copy() {
    const value = String(text || "").trim();
    if (!value) return;
    const mark = () => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    };
    if (copyWithGesture(value)) {
      mark();
      return;
    }
    navigator.clipboard?.writeText(value).then(mark).catch(() => {});
  }

  return (
    <div className="reply-actions-wrap">
      <div className="reply-actions" role="group" aria-label="回复操作">
        <button
          type="button"
          className={vote === "up" ? "reply-action is-on" : "reply-action"}
          aria-label="点赞"
          aria-pressed={vote === "up"}
          onClick={like}
        >
          <ThumbIcon filled={vote === "up"} />
        </button>
        <button
          type="button"
          className={vote === "down" ? "reply-action is-on" : "reply-action"}
          aria-label="点踩"
          aria-pressed={vote === "down"}
          aria-expanded={formOpen}
          onClick={dislike}
        >
          <ThumbIcon down filled={vote === "down"} />
        </button>
        <button
          type="button"
          className="reply-action"
          aria-label={copied ? "已复制" : "复制"}
          data-copied={copied ? "true" : undefined}
          onClick={copy}
        >
          <CopyIcon />
        </button>
      </div>
      {formOpen ? (
        <div
          className="reply-feedback"
          role="region"
          aria-label="反馈"
          onKeyDown={(event) => {
            if (event.key !== "Escape") return;
            event.stopPropagation();
            event.preventDefault();
            setFormOpen(false);
          }}
        >
          <div className="reply-feedback-line">
            <input
              className="reply-feedback-input"
              autoFocus
              value={draft}
              placeholder="你觉得什么让你不满意?"
              aria-label="你觉得什么让你不满意"
              onChange={(event) => setDraft(event.target.value)}
            />
            <button
              type="button"
              className="reply-feedback-close"
              aria-label="关闭反馈"
              onClick={() => setFormOpen(false)}
            >
              ×
            </button>
          </div>
          <div className="reply-feedback-tags">
            {TAGS.map((tag) => {
              const on = tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  className={on ? "reply-tag is-on" : "reply-tag"}
                  aria-pressed={on}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              );
            })}
            <button
              type="button"
              className="reply-submit"
              onClick={() => {
                publish({ vote: "down", tags, comment: draft.trim() });
                setFormOpen(false);
              }}
            >
              提交
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function withFeedback(previous, next) {
  if (!previous?.feedback) return next;
  return { ...next, feedback: previous.feedback };
}
