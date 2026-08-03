import { Filter, Lightbulb, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/Button'
import type { ContentChannel, ContentOpportunity, ContentPlanItem, ContentTask, PlanItemStatus } from '../../types'
import { OPPORTUNITY_SOURCE_LABELS } from '../../types'
import { ChannelBadge, KIND_LABEL, OriginBadge, StatusBadge, TYPE_LABEL } from './ContentPrimitives'

const PLAN_ITEM_STATUS_LABEL: Record<PlanItemStatus, string> = {
  proposed: '待确认', accepted: '待转入生产', promoted: '已转入生产', dropped: '已放弃',
}

export function ContentPlan({ tasks, opportunities, planItems, onOpenTask, onCreate, onAdoptOpportunity, onDismissOpportunity, onPromoteToTask, onDropPlanItem }: {
  tasks: ContentTask[]
  opportunities: ContentOpportunity[]
  planItems: ContentPlanItem[]
  onOpenTask: (id: string) => void
  onCreate: () => void
  onAdoptOpportunity: (id: string) => void
  onDismissOpportunity: (id: string) => void
  onPromoteToTask: (planItemId: string) => void
  onDropPlanItem: (id: string) => void
}) {
  const [channel, setChannel] = useState<'all' | ContentChannel>('all')
  const [status, setStatus] = useState('all')
  const filtered = tasks.filter((task) => (channel === 'all' || task.channels.includes(channel)) && (status === 'all' || task.status === status))
  const groups = [
    { title: '阶段一 · 核心内容生产', desc: '补齐重点产品、案例和指南内容', tasks: filtered.filter((t) => ['create', 'optimize'].includes(t.kind)) },
    { title: '阶段二 · 渠道适配与发布', desc: '将内容概览转换为网站和社媒版本', tasks: filtered.filter((t) => ['repurpose', 'localize'].includes(t.kind)) },
    { title: '阶段三 · 更新与合规维护', desc: '根据效果和有效期持续更新内容', tasks: filtered.filter((t) => ['refresh', 'compliance', 'expand', 'retire'].includes(t.kind)) },
  ]
  const openOpportunities = opportunities.filter((item) => item.status === 'open')
  const activePlanItems = planItems.filter((item) => item.status === 'proposed' || item.status === 'accepted')

  return <div className="content-page-stack">
    <section className="content-plan-stage content-insight-stage">
      <div className="content-plan-stage__head"><div><span className="content-eyebrow">CONTENT INSIGHT</span><h3>内容洞察</h3><p>来自内容盘点、阅读/社媒表现、业务重点等信号，尚未采纳前不占用生产资源。</p></div><strong>{openOpportunities.length} 条</strong></div>
      {openOpportunities.length ? <div className="content-opportunity-list">{openOpportunities.map((item) => <article key={item.id} className="content-opportunity-card"><div className="content-opportunity-card__top"><Lightbulb size={15} /><span className="content-opportunity-source">{OPPORTUNITY_SOURCE_LABELS[item.source]}</span><span className={`content-priority is-${item.suggestedPriority.toLowerCase()}`}>{item.suggestedPriority}</span></div><h4>{item.suggestedTitle}</h4><p className="content-plan-item__reason">{item.evidence}</p><div className="content-plan-item__channels">{item.suggestedChannels.map((ch) => <ChannelBadge key={ch} channel={ch} />)}</div><div className="content-plan-item__foot"><span>主题：{item.suggestedTheme}</span><div><Button size="sm" variant="secondary" onClick={() => onDismissOpportunity(item.id)}><X size={13} />忽略</Button><Button size="sm" onClick={() => onAdoptOpportunity(item.id)}>采纳为计划项</Button></div></div></article>)}</div> : <p className="muted">暂无新的内容洞察。</p>}
    </section>

    <section className="content-plan-stage content-planitem-stage">
      <div className="content-plan-stage__head"><div><span className="content-eyebrow">THIS PERIOD PLAN</span><h3>本期计划项</h3><p>已采纳但尚未转入生产，可随时放弃而不产生内容任务。</p></div><strong>{activePlanItems.length} 项</strong></div>
      {activePlanItems.length ? <div className="content-plan-list">{activePlanItems.map((item) => <article key={item.id} className="content-plan-item"><div className="content-plan-item__top"><span className={`content-priority is-${item.priority.toLowerCase()}`}>{item.priority}</span><span className="content-kind">{KIND_LABEL[item.kind]}</span><span className={`content-planitem-status is-${item.status}`}>{PLAN_ITEM_STATUS_LABEL[item.status]}</span></div><h4>{item.title}</h4><p className="content-plan-item__reason">{item.reason}</p><dl><div><dt>目标受众</dt><dd>{item.audience}</dd></div><div><dt>内容类型</dt><dd>{TYPE_LABEL[item.type]}</dd></div><div><dt>计划完成</dt><dd>{item.dueDate}</dd></div></dl><div className="content-plan-item__channels">{item.channels.map((ch) => <ChannelBadge key={ch} channel={ch} />)}</div><div className="content-plan-item__foot"><span>主题：{item.theme}</span><div><Button size="sm" variant="secondary" onClick={() => onDropPlanItem(item.id)}>放弃</Button><Button size="sm" onClick={() => onPromoteToTask(item.id)}>转入生产</Button></div></div></article>)}</div> : <p className="muted">暂无待处理的计划项。</p>}
    </section>

    <section className="content-plan-stage content-production-stage">
      <div className="content-toolbar"><div><span className="content-eyebrow">IN PRODUCTION</span><h2>生产中 / 已完成任务</h2><p>已转入生产的内容任务，按生产阶段分组展示。</p></div><Button onClick={onCreate}><Plus size={15} />手动新建任务</Button></div>
      <div className="content-filterbar"><Filter size={15} /><select value={channel} onChange={(e) => setChannel(e.target.value as 'all' | ContentChannel)}><option value="all">全部渠道</option><option value="website">企业网站</option><option value="linkedin">LinkedIn</option><option value="facebook">Facebook</option><option value="x">X / Twitter</option></select><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">全部状态</option><option value="needs_material">待补资料</option><option value="channel_setup">渠道配置</option><option value="generating">生产中</option><option value="compliance_review">合规审核</option><option value="pending_approval">待审批</option><option value="scheduled">已排期</option><option value="observing">观察中</option></select><span>{filtered.length} 项任务</span></div>
      {groups.map((group) => group.tasks.length > 0 && <section className="content-plan-stage" key={group.title}><div className="content-plan-stage__head"><div><h3>{group.title}</h3><p>{group.desc}</p></div><strong>{group.tasks.length} 项</strong></div><div className="content-plan-list">{group.tasks.map((task) => <article key={task.id} className="content-plan-item"><div className="content-plan-item__top"><span className={`content-priority is-${task.priority.toLowerCase()}`}>{task.priority}</span><span className="content-kind">{KIND_LABEL[task.kind]}</span>{task.origin && <OriginBadge source={task.origin.source} />}<StatusBadge status={task.status} /></div><h4>{task.title}</h4><p className="content-plan-item__reason">{task.reason}</p><dl><div><dt>目标访客</dt><dd>{task.audience}</dd></div><div><dt>用户问题</dt><dd>{task.userQuestion}</dd></div><div><dt>内容类型</dt><dd>{TYPE_LABEL[task.type]}</dd></div><div><dt>计划完成</dt><dd>{task.dueDate}</dd></div></dl><div className="content-plan-item__channels">{task.channels.map((item) => <ChannelBadge key={item} channel={item} />)}</div><div className="content-plan-item__foot"><span>主题：{task.theme}</span><Button size="sm" onClick={() => onOpenTask(task.id)}>进入任务</Button></div></article>)}</div></section>)}
    </section>
  </div>
}
