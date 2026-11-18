import { useStore } from '../store'

const MAP_AI_FIELDS = ['标题', '关键词', '正文', '概要', '图片']

export function TaskDetailView({ id }: { id: string }) {
  const { tasks, navigate } = useStore()
  const t = tasks.find((x) => x.id === id)

  if (!t) {
    return (
      <div className="page">
        <div className="page-head">
          <button className="btn btn-ghost" onClick={() => navigate({ name: 'task-list' })}>‹ 返回</button>
          <h2>任务详情</h2>
        </div>
        <div className="todo-empty">未找到该任务，可能已被取消</div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-head">
        <button className="btn btn-ghost" onClick={() => navigate({ name: 'task-list' })}>‹ 返回</button>
        <h2>任务详情</h2>
      </div>

      <div className="detail-card detail-full">
        <div className="detail-title-row">
          <div className="detail-title">{t.title}</div>
        </div>

        <div className="detail-sec">
          <div className="detail-sec-h">基本信息</div>
          <DetailRow k="任务 ID" v={t.taskNo} />
          <DetailRow k="任务标题" v={t.title} />
          <DetailRow k="内容主题" v={t.topic} />
          <DetailRow k="关键词" v={t.kw.join('、')} />
          <DetailRow k="配图" v={t.imgOn ? '开启（生成后需人工审核）' : '不开启'} />
        </div>

        <div className="detail-sec">
          <div className="detail-sec-h">推送设置</div>
          <DetailRow k="推送应用" v={t.app} />
          <DetailRow k="推送栏目" v={t.col} />
          <div className="detail-row">
            <span className="detail-k">数据映射</span>
            <div className="detail-map">
              {MAP_AI_FIELDS.map((ai, i) => (
                <div className="detail-map-row" key={ai}>
                  <span>{ai}</span>
                  <span className="arr">»</span>
                  <span>{t.map[i] || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="detail-sec">
          <div className="detail-sec-h">推送规则</div>
          <DetailRow k="推送频率" v={t.freqText} />
          <DetailRow k="推送数量" v={t.countText} />
          <DetailRow k="开始时间" v={t.start} />
          <DetailRow k="创建时间" v={t.createdAt} />
          <DetailRow k="下次产出" v={t.next || '不再排产'} />
          <DetailRow k="内容状态" v={t.mode === 'review' ? '待审核' : '立即发布'} />
          {t.note && <DetailRow k="任务说明" v={t.note} />}
        </div>
      </div>
    </div>
  )
}

function DetailRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="detail-row">
      <span className="detail-k">{k}</span>
      <span className="detail-v">{v}</span>
    </div>
  )
}
