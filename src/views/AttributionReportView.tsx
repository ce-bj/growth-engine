import { useWorkbench } from '../context/WorkbenchContext'
import type {
  AttributionChange,
  AttributionMeasure,
  ChangeType,
  ExecutionBoundary,
} from '../types'
import {
  FUNNEL_SEGMENT_LABELS,
} from '../types'

/* ── 标签与样式映射（对齐方法论 v1.11：定边界与交接） ─────────────── */

const CHANGE_TYPE_META: Record<ChangeType, { label: string; cls: string }> = {
  down: { label: '异常', cls: 'badge--danger' },
  up: { label: '提升', cls: 'badge--success' },
  flat: { label: '持平', cls: 'badge--neutral' },
}

const CONFIDENCE_LABEL = { high: '高', medium: '中', low: '低' } as const

const COST_LABEL = { low: '低', medium: '中', high: '高' } as const
const TIME_LABEL = { instant: '立即', day: '当天', week: '一周', month: '一月' } as const
const BOUNDARY_LABEL: Record<ExecutionBoundary, string> = {
  auto: '可直接修复',
  confirm: '确认后交接',
  advice_only: '仅展示',
}

const EXEC_STATUS_CLS: Record<
  NonNullable<AttributionMeasure['execStatus']>,
  string
> = {
  pending_confirm: 'badge--warning',
  executing: 'badge--info',
  success: 'badge--success',
  failed: 'badge--danger',
  rejected: 'badge--neutral',
  advice_only: 'badge--neutral',
}

/** 按三档边界区分状态文案：内容交接 / 健康度直修 / 站外仅展示 */
function getExecStatusLabel(
  measure: AttributionMeasure,
  changeReviewed?: boolean,
): string {
  const status = measure.execStatus ?? 'pending_confirm'
  const boundary = measure.suggestedBoundary
  if (status === 'advice_only' || boundary === 'advice_only') return '仅展示'
  if (status === 'rejected') return '已忽略'
  if (status === 'failed') return '失败'
  if (boundary === 'auto') {
    if (status === 'pending_confirm') return '待修复'
    if (status === 'executing') return '修复中'
    if (status === 'success') return changeReviewed ? '已复盘' : '已修复'
  }
  // 内容类：确认后交接 → 发布 → 复盘
  if (status === 'pending_confirm') return '待确认'
  if (status === 'executing') return '交接中'
  if (status === 'success') {
    if (changeReviewed) return '已复盘'
    if (measure.contentPublished) {
      return `已发布 · 待复盘 ${measure.reviewPeriod ?? 'T+7'}`
    }
    return '已交接'
  }
  return status
}

/** 清单上的方案处理状态 */
function getActionStatus(change: AttributionChange): { label: string; cls: string } {
  if (change.changeType === 'up') return { label: '无需交接', cls: 'badge--success' }
  if (change.changeType === 'flat') return { label: '仅建议', cls: 'badge--neutral' }

  const measures = change.measures ?? []
  if (measures.length === 0) return { label: '仅建议', cls: 'badge--neutral' }

  const actionable = measures.filter((m) => m.suggestedBoundary !== 'advice_only')
  if (actionable.length === 0) return { label: '仅建议', cls: 'badge--neutral' }

  if (actionable.every((m) => m.execStatus === 'rejected')) {
    return { label: '已忽略', cls: 'badge--neutral' }
  }
  if (actionable.some((m) => m.execStatus === 'success' || m.execStatus === 'executing')) {
    return { label: '已采纳', cls: 'badge--success' }
  }
  return { label: '待处理', cls: 'badge--warning' }
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
  const action = getActionStatus(change)
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
        <span className={`badge ${action.cls}`}>{action.label}</span>
        <span className="attr-change-item__amount">{change.changeAmount}</span>
      </div>
      <div className="attr-change-item__metric">{change.changedMetric}</div>
      <div className="attr-change-item__sub">
        {change.changedValue}（上期 {change.baselineValue}）· {FUNNEL_SEGMENT_LABELS[change.funnelSegment]}
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
  changeReviewed,
  onConfirm,
  onIgnore,
  onOpenContentTask,
  onSimulatePublish,
  onRunReview,
}: {
  measure: AttributionMeasure
  changeReviewed: boolean
  onConfirm: () => void
  onIgnore: () => void
  onOpenContentTask: (taskId: string) => void
  onSimulatePublish: () => void
  onRunReview: () => void
}) {
  const status = measure.execStatus ?? 'pending_confirm'
  const statusCls = EXEC_STATUS_CLS[status]
  const statusLabel = getExecStatusLabel(measure, changeReviewed)
  const actionable = measure.suggestedBoundary !== 'advice_only'
  const isHealthFix = measure.suggestedBoundary === 'auto'
  const confirmLabel = isHealthFix ? '开始修复' : '确认并交给内容运营'
  const handedOff =
    !isHealthFix && measure.execStatus === 'success' && Boolean(measure.contentTaskId)
  const canSimulatePublish =
    handedOff && measure.demoPublishEnabled && !measure.contentPublished && !changeReviewed
  const canRunReview =
    handedOff && measure.demoPublishEnabled && measure.contentPublished && !changeReviewed
  return (
    <div className="attr-measure">
      <div className="attr-measure__head">
        <span className={`badge ${statusCls}`}>{statusLabel}</span>
        <span className="badge badge--neutral">{BOUNDARY_LABEL[measure.suggestedBoundary]}</span>
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
        {measure.reviewPeriod ? ` · 复盘 ${measure.reviewPeriod}` : ''}
        {measure.contentPublishedAt ? ` · 发布于 ${measure.contentPublishedAt}` : ''}
      </div>

      {/* 交接/修复后的可查看产出 */}
      {measure.deliverable &&
      (measure.execStatus === 'success' || measure.execStatus === 'executing') ? (
        <div className="attr-deliverable">
          <div className="attr-deliverable__head">
            <span className="badge badge--success">
              {isHealthFix ? '修复结果' : measure.contentPublished ? '已发布' : '交接回执'}
            </span>
            <span className="attr-deliverable__title">{measure.deliverable.title}</span>
            {measure.deliverable.url && (isHealthFix || measure.contentPublished) ? (
              <a
                className="attr-deliverable__link"
                href={measure.deliverable.url}
                target="_blank"
                rel="noreferrer"
              >
                查看 →
              </a>
            ) : null}
          </div>
          {measure.deliverable.previewNote ? (
            <div className="muted attr-deliverable__note">{measure.deliverable.previewNote}</div>
          ) : null}
        </div>
      ) : null}

      {actionable && measure.execStatus === 'pending_confirm' ? (
        <div className="row" style={{ gap: 8, marginTop: 10 }}>
          <button type="button" className="btn btn--primary btn--sm" onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button type="button" className="btn btn--text btn--sm" onClick={onIgnore}>
            忽略
          </button>
        </div>
      ) : null}

      {handedOff && measure.contentTaskId ? (
        <div className="row" style={{ gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => onOpenContentTask(measure.contentTaskId!)}
          >
            在内容运营查看
          </button>
          {canSimulatePublish ? (
            <button type="button" className="btn btn--primary btn--sm" onClick={onSimulatePublish}>
              模拟已发布
            </button>
          ) : null}
          {canRunReview ? (
            <button type="button" className="btn btn--primary btn--sm" onClick={onRunReview}>
              模拟复盘到期
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

/* ── 右侧 · 归因详情（Agent 对话式） ────────────────────────────── */

function ChangeDetail({ change }: { change: AttributionChange }) {
  const {
    confirmMeasure,
    ignoreMeasure,
    openContentTaskFromAttribution,
    markMeasureContentPublished,
    runMeasureReview,
  } = useWorkbench()
  const meta = CHANGE_TYPE_META[change.changeType]
  const action = getActionStatus(change)
  const changeReviewed = Boolean(change.reviewResult)
  return (
    <div className="attr-detail">
      <div className="attr-detail__head">
        <span className={`badge ${meta.cls}`} style={{ fontSize: 13, padding: '3px 10px' }}>
          {meta.label}
        </span>
        <span className={`badge ${action.cls}`} style={{ fontSize: 13, padding: '3px 10px', marginLeft: 6 }}>
          {action.label}
        </span>
        <h3 className="attr-detail__title">
          {change.changedMetric} · {change.changeAmount}
        </h3>
        <div className="muted">
          本期 {change.changedValue} · 上期 {change.baselineValue} ·{' '}
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

      {/* ② 意图数据下钻（如有，调 L3 搜索意图精准匹配） */}
      {change.intentData ? (
        <AgentBubble title="意图数据下钻（调 L3 搜索意图精准匹配）">
          <ul className="agent-evidence">
            {change.intentData.siteSearch ? (
              <li>
                <b>站内搜索</b>：{change.intentData.siteSearch}
              </li>
            ) : null}
            {change.intentData.inboundKeyword ? (
              <li>
                <b>来路关键词</b>：{change.intentData.inboundKeyword}
              </li>
            ) : null}
            {change.intentData.csIntent ? (
              <li>
                <b>客服对话意图</b>：{change.intentData.csIntent}
              </li>
            ) : null}
          </ul>
        </AgentBubble>
      ) : null}

      {/* ③ 结论 + 证据 */}
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

      {/* ④ 应对产出：按变化类型区分 */}
      {change.changeType === 'down' && change.measures ? (
        <AgentBubble title="任务说明 / 应对方案">
          {change.measures.map((m) => (
            <MeasureCard
              key={m.measureId}
              measure={m}
              changeReviewed={changeReviewed}
              onConfirm={() => confirmMeasure(change.id, m.measureId)}
              onIgnore={() => ignoreMeasure(change.id, m.measureId)}
              onOpenContentTask={(taskId) => openContentTaskFromAttribution(taskId, 0)}
              onSimulatePublish={() => markMeasureContentPublished(change.id, m.measureId)}
              onRunReview={() => runMeasureReview(change.id, m.measureId)}
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
                {s.expectedEffect}（仅建议，不交接）
              </div>
            </div>
          ))}
        </AgentBubble>
      ) : null}

      {/* ⑤ 复盘（如有） */}
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
  const {
    attributionReport,
    attributionReports,
    activeAttributionReport,
    attributionChangeId,
    selectAttributionReport,
    selectAttributionChange,
  } = useWorkbench()
  const report = activeAttributionReport
  const isCurrent = report.id === attributionReport.id
  const changes = report.changes
  const activeId = attributionChangeId ?? changes[0]?.id ?? null
  const active = changes.find((c) => c.id === activeId) ?? changes[0]

  const downCount = changes.filter((c) => c.changeType === 'down').length
  const upCount = changes.filter((c) => c.changeType === 'up').length
  const flatCount = changes.filter((c) => c.changeType === 'flat').length

  return (
    <div className="stack">
      {/* 周期切换：一个周期一份报告，同一指标在一个周期只有一条主线 */}
      <div className="report-tabs attr-period-tabs">
        {attributionReports.map((r) => (
          <button
            key={r.id}
            type="button"
            className={`report-tab${r.id === report.id ? ' report-tab--active' : ''}`}
            onClick={() => selectAttributionReport(r.id)}
          >
            {r.id === attributionReport.id ? '本期 · ' : ''}
            {r.periodLabel}
          </button>
        ))}
      </div>

      <div className="report-banner">
        <div>
          <h1 className="report-banner__title">业务指标归因分析</h1>
          <p className="report-banner__sub">
            周期 {report.periodLabel} · 生成于 {report.generatedAt}
            {isCurrent ? ` · 下次分析 ${report.nextAnalysisAt}` : ''}
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
          <div className="attr-list__head muted">
            {isCurrent ? '本期变化' : '该期变化'}（{changes.length}）
          </div>
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
