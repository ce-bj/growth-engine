import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import {
  GUIDE_DISMISS_KEY,
  buildDimensions,
  mockDetectHistoryData,
  mockFixTasksData,
  mockFunnelMonthData,
  mockFunnelWeekData,
  mockHealthData,
  mockIssuesData,
  mockScanStepsData,
  mockSitesData,
  mockWeeklyReportsData,
} from '../data/mock'
import {
  DEFAULT_ATTRIBUTION_CONFIG,
  mockAttributionHistoryReports,
  mockAttributionReport,
  mockAttributionTasks,
} from '../data/attributionMock'
import type {
  AgentTaskRow,
  AttributionConfig,
  AttributionReport,
  ContentOpportunity,
  ContentPlanItem,
  ContentTask,
  DetectHistoryRow,
  FixTarget,
  FixTaskRow,
  FunnelPeriod,
  HealthSnapshot,
  IssueItem,
  ToastItem,
  ViewId,
  WeeklyReportRow,
} from '../types'
import { contentOpportunitiesData, contentPlanItemsData, contentTasksData } from '../data/contentMock'
import { deriveMaterialBudget } from '../lib/materialBudget'
import { planContent } from '../lib/contentPlanner'

type FixPhase = 'analyzing' | 'manual' | 'applying' | 'done'

interface WorkbenchApi {
  view: ViewId
  hasDetected: boolean
  showGuide: boolean
  loadingDashboard: boolean
  scanning: boolean
  scanCompleted: number
  siteId: string
  funnelPeriod: FunnelPeriod
  health: HealthSnapshot
  issues: IssueItem[]
  showP2: boolean
  fixTarget: FixTarget | null
  fixPhase: FixPhase
  fixLogs: string[]
  exportingPdf: boolean
  toasts: ToastItem[]
  trendDays: 7 | 30
  historyRows: DetectHistoryRow[]
  taskRows: FixTaskRow[]
  weeklyRows: WeeklyReportRow[]
  weeklyPreviewId: string | null
  sites: typeof mockSitesData
  currentSite: (typeof mockSitesData)[number]
  funnel: typeof mockFunnelWeekData
  p0Count: number
  p1Count: number
  p2Issues: IssueItem[]
  priorityIssues: IssueItem[]
  weakestDimensionKey: string
  pendingTaskCount: number
  // 渠道配置状态
  adsConfigured: boolean
  seoConfigured: boolean
  discoveryActive: boolean
  // 冷启动相关
  domainBound: boolean
  dismissConfigIssue: (issueId: string) => void
  navigate: (view: ViewId) => void
  dismissGuide: () => void
  startDetect: () => void
  goDashboard: () => void
  goReport: () => void
  /** 打开诊断报告 · 健康度 Tab（线 A / 健康度修复任务） */
  openHealthReport: () => void
  openWeeklyPreview: (id: string | null) => void
  setSiteId: (id: string) => void
  setFunnelPeriod: (p: FunnelPeriod) => void
  setTrendDays: (d: 7 | 30) => void
  setShowP2: (v: boolean) => void
  startFixIssue: (issue: IssueItem) => void
  startFixDimension: (dimensionKey: IssueItem['dimensionKey']) => void
  startFixTask: (task: FixTaskRow) => void
  confirmManualDone: () => void
  cancelFix: () => void
  exportPdf: () => void
  pushToast: (type: ToastItem['type'], message: string, autoDismiss?: boolean) => void
  dismissToast: (id: string) => void
  openHistoryReport: (row: DetectHistoryRow) => void
  // 业务指标归因（线 B）
  attributionReport: AttributionReport
  attributionHistory: AttributionReport[]
  attributionTasks: AgentTaskRow[]
  attributionConfig: AttributionConfig
  attributionChangeId: string | null
  reportInitialTab: 'health' | 'attribution'
  /** 全部归因报告（本期 + 历史，本期在前） */
  attributionReports: AttributionReport[]
  /** 当前选中的归因报告周期 id */
  attributionReportId: string
  /** 当前选中周期的报告（执行动作只发生在本期） */
  activeAttributionReport: AttributionReport
  openAttributionReport: (reportId: string, changeId?: string) => void
  selectAttributionReport: (reportId: string) => void
  selectAttributionChange: (changeId: string) => void
  confirmMeasure: (changeId: string, measureId: string) => void
  ignoreMeasure: (changeId: string, measureId: string) => void
  /** Demo：内容类模拟已发布（发布后才可复盘） */
  markMeasureContentPublished: (changeId: string, measureId: string) => void
  /** Demo：模拟复盘到期 */
  runMeasureReview: (changeId: string, measureId: string) => void
  closeAttributionDetail: () => void
  setAttributionConfig: (cfg: AttributionConfig) => void
  setReportInitialTab: (tab: 'health' | 'attribution') => void
  // 内容运营（全局任务状态，供归因诊断联动创建任务）
  contentTasks: ContentTask[]
  contentOpportunities: ContentOpportunity[]
  contentPlanItems: ContentPlanItem[]
  setContentTasks: Dispatch<SetStateAction<ContentTask[]>>
  setContentOpportunities: Dispatch<SetStateAction<ContentOpportunity[]>>
  setContentPlanItems: Dispatch<SetStateAction<ContentPlanItem[]>>
  addContentTask: (task: ContentTask) => void
  /** 归因 → 内容运营深链：打开指定任务工作台（默认第 0 步任务说明） */
  openContentTaskFromAttribution: (taskId: string, step?: number) => void
  /** 任务中心「去确认」：确保内容任务存在并打开其详情 */
  openContentConfirmFromTaskCenter: (changeId: string, measureId: string) => void
  /** ContentView 消费后清空 */
  pendingContentTaskOpen: { taskId: string; step: number } | null
  clearPendingContentTaskOpen: () => void
}

const WorkbenchContext = createContext<WorkbenchApi | null>(null)

function readGuideDismissed(): boolean {
  try {
    return localStorage.getItem(GUIDE_DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

function createInitialHealth(): HealthSnapshot {
  return {
    ...mockHealthData,
    dimensions: buildDimensions(),
  }
}

let toastSeq = 0

export function WorkbenchProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<ViewId>('dashboard')
  const [hasDetected, setHasDetected] = useState(true)
  const [showGuide, setShowGuide] = useState(false)
  const [loadingDashboard, setLoadingDashboard] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanCompleted, setScanCompleted] = useState(0)
  const [siteId, setSiteIdState] = useState(
    mockSitesData.find((s) => s.isPrimary)?.id ?? mockSitesData[0].id,
  )
  const [funnelPeriod, setFunnelPeriod] = useState<FunnelPeriod>('week')
  const [health, setHealth] = useState<HealthSnapshot>(createInitialHealth)
  const [issues, setIssues] = useState<IssueItem[]>(mockIssuesData)
  const [showP2, setShowP2] = useState(false)
  const [fixTarget, setFixTarget] = useState<FixTarget | null>(null)
  const [fixPhase, setFixPhase] = useState<FixPhase>('analyzing')
  const [fixLogs, setFixLogs] = useState<string[]>([])
  const [exportingPdf, setExportingPdf] = useState(false)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [trendDays, setTrendDays] = useState<7 | 30>(7)
  const [historyRows, setHistoryRows] = useState(mockDetectHistoryData)
  const [taskRows, setTaskRows] = useState(mockFixTasksData)
  const [weeklyRows] = useState(mockWeeklyReportsData)
  const [weeklyPreviewId, setWeeklyPreviewId] = useState<string | null>(null)

  // 渠道配置状态
  const [adsConfigured, setAdsConfigured] = useState(false)
  const [seoConfigured, setSeoConfigured] = useState(false) // 演示：默认未配置
  const [discoveryActive, setDiscoveryActive] = useState(true) // 自然收录渠道：有数据时显示

  // 冷启动状态
  const [domainBound, setDomainBound] = useState(true) // TODO: 改回 false

  // 业务指标归因（线 B）状态
  const [attributionReport, setAttributionReport] = useState<AttributionReport>(mockAttributionReport)
  const [attributionHistory] = useState<AttributionReport[]>(mockAttributionHistoryReports)
  const [attributionTasks, setAttributionTasks] = useState<AgentTaskRow[]>(mockAttributionTasks)
  const [attributionConfig, setAttributionConfig] = useState<AttributionConfig>(DEFAULT_ATTRIBUTION_CONFIG)
  const [attributionChangeId, setAttributionChangeId] = useState<string | null>(null)
  const [reportInitialTab, setReportInitialTab] = useState<'health' | 'attribution'>('health')
  // 当前选中的归因报告周期（默认本期）
  const [attributionReportId, setAttributionReportId] = useState<string>(mockAttributionReport.id)

  // 内容运营：全局任务/机会/计划项状态（归因诊断确认措施后联动创建内容任务）
  const [contentTasks, setContentTasks] = useState<ContentTask[]>(contentTasksData)
  const [contentOpportunities, setContentOpportunities] = useState<ContentOpportunity[]>(contentOpportunitiesData)
  const [contentPlanItems, setContentPlanItems] = useState<ContentPlanItem[]>(contentPlanItemsData)
  const [pendingContentTaskOpen, setPendingContentTaskOpen] = useState<{
    taskId: string
    step: number
  } | null>(null)

  /** 归因侧健康度：接口自动推进，只跑一次 */
  const healthAutoStartedRef = useRef(false)

  const addContentTask = useCallback((task: ContentTask) => {
    setContentTasks((prev) => [task, ...prev])
  }, [])

  const clearPendingContentTaskOpen = useCallback(() => {
    setPendingContentTaskOpen(null)
  }, [])

  const pushToast = useCallback((type: ToastItem['type'], message: string, autoDismiss = true) => {
    const id = `toast-${++toastSeq}`
    setToasts((prev) => [...prev, { id, type, message, autoDismiss }])
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  /* ── 归因侧健康度：挂载后接口自动推进（无需点「开始修复」） ── */
  useEffect(() => {
    if (healthAutoStartedRef.current) return
    healthAutoStartedRef.current = true

    const jobs = mockAttributionReport.changes.flatMap((c) => {
      if (c.reviewResult) return []
      return (c.measures ?? [])
        .filter(
          (m) =>
            m.suggestedBoundary === 'auto' &&
            (m.execStatus === 'pending_confirm' || m.execStatus === 'executing'),
        )
        .map((m) => ({
          changeId: c.id,
          measureId: m.measureId,
          reviewPeriod: m.reviewPeriod ?? 'T+3',
          script: c.reviewScript ?? {
            result: 'success' as const,
            note: '健康度复盘完成：措施起效。',
          },
          description: m.description,
        }))
    })
    if (jobs.length === 0) return

    setAttributionReport((prev) => ({
      ...prev,
      changes: prev.changes.map((c) => ({
        ...c,
        measures: c.measures?.map((m) =>
          m.suggestedBoundary === 'auto' &&
          (m.execStatus === 'pending_confirm' || m.execStatus === 'executing')
            ? { ...m, execStatus: 'executing' as const }
            : m,
        ),
      })),
    }))

    setAttributionTasks((prev) => {
      const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
      const next = [...prev]
      for (const job of jobs) {
        const exists = next.some(
          (t) => t.module === 'health_fix' && t.measureId === job.measureId,
        )
        if (!exists) {
          next.unshift({
            id: `atask-health-${job.measureId}`,
            module: 'health_fix',
            title: job.description,
            summary: '接口自动修复中',
            status: 'running',
            priority: 'P2',
            createdAt: now,
            updatedAt: now,
            attributionReportId: mockAttributionReport.id,
            changeId: job.changeId,
            measureId: job.measureId,
          })
        }
      }
      return next
    })

    const t1 = window.setTimeout(() => {
      const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
      setAttributionReport((prev) => ({
        ...prev,
        changes: prev.changes.map((c) => ({
          ...c,
          measures: c.measures?.map((m) =>
            jobs.some((j) => j.measureId === m.measureId)
              ? { ...m, execStatus: 'success' as const }
              : m,
          ),
        })),
      }))
      setAttributionTasks((prev) =>
        prev.map((t) =>
          t.module === 'health_fix' && jobs.some((j) => j.measureId === t.measureId)
            ? {
                ...t,
                summary: '已修复 · 待复盘',
                reviewPending: `待复盘 ${
                  jobs.find((j) => j.measureId === t.measureId)?.reviewPeriod ?? 'T+3'
                }`,
                updatedAt: now,
              }
            : t,
        ),
      )
      pushToast('success', '健康度修复完成（接口自动），进入复盘周期')
    }, 2500)

    const t2 = window.setTimeout(() => {
      const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
      setAttributionReport((prev) => ({
        ...prev,
        changes: prev.changes.map((c) => {
          const job = jobs.find((j) => j.changeId === c.id)
          if (!job) return c
          return {
            ...c,
            reviewResult: job.script.result,
            reviewNote: job.script.note,
          }
        }),
      }))
      setAttributionTasks((prev) =>
        prev.map((t) =>
          t.module === 'health_fix' && jobs.some((j) => j.measureId === t.measureId)
            ? {
                ...t,
                status: 'done',
                summary: '自动修复已复盘',
                reviewPending: undefined,
                updatedAt: now,
              }
            : t,
        ),
      )
      pushToast('success', '健康度复盘完成：措施起效')
    }, 8000)

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [pushToast])

  const navigate = useCallback((next: ViewId) => {
    setView(next)
    if (next !== 'weekly') setWeeklyPreviewId(null)
  }, [])

  const openContentTaskFromAttribution = useCallback(
    (taskId: string, step = 0) => {
      setPendingContentTaskOpen({ taskId, step })
      navigate('content')
    },
    [navigate],
  )

  /** 任务中心内容类「去确认」：落内容任务（若尚未创建）并打开工作台详情 */
  const openContentConfirmFromTaskCenter = useCallback(
    (changeId: string, measureId: string) => {
      const changeRef =
        attributionReport.changes.find((c) => c.id === changeId) ??
        mockAttributionReport.changes.find((c) => c.id === changeId)
      const measure = changeRef?.measures?.find((m) => m.measureId === measureId)
      if (!changeRef || !measure) {
        pushToast('warning', '未找到对应任务说明')
        return
      }

      const existingId = measure.contentTaskId
      const stableId = existingId ?? `ct-attr-${measureId}`
      const alreadyInList = contentTasks.some((t) => t.id === stableId)

      if (!alreadyInList) {
        const plan = planContent({ measure, change: changeRef })
        const task: ContentTask = {
          id: stableId,
          title: plan.title,
          kind: plan.kind,
          type: plan.type,
          status: 'ready',
          priority: plan.priority,
          theme: plan.theme,
          audience: plan.audience,
          userQuestion: plan.userQuestion,
          channels: plan.channels,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          reason: measure.description,
          outline: measure.taskBrief?.length ? [...measure.taskBrief] : [],
          masterDraft: '',
          knowledge: [],
          missingMaterials: [],
          origin: plan.origin,
          materialBudget: deriveMaterialBudget(plan.type, plan.theme),
          quality: {
            overall: 0,
            experience: 0,
            expertise: 0,
            authority: 0,
            trustworthiness: 0,
          },
          compliance: [],
          channelVersions: [],
        }
        setContentTasks((prev) => [task, ...prev])
      }

      if (!existingId || existingId !== stableId) {
        setAttributionReport((prev) => ({
          ...prev,
          changes: prev.changes.map((c) =>
            c.id !== changeId
              ? c
              : {
                  ...c,
                  measures: c.measures?.map((m) =>
                    m.measureId === measureId ? { ...m, contentTaskId: stableId } : m,
                  ),
                },
          ),
        }))
      }

      openContentTaskFromAttribution(stableId, 0)
    },
    [
      attributionReport.changes,
      contentTasks,
      openContentTaskFromAttribution,
      pushToast,
    ],
  )

  const dismissGuide = useCallback(() => {
    setShowGuide(false)
    try {
      localStorage.setItem(GUIDE_DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
  }, [])

  // 完成/移除配置项（从 issues 数组中移除 config 维度的问题）
  const dismissConfigIssue = useCallback((issueId: string) => {
    setIssues((prev) => prev.filter((i) => i.id !== issueId))
  }, [])

  const runScanSequence = useCallback(() => {
    setScanning(true)
    setScanCompleted(0)
    setView('scanning')
    setShowGuide(false)
    setFixTarget(null)

    let step = 0
    const total = mockScanStepsData.length
    const timer = window.setInterval(() => {
      step += 1
      setScanCompleted(step)
      if (step >= total) {
        window.clearInterval(timer)
        window.setTimeout(() => {
          const next = createInitialHealth()
          next.detectedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
          next.detectType = 'manual'
          setHealth(next)
          setIssues([...mockIssuesData])
          setHasDetected(true)
          setScanning(false)
          setHistoryRows((prev) => [
            {
              id: `dh-${Date.now()}`,
              detectedAt: next.detectedAt,
              detectType: 'manual',
              totalScore: next.totalScore,
              previousScore: next.previousScore,
              p0: 1,
              p1: 3,
              p2: 5,
              siteId,
              operator: '张敏',
            },
            ...prev,
          ])
          setView('dashboard')
          pushToast('success', '检测完成，已返回智能体概览')
        }, 400)
      }
    }, 380)
  }, [pushToast, siteId])

  const startDetect = useCallback(() => {
    dismissGuide()
    runScanSequence()
  }, [dismissGuide, runScanSequence])

  const goDashboard = useCallback(() => navigate('dashboard'), [navigate])
  const goReport = useCallback(() => {
    if (!hasDetected) {
      startDetect()
      return
    }
    navigate('report')
  }, [hasDetected, navigate, startDetect])

  const openHealthReport = useCallback(() => {
    setReportInitialTab('health')
    if (!hasDetected) {
      startDetect()
      return
    }
    navigate('report')
  }, [hasDetected, navigate, startDetect])

  const openWeeklyPreview = useCallback((id: string | null) => {
    setWeeklyPreviewId(id)
    setView('weekly')
  }, [])

  const applyScoreBump = useCallback(
    (dimensionKey: IssueItem['dimensionKey'], bump: number, issueId?: string) => {
      setHealth((prev) => {
        const dim = prev.dimensions.find((d) => d.key === dimensionKey)
        const weightPoints = dim?.weightPoints ?? 20
        const contrib = Math.round((bump / 20) * weightPoints)
        const dims = prev.dimensions.map((d) =>
          d.key === dimensionKey
            ? { ...d, rawScore: Math.min(d.rawMax, d.rawScore + bump) }
            : d,
        )
        return {
          ...prev,
          previousScore: prev.totalScore,
          totalScore: Math.min(100, prev.totalScore + Math.max(contrib, 1)),
          dimensions: dims,
        }
      })
      if (issueId) {
        setIssues((prev) => prev.filter((i) => i.id !== issueId))
        setTaskRows((prev) =>
          prev.map((t) =>
            t.issueId === issueId
              ? {
                  ...t,
                  status: 'done',
                  scoreAfter: Math.min(20, (t.scoreBefore ?? 0) + bump),
                  updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
                }
              : t,
          ),
        )
      } else {
        setIssues((prev) =>
          prev.filter((i) => i.dimensionKey !== dimensionKey || i.priority === 'P2'),
        )
      }
    },
    [],
  )

  /** 健康度 auto：分析完直接修，不再二次确认 */
  const runAutoApply = useCallback(
    (target: FixTarget) => {
      setFixPhase('applying')
      setFixLogs((l) => [...l, '方案已就绪，开始自动修复', '已调用平台接口，修改已提交'])
      window.setTimeout(() => {
        setFixPhase('done')
        const before = target.currentRaw
        const bump = target.dimensionKey === 'seo' ? 6 : 3
        applyScoreBump(target.dimensionKey, bump, target.issueId)
        const after = Math.min(20, before + bump)
        pushToast('success', `${target.title.slice(0, 18)}… 已从 ${before} → ${after} 分`)
        window.setTimeout(() => setFixTarget(null), 600)
      }, 1000)
    },
    [applyScoreBump, pushToast],
  )

  const beginFix = useCallback(
    (target: FixTarget) => {
      setFixTarget(target)
      setFixPhase('analyzing')
      setFixLogs([])

      window.setTimeout(() => setFixLogs((l) => [...l, `已发现：${target.title}`]), 400)
      window.setTimeout(() => {
        setFixLogs((l) => [
          ...l,
          target.fixMode === 'auto' ? '已生成修复方案' : '已生成操作指引',
        ])
      }, 900)
      window.setTimeout(() => {
        if (target.fixMode === 'auto') {
          runAutoApply(target)
        } else {
          setFixPhase('manual')
        }
      }, 1400)

      if (target.issueId) {
        setTaskRows((prev) =>
          prev.map((t) =>
            t.issueId === target.issueId
              ? {
                  ...t,
                  status: 'running',
                  updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
                }
              : t,
          ),
        )
      }
    },
    [runAutoApply],
  )

  const startFixIssue = useCallback(
    (issue: IssueItem) => {
      const dim = health.dimensions.find((d) => d.key === issue.dimensionKey)
      beginFix({
        kind: 'issue',
        issueId: issue.id,
        dimensionKey: issue.dimensionKey,
        title: issue.title,
        currentRaw: dim?.rawScore ?? 0,
        fixMode: issue.fixMode,
      })
    },
    [beginFix, health.dimensions],
  )

  const startFixDimension = useCallback(
    (dimensionKey: IssueItem['dimensionKey']) => {
      const dim = health.dimensions.find((d) => d.key === dimensionKey)
      const related = issues.filter((i) => i.dimensionKey === dimensionKey)
      const mode = related.some((i) => i.fixMode === 'manual')
        ? 'manual'
        : related.some((i) => i.fixMode === 'guide')
          ? 'guide'
          : 'auto'
      beginFix({
        kind: 'dimension',
        dimensionKey,
        title: `修复 ${dim?.name ?? dimensionKey}`,
        currentRaw: dim?.rawScore ?? 0,
        fixMode: mode,
      })
    },
    [beginFix, health.dimensions, issues],
  )

  const startFixTask = useCallback(
    (task: FixTaskRow) => {
      const issue = issues.find((i) => i.id === task.issueId)
      if (issue) {
        startFixIssue(issue)
        return
      }
      beginFix({
        kind: 'issue',
        issueId: task.issueId,
        dimensionKey: task.dimensionKey,
        title: task.title,
        currentRaw: task.scoreBefore ?? 0,
        fixMode: task.fixMode,
      })
    },
    [beginFix, issues, startFixIssue],
  )

  const confirmManualDone = useCallback(() => {
    if (!fixTarget) return
    setFixPhase('applying')
    setFixLogs((l) => [...l, '正在增量验证该问题…'])
    window.setTimeout(() => {
      setFixPhase('done')
      const before = fixTarget.currentRaw
      applyScoreBump(fixTarget.dimensionKey, 4, fixTarget.issueId)
      pushToast('success', `验证通过：维度得分 ${before} → ${Math.min(20, before + 4)}`)
      window.setTimeout(() => setFixTarget(null), 600)
    }, 900)
  }, [applyScoreBump, fixTarget, pushToast])

  const cancelFix = useCallback(() => {
    if (fixTarget?.issueId) {
      setTaskRows((prev) =>
        prev.map((t) =>
          t.issueId === fixTarget.issueId && t.status === 'running'
            ? { ...t, status: 'pending' }
            : t,
        ),
      )
    }
    setFixTarget(null)
  }, [fixTarget])

  const exportPdf = useCallback(() => {
    setExportingPdf(true)
    pushToast('info', '正在生成 PDF 报告…')
    window.setTimeout(() => {
      setExportingPdf(false)
      pushToast('success', '报告已导出')
    }, 1200)
  }, [pushToast])

  const setSiteId = useCallback((id: string) => {
    setSiteIdState(id)
  }, [])

  const openHistoryReport = useCallback(
    (row: DetectHistoryRow) => {
      setSiteIdState(row.siteId)
      setHealth((prev) => ({
        ...prev,
        totalScore: row.totalScore,
        previousScore: row.previousScore,
        detectedAt: row.detectedAt,
        detectType: row.detectType,
      }))
      navigate('report')
    },
    [navigate],
  )

  /* ── 业务指标归因（线 B）动作 ───────────────────────────────── */

  const openAttributionReport = useCallback(
    (reportId: string, changeId?: string) => {
      // 定位报告（本期或历史），切换选中周期与选中变化，跳诊断报告归因 Tab
      const all = [attributionReport, ...attributionHistory]
      const found = all.find((r) => r.id === reportId)
      if (!found) return
      const firstChange = changeId ?? found.changes[0]?.id ?? null
      setAttributionReportId(reportId)
      setAttributionChangeId(firstChange)
      setReportInitialTab('attribution')
      navigate('report')
      // 任务标为已读（处理中）
      setAttributionTasks((prev) =>
        prev.map((t) =>
          t.attributionReportId === reportId && t.status === 'pending'
            ? { ...t, status: 'running', updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') }
            : t,
        ),
      )
    },
    [attributionReport, attributionHistory, navigate],
  )

  const selectAttributionChange = useCallback((changeId: string) => {
    setAttributionChangeId(changeId)
  }, [])

  const selectAttributionReport = useCallback(
    (reportId: string) => {
      const all = [attributionReport, ...attributionHistory]
      const found = all.find((r) => r.id === reportId)
      if (!found) return
      setAttributionReportId(reportId)
      setAttributionChangeId(found.changes[0]?.id ?? null)
    },
    [attributionReport, attributionHistory],
  )

  const confirmMeasure = useCallback(
    (changeId: string, measureId: string) => {
      // 取该变化的复盘脚本 + 措施的复盘周期（对齐方案 9.2 分档）
      const changeRef = mockAttributionReport.changes.find((c) => c.id === changeId)
      const script = changeRef?.reviewScript ?? {
        result: 'success' as const,
        note: 'T+7 复盘：异常指标回归正常区间，措施起效。沉淀为标准措施。',
      }
      const reviewPeriod = changeRef?.measures?.find((m) => m.measureId === measureId)?.reviewPeriod ?? 'T+7'
      const targetMeasure = changeRef?.measures?.find((m) => m.measureId === measureId)
      const REVIEW_TOAST: Record<'success' | 'partial' | 'failed', string> = {
        success: '复盘完成：措施起效，指标回归正常',
        partial: '复盘完成：部分改善，已追加措施回方案池',
        failed: '复盘完成：未见改善，已沉淀并建议重新归因',
      }
      // ① 确认 → 交接中 / 修复中
      setAttributionReport((prev) => ({
        ...prev,
        changes: prev.changes.map((c) =>
          c.id !== changeId
            ? c
            : {
                ...c,
                measures: c.measures?.map((m) =>
                  m.measureId === measureId ? { ...m, execStatus: 'executing' as const } : m,
                ),
              },
        ),
      }))
      const isHealthFix = targetMeasure?.suggestedBoundary === 'auto'
      pushToast(
        'info',
        isHealthFix ? '已开始健康度修复…' : '已确认，任务说明已交给内容运营…',
      )
      // ② 交接/修复完成（演示 2 秒）
      window.setTimeout(() => {
        let handedContentTaskId: string | undefined
        // 内容类确认后交接：创建内容任务，并回写 contentTaskId 供一键跳转
        if (!isHealthFix && targetMeasure && changeRef) {
          handedContentTaskId = targetMeasure.contentTaskId ?? `ct-attr-${measureId}`
          setContentTasks((prev) => {
            if (prev.some((t) => t.id === handedContentTaskId)) return prev
            const plan = planContent({ measure: targetMeasure, change: changeRef })
            const task: ContentTask = {
              id: handedContentTaskId!,
              title: plan.title,
              kind: plan.kind,
              type: plan.type,
              status: 'ready',
              priority: plan.priority,
              theme: plan.theme,
              contentSubject: plan.contentSubject,
              knowledgeScopes: plan.knowledgeScopes,
              businessGoal: plan.businessGoal,
              audience: plan.audience,
              userQuestion: plan.userQuestion,
              channels: plan.channels,
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
              reason: targetMeasure.description,
              outline: targetMeasure.taskBrief?.length ? [...targetMeasure.taskBrief] : [],
              masterDraft: '',
              knowledge: [],
              missingMaterials: [],
              origin: plan.origin,
              materialBudget: deriveMaterialBudget(plan.type, plan.theme),
              quality: {
                overall: 0,
                experience: 0,
                expertise: 0,
                authority: 0,
                trustworthiness: 0,
              },
              compliance: [],
              channelVersions: [],
            }
            return [task, ...prev]
          })
        }
        setAttributionReport((prev) => ({
          ...prev,
          changes: prev.changes.map((c) =>
            c.id !== changeId
              ? c
              : {
                  ...c,
                  measures: c.measures?.map((m) =>
                    m.measureId === measureId
                      ? {
                          ...m,
                          execStatus: 'success' as const,
                          ...(handedContentTaskId ? { contentTaskId: handedContentTaskId } : {}),
                        }
                      : m,
                  ),
                },
          ),
        }))
        if (isHealthFix) {
          setAttributionTasks((prev) =>
            prev.map((t) =>
              t.module === 'health_fix' && t.measureId === measureId
                ? {
                    ...t,
                    status: 'running',
                    summary: '已修复 · 待复盘',
                    reviewPending: `待复盘 ${reviewPeriod}`,
                    updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
                  }
                : t,
            ),
          )
          pushToast('success', `健康度修复完成，进入复盘周期（${reviewPeriod}）`)
        } else {
          const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
          if (handedContentTaskId && targetMeasure && changeRef) {
            setAttributionTasks((prev) => [
              {
                id: `atask-content-${handedContentTaskId}`,
                module: 'content',
                title: targetMeasure.description,
                summary: '已交接待发布',
                status: 'running',
                priority: changeRef.severity,
                createdAt: now,
                updatedAt: now,
                attributionReportId: mockAttributionReport.id,
                changeId,
                measureId,
                contentTaskId: handedContentTaskId,
              },
              ...prev,
            ])
          }
          pushToast('success', '内容运营已接收任务说明。请先发布内容，再进入复盘。')
        }
      }, 2000)
      // ③ 仅健康度：修复后自动模拟复盘到期。内容类须「模拟已发布」后再复盘。
      if (isHealthFix) {
        window.setTimeout(() => {
          setAttributionReport((prev) => ({
            ...prev,
            changes: prev.changes.map((c) =>
              c.id !== changeId
                ? c
                : {
                    ...c,
                    reviewResult: script.result,
                    reviewNote: script.note,
                  },
            ),
          }))
          setAttributionTasks((prev) =>
            prev.map((t) =>
              t.module === 'health_fix' && t.measureId === measureId
                ? {
                    ...t,
                    status: 'done',
                    summary: '自动修复已复盘',
                    reviewPending: undefined,
                    updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
                  }
                : t,
            ),
          )
          pushToast(script.result === 'failed' ? 'warning' : 'success', REVIEW_TOAST[script.result])
        }, 8000)
      }
    },
    [pushToast],
  )

  const markMeasureContentPublished = useCallback(
    (changeId: string, measureId: string) => {
      const changeRef =
        attributionReport.changes.find((c) => c.id === changeId) ??
        mockAttributionReport.changes.find((c) => c.id === changeId)
      const measure = changeRef?.measures?.find((m) => m.measureId === measureId)
      if (!measure?.demoPublishEnabled) {
        pushToast('warning', '该措施未开启「模拟已发布」演示')
        return
      }
      if (measure.contentPublished) {
        pushToast('info', '内容已标记为已发布')
        return
      }
      const publishedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
      const reviewPeriod = measure.reviewPeriod ?? 'T+7'
      const taskId = measure.contentTaskId

      setAttributionReport((prev) => ({
        ...prev,
        changes: prev.changes.map((c) =>
          c.id !== changeId
            ? c
            : {
                ...c,
                measures: c.measures?.map((m) =>
                  m.measureId === measureId
                    ? { ...m, contentPublished: true, contentPublishedAt: publishedAt }
                    : m,
                ),
              },
        ),
      }))

      if (taskId) {
        setContentTasks((prev) =>
          prev.map((t) =>
            t.id !== taskId
              ? t
              : {
                  ...t,
                  status: 'published',
                  channelVersions:
                    t.channelVersions.length > 0
                      ? t.channelVersions.map((v) =>
                          v.channel === 'website' ? { ...v, status: 'published' as const } : v,
                        )
                      : [
                          {
                            channel: 'website' as const,
                            title: measure.deliverable?.title ?? t.title,
                            body: measure.deliverable?.previewNote ?? t.reason,
                            account: 'www.example.com',
                            status: 'published' as const,
                            url: measure.deliverable?.url,
                          },
                        ],
                },
          ),
        )
      }

      setAttributionTasks((prev) =>
        prev.map((t) => {
          if (t.contentTaskId === taskId || (t.module === 'content' && t.measureId === measureId)) {
            return {
              ...t,
              status: 'running',
              summary: '已发布 · 待复盘',
              reviewPending: `待复盘 ${reviewPeriod}（自发布起算）`,
              updatedAt: publishedAt,
            }
          }
          if (t.module === 'attribution' && (t.status === 'running' || t.status === 'pending')) {
            return {
              ...t,
              status: 'running',
              reviewPending: `待复盘 ${reviewPeriod}（自发布起算）`,
              updatedAt: publishedAt,
            }
          }
          return t
        }),
      )
      pushToast('success', `已模拟发布。观察期 ${reviewPeriod} 起算，到期后再复盘。`)
    },
    [attributionReport.changes, pushToast],
  )

  const runMeasureReview = useCallback(
    (changeId: string, measureId: string) => {
      const changeRef =
        attributionReport.changes.find((c) => c.id === changeId) ??
        mockAttributionReport.changes.find((c) => c.id === changeId)
      const measure = changeRef?.measures?.find((m) => m.measureId === measureId)
      if (!measure?.contentPublished && measure?.suggestedBoundary !== 'auto') {
        pushToast('warning', '请先模拟已发布，再复盘')
        return
      }
      if (changeRef?.reviewResult) {
        pushToast('info', '该变化已复盘')
        return
      }
      const script = changeRef?.reviewScript ?? {
        result: 'success' as const,
        note: 'T+7 复盘：异常指标回归正常区间，措施起效。',
      }
      const REVIEW_TOAST: Record<'success' | 'partial' | 'failed', string> = {
        success: '复盘完成：措施起效，指标回归正常',
        partial: '复盘完成：部分改善，已追加措施回方案池',
        failed: '复盘完成：未见改善，已沉淀并建议重新归因',
      }
      setAttributionReport((prev) => ({
        ...prev,
        changes: prev.changes.map((c) =>
          c.id !== changeId
            ? c
            : {
                ...c,
                reviewResult: script.result,
                reviewNote: script.note,
              },
        ),
      }))
      setAttributionTasks((prev) =>
        prev.map((t) => {
          if (t.module === 'content' && t.measureId === measureId) {
            return {
              ...t,
              status: 'done',
              summary: '已复盘',
              reviewPending: undefined,
              updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
            }
          }
          if (t.module === 'attribution' && t.status === 'running') {
            return {
              ...t,
              status: 'done',
              reviewPending: undefined,
              updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
            }
          }
          return t
        }),
      )
      pushToast(script.result === 'failed' ? 'warning' : 'success', REVIEW_TOAST[script.result])
    },
    [attributionReport.changes, pushToast],
  )

  const ignoreMeasure = useCallback(
    (changeId: string, measureId: string) => {
      setAttributionReport((prev) => ({
        ...prev,
        changes: prev.changes.map((c) =>
          c.id !== changeId
            ? c
            : {
                ...c,
                measures: c.measures?.map((m) =>
                  m.measureId === measureId ? { ...m, execStatus: 'rejected' as const } : m,
                ),
              },
        ),
      }))
      pushToast('info', '已忽略该措施')
    },
    [pushToast],
  )

  const closeAttributionDetail = useCallback(() => {
    setAttributionChangeId(null)
  }, [])

  const attributionReports = useMemo(
    () => [attributionReport, ...attributionHistory],
    [attributionReport, attributionHistory],
  )
  const activeAttributionReport = useMemo(
    () => attributionReports.find((r) => r.id === attributionReportId) ?? attributionReport,
    [attributionReports, attributionReportId, attributionReport],
  )

  const currentSite = mockSitesData.find((s) => s.id === siteId) ?? mockSitesData[0]
  const funnel = funnelPeriod === 'week' ? mockFunnelWeekData : mockFunnelMonthData
  const p0Count = issues.filter((i) => i.priority === 'P0').length
  const p1Count = issues.filter((i) => i.priority === 'P1').length
  const p2Issues = issues.filter((i) => i.priority === 'P2')
  const priorityIssues = issues.filter((i) => i.priority === 'P0' || i.priority === 'P1')
  const weakestDimensionKey = health.dimensions.reduce((min, d) =>
    d.rawScore < min.rawScore ? d : min,
  ).key
  const pendingFixCount = taskRows.filter(
    (t) => t.status === 'pending' || t.status === 'running' || t.status === 'waiting_verify',
  ).length
  const pendingAgentCount = attributionTasks.filter(
    (t) => t.status !== 'done' && t.status !== 'failed',
  ).length
  const contentPendingConfirmCount = attributionReport.changes.reduce((n, c) => {
    const count =
      c.measures?.filter(
        (m) =>
          m.suggestedBoundary === 'confirm' &&
          (!m.execStatus || m.execStatus === 'pending_confirm') &&
          !attributionTasks.some((t) => t.module === 'content' && t.measureId === m.measureId),
      ).length ?? 0
    return n + count
  }, 0)
  const pendingTaskCount = pendingFixCount + pendingAgentCount + contentPendingConfirmCount

  const filteredHistory = historyRows.filter((r) => r.siteId === siteId)
  const filteredWeekly = weeklyRows.filter((r) => r.siteId === siteId)

  const api = useMemo<WorkbenchApi>(
    () => ({
      view,
      hasDetected,
      showGuide,
      loadingDashboard,
      scanning,
      scanCompleted,
      siteId,
      funnelPeriod,
      health,
      issues,
      showP2,
      fixTarget,
      fixPhase,
      fixLogs,
      exportingPdf,
      toasts,
      trendDays,
      historyRows: filteredHistory,
      taskRows,
      weeklyRows: filteredWeekly,
      weeklyPreviewId,
      sites: mockSitesData,
      currentSite,
      funnel,
      p0Count,
      p1Count,
      p2Issues,
      priorityIssues,
      weakestDimensionKey,
      pendingTaskCount,
      adsConfigured,
      seoConfigured,
      discoveryActive,
      domainBound,
      dismissConfigIssue,
      navigate,
      dismissGuide,
      startDetect,
      goDashboard,
      goReport,
      openHealthReport,
      openWeeklyPreview,
      setSiteId,
      setFunnelPeriod,
      setTrendDays,
      setShowP2,
      startFixIssue,
      startFixDimension,
      startFixTask,
      confirmManualDone,
      cancelFix,
      exportPdf,
      pushToast,
      dismissToast,
      openHistoryReport,
      attributionReport,
      attributionHistory,
      attributionTasks,
      attributionConfig,
      attributionChangeId,
      reportInitialTab,
      attributionReports,
      attributionReportId,
      activeAttributionReport,
      openAttributionReport,
      selectAttributionReport,
      selectAttributionChange,
      confirmMeasure,
      ignoreMeasure,
      markMeasureContentPublished,
      runMeasureReview,
      closeAttributionDetail,
      setAttributionConfig,
      setReportInitialTab,
      contentTasks,
      contentOpportunities,
      contentPlanItems,
      setContentTasks,
      setContentOpportunities,
      setContentPlanItems,
      addContentTask,
      openContentTaskFromAttribution,
      openContentConfirmFromTaskCenter,
      pendingContentTaskOpen,
      clearPendingContentTaskOpen,
    }),
    [
      view,
      hasDetected,
      showGuide,
      loadingDashboard,
      scanning,
      scanCompleted,
      siteId,
      funnelPeriod,
      health,
      issues,
      showP2,
      fixTarget,
      fixPhase,
      fixLogs,
      exportingPdf,
      toasts,
      trendDays,
      filteredHistory,
      taskRows,
      filteredWeekly,
      weeklyPreviewId,
      currentSite,
      funnel,
      p0Count,
      p1Count,
      p2Issues,
      priorityIssues,
      weakestDimensionKey,
      pendingTaskCount,
      adsConfigured,
      seoConfigured,
      discoveryActive,
      domainBound,
      dismissConfigIssue,
      navigate,
      dismissGuide,
      startDetect,
      goDashboard,
      goReport,
      openHealthReport,
      openWeeklyPreview,
      startFixIssue,
      startFixDimension,
      startFixTask,
      confirmManualDone,
      cancelFix,
      exportPdf,
      dismissToast,
      pushToast,
      openHistoryReport,
      attributionReport,
      attributionHistory,
      attributionTasks,
      attributionConfig,
      attributionChangeId,
      reportInitialTab,
      attributionReports,
      attributionReportId,
      activeAttributionReport,
      openAttributionReport,
      selectAttributionReport,
      selectAttributionChange,
      confirmMeasure,
      ignoreMeasure,
      markMeasureContentPublished,
      runMeasureReview,
      closeAttributionDetail,
      contentTasks,
      contentOpportunities,
      contentPlanItems,
      openContentTaskFromAttribution,
      openContentConfirmFromTaskCenter,
      pendingContentTaskOpen,
      clearPendingContentTaskOpen,
    ],
  )

  return <WorkbenchContext.Provider value={api}>{children}</WorkbenchContext.Provider>
}

export function useWorkbench() {
  const ctx = useContext(WorkbenchContext)
  if (!ctx) throw new Error('useWorkbench must be used within WorkbenchProvider')
  return ctx
}
