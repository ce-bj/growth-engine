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
import { isLegacyAnalysisView } from './data/analysisNav'
import { AgentOverviewView } from './views/AgentOverviewView'
import { LegacyAnalysisView } from './views/data-analysis/LegacyAnalysisView'
import { GeoMonitorView } from './views/GeoMonitorView'
import { KnowledgeBaseView } from './views/KnowledgeBaseView'
import { ScanProgressView } from './views/ScanProgressView'
import { SettingsView } from './views/WeeklySettingsViews'
import AIReady from './views/oneai/AIReady.jsx'
import Credits from './views/oneai/Credits.jsx'
import 'antd/dist/reset.css'
import './styles.css'

export type AgentTaskPayload = {
  id?: string
  focusKey?: string
  title?: string
  view?: string
  executor?: string
  from?: string
  approvedAt?: string
  stage?: string
  note?: string
  summary?: string
  target?: string
  requirements?: string[]
  requirementSections?: { label: string; mode?: string; lines?: string[] }[]
  constraints?: string[]
  extra?: string
  draftPreview?: {
    pageType: string
    targetUrl: string
    heroHeadline: string
    heroSubhead: string
    highlights: Array<{ tag: string; label: string; before: string; after: string }>
    sections: Array<{ title: string; content: string }>
  }
}

type AgentHandoff = {
  view: string
  stamp: number
  task?: AgentTaskPayload
  focusKey?: string
  focusKeys?: string[]
  lens?: 'funnel' | 'trend'
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
  if (handoff.focusKey) {
    next.searchParams.set('focus', handoff.focusKey)
  }
  if (handoff.focusKeys?.length) {
    next.searchParams.set('keys', handoff.focusKeys.join(','))
  }
  if (handoff.lens) {
    next.searchParams.set('lens', handoff.lens)
  }
  if (handoff.task) {
    next.searchParams.set('task', encodeTask(handoff.task))
  }
  return next.toString()
}

function Pages() {
  const { view, toasts, dismissToast, navigate } = useWorkbench()
  const [handoff, setHandoff] = useState<AgentHandoff | null>(null)

  useEffect(() => {
    const allowed = new Set(['marketing', 'assistant', 'content', 'visitor'])
    const onMessage = (event: MessageEvent) => {
      const data = event.data as {
        type?: string
        view?: string
        focusKey?: string
        focusKeys?: string[]
        lens?: 'funnel' | 'trend'
        task?: AgentTaskPayload
      } | null
      if (!data) return
      if (data.type === 'growth-open-task' && data.view && allowed.has(data.view) && data.task?.title) {
        setHandoff({
          view: data.view,
          stamp: Date.now(),
          task: data.task,
          focusKey: data.focusKey || data.task.focusKey || data.task.id,
        })
        navigate(data.view as ViewId)
        return
      }
      if (data.type === 'growth-navigate' && (data.view === 'visitor' || data.view === 'intake')) {
        setHandoff({
          view: 'visitor',
          stamp: Date.now(),
          focusKey: data.focusKey,
          focusKeys: data.focusKeys,
          lens: data.lens,
        })
        navigate('visitor')
      }
    }

    const onFocusStrategy = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          view?: string
          focusKey?: string
          focusKeys?: string[]
          lens?: 'funnel' | 'trend'
          task?: AgentTaskPayload
        }>
      ).detail
      if (!detail) return
      const targetView = detail.view === 'intake' ? 'visitor' : detail.view || 'visitor'
      setHandoff({
        view: targetView,
        stamp: Date.now(),
        focusKey: detail.focusKey,
        focusKeys: detail.focusKeys,
        lens: detail.lens,
        task: detail.task,
      })
      navigate(targetView as ViewId)
    }

    window.addEventListener('message', onMessage)
    window.addEventListener('growth-focus-strategy', onFocusStrategy)
    return () => {
      window.removeEventListener('message', onMessage)
      window.removeEventListener('growth-focus-strategy', onFocusStrategy)
    }
  }, [navigate])

  useEffect(() => {
    const normalized = view === 'intake' ? 'visitor' : view
    if (handoff && handoff.view !== normalized) setHandoff(null)
  }, [view, handoff])

  return (
    <AdminShell>
      {view === 'board' && <EmbedFrame src={dataBoardUrl()} title="数据分析总览" />}
      {isLegacyAnalysisView(view) && <LegacyAnalysisView view={view} />}
      {view === 'dashboard' && <AgentOverviewView />}
      {view === 'scanning' && <ScanProgressView />}
      {(view === 'visitor' || view === 'intake') && (
        <EmbedFrame src={withTask(visitorAnalysisUrl(), handoff, 'visitor')} title="访客洞察与策略" />
      )}
      {view === 'marketing' && (
        <EmbedFrame src={withTask(marketingAgentUrl(), handoff, 'marketing')} title="智能营销页" />
      )}
      {view === 'content' && (
        <EmbedFrame src={withTask(contentAgentUrl(), handoff, 'content')} title="官网内容发布" />
      )}
      {view === 'settings' && <SettingsView />}
      {view === 'ready' && (
        <AIReady
          focusKey={handoff?.view === 'ready' ? handoff.focusKey : undefined}
          focusStamp={handoff?.view === 'ready' ? handoff.stamp : undefined}
        />
      )}
      {view === 'credits' && <Credits />}
      {view === 'assistant' && (
        <EmbedFrame src={withTask(opsAssistantUrl(), handoff, 'assistant')} title="AI 运营助手" />
      )}
      {view === 'knowledge' && <KnowledgeBaseView />}
      {view === 'geoMonitor' && <GeoMonitorView />}
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
