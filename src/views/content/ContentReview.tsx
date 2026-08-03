import type { ContentTask } from '../../types'
import { getReviewVerdict, MetricCard, QualityRing, ReviewVerdictBadge, StatusBadge, TYPE_LABEL, ChannelBadge } from './ContentPrimitives'
import { Button } from '../../components/Button'

export function ContentReview({ tasks, onOpenTask }: { tasks: ContentTask[]; onOpenTask: (id: string, step?: number) => void }) {
  const queue = tasks.filter((task) => task.status === 'quality_review' || task.status === 'compliance_review')
  const verdicts = queue.map((task) => ({ task, verdict: getReviewVerdict(task) }))
  const passCount = verdicts.filter((item) => item.verdict === 'pass').length
  const warningCount = verdicts.filter((item) => item.verdict === 'warning').length
  const blockCount = verdicts.filter((item) => item.verdict === 'block').length

  return <div className="content-page-stack">
    <div className="content-toolbar"><div><span className="content-eyebrow">CONTENT REVIEW</span><h2>内容审核</h2><p>汇总当前处于质量与合规审核阶段的内容，按结论分类，点击可跳转到任务工作台处理。</p></div></div>

    <div className="content-metric-grid">
      <MetricCard label="待审核内容" value={queue.length} sub="质量与合规审核中" />
      <MetricCard label="审核通过" value={passCount} sub="可直接进入渠道适配" tone="good" />
      <MetricCard label="有警告" value={warningCount} sub="可确认后继续" tone="warning" />
      <MetricCard label="已拦截" value={blockCount} sub="需先处理阻断项" tone={blockCount ? 'danger' : 'default'} />
    </div>

    <section className="content-table-card">
      <div className="content-panel__head"><div><span className="content-eyebrow">REVIEW QUEUE</span><h3>审核队列</h3><p className="content-panel__desc">结论口径：存在未处理阻断项 → 已拦截；存在未处理高/中风险 → 有警告；否则审核通过。</p></div></div>
      <div className="table-wrap"><table className="content-data-table"><thead><tr><th>内容任务</th><th>类型</th><th>任务状态</th><th>质量分</th><th>结论</th><th>目标渠道</th><th>操作</th></tr></thead><tbody>
        {queue.length === 0 ? <tr><td colSpan={7} className="content-empty-row">当前没有处于审核阶段的内容。</td></tr> : verdicts.map(({ task, verdict }) => <tr key={task.id}>
          <td><b>{task.title}</b><p>{task.theme}</p></td>
          <td>{TYPE_LABEL[task.type]}</td>
          <td><StatusBadge status={task.status} /></td>
          <td><QualityRing score={task.quality.overall} size="sm" /></td>
          <td><ReviewVerdictBadge verdict={verdict} /></td>
          <td><div className="content-plan-item__channels">{task.channels.map((channel) => <ChannelBadge key={channel} channel={channel} />)}</div></td>
          <td><div className="content-row-actions"><Button size="sm" variant="text" onClick={() => onOpenTask(task.id, 4)}>查看详情</Button></div></td>
        </tr>)}
      </tbody></table></div>
    </section>
  </div>
}
