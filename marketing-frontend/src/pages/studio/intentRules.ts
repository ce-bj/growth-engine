export interface VisitorIntent { id:string; root:string; stage:'了解'|'对比'|'决策'; persona:string; need:string; goal:string; sections:string[] }
export const mockVisitorIntentsData:VisitorIntent[] = [
 {id:'learn',root:'工业阀门',stage:'了解',persona:'工程技术负责人',need:'了解工业阀门的选型原理与适用场景，下载选型指南。',goal:'领取资料',sections:['行业痛点','选型原理','解决方案','品牌与选型指南']},
 {id:'compare',root:'工业阀门',stage:'对比',persona:'工程技术负责人',need:'对比工业阀门的参数、适配范围与差异化能力，预约技术沟通。',goal:'预约沟通',sections:['参数对比','差异化能力','应用案例','预约技术沟通']},
 {id:'decide',root:'工业阀门',stage:'决策',persona:'企业采购负责人',need:'明确工业阀门采购方案与询价所需信息，获取适配报价。',goal:'获取报价',sections:['采购方案','服务与资质','询价说明','提交询价']},
]
export const fingerprint=(intent:VisitorIntent)=>`${intent.root} · ${intent.stage} · ${intent.persona}`
export const INTENT_RULES:Record<string,string>={
 '首屏 Banner':'意图命中、意向等级至少为中，且当日未见过同一营销页；未命中展示默认 Banner。',
 '页中横幅':'意图命中、滚动超过 50%，且当前页面主题相关。',
 '侧边广告位':'意图命中、阶段为对比或决策，且使用电脑访问。',
 '底部弹出':'意图命中、滚动达到 80% 或出现电脑端离开信号，且本次会话未触发。',
 '智能客服推送':'意图命中，且客服识别高意向或访客表达对应意图。',
}
export function matchIntentRule(input:{bound?:VisitorIntent;name:string;enabled:boolean;paused:boolean;scenario:string;limit:number;trigger:string;device:string;audience:string}) {
 const {bound,name,enabled,paused,scenario,limit,trigger,device,audience}=input
 if(paused)return '推广已暂停'
 if(!enabled)return '策略未启用'
 if(!bound)return name==='首屏 Banner'?'未关联意图，展示默认 Banner':'未关联意图，不执行个性化推送'
 if(scenario==='意图不匹配')return name==='首屏 Banner'?'意图未命中，展示默认 Banner':'意图未命中，不推送'
 if(scenario==='已完成转化'||scenario==='当前为目标页面'||scenario==='已关闭提示')return '已被排除'
 if(scenario==='24 小时已展示 2 次'&&limit<=2)return '达到频次上限，不推送'
 if(scenario==='访客画像不同')return name==='首屏 Banner'?'画像不匹配，展示默认 Banner':'画像不匹配，不推送'
 if(scenario==='手机访问'&&(name==='侧边广告位'||device==='电脑'))return '设备不适用，不推送'
 if(audience==='对比阶段'&&bound.stage!=='对比'||audience==='决策阶段'&&bound.stage!=='决策')return '意图阶段不满足策略'
 if(name==='首屏 Banner'&&(scenario==='意向等级低'||scenario==='当日已见过此页'||scenario==='24 小时已展示 2 次'))return '未满足首屏条件，展示默认 Banner'
 if(name==='页中横幅'){
  if(scenario==='当前主题不相关')return '主题不相关，不推送'
  if(scenario==='滚动深度 40%')return '未达到滚动触发条件'
  if(scenario==='滚动深度 60%'&&trigger==='阅读达到 80%')return '未达到滚动触发条件'
  if(scenario==='停留不足 30 秒'&&trigger==='有效停留 30 秒')return '未达到停留触发条件'
 }
 if(name==='侧边广告位'&&bound.stage==='了解')return '了解阶段不适用侧边推广'
 if(name==='底部弹出'){
  if(scenario==='本会话已弹出')return '本次会话已触发，不重复弹出'
  if(scenario==='滚动深度 40%'||scenario==='滚动深度 60%')return '未达到滚动阈值，且无离开信号'
  if(scenario==='手机访问'&&trigger==='电脑端离开信号')return '离开信号仅支持电脑端'
 }
 if(name==='智能客服推送'&&scenario==='客服尚未识别相关需求')return '未满足客服推荐条件'
 return '将展示入口'
}
export const SCENARIOS=['符合条件','意图不匹配','访客画像不同','意向等级低','当日已见过此页','24 小时已展示 2 次','滚动深度 40%','滚动深度 60%','停留不足 30 秒','当前主题不相关','手机访问','本会话已弹出','客服尚未识别相关需求','已完成转化','当前为目标页面','已关闭提示']
