import { arrivedLabel, arrivedLayer, channelLabel, intentLabel, pathStats, visitorIntents } from "./data.js";

export default function VisitorPath({ visitor, identity = "sample" }) {
  if (!visitor) return null;
  const stats = pathStats(visitor);
  const layer = arrivedLayer(visitor);
  const intents = visitorIntents(visitor);
  const maxStay = Math.max(...visitor.pages.map((p) => p.stay), 1);
  const companyView = identity === "company";
  const who = companyView ? visitor.ip || "—" : visitor.id.toUpperCase();
  const belong = companyView
    ? visitor.company
      ? ` · ${visitor.company}`
      : " · 所属企业未识别"
    : visitor.inbound
      ? ` · 来路词「${visitor.inbound}」`
      : " · 来路词空";

  return (
    <article className="path-card">
      <header>
        <h3>{who} · 当日路径</h3>
        <p>
          {channelLabel(visitor.channel)}
          {belong}
          {` · ${intents.map(intentLabel).join(" / ")}`}
          {visitor.siteSearch.length
            ? ` · 站内搜 ${visitor.siteSearch.join(" / ")}`
            : " · 未站内搜索"}
        </p>
      </header>

      <dl className="path-facts">
        <div>
          <dt>{companyView ? "到达漏斗层" : "当天到达"}</dt>
          <dd>
            <span className={`vtag is-${layer}`}>{arrivedLabel(visitor)}</span>
          </dd>
        </div>
        <div>
          <dt>意图</dt>
          <dd>
            <span className="itag-list">
              {intents.map((id) => (
                <span key={id} className={`itag is-${id}`}>
                  {intentLabel(id)}
                </span>
              ))}
            </span>
          </dd>
        </div>
        <div>
          <dt>落地页</dt>
          <dd>{stats.landName}</dd>
        </div>
        {companyView ? null : (
          <div className="span-2">
            <dt>页序</dt>
            <dd>{stats.line}</dd>
          </div>
        )}
        <div>
          <dt>当天页数</dt>
          <dd className="num">{stats.pageCount}</dd>
        </div>
        <div>
          <dt>总停留</dt>
          <dd className="num">{stats.totalStay}s</dd>
        </div>
      </dl>

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
        <li className={visitor.caught ? "ok" : "no"}>
          落地{visitor.caught ? "接住" : "没接住"}
        </li>
        <li className={visitor.viewed ? "ok" : "no"}>
          {visitor.viewed ? "有效浏览" : "未有效浏览"}
        </li>
        <li className={visitor.bounced ? "no" : "ok"}>
          {visitor.bounced ? "秒退" : "非秒退"}
        </li>
        <li className={visitor.interacted ? "ok" : "no"}>
          {visitor.interacted ? "已转化交互" : "未动手"}
        </li>
        <li className={visitor.led ? "ok" : "no"}>{visitor.led ? "已留资" : "未留资"}</li>
      </ul>
    </article>
  );
}
