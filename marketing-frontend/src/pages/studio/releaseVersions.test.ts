import test from 'node:test'
import assert from 'node:assert/strict'
import {incrementVersion,publishVersion,releaseHistory,currentVersion} from './releaseVersions'
import type { Draft } from './MarketingStudio'
test('三位版本递增和低位归零',()=>{assert.equal(incrementVersion('1.2.3','major'),'2.0.0');assert.equal(incrementVersion('1.2.3','minor'),'1.3.0');assert.equal(incrementVersion('1.2.3','patch'),'1.2.4');assert.throws(()=>incrementVersion('1.2','patch'))})
test('每次发布递增，旧快照独立于后续编辑',()=>{
 const draft={id:'p',title:'首版',publishedRevision:0,published:false,updatedAt:'2026-10-29T00:00:00Z'} as Draft
 const one=publishVersion({id:'p',draft},draft,'major','首次发布','2026-10-29T01:00:00Z')
 const edited={...one.draft,title:'第二版'}
 const two=publishVersion(one,edited,'minor','新增内容','2026-10-29T02:00:00Z')
 assert.equal(currentVersion(one),'1.0.0');assert.equal(currentVersion(two),'1.1.0')
 assert.equal(two.versions?.[0].draft.title,'首版');assert.equal(two.versions?.[1].draft.title,'第二版')
 edited.title='未发布修改';assert.equal(two.publishedDraft?.title,'第二版')
 assert.equal(two.versions?.length,2);assert.equal(two.draft.publishedRevision,2)
})
test('旧数字版本与仅有发布快照的页面能继续发布',()=>{
 const draft={id:'p',title:'旧页面',publishedRevision:2,published:true,updatedAt:'2026-10-29T00:00:00Z'} as Draft
 const page={id:'p',draft,publishedDraft:draft,versions:[{number:1,publishedAt:draft.updatedAt,draft},{number:2,publishedAt:draft.updatedAt,draft}]}
 assert.equal(currentVersion(page),'1.0.1')
 assert.equal(currentVersion(publishVersion(page,draft,'patch','','2026-10-29T01:00:00Z')),'1.0.2')
 assert.equal(releaseHistory({id:'p',draft,publishedDraft:draft}).length,1)
 assert.equal(releaseHistory({id:'p',draft}).length,0)
})
