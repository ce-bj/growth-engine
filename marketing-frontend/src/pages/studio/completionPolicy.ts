import {inspectMarketingPage} from './marketingInspection'
import type { MarketingGap } from './marketingInspection'
export function completionPolicy(gap:MarketingGap) {
 const image=gap.id==='hero-image'||gap.id.startsWith('gallery-')
 const product=gap.id==='product-binding'||gap.id==='comparison-products'
 const fact=['product-specification','contact-information','comparison-evidence','stats-evidence'].includes(gap.id)||(/案例|认证|评价|业绩/.test(gap.label))
 return {mode:image?'generate_image':product?'recommend_product':fact?'retrieve_fact':'draft_content',label:image?'AI 生成图片':product?'AI 推荐产品':fact?'AI 查找资料':'AI 完善',needsConfirmation:product||fact,
 instruction:image?'根据页面目标和品牌样式生成配图，作为 AI 示意图标识。不得伪造产品实拍、认证标志或客户案例图片。':product?'仅从当前站点已授权产品目录推荐相关产品，先展示候选与理由，请用户确认后绑定。不得编造产品 ID。':fact?'从当前授权知识、产品与上传资料查找对应信息，保留出处。无可靠结果时请用户确认，不得编造参数、联系方式或业绩。':'依据当前页面目标、品牌样式、已选产品和授权资料，为指定模块完善内容，缺少事实依据时保留待确认项，不新增未经证实的承诺。'}
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
