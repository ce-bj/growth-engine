import type { Draft, Template } from './MarketingStudio'
import type { IntentTask } from './intentTask'
import { selectTemplate, buildGenerationRequest } from './generation'

// base is a fresh draft carrying the current site's company information.
export function draftFromIntentTask(base: Draft, task: IntentTask, template: Template): Draft {
  const form=task.generation.form
  const next: Draft={...base,...selectTemplate(base,template),stage:'edit',confirmed:true,
    need:task.intent.need,goal:task.generation.conversionAction,region:task.generation.market,language:task.generation.language,
    color:task.generation.primaryColor,fontStyle:task.generation.fontStyle,slug:task.publication.slug,
    knowledgeDirs:[...task.resources.knowledgeDirectories],productIds:[...task.resources.productIds],
    imageAssetId:task.resources.imageAssetId,imageReady:!!task.resources.imageAssetId,
    knowledgeReady:false,knowledgeName:'',validated:false,
    formConfigured:form?.mode==='custom',formSet:form?.mode==='custom'?'自定义':'Agent 推荐',
    formFields:form?.mode==='custom'?[...(form.fields||[])]:[],formGuidance:form?.guidance||'',
    optionalFields:{...task.generation.businessFields},
    visitorIntent:{id:task.intent.id,root:task.intent.topic,stage:task.intent.stage as NonNullable<Draft['visitorIntent']>['stage'],persona:task.intent.audience,need:task.intent.need,goal:task.generation.conversionAction,sections:template.sections},
    agentTask:{request:task,status:'running'},promote:!!task.publication.placements.length,
    configuredFields:['need','goal','region','language','color','fontStyle',...(form?['formFields','formGuidance']:[])],
    messages:[{role:'生成助手',text:`已接收 ${task.sourceAgent} 的任务，关联意图：${task.intent.topic}。开始生成页面。`}],
  }
  next.placements=next.placements.map(p=>({...p,enabled:task.publication.placements.includes(p.name),scopes:p.name==='首屏 Banner'?['首页']:[...task.publication.navigationPages],chatKeywords:task.intent.topic}))
  next.generationRequest=buildGenerationRequest(next,template)
  return next
}
