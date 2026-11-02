import {ChevronDown,ChevronRight,ClipboardList,FileText,FolderOpen,ImageIcon,Package,Palette,Shapes} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {StudioSelect} from '@/components/ui/select'
import BrandColorPicker from './BrandColorPicker'
import BusinessFields from './BusinessFields'
import {GOALS,KNOWLEDGE_DIRS,mockProductsData,OPTIONAL_FIELDS} from './blocks'
import {getFormFields} from './formFields'
import type {Draft} from './MarketingStudio'

export default function CreationParameters({draft,pageType,onChange,onForm,onProducts,onKnowledge,onUpload,onImages,onSettings}:{
  draft:Draft;pageType:string;onChange:(patch:Partial<Draft>)=>void;onForm:()=>void;onProducts:()=>void;onKnowledge:()=>void;onUpload:()=>void;onImages:()=>void;onSettings:()=>void
}) {
  const fields=getFormFields(draft)
  const products=mockProductsData.filter(p=>draft.productIds.includes(p.id))
  const documents=(draft.assets||[]).filter(a=>a.type==='document')
  const images=(draft.assets||[]).filter(a=>a.type==='image')
  const businessNames=[...OPTIONAL_FIELDS['公共'],...(OPTIONAL_FIELDS[pageType]||[])]
  const filled=businessNames.filter(name=>draft.optionalFields[name]?.trim()).length
  const directories=draft.knowledgeDirs||[]
  const resourceRow=(Icon:typeof Package,title:string,value:string,description:string,onClick:()=>void)=><button type="button" className="creation-resource" onClick={onClick}>
    <span className="creation-resource-icon"><Icon size={17}/></span>
    <span className="creation-resource-copy"><span><strong>{title}</strong><small>{value}</small></span><span>{description}</span></span>
    <ChevronRight size={15}/>
  </button>
  return <div className="creation-parameters">
    <section className="creation-targets" aria-label="页面目标">
      <label>转化目标<StudioSelect label="创建页转化目标" value={draft.goal} options={GOALS} onChange={goal=>onChange({goal})}/></label>
      <label><span>目标市场 <b>*</b></span><StudioSelect label="目标市场" value={draft.region||'请选择'} options={['请选择','中国大陆','全球市场','亚太地区','欧洲地区']} onChange={v=>onChange({region:v==='请选择'?'':v})}/></label>
      <label><span>页面语言 <b>*</b></span><StudioSelect label="语言" value={draft.language||'请选择'} options={['请选择','中文简体','English','中文繁體']} onChange={v=>onChange({language:v==='请选择'?'':v})}/></label>
    </section>
    <div className="creation-parameter-columns">
      <section className="creation-parameter-card" aria-labelledby="creation-elements-title">
        <header><span className="creation-section-icon"><Shapes size={17}/></span><div><h2 id="creation-elements-title">页面元素</h2><p>决定页面展示什么，以及收集哪些信息</p></div></header>
        {resourceRow(Package,'产品选择',products.length?`${products.length} 个产品`:'未选择',products.map(p=>p.name).join('、')||'选择需要展示或介绍的产品',onProducts)}
        {resourceRow(ClipboardList,'留资表单',`${fields.length} 个字段${draft.formConfigured?'':' · Agent 推荐'}`,fields.join('、')||'设置客户需要填写的信息',onForm)}
      </section>
      <section className="creation-parameter-card" aria-labelledby="creation-background-title">
        <header><span className="creation-section-icon"><FolderOpen size={17}/></span><div><h2 id="creation-background-title">背景内容</h2><p>提供生成依据与视觉素材，按需要引用到页面</p></div></header>
        {resourceRow(FolderOpen,'知识选择',!directories.length||directories.length===KNOWLEDGE_DIRS.length?'全部目录':`${directories.length} 个目录`,'限定可检索的知识范围，不会直接生成知识列表',onKnowledge)}
        {resourceRow(FileText,'上传资料',documents.length?`${documents.length} 份资料`:'未上传',documents.map(a=>a.name).join('、')||'产品手册、企业介绍等，作为文案依据',onUpload)}
        {resourceRow(ImageIcon,'图片素材',images.length?`${images.length} 张图片`:draft.image||draft.imageAssetId?'已选主图':'未选择','提供主图或内容配图，缺少时保留占位',onImages)}
      </section>
    </div>
    <details className="creation-parameter-card creation-disclosure">
      <summary><span className="creation-section-icon"><ClipboardList size={17}/></span><span><strong>业务信息</strong><span>卖点、人群与{pageType?`${pageType}专属信息`:'页面类型相关信息'}，用于组织页面文案</span></span><small>{filled?`已填 ${filled}/${businessNames.length} 项`:'选填'}</small><ChevronDown size={16}/></summary>
      <BusinessFields draft={draft} pageType={pageType} onChange={onChange}/>
    </details>
    <details className="creation-parameter-card creation-disclosure">
      <summary><span className="creation-section-icon"><Palette size={17}/></span><span><strong>品牌样式</strong><span>控制页面外观，默认沿用官网主色</span></span><small><i style={{background:draft.color}}/>{draft.fontStyle||'未设置字体'}</small><ChevronDown size={16}/></summary>
      <div className="creation-brand-fields"><div><span>主色调 <b>*</b></span><BrandColorPicker value={draft.color} onChange={color=>onChange({color})}/></div><label><span>字体风格 <b>*</b></span><StudioSelect label="字体风格" value={draft.fontStyle||'请选择'} options={['请选择','现代无衬线','经典衬线','技术等宽']} onChange={v=>onChange({fontStyle:v==='请选择'?'':v})}/></label><div className="creation-brand-company"><span>企业身份与 Logo</span><Button variant="outline" size="sm" onClick={onSettings}>查看企业信息{draft.logo?' · 已有 Logo':''}</Button></div></div>
    </details>
  </div>
}
