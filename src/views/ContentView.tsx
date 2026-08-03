import { useState } from 'react'
import { useWorkbench } from '../context/WorkbenchContext'
import { contentAssetsData, contentCalendarData, contentLocalesData, contentPublishStatsData, contentTasksData, glossaryTermsData, knowledgeRiskEventsData, publicationRecordsData, themePerformanceData, weeklyPerformanceData } from '../data/contentMock'
import type { ChannelVersion, ContentAsset, ContentChannel, ContentTab, ContentTask, ContentThemePerformance, GlossaryTerm, KnowledgeRiskEvent, PublicationRecord, PublishSettings } from '../types'
import { ContentAssets } from './content/ContentAssets'
import { ContentCalendar } from './content/ContentCalendar'
import { ContentCreateDrawer, type ContentCreatePayload } from './content/ContentCreateDrawer'
import { ContentGlossary } from './content/ContentGlossary'
import { ContentKnowledgeRiskDetail } from './content/ContentKnowledgeRiskDetail'
import { ContentLibrary } from './content/ContentLibrary'
import { CHANNEL_META, getGlossaryStatus } from './content/ContentPrimitives'
import { ContentOverview } from './content/ContentOverview'
import { ContentPerformance } from './content/ContentPerformance'
import { ContentPerformanceDetail } from './content/ContentPerformanceDetail'
import { ContentPlan } from './content/ContentPlan'
import { ContentPublishing } from './content/ContentPublishing'
import { ContentPublishSettingsDialog } from './content/ContentPublishSettingsDialog'
import { ContentReview } from './content/ContentReview'
import { ContentTabs } from './content/ContentTabs'
import { ContentWorkbench } from './content/ContentWorkbench'

const QUALITY_MAX = { relevance: 20, accuracy: 20, completeness: 20, readability: 15, authenticity: 15, channelFit: 10 } as const
const PRIORITY_MULTIPLIER = { P0: 0.92, P1: 0.85, P2: 0.78 } as const

export function ContentView() {
  const { pushToast } = useWorkbench()
  const [tab, setTab] = useState<ContentTab>('overview')
  const [tasks, setTasks] = useState<ContentTask[]>(contentTasksData)
  const [publications, setPublications] = useState<PublicationRecord[]>(publicationRecordsData)
  const [knowledgeRisks, setKnowledgeRisks] = useState<KnowledgeRiskEvent[]>(knowledgeRiskEventsData)
  const [glossaryTerms, setGlossaryTerms] = useState<GlossaryTerm[]>(glossaryTermsData)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [workbenchStep, setWorkbenchStep] = useState<number | undefined>(undefined)
  const [knowledgeRiskDetailOpen, setKnowledgeRiskDetailOpen] = useState(false)
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)
  const [glossaryState, setGlossaryState] = useState<{ open: boolean; highlight: string[] }>({ open: false, highlight: [] })
  const [publishSettingsOpen, setPublishSettingsOpen] = useState(false)
  const [performanceStatId, setPerformanceStatId] = useState<string | null>(null)
  const activeTask = tasks.find((task) => task.id === activeTaskId)
  const performanceStat = contentPublishStatsData.find((stat) => stat.id === performanceStatId)

  const navigate = (next: ContentTab) => { setActiveTaskId(null); setPerformanceStatId(null); setPublishSettingsOpen(false); setTab(next) }
  const openTask = (id: string, step?: number) => { setKnowledgeRiskDetailOpen(false); setPerformanceStatId(null); setActiveTaskId(id); setWorkbenchStep(step) }
  const openGlossary = (highlight: string[] = []) => setGlossaryState({ open: true, highlight })
  const openPerformanceDetail = (taskId: string) => {
    const stat = contentPublishStatsData.find((item) => item.taskId === taskId)
    if (!stat) { pushToast('warning', '该内容尚未产生发布效果数据', true); return }
    setActiveTaskId(null)
    setPerformanceStatId(stat.id)
    setTab('performance')
  }

  const updateTranslation = (termId: string, localeCode: string, value: string) => {
    setGlossaryTerms((current) => current.map((term) => term.id === termId ? { ...term, translations: { ...term.translations, [localeCode]: value } } : term))
  }

  const savePublishSettings = (settings: PublishSettings) => {
    setPublishSettingsOpen(false)
    pushToast('success', `发布设置已保存：${settings.contentIds.length} 项内容 · ${settings.channels.length} 个渠道 · ${settings.mode === 'immediate' ? '审批后立即发布' : `定时 ${settings.scheduledAt.replace('T', ' ')}`}`, true)
  }

  const markKnowledgeRiskResolved = (id: string) => {
    setKnowledgeRisks((current) => current.map((item) => item.id === id ? { ...item, status: 'resolved' } : item))
    pushToast('success', '风险已标记为已解决', true)
  }


  const submitNewTask = (payload: ContentCreatePayload) => {
    const id = `ct-new-${Date.now()}`
    const task: ContentTask = {
      id, title: payload.title, kind: payload.kind, type: payload.type, priority: payload.priority,
      status: 'ready',
      theme: payload.theme, audience: payload.audience, userQuestion: '', channels: payload.channels,
      dueDate: payload.dueDate, reason: payload.reason, outline: [], masterDraft: '', knowledge: [],
      missingMaterials: [],
      quality: { overall: 0, relevance: 0, accuracy: 0, completeness: 0, readability: 0, authenticity: 0, channelFit: 0 },
      compliance: [], channelVersions: [],
    }
    setTasks((current) => [task, ...current])
    setCreateDrawerOpen(false)
    pushToast('success', '已创建内容任务', true)
    openTask(id, 0)
  }

  const resolveMaterials = (taskId: string) => {
    setTasks((current) => current.map((task) => task.id === taskId ? { ...task, status: 'ready', missingMaterials: [] } : task))
    pushToast('success', '资料已补充完整，可以开始生产', true)
  }

  const generateDraft = (taskId: string) => {
    setTasks((current) => current.map((task) => {
      if (task.id !== taskId) return task
      const userQuestion = task.userQuestion || `${task.audience}在${task.theme}上最关心什么？`
      const outline = task.outline.length ? task.outline : [
        `${task.theme}：核心问题与决策要点`,
        `${task.theme}：关键参数与对比`,
        '常见误区与避坑建议',
        '总结与下一步行动',
      ]
      const masterDraft = task.masterDraft || outline.map((section) => `${section}\n\n围绕"${userQuestion}"，面向${task.audience}，结合企业知识库中的产品资料与行业数据，给出可验证、可落地的结论。`).join('\n\n')
      const multiplier = PRIORITY_MULTIPLIER[task.priority]
      const subScores = Object.fromEntries(Object.entries(QUALITY_MAX).map(([key, max]) => [key, Math.round(max * multiplier)])) as Record<keyof typeof QUALITY_MAX, number>
      const overall = Object.values(subScores).reduce((sum, value) => sum + value, 0)
      return { ...task, userQuestion, outline, masterDraft, quality: { overall, ...subScores }, status: 'quality_review' }
    }))
    pushToast('success', '母稿已生成，进入质量与合规审核', true)
  }

  /** 补全知识库与术语库后重新生成母稿：重新计算缺口，如实反馈仍未补齐的部分 */
  const regenerateDraft = (taskId: string) => {
    const task = tasks.find((item) => item.id === taskId)
    if (!task) return
    const taskLocales = contentLocalesData.filter((locale) => task.locales?.includes(locale.code))
    const remainingTerms = (task.missingTerms ?? []).filter((name) => {
      const term = glossaryTerms.find((item) => item.term === name)
      return !term || getGlossaryStatus(term, taskLocales) !== 'ready'
    })
    const openRisks = knowledgeRisks.filter((item) => item.taskId === taskId && item.status !== 'resolved')
    setTasks((current) => current.map((item) => item.id !== taskId ? item : {
      ...item,
      missingTerms: remainingTerms,
      masterDraft: item.outline.length
        ? item.outline.map((section) => `${section}\n\n（已按最新知识库与术语库重新生成）围绕"${item.userQuestion || item.theme}"，面向${item.audience}，结合已验证的产品资料、行业数据与术语译名给出结论。`).join('\n\n')
        : item.masterDraft,
    }))
    if (remainingTerms.length || openRisks.length) {
      pushToast('warning', `母稿已重新生成，但仍有 ${openRisks.length} 处知识库未命中、${remainingTerms.length} 个术语缺少译名`, true)
    } else {
      pushToast('success', '知识缺口已补齐，母稿已基于最新知识库重新生成', true)
    }
  }

  const resolveCompliance = (taskId: string) => {    setTasks((current) => current.map((task) => task.id === taskId ? { ...task, status: 'channel_adaptation', compliance: task.compliance.map((issue) => ({ ...issue, resolved: true })) } : task))
    pushToast('success', '合规建议已应用，内容可以进入渠道适配', true)
  }

  const ignoreWarningsAndProceed = (taskId: string) => {
    setTasks((current) => current.map((task) => task.id === taskId ? { ...task, status: 'channel_adaptation' } : task))
    pushToast('success', '已确认审核结论，进入渠道适配', true)
  }

  const generateChannelVersion = (taskId: string, channel: ContentChannel) => {
    setTasks((current) => current.map((task) => {
      if (task.id !== taskId || task.channelVersions.some((version) => version.channel === channel)) return task
      const version: ChannelVersion = {
        channel, title: task.title,
        body: task.masterDraft ? task.masterDraft.split('\n\n')[0] : `${task.theme}：${task.userQuestion}`,
        account: `${CHANNEL_META[channel].label} · 企业官方账号`, status: 'ready',
      }
      return { ...task, channelVersions: [...task.channelVersions, version] }
    }))
    pushToast('success', `已生成 ${CHANNEL_META[channel].label} 渠道版本`, true)
  }

  const updateChannelVersion = (taskId: string, channel: ContentChannel, patch: Partial<Pick<ChannelVersion, 'title' | 'body'>>) => {
    setTasks((current) => current.map((task) => task.id !== taskId ? task : { ...task, channelVersions: task.channelVersions.map((version) => version.channel === channel ? { ...version, ...patch } : version) }))
  }

  const submitForApproval = (taskId: string) => {
    setTasks((current) => current.map((task) => task.id === taskId ? { ...task, status: 'pending_approval' } : task))
    pushToast('success', '已提交审批', true)
  }

  const approveAndSchedule = (taskId: string, scheduledAt: string) => {
    const task = tasks.find((item) => item.id === taskId)
    if (!task) return
    setTasks((current) => current.map((item) => item.id === taskId ? { ...item, status: 'scheduled' } : item))
    setPublications((current) => {
      const channels = task.channelVersions.map((version) => ({ ...version, status: 'scheduled' as const, scheduledAt }))
      const record: PublicationRecord = { id: current.find((item) => item.taskId === taskId)?.id ?? `pr-${taskId}`, taskId, title: task.title, status: 'scheduled', approvedBy: '张敏', scheduledAt, channels }
      return current.some((item) => item.taskId === taskId) ? current.map((item) => item.taskId === taskId ? record : item) : [record, ...current]
    })
    pushToast('success', '审批通过，已加入发布排期', true)
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

  const glossaryDrawer = glossaryState.open && <ContentGlossary terms={glossaryTerms} locales={contentLocalesData} highlightTerms={glossaryState.highlight} onClose={() => setGlossaryState({ open: false, highlight: [] })} onUpdateTranslation={updateTranslation} onSyncKnowledge={() => pushToast('success', '术语与译名已同步到企业知识库', true)} />

  if (activeTask) return <div className="content-view"><ContentWorkbench task={activeTask} initialStep={workbenchStep} knowledgeRisks={knowledgeRisks} locales={contentLocalesData} glossaryTerms={glossaryTerms} onBack={() => { setActiveTaskId(null); setWorkbenchStep(undefined) }} onResolveMaterials={resolveMaterials} onGenerateDraft={generateDraft} onRegenerateDraft={regenerateDraft} onResolveCompliance={resolveCompliance} onIgnoreWarnings={ignoreWarningsAndProceed} onGenerateChannel={generateChannelVersion} onUpdateChannelVersion={updateChannelVersion} onSubmitApproval={submitForApproval} onApprove={approveAndSchedule} onOpenGlossary={openGlossary} onOpenKnowledgeRisks={() => { setActiveTaskId(null); setKnowledgeRiskDetailOpen(true) }} />{glossaryDrawer}</div>

  if (knowledgeRiskDetailOpen) return <div className="content-view"><ContentKnowledgeRiskDetail risks={knowledgeRisks} onBack={() => setKnowledgeRiskDetailOpen(false)} onOpenTask={openTask} onMarkResolved={markKnowledgeRiskResolved} /></div>

  return <div className="content-view"><ContentTabs active={tab} onChange={navigate} />
    {tab === 'overview' && <ContentOverview tasks={tasks} publications={publications} knowledgeRisks={knowledgeRisks} onNavigate={navigate} onOpenTask={openTask} onOpenKnowledgeRiskDetail={() => setKnowledgeRiskDetailOpen(true)} />}
    {tab === 'library' && <ContentLibrary tasks={tasks} onOpenTask={openTask} onNavigate={navigate} onCreate={() => setCreateDrawerOpen(true)} onOpenGlossary={() => openGlossary()} onOpenPerformanceDetail={openPerformanceDetail} />}
    {tab === 'plan' && <ContentPlan tasks={tasks} onOpenTask={openTask} onCreate={() => setCreateDrawerOpen(true)} />}
    {tab === 'review' && <ContentReview tasks={tasks} onOpenTask={openTask} />}
    {tab === 'calendar' && <ContentCalendar items={contentCalendarData} onOpenTask={openTask} />}
    {tab === 'assets' && <ContentAssets assets={contentAssetsData} onOpenTask={openTask} onRefresh={refreshAsset} />}
    {tab === 'publishing' && <ContentPublishing records={publications} onApprove={approvePublication} onRetry={retryPublication} onOpenSettings={() => setPublishSettingsOpen(true)} />}
    {tab === 'performance' && (performanceStat
      ? <ContentPerformanceDetail stat={performanceStat} onBack={() => setPerformanceStatId(null)} onOpenTask={openTask} />
      : <ContentPerformance performance={themePerformanceData} weeks={weeklyPerformanceData} publishStats={contentPublishStatsData} onCreateTask={createPerformanceTask} onOpenDetail={setPerformanceStatId} />)}
    {createDrawerOpen && <ContentCreateDrawer onClose={() => setCreateDrawerOpen(false)} onSubmit={submitNewTask} />}
    {publishSettingsOpen && <ContentPublishSettingsDialog tasks={tasks} locales={contentLocalesData} onClose={() => setPublishSettingsOpen(false)} onSave={savePublishSettings} />}
    {glossaryDrawer}
  </div>
}
