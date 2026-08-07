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
  | 'config'

export const DIMENSION_ORDER: DimensionKey[] = [
  'tech', 'seo', 'geo', 'content', 'compliance', 'conversion', 'config',
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
  { key: 'config',     name: '基础配置',   weight: 0,    rawMax: 0,  weightPoints: 0  },
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
  status?: 'open' | 'done'
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
export type ContentTab = 'overview' | 'library' | 'plan' | 'review' | 'calendar' | 'assets' | 'publishing' | 'performance'

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
  | 'channel_setup'
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

/** 知识库调用风险追踪：内容生成过程中命中的 RAG no-hit（知识库未命中）事件 */
export type KnowledgeRiskLevel = 'critical' | 'high' | 'medium' | 'low'
export type KnowledgeRiskStatus = 'pending' | 'resolved'

export interface KnowledgeRiskEvent {
  id: string
  taskId: string
  taskTitle: string
  issueType: string
  diagnosis: string
  level: KnowledgeRiskLevel
  status: KnowledgeRiskStatus
  occurredAt: string
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

/** 渠道定义字段：单个渠道需要确认的一个配置项，字段值后续从平台其他功能（账号管理/CMS等）获取 */
export interface ChannelFieldDef {
  key: string
  label: string
  /** 字段值后续接入的来源说明 */
  source: string
}

/** 单个渠道已确认的定义字段取值 */
export interface ChannelProfile {
  channel: ContentChannel
  fields: Record<string, string>
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
  /** 已确认的渠道定义字段（步骤三：渠道选择与字段配置产出） */
  channelProfiles?: ChannelProfile[]
  /** 全球站：本内容需要发布到的语言站点（为空表示仅中文站） */
  locales?: string[]
  /** 母稿生成时在术语库中未命中译名的专业名词 */
  missingTerms?: string[]
  /** 任务来源：简报「生成依据/来源追踪」区块的数据来源（诊断/洞察/手动） */
  origin?: ContentTaskOrigin
  /** 一次性物料预算：进入生成前按内容类型模板推导的完整素材需求清单 */
  materialBudget?: MaterialBudgetItem[]
}

/** 任务来源类型：归因诊断 / 内容洞察 / 手动创建 */
export type ContentTaskSource = 'attribution' | 'opportunity' | 'manual'

/** 内容任务来源追踪：诊断/洞察转来的任务可回链到上游证据 */
export interface ContentTaskOrigin {
  source: ContentTaskSource
  /** 归因：关联的变化 + 措施 + 复盘周期（用于回链归因报告） */
  attributionRef?: { changeId: string; measureId: string; reviewPeriod: ReviewPeriod }
  /** 洞察：关联的内容机会 id */
  opportunityId?: string
  /** 来源标签（用户可见），如「归因分析 · 广告渠道落地页跳出率」 */
  sourceLabel: string
  /** 来源证据卡（现状/基准/动作） */
  evidence?: { currentValue: string; benchmark: string; action: string }
}

/** 物料预算单项状态：已就绪 / 缺失 / 待授权 */
export type MaterialBudgetStatus = 'ready' | 'missing' | 'pending_auth'

/** 物料预算单项 */
export interface MaterialBudgetItem {
  id: string
  /** 素材名，如「客户授权资料」 */
  name: string
  /** 对应内容类型模板的哪一项 */
  templateKey: string
  status: MaterialBudgetStatus
  /** 已有来源，如「CRM」「项目中心」 */
  source?: string
  /** 备注，如「需客户授权」「需法务确认」 */
  note?: string
  /** 生成过程中 RAG no-hit 追加标记 */
  addedDuringGeneration?: boolean
}

/** 内容洞察产出：可能需要做点什么，尚未被采纳，不属于计划 */
export type OpportunitySource = 'inventory' | 'read_performance' | 'social_performance' | 'business_focus' | 'manual' | 'retrospective'

export const OPPORTUNITY_SOURCE_LABELS: Record<OpportunitySource, string> = {
  inventory: '内容盘点',
  read_performance: '阅读表现',
  social_performance: '社媒表现',
  business_focus: '业务重点',
  manual: '运营人员',
  retrospective: '内容复盘',
}

export interface ContentOpportunity {
  id: string
  source: OpportunitySource
  /** 触发依据，如“近30天阅读量下降40%” */
  evidence: string
  suggestedTitle: string
  suggestedTheme: string
  suggestedChannels: ContentChannel[]
  suggestedPriority: 'P0' | 'P1' | 'P2'
  /** 若为优化/更新类机会，关联的既有内容任务 */
  relatedTaskId?: string
  /** 内容规划 Agent 从 evidence 推导的目标受众（避免转入生产时硬编码"待细化"） */
  inferredAudience?: string
  status: 'open' | 'adopted' | 'dismissed'
}

export type PlanItemStatus = 'proposed' | 'accepted' | 'promoted' | 'dropped'

/** 计划项：已采纳进本期计划、尚未转入生产的轻量记录（“计划做的内容”） */
export interface ContentPlanItem {
  id: string
  opportunityId?: string
  title: string
  type: ContentType
  kind: ContentTaskKind
  theme: string
  audience: string
  /** 意向渠道，转入生产后作为 ContentTask.channels 的初始值 */
  channels: ContentChannel[]
  priority: 'P0' | 'P1' | 'P2'
  dueDate: string
  reason: string
  status: PlanItemStatus
  /** 转入生产后创建的内容任务 id */
  promotedTaskId?: string
}


/** 全球站：语言站点 */
export interface ContentLocale {
  code: string
  label: string
  site: string
}

export type GlossaryStatus = 'ready' | 'partial' | 'missing'

/** 专业名词的定义与各语言站点译名 */
export interface GlossaryTerm {
  id: string
  term: string
  category: string
  definition: string
  /** 语言站点 code → 译名，缺失以空字符串表示 */
  translations: Record<string, string>
  updatedAt: string
}

export interface ContentCalendarItem {
  id: string
  taskId: string
  /** 完整日期 YYYY-MM-DD，便于按周翻页查看历史 */
  date: string
  time: string
  title: string
  channel: ContentChannel
  stage: 'production' | 'review' | 'publish'
  state: 'normal' | 'warning' | 'failed'
  /** 历史节点是否已完成 */
  done?: boolean
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

/** 5 段转化漏斗 */
export type FunnelSegment =
  | 'channel_arrival'
  | 'landing_page'
  | 'site_browsing'
  | 'conversion_interaction'
  | 'lead_success'

export const FUNNEL_SEGMENT_LABELS: Record<FunnelSegment, string> = {
  channel_arrival: '渠道到达',
  landing_page: '落地页',
  site_browsing: '站内浏览',
  conversion_interaction: '转化交互',
  lead_success: '成功留资',
}

/** 历史字段：曾用于调度 L4；现 UI 不展示，内容交接仍可作演示路由参考 */
export type AttributionTargetModule =
  | 'ai_content_engine'
  | 'conversion_path_designer'
  | 'smart_form'
  | 'ai_cs_pro'
  | 'tool_agent'
  | 'none'

export const TARGET_MODULE_LABELS: Record<AttributionTargetModule, string> = {
  ai_content_engine: '内容运营（交接）',
  conversion_path_designer: '转化路径（交接/人工）',
  smart_form: '表单（仅展示）',
  ai_cs_pro: '客服（仅展示）',
  tool_agent: '健康度修复',
  none: '仅展示',
}

/** 执行边界（归因侧：确认后交接 / 直接修复 / 仅展示） */
export type ExecutionBoundary = 'auto' | 'confirm' | 'advice_only'

/** §8.2 一期业务任务类型（第 5 步只写业务动作，不写后台能力名） */
export type AttributionTaskType =
  | 'edit_page_copy'
  | 'edit_product_detail'
  | 'create_product_detail'
  | 'create_landing_page'
  | 'publish_single_content'
  | 'publish_plan'
  | 'health_fix'
  | 'external_advice'

export const ATTRIBUTION_TASK_TYPE_LABELS: Record<AttributionTaskType, string> = {
  edit_page_copy: '修改已有页面文案',
  edit_product_detail: '修改已有产品详情',
  create_product_detail: '生成产品详情页',
  create_landing_page: '生成/重做营销落地页',
  publish_single_content: '生成并发布单篇内容',
  publish_plan: '建立持续内容发布计划',
  health_fix: '健康度修复',
  external_advice: '站外或人工处理建议',
}

export function boundaryFromTaskType(taskType: AttributionTaskType): ExecutionBoundary {
  if (taskType === 'health_fix') return 'auto'
  if (taskType === 'external_advice') return 'advice_only'
  return 'confirm'
}

export function targetModuleFromTaskType(taskType: AttributionTaskType): AttributionTargetModule {
  if (taskType === 'health_fix') return 'tool_agent'
  if (taskType === 'external_advice') return 'none'
  return 'ai_content_engine'
}

/** 复盘周期（对齐方案 9.2 按措施见效周期分档） */
export type ReviewPeriod = 'T+3' | 'T+7' | 'T+14' | 'T+30'

/** 执行产出（执行后客户可查看的交付物：生成页面 / 重写页面 / 修复日志 / A/B 变体） */
export interface MeasureDeliverable {
  kind: 'page' | 'rewrite' | 'log' | 'ab_test'
  /** 产物标题（如「CNC 加工配件 · 智能营销页」） */
  title: string
  /** 可跳转查看的链接（预览地址） */
  url?: string
  /** 产物说明（预览内容摘要 / 修复明细 / 变体说明） */
  previewNote?: string
}

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

/** 措施 / 任务说明（异常类产出，对齐方法论 §8.5） */
export interface AttributionMeasure {
  measureId: string
  /** 一句话摘要（列表/交接标题用） */
  description: string
  /** §8.2 任务类型 */
  taskType: AttributionTaskType
  /** 目标对象：哪个 URL、词、健康度问题等 */
  targetObject: string
  /** 任务说明中文条目（按类型写全） */
  taskBrief: string[]
  rootCause: string
  rootCauseConfidence: 'high' | 'medium' | 'low'
  evidenceCard: EvidenceCard
  suggestedBoundary: ExecutionBoundary
  /** 复盘周期（按见效周期分档：止血 T+3 / 治本 T+7 / 意图 T+14 / 长效 T+30） */
  reviewPeriod?: ReviewPeriod
  /** 执行后产生的可查看交付物 */
  deliverable?: MeasureDeliverable
  /** 执行状态（确认后流转） */
  execStatus?: 'pending_confirm' | 'executing' | 'success' | 'failed' | 'rejected' | 'advice_only'
  /** 内容类交接成功后，关联的内容运营任务 id（用于一键跳转） */
  contentTaskId?: string
  /** 内容已发布（Demo：模拟已发布后置 true；复盘从此刻起算） */
  contentPublished?: boolean
  contentPublishedAt?: string
  /** Demo 专用：允许在归因卡上「模拟已发布」 */
  demoPublishEnabled?: boolean
  /** @deprecated 兼容旧字段；新 mock 可不填，由 taskType 推导 */
  measureType?: 'quick_fix' | 'root_cure'
  cost?: 'low' | 'medium' | 'high'
  timeToEffect?: 'instant' | 'day' | 'week' | 'month'
  risk?: 'low' | 'medium' | 'high'
  targetModule?: AttributionTargetModule
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
  /** 异常类：任务说明清单 */
  measures?: AttributionMeasure[]
  /** 提升类：夸赞文案 + 保持建议 */
  praiseText?: string
  keepAdvice?: string
  /** 持平类：说明 + 提升建议（可预填任务说明，只展示） */
  explainText?: string
  improveSuggestions?: Array<{
    suggestion: string
    taskType?: AttributionTaskType
    targetObject?: string
    taskBrief?: string[]
    /** @deprecated */
    targetModule?: AttributionTargetModule
    expectedEffect?: string
  }>
  /** 复盘结果（异常类执行后回填） */
  reviewResult?: 'success' | 'partial' | 'failed'
  reviewNote?: string
  /** 演示脚本：发布/修复后复盘回放 */
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
  /** 定位到报告内某条变化 */
  changeId?: string
  /** 定位到某条措施 */
  measureId?: string
  /** 健康度修复任务 → 打开 FixDrawer（对齐 FixTaskRow） */
  fixTaskId?: string
  /** 内容交接 → 跳转内容运营工作台 */
  contentTaskId?: string
  /** 归因任务「已完成执行、待复盘」标识，如「待复盘 T+7」 */
  reviewPending?: string
}

/** 站点设置 · 归因分析周期配置 */
export interface AttributionConfig {
  enabled: boolean
  periodDays: number
}

export const ATTRIBUTION_PERIOD_OPTIONS = [7, 14, 30] as const

/** 效果分析按周维度的总统计 */
export interface ContentWeeklyPerformance {
  weekStart: string
  label: string
  websiteUv: number
  effectiveReadRate: number
  socialImpressions: number
  engagementRate: number
  linkClicks: number
  /** 该周发布到官网的内容条数 */
  websitePublished: number
  /** 该周发布到社媒的内容条数（按渠道版本计） */
  socialPublished: number
}

/** 单条已发布内容的发布计数与效果明细 */
export interface ContentPublishStat {
  id: string
  taskId: string
  weekStart: string
  title: string
  publishedAt: string
  /** 官网发布次数（含更新重发） */
  websiteCount: number
  /** 社媒发布条数 */
  socialCount: number
  channelCounts: Array<{ channel: ContentChannel; count: number; url?: string; lastPublishedAt: string }>
  uv: number
  effectiveReadRate: number
  avgDuration: string
  impressions: number
  engagements: number
  engagementRate: number
  linkClicks: number
}

/** 发布管理 · 发布设置 */
export interface PublishSettings {
  contentIds: string[]
  channels: ContentChannel[]
  locales: string[]
  mode: 'immediate' | 'scheduled'
  scheduledAt: string
  failStrategy: 'continue' | 'stop'
  approval: 'manual' | 'auto'
}