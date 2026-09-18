import { LOSSES, fmtInt, pct, stateOfThrough } from "./data.js";

const VIEW_W = 820;
const VIEW_H = 640;
const CX = 292;
const STAGE_H = 78;
const GAP = 62;
const MAX_W = 500;
const MIN_W = 168;
const TOP = 18;

function stageWidth(count, maxCount) {
  if (!maxCount) return MIN_W;
  return MIN_W + (MAX_W - MIN_W) * (count / maxCount);
}

function trap(cx, y, wTop, wBot, h) {
  const t = wTop / 2;
  const b = wBot / 2;
  return `${cx - t},${y} ${cx + t},${y} ${cx + b},${y + h} ${cx - b},${y + h}`;
}

export default function Funnel({ stages, gates, selectedLoss, onSelectLoss }) {
  const maxCount = Math.max(...stages.map((s) => s.cur), 1);
  const layout = stages.map((s, i) => {
    const w = stageWidth(s.cur, maxCount);
    const y = TOP + i * (STAGE_H + GAP);
    return { ...s, w, y, index: i };
  });

  return (
    <div className="funnel-board">
      <svg
        className="funnel-svg"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="img"
        aria-label="四层转化漏斗，层间为可点击的流失点"
      >
        <defs>
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.05" />
            </feComponentTransfer>
            <feBlend in="SourceGraphic" mode="multiply" />
          </filter>
        </defs>

        {layout.map((s, i) => {
          const next = layout[i + 1];
          const loss = LOSSES[i];
          const selected = Boolean(loss && selectedLoss === loss.id);
          return (
            <g key={s.id}>
              {next && (
                <polygon
                  className={`funnel-neck${selected ? " is-hot" : ""}`}
                  points={trap(CX, s.y + STAGE_H, s.w, next.w, GAP)}
                />
              )}
              <polygon
                className={`funnel-stage is-${s.color}`}
                points={trap(CX, s.y, s.w, s.w, STAGE_H)}
              />
              {next && (
                <line
                  className="funnel-leader"
                  x1={CX + Math.max(s.w, next.w) / 2 + 10}
                  y1={s.y + STAGE_H + GAP / 2}
                  x2={548}
                  y2={s.y + STAGE_H + GAP / 2}
                />
              )}
            </g>
          );
        })}
      </svg>

      <div className="funnel-overlay">
        {layout.map((s) => (
          <div
            key={s.id}
            className={`stage-label is-${s.color}`}
            style={{
              top: `${(s.y / VIEW_H) * 100}%`,
              left: `${((CX - s.w / 2) / VIEW_W) * 100}%`,
              width: `${(s.w / VIEW_W) * 100}%`,
              height: `${(STAGE_H / VIEW_H) * 100}%`,
            }}
          >
            <div className="stage-kicker">{s.hint}</div>
            <div className="stage-name">{s.name}</div>
            <div className="stage-count">
              <span className="num">{fmtInt(s.cur)}</span>
              <span className="unit">人</span>
            </div>
            <div className="stage-prev">上期 {fmtInt(s.prev)}</div>
          </div>
        ))}

        {gates.map((g, i) => {
          const s = layout[i];
          const loss = LOSSES[i];
          const y = s.y + STAGE_H;
          const st = stateOfThrough(g.pass, g.passPrev, loss.id);
          const selected = selectedLoss === loss.id;
          return (
            <button
              key={loss.id}
              type="button"
              className={`loss-ticket${selected ? " is-on" : ""}${st === "异常" ? " is-alert" : ""}`}
              style={{
                top: `${((y + 4) / VIEW_H) * 100}%`,
              }}
              aria-pressed={selected}
              onClick={() => onSelectLoss(selected ? null : loss.id)}
            >
              <span className="loss-stamp">流失点 {loss.seq}</span>
              <span className="loss-title">{loss.title}</span>
              <span className="loss-drop">
                掉 <b>{fmtInt(g.dropped)}</b> 人
              </span>
              <span className="loss-rate">
                {loss.primary} {pct(g.pass)}
                <i>上期 {pct(g.passPrev)}</i>
              </span>
              <span className={`loss-state is-${st}`}>{st}</span>
              <span className="loss-cta">{selected ? "收起明细" : "点进去看明细"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FunnelLegend() {
  return (
    <ol className="funnel-legend">
      {["访问入口", "有效浏览", "转化交互", "成功留资"].map((name, i) => (
        <li key={name}>
          <span className={`dot is-${["blue", "green", "rose", "violet"][i]}`} />
          {name}
        </li>
      ))}
    </ol>
  );
}
