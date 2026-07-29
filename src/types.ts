/** 增长工作台 · B 端后台类型 — 对齐 PRD v1.0 */

export type ScoreLevel = 'excellent' | 'good' | 'pass' | 'poor'

export type IssuePriority = 'P0' | 'P1' | 'P2'

export type FixMode = 'auto' | 'manual' | 'guide'

export type DimensionKey =
  | 'tech'
  | 'seo'
  | 'geo'
  | 'content'
  | 'compliance'
  | 'conversion'

export const DIMENSION_ORDER: DimensionKey[] = [
  'tech', 'seo', 'geo', 'content', 'compliance', 'conversion',
]

export const DIMENSION_META: Array<{
  key: DimensionKey
  name: string
  weight: number
  rawMax: number
  weightPoints: number
}> = [
  { key: 'tech',       name: '技术与性能', weight: 0.20, rawMax: 20, weightPoints: 20 },
  { key: 'seo',        name: 'SEO 友好度', weight: 0.16, rawMax: 20, weightPoints: 16 },
  { key: 'geo',        name: 'GEO 友好度', weight: 0.14, rawMax: 20, weightPoints: 14 },
  { key: 'content',    name: '内容质量',   weight: 0.22, rawMax: 20, weightPoints: 22 },
  { key: 'compliance', name: '全球合规',   weight: 0.16, rawMax: 20, weightPoints: 16 },
  { key: 'conversion', name: '商业转化',   weight: 0.12, rawMax: 20, weightPoints: 12 },
]

/** 侧栏可进入的业务页（scanning / fix 为覆盖层，不占导航） */
export type ViewId =
  | 'dashboard'
  | 'report'
  | 'history'
  | 'tasks'
  | 'weekly'
  | 'settings'
  | 'scanning'
  | 'content'
  | 'leads'

export type FunnelPeriod = 'week' | 'month'

export type DetectType = 'quick' | 'full' | 'manual' | 'verify'

export type TaskStatus = 'pending' | 'running' | 'waiting_verify' | 'done' | 'failed'

export interface SiteInfo {
  id: string
  name: string
  url: string
  language: string
  tradeType: 'domestic' | 'export'
  isPrimary: boolean
}

export interface DimensionScore {
  key: DimensionKey
  name: string
  weight: number
  rawScore: number
  rawMax: number
  weightPoints: number
}

/** §22 检测项规则手册 — 单个检测项 */
export interface DetectionItem {
  id: string
  dimensionKey: DimensionKey
  /** 检测项名称（用户可见） */
  title: string
  /** 大白话描述，说明检测什么 */
  description: string
  /** 权重分（该检测项在维度内占几分） */
  weight: number
  priority: IssuePriority
  fixMode: FixMode
}

/** 维度维度下的检测项清单 */
export interface DimensionConfig {
  key: DimensionKey
  name: string
  weight: number
  rawMax: number
  weightPoints: number
  items: DetectionItem[]
}

export interface HealthSnapshot {
  totalScore: number
  previousScore: number
  detectedAt: string
  detectType: DetectType
  dimensions: DimensionScore[]
  trend7: number[]
  trend30: number[]
}

export interface IssueItem {
  id: string
  priority: IssuePriority
  title: string
  description: string
  dimensionKey: DimensionKey
  fixMode: FixMode
}

export interface FunnelSource {
  name: string
  percent: number
}

export interface FunnelMetric {
  label: string
  value: string
  delta: string
  positive: boolean
}

export interface FunnelData {
  sources: FunnelSource[]
  stage2: FunnelMetric[]
  stage3: FunnelMetric[]
  inquiryRate: number
  inquiryRateDelta: string
  inquiryDetail: string
  bounceRate: number
}

export interface ScanStep {
  id: string
  label: string
}

export interface FixTarget {
  kind: 'issue' | 'dimension'
  issueId?: string
  dimensionKey: DimensionKey
  title: string
  currentRaw: number
  fixMode: FixMode
}

export interface ToastItem {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  autoDismiss: boolean
}

export interface DetectHistoryRow {
  id: string
  detectedAt: string
  detectType: DetectType
  totalScore: number
  previousScore: number
  p0: number
  p1: number
  p2: number
  siteId: string
  operator: string
}

export interface FixTaskRow {
  id: string
  title: string
  dimensionKey: DimensionKey
  priority: IssuePriority
  status: TaskStatus
  fixMode: FixMode
  createdAt: string
  updatedAt: string
  scoreBefore: number | null
  scoreAfter: number | null
  issueId?: string
}

export interface WeeklyReportRow {
  id: string
  weekLabel: string
  sentAt: string
  score: number
  previousScore: number
  opened: boolean
  siteId: string
}

/** §10 自动检测策略配置 */
export interface AutoDetectConfig {
  enabled: boolean
  weeklyDay: 1 | 2 | 3 | 4 | 5 | 6 | 0 // 0=周日, 1=周一...
  weeklyHour: number // 0-23
  monthlyFirstWeek: boolean
  quickThreshold: number // 低于此分数触发针对性检测
  declineThreshold: number // 连续下降此分数触发退步预警
}

/** §11 Agent 生态 */
export interface AgentInfo {
  id: string
  name: string
  layer: 'entry' | 'report' | 'fix' | 'operation'
  description: string
  triggerWhen: string
  icon: string
}

/** §13 线索管理 */
export type IntentLevel = 'high' | 'medium' | 'low' | 'invalid'

export type LeadSource =
  | 'korean_site'
  | 'feiyu_crm'
  | 'baidu_ads'
  | 'tencent_ads'
  | 'trade_insight'
  | 'global_company_db'

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  korean_site: '韩语站点',
  feiyu_crm: '飞鱼CRM',
  baidu_ads: '百度营销',
  tencent_ads: '腾讯广告',
  trade_insight: '外贸客户洞察',
  global_company_db: '全球企业库',
}

export type LeadStatus = 'pending' | 'contacted' | 'qualified' | 'converted' | 'invalid'

export type FollowUpType = 'phone' | 'email' | 'sms' | 'note'

export interface LeadBehavior {
  pageVisited: string        // 浏览的页面
  stayDuration: number        // 停留时长（秒）
  visitedAt: string           // 访问时间
}

export interface LeadTag {
  key: string
  label: string
  category: 'budget' | 'decision' | 'stage' | 'type' | 'action'
}

export interface FollowUpRecord {
  id: string
  type: FollowUpType
  content: string
  createdAt: string
  nextContact?: string        // 下次联系时间
}

export interface NurtureRecord {
  id: string
  sequenceName: string
  sentAt: string
  channel: 'email' | 'sms' | 'wechat'
  status: 'sent' | 'opened' | 'clicked' | 'bounced'
  subject?: string
}

export interface CustomsData {
  hsCode: string
  importExport: 'import' | 'export'
  importValue: string
  originCountry: string
  destCountry: string
  lastImportDate: string
  importFrequency: number
  productDesc: string
}

export interface AiChatMessage {
  role: 'user' | 'assistant'
  text: string
  time: string
}

export interface Lead {
  id: string
  /** 来源：获客渠道 */
  source: LeadSource
  /** 来源站点/语言标签（如：俄语、韩语、英语） */
  sourceLang?: string
  /** 来源表单类型（如：智能客服、表单123） */
  sourceForm?: string
  createdAt: string
  company: string
  contact: string
  email?: string
  phone?: string
  jobTitle?: string
  /** 基础画像：行业 */
  industry?: string
  /** 基础画像：规模，如「1-50人」「50-200人」「200人以上」 */
  companyScale?: string
  intentLevel: IntentLevel
  intentScore: number
  intentReason: string
  landingPage: string
  behaviors: LeadBehavior[]
  tags: LeadTag[]
  status: LeadStatus
  statusLabel: string
  /** 归属销售 */
  owner?: string
  followUpAt?: string
  notes?: string
  /** 跟进历史（内存中维护） */
  followUpRecords?: FollowUpRecord[]
  /** 海关数据 */
  customsData?: CustomsData
  /** 表单提交内容 */
  formSubmission?: string
  /** 智能客服对话摘要 */
  aiChat?: string
  /** 智能客服对话内容 */
  aiChatMessages?: AiChatMessage[]
  /** 国家 */
  country?: string
  /** 地域 */
  region?: string
  /** 公司地址 */
  address?: string
  /** 培育履历（自动培育序列记录） */
  nurtureRecords?: NurtureRecord[]
}

export interface LeadStats {
  total: number
  todayNew: number
  highIntent: number
  pendingFollowUp: number
  slaBreach: number
}

/** §14 内容运营 */
export type ContentStatus = 'idle' | 'running' | 'paused'

export type ArticleStatus = 'draft' | 'pending' | 'generating' | 'published' | 'failed'

export type ArticleType = 'blog' | 'case' | 'insight' | 'guide'

export interface ArticleTypeInfo {
  key: ArticleType
  label: string
  icon: string
  color: string
  desc: string
}

export interface ContentArticle {
  id: string
  title: string
  type: ArticleType
  keywords: string[]
  status: ArticleStatus
  wordCount: number
  publishedAt?: string
  cmsUrl?: string
  socialSync?: string[]
  /** 近7天 UV，来自 LandingPage 数据 */
  uv?: number
  /** 近7天 PV（页面浏览量） */
  pv?: number
  /** 近7天留资数 */
  inquiryCount?: number
  /** 近7天跳出率 */
  bounceRate?: number
}

export interface ContentKeyword {
  keyword: string
  volume: number
  difficulty: number
  opportunity: 'high' | 'medium' | 'low'
  articleCount: number
}

export interface ContentPlan {
  id: string
  keyword: string
  articleType: ArticleType
  targetWordCount: number
  status: 'pending' | 'generating' | 'ready' | 'published' | 'failed'
  estimatedTraffic: number
  createdAt: string
  /** 选题依据，展示在计划卡片内 */
  reason?: string
  /** 选题依据类型：A=更新老文章，B=渠道补位，C=关键词长尾 */
  reasonType?: 'A' | 'B' | 'C'
}

export interface ContentStats {
  totalArticles: number
  publishedThisWeek: number
  publishedThisMonth: number
  keywordCoverage: number
  estimatedWeeklyTraffic: number
  pendingCount: number
  running: boolean
  /** 近30天内容总 UV（来自 LandingPage 数据汇总） */
  monthlyUV?: number
  /** 近30天内容总 PV */
  monthlyPV?: number
  /** 近30天内容总留资数 */
  monthlyInquiries?: number
  /** 近30天内容平均跳出率 */
  avgBounceRate?: number
}
