import { useEffect, useState } from "react";
import {
  LOSSES,
  annotatePins,
  channelLabel,
  fmtInt,
  pageColsFor,
  pagesFor,
  pct,
  pinCaption,
  pinSpecFor,
  stateOfThrough,
  stripMetric,
} from "./data.js";

function formatCell(col, row) {
  const v = row[col.key];
  if (col.fmt === "pct") {
    const text = pct(v);
    if (col.prevKey && row[col.prevKey] != null) {
      const dpp = (v - row[col.prevKey]) * 100;
      const sign = dpp > 0 ? "+" : "";
      return (
        <>
          {text}
          <small className="delta">{sign}{dpp.toFixed(1)}pp</small>
        </>
      );
    }
    return text;
  }
  if (col.fmt === "sec") return `${v}s`;
  if (typeof v === "number") return fmtInt(v);
  return v ?? "—";
}

function pinClass(pin) {
  if (pin === "钉这页") return "pin";
  if (pin === "一起变差") return "sync";
  if (pin === "人太少") return "thin";
  return "none";
}

function formatStrip(item) {
  if (!item) return "";
  if (item.fmt === "pct") return pct(item.v);
  if (item.fmt === "sec") return `${item.v}s`;
  if (item.fmt === "int") return fmtInt(item.v);
  return String(item.v);
}

function PageTable({ lossId, slice, channelId, layerState }) {
  const raw = pagesFor(lossId, slice, channelId);
  const spec = pinSpecFor(lossId, slice);
  const rows = annotatePins(raw, layerState, spec);
  const cols = pageColsFor(lossId, slice);
  if (!rows.length) {
    return <p className="empty">这一层还没有按页面切片的样例。</p>;
  }
  return (
    <>
      <p className="pin-caption">{pinCaption(rows, layerState)}</p>
      <div className="table-wrap">
        <table className="grid">
          <thead>
            <tr>
              <th>页面</th>
              {cols.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
              <th>钉哪页</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.path}>
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
                  {row.pin ? (
                    <span className={`pill-pin is-${pinClass(row.pin)}`}>{row.pin}</span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function PageSliceTabs({ slice, onSlice }) {
  return (
    <div className="sub-tabs" role="tablist" aria-label="页面切片">
      <button
        type="button"
        role="tab"
        aria-selected={slice === "page"}
        className={slice === "page" ? "is-on" : ""}
        onClick={() => onSlice("page")}
      >
        页面概览
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={slice === "land"}
        className={slice === "land" ? "is-on" : ""}
        onClick={() => onSlice("land")}
      >
        落地页概览
      </button>
    </div>
  );
}

const SLICE_HINT = {
  page: "按页拆开看：不管是不是进站第一页，只看这一页自己停够没有。",
  land: "按落地页拆开看：只衡量进站第一页。秒退 = 当天只看了 1 页、停不够、也没动手。",
};

const METRIC_GROUPS = [
  { id: "layer", label: "漏斗" },
  { id: "page", label: "页面" },
  { id: "land", label: "落地页" },
];

function MetricChips({ items, lossId, channelId, gate }) {
  return (
    <ul className="metric-strip">
      {items.map((m) => {
        const val = stripMetric(lossId, channelId, m.name, gate);
        return (
          <li key={m.name}>
            <b>{m.name}</b>
            {val ? <em className="metric-val num">{formatStrip(val)}</em> : null}
            <span>{m.role}</span>
          </li>
        );
      })}
    </ul>
  );
}

function MetricBoard({ loss, lossId, channelId, gate }) {
  const grouped = loss.metrics.some((m) => m.group);
  if (!grouped) {
    return (
      <MetricChips
        items={loss.metrics}
        lossId={lossId}
        channelId={channelId}
        gate={gate}
      />
    );
  }
  return (
    <div className="metric-board">
      {METRIC_GROUPS.map((g) => {
        const items = loss.metrics.filter((m) => m.group === g.id);
        if (!items.length) return null;
        return (
          <div key={g.id} className={`metric-group is-${g.id}`}>
            <p className="metric-group-label">{g.label}</p>
            <MetricChips
              items={items}
              lossId={lossId}
              channelId={channelId}
              gate={gate}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function DrillPanel({ lossId, channelId, gate }) {
  const [pageSlice, setPageSlice] = useState("page");
  const loss = LOSSES.find((l) => l.id === lossId);

  useEffect(() => {
    setPageSlice("page");
  }, [lossId]);

  if (!loss || !gate) return null;

  const showPageSlices = lossId === "l1";
  const layerState = stateOfThrough(gate.pass, gate.passPrev);
  const slice = showPageSlices ? pageSlice : "page";

  return (
    <section className="drill" aria-labelledby="drill-title">
      <header className="drill-head">
        <p className="kicker">点进流失点 {loss.seq}</p>
        <h2 id="drill-title">{loss.title}</h2>
        <p className="lead">
          {loss.meaning}。主指标 <b>{loss.primary}</b> {pct(gate.pass)}，上期{" "}
          {pct(gate.passPrev)} · {layerState}。本期掉 {fmtInt(gate.dropped)} 人
          {channelId !== "site" ? ` · 当前视角 ${channelLabel(channelId)}` : ""}。
        </p>
        <p className="sub">{loss.primaryHint}</p>
      </header>

      <MetricBoard loss={loss} lossId={lossId} channelId={channelId} gate={gate} />

      {showPageSlices ? (
        <>
          <PageSliceTabs slice={pageSlice} onSlice={setPageSlice} />
          <p className="slice-hint">{SLICE_HINT[pageSlice]}</p>
        </>
      ) : (
        <p className="slice-hint">对照通过率之后拆页。停留、滚动只作旁证，不单独钉点。</p>
      )}
      <PageTable
        lossId={lossId}
        slice={slice}
        channelId={channelId}
        layerState={layerState}
      />
    </section>
  );
}
