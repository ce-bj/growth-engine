import { useEffect, useId, useMemo, useState } from "react";
import { C } from "../theme";
import { LeadGenPlanModal } from "./LeadGenPlanModal";
import {
  formatScheduleText,
  LEAD_GEN_TEMPLATE_ID,
  emailSendModeLabel,
  runTaskName,
} from "../automation/constants";
import { createPlanId, deletePlan, loadPlans, loadRuns, savePlan, togglePlan } from "../automation/taskStore";

function formatRunTime(ts) {
  const d = new Date(ts);
  const mm = `${d.getMonth() + 1}/${d.getDate()}`;
  const hh = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${mm} ${hh}`;
}

function isFailedRun(run) {
  return ["failed", "timeout", "error"].includes(String(run?.status || ""));
}

function TaskCardIcon() {
  const uid = useId().replace(/:/g, "");
  const bg = `lead-insight-bg-${uid}`;
  const clip = `lead-insight-clip-${uid}`;
  const dots = [
    [16, 8], [20, 9], [24, 11], [12, 11], [8, 15],
    [14, 13], [19, 14], [23, 16], [10, 18], [16, 17],
    [21, 19], [7, 21], [13, 21], [18, 22], [25, 21],
    [9, 25], [15, 25], [20, 26], [12, 29], [17, 30],
    [22, 28], [26, 25],
  ];

  return (
    <svg
      width="42"
      height="42"
      viewBox="0 0 42 42"
      aria-hidden
      style={{
        display: "block",
        borderRadius: 10,
        boxShadow: "0 1px 3px rgba(47,124,255,0.16)",
        flexShrink: 0,
      }}
    >
      <defs>
        <linearGradient id={bg} x1="8" y1="2" x2="34" y2="40">
          <stop offset="0" stopColor="#F4F8FF" />
          <stop offset="1" stopColor="#D4E6FF" />
        </linearGradient>
        <clipPath id={clip}>
          <circle cx="17" cy="20" r="12.2" />
        </clipPath>
      </defs>
      <rect x="0.5" y="0.5" width="41" height="41" rx="10" fill={`url(#${bg})`} stroke="#C5DBFF" />
      <g clipPath={`url(#${clip})`} opacity="0.95">
        {dots.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 4 === 0 ? 1.2 : 0.95} fill={i % 5 === 0 ? "#2F7CFF" : "#7EB3FF"} />
        ))}
      </g>
      <ellipse cx="17" cy="20" rx="12.4" ry="12.2" fill="none" stroke="#8EBEFF" strokeWidth="1.05" />
      <circle cx="27.2" cy="23.4" r="7.15" fill="rgba(255,255,255,0.72)" stroke="#2F7CFF" strokeWidth="1.9" />
      <path d="M32.4 28.8l5.2 5.2" stroke="#1E5FEA" strokeWidth="2.15" strokeLinecap="round" />
    </svg>
  );
}

function EnableSwitch({ on, onToggle }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={on ? "禁用" : "启用"}
      onClick={onToggle}
      style={{
        width: 40,
        height: 22,
        borderRadius: 999,
        border: "none",
        padding: 2,
        cursor: "pointer",
        background: on ? C.brand : "#CBD5E1",
        position: "relative",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          display: "block",
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          transform: on ? "translateX(18px)" : "translateX(0)",
          transition: "transform 0.16s ease",
          boxShadow: "0 1px 2px rgba(15,23,42,0.2)",
        }}
      />
    </button>
  );
}

function IconBtn({ title, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        border: `1px solid ${C.border}`,
        background: "#fff",
        color: C.textSec,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        padding: 0,
      }}
    >
      {children}
    </button>
  );
}

export function AutomationTasksPage({
  onPlanEnabled,
  onManualRun,
  onOpenRun,
  onOpenEmailDomainConfig,
  runsTick = 0,
}) {
  const [plans, setPlans] = useState(() => loadPlans());
  const [runs, setRuns] = useState(() => loadRuns());
  const [listTab, setListTab] = useState("plans");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [hoverRunId, setHoverRunId] = useState(null);

  const refresh = () => {
    setPlans(loadPlans());
    setRuns(loadRuns());
  };

  useEffect(() => {
    refresh();
  }, [runsTick]);

  const handleEnable = (form) => {
    const plan = savePlan({
      id: createPlanId(),
      templateId: LEAD_GEN_TEMPLATE_ID,
      name: "获客计划",
      enabled: true,
      ...form,
    });
    setModalOpen(false);
    setListTab("plans");
    refresh();
    onPlanEnabled?.({ plan, prompt: form.prompt });
  };

  const planItems = useMemo(() => plans, [plans]);

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        background: "#F1F5F9",
        overflow: "auto",
        padding: "22px 28px 32px",
      }}
    >
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>自动化任务</div>
        </div>

        <section style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.textSec, marginBottom: 10 }}>
            推荐任务
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              style={{
                width: 268,
                textAlign: "left",
                border: `1px solid ${C.border}`,
                background: "#fff",
                borderRadius: 14,
                padding: "16px 16px 18px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 12,
                boxShadow: "0 1px 2px rgba(15,23,42,0.05)",
                fontFamily: "inherit",
              }}
            >
              <TaskCardIcon />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text, lineHeight: 1.35 }}>
                  获客计划
                </div>
                <div style={{ fontSize: 12, color: C.textDim, marginTop: 6, lineHeight: 1.65 }}>
                  用外贸客户洞察找还在采购的工厂，自动写开发信，群发前由你确认
                </div>
              </div>
            </button>
          </div>
        </section>

        <section
          style={{
            background: "#fff",
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              borderBottom: `1px solid ${C.border}`,
              padding: "0 8px",
            }}
          >
            {[
              { id: "plans", label: "我的任务" },
              { id: "runs", label: "执行历史" },
            ].map((tab) => {
              const active = listTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                    onClick={() => {
                      setListTab(tab.id);
                      if (tab.id === "runs") refresh();
                    }}
                  style={{
                    border: "none",
                    background: "transparent",
                    padding: "12px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    color: active ? C.brand : C.textDim,
                    borderBottom: active ? `2px solid ${C.brand}` : "2px solid transparent",
                    marginBottom: -1,
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div style={{ minHeight: 220, padding: 12 }}>
            {listTab === "plans" && planItems.length === 0 && (
              <div style={{ padding: "36px 16px", textAlign: "center", color: C.textDim, fontSize: 13, lineHeight: 1.7 }}>
                还没有获客计划<br />从上方推荐任务开启。到点会自动执行，也可以点手动执行。
              </div>
            )}
            {listTab === "plans" && planItems.map((plan) => (
              <div
                key={plan.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 10px",
                  borderRadius: 10,
                  border: `1px solid ${C.borderLight}`,
                  marginBottom: 8,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 650, color: C.text }}>
                    {plan.name} · {plan.destinationCountryName} · {plan.hsCode}
                  </div>
                  <div style={{ fontSize: 11, color: C.textDim, marginTop: 4 }}>
                    {formatScheduleText(plan)}
                    {plan.enabled ? " · 已启用" : " · 已禁用"}
                    {" · "}
                    {emailSendModeLabel(plan.emailSendMode)}
                  </div>
                </div>
                <IconBtn title="手动执行" onClick={() => onManualRun?.(plan)}>
                  <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden>
                    <path d="M4.2 2.8v10.4L13.2 8 4.2 2.8z" fill="currentColor" />
                  </svg>
                </IconBtn>
                <EnableSwitch
                  on={!!plan.enabled}
                  onToggle={() => {
                    togglePlan(plan.id, !plan.enabled);
                    refresh();
                  }}
                />
                <IconBtn title="删除任务" onClick={() => setDeleteTarget(plan)}>
                  <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden>
                    <path
                      d="M5.5 3.2h5M3.2 5h9.6M6.2 5v6.5M9.8 5v6.5M4.5 5l.6 7.2c.06.7.64 1.2 1.34 1.2h3.12c.7 0 1.28-.5 1.34-1.2L11.5 5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                    />
                  </svg>
                </IconBtn>
              </div>
            ))}

            {listTab === "runs" && runs.length === 0 && (
              <div style={{ padding: "36px 16px", textAlign: "center", color: C.textDim, fontSize: 13, lineHeight: 1.7 }}>
                还没有执行记录
              </div>
            )}
            {listTab === "runs" && runs.map((run) => {
              const sessionGone = Boolean(run.sessionDeleted);
              const clickable = !sessionGone && run.status !== "created" && typeof onOpenRun === "function";
              const hovered = hoverRunId === run.id;
              const taskName = runTaskName(run, plans);
              return (
                <button
                  key={run.id}
                  type="button"
                  onClick={() => { if (clickable) onOpenRun(run); }}
                  onMouseEnter={() => setHoverRunId(run.id)}
                  onMouseLeave={() => setHoverRunId(null)}
                  disabled={!clickable}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    width: "100%",
                    textAlign: "left",
                    padding: "12px 10px",
                    borderRadius: 10,
                    border: `1px solid ${hovered && clickable ? C.brand : C.borderLight}`,
                    background: hovered && clickable ? "rgba(59,159,208,0.04)" : "#fff",
                    marginBottom: 8,
                    cursor: clickable ? "pointer" : "default",
                    fontFamily: "inherit",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 650, color: C.text, minWidth: 0 }}>
                    {taskName}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {isFailedRun(run) && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#B45309",
                          background: "#FFFBEB",
                          border: "1px solid #FCD34D",
                          borderRadius: 999,
                          padding: "2px 8px",
                        }}
                      >
                        执行失败
                      </span>
                    )}
                    {sessionGone && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#B45309",
                          background: "#FFFBEB",
                          border: "1px solid #FCD34D",
                          borderRadius: 999,
                          padding: "2px 8px",
                        }}
                      >
                        会话已删除
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: C.textDim }}>
                      {formatRunTime(run.at)}
                      {run.triggerType === "manual" ? " · 手动触发" : run.triggerType === "scheduled" ? " · 自动执行" : ""}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <LeadGenPlanModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleEnable}
        onOpenEmailDomainConfig={() => {
          setModalOpen(false);
          onOpenEmailDomainConfig?.();
        }}
      />

      {deleteTarget ? (
        <div
          role="presentation"
          onClick={() => setDeleteTarget(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 90,
            background: "rgba(15,23,42,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 400,
              maxWidth: "100%",
              background: "#fff",
              borderRadius: 14,
              boxShadow: "0 20px 48px rgba(15,23,42,0.2)",
              padding: "20px 22px 16px",
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>删除任务</div>
            <div style={{ fontSize: 13, color: C.textSec, marginTop: 10, lineHeight: 1.7 }}>
              确认删除「{deleteTarget.name} · {deleteTarget.destinationCountryName} · {deleteTarget.hsCode}」？删除后不再自动执行。已产生的定时任务会话会保留。
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: "#fff",
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  deletePlan(deleteTarget.id);
                  setDeleteTarget(null);
                  refresh();
                }}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: "#dc2626",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
