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

/** §14 内容运营：内容全生命周期原型 */
export type ContentTab = 'overview' | 'plan' | 'calendar' | 'assets' | 'publishing' | 'performance'

export type ContentChannel = 'website' | 'linkedin' | 'facebook' | 'x'

export type ContentType =
  | 'product'
  | 'solution'
  | 'scenario'
  | 'case'
  | 'guide'
  | 'faq'
  | 'insight'

export type ContentTaskKind =
  | 'create'
  | 'optimize'
  | 'expand'
  | 'repurpose'
  | 'localize'
  | 'refresh'
  | 'compliance'
  | 'retire'

export type ContentTaskStatus =
  | 'needs_material'
  | 'ready'
  | 'generating'
  | 'quality_review'
  | 'compliance_review'
  | 'channel_adaptation'
  | 'pending_approval'
  | 'scheduled'
  | 'published'
  | 'observing'
  | 'needs_optimization'
  | 'retired'

export type ComplianceLevel = 'pass' | 'low' | 'medium' | 'high' | 'blocking'
export type PublicationStatus = 'pending_approval' | 'scheduled' | 'published' | 'partial' | 'failed' | 'retired'

export interface ContentQualityScore {
  overall: number
  relevance: number
  accuracy: number
  completeness: number
  readability: number
  authenticity: number
  channelFit: number
}

export interface ComplianceIssue {
  id: string
  level: ComplianceLevel
  category: 'fact' | 'brand' | 'copyright' | 'privacy' | 'industry' | 'advertising' | 'platform' | 'localization'
  title: string
  detail: string
  resolved: boolean
}

export interface KnowledgeReference {
  id: string
  category: string
  title: string
  source: string
  verified: boolean
}

export interface ChannelVersion {
  channel: ContentChannel
  title: string
  body: string
  account: string
  scheduledAt?: string
  status: 'draft' | 'ready' | 'scheduled' | 'published' | 'failed'
  url?: string
  error?: string
}

export interface ContentTask {
  id: string
  title: string
  kind: ContentTaskKind
  type: ContentType
  status: ContentTaskStatus
  priority: 'P0' | 'P1' | 'P2'
  theme: string
  audience: string
  userQuestion: string
  channels: ContentChannel[]
  dueDate: string
  reason: string
  outline: string[]
  masterDraft: string
  knowledge: KnowledgeReference[]
  missingMaterials: string[]
  quality: ContentQualityScore
  compliance: ComplianceIssue[]
  channelVersions: ChannelVersion[]
}

export interface ContentCalendarItem {
  id: string
  taskId: string
  date: string
  time: string
  title: string
  channel: ContentChannel
  stage: 'production' | 'review' | 'publish'
  state: 'normal' | 'warning' | 'failed'
}

export interface ContentAsset {
  id: string
  taskId: string
  title: string
  type: ContentType
  language: string
  status: 'draft' | 'reviewing' | 'published' | 'needs_update' | 'retired'
  qualityScore: number
  compliance: ComplianceLevel
  channels: ContentChannel[]
  updatedAt: string
  expiresAt: string
  uv: number
  effectiveReadRate: number
}

export interface PublicationRecord {
  id: string
  taskId: string
  title: string
  status: PublicationStatus
  approvedBy?: string
  scheduledAt?: string
  channels: ChannelVersion[]
}

export interface ContentThemePerformance {
  id: string
  theme: string
  taskId: string
  website: {
    uv: number
    effectiveReadRate: number
    avgDuration: string
    scrollRate: number
    bounceRate: number
    relatedClicks: number
  }
  social: {
    impressions: number
    engagements: number
    engagementRate: number
    linkClicks: number
  }
  conclusion: string
  action: 'expand' | 'optimize' | 'refresh' | 'review'
}

/* ═══════════════════════════════════════════════════════════════
   业务指标归因分析（线 B）— 对齐产品方案 v1.1
   与线 A 健康度体检完全独立，只共用智能体任务中心
   ═══════════════════════════════════════════════════════════════ */

/** 变化类型：异常(下降) / 提升(上升) / 持平(平稳) */
export type ChangeType = 'down' | 'up' | 'flat'

/** 6 段转化漏斗 */
export type FunnelSegment =
  | 'channel_arrival'
  | 'landing_page'
  | 'site_browsing'
  | 'conversion_entry'
  | 'conversion_interaction'
  | 'lead_success'

export const FUNNEL_SEGMENT_LABELS: Record<FunnelSegment, string> = {
  channel_arrival: '渠道到达',
  landing_page: '落地页',
  site_browsing: '站内浏览',
  conversion_entry: '转化入口触发',
  conversion_interaction: '转化交互',
  lead_success: '成功留资',
}

/** 措施调度的 L4 模块 */
export type AttributionTargetModule =
  | 'ai_content_engine'
  | 'conversion_path_designer'
  | 'smart_form'
  | 'ai_cs_pro'
  | 'tool_agent'
  | 'none'

export const TARGET_MODULE_LABELS: Record<AttributionTargetModule, string> = {
  ai_content_engine: 'AI 内容引擎',
  conversion_path_designer: '转化路径设计器',
  smart_form: '智能表单系统',
  ai_cs_pro: 'AI 智能客服 PRO',
  tool_agent: '工具/Agent',
  none: '只出方案',
}

/** 执行边界 */
export type ExecutionBoundary = 'auto' | 'confirm' | 'advice_only'

/** 依据卡片三段式：现状数据 + 对比基准 + 具体动作 */
export interface EvidenceCard {
  currentValue: string
  benchmark: string
  action: string
}

/** 用户意图数据（第二层④，对齐方案 4.3.4，调 L3 搜索意图精准匹配） */
export interface IntentEvidence {
  /** 站内搜索词信号 */
  siteSearch?: string
  /** SEO/广告来路关键词信号 */
  inboundKeyword?: string
  /** 客服对话意图信号 */
  csIntent?: string
}

/** 措施（异常类产出） */
export interface AttributionMeasure {
  measureId: string
  description: string
  rootCause: string
  rootCauseConfidence: 'high' | 'medium' | 'low'
  evidenceCard: EvidenceCard
  measureType: 'quick_fix' | 'root_cure'
  cost: 'low' | 'medium' | 'high'
  timeToEffect: 'instant' | 'day' | 'week' | 'month'
  risk: 'low' | 'medium' | 'high'
  targetModule: AttributionTargetModule
  suggestedBoundary: ExecutionBoundary
  /** 执行状态（确认后流转） */
  execStatus?: 'pending_confirm' | 'executing' | 'success' | 'failed' | 'rejected' | 'advice_only'
}

/** 单条变化的归因结果 */
export interface AttributionChange {
  id: string
  changeType: ChangeType
  changedMetric: string
  changedValue: string
  baselineValue: string
  changeAmount: string
  severity: IssuePriority | null
  funnelSegment: FunnelSegment
  rootCause: string
  causeCategory: string
  confidence: 'high' | 'medium' | 'low'
  evidence: string[]
  /** 意图数据（第二层④，意图类归因时填充，对齐方案 4.3.4） */
  intentData?: IntentEvidence
  /** Agent 对话式分析过程（模板化渲染的条目） */
  analysisSteps: string[]
  /** 异常类：措施清单 */
  measures?: AttributionMeasure[]
  /** 提升类：夸赞文案 + 保持建议 */
  praiseText?: string
  keepAdvice?: string
  /** 持平类：说明 + 提升建议 */
  explainText?: string
  improveSuggestions?: Array<{
    suggestion: string
    targetModule: AttributionTargetModule
    expectedEffect: string
  }>
  /** 复盘结果（异常类执行后回填） */
  reviewResult?: 'success' | 'partial' | 'failed'
  reviewNote?: string
  /** 演示脚本：本期报告确认执行后回放的复盘结论（对齐方案案例结局） */
  reviewScript?: {
    result: 'success' | 'partial' | 'failed'
    note: string
  }
}

/** 一期归因报告 */
export interface AttributionReport {
  id: string
  periodLabel: string
  generatedAt: string
  periodDays: number
  nextAnalysisAt: string
  siteId: string
  changes: AttributionChange[]
}

/** 智能体任务中心 · 统一任务模型（归因 + 健康修复 + 内容） */
export type AgentTaskModule = 'attribution' | 'health_fix' | 'content'

export const AGENT_MODULE_LABELS: Record<AgentTaskModule, string> = {
  attribution: '归因分析',
  health_fix: '健康度修复',
  content: '内容运营',
}

export interface AgentTaskRow {
  id: string
  module: AgentTaskModule
  title: string
  summary: string
  status: TaskStatus
  priority: IssuePriority | null
  createdAt: string
  updatedAt: string
  /** 归因报告任务 → 跳转归因详情 */
  attributionReportId?: string
  /** 健康度修复任务 → 打开 FixDrawer（对齐 FixTaskRow） */
  fixTaskId?: string
}

/** 站点设置 · 归因分析周期配置 */
export interface AttributionConfig {
  enabled: boolean
  periodDays: number
}

export const ATTRIBUTION_PERIOD_OPTIONS = [7, 14, 30] as const
