const C = {
  border: "rgba(255,255,255,0.12)",
  borderLight: "rgba(255,255,255,0.06)",
  text: "#e2e8f0",
  textSec: "#94a3b8",
  textDim: "#64748b",
  brand: "#e85d04",
  success: "#22c55e",
  warning: "#f59e0b",
  cardBg: "rgba(15,23,42,0.88)",
};

const cardStyle = {
  width: "100%",
  borderRadius: 14,
  border: `1px solid ${C.border}`,
  background: C.cardBg,
  overflow: "hidden",
  fontSize: 13,
  color: C.text,
  boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
};

const sectionStyle = {
  padding: "14px 16px",
  borderBottom: `1px solid ${C.borderLight}`,
};

function CheckRow({ checked, label, note, onToggle, disabled, required }) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "7px 0",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.75 : 1,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onToggle}
        style={{ marginTop: 3, accentColor: C.brand }}
      />
      <span style={{ flex: 1 }}>
        <span>{label}</span>
        {required ? (
          <span style={{ marginLeft: 8, fontSize: 11, color: C.textDim }}>必选</span>
        ) : null}
        {note ? (
          <span style={{ marginLeft: 8, fontSize: 11, color: C.textDim }}>{note}</span>
        ) : null}
      </span>
    </label>
  );
}

function ActionBtn({ children, primary, onClick, disabled, flex }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        flex: flex ? 1 : undefined,
        padding: "9px 12px",
        borderRadius: 10,
        border: primary ? "none" : `1px solid ${C.border}`,
        background: primary ? C.brand : "transparent",
        color: primary ? "#fff" : C.textSec,
        fontWeight: primary ? 600 : 500,
        fontSize: 12,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.65 : 1,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

export function GenerationBriefCard({
  brief,
  disabled,
  onTopicToggle,
  onConfirmGenerate,
  onSupplement,
  onModifyRecognition,
}) {
  if (!brief?.briefId) return null;
  const rec = brief.recognition || {};
  const modules = brief.generatableModules || [];
  const topics = brief.suggestedTopics || [];
  const gaps = brief.gaps || [];
  const isConfirmed = brief.status === "confirmed";
  const matchLabel = rec.match || "—";

  return (
    <div style={cardStyle}>
      <div style={{ ...sectionStyle, fontWeight: 600, fontSize: 14 }}>
        产品详情页 · 生成摘要卡
        {isConfirmed ? (
          <span style={{ marginLeft: 8, fontSize: 11, color: C.success }}>已确认</span>
        ) : (
          <span style={{ marginLeft: 8, fontSize: 11, color: C.textDim }}>待确认</span>
        )}
      </div>

      <div style={sectionStyle}>
        <div style={{ fontSize: 12, color: C.textDim, marginBottom: 8 }}>识别</div>
        <div style={{ lineHeight: 1.6 }}>
          <strong style={{ color: C.brand }}>{rec.industryName || "—"}</strong>
          {" / "}
          {rec.productCategory || "—"}
          <span style={{ marginLeft: 8, fontSize: 11, color: C.textDim }}>({matchLabel})</span>
        </div>
        {brief.pageTemplateId ? (
          <div style={{ fontSize: 11, color: C.textDim, marginTop: 6 }}>
            模板：{brief.pageTemplateId}
          </div>
        ) : null}
      </div>

      <div style={sectionStyle}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.textSec, marginBottom: 8 }}>
          将生成（必选 · 来自 generatableModules）
        </div>
        {modules.length === 0 ? (
          <div style={{ fontSize: 12, color: C.textDim }}>产品名称、概述、图片说明、详情 HTML</div>
        ) : (
          modules.map((m) => (
            <CheckRow
              key={m.id ?? m.fieldTarget}
              checked
              disabled
              required
              label={m.name || m.fieldTarget}
            />
          ))
        )}
      </div>

      <div style={sectionStyle}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.textSec, marginBottom: 8 }}>
          详情建议章节（推荐 · suggestedTopics）
        </div>
        {topics.length === 0 ? (
          <div style={{ fontSize: 12, color: C.textDim }}>暂无推荐章节</div>
        ) : (
          topics.map((t) => (
            <CheckRow
              key={t.id}
              checked={!!t.selected}
              disabled={disabled || isConfirmed}
              label={t.label}
              note={t.selected ? "" : "可勾选"}
              onToggle={() => onTopicToggle?.(t.id)}
            />
          ))
        )}
      </div>

      <div style={sectionStyle}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.textSec, marginBottom: 8 }}>
          待补充（影响质量，非阻断）
        </div>
        {gaps.length === 0 ? (
          <div style={{ fontSize: 12, color: C.textDim }}>暂无强制待补充项</div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {gaps.map((g) => (
              <span
                key={g.id}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  borderRadius: 8,
                  background: "rgba(245,158,11,0.12)",
                  border: "1px solid rgba(245,158,11,0.25)",
                  fontSize: 12,
                  color: g.severity === "high" ? C.warning : C.textSec,
                }}
              >
                <span>!</span>
                {g.label}
              </span>
            ))}
          </div>
        )}
        <div style={{ fontSize: 11, color: C.textDim, marginTop: 10 }}>
          暂时无法提供上述资料也可以先看生成效果，缺失处将标注「待补充」。
        </div>
      </div>

      {!isConfirmed ? (
        <div style={{
          ...sectionStyle,
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          borderBottom: "none",
        }}
        >
          <ActionBtn disabled={disabled} onClick={onModifyRecognition}>修改识别</ActionBtn>
          <ActionBtn disabled={disabled} onClick={onSupplement}>补充资料</ActionBtn>
          <ActionBtn disabled={disabled} primary flex onClick={onConfirmGenerate}>确认生成</ActionBtn>
          <ActionBtn disabled={disabled} onClick={onConfirmGenerate}>跳过先生成</ActionBtn>
        </div>
      ) : null}
    </div>
  );
}
