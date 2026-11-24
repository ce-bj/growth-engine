import type { ViewId } from '../types'

/**
 * 四幕式产品叙事 · 统一状态底座
 * 保证「增长首页」「左侧菜单角标」「访客与漏斗洞察」「优化策略（Gate 1）」「智能营销页 / 官网内容发布（Gate 2）」
 * 读取同一份实时状态，并在 localStorage + window Event / postMessage 之间保持同步。
 */

export const GROWTH_FLOW_STORAGE_KEY = 'growth-workbench-flow-v1'
export const GROWTH_FLOW_EVENT = 'growth-flow-change'

export type GateStage = 'pending_strategy' | 'pending_publish' | 'pending_optimize' | 'done' | 'skipped'

export interface GrowthKpiItem {
  id: 'uv' | 'viewRate' | 'leads' | 'leadRate'
  title: string
  value: string
  rawValue: number
  prevValue: string
  deltaText: string
  trend: 'up' | 'down' | 'flat'
  abnormal: boolean
  hint: string
}

export interface GrowthTodoItem {
  id: string
  /** 对应 vis-analysis 里的策略卡或跟进任务 key */
  focusKey: string
  title: string
  desc: string
  /** 来源智能体标签 */
  sourceAgent: '优化策略' | '智能营销页' | '官网内容发布' | 'AI 友好度体检'
  /** 执行端页面 */
  targetView: 'visitor' | 'marketing' | 'content' | 'ready'
  /** 当前所处两步确认闸门状态 */
  stage: GateStage
  submittedAt: string
  waitingText: string
  targetUrl?: string
  /** 传给第四幕预览发布界面的草稿与关键修改点标注 */
  draftPreview?: {
    pageType: string
    targetUrl: string
    heroHeadline: string
    heroSubhead: string
    highlights: Array<{
      tag: string
      label: string
      before: string
      after: string
    }>
    sections: Array<{
      title: string
      content: string
    }>
  }
}

export interface GrowthDoneItem {
  id: string
  focusKey?: string
  time: string
  agent: string
  title: string
  method: 'agreed' | 'manual' | 'strategy'
  /** 已上线页面，点击「去查看」在新标签打开 */
  liveUrl?: string
  /** 没有对外页面时，回到对应模块 */
  view?: ViewId
}

export interface GrowthFlowState {
  /** Gate 1 已同意但尚未发布的策略 key -> 时间 */
  approvedStrategies: Record<string, string>
  /** Gate 1 暂不处理的策略 key -> 原因 */
  skippedStrategies: Record<string, string>
  /** Gate 2 已确认发布上线的任务 key -> 时间 */
  publishedTasks: Record<string, string>
}

const DEFAULT_FLOW_STATE: GrowthFlowState = {
  approvedStrategies: {},
  skippedStrategies: {},
  publishedTasks: {},
}

export const overviewMonth = {
  label: '9 月',
  span: '9月14日 – 9月20日（最新完整周）',
  baselineSpan: '对照上一周 · 9月7日 – 9月13日',
  updatedAt: '09-21 09:30',
  /** 与顶部「最新完整周」对齐，MM-DD */
  weekFrom: '09-14',
  weekTo: '09-20',
}

const DEMO_ORIGIN = 'https://www.demo-cnc-oem.com'

/** 把待办里的站内路径收成可打开的官网地址；多地址只取第一个 */
export function toAbsoluteDemoUrl(raw?: string) {
  if (!raw) return undefined
  const first = raw.split(/[&·]/)[0]?.trim().replace(/（[\s\S]*$/, '').trim()
  if (!first) return undefined
  if (/^https?:\/\//i.test(first)) return first
  if (first.startsWith('/')) return `${DEMO_ORIGIN}${first}`
  return undefined
}

/** 没有标准日期（如「刚刚」）的完成项算进当前周；有日期的必须落在最新完整周内 */
export function isInCurrentWeek(time: string) {
  const matched = /^(\d{2}-\d{2})/.exec(time.trim())
  if (!matched) return true
  return matched[1] >= overviewMonth.weekFrom && matched[1] <= overviewMonth.weekTo
}

/**
 * 顶部 4 大核心指标红绿灯（与「访客与漏斗洞察」全站口径严格一致：
 * 访问人数 1,650 / 有效浏览率 30.0% / 留资数 34 / 留资转化率 2.1%）
 */
export const CORE_KPIS: GrowthKpiItem[] = [
  {
    id: 'uv',
    title: '访问人数',
    value: '1,650',
    rawValue: 1650,
    prevValue: '上周 1,640 人',
    deltaText: '+0.6%',
    trend: 'up',
    abnormal: false,
    hint: '进站总人数基本持平，流量入口稳定',
  },
  {
    id: 'viewRate',
    title: '有效浏览率',
    value: '30.0%',
    rawValue: 30.0,
    prevValue: '上周 40.0%',
    deltaText: '-10.0%',
    trend: 'down',
    abnormal: true,
    hint: '主病灶：访客进站后在首屏流失，未看进核心参数',
  },
  {
    id: 'leads',
    title: '留资数',
    value: '34',
    rawValue: 34,
    prevValue: '上周 45 条',
    deltaText: '-24.4%',
    trend: 'down',
    abnormal: true,
    hint: '有效浏览人数下跌，连带拖累本周询盘留资条数',
  },
  {
    id: 'leadRate',
    title: '留资转化率',
    value: '2.1%',
    rawValue: 2.1,
    prevValue: '上周 2.7%',
    deltaText: '-0.6%',
    trend: 'down',
    abnormal: true,
    hint: '低于近 4 周均值，需优先止血首屏承接与询价落地页',
  },
]

/** AI 友好度体检里尚未处理的子任务，名称与体检页卡片标题一致 */
const READY_OPTIMIZE_TODOS: GrowthTodoItem[] = [
  ['brand-name', '品牌名称表述不一致'],
  ['brand-selling', '核心卖点表述不一致'],
  ['brand-contact', '联系方式与地址表述不一致'],
  ['readable-faq', 'FAQ 问答内容缺失'],
  ['readable-product', '产品详情页信息不足'],
  ['readable-marketing', '过度营销化表达'],
  ['trust-cert', '资质证书'],
  ['trust-case', '真实客户案例'],
].map(([focusKey, title]) => ({
  id: `todo-ready-${focusKey}`,
  focusKey,
  title,
  desc: '',
  sourceAgent: 'AI 友好度体检' as const,
  targetView: 'ready' as const,
  stage: 'pending_optimize' as const,
  submittedAt: '09-21 09:30',
  waitingText: '',
}))

/** 基础待办池：待定策略、待确认发布，以及 AI 友好度体检子任务 */
export const BASE_GROWTH_TODOS: GrowthTodoItem[] = [
  {
    id: 'todo-detail-6061',
    focusKey: 't-detail',
    title: 'CNC-6061 铝支架详情页 · 首屏补齐型号参数与打样周期',
    desc: '近 7 天 420 人进站仅 21.9% 继续浏览；将 6061-T6 材质、±0.02mm 公差与 48h 打样提至第一屏。',
    sourceAgent: '优化策略',
    targetView: 'content',
    stage: 'pending_strategy',
    submittedAt: '09-21 02:20',
    waitingText: '今日新增诊断',
    targetUrl: 'https://www.demo-cnc-oem.com/products/cnc-6061-bracket',
    draftPreview: {
      pageType: '产品详情页改版草稿',
      targetUrl: '/products/cnc-6061-bracket',
      heroHeadline: 'CNC-6061 Aluminum Bracket · ±0.02mm Precision OEM',
      heroSubhead: 'Material 6061-T6 · Anodizing 10–25 μm · 48-Hour Rapid Sample · MOQ 50 pcs',
      highlights: [
        {
          tag: '首屏重构',
          label: '核心规格参数前置',
          before: '首屏仅展示工厂航拍与 20 年品牌故事，参数表埋在第 3 屏',
          after: '首屏第一段直出型号 CNC-6061、材质 6061-T6、公差 ±0.02mm、MOQ 50 pcs',
        },
        {
          tag: '交期承诺',
          label: '补齐打样与批量周期',
          before: '未写明打样耗时，询价买家因交期不明离开',
          after: '引用企业知识库规范：打样周期 48 小时，批量交期 15–20 天',
        },
        {
          tag: '资质背书',
          label: 'ISO9001 认证随参数同屏展示',
          before: '仅底部文字提及认证',
          after: '首屏规格栏旁展示 ISO9001:2015 认证编号与检测说明',
        },
      ],
      sections: [
        {
          title: '第一屏正文（AI 生成草稿）',
          content:
            'Model: CNC-6061 Aluminum Bracket. Material: 6061-T6; Tolerance: ±0.02 mm; Finish: Anodizing / Powder coat; MOQ: 50 pcs; Lead time: 15–20 days; Rapid prototyping: 48 hours.',
        },
        {
          title: '保留模块（未改动）',
          content: '页面标题、询盘按钮样式、页头页脚与产品实拍图保持原样，不额外编造未授权参数。',
        },
      ],
    },
  },
  {
    id: 'todo-landing-oem',
    focusKey: 't-landing',
    title: '新建「CNC OEM 询价」专属营销落地页，替换原品牌宣传页',
    desc: '询价广告 210 人进站 85% 秒退；新建面向 cnc machining quote 买家的报价承接页。',
    sourceAgent: '优化策略',
    targetView: 'marketing',
    stage: 'pending_strategy',
    submittedAt: '09-21 02:20',
    waitingText: '今日新增诊断',
    targetUrl: '/campaign/cnc-oem-quote',
    draftPreview: {
      pageType: '营销落地页草稿（English）',
      targetUrl: '/campaign/cnc-oem-quote（替换 /campaign/cnc-oem-q3）',
      heroHeadline: 'Get Your 3–5 Axis CNC Machining Quote in 24 Hours',
      heroSubhead: 'ISO9001 Certified · 48-Hour Sample Delivery · Upload STEP / DWG / PDF Drawings Directly',
      highlights: [
        {
          tag: '来意对齐',
          label: '首屏价值主张对齐询价搜索词',
          before: '原页标题 Q3 OEM Capability，主讲 20,000㎡ 厂房航拍',
          after: '直击 cnc machining quote / oem cnc quote，首屏承诺 48 小时出样与快速报价',
        },
        {
          tag: '询盘入口',
          label: '首屏内嵌图纸上传与快速询价表单',
          before: '首屏无表单，需滚动到底部联系邮箱',
          after: '首屏右侧直接提供材质/数量选择与图纸上传入口（直连 sales@demo-cnc-oem.com）',
        },
        {
          tag: '加工能力',
          label: '标注 3–5 轴 CNC 与 ISO9001 认证',
          before: '散落在多段介绍中',
          after: '首屏三大信任徽章：3–5 轴精密加工、ISO9001 体系、48h 快样',
        },
      ],
      sections: [
        {
          title: 'Hero 首屏模块',
          content:
            '主标题强调 3–5 轴 CNC 定制报价与 48 小时打样，副标题写明支持 STEP / DWG / PDF 图纸直传，右侧配置精简 4 字段留资表单。',
        },
        {
          title: '工艺与质量背书模块',
          content: '严格调用知识库已授权字段：ISO9001 认证、3–5 轴加工中心、打样周期 48 小时，不虚构客户 Logo。',
        },
      ],
    },
  },
  {
    id: 'todo-article-dwg',
    focusKey: 't-article',
    title: '新建技术选型文章：6061 支架 DWG 图纸规范与阳极氧化膜厚指南',
    desc: '站内高频搜索 custom bracket drawing dwg 与 anodizing thickness 6061 共 13 次全为 0 结果。',
    sourceAgent: '优化策略',
    targetView: 'content',
    stage: 'pending_strategy',
    submittedAt: '09-21 02:20',
    waitingText: '上周延续 · 待拍板',
    targetUrl: '/blog/6061-bracket-dwg-anodizing-guide',
    draftPreview: {
      pageType: '官网专业文章草稿',
      targetUrl: '/blog/6061-bracket-dwg-anodizing-guide',
      heroHeadline: 'custom bracket drawing dwg 与 anodizing thickness 6061：图纸格式与氧化膜厚指南',
      heroSubhead: '可接收图纸：STEP / DWG / PDF · 本色/黑色阳极氧化：10–25 μm · 附 CNC-6061 支架选型入口',
      highlights: [
        {
          tag: '零结果词覆盖',
          label: '标题与首段精确命中站内零结果搜索词',
          before: '站内搜索 13 次均返回空列表，56% 访客当场离开',
          after: '全文覆盖 custom bracket drawing dwg 与 anodizing thickness 6061，上线即消除零结果',
        },
        {
          tag: '工艺参数校验',
          label: '严格采用企业知识库膜厚标准',
          before: '旧教程未说明 6061 氧化膜厚区间',
          after: '写明本色阳极氧化 10–25 μm、黑色阳极氧化 10–25 μm，不引用外部未授权标准',
        },
        {
          tag: '转化内链',
          label: '文末直连主力型号详情页',
          before: '技术文章无产品跳转入口',
          after: '文末锚文本直链 CNC-6061 Aluminum Bracket 产品详情页，承接选型询价',
        },
      ],
      sections: [
        {
          title: '第 1 节：可接收图纸格式',
          content: '明确回答工程买家：可接收图纸：STEP / DWG / PDF，支持 3D 与 2D 公差标注核对。',
        },
        {
          title: '第 2 节：6061 阳极氧化膜厚与产品内链',
          content:
            '明确回答：本色阳极氧化：10–25 μm；黑色阳极氧化：10–25 μm。文末引导访问 CNC-6061 Aluminum Bracket 获取报价。',
        },
      ],
    },
  },
  {
    id: 'todo-sample-page',
    focusKey: 'k-sample',
    title: '「CNC 48小时快样」专属营销落地页草稿待确认上线',
    desc: '已按 8月31日–9月6日诊断策略生成完毕，首屏突出 48 小时打样与 ISO9001，等你预览确认后正式发布。',
    sourceAgent: '智能营销页',
    targetView: 'marketing',
    stage: 'pending_publish',
    submittedAt: '09-18 09:20',
    waitingText: 'AI 已生成完毕 · 待预览发布',
    targetUrl: '/campaign/cnc-sample',
    draftPreview: {
      pageType: '营销落地页成品草稿（待发布）',
      targetUrl: '/campaign/cnc-sample',
      heroHeadline: '48-Hour Rapid CNC Prototyping · ISO9001 Certified Factory',
      heroSubhead: 'Built for 48 hour sample & rapid cnc prototyping buyers · Direct engineering review & instant quote',
      highlights: [
        {
          tag: '新增交期模块',
          label: '首屏显著标注 48 小时快样交付流程',
          before: '原快样流量落在综合产品列表页，无打样交期说明（接住率仅 25%）',
          after: '首屏展示「图纸评估 → 48h 机加出样 → 三坐标检测 → 顺丰/DHL 寄样」四步承诺',
        },
        {
          tag: '认证资质',
          label: '嵌入 ISO9001 质量认证与公差保障',
          before: '列表页无资质展示',
          after: '首屏右侧挂载 ISO9001 认证标识，打消海外采购首单顾虑',
        },
        {
          tag: '询盘入口',
          label: '「获取快样报价」专属 CTA 与表单',
          before: '需点进子详情页才能找到联系入口',
          after: '首屏直出 Get 48h Sample Quote 表单，预计每周多接住约 8 名快样意向访客',
        },
      ],
      sections: [
        {
          title: '首屏 Hero 与快样询价表单',
          content: '针对 48 hour sample 搜索意图定制，首屏左列展示核心卖点（打样：48 小时 / 认证：ISO9001），右列为快速获取报价表单。',
        },
      ],
    },
  },
  {
    id: 'todo-content-sdph',
    focusKey: 'td1',
    title: 'SDPH 产品介绍修正 + PT100 选型指南（2 篇内容待确认发布）',
    desc: '已完成 EEAT 专业度强化与电流规格参数校核，自检评分 92 分，确认后即刻上线官网。',
    sourceAgent: '官网内容发布',
    targetView: 'content',
    stage: 'pending_publish',
    submittedAt: '09-19 10:05',
    waitingText: 'AI 已生成完毕 · 待预览发布',
    targetUrl: '/products/sdph-series & /blog/pt100-selection-guide',
    draftPreview: {
      pageType: '官网内容修正与专业文章（2 篇待发）',
      targetUrl: '/products/sdph-series · /blog/pt100-selection-guide',
      heroHeadline: 'SDPH 系列全国产大电流型产品介绍 & PT100 温度传感器选型指南',
      heroSubhead: '已完成参数勘误、EEAT 权威信源补强与 GEO 结构化问答排版',
      highlights: [
        {
          tag: '参数勘误',
          label: '修正 SDPH 系列额定电流与温升规格表',
          before: '原页面电流规格表述存在前后不一致，易引发工程采购疑虑',
          after: '对照产品与参数库统一修正额定电流与散热曲线说明',
        },
        {
          tag: '结构化摘要',
          label: '新增 GEO 友好型核心结论框与 FAQ',
          before: '纯长文段落，AI 搜索引擎与买家均难以快速抓取选型结论',
          after: '篇首新增 3 条选型速查表与 A/B 级精度对照参数',
        },
        {
          tag: '询盘引导',
          label: '底部挂载选型咨询与样品申请入口',
          before: '文末无转化动作',
          after: '新增「索取完整规格书 / 预约工程师选型」入口',
        },
      ],
      sections: [
        {
          title: '篇目 1：SDPH 系列全国产大电流型 — 产品介绍',
          content: '已修正额定电流参数表，补齐国产化元器件批次说明与高负载温升测试数据。',
        },
        {
          title: '篇目 2：PT100 温度传感器选型指南',
          content: '已补齐 Class A / Class B 精度等级对照表及三线制/四线制接线建议，通过合规与质量自检。',
        },
      ],
    },
  },
  ...READY_OPTIMIZE_TODOS,
]

export const DONE_METHOD_LABEL = {
  agreed: '你已同意',
  manual: '人工处理',
  strategy: '出策略',
} as const

export type DoneMethod = keyof typeof DONE_METHOD_LABEL
export type DoneTask = GrowthDoneItem

export const BASE_OVERVIEW_DONE: GrowthDoneItem[] = [
  {
    id: 'd8',
    focusKey: 'k-quote',
    time: '09-17 16:40',
    agent: '智能营销页',
    title: '「询价」落地页 v2 确认发布上线',
    method: 'agreed',
    liveUrl: 'https://www.demo-cnc-oem.com/campaign/cnc-oem-q3',
    view: 'marketing',
  },
  {
    id: 'd7',
    time: '09-16 10:00',
    agent: '官网内容发布',
    title: '发布 3 篇产品选型指南与工艺问答',
    method: 'agreed',
    liveUrl: 'https://www.demo-cnc-oem.com/blog/cnc-tolerance-guide',
    view: 'content',
  },
  {
    id: 'd6',
    time: '09-15 02:30',
    agent: 'AI 友好度体检',
    title: '修复 sitemap 与 2 处死链，放行主流 AI 爬虫',
    method: 'agreed',
    view: 'ready',
  },
  {
    id: 'd3',
    time: '09-12 10:00',
    agent: '官网内容发布',
    title: '「六角螺栓 M8×30」产品详情页参数补全上线',
    method: 'agreed',
    liveUrl: 'https://www.demo-cnc-oem.com/products/hex-bolt-m8x30',
    view: 'content',
  },
  {
    id: 'd2',
    time: '09-09 10:00',
    agent: '官网内容发布',
    title: '发布 2 篇行业常见问答（FAQ）',
    method: 'agreed',
    liveUrl: 'https://www.demo-cnc-oem.com/blog/cnc-tolerance-guide',
    view: 'content',
  },
]

export function readGrowthFlowState(): GrowthFlowState {
  if (typeof window === 'undefined') return DEFAULT_FLOW_STATE
  try {
    const raw = window.localStorage.getItem(GROWTH_FLOW_STORAGE_KEY)
    if (!raw) return DEFAULT_FLOW_STATE
    const parsed = JSON.parse(raw) as Partial<GrowthFlowState>
    return {
      approvedStrategies: parsed.approvedStrategies || {},
      skippedStrategies: parsed.skippedStrategies || {},
      publishedTasks: parsed.publishedTasks || {},
    }
  } catch {
    return DEFAULT_FLOW_STATE
  }
}

export function writeGrowthFlowState(next: GrowthFlowState) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(GROWTH_FLOW_STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(GROWTH_FLOW_EVENT, { detail: next }))
}

export function approveStrategyInFlow(focusKey: string, stamp = '刚刚') {
  const cur = readGrowthFlowState()
  const next: GrowthFlowState = {
    ...cur,
    approvedStrategies: { ...cur.approvedStrategies, [focusKey]: stamp },
  }
  delete next.skippedStrategies[focusKey]
  writeGrowthFlowState(next)
  return next
}

export function skipStrategyInFlow(focusKey: string, reason = '以后再说') {
  const cur = readGrowthFlowState()
  const next: GrowthFlowState = {
    ...cur,
    skippedStrategies: { ...cur.skippedStrategies, [focusKey]: reason },
  }
  delete next.approvedStrategies[focusKey]
  writeGrowthFlowState(next)
  return next
}

export function undoStrategyInFlow(focusKey: string) {
  const cur = readGrowthFlowState()
  const next: GrowthFlowState = {
    ...cur,
    approvedStrategies: { ...cur.approvedStrategies },
    skippedStrategies: { ...cur.skippedStrategies },
  }
  delete next.approvedStrategies[focusKey]
  delete next.skippedStrategies[focusKey]
  writeGrowthFlowState(next)
  return next
}

export function publishTaskInFlow(focusKey: string, stamp = '刚刚') {
  const cur = readGrowthFlowState()
  const next: GrowthFlowState = {
    ...cur,
    publishedTasks: { ...cur.publishedTasks, [focusKey]: stamp },
  }
  writeGrowthFlowState(next)
  return next
}

export function resetGrowthFlowState() {
  writeGrowthFlowState(DEFAULT_FLOW_STATE)
  return DEFAULT_FLOW_STATE
}

/** 根据当前状态计算首页与导航所需的待办列表、已完成列表及各菜单角标数 */
export function computeGrowthBoard(flow: GrowthFlowState) {
  const activeTodos: GrowthTodoItem[] = []
  const newlyDone: GrowthDoneItem[] = []

  for (const item of BASE_GROWTH_TODOS) {
    const publishedAt = flow.publishedTasks[item.focusKey] || flow.publishedTasks[item.id]
    if (publishedAt && item.stage !== 'pending_optimize') {
      newlyDone.push({
        id: `done-${item.id}`,
        focusKey: item.focusKey,
        time: publishedAt,
        agent: item.targetView === 'marketing' ? '智能营销页' : '官网内容发布',
        title: `${item.title.replace(/待确认上线|待确认发布/g, '')}（已确认发布上线）`,
        method: 'agreed',
        liveUrl: toAbsoluteDemoUrl(item.targetUrl),
        view: item.targetView,
      })
      continue
    }

    if (flow.skippedStrategies[item.focusKey]) {
      continue
    }

    if (item.stage === 'pending_strategy' && flow.approvedStrategies[item.focusKey]) {
      activeTodos.push({
        ...item,
        stage: 'pending_publish',
        sourceAgent: item.targetView === 'marketing' ? '智能营销页' : '官网内容发布',
        waitingText: '策略已同意 · AI 已生成草稿待预览发布',
      })
      continue
    }

    activeTodos.push(item)
  }

  // 离商机变现越近越靠前：待确认发布 > 待定策略 > AI 友好度体检
  const pendingStrategyList = activeTodos.filter((t) => t.stage === 'pending_strategy')
  const pendingOptimizeList = activeTodos.filter((t) => t.stage === 'pending_optimize')
  const pendingPublishList = activeTodos.filter((t) => t.stage === 'pending_publish')
  const marketingPublishCount = pendingPublishList.filter((t) => t.targetView === 'marketing').length
  const contentPublishCount = pendingPublishList.filter((t) => t.targetView === 'content').length

  const doneList: GrowthDoneItem[] = [...newlyDone, ...BASE_OVERVIEW_DONE]
  const weekDoneList = doneList.filter((item) => isInCurrentWeek(item.time))

  return {
    todos: [...pendingPublishList, ...pendingStrategyList, ...pendingOptimizeList],
    pendingStrategyCount: pendingStrategyList.length,
    pendingOptimizeCount: pendingOptimizeList.length,
    pendingPublishCount: pendingPublishList.length,
    marketingPublishCount,
    contentPublishCount,
    totalPendingCount: activeTodos.length,
    doneList,
    weekDoneList,
  }
}

/** 兼容旧引用 */
export const overviewPending = BASE_GROWTH_TODOS.map((item) => ({
  id: item.id,
  agent: item.sourceAgent,
  view: (item.stage === 'pending_strategy' ? 'visitor' : item.targetView) as ViewId,
  title: item.title,
  desc: item.desc,
  submittedAt: item.submittedAt,
  waiting: item.waitingText,
}))

export const overviewDone = BASE_OVERVIEW_DONE
export const overviewAgents = []
