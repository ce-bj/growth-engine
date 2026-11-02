import {Input} from '@/components/ui/input'
import {OPTIONAL_FIELDS} from './blocks'
import type {Draft} from './MarketingStudio'

const hints:Record<string,string>={
  '核心卖点':'希望突出哪些产品能力或服务价值',
  '目标买家画像':'例如：工程采购负责人、经销商',
  '联系方式':'客户可通过什么方式联系企业',
  '竞品名称或网址':'选填，用于理解定位与差异',
}

export default function BusinessFields({draft,pageType,onChange}:{draft:Draft;pageType:string;onChange:(patch:Partial<Draft>)=>void}) {
  const fields=(names:string[])=><div className="creation-business-fields">{names.map(name=><label key={name}>{name}<Input value={draft.optionalFields[name]||''} placeholder={hints[name]||`填写${name}（选填）`} onChange={e=>onChange({optionalFields:{...draft.optionalFields,[name]:e.target.value}})}/></label>)}</div>
  return <div className="creation-business-content">
    <div><h4>通用业务信息</h4>{fields(OPTIONAL_FIELDS['公共'])}</div>
    {pageType&&<div><h4>{pageType} · 专属信息</h4>{fields(OPTIONAL_FIELDS[pageType]||[])}</div>}
    {!pageType&&<p className="creation-field-note">选择模板后，这里会增加对应页面类型的业务字段。</p>}
    <p className="creation-field-note">业务信息用于组织页面文案；参数、认证和案例仍需资料依据。</p>
  </div>
}
