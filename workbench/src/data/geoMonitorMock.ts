/**
 * GEO 信源监测 · 演示数据
 * 说明：全部为演示用示例数据，不代表任何真实公司的真实情况。
 */

export type GeoRegion = 'cn' | 'overseas'

export interface GeoPlatform {
  code: string
  name: string
  short: string
  region: GeoRegion
  /** 品牌图标（public/geo-logos 下的本地文件） */
  logo: string
  /** 单次监测单价（元） */
  price: number
  /** 是否可售卖：依赖平台是否提供可返回引用的开放接口 */
  available: boolean
  /** 不可用或能力受限说明 */
  note?: string
  /** 引用信源可得性 */
  citationLevel: 'high' | 'mid' | 'low'
}

export const GEO_REGION_LABEL: Record<GeoRegion, string> = {
  cn: '国内',
  overseas: '海外',
}

const LOGO_BASE = `${import.meta.env.BASE_URL}geo-logos/`

export const GEO_PLATFORMS: GeoPlatform[] = [
  { code: 'doubao', name: '豆包', short: '豆包', region: 'cn', logo: `${LOGO_BASE}doubao.png`, price: 0.3, available: true, citationLevel: 'high' },
  { code: 'deepseek', name: 'DeepSeek', short: 'DS', region: 'cn', logo: `${LOGO_BASE}deepseek.png`, price: 0.3, available: true, citationLevel: 'low', note: '官方接口引用返回较少' },
  { code: 'kimi', name: 'Kimi', short: 'Kimi', region: 'cn', logo: `${LOGO_BASE}kimi.png`, price: 0.3, available: true, citationLevel: 'mid' },
  { code: 'yuanbao', name: '腾讯元宝', short: '元宝', region: 'cn', logo: `${LOGO_BASE}yuanbao.png`, price: 0.3, available: true, citationLevel: 'mid' },
  { code: 'qwen', name: '通义千问', short: '通义', region: 'cn', logo: `${LOGO_BASE}qwen.png`, price: 0.3, available: true, citationLevel: 'high' },
  { code: 'ernie', name: '文心一言', short: '文心', region: 'cn', logo: `${LOGO_BASE}ernie.png`, price: 0.3, available: true, citationLevel: 'mid' },
  { code: 'chatgpt', name: 'ChatGPT', short: 'GPT', region: 'overseas', logo: `${LOGO_BASE}chatgpt.png`, price: 0.3, available: true, citationLevel: 'high' },
  { code: 'gemini', name: 'Gemini', short: 'Gemini', region: 'overseas', logo: `${LOGO_BASE}gemini.png`, price: 0.3, available: true, citationLevel: 'high' },
  { code: 'google', name: 'Google Search', short: 'Google', region: 'overseas', logo: `${LOGO_BASE}google.png`, price: 0.3, available: true, citationLevel: 'mid', note: '非对话模型，按搜索结果页采集' },
]

export const GEO_PLATFORM_MAP = Object.fromEntries(
  GEO_PLATFORMS.map((p) => [p.code, p]),
) as Record<string, GeoPlatform>

/** 默认勾选：所有可售平台 */
export const DEFAULT_PLATFORM_CODES = GEO_PLATFORMS.filter((p) => p.available).map((p) => p.code)

export interface GeoQuestion {
  id: string
  text: string
  /** 系统预置初始问题 */
  preset: boolean
  enabled: boolean
  platforms: string[]
  createdAt: string
}

export const GEO_PRESET_QUESTIONS: Array<{ id: string; text: string }> = [
  { id: 'gp-q1', text: '{brand} 品牌怎么样' },
  { id: 'gp-q2', text: '{brand} 联系电话是什么' },
  { id: 'gp-q3', text: '{brand} 都有什么产品' },
]

export function buildInitialQuestions(brand: string): GeoQuestion[] {
  const presets: GeoQuestion[] = GEO_PRESET_QUESTIONS.map((q, index) => ({
    id: q.id,
    text: q.text.replace('{brand}', brand),
    preset: true,
    enabled: true,
    platforms: [...DEFAULT_PLATFORM_CODES],
    createdAt: index === 0 ? '2026-10-26' : '2026-10-26',
  }))
  return [
    ...presets,
    {
      id: 'gp-q4',
      text: `${brand} 和同类服务商相比优势在哪`,
      preset: false,
      enabled: true,
      platforms: DEFAULT_PLATFORM_CODES.filter((c) => c !== 'deepseek' && c !== 'google'),
      createdAt: '2026-11-02',
    },
  ]
}

/* ------------------------------------------------------------------ */
/* 监测结果                                                            */
/* ------------------------------------------------------------------ */

export type GeoCellStatus = 'success' | 'no_citation' | 'failed' | 'pending'

export interface GeoCitation {
  seq: number
  title: string
  /** 内容摘要（抓取页面正文后的要点摘录） */
  summary: string
  url: string
  domain: string
  /** 是否为我方域名 */
  own: boolean
  /** 被引用次数（同一 URL 重复引用合并） */
  hits: number
}

export interface GeoCell {
  status: GeoCellStatus
  answer: string
  citations: GeoCitation[]
  charged: number
}

/** 演示用信源池（示例标题与摘要，非真实内容） */
const CITATION_POOL: Array<{
  title: string
  summary: string
  url: string
  domain: string
  own?: boolean
}> = [
  {
    title: '2026 企业出海建站服务商横评：10 家主流厂商对比（示例）',
    summary:
      '横向对比 10 家服务商的建站周期、多语言站点支持与年费区间。结论是 3 万元以下套餐普遍不含小语种站点，且多数不提供海外 CDN 加速。',
    url: 'https://www.zhihu.com/question/000000/answer/000001',
    domain: 'zhihu.com',
  },
  {
    title: '外贸独立站怎么选服务商？从建站到获客的完整链路（示例）',
    summary:
      '把选服务商、域名与备案、内容准备、投放获客拆成四个阶段，建议先跑通询盘链路再扩语种，避免预算压在无效流量上。',
    url: 'https://36kr.com/p/0000000000001',
    domain: '36kr.com',
  },
  {
    title: '企业官网建设的 7 个关键指标（示例）',
    summary:
      '列出资料下载量、询盘转化率、页面停留时长、移动端首屏加载等 7 项指标，并给出 B2B 与制造业的参考区间。',
    url: 'https://www.example.com/blog/website-kpi',
    domain: 'www.example.com',
    own: true,
  },
  {
    title: 'B2B 企业如何做海外搜索引擎优化（示例）',
    summary:
      '梳理 hreflang 配置、外链结构、结构化数据三类基础项，指出中小企业多数卡在内容本地化而不是技术项。',
    url: 'https://www.sohu.com/a/000000001',
    domain: 'sohu.com',
  },
  {
    title: '常见建站服务报价区间整理（示例）',
    summary:
      '按展示站、营销站、多语言站三类给出 1.2 万到 15 万的报价区间，并注明域名、服务器与后期维护费是否包含在内。',
    url: 'https://baijiahao.baidu.com/s?id=000000001',
    domain: 'baijiahao.baidu.com',
  },
  {
    title: '独立站与平台店铺的成本对比（示例）',
    summary:
      '以年 GMV 300 万为假设，对比独立站自建与平台店铺的佣金、广告与人力成本，独立站从第二年起成本优势明显。',
    url: 'https://www.jianshu.com/p/0000000001',
    domain: 'jianshu.com',
  },
  {
    title: '中小企业数字化营销服务商名录（示例）',
    summary:
      '按建站、投放、内容运营、SCRM 四类整理服务商名录，标注各家主要客群与平均交付周期，便于初步筛选。',
    url: 'https://www.csdn.net/article/0000001',
    domain: 'csdn.net',
  },
  {
    title: '官网上线前的检查清单（示例）',
    summary:
      '包含 23 项上线前检查：TDK 完整性、404 与跳转规则、表单可提交性、多端适配、统计代码与 robots 配置。',
    url: 'https://www.example.com/checklist',
    domain: 'www.example.com',
    own: true,
  },
  {
    title: 'AI 搜索时代品牌内容如何被引用（示例）',
    summary:
      '分析 AI 回答偏好的内容形态，结论是带明确数字、时间与出处的长文，被引用的概率显著高于纯营销落地页。',
    url: 'https://www.douban.com/note/000000001',
    domain: 'douban.com',
  },
  {
    title: '企业服务商资质查询指引（示例）',
    summary:
      '说明如何在国家企业信用信息公示系统核验营业执照、经营范围与行政处罚记录，附完整查询路径与常见误区。',
    url: 'https://www.sina.com.cn/0000001',
    domain: 'sina.com.cn',
  },
]

const ANSWER_TEMPLATE = [
  '（示例回答）该品牌在公开资料中被描述为一家提供企业建站与数字营销服务的厂商，常见信息包括成立时间、服务范围与产品线。以上内容由模型基于检索结果生成，仅用于演示。',
  '（示例回答）公开渠道可查到的联系电话通常来自企业官网「联系我们」页与工商信息平台。本次回答引用了 {n} 条来源，其中包含第三方信息聚合站。',
  '（示例回答）该品牌的产品线一般包括企业官网建设、多语言站点、海外推广与配套运营服务。不同来源的描述存在差异。',
  '（示例回答）同类服务商对比类问题的回答通常会引用行业横评文章与厂商官网，引用来源较为分散。',
]

function hashSeed(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) % 100000
  }
  return h
}

function buildCell(questionId: string, platformCode: string): GeoCell {
  const platform = GEO_PLATFORM_MAP[platformCode]
  const seed = hashSeed(`${questionId}-${platformCode}`)

  // 演示异常态：文心一言在「联系电话」问题上返回失败
  if (questionId === 'gp-q2' && platformCode === 'ernie') {
    return {
      status: 'failed',
      answer: '',
      citations: [],
      charged: 0,
    }
  }

  const maxCount = platform.citationLevel === 'high' ? 5 : platform.citationLevel === 'mid' ? 3 : 2
  const count = seed % (maxCount + 1)

  if (count === 0) {
    return {
      status: 'no_citation',
      answer: ANSWER_TEMPLATE[seed % ANSWER_TEMPLATE.length].replace('{n}', '0'),
      citations: [],
      charged: platform.price,
    }
  }

  const citations: GeoCitation[] = Array.from({ length: count }, (_, index) => {
    const item = CITATION_POOL[(seed + index * 3) % CITATION_POOL.length]
    return {
      seq: index + 1,
      title: item.title,
      summary: item.summary,
      url: item.url,
      domain: item.domain,
      own: Boolean(item.own),
      hits: 1 + ((seed + index) % 2),
    }
  })

  // 同一个 URL 被重复引用时合并为一条，命中次数累加
  const merged = new Map<string, GeoCitation>()
  citations.forEach((item) => {
    const exist = merged.get(item.url)
    if (exist) {
      exist.hits += item.hits
    } else {
      merged.set(item.url, { ...item })
    }
  })

  return {
    status: 'success',
    answer: ANSWER_TEMPLATE[(seed + 1) % ANSWER_TEMPLATE.length].replace('{n}', String(merged.size)),
    citations: [...merged.values()],
    charged: platform.price,
  }
}

export function buildGeoCells(questions: GeoQuestion[]): Record<string, GeoCell> {
  const cells: Record<string, GeoCell> = {}
  questions.forEach((question) => {
    question.platforms.forEach((code) => {
      cells[`${question.id}:${code}`] = buildCell(question.id, code)
    })
  })
  return cells
}

export function cellKey(questionId: string, platformCode: string) {
  return `${questionId}:${platformCode}`
}

/* ------------------------------------------------------------------ */
/* 汇总                                                                */
/* ------------------------------------------------------------------ */

export interface GeoDomainStat {
  domain: string
  count: number
  own: boolean
}

export function summarizeDomains(cells: Record<string, GeoCell>): GeoDomainStat[] {
  const map = new Map<string, GeoDomainStat>()
  Object.values(cells).forEach((cell) => {
    cell.citations.forEach((citation) => {
      const exist = map.get(citation.domain)
      if (exist) {
        exist.count += citation.hits
      } else {
        map.set(citation.domain, {
          domain: citation.domain,
          count: citation.hits,
          own: citation.own,
        })
      }
    })
  })
  return [...map.values()].sort((a, b) => b.count - a.count)
}

export interface GeoContentItem {
  url: string
  title: string
  summary: string
  domain: string
  own: boolean
  /** 该内容被引用总次数 */
  hits: number
  /** 引用过这条内容的模型 code */
  models: string[]
  /** 回答了哪些问题 */
  questions: string[]
}

/** 把所有平台的引用结果按 URL 去重汇总成「被引用内容」清单 */
export function summarizeCitations(
  cells: Record<string, GeoCell>,
  questions: GeoQuestion[],
): GeoContentItem[] {
  const map = new Map<string, GeoContentItem>()
  questions.forEach((question) => {
    question.platforms.forEach((code) => {
      const cell = cells[`${question.id}:${code}`]
      if (!cell) return
      cell.citations.forEach((citation) => {
        const exist = map.get(citation.url)
        if (exist) {
          exist.hits += citation.hits
          if (!exist.models.includes(code)) exist.models.push(code)
          if (!exist.questions.includes(question.text)) exist.questions.push(question.text)
        } else {
          map.set(citation.url, {
            url: citation.url,
            title: citation.title,
            summary: citation.summary,
            domain: citation.domain,
            own: citation.own,
            hits: citation.hits,
            models: [code],
            questions: [question.text],
          })
        }
      })
    })
  })
  const order = new Map(GEO_PLATFORMS.map((platform, index) => [platform.code, index]))
  return [...map.values()]
    .sort((a, b) => {
      // 我方内容排在最前，用户第一眼就能确认官网有没有被引
      if (a.own !== b.own) return a.own ? -1 : 1
      return b.hits - a.hits
    })
    .map((item) => ({
      ...item,
      // 模型标签统一按平台清单顺序排列，避免同一内容每次位置不同
      models: [...item.models].sort((a, b) => (order.get(a) ?? 99) - (order.get(b) ?? 99)),
    }))
}

/** 计费单价：每个模型每次监测（元） */
export const GEO_UNIT_PRICE = 0.3
