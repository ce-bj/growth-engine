import { useMemo, useState } from 'react'
import { ArrowRight, ArrowUpRight, BarChart3, Eye, History, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StudioSelect } from '@/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import type { PublishedVersion } from './releaseVersions'
import { RANGES, duration, rate, versionPerformance, type Range, type VersionPerformance } from './performance'
import type { Draft } from './MarketingStudio'

// Results page (产品设计 4.10, 7.4): visits, visit details, conversions and conversion rate per published
// version, the effect of each promotion strategy, and old versions' data through the version selector.

const TABS = ['访问详情', '推广策略', '版本对比', '转化线索'] as const
const SOURCES = ['全部来源', '站内推广', '直接访问', '搜索引擎', '社媒与外链']

export default function ResultsPage({ draft, history, paused, onTogglePause, onEdit, onPublishSettings, onLeads, onViewVersion, onSuggest }: {
  draft: Draft; history: PublishedVersion[]; paused: boolean; onTogglePause: () => void; onEdit: () => void; onPublishSettings: () => void
  onLeads: () => void; onViewVersion: (version: string) => void; onSuggest: () => void
}) {
  const [index, setIndex] = useState(history.length - 1)
  const [range, setRange] = useState<Range>('最近 7 天')
  const [tab, setTab] = useState<typeof TABS[number]>('访问详情')
  const [source, setSource] = useState('全部来源')
  const [onlyConverted, setOnlyConverted] = useState(false)
  const [shown, setShown] = useState(20)
  const all = useMemo(() => history.map((_, i) => versionPerformance(draft.id, history, i, i === history.length - 1 ? range : '上线以来')), [draft.id, history, range])
  if (!history.length) return <section className="results-page"><div className="empty-result"><BarChart3 size={32} /><h2>发布后开始记录效果</h2><p>页面发布后，这里会记录访问次数、访问详情、转化与各推广位置的效果。</p><Button onClick={onPublishSettings}>去发布</Button></div></section>
  const safeIndex = Math.min(index, history.length - 1)
  const data = all[safeIndex]
  const previous = safeIndex > 0 ? all[safeIndex - 1] : undefined
  const delta = previous ? (data.conversions / data.visits - previous.conversions / previous.visits) * 100 : null
  const records = data.records.filter(r => (source === '全部来源' || r.source === source) && (!onlyConverted || r.converted))
  const versionLabel = (p: VersionPerformance) => `v${p.version}${p.current ? ' · 当前线上' : ''}`
  // Only real strategies support a recommendation; demo placements are never used as evidence.
  const best = data.strategyDemo ? undefined : [...data.placements].sort((a, b) => b.conversions / Math.max(1, b.arrivals) - a.conversions / Math.max(1, a.arrivals))[0]
  const maxDaily = Math.max(1, ...data.daily.map(p => p.visits))

  return <section className="results-page">
    <div className="result-heading">
      <div><h1>效果分析</h1><p>{draft.title || draft.company} · 主转化：{draft.goal} <span className="demo-pill">示例数据</span></p></div>
      <div className="row results-controls">
        <label>版本<StudioSelect label="查看版本" value={versionLabel(data)} options={[...all].reverse().map(versionLabel)} onChange={v => { setIndex(all.findIndex(p => versionLabel(p) === v)); setShown(20) }} /></label>
        <label>统计周期{data.current ? <StudioSelect label="统计周期" value={range} options={[...RANGES]} onChange={v => setRange(v as Range)} /> : <span className="results-period">线上期间 {data.period.start} – {data.period.end}</span>}</label>
        <Button variant="outline" onClick={onTogglePause}>{paused ? '恢复推广' : '暂停推广'}</Button>
        <Button onClick={onEdit}>编辑页面<ArrowUpRight size={15} /></Button>
      </div>
    </div>
    {!data.current && <div className="results-old-version"><History size={15} /><span>正在查看旧版本 v{data.version} 的数据（线上期间 {data.period.start} – {data.period.end}）。当前线上为 v{all[all.length - 1].version}。</span><Button size="sm" variant="ghost" onClick={() => onViewVersion(data.version)}><Eye size={13} />查看此版本页面</Button><Button size="sm" variant="ghost" onClick={() => setIndex(all.length - 1)}>回到当前版本</Button></div>}

    <div className="metric-grid">
      <div className="metric"><span>访问次数</span><strong>{data.visits.toLocaleString()}</strong><small>平均停留 {duration(data.avgDurationSec)} · 跳出率 {data.bounceRate}%</small></div>
      <div className="metric"><span>转化访问</span><strong>{data.conversions}</strong><small>完成“{draft.goal}”的访问</small></div>
      <div className="metric"><span>转化率</span><strong>{rate(data.conversions, data.visits)}</strong><small>{delta === null ? '转化访问 / 访问次数' : `较 v${previous!.version} ${delta >= 0 ? '+' : ''}${delta.toFixed(1)} 个百分点`}</small></div>
      <div className="metric"><span>新增线索</span><strong>{data.leads}</strong><small>去重后进入线索管理</small></div>
    </div>

    <div className="result-columns">
      <section className="white-card">
        <div className="card-heading"><h3>访问与转化趋势</h3><span className="subtle">v{data.version} · 按天</span></div>
        <div className="chart-legend"><i />访问次数 <i className="pale" />转化访问</div>
        <div className="results-trend" role="img" aria-label={`v${data.version} 每日访问与转化`}>{data.daily.map(p => <div key={p.date} className="results-trend-day" title={`${p.date} · 访问 ${p.visits} · 转化 ${p.conversions}`}>
          <div className="results-trend-bars"><span style={{ height: `${p.visits / maxDaily * 100}%` }} /><span className="pale" style={{ height: `${p.conversions / maxDaily * 100}%` }} /></div>
          {data.daily.length <= 14 && <small>{p.date.slice(5)}</small>}
        </div>)}</div>
      </section>
      {data.current ? <section className="analysis-card"><span className="agent-label"><ShieldCheck size={15} />生成助手建议</span><h2>{best ? `「${best.name}」转化率最高` : '优化首屏表达'}</h2><p>{best ? `来自「${best.name}」的访问转化率为 ${rate(best.conversions, best.arrivals)}。可以让首屏更直接地承接这个入口带来的需求。` : '建议让首屏更清晰地说明适用范围与咨询所需信息。'}</p><Button onClick={onSuggest}>采用建议，进入编辑<ArrowRight size={15} /></Button><small>示例分析，不构成真实效果或因果结论。</small></section>
        : <section className="analysis-card"><span className="agent-label"><History size={15} />版本差异</span><h2>v{data.version} 更新说明</h2><p>{data.summary || '该版本未填写更新说明。'}</p><Button variant="outline" onClick={() => setTab('版本对比')}>对比所有版本</Button></section>}
    </div>

    <div className="result-tabs">{TABS.map(t => <Button variant="ghost" className={tab === t ? 'filter-active' : ''} onClick={() => setTab(t)} key={t}>{t}</Button>)}</div>

    {tab === '访问详情' && <section className="white-card">
      <div className="results-filters"><StudioSelect label="访问来源" value={source} options={SOURCES} onChange={v => { setSource(v); setShown(20) }} /><label className="checkline"><input type="checkbox" checked={onlyConverted} onChange={e => { setOnlyConverted(e.target.checked); setShown(20) }} />只看已转化</label><span className="subtle">共 {records.length} 条访问记录（示例抽样）</span></div>
      <Table><TableHeader><TableRow>{['访问时间', '来源', '设备', '地区', '停留时长', '浏览深度', '转化'].map(x => <TableHead key={x}>{x}</TableHead>)}</TableRow></TableHeader>
        <TableBody>{records.slice(0, shown).map(r => <TableRow key={r.id}>
          <TableCell>{r.time.slice(5, 16).replace('T', ' ')}</TableCell><TableCell>{r.placement ? `站内推广 · ${r.placement}` : r.source}</TableCell><TableCell>{r.device}</TableCell><TableCell>{r.region}</TableCell>
          <TableCell>{duration(r.durationSec)}</TableCell><TableCell>{r.depth}%</TableCell><TableCell>{r.converted ? <span className="status">{r.action}</span> : <span className="subtle">未转化</span>}</TableCell>
        </TableRow>)}</TableBody></Table>
      {records.length > shown && <div className="card-foot"><span>已显示 {shown} / {records.length} 条</span><Button variant="ghost" onClick={() => setShown(shown + 20)}>查看更多</Button></div>}
    </section>}

    {tab === '推广策略' && <section className="white-card">
      {data.strategyDemo && <p className="results-note">v{data.version} 发布时未启用推广位置，访问全部来自下方的非推广来源。上表仅为演示推广报表样式的示例数据，不计入访问次数。</p>}
      <Table><TableHeader><TableRow>{['推广位置', '曝光', '点击', '点击率', '到达访问', '转化', '转化率', '状态'].map(x => <TableHead key={x}>{x}</TableHead>)}</TableRow></TableHeader>
        <TableBody>{data.placements.map(p => <TableRow key={p.name} className={p === best ? 'results-best' : undefined}>
          <TableCell>{p.name}{p === best && <span className="results-best-tag">转化率最高</span>}</TableCell><TableCell>{p.views.toLocaleString()}</TableCell><TableCell>{p.clicks}</TableCell><TableCell>{rate(p.clicks, p.views)}</TableCell>
          <TableCell>{p.arrivals}</TableCell><TableCell>{p.conversions}</TableCell><TableCell>{rate(p.conversions, p.arrivals)}</TableCell>
          <TableCell><span className={paused && data.current ? 'status muted' : 'status'}>{!data.current ? '已结束' : paused ? '已暂停' : '投放中'}</span></TableCell>
        </TableRow>)}</TableBody></Table>
      <h3 className="results-subhead">非推广来源</h3><div className="results-sources">{data.sources.map(src => <div key={src.name}><span>{src.name}</span><strong>{src.visits}</strong><small>转化 {src.conversions} · {rate(src.conversions, src.visits)}</small></div>)}</div>
      <div className="card-foot"><span>点击率 = 点击 / 曝光；转化率 = 转化 / 到达访问。推广位置与非推广来源的访问合计约等于访问次数。</span><Button variant="ghost" onClick={onPublishSettings}>调整推广策略<ArrowUpRight size={14} /></Button></div>
    </section>}

    {tab === '版本对比' && <section className="white-card">
      <Table><TableHeader><TableRow>{['版本', '线上期间', '访问次数', '转化访问', '转化率', '新增线索', '更新说明', ''].map((x, i) => <TableHead key={i}>{x}</TableHead>)}</TableRow></TableHeader>
        <TableBody>{[...all].reverse().map(p => <TableRow key={p.version} className={p.version === data.version ? 'results-best' : undefined}>
          <TableCell>v{p.version}{p.current && <span className="results-best-tag">当前线上</span>}</TableCell><TableCell>{p.period.start} – {p.period.end}</TableCell><TableCell>{p.visits.toLocaleString()}</TableCell>
          <TableCell>{p.conversions}</TableCell><TableCell>{rate(p.conversions, p.visits)}</TableCell><TableCell>{p.leads}</TableCell><TableCell>{p.summary || '—'}</TableCell>
          <TableCell><div className="row"><Button size="sm" variant="ghost" onClick={() => { setIndex(all.indexOf(p)); setTab('访问详情') }}>查看数据</Button><Button size="sm" variant="ghost" onClick={() => onViewVersion(p.version)}>查看页面</Button></div></TableCell>
        </TableRow>)}</TableBody></Table>
      <div className="card-foot"><span>当前版本按所选统计周期计算，旧版本按其线上期间计算。</span></div>
    </section>}

    {tab === '转化线索' && <section className="white-card"><h3>转化线索</h3><p className="subtle">v{data.version} 期间新增 {data.leads} 条线索。联系人、跟进状态与需求在平台线索管理中统一查看。</p><Button onClick={onLeads}>进入线索管理</Button></section>}
  </section>
}
