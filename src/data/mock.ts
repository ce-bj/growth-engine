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

/** §22 规则手册：22 个检测项对应的问题清单 */
export const mockIssuesData: IssueItem[] = [
  // —— 技术与性能 ——
  {
    id: 'iss-ssl-tech',
    priority: 'P0',
    title: 'SSL / HTTPS 证书无效',
    description: '证书缺失或失效，浏览器显示不安全警告，严重影响信任和搜索排名。',
    dimensionKey: 'tech',
    fixMode: 'manual',
  },
  {
    id: 'iss-deadlink',
    priority: 'P1',
    title: '死链与站内 4xx 失效页面',
    description: '站内链接返回 404/403 等 4xx 状态码，影响爬虫抓取和用户体验。',
    dimensionKey: 'tech',
    fixMode: 'auto',
  },
  {
    id: 'iss-sitemap',
    priority: 'P2',
    title: 'Sitemap 缺失或不完整',
    description: 'sitemap.xml 不存在或不可访问，搜索引擎无法全面抓取网站内容。',
    dimensionKey: 'tech',
    fixMode: 'auto',
  },
  // —— SEO 友好度 ——
  {
    id: 'iss-title',
    priority: 'P1',
    title: '页面标题 Title 缺失或重复',
    description: '大量页面缺少 <title> 标签，或多个页面使用相同标题，影响搜索排名。',
    dimensionKey: 'seo',
    fixMode: 'auto',
  },
  {
    id: 'iss-meta-desc',
    priority: 'P1',
    title: '页面描述 Description 缺失',
    description: '页面缺少 <meta name="description">，搜索结果无摘要信息，点击率低。',
    dimensionKey: 'seo',
    fixMode: 'auto',
  },
  {
    id: 'iss-alt',
    priority: 'P1',
    title: '图片 Alt 替代文本缺失',
    description: '图片无 alt 属性，影响图片搜索收录和无障碍访问。',
    dimensionKey: 'seo',
    fixMode: 'auto',
  },
  {
    id: 'iss-h1',
    priority: 'P2',
    title: 'H1 标题层级不规范',
    description: '页面存在多 H1 或 H1 缺失，影响搜索引擎理解页面主题。',
    dimensionKey: 'seo',
    fixMode: 'auto',
  },
  {
    id: 'iss-robots-page',
    priority: 'P2',
    title: '重要页面被 robots.txt 拦截',
    description: '首页、产品页、联系页等重要页面被 robots Disallow 屏蔽。',
    dimensionKey: 'seo',
    fixMode: 'auto',
  },
  {
    id: 'iss-robots-link',
    priority: 'P2',
    title: '站内链接指向被 robots 拦截的页面',
    description: '站内锚点指向的页面被 robots Disallow，形成无效内链。',
    dimensionKey: 'seo',
    fixMode: 'auto',
  },
  // —— GEO 友好度 ——
  {
    id: 'iss-jsonld',
    priority: 'P2',
    title: '结构化数据 JSON-LD 未配置',
    description: '页面未部署 Organization/Product/Article 等 Schema，影响 AI 搜索引用。',
    dimensionKey: 'geo',
    fixMode: 'auto',
  },
  {
    id: 'iss-faq-breadcrumb',
    priority: 'P2',
    title: 'FAQ / Breadcrumb Schema 缺失',
    description: '缺少 FAQ、面包屑等利于 AI 摘要抓取的结构化数据。',
    dimensionKey: 'geo',
    fixMode: 'auto',
  },
  {
    id: 'iss-llms',
    priority: 'P2',
    title: 'llms.txt 文件缺失',
    description: '网站未提供 llms.txt，AI 爬虫无法获取网站内容摘要。',
    dimensionKey: 'geo',
    fixMode: 'manual',
  },
  {
    id: 'iss-og',
    priority: 'P2',
    title: '社交媒体 og 属性缺失',
    description: '页面未配置 og:title/og:description/og:image，分享到社交媒体时无预览图。',
    dimensionKey: 'geo',
    fixMode: 'auto',
  },
  // —— 内容质量 ——
  {
    id: 'iss-dup',
    priority: 'P1',
    title: '页面内容重复度高',
    description: '检测到相似度超过 80% 的重复内容页面，削弱搜索引擎排名。',
    dimensionKey: 'content',
    fixMode: 'guide',
  },
  {
    id: 'iss-thin',
    priority: 'P2',
    title: '内容过短页面',
    description: '检测到正文文字数量 ≤300 字的页面，内容单薄不利于排名。',
    dimensionKey: 'content',
    fixMode: 'guide',
  },
  {
    id: 'iss-placeholder',
    priority: 'P2',
    title: '占位填充假文本',
    description: '页面含 lorem ipsum、中文「测试文案」等占位乱码内容。',
    dimensionKey: 'content',
    fixMode: 'guide',
  },
  {
    id: 'iss-update',
    priority: 'P2',
    title: '内容更新超过 60 天',
    description: '核心页面长期未更新，影响内容新鲜度评分和用户信任。',
    dimensionKey: 'content',
    fixMode: 'guide',
  },
  // —— 全球合规 ——
  {
    id: 'iss-cookie',
    priority: 'P1',
    title: 'Cookie 同意弹窗未开启（外贸站）',
    description: '外贸站未向访客展示 Cookie 同意弹窗，违反 GDPR/CCPA 合规要求。',
    dimensionKey: 'compliance',
    fixMode: 'auto',
  },
  {
    id: 'iss-ssl-comp',
    priority: 'P0',
    title: 'SSL 证书未安装（外贸站）',
    description: '外贸站未安装 SSL 证书，数据传输未加密，浏览器显示不安全。',
    dimensionKey: 'compliance',
    fixMode: 'manual',
  },
  {
    id: 'iss-privacy',
    priority: 'P1',
    title: '隐私政策页缺失或不完整',
    description: '无隐私政策页，或页面未覆盖 Cookie 说明与数据收集声明。',
    dimensionKey: 'compliance',
    fixMode: 'guide',
  },
  // —— 商业转化 ——
  {
    id: 'iss-cta',
    priority: 'P2',
    title: 'CTA 与表单入口缺失',
    description: '首页/落地页主 CTA 按钮缺失，访客无明显转化入口。',
    dimensionKey: 'conversion',
    fixMode: 'auto',
  },
  {
    id: 'iss-contact',
    priority: 'P2',
    title: '联系通道不完整',
    description: '电话、邮箱、表单、地址、社媒等联系方式不全或不可达。',
    dimensionKey: 'conversion',
    fixMode: 'guide',
  },
  {
    id: 'iss-btn-text',
    priority: 'P2',
    title: '按钮可辨识文字缺失',
    description: '存在空按钮、纯图标按钮或图片按钮，访客不知道点击后会发生什么。',
    dimensionKey: 'conversion',
    fixMode: 'auto',
  },
  {
    id: 'iss-anchor',
    priority: 'P2',
    title: '链接锚文本为空或无意义',
    description: '存在空链接、纯图标链接或图片链接无 alt，访客和爬虫无法理解链接目的。',
    dimensionKey: 'conversion',
    fixMode: 'auto',
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

/** §22 规则手册：22 检测项，对齐检测明细.xlsx */
export const mockScanStepsData: ScanStep[] = [
  // —— 维度01：技术与性能（3项，20分） ——
  { id: 's01', label: 'SSL / HTTPS 证书状态' },
  { id: 's02', label: '死链与站内 4xx 失效页面' },
  { id: 's03', label: 'Sitemap 完整性' },
  // —— 维度02：SEO 友好度（6项，16分） ——
  { id: 's04', label: '页面标题 Title' },
  { id: 's05', label: '页面描述 Description' },
  { id: 's06', label: '图片 Alt 替代文本' },
  { id: 's07', label: 'H1 标题层级' },
  { id: 's08', label: '页面被 robots.txt 拦截' },
  { id: 's09', label: '站内链接 / 资源被 robots 拦截' },
  // —— 维度03：GEO 友好度（4项，14分） ——
  { id: 's10', label: '结构化数据 JSON-LD / Schema' },
  { id: 's11', label: 'FAQ / Breadcrumb Schema' },
  { id: 's12', label: '是否存在 llms.txt' },
  { id: 's13', label: '是否存在社交 og 属性' },
  // —— 维度04：内容质量（4项，22分） ——
  { id: 's14', label: '内容重复度' },
  { id: 's15', label: '内容过短页面' },
  { id: 's16', label: '占位填充假文本' },
  { id: 's17', label: '内容更新频率' },
  // —— 维度05：全球合规（3项，16分） ——
  { id: 's18', label: 'Cookie 同意弹窗' },
  { id: 's19', label: 'SSL 证书合规' },
  { id: 's20', label: '隐私政策页完整性' },
  // —— 维度06：商业转化（4项，12分） ——
  { id: 's21', label: 'CTA 与表单入口' },
  { id: 's22', label: '联系通道完整性' },
  { id: 's23', label: '按钮可辨识文字' },
  { id: 's24', label: '链接非空锚文本' },
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
    id: 'agent-attribution',
    name: '业务指标归因 Agent',
    layer: 'report',
    description: '定时分析业务指标变化（异常/提升/持平），下钻归因到根因并给出置信度，异常类产出解决方案与措施，可调度其他 Agent 执行并复盘。',
    triggerWhen: '按站点设置的归因周期定时触发（≥7天）',
    icon: '🧭',
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
    source: 'baidu_ads',
    sourceLang: '中文',
    sourceForm: '百度营销表单',
    createdAt: '2026-07-27 14:28',
    company: '德力西工业设备有限公司',
    contact: '张经理',
    industry: '工业设备制造',
    companyScale: '1000人以上',
    email: 'zhangyj@delixi.com',
    phone: '139-0001-0001',
    jobTitle: '采购总监',
    region: '上海市-浦东新区',
    country: '中国',
    address: '张江高科技园区碧波路690号3号楼',
    formSubmission: '公司名称：德力西工业设备有限公司\n联系人：张经理\n职务：采购总监\n邮箱：zhangyj@delixi.com\n电话：139-0001-0001\n需求描述：计划采购工业机器人5-8台，用于新产线升级，Q3预算充足，希望了解交钥匙方案和报价。',
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
    owner: '张敏',
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
    source: 'feiyu_crm',
    sourceLang: '中文',
    sourceForm: '智能客服',
    createdAt: '2026-07-27 13:45',
    company: '三一重工数字化部',
    contact: '李工',
    industry: '工程机械',
    companyScale: '1000人以上',
    owner: '李娜',
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
    country: '中国',
    aiChat: '8 轮对话，围绕工业机器人选型、技术参数对比、交货周期等',
    aiChatMessages: [
      { role: 'user', text: '你们工业机器人的重复定位精度能到多少？', time: '2026-07-27 13:14' },
      { role: 'assistant', text: '我们的IRB-2000系列重复定位精度可达±0.05mm，满足精密装配需求，请问您主要应用场景是什么？', time: '2026-07-27 13:14' },
      { role: 'user', text: '用于汽车零部件焊接，节拍要求每分钟60次以上', time: '2026-07-27 13:16' },
      { role: 'assistant', text: '焊接场景推荐IRB-2600，标准节拍80次/分钟，臂展1.65m，配合焊接电源整套报价约28-35万/台，质保2年。是否需要安排技术顾问联系您？', time: '2026-07-27 13:18' },
      { role: 'user', text: '好的请安排，另外交期多久？', time: '2026-07-27 13:20' },
      { role: 'assistant', text: '已记录，交期标准订单6-8周含安装调试。技术顾问稍后会联系您，请确认联系方式是否正确。', time: '2026-07-27 13:21' },
    ],
    status: 'pending',
    statusLabel: LEAD_STATUS_LABELS['pending'],
  },
  {
    id: 'lead-003',
    source: 'korean_site',
    sourceLang: '韩语',
    sourceForm: 'ko001表单',
    createdAt: '2026-07-27 11:20',
    company: '海尔智家北京分公司',
    contact: '王总',
    industry: '家电制造',
    companyScale: '1000人以上',
    owner: '王强',
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
    country: '中国',
    aiChat: '4 轮对话，激光切割机非标定制需求',
    aiChatMessages: [
      { role: 'user', text: '你们能做非标尺寸的激光切割机吗？', time: '2026-07-27 11:06' },
      { role: 'assistant', text: '可以的，我们可以根据您的工件尺寸定制切割幅面和工作台承重，请提供具体的最大加工尺寸需求。', time: '2026-07-27 11:07' },
      { role: 'user', text: '最大切割幅面3米×6米，切割厚度5mm碳钢', time: '2026-07-27 11:09' },
      { role: 'assistant', text: '这个尺寸推荐LCM-3060P系列，配合4kW激光器，切割5mm碳钢速度约2m/min。我们有成熟案例，已将详细参数和报价发送至您邮箱。', time: '2026-07-27 11:11' },
    ],
    formSubmission: '公司名称：海尔智家北京分公司\n联系人：王总\n职务：采购经理\n邮箱：wangz@haierbj.com\n电话：139-0003-0003\n需求描述：需要3米×6米大幅面激光切割机，用于家电钣金件加工，优先考虑华北地区有售后网点的供应商。',
    status: 'contacted',
    statusLabel: LEAD_STATUS_LABELS['contacted'],
  },
  {
    id: 'lead-004',
    source: 'tencent_ads',
    sourceLang: '中文',
    sourceForm: '腾讯广告表单',
    createdAt: '2026-07-26 16:30',
    company: '比亚迪新能源事业部',
    contact: '赵主任',
    industry: '新能源/汽车',
    companyScale: '1000人以上',
    owner: '张敏',
    email: 'zhao.liu@byd.com',
    country: '中国',
    formSubmission: '公司名称：比亚迪新能源事业部\n联系人：赵主任\n需求描述：采购激光切割机用于新能源电池壳体加工，关注设备精度和稳定性，预算有限。',
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
    source: 'baidu_ads',
    sourceLang: '中文',
    sourceForm: '百度营销表单',
    createdAt: '2026-07-26 10:15',
    company: '富士康深圳工厂',
    contact: '孙经理',
    industry: '电子制造',
    companyScale: '1000人以上',
    owner: '李娜',
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
    country: '中国',
    formSubmission: '联系人：周工\n邮箱：zhou.gong@midea.com\n（仅填写姓名和邮箱，未填写公司/电话）',
    status: 'pending',
    statusLabel: LEAD_STATUS_LABELS['pending'],
  },
  {
    id: 'lead-006',
    source: 'trade_insight',
    sourceLang: '中文',
    sourceForm: '外贸客户洞察',
    createdAt: '2026-07-25 15:20',
    company: '美的中央空调',
    contact: '周工',
    industry: '家电制造',
    companyScale: '1000人以上',
    owner: '王强',
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
    country: '中国',
    nurtureRecords: [
      { id: 'nur-006-1', sequenceName: '工业品滴灌序列-第1封', sentAt: '2026-07-26 10:00', channel: 'email', status: 'opened', subject: '《2026工业机器人选型白皮书》免费领取' },
      { id: 'nur-006-2', sequenceName: '工业品滴灌序列-第2封', sentAt: '2026-07-27 10:00', channel: 'email', status: 'sent', subject: '3个真实客户案例：如何用自动化降本30%' },
    ],
    status: 'pending',
    statusLabel: LEAD_STATUS_LABELS['pending'],
  },
  {
    id: 'lead-007',
    source: 'global_company_db',
    sourceLang: '中文',
    sourceForm: '全球企业库',
    createdAt: '2026-07-25 09:30',
    company: '格力电器南京基地',
    contact: '吴总',
    industry: '家电制造',
    companyScale: '1000人以上',
    owner: '李娜',
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
    country: '中国',
    nurtureRecords: [
      { id: 'nur-007-1', sequenceName: '内容培育序列-第1封', sentAt: '2026-07-26 09:00', channel: 'email', status: 'bounced', subject: '工业机器人选型指南（含ROI测算表）' },
    ],
    status: 'pending',
    statusLabel: LEAD_STATUS_LABELS['pending'],
  },
  {
    id: 'lead-008',
    source: 'global_company_db',
    sourceLang: '德语',
    sourceForm: '全球企业库',
    createdAt: '2026-07-28 09:00',
    company: 'SIEMENS AG Procurement',
    contact: 'Klaus Weber',
    industry: '工业自动化',
    companyScale: '1000人以上',
    owner: '王强',
    email: 'k.weber@siemens-ag.de',
    phone: '+49-89-1234-5678',
    jobTitle: 'Procurement Manager',
    region: 'München, Bayern',
    country: '德国',
    intentLevel: 'high',
    intentScore: 90,
    intentReason: '海关数据显示近12个月从中国进口工业自动化设备3次，合计金额€2.4M，欧洲大型制造业采购决策链长，需重点跟进。',
    landingPage: '/products/industrial-automation',
    behaviors: [
      { pageVisited: '/products/industrial-automation', stayDuration: 120, visitedAt: '2026-07-28 08:30' },
      { pageVisited: '/products/siemens-alternative', stayDuration: 80, visitedAt: '2026-07-28 08:35' },
    ],
    tags: [
      { key: 'eu_large', label: '欧洲大客户', category: 'type' },
      { key: 'customs_active', label: '海关活跃进口', category: 'action' },
      { key: 'tech_oriented', label: '技术导向', category: 'stage' },
    ],
    status: 'pending',
    statusLabel: '待跟进',
    customsData: {
      hsCode: '84795000',
      importExport: 'import',
      importValue: '€2.4M/年',
      originCountry: '中国',
      destCountry: '德国',
      lastImportDate: '2026-06-15',
      importFrequency: 3,
      productDesc: '工业机器人及自动化设备零部件',
    },
    followUpRecords: [],
  },
  {
    id: 'lead-009',
    source: 'global_company_db',
    sourceLang: '英语',
    sourceForm: '全球企业库',
    createdAt: '2026-07-29 10:12',
    company: 'Bosch Rexroth US Inc.',
    contact: 'Michael Chen',
    industry: '液压与传动技术',
    companyScale: '1000人以上',
    owner: '王强',
    email: 'm.chen@boschrexroth-us.com',
    phone: '+1-248-555-0192',
    jobTitle: 'Supply Chain Director',
    region: 'Auburn Hills, Michigan',
    country: '美国',
    intentLevel: 'high',
    intentScore: 88,
    intentReason: '海关数据显示近12个月从中国进口液压元件及传动系统5次，合计金额$3.1M，正在寻找第二供应商以分散供应链风险，意向度高。',
    landingPage: '/products/hydraulic-systems',
    behaviors: [
      { pageVisited: '/products/hydraulic-systems', stayDuration: 140, visitedAt: '2026-07-29 09:50' },
      { pageVisited: '/products/servo-valves', stayDuration: 95, visitedAt: '2026-07-29 09:55' },
      { pageVisited: '/pricing', stayDuration: 50, visitedAt: '2026-07-29 10:00' },
    ],
    tags: [
      { key: 'us_large', label: '美国大客户', category: 'type' },
      { key: 'customs_active', label: '海关活跃进口', category: 'action' },
      { key: 'supplier_switch', label: '寻找二供', category: 'stage' },
    ],
    status: 'contacted',
    statusLabel: LEAD_STATUS_LABELS['contacted'],
    customsData: {
      hsCode: '84122100',
      importExport: 'import',
      importValue: '$3.1M/年',
      originCountry: '中国',
      destCountry: '美国',
      lastImportDate: '2026-07-08',
      importFrequency: 5,
      productDesc: '液压油缸、伺服阀及传动控制系统',
    },
    followUpRecords: [
      {
        id: 'fu-009-1',
        type: 'email',
        content: '已发送液压系统选型手册与美规认证说明，客户回复希望安排技术对接会。',
        createdAt: '2026-07-29 14:00',
        nextContact: '2026-07-31 21:00',
      },
    ],
  },
  {
    id: 'lead-010',
    source: 'feiyu_crm',
    sourceLang: '中文',
    sourceForm: '智能客服',
    createdAt: '2026-07-29 16:40',
    company: '宁波拓普汽车零部件有限公司',
    contact: '陈工',
    industry: '汽车零部件',
    companyScale: '500-1000人',
    owner: '张敏',
    email: 'chen.g@top-group.cn',
    phone: '138-0002-3333',
    jobTitle: '设备工程师',
    region: '浙江-宁波',
    country: '中国',
    intentLevel: 'medium',
    intentScore: 64,
    intentReason: '提交需求表单 + 智能客服咨询交期，浏览2个产品页，Q4前有明确上线计划。',
    landingPage: '/products/cnc-milling-machine',
    behaviors: [
      { pageVisited: '/products/cnc-milling-machine', stayDuration: 110, visitedAt: '2026-07-29 16:30' },
      { pageVisited: '/products/servo-valves', stayDuration: 70, visitedAt: '2026-07-29 16:34' },
      { pageVisited: '/contact', stayDuration: 25, visitedAt: '2026-07-29 16:38' },
    ],
    tags: [
      { key: 'form_filled', label: '已填表单', category: 'stage' },
      { key: 'chat_consult', label: '客服咨询', category: 'action' },
      { key: 'q4_demand', label: 'Q4需求', category: 'stage' },
    ],
    status: 'contacted',
    statusLabel: LEAD_STATUS_LABELS['contacted'],
    formSubmission: '公司名称：宁波拓普汽车零部件有限公司\n联系人：陈工\n职务：设备工程师\n电话：138-0002-3333\n需求描述：需采购5台CNC加工中心用于新能源零部件产线扩产，要求Q4前交付上线，目标年产能提升30%，支持非标定制。',
    aiChat: '咨询了CNC设备标准交期与加急排产方案',
    aiChatMessages: [
      { role: 'user', text: '你们CNC加工中心标准交期多久？', time: '2026-07-29 16:35' },
      { role: 'assistant', text: '标准机型交期6-8周，非标定制需评估，约10-12周。', time: '2026-07-29 16:35' },
      { role: 'user', text: '我们Q4前要上线，能加急吗？', time: '2026-07-29 16:36' },
      { role: 'assistant', text: '可申请加急产线，需先确认配置，我帮您预留产能。', time: '2026-07-29 16:36' },
    ],
    followUpRecords: [
      {
        id: 'fu-010-1',
        type: 'phone',
        content: '电话沟通，陈工确认需要5台CNC，关注交期与售后响应，约定本周发送正式方案。',
        createdAt: '2026-07-29 17:20',
        nextContact: '2026-07-30 15:00',
      },
    ],
  },
]

export const mockLeadsStatsData: LeadStats = {
  total: mockLeadsData.length,
  todayNew: mockLeadsData.filter((l) => l.createdAt.startsWith('2026-07-27')).length,
  highIntent: mockLeadsData.filter((l) => l.intentLevel === 'high').length,
  pendingFollowUp: mockLeadsData.filter((l) => l.status === 'pending').length,
  slaBreach: mockLeadsData.filter((l) => l.intentLevel === 'high' && l.status === 'pending').length,
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
