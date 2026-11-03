import test from 'node:test'
import assert from 'node:assert/strict'
import { inspectMarketingPage } from './marketingInspection'
import { inspectBrandConsistency, brandSolution, brandSnapshotKey, applyBrandSolution, optimizeBrandFinding } from './websiteAudit'
import type { Draft } from './MarketingStudio'
const draft = (): Draft => ({id:'page-test',revision:1,company:'测试企业',need:'',intentText:'',templateId:'custom',sections:[],layout:'form-side',productIds:[],imageReady:true,knowledgeReady:true,formSet:'基础联系',formConfigured:false,formFields:[],formGuidance:'',goal:'获取报价',optionalFields:{},elementTexts:{},subtitle:'',heroVisible:true,footerVisible:true} as unknown as Draft)
test('产品缺口取决于页面要求，普通线索页不强制选择产品',()=>{
 assert.ok(!inspectMarketingPage(draft()).some(g=>g.label==='关联产品'))
 const d={...draft(),sections:[{id:'p',kind:'products' as const,title:'产品',body:''}]}
 assert.equal(inspectMarketingPage(d).find(g=>g.label==='关联产品')?.source,'组件「产品」')
 assert.ok(!inspectMarketingPage({...d,productIds:['gate']}).some(g=>g.label==='关联产品'))
 assert.ok(inspectMarketingPage({...d,productIds:['nonexistent']}).some(g=>g.label==='关联产品'))
})
test('明确意图中的产品要求保持有效，隐藏组件不能绕过要求',()=>{
 const d={...draft(),intentText:'必须展示关联产品',sections:[{id:'p',kind:'products' as const,title:'产品',body:'',hidden:true}]}
 assert.ok(inspectMarketingPage(d).some(g=>g.label==='关联产品'))
 assert.ok(!inspectMarketingPage({...draft(),need:'不需要产品，只收集线索'}).some(g=>g.label==='关联产品'))
})
test('品牌报告不改页面；方案只允许作用于同一页面及内容快照',()=>{
 const d={...draft(),elementTexts:{'header:brand':'旧品牌'},siteSellingPoints:'可靠制造',siteContact:'010-12345678'}
 const before=JSON.stringify(d); const report=inspectBrandConsistency(d)
 assert.equal(JSON.stringify(d),before)
 assert.equal(report.providerModule,'ai-readiness')
 const item=report.findings.find(f=>f.checkId==='brand-name')!
 assert.equal(item.status,'inconsistent')
 const text=brandSolution(report,item)
 const patch=applyBrandSolution(d,report,text)
 assert.equal(patch?.elementTexts?.['header:brand'],'测试企业')
 assert.equal(applyBrandSolution({...d,id:'other'},report,text),null)
 assert.equal(applyBrandSolution({...d,subtitle:'已经修改'},report,text),null)
 assert.notEqual(brandSnapshotKey(d),brandSnapshotKey({...d,subtitle:'已经修改'}))
 assert.equal(applyBrandSolution(d,report,text+'另外修改所有产品'),null)
})
test('缺少品牌基准不能宣称检测通过，也不能生成事实替换方案',()=>{
 const report=inspectBrandConsistency(draft())
 const finding=report.findings.find(f=>f.checkId==='brand-contact')!
 assert.equal(finding.status,'needs_input')
 assert.equal(brandSolution(report,finding),'')
})

test('同意后自动优化单项，保留其他内容并支持继续处理同一报告',()=>{
 const d={...draft(),elementTexts:{'header:brand':'旧品牌','footer:contact':'旧电话','other:title':'保留'},siteSellingPoints:'可靠制造',siteContact:'010-12345678'}
 d.websiteAudit=inspectBrandConsistency(d)
 const before=JSON.stringify(d)
 const next=optimizeBrandFinding(d,d.websiteAudit,'brand-name')!
 assert.ok(next)
 assert.equal(JSON.stringify(d),before)
 assert.equal(next.elementTexts?.['header:brand'],d.company)
 assert.equal(next.elementTexts?.['other:title'],'保留')
 assert.equal(next.revision,d.revision+1)
 assert.ok(next.websiteAudit?.findings[0].appliedAt)
 assert.equal(optimizeBrandFinding(next,next.websiteAudit,'brand-name'),null)
 const again=optimizeBrandFinding(next,next.websiteAudit,'brand-contact')!
 assert.equal(again.elementTexts?.['footer:contact'],'010-12345678')
 assert.equal(optimizeBrandFinding({...d,subtitle:'新的编辑'},d.websiteAudit,'brand-name'),null)
 assert.equal(optimizeBrandFinding({...d,id:'other'},d.websiteAudit,'brand-name'),null)
})
test('自动优化不会为缺失基准造事实，也不执行范围外替换',()=>{
 const d=draft();d.websiteAudit=inspectBrandConsistency(d)
 assert.equal(optimizeBrandFinding(d,d.websiteAudit,'brand-contact'),null)
 const changed={...d,elementTexts:{'header:brand':'旧品牌'}}
 changed.websiteAudit=inspectBrandConsistency(changed)
 changed.websiteAudit.findings[0].replacements={'other:title':changed.company}
 assert.equal(optimizeBrandFinding(changed,changed.websiteAudit,'brand-name'),null)
})
test('品牌基准来自站点档案；核心卖点按语义补充，不整段替换首屏文案',()=>{
 const pageOnly={...draft(),optionalFields:{'核心卖点':'本页卖点','联系方式':'本页电话'}}
 assert.equal(inspectBrandConsistency(pageOnly).findings.find(f=>f.checkId==='brand-selling')!.status,'needs_input')
 const d={...draft(),subtitle:'面向工程项目的选型支持。',siteSellingPoints:'耐腐蚀'}
 d.websiteAudit=inspectBrandConsistency(d)
 const selling=d.websiteAudit.findings.find(f=>f.checkId==='brand-selling')!
 assert.equal(selling.status,'review')
 const next=optimizeBrandFinding(d,d.websiteAudit,'brand-selling')!
 assert.equal(next.elementTexts?.['hero:body'],'面向工程项目的选型支持，耐腐蚀。')
 assert.equal(inspectBrandConsistency({...d,subtitle:'产品耐腐蚀，适用于工程项目。'}).findings.find(f=>f.checkId==='brand-selling')!.status,'consistent')
})
