import test from 'node:test'
import assert from 'node:assert/strict'
import {versionPerformance} from './performance'
import {defaultPromotion} from './promotion'
import type {PublishedVersion} from './releaseVersions'
import type {Draft} from './MarketingStudio'
const snap=():Draft=>({goal:'获取报价'} as unknown as Draft)
const history:PublishedVersion[]=[
 {number:1,version:'1.0.0',publishedAt:'2026-10-01T00:00:00Z',draft:snap(),summary:'首次发布'},
 {number:2,version:'1.0.1',publishedAt:'2026-10-15T00:00:00Z',draft:snap(),summary:'调整首屏'},
]
const now=Date.parse('2026-11-03T00:00:00Z')
const promo={placements:['Banner:Home','Banner:products_detail'],cfg:{...defaultPromotion('页面'),startDate:'2026-10-01',endDate:'2026-12-31'}}
test('每个版本各有稳定的数据，旧版本按线上期间统计',()=>{
 const current=versionPerformance('page-1',history,1,'最近 7 天',promo,now)
 assert.deepEqual(current,versionPerformance('page-1',history,1,'最近 7 天',promo,now))
 assert.equal(current.current,true)
 assert.equal(current.daily.length,7)
 assert.equal(versionPerformance('page-1',history,1,'最近 30 天',promo,now).daily.length,30)
 const old=versionPerformance('page-1',history,0,'上线以来',promo,now)
 assert.equal(old.current,false)
 assert.notEqual(old.period.end,'至今')
 assert.equal(current.visits,current.daily.reduce((a,p)=>a+p.visits,0))
 assert.ok(current.conversions<=current.visits)
})
test('推广效果按列表页分配的位置统计，附推广时间；未分配时为演示数据',()=>{
 const current=versionPerformance('page-1',history,1,'最近 7 天',promo,now)
 assert.deepEqual(current.placements.map(p=>p.name),['Banner:Home','Banner:products_detail'])
 assert.equal(current.strategyDemo,false)
 assert.ok(current.placements[0].strategy[0].includes('2026-10-01'))
 assert.ok(current.placements.every(p=>p.clicks<=p.views&&p.reach<=p.views&&p.dismisses<=p.views))
 assert.ok(current.events.some(e=>e.event==='不再提醒'))
 assert.ok(current.records.some(r=>r.converted&&r.action?.includes('获取报价')))
 const none=versionPerformance('page-1',history,1,'最近 7 天',{placements:[],cfg:defaultPromotion('')},now)
 assert.equal(none.strategyDemo,true); assert.equal(none.events.length,0)
 assert.ok(!none.records.some(r=>r.source==='站内推广'))
})
test('Banner 事件记录网站页面与设备，并包含“不再提醒”',()=>{
 const data=versionPerformance('p',history,1,'最近 7 天',{placements:['Banner:products_detail'],cfg:defaultPromotion('页面')},now)
 assert.ok(data.placements[0].dismisses>0)
 assert.ok(data.events.some(e=>e.event==='不再提醒'))
 assert.ok(data.events.every(e=>e.page==='产品详情'&&['电脑','平板','手机'].includes(e.device)))
})
