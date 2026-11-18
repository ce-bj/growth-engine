import { Input } from '@/components/ui/input'
import SlotPicker from './SlotPicker'
import { promotionIssues, type PagePromotion } from './promotion'

// Promotion settings of one page (产品设计 7.2.2): caption (required, first), placements, period and daily hours.
// Used by 推广设置 on the page list and by the publish step; both edit the same settings.
export default function PromotionForm({ value, onChange, placements, onPlacements, counts }: {
  value: PagePromotion; onChange: (patch: Partial<PagePromotion>) => void
  placements?: string[]; onPlacements?: (slots: string[]) => void; counts?: Record<string, number>
}) {
  const issues = promotionIssues(value)
  const captionMissing = !value.caption.trim()
  // Changing the period re-opens a promotion that was ended by hand.
  const period = (patch: Partial<PagePromotion>) => onChange({ ...patch, endedAt: undefined })
  return <div className="dialog-fields promotion-form">
    <label>推广文案<span className="required-mark" aria-hidden="true">*</span>
      <Input value={value.caption} required aria-required="true" aria-invalid={captionMissing} placeholder="横幅中显示的文字，如：了解铸铁闸门选型方案" onChange={e => onChange({ caption: e.target.value })} />
      {captionMissing && <small className="error-text">推广文案为必填项。</small>}</label>
    {placements && onPlacements && <div><strong className="field-label">推广位置（可多选）</strong><SlotPicker value={placements} onChange={onPlacements} counts={counts} /></div>}
    <div className="promotion-part"><strong className="field-label">推广期</strong>
      {value.endedAt && <p className="promo-ended-note">已于 {value.endedAt.slice(0, 10)} 手动结束推广。修改推广期或点击<button type="button" onClick={() => period({})}>重新开始推广</button>后恢复。</p>}
      <div className="two-fields"><label>开始日期（留空为发布后）<Input type="date" value={value.startDate} onChange={e => period({ startDate: e.target.value })} /></label><label>结束日期（留空为长期）<Input type="date" value={value.endDate} onChange={e => period({ endDate: e.target.value })} /></label></div></div>
    <div className="promotion-part"><strong className="field-label">每日时段</strong>
      <div className="two-fields"><label>每日开始（UTC+8）<Input type="time" value={value.startTime} onChange={e => onChange({ startTime: e.target.value })} /></label><label>每日结束（UTC+8）<Input type="time" value={value.endTime} onChange={e => onChange({ endTime: e.target.value })} /></label></div></div>
    <p className="subtle">推广期与时段内，营销页在所选位置一直展示，电脑、平板、手机都展示；访客点击“不再提醒”后，这个营销页在该位置不再向此访客出现。</p>
    {issues.filter(i => !i.includes('推广文案')).length > 0 && <ul className="strategy-issues">{issues.filter(i => !i.includes('推广文案')).map(i => <li key={i}>{i}</li>)}</ul>}
  </div>
}
