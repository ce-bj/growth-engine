import type { ContentType, MaterialBudgetItem, MaterialBudgetStatus } from '../types'
import { searchKnowledge } from './knowledge'

/** ═══════════════════════════════════════════════════════════════
   物料预算推导（content-material-budget skill 的规则化实现）
   输入：内容类型 + 主题（简报产出）+ 语言站点（渠道产出）
   输出：MaterialBudgetItem[] —— 一次性列齐"这篇内容需要哪些素材"
   推导：模板 × searchKnowledge 知识库检索 → 状态（已就绪/缺失/待授权）
   ═══════════════════════════════════════════════════════════════ */

/** 素材模板：类型 → 需要哪些素材 + 对应检索关键词构造规则 */
interface TemplateItem {
  templateKey: string
  name: string
  /** 默认状态（当知识库无明确命中也可能触发授权判定时） */
  defaultStatus: MaterialBudgetStatus
  /** 检索 query 关键词，填入主题后去知识库查 */
  queryKeywords: string[]
  /** 若命中但需授权，是否走 pending_auth */
  authSensitive?: boolean
  note?: string
}

const TEMPLATES: Record<ContentType, TemplateItem[]> = {
  product: [
    { templateKey: 'spec', name: '产品规格与型号矩阵', defaultStatus: 'missing', queryKeywords: ['规格', '型号'] },
    { templateKey: 'scene', name: '应用场景说明', defaultStatus: 'missing', queryKeywords: ['应用场景', '案例'] },
    { templateKey: 'limit', name: '使用限制与适用条件', defaultStatus: 'missing', queryKeywords: ['使用限制', '防护', '安全'] },
    { templateKey: 'diff', name: '型号差异对照', defaultStatus: 'missing', queryKeywords: ['型号差异'] },
  ],
  solution: [
    { templateKey: 'pain', name: '行业痛点数据', defaultStatus: 'missing', queryKeywords: ['行业数据', '痛点'] },
    { templateKey: 'fit', name: '方案适用边界', defaultStatus: 'missing', queryKeywords: ['方案', '适用'] },
    { templateKey: 'roi', name: '投资回报测算', defaultStatus: 'missing', queryKeywords: ['回报', '测算'], authSensitive: true },
  ],
  scenario: [
    { templateKey: 'step', name: '作业流程说明', defaultStatus: 'missing', queryKeywords: ['作业流程', '工艺'] },
    { templateKey: 'param', name: '关键工艺参数', defaultStatus: 'missing', queryKeywords: ['工艺参数'] },
    { templateKey: 'env', name: '现场环境前提', defaultStatus: 'missing', queryKeywords: ['环境', '现场'] },
  ],
  case: [
    { templateKey: 'auth', name: '客户公开授权', defaultStatus: 'missing', queryKeywords: ['客户授权'], authSensitive: true },
    { templateKey: 'before_after', name: '实施前后数据', defaultStatus: 'missing', queryKeywords: ['节拍数据', '前后'] },
    { templateKey: 'quote', name: '客户证言', defaultStatus: 'missing', queryKeywords: ['客户证言', '案例'] },
    { templateKey: 'photo', name: '现场图片授权', defaultStatus: 'missing', queryKeywords: ['现场图片'], authSensitive: true },
  ],
  guide: [
    { templateKey: 'param', name: '关键参数 / 规格表', defaultStatus: 'missing', queryKeywords: ['规格', '参数'] },
    { templateKey: 'benchmark', name: '行业基准数据', defaultStatus: 'missing', queryKeywords: ['行业报告', '基准'], authSensitive: true },
    { templateKey: 'term', name: '术语定义', defaultStatus: 'missing', queryKeywords: ['术语'] },
    { templateKey: 'checklist', name: '检查清单素材', defaultStatus: 'missing', queryKeywords: ['检查清单', 'FAQ'] },
  ],
  faq: [
    { templateKey: 'ticket', name: '客服工单高频问题', defaultStatus: 'missing', queryKeywords: ['客服'] },
    { templateKey: 'clause', name: '条款 / 维护周期数据', defaultStatus: 'missing', queryKeywords: ['条款', '维护'] },
  ],
  insight: [
    { templateKey: 'report', name: '白皮书 / 行业报告', defaultStatus: 'missing', queryKeywords: ['白皮书', '报告'] },
    { templateKey: 'data_auth', name: '引用数据授权', defaultStatus: 'missing', queryKeywords: ['数据授权'], authSensitive: true },
  ],
}

const TARGET_CATEGORY: Record<string, { knowledgeBaseType: string; primaryCategory: string; secondaryCategory?: string }> = {
  spec: { knowledgeBaseType: '企业业务知识库', primaryCategory: '产品资料', secondaryCategory: '规格与型号' },
  scene: { knowledgeBaseType: '企业业务知识库', primaryCategory: '产品资料', secondaryCategory: '应用场景' },
  limit: { knowledgeBaseType: '企业业务知识库', primaryCategory: '产品资料', secondaryCategory: '适用边界' },
  diff: { knowledgeBaseType: '企业业务知识库', primaryCategory: '产品资料', secondaryCategory: '型号对比' },
  pain: { knowledgeBaseType: '行业知识库', primaryCategory: '行业研究', secondaryCategory: '痛点与趋势' },
  fit: { knowledgeBaseType: '企业业务知识库', primaryCategory: '服务与方案', secondaryCategory: '适用边界' },
  roi: { knowledgeBaseType: '企业业务知识库', primaryCategory: '服务与方案', secondaryCategory: '投资回报' },
  step: { knowledgeBaseType: '企业业务知识库', primaryCategory: '工艺资料', secondaryCategory: '作业流程' },
  param: { knowledgeBaseType: '企业业务知识库', primaryCategory: '产品资料', secondaryCategory: '参数与规格' },
  env: { knowledgeBaseType: '企业业务知识库', primaryCategory: '工艺资料', secondaryCategory: '现场条件' },
  auth: { knowledgeBaseType: '企业业务知识库', primaryCategory: '客户案例', secondaryCategory: '公开授权' },
  before_after: { knowledgeBaseType: '企业业务知识库', primaryCategory: '客户案例', secondaryCategory: '实施结果' },
  quote: { knowledgeBaseType: '企业业务知识库', primaryCategory: '客户案例', secondaryCategory: '客户证言' },
  photo: { knowledgeBaseType: '企业业务知识库', primaryCategory: '客户案例', secondaryCategory: '图片授权' },
  benchmark: { knowledgeBaseType: '行业知识库', primaryCategory: '行业研究', secondaryCategory: '基准数据' },
  term: { knowledgeBaseType: '企业公共知识库', primaryCategory: '术语规范', secondaryCategory: '标准术语' },
  checklist: { knowledgeBaseType: '企业业务知识库', primaryCategory: '内容素材', secondaryCategory: '检查清单' },
  ticket: { knowledgeBaseType: '企业业务知识库', primaryCategory: '客户服务', secondaryCategory: '客服工单' },
  clause: { knowledgeBaseType: '企业业务知识库', primaryCategory: '服务与方案', secondaryCategory: '条款与维护' },
  report: { knowledgeBaseType: '行业知识库', primaryCategory: '行业研究', secondaryCategory: '报告与白皮书' },
  data_auth: { knowledgeBaseType: '企业公共知识库', primaryCategory: '授权与合规', secondaryCategory: '数据引用授权' },
  rag: { knowledgeBaseType: '企业业务知识库', primaryCategory: '待补知识', secondaryCategory: '生成期缺口' },
}

export function resolveMaterialKnowledgeTarget(type: ContentType, theme: string, templateKey: string, name: string): NonNullable<MaterialBudgetItem['knowledgeTarget']> {
  const category = TARGET_CATEGORY[templateKey] ?? { knowledgeBaseType: '企业业务知识库', primaryCategory: '待补知识', secondaryCategory: '其他资料' }
  const directoryId = category.knowledgeBaseType === '行业知识库' ? 'n3-industry-authorized' : category.knowledgeBaseType === '企业公共知识库' ? 'n3-company-public' : 'n3-business-content'
  return { directoryId, directoryName: category.knowledgeBaseType === '行业知识库' ? '内容智能体 · 已授权行业目录' : '内容智能体 · 企业知识目录', ...category, query: `${theme} ${name}` }
}

/**
 * 推导物料预算：对模板每一项，用「主题 + 关键词」构造 query 检索知识库，
 * 命中已验证 → ready；命中未授权 → pending_auth；未命中 → missing。
 */
export function deriveMaterialBudget(type: ContentType, theme: string, seed: MaterialBudgetItem[] = []): MaterialBudgetItem[] {
  const items = TEMPLATES[type].map((tpl, i): MaterialBudgetItem => {
    // 构造检索 query：主题 + 关键词
    const query = `${theme} ${tpl.queryKeywords.join(' ')}`
    const result = searchKnowledge(query)
    let status: MaterialBudgetStatus
    let source: string | undefined
    let note = tpl.note

    if (result.hit && result.knowledge) {
      if (result.knowledge.authRequired && !result.knowledge.authGranted) {
        status = 'pending_auth'
        note = `命中但需授权：${result.knowledge.source}`
      } else if (result.knowledge.verified) {
        status = 'ready'
        source = result.knowledge.source
        note = `已命中：${result.knowledge.title}`
      } else {
        status = tpl.authSensitive ? 'pending_auth' : 'missing'
        note = '知识库命中但未验证'
      }
    } else {
      status = tpl.authSensitive ? 'pending_auth' : 'missing'
      note = result.suggestion ?? tpl.note
    }
    return {
      id: `mb-${type}-${i}`,
      templateKey: tpl.templateKey,
      name: tpl.name,
      status,
      source,
      note,
      addedDuringGeneration: false,
      knowledgeTarget: resolveMaterialKnowledgeTarget(type, theme, tpl.templateKey, tpl.name),
    }
  })

  // 合并已有预算（含生成期新增缺口）：保留显式状态，模板未覆盖的追加
  const merged = [...items]
  seed.forEach((s) => {
    const idx = merged.findIndex((m) => m.templateKey === s.templateKey)
    if (idx >= 0) merged[idx] = s
    else merged.push(s)
  })
  return merged
}
