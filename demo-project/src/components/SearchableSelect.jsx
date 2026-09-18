import { useEffect, useMemo, useRef, useState } from "react";
import { C } from "../theme";

export function SearchableSelect({
  value,
  displayValue,
  placeholder = "请选择",
  options = [],
  onChange,
  allowCustom = false,
  filterHint = "搜索",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const queryRef = useRef("");

  const selected = options.find((o) => o.value === value) || null;
  const shown = displayValue || selected?.label || (allowCustom ? value : "") || "";
  queryRef.current = query;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) =>
      `${o.label} ${o.value} ${o.keywords || ""}`.toLowerCase().includes(q),
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const pick = (option) => {
    onChange(option.value, option);
    setOpen(false);
  };

  const commitCustom = () => {
    if (!allowCustom) return;
    const raw = (open ? query : shown).trim();
    if (!raw) return;
    const hit = options.find(
      (o) => o.value === raw || o.label === raw,
    );
    if (hit) pick(hit);
    else onChange(raw, { value: raw, label: raw, custom: true });
    setOpen(false);
  };

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "9px 12px",
          borderRadius: 8,
          border: `1px solid ${open ? C.brand : C.border}`,
          background: "#fff",
          fontSize: 13,
          color: shown ? C.text : C.textDim,
          cursor: "pointer",
          fontFamily: "inherit",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {shown || placeholder}
        </span>
        <span style={{ color: C.textDim, fontSize: 11 }}>▾</span>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "calc(100% + 4px)",
            zIndex: 40,
            background: "#fff",
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            boxShadow: "0 12px 32px rgba(15,23,42,0.12)",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: 8, borderBottom: `1px solid ${C.borderLight}` }}>
            <input
              ref={inputRef}
              value={query}
              placeholder={allowCustom ? `${filterHint}，或直接输入` : filterHint}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (filtered[0]) pick(filtered[0]);
                  else commitCustom();
                }
                if (e.key === "Escape") setOpen(false);
              }}
              style={{
                width: "100%",
                boxSizing: "border-box",
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                padding: "8px 10px",
                fontSize: 12,
                fontFamily: "inherit",
                outline: "none",
              }}
            />
          </div>
          <div style={{ maxHeight: 220, overflowY: "auto", padding: 6 }}>
            {filtered.length === 0 && (
              <div style={{ padding: "10px 8px", fontSize: 12, color: C.textDim }}>
                {allowCustom && query.trim()
                  ? `没有匹配项，回车将使用「${query.trim()}」`
                  : "没有匹配结果"}
              </div>
            )}
            {filtered.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => pick(option)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    borderRadius: 6,
                    padding: "8px 10px",
                    background: active ? "rgba(59,159,208,0.08)" : "transparent",
                    color: C.text,
                    fontSize: 12,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    lineHeight: 1.45,
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
