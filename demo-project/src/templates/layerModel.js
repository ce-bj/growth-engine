/**
 * 详情页四层内容模型
 *
 * A/B/C/D 的「页面模板与样式」均可由 AI + 设计师产出；
 * 差异在于「运行时数据从哪来」。
 */

export const LAYER_MODEL = {
  A: {
    label: "产品独立字段",
    templateBy: "AI + 设计师绑定槽位",
    dataFrom: "Agent generate_product_content → 用户预览区手改",
  },
  B: {
    label: "富文本正文",
    templateBy: "AI + 设计师绑定分区",
    dataFrom: "Agent generate_product_content → 用户预览区手改",
  },
  C: {
    label: "独立应用",
    templateBy: "AI 为每个 CMS 应用生成/挑选组件样式与排版",
    dataFrom: "内容管理 · 独立应用数据源（企业概况、询价表单等）",
  },
  D: {
    label: "衍生",
    templateBy: "AI 生成推荐区/列表/卡片等展示模板",
    dataFrom: "产品库关联规则（同系列、配件、#99 相关产品）",
  },
};

export const CMS_APP_CATALOG = [
  { cmsAppKey: "breadcrumb", appName: "面包屑导航", defaultVariant: "inline-light" },
  { cmsAppKey: "inquiry-form", appName: "在线询价", defaultVariant: "split-form-industrial" },
  { cmsAppKey: "enterprise-profile", appName: "企业概况", defaultVariant: "trust-bar-compact" },
  { cmsAppKey: "after-sales", appName: "售后服务", defaultVariant: "policy-strip" },
  { cmsAppKey: "brand-story", appName: "品牌故事", defaultVariant: "editorial-banner" },
];

export const RELATION_RULES = [
  { rule: "same-series", label: "同系列产品" },
  { rule: "accessories", label: "配套配件" },
  { rule: "similar-spec", label: "相近规格" },
  { rule: "module-99", label: "产品库 #99 推荐位" },
];
