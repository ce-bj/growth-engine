import { ArrowUpRight, BookOpenCheck, Globe, MousePointerClick, Share2, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/Button'
import type { ContentPublishStat, ContentThemePerformance, ContentWeeklyPerformance } from '../../types'
import { ChannelBadge, MetricCard } from './ContentPrimitives'

export function ContentPerformance({ performance, weeks, publishStats, onCreateTask, onOpenDetail }: {
  performance: ContentThemePerformance[]
  weeks: ContentWeeklyPerformance[]
  publishStats: ContentPublishStat[]
  onCreateTask: (item: ContentThemePerformance) => void
  onOpenDetail: (statId: string) => void
}) {
  const [scope, setScope] = useState<'week' | 'all'>('week')
  const [weekStart, setWeekStart] = useState(weeks[0]?.weekStart ?? '')
  const week = weeks.find((item) => item.weekStart === weekStart) ?? weeks[0]
  const previous = weeks[weeks.findIndex((item) => item.weekStart === week?.weekStart) + 1]

  const scopedStats = scope === 'week' ? publishStats.filter((stat) => stat.weekStart === week?.weekStart) : publishStats
  const totalWebsite = scope === 'week' ? (week?.websitePublished ?? 0) : weeks.reduce((sum, item) => sum + item.websitePublished, 0)
  const totalSocial = scope === 'week' ? (week?.socialPublished ?? 0) : weeks.reduce((sum, item) => sum + item.socialPublished, 0)
  const websiteUv = scope === 'week' ? (week?.websiteUv ?? 0) : weeks.reduce((sum, item) => sum + item.websiteUv, 0)
  const impressions = scope === 'week' ? (week?.socialImpressions ?? 0) : weeks.reduce((sum, item) => sum + item.socialImpressions, 0)
  const linkClicks = scope === 'week' ? (week?.linkClicks ?? 0) : weeks.reduce((sum, item) => sum + item.linkClicks, 0)

  const delta = (current: number, prev?: number) => prev === undefined || prev === 0 ? undefined : `较上周 ${current >= prev ? '+' : ''}${Math.round(((current - prev) / prev) * 100)}%`
  const maxUv = Math.max(...weeks.map((item) => item.websiteUv), 1)

  return <div className="content-page-stack">
    <div className="content-toolbar">
      <div><span className="content-eyebrow">CONTENT PERFORMANCE</span><h2>效果分析</h2><p>按周汇总内容发布数量与多渠道消费表现，可下钻到单条内容的官网 / 社媒发布计数。</p></div>
      <div className="content-toolbar__actions">
        <select className="content-period-select" value={scope} onChange={(e) => setScope(e.target.value as 'week' | 'all')}><option value="week">按周查看</option><option value="all">全部周累计</option></select>
        <select className="content-period-select" value={weekStart} disabled={scope === 'all'} onChange={(e) => setWeekStart(e.target.value)}>{weeks.map((item) => <option key={item.weekStart} value={item.weekStart}>{item.label}</option>)}</select>
      </div>
    </div>

    <div className="content-metric-grid content-metric-grid--performance">
      <MetricCard label="官网发布条数" value={totalWebsite} sub={scope === 'week' ? '本周发布到企业网站' : '全部周累计'} tone="good" />
      <MetricCard label="社媒发布条数" value={totalSocial} sub={scope === 'week' ? '本周社媒渠道版本' : '全部周累计'} tone="good" />
      <MetricCard label="网站内容 UV" value={websiteUv.toLocaleString()} sub={scope === 'week' ? delta(week?.websiteUv ?? 0, previous?.websiteUv) ?? '本周累计' : '全部周累计'} />
      <MetricCard label="滚动深度" value={`${week?.scrollDepth ?? 0}%`} sub={scope === 'week' ? delta(week?.scrollDepth ?? 0, previous?.scrollDepth) ?? '本周均值' : '最近一周均值'} tone="good" />
      <MetricCard label="社媒总曝光" value={impressions.toLocaleString()} sub={`互动率 ${week?.engagementRate ?? 0}%`} />
      <MetricCard label="内容链接点击" value={linkClicks.toLocaleString()} sub={scope === 'week' ? delta(week?.linkClicks ?? 0, previous?.linkClicks) ?? '本周累计' : '全部周累计'} />
    </div>

    <section className="content-panel">
      <div className="content-panel__head"><div><span className="content-eyebrow">WEEKLY TREND</span><h3>按周统计</h3><p className="content-panel__desc">网站 UV 与每周官网 / 社媒发布条数，用于判断产能与效果是否同步增长。</p></div></div>
      <div className="content-week-chart">{[...weeks].reverse().map((item) => <button key={item.weekStart} className={item.weekStart === week?.weekStart && scope === 'week' ? 'is-active' : ''} onClick={() => { setScope('week'); setWeekStart(item.weekStart) }}>
        <i style={{ height: `${Math.max(8, (item.websiteUv / maxUv) * 100)}%` }} />
        <b>{item.websiteUv}</b>
        <span>{item.label}</span>
        <small>官网 {item.websitePublished} · 社媒 {item.socialPublished}</small>
      </button>)}</div>
    </section>

    <section className="content-performance-overview">
      <div className="content-performance-funnel"><h3>网站内容消费</h3><div><span><BookOpenCheck size={16} />内容访问<b>{websiteUv.toLocaleString()}</b></span><i /><span><BookOpenCheck size={16} />滚动深度<b>{Math.round(websiteUv * ((week?.scrollDepth ?? 0) / 100)).toLocaleString()}</b></span><i /><span><MousePointerClick size={16} />继续阅读<b>{Math.round(websiteUv * 0.11).toLocaleString()}</b></span></div></div>
      <div className="content-performance-funnel"><h3>社媒内容互动</h3><div><span><Share2 size={16} />内容曝光<b>{impressions.toLocaleString()}</b></span><i /><span><Share2 size={16} />互动用户<b>{Math.round(impressions * ((week?.engagementRate ?? 0) / 100)).toLocaleString()}</b></span><i /><span><MousePointerClick size={16} />链接点击<b>{linkClicks.toLocaleString()}</b></span></div></div>
    </section>

    <section className="content-table-card">
      <div className="content-panel__head"><div><span className="content-eyebrow">PUBLISHED CONTENT</span><h3>内容发布统计</h3><p className="content-panel__desc">每条已发布内容在企业官网与社媒上的发布计数，点击查看该内容的完整效果详情。</p></div><span className="content-risk-summary">{scopedStats.length} 条内容</span></div>
      <div className="table-wrap"><table className="content-data-table"><thead><tr>
        <th>内容</th><th>官网发布</th><th>社媒发布</th><th>渠道明细</th><th>网站表现</th><th>社媒表现</th><th>操作</th>
      </tr></thead><tbody>
        {scopedStats.length === 0 ? <tr><td colSpan={7} className="content-empty-row">该周没有发布记录。</td></tr> : scopedStats.map((stat) => <tr key={stat.id}>
          <td><b>{stat.title}</b><span>首次发布 {stat.publishedAt}</span></td>
          <td><span className="content-count-pill is-website"><Globe size={12} />{stat.websiteCount} 次</span></td>
          <td><span className="content-count-pill is-social"><Share2 size={12} />{stat.socialCount} 条</span></td>
          <td><div className="content-channel-cell">{stat.channelCounts.filter((item) => item.count > 0).map((item) => <ChannelBadge key={item.channel} channel={item.channel} />)}</div></td>
          <td><b>{stat.uv} UV</b><span>滚动深度 {stat.scrollDepth}%</span></td>
          <td><b>{stat.impressions.toLocaleString()} 曝光</b><span>互动率 {stat.engagementRate}% · 点击 {stat.linkClicks}</span></td>
          <td><div className="content-row-actions"><Button size="sm" variant="text" onClick={() => onOpenDetail(stat.id)}>查看详情<ArrowUpRight size={13} /></Button></div></td>
        </tr>)}
      </tbody></table></div>
    </section>

    <section className="content-panel">
      <div className="content-panel__head"><div><span className="content-eyebrow">TOPIC PERFORMANCE</span><h3>主题多渠道表现</h3></div></div>
      <div className="content-theme-performance">{performance.map((item) => <article key={item.id}>
        <header><div><h4>{item.theme}</h4><p>{item.conclusion}</p></div><span className={`is-${item.action}`}>{item.action === 'expand' ? '建议扩展' : item.action === 'optimize' ? '建议优化' : item.action === 'refresh' ? '建议更新' : '定期复核'}</span></header>
        <div className="content-theme-metrics">
          <div><b>企业网站</b><dl><span><dt>UV</dt><dd>{item.website.uv}</dd></span><span><dt>滚动深度</dt><dd>{item.website.scrollDepth}%</dd></span><span><dt>停留</dt><dd>{item.website.avgDuration}</dd></span><span><dt>跳出</dt><dd>{item.website.bounceRate}%</dd></span></dl></div>
          <div><b>社媒汇总</b><dl><span><dt>曝光</dt><dd>{item.social.impressions.toLocaleString()}</dd></span><span><dt>互动</dt><dd>{item.social.engagements}</dd></span><span><dt>互动率</dt><dd>{item.social.engagementRate}%</dd></span><span><dt>点击</dt><dd>{item.social.linkClicks}</dd></span></dl></div>
        </div>
        <footer><Button size="sm" variant="secondary" onClick={() => onCreateTask(item)}><Sparkles size={13} />加入下一轮计划</Button>{publishStats.some((stat) => stat.taskId === item.taskId) && <button onClick={() => onOpenDetail(publishStats.find((stat) => stat.taskId === item.taskId)!.id)}>查看内容详情<ArrowUpRight size={13} /></button>}</footer>
      </article>)}</div>
    </section>
  </div>
}
