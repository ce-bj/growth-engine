import { TODO_SOURCE_LABEL, stratName, useStore } from '../store'
import type { TodoSource } from '../types'

// 来源胶囊配色
const SRC_CLASS: Record<TodoSource, string> = {
  'behavior-fix': 'src-fix',
  'behavior-new': 'src-new',
  'self-new': 'src-self',
}

export function TodoArea() {
  const { todos, publishTodo, rejectTodo, gotoKb, continueAfterKb } = useStore()
  const visibleTodos = todos.filter((t) => t.source === 'self-new')

  return (
    <section className="todo-area">
      <div className="section-head">
        <h2>待办</h2>
        <p>自建任务产出的内容，等待你决定发布或取消</p>
      </div>

      {visibleTodos.length === 0 ? (
        <div className="todo-empty">没有待办事项，一切就绪</div>
      ) : (
        <div className="todo-list">
          {visibleTodos.map((t) => (
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
                  {t.strat.map((s) => (
                    <span className="strat-tag" key={s}>
                      {stratName(s)}
                    </span>
                  ))}
                  <span className="todo-date">今天该发 · 到期自动发布</span>
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
    </section>
  )
}
