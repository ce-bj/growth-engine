import { useEffect, useMemo, useRef, useState } from 'react'
import { readyData } from './readyData.js'
import ProductDetailGap from './ProductDetailGap.jsx'
import './ready.css'

const S = {
  icon: 'b856b8ea',
  summary: '29bdbfb0',
  title: '4713926b',
  check: 'e1e739d0',
  llms: 'd5da6e54',
  schema: 'e6578b55',
  robots: '1b4b3e4e',
  og: '742dd540',
  opt: 'b46e1206',
  card: 'f015f100',
  log: 'b088ec6d',
  report: 'c97cc663',
  ready: 'fd7d41c4',
}

const ICONS = {
  activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  'book-open': '<path d="M12 6.5C10.5 5.2 8 4.5 4 4.5v13c4 0 6.5.7 8 2 1.5-1.3 4-2 8-2v-13c-4 0-6.5.7-8 2zM12 6.5v13"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  'check-circle': '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
  'chevron-down': '<path d="M6 9l6 6 6-6"/>',
  'chevron-right': '<path d="M9 6l6 6-6 6"/>',
  circle: '<circle cx="12" cy="12" r="9"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  code: '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 6l-3 12"/>',
  edit: '<path d="M4 20h4L19 9a2.1 2.1 0 00-3-3L5 17v3zM14.5 7.5l3 3"/>',
  'external-link': '<path d="M13 5h6v6M19 5l-8 8M17 14v4.5a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 015 18.5v-9A1.5 1.5 0 016.5 8H11"/>',
  'file-check': '<path d="M14 3H7.5A1.5 1.5 0 006 4.5v15A1.5 1.5 0 007.5 21h9a1.5 1.5 0 001.5-1.5V7l-4-4z"/><path d="M14 3v4h4M9.5 14l2 2 3.5-3.5"/>',
  'file-text': '<path d="M14 3H7.5A1.5 1.5 0 006 4.5v15A1.5 1.5 0 007.5 21h9a1.5 1.5 0 001.5-1.5V7l-4-4z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9S14.5 18.4 12 21c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5h.01"/>',
  refresh: '<path d="M20 11a8 8 0 00-14.5-4.5L4 8M4 4v4h4M4 13a8 8 0 0014.5 4.5L20 16M20 20v-4h-4"/>',
  robot: '<rect x="5" y="8" width="14" height="11" rx="2.5"/><path d="M12 8V5"/><circle cx="12" cy="4" r="1"/><path d="M3 13v2M21 13v2M9 14.5h.01M15 14.5h.01M10 17h4"/>',
  scan: '<path d="M4 8V6a2 2 0 012-2h2M16 4h2a2 2 0 012 2v2M20 16v2a2 2 0 01-2 2h-2M8 20H6a2 2 0 01-2-2v-2M4 12h16"/>',
  shield: '<path d="M12 3l7 3v5.5c0 4.3-2.9 7.7-7 9.5-4.1-1.8-7-5.2-7-9.5V6l7-3z"/>',
  'shield-check': '<path d="M12 3l7 3v5.5c0 4.3-2.9 7.7-7 9.5-4.1-1.8-7-5.2-7-9.5V6l7-3z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  sparkle: '<path d="M10 3.5l1.8 4.7 4.7 1.8-4.7 1.8L10 16.5l-1.8-4.7L3.5 10l4.7-1.8L10 3.5zM18 14.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z"/>',
  tag: '<path d="M4 4h7.5l8.5 8.5-7.5 7.5L4 11.5V4z"/><circle cx="8.5" cy="8.5" r="1.2"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
  upload: '<path d="M12 16V5M7.5 9.5L12 5l4.5 4.5M4.5 15v3.5a1.5 1.5 0 001.5 1.5h12a1.5 1.5 0 001.5-1.5V15"/>',
  warning: '<path d="M12 4l9 15.5H3L12 4z"/><path d="M12 10v4M12 17h.01"/>',
  'x-circle': '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
}

const STATUS_TEXT = { pending: '检测中', ready: '已就绪', warn: '需关注' }
const ROBOTS = [
  { name: 'GPTBot', ua: 'GPTBot' },
  { name: 'ClaudeBot', ua: 'ClaudeBot' },
  { name: 'PerplexityBot', ua: 'PerplexityBot' },
  { name: 'Bytespider', ua: 'Bytespider' },
  { name: 'Googlebot', ua: 'Googlebot' },
  { name: 'Bingbot', ua: 'Bingbot' },
  { name: 'AppleBot', ua: 'Applebot' },
  { name: 'Meta-ExternalAgent', ua: 'meta-externalagent' },
]
const FILE_ACCEPT = '.pdf,.xls,.xlsx,.doc,.docx,.jpg,.jpeg,.png'
const STEP_MS = 700
const STEP_TAIL = 400

function marks(...scopes) {
  const attrs = {}
  scopes.forEach((scope) => {
    attrs[`data-v-${scope}`] = ''
  })
  return attrs
}

function AiIcon({ name, size = 16, className, scopes = [] }) {
  const cls = className ? `ai-icon ${className}` : 'ai-icon'
  return (
    <svg
      {...marks(S.icon, ...scopes)}
      className={cls}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: ICONS[name] || '' }}
    />
  )
}

function statusClass(code) {
  const value = Number(code)
  if (value >= 400) return 'error'
  if (value >= 300) return 'warn'
  return 'ok'
}

function botLabel(name) {
  const tab = readyData.crawlerTabs.find((item) => item.code && item.code.toLowerCase() === String(name || '').toLowerCase())
  return tab ? tab.label : name
}

function robotsText(sitemap) {
  const lines = ROBOTS.map((bot) => `User-agent: ${bot.ua}\nAllow: /`)
  lines.push('User-agent: *\nAllow: /')
  if (sitemap) lines.push(sitemap)
  return lines.join('\n\n')
}

function niceMax(max) {
  if (max <= 0) return 1
  const pow = 10 ** Math.floor(Math.log10(max))
  const n = max / pow
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10
  return nice * pow
}

function smoothPath(points) {
  if (!points.length) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] || p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`
  }
  return d
}

function TrendChart({ trend }) {
  const width = 920
  const height = 260
  const pad = { l: 40, r: 16, t: 24, b: 28 }
  const max = niceMax(Math.max(...trend.map((item) => item.count), 0))
  const innerW = width - pad.l - pad.r
  const innerH = height - pad.t - pad.b
  const step = trend.length > 1 ? innerW / (trend.length - 1) : innerW
  const points = trend.map((item, index) => ({
    x: pad.l + index * step,
    y: pad.t + innerH - (item.count / max) * innerH,
  }))
  const line = smoothPath(points)
  const area = points.length
    ? `${line} L ${points[points.length - 1].x} ${pad.t + innerH} L ${points[0].x} ${pad.t + innerH} Z`
    : ''
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => Math.round(max * ratio))
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="260" role="img" aria-label="近 30 天访问趋势">
      <defs>
        <linearGradient id="readyTrendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(47, 107, 255, 0.25)" />
          <stop offset="100%" stopColor="rgba(47, 107, 255, 0)" />
        </linearGradient>
      </defs>
      {ticks.map((tick) => {
        const y = pad.t + innerH - (tick / max) * innerH
        return (
          <g key={tick}>
            <line x1={pad.l} y1={y} x2={width - pad.r} y2={y} stroke="#eef0f4" />
            <text x={pad.l - 8} y={y + 4} textAnchor="end" fontSize="12" fill="#8a92a3">
              {tick}
            </text>
          </g>
        )
      })}
      <path d={area} fill="url(#readyTrendFill)" />
      <path d={line} fill="none" stroke="#2f6bff" strokeWidth="3" />
      {points.map((point, index) => (
        <circle key={trend[index].date} cx={point.x} cy={point.y} r="3.5" fill="#2f6bff" />
      ))}
      {trend.map((item, index) =>
        index % 4 === 0 ? (
          <text key={item.date} x={points[index].x} y={height - 6} textAnchor="middle" fontSize="12" fill="#8a92a3">
            {item.date}
          </text>
        ) : null,
      )}
    </svg>
  )
}

function Dialog({ dialog, onClose }) {
  useEffect(() => {
    if (!dialog) return undefined
    function onKey(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dialog, onClose])
  if (!dialog) return null
  return (
    <div className="ready-dialog-mask" onClick={onClose}>
      <div className="ready-dialog" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <header>
          <span>{dialog.title}</span>
          <button type="button" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </header>
        <div className="body">
          <pre {...marks(dialog.scope)} className="code">
            {dialog.text}
          </pre>
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ title, icon, tip, tipIcon, color, sectionRef, className = '' }) {
  return (
    <div
      {...marks(S.report, S.title)}
      ref={sectionRef}
      className={`section-title report-section ${className}`.trim()}
      style={color ? { '--color': color } : undefined}
    >
      <span {...marks(S.title)} className="bar" />
      {icon ? <AiIcon scopes={[S.title]} className="icon" name={icon} size={20} /> : null}
      <h2 {...marks(S.title)} className="text">
        {title}
      </h2>
      {tip ? (
        <span {...marks(S.title)} className="tip">
          {tipIcon ? <AiIcon scopes={[S.title]} name={tipIcon} size={14} /> : null} {tip}
        </span>
      ) : null}
    </div>
  )
}

function Summary({ checks, brandPending, readablePending, trustPending, onJump }) {
  const total = checks.length
  const readyCount = checks.filter((item) => item.status === 'ready').length
  const attentionCount = checks.filter((item) => item.status === 'warn').length
  const contentPending = brandPending + readablePending + trustPending
  const techTone = total && readyCount / total >= 1 ? 'good' : 'fair'
  const contentTone = contentPending ? 'fair' : 'good'
  const techDesc =
    techTone === 'good'
      ? `技术层：${total} 项关键项已由网站出厂完成配置，网站可被主流 AI 引擎正常抓取与收录。`
      : `技术层：还有 ${attentionCount} 项关键项需要关注，处理后网站才能被主流 AI 引擎正常抓取与收录。`
  const techMeta = attentionCount ? `${total} 项关键项 · ${attentionCount} 项需关注` : `${total} 项关键项 · 全部已就绪`
  const contentDesc = contentPending
    ? `内容层：AI 持续检测全站内容，把 AI 读不准、用不上的部分找出来，当前有 ${contentPending} 项待你确认或补充。`
    : '内容层：全站内容已优化完成，AI 可以准确读懂并引用你的产品和品牌。'
  return (
    <div {...marks(S.report, S.summary)} className="summary">
      <div {...marks(S.summary)} className="summary-head">
        <div {...marks(S.summary)}>
          <h1 {...marks(S.summary)} className="summary-title">
            AI Ready · 对 AI 友好
          </h1>
          <p {...marks(S.summary)} className="summary-sub">
            让 AI 引擎看得见你的网站，也读得懂你的核心内容。
          </p>
        </div>
      </div>
      <div {...marks(S.summary)} className="overview">
        <OverviewCard
          tone={techTone}
          icon="shield"
          title="被 AI 看见"
          desc={techDesc}
          meta={techMeta}
          pill={techTone === 'good' ? 'Good' : '待关注'}
          onClick={() => onJump('check')}
        />
        <OverviewCard
          tone={contentTone}
          icon="book-open"
          title="被 AI 理解"
          desc={contentDesc}
          meta={`品牌一致性 / AI 可读性 / AI 可信性 · ${contentPending ? `${contentPending} 项待确认` : '全部已处理'}`}
          pill={contentTone === 'good' ? 'Good' : '待关注'}
          onClick={() => onJump('brand')}
        />
      </div>
    </div>
  )
}

function OverviewCard({ tone, icon, title, desc, meta, pill, onClick }) {
  return (
    <div {...marks(S.summary)} className={`ov-card is-link is-${tone}`} role="button" onClick={onClick}>
      <div {...marks(S.summary)} className="ov-main">
        <span {...marks(S.summary)} className="ov-icon">
          <AiIcon scopes={[S.summary]} name={icon} size={20} />
        </span>
        <div {...marks(S.summary)} className="ov-body">
          <h3 {...marks(S.summary)} className="ov-title">
            {title}
          </h3>
          <p {...marks(S.summary)} className="ov-desc">
            {desc}
          </p>
          <p {...marks(S.summary)} className="ov-meta">
            <AiIcon scopes={[S.summary]} className={tone === 'good' ? 'is-good' : 'is-warn'} name={tone === 'good' ? 'check' : 'clock'} size={12} /> {meta}
          </p>
        </div>
      </div>
      <div {...marks(S.summary)} className={`ov-badge is-${tone}`}>
        <span {...marks(S.summary)} className="ov-badge-icon">
          <AiIcon scopes={[S.summary]} name={tone === 'good' ? 'check' : 'clock'} size={tone === 'good' ? 24 : 20} />
        </span>
        <span {...marks(S.summary)} className="ov-badge-text">
          {pill}
        </span>
      </div>
    </div>
  )
}

function LlmsDetail({ onOpen }) {
  return (
    <div {...marks(S.check, S.llms)} className="detail-llms">
      <div {...marks(S.llms)} className="head">
        <button type="button" className="ready-mini-btn" onClick={onOpen}>
          查看
        </button>
      </div>
    </div>
  )
}

function SchemaDetail({ rows, regenerating, onOpen, onRegenerate }) {
  return (
    <div {...marks(S.check, S.schema)} className="detail-schema">
      <p {...marks(S.schema)} className="title">
        核心页面 Schema 配置一览
      </p>
      {rows.map((row) => (
        <div {...marks(S.schema)} key={row.code} className={`row${row.configured ? '' : ' off'}`}>
          <AiIcon scopes={[S.schema]} className="ok" name={row.configured ? 'check-circle' : 'warning'} size={16} />
          <span {...marks(S.schema)} className="label">
            {row.label}
          </span>
          <span {...marks(S.schema)} className={`type${row.configured ? '' : ' off'}`}>
            {row.configured ? row.type : '未配置'}
          </span>
          <button {...marks(S.schema)} type="button" className="action" disabled={!row.configured} onClick={() => onOpen(row)}>
            <AiIcon scopes={[S.schema]} name="code" size={14} /> 查看代码
          </button>
          {row.code === 'home' ? (
            <button {...marks(S.schema)} type="button" className="action" disabled={!!regenerating} onClick={() => onRegenerate(row)}>
              {regenerating === row.code ? <i className="spin" /> : <AiIcon scopes={[S.schema]} name="refresh" size={14} />}{' '}
              {regenerating === row.code ? '生成中…' : 'AI 重新生成'}
            </button>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function RobotsDetail({ enabled, onOpen }) {
  return (
    <div {...marks(S.check, S.robots)} className="detail-robots">
      <div {...marks(S.robots)} className="head">
        <p {...marks(S.robots)} className="title">
          AI 爬虫准入状态
        </p>
        {enabled ? (
          <button type="button" className="ready-mini-btn" onClick={onOpen}>
            查看
          </button>
        ) : null}
      </div>
      <div {...marks(S.robots)} className="bots">
        {ROBOTS.map((bot) => (
          <div {...marks(S.robots)} key={bot.name} className={`bot${enabled ? '' : ' off'}`}>
            <AiIcon scopes={[S.robots]} className="icon" name={enabled ? 'check-circle' : 'warning'} size={14} />
            <span {...marks(S.robots)} className="name">
              {bot.name}
            </span>
            <span {...marks(S.robots)} className="state">
              {enabled ? 'Allow' : '未放行'}
            </span>
          </div>
        ))}
      </div>
      {enabled ? null : (
        <div {...marks(S.robots)} className="empty">
          robots 功能已关闭，AI 爬虫准入规则未生效
        </div>
      )}
    </div>
  )
}

function OgDetail({ checks }) {
  return (
    <div {...marks(S.check, S.og)} className="detail-og">
      <p {...marks(S.og)} className="title">
        Open Graph 标签检查
      </p>
      {checks.map((item) => (
        <div {...marks(S.og)} key={item.code} className={`row ${item.ok ? 'ok' : 'warn'}`}>
          <AiIcon scopes={[S.og]} className="icon" name={item.ok ? 'check-circle' : 'warning'} size={16} />
          <span {...marks(S.og)} className="label">
            {item.label}
          </span>
          <span {...marks(S.og)} className="text">
            {item.text}
          </span>
          {item.action ? (
            <button {...marks(S.og)} type="button" className="action">
              {item.action}
            </button>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function CheckList({ items, openMap, onToggle, onDialog, regenerating, onRegenerate }) {
  return (
    <div {...marks(S.report, S.check)} className="check-list">
      {items.map((item) => {
        const open = Boolean(openMap[item.code])
        return (
          <div {...marks(S.check)} key={item.code} className={`check-card${open ? ' open' : ''}`}>
            <div {...marks(S.check)} className="card-top">
              <span {...marks(S.check)} className={`icon ${item.status}`}>
                <AiIcon scopes={[S.check]} name={item.icon} size={20} />
              </span>
              <div {...marks(S.check)} className="main">
                <div {...marks(S.check)} className="head">
                  <h3 {...marks(S.check)} className="title">
                    {item.title}
                  </h3>
                  <span {...marks(S.check)} className={`status ${item.status}`}>
                    <AiIcon scopes={[S.check]} name={item.status === 'ready' ? 'check-circle' : 'warning'} size={12} /> {STATUS_TEXT[item.status]}
                  </span>
                </div>
                <p {...marks(S.check)} className="note">
                  {item.note}
                </p>
              </div>
              <button {...marks(S.check)} type="button" className={`toggle${open ? ' open' : ''}`} onClick={() => onToggle(item.code)}>
                详情 <AiIcon scopes={[S.check]} className="arrow" name="chevron-down" size={14} />
              </button>
            </div>
            {open ? (
              <div {...marks(S.check)} className="detail">
                <div {...marks(S.check)} className="detail-inner">
                  <div {...marks(S.check)} className="intro">
                    <div {...marks(S.check)} className="intro-box">
                      <p {...marks(S.check)} className="intro-label">
                        这是什么
                      </p>
                      <p {...marks(S.check)} className="intro-text">
                        {item.desc}
                      </p>
                    </div>
                    <div {...marks(S.check)} className="intro-box is-why">
                      <p {...marks(S.check)} className="intro-label">
                        为什么重要
                      </p>
                      <p {...marks(S.check)} className="intro-text">
                        {item.why}
                      </p>
                    </div>
                  </div>
                  {item.hasDetail && item.detail ? (
                    <div {...marks(S.check)} className="detail-body">
                      {item.detail.type === 'llms' ? (
                        <LlmsDetail onOpen={() => onDialog({ title: 'llms.txt 内容', text: readyData.llmsText, scope: S.llms })} />
                      ) : null}
                      {item.detail.type === 'schema' ? (
                        <SchemaDetail
                          rows={item.detail.props.rows}
                          regenerating={regenerating}
                          onOpen={(row) => onDialog({ title: `${row.label} Schema 代码`, text: row.json, scope: S.schema })}
                          onRegenerate={onRegenerate}
                        />
                      ) : null}
                      {item.detail.type === 'robots' ? (
                        <RobotsDetail
                          enabled={item.detail.props.enabled}
                          onOpen={() => onDialog({ title: 'robots.txt 内容', text: robotsText(item.detail.props.sitemap), scope: S.robots })}
                        />
                      ) : null}
                      {item.detail.type === 'og' ? <OgDetail checks={item.detail.props.checks} /> : null}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

function OptimizeCard({ item, state, onHandle, onToast }) {
  const [explainOpen, setExplainOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [content, setContent] = useState('')
  const [fileName, setFileName] = useState('')
  const [runStep, setRunStep] = useState(null)
  const [customCopy, setCustomCopy] = useState('')
  const [editingCopy, setEditingCopy] = useState(false)
  const [copyDraft, setCopyDraft] = useState('')
  const timers = useRef([])
  const done = state === 'done'
  const ignored = state === 'ignored'
  const running = runStep !== null
  const steps = item.action.form
    ? item.action.form.type === 'upload'
      ? ['解析上传的文件', 'AI 提取并生成内容', '校验并生效']
      : ['读取你补充的资料', 'AI 生成网站内容', '校验并生效']
    : ['扫描全站，定位待改内容', 'AI 改写并替换内容', '校验并生效']
  const percent = Math.round((Math.min(runStep || 0, steps.length) / steps.length) * 100)
  const doneNote = customCopy ? `已按你确认的文案生效：「${customCopy}」` : item.result || '已生效'

  function clearTimers() {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }

  useEffect(() => () => clearTimers(), [])

  useEffect(() => {
    if (!state) {
      clearTimers()
      setRunStep(null)
      setFormOpen(false)
      setContent('')
      setFileName('')
      setCustomCopy('')
      setEditingCopy(false)
      setExplainOpen(false)
    }
  }, [state])

  function startRun() {
    if (running) return
    clearTimers()
    setRunStep(0)
    setFormOpen(false)
    setEditingCopy(false)
    const next = []
    for (let index = 0; index < steps.length; index += 1) {
      next.push(window.setTimeout(() => setRunStep(index + 1), STEP_MS * (index + 1)))
    }
    next.push(
      window.setTimeout(() => {
        setRunStep(null)
        onHandle(item, 'agree')
      }, STEP_MS * steps.length + STEP_TAIL),
    )
    timers.current = next
  }

  function handleAction() {
    if (item.action.form) setFormOpen((value) => !value)
    else startRun()
  }

  function handleSubmit() {
    if (!content.trim() && !fileName) {
      onToast('warning', '请先填写资料或选择文件')
      return
    }
    startRun()
  }

  return (
    <div {...marks(S.card)} className={`opt-card${done ? ' is-done' : ''}${ignored ? ' is-ignored' : ''}`}>
      <span {...marks(S.card)} className="icon">
        <AiIcon scopes={[S.card]} name={done ? 'check-circle' : 'sparkle'} size={16} />
      </span>
      <div {...marks(S.card)} className="main">
        <div {...marks(S.card)} className="head">
          <h4 {...marks(S.card)} className="title">
            {item.title}
          </h4>
          {done ? (
            <span {...marks(S.card)} className="badge is-done">
              <AiIcon scopes={[S.card]} name="check-circle" size={12} />
              已生效
            </span>
          ) : ignored ? (
            <span {...marks(S.card)} className="badge is-ignored">
              <AiIcon scopes={[S.card]} name="x-circle" size={12} />
              已忽略
            </span>
          ) : item.auto ? (
            <span {...marks(S.card)} className="badge">
              AI 可自动优化
            </span>
          ) : null}
        </div>
        {done ? (
          <p {...marks(S.card)} className="result">
            <AiIcon scopes={[S.card]} name="check-circle" size={14} />
            {doneNote}
          </p>
        ) : (
          <>
            {item.tags.length ? (
              <div {...marks(S.card)} className="tags">
                {item.tags.map((tag) => (
                  <span {...marks(S.card)} key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
            {ignored ? null : (
              <div {...marks(S.card)} className="suggest">
                <p {...marks(S.card)}>
                  <b {...marks(S.card)}>优化建议：</b>
                  {item.suggest}
                </p>
                {item.proposal && !running ? (
                  <div {...marks(S.card)} className="proposal">
                    {editingCopy ? (
                      <>
                        <div {...marks(S.card)} className="proposal-label">
                          {item.proposalField}：
                        </div>
                        <textarea {...marks(S.card)} className="proposal-input" rows={2} value={copyDraft} placeholder={item.proposal} onChange={(event) => setCopyDraft(event.target.value)} />
                        <div {...marks(S.card)} className="proposal-actions">
                          <button
                            {...marks(S.card)}
                            type="button"
                            className="proposal-apply"
                            onClick={() => {
                              setCustomCopy(copyDraft.trim())
                              setEditingCopy(false)
                            }}
                          >
                            <AiIcon scopes={[S.card]} name="check" size={12} /> 就用这个
                          </button>
                          <button
                            {...marks(S.card)}
                            type="button"
                            className="proposal-reset"
                            onClick={() => {
                              setCustomCopy('')
                              setEditingCopy(false)
                            }}
                          >
                            恢复 AI 建议
                          </button>
                        </div>
                      </>
                    ) : (
                      <div {...marks(S.card)} className="proposal-row">
                        <span {...marks(S.card)} className="proposal-label">
                          {item.proposalField}：
                        </span>
                        <span {...marks(S.card)} className="proposal-chip">
                          {customCopy || item.proposal}
                        </span>
                        <button
                          {...marks(S.card)}
                          type="button"
                          className="proposal-edit"
                          onClick={() => {
                            setCopyDraft(customCopy || item.proposal)
                            setEditingCopy(true)
                          }}
                        >
                          <AiIcon scopes={[S.card]} name="edit" size={12} /> 改用其他文案
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </>
        )}
        {running ? (
          <div {...marks(S.card)} className="run">
            <div {...marks(S.card)} className="run-head">
              <i className="spin" />
              <span {...marks(S.card)} className="run-title">
                AI 正在执行…
              </span>
              <span {...marks(S.card)} className="run-pct">
                {percent}%
              </span>
            </div>
            <div {...marks(S.card)} className="run-bar">
              <span style={{ width: `${percent}%` }} />
            </div>
            <div {...marks(S.card)} className="run-steps">
              {steps.map((step, index) => (
                <div {...marks(S.card)} key={step} className={`run-step${index < runStep ? ' is-done' : ''}${index === runStep ? ' is-current' : ''}`}>
                  {index < runStep ? <AiIcon scopes={[S.card]} name="check-circle" size={14} /> : index === runStep ? <i className="spin" /> : <AiIcon scopes={[S.card]} name="circle" size={14} />}
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div {...marks(S.card)} className="foot">
            {ignored ? (
              <button {...marks(S.card)} type="button" className="restore" onClick={() => onHandle(item, 'restore')}>
                恢复处理
              </button>
            ) : done ? null : (
              <>
                <button {...marks(S.card)} type="button" className="btn primary" onClick={handleAction}>
                  <AiIcon scopes={[S.card]} name={item.action.icon} size={14} /> {formOpen ? '收起' : item.action.text}
                </button>
                {item.action.ignorable ? (
                  <button {...marks(S.card)} type="button" className="btn" onClick={() => onHandle(item, 'ignore')}>
                    忽略
                  </button>
                ) : null}
              </>
            )}
            <button {...marks(S.card)} type="button" className="explain" onClick={() => setExplainOpen((value) => !value)}>
              {explainOpen ? '收起说明' : '问题说明'} <AiIcon scopes={[S.card]} className={`arrow${explainOpen ? ' open' : ''}`} name="chevron-down" size={12} />
            </button>
          </div>
        )}
        {explainOpen && !running ? (
          <p {...marks(S.card)} className="explain-text">
            {item.explain}
          </p>
        ) : null}
        {formOpen && !running && !done && !ignored ? (
          <div {...marks(S.card)} className="form">
            <textarea
              {...marks(S.card)}
              className="form-input"
              rows={3}
              placeholder={item.action.form.placeholder}
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
            <div {...marks(S.card)} className="form-or">
              或上传文件
            </div>
            {fileName ? (
              <div {...marks(S.card)} className="file-chip">
                <AiIcon scopes={[S.card]} name="file-text" size={16} />
                <span>{fileName}</span>
                <button type="button" onClick={() => setFileName('')}>
                  移除
                </button>
              </div>
            ) : (
              <label {...marks(S.card)} className="file-pick">
                <AiIcon scopes={[S.card]} name="upload" size={16} />
                <span>点击选择文件（支持 PDF / Excel / Word / JPG / PNG）</span>
                <input
                  type="file"
                  accept={FILE_ACCEPT}
                  onChange={(event) => {
                    const file = event.target.files && event.target.files[0]
                    setFileName(file ? file.name : '')
                    event.target.value = ''
                  }}
                />
              </label>
            )}
            <div {...marks(S.card)} className="form-foot">
              <button {...marks(S.card)} type="button" className="btn primary" onClick={handleSubmit}>
                {item.action.form.submit}
              </button>
              <span {...marks(S.card)} className="form-tip">
                提交后 AI 会自动执行，无需其他操作
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function OptimizeSection({ section, handled, detecting, open, onToggle, onHandle, onDetect, onToast }) {
  const [introOpen, setIntroOpen] = useState(false)
  const pendingCount = section.items.filter((item) => !handled[item.id]).length
  const done = pendingCount === 0
  return (
    <div {...marks(S.report, S.opt)} id={`opt-${section.code}`} className={`opt-section report-section theme-${section.theme}${open ? ' is-open' : ''}`}>
      <div
        {...marks(S.opt)}
        className="opt-bar"
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onToggle()
          }
        }}
      >
        <span {...marks(S.opt)} className="bar" />
        <span {...marks(S.opt)} className="bar-icon">
          <AiIcon scopes={[S.opt]} name={section.icon} size={16} />
        </span>
        <div {...marks(S.opt)} className="bar-text">
          <span {...marks(S.opt)} className="bar-title">
            {section.title}
          </span>
          <p {...marks(S.opt)} className="bar-brief">
            {done ? '本板块问题已全部优化完成' : section.brief}
          </p>
        </div>
        <div {...marks(S.opt)} className="bar-right">
          {done ? (
            <span {...marks(S.opt)} className="good-pill">
              <i>
                <AiIcon scopes={[S.opt]} name="check" size={10} />
              </i>
              Good
            </span>
          ) : (
            <span {...marks(S.opt)} className="pending">
              {pendingCount} 项待确认
            </span>
          )}
          <AiIcon scopes={[S.opt]} className="chevron" name={open ? 'chevron-down' : 'chevron-right'} size={16} />
        </div>
      </div>
      {open ? (
        <div {...marks(S.opt)} className="opt-detail">
          <div {...marks(S.opt)} className="detail-tools">
            <button {...marks(S.opt)} type="button" className="what" onClick={() => setIntroOpen((value) => !value)}>
              <AiIcon scopes={[S.opt]} name="info" size={14} /> {introOpen ? '收起说明' : '这项做什么'}
            </button>
            <button {...marks(S.opt)} type="button" className="detect" disabled={detecting} onClick={() => onDetect(section)}>
              {detecting ? <i className="spin" /> : <AiIcon scopes={[S.opt]} name="scan" size={14} />} {detecting ? '检测中…' : '立即检测'}
            </button>
          </div>
          {introOpen ? (
            <div {...marks(S.opt)} className="intro">
              <AiIcon scopes={[S.opt]} className="intro-icon" name="info" size={16} />
              <div {...marks(S.opt)} className="intro-body">
                <p {...marks(S.opt)} className="intro-sub">
                  {section.subtitle}
                </p>
                <p {...marks(S.opt)}>
                  <b {...marks(S.opt)}>这是什么：</b>
                  {section.purpose}
                </p>
                <p {...marks(S.opt)}>
                  <b {...marks(S.opt)} className="is-theme">
                    对你的价值：
                  </b>
                  {section.value}
                </p>
              </div>
            </div>
          ) : null}
          <div {...marks(S.opt)} className="opt-list">
            {section.items.map((item) =>
              item.id === 'readable-product' ? (
                <ProductDetailGap key={item.id} detecting={detecting} onResolved={() => onHandle(item, 'agree')} />
              ) : (
                <OptimizeCard key={item.id} item={item} state={handled[item.id]} onHandle={onHandle} onToast={onToast} />
              ),
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function CrawlerLogs() {
  const [active, setActive] = useState('all')
  const [refreshing, setRefreshing] = useState(false)
  const series = readyData.crawlerSeries[active] || readyData.crawlerSeries.all
  const activeName = active === 'all' ? '全部爬虫' : botLabel(readyData.crawlerTabs.find((item) => item.key === active)?.code || active)
  return (
    <div {...marks(S.report, S.log)} className="crawler-logs">
      <p {...marks(S.log)} className="caption">
        近 30 天各爬虫访问次数
      </p>
      <div {...marks(S.log)} className="bots">
        {readyData.crawlerTabs.map((tab) => (
          <button {...marks(S.log)} key={tab.key} type="button" className={`bot${active === tab.key ? ' active' : ''}`} onClick={() => setActive(tab.key)}>
            <span {...marks(S.log)} className="name" title={tab.code}>
              {tab.label}
            </span>
            <span {...marks(S.log)} className="count">
              {tab.count}
            </span>
          </button>
        ))}
      </div>
      <div {...marks(S.log)} className="panel">
        <div {...marks(S.log)} className="panel-head">
          <p {...marks(S.log)} className="panel-title">
            <AiIcon scopes={[S.log]} className="icon" name="trend" size={18} />
            近 30 天访问趋势
            <small {...marks(S.log)}>{activeName}</small>
          </p>
          <div {...marks(S.log)} className="stats">
            <span {...marks(S.log)}>
              合计 <b {...marks(S.log)}>{series.total}</b> 次
            </span>
            <span {...marks(S.log)}>
              日均 <b {...marks(S.log)}>{series.avg}</b> 次
            </span>
            <span {...marks(S.log)}>
              峰值 <b {...marks(S.log)}>{series.max}</b> 次
            </span>
          </div>
        </div>
        <TrendChart trend={series.trend} />
      </div>
      <div {...marks(S.log)} className="panel">
        <div {...marks(S.log)} className="panel-head">
          <p {...marks(S.log)} className="panel-title">
            <AiIcon scopes={[S.log]} className="icon" name="activity" size={18} />
            访问日志
            <small {...marks(S.log)}>
              {activeName} · 共 {series.rows.length} 条
            </small>
          </p>
          <div {...marks(S.log)} className="tools">
            <span {...marks(S.log)} className="range">
              <AiIcon scopes={[S.log]} name="clock" size={14} />
              最近 24 小时
            </span>
            <button
              {...marks(S.log)}
              type="button"
              className="refresh"
              disabled={refreshing}
              onClick={() => {
                setRefreshing(true)
                window.setTimeout(() => setRefreshing(false), 500)
              }}
            >
              {refreshing ? <i className="spin" /> : <AiIcon scopes={[S.log]} name="refresh" size={14} />} 刷新
            </button>
          </div>
        </div>
        {series.rows.length === 0 ? (
          <div {...marks(S.log)} className="state">
            最近 24 小时暂无访问记录
          </div>
        ) : (
          <div className="ready-table-wrap">
            <table className="ready-table">
              <thead>
                <tr>
                  <th style={{ width: 170 }}>时间</th>
                  <th style={{ width: 160 }}>AI 爬虫</th>
                  <th>访问页面</th>
                  <th style={{ width: 90 }}>状态</th>
                  <th style={{ width: 90 }}>耗时</th>
                  <th>User-Agent</th>
                </tr>
              </thead>
              <tbody>
                {series.rows.map((row) => (
                  <tr key={`${row.time}-${row.bot}-${row.path}`}>
                    <td>{row.time}</td>
                    <td>
                      <span {...marks(S.log)} className="bot-tag" title={row.bot}>
                        {botLabel(row.bot)}
                      </span>
                    </td>
                    <td className="path" title={row.path}>
                      {row.path}
                    </td>
                    <td>
                      <span {...marks(S.log)} className={`status ${statusClass(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td>{row.duration}s</td>
                    <td className="ua" title={row.ua}>
                      {row.ua}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AIReady() {
  const [checks] = useState(readyData.checks)
  const [openMap, setOpenMap] = useState({})
  const [openGroup, setOpenGroup] = useState('readable')
  const [handled, setHandled] = useState({})
  const [detecting, setDetecting] = useState({})
  const [dialog, setDialog] = useState(null)
  const [toast, setToast] = useState(null)
  const [regenerating, setRegenerating] = useState('')
  const checkRef = useRef(null)
  const brandRef = useRef(null)
  const toastTimer = useRef(0)

  function showToast(type, text) {
    window.clearTimeout(toastTimer.current)
    setToast({ type, text })
    toastTimer.current = window.setTimeout(() => setToast(null), 2200)
  }

  function pendingOf(code) {
    const section = readyData.optimizeSections.find((item) => item.code === code)
    return section.items.filter((item) => !handled[item.id]).length
  }

  function handleOptimize(item, action) {
    if (action === 'agree' && !item.action.ignorable && !item.action.form) {
      showToast('info', '该入口即将开放')
      return
    }
    setHandled((current) => {
      const next = { ...current }
      if (action === 'restore') delete next[item.id]
      else next[item.id] = action === 'agree' ? 'done' : 'ignored'
      return next
    })
  }

  function handleDetect(section) {
    if (detecting[section.code]) return
    setDetecting((current) => ({ ...current, [section.code]: true }))
    window.setTimeout(() => {
      setHandled((current) => {
        const next = { ...current }
        section.items.forEach((item) => {
          delete next[item.id]
        })
        return next
      })
      setDetecting((current) => ({ ...current, [section.code]: false }))
      showToast('success', '检测完成')
    }, 800)
  }

  function handleRegenerate(row) {
    setRegenerating(row.code)
    window.setTimeout(() => {
      setRegenerating('')
      showToast('success', `${row.label} 已重新生成`)
    }, 900)
  }

  const sections = useMemo(() => readyData.optimizeSections, [])

  useEffect(() => {
    document.getElementById('opt-readable')?.scrollIntoView({ block: 'start' })
  }, [])

  return (
    <div {...marks(S.ready)} className="ai-ready">
      <div {...marks(S.ready, S.report)} className="report no-tabs">
        <Summary checks={checks} brandPending={pendingOf('brand')} readablePending={pendingOf('readable')} trustPending={pendingOf('trust')} onJump={(code) => (code === 'check' ? checkRef : brandRef).current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
        <SectionTitle sectionRef={checkRef} title="被 AI 看见 · 关键项检查" icon="shield" tip="技术层 · 网站交付时关键项自动就绪" />
        <CheckList items={checks} openMap={openMap} onToggle={(code) => setOpenMap((current) => ({ ...current, [code]: !current[code] }))} onDialog={setDialog} regenerating={regenerating} onRegenerate={handleRegenerate} />
        <SectionTitle sectionRef={brandRef} className="report-section-gap" title="被 AI 理解 · 内容优化" icon="book-open" color="#9333ea" tip="AI 自动检测 → 生成建议 → 你确认或补充 → 自动生效" tipIcon="sparkle" />
        {sections.map((section) => (
          <OptimizeSection
            key={section.code}
            section={section}
            handled={handled}
            detecting={!!detecting[section.code]}
            open={openGroup === section.code}
            onToggle={() => setOpenGroup((current) => (current === section.code ? null : section.code))}
            onHandle={handleOptimize}
            onDetect={handleDetect}
            onToast={showToast}
          />
        ))}
        <SectionTitle className="report-section-gap" title="AI 模型访问日志" icon="robot" color="#0891b2" tip="点击爬虫切换趋势和日志" />
        <CrawlerLogs />
      </div>
      <Dialog dialog={dialog} onClose={() => setDialog(null)} />
      {toast ? <div className={`ready-toast is-${toast.type}`}>{toast.text}</div> : null}
    </div>
  )
}
