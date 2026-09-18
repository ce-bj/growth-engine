import { useEffect } from "react";

const maskStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 200,
  background: "rgba(15, 23, 42, 0.45)",
  display: "flex",
  justifyContent: "flex-end",
};

const drawerStyle = {
  width: "min(1080px, 88vw)",
  height: "100%",
  background: "#F5F7FA",
    boxShadow: "-12px 0 40px rgba(15, 23, 42, 0.18)",
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
};

export function SiteInfoDrawer({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div style={maskStyle} onClick={() => onClose?.()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="网站信息"
        style={drawerStyle}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
