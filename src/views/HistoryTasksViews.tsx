import { Button } from '../components/Button'
import { DIMENSION_META } from '../data/mock'
import { useWorkbench } from '../context/WorkbenchContext'
import type { DetectType, TaskStatus } from '../types'
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

function statusClass(s: TaskStatus) {
  if (s === 'done') return 'badge badge--success'
  if (s === 'failed') return 'badge badge--danger'
  if (s === 'running' || s === 'waiting_verify') return 'badge badge--info'
  return 'badge badge--warning'
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

export function TasksView() {
  const { taskRows, startFixTask, pendingTaskCount, attributionTasks, openAttributionReport } =
    useWorkbench()
  const open = taskRows.filter((t) => t.status !== 'done' && t.status !== 'failed')
  const done = taskRows.filter((t) => t.status === 'done' || t.status === 'failed')
  const openAttribution = attributionTasks.filter(
    (t) => t.status !== 'done' && t.status !== 'failed',
  )
  const doneAttribution = attributionTasks.filter(
    (t) => t.status === 'done' || t.status === 'failed',
  )
  const totalPending = pendingTaskCount + openAttribution.length

  return (
    <div className="stack">
      <div className="stat-row">
        <div className="stat-card">
          <span className="muted">待处理</span>
          <strong>{totalPending}</strong>
        </div>
        <div className="stat-card">
          <span className="muted">本周已完成</span>
          <strong>{done.length + doneAttribution.length}</strong>
        </div>
        <div className="stat-card">
          <span className="muted">自动修复占比</span>
          <strong>
            {Math.round(
              (taskRows.filter((t) => t.fixMode === 'auto').length / Math.max(taskRows.length, 1)) *
                100,
            )}
            %
          </strong>
        </div>
      </div>

      {/* ── 归因分析任务（线 B） ── */}
      <div className="table-card">
        <div className="table-card__head">归因分析报告</div>
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
            {openAttribution.map((t) => (
              <tr key={t.id}>
                <td>
                  <span className="badge badge--module-attribution">归因分析</span>
                </td>
                <td style={{ maxWidth: 280 }}>{t.title}</td>
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
                  <Button
                    size="sm"
                    onClick={() => t.attributionReportId && openAttributionReport(t.attributionReportId)}
                  >
                    查看报告
                  </Button>
                </td>
              </tr>
            ))}
            {openAttribution.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-cell">
                  暂无待处理归因报告
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* ── 健康度修复任务（线 A） ── */}
      <div className="table-card">
        <div className="table-card__head">健康度修复任务</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>模块</th>
              <th>优先级</th>
              <th>任务</th>
              <th>维度</th>
              <th>方式</th>
              <th>状态</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {open.map((t) => (
              <tr key={t.id}>
                <td>
                  <span className="badge badge--module-health">健康度修复</span>
                </td>
                <td>
                  <span
                    className={
                      t.priority === 'P0'
                        ? 'badge badge--danger'
                        : t.priority === 'P1'
                          ? 'badge badge--warning'
                          : 'badge badge--neutral'
                    }
                  >
                    {t.priority}
                  </span>
                </td>
                <td style={{ maxWidth: 280 }}>{t.title}</td>
                <td className="muted">
                  {DIMENSION_META.find((d) => d.key === t.dimensionKey)?.name}
                </td>
                <td className="muted">
                  {t.fixMode === 'auto' ? '接口自动' : t.fixMode === 'manual' ? '人工确认' : '指引'}
                </td>
                <td>
                  <span className={statusClass(t.status)}>{STATUS_LABEL[t.status]}</span>
                </td>
                <td className="mono muted">{t.updatedAt}</td>
                <td>
                  <Button
                    size="sm"
                    onClick={() => startFixTask(t)}
                    disabled={t.status === 'running'}
                  >
                    {t.status === 'running' ? '执行中' : '立即修复'}
                  </Button>
                </td>
              </tr>
            ))}
            {open.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-cell">
                  暂无待处理任务
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="table-card">
        <div className="table-card__head">已完成记录</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>模块</th>
              <th>任务</th>
              <th>维度/摘要</th>
              <th>分数变化</th>
              <th>完成时间</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {doneAttribution.map((t) => (
              <tr key={t.id}>
                <td>
                  <span className="badge badge--module-attribution">归因分析</span>
                </td>
                <td>{t.title}</td>
                <td className="muted">{t.summary}</td>
                <td className="mono">—</td>
                <td className="mono muted">{t.updatedAt}</td>
                <td>
                  <span className={statusClass(t.status)}>{STATUS_LABEL[t.status]}</span>
                </td>
              </tr>
            ))}
            {done.map((t) => (
              <tr key={t.id}>
                <td>
                  <span className="badge badge--module-health">健康度修复</span>
                </td>
                <td>{t.title}</td>
                <td className="muted">
                  {DIMENSION_META.find((d) => d.key === t.dimensionKey)?.name}
                </td>
                <td className="mono">
                  {t.scoreBefore ?? '—'} → {t.scoreAfter ?? '—'}
                </td>
                <td className="mono muted">{t.updatedAt}</td>
                <td>
                  <span className={statusClass(t.status)}>{STATUS_LABEL[t.status]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
