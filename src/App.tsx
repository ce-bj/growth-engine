import { useState } from 'react'
import { AdminShell } from './components/AdminShell'
import { FixDrawer } from './components/FixDrawer'
import { GuideModal } from './components/GuideModal'
import { ToastStack } from './components/ToastStack'
import { WorkbenchProvider, useWorkbench } from './context/WorkbenchContext'
import { ContentView } from './views/ContentView'
import { DashboardView } from './views/DashboardView'
import { HistoryView, TasksView } from './views/HistoryTasksViews'
import { LeadsView, LeadDetailView } from './views/LeadsView'
import { ReportView } from './views/ReportView'
import { mockLeadsData } from './data/mock'
import type { Lead } from './types'
import { ScanProgressView } from './views/ScanProgressView'
import { SettingsView, WeeklyView } from './views/WeeklySettingsViews'
import './styles.css'

function Pages() {
  const { view, toasts, dismissToast } = useWorkbench()

  // 线索数据：列表与详情页共享，避免详情页修改后列表不回显
  const [leads, setLeads] = useState<Lead[]>(mockLeadsData)

  // 线索详情路由：独立页面，不走 view 状态
  const [leadsDetailId, setLeadsDetailId] = useState<string | null>(null)

  return (
    <AdminShell>
      {leadsDetailId ? (
        // 线索详情独立页面
        <LeadDetailView
          leadId={leadsDetailId}
          leads={leads}
          setLeads={setLeads}
          onBack={() => setLeadsDetailId(null)}
        />
      ) : (
        // 常规业务页
        <>
          {view === 'dashboard' && <DashboardView />}
          {view === 'scanning' && <ScanProgressView />}
          {view === 'report' && <ReportView />}
          {view === 'tasks' && <TasksView />}
          {view === 'history' && <HistoryView />}
          {view === 'weekly' && <WeeklyView />}
          {view === 'settings' && <SettingsView />}
          {view === 'content' && <ContentView />}
          {view === 'leads' && (
            <LeadsView
              leads={leads}
              setLeads={setLeads}
              onOpenDetail={setLeadsDetailId}
            />
          )}
        </>
      )}
      <FixDrawer />
      <GuideModal />
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </AdminShell>
  )
}

export default function App() {
  return (
    <WorkbenchProvider>
      <Pages />
    </WorkbenchProvider>
  )
}
