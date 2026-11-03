import { readyData } from '../../../../one-AI-Workbench/src/readyData.js'
import type { Draft } from './MarketingStudio'

// Reuse AI Readiness's capability catalogue; page scope and user adoption belong to this editor.
const capability = readyData.optimizeSections.find(section => section.code === 'brand')!
export const BRAND_CAPABILITY = {providerModule:'ai-readiness', code:capability.code, title:capability.title}
export interface BrandFinding {
 id:string; checkId:string; title:string; status:'consistent'|'inconsistent'|'review'|'needs_input'
 baseline:string; evidence:{location:string;value:string}[]; explanation:string; solution:string
 appliedAt?:string; replacements:Record<string,string>
}
export interface WebsiteAudit {
 reportId:string; pageId:string; contentRevision:number; snapshotKey:string; checkedAt:string
 providerModule:'ai-readiness'; capability:'brand_consistency'; featureTitle:string
 scope:'current_marketing_page'; executionStatus:'not_applied'|'partially_applied'|'applied'; findings:BrandFinding[]
}
export function brandSnapshotKey(d:Draft) {
 return JSON.stringify([d.id,d.company,d.siteContact,d.siteSellingPoints,d.title,d.subtitle,d.sections,d.elementTexts,d.optionalFields,d.heroVisible,d.footerVisible,d.layout,d.color,d.fontStyle,d.productIds,d.formFields,d.formSet,d.formGuidance,d.image,d.elementImages,d.goal,d.secondary,d.language,d.region,d.logo,d.videoUrl,d.knowledgeDirs,d.assets])
}
export function inspectBrandConsistency(d:Draft):WebsiteAudit {
 // Brand name is compared literally; selling points are compared by meaning (mock: the confirmed
 // phrases must appear), and the fix adds the missing point instead of replacing the whole copy.
 const semantic=(checkId:string)=>checkId==='brand-selling'
 const phrases=(text:string)=>text.split(/[、，,；;。\s]+/).filter(item=>item.length>=2)
 const finding=(checkId:string,baseline:string,values:{location:string;key:string;value:string}[]):BrandFinding=>{
  const mismatches=values.filter(v=>semantic(checkId)?!phrases(baseline).some(item=>v.value.includes(item)):v.value.trim()!==baseline.trim())
  const status=!baseline.trim()?'needs_input':!mismatches.length?'consistent':checkId==='brand-name'?'inconsistent':'review'
  const replacements=baseline?Object.fromEntries(mismatches.map(v=>[v.key,semantic(checkId)?`${v.value.trim().replace(/[。.]$/,'')}，${baseline.trim()}。`:baseline])):{}
  return {id:checkId,checkId,title:capability.items.find(item=>item.id===checkId)!.title,status,baseline,
   evidence:values.map(({location,value})=>({location,value})),
   explanation:status==='needs_input'?'当前站点尚无已确认基准，请补充后重新检测。':status==='consistent'?'当前页面表述与已确认的站点基准一致。':checkId==='brand-name'?'页面使用的品牌名称与当前站点名称不同。':'页面文案与站点基准不同，请确认是否需要统一表述。',
   solution:!Object.keys(replacements).length?'':semantic(checkId)?`在当前营销页的${mismatches.map(v=>v.location).join('、')}中补充站点已确认的核心卖点「${baseline}」，保留原有文案。`:`仅将当前营销页的${mismatches.map(v=>v.location).join('、')}统一为「${baseline}」，保留其他内容。`,replacements}
 }
 const texts=d.elementTexts||{}
 const brandValues=[{location:'页首品牌名称',key:'header:brand',value:texts['header:brand']??d.company},...(d.footerVisible?[{location:'页脚品牌名称',key:'footer:brand',value:texts['footer:brand']??d.company}]:[])]
 return {reportId:`brand-${d.id}-${Date.now()}`,pageId:d.id,contentRevision:d.revision,snapshotKey:brandSnapshotKey(d),checkedAt:new Date().toISOString(),providerModule:'ai-readiness',capability:'brand_consistency',featureTitle:capability.title,scope:'current_marketing_page',executionStatus:'not_applied',findings:[
  finding('brand-name',d.company,brandValues),
  // Baselines come from the confirmed site profile, never from this page's own business fields.
  finding('brand-selling',d.siteSellingPoints||'',d.heroVisible?[{location:'首屏卖点说明',key:'hero:body',value:texts['hero:body']??d.subtitle}]:[]),
  finding('brand-contact',d.siteContact||'',d.footerVisible?[{location:'页脚联系方式',key:'footer:contact',value:texts['footer:contact']??(d.optionalFields['联系方式']?.trim()||d.siteContact||'')}]:[]),
 ]}
}
export function brandSolution(report:WebsiteAudit,finding:BrandFinding) {
 if(!finding.solution)return ''
 return `来源：AI 友好度 / ${report.featureTitle}\n报告：${report.reportId}\n页面：${report.pageId} · 修订 ${report.contentRevision}\n问题：${finding.title}\n解决方案：${finding.solution}\n仅修改当前营销页，不修改全站，不发布。`
}
export function applyBrandSolution(d:Draft,report:WebsiteAudit|undefined,text:string):Partial<Draft>|null {
 if(!report||report.pageId!==d.id||report.contentRevision!==d.revision||report.snapshotKey!==brandSnapshotKey(d))return null
 const finding=report.findings.find(f=>f.solution&&brandSolution(report,f)===text)
 if(!finding)return null
 return {elementTexts:{...d.elementTexts,...finding.replacements}}
}

/** Apply one user-approved proposal against the report's exact page snapshot. */
export function optimizeBrandFinding(d:Draft,report:WebsiteAudit|undefined,findingId:string):Draft|null {
 if(!report||d.websiteAudit?.reportId!==report.reportId||report.pageId!==d.id||report.contentRevision!==d.revision||report.snapshotKey!==brandSnapshotKey(d))return null
 const f=report.findings.find(item=>item.id===findingId)
 if(!f||f.appliedAt||!['inconsistent','review'].includes(f.status)||!f.baseline.trim()||!Object.keys(f.replacements).length)return null
 const allowed:Record<string,string[]>={'brand-name':['header:brand','footer:brand'],'brand-selling':['hero:body'],'brand-contact':['footer:contact']}
 if(Object.entries(f.replacements).some(([key,value])=>!allowed[f.checkId]?.includes(key)||(f.checkId==='brand-selling'?!value.includes(f.baseline):value!==f.baseline)))return null
 const now=new Date().toISOString()
 const next={...d,elementTexts:{...d.elementTexts,...f.replacements},revision:d.revision+1,updatedAt:now,linkReady:false}
 const findings=report.findings.map(item=>item.id===f.id?{...item,status:'consistent' as const,appliedAt:now}:item)
 next.websiteAudit={...report,contentRevision:next.revision,snapshotKey:brandSnapshotKey(next),findings,executionStatus:findings.some(item=>item.status!=='consistent')?'partially_applied':'applied'}
 return next
}
