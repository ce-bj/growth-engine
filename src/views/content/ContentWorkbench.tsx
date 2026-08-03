import { AlertTriangle, ArrowLeft, Check, ChevronRight, CircleAlert, FileCheck2, Globe, Languages, Library, RefreshCw, Send, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/Button'
import type { ContentChannel, ContentLocale, ContentTask, GlossaryTerm, KnowledgeRiskEvent } from '../../types'
import { ChannelBadge, CHANNEL_META, getGlossaryStatus, getReviewVerdict, KNOWLEDGE_RISK_SOURCE_LABEL, KnowledgeRiskBadge, KNOWLEDGE_RISK_STATUS_LABEL, QualityRing, ReviewVerdictBadge, StatusBadge } from './ContentPrimitives'

const STEPS = ['任务简报', '资料与素材', '母稿生产', '质量与合规', '渠道版本', '审批与发布']

export function ContentWorkbench({ task, initialStep, knowledgeRisks, locales, glossaryTerms, onBack, onResolveMaterials, onGenerateDraft, onRegenerateDraft, onResolveCompliance, onIgnoreWarnings, onGenerateChannel, onUpdateChannelVersion, onSubmitApproval, onApprove, onOpenGlossary, onOpenKnowledgeRisks }: {
  task: ContentTask
  initialStep?: number
  knowledgeRisks: KnowledgeRiskEvent[]
  locales: ContentLocale[]
  glossaryTerms: GlossaryTerm[]
  onBack: () => void
  onResolveMaterials: (taskId: string) => void
  onGenerateDraft: (taskId: string) => void
  onRegenerateDraft: (taskId: string) => void
  onResolveCompliance: (taskId: string) => void
  onIgnoreWarnings: (taskId: string) => void
  onGenerateChannel: (taskId: string, channel: ContentChannel) => void
  onUpdateChannelVersion: (taskId: string, channel: ContentChannel, patch: { title?: string; body?: string }) => void
  onSubmitApproval: (taskId: string) => void
  onApprove: (taskId: string, scheduledAt: string) => void
  onOpenGlossary: (terms: string[]) => void
  onOpenKnowledgeRisks: () => void
}) {
  const [step, setStep] = useState(initialStep ?? (task.status === 'compliance_review' ? 3 : task.status === 'pending_approval' ? 5 : task.status === 'needs_material' ? 1 : 2))
  const [channel, setChannel] = useState<ContentChannel>(task.channelVersions[0]?.channel ?? task.channels[0] ?? 'website')
  const [scheduledAt, setScheduledAt] = useState('2026-08-03T10:00')
  const [failStrategy, setFailStrategy] = useState<'continue' | 'stop'>('continue')
  const blockers = task.compliance.filter((item) => !item.resolved && (item.level === 'blocking' || item.level === 'high'))
  const verdict = getReviewVerdict(task)
  const version = task.channelVersions.find((item) => item.channel === channel)
  const allChannelsVersioned = task.channels.every((item) => task.channelVersions.some((version) => version.channel === item))
  const taskKnowledgeRisks = knowledgeRisks.filter((item) => item.taskId === task.id)
  const openKnowledgeRisks = taskKnowledgeRisks.filter((item) => item.status !== 'resolved')

  /** 全球站：本内容要发布到的语言站点，以及其中译名尚未配齐的专业名词 */
  const taskLocales = locales.filter((locale) => task.locales?.includes(locale.code))
  const termGaps = taskLocales.length === 0 ? [] : (task.missingTerms ?? []).filter((name) => {
    const term = glossaryTerms.find((item) => item.term === name)
    return !term || getGlossaryStatus(term, taskLocales) !== 'ready'
  })
  const hasDraftGap = termGaps.length > 0 || openKnowledgeRisks.length > 0


  return <div className="content-workbench">
    <div className="content-workbench__top"><button onClick={onBack}><ArrowLeft size={16} />返回内容计划</button><div><span className={`content-priority is-${task.priority.toLowerCase()}`}>{task.priority}</span><h2>{task.title}</h2><StatusBadge status={task.status} /></div></div>
    <div className="content-stepper">{STEPS.map((label, index) => <button key={label} className={`${step === index ? 'is-active' : ''} ${index < step ? 'is-done' : ''}`} onClick={() => setStep(index)}><span>{index < step ? <Check size={13} /> : index + 1}</span><b>{label}</b>{index < STEPS.length - 1 && <ChevronRight size={14} />}</button>)}</div>

    <section className="content-workbench__body">
      {step === 0 && <div className="content-workbench-grid"><div className="content-panel"><span className="content-eyebrow">CONTENT BRIEF</span><h3>任务说明</h3><dl className="content-detail-list"><div><dt>目标受众</dt><dd>{task.audience}</dd></div>{task.userQuestion && <div><dt>访客问题</dt><dd>{task.userQuestion}</dd></div>}<div><dt>内容主题</dt><dd>{task.theme}</dd></div><div><dt>任务依据</dt><dd>{task.reason}</dd></div><div><dt>计划时间</dt><dd>{task.dueDate}</dd></div></dl></div><div className="content-panel"><span className="content-eyebrow">TARGET CHANNELS</span><h3>目标渠道</h3><div className="content-channel-stack">{task.channels.map((item) => <ChannelBadge key={item} channel={item} />)}</div><div className="content-note"><Sparkles size={16} /><p>先形成统一事实和核心表达，再从母稿生成各渠道版本。</p></div></div></div>}

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

      {step === 2 && <div className="content-draft-layout"><aside className="content-outline"><span className="content-eyebrow">OUTLINE</span><h3>内容大纲</h3>{task.outline.map((item, index) => <button key={item}><span>{String(index + 1).padStart(2, '0')}</span>{item}</button>)}</aside><div className="content-editor"><div className="content-editor__head"><div><span className="content-eyebrow">MASTER CONTENT</span><h3>内容母稿</h3></div><div><Button size="sm" variant="secondary">调整语气</Button><Button size="sm"><Sparkles size={14} />AI 重写</Button></div></div>
        {task.masterDraft && hasDraftGap && <div className="content-draft-gap">
          <div className="content-draft-gap__head"><AlertTriangle size={17} /><div><b>母稿已生成，但存在知识缺口</b><p>以下问题已在生成过程中暴露，建议先到知识库补全资料与译名，再重新生成母稿。</p></div></div>
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
          <div className="content-draft-gap__foot"><Button size="sm" onClick={() => onRegenerateDraft(task.id)}><RefreshCw size={13} />补全后重新生成母稿</Button><span>重新生成会基于最新知识库与术语库内容覆盖当前母稿。</span></div>
        </div>}
        <div className="content-editor__canvas"><h1>{task.title}</h1>{task.masterDraft ? task.masterDraft.split('\n\n').map((p) => <p key={p}>{p}</p>) : <div className="content-generating-state"><Sparkles size={30} /><b>等待生成内容母稿</b><span>将基于已确认大纲和知识资料生成</span><Button onClick={() => onGenerateDraft(task.id)}>开始生成</Button></div>}</div></div></div>}

      {step === 3 && <div className="content-review-grid"><section className="content-panel content-score-panel"><div><span className="content-eyebrow">QUALITY SCORE</span><h3>内容质量</h3></div><QualityRing score={task.quality.overall} /><div className="content-score-bars">{[['需求匹配', task.quality.relevance, 20], ['专业准确', task.quality.accuracy, 20], ['内容完整', task.quality.completeness, 20], ['清晰易读', task.quality.readability, 15], ['企业真实', task.quality.authenticity, 15], ['渠道适配', task.quality.channelFit, 10]].map(([label, value, max]) => <div key={String(label)}><span>{label}</span><i><b style={{ width: `${(Number(value) / Number(max)) * 100}%` }} /></i><em>{value}/{max}</em></div>)}</div></section><section className="content-panel"><div className="content-panel__head"><div><span className="content-eyebrow">COMPLIANCE REVIEW</span><h3>合规检查</h3></div><ReviewVerdictBadge verdict={verdict} /></div><div className="content-compliance-list">{task.compliance.length ? task.compliance.map((issue) => <article key={issue.id} className={`is-${issue.level} ${issue.resolved ? 'is-resolved' : ''}`}><span>{issue.resolved ? <Check size={14} /> : '!'}</span><div><b>{issue.title}</b><p>{issue.detail}</p><small>{issue.category} · {issue.level}</small></div></article>) : <div className="content-empty-success"><FileCheck2 size={28} /><b>未发现合规风险</b><span>可进入渠道适配与发布流程</span></div>}</div>{verdict === 'block' ? <Button block onClick={() => onResolveCompliance(task.id)}>接受建议并处理风险</Button> : <Button block variant={verdict === 'warning' ? 'secondary' : 'primary'} onClick={() => onIgnoreWarnings(task.id)}>{verdict === 'warning' ? '忽略警告，进入渠道适配' : '进入渠道适配'}</Button>}</section></div>}

      {step === 4 && <div className="content-channel-editor"><div className="content-channel-editor__tabs">{task.channels.map((item) => <button key={item} className={channel === item ? 'is-active' : ''} onClick={() => setChannel(item)}><ChannelBadge channel={item} /></button>)}</div><div className="content-channel-preview"><div className="content-channel-preview__meta"><span style={{ background: CHANNEL_META[channel].color }}>{CHANNEL_META[channel].short}</span><div><b>{CHANNEL_META[channel].label}</b><small>{version?.account ?? '待选择账号'}</small></div><em>{version ? '版本已生成' : '待生成'}</em></div>{version ? <div className="content-channel-preview__edit"><label><span>标题</span><input className="form-input" value={version.title} onChange={(e) => onUpdateChannelVersion(task.id, channel, { title: e.target.value })} /></label><label><span>正文</span><textarea rows={6} value={version.body} onChange={(e) => onUpdateChannelVersion(task.id, channel, { body: e.target.value })} /></label><div className="content-preview-placeholder">视觉素材预览</div></div> : <div className="content-generating-state"><Sparkles size={30} /><b>尚未生成该渠道版本</b><Button onClick={() => onGenerateChannel(task.id, channel)}>生成渠道版本</Button></div>}</div>{allChannelsVersioned && task.status === 'channel_adaptation' && <Button block onClick={() => onSubmitApproval(task.id)}><Send size={15} />渠道版本已就绪，提交审批</Button>}</div>}

      {step === 5 && <div className="content-approval-layout"><section className="content-panel"><span className="content-eyebrow">APPROVAL</span><h3>审批状态</h3><div className="content-approval-card"><span className={blockers.length ? 'is-blocked' : 'is-ready'}>{blockers.length ? '!' : <Check size={18} />}</span><div><b>{blockers.length ? '尚未满足发布条件' : '内容已满足审批条件'}</b><p>{blockers.length ? '请先处理高风险合规问题。' : '母稿、渠道版本和合规检查均已完成。'}</p></div></div><dl className="content-detail-list"><div><dt>审批人</dt><dd>张敏 · 市场运营</dd></div><div><dt>发布模式</dt><dd>人工审核</dd></div><div><dt>发布渠道</dt><dd>{task.channels.length} 个</dd></div></dl></section><section className="content-panel"><span className="content-eyebrow">SCHEDULE</span><h3>发布配置</h3><label className="content-form-field"><span>发布时间</span><input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} /></label><label className="content-form-field"><span>失败策略</span><select value={failStrategy} onChange={(e) => setFailStrategy(e.target.value as 'continue' | 'stop')}><option value="continue">其他渠道继续发布</option><option value="stop">任一失败则停止整组</option></select></label><Button block disabled={blockers.length > 0} onClick={() => onApprove(task.id, scheduledAt)}><Send size={15} />审批通过并加入排期</Button></section></div>}
    </section>
  </div>
}
