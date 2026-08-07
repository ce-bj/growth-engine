import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '../components/Button'
import { RadarChart } from '../components/RadarChart'
import { useWorkbench } from '../context/WorkbenchContext'
import { formatDelta, scoreColor, scoreLevel, scoreLevelBadgeClass, scoreLevelLabel } from '../lib/score'
import type { FixMode, IssueItem } from '../types'
import { AttributionReportView } from './AttributionReportView'

function PriorityBadge({ p }: { p: IssueItem['priority'] }) {
  if (p === 'P0') return <span className="badge badge--danger">P0</span>
  if (p === 'P1') return <span className="badge badge--warning">P1</span>
  return <span className="badge badge--neutral">P2</span>
}

function healthFixCta(mode: FixMode, weak?: boolean) {
  if (mode === 'manual' || mode === 'guide') return '查看指引'
  if (weak) return '优先修复'
  return '立即修复'
}

function dimensionFixMode(issues: IssueItem[], dimensionKey: IssueItem['dimensionKey']): FixMode {
  const related = issues.filter((i) => i.dimensionKey === dimensionKey)
  if (related.some((i) => i.fixMode === 'manual')) return 'manual'
  if (related.some((i) => i.fixMode === 'guide')) return 'guide'
  return 'auto'
}

/** 圆形分数环 */
function ScoreRing({ score, color }: { score: number; color: string }) {
  const size = 168
  const stroke = 14
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(1, score / 100))
  return (
    <svg width={size} height={size} className="score-ring" viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef2f7" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.7s ease' }}
      />
      <text x="50%" y="44%" textAnchor="middle" dominantBaseline="middle" fontSize="46" fontWeight="800" fill={color}>
        {score}
      </text>
      <text x="50%" y="62%" textAnchor="middle" dominantBaseline="middle" fontSize="14" fill="#94a3b8">
        综合健康度
      </text>
    </svg>
  )
}

/** PRD §6 诊断报告 */
export function ReportView() {
  const {
    health,
    issues,
    priorityIssues,
    p0Count,
    p1Count,
    p2Issues,
    showP2,
    setShowP2,
    weakestDimensionKey,
    startFixIssue,
    startFixDimension,
    exportPdf,
    exportingPdf,
    reportInitialTab,
  } = useWorkbench()

  const [tab, setTab] = useState<'health' | 'attribution'>(reportInitialTab)

  const level = scoreLevel(health.totalScore)
  const delta = formatDelta(health.totalScore, health.previousScore)
  const allGreen = priorityIssues.length === 0 && p2Issues.length === 0

  if (tab === 'attribution') {
    return (
      <div className="stack">
        <div className="report-tabs">
          <button type="button" className="report-tab" onClick={() => setTab('health')}>
            网站健康度
          </button>
          <button type="button" className="report-tab report-tab--active" onClick={() => setTab('attribution')}>
            业务指标归因
          </button>
        </div>
        <AttributionReportView />
      </div>
    )
  }

  const dimColor = (raw: number, max: number) => {
    const pct = (raw / max) * 100
    if (pct >= 70) return '#22c55e'
    if (pct >= 40) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div className="stack">
      {/* Tab 切换 */}
      <div className="report-tabs">
        <button type="button" className="report-tab report-tab--active" onClick={() => setTab('health')}>
          网站健康度
        </button>
        <button type="button" className="report-tab" onClick={() => setTab('attribution')}>
          业务指标归因
        </button>
      </div>

      {/* 顶部横幅 */}
      <div className="report-banner">
        <div>
          <h1 className="report-banner__title">网站健康度诊断报告</h1>
          <p className="report-banner__sub">
            六维评分 · 问题清单 · 按优先级修复 · 检测于 {health.detectedAt}
          </p>
        </div>
        <Button variant="secondary" onClick={exportPdf} disabled={exportingPdf} className="report-banner__btn">
          <Download size={16} />
          {exportingPdf ? '导出中…' : '导出 PDF'}
        </Button>
      </div>

      {/* 分数环 + 雷达图 */}
      <section className="card report-hero">
        <div className="report-hero__left">
          <ScoreRing score={health.totalScore} color={scoreColor(health.totalScore)} />
          <div className="report-hero__meta">
            <span className={scoreLevelBadgeClass(level)} style={{ fontSize: 14, padding: '4px 12px' }}>
              {scoreLevelLabel(level)}
            </span>
            <span className={delta.up ? 'delta--up' : 'delta--down'} style={{ fontSize: 13 }}>
              较上次 {delta.text} 分
            </span>
          </div>
        </div>
        <div className="report-hero__right">
          <p className="report-hero__caption">六维能力雷达</p>
          <RadarChart dimensions={health.dimensions} />
          <div className="report-hero__legend">
            {health.dimensions.map((d) => (
              <span key={d.key} className="report-hero__legend-item">
                <i style={{ background: dimColor(d.rawScore, d.rawMax) }} />
                {d.name}
                <b className="mono">{d.rawScore}/{d.rawMax}</b>
              </span>
            ))}
          </div>
        </div>
      </section>

      {allGreen ? (
        <div className="card empty-state">
          <div className="empty-state__icon" style={{ color: 'var(--color-success)' }}>✓</div>
          <h2 className="empty-state__title">太棒了，您的网站暂无问题</h2>
          <p className="empty-state__desc">继续保持，系统会每周自动帮您巡检。</p>
        </div>
      ) : (
        <>
          <section className="card">
            <div className="section-header">
              <h2 className="card__title">
                需要立即处理
                <span className="report-count-group">
                  <span className="report-count report-count--p0">P0 × {p0Count}</span>
                  <span className="report-count report-count--p1">P1 × {p1Count}</span>
                </span>
              </h2>
            </div>
            <div className="issue-list">
              {priorityIssues.map((issue) => (
                <div key={issue.id} className={`issue-row issue-row--${issue.priority.toLowerCase()}`}>
                  <div className="issue-row__body">
                    <PriorityBadge p={issue.priority} />
                    <div className="issue-row__title">{issue.title}</div>
                    <p className="muted">{issue.description}</p>
                  </div>
                  <Button size="sm" onClick={() => startFixIssue(issue)}>
                    {healthFixCta(issue.fixMode)}
                  </Button>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="row row--between" style={{ marginBottom: 12 }}>
              <h2 className="card__title" style={{ marginBottom: 0 }}>
                其他问题（P2 × {p2Issues.length}）
              </h2>
              <Button variant="text" size="sm" onClick={() => setShowP2(!showP2)}>
                {showP2 ? '收起' : '查看全部'}
              </Button>
            </div>
            {showP2 ? (
              <div className="issue-list">
                {p2Issues.map((issue) => (
                  <div key={issue.id} className="issue-row issue-row--p2">
                    <div className="issue-row__body">
                      <PriorityBadge p={issue.priority} />
                      <div className="issue-row__title">{issue.title}</div>
                      <p className="muted">{issue.description}</p>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => startFixIssue(issue)}>
                      {healthFixCta(issue.fixMode)}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">点击「查看全部」展开 P2 问题清单</p>
            )}
          </section>
        </>
      )}

      <section className="card">
        <div className="section-header">
          <h2 className="card__title">六维得分 · 按维度修复</h2>
        </div>
        <div className="grid-6 dim-grid">
          {health.dimensions.map((d) => {
            const weak = d.key === weakestDimensionKey
            const color = dimColor(d.rawScore, d.rawMax)
            const pct = (d.rawScore / d.rawMax) * 100
            return (
              <div key={d.key} className={`dim-tile${weak ? ' dim-tile--weak' : ''}`}>
                <div className="dim-tile__head">
                  <span className="dim-tile__name">{d.name}</span>
                  {weak && <span className="badge badge--warning">最弱</span>}
                </div>
                <div className="dim-tile__score" style={{ color }}>
                  {d.rawScore}
                  <span className="dim-tile__score-max">/{d.rawMax}</span>
                </div>
                <div className="dim-tile__bar-wrap">
                  <div className="dim-tile__bar" style={{ width: `${pct}%`, background: color }} />
                </div>
                <Button size="sm" variant={weak ? 'primary' : 'secondary'} onClick={() => startFixDimension(d.key)}>
                  {healthFixCta(dimensionFixMode(issues, d.key), weak)}
                </Button>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
