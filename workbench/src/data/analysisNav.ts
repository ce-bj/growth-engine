import type { ViewId } from '../types'

/** 数字门户「数据分析」左侧菜单：总览是新看板，其余保持原生产入口。 */
export const ANALYSIS_NAV = [
  { id: 'board', label: '数据分析总览' },
  { id: 'analysisVisit', label: '网站访问统计' },
  { id: 'analysisBounce', label: '落地页跳出分析' },
  { id: 'analysisGoogle', label: 'Google收录分析' },
  { id: 'analysisBehavior', label: '访问行为分析' },
  { id: 'analysisLeads', label: '线索转化分析' },
  { id: 'analysisOpsReport', label: '运营报告推送' },
] as const satisfies ReadonlyArray<{ id: ViewId; label: string }>

export type AnalysisViewId = (typeof ANALYSIS_NAV)[number]['id']

export function isAnalysisView(view: ViewId): view is AnalysisViewId {
  return ANALYSIS_NAV.some((item) => item.id === view)
}

export function isLegacyAnalysisView(view: ViewId) {
  return isAnalysisView(view) && view !== 'board'
}

export function analysisLabel(view: ViewId) {
  return ANALYSIS_NAV.find((item) => item.id === view)?.label ?? '数据分析'
}
