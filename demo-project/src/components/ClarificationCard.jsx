import { useMemo, useState } from "react";

const C = {
  border: "rgba(255,255,255,0.12)",
  borderLight: "rgba(255,255,255,0.06)",
  text: "#e2e8f0",
  textSec: "#94a3b8",
  textDim: "#64748b",
  brand: "#e85d04",
  cardBg: "rgba(15,23,42,0.88)",
  surface: "rgba(30,41,59,0.72)",
  activeBorder: "rgba(232,93,4,0.65)",
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

function normalizeOptions(dim) {
  return (dim.options || []).map((opt, idx) => {
    if (typeof opt === "string") {
      return { id: `${dim.id}-opt-${idx}`, title: opt, description: "" };
    }
    return {
      id: opt.id || `${dim.id}-opt-${idx}`,
      title: opt.title || opt.label || "",
      description: opt.description || opt.detail || "",
    };
  }).filter((o) => o.title);
}

function customInputTriggerId(dim) {
  return dim.customInputWhen || `${dim.id}-other`;
}

function shouldShowCustomInput(dim) {
  if (!dim.allowCustom) return false;
  const triggerId = customInputTriggerId(dim);
  if (dim.allowMulti) {
    return (dim.selectedOptionIds || []).includes(triggerId);
  }
  return dim.selectedOptionId === triggerId;
}

function customInputPlaceholder(dim) {
  if (dim.id === "identity") return "请填写正确的行业与品类";
  if (dim.id === "scenarios") return "请填写其他应用场景";
  if (dim.id === "advantages") return "请填写其他优势与特点";
  return "请填写";
}

function mergeCustomIntoValues(dim, customText) {
  const base = (dim.values || []).filter((v) => v !== dim.customValue);
  const trimmed = customText.trim();
  if (!trimmed) return base;
  return [...base, trimmed];
}

function isOptionSelected(dim, optId) {
  if (dim.allowMulti) {
    return (dim.selectedOptionIds || []).includes(optId);
  }
  return dim.selectedOptionId === optId;
}

function applyOptionSelect(dim, optId) {
  const opt = normalizeOptions(dim).find((o) => o.id === optId);
  const triggerId = customInputTriggerId(dim);

  if (dim.allowMulti) {
    const ids = new Set(dim.selectedOptionIds || []);
    if (ids.has(optId)) ids.delete(optId);
    else ids.add(optId);
    const selected = [...ids];
    const titles = normalizeOptions(dim)
      .filter((o) => selected.includes(o.id) && o.id !== triggerId)
      .map((o) => o.title);
    const custom = selected.includes(triggerId) ? (dim.customValue || "").trim() : "";
    const values = custom ? [...titles, custom] : titles;
    return {
      ...dim,
      selectedOptionIds: selected,
      values,
      answered: values.length > 0,
      skipped: false,
      customValue: selected.includes(triggerId) ? dim.customValue || "" : "",
    };
  }

  if (optId === triggerId) {
    return {
      ...dim,
      selectedOptionId: optId,
      value: (dim.customValue || "").trim() || null,
      answered: Boolean((dim.customValue || "").trim()),
      skipped: false,
    };
  }

  return {
    ...dim,
    selectedOptionId: optId,
    value: opt?.title || null,
    answered: Boolean(optId),
    skipped: false,
    customValue: "",
  };
}

function formatDimAnswer(dim) {
  if (dim.skipped) return "已跳过";
  if (dim.allowMulti) {
    const vals = (dim.values || []).filter(Boolean);
    return vals.length ? vals.join("、") : "未选择";
  }
  return dim.value || dim.customValue || "未选择";
}

export function ClarificationCard({
  brief,
  disabled,
  readOnly = false,
  onChange,
  onSubmit,
  onSkipAll,
}) {
  const dimensions = brief?.clarification?.dimensions || [];
  const [step, setStep] = useState(0);
  const [collapsed, setCollapsed] = useState(readOnly);

  const activeDim = dimensions[step];
  const options = useMemo(
    () => (activeDim ? normalizeOptions(activeDim) : []),
    [activeDim],
  );
  const showCustomInput = activeDim ? shouldShowCustomInput(activeDim) : false;

  if (!dimensions.length) return null;

  if (readOnly) {
    const preview = dimensions
      .map((d) => formatDimAnswer(d))
      .filter((v) => v !== "未选择")
      .join(" · ");
    return (
      <div style={cardStyle}>
        <div style={{
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        >
          <span style={{ fontWeight: 600 }}>关键澄清 · 已完成</span>
          <button type="button" onClick={() => setCollapsed(!collapsed)} style={ghostBtn}>
            {collapsed ? "查看已选答案" : "收起"}
          </button>
        </div>
        {collapsed ? (
          <div style={{ padding: "0 16px 12px", fontSize: 12, color: C.textSec, lineHeight: 1.6 }}>
            {preview || "已提交澄清结果"}
          </div>
        ) : (
          <div style={{ padding: "12px 16px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
            {dimensions.map((dim, i) => (
              <div key={dim.id || i}>
                <div style={{ fontSize: 12, color: C.textDim, marginBottom: 4 }}>
                  {i + 1}. {dim.question || dim.title}
                </div>
                <div style={{
                  fontSize: 13,
                  color: C.text,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: C.surface,
                  border: `1px solid ${C.borderLight}`,
                }}
                >
                  {formatDimAnswer(dim)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (!activeDim) return null;

  const setDim = (dimId, patch) => {
    if (!onChange) return;
    const nextDims = dimensions.map((d) => (d.id === dimId ? { ...d, ...patch } : d));
    onChange({
      ...brief,
      clarification: { ...brief.clarification, dimensions: nextDims },
    });
  };

  const goNext = () => {
    if (step < dimensions.length - 1) {
      setStep(step + 1);
      return;
    }
    onSubmit?.();
  };

  const goPrev = () => {
    if (step > 0) setStep(step - 1);
  };

  const skipCurrent = () => {
    setDim(activeDim.id, {
      answered: false,
      skipped: true,
      selectedOptionId: null,
      selectedOptionIds: [],
      value: null,
      values: [],
      customValue: "",
    });
    if (step < dimensions.length - 1) {
      setStep(step + 1);
      return;
    }
    onSubmit?.();
  };

  const modeLabel = activeDim.allowMulti ? "多选" : "单选";

  if (collapsed) {
    return (
      <div style={cardStyle}>
        <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 600 }}>关键澄清 · 已折叠</span>
          <button type="button" onClick={() => setCollapsed(false)} style={ghostBtn}>展开</button>
        </div>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={{
        padding: "12px 16px",
        borderBottom: `1px solid ${C.borderLight}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
          <span style={{ opacity: 0.7 }}>☑</span>
          <span>关键澄清 · {modeLabel}</span>
          <span style={{ fontSize: 11, color: C.textDim }}>
            {step + 1}/{dimensions.length}
          </span>
        </div>
        <button type="button" onClick={() => setCollapsed(true)} style={ghostBtn}>折叠</button>
      </div>

      <div style={{ padding: "16px" }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
          {step + 1}. {activeDim.question || activeDim.title}
        </div>
        {activeDim.hint ? (
          <div style={{ fontSize: 12, color: C.textDim, marginBottom: 12 }}>
            识图提示：{activeDim.hint}
          </div>
        ) : null}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {options.map((opt, idx) => {
            const active = isOptionSelected(activeDim, opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                disabled={disabled}
                onClick={() => setDim(activeDim.id, applyOptionSelect(activeDim, opt.id))}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  textAlign: "left",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: `1px solid ${active ? C.activeBorder : C.border}`,
                  background: active ? "rgba(232,93,4,0.12)" : C.surface,
                  color: C.text,
                  cursor: disabled ? "default" : "pointer",
                  opacity: disabled ? 0.7 : 1,
                }}
              >
                <span style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: active ? C.brand : "rgba(148,163,184,0.2)",
                  color: active ? "#fff" : C.textSec,
                  fontSize: 12,
                  fontWeight: 700,
                }}
                >
                  {idx + 1}
                </span>
                <span style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: opt.description ? 4 : 0 }}>{opt.title}</div>
                  {opt.description ? (
                    <div style={{ fontSize: 12, color: C.textSec, lineHeight: 1.5 }}>{opt.description}</div>
                  ) : null}
                </span>
              </button>
            );
          })}

          {showCustomInput ? (
            <div style={{ marginTop: 4 }}>
              <input
                type="text"
                placeholder={customInputPlaceholder(activeDim)}
                disabled={disabled}
                value={activeDim.customValue || ""}
                onChange={(e) => {
                  const v = e.target.value;
                  if (activeDim.allowMulti) {
                    const values = mergeCustomIntoValues(activeDim, v);
                    setDim(activeDim.id, {
                      customValue: v,
                      values,
                      answered: values.length > 0,
                      skipped: false,
                    });
                    return;
                  }
                  setDim(activeDim.id, {
                    customValue: v,
                    value: v.trim() || null,
                    answered: Boolean(v.trim()),
                    skipped: false,
                    selectedOptionId: customInputTriggerId(activeDim),
                  });
                }}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  background: C.surface,
                  color: C.text,
                  fontSize: 12,
                }}
              />
            </div>
          ) : null}
        </div>
      </div>

      <div style={{
        padding: "12px 16px",
        borderTop: `1px solid ${C.borderLight}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
      >
        <div style={{ fontSize: 12, color: C.textDim }}>
          {step > 0 ? "可返回修改上一题" : "✦ 推荐"}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {step > 0 ? (
            <button type="button" disabled={disabled} onClick={goPrev} style={ghostBtn}>上一题</button>
          ) : null}
          <button type="button" disabled={disabled} onClick={skipCurrent} style={ghostBtn}>跳过</button>
          <button
            type="button"
            disabled={disabled}
            onClick={goNext}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              border: "none",
              background: "#334155",
              color: "#fff",
              fontWeight: 600,
              cursor: disabled ? "default" : "pointer",
            }}
          >
            {step < dimensions.length - 1 ? "继续 ↵" : "完成澄清"}
          </button>
        </div>
      </div>

      <div style={{ padding: "0 16px 12px", textAlign: "right" }}>
        <button type="button" disabled={disabled} onClick={onSkipAll} style={ghostBtn}>全部跳过，先看摘要</button>
      </div>
    </div>
  );
}

const ghostBtn = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "none",
  background: "transparent",
  color: "#94a3b8",
  cursor: "pointer",
  fontSize: 12,
};
