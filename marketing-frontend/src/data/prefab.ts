import type { PageType } from '@/types'
import candidatesFile from './intent-candidates.json'
import productsFile from './products.json'
import plansFile from './prefab-plans.json'

export type Stage = 'awareness' | 'consideration' | 'decision'
export type Source = 'seo' | 'sem' | 'social' | 'manual'

export interface IntentCandidate {
  id: string
  query: string
  source: Source
  clicks_28d: number | null
  impressions_28d: number | null
  status: string
  comment?: string
}

export interface MockProduct {
  id: string
  name: string
  name_zh: string
  model: string
  category: string
  imageUrl: string
  price: string
  url: string
  certs: string[]
  moq: string
  delivery: string
}

export interface PrefabPlan {
  intent_id: string
  can_start: boolean
  blockers: string[]
  query: string
  source: Source
  stage: Stage
  page_type: PageType
  cta_text: string
  selected_form: string
  selected_product_ids: string[]
  selling_points: string
  target_audience: string
  language: string
  target_region: string
  company_name: string
  contact_info: string
  lead_hook: string | null
  exhibition: { name: string; date: string; location: string; booth: string | null } | null
  promotion: { end_date: string; discount: string | null } | null
  missing_modules: string[]
  note?: string
  context_message: string | null
}

export const intentCandidates = candidatesFile.candidates as IntentCandidate[]
export const mockProducts = productsFile.products as MockProduct[]
export const mappingDefaults = plansFile.mapping_defaults as Record<
  Stage,
  { page_type: PageType; cta: string }
>
export const prefabPlans = plansFile.plans as PrefabPlan[]

export const STAGE_LABELS: Record<Stage, string> = {
  awareness: '了解',
  consideration: '对比',
  decision: '决策',
}

export const PAGE_TYPE_LABELS: Record<PageType, string> = {
  'product-marketing': '产品营销',
  'lead-gen': '留资获客',
  brand: '品牌实力',
  promotion: '促销活动',
  exhibition: '展会邀请',
}

export const SOURCE_LABELS: Record<Source, string> = {
  seo: '搜索自然',
  sem: '搜索广告',
  social: '社媒',
  manual: '人工',
}

export function clonePlan(plan: PrefabPlan): PrefabPlan {
  return structuredClone(plan)
}

export function planByIntentId(id: string): PrefabPlan | undefined {
  return prefabPlans.find(p => p.intent_id === id)
}

function formForType(pageType: PageType): string {
  if (pageType === 'lead-gen' || pageType === 'exhibition' || pageType === 'promotion') return 'lead'
  return 'inquiry'
}

export function applyStage(plan: PrefabPlan, stage: Stage): PrefabPlan {
  const mapped = mappingDefaults[stage]
  const next: PrefabPlan = {
    ...plan,
    stage,
    page_type: mapped.page_type,
    cta_text: mapped.cta,
    selected_form: formForType(mapped.page_type),
  }
  return withStartGate(next)
}

export function withStartGate(plan: PrefabPlan): PrefabPlan {
  const blockers: string[] = []
  if (plan.page_type === 'exhibition' && !plan.exhibition?.booth?.trim()) {
    blockers.push('展位号缺失：档案与知识库都没有，禁止虚构')
  }
  if (plan.page_type === 'promotion' && !plan.promotion?.discount?.trim()) {
    blockers.push('折扣力度缺失：禁止虚构')
  }
  if (plan.page_type === 'lead-gen' && !plan.lead_hook?.trim()) {
    blockers.push('留资钩子缺失')
  }
  return { ...plan, blockers, can_start: blockers.length === 0, missing_modules: blockers.length ? plan.missing_modules : [] }
}

export function buildContextMessage(plan: PrefabPlan): string {
  const productNames = mockProducts
    .filter(p => plan.selected_product_ids.includes(p.id))
    .map(p => p.name)
  const lines = [
    `页面类型：${PAGE_TYPE_LABELS[plan.page_type]}`,
    `承接词：${plan.query}`,
    `来源：${plan.source}`,
    `阶段：${STAGE_LABELS[plan.stage]}`,
    `主CTA：${plan.cta_text}`,
    `intent_id：${plan.intent_id}`,
    `公司名称：${plan.company_name}`,
    `所属行业：机械制造 / 精密机加工`,
    `官网：https://www.haigong-precision.com`,
    `核心卖点：${plan.selling_points}`,
    `目标买家：${plan.target_audience}`,
    `联系方式：${plan.contact_info}`,
    `语言：${plan.language}`,
    `目标地区：${plan.target_region}`,
    `收集表单：${plan.selected_form}`,
    `展示产品：${productNames.length ? productNames.join('、') : '（无）'}`,
  ]
  if (plan.lead_hook) lines.push(`钩子内容：${plan.lead_hook}`)
  if (plan.exhibition) {
    lines.push(`展会名称：${plan.exhibition.name}`)
    lines.push(`展会日期：${plan.exhibition.date}`)
    lines.push(`展会地点：${plan.exhibition.location}`)
    if (plan.exhibition.booth) lines.push(`展位号：${plan.exhibition.booth}`)
  }
  if (plan.promotion) {
    lines.push(`活动截止：${plan.promotion.end_date}`)
    if (plan.promotion.discount) lines.push(`折扣力度：${plan.promotion.discount}`)
  }
  lines.push('图片生成：已关闭')
  lines.push('已齐，勿再 ask_user')
  if (plan.stage === 'awareness') {
    lines.push('表单字段保持短，不要一上来重询盘。认证只写名称，禁止编造编号。')
  }
  return `[配置信息]\n${lines.join('\n')}\n\n[需求]\n${plan.query}`
}
