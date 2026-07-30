import { useWorkbench } from '../context/WorkbenchContext'
import type {
  AttributionChange,
  AttributionMeasure,
  ChangeType,
} from '../types'
import {
  FUNNEL_SEGMENT_LABELS,
  TARGET_MODULE_LABELS,
} from '../types'

/* ── 标签与样式映射 ─────────────────────────────────────────────── */

const CHANGE_TYPE_META: Record<ChangeType, { label: string; cls: string }> = {
  down: { label: '异常', cls: 'badge--danger' },
  up: { label: '提升', cls: 'badge--success' },
  flat: { label: '持平', cls: 'badge--neutral' },
}

const CONFIDENCE_LABEL = { high: '高', medium: '中', low: '低' } as const

const COST_LABEL = { low: '低', medium: '中', high: '高' } as const
const TIME_LABEL = { instant: '立即', day: '当天', week: '一周', month: '一月' } as const
const BOUNDARY_LABEL = {
  auto: '自动执行',
  confirm: '确认后执行',
  advice_only: '只出方案',
} as const

const EXEC_STATUS_META: Record<
  NonNullable<AttributionMeasure['execStatus']>,
  { label: string; cls: string }
> = {
  pending_confirm: { label: '待确认', cls: 'badge--warning' },
  executing: { label: '执行中', cls: 'badge--info' },
  success: { label: '已执行', cls: 'badge--success' },
  failed: { label: '失败', cls: 'badge--danger' },
  rejected: { label: '已忽略', cls: 'badge--neutral' },
  advice_only: { label: '只出方案', cls: 'badge--neutral' },
}

/* ── 左侧 · 变化清单条目 ────────────────────────────────────────── */

function ChangeListItem({
  change,
  active,
  onSelect,
}: {
  change: AttributionChange
  active: boolean
  onSelect: () => void
}) {
  const meta = CHANGE_TYPE_META[change.changeType]
  return (
    <button
      type="button"
      className={`attr-change-item${active ? ' attr-change-item--active' : ''}`}
      onClick={onSelect}
    >
      <div className="attr-change-item__top">
        <span className={`badge ${meta.cls}`}>{meta.label}</span>
        {change.severity ? (
          <span className={`badge badge--neutral`}>{change.severity}</span>
        ) : null}
        <span className="attr-change-item__amount">{change.changeAmount}</span>
      </div>
      <div className="attr-change-item__metric">{change.changedMetric}</div>
      <div className="attr-change-item__sub">
        {change.changedValue}（基准 {change.baselineValue}）· {FUNNEL_SEGMENT_LABELS[change.funnelSegment]}
      </div>
    </button>
  )
}

/* ── Agent 对话气泡 ─────────────────────────────────────────────── */

function AgentBubble({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="agent-bubble">
      <div className="agent-bubble__avatar">AI</div>
      <div className="agent-bubble__body">
        {title ? <div className="agent-bubble__title">{title}</div> : null}
        {children}
      </div>
    </div>
  )
}

/* ── 措施卡片（异常类） ─────────────────────────────────────────── */

function MeasureCard({
  measure,
  onConfirm,
  onIgnore,
}: {
  measure: AttributionMeasure
  onConfirm: () => void
  onIgnore: () => void
}) {
  const st = EXEC_STATUS_META[measure.execStatus ?? 'pending_confirm']
  const actionable = measure.suggestedBoundary !== 'advice_only'
  return (
    <div className="attr-measure">
      <div className="attr-measure__head">
        <span className={`badge ${st.cls}`}>{st.label}</span>
        <span className="badge badge--neutral">{BOUNDARY_LABEL[measure.suggestedBoundary]}</span>
        <span className="muted attr-measure__target">
          → {TARGET_MODULE_LABELS[measure.targetModule]}
        </span>
      </div>
      <div className="attr-measure__desc">{measure.description}</div>

      {/* 依据卡片三段式 */}
      <div className="attr-evidence">
        <div className="attr-evidence__row">
          <span className="attr-evidence__label">现状</span>
          <span>{measure.evidenceCard.currentValue}</span>
        </div>
        <div className="attr-evidence__row">
          <span className="attr-evidence__label">对比</span>
          <span>{measure.evidenceCard.benchmark}</span>
        </div>
        <div className="attr-evidence__row">
          <span className="attr-evidence__label">动作</span>
          <span>{measure.evidenceCard.action}</span>
        </div>
      </div>

      <div className="attr-measure__meta muted">
        置信度 {CONFIDENCE_LABEL[measure.rootCauseConfidence]} · 成本 {COST_LABEL[measure.cost]} ·
        起效 {TIME_LABEL[measure.timeToEffect]} · 风险 {COST_LABEL[measure.risk]}
      </div>

      {actionable && measure.execStatus === 'pending_confirm' ? (
        <div className="row" style={{ gap: 8, marginTop: 10 }}>
          <button type="button" className="btn btn--primary btn--sm" onClick={onConfirm}>
            确认执行
          </button>
          <button type="button" className="btn btn--text btn--sm" onClick={onIgnore}>
            忽略
          </button>
        </div>
      ) : null}
    </div>
  )
}

/* ── 右侧 · 归因详情（Agent 对话式） ────────────────────────────── */

function ChangeDetail({ change }: { change: AttributionChange }) {
  const { confirmMeasure, ignoreMeasure } = useWorkbench()
  const meta = CHANGE_TYPE_META[change.changeType]
  return (
    <div className="attr-detail">
      <div className="attr-detail__head">
        <span className={`badge ${meta.cls}`} style={{ fontSize: 13, padding: '3px 10px' }}>
          {meta.label}
        </span>
        <h3 className="attr-detail__title">
          {change.changedMetric} {change.changeAmount}
        </h3>
        <div className="muted">
          本期 {change.changedValue} · 基准 {change.baselineValue} ·{' '}
          {FUNNEL_SEGMENT_LABELS[change.funnelSegment]} · 置信度 {CONFIDENCE_LABEL[change.confidence]}
        </div>
      </div>

      {/* ① Agent 分析过程 */}
      <AgentBubble title="归因分析">
        <ol className="agent-steps">
          {change.analysisSteps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </AgentBubble>

      {/* ② 结论 + 证据 */}
      <AgentBubble title="归因结论">
        <p>
          <b>{change.rootCause}</b>
          <span className="muted">（{change.causeCategory} · 置信度 {CONFIDENCE_LABEL[change.confidence]}）</span>
        </p>
        <ul className="agent-evidence">
          {change.evidence.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      </AgentBubble>

      {/* ③ 应对产出：按变化类型区分 */}
      {change.changeType === 'down' && change.measures ? (
        <AgentBubble title="解决方案与措施">
          {change.measures.map((m) => (
            <MeasureCard
              key={m.measureId}
              measure={m}
              onConfirm={() => confirmMeasure(change.id, m.measureId)}
              onIgnore={() => ignoreMeasure(change.id, m.measureId)}
            />
          ))}
        </AgentBubble>
      ) : null}

      {change.changeType === 'up' ? (
        <AgentBubble title="表现肯定">
          <p>{change.praiseText}</p>
          {change.keepAdvice ? (
            <p className="muted" style={{ marginTop: 8 }}>
              保持建议：{change.keepAdvice}
            </p>
          ) : null}
        </AgentBubble>
      ) : null}

      {change.changeType === 'flat' ? (
        <AgentBubble title="持平说明与提升建议">
          <p>{change.explainText}</p>
          {change.improveSuggestions?.map((s, i) => (
            <div key={i} className="attr-suggestion">
              <div>{s.suggestion}</div>
              <div className="muted attr-suggestion__meta">
                → {TARGET_MODULE_LABELS[s.targetModule]} · {s.expectedEffect}（只出方案，不执行）
              </div>
            </div>
          ))}
        </AgentBubble>
      ) : null}

      {/* ④ 复盘（如有） */}
      {change.reviewResult ? (
        <AgentBubble title="复盘结果">
          <p>
            <span
              className={`badge ${
                change.reviewResult === 'success'
                  ? 'badge--success'
                  : change.reviewResult === 'partial'
                    ? 'badge--warning'
                    : 'badge--danger'
              }`}
            >
              {change.reviewResult === 'success'
                ? '起效'
                : change.reviewResult === 'partial'
                  ? '部分改善'
                  : '无效'}
            </span>{' '}
            {change.reviewNote}
          </p>
        </AgentBubble>
      ) : null}
    </div>
  )
}

/* ── 归因报告主视图：左清单 + 右详情 ───────────────────────────── */

export function AttributionReportView() {
  const { attributionReport, attributionChangeId, selectAttributionChange } = useWorkbench()
  const changes = attributionReport.changes
  const activeId = attributionChangeId ?? changes[0]?.id ?? null
  const active = changes.find((c) => c.id === activeId) ?? changes[0]

  const downCount = changes.filter((c) => c.changeType === 'down').length
  const upCount = changes.filter((c) => c.changeType === 'up').length
  const flatCount = changes.filter((c) => c.changeType === 'flat').length

  return (
    <div className="stack">
      <div className="report-banner">
        <div>
          <h1 className="report-banner__title">业务指标归因分析</h1>
          <p className="report-banner__sub">
            周期 {attributionReport.periodLabel} · 生成于 {attributionReport.generatedAt} · 下次分析{' '}
            {attributionReport.nextAnalysisAt}
          </p>
        </div>
        <div className="attr-summary">
          <span className="attr-summary__pill attr-summary__pill--down">异常 {downCount}</span>
          <span className="attr-summary__pill attr-summary__pill--up">提升 {upCount}</span>
          <span className="attr-summary__pill attr-summary__pill--flat">持平 {flatCount}</span>
        </div>
      </div>

      <div className="attr-layout">
        {/* 左侧：变化清单 */}
        <aside className="attr-list card">
          <div className="attr-list__head muted">本期变化（{changes.length}）</div>
          {changes.map((c) => (
            <ChangeListItem
              key={c.id}
              change={c}
              active={c.id === active?.id}
              onSelect={() => selectAttributionChange(c.id)}
            />
          ))}
        </aside>

        {/* 右侧：Agent 对话详情 */}
        <section className="attr-detail-pane card">
          {active ? (
            <ChangeDetail change={active} />
          ) : (
            <p className="muted">请选择左侧变化查看归因详情</p>
          )}
        </section>
      </div>
    </div>
  )
}
