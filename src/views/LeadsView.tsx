import { useState, useMemo, useRef, useEffect, type Dispatch, type SetStateAction } from 'react'
import {
  Search, Filter, X, CheckSquare, Square, Trash2, Settings2,
  ArrowLeft, Plus, Mail, Phone, Building2, User, Globe,
  BarChart2, ExternalLink, ChevronUp, ChevronDown, TrendingUp,
  Tag, Zap, MessageSquare, FileText, Bot, Clock,
} from 'lucide-react'
import type {
  Lead, LeadStatus, LeadSource, IntentLevel,
  FollowUpType, FollowUpRecord, LeadBehavior, LeadTag,
} from '../types'

// ── 常量 ────────────────────────────────────────────────────

const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  korean_site: '韩语站点',
  feiyu_crm: '飞鱼CRM',
  baidu_ads: '百度营销',
  tencent_ads: '腾讯广告',
  trade_insight: '外贸客户洞察',
  global_company_db: '全球企业库',
}

const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  pending: '待跟进',
  contacted: '已联系',
  qualified: '已筛选',
  converted: '已转化',
  invalid: '无效',
}

const STATUS_COLORS: Record<LeadStatus, string> = {
  pending: '#f59e0b',
  contacted: '#3b82f6',
  qualified: '#10b981',
  converted: '#8b5cf6',
  invalid: '#9ca3af',
}

const INTENT_COLORS: Record<IntentLevel, { dot: string; bar: string }> = {
  high:   { dot: '#ef4444', bar: '#fee2e2' },
  medium: { dot: '#f59e0b', bar: '#fef3c7' },
  low:    { dot: '#94a3b8', bar: '#f1f5f9' },
  invalid:{ dot: '#d1d5db', bar: '#f9fafb' },
}

export const LEAD_SOURCE_OPTIONS = Object.entries(LEAD_SOURCE_LABELS).map(([v, l]) => ({
  value: v as LeadSource,
  label: l,
}))

// ── 全表字段定义 ───────────────────────────────────────────

export type TableColKey =
  | 'sourceForm' | 'source' | 'createdAt' | 'company' | 'contact'
  | 'email' | 'phone' | 'region' | 'country'
  | 'intentLevel' | 'status'
  | 'tags' | 'owner' | 'followUps'

export interface TableColDef {
  key: TableColKey
  label: string
  sortable?: boolean
  /** 默认是否展示 */
  defaultVisible: boolean
}

export const ALL_TABLE_COLS: TableColDef[] = [
  { key: 'sourceForm',    label: '来源表单',  defaultVisible: true  },
  { key: 'source',        label: '来源',      defaultVisible: true  },
  { key: 'createdAt',     label: '进入时间',  sortable: true, defaultVisible: true  },
  { key: 'company',       label: '公司名称',  sortable: true, defaultVisible: true  },
  { key: 'contact',       label: '联系人',    defaultVisible: true  },
  { key: 'email',         label: '邮箱',      defaultVisible: true  },
  { key: 'phone',         label: '电话',      defaultVisible: true  },
  { key: 'region',        label: '地区',      defaultVisible: false },
  { key: 'country',       label: '国家',      defaultVisible: true  },
  { key: 'intentLevel',   label: '意向度',   sortable: true, defaultVisible: true  },
  { key: 'status',        label: '状态',      defaultVisible: true  },
  { key: 'tags',          label: 'AI标签',    defaultVisible: false },
  { key: 'owner',         label: '归属销售',  defaultVisible: true  },
  { key: 'followUps',     label: '跟进数',   sortable: true, defaultVisible: true  },
  // 注：海关数据 / 表单内容 / 客服对话 / 最近活跃 / 意向分 仅在详情页或已移除，不出现在列表列
]

// 默认显示列
const DEFAULT_VISIBLE_KEYS = ALL_TABLE_COLS
  .filter((c) => c.defaultVisible)
  .map((c) => c.key)

// ── 组件 ────────────────────────────────────────────────────

/** SLA 计时器 */
function SlaTimer({ createdAt, hasFollowUp }: { createdAt: string; hasFollowUp: boolean }) {
  const diff = Date.now() - new Date(createdAt).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hasFollowUp) return <span className="leads-sla-badge leads-sla-badge--ok">已跟进</span>
  if (hours >= 24) return <span className="leads-sla-badge leads-sla-badge--danger">⛔ 已超时</span>
  if (hours > 4)   return <span className="leads-sla-badge leads-sla-badge--warn">⚠ {hours}h</span>
  return <span className="leads-sla-badge leads-sla-badge--ok">{24 - hours}h 内待跟进</span>
}

/** 意向徽章 */
function IntentBadge({ level }: { level: IntentLevel }) {
  const map: Record<IntentLevel, string> = {
    high:   '🔥 高',
    medium: '💧 中',
    low:    '💨 低',
    invalid:'❌ 无效',
  }
  return <span className={`leads-intent-badge leads-intent-badge--${level}`}>{map[level]}</span>
}

/** 最近活跃时间：跟进记录 > 行为轨迹 > 进入时间 */
function getLastActivity(lead: Lead): string {
  const fu = lead.followUpRecords ?? []
  if (fu.length) {
    const last = fu[fu.length - 1].createdAt
    return last.includes('T') ? last.replace('T', ' ').slice(0, 16) : last
  }
  const beh = lead.behaviors ?? []
  if (beh.length) return beh[beh.length - 1].visitedAt
  return lead.createdAt
}

const INTENT_SHORT: Record<IntentLevel, string> = { high: '高', medium: '中', low: '低', invalid: '无效' }

const NURTURE_STATUS_LABELS: Record<string, string> = {
  sent: '已发送', opened: '已打开', clicked: '已点击', bounced: '已弹回',
}

/** 标签 chip */
function TagChip({ label }: { label: string }) {
  return <span className="leads-tag-chip">{label}</span>
}

/** 跟进时间线 */
function FollowUpTimeline({ records }: { records: FollowUpRecord[] }) {
  const ICON_MAP: Record<FollowUpType, string> = {
    phone: '📞', email: '📧', sms: '💬', note: '📝',
  }
  if (!records.length) return <div className="leads-timeline-empty">暂无跟进记录</div>
  return (
    <div className="leads-timeline">
      {[...records].reverse().map((r) => (
        <div key={r.id} className="leads-timeline-item">
          <span className="leads-timeline-icon">{ICON_MAP[r.type]}</span>
          <div className="leads-timeline-body">
            <div className="leads-timeline-content">{r.content}</div>
            <div className="leads-timeline-meta">
              {r.createdAt.replace('T', ' ').slice(0, 16)}
              {r.nextContact && (
                <span className="leads-timeline-next">
                  <Clock size={10} /> 下次：{r.nextContact}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/** 跟进表单 */
function FollowUpForm({
  onSubmit, onCancel,
}: { onSubmit: (type: FollowUpType, content: string, nextContact: string) => void; onCancel: () => void }) {
  const [type, setType] = useState<FollowUpType>('phone')
  const [content, setContent] = useState('')
  const [nextContact, setNextContact] = useState('')
  return (
    <div className="leads-followup-form">
      <div className="leads-followup-form__type">
        {(['phone', 'email', 'sms', 'note'] as FollowUpType[]).map((t) => (
          <button key={t} className={`leads-fu-type-btn${type === t ? ' is-active' : ''}`} onClick={() => setType(t)}>
            {t === 'phone' ? '📞电话' : t === 'email' ? '📧邮件' : t === 'sms' ? '💬短信' : '📝备注'}
          </button>
        ))}
      </div>
      <textarea
        className="leads-followup-form__textarea"
        placeholder="填写跟进内容..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
      />
      <div className="leads-followup-form__row">
        <label className="leads-followup-form__label">
          <Clock size={11} /> 下次联系时间
          <input type="datetime-local" className="leads-followup-form__datetime" value={nextContact}
            onChange={(e) => setNextContact(e.target.value)} />
        </label>
      </div>
      <div className="leads-followup-form__actions">
        <button className="leads-btn leads-btn--ghost" onClick={onCancel}>取消</button>
        <button className="leads-btn leads-btn--primary"
          disabled={!content.trim()}
          onClick={() => { onSubmit(type, content, nextContact); setContent(''); setNextContact('') }}>
          保存记录
        </button>
      </div>
    </div>
  )
}

// ── 主列表页 ────────────────────────────────────────────────

interface LeadsViewProps {
  leads: Lead[]
  setLeads: Dispatch<SetStateAction<Lead[]>>
  /** 打开线索详情页的回调（触发 App 层切换视图） */
  onOpenDetail: (leadId: string) => void
}

export function LeadsView({ leads, setLeads, onOpenDetail }: LeadsViewProps) {
  const [filterIntent, setFilterIntent] = useState<IntentLevel | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<LeadStatus | 'all'>('all')
  const [filterSource, setFilterSource] = useState<LeadSource | 'all'>('all')
  const [filterOwner, setFilterOwner] = useState<string>('all')
  const [search, setSearch] = useState('')

  // ── 字段显示控制 ──
  const [visibleCols, setVisibleCols] = useState<TableColKey[]>(DEFAULT_VISIBLE_KEYS)
  const [showColPicker, setShowColPicker] = useState(false)
  const colPickerRef = useRef<HTMLDivElement>(null)

  // ── 状态统计 ──
  const statusCounts = useMemo(() => {
    const counts: Record<LeadStatus | 'all', number> = {
      all: leads.length,
      pending: 0, contacted: 0, qualified: 0, converted: 0, invalid: 0
    }
    leads.forEach((l) => { counts[l.status]++ })
    return counts
  }, [leads])

  // ── 列表筛选结果 ──
  const ownerOptions = useMemo(() => {
    const set = new Set<string>()
    leads.forEach((l) => { if (l.owner) set.add(l.owner) })
    return Array.from(set).sort()
  }, [leads])

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const matchIntent = filterIntent === 'all' || l.intentLevel === filterIntent
      const matchStatus = filterStatus === 'all' || l.status === filterStatus
      const matchSource = filterSource === 'all' || l.source === filterSource
      const matchOwner = filterOwner === 'all' || (l.owner ?? '') === filterOwner
      const q = search.toLowerCase()
      const matchSearch = !q
        || l.company.toLowerCase().includes(q)
        || l.contact.toLowerCase().includes(q)
        || LEAD_SOURCE_LABELS[l.source].includes(q)
        || l.landingPage.includes(q)
        || l.email?.toLowerCase().includes(q)
        || l.phone?.includes(q)
        || (l.country ?? '').toLowerCase().includes(q)
      return matchIntent && matchStatus && matchSource && matchOwner && matchSearch
    })
  }, [leads, filterIntent, filterStatus, filterSource, filterOwner, search])

  // ── 批量选择 ──
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const allSelected = filtered.length > 0 && filtered.every((l) => selected.has(l.id))
  const someSelected = filtered.some((l) => selected.has(l.id))

  const toggleAll = () => {
    if (allSelected) {
      setSelected((s) => { const n = new Set(s); filtered.forEach((l) => n.delete(l.id)); return n })
    } else {
      setSelected((s) => { const n = new Set(s); filtered.forEach((l) => n.add(l.id)); return n })
    }
  }
  const toggleOne = (id: string) => {
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  const handleBatchDelete = () => {
    if (!confirm(`确认删除 ${selected.size} 条线索？`)) return
    setLeads((prev) => prev.filter((l) => !selected.has(l.id)))
    setSelected(new Set())
  }

  const handleBatchExport = () => {
    const rows = leads.filter((l) => selected.has(l.id))
    if (!rows.length) return
    const header = ['公司', '联系人', '来源', '意向度', '归属销售', '状态', '电话', '邮箱']
    const lines = rows.map((l) => [
      l.company, l.contact,
      LEAD_SOURCE_LABELS[l.source],
      INTENT_SHORT[l.intentLevel], l.owner ?? '—', l.statusLabel,
      l.phone ?? '', l.email ?? '',
    ].join(','))
    const csv = '﻿' + [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `线索导出_${new Date().toLocaleDateString('zh-CN')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const toggleCol = (key: TableColKey) => {
    setVisibleCols((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const todayStr = new Date().toISOString().slice(0, 10)
  const stats = useMemo(() => ({
    total: leads.length,
    todayNew: leads.filter((l) => l.createdAt.startsWith(todayStr)).length,
    highIntent: leads.filter((l) => l.intentLevel === 'high').length,
    pendingFollowUp: leads.filter((l) => l.status === 'pending').length,
  }), [leads, todayStr])

  const highPercent = stats.total > 0
    ? Math.round((stats.highIntent / stats.total) * 100)
    : 0

  const handleDeleteOne = (id: string) => {
    if (!confirm('确认删除该线索？')) return
    setLeads((prev) => prev.filter((l) => l.id !== id))
  }

  // 列表排序：意向度 > 时间
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const lvl: Record<IntentLevel, number> = { high: 3, medium: 2, low: 1, invalid: 0 }
      const delta = lvl[b.intentLevel] - lvl[a.intentLevel]
      if (delta !== 0) return delta
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [filtered])

  return (
    <div className="leads-page">
      {/* 页面标题 */}
      <div className="leads-page__header">
        <div>
          <h1 className="leads-page__title">线索管理</h1>
          <p className="leads-page__subtitle">
            实时追踪各渠道来源线索，从访客行为到意向判定全链路可视化
          </p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="leads-stats-grid">
        {[
          { icon: '📋', iconCls: 'leads-stat-icon--blue',   val: stats.total,          label: '总线索数',   sub: undefined },
          { icon: '🆕', iconCls: 'leads-stat-icon--green', val: stats.todayNew,       label: '今日新增',   sub: undefined },
          { icon: '🔥', iconCls: 'leads-stat-icon--orange', val: stats.highIntent,     label: '高意向线索', sub: `${highPercent}% 占比` },
          { icon: '⏳', iconCls: 'leads-stat-icon--red',    val: stats.pendingFollowUp, label: '待跟进',    sub: undefined },
        ].map(({ icon, iconCls, val, label, sub }) => (
          <div className="leads-stat-card" key={label}>
            <div className={`leads-stat-icon ${iconCls}`}>{icon}</div>
            <div className="leads-stat-body">
              <div className="leads-stat-value">{val}</div>
              <div className="leads-stat-label">{label}</div>
              {sub && <div className="leads-stat-sub">{sub}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* 状态标签导航 */}
      <div className="leads-status-tabs">
        {[
          { key: 'all', label: '全部', count: statusCounts.all },
          { key: 'pending', label: '待处理', count: statusCounts.pending },
          { key: 'contacted', label: '跟进中', count: statusCounts.contacted },
          { key: 'converted', label: '已转化', count: statusCounts.converted },
          { key: 'invalid', label: '无效', count: statusCounts.invalid },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`leads-status-tab ${filterStatus === tab.key ? 'active' : ''}`}
            onClick={() => setFilterStatus(tab.key as LeadStatus | 'all')}
          >
            {tab.label}
            <span className="leads-status-tab__count">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* 筛选区 */}
      <div className="leads-filters">
        <div className="leads-filters__left">
          <div className="leads-filter-group">
            <Filter size={13} />
            <span className="leads-filter-label">意向度</span>
            <select className="leads-select" value={filterIntent}
              onChange={(e) => setFilterIntent(e.target.value as IntentLevel | 'all')}>
              <option value="all">全部</option>
              <option value="high">🔥 高意向</option>
              <option value="medium">💧 中意向</option>
              <option value="low">💨 低意向</option>
              <option value="invalid">❌ 无效</option>
            </select>
          </div>
          <div className="leads-filter-group">
            <span className="leads-filter-label">来源</span>
            <select className="leads-select" value={filterSource}
              onChange={(e) => setFilterSource(e.target.value as LeadSource | 'all')}>
              <option value="all">全部</option>
              {Object.entries(LEAD_SOURCE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div className="leads-filter-group">
            <span className="leads-filter-label">归属销售</span>
            <select className="leads-select" value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}>
              <option value="all">全部</option>
              {ownerOptions.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          {/* 批量操作区 */}
          {selected.size > 0 && (
            <div className="leads-batch-bar">
              <span className="leads-batch-bar__count">已选 {selected.size} 条</span>
              <button className="leads-btn leads-btn--primary leads-btn--sm" onClick={handleBatchExport}>
                <ExternalLink size={12} /> 批量导出
              </button>
              <button className="leads-btn leads-btn--danger-ghost" onClick={handleBatchDelete}>
                <Trash2 size={12} /> 批量删除
              </button>
            </div>
          )}
        </div>

        <div className="leads-filters__right">
          {/* 字段显示控制 */}
          <div className="leads-col-picker-wrap" ref={colPickerRef}>
            <button className="leads-btn leads-btn--ghost leads-btn--sm"
              onClick={() => setShowColPicker((v) => !v)}>
              <Settings2 size={12} /> 显示字段
            </button>
            {showColPicker && (
              <div className="leads-col-picker">
                <div className="leads-col-picker__header">选择显示列</div>
                {ALL_TABLE_COLS.map((col) => (
                  <label key={col.key} className="leads-col-picker__item">
                    <input type="checkbox" checked={visibleCols.includes(col.key)}
                      onChange={() => toggleCol(col.key)} />
                    {col.label}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 搜索 */}
          <div className="leads-search-box">
            <Search size={13} />
            <input className="leads-search-input" type="text"
              placeholder="搜索公司名 / 联系人 / 国家 / 邮箱"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {/* 数据表 */}
      <div className="leads-table-wrap">
        <table className="leads-table">
          <colgroup>
            <col className="leads-th-check" />
            {visibleCols.map((key) => (
              <col key={key} className={`col-${key}`} />
            ))}
            <col className="col-actions" />
          </colgroup>
          <thead>
            <tr>
              {/* 全选列 */}
              <th className="leads-th-check">
                <button className="leads-check-btn" onClick={toggleAll}>
                  {allSelected ? <CheckSquare size={14} /> : someSelected ? <CheckSquare size={14} style={{opacity:.5}}/> : <Square size={14} />}
                </button>
              </th>
              {visibleCols.map((key) => (
                <th key={key}>{ALL_TABLE_COLS.find((c) => c.key === key)?.label}</th>
              ))}
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={visibleCols.length + 2} className="leads-empty">
                  <div className="leads-empty__inner">
                    <span className="leads-empty__icon">🔍</span>
                    <div className="leads-empty__text">暂无符合条件的线索</div>
                  </div>
                </td>
              </tr>
            ) : (
              sorted.map((lead) => (
                <LeadTableRow
                  key={lead.id}
                  lead={lead}
                  visibleCols={visibleCols}
                  selected={selected.has(lead.id)}
                  onToggle={() => toggleOne(lead.id)}
                  onDetail={() => onOpenDetail(lead.id)}
                  onDelete={() => handleDeleteOne(lead.id)}
                  onUpdate={(patch) => setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, ...patch } : l))}
                />
              ))
            )}
          </tbody>
        </table>

        {sorted.length > 0 && (
          <div className="leads-table-footer">
            共 {sorted.length} 条线索
            {selected.size > 0 && <span className="leads-footer-selected"> · 已选 {selected.size} 条</span>}
          </div>
        )}
      </div>
    </div>
  )
}

// ── 行操作组件（查看 | 转为客户 | 更多）────────────────────

function LeadRowActions({
  lead, onDetail, onDelete, onConvert,
}: {
  lead: Lead
  onDetail: () => void
  onDelete: () => void
  onConvert: () => void
}) {
  const [showMore, setShowMore] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMore(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="leads-row-actions">
      <button className="leads-action-btn leads-action-btn--link" onClick={onDetail}>
        查看
      </button>
      {lead.status !== 'converted' && (
        <button className="leads-action-btn leads-action-btn--primary" onClick={onConvert}>
          转为客户
        </button>
      )}
      <div className="leads-action-more" ref={moreRef}>
        <button
          className="leads-action-btn leads-action-btn--ghost"
          onClick={() => setShowMore(!showMore)}
        >
          更多 <ChevronDown size={12} style={{ transform: showMore ? 'rotate(180deg)' : 'none' }} />
        </button>
        {showMore && (
          <div className="leads-action-more__dropdown">
            <button className="leads-action-more__item" onClick={onDetail}>
              <ExternalLink size={12} /> 查看详情
            </button>
            <button className="leads-action-more__item leads-action-more__item--danger" onClick={onDelete}>
              <Trash2 size={12} /> 删除
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── 列表行 ─────────────────────────────────────────────────

function LeadTableRow({
  lead, visibleCols, selected, onToggle, onDetail, onDelete, onUpdate,
}: {
  lead: Lead
  visibleCols: TableColKey[]
  selected: boolean
  onToggle: () => void
  onDetail: () => void
  onDelete: () => void
  onUpdate: (patch: Partial<Lead>) => void
}) {
  const [showForm, setShowForm] = useState(false)

  const handleAddFollowUp = (type: FollowUpType, content: string, nextContact: string) => {
    const newRecord: FollowUpRecord = {
      id: `fu-${lead.id}-${Date.now()}`,
      type,
      content,
      createdAt: new Date().toISOString(),
      nextContact: nextContact || undefined,
    }
    onUpdate({
      followUpRecords: [...(lead.followUpRecords ?? []), newRecord],
      status: 'contacted',
      statusLabel: LEAD_STATUS_LABELS['contacted'],
    })
    setShowForm(false)
  }

  const renderCell = (key: TableColKey) => {
    switch (key) {
      case 'sourceForm':
        return (
          <span className="leads-source-form">{lead.sourceForm || '—'}</span>
        )
      case 'source':
        return (
          <div className="leads-source-cell">
            <span className="leads-source-site">{LEAD_SOURCE_LABELS[lead.source]}</span>
            {lead.sourceLang && (
              <span className="leads-source-lang">{lead.sourceLang}</span>
            )}
          </div>
        )
      case 'createdAt':
        return <span className="leads-date-cell">{lead.createdAt.replace('T', ' ').slice(0, 16)}</span>
      case 'company':
        return <span className="leads-company-cell">{lead.company}</span>
      case 'contact':
        return <span>{lead.contact}</span>
      case 'email':
        return lead.email ? <span className="leads-info-value--link">{lead.email}</span> : <span className="leads-muted">—</span>
      case 'phone':
        return lead.phone ? <span className="leads-info-value--link">{lead.phone}</span> : <span className="leads-muted">—</span>
      case 'region':
        return <span>{lead.region || '—'}</span>
      case 'country':
        return (
          <span className="leads-country-cell">
            <span className="leads-country-flag">
              {lead.country === '中国' ? '🇨🇳' : lead.country === '美国' ? '🇺🇸' : lead.country === '德国' ? '🇩🇪' : '🌐'}
            </span>
            {lead.country || '—'}
          </span>
        )
      case 'intentLevel':
        return <IntentBadge level={lead.intentLevel} />
      case 'status':
        return (
          <span className="leads-status-badge"
            style={{ color: STATUS_COLORS[lead.status], borderColor: STATUS_COLORS[lead.status] }}>
            {lead.statusLabel}
          </span>
        )
      case 'owner':
        return <span>{lead.owner ?? '—'}</span>
      case 'tags':
        return (
          <div className="leads-tags-cell">
            {(lead.tags || []).slice(0, 2).map((t) => <TagChip key={t.key} label={t.label} />)}
            {(lead.tags || []).length > 2 && <TagChip label={`+${(lead.tags || []).length - 2}`} />}
          </div>
        )
      case 'followUps':
        return (
          <span className={`leads-followup-count ${(lead.followUpRecords || []).length > 0 ? 'has' : ''}`}>
            {(lead.followUpRecords || []).length}
          </span>
        )
      default:
        return null
    }
  }

  return (
    <>
      <tr className={`leads-row${selected ? ' is-selected' : ''}`}
          onClick={onDetail} style={{ cursor: 'pointer' }}>
        <td className="leads-td-check" onClick={(e) => { e.stopPropagation(); onToggle() }}>
          <button className="leads-check-btn">
            {selected ? <CheckSquare size={14} /> : <Square size={14} />}
          </button>
        </td>
        {visibleCols.map((key) => (
          <td key={key}>{renderCell(key)}</td>
        ))}
        <td onClick={(e) => e.stopPropagation()}>
          <LeadRowActions
            lead={lead}
            onDetail={onDetail}
            onDelete={onDelete}
            onConvert={() => onUpdate({ status: 'converted', statusLabel: LEAD_STATUS_LABELS['converted'] })}
          />
        </td>
      </tr>
      {/* 行内跟进表单（点击查看时展开） */}
      {showForm && (
        <tr className="leads-row-followup">
          <td colSpan={visibleCols.length + 2}>
            <FollowUpForm
              onSubmit={handleAddFollowUp}
              onCancel={() => setShowForm(false)}
            />
          </td>
        </tr>
      )}
    </>
  )
}

// ── 线索详情页 ─────────────────────────────────────────────

interface LeadDetailViewProps {
  leadId: string
  leads: Lead[]
  setLeads: Dispatch<SetStateAction<Lead[]>>
  onBack: () => void
}

export function LeadDetailView({ leadId, leads, setLeads, onBack } : LeadDetailViewProps) {
  const lead = leads.find((l) => l.id === leadId)

  const handleUpdate = (patch: Partial<Lead>) => {
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, ...patch } : l))
  }

  if (!lead) {
    return (
      <div className="leads-page">
        <div className="leads-empty-page">
          <span className="leads-empty-page__icon">🔍</span>
          <p>未找到该线索</p>
          <button className="leads-btn leads-btn--primary" onClick={onBack}>
            返回列表
          </button>
        </div>
      </div>
    )
  }

  const c = INTENT_COLORS[lead.intentLevel]
  const [showForm, setShowForm] = useState(false)
  const records = lead.followUpRecords ?? []
  const hasFollowUp = records.length > 0

  const aiAdvice = () => {
    if (lead.intentLevel === 'high') return '🔥 高意向，建议优先电话联系，可直接发产品报价单，争取本周内签约。'
    if (lead.intentLevel === 'medium') return '💧 中意向，建议发送行业案例报告，建立信任后再电话跟进。'
    return '💨 低意向，建议发送培育邮件序列，定期推送内容，等待需求激活。'
  }

  const handleAddFollowUp = (type: FollowUpType, content: string, nextContact: string) => {
    const newRecord: FollowUpRecord = {
      id: `fu-${lead.id}-${Date.now()}`,
      type,
      content,
      createdAt: new Date().toISOString(),
      nextContact: nextContact || undefined,
    }
    handleUpdate({
      followUpRecords: [...records, newRecord],
      status: 'contacted',
      statusLabel: LEAD_STATUS_LABELS['contacted'],
    })
    setShowForm(false)
  }

  const handleStatusChange = (status: LeadStatus) => {
    handleUpdate({ status, statusLabel: LEAD_STATUS_LABELS[status] })
  }

  return (
    <div className="leads-page leads-detail-page">
      {/* ── 顶部导航 ── */}
      <div className="leads-detail-nav">
        <button className="leads-detail-nav__back" onClick={onBack}>
          <ArrowLeft size={15} /> 返回线索列表
        </button>
        <div className="leads-detail-nav__actions">
          <button className="leads-btn leads-btn--ghost">
            <Mail size={13} /> 发送邮件
          </button>
        </div>
      </div>

      {/* ── 头部信息卡 ── */}
      <div className="leads-detail-header" style={{ borderLeftColor: c.dot }}>
        <div className="leads-detail-header__left">
          <div className="leads-detail-header__company">{lead.company}</div>
          <div className="leads-detail-header__contact">
            {lead.contact}
            {lead.jobTitle ? ` · ${lead.jobTitle}` : ''}
            <span className="leads-source-badge">
              {LEAD_SOURCE_LABELS[lead.source]}
            </span>
            {lead.country && (
              <span className="leads-country-badge">
                {lead.country === '中国' ? '🇨🇳' : lead.country === '美国' ? '🇺🇸' : lead.country === '德国' ? '🇩🇪' : '🌐'}
                {' '}{lead.country}
              </span>
            )}
          </div>
          <div className="leads-detail-header__meta">
            <SlaTimer createdAt={lead.createdAt} hasFollowUp={hasFollowUp} />
            <IntentBadge level={lead.intentLevel} />
            <span className="leads-status-badge"
              style={{ color: STATUS_COLORS[lead.status], borderColor: STATUS_COLORS[lead.status] }}>
              {lead.statusLabel}
            </span>
          </div>
        </div>
        <div className="leads-detail-header__right">
          <div className="leads-detail-score">
            <div className="leads-detail-score__label">意向分</div>
            <div className="leads-detail-score__value" style={{ color: c.dot }}>{lead.intentScore}</div>
            <div className="leads-detail-score__bar">
              <div className="leads-detail-score__fill"
                style={{ width: `${lead.intentScore}%`, background: c.bar }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── AI 洞察条 ── */}
      <div className="leads-detail-ai-bar">
        <Zap size={14} />
        <span>{aiAdvice()}</span>
      </div>

      {/* ── 主内容区 2 列 ── */}
      <div className="leads-detail-body">
        {/* 左栏 */}
        <div className="leads-detail-col leads-detail-col--left">

          {/* 客户信息 */}
          <div className="leads-detail-card">
            <div className="leads-detail-card__title">
              <Building2 size={14} /> 客户信息
            </div>
            <div className="leads-info-grid">
              <><div className="leads-info-row"><span className="leads-info-label">公司名称</span><span className="leads-info-value">{lead.company}</span></div><div className="leads-info-row"><span className="leads-info-label">联系人</span><span className="leads-info-value">{lead.contact}</span></div>{lead.jobTitle && <div className="leads-info-row"><span className="leads-info-label">职位</span><span className="leads-info-value">{lead.jobTitle}</span></div>}{lead.industry && <div className="leads-info-row"><span className="leads-info-label">所属行业</span><span className="leads-info-value">{lead.industry}</span></div>}{lead.companyScale && <div className="leads-info-row"><span className="leads-info-label">企业规模</span><span className="leads-info-value">{lead.companyScale}</span></div>}{lead.email && <div className="leads-info-row"><span className="leads-info-label">邮箱</span><span className="leads-info-value leads-info-value--link">{lead.email}</span></div>}{lead.phone && <div className="leads-info-row"><span className="leads-info-label">电话</span><span className="leads-info-value leads-info-value--link">{lead.phone}</span></div>}{lead.region && <div className="leads-info-row"><span className="leads-info-label">所在地区</span><span className="leads-info-value">{lead.region}</span></div>}{lead.country && <div className="leads-info-row"><span className="leads-info-label">国家</span><span className="leads-info-value">{lead.country}</span></div>}{lead.address && <div className="leads-info-row"><span className="leads-info-label">公司地址</span><span className="leads-info-value">{lead.address}</span></div>}<div className="leads-info-row"><span className="leads-info-label">进入时间</span><span className="leads-info-value">{lead.createdAt.replace('T', ' ').slice(0, 16)}</span></div>{lead.owner && <div className="leads-info-row"><span className="leads-info-label">归属销售</span><span className="leads-info-value">{lead.owner}</span></div>}</>
            </div>
          </div>

          {/* 表单提交内容（来自用户主动留资） */}
          {lead.formSubmission && (
            <div className="leads-detail-card">
              <div className="leads-detail-card__title">
                <FileText size={14} /> 表单提交内容
              </div>
              <div className="leads-content-block leads-content-block--form">
                {lead.formSubmission}
              </div>
            </div>
          )}

          {/* 智能客服对话内容 */}
          {lead.aiChat && (
            <div className="leads-detail-card">
              <div className="leads-detail-card__title">
                <MessageSquare size={14} /> 智能客服对话
              </div>
              <div className="leads-content-block leads-content-block--chat">
                <div className="leads-chat-thread">
                  {lead.aiChatMessages?.map((msg, i) => (
                    <div key={i} className={`leads-chat-msg leads-chat-msg--${msg.role}`}>
                      <span className="leads-chat-msg__role">
                        {msg.role === 'user' ? '🙋 ' + lead.contact : '🤖 智能客服'}
                      </span>
                      <div className="leads-chat-msg__text">{msg.text}</div>
                      <span className="leads-chat-msg__time">{msg.time}</span>
                    </div>
                  )) ?? (
                    <div className="leads-chat-simple">{lead.aiChat}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 海关数据（customs source） */}
          {lead.source === 'global_company_db' && lead.customsData && (
            <div className="leads-detail-card">
              <div className="leads-detail-card__title">
                📦 海关数据详情
              </div>
              <div className="leads-info-grid">
                {[
                  <div key="hs" className="leads-info-row"><span className="leads-info-label">HS 编码</span><span className="leads-info-value">{lead.customsData!.hsCode}</span></div>,
                  <div key="type" className="leads-info-row"><span className="leads-info-label">进出口类型</span><span className="leads-info-value">{lead.customsData!.importExport === 'import' ? '进口' : '出口'}</span></div>,
                  <div key="val" className="leads-info-row"><span className="leads-info-label">贸易金额</span><span className="leads-info-value">{lead.customsData!.importValue}</span></div>,
                  <div key="orig" className="leads-info-row"><span className="leads-info-label">原产国</span><span className="leads-info-value">{lead.customsData!.originCountry}</span></div>,
                  <div key="dest" className="leads-info-row"><span className="leads-info-label">目的国</span><span className="leads-info-value">{lead.customsData!.destCountry}</span></div>,
                  <div key="date" className="leads-info-row"><span className="leads-info-label">最近进口时间</span><span className="leads-info-value">{lead.customsData!.lastImportDate}</span></div>,
                  <div key="freq" className="leads-info-row"><span className="leads-info-label">年进口频次</span><span className="leads-info-value">{lead.customsData!.importFrequency} 次/年</span></div>,
                  <div key="desc" className="leads-info-row"><span className="leads-info-label">主要产品描述</span><span className="leads-info-value">{lead.customsData!.productDesc}</span></div>,
                ]}
              </div>
            </div>
          )}

          {/* AI 分析标签 */}
          <div className="leads-detail-card">
            <div className="leads-detail-card__title">
              <Zap size={14} /> AI 分析标签
            </div>
            <div className="leads-tags-section">
              {lead.tags.map((t) => <TagChip key={t.key} label={t.label} />)}
            </div>
            <div className="leads-reason-block">
              <Tag size={12} />
              <span>{lead.intentReason}</span>
            </div>
          </div>

          {/* 状态管理 */}
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
        <div className="leads-detail-col leads-detail-col--right">

          {/* 浏览轨迹 */}
          <div className="leads-detail-card">
            <div className="leads-detail-card__title">
              <BarChart2 size={14} /> 浏览轨迹
            </div>
            <div className="leads-behavior-list">
              {(lead.behaviors || []).map((b, i) => {
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
              <button className="leads-add-followup-btn"
                onClick={() => setShowForm(!showForm)}>
                {showForm ? <ChevronUp size={13} /> : <Plus size={13} />}
                {showForm ? '收起' : '写跟进'}
              </button>
            </div>
            {showForm && (
              <FollowUpForm onSubmit={handleAddFollowUp} onCancel={() => setShowForm(false)} />
            )}
            <FollowUpTimeline records={records} />
          </div>

          {/* 培育履历 */}
          {lead.nurtureRecords && lead.nurtureRecords.length > 0 && (
            <div className="leads-detail-card">
              <div className="leads-detail-card__title">
                <Bot size={14} /> 培育履历
              </div>
              <div className="leads-nurture-list">
                {lead.nurtureRecords.map((n) => (
                  <div key={n.id} className="leads-nurture-row">
                    <div className="leads-nurture-row__head">
                      <span className="leads-nurture-seq">{n.sequenceName}</span>
                      <span className={`leads-nurture-status leads-nurture-status--${n.status}`}>
                        {NURTURE_STATUS_LABELS[n.status]}
                      </span>
                    </div>
                    <div className="leads-nurture-row__meta">
                      {n.channel === 'email' ? '📧' : '💬'} {n.subject} · {n.sentAt}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
