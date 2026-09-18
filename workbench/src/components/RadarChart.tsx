import type { DimensionScore } from '../types'

interface Props {
  dimensions: DimensionScore[]
  size?: number
  /** 手机端用柱状图替代雷达图（§17.4） */
  forceBars?: boolean
}

export function RadarChart({ dimensions, size = 240, forceBars }: Props) {
  const isNarrow =
    forceBars ?? (typeof window !== 'undefined' && window.innerWidth < 768)

  if (isNarrow) {
    return (
      <div className="stack" style={{ gap: 8 }}>
        {dimensions.map((d) => {
          const pct = (d.rawScore / d.rawMax) * 100
          return (
            <div key={d.key}>
              <div className="row row--between" style={{ marginBottom: 4 }}>
                <span className="muted">{d.name}</span>
                <span className="mono">
                  {d.rawScore}/{d.rawMax}
                </span>
              </div>
              <div className="progress">
                <div className="progress__bar" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const cx = size / 2
  const cy = size / 2
  const radius = size * 0.36
  const n = dimensions.length

  const pointAt = (i: number, ratio: number) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n
    return {
      x: cx + Math.cos(angle) * radius * ratio,
      y: cy + Math.sin(angle) * radius * ratio,
    }
  }

  const gridLevels = [0.25, 0.5, 0.75, 1]
  const valuePoints = dimensions
    .map((d, i) => {
      const p = pointAt(i, d.rawScore / d.rawMax)
      return `${p.x},${p.y}`
    })
    .join(' ')

  const shortName: Record<string, string> = {
    tech: '技术',
    content: '内容',
    seo: 'SEO',
    geo: 'GEO',
    compliance: '合规',
    conversion: '转化',
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="六维雷达图">
      <defs>
        <linearGradient id="radarFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366F1" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0.25" />
        </linearGradient>
        <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {gridLevels.map((lv) => {
        const pts = Array.from({ length: n }, (_, i) => {
          const p = pointAt(i, lv)
          return `${p.x},${p.y}`
        }).join(' ')
        return (
          <polygon
            key={lv}
            points={pts}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={1}
          />
        )
      })}
      {dimensions.map((_, i) => {
        const p = pointAt(i, 1)
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="#E2E8F0"
            strokeWidth={1}
          />
        )
      })}
      <polygon
        points={valuePoints}
        fill="url(#radarFill)"
        stroke="#6366F1"
        strokeWidth={2.5}
        filter="url(#radarGlow)"
      />
      {dimensions.map((d, i) => {
        const p = pointAt(i, 1.22)
        return (
          <text
            key={d.key}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={12}
            fill="#64748B"
          >
            {shortName[d.key] ?? d.name}
          </text>
        )
      })}
      {dimensions.map((d, i) => {
        const p = pointAt(i, d.rawScore / d.rawMax)
        return <circle key={`dot-${d.key}`} cx={p.x} cy={p.y} r={4.5} fill="#fff" stroke="#6366F1" strokeWidth={2.5} />
      })}
    </svg>
  )
}
