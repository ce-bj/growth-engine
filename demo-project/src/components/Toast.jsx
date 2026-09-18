import { useEffect } from "react";

/** 页面级轻提示 */
export default function Toast({ open, text, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const t = window.setTimeout(() => onClose?.(), 2200);
    return () => window.clearTimeout(t);
  }, [open, onClose, text]);

  if (!open) return null;

  return (
    <div className="page-toast" role="status">
      {text}
    </div>
  );
}
