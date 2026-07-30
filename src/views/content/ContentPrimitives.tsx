import type { CSSProperties } from 'react'
import type { ComplianceLevel, ContentChannel, ContentTaskStatus } from '../../types'

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
