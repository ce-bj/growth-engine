import {
  BookOpen,
  ChartColumn,
  ChevronDown,
  Coins,
  FileText,
  Globe,
  LayoutDashboard,
  MessageSquare,
  PanelsTopLeft,
  ScanSearch,
  Search,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import { ConfigProvider, Dropdown, Layout, Menu, Select, Tooltip } from 'antd'
import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react'
import { COMPANY_NAME, OPERATOR_NAME, OPERATOR_ROLE, PLATFORM_NAME } from '../data/mock'
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
const PORTAL_TABS: string[] = ["概况", "网站管理", "营销管理", "客户管理", "业务中心", "服务中心", "安全中心", "数据分析", "管理设置"];

// 点击顶栏菜单项 → 跳转数字门户对应页签（数字门户默认端口 5174）
function openPortalTab(tab: string) {
  const host = window.location.hostname || '127.0.0.1'
  const base = (import.meta.env.VITE_PORTAL_URL as string | undefined) || `http://${host}:5174/`
  window.location.assign(`${base}#${encodeURIComponent(tab)}`)
}

type NavItem = { id: ViewId; label: string; icon: typeof LayoutDashboard }

/** 侧栏按增长闭环的动作分组：看结果 → 找原因 → 干活 → 支撑与配置 */
const NAV_GROUPS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: '概览',
    items: [
      { id: 'board', label: '数据看板', icon: ChartColumn },
      { id: 'dashboard', label: '智能体概览', icon: LayoutDashboard },
    ],
  },
  {
    title: '诊断分析',
    items: [
      { id: 'ready', label: 'AI 友好度', icon: ShieldCheck },
    ],
  },
  {
    title: '执行生产',
    items: [
      { id: 'visitor', label: '访客行为分析智能体', icon: ScanSearch },
      { id: 'marketing', label: '智能营销页智能体', icon: PanelsTopLeft },
      { id: 'content', label: '内容发布智能体', icon: FileText },
      { id: 'assistant', label: 'AI运营助手', icon: MessageSquare },
    ],
  },
  {
    title: '支撑与配置',
    items: [
      { id: 'knowledge', label: '知识库', icon: BookOpen },
      { id: 'settings', label: '站点设置', icon: Settings },
    ],
  },
]

/** 侧栏底部独立一块：账户类，不归入任何分组 */
const FOOT_NAV: NavItem[] = [
  { id: 'credits', label: '积分余额', icon: Coins },
]
/** 内容区自带内边距的原一期页面，需要抵消宿主内边距 */
const ONEAIVIEWS: ViewId[] = ['ready', 'credits']
/** 以 iframe 整页嵌入的外部智能体页 */
const EMBED_VIEWS: ViewId[] = ['board', 'visitor', 'marketing', 'content', 'assistant']

const PAGE_META: Record<string, { title: string; crumb: string }> = {
  board: { title: '数据看板', crumb: '概览' },
  dashboard: { title: '智能体概览', crumb: '概览' },
  visitor: { title: '访客行为分析智能体', crumb: '智能体' },
  marketing: { title: '智能营销页智能体', crumb: '智能体' },
  content: { title: '内容发布智能体', crumb: '智能体' },
  settings: { title: '站点设置', crumb: '配置' },
  scanning: { title: '正在检测', crumb: '站点' },
}

function navItem(item: { id: ViewId; label: string; icon: typeof LayoutDashboard }) {
  const Icon = item.icon
  return {
    key: item.id,
    icon: <Icon size={16} />,
    label: item.label,
    title: item.label,
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
    scanning,
  } = useWorkbench()
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [assistantLoaded, setAssistantLoaded] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const embedView = EMBED_VIEWS.includes(view)
  const selectedKey = view === 'scanning' ? 'dashboard' : view

  useEffect(() => {
    const onOpen = () => {
      setAssistantLoaded(true)
      setAssistantOpen(true)
    }
    window.addEventListener('growth-open-assistant', onOpen)
    return () => window.removeEventListener('growth-open-assistant', onOpen)
  }, [])

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

  const navGroups = useMemo(
    () => NAV_GROUPS.map((group) => ({ ...group, menuItems: group.items.map(navItem) })),
    [],
  )
  const footItems = useMemo(() => FOOT_NAV.map(navItem), [])

  return (
    <Layout
      className={`admin-shell${assistantOpen ? ' has-assistant' : ''}${embedView ? ' is-embed-view' : ''}${collapsed ? ' is-sider-collapsed' : ''}`}
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
                className="admin-portalnav__item"
                onClick={() => openPortalTab(t)}
              >
                {t}
              </button>
            ))}
            {/* 本项目入口：紧邻「管理设置」放置，在当前项目内保持选中态 */}
            <Tooltip title="AI 工作台 · 返回本项目">
              <button
                type="button"
                className="admin-portalnav__item admin-portalnav__ai is-current"
                aria-label="AI 工作台 · 返回本项目"
                aria-current="page"
                onClick={() => navigate('board')}
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
            <Tooltip title="站点设置">
              <button
                type="button"
                className="admin-portalicon"
                aria-label="站点设置"
                onClick={() => navigate('settings')}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
                  <path d="M3.5 14.5c2 0 2.5-2 4.5-2s2.5 2 4.5 2 2.5-2 4.5-2 2.5 2 3.5 2" />
                </svg>
              </button>
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
          width={220}
          collapsedWidth={72}
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          theme="light"
          classNames={{ root: 'admin-sider', body: 'admin-sider__body' }}
        >
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

          {navGroups.map((group) => (
            <Fragment key={group.title}>
              {collapsed ? null : <div className="admin-nav-label-text">{group.title}</div>}
              <Menu
                mode="inline"
                theme="light"
                selectedKeys={
                  group.items.some((item) => item.id === selectedKey) ? [selectedKey] : []
                }
                items={group.menuItems}
                tooltip={{ placement: 'right' }}
                classNames={{ root: 'admin-menu admin-menu--plain', item: 'admin-menu__item' }}
                onClick={({ key }) => navigate(key as ViewId)}
              />
            </Fragment>
          ))}

          <div className="admin-sidebar__foot">
            <Menu
              mode="inline"
              theme="light"
              selectedKeys={FOOT_NAV.some((item) => item.id === view) ? [view] : []}
              items={footItems}
              tooltip={{ placement: 'right' }}
              classNames={{ root: 'admin-menu admin-menu--foot', item: 'admin-menu__item' }}
              onClick={({ key }) => navigate(key as ViewId)}
            />
          </div>
        </Sider>

        <Layout className="admin-main">
          {scanning && view !== 'scanning' ? (
            <div className="admin-scan-banner">
              <strong>后台检测进行中</strong>
              <span className="muted">可继续使用智能体，完成后将返回概览</span>
            </div>
          ) : null}

          <Content className="admin-body">
            <div
              className={`admin-content${embedView ? ' is-embed' : ''}${view === 'dashboard' ? ' is-overview' : ''}${isOneAiPage ? ' is-oneai' : ''}`}
            >
              {children}
            </div>
            <OpsAssistantPanel
              open={assistantOpen}
              loaded={assistantLoaded}
              onClose={() => setAssistantOpen(false)}
            />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
}
