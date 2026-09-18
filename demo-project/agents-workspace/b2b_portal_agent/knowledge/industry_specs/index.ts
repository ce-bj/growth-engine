import catalogJson from './module-catalog.json'
import industrySpecJson from './industry-content-spec.json'
import typeFallbackJson from './industry-type-fallback.json'
import type {
  AgentIndustryContentSpec,
  AgentIndustryContentSpecLibrary,
  AgentIndustryTypeFallback,
  AgentModuleCatalog,
  ResolvedAgentContentSpec,
} from './types'
import type { IndustryType } from '../types'

export type {
  AgentContentModule,
  AgentContentSpecMatch,
  AgentIndustryContentSpec,
  AgentModuleCatalog,
  AgentModuleCatalogEntry,
  ContentModulePriority,
  ContentOutputShape,
  ResolvedAgentContentSpec,
} from './types'

export const AGENT_MODULE_CATALOG = catalogJson as unknown as AgentModuleCatalog
export const AGENT_INDUSTRY_CONTENT_SPEC = industrySpecJson as unknown as AgentIndustryContentSpecLibrary
export const AGENT_INDUSTRY_TYPE_FALLBACK = typeFallbackJson as unknown as AgentIndustryTypeFallback

const DO_NOT_GENERATE = [
  'C 全站应用模块（品牌故事、售后、价格体系等）— 客户在站点后台配置',
  'D 产品库衍生（相关产品推荐 #99）— 由产品关联自动展示',
]

const TYPE_KEYWORDS: Array<{ type: IndustryType; patterns: RegExp[] }> = [
  { type: '材料化工', patterns: [/材料/, /化工/, /化学/, /催化/, /原料/, /试剂/, /涂料/, /塑料/, /橡胶/, /金属材/] },
  { type: '机械设备', patterns: [/机械/, /设备/, /机床/, /数控/, /注塑/, /泵阀/, /汽车零/, /零部件/, /模具/] },
  { type: '电子电气', patterns: [/电子/, /电气/, /半导体/, /芯片/, /传感器/, /连接/, /电池/, /显示/] },
  { type: '消费品食品', patterns: [/食品/, /饮料/, /消费/, /零售/, /美妆/, /服装/, /鞋/, /酒/] },
  { type: '家居建材', patterns: [/家居/, /建材/, /家具/, /卫浴/, /定制/, /装修/, /建筑/] },
  { type: '服务类', patterns: [/服务/, /咨询/, /律所/, /医院/, /学校/, /物流/, /管理/] },
]

function guessIndustryType(input: string): IndustryType {
  for (const { type, patterns } of TYPE_KEYWORDS) {
    if (patterns.some((p) => p.test(input))) return type
  }
  return '材料化工'
}

function fuzzyFindIndustry(input: string): AgentIndustryContentSpec | undefined {
  const q = input.trim().toLowerCase()
  if (!q) return undefined

  const trimmed = input.trim()
  const exact = AGENT_INDUSTRY_CONTENT_SPEC.industries.find((r) => r.industryName === trimmed)
  if (exact) return exact

  const byAlias = AGENT_INDUSTRY_CONTENT_SPEC.industries.find((r) =>
    r.aliases.some((a) => a === trimmed || a.toLowerCase() === q)
  )
  if (byAlias) return byAlias

  const byName = AGENT_INDUSTRY_CONTENT_SPEC.industries.find(
    (r) => r.industryName.toLowerCase().includes(q) || q.includes(r.industryName.toLowerCase())
  )
  if (byName) return byName

  const byCategory = AGENT_INDUSTRY_CONTENT_SPEC.industries.find(
    (r) => r.productCategory.toLowerCase().includes(q) || q.includes(r.productCategory.toLowerCase())
  )
  if (byCategory) return byCategory

  return undefined
}

function fromIndustryRow(
  row: AgentIndustryContentSpec,
  match: ResolvedAgentContentSpec['match']
): ResolvedAgentContentSpec {
  return {
    match,
    industryName: row.industryName,
    productCategory: row.productCategory,
    industryType: row.industryType,
    contentModuleIds: row.contentModuleIds,
    contentModules: row.contentModules,
    doNotGenerate: DO_NOT_GENERATE,
  }
}

function fromTypeTemplate(
  type: IndustryType,
  input: string,
  match: ResolvedAgentContentSpec['match']
): ResolvedAgentContentSpec {
  const tpl = AGENT_INDUSTRY_TYPE_FALLBACK.templates[type]
  return {
    match,
    industryName: input.trim() || type,
    productCategory: tpl.industryType,
    industryType: type,
    contentModuleIds: tpl.contentModuleIds,
    contentModules: tpl.contentModules,
    doNotGenerate: DO_NOT_GENERATE,
  }
}

/**
 * 用户侧 Agent Tool：按行业查询应生成的 A+B 内容模块清单
 * @param industry Agent 判断出的行业名或品类
 * @param productCategory 可选，提高命中率
 */
export function lookupContentSpec(industry: string, productCategory?: string): ResolvedAgentContentSpec {
  const query = productCategory?.trim() ? `${industry} ${productCategory}` : industry
  const row = fuzzyFindIndustry(query) ?? fuzzyFindIndustry(industry)

  if (row) {
    const isExact =
      row.industryName === industry.trim() ||
      row.aliases.includes(industry.trim()) ||
      (productCategory?.trim() ? row.productCategory === productCategory.trim() : false)
    return fromIndustryRow(row, isExact ? 'exact' : 'fuzzy')
  }

  const type = guessIndustryType(query)
  if (AGENT_INDUSTRY_TYPE_FALLBACK.templates[type]) {
    return fromTypeTemplate(type, industry, 'type-fallback')
  }

  return fromTypeTemplate('材料化工', industry, 'default')
}

export function getAgentModuleById(moduleId: number) {
  return AGENT_MODULE_CATALOG.modules.find((m) => m.id === moduleId)
}

export function searchAgentIndustries(query: string, limit = 20): AgentIndustryContentSpec[] {
  const q = query.trim().toLowerCase()
  if (!q) return AGENT_INDUSTRY_CONTENT_SPEC.industries.slice(0, limit)

  return AGENT_INDUSTRY_CONTENT_SPEC.industries
    .filter(
      (r) =>
        r.industryName.toLowerCase().includes(q) ||
        r.productCategory.toLowerCase().includes(q) ||
        r.industryType.toLowerCase().includes(q) ||
        r.aliases.some((a) => a.toLowerCase().includes(q))
    )
    .slice(0, limit)
}

/** Tool schema 描述，供 Agent 注册 function calling */
export const LOOKUP_CONTENT_SPEC_TOOL = {
  name: 'lookup_content_spec',
  description:
    '查询指定行业的产品详情页应包含的 A+B 内容模块清单（含每块填写指引与输出形态）。生成产品内容前必须先调用。',
  parameters: {
    type: 'object',
    properties: {
      industry: {
        type: 'string',
        description: 'Agent 判断出的行业名称，如「专用化学品」「注塑机设备」',
      },
      productCategory: {
        type: 'string',
        description: '可选：更细的产品品类，如「化学试剂」，用于提高匹配精度',
      },
    },
    required: ['industry'],
  },
} as const
