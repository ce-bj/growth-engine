import { AlertTriangle, CalendarDays } from 'lucide-react'
import type { ContentCalendarItem } from '../../types'
import { CHANNEL_META } from './ContentPrimitives'

const DAYS = ['07-29 周三', '07-30 周四', '07-31 周五', '08-01 周六', '08-02 周日', '08-03 周一', '08-04 周二', '08-05 周三']

export function ContentCalendar({ items, onOpenTask }: { items: ContentCalendarItem[]; onOpenTask: (id: string) => void }) {
  return <div className="content-page-stack">
    <div className="content-toolbar"><div><span className="content-eyebrow">CONTENT CALENDAR</span><h2>内容日历</h2><p>统一查看生产截止、审核节点和多渠道发布时间。</p></div><div className="content-calendar-legend"><span><i className="is-production" />生产</span><span><i className="is-review" />审核</span><span><i className="is-publish" />发布</span></div></div>
    <section className="content-calendar-summary"><div><CalendarDays size={18} /><span><b>本周 7 个节点</b><small>3 次发布 · 2 次审核 · 2 次生产</small></span></div><div className="content-calendar-warning"><AlertTriangle size={16} />2 个节点需要提前处理</div></section>
    <div className="content-calendar-grid">{DAYS.map((day) => { const date = day.slice(0, 5); const dayItems = items.filter((item) => item.date === date); return <section key={day} className={dayItems.length ? '' : 'is-empty'}><header><b>{day.slice(0, 5)}</b><span>{day.slice(6)}</span></header><div>{dayItems.length ? dayItems.map((item) => <button key={item.id} className={`is-${item.stage} ${item.state !== 'normal' ? `is-${item.state}` : ''}`} onClick={() => onOpenTask(item.taskId)}><span className="content-calendar-item__time">{item.time}</span><b>{item.title}</b><small style={{ color: CHANNEL_META[item.channel].color }}>{CHANNEL_META[item.channel].label}</small></button>) : <span className="content-calendar-empty">暂无安排</span>}</div></section> })}</div>
  </div>
}
