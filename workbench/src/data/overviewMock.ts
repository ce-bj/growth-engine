import type { ViewId } from '../types'

/** 智能体概览 mock：只讲智能体本身——干了多少、等你批什么、各自跑到哪了。
 *  时间对齐访客分析贯穿案例：9月21日（周一）刚出完 9月14日–20日的诊断。 */

export const overviewMonth = {
  label: '9 月',
  span: '9月1日 – 9月21日',
  updatedAt: '09-21 09:30',
}

export type AgentStatus = 'running' | 'waiting' | 'soon'

export type OverviewAgent = {
  key: string
  name: string
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
    key: 'visitor',
    name: '访客行为分析智能体',
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
    view: 'marketing',
    status: 'waiting',
    cadence: '收到任务说明后出落地页草稿',
    lastRun: '09-18 09:20',
    lastResult: '「CNC 打样」落地页草稿已出',
    nextRun: '有新任务说明时',
    monthRuns: 2,
  },
  {
    key: 'content',
    name: '内容发布智能体',
    view: 'content',
    status: 'waiting',
    cadence: '每周二、五 10:00 发布',
    lastRun: '09-19 10:05',
    lastResult: '2 篇内容过质检，等待发布',
    nextRun: '09-22 10:00',
    monthRuns: 6,
  },
  {
    key: 'ready',
    name: 'AI 友好度',
    view: 'ready',
    status: 'running',
    cadence: '每周一 03:00 全站复检',
    lastRun: '09-21 03:00',
    lastResult: '被看见 100 · 被理解 100',
    nextRun: '09-28 03:00',
    monthRuns: 3,
  },
  {
    key: 'service',
    name: 'AI 智能客服 Pro',
    status: 'soon',
    cadence: '接待询盘，对话沉淀回知识库',
    lastRun: '—',
    lastResult: '即将上线',
    nextRun: '—',
    monthRuns: 0,
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
    agent: '访客行为分析智能体',
    view: 'visitor',
    title: 'CNC-6061 铝支架详情 · 改第一屏',
    desc: '落地接住率 53.8% → 21.9%。确认后任务说明交给智能营销页智能体。',
    submittedAt: '09-21 02:20',
    waiting: '今天',
  },
  {
    id: 'p-visitor-oem',
    agent: '访客行为分析智能体',
    view: 'visitor',
    title: 'CNC OEM 询价留资页',
    desc: '询价来意没有专属承接页。确认后任务说明交给智能营销页智能体。',
    submittedAt: '09-21 02:20',
    waiting: '今天',
  },
]

export type DoneTask = {
  id: string
  time: string
  agent: string
  title: string
  result: string
  byHand: boolean
}

/** 本月已完成：byHand 表示经你确认后执行 */
export const overviewDone: DoneTask[] = [
  { id: 'd10', time: '09-21 03:00', agent: 'AI 友好度', title: '全站 AI 友好度复检', result: '被看见 100 · 被理解 100', byHand: false },
  { id: 'd9', time: '09-21 02:14', agent: '访客行为分析智能体', title: '9月14日–20日周诊断', result: '有效浏览率 40% → 30%，出 2 份任务说明', byHand: false },
  { id: 'd8', time: '09-17 16:40', agent: '智能营销页智能体', title: '「询价」落地页 v2 上线', result: '经你确认后发布', byHand: true },
  { id: 'd7', time: '09-16 10:00', agent: '内容发布智能体', title: '发布 3 篇产品选型内容', result: '通过 EEAT / GEO 门禁', byHand: false },
  { id: 'd6', time: '09-15 02:30', agent: 'AI 友好度', title: '修复 sitemap 与 2 处死链', result: '已自动修好', byHand: false },
  { id: 'd5', time: '09-14 03:00', agent: 'AI 友好度', title: '全站 AI 友好度复检', result: '发现 sitemap 缺产品页', byHand: false },
  { id: 'd4', time: '09-14 02:10', agent: '访客行为分析智能体', title: '9月7日–13日周诊断', result: '无异常，不出任务', byHand: false },
  { id: 'd3', time: '09-12 10:00', agent: '内容发布智能体', title: '「六角螺栓 M8×30」产品页发布', result: '经你确认后发布', byHand: true },
  { id: 'd2', time: '09-09 10:00', agent: '内容发布智能体', title: '发布 2 篇行业问答', result: '通过 EEAT / GEO 门禁', byHand: false },
  { id: 'd1', time: '09-07 02:12', agent: '访客行为分析智能体', title: '8月31日–9月6日周诊断', result: '无异常，不出任务', byHand: false },
]
