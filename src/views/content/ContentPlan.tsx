import { Filter, Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/Button'
import type { ContentChannel, ContentTask } from '../../types'
import { ChannelBadge, KIND_LABEL, StatusBadge, TYPE_LABEL } from './ContentPrimitives'

export function ContentPlan({ tasks, onOpenTask, onCreate }: { tasks: ContentTask[]; onOpenTask: (id: string) => void; onCreate: () => void }) {
  const [channel, setChannel] = useState<'all' | ContentChannel>('all')
  const [status, setStatus] = useState('all')
  const filtered = tasks.filter((task) => (channel === 'all' || task.channels.includes(channel)) && (status === 'all' || task.status === status))
  const groups = [
    { title: '阶段一 · 核心内容生产', desc: '补齐重点产品、案例和指南内容', tasks: filtered.filter((t) => ['create', 'optimize'].includes(t.kind)) },
    { title: '阶段二 · 渠道适配与发布', desc: '将母稿转换为网站和社媒版本', tasks: filtered.filter((t) => ['repurpose', 'localize'].includes(t.kind)) },
    { title: '阶段三 · 更新与合规维护', desc: '根据效果和有效期持续更新内容', tasks: filtered.filter((t) => ['refresh', 'compliance', 'expand', 'retire'].includes(t.kind)) },
  ]

  return <div className="content-page-stack">
    <div className="content-toolbar"><div><span className="content-eyebrow">MONTHLY PLAN</span><h2>本期内容计划</h2><p>先完成可信母稿，再统一适配网站与社媒渠道。</p></div><Button onClick={onCreate}><Plus size={15} />新建内容任务</Button></div>
    <div className="content-filterbar"><Filter size={15} /><select value={channel} onChange={(e) => setChannel(e.target.value as 'all' | ContentChannel)}><option value="all">全部渠道</option><option value="website">企业网站</option><option value="linkedin">LinkedIn</option><option value="facebook">Facebook</option><option value="x">X / Twitter</option></select><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">全部状态</option><option value="needs_material">待补资料</option><option value="generating">生产中</option><option value="compliance_review">合规审核</option><option value="pending_approval">待审批</option><option value="scheduled">已排期</option><option value="observing">观察中</option></select><span>{filtered.length} 项任务</span></div>
    {groups.map((group) => group.tasks.length > 0 && <section className="content-plan-stage" key={group.title}><div className="content-plan-stage__head"><div><h3>{group.title}</h3><p>{group.desc}</p></div><strong>{group.tasks.length} 项</strong></div><div className="content-plan-list">{group.tasks.map((task) => <article key={task.id} className="content-plan-item"><div className="content-plan-item__top"><span className={`content-priority is-${task.priority.toLowerCase()}`}>{task.priority}</span><span className="content-kind">{KIND_LABEL[task.kind]}</span><StatusBadge status={task.status} /></div><h4>{task.title}</h4><p className="content-plan-item__reason">{task.reason}</p><dl><div><dt>目标访客</dt><dd>{task.audience}</dd></div><div><dt>用户问题</dt><dd>{task.userQuestion}</dd></div><div><dt>内容类型</dt><dd>{TYPE_LABEL[task.type]}</dd></div><div><dt>计划完成</dt><dd>{task.dueDate}</dd></div></dl><div className="content-plan-item__channels">{task.channels.map((item) => <ChannelBadge key={item} channel={item} />)}</div><div className="content-plan-item__foot"><span>主题：{task.theme}</span><Button size="sm" onClick={() => onOpenTask(task.id)}>进入任务</Button></div></article>)}</div></section>)}
  </div>
}
