import { useEffect, useState } from 'react'
import { useWorkbench } from '../context/WorkbenchContext'
import { contentAssetsData, contentCalendarData, contentLocalesData, contentPublishStatsData, contentTasksData, glossaryTermsData, knowledgeRiskEventsData, publicationRecordsData, themePerformanceData, weeklyPerformanceData } from '../data/contentMock'
import type { ChannelProfile, ChannelVersion, ContentAsset, ContentChannel, ContentOpportunity, ContentPlanItem, ContentSeriesPlan, ContentTab, ContentTask, ContentThemePerformance, GlossaryTerm, KnowledgeRiskEvent, MaterialBudgetItem, PublicationRecord, PublishSettings } from '../types'
import { ContentAssets } from './content/ContentAssets'
import { ContentCalendar } from './content/ContentCalendar'
import { ContentCreateDrawer, type ContentCreateBatchPayload, type ContentCreatePayload } from './content/ContentCreateDrawer'
import { ContentGlossary } from './content/ContentGlossary'
import { ContentKnowledgeRiskDetail } from './content/ContentKnowledgeRiskDetail'
import { ContentLibrary } from './content/ContentLibrary'
import { CHANNEL_META, getGlossaryStatus } from './content/ContentPrimitives'
import { deriveMaterialBudget } from '../lib/materialBudget'
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
  const {
    pushToast,
    contentTasks,
    setContentTasks,
    contentOpportunities,
    setContentOpportunities,
    contentPlanItems,
    setContentPlanItems,
    pendingContentTaskOpen,
    clearPendingContentTaskOpen,
  } = useWorkbench()
  const [tab, setTab] = useState<ContentTab>('overview')
  const tasks = contentTasks
  const opportunities = contentOpportunities
  const planItems = contentPlanItems
  const [publications, setPublications] = useState<PublicationRecord[]>(publicationRecordsData)
  const [assets, setAssets] = useState<ContentAsset[]>(contentAssetsData)
  const [seriesPlans, setSeriesPlans] = useState<ContentSeriesPlan[]>([])
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
  const openTask = (id: string, step?: number) => {
    setKnowledgeRiskDetailOpen(false)
    setPerformanceStatId(null)
    setActiveTaskId(id)
    // 演示样例始终从第一步进入，方便按“下一步”完整讲解流程。
    setWorkbenchStep(id === 'ct-001' ? 0 : step)
  }

  // 归因措施「在内容运营查看」深链：打开对应任务工作台第 0 步任务说明
  useEffect(() => {
    if (!pendingContentTaskOpen) return
    const { taskId, step } = pendingContentTaskOpen
    if (!tasks.some((t) => t.id === taskId)) return
    openTask(taskId, step)
    clearPendingContentTaskOpen()
  }, [pendingContentTaskOpen, tasks, clearPendingContentTaskOpen])
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


  const buildTask = (payload: ContentCreatePayload, id: string, parentPlanId?: string, occurrenceIndex?: number): ContentTask => ({
      id, title: payload.title, kind: payload.kind, type: payload.type, priority: payload.priority,
      status: 'ready',
      theme: payload.theme, contentSubject: payload.contentSubject, knowledgeScopes: payload.knowledgeScopes,
      audience: payload.audience, userQuestion: payload.userQuestion ?? '', channels: payload.channels, locales: payload.locales,
      businessGoal: payload.businessGoal, successMetric: payload.successMetric, journeyStage: payload.journeyStage,
      coreMessage: payload.coreMessage, desiredAction: payload.desiredAction, mustInclude: payload.mustInclude,
      mustAvoid: payload.mustAvoid, owner: payload.owner,
      dueDate: payload.dueDate, reason: payload.reason, outline: [], masterDraft: '', knowledge: [],
      missingMaterials: [],
      origin: {
        source: payload.demandSource,
        sourceLabel: payload.demandSource === 'attribution' ? '诊断报告 · 自动解析建任务' : payload.demandSource === 'opportunity' ? '内容洞察 · 转入生产' : '运营人员手动创建',
        context: payload.sourceContext,
      },
      parentPlanId, sourceItemIds: payload.sourceItemIds, occurrenceIndex,
      materialBudget: deriveMaterialBudget(payload.type, payload.theme),
      quality: { overall: 0, relevance: 0, accuracy: 0, completeness: 0, readability: 0, authenticity: 0, channelFit: 0 },
      compliance: [], channelVersions: [],
    })

  const submitNewTask = (payload: ContentCreateBatchPayload) => {
    const stamp = Date.now()
    const planId = payload.series ? `csp-${stamp}` : undefined
    const tasks = payload.tasks.map((item, index) => buildTask(item, `ct-new-${stamp}-${index + 1}`, planId, planId ? index + 1 : undefined))
    if (payload.series && planId) {
      setSeriesPlans((current) => [{ ...payload.series!, id: planId, createdTaskIds: tasks.map((item) => item.id) }, ...current])
    }
    setContentTasks((current) => [...tasks, ...current])
    setCreateDrawerOpen(false)
    pushToast('success', payload.series ? `已接收诊断报告：创建 1 个周期计划和 ${tasks.length} 篇首批任务` : '已创建内容任务', true)
    if (tasks[0]) openTask(tasks[0].id, 0)
  }

  const updateBrief = (taskId: string, patch: Partial<Pick<ContentTask, 'title' | 'type' | 'kind' | 'contentSubject' | 'knowledgeScopes' | 'audience' | 'userQuestion' | 'theme' | 'reason' | 'dueDate' | 'locales' | 'channels' | 'businessGoal' | 'successMetric' | 'journeyStage' | 'coreMessage' | 'desiredAction' | 'mustInclude' | 'mustAvoid' | 'owner'>>) => {
    const invalidatesGeneration = ['type', 'kind', 'contentSubject', 'knowledgeScopes', 'audience', 'userQuestion', 'theme', 'locales', 'channels', 'businessGoal', 'coreMessage', 'mustInclude', 'mustAvoid'].some((key) => key in patch)
    setContentTasks((current) => current.map((task) => task.id !== taskId ? task : invalidatesGeneration ? {
      ...task, ...patch, status: 'ready', masterDraft: '', channelVersions: [], previewConfirmations: [],
      quality: { overall: 0, relevance: 0, accuracy: 0, completeness: 0, readability: 0, authenticity: 0, channelFit: 0 }, compliance: [],
    } : { ...task, ...patch }))
  }

  const updateOutline = (taskId: string, outline: string[]) => {
    setContentTasks((current) => current.map((task) => task.id === taskId ? { ...task, outline, channelVersions: [], previewConfirmations: [], status: 'generating' } : task))
  }

  const resolveMaterials = (taskId: string) => {
    setContentTasks((current) => current.map((task) => task.id === taskId ? {
      ...task, status: 'generating', missingMaterials: [],
      knowledge: task.knowledge.length ? task.knowledge : [
        { id: `kr-auto-${task.id}-1`, category: '企业业务知识', title: `${task.contentSubject || task.theme} · 产品与能力资料`, source: '企业知识库 · 已授权目录', verified: true },
        { id: `kr-auto-${task.id}-2`, category: '行业知识', title: `${task.contentSubject || task.theme} · 行业方法与采购关注点`, source: '行业知识库', verified: true },
      ],
    } : task))
    pushToast('success', '资料已补充完整，可以开始生产', true)
  }

  const updateBudget = (taskId: string, budget: MaterialBudgetItem[]) => {
    setContentTasks((current) => current.map((task) => task.id === taskId ? { ...task, materialBudget: budget } : task))
  }

  const confirmChannelProfiles = (taskId: string, profiles: ChannelProfile[]) => {
    setContentTasks((current) => current.map((task) => task.id === taskId ? { ...task, channelProfiles: profiles, status: 'channel_setup', channelVersions: [], previewConfirmations: [] } : task))
    pushToast('success', '渠道字段已确认，进入资料与素材', true)
  }

  const adoptOpportunity = (id: string) => {
    const opportunity = opportunities.find((item) => item.id === id)
    if (!opportunity) return
    const planItem: ContentPlanItem = {
      id: `pi-new-${Date.now()}`, opportunityId: opportunity.id, title: opportunity.suggestedTitle, type: 'guide',
      kind: opportunity.relatedTaskId ? 'optimize' : 'create', theme: opportunity.suggestedTheme,
      audience: opportunity.inferredAudience ?? '待细化目标受众',
      channels: opportunity.suggestedChannels, priority: opportunity.suggestedPriority, dueDate: '2026-08-20',
      reason: opportunity.evidence, status: 'proposed',
    }
    setContentPlanItems((current) => [planItem, ...current])
    setContentOpportunities((current) => current.map((item) => item.id === id ? { ...item, status: 'adopted' } : item))
    pushToast('success', '已采纳为本期计划项', true)
  }

  const dismissOpportunity = (id: string) => {
    setContentOpportunities((current) => current.map((item) => item.id === id ? { ...item, status: 'dismissed' } : item))
    pushToast('info', '已忽略该内容洞察', true)
  }

  const promoteToTask = (planItemId: string) => {
    const item = planItems.find((p) => p.id === planItemId)
    if (!item) return
    const id = `ct-new-${Date.now()}`
    const task: ContentTask = {
      id, title: item.title, kind: item.kind, type: item.type, priority: item.priority,
      status: 'ready',
      theme: item.theme, contentSubject: item.theme, knowledgeScopes: ['product', 'industry'], businessGoal: 'decision', audience: item.audience,
      userQuestion: `${item.audience}在${item.theme}上最关心什么？`, channels: item.channels,
      dueDate: item.dueDate, reason: item.reason, outline: [], masterDraft: '', knowledge: [],
      missingMaterials: [],
      origin: item.opportunityId ? { source: 'opportunity', sourceLabel: '内容洞察 · 本期计划', opportunityId: item.opportunityId } : { source: 'manual', sourceLabel: '运营人员手动创建' },
      materialBudget: deriveMaterialBudget(item.type, item.theme),
      quality: { overall: 0, relevance: 0, accuracy: 0, completeness: 0, readability: 0, authenticity: 0, channelFit: 0 },
      compliance: [], channelVersions: [],
    }
    setContentTasks((current) => [task, ...current])
    setContentPlanItems((current) => current.map((p) => p.id === planItemId ? { ...p, status: 'promoted', promotedTaskId: id } : p))
    pushToast('success', '计划项已转入生产，创建内容任务', true)
    openTask(id, 0)
  }

  const dropPlanItem = (id: string) => {
    setContentPlanItems((current) => current.map((item) => item.id === id ? { ...item, status: 'dropped' } : item))
    pushToast('info', '计划项已放弃', true)
  }

  const generateDraft = (taskId: string) => {
    setContentTasks((current) => current.map((task) => {
      if (task.id !== taskId) return task
      const userQuestion = task.userQuestion || `${task.audience}在${task.theme}上最关心什么？`
      const outline = task.outline.length ? task.outline : [
        `${task.theme}：核心问题与决策要点`,
        `${task.theme}：关键参数与对比`,
        '常见误区与避坑建议',
        '总结与下一步行动',
      ]
      const masterDraft = task.masterDraft || outline.map((section) => `${section}\n\n围绕"${userQuestion}"，面向${task.audience}，结合企业知识库中的产品资料与行业数据，给出可验证、可落地的结论。`).join('\n\n')
      const channelVersions: ChannelVersion[] = task.channels.map((channel) => ({
        channel,
        title: channel === 'website' ? task.title : `${task.title}｜${CHANNEL_META[channel].label}`,
        body: channel === 'website' ? masterDraft : `${masterDraft.split('\n\n')[0]}\n\n${task.desiredAction || '查看完整内容，了解更多信息。'}`,
        account: task.channelProfiles?.find((profile) => profile.channel === channel)?.fields.account || `${CHANNEL_META[channel].label} · 企业官方账号`,
        status: 'ready',
      }))
      const multiplier = PRIORITY_MULTIPLIER[task.priority]
      const subScores = Object.fromEntries(Object.entries(QUALITY_MAX).map(([key, max]) => [key, Math.round(max * multiplier)])) as Record<keyof typeof QUALITY_MAX, number>
      const overall = Object.values(subScores).reduce((sum, value) => sum + value, 0)
      return { ...task, userQuestion, outline, masterDraft, channelVersions, previewConfirmations: [], quality: { overall, ...subScores }, status: 'quality_review' }
    }))
    pushToast('success', '内容概览与渠道内容已生成，进入质量与合规审核', true)
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
    // 知识缺口自动归入物料预算：生成中新增的 RAG no-hit / 缺译名，一次性列齐不再反复打断
    const gapItems = [
      ...openRisks.map((risk, i) => ({ id: `mb-gap-${risk.id}`, templateKey: 'rag', name: `知识库未命中：${risk.issueType.replace('RAG no-hit：', '')}`, status: 'missing' as const, note: risk.diagnosis, addedDuringGeneration: true })),
      ...remainingTerms.map((name, i) => ({ id: `mb-term-${name}-${i}`, templateKey: 'term', name: `术语译名：${name}`, status: 'missing' as const, note: `目标语言站点缺少「${name}」译名`, addedDuringGeneration: true })),
    ]
    setContentTasks((current) => current.map((item) => item.id !== taskId ? item : {
      ...item,
      missingTerms: remainingTerms,
      materialBudget: [
        ...(item.materialBudget ?? []),
        ...gapItems.filter((gap) => !(item.materialBudget ?? []).some((b) => b.templateKey === gap.templateKey && b.name === gap.name)),
      ],
      masterDraft: item.outline.length
        ? item.outline.map((section) => `${section}\n\n（已按最新知识库与术语库重新生成）围绕"${item.userQuestion || item.theme}"，面向${item.audience}，结合已验证的产品资料、行业数据与术语译名给出结论。`).join('\n\n')
        : item.masterDraft,
      channelVersions: item.channels.map((channel) => ({
        channel,
        title: channel === 'website' ? item.title : `${item.title}｜${CHANNEL_META[channel].label}`,
        body: `${item.outline[0] || item.title}\n\n已按最新知识库与术语库重新生成渠道内容。${item.desiredAction ? `\n\n${item.desiredAction}` : ''}`,
        account: item.channelProfiles?.find((profile) => profile.channel === channel)?.fields.account || `${CHANNEL_META[channel].label} · 企业官方账号`,
        status: 'ready',
      })),
      previewConfirmations: [],
      status: 'quality_review',
    }))
    if (remainingTerms.length || openRisks.length) {
      pushToast('warning', `母稿已重新生成，但仍有 ${openRisks.length} 处知识库未命中、${remainingTerms.length} 个术语缺少译名，已归入物料预算待补充`, true)
    } else {
      pushToast('success', '知识缺口已补齐，母稿已基于最新知识库重新生成', true)
    }
  }

  const toggleComplianceIssue = (taskId: string, issueId: string) => {
    setContentTasks((current) => current.map((task) => task.id !== taskId ? task : {
      ...task,
      compliance: task.compliance.map((issue) => issue.id === issueId ? { ...issue, resolved: !issue.resolved } : issue),
    }))
  }

  const ignoreWarningsAndProceed = (taskId: string) => {
    setContentTasks((current) => current.map((task) => task.id === taskId ? { ...task, status: 'channel_adaptation' } : task))
    pushToast('success', '已确认审核结论，进入渠道内容预览', true)
  }

  const confirmPreview = (taskId: string, channel: ContentChannel) => {
    setContentTasks((current) => current.map((task) => {
      if (task.id !== taskId || task.previewConfirmations?.some((item) => item.channel === channel)) return task
      return { ...task, previewConfirmations: [...(task.previewConfirmations ?? []), { channel, confirmedAt: new Date().toISOString() }] }
    }))
    pushToast('success', '已确认当前渠道预览', true)
  }

  const submitForApproval = (taskId: string) => {
    setContentTasks((current) => current.map((task) => task.id === taskId ? { ...task, status: 'pending_approval' } : task))
    pushToast('success', '已提交审批', true)
  }

  const approveAndSchedule = (taskId: string, scheduledAt: string) => {
    const task = tasks.find((item) => item.id === taskId)
    if (!task) return
    setContentTasks((current) => current.map((item) => item.id === taskId ? { ...item, status: 'scheduled' } : item))
    setPublications((current) => {
      const channels = task.channelVersions.map((version) => ({ ...version, status: 'scheduled' as const, scheduledAt }))
      const record: PublicationRecord = { id: current.find((item) => item.taskId === taskId)?.id ?? `pr-${taskId}`, taskId, title: task.title, status: 'scheduled', approvedBy: '张敏', scheduledAt, channels }
      return current.some((item) => item.taskId === taskId) ? current.map((item) => item.taskId === taskId ? record : item) : [record, ...current]
    })
    pushToast('success', '审批通过，已加入发布排期', true)
  }

  const createPerformanceTask = (item: ContentThemePerformance) => {
    const source = tasks.find((task) => task.id === item.taskId) ?? contentTasksData[0]
    const planItem: ContentPlanItem = { id: `pi-performance-${Date.now()}`, title: `${item.theme}：${item.action === 'expand' ? '扩展子主题' : item.action === 'optimize' ? '内容重构' : '内容复核'}`, type: source.type, kind: item.action === 'expand' ? 'expand' : item.action === 'optimize' ? 'optimize' : 'refresh', theme: item.theme, audience: source.audience, channels: source.channels, priority: 'P2', dueDate: '2026-08-20', reason: item.conclusion, status: 'proposed' }
    setContentPlanItems((current) => [planItem, ...current])
    pushToast('success', '效果结论已生成新的计划项，等待确认后再转入生产', true)
    navigate('plan')
  }

  const refreshAsset = (asset: ContentAsset) => {
    const source = tasks.find((task) => task.id === asset.taskId)
    if (source) setContentTasks((current) => [{ ...source, id: `ct-refresh-${Date.now()}`, title: `${asset.title} · 内容更新`, kind: 'refresh', status: 'ready', dueDate: '2026-08-10', reason: '由内容资产库发起更新。' }, ...current])
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

  const publishNow = (id: string) => {
    const record = publications.find((item) => item.id === id)
    if (!record) return
    const task = tasks.find((item) => item.id === record.taskId)
    const publishedAt = '2026-08-07'
    setPublications((current) => current.map((item) => item.id === id ? { ...item, status: 'published', channels: item.channels.map((version) => ({ ...version, status: 'published', url: version.url ?? `https://www.example.com/content/${item.taskId}/${version.channel}` })) } : item))
    setContentTasks((current) => current.map((item) => item.id === record.taskId ? { ...item, status: 'published', channelVersions: item.channelVersions.map((version) => ({ ...version, status: 'published', url: version.url ?? `https://www.example.com/content/${item.id}/${version.channel}` })) } : item))
    if (task && !assets.some((asset) => asset.taskId === task.id)) {
      setAssets((current) => [{ id: `ca-${task.id}`, taskId: task.id, title: task.title, type: task.type, language: task.locales?.length ? task.locales.join(' / ').toUpperCase() : '中文', status: 'published', qualityScore: task.quality.overall, compliance: task.compliance.some((issue) => !issue.resolved && (issue.level === 'blocking' || issue.level === 'high')) ? 'high' : 'pass', channels: task.channels, updatedAt: publishedAt, expiresAt: '2027-02-07', uv: 0, effectiveReadRate: 0 }, ...current])
    }
    pushToast('success', '发布成功，已生成内容资产并进入效果观察', true)
  }

  const glossaryDrawer = glossaryState.open && <ContentGlossary terms={glossaryTerms} locales={contentLocalesData} highlightTerms={glossaryState.highlight} onClose={() => setGlossaryState({ open: false, highlight: [] })} onUpdateTranslation={updateTranslation} onSyncKnowledge={() => pushToast('success', '术语与译名已同步到企业知识库', true)} />

  if (activeTask) return <div className="content-view"><ContentWorkbench task={activeTask} initialStep={workbenchStep} knowledgeRisks={knowledgeRisks} locales={contentLocalesData} glossaryTerms={glossaryTerms} onBack={() => { setActiveTaskId(null); setWorkbenchStep(undefined) }} onUpdateBrief={updateBrief} onUpdateOutline={updateOutline} onResolveMaterials={resolveMaterials} onConfirmChannelProfiles={confirmChannelProfiles} onUpdateBudget={updateBudget} onGenerateDraft={generateDraft} onRegenerateDraft={regenerateDraft} onToggleComplianceIssue={toggleComplianceIssue} onIgnoreWarnings={ignoreWarningsAndProceed} onConfirmPreview={confirmPreview} onSubmitApproval={submitForApproval} onApprove={approveAndSchedule} onOpenGlossary={openGlossary} onOpenKnowledgeRisks={() => { setActiveTaskId(null); setKnowledgeRiskDetailOpen(true) }} />{glossaryDrawer}</div>

  if (knowledgeRiskDetailOpen) return <div className="content-view"><ContentKnowledgeRiskDetail risks={knowledgeRisks} onBack={() => setKnowledgeRiskDetailOpen(false)} onOpenTask={openTask} onMarkResolved={markKnowledgeRiskResolved} /></div>

  return <div className="content-view"><ContentTabs active={tab} onChange={navigate} />
    {tab === 'overview' && <ContentOverview tasks={tasks} publications={publications} knowledgeRisks={knowledgeRisks} onNavigate={navigate} onOpenTask={openTask} onOpenKnowledgeRiskDetail={() => setKnowledgeRiskDetailOpen(true)} />}
    {tab === 'library' && <ContentLibrary tasks={tasks} onOpenTask={openTask} onNavigate={navigate} onCreate={() => setCreateDrawerOpen(true)} onOpenGlossary={() => openGlossary()} onOpenPerformanceDetail={openPerformanceDetail} />}
    {tab === 'plan' && <ContentPlan tasks={tasks} seriesPlans={seriesPlans} opportunities={opportunities} planItems={planItems} onOpenTask={openTask} onCreate={() => setCreateDrawerOpen(true)} onAdoptOpportunity={adoptOpportunity} onDismissOpportunity={dismissOpportunity} onPromoteToTask={promoteToTask} onDropPlanItem={dropPlanItem} />}
    {tab === 'review' && <ContentReview tasks={tasks} onOpenTask={openTask} />}
    {tab === 'calendar' && <ContentCalendar items={contentCalendarData} onOpenTask={openTask} />}
    {tab === 'assets' && <ContentAssets assets={assets} onOpenTask={openTask} onRefresh={refreshAsset} />}
    {tab === 'publishing' && <ContentPublishing records={publications} onApprove={approvePublication} onPublish={publishNow} onRetry={retryPublication} onOpenSettings={() => setPublishSettingsOpen(true)} />}
    {tab === 'performance' && (performanceStat
      ? <ContentPerformanceDetail stat={performanceStat} onBack={() => setPerformanceStatId(null)} onOpenTask={openTask} />
      : <ContentPerformance performance={themePerformanceData} weeks={weeklyPerformanceData} publishStats={contentPublishStatsData} onCreateTask={createPerformanceTask} onOpenDetail={setPerformanceStatId} />)}
    {createDrawerOpen && <ContentCreateDrawer onClose={() => setCreateDrawerOpen(false)} onSubmit={submitNewTask} />}
    {publishSettingsOpen && <ContentPublishSettingsDialog tasks={tasks} locales={contentLocalesData} onClose={() => setPublishSettingsOpen(false)} onSave={savePublishSettings} />}
    {glossaryDrawer}
  </div>
}
