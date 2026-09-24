import { useMemo, useState } from 'react'
import { ArrowLeft, Globe, Hexagon, LayoutDashboard, MessageSquare } from 'lucide-react'
import { Avatar, Breadcrumb, Button, ConfigProvider, Layout, Menu, Select, Tooltip } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import AIReady from './AIReady.jsx'
import Assistant from './Assistant.jsx'
import 'antd/dist/reset.css'
import './shell.css'

const { Sider, Header, Content } = Layout

const PORTAL = {
  brand: '#3B9FD0',
  brandSoft: 'rgba(59, 159, 208, 0.12)',
  canvas: '#F5F7FA',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  text: '#1E293B',
  textSecondary: '#475569',
}

const SITES = [
  { id: 'site-en', name: '全英文站', url: 'www.example.com' },
  { id: 'site-es', name: '西班牙语站', url: 'es.example.com' },
  { id: 'site-ja', name: '日语站', url: 'jp.example.com' },
]

const NAV = [
  { id: 'dashboard', label: 'AI Ready', icon: LayoutDashboard },
  { id: 'assistant', label: 'AI运营助手', icon: MessageSquare },
]

function portalHref() {
  const host = window.location.hostname || '127.0.0.1'
  return `http://${host}:5174/#概况`
}

function Placeholder({ title }) {
  return (
    <div className="p-10 max-w-3xl">
      <h1 className="text-xl font-bold text-gray-800">{title}</h1>
      <p className="mt-2 text-sm text-gray-500">这一页还没接内容。</p>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [siteId, setSiteId] = useState(SITES[0].id)
  const [collapsed, setCollapsed] = useState(false)
  const site = SITES.find((item) => item.id === siteId) || SITES[0]
  const current = NAV.find((item) => item.id === page) || NAV[0]

  const menuItems = useMemo(
    () =>
      NAV.map((item) => {
        const Icon = item.icon
        return {
          key: item.id,
          icon: <Icon size={16} />,
          label: item.label,
          title: item.label,
        }
      }),
    [],
  )

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: PORTAL.brand,
          colorInfo: PORTAL.brand,
          colorBgLayout: PORTAL.canvas,
          colorBgContainer: PORTAL.surface,
          colorBorder: PORTAL.border,
          colorText: PORTAL.text,
          colorTextSecondary: PORTAL.textSecondary,
          borderRadius: 6,
          borderRadiusLG: 8,
          fontFamily: '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", "Segoe UI", sans-serif',
          controlOutline: 'rgba(59, 159, 208, 0.28)',
        },
        components: {
          Layout: {
            headerBg: PORTAL.brand,
            headerColor: '#ffffff',
            headerHeight: 56,
            headerPadding: '0 20px',
            siderBg: PORTAL.surface,
            lightSiderBg: PORTAL.surface,
            bodyBg: PORTAL.canvas,
            triggerBg: PORTAL.canvas,
            triggerColor: PORTAL.brand,
            lightTriggerBg: PORTAL.canvas,
            lightTriggerColor: PORTAL.brand,
          },
          Menu: {
            itemBg: 'transparent',
            itemColor: PORTAL.textSecondary,
            itemHoverBg: PORTAL.brandSoft,
            itemHoverColor: PORTAL.brand,
            itemSelectedBg: PORTAL.brandSoft,
            itemSelectedColor: PORTAL.brand,
            itemActiveBg: PORTAL.brandSoft,
            itemBorderRadius: 6,
            itemMarginInline: 8,
            itemMarginBlock: 2,
            itemHeight: 40,
            iconSize: 16,
          },
          Breadcrumb: {
            itemColor: 'rgba(255,255,255,0.72)',
            lastItemColor: '#ffffff',
            separatorColor: 'rgba(255,255,255,0.45)',
          },
        },
      }}
    >
      <Layout className={`admin-shell${collapsed ? ' is-sider-collapsed' : ''}`}>
        <Header className="admin-topbar">
          <div className="admin-topbar__left">
            <div className="admin-brand">
              <span className="admin-brand__mark" aria-hidden>
                <Hexagon size={16} strokeWidth={2.2} />
              </span>
              <div>
                <strong>数字门户</strong>
                <small>增长工作台</small>
              </div>
            </div>
            <Button
              size="small"
              className="admin-topbar__btn"
              icon={<ArrowLeft size={14} />}
              onClick={() => window.location.assign(portalHref())}
            >
              返回数字门户
            </Button>
            <Breadcrumb
              className="admin-breadcrumb"
              items={
                page === 'dashboard'
                  ? [{ title: '增长工作台' }, { title: 'AI Ready' }, { title: 'AI 友好性保障' }]
                  : [{ title: '增长工作台' }, { title: 'AI运营助手' }]
              }
            />
          </div>
          <div className="admin-topbar__right">
            <div className="admin-user">
              <Avatar size={32} className="admin-user__avatar">
                张
              </Avatar>
              <div>
                <b>张敏</b>
                <small>市场运营 · Example Trading Co.</small>
              </div>
            </div>
          </div>
        </Header>

        <Layout hasSider className="admin-body-row">
          <Sider
            width={220}
            collapsedWidth={72}
            collapsible
            collapsed={collapsed}
            onCollapse={setCollapsed}
            theme="light"
            classNames={{ root: 'admin-sider', body: 'admin-sider__body' }}
          >
            {collapsed ? (
              <Tooltip title={`${site.name} · ${site.url}`} placement="right">
                <button type="button" className="admin-site-mini" aria-label={`当前站点 ${site.name}`} onClick={() => setCollapsed(false)}>
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
                  onChange={setSiteId}
                  options={SITES.map((item) => ({ value: item.id, label: item.name }))}
                  className="admin-site-select"
                  popupMatchSelectWidth
                />
                <div className="admin-site-box__url">{site.url}</div>
              </div>
            )}

            {collapsed ? null : <div className="admin-nav-label-text">工作台</div>}
            <Menu
              mode="inline"
              theme="light"
              selectedKeys={[page]}
              items={menuItems}
              classNames={{ root: 'admin-menu', item: 'admin-menu__item' }}
              onClick={({ key }) => setPage(key)}
            />
          </Sider>

          <Layout className="admin-main">
            <Content className="admin-body">
              <div className="admin-content">
                {page === 'dashboard' ? <AIReady /> : page === 'assistant' ? <Assistant /> : <Placeholder title={current.label} />}
              </div>
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </ConfigProvider>
  )
}
