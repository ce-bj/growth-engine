import { useMemo, useState } from "react";
import Funnel, { FunnelLegend } from "./Funnel.jsx";
import DrillPanel from "./DrillPanel.jsx";
import PageCatalog from "./PageCatalog.jsx";
import VisitorModule from "./VisitorModule.jsx";
import {
  CHANNELS,
  INTENTS,
  SITE,
  STUCK_LABEL,
  bottleneck,
  fmtInt,
  getLeadCount,
  getStages,
  pct,
  rate,
  sliceCaption,
  stateOfThrough,
  through,
} from "./data.js";

const MODULES = [
  { id: "funnel", label: "漏斗体检" },
  { id: "path", label: "访客路径" },
];

export default function App({ variant = "full", intentId = null, onIntent }) {
  const [mod, setMod] = useState("funnel");
  const [channel, setChannel] = useState("site");
  const [innerIntent, setInnerIntent] = useState(null);
  const [lossId, setLossId] = useState("l1");
  const hideChrome = variant !== "full";
  const showPath = variant === "path" || (variant === "full" && mod === "path");
  const intent = onIntent ? intentId : innerIntent;

  const stages = useMemo(() => getStages(channel, intent), [channel, intent]);
  const gates = useMemo(() => through(stages), [stages]);
  const leads = getLeadCount(channel, intent);
  const viewRate = rate(stages[1].cur, stages[0].cur);
  const viewPrev = rate(stages[1].prev, stages[0].prev);
  const l1 = gates[0];
  const l1State = stateOfThrough(l1.pass, l1.passPrev);
  const stuck = bottleneck(gates);
  const gate = gates.find((g) => g.lossId === lossId);

  function switchChannel(id) {
    setChannel(id);
  }

  function switchIntent(id) {
    const next = id === intent ? null : id;
    if (onIntent) onIntent(next);
    else setInnerIntent(next);
  }

  function selectLoss(id) {
    if (id) setLossId(id);
  }

  return (
    <div className={hideChrome ? "page is-embed" : "page"}>
      {hideChrome ? null : (
      <>
      <header className="mast">
        <div>
          <p className="eyebrow">AI 访客行为分析 · 只读评审原型</p>
          <h1>访客行为分析</h1>
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

      <nav className="mod-tabs" role="tablist" aria-label="分析模块">
        {MODULES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={mod === m.id}
            className={mod === m.id ? "is-on" : ""}
            onClick={() => setMod(m.id)}
          >
            {m.label}
          </button>
        ))}
      </nav>
      </>
      )}

      {showPath ? (
        <VisitorModule
          embedded={hideChrome}
          channelId={channel}
          onChannel={switchChannel}
          intentId={intent}
          onIntent={switchIntent}
        />
      ) : (
        <>
          {hideChrome ? null : (
          <section
            className={`headline${channel === "site" && !intent ? "" : " is-channel"}`}
            aria-label="本期结论"
          >
            <div>
              <span className="hl-k">询盘条数</span>
              <strong className="num">{fmtInt(leads.cur)}</strong>
              <span className="hl-sub">
                {leads.cur === leads.prev
                  ? "与上期持平"
                  : `上期 ${fmtInt(leads.prev)} · ${leads.cur < leads.prev ? "少" : "多"} ${fmtInt(Math.abs(leads.prev - leads.cur))} 条`}
              </span>
            </div>
            <div>
              <span className="hl-k">有效浏览率</span>
              <strong className="num">{pct(viewRate)}</strong>
              <span className="hl-sub">
                上期 {pct(viewPrev)} · {l1State}
              </span>
            </div>
            {channel === "site" && !intent ? (
              <div>
                <span className="hl-k">卡在哪</span>
                <strong>{stuck ? STUCK_LABEL[stuck.lossId] : "没有明显卡层"}</strong>
                <span className="hl-sub">
                  {stuck
                    ? `流失点 ${stuck.loss.seq} · 掉 ${fmtInt(stuck.dropped)} 人`
                    : "三层通过率相对上期都持平"}
                </span>
              </div>
            ) : null}
            <div>
              <span className="hl-k">漏斗人数</span>
              <strong className="num">{fmtInt(stages[3].cur)}</strong>
              <span className="hl-sub">留资访客 · 条数见左，不拿来当层高</span>
            </div>
          </section>
          )}

          <div className="filter-row">
            <span className="filter-label">渠道</span>
            <div className="channel-bar" role="tablist" aria-label="按渠道切漏斗">
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
          </div>
          <div className="filter-row">
            <span className="filter-label">访客意图</span>
            <div className="channel-bar" role="tablist" aria-label="按访客意图切漏斗">
              <button
                type="button"
                role="tab"
                aria-selected={!intent}
                className={!intent ? "is-on" : ""}
                onClick={() => switchIntent(null)}
              >
                全部
              </button>
              {INTENTS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={intent === item.id}
                  className={intent === item.id ? "is-on" : ""}
                  onClick={() => switchIntent(item.id)}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
          <p className="slice-hint">
            当前 {sliceCaption(channel, intent)}。意图按窗口最深一级计。
          </p>

          <FunnelLegend />

          <div className="workspace">
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
                intentId={intent}
                gate={gate}
              />
            ) : (
              <p className="hint drill-placeholder">点左侧流失点，右侧看这一层关键指标。</p>
            )}
          </div>

          <PageCatalog channelId={channel} intentId={intent} />
        </>
      )}
    </div>
  );
}
