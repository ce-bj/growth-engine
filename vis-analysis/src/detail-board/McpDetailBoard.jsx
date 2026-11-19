import { Suspense, lazy, useMemo, useState } from "react"
import {
  Alert,
  Button,
  Card,
  Col,
  ConfigProvider,
  Empty,
  Input,
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
} from "antd"
import { ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons"
import { fmtInt, pct, rateBrokeDown } from "../funnel-review/data.js"
import { BOARD_BLUE_THEME as BOARD_THEME, DANGER, PORTAL_BLUE as ACCENT } from "../board-theme.js"
import { getMcpBoard } from "./mcpBoardData.js"
import "./detail-board.css"

const Line = lazy(() => import("@ant-design/plots").then((mod) => ({ default: mod.Line })))
const Funnel = lazy(() => import("@ant-design/plots").then((mod) => ({ default: mod.Funnel })))

const RANGES = [
  { value: "d7", label: "近 7 天" },
  { value: "d30", label: "近 30 天" },
  { value: "d90", label: "近 3 个月" },
]

const CHANNELS = [
  { id: "search", name: "搜索引擎", color: "#2f8bb8" },
  { id: "direct", name: "直接访问", color: "#36b3a8" },
  { id: "referral", name: "外部链接", color: "#8e7cc3" },
  { id: "ads", name: "广告", color: "#e0a03b" },
  { id: "ai", name: "AI", color: "#6b7fd7" },
]

const INTENTS = [
  { id: "browse", name: "浏览型", meaning: "扫一眼就走", color: "#78716c" },
  { id: "explore", name: "探索型", meaning: "在了解，还没选型", color: "#e85d04" },
  { id: "compare", name: "比较型", meaning: "在纠结哪个适合", color: "#1d4ed8" },
  { id: "decide", name: "决策型", meaning: "快动手了", color: "#2f6b3a" },
]

const FUNNEL_COLORS = ["#155a7d", "#1f6f96", "#2f8bb8", "#4b9fc8"]
const LOSSES = [
  { id: "l1", title: "访问入口 → 有效浏览", meaning: "看进去没", primary: "有效浏览率" },
  { id: "l2", title: "有效浏览 → 转化交互", meaning: "看了没动手", primary: "转化交互率" },
  { id: "l3", title: "转化交互 → 成功留资", meaning: "动手没留下", primary: "留资完成率" },
]

function channelName(id) {
  if (id === "all") return "全站"
  return CHANNELS.find((item) => item.id === id)?.name || id
}

function showRate(value) {
  return value == null ? "—" : pct(value)
}

function showSec(value) {
  return value == null ? "—" : `${value} 秒`
}

function Delta({ cur, prev, mode = "count" }) {
  if (prev == null || (mode === "count" && prev === 0)) return <span className="db-delta">较上周 —</span>
  const diff = cur - prev
  if (Math.abs(diff) < 1e-9) return <span className="db-delta">较上周持平</span>
  const text = mode === "rate" ? `${Math.abs(diff * 100).toFixed(1)}pp` : `${Math.abs((diff / prev) * 100).toFixed(1)}%`
  return (
    <span className={`db-delta ${diff > 0 ? "is-up" : "is-down"}`}>
      较上周 {diff > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {text}
    </span>
  )
}

function KpiCard({ title, cur, prev, mode = "count", note, alert, compare }) {
  const rateMode = mode === "rate"
  return (
    <Card className={`db-kpi${alert ? " is-alert" : ""}`} variant="outlined">
      <div className="db-kpi-top">
        <span className="db-kpi-title">{title}</span>
        {alert ? <Tag color="error">异常</Tag> : null}
      </div>
      <Statistic value={rateMode ? cur * 100 : cur} precision={rateMode ? 1 : 0} suffix={rateMode ? "%" : undefined} />
      {compare || note ? (
        <div className="db-kpi-foot">
          {compare ? <Delta cur={cur} prev={prev} mode={mode} /> : null}
          {note ? <span className="db-kpi-note">{note}</span> : null}
        </div>
      ) : null}
    </Card>
  )
}

function RankList({ items, empty = "暂无数据" }) {
  if (!items.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={empty} />
  return (
    <ol className="db-rank">
      {items.map((item, index) => (
        <li key={item.key}>
          <div className="db-rank-row">
            <span className={`db-rank-no${index < 3 ? " is-top" : ""}`}>{index + 1}</span>
            <span className="db-rank-main">
              <span className="db-rank-line">
                <Tooltip title={item.tip || item.name} placement="topLeft">
                  <span className="db-rank-name">{item.name}</span>
                </Tooltip>
                {item.tag}
                <span className="db-rank-value">{item.valueText}</span>
              </span>
              <Progress percent={Math.max(0, Math.min(100, item.percent))} showInfo={false} size="small" strokeColor={item.alert ? DANGER : ACCENT} />
              {item.sub ? <span className="db-rank-sub">{item.sub}</span> : null}
            </span>
          </div>
        </li>
      ))}
    </ol>
  )
}

function funnelData(stages) {
  const entry = stages[0]?.cur || 1
  return stages.map((stage) => ({
    stage: stage.name,
    count: stage.cur,
    share: stage.cur / entry,
    width: 0.3 + 0.7 * Math.pow(stage.cur / entry, 0.35),
  }))
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
  }
  return (
    <Suspense fallback={<div className="db-chart-wait" style={{ height }} />}>
      <Funnel {...config} />
    </Suspense>
  )
}

function formatStrip(item) {
  if (!item || item.value == null) return item?.empty ? "—" : "—"
  if (item.fmt === "pct") return pct(item.value)
  if (item.fmt === "sec") return `${item.value} 秒`
  return fmtInt(item.value)
}

function LossDetail({ loss, gate, sliceName, compare }) {
  return (
    <section className="db-loss">
      <div className="db-loss-top">
        <span className="db-loss-kicker">流失点 · 关键指标</span>
      </div>
      <h3 className="db-loss-title">{loss.title}</h3>
      <p className="db-loss-meta">
        <span>{loss.meaning}</span>
        <span>本期掉 {fmtInt(Math.max(0, gate.from - gate.to))} 人</span>
        <span>{sliceName}</span>
      </p>
      <div className="db-loss-hero">
        <div>
          <span className="db-loss-hero-k">{loss.primary}</span>
          <strong className="db-loss-hero-v">{showRate(gate.pass)}</strong>
        </div>
        {compare && gate.passPrev != null ? (
          <div className="db-loss-hero-side">
            <span>上期 {pct(gate.passPrev)}</span>
          </div>
        ) : null}
      </div>
      <dl>
        {gate.items.map((item) => (
          <div key={item.name} className="db-loss-row">
            <dt>
              <Tooltip title={item.empty || item.name}>
                <span className="db-loss-tip">{item.name}</span>
              </Tooltip>
            </dt>
            <dd>{formatStrip(item)}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

const numCol = (title, dataIndex, render) => ({
  title,
  dataIndex,
  key: dataIndex,
  align: "right",
  sorter: (a, b) => (a[dataIndex] ?? -1) - (b[dataIndex] ?? -1),
  render: render || ((value) => (value == null ? "—" : fmtInt(value))),
})

export default function McpDetailBoard({ getBoard = getMcpBoard }) {
  const [range, setRange] = useState("d7")
  const model = useMemo(() => getBoard(range), [range, getBoard])
  const [catchCat, setCatchCat] = useState("all")
  const [catchSrc, setCatchSrc] = useState(null)
  const [userCat, setUserCat] = useState("all")
  const [userSrc, setUserSrc] = useState(null)
  const [intentId, setIntentId] = useState(null)
  const [termTab, setTermTab] = useState("site")
  const [openDetail, setOpenDetail] = useState("")
  const [detailQuery, setDetailQuery] = useState("")
  const [lossId, setLossId] = useState("l1")

  const compare = model.compare
  const entry = model.stages.all[0]
  const view = model.stages.all[1]
  const lead = model.stages.all[3]
  const viewRate = entry.cur ? view.cur / entry.cur : 0
  const viewPrev = entry.prev ? view.prev / entry.prev : null
  const leadRate = entry.cur ? lead.cur / entry.cur : 0
  const leadPrev = entry.prev ? lead.prev / entry.prev : null
  const siteUv = model.all.uv
  const channelRows = CHANNELS.map((meta) => {
    const hit = model.channels.find((item) => item.id === meta.id)
    return { ...meta, ...hit, share: siteUv ? hit.uv / siteUv : 0 }
  })
  const sliceId = catchCat
  const stages = model.stages[sliceId] || model.stages.all
  const strip = model.strips[sliceId] || model.strips.all
  const activeLoss = LOSSES.find((item) => item.id === lossId) || LOSSES[0]
  const pages = model.pages[sliceId] || []
  const lands = model.lands[sliceId] || []
  const userStages = model.intents[userCat] || []
  const intentTotal = userStages.reduce((sum, item) => sum + item.count, 0)
  const pathBucket = intentId && userCat === "all" ? intentId : "all"
  const pathRows = (model.paths[userCat]?.[pathBucket] || [])
    .map((row) => ({ ...row, label: row.name.replace(/>/g, " → ") }))
    .sort((a, b) => b[range] - a[range])
  const pathSum = pathRows.reduce((sum, row) => sum + row[range], 0)
  const intentName = intentId ? INTENTS.find((item) => item.id === intentId)?.name : "全部意图"
  const pathHint = intentId && userCat !== "all"
    ? "这一渠道的路径没有按浏览等级拆开，下面仍是该渠道的全部路径。"
    : "按页面类型排，连续打开的同类页面已并成一步。榜上是前 5。"

  const sourceOptions = CHANNELS.map((cat) => ({
    label: cat.name,
    options: model.sources.filter((item) => item.cat === cat.id).map((item) => ({ value: `${item.cat}:${item.name}`, label: item.name })),
  }))

  const trendConfig = {
    data: model.trend,
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
      items: [{ channel: "y", name: "日独立访客", valueFormatter: (value) => `${fmtInt(value)} 人` }],
    },
  }

  function pickCatchCat(id) {
    setCatchSrc(null)
    setCatchCat(id)
  }

  function pickSource(value) {
    if (!value) {
      setCatchSrc(null)
      return
    }
    const [cat] = value.split(":")
    setCatchCat(cat)
    setCatchSrc(value)
  }

  function pickUserCat(id) {
    setUserSrc(null)
    setIntentId(null)
    setUserCat(id)
  }

  const detailLink = (id) => (
    <Button type="link" size="small" onClick={() => { setDetailQuery(""); setOpenDetail(id) }}>
      查看明细
    </Button>
  )

  function matchQuery(row) {
    const text = detailQuery.trim().toLowerCase()
    if (!text) return true
    return `${row.name} ${row.url} ${row.type || ""}`.toLowerCase().includes(text)
  }

  const pageColumns = [
    { title: "页面名称", dataIndex: "name", fixed: "left", width: 160 },
    { title: "url", dataIndex: "url", width: 280, ellipsis: true },
    { title: "页面类型", dataIndex: "type", width: 140 },
    numCol("浏览次数PV", "pv"),
    numCol("独立访客UV", "uv"),
    numCol("页面平均停留时长", "pageStay", showSec),
    numCol("合格浏览率", "qualifyRate", (value, row) => (compare && row.qualifyRatePrev != null ? `${pct(value)} ` : showRate(value))),
    numCol("平均滚动深度", "scroll", showRate),
    numCol("有效浏览访客", "viewed"),
    numCol("页面转化交互率", "interactRate", showRate),
    numCol("开始交互访客", "started"),
    numCol("表单完成率", "formDone", showRate),
    numCol("开聊留资率", "chatLead", () => "—"),
    numCol("页面留资数", "pageLeads"),
  ]

  const landColumns = [
    { title: "页面名称", dataIndex: "name", fixed: "left", width: 160 },
    { title: "url", dataIndex: "url", width: 280, ellipsis: true },
    numCol("独立访客UV", "landUv"),
    numCol("秒退访客数", "bounceUv"),
    numCol("秒退率", "bounce", showRate),
    numCol("落地接住率", "catchRate", (value, row) => (
      compare && row.catchRatePrev != null ? `${pct(value)}（上周 ${pct(row.catchRatePrev)}）` : showRate(value)
    )),
    numCol("落地平均停留时长", "landStay", showSec),
    numCol("平均滚动深度", "scroll", showRate),
    numCol("落地页留资数", "landLeads"),
  ]

  function renderDetail() {
    if (openDetail === "sources") {
      const text = detailQuery.trim().toLowerCase()
      const rows = model.sources.filter((row) => !text || `${row.name} ${channelName(row.cat)}`.toLowerCase().includes(text))
      return (
        <>
          <p className="db-card-hint">榜上只显示前 10。这里是全部具体来源，共 {fmtInt(model.sources.length)} 个。直接访问和外部链接没有更细的名字。搜索引擎、广告对不上名字的，记成未标明。</p>
          <Input.Search allowClear placeholder="搜来源名称" value={detailQuery} onChange={(event) => setDetailQuery(event.target.value)} style={{ marginBottom: 12, maxWidth: 360 }} />
          <Table
            size="small"
            rowKey={(row) => `${row.cat}-${row.name}`}
            pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: [20, 50, 100], showTotal: (total) => `共 ${total} 个来源` }}
            scroll={{ y: 460 }}
            dataSource={rows}
            columns={[
              { title: "渠道", dataIndex: "cat", render: (value) => channelName(value) },
              { title: "具体来源", dataIndex: "name" },
              numCol("UV", "uv"),
              numCol("PV", "pv"),
              numCol("留资访客", "leads"),
            ]}
          />
        </>
      )
    }
    if (openDetail === "funnel") {
      return (
        <Row gutter={[24, 16]}>
          <Col xs={24} lg={13}>
            <StageFunnel stages={stages} height={360} withShare />
            <div className="db-fd-rail" style={{ marginTop: 12 }}>
              {LOSSES.map((loss) => (
                <Button key={loss.id} type={lossId === loss.id ? "primary" : "default"} size="small" onClick={() => setLossId(loss.id)} style={{ marginRight: 8, marginBottom: 8 }}>
                  {loss.primary} {showRate(strip[loss.id].pass)}
                </Button>
              ))}
            </div>
          </Col>
          <Col xs={24} lg={11}>
            <LossDetail loss={activeLoss} gate={strip[activeLoss.id]} sliceName={channelName(sliceId)} compare={compare} />
          </Col>
        </Row>
      )
    }
    if (openDetail === "pages") {
      const rows = pages.filter(matchQuery)
      return (
        <>
          <p className="db-card-hint">榜上只显示前 5。这里是这个渠道在窗口里访问过的全部页面，共 {fmtInt(pages.length)} 个。地址后面的追踪参数已经并进原页面。停留按访问路径里的秒数来算。滚动、合格浏览、表单留资这几列，页面统计表没有记到的地址先空着。</p>
          <Input.Search allowClear placeholder="搜页面名称或地址" value={detailQuery} onChange={(event) => setDetailQuery(event.target.value)} style={{ marginBottom: 12, maxWidth: 360 }} />
          <Table size="small" rowKey="url" pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: [20, 50, 100], showTotal: (total) => `共 ${total} 个页面` }} scroll={{ x: "max-content", y: 460 }} dataSource={rows} columns={pageColumns} />
        </>
      )
    }
    if (openDetail === "lands") {
      const rows = lands.filter(matchQuery)
      return (
        <>
          <p className="db-card-hint">榜上只显示前 5。这里是这个渠道的全部落地页，共 {fmtInt(lands.length)} 个。追踪参数已并进原页面。人数按整个窗口去重。</p>
          <Input.Search allowClear placeholder="搜页面名称或地址" value={detailQuery} onChange={(event) => setDetailQuery(event.target.value)} style={{ marginBottom: 12, maxWidth: 360 }} />
          <Table size="small" rowKey="url" pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: [20, 50, 100], showTotal: (total) => `共 ${total} 个落地页` }} scroll={{ x: "max-content", y: 460 }} dataSource={rows} columns={landColumns} />
        </>
      )
    }
    if (openDetail === "intents") {
      return (
        <Table
          size="small"
          rowKey="id"
          pagination={false}
          dataSource={INTENTS.map((item) => userStages.find((row) => row.id === item.id) || { ...item, count: 0, leads: 0 })}
          columns={[
            { title: "意图", dataIndex: "name" },
            { title: "含义", dataIndex: "id", render: (id) => INTENTS.find((item) => item.id === id)?.meaning },
            numCol("人数", "count"),
            { title: "占比", align: "right", render: (_, row) => pct(intentTotal ? row.count / intentTotal : 0) },
            numCol("留资访客", "leads"),
          ]}
        />
      )
    }
    if (openDetail === "paths") {
      const text = detailQuery.trim().toLowerCase()
      const rows = pathRows.filter((row) => !text || row.label.toLowerCase().includes(text))
      return (
        <>
          <p className="db-card-hint">榜上只显示前 5。这里是这一档的全部访问路径，共 {fmtInt(pathRows.length)} 条。连续打开的同类页面已并成一步。人数按人天计，同一个人同一天走了不止一条路时会各算一次。</p>
          <Input.Search allowClear placeholder="搜路径" value={detailQuery} onChange={(event) => setDetailQuery(event.target.value)} style={{ marginBottom: 12, maxWidth: 360 }} />
          <Table
            size="small"
            rowKey="label"
            pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: [20, 50, 100], showTotal: (total) => `共 ${total} 条路径` }}
            scroll={{ y: 460 }}
            dataSource={rows}
            columns={[
              { title: "页面类型路径", dataIndex: "label" },
              numCol("人数", range),
              { title: "占比", align: "right", render: (_, row) => pct(pathSum ? row[range] / pathSum : 0) },
            ]}
          />
        </>
      )
    }
    if (openDetail === "regions") {
      return <Empty description="访问统计没有国家、城市，地域分布排不出来。" />
    }
    if (openDetail === "terms") {
      const text = detailQuery.trim().toLowerCase()
      const rows = model.terms.filter((row) => !text || row.term.toLowerCase().includes(text))
      return (
        <Tabs
          activeKey={termTab}
          onChange={setTermTab}
          items={[
            {
              key: "site",
              label: "站内搜索",
              children: (
                <>
                  <p className="db-card-hint">榜上只显示前 5。这里是全部站内搜索词，共 {fmtInt(model.terms.length)} 个。0 结果率的分母不含结果数没报上来的次数。</p>
                  <Input.Search allowClear placeholder="搜搜索词" value={detailQuery} onChange={(event) => setDetailQuery(event.target.value)} style={{ marginBottom: 12, maxWidth: 360 }} />
                  <Table
                    size="small"
                    rowKey="term"
                    pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: [20, 50, 100], showTotal: (total) => `共 ${total} 个搜索词` }}
                    scroll={{ y: 460 }}
                    dataSource={rows}
                    columns={[
                      { title: "搜索词", dataIndex: "term" },
                      numCol("搜索次数", "searches"),
                      numCol("搜过该词访客", "uv"),
                      numCol("0结果次数", "zeroHits"),
                      numCol("0结果率", "zeroRate", showRate),
                      numCol("搜后离站率", "leaveRate", showRate),
                    ]}
                  />
                </>
              ),
            },
            { key: "gsc", label: "自然搜索", children: <Empty description="访问统计没有 Google Search Console 的展示、点击和排名。" /> },
            { key: "ads", label: "谷歌广告", children: <Empty description="访问统计没有广告搜索词的展示、点击和花费。" /> },
          ]}
        />
      )
    }
    return null
  }

  const modalTitle = {
    sources: `具体渠道明细 · ${fmtInt(model.sources.length)} 个来源`,
    funnel: `留资漏斗 · ${channelName(sliceId)}`,
    pages: `页面明细 · ${channelName(sliceId)} · ${fmtInt(pages.length)} 个页面`,
    lands: `落地页明细 · ${channelName(sliceId)} · ${fmtInt(lands.length)} 个页面`,
    intents: `用户意图 · ${channelName(userCat)}`,
    paths: `页面访问路径 · ${channelName(userCat)} · ${intentName} · ${fmtInt(pathRows.length)} 条`,
    terms: `访客搜索词 · ${fmtInt(model.terms.length)} 个`,
    regions: "地域分布 · 全站",
  }[openDetail]

  const pageMax = pages[0]?.uv || 1
  const landMax = lands[0]?.landUv || 1
  const topSources = model.sources.slice(0, 10)
  const sourceMax = topSources[0]?.uv || 1

  return (
    <ConfigProvider theme={BOARD_THEME}>
      <div className="dan-board">
        <div className="db-window">
          <span>时间窗口</span>
          <Segmented value={range} onChange={setRange} options={RANGES} />
          <span className="db-window-span">{model.span}{model.partial ? ` · ${model.partial}` : ""}</span>
        </div>
        <p className="db-card-hint">
          人数按日访客相加。AI 已从搜索引擎拆出。具体来源和落地页按会话去重，和渠道上的日访客不是同一把尺子。开聊留资、自然搜索词、广告花费、地域没有字段。
        </p>

        <Row gutter={[16, 16]} className="db-kpis">
          <Col xs={24} sm={12} xl={6}>
            <KpiCard title="访问人数" cur={entry.cur} prev={entry.prev} compare={false} />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <KpiCard title="有效浏览率" cur={viewRate} prev={viewPrev} mode="rate" compare={false} />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <KpiCard title="留资数" cur={lead.cur} prev={lead.prev} compare={false} />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <KpiCard title="留资转化率" cur={leadRate} prev={leadPrev} mode="rate" compare={false} />
          </Col>
        </Row>

        <div className="db-section-head">
          <h2>流量</h2>
          <span>从哪来、来了多少</span>
        </div>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card title="独立访客走势">
              <div className="db-chart-unit">单位：人（日独立访客）</div>
              <Suspense fallback={<div className="db-chart-wait" />}>
                <Line key={range} {...trendConfig} />
              </Suspense>
            </Card>
          </Col>
          <Col xs={24} xl={12}>
            <Card title="流量渠道">
              <div className="db-mix" role="img" aria-label="渠道 UV 构成">
                {channelRows.map((cat) => (
                  <Tooltip key={cat.id} title={`${cat.name} ${fmtInt(cat.uv)} · ${pct(cat.share)}`}>
                    <span style={{ width: `${cat.share * 100}%`, background: cat.color }} />
                  </Tooltip>
                ))}
              </div>
              <div className="db-mix-legend">
                {channelRows.map((cat) => (
                  <span key={cat.id}>
                    <i style={{ background: cat.color }} />
                    {cat.name} <b>{pct(cat.share)}</b>
                  </span>
                ))}
              </div>
              <p className="db-card-hint">点击渠道行，下方「网站承接」跟着切换。</p>
              <Table
                size="small"
                rowKey="id"
                pagination={false}
                dataSource={channelRows}
                rowClassName={(row) => (catchCat === row.id ? "is-picked" : "is-pickable")}
                onRow={(row) => ({ onClick: () => pickCatchCat(catchCat === row.id ? "all" : row.id) })}
                columns={[
                  {
                    title: "渠道",
                    dataIndex: "name",
                    render: (name, row) => (
                      <span className="db-channel-name">
                        <i className="db-channel-dot" style={{ background: row.color }} />
                        {name}
                      </span>
                    ),
                  },
                  numCol("UV", "uv"),
                  {
                    title: "占比",
                    width: 150,
                    render: (_, row) => (
                      <Progress percent={Math.round(row.share * 1000) / 10} size="small" strokeColor={ACCENT} format={(value) => `${value.toFixed(1)}%`} />
                    ),
                  },
                  numCol("PV", "pv"),
                  numCol("留资访客", "leadUv"),
                ]}
                summary={() => (
                  <Table.Summary.Row className="db-sum-row">
                    <Table.Summary.Cell index={0}>合计</Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">{fmtInt(siteUv)}</Table.Summary.Cell>
                    <Table.Summary.Cell index={2}>100%</Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="right">{fmtInt(channelRows.reduce((sum, row) => sum + row.pv, 0))}</Table.Summary.Cell>
                    <Table.Summary.Cell index={4} align="right">{fmtInt(lead.cur)}</Table.Summary.Cell>
                  </Table.Summary.Row>
                )}
              />
            </Card>
          </Col>
          <Col xs={24} xl={12}>
            <Card title="具体渠道 TOP10" extra={detailLink("sources")}>
              <p className="db-card-hint">按会话去重后的 UV 排序。直接访问、外部链接没有更细的来源名。</p>
              <RankList
                items={topSources.map((row) => ({
                  key: `${row.cat}-${row.name}`,
                  name: row.name,
                  tag: <Tag className="db-tag-mini">{channelName(row.cat)}</Tag>,
                  valueText: `${fmtInt(row.uv)} · ${pct(siteUv ? row.uv / siteUv : 0)}`,
                  percent: sourceMax ? (row.uv / sourceMax) * 100 : 0,
                }))}
              />
            </Card>
          </Col>
        </Row>

        <div className="db-section-head">
          <h2>网站承接</h2>
          <span>来了之后看进去没、留下没</span>
        </div>
        <Card size="small" className="db-filterbar">
          <div className="db-filter-row">
            <div className="db-filter">
              <span className="db-filter-label">渠道</span>
              <Segmented
                value={catchCat}
                onChange={pickCatchCat}
                options={[{ value: "all", label: "全站" }, ...CHANNELS.map((item) => ({ value: item.id, label: item.name }))]}
              />
            </div>
            <div className="db-filter">
              <span className="db-filter-label">具体来源</span>
              <Select allowClear placeholder="全部来源" value={catchSrc} onChange={pickSource} options={sourceOptions} style={{ width: 200 }} />
            </div>
          </div>
        </Card>
        {catchSrc ? (
          <Alert type="info" showIcon title="具体来源没有单独的漏斗和页面，下面仍是整个渠道。" />
        ) : null}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12} xl={8}>
            <Card title={<>留资漏斗 <Tag className="db-tag-mini">{channelName(sliceId)}</Tag></>} extra={detailLink("funnel")}>
              <StageFunnel stages={stages} height={300} />
            </Card>
          </Col>
          <Col xs={24} lg={12} xl={8}>
            <Card title={<>页面 TOP5 <Tag className="db-tag-mini">{channelName(sliceId)}</Tag></>} extra={pages.length ? detailLink("pages") : null}>
              <RankList
                empty={pages.length ? "" : "还没有页面数据"}
                items={pages.slice(0, 5).map((row) => ({
                  key: row.url,
                  name: row.name,
                  tip: row.url,
                  valueText: `UV ${fmtInt(row.uv)}`,
                  percent: (row.uv / pageMax) * 100,
                  sub: `停留 ${showSec(row.pageStay)} · 留资 ${row.leadUv == null ? "—" : fmtInt(row.leadUv)}`,
                }))}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12} xl={8}>
            <Card title={<>落地页 TOP5 <Tag className="db-tag-mini">{channelName(sliceId)}</Tag></>} extra={lands.length ? detailLink("lands") : null}>
              <p className="db-card-hint">按会话里的落地地址统计。</p>
              <RankList
                empty={lands.length ? "" : "还没有落地页数据"}
                items={lands.slice(0, 5).map((row) => {
                  const bad = compare && rateBrokeDown(row.catchRate, row.catchRatePrev)
                  return {
                    key: row.url,
                    name: row.name,
                    tip: row.url,
                    tag: bad ? <Tag color="error" className="db-tag-mini">接住率下滑</Tag> : null,
                    valueText: `UV ${fmtInt(row.landUv)}`,
                    percent: (row.landUv / landMax) * 100,
                    alert: bad,
                    sub: `接住 ${showRate(row.catchRate)}${compare && row.catchRatePrev != null ? `（上周 ${pct(row.catchRatePrev)}）` : ""} · 秒退 ${showRate(row.bounce)}`,
                  }
                })}
              />
            </Card>
          </Col>
        </Row>

        <div className="db-section-head">
          <h2>用户</h2>
          <span>什么意图、怎么走、在哪、搜了什么</span>
        </div>
        <Card size="small" className="db-filterbar">
          <div className="db-filter-row">
            <div className="db-filter">
              <span className="db-filter-label">渠道</span>
              <Segmented
                value={userCat}
                onChange={pickUserCat}
                options={[{ value: "all", label: "全站" }, ...CHANNELS.map((item) => ({ value: item.id, label: item.name }))]}
              />
            </div>
            <div className="db-filter">
              <span className="db-filter-label">具体来源</span>
              <Select
                allowClear
                placeholder="全部来源"
                value={userSrc}
                onChange={(value) => {
                  if (!value) {
                    setUserSrc(null)
                    return
                  }
                  setUserCat(value.split(":")[0])
                  setUserSrc(value)
                  setIntentId(null)
                }}
                options={sourceOptions}
                style={{ width: 200 }}
              />
            </div>
          </div>
        </Card>
        {userSrc ? <Alert type="info" showIcon title="具体来源没有单独的意图和路径，下面仍是整个渠道。地域按全站，搜索词不随渠道变。" /> : null}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title={<>用户意图 <Tag className="db-tag-mini">{channelName(userCat)}</Tag></>} extra={detailLink("intents")}>
              <p className="db-card-hint">
                点一档，右侧路径跟着切。日表口径是当天的浏览等级，再按天相加。
                {userCat === "all" && model.lossShare != null ? ` 其中 ${pct(model.lossShare)} 带流失信号。` : ""}
              </p>
              <ol className="db-rank">
                {INTENTS.map((item) => {
                  const hit = userStages.find((row) => row.id === item.id) || { count: 0, leads: 0 }
                  const on = intentId === item.id
                  return (
                    <li key={item.id}>
                      <button type="button" className={`db-rank-row is-btn${on ? " is-on" : ""}`} aria-pressed={on} onClick={() => setIntentId(on ? null : item.id)}>
                        <span className="db-rank-dot" style={{ background: item.color }} />
                        <span className="db-rank-main">
                          <span className="db-rank-line">
                            <span className="db-rank-name">{item.name}</span>
                            <span className="db-rank-hint">{item.meaning}</span>
                            <span className="db-rank-value">{fmtInt(hit.count)} 人 · {pct(intentTotal ? hit.count / intentTotal : 0)}</span>
                          </span>
                          <Progress percent={intentTotal ? (hit.count / intentTotal) * 100 : 0} showInfo={false} size="small" strokeColor={ACCENT} />
                          <span className="db-rank-sub">留资访客 {fmtInt(hit.leads)} 人</span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ol>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={<>页面访问路径 TOP5 <Tag className="db-tag-mini">{channelName(userCat)} · {intentName}</Tag></>} extra={pathRows.length ? detailLink("paths") : null}>
              <p className="db-card-hint">{pathHint}</p>
              <RankList
                empty="还没有路径数据"
                items={pathRows.slice(0, 5).map((row) => ({
                  key: row.label,
                  name: row.label,
                  valueText: `${fmtInt(row[range])} 人 · ${pct(pathSum ? row[range] / pathSum : 0)}`,
                  percent: pathRows[0]?.[range] ? (row[range] / pathRows[0][range]) * 100 : 0,
                }))}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={<>地域分布 <Tag className="db-tag-mini">全站</Tag></>} extra={detailLink("regions")} className="db-fill">
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="访问统计没有国家、城市，地图和城市表都排不出来。" />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="搜索词 TOP5" extra={detailLink("terms")}>
              <p className="db-card-hint">站内搜索按词统计。自然搜索和谷歌广告不在这套访问统计里。</p>
              <Segmented
                block
                size="small"
                value={termTab}
                onChange={setTermTab}
                options={[{ value: "site", label: "站内搜索" }, { value: "gsc", label: "自然搜索" }, { value: "ads", label: "谷歌广告" }]}
                className="db-term-tabs"
              />
              {termTab === "site" ? (
                <RankList
                  items={model.terms.slice(0, 5).map((row) => ({
                    key: row.term,
                    name: row.term,
                    valueText: `${fmtInt(row.searches)} 次`,
                    percent: model.terms[0]?.searches ? (row.searches / model.terms[0].searches) * 100 : 0,
                    sub: `0结果 ${showRate(row.zeroRate)} · 搜后离站 ${showRate(row.leaveRate)}`,
                  }))}
                />
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={termTab === "gsc" ? "没有自然搜索的展示、点击和排名" : "没有广告搜索词的展示、点击和花费"}
                />
              )}
            </Card>
          </Col>
        </Row>

        <Modal
          open={Boolean(openDetail)}
          title={modalTitle}
          width={1040}
          rootClassName="db-modal"
          footer={null}
          destroyOnHidden
          onCancel={() => setOpenDetail("")}
        >
          {renderDetail()}
        </Modal>
      </div>
    </ConfigProvider>
  )
}
