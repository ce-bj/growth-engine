import {inspectMarketingPage} from './marketingInspection'
import type { MarketingGap } from './marketingInspection'
// AI completion options per gap; the button label and the instruction prefilled into the conversation are
// documented in 产品设计 5.4.3. mode 'none' means AI cannot provide it, so no AI button is shown.
export type CompletionMode='generate_image'|'recommend_product'|'retrieve_fact'|'recommend_fields'|'draft_content'|'none'
const POLICIES:Record<Exclude<CompletionMode,'none'>,{label:string;instruction:string}>={
 generate_image:{label:'AI 生成图片',instruction:'根据页面目标和品牌样式生成配图，作为 AI 示意图标识。不得伪造产品实拍、认证标志或客户案例图片。'},
 recommend_product:{label:'AI 推荐产品',instruction:'仅从当前站点已授权产品目录推荐相关产品并关联到页面，说明推荐理由。不得编造产品 ID。'},
 retrieve_fact:{label:'AI 查找资料',instruction:'从当前授权知识、产品与上传资料查找对应信息并填入页面，标注出处。查不到可靠来源时保留待补充，不得编造参数、联系方式或业绩。'},
 recommend_fields:{label:'AI 推荐字段',instruction:'按页面主转化动作推荐平台支持的表单字段（1–6 个），不新增平台未登记的字段类型。'},
 draft_content:{label:'AI 完善',instruction:'依据当前页面目标、品牌样式、已选产品和授权资料，为指定模块完善内容，缺少事实依据时保留待确认项，不新增未经证实的承诺。'},
}
export function completionPolicy(gap:MarketingGap) {
 const mode:CompletionMode=gap.id==='video-binding'?'none'
  :gap.id==='hero-image'||gap.id.startsWith('gallery-')?'generate_image'
  :gap.id==='product-binding'||gap.id==='comparison-products'?'recommend_product'
  :['product-specification','contact-information','comparison-evidence','stats-evidence','testimonials-evidence'].includes(gap.id)||/案例|认证|评价|业绩/.test(gap.label)?'retrieve_fact'
  :gap.id==='form-binding'?'recommend_fields':'draft_content'
 const policy=mode==='none'?{label:'',instruction:''}:POLICIES[mode]
 return {mode,...policy,needsConfirmation:mode==='recommend_product'||mode==='retrieve_fact'}
}
export function publicationBlockers(gaps:MarketingGap[]) {
 return gaps
}

export function publicationReadiness(d:import('./MarketingStudio').Draft,options:{unsentText?:string;busy?:boolean;aiPrepared?:boolean}={}) {
 const gaps=inspectMarketingPage(d)
 const reasons:string[]=[]
 if(gaps.length)reasons.push(`还有 ${gaps.length} 项资料或内容待确认：${gaps.map(g=>g.label).join('、')}`)
 if(d.pendingSupplement)reasons.push('补充资料尚未应用，请验证并继续编辑页面')
 if(options.unsentText?.trim()||options.aiPrepared)reasons.push('对话框中有待发送的编辑要求，请发送或取消')
 if(Object.keys(d.aiJobs||{}).some(id=>gaps.some(g=>g.id===id)))reasons.push('AI 完善任务尚未返回并采用，请等待结果或自行补充')
 if(options.busy)reasons.push('当前编辑或检测任务尚未完成')
 return reasons
}
