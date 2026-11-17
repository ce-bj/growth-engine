import { useState } from 'react'
import { useStore } from '../store'
import type { PublishLog } from '../types'

const PAGE_SIZE = 10

const PUSH_CLASS: Record<string, string> = {
  待推送: 'warn',
  已推送: 'ok',
  推送失败: 'danger',
}

export function TaskLogView({ id }: { id: string }) {
  const { publishLogs, tasks, navigate } = useStore()
  const [page, setPage] = useState(1)

  const task = tasks.find((t) => t.id === id)
  const rows: PublishLog[] = publishLogs.filter((l) => l.taskId === id)

  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const cur = Math.min(page, totalPages)
  const startIdx = (cur - 1) * PAGE_SIZE
  const pageRows = rows.slice(startIdx, startIdx + PAGE_SIZE)

  return (
    <div className="page">
      <div className="page-head">
        <button className="btn btn-ghost" onClick={() => navigate({ name: 'task-detail', id })}>‹ 返回</button>
        <h2>发布清单{task ? ` · ${task.title}` : ''}</h2>
      </div>

      {total === 0 ? (
        <div className="todo-empty">该任务暂无发布清单</div>
      ) : (
        <div className="table-wrap">
          <table className="list-table log-table">
            <thead>
              <tr>
                <th>任务 ID</th>
                <th>任务名称</th>
                <th>关键词</th>
                <th>任务主题</th>
                <th>内容标题</th>
                <th>应用</th>
                <th>预计推送时间</th>
                <th>实际推送时间</th>
                <th>推送状态</th>
                <th>任务更新时间</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((l) => (
                <tr key={l.id}>
                  <td className="td-mono">{l.taskNo}</td>
                  <td>{l.taskName}</td>
                  <td>{l.kw}</td>
                  <td>{l.topic}</td>
                  <td>{l.contentTitle}</td>
                  <td>{l.app}</td>
                  <td>{l.expectTime}</td>
                  <td>{l.actualTime || '--'}</td>
                  <td>
                    <span className={'status-badge ' + PUSH_CLASS[l.pushStatus]}>
                      {l.pushStatus}
                    </span>
                  </td>
                  <td>{l.updateTime}</td>
                </tr>
              ))}
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
