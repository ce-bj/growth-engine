import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, ShieldAlert } from 'lucide-react'
import { Button } from '../../components/Button'
import type { ContentTab, ContentTask, KnowledgeRiskEvent, PublicationRecord } from '../../types'
import { filterRecentKnowledgeRisks, KnowledgeRiskBadge, MetricCard, StatusBadge } from './ContentPrimitives'

export function ContentOverview({ tasks, publications, knowledgeRisks, onNavigate, onOpenTask, onOpenKnowledgeRiskDetail }: { tasks: ContentTask[]; publications: PublicationRecord[]; knowledgeRisks: KnowledgeRiskEvent[]; onNavigate: (tab: ContentTab) => void; onOpenTask: (id: string, step?: number) => void; onOpenKnowledgeRiskDetail: () => void }) {
  const active = tasks.filter((t) => ['generating', 'quality_review', 'compliance_review', 'channel_adaptation'].includes(t.status)).length
  const approval = tasks.filter((t) => t.status === 'pending_approval').length
  const scheduled = tasks.filter((t) => t.status === 'scheduled').length
  const published = tasks.filter((t) => ['published', 'observing'].includes(t.status)).length
  const failed = publications.filter((p) => p.status === 'failed' || p.status === 'partial').length
  const recentKnowledgeRisks = filterRecentKnowledgeRisks(knowledgeRisks, 7, 5)
  const openKnowledgeRisks = knowledgeRisks.filter((item) => item.status !== 'resolved')

  return <div className="content-page-stack">
    <section className="content-hero">
      <div><span className="content-eyebrow">2026年7月内容周期 · 07/29—08/25</span><h2>把企业知识变成持续发布的高质量内容</h2><p>统一规划网站与社媒内容，从母稿生产、质量合规到多渠道发布和效果复盘。</p></div>
      <div className="content-hero__actions"><Button variant="secondary" onClick={() => onNavigate('calendar')}><CalendarClock size={15} />查看日历</Button><Button onClick={() => onNavigate('plan')}>查看本期计划<ArrowRight size={15} /></Button></div>
    </section>

    <div className="content-metric-grid">
      <MetricCard label="本期计划" value={tasks.length} sub="项内容任务" />
      <MetricCard label="生产中" value={active} sub="母稿与审核" tone="warning" />
      <MetricCard label="待审批" value={approval} sub="组渠道版本" tone={approval ? 'warning' : 'default'} />
      <MetricCard label="待发布" value={scheduled} sub="已进入排期" />
      <MetricCard label="已发布" value={published} sub="本周期完成" tone="good" />
      <MetricCard label="发布异常" value={failed} sub="需要处理" tone={failed ? 'danger' : 'good'} />
    </div>

    <div className="content-overview-grid">
      <section className="content-panel">
        <div className="content-panel__head"><div><span className="content-eyebrow">CONTENT PLAN</span><h3>本期内容计划</h3></div><Button size="sm" variant="text" onClick={() => onNavigate('plan')}>查看全部</Button></div>
        <div className="content-task-compact-list">{tasks.slice(0, 5).map((task) => <button key={task.id} onClick={() => onOpenTask(task.id)}><span className={`content-priority is-${task.priority.toLowerCase()}`}>{task.priority}</span><span className="content-task-compact-list__body"><b>{task.title}</b><small>{task.theme} · {task.dueDate}</small></span><StatusBadge status={task.status} /></button>)}</div>
      </section>

      <section className="content-panel">
        <div className="content-panel__head"><div><span className="content-eyebrow">ACTION REQUIRED</span><h3>待处理事项</h3></div></div>
        <div className="content-alert-list">
          <button onClick={() => onOpenTask('ct-002')}><ShieldAlert size={17} /><span><b>客户案例存在发布阻断</b><small>客户授权和结果数据尚未补齐</small></span><em>立即处理</em></button>
          <button onClick={() => onOpenTask('ct-001')}><AlertTriangle size={17} /><span><b>2 项合规风险待确认</b><small>效果数据来源与绝对化表达</small></span><em>查看审核</em></button>
          <button onClick={() => onNavigate('publishing')}><AlertTriangle size={17} /><span><b>Facebook 发布失败</b><small>平台授权失效，可重新连接后重试</small></span><em>处理发布</em></button>
          <button onClick={() => onOpenTask('ct-006')}><CheckCircle2 size={17} /><span><b>安全说明已通过审核</b><small>将在 07/31 18:00 更新网站</small></span><em>查看排期</em></button>
        </div>
      </section>

      <section className="content-panel">
        <div className="content-panel__head"><div><span className="content-eyebrow">RAG RISK TRACE</span><h3>知识库调用风险样本</h3></div><div className="content-panel__head-actions"><span className="content-risk-summary has-risk">{openKnowledgeRisks.length} 条待处理</span><Button size="sm" variant="text" onClick={onOpenKnowledgeRiskDetail}>查看详情</Button></div></div>
        <p className="content-panel__desc">生产过程中调用知识库出现 RAG no-hit（未命中知识库），展示最近 7 天内最多 5 条，点击可直接跳转到对应任务定位问题。</p>
        <div className="content-knowledge-risk-compact-list">{recentKnowledgeRisks.length === 0 ? <p className="muted">最近 7 天没有知识库调用风险。</p> : recentKnowledgeRisks.map((risk) => <button key={risk.id} onClick={() => onOpenTask(risk.taskId, 1)}><KnowledgeRiskBadge level={risk.level} /><span className="content-knowledge-risk-compact-list__body"><b>{risk.issueType}</b><small>{risk.taskTitle} · {risk.occurredAt}</small></span><em>{risk.status === 'resolved' ? '已解决' : '查看任务'}</em></button>)}</div>
      </section>
    </div>

    <section className="content-panel">
      <div className="content-panel__head"><div><span className="content-eyebrow">MULTI-CHANNEL PERFORMANCE</span><h3>多渠道内容表现</h3></div><Button size="sm" variant="text" onClick={() => onNavigate('performance')}>查看效果分析</Button></div>
      <div className="content-channel-performance">
        <div><b>企业网站</b><strong>46%</strong><span>有效阅读率</span><i style={{ width: '46%' }} /></div>
        <div><b>LinkedIn</b><strong>8.2K</strong><span>曝光 · 互动率 5.1%</span><i style={{ width: '78%' }} /></div>
        <div><b>Facebook</b><strong>4.3K</strong><span>曝光 · 互动率 3.4%</span><i style={{ width: '48%' }} /></div>
        <div><b>X / Twitter</b><strong>2.8K</strong><span>曝光 · 互动率 2.9%</span><i style={{ width: '34%' }} /></div>
      </div>
      <div className="content-ai-insight"><span>AI 建议</span><p>“工业机器人选型”主题在网站和 LinkedIn 表现最好，建议继续生产“负载选择”和“工作半径选择”两个子主题。</p><Button size="sm" onClick={() => onNavigate('performance')}>查看并加入计划</Button></div>
    </section>
  </div>
}
