import { useEffect } from "react";

/** 页面级确认框 —— 入口冲突由页面问，不由助手聊天问 */
export default function ConfirmModal({ open, title, content, okText = "确定", cancelText = "取消", onOk, onCancel }) {
  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === "Escape") onCancel?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="modal-mask" onClick={onCancel} role="presentation">
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-modal-title" className="modal-title">
          {title}
        </h3>
        <p className="modal-content">{content}</p>
        <div className="modal-actions">
          <button className="btn" type="button" onClick={onCancel}>
            {cancelText}
          </button>
          <button className="btn btn-primary" type="button" onClick={onOk}>
            {okText}
          </button>
        </div>
      </div>
    </div>
  );
}
