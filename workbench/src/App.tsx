import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { AdminShell } from './components/AdminShell'
import {
  CONTENT_AGENT_URL,
  EmbedFrame,
  MARKETING_AGENT_URL,
  VISITOR_ANALYSIS_URL,
} from './components/EmbedFrame'
import { FixDrawer } from './components/FixDrawer'
import { ToastStack } from './components/ToastStack'
import { WorkbenchProvider, useWorkbench } from './context/WorkbenchContext'
import { iceTheme } from './theme'
import { AgentOverviewView } from './views/AgentOverviewView'
import { ScanProgressView } from './views/ScanProgressView'
import { SettingsView } from './views/WeeklySettingsViews'
import 'antd/dist/reset.css'
import './styles.css'

function Pages() {
  const { view, toasts, dismissToast } = useWorkbench()

  return (
    <AdminShell>
      {view === 'dashboard' && <AgentOverviewView />}
      {view === 'scanning' && <ScanProgressView />}
      {view === 'visitor' && (
        <EmbedFrame src={VISITOR_ANALYSIS_URL} title="访客行为分析智能体" />
      )}
      {view === 'marketing' && (
        <EmbedFrame src={MARKETING_AGENT_URL} title="智能营销页智能体" />
      )}
      {view === 'content' && (
        <EmbedFrame src={CONTENT_AGENT_URL} title="内容发布智能体" />
      )}
      {view === 'settings' && <SettingsView />}
      <FixDrawer />
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </AdminShell>
  )
}

export default function App() {
  return (
    <ConfigProvider locale={zhCN} theme={iceTheme}>
      <WorkbenchProvider>
        <Pages />
      </WorkbenchProvider>
    </ConfigProvider>
  )
}
