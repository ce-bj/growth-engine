import test from 'node:test'
import assert from 'node:assert/strict'
import {mockTemplatesData} from './templates'
import {selectTemplate} from './generation'
import {inspectMarketingPage} from './marketingInspection'
import {prepareFirstDraft,applySupplementContent,buildContinuationRequest} from './continuation'
import type {Draft} from './MarketingStudio'
const base=()=>({id:'required-test',revision:1,stage:'templates',company:'测试企业',website:'https://example.com',industry:'机械',business:'设备',need:'产品介绍',intentText:'',templateId:'precision',sections:[],goal:'获取报价',productIds:[],optionalFields:{},knowledgeDirs:['产品资料'],knowledgeReady:false,formSet:'基础联系',formConfigured:false,formFields:[],formGuidance:'',layout:'split',heroVisible:true,footerVisible:true,image:'',imageReady:false,elementTexts:{},region:'中国大陆',language:'中文简体',color:'#2165b7',fontStyle:'现代无衬线',title:'',subtitle:'',secondary:'不设置',logo:'',videoUrl:''} as unknown as Draft)
// Clearing drafted copy simulates a region whose expression content failed or was removed by the user.
const cleared=(d:Draft,ids:string[])=>({...d,sections:d.sections.map(s=>ids.includes(s.id)?{...s,body:'',items:undefined,drafted:false}:s)})
test('首版起草表达类内容，事实与素材仍为缺口',()=>{
 const draft=prepareFirstDraft({...base(),...selectTemplate(base(),mockTemplatesData[0])})
 const ids=inspectMarketingPage(draft).map(g=>g.id)
 for(const id of ['product-binding','hero-image','contact-information'])assert.ok(ids.includes(id),id)
 for(const id of ['content-s0','content-s1','content-s2'])assert.ok(!ids.includes(id),id)
 assert.ok(draft.sections[1].body&&draft.sections[1].drafted)
 assert.equal(draft.sections[2].items?.length,3)
 assert.notEqual(draft.title,mockTemplatesData[0].headline)
 assert.ok(draft.eyebrow&&draft.trustPoints?.length)
 assert.equal(inspectMarketingPage(draft).find(g=>g.id==='product-binding')?.level,'generate')
 assert.equal(inspectMarketingPage(draft).find(g=>g.id==='hero-image')?.level,'publish')
})
test('规格取自产品库，联系方式取自站点档案',()=>{
 const draft=prepareFirstDraft({...base(),...selectTemplate(base(),mockTemplatesData[0])})
 assert.ok(!inspectMarketingPage({...draft,productIds:['gate']}).some(g=>g.id==='product-specification'))
 const missing=inspectMarketingPage({...draft,productIds:['gate','clean']}).find(g=>g.id==='product-specification')
 assert.deepEqual(missing?.productIds,['clean'])
 assert.ok(!inspectMarketingPage({...draft,productIds:['clean'],productSpecs:{clean:'B-200'}}).some(g=>g.id==='product-specification'))
 assert.ok(!inspectMarketingPage({...draft,siteContact:'sales@example.com'}).some(g=>g.id==='contact-information'))
})
test('全部必需项验证后解除缺口，分模块输入不覆盖其他区域',()=>{
 const draft=prepareFirstDraft({...base(),...selectTemplate(base(),mockTemplatesData[0])})
 const patch={productIds:['gate'],image:'data:image/png;base64,test',imageReady:true,optionalFields:{'产品规格/型号':'A-100','联系方式':'sales@example.com'},componentInputs:{s0:'产品能力说明',s1:'应用于水处理工程',s2:'提供选型技术支持'}}
 const next=applySupplementContent(draft,patch,['s0','s1','s2'])
 assert.equal(inspectMarketingPage(next).length,0)
 assert.deepEqual(next.sections.slice(0,3).map(s=>s.body),['产品能力说明','应用于水处理工程','提供选型技术支持'])
 assert.equal(next.sections[3].body,draft.sections[3].body)
 const resume=buildContinuationRequest(draft,mockTemplatesData[0],{operation:'resume',targetComponentIds:['s0','s1','s2'],resolvedGapIds:inspectMarketingPage(draft).map(g=>g.id)},next)
 assert.equal(resume.runtimeContext.base_revision,1)
 assert.equal(Object.keys(resume.blocks).slice(-1)[0],'KNOWLEDGE_SCOPE_JSON')
 assert.ok(resume.userPrompt.includes('validated_component_inputs'))
 assert.ok(!resume.systemPrompt.includes('page 包含 templateId'))
})
test('一段普通补充不能自动填满多个必填模块',()=>{
 const draft=cleared(prepareFirstDraft({...base(),...selectTemplate(base(),mockTemplatesData[0])}),['s1','s2'])
 const next=applySupplementContent(draft,{supplementText:'一段尚未分配的说明'},['s0','s1','s2'])
 assert.ok(inspectMarketingPage(next).some(g=>g.id==='content-s1'))
 assert.ok(inspectMarketingPage(next).some(g=>g.id==='content-s2'))
})

// All unresolved page requirements prevent publication while unrelated editing stays available.
import {completionPolicy,publicationBlockers,publicationReadiness} from './completionPolicy'
test('文案和图片可由 AI 完善，真实产品与联系信息需要确认',()=>{
 const draft=cleared(prepareFirstDraft({...base(),...selectTemplate(base(),mockTemplatesData[0])}),['s0'])
 const gaps=inspectMarketingPage(draft)
 assert.equal(completionPolicy(gaps.find(g=>g.id==='hero-image')!).mode,'generate_image')
 assert.equal(completionPolicy(gaps.find(g=>g.id==='content-s0')!).mode,'draft_content')
 assert.equal(completionPolicy(gaps.find(g=>g.id==='product-binding')!).mode,'recommend_product')
 assert.equal(completionPolicy(gaps.find(g=>g.id==='contact-information')!).needsConfirmation,true)
 const blockers=publicationBlockers(gaps).map(g=>g.id)
 assert.ok(blockers.includes('hero-image'))
 assert.ok(blockers.includes('content-s0'))
 assert.ok(blockers.includes('product-binding'))
})

test('发布条件统一覆盖待补充、待应用、待发送与运行中的任务',()=>{
 const d=prepareFirstDraft({...base(),...selectTemplate(base(),mockTemplatesData[0])})
 assert.ok(publicationReadiness(d).length)
 const complete=applySupplementContent(d,{productIds:['gate'],image:'data:image/png;base64,test',optionalFields:{'产品规格/型号':'A-100','联系方式':'sales@example.com'},componentInputs:{s0:'产品说明',s1:'应用说明',s2:'支持说明'}},['s0','s1','s2'])
 assert.deepEqual(publicationReadiness(complete),[])
 assert.ok(publicationReadiness({...complete,pendingSupplement:{supplementText:'未应用'}}).length)
 assert.ok(publicationReadiness(complete,{unsentText:'请修改标题'}).length)
 assert.ok(publicationReadiness(complete,{busy:true}).length)
 assert.ok(publicationReadiness(complete,{aiPrepared:true}).length)
 const waiting={...d,aiJobs:{'hero-image':{requestId:'r1',label:'图片',mode:'generate_image',status:'requested' as const,baseRevision:1}}}
 assert.ok(publicationReadiness(waiting).some(reason=>reason.includes('尚未返回并采用')))
 // An authorized AI request itself never resolves the missing content.
 assert.ok(inspectMarketingPage(waiting).some(g=>g.id==='hero-image'))
})
test('自定义组件：只有激活组件参与生成，首屏标题按需求起草',()=>{
 const sections=[{id:'a',kind:'faq' as const,title:'常见问题',body:''},{id:'b',kind:'features' as const,title:'核心优势',body:'',hidden:true}]
 const draft=prepareFirstDraft({...base(),templateId:'custom',title:'',sections})
 assert.ok(draft.title.trim())
 assert.equal(draft.sections.find(s=>s.id==='a')?.items?.length,3)
 assert.ok(!draft.sections.find(s=>s.id==='b')?.items)
 assert.ok(!inspectMarketingPage(draft).some(g=>g.targetComponentIds.includes('b')))
})
import {applyAiCompletion} from './aiCompletion'
test('AI 完善发送后直接应用结果，缺口关闭即可发布；查不到的项目保留',()=>{
 const first=prepareFirstDraft({...base(),...selectTemplate(base(),mockTemplatesData[0])})
 const gaps=inspectMarketingPage(first)
 assert.ok(gaps.length>0)
 const withJobs={...first,aiJobs:Object.fromEntries(gaps.map(g=>[g.id,{requestId:'r',label:g.label,mode:'draft_content',status:'requested' as const,baseRevision:1}]))}
 const {draft,pending}=applyAiCompletion(withJobs,gaps)
 assert.deepEqual(pending,[])
 assert.deepEqual(inspectMarketingPage(draft),[])
 assert.deepEqual(publicationReadiness(draft),[])
 assert.ok(draft.productIds.length>0)
 const video={...first,sections:[...first.sections,{id:'v',kind:'video' as const,title:'视频',body:''}]}
 const result=applyAiCompletion(video,inspectMarketingPage(video))
 assert.ok(inspectMarketingPage(result.draft).some(g=>g.id==='video-binding'))
 assert.deepEqual(result.pending,['视频素材'])
})
