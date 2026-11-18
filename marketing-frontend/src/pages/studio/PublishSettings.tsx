import { useState } from 'react'
import { ArrowLeft, ArrowUpRight, CircleHelp, Copy, ExternalLink, Globe2, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import type { Draft } from './MarketingStudio'
import PromotionForm from './PromotionForm'
import StatusRules from './StatusRules'
import { PUBLISH_TONE, STATE_TONE } from './PageLibrary'
import {
  PUBLISH_LABELS, SLOTS, STATE_LABELS, placementsOf, promoPreviewUrl, promotionIssues, promotionOf, promotionState, slotParts,
  type PagePromotion, type PromotionStore, type PublishState,
} from './promotion'

export interface PagePromotionDraft { placements: string[]; cfg: PagePromotion }

// Publish step (产品设计 4.8): a full-width settings page. The fixed link, search info and the page's promotion
// settings (the same form as 推广设置 on the page list) are configured here; publishing applies both together.
export default function PublishSettings({ draft, store, publishState, version, linkError, blocked, onSlug, onSeo, onFixBlocked, onBack, onPreview, onHistory, onPublish, onSavePromotion, onSetOnline, onCopy }: {
  draft: Draft; store: PromotionStore; publishState: PublishState; version: string | null; linkError: string; blocked: string[]
  onSlug: (slug: string) => void; onSeo: (patch: Partial<Pick<Draft, 'seoTitle' | 'seoDescription'>>) => void; onFixBlocked: () => void
  onBack: () => void; onPreview: () => void; onHistory: () => void
  onPublish: (promo: PagePromotionDraft) => void; onSavePromotion: (promo: PagePromotionDraft) => void; onSetOnline: (online: boolean) => void
  onCopy: (text: string) => void
}) {
  const page = { id: draft.id, draft }
  const [placements, setPlacements] = useState(() => placementsOf(store, draft.id))
  const [cfg, setCfg] = useState<PagePromotion>(() => ({ ...promotionOf(store, page) }))
  const [rules, setRules] = useState(false)
  const promo = { placements, cfg }
  const issues = placements.length ? promotionIssues(cfg) : []
  const everPublished = !!version
  const url = `${location.origin}/pages/${draft.slug}`
  // Promotion state as it will be once these settings are applied (an unpublished page counts as published here).
  const previewState = promotionState({ assignments: Object.fromEntries(SLOTS.map(s => [s, placements.includes(s) ? [draft.id] : []])), pages: { [draft.id]: cfg } }, { id: draft.id, draft: { ...draft, published: true } })
  const counts = Object.fromEntries(SLOTS.map(s => [s, (store.assignments[s] || []).filter(id => id !== draft.id).length + (placements.includes(s) ? 1 : 0)]))

  return <section className="publish-page">
    <header className="publish-page-head">
      <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft size={14} />返回编辑</Button>
      <div><p className="eyebrow">PUBLISH</p><h1>发布设置 · {draft.title}</h1><p className="subtle">页面链接与推广设置一起发布。推广设置与页面列表每行的“推广设置”是同一份配置，发布后也可以在列表中修改。</p></div>
      <div className="row"><Button variant="outline" size="sm" onClick={onPreview}><ExternalLink size={14} />预览页面</Button>{everPublished && <Button variant="outline" size="sm" onClick={onHistory}><History size={14} />发布历史</Button>}</div>
    </header>

    <div className="publish-status-strip">
      <div><small>发布状态</small><span className={`promo-state tone-${PUBLISH_TONE[publishState]}`}>{PUBLISH_LABELS[publishState]}</span>{version && <span className="release-version-badge">线上 v{version}</span>}</div>
      <div><small>推广状态（保存后）</small><span className={`promo-state tone-${STATE_TONE[previewState]}`}>{STATE_LABELS[previewState]}</span>{draft.paused && <small className="subtle">已暂停，发布不会改变暂停状态</small>}</div>
      <div className="row">{publishState === 'offline' ? <Button size="sm" variant="outline" onClick={() => onSetOnline(true)}>重新上线 v{version}</Button> : everPublished && <Button size="sm" variant="ghost" onClick={() => onSetOnline(false)}>下线页面</Button>}
        <Button size="sm" variant="ghost" onClick={() => setRules(true)}><CircleHelp size={14} />状态规则</Button></div>
    </div>

    <div className="publish-sections">
      <section className="white-card publish-section">
        <h2>页面链接</h2><p className="subtle">链接在首次发布时确定，之后保持固定：推广位置、SEO 内链、SEM 落地与社媒外链都指向同一地址，更新发布只替换内容。</p>
        <div className="site-target"><Globe2 size={17} /><div><strong>{draft.company} · 演示站点</strong><span>目标站点 · 本地前端预览</span></div></div>
        <label className="field-label" htmlFor="page-slug">页面路径</label>
        {everPublished ? <div className="fixed-link"><code>{url}</code><Button variant="ghost" size="icon" aria-label="复制页面链接" onClick={() => onCopy(url)}><Copy size={13} /></Button><span className={`promo-state tone-${publishState === 'offline' ? 'warn' : 'ok'}`}>{publishState === 'offline' ? '已下线，链接失效' : '固定链接 · 有效'}</span></div>
          : <><div className="slug-input"><span>/pages/</span><Input id="page-slug" value={draft.slug} onChange={e => onSlug(e.target.value)} /></div>
            <p className="subtle">小写字母、数字或连字符。发布后不可修改，请确认后再发布。</p></>}
        {linkError && <p role="alert" className="error-text">{linkError}</p>}
      </section>

      <section className="white-card publish-section">
        <h2>搜索与分享</h2><p className="subtle">用于搜索结果和链接分享卡片。</p>
        <label>SEO 标题<Input value={draft.seoTitle || draft.title} onChange={e => onSeo({ seoTitle: e.target.value })} /></label>
        <label>Meta 描述<textarea className="studio-textarea" value={draft.seoDescription || draft.subtitle} onChange={e => onSeo({ seoDescription: e.target.value })} /></label>
      </section>

      <section className="white-card publish-section publish-promo">
        <div className="publish-section-head"><div><h2>推广设置</h2><p className="subtle">{publishState === 'draft' ? '随首次发布生效；不加入推广位置时，页面只通过链接访问。' : publishState === 'offline' ? '页面已下线，设置会保留，重新上线后生效。' : '保存后立即生效，不需要发布新版本。'}</p></div>
          {placements.length > 0 && <a className="slot-preview-link" href={promoPreviewUrl(slotParts(placements[0]).page)} target="_blank" rel="noreferrer"><ExternalLink size={13} />查看网站推广预览</a>}</div>
        <PromotionForm value={cfg} onChange={patch => setCfg(c => ({ ...c, ...patch }))} placements={placements} onPlacements={setPlacements} counts={counts} />
      </section>
    </div>

    <footer className="publish-page-bar">
      {blocked.length > 0 ? <div className="publish-blocked"><p>{blocked.join('；')}</p><Button variant="outline" size="sm" onClick={onFixBlocked}>返回编辑并确认资料</Button></div>
        : <p className="subtle">{issues.length ? `推广设置：${issues[0]}` : '发布仅模拟状态，不向真实网站写入内容。'}</p>}
      <div className="row">
        {everPublished && <Button variant="outline" disabled={issues.length > 0} onClick={() => onSavePromotion(promo)}>仅保存推广设置</Button>}
        <Button disabled={blocked.length > 0 || issues.length > 0} onClick={() => onPublish(promo)}>{everPublished ? '更新发布' : '发布'}<ArrowUpRight size={15} /></Button>
      </div>
    </footer>

    <Dialog open={rules} onOpenChange={setRules}><DialogContent style={{ maxWidth: 1120, width: '94vw', maxHeight: '90vh', overflowY: 'auto' }}>
      <DialogTitle>状态规则</DialogTitle><DialogDescription>发布状态决定链接是否有效；推广状态决定营销页是否在网站推广位置展示。</DialogDescription><StatusRules /></DialogContent></Dialog>
  </section>
}
