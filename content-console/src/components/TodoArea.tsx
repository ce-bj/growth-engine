import { useState } from 'react'
import { TODO_SOURCE_LABEL, useStore } from '../store'
import type { TodoRow, TodoSource } from '../types'

// 来源胶囊配色
const SRC_CLASS: Record<TodoSource, string> = {
  'behavior-fix': 'src-fix',
  'behavior-new': 'src-new',
  'self-new': 'src-self',
}

export function TodoArea() {
  const { todos, publishTodo, cancelFix, reopenFix, gotoKb, continueAfterKb, navigate } = useStore()
  const [viewId, setViewId] = useState<string | null>(null)
  const viewed = todos.find((t) => t.id === viewId) || null

  return (
    <section className="todo-area">
      <div className="section-head">
        <h2><span className="ai-mark">策略产出</span>内容进展</h2>
        <p>优化策略与自建发布任务产出的内容，查看各类内容的处理与推送进度</p>
      </div>

      {todos.length === 0 ? (
        <div className="todo-empty">暂无内容进展</div>
      ) : (
        <div className="todo-list">
          {todos.map((t) => (
            <div className="todo-item" key={t.id}>
              <span className={'todo-bar ' + SRC_CLASS[t.source]} />
              <div className="todo-body">
                <div className="todo-title-row">
                  <span className="todo-title">{t.title}</span>
                  <span className={'src-badge ' + SRC_CLASS[t.source]}>
                    {TODO_SOURCE_LABEL[t.source]}
                  </span>
                  {t.needKb && <span className="kb-badge">待补知识</span>}
                </div>
                <div className="todo-sub">
                  <span className="type-tag">{t.type}</span>
                </div>
                {t.note && <div className="todo-note">{t.note}</div>}
                {t.needKb && (
                  <div className="kb-note">
                    ⚠ 该条依赖知识库「{t.kbName}」，知识库中暂无，请先补充后再继续生成。
                  </div>
                )}
              </div>
              <div className="todo-acts">
                {t.needKb ? (
                  <>
                    <button className="btn btn-ghost" onClick={() => gotoKb(t.id)}>
                      去补充知识
                    </button>
                    <button className="btn btn-primary" onClick={() => continueAfterKb(t.id)}>
                      补完继续生成
                    </button>
                  </>
                ) : t.source === 'behavior-fix' ? (
                  t.fixStatus === '已取消' ? (
                    <>
                      <span className="status-badge gray">已取消</span>
                      <button className="btn btn-ghost" onClick={() => setViewId(t.id)}>
                        查看详情
                      </button>
                    </>
                  ) : t.fixStatus === '重新生成中' ? (
                    <>
                      <span className="status-badge blue">重新生成中</span>
                      <button className="btn btn-ghost" onClick={() => setViewId(t.id)}>
                        查看
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="btn btn-ghost" onClick={() => setViewId(t.id)}>
                        查看
                      </button>
                      <button className="btn btn-primary" onClick={() => publishTodo(t.id)}>
                        立即发布
                      </button>
                      <button className="btn btn-ghost" onClick={() => cancelFix(t.id)}>
                        取消
                      </button>
                    </>
                  )
                ) : t.source === 'self-new' ? (
                  <span className={'status-badge ' + (t.pushStatus === '已推送' ? 'ok' : 'warn')}>
                    {t.pushStatus || '待推送'}
                  </span>
                ) : t.source === 'behavior-fix' ? (
                  t.fixStatus === '已完成' ? (
                    <span className="status-badge ok">已上线</span>
                  ) : (
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        publishTodo(t.id)
                        if (window.parent && window.parent !== window) {
                          window.parent.postMessage(
                            {
                              type: 'growth-flow-update',
                              action: 'publish',
                              focusKey: t.id,
                              title: t.title,
                            },
                            '*',
                          )
                        }
                      }}
                    >
                      确认发布上线
                    </button>
                  )
                ) : t.source === 'behavior-new' ? (
                  t.newPushStatus === '已推送' ? (
                    <span className="status-badge ok">已上线</span>
                  ) : (
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        publishTodo(t.id)
                        if (window.parent && window.parent !== window) {
                          window.parent.postMessage(
                            {
                              type: 'growth-flow-update',
                              action: 'publish',
                              focusKey: t.id,
                              title: t.title,
                            },
                            '*',
                          )
                        }
                      }}
                    >
                      确认发布上线
                    </button>
                  )
                ) : (
                  <>
                    <button className="btn btn-primary" onClick={() => publishTodo(t.id)}>
                      立即发布
                    </button>
                    <button className="btn btn-ghost" onClick={() => rejectTodo(t.id)}>
                      取消发布
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="task-more">
        <button className="btn btn-ghost" onClick={() => navigate({ name: 'data-list', scope: 'total' })}>
          查看历史
        </button>
      </div>

      {viewed && (
        <FixPreviewDrawer
          todo={viewed}
          onClose={() => setViewId(null)}
          onRelist={() => reopenFix(viewed.id)}
          onPublish={() => {
            publishTodo(viewed.id)
            setViewId(null)
          }}
        />
      )}
    </section>
  )
}

function FixPreviewDrawer({
  todo,
  onClose,
  onRelist,
  onPublish,
}: {
  todo: TodoRow
  onClose: () => void
  onRelist: () => void
  onPublish: () => void
}) {
  const generating = todo.fixStatus === '重新生成中'
  const canceled = todo.fixStatus === '已取消'

  return (
    <>
      <div className="drawer-mask" onClick={onClose} />
      <aside className="drawer">
        <div className="drawer-head">
          <span className="drawer-title">修改内容预览</span>
          <span className="drawer-x" onClick={onClose}>×</span>
        </div>
        <div className="drawer-body">
          <h3 className="fix-preview-title">{todo.title}</h3>
          <div className="fix-preview-meta">
            <span className={'src-badge ' + SRC_CLASS[todo.source]}>{TODO_SOURCE_LABEL[todo.source]}</span>
            <span className="type-tag">{todo.type}</span>
            <span className="fix-preview-date">{todo.date}</span>
          </div>
          {generating && (
            <div className="fix-state-banner generating">
              <span className="fix-spin" /> 正在按原修改任务的策略与说明重新生成内容…
            </div>
          )}
          {canceled && (
            <div className="fix-state-banner canceled">该任务已取消，可重新修改或再次发布。</div>
          )}
          {todo.note && (
            <div className="fix-preview-note">
              <b>修改说明</b>：{todo.note}
            </div>
          )}
          <div className="fix-preview-label">修改后内容</div>
          {todo.body ? (
            <div className="fix-preview-content" dangerouslySetInnerHTML={{ __html: todo.body }} />
          ) : (
            <div className="fix-preview-empty">暂无正文</div>
          )}
        </div>
        <div className="drawer-foot">
          <button className="btn btn-ghost" onClick={onClose}>关闭</button>
          <button className="btn btn-ghost" onClick={onRelist} disabled={generating}>
            {generating ? '重新生成中…' : '重新修改'}
          </button>
          <button className="btn btn-primary" onClick={onPublish}>立即发布</button>
        </div>
      </aside>
    </>
  )
}
