import test from 'node:test'
import assert from 'node:assert/strict'
import {requestedBlock,editorSuggestions} from './EditorAssist'
import type {Draft} from './MarketingStudio'
import type {MarketingGap} from './marketingInspection'
const draft=()=>({sections:[{id:'s0',kind:'text',title:'介绍',body:'x'}]} as unknown as Draft)
const gap=(id:string)=>({id,label:id,source:'',reason:'',targetComponentIds:[]}) as MarketingGap
test('对话中的“加一个模块”映射到组件类型',()=>{
  assert.equal(requestedBlock('加一个客户案例')?.kind,'testimonials')
  assert.equal(requestedBlock('添加常见问题模块')?.kind,'faq')
  assert.equal(requestedBlock('把标题改短'),undefined)
})
test('推荐指令先提示缺少的资料，选中内容时只给针对选区的指令',()=>{
  const list=editorSuggestions(draft(),[gap('product-binding'),gap('hero-image')],'')
  assert.deepEqual(list.slice(0,2).map(s=>s.label),['补充产品','添加主图'])
  assert.ok(list.length<=4)
  assert.deepEqual(editorSuggestions(draft(),[],'hero:title').map(s=>s.label),['更简洁','改成指定文字'])
})
