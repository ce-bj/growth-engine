import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { hoursText, periodText, promotionOf, type PromotedPage, type PromotionStore } from './promotion'

// 推广位置 dialog, one website page at a time (产品设计 7.2.1): add published marketing pages that are not yet in this
// slot (multi-select); they are appended to the end of the slot's order. Period and hours are read-only here.
export default function SlotAddPages({ store, pages, slot, onStore }: {
  store: PromotionStore; pages: PromotedPage[]; slot: string; onStore: (s: PromotionStore) => void
}) {
  const current = store.assignments[slot] || []
  const candidates = pages.filter(p => !current.includes(p.id))
  const [picked, setPicked] = useState<string[]>([])
  if (!pages.length) return <p className="subtle">还没有已发布的营销页，发布后才能加入推广位置。</p>
  if (!candidates.length) return <p className="subtle">已发布的营销页都已在这个位置。</p>
  return <div className="slot-candidates">
    <strong className="field-label">添加营销页（可多选）</strong>
    {candidates.map(p => { const cfg = promotionOf(store, p)
      return <label className="checkline slot-candidate" key={p.id}><input type="checkbox" checked={picked.includes(p.id)} onChange={e => setPicked(e.target.checked ? [...picked, p.id] : picked.filter(x => x !== p.id))} />
        <span><strong>{p.draft.title}</strong><small>{cfg.caption} · {periodText(cfg)} · {hoursText(cfg)}</small></span>
        {!p.draft.published && <small className="promo-state tone-warn">已下线，重新上线后展示</small>}</label> })}
    <div className="slot-batch-bar"><p className="subtle">新加入的营销页排在末尾。推广文案与时间在页面列表的“推广设置”中修改。</p>
      <Button disabled={!picked.length} onClick={() => { onStore({ ...store, assignments: { ...store.assignments, [slot]: [...current, ...picked] } }); setPicked([]) }}>添加{picked.length ? ` ${picked.length} 个` : ''}</Button></div>
  </div>
}
