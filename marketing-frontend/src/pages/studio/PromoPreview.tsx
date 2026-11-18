import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DEVICES, PLACEMENT_TYPES, SITE_PAGES, dismiss, flatSitePages, pickForPlacement, promotionOf, resetDismissed, sitePageName, slotKey,
  type Device, type PromotedPage, type PromotionStore,
} from './promotion'

// Promotion preview page (产品设计 7.3), opened from the 推广位置 dialog or the publish step in a new tab. It shows a
// website page as visitors see it on one or more devices. Banner shows the first eligible marketing page; “不再提醒”
// writes localStorage, so that page stops showing in that slot for this browser. Planned types appear as outlines.
type Page = PromotedPage & { draft: PromotedPage['draft'] & { goal?: string } }

export default function PromoPreview({ store, pages, company, initialPage, hrefOf }: {
  store: PromotionStore; pages: Page[]; company: string; initialPage: string; hrefOf: (pageId: string) => string
}) {
  const known = flatSitePages().some(p => p.key === initialPage)
  const [sitePage, setSitePage] = useState(known ? initialPage : 'Home')
  const [devices, setDevices] = useState<Device[]>(['电脑', '手机'])
  const [planned, setPlanned] = useState(true)
  const [, setTick] = useState(0)
  const slot = slotKey('Banner', sitePage)

  const frame = (device: Device) => {
    const page = pickForPlacement(store, pages, slot, device)
    const cfg = page && promotionOf(store, page)
    const outline = (name: string) => planned && <div className={`planned-slot planned-${PLACEMENT_TYPES.findIndex(t => t.name === name)}`}>{name} · 规划中</div>
    return <figure key={device} className={`promo-frame device-${device}`}>
      <figcaption>{device}</figcaption>
      <div className="promo-site">
        <nav><strong>{company}</strong><span>{SITE_PAGES.map(p => p.name).join(' · ')}</span></nav>
        {page && cfg ? <div className="promo-banner"><div><small>Banner · {page.draft.title}</small><strong>{cfg.caption}</strong></div>
          <a href={hrefOf(page.id)} target="_blank" rel="noreferrer">{page.draft.goal || '了解详情'} ↗</a>
          <button type="button" onClick={() => { dismiss(slot, page.id); setTick(t => t + 1) }}>不再提醒</button></div>
          : <div className="promo-banner empty">此位置当前没有展示的营销页</div>}
        <div className="promo-site-body"><main><h4>{sitePageName(sitePage)}</h4><p /><p />{outline('页中横幅')}<p /><p /></main>{device === '电脑' && planned && <aside>{outline('侧边广告位')}</aside>}</div>
        {outline('底部弹出')}
        {planned && <div className="planned-chat">{outline('智能客服推送')}</div>}
      </div>
    </figure>
  }

  return <div className="promo-preview-page">
    <div className="demo-ribbon">网站推广预览 · 前端演示，不代表真实网站 <a href={location.pathname}>返回工作台</a></div>
    <header className="promo-preview-bar">
      <div><h1>网站推广预览</h1><p className="subtle">按当前推广配置展示 Banner。点击“不再提醒”后，该营销页在这个位置不再向本浏览器出现。</p></div>
      <div className="promo-preview-controls">
        <div className="device-checks"><strong>设备</strong>{DEVICES.map(d => <label className="checkline" key={d}><input type="checkbox" checked={devices.includes(d)} onChange={e => setDevices(e.target.checked ? DEVICES.filter(x => x === d || devices.includes(x)) : devices.filter(x => x !== d))} />{d}</label>)}</div>
        <label className="checkline"><input type="checkbox" checked={planned} onChange={e => setPlanned(e.target.checked)} />显示规划中的位置</label>
        <Button size="sm" variant="ghost" onClick={() => { resetDismissed(); setTick(t => t + 1) }}>清除“不再提醒”记录</Button>
      </div>
    </header>
    <div className="promo-preview-main">
      <nav className="promo-site-tree" aria-label="网站页面">{flatSitePages().map(p => { const n = (store.assignments[slotKey('Banner', p.key)] || []).length
        return <button type="button" key={p.key} className={p.key === sitePage ? 'active' : ''} style={{ paddingLeft: 12 + p.depth * 16 }} onClick={() => setSitePage(p.key)}><span>{p.name}</span>{n > 0 && <small>{n}</small>}</button> })}</nav>
      <div className="promo-frames">{devices.length ? devices.map(frame) : <p className="subtle">至少选择一种设备。</p>}</div>
    </div>
  </div>
}
