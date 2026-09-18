import { useEffect, useRef } from "react";
import { C } from "../theme";

const ITEM_H = 32;
const VISIBLE = 3;

function pad2(n) {
  return String(n).padStart(2, "0");
}

const HOURS = Array.from({ length: 24 }, (_, i) => pad2(i));
const MINUTES = Array.from({ length: 60 }, (_, i) => pad2(i));

function WheelColumn({ values, value, onChange, ariaLabel }) {
  const scrollerRef = useRef(null);
  const settleTimer = useRef(null);
  const readyRef = useRef(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const idx = Math.max(0, values.indexOf(value));
    if (Math.abs(el.scrollTop - idx * ITEM_H) > 2) {
      el.scrollTop = idx * ITEM_H;
    }
    const t = setTimeout(() => { readyRef.current = true; }, 120);
    return () => clearTimeout(t);
  }, [value, values]);

  const commit = () => {
    if (!readyRef.current) return;
    const el = scrollerRef.current;
    if (!el) return;
    const idx = Math.min(
      values.length - 1,
      Math.max(0, Math.round(el.scrollTop / ITEM_H)),
    );
    const next = values[idx];
    el.scrollTop = idx * ITEM_H;
    if (next !== value) onChange(next);
  };

  return (
    <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
      <div
        aria-hidden
        style={{
          pointerEvents: "none",
          position: "absolute",
          left: 8,
          right: 8,
          top: ITEM_H * 2,
          height: ITEM_H,
          borderRadius: 8,
          background: "rgba(59,159,208,0.08)",
          border: `1px solid ${C.brand}`,
          zIndex: 0,
        }}
      />
      <div
        ref={scrollerRef}
        role="listbox"
        aria-label={ariaLabel}
        onScroll={() => {
          if (settleTimer.current) clearTimeout(settleTimer.current);
          settleTimer.current = setTimeout(commit, 90);
        }}
        style={{
          height: ITEM_H * VISIBLE,
          overflowY: "auto",
          scrollSnapType: "y mandatory",
          position: "relative",
          zIndex: 1,
          maskImage:
            "linear-gradient(to bottom, transparent 0%, #000 22%, #000 78%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, #000 22%, #000 78%, transparent 100%)",
        }}
      >
        <div style={{ height: ITEM_H * 2 }} />
        {values.map((item) => {
          const selected = item === value;
          return (
            <button
              key={item}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onChange(item)}
              style={{
                display: "block",
                width: "100%",
                height: ITEM_H,
                lineHeight: `${ITEM_H}px`,
                textAlign: "center",
                border: "none",
                background: "transparent",
                fontSize: selected ? 18 : 14,
                fontWeight: selected ? 700 : 500,
                fontVariantNumeric: "tabular-nums",
                color: selected ? C.text : C.textDim,
                cursor: "pointer",
                scrollSnapAlign: "center",
                fontFamily: "inherit",
              }}
            >
              {item}
            </button>
          );
        })}
        <div style={{ height: ITEM_H * 2 }} />
      </div>
    </div>
  );
}

export function TimeWheelPicker({ value = "09:00", onChange }) {
  const [h = "09", m = "00"] = String(value).split(":");
  const hour = HOURS.includes(h) ? h : "09";
  const minute = MINUTES.includes(m) ? m : "00";

  const emit = (nextH, nextM) => {
    onChange(`${nextH}:${nextM}`);
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "stretch",
        background: C.surfaceDark,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: "8px 10px 12px",
      }}
    >
      <WheelColumn
        values={HOURS}
        value={hour}
        ariaLabel="时"
        onChange={(next) => emit(next, minute)}
      />
      <div
        style={{
          width: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          fontWeight: 700,
          color: C.text,
          paddingTop: 8,
        }}
      >
        :
      </div>
      <WheelColumn
        values={MINUTES}
        value={minute}
        ariaLabel="分"
        onChange={(next) => emit(hour, next)}
      />
    </div>
  );
}
