import test from 'node:test'
import assert from 'node:assert/strict'
import {strategyOf,strategySummary,strategyIssues,appearText} from './placementStrategy'
import {versionPerformance} from './performance'
import type {StrategyFields} from './StrategyEditor'
import type {PublishedVersion} from './releaseVersions'
import type {Draft} from './MarketingStudio'
const field=(name:string,extra:Partial<StrategyFields>={}):StrategyFields=>({name,enabled:true,device:'全部设备',caption:'了解方案',scopes:['产品中心'],...extra})
test('默认策略按各推广位置的出现规则设置',()=>{
 assert.equal(appearText(field('首屏 Banner')),'进入首页即出现')
 assert.equal(strategyOf(field('首屏 Banner')).closable,false)
 assert.equal(strategyOf(field('首屏 Banner')).intentLevel,'中及以上')
 assert.equal(appearText(field('页中横幅')),'滚动到 50% 后出现')
 assert.deepEqual(strategyOf(field('侧边广告位')).stages,['对比','决策'])
 const bottom=strategyOf(field('底部弹出'))
 assert.equal(bottom.appear,'scroll_or_exit'); assert.equal(bottom.scrollPct,80); assert.equal(bottom.oncePerVisit,true); assert.equal(bottom.closeDays,7)
 assert.ok(strategySummary(field('底部弹出')).includes('关闭后 7 天内不再出现'))
 // A mode that the placement does not support falls back to its first option.
 assert.equal(strategyOf(field('首屏 Banner',{strategy:{appear:'exit'}})).appear,'immediate')
})
test('策略校验：日期、时段、次数与显示页面',()=>{
 assert.deepEqual(strategyIssues(field('页中横幅')),[])
 assert.ok(strategyIssues(field('页中横幅',{strategy:{startDate:'2026-12-01',endDate:'2026-11-01'}}))[0].includes('结束日期'))
 assert.ok(strategyIssues(field('页中横幅',{strategy:{startTime:'09:00',endTime:'09:00'}})).length)
 assert.ok(strategyIssues(field('底部弹出',{strategy:{dailyLimit:3,totalLimit:2}})).some(i=>i.includes('累计上限')))
 assert.ok(strategyIssues(field('页中横幅',{scopes:[]})).some(i=>i.includes('显示页面')))
})
test('效果数据记录展示、关闭与未展示事件，不可关闭的位置没有关闭',()=>{
 const placements=[field('首屏 Banner'),field('底部弹出')]
 const history=[{number:1,version:'1.0.0',publishedAt:'2026-11-01T00:00:00Z',draft:{goal:'获取报价',promote:true,placements} as unknown as Draft}] as PublishedVersion[]
 const data=versionPerformance('p',history,0,'最近 7 天',Date.parse('2026-11-18T00:00:00Z'))
 const banner=data.placements.find(p=>p.name==='首屏 Banner')!, bottom=data.placements.find(p=>p.name==='底部弹出')!
 assert.equal(banner.closes,0)
 assert.ok(bottom.closes>0&&bottom.reach<=bottom.views)
 assert.ok(!data.events.some(e=>e.placement==='首屏 Banner'&&e.event==='关闭'))
 assert.ok(data.events.some(e=>e.placement==='底部弹出'&&e.event==='关闭'&&e.note==='7 天内不再出现'))
 assert.ok(data.events.some(e=>e.event==='未展示'))
})
