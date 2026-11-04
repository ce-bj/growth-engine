import test from 'node:test'
import assert from 'node:assert/strict'
import {versionPerformance} from './performance'
import type {PublishedVersion} from './releaseVersions'
import type {Draft} from './MarketingStudio'
const snapshot=(placements:string[]):Draft=>({goal:'获取报价',promote:placements.length>0,placements:['首屏 Banner','页中横幅','智能客服推送'].map(name=>({name,enabled:placements.includes(name)}))} as unknown as Draft)
const history:PublishedVersion[]=[
 {number:1,version:'1.0.0',publishedAt:'2026-10-01T00:00:00Z',draft:snapshot([]),summary:'首次发布'},
 {number:2,version:'1.0.1',publishedAt:'2026-10-15T00:00:00Z',draft:snapshot(['页中横幅','智能客服推送']),summary:'启用推广'},
]
const now=Date.parse('2026-11-03T00:00:00Z')
test('每个版本各有稳定的数据，旧版本按线上期间统计',()=>{
 const current=versionPerformance('page-1',history,1,'最近 7 天',now)
 assert.deepEqual(current,versionPerformance('page-1',history,1,'最近 7 天',now))
 assert.equal(current.current,true)
 assert.equal(current.daily.length,7)
 assert.equal(versionPerformance('page-1',history,1,'最近 30 天',now).daily.length,30)
 const old=versionPerformance('page-1',history,0,'上线以来',now)
 assert.equal(old.current,false)
 assert.notEqual(old.period.end,'至今')
 assert.ok(old.period.end<=current.period.start||old.period.end<='2026-10-20')
 assert.equal(current.visits,current.daily.reduce((a,p)=>a+p.visits,0))
 assert.ok(current.conversions<=current.visits)
})
test('推广策略按该版本启用的位置统计，未启用时标为演示数据',()=>{
 const current=versionPerformance('page-1',history,1,'最近 7 天',now)
 assert.deepEqual(current.placements.map(p=>p.name),['页中横幅','智能客服推送'])
 assert.equal(current.strategyDemo,false)
 assert.ok(current.placements.every(p=>p.clicks<=p.views&&p.conversions<=p.arrivals+1))
 assert.equal(versionPerformance('page-1',history,0,'上线以来',now).strategyDemo,true)
 assert.ok(current.records.some(r=>r.converted&&r.action?.includes('获取报价')))
})
