import { Button } from '../components/Button'
import { DIMENSION_META } from '../data/mock'
import { useWorkbench } from '../context/WorkbenchContext'
import type {
  AgentTaskModule,
  AgentTaskRow,
  DetectType,
  FixTaskRow,
  IssuePriority,
  TaskStatus,
} from '../types'
import { AGENT_MODULE_LABELS } from '../types'
import { formatDelta } from '../lib/score'

const DETECT_LABEL: Record<DetectType, string> = {
  quick: '快速检测',
  full: '全量检测',
  manual: '手动检测',
  verify: '修复验证',
}

const STATUS_LABEL: Record<TaskStatus, string> = {
  pending: '待处理',
  running: '执行中',
  waiting_verify: '待验证',
  done: '已完成',
  failed: '失败',
}

type TaskBucket = 'todo' | 'doing' | 'done'

type UnifiedTask = {
  id: string
  module: AgentTaskModule
  title: string
  summary: string
  status: TaskStatus
  priority: IssuePriority | null
  updatedAt: string
  bucket: TaskBucket
  reviewPending?: string
  attributionReportId?: string
  changeId?: string
  measureId?: string
  contentTaskId?: string
  fixTask?: FixTaskRow
  /** 内容待确认（尚未交接，无 contentTaskId） */
  pendingConfirm?: boolean
  scoreBefore?: number | null
  scoreAfter?: number | null
}

function statusClass(s: TaskStatus) {
  if (s === 'done') return 'badge badge--success'
  if (s === 'failed') return 'badge badge--danger'
  if (s === 'running' || s === 'waiting_verify') return 'badge badge--info'
  return 'badge badge--warning'
}

function moduleBadgeClass(module: AgentTaskModule) {
  if (module === 'attribution') return 'badge badge--module-attribution'
  if (module === 'content') return 'badge badge--module-content'
  return 'badge badge--module-health'
}

function bucketOf(status: TaskStatus): TaskBucket {
  if (status === 'done' || status === 'failed') return 'done'
  if (status === 'pending') return 'todo'
  return 'doing'
}

function fromAgentRow(t: AgentTaskRow): UnifiedTask {
  return {
    id: t.id,
    module: t.module,
    title: t.title,
    summary: t.summary,
    status: t.status,
    priority: t.priority,
    updatedAt: t.updatedAt,
    bucket: bucketOf(t.status),
    reviewPending: t.reviewPending,
    attributionReportId: t.attributionReportId,
    changeId: t.changeId,
    measureId: t.measureId,
    contentTaskId: t.contentTaskId,
  }
}

function fromFixRow(t: FixTaskRow): UnifiedTask {
  const dim = DIMENSION_META.find((d) => d.key === t.dimensionKey)?.name
  const mode =
    t.fixMode === 'auto' ? '接口自动' : t.fixMode === 'manual' ? '需人工完成' : '指引'
  const scoreBit =
    (t.status === 'done' || t.status === 'failed') && t.scoreBefore != null && t.scoreAfter != null
      ? ` · 维度分 ${t.scoreBefore}→${t.scoreAfter}`
      : ''
  return {
    id: t.id,
    module: 'health_fix',
    title: t.title,
    summary: `${dim ?? '健康度'} · ${mode}${scoreBit}`,
    status: t.status,
    priority: t.priority,
    updatedAt: t.updatedAt,
    bucket: bucketOf(t.status),
    fixTask: t,
    scoreBefore: t.scoreBefore,
    scoreAfter: t.scoreAfter,
  }
}

export function HistoryView() {
  const { historyRows, openHistoryReport, exportPdf } = useWorkbench()

  return (
    <div className="stack">
      <div className="page-toolbar">
        <div>
          <p className="muted">所有检测记录自动归档，支持对比与导出（PRD §13）</p>
        </div>
        <div className="row">
          <select className="admin-filter" defaultValue="all" aria-label="检测类型">
            <option value="all">全部类型</option>
            <option value="quick">快速检测</option>
            <option value="full">全量检测</option>
            <option value="manual">手动检测</option>
          </select>
        </div>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>检测时间</th>
              <th>类型</th>
              <th>综合分</th>
              <th>较上次</th>
              <th>问题</th>
              <th>操作人</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {historyRows.map((row) => {
              const delta = formatDelta(row.totalScore, row.previousScore)
              return (
                <tr key={row.id}>
                  <td className="mono">{row.detectedAt}</td>
                  <td>
                    <span className="badge badge--neutral">{DETECT_LABEL[row.detectType]}</span>
                  </td>
                  <td className="mono" style={{ fontWeight: 600 }}>
                    {row.totalScore}
                  </td>
                  <td className={delta.up ? 'delta--up' : 'delta--down'}>{delta.text}</td>
                  <td className="muted">
                    P0 {row.p0} / P1 {row.p1} / P2 {row.p2}
                  </td>
                  <td>{row.operator}</td>
                  <td>
                    <div className="row" style={{ gap: 8 }}>
                      <Button size="sm" variant="text" onClick={() => openHistoryReport(row)}>
                        查看报告
                      </Button>
                      <Button size="sm" variant="text" onClick={exportPdf}>
                        导出 PDF
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TaskSection({
  title,
  rows,
  emptyText,
  onOpenReport,
  onOpenHealth,
  onStartFix,
  onOpenContent,
  onOpenPendingContent,
}: {
  title: string
  rows: UnifiedTask[]
  emptyText: string
  onOpenReport: (reportId: string, changeId?: string) => void
  onOpenHealth: () => void
  onStartFix: (task: FixTaskRow) => void
  onOpenContent: (taskId: string) => void
  onOpenPendingContent: (changeId: string, measureId: string) => void
}) {
  return (
    <div className="table-card">
      <div className="table-card__head">
        {title}
        <span className="muted" style={{ marginLeft: 8, fontWeight: 400 }}>
          {rows.length}
        </span>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>模块</th>
            <th>任务</th>
            <th>摘要</th>
            <th>状态</th>
            <th>更新时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id}>
              <td>
                <span className={moduleBadgeClass(t.module)}>{AGENT_MODULE_LABELS[t.module]}</span>
                {t.priority ? (
                  <span
                    className={
                      t.priority === 'P0'
                        ? 'badge badge--danger'
                        : t.priority === 'P1'
                          ? 'badge badge--warning'
                          : 'badge badge--neutral'
                    }
                    style={{ marginLeft: 6 }}
                  >
                    {t.priority}
                  </span>
                ) : null}
              </td>
              <td style={{ maxWidth: 300 }}>{t.title}</td>
              <td className="muted">{t.summary}</td>
              <td>
                <span className={statusClass(t.status)}>{STATUS_LABEL[t.status]}</span>
                {t.reviewPending ? (
                  <span className="badge badge--info" style={{ marginLeft: 6 }}>
                    {t.reviewPending}
                  </span>
                ) : null}
              </td>
              <td className="mono muted">{t.updatedAt}</td>
              <td>
                {t.module === 'attribution' ? (
                  <Button
                    size="sm"
                    onClick={() =>
                      t.attributionReportId && onOpenReport(t.attributionReportId, t.changeId)
                    }
                  >
                    查看报告
                  </Button>
                ) : null}
                {t.module === 'content' ? (
                  t.contentTaskId ? (
                    <Button size="sm" onClick={() => onOpenContent(t.contentTaskId!)}>
                      打开内容任务
                    </Button>
                  ) : t.changeId && t.measureId ? (
                    <Button
                      size="sm"
                      onClick={() => onOpenPendingContent(t.changeId!, t.measureId!)}
                    >
                      去确认
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() =>
                        t.attributionReportId && onOpenReport(t.attributionReportId, t.changeId)
                      }
                    >
                      去确认
                    </Button>
                  )
                ) : null}
                {t.module === 'health_fix' ? (
                  t.fixTask &&
                  t.status !== 'done' &&
                  t.status !== 'failed' &&
                  !(t.fixTask.fixMode === 'auto' && t.status === 'running') ? (
                    <Button
                      size="sm"
                      onClick={() => onStartFix(t.fixTask!)}
                      disabled={t.status === 'running'}
                    >
                      {t.status === 'running'
                        ? '执行中'
                        : t.fixTask.fixMode === 'auto'
                          ? '立即修复'
                          : '查看指引'}
                    </Button>
                  ) : t.fixTask && t.fixTask.fixMode === 'auto' && t.status === 'running' ? (
                    <span className="muted">自动处理中</span>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={onOpenHealth}>
                      查看诊断
                    </Button>
                  )
                ) : null}
              </td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="empty-cell">
                {emptyText}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  )
}

export function TasksView() {
  const {
    taskRows,
    startFixTask,
    pendingTaskCount,
    attributionTasks,
    attributionReport,
    openAttributionReport,
    openHealthReport,
    openContentTaskFromAttribution,
    openContentConfirmFromTaskCenter,
  } = useWorkbench()

  // 内容类尚未确认：从本期报告推导待办行（站外不入队）
  const contentPendingRows: UnifiedTask[] = []
  for (const change of attributionReport.changes) {
    if (change.changeType !== 'down') continue
    for (const m of change.measures ?? []) {
      if (m.suggestedBoundary !== 'confirm') continue
      if (m.execStatus && m.execStatus !== 'pending_confirm') continue
      // 已有交接任务行则不再重复
      const already = attributionTasks.some(
        (t) => t.module === 'content' && t.measureId === m.measureId,
      )
      if (already) continue
      contentPendingRows.push({
        id: `pending-content-${m.measureId}`,
        module: 'content',
        title: m.description,
        summary: '-',
        status: 'pending',
        priority: change.severity,
        updatedAt: attributionReport.generatedAt,
        bucket: 'todo',
        attributionReportId: attributionReport.id,
        changeId: change.id,
        measureId: m.measureId,
        contentTaskId: m.contentTaskId,
        pendingConfirm: true,
      })
    }
  }

  const unified: UnifiedTask[] = [
    ...attributionTasks.map(fromAgentRow),
    ...contentPendingRows,
    ...taskRows.map(fromFixRow),
  ]

  const todo = unified.filter((t) => t.bucket === 'todo')
  const doing = unified.filter((t) => t.bucket === 'doing')
  const done = unified.filter((t) => t.bucket === 'done')

  const autoHealthTotal = unified.filter((t) => t.module === 'health_fix').length
  const autoHealthAuto = unified.filter(
    (t) =>
      t.module === 'health_fix' && (t.fixTask?.fixMode === 'auto' || (!t.fixTask && t.attributionReportId)),
  ).length
  const autoRatio = Math.round((autoHealthAuto / Math.max(autoHealthTotal, 1)) * 100)

  const sectionProps = {
    onOpenReport: openAttributionReport,
    onOpenHealth: openHealthReport,
    onStartFix: startFixTask,
    onOpenContent: (id: string) => openContentTaskFromAttribution(id, 0),
    onOpenPendingContent: openContentConfirmFromTaskCenter,
  }

  return (
    <div className="stack">
      <div className="stat-row">
        <div className="stat-card">
          <span className="muted">待办</span>
          <strong>{todo.length}</strong>
        </div>
        <div className="stat-card">
          <span className="muted">进行中</span>
          <strong>{doing.length}</strong>
        </div>
        <div className="stat-card">
          <span className="muted">已完成</span>
          <strong>{done.length}</strong>
        </div>
        <div className="stat-card">
          <span className="muted">健康度自动占比</span>
          <strong>{autoRatio}%</strong>
        </div>
      </div>

      <p className="muted" style={{ marginTop: 0 }}>
        智能体任务中心：归因报告、健康度自动修复、内容交接状态统一按「待办 / 进行中 / 已完成」查看。
        {pendingTaskCount > 0 ? ` 侧栏红点合计 ${pendingTaskCount}。` : ''}
      </p>

      <TaskSection title="待办" rows={todo} emptyText="暂无待办任务" {...sectionProps} />
      <TaskSection title="进行中" rows={doing} emptyText="暂无进行中任务" {...sectionProps} />
      <TaskSection title="已完成" rows={done} emptyText="暂无已完成记录" {...sectionProps} />
    </div>
  )
}
