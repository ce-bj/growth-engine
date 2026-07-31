import { AlertTriangle, CalendarDays, Check, ChevronLeft, ChevronRight, History } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '../../components/Button'
import type { ContentCalendarItem } from '../../types'
import { CHANNEL_META, DEMO_WEEK_START, shiftWeek } from './ContentPrimitives'

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

function buildWeek(weekStart: string) {
  const start = new Date(`${weekStart}T00:00:00`)
  return WEEKDAYS.map((weekday, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    return { iso, label: iso.slice(5).replace('-', '/'), weekday }
  })
}

export function ContentCalendar({ items, onOpenTask }: { items: ContentCalendarItem[]; onOpenTask: (id: string) => void }) {
  const [weekStart, setWeekStart] = useState(DEMO_WEEK_START)
  const days = useMemo(() => buildWeek(weekStart), [weekStart])
  const weekItems = items.filter((item) => days.some((day) => day.iso === item.date))
  const isHistory = weekStart < DEMO_WEEK_START
  const isCurrent = weekStart === DEMO_WEEK_START

  const publishCount = weekItems.filter((item) => item.stage === 'publish').length
  const reviewCount = weekItems.filter((item) => item.stage === 'review').length
  const productionCount = weekItems.filter((item) => item.stage === 'production').length
  const doneCount = weekItems.filter((item) => item.done).length
  const alertCount = weekItems.filter((item) => item.state !== 'normal').length

  return <div className="content-page-stack">
    <div className="content-toolbar">
      <div><span className="content-eyebrow">CONTENT CALENDAR</span><h2>内容日历</h2><p>统一查看生产截止、审核节点和多渠道发布时间，可向前翻页回看历史执行情况。</p></div>
      <div className="content-calendar-legend"><span><i className="is-production" />生产</span><span><i className="is-review" />审核</span><span><i className="is-publish" />发布</span></div>
    </div>

    <div className="content-calendar-nav">
      <Button size="sm" variant="secondary" onClick={() => setWeekStart((current) => shiftWeek(current, -1))}><ChevronLeft size={14} />上一周</Button>
      <div className="content-calendar-nav__label">
        <b>{days[0].label} - {days[6].label}</b>
        <span className={isHistory ? 'is-history' : isCurrent ? 'is-current' : ''}>{isHistory ? <><History size={13} />历史周</> : isCurrent ? '本周' : '未来周'}</span>
      </div>
      <Button size="sm" variant="secondary" onClick={() => setWeekStart((current) => shiftWeek(current, 1))}>下一周<ChevronRight size={14} /></Button>
      {!isCurrent && <Button size="sm" variant="text" onClick={() => setWeekStart(DEMO_WEEK_START)}>回到本周</Button>}
    </div>

    <section className="content-calendar-summary">
      <div><CalendarDays size={18} /><span><b>本周 {weekItems.length} 个节点</b><small>{publishCount} 次发布 · {reviewCount} 次审核 · {productionCount} 次生产</small></span></div>
      {isHistory
        ? <div className="content-calendar-done"><Check size={16} />{doneCount} / {weekItems.length} 个节点已完成</div>
        : alertCount > 0
          ? <div className="content-calendar-warning"><AlertTriangle size={16} />{alertCount} 个节点需要提前处理</div>
          : <div className="content-calendar-done"><Check size={16} />暂无需要提前处理的节点</div>}
    </section>

    <div className="content-calendar-grid">{days.map((day) => {
      const dayItems = weekItems.filter((item) => item.date === day.iso)
      return <section key={day.iso} className={dayItems.length ? '' : 'is-empty'}>
        <header><b>{day.label}</b><span>{day.weekday}</span></header>
        <div>{dayItems.length ? dayItems.map((item) => <button key={item.id} className={`is-${item.stage} ${item.state !== 'normal' ? `is-${item.state}` : ''} ${item.done ? 'is-done' : ''}`} onClick={() => onOpenTask(item.taskId)}>
          <span className="content-calendar-item__time">{item.time}{item.done && <Check size={11} />}</span>
          <b>{item.title}</b>
          <small style={{ color: CHANNEL_META[item.channel].color }}>{CHANNEL_META[item.channel].label}</small>
        </button>) : <span className="content-calendar-empty">暂无安排</span>}</div>
      </section>
    })}</div>
  </div>
}
