import { C } from "../theme";

function boundaryLabel(boundary) {
  if (boundary === "advice") return "只出方案";
  if (boundary === "auto") return "自动执行";
  return "确认后执行";
}

const cardStyle = {
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  background: "#fff",
  padding: "12px 14px",
  maxWidth: "min(100%, 520px)",
};

const btnBase = {
  borderRadius: 6,
  padding: "5px 12px",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
};

export function OpsTaskCards({ tasks, onExecute, onOpenRun }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
      {(tasks || []).map((task) => {
        const advice = task.boundary === "advice";
        const started = task.status === "running" || task.status === "done";
        return (
          <div key={task.id} style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{task.title}</div>
              <span style={{
                fontSize: 10,
                border: `1px solid ${C.border}`,
                borderRadius: 4,
                padding: "1px 6px",
                color: C.textSec,
              }}
              >
                {boundaryLabel(task.boundary)}
              </span>
              {task.status === "running" ? (
                <span style={{ fontSize: 11, color: C.brand, fontWeight: 600 }}>执行中</span>
              ) : null}
              {task.status === "done" ? (
                <span style={{ fontSize: 11, color: C.success, fontWeight: 600 }}>草稿已出</span>
              ) : null}
            </div>
            {advice ? (
              <div style={{ fontSize: 12, color: C.textSec, lineHeight: 1.6 }}>{task.note}</div>
            ) : (
              <div style={{ fontSize: 12, color: C.textSec, lineHeight: 1.7 }}>
                <div>对象　{task.objectLabel}</div>
                <div>已填　{task.filled}</div>
                <div>走　　修改产品 · {task.stopAt}</div>
                <div style={{ fontSize: 11, color: C.textDim, marginTop: 4 }}>
                  档案里主推型号已带上，不用再问。
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              {advice ? (
                <span style={{ ...btnBase, border: `1px dashed ${C.border}`, color: C.textDim, background: "#fff", cursor: "default" }}>
                  没有执行键
                </span>
              ) : started ? (
                <button
                  type="button"
                  style={{ ...btnBase, border: "none", background: C.brand, color: "#fff" }}
                  onClick={() => onOpenRun?.(task)}
                >
                  查看这次执行
                </button>
              ) : (
                <button
                  type="button"
                  style={{ ...btnBase, border: "none", background: C.brand, color: "#fff" }}
                  onClick={() => onExecute?.(task)}
                >
                  执行
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
