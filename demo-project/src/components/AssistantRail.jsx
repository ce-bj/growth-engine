import { Icon } from "./Icons";

export default function AssistantRail({ onExpand }) {
  return (
    <aside className="assistant-rail" aria-label="运营助手收起态">
      <button className="assistant-avatar-wrap" type="button" onClick={onExpand}>
        <div className="assistant-avatar" title="运营助手" />
        <span className="assistant-badge">运营助手</span>
      </button>

      <button className="rail-item" type="button">
        <Icon name="biz" size={18} />
        <span>业务</span>
        <span className="badge">99+</span>
      </button>
      <button className="rail-item" type="button">
        <Icon name="help" size={18} />
        <span>帮助</span>
      </button>
      <button className="rail-item" type="button">
        <Icon name="totop" size={18} />
        <span>回顶</span>
      </button>

      <button className="rail-expand" type="button" onClick={onExpand} title="展开运营助手">
        <Icon name="right" size={12} />
      </button>
    </aside>
  );
}
