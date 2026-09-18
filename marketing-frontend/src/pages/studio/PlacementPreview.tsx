import { useEffect, useState } from 'react'
import { ArrowUpRight, MessageSquare, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
export default function PlacementPreview({name,company,caption,goal,href,result}:{name:string;company:string;caption:string;goal:string;href:string;result:string}) {
 const [closed,setClosed]=useState(false)
 useEffect(()=>setClosed(false),[name,result])
 const hidden=result==='当前设备不展示';
 const card=hidden?<div className="subtle">此设备不展示该推广位置</div>:<div className={`visitor-promo ${name==='首屏 Banner'?'visitor-hero':''}`}><span className="visitor-promo-art">{name==='智能客服推送'?<MessageSquare size={25}/>:<span>↗</span>}</span><div><small>{company}</small><h3>{caption}</h3><Button size="sm" onClick={()=>window.open(`${href}&placement=${encodeURIComponent(name)}`,'_blank','noopener,noreferrer')}>{goal}<ArrowUpRight size={12}/></Button></div>{['底部弹出','智能客服推送'].includes(name)&&<button className="visitor-close" aria-label="关闭推广预览" onClick={()=>setClosed(true)}><X size={13}/></button>}</div>
 return <div className="visitor-preview"><div className="visitor-browser"><i/><i/><i/><span>门户网站 · 展示位置预览</span></div><div className="visitor-site"><nav><b>{company}</b><span>产品　解决方案　关于我们</span></nav>{name==='首屏 Banner'&&!closed?card:<div className="visitor-default-hero"><small>PROFESSIONAL SOLUTIONS</small><h3>为专业工程，提供可靠支持</h3></div>}<div className="visitor-body"><main><h4>产品选型与应用指南</h4><p/><p/><p/>{name==='页中横幅'&&!closed&&card}<h4>了解更多适用场景</h4><p/><p/></main><aside>{name==='侧边广告位'&&!closed?card:<><span/><span/><span/></>}</aside></div>{name==='底部弹出'&&!closed&&<div className="visitor-bottom">{card}</div>}{name==='智能客服推送'&&!closed&&<div className="visitor-chat"><small>专业顾问 · 推荐内容</small>{card}</div>}</div><div className="visitor-preview-note"><span>{closed?'已关闭，本次预览不再展示':`${name} · 展示样式示意`}</span>{closed&&<Button size="sm" variant="ghost" onClick={()=>setClosed(false)}>重新预览</Button>}</div><p className="subtle">配置状态：{result}。</p></div>
}
