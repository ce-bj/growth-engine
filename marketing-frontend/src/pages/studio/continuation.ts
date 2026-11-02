import type { Draft, Template } from './MarketingStudio'
import { createComponent } from './componentDefaults'
import { inspectMarketingPage, requiresProducts } from './marketingInspection'
import { buildGenerationRequest } from './generation'
import { inferKind } from './blocks'

export function prepareFirstDraft(draft:Draft):Draft {
 let sections=draft.sections
 if(requiresProducts(draft)&&!sections.some(s=>!s.hidden&&['products','comparison'].includes(s.kind||inferKind(s.title)))){
  sections=[...sections,createComponent('products',crypto.randomUUID(),'关联产品')]
 }
 return applySupplementContent({...draft,sections},{},sections.map(s=>s.id))
}
export function applySupplementContent(base:Draft,patch:Partial<Draft>,targetIds:string[]):Draft {
 const next={...base,...patch}
 const text=patch.supplementText?.trim()||next.supplementText?.trim()||(next.assets||[]).find(a=>a.parsedText?.trim())?.parsedText?.trim()||''
 const sections=next.sections.map(s=>{
  const individual=patch.componentInputs?.[s.id]?.trim()||next.componentInputs?.[s.id]?.trim()
  const content=individual||(targetIds.length===1&&['text','features','timeline','faq','testimonials'].includes(s.kind||inferKind(s.title))?text:'')
  return targetIds.includes(s.id)&&(!s.body.trim()||/^(?:\[?待补充|请补充)/.test(s.body))&&content?{...s,body:content}:s
 })
 return {...next,sections,pendingSupplement:undefined,supplementTargets:undefined,supplementChecked:true,knowledgeReady:next.knowledgeReady||!!text}
}
export interface ContinuationOptions {
 operation:'resume'|'edit';targetComponentIds:string[];userText?:string;selection?:{component_id:string;field_path:string};changedBlocks?:string[];resolvedGapIds?:string[]
}
const PATCH_OUTPUT={request_id:'same as RUNTIME_CONTEXT.request_id',base_revision:'same as RUNTIME_CONTEXT.base_revision',status:'patch_ready | needs_input',operations:[{op:'set_component_content | set_component_props | bind_resource | insert_component | remove_component | move_component | set_visibility | update_page_config',component_id:'authorized component',value:'validated value'}],remaining_gap_ids:[],confirmationItems:[]}
export function buildContinuationRequest(current:Draft,template:Template,options:ContinuationOptions,effective:Draft=current) {
 const request=buildGenerationRequest(effective,template)
 const requestId=crypto.randomUUID()
 const gaps=inspectMarketingPage(effective)
 const runtime={...({} as {ai_task?:{gap_id:string;mode:string;requires_result_confirmation:boolean}}),operation:options.operation,page_id:current.id,request_id:requestId,base_revision:current.revision,preset_ref:{id:current.templateId,version:'1.0'},target_component_ids:options.targetComponentIds,locked_paths:['brand_style','FORM_JSON'],open_gap_ids:gaps.map(g=>g.id),resolved_gap_ids:options.resolvedGapIds||[],changed_blocks:options.changedBlocks||[],current_page:{revision:current.revision,title:current.title,subtitle:current.subtitle,components:current.sections,element_texts:current.elementTexts||{}},generation_scope:'affected_components',unrelated_components_policy:'preserve'}
 const {KNOWLEDGE_SCOPE_JSON,INSPECTION_CONTEXT,...inputs}=request.blocks
 const blocks:Record<string,unknown>={...inputs,RUNTIME_CONTEXT:runtime,INSPECTION_CONTEXT:{page_id:current.id,base_revision:current.revision,open_gaps:gaps,resolved_gap_ids:options.resolvedGapIds||[]}}
 if(options.operation==='resume')blocks.SUPPLEMENT_RESULT={changed_paths:options.changedBlocks||[],validated_gap_ids:options.resolvedGapIds||[],validation_revision:current.revision,validated_business_text:effective.supplementText||null,validated_component_inputs:effective.componentInputs||{}}
 else blocks.USER_EDIT_REQUEST={operation:'edit',message_id:requestId,text:options.userText||'',selection:options.selection||null,allowed_scope:{component_ids:options.targetComponentIds,field_paths:options.selection?[options.selection.field_path]:[]},base_revision:current.revision}
 blocks.KNOWLEDGE_SCOPE_JSON=KNOWLEDGE_SCOPE_JSON
 const rules=`本次 operation=${options.operation}。依据当前页面快照和版本，仅修改 target_component_ids。保留原始意图和无关内容，资料不足保留缺口和占位。自然语言编辑的选区、允许字段为空或范围不明确时返回 needs_input 请求确认。只使用经过验证的补充资料，不把用户上传成功当作条件已经满足。输出增量补丁，不输出整页 page，不发布。`
 return {...request,operation:options.operation,runtimeContext:runtime,blocks,outputSchema:PATCH_OUTPUT,systemPrompt:request.systemPrompt.split('输出约定：')[0]+rules+'\n输出约定：\n'+JSON.stringify(PATCH_OUTPUT,null,2),userPrompt:Object.entries(blocks).map(([key,value])=>key+'\n'+(typeof value==='string'?value:JSON.stringify(value,null,2))).join('\n\n')}
}
export type ContinuationRequest=ReturnType<typeof buildContinuationRequest>
