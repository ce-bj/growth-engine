import {
  Activity,
  ChevronDown,
  ClipboardList,
  FileBarChart2,
  FileText,
  LayoutDashboard,
  RefreshCw,
  Settings,
  Sparkles,
  UserCheck,
  Wrench,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { COMPANY_NAME, OPERATOR_NAME, OPERATOR_ROLE, PLATFORM_NAME } from '../data/mock'
import { useWorkbench } from '../context/WorkbenchContext'
import type { ViewId } from '../types'
import { Button } from './Button'
import { scoreColor, scoreLevel, scoreLevelBadgeClass, scoreLevelLabel } from '../lib/score'

const NAV: { id: ViewId; label: string; icon: typeof LayoutDashboard; badge?: 'tasks' }[] = [
  { id: 'dashboard', label: '数据看板', icon: LayoutDashboard },
  { id: 'report', label: '诊断报告', icon: FileBarChart2 },
  { id: 'tasks', label: '智能体任务中心', icon: Wrench, badge: 'tasks' },
  { id: 'content', label: '内容运营', icon: FileText },
  { id: 'leads', label: '线索管理', icon: UserCheck },
  { id: 'history', label: '检测历史', icon: ClipboardList },
  { id: 'weekly', label: '周报中心', icon: Activity },
  { id: 'settings', label: '站点设置', icon: Settings },
]

const PAGE_META: Record<string, { title: string; crumb: string }> = {
  dashboard: { title: '数据看板', crumb: '概览' },
  report: { title: '诊断报告', crumb: '诊断' },
  tasks: { title: '智能体任务中心', crumb: '执行' },
  content: { title: '内容运营', crumb: '运营' },
  history: { title: '检测历史', crumb: '档案' },
  weekly: { title: '周报中心', crumb: '运营' },
  settings: { title: '站点设置', crumb: '配置' },
  scanning: { title: '正在检测', crumb: '诊断' },
}

export function AdminShell({ children }: { children: ReactNode }) {
  const {
    view,
    navigate,
    currentSite,
    sites,
    siteId,
    setSiteId,
    startDetect,
    scanning,
    health,
    pendingTaskCount,
    p0Count,
    p1Count,
  } = useWorkbench()

  const meta = PAGE_META[view] ?? PAGE_META.dashboard
  const level = scoreLevel(health.totalScore)

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand__mark">
            <Sparkles size={16} />
          </span>
          <div>
            <strong>{PLATFORM_NAME}</strong>
            <small>增长工作台</small>
          </div>
        </div>

        <div className="admin-site-box">
          <label className="admin-site-box__label">当前站点</label>
          <div className="admin-site-select">
            <select value={siteId} onChange={(e) => setSiteId(e.target.value)} aria-label="切换站点">
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="admin-site-select__icon" />
          </div>
          <div className="admin-site-box__url">{currentSite.url}</div>
        </div>

        <nav className="admin-nav">
          <div className="admin-nav__label">工作台</div>
          {NAV.map((item) => {
            const Icon = item.icon
            const active = view === item.id || (view === 'scanning' && item.id === 'report')
            const badge =
              item.badge === 'tasks' && pendingTaskCount > 0 ? pendingTaskCount : null
            return (
              <button
                key={item.id}
                type="button"
                className={`admin-nav__item${active ? ' is-active' : ''}`}
                onClick={() => navigate(item.id)}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                {badge ? <i className="admin-nav__badge">{badge}</i> : null}
              </button>
            )
          })}
        </nav>

        <div className="admin-sidebar__foot">
          <div className="admin-score-mini">
            <span className="muted">综合健康度</span>
            <strong style={{ color: scoreColor(health.totalScore) }}>{health.totalScore}</strong>
            <span className={scoreLevelBadgeClass(level)}>{scoreLevelLabel(level)}</span>
          </div>
          {(p0Count > 0 || p1Count > 0) && (
            <button type="button" className="admin-alert-chip" onClick={() => navigate('tasks')}>
              {p0Count + p1Count} 个问题待处理
            </button>
          )}
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <div className="admin-breadcrumb">
              <span>增长工作台</span>
              <span>/</span>
              <span>{meta.crumb}</span>
              <span>/</span>
              <strong>{meta.title}</strong>
            </div>
            <h1 className="admin-page-title">{meta.title}</h1>
          </div>
          <div className="admin-topbar__right">
            {view !== 'scanning' ? (
              <Button size="sm" variant="secondary" onClick={startDetect} disabled={scanning}>
                <RefreshCw size={14} />
                重新检测
              </Button>
            ) : null}
            <div className="admin-user">
              <div className="admin-user__avatar">{OPERATOR_NAME.slice(0, 1)}</div>
              <div>
                <b>{OPERATOR_NAME}</b>
                <small>
                  {OPERATOR_ROLE} · {COMPANY_NAME}
                </small>
              </div>
            </div>
          </div>
        </header>

        {scanning && view !== 'scanning' ? (
          <div className="admin-scan-banner">
            <strong>后台检测进行中</strong>
            <span className="muted">可继续浏览其他页面，完成后将自动打开报告</span>
          </div>
        ) : null}

        <div className="admin-content">{children}</div>
      </div>
    </div>
  )
}
