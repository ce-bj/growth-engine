import {useState} from 'react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import sample from './intent-task.example.json'
import {KNOWLEDGE_DIRS} from './ResourcePanel'
import {mockProductsData} from './blocks'
import type {Template} from './MarketingStudio'
export type IntentTask=typeof sample
export function intentTaskKey(value:unknown):string {if(Array.isArray(value))return '['+value.map(intentTaskKey).join(',')+']';if(value&&typeof value==='object')return '{'+Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,v])=>JSON.stringify(key)+':'+intentTaskKey(v)).join(',')+'}';return JSON.stringify(value)}
export function validateIntentTask(value:unknown,templates:Template[]):IntentTask {
 const v=value as IntentTask;const fail=(message:string):never=>{throw new Error(message)};const text=(x:unknown)=>typeof x==='string'&&!!x.trim();
 if(!v||typeof v!=='object'||v.schemaVersion!=='1.0')fail('schemaVersion 必须为 1.0');
 for(const key of ['requestId','sourceAgent','siteId'] as const)if(!text(v[key]))fail(`缺少 ${key}`);
 if(!v.intent||!v.generation||!v.resources||!v.publication)fail('缺少 intent、generation、resources 或 publication');
 const keys=(data:object,expected:string[],label:string)=>{if(Object.keys(data).some(k=>!expected.includes(k)))fail(`${label} 包含未定义字段`)};keys(v,['schemaVersion','requestId','sourceAgent','siteId','intent','generation','resources','publication'],'任务');keys(v.intent,['id','fingerprint','topic','stage','audience','need'],'intent');keys(v.generation,['pageType','templateId','conversionAction','market','language','primaryColor','fontStyle'],'generation');keys(v.resources,['knowledgeDirectories','productIds','imageAssetId'],'resources');keys(v.publication,['mode','authorizationRef','slug','placements','navigationPages','onMissingResources','minimumAiScore'],'publication');
 for(const key of ['id','fingerprint','topic','audience','need'] as const)if(!text(v.intent[key]))fail(`缺少 intent.${key}`);
 if(!['了解','对比','决策'].includes(v.intent.stage))fail('意图阶段应为了解、对比或决策');
 const t=templates.find(t=>t.id===v.generation.templateId);if(!t||t.type!==v.generation.pageType)fail('模板不存在或与页面类型不匹配');
 if(!['获取报价','预约沟通','领取资料','发起咨询','提交需求','活动报名'].includes(v.generation.conversionAction))fail('不支持的转化动作');
 if(!['中国大陆','全球市场','亚太地区','欧洲地区'].includes(v.generation.market)||!['中文简体','English','中文繁體'].includes(v.generation.language)||!['现代无衬线','经典衬线','技术等宽'].includes(v.generation.fontStyle)||!/^#[0-9a-f]{6}$/i.test(v.generation.primaryColor))fail('目标市场、语言、字体或主色调格式无效');
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
export default function IntentTaskImport({templates,onRun}:{templates:Template[];onRun:(task:IntentTask)=>void}){
 const [task,setTask]=useState<IntentTask|null>(null);const [error,setError]=useState('');const [reading,setReading]=useState(false);
 return <div className="dialog-fields"><label>意图文件<Input type="file" accept=".json,application/json" disabled={reading} onChange={async e=>{const file=e.target.files?.[0];setTask(null);setError('');if(!file)return;if(file.size>1024*1024){setError('文件不能超过 1 MB');return}setReading(true);try{setTask(validateIntentTask(JSON.parse(await file.text()),templates))}catch(err){setError(err instanceof Error?err.message:'文件格式无效')}finally{setReading(false)}}}/></label><Button variant="outline" onClick={()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(sample,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='marketing-intent.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}}>下载意图模板</Button>{error&&<p role="alert" className="error-text">{error}</p>}{task&&<div className="intent-import-summary"><strong>{task.intent.topic} · {task.intent.stage}</strong><p>{task.intent.need}</p><dl><dt>来源</dt><dd>{task.sourceAgent}</dd><dt>意图标识</dt><dd>{task.intent.id}</dd><dt>页面类型</dt><dd>{task.generation.pageType}</dd><dt>模板</dt><dd>{templates.find(t=>t.id===task.generation.templateId)?.name}</dd><dt>执行方式</dt><dd>{task.publication.mode==='automatic'?'自动生成并发布':'生成草稿'}</dd><dt>推广位置</dt><dd>{task.publication.placements.join('、')||'仅链接'}</dd></dl></div>}<Button disabled={!task||reading} onClick={()=>task&&onRun(task)}>导入并运行</Button></div>
}
