interface Props {
  values: number[]
  color?: string
}

export function Sparkline({ values, color = '#6366F1' }: Props) {
  if (values.length < 2) return null
  const w = 280
  const h = 64
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = Math.max(max - min, 1)
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w
      const y = h - 8 - ((v - min) / range) * (h - 16)
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg className="sparkline" viewBox={`0 0 ${w} ${h}`} width="100%" height={64} aria-hidden>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        points={pts}
      />
    </svg>
  )
}
