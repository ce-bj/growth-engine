import { C } from "../theme";

const COPY = {
  概况: {
    kicker: "数字门户 · 模拟页",
    title: "概况",
    hint: "这页只占门户位置，不放运营助手。要对话请到增长工作台，点顶栏「AI运营助手」。",
  },
  客户管理: {
    kicker: "数字门户 · 模拟页",
    title: "客户管理",
    hint: "这页只占门户位置，不放运营助手。线索和跟进请到增长工作台的「线索管理」。",
  },
};

export default function BlankPortalPage({ title, onOpenWorkbench }) {
  const copy = COPY[title] || {
    kicker: "数字门户 · 模拟页",
    title,
    hint: "这页只占门户位置，不放运营助手。",
  };

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: C.surfaceDark,
        padding: 32,
      }}
    >
      <div
        style={{
          width: "min(520px, 100%)",
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: "40px 36px",
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.04em",
            color: C.brand,
            marginBottom: 10,
          }}
        >
          {copy.kicker}
        </div>
        <h1
          style={{
            margin: "0 0 10px",
            fontSize: 24,
            fontWeight: 700,
            color: C.text,
            lineHeight: 1.3,
          }}
        >
          {copy.title}
        </h1>
        <p
          style={{
            margin: "0 0 24px",
            fontSize: 14,
            lineHeight: 1.7,
            color: C.textSec,
          }}
        >
          {copy.hint}
        </p>
        {typeof onOpenWorkbench === "function" ? (
          <button
            type="button"
            onClick={onOpenWorkbench}
            style={{
              appearance: "none",
              border: "none",
              background: C.brand,
              color: "#fff",
              borderRadius: 8,
              padding: "10px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            打开增长工作台
          </button>
        ) : null}
      </div>
    </div>
  );
}
