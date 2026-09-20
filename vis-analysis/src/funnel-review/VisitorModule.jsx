import { useEffect, useState } from "react";
import WalkDetail, { Steps } from "./VisitorPath.jsx";
import {
  CHANNELS,
  INTENTS,
  fmtInt,
  intentLabel,
  pct,
  walksListed,
} from "./data.js";

export default function VisitorModule({
  channelId,
  onChannel,
  embedded,
  intentId,
  onIntent,
}) {
  const rows = walksListed(channelId, intentId);
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const [walkId, setWalkId] = useState(null);

  useEffect(() => {
    const list = walksListed(channelId, intentId);
    if (walkId && !list.some((row) => row.id === walkId)) {
      setWalkId(null);
    }
  }, [channelId, intentId, walkId]);

  return (
    <section className="visitor-mod" aria-labelledby={embedded ? undefined : "path-title"}>
      {embedded ? null : (
        <header className="drill-head">
          <p className="kicker">子模块</p>
          <h2 id="path-title">访客路径</h2>
          <p className="lead">
            一期按页序聚合，不展示个人。相同页面类型序列算一条。意图筛的是人，同一条页序可以有好几档。点开链路看具体页。人数不足 5 不出。
          </p>
        </header>
      )}

      <div className="filter-row">
        <span className="filter-label">渠道</span>
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
      </div>

      <div className="filter-row">
        <span className="filter-label">看哪类人</span>
        <div className="channel-bar" role="tablist" aria-label="按访客意图筛走过这些页序的人">
          <button
            type="button"
            role="tab"
            aria-selected={!intentId}
            className={!intentId ? "is-on" : ""}
            onClick={() => onIntent(null)}
          >
            全部
          </button>
          {INTENTS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={intentId === item.id}
              className={intentId === item.id ? "is-on" : ""}
              onClick={() => onIntent(item.id)}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      <p className="slice-hint">
        {rows.length
          ? intentId
            ? `${intentLabel(intentId)}走过 ${rows.length} 条页序，共 ${fmtInt(total)} 人。点一条看具体页。`
            : `当前 ${fmtInt(total)} 人、${rows.length} 条页序。意图筛的是人，同一条页序可以有好几档。`
          : "这个筛选下没有满 5 人的页序。"}
      </p>

      <ol className="walk-list">
        {rows.map((row, index) => {
          const on = walkId === row.id;
          const share = total ? row.count / total : 0;
          const panelId = `walk-detail-${row.id}`;
          return (
            <li key={row.id} className={`walk-item${on ? " is-on" : ""}`}>
              <button
                type="button"
                className={`walk-row${on ? " is-on" : ""}`}
                aria-expanded={on}
                aria-controls={panelId}
                onClick={() => setWalkId(on ? null : row.id)}
              >
                <span className="walk-rank">{index + 1}</span>
                <div className="walk-main">
                  <Steps types={row.types} compact />
                  <p className="walk-read">{row.implied}</p>
                  {!intentId && row.mix.length > 1 ? (
                    <p className="walk-mix">
                      {row.mix.map((item) => (
                        <span key={item.id}>
                          {item.name}{" "}
                          <b className="num">{fmtInt(item.count)}</b>
                        </span>
                      ))}
                    </p>
                  ) : null}
                </div>
                <div className="walk-n">
                  <b className="num">{fmtInt(row.count)}</b>
                  <span>人 · {pct(share)}</span>
                  <span className="walk-bar" aria-hidden="true">
                    <i style={{ width: `${Math.max(8, share * 100)}%` }} />
                  </span>
                </div>
                <span className="walk-caret" aria-hidden="true">
                  {on ? "▲" : "▼"}
                </span>
              </button>
              {on ? (
                <div id={panelId} className="walk-detail-wrap">
                  <WalkDetail walk={row} />
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
