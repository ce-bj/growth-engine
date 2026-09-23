import { Check, Loader2, ScanSearch, CheckCircle2, Zap } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useWorkbench } from '../context/WorkbenchContext'

/** 6 个诊断维度，对齐检测明细.xlsx 的 22 项检测，stepIdxs 连续不交错 */
const PHASES = [
  {
    id: 'tech',
    num: '01',
    label: '技术与性能',
    desc: '速度与可用性',
    icon: '⚡',
    stepIdxs: [0, 1, 2],
    items: ['SSL / HTTPS', '死链 / 4xx', 'Sitemap'],
  },
  {
    id: 'seo',
    num: '02',
    label: 'SEO 友好度',
    desc: '可被检索',
    icon: '🔍',
    stepIdxs: [3, 4, 5, 6, 7, 8],
    items: ['Title', 'Description', 'Alt 文本', 'H1 层级', 'robots 拦截', '内链 robots'],
  },
  {
    id: 'geo',
    num: '03',
    label: 'GEO 友好度',
    desc: 'AI 可理解',
    icon: '🤖',
    stepIdxs: [9, 10, 11, 12],
    items: ['JSON-LD', 'FAQ/Breadcrumb', 'llms.txt', 'og 属性'],
  },
  {
    id: 'content',
    num: '04',
    label: '内容质量',
    desc: '原创与结构',
    icon: '📝',
    stepIdxs: [13, 14, 15, 16],
    items: ['内容重复度', '内容过短', '占位假文本', '更新频率'],
  },
  {
    id: 'compliance',
    num: '05',
    label: '全球合规',
    desc: '隐私与合规',
    icon: '🛡',
    stepIdxs: [17, 18, 19],
    items: ['Cookie 弹窗', 'SSL 合规', '隐私政策'],
  },
  {
    id: 'conversion',
    num: '06',
    label: '商业转化',
    desc: '留资与联系',
    icon: '🎯',
    stepIdxs: [20, 21, 22, 23],
    items: ['CTA 入口', '联系通道', '按钮文字', '链接锚文本'],
  },
]

/** 收尾步骤：生成报告（不属于六维之一） */
const FINALIZE_STEP = 24

const TOTAL_STEPS = 24

export function ScanProgressView() {
  const { scanCompleted } = useWorkbench()

  // 圆环：单条 RAF 循环，每帧朝「逐项目标比例」平滑逼近（lerp）→ 跟随逐项速度、无逐帧重启抖动
  const scanRef = useRef(scanCompleted)
  scanRef.current = scanCompleted
  const [displayPct, setDisplayPct] = useState(0)
  useEffect(() => {
    let raf = 0
    const tick = () => {
      setDisplayPct((prev) => {
        const target = (scanRef.current / TOTAL_STEPS) * 100
        const diff = target - prev
        if (Math.abs(diff) < 0.15) return target
        return prev + diff * 0.12
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const pct = Math.round(displayPct)

  const finalizing = scanCompleted >= FINALIZE_STEP
  const currentPhase = finalizing
    ? null
    : PHASES.find((p) => p.stepIdxs.includes(scanCompleted))

  // 圆环参数（紧凑）
  const size = 200
  const stroke = 12
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dashOffset = circ * (1 - displayPct / 100)
  const angle = (displayPct / 100) * 2 * Math.PI - Math.PI / 2

  return (
    <div className="scan-page-v2">
      <div className="scan-stage">
        {/* ── Hero ─────────────────────────────────── */}
        <div className="scan-hero">
          <div className="scan-icon-badge">
            <span className="scan-icon-badge__pulse" />
            <span className="scan-icon-badge__pulse scan-icon-badge__pulse--delay" />
            <ScanSearch size={26} strokeWidth={2.2} />
          </div>
          <h1 className="scan-title">AI 正在为您深度诊断</h1>
          <p className="scan-subtitle">
            已完成 <b>{pct}%</b>
            <span className="scan-subtitle__sep">·</span>
            当前阶段：<b>{finalizing ? '生成报告' : currentPhase?.label ?? '准备中'}</b>
          </p>
        </div>

        {/* ── 圆环（一条连续整体） ───────────────────── */}
        <div className="scan-ring-card">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="scan-ring">
            <defs>
              <linearGradient id="scanRingGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#4338ca" />
              </linearGradient>
            </defs>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef0f7" strokeWidth={stroke} />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="url(#scanRingGrad)"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
            {displayPct > 0 && (
              <circle
                cx={size / 2 + Math.cos(angle) * r}
                cy={size / 2 + Math.sin(angle) * r}
                r={6}
                fill="#fff"
                stroke="url(#scanRingGrad)"
                strokeWidth={2}
              />
            )}
            <text
              x="50%"
              y="48%"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="38"
              fontWeight="800"
              fill="#0f172a"
              style={{ letterSpacing: '-1px' }}
            >
              {pct}%
            </text>
            <text
              x="50%"
              y="66%"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="9"
              fill="#94a3b8"
              style={{ letterSpacing: '1.5px' }}
            >
              DIAGNOSIS
            </text>
          </svg>
        </div>

        {/* ── 5 阶段卡片（每项独立勾选，顺序完成） ───── */}
        <div className="scan-phases">
          {PHASES.map((phase) => {
            const doneCount = phase.stepIdxs.filter((i) => i < scanCompleted).length
            const total = phase.stepIdxs.length
            const phasePct = Math.round((doneCount / total) * 100)

            const state =
              doneCount >= total ? 'done' : doneCount === 0 ? 'pending' : 'active'

            return (
              <div key={phase.id} className={`phase-card phase-card--${state}`}>
                <div className="phase-card__head">
                  <span className="phase-card__icon">{phase.icon}</span>
                  <span className={`phase-card__state phase-card__state--${state}`}>
                    {state === 'done' && <CheckCircle2 size={11} />}
                    {state === 'active' && <Loader2 size={11} className="spin" />}
                    {state === 'pending' && <Zap size={11} />}
                    <span>
                      {state === 'done' ? '已完成' : state === 'active' ? '进行中' : '待启动'}
                    </span>
                  </span>
                </div>

                <div className="phase-card__title">{phase.label}</div>
                <div className="phase-card__desc">{phase.desc}</div>

                {/* 每项独立勾选列表 */}
                <div className="phase-checklist">
                  {phase.items.map((item, j) => {
                    const gIdx = phase.stepIdxs[j]
                    const itemState =
                      gIdx < scanCompleted ? 'done' : gIdx === scanCompleted ? 'active' : 'pending'
                    return (
                      <div key={item} className={`check-item check-item--${itemState}`}>
                        <span className="check-item__mark">
                          {itemState === 'done' && <Check size={10} strokeWidth={3} />}
                          {itemState === 'active' && <Loader2 size={10} className="spin" />}
                          {itemState === 'pending' && <span className="check-item__dot" />}
                        </span>
                        <span className="check-item__label">{item}</span>
                      </div>
                    )
                  })}
                </div>

                <div className="phase-card__bar-wrap">
                  <div className="phase-card__bar" style={{ width: `${phasePct}%` }} />
                </div>

                <div className="phase-card__foot mono">
                  <span className="phase-card__num">{phase.num}</span>
                  <span className="phase-card__count">
                    {doneCount}/{total}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── 收尾：生成综合评分与报告 ───────────────── */}
        <div className={`scan-finalize ${finalizing ? 'scan-finalize--active' : ''}`}>
          {finalizing ? (
            <>
              <Loader2 size={14} className="spin" />
              <span>正在生成综合评分与诊断报告…</span>
            </>
          ) : (
            <>
              <span className="scan-finalize__dot" />
              <span>检测完成后自动生成综合评分报告</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}