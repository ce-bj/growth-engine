import {useState} from 'react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {StudioSelect} from '@/components/ui/select'
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog'
import {Settings2} from 'lucide-react'
import CombinedPreview from './CombinedPreview'
import {APPEAR_LABELS,APPEAR_OPTIONS,CHAT_TRIGGERS,OVERLAY_PLACEMENTS,STAGES,strategyIssues,strategyOf,strategySummary,type AfterClose,type AppearMode,type IntentLevel,type PlacementStrategy,type VisitorType} from './placementStrategy'
export const NAV_PAGES=['首页','产品中心','解决方案','新闻资讯','公司介绍','联系我们']
export const POSITION_HELP:Record<string,string>={'首屏 Banner':'网站首页导航下方的首屏推广区域','页中横幅':'网站正文内容之间的横向推广区域','侧边广告位':'网站正文右侧的广告区域，仅电脑显示','底部弹出':'网站视口底部的悬浮推广卡片','智能客服推送':'访客在智能客服对话中满足条件后，发送落地页推荐消息'}
export interface StrategyFields {chatTrigger?:string;chatKeywords?:string;chatTurns?:number;scopes?:string[];stay?:number;scroll?:number;pages?:number;duration?:number;matchCount?:number;startTime?:string;endTime?:string;interval?:number;dailyLimit?:number;device:string;caption:string;name:string;enabled:boolean;strategy?:Partial<PlacementStrategy>}
const AFTER_CLOSE:Record<AfterClose,string>={visit:'本次访问不再出现',days:'若干天内不再出现',never:'不再出现'}
const num=(v:string,min:number,max:number)=>Math.max(min,Math.min(max,Number(v)||min))

export default function StrategyEditor({value,onChange,company,goal,href,placements}:{placements:StrategyFields[];value:StrategyFields;onChange:(patch:Partial<StrategyFields>)=>void;company:string;goal:string;href:string}) {
 const [open,setOpen]=useState(false)
 const banner=value.name==='首屏 Banner',side=value.name==='侧边广告位',chat=value.name==='智能客服推送'
 const scopes=banner?['首页']:value.scopes||['产品中心']
 const s=strategyOf(value)
 // Strategy edits are stored as overrides so defaults keep following the placement type.
 const set=(patch:Partial<PlacementStrategy>)=>onChange({strategy:{...value.strategy,...patch}})
 const issues=strategyIssues(value)
 return <div className="strategy-content placement-workspace">
  <div className="placement-focus"><div><h2>{value.name}<span>{value.enabled?'已启用':'未启用'}</span></h2><p>{POSITION_HELP[value.name]}</p><ul className="strategy-summary">{strategySummary(value).map(t=><li key={t}>{t}</li>)}</ul>{issues.length>0&&<p className="strategy-issue">{issues[0]}</p>}</div><Button variant="outline" onClick={()=>setOpen(true)}><Settings2 size={14}/>调整设置</Button></div>
  <CombinedPreview placements={placements} company={company} goal={goal} href={href} selectedName={value.name}/>
  <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogTitle>{value.name}设置</DialogTitle><DialogDescription>修改即时保存，预览与策略摘要同步更新。</DialogDescription>
   <div className="dialog-fields strategy-sections">
    <section><h4>展示内容与范围</h4>
     <label>推广文案<Input value={value.caption} onChange={e=>onChange({caption:e.target.value})}/></label>
     {chat?<p className="subtle">展示位置：智能客服对话消息区</p>:<div className="scope-checks"><strong>在哪些页面显示</strong>{NAV_PAGES.map(p=><label className="checkline" key={p}><input type="checkbox" disabled={banner} checked={scopes.includes(p)} onChange={e=>onChange({scopes:e.target.checked?[...scopes,p]:scopes.filter(x=>x!==p)})}/>{p}</label>)}</div>}
     {banner&&<p className="subtle">首屏 Banner 固定在首页首屏。</p>}
     {value.name==='页中横幅'&&<label className="checkline"><input type="checkbox" checked={s.topicMatch} onChange={e=>set({topicMatch:e.target.checked})}/>只在主题与营销页相关的页面出现</label>}
     <label>适用设备<StudioSelect label="适用设备" value={side?'电脑':value.device} options={side?['电脑']:['全部设备','电脑','平板','手机']} onChange={v=>onChange({device:v})}/></label>
    </section>

    <section><h4>出现时机</h4>
     {chat?<><label>触发条件<StudioSelect label="客服推送触发条件" value={value.chatTrigger||CHAT_TRIGGERS[0]} options={CHAT_TRIGGERS} onChange={v=>onChange({chatTrigger:v})}/></label>
      {value.chatTrigger==='达到对话轮次'?<label>访客消息数<Input type="number" min="1" max="50" value={value.chatTurns||3} onChange={e=>onChange({chatTurns:num(e.target.value,1,50)})}/></label>
       :value.chatTrigger&&value.chatTrigger!==CHAT_TRIGGERS[0]?<label>关联产品或主题<Input placeholder="未填写时使用落地页关联产品与内容主题" value={value.chatKeywords||''} onChange={e=>onChange({chatKeywords:e.target.value})}/></label>:null}</>
     :<><label>出现方式<StudioSelect label="出现方式" value={APPEAR_LABELS[s.appear]} options={APPEAR_OPTIONS[value.name].map(m=>APPEAR_LABELS[m])} onChange={v=>set({appear:(Object.keys(APPEAR_LABELS) as AppearMode[]).find(m=>APPEAR_LABELS[m]===v)})}/></label>
      {s.appear==='delay'&&<label>停留秒数<Input type="number" min="1" max="600" value={s.delaySec} onChange={e=>set({delaySec:num(e.target.value,1,600)})}/></label>}
      {(s.appear==='scroll'||s.appear==='scroll_or_exit')&&<label>滚动深度（%）<Input type="number" min="10" max="100" value={s.scrollPct} onChange={e=>set({scrollPct:num(e.target.value,10,100)})}/></label>}
      {s.appear==='pages'&&<label>浏览到第几个页面<Input type="number" min="2" max="20" value={s.pageCount} onChange={e=>set({pageCount:num(e.target.value,2,20)})}/></label>}
      {(s.appear==='exit'||s.appear==='scroll_or_exit')&&<p className="subtle">离开意图：电脑端鼠标移向地址栏或关闭区，手机端快速上滑或点击返回。</p>}</>}
    </section>

    <section><h4>访客条件</h4>
     <label className="checkline"><input type="checkbox" checked={s.intentMatchOnly} onChange={e=>set({intentMatchOnly:e.target.checked})}/>只向意图与本营销页匹配的访客展示</label>
     <div className="two-fields"><label>意向等级<StudioSelect label="意向等级" value={s.intentLevel} options={['不限','中及以上','高']} onChange={v=>set({intentLevel:v as IntentLevel})}/></label><label>访客类型<StudioSelect label="访客类型" value={s.visitorType} options={['全部访客','新访客','回访访客']} onChange={v=>set({visitorType:v as VisitorType})}/></label></div>
     <div className="scope-checks"><strong>意图阶段（不选为不限）</strong>{STAGES.map(st=><label className="checkline" key={st}><input type="checkbox" checked={s.stages.includes(st)} onChange={e=>set({stages:e.target.checked?[...s.stages,st]:s.stages.filter(x=>x!==st)})}/>{st}期</label>)}</div>
     <label className="checkline"><input type="checkbox" checked={s.hideAfterConversion} onChange={e=>set({hideAfterConversion:e.target.checked})}/>已在本营销页转化的访客不再展示</label>
    </section>

    <section><h4>投放时间</h4>
     <div className="two-fields"><label>开始日期<Input type="date" value={s.startDate} onChange={e=>set({startDate:e.target.value})}/></label><label>结束日期（留空为长期）<Input type="date" value={s.endDate} onChange={e=>set({endDate:e.target.value})}/></label></div>
     <div className="two-fields"><label>每日开始（UTC+8）<Input type="time" value={s.startTime} onChange={e=>set({startTime:e.target.value})}/></label><label>每日结束（UTC+8）<Input type="time" value={s.endTime} onChange={e=>set({endTime:e.target.value})}/></label></div>
    </section>

    <section><h4>出现次数</h4>
     <div className="two-fields"><label>同一访客每天最多（次）<Input type="number" min="1" max="20" value={s.dailyLimit} onChange={e=>set({dailyLimit:num(e.target.value,1,20)})}/></label><label>累计最多（次，0 为不限）<Input type="number" min="0" max="100" value={s.totalLimit} onChange={e=>set({totalLimit:Math.max(0,Math.min(100,Number(e.target.value)||0))})}/></label></div>
     <label>两次出现至少间隔（分钟）<Input type="number" min="1" max="1440" value={s.intervalMin} onChange={e=>set({intervalMin:num(e.target.value,1,1440)})}/></label>
     <label className="checkline"><input type="checkbox" checked={s.oncePerVisit} onChange={e=>set({oncePerVisit:e.target.checked})}/>{chat?'每次对话最多推送 1 次':'每次访问最多出现 1 次'}</label>
    </section>

    <section><h4>关闭与优先级</h4>
     {banner?<p className="subtle">首屏 Banner 是页面固定区域，不提供关闭按钮。</p>:<>
      <label className="checkline"><input type="checkbox" checked={s.closable} onChange={e=>set({closable:e.target.checked})}/>{chat?'访客可关闭推荐卡片':'显示关闭按钮'}</label>
      {s.closable&&<div className="two-fields"><label>访客关闭后<StudioSelect label="关闭后" value={AFTER_CLOSE[s.afterClose]} options={Object.values(AFTER_CLOSE)} onChange={v=>set({afterClose:(Object.keys(AFTER_CLOSE) as AfterClose[]).find(k=>AFTER_CLOSE[k]===v)})}/></label>{s.afterClose==='days'&&<label>天数<Input type="number" min="1" max="90" value={s.closeDays} onChange={e=>set({closeDays:num(e.target.value,1,90)})}/></label>}</div>}</>}
     {OVERLAY_PLACEMENTS.includes(value.name)&&<label>优先级<StudioSelect label="优先级" value={s.priority} options={['高','普通','低']} onChange={v=>set({priority:v as PlacementStrategy['priority']})}/><small className="subtle">同一页面同时满足侧边广告位和底部弹出时，只出现优先级高的一个；相同时先出现底部弹出。</small></label>}
    </section>

    {issues.length>0&&<ul className="strategy-issues">{issues.map(i=><li key={i}>{i}</li>)}</ul>}
    <Button onClick={()=>setOpen(false)}>完成</Button>
   </div>
  </DialogContent></Dialog>
 </div>
}
