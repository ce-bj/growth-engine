import { Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { mockProductsData } from './blocks'
import { getFormFields } from './formFields'
import type { Draft } from './MarketingStudio'
export default function ComposerContext({draft,onOpen}:{draft:Draft;onOpen:(target:'knowledge'|'products'|'formFields'|'settings'|'documents'|'images')=>void}) {
 const fields=getFormFields(draft);
 const products=mockProductsData.filter(p=>draft.productIds.includes(p.id));
 const documents=(draft.assets||[]).filter(a=>a.type==='document');const images=(draft.assets||[]).filter(a=>a.type==='image');
 const items:{target:Parameters<typeof onOpen>[0];label:string;detail:string}[]=[
 {target:'knowledge',label:!draft.knowledgeDirs?.length||draft.knowledgeDirs.length===6?'知识：全部目录':`知识：${draft.knowledgeDirs.length} 个目录`,detail:draft.knowledgeDirs?.join('、')||'未限定范围，检索全部目录'},
 {target:'formFields',label:`表单：${fields.length} 项${draft.formConfigured?'':' · 推荐'}`,detail:fields.join('、')||'未选择收集字段'},
 {target:'products',label:products.length?`产品：${products.length} 个`:'产品：未选择',detail:products.map(p=>p.name).join('、')||'点击选择关联产品'},
 ...(documents.length?[{target:'documents' as const,label:`资料：${documents.length} 个文档`,detail:documents.map(a=>a.name).join('、')}]:[]),
 ...(images.length?[{target:'images' as const,label:`图片：${images.length} 张`,detail:images.map(a=>a.name).join('、')}]:[])
 ];
 return <section className="composer-context" aria-label="当前生效配置" aria-live="polite"><span className="composer-context-label">当前生效</span><div>{items.map(item=><Button key={`${item.target}-${item.label}`} size="sm" variant="ghost" title={item.detail} className={item.target==='products'&&!products.length?'context-incomplete':undefined} onClick={()=>onOpen(item.target)}>{item.target==='products'&&!products.length?<AlertCircle size={11}/>:<Check size={11}/>}<span>{item.label}</span></Button>)}</div></section>
}
