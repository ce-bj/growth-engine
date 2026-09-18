import VisitorPath from "./VisitorPath.jsx";
import {
  LOSSES,
  PAGE_COLS,
  channelLabel,
  fmtInt,
  pagesFor,
  pct,
  visitorsFor,
} from "./data.js";

function formatCell(col, row) {
  const v = row[col.key];
  if (col.fmt === "pct") return pct(v);
  if (col.fmt === "sec") return `${v}s`;
  if (typeof v === "number") return fmtInt(v);
  return v ?? "—";
}

function PageTable({ lossId, onPickPage, activePath }) {
  const rows = pagesFor(lossId);
  const cols = PAGE_COLS[lossId] || [];
  if (!rows.length) {
    return <p className="empty">这一层还没有按页面切片的样例。</p>;
  }
  return (
    <div className="table-wrap">
      <table className="grid">
        <thead>
          <tr>
            <th>页面</th>
            {cols.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
            <th>三态</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.path}
              className={activePath === row.path ? "is-active" : ""}
              onClick={() => onPickPage(row.path === activePath ? null : row.path)}
            >
              <td>
                <div className="page-name">{row.name}</div>
                <div className="page-meta">
                  {row.type} · {row.path}
                </div>
              </td>
              {cols.map((c) => (
                <td key={c.key} className="num">
                  {formatCell(c, row)}
                </td>
              ))}
              <td>
                <span className={`pill-state is-${row.state}`}>{row.state}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VisitorList({ channelId, lossId, activeId, onPick }) {
  const rows = visitorsFor(channelId, lossId);
  if (!rows.length) {
    return <p className="empty">这个渠道在这一层没有抽到样例访客。</p>;
  }
  return (
    <div className="visitor-split">
      <ul className="visitor-list">
        {rows.map((v) => (
          <li key={v.id}>
            <button
              type="button"
              className={`visitor-row${activeId === v.id ? " is-on" : ""}`}
              onClick={() => onPick(activeId === v.id ? null : v.id)}
            >
              <span className="vid">{v.id.toUpperCase()}</span>
              <span className="vch">{channelLabel(v.channel)}</span>
              <span className={`vtag is-${v.tag}`}>{v.tag}</span>
              <span className="vland">{v.pages[0]?.name}</span>
              <span className="vstay">{v.pages[0]?.stay}s</span>
            </button>
          </li>
        ))}
      </ul>
      {activeId ? (
        <VisitorPath visitor={rows.find((v) => v.id === activeId)} />
      ) : (
        <p className="empty aside">点一位访客，看当天页序和停留。</p>
      )}
    </div>
  );
}

export default function DrillPanel({
  lossId,
  channelId,
  dim,
  onDim,
  visitorId,
  onVisitor,
  pagePath,
  onPage,
  gate,
}) {
  const loss = LOSSES.find((l) => l.id === lossId);
  if (!loss || !gate) return null;

  return (
    <section className="drill" aria-labelledby="drill-title">
      <header className="drill-head">
        <p className="kicker">点进流失点 {loss.seq}</p>
        <h2 id="drill-title">{loss.title}</h2>
        <p className="lead">
          {loss.meaning}。主指标 <b>{loss.primary}</b> {pct(gate.pass)}，上期{" "}
          {pct(gate.passPrev)}。本期掉 {fmtInt(gate.dropped)} 人
          {channelId !== "site" ? ` · 当前视角 ${channelLabel(channelId)}` : ""}。
        </p>
        <p className="sub">{loss.primaryHint}</p>
      </header>

      <ul className="metric-strip">
        {loss.metrics.map((m) => (
          <li key={m.name}>
            <b>{m.name}</b>
            <span>{m.role}</span>
          </li>
        ))}
      </ul>

      <div className="dim-tabs" role="tablist" aria-label="下钻维度">
        <button
          type="button"
          role="tab"
          aria-selected={dim === "pages"}
          className={dim === "pages" ? "is-on" : ""}
          onClick={() => onDim("pages")}
        >
          按页面
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={dim === "visitors"}
          className={dim === "visitors" ? "is-on" : ""}
          onClick={() => onDim("visitors")}
        >
          按访客
        </button>
      </div>

      {dim === "pages" ? (
        <PageTable lossId={lossId} onPickPage={onPage} activePath={pagePath} />
      ) : (
        <VisitorList
          channelId={channelId}
          lossId={lossId}
          activeId={visitorId}
          onPick={onVisitor}
        />
      )}
    </section>
  );
}
