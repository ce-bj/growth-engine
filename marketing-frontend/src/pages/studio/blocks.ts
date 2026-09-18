export type BlockKind='features'|'products'|'comparison'|'testimonials'|'gallery'|'stats'|'timeline'|'faq'|'form'|'cta'|'text'|'video'
export const BLOCKS:{kind:BlockKind;label:string;description:string}[]=[
 {kind:'features',label:'核心优势',description:'图标与三列能力卡片'},
 {kind:'products',label:'产品列表',description:'产品图片、说明与行动入口'},
 {kind:'comparison',label:'参数对比',description:'表格呈现规格与差异'},
 {kind:'testimonials',label:'客户案例',description:'引用、案例说明与来源'},
 {kind:'gallery',label:'图片画廊',description:'项目与场景图片组'},
 {kind:'stats',label:'实力数据',description:'关键指标与说明'},
 {kind:'timeline',label:'流程与议程',description:'按步骤组织服务或活动'},
 {kind:'faq',label:'常见问题',description:'可折叠的问题与回答'},
 {kind:'form',label:'留资表单',description:'平台字段集或 Agent 推荐'},
 {kind:'cta',label:'行动横幅',description:'突出行动与收益'},
 {kind:'text',label:'图文介绍',description:'标题、正文与内容依据'},
 {kind:'video',label:'视频区域',description:'视频封面与素材占位'},
]
export const LAYOUTS=[{value:'split',label:'左右分栏'},{value:'center',label:'居中聚焦'},{value:'editorial',label:'编辑式叙事'},{value:'form-side',label:'首屏表单'},{value:'showcase',label:'沉浸展示'},{value:'dark',label:'深色科技'}]
export const FIELD_SETS:Record<string,string[]>={'Agent 推荐':[],'基础联系':['姓名','邮箱','公司'],'采购询价':['姓名','邮箱','公司','采购量','需求说明'],'活动报名':['姓名','邮箱','公司','预约日期'],'资料领取':['姓名','邮箱']}
export const FORM_FIELDS=['姓名','邮箱','电话','公司','职位','国家/地区','采购量','需求说明','预约日期']
export const OPTIONAL_FIELDS:Record<string,string[]>={'公共':['核心卖点','目标买家画像','联系方式','竞品名称或网址'],'产品营销':['产品规格/型号','产品认证','最小起订量（MOQ）','生产交货周期'],'线索获取':['询盘诱因/优惠','截止日期'],'品牌介绍':['创立年份','品牌故事要点','重要里程碑','工厂面积','员工及研发人数','核心设备/产线','年产能'],'促销活动':['促销优惠内容','活动截止时间','额外赠品/权益'],'展会页面':['展会名称','展台号','展会时间','展会地点']}
export const mockProductsData=[{id:'gate',name:'铸铁闸门',category:'水利控制设备'},{id:'steel',name:'钢制闸门',category:'工程配套设备'},{id:'clean',name:'清污机',category:'水处理设备'}]
export const inferKind=(title:string):BlockKind=>/视频/.test(title)?'video':/画廊|图片|项目/.test(title)?'gallery':/参数|对比/.test(title)?'comparison':/表单|报名|询价|提交|预约/.test(title)?'form':/产品|展品/.test(title)?'products':/案例|证言/.test(title)?'testimonials':/实力|数据|资质/.test(title)?'stats':/流程|议程|步骤|历程/.test(title)?'timeline':/常见|问题/.test(title)?'faq':/行动|优惠|权益/.test(title)?'cta':/优势|能力|服务/.test(title)?'features':'text'
