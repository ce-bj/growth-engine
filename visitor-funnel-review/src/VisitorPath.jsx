import { channelLabel } from "./data.js";

export default function VisitorPath({ visitor }) {
  if (!visitor) return null;
  const maxStay = Math.max(...visitor.pages.map((p) => p.stay), 1);

  return (
    <article className="path-card">
      <header>
        <h3>{visitor.id.toUpperCase()} · 当日路径</h3>
        <p>
          {channelLabel(visitor.channel)}
          {visitor.inbound ? ` · 来路词「${visitor.inbound}」` : " · 来路词空"}
          {visitor.siteSearch.length
            ? ` · 站内搜 ${visitor.siteSearch.join(" / ")}`
            : " · 未站内搜索"}
        </p>
      </header>
      <ol className="path">
        {visitor.pages.map((p, i) => (
          <li key={`${p.path}-${i}`}>
            <span className="idx">{i + 1}</span>
            <div>
              <div className="pname">{p.name}</div>
              <div className="purl">{p.path}</div>
              <div className="stay-bar" aria-hidden="true">
                <i style={{ width: `${Math.max(8, (p.stay / maxStay) * 100)}%` }} />
              </div>
            </div>
            <div className="pmeta">
              <b>{p.stay}s</b>
              <span>滚动 {(p.scroll * 100).toFixed(0)}%</span>
            </div>
          </li>
        ))}
      </ol>
      <p className="path-note">{visitor.note}</p>
      <ul className="flags">
        <li className={visitor.caught ? "ok" : "no"}>落地{visitor.caught ? "接住" : "没接住"}</li>
        <li className={visitor.viewed ? "ok" : "no"}>
          {visitor.viewed ? "有效浏览" : "未有效浏览"}
        </li>
        <li className={visitor.bounced ? "no" : "ok"}>{visitor.bounced ? "秒退" : "非秒退"}</li>
        <li className={visitor.interacted ? "ok" : "no"}>
          {visitor.interacted ? "已转化交互" : "未动手"}
        </li>
        <li className={visitor.led ? "ok" : "no"}>{visitor.led ? "已留资" : "未留资"}</li>
      </ul>
    </article>
  );
}
