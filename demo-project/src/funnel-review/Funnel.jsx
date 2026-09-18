import { LOSSES, fmtInt, pct, stateOfThrough } from "./data.js";

const VIEW_W = 420;
const VIEW_H = 580;
const CX = 210;
const STAGE_H = 72;
const GAP = 68;
const MAX_W = 360;
const MIN_W = 148;
const TOP = 10;

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
          const next = layout[i + 1];
          const loss = LOSSES[i];
          const y = s.y + STAGE_H;
          const chipW = Math.min(s.w, next.w) * 0.78;
          const st = stateOfThrough(g.pass, g.passPrev);
          const selected = selectedLoss === loss.id;
          return (
            <button
              key={loss.id}
              type="button"
              className={`loss-ticket${selected ? " is-on" : ""}${st === "异常" ? " is-alert" : ""}`}
              style={{
                top: `${((y + GAP / 2) / VIEW_H) * 100}%`,
                left: `${((CX - chipW / 2) / VIEW_W) * 100}%`,
                width: `${(chipW / VIEW_W) * 100}%`,
                transform: "translateY(-50%)",
              }}
              aria-pressed={selected}
              onClick={() => onSelectLoss(selected ? null : loss.id)}
            >
              <span className="loss-stamp">流失点 {loss.seq}</span>
              <span className="loss-drop">
                掉 {fmtInt(g.dropped)} 人
              </span>
              <span className={`loss-state is-${st}`}>{st}</span>
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
