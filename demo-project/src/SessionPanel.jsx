import { useState, useEffect, useCallback, useRef } from "react";
import { C } from "./theme";
import { loadRuns } from "./automation/taskStore";
import { scheduledSessionBadge } from "./sessionStore";

const panelStyle = {
  width: 252,
  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  background: "#EAEDF6",
  borderRight: `1px solid ${C.border}`,
  minHeight: 0,
};

const headerStyle = {
  padding: "14px 14px 10px",
  borderBottom: `1px solid ${C.border}`,
  flexShrink: 0,
};

const listStyle = {
  flex: 1,
  overflowY: "auto",
  padding: "8px",
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatDate(ts) {
  const d = new Date(ts);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatScheduledMeta(session) {
  const ts = session.createdAt || session.updatedAt;
  const d = new Date(ts);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startThat = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((startToday - startThat) / 86400000);
  const time = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  let when = `${d.getMonth() + 1}/${d.getDate()} ${time}`;
  if (diff === 0) when = `今天 ${time}`;
  else if (diff === 1) when = `昨天 ${time}`;
  const how = session.triggerType === "manual"
    ? "手动触发"
    : session.triggerType === "scheduled"
      ? "自动执行"
      : session.triggerType === "task_execute"
        ? "一键执行"
        : null;
  return how ? `${when} · ${how}` : when;
}

function sessionKind(session) {
  return session?.kind === "scheduled" ? "scheduled" : "history";
}

function WarnMark() {
  return (
    <span
      title="任务失败"
      style={{
        width: 18,
        height: 18,
        borderRadius: "50%",
        background: "#F59E0B",
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 800,
        flexShrink: 0,
        lineHeight: 1,
      }}
    >
      !
    </span>
  );
}

function UnreadDot() {
  return (
    <span
      title="未读或待确认"
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: "#EF4444",
        flexShrink: 0,
        display: "inline-block",
      }}
    />
  );
}

export function SessionPanel({
  sessions,
  activeId,
  sessionKindTab = "history",
  onSessionKindTabChange,
  automationActive = false,
  onOpenAutomation,
  onSelect,
  onNew,
  onDelete,
  runsTick = 0,
}) {
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [confirmSession, setConfirmSession] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (pendingDeleteId === null) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setPendingDeleteId(null), 3000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pendingDeleteId]);

  const handleDeleteClick = useCallback(
    (e, session) => {
      e.stopPropagation();
      if (sessionKind(session) === "scheduled") {
        setConfirmSession(session);
        return;
      }
      if (pendingDeleteId === session.id) {
        setPendingDeleteId(null);
        if (timerRef.current) clearTimeout(timerRef.current);
        onDelete(session.id);
      } else {
        setPendingDeleteId(session.id);
      }
    },
    [pendingDeleteId, onDelete],
  );

  const visibleSessions = sessions.filter((s) => sessionKind(s) === sessionKindTab);
  const runs = sessionKindTab === "scheduled" ? loadRuns() : [];
  void runsTick;

  return (
    <aside style={panelStyle}>
      <div style={headerStyle}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>会话记录</div>
        <button
          type="button"
          onClick={onOpenAutomation}
          style={{
            width: "100%",
            padding: "8px 10px",
            borderRadius: 8,
            border: `1px solid ${automationActive ? C.brand : C.border}`,
            background: automationActive ? C.brandSoft : C.surfaceDark,
            color: automationActive ? C.brand : C.text,
            fontSize: 12,
            cursor: "pointer",
            fontWeight: 600,
            marginBottom: 8,
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <span aria-hidden>◎</span>
          自动化任务
        </button>
        <button
          type="button"
          onClick={onNew}
          style={{
            width: "100%",
            padding: "8px 10px",
            borderRadius: 8,
            border: `1px solid ${C.brand}`,
            background: "#fff",
            color: C.brand,
            fontSize: 12,
            cursor: "pointer",
            fontWeight: 600,
            fontFamily: "inherit",
          }}
        >
          + 新对话
        </button>
        <div
          style={{
            display: "flex",
            marginTop: 10,
            padding: 3,
            background: C.surfaceDark,
            borderRadius: 8,
            border: `1px solid ${C.borderLight}`,
          }}
        >
          {[
            { id: "history", label: "历史会话" },
            { id: "scheduled", label: "任务会话" },
          ].map((tab) => {
            const active = sessionKindTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSessionKindTabChange?.(tab.id)}
                style={{
                  flex: 1,
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 4px",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  background: active ? "#fff" : "transparent",
                  color: active ? C.brand : C.textDim,
                  boxShadow: active ? "0 1px 2px rgba(15,23,42,0.06)" : "none",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
      <div style={listStyle}>
        {visibleSessions.length === 0 && (
          <div style={{ fontSize: 12, color: C.textDim, padding: "12px 8px", lineHeight: 1.6 }}>
            {sessionKindTab === "scheduled"
              ? "还没有执行会话。诊断里点「执行」，或到点/手动跑获客计划，都会出现在这里。"
              : "暂无历史会话，开始对话后会自动保存。"}
          </div>
        )}
        {visibleSessions.map((session) => {
          const active = session.id === activeId && !automationActive;
          const isPending = pendingDeleteId === session.id;
          const run = session.runId ? runs.find((r) => r.id === session.runId) : null;
          const badge = sessionKind(session) === "scheduled"
            ? scheduledSessionBadge(session, run)
            : { failed: false, showDot: false };
          return (
            <div
              key={session.id}
              style={{
                display: "flex",
                alignItems: "stretch",
                gap: 4,
                borderRadius: 8,
                border: `1px solid ${isPending ? "#f87171" : active ? C.brand : C.border}`,
                background: isPending
                  ? "rgba(248,113,113,0.06)"
                  : active
                    ? C.brandSoft
                    : C.surfaceDark,
                transition: "all 0.2s ease",
              }}
            >
              <button
                type="button"
                onClick={() => onSelect(session.id)}
                style={{
                  flex: 1,
                  textAlign: "left",
                  padding: "10px 10px",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  minWidth: 0,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: active ? 600 : 500, color: C.text, marginBottom: 4, lineHeight: 1.4 }}>
                  {session.title || "新对话"}
                </div>
                <div style={{ fontSize: 11, color: C.textDim, lineHeight: 1.45 }}>
                  {sessionKind(session) === "scheduled"
                    ? formatScheduledMeta(session)
                    : formatDate(session.updatedAt)}
                </div>
              </button>
              {sessionKind(session) === "scheduled" && (badge.failed || badge.showDot) ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    paddingRight: 2,
                    flexShrink: 0,
                  }}
                >
                  {badge.failed ? <WarnMark /> : null}
                  {badge.showDot ? <UnreadDot /> : null}
                </div>
              ) : null}
              <button
                type="button"
                title={isPending ? "再次点击确认删除" : "删除会话"}
                onClick={(e) => handleDeleteClick(e, session)}
                style={{
                  width: isPending ? 48 : 28,
                  border: "none",
                  background: isPending ? "rgba(248,113,113,0.15)" : "transparent",
                  color: isPending ? "#ef4444" : C.textDim,
                  cursor: "pointer",
                  fontSize: isPending ? 11 : 14,
                  fontWeight: isPending ? 600 : 400,
                  borderRadius: isPending ? "0 8px 8px 0" : 0,
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                  fontFamily: "inherit",
                }}
              >
                {isPending ? "删除?" : "×"}
              </button>
            </div>
          );
        })}
      </div>
      {confirmSession ? (
        <div
          role="presentation"
          onClick={() => setConfirmSession(null)}
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
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>删除定时任务会话</div>
            <div style={{ fontSize: 13, color: C.textSec, marginTop: 10, lineHeight: 1.7 }}>
              删除「{confirmSession.title || "定时任务会话"}」后，执行历史会保留，但无法再从执行历史跳转到对应会话。确认删除吗？
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
              <button
                type="button"
                onClick={() => setConfirmSession(null)}
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
                  const id = confirmSession.id;
                  setConfirmSession(null);
                  onDelete(id);
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
    </aside>
  );
}
