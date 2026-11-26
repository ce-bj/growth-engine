import { useEffect, useState } from 'react'
import { TASK_STATUS_LABEL, taskStatus, useStore } from '../store'
import { moreItems } from '../taskActions'
import type { PublishTask } from '../types'

const PAGE_SIZE = 10

function statusBadgeClass(st: string): string {
  return { draft: 'gray', pending: 'blue', active: 'ok', paused: 'warn', done: 'ok' }[st] || 'gray'
}

function topicCount(t: PublishTask): number {
  return t.topic.split('/').map((s) => s.trim()).filter(Boolean).length
}

export function TaskListView() {
  const { tasks, store, cancelTask, togglePauseTask, navigate, handoffTitle, handoffIntent } = useStore()
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (handoffIntent !== 'list' || !handoffTitle) return
    const index = tasks.findIndex((item) => item.title === handoffTitle)
    if (index < 0) return
    const target = Math.floor(index / PAGE_SIZE) + 1
    setPage((current) => (current === target ? current : target))
  }, [handoffIntent, handoffTitle, tasks])

  useEffect(() => {
    if (handoffIntent !== 'list' || !handoffTitle) return
    document.querySelector('.list-table tr.is-handoff')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [handoffIntent, handoffTitle, page, tasks])
  const [moreOpen, setMoreOpen] = useState<string | null>(null)

  const total = tasks.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const cur = Math.min(page, totalPages)
  const startIdx = (cur - 1) * PAGE_SIZE
  const pageTasks = tasks.slice(startIdx, startIdx + PAGE_SIZE)

  // 每个任务已推送文章数（从内容库统计）
  const publishedByTask = (tid: string): number =>
    store.filter((r) => r.tid === tid && r.published).length

  const handleMore = (key: string, id: string) => {
    setMoreOpen(null)
    switch (key) {
      case 'pause':
      case 'resume':
        togglePauseTask(id)
        break
      case 'cancel':
      case 'delete':
        cancelTask(id)
        break
      case 'edit':
        navigate({ name: 'task-detail', id })
        break
      case 'copy':
        alert('已复制该任务配置')
        break
      case 'log':
        navigate({ name: 'task-log', id })
        break
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <button className="btn btn-ghost" onClick={() => navigate({ name: 'home' })}>‹ 返回</button>
        <h2>发布任务</h2>
        <div className="head-acts">
          <button className="btn btn-primary" onClick={() => navigate({ name: 'task-create' })}>
            + 新建发布任务
          </button>
        </div>
      </div>

      {total === 0 ? (
        <div className="todo-empty">暂无发布任务</div>
      ) : (
        <div className="table-wrap">
          <table className="list-table">
            <thead>
              <tr>
                <th>任务 ID</th>
                <th>任务名称</th>
                <th className="col-num">任务主题数量</th>
                <th className="col-num">关键词数量</th>
                <th className="col-num">已推送文章</th>
                <th>开始推送时间</th>
                <th>任务状态</th>
                <th>创建时间</th>
                <th className="col-acts">操作</th>
              </tr>
            </thead>
            <tbody>
              {pageTasks.map((t) => {
                const st = taskStatus(t)
                return (
                  <tr key={t.id} className={handoffTitle === t.title ? 'is-handoff' : undefined}>
                    <td className="td-mono">{t.taskNo}</td>
                    <td className="td-title">{t.title}</td>
                    <td className="col-num">{topicCount(t)}</td>
                    <td className="col-num">{t.kw.length}</td>
                    <td className="col-num">{publishedByTask(t.id)}</td>
                    <td>{t.start}</td>
                    <td>
                      <span className={'status-badge ' + statusBadgeClass(st)}>
                        {TASK_STATUS_LABEL[st]}
                      </span>
                    </td>
                    <td>{t.createdAt}</td>
                    <td className="col-acts">
                      <div className="row-acts">
                        <button className="link-btn" onClick={() => navigate({ name: 'task-detail', id: t.id })}>
                          查看
                        </button>
                        <span className="act-sep">|</span>
                        <div className="more-wrap">
                          <button
                            className="link-btn"
                            onClick={() => setMoreOpen(moreOpen === t.id ? null : t.id)}
                          >
                            更多 ▾
                          </button>
                          {moreOpen === t.id && (
                            <div className="more-menu">
                              {moreItems(st).map((item) => (
                                <button
                                  key={item.key}
                                  className={item.danger ? 'danger-item' : ''}
                                  onClick={() => handleMore(item.key, t.id)}
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <Pagination page={cur} totalPages={totalPages} total={total} onChange={setPage} />
        </div>
      )}
    </div>
  )
}

function Pagination({ page, totalPages, total, onChange }: { page: number; totalPages: number; total: number; onChange: (p: number) => void }) {
  return (
    <div className="pagination">
      <span className="pg-info">共 {total} 条 · 每页 {PAGE_SIZE} 条</span>
      <div className="pg-btns">
        <button className="pg-btn" disabled={page <= 1} onClick={() => onChange(page - 1)}>‹ 上一页</button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            className={'pg-btn' + (p === page ? ' on' : '')}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        ))}
        <button className="pg-btn" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>下一页 ›</button>
      </div>
    </div>
  )
}
