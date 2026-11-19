import { TODO_SOURCE_LABEL, useStore } from '../store'
import type { TodoSource } from '../types'

// 来源胶囊配色
const SRC_CLASS: Record<TodoSource, string> = {
  'behavior-fix': 'src-fix',
  'behavior-new': 'src-new',
  'self-new': 'src-self',
}

export function TodoArea() {
  const { todos, publishTodo, rejectTodo, gotoKb, continueAfterKb, navigate } = useStore()

  return (
    <section className="todo-area">
      <div className="section-head">
        <h2>内容进展</h2>
        <p>行为分析智能体与自建发布任务产出的内容，查看各类内容的处理与推送进度</p>
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
                ) : t.source === 'self-new' ? (
                  <span className={'status-badge ' + (t.pushStatus === '已推送' ? 'ok' : 'warn')}>
                    {t.pushStatus || '待推送'}
                  </span>
                ) : t.source === 'behavior-fix' ? (
                  <span className={'status-badge ' + (t.fixStatus === '已完成' ? 'ok' : 'warn')}>
                    {t.fixStatus || '修改中'}
                  </span>
                ) : t.source === 'behavior-new' ? (
                  <span className={'status-badge ' + (t.newPushStatus === '已推送' ? 'ok' : 'warn')}>
                    {t.newPushStatus || '待推送'}
                  </span>
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
    </section>
  )
}
