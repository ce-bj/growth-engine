import type {
  AttributionChange,
  AttributionMeasure,
  AttributionTaskType,
  ContentChannel,
  ContentTaskKind,
  ContentType,
  ReviewPeriod,
} from '../types'
import { resolveIntent } from './knowledge'

/** ═══════════════════════════════════════════════════════════════
   内容规划推导（content-planner skill 的规则化实现）
   输入：上游信号（归因诊断措施 / 内容洞察 / 手动请求）
   输出：ContentTask 简报字段（含 origin 来源追踪）
   生产阶段可将本文件替换为 LLM Agent 输出 JSON，调用方不变。
   ═══════════════════════════════════════════════════════════════ */

export interface ContentPlanInput {
  /** 归因措施（source=attribution） */
  measure?: AttributionMeasure
  /** 归因变化（source=attribution，提供 intentData/evidence/funnelSegment） */
  change?: AttributionChange
  /** 内容洞察机会标题（source=opportunity） */
  opportunityTitle?: string
  opportunityTheme?: string
  opportunityAudience?: string
  opportunityChannels?: ContentChannel[]
  opportunityPriority?: 'P0' | 'P1' | 'P2'
  opportunityId?: string
  /** 手动创建（source=manual） */
  manual?: { title: string; theme: string; audience: string }
}

export interface ContentPlanResult {
  title: string
  type: ContentType
  kind: ContentTaskKind
  priority: 'P0' | 'P1' | 'P2'
  theme: string
  audience: string
  userQuestion: string
  channels: ContentChannel[]
  origin: {
    source: 'attribution' | 'opportunity' | 'manual'
    sourceLabel: string
    attributionRef?: { changeId: string; measureId: string; reviewPeriod: ReviewPeriod }
    opportunityId?: string
    evidence?: { currentValue: string; benchmark: string; action: string }
  }
}

/** 从措施描述推导内容类型：按关键词归类 */
function inferType(description: string): ContentType {
  if (/配件|选型|规格|产品|详情/.test(description)) return 'product'
  if (/案例|落地|实施|交付/.test(description)) return 'case'
  if (/指南|如何|教程|常见问题|文章/.test(description)) return 'guide'
  if (/白皮书|行业|洞察/.test(description)) return 'insight'
  if (/FAQ|问答/.test(description)) return 'faq'
  if (/营销页|落地页/.test(description)) return 'solution'
  return 'solution'
}

/** 从措施描述推导任务类型 */
function inferKind(description: string): ContentTaskKind {
  if (/重写|优化|重构|更新|修改/.test(description)) return 'optimize'
  if (/生成|新建|创建|承接|重做/.test(description)) return 'create'
  if (/扩展|系列|计划|周更/.test(description)) return 'expand'
  if (/拆解|改编/.test(description)) return 'repurpose'
  return 'create'
}

function typeFromTaskType(taskType: AttributionTaskType, fallback: string): ContentType {
  switch (taskType) {
    case 'edit_product_detail':
    case 'create_product_detail':
      return 'product'
    case 'create_landing_page':
      return 'solution'
    case 'edit_page_copy':
    case 'publish_single_content':
      return 'guide'
    case 'publish_plan':
      return 'insight'
    default:
      return inferType(fallback)
  }
}

function kindFromTaskType(taskType: AttributionTaskType, fallback: string): ContentTaskKind {
  switch (taskType) {
    case 'edit_page_copy':
    case 'edit_product_detail':
      return 'optimize'
    case 'create_product_detail':
    case 'create_landing_page':
    case 'publish_single_content':
      return 'create'
    case 'publish_plan':
      return 'expand'
    default:
      return inferKind(fallback)
  }
}

/** 从归因措施 + 变化推导完整简报 */
export function planFromAttribution(measure: AttributionMeasure, change: AttributionChange): ContentPlanResult {
  const intent = resolveIntent(change.intentData ?? {})
  const description = measure.description
  const title = measure.deliverable?.title ?? description
  const priority: 'P0' | 'P1' | 'P2' = change.severity ?? 'P1'
  const channels: ContentChannel[] =
    change.funnelSegment === 'channel_arrival' ? ['website', 'linkedin'] : ['website']
  const reviewPeriod: ReviewPeriod = measure.reviewPeriod ?? 'T+7'
  const theme = measure.targetObject || intent.theme

  return {
    title,
    type: typeFromTaskType(measure.taskType, description),
    kind: kindFromTaskType(measure.taskType, description),
    priority,
    theme,
    audience: intent.audience,
    userQuestion: intent.userQuestion,
    channels,
    origin: {
      source: 'attribution',
      sourceLabel: `归因分析 · ${change.changedMetric ?? '指标异常'}`,
      attributionRef: { changeId: change.id, measureId: measure.measureId, reviewPeriod },
      evidence: measure.evidenceCard
        ? {
            currentValue: measure.evidenceCard.currentValue,
            benchmark: measure.evidenceCard.benchmark,
            action: measure.evidenceCard.action,
          }
        : undefined,
    },
  }
}

/** 从内容洞察推导简报 */
export function planFromOpportunity(input: ContentPlanInput): ContentPlanResult {
  return {
    title: input.opportunityTitle ?? '',
    type: 'guide',
    kind: 'create',
    priority: input.opportunityPriority ?? 'P1',
    theme: input.opportunityTheme ?? '',
    audience: input.opportunityAudience ?? '',
    userQuestion: `${input.opportunityAudience ?? ''}在${input.opportunityTheme ?? ''}上最关心什么？`,
    channels: input.opportunityChannels ?? ['website'],
    origin: {
      source: 'opportunity',
      sourceLabel: '内容洞察 · 本期计划',
      opportunityId: input.opportunityId,
    },
  }
}

/** 统一入口：按来源分发 */
export function planContent(input: ContentPlanInput): ContentPlanResult {
  if (input.measure && input.change) return planFromAttribution(input.measure, input.change)
  if (input.opportunityTitle) return planFromOpportunity(input)
  return {
    title: input.manual?.title ?? '',
    type: 'guide',
    kind: 'create',
    priority: 'P1',
    theme: input.manual?.theme ?? '',
    audience: input.manual?.audience ?? '',
    userQuestion: `${input.manual?.audience ?? ''}在${input.manual?.theme ?? ''}上最关心什么？`,
    channels: ['website'],
    origin: { source: 'manual', sourceLabel: '运营人员手动创建' },
  }
}
