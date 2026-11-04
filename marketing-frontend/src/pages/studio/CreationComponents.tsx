import { ArrowUp, Check, Plus, X } from 'lucide-react'
import { BLOCKS, blockTip, inferKind, type BlockKind } from './blocks'
import { createComponent } from './componentDefaults'
import type { Section } from './MarketingStudio'

// Component arrangement shown right before “生成落地页” (产品设计 5.2.1): template components start active,
// added components are active immediately, and only active components take part in generation.
export default function CreationComponents({sections,templateName,custom,onChange,onStartCustom}:{sections:Section[];templateName?:string;custom:boolean;onChange:(sections:Section[])=>void;onStartCustom:(sections:Section[])=>void}) {
 const active=sections.filter(s=>!s.hidden).length
 const label=(s:Section)=>BLOCKS.find(b=>b.kind===(s.kind||inferKind(s.title)))?.label||'图文介绍'
 const add=(kind:BlockKind)=>{
  const block=BLOCKS.find(b=>b.kind===kind)!
  const next=[...sections,createComponent(kind,crypto.randomUUID(),block.label)]
  // Adding a component without a template starts the custom-component mode.
  if(!templateName&&!custom)onStartCustom(next);else onChange(next)
 }
 const move=(index:number)=>{const rows=[...sections];[rows[index-1],rows[index]]=[rows[index],rows[index-1]];onChange(rows)}
 const hint=custom?'自定义组件：按需添加，点亮的组件按顺序参与生成':templateName?`来自「${templateName}」的初始组件，可继续添加；点亮的组件参与生成`:'选择模板后显示其初始组件；也可以直接添加组件，以自定义组件开始'
 return <section className="creation-components" aria-labelledby="creation-components-title">
  <header><div><h2 id="creation-components-title">页面组件</h2><p>{hint}</p></div><span className="creation-components-count">{active} 个已激活</span></header>
  {sections.length>0&&<ol className="creation-component-list">{sections.map((s,i)=><li key={s.id} className={s.hidden?'':'is-active'}>
   <button type="button" className="creation-component-toggle" aria-pressed={!s.hidden} title={s.hidden?'点击激活':'点击停用'} onClick={()=>onChange(sections.map(x=>x.id===s.id?{...x,hidden:!x.hidden}:x))}>
    <span className="creation-component-index">{s.hidden?i+1:<Check size={12}/>}</span><span><strong>{s.title}</strong><small>{label(s)}{s.hidden?' · 未激活':''}</small></span>
   </button>
   <div className="creation-component-actions">{i>0&&<button type="button" aria-label={`上移${s.title}`} onClick={()=>move(i)}><ArrowUp size={13}/></button>}<button type="button" aria-label={`移除${s.title}`} onClick={()=>onChange(sections.filter(x=>x.id!==s.id))}><X size={13}/></button></div>
  </li>)}</ol>}
  <div className="creation-component-palette"><span>添加组件</span>{BLOCKS.map(b=><button type="button" key={b.kind} className="has-tip" data-tip={blockTip(b)} aria-description={blockTip(b)} onClick={()=>add(b.kind)}><Plus size={12}/>{b.label}</button>)}</div>
 </section>
}
