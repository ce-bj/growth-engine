import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { AdminShell } from './components/AdminShell'
import {
  EmbedFrame,
  contentAgentUrl,
  marketingAgentUrl,
  visitorAnalysisUrl,
} from './components/EmbedFrame'
import { FixDrawer } from './components/FixDrawer'
import { ToastStack } from './components/ToastStack'
import { WorkbenchProvider, useWorkbench } from './context/WorkbenchContext'
import { portalTheme } from './theme'
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
        <EmbedFrame src={visitorAnalysisUrl()} title="访客行为分析智能体" />
      )}
      {view === 'marketing' && (
        <EmbedFrame src={marketingAgentUrl()} title="智能营销页智能体" />
      )}
      {view === 'content' && (
        <EmbedFrame src={contentAgentUrl()} title="内容发布智能体" />
      )}
      {view === 'settings' && <SettingsView />}
      <FixDrawer />
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </AdminShell>
  )
}

export default function App() {
  return (
    <ConfigProvider locale={zhCN} theme={portalTheme}>
      <WorkbenchProvider>
        <Pages />
      </WorkbenchProvider>
    </ConfigProvider>
  )
}
