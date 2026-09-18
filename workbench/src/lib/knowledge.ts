import { contentTasksData } from '../data/contentMock'

/** ═══════════════════════════════════════════════════════════════
   知识库检索 mock 接口（searchKnowledge / searchGlossary）
   原型阶段：模拟"企业知识库 RAG 检索"，返回是否命中 + 来源 + 授权状态。
   后续接真实 RAG API / 向量库时，仅需替换本文件实现，调用方不变。
   ═══════════════════════════════════════════════════════════════ */

export interface KnowledgeHit {
  /** 命中来源，如「产品参数 · PIM」「项目中心 PJ-106」 */
  source: string
  /** 命中条目标题 */
  title: string
  /** 是否已验证（可引用） */
  verified: boolean
  /** 是否需授权（客户资料/图片/第三方数据等） */
  authRequired: boolean
  /** 授权状态：未授权则内容不可公开 */
  authGranted: boolean
}

export interface KnowledgeSearchResult {
  hit: boolean
  /** 命中返回来源信息，未命中为空 */
  knowledge?: KnowledgeHit
  /** 未命中时给出建议补全方向 */
  suggestion?: string
}

/**
 * 知识库检索：按 query 检索企业知识库，判断"有没有可信来源支撑这个素材"。
 * 命中规则：从现有任务的知识引用（contentTasksData[].knowledge）里做关键词匹配。
 */
export function searchKnowledge(query: string): KnowledgeSearchResult {
  const normalized = query.toLowerCase()
  // 已知知识库条目（从 mock 任务的知识引用中提取去重）
  const known: KnowledgeHit[] = []
  contentTasksData.forEach((t) =>
    t.knowledge.forEach((ref) => {
      if (!known.some((k) => k.title === ref.title)) {
        known.push({
          source: ref.source,
          title: ref.title,
          verified: ref.verified,
          authRequired: ref.category === '应用案例' || ref.category === '项目资料' || ref.category === '客户授权',
          authGranted: ref.verified,
        })
      }
    }),
  )

  // 关键词 → 命中映射：素材模板里的关键名词去知识库里找
  const keywordMap: Array<{ match: string; hit: KnowledgeHit }> = []
  known.forEach((k) => {
    // 简单关联：query 中的核心名词在条目标题/来源里出现即视为可检索到
    const tokens = normalized.split(/[ 的与和、]/).filter(Boolean)
    if (tokens.some((tok) => k.title.toLowerCase().includes(tok) || k.source.toLowerCase().includes(tok))) {
      keywordMap.push({ match: normalized, hit: k })
    }
  })
  // 额外规则：部分高频素材默认命中（企业一定有这些基础资料）
  const builtinHits: Record<string, KnowledgeHit> = {
    规格: { source: '产品参数 · PIM', title: '产品规格表', verified: true, authRequired: false, authGranted: true },
    型号: { source: '产品参数 · PIM', title: '产品型号矩阵', verified: true, authRequired: false, authGranted: true },
    术语: { source: '术语库', title: '专业术语定义', verified: true, authRequired: false, authGranted: true },
    客服: { source: '客服系统', title: '客服工单高频问题', verified: true, authRequired: false, authGranted: true },
  }
  for (const [key, hit] of Object.entries(builtinHits)) {
    if (normalized.includes(key) && !keywordMap.some((m) => m.hit.title === hit.title)) {
      keywordMap.push({ match: normalized, hit })
    }
  }

  if (keywordMap.length > 0) {
    const hit = keywordMap[0].hit
    return {
      hit: true,
      knowledge: hit,
    }
  }
  return {
    hit: false,
    suggestion: '知识库未命中，需人工补充该素材或等待运营上传。',
  }
}

/** 术语库查询：返回术语在各语言站点的译名配置情况 */
export function searchGlossary(term: string) {
  // 简化：返回是否已配置（供物料预算 localization 类素材判断）
  const hit = term.trim().length > 0
  return {
    hit,
    configured: hit,
  }
}

/** 意图推导 mock：从归因意图数据合并出访客问题与受众 */
export interface IntentInput {
  siteSearch?: string
  inboundKeyword?: string
  csIntent?: string
}

export function resolveIntent(intent: IntentInput): { userQuestion: string; audience: string; theme: string } {
  // 三层意图信号合并：站内搜索词 > 来路关键词 > 客服意图
  const source = intent.siteSearch || intent.inboundKeyword || intent.csIntent || ''
  // 取信号里的核心实体（如「CNC 加工配件」「主轴配件」）
  const entityMatch = source.match(/「([^」]+)」/g)?.map((m) => m.replace(/[「」]/g, ''))
  const primary = entityMatch?.[0] || '相关内容'
  return {
    userQuestion: `${primary}有哪些规格、适用机型与常见问题？`,
    audience: `关注「${primary}」的采购与决策人员`,
    theme: primary,
  }
}
