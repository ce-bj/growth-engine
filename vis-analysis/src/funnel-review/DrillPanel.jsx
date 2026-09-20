import {
  LOSSES,
  fmtInt,
  pct,
  sliceCaption,
  stateOfThrough,
  stripMetric,
} from "./data.js";

function formatStrip(item) {
  if (!item) return "—";
  if (item.fmt === "pct") return pct(item.v);
  if (item.fmt === "sec") return `${item.v}秒`;
  if (item.fmt === "int") return fmtInt(item.v);
  return String(item.v);
}

const METRIC_GROUPS = [
  { id: "layer", label: "漏斗" },
  { id: "page", label: "页面" },
  { id: "land", label: "落地页" },
];

function MetricRows({ items, lossId, channelId, intentId, gate }) {
  if (!items.length) return null;
  return (
    <dl className="kpi-rows">
      {items.map((m) => {
        const val = stripMetric(lossId, channelId, m.name, gate, intentId);
        return (
          <div key={m.name} className="kpi-row" title={m.role || undefined}>
            <dt>{m.name}</dt>
            <dd className="num">{formatStrip(val)}</dd>
          </div>
        );
      })}
    </dl>
  );
}

export default function DrillPanel({ lossId, channelId, intentId, gate }) {
  const loss = LOSSES.find((l) => l.id === lossId);
  if (!loss || !gate) return null;
  const layerState = stateOfThrough(gate.pass, gate.passPrev);
  const grouped = loss.metrics.some((m) => m.group);
  const rest = loss.metrics.filter(
    (m) =>
      m.name !== loss.primary &&
      m.role !== "定位主指标" &&
      m.name !== "留资访客 / 转化交互访客",
  );
  const dpp =
    typeof gate.pass === "number" && typeof gate.passPrev === "number"
      ? (gate.pass - gate.passPrev) * 100
      : null;

  return (
    <section className="drill is-kpi" aria-labelledby="drill-title">
      <header className="drill-head">
        <div className="kpi-head">
          <p className="kicker">流失点 {loss.seq} · 关键指标</p>
          <span className={`kpi-badge is-${layerState}`}>{layerState}</span>
        </div>
        <h2 id="drill-title">{loss.title}</h2>
        <p className="kpi-meta">
          {loss.meaning}
          <span>本期掉 {fmtInt(gate.dropped)} 人</span>
          <span>{sliceCaption(channelId, intentId)}</span>
        </p>
      </header>

      <div className="kpi-hero">
        <span className="kpi-hero-label">{loss.primary}</span>
        <strong className="kpi-hero-value num">{pct(gate.pass)}</strong>
        <p className="kpi-hero-side">
          <span>上期 {pct(gate.passPrev)}</span>
          {dpp != null && Math.abs(dpp) >= 0.05 ? (
            <span className={dpp < 0 ? "is-down" : "is-up"}>
              {dpp > 0 ? "+" : ""}
              {dpp.toFixed(1)}pp
            </span>
          ) : null}
        </p>
        <p className="kpi-hero-hint">{loss.primaryHint}</p>
      </div>

      {grouped
        ? METRIC_GROUPS.map((g) => {
            const items = rest.filter((m) => m.group === g.id);
            if (!items.length) return null;
            return (
              <div key={g.id} className="kpi-block">
                <h3 className="kpi-block-label">{g.label}</h3>
                <MetricRows
                  items={items}
                  lossId={lossId}
                  channelId={channelId}
                  intentId={intentId}
                  gate={gate}
                />
              </div>
            );
          })
        : (
            <div className="kpi-block">
              <MetricRows
                items={rest}
                lossId={lossId}
                channelId={channelId}
                intentId={intentId}
                gate={gate}
              />
            </div>
          )}
    </section>
  );
}
