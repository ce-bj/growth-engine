import { AdminShell } from './components/AdminShell'
import { FixDrawer } from './components/FixDrawer'
import { GuideModal } from './components/GuideModal'
import { ToastStack } from './components/ToastStack'
import { WorkbenchProvider, useWorkbench } from './context/WorkbenchContext'
import { ContentView } from './views/ContentView'
import { DashboardView } from './views/DashboardView'
import { HistoryView, TasksView } from './views/HistoryTasksViews'
import { LeadsView } from './views/LeadsView'
import { ReportView } from './views/ReportView'
import { ScanProgressView } from './views/ScanProgressView'
import { SettingsView, WeeklyView } from './views/WeeklySettingsViews'
import './styles.css'

function Pages() {
  const { view, toasts, dismissToast } = useWorkbench()

  return (
    <AdminShell>
      {view === 'dashboard' && <DashboardView />}
      {view === 'scanning' && <ScanProgressView />}
      {view === 'report' && <ReportView />}
      {view === 'tasks' && <TasksView />}
      {view === 'history' && <HistoryView />}
      {view === 'weekly' && <WeeklyView />}
      {view === 'settings' && <SettingsView />}
      {view === 'content' && <ContentView />}
      {view === 'leads' && <LeadsView />}
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
