import { useEffect, useState } from "react";

const STAY = {
  marketing: "留在智能营销页",
  assistant: "留在 AI 运营助手",
  content: "留在内容发布",
};

function decodeTask(value) {
  try {
    const binary = atob(value);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const task = JSON.parse(new TextDecoder().decode(bytes));
    if (!task || typeof task.title !== "string" || !task.title) return null;
    return task;
  } catch {
    return null;
  }
}

function readTask() {
  return decodeTask(new URLSearchParams(window.location.search).get("task") || "");
}

export default function AgentTaskDetail() {
  const [task, setTask] = useState(() => readTask());

  useEffect(() => {
    const onPop = () => setTask(readTask());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  if (!task) return null;

  function stay() {
    const url = new URL(window.location.href);
    url.searchParams.delete("task");
    url.searchParams.delete("handoff");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    setTask(null);
  }

  const requirements = Array.isArray(task.requirements)
    ? task.requirements.filter((item) => typeof item === "string" && item)
    : [];

  return (
    <div style={overlay}>
      <style>{`.agent-task-detail dt{margin:0;font-size:12px;color:#64748b}.agent-task-detail dd{margin:2px 0 0;font-size:14px}`}</style>
      <article className="agent-task-detail" style={card}>
        <p style={kicker}>任务明细</p>
        <h1 style={title}>{task.title}</h1>
        {task.summary ? <p style={summary}>{task.summary}</p> : null}
        <dl style={meta}>
          {task.stage ? (
            <div>
              <dt>当前步骤</dt>
              <dd>{task.stage}</dd>
            </div>
          ) : null}
          {task.executor ? (
            <div>
              <dt>执行</dt>
              <dd>{task.executor}</dd>
            </div>
          ) : null}
          {task.from ? (
            <div>
              <dt>来源</dt>
              <dd>{task.from}</dd>
            </div>
          ) : null}
          {task.approvedAt ? (
            <div>
              <dt>批准</dt>
              <dd>{task.approvedAt}</dd>
            </div>
          ) : null}
        </dl>
        {task.target ? (
          <p style={note}>
            <b>对象 </b>
            {task.target}
          </p>
        ) : null}
        {task.note ? <p style={note}>{task.note}</p> : null}
        {requirements.length ? (
          <>
            <h2 style={sub}>要做的事</h2>
            <ol style={list}>
              {requirements.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          </>
        ) : null}
        {task.extra ? (
          <p style={note}>
            <b>额外补充 </b>
            {task.extra}
          </p>
        ) : null}
        <button type="button" style={button} onClick={stay}>
          {STAY[task.view] || "留在当前智能体"}
        </button>
      </article>
    </div>
  );
}

const overlay = {
  position: "fixed",
  inset: 0,
  zIndex: 4000,
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  overflow: "auto",
  padding: "48px 20px",
  background: "rgba(15, 23, 42, 0.28)",
};

const card = {
  width: "min(640px, 100%)",
  padding: "28px 32px",
  borderRadius: 16,
  background: "#fff",
  boxShadow: "0 18px 50px rgba(15, 23, 42, 0.16)",
  color: "#1e293b",
  fontFamily: "'Noto Sans SC', sans-serif",
};

const kicker = { margin: 0, fontSize: 13, letterSpacing: "0.04em", color: "#2f8bb8" };
const title = { margin: "8px 0 0", fontSize: 24, lineHeight: 1.35 };
const summary = { margin: "12px 0 0", fontSize: 15, lineHeight: 1.7 };
const meta = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "12px 20px",
  margin: "18px 0 0",
};
const note = { margin: "16px 0 0", fontSize: 14, lineHeight: 1.7, color: "#334155" };
const sub = { margin: "20px 0 0", fontSize: 15 };
const list = { margin: "8px 0 0", paddingLeft: 20, fontSize: 14, lineHeight: 1.7 };
const button = {
  marginTop: 22,
  border: 0,
  borderRadius: 8,
  padding: "8px 16px",
  background: "#2f8bb8",
  color: "#fff",
  fontSize: 14,
  cursor: "pointer",
};
