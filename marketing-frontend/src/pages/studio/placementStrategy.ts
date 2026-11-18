import type { StrategyFields } from './StrategyEditor'

// Display strategy of a promotion placement (产品设计 7.2): when it appears, to whom, during which period,
// how often, and what happens after a visitor closes it or converts. Defaults follow the portal PRD
// mechanism D; drafts saved before these fields existed fall back to the same defaults.

export type AppearMode = 'immediate' | 'delay' | 'scroll' | 'pages' | 'exit' | 'scroll_or_exit'
export type AfterClose = 'visit' | 'days' | 'never'
export type IntentLevel = '不限' | '中及以上' | '高'
export type VisitorType = '全部访客' | '新访客' | '回访访客'
export const STAGES = ['了解', '对比', '决策'] as const

export const APPEAR_LABELS: Record<AppearMode, string> = {
  immediate: '进入页面即出现', delay: '停留一段时间后', scroll: '滚动到一定深度后', pages: '浏览到第几个页面时',
  exit: '出现离开意图时', scroll_or_exit: '滚动到一定深度或出现离开意图',
}
export const APPEAR_OPTIONS: Record<string, AppearMode[]> = {
  '首屏 Banner': ['immediate'],
  '页中横幅': ['scroll', 'delay', 'immediate'],
  '侧边广告位': ['immediate', 'delay', 'scroll'],
  '底部弹出': ['scroll_or_exit', 'scroll', 'exit', 'delay', 'pages'],
}
export const CHAT_TRIGGERS = ['客服识别为高意向', '咨询相关产品', '询问价格或报价', '索取产品资料', '达到对话轮次']
/** Placements that float over the page; only the highest-priority one shows when several qualify. */
export const OVERLAY_PLACEMENTS = ['侧边广告位', '底部弹出']

export interface PlacementStrategy {
  appear: AppearMode; delaySec: number; scrollPct: number; pageCount: number
  topicMatch: boolean; intentMatchOnly: boolean; intentLevel: IntentLevel; stages: string[]; visitorType: VisitorType
  startDate: string; endDate: string; startTime: string; endTime: string
  dailyLimit: number; totalLimit: number; intervalMin: number; oncePerVisit: boolean
  closable: boolean; afterClose: AfterClose; closeDays: number; hideAfterConversion: boolean
  priority: '高' | '普通' | '低'
}

const DEFAULTS: Record<string, Partial<PlacementStrategy>> = {
  '首屏 Banner': { appear: 'immediate', intentLevel: '中及以上', dailyLimit: 1, closable: false, priority: '普通' },
  '页中横幅': { appear: 'scroll', scrollPct: 50, topicMatch: true, afterClose: 'visit', priority: '普通' },
  '侧边广告位': { appear: 'immediate', stages: ['对比', '决策'], afterClose: 'days', closeDays: 1, priority: '普通' },
  '底部弹出': { appear: 'scroll_or_exit', scrollPct: 80, oncePerVisit: true, afterClose: 'days', closeDays: 7, priority: '高' },
  '智能客服推送': { appear: 'immediate', oncePerVisit: true, afterClose: 'visit', priority: '普通' },
}
const BASE: PlacementStrategy = {
  appear: 'immediate', delaySec: 30, scrollPct: 50, pageCount: 3, topicMatch: false, intentMatchOnly: true, intentLevel: '不限',
  stages: [], visitorType: '全部访客', startDate: '', endDate: '', startTime: '00:00', endTime: '23:59',
  dailyLimit: 2, totalLimit: 0, intervalMin: 30, oncePerVisit: false, closable: true, afterClose: 'visit', closeDays: 7,
  hideAfterConversion: true, priority: '普通',
}

/** Effective strategy: saved values over placement defaults over the shared base. */
export function strategyOf(p: StrategyFields): PlacementStrategy {
  const own = (p.strategy || {}) as Partial<PlacementStrategy>
  const merged = { ...BASE, ...DEFAULTS[p.name], startTime: p.startTime || BASE.startTime, endTime: p.endTime || BASE.endTime, ...own }
  const options = APPEAR_OPTIONS[p.name]
  if (options && !options.includes(merged.appear)) merged.appear = options[0]
  if (p.name === '首屏 Banner') merged.closable = false
  return merged
}

const closeText = (s: PlacementStrategy) => s.afterClose === 'visit' ? '关闭后本次访问不再出现' : s.afterClose === 'days' ? `关闭后 ${s.closeDays} 天内不再出现` : '关闭后不再出现'

export function appearText(p: StrategyFields, s = strategyOf(p)) {
  if (p.name === '智能客服推送') return p.chatTrigger === '达到对话轮次' ? `访客发送 ${p.chatTurns || 3} 条消息后推送` : `${p.chatTrigger || CHAT_TRIGGERS[0]}时推送`
  return { immediate: p.name === '首屏 Banner' ? '进入首页即出现' : '进入页面即出现', delay: `停留 ${s.delaySec} 秒后出现`, scroll: `滚动到 ${s.scrollPct}% 后出现`, pages: `浏览到第 ${s.pageCount} 个页面时出现`, exit: '出现离开意图时出现', scroll_or_exit: `滚动到 ${s.scrollPct}% 或出现离开意图时出现` }[s.appear]
}

/** Short phrases describing the strategy, used on the placement header, publish summary and results page. */
export function strategySummary(p: StrategyFields): string[] {
  const s = strategyOf(p)
  const who = [s.intentMatchOnly ? '意图匹配访客' : '', s.intentLevel !== '不限' ? `意向${s.intentLevel}` : '', s.stages.length ? `${s.stages.join('／')}阶段` : '', s.visitorType !== '全部访客' ? s.visitorType : ''].filter(Boolean)
  const freq = [`每天最多 ${s.dailyLimit} 次`, s.totalLimit ? `累计最多 ${s.totalLimit} 次` : '', s.oncePerVisit ? (p.name === '智能客服推送' ? '每次对话最多 1 次' : '每次访问最多 1 次') : ''].filter(Boolean).join('，')
  return [appearText(p, s), who.length ? `面向${who.join('、')}` : '面向全部访客', freq, s.closable ? closeText(s) : '不可关闭', s.hideAfterConversion ? '已转化不再展示' : ''].filter(Boolean)
}

export function strategyIssues(p: StrategyFields): string[] {
  const s = strategyOf(p)
  const issues: string[] = []
  if (s.startDate && s.endDate && s.endDate < s.startDate) issues.push('结束日期早于开始日期。')
  if (s.startTime === s.endTime) issues.push('每日开始与结束时间相同，将不会展示。')
  if (s.totalLimit && s.totalLimit < s.dailyLimit) issues.push('累计上限小于每日上限，每日上限不会生效。')
  if (s.afterClose === 'days' && s.closeDays < 1) issues.push('关闭后不再出现的天数至少为 1。')
  if (p.name !== '智能客服推送' && p.name !== '首屏 Banner' && !(p.scopes || []).length) issues.push('至少选择一个显示页面。')
  return issues
}
