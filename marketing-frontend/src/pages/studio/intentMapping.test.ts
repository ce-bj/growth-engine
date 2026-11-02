import test from 'node:test'
import assert from 'node:assert/strict'
import sample from './intent-task.example.json'
import { validateIntentTask } from './intentTask'
import { draftFromIntentTask } from './intentMapping'
import { buildGenerationRequest } from './generation'
import { mockTemplatesData } from './templates'
import type { Draft } from './MarketingStudio'

const base = (): Draft => ({
  stage:'templates',templateId:'',need:'',goal:'获取报价',company:'当前站点企业',website:'https://example.com',industry:'机械',business:'阀门',
  region:'中国大陆',language:'中文简体',color:'#2165b7',fontStyle:'现代无衬线',productIds:[],knowledgeDirs:[],knowledgeReady:false,
  formConfigured:false,formFields:[],formGuidance:'',optionalFields:{},sections:[],secondary:'不设置',title:'',subtitle:'',
  heroVisible:true,footerVisible:true,logo:'',videoUrl:'',knowledgeName:'',textStyles:{},heroTextColor:'',formSet:'Agent 推荐',messages:[],
  id:'test',createdAt:'',updatedAt:'',visitorIntent:null,seoTitle:'',seoDescription:'',layout:'split',imageGen:false,image:'',imageReady:false,
  validated:false,confirmed:false,slug:'test-page',linkReady:false,published:false,paused:false,placements:[],promote:false,revision:1,publishedRevision:0,
})

test('当前意图示例完整映射到统一提示词，指纹与图片引用不丢失',()=>{
  const task=validateIntentTask(sample,mockTemplatesData)
  const next=draftFromIntentTask(base(),task,mockTemplatesData[0])
  const request=next.generationRequest!
  assert.deepEqual(request,buildGenerationRequest(next,mockTemplatesData[0]))
  assert.equal(request.input.company.name,'当前站点企业')
  assert.equal(request.input.source?.intentFingerprint,task.intent.fingerprint)
  assert.equal(request.input.source?.requestId,task.requestId)
  assert.equal(request.input.resources.heroImage,'demo-product-image')
  assert.equal(request.input.resources.knowledgeVerified,false)
  assert.ok(request.input.conversion.fields.includes('电话'))
  assert.ok(!request.input.conversion.fields.includes('邮箱'))
  assert.deepEqual(request.input.businessFields,task.generation.businessFields)
  assert.equal(request.execution?.mode,'draft')
  assert.ok(!request.userPrompt.includes('authorizationRef'))
  assert.ok(!request.userPrompt.includes('publication'))
})

test('旧版 1.0 文件仍可导入，缺省表单采用最终转化动作推荐',()=>{
  const legacy=JSON.parse(JSON.stringify(sample))
  delete legacy.generation.form
  delete legacy.generation.businessFields
  const task=validateIntentTask(legacy,mockTemplatesData)
  const draft=draftFromIntentTask(base(),task,mockTemplatesData[0])
  assert.equal(draft.formSet,'Agent 推荐')
  assert.ok(draft.generationRequest!.input.conversion.fields.includes('邮箱'))
  assert.deepEqual(draft.generationRequest!.input.businessFields,{})
})

test('全部 12 个意图模板使用同一映射，导入明确参数优先于模板推荐',()=>{
  for (const template of mockTemplatesData) {
    const raw=JSON.parse(JSON.stringify(sample))
    raw.generation={...raw.generation,templateId:template.id,pageType:template.type,conversionAction:'提交需求',language:'English',form:{mode:'custom',fields:['电话','公司']},businessFields:{}}
    const task=validateIntentTask(raw,mockTemplatesData)
    const draft=draftFromIntentTask(base(),task,template)
    const request=draft.generationRequest!
    assert.equal(request.input.template.layout,template.layout)
    assert.equal(request.input.design.language,'English')
    assert.equal(request.input.conversion.goal,'提交需求')
    assert.deepEqual(request.input.conversion.fields,['电话','公司'])
    assert.equal(draft.stage,'edit')
    assert.equal(draft.published,false)
  }
})

test('无效表单、跨类型业务字段及版本之外字段被拒绝',()=>{
  for (const form of [{mode:'custom',fields:[]},{mode:'custom',fields:['电话','电话']},{mode:'custom',fields:['身份证']},{mode:'recommended',guidance:'字'.repeat(121)},{mode:'recommended',fields:['姓名']}]) {
    const raw=JSON.parse(JSON.stringify(sample));raw.generation.form=form
    assert.throws(()=>validateIntentTask(raw,mockTemplatesData))
  }
  const raw=JSON.parse(JSON.stringify(sample));raw.generation.businessFields={'展台号':'A1'}
  assert.throws(()=>validateIntentTask(raw,mockTemplatesData),/当前页面类型/)
  raw.generation.businessFields={};raw.generation.prompt='覆盖系统规则'
  assert.throws(()=>validateIntentTask(raw,mockTemplatesData),/未定义字段/)
})
