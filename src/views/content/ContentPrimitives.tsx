import type { CSSProperties } from 'react'
import type { ComplianceLevel, ContentChannel, ContentLocale, ContentTask, ContentTaskStatus, GlossaryStatus, GlossaryTerm, KnowledgeRiskEvent, KnowledgeRiskLevel, KnowledgeRiskStatus } from '../../types'

/** 内容运营演示数据锚定的当前时间点，用于"最近 N 天"筛选 */
const DEMO_TODAY = new Date('2026-07-30T23:59:59')

export function filterRecentKnowledgeRisks(risks: KnowledgeRiskEvent[], days = 7, max = 5) {
  const cutoff = DEMO_TODAY.getTime() - days * 24 * 60 * 60 * 1000
  return [...risks]
    .filter((risk) => new Date(risk.occurredAt).getTime() >= cutoff)
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, max)
}

export const CHANNEL_META: Record<ContentChannel, { label: string; short: string; color: string }> = {
  website: { label: '企业网站', short: 'Web', color: '#6366f1' },
  linkedin: { label: 'LinkedIn', short: 'in', color: '#0a66c2' },
  facebook: { label: 'Facebook', short: 'f', color: '#1877f2' },
  x: { label: 'X / Twitter', short: 'X', color: '#0f172a' },
}

export const STATUS_LABEL: Record<ContentTaskStatus, string> = {
  needs_material: '待补资料', ready: '待生产', generating: '生产中', quality_review: '质量审核',
  compliance_review: '合规审核', channel_adaptation: '渠道适配', pending_approval: '待审批',
  scheduled: '已排期', published: '已发布', observing: '观察中', needs_optimization: '待优化', retired: '已下架',
}

export const TYPE_LABEL = {
  product: '产品内容', solution: '行业方案', scenario: '应用场景', case: '客户案例', guide: '指南', faq: 'FAQ', insight: '行业洞察',
} as const

export const KIND_LABEL = {
  create: '创建', optimize: '优化', expand: '扩展', repurpose: '渠道改编', localize: '本地化', refresh: '更新', compliance: '合规修订', retire: '下架',
} as const

const COMPLIANCE_META: Record<ComplianceLevel, { label: string; className: string }> = {
  pass: { label: '合规通过', className: 'is-pass' }, low: { label: '低风险', className: 'is-low' },
  medium: { label: '中风险', className: 'is-medium' }, high: { label: '高风险', className: 'is-high' },
  blocking: { label: '阻断', className: 'is-blocking' },
}

export const KNOWLEDGE_RISK_SOURCE_LABEL = 'RAG no-hit（未命中知识库）'

const KNOWLEDGE_RISK_LEVEL_META: Record<KnowledgeRiskLevel, { label: string; className: string }> = {
  critical: { label: '严重', className: 'is-critical' }, high: { label: '高', className: 'is-high' },
  medium: { label: '中', className: 'is-medium' }, low: { label: '低', className: 'is-low' },
}

export const KNOWLEDGE_RISK_STATUS_LABEL: Record<KnowledgeRiskStatus, string> = {
  pending: '待处理', resolved: '已解决',
}

export function KnowledgeRiskBadge({ level }: { level: KnowledgeRiskLevel }) {
  const meta = KNOWLEDGE_RISK_LEVEL_META[level]
  return <span className={`content-knowledge-risk-badge ${meta.className}`}>{meta.label}</span>
}

export function ChannelBadge({ channel }: { channel: ContentChannel }) {
  const meta = CHANNEL_META[channel]
  return <span className="content-channel" style={{ '--channel-color': meta.color } as CSSProperties}><b>{meta.short}</b>{meta.label}</span>
}

export function StatusBadge({ status }: { status: ContentTaskStatus }) {
  return <span className={`content-status content-status--${status}`}>{STATUS_LABEL[status]}</span>
}

export function ComplianceBadge({ level }: { level: ComplianceLevel }) {
  const meta = COMPLIANCE_META[level]
  return <span className={`content-compliance-badge ${meta.className}`}>{meta.label}</span>
}

export function MetricCard({ label, value, sub, tone = 'default' }: { label: string; value: string | number; sub?: string; tone?: 'default' | 'good' | 'warning' | 'danger' }) {
  return <div className={`content-metric-card is-${tone}`}><span>{label}</span><strong>{value}</strong>{sub && <small>{sub}</small>}</div>
}

export function QualityRing({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' }) {
  const tone = score >= 80 ? 'good' : score >= 60 ? 'warning' : 'danger'
  return <span className={`content-quality-ring is-${tone} is-${size}`}><b>{score}</b><small>分</small></span>
}

/** 参照内容审核参考页的结论口径：存在未处理阻断项 → 拦截；存在未处理高/中风险 → 警告；否则通过 */
export type ReviewVerdict = 'pass' | 'warning' | 'block'

export function getReviewVerdict(task: ContentTask): ReviewVerdict {
  const unresolved = task.compliance.filter((issue) => !issue.resolved)
  if (unresolved.some((issue) => issue.level === 'blocking')) return 'block'
  if (unresolved.some((issue) => issue.level === 'high' || issue.level === 'medium')) return 'warning'
  return 'pass'
}

const REVIEW_VERDICT_META: Record<ReviewVerdict, { label: string; className: string }> = {
  pass: { label: '审核通过', className: 'is-pass' },
  warning: { label: '有警告', className: 'is-warning' },
  block: { label: '已拦截', className: 'is-block' },
}

export function ReviewVerdictBadge({ verdict }: { verdict: ReviewVerdict }) {
  const meta = REVIEW_VERDICT_META[verdict]
  return <span className={`content-verdict-badge ${meta.className}`}>{meta.label}</span>
}

/** 内容生产六步流程，与任务工作台的步骤条一一对应 */
export const CONTENT_STEPS = ['任务简报', '资料与素材', '母稿生产', '质量与合规', '渠道版本', '审批与发布'] as const

/** 由任务状态推导当前所处的生产步骤下标；返回 6 表示六步已全部走完 */
export function getTaskStep(status: ContentTaskStatus): number {
  switch (status) {
    case 'needs_material': return 1
    case 'ready':
    case 'generating': return 2
    case 'quality_review':
    case 'compliance_review': return 3
    case 'channel_adaptation': return 4
    case 'pending_approval':
    case 'scheduled': return 5
    default: return 6
  }
}

export function isPublishedStatus(status: ContentTaskStatus) {
  return status === 'published' || status === 'observing' || status === 'needs_optimization' || status === 'retired'
}

/** 六段式进度条：已完成的步骤填充，当前步骤高亮 */
export function ContentStepBar({ step }: { step: number }) {
  const label = step >= CONTENT_STEPS.length ? '已完成发布' : `${step + 1}. ${CONTENT_STEPS[step]}`
  return <div className="content-stepbar">
    <div className="content-stepbar__track">{CONTENT_STEPS.map((name, index) => <i key={name} title={`${index + 1}. ${name}`} className={index < step ? 'is-done' : index === step ? 'is-active' : ''} />)}</div>
    <span className={step >= CONTENT_STEPS.length ? 'is-complete' : ''}>{label}</span>
  </div>
}

/** 术语在指定语言站点集合下的译名完备度 */
export function getGlossaryStatus(term: GlossaryTerm, locales: ContentLocale[]): GlossaryStatus {
  const filled = locales.filter((locale) => term.translations[locale.code]?.trim()).length
  if (filled === 0) return 'missing'
  return filled === locales.length ? 'ready' : 'partial'
}

const GLOSSARY_STATUS_META: Record<GlossaryStatus, { label: string; className: string }> = {
  ready: { label: '译名完整', className: 'is-ready' },
  partial: { label: '部分缺失', className: 'is-partial' },
  missing: { label: '未配置', className: 'is-missing' },
}

export function GlossaryStatusBadge({ status }: { status: GlossaryStatus }) {
  const meta = GLOSSARY_STATUS_META[status]
  return <span className={`content-glossary-badge ${meta.className}`}>{meta.label}</span>
}

/** 取某个日期所在周的周一（YYYY-MM-DD） */
export function getWeekStart(date: Date) {
  const copy = new Date(date)
  const weekday = (copy.getDay() + 6) % 7
  copy.setDate(copy.getDate() - weekday)
  return formatDate(copy)
}

export function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function shiftWeek(weekStart: string, weeks: number) {
  const date = new Date(`${weekStart}T00:00:00`)
  date.setDate(date.getDate() + weeks * 7)
  return formatDate(date)
}

/** 演示数据锚定的“本周”起点 */
export const DEMO_WEEK_START = getWeekStart(DEMO_TODAY)
