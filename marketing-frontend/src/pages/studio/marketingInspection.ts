import type { Draft } from './MarketingStudio'
import { inferKind, mockProductsData } from './blocks'
import { getFormFields } from './formFields'
export interface MarketingGap {id:string;label:string;source:string;reason:string;targetComponentIds:string[];targetLabels?:string[]}
export function requiresProducts(d:Pick<Draft,'need'|'intentText'>) {
 const text=[d.need,d.intentText||''].join('\n').replace(/(?:不需要|无需|不必)[^。；\n]*/g,'')
 return /(?:必须|需要|要求|请)(?:展示|关联|选择|提供|给出|包含)?(?:关联)?产品/.test(text)
}
export function inspectMarketingPage(d:Draft):MarketingGap[] {
 const gaps:MarketingGap[]=[]
 const kinds=d.sections.filter(s=>!s.hidden).map(s=>({...s,kind:s.kind||inferKind(s.title)}))
 const add=(id:string,label:string,source:string,reason:string,targetComponentIds:string[])=>gaps.push({id,label,source,reason,targetComponentIds,targetLabels:targetComponentIds.map(id=>id==='hero'?'首屏':d.sections.find(s=>s.id===id)?.title||'页面表单')})
 if(d.heroVisible!==false&&!d.image&&!d.imageAssetId&&d.layout!=='form-side')add('hero-image','页面主图','首屏图片位','首屏缺少产品或场景图片，请选择素材。',['hero'])
 const textKinds=['text','features','testimonials','timeline','faq']
 const emptyContent=kinds.filter(s=>textKinds.includes(s.kind)&&(!s.body.trim()||/^(?:\[?待补充|请补充)/.test(s.body)))
 for(const section of emptyContent)add(`content-${section.id}`,section.title,'页面内容要求',`「${section.title}」尚未填写，请补充该区域的具体内容。`,[section.id])
 const emptyProducts=kinds.filter(s=>s.kind==='products'&&(!s.body.trim()||/^(?:\[?待补充|请补充)/.test(s.body)))
 for(const section of emptyProducts)add(`content-${section.id}`,`${section.title}介绍`,'产品内容要求',`请填写「${section.title}」的产品特点、适用场景或能力说明，不能只选择产品后留空。`,[section.id])
 const productSections=kinds.filter(s=>s.kind==='products'||s.kind==='comparison')
 if(productSections.length&&!d.optionalFields['产品规格/型号']?.trim())add('product-specification','产品规格与型号','产品内容要求','请填写所选产品的真实规格或型号，产品区域不能保留待补充参数。',productSections.map(s=>s.id))
 if(d.footerVisible&&!d.optionalFields['联系方式']?.trim())add('contact-information','联系方式','联系与询价','请填写客户能够联系到你的真实联系方式。',['contact-form'])
 const explicit=requiresProducts(d)
 const validProducts=mockProductsData.filter(p=>d.productIds.includes(p.id))
 if((productSections.length||explicit)&&!validProducts.length)add('product-binding','关联产品',explicit?'用户明确要求':`组件「${productSections[0].title}」`,'页面需要展示产品，但尚未关联有效产品。选择后继续生成产品区域。',productSections.map(s=>s.id))
 if(kinds.some(s=>s.kind==='comparison')&&validProducts.length>0&&validProducts.length<2)add('comparison-products','对比产品','参数对比组件','对比至少需要两个有效产品，请补充选择。',kinds.filter(s=>s.kind==='comparison').map(s=>s.id))
 if(kinds.some(s=>s.kind==='comparison')&&validProducts.length>=2&&!d.optionalFields['产品规格/型号']?.trim())add('comparison-evidence','对比参数','参数对比组件','产品已关联，仍需补充可比较的规格与参数依据。',kinds.filter(s=>s.kind==='comparison').map(s=>s.id))
 for(const s of kinds.filter(s=>s.kind==='gallery'))if(!Object.keys(d.elementImages||{}).some(key=>key.startsWith(s.id+':image')))add(`gallery-${s.id}`,'图库图片',`组件「${s.title}」`,'图库尚未绑定图片，请为此区域选择素材。',[s.id])
 const stats=kinds.filter(s=>s.kind==='stats')
 if(stats.length&&!['工厂面积','员工及研发人数','年产能'].some(key=>d.optionalFields[key]?.trim()))add('stats-evidence','实力数据','实力数据组件','没有已确认的数值，请填写真实业务数据。',stats.map(s=>s.id))
 if(kinds.some(s=>s.kind==='video')&&!/^https?:\/\//.test(d.videoUrl||''))add('video-binding','视频素材','视频组件','视频区域缺少播放地址。',kinds.filter(s=>s.kind==='video').map(s=>s.id))
 if(!getFormFields(d).length)add('form-binding','表单字段','主转化动作','至少选择一个有效的表单字段。',['hero',...kinds.filter(s=>s.kind==='form').map(s=>s.id)])
 return gaps
}
