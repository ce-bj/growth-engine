import { useStore } from '../store'
import type { View } from '../store'

export function DataBar() {
  const { stats, navigate } = useStore()
  const metrics: { label: string; value: number; scope: View }[] = [
    { label: '累计发布内容', value: stats.total, scope: { name: 'data-list', scope: 'total' } },
    { label: '本周发布数', value: stats.thisWeek, scope: { name: 'data-list', scope: 'week' } },
    { label: '本月发布数', value: stats.thisMonth, scope: { name: 'data-list', scope: 'month' } },
    { label: '累计修正篇数', value: stats.fixed, scope: { name: 'data-list', scope: 'fix' } },
  ]
  return (
    <section className="stat-section">
      <div className="section-head">
        <h2>总计数据</h2>
        <p>已发布内容数量概览 · 点击数字查看明细</p>
      </div>
      <div className="data-bar">
        {metrics.map((m) => (
          <button type="button" className="data-metric" key={m.label} onClick={() => navigate(m.scope)}>
            <span className="data-label">{m.label}</span>
            <strong className="data-num">{m.value}</strong>
          </button>
        ))}
      </div>
    </section>
  )
}
