import type {Template} from './MarketingStudio'

const DIRECTIONS:Record<string,{composition:string;narrative:string;imageLanguage:string;heroColumns:string;headingWidth:string;sectionSpace:number}>= {
  precision:{composition:'左侧产品价值主张，右侧工程产品主图；克制、清晰的工业风格',narrative:'能力→场景→服务支持→询价',imageLanguage:'产品实物或明确标识的工业示意',heroColumns:'1.08fr 1fr',headingWidth:'430px',sectionSpace:45},
  consult:{composition:'左侧业务问题与解决方案，右侧首屏留资表单',narrative:'业务挑战→解决方案→协作流程→提交需求',imageLanguage:'辅助业务说明，表单为转化焦点',heroColumns:'1.15fr 1fr',headingWidth:'410px',sectionSpace:42},
  heritage:{composition:'编辑式双栏，品牌叙事与大幅企业视觉并重，充足留白',narrative:'企业介绍→专业能力→服务网络→联系',imageLanguage:'品牌授权的企业与项目照片，缺失保留占位',heroColumns:'1fr 1.15fr',headingWidth:'460px',sectionSpace:60},
  campaign:{composition:'居中聚焦主标题、活动信息和单一主要行动，主视觉居下',narrative:'活动产品→参与规则→支持→报名',imageLanguage:'与活动产品相关的主视觉',heroColumns:'1fr',headingWidth:'530px',sectionSpace:40},
  summit:{composition:'有秩序的展会邀请双栏，时间地点层次清晰，保持仪式感',narrative:'展会信息→展品→议程→预约',imageLanguage:'展会或展品授权图片，禁止虚构场馆照片',heroColumns:'1.1fr 1fr',headingWidth:'440px',sectionSpace:52},
  noir:{composition:'深色科技首屏与高对比标题，后续模块形成有节奏的技术说明',narrative:'优势→参数对比→视频→预约',imageLanguage:'清晰的技术产品视觉，避免无意义霓虹装饰',heroColumns:'1.12fr 1fr',headingWidth:'480px',sectionSpace:48},
  craft:{composition:'品牌色沉浸首屏，大图强调产品细节，后接工艺画廊',narrative:'细节画廊→工艺→案例→询价',imageLanguage:'产品细节与工艺实拍，完整展示产品主体',heroColumns:'1fr 1.2fr',headingWidth:'400px',sectionSpace:58},
  guide:{composition:'资料价值说明与首屏精简表单并排，正文强调目录与适用人群',narrative:'目录→适用人群→常见问题→领取',imageLanguage:'真实资料封面或清晰占位，表单保持可见',heroColumns:'1.1fr 1fr',headingWidth:'420px',sectionSpace:40},
  atelier:{composition:'品牌杂志式排版，标题与大幅项目视觉相互呼应，宽松阅读节奏',narrative:'品牌故事→项目画廊→发展历程→联系',imageLanguage:'企业与项目授权视觉，不用模板建筑图假冒企业',heroColumns:'1fr 1.25fr',headingWidth:'470px',sectionSpace:64},
  wholesale:{composition:'左右分栏导入采购主题，主体使用清晰的产品矩阵',narrative:'产品系列→采购优势→参与说明→询价',imageLanguage:'统一角度和比例的真实产品图片',heroColumns:'1.05fr 1fr',headingWidth:'430px',sectionSpace:38},
  offer:{composition:'品牌色大面积沉浸首屏，突出活动权益、期限和主要 CTA',narrative:'权益→参与步骤→常见问题→报名',imageLanguage:'服务于权益说明的品牌素材',heroColumns:'1.1fr 1fr',headingWidth:'450px',sectionSpace:42},
  session:{composition:'主题与交流价值在左，报名表单在右，后续议程与嘉宾信息清晰分层',narrative:'主题→嘉宾→议程→报名',imageLanguage:'仅采用有来源的嘉宾照片及身份，缺失保留占位',heroColumns:'1.1fr 1fr',headingWidth:'440px',sectionSpace:50},
}

export function templateDesignSpec(template:Template,custom=false){
  const direction=custom?{composition:'按用户所选布局与组件建立信息层级',narrative:'严格按用户组件顺序',imageLanguage:'使用用户授权素材',heroColumns:'1.08fr 1fr',headingWidth:'430px',sectionSpace:45}:DIRECTIONS[template.id]
  if(!direction)throw new Error(`模板缺少设计规范：${template.id}`)
  return {referenceId:custom?'custom':template.id,referenceName:custom?'自定义组件':template.name,attribution:custom?null:template.source||null,
    ...direction,lockedStructure:!custom,mobile:'单栏重排，文案→主视觉或表单→后续模块；不按整页等比缩小，不隐藏已选字段',
    contentPolicy:'相似指构图和信息组织，不复制参考品牌、示例事实或未经授权素材；保留用户配置。'}
}
