import { useState } from 'react'
import { ArrowDown, ArrowUp, CircleHelp, Copy, ExternalLink, Layers3, Megaphone, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StudioSelect } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import type { VersionedPage } from './releaseVersions'
import { brandSnapshotKey } from './websiteAudit'
import PromotionForm from './PromotionForm'
import SlotBatchForm from './SlotBatchForm'
import StatusRules from './StatusRules'
import {
  PLACEMENT_TYPES, PUBLISH_LABELS, SLOTS, STATE_LABELS, applyPromotionParts, canPromote, defaultPromotion, devicesText, flatSitePages, hoursText,
  linkState, periodText, pickForPlacement, placementsOf, promoPreviewUrl, promotionIssues, promotionOf, promotionState,
  publishState, rowActions, withPagePromotion, slotKey, slotLabel, slotParts, ROW_ACTION_LABELS, type RowAction, type PagePromotion, type PromotionParts, type PromotionState, type PromotionStore, type PublishState,
} from './promotion'

// Page list (产品设计 4.1, 5.1, 7.1, 7.2): each page's publishing and promotion state with the actions that state
// allows, per-page and batch promotion settings, and the 推广位置 dialog (top right): placement type → website pages
// (multi-select) → marketing pages (multi-select, ordered per slot). Pages that were never published cannot be promoted.

const PUBLISH_FILTERS = ['全部发布状态', '未发布', '已发布', '有未发布修改', '已下线']
const PROMO_FILTERS = ['全部推广状态', '推广中', '待开始', '已暂停', '推广已结束', '未推广']
export const STATE_TONE: Record<PromotionState, string> = { none: 'muted', unpublished: 'warn', paused: 'muted', scheduled: 'info', active: 'ok', off_hours: 'info', ended: 'muted' }
export const PUBLISH_TONE: Record<PublishState, string> = { draft: 'muted', published: 'ok', changed: 'info', offline: 'warn' }
const ALL_PARTS: PromotionParts = { period: true, hours: true, devices: true }
type DialogState = { kind: 'page'; id: string } | { kind: 'time' | 'placements' | 'rules' } | { kind: 'confirm'; action: 'offline' | 'end'; ids: string[] } | null

/** A published page whose draft differs from the published version (有未发布修改). */
export const pageChanged = (p: VersionedPage) => !!p.publishedDraft && brandSnapshotKey(p.draft) !== brandSnapshotKey(p.publishedDraft)

export default function PageLibrary({ pages, store, onStore, versionOf, typeOf, intentOf, onNew, onOpen, onPublishPage, onPreview, onHistory, onResults, onSetPaused, onSetOnline, onCopy }: {
  pages: VersionedPage[]; store: PromotionStore; onStore: (s: PromotionStore) => void; versionOf: (p: VersionedPage) => string | null
  typeOf: (p: VersionedPage) => string; intentOf: (p: VersionedPage) => string; onNew: () => void; onOpen: (p: VersionedPage) => void
  onPublishPage: (p: VersionedPage) => void; onPreview: (id: string) => void; onHistory: (id: string) => void; onResults: (p: VersionedPage) => void
  onSetPaused: (ids: string[], paused: boolean) => void; onSetOnline: (ids: string[], online: boolean) => void; onCopy: (text: string) => void
}) {
  const [query, setQuery] = useState('')
  const [publishFilter, setPublishFilter] = useState(PUBLISH_FILTERS[0])
  const [promoFilter, setPromoFilter] = useState(PROMO_FILTERS[0])
  const [placementFilter, setPlacementFilter] = useState('全部推广位置')
  const [selected, setSelected] = useState<string[]>([])
  const [dialog, setDialog] = useState<DialogState>(null)
  const [batchTime, setBatchTime] = useState<PagePromotion>(defaultPromotion(''))
  const [batchParts, setBatchParts] = useState<PromotionParts>(ALL_PARTS)
  const [editing, setEditing] = useState<{ cfg: PagePromotion; placements: string[] } | null>(null)
  const [activeType, setActiveType] = useState(PLACEMENT_TYPES[0].name)
  const [selSlots, setSelSlots] = useState<string[]>([SLOTS[0]])
  const now = new Date()
  const stateOf = (p: VersionedPage) => promotionState(store, p, now)
  const pubOf = (p: VersionedPage) => publishState(p, pageChanged(p))
  // Filters combine: search, publishing state, promotion state and placement are independent conditions.
  const matches = (p: VersionedPage) => {
    if (!(p.draft.title + p.draft.company).includes(query)) return false
    if (publishFilter !== PUBLISH_FILTERS[0] && PUBLISH_LABELS[pubOf(p)] !== publishFilter) return false
    if (placementFilter !== '全部推广位置' && !placementsOf(store, p.id).map(slotLabel).includes(placementFilter)) return false
    const st = stateOf(p)
    return promoFilter === PROMO_FILTERS[0] || (promoFilter === '推广中' && (st === 'active' || st === 'off_hours')) || (promoFilter === '待开始' && st === 'scheduled')
      || (promoFilter === '推广已结束' && st === 'ended') || (promoFilter === '已暂停' && st === 'paused') || (promoFilter === '未推广' && st === 'none' && canPromote(p))
  }
  const filtered = query || publishFilter !== PUBLISH_FILTERS[0] || promoFilter !== PROMO_FILTERS[0] || placementFilter !== '全部推广位置'
  const rows = pages.filter(matches)
  const selectable = rows.filter(canPromote)
  const allSelected = selectable.length > 0 && selectable.every(r => selected.includes(r.id))
  const promotable = pages.filter(canPromote)
  const counts = Object.fromEntries(SLOTS.map(s => [s, (store.assignments[s] || []).length]))

  const openPageDialog = (p: VersionedPage) => { setEditing({ cfg: { ...promotionOf(store, p) }, placements: placementsOf(store, p.id) }); setDialog({ kind: 'page', id: p.id }) }
  const savePage = (id: string) => {
    if (!editing || promotionIssues(editing.cfg).length) return
    onStore(withPagePromotion(store, id, editing.placements, editing.cfg))
    setDialog(null)
  }
  const endPromotion = (ids: string[]) => {
    const stamp = new Date().toISOString(); const next = { ...store.pages }
    for (const id of ids) { const p = pages.find(x => x.id === id); if (p) next[id] = { ...promotionOf(store, p), endedAt: stamp } }
    onStore({ ...store, pages: next })
  }
  // Batch edits on the list change page settings only; which slots a page is in is managed in the 推广位置 dialog.
  const applyBatch = () => {
    if (dialog?.kind !== 'time' || !Object.values(batchParts).some(Boolean)) return
    const stamp = new Date().toISOString(); const next = { ...store.pages }
    for (const id of selected) { const p = pages.find(x => x.id === id); if (p) next[id] = { ...applyPromotionParts(promotionOf(store, p), batchTime, batchParts), batchAt: stamp } }
    onStore({ ...store, pages: next })
    setDialog(null)
  }
  const confirmAction = () => {
    if (dialog?.kind !== 'confirm') return
    if (dialog.action === 'offline') onSetOnline(dialog.ids, false); else endPromotion(dialog.ids)
    setDialog(null)
  }
  const batchCheck = { ...batchTime, caption: '批量', ...(batchParts.devices ? {} : { devices: [...defaultPromotion('').devices] }), ...(batchParts.hours ? {} : { startTime: '00:00', endTime: '23:59' }), ...(batchParts.period ? {} : { startDate: '', endDate: '' }) }

  // 推广位置 dialog: type → website pages (multi-select) → marketing pages (multi-select).
  const type = PLACEMENT_TYPES.find(t => t.name === activeType) || PLACEMENT_TYPES[0]
  const typeSlots = flatSitePages().map(p => slotKey(type.name, p.key))
  const chosen = selSlots.filter(s => typeSlots.includes(s))
  const setOrder = (slot: string, list: string[]) => onStore({ ...store, assignments: { ...store.assignments, [slot]: list } })
  const placementBoard = <div className="slot-board">
    <nav className="slot-types" aria-label="推广位置类型">{PLACEMENT_TYPES.map(t => { const n = SLOTS.filter(s => slotParts(s).type === t.name).reduce((a, s) => a + counts[s], 0)
      return <button type="button" key={t.name} className={type.name === t.name ? 'active' : ''} onClick={() => setActiveType(t.name)}><strong>{t.name}</strong><small>{t.ready ? `${n} 条配置` : '规划中'}</small></button> })}</nav>
    <div className="slot-pages">
      <p className="subtle">{type.help}</p>
      {type.ready && <label className="checkline slot-all"><input type="checkbox" checked={chosen.length === typeSlots.length} onChange={e => setSelSlots(e.target.checked ? typeSlots : [])} />全选网站页面</label>}
      {flatSitePages().map(sp => { const slot = slotKey(type.name, sp.key); const on = chosen.includes(slot); const showing = type.ready ? pickForPlacement(store, pages, slot, '电脑', now, () => false) : undefined
        return <div key={sp.key} className={`slot-row ${on ? 'active' : ''}`} style={{ paddingLeft: 6 + sp.depth * 18 }}>
          <input type="checkbox" aria-label={`多选${sp.name}`} disabled={!type.ready} checked={on} onChange={e => setSelSlots(e.target.checked ? [...selSlots, slot] : selSlots.filter(s => s !== slot))} />
          <button type="button" disabled={!type.ready} onClick={() => setSelSlots([slot])}><span>{sp.name}<code>{sp.key}</code></span>
            <small>{type.ready ? (counts[slot] ? `${counts[slot]} 个${showing ? ' · 展示中' : ''}` : '未配置') : '已规划'}</small></button></div> })}
    </div>
    {!type.ready ? <section className="slot-detail is-planned"><header><div><h3>{type.name}</h3><p className="subtle">规划中，本期不可配置。</p></div></header><p>{type.help}。上线后与 Banner 一样，按“位置类型 → 网站页面”配置营销页，营销页沿用自己的推广文案、时间与设备。</p></section>
      : !chosen.length ? <section className="slot-detail"><p className="subtle slot-empty">在左侧选择一个或多个网站页面。</p></section>
      : <section className="slot-detail">
        <header><div><h3>{chosen.length === 1 ? slotLabel(chosen[0]) : `已选 ${chosen.length} 个位置`}</h3><p className="subtle">{chosen.length === 1 ? '按顺序展示第一个推广中、设备匹配且访客没有点过“不再提醒”的营销页。' : chosen.map(slotLabel).join('、')}</p></div>
          <a className="slot-preview-link" href={promoPreviewUrl(slotParts(chosen[0]).page)} target="_blank" rel="noreferrer"><ExternalLink size={13} />查看预览</a></header>
        {chosen.length === 1 && (() => { const slot = chosen[0]; const ids = store.assignments[slot] || []; const showing = pickForPlacement(store, pages, slot, '电脑', now, () => false)
          return <><p className="placement-now">当前展示（电脑）：{showing ? showing.draft.title : '无（没有推广中的营销页）'}</p>
            {ids.length > 0 && <ol className="placement-pages">{ids.map((id, i) => { const p = pages.find(x => x.id === id); if (!p) return null; const st = stateOf(p); const cfg = promotionOf(store, p)
              return <li key={id}><span className="placement-order">{i + 1}</span><div><strong>{p.draft.title}</strong><small>{cfg.caption} · {periodText(cfg)} · {hoursText(cfg)} · {devicesText(cfg)}</small></div><span className={`promo-state tone-${STATE_TONE[st]}`}>{STATE_LABELS[st]}</span>
                <div className="placement-actions">{i > 0 && <button type="button" aria-label="上移" onClick={() => { const list = [...ids];[list[i - 1], list[i]] = [list[i], list[i - 1]]; setOrder(slot, list) }}><ArrowUp size={13} /></button>}{i < ids.length - 1 && <button type="button" aria-label="下移" onClick={() => { const list = [...ids];[list[i + 1], list[i]] = [list[i], list[i + 1]]; setOrder(slot, list) }}><ArrowDown size={13} /></button>}<button type="button" aria-label={`从${slotLabel(slot)}移除`} onClick={() => setOrder(slot, ids.filter(x => x !== id))}><X size={13} /></button></div></li> })}</ol>}</> })()}
        <SlotBatchForm key={JSON.stringify([chosen, chosen.map(c => store.assignments[c] || []), store.pages])} store={store} pages={promotable} chosen={chosen} onStore={onStore} />
      </section>}
  </div>

  // 操作 column: every action the row's state combination allows (rowActions), grouped as 编辑 · 发布 · 推广 · 效果.
  const run = (p: VersionedPage, a: RowAction) => {
    switch (a) {
      case 'edit': return onOpen(p)
      case 'preview': return onPreview(p.id)
      case 'publish': case 'update': return onPublishPage(p)
      case 'offline': return setDialog({ kind: 'confirm', action: 'offline', ids: [p.id] })
      case 'online': return onSetOnline([p.id], true)
      case 'history': return onHistory(p.id)
      case 'settings': return openPageDialog(p)
      case 'pause': return onSetPaused([p.id], true)
      case 'resume': return onSetPaused([p.id], false)
      case 'end': return setDialog({ kind: 'confirm', action: 'end', ids: [p.id] })
      case 'results': return onResults(p)
    }
  }
  const GROUPS: RowAction[][] = [['edit', 'preview'], ['publish', 'update', 'offline', 'online', 'history'], ['settings', 'pause', 'resume', 'end'], ['results']]
  const actionsOf = (p: VersionedPage) => rowActions(pubOf(p), stateOf(p))
  const eligible = (a: RowAction) => selected.filter(id => { const p = pages.find(x => x.id === id); return p && actionsOf(p).includes(a) })
  const batchRun = (a: 'pause' | 'resume' | 'end') => { const ids = eligible(a); if (!ids.length) return; if (a === 'end') setDialog({ kind: 'confirm', action: 'end', ids }); else onSetPaused(ids, a === 'pause') }


  return <section className="results-page history-library">
    <div className="result-heading"><div><p className="eyebrow">PAGE LIBRARY</p><h1>营销页面</h1><p>管理页面的发布、链接与推广。</p></div><div className="row"><Button variant="outline" onClick={() => setDialog({ kind: 'placements' })}><Megaphone size={15} />推广位置</Button><Button onClick={onNew}><Plus size={16} />创建页面</Button></div></div>
    <div className="history-filters library-filters">
      <Input aria-label="搜索页面" placeholder="搜索页面名称或企业" value={query} onChange={e => setQuery(e.target.value)} />
      <StudioSelect label="发布状态" options={PUBLISH_FILTERS} value={publishFilter} onChange={setPublishFilter} />
      <StudioSelect label="推广状态" options={PROMO_FILTERS} value={promoFilter} onChange={setPromoFilter} />
      <StudioSelect label="推广位置" options={['全部推广位置', ...SLOTS.map(slotLabel)]} value={placementFilter} onChange={setPlacementFilter} />
      {filtered && <Button variant="ghost" size="sm" onClick={() => { setQuery(''); setPublishFilter(PUBLISH_FILTERS[0]); setPromoFilter(PROMO_FILTERS[0]); setPlacementFilter('全部推广位置') }}>清除筛选</Button>}
      <span className="subtle">{rows.length} 个页面 · 本地保存</span>
      <Button variant="ghost" size="sm" className="rules-link" onClick={() => setDialog({ kind: 'rules' })}><CircleHelp size={14} />状态规则</Button>
    </div>
    {selected.length > 0 && <div className="batch-bar"><strong>已选 {selected.length} 个页面</strong><Button size="sm" variant="outline" onClick={() => { setBatchTime(defaultPromotion('')); setBatchParts(ALL_PARTS); setDialog({ kind: 'time' }) }}>设置推广时间与设备</Button>{(['pause', 'resume', 'end'] as const).map(a => { const n = eligible(a).length; return <Button key={a} size="sm" variant="outline" disabled={!n} title={n ? `对 ${n} 个可${ROW_ACTION_LABELS[a]}的页面生效` : `已选页面的状态不支持${ROW_ACTION_LABELS[a]}`} onClick={() => batchRun(a)}>{ROW_ACTION_LABELS[a]}{n > 0 && n !== selected.length ? `（${n}）` : ''}</Button> })}<Button size="sm" variant="ghost" onClick={() => setSelected([])}>取消选择</Button><span className="subtle batch-hint">调整推广位置请用右上角“推广位置”</span></div>}
    <section className="white-card">{rows.length ? <Table><TableHeader><TableRow>
      <TableHead><input type="checkbox" aria-label="全选可推广页面" title="只能选择发布过的页面" disabled={!selectable.length} checked={allSelected} onChange={e => setSelected(e.target.checked ? selectable.map(r => r.id) : [])} /></TableHead>
      {['页面', '发布状态', '链接', '推广位置', '推广时间', '推广状态', '最近更新', '操作'].map(x => <TableHead key={x}>{x}</TableHead>)}</TableRow></TableHeader>
      <TableBody>{rows.map(p => { const st = stateOf(p); const ps = pubOf(p); const cfg = promotionOf(store, p); const link = linkState(p)
        const names = canPromote(p) ? placementsOf(store, p.id) : []; const live = st === 'active' || st === 'off_hours'; const version = versionOf(p); const actions = rowActions(ps, st)
        return <TableRow key={p.id} className={selected.includes(p.id) ? 'row-selected' : undefined}>
          <TableCell><input type="checkbox" aria-label={`选择${p.draft.title}`} title={canPromote(p) ? undefined : '发布后才能设置推广'} disabled={!canPromote(p)} checked={selected.includes(p.id)} onChange={e => setSelected(e.target.checked ? [...selected, p.id] : selected.filter(x => x !== p.id))} /></TableCell>
          <TableCell><strong>{p.draft.title}</strong><div className="subtle">{typeOf(p)} · {intentOf(p)}</div></TableCell>
          <TableCell><div className="state-cell"><span className={`promo-state tone-${PUBLISH_TONE[ps]}`}>{PUBLISH_LABELS[ps]}</span>{version && <small className="release-version-badge">v{version}</small>}</div></TableCell>
          <TableCell>{link.path ? <div className="link-cell"><span className={`promo-state tone-${link.valid ? 'ok' : 'warn'}`}>{link.label}</span><button type="button" title={link.path} disabled={!link.valid} onClick={() => onCopy(`${location.origin}${link.path}`)}><Copy size={12} />{link.path}</button></div> : <span className="promo-state tone-muted">{link.label}</span>}</TableCell>
          <TableCell>{names.length ? <div className="placement-chips">{names.map(n => <span key={n} className={live ? '' : 'inactive'} title={live ? '在此位置展示' : STATE_LABELS[st]}>{slotLabel(n)}</span>)}</div> : <span className="subtle">未加入</span>}</TableCell>
          <TableCell>{names.length ? <div className="promo-time"><span>{periodText(cfg)}</span><small>{hoursText(cfg)} · {devicesText(cfg)}</small>{cfg.batchAt && <small className="batch-tag">批量设置 · {new Date(cfg.batchAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</small>}</div> : <span className="subtle">—</span>}</TableCell>
          <TableCell>{canPromote(p) ? <div className="state-cell"><span className={`promo-state tone-${STATE_TONE[st]}`}>{STATE_LABELS[st]}</span>{st === 'unpublished' && <small className="subtle">重新上线后按日期恢复</small>}</div> : <span className="promo-state tone-muted">发布后可推广</span>}</TableCell>
          <TableCell>{new Date(p.draft.updatedAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</TableCell>
          <TableCell><div className="row-actions">{GROUPS.map((g, gi) => { const acts = g.filter(a => actions.includes(a)); return acts.length ? <span key={gi}>{acts.map(a => <button type="button" key={a} className={a === 'offline' || a === 'end' ? 'danger' : undefined} onClick={() => run(p, a)}>{ROW_ACTION_LABELS[a]}</button>)}</span> : null })}</div></TableCell>
        </TableRow> })}</TableBody></Table>
      : <div className="empty-result"><Layers3 size={30} /><h2>{pages.length ? '没有符合条件的页面' : '开始创建第一个营销页'}</h2><p>{pages.length ? '请调整搜索或状态筛选。' : '选择模板后，使用业务需求或可选的访客意图创建页面。'}</p>{!pages.length && <Button onClick={onNew}>选择模板</Button>}</div>}</section>

    <Dialog open={!!dialog} onOpenChange={v => { if (!v) setDialog(null) }}><DialogContent style={dialog?.kind === 'placements' || dialog?.kind === 'rules' ? { maxWidth: 1120, width: '94vw', maxHeight: '90vh', overflowY: 'auto' } : { maxWidth: 640, maxHeight: '90vh', overflowY: 'auto' }}>
      {dialog?.kind === 'placements' && <><DialogTitle>推广位置</DialogTitle><DialogDescription>先选位置类型，再选网站页面（可多选），然后勾选要放在这些位置的营销页（可多选）、调整顺序。本期开放 Banner，其他类型已规划。推广文案、时间与设备属于营销页，在页面列表中修改。</DialogDescription>{placementBoard}</>}
      {dialog?.kind === 'rules' && <><DialogTitle>状态规则</DialogTitle><DialogDescription>发布状态决定链接是否有效；推广状态决定营销页是否在网站推广位置展示。两者分开操作，页面下线时推广停止展示。</DialogDescription><StatusRules /></>}
      {dialog?.kind === 'page' && editing && <><DialogTitle>推广设置 · {pages.find(p => p.id === dialog.id)?.draft.title}</DialogTitle><DialogDescription>选择推广位置，并设置本页的推广文案、推广期、时段与设备。与发布页的“推广设置”是同一份配置。</DialogDescription>
        <PromotionForm value={editing.cfg} onChange={patch => setEditing({ ...editing, cfg: { ...editing.cfg, ...patch } })} placements={editing.placements} onPlacements={slots => setEditing({ ...editing, placements: slots })} counts={counts} />
        <Button disabled={promotionIssues(editing.cfg).length > 0} onClick={() => savePage(dialog.id)}>保存</Button></>}
      {dialog?.kind === 'time' && <><DialogTitle>设置推广时间与设备</DialogTitle><DialogDescription>勾选要统一修改的项目，覆盖已选 {selected.length} 个页面；未勾选的项目与各页面的推广文案保持不变。</DialogDescription>
        <PromotionForm batch value={batchTime} onChange={patch => setBatchTime({ ...batchTime, ...patch })} parts={batchParts} onParts={setBatchParts} />
        <Button disabled={!Object.values(batchParts).some(Boolean) || promotionIssues(batchCheck).length > 0} onClick={applyBatch}>应用到 {selected.length} 个页面</Button></>}
      {dialog?.kind === 'confirm' && <><DialogTitle>{dialog.action === 'offline' ? '下线页面' : '结束推广'}</DialogTitle>
        <DialogDescription>{dialog.action === 'offline' ? '下线后链接失效，访客无法访问；推广位置不再展示该页面。发布版本、推广位置与推广设置都会保留，可随时重新上线。' : '结束后这些页面在所有推广位置停止展示，推广位置与文案保留。修改推广期或点击“重新开始推广”可再次推广。'}</DialogDescription>
        <ul className="confirm-list">{dialog.ids.map(id => <li key={id}>{pages.find(p => p.id === id)?.draft.title}</li>)}</ul>
        <div className="row"><Button variant="outline" onClick={() => setDialog(null)}>取消</Button><Button onClick={confirmAction}>{dialog.action === 'offline' ? '确认下线' : '确认结束'}</Button></div></>}
    </DialogContent></Dialog>
  </section>
}
