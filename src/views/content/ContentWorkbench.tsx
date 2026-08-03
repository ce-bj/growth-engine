import { AlertTriangle, ArrowLeft, Check, ChevronDown, ChevronRight, ChevronUp, CircleAlert, FileCheck2, Globe, Languages, Library, Plus, RefreshCw, Send, Sparkles, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/Button'
import type { ChannelProfile, ContentChannel, ContentLocale, ContentTask, GlossaryTerm, KnowledgeRiskEvent } from '../../types'
import { ContentAssistantPanel, type AssistantQuickAction } from './ContentAssistantPanel'
import { CHANNEL_FIELD_DEFS, ChannelBadge, CHANNEL_META, CONTENT_STEPS, getGlossaryStatus, getReviewVerdict, getTaskStep, KNOWLEDGE_RISK_SOURCE_LABEL, KnowledgeRiskBadge, KNOWLEDGE_RISK_STATUS_LABEL, QualityRing, ReviewVerdictBadge, StatusBadge } from './ContentPrimitives'

export function ContentWorkbench({ task, initialStep, knowledgeRisks, locales, glossaryTerms, onBack, onUpdateBrief, onUpdateOutline, onResolveMaterials, onConfirmChannelProfiles, onGenerateDraft, onRegenerateDraft, onToggleComplianceIssue, onIgnoreWarnings, onGenerateChannel, onUpdateChannelVersion, onSubmitApproval, onApprove, onOpenGlossary, onOpenKnowledgeRisks }: {
  task: ContentTask
  initialStep?: number
  knowledgeRisks: KnowledgeRiskEvent[]
  locales: ContentLocale[]
  glossaryTerms: GlossaryTerm[]
  onBack: () => void
  onUpdateBrief: (taskId: string, patch: Partial<Pick<ContentTask, 'title' | 'audience' | 'userQuestion' | 'theme' | 'reason' | 'dueDate'>>) => void
  onUpdateOutline: (taskId: string, outline: string[]) => void
  onResolveMaterials: (taskId: string) => void
  onConfirmChannelProfiles: (taskId: string, profiles: ChannelProfile[]) => void
  onGenerateDraft: (taskId: string) => void
  onRegenerateDraft: (taskId: string) => void
  onToggleComplianceIssue: (taskId: string, issueId: string) => void
  onIgnoreWarnings: (taskId: string) => void
  onGenerateChannel: (taskId: string, channel: ContentChannel) => void
  onUpdateChannelVersion: (taskId: string, channel: ContentChannel, patch: { title?: string; body?: string }) => void
  onSubmitApproval: (taskId: string) => void
  onApprove: (taskId: string, scheduledAt: string) => void
  onOpenGlossary: (terms: string[]) => void
  onOpenKnowledgeRisks: () => void
}) {
  const [step, setStep] = useState(initialStep ?? Math.min(getTaskStep(task.status), CONTENT_STEPS.length - 1))
  const [channel, setChannel] = useState<ContentChannel>(task.channelVersions[0]?.channel ?? task.channels[0] ?? 'website')
  const [scheduledAt, setScheduledAt] = useState('2026-08-03T10:00')
  const [failStrategy, setFailStrategy] = useState<'continue' | 'stop'>('continue')
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

  function updateField(ch: ContentChannel, key: string, value: string) {
    setFieldValues((prev) => ({ ...prev, [ch]: { ...prev[ch], [key]: value } }))
  }

  function confirmChannelProfiles() {
    const profiles: ChannelProfile[] = task.channels.map((ch) => ({ channel: ch, fields: fieldValues[ch] ?? {} }))
    onConfirmChannelProfiles(task.id, profiles)
    setStep(3)
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
    if (category === 'privacy') return { label: '去资料与素材补充', onClick: () => setStep(1) }
    return { label: '去内容概览调整', onClick: () => setStep(3) }
  }

  const assistantQuickActions: AssistantQuickAction[] = []
  let assistantMessage = ''
  switch (step) {
    case 0:
      assistantMessage = '这是本次内容任务的简报，你可以直接编辑标题、受众、主题、依据等字段；确认无误后进入下一步"资料与素材"。'
      break
    case 1: {
      if (task.missingMaterials.length) {
        assistantMessage = `还缺 ${task.missingMaterials.length} 项资料，补充完成后点击下方按钮确认。`
        assistantQuickActions.push({ label: '已补充全部资料', onClick: () => onResolveMaterials(task.id) })
      } else {
        assistantMessage = '资料已准备完整，可以继续下一步。'
      }
      if (taskLocales.length > 0 && termGaps.length > 0) {
        assistantMessage += ` 另外有 ${termGaps.length} 个专业名词还缺目标语言译名。`
        assistantQuickActions.push({ label: '去配置术语与翻译', onClick: () => onOpenGlossary(termGaps) })
      }
      break
    }
    case 2:
      assistantMessage = allFieldsFilled ? '渠道字段已填写完整，确认后即可进入内容概览生成。' : '请先填写完所有已选渠道的定义字段。'
      assistantQuickActions.push({ label: '确认渠道字段，进入内容概览生成', onClick: confirmChannelProfiles, disabled: !allFieldsFilled })
      break
    case 3:
      if (!task.masterDraft) {
        assistantMessage = '大纲已经可以编辑，确认后点击下方按钮生成内容概览。'
        assistantQuickActions.push({ label: '开始生成', onClick: () => onGenerateDraft(task.id) })
      } else if (hasDraftGap) {
        assistantMessage = `内容概览已生成，但还有 ${openKnowledgeRisks.length} 处知识库未命中、${termGaps.length} 个术语缺译名，建议先补全再重新生成。`
        assistantQuickActions.push({ label: '补全后重新生成概览', onClick: () => onRegenerateDraft(task.id) })
      } else {
        assistantMessage = '内容概览已生成，知识依据已覆盖本次内容，你可以直接编辑大纲与正文。'
      }
      break
    case 4:
      if (verdict === 'block') {
        assistantMessage = `有 ${blockers.length} 项高风险问题需要处理：点击问题卡片上的入口去对应位置修改，处理完成后点击"标记为已处理"确认。`
      } else if (verdict === 'warning') {
        assistantMessage = '合规检查有警告项，确认后可以继续渠道内容生成。'
        assistantQuickActions.push({ label: '忽略警告，进入渠道内容生成', onClick: () => onIgnoreWarnings(task.id) })
      } else {
        assistantMessage = '质量与合规检查均已通过，可以进入渠道内容生成。'
        assistantQuickActions.push({ label: '进入渠道内容生成', onClick: () => onIgnoreWarnings(task.id) })
      }
      break
    case 5:
      if (!version) {
        assistantMessage = `${CHANNEL_META[channel].label} 渠道版本还未生成，基于概览与渠道字段生成后可以编辑标题和正文。`
        assistantQuickActions.push({ label: '基于概览与渠道字段生成', onClick: () => onGenerateChannel(task.id, channel) })
      } else {
        assistantMessage = `${CHANNEL_META[channel].label} 渠道版本已生成，可以直接编辑标题与正文。`
      }
      if (allChannelsVersioned && task.status === 'channel_adaptation') {
        assistantMessage += ' 所有渠道版本已就绪，可以提交审批。'
        assistantQuickActions.push({ label: '渠道版本已就绪，提交审批', onClick: () => onSubmitApproval(task.id) })
      }
      break
    case 6:
      assistantMessage = blockers.length ? '还有高风险合规问题未处理，暂不能审批通过。' : '内容概览、渠道版本和合规检查均已完成，满足审批条件。'
      if (blockers.length) assistantQuickActions.push({ label: '去处理合规问题', onClick: () => setStep(4) })
      assistantQuickActions.push({ label: '审批通过并加入排期', onClick: () => onApprove(task.id, scheduledAt), disabled: blockers.length > 0 })
      break
  }

  return <div className="content-workbench">
    <div className="content-workbench__top"><button onClick={onBack}><ArrowLeft size={16} />返回内容计划</button><div><span className={`content-priority is-${task.priority.toLowerCase()}`}>{task.priority}</span><h2>{task.title}</h2><StatusBadge status={task.status} /></div></div>
    <div className="content-workbench__main"><div className="content-workbench__primary">
    <div className="content-stepper">{CONTENT_STEPS.map((label, index) => <button key={label} className={`${step === index ? 'is-active' : ''} ${index < step ? 'is-done' : ''}`} onClick={() => setStep(index)}><span>{index < step ? <Check size={13} /> : index + 1}</span><b>{label}</b>{index < CONTENT_STEPS.length - 1 && <ChevronRight size={14} />}</button>)}</div>

    <section className="content-workbench__body">
      {step === 0 && <div className="content-workbench-grid"><div className="content-panel"><span className="content-eyebrow">CONTENT BRIEF</span><h3>任务说明</h3><div className="content-brief-form">
        <label className="content-form-field"><span>内容标题</span><input className="form-input" value={task.title} onChange={(e) => onUpdateBrief(task.id, { title: e.target.value })} /></label>
        <label className="content-form-field"><span>目标受众</span><input className="form-input" value={task.audience} onChange={(e) => onUpdateBrief(task.id, { audience: e.target.value })} /></label>
        <label className="content-form-field"><span>访客问题</span><input className="form-input" value={task.userQuestion} onChange={(e) => onUpdateBrief(task.id, { userQuestion: e.target.value })} /></label>
        <label className="content-form-field"><span>内容主题</span><input className="form-input" value={task.theme} onChange={(e) => onUpdateBrief(task.id, { theme: e.target.value })} /></label>
        <label className="content-form-field"><span>任务依据</span><textarea rows={3} value={task.reason} onChange={(e) => onUpdateBrief(task.id, { reason: e.target.value })} /></label>
        <label className="content-form-field"><span>计划时间</span><input type="date" className="form-input" value={task.dueDate} onChange={(e) => onUpdateBrief(task.id, { dueDate: e.target.value })} /></label>
      </div></div><div className="content-panel"><span className="content-eyebrow">TARGET CHANNELS</span><h3>目标渠道</h3><div className="content-channel-stack">{task.channels.map((item) => <ChannelBadge key={item} channel={item} />)}</div><div className="content-note"><Sparkles size={16} /><p>先形成统一事实和核心表达，再从内容概览生成各渠道版本。</p></div></div></div>}

      {step === 1 && <div className="content-workbench-grid"><div className="content-panel"><div className="content-panel__head"><div><span className="content-eyebrow">KNOWLEDGE REFERENCES</span><h3>知识库调用结果</h3></div><Library size={20} /></div><div className="content-reference-list">{task.knowledge.length ? task.knowledge.map((ref) => <div key={ref.id}><span className={ref.verified ? 'is-verified' : ''}>{ref.verified ? <Check size={12} /> : '!'}</span><p><b>{ref.title}</b><small>{ref.category} · {ref.source}</small></p></div>) : <p className="muted">任务开始后将调用企业与行业知识库。</p>}</div>
        {taskKnowledgeRisks.length > 0 && <div className="content-knowledge-risk-panel"><div className="content-panel__head"><div><span className="content-eyebrow">RAG RISK TRACE</span><h3>知识库调用风险</h3></div><span className="content-risk-summary has-risk">{taskKnowledgeRisks.length} 条</span></div><div className="content-knowledge-risk-list">{taskKnowledgeRisks.map((risk) => <article key={risk.id} className={`is-${risk.level}`}><div className="content-knowledge-risk-list__head"><KnowledgeRiskBadge level={risk.level} /><span className={`content-knowledge-risk-status is-${risk.status}`}>{KNOWLEDGE_RISK_STATUS_LABEL[risk.status]}</span></div><b>{risk.issueType}</b><p>{risk.diagnosis}</p><small>{KNOWLEDGE_RISK_SOURCE_LABEL} · {risk.occurredAt}</small></article>)}</div></div>}
      </div><div className="content-panel"><span className="content-eyebrow">MISSING MATERIALS</span><h3>缺失资料</h3>{task.missingMaterials.length ? <div className="content-missing-list">{task.missingMaterials.map((item) => <div key={item}><CircleAlert size={15} />{item}</div>)}<Button size="sm" onClick={() => onResolveMaterials(task.id)}>已补充全部资料</Button></div> : <div className="content-empty-success"><FileCheck2 size={28} /><b>资料已准备完整</b><span>关键事实均有可追溯来源</span></div>}
        {taskLocales.length > 0 && <div className={`content-locale-notice ${termGaps.length ? 'is-warning' : 'is-ready'}`}>
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
        </div>}
      </div></div>}

      {step === 2 && <div className="content-workbench-grid"><div className="content-panel"><span className="content-eyebrow">TARGET CHANNELS</span><h3>已选发布渠道</h3><div className="content-channel-stack">{task.channels.map((item) => <ChannelBadge key={item} channel={item} />)}</div><div className="content-note"><Sparkles size={16} /><p>渠道字段值后续将从账号管理、CMS 等其他功能取得，原型阶段用示例值填充，可编辑确认。</p></div></div>
        <div className="content-panel content-channel-fields-panel"><span className="content-eyebrow">CHANNEL FIELDS</span><h3>渠道定义字段</h3><div className="content-channel-fields-list">{task.channels.map((ch) => <div key={ch} className="content-channel-fields-card"><div className="content-channel-fields-card__head"><ChannelBadge channel={ch} /></div>{CHANNEL_FIELD_DEFS[ch].map((field) => <label key={field.key} className="content-form-field"><span>{field.label}<small>{field.source}</small></span><input className="form-input" value={fieldValues[ch]?.[field.key] ?? ''} onChange={(e) => updateField(ch, field.key, e.target.value)} /></label>)}</div>)}</div>
          <Button block disabled={!allFieldsFilled} onClick={confirmChannelProfiles}>确认渠道字段，进入内容概览生成</Button>
        </div></div>}

      {step === 3 && <div className="content-draft-layout"><aside className="content-outline"><span className="content-eyebrow">OUTLINE</span><h3>内容大纲</h3><div className="content-outline-list">{task.outline.map((item, index) => <div key={index} className="content-outline-item"><span>{String(index + 1).padStart(2, '0')}</span><input value={item} placeholder="大纲内容" onChange={(e) => updateOutlineItem(index, e.target.value)} /><div className="content-outline-item__actions"><button title="上移" disabled={index === 0} onClick={() => moveOutlineItem(index, -1)}><ChevronUp size={13} /></button><button title="下移" disabled={index === task.outline.length - 1} onClick={() => moveOutlineItem(index, 1)}><ChevronDown size={13} /></button><button title="删除" onClick={() => removeOutlineItem(index)}><Trash2 size={13} /></button></div></div>)}</div><button className="content-outline-add" onClick={addOutlineItem}><Plus size={13} />新增大纲项</button></aside><div className="content-editor"><div className="content-editor__head"><div><span className="content-eyebrow">CONTENT OVERVIEW</span><h3>内容概览</h3></div><div><Button size="sm" variant="secondary">调整语气</Button><Button size="sm"><Sparkles size={14} />AI 重写</Button></div></div>
        <div className="content-editor__canvas"><h1>{task.title}</h1>{task.masterDraft ? task.masterDraft.split('\n\n').map((p) => <p key={p}>{p}</p>) : <div className="content-generating-state"><Sparkles size={30} /><b>等待生成内容概览</b><span>将基于已确认大纲、知识资料与渠道字段生成</span><Button onClick={() => onGenerateDraft(task.id)}>开始生成</Button></div>}</div></div>
        <aside className="content-knowledge-sidebar">
          <div className="content-knowledge-sidebar__section"><span className="content-eyebrow">USED KNOWLEDGE</span><h3>已采用知识依据</h3>{verifiedKnowledge.length ? <div className="content-reference-list">{verifiedKnowledge.map((ref) => <div key={ref.id}><span className="is-verified"><Check size={12} /></span><p><b>{ref.title}</b><small>{ref.category} · {ref.source}</small></p></div>)}</div> : <p className="muted">暂无知识库引用。</p>}</div>
          <div className="content-knowledge-sidebar__section">
            <span className="content-eyebrow">KNOWLEDGE GAP</span><h3>知识缺口</h3>
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

      {step === 4 && <div className="content-review-grid"><section className="content-panel content-score-panel"><div><span className="content-eyebrow">QUALITY SCORE</span><h3>内容质量</h3></div><QualityRing score={task.quality.overall} /><div className="content-score-bars">{[['需求匹配', task.quality.relevance, 20], ['专业准确', task.quality.accuracy, 20], ['内容完整', task.quality.completeness, 20], ['清晰易读', task.quality.readability, 15], ['企业真实', task.quality.authenticity, 15], ['渠道适配', task.quality.channelFit, 10]].map(([label, value, max]) => <div key={String(label)}><span>{label}</span><i><b style={{ width: `${(Number(value) / Number(max)) * 100}%` }} /></i><em>{value}/{max}</em></div>)}</div>{task.quality.overall < 70 && <div className="content-quality-hint"><AlertTriangle size={15} /><p>整体质量分偏低，建议回到内容概览调整大纲或母稿后重新生成。</p><Button size="sm" variant="secondary" onClick={() => setStep(3)}>返回内容概览调整</Button></div>}</section><section className="content-panel"><div className="content-panel__head"><div><span className="content-eyebrow">COMPLIANCE REVIEW</span><h3>合规检查</h3></div><ReviewVerdictBadge verdict={verdict} /></div><div className="content-compliance-list">{task.compliance.length ? task.compliance.map((issue) => { const action = getComplianceAction(issue.category); return <article key={issue.id} className={`is-${issue.level} ${issue.resolved ? 'is-resolved' : ''}`}><span>{issue.resolved ? <Check size={14} /> : '!'}</span><div><b>{issue.title}</b><p>{issue.detail}</p><small>{issue.category} · {issue.level}</small><div className="content-compliance-list__actions">{issue.resolved ? <button className="content-compliance-list__undo" onClick={() => onToggleComplianceIssue(task.id, issue.id)}>撤销</button> : <><Button size="sm" variant="secondary" onClick={action.onClick}>{action.label}</Button><Button size="sm" onClick={() => onToggleComplianceIssue(task.id, issue.id)}>标记为已处理</Button></>}</div></div></article> }) : <div className="content-empty-success"><FileCheck2 size={28} /><b>未发现合规风险</b><span>可进入渠道内容生成与发布流程</span></div>}</div>{verdict === 'block' ? <Button block disabled>还有 {blockers.length} 项高风险问题待处理，请在上方逐条处理后继续</Button> : <Button block variant={verdict === 'warning' ? 'secondary' : 'primary'} onClick={() => onIgnoreWarnings(task.id)}>{verdict === 'warning' ? '忽略警告，进入渠道内容生成' : '进入渠道内容生成'}</Button>}</section></div>}

      {step === 5 && <div className="content-channel-editor"><div className="content-channel-editor__tabs">{task.channels.map((item) => <button key={item} className={channel === item ? 'is-active' : ''} onClick={() => setChannel(item)}><ChannelBadge channel={item} /></button>)}</div><div className="content-channel-preview"><div className="content-channel-preview__meta"><span style={{ background: CHANNEL_META[channel].color }}>{CHANNEL_META[channel].short}</span><div><b>{CHANNEL_META[channel].label}</b><small>{version?.account ?? '待选择账号'}</small></div><em>{version ? '版本已生成' : '待生成'}</em></div>{version ? <div className="content-channel-preview__edit"><label><span>标题</span><input className="form-input" value={version.title} onChange={(e) => onUpdateChannelVersion(task.id, channel, { title: e.target.value })} /></label><label><span>正文</span><textarea rows={6} value={version.body} onChange={(e) => onUpdateChannelVersion(task.id, channel, { body: e.target.value })} /></label><div className="content-preview-placeholder">视觉素材预览</div></div> : <div className="content-generating-state"><Sparkles size={30} /><b>尚未生成该渠道版本</b><Button onClick={() => onGenerateChannel(task.id, channel)}>基于概览与渠道字段生成</Button></div>}</div>{allChannelsVersioned && task.status === 'channel_adaptation' && <Button block onClick={() => onSubmitApproval(task.id)}><Send size={15} />渠道版本已就绪，提交审批</Button>}</div>}

      {step === 6 && <div className="content-approval-layout"><section className="content-panel"><span className="content-eyebrow">APPROVAL</span><h3>审批状态</h3><div className="content-approval-card"><span className={blockers.length ? 'is-blocked' : 'is-ready'}>{blockers.length ? '!' : <Check size={18} />}</span><div><b>{blockers.length ? '尚未满足发布条件' : '内容已满足审批条件'}</b><p>{blockers.length ? '请先处理高风险合规问题。' : '内容概览、渠道版本和合规检查均已完成。'}</p>{blockers.length > 0 && <Button size="sm" variant="secondary" onClick={() => setStep(4)}>去处理合规问题</Button>}</div></div><dl className="content-detail-list"><div><dt>审批人</dt><dd>张敏 · 市场运营</dd></div><div><dt>发布模式</dt><dd>人工审核</dd></div><div><dt>发布渠道</dt><dd>{task.channels.length} 个</dd></div></dl></section><section className="content-panel"><span className="content-eyebrow">SCHEDULE</span><h3>发布配置</h3><label className="content-form-field"><span>发布时间</span><input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} /></label><label className="content-form-field"><span>失败策略</span><select value={failStrategy} onChange={(e) => setFailStrategy(e.target.value as 'continue' | 'stop')}><option value="continue">其他渠道继续发布</option><option value="stop">任一失败则停止整组</option></select></label><Button block disabled={blockers.length > 0} onClick={() => onApprove(task.id, scheduledAt)}><Send size={15} />审批通过并加入排期</Button></section></div>}
    </section>
    </div>
    <ContentAssistantPanel step={step} message={assistantMessage} quickActions={assistantQuickActions} />
    </div>
  </div>
}
