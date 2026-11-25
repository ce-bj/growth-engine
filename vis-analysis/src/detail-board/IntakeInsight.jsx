import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Button, Descriptions, Segmented, Table, Tag } from "antd";
import { BRIEFS, RULE_CHECKS, TRACKING, WEEKS } from "../diagnosisPeriod.js";
import { fmtInt, pct, rateBrokeDown, through } from "../funnel-review/data.js";
import { getMcpBoard } from "./mcpBoardData.js";

/** 建议目标是经营参考，不随周次改口径。有效浏览对标上周曾达到的 40%。 */
export const LOSS_PLAN = [
  {
    id: "l1",
    action: "提升有效浏览",
    fromTo: "进站 → 有效浏览",
    target: 0.4,
    pages: "「CNC-6061 铝支架详情页」和「Q3 OEM 落地页」",
  },
  {
    id: "l2",
    action: "提升转化交互",
    fromTo: "有效浏览 → 转化交互",
    target: 0.2,
  },
  {
    id: "l3",
    action: "提升留资完成",
    fromTo: "转化交互 → 成功留资",
    target: 0.45,
  },
];

const FINDINGS = {
  l1: [
    {
      key: "t-detail",
      title: "铝支架详情页留不住来询价的人",
      cause: "访客搜索 CNC 6061 询价进站，但首屏只有品牌口号，公差参数表压在第三屏且首屏无询价入口。",
      evidence: "影响 420 人 · 当前有效浏览率 21.9%（建议 ≥ 40.0%）",
    },
    {
      key: "t-landing",
      title: "点了询价广告的人打开的是讲品牌的页面",
      cause: "访客搜的是询价，打开的首屏却是工厂航拍和产能口号，没有代表型号、打样周期，也没有上传图纸的入口。",
      evidence: "影响 210 人 · 85.3% 跳失（建议把跳失压到 35% 以下）",
    },
    {
      key: "k-sample",
      title: "想看打样交期的人进了产品列表",
      cause: "访客搜的是 48 小时打样，进站后打开的是综合产品列表，列表上只有缩略图，没有交期说明。",
      evidence: "影响 64 人 · 继续往下看的人只占 25%",
    },
  ],
  l2: [
    {
      key: "t-article",
      title: "站内搜索图纸格式和氧化膜厚度，没有结果",
      cause: "访客在站内搜图纸格式和阳极氧化厚度，结果是空的，搜完就离开。知识库里已有工艺规范，还没写成能搜到的页面。",
      evidence: "16 次无结果搜索 · 56% 搜完即走",
    },
    {
      key: "t-plan",
      title: "零结果词缺少持续技术专栏承接",
      cause: "图纸格式和膜厚这两个词不是发一篇就能补上，知识库里已有依据，官网还没有按这些词持续更新的专栏。",
      evidence: "有原词的搜索集中在 custom bracket drawing dwg 和 anodizing thickness 6061",
    },
  ],
  l3: [],
};

function rateText(value) {
  return value == null || !Number.isFinite(value) ? "" : pct(value);
}

function pageLabel(row) {
  if (row.name && !String(row.name).startsWith("/")) return row.name;
  return row.type || row.name;
}

const NON_BIZ_LAND = new Set(["招聘", "站内搜索页", "下载"]);

function isBusinessLand(row) {
  if (NON_BIZ_LAND.has(row.type)) return false;
  const text = `${row.name || ""} ${row.url || ""}`.toLowerCase();
  return !text.includes("招聘") && !text.includes("jobposting") && !text.includes("/job");
}

const DIAGNOSIS_LOSS_LANDS = [
  {
    url: "https://www.demo-cnc-oem.com/products/cnc-6061-bracket",
    name: "铝支架详情页",
    type: "产品详情",
    landUv: 420,
    bounceUv: 328,
    bounce: 0.781,
    catchRate: 0.219,
    landStay: 11,
  },
  {
    url: "https://www.demo-cnc-oem.com/campaign/cnc-oem-q3",
    name: "询价广告品牌页",
    type: "营销页",
    landUv: 210,
    bounceUv: 179,
    bounce: 0.853,
    catchRate: 0.147,
    landStay: 8,
  },
  {
    url: "https://www.demo-cnc-oem.com/products",
    name: "产品列表（打样流量）",
    type: "产品列表",
    landUv: 64,
    bounceUv: 48,
    bounce: 0.75,
    catchRate: 0.25,
    landStay: 9,
  },
];

function lostPeople(row) {
  const bounce = row.bounce != null ? row.bounce : row.catchRate != null ? 1 - row.catchRate : 0;
  return (row.landUv || 0) * bounce;
}

function topLossLands(lands) {
  const merged = DIAGNOSIS_LOSS_LANDS.map((row) => ({ ...row }));
  (lands || []).forEach((row) => {
    if (!row?.url || merged.some((item) => item.url === row.url)) return;
    merged.push(row);
  });
  return merged
    .filter((row) => {
      if (!(row.landUv > 0) || !isBusinessLand(row) || lostPeople(row) <= 0) return false;
      const highLoss = (row.catchRate != null && row.catchRate < 0.4) || (row.bounce != null && row.bounce >= 0.4);
      return highLoss;
    })
    .sort((a, b) => lostPeople(b) - lostPeople(a) || (b.landUv || 0) - (a.landUv || 0))
    .slice(0, 3);
}

function topZeroTerms(terms) {
  return (terms || [])
    .filter((row) => row.zeroHits > 0 && row.searches > 0 && row.zeroRate != null && row.leaveRate != null)
    .slice()
    .sort((a, b) => b.searches - a.searches || b.zeroHits - a.zeroHits)
    .slice(0, 3);
}

function missedLeads(row) {
  return Math.max(0, (row.started || 0) - (row.pageLeads || 0));
}

function topLeakyPages(pages) {
  return (pages || [])
    .filter((row) => row.started > 0 && row.formDone != null && row.pageLeads != null)
    .slice()
    .sort((a, b) => missedLeads(b) - missedLeads(a) || b.started - a.started)
    .slice(0, 3);
}

export function LossEvidence({ id, model }) {
  if (id === "l1") {
    const rows = topLossLands(model.lands.all);
    return (
      <>
        <p className="db-insight-evidence__title">高流失落地页 TOP 3</p>
        <Table
          className="db-insight-bill is-evidence"
          size="small"
          pagination={false}
          rowKey="url"
          dataSource={rows}
          columns={[
            {
              title: "落地页",
              dataIndex: "name",
              ellipsis: true,
              render: (_, row) => <span title={row.url}>{pageLabel(row)}</span>,
            },
            { title: "进站人数", dataIndex: "landUv", width: 72, render: (value) => fmtInt(value) },
            {
              title: "落地接住率",
              dataIndex: "catchRate",
              width: 88,
              render: (value) => <span className={value < 0.4 ? "is-down" : undefined}>{rateText(value)}</span>,
            },
            {
              title: "秒退 / 停留",
              key: "stay",
              width: 108,
              render: (_, row) => `${rateText(row.bounce)} / ${row.landStay} 秒`,
            },
          ]}
        />
      </>
    );
  }
  if (id === "l2") {
    const items = model.strips.all?.l2?.items || [];
    const form = items.find((item) => item.name === "表单开始率");
    const chat = items.find((item) => item.name === "开聊率");
    const formPeople = form?.count != null ? `（${fmtInt(form.count)} 人）` : "";
    const rows = topZeroTerms(model.terms);
    return (
      <>
        <p className="db-insight-actions">
          <b>动作拆解：</b>
          <span>表单开始率 <strong>{form?.value == null ? "未统计" : rateText(form.value)}</strong>{formPeople}</span>
          <span className="db-insight-actions__sep">｜</span>
          <span>
            在线客服开聊率{" "}
            {chat?.wired ? <strong>{rateText(chat.value)}</strong> : <em>未接入</em>}
          </span>
        </p>
        <p className="db-insight-evidence__title">零结果搜索词 TOP 3</p>
        <Table
          className="db-insight-bill is-evidence"
          size="small"
          pagination={false}
          rowKey="term"
          dataSource={rows}
          columns={[
            { title: "搜索词", dataIndex: "term", ellipsis: true },
            { title: "搜索次数", dataIndex: "searches", width: 72, render: (value) => fmtInt(value) },
            { title: "0结果率", dataIndex: "zeroRate", width: 72, render: rateText },
            { title: "搜后离站率", dataIndex: "leaveRate", width: 84, render: rateText },
          ]}
        />
      </>
    );
  }
  const rows = topLeakyPages(model.pages.all);
  return (
    <>
      <p className="db-insight-evidence__title">页面留资承接表现 TOP 3</p>
      <Table
        className="db-insight-bill is-evidence"
        size="small"
        pagination={false}
        rowKey="url"
        dataSource={rows}
        columns={[
          { title: "页面", dataIndex: "name", ellipsis: true, render: (_, row) => <span title={row.url}>{pageLabel(row)}</span> },
          { title: "开始交互", dataIndex: "started", width: 72, render: (value) => fmtInt(value) },
          {
            title: "表单完成率",
            dataIndex: "formDone",
            width: 84,
            render: (value) => <span className={value < 0.45 ? "is-down" : undefined}>{rateText(value)}</span>,
          },
          { title: "页面留资数", dataIndex: "pageLeads", width: 84, render: (value) => fmtInt(value) },
        ]}
      />
    </>
  );
}

const STRATEGY_LINE = {
  "t-detail": "修改产品详情页（首屏补齐参数与询价入口），确认后由「官网内容发布」生成草稿。",
  "t-landing": "新建一张询价营销页，替换现在的品牌页，确认后由「智能营销页」生成草稿。",
  "k-sample": "打样营销页草稿已经生成，确认后即可发布上线。",
  "t-article": "把图纸格式和膜厚写成站内能搜到的文章，确认后由「官网内容发布」生成草稿。",
  "t-plan": "按这两个零结果词建立按周更新的专栏，确认后由「官网内容发布」排期。",
};

const FLOW_KEY = "growth-workbench-flow-v1";

function readFlow() {
  try {
    const raw = window.localStorage.getItem(FLOW_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      approvedStrategies: parsed.approvedStrategies || {},
      skippedStrategies: parsed.skippedStrategies || {},
      publishedTasks: parsed.publishedTasks || {},
    };
  } catch {
    return { approvedStrategies: {}, skippedStrategies: {}, publishedTasks: {} };
  }
}

function taskOf(key) {
  return BRIEFS.find((item) => item.key === key) || TRACKING.find((item) => item.key === key);
}

function ruleOf(key) {
  return RULE_CHECKS.find((rule) => rule.briefKeys?.[0] === key || rule.trackKey === key);
}

/** 已上线或此次先不做算处理完。已出草稿、还等预览的仍算待处理。打样页草稿默认已生成。 */
function itemStatus(key, flow) {
  if (flow.publishedTasks?.[key]) return "live";
  if (flow.skippedStrategies?.[key]) return "skip";
  if (flow.approvedStrategies?.[key] || key === "k-sample") return "preview";
  return "approve";
}

function wowText(signedPct, dir) {
  if (dir === "flat") return "较上周环比持平";
  return `较上周环比 ${signedPct}`;
}

export function peopleMove(cur, prev) {
  if (prev == null || prev === 0) return { text: "较上周环比 —", dir: "flat" };
  const rel = ((cur - prev) / prev) * 100;
  if (Math.abs(rel) < 0.05) return { text: wowText("", "flat"), dir: "flat" };
  return {
    text: wowText(`${rel > 0 ? "+" : ""}${rel.toFixed(1)}%`),
    dir: rel > 0 ? "up" : "down",
  };
}

export function rateMove(cur, prev) {
  const pp = (cur - prev) * 100;
  if (Math.abs(pp) < 0.05) return { text: wowText("", "flat"), dir: "flat", pp: 0 };
  return {
    text: wowText(`${pp > 0 ? "+" : ""}${pp.toFixed(1)}%`),
    dir: pp > 0 ? "up" : "down",
    pp,
  };
}

/** 待提升：较上周暴跌，或低于建议目标。已达标：不低于建议目标，且没有暴跌。暴跌沿用环比跌幅 >10% 且绝对跌幅 >2pp。 */
function lossTone(pass, passPrev, target) {
  if (rateBrokeDown(pass, passPrev)) return "bad";
  if (pass + 1e-9 < target) return "flat";
  return "ok";
}

export const TONE_LABEL = { bad: "待提升", flat: "待提升", ok: "已达标" };
export const TONE_TAG = { bad: "error", flat: "warning", ok: "success" };
const FUNNEL_COLORS = ["#155a7d", "#1f6f96", "#2f8bb8", "#4b9fc8"];
const TREND_SPECS = [
  {
    id: "l1",
    metric: "有效浏览率",
    stepTitle: "流失点 1 · 进站 → 有效浏览",
    target: 40.0,
    domain: [0, 55],
    color: "#3989ff",
    shifts: [1.2, 0.6, -0.6, 0.8, 0.1, -0.3],
  },
  {
    id: "l2",
    metric: "转化交互率",
    stepTitle: "流失点 2 · 有效浏览 → 转化交互",
    target: 20.0,
    domain: [0, 30],
    color: "#0f766e",
    shifts: [0.6, -0.2, 0.4, -0.4, 0.3, -0.1],
  },
  {
    id: "l3",
    metric: "留资完成率",
    stepTitle: "流失点 3 · 转化交互 → 成功留资",
    target: 45.0,
    domain: [20, 60],
    color: "#d97706",
    shifts: [-1.3, 0.3, 0.6, -0.7, -0.3, 0.9],
  },
];
const TREND_WEEKS = 8;
const Funnel = lazy(() => import("@ant-design/plots").then((mod) => ({ default: mod.Funnel })));
const Line = lazy(() => import("@ant-design/plots").then((mod) => ({ default: mod.Line })));

function funnelData(stages) {
  const entry = stages[0]?.cur || 1;
  return stages.map((stage) => ({
    stage: stage.name,
    count: stage.cur,
    share: stage.cur / entry,
    width: 0.3 + 0.7 * Math.pow(stage.cur / entry, 0.35),
  }));
}

function weekTick(label) {
  const match = String(label).match(/(\d+)月(\d+)日/);
  return match ? `${match[1]}/${match[2]}` : label;
}

function signedPeople(delta) {
  if (!delta) return "0";
  const text = fmtInt(Math.abs(delta));
  return delta > 0 ? `+${text}` : `-${text}`;
}

function buildMetricTrendSeries(stages, weekId, metricIndex, metric, shifts) {
  const gate = through(stages)[metricIndex];
  const latest = Number((gate.pass * 100).toFixed(1));
  const previous = Number((gate.passPrev * 100).toFixed(1));
  const index = Math.max(0, WEEKS.findIndex((item) => item.id === weekId));
  const from = Math.min(WEEKS.length - 1, index + TREND_WEEKS - 1);
  const weeks = [];
  for (let cursor = from; cursor >= index; cursor -= 1) weeks.push(WEEKS[cursor]);
  const rates = weeks.map((week, pos) => {
    const fromEnd = weeks.length - 1 - pos;
    let value = latest;
    if (fromEnd === 1) value = previous;
    else if (fromEnd > 1) {
      const shift = shifts[fromEnd - 2] ?? 0;
      value = Number((previous + shift).toFixed(1));
    }
    return { week: weekTick(week.label), weekFull: week.label, metric, value };
  });
  const counts = new Array(rates.length);
  counts[rates.length - 1] = { from: gate.from.cur, to: gate.to.cur };
  if (rates.length > 1) counts[rates.length - 2] = { from: gate.from.prev, to: gate.to.prev };
  for (let cursor = rates.length - 3; cursor >= 0; cursor -= 1) {
    const base = Math.max(1, counts[cursor + 1].from);
    const fromPeople = Math.max(1, Math.round(base * (0.96 + (cursor % 4) * 0.015)));
    counts[cursor] = {
      from: fromPeople,
      to: Math.round(fromPeople * (rates[cursor].value / 100)),
    };
  }
  return rates.map((point, pos) => {
    const count = counts[pos];
    const delta = pos > 0 ? count.to - counts[pos - 1].to : null;
    const change = delta == null ? "" : `，较上周 ${signedPeople(delta)} 人`;
    return {
      ...point,
      detail: `${point.value.toFixed(1)}%（${fmtInt(count.to)} 人 / ${fmtInt(count.from)} 人${change}）`,
    };
  });
}

function targetLabelDy(series, target) {
  const sample = series.slice(0, 3);
  const onOrAbove = sample.filter((point) => point.value >= target - 1).length;
  return onOrAbove >= Math.ceil(sample.length / 2) ? 28 : -18;
}

function placeTrendTip(tip, host, clientX, clientY) {
  const rect = host.getBoundingClientRect();
  const width = tip.offsetWidth || 240;
  const height = tip.offsetHeight || 64;
  let left = clientX - rect.left + 12;
  let top = clientY - rect.top - height - 8;
  if (left + width > rect.width - 16) left = clientX - rect.left - width - 12;
  if (left < 16) left = 16;
  if (top < 16) top = clientY - rect.top + 16;
  if (top + height > rect.height - 16) top = Math.max(16, rect.height - height - 16);
  tip.style.left = `${left}px`;
  tip.style.top = `${top}px`;
}

function nearestTrendPoint(series, chartEl, clientX, g2chart) {
  const canvas = chartEl.querySelector("canvas") || chartEl;
  const rect = canvas.getBoundingClientRect();
  const host = chartEl.getBoundingClientRect();
  const coord = g2chart?.getCoordinate?.();
  const scale = g2chart?.getScaleByChannel?.("x") || g2chart?.getScale?.("x");
  if (coord && scale?.map && series.length) {
    const opt = coord.getOptions?.() || coord.options || {};
    const originX = (opt.marginLeft || 0) + (opt.paddingLeft || 0) + (opt.insetLeft || 0);
    const originY = (opt.marginTop || 0) + (opt.paddingTop || 0) + (opt.insetTop || 0);
    const innerW = Math.max(1, opt.innerWidth || opt.width || 1);
    const innerH = Math.max(24, opt.innerHeight || opt.height || 24);
    const t = Math.max(0, Math.min(1, (clientX - rect.left - originX) / innerW));
    let best = 0;
    let bestDist = Infinity;
    series.forEach((item, idx) => {
      const dist = Math.abs((scale.map(item.week) ?? idx / Math.max(1, series.length - 1)) - t);
      if (dist < bestDist) {
        bestDist = dist;
        best = idx;
      }
    });
    const datum = series[best];
    const mapped = coord.map([scale.map(datum.week), 0]) || [0, 0];
    return {
      datum,
      x: rect.left - host.left + originX + mapped[0],
      top: rect.top - host.top + originY,
      height: innerH,
    };
  }
  const padLeft = Math.min(52, rect.width * 0.14);
  const padRight = 10;
  const padTop = 8;
  const padBottom = 28;
  const inner = Math.max(1, rect.width - padLeft - padRight);
  const ratio = (clientX - rect.left - padLeft) / inner;
  const idx = Math.round(Math.max(0, Math.min(1, ratio)) * (series.length - 1));
  const x = rect.left - host.left + padLeft + (idx / Math.max(1, series.length - 1)) * inner;
  return {
    datum: series[idx],
    x,
    top: rect.top - host.top + padTop,
    height: Math.max(24, rect.height - padTop - padBottom),
  };
}

export function RateTrend({ stages, weekId, losses, onOpen, active, chartFloor = 240 }) {
  const gridRef = useRef(null);
  const tipRef = useRef(null);
  const plotsRef = useRef({});
  const [chartH, setChartH] = useState(chartFloor);

  useEffect(() => {
    if (!active) hideTip();
  }, [active]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return undefined;
    const chart = grid.querySelector(".db-trend-card__chart");
    if (!chart) return undefined;
    const measure = () => {
      const next = Math.max(chartFloor, Math.round(chart.clientHeight));
      setChartH((prev) => (Math.abs(prev - next) <= 2 ? prev : next));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(chart);
    measure();
    return () => observer.disconnect();
  }, [chartFloor]);

  const cards = useMemo(
    () =>
      TREND_SPECS.map((spec, idx) => {
        const loss = losses[idx];
        const series = buildMetricTrendSeries(stages, weekId, idx, spec.metric, spec.shifts);
        const curPct = Number((loss.gate.pass * 100).toFixed(1));
        const diffTarget = Number((curPct - spec.target).toFixed(1));
        return {
          ...spec,
          loss,
          series,
          curPct,
          diffTarget,
        };
      }),
    [stages, weekId, losses],
  );

  function hideTip() {
    if (tipRef.current) tipRef.current.hidden = true;
    gridRef.current?.querySelectorAll(".db-trend-rule").forEach((el) => {
      el.hidden = true;
    });
  }

  function showTip(series, event) {
    const tip = tipRef.current;
    const host = gridRef.current;
    if (!tip || !host || !series?.length) return;
    const hit = nearestTrendPoint(series, event.currentTarget, event.clientX, plotsRef.current[event.currentTarget.dataset.trendId]);
    if (!hit?.datum?.detail) return;
    const { datum } = hit;
    tip.hidden = false;
    const title = tip.querySelector("[data-title]");
    const body = tip.querySelector("[data-body]");
    if (title) title.textContent = datum.weekFull;
    if (body) body.textContent = `${datum.metric}：${datum.detail}`;
    placeTrendTip(tip, host, event.clientX, event.clientY);
    const rule = event.currentTarget.querySelector(".db-trend-rule");
    host.querySelectorAll(".db-trend-rule").forEach((el) => {
      el.hidden = el !== rule;
    });
    if (!rule) return;
    rule.style.left = `${hit.x}px`;
    rule.style.top = `${hit.top}px`;
    rule.style.height = `${hit.height}px`;
  }

  return (
    <div className="db-insight-trend-grid" ref={gridRef}>
      <div ref={tipRef} className="db-trend-tip" hidden>
        <b data-title />
        <span data-body />
      </div>
      {cards.map((card) => {
        const isBelow = card.curPct + 1e-9 < card.target;
        const lineColor = card.loss.tone === "bad" ? "#dc2626" : card.color;
        const labelDy = targetLabelDy(card.series, card.target);
        return (
          <div
            key={card.id}
            className={`db-trend-card is-${card.loss.tone}`}
            role="button"
            tabIndex={0}
            onClick={() => onOpen?.(card.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onOpen?.(card.id);
              }
            }}
          >
            <div className="db-trend-card__head">
              <div className="db-trend-card__title">
                <div className="db-trend-card__name">
                  <b>{card.metric}</b>
                  <span>{card.stepTitle}</span>
                </div>
                <Tag color={card.loss.tone === "bad" ? "red" : TONE_TAG[card.loss.tone]} className="db-tag-mini">
                  {TONE_LABEL[card.loss.tone]}
                </Tag>
              </div>
              <div className="db-trend-card__nums">
                <strong className={`db-trend-card__value${card.loss.tone === "bad" ? " is-bad" : ""}`}>
                  {card.curPct.toFixed(1)}%
                </strong>
                <span className={`db-trend-card__delta is-${card.loss.rateMove.dir}`}>
                  {trendDelta(card.loss.rateMove)}
                </span>
                <small className="db-trend-card__target-k">建议目标</small>
                <b className="db-trend-card__target-v">≥ {card.target.toFixed(1)}%</b>
                <span className={`db-trend-card__gap${isBelow ? " is-gap" : " is-pass"}`}>
                  {gapPhrase(card.diffTarget)}
                </span>
              </div>
            </div>
            <div
              className="db-trend-card__chart"
              data-trend-id={card.id}
              onMouseMove={(event) => showTip(card.series, event)}
              onMouseLeave={hideTip}
            >
              <Suspense fallback={<div className="db-chart-wait" style={{ height: chartH }} />}>
                <Line
                  data={card.series}
                  xField="week"
                  yField="value"
                  height={chartH}
                  autoFit
                  containerStyle={{ height: chartH, flex: "none" }}
                  legend={false}
                  scale={{
                    y: { domain: card.domain, nice: false },
                  }}
                  axis={{
                    x: { title: false, tick: false },
                    y: {
                      title: false,
                      labelFormatter: (value) => `${Number(value).toFixed(0)}%`,
                      gridLineDash: [3, 3],
                    },
                  }}
                  style={{ stroke: lineColor, lineWidth: 2.2 }}
                  point={{
                    shapeField: "circle",
                    sizeField: 4,
                    style: { fill: "#fff", stroke: lineColor, lineWidth: 1.8 },
                    tooltip: false,
                  }}
                  tooltip={false}
                  onReady={(plot) => {
                    plotsRef.current[card.id] = plot.chart || plot;
                  }}
                  annotations={[
                    {
                      type: "lineY",
                      data: [card.target],
                      style: { stroke: "#94a3b8", lineWidth: 1.5, lineDash: [6, 4] },
                      label: {
                        text: `建议目标 ${card.target.toFixed(1)}%`,
                        position: "left",
                        dx: 4,
                        dy: labelDy,
                        style: {
                          fill: "#64748b",
                          fontSize: 11,
                          fontWeight: 500,
                          textAlign: "start",
                        },
                      },
                    },
                  ]}
                />
              </Suspense>
              <i className="db-trend-rule" hidden />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function rateClause(move) {
  if (!move || move.dir === "flat") return "较上周环比持平";
  return move.text;
}

function gapPhrase(diff) {
  if (diff == null || !Number.isFinite(diff) || Math.abs(diff) < 0.05) return "与及格线持平";
  if (diff < 0) return `距及格线差 ${Math.abs(diff).toFixed(1)} 个百分点`;
  return `高于目标 ${diff.toFixed(1)} 个百分点`;
}

export function trendDelta(move) {
  if (!move || move.dir === "flat" || !Number.isFinite(move.pp) || Math.abs(move.pp) < 0.05) return "较上周持平";
  const sign = move.pp > 0 ? "+" : "-";
  return `较上周 ${sign}${Math.abs(move.pp).toFixed(1)} 个百分点`;
}

export function weekShortfall(loss) {
  const now = `当前 ${fmtInt(loss.gate.to.cur)} 人`;
  if (loss.gap <= 0) return `${now}（已达到建议及格线）`;
  const verb = loss.id === "l1" ? "多流失" : loss.id === "l2" ? "少转化" : "少留资";
  return `${now}（按及格线测算，本周${verb}约 ${fmtInt(loss.gap)} 人）`;
}

function liftStrategies(plan, tone, gate, targetPeople, gap) {
  if (tone === "ok") return [];
  const authored = FINDINGS[plan.id] || [];
  if (authored.length) return authored;
  const reason = rateBrokeDown(gate.pass, gate.passPrev) ? "较上周明显下滑" : "低于建议目标";
  return [{
    key: `gap-${plan.id}`,
    draft: true,
    title: `${plan.action}：补上本周缺口`,
    cause: `本环节${reason}，还没有挂上可审批的策略。`,
    evidence: `当前 ${fmtInt(gate.to.cur)} 人，及格线 ${fmtInt(targetPeople)} 人${gap > 0 ? `，缺口约 ${fmtInt(gap)} 人` : ""}。`,
  }];
}

export function buildLosses(stages) {
  const gates = through(stages);
  return LOSS_PLAN.map((plan) => {
    const gate = gates.find((item) => item.lossId === plan.id);
    const targetPeople = Math.round(gate.from.cur * plan.target);
    const gap = Math.max(0, targetPeople - gate.to.cur);
    const tone = lossTone(gate.pass, gate.passPrev, plan.target);
    const findings = liftStrategies(plan, tone, gate, targetPeople, gap);
    return {
      ...plan,
      gate,
      tone,
      peopleMove: peopleMove(gate.to.cur, gate.to.prev),
      rateMove: rateMove(gate.pass, gate.passPrev),
      targetPeople,
      gap,
      findings,
      keys: findings.filter((item) => !item.draft).map((item) => item.key),
    };
  });
}

function encodeTask(task) {
  const bytes = new TextEncoder().encode(JSON.stringify(task));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function openPreview(key) {
  const row = taskOf(key);
  if (!row) return;
  const view = row.executor?.includes("营销") ? "marketing" : "content";
  const task = {
    id: row.key,
    focusKey: row.key,
    title: row.title,
    view,
    executor: row.executor,
    summary: row.summary || "",
    target: row.target || "",
    requirementSections: row.requirementSections || [],
    constraints: row.constraints || [],
    stage: "待预览发布",
  };
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: "growth-open-task", view, focusKey: row.key, task }, "*");
    return;
  }
  const host = window.location.hostname || "127.0.0.1";
  const port = view === "marketing" ? 5186 : 5178;
  const url = new URL(`http://${host}:${port}/`);
  if (view === "content") url.searchParams.set("embed", "1");
  url.searchParams.set("task", encodeTask(task));
  window.location.assign(url.toString());
}

export default function IntakeInsight({ weekLabel, weekId, lens = "funnel", onLensChange, diagnosed, stages, onOpenStrategy, onOpenBoard, children }) {
  const losses = buildLosses(stages);
  const [entry, , , lead] = stages;
  const leadRate = entry.cur ? lead.cur / entry.cur : 0;
  const leadMove = peopleMove(lead.cur, lead.prev);
  const entryMove = peopleMove(entry.cur, entry.prev);
  const strategyCount = losses.reduce((sum, item) => sum + item.keys.length, 0);
  const batchKeys = losses.flatMap((item) => item.keys);
  const short = losses.find((item) => item.tone === "bad") || losses[0];
  const [activeId, setActiveId] = useState(short.id);
  const [openMap, setOpenMap] = useState({ l1: true, l2: true, l3: false });
  const [highlightKey, setHighlightKey] = useState("");
  const [flashId, setFlashId] = useState("");
  const flashTimer = useRef(0);
  const [flow, setFlow] = useState(readFlow);
  const active = losses.find((item) => item.id === activeId) || losses[0];
  const evidence = useMemo(() => getMcpBoard("d7"), []);
  const doneCount = batchKeys.filter((key) => {
    const status = itemStatus(key, flow);
    return status === "live" || status === "skip";
  }).length;
  const pendingCount = batchKeys.length - doneCount;

  useEffect(() => {
    const sync = () => setFlow(readFlow());
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  function openGroup(id) {
    setActiveId(id);
    setOpenMap((prev) => ({ ...prev, [id]: true }));
    setFlashId(id);
    window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlashId(""), 2000);
    window.requestAnimationFrame(() => {
      document.getElementById(`intake-loss-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
  function openAttr(id, key) {
    setActiveId(id);
    setHighlightKey(key);
    setOpenMap((prev) => ({ ...prev, [id]: true }));
    window.requestAnimationFrame(() => {
      document.getElementById(`intake-attr-${key}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  const entryClause = entryMove.dir === "flat"
    ? <>进站流量保持稳定（<strong>{fmtInt(entry.cur)} 人</strong>，较上周环比持平）</>
    : <>进站 <strong>{fmtInt(entry.cur)} 人</strong>（{entryMove.text}）</>;
  const leadClause = leadMove.dir === "down"
    ? <>，但最终留资下滑至 <strong>{fmtInt(lead.cur)} 条</strong>（{leadMove.text}）</>
    : leadMove.dir === "up"
      ? <>，最终留资回升至 <strong>{fmtInt(lead.cur)} 条</strong>（{leadMove.text}）</>
      : <>，最终留资 <strong>{fmtInt(lead.cur)} 条</strong>（较上周环比持平）</>;
  const steady = losses.filter((item) => item.id !== short.id);
  const steadyHeld = steady.every((item) => item.tone === "ok");

  return (
    <>
      <section className="db-insight-summary" aria-label="本周转化诊断小结">
        <div className="db-insight-summary__main">
          <span className="db-insight-summary__tag">本周转化诊断小结（{weekLabel}）</span>
          <p>
            本周官网{entryClause}{leadClause}。留资转化率 <strong>{pct(leadRate)}</strong>。从 4 层漏斗来看：
          </p>
          <ul>
            <li>
              <strong>核心短板在「流失点 {LOSS_PLAN.findIndex((item) => item.id === short.id) + 1}（{short.fromTo}）」</strong>
              ：{short.action.replace("提升", "")}率 {short.tone === "bad" ? "跌至" : "为"} <strong>{pct(short.gate.pass)}</strong>
              （{short.rateMove.text}
              ，{short.gate.pass + 1e-9 < short.target ? "低于" : "达到"}建议值 <strong>{pct(short.target)}</strong>）
              {short.gap > 0 ? <>，本周多流失了 <strong>{fmtInt(short.gap)} 名</strong>潜在买家</> : null}
              {diagnosed && short.pages ? <>，主要卡在 {short.pages} 首屏未命中采购商诉求</> : null}
              。
            </li>
            <li>
              <strong>{steadyHeld ? "中后端环节基本稳住" : "其余环节"}</strong>
              ：
              {steady.map((item, index) => (
                <span key={item.id}>
                  {index ? "；" : ""}
                  「流失点 {LOSS_PLAN.findIndex((plan) => plan.id === item.id) + 1}（{item.fromTo}）」{item.action.replace("提升", "")}率 <strong>{pct(item.gate.pass)}</strong>
                  （{item.rateMove.text}）
                </span>
              ))}
              {steadyHeld ? "。只要买家愿意发起交互，最终留资意愿依然较强。" : "。"}
            </li>
            {diagnosed && strategyCount ? (
              <li>
                <strong>已为您生成 {strategyCount} 项针对性策略</strong>
                ：
                {losses.filter((item) => item.keys.length).map((item, index) => (
                  <span key={item.id}>
                    {index ? " 与 " : ""}
                    <strong>「{item.action}（{item.keys.length} 项）」</strong>
                  </span>
                ))}
                ，可从下方待提升环节进入，或一次看完全部待拍板策略。
              </li>
            ) : (
              <li>这一周没有单独挂出的待拍板策略。要处理已经生成的策略，请切回最新一期。</li>
            )}
          </ul>
          {diagnosed && batchKeys.length ? (
            <p className="db-insight-progress">
              当前诊断批次进度（{doneCount}/{batchKeys.length} 已处理）：剩余 {pendingCount} 项待处理（含待批策略/待预览发布），全部处理后将自动开启新一轮全站诊断。
            </p>
          ) : null}
        </div>
        <div className="db-insight-summary__actions">
          {diagnosed && strategyCount ? (
            <Button type="primary" onClick={() => onOpenStrategy()}>
              去审批全部策略 ({strategyCount}) &gt;
            </Button>
          ) : null}
          <Button onClick={onOpenBoard}>完整数据看板 &gt;</Button>
        </div>
      </section>

      <section className="db-insight-board" aria-label={lens === "trend" ? "近期转化率趋势" : "四层留资漏斗"}>
        <div className="db-insight-board__toolbar">
          <Segmented
            className="db-insight-switch"
            aria-label="漏斗视图切换"
            value={lens}
            onChange={onLensChange}
            options={[
              { label: "漏斗结构诊断", value: "funnel" },
              { label: "近期趋势", value: "trend" },
            ]}
          />
        </div>
        <div className="db-insight-board__stage">
          <div className={`db-insight-pane${lens === "funnel" ? "" : " is-off"}`} aria-hidden={lens !== "funnel"}>
            {children}
            <div className="db-insight-board__grid">
          <div className="db-fd db-insight-funnel" style={{ height: 88 * stages.length }}>
            <div className="db-fd-chart">
              <Suspense fallback={<div className="db-chart-wait" style={{ height: 88 * stages.length }} />}>
                <Funnel
                  data={funnelData(stages)}
                  xField="stage"
                  yField="width"
                  height={88 * stages.length}
                  autoFit
                  margin={0}
                  padding={0}
                  legend={false}
                  scale={{ color: { range: FUNNEL_COLORS } }}
                  style={{ stroke: "#fff", lineWidth: 2 }}
                  label={{
                    text: (d) => `${d.stage}\n${fmtInt(d.count)} 人 · ${pct(d.share)}`,
                    position: "inside",
                    transform: [],
                    fill: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    lineHeight: 18,
                    textAlign: "center",
                  }}
                  tooltip={{
                    title: "stage",
                    items: [{ field: "count", name: "人数", valueFormatter: (value) => `${fmtInt(value)} 人` }],
                  }}
                />
              </Suspense>
            </div>
            <div className="db-fd-rail">
              {losses.map((loss, index) => (
                <button
                  key={loss.id}
                  type="button"
                  className={`db-fd-loss${active.id === loss.id ? " is-on" : ""}${loss.tone === "bad" ? " is-bad" : loss.tone === "flat" ? " is-flat" : ""}`}
                  style={{ top: `${((index + 1) / stages.length) * 100}%` }}
                  aria-pressed={active.id === loss.id}
                  onClick={() => setActiveId(loss.id)}
                >
                  <span className="db-fd-loss-k">
                    流失点 {index + 1}
                    <Tag color={TONE_TAG[loss.tone]} className="db-tag-mini">{TONE_LABEL[loss.tone]}</Tag>
                  </span>
                  <span className="db-fd-loss-v">{loss.action}</span>
                </button>
              ))}
            </div>
          </div>

          <aside className={`db-insight-detail is-${active.tone}`}>
            <div className="db-insight-detail__title">
              <h2>流失点 {losses.findIndex((item) => item.id === active.id) + 1} · {active.action}</h2>
              <Tag className={`db-insight-tone is-${active.tone}`}>{TONE_LABEL[active.tone]}</Tag>
            </div>
            <p className="db-insight-detail__path">{active.fromTo}</p>
            <div className="db-insight-detail__rate">
              <div className="db-insight-detail__main">
                <span>本环节{active.action.replace("提升", "")}率</span>
                <strong>{pct(active.gate.pass)}</strong>
              </div>
              <div className="db-insight-detail__side">
                <p>
                  <em className={active.rateMove.dir === "up" ? "is-up" : active.rateMove.dir === "down" && active.tone === "bad" ? "is-down" : undefined}>
                    {trendDelta(active.rateMove)}
                  </em>
                  {" ｜ "}建议 ≥ {pct(active.target)}
                </p>
                <p>{weekShortfall(active)}</p>
              </div>
            </div>
            {diagnosed ? <LossEvidence id={active.id} model={evidence} /> : null}
          </aside>
            </div>
          </div>
          <div className={`db-insight-pane is-trend${lens === "trend" ? "" : " is-off"}`} aria-hidden={lens !== "trend"}>
            <RateTrend stages={stages} weekId={weekId} losses={losses} onOpen={openGroup} active={lens === "trend"} />
          </div>
        </div>
      </section>

      <section className="db-insight-groups" aria-label="按增长动作分组的诊断">
        {diagnosed ? losses.map((item, index) => {
          const folded = openMap[item.id] === false;
          const pendingHere = item.keys.filter((key) => {
            const status = itemStatus(key, flow);
            return status !== "live" && status !== "skip";
          }).length;
          const headTone = item.tone === "ok"
            ? "已达标"
            : pendingHere
              ? `待提升 · ${pendingHere} 项待处理`
              : "待提升 · 策略已处理";
          return (
            <article key={item.id} id={`intake-loss-${item.id}`} className={`db-insight-group is-${item.tone}${folded ? " is-folded" : ""}${flashId === item.id ? " is-flash" : ""}`}>
              <header>
                <button
                  type="button"
                  className="db-insight-group__toggle"
                  aria-expanded={!folded}
                  onClick={() => setOpenMap((prev) => ({ ...prev, [item.id]: folded }))}
                >
                  <span>
                    <b>{["一", "二", "三"][index]}、{item.action}（流失点 {index + 1}）</b>
                    <Tag className={`db-insight-tone is-${item.tone}`}>{headTone}</Tag>
                  </span>
                  <em>{folded ? "展开" : "收起"}</em>
                </button>
                <p className="db-insight-group__rate">
                  本环节{item.action.replace("提升", "")}率 <strong>{pct(item.gate.pass)}</strong>
                  （{rateClause(item.rateMove)}｜建议 ≥ {pct(item.target)}）
                </p>
                <p className="db-insight-group__sub">
                  {item.gap > 0
                    ? `当前 ${fmtInt(item.gate.to.cur)} 人，目标 ${fmtInt(item.targetPeople)} 人`
                    : `当前 ${fmtInt(item.gate.to.cur)} 人`}
                  {item.tone === "ok" && item.peopleMove.dir === "down"
                    ? "。人数少了，是上游带下来的，这一层已经达标。"
                    : null}
                </p>
              </header>
              {folded ? null : item.findings.length ? (
                <div className="db-insight-group__list">
                  {item.findings.map((finding) => {
                    const rule = ruleOf(finding.key);
                    const status = itemStatus(finding.key, flow);
                    return (
                      <div
                        key={finding.key}
                        id={`intake-attr-${finding.key}`}
                        className={`db-insight-report${highlightKey === finding.key ? " is-on" : ""}`}
                      >
                        <div className="db-insight-report__head">
                          <b>{finding.title}</b>
                          {finding.draft ? (
                            <span className="db-insight-link is-done">待补策略</span>
                          ) : status === "live" || status === "skip" ? (
                            <span className="db-insight-link is-done">{status === "live" ? "已上线 ✓" : "此次先不做"}</span>
                          ) : status === "preview" ? (
                            <button type="button" className="db-insight-link" onClick={() => openPreview(finding.key)}>
                              去预览发布 &gt;
                            </button>
                          ) : (
                            <button type="button" className="db-insight-link" onClick={() => onOpenStrategy(finding.key, [finding.key])}>
                              去策略页审批 &gt;
                            </button>
                          )}
                        </div>
                        <Descriptions
                          bordered
                          size="small"
                          column={1}
                          className="db-insight-reason"
                          styles={{ label: { width: 112, whiteSpace: "nowrap" } }}
                          items={[
                            { key: "phenomenon", label: "网站现象", children: rule?.phenomenon || finding.cause },
                            { key: "data", label: "数据事实", children: rule?.face?.data || finding.evidence },
                            { key: "cause", label: "原因洞察", children: rule?.face?.cause || finding.cause },
                            { key: "strategy", label: "优化策略", children: STRATEGY_LINE[finding.key] || finding.cause },
                          ]}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="db-insight-group__empty">本环节已达到建议目标，且没有较上周暴跌，本周无待办策略。</p>
              )}
            </article>
          );
        }) : (
          <article className="db-insight-group is-flat">
            <header>
              <p>这一周只回看漏斗人数。卡点诊断和待拍板策略挂在最新一期，切回去就能审批。</p>
            </header>
          </article>
        )}
      </section>
    </>
  );
}
