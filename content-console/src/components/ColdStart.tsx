import { useStore } from '../store'

export function ColdStart() {
  const { directions, confirmDirection, navigate } = useStore()
  const pending = directions.filter((d) => d.status === 'pending')
  if (pending.length === 0) return null

  return (
    <section className="cold-start">
      <div className="section-head">
        <h2>冷启动推荐任务</h2>
        <p>网站刚上线，优化策略推荐以下发布任务，确认后开始产出内容</p>
      </div>
      {pending.map((d) => (
        <div className="cold-card" key={d.id}>
          <div className="cold-bar" />
          <div className="cold-body">
            <div className="cold-title">{d.title}</div>
            <div className="cold-sub">
              <span className="type-tag">{d.type}</span>
              <span>{d.freqText}{d.countText}</span>
            </div>
          </div>
          <div className="cold-acts">
            <button className="btn btn-ghost" onClick={() => navigate({ name: 'task-create', directionId: d.id })}>
              查看
            </button>
            <button className="btn btn-primary" onClick={() => confirmDirection(d.id)}>
              确认
            </button>
          </div>
        </div>
      ))}
    </section>
  )
}
