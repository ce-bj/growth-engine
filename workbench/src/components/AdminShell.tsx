import {
  BarChart3,
  BookOpen,
  ChevronDown,
  FileText,
  Filter,
  GitBranch,
  Globe,
  LayoutDashboard,
  Mail,
  MessageSquare,
  PanelsTopLeft,
  ScanSearch,
  Search,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'
import { Dropdown, Layout, Menu, Select, Tooltip } from 'antd'
import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ANALYSIS_NAV, isAnalysisView, type AnalysisViewId } from '../data/analysisNav'
import { COMPANY_NAME, OPERATOR_NAME, OPERATOR_ROLE, PLATFORM_NAME } from '../data/mock'
import {
  GROWTH_FLOW_EVENT,
  GROWTH_FLOW_STORAGE_KEY,
  approveStrategyInFlow,
  computeGrowthBoard,
  markAdviceHandledInFlow,
  publishTaskInFlow,
  readGrowthFlowState,
  skipStrategyInFlow,
  undoStrategyInFlow,
  type GrowthFlowState,
} from '../data/overviewMock'
import { useWorkbench } from '../context/WorkbenchContext'
import type { ViewId } from '../types'
import { OpsAssistantPanel } from './OpsAssistantPanel'

const { Sider, Header, Content } = Layout

function portalHref() {
  const explicit = import.meta.env.VITE_PORTAL_URL as string | undefined
  const host = window.location.hostname || '127.0.0.1'
  const url = new URL(explicit || `http://${host}:5174/`, window.location.origin)
  if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
    url.hostname = host
  }
  url.hash = '概况'
  return url.toString()
}

// 顶栏横向菜单（参考数字门户）：概况/网站管理/营销管理/客户管理/业务中心/服务中心/安全中心/数据分析/管理设置
const PORTAL_TABS: string[] = ['概况', '网站管理', '营销管理', '客户管理', '业务中心', '服务中心', '安全中心', '数据分析', '管理设置']

// 点击顶栏菜单项 → 跳转数字门户对应页签（数字门户默认端口 5174）
function openPortalTab(tab: string) {
  const host = window.location.hostname || '127.0.0.1'
  const base = (import.meta.env.VITE_PORTAL_URL as string | undefined) || `http://${host}:5174/`
  window.location.assign(`${base}#${encodeURIComponent(tab)}`)
}

type BadgeTone = 'orange' | 'blue'
type NavItem = {
  id: ViewId
  label: string
  icon: typeof LayoutDashboard
  badgeCount?: number
  badgeTone?: BadgeTone
  badgeTitle?: string
}

/**
 * 贴合老板决策动线的菜单架构（已合并「洞察」与「决策」，消除跳页断点）：
 * 第一幕（置顶独立项，无分组标题）：增长首页
 * 第二幕（Gate 1 看数即拍板）：诊断与决策 -> AI 友好度体检 / 访客洞察与策略（橙色待定策略角标）
 * 第三幕（Gate 2 保安全）：内容与页面 -> 智能营销页 / 官网内容发布（蓝色待预览发布草稿角标）
 * 底座支撑：企业大脑与助手 -> 企业知识库 / AI 运营助手
 */
const TOP_HOME_ITEM: NavItem = {
  id: 'dashboard',
  label: '增长首页',
  icon: LayoutDashboard,
}

/** 内容区自带内边距的原一期页面，需要抵消宿主内边距 */
const ONEAIVIEWS: ViewId[] = ['ready', 'credits']
/** 以 iframe 整页嵌入的外部智能体页 */
const EMBED_VIEWS: ViewId[] = ['board', 'intake', 'visitor', 'marketing', 'content', 'assistant']

const ANALYSIS_ICONS: Record<AnalysisViewId, typeof LayoutDashboard> = {
  board: LayoutDashboard,
  analysisVisit: BarChart3,
  analysisBounce: Filter,
  analysisGoogle: Search,
  analysisBehavior: GitBranch,
  analysisLeads: UserCheck,
  analysisOpsReport: Mail,
}

const PAGE_META: Record<string, { title: string; crumb: string }> = {
  board: { title: '数据分析总览', crumb: '数据分析' },
  analysisVisit: { title: '网站访问统计', crumb: '数据分析' },
  analysisBounce: { title: '落地页跳出分析', crumb: '数据分析' },
  analysisGoogle: { title: 'Google收录分析', crumb: '数据分析' },
  analysisBehavior: { title: '访问行为分析', crumb: '数据分析' },
  analysisLeads: { title: '线索转化分析', crumb: '数据分析' },
  analysisOpsReport: { title: '运营报告推送', crumb: '数据分析' },
  dashboard: { title: '增长首页', crumb: '总览' },
  ready: { title: 'AI 友好度体检', crumb: '诊断与决策' },
  intake: { title: '访客洞察与策略', crumb: '诊断与决策' },
  visitor: { title: '访客洞察与策略', crumb: '诊断与决策' },
  marketing: { title: '智能营销页', crumb: '内容与页面' },
  content: { title: '官网内容发布', crumb: '内容与页面' },
  assistant: { title: 'AI 运营助手', crumb: '企业大脑与助手' },
  knowledge: { title: '企业知识库', crumb: '企业大脑与助手' },
  geoMonitor: { title: 'GEO 信源监测', crumb: '内容与页面' },
  settings: { title: '站点设置', crumb: '配置' },
  scanning: { title: '正在检测', crumb: '站点' },
}

function renderNavItem(item: NavItem) {
  const Icon = item.icon
  const showBadge = typeof item.badgeCount === 'number' && item.badgeCount > 0
  return {
    key: item.id,
    icon: <Icon size={16} />,
    label: showBadge ? (
      <span className="admin-nav-with-beta" title={item.badgeTitle || item.label}>
        <span>{item.label}</span>
        <span
          className={`admin-nav-count-badge ${item.badgeTone === 'blue' ? 'is-blue' : 'is-orange'}`}
          aria-label={item.badgeTitle || `${item.badgeCount} 项待处理`}
        >
          {item.badgeCount}
        </span>
      </span>
    ) : (
      item.label
    ),
    title: item.badgeTitle ? `${item.label}（${item.badgeTitle}：${item.badgeCount ?? 0}）` : item.label,
  }
}

export function AdminShell({ children }: { children: ReactNode }) {
  const {
    view,
    navigate,
    currentSite,
    sites,
    siteId,
    setSiteId,
    pushToast,
  } = useWorkbench()
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [flowState, setFlowState] = useState<GrowthFlowState>(() => readGrowthFlowState())

  const board = useMemo(() => computeGrowthBoard(flowState), [flowState])

  useEffect(() => {
    const syncFlow = () => setFlowState(readGrowthFlowState())
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === GROWTH_FLOW_STORAGE_KEY) syncFlow()
    }
    window.addEventListener(GROWTH_FLOW_EVENT, syncFlow)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(GROWTH_FLOW_EVENT, syncFlow)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const navGroups = useMemo(
    () => [
      {
        title: '诊断与决策',
        items: [
          { id: 'ready' as ViewId, label: 'AI 友好度体检', icon: ShieldCheck },
          {
            id: 'visitor' as ViewId,
            label: '访客洞察与策略',
            icon: ScanSearch,
            badgeCount: board.pendingStrategyCount,
            badgeTone: 'orange' as BadgeTone,
            badgeTitle: '待定策略数',
          },
        ],
      },
      {
        title: '内容与页面',
        items: [
          {
            id: 'marketing' as ViewId,
            label: '智能营销页',
            icon: PanelsTopLeft,
            badgeCount: board.marketingPublishCount,
            badgeTone: 'blue' as BadgeTone,
            badgeTitle: '待预览发布草稿数',
          },
          {
            id: 'content' as ViewId,
            label: '官网内容发布',
            icon: FileText,
            badgeCount: board.contentPublishCount,
            badgeTone: 'blue' as BadgeTone,
            badgeTitle: '待预览发布草稿数',
          },
        ],
      },
      {
        title: '企业大脑与助手',
        items: [
          { id: 'knowledge' as ViewId, label: '企业知识库', icon: BookOpen },
          { id: 'assistant' as ViewId, label: 'AI 运营助手', icon: MessageSquare },
        ],
      },
    ],
    [board.pendingStrategyCount, board.marketingPublishCount, board.contentPublishCount],
  )

  const embedView = EMBED_VIEWS.includes(view)
  const analysisView = isAnalysisView(view)
  const selectedKey = view === 'scanning' ? 'dashboard' : view === 'intake' ? 'visitor' : view
  const dataAnalysisCurrent = analysisView

  useEffect(() => {
    const onOpen = () => setAssistantOpen(true)
    window.addEventListener('growth-open-assistant', onOpen)
    return () => window.removeEventListener('growth-open-assistant', onOpen)
  }, [])

  useEffect(() => {
    const known = new Set<string>([
      TOP_HOME_ITEM.id,
      ...navGroups.flatMap((g) => g.items).map((item) => item.id),
      ...ANALYSIS_NAV.map((item) => item.id),
    ])
    const onMessage = (event: MessageEvent) => {
      const data = event.data as {
        type?: string
        view?: string
        focusKey?: string
        focusKeys?: string[]
        action?: 'approve' | 'skip' | 'undo' | 'publish' | 'advice-done' | 'advice-undo'
        reason?: string
        title?: string
      } | null
      if (!data?.type) return

      if (data.type === 'growth-navigate' && data.view) {
        const normalizedView = data.view === 'intake' ? 'visitor' : data.view
        if (!known.has(normalizedView)) return
        if (normalizedView === 'visitor' || data.focusKey || data.focusKeys?.length) {
          window.dispatchEvent(
            new CustomEvent('growth-focus-strategy', {
              detail: { view: normalizedView, focusKey: data.focusKey, focusKeys: data.focusKeys },
            }),
          )
        }
        navigate(normalizedView as ViewId)
        return
      }

      if (data.type === 'growth-flow-ready') {
        const target = event.source as Window | null
        target?.postMessage({ type: 'growth-flow-sync', flow: readGrowthFlowState() }, '*')
        return
      }

      if (data.type === 'growth-flow-update' && data.focusKey) {
        if (data.action === 'approve') {
          approveStrategyInFlow(data.focusKey)
          pushToast('success', `已同意策略「${data.title || data.focusKey}」，AI 已生成草稿并进入待预览发布`)
        } else if (data.action === 'skip') {
          skipStrategyInFlow(data.focusKey, data.reason || '暂不处理')
        } else if (data.action === 'undo') {
          undoStrategyInFlow(data.focusKey)
        } else if (data.action === 'publish') {
          publishTaskInFlow(data.focusKey)
          pushToast('success', `「${data.title || '草稿'}」已确认发布上线，并计入增长首页本周已完成`)
        } else if (data.action === 'advice-done') {
          markAdviceHandledInFlow(data.focusKey, true)
        } else if (data.action === 'advice-undo') {
          markAdviceHandledInFlow(data.focusKey, false)
        }
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [navigate, navGroups, pushToast])

  useEffect(() => {
    if (!assistantOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAssistantOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [assistantOpen])

  /** 是否进入了原「一期工作台」的页面（内容区自带内边距，需要抵消宿主内边距） */
  const isOneAiPage = ONEAIVIEWS.includes(view)

  const topHomeMenu = useMemo(() => [renderNavItem(TOP_HOME_ITEM)], [])
  const renderedGroups = useMemo(
    () => navGroups.map((group) => ({ ...group, menuItems: group.items.map(renderNavItem) })),
    [navGroups],
  )

  return (
    <Layout
      className={`admin-shell${embedView ? ' is-embed-view' : ''}${analysisView ? ' is-analysis-view' : ''}${collapsed ? ' is-sider-collapsed' : ''}`}
    >
      <Header className={`admin-topbar${embedView ? ' is-embed' : ''}`}>
        <div className="admin-topbar__left">
          <div
            className="admin-brand is-clickable"
            role="button"
            tabIndex={0}
            title="返回数字门户"
            onClick={() => window.location.assign(portalHref())}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                window.location.assign(portalHref())
              }
            }}
          >
            <span className="admin-brand__mark" aria-hidden>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.2">
                <circle cx="12" cy="12" r="9" />
                <ellipse cx="12" cy="12" rx="9" ry="3.6" />
                <ellipse cx="12" cy="12" rx="4.2" ry="9" />
                <path d="M3.6 9h16.8M3.6 15h16.8" />
              </svg>
            </span>
            <span className="admin-brand__text">
              <strong>{PLATFORM_NAME}</strong>
              <small>CE DIGITAL PORTAL</small>
            </span>
          </div>

          <nav className="admin-portalnav" aria-label="数字门户菜单">
            {PORTAL_TABS.map((t) => (
              <button
                key={t}
                type="button"
                className={`admin-portalnav__item${t === '数据分析' && dataAnalysisCurrent ? ' is-current' : ''}`}
                aria-current={t === '数据分析' && dataAnalysisCurrent ? 'page' : undefined}
                onClick={() => {
                  if (t === '数据分析') {
                    navigate('board')
                    return
                  }
                  openPortalTab(t)
                }}
              >
                {t}
              </button>
            ))}
            {/* 本项目入口：紧邻「管理设置」放置，在工作台页保持选中态 */}
            <Tooltip title="营销增长工作台 · 返回增长首页">
              <button
                type="button"
                className={`admin-portalnav__item admin-portalnav__ai${dataAnalysisCurrent ? '' : ' is-current'}`}
                aria-label="营销增长工作台 · 返回增长首页"
                aria-current={dataAnalysisCurrent ? undefined : 'page'}
                onClick={() => navigate('dashboard')}
              >
                <img src="/ai-icon.png" alt="" />
              </button>
            </Tooltip>
          </nav>
        </div>

        <div className="admin-topbar__right">
          <div className="admin-portalicons">
            <Tooltip title="搜索（待接入）">
              <span className="admin-portalicon is-static" aria-hidden>
                <Search size={17} />
              </span>
            </Tooltip>
          </div>

          <Dropdown
            placement="bottomRight"
            menu={{
              items: [
                {
                  key: 'who',
                  label: `${OPERATOR_NAME} · ${OPERATOR_ROLE} · ${COMPANY_NAME}`,
                  disabled: true,
                },
                { type: 'divider' as const },
                { key: 'portal', label: '返回数字门户' },
              ],
              onClick: ({ key }) => {
                if (key === 'portal') window.location.assign(portalHref())
              },
            }}
          >
            <button type="button" className="admin-account" aria-label="账号菜单">
              <span className="admin-account__name">{OPERATOR_NAME}</span>
              <ChevronDown size={14} />
            </button>
          </Dropdown>
        </div>
      </Header>

      <Layout hasSider className="admin-body-row">
        <Sider
          width={analysisView ? 200 : 248}
          collapsedWidth={analysisView ? 200 : 72}
          collapsible={!analysisView}
          collapsed={analysisView ? false : collapsed}
          onCollapse={(value) => setCollapsed(value)}
          trigger={analysisView ? null : undefined}
          theme="light"
          classNames={{ root: 'admin-sider', body: 'admin-sider__body' }}
        >
          {analysisView ? (
            <>
              <div className="admin-analysis-title">数据分析</div>
              <Menu
                mode="inline"
                theme="light"
                selectedKeys={[selectedKey]}
                items={ANALYSIS_NAV.map((item) => {
                  const Icon = ANALYSIS_ICONS[item.id]
                  return {
                    key: item.id,
                    icon: <Icon size={16} />,
                    label: item.label,
                    title: item.label,
                  }
                })}
                classNames={{ root: 'admin-menu admin-menu--analysis', item: 'admin-menu__item' }}
                onClick={({ key }) => navigate(key as ViewId)}
              />
            </>
          ) : (
            <>
              {collapsed ? (
                <Tooltip title={`${currentSite.name} · ${currentSite.url}`} placement="right">
                  <button
                    type="button"
                    className="admin-site-mini"
                    aria-label={`当前站点 ${currentSite.name}`}
                    onClick={() => setCollapsed(false)}
                  >
                    <Globe size={16} />
                  </button>
                </Tooltip>
              ) : (
                <div className="admin-site-box">
                  <label className="admin-site-box__label" htmlFor="admin-site-select">
                    当前站点
                  </label>
                  <Select
                    id="admin-site-select"
                    aria-label="切换站点"
                    value={siteId}
                    onChange={(value) => setSiteId(value)}
                    options={sites.map((s) => ({ value: s.id, label: s.name }))}
                    className="admin-site-select"
                    popupMatchSelectWidth
                  />
                  <div className="admin-site-box__url">{currentSite.url}</div>
                </div>
              )}

              {/* 第一幕：置顶独立项（无分组标题）—— 增长首页 */}
              <div className="admin-top-home-wrap">
                <Menu
                  mode="inline"
                  theme="light"
                  selectedKeys={selectedKey === TOP_HOME_ITEM.id ? [TOP_HOME_ITEM.id] : []}
                  items={topHomeMenu}
                  classNames={{ root: 'admin-menu admin-menu--plain admin-menu--top-home', item: 'admin-menu__item' }}
                  onClick={({ key }) => navigate(key as ViewId)}
                />
              </div>

              {/* 第二幕 ~ 底座支撑 */}
              {renderedGroups.map((group) => (
                <Fragment key={group.title}>
                  {collapsed ? null : <div className="admin-nav-label-text">{group.title}</div>}
                  <Menu
                    mode="inline"
                    theme="light"
                    selectedKeys={
                      group.items.some((item) => item.id === selectedKey) ? [selectedKey] : []
                    }
                    items={group.menuItems}
                    classNames={{ root: 'admin-menu admin-menu--plain', item: 'admin-menu__item' }}
                    onClick={({ key }) => navigate(key as ViewId)}
                  />
                </Fragment>
              ))}
            </>
          )}
        </Sider>

        <Layout className="admin-main">
          <Content className="admin-body">
            <div
              className={`admin-content${embedView ? ' is-embed' : ''}${view === 'dashboard' ? ' is-overview' : ''}${
                isOneAiPage ? ' is-oneai' : ''
              }${analysisView && view !== 'board' ? ' is-analysis-legacy' : ''}`}
            >
              {children}
            </div>
          </Content>
        </Layout>
      </Layout>

      <OpsAssistantPanel
        open={assistantOpen}
        view={view}
        onOpen={() => setAssistantOpen(true)}
        onClose={() => setAssistantOpen(false)}
      />
    </Layout>
  )
}
