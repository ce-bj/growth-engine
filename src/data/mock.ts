import type {
  AgentInfo,
  AutoDetectConfig,
  DetectHistoryRow,
  DimensionScore,
  FixTaskRow,
  FunnelData,
  HealthSnapshot,
  IssueItem,
  Lead,
  LeadStats,
  ScanStep,
  SiteInfo,
  WeeklyReportRow,
} from '../types'

/** 后台样例数据，对照 PRD 文案与示例数值 */

export const PLATFORM_NAME = '数字门户'
export const COMPANY_NAME = 'Example Trading Co.'
export const OPERATOR_NAME = '张敏'
export const OPERATOR_ROLE = '市场运营'

export const mockSitesData: SiteInfo[] = [
  {
    id: 'site-en',
    name: '全英文站',
    url: 'www.example.com',
    language: 'English',
    tradeType: 'export',
    isPrimary: true,
  },
  {
    id: 'site-es',
    name: '西班牙语站',
    url: 'es.example.com',
    language: 'Español',
    tradeType: 'export',
    isPrimary: false,
  },
  {
    id: 'site-ja',
    name: '日语站',
    url: 'jp.example.com',
    language: '日本語',
    tradeType: 'export',
    isPrimary: false,
  },
]

export const DIMENSION_META: Omit<DimensionScore, 'rawScore'>[] = [
  { key: 'tech', name: '技术与性能', weight: 0.2, rawMax: 20, weightPoints: 20 },
  { key: 'seo', name: 'SEO 友好度', weight: 0.16, rawMax: 20, weightPoints: 16 },
  { key: 'geo', name: 'GEO 友好度', weight: 0.14, rawMax: 20, weightPoints: 14 },
  { key: 'content', name: '内容质量', weight: 0.22, rawMax: 20, weightPoints: 22 },
  { key: 'compliance', name: '全球合规', weight: 0.16, rawMax: 20, weightPoints: 16 },
  { key: 'conversion', name: '商业转化', weight: 0.12, rawMax: 20, weightPoints: 12 },
]

/** PRD §6.1 示例：技术8 内容12 SEO7 GEO9 合规14 转化8 */
const RAW_SCORES: Record<string, number> = {
  tech: 8,
  content: 12,
  seo: 7,
  geo: 9,
  compliance: 14,
  conversion: 8,
}

export function buildDimensions(raw: Record<string, number> = RAW_SCORES): DimensionScore[] {
  return DIMENSION_META.map((m) => ({
    ...m,
    rawScore: raw[m.key] ?? 0,
  }))
}

/** 综合分 = Σ(得分率 × 权重分) */
export function calcTotalScore(dimensions: DimensionScore[]): number {
  const sum = dimensions.reduce(
    (acc, d) => acc + (d.rawScore / d.rawMax) * d.weightPoints,
    0,
  )
  return Math.round(sum)
}

export const mockHealthData: HealthSnapshot = {
  totalScore: 58,
  previousScore: 55,
  detectedAt: '2026-07-21 14:30',
  detectType: 'manual',
  dimensions: buildDimensions(),
  trend7: [52, 53, 54, 55, 55, 56, 58],
  trend30: [
    48, 49, 50, 50, 51, 51, 52, 52, 53, 53, 53, 54, 54, 54, 55, 55, 55, 55, 55,
    55, 55, 56, 56, 56, 56, 56, 57, 57, 57, 58,
  ],
}

export const mockIssuesData: IssueItem[] = [
  {
    id: 'iss-ssl',
    priority: 'P0',
    title: 'SSL 证书无效，访客浏览器显示「不安全」警告',
    description: '证书即将过期或已失效，严重影响访客信任和搜索排名。',
    dimensionKey: 'compliance',
    fixMode: 'manual',
  },
  {
    id: 'iss-tdk',
    priority: 'P1',
    title: 'TDK 未填写（覆盖率 23%）',
    description: '影响搜索排名，大量页面缺少 Title / Description。',
    dimensionKey: 'seo',
    fixMode: 'auto',
  },
  {
    id: 'iss-alt',
    priority: 'P1',
    title: '图片 Alt 标签缺失严重',
    description: '图片无替代文本，影响无障碍与图片搜索收录。',
    dimensionKey: 'seo',
    fixMode: 'auto',
  },
  {
    id: 'iss-cookie',
    priority: 'P1',
    title: 'Cookie 弹窗未开启（外贸站）',
    description: '影响全球合规，外贸站需向访客展示 Cookie 同意弹窗。',
    dimensionKey: 'compliance',
    fixMode: 'auto',
  },
  {
    id: 'iss-h1',
    priority: 'P2',
    title: '部分页面 H1 结构不规范',
    description: '多 H1 或缺失，影响页面主题识别。',
    dimensionKey: 'tech',
    fixMode: 'auto',
  },
  {
    id: 'iss-dup',
    priority: 'P2',
    title: '产品页存在重复内容',
    description: '相似文案削弱内容质量得分。',
    dimensionKey: 'content',
    fixMode: 'guide',
  },
  {
    id: 'iss-jsonld',
    priority: 'P2',
    title: '结构化数据（JSON-LD）未配置',
    description: '影响 AI 搜索引用与富摘要展示。',
    dimensionKey: 'geo',
    fixMode: 'auto',
  },
  {
    id: 'iss-cta',
    priority: 'P2',
    title: '首页主 CTA 文案偏弱',
    description: '询盘入口存在，但转化文案可优化。',
    dimensionKey: 'conversion',
    fixMode: 'auto',
  },
  {
    id: 'iss-update',
    priority: 'P2',
    title: '内容更新已超过 60 天',
    description: '长期未更新可能影响内容新鲜度与信任。',
    dimensionKey: 'content',
    fixMode: 'guide',
  },
]

export const mockFunnelWeekData: FunnelData = {
  sources: [
    { name: '搜索', percent: 40 },
    { name: '广告投放', percent: 25 },
    { name: '社交', percent: 15 },
    { name: '直接访问', percent: 12 },
    { name: '外链', percent: 8 },
  ],
  stage2: [
    { label: 'UV（访客数）', value: '1,234', delta: '+12%', positive: true },
    { label: 'PV（浏览量）', value: '3,567', delta: '+8%', positive: true },
    { label: '平均浏览页数', value: '2.9 页', delta: '+0.3', positive: true },
    { label: '跳出率', value: '58%', delta: '-3%', positive: true },
    { label: '停留时长', value: '45s', delta: '+5s', positive: true },
  ],
  stage3: [
    { label: 'CTA 点击率', value: '4.2%', delta: '+0.3%', positive: true },
    { label: '表单填写率', value: '8.1%', delta: '+1.2%', positive: true },
    { label: '客服发起', value: '12 次', delta: '-2', positive: false },
    { label: '社媒跳转', value: '23 次', delta: '+5', positive: true },
  ],
  inquiryRate: 3.2,
  inquiryRateDelta: '+0.4%',
  inquiryDetail: '有效询盘 39 条，搜索来源 15 条，广告来源 18 条',
  bounceRate: 58,
}

export const mockFunnelMonthData: FunnelData = {
  ...mockFunnelWeekData,
  stage2: [
    { label: 'UV（访客数）', value: '4,890', delta: '+9%', positive: true },
    { label: 'PV（浏览量）', value: '13,240', delta: '+6%', positive: true },
    { label: '平均浏览页数', value: '2.7 页', delta: '+0.1', positive: true },
    { label: '跳出率', value: '61%', delta: '-1%', positive: true },
    { label: '停留时长', value: '42s', delta: '+2s', positive: true },
  ],
  inquiryRate: 2.9,
  inquiryRateDelta: '+0.2%',
  inquiryDetail: '有效询盘 142 条，搜索来源 58 条，广告来源 61 条',
  bounceRate: 61,
}

/** PRD §5.2 检测项示例扩展至 12 项 */
export const mockScanStepsData: ScanStep[] = [
  // —— 维度01：技术与性能 ——
  { id: 's1', label: '服务器响应速度检测' },
  { id: 's2', label: 'SSL / HTTPS 状态检测' },
  { id: 's3', label: '死链与 Sitemap 检测' },
  // —— 维度02：SEO 友好度 ——
  { id: 's4', label: 'SEO TDK 抓取' },
  { id: 's5', label: '图片 Alt 标签检测' },
  { id: 's6', label: 'H1 / 标题层级检测' },
  // —— 维度03：GEO 友好度 ——
  { id: 's7', label: '结构化数据与 GEO 检测' },
  // —— 维度04：内容质量（紧邻全球合规前） ——
  { id: 's8', label: '内容重复度分析' },
  // —— 维度05：全球合规 ——
  { id: 's9', label: 'Cookie 弹窗与合规检测' },
  // —— 维度06：商业转化 ——
  { id: 's10', label: 'CTA 与表单入口检测' },
  { id: 's11', label: '联系通道完整性检测' },
  // —— 收尾：综合评分与报告 ——
  { id: 's12', label: '综合评分与问题归集' },
]

export const GUIDE_DISMISS_KEY = 'growth-workbench-guide-dismissed-v1'

/** §10 自动检测策略默认配置 */
export const DEFAULT_AUTO_DETECT_CONFIG: AutoDetectConfig = {
  enabled: true,
  weeklyDay: 1 as const, // 周一
  weeklyHour: 9, // 09:00
  monthlyFirstWeek: true,
  quickThreshold: 14, // 维度得分 <14 触发针对性检测
  declineThreshold: 5, // 连续下降 ≥5 分触发退步预警
}

/** §11 Agent 生态 */
export const AGENT_LIST: AgentInfo[] = [
  {
    id: 'agent-guide',
    name: '引导 Agent',
    layer: 'entry',
    description: '新用户首次进入时引导检测，解释功能价值，消除陌生感。',
    triggerWhen: '首次进入工作台时自动唤醒',
    icon: '👋',
  },
  {
    id: 'agent-scan',
    name: '扫描 Agent',
    layer: 'entry',
    description: '执行 30+ 检测项扫描，5–30 秒内出报告，调用平台 API 获取实时数据。',
    triggerWhen: '用户点击"检测"或自动检测计划触发',
    icon: '🔍',
  },
  {
    id: 'agent-report',
    name: '报告 Agent',
    layer: 'report',
    description: '解读扫描结果，归集问题优先级（P0/P1/P2），生成六维雷达图与文字分析。',
    triggerWhen: '扫描完成后自动唤醒',
    icon: '📊',
  },
  {
    id: 'agent-tech',
    name: '技术修复 Agent',
    layer: 'fix',
    description: '处理技术性能相关问题：死链、H1、图片压缩、缓存策略、服务器响应优化。',
    triggerWhen: '技术维度检测出问题时',
    icon: '⚡',
  },
  {
    id: 'agent-content',
    name: '内容修复 Agent',
    description: '处理内容质量问题：重复内容改写、过期内容提醒、关键词密度优化。',
    layer: 'fix',
    triggerWhen: '内容维度检测出问题时',
    icon: '✍️',
  },
  {
    id: 'agent-seo',
    name: 'SEO 修复 Agent',
    description: '处理 SEO 问题：TDK 生成与写入、Alt 标签批量补全、内链结构优化。',
    layer: 'fix',
    triggerWhen: 'SEO 维度检测出问题时',
    icon: '🎯',
  },
  {
    id: 'agent-geo',
    name: 'GEO 修复 Agent',
    description: '处理 GEO 问题：结构化数据生成、FAQ Schema、面包屑、AI 搜索可见性优化。',
    layer: 'fix',
    triggerWhen: 'GEO 维度检测出问题时',
    icon: '🤖',
  },
  {
    id: 'agent-compliance',
    name: '合规修复 Agent',
    description: '处理合规问题：Cookie 弹窗配置、SSL 证书续费提醒、隐私政策模板。',
    layer: 'fix',
    triggerWhen: '全球合规维度检测出问题时',
    icon: '🛡️',
  },
  {
    id: 'agent-conversion',
    name: '转化修复 Agent',
    layer: 'fix',
    description: '处理转化问题：CTA 文案优化、表单字段简化、询盘入口可见性提升。',
    triggerWhen: '商业转化维度检测出问题时',
    icon: '💰',
  },
  {
    id: 'agent-operation',
    name: '运营 Agent',
    layer: 'operation',
    description: '每周一针对性快速检测 + 每月第一周全量检测；生成周报并邮件推送；监测分数趋势，触发退步预警。',
    triggerWhen: '每周一 09:00 + 每月第一周一 09:00',
    icon: '📅',
  },
  {
    id: 'agent-scheduler',
    name: '调度 Agent',
    layer: 'operation',
    description: '协调各 Agent 执行顺序，管理任务队列，确保不重复、不冲突，记录执行日志。',
    triggerWhen: '持续后台运行',
    icon: '⚙️',
  },
]

/** §9 / §13 检测历史 */
export const mockDetectHistoryData: DetectHistoryRow[] = [
  {
    id: 'dh-001',
    detectedAt: '2026-07-21 14:30',
    detectType: 'manual',
    totalScore: 58,
    previousScore: 55,
    p0: 1,
    p1: 3,
    p2: 5,
    siteId: 'site-en',
    operator: '张敏',
  },
  {
    id: 'dh-002',
    detectedAt: '2026-07-14 09:02',
    detectType: 'quick',
    totalScore: 55,
    previousScore: 52,
    p0: 1,
    p1: 4,
    p2: 6,
    siteId: 'site-en',
    operator: '系统·运营 Agent',
  },
  {
    id: 'dh-003',
    detectedAt: '2026-07-07 09:00',
    detectType: 'full',
    totalScore: 52,
    previousScore: 48,
    p0: 2,
    p1: 5,
    p2: 7,
    siteId: 'site-en',
    operator: '系统·运营 Agent',
  },
  {
    id: 'dh-004',
    detectedAt: '2026-06-30 09:01',
    detectType: 'quick',
    totalScore: 48,
    previousScore: 50,
    p0: 2,
    p1: 5,
    p2: 8,
    siteId: 'site-en',
    operator: '系统·运营 Agent',
  },
  {
    id: 'dh-005',
    detectedAt: '2026-07-21 10:12',
    detectType: 'manual',
    totalScore: 61,
    previousScore: 58,
    p0: 0,
    p1: 2,
    p2: 4,
    siteId: 'site-es',
    operator: '张敏',
  },
]

/** 修复任务队列（待办 + 历史） */
export const mockFixTasksData: FixTaskRow[] = [
  {
    id: 'ft-001',
    title: 'SSL 证书无效，访客浏览器显示「不安全」警告',
    dimensionKey: 'compliance',
    priority: 'P0',
    status: 'pending',
    fixMode: 'manual',
    createdAt: '2026-07-21 14:32',
    updatedAt: '2026-07-21 14:32',
    scoreBefore: 14,
    scoreAfter: null,
    issueId: 'iss-ssl',
  },
  {
    id: 'ft-002',
    title: 'TDK 未填写（覆盖率 23%）',
    dimensionKey: 'seo',
    priority: 'P1',
    status: 'pending',
    fixMode: 'auto',
    createdAt: '2026-07-21 14:32',
    updatedAt: '2026-07-21 14:32',
    scoreBefore: 7,
    scoreAfter: null,
    issueId: 'iss-tdk',
  },
  {
    id: 'ft-003',
    title: '图片 Alt 标签缺失严重',
    dimensionKey: 'seo',
    priority: 'P1',
    status: 'pending',
    fixMode: 'auto',
    createdAt: '2026-07-21 14:32',
    updatedAt: '2026-07-21 14:32',
    scoreBefore: 7,
    scoreAfter: null,
    issueId: 'iss-alt',
  },
  {
    id: 'ft-004',
    title: 'Cookie 弹窗未开启（外贸站）',
    dimensionKey: 'compliance',
    priority: 'P1',
    status: 'pending',
    fixMode: 'auto',
    createdAt: '2026-07-21 14:32',
    updatedAt: '2026-07-21 14:32',
    scoreBefore: 14,
    scoreAfter: null,
    issueId: 'iss-cookie',
  },
  {
    id: 'ft-005',
    title: '首页主 CTA 文案优化',
    dimensionKey: 'conversion',
    priority: 'P2',
    status: 'done',
    fixMode: 'auto',
    createdAt: '2026-07-14 10:20',
    updatedAt: '2026-07-14 10:28',
    scoreBefore: 6,
    scoreAfter: 8,
  },
  {
    id: 'ft-006',
    title: '结构化数据 JSON-LD 生成写入',
    dimensionKey: 'geo',
    priority: 'P2',
    status: 'done',
    fixMode: 'auto',
    createdAt: '2026-07-07 11:05',
    updatedAt: '2026-07-07 11:12',
    scoreBefore: 7,
    scoreAfter: 9,
  },
]

/** §8 周报投递记录 */
export const mockWeeklyReportsData: WeeklyReportRow[] = [
  {
    id: 'wr-001',
    weekLabel: '7月14日 — 7月21日',
    sentAt: '2026-07-21 09:00',
    score: 58,
    previousScore: 55,
    opened: true,
    siteId: 'site-en',
  },
  {
    id: 'wr-002',
    weekLabel: '7月7日 — 7月14日',
    sentAt: '2026-07-14 09:00',
    score: 55,
    previousScore: 52,
    opened: true,
    siteId: 'site-en',
  },
  {
    id: 'wr-003',
    weekLabel: '6月30日 — 7月7日',
    sentAt: '2026-07-07 09:00',
    score: 52,
    previousScore: 48,
    opened: false,
    siteId: 'site-en',
  },
]

/** §13 线索管理 */
export const LEAD_SOURCE_LABELS: Record<string, string> = {
  google_organic: 'Google 自然搜索',
  baidu_organic: '百度搜索',
  google_ads: 'Google 广告',
  baidu_ads: '百度广告',
  social_media: '社媒跳转',
  ai_chat: 'AI 客服对话',
  email: '邮件营销',
  direct: '直接访问',
  referral: '行业目录',
  unknown: '未知来源',
}

export const INTENT_LABELS = {
  high: '🔥 高意向',
  medium: '💧 中意向',
  low: '💨 低意向',
  invalid: '❌ 无效',
}

export const LEAD_STATUS_LABELS = {
  pending: '待跟进',
  contacted: '已联系',
  qualified: '已筛选',
  converted: '已转化',
  invalid: '无效',
}

export const mockLeadsData: Lead[] = [
  {
    id: 'lead-001',
    source: 'google_ads',
    sourceLabel: LEAD_SOURCE_LABELS['google_ads'],
    createdAt: '2026-07-27 14:28',
    company: '德力西工业设备有限公司',
    contact: '张经理',
    email: 'zhangyj@delixi.com',
    phone: '139-0001-0001',
    jobTitle: '采购总监',
    region: '上海市-浦东新区',
    address: '张江高科技园区碧波路690号3号楼',
    intentLevel: 'high',
    intentScore: 92,
    intentReason: '浏览 3 个产品详情页 + 完整留资（公司/电话/邮箱）+ AI客服问过报价',
    landingPage: '/products/cnc-milling-machine',
    behaviors: [
      { pageVisited: '/products', stayDuration: 45, visitedAt: '2026-07-27 14:10' },
      { pageVisited: '/products/cnc-milling-machine', stayDuration: 120, visitedAt: '2026-07-27 14:12' },
      { pageVisited: '/products/industrial-robot', stayDuration: 90, visitedAt: '2026-07-27 14:15' },
      { pageVisited: '/pricing', stayDuration: 60, visitedAt: '2026-07-27 14:18' },
      { pageVisited: '/contact', stayDuration: 30, visitedAt: '2026-07-27 14:20' },
    ],
    tags: [
      { key: 'budget_high', label: '高预算', category: 'budget' },
      { key: 'multi_product', label: '多产品关注', category: 'stage' },
      { key: 'ask_price', label: '主动询价', category: 'action' },
    ],
    status: 'contacted',
    statusLabel: LEAD_STATUS_LABELS['contacted'],
    followUpBy: '张敏',
    followUpAt: '2026-07-27 16:00',
    followUpRecords: [
      {
        id: 'fu-001-1',
        type: 'phone',
        content: '电话联系，张经理表示对公司工业机器人产品非常感兴趣，正在做 Q3 采购预算，计划采购 5-8 台用于新产线升级。',
        createdAt: '2026-07-27 16:00',
        nextContact: '2026-08-01 10:00',
      },
    ],
  },
  {
    id: 'lead-002',
    source: 'ai_chat',
    sourceLabel: LEAD_SOURCE_LABELS['ai_chat'],
    createdAt: '2026-07-27 13:45',
    company: '三一重工数字化部',
    contact: '李工',
    email: 'li.gang@sany.com',
    phone: '186-0002-0002',
    jobTitle: '技术总监',
    intentLevel: 'high',
    intentScore: 88,
    intentReason: 'AI客服对话 8 轮 + 留资含公司/电话 + 多次返回产品页',
    landingPage: '/products/industrial-robot',
    behaviors: [
      { pageVisited: '/', stayDuration: 20, visitedAt: '2026-07-27 13:10' },
      { pageVisited: '/ai-chat', stayDuration: 180, visitedAt: '2026-07-27 13:12' },
      { pageVisited: '/products/industrial-robot', stayDuration: 60, visitedAt: '2026-07-27 13:20' },
      { pageVisited: '/ai-chat', stayDuration: 90, visitedAt: '2026-07-27 13:25' },
    ],
    tags: [
      { key: 'decision_fast', label: '决策快', category: 'decision' },
      { key: 'tech_oriented', label: '技术导向', category: 'stage' },
      { key: 'ai_chat_8rounds', label: 'AI多轮对话', category: 'action' },
    ],
    status: 'pending',
    statusLabel: LEAD_STATUS_LABELS['pending'],
  },
  {
    id: 'lead-003',
    source: 'google_organic',
    sourceLabel: LEAD_SOURCE_LABELS['google_organic'],
    createdAt: '2026-07-27 11:20',
    company: '海尔智家北京分公司',
    contact: '王总',
    email: 'wangz@haierbj.com',
    phone: '139-0003-0003',
    jobTitle: '采购经理',
    intentLevel: 'high',
    intentScore: 85,
    intentReason: '浏览 2 个产品页 + AI客服聊过定制方案 + 表单留资',
    landingPage: '/products/laser-cutting-machine',
    behaviors: [
      { pageVisited: '/products/laser-cutting-machine', stayDuration: 90, visitedAt: '2026-07-27 10:50' },
      { pageVisited: '/products', stayDuration: 30, visitedAt: '2026-07-27 11:00' },
      { pageVisited: '/ai-chat', stayDuration: 60, visitedAt: '2026-07-27 11:05' },
      { pageVisited: '/contact', stayDuration: 20, visitedAt: '2026-07-27 11:15' },
    ],
    tags: [
      { key: 'big_client', label: '大客户', category: 'type' },
      { key: 'custom_need', label: '需定制方案', category: 'stage' },
    ],
    status: 'contacted',
    statusLabel: LEAD_STATUS_LABELS['contacted'],
  },
  {
    id: 'lead-004',
    source: 'baidu_organic',
    sourceLabel: LEAD_SOURCE_LABELS['baidu_organic'],
    createdAt: '2026-07-26 16:30',
    company: '比亚迪新能源事业部',
    contact: '赵主任',
    email: 'zhao.liu@byd.com',
    intentLevel: 'medium',
    intentScore: 62,
    intentReason: '单产品页浏览 + 表单留资（无电话/无AI对话）',
    landingPage: '/products/laser-cutting-machine',
    behaviors: [
      { pageVisited: '/', stayDuration: 15, visitedAt: '2026-07-26 16:10' },
      { pageVisited: '/products/laser-cutting-machine', stayDuration: 60, visitedAt: '2026-07-26 16:12' },
    ],
    tags: [
      { key: 'single_product', label: '单品浏览', category: 'stage' },
      { key: 'budget_medium', label: '中等预算', category: 'budget' },
    ],
    status: 'pending',
    statusLabel: LEAD_STATUS_LABELS['pending'],
  },
  {
    id: 'lead-005',
    source: 'referral',
    sourceLabel: LEAD_SOURCE_LABELS['referral'],
    createdAt: '2026-07-26 10:15',
    company: '富士康深圳工厂',
    contact: '孙经理',
    email: 'sun.j@foxconn.com',
    phone: '136-0005-0005',
    jobTitle: '设备主管',
    intentLevel: 'medium',
    intentScore: 58,
    intentReason: '行业目录跳转 + 浏览2个页面但未深度停留',
    landingPage: '/case/automotive-manufacturing',
    behaviors: [
      { pageVisited: '/case/automotive-manufacturing', stayDuration: 40, visitedAt: '2026-07-26 10:00' },
      { pageVisited: '/products', stayDuration: 25, visitedAt: '2026-07-26 10:05' },
    ],
    tags: [
      { key: 'referral_source', label: '行业推荐', category: 'type' },
      { key: 'low_engagement', label: '浅层浏览', category: 'stage' },
    ],
    status: 'pending',
    statusLabel: LEAD_STATUS_LABELS['pending'],
  },
  {
    id: 'lead-006',
    source: 'social_media',
    sourceLabel: LEAD_SOURCE_LABELS['social_media'],
    createdAt: '2026-07-25 15:20',
    company: '美的中央空调',
    contact: '周工',
    email: 'zhou.gong@midea.com',
    intentLevel: 'low',
    intentScore: 35,
    intentReason: '社媒跳转 + 仅浏览首页 + 表单仅填姓名+邮箱',
    landingPage: '/',
    behaviors: [
      { pageVisited: '/', stayDuration: 20, visitedAt: '2026-07-25 15:10' },
      { pageVisited: '/about', stayDuration: 15, visitedAt: '2026-07-25 15:12' },
    ],
    tags: [
      { key: 'social_source', label: '社媒来源', category: 'type' },
      { key: 'incomplete_info', label: '信息不完整', category: 'stage' },
    ],
    status: 'pending',
    statusLabel: LEAD_STATUS_LABELS['pending'],
  },
  {
    id: 'lead-007',
    source: 'google_organic',
    sourceLabel: LEAD_SOURCE_LABELS['google_organic'],
    createdAt: '2026-07-25 09:30',
    company: '格力电器南京基地',
    contact: '吴总',
    email: 'wu.z@ Gree-nj.com',
    intentLevel: 'low',
    intentScore: 22,
    intentReason: '仅留邮箱 + 无电话 + 浏览页数1页',
    landingPage: '/blog/industrial-robot-selection',
    behaviors: [
      { pageVisited: '/blog/industrial-robot-selection', stayDuration: 30, visitedAt: '2026-07-25 09:20' },
    ],
    tags: [
      { key: 'email_only', label: '仅留邮箱', category: 'stage' },
      { key: 'single_page', label: '单页浏览', category: 'stage' },
    ],
    status: 'pending',
    statusLabel: LEAD_STATUS_LABELS['pending'],
  },
]

export const mockLeadsStatsData: LeadStats = {
  total: mockLeadsData.length,
  todayNew: mockLeadsData.filter((l) => l.createdAt.startsWith('2026-07-27')).length,
  highIntent: mockLeadsData.filter((l) => l.intentLevel === 'high').length,
  pendingFollowUp: mockLeadsData.filter((l) => l.status === 'pending').length,
}

/** 意向度判定函数（供正式接入时使用） */
export function calcIntentLevel(lead: {
  behaviors: { pageVisited: string }[]
  email?: string
  phone?: string
  aiChatRounds?: number
  askedPrice?: boolean
}): { level: Lead['intentLevel']; score: number; reason: string } {
  const pages = lead.behaviors
  const hasCompany = !!lead.email
  const hasPhone = !!lead.phone
  const productPages = pages.filter((p) => p.pageVisited.includes('/products/')).length
  const aiRounds = lead.aiChatRounds ?? 0

  // 高意向条件
  if ((productPages >= 2 || aiRounds >= 5) && hasCompany && hasPhone && (aiRounds >= 3 || lead.askedPrice)) {
    return {
      level: 'high',
      score: 80 + Math.min(productPages * 5 + aiRounds * 3, 20),
      reason: `浏览 ${productPages} 个产品页 + 完整留资${aiRounds >= 3 ? ' + AI客服多轮对话' : ''}${lead.askedPrice ? ' + 主动询价' : ''}`,
    }
  }
  if (productPages >= 2 && hasCompany && hasPhone) {
    return {
      level: 'high',
      score: 75 + productPages * 5,
      reason: `浏览 ${productPages} 个产品页 + 完整留资`,
    }
  }

  // 中意向条件
  if (productPages >= 1 && hasCompany) {
    return {
      level: 'medium',
      score: 50 + productPages * 5 + (hasPhone ? 10 : 0),
      reason: hasPhone
        ? `浏览产品详情页 + 含电话留资`
        : `浏览产品详情页 + 仅留邮箱`,
    }
  }

  // 低意向条件
  if (hasCompany) {
    return { level: 'low', score: 25, reason: '表单留资但未深度浏览' }
  }

  return { level: 'invalid', score: 5, reason: '信息不完整或恶意填写' }
}
