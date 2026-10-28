import { Suspense, lazy, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  ConfigProvider,
  Empty,
  Modal,
  Progress,
  Row,
  Segmented,
  Select,
  Statistic,
  Table,
  Tabs,
  Tag,
  Tooltip,
} from "antd";
import { ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons";
import { DEPTH_INTENTS, CHURN_MARK } from "../diagnosisPeriod.js";
import {
  INTENTS,
  LOSSES,
  PAGE_CATALOG_COLS,
  PAGE_ID_COLS,
  SEARCH_TERM_COLS,
  SEARCH_TERM_SOURCES,
  STUCK_LABEL,
  bottleneck,
  catalogRows,
  fmtInt,
  getStages,
  pct,
  rateBrokeDown,
  stateOfThrough,
  stripMetric,
  through,
  searchTermRows,
  walksListed,
} from "../funnel-review/data.js";
import { allocate, BOARD_RANGES, buildBoardModel } from "./boardWindow.js";
import "./detail-board.css";

const Line = lazy(() => import("@ant-design/plots").then((mod) => ({ default: mod.Line })));
const Funnel = lazy(() => import("@ant-design/plots").then((mod) => ({ default: mod.Funnel })));
const RegionMap = lazy(() => import("./RegionMap.jsx"));

const ACCENT = "#2f8bb8";
const DANGER = "#cf1322";
const MIX_COLORS = ["#2f8bb8", "#36b3a8", "#8e7cc3", "#e0a03b", "#6b7fd7"];

const BOARD_THEME = {
  token: {
    colorPrimary: ACCENT,
    colorInfo: ACCENT,
    borderRadius: 8,
    fontSize: 14,
    controlHeight: 32,
  },
  components: {
    Card: { headerFontSize: 15, headerHeight: 52, bodyPadding: 20 },
    Table: { cellPaddingBlockSM: 8, headerBg: "#f7f9fb" },
    Statistic: { contentFontSize: 30, titleFontSize: 13 },
  },
};

const PAGE_COUNT_KEYS = ["pv", "uv", "pageLeads", "viewed", "started", "landPv", "landUv", "bounceUv", "landLeads"];
const TERM_COUNT_KEYS = ["searches", "uv", "clicks", "impressions", "cost"];

function scaleFields(row, factor, keys) {
  if (factor === 1) return row;
  const next = { ...row };
  keys.forEach((key) => {
    if (typeof next[key] === "number") next[key] = Math.round(next[key] * factor);
  });
  return next;
}

function scaleTerm(row, factor) {
  if (factor === 1) return row;
  const next = scaleFields(row, factor, TERM_COUNT_KEYS);
  if (typeof next.zeroHits === "number" && next.searches) next.zeroHits = Math.round((next.zeroRate || 0) * next.searches);
  return next;
}

const TERM_TABS = [
  { value: "site", label: "站内搜索" },
  { value: "gsc", label: "自然搜索" },
  { value: "ads", label: "谷歌广告" },
];

function channelSlice(catId, cat) {
  if (catId === "all") return { empty: false, name: "全站", channelId: "site" };
  if (!cat?.channelId) return { empty: true, name: cat?.name || "AI" };
  return { empty: false, name: cat.name, channelId: cat.channelId };
}

function formatTermCell(col, value) {
  if (value == null || value === "") return "—";
  if (col.fmt === "pct") return pct(value);
  if (col.fmt === "pos") return Number(value).toFixed(1);
  if (col.fmt === "money") return `US$${fmtInt(value)}`;
  if (typeof value === "number") return fmtInt(value);
  return value;
}

function termColumns(sourceKey) {
  return SEARCH_TERM_COLS[sourceKey].map((col) => {
    if (col.key === "term") return { title: col.label, dataIndex: col.key, key: col.key, ellipsis: true };
    if (col.key === "sourceLabel") return { title: col.label, dataIndex: col.key, key: col.key, width: 140 };
    return {
      ...numCol(col.label, col.key, (value) => formatTermCell(col, value)),
      sorter: (a, b) => (a[col.key] ?? -1) - (b[col.key] ?? -1),
    };
  });
}

function Delta({ cur, prev, mode = "count" }) {
  if (prev == null || (mode === "count" && prev === 0)) return <span className="db-delta">较上周 —</span>;
  const diff = cur - prev;
  if (Math.abs(diff) < 1e-9) return <span className="db-delta">较上周持平</span>;
  const text = mode === "rate"
    ? `${Math.abs(diff * 100).toFixed(1)}pp`
    : `${Math.abs((diff / prev) * 100).toFixed(1)}%`;
  return (
    <span className={`db-delta ${diff > 0 ? "is-up" : "is-down"}`}>
      较上周 {diff > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {text}
    </span>
  );
}

function KpiCard({ title, cur, prev, mode = "count", note, alert, compare }) {
  const rateMode = mode === "rate";
  return (
    <Card className={`db-kpi${alert ? " is-alert" : ""}`} variant="outlined">
      <div className="db-kpi-top">
        <span className="db-kpi-title">{title}</span>
        {alert ? <Tag color="error">异常</Tag> : null}
      </div>
      <Statistic
        value={rateMode ? cur * 100 : cur}
        precision={rateMode ? 1 : 0}
        suffix={rateMode ? "%" : undefined}
      />
      {compare || note ? (
        <div className="db-kpi-foot">
          {compare ? <Delta cur={cur} prev={prev} mode={mode} /> : null}
          {note ? <span className="db-kpi-note">{note}</span> : null}
        </div>
      ) : null}
    </Card>
  );
}

function RankList({ items, empty = "暂无数据", onPick, pickedKey }) {
  if (!items.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={empty} />;
  return (
    <ol className="db-rank">
      {items.map((item, index) => {
        const body = (
          <>
            {item.color ? (
              <span className="db-rank-dot" style={{ background: item.color }} aria-hidden="true" />
            ) : (
              <span className={`db-rank-no${index < 3 ? " is-top" : ""}`}>{index + 1}</span>
            )}
            <span className="db-rank-main">
              <span className="db-rank-line">
                <Tooltip title={item.name} placement="topLeft">
                  <span className="db-rank-name">{item.name}</span>
                </Tooltip>
                {item.tag}
                <span className="db-rank-value">{item.valueText}</span>
              </span>
              <Progress
                percent={item.percent}
                showInfo={false}
                size="small"
                strokeColor={item.alert ? DANGER : ACCENT}
              />
              {item.sub ? <span className="db-rank-sub">{item.sub}</span> : null}
            </span>
          </>
        );
        return (
          <li key={item.key}>
            {onPick ? (
              <button
                type="button"
                className={`db-rank-row is-btn${pickedKey === item.key ? " is-on" : ""}`}
                aria-pressed={pickedKey === item.key}
                onClick={() => onPick(item.key)}
              >
                {body}
              </button>
            ) : (
              <div className="db-rank-row">{body}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

const FUNNEL_COLORS = ["#155a7d", "#1f6f96", "#2f8bb8", "#4b9fc8"];
const STATE_TAG = { 异常: "error", 提升: "success", 持平: "default" };
const METRIC_GROUPS = [
  { id: "layer", label: "漏斗" },
  { id: "page", label: "页面" },
  { id: "land", label: "落地页" },
];

/** 后两层只有入口的 2%~5%，按真实比例画放不下层名，宽度只示意收窄，人数以标注为准。 */
function funnelData(stages) {
  const entry = stages[0]?.cur || 1;
  return stages.map((stage) => ({
    stage: stage.name,
    count: stage.cur,
    share: stage.cur / entry,
    width: 0.3 + 0.7 * Math.pow(stage.cur / entry, 0.35),
  }));
}

function StageFunnel({ stages, height, withShare = false }) {
  const config = {
    data: funnelData(stages),
    xField: "stage",
    yField: "width",
    height,
    autoFit: true,
    margin: 0,
    padding: 0,
    legend: false,
    scale: { color: { range: FUNNEL_COLORS } },
    style: { stroke: "#fff", lineWidth: 2 },
    label: {
      text: (d) => `${d.stage}\n${fmtInt(d.count)} 人${withShare ? ` · ${pct(d.share)}` : ""}`,
      position: "inside",
      transform: [],
      fill: "#fff",
      fontSize: 13,
      fontWeight: 600,
      lineHeight: 18,
      textAlign: "center",
    },
    tooltip: {
      title: "stage",
      items: [{ field: "count", name: "人数", valueFormatter: (value) => `${fmtInt(value)} 人` }],
    },
  };
  return (
    <Suspense fallback={<div className="db-chart-wait" style={{ height }} />}>
      <Funnel {...config} />
    </Suspense>
  );
}

function formatStrip(item) {
  if (!item) return "—";
  if (item.fmt === "pct") return pct(item.v);
  if (item.fmt === "sec") return `${item.v} 秒`;
  if (item.fmt === "int") return fmtInt(item.v);
  return String(item.v);
}

function LossDetail({ gate, channelId, sliceName, compare }) {
  const loss = LOSSES.find((item) => item.id === gate.lossId);
  const state = compare ? stateOfThrough(gate.pass, gate.passPrev) : null;
  const dpp = (gate.pass - gate.passPrev) * 100;
  const rest = loss.metrics.filter(
    (m) => m.name !== loss.primary && m.role !== "定位主指标" && m.name !== "留资访客 / 转化交互访客",
  );
  const groups = rest.some((m) => m.group)
    ? METRIC_GROUPS.map((group) => ({ ...group, items: rest.filter((m) => m.group === group.id) })).filter((group) => group.items.length)
    : [{ id: "all", label: null, items: rest }];

  return (
    <section className={`db-loss${state === "异常" ? " is-bad" : ""}`}>
      <div className="db-loss-top">
        <span className="db-loss-kicker">流失点 {loss.seq} · 关键指标</span>
        {state ? <Tag color={STATE_TAG[state]}>{state}</Tag> : null}
      </div>
      <h3 className="db-loss-title">{loss.title}</h3>
      <p className="db-loss-meta">
        <span>{loss.meaning}</span>
        <span>本期掉 {fmtInt(gate.dropped)} 人</span>
        <span>{sliceName}</span>
      </p>

      <div className="db-loss-hero">
        <div>
          <span className="db-loss-hero-k">{loss.primary}</span>
          <strong className="db-loss-hero-v">{pct(gate.pass)}</strong>
        </div>
        {compare ? (
          <div className="db-loss-hero-side">
            <span>上期 {pct(gate.passPrev)}</span>
            {Math.abs(dpp) >= 0.05 ? (
              <b className={dpp < 0 ? "is-down" : "is-up"}>{dpp > 0 ? "+" : ""}{dpp.toFixed(1)}pp</b>
            ) : null}
          </div>
        ) : null}
      </div>
      <p className="db-loss-hint">{loss.primaryHint}</p>

      {groups.map((group) => (
        <div key={group.id} className="db-loss-group">
          {group.label ? <h4>{group.label}</h4> : null}
          <dl>
            {group.items.map((m) => (
              <div key={m.name} className="db-loss-row">
                <dt>
                  <Tooltip title={m.role}>{m.name}</Tooltip>
                </dt>
                <dd>{formatStrip(stripMetric(gate.lossId, channelId, m.name, gate))}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </section>
  );
}

function FunnelDetail({ stages, gates, channelId, sliceName, compare }) {
  const stuck = bottleneck(gates);
  const [active, setActive] = useState(stuck?.lossId || gates[0].lossId);
  const activeGate = gates.find((gate) => gate.lossId === active) || gates[0];
  const height = 88 * stages.length;

  return (
    <Row gutter={[24, 16]}>
      <Col xs={24} lg={13}>
        <div className="db-fd" style={{ height }}>
          <div className="db-fd-chart">
            <StageFunnel stages={stages} height={height} withShare />
          </div>
          <div className="db-fd-rail">
            {gates.map((gate, index) => {
              const state = compare ? stateOfThrough(gate.pass, gate.passPrev) : null;
              const on = gate.lossId === activeGate.lossId;
              return (
                <button
                  key={gate.lossId}
                  type="button"
                  className={`db-fd-loss${on ? " is-on" : ""}${state === "异常" ? " is-bad" : ""}`}
                  style={{ top: `${((index + 1) / stages.length) * 100}%` }}
                  aria-pressed={on}
                  onMouseEnter={() => setActive(gate.lossId)}
                  onFocus={() => setActive(gate.lossId)}
                  onClick={() => setActive(gate.lossId)}
                >
                  <span className="db-fd-loss-k">
                    流失点 {index + 1}
                    {state === "异常" ? <Tag color="error" className="db-tag-mini">异常</Tag> : null}
                  </span>
                  <span className="db-fd-loss-v">
                    留存 {pct(gate.pass)} · 流失 {fmtInt(gate.dropped)} 人
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <p className="db-card-hint db-fd-hint">指向流失点，右侧看这一层的关键指标。漏斗宽度只示意逐层收窄，人数以标注为准。</p>
      </Col>
      <Col xs={24} lg={11}>
        <LossDetail gate={activeGate} channelId={channelId} sliceName={sliceName} compare={compare} />
      </Col>
    </Row>
  );
}

function SectionTitle({ title, hint }) {
  return (
    <div className="db-section-head">
      <h2>{title}</h2>
      {hint ? <span>{hint}</span> : null}
    </div>
  );
}

function SliceBar({ cats, cat, source, sourceOptions, onCat, onSource }) {
  return (
    <Card size="small" className="db-filterbar">
      <div className="db-filter-row">
        <div className="db-filter">
          <span className="db-filter-label">渠道</span>
          <Segmented
            value={cat}
            onChange={onCat}
            options={[
              { value: "all", label: "全站" },
              ...cats.map((item) => ({
                value: item.id,
                label: item.name,
                disabled: !item.channelId,
                tooltip: item.channelId ? undefined : "未接入",
              })),
            ]}
          />
        </div>
        <div className="db-filter">
          <span className="db-filter-label">具体来源</span>
          <Select
            allowClear
            placeholder="全部来源"
            value={source}
            onChange={onSource}
            options={sourceOptions}
            style={{ width: 200 }}
          />
        </div>
      </div>
    </Card>
  );
}

function rateCell(value, prev) {
  if (value == null) return "—";
  if (prev == null) return pct(value);
  const dpp = (value - prev) * 100;
  return (
    <span className={rateBrokeDown(value, prev) ? "db-cell-bad" : undefined}>
      {pct(value)} <span className="db-cell-sub">{dpp > 0 ? "+" : ""}{dpp.toFixed(1)}pp</span>
    </span>
  );
}

function catalogColumns(cols, compare) {
  return cols.map((col) => {
    const base = { title: col.label, dataIndex: col.key, key: col.key };
    if (col.key === "name") return { ...base, fixed: "left", width: 220, ellipsis: { showTitle: true } };
    if (col.fmt === "url") return { ...base, width: 260, ellipsis: { showTitle: true }, render: (value) => value || "—" };
    if (col.key === "type") return { ...base, width: 120 };
    const sorter = (a, b) => (a[col.key] ?? -1) - (b[col.key] ?? -1);
    if (col.fmt === "pct") return { ...base, align: "right", sorter, render: (value, row) => rateCell(value, compare && col.prevKey ? row[col.prevKey] : null) };
    if (col.fmt === "sec") return { ...base, align: "right", sorter, render: (value) => (value == null ? "—" : `${value} 秒`) };
    return { ...base, align: "right", sorter, render: (value) => (value == null ? "—" : fmtInt(value)) };
  });
}

const numCol = (title, dataIndex, render) => ({
  title,
  dataIndex,
  key: dataIndex,
  align: "right",
  sorter: (a, b) => (a[dataIndex] ?? -1) - (b[dataIndex] ?? -1),
  render: render || ((value) => (value == null ? "—" : fmtInt(value))),
});

export default function DetailBoard({ authMap, onAuthorize }) {
  const [range, setRange] = useState("d7");
  const model = useMemo(() => buildBoardModel(range), [range]);
  const { traffic, regions, stages: stageBook, leadCount, frame } = model;
  const compare = frame.compare;
  const [catchCat, setCatchCat] = useState("all");
  const [catchSrc, setCatchSrc] = useState(null);
  const [intentId, setIntentId] = useState(null);
  const [userCat, setUserCat] = useState("all");
  const [userSrc, setUserSrc] = useState(null);
  const [termTab, setTermTab] = useState("site");
  const [openDetail, setOpenDetail] = useState("");

  const siteStages = stageBook.site;
  const [entry, view, , lead] = siteStages;
  const siteGates = through(siteStages);
  const siteStuck = bottleneck(siteGates);

  const sourceRows = useMemo(
    () => traffic.sources.map((row) => ({
      ...row,
      share: row.uv == null ? null : row.uv / traffic.siteUv,
    })),
    [traffic],
  );
  const topSources = sourceRows
    .filter((row) => row.uv != null)
    .sort((a, b) => b.uv - a.uv)
    .slice(0, 10);
  const topMax = topSources[0]?.uv || 1;

  const mixCats = traffic.cats
    .filter((cat) => cat.uv != null)
    .map((cat, index) => ({ ...cat, color: MIX_COLORS[index % MIX_COLORS.length] }));

  const pickedCat = traffic.cats.find((cat) => cat.id === catchCat);
  const pickedSource = catchSrc ? traffic.sources.find((item) => item.id === catchSrc) : null;
  const slice = channelSlice(catchCat, pickedCat);

  const userPickedCat = traffic.cats.find((cat) => cat.id === userCat);
  const userPickedSource = userSrc ? traffic.sources.find((item) => item.id === userSrc) : null;
  const userSlice = channelSlice(userCat, userPickedCat);

  const stages = slice.empty ? [] : stageBook[slice.channelId];
  const gates = stages.length ? through(stages) : [];
  const pageRows = slice.empty ? [] : catalogRows("page", slice.channelId).map((row) => scaleFields(row, frame.factor, PAGE_COUNT_KEYS));
  const landRows = slice.empty ? [] : catalogRows("land", slice.channelId).map((row) => scaleFields(row, frame.factor, PAGE_COUNT_KEYS));
  const pageMax = pageRows[0]?.uv || 1;
  const landMax = landRows[0]?.landUv || 1;

  const walks = userSlice.empty ? [] : walksListed(userSlice.channelId, intentId);
  const namedPaths = walks
    .flatMap((walk) => walk.urls.map((row, index) => ({
      id: `${walk.id}-${index}`,
      names: row.pages.map((page) => page.name).join(" → "),
      types: walk.types.join(" → "),
      count: frame.factor === 1 ? row.count : Math.round(row.count * frame.factor),
    })))
    .sort((a, b) => b.count - a.count);
  const pathSum = namedPaths.reduce((sum, row) => sum + row.count, 0);
  const pathMax = namedPaths[0]?.count || 1;
  const intentName = intentId ? INTENTS.find((item) => item.id === intentId)?.name : "全部意图";
  const intentRows = userSlice.empty
    ? []
    : (() => {
      const base = DEPTH_INTENTS.map((item) => {
        const intentStages = getStages(userSlice.channelId, item.id);
        return { ...item, count: intentStages[0].cur, leads: intentStages[3].cur };
      });
      if (frame.factor === 1) return base;
      const channelStages = stageBook[userSlice.channelId];
      const counts = allocate(base.map((item) => item.count), channelStages[0].cur);
      const leads = allocate(base.map((item) => item.leads), channelStages[3].cur);
      return base.map((item, index) => ({ ...item, count: counts[index], leads: leads[index] }));
    })();
  const intentTotal = intentRows.reduce((sum, item) => sum + item.count, 0);

  const termSource = SEARCH_TERM_SOURCES.find((item) => item.key === termTab);
  const termBlocked = Boolean(termSource?.authKey && authMap && authMap[termSource.authKey] === false);
  const termRows = (termBlocked ? [] : searchTermRows(termTab, authMap)).map((row) => scaleTerm(row, frame.factor));
  const termMetric = termTab === "site" ? "searches" : "clicks";
  const termMax = termRows[0]?.[termMetric] || 1;

  function pickCatchCat(id) {
    setCatchSrc(null);
    setCatchCat(id);
  }

  function pickSource(id) {
    if (!id) {
      setCatchSrc(null);
      return;
    }
    const source = traffic.sources.find((item) => item.id === id);
    setCatchCat(source.cat);
    setCatchSrc(id);
  }

  function pickUserCat(id) {
    setUserSrc(null);
    setUserCat(id);
  }

  function pickUserSource(id) {
    if (!id) {
      setUserSrc(null);
      return;
    }
    const source = traffic.sources.find((item) => item.id === id);
    setUserCat(source.cat);
    setUserSrc(id);
  }

  const detailLink = (id) => (
    <Button type="link" size="small" onClick={() => setOpenDetail(id)}>
      查看明细
    </Button>
  );

  const trendData = frame.labels.map((label, index) => ({ label, value: frame.values[index] }));
  const trendConfig = {
    data: trendData,
    xField: "label",
    yField: "value",
    height: 280,
    autoFit: true,
    style: { stroke: ACCENT, lineWidth: 2 },
    point: { shapeField: "circle", sizeField: 3, style: { fill: "#fff", stroke: ACCENT, lineWidth: 1.5 } },
    axis: {
      x: { title: false, labelAutoHide: true, tick: false },
      y: { title: false, labelFormatter: (value) => fmtInt(value), gridLineDash: [3, 3] },
    },
    scale: { y: { nice: true } },
    tooltip: {
      title: "label",
      items: [{ channel: "y", name: frame.unit, valueFormatter: (value) => `${fmtInt(value)} 人` }],
    },
  };

  const channelColumns = [
    {
      title: "渠道",
      dataIndex: "name",
      key: "name",
      render: (name, row) => (
        <span className="db-channel-name">
          <i className="db-channel-dot" style={{ background: mixCats.find((cat) => cat.id === row.id)?.color || "#d9dee5" }} />
          {name}
          {row.channelId ? null : <Tag className="db-tag-mini">未接入</Tag>}
        </span>
      ),
    },
    numCol("UV", "uv"),
    {
      title: "占比",
      key: "share",
      width: 150,
      render: (_, row) => (row.uv == null ? "—" : (
        <Progress
          percent={Math.round((row.uv / traffic.siteUv) * 1000) / 10}
          size="small"
          strokeColor={ACCENT}
          format={(value) => `${value.toFixed(1)}%`}
        />
      )),
    },
    numCol("PV", "pv"),
    numCol("留资访客", "leads"),
  ];

  const sourceColumns = [
    {
      title: "渠道",
      dataIndex: "catName",
      key: "catName",
      filters: traffic.cats.map((cat) => ({ text: cat.name, value: cat.name })),
      onFilter: (value, row) => row.catName === value,
    },
    { title: "具体来源", dataIndex: "name", key: "name" },
    { ...numCol("UV", "uv"), defaultSortOrder: "descend" },
    numCol("PV", "pv"),
    numCol("流量占比", "share", (value) => (value == null ? "—" : pct(value))),
    numCol("留资访客", "leads"),
  ];

  const sourceOptions = traffic.cats.map((cat) => ({
    label: cat.name,
    options: cat.sources.map((item) => ({
      value: item.id,
      label: item.name,
      disabled: !cat.channelId,
    })),
  }));

  const termItems = termRows.slice(0, 5).map((row) => {
    const value = row[termMetric];
    return {
      key: row.id,
      name: row.term,
      valueText: termTab === "site" ? `${fmtInt(value)} 次` : `${fmtInt(value)} 次点击`,
      percent: (value / termMax) * 100,
      sub: termTab === "site"
        ? `0结果 ${pct(row.zeroRate)} · 搜后离站 ${pct(row.leaveRate)}`
        : termTab === "gsc"
          ? `展示 ${fmtInt(row.impressions)} · 平均排名 ${row.position.toFixed(1)}`
          : `展示 ${fmtInt(row.impressions)} · US$${fmtInt(row.cost)}`,
    };
  });

  const modalTitle = {
    sources: "具体渠道明细",
    funnel: `留资漏斗 · ${slice.name}`,
    pages: `页面概览 · ${slice.name}`,
    lands: `落地页概览 · ${slice.name}`,
    intents: `用户意图 · ${userSlice.name}`,
    paths: `页面访问路径 · ${userSlice.name} · ${intentName}`,
    terms: "访客搜索词",
    regions: "地域分布 · 全站",
  }[openDetail];

  function renderDetail() {
    if (openDetail === "sources") {
      return (
        <Table
          size="small"
          rowKey="id"
          columns={sourceColumns}
          dataSource={sourceRows}
          pagination={false}
        />
      );
    }
    if (openDetail === "funnel") {
      return <FunnelDetail stages={stages} gates={gates} channelId={slice.channelId} sliceName={slice.name} compare={compare} />;
    }
    if (openDetail === "pages" || openDetail === "lands") {
      const land = openDetail === "lands";
      return (
        <Table
          size="small"
          rowKey="path"
          dataSource={land ? landRows : pageRows}
          columns={catalogColumns([...PAGE_ID_COLS, ...PAGE_CATALOG_COLS[land ? "land" : "page"]], compare)}
          pagination={false}
          scroll={{ x: "max-content" }}
        />
      );
    }
    if (openDetail === "intents") {
      return (
        <Table
          size="small"
          rowKey="id"
          pagination={false}
          dataSource={intentRows}
          columns={[
            { title: "意图", dataIndex: "name", key: "name" },
            { title: "含义", dataIndex: "meaning", key: "meaning" },
            numCol("人数", "count"),
            {
              title: "占比",
              key: "share",
              align: "right",
              render: (_, row) => pct(intentTotal ? row.count / intentTotal : 0),
            },
            numCol("留资访客", "leads"),
          ]}
        />
      );
    }
    if (openDetail === "paths") {
      return (
        <Table
          size="small"
          rowKey="id"
          pagination={false}
          dataSource={namedPaths}
          columns={[
            { title: "页面名称访问序列", dataIndex: "names", key: "names" },
            { title: "页面类型", dataIndex: "types", key: "types" },
            numCol("人数", "count"),
            { title: "占比", key: "share", align: "right", render: (_, row) => pct(pathSum ? row.count / pathSum : 0) },
          ]}
        />
      );
    }
    if (openDetail === "regions") {
      return (
        <Table
          size="small"
          rowKey="id"
          pagination={false}
          dataSource={regions.cities}
          scroll={{ y: 400 }}
          columns={[
            { title: "城市", dataIndex: "city", key: "city" },
            {
              title: "国家",
              dataIndex: "country",
              key: "country",
              filters: regions.countries.map((item) => ({ text: item.country, value: item.country })),
              onFilter: (value, row) => row.country === value,
            },
            { ...numCol("PV", "pv"), defaultSortOrder: "descend" },
            numCol("人数(UV)", "uv"),
            numCol("留资访客", "leads"),
          ]}
          summary={() => (
            <Table.Summary.Row className="db-sum-row">
              <Table.Summary.Cell index={0} colSpan={2}>合计（{regions.countries.length} 个国家 / {regions.cities.length} 个城市）</Table.Summary.Cell>
              <Table.Summary.Cell index={2} align="right">{fmtInt(regions.countries.reduce((sum, item) => sum + item.pv, 0))}</Table.Summary.Cell>
              <Table.Summary.Cell index={3} align="right">{fmtInt(regions.countries.reduce((sum, item) => sum + item.uv, 0))}</Table.Summary.Cell>
              <Table.Summary.Cell index={4} align="right">{fmtInt(regions.countries.reduce((sum, item) => sum + item.leads, 0))}</Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />
      );
    }
    if (openDetail === "terms") {
      const missing = SEARCH_TERM_SOURCES.filter(
        (item) => item.authKey && authMap && authMap[item.authKey] === false,
      );
      return (
        <Tabs
          defaultActiveKey={termTab}
          items={SEARCH_TERM_SOURCES.map((item) => {
            const blocked = item.authKey && authMap && authMap[item.authKey] === false;
            const rows = blocked ? [] : searchTermRows(item.key, authMap);
            return {
              key: item.key,
              label: blocked ? `${item.label} 未授权` : item.label,
              children: (
                <>
                  <p className="db-card-hint">{item.hint}</p>
                  {item.key === "all" && missing.length
                    ? missing.map((miss) => (
                      <Alert
                        key={miss.key}
                        className="db-term-alert"
                        type="warning"
                        showIcon
                        title={`${miss.label}未授权，这一来源的搜索词还列不出来。`}
                        action={onAuthorize ? <Button size="small" type="primary" onClick={() => onAuthorize(miss.authKey)}>去授权</Button> : null}
                      />
                    ))
                    : null}
                  {blocked ? (
                    <Empty description={`${item.label}未授权，搜索词还列不出来`}>
                      {onAuthorize ? <Button type="primary" onClick={() => onAuthorize(item.authKey)}>去授权</Button> : null}
                    </Empty>
                  ) : (
                    <Table
                      size="small"
                      rowKey="id"
                      pagination={false}
                      dataSource={rows}
                      columns={termColumns(item.key)}
                      locale={{ emptyText: "这一来源还没有搜索词" }}
                    />
                  )}
                </>
              ),
            };
          })}
        />
      );
    }
    return null;
  }

  const funnelBody = slice.empty ? (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`${slice.name} 还没有漏斗数据`} />
  ) : (
    <StageFunnel stages={stages} height={300} />
  );

  return (
    <ConfigProvider theme={BOARD_THEME}>
      <div className="dan-board">
        <div className="db-window">
          <span>时间窗口</span>
          <Segmented
            value={range}
            onChange={setRange}
            options={BOARD_RANGES.map(({ value, label }) => ({ value, label }))}
          />
          <span className="db-window-span">{frame.span}</span>
        </div>

        {compare && siteStuck ? (
          <Alert
            className="db-focus"
            type="warning"
            showIcon
            title={`本期卡在「${STUCK_LABEL[siteStuck.lossId]}」：${siteStuck.from.name} → ${siteStuck.to.name} 通过率 ${pct(siteStuck.passPrev)} → ${pct(siteStuck.pass)}。访问人数${entry.cur === entry.prev ? "持平" : `较上周 ${entry.cur > entry.prev ? "多" : "少"} ${fmtInt(Math.abs(entry.cur - entry.prev))} 人`}，留资访客${lead.cur === lead.prev ? "持平" : `较上周 ${lead.cur > lead.prev ? "多" : "少"} ${fmtInt(Math.abs(lead.cur - lead.prev))} 人`}。`}
          />
        ) : null}

        <Row gutter={[16, 16]} className="db-kpis">
          <Col xs={24} sm={12} xl={6}>
            <KpiCard title="访问人数" cur={entry.cur} prev={entry.prev} compare={compare} note={compare ? `上周 ${fmtInt(entry.prev)} 人` : null} />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <KpiCard title="询盘条数" cur={leadCount.cur} prev={leadCount.prev} compare={compare} note={`留资访客 ${fmtInt(lead.cur)} 人`} />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <KpiCard
              title="有效浏览率"
              cur={view.cur / entry.cur}
              prev={view.prev / entry.prev}
              mode="rate"
              compare={compare}
              note={compare ? `上周 ${pct(view.prev / entry.prev)}` : null}
              alert={compare && rateBrokeDown(view.cur / entry.cur, view.prev / entry.prev)}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <KpiCard
              title="留资转化率"
              cur={lead.cur / entry.cur}
              prev={lead.prev / entry.prev}
              mode="rate"
              compare={compare}
              note={compare ? `上周 ${pct(lead.prev / entry.prev)}` : null}
              alert={compare && rateBrokeDown(lead.cur / entry.cur, lead.prev / entry.prev)}
            />
          </Col>
        </Row>

        <SectionTitle title="流量" hint="从哪来、来了多少" />
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card title="独立访客走势">
              <div className="db-chart-unit">单位：人（{frame.unit}）</div>
              <Suspense fallback={<div className="db-chart-wait" />}>
                <Line key={range} {...trendConfig} />
              </Suspense>
            </Card>
          </Col>
          <Col xs={24} xl={12}>
            <Card title="流量渠道" className="db-fill">
              <div className="db-mix" role="img" aria-label="渠道 UV 构成">
                {mixCats.map((cat) => (
                  <Tooltip key={cat.id} title={`${cat.name} ${fmtInt(cat.uv)} · ${pct(cat.uv / traffic.siteUv)}`}>
                    <span style={{ width: `${(cat.uv / traffic.siteUv) * 100}%`, background: cat.color }} />
                  </Tooltip>
                ))}
              </div>
              <div className="db-mix-legend">
                {mixCats.map((cat) => (
                  <span key={cat.id}>
                    <i style={{ background: cat.color }} />
                    {cat.name} <b>{pct(cat.uv / traffic.siteUv)}</b>
                  </span>
                ))}
              </div>
              <p className="db-card-hint">点击渠道行，下方「网站承接」跟着切换。</p>
              <Table
                size="small"
                rowKey="id"
                pagination={false}
                columns={channelColumns}
                dataSource={traffic.cats}
                summary={() => (
                  <Table.Summary.Row className="db-sum-row">
                    <Table.Summary.Cell index={0}>合计</Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">{fmtInt(traffic.siteUv)}</Table.Summary.Cell>
                    <Table.Summary.Cell index={2}>100%</Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="right">{fmtInt(mixCats.reduce((sum, cat) => sum + cat.pv, 0))}</Table.Summary.Cell>
                    <Table.Summary.Cell index={4} align="right">{fmtInt(lead.cur)}</Table.Summary.Cell>
                  </Table.Summary.Row>
                )}
                rowClassName={(row) => [catchCat === row.id ? "is-picked" : "", row.channelId ? "is-pickable" : ""].join(" ")}
                onRow={(row) => ({
                  onClick: () => {
                    if (!row.channelId) return;
                    pickCatchCat(catchCat === row.id ? "all" : row.id);
                  },
                })}
              />
            </Card>
          </Col>
          <Col xs={24} xl={12}>
            <Card title="具体渠道 TOP10" extra={detailLink("sources")} className="db-fill">
              <p className="db-card-hint">按 UV 排序，右侧为 UV 与占全站比例。</p>
              <RankList
                items={topSources.map((row) => ({
                  key: row.id,
                  name: row.name,
                  tag: <Tag className="db-tag-mini">{row.catName}</Tag>,
                  valueText: `${fmtInt(row.uv)} · ${pct(row.share)}`,
                  percent: (row.uv / topMax) * 100,
                }))}
              />
            </Card>
          </Col>
        </Row>

        <SectionTitle title="网站承接" hint="来了之后看进去没、留下没" />
        <SliceBar
          cats={traffic.cats}
          cat={catchCat}
          source={catchSrc}
          sourceOptions={sourceOptions}
          onCat={pickCatchCat}
          onSource={pickSource}
        />
        {pickedSource ? (
          <Alert
            className="db-slice-note"
            type="info"
            showIcon
            title={`${pickedSource.name} 暂无单独的漏斗和页面数据，下面展示 ${pickedSource.catName} 整个渠道。`}
          />
        ) : null}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12} xl={8}>
            <Card title={<>留资漏斗 <Tag className="db-tag-mini">{slice.name}</Tag></>} extra={slice.empty ? null : detailLink("funnel")} className="db-fill">
              {funnelBody}
            </Card>
          </Col>
          <Col xs={24} lg={12} xl={8}>
            <Card title={<>页面 TOP5 <Tag className="db-tag-mini">{slice.name}</Tag></>} extra={slice.empty ? null : detailLink("pages")} className="db-fill">
              <RankList
                empty={`${slice.name} 还没有页面数据`}
                items={pageRows.slice(0, 5).map((row) => ({
                  key: row.path,
                  name: row.name,
                  valueText: `UV ${fmtInt(row.uv)}`,
                  percent: (row.uv / pageMax) * 100,
                  sub: `停留 ${row.pageStay == null ? "—" : `${row.pageStay} 秒`} · 留资 ${row.pageLeads == null ? "—" : fmtInt(row.pageLeads)}`,
                }))}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12} xl={8}>
            <Card title={<>落地页 TOP5 <Tag className="db-tag-mini">{slice.name}</Tag></>} extra={slice.empty ? null : detailLink("lands")} className="db-fill">
              <RankList
                empty={`${slice.name} 还没有落地页数据`}
                items={landRows.slice(0, 5).map((row) => {
                  const bad = compare && rateBrokeDown(row.catchRate, row.catchRatePrev);
                  return {
                    key: row.path,
                    name: row.name,
                    tag: bad ? <Tag color="error" className="db-tag-mini">接住率下滑</Tag> : null,
                    valueText: `UV ${fmtInt(row.landUv)}`,
                    percent: (row.landUv / landMax) * 100,
                    alert: bad,
                    sub: `接住 ${row.catchRate == null ? "—" : pct(row.catchRate)}${compare && row.catchRatePrev != null ? `（上周 ${pct(row.catchRatePrev)}）` : ""} · 秒退 ${row.bounce == null ? "—" : pct(row.bounce)}`,
                  };
                })}
              />
            </Card>
          </Col>
        </Row>

        <SectionTitle title="用户" hint="什么意图、怎么走、在哪、搜了什么" />
        <SliceBar
          cats={traffic.cats}
          cat={userCat}
          source={userSrc}
          sourceOptions={sourceOptions}
          onCat={pickUserCat}
          onSource={pickUserSource}
        />
        {userPickedSource ? (
          <Alert
            className="db-slice-note"
            type="info"
            showIcon
            title={`${userPickedSource.name} 暂无单独的意图和访问路径，下面展示 ${userPickedSource.catName} 整个渠道。地域分布按全站、搜索词按来源分，不随渠道变。`}
          />
        ) : null}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card
              title={<>用户意图 <Tag className="db-tag-mini">{userSlice.name}</Tag></>}
              extra={userSlice.empty ? null : detailLink("intents")}
              className="db-fill"
            >
              {userSlice.empty ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`${userSlice.name} 还没有意图数据`} />
              ) : (
                <>
                  <p className="db-card-hint">
                    点一档，右侧访问路径跟着切。
                    {userSlice.channelId === "site" ? `其中 ${CHURN_MARK.percent}% ${CHURN_MARK.label}。` : null}
                  </p>
                  <RankList
                    onPick={(id) => setIntentId((prev) => (prev === id ? null : id))}
                    pickedKey={intentId}
                    items={intentRows.map((item) => ({
                      key: item.id,
                      color: item.color,
                      name: item.name,
                      tag: <span className="db-rank-hint">{item.meaning}</span>,
                      valueText: `${fmtInt(item.count)} 人 · ${pct(intentTotal ? item.count / intentTotal : 0)}`,
                      percent: intentTotal ? (item.count / intentTotal) * 100 : 0,
                      sub: `留资访客 ${fmtInt(item.leads)} 人`,
                    }))}
                  />
                </>
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title={<>页面访问路径 TOP5 <Tag className="db-tag-mini">{userSlice.name} · {intentName}</Tag></>}
              extra={userSlice.empty ? null : detailLink("paths")}
              className="db-fill"
            >
              <p className="db-card-hint">按页面名称排，人数不足 5 人不出。</p>
              <RankList
                empty={userSlice.empty ? `${userSlice.name} 还没有访问路径` : "这一档没有达到 5 人的访问路径"}
                items={namedPaths.slice(0, 5).map((row) => ({
                  key: row.id,
                  name: row.names,
                  valueText: `${fmtInt(row.count)} 人 · ${pct(pathSum ? row.count / pathSum : 0)}`,
                  percent: (row.count / pathMax) * 100,
                  sub: row.types,
                }))}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title={<>地域分布 <Tag className="db-tag-mini">全站</Tag></>}
              extra={detailLink("regions")}
              className="db-fill db-map-card"
              classNames={{ body: "db-map-body" }}
            >
              <Suspense fallback={<div className="db-chart-wait" style={{ height: 300 }} />}>
                <RegionMap countries={regions.countries} height={300} />
              </Suspense>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="搜索词 TOP5" extra={detailLink("terms")} className="db-fill">
              <p className="db-card-hint">和「明细数据」同一套搜索词，按来源分开排。</p>
              <Segmented block size="small" value={termTab} onChange={setTermTab} options={TERM_TABS} className="db-term-tabs" />
              {termBlocked ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={`${termSource.label}未授权，搜索词还列不出来`}
                >
                  {onAuthorize ? <Button type="primary" onClick={() => onAuthorize(termSource.authKey)}>去授权</Button> : null}
                </Empty>
              ) : (
                <RankList items={termItems} empty="没有搜索词" />
              )}
            </Card>
          </Col>
        </Row>

        <Modal
          open={Boolean(openDetail)}
          title={modalTitle}
          width={1040}
          rootClassName="db-modal"
          styles={openDetail === "regions" ? { body: { height: 496, overflow: "hidden" } } : undefined}
          footer={null}
          destroyOnHidden
          onCancel={() => setOpenDetail("")}
        >
          {renderDetail()}
        </Modal>
      </div>
    </ConfigProvider>
  );
}
