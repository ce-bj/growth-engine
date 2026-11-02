import type { Draft } from './MarketingStudio'
export type ReleaseBump='major'|'minor'|'patch'
export interface PublishedVersion {number:number;version?:string;publishedAt:string;draft:Draft;changeType?:ReleaseBump;summary?:string}
export interface VersionedPage {id:string;draft:Draft;publishedDraft?:Draft;versions?:PublishedVersion[]}
export const RELEASE_CHOICES:{type:ReleaseBump;label:string;description:string}[]=[{type:'major',label:'主版本 · 第一位',description:'整体改版，后两位归零'},{type:'minor',label:'次版本 · 第二位',description:'新增内容或功能，末位归零'},{type:'patch',label:'修订号 · 第三位',description:'文案、图片或细节调整'}]
export function incrementVersion(current:string,type:ReleaseBump):string {
 if(!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(current))throw new Error('无效版本号')
 const parts=current.split('.').map(Number)
 if(parts.some(n=>!Number.isSafeInteger(n)))throw new Error('版本号超出范围')
 const index=type==='major'?0:type==='minor'?1:2
 parts[index]+=1
 if(!Number.isSafeInteger(parts[index]))throw new Error('版本号超出范围')
 for(let i=index+1;i<3;i++)parts[i]=0
 return parts.join('.')
}
export function versionLabel(record:Pick<PublishedVersion,'number'|'version'>) {
 return record.version||`1.0.${Math.max(0,record.number-1)}`
}
export function releaseHistory(page:VersionedPage|undefined):PublishedVersion[] {
 if(!page)return []
 if(page.versions?.length)return page.versions.map(v=>({...v,version:versionLabel(v)}))
 if(page.publishedDraft){const d=page.publishedDraft;const number=Math.max(1,d.publishedRevision||page.draft.publishedRevision||1);return [{number,version:d.publishedVersion||page.draft.publishedVersion||versionLabel({number}),publishedAt:d.updatedAt||page.draft.updatedAt,draft:d,summary:'已有发布快照'}]}
 return []
}
export function currentVersion(page:VersionedPage|undefined):string|null {
 const history=releaseHistory(page)
 const latest=history[history.length-1]
 return latest?versionLabel(latest):page?.draft.published?page.draft.publishedVersion||versionLabel({number:page.draft.publishedRevision||1}):null
}
export function publishVersion(page:VersionedPage,draft:Draft,type:ReleaseBump,summary:string,publishedAt:string):VersionedPage {
 const history=releaseHistory(page)
 const version=incrementVersion(currentVersion(page)||'0.0.0',type)
 const number=Math.max(page.draft.publishedRevision||0,...history.map(v=>v.number))+1
 const snapshot:Draft=JSON.parse(JSON.stringify({...draft,published:true,paused:false,linkReady:true,publishedVersion:version,publishedRevision:number,updatedAt:publishedAt,pendingSupplement:undefined}))
 return {...page,draft:snapshot,publishedDraft:snapshot,versions:[...history,{number,version,publishedAt,draft:snapshot,changeType:type,summary:summary.trim()}]}
}
