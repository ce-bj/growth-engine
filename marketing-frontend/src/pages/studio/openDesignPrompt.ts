import source from './prompts/open-design.marketing.json'

export const OPEN_DESIGN_PROVENANCE={adapterVersion:source.adapterVersion,license:source.license,
  sources:source.rules.map(({id,source,sourceVersion,sha256})=>({id,path:source,sourceVersion,sha256}))}

export const OPEN_DESIGN_PROMPT=source.rules.map(rule=>`[OpenDesign: ${rule.id}]\n${rule.text}`).join('\n\n')

export const OPEN_DESIGN_ADAPTER=`以上为 OpenDesign 原文中适用于营销视觉的规则。当前交付渠道为响应式营销落地页。
以 input.template.designSpec 为所选参考模板的 Design Spec，保留其首屏构图、信息层级、模块叙事及移动端重排规则。
品牌颜色、字体、实际文案、产品和表单以当前输入为准；模板的来源名称仅用于风格归因，不代表已取得原网站素材。
OpenDesign 的单一 CTA 对本场景指统一主要转化目标，可在首屏和页尾重复出现；secondary 仅在明确配置时提供。
采用正文对比度至少 4.5:1、CTA 触达区域至少 44px；海报的固定画布尺寸、印刷参数不适用于网页。
输出当前接口的结构化 JSON；不输出 HTML 文件，不调用工具、不调度子智能体，不声称已完成模型渲染、RAG或发布。`
