import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "ai-ops-chat-preview-pct";
const DEFAULT_PREVIEW_PCT = 50;

function readStoredPct(fallback = DEFAULT_PREVIEW_PCT) {
  try {
    const value = Number(localStorage.getItem(STORAGE_KEY));
    if (Number.isFinite(value) && value > 0 && value < 100) {
      return value;
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

/**
 * 聊天区 + 右侧预览的简单分栏（原生 flex + 拖拽，无第三方分栏库）。
 * children[0] = 聊天，children[1] = 预览（仅 showPreview 时展示）。
 */
export function ChatPreviewSplit({ showPreview, separatorStyle = {}, children }) {
  const items = Array.isArray(children) ? children : [children];
  const chat = items[0];
  const preview = items[1];

  const containerRef = useRef(null);
  const draggingRef = useRef(false);
  const prevShowRef = useRef(showPreview);
  const [previewPct, setPreviewPct] = useState(() => readStoredPct());

  useEffect(() => {
    const wasShown = prevShowRef.current;
    prevShowRef.current = showPreview;
    if (showPreview && !wasShown) {
      setPreviewPct((pct) => (pct < 15 ? DEFAULT_PREVIEW_PCT : pct));
    }
  }, [showPreview]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(previewPct));
    } catch {
      /* ignore */
    }
  }, [previewPct]);

  const onSeparatorMouseDown = useCallback((e) => {
    e.preventDefault();
    draggingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMove = (ev) => {
      if (!draggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const next = ((rect.right - ev.clientX) / rect.width) * 100;
      if (Number.isFinite(next)) {
        setPreviewPct(next);
      }
    };

    const onUp = () => {
      draggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

  if (!showPreview) {
    return (
      <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex" }}>
        {chat}
      </div>
    );
  }

  const chatPct = 100 - previewPct;

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        display: "flex",
        flexDirection: "row",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          flex: `${chatPct} 1 0%`,
          minWidth: 0,
          minHeight: 0,
          display: "flex",
        }}
      >
        {chat}
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="调整预览区宽度"
        onMouseDown={onSeparatorMouseDown}
        style={{
          width: 6,
          flexShrink: 0,
          cursor: "col-resize",
          ...separatorStyle,
        }}
      />
      <div
        style={{
          flex: `${previewPct} 1 0%`,
          minWidth: 0,
          minHeight: 0,
          display: "flex",
        }}
      >
        {preview}
      </div>
    </div>
  );
}
