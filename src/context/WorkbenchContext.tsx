import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
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

type FixPhase = 'analyzing' | 'confirm' | 'manual' | 'applying' | 'done'

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
  // 自动验证相关
  verifyCountdown: number | null  // null = 未在验证倒计时
  verifyStartScore: number | null
  navigate: (view: ViewId) => void
  dismissGuide: () => void
  startDetect: () => void
  goDashboard: () => void
  goReport: () => void
  openWeeklyPreview: (id: string | null) => void
  setSiteId: (id: string) => void
  setFunnelPeriod: (p: FunnelPeriod) => void
  setTrendDays: (d: 7 | 30) => void
  setShowP2: (v: boolean) => void
  startFixIssue: (issue: IssueItem) => void
  startFixDimension: (dimensionKey: IssueItem['dimensionKey']) => void
  startFixTask: (task: FixTaskRow) => void
  confirmApply: () => void
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
  openAttributionReport: (reportId: string, changeId?: string) => void
  selectAttributionChange: (changeId: string) => void
  confirmMeasure: (changeId: string, measureId: string) => void
  ignoreMeasure: (changeId: string, measureId: string) => void
  closeAttributionDetail: () => void
  setAttributionConfig: (cfg: AttributionConfig) => void
  setReportInitialTab: (tab: 'health' | 'attribution') => void
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
  const [showGuide, setShowGuide] = useState(() => !readGuideDismissed())
  const [loadingDashboard, setLoadingDashboard] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanCompleted, setScanCompleted] = useState(0)
  const [siteId, setSiteId] = useState(
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

  // 自动验证状态
  const [verifyCountdown, setVerifyCountdown] = useState<number | null>(null)
  const [verifyStartScore, setVerifyStartScore] = useState<number | null>(null)
  const [verifyTimer, setVerifyTimer] = useState<number | null>(null)

  // 业务指标归因（线 B）状态
  const [attributionReport, setAttributionReport] = useState<AttributionReport>(mockAttributionReport)
  const [attributionHistory] = useState<AttributionReport[]>(mockAttributionHistoryReports)
  const [attributionTasks, setAttributionTasks] = useState<AgentTaskRow[]>(mockAttributionTasks)
  const [attributionConfig, setAttributionConfig] = useState<AttributionConfig>(DEFAULT_ATTRIBUTION_CONFIG)
  const [attributionChangeId, setAttributionChangeId] = useState<string | null>(null)
  const [reportInitialTab, setReportInitialTab] = useState<'health' | 'attribution'>('health')

  const pushToast = useCallback((type: ToastItem['type'], message: string, autoDismiss = true) => {
    const id = `toast-${++toastSeq}`
    setToasts((prev) => [...prev, { id, type, message, autoDismiss }])
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const navigate = useCallback((next: ViewId) => {
    setView(next)
    if (next !== 'weekly') setWeeklyPreviewId(null)
  }, [])

  const dismissGuide = useCallback(() => {
    setShowGuide(false)
    try {
      localStorage.setItem(GUIDE_DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
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
          setView('report')
          pushToast('success', '检测完成，报告已生成')
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

  const openWeeklyPreview = useCallback((id: string | null) => {
    setWeeklyPreviewId(id)
    setView('weekly')
  }, [])

  const beginFix = useCallback((target: FixTarget) => {
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
        setFixPhase('confirm')
        setFixLogs((l) => [...l, '方案已就绪，等待确认应用'])
      } else {
        setFixPhase('manual')
      }
    }, 1400)

    if (target.issueId) {
      setTaskRows((prev) =>
        prev.map((t) =>
          t.issueId === target.issueId
            ? { ...t, status: 'running', updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') }
            : t,
        ),
      )
    }
  }, [])

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

  // 开始自动验证倒计时
  const startAutoVerify = useCallback((startScore: number) => {
    const VERIFY_SECONDS = 5 * 60 // 5分钟 = 300秒（演示用，实际是5分钟）
    let remaining = VERIFY_SECONDS

    setVerifyCountdown(remaining)
    setVerifyStartScore(startScore)
    pushToast('info', `修复已应用，${VERIFY_SECONDS / 60}分钟后将自动验证`)

    const timer = window.setInterval(() => {
      remaining -= 1
      setVerifyCountdown(remaining)

      if (remaining <= 0) {
        window.clearInterval(timer)
        setVerifyCountdown(null)
        setVerifyTimer(null)

        // 执行增量验证（重新检测）
        setScanning(true)
        setScanCompleted(0)
        setView('scanning')

        let step = 0
        const total = mockScanStepsData.length
        const scanTimer = window.setInterval(() => {
          step += 1
          setScanCompleted(step)
          if (step >= total) {
            window.clearInterval(scanTimer)
            window.setTimeout(() => {
              const next = createInitialHealth()
              next.detectedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
              next.detectType = 'verify'
              setHealth(next)
              setIssues([...mockIssuesData])
              setHasDetected(true)
              setScanning(false)

              // 对比分数变化
              const scoreChange = next.totalScore - startScore
              if (scoreChange > 0) {
                pushToast('success', `✅ 验证通过！健康度提升 ${startScore} → ${next.totalScore} 分`)
              } else if (scoreChange < 0) {
                pushToast('warning', `⚠️ 验证完成，分数下降 ${startScore} → ${next.totalScore} 分，建议重新修复`)
              } else {
                pushToast('info', `验证完成，分数无变化（${next.totalScore} 分）`)
              }

              setHistoryRows((prev) => [
                {
                  id: `dh-${Date.now()}`,
                  detectedAt: next.detectedAt,
                  detectType: 'verify',
                  totalScore: next.totalScore,
                  previousScore: next.previousScore,
                  p0: next.dimensions.filter(d => d.key === 'tech').some(d => d.rawScore < 10) ? 1 : 0,
                  p1: 2,
                  p2: 3,
                  siteId,
                  operator: '运营 Agent',
                },
                ...prev,
              ])
              setView('report')
            }, 400)
          }
        }, 380)
      }
    }, 1000)

    setVerifyTimer(timer)
  }, [pushToast, siteId])

  const confirmApply = useCallback(() => {
    if (!fixTarget) return
    setFixPhase('applying')
    setFixLogs((l) => [...l, '已调用平台接口，修改已提交'])
    window.setTimeout(() => {
      setFixPhase('done')
      const before = fixTarget.currentRaw
      const bump = fixTarget.dimensionKey === 'seo' ? 6 : 3
      applyScoreBump(fixTarget.dimensionKey, bump, fixTarget.issueId)
      const after = Math.min(20, before + bump)
      pushToast('success', `${fixTarget.title.slice(0, 18)}… 已从 ${before} → ${after} 分`)

      // 记录修复后分数，启动自动验证
      const currentScore = health.totalScore
      window.setTimeout(() => {
        setFixTarget(null)
        startAutoVerify(currentScore)
      }, 600)
    }, 1000)
  }, [applyScoreBump, fixTarget, health.totalScore, pushToast, startAutoVerify])

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

  const openHistoryReport = useCallback(
    (row: DetectHistoryRow) => {
      setSiteId(row.siteId)
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
      // 定位报告（本期或历史），设置选中变化，跳诊断报告归因 Tab
      const all = [attributionReport, ...attributionHistory]
      const found = all.find((r) => r.id === reportId)
      if (!found) return
      const firstChange = changeId ?? found.changes[0]?.id ?? null
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

  const confirmMeasure = useCallback(
    (changeId: string, measureId: string) => {
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
      pushToast('info', '措施已确认，正在调度执行…')
      // 模拟执行：2 秒后成功，T+? 复盘
      window.setTimeout(() => {
        setAttributionReport((prev) => ({
          ...prev,
          changes: prev.changes.map((c) =>
            c.id !== changeId
              ? c
              : {
                  ...c,
                  measures: c.measures?.map((m) =>
                    m.measureId === measureId ? { ...m, execStatus: 'success' as const } : m,
                  ),
                },
          ),
        }))
        pushToast('success', '措施执行成功，将进入复盘周期')
      }, 2000)
      // 模拟复盘：6 秒后回填复盘结果
      window.setTimeout(() => {
        setAttributionReport((prev) => ({
          ...prev,
          changes: prev.changes.map((c) =>
            c.id !== changeId
              ? c
              : {
                  ...c,
                  reviewResult: 'success' as const,
                  reviewNote: 'T+7 复盘：异常指标回归正常区间，措施起效。沉淀为标准措施。',
                },
          ),
        }))
        // 全部措施执行完 → 任务标 done
        setAttributionTasks((prev) =>
          prev.map((t) =>
            t.module === 'attribution' && t.status === 'running'
              ? { ...t, status: 'done', updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') }
              : t,
          ),
        )
        pushToast('success', '复盘完成：措施起效，指标回归正常')
      }, 8000)
    },
    [pushToast],
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

  const currentSite = mockSitesData.find((s) => s.id === siteId) ?? mockSitesData[0]
  const funnel = funnelPeriod === 'week' ? mockFunnelWeekData : mockFunnelMonthData
  const p0Count = issues.filter((i) => i.priority === 'P0').length
  const p1Count = issues.filter((i) => i.priority === 'P1').length
  const p2Issues = issues.filter((i) => i.priority === 'P2')
  const priorityIssues = issues.filter((i) => i.priority === 'P0' || i.priority === 'P1')
  const weakestDimensionKey = health.dimensions.reduce((min, d) =>
    d.rawScore < min.rawScore ? d : min,
  ).key
  const pendingTaskCount = taskRows.filter(
    (t) => t.status === 'pending' || t.status === 'running' || t.status === 'waiting_verify',
  ).length

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
      verifyCountdown,
      verifyStartScore,
      navigate,
      dismissGuide,
      startDetect,
      goDashboard,
      goReport,
      openWeeklyPreview,
      setSiteId,
      setFunnelPeriod,
      setTrendDays,
      setShowP2,
      startFixIssue,
      startFixDimension,
      startFixTask,
      confirmApply,
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
      openAttributionReport,
      selectAttributionChange,
      confirmMeasure,
      ignoreMeasure,
      closeAttributionDetail,
      setAttributionConfig,
      setReportInitialTab,
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
      verifyCountdown,
      verifyStartScore,
      navigate,
      dismissGuide,
      startDetect,
      goDashboard,
      goReport,
      openWeeklyPreview,
      startFixIssue,
      startFixDimension,
      startFixTask,
      confirmApply,
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
      openAttributionReport,
      selectAttributionChange,
      confirmMeasure,
      ignoreMeasure,
      closeAttributionDetail,
    ],
  )

  return <WorkbenchContext.Provider value={api}>{children}</WorkbenchContext.Provider>
}

export function useWorkbench() {
  const ctx = useContext(WorkbenchContext)
  if (!ctx) throw new Error('useWorkbench must be used within WorkbenchProvider')
  return ctx
}
