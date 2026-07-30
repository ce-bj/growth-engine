import { useState } from 'react'
import { useWorkbench } from '../context/WorkbenchContext'
import { contentAssetsData, contentCalendarData, contentTasksData, publicationRecordsData, themePerformanceData } from '../data/contentMock'
import type { ContentAsset, ContentTab, ContentTask, ContentThemePerformance, PublicationRecord } from '../types'
import { ContentAssets } from './content/ContentAssets'
import { ContentCalendar } from './content/ContentCalendar'
import { ContentOverview } from './content/ContentOverview'
import { ContentPerformance } from './content/ContentPerformance'
import { ContentPlan } from './content/ContentPlan'
import { ContentPublishing } from './content/ContentPublishing'
import { ContentTabs } from './content/ContentTabs'
import { ContentWorkbench } from './content/ContentWorkbench'

export function ContentView() {
  const { pushToast } = useWorkbench()
  const [tab, setTab] = useState<ContentTab>('overview')
  const [tasks, setTasks] = useState<ContentTask[]>(contentTasksData)
  const [publications, setPublications] = useState<PublicationRecord[]>(publicationRecordsData)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const activeTask = tasks.find((task) => task.id === activeTaskId)

  const navigate = (next: ContentTab) => { setActiveTaskId(null); setTab(next) }
  const openTask = (id: string) => setActiveTaskId(id)

  const resolveCompliance = (taskId: string) => {
    setTasks((current) => current.map((task) => task.id === taskId ? { ...task, status: 'channel_adaptation', compliance: task.compliance.map((issue) => ({ ...issue, resolved: true })) } : task))
    pushToast('success', '合规建议已应用，内容可以进入渠道适配', true)
  }

  const advanceTask = (taskId: string) => {
    setTasks((current) => current.map((task) => {
      if (task.id !== taskId) return task
      if (task.status === 'needs_material') return { ...task, status: 'ready', missingMaterials: [] }
      if (task.status === 'ready') return { ...task, status: 'generating' }
      if (task.status === 'generating') return { ...task, status: 'quality_review' }
      if (task.status === 'quality_review') return { ...task, status: 'compliance_review' }
      if (task.status === 'channel_adaptation') return { ...task, status: 'pending_approval' }
      return { ...task, status: 'scheduled' }
    }))
    pushToast('success', '任务状态已更新', true)
  }

  const createTask = () => {
    const task: ContentTask = {
      ...contentTasksData[3],
      id: `ct-new-${Date.now()}`,
      title: '新建内容任务：待定义主题',
      status: 'ready',
      reason: '由运营人员手动创建，等待补充任务简报。',
    }
    setTasks((current) => [task, ...current])
    pushToast('success', '已创建新的内容任务', true)
    setActiveTaskId(task.id)
  }

  const createPerformanceTask = (item: ContentThemePerformance) => {
    const source = tasks.find((task) => task.id === item.taskId) ?? contentTasksData[0]
    const task: ContentTask = { ...source, id: `ct-next-${Date.now()}`, title: `${item.theme}：${item.action === 'expand' ? '扩展子主题' : item.action === 'optimize' ? '内容重构' : '内容复核'}`, kind: item.action === 'expand' ? 'expand' : item.action === 'optimize' ? 'optimize' : 'refresh', status: 'ready', priority: 'P2', dueDate: '2026-08-12', reason: item.conclusion, channelVersions: [] }
    setTasks((current) => [task, ...current])
    pushToast('success', '效果建议已加入下一轮内容计划', true)
    navigate('plan')
  }

  const refreshAsset = (asset: ContentAsset) => {
    const source = tasks.find((task) => task.id === asset.taskId)
    if (source) setTasks((current) => [{ ...source, id: `ct-refresh-${Date.now()}`, title: `${asset.title} · 内容更新`, kind: 'refresh', status: 'ready', dueDate: '2026-08-10', reason: '由内容资产库发起更新。' }, ...current])
    pushToast('success', '内容更新任务已加入计划', true)
    navigate('plan')
  }

  const approvePublication = (id: string) => {
    setPublications((current) => current.map((record) => record.id === id ? { ...record, status: 'scheduled', approvedBy: '张敏', scheduledAt: '2026-08-01 09:30', channels: record.channels.map((version) => ({ ...version, status: 'scheduled', scheduledAt: '2026-08-01 09:30' })) } : record))
    pushToast('success', '审批通过，已加入发布排期', true)
  }

  const retryPublication = (id: string) => {
    setPublications((current) => current.map((record) => record.id === id ? { ...record, status: 'published', channels: record.channels.map((version) => version.status === 'failed' ? { ...version, status: 'published', error: undefined, url: 'https://facebook.com/example/retry-success' } : version) } : record))
    pushToast('success', '失败渠道重试成功', true)
  }

  if (activeTask) return <div className="content-view"><ContentWorkbench task={activeTask} onBack={() => setActiveTaskId(null)} onResolveCompliance={resolveCompliance} onAdvance={advanceTask} /></div>

  return <div className="content-view"><ContentTabs active={tab} onChange={navigate} />
    {tab === 'overview' && <ContentOverview tasks={tasks} publications={publications} onNavigate={navigate} onOpenTask={openTask} />}
    {tab === 'plan' && <ContentPlan tasks={tasks} onOpenTask={openTask} onCreate={createTask} />}
    {tab === 'calendar' && <ContentCalendar items={contentCalendarData} onOpenTask={openTask} />}
    {tab === 'assets' && <ContentAssets assets={contentAssetsData} onOpenTask={openTask} onRefresh={refreshAsset} />}
    {tab === 'publishing' && <ContentPublishing records={publications} onApprove={approvePublication} onRetry={retryPublication} />}
    {tab === 'performance' && <ContentPerformance performance={themePerformanceData} onCreateTask={createPerformanceTask} />}
  </div>
}
