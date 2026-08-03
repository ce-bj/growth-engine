import { BarChart3, CalendarDays, FileStack, LayoutDashboard, ListChecks, Send, ShieldCheck, Table2 } from 'lucide-react'
import type { ContentTab } from '../../types'

const TABS: Array<{ id: ContentTab; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'overview', label: '总览', icon: LayoutDashboard },
  { id: 'library', label: '内容管理', icon: Table2 },
  { id: 'plan', label: '内容计划', icon: ListChecks },
  { id: 'review', label: '内容审核', icon: ShieldCheck },
  { id: 'calendar', label: '内容日历', icon: CalendarDays },
  { id: 'assets', label: '内容资产', icon: FileStack },
  { id: 'publishing', label: '发布管理', icon: Send },
  { id: 'performance', label: '效果分析', icon: BarChart3 },
]

export function ContentTabs({ active, onChange }: { active: ContentTab; onChange: (tab: ContentTab) => void }) {
  return <div className="content-tabs">{TABS.map((tab) => { const Icon = tab.icon; return <button key={tab.id} className={active === tab.id ? 'is-active' : ''} onClick={() => onChange(tab.id)}><Icon size={15} />{tab.label}</button> })}</div>
}
