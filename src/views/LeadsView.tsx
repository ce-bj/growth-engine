import { useState, useMemo, useEffect, useRef } from 'react'
import {
  BarChart2, Search, Filter, Mail, ChevronDown, ChevronUp,
  Phone, Building2, Globe, Clock, Tag, User, Star,
  ArrowLeft, MapPin, ExternalLink, X, Plus, CheckCircle,
  TrendingUp, Zap,
} from 'lucide-react'
import {
  mockLeadsData,
  mockLeadsStatsData,
  INTENT_LABELS,
  LEAD_STATUS_LABELS,
  LEAD_SOURCE_LABELS,
} from '../data/mock'
import type {
  Lead,
  IntentLevel,
  LeadStatus,
  FollowUpRecord,
  FollowUpType,
} from '../types'

// ── 意向度颜色配置 ─────────────────────────────────────────
const INTENT_COLORS: Record<IntentLevel, { bg: string; text: string; dot: string; bar: string }> = {
  high:    { bg: '#FFF3E0', text: '#C55A11', dot: '#FF6B00', bar: '#FF6B00' },
  medium:  { bg: '#E3F2FD', text: '#1565C0', dot: '#42A5F5', bar: '#42A5F5' },
  low:     { bg: '#F3E5F5', text: '#6A1B9A', dot: '#AB47BC', bar: '#AB47BC' },
  invalid: { bg: '#FAFAFA', text: '#9E9E9E', dot: '#BDBDBD', bar: '#BDBDBD' },
}

const STATUS_COLORS: Record<LeadStatus, string> = {
  pending:    '#64748b',
  contacted:  '#16a34a',
  qualified:  '#d97706',
  converted:  '#37474F',
  invalid:    '#9e9e9e',
}

const SOURCE_ICONS: Record<string, string> = {
  google_organic: '🔍',
  baidu_organic:  '🔍',
  google_ads:     '📢',
  baidu_ads:      '📢',
  social_media:   '📱',
  ai_chat:        '🤖',
  email:          '📧',
  direct:         '🏠',
  referral:       '🔗',
  unknown:        '❓',
}

const FOLLOWUP_TYPE_ICONS: Record<FollowUpType, string> = {
  phone: '📞',
  email: '📧',
  sms:   '💬',
  note:  '📝',
}

const FOLLOWUP_TYPE_LABELS: Record<FollowUpType, string> = {
  phone: '电话',
  email: '邮件',
  sms:   '短信',
  note:  '备注',
}

const SLA_HOURS = 24

// ── SLA 计时器 ─────────────────────────────────────────────
function SlaTimer({ createdAt, hasFollowUp }: { createdAt: string; hasFollowUp: boolean }) {
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    if (hasFollowUp) { setRemaining(null); return }
    const calc = () => {
      const created = new Date(createdAt).getTime()
      const now = Date.now()
      const elapsed = (now - created) / 3600000
      const left = Math.max(0, SLA_HOURS - elapsed)
      setRemaining(left)
    }
    calc()
    const id = setInterval(calc, 60000)
    return () => clearInterval(id)
  }, [createdAt, hasFollowUp])

  if (hasFollowUp || remaining === null) return null
  if (remaining === 0) {
    return <span className="leads-sla-badge leads-sla-badge--overdue">⛔ 已超时</span>
  }
  if (remaining <= 4) {
    return <span className="leads-sla-badge leads-sla-badge--urgent">⏰ 剩余 {Math.ceil(remaining)}h</span>
  }
  return <span className="leads-sla-badge leads-sla-badge--normal">⏱ {Math.floor(remaining)}h</span>
}

// ── 意向度徽章 ─────────────────────────────────────────────
function IntentBadge({ level }: { level: IntentLevel }) {
  const c = INTENT_COLORS[level]
  return (
    <span className="leads-intent-badge" style={{ background: c.bg, color: c.text }}>
      <span className="leads-intent-dot" style={{ background: c.dot }} />
      {INTENT_LABELS[level]}
    </span>
  )
}

// ── 标签芯片 ───────────────────────────────────────────────
function TagChip({ label }: { label: string }) {
  return <span className="leads-tag-chip">{label}</span>
}

// ── 跟进记录时间线 ─────────────────────────────────────────
function FollowUpTimeline({ records }: { records: FollowUpRecord[] }) {
  if (records.length === 0) {
    return (
      <div className="leads-timeline-empty">
        <span>暂无跟进记录</span>
        <span className="leads-timeline-hint">点击下方「写跟进」按钮添加</span>
      </div>
    )
  }
  return (
    <div className="leads-timeline">
      {records.map((rec) => (
        <div key={rec.id} className="leads-timeline-item">
          <div className="leads-timeline-dot">
            {FOLLOWUP_TYPE_ICONS[rec.type]}
          </div>
          <div className="leads-timeline-content">
            <div className="leads-timeline-header">
              <span className="leads-timeline-type">{FOLLOWUP_TYPE_LABELS[rec.type]}</span>
              <span className="leads-timeline-time">{rec.createdAt.replace('T', ' ').slice(0, 16)}</span>
            </div>
            <div className="leads-timeline-text">{rec.content}</div>
            {rec.nextContact && (
              <div className="leads-timeline-next">
                <Clock size={10} />
                下次联系：{rec.nextContact.replace('T', ' ').slice(0, 16)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── 写跟进表单 ─────────────────────────────────────────────
function FollowUpForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (type: FollowUpType, content: string, nextContact: string) => void
  onCancel: () => void
}) {
  const [type, setType] = useState<FollowUpType>('phone')
  const [content, setContent] = useState('')
  const [nextContact, setNextContact] = useState('')

  return (
    <div className="leads-followup-form">
      <div className="leads-followup-form__title">
        <Plus size={14} /> 添加跟进记录
      </div>
      <div className="leads-followup-form__row">
        <div className="leads-followup-form__type-group">
          {(Object.keys(FOLLOWUP_TYPE_LABELS) as FollowUpType[]).map((t) => (
            <button
              key={t}
              className={`leads-type-btn${type === t ? ' is-active' : ''}`}
              onClick={() => setType(t)}
            >
              {FOLLOWUP_TYPE_ICONS[t]} {FOLLOWUP_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>
      <textarea
        className="leads-followup-textarea"
        placeholder="描述本次跟进内容...（必填）"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
      />
      <div className="leads-followup-form__row leads-followup-form__row--next">
        <Clock size={13} />
        <input
          type="datetime-local"
          className="leads-followup-datetime"
          value={nextContact}
          onChange={(e) => setNextContact(e.target.value)}
        />
        <span className="leads-followup-next-hint">下次联系时间（选填）</span>
      </div>
      <div className="leads-followup-form__actions">
        <button className="leads-btn leads-btn--secondary" onClick={onCancel}>
          取消
        </button>
        <button
          className="leads-btn leads-btn--primary"
          disabled={!content.trim()}
          onClick={() => { onSubmit(type, content, nextContact); setContent(''); setNextContact('') }}
        >
          <CheckCircle size={13} /> 保存记录
        </button>
      </div>
    </div>
  )
}

// ── 详情弹窗 ───────────────────────────────────────────────
function LeadDetailModal({
  lead,
  onClose,
  onUpdate,
}: {
  lead: Lead
  onClose: () => void
  onUpdate: (id: string, patch: Partial<Lead>) => void
}) {
  const c = INTENT_COLORS[lead.intentLevel]
  const [showForm, setShowForm] = useState(false)
  const records = lead.followUpRecords ?? []
  const hasFollowUp = records.length > 0
  const modalRef = useRef<HTMLDivElement>(null)

  // ESC 关闭
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // 点击遮罩关闭
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleStatusChange = (status: LeadStatus) => {
    onUpdate(lead.id, {
      status,
      statusLabel: LEAD_STATUS_LABELS[status],
    })
  }

  const handleAddFollowUp = (type: FollowUpType, content: string, nextContact: string) => {
    const newRecord: FollowUpRecord = {
      id: `fu-${lead.id}-${Date.now()}`,
      type,
      content,
      createdAt: new Date().toISOString(),
      nextContact: nextContact || undefined,
    }
    onUpdate(lead.id, {
      followUpRecords: [...(lead.followUpRecords ?? []), newRecord],
      status: 'contacted',
      statusLabel: LEAD_STATUS_LABELS['contacted'],
    })
    setShowForm(false)
  }

  const aiAdvice = () => {
    if (lead.intentLevel === 'high') return '🔥 高意向，建议优先电话联系，可直接发产品报价单，争取本周内签约。'
    if (lead.intentLevel === 'medium') return '💧 中意向，建议发送行业案例报告，建立信任后再电话跟进。'
    return '💨 低意向，建议发送培育邮件序列，定期推送内容，等待需求激活。'
  }

  return (
    <div className="leads-modal-overlay" onClick={handleOverlayClick}>
      <div className="leads-modal" ref={modalRef}>
        {/* ── 顶部操作栏 ── */}
        <div className="leads-modal__topbar">
          <button className="leads-modal__back" onClick={onClose}>
            <ArrowLeft size={15} /> 返回列表
          </button>
          <div className="leads-modal__topbar-right">
            <button className="leads-btn leads-btn--primary" onClick={() => {/* 发邮件 */}}>
              <Mail size={13} /> 发送邮件
            </button>
          </div>
          <button className="leads-modal__close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* ── 头部信息卡 ── */}
        <div className="leads-modal__header" style={{ borderLeftColor: c.dot }}>
          <div className="leads-modal__header-left">
            <div className="leads-modal__company">{lead.company}</div>
            <div className="leads-modal__contact">
              {lead.contact}
              {lead.jobTitle ? ` · ${lead.jobTitle}` : ''}
              <span className="leads-modal__source-badge">
                {SOURCE_ICONS[lead.source] ?? '📌'} {lead.sourceLabel}
              </span>
            </div>
            <div className="leads-modal__meta">
              <SlaTimer createdAt={lead.createdAt} hasFollowUp={hasFollowUp} />
              <IntentBadge level={lead.intentLevel} />
              <span
                className="leads-status-badge"
                style={{ color: STATUS_COLORS[lead.status], borderColor: STATUS_COLORS[lead.status] }}
              >
                {lead.statusLabel}
              </span>
            </div>
          </div>
          <div className="leads-modal__header-right">
            {/* 意向分 */}
            <div className="leads-modal__score-block">
              <div className="leads-modal__score-label">意向分</div>
              <div className="leads-modal__score-value" style={{ color: c.dot }}>{lead.intentScore}</div>
              <div className="leads-modal__score-bar">
                <div
                  className="leads-modal__score-fill"
                  style={{ width: `${lead.intentScore}%`, background: c.bar }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── AI 洞察条 ── */}
        <div className="leads-modal__ai-bar">
          <Zap size={14} />
          <span>{aiAdvice()}</span>
        </div>

        {/* ── 主内容区 ── */}
        <div className="leads-modal__body">
          {/* 左栏 */}
          <div className="leads-modal__col leads-modal__col--left">

            {/* 客户信息 */}
            <div className="leads-detail-card">
              <div className="leads-detail-card__title">
                <Building2 size={14} /> 客户信息
              </div>
              <div className="leads-info-grid">
                <div className="leads-info-row">
                  <span className="leads-info-label">公司名称</span>
                  <span className="leads-info-value">{lead.company}</span>
                </div>
                <div className="leads-info-row">
                  <span className="leads-info-label">联系人</span>
                  <span className="leads-info-value">{lead.contact}</span>
                </div>
                {lead.jobTitle && (
                  <div className="leads-info-row">
                    <span className="leads-info-label">职位</span>
                    <span className="leads-info-value">{lead.jobTitle}</span>
                  </div>
                )}
                {lead.email && (
                  <div className="leads-info-row">
                    <span className="leads-info-label">邮箱</span>
                    <span className="leads-info-value leads-info-value--link">{lead.email}</span>
                  </div>
                )}
                {lead.phone && (
                  <div className="leads-info-row">
                    <span className="leads-info-label">电话</span>
                    <span className="leads-info-value leads-info-value--link">{lead.phone}</span>
                  </div>
                )}
                {lead.region && (
                  <div className="leads-info-row">
                    <span className="leads-info-label">所在地区</span>
                    <span className="leads-info-value">{lead.region}</span>
                  </div>
                )}
                {lead.address && (
                  <div className="leads-info-row">
                    <span className="leads-info-label">公司地址</span>
                    <span className="leads-info-value">{lead.address}</span>
                  </div>
                )}
                <div className="leads-info-row">
                  <span className="leads-info-label">进入时间</span>
                  <span className="leads-info-value">{lead.createdAt.replace('T', ' ').slice(0, 16)}</span>
                </div>
                {lead.followUpBy && (
                  <div className="leads-info-row">
                    <span className="leads-info-label">归属销售</span>
                    <span className="leads-info-value">{lead.followUpBy}</span>
                  </div>
                )}
              </div>

              {/* AI 分析标签 */}
              <div className="leads-modal__tags-section">
                <div className="leads-modal__tags-title">AI 分析标签</div>
                <div className="leads-modal__tags">
                  {lead.tags.map((t) => (
                    <TagChip key={t.key} label={t.label} />
                  ))}
                </div>
              </div>

              {/* 意向判定理由 */}
              <div className="leads-modal__reason">
                <Tag size={12} />
                <span>{lead.intentReason}</span>
              </div>
            </div>

            {/* 状态变更 */}
            <div className="leads-detail-card">
              <div className="leads-detail-card__title">
                <TrendingUp size={14} /> 状态管理
              </div>
              <div className="leads-status-group">
                {(Object.keys(LEAD_STATUS_LABELS) as LeadStatus[]).map((s) => (
                  <button
                    key={s}
                    className={`leads-status-btn${lead.status === s ? ' is-active' : ''}`}
                    style={lead.status === s ? { borderColor: STATUS_COLORS[s], color: STATUS_COLORS[s] } : {}}
                    onClick={() => handleStatusChange(s)}
                  >
                    {LEAD_STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 右栏 */}
          <div className="leads-modal__col leads-modal__col--right">

            {/* 浏览轨迹 */}
            <div className="leads-detail-card">
              <div className="leads-detail-card__title">
                <BarChart2 size={14} /> 浏览轨迹
              </div>
              <div className="leads-behavior-list">
                {lead.behaviors.map((b, i) => {
                  const mins = Math.floor(b.stayDuration / 60)
                  const secs = b.stayDuration % 60
                  const durLabel = mins > 0 ? `${mins}分${secs}秒` : `${secs}秒`
                  return (
                    <div key={i} className="leads-behavior-row">
                      <div className="leads-behavior-row__left">
                        <Globe size={11} />
                        <span className="leads-behavior-row__page">{b.pageVisited}</span>
                      </div>
                      <div className="leads-behavior-row__right">
                        <span className="leads-behavior-row__dur">{durLabel}</span>
                        <span className="leads-behavior-row__time">{b.visitedAt}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="leads-behavior-footer">
                <ExternalLink size={11} />
                来源落地页：<span className="leads-lp-tag">{lead.landingPage}</span>
              </div>
            </div>

            {/* 跟进历史 */}
            <div className="leads-detail-card">
              <div className="leads-detail-card__title leads-detail-card__title--actions">
                <User size={14} /> 跟进历史
                <button
                  className="leads-add-followup-btn"
                  onClick={() => setShowForm(!showForm)}
                >
                  {showForm ? <ChevronUp size={13} /> : <Plus size={13} />}
                  {showForm ? '收起' : '写跟进'}
                </button>
              </div>

              {showForm && (
                <FollowUpForm
                  onSubmit={handleAddFollowUp}
                  onCancel={() => setShowForm(false)}
                />
              )}

              <FollowUpTimeline records={records} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 列表行 ─────────────────────────────────────────────────
function LeadRow({
  lead,
  onDetail,
}: {
  lead: Lead
  onDetail: (lead: Lead) => void
}) {
  const c = INTENT_COLORS[lead.intentLevel]
  const records = lead.followUpRecords ?? []
  const hasFollowUp = records.length > 0

  return (
    <tr className="leads-table-row" onClick={() => onDetail(lead)}>
      <td className="leads-cell leads-cell--source">
        <span className="leads-source-icon">{SOURCE_ICONS[lead.source] ?? '📌'}</span>
        <div>
          <div className="leads-source-name">{lead.sourceLabel}</div>
          <div className="leads-landing">{lead.landingPage}</div>
        </div>
      </td>
      <td className="leads-cell leads-cell--time">
        <Clock size={12} />
        {lead.createdAt.split(' ')[1]}
      </td>
      <td className="leads-cell leads-cell--company">
        <Building2 size={13} />
        <div>
          <div className="leads-company">{lead.company}</div>
          <div className="leads-contact">
            {lead.contact}
            {lead.jobTitle ? <span className="leads-jobtitle"> · {lead.jobTitle}</span> : null}
          </div>
        </div>
      </td>
      <td className="leads-cell leads-cell--contact">
        {lead.email && <div className="leads-email"><Mail size={11}/>{lead.email}</div>}
        {lead.phone && <div className="leads-phone"><Phone size={11}/>{lead.phone}</div>}
      </td>
      <td className="leads-cell leads-cell--intent">
        <IntentBadge level={lead.intentLevel} />
        <SlaTimer createdAt={lead.createdAt} hasFollowUp={hasFollowUp} />
        <div className="leads-intent-reason">{lead.intentReason}</div>
      </td>
      <td className="leads-cell leads-cell--tags">
        {lead.tags.slice(0, 3).map((t) => (
          <TagChip key={t.key} label={t.label} />
        ))}
        {lead.tags.length > 3 && (
          <span className="leads-tag-more">+{lead.tags.length - 3}</span>
        )}
      </td>
      <td className="leads-cell leads-cell--status">
        <span
          className="leads-status-badge"
          style={{ color: STATUS_COLORS[lead.status], borderColor: STATUS_COLORS[lead.status] }}
        >
          {lead.statusLabel}
        </span>
        {records.length > 0 && (
          <span className="leads-followup-count">{records.length}条跟进</span>
        )}
      </td>
      <td className="leads-cell leads-cell--action" onClick={(e) => e.stopPropagation()}>
        <button
          className="leads-action-btn"
          title="发送邮件"
        >
          <Mail size={14} />
        </button>
        <button
          className="leads-action-btn"
          title="查看详情"
          onClick={() => onDetail(lead)}
        >
          <ChevronDown size={14} />
        </button>
      </td>
    </tr>
  )
}

// ── 主视图 ─────────────────────────────────────────────────
export function LeadsView() {
  const [filterIntent, setFilterIntent] = useState<IntentLevel | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<LeadStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  // 列表数据用 state 管理，支持详情页修改后同步刷新
  const [leads, setLeads] = useState<Lead[]>(mockLeadsData)
  const [detailLead, setDetailLead] = useState<Lead | null>(null)

  const stats = useMemo(() => ({
    total: leads.length,
    todayNew: leads.filter((l) => l.createdAt.startsWith('2026-07-27')).length,
    highIntent: leads.filter((l) => l.intentLevel === 'high').length,
    pendingFollowUp: leads.filter((l) => l.status === 'pending').length,
  }), [leads])

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const matchIntent = filterIntent === 'all' || l.intentLevel === filterIntent
      const matchStatus = filterStatus === 'all' || l.status === filterStatus
      const q = search.toLowerCase()
      const matchSearch = !q
        || l.company.toLowerCase().includes(q)
        || l.contact.toLowerCase().includes(q)
        || l.sourceLabel.includes(q)
        || l.landingPage.includes(q)
        || l.email?.toLowerCase().includes(q)
        || l.phone?.includes(q)
      return matchIntent && matchStatus && matchSearch
    })
  }, [leads, filterIntent, filterStatus, search])

  const highPercent = stats.total > 0
    ? Math.round((stats.highIntent / stats.total) * 100)
    : 0

  const handleDetailOpen = (lead: Lead) => {
    setDetailLead(lead)
  }

  const handleDetailClose = () => {
    setDetailLead(null)
  }

  const handleLeadUpdate = (id: string, patch: Partial<Lead>) => {
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, ...patch } : l))
    setDetailLead((prev) => prev ? { ...prev, ...patch } : null)
  }

  return (
    <div className="leads-page">
      {/* ── 页面标题 ── */}
      <div className="leads-page__header">
        <div>
          <h1 className="leads-page__title">线索管理</h1>
          <p className="leads-page__subtitle">
            实时追踪各渠道来源线索，从访客行为到意向判定全链路可视化
          </p>
        </div>
      </div>

      {/* ── 统计卡片 ── */}
      <div className="leads-stats-grid">
        <div className="leads-stat-card">
          <div className="leads-stat-icon leads-stat-icon--blue">📋</div>
          <div className="leads-stat-body">
            <div className="leads-stat-value">{stats.total}</div>
            <div className="leads-stat-label">总线索数</div>
          </div>
        </div>
        <div className="leads-stat-card">
          <div className="leads-stat-icon leads-stat-icon--green">🆕</div>
          <div className="leads-stat-body">
            <div className="leads-stat-value">{stats.todayNew}</div>
            <div className="leads-stat-label">今日新增</div>
          </div>
        </div>
        <div className="leads-stat-card">
          <div className="leads-stat-icon leads-stat-icon--orange">🔥</div>
          <div className="leads-stat-body">
            <div className="leads-stat-value">{stats.highIntent}</div>
            <div className="leads-stat-label">高意向线索</div>
            <div className="leads-stat-sub">{highPercent}% 占比</div>
          </div>
        </div>
        <div className="leads-stat-card">
          <div className="leads-stat-icon leads-stat-icon--red">⏳</div>
          <div className="leads-stat-body">
            <div className="leads-stat-value">{stats.pendingFollowUp}</div>
            <div className="leads-stat-label">待跟进</div>
          </div>
        </div>
      </div>

      {/* ── 筛选区 ── */}
      <div className="leads-filters">
        <div className="leads-filters__left">
          <div className="leads-filter-group">
            <Filter size={13} />
            <span className="leads-filter-label">意向度</span>
            <select
              className="leads-select"
              value={filterIntent}
              onChange={(e) => setFilterIntent(e.target.value as IntentLevel | 'all')}
            >
              <option value="all">全部</option>
              <option value="high">🔥 高意向</option>
              <option value="medium">💧 中意向</option>
              <option value="low">💨 低意向</option>
              <option value="invalid">❌ 无效</option>
            </select>
          </div>
          <div className="leads-filter-group">
            <span className="leads-filter-label">状态</span>
            <select
              className="leads-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as LeadStatus | 'all')}
            >
              <option value="all">全部</option>
              <option value="pending">待跟进</option>
              <option value="contacted">已联系</option>
              <option value="qualified">已筛选</option>
              <option value="converted">已转化</option>
              <option value="invalid">无效</option>
            </select>
          </div>
        </div>
        <div className="leads-search-box">
          <Search size={13} />
          <input
            className="leads-search-input"
            type="text"
            placeholder="搜索公司名 / 联系人 / 邮箱 / 电话"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── 数据表 ── */}
      <div className="leads-table-wrap">
        <table className="leads-table">
          <thead>
            <tr>
              <th>来源渠道</th>
              <th>时间</th>
              <th>公司 / 联系人</th>
              <th>联系方式</th>
              <th>意向度</th>
              <th>AI分析标签</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="leads-empty">
                  <div className="leads-empty__inner">
                    <span className="leads-empty__icon">🔍</span>
                    <div className="leads-empty__text">暂无符合条件的线索</div>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((lead) => (
                <LeadRow key={lead.id} lead={lead} onDetail={handleDetailOpen} />
              ))
            )}
          </tbody>
        </table>

        {filtered.length > 0 && (
          <div className="leads-table-footer">
            共 {filtered.length} 条线索
          </div>
        )}
      </div>

      {/* ── 详情弹窗 ── */}
      {detailLead && (
        <LeadDetailModal
          lead={detailLead}
          onClose={handleDetailClose}
          onUpdate={handleLeadUpdate}
        />
      )}
    </div>
  )
}
