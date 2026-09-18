import { useEffect, useRef } from "react";
import { Icon } from "./Icons";

export default function AssistantPanel({
  messages,
  draft,
  busy,
  awaitingConfirm,
  focusPlanToken,
  capabilities,
  onClose,
  onDraftChange,
  onSend,
  onCapabilityClick,
  onConfirmPlan,
}) {
  const listRef = useRef(null);
  const planRef = useRef(null);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, awaitingConfirm]);

  useEffect(() => {
    if (!focusPlanToken || !planRef.current) return;
    planRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [focusPlanToken]);

  return (
    <aside className="assistant-panel" aria-label="运营助手">
      <header className="assistant-header">
        <div className="assistant-avatar" style={{ width: 32, height: 32 }} />
        <div className="title">运营助手</div>
        <button className="close" type="button" onClick={onClose} aria-label="关闭">
          <Icon name="close" size={14} />
        </button>
      </header>

      <div className="assistant-messages" ref={listRef}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            ref={msg.type === "optimize-plan" ? planRef : undefined}
          >
            <MessageBubble
              msg={msg}
              capabilities={capabilities}
              onCapabilityClick={onCapabilityClick}
            />
          </div>
        ))}

        {awaitingConfirm ? (
          <div className="confirm-row">
            <button
              className="confirm-chip"
              type="button"
              disabled={busy}
              onClick={onConfirmPlan}
            >
              确认
            </button>
          </div>
        ) : null}
      </div>

      <div className="assistant-input">
        <div className="input-box">
          <button className="tool-btn" type="button" title="上传图片">
            🖼
          </button>
          <textarea
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            placeholder="可以描述任务或者提问哦"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
          />
          <button
            className="send-btn"
            type="button"
            disabled={busy || !draft.trim()}
            onClick={onSend}
            title="发送"
          >
            ↑
          </button>
        </div>
      </div>
    </aside>
  );
}

function MessageBubble({ msg, capabilities, onCapabilityClick }) {
  if (msg.type === "welcome") {
    return (
      <div className="msg assistant">
        <p className="welcome-title">Hi~ 我是您的专属运营助手，我可以帮您：</p>
        <ul className="cap-list">
          {capabilities.map((item) => (
            <li key={item.label}>
              <button type="button" onClick={() => onCapabilityClick(item.hint)}>
                {item.label}
              </button>
              <span style={{ color: "#bfbfbf" }}>（{item.hint}）</span>
            </li>
          ))}
        </ul>
        <p className="welcome-ask">有什么需要我操作的，向我提问吧！</p>
      </div>
    );
  }

  if (msg.type === "optimize-plan") {
    const title = msg.product?.title || "当前产品";
    return (
      <div className="msg assistant rich">
        <p>
          已定位到该产品，原标题为「{title}」。
        </p>
        <p>
          当前详情已有基础介绍与部分卖点内容，但仍缺少技术原理、安装使用、维护保养、安全事项、售后服务等行业规范板块；同时 HTML
          样式也可升级为更专业的卡片式 SEO 富文本结构。
        </p>
        <p>
          <strong>优化方案如下：</strong>
        </p>
        <ul className="plan-list">
          <li>
            <strong>标题：</strong>
            {title.includes("镀锌")
              ? "镀锌钢板 - 热浸镀锌/电镀锌/合金化镀锌 建筑家电新能源防腐钢材"
              : `${title}｜按行业规范升级的专业详情页标题`}
          </li>
          <li>
            <strong>摘要：</strong>
            {msg.product?.summary ||
              "围绕核心卖点、应用场景与关键规格，输出可直接用于搜索结果展示的专业摘要。"}
          </li>
          <li>
            <strong>正文结构优化：</strong>
            <ul className="plan-sublist">
              <li>优化现有工艺介绍、核心优势、应用场景等板块表述</li>
              <li>保留并规范现有规格参数表的排版结构</li>
              <li>新增技术原理、安装指南、维护保养、安全事项、环保说明、售后服务等板块</li>
              <li>FAQ 升级为默认展开的卡片式问答结构</li>
              <li>整体升级为带内联样式的 SEO 富文本 HTML 结构</li>
            </ul>
          </li>
        </ul>
        <p>是否确认按此方案生成优化稿？请回复「确认」或「继续」。</p>
      </div>
    );
  }

  if (msg.type === "optimize-success") {
    return (
      <div className="msg assistant rich">
        <p>优化稿已成功发布并覆盖原产品内容。</p>
        <ul className="plan-list">
          <li>
            <strong>更新成功，产品 ID：</strong>
            {msg.product?.bizId}
          </li>
          <li>
            <strong>优化内容：</strong>
            已按行业规范补全了技术原理、安装指南、维护保养、安全事项、售后服务、环保说明及
            FAQ 等板块，全面升级为带内联样式的 SEO 富文本结构。
          </li>
        </ul>
        <p>您可以访问原链接查看最新效果，如有需要进一步调整的细节请随时告知。</p>
      </div>
    );
  }

  return (
    <div className={`msg ${msg.role}`}>
      {msg.highlightUrl ? (
        <span>
          {msg.text.split(msg.highlightUrl).map((part, idx, arr) => (
            <span key={idx}>
              {part}
              {idx < arr.length - 1 ? (
                <span className="msg-url">{msg.highlightUrl}</span>
              ) : null}
            </span>
          ))}
        </span>
      ) : (
        msg.text.split("\n").map((line, idx) => <div key={idx}>{line}</div>)
      )}
    </div>
  );
}
