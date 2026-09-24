import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  ArrowRight,
  Bot,
  Bug,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  Clock,
  Code2,
  ExternalLink,
  FileCheck,
  FileText,
  Globe,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  XCircle,
} from 'lucide-react'
import {
  BOT_COLORS,
  LLMS_TEXT,
  PRODUCT_JSONLD,
  ROBOTS_TEXT,
  buildProductDraft,
  checks,
  crawlTrend30d,
  crawlerLogs,
  initialProducts,
} from './data.js'

const STATUS = {
  pass: { Icon: CircleCheck, color: 'text-emerald-600', bg: 'bg-emerald-100', label: '已就绪' },
  warn: { Icon: TriangleAlert, color: 'text-amber-600', bg: 'bg-amber-100', label: '需关注' },
  fail: { Icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-100', label: '未通过' },
}

const CHECK_ICONS = {
  'llms-txt': FileText,
  'schema-jsonld': Code2,
  'robots-txt': Bot,
  ssr: Globe,
  https: Shield,
  sitemap: FileCheck,
  'og-tags': ExternalLink,
}

const SCHEMA_PAGES = [
  { name: '首页', type: 'Organization' },
  { name: '产品详情页', type: 'Product' },
  { name: '文章页', type: 'Article' },
  { name: 'FAQ页', type: 'FAQPage' },
]

const ROBOTS = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Bytespider', 'Googlebot', 'Bingbot', 'AppleBot', 'Meta-ExternalAgent']

function bandOf(score) {
  if (score >= 100) return { label: '全部合格', chip: 'bg-emerald-100 text-emerald-700' }
  if (score >= 90) return { label: '已达标', chip: 'bg-emerald-100 text-emerald-700' }
  if (score >= 70) return { label: '需关注', chip: 'bg-amber-100 text-amber-700' }
  return { label: '待优化', chip: 'bg-rose-100 text-rose-700' }
}

function scoreOf(issues) {
  return 100 - issues.reduce((sum, issue) => sum + issue.weight, 0)
}

function withMaterials(product) {
  return { ...product, materials: product.materials || { text: '', files: [] } }
}

function CodeBlock({ children }) {
  return (
    <pre className="bg-slate-900 text-slate-200 rounded-lg p-4 text-xs leading-relaxed overflow-x-auto">
      <code>{children}</code>
    </pre>
  )
}

function LlmsPanel() {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-gray-600">/llms.txt 当前内容</span>
        <button type="button" className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
          <ExternalLink className="w-3.5 h-3.5" /> 访问 URL
        </button>
      </div>
      <CodeBlock>{LLMS_TEXT}</CodeBlock>
    </div>
  )
}

function SchemaPanel() {
  return (
    <div>
      <div className="text-xs font-bold text-gray-600 mb-2">核心页面 Schema 配置一览</div>
      <div className="space-y-2">
        {SCHEMA_PAGES.map((page) => (
          <div key={page.name} className="flex items-center gap-3 p-2.5 bg-white rounded-md border border-gray-100">
            <CircleCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-700 flex-shrink-0">{page.name}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-medium">{page.type}</span>
            <button type="button" className="ml-auto text-xs text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1">
              <Code2 className="w-3.5 h-3.5" /> 查看代码
            </button>
            <button type="button" className="text-xs text-amber-600 hover:text-amber-700 cursor-pointer flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> AI 重新生成
            </button>
          </div>
        ))}
      </div>
      <pre className="bg-slate-900 text-slate-200 rounded-lg p-4 text-xs leading-relaxed overflow-x-auto mt-3">
        <code>{PRODUCT_JSONLD}</code>
      </pre>
    </div>
  )
}

function RobotsPanel() {
  return (
    <div>
      <div className="text-xs font-bold text-gray-600 mb-2">AI 爬虫准入状态</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {ROBOTS.map((bot) => (
          <div key={bot} className="flex items-center gap-2 p-2 bg-emerald-50 rounded-md border border-emerald-100">
            <CircleCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs font-medium text-gray-700">{bot}</span>
            <span className="text-xs text-emerald-600 font-medium">Allow</span>
          </div>
        ))}
      </div>
      <CodeBlock>{ROBOTS_TEXT}</CodeBlock>
    </div>
  )
}

function OgPanel() {
  return (
    <div>
      <div className="text-xs font-bold text-gray-600 mb-2">Open Graph 标签检查</div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-2.5 bg-emerald-50 rounded-md border border-emerald-100">
          <CircleCheck className="w-4 h-4 text-emerald-500" />
          <span className="text-sm text-gray-700">og:title · og:description · og:url</span>
          <span className="ml-auto text-xs text-emerald-600 font-medium">已配置</span>
        </div>
        <div className="flex items-center gap-2 p-2.5 bg-amber-50 rounded-md border border-amber-100">
          <TriangleAlert className="w-4 h-4 text-amber-500" />
          <span className="text-sm text-gray-700">og:image</span>
          <span className="ml-auto text-xs text-amber-600 font-medium">3 个产品页缺失</span>
          <button type="button" className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer font-medium ml-2">
            一键补全
          </button>
        </div>
      </div>
    </div>
  )
}

const EXPAND = {
  'llms-txt': LlmsPanel,
  'schema-jsonld': SchemaPanel,
  'robots-txt': RobotsPanel,
  'og-tags': OgPanel,
}

function CheckCard({ check }) {
  const [open, setOpen] = useState(false)
  const status = STATUS[check.status]
  const StatusIcon = status.Icon
  const Icon = CHECK_ICONS[check.id] || FileText
  const Panel = EXPAND[check.id]

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden transition-all hover:shadow-sm hover:border-gray-300">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className={`w-10 h-10 rounded-lg ${status.bg} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${status.color}`} />
            </div>
            <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.color} whitespace-nowrap`}>
              <StatusIcon className="w-3 h-3" /> {status.label}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-gray-800">{check.name}</span>
              {check.expandable && (
                <button
                  type="button"
                  onClick={() => setOpen((value) => !value)}
                  className="flex-shrink-0 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 cursor-pointer font-medium"
                >
                  {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {open ? '收起' : '查看详情'}
                </button>
              )}
            </div>
            <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">{check.concept}</p>
            <div className="mt-2 p-2.5 bg-blue-50/60 rounded-md border border-blue-100">
              <p className="text-[12px] text-gray-600 leading-relaxed">
                <span className="font-semibold text-blue-700">为什么重要：</span>
                {check.importance}
              </p>
            </div>
            <p className="mt-2 text-[12px] text-gray-400">{check.detail}</p>
          </div>
        </div>
      </div>
      {open && Panel && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-4">
          <Panel />
        </div>
      )}
    </div>
  )
}

function ProductCard({ diag, open, onToggle, onMaterials, onAddFiles, onRemoveFile, onOptimize, onDraftChange, onPublishReviewed, onToggleReview }) {
  const fileRef = useRef(null)
  const scoreColor = diag.score >= 90 ? 'text-emerald-600' : diag.score >= 70 ? 'text-amber-600' : 'text-rose-600'
  const barColor = diag.score >= 90 ? 'bg-emerald-500' : diag.score >= 70 ? 'bg-amber-500' : 'bg-rose-500'
  const band = bandOf(diag.score)
  const sensitive = diag.issues.some((issue) => issue.sensitive)
  const canOptimize = diag.score < 100 && diag.status !== 'generating' && diag.status !== 'review'
  const materials = diag.materials || { text: '', files: [] }
  const showBody = open && (diag.issues.length > 0 || diag.draft)

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-gray-800">{diag.name}</span>
              <a href={diag.url} onClick={(event) => event.preventDefault()} className="text-xs text-blue-500 hover:underline truncate">
                {diag.url}
              </a>
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${barColor} rounded-full transition-all duration-700`} style={{ width: `${diag.score}%` }} />
              </div>
              <span className={`text-sm font-bold ${scoreColor}`}>{diag.score}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${band.chip}`}>{band.label}</span>
              {diag.status === 'generating' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium inline-flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> 生成中
                </span>
              )}
              {diag.notice === '已发布到线上。' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium inline-flex items-center gap-1">
                  <CircleCheck className="w-3 h-3" /> 已发布到线上
                </span>
              )}
            </div>
          </div>
          {(diag.issues.length > 0 || diag.draft) && (
            <button type="button" onClick={onToggle} className="flex-shrink-0 p-2 hover:bg-gray-50 rounded cursor-pointer" aria-label={open ? '收起' : '展开'}>
              {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
          )}
        </div>
        {diag.notice && <p className="mt-2 text-xs text-gray-500">{diag.notice}</p>}
        {showBody && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
            {diag.issues.map((issue) => (
              <div key={issue.key} className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-md">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${issue.sensitive ? 'bg-amber-500' : 'bg-rose-500'}`} />
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-medium text-gray-800">{issue.module}</span>
                  <span className="text-[13px] text-gray-600">：{issue.desc}</span>
                  {issue.sensitive && (
                    <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">需补充资料</span>
                  )}
                </div>
              </div>
            ))}
            {sensitive && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md space-y-2">
                <div className="text-sm font-semibold text-amber-800">可补充资料，也可以不传直接优化</div>
                <p className="text-xs text-amber-700 leading-relaxed">支持图片、文件或文字。不上传时，敏感模块生成通用内容，不写质保年数、认证号、运费和精确成分。</p>
                <textarea
                  value={materials.text}
                  onChange={(event) => onMaterials(diag.id, event.target.value)}
                  rows={3}
                  placeholder="例如：材质 8.8 级碳钢，表面镀锌。质保按合同约定，不在这里写死年限。"
                  className="w-full text-sm rounded-md border border-amber-200 bg-white px-3 py-2 text-gray-800 placeholder:text-gray-400"
                />
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 cursor-pointer"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    fileRef.current?.click()
                  }}
                >
                  <FileText className="w-3.5 h-3.5" />
                  选择图片或文件
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  multiple
                  className="hidden"
                  tabIndex={-1}
                  aria-hidden="true"
                  onClick={(event) => event.stopPropagation()}
                  onChange={(event) => {
                    const names = Array.from(event.target.files || []).map((file) => file.name)
                    if (names.length) onAddFiles(diag.id, names)
                    event.target.value = ''
                  }}
                />
                {materials.files.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {materials.files.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => onRemoveFile(diag.id, name)}
                        className="text-xs px-2 py-0.5 rounded-full bg-white border border-amber-200 text-gray-600 cursor-pointer"
                      >
                        {name} ×
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {canOptimize && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onOptimize(diag.id, 'publish')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 text-white text-sm font-medium hover:opacity-90 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" /> 一键优化并发布
                </button>
                <button
                  type="button"
                  onClick={() => onOptimize(diag.id, 'review')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-purple-200 bg-white text-purple-700 text-sm font-medium hover:bg-purple-50 cursor-pointer"
                >
                  一键优化并审查
                </button>
              </div>
            )}
            {diag.draft && diag.status !== 'generating' && (
              <div className="pt-1">
                <button type="button" onClick={() => onToggleReview(diag.id)} className="text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
                  {diag.reviewOpen ? '收起内容' : '查看内容'}
                </button>
              </div>
            )}
            {diag.draft && diag.reviewOpen && diag.status !== 'generating' && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2">
                <label className="block text-xs font-medium text-gray-500">
                  标题（不修改）
                  <input value={diag.draft.title} readOnly className="mt-1 w-full text-sm rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-gray-500" />
                </label>
                <label className="block text-xs font-medium text-gray-500">
                  摘要
                  <textarea
                    value={diag.draft.summary}
                    onChange={(event) => onDraftChange(diag.id, 'summary', event.target.value)}
                    rows={3}
                    className="mt-1 w-full text-sm rounded-md border border-gray-200 bg-white px-3 py-2 text-gray-800"
                  />
                </label>
                <label className="block text-xs font-medium text-gray-500">
                  正文
                  <textarea
                    value={diag.draft.content}
                    onChange={(event) => onDraftChange(diag.id, 'content', event.target.value)}
                    rows={8}
                    className="mt-1 w-full text-sm rounded-md border border-gray-200 bg-white px-3 py-2 text-gray-800"
                  />
                </label>
                {diag.status === 'review' && (
                  <>
                    <p className="text-xs text-gray-500">发布前，线上仍是原来的产品详情。</p>
                    <button
                      type="button"
                      onClick={() => onPublishReviewed(diag.id)}
                      className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 cursor-pointer"
                    >
                      发布
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function CrawlTrendChart({ botFilter }) {
  const values = useMemo(
    () =>
      crawlTrend30d.map((day) =>
        botFilter === 'all' ? Object.values(day.counts).reduce((sum, count) => sum + count, 0) : day.counts[botFilter] || 0,
      ),
    [botFilter],
  )
  const maxVal = Math.max(...values, 1)
  const total = values.reduce((sum, count) => sum + count, 0)
  const avg = (total / values.length).toFixed(1)
  const width = 920
  const height = 180
  const padL = 36
  const padR = 16
  const padT = 16
  const padB = 28
  const innerW = width - padL - padR
  const innerH = height - padT - padB
  const stepX = innerW / (values.length - 1)
  const x = (index) => padL + index * stepX
  const y = (value) => padT + innerH - (value / maxVal) * innerH
  const linePath = values.map((value, index) => `${index === 0 ? 'M' : 'L'} ${x(index).toFixed(1)} ${y(value).toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L ${x(values.length - 1).toFixed(1)} ${padT + innerH} L ${padL} ${padT + innerH} Z`
  const lineColor = botFilter === 'all' ? '#06b6d4' : BOT_COLORS[botFilter] || '#06b6d4'
  const yTicks = [0, Math.round(maxVal / 2), maxVal]
  const xLabels = crawlTrend30d.map((day, index) => (index % 5 === 0 ? { index, label: day.date } : null)).filter(Boolean)

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-600" />
          <span className="text-sm font-semibold text-gray-700">
            近 30 天访问趋势
            {botFilter !== 'all' && <span className="text-cyan-600"> · {botFilter}</span>}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>
            合计 <span className="font-bold text-gray-700">{total}</span> 次
          </span>
          <span>
            日均 <span className="font-bold text-gray-700">{avg}</span> 次
          </span>
          <span>
            峰值 <span className="font-bold text-gray-700">{maxVal}</span> 次
          </span>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[180px]" preserveAspectRatio="none" role="img" aria-label="近30天AI爬虫访问趋势">
        <defs>
          <linearGradient id="crawlArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {yTicks.map((tick) => (
          <g key={tick}>
            <line x1={padL} y1={y(tick)} x2={width - padR} y2={y(tick)} stroke="#f1f5f9" strokeWidth="1" />
            <text x={padL - 6} y={y(tick) + 3} textAnchor="end" fontSize="10" fill="#94a3b8">
              {tick}
            </text>
          </g>
        ))}
        <path d={areaPath} fill="url(#crawlArea)" />
        <path d={linePath} fill="none" stroke={lineColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {values.map((value, index) => (
          <circle key={crawlTrend30d[index].date} cx={x(index)} cy={y(value)} r={index === values.length - 1 ? 3.5 : 2.2} fill={lineColor} />
        ))}
        {xLabels.map(({ index, label }) => (
          <text key={label} x={x(index)} y={height - 8} textAnchor="middle" fontSize="10" fill="#94a3b8">
            {label}
          </text>
        ))}
      </svg>
    </div>
  )
}

function ReadyGate({ phase, checkDone, onStart }) {
  const checkTotal = checks.length
  const productTotal = initialProducts.length
  const checksComplete = checkDone >= checkTotal
  const currentCheck = checks[Math.min(checkDone, checkTotal - 1)]

  return (
    <div className="ready-stage-wrap">
      <section className="ready-stage" aria-live="polite">
        <p className="ready-stage__kicker">AI READY</p>
        {phase === 'idle' ? (
          <button type="button" className="ready-launch" onClick={onStart}>
            <span className="ready-launch__sweep" aria-hidden="true" />
            <span className="ready-launch__text">
              <small>点此开始</small>
              一键诊断是否已经 AI Ready
            </span>
          </button>
        ) : (
          <div className="ready-launch ready-launch--live" role="status">
            <span className="ready-launch__sweep" aria-hidden="true" />
            <span className="ready-launch__text">
              <small>两项同时进行</small>
              正在检测
            </span>
          </div>
        )}
        <p className="ready-stage__hint">
          {phase === 'idle'
            ? '一次检查 AI 友好性关键项，并诊断本站全部产品详情页。'
            : '两项一起进行。关键项检查较快，完成后就打开这一页；产品页诊断会继续。'}
        </p>
        {phase === 'scanning' && (
          <div className="ready-tracks">
            <div className="ready-track">
              <div className="ready-track__head">
                <b>AI 友好性关键项检查</b>
                <span>{checksComplete ? '已完成' : `${checkDone}/${checkTotal}`}</span>
              </div>
              <div className="ready-track__bar">
                <i style={{ width: `${(checkDone / checkTotal) * 100}%` }} />
              </div>
              <p className="ready-track__note">{checksComplete ? '关键项已检查完，正在打开页面' : `正在检查：${currentCheck?.name || ''}`}</p>
            </div>
            <div className="ready-track">
              <div className="ready-track__head">
                <b>产品页内容诊断</b>
                <span>已诊断 0/{productTotal}</span>
              </div>
              <div className="ready-track__bar">
                <i className="is-slide" />
              </div>
              <p className="ready-track__note">正在读取产品详情页，关键项完成后会在页面上继续显示进度</p>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default function AIReady() {
  const [phase, setPhase] = useState('idle')
  const [checkDone, setCheckDone] = useState(0)
  const [productDone, setProductDone] = useState(0)
  const [diagnosed, setDiagnosed] = useState('idle')
  const [products, setProducts] = useState([])
  const [openIds, setOpenIds] = useState({})
  const [botFilter, setBotFilter] = useState('all')
  const scanTimers = useRef([])

  useEffect(() => () => {
    scanTimers.current.forEach((id) => window.clearTimeout(id))
  }, [])

  const passCount = checks.filter((item) => item.status === 'pass').length
  const warnCount = checks.filter((item) => item.status === 'warn').length
  const pendingCount = products.filter((item) => item.score < 100).length

  const botCounts = useMemo(() => {
    const counts = {}
    crawlerLogs.forEach((row) => {
      counts[row.bot] = (counts[row.bot] || 0) + 1
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [])

  const visibleLogs = botFilter === 'all' ? crawlerLogs : crawlerLogs.filter((row) => row.bot === botFilter)
  const expandableIds = products.filter((item) => item.issues.length > 0).map((item) => item.id)
  const allOpen = expandableIds.length > 0 && expandableIds.every((id) => openIds[id])

  function later(fn, ms) {
    const id = window.setTimeout(fn, ms)
    scanTimers.current.push(id)
  }

  function revealProducts() {
    const next = initialProducts.map((item) => withMaterials({ ...item, issues: item.issues.map((issue) => ({ ...issue })), status: 'ready', draft: null, reviewOpen: false, notice: '' }))
    const opened = {}
    next.forEach((item) => {
      if (item.issues.length) opened[item.id] = true
    })
    setProducts(next)
    setOpenIds(opened)
    setDiagnosed('done')
  }

  function startScan() {
    scanTimers.current.forEach((id) => window.clearTimeout(id))
    scanTimers.current = []
    setPhase('scanning')
    setCheckDone(0)
    setProductDone(0)
    setProducts([])
    setOpenIds({})
    setDiagnosed('running')
    checks.forEach((_, index) => {
      later(() => setCheckDone(index + 1), 150 * (index + 1))
    })
    later(() => {
      setPhase('open')
      initialProducts.forEach((_, index) => {
        later(() => {
          setProductDone(index + 1)
          if (index + 1 === initialProducts.length) later(revealProducts, 480)
        }, 1100 * (index + 1))
      })
    }, 150 * checks.length + 520)
  }

  function patchProduct(id, updater) {
    setProducts((list) => list.map((item) => (item.id === id ? updater(item) : item)))
  }

  function settle(product, mode) {
    const source = product.sourceIssues || product.issues.map((issue) => ({ ...issue }))
    const hasMaterial = Boolean((product.materials?.text || '').trim() || product.materials?.files?.length)
    const issues = source.filter((issue) => issue.sensitive && !hasMaterial)
    const draft = mode === 'keep-draft' ? product.draft : buildProductDraft({ ...product, issues: source })
    if (mode === 'review') {
      return {
        ...product,
        sourceIssues: source,
        draft,
        status: 'review',
        reviewOpen: true,
        notice: '已生成，尚未发布。线上仍是原来的产品详情。',
      }
    }
    return {
      ...product,
      sourceIssues: source,
      issues,
      score: scoreOf(issues),
      draft,
      status: 'live',
      reviewOpen: true,
      notice: '已发布到线上。',
    }
  }

  function optimize(id, mode) {
    patchProduct(id, (item) => ({ ...item, status: 'generating' }))
    window.setTimeout(() => {
      patchProduct(id, (item) => settle(item, mode))
    }, 1200)
  }

  function publishReviewed(id) {
    patchProduct(id, (item) => settle(item, 'keep-draft'))
  }

  function toggleAll() {
    const next = !allOpen
    const map = {}
    expandableIds.forEach((id) => {
      map[id] = next
    })
    setOpenIds(map)
  }

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const productTotal = initialProducts.length
  const diagnosingProduct = initialProducts[Math.min(productDone, productTotal - 1)]

  if (phase !== 'open') {
    return <ReadyGate phase={phase} checkDone={checkDone} onStart={startScan} />
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">AI READY</span>
          <span className="text-xs text-gray-400">数字门户 · AI 友好性保障</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">AI Ready · AI 友好性保障中心</h1>
        <p className="text-sm text-gray-500 max-w-3xl">
          让你的产品在 ChatGPT、豆包、文心一言等 AI 引擎里被看见、被看懂、被推荐。客户问起相关产品时，AI 会主动介绍你的品牌和产品——我们把网站调整到 AI 最容易理解的状态，帮你抓住这波 AI 流量红利。
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <CircleCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <div className="text-base font-bold text-gray-900 leading-tight">AI 友好已就绪</div>
            <div className="text-xs text-gray-500 mt-0.5">{warnCount > 0 ? `${warnCount} 项需关注` : '全部关键项通过'}</div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <CircleCheck className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {passCount}
              <span className="text-sm text-gray-400 font-normal">/{checks.length}</span>
            </div>
            <div className="text-xs text-gray-500">检查项已就绪</div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Search className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {diagnosed === 'done' ? pendingCount : `${productDone}/${productTotal}`}
            </div>
            <div className="text-xs text-gray-500">{diagnosed === 'done' ? '产品页待优化' : '产品页已诊断'}</div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-cyan-50 flex items-center justify-center flex-shrink-0">
            <Bot className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{crawlerLogs.length}</div>
            <div className="text-xs text-gray-500">今日 AI 爬虫访问</div>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-20 -mx-1 mb-6">
        <div className="bg-white/95 backdrop-blur border border-gray-200 rounded-xl px-2 py-1.5 flex items-center gap-1 shadow-sm">
          <button type="button" onClick={() => scrollTo('section-checks')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors">
            <Shield className="w-4 h-4 text-blue-600" /> 关键项检查
          </button>
          <div className="w-px h-4 bg-gray-200" />
          <button type="button" onClick={() => scrollTo('section-products')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors">
            <Search className="w-4 h-4 text-purple-600" /> 产品页诊断
          </button>
          <div className="w-px h-4 bg-gray-200" />
          <button type="button" onClick={() => scrollTo('section-crawlers')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors">
            <Bot className="w-4 h-4 text-cyan-600" /> 爬虫访问日志
          </button>
        </div>
      </div>

      <section id="section-checks" className="mb-8 scroll-mt-16">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-blue-600 rounded-full" />
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            AI 友好性关键项检查
          </h2>
          <span className="text-xs text-gray-400 ml-auto">网站交付时确保关键项全部就绪</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {checks.map((check) => (
            <CheckCard key={check.id} check={check} />
          ))}
        </div>
      </section>

      <section id="section-products" className="mb-8 scroll-mt-16">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-purple-600 rounded-full" />
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Search className="w-5 h-5 text-purple-600" />
              产品页内容诊断
            </h2>
          </div>
          {diagnosed === 'done' && (
            <button type="button" onClick={toggleAll} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
              {allOpen ? '全部收起' : '全部展开'}
              {allOpen ? <ChevronDown className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-4">诊断看整张产品详情页。优化只改摘要和富文本，标题和其他页面区块不动。</p>
        {diagnosed !== 'done' && (
          <div className="border border-sky-200 rounded-xl bg-white p-5" aria-live="polite">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                  产品页内容诊断进行中
                </div>
                <p className="text-xs text-slate-500 mt-1">关键项检查已完成。正在逐页读取产品详情。</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold tabular-nums text-slate-900">
                  {productDone}
                  <span className="text-lg text-slate-400 font-medium">/{productTotal}</span>
                </div>
                <div className="text-xs text-slate-500">已诊断 / 总量</div>
              </div>
            </div>
            <div className="mt-4 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(productDone / productTotal) * 100}%`, background: '#3B9FD0' }} />
            </div>
            <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {initialProducts.map((item, index) => {
                const state = index < productDone ? '已诊断' : index === productDone ? '诊断中' : '等待'
                const tone = index < productDone ? 'text-emerald-700 bg-emerald-50' : index === productDone ? 'text-sky-700 bg-sky-50' : 'text-slate-400 bg-slate-50'
                return (
                  <li key={item.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-slate-100">
                    <span className="text-sm text-slate-700 truncate">{item.name}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tone}`}>{state}</span>
                  </li>
                )
              })}
            </ul>
            {productDone < productTotal && diagnosingProduct && (
              <p className="mt-3 text-sm text-slate-600">正在诊断：{diagnosingProduct.name}</p>
            )}
          </div>
        )}
        {diagnosed === 'done' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                diag={product}
                open={Boolean(openIds[product.id])}
                onToggle={() => setOpenIds((current) => ({ ...current, [product.id]: !current[product.id] }))}
                onMaterials={(id, text) => patchProduct(id, (item) => ({ ...item, materials: { ...item.materials, text } }))}
                onAddFiles={(id, names) =>
                  patchProduct(id, (item) => ({
                    ...item,
                    materials: { ...item.materials, files: Array.from(new Set([...(item.materials?.files || []), ...names])) },
                  }))
                }
                onRemoveFile={(id, name) =>
                  patchProduct(id, (item) => ({
                    ...item,
                    materials: { ...item.materials, files: (item.materials?.files || []).filter((file) => file !== name) },
                  }))
                }
                onOptimize={optimize}
                onDraftChange={(id, field, value) =>
                  patchProduct(id, (item) => ({ ...item, draft: { ...item.draft, [field]: value } }))
                }
                onPublishReviewed={publishReviewed}
                onToggleReview={(id) => patchProduct(id, (item) => ({ ...item, reviewOpen: !item.reviewOpen }))}
              />
            ))}
          </div>
        )}
      </section>

      <section id="section-crawlers" className="mb-8 scroll-mt-16">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-cyan-600 rounded-full" />
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Bot className="w-5 h-5 text-cyan-600" />
            AI 爬虫访问日志
          </h2>
          <span className="text-xs text-gray-400 ml-auto">实时记录各 AI 引擎爬虫的访问行为</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-4">
          {botCounts.map(([bot, count]) => (
            <div
              key={bot}
              onClick={() => setBotFilter((current) => (current === bot ? 'all' : bot))}
              className={`p-3 rounded-lg border cursor-pointer transition-all text-center ${
                botFilter === bot ? 'bg-cyan-50 border-cyan-300 ring-2 ring-cyan-100' : 'bg-white border-gray-200 hover:border-cyan-200'
              }`}
            >
              <div className="text-lg font-bold text-gray-800">{count}</div>
              <div className="text-[11px] text-gray-500 mt-0.5 truncate">{bot}</div>
            </div>
          ))}
        </div>
        <CrawlTrendChart botFilter={botFilter} />
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-700">
                访问日志 {botFilter !== 'all' && <span className="text-cyan-600">· {botFilter}</span>}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> 最近 24 小时
              </span>
              <button type="button" className="flex items-center gap-1 text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
                <RefreshCw className="w-3 h-3" /> 刷新
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500">时间</th>
                  <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500">AI 爬虫</th>
                  <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500">访问页面</th>
                  <th className="text-center py-2.5 px-4 text-xs font-semibold text-gray-500">状态</th>
                  <th className="text-center py-2.5 px-4 text-xs font-semibold text-gray-500">耗时</th>
                  <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500">User-Agent</th>
                </tr>
              </thead>
              <tbody>
                {visibleLogs.map((row) => (
                  <tr key={`${row.time}-${row.bot}-${row.page}`} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-2.5 px-4 text-xs text-gray-500 font-mono">{row.time}</td>
                    <td className="py-2.5 px-4">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-cyan-50 text-cyan-700">{row.bot}</span>
                    </td>
                    <td className="py-2.5 px-4 text-xs text-gray-600 font-mono">{row.page}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">{row.status}</span>
                    </td>
                    <td className="py-2.5 px-4 text-center text-xs text-gray-500">{row.duration}</td>
                    <td className="py-2.5 px-4 text-xs text-gray-400 font-mono">{row.ua}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {visibleLogs.length === 0 && (
            <div className="py-8 text-center text-sm text-gray-400">
              <Bug className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              暂无 {botFilter} 的访问记录
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
