import test from 'node:test'
import assert from 'node:assert/strict'
import {publishState,rowActions,STATE_COMBOS,applyPromotionParts,withPagePromotion,canPromote,emptyStore,loadStore,slotKey,slotLabel,SLOTS,promotionState,linkState,pickForPlacement,placementsOf,promotionIssues,defaultPromotion,inDailyHours,type PromotedPage,type PromotionStore} from './promotion'
const page=(id:string,published=true,paused=false):PromotedPage=>({id,draft:{title:`页面${id}`,slug:`p-${id}`,published,paused}})
const at=(s:string)=>new Date(s)
const HOME=slotKey('Banner','Home'),NEWS=slotKey('Banner','News_detail')
const store=():PromotionStore=>{const s=emptyStore();s.assignments[NEWS]=['a','b'];s.assignments[HOME]=['a'];return s}
test('位置与营销页多对多；推广状态随发布、暂停与推广期变化',()=>{
 const s=store()
 assert.deepEqual(placementsOf(s,'a'),[HOME,NEWS])
 assert.equal(slotLabel(NEWS),'Banner · 新闻详细')
 assert.equal(promotionState(s,page('c'),at('2026-11-18T10:00:00')),'none')
 assert.equal(promotionState(s,page('a',false),at('2026-11-18T10:00:00')),'unpublished')
 assert.equal(promotionState(s,page('a',true,true),at('2026-11-18T10:00:00')),'paused')
 s.pages.a={...defaultPromotion('A'),startDate:'2026-11-20',endDate:'2026-11-30'}
 assert.equal(promotionState(s,page('a'),at('2026-11-18T10:00:00')),'scheduled')
 assert.equal(promotionState(s,page('a'),at('2026-11-25T10:00:00')),'active')
 assert.equal(promotionState(s,page('a'),at('2026-12-01T10:00:00')),'ended')
 s.pages.a={...s.pages.a,startTime:'09:00',endTime:'18:00'}
 assert.equal(promotionState(s,page('a'),at('2026-11-25T20:00:00')),'off_hours')
})
test('链接是否有效只看是否发布',()=>{
 assert.equal(linkState(page('a',false)).valid,false)
 assert.equal(linkState(page('a',true,true)).valid,true)
})
test('时段跨夜与配置校验',()=>{
 const cfg={...defaultPromotion('A'),startTime:'20:00',endTime:'08:00'}
 assert.equal(inDailyHours(cfg,at('2026-11-18T23:00:00')),true)
 assert.equal(inDailyHours(cfg,at('2026-11-18T12:00:00')),false)
 assert.ok(promotionIssues({...cfg,startDate:'2026-12-01',endDate:'2026-11-01'})[0].includes('结束日期'))
 assert.ok(promotionIssues({...cfg,caption:' '}).some(i=>i.includes('文案')))
})
test('位置按顺序展示第一个推广中的页面；点了不再提醒的页面跳过，设备不符也跳过',()=>{
 const s=store(); const pages=[page('a'),page('b')]; const now=at('2026-11-18T10:00:00')
 assert.equal(pickForPlacement(s,pages,NEWS,'电脑',now,()=>false)?.id,'a')
 assert.equal(pickForPlacement(s,pages,NEWS,'电脑',now,(_p,id)=>id==='a')?.id,'b')
 assert.equal(pickForPlacement(s,pages,NEWS,'电脑',now,()=>true),undefined)
 s.pages.a={...defaultPromotion('A'),devices:['手机','平板']}
 assert.equal(pickForPlacement(s,pages,NEWS,'电脑',now,()=>false)?.id,'b')
 assert.equal(pickForPlacement(s,pages,NEWS,'手机',now,()=>false)?.id,'a')
 s.pages.b={...defaultPromotion('B'),devices:['电脑']}
 assert.equal(pickForPlacement(s,pages,HOME,'电脑',now,()=>false),undefined)
})
test('推广期按本地日期判断，凌晨时段不会因时区错位',()=>{
 const s=store(); s.pages.a={...defaultPromotion('A'),startDate:'2026-11-25'}
 assert.equal(promotionState(s,page('a'),new Date(2026,10,25,1,0)),'active')
})
test('本期只开放 Banner：位置为 Banner × 网站页面树',()=>{
 assert.equal(SLOTS.length,10)
 assert.ok(SLOTS.every(s=>s.startsWith('Banner:')))
 assert.ok(SLOTS.includes(slotKey('Banner','products_detail')))
})
test('旧数据迁移：首屏 Banner 归到首页 Banner，单个设备变为设备列表，规划中的位置不保留',()=>{
 const mem=new Map<string,string>()
 ;(globalThis as {localStorage?:unknown}).localStorage={getItem:(k:string)=>mem.get(k)??null,setItem:(k:string,v:string)=>mem.set(k,v),removeItem:(k:string)=>mem.delete(k)}
 mem.set('marketing-studio-promotion-v1',JSON.stringify({assignments:{'首屏 Banner':['a'],'底部弹出':['b']},pages:{a:{...defaultPromotion('A'),devices:undefined,device:'手机'},b:{...defaultPromotion('B'),devices:undefined,device:'全部设备'}}}))
 const s=loadStore()
 assert.deepEqual(s.assignments,{[HOME]:['a']})
 assert.deepEqual(s.pages.a.devices,['手机'])
 assert.equal(s.pages.b.devices.length,3)
})
test('发布状态：未发布 → 已发布 → 有未发布修改；下线后链接失效，推广设置保留',()=>{
 const draft=page('a',false); assert.equal(publishState(draft),'draft'); assert.equal(canPromote(draft),false)
 assert.equal(publishState(page('a')),'published'); assert.equal(publishState(page('a'),true),'changed')
 const offline={...page('a',false),versions:[{}]}
 assert.equal(publishState(offline),'offline'); assert.equal(canPromote(offline),true)
 assert.equal(linkState(offline).valid,false); assert.ok(linkState(offline).label.includes('下线'))
 const s=store(); assert.equal(promotionState(s,offline,at('2026-11-18T10:00:00')),'unpublished')
 assert.deepEqual(placementsOf(s,'a').length,2)
})
test('状态组合决定操作：未发布只能去发布；在线页面按推广状态暂停/恢复/结束；下线页面只能重新上线或更新发布；手动结束优先于日期',()=>{
 assert.deepEqual(rowActions('draft','none'),['edit','preview','publish'])
 assert.deepEqual(rowActions('published','active'),['edit','preview','offline','history','settings','pause','end','results'])
 assert.deepEqual(rowActions('changed','paused'),['edit','preview','update','offline','history','settings','resume','end','results'])
 assert.deepEqual(rowActions('published','ended'),['edit','preview','offline','history','settings','results'])
 assert.deepEqual(rowActions('offline','unpublished'),['edit','preview','update','online','history','settings','results'])
 assert.equal(STATE_COMBOS.length,15)
 const s=store(); s.pages.a={...defaultPromotion('A'),endedAt:'2026-11-18T09:00:00Z'}
 assert.equal(promotionState(s,page('a'),at('2026-11-18T10:00:00')),'ended')
 assert.equal(pickForPlacement(s,[page('a'),page('b')],HOME,'电脑',at('2026-11-18T10:00:00'),()=>false),undefined)
})
test('批量设置只覆盖勾选的项目；修改推广期会重新开始已结束的推广',()=>{
 const cfg={...defaultPromotion('A'),caption:'自有文案',devices:['手机' as const],endedAt:'2026-11-18T09:00:00Z'}
 const patch={...defaultPromotion(''),startDate:'2026-12-01',startTime:'09:00',endTime:'18:00',devices:['电脑' as const]}
 const onlyDevices=applyPromotionParts(cfg,patch,{period:false,hours:false,devices:true})
 assert.deepEqual(onlyDevices.devices,['电脑']); assert.equal(onlyDevices.startTime,'00:00'); assert.equal(onlyDevices.caption,'自有文案'); assert.ok(onlyDevices.endedAt)
 const period=applyPromotionParts(cfg,patch,{period:true,hours:false,devices:false})
 assert.equal(period.startDate,'2026-12-01'); assert.equal(period.endedAt,undefined); assert.deepEqual(period.devices,['手机'])
})
test('单页保存推广位置：保留原有顺序，新位置排在末尾，取消的位置移除',()=>{
 const s=store(); s.assignments[HOME]=['b','a']
 const next=withPagePromotion(s,'a',[HOME,slotKey('Banner','contact')],{...defaultPromotion('A'),batchAt:'x'})
 assert.deepEqual(next.assignments[HOME],['b','a'])
 assert.deepEqual(next.assignments[slotKey('Banner','contact')],['a'])
 assert.deepEqual(next.assignments[NEWS],['b'])
 assert.equal(next.pages.a.batchAt,undefined)
})
