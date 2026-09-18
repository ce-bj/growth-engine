const C = {
  border: "rgba(255,255,255,0.08)",
  borderLight: "rgba(255,255,255,0.05)",
  text: "#e2e8f0",
  textDim: "#94a3b8",
  accent: "#e85d04",
  brand: "#3B9FD0",
  warning: "#f59e0b",
  danger: "#f87171",
  cardBg: "rgba(15,23,42,0.6)",
};

function resolveStatus({ draftState, generationMode, coverage }) {
  const mode = generationMode || "";
  const missing = coverage?.missing || [];
  if (mode === "fallback" || draftState === "fallback") {
    return { label: "生成失败 · 占位草稿", tone: C.danger, generating: false };
  }
  if (draftState === "placeholder" || draftState === "streaming" || mode === "placeholder" || mode === "llm_partial") {
    return { label: "生成中…", tone: C.warning, generating: true };
  }
  if (missing.length > 0) {
    return { label: `待完善 ${missing.length} 项`, tone: C.warning, generating: false };
  }
  return { label: "已完成", tone: "#34d399", generating: false };
}

const btnBase = {
  padding: "5px 14px",
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "inherit",
  border: "none",
  transition: "all 0.15s ease",
  whiteSpace: "nowrap",
  lineHeight: 1.4,
};

export function ArtifactCard({
  title,
  industryName,
  coverage,
  draftId,
  draftState,
  generationMode,
  onEdit,
  onPreview,
}) {
  const required = coverage?.required;
  const coverageText = required
    ? `必选模块 ${required.filled ?? 0}/${required.total ?? 0}`
    : "详情页草稿";
  const status = resolveStatus({ draftState, generationMode, coverage });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        maxWidth: "100%",
        padding: "12px 14px",
        borderRadius: 10,
        border: `1px solid ${C.border}`,
        background: C.cardBg,
        textAlign: "left",
        color: C.text,
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          background: "linear-gradient(135deg, #0a1628, #1e3a5f)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          flexShrink: 0,
        }}
        aria-hidden
      >
        📄
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {title || "产品详情页"}
        </div>
        <div style={{ fontSize: 11, color: C.textDim }}>
          {industryName ? `${industryName} · ` : ""}
          {coverageText}
        </div>
      </div>

      {/* Status badge */}
      <span style={{
        fontSize: 11,
        color: status.tone,
        flexShrink: 0,
        marginRight: status.generating ? 0 : 4,
      }}>
        {status.generating && (
          <span style={{
            display: "inline-block",
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: status.tone,
            marginRight: 5,
            animation: "pulse 1.5s ease-in-out infinite",
            verticalAlign: "middle",
          }} />
        )}
        {status.label}
      </span>

      {/* Action buttons — only show when not generating */}
      {!status.generating && (
        <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 4 }}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onPreview?.(); }}
            style={{
              ...btnBase,
              background: "rgba(255,255,255,0.06)",
              color: C.textDim,
              border: `1px solid rgba(255,255,255,0.1)`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
              e.currentTarget.style.color = C.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              e.currentTarget.style.color = C.textDim;
            }}
          >
            去预览
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
            style={{
              ...btnBase,
              background: C.brand,
              color: "#fff",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#2F8BB8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = C.brand;
            }}
          >
            去编辑
          </button>
        </div>
      )}

      {draftId && <span style={{ display: "none" }}>{draftId}</span>}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}
