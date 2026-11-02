import {useState} from 'react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import sample from './intent-task.example.json'
import {validateIntentTask,type IntentTask} from './intentTask'
export {validateIntentTask,intentTaskKey,type IntentTask} from './intentTask'
import {getFormFields} from './formFields'
import type {Template} from './MarketingStudio'
export default function IntentTaskImport({templates,onRun}:{templates:Template[];onRun:(task:IntentTask)=>void}){
 const [task,setTask]=useState<IntentTask|null>(null);const [error,setError]=useState('');const [reading,setReading]=useState(false);
 return <div className="dialog-fields"><label>意图文件<Input type="file" accept=".json,application/json" disabled={reading} onChange={async e=>{const file=e.target.files?.[0];setTask(null);setError('');if(!file)return;if(file.size>1024*1024){setError('文件不能超过 1 MB');return}setReading(true);try{setTask(validateIntentTask(JSON.parse(await file.text()),templates))}catch(err){setError(err instanceof Error?err.message:'文件格式无效')}finally{setReading(false)}}}/></label><Button variant="outline" onClick={()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(sample,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='marketing-intent.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}}>下载意图模板</Button>{error&&<p role="alert" className="error-text">{error}</p>}{task&&<div className="intent-import-summary"><strong>{task.intent.topic} · {task.intent.stage}</strong><p>{task.intent.need}</p><dl><dt>来源</dt><dd>{task.sourceAgent}</dd><dt>意图标识</dt><dd>{task.intent.id}</dd><dt>页面类型</dt><dd>{task.generation.pageType}</dd><dt>模板</dt><dd>{templates.find(t=>t.id===task.generation.templateId)?.name}</dd><dt>目标市场 / 语言</dt><dd>{task.generation.market} / {task.generation.language}</dd><dt>表单字段</dt><dd>{getFormFields({goal:task.generation.conversionAction,formConfigured:task.generation.form?.mode==='custom',formFields:task.generation.form?.fields||[],formGuidance:task.generation.form?.guidance}).join('、')}</dd><dt>业务补充</dt><dd>{Object.keys(task.generation.businessFields||{}).join('、')||'未提供'}</dd><dt>执行方式</dt><dd>生成后进入编辑与预览</dd><dt>推广位置</dt><dd>{task.publication.placements.join('、')||'仅链接'}</dd></dl></div>}<Button disabled={!task||reading} onClick={()=>task&&onRun(task)}>导入并生成</Button></div>
}
