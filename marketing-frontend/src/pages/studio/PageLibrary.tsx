import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, CircleHelp, Copy, ExternalLink, Layers3, Megaphone, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StudioSelect } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import type { VersionedPage } from './releaseVersions'
import { brandSnapshotKey } from './websiteAudit'
import PromotionForm from './PromotionForm'
import SlotAddPages from './SlotAddPages'
import StatusRules from './StatusRules'
import {
  PLACEMENT_TYPES, PUBLISH_LABELS, SLOTS, STATE_LABELS, canPromote, flatSitePages, hoursText, linkState, periodText, pickForPlacement,
  placementsOf, promoPreviewUrl, promotionIssues, promotionOf, promotionState, publishState, rowActions, withPagePromotion, slotKey, slotLabel,
  slotParts, ROW_ACTION_LABELS, type RowAction, type PagePromotion, type PromotionState, type PromotionStore, type PublishState,
} from './promotion'

// Page list (产品设计 4.1, 5.1, 7.1, 7.2): each page's publishing and promotion state with the actions that state
// allows (操作 column), per-page 推广设置, batch pause / resume / end, and the 推广位置 dialog (top right): placement type
// → one website page → the marketing pages it shows, in order. Pages that were never published cannot be promoted.

const PUBLISH_FILTERS = ['全部发布状态', '未发布', '已发布', '有未发布修改', '已下线']
const PROMO_FILTERS = ['全部推广状态', '推广中', '待开始', '已暂停', '推广已结束', '未推广']
export const STATE_TONE: Record<PromotionState, string> = { none: 'muted', unpublished: 'warn', paused: 'muted', scheduled: 'info', active: 'ok', off_hours: 'info', ended: 'muted' }
export const PUBLISH_TONE: Record<PublishState, string> = { draft: 'muted', published: 'ok', changed: 'info', offline: 'warn' }
type DialogState = { kind: 'page'; id: string } | { kind: 'placements' | 'rules' } | { kind: 'confirm'; action: 'offline' | 'end'; ids: string[] } | null

/** A published page whose draft differs from the published version (有未发布修改). */
export const pageChanged = (p: VersionedPage) => !!p.publishedDraft && brandSnapshotKey(p.draft) !== brandSnapshotKey(p.publishedDraft)

export default function PageLibrary({ pages, store, onStore, versionOf, typeOf, intentOf, onNew, onOpen, onPublishPage, onPreview, onHistory, onResults, onSetPaused, onSetOnline, onCopy, highlightTitle }: {
  pages: VersionedPage[]; store: PromotionStore; onStore: (s: PromotionStore) => void; versionOf: (p: VersionedPage) => string | null
  typeOf: (p: VersionedPage) => string; intentOf: (p: VersionedPage) => string; onNew: () => void; onOpen: (p: VersionedPage) => void
  onPublishPage: (p: VersionedPage) => void; onPreview: (id: string) => void; onHistory: (id: string) => void; onResults: (p: VersionedPage) => void
  onSetPaused: (ids: string[], paused: boolean) => void; onSetOnline: (ids: string[], online: boolean) => void; onCopy: (text: string) => void
  /** Title of a page handed off from an agent task; its row is highlighted. */
  highlightTitle?: string
}) {
  const [query, setQuery] = useState('')
  const [publishFilter, setPublishFilter] = useState(PUBLISH_FILTERS[0])
  const [promoFilter, setPromoFilter] = useState(PROMO_FILTERS[0])
  const [selected, setSelected] = useState<string[]>([])
  const [dialog, setDialog] = useState<DialogState>(null)
  const [editing, setEditing] = useState<{ cfg: PagePromotion; placements: string[] } | null>(null)
  const [activeType, setActiveType] = useState(PLACEMENT_TYPES[0].name)
  const [activeSlot, setActiveSlot] = useState(SLOTS[0])
  const now = new Date()
  const stateOf = (p: VersionedPage) => promotionState(store, p, now)
  const pubOf = (p: VersionedPage) => publishState(p, pageChanged(p))
  // Filters combine: search, publishing state and promotion state are independent conditions.
  const matches = (p: VersionedPage) => {
    if (!(p.draft.title + p.draft.company).includes(query)) return false
    if (publishFilter !== PUBLISH_FILTERS[0] && PUBLISH_LABELS[pubOf(p)] !== publishFilter) return false
    const st = stateOf(p)
    return promoFilter === PROMO_FILTERS[0] || (promoFilter === '推广中' && (st === 'active' || st === 'off_hours')) || (promoFilter === '待开始' && st === 'scheduled')
      || (promoFilter === '推广已结束' && st === 'ended') || (promoFilter === '已暂停' && st === 'paused') || (promoFilter === '未推广' && st === 'none' && canPromote(p))
  }
  const filtered = query || publishFilter !== PUBLISH_FILTERS[0] || promoFilter !== PROMO_FILTERS[0]
  const rows = pages.filter(matches)
  const selectable = rows.filter(canPromote)
  const allSelected = selectable.length > 0 && selectable.every(r => selected.includes(r.id))
  const promotable = pages.filter(canPromote)
  const counts = Object.fromEntries(SLOTS.map(s => [s, (store.assignments[s] || []).length]))

  useEffect(() => {
    if (!highlightTitle) return undefined
    const timer = window.setTimeout(() => {
      document.querySelector('.history-library tr.is-handoff')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 60)
    return () => window.clearTimeout(timer)
  }, [highlightTitle])

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
  const confirmAction = () => {
    if (dialog?.kind !== 'confirm') return
    if (dialog.action === 'offline') onSetOnline(dialog.ids, false); else endPromotion(dialog.ids)
    setDialog(null)
  }

  // 推广位置 dialog: placement type → one website page → the marketing pages that slot shows, in order.
  const type = PLACEMENT_TYPES.find(t => t.name === slotParts(activeSlot).type) || PLACEMENT_TYPES[0]
  const setOrder = (slot: string, list: string[]) => onStore({ ...store, assignments: { ...store.assignments, [slot]: list } })
  const slotIds = store.assignments[activeSlot] || []
  const showing = type.ready ? pickForPlacement(store, pages, activeSlot, now, () => false) : undefined
  const placementBoard = <div className="slot-board">
    <nav className="slot-types" aria-label="推广位置类型">{PLACEMENT_TYPES.map(t => { const n = SLOTS.filter(s => slotParts(s).type === t.name).reduce((a, s) => a + counts[s], 0)
      return <button type="button" key={t.name} className={type.name === t.name ? 'active' : ''} onClick={() => setActiveSlot(slotKey(t.name, slotParts(activeSlot).page))}><strong>{t.name}</strong><small>{t.ready ? `${n} 条配置` : '规划中'}</small></button> })}</nav>
    <div className="slot-pages" role="listbox" aria-label="网站页面">
      <p className="subtle">{type.help}</p>
      {flatSitePages().map(sp => { const slot = slotKey(type.name, sp.key); const live = type.ready && pickForPlacement(store, pages, slot, now, () => false)
        return <button type="button" role="option" aria-selected={activeSlot === slot} key={sp.key} disabled={!type.ready} className={activeSlot === slot ? 'active' : ''} style={{ paddingLeft: 12 + sp.depth * 18 }} onClick={() => setActiveSlot(slot)}>
          <span>{sp.name}<code>{sp.key}</code></span><small>{type.ready ? (counts[slot] ? `${counts[slot]} 个${live ? ' · 展示中' : ''}` : '未配置') : '已规划'}</small></button> })}
    </div>
    {!type.ready ? <section className="slot-detail is-planned"><header><div><h3>{type.name}</h3><p className="subtle">规划中，本期不可配置。</p></div></header><p>{type.help}。上线后与 Banner 一样，选择网站页面查看并配置关联的营销页，营销页沿用自己的推广文案与时间。</p></section>
      : <section className="slot-detail">
        <header><div><h3>{slotLabel(activeSlot)}</h3><p className="subtle">按顺序展示第一个推广中、且访客没有点过“不再提醒”的营销页。</p></div>
          <a className="slot-preview-link" href={promoPreviewUrl(slotParts(activeSlot).page)} target="_blank" rel="noreferrer"><ExternalLink size={13} />查看预览</a></header>
        <p className="placement-now">当前展示：{showing ? showing.draft.title : '无（没有推广中的营销页）'}</p>
        <strong className="field-label">关联的营销页（{slotIds.length}）</strong>
        {slotIds.length ? <ol className="placement-pages">{slotIds.map((id, i) => { const p = pages.find(x => x.id === id); if (!p) return null; const st = stateOf(p); const cfg = promotionOf(store, p)
          return <li key={id}><span className="placement-order">{i + 1}</span><div><strong>{p.draft.title}</strong><small>{cfg.caption} · {periodText(cfg)} · {hoursText(cfg)}</small></div><span className={`promo-state tone-${STATE_TONE[st]}`}>{STATE_LABELS[st]}</span>
            <div className="placement-actions">{i > 0 && <button type="button" aria-label="上移" onClick={() => { const list = [...slotIds];[list[i - 1], list[i]] = [list[i], list[i - 1]]; setOrder(activeSlot, list) }}><ArrowUp size={13} /></button>}{i < slotIds.length - 1 && <button type="button" aria-label="下移" onClick={() => { const list = [...slotIds];[list[i + 1], list[i]] = [list[i], list[i + 1]]; setOrder(activeSlot, list) }}><ArrowDown size={13} /></button>}<button type="button" aria-label={`从${slotLabel(activeSlot)}移除`} onClick={() => setOrder(activeSlot, slotIds.filter(x => x !== id))}><X size={13} /></button></div></li> })}</ol>
          : <p className="subtle slot-empty">这个网站页面还没有关联营销页。</p>}
        <SlotAddPages key={activeSlot + slotIds.join()} store={store} pages={promotable} slot={activeSlot} onStore={onStore} />
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
    <div className="result-heading"><div><span className="ai-mark">草稿与发布</span><h1>营销页面</h1><p>管理已生成页面的发布、链接与推广。</p></div><div className="row"><Button variant="outline" onClick={() => setDialog({ kind: 'placements' })}><Megaphone size={15} />推广位置</Button><Button onClick={onNew}><Plus size={16} />创建页面</Button></div></div>
    <div className="history-filters library-filters">
      <Input aria-label="搜索页面" placeholder="搜索页面名称或企业" value={query} onChange={e => setQuery(e.target.value)} />
      <StudioSelect label="发布状态" options={PUBLISH_FILTERS} value={publishFilter} onChange={setPublishFilter} />
      <StudioSelect label="推广状态" options={PROMO_FILTERS} value={promoFilter} onChange={setPromoFilter} />
      {filtered && <Button variant="ghost" size="sm" onClick={() => { setQuery(''); setPublishFilter(PUBLISH_FILTERS[0]); setPromoFilter(PROMO_FILTERS[0]) }}>清除筛选</Button>}
      <span className="subtle">{rows.length} 个页面 · 本地保存</span>
      <Button variant="ghost" size="sm" className="rules-link" onClick={() => setDialog({ kind: 'rules' })}><CircleHelp size={14} />状态规则</Button>
    </div>
    {selected.length > 0 && <div className="batch-bar"><strong>已选 {selected.length} 个页面</strong>{(['pause', 'resume', 'end'] as const).map(a => { const n = eligible(a).length; return <Button key={a} size="sm" variant="outline" disabled={!n} title={n ? `对 ${n} 个可${ROW_ACTION_LABELS[a]}的页面生效` : `已选页面的状态不支持${ROW_ACTION_LABELS[a]}`} onClick={() => batchRun(a)}>{ROW_ACTION_LABELS[a]}{n > 0 && n !== selected.length ? `（${n}）` : ''}</Button> })}<Button size="sm" variant="ghost" onClick={() => setSelected([])}>取消选择</Button><span className="subtle batch-hint">推广位置在右上角“推广位置”中调整，推广文案与时间在每行“推广设置”中修改</span></div>}
    <section className="white-card">{rows.length ? <Table><TableHeader><TableRow>
      <TableHead><input type="checkbox" aria-label="全选可推广页面" title="只能选择发布过的页面" disabled={!selectable.length} checked={allSelected} onChange={e => setSelected(e.target.checked ? selectable.map(r => r.id) : [])} /></TableHead>
      {['页面', '发布状态', '链接', '推广时间', '推广状态', '最近更新', '操作'].map(x => <TableHead key={x}>{x}</TableHead>)}</TableRow></TableHeader>
      <TableBody>{rows.map(p => { const st = stateOf(p); const ps = pubOf(p); const cfg = promotionOf(store, p); const link = linkState(p)
        const names = canPromote(p) ? placementsOf(store, p.id) : []; const version = versionOf(p); const actions = rowActions(ps, st)
        return <TableRow key={p.id} className={[selected.includes(p.id) && 'row-selected', highlightTitle && p.draft.title === highlightTitle && 'is-handoff'].filter(Boolean).join(' ') || undefined}>
          <TableCell><input type="checkbox" aria-label={`选择${p.draft.title}`} title={canPromote(p) ? undefined : '发布后才能设置推广'} disabled={!canPromote(p)} checked={selected.includes(p.id)} onChange={e => setSelected(e.target.checked ? [...selected, p.id] : selected.filter(x => x !== p.id))} /></TableCell>
          <TableCell><strong>{p.draft.title}</strong><div className="subtle">{typeOf(p)} · {intentOf(p)}</div></TableCell>
          <TableCell><div className="state-cell"><span className={`promo-state tone-${PUBLISH_TONE[ps]}`}>{PUBLISH_LABELS[ps]}</span>{version && <small className="release-version-badge">v{version}</small>}</div></TableCell>
          <TableCell>{link.path ? <div className="link-cell"><span className={`promo-state tone-${link.valid ? 'ok' : 'warn'}`}>{link.label}</span><button type="button" title={link.path} disabled={!link.valid} onClick={() => onCopy(`${location.origin}${link.path}`)}><Copy size={12} />{link.path}</button></div> : <span className="promo-state tone-muted">{link.label}</span>}</TableCell>
          <TableCell>{names.length ? <div className="promo-time"><span>{periodText(cfg)}</span><small>{hoursText(cfg)}</small></div> : <span className="subtle">—</span>}</TableCell>
          <TableCell>{canPromote(p) ? <div className="state-cell"><span className={`promo-state tone-${STATE_TONE[st]}`}>{STATE_LABELS[st]}</span>{st === 'unpublished' && <small className="subtle">重新上线后按日期恢复</small>}</div> : <span className="promo-state tone-muted">发布后可推广</span>}</TableCell>
          <TableCell>{new Date(p.draft.updatedAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</TableCell>
          <TableCell><div className="row-actions">{GROUPS.map((g, gi) => { const acts = g.filter(a => actions.includes(a)); return acts.length ? <span key={gi}>{acts.map(a => <button type="button" key={a} className={a === 'offline' || a === 'end' ? 'danger' : undefined} onClick={() => run(p, a)}>{ROW_ACTION_LABELS[a]}</button>)}</span> : null })}</div></TableCell>
        </TableRow> })}</TableBody></Table>
      : <div className="empty-result"><Layers3 size={30} /><h2>{pages.length ? '没有符合条件的页面' : '开始创建第一个营销页'}</h2><p>{pages.length ? '请调整搜索或状态筛选。' : '选择模板后，使用业务需求或可选的访客意图创建页面。'}</p>{!pages.length && <Button onClick={onNew}>选择模板</Button>}</div>}</section>

    <Dialog open={!!dialog} onOpenChange={v => { if (!v) setDialog(null) }}><DialogContent style={dialog?.kind === 'placements' || dialog?.kind === 'rules' ? { maxWidth: 1120, width: '94vw', maxHeight: '90vh', overflowY: 'auto' } : { maxWidth: 640, maxHeight: '90vh', overflowY: 'auto' }}>
      {dialog?.kind === 'placements' && <><DialogTitle>推广位置</DialogTitle><DialogDescription>选择位置类型和一个网站页面，查看并调整该页面关联的营销页及其顺序。本期开放 Banner，其他类型已规划。推广文案与时间属于营销页，在每行“推广设置”中修改。</DialogDescription>{placementBoard}</>}
      {dialog?.kind === 'rules' && <><DialogTitle>状态规则</DialogTitle><DialogDescription>发布状态决定链接是否有效；推广状态决定营销页是否在网站推广位置展示。两者分开操作，页面下线时推广停止展示。</DialogDescription><StatusRules /></>}
      {dialog?.kind === 'page' && editing && <><DialogTitle>推广设置 · {pages.find(p => p.id === dialog.id)?.draft.title}</DialogTitle><DialogDescription>填写推广文案（必填），选择推广位置，设置推广期与每日时段。与发布页的“推广设置”是同一份配置。</DialogDescription>
        <PromotionForm value={editing.cfg} onChange={patch => setEditing({ ...editing, cfg: { ...editing.cfg, ...patch } })} placements={editing.placements} onPlacements={slots => setEditing({ ...editing, placements: slots })} counts={counts} />
        <Button disabled={promotionIssues(editing.cfg).length > 0} onClick={() => savePage(dialog.id)}>保存</Button></>}
      {dialog?.kind === 'confirm' && <><DialogTitle>{dialog.action === 'offline' ? '下线页面' : '结束推广'}</DialogTitle>
        <DialogDescription>{dialog.action === 'offline' ? '下线后链接失效，访客无法访问；推广位置不再展示该页面。发布版本、推广位置与推广设置都会保留，可随时重新上线。' : '结束后这些页面在所有推广位置停止展示，推广位置与文案保留。修改推广期或点击“重新开始推广”可再次推广。'}</DialogDescription>
        <ul className="confirm-list">{dialog.ids.map(id => <li key={id}>{pages.find(p => p.id === id)?.draft.title}</li>)}</ul>
        <div className="row"><Button variant="outline" onClick={() => setDialog(null)}>取消</Button><Button onClick={confirmAction}>{dialog.action === 'offline' ? '确认下线' : '确认结束'}</Button></div></>}
    </DialogContent></Dialog>
  </section>
}
