import { useState } from 'react'
import { ChevronDown, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Draft } from './MarketingStudio'
import type { MarketingGap } from './marketingInspection'
import { gapActionLabel } from './MissingContent'
import { completionPolicy } from './completionPolicy'
import { mockProductsData } from './blocks'
export default function RequiredInputs({gaps,remaining,draft,onChange,onOpen,onContinue,onAi,onBatchAi,onBatchUpload,hasPending,compact=false}:{gaps:MarketingGap[];remaining:MarketingGap[];draft:Draft;onChange:(patch:Partial<Draft>,ids:string[])=>void;onOpen:(gap:MarketingGap)=>void;onContinue:()=>void;onAi:(gap:MarketingGap)=>void;hasPending:boolean;compact?:boolean;onBatchAi:(gaps:MarketingGap[])=>void;onBatchUpload:(gaps:MarketingGap[])=>void}) {
 const [selected,setSelected]=useState<string[]>(gaps.map(g=>g.id))
 const chosen=gaps.filter(g=>selected.includes(g.id)&&remaining.some(r=>r.id===g.id))
 const [expanded,setExpanded]=useState<string|null>(null)
 if(!gaps.length&&!hasPending)return null
 return <section className={`completion-panel ${compact?'completion-compact':''}`} aria-label="待完善内容">
  <header><div><strong>{gaps.length} 项待完善</strong><p>先确认资料来源并完成页面编辑，全部待完善项处理后可配置发布。</p></div></header>
  <div className="completion-batch"><label><input type="checkbox" checked={chosen.length>0&&chosen.length===remaining.length} onChange={e=>setSelected(e.target.checked?remaining.map(g=>g.id):[])}/>全选待处理项</label><span>已选 {chosen.length} 项</span><div><Button size="sm" variant="outline" disabled={!chosen.length} onClick={()=>onBatchUpload(chosen)}>批量上传资料</Button><Button size="sm" disabled={!chosen.length} onClick={()=>onBatchAi(chosen)}><Sparkles size={13}/>确认交给 AI</Button></div><small>下一步在左侧补充生成要求并发送。产品与真实业务信息仍需确认依据。</small></div>
  <div className="completion-items">{gaps.map(gap=>{
   const done=!remaining.some(item=>item.id===gap.id),id=gap.targetComponentIds[0],policy=completionPolicy(gap)
   const componentInput=gap.id.startsWith('content-')||['testimonials-evidence','stats-evidence'].includes(gap.id)
   const inline=componentInput||['product-specification','contact-information'].includes(gap.id)
   const specProducts=mockProductsData.filter(p=>gap.productIds?.includes(p.id))
   return <div className="completion-item" key={gap.id}>
    <div className="completion-item-heading"><label><input type="checkbox" aria-label={`选择${gap.label}`} disabled={done} checked={!done&&selected.includes(gap.id)} onChange={e=>setSelected(ids=>e.target.checked?[...ids,gap.id]:ids.filter(id=>id!==gap.id))}/><strong>{gap.label}</strong></label><small>{gap.level==='generate'?'阻断区域生成 · ':'阻断发布 · '}{done?'已补充 · 待应用':draft.aiJobs?.[gap.id]?'已请求 · 待生成':policy.mode==='none'?'需你提供':policy.needsConfirmation?'需确认资料':'可由 AI 完善'}</small></div>
    <div className="completion-actions">{policy.mode!=='none'&&<Button size="sm" variant="outline" onClick={()=>onAi(gap)}><Sparkles size={13}/>{policy.label}</Button>}<Button size="sm" variant="ghost" aria-expanded={inline?expanded===gap.id:undefined} onClick={()=>inline?setExpanded(expanded===gap.id?null:gap.id):onOpen(gap)}>{inline?'自己填写':gapActionLabel(gap)}{inline&&<ChevronDown size={12}/>}</Button></div>
    {expanded===gap.id&&inline&&<div className="completion-manual"><p>{gap.reason}</p>{gap.id==='product-specification'
     // Specs are filled per product; products that already have library specs are not listed.
     ?specProducts.map(p=><div key={p.id}><label htmlFor={`complete-spec-${p.id}`}>{p.name} · 规格或型号</label><textarea id={`complete-spec-${p.id}`} rows={2} value={draft.productSpecs?.[p.id]||''} onChange={e=>onChange({productSpecs:{...draft.productSpecs,[p.id]:e.target.value}},gap.targetComponentIds)}/></div>)
     :<><label htmlFor={`complete-${gap.id}`}>{gap.label}</label><textarea id={`complete-${gap.id}`} rows={3} value={componentInput?draft.componentInputs?.[id]||'':draft.optionalFields['联系方式']||''} onChange={e=>onChange(componentInput?{componentInputs:{...draft.componentInputs,[id]:e.target.value}}:{optionalFields:{...draft.optionalFields,'联系方式':e.target.value}},gap.targetComponentIds)}/></>}</div>}
   </div>
  })}</div>
  {hasPending&&<footer><Button size="sm" onClick={onContinue}>应用已补充内容</Button><small>可分批处理；其余待完善项会继续限制发布</small></footer>}
 </section>
}
