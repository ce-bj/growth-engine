import { useState } from 'react'
import { INITIAL_TODOS } from '../data'
import { itemState, TODO_SOURCE_LABEL, typeLabel, useStore } from '../store'
import type { ContentRow } from '../types'

const PAGE_SIZE = 10

// 历史内容来源：按标题对应首页内容进展的来源标签（优化策略 · 修改 / 优化策略 · 新增）
function historySource(title: string): string {
  const hit = INITIAL_TODOS.find((t) => t.title.replace(/（.*?）/g, '').trim() === title.replace(/（.*?）/g, '').trim())
  if (hit) return TODO_SOURCE_LABEL[hit.source]
  return TODO_SOURCE_LABEL['behavior-new']
}

type Tab = 'total' | 'week' | 'month' | 'fix'

const TABS: { key: Tab; label: string }[] = [
  { key: 'total', label: '累计发布内容' },
  { key: 'week', label: '本周发布数' },
  { key: 'month', label: '本月发布数' },
  { key: 'fix', label: '累计修正篇数' },
]

const SCOPE_INIT: Record<string, Tab> = {
  total: 'total',
  week: 'week',
  month: 'month',
  fix: 'fix',
}

export function DataListView({ initialTab }: { initialTab: 'total' | 'week' | 'month' | 'fix' }) {
  const { store, navigate, today } = useStore()
  const [page, setPage] = useState(1)
  const [tab, setTab] = useState<Tab>(SCOPE_INIT[initialTab] || 'total')

  // 已完成的内容（只展示已完成数据）
  const published = store.filter((r) => itemState(r) === 'published')
  const fixed = store.filter((r) => r.fixed)

  // 本周 / 本月：按日期与基准日同周/同月判断（演示态）
  const inSameMonth = (date: string) => date.slice(0, 7) === today.slice(0, 7)
  const inSameWeek = (date: string) => {
    // 简化：与基准日相差 7 天内
    const d1 = new Date(date).getTime()
    const d2 = new Date(today).getTime()
    return Math.abs(d1 - d2) <= 7 * 24 * 3600 * 1000
  }

  let rows: ContentRow[] = []
  if (tab === 'total') rows = published
  else if (tab === 'week') rows = published.filter((r) => inSameWeek(r.date))
  else if (tab === 'month') rows = published.filter((r) => inSameMonth(r.date))
  else rows = fixed

  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const cur = Math.min(page, totalPages)
  const startIdx = (cur - 1) * PAGE_SIZE
  const pageRows = rows.slice(startIdx, startIdx + PAGE_SIZE)

  const switchTab = (t: Tab) => {
    setTab(t)
    setPage(1)
  }

  const countOf = (t: Tab): number => {
    if (t === 'total') return published.length
    if (t === 'week') return published.filter((r) => inSameWeek(r.date)).length
    if (t === 'month') return published.filter((r) => inSameMonth(r.date)).length
    return fixed.length
  }

  return (
    <div className="page">
      <div className="page-head">
        <button className="btn btn-ghost" onClick={() => navigate({ name: 'home' })}>‹ 返回</button>
        <h2>内容数据</h2>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={'tab' + (tab === t.key ? ' on' : '')}
            onClick={() => switchTab(t.key)}
          >
            {t.label}
            <span className="tab-cnt">{countOf(t.key)}</span>
          </button>
        ))}
      </div>

      {total === 0 ? (
        <div className="todo-empty">暂无数据</div>
      ) : (
        <div className="table-wrap">
          <table className="list-table">
            <thead>
              <tr>
                <th>内容标题</th>
                <th>类型</th>
                <th>日期</th>
                <th>来源</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r) => (
                <tr key={r.id}>
                  <td className="td-title">{r.title}</td>
                  <td>{typeLabel(r.type)}</td>
                  <td>{r.date}</td>
                  <td>{r.taskTitle ? `《${r.taskTitle}》` : historySource(r.title)}</td>
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
