import { Button } from '@/components/ui/button'
import {currentVersion,releaseHistory,versionLabel,type VersionedPage} from './releaseVersions'
export default function PublicationHistory({page,onPreview}:{page?:VersionedPage;onPreview:(version:string)=>void}) {
 const records=releaseHistory(page),current=currentVersion(page)
 return <div className="publication-history"><p>{page?.draft.title||'营销页面'}{current?` · 当前版本 ${current}`:''}</p>{records.length?records.slice().reverse().map(record=><article className="publication-history-item" key={record.number}><header><strong>v{versionLabel(record)}</strong>{versionLabel(record)===current&&<span className="status">当前发布</span>}<time>{new Date(record.publishedAt).toLocaleString('zh-CN',{timeZone:'Asia/Taipei'})}</time></header><p>{record.summary||'未填写更新说明'}</p><small>{record.draft.title}</small><Button size="sm" variant="outline" onClick={()=>onPreview(versionLabel(record))}>查看此版本</Button></article>):<p className="subtle">{current?'当前页面没有可查看的发布快照。':'尚未发布，草稿编辑不会产生发布版本。'}</p>}</div>
}
