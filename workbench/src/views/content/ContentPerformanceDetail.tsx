import { ArrowLeft, ExternalLink, Globe, MousePointerClick, Share2 } from 'lucide-react'
import { Button } from '../../components/Button'
import type { ContentPublishStat } from '../../types'
import { CHANNEL_META, ChannelBadge, MetricCard } from './ContentPrimitives'

export function ContentPerformanceDetail({ stat, onBack, onOpenTask }: {
  stat: ContentPublishStat
  onBack: () => void
  onOpenTask: (id: string, step?: number) => void
}) {
  const totalPublish = stat.websiteCount + stat.socialCount
  const socialChannels = stat.channelCounts.filter((item) => item.channel !== 'website')

  return <div className="content-page-stack">
    <div className="content-detail-header">
      <div>
        <div className="content-detail-header__title"><h2>{stat.title}</h2><span className="content-detail-badge">内容效果详情</span></div>
        <p>首次发布 {stat.publishedAt} · 累计发布 {totalPublish} 次（官网 {stat.websiteCount} 次 / 社媒 {stat.socialCount} 条）。</p>
      </div>
      <div className="content-detail-header__actions">
        <Button variant="secondary" onClick={() => onOpenTask(stat.taskId)}>查看内容任务</Button>
        <Button variant="secondary" onClick={onBack}><ArrowLeft size={15} />返回效果分析</Button>
      </div>
    </div>

    <div className="content-metric-grid">
      <MetricCard label="官网发布计数" value={stat.websiteCount} sub="含更新重发" tone="good" />
      <MetricCard label="社媒发布计数" value={stat.socialCount} sub={`覆盖 ${socialChannels.filter((item) => item.count > 0).length} 个社媒渠道`} tone="good" />
      <MetricCard label="网站 UV" value={stat.uv.toLocaleString()} sub={`平均停留 ${stat.avgDuration}`} />
      <MetricCard label="滚动深度" value={`${stat.scrollDepth}%`} sub="滚屏读完比例" tone={stat.scrollDepth >= 40 ? 'good' : 'warning'} />
      <MetricCard label="社媒曝光" value={stat.impressions.toLocaleString()} sub={`互动 ${stat.engagements} · 互动率 ${stat.engagementRate}%`} />
      <MetricCard label="链接点击" value={stat.linkClicks.toLocaleString()} sub="社媒回流网站" />
    </div>

    <section className="content-table-card">
      <div className="content-panel__head"><div><span className="content-eyebrow">PUBLISH BREAKDOWN</span><h3>各渠道发布计数</h3><p className="content-panel__desc">同一份母稿在企业官网和各社媒渠道上的实际发布次数与线上地址。</p></div></div>
      <div className="table-wrap"><table className="content-data-table"><thead><tr><th>渠道</th><th>发布计数</th><th>最近发布时间</th><th>线上地址</th></tr></thead><tbody>
        {stat.channelCounts.map((item) => <tr key={item.channel}>
          <td><ChannelBadge channel={item.channel} /></td>
          <td><span className={`content-count-pill ${item.channel === 'website' ? 'is-website' : 'is-social'}`}>{item.channel === 'website' ? <Globe size={12} /> : <Share2 size={12} />}{item.count} {item.channel === 'website' ? '次' : '条'}</span></td>
          <td>{item.lastPublishedAt}</td>
          <td>{item.url ? <a className="content-tracelink" href={item.url} target="_blank" rel="noreferrer">{item.url}<ExternalLink size={12} /></a> : <span className="muted">尚未发布成功</span>}</td>
        </tr>)}
      </tbody></table></div>
    </section>

    <section className="content-performance-overview">
      <div className="content-performance-funnel"><h3>官网消费路径</h3><div><span><Globe size={16} />内容访问<b>{stat.uv.toLocaleString()}</b></span><i /><span><Globe size={16} />滚动深度<b>{Math.round(stat.uv * (stat.scrollDepth / 100)).toLocaleString()}</b></span><i /><span><MousePointerClick size={16} />继续阅读<b>{Math.round(stat.uv * 0.12).toLocaleString()}</b></span></div></div>
      <div className="content-performance-funnel"><h3>社媒回流路径</h3><div><span><Share2 size={16} />曝光<b>{stat.impressions.toLocaleString()}</b></span><i /><span><Share2 size={16} />互动<b>{stat.engagements.toLocaleString()}</b></span><i /><span><MousePointerClick size={16} />回流点击<b>{stat.linkClicks.toLocaleString()}</b></span></div></div>
    </section>

    <section className="content-panel">
      <div className="content-panel__head"><div><span className="content-eyebrow">CHANNEL SPLIT</span><h3>渠道贡献占比</h3></div></div>
      <div className="content-channel-performance">{stat.channelCounts.map((item) => {
        const total = Math.max(stat.channelCounts.reduce((sum, entry) => sum + entry.count, 0), 1)
        return <div key={item.channel}><b>{CHANNEL_META[item.channel].label}</b><strong>{item.count}</strong><span>发布计数占比 {Math.round((item.count / total) * 100)}%</span><i style={{ width: `${(item.count / total) * 100}%` }} /></div>
      })}</div>
    </section>
  </div>
}
