/** 工业机器人详情页示例草稿 — 用于模板预览与开发联调 */
export const SAMPLE_INDUSTRIAL_ROBOT_DRAFT = {
  version: "1",
  draftId: "sample-industrial-robot-v1",
  templateId: "industrial-robot-v1",
  industryName: "工业机器人",
  productCategory: "六轴工业机器人",
  slots: {
    "layerA.title": {
      type: "title_selling_points",
      label: "产品标题与核心卖点",
      value: {
        headline: "HR6-900 协作型六轴工业机器人",
        sellingPoints: ["负载 6kg · 臂展 900mm", "重复定位精度 ±0.02mm", "IP54 工业防护 · 拖拽示教"],
      },
    },
    "layerA.overview": {
      type: "overview",
      label: "产品概述",
      value:
        "HR6-900 面向 3C 装配、精密检测与小批量柔性产线，采用一体化关节模组与自研运动控制算法，支持拖拽示教与图形化编程。机身紧凑，可与人工协同作业，显著缩短产线换型与调试周期。",
    },
    "layerA.media": {
      type: "image_meta",
      label: "产品图片/视频",
      value: {
        caption: "整机正视、关节细节、示教器界面与产线应用实拍",
        images: [
          { alt: "HR6-900 整机正视", role: "hero" },
          { alt: "第六轴法兰与末端接口", role: "detail" },
          { alt: "拖拽示教操作界面", role: "ui" },
        ],
      },
    },
    "layerB.sections[specs]": {
      type: "spec_table",
      label: "产品规格参数表",
      value: {
        headers: ["项目", "HR6-900", "备注"],
        rows: [
          ["负载能力", "6 kg", "额定/最大"],
          ["臂展半径", "900 mm", "基座旋转中心至法兰"],
          ["重复定位精度", "±0.02 mm", "额定负载下"],
          ["本体重量", "28 kg", "含线缆"],
          ["轴数", "6", "旋转关节"],
          ["防护等级", "IP54", "整机"],
          ["额定功率", "1.2 kW", "典型工况"],
          ["控制柜", "HR-C01", "可选紧凑款"],
        ],
      },
    },
    "layerB.sections[features]": {
      type: "text",
      label: "产品功能/性能介绍",
      value:
        "- **高刚性关节**：一体化谐波减速器，长寿命低背隙\n- **柔性协作**：碰撞检测与力控模式，人机共线更安全\n- **快速部署**：拖拽示教 + 积木式流程，30 分钟完成典型点位\n- **开放生态**：支持 Ethernet/IP、Modbus TCP 与主流 PLC 对接",
    },
    "layerB.sections[technology]": {
      type: "text",
      label: "技术原理/控制系统",
      value:
        "采用「关节伺服 + 实时轨迹规划」架构：控制器以 1ms 周期插补六轴轨迹，内置 S 曲线加减速与奇异点规避。末端可挂载焊枪、夹爪或视觉模块，通过标准法兰与 IO 映射接入产线。",
    },
    "layerB.sections[scenarios]": {
      type: "scenario_cards",
      label: "应用场景/使用案例",
      value: [
        { title: "3C 精密装配", desc: "螺丝锁付、插拔、贴标，节拍稳定" },
        { title: "机器视觉检测", desc: "配合 2D/3D 相机完成外观与尺寸复检" },
        { title: "小批量焊接", desc: "点焊/弧焊工位，换型仅需重示教关键路径" },
        { title: "实验室自动化", desc: "样品搬运、分装，占地小易集成" },
      ],
    },
    "layerB.sections[compatibility]": {
      type: "spec_table",
      label: "兼容性/适配信息",
      value: {
        headers: ["类别", "支持范围"],
        rows: [
          ["末端法兰", "ISO 9409-1-50-4-M6"],
          ["通信协议", "Ethernet/IP · Modbus TCP · Profinet（选配）"],
          ["示教器", "HR-TP7 无线示教器"],
          ["配套夹爪", "平行夹爪 / 真空吸盘（推荐型号见附件）"],
        ],
      },
    },
    "layerB.sections[certifications]": {
      type: "bullet_list",
      label: "质量认证/检测报告",
      value: [
        "CE 机械指令 2006/42/EC",
        "ISO 10218-1:2011 工业机器人安全",
        "CR 国家机器人产品认证（申请中需人工核对）",
        "第三方 MTBF 可靠性测试报告（可向销售索取）",
      ],
    },
    "layerB.sections[safety]": {
      type: "bullet_list",
      label: "安全注意事项",
      value: [
        "协作模式须完成风险评估并设置限速/限力",
        "维护前切断主电源并执行上锁挂牌（LOTO）",
        "不可在超出额定负载与臂展条件下长期运行",
        "围栏联锁与急停回路须符合当地电气安全规范",
      ],
    },
    "layerB.sections[installation]": {
      type: "step_list",
      label: "安装/使用指南",
      value: [
        "确认地基平整，按图纸固定底座螺栓（M12×4）",
        "连接控制柜动力与通信，核对相序与接地电阻",
        "上电自检，更新关节零点（首次安装必做）",
        "拖拽示教关键点位，导出程序并做空载试运行",
        "联调上位机/PLC 信号，现场培训操作人员",
      ],
    },
    "layerB.sections[maintenance]": {
      type: "step_list",
      label: "维护保养指南",
      value: [
        "每 500 小时检查关节异响与紧固件扭矩",
        "每 2000 小时更换减速器润滑脂（按保养手册）",
        "每月清洁散热风道与示教器屏幕",
        "易损件：密封圈、风扇滤芯 — 建议常备 1 套",
      ],
    },
    "layerB.sections[packaging]": {
      type: "text",
      label: "包装与物流信息",
      value: "机器人本体木箱 + 控制柜纸箱分运；国内干线 3～5 个工作日，含出厂检测报告与合格证。海外订单支持海运/空运，交货周期以合同为准。",
    },
    "layerB.sections[comparison]": {
      type: "comparison_table",
      label: "对比优势/竞品分析",
      value: {
        headers: ["对比项", "HR6-900", "行业常规 6kg 级"],
        rows: [
          ["重复定位精度", "±0.02 mm", "±0.03～0.05 mm"],
          ["部署时间", "≤0.5 天", "1～2 天"],
          ["协作安全", "标配力控", "选配/外置"],
          ["本地化服务", "全国 48h 到场", "依渠道而定"],
        ],
      },
    },
    "layerB.sections[faq]": {
      type: "faq_list",
      label: "常见问题 FAQ",
      value: [
        { q: "是否支持与原产线 PLC 通信？", a: "支持 Ethernet/IP、Modbus TCP，可提供示例程序块。" },
        { q: "协作模式是否需要围栏？", a: "须按 ISO 10218 与本地法规做风险评估后确定。" },
        { q: "备件供货周期多久？", a: "常规易损件 7 个工作日内发货。" },
      ],
    },
    "layerB.sections[documents]": {
      type: "doc_links",
      label: "技术文档下载",
      value: [
        { name: "HR6-900 产品手册 PDF", size: "4.2 MB" },
        { name: "安装尺寸图 CAD", size: "1.8 MB" },
        { name: "电气接口接线图", size: "0.6 MB" },
      ],
    },
    "layerB.sections[changelog]": {
      type: "changelog",
      label: "产品迭代/更新日志",
      value: [
        { version: "v2.1", date: "2026-03", note: "控制器固件优化轨迹平滑，提升 8% 节拍" },
        { version: "v2.0", date: "2025-11", note: "新增 Profinet 通信选配" },
      ],
    },
  },
  /** C 层：AI 设计模板 + CMS 数据源 */
  layerC: {
    apps: [
      {
        appId: "cms.breadcrumb",
        appName: "面包屑导航",
        cmsAppKey: "breadcrumb",
        templateVariant: "inline-light",
        placement: "header",
        design: {
          separator: "/",
          emphasis: "current",
          density: "compact",
        },
        dataBinding: { source: "cms", cmsAppKey: "breadcrumb" },
        cmsData: {
          items: ["首页", "产品中心", "工业机器人", "HR6-900"],
        },
      },
      {
        appId: "cms.inquiry-form",
        appName: "在线询价",
        cmsAppKey: "inquiry-form",
        templateVariant: "split-form-industrial",
        placement: "footer-cta",
        design: {
          title: "获取报价与集成方案",
          subtitle: "留下负载、臂展与应用场景，24 小时内工程师回电",
          layout: "split",
          primaryColor: "#0369a1",
          showProductPrefill: true,
        },
        dataBinding: { source: "cms", cmsAppKey: "inquiry-form" },
        cmsData: {
          fields: [
            { key: "name", label: "您的姓名", required: true },
            { key: "phone", label: "联系电话", required: true },
            { key: "company", label: "公司名称", required: false },
            { key: "message", label: "需求描述", type: "textarea", placeholder: "负载、臂展、应用场景、交期" },
          ],
          submitLabel: "提交询价",
        },
      },
      {
        appId: "cms.enterprise-profile",
        appName: "企业概况",
        cmsAppKey: "enterprise-profile",
        templateVariant: "trust-bar-compact",
        placement: "pre-footer",
        design: {
          headline: "关于制造商",
          layout: "stats-inline",
          showLogo: true,
        },
        dataBinding: { source: "cms", cmsAppKey: "enterprise-profile" },
        cmsData: {
          companyName: "华睿精工科技有限公司",
          slogan: "专注工业机器人与智能产线集成",
          founded: "2008",
          employees: "1200+",
          sites: "华东 / 华南 4 个制造与服务中心",
          certifications: ["ISO 9001", "国家高新技术企业"],
        },
      },
    ],
  },
  /** D 层：AI 设计推荐区模板 + 产品库关联数据 */
  layerD: {
    blocks: [
      {
        blockId: "related-products",
        templateVariant: "card-grid-3col",
        placement: "post-content",
        design: {
          title: "同系列与配套推荐",
          subtitle: "基于产品库关联规则自动展示",
          columns: 3,
          cardStyle: "elevated",
          showTag: true,
          showThumb: true,
        },
        dataBinding: { source: "product-relation", rule: "same-series", limit: 3 },
        items: [
          { productId: "p-hr10", name: "HR10-1300", tag: "10kg · 长臂展", thumb: null },
          { productId: "p-hr3", name: "HR3-600", tag: "3kg · 紧凑型", thumb: null },
          { productId: "p-tp7", name: "HR-TP7 示教器", tag: "配套配件", thumb: null },
        ],
      },
    ],
  },
};
