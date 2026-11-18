import { Input } from '@/components/ui/input'
import SlotPicker from './SlotPicker'
import { DEVICES, promotionIssues, type PagePromotion, type PromotionParts } from './promotion'

// Promotion settings of one page (产品设计 7.2.2): placements, caption, period, daily hours and devices. The same form
// is used by 推广设置 on the page list and by the publish step. In batch mode the caption is hidden (each page keeps
// its own text) and `parts` chooses which of period / hours / devices are applied.
export default function PromotionForm({ value, onChange, batch = false, parts, onParts, placements, onPlacements, counts }: {
  value: PagePromotion; onChange: (patch: Partial<PagePromotion>) => void; batch?: boolean
  parts?: PromotionParts; onParts?: (p: PromotionParts) => void
  placements?: string[]; onPlacements?: (slots: string[]) => void; counts?: Record<string, number>
}) {
  const show = parts || { period: true, hours: true, devices: true }
  const issues = promotionIssues({ ...value, caption: batch ? '批量' : value.caption, ...(show.devices ? {} : { devices: [...DEVICES] }), ...(show.hours ? {} : { startTime: '00:00', endTime: '23:59' }) })
  const part = (key: keyof PromotionParts, label: string) => batch && parts && onParts
    ? <label className="checkline part-toggle"><input type="checkbox" checked={parts[key]} onChange={e => onParts({ ...parts, [key]: e.target.checked })} /><strong>{label}</strong></label>
    : <strong className="field-label">{label}</strong>
  // Changing the period re-opens a promotion that was ended by hand.
  const period = (patch: Partial<PagePromotion>) => onChange({ ...patch, endedAt: undefined })
  return <div className="dialog-fields promotion-form">
    {placements && onPlacements && <div><strong className="field-label">推广位置（可多选）</strong><SlotPicker value={placements} onChange={onPlacements} counts={counts} /></div>}
    {!batch && <label>推广文案<Input value={value.caption} placeholder="横幅中显示的文字" onChange={e => onChange({ caption: e.target.value })} /></label>}
    <div className="promotion-part">{part('period', '推广期')}
      <fieldset disabled={!show.period}>{value.endedAt && <p className="promo-ended-note">已于 {value.endedAt.slice(0, 10)} 手动结束推广。修改推广期或点击<button type="button" onClick={() => period({})}>重新开始推广</button>后恢复。</p>}
        <div className="two-fields"><label>开始日期（留空为发布后）<Input type="date" value={value.startDate} onChange={e => period({ startDate: e.target.value })} /></label><label>结束日期（留空为长期）<Input type="date" value={value.endDate} onChange={e => period({ endDate: e.target.value })} /></label></div></fieldset></div>
    <div className="promotion-part">{part('hours', '每日时段')}
      <fieldset disabled={!show.hours}><div className="two-fields"><label>每日开始（UTC+8）<Input type="time" value={value.startTime} onChange={e => onChange({ startTime: e.target.value })} /></label><label>每日结束（UTC+8）<Input type="time" value={value.endTime} onChange={e => onChange({ endTime: e.target.value })} /></label></div></fieldset></div>
    <div className="promotion-part">{part('devices', '适用设备（可多选）')}
      <fieldset disabled={!show.devices}><div className="device-checks">{DEVICES.map(d => <label className="checkline" key={d}><input type="checkbox" checked={value.devices.includes(d)} onChange={e => onChange({ devices: e.target.checked ? DEVICES.filter(x => x === d || value.devices.includes(x)) : value.devices.filter(x => x !== d) })} />{d}</label>)}</div></fieldset></div>
    {!batch && <p className="subtle">推广期与时段内，营销页在所选位置一直展示；访客点击“不再提醒”后，这个营销页在该位置不再向此访客出现。</p>}
    {issues.length > 0 && <ul className="strategy-issues">{issues.map(i => <li key={i}>{i}</li>)}</ul>}
  </div>
}
