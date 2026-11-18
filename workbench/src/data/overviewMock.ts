import type { ViewId } from '../types'

/** 智能体概览 mock：只讲智能体本身——干了多少、等你批什么、各自跑到哪了。
 *  时间对齐访客分析贯穿案例：9月21日（周一）刚出完 9月14日–20日的诊断。 */

export const overviewMonth = {
  label: '9 月',
  span: '9月1日 – 9月21日',
  updatedAt: '09-21 09:30',
}

/** 有待审批：有事等你拍板；运行中：正在出诊断/草稿/扫描；待命：这会儿没有要你批的。 */
export type AgentStatus = 'waiting' | 'running' | 'idle'

export type OverviewAgent = {
  key: string
  name: string
  role: string
  purpose: string
  ability: string
  view?: ViewId
  status: AgentStatus
  cadence: string
  lastRun: string
  lastResult: string
  nextRun: string
  monthRuns: number
}

export const overviewAgents: OverviewAgent[] = [
  {
    key: 'ready',
    name: 'AI Ready',
    role: '站点底座体检',
    purpose: '帮网站打好被 AI 看见、被 AI 理解的基础',
    ability: '检查站点是否容易被 AI 发现和读懂，发现问题后给出方案，由你确认后再改。',
    view: 'ready',
    status: 'idle',
    cadence: '发现影响 AI 看见、理解站点的问题时出方案，等你确认',
    lastRun: '09-15 02:30',
    lastResult: 'sitemap 与 2 处死链已按你确认修好',
    nextRun: '有问题时',
    monthRuns: 1,
  },
  {
    key: 'visitor',
    name: '优化策略',
    role: '每周转化诊断',
    purpose: '帮网站更好地承接访客，让潜在的客户更容易留存转化',
    ability: '每周看「访客洞察」，判断访客卡在哪、哪些页面没接住，并开出可落地的改版任务说明。',
    view: 'visitor',
    status: 'waiting',
    cadence: '每周一 02:00 诊断上一自然周',
    lastRun: '09-21 02:14',
    lastResult: '卡点在有效浏览，写好 2 份任务说明',
    nextRun: '09-28 02:00',
    monthRuns: 3,
  },
  {
    key: 'marketing',
    name: '智能营销页智能体',
    role: '高转化页面生成',
    purpose: '帮网站用对的页面接住对应来意的访客',
    ability: '可按优化策略的任务说明来做，也可由你手动创建或修改营销页，草稿出来后交给你确认。',
    view: 'marketing',
    status: 'waiting',
    cadence: '有任务说明或你手动创建时出营销页草稿',
    lastRun: '09-18 09:20',
    lastResult: '「CNC 打样」落地页草稿已出',
    nextRun: '有任务或你创建时',
    monthRuns: 2,
  },
  {
    key: 'content',
    name: '内容发布智能体',
    role: '日常内容扩充',
    purpose: '持续补充专业内容，让潜在客户更容易读懂你们',
    ability: '可按排期自动写，也可由你随时创建产品介绍、选型指南和行业问答，自检通过后交给你确认发布。',
    view: 'content',
    status: 'waiting',
    cadence: '按排期生产，也可随时手动创建',
    lastRun: '09-19 10:05',
    lastResult: '2 篇内容过质检，等待发布',
    nextRun: '09-22 10:00',
    monthRuns: 6,
  },
]

export type PendingTask = {
  id: string
  agent: string
  view: ViewId
  title: string
  desc: string
  submittedAt: string
  waiting: string
}

/** 待审批：按等待时长从长到短 */
export const overviewPending: PendingTask[] = [
  {
    id: 'p-marketing-draft',
    agent: '智能营销页智能体',
    view: 'marketing',
    title: '「CNC 打样」落地页草稿待确认发布',
    desc: '首屏对齐「48 小时打样 + ISO」，发布前需要你拍板。',
    submittedAt: '09-18 09:20',
    waiting: '已等 3 天',
  },
  {
    id: 'p-content-publish',
    agent: '内容发布智能体',
    view: 'content',
    title: '2 篇内容过质检待发布',
    desc: 'SDPH 产品介绍、PT100 选型指南已自检通过。',
    submittedAt: '09-19 10:05',
    waiting: '已等 2 天',
  },
  {
    id: 'p-visitor-6061',
    agent: '优化策略',
    view: 'visitor',
    title: 'CNC-6061 铝支架详情 · 改第一屏',
    desc: '落地接住率 53.8% → 21.9%。确认后任务说明交给智能营销页智能体。',
    submittedAt: '09-21 02:20',
    waiting: '今天',
  },
  {
    id: 'p-visitor-oem',
    agent: '优化策略',
    view: 'visitor',
    title: 'CNC OEM 询价留资页',
    desc: '询价来意没有专属承接页。确认后任务说明交给智能营销页智能体。',
    submittedAt: '09-21 02:20',
    waiting: '今天',
  },
]

/** 已完成任务的收口方式：优化策略只出一轮策略；其余是各智能体的具体任务。 */
export type DoneMethod = 'agreed' | 'manual' | 'strategy'

export const DONE_METHOD_LABEL: Record<DoneMethod, string> = {
  agreed: '你已同意',
  manual: '人工处理',
  strategy: '出策略',
}

export type DoneTask = {
  id: string
  time: string
  agent: string
  title: string
  method: DoneMethod
}

/** 本月已完成：优化策略只留一条出策略，其余是营销页 / 内容 / AI Ready 的具体任务 */
export const overviewDone: DoneTask[] = [
  { id: 'd9', time: '09-21 02:14', agent: '优化策略', title: '9月14日–20日策略', method: 'strategy' },
  { id: 'd8', time: '09-17 16:40', agent: '智能营销页智能体', title: '「询价」落地页 v2 上线', method: 'agreed' },
  { id: 'd7', time: '09-16 10:00', agent: '内容发布智能体', title: '发布 3 篇产品选型内容', method: 'agreed' },
  { id: 'd6', time: '09-15 02:30', agent: 'AI Ready', title: '修复 sitemap 与 2 处死链', method: 'agreed' },
  { id: 'd3', time: '09-12 10:00', agent: '内容发布智能体', title: '「六角螺栓 M8×30」产品页发布', method: 'agreed' },
  { id: 'd2', time: '09-09 10:00', agent: '内容发布智能体', title: '发布 2 篇行业问答', method: 'agreed' },
]
