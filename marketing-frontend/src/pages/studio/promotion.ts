// Promotion model (产品设计 7.2). A promotion slot is a placement type on one website page, e.g. “Banner · 首页”.
// Slots and marketing pages are many-to-many and are managed on the page list; each marketing page keeps its own
// caption, period, daily hours and devices. Within the period a page always shows in its slots, until the visitor
// clicks “不再提醒” for that page in that slot. This phase only enables Banner; the other types are planned.

export interface PlacementType { name: string; ready: boolean; help: string }
export const PLACEMENT_TYPES: PlacementType[] = [
  { name: 'Banner', ready: true, help: '网站页面导航下方的横幅，可放在任一网站页面' },
  { name: '页中横幅', ready: false, help: '网站正文段落之间的横向推广区域' },
  { name: '侧边广告位', ready: false, help: '网站正文右侧的广告区域，仅电脑显示' },
  { name: '底部弹出', ready: false, help: '网站视口底部的悬浮推广卡片' },
  { name: '智能客服推送', ready: false, help: '智能客服对话中的营销页推荐卡片' },
]

/** Website pages of the site (应用页面), mirroring the site builder's page tree. */
export interface SitePage { key: string; name: string; children?: SitePage[] }
export const SITE_PAGES: SitePage[] = [
  { key: 'Home', name: '首页' },
  { key: 'about_us', name: '公司简介', children: [{ key: 'honour', name: '荣誉资质' }, { key: 'about', name: '公司介绍' }] },
  { key: 'contact', name: '联系我们' },
  { key: 'products_list', name: '产品中心', children: [{ key: 'products_detail', name: '产品详情' }] },
  { key: 'news_list', name: '新闻中心', children: [{ key: 'News_detail', name: '新闻详细' }] },
  { key: 'result', name: '搜索' },
]
export const flatSitePages = (list = SITE_PAGES, depth = 0): (SitePage & { depth: number })[] =>
  list.flatMap(p => [{ ...p, depth }, ...flatSitePages(p.children || [], depth + 1)])
export const sitePageName = (key: string) => flatSitePages().find(p => p.key === key)?.name || key

export const slotKey = (type: string, pageKey: string) => `${type}:${pageKey}`
export const slotParts = (slot: string) => { const i = slot.indexOf(':'); return { type: slot.slice(0, i), page: slot.slice(i + 1) } }
export const slotLabel = (slot: string) => { const { type, page } = slotParts(slot); return `${type} · ${sitePageName(page)}` }
/** Slots that can be used now: every website page for each ready placement type. */
export const SLOTS = PLACEMENT_TYPES.filter(t => t.ready).flatMap(t => flatSitePages().map(p => slotKey(t.name, p.key)))

export const DEVICES = ['电脑', '平板', '手机'] as const
export type Device = typeof DEVICES[number]
export interface PagePromotion {
  caption: string; startDate: string; endDate: string; startTime: string; endTime: string; devices: Device[]
  /** Set when the values came from a batch edit; cleared when the page is edited on its own. */
  batchAt?: string
  /** Set by “结束推广”: the promotion ends now whatever the end date; editing the period clears it. */
  endedAt?: string
}
export interface PromotionStore { assignments: Record<string, string[]>; pages: Record<string, PagePromotion> }
export interface PromotedPage { id: string; draft: { title: string; slug: string; published: boolean; paused: boolean; goal?: string }; versions?: unknown[]; publishedDraft?: unknown }

/**
 * Publishing state (产品设计 7.1). 未发布 → 发布 → 已发布; editing a published page gives 有未发布修改 until 更新发布;
 * 下线 → 已下线 (link stops working, versions and promotion settings kept); 重新上线 → 已发布 with the last version.
 */
export type PublishState = 'draft' | 'published' | 'changed' | 'offline'
export const PUBLISH_LABELS: Record<PublishState, string> = { draft: '未发布', published: '已发布', changed: '有未发布修改', offline: '已下线' }
export const everPublished = (page: PromotedPage) => page.draft.published || !!page.versions?.length || !!page.publishedDraft
export const publishState = (page: PromotedPage, changed = false): PublishState =>
  page.draft.published ? (changed ? 'changed' : 'published') : everPublished(page) ? 'offline' : 'draft'
/** Pages that have been published at least once can hold promotion settings; only online pages are shown to visitors. */
export const canPromote = (page: PromotedPage) => everPublished(page)

const STORE_KEY = 'marketing-studio-promotion-v1'
const DISMISS_PREFIX = 'marketing-promo-dismissed:'

export const emptyStore = (): PromotionStore => ({ assignments: {}, pages: {} })
/** Reads the store; the earlier “首屏 Banner” placement maps to Banner on the home page and single devices become lists. */
export function loadStore(): PromotionStore {
  try {
    const v = JSON.parse(localStorage.getItem(STORE_KEY) || 'null')
    if (v?.assignments && v?.pages) {
      const assignments: Record<string, string[]> = {}
      for (const [k, ids] of Object.entries(v.assignments as Record<string, string[]>)) {
        const key = k === '首屏 Banner' ? slotKey('Banner', 'Home') : k
        if (SLOTS.includes(key) && ids.length) assignments[key] = [...new Set([...(assignments[key] || []), ...ids])]
      }
      const pages: Record<string, PagePromotion> = {}
      for (const [id, cfg] of Object.entries(v.pages as Record<string, PagePromotion & { device?: string }>)) {
        const { device, ...rest } = cfg
        pages[id] = { ...rest, devices: cfg.devices || (device && device !== '全部设备' ? [device as Device] : [...DEVICES]) }
      }
      return { assignments, pages }
    }
  } catch { /* fall through */ }
  return emptyStore()
}
export function saveStore(store: PromotionStore) { try { localStorage.setItem(STORE_KEY, JSON.stringify(store)) } catch { /* storage full or blocked */ } }

export const defaultPromotion = (title: string): PagePromotion => ({ caption: title ? `了解${title}` : '了解专业方案', startDate: '', endDate: '', startTime: '00:00', endTime: '23:59', devices: [...DEVICES] })
export const promotionOf = (store: PromotionStore, page: PromotedPage) => store.pages[page.id] || defaultPromotion(page.draft.title)
export const placementsOf = (store: PromotionStore, pageId: string) => SLOTS.filter(s => store.assignments[s]?.includes(pageId))
/** Saves one page's slots and settings: kept slots keep their order, new slots append the page at the end. */
export function withPagePromotion(store: PromotionStore, pageId: string, slots: string[], cfg: PagePromotion): PromotionStore {
  const assignments = { ...store.assignments }
  for (const s of SLOTS) {
    const list = assignments[s] || []
    assignments[s] = slots.includes(s) ? (list.includes(pageId) ? list : [...list, pageId]) : list.filter(id => id !== pageId)
  }
  const { batchAt: _b, ...rest } = cfg
  return { assignments, pages: { ...store.pages, [pageId]: rest } }
}

// Dates and hours both use the local clock (the site's UTC+8), so a period ends at local midnight.
const today = (now: Date) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
const clock = (now: Date) => now.toTimeString().slice(0, 5)
/** Daily hours; an end earlier than the start means the window runs overnight (e.g. 20:00–08:00). */
export const inDailyHours = (cfg: PagePromotion, now: Date) => {
  const t = clock(now)
  return cfg.startTime <= cfg.endTime ? t >= cfg.startTime && t <= cfg.endTime : t >= cfg.startTime || t <= cfg.endTime
}

export type PromotionState = 'none' | 'unpublished' | 'paused' | 'scheduled' | 'active' | 'off_hours' | 'ended'
export const STATE_LABELS: Record<PromotionState, string> = {
  none: '未推广', unpublished: '页面已下线，不展示', paused: '已暂停', scheduled: '待开始', active: '推广中', off_hours: '推广中 · 不在时段', ended: '推广已结束',
}
export function promotionState(store: PromotionStore, page: PromotedPage, now = new Date()): PromotionState {
  if (!placementsOf(store, page.id).length) return 'none'
  if (!page.draft.published) return 'unpublished'
  if (page.draft.paused) return 'paused'
  const cfg = promotionOf(store, page)
  if (cfg.endedAt) return 'ended'
  if (cfg.startDate && today(now) < cfg.startDate) return 'scheduled'
  if (cfg.endDate && today(now) > cfg.endDate) return 'ended'
  return inDailyHours(cfg, now) ? 'active' : 'off_hours'
}

/** The page link works only after the page is published; pausing promotion does not disable the link. */
export const linkState = (page: PromotedPage) => page.draft.published ? { valid: true, label: '链接有效', path: `/pages/${page.draft.slug}` }
  : everPublished(page) ? { valid: false, label: '已下线，链接失效', path: `/pages/${page.draft.slug}` } : { valid: false, label: '未发布，链接未生效', path: '' }

export const periodText = (cfg: PagePromotion) => cfg.endedAt ? `${cfg.startDate || '发布后'} 起 · ${cfg.endedAt.slice(0, 10)} 手动结束` : `${cfg.startDate || '发布后'} 至 ${cfg.endDate || '长期'}`
export const hoursText = (cfg: PagePromotion) => cfg.startTime === '00:00' && cfg.endTime === '23:59' ? '全天' : `每天 ${cfg.startTime}–${cfg.endTime}`
export const devicesText = (cfg: PagePromotion) => cfg.devices.length === DEVICES.length ? '全部设备' : cfg.devices.join('、')
export const promotionSummary = (cfg: PagePromotion) => [periodText(cfg), hoursText(cfg), devicesText(cfg)]

/**
 * Row actions on the page list for each combination of publishing and promotion state (产品设计 5.1.1). This is the
 * single source for the list's 操作 column, the batch bar and the 状态规则 matrix.
 */
export type RowAction = 'edit' | 'preview' | 'publish' | 'update' | 'offline' | 'online' | 'history' | 'settings' | 'pause' | 'resume' | 'end' | 'results'
export const ROW_ACTIONS: RowAction[] = ['edit', 'preview', 'publish', 'update', 'offline', 'online', 'history', 'settings', 'pause', 'resume', 'end', 'results']
export const ROW_ACTION_LABELS: Record<RowAction, string> = {
  edit: '继续编辑', preview: '预览', publish: '去发布', update: '更新发布', offline: '下线', online: '重新上线', history: '发布历史',
  settings: '推广设置', pause: '暂停推广', resume: '恢复推广', end: '结束推广', results: '查看效果',
}
export function rowActions(pub: PublishState, promo: PromotionState): RowAction[] {
  const list: RowAction[] = ['edit', 'preview']
  if (pub === 'draft') return [...list, 'publish']
  if (pub !== 'published') list.push('update')
  list.push(pub === 'offline' ? 'online' : 'offline', 'history', 'settings')
  // An offline page keeps its pause flag and settings, but promotion actions wait until it is back online.
  if (pub !== 'offline') {
    if (promo === 'scheduled' || promo === 'active' || promo === 'off_hours') list.push('pause', 'end')
    else if (promo === 'paused') list.push('resume', 'end')
  }
  return [...list, 'results']
}
/** Every state combination a page can be in, in the order the rules table lists them. */
export const STATE_COMBOS: { pub: PublishState; promo: PromotionState | null }[] = [
  { pub: 'draft', promo: null },
  ...(['published', 'changed'] as const).flatMap(pub => (['none', 'scheduled', 'active', 'off_hours', 'paused', 'ended'] as const).map(promo => ({ pub, promo }))),
  { pub: 'offline', promo: 'none' }, { pub: 'offline', promo: 'unpublished' },
]

/** Batch time edits apply only the chosen parts; changing the period re-opens an ended promotion. */
export interface PromotionParts { period: boolean; hours: boolean; devices: boolean }
export function applyPromotionParts(cfg: PagePromotion, patch: PagePromotion, parts: PromotionParts): PagePromotion {
  const next = { ...cfg }
  if (parts.period) { next.startDate = patch.startDate; next.endDate = patch.endDate; delete next.endedAt }
  if (parts.hours) { next.startTime = patch.startTime; next.endTime = patch.endTime }
  if (parts.devices) next.devices = [...patch.devices]
  return next
}

export function promotionIssues(cfg: PagePromotion): string[] {
  const issues: string[] = []
  if (cfg.startDate && cfg.endDate && cfg.endDate < cfg.startDate) issues.push('结束日期早于开始日期。')
  if (cfg.startTime === cfg.endTime) issues.push('每日开始与结束时间相同，将不会展示。')
  if (!cfg.devices.length) issues.push('至少选择一种设备。')
  if (!cfg.caption.trim()) issues.push('请填写推广文案。')
  return issues
}

/** “不再提醒”: while the key exists in localStorage, this marketing page no longer shows in this slot. */
export const dismissKey = (slot: string, pageId: string) => `${DISMISS_PREFIX}${slot}:${pageId}`
export function isDismissed(slot: string, pageId: string) { try { return localStorage.getItem(dismissKey(slot, pageId)) !== null } catch { return false } }
export function dismiss(slot: string, pageId: string) { try { localStorage.setItem(dismissKey(slot, pageId), new Date().toISOString()) } catch { /* ignore */ } }
export function resetDismissed() { try { Object.keys(localStorage).filter(k => k.startsWith(DISMISS_PREFIX)).forEach(k => localStorage.removeItem(k)) } catch { /* ignore */ } }

/**
 * Which marketing page a slot shows for a visitor right now: the first page in the slot's order that is
 * promoting, matches the device, and the visitor has not dismissed.
 */
export function pickForPlacement(store: PromotionStore, pages: PromotedPage[], slot: string, device: Device, now = new Date(), dismissed = isDismissed) {
  for (const id of store.assignments[slot] || []) {
    const page = pages.find(p => p.id === id)
    if (!page || promotionState(store, page, now) !== 'active') continue
    if (!promotionOf(store, page).devices.includes(device) || dismissed(slot, id)) continue
    return page
  }
  return undefined
}

export const promoPreviewUrl = (sitePage = 'Home') => `${location.pathname}?promo-preview=1&site-page=${encodeURIComponent(sitePage)}`
