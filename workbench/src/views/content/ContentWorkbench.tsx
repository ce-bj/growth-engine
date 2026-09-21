import { AlertTriangle, ArrowLeft, Check, ChevronDown, ChevronRight, ChevronUp, CircleAlert, ExternalLink, FileCheck2, Globe, Languages, Library, Plus, RefreshCw, Send, ShieldAlert, Sparkles, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/Button'
import { resolveMaterialKnowledgeTarget } from '../../lib/materialBudget'
import type { ChannelProfile, ContentChannel, ContentKnowledgeScope, ContentLocale, ContentTask, GlossaryTerm, KnowledgeRiskEvent, MaterialBudgetItem } from '../../types'
import { ContentAssistantPanel, type AgentArtifactItem, type AgentRunItem, type AssistantQuickAction } from './ContentAssistantPanel'
import { CHANNEL_FIELD_DEFS, ChannelBadge, CHANNEL_META, CONTENT_STEPS, getGlossaryStatus, getReviewVerdict, getTaskStep, KIND_LABEL, KNOWLEDGE_RISK_SOURCE_LABEL, KnowledgeRiskBadge, KNOWLEDGE_RISK_STATUS_LABEL, MATERIAL_BUDGET_TEMPLATES, MaterialBudgetStatusBadge, OriginBadge, QualityRing, ReviewVerdictBadge, StatusBadge, TYPE_LABEL } from './ContentPrimitives'

const KNOWLEDGE_SCOPE_LABELS: Record<ContentKnowledgeScope, string> = {
  company: '企业资料', product: '产品资料', service: '服务与方案', case: '案例证据', industry: '行业知识',
}

export function ContentWorkbench({ task, initialStep, knowledgeRisks, locales, glossaryTerms, onBack, onUpdateBrief, onUpdateOutline, onResolveMaterials, onConfirmChannelProfiles, onUpdateBudget, onGenerateDraft, onRegenerateDraft, onToggleComplianceIssue, onIgnoreWarnings, onConfirmPreview, onSubmitApproval, onApprove, onOpenGlossary, onOpenKnowledgeRisks }: {
  task: ContentTask
  initialStep?: number
  knowledgeRisks: KnowledgeRiskEvent[]
  locales: ContentLocale[]
  glossaryTerms: GlossaryTerm[]
  onBack: () => void
  onUpdateBrief: (taskId: string, patch: Partial<Pick<ContentTask, 'title' | 'type' | 'kind' | 'contentSubject' | 'knowledgeScopes' | 'audience' | 'userQuestion' | 'theme' | 'reason' | 'dueDate' | 'locales' | 'channels' | 'businessGoal' | 'successMetric' | 'journeyStage' | 'coreMessage' | 'desiredAction' | 'mustInclude' | 'mustAvoid' | 'owner'>>) => void
  onUpdateOutline: (taskId: string, outline: string[]) => void
  onResolveMaterials: (taskId: string) => void
  onConfirmChannelProfiles: (taskId: string, profiles: ChannelProfile[]) => void
  onUpdateBudget: (taskId: string, budget: MaterialBudgetItem[]) => void
  onGenerateDraft: (taskId: string) => void
  onRegenerateDraft: (taskId: string) => void
  onToggleComplianceIssue: (taskId: string, issueId: string) => void
  onIgnoreWarnings: (taskId: string) => void
  onConfirmPreview: (taskId: string, channel: ContentChannel) => void
  onSubmitApproval: (taskId: string) => void
  onApprove: (taskId: string, scheduledAt: string) => void
  onOpenGlossary: (terms: string[]) => void
  onOpenKnowledgeRisks: () => void
}) {
  const isShowcaseTask = task.id === 'ct-001'
  const [step, setStep] = useState(initialStep ?? (!task.channelProfiles && !task.masterDraft ? 0 : Math.min(getTaskStep(task.status), CONTENT_STEPS.length - 1)))
  const [channel, setChannel] = useState<ContentChannel>(task.channelVersions[0]?.channel ?? task.channels[0] ?? 'website')
  const [scheduledAt, setScheduledAt] = useState('2026-08-03T10:00')
  const [failStrategy, setFailStrategy] = useState<'continue' | 'stop'>('continue')
  const [knowledgeModalItem, setKnowledgeModalItem] = useState<MaterialBudgetItem | null>(null)
  const [preparedMaterialIds, setPreparedMaterialIds] = useState<string[]>([])
  const [fieldValues, setFieldValues] = useState<Record<string, Record<string, string>>>(() => {
    const initial: Record<string, Record<string, string>> = {}
    task.channels.forEach((ch) => {
      const existing = task.channelProfiles?.find((p) => p.channel === ch)?.fields
      const defaults: Record<string, string> = {}
      CHANNEL_FIELD_DEFS[ch].forEach((field) => { defaults[field.key] = existing?.[field.key] ?? '' })
      initial[ch] = defaults
    })
    return initial
  })
  const blockers = task.compliance.filter((item) => !item.resolved && (item.level === 'blocking' || item.level === 'high'))
  const verdict = getReviewVerdict(task)
  const version = task.channelVersions.find((item) => item.channel === channel)
  const allChannelsVersioned = task.channels.every((item) => task.channelVersions.some((version) => version.channel === item))
  const confirmedChannels = task.previewConfirmations?.map((item) => item.channel) ?? []
  const allPreviewsConfirmed = task.channels.every((item) => confirmedChannels.includes(item))
  const allFieldsFilled = task.channels.every((ch) => CHANNEL_FIELD_DEFS[ch].every((field) => fieldValues[ch]?.[field.key]?.trim()))
  const taskKnowledgeRisks = knowledgeRisks.filter((item) => item.taskId === task.id)
  const openKnowledgeRisks = taskKnowledgeRisks.filter((item) => item.status !== 'resolved')

  /** 全球站：本内容要发布到的语言站点，以及其中译名尚未配齐的专业名词 */
  const taskLocales = locales.filter((locale) => task.locales?.includes(locale.code))
  const termGaps = taskLocales.length === 0 ? [] : (task.missingTerms ?? []).filter((name) => {
    const term = glossaryTerms.find((item) => item.term === name)
    return !term || getGlossaryStatus(term, taskLocales) !== 'ready'
  })
  const hasDraftGap = termGaps.length > 0 || openKnowledgeRisks.length > 0
  const verifiedKnowledge = task.knowledge.filter((ref) => ref.verified)

  /** 步骤②：语言站点选择（本内容要发布到的语言站点） */
  const selectedLocaleCodes = task.locales ?? []
  function toggleLocale(code: string) {
    const next = selectedLocaleCodes.includes(code)
      ? selectedLocaleCodes.filter((c) => c !== code)
      : [...selectedLocaleCodes, code]
    onUpdateBrief(task.id, { locales: next })
  }

  function toggleTargetChannel(ch: ContentChannel) {
    const next = task.channels.includes(ch) ? task.channels.filter((item) => item !== ch) : [...task.channels, ch]
    if (next.length === 0) return
    if (!task.channels.includes(ch)) {
      const defaults: Record<string, string> = {}
      CHANNEL_FIELD_DEFS[ch].forEach((field) => { defaults[field.key] = '' })
      setFieldValues((prev) => ({ ...prev, [ch]: defaults }))
    }
    onUpdateBrief(task.id, { channels: next })
    if (!next.includes(channel)) setChannel(next[0])
  }

  function toggleKnowledgeScope(scope: ContentKnowledgeScope) {
    const current = task.knowledgeScopes ?? []
    const next = current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope]
    onUpdateBrief(task.id, { knowledgeScopes: next })
  }

  /** 一次性物料预算：有显式预算则用，否则按内容类型模板推导初始清单 */
  const initialBudget: MaterialBudgetItem[] = task.materialBudget ?? MATERIAL_BUDGET_TEMPLATES[task.type].map((tpl, i) => ({ id: `mb-tpl-${i}`, templateKey: tpl.templateKey, name: tpl.name, status: tpl.defaultStatus, note: tpl.note, addedDuringGeneration: false }))
  const budget: MaterialBudgetItem[] = initialBudget.map((item) => ({ ...item, knowledgeTarget: item.knowledgeTarget ?? resolveMaterialKnowledgeTarget(task.type, task.contentSubject || task.theme, item.templateKey, item.name) }))
  const budgetReady = budget.every((item) => item.status === 'ready')
  const budgetMissing = budget.filter((item) => item.status !== 'ready')
  const retrievalContract = [
    { label: '内容类型', pass: Boolean(task.type) },
    { label: '任务类型', pass: Boolean(task.kind) },
    { label: '内容对象', pass: Boolean((task.contentSubject || task.theme).trim()) },
    { label: '知识范围', pass: Boolean(task.knowledgeScopes?.length) },
    { label: '目标受众', pass: Boolean(task.audience.trim()) },
    { label: '核心问题', pass: Boolean(task.userQuestion.trim()) },
    { label: '业务目标', pass: Boolean(task.businessGoal) },
  ]
  const briefMissing = retrievalContract.filter((item) => !item.pass).length
  const preGenerationChecks = [
    { label: '任务简报已确认', pass: briefMissing === 0 },
    { label: '渠道定义字段完整', pass: allFieldsFilled },
    { label: '资料与素材全部就绪', pass: budgetReady },
    { label: '知识来源可验证', pass: verifiedKnowledge.length > 0 },
    { label: '目标语言术语完整', pass: termGaps.length === 0 },
  ]
  const canRunResearch = briefMissing === 0 && allFieldsFilled && budgetReady && termGaps.length === 0
  const qualityAudit = [
    { label: '经验 E', value: task.quality.experience, max: 25, evidence: '检查真实案例、实测数据与一线操作细节', suggestion: '补充可验证的真实案例、实测数据与一线细节' },
    { label: '专业 E', value: task.quality.expertise, max: 25, evidence: `${verifiedKnowledge.length} 条已验证知识来源可追溯；核对参数与知识库一致`, suggestion: '为参数、数字和专业判断补充有效来源，引用 IEC/ISO 等认证' },
    { label: '权威 A', value: task.quality.authority, max: 25, evidence: '检查作者 / 机构署名与可点击引用来源', suggestion: '补充作者署名、可点击引用源与第三方背书' },
    { label: '可信 T', value: task.quality.trustworthiness, max: 25, evidence: '检查 H2/H3 结构、信源可点击与更新日期', suggestion: '补充结构化标记、可点击信源与"最后更新"日期' },
  ]

  const draftText = task.masterDraft ?? ''
  const firstPara = draftText.split('\n\n')[0] ?? ''
  const geoChecks = [
    { n: '①', name: '结构清晰', rule: 'H2/H3 无跳级（H1→H3 跳级即不通过）', pass: draftText.split('\n\n').filter(Boolean).length >= 2 },
    { n: '②', name: '结论明确', rule: '首段 ≤120 字含判断句', pass: firstPara.length > 0 && firstPara.length <= 120 },
    { n: '③', name: '含 FAQ', rule: '≥3 组 Q&A（Q:/A: 或结构化块）', pass: /(Q[:：]|A[:：]|问[:：]|答[:：]|FAQ)/i.test(draftText) },
    { n: '④', name: '可引用短句', rule: '存在 ≤40 字结论句（NLP 抽取）', pass: /[\u4e00-\u9fa5A-Za-z0-9，。、]{1,40}[。！？\n]/.test(draftText) },
  ]
  const HARD_RED_LINES: Array<{ label: string; rule: string; auto: 'auto' | 'manual'; note?: string }> = [
    { label: '事实错误（参数错）', rule: '成稿参数与知识库对照，不符即退回', auto: 'auto' },
    { label: '禁用词命中', rule: '禁用词库匹配', auto: 'auto' },
    { label: '抄袭 ≥15%', rule: '相似度比对', auto: 'auto' },
    { label: '品牌词不一致', rule: '多语言品牌词库扫描', auto: 'auto' },
    { label: '虚构案例', rule: '无知识库对应记录且无法验证 → 标记高风险', auto: 'manual', note: '抽样人工' },
    { label: '虚构资质', rule: '需人工核对证书库 / 用户举报', auto: 'manual', note: '需人核对' },
  ]

  function updateField(ch: ContentChannel, key: string, value: string) {
    setFieldValues((prev) => ({ ...prev, [ch]: { ...prev[ch], [key]: value } }))
  }

  function confirmChannelProfiles() {
    const profiles: ChannelProfile[] = task.channels.map((ch) => ({ channel: ch, fields: fieldValues[ch] ?? {} }))
    onConfirmChannelProfiles(task.id, profiles)
    setStep(2)
  }

  function resolveMaterialsAndContinue() {
    if (!canRunResearch) return
    onResolveMaterials(task.id)
    setStep(3)
  }

  function completeKnowledgeModal() {
    if (!knowledgeModalItem) return
    setPreparedMaterialIds((current) => current.includes(knowledgeModalItem.id) ? current : [...current, knowledgeModalItem.id])
    setKnowledgeModalItem(null)
  }

  function markMaterialsChecked(itemIds: string[]) {
    const checkedIds = new Set(itemIds)
    if (checkedIds.size === 0) return
    const checkedAt = new Date().toISOString()
    onUpdateBudget(task.id, budget.map((item) => checkedIds.has(item.id) ? {
      ...item,
      status: 'ready',
      source: item.knowledgeTarget?.directoryName ?? '企业知识库',
      note: '重新检查通过：资料已完善并位于授权目录',
      lastCheckedAt: checkedAt,
    } : item))
    setPreparedMaterialIds((current) => current.filter((id) => !checkedIds.has(id)))
  }

  function moveOutlineItem(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= task.outline.length) return
    const next = [...task.outline]
    ;[next[index], next[target]] = [next[target], next[index]]
    onUpdateOutline(task.id, next)
  }

  function updateOutlineItem(index: number, value: string) {
    const next = task.outline.map((item, i) => i === index ? value : item)
    onUpdateOutline(task.id, next)
  }

  function removeOutlineItem(index: number) {
    onUpdateOutline(task.id, task.outline.filter((_, i) => i !== index))
  }

  function addOutlineItem() {
    onUpdateOutline(task.id, [...task.outline, ''])
  }

  /** 按合规问题类别给出对应的处理入口：术语缺译名→术语库，资料/授权缺失→资料与素材，其余文案类问题→内容概览 */
  function getComplianceAction(category: string): { label: string; onClick: () => void } {
    if (category === 'localization') return { label: '去术语库补充译名', onClick: () => onOpenGlossary([]) }
    if (category === 'privacy' || category === 'fact' || category === 'copyright') return { label: '去资料与素材补充', onClick: () => setStep(2) }
    return { label: '去内容概览调整', onClick: () => setStep(3) }
  }

  const assistantQuickActions: AssistantQuickAction[] = []
  let assistantMessage = ''
  switch (step) {
    case 0:
      assistantMessage = briefMissing
        ? `知识检索契约还有 ${briefMissing} 项待补充。补齐后 ResearchAgent 才能确定检索对象、范围和问题。`
        : '知识检索契约已经完整；标题、指标、CTA 等灵活字段可采用 Agent 建议。确认后进入渠道与发布目标。'
      assistantQuickActions.push({ label: '确认检索契约，进入渠道设置', onClick: () => setStep(1), disabled: briefMissing > 0 })
      break
    case 1: {
      // 步骤② 渠道与发布目标
      const localeReady = true
      const fieldReady = allFieldsFilled
      if (localeReady && fieldReady) {
        assistantMessage = '渠道与发布目标已确认，可以进入资料与素材。'
        assistantQuickActions.push({ label: '确认渠道与发布目标', onClick: confirmChannelProfiles })
      } else {
        assistantMessage = localeReady ? '请先填写完所有已选渠道的定义字段。' : '请先选择本内容要发布的渠道与语言站点。'
      }
      if (taskLocales.length > 0 && termGaps.length > 0) {
        assistantMessage += ` 所选语言站点有 ${termGaps.length} 个专业名词还缺译名。`
        assistantQuickActions.push({ label: '去配置术语与翻译', onClick: () => onOpenGlossary(termGaps) })
      }
      break
    }
    case 2: {
      // 步骤③ 资料与素材：一次性物料预算
      if (budgetMissing.length) {
        assistantMessage = `物料预算已列出本篇内容共需 ${budget.length} 项素材，其中 ${budgetMissing.length} 项待补充/授权。逐项补齐并标记为已就绪后，一次性进入生成。`
        assistantQuickActions.push({ label: budgetMissing.length ? '全部补齐后进入生成' : '执行资料检索并进入生成', onClick: resolveMaterialsAndContinue, disabled: !canRunResearch })
      } else {
        assistantMessage = '物料预算已全部就绪，可以进入内容概览生成。'
        assistantQuickActions.push({ label: '执行资料检索并进入生成', onClick: resolveMaterialsAndContinue, disabled: !canRunResearch })
      }
      if (taskLocales.length > 0 && termGaps.length > 0) {
        assistantMessage += ` 另外有 ${termGaps.length} 个专业名词还缺目标语言译名。`
        assistantQuickActions.push({ label: '去配置术语与翻译', onClick: () => onOpenGlossary(termGaps) })
      }
      break
    }
    case 3:
      if (!task.masterDraft) {
        assistantMessage = '大纲已经可以编辑，确认后一次生成内容概览和所有目标渠道内容。'
        assistantQuickActions.push({ label: '生成内容概览与渠道内容', onClick: () => onGenerateDraft(task.id), disabled: !preGenerationChecks.every((item) => item.pass) })
      } else if (hasDraftGap) {
        assistantMessage = `内容概览已生成，但还有 ${openKnowledgeRisks.length} 处知识库未命中、${termGaps.length} 个术语缺译名，建议先补全再重新生成。`
        assistantQuickActions.push({ label: '补全后重新生成概览', onClick: () => onRegenerateDraft(task.id) })
      } else {
        assistantMessage = '内容概览和全部渠道内容已生成。若预览或表达需要调整，可在本步重新生成整组内容。'
        assistantQuickActions.push({ label: '重新生成整组内容', onClick: () => onRegenerateDraft(task.id) })
      }
      break
    case 4:
      if (verdict === 'block') {
        assistantMessage = `有 ${blockers.length} 项高风险问题需要处理：点击问题卡片上的入口去对应位置修改，处理完成后点击"标记为已处理"确认。`
      } else if (verdict === 'warning') {
        assistantMessage = '合规检查有警告项，人工确认后可以进入渠道内容预览。'
        assistantQuickActions.push({ label: '确认结论，进入内容预览', onClick: () => onIgnoreWarnings(task.id) })
      } else {
        assistantMessage = '质量与合规检查均已通过，可以进入渠道内容预览。'
        assistantQuickActions.push({ label: '进入渠道内容预览', onClick: () => onIgnoreWarnings(task.id) })
      }
      break
    case 5:
      if (!version) {
        assistantMessage = `${CHANNEL_META[channel].label} 缺少可预览内容，请返回内容概览重新执行生成。`
        assistantQuickActions.push({ label: '返回内容概览重新生成', onClick: () => setStep(3) })
      } else {
        assistantMessage = `${CHANNEL_META[channel].label} 内容已通过审核，请检查最终呈现、账号与正文。`
      }
      if (allChannelsVersioned && allPreviewsConfirmed && task.status === 'channel_adaptation') {
        assistantMessage += ' 所有渠道均已逐一确认，可以提交审批。'
        assistantQuickActions.push({ label: '提交审批', onClick: () => onSubmitApproval(task.id) })
      } else if (version && !confirmedChannels.includes(channel)) {
        assistantQuickActions.push({ label: `确认 ${CHANNEL_META[channel].label} 预览`, onClick: () => onConfirmPreview(task.id, channel) })
      }
      break
    case 6:
      assistantMessage = blockers.length ? '还有高风险合规问题未处理，暂不能审批通过。' : '内容概览、渠道版本和合规检查均已完成，满足审批条件。'
      if (blockers.length) assistantQuickActions.push({ label: '去处理合规问题', onClick: () => setStep(4) })
      assistantQuickActions.push({ label: '审批通过并加入排期', onClick: () => onApprove(task.id, scheduledAt), disabled: blockers.length > 0 })
      break
  }

  const agentMeta = (() => {
    if (step === 0) return { name: 'ContentOrchestratorAgent', role: '简报一致性与流程编排', gate: briefMissing ? 'blocked' : 'waiting' }
    if (step === 1) return { name: 'ContentOrchestratorAgent', role: '渠道 Skill / 营销渠道 MCP', gate: allFieldsFilled ? 'passed' : 'blocked' }
    if (step === 2) return { name: 'ResearchAgent + CompletenessAgent', role: '检索取证与生成前完整性门禁', gate: budgetReady && termGaps.length === 0 ? 'passed' : 'blocked' }
    if (step === 3) return { name: 'GenerationAgent + CompletenessAgent', role: '概览与渠道内容生成 / 生成后完整性门禁', gate: !task.masterDraft || !allChannelsVersioned ? 'waiting' : hasDraftGap ? 'blocked' : 'passed' }
    if (step === 4) return { name: 'QualityComplianceAgent', role: 'EEAT 四维 / 九类合规独立审查', gate: verdict === 'block' || task.quality.overall < 60 ? 'blocked' : verdict === 'pass' && task.quality.overall >= 80 ? 'passed' : 'waiting' }
    if (step === 5) return { name: '预览规则引擎 + 人工确认', role: '渠道呈现预览 / 返回重生成 / 提交审批', gate: allChannelsVersioned ? 'waiting' : 'blocked' }
    return { name: '发布规则引擎 + 人工审批', role: '逻辑门禁、排期与 MCP 发布', gate: blockers.length ? 'blocked' : 'waiting' }
  })() as { name: string; role: string; gate: 'working' | 'waiting' | 'passed' | 'blocked' }

  const maxReachableStep = (() => {
    if (isShowcaseTask) return CONTENT_STEPS.length - 1
    if (briefMissing > 0) return 0
    if (!task.channelProfiles?.length || !allFieldsFilled) return 1
    if (!preGenerationChecks.every((item) => item.pass)) return 2
    if (!task.masterDraft || !allChannelsVersioned || hasDraftGap) return 3
    if (verdict === 'block' || task.quality.overall < 60) return 4
    if (!allPreviewsConfirmed) return 5
    return 6
  })()

  const agentRuns: AgentRunItem[] = [
    { name: 'ContentOrchestratorAgent', action: '读取任务状态、校验检索契约并选择下一执行节点', state: briefMissing ? 'blocked' : 'completed', output: briefMissing ? undefined : 'OrchestrationDecision' },
    { name: 'ResearchAgent', action: '按知识范围制定检索计划并形成证据包', state: step < 2 ? 'waiting' : verifiedKnowledge.length ? 'completed' : step === 2 ? 'blocked' : 'waiting', output: verifiedKnowledge.length ? `EvidenceBundle · ${verifiedKnowledge.length} 条来源` : undefined },
    { name: 'CompletenessAgent', action: '执行生成前与生成后完整性门禁', state: step < 2 ? 'waiting' : hasDraftGap || (step === 2 && !preGenerationChecks.every((item) => item.pass)) ? 'blocked' : step >= 3 ? 'completed' : 'running', output: step >= 3 && !hasDraftGap ? 'CompletenessReport' : undefined },
    { name: 'GenerationAgent', action: '一次生成内容概览和全部目标渠道版本', state: step < 3 ? 'waiting' : task.masterDraft && allChannelsVersioned ? 'completed' : step === 3 ? 'running' : 'waiting', output: task.masterDraft ? `OverviewVersion + ${task.channelVersions.length} 个 ChannelVersion` : undefined },
    { name: 'QualityComplianceAgent', action: '独立执行 EEAT 四维质量与九类合规检查', state: step < 4 ? 'waiting' : verdict === 'block' || task.quality.overall < 60 ? 'blocked' : task.quality.overall > 0 ? 'completed' : 'running', output: task.quality.overall > 0 ? `QualityReport · ${task.quality.overall} 分` : undefined },
  ]
  const agentArtifacts: AgentArtifactItem[] = [
    { name: 'ContentBrief', version: briefMissing ? `缺 ${briefMissing} 项` : 'v1 · 已确认', state: briefMissing ? 'invalid' : 'ready' },
    { name: 'EvidenceBundle', version: verifiedKnowledge.length ? `v1 · ${verifiedKnowledge.length} 条` : '待生成', state: verifiedKnowledge.length ? 'ready' : 'pending' },
    { name: 'MaterialBudget', version: budgetReady ? 'v1 · 已就绪' : `${budgetMissing.length} 项待补`, state: budgetReady ? 'ready' : 'invalid' },
    { name: 'OverviewVersion', version: task.masterDraft ? 'v1' : '待生成', state: task.masterDraft ? 'ready' : 'pending' },
    { name: 'ChannelVersion', version: allChannelsVersioned ? `${task.channelVersions.length} 个版本` : '待生成', state: allChannelsVersioned ? 'ready' : 'pending' },
  ]
  const consoleBlockers = [
    ...retrievalContract.filter((item) => !item.pass).map((item) => `任务简报缺少：${item.label}`),
    ...budgetMissing.map((item) => `资料待补：${item.name}`),
    ...(step >= 2 && verifiedKnowledge.length === 0 ? ['尚无可验证的知识来源'] : []),
    ...termGaps.map((item) => `术语缺译名：${item}`),
    ...blockers.map((item) => `合规风险：${item.title}`),
  ].slice(0, 5)

  const retrievalContractForm = <div className="content-brief-form content-brief-essential">
    <div className="content-form-row"><label className="content-form-field"><span>内容类型 *</span><select value={task.type} onChange={(e) => onUpdateBrief(task.id, { type: e.target.value as ContentTask['type'] })}>{Object.entries(TYPE_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><small>决定资料模板与内容结构</small></label><label className="content-form-field"><span>任务类型 *</span><select value={task.kind} onChange={(e) => onUpdateBrief(task.id, { kind: e.target.value as ContentTask['kind'] })}>{Object.entries(KIND_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><small>决定是否先检索已有内容资产</small></label></div>
    <label className="content-form-field"><span>内容对象 *</span><input className="form-input" value={task.contentSubject ?? task.theme} onChange={(e) => onUpdateBrief(task.id, { contentSubject: e.target.value, theme: e.target.value })} placeholder="具体产品、服务、方案、场景或主题" /><small>作为知识库实体、关键词与资产归类依据</small></label>
    <label className="content-form-field"><span>允许检索的知识范围 *</span><div className="content-knowledge-scope-picker is-compact">{(Object.entries(KNOWLEDGE_SCOPE_LABELS) as [ContentKnowledgeScope, string][]).map(([scope, label]) => <button key={scope} type="button" className={task.knowledgeScopes?.includes(scope) ? 'is-active' : ''} onClick={() => toggleKnowledgeScope(scope)}><b>{label}</b></button>)}</div><small>至少选择一个；Agent 不会擅自扩大到未授权知识域。</small></label>
    <div className="content-form-row"><label className="content-form-field"><span>主要业务目标 *</span><select value={task.businessGoal ?? ''} onChange={(e) => onUpdateBrief(task.id, { businessGoal: e.target.value as NonNullable<ContentTask['businessGoal']> })}><option value="">待确认</option><option value="awareness">教育认知</option><option value="traffic">获取流量</option><option value="decision">辅助决策</option><option value="conversion">线索转化</option><option value="success">客户成功</option><option value="compliance">合规维护</option></select></label><label className="content-form-field"><span>目标受众 *</span><input className="form-input" value={task.audience} onChange={(e) => onUpdateBrief(task.id, { audience: e.target.value })} placeholder="角色 + 场景/阶段" /></label></div>
    <label className="content-form-field"><span>内容必须回答的核心问题 *</span><textarea rows={3} value={task.userQuestion} onChange={(e) => onUpdateBrief(task.id, { userQuestion: e.target.value })} placeholder="一个可被检索、回答和验收的具体问题" /><small>它同时是检索 Query 的来源和内容完整性的验收基准。</small></label>
  </div>

  return <div className="content-workbench">
    <div className="content-workbench__top"><button onClick={onBack}><ArrowLeft size={16} />返回内容计划</button><div><span className={`content-priority is-${task.priority.toLowerCase()}`}>{task.priority}</span><h2>{task.title}</h2><StatusBadge status={task.status} /></div></div>
    <div className="content-workbench__main"><div className="content-workbench__primary">
    {isShowcaseTask && <div className="content-showcase-banner"><Sparkles size={15} /><div><b>演示浏览模式</b><span>可连续点击“下一步”查看完整流程；演示跳转不会绕过其他任务的真实门禁。</span></div><em>{step + 1} / {CONTENT_STEPS.length}</em></div>}
    <div className="content-stepper">{CONTENT_STEPS.map((label, index) => <button key={label} disabled={index > maxReachableStep} title={index > maxReachableStep ? '需先通过前置门禁' : undefined} className={`${step === index ? 'is-active' : ''} ${index < step ? 'is-done' : ''}`} onClick={() => setStep(index)}><span>{index < step ? <Check size={13} /> : index + 1}</span><b>{label}</b>{index < CONTENT_STEPS.length - 1 && <ChevronRight size={14} />}</button>)}</div>

    <section className="content-workbench__body">
      {step === 0 && <div className="content-brief-layout"><section className="content-panel content-brief-panel"><div className="content-brief-title"><div><span className="content-eyebrow">CONTENT BRIEF · STEP 1</span><h3>确认任务简报</h3><p className="content-panel__desc">先确认知识检索所需的信息；资料检索会在七项契约完整后启动。</p></div><Button size="sm" disabled={briefMissing > 0} onClick={() => setStep(1)}>{briefMissing ? `还差 ${briefMissing} 项` : '进入渠道设置'}<ChevronRight size={14} /></Button></div>{task.origin && <div className="content-origin-card"><div className="content-origin-card__head"><OriginBadge source={task.origin.source} /><b>{task.origin.sourceLabel}</b></div>{task.origin.evidence && <div className="content-origin-evidence"><span>{task.origin.evidence.currentValue}</span><i>→</i><span>{task.origin.evidence.action}</span></div>}{task.origin.attributionRef && <small>复盘周期 {task.origin.attributionRef.reviewPeriod} · 关联归因分析</small>}</div>}
        <div className={`content-brief-gate ${briefMissing ? 'is-blocked' : 'is-ready'}`}><div><span className="content-brief-gate__icon">{briefMissing ? <CircleAlert size={16} /> : <Check size={16} />}</span><div><b>{briefMissing ? `还有 ${briefMissing} 项信息待补充` : '7 项检索条件已完整'}</b><p>{briefMissing ? '补齐后才会调用知识库，避免无边界搜索。' : 'ResearchAgent 已可按明确对象、范围、受众和问题构建检索计划。'}</p></div></div><div className="content-brief-gate__count">{7 - briefMissing}/7</div></div>
        {task.origin?.context && briefMissing === 0 ? <><div className="content-imported-contract-summary"><div><Sparkles size={16} /><span><b>诊断上下文已映射完成</b><small>{task.origin.context.sections.length} 个动态分组 · {task.origin.context.sections.reduce((sum, section) => sum + section.items.length, 0)} 个来源字段 · 原始 JSON 已保留</small></span></div><dl><div><dt>内容对象</dt><dd>{task.contentSubject || task.theme}</dd></div><div><dt>受众</dt><dd>{task.audience}</dd></div><div><dt>核心问题</dt><dd>{task.userQuestion}</dd></div></dl></div><details className="content-brief-advanced"><summary>查看或修正映射后的检索契约 <span>通常无需逐项填写</span></summary>{retrievalContractForm}</details></> : <div className="content-required-section"><div className="content-required-section__head"><div><b>知识检索契约 · 7 项必需信息</b><span>决定查什么、去哪里查，以及如何验收资料完整性。</span></div><em>{briefMissing ? `${briefMissing} 项待补充` : '已完整'}</em></div>{retrievalContractForm}</div>}

        <details className="content-brief-advanced content-brief-optional"><summary>创作建议（可选） <span>标题、表达、指标、边界、负责人和排期</span></summary><div className="content-agent-derived"><div className="content-agent-derived__head"><div><Sparkles size={15} /><b>Agent 已补全的创作方向</b></div><span>{TYPE_LABEL[task.type]}</span></div><dl><div><dt>核心表达</dt><dd>{task.coreMessage || '将在资料检索后进一步明确'}</dd></div><div><dt>期望行动</dt><dd>{task.desiredAction || '继续了解相关内容'}</dd></div><div><dt>成功标准</dt><dd>{task.successMetric || '发布后根据渠道目标自动设置'}</dd></div></dl></div>

        <div className="content-brief-form">
          <label className="content-form-field"><span>工作标题</span><input className="form-input" value={task.title} onChange={(e) => onUpdateBrief(task.id, { title: e.target.value })} /></label>
          <label className="content-form-field"><span>核心主张</span><textarea rows={2} value={task.coreMessage ?? ''} onChange={(e) => onUpdateBrief(task.id, { coreMessage: e.target.value })} /></label>
          <div className="content-form-row"><label className="content-form-field"><span>成功指标</span><input value={task.successMetric ?? ''} onChange={(e) => onUpdateBrief(task.id, { successMetric: e.target.value })} /></label><label className="content-form-field"><span>期望用户行动</span><input value={task.desiredAction ?? ''} onChange={(e) => onUpdateBrief(task.id, { desiredAction: e.target.value })} /></label></div>
          <label className="content-form-field"><span>任务依据 / 补充背景</span><textarea rows={3} value={task.reason} onChange={(e) => onUpdateBrief(task.id, { reason: e.target.value })} /></label>
          <div className="content-form-row"><label className="content-form-field"><span>必须包含</span><input value={task.mustInclude ?? ''} onChange={(e) => onUpdateBrief(task.id, { mustInclude: e.target.value })} /></label><label className="content-form-field"><span>禁止出现</span><input value={task.mustAvoid ?? ''} onChange={(e) => onUpdateBrief(task.id, { mustAvoid: e.target.value })} /></label></div>
          <div className="content-form-row"><label className="content-form-field"><span>负责人</span><input value={task.owner ?? ''} onChange={(e) => onUpdateBrief(task.id, { owner: e.target.value })} /></label><label className="content-form-field"><span>计划时间</span><input type="date" className="form-input" value={task.dueDate} onChange={(e) => onUpdateBrief(task.id, { dueDate: e.target.value })} /></label></div>
        </div></details>
        <div className="content-brief-next"><span>下一步：确认发布渠道与语言站点</span><div className="content-channel-stack">{task.channels.map((item) => <ChannelBadge key={item} channel={item} />)}</div></div>
      </section></div>}

      {step === 1 && <div className="content-workbench-grid"><div className="content-panel"><span className="content-eyebrow">TARGET CHANNELS</span><h3>发布渠道</h3><p className="content-panel__desc">主 Agent 从营销渠道配置读取可用渠道；选择一个或多个正式发布目标。更改渠道会使该渠道的资料需求与生成版本重新计算。</p><div className="content-target-channel-picker">{(Object.keys(CHANNEL_META) as ContentChannel[]).map((item) => <button type="button" key={item} className={task.channels.includes(item) ? 'is-active' : ''} onClick={() => toggleTargetChannel(item)}><ChannelBadge channel={item} /><small>{task.channels.includes(item) ? '已选择' : '可用'}</small></button>)}</div><div className="content-note"><Sparkles size={16} /><p>先确认发布渠道与语言站点，再进入资料与素材——发布到哪些站点决定了需要哪些术语译名和素材。</p></div>
        <div className="content-locale-select"><span className="content-eyebrow">LOCALE TARGETS</span><h3>语言站点</h3><p className="muted">选择要发布到的语言站点（留空表示仅中文站）。</p><div className="content-locale-chips">{locales.map((locale) => <button key={locale.code} type="button" className={`${selectedLocaleCodes.includes(locale.code) ? 'is-active' : ''}`} onClick={() => toggleLocale(locale.code)}>{locale.label}<small>{locale.site}</small></button>)}</div>{selectedLocaleCodes.length > 0 && termGaps.length > 0 && <div className="content-term-gap-tags" style={{ marginTop: 10 }}>{termGaps.map((item) => <em key={item}>{item} 缺译名</em>)}</div>}</div>
      </div>
        <div className="content-panel content-channel-fields-panel"><span className="content-eyebrow">CHANNEL FIELDS</span><h3>渠道定义字段</h3><div className="content-channel-fields-list">{task.channels.map((ch) => <div key={ch} className="content-channel-fields-card"><div className="content-channel-fields-card__head"><ChannelBadge channel={ch} /></div>{CHANNEL_FIELD_DEFS[ch].map((field) => <label key={field.key} className="content-form-field"><span>{field.label}<small>{field.source}</small></span><input className="form-input" value={fieldValues[ch]?.[field.key] ?? ''} onChange={(e) => updateField(ch, field.key, e.target.value)} /></label>)}</div>)}</div>
          <Button block disabled={!allFieldsFilled} onClick={confirmChannelProfiles}>确认渠道与发布目标，进入资料与素材</Button>
        </div></div>}

      {step === 2 && <div className="content-workbench-grid"><div className="content-panel"><div className="content-panel__head"><div><span className="content-eyebrow">MATERIAL BUDGET</span><h3>一次性物料预算</h3></div><span className={`content-material-count ${budgetReady ? 'is-ready' : ''}`}>{budgetReady ? '全部就绪' : `${budgetMissing.length}/${budget.length} 待补充`}</span></div><p className="content-panel__desc">ResearchAgent 已按内容类型「{TYPE_LABEL[task.type]}」与目标站点制定检索计划；CompletenessAgent 会在生成前独立检查前置条件。每一项可追溯到模板来源，生成过程暴露的新缺口也统一归入此处。</p><div className="content-gate-block"><div className="content-gate-block__head"><div><span className="content-eyebrow">PRE-GENERATION GATE</span><h3>CompletenessAgent · 生成前门禁</h3></div><ReviewVerdictBadge verdict={preGenerationChecks.every((item) => item.pass) ? 'pass' : 'block'} /></div><div className="content-gate-checklist">{preGenerationChecks.map((item) => <span key={item.label} className={item.pass ? 'is-pass' : 'is-block'}>{item.pass ? <Check size={12} /> : <CircleAlert size={12} />}{item.label}</span>)}</div></div><div className="content-material-list">{budget.map((item) => { const prepared = preparedMaterialIds.includes(item.id); return <article key={item.id} className={`is-${item.status} ${item.addedDuringGeneration ? 'is-added' : ''} ${prepared ? 'is-prepared' : ''}`}><span className="content-material-state">{item.status === 'ready' ? <Check size={13} /> : item.status === 'pending_auth' ? <ShieldAlert size={13} /> : <CircleAlert size={13} />}</span><div><b>{item.name}</b><small>{prepared ? '已从知识库返回，等待重新检查' : item.note}</small>{item.knowledgeTarget && <em className="content-material-target">{item.knowledgeTarget.knowledgeBaseType} / {item.knowledgeTarget.primaryCategory} / {item.knowledgeTarget.secondaryCategory}</em>}</div><MaterialBudgetStatusBadge status={item.status} />{item.status !== 'ready' && <div className="content-material-actions"><Button size="sm" variant="secondary" onClick={() => setKnowledgeModalItem(item)}><ExternalLink size={12} />去知识库完善</Button><Button size="sm" disabled={!prepared} onClick={() => markMaterialsChecked([item.id])}><RefreshCw size={12} />重新检查</Button></div>}</article> })}</div>{budgetMissing.length > 0 && <Button block variant="secondary" disabled={preparedMaterialIds.length === 0} onClick={() => markMaterialsChecked(preparedMaterialIds)}><RefreshCw size={14} />重新检查已完善资料</Button>}<Button block disabled={!canRunResearch} onClick={resolveMaterialsAndContinue}>{canRunResearch ? '执行资料检索，通过后进入内容概览生成' : `还有 ${preGenerationChecks.filter((item) => !item.pass && item.label !== '知识来源可验证').length} 项前置条件待处理`}</Button></div><div className="content-panel"><span className="content-eyebrow">KNOWLEDGE REFERENCES</span><h3>知识库调用结果</h3><div className="content-reference-list">{task.knowledge.length ? task.knowledge.map((ref) => <div key={ref.id}><span className={ref.verified ? 'is-verified' : ''}>{ref.verified ? <Check size={12} /> : '!'}</span><p><b>{ref.title}</b><small>{ref.category} · {ref.source}</small></p></div>) : <p className="muted">ResearchAgent 将先定位知识库目录，再调用检索 Tool；无命中时会给出缺少的知识类型与建议位置。</p>}</div>
        {taskKnowledgeRisks.length > 0 && <div className="content-knowledge-risk-panel"><div className="content-panel__head"><div><span className="content-eyebrow">RAG RISK TRACE</span><h3>知识库调用风险</h3></div><span className="content-risk-summary has-risk">{taskKnowledgeRisks.length} 条</span></div><div className="content-knowledge-risk-list">{taskKnowledgeRisks.map((risk) => <article key={risk.id} className={`is-${risk.level}`}><div className="content-knowledge-risk-list__head"><KnowledgeRiskBadge level={risk.level} /><span className={`content-knowledge-risk-status is-${risk.status}`}>{KNOWLEDGE_RISK_STATUS_LABEL[risk.status]}</span></div><b>{risk.issueType}</b><p>{risk.diagnosis}</p><small>{KNOWLEDGE_RISK_SOURCE_LABEL} · {risk.occurredAt}</small></article>)}</div></div>}
      </div><div className="content-panel"><span className="content-eyebrow">TERM & LOCALE</span><h3>术语与多语言</h3>{taskLocales.length > 0 ? <div className={`content-locale-notice ${termGaps.length ? 'is-warning' : 'is-ready'}`}>
          <div className="content-locale-notice__head"><Globe size={16} /><b>本内容将发布到多语言站点</b></div>
          <div className="content-locale-notice__sites">{taskLocales.map((locale) => <span key={locale.code}>{locale.label}<small>{locale.site}</small></span>)}</div>
          {termGaps.length ? <>
            <p>以下 {termGaps.length} 个专业名词在术语库中尚未配齐对应语言的译名，直接发布会在外语站保留中文原词：</p>
            <div className="content-term-gap-tags">{termGaps.map((item) => <em key={item}>{item}</em>)}</div>
            <Button size="sm" onClick={() => onOpenGlossary(termGaps)}><Languages size={13} />去配置术语与翻译</Button>
          </> : <>
            <p>目标语言站点涉及的专业名词译名已全部配置完成。</p>
            <Button size="sm" variant="secondary" onClick={() => onOpenGlossary([])}><Languages size={13} />查看术语与翻译</Button>
          </>}
        </div> : <p className="muted">本内容仅发布中文站，无需多语言术语配置。</p>}
      </div></div>}

      {step === 3 && <div className="content-draft-layout"><aside className="content-outline"><span className="content-eyebrow">OUTLINE</span><h3>内容大纲</h3><div className="content-outline-list">{task.outline.map((item, index) => <div key={index} className="content-outline-item"><span>{String(index + 1).padStart(2, '0')}</span><input value={item} placeholder="大纲内容" onChange={(e) => updateOutlineItem(index, e.target.value)} /><div className="content-outline-item__actions"><button title="上移" disabled={index === 0} onClick={() => moveOutlineItem(index, -1)}><ChevronUp size={13} /></button><button title="下移" disabled={index === task.outline.length - 1} onClick={() => moveOutlineItem(index, 1)}><ChevronDown size={13} /></button><button title="删除" onClick={() => removeOutlineItem(index)}><Trash2 size={13} /></button></div></div>)}</div><button className="content-outline-add" onClick={addOutlineItem}><Plus size={13} />新增大纲项</button></aside><div className="content-editor"><div className="content-editor__head"><div><span className="content-eyebrow">CONTENT OVERVIEW</span><h3>内容概览</h3></div><div><Button size="sm" variant="secondary">调整语气</Button><Button size="sm" onClick={() => onRegenerateDraft(task.id)}><Sparkles size={14} />重新生成整组内容</Button></div></div>
        <div className="content-editor__canvas"><h1>{task.title}</h1>{task.masterDraft ? task.masterDraft.split('\n\n').map((p) => <p key={p}>{p}</p>) : <div className="content-generating-state"><Sparkles size={30} /><b>等待生成内容概览</b><span>将基于已确认大纲、知识资料、渠道字段与对应渠道 Skill，一次生成概览和各渠道内容</span><Button disabled={!preGenerationChecks.every((item) => item.pass)} onClick={() => onGenerateDraft(task.id)}>生成内容概览与渠道内容</Button></div>}</div></div>
        <aside className="content-knowledge-sidebar">
          <div className="content-knowledge-sidebar__section"><span className="content-eyebrow">USED KNOWLEDGE</span><h3>已采用知识依据</h3>{verifiedKnowledge.length ? <div className="content-reference-list">{verifiedKnowledge.map((ref) => <div key={ref.id}><span className="is-verified"><Check size={12} /></span><p><b>{ref.title}</b><small>{ref.category} · {ref.source}</small></p></div>)}</div> : <p className="muted">暂无知识库引用。</p>}</div>
          <div className="content-knowledge-sidebar__section">
            <span className="content-eyebrow">POST-GENERATION GATE</span><h3>CompletenessAgent · 生成后门禁</h3><p className="content-panel__desc">独立检查核心问题是否回答、必含项是否覆盖、关键声明是否有来源，以及是否存在占位符、冲突或越界主张。</p>
            {hasDraftGap ? <div className="content-draft-gap">
              <div className="content-draft-gap__head"><AlertTriangle size={17} /><div><b>存在知识缺口</b><p>以下问题已在生成过程中暴露，建议先到知识库补全资料与译名，再重新生成概览。</p></div></div>
              <div className="content-draft-gap__body">
                {openKnowledgeRisks.length > 0 && <section>
                  <b>知识库未命中（RAG no-hit）· {openKnowledgeRisks.length} 处</b>
                  <ul>{openKnowledgeRisks.map((risk) => <li key={risk.id}><KnowledgeRiskBadge level={risk.level} /><span><em>{risk.issueType}</em>{risk.diagnosis}</span></li>)}</ul>
                  <Button size="sm" variant="secondary" onClick={onOpenKnowledgeRisks}>查看风险样本</Button>
                </section>}
                {termGaps.length > 0 && <section>
                  <b>专业名词缺少译名 · {termGaps.length} 个</b>
                  <div className="content-term-gap-tags">{termGaps.map((item) => <em key={item}>{item}</em>)}</div>
                  <Button size="sm" variant="secondary" onClick={() => onOpenGlossary(termGaps)}><Languages size={13} />去术语库补全译名</Button>
                </section>}
              </div>
              {task.masterDraft && <div className="content-draft-gap__foot"><Button size="sm" onClick={() => onRegenerateDraft(task.id)}><RefreshCw size={13} />补全后重新生成概览</Button><span>重新生成会基于最新知识库与术语库内容覆盖当前概览。</span></div>}
            </div> : <div className="content-empty-success"><FileCheck2 size={22} /><b>知识库资料已覆盖本次概览</b><span>未发现未命中或缺译名的问题</span></div>}
          </div>
        </aside></div>}

      {step === 4 && <div className="content-review-grid"><section className="content-panel content-score-panel"><div><span className="content-eyebrow">QUALITY SCORE</span><h3>有证据的 EEAT 四维质量评分</h3><p className="content-panel__desc">审查对象包含内容概览及第 4 步生成的所有渠道内容。每个维度同时返回得分、检查依据和可执行修改建议。</p></div><QualityRing score={task.quality.overall} /><div className="content-quality-audit">{qualityAudit.map((item) => { const rate = item.max ? item.value / item.max : 0; return <article key={item.label} className={rate >= .8 ? 'is-good' : rate >= .6 ? 'is-warning' : 'is-danger'}><div><b>{item.label}</b><strong>{item.value}<small>/{item.max}</small></strong></div><i><span style={{ width: `${rate * 100}%` }} /></i><p><em>检查依据</em>{item.evidence}</p>{rate < .8 && <p><em>修改建议</em>{item.suggestion}</p>}</article> })}</div><div className="content-geo-check"><div className="content-panel__head"><div><span className="content-eyebrow">GEO CHECK</span><h3>GEO 适配检查（4 项量化）</h3><p className="content-panel__desc">让内容易被 AI 搜索摘引推荐；逐项过 / 不过，缺项 → 自动补 FAQ 或提示人补。</p></div></div><div className="content-geo-grid">{geoChecks.map((g) => <div key={g.n} className={`content-geo-item ${g.pass ? 'is-pass' : 'is-fail'}`}><span className="content-geo-item__tag">{g.n}</span><div><b>{g.name}</b><p>{g.rule}</p></div><em>{g.pass ? '过' : '不过'}</em></div>)}</div></div><div className={`content-review-decision ${task.quality.overall >= 80 && verdict === 'pass' ? 'is-pass' : task.quality.overall < 60 || verdict === 'block' ? 'is-block' : 'is-revise'}`}><b>{task.quality.overall >= 80 && verdict === 'pass' ? 'PASS · 可进入渠道预览' : task.quality.overall < 60 || verdict === 'block' ? 'BLOCK · 必须回退处理' : 'REVISE · 修改后人工确认'}</b><span>阈值：80+ 通过；60–79 修改；&lt;60 阻断。专业（参数正确）或可信（事实来源）维度过低也单独阻断。</span></div>{task.quality.overall < 80 && <div className="content-quality-hint"><AlertTriangle size={15} /><p>质量尚未达到自动通过标准，建议按上方修改建议返回第 4 步重新生成并重新审查。</p><Button size="sm" variant="secondary" onClick={() => setStep(3)}>返回内容概览重新生成</Button></div>}</section><section className="content-panel"><div className="content-panel__head"><div><span className="content-eyebrow">COMPLIANCE REVIEW</span><h3>九类合规检查</h3><p className="content-panel__desc">事实、品牌、版权、客户隐私、行业、广告、平台、地区语言与 AI 标识独立于质量分执行门禁。</p></div><ReviewVerdictBadge verdict={verdict} /></div><div className="content-redline-ref"><div className="content-panel__head"><div><span className="content-eyebrow">HARD RED LINES</span><h3>风险红线 6 条（命中即退回，不破例）</h3><p className="content-panel__desc">与九类合规并行；下列任一命中即自动退回重写，任何策略下不兜底放行。</p></div></div><div className="content-redline-list">{HARD_RED_LINES.map((r) => <div key={r.label} className="content-redline-item"><b>{r.label}</b><span>{r.rule}</span><em className={r.auto === 'auto' ? 'is-auto' : 'is-manual'}>{r.auto === 'auto' ? '✅ 能自动' : '🟡 部分 · ' + r.note}</em></div>)}</div></div><div className="content-compliance-list">{task.compliance.length ? task.compliance.map((issue) => { const action = getComplianceAction(issue.category); return <article key={issue.id} className={`is-${issue.level} ${issue.resolved ? 'is-resolved' : ''}`}><span>{issue.resolved ? <Check size={14} /> : '!'}</span><div><b>{issue.title}</b><p>{issue.detail}</p><small>{issue.category} · {issue.level}</small><div className="content-compliance-list__actions">{issue.resolved ? <button className="content-compliance-list__undo" onClick={() => onToggleComplianceIssue(task.id, issue.id)}>撤销</button> : <><Button size="sm" variant="secondary" onClick={action.onClick}>{action.label}</Button><Button size="sm" onClick={() => onToggleComplianceIssue(task.id, issue.id)}>标记为已处理</Button></>}</div></div></article> }) : <div className="content-empty-success"><FileCheck2 size={28} /><b>未发现合规风险</b><span>可进入渠道内容预览与发布流程</span></div>}</div>{verdict === 'block' || task.quality.overall < 60 ? <Button block disabled>质量或合规门禁未通过，请按问题类型回退处理</Button> : <Button block variant={verdict === 'warning' || task.quality.overall < 80 ? 'secondary' : 'primary'} onClick={() => onIgnoreWarnings(task.id)}>{verdict === 'warning' || task.quality.overall < 80 ? '人工确认修改结论，进入渠道内容预览' : '质量与合规通过，进入渠道内容预览'}</Button>}</section></div>}

      {step === 5 && <div className="content-channel-editor"><div className="content-channel-editor__tabs">{task.channels.map((item) => <button key={item} className={`${channel === item ? 'is-active' : ''} ${confirmedChannels.includes(item) ? 'is-confirmed' : ''}`} onClick={() => setChannel(item)}><ChannelBadge channel={item} />{confirmedChannels.includes(item) && <Check size={12} />}</button>)}</div><div className="content-channel-preview"><div className="content-channel-preview__meta"><span style={{ background: CHANNEL_META[channel].color }}>{CHANNEL_META[channel].short}</span><div><b>{CHANNEL_META[channel].label}</b><small>{version?.account ?? '缺少发布账号'}</small></div><em>{version ? confirmedChannels.includes(channel) ? '已人工确认' : '审核通过 · 待确认' : '预览不可用'}</em></div>{version ? <div className="content-channel-preview__result"><h2>{version.title}</h2><div className="content-channel-preview__body">{version.body.split('\n').map((line, index) => line ? <p key={`${line}-${index}`}>{line}</p> : null)}</div><div className="content-preview-placeholder">视觉素材与最终渠道呈现预览</div></div> : <div className="content-generating-state"><CircleAlert size={30} /><b>第 4 步未产出该渠道内容</b><span>请返回内容概览，重新执行整组内容生成。</span><Button onClick={() => setStep(3)}>返回内容概览重新生成</Button></div>}</div><div className="content-preview-actions"><Button variant="secondary" onClick={() => setStep(3)}>预览有问题，返回重新生成</Button>{version && !confirmedChannels.includes(channel) && <Button onClick={() => onConfirmPreview(task.id, channel)}><Check size={15} />确认当前渠道</Button>}{allChannelsVersioned && allPreviewsConfirmed && task.status === 'channel_adaptation' && <Button onClick={() => onSubmitApproval(task.id)}><Send size={15} />全部确认，提交审批</Button>}</div></div>}

      {step === 6 && <div className="content-approval-layout"><section className="content-panel"><span className="content-eyebrow">APPROVAL</span><h3>审批状态</h3><div className="content-approval-card"><span className={blockers.length ? 'is-blocked' : 'is-ready'}>{blockers.length ? '!' : <Check size={18} />}</span><div><b>{blockers.length ? '尚未满足发布条件' : '内容已满足审批条件'}</b><p>{blockers.length ? '请先处理高风险合规问题。' : '内容概览、渠道版本和合规检查均已完成。'}</p>{blockers.length > 0 && <Button size="sm" variant="secondary" onClick={() => setStep(4)}>去处理合规问题</Button>}</div></div><dl className="content-detail-list"><div><dt>审批人</dt><dd>张敏 · 市场运营</dd></div><div><dt>发布模式</dt><dd>人工审核</dd></div><div><dt>发布渠道</dt><dd>{task.channels.length} 个</dd></div></dl></section><section className="content-panel"><span className="content-eyebrow">SCHEDULE</span><h3>发布配置</h3><label className="content-form-field"><span>发布时间</span><input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} /></label><label className="content-form-field"><span>失败策略</span><select value={failStrategy} onChange={(e) => setFailStrategy(e.target.value as 'continue' | 'stop')}><option value="continue">其他渠道继续发布</option><option value="stop">任一失败则停止整组</option></select></label><Button block disabled={blockers.length > 0} onClick={() => onApprove(task.id, scheduledAt)}><Send size={15} />审批通过并加入排期</Button></section></div>}
      {isShowcaseTask && <div className="content-showcase-navigation"><div><span>演示步骤</span><b>{step + 1}. {CONTENT_STEPS[step]}</b></div><div><Button variant="secondary" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}><ArrowLeft size={14} />上一步</Button><Button onClick={() => step < CONTENT_STEPS.length - 1 ? setStep((current) => current + 1) : onBack()}>{step < CONTENT_STEPS.length - 1 ? <>下一步<ChevronRight size={14} /></> : <>完成演示<Check size={14} /></>}</Button></div></div>}
    </section>
    </div>
    <ContentAssistantPanel step={step} message={assistantMessage} quickActions={assistantQuickActions} agentName={agentMeta.name} agentRole={agentMeta.role} gateState={agentMeta.gate} runs={agentRuns} artifacts={agentArtifacts} blockers={consoleBlockers} />
    </div>
    {knowledgeModalItem && <div className="content-knowledge-modal-root" role="dialog" aria-modal="true" aria-labelledby="content-knowledge-modal-title">
      <button className="content-knowledge-modal-mask" aria-label="关闭弹窗" onClick={() => setKnowledgeModalItem(null)} />
      <section className="content-knowledge-modal">
        <div className="content-knowledge-modal__head"><div><span className="content-eyebrow">KNOWLEDGE DESTINATION</span><h3 id="content-knowledge-modal-title">前往知识库完善资料</h3></div><button aria-label="关闭" onClick={() => setKnowledgeModalItem(null)}>×</button></div>
        <div className="content-knowledge-modal__material"><Library size={18} /><div><b>{knowledgeModalItem.name}</b><small>请在下方指定位置补充可验证、已授权的资料</small></div></div>
        {knowledgeModalItem.knowledgeTarget && <div className="content-knowledge-modal__route">
          <span><small>知识库</small><b>{knowledgeModalItem.knowledgeTarget.directoryName}</b></span><ChevronRight size={15} />
          <span><small>资料类型</small><b>{knowledgeModalItem.knowledgeTarget.knowledgeBaseType}</b></span><ChevronRight size={15} />
          <span><small>分类</small><b>{knowledgeModalItem.knowledgeTarget.primaryCategory}{knowledgeModalItem.knowledgeTarget.secondaryCategory ? ` / ${knowledgeModalItem.knowledgeTarget.secondaryCategory}` : ''}</b></span>
        </div>}
        <div className="content-knowledge-modal__query"><span>建议检索 / 新建标题</span><code>{knowledgeModalItem.knowledgeTarget?.query ?? knowledgeModalItem.name}</code></div>
        <p className="content-knowledge-modal__hint">当前原型不实现知识库页面。点击“完成并返回”仅模拟资料已在指定位置完善；返回后仍需点击“重新检查”，检查通过后才会解除生成门禁。</p>
        <div className="content-knowledge-modal__foot"><Button variant="secondary" onClick={() => setKnowledgeModalItem(null)}>取消</Button><Button onClick={completeKnowledgeModal}>完成并返回</Button></div>
      </section>
    </div>}
  </div>
}
