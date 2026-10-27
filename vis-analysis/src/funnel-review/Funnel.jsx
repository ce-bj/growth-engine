import { LOSSES, fmtInt, pct, rate, stateOfThrough } from "./data.js";

function barWidth(value, scale) {
  if (!scale || value <= 0) return 0;
  return (value / scale) * 100;
}

function barStyle(value, scale) {
  const width = barWidth(value, scale);
  if (!width) return { width: "0%" };
  return { width: `${width}%`, minWidth: 14 };
}

export default function Funnel({ stages, gates, activeLoss, onPreview, onPin }) {
  const scale = Math.max(...stages.flatMap((s) => [s.cur, s.prev]), 1);
  const entry = stages[0]?.cur || 1;

  return (
    <div
      className="flow"
      onKeyDown={(event) => {
        if (event.key === "Escape") onPin(null);
      }}
    >
      <p className="flow-note">条长按人数。深色是本期，浅色拖尾是上期。</p>
      <ol className="flow-list">
        {stages.map((stage, index) => {
          const incoming = index > 0 ? LOSSES[index - 1] : null;
          const outgoing = LOSSES[index];
          const gate = gates[index];
          const pointedHere = incoming && activeLoss === incoming.id;
          return (
            <li key={stage.id} className="flow-item">
              <article
                className={`flow-stage${pointedHere ? " is-to" : ""}`}
                onMouseEnter={() => {
                  if (incoming) onPreview(incoming.id);
                }}
              >
                <span className="flow-idx" aria-hidden="true">
                  {index + 1}
                </span>
                <div className="flow-main">
                  <div className="flow-name">{stage.name}</div>
                  <div className="flow-track" aria-hidden="true">
                    <div className="flow-prev" style={barStyle(stage.prev, scale)} />
                    <div className="flow-fill" style={barStyle(stage.cur, scale)} />
                  </div>
                </div>
                <div className="flow-fig">
                  <strong className="num">
                    {fmtInt(stage.cur)}
                    <span>人</span>
                  </strong>
                  <small>
                    占入口 {pct(rate(stage.cur, entry))} · 上期 {fmtInt(stage.prev)}
                  </small>
                </div>
              </article>

              {outgoing && gate ? (
                <LossSeam
                  loss={outgoing}
                  gate={gate}
                  fromName={stage.name}
                  toName={stages[index + 1]?.name}
                  active={activeLoss === outgoing.id}
                  onPreview={onPreview}
                  onPin={onPin}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function LossSeam({ loss, gate, fromName, toName, active, onPreview, onPin }) {
  const state = stateOfThrough(gate.pass, gate.passPrev);
  const label = `流失点 ${loss.seq}，${fromName}到${toName}，掉 ${fmtInt(gate.dropped)} 人，${state}。指向后在右侧展开，点击可固定`;
  return (
    <div className={`flow-seam${active ? " is-on" : ""}`} data-state={state}>
      <button
        type="button"
        className="flow-node"
        aria-pressed={active}
        aria-label={label}
        onMouseEnter={() => onPreview(loss.id)}
        onFocus={() => onPreview(loss.id)}
        onClick={() => onPin(loss.id)}
      >
        <span className="flow-dot" aria-hidden="true" />
      </button>
      <span className="flow-seam-line" aria-hidden="true" />
    </div>
  );
}
