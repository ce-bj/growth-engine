import { useEffect, useState } from "react";
import VisitorPath from "./VisitorPath.jsx";
import {
  CHANNELS,
  INTENTS,
  LAYERS,
  arrivedLabel,
  arrivedLayer,
  channelLabel,
  intentLabel,
  pathStats,
  visitorIntents,
  visitorsListed,
} from "./data.js";

export default function VisitorModule({ channelId, onChannel, visitorId, onPick, embedded }) {
  const [layerId, setLayerId] = useState(null);
  const [intentId, setIntentId] = useState(null);
  const rows = visitorsListed(channelId, layerId, intentId);
  const active = rows.find((v) => v.id === visitorId) ?? null;
  const fullRoster = Boolean(embedded);

  useEffect(() => {
    const list = visitorsListed(channelId, layerId, intentId);
    if (!list.some((v) => v.id === visitorId)) {
      onPick(list[0]?.id ?? null);
    }
  }, [channelId, layerId, intentId, visitorId, onPick]);

  return (
    <section className="visitor-mod" aria-labelledby={embedded ? undefined : "path-title"}>
      {embedded ? null : (
        <header className="drill-head">
          <p className="kicker">子模块</p>
          <h2 id="path-title">访客路径</h2>
          <p className="lead">
            抽样看人当天怎么走。一人一天一条路径，按访问顺序排，重复页不去重、不拆成多次访问。
            当天到达是漏斗四层里最远走到的那一层。意图可以多个：来路词、广告词、站内搜先按词（一条词可中多类），页停留满 15 秒再按页类补；不明不和其他类并存。
            当前 {rows.length} 人。
          </p>
        </header>
      )}

      <div className="channel-bar" role="tablist" aria-label="路径渠道">
        {CHANNELS.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={channelId === c.id}
            className={channelId === c.id ? "is-on" : ""}
            onClick={() => onChannel(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="filter-row">
        <span className="filter-label">{fullRoster ? "到达漏斗层" : "当天到达"}</span>
        <div className="sub-tabs" role="tablist" aria-label={fullRoster ? "到达漏斗层" : "当天到达"}>
          <button
            type="button"
            role="tab"
            aria-selected={!layerId}
            className={!layerId ? "is-on" : ""}
            onClick={() => setLayerId(null)}
          >
            全部
          </button>
          {LAYERS.map((layer) => (
            <button
              key={layer.id}
              type="button"
              role="tab"
              aria-selected={layerId === layer.id}
              className={layerId === layer.id ? "is-on" : ""}
              onClick={() => setLayerId(layer.id)}
            >
              {layer.name}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-row">
        <span className="filter-label">意图</span>
        <div className="sub-tabs" role="tablist" aria-label="意图">
          <button
            type="button"
            role="tab"
            aria-selected={!intentId}
            className={!intentId ? "is-on" : ""}
            onClick={() => setIntentId(null)}
          >
            全部
          </button>
          {INTENTS.map((intent) => (
            <button
              key={intent.id}
              type="button"
              role="tab"
              aria-selected={intentId === intent.id}
              className={intentId === intent.id ? "is-on" : ""}
              onClick={() => setIntentId(intent.id)}
            >
              {intent.name}
            </button>
          ))}
        </div>
      </div>

      <div className="path-workspace">
        <div className="table-wrap">
          {rows.length ? (
            <table className="grid path-grid">
              <thead>
                <tr>
                  <th>{fullRoster ? "访客IP" : "访客"}</th>
                  <th>渠道</th>
                  <th>{fullRoster ? "所属企业" : "来路词"}</th>
                  <th>意图</th>
                  <th>落地页</th>
                  {fullRoster ? null : <th>页序</th>}
                  <th>页数</th>
                  <th>总停留</th>
                  <th>{fullRoster ? "到达漏斗层" : "当天到达"}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((v) => {
                  const s = pathStats(v);
                  const layer = arrivedLayer(v);
                  return (
                    <tr
                      key={v.id}
                      className={active?.id === v.id ? "is-active" : ""}
                      tabIndex={0}
                      role="button"
                      aria-pressed={active?.id === v.id}
                      onClick={() => onPick(v.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onPick(v.id);
                        }
                      }}
                    >
                      <td className="num">{fullRoster ? v.ip || "—" : v.id.toUpperCase()}</td>
                      <td>{channelLabel(v.channel)}</td>
                      <td>{fullRoster ? v.company || "未识别" : v.inbound || "—"}</td>
                      <td className="intent-cell">
                        <span className="itag-list">
                          {visitorIntents(v).map((id) => (
                            <span key={id} className={`itag is-${id}`}>
                              {intentLabel(id)}
                            </span>
                          ))}
                        </span>
                      </td>
                      <td>
                        <div className="page-name">{s.landName}</div>
                        <div className="page-meta">{s.landType}</div>
                      </td>
                      {fullRoster ? null : <td className="path-line">{s.line}</td>}
                      <td className="num">{s.pageCount}</td>
                      <td className="num">{s.totalStay}s</td>
                      <td>
                        <span className={`vtag is-${layer}`}>{arrivedLabel(v)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="empty">{fullRoster ? "这个筛选下没有访客。" : "这个筛选下没有抽到样例访客。"}</p>
          )}
        </div>
        {active ? (
          <VisitorPath visitor={active} identity={fullRoster ? "company" : "sample"} />
        ) : (
          <p className="empty aside">表里点一位访客，看当天每一页的停留和滚动。</p>
        )}
      </div>
    </section>
  );
}
