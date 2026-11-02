import sample from './intent-task.example.json'
import { KNOWLEDGE_DIRS, mockProductsData, FORM_FIELDS, OPTIONAL_FIELDS } from './blocks'
import type { Template } from './MarketingStudio'
export type IntentTask=Omit<typeof sample,'generation'> & {generation:Omit<typeof sample.generation,'form'|'businessFields'> & {form?:{mode:'recommended'|'custom';fields?:string[];guidance?:string};businessFields?:Record<string,string>}}
export function intentTaskKey(value:unknown):string {if(Array.isArray(value))return '['+value.map(intentTaskKey).join(',')+']';if(value&&typeof value==='object')return '{'+Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,v])=>JSON.stringify(key)+':'+intentTaskKey(v)).join(',')+'}';return JSON.stringify(value)}
export function validateIntentTask(value:unknown,templates:Template[]):IntentTask {
 const v=value as IntentTask;const fail=(message:string):never=>{throw new Error(message)};const text=(x:unknown)=>typeof x==='string'&&!!x.trim();
 if(!v||typeof v!=='object'||v.schemaVersion!=='1.0')fail('schemaVersion 必须为 1.0');
 for(const key of ['requestId','sourceAgent','siteId'] as const)if(!text(v[key]))fail(`缺少 ${key}`);
 if(![v.intent,v.generation,v.resources,v.publication].every(x=>x&&typeof x==='object'&&!Array.isArray(x)))fail('缺少 intent、generation、resources 或 publication');
 const keys=(data:object,expected:string[],label:string)=>{if(Object.keys(data).some(k=>!expected.includes(k)))fail(`${label} 包含未定义字段`)};keys(v,['schemaVersion','requestId','sourceAgent','siteId','intent','generation','resources','publication'],'任务');keys(v.intent,['id','fingerprint','topic','stage','audience','need'],'intent');keys(v.generation,['pageType','templateId','conversionAction','market','language','primaryColor','fontStyle','form','businessFields'],'generation');keys(v.resources,['knowledgeDirectories','productIds','imageAssetId'],'resources');keys(v.publication,['mode','authorizationRef','slug','placements','navigationPages','onMissingResources','minimumAiScore'],'publication');
 for(const key of ['id','fingerprint','topic','audience','need'] as const)if(!text(v.intent[key]))fail(`缺少 intent.${key}`);
 if(!['了解','对比','决策'].includes(v.intent.stage))fail('意图阶段应为了解、对比或决策');
 const t=templates.find(t=>t.id===v.generation.templateId);if(!t||t.type!==v.generation.pageType)fail('模板不存在或与页面类型不匹配');
 if(!['获取报价','预约沟通','领取资料','发起咨询','提交需求','活动报名'].includes(v.generation.conversionAction))fail('不支持的转化动作');
 if(!['中国大陆','全球市场','亚太地区','欧洲地区'].includes(v.generation.market)||!['中文简体','English','中文繁體'].includes(v.generation.language)||!['现代无衬线','经典衬线','技术等宽'].includes(v.generation.fontStyle)||!/^#[0-9a-f]{6}$/i.test(v.generation.primaryColor))fail('目标市场、语言、字体或主色调格式无效');
 const form=v.generation.form;
 if(form!==undefined){
  if(!form||typeof form!=='object'||Array.isArray(form))fail('generation.form 必须为对象');
  keys(form,['mode','fields','guidance'],'generation.form');
  if(!['recommended','custom'].includes(form.mode))fail('表单模式应为 recommended 或 custom');
  if(form.guidance!==undefined&&(typeof form.guidance!=='string'||form.guidance.length>120))fail('表单补充要求最多 120 字');
  if(form.mode==='custom'){
   if(!Array.isArray(form.fields)||form.fields.length<1||form.fields.length>6||new Set(form.fields).size!==form.fields.length||form.fields.some(x=>!FORM_FIELDS.includes(x)))fail('自定义表单应为 1–6 个不重复的平台字段');
   if(form.guidance)fail('自定义表单请直接指定字段，不填写推荐要求');
  }else if(form.fields!==undefined)fail('推荐表单通过 guidance 限定范围，不指定 fields');
 }
 const business=v.generation.businessFields;
 if(business!==undefined){
  if(!business||typeof business!=='object'||Array.isArray(business))fail('businessFields 必须为对象');
  const allowed=[...OPTIONAL_FIELDS['公共'],...(OPTIONAL_FIELDS[v.generation.pageType]||[])];
  if(Object.entries(business).some(([name,value])=>!allowed.includes(name)||typeof value!=='string'||value.length>2000))fail('业务补充字段必须属于当前页面类型，每项最多 2000 字');
 }
 if(!Array.isArray(v.resources.knowledgeDirectories)||v.resources.knowledgeDirectories.some(x=>!KNOWLEDGE_DIRS.includes(x)))fail('知识目录必须来自平台目录列表');
 if(!Array.isArray(v.resources.productIds)||v.resources.productIds.some(id=>!mockProductsData.some(p=>p.id===id)))fail('产品标识不存在');
 if(!['', 'demo-product-image'].includes(v.resources.imageAssetId))fail('当前原型支持空素材引用或 demo-product-image');
 if(!['automatic','draft'].includes(v.publication.mode))fail('publication.mode 应为 automatic 或 draft');
 if(v.publication.mode==='automatic'&&!text(v.publication.authorizationRef))fail('自动发布需要 authorizationRef');
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v.publication.slug))fail('页面路径只能包含小写字母、数字和连字符');
 if(!Array.isArray(v.publication.placements)||v.publication.placements.some(x=>!['首屏 Banner','页中横幅','侧边广告位','底部弹出','智能客服推送'].includes(x)))fail('推广位置无效');
 if(!Array.isArray(v.publication.navigationPages)||v.publication.navigationPages.some(x=>!['首页','产品中心','解决方案','新闻资讯','公司介绍','联系我们'].includes(x)))fail('导航范围无效');
 if(v.publication.placements.some(x=>!['首屏 Banner','智能客服推送'].includes(x))&&!v.publication.navigationPages.length)fail('网站推广位置需要选择导航范围');
 if(v.publication.minimumAiScore!==80||v.publication.onMissingResources!=='pause')fail('自动任务要求 AI 友好度至少 80 分，资料缺失时暂停');
 return JSON.parse(JSON.stringify(v));
}
