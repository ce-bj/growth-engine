import {inspectMarketingPage} from './marketingInspection'
import systemRules from './config/generation-system.json'
import presets from './config/template-presets.json'
import {createComponent} from './componentDefaults'
import type { Draft, Template } from './MarketingStudio'
import { inferKind, mockProductsData, OPTIONAL_FIELDS } from './blocks'
import { getFormFields } from './formFields'
import {OPEN_DESIGN_PROMPT,OPEN_DESIGN_ADAPTER,OPEN_DESIGN_PROVENANCE} from './openDesignPrompt'
import {templateDesignSpec} from './templateDesign'

export const PROMPT_VERSION = 'marketing-page-v1.6'
export const SYSTEM_PROMPT = systemRules
export const OUTPUT_SCHEMA = {
 status:'draft_ready | needs_input',
 page:{templateId:'string',title:'string',subtitle:'string',language:'string',markets:['string'],color:'#RRGGBB',fontStyle:'string',layout:'string',goal:'string',seo:{title:'string',description:'string'},sections:[{id:'string',kind:'BlockKind',title:'string',body:'string',productRefs:['product-id'],sourceRefs:['evidence-id']}],imageSlots:['same as IMAGE_ASSETS.slots'],form:'same as FORM_JSON'},
 missingItems:[{block:'string',field:'string',reason:'string',suggestedAction:'string',blocksPublication:true}],conflicts:[],confirmationItems:[],deliveryNotes:[],
}

function defaultNeed(draft: Draft, type: string) {
  const products = mockProductsData.filter(p=>draft.productIds.includes(p.id)).map(p=>p.name).join('、') || draft.business
  return `为${draft.company}创建${type}页面，面向${draft.region}，使用${draft.language}，介绍${products}，引导客户${draft.goal}。`
}

export function applyConfiguration(draft: Draft, patch: Partial<Draft>): Partial<Draft> {
  const configuredFields = [...new Set([...(draft.configuredFields || []), ...Object.keys(patch)])]
  const next = { ...draft, ...patch }
  return { ...patch, configuredFields, ...(draft.stage==='templates' && draft.templateDefaults && !configuredFields.includes('need')
    ? {need:defaultNeed(next,draft.templateDefaults.type)} : {}) }
}

export function selectTemplate(draft: Draft, template: Template): Partial<Draft> {
  const configured = [...(draft.configuredFields || [])]
  if (!draft.templateDefaults && draft.need.trim() && !configured.includes('need')) configured.push('need')
  const goal = configured.includes('goal') ? draft.goal : template.action
  const next = {...draft, goal}
  const need = configured.includes('need') || (!draft.templateDefaults && draft.need.trim()) ? draft.need : defaultNeed(next,template.type)
  return {
    templateId:template.id, title:template.headline, goal, need, layout:template.layout, slug:template.slug, configuredFields:configured,
    templateDefaults:{type:template.type},
    sections:(presets.find(p=>p.preset_id===template.id)?.components||template.sections.map((title,i)=>({slot_id:`s${i}`,title,kind:inferKind(title)}))).map(c=>createComponent(c.kind as import('./blocks').BlockKind,c.slot_id,c.title)),
    elementTexts:{}, elementImages:{}, textStyles:{}, pendingSupplement:undefined, websiteAudit:undefined,
    validated:false, confirmed:false, linkReady:false, generationRequest:undefined,
  }
}

export function buildGenerationRequest(draft: Draft, template: Template) {
  const type = draft.templateId==='custom' ? draft.optionalFields['_pageType'] || template.type : template.type
  const allowed = [...OPTIONAL_FIELDS['公共'], ...(OPTIONAL_FIELDS[type] || [])]
  const input = {
    template:{id:draft.templateId,type,layout:draft.layout,designSpec:{...templateDesignSpec(template,draft.templateId==='custom'),effectiveLayout:draft.layout},sections:draft.sections.filter(s=>!s.hidden).map(s=>({id:s.id,kind:s.kind||inferKind(s.title),title:s.title,body:s.body,columns:s.columns}))},
    company:{name:draft.company,website:draft.website,industry:draft.industry,business:draft.business},
    requirement:draft.need.trim(), visitorIntent:draft.visitorIntent,
    source:draft.agentTask?{schemaVersion:draft.agentTask.request.schemaVersion,requestId:draft.agentTask.request.requestId,siteId:draft.agentTask.request.siteId,sourceAgent:draft.agentTask.request.sourceAgent,intentId:draft.agentTask.request.intent.id,intentFingerprint:draft.agentTask.request.intent.fingerprint}:null,
    design:{market:draft.region,language:draft.language,primaryColor:draft.color,fontStyle:draft.fontStyle,logo:draft.logo?'inline:logo':null,heroVisible:draft.heroVisible,footerVisible:draft.footerVisible},
    conversion:{goal:draft.goal,secondary:draft.secondary,fields:getFormFields(draft),mode:draft.formConfigured?'configured':'recommended',guidance:draft.formGuidance||''},
    businessFields:Object.fromEntries(allowed.filter(name=>draft.optionalFields[name]?.trim()).map(name=>[name,draft.optionalFields[name].trim()])),
    resources:{knowledgeDirectories:draft.knowledgeDirs||[],knowledgeVerified:draft.knowledgeReady,knowledgeName:draft.knowledgeName,
      products:mockProductsData.filter(p=>draft.productIds.includes(p.id)),
      assets:(draft.assets||[]).map(a=>({id:a.id,name:a.name,type:a.type})),
      heroImage:draft.image?'inline:hero-image':draft.imageAssetId||null,elementImages:Object.keys(draft.elementImages||{}),videoUrl:draft.videoUrl||null},
    existingContent:{title:draft.title,subtitle:draft.subtitle,elementTexts:draft.elementTexts||{},textStyles:draft.textStyles||{}},
  }
  const task=draft.agentTask?.request
  const execution=task?{mode:task.publication.mode,slug:draft.slug,placements:draft.placements.filter(p=>p.enabled).map(p=>p.name),navigationPages:task.publication.navigationPages,onMissingResources:task.publication.onMissingResources}:null
  const blocks={
    PAGE_INPUT:{page_goal:{task:'create_landing_page',page_type:type,objective:draft.goal,language:draft.language,markets:[draft.region],requirement:input.requirement,template:{id:input.template.id,layout:draft.layout,design_spec:input.template.designSpec,sections:input.template.sections}},brand_style:{company:input.company,primary_color:draft.color,color_source:'configured',font_style:draft.fontStyle,logo_asset_id:input.design.logo,hero_visible:draft.heroVisible,footer_visible:draft.footerVisible},business_information:{common:{core_selling_points:input.businessFields['核心卖点']?[input.businessFields['核心卖点']]:[],buyer_profile:input.businessFields['目标买家画像']||null,contact_information:input.businessFields['联系方式']||null,competitor_references:input.businessFields['竞品名称或网址']?[input.businessFields['竞品名称或网址']]:[]},page_specific:Object.fromEntries(Object.entries(input.businessFields).filter(([key])=>!OPTIONAL_FIELDS['公共'].includes(key))),missing_value_policy:'mark_pending'}},
    UPLOADED_MATERIALS:{documents:(draft.assets||[]).filter(a=>a.type==='document').map(a=>({id:a.id,name:a.name,parse_status:a.parsedText?'parsed':'pending',extracted_text:a.parsedText||null})),evidence:[...(draft.supplementText?[{id:'user-supplement',source_type:'user_provided',text:draft.supplementText,verification_status:'provided'}]:[]),...Object.entries(draft.componentInputs||{}).map(([component_id,text])=>({id:`input-${component_id}`,component_id,source_type:'user_provided',text,verification_status:'provided'}))],missing_policy:'mark_missing_without_invention'},
    IMAGE_ASSETS:{slots:[...(draft.heroVisible&&draft.layout!=='form-side'?[{slot_id:'hero',purpose:'首屏主图',asset_id:input.resources.heroImage,status:input.resources.heroImage?'bound':'placeholder',placeholder_label:'待补充：企业授权主图',allow_external_fetch:false,allow_image_generation:false}]:[]),...Object.keys(draft.elementImages||{}).map(key=>({slot_id:key,asset_id:`inline:${key}`,status:'bound'}))],missing_policy:'keep_slot_and_mark_missing'},
    FORM_JSON:{form_id:'lead_form',mode:input.conversion.mode,purpose:draft.goal,submit_label:draft.goal,fields:input.conversion.fields.map(label=>({id:({'姓名':'name','邮箱':'email','电话':'phone','公司':'company','职位':'position','国家/地区':'country','采购量':'quantity','需求说明':'requirements','预约日期':'appointment_date'} as Record<string,string>)[label],label,type:label==='邮箱'?'email':label==='预约日期'?'date':label==='需求说明'?'textarea':'text',required:true})),submission:{status:'not_connected',handler_ref:null},allow_extra_fields:false},
    PRODUCTS_JSON:{selection_mode:input.resources.products.length?'selected':'none',items:input.resources.products.map(p=>({product_id:p.id,name:p.name,model:null,attributes:[],selling_points:[],image_asset_ids:[],evidence_refs:[]})),empty_policy:'keep_product_section_with_placeholder',allow_unselected_products:false},
    INTENT_TEXT:draft.intentText||draft.visitorIntent?.need||'',
    INSPECTION_CONTEXT:{page_id:draft.id,base_revision:draft.revision,open_gaps:inspectMarketingPage(draft)},
    KNOWLEDGE_SCOPE_JSON:{site_scope:'current_site',scope_mode:'selected_directories',directory_keys:draft.knowledgeDirs||[],include_descendants:true,authorization_boundary:'current_site_authorized_only',cross_site:false,retrieval_required:true,on_no_result:'mark_missing',on_invalid_scope:'return_error'},
  }
  return {promptSources:OPEN_DESIGN_PROVENANCE,execution,promptVersion:PROMPT_VERSION,templateId:draft.templateId,need:input.requirement,input,blocks,outputSchema:OUTPUT_SCHEMA,systemPrompt:SYSTEM_PROMPT,userPrompt:Object.entries(blocks).map(([key,value])=>key+'\n'+(typeof value==='string'?value:JSON.stringify(value,null,2))).join('\n\n')}

}

export type GenerationRequest = ReturnType<typeof buildGenerationRequest>
