import { Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/Button'
import type { ContentChannel, ContentKnowledgeScope, ContentSourceContext, ContentTask, ContentTaskKind, ContentTaskSource, ContentType } from '../../types'
import { KIND_LABEL, TYPE_LABEL } from './ContentPrimitives'

export interface ContentCreatePayload {
  demandSource: ContentTaskSource
  title: string
  type: ContentType
  kind: ContentTaskKind
  priority: 'P0' | 'P1' | 'P2'
  channels: ContentChannel[]
  theme: string
  contentSubject: string
  knowledgeScopes: ContentKnowledgeScope[]
  audience: string
  userQuestion: string
  businessGoal: NonNullable<ContentTask['businessGoal']>
  successMetric: string
  coreMessage: string
  desiredAction: string
  journeyStage: NonNullable<ContentTask['journeyStage']>
  mustInclude: string
  mustAvoid: string
  owner: string
  dueDate: string
  reason: string
  locales?: string[]
  sourceContext?: ContentSourceContext
}

const SOURCE_PRESETS = [
  { id: 'attribution', label: '诊断报告 / 归因措施', reason: '来自诊断报告中已确认执行的内容措施；创建后保留现状、基准、动作与复盘周期。' },
  { id: 'opportunity', label: '内容洞察 / 计划项', reason: '来自内容盘点、阅读表现或多渠道效果洞察，已采纳并转入生产。' },
  { id: 'manual', label: '用户主动创建', reason: '由运营人员根据业务目标主动提出内容需求。' },
] as const

const BUSINESS_GOALS: Record<NonNullable<ContentTask['businessGoal']>, string> = {
  awareness: '教育认知', traffic: '获取流量', decision: '辅助决策', conversion: '线索转化', success: '客户成功', compliance: '合规维护',
}

const GOAL_DEFAULTS: Record<NonNullable<ContentTask['businessGoal']>, { metric: string; action: string; stage: NonNullable<ContentTask['journeyStage']>; audience: string }> = {
  awareness: { metric: '有效阅读率 ≥ 55%', action: '继续阅读相关主题内容', stage: 'discover', audience: '正在了解该主题的潜在用户' },
  traffic: { metric: '自然搜索有效访问持续增长', action: '进入相关产品或方案页面', stage: 'evaluate', audience: '通过搜索寻找解决办法的用户' },
  decision: { metric: '内容辅助咨询或选型判断', action: '查看资料或咨询专业方案', stage: 'compare', audience: '正在比较方案的业务与技术决策者' },
  conversion: { metric: '咨询 CTA 点击率 ≥ 3%', action: '提交需求或预约咨询', stage: 'decide', audience: '已有明确需求的采购决策者' },
  success: { metric: '问题解决率与内容完成率提升', action: '按照指引完成下一步操作', stage: 'use', audience: '正在使用产品或服务的客户' },
  compliance: { metric: '风险内容完成更新并通过复核', action: '查看最新规范或更新说明', stage: 'use', audience: '受规则更新影响的客户与内部人员' },
}

export const KNOWLEDGE_SCOPE_OPTIONS: { id: ContentKnowledgeScope; label: string; description: string }[] = [
  { id: 'company', label: '企业资料', description: '资质、品牌、公司事实' },
  { id: 'product', label: '产品资料', description: '参数、能力、型号与边界' },
  { id: 'service', label: '服务与方案', description: '交付范围、流程与承诺' },
  { id: 'case', label: '案例证据', description: '客户案例、结果与授权' },
  { id: 'industry', label: '行业知识', description: '场景、标准与专业方法' },
]

const DEFAULT_SCOPES: Record<ContentType, ContentKnowledgeScope[]> = {
  product: ['product', 'company'], solution: ['service', 'product', 'case'], scenario: ['industry', 'product', 'case'],
  case: ['case', 'product'], guide: ['industry', 'product'], faq: ['product', 'service'], insight: ['industry', 'company'],
}

const DIAGNOSIS_CONTEXT: ContentSourceContext = {
  schemaVersion: '1.0', mapperVersion: 'diagnosis-content-adapter/1.0', sourceType: 'attribution', sourceRef: 'diagnosis-natural-search-2026w31', receivedAt: '2026-08-05T10:00:00+08:00',
  rawPayload: {
    change: '自然搜索访问量连续两周下降', funnelStage: '渠道到达',
    affectedKeywords: ['aluminum CNC', 'custom CNC parts', 'CNC China'],
    rootCause: { description: '新内容发布不足，既有文章缺少更新，关键词排名持续下降', confidence: 'medium' },
    taskType: '建立持续内容发布计划', target: '围绕下降关键词按固定节奏发布资讯',
    requirements: {
      topic: '面向海外代工采购的铝合金与定制 CNC 内容',
      keywords: ['aluminum CNC', 'custom CNC parts', 'CNC machining China', 'small batch CNC', 'precision CNC parts', 'CNC prototyping', 'OEM machining', 'CNC enclosure machining'],
      cadence: { interval: 7, unit: 'day', amount: 1 }, channel: '英文主站',
      writingGuidance: ['轮换工艺说明、采购注意点、应用场景', '避免每篇内容都采用硬广表达'],
      taskRelationship: '本任务管理长期周更；紧急关键词另建生成并发布单篇内容任务',
    },
  },
  sections: [
    { key: 'diagnosis', label: '诊断依据', items: [
      { key: 'change', label: '本期变化', value: '自然搜索访问量连续两周下降', valueType: 'text', sourcePath: '$.change', semanticRole: 'change_signal', confidence: 1 },
      { key: 'funnel_stage', label: '漏斗环节', value: '渠道到达', valueType: 'text', sourcePath: '$.funnelStage', semanticRole: 'funnel_stage', confidence: 1 },
      { key: 'affected_keywords', label: '受影响关键词', value: ['aluminum CNC', 'custom CNC parts', 'CNC China'], valueType: 'list', sourcePath: '$.affectedKeywords', semanticRole: 'diagnosis_entities', confidence: 1 },
      { key: 'root_cause', label: '对应根因', value: '内容发布和更新不足', valueType: 'text', sourcePath: '$.rootCause.description', semanticRole: 'root_cause', confidence: 0.72 },
    ] },
    { key: 'task', label: '任务意图', items: [
      { key: 'execution_mode', label: '执行方式', value: 'recurring_series', valueType: 'text', sourcePath: '$.taskType', semanticRole: 'execution_mode', confidence: 0.95 },
      { key: 'task_target', label: '目标对象', value: '围绕下降关键词按固定节奏发布资讯', valueType: 'text', sourcePath: '$.target', semanticRole: 'task_target', confidence: 1 },
    ] },
    { key: 'requirements', label: '内容要求', items: [
      { key: 'topic', label: '主题', value: '面向海外代工采购的铝合金与定制 CNC 内容', valueType: 'text', sourcePath: '$.requirements.topic', semanticRole: 'content_subject', confidence: 1 },
      { key: 'keywords', label: '关键词', value: ['aluminum CNC', 'custom CNC parts', 'CNC machining China', 'small batch CNC', 'precision CNC parts', 'CNC prototyping', 'OEM machining', 'CNC enclosure machining'], valueType: 'list', sourcePath: '$.requirements.keywords', semanticRole: 'search_keywords', confidence: 1 },
      { key: 'cadence', label: '发布频率', value: { interval: 7, unit: 'day', amount: 1 }, valueType: 'object', sourcePath: '$.requirements.cadence', semanticRole: 'publishing_cadence', confidence: 1 },
      { key: 'channel', label: '建议渠道', value: '英文主站', valueType: 'text', sourcePath: '$.requirements.channel', semanticRole: 'recommended_channel', confidence: 1 },
      { key: 'writing_guidance', label: '写作要求', value: ['轮换工艺说明、采购注意点、应用场景', '避免每篇内容都采用硬广表达'], valueType: 'list', sourcePath: '$.requirements.writingGuidance', semanticRole: 'writing_guidance', confidence: 1 },
      { key: 'task_relationship', label: '任务关系', value: '本任务管理长期周更；紧急关键词另建单篇任务', valueType: 'text', sourcePath: '$.requirements.taskRelationship', semanticRole: 'task_relationship', confidence: 1 },
    ] },
  ],
  mappedContractKeys: ['taskKind', 'contentType', 'contentSubject', 'knowledgeScopes', 'businessGoal', 'audience', 'userQuestion'], missingContractKeys: [],
}

export function ContentCreateDrawer({ onClose, onSubmit }: { onClose: () => void; onSubmit: (payload: ContentCreatePayload) => void }) {
  const [contentSubject, setContentSubject] = useState('')
  const [type, setType] = useState<ContentType>('guide')
  const [kind, setKind] = useState<ContentTaskKind>('create')
  const [knowledgeScopes, setKnowledgeScopes] = useState<ContentKnowledgeScope[]>(DEFAULT_SCOPES.guide)
  const [priority, setPriority] = useState<'P0' | 'P1' | 'P2'>('P1')
  const [audience, setAudience] = useState('')
  const [userQuestion, setUserQuestion] = useState('')
  const [workingTitle, setWorkingTitle] = useState('')
  const [businessGoal, setBusinessGoal] = useState<NonNullable<ContentTask['businessGoal']>>('decision')
  const [dueDate, setDueDate] = useState('2026-08-15')
  const [sourceId, setSourceId] = useState<typeof SOURCE_PRESETS[number]['id']>('manual')
  const [reason, setReason] = useState<string>('')

  const pickSource = (preset: typeof SOURCE_PRESETS[number]) => {
    setSourceId(preset.id); setReason(preset.reason)
    if (preset.id === 'attribution') {
      setContentSubject('铝合金与定制 CNC 海外采购内容专题'); setType('guide'); setKind('create')
      setKnowledgeScopes(['product', 'service', 'case', 'industry']); setBusinessGoal('traffic')
      setAudience('海外 CNC 代工采购与供应商筛选人员')
      setUserQuestion('海外采购在铝合金与定制 CNC 的工艺、打样、小批量采购和供应商选择中需要了解什么？')
      setWorkingTitle('CNC 海外采购关键词持续内容计划')
    } else {
      setContentSubject(''); setType('guide'); setKind('create'); setKnowledgeScopes(DEFAULT_SCOPES.guide)
      setBusinessGoal('decision'); setAudience(''); setUserQuestion(''); setWorkingTitle('')
    }
  }

  const valid = Boolean(contentSubject.trim() && audience.trim() && userQuestion.trim() && knowledgeScopes.length)

  const changeType = (next: ContentType) => { setType(next); setKnowledgeScopes(DEFAULT_SCOPES[next]) }
  const toggleScope = (scope: ContentKnowledgeScope) => setKnowledgeScopes((current) => current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope])

  const submit = () => {
    if (!valid) return
    const subject = contentSubject.trim()
    const goalDefaults = GOAL_DEFAULTS[businessGoal]
    const resolvedAudience = audience.trim()
    const recommendedChannels: ContentChannel[] = businessGoal === 'awareness' ? ['website', 'linkedin'] : businessGoal === 'traffic' ? ['website'] : businessGoal === 'conversion' ? ['website', 'linkedin'] : ['website']
    onSubmit({
      demandSource: sourceId, title: workingTitle.trim() || `${subject} · ${TYPE_LABEL[type]}`, type, kind, priority, channels: recommendedChannels, theme: subject,
      contentSubject: subject, knowledgeScopes, audience: resolvedAudience, userQuestion: userQuestion.trim(),
      businessGoal, successMetric: goalDefaults.metric, coreMessage: `围绕“${subject}”回答“${userQuestion.trim()}”，并给出可验证的判断依据、适用边界与下一步建议。`,
      desiredAction: goalDefaults.action, journeyStage: goalDefaults.stage, mustInclude: '', mustAvoid: '', owner: '内容运营组',
      dueDate, reason: reason.trim() || '由用户主动提出内容需求，完整任务简报由主 Agent 自动推导。',
      locales: sourceId === 'attribution' ? ['en'] : [], sourceContext: sourceId === 'attribution' ? DIAGNOSIS_CONTEXT : undefined,
    })
  }

  return <div className="drawer-root" role="dialog" aria-modal="true" aria-label="新建内容任务">
    <button type="button" className="drawer-mask" aria-label="关闭" onClick={onClose} />
    <aside className="drawer-panel content-create-drawer">
      <div className="drawer-header">
        <div><div className="muted" style={{ marginBottom: 4 }}>内容运营 · 新增内容任务</div><h2 className="drawer-title">新建内容任务</h2></div>
        <button type="button" className="drawer-close" onClick={onClose} aria-label="关闭"><X size={18} /></button>
      </div>

      <div className="drawer-body content-create-form">
        <div className="content-create-intro"><Sparkles size={18} /><div><b>先锁定知识检索边界，再让 Agent 补全创作策略</b><span>蓝色区域决定 ResearchAgent 去哪里找、找什么，必须明确；灰色区域可留空，由 Agent 推荐。</span></div></div>

        <div className="content-form-section"><b>01 · 需求来源</b><span>用于回链诊断、洞察或人工需求，不作为自由文本猜测。</span></div>
        <label className="content-form-field"><span>内容需求来源 *</span><div className="content-chip-group">{SOURCE_PRESETS.map((preset) => <button type="button" key={preset.id} className={sourceId === preset.id ? 'is-active' : ''} onClick={() => pickSource(preset)}>{preset.label}</button>)}</div></label>

        {sourceId === 'attribution' && <section className="content-diagnosis-import">
          <div className="content-diagnosis-import__head"><div><Sparkles size={16} /><span><b>诊断报告已解析</b><small>自然搜索下降 · 渠道到达 · 中等置信度</small></span></div><em>检索契约 7/7</em></div>
          <div className="content-diagnosis-summary"><div><span>任务</span><b>持续内容发布计划</b></div><div><span>范围</span><b>8 个 CNC 关键词</b></div><div><span>节奏</span><b>每 7 天 1 篇</b></div><div><span>渠道</span><b>英文主站</b></div></div>
          <p>系统已从诊断 JSON 映射内容对象、受众、核心问题、知识范围和目标。创建时只展示摘要；完整原始 JSON 与可变字段会随任务传给后续 Agent。</p>
          <details><summary>查看解析结果 <span>共 {DIAGNOSIS_CONTEXT.sections.reduce((sum, section) => sum + section.items.length, 0)} 个动态字段</span></summary><div>{DIAGNOSIS_CONTEXT.sections.map((section) => <section key={section.key}><b>{section.label}</b><div>{section.items.map((item) => <span key={item.key}>{item.label}<em>{Array.isArray(item.value) ? `${item.value.length} 项` : typeof item.value === 'object' ? '结构化配置' : String(item.value)}</em></span>)}</div></section>)}</div></details>
        </section>}

        {sourceId !== 'attribution' && <section className="content-required-section">
          <div className="content-required-section__head"><div><b>02 · 知识检索与生成必需信息</b><span>这些字段共同组成检索契约，缺一项就不启动资料查找。</span></div><em>{valid ? '检索条件完整' : '需要补齐'}</em></div>
          <div className="content-form-row"><label className="content-form-field"><span>内容类型 *</span><select value={type} onChange={(e) => changeType(e.target.value as ContentType)}>{Object.entries(TYPE_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><small>决定资料模板、内容结构与质量权重</small></label><label className="content-form-field"><span>任务类型 *</span><select value={kind} onChange={(e) => setKind(e.target.value as ContentTaskKind)}>{Object.entries(KIND_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><small>决定查新资料，还是先定位已有内容</small></label></div>
          <label className="content-form-field"><span>内容对象 *</span><input className="form-input" autoFocus value={contentSubject} onChange={(e) => setContentSubject(e.target.value)} placeholder="例如：SR20 工业机器人 / 汽车零部件焊接方案 / 机器人选型" /><small>填写具体产品、服务、方案、行业场景或主题；它会成为检索实体与关键词。</small></label>
          <label className="content-form-field"><span>需要查询哪些知识域？ *</span><div className="content-knowledge-scope-picker">{KNOWLEDGE_SCOPE_OPTIONS.map((item) => <button type="button" key={item.id} className={knowledgeScopes.includes(item.id) ? 'is-active' : ''} onClick={() => toggleScope(item.id)}><b>{item.label}</b><small>{item.description}</small></button>)}</div><small>{knowledgeScopes.length ? `已限定 ${knowledgeScopes.length} 个知识域` : '至少选择一个知识域，避免无边界检索'}</small></label>
          <div className="content-form-row"><label className="content-form-field"><span>主要业务目标 *</span><select value={businessGoal} onChange={(e) => setBusinessGoal(e.target.value as NonNullable<ContentTask['businessGoal']>)}>{Object.entries(BUSINESS_GOALS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><small>影响证据排序与结论方向</small></label><label className="content-form-field"><span>目标受众 *</span><input className="form-input" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="例如：汽车行业工艺工程师" /><small>限定术语深度和判断视角</small></label></div>
          <label className="content-form-field"><span>内容必须回答的核心问题 *</span><textarea value={userQuestion} onChange={(e) => setUserQuestion(e.target.value)} rows={3} placeholder="例如：在 20kg 负载下，如何根据臂展、节拍和精度选择合适型号？" /><small>ResearchAgent 会把它拆成检索问题，CompletenessAgent 也用它判断资料是否够用。</small></label>
        </section>}

        <details className="content-create-advanced"><summary>03 · 灵活配置 <span>可留空，Agent 会给出建议并允许后续修改</span></summary><div>
          <label className="content-form-field"><span>工作标题</span><input value={workingTitle} onChange={(e) => setWorkingTitle(e.target.value)} placeholder={`留空则生成“${contentSubject || '内容对象'} · ${TYPE_LABEL[type]}”`} /></label>
          <div className="content-form-row"><label className="content-form-field"><span>优先级</span><select value={priority} onChange={(e) => setPriority(e.target.value as 'P0' | 'P1' | 'P2')}><option value="P0">P0</option><option value="P1">P1</option><option value="P2">P2</option></select></label><label className="content-form-field"><span>计划完成时间</span><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></label></div>
          <label className="content-form-field"><span>补充背景或限制</span><textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="可选：诊断依据、必须包含的信息、不能出现的表达等" /></label>
        </div></details>

        <div className="content-note"><Sparkles size={16} /><p>创建后主 Agent 会生成核心主张、成功指标、CTA 与建议渠道；ResearchAgent 只在上面选定的知识域内检索，不会擅自扩大范围。</p></div>
      </div>

      <div className="drawer-footer">
        <Button disabled={!valid} onClick={submit}><Sparkles size={14} />{sourceId === 'attribution' ? '接收并创建诊断任务' : '生成任务简报'}</Button>
        <Button variant="secondary" onClick={onClose}>取消</Button>
      </div>
    </aside>
  </div>
}
