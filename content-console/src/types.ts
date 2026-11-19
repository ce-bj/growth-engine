// 内容发布智能体 · 类型定义

// 任务状态（五态，含暂停）
export type TaskStatus = 'draft' | 'pending' | 'active' | 'paused' | 'done'

export interface PublishTask {
  id: string
  taskNo: string
  title: string
  from: 'manual' | 'agent' | 'strategy'
  status: TaskStatus // 基础值，最终状态由 taskStatus 按时间判定
  app: string
  col: string
  freqText: string
  countText: string
  start: string
  createdAt: string
  next: string
  topic: string
  kw: string[]
  note: string
  imgOn: boolean
  mode: 'review' | 'publish'
  map: string[]
  strat: string[]
}

export type ContentStatus = 'published' | 'scheduled' | 'planned' | 'rejected'

export interface CalendarItem {
  id: string
  title: string
  type: string
  date: string
  status: ContentStatus
  tid: string
  strat: string[]
  body: string
}

// 冷启动推荐任务（待确认）
export interface Direction {
  id: string
  title: string
  type: string
  strat: string[]
  date: string
  status: 'pending' | 'confirmed'
  app: string
  col: string
  freqText: string
  countText: string
  topic: string
  kw: string[]
}

export interface Strategy {
  key: string
  name: string
  icon: string
  slogan: string
  desc: string
}

// 待办来源
export type TodoSource = 'behavior-fix' | 'behavior-new' | 'self-new'

// 待办条目
export interface TodoRow {
  id: string
  title: string
  type: string
  date: string
  source: TodoSource
  strat: string[]
  note: string
  needKb: boolean // 是否依赖知识库
  kbName: string // 依赖的知识库名称
  pushStatus?: '待推送' | '已推送' // 自建任务产出内容的推送状态（默认待推送）
  fixStatus?: '修改中' | '已完成' // 行为分析·修改内容的修改状态（默认修改中）
  newPushStatus?: '待推送' | '已推送' // 行为分析·新增内容的推送状态（默认待推送）
}

// 统一内容条目（内容库归一化后的结构）
export interface ContentRow {
  id: string
  cid: string
  title: string
  type: string
  date: string
  published: boolean
  planned: boolean
  tid: string
  taskTitle: string
  source: string
  strat: string[]
  body: string
  fixed: boolean
  fixNote: string
  skipped: boolean
  audit: string
  score: string
  mode: string
  kw: string[]
  desc: string
}

// 发布清单（任务日志）：某任务产出的推送记录
export interface PublishLog {
  id: string
  taskId: string // 关联任务 id
  taskNo: string
  taskName: string
  kw: string
  topic: string
  contentTitle: string
  app: string
  expectTime: string
  actualTime: string
  pushStatus: '待推送' | '已推送' | '推送失败'
  updateTime: string
}
