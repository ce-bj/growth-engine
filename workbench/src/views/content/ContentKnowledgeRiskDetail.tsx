import { ArrowLeft } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '../../components/Button'
import type { KnowledgeRiskEvent, KnowledgeRiskLevel, KnowledgeRiskStatus } from '../../types'
import { filterRecentKnowledgeRisks, KNOWLEDGE_RISK_SOURCE_LABEL, KnowledgeRiskBadge, KNOWLEDGE_RISK_STATUS_LABEL, MetricCard } from './ContentPrimitives'

type TimeRange = 'today' | '7d' | '30d' | 'all'

const RANGE_DAYS: Record<TimeRange, number> = { today: 1, '7d': 7, '30d': 30, all: 3650 }

export function ContentKnowledgeRiskDetail({ risks, onBack, onOpenTask, onMarkResolved }: { risks: KnowledgeRiskEvent[]; onBack: () => void; onOpenTask: (id: string, step?: number) => void; onMarkResolved: (id: string) => void }) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')
  const [status, setStatus] = useState<'all' | KnowledgeRiskStatus>('all')
  const [level, setLevel] = useState<'all' | KnowledgeRiskLevel>('all')
  const [keyword, setKeyword] = useState('')

  const rangeFiltered = useMemo(() => filterRecentKnowledgeRisks(risks, RANGE_DAYS[timeRange], risks.length), [risks, timeRange])

  const filtered = useMemo(() => rangeFiltered.filter((risk) => {
    const query = keyword.trim().toLowerCase()
    return (status === 'all' || risk.status === status)
      && (level === 'all' || risk.level === level)
      && (!query || [risk.issueType, risk.diagnosis, risk.taskTitle].some((value) => value.toLowerCase().includes(query)))
  }), [rangeFiltered, keyword, level, status])

  const pendingCount = rangeFiltered.filter((item) => item.status === 'pending').length
  const resolvedCount = rangeFiltered.filter((item) => item.status === 'resolved').length
  const taskCount = new Set(rangeFiltered.map((item) => item.taskId)).size
  const highRiskShare = rangeFiltered.length === 0 ? 0 : Math.round((rangeFiltered.filter((item) => item.level === 'critical' || item.level === 'high').length / rangeFiltered.length) * 100)

  return <div className="content-page-stack">
    <div className="content-detail-header">
      <div>
        <div className="content-detail-header__title"><h2>内容生成 Agent · 风险样本</h2><span className="content-detail-badge">风险 Trace 筛选</span></div>
        <p>内容运营调用的知识库检索智能体产生的风险样本，均来自 RAG no-hit（未命中知识库）事件，帮助定位母稿生成过程中的知识缺口。</p>
      </div>
      <div className="content-detail-header__actions">
        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value as TimeRange)}><option value="today">今天</option><option value="7d">近 7 天</option><option value="30d">近 30 天</option><option value="all">全部</option></select>
        <Button variant="secondary" onClick={onBack}><ArrowLeft size={15} />返回总览</Button>
      </div>
    </div>

    <div className="content-metric-grid">
      <MetricCard label="待处理风险" value={pendingCount} sub="尚未标记解决" tone="warning" />
      <MetricCard label="已解决风险" value={resolvedCount} sub="已完成资料补充或复核" tone="good" />
      <MetricCard label="涉及内容任务" value={taskCount} sub="当前范围内任务数" />
      <MetricCard label="严重/高风险占比" value={`${highRiskShare}%`} sub="按当前时间范围" tone={highRiskShare > 0 ? 'danger' : 'default'} />
    </div>

    <section className="content-table-card">
      <div className="content-panel__head"><div><span className="content-eyebrow">RAG RISK TRACE</span><h3>风险 Trace</h3><p className="content-panel__desc">来源信号只有一种：{KNOWLEDGE_RISK_SOURCE_LABEL}。此处仅提供筛选和查看，不涉及具体处理流程。</p></div></div>
      <div className="content-filterbar">
        <input className="form-input" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="问题 / 诊断 / 任务标题" />
        <select value={status} onChange={(e) => setStatus(e.target.value as 'all' | KnowledgeRiskStatus)}><option value="all">全部状态</option><option value="pending">待处理</option><option value="resolved">已解决</option></select>
        <select value={level} onChange={(e) => setLevel(e.target.value as 'all' | KnowledgeRiskLevel)}><option value="all">全部风险</option><option value="critical">严重</option><option value="high">高</option><option value="medium">中</option><option value="low">低</option></select>
        <span>{filtered.length} 项结果</span>
      </div>
      <div className="table-wrap"><table className="content-data-table"><thead><tr><th>风险 / 状态</th><th>内容任务</th><th>来源信号</th><th>诊断</th><th>发生时间</th><th>操作</th></tr></thead><tbody>
        {filtered.length === 0 ? <tr><td colSpan={6} className="content-empty-row">当前筛选条件下没有风险 Trace。</td></tr> : filtered.map((risk) => <tr key={risk.id}>
          <td><KnowledgeRiskBadge level={risk.level} /><div className={`content-knowledge-risk-status is-${risk.status}`}>{KNOWLEDGE_RISK_STATUS_LABEL[risk.status]}</div></td>
          <td><button className="content-tracelink" onClick={() => onOpenTask(risk.taskId, 1)}>{risk.taskTitle}</button></td>
          <td><span className="content-knowledge-risk-source-badge">{KNOWLEDGE_RISK_SOURCE_LABEL}</span></td>
          <td><b>{risk.issueType}</b><p>{risk.diagnosis}</p></td>
          <td>{risk.occurredAt}</td>
          <td><div className="content-row-actions"><Button size="sm" variant="text" onClick={() => onOpenTask(risk.taskId, 1)}>查看任务</Button>{risk.status === 'pending' && <Button size="sm" onClick={() => onMarkResolved(risk.id)}>标记解决</Button>}</div></td>
        </tr>)}
      </tbody></table></div>
    </section>
  </div>
}
