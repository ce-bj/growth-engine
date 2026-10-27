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
  PAGE_CATALOG_COLS,
  PAGE_ID_COLS,
  SEARCH_TERM_COLS,
  SEARCH_TERM_SOURCES,
  STUCK_LABEL,
  bottleneck,
  catalogRows,
  fmtInt,
  getLeadCount,
  getStages,
  pct,
  rateBrokeDown,
  stateOfThrough,
  through,
  searchTermRows,
  trafficBoard,
  walksListed,
} from "../funnel-review/data.js";
import "./detail-board.css";

const Line = lazy(() => import("@ant-design/plots").then((mod) => ({ default: mod.Line })));

const ACCENT = "#2f8bb8";
const DANGER = "#cf1322";
const MIX_COLORS = ["#2f8bb8", "#36b3a8", "#8e7cc3", "#e0a03b"];

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

function shiftDate(base, offset) {
  const day = new Date(base.getTime() + offset * 86400000);
  return `${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
}

const TREND = {
  d7: {
    name: "近 7 天",
    unit: "日独立访客",
    labels: ["09-14", "09-15", "09-16", "09-17", "09-18", "09-19", "09-20"],
    values: [198, 214, 236, 221, 248, 265, 268],
  },
  d30: {
    name: "近 30 天",
    unit: "日独立访客",
    labels: Array.from({ length: 30 }, (_, index) => shiftDate(new Date(2026, 7, 22), index)),
    values: [62, 58, 71, 66, 74, 69, 80, 77, 73, 81, 76, 84, 79, 88, 83, 90, 86, 92, 87, 95, 91, 98, 94, 101, 97, 104, 99, 108, 103, 110],
  },
  period: {
    name: "按期",
    unit: "周独立访客",
    labels: ["7/27", "8/3", "8/10", "8/17", "8/24", "8/31", "9/7", "9/14"],
    values: [1420, 1510, 1488, 1602, 1580, 1710, 1664, 1650],
  },
};

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

function KpiCard({ title, cur, prev, mode = "count", note, alert }) {
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
      <div className="db-kpi-foot">
        <Delta cur={cur} prev={prev} mode={mode} />
        {note ? <span className="db-kpi-note">{note}</span> : null}
      </div>
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

function catalogColumns(cols) {
  return cols.map((col) => {
    const base = { title: col.label, dataIndex: col.key, key: col.key };
    if (col.key === "name") return { ...base, fixed: "left", width: 220, ellipsis: { showTitle: true } };
    if (col.fmt === "url") return { ...base, width: 260, ellipsis: { showTitle: true }, render: (value) => value || "—" };
    if (col.key === "type") return { ...base, width: 120 };
    const sorter = (a, b) => (a[col.key] ?? -1) - (b[col.key] ?? -1);
    if (col.fmt === "pct") return { ...base, align: "right", sorter, render: (value, row) => rateCell(value, col.prevKey ? row[col.prevKey] : null) };
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

export default function DetailBoard({ weekLabel, baselineLabel, authMap, onAuthorize }) {
  const traffic = useMemo(() => trafficBoard(), []);
  const [range, setRange] = useState("d7");
  const [catchCat, setCatchCat] = useState("all");
  const [catchSrc, setCatchSrc] = useState(null);
  const [intentId, setIntentId] = useState(null);
  const [userCat, setUserCat] = useState("all");
  const [userSrc, setUserSrc] = useState(null);
  const [termTab, setTermTab] = useState("site");
  const [openDetail, setOpenDetail] = useState("");

  const siteStages = getStages("site");
  const leadCount = getLeadCount("site");
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

  const stages = slice.empty ? [] : getStages(slice.channelId);
  const gates = stages.length ? through(stages) : [];
  const pageRows = slice.empty ? [] : catalogRows("page", slice.channelId);
  const landRows = slice.empty ? [] : catalogRows("land", slice.channelId);
  const pageMax = pageRows[0]?.uv || 1;
  const landMax = landRows[0]?.landUv || 1;

  const walks = userSlice.empty ? [] : walksListed(userSlice.channelId, intentId);
  const namedPaths = walks
    .flatMap((walk) => walk.urls.map((row, index) => ({
      id: `${walk.id}-${index}`,
      names: row.pages.map((page) => page.name).join(" → "),
      types: walk.types.join(" → "),
      count: row.count,
    })))
    .sort((a, b) => b.count - a.count);
  const pathSum = namedPaths.reduce((sum, row) => sum + row.count, 0);
  const pathMax = namedPaths[0]?.count || 1;
  const intentName = intentId ? INTENTS.find((item) => item.id === intentId)?.name : "全部意图";
  const intentRows = userSlice.empty
    ? []
    : DEPTH_INTENTS.map((item) => {
      const intentStages = getStages(userSlice.channelId, item.id);
      return { ...item, count: intentStages[0].cur, leads: intentStages[3].cur };
    });
  const intentTotal = intentRows.reduce((sum, item) => sum + item.count, 0);

  const termSource = SEARCH_TERM_SOURCES.find((item) => item.key === termTab);
  const termBlocked = Boolean(termSource?.authKey && authMap && authMap[termSource.authKey] === false);
  const termRows = termBlocked ? [] : searchTermRows(termTab, authMap);
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

  const trendPack = TREND[range];
  const trendData = trendPack.values.map((value, index) => ({ label: trendPack.labels[index], value }));
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
      items: [{ channel: "y", name: trendPack.unit, valueFormatter: (value) => `${fmtInt(value)} 人` }],
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
      return (
        <Table
          size="small"
          rowKey="id"
          pagination={false}
          dataSource={stages}
          columns={[
            { title: "层级", dataIndex: "name", key: "name" },
            numCol("本期人数", "cur"),
            numCol("上周人数", "prev"),
            { title: "占入口", key: "ofEntry", align: "right", render: (_, row) => pct(stages[0].cur ? row.cur / stages[0].cur : 0) },
            {
              title: "从上一层过来",
              key: "pass",
              align: "right",
              render: (_, row, index) => {
                if (!index) return "—";
                const gate = gates[index - 1];
                return rateCell(gate.pass, gate.passPrev);
              },
            },
          ]}
        />
      );
    }
    if (openDetail === "pages" || openDetail === "lands") {
      const land = openDetail === "lands";
      return (
        <Table
          size="small"
          rowKey="path"
          dataSource={land ? landRows : pageRows}
          columns={catalogColumns([...PAGE_ID_COLS, ...PAGE_CATALOG_COLS[land ? "land" : "page"]])}
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
    <div className="db-funnel">
      {stages.map((layer, index) => {
        const gate = index ? gates[index - 1] : null;
        const bad = gate ? stateOfThrough(gate.pass, gate.passPrev) === "异常" : false;
        return (
          <div key={layer.id} className={`db-funnel-row${bad ? " is-bad" : ""}`}>
            <div className="db-funnel-line">
              <span className="db-funnel-name">{layer.name}</span>
              <span className="db-funnel-num">{fmtInt(layer.cur)} 人</span>
            </div>
            <Progress
              percent={stages[0].cur ? (layer.cur / stages[0].cur) * 100 : 0}
              showInfo={false}
              strokeColor={bad ? DANGER : ACCENT}
            />
            <div className="db-funnel-sub">
              {gate ? (
                <>
                  上一层过来 <b>{pct(gate.pass)}</b>
                  <span>上周 {pct(gate.passPrev)}</span>
                  {bad ? <Tag color="error" className="db-tag-mini">异常</Tag> : null}
                </>
              ) : (
                <>上周 {fmtInt(layer.prev)} 人</>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <ConfigProvider theme={BOARD_THEME}>
      <div className="dan-board">
        <div className="db-period">
          <span>统计周期：{weekLabel}</span>
          <span>对照：{baselineLabel}</span>
        </div>

        {siteStuck ? (
          <Alert
            className="db-focus"
            type="warning"
            showIcon
            title={`本期卡在「${STUCK_LABEL[siteStuck.lossId]}」：${siteStuck.from.name} → ${siteStuck.to.name} 通过率 ${pct(siteStuck.passPrev)} → ${pct(siteStuck.pass)}。访问人数${entry.cur === entry.prev ? "持平" : `较上周 ${entry.cur > entry.prev ? "多" : "少"} ${fmtInt(Math.abs(entry.cur - entry.prev))} 人`}，留资访客${lead.cur === lead.prev ? "持平" : `较上周 ${lead.cur > lead.prev ? "多" : "少"} ${fmtInt(Math.abs(lead.cur - lead.prev))} 人`}。`}
          />
        ) : null}

        <Row gutter={[16, 16]} className="db-kpis">
          <Col xs={24} sm={12} xl={6}>
            <KpiCard title="访问人数" cur={entry.cur} prev={entry.prev} note={`上周 ${fmtInt(entry.prev)} 人`} />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <KpiCard title="询盘条数" cur={leadCount.cur} prev={leadCount.prev} note={`留资访客 ${fmtInt(lead.cur)} 人`} />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <KpiCard
              title="有效浏览率"
              cur={view.cur / entry.cur}
              prev={view.prev / entry.prev}
              mode="rate"
              note={`上周 ${pct(view.prev / entry.prev)}`}
              alert={rateBrokeDown(view.cur / entry.cur, view.prev / entry.prev)}
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <KpiCard
              title="留资转化率"
              cur={lead.cur / entry.cur}
              prev={lead.prev / entry.prev}
              mode="rate"
              note={`上周 ${pct(lead.prev / entry.prev)}`}
              alert={rateBrokeDown(lead.cur / entry.cur, lead.prev / entry.prev)}
            />
          </Col>
        </Row>

        <SectionTitle title="流量" hint="从哪来、来了多少" />
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card
              title="独立访客走势"
              extra={(
                <Segmented
                  size="small"
                  value={range}
                  onChange={setRange}
                  options={[
                    { value: "d7", label: "近 7 天" },
                    { value: "d30", label: "近 30 天" },
                    { value: "period", label: "按期" },
                  ]}
                />
              )}
            >
              <div className="db-chart-unit">单位：人（{trendPack.unit}）</div>
              <Suspense fallback={<div className="db-chart-wait" />}>
                <Line {...trendConfig} />
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
                  const bad = rateBrokeDown(row.catchRate, row.catchRatePrev);
                  return {
                    key: row.path,
                    name: row.name,
                    tag: bad ? <Tag color="error" className="db-tag-mini">接住率下滑</Tag> : null,
                    valueText: `UV ${fmtInt(row.landUv)}`,
                    percent: (row.landUv / landMax) * 100,
                    alert: bad,
                    sub: `接住 ${row.catchRate == null ? "—" : pct(row.catchRate)}${row.catchRatePrev == null ? "" : `（上周 ${pct(row.catchRatePrev)}）`} · 秒退 ${row.bounce == null ? "—" : pct(row.bounce)}`,
                  };
                })}
              />
            </Card>
          </Col>
        </Row>

        <SectionTitle title="用户" hint="什么意图、怎么走、搜了什么" />
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
            title={`${userPickedSource.name} 暂无单独的意图和访问路径，下面展示 ${userPickedSource.catName} 整个渠道。搜索词按来源分，不随渠道变。`}
          />
        ) : null}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12} xl={8}>
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
          <Col xs={24} lg={12} xl={8}>
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
          <Col xs={24} lg={24} xl={8}>
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
