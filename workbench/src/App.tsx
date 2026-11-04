import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { useEffect, useState } from 'react'
import { AdminShell } from './components/AdminShell'
import {
  EmbedFrame,
  contentAgentUrl,
  dataBoardUrl,
  marketingAgentUrl,
  opsAssistantUrl,
  visitorAnalysisUrl,
} from './components/EmbedFrame'
import { FixDrawer } from './components/FixDrawer'
import { ToastStack } from './components/ToastStack'
import { WorkbenchProvider, useWorkbench } from './context/WorkbenchContext'
import { portalTheme } from './theme'
import type { ViewId } from './types'
import { AgentOverviewView } from './views/AgentOverviewView'
import { KnowledgeBaseView } from './views/KnowledgeBaseView'
import { ScanProgressView } from './views/ScanProgressView'
import { SettingsView } from './views/WeeklySettingsViews'
import AIReady from './views/oneai/AIReady.jsx'
import Credits from './views/oneai/Credits.jsx'
import 'antd/dist/reset.css'
import './styles.css'

type AgentTaskPayload = {
  title?: string
  view?: string
}

type AgentHandoff = {
  view: string
  stamp: number
  task: AgentTaskPayload
}

function encodeTask(task: AgentTaskPayload) {
  const bytes = new TextEncoder().encode(JSON.stringify(task))
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

function withTask(url: string, handoff: AgentHandoff | null, view: string) {
  if (!handoff || handoff.view !== view) return url
  const next = new URL(url, window.location.origin)
  next.searchParams.set('handoff', String(handoff.stamp))
  next.searchParams.set('task', encodeTask(handoff.task))
  return next.toString()
}

function Pages() {
  const { view, toasts, dismissToast, navigate } = useWorkbench()
  const [handoff, setHandoff] = useState<AgentHandoff | null>(null)

  useEffect(() => {
    const allowed = new Set(['marketing', 'assistant', 'content'])
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; view?: string; task?: AgentTaskPayload } | null
      if (data?.type !== 'growth-open-task' || !data.view || !allowed.has(data.view) || !data.task?.title) return
      setHandoff({ view: data.view, stamp: Date.now(), task: data.task })
      navigate(data.view as ViewId)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [navigate])

  useEffect(() => {
    if (handoff && handoff.view !== view) setHandoff(null)
  }, [view, handoff])

  return (
    <AdminShell>
      {view === 'board' && <EmbedFrame src={dataBoardUrl()} title="数据看板" />}
      {view === 'dashboard' && <AgentOverviewView />}
      {view === 'scanning' && <ScanProgressView />}
      {view === 'visitor' && (
        <EmbedFrame src={visitorAnalysisUrl()} title="访客行为分析智能体" />
      )}
      {view === 'marketing' && (
        <EmbedFrame src={withTask(marketingAgentUrl(), handoff, 'marketing')} title="智能营销页智能体" />
      )}
      {view === 'content' && (
        <EmbedFrame src={withTask(contentAgentUrl(), handoff, 'content')} title="内容发布智能体" />
      )}
      {view === 'settings' && <SettingsView />}
      {view === 'ready' && <AIReady />}
      {view === 'credits' && <Credits />}
      {view === 'assistant' && (
        <EmbedFrame src={withTask(opsAssistantUrl(), handoff, 'assistant')} title="AI 运营助手" />
      )}
      {view === 'knowledge' && <KnowledgeBaseView />}
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
