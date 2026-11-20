import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  DASH_STATS,
  DIRECTIONS,
  INITIAL_ITEMS,
  INITIAL_TASKS,
  INITIAL_TODOS,
  PUBLISH_LOGS,
  STRATEGIES,
  TODAY,
} from './data'
import type {
  CalendarItem,
  ContentRow,
  Direction,
  PublishLog,
  PublishTask,
  Strategy,
  TaskStatus,
  TodoRow,
  TodoSource,
} from './types'

// —— 任务状态判定（五态）：草稿 / 未开始 / 进行中 / 已暂停 / 已完成 ——
// 状态以任务自身的 status 字段为准；仅当 status 为默认值 active 且开始时间在未来时，才降级为「未开始」
export function taskStatus(t: PublishTask): TaskStatus {
  if (t.status === 'draft') return 'draft'
  if (t.status === 'paused') return 'paused'
  if (t.status === 'done') return 'done'
  if (t.status === 'pending') return 'pending'
  return 'active'
}
export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  draft: '草稿',
  pending: '未开始',
  active: '进行中',
  paused: '已暂停',
  done: '已完成',
}

// —— 待办来源标签 ——
export const TODO_SOURCE_LABEL: Record<TodoSource, string> = {
  'behavior-fix': '行为分析 · 修改',
  'behavior-new': '行为分析 · 新增',
  'self-new': '自建发布任务 · 新增',
}

// —— 内容条目状态 ——
export type ItemState = 'published' | 'draft' | 'planned' | 'rejected'
export function itemState(r: ContentRow): ItemState {
  if (r.published) return 'published'
  if (r.audit === 'rejected') return 'rejected'
  if (r.planned) return 'planned'
  return 'draft'
}

function typeLabel(t: string): string {
  const map: Record<string, string> = { prod: '产品管理', blog: '常见问题', news: '新闻资讯', case: '企业图册' }
  return map[t] || t
}

function stratName(k: string): string {
  const s = STRATEGIES.find((x) => x.key === k)
  return s ? s.name : k
}

function taskOf(id: string, tasks: PublishTask[]): PublishTask | null {
  return tasks.find((t) => t.id === id) || null
}

// 统一内容库：任务产出内容 + 历史已发布内容归一化
function buildStore(items: CalendarItem[], tasks: PublishTask[]): ContentRow[] {
  const rows: ContentRow[] = []
  const byTitle = new Map<string, ContentRow>()
  items.forEach((x) => {
    const tk = x.tid ? taskOf(x.tid, tasks) : null
    const r: ContentRow = {
      id: x.id,
      cid: '',
      title: x.title,
      type: x.type || 'prod',
      date: x.date || TODAY,
      published: x.status === 'published',
      planned: x.status === 'planned',
      tid: x.tid || '',
      taskTitle: tk ? tk.title : '',
      source: tk ? '任务产出的内容' : '历史内容',
      strat: (x.strat || []).slice(),
      body: x.body || '',
      fixed: false,
      fixNote: '',
      skipped: false,
      audit: x.status === 'rejected' ? 'rejected' : '',
      score: '',
      mode: '',
      kw: [],
      desc: '',
    }
    rows.push(r)
    if (!byTitle.has(x.title)) byTitle.set(x.title, r)
  })
  return rows
}

function readHandoffTask(): { id?: string; title?: string; summary?: string } | null {
  try {
    const raw = new URLSearchParams(window.location.search).get('task')
    if (!raw) return null
    const binary = atob(raw)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    const task = JSON.parse(new TextDecoder().decode(bytes)) as { id?: string; title?: string; summary?: string }
    if (!task?.title) return null
    return task
  } catch {
    return null
  }
}

const HANDOFF_TASK = typeof window === 'undefined' ? null : readHandoffTask()

function withHandoffTask(list: PublishTask[]): PublishTask[] {
  if (!HANDOFF_TASK?.title) return list
  if (list.some((item) => item.title === HANDOFF_TASK.title)) return list
  return [
    {
      id: HANDOFF_TASK.id || 'tk-handoff',
      taskNo: genTaskNo(),
      title: HANDOFF_TASK.title,
      from: 'agent',
      status: 'active',
      app: '产品管理',
      col: '页面优化',
      freqText: '仅一次',
      countText: '1 篇',
      start: TODAY,
      createdAt: TODAY,
      next: '',
      topic: HANDOFF_TASK.summary || HANDOFF_TASK.title,
      kw: [],
      note: HANDOFF_TASK.summary || '来自网站策略的进行中任务',
      imgOn: false,
      mode: 'review',
      map: [],
      strat: ['eeat', 'geo'],
    },
    ...list,
  ]
}

interface StoreState {
  tasks: PublishTask[]
  items: CalendarItem[]
  todos: TodoRow[]
  directions: Direction[]
  strategies: Strategy[]
  publishLogs: PublishLog[]
  stats: typeof DASH_STATS
  today: string
  store: ContentRow[]
  view: View
  handoffTitle: string
  navigate: (v: View) => void
  // actions
  confirmDirection: (id: string) => void
  createTask: (t: Omit<PublishTask, 'id' | 'from' | 'status' | 'taskNo' | 'createdAt'>, status?: TaskStatus) => void
  cancelTask: (id: string) => void
  togglePauseTask: (id: string) => void
  setTaskStatus: (id: string, status: TaskStatus) => void
  publishTodo: (id: string) => void
  rejectTodo: (id: string) => void
  gotoKb: (id: string) => void
  continueAfterKb: (id: string) => void
}

const StoreContext = createContext<StoreState | null>(null)

// —— 页面路由 ——
export type View =
  | { name: 'home' }
  | { name: 'data-list'; scope: 'total' | 'week' | 'month' | 'fix' }
  | { name: 'task-list' }
  | { name: 'task-detail'; id: string }
  | { name: 'task-create'; directionId?: string }
  | { name: 'task-log'; id: string }

export function StoreProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<PublishTask[]>(() => withHandoffTask(INITIAL_TASKS))
  const [items, setItems] = useState<CalendarItem[]>(INITIAL_ITEMS)
  const [todos, setTodos] = useState<TodoRow[]>(INITIAL_TODOS)
  const [directions, setDirections] = useState<Direction[]>(DIRECTIONS)
  const [view, setView] = useState<View>(() => (HANDOFF_TASK?.title ? { name: 'task-list' } : { name: 'home' }))
  const handoffTitle = HANDOFF_TASK?.title || ''

  const navigate = (v: View) => setView(v)

  const store = useMemo(() => buildStore(items, tasks), [items, tasks])

  // 冷启动推荐任务：确认后继承字段，转成正式发布任务（from:agent）
  const confirmDirection = (id: string) => {
    const d = directions.find((x) => x.id === id)
    if (!d) return
    setDirections((prev) => prev.map((x) => (x.id === id ? { ...x, status: 'confirmed' } : x)))
    setTasks((prev) => [
      ...prev,
      {
        id: 'tk' + Date.now(),
        taskNo: genTaskNo(),
        title: d.title,
        from: 'agent',
        status: 'active',
        app: d.app,
        col: d.col,
        freqText: d.freqText,
        countText: d.countText,
        start: TODAY,
        createdAt: TODAY,
        next: d.freqText === '仅一次' ? '' : addDays(TODAY, 7),
        topic: d.topic,
        kw: d.kw,
        note: '智能体依据已确认的选题方向自动排产',
        imgOn: false,
        mode: 'review',
        map: [],
        strat: ['eeat', 'geo'],
      },
    ])
  }

  const createTask = (
    t: Omit<PublishTask, 'id' | 'from' | 'status' | 'taskNo' | 'createdAt'>,
    status: TaskStatus = 'active',
  ) => {
    const tid = 'tk' + Date.now()
    setTasks((prev) => [
      ...prev,
      { ...t, id: tid, taskNo: genTaskNo(), createdAt: TODAY, from: 'manual', status },
    ])
  }

  const cancelTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    setItems((prev) => prev.filter((x) => x.tid !== id || x.status === 'published'))
  }

  const togglePauseTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        // 暂停：记录 paused；恢复：回到 active
        return { ...t, status: t.status === 'paused' ? 'active' : 'paused' }
      }),
    )
  }

  // 直接设置任务状态（用于详情页状态下拉切换）
  const setTaskStatus = (id: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
  }

  // 待办：立即发布 —— 新增内容进入已发布；同时产出对应内容条目
  const publishTodo = (id: string) => {
    const td = todos.find((x) => x.id === id)
    if (!td) return
    setTodos((prev) => prev.filter((x) => x.id !== id))
    // 新增类内容发布后进入内容库；修改类内容也标记为已发布
    setItems((prev) => [
      ...prev,
      {
        id: 'todo-' + id,
        title: td.title,
        type: typeKey(td.type),
        date: TODAY,
        status: 'published',
        tid: '',
        strat: td.strat.map(stratKey),
        body: '',
      },
    ])
  }

  // 待办：取消发布 —— 进入已驳回（留档，不出现在已发布）
  const rejectTodo = (id: string) => {
    const td = todos.find((x) => x.id === id)
    if (!td) return
    setTodos((prev) => prev.filter((x) => x.id !== id))
    setItems((prev) => [
      ...prev,
      {
        id: 'todo-' + id,
        title: td.title,
        type: typeKey(td.type),
        date: TODAY,
        status: 'rejected',
        tid: '',
        strat: td.strat.map(stratKey),
        body: '',
      },
    ])
  }

  // 去补充知识：跳转知识库（演示态：仅提示）
  const gotoKb = (id: string) => {
    const td = todos.find((x) => x.id === id)
    if (!td) return
    alert('已打开知识库产品，请在「' + td.kbName + '」中补充对应内容')
  }

  // 补完继续生成：依赖解除，回到可发布态
  const continueAfterKb = (id: string) => {
    setTodos((prev) => prev.map((x) => (x.id === id ? { ...x, needKb: false } : x)))
  }

  const value: StoreState = {
    tasks,
    items,
    todos,
    directions,
    strategies: STRATEGIES,
    publishLogs: PUBLISH_LOGS,
    stats: DASH_STATS,
    today: TODAY,
    store,
    view,
    handoffTitle,
    navigate,
    confirmDirection,
    createTask,
    cancelTask,
    togglePauseTask,
    setTaskStatus,
    publishTodo,
    rejectTodo,
    gotoKb,
    continueAfterKb,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreState {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

function addDays(date: string, n: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

// 生成任务编号（10 位数字，演示用）
function genTaskNo(): string {
  return String(Math.floor(1000000000 + Math.random() * 9000000000))
}

function typeKey(label: string): string {
  const map: Record<string, string> = { 产品管理: 'prod', 常见问题: 'blog', 新闻资讯: 'news', 企业图册: 'case' }
  return map[label] || 'prod'
}

function stratKey(name: string): string {
  const map: Record<string, string> = { 'EEAT 强化': 'eeat', 'GEO 4 项': 'geo', 红线自检: 'red', 权威信源: 'auth' }
  return map[name] || 'geo'
}

// 导出工具函数供组件使用
export { taskOf, typeLabel, stratName }
