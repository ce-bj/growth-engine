import { Languages, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '../../components/Button'
import type { ContentChannel, ContentTab, ContentTask } from '../../types'
import { CHANNEL_META, ChannelBadge, CONTENT_STEPS, ContentStepBar, getTaskStep, isPublishedStatus, KIND_LABEL, MetricCard, OriginBadge, QualityRing, StatusBadge, STATUS_LABEL, TYPE_LABEL } from './ContentPrimitives'

/** 每个阶段对应的下一步入口：未发布内容在操作栏直接跳到该处理页面 */
function nextAction(step: number): { label: string; target: 'workbench' | ContentTab; workbenchStep?: number; hint: string } {
  switch (step) {
    case 0: return { label: '完善简报', target: 'workbench', workbenchStep: 0, hint: '任务已创建，待确认简报' }
    case 1: return { label: '补充资料', target: 'workbench', workbenchStep: 1, hint: '知识库资料尚未补齐' }
    case 2: return { label: '进入生产', target: 'workbench', workbenchStep: 2, hint: '等待生成或完善母稿' }
    case 3: return { label: '去审核', target: 'review', hint: '在内容审核页处理质量与合规' }
    case 4: return { label: '查看审核', target: 'workbench', workbenchStep: 4, hint: '处理内容质量与合规结论' }
    case 5: return { label: '预览内容', target: 'workbench', workbenchStep: 5, hint: '逐渠道确认最终呈现' }
    case 6: return { label: '去发布', target: 'publishing', hint: '在发布管理页审批与排期' }
    default: return { label: '查看效果', target: 'performance', hint: '内容已发布，可查看多渠道表现' }
  }
}

export function ContentLibrary({ tasks, onOpenTask, onNavigate, onCreate, onOpenGlossary, onOpenPerformanceDetail }: {
  tasks: ContentTask[]
  onOpenTask: (id: string, step?: number) => void
  onNavigate: (tab: ContentTab) => void
  onCreate: () => void
  onOpenGlossary: () => void
  onOpenPerformanceDetail: (taskId: string) => void
}) {
  const [keyword, setKeyword] = useState('')
  const [step, setStep] = useState<'all' | number>('all')
  const [status, setStatus] = useState('all')
  const [channel, setChannel] = useState<'all' | ContentChannel>('all')
  const [publishState, setPublishState] = useState<'all' | 'published' | 'unpublished'>('all')

  const rows = useMemo(() => tasks.map((task) => ({ task, step: getTaskStep(task.status), published: isPublishedStatus(task.status) })), [tasks])

  const filtered = rows.filter(({ task, step: taskStep, published }) => {
    const query = keyword.trim().toLowerCase()
    return (step === 'all' || taskStep === step)
      && (status === 'all' || task.status === status)
      && (channel === 'all' || task.channels.includes(channel))
      && (publishState === 'all' || (publishState === 'published' ? published : !published))
      && (!query || [task.title, task.theme, task.audience].some((value) => value.toLowerCase().includes(query)))
  })

  const producing = rows.filter((row) => row.step >= 1 && row.step <= 3).length
  const reviewing = rows.filter((row) => row.step === 4 || row.step === 5).length
  const waitingPublish = rows.filter((row) => row.step === 6).length
  const publishedCount = rows.filter((row) => row.published).length
  const blocked = rows.filter((row) => row.task.compliance.some((issue) => !issue.resolved && issue.level === 'blocking')).length

  return <div className="content-page-stack">
    <div className="content-toolbar">
      <div><span className="content-eyebrow">CONTENT LIBRARY</span><h2>内容管理</h2><p>一张表看清每条内容生产到了哪一步：已发布的直接看效果，未发布的从操作栏进入对应处理页面。</p></div>
      <div className="content-toolbar__actions">
        <Button variant="secondary" onClick={onOpenGlossary}><Languages size={15} />术语与翻译</Button>
        <Button onClick={onCreate}><Plus size={15} />新建内容任务</Button>
      </div>
    </div>

    <div className="content-metric-grid">
      <MetricCard label="全部内容" value={rows.length} sub="本期在管内容任务" />
      <MetricCard label="生产中" value={producing} sub="资料与内容生成阶段" tone={producing ? 'warning' : 'default'} />
      <MetricCard label="审核与预览" value={reviewing} sub="质量合规 / 渠道预览" tone={reviewing ? 'warning' : 'default'} />
      <MetricCard label="待发布" value={waitingPublish} sub="审批与排期阶段" />
      <MetricCard label="已发布" value={publishedCount} sub="可查看多渠道效果" tone="good" />
      <MetricCard label="阻断项" value={blocked} sub="需先处理后才能发布" tone={blocked ? 'danger' : 'good'} />
    </div>

    <section className="content-table-card">
      <div className="content-panel__head"><div><span className="content-eyebrow">PRODUCTION PIPELINE</span><h3>内容生产台账</h3><p className="content-panel__desc">流程：{CONTENT_STEPS.map((name, index) => `${index + 1} ${name}`).join(' → ')}</p></div></div>

      <div className="content-filterbar">
        <span className="content-search"><Search size={14} /><input className="form-input" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="内容标题 / 主题 / 受众" /></span>
        <select value={step} onChange={(e) => setStep(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
          <option value="all">全部步骤</option>
          {CONTENT_STEPS.map((name, index) => <option key={name} value={index}>{index + 1}. {name}</option>)}
          <option value={6}>已完成发布</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">全部状态</option>
          {Object.entries(STATUS_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <select value={channel} onChange={(e) => setChannel(e.target.value as 'all' | ContentChannel)}>
          <option value="all">全部渠道</option>
          {(Object.keys(CHANNEL_META) as ContentChannel[]).map((item) => <option key={item} value={item}>{CHANNEL_META[item].label}</option>)}
        </select>
        <select value={publishState} onChange={(e) => setPublishState(e.target.value as 'all' | 'published' | 'unpublished')}>
          <option value="all">发布状态不限</option>
          <option value="unpublished">未发布</option>
          <option value="published">已发布</option>
        </select>
        <span>{filtered.length} 项结果</span>
      </div>

      <div className="table-wrap"><table className="content-data-table content-library-table"><thead><tr>
        <th>内容任务</th><th>类型</th><th>生产进度</th><th>状态</th><th>渠道</th><th>质量 / 效果</th><th>操作</th>
      </tr></thead><tbody>
        {filtered.length === 0 ? <tr><td colSpan={7} className="content-empty-row">当前筛选条件下没有内容任务。</td></tr> : filtered.map(({ task, step: taskStep, published }) => {
          const action = nextAction(taskStep)
          return <tr key={task.id}>
            <td>
              <div className="content-library-title"><span className={`content-priority is-${task.priority.toLowerCase()}`}>{task.priority}</span><b>{task.title}</b>{task.origin && <OriginBadge source={task.origin.source} />}</div>
              <span>{task.theme} · {task.audience} · 计划 {task.dueDate}</span>
              {task.locales?.length ? <div className="content-locale-tags">{task.locales.map((code) => <em key={code}>{code.toUpperCase()} 站</em>)}</div> : null}
            </td>
            <td><b>{TYPE_LABEL[task.type]}</b><span>{KIND_LABEL[task.kind]}</span></td>
            <td><ContentStepBar step={taskStep} /><span className="content-library-hint">{action.hint}</span></td>
            <td><StatusBadge status={task.status} /></td>
            <td><div className="content-channel-cell">{task.channels.map((item) => <ChannelBadge key={item} channel={item} />)}</div></td>
            <td>{published
              ? <><b>已发布</b><span>点击右侧查看多渠道效果</span></>
              : <QualityRing score={task.quality.overall} size="sm" />}</td>
            <td><div className="content-row-actions">
              {published
                ? <Button size="sm" onClick={() => onOpenPerformanceDetail(task.id)}>查看效果</Button>
                : <Button size="sm" onClick={() => action.target === 'workbench' ? onOpenTask(task.id, action.workbenchStep) : onNavigate(action.target as ContentTab)}>{action.label}</Button>}
              <Button size="sm" variant="text" onClick={() => onOpenTask(task.id)}>进入任务</Button>
            </div></td>
          </tr>
        })}
      </tbody></table></div>
    </section>
  </div>
}
