import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SLOTS, devicesText, hoursText, periodText, promotionOf, type PromotedPage, type PromotionStore } from './promotion'

type Pick = 'all' | 'some' | 'none'

// Marketing pages of the 推广位置 dialog (产品设计 7.2.1): for the chosen website-page slots, tick which marketing
// pages they show (multi-select). This dialog only decides placement and order; a page's period, hours and devices
// are page settings and are edited on the page list (推广设置 or batch 设置推广时间与设备), shown here read-only.
export default function SlotBatchForm({ store, pages, chosen, onStore }: {
  store: PromotionStore; pages: PromotedPage[]; chosen: string[]; onStore: (s: PromotionStore) => void
}) {
  const initial = () => Object.fromEntries(pages.map(p => { const n = chosen.filter(s => store.assignments[s]?.includes(p.id)).length
    return [p.id, n === 0 ? 'none' : n === chosen.length ? 'all' : 'some'] })) as Record<string, Pick>
  const [picks, setPicks] = useState<Record<string, Pick>>(initial)
  const start = initial()
  const added = pages.filter(p => picks[p.id] === 'all' && start[p.id] !== 'all')
  const removed = pages.filter(p => picks[p.id] === 'none' && start[p.id] !== 'none')
  const changed = added.length > 0 || removed.length > 0

  // New pages are appended to each slot's order; pages left half-selected keep their slots unchanged.
  const save = () => {
    if (!changed) return
    const assignments = { ...store.assignments }
    for (const s of chosen) {
      if (!SLOTS.includes(s)) continue
      const list = assignments[s] || []
      assignments[s] = [...list.filter(id => picks[id] !== 'none'), ...pages.filter(p => picks[p.id] === 'all').map(p => p.id).filter(id => !list.includes(id))]
    }
    onStore({ ...store, assignments })
  }

  return <div className="slot-candidates">
    <strong className="field-label">选择营销页（可多选）</strong>
    {pages.length ? pages.map(p => { const v = picks[p.id]; const cfg = promotionOf(store, p); const inCount = chosen.filter(s => store.assignments[s]?.includes(p.id)).length
      return <label className="checkline slot-candidate" key={p.id}><input type="checkbox" checked={v === 'all'} ref={el => { if (el) el.indeterminate = v === 'some' }} onChange={() => setPicks({ ...picks, [p.id]: v === 'all' ? 'none' : 'all' })} />
        <span><strong>{p.draft.title}</strong><small>{periodText(cfg)} · {hoursText(cfg)} · {devicesText(cfg)}</small></span>
        {v === 'some' && <small className="subtle">已在 {inCount} 个位置，保持不变</small>}{!p.draft.published && <small className="promo-state tone-warn">已下线，重新上线后展示</small>}</label> })
      : <p className="subtle">还没有已发布的营销页，发布后才能加入推广位置。</p>}
    {pages.length > 0 && <>
      <p className="subtle slot-hint">这里只决定位置放哪些营销页、按什么顺序。推广时间与设备属于营销页本身，对它所在的全部位置生效，请在页面列表修改：单个页面用“推广设置”，多个页面勾选后“设置推广时间与设备”。</p>
      <div className="slot-batch-bar"><p className="subtle">{changed ? [added.length && `加入 ${added.length} 个营销页`, removed.length && `移出 ${removed.length} 个营销页`].filter(Boolean).join('；') + `，作用于 ${chosen.length} 个位置` : '没有需要保存的修改'}</p>
        <Button disabled={!changed} onClick={save}>保存</Button></div>
    </>}
  </div>
}
