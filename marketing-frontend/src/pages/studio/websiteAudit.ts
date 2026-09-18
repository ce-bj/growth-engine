// External agent response fixture only. No local audit/scoring/repair implementation.
export interface AuditItem {name:string;value:number;evidence:string}
export interface AuditGroup {name:string;weight:number;items:AuditItem[];score:number}
export interface WebsiteAudit {checkedAt:string;before:{completeness:number;ai:number};completeness:number;ai:number;layers:AuditGroup[];pillars:AuditGroup[];changes:string[];needs:string[];wordCount:number;stale:boolean;freshnessUnknown:boolean}
export const mockWebsiteAuditData:WebsiteAudit={
 checkedAt:'',before:{completeness:68,ai:72},completeness:84,ai:82,wordCount:420,stale:false,freshnessUnknown:true,
 changes:['完善 SEO 标题与 Meta 描述','调整 FAQ 为独立问答','补充参数表结构与关联内容导航'],
 needs:['补充资质认证编号的验证来源','确认动态资料的最近更新日期'],
 layers:[
 {name:'基础层',weight:25,score:90,items:[{name:'标题、卖点、参数与素材',value:1,evidence:'结构检查结果由网站检测助手返回'}]},
 {name:'价值层',weight:25,score:85,items:[{name:'核心卖点、应用场景、案例与 FAQ',value:1,evidence:'已返回对应内容建议'}]},
 {name:'信任层',weight:15,score:65,items:[{name:'认证、标准、交付与售后',value:.5,evidence:'认证依据仍需补充'}]},
 {name:'转化层',weight:20,score:90,items:[{name:'CTA、产品推荐与内链',value:1,evidence:'已返回结构调整建议'}]},
 {name:'SEO 层',weight:15,score:85,items:[{name:'标题、描述、结构化数据与内链',value:1,evidence:'等待站点发布服务同步'}]}
 ],
 pillars:[
 {name:'被看见',weight:25,score:80,items:[{name:'站点可发现性',value:1,evidence:'接收站点服务检查结果'},{name:'页面可访问性',value:1,evidence:'接收访问检查结果'},{name:'结构化索引',value:.5,evidence:'接收结构化索引检查结果'}]},
 {name:'被理解',weight:40,score:90,items:[{name:'结构化程度',value:1,evidence:'接收参数字段检查结果'},{name:'自包含性',value:1,evidence:'接收独立问答检查结果'},{name:'语义清晰度',value:1,evidence:'接收内容语义检查结果'}]},
 {name:'被信任',weight:35,score:75,items:[{name:'事实密度',value:1,evidence:'接收知识依据检查结果'},{name:'权威信号',value:.5,evidence:'认证来源待补充'},{name:'新鲜度',value:.5,evidence:'资料日期待确认'}]}
 ]
}
