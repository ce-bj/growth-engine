import CreationParameters from './CreationParameters'
import CreationComponents from './CreationComponents'
import { ArrowUp, Check, Layers3, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StudioSelect } from '@/components/ui/select'
import { TemplateCover } from './StudioCanvas'
import type { Draft, Template } from './MarketingStudio'
const TYPES=['全部模板','产品营销','线索获取','品牌介绍','促销活动','展会页面']
export default function StudioStart({draft,templates,filter,onFilter,onChange,onPick,onGenerate,onSettings,onKnowledge,onProducts,onCustom,onForm,onUpload,onImages,onIntent}:{draft:Draft;templates:Template[];filter:string;onFilter:(v:string)=>void;onChange:(d:Partial<Draft>)=>void;onPick:(t:Template)=>void;onGenerate:()=>void;onSettings:()=>void;onKnowledge:()=>void;onProducts:()=>void;onCustom:(sections?:Draft['sections'])=>void;onForm:()=>void;onUpload:()=>void;onImages:()=>void;onIntent:()=>void}) {
 const selectedTemplate=templates.find(t=>t.id===draft.templateId)
 const pageType=draft.templateId==='custom'?(draft.optionalFields['_pageType']||'产品营销'):selectedTemplate?.type||''
 return <section className="conversation-start creation-page">
  <div className="start-intro creation-intro"><div><h1>创建营销落地页</h1><p>{draft.company} · 企业信息已带入</p></div><Button variant="outline" size="sm" onClick={onIntent}><Plus size={15}/>意图说明</Button></div>
  <section className="start-composer creation-goal" aria-labelledby="creation-goal-title">
    <header><div><h2 id="creation-goal-title">页面目标</h2><p>说明面向谁、介绍什么，以及希望客户采取的行动</p></div><Button size="sm" variant="ghost" onClick={()=>onChange({need:`为${draft.company}创建营销页面，面向工程采购负责人，介绍主营产品的适用场景和专业服务，引导客户${draft.goal}。`})}>填入示例</Button></header>
    <textarea aria-label="页面需求" value={draft.need} onChange={e=>onChange({need:e.target.value})} placeholder="例如：面向工程采购负责人，介绍闸门的适用场景与选型服务，引导客户获取报价。"/>
  </section>
  <CreationParameters draft={draft} pageType={pageType} onChange={onChange} onForm={onForm} onProducts={onProducts} onKnowledge={onKnowledge} onUpload={onUpload} onImages={onImages} onSettings={onSettings}/>
<div className="start-template-heading"><div><h2>页面构建方式</h2><p>{draft.templateId==='custom'?'自定义组件：首屏与页脚可在编辑区管理':draft.templateId?`已选择 ${templates.find(t=>t.id===draft.templateId)?.name}`:'下方选择模板，或切换为自定义组件'}</p></div><div className="row"><Button variant={draft.templateId!=='custom'?'default':'outline'} onClick={()=>onChange({templateId:'',sections:[]})}>使用模板</Button><Button variant={draft.templateId==='custom'?'default':'outline'} onClick={()=>onCustom()}><Layers3 size={16}/>自定义组件</Button></div></div>{draft.templateId==='custom'&&<div className="custom-starter"><label>页面类型<StudioSelect label="自定义页面类型" value={draft.optionalFields['_pageType']||'产品营销'} options={TYPES.slice(1)} onChange={v=>onChange({optionalFields:{...draft.optionalFields,_pageType:v}})}/></label><p>在下方“页面组件”中添加需要的组件，激活的组件会按顺序参与生成。</p></div>}{draft.templateId!=='custom'&&<><div className="template-library-label"><strong>模板库</strong><span>模板提供整页结构与推荐配置；组件是可单独增删的内容模块</span></div><div className="template-filters">{TYPES.map(t=><Button key={t} size="sm" variant="ghost" className={filter===t?'filter-active':''} onClick={()=>onFilter(t)}>{t}</Button>)}</div><div className="template-grid">{templates.filter(t=>filter==='全部模板'||t.type===filter).map(t=><button className={`template-card ${draft.templateId===t.id?'template-selected':''}`} key={t.id} onClick={()=>onPick(t)}><div className="template-art"><TemplateCover template={t} draft={draft}/><span className="template-use">{draft.templateId===t.id?'已选择':'使用模板'} {draft.templateId===t.id?<Check size={15}/>:<Plus size={15}/>}</span></div><div className="template-caption"><div><h2>{t.name}</h2><p>{t.description}</p><small>{t.source}</small></div><span>{t.type}</span></div></button>)}</div></>}
  <CreationComponents sections={draft.sections} templateName={selectedTemplate?.name} custom={draft.templateId==='custom'} onChange={sections=>onChange({sections})} onStartCustom={sections=>onCustom(sections)}/>
  <div className="creation-generate-bar"><div><strong>{draft.templateId==='custom'?'自定义组件':selectedTemplate?`已选模板：${selectedTemplate.name}`:'请选择模板或添加组件'}{draft.templateId?` · ${draft.sections.filter(s=>!s.hidden).length} 个组件已激活`:''}</strong><span>页面元素决定展示与留资，背景资料和业务信息用于生成内容。</span></div><Button className="start-submit" aria-label="直接生成首版" onClick={onGenerate}><ArrowUp size={18}/>生成落地页</Button></div>
 </section>
}
