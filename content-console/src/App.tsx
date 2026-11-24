import { StoreProvider, useStore } from './store'
import { DataBar } from './components/DataBar'
import { ColdStart } from './components/ColdStart'
import { TodoArea } from './components/TodoArea'
import { TaskArea } from './components/TaskArea'
import { DataListView } from './components/DataListView'
import { TaskListView } from './components/TaskListView'
import { TaskDetailView } from './components/TaskDetailView'
import { TaskCreateView } from './components/TaskCreateView'
import { TaskLogView } from './components/TaskLogView'
import { GatePreviewModal } from './components/GatePreviewModal'

export function App() {
  return (
    <StoreProvider>
      <GatePreviewModal />
      <Shell />
    </StoreProvider>
  )
}

function Shell() {
  const { view } = useStore()

  return (
    <div className="app-shell">
      <main className="app-main">
        {view.name === 'home' && <HomeView />}
        {view.name === 'data-list' && <DataListView initialTab={view.scope} />}
        {view.name === 'task-list' && <TaskListView />}
        {view.name === 'task-detail' && <TaskDetailView id={view.id} />}
        {view.name === 'task-create' && <TaskCreateView directionId={view.directionId} />}
        {view.name === 'task-log' && <TaskLogView id={view.id} />}
      </main>
    </div>
  )
}

function HomeView() {
  return (
    <>
      <DataBar />
      <ColdStart />
      <TodoArea />
      <TaskArea />
    </>
  )
}
