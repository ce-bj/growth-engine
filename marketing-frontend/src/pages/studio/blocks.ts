export const GOALS=['获取报价','预约沟通','领取资料','发起咨询','提交需求','活动报名']
export const KNOWLEDGE_DIRS=['企业与品牌','产品资料','行业解决方案','客户案例','活动与展会','服务与常见问题']
export type BlockKind='features'|'products'|'comparison'|'testimonials'|'gallery'|'stats'|'timeline'|'faq'|'form'|'cta'|'text'|'video'
// Component catalogue shown in the add menus; description = what it is for, needs = what it requires (产品设计 6.3).
export const BLOCKS:{kind:BlockKind;label:string;description:string;needs:string}[]=[
 {kind:'features',label:'核心优势',description:'用 3–4 张卡片概括产品或服务的关键能力，适合放在首屏之后，帮访客快速建立印象。',needs:'无需准备，AI 按需求起草；具体数值需有依据。'},
 {kind:'products',label:'产品列表',description:'展示所选产品的图片、名称、规格摘要和咨询入口。',needs:'从产品库关联至少 1 个产品。'},
 {kind:'comparison',label:'参数对比',description:'用表格对比两个及以上产品的类别与规格，帮助访客选型。',needs:'至少 2 个产品及其规格参数。'},
 {kind:'testimonials',label:'客户案例',description:'引用真实客户的评价或项目案例，增强可信度。',needs:'经确认、可公开引用的案例及来源。'},
 {kind:'gallery',label:'图片画廊',description:'展示项目现场、应用场景或产品细节的图片组。',needs:'至少 1 张授权图片，或使用 AI 示意图。'},
 {kind:'stats',label:'实力数据',description:'用关键数字展示企业规模、产能或项目经验。',needs:'真实数值及来源。'},
 {kind:'timeline',label:'流程与议程',description:'按步骤说明合作流程、服务过程或活动议程。',needs:'无需准备，AI 起草步骤；活动时间需填写。'},
 {kind:'faq',label:'常见问题',description:'可折叠的问答，解答访客咨询前的常见疑虑。',needs:'无需准备，AI 起草问题；涉及事实的回答需有依据。'},
 {kind:'form',label:'留资表单',description:'收集访客的联系方式和需求，页面主按钮会定位到这里。',needs:'至少 1 个表单字段，默认按转化目标推荐。'},
 {kind:'cta',label:'行动横幅',description:'醒目的色块横幅，重复主行动号召，适合放在长页面中部或末尾。',needs:'无需准备；写优惠时需填写优惠内容。'},
 {kind:'text',label:'图文介绍',description:'一段标题加正文，可配图，适合介绍企业、应用场景或解决方案。',needs:'无需准备，AI 按需求起草。'},
 {kind:'video',label:'视频区域',description:'嵌入产品演示或企业宣传视频。',needs:'可访问的视频地址（MP4 或 WebM）。'},
]
/** Hover text for a component: what it is for, then what it needs. */
export const blockTip=(b:{description:string;needs:string})=>`${b.description}\n需要：${b.needs}`
export const LAYOUTS=[{value:'split',label:'左右分栏'},{value:'center',label:'居中聚焦'},{value:'editorial',label:'编辑式叙事'},{value:'form-side',label:'首屏表单'},{value:'showcase',label:'沉浸展示'},{value:'dark',label:'深色科技'}]
export const FIELD_SETS:Record<string,string[]>={'Agent 推荐':[],'基础联系':['姓名','邮箱','公司'],'采购询价':['姓名','邮箱','公司','采购量','需求说明'],'活动报名':['姓名','邮箱','公司','预约日期'],'资料领取':['姓名','邮箱']}
export const FORM_FIELDS=['姓名','邮箱','电话','公司','职位','国家/地区','采购量','需求说明','预约日期']
export const OPTIONAL_FIELDS:Record<string,string[]>={'公共':['核心卖点','目标买家画像','联系方式','竞品名称或网址'],'产品营销':['产品规格/型号','产品认证','最小起订量（MOQ）','生产交货周期'],'线索获取':['询盘诱因/优惠','截止日期'],'品牌介绍':['创立年份','品牌故事要点','重要里程碑','工厂面积','员工及研发人数','核心设备/产线','年产能'],'促销活动':['促销优惠内容','活动截止时间','额外赠品/权益'],'展会页面':['展会名称','展台号','展会时间','展会地点']}
// Mock product library: specifications come from here; a missing spec becomes a page gap.
export const mockProductsData:{id:string;name:string;category:string;spec?:string}[]=[{id:'gate',name:'铸铁闸门',category:'水利控制设备',spec:'示例规格：DN300–DN2000'},{id:'steel',name:'钢制闸门',category:'工程配套设备',spec:'示例规格：孔口宽 1–10 m'},{id:'clean',name:'清污机',category:'水处理设备'}]
// Mock site profile: the confirmed brand baseline and contact used by every page of this site.
export const SITE_PROFILE={contact:'sales@example.com（示例站点档案）',sellingPoints:''}
export const productSpec=(d:{productSpecs?:Record<string,string>;optionalFields?:Record<string,string>},p:{id:string;spec?:string})=>d.productSpecs?.[p.id]?.trim()||p.spec||d.optionalFields?.['产品规格/型号']?.trim()||''
export const inferKind=(title:string):BlockKind=>/视频/.test(title)?'video':/画廊|图片|项目/.test(title)?'gallery':/参数|对比/.test(title)?'comparison':/表单|报名|询价|提交|预约/.test(title)?'form':/产品|展品/.test(title)?'products':/案例|证言/.test(title)?'testimonials':/实力|数据|资质/.test(title)?'stats':/流程|议程|步骤|历程/.test(title)?'timeline':/常见|问题/.test(title)?'faq':/行动|优惠|权益/.test(title)?'cta':/优势|能力|服务/.test(title)?'features':'text'
