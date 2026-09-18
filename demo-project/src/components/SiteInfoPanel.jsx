import { useMemo, useState } from "react";
import { C } from "../theme";
import {
  HEADER_FIELDS,
  NAV_COLUMNS,
  SECTIONS,
  TEXTAREA_FIELDS,
  emptyNavRow,
} from "../siteProfiles/schema.js";
import {
  applySiteExtract,
  applySiteSave,
  siteStatusLabel,
} from "../siteProfiles/store.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const panel = {
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  height: "100%",
  display: "flex",
  flexDirection: "column",
  background: C.surfaceDark,
  overflow: "hidden",
};

const header = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "12px 16px",
  borderBottom: `1px solid ${C.border}`,
  flexShrink: 0,
  background: "#fff",
};

const KNOWLEDGE_URL = "https://www.baidu.com";

const tabBtn = (active) => ({
  padding: "5px 14px",
  borderRadius: 6,
  border: `1px solid ${active ? C.brand : C.border}`,
  background: active ? C.brandSoft : "transparent",
  color: active ? C.brand : C.textDim,
  fontSize: 12,
  fontWeight: active ? 600 : 400,
  cursor: "pointer",
  fontFamily: "inherit",
});

const closeBtn = {
  width: 28,
  height: 28,
  borderRadius: 6,
  border: `1px solid ${C.border}`,
  background: "transparent",
  color: C.textDim,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 16,
  lineHeight: 1,
  flexShrink: 0,
  fontFamily: "inherit",
  marginLeft: "auto",
};

const actionBtn = (primary, disabled) => ({
  border: `1px solid ${primary ? C.brand : C.border}`,
  background: primary ? (disabled ? "#A8D4EA" : C.brand) : "#fff",
  color: primary ? "#fff" : C.text,
  borderRadius: 6,
  padding: "5px 12px",
  fontSize: 12,
  fontWeight: 600,
  cursor: disabled ? "default" : "pointer",
  fontFamily: "inherit",
  opacity: disabled && !primary ? 0.55 : 1,
});

const statusLine = (pending) => ({
  fontSize: 12,
  fontWeight: 600,
  color: pending ? C.warning : C.success,
  marginTop: 8,
});

const pendingMark = {
  marginLeft: 6,
  fontSize: 11,
  fontWeight: 600,
  color: C.warning,
};

const body = {
  flex: 1,
  overflowY: "auto",
  padding: 16,
  minHeight: 0,
};

const card = {
  background: "#fff",
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  padding: 14,
  marginBottom: 10,
};

const line = {
  fontSize: 13,
  color: C.text,
  lineHeight: 1.7,
};

const sectionBox = {
  background: "#fff",
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  padding: 14,
  marginBottom: 12,
};

const sectionTitle = {
  fontSize: 13,
  fontWeight: 700,
  margin: "0 0 12px",
  color: C.text,
};

const labelStyle = {
  display: "block",
  fontSize: 12,
  color: C.textSec,
  marginBottom: 6,
  lineHeight: 1.5,
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "8px 10px",
  border: `1px solid ${C.border}`,
  borderRadius: 6,
  fontSize: 13,
  fontFamily: "inherit",
  color: C.text,
  background: C.surfaceDark,
  outline: "none",
};

const textareaStyle = {
  ...inputStyle,
  minHeight: 88,
  resize: "vertical",
  lineHeight: 1.55,
};

const fieldWrap = { marginBottom: 12 };

const table = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 12,
  marginBottom: 12,
};

const th = {
  textAlign: "left",
  padding: "8px 6px",
  borderBottom: `1px solid ${C.border}`,
  color: C.textSec,
  fontWeight: 600,
  background: C.surfaceDark,
};

const td = {
  padding: "6px 4px",
  borderBottom: `1px solid ${C.borderLight}`,
  verticalAlign: "top",
};

function fieldCaption(label) {
  return String(label).includes("：") ? String(label) : `${label}：`;
}

function FieldInput({ label, value, onChange, pending }) {
  const multiline = TEXTAREA_FIELDS.has(label);
  return (
    <div style={fieldWrap}>
      <label style={labelStyle}>
        {fieldCaption(label)}
        {pending ? <span style={pendingMark}>待确认</span> : null}
      </label>
      {multiline ? (
        <textarea
          style={textareaStyle}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          style={inputStyle}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

export function SiteInfoPanel({ sites, onChange, onClose }) {
  const [mainTab, setMainTab] = useState("archive");
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null);

  const selected = useMemo(
    () => (sites || []).find((s) => s.id === selectedId) || null,
    [sites, selectedId],
  );

  const openSite = (site) => {
    setMainTab("archive");
    setSelectedId(site.id);
    setDraft(clone(site));
  };

  const backToList = () => {
    setSelectedId(null);
    setDraft(null);
  };

  const persistSite = (nextSite) => {
    const next = (sites || []).map((s) => (s.id === nextSite.id ? clone(nextSite) : s));
    onChange?.(next);
    return nextSite;
  };

  const saveDraft = () => {
    if (!draft) return;
    const confirmed = applySiteSave(draft);
    persistSite(confirmed);
    setDraft(confirmed);
  };

  const extractSite = (site) => {
    const extracted = applySiteExtract(site);
    persistSite(extracted);
    if (draft?.id === site.id) setDraft(extracted);
  };

  const savedSnapshot = selected ? JSON.stringify(selected) : "";
  const draftSnapshot = draft ? JSON.stringify(draft) : "";
  const isDirty = Boolean(draft && draftSnapshot !== savedSnapshot);
  const canSave = Boolean(draft && (isDirty || draft.status === "pending"));
  const pendingSet = new Set(draft?.pendingFields || []);

  const openKnowledge = () => {
    setMainTab("knowledge");
    window.open(KNOWLEDGE_URL, "_blank", "noopener,noreferrer");
  };

  const setHeader = (field, value) => {
    setDraft((prev) => ({
      ...prev,
      header: { ...prev.header, [field]: value },
    }));
  };

  const setSectionField = (title, field, value) => {
    setDraft((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [title]: { ...prev.sections[title], [field]: value },
      },
    }));
  };

  const setNavExtra = (title, field, value) => {
    setDraft((prev) => {
      const block = prev.sections[title] || {};
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [title]: {
            ...block,
            extras: { ...(block.extras || {}), [field]: value },
          },
        },
      };
    });
  };

  const setNavCell = (title, rowIndex, col, value) => {
    setDraft((prev) => {
      const block = prev.sections[title] || {};
      const nav = Array.isArray(block.nav) ? [...block.nav] : [];
      nav[rowIndex] = { ...(nav[rowIndex] || emptyNavRow()), [col]: value };
      return {
        ...prev,
        sections: {
          ...prev.sections,
          [title]: { ...block, nav },
        },
      };
    });
  };

  const addNavRow = (title) => {
    setDraft((prev) => {
      const block = prev.sections[title] || {};
      const nav = [...(block.nav || []), emptyNavRow()];
      return {
        ...prev,
        sections: { ...prev.sections, [title]: { ...block, nav } },
      };
    });
  };

  const removeNavRow = (title, rowIndex) => {
    setDraft((prev) => {
      const block = prev.sections[title] || {};
      const nav = (block.nav || []).filter((_, i) => i !== rowIndex);
      return {
        ...prev,
        sections: { ...prev.sections, [title]: { ...block, nav } },
      };
    });
  };

  return (
    <div style={panel}>
      <div style={header}>
        {selected ? (
          <>
            <button type="button" style={actionBtn(false)} onClick={backToList}>
              返回站点列表
            </button>
            <button
              type="button"
              style={actionBtn(true, !canSave)}
              disabled={!canSave}
              onClick={saveDraft}
            >
              {canSave ? "保存" : "已保存"}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              style={tabBtn(mainTab === "archive")}
              aria-pressed={mainTab === "archive"}
              onClick={() => setMainTab("archive")}
            >
              网站档案
            </button>
            <button
              type="button"
              style={tabBtn(mainTab === "knowledge")}
              aria-pressed={mainTab === "knowledge"}
              onClick={openKnowledge}
            >
              知识库
            </button>
          </>
        )}
        <button type="button" style={closeBtn} onClick={onClose} aria-label="关闭">
          ×
        </button>
      </div>

      {!selected && mainTab === "knowledge" ? (
        <iframe
          src={KNOWLEDGE_URL}
          title="知识库"
          style={{
            flex: 1,
            width: "100%",
            minHeight: 0,
            border: "none",
            background: "#fff",
          }}
        />
      ) : (
      <div style={body}>
        {!selected ? (
          (sites || []).map((site) => (
            <div key={site.id} style={card}>
              <button
                type="button"
                onClick={() => openSite(site)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: 0,
                  border: "none",
                  background: "transparent",
                  textAlign: "left",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {HEADER_FIELDS.map((field) => (
                  <div key={field} style={line}>
                    {field}：{site.header?.[field] || ""}
                  </div>
                ))}
                <div style={statusLine(site.status === "pending")}>
                  {siteStatusLabel(site)}
                </div>
              </button>
              <button
                type="button"
                style={{ ...actionBtn(false), marginTop: 10 }}
                onClick={() => extractSite(site)}
              >
                从网站更新
              </button>
            </div>
          ))
        ) : draft ? (
          <>
            <div style={sectionBox}>
              <div style={{ ...statusLine(draft.status === "pending"), marginTop: 0, marginBottom: 12 }}>
                {siteStatusLabel(draft)}
              </div>
              {HEADER_FIELDS.map((field) => (
                <div key={field}>
                  <FieldInput
                    label={field}
                    value={draft.header?.[field]}
                    pending={pendingSet.has(field)}
                    onChange={(value) => setHeader(field, value)}
                  />
                  {field === "最近抽取日期" ? (
                    <button
                      type="button"
                      style={{ ...actionBtn(false), marginTop: -4, marginBottom: 12 }}
                      onClick={() => extractSite(draft)}
                    >
                      从网站更新
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            {SECTIONS.map((section) => {
              const block = draft.sections?.[section.title] || {};
              return (
                <div key={section.title} style={sectionBox}>
                  <h5 style={sectionTitle}>{section.title}</h5>
                  {section.nav ? (
                    <>
                      <table style={table}>
                        <thead>
                          <tr>
                            {NAV_COLUMNS.map((col) => (
                              <th key={col} style={th}>
                                {col}
                              </th>
                            ))}
                            <th style={{ ...th, width: 52 }} />
                          </tr>
                        </thead>
                        <tbody>
                          {(block.nav || []).map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {NAV_COLUMNS.map((col) => (
                                <td key={col} style={td}>
                                  <input
                                    style={inputStyle}
                                    value={row?.[col] ?? ""}
                                    onChange={(e) =>
                                      setNavCell(section.title, rowIndex, col, e.target.value)
                                    }
                                  />
                                </td>
                              ))}
                              <td style={td}>
                                <button
                                  type="button"
                                  style={actionBtn(false)}
                                  onClick={() => removeNavRow(section.title, rowIndex)}
                                >
                                  删除
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button
                        type="button"
                        style={{ ...actionBtn(false), marginBottom: 12 }}
                        onClick={() => addNavRow(section.title)}
                      >
                        添加栏目
                      </button>
                      {(section.fields || []).map((field) => (
                        <FieldInput
                          key={field}
                          label={field}
                          value={block.extras?.[field]}
                          pending={pendingSet.has(field)}
                          onChange={(value) => setNavExtra(section.title, field, value)}
                        />
                      ))}
                    </>
                  ) : (
                    section.fields.map((field) => (
                      <FieldInput
                        key={field}
                        label={field}
                        value={block[field]}
                        pending={pendingSet.has(field)}
                        onChange={(value) => setSectionField(section.title, field, value)}
                      />
                    ))
                  )}
                </div>
              );
            })}
          </>
        ) : null}
      </div>
      )}
    </div>
  );
}
