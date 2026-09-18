import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FIELD_SETS, mockProductsData } from './blocks'
import type { Draft } from './MarketingStudio'
export default function ComposerContext({draft,onOpen}:{draft:Draft;onOpen:(target:'knowledge'|'products'|'formFields'|'settings'|'documents'|'images')=>void}) {
 const fields=draft.formConfigured?draft.formFields:FIELD_SETS[draft.goal==='活动报名'?'活动报名':draft.goal==='领取资料'?'资料领取':draft.goal==='获取报价'?'采购询价':'基础联系'];
 const products=mockProductsData.filter(p=>draft.productIds.includes(p.id));
 const documents=(draft.assets||[]).filter(a=>a.type==='document');const images=(draft.assets||[]).filter(a=>a.type==='image');
 const items:{target:Parameters<typeof onOpen>[0];label:string;detail:string}[]=[
 {target:'knowledge',label:!draft.knowledgeDirs?.length||draft.knowledgeDirs.length===6?'知识：全部目录':`知识：${draft.knowledgeDirs.length} 个目录`,detail:draft.knowledgeDirs?.join('、')||'未限定范围，检索全部目录'},
 {target:'formFields',label:`表单：${fields.length} 项${draft.formConfigured?'':' · 推荐'}`,detail:fields.join('、')||'未选择收集字段'},
 {target:'settings',label:`${draft.goal} · ${draft.language}`,detail:`${draft.region} · ${draft.fontStyle} · 主色调 ${draft.color}`},
 ...products.map(p=>({target:'products' as const,label:p.name,detail:`关联产品：${p.name}`})),
 ...(documents.length?[{target:'documents' as const,label:`资料：${documents.length} 个文档`,detail:documents.map(a=>a.name).join('、')}]:[]),
 ...(images.length?[{target:'images' as const,label:`图片：${images.length} 张`,detail:images.map(a=>a.name).join('、')}]:[]),
 ...(draft.visitorIntent?[{target:'settings' as const,label:'已同步访客意图',detail:draft.visitorIntent.root}]:[])
 ];
 return <section className="composer-context" aria-label="当前生效配置" aria-live="polite"><span className="composer-context-label">当前生效</span><div>{items.map(item=><Button key={`${item.target}-${item.label}`} size="sm" variant="ghost" title={item.detail} onClick={()=>onOpen(item.target)}><Check size={11}/><span>{item.label}</span></Button>)}</div></section>
}
