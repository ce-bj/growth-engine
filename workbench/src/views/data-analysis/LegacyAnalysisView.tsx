import { QuestionCircleFilled } from '@ant-design/icons'
import { Modal, Table, Tooltip } from 'antd'
import { Calendar, ChevronLeft, ChevronRight, Globe } from 'lucide-react'
import { createContext, useContext, useState, type ReactNode } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useWorkbench } from '../../context/WorkbenchContext'
import { analysisLabel, type AnalysisViewId } from '../../data/analysisNav'
import type { ViewId } from '../../types'
import './legacy-analysis.css'

type Preset = 'today' | 'yesterday' | 'd7' | 'd30'

const TODAY = new Date(2026, 10, 17)
const LANDINGS = ['全部页面', '首页 /', '产品中心 /products', '关于我们 /about', '联系我们 /contact']

function ymd(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function rangeOf(preset: Preset, shift: number) {
  const step = preset === 'd30' ? 30 : preset === 'd7' ? 7 : 1
  const end = addDays(TODAY, -(preset === 'yesterday' ? 1 : 0) - shift)
  const start = addDays(end, -(step - 1))
  return { start, end, step }
}

function daysBetween(start: Date, end: Date) {
  const rows: Date[] = []
  const cursor = new Date(start)
  while (cursor <= end) {
    rows.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return rows
}

function scaleByPreset(preset: Preset) {
  if (preset === 'today' || preset === 'yesterday') return 1
  if (preset === 'd7') return 7
  return 28
}

function Tip({ text }: { text: string }) {
  return (
    <Tooltip title={text}>
      <QuestionCircleFilled className="la-kpi__tip" />
    </Tooltip>
  )
}

const ChromeContext = createContext<{
  preset: Preset
  range: { start: Date; end: Date; step: number }
} | null>(null)

function useChrome() {
  const value = useContext(ChromeContext)
  if (!value) throw new Error('ChromeContext missing')
  return value
}

function Chrome({ title, children }: { title: string; children: ReactNode }) {
  const { currentSite, sites, siteId, setSiteId, navigate } = useWorkbench()
  const [preset, setPreset] = useState<Preset>('today')
  const [shift, setShift] = useState(0)
  const [siteOpen, setSiteOpen] = useState(false)
  const range = rangeOf(preset, shift)

  return (
    <div className="la-page">
      <div className="la-crumb">
        <div className="la-crumb__path">
          <button type="button" onClick={() => navigate('dashboard')}>
            首页
          </button>
          <span>&gt;</span>
          <button type="button" onClick={() => navigate('board')}>
            数据分析
          </button>
          <span>&gt;</span>
          <span className="la-crumb__now">{title}</span>
        </div>
        <button type="button" className="la-help">
          查看本页帮助
        </button>
      </div>

      <div className="la-site">
        <span className="la-site__name">
          <Globe size={16} />
          {currentSite.language} {currentSite.url}
        </span>
        <button type="button" className="la-pick" onClick={() => setSiteOpen(true)}>
          切换网站
        </button>
      </div>

      <div className="la-toolbar">
        <button
          type="button"
          className="la-nav-btn"
          aria-label="上一时段"
          onClick={() => setShift((value) => value + range.step)}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          className="la-nav-btn"
          aria-label="下一时段"
          disabled={shift === 0 && preset !== 'yesterday'}
          onClick={() => setShift((value) => Math.max(0, value - range.step))}
        >
          <ChevronRight size={16} />
        </button>
        {(
          [
            ['today', '今天'],
            ['yesterday', '昨天'],
            ['d7', '最后7天'],
            ['d30', '最后30天'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`la-preset${preset === id ? ' is-on' : ''}`}
            onClick={() => {
              setPreset(id)
              setShift(0)
            }}
          >
            {label}
          </button>
        ))}
        <span className="la-range">
          {ymd(range.start)} 至 {ymd(range.end)}
          <Calendar size={14} />
        </span>
      </div>

      <ChromeContext.Provider value={{ preset, range }}>{children}</ChromeContext.Provider>

      <Modal title="切换网站" open={siteOpen} onCancel={() => setSiteOpen(false)} footer={null}>
        <div className="la-site-list">
          {sites.map((site) => (
            <button
              key={site.id}
              type="button"
              className={site.id === siteId ? 'is-on' : ''}
              onClick={() => {
                setSiteId(site.id)
                setSiteOpen(false)
              }}
            >
              {site.name}
              <small>
                {site.language} · {site.url}
              </small>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  )
}

function BounceBody() {
  const { preset, range } = useChrome()
  const [landing, setLanding] = useState(LANDINGS[0])
  const [pickOpen, setPickOpen] = useState(false)
  const factor = landing === '全部页面' ? 1 : landing.includes('产品') ? 0.42 : 0.28
  const visits = Math.max(1, Math.round((preset === 'today' ? 14 : 11 * scaleByPreset(preset)) * factor))
  const bounce = Math.max(1, Math.round(visits * (preset === 'today' ? 0.5 : 0.43)))
  const rate = Math.round((bounce / visits) * 1000) / 10
  const days = daysBetween(range.start, range.end)
  const rows = days.map((day, index) => {
    if (days.length === 1) {
      return { key: ymd(day), date: ymd(day), visits, bounce, rate }
    }
    const weight = 0.85 + (index / Math.max(days.length - 1, 1)) * 0.3
    const dayVisits = Math.max(1, Math.round((visits / days.length) * weight))
    const dayBounce = Math.max(0, Math.round(dayVisits * (rate / 100)))
    return {
      key: ymd(day),
      date: ymd(day),
      visits: dayVisits,
      bounce: dayBounce,
      rate: dayVisits ? Math.round((dayBounce / dayVisits) * 1000) / 10 : 0,
    }
  })

  return (
    <>
      <div className="la-filter">
        <span>选择落地页</span>
        <input readOnly value={landing} />
        <button type="button" className="la-pick" onClick={() => setPickOpen(true)}>
          选择
        </button>
      </div>
      <div className="la-kpis">
        <div className="la-kpi">
          <div className="la-kpi__label">
            访问次数 <Tip text="统计周期内落地页被打开的次数。" />
          </div>
          <strong>{visits}</strong>
        </div>
        <div className="la-kpi">
          <div className="la-kpi__label">
            跳出次数 <Tip text="只看了这一页就离开的访问次数。" />
          </div>
          <strong>{bounce}</strong>
        </div>
        <div className="la-kpi">
          <div className="la-kpi__label">
            跳出率 <Tip text="跳出次数 / 访问次数。" />
          </div>
          <strong>{rate}%</strong>
        </div>
      </div>
      <div className="la-split">
        <div>
          <div className="la-funnel">
            <div className="la-funnel__visit">{visits}</div>
            <div className="la-funnel__bounce">{bounce}</div>
          </div>
          <div className="la-legend">
            <span>
              <i className="is-visit" />
              访问次数
            </span>
            <span>
              <i className="is-bounce" />
              跳出次数
            </span>
          </div>
        </div>
        <div className="la-chart">
          <div className="la-chart-legend">
            <b />
            跳出率
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#ebeef5" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#909399', fontSize: 12 }} />
              <YAxis
                domain={[0, Math.max(50, Math.ceil(rate / 10) * 10)]}
                tickFormatter={(value) => `${value}%`}
                tick={{ fill: '#909399', fontSize: 12 }}
              />
              <RechartsTooltip formatter={(value) => [`${value}%`, '跳出率']} />
              <Line type="monotone" dataKey="rate" stroke="#4a90e2" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="la-table-wrap">
        <Table
          size="middle"
          rowKey="key"
          pagination={rows.length > 10 ? { pageSize: 10 } : false}
          dataSource={rows}
          columns={[
            { title: '日期', dataIndex: 'date' },
            { title: '访问次数', dataIndex: 'visits', align: 'center' },
            { title: '跳出次数', dataIndex: 'bounce', align: 'center' },
            {
              title: '跳出率',
              dataIndex: 'rate',
              align: 'center',
              render: (value: number) => `${value}%`,
            },
          ]}
        />
      </div>
      <Modal title="选择落地页" open={pickOpen} onCancel={() => setPickOpen(false)} footer={null}>
        <div className="la-site-list">
          {LANDINGS.map((item) => (
            <button
              key={item}
              type="button"
              className={item === landing ? 'is-on' : ''}
              onClick={() => {
                setLanding(item)
                setPickOpen(false)
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </Modal>
    </>
  )
}

function VisitBody() {
  const { preset } = useChrome()
  const [tab, setTab] = useState('overview')
  const n = scaleByPreset(preset)
  const uv = 18 * n
  const pv = 41 * n
  const visits = 26 * n
  const sources = [
    { name: '搜索引擎', value: 46 },
    { name: '直接访问', value: 31 },
    { name: '外部链接', value: 23 },
  ]
  const pages = [
    { page: '/', pv: Math.round(pv * 0.32), uv: Math.round(uv * 0.28), bounce: '38%', stay: '00:01:12' },
    { page: '/products', pv: Math.round(pv * 0.24), uv: Math.round(uv * 0.22), bounce: '41%', stay: '00:02:05' },
    { page: '/products/cnc-parts', pv: Math.round(pv * 0.18), uv: Math.round(uv * 0.16), bounce: '36%', stay: '00:02:41' },
    { page: '/about', pv: Math.round(pv * 0.14), uv: Math.round(uv * 0.18), bounce: '44%', stay: '00:00:48' },
    { page: '/contact', pv: Math.round(pv * 0.12), uv: Math.round(uv * 0.16), bounce: '29%', stay: '00:01:36' },
  ]

  return (
    <>
      <div className="la-tabs">
        {[
          ['overview', '概况'],
          ['trend', '趋势分析'],
          ['source', '来源分类'],
          ['pages', '受访页面'],
        ].map(([id, label]) => (
          <button key={id} type="button" className={tab === id ? 'is-on' : ''} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'overview' ? (
        <div className="la-kpis is-4">
          <div className="la-kpi">
            <div className="la-kpi__label">独立访客</div>
            <strong>{uv}</strong>
          </div>
          <div className="la-kpi">
            <div className="la-kpi__label">访问次数</div>
            <strong>{visits}</strong>
          </div>
          <div className="la-kpi">
            <div className="la-kpi__label">浏览量</div>
            <strong>{pv}</strong>
          </div>
          <div className="la-kpi">
            <div className="la-kpi__label">人均浏览页数</div>
            <strong>{(pv / uv).toFixed(1)}</strong>
          </div>
        </div>
      ) : null}
      {tab === 'trend' ? (
        <div className="la-panel">
          <div className="la-chart" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={Array.from({ length: Math.min(n, 14) }, (_, index) => ({
                  day: `D${index + 1}`,
                  uv: Math.round(uv / Math.min(n, 14) + index * 1.2),
                  pv: Math.round(pv / Math.min(n, 14) + index * 2.1),
                }))}
              >
                <CartesianGrid stroke="#ebeef5" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: '#909399', fontSize: 12 }} />
                <YAxis tick={{ fill: '#909399', fontSize: 12 }} />
                <RechartsTooltip />
                <Line type="monotone" dataKey="uv" name="独立访客" stroke="#3b9fd0" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="pv" name="浏览量" stroke="#7ed321" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}
      {tab === 'source' ? (
        <div className="la-panel">
          <div className="la-bars">
            {sources.map((item) => (
              <div key={item.name} className="la-bar">
                <span>{item.name}</span>
                <div className="la-bar__track">
                  <span style={{ width: `${item.value}%` }} />
                </div>
                <span>{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {tab === 'pages' ? (
        <div className="la-table-wrap">
          <Table
            size="middle"
            rowKey="page"
            pagination={false}
            dataSource={pages}
            columns={[
              { title: '受访页面', dataIndex: 'page' },
              { title: '浏览量', dataIndex: 'pv', align: 'center' },
              { title: '独立访客', dataIndex: 'uv', align: 'center' },
              { title: '跳出率', dataIndex: 'bounce', align: 'center' },
              { title: '平均停留', dataIndex: 'stay', align: 'center' },
            ]}
          />
        </div>
      ) : null}
    </>
  )
}

function GoogleBody() {
  const { preset } = useChrome()
  const n = scaleByPreset(preset)
  const indexed = 96 + n
  const submitted = 128
  const rows = [
    { url: '/', status: '已收录', crawled: '2026-11-16' },
    { url: '/products', status: '已收录', crawled: '2026-11-15' },
    { url: '/products/cnc-parts', status: '已收录', crawled: '2026-11-14' },
    { url: '/about', status: '发现-未收录', crawled: '—' },
    { url: '/contact', status: '已收录', crawled: '2026-11-12' },
  ]
  return (
    <>
      <div className="la-kpis">
        <div className="la-kpi">
          <div className="la-kpi__label">已收录</div>
          <strong>{indexed}</strong>
        </div>
        <div className="la-kpi">
          <div className="la-kpi__label">已提交</div>
          <strong>{submitted}</strong>
        </div>
        <div className="la-kpi">
          <div className="la-kpi__label">覆盖率</div>
          <strong>{Math.round((indexed / submitted) * 100)}%</strong>
        </div>
      </div>
      <div className="la-table-wrap">
        <Table
          size="middle"
          rowKey="url"
          pagination={false}
          dataSource={rows}
          columns={[
            { title: 'URL', dataIndex: 'url' },
            { title: '状态', dataIndex: 'status' },
            { title: '上次抓取', dataIndex: 'crawled' },
          ]}
        />
      </div>
    </>
  )
}

function BehaviorBody() {
  const { preset } = useChrome()
  const n = scaleByPreset(preset)
  const rows = [
    { page: '/', enter: 12 * n, next: '/products', keep: '61%' },
    { page: '/products', enter: 8 * n, next: '/products/cnc-parts', keep: '54%' },
    { page: '/products/cnc-parts', enter: 5 * n, next: '/contact', keep: '33%' },
    { page: '/about', enter: 3 * n, next: '/', keep: '22%' },
  ]
  return (
    <div className="la-table-wrap">
      <Table
        size="middle"
        rowKey="page"
        pagination={false}
        dataSource={rows}
        columns={[
          { title: '入口页', dataIndex: 'page' },
          { title: '进入次数', dataIndex: 'enter', align: 'center' },
          { title: '下一步最多去向', dataIndex: 'next' },
          { title: '下一步留存', dataIndex: 'keep', align: 'center' },
        ]}
      />
    </div>
  )
}

function LeadsBody() {
  const { preset, range } = useChrome()
  const n = scaleByPreset(preset)
  const total = preset === 'today' ? 1 : Math.max(2, Math.round(0.6 * n))
  const form = Math.max(1, Math.round(total * 0.7))
  const chat = total - form
  const rows = daysBetween(range.start, range.end)
    .map((day, index) => ({
      key: ymd(day),
      date: ymd(day),
      leads: index === daysBetween(range.start, range.end).length - 1 ? Math.max(1, total) : index % 3 === 0 ? 1 : 0,
    }))
    .filter((row, _, all) => all.length <= 7 || row.leads > 0 || all.indexOf(row) % 5 === 0)

  return (
    <>
      <div className="la-kpis">
        <div className="la-kpi">
          <div className="la-kpi__label">线索总数</div>
          <strong>{total}</strong>
        </div>
        <div className="la-kpi">
          <div className="la-kpi__label">表单留资</div>
          <strong>{form}</strong>
        </div>
        <div className="la-kpi">
          <div className="la-kpi__label">对话留资</div>
          <strong>{chat}</strong>
        </div>
      </div>
      <div className="la-table-wrap">
        <Table
          size="middle"
          rowKey="key"
          pagination={false}
          dataSource={rows}
          columns={[
            { title: '日期', dataIndex: 'date' },
            { title: '线索数', dataIndex: 'leads', align: 'center' },
          ]}
        />
      </div>
    </>
  )
}

function ReportBody() {
  const [email, setEmail] = useState('ops@example.com')
  const [freq, setFreq] = useState('weekly-mon')
  const [saved, setSaved] = useState(false)
  return (
    <div className="la-panel">
      <div className="la-form">
        <label htmlFor="la-report-mail">接收邮箱</label>
        <input id="la-report-mail" value={email} onChange={(event) => setEmail(event.target.value)} />
        <label htmlFor="la-report-freq">发送频率</label>
        <select id="la-report-freq" value={freq} onChange={(event) => setFreq(event.target.value)}>
          <option value="weekly-mon">每周一</option>
          <option value="weekly-fri">每周五</option>
          <option value="monthly">每月 1 日</option>
        </select>
        <div className="la-form__actions">
          <button type="button" className="la-save" onClick={() => setSaved(true)}>
            保存配置
          </button>
        </div>
      </div>
      {saved ? <p className="la-note">已保存。将按设定频率发送当前站点的运营报告。</p> : null}
      <div className="la-table-wrap" style={{ paddingLeft: 0, paddingRight: 0, marginTop: 24 }}>
        <Table
          size="middle"
          rowKey="id"
          pagination={false}
          dataSource={[
            { id: '1', sentAt: '2026-11-10 09:12', to: 'ops@example.com', status: '已发送' },
            { id: '2', sentAt: '2026-11-03 09:08', to: 'ops@example.com', status: '已发送' },
          ]}
          columns={[
            { title: '发送时间', dataIndex: 'sentAt' },
            { title: '收件邮箱', dataIndex: 'to' },
            { title: '状态', dataIndex: 'status' },
          ]}
        />
      </div>
    </div>
  )
}

function Body({ view }: { view: Exclude<AnalysisViewId, 'board'> }) {
  if (view === 'analysisVisit') return <VisitBody />
  if (view === 'analysisBounce') return <BounceBody />
  if (view === 'analysisGoogle') return <GoogleBody />
  if (view === 'analysisBehavior') return <BehaviorBody />
  if (view === 'analysisLeads') return <LeadsBody />
  return <ReportBody />
}

export function LegacyAnalysisView({ view }: { view: ViewId }) {
  if (view === 'board' || !view.startsWith('analysis')) return null
  const title = analysisLabel(view)
  return (
    <Chrome title={title}>
      <Body view={view as Exclude<AnalysisViewId, 'board'>} />
    </Chrome>
  )
}
