import {completionPolicy} from './completionPolicy'
import { ImageIcon, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { MarketingGap } from './marketingInspection'
export const gapActionLabel=(gap:MarketingGap)=>gap.id==='product-binding'||gap.id==='comparison-products'?'选择关联产品':gap.id==='hero-image'||gap.id.startsWith('gallery-')?'选择图片':gap.id==='video-binding'?'补充视频':gap.id==='form-binding'?'完善表单':'补充内容依据'
export function MissingContent({gaps,pendingIds=[],onSupplement,onAi,canvas=false}:{gaps:MarketingGap[];pendingIds?:string[];onSupplement?:(gap:MarketingGap)=>void;onAi?:(gap:MarketingGap)=>void;canvas?:boolean}) {
 if(!gaps.length)return null
 return <div className={canvas?'canvas-content-gaps':'conversation-content-gaps'} aria-label={canvas?'此区域待补充内容':'页面待补充内容'}>
  {!canvas&&<header><strong>待补充 {gaps.length} 项</strong><p>已保留页面结构，补充后继续生成对应内容。</p></header>}
  {gaps.map(gap=><div className="content-gap" key={gap.id} data-gap-id={gap.id}>
   {canvas&&<ImageIcon size={24}/>}
   <div><strong>{gap.label}{pendingIds.includes(gap.id)?' · 已提交待验证':' · 待补充'}</strong><p>{gap.reason}</p><small>{canvas?(completionPolicy(gap).mode==='none'?'请提供该素材，可继续编辑其他区域。':'可自行补充或让 AI 完善，继续编辑其他区域。'):`影响：${gap.targetLabels?.join('、')||'当前页面'}`}</small></div>
   <div className="placeholder-actions">{onAi&&completionPolicy(gap).mode!=='none'&&<Button size="sm" onClick={event=>{event.stopPropagation();onAi(gap)}}><Sparkles size={13}/>{completionPolicy(gap).label}</Button>}{onSupplement&&<Button size="sm" variant="outline" onClick={event=>{event.stopPropagation();onSupplement(gap)}}>{pendingIds.includes(gap.id)?'调整补充':gapActionLabel(gap)}<ArrowRight size={13}/></Button>}</div>
  </div>)}
 </div>
}
