import { useState } from 'react'
import { TASK_STATUS_LABEL, taskStatus, useStore } from '../store'
import { moreItems } from '../taskActions'
import type { PublishTask } from '../types'

function taskCadence(t: PublishTask): string {
  return t.freqText === '仅一次' ? '仅一次产出' : t.freqText + ' ' + t.countText
}

function statusBadgeClass(st: string): string {
  return { draft: 'gray', pending: 'blue', active: 'ok', paused: 'warn', done: 'ok' }[st] || 'gray'
}

export function TaskArea() {
  const { tasks, navigate, togglePauseTask, cancelTask } = useStore()
  const [moreOpen, setMoreOpen] = useState<string | null>(null)

  const PREVIEW = 3
  const previewTasks = tasks.slice(0, PREVIEW)
  const hasMore = tasks.length > PREVIEW

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
    <section className="task-area">
      <div className="section-head">
        <div className="head-title">
          <h2>发布任务</h2>
          <span className="cnt">{tasks.length}</span>
        </div>
        <div className="head-acts">
          <button className="btn btn-ghost" onClick={() => navigate({ name: 'task-list' })}>
            查看全部
          </button>
          <button className="btn btn-primary" onClick={() => navigate({ name: 'task-create' })}>
            + 新建发布任务
          </button>
        </div>
      </div>

      <div className="task-list">
        {tasks.length === 0 ? (
          <div className="todo-empty">暂无发布任务</div>
        ) : (
          previewTasks.map((t) => {
            const st = taskStatus(t)
            return (
              <div
                className={'task-card' + (moreOpen === t.id ? ' menu-open' : '')}
                key={t.id}
                onClick={() => navigate({ name: 'task-detail', id: t.id })}
              >
                <div className="tk-bar" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="task-title">
                    <span>{t.title}</span>
                    <span className={'status-badge ' + statusBadgeClass(st)}>
                      {TASK_STATUS_LABEL[st]}
                    </span>
                    <span className="task-src">{t.from === 'manual' ? '手动创建' : '智能体推荐'}</span>
                  </div>
                  <div className="task-meta">
                    <span className="type-tag">{t.app} · {t.col}</span>
                    <span>{taskCadence(t)}</span>
                    <span>起始 {t.start}</span>
                  </div>
                </div>
                <div className="task-acts" onClick={(e) => e.stopPropagation()}>
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
                </div>
              </div>
            )
          })
        )}
      </div>

      {hasMore && (
        <div className="task-more">
          <button className="btn btn-ghost" onClick={() => navigate({ name: 'task-list' })}>
            查看全部任务（共 {tasks.length} 条）
          </button>
        </div>
      )}
    </section>
  )
}
