import {
  ArrowLeft,
  FileText,
  Globe,
  Hexagon,
  LayoutDashboard,
  MessageSquare,
  PanelsTopLeft,
  ScanSearch,
  Settings,
} from 'lucide-react'
import { Avatar, Breadcrumb, Button, ConfigProvider, Layout, Menu, Select, Tooltip } from 'antd'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { COMPANY_NAME, OPERATOR_NAME, OPERATOR_ROLE, PLATFORM_NAME } from '../data/mock'
import { useWorkbench } from '../context/WorkbenchContext'
import type { ViewId } from '../types'
import { OpsAssistantPanel } from './OpsAssistantPanel'
import { iceSelectTheme } from '../theme'

const { Sider, Header, Content } = Layout

const PORTAL_URL =
  import.meta.env.VITE_PORTAL_URL || 'http://127.0.0.1:5174/#数据分析-新'

function portalHref() {
  return new URL(PORTAL_URL, window.location.origin).toString()
}

const NAV: { id: ViewId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: '智能体概览', icon: LayoutDashboard },
  { id: 'visitor', label: '访客行为分析智能体', icon: ScanSearch },
  { id: 'marketing', label: '智能营销页智能体', icon: PanelsTopLeft },
  { id: 'content', label: '内容发布智能体', icon: FileText },
]

const SETTINGS_NAV = { id: 'settings' as const, label: '站点设置', icon: Settings }

const PAGE_META: Record<string, { title: string; crumb: string }> = {
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
  const embedView = view === 'visitor' || view === 'marketing' || view === 'content'
  const selectedKey = view === 'scanning' ? 'dashboard' : view

  const toggleAssistant = () => {
    setAssistantOpen((open) => {
      const next = !open
      if (next) setAssistantLoaded(true)
      return next
    })
  }

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

  const meta = PAGE_META[view] ?? PAGE_META.dashboard

  const menuItems = useMemo(() => NAV.map(navItem), [])
  const settingsItems = useMemo(() => [navItem(SETTINGS_NAV)], [])

  return (
    <Layout
      hasSider
      className={`admin-shell${assistantOpen ? ' has-assistant' : ''}${embedView ? ' is-embed-view' : ''}${collapsed ? ' is-sider-collapsed' : ''}`}
    >
      <Sider
        width={240}
        collapsedWidth={72}
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        theme="dark"
        classNames={{ root: 'admin-sider', body: 'admin-sider__body' }}
      >
        <Tooltip title={collapsed ? '数字门户 · 增长工作台' : undefined} placement="right">
          <div className="admin-brand">
            <span className="admin-brand__mark" aria-hidden>
              <Hexagon size={16} strokeWidth={2.2} />
            </span>
            {collapsed ? null : (
              <div>
                <strong>{PLATFORM_NAME}</strong>
                <small>增长工作台</small>
              </div>
            )}
          </div>
        </Tooltip>

        <Tooltip title={collapsed ? '返回数字门户后台' : undefined} placement="right">
          <Button
            block
            size="small"
            variant="outlined"
            color="default"
            className="admin-back-portal"
            icon={<ArrowLeft size={14} />}
            aria-label="返回数字门户后台"
            onClick={() => window.location.assign(portalHref())}
          >
            {collapsed ? null : '返回数字门户后台'}
          </Button>
        </Tooltip>

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
            <ConfigProvider theme={iceSelectTheme}>
              <Select
                id="admin-site-select"
                aria-label="切换站点"
                value={siteId}
                onChange={(value) => setSiteId(value)}
                options={sites.map((s) => ({ value: s.id, label: s.name }))}
                className="admin-site-select"
                popupMatchSelectWidth
              />
            </ConfigProvider>
            <div className="admin-site-box__url">{currentSite.url}</div>
          </div>
        )}

        {collapsed ? null : <div className="admin-nav-label-text">工作台</div>}
        <Menu
          mode="inline"
          theme="dark"
          selectedKeys={selectedKey === 'settings' ? [] : [selectedKey]}
          items={menuItems}
          tooltip={{ placement: 'right' }}
          classNames={{ root: 'admin-menu', item: 'admin-menu__item' }}
          onClick={({ key }) => navigate(key as ViewId)}
        />

        <div className="admin-sidebar__foot">
          <Menu
            mode="inline"
            theme="dark"
            selectedKeys={selectedKey === 'settings' ? ['settings'] : []}
            items={settingsItems}
            tooltip={{ placement: 'right' }}
            classNames={{ root: 'admin-menu admin-menu--foot', item: 'admin-menu__item' }}
            onClick={({ key }) => navigate(key as ViewId)}
          />
        </div>
      </Sider>

      <Layout className="admin-main">
        <Header className={`admin-topbar${embedView ? ' is-embed' : ''}`}>
          <div>
            <Breadcrumb
              className="admin-breadcrumb"
              items={[
                { title: '增长工作台' },
                { title: meta.crumb },
                { title: meta.title },
              ]}
            />
            {embedView || view === 'dashboard' ? null : (
              <h1 className="admin-page-title">{meta.title}</h1>
            )}
          </div>
          <div className="admin-topbar__right">
            <Button
              size="small"
              icon={<ArrowLeft size={14} />}
              onClick={() => window.location.assign(portalHref())}
            >
              返回数字门户
            </Button>
            <Button
              size="small"
              type={assistantOpen ? 'primary' : 'default'}
              icon={<MessageSquare size={14} />}
              onClick={toggleAssistant}
              aria-pressed={assistantOpen}
            >
              运营助手
            </Button>
            <div className="admin-user">
              <Avatar size={32} className="admin-user__avatar">
                {OPERATOR_NAME.slice(0, 1)}
              </Avatar>
              <div>
                <b>{OPERATOR_NAME}</b>
                <small>
                  {OPERATOR_ROLE} · {COMPANY_NAME}
                </small>
              </div>
            </div>
          </div>
        </Header>

        {scanning && view !== 'scanning' ? (
          <div className="admin-scan-banner">
            <strong>后台检测进行中</strong>
            <span className="muted">可继续使用智能体，完成后将返回概览</span>
          </div>
        ) : null}

        <Content className="admin-body">
          <div
            className={`admin-content${embedView ? ' is-embed' : ''}${view === 'dashboard' ? ' is-overview' : ''}`}
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
  )
}
