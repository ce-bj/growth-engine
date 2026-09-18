import { useEffect, useRef, useState } from "react";
import { C } from "../theme";
import { TIME_OPTIONS, WEEKDAYS } from "../automation/constants";

function Chevron({ open }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      aria-hidden
      style={{
        flexShrink: 0,
        color: "#94A3B8",
        transform: open ? "rotate(180deg)" : "none",
        transition: "transform 0.12s ease",
      }}
    >
      <path
        d="M2.4 4.2L6 7.8l3.6-3.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <path
        d="M3.4 8.2l3.1 3.1 6.1-6.4"
        fill="none"
        stroke="#334155"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden style={{ color: "#94A3B8", flexShrink: 0 }}>
      <circle cx="8" cy="8" r="5.6" fill="none" stroke="currentColor" strokeWidth="1.35" />
      <path d="M8 5.2v3.1l2.2 1.4" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
    </svg>
  );
}

const triggerStyle = (open, empty) => ({
  width: "100%",
  minWidth: 0,
  height: 38,
  boxSizing: "border-box",
  textAlign: "left",
  padding: "0 10px 0 12px",
  borderRadius: 8,
  border: `1px solid ${open ? "#CBD5E1" : C.border}`,
  background: "#fff",
  fontSize: 13,
  color: empty ? C.textDim : C.text,
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
});

const popoverStyle = {
  position: "absolute",
  left: 0,
  top: "calc(100% + 6px)",
  zIndex: 50,
  background: "#fff",
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  boxShadow: "0 10px 28px rgba(15,23,42,0.12)",
  overflow: "hidden",
};

function useOutsideClose(open, onClose) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (!ref.current?.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onClose]);
  return ref;
}

function CycleMenu({ value, onChange, open, onToggle, onClose }) {
  const ref = useOutsideClose(open, onClose);
  const options = [
    { value: "monthly", label: "每月" },
    { value: "weekly", label: "每周" },
  ];
  const label = options.find((o) => o.value === value)?.label || "每月";

  return (
    <div ref={ref} style={{ position: "relative", flex: 1, minWidth: 0 }}>
      <button type="button" onClick={onToggle} style={triggerStyle(open, false)}>
        <span>{label}</span>
        <Chevron open={open} />
      </button>
      {open && (
        <div style={{ ...popoverStyle, minWidth: "100%", width: "100%" }}>
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  onClose();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  border: "none",
                  background: "#fff",
                  padding: "10px 12px",
                  fontSize: 13,
                  color: C.text,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <span>{opt.label}</span>
                {active ? <CheckIcon /> : <span style={{ width: 16 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function WeekdayMenu({ value, onChange, open, onToggle, onClose }) {
  const ref = useOutsideClose(open, onClose);
  const label = WEEKDAYS.find((d) => d.value === Number(value))?.label || "周一";

  return (
    <div ref={ref} style={{ position: "relative", flex: 1, minWidth: 0 }}>
      <button type="button" onClick={onToggle} style={triggerStyle(open, false)}>
        <span>{label}</span>
        <Chevron open={open} />
      </button>
      {open && (
        <div style={{ ...popoverStyle, minWidth: "100%", width: "100%", maxHeight: 240, overflowY: "auto" }}>
          {WEEKDAYS.map((d) => {
            const active = d.value === Number(value);
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => {
                  onChange(d.value);
                  onClose();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  border: "none",
                  background: "#fff",
                  padding: "10px 12px",
                  fontSize: 13,
                  color: C.text,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <span>{d.label}</span>
                {active ? <CheckIcon /> : <span style={{ width: 16 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MonthDayPicker({ value, onChange, open, onToggle, onClose }) {
  const ref = useOutsideClose(open, onClose);
  const day = Number(value) || 1;

  return (
    <div ref={ref} style={{ position: "relative", flex: 1, minWidth: 0 }}>
      <button type="button" onClick={onToggle} style={triggerStyle(open, false)}>
        <span>第 {day} 天</span>
        <Chevron open={open} />
      </button>
      {open && (
        <div
          style={{
            ...popoverStyle,
            minWidth: 252,
            width: 252,
            padding: 10,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 4,
            }}
          >
            {Array.from({ length: 31 }, (_, i) => i + 1).map((n) => {
              const active = n === day;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    onChange(n);
                    onClose();
                  }}
                  style={{
                    height: 30,
                    border: "none",
                    borderRadius: 8,
                    background: active ? "#334155" : "transparent",
                    color: active ? "#fff" : C.text,
                    fontSize: 13,
                    fontFamily: "inherit",
                    cursor: "pointer",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function TimeMenu({ value, onChange, open, onToggle, onClose }) {
  const ref = useOutsideClose(open, onClose);
  const listRef = useRef(null);
  const empty = !value;

  useEffect(() => {
    if (!open) return;
    const parent = listRef.current;
    const el = parent?.querySelector('[data-active="true"]');
    if (!parent || !el) return;
    parent.scrollTop = el.offsetTop - parent.clientHeight / 2 + el.clientHeight / 2;
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", flex: 1, minWidth: 0 }}>
      <button type="button" onClick={onToggle} style={triggerStyle(open, empty)}>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{value || "选择时间"}</span>
        <ClockIcon />
      </button>
      {open && (
        <div
          ref={listRef}
          style={{ ...popoverStyle, minWidth: "100%", width: "100%", maxHeight: 228, overflowY: "auto" }}
        >
          {TIME_OPTIONS.map((t) => {
            const active = t === value;
            return (
              <button
                key={t}
                type="button"
                data-active={active ? "true" : undefined}
                onClick={() => {
                  onChange(t);
                  onClose();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  border: "none",
                  background: active ? "#F8FAFC" : "#fff",
                  padding: "9px 12px",
                  fontSize: 13,
                  color: C.text,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <span>{t}</span>
                {active ? <CheckIcon /> : <span style={{ width: 16 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TriggerTimeRow({
  repeatCycle,
  weekday,
  monthDay,
  executeTime,
  onCycleChange,
  onWeekdayChange,
  onMonthDayChange,
  onTimeChange,
}) {
  const [open, setOpen] = useState(null);
  const toggle = (key) => setOpen((cur) => (cur === key ? null : key));
  const close = () => setOpen(null);

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.textSec, marginBottom: 8 }}>
        触发时间
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <CycleMenu
          value={repeatCycle}
          onChange={onCycleChange}
          open={open === "cycle"}
          onToggle={() => toggle("cycle")}
          onClose={close}
        />
        {repeatCycle === "weekly" ? (
          <WeekdayMenu
            value={weekday}
            onChange={onWeekdayChange}
            open={open === "day"}
            onToggle={() => toggle("day")}
            onClose={close}
          />
        ) : (
          <MonthDayPicker
            value={monthDay}
            onChange={onMonthDayChange}
            open={open === "day"}
            onToggle={() => toggle("day")}
            onClose={close}
          />
        )}
        <TimeMenu
          value={executeTime}
          onChange={onTimeChange}
          open={open === "time"}
          onToggle={() => toggle("time")}
          onClose={close}
        />
      </div>
    </div>
  );
}
