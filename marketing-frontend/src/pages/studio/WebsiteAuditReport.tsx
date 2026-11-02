import { useState } from 'react'
import { Copy, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BRAND_CAPABILITY, brandSolution, type WebsiteAudit } from './websiteAudit'
const labels={consistent:'一致',inconsistent:'需统一',review:'待确认',needs_input:'待补充基准'}
export default function WebsiteAuditReport({report,stale,busy,onRetry,onCompose,onBaseline,onOptimize,optimizingId}:{report?:WebsiteAudit;stale:boolean;busy:boolean;onRetry:()=>void;onCompose:(text:string)=>void;onBaseline:()=>void;onOptimize:(id:string)=>void;optimizingId?:string}) {
 const [copyStatus,setCopyStatus]=useState('')
 const copy=async(text:string)=>{try{await navigator.clipboard.writeText(text);setCopyStatus('解决方案已复制。粘贴到生成助手并发送后执行。')}catch{setCopyStatus('无法访问剪贴板，请选中方案手动复制，或点击“填入生成助手”。')}}
 return <div className="dialog-fields brand-report">
  <div className="brand-capability"><ShieldCheck size={22}/><div><strong>{BRAND_CAPABILITY.title}</strong><p>来源：AI 友好度</p></div></div>
  <p className="subtle">检查当前营销页的品牌名称、核心卖点、联系方式与站点基准是否一致。检测后可逐项同意并自动优化，直接更新当前页面草稿。</p>
  {busy?<p className="audit-progress" role="status">{optimizingId?'正在统一页面表述…':'正在核对当前页面与站点品牌基准…'}</p>:null}
  {!report?<div className="brand-empty"><h3>尚未检测</h3><p>检测范围：当前营销页。报告保留问题位置、当前表述与统一建议。</p></div>:<>
   <div className="brand-report-meta"><span>当前页 · 修订 {report.contentRevision}</span><span>{stale?'页面已修改 · 待复检':'报告对应当前内容'}</span></div>
   {stale&&<p role="status" className="brand-stale">页面或品牌基准已变化。请重新检测后采用方案。</p>}
   {report.findings.map(f=><section className="brand-finding" key={f.id}>
    <header><h3>{f.title}</h3><span className={`brand-status brand-${f.status}`}>{f.appliedAt?'已生效':labels[f.status]}</span></header>
    <p>{f.appliedAt?`已按方案统一为「${f.baseline}」`:f.explanation}</p>{f.appliedAt&&<p className="brand-applied"><CheckCircle2 size={14}/>已更新当前草稿</p>}<dl><div><dt>站点基准</dt><dd>{f.baseline||'尚未提供'}</dd></div>{f.evidence.map(e=><div key={e.location}><dt>{e.location}</dt><dd>{f.appliedAt?f.baseline:e.value||'未填写'}</dd></div>)}</dl>
    {f.solution&&!f.appliedAt&&<><div className="brand-solution"><strong>解决方案</strong><p>{f.solution}</p></div><details><summary>查看完整方案文字</summary><pre>{brandSolution(report,f)}</pre></details><div className="brand-actions"><Button size="sm" disabled={stale||busy} onClick={()=>onOptimize(f.id)}><Sparkles size={14}/>{optimizingId===f.id?'优化中…':'同意并自动优化'}</Button><Button size="sm" variant="outline" disabled={stale||busy} onClick={()=>copy(brandSolution(report,f))}><Copy size={14}/>复制解决方案</Button><Button size="sm" variant="ghost" disabled={stale||busy} onClick={()=>onCompose(brandSolution(report,f))}>填入生成助手<ArrowRight size={14}/></Button></div></>}
    {f.status==='needs_input'&&<Button disabled={busy} size="sm" variant="outline" onClick={onBaseline}>补充品牌基准</Button>}
   </section>)}
   <small className="subtle">检测时间：{new Date(report.checkedAt).toLocaleString('zh-CN')}</small>
  </>}
  {copyStatus&&<p role="status">{copyStatus}</p>}
  <Button disabled={busy} onClick={onRetry}>{busy?(optimizingId?'优化中…':'检测中…'):report?'重新检测':'开始品牌一致性检测'}</Button>
 </div>
}
