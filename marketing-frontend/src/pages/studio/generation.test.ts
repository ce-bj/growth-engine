import test from 'node:test'
import assert from 'node:assert/strict'
import type { Draft } from './MarketingStudio'
import { mockTemplatesData } from './templates'
import {templateDesignSpec} from './templateDesign'
import {OPEN_DESIGN_PROVENANCE} from './openDesignPrompt'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import { selectTemplate, applyConfiguration, buildGenerationRequest, SYSTEM_PROMPT } from './generation'
import { formFieldSpecs } from './formFields'

const base = (): Draft => ({
  stage:'templates', templateId:'', need:'', goal:'获取报价', company:'测试企业', website:'https://example.com', industry:'机械', business:'阀门',
  region:'欧洲地区', language:'English', color:'#2165b7', fontStyle:'经典衬线', productIds:['gate'], knowledgeDirs:['产品资料'], knowledgeReady:false,
  formConfigured:false, formFields:[], formGuidance:'', optionalFields:{}, sections:[], secondary:'不设置', title:'', subtitle:'',
  heroVisible:true, footerVisible:true, logo:'', videoUrl:'', knowledgeName:'',
  textStyles:{},heroTextColor:'',formSet:'Agent 推荐',messages:[],id:'test',createdAt:'',updatedAt:'',visitorIntent:null,
  seoTitle:'',seoDescription:'',layout:'split',imageGen:false,image:'',imageReady:false,validated:false,confirmed:false,
  slug:'test-page',linkReady:false,published:false,paused:false,placements:[],promote:false,revision:1,publishedRevision:0,
})

test('12 个真实模板共享用户设计、资源与表单配置，切换时更新推荐值',()=>{
  assert.equal(mockTemplatesData.length,12)
  let draft=base()
  for (const template of mockTemplatesData) {
    draft={...draft,...selectTemplate(draft,template)}
    assert.equal(draft.goal,template.action)
    assert.equal(draft.layout,template.layout)
    assert.deepEqual(draft.sections.map(s=>s.title),template.sections)
    assert.ok(draft.need.includes(template.type))
    const {input}=buildGenerationRequest(draft,template)
    assert.equal(input.design.language,'English')
    assert.equal(input.design.primaryColor,'#2165b7')
    assert.equal(input.design.fontStyle,'经典衬线')
    assert.equal(input.resources.products[0].id,'gate')
    assert.deepEqual(input.resources.knowledgeDirectories,['产品资料'])
    assert.equal(input.conversion.fields.includes('预约日期'),template.action==='活动报名')
  }
})

test('自动需求联动，手写需求和转化动作优先；切换模板清除旧局部文案',()=>{
  let draft={...base(),...selectTemplate(base(),mockTemplatesData[0])}
  draft={...draft,...applyConfiguration(draft,{region:'全球市场'})}
  assert.ok(draft.need.includes('全球市场'))
  draft={...draft,...applyConfiguration(draft,{need:'只介绍核心产品',goal:'发起咨询'})}
  draft={...draft,elementTexts:{'hero:title':'旧标题'},...selectTemplate(draft,mockTemplatesData[3])}
  assert.equal(draft.need,'只介绍核心产品')
  assert.equal(draft.goal,'发起咨询')
  assert.deepEqual(draft.elementTexts,{})
})

test('请求只拼入当前业务字段，保持表单范围，不把媒体二进制拼进提示词',()=>{
  const draft={...base(),...selectTemplate(base(),mockTemplatesData[0]),formConfigured:true,formFields:['电话','公司'],
    optionalFields:{'核心卖点':'耐用','产品规格/型号':'A1','展台号':'OLD-12'},image:'data:image/png;base64,SECRET',logo:'data:image/png;base64,LOGO'}
  const request=buildGenerationRequest(draft,mockTemplatesData[0])
  assert.deepEqual(request.input.businessFields,{'核心卖点':'耐用','产品规格/型号':'A1'})
  assert.deepEqual(request.input.conversion.fields,['电话','公司'])
  assert.equal(request.systemPrompt,SYSTEM_PROMPT)
  assert.ok(request.userPrompt.startsWith('PAGE_INPUT\n'))
  assert.ok(request.userPrompt.includes('FORM_JSON\n'))
  assert.ok(!request.userPrompt.includes('OUTPUT_SCHEMA'))
  assert.ok(!request.userPrompt.includes('base64'))
  assert.ok(!request.userPrompt.includes('OLD-12'))
})

test('自定义组件也走统一请求并排除隐藏模块',()=>{
  const draft={...base(),templateId:'custom',optionalFields:{_pageType:'品牌介绍'},sections:[{id:'x',title:'品牌故事',body:'资料待补充'},{id:'hidden',title:'产品列表',body:'',hidden:true}]}
  const request=buildGenerationRequest(draft,mockTemplatesData[0])
  assert.equal(request.input.template.type,'品牌介绍')
  assert.equal(request.input.template.sections.length,1)
  assert.equal(request.input.template.sections[0].kind,'text')
})


test('旧草稿手写需求在连续切换模板后仍保留',()=>{
  let draft={...base(),need:'旧版手写需求'}
  for (const template of mockTemplatesData) {
    draft={...draft,...selectTemplate(draft,template)}
    assert.equal(draft.need,'旧版手写需求')
  }
})


test('生成请求实际包含 OpenDesign 原文，来源摘要与仓库原文一致',()=>{
  const draft={...base(),...selectTemplate(base(),mockTemplatesData[0])}
  const request=buildGenerationRequest(draft,mockTemplatesData[0])
  assert.ok(request.systemPrompt.includes('Establish a communication focus recognizable at first glance'))
  assert.ok(request.systemPrompt.includes('body text vs background contrast ≥4.5:1'))
  assert.ok(request.systemPrompt.includes('Keep brand and subjects intact'))
  assert.ok(!request.systemPrompt.includes('Ship on write:'))
  assert.deepEqual(request.promptSources,OPEN_DESIGN_PROVENANCE)
  for(const source of request.promptSources.sources){
    const text=readFileSync(source.path,'utf8')
    assert.equal(createHash('sha256').update(text).digest('hex'),source.sha256)
  }
  assert.ok(request.userPrompt.endsWith(JSON.stringify(request.blocks.KNOWLEDGE_SCOPE_JSON,null,2)))
})

test('12 个模板各有明确视觉规范，配置替换后保留参考布局与模块叙事',()=>{
  const compositions=new Set<string>()
  for(const template of mockTemplatesData){
    const draft={...base(),...selectTemplate(base(),template)}
    const request=buildGenerationRequest(draft,template)
    const spec=request.input.template.designSpec
    assert.equal(spec.referenceId,template.id)
    assert.equal(spec.effectiveLayout,template.layout)
    assert.ok(spec.narrative)
    assert.equal(spec.heroColumns,templateDesignSpec(template).heroColumns)
    assert.equal(request.input.design.primaryColor,'#2165b7')
    assert.deepEqual(request.input.template.sections.map(s=>s.title),template.sections)
    compositions.add(spec.composition)
  }
  assert.equal(compositions.size,12)
})

test('每份模板都有表单承接主 CTA；表单默认只要求姓名和第一个联系字段',()=>{
  for(const template of mockTemplatesData){
    const draft={...base(),...selectTemplate(base(),template)}
    assert.ok(draft.layout==='form-side'||draft.sections.some(s=>s.kind==='form'),template.id)
  }
  const fields=formFieldSpecs(['姓名','邮箱','电话','公司','需求说明'])
  assert.deepEqual(fields.filter(f=>f.required).map(f=>f.label),['姓名','邮箱'])
  assert.equal(fields.find(f=>f.label==='电话')?.type,'tel')
  const request=buildGenerationRequest({...base(),...selectTemplate(base(),mockTemplatesData[0])},mockTemplatesData[0])
  assert.ok(request.blocks.FORM_JSON.fields.some(f=>!f.required))
})
