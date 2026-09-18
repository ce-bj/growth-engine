import { useMemo, useState } from "react";
import Funnel, { FunnelLegend } from "./Funnel.jsx";
import DrillPanel from "./DrillPanel.jsx";
import {
  CHANNELS,
  SITE,
  fmtInt,
  getLeadCount,
  getStages,
  pct,
  rate,
  stateOfThrough,
  through,
} from "./data.js";

export default function App() {
  const [channel, setChannel] = useState("site");
  const [lossId, setLossId] = useState("l1");
  const [dim, setDim] = useState("pages");
  const [visitorId, setVisitorId] = useState(null);
  const [pagePath, setPagePath] = useState(null);

  const stages = useMemo(() => getStages(channel), [channel]);
  const gates = useMemo(() => through(stages), [stages]);
  const leads = getLeadCount(channel);
  const viewRate = rate(stages[1].cur, stages[0].cur);
  const viewPrev = rate(stages[1].prev, stages[0].prev);
  const l1 = gates[0];
  const l1State = stateOfThrough(l1.pass, l1.passPrev, "l1");

  function switchChannel(id) {
    setChannel(id);
    setVisitorId(null);
    setPagePath(null);
  }

  function selectLoss(id) {
    setLossId(id);
    setVisitorId(null);
    setPagePath(null);
    if (id) setDim("pages");
  }

  const gate = gates.find((g) => g.lossId === lossId);

  return (
    <div className="page">
      <header className="mast">
        <div>
          <p className="eyebrow">AI 访客行为分析 · 只读评审原型</p>
          <h1>漏斗体检</h1>
          <p className="site">
            {SITE.name}
            <span> · {SITE.origin}</span>
          </p>
        </div>
        <div className="mast-meta">
          <p>{SITE.period}</p>
          <p>{SITE.baseline}</p>
          <p className="watermark">样例数，非现网</p>
        </div>
      </header>

      <section className="headline" aria-label="本期结论">
        <div>
          <span className="hl-k">询盘条数</span>
          <strong className="num">{fmtInt(leads.cur)}</strong>
          <span className="hl-sub">
            上期 {fmtInt(leads.prev)} · 少 {fmtInt(leads.prev - leads.cur)} 条
          </span>
        </div>
        <div>
          <span className="hl-k">有效浏览率</span>
          <strong className="num">{pct(viewRate)}</strong>
          <span className="hl-sub">
            上期 {pct(viewPrev)} · {l1State}
          </span>
        </div>
        <div>
          <span className="hl-k">卡在哪</span>
          <strong>看进去这一层</strong>
          <span className="hl-sub">流失点 1 · 掉 {fmtInt(l1.dropped)} 人</span>
        </div>
        <div>
          <span className="hl-k">漏斗人数</span>
          <strong className="num">{fmtInt(stages[3].cur)}</strong>
          <span className="hl-sub">留资访客 · 条数见左，不拿来当层高</span>
        </div>
      </section>

      <div className="channel-bar" role="tablist" aria-label="漏斗视角">
        {CHANNELS.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={channel === c.id}
            className={channel === c.id ? "is-on" : ""}
            onClick={() => switchChannel(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <FunnelLegend />

      <Funnel
        stages={stages}
        gates={gates}
        selectedLoss={lossId}
        onSelectLoss={selectLoss}
      />

      {lossId ? (
        <DrillPanel
          lossId={lossId}
          channelId={channel}
          dim={dim}
          onDim={setDim}
          visitorId={visitorId}
          onVisitor={setVisitorId}
          pagePath={pagePath}
          onPage={setPagePath}
          gate={gate}
        />
      ) : (
        <p className="hint">点漏斗右侧的流失点工签，看这一层的页面和访客。</p>
      )}
    </div>
  );
}
