/** 访客行为分析：每 7 天定时检测最近一个已结束窗口，可回看最近 13 期。漏斗人数与路径仍读 funnel-review/data。 */

function weekLabel(date) {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function shiftDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function weekIdOf(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function parseWeekStart(id) {
  const parts = String(id || "").split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n) || n <= 0)) return null;
  const start = new Date(parts[0], parts[1] - 1, parts[2]);
  return Number.isNaN(start.getTime()) ? null : start;
}

function weekRecord(start, current = false) {
  const end = shiftDays(start, 6);
  const baselineEnd = shiftDays(start, -1);
  const baselineStart = shiftDays(baselineEnd, -6);
  return {
    id: weekIdOf(start),
    label: `${weekLabel(start)} – ${weekLabel(end)}`,
    baselineLabel: `${weekLabel(baselineStart)} – ${weekLabel(baselineEnd)}`,
    current,
  };
}

/** 最近 13 个已结束 7 天窗口 (IS_CLOSED = 1)，最新一期在前。 */
export const WEEKS = Array.from({ length: 13 }, (_, index) => {
  const end = shiftDays(new Date(2026, 8, 20), -7 * index);
  return weekRecord(shiftDays(end, -6), index === 0);
});

export const LATEST_CLOSED_WEEK_END = shiftDays(new Date(2026, 8, 20), 0);

export function weekFromId(id) {
  const hit = WEEKS.find((item) => item.id === id);
  if (hit) return hit;
  const start = parseWeekStart(id);
  return start ? weekRecord(start) : WEEKS[0];
}

/** 这些周全站无明显可归因转化问题，仅展示本周诊断小结，不建任务。 */
export const QUIET_WEEK_IDS = new Set(["2026-6-22"]);

export const PERIOD = {
  siteName: "Demo · CNC 精密加工件外贸站",
  origin: "https://www.demo-cnc-oem.com",
  label: WEEKS[0].label,
  baselineLabel: WEEKS[0].baselineLabel,
  schedule: "每 7 天定时检测最近已结束窗口",
  retainedWeeks: WEEKS.length,
  lastRun: "2026-09-21 02:14",
  nextRun: "2026-09-28 02:00",
  sampleNote: "样例数，非现网",
};

/** 门户已绑定站点。diagnosed=false 为新开通站点，展示首次运行时间线。 */
export const SITES = [
  {
    id: "cnc",
    name: PERIOD.siteName,
    origin: PERIOD.origin,
    diagnosed: true,
  },
  {
    id: "site-cn",
    name: "北京阀门有限公司",
    origin: "https://www.bj-valve.com",
    diagnosed: false,
    connectedAt: "2026-09-19",
    firstReportAt: "2026-09-28 02:00",
  },
  {
    id: "site-en",
    name: "Beijing Valve Co., Ltd.",
    origin: "https://en.bj-valve.com",
    diagnosed: false,
    connectedAt: "2026-09-19",
    firstReportAt: "2026-09-28 02:00",
  },
];

/** 首次接入站点第一屏时间线（消除冷启动等待预期落差）。 */
export const ONBOARD_TIMELINE = [
  {
    step: "第 1 周",
    title: "攒满第一个完整的 7 天，再告诉你要改什么。",
    detail: "我们先看最近这 7 天访客从哪来、打开了哪一页、搜了什么词，再写出要你决定的任务。",
  },
  {
    step: "第 2–3 周",
    title: "你同意并上线之后，我们开始看效果。",
    detail: "智能营销页智能体或内容运营智能体做好页面，你确认上线。我们当场检查页面能不能打开，再用约定的数字看有没有变好。",
  },
  {
    step: "持续迭代",
    title: "没有效果的改法，下次不再重复建议。",
    detail: "访客少的同类页面会放在一起看。看不出变化或变差的做法会记下来，以后不再建议你做同样的修改。",
  },
];

export const AUTH_SOURCES = [
  {
    key: "site",
    name: "站内行为埋点",
    use: "漏斗人数、停留、滚动、表单 / 开聊",
    status: "ok",
    statusText: "已接入",
  },
  {
    key: "ga4",
    name: "Google Analytics 4",
    use: "渠道与落地核对",
    status: "ok",
    statusText: "已授权",
  },
  {
    key: "gsc",
    name: "Google Search Console",
    use: "自然搜索词的展示与点击，对不到具体访客",
    status: "ok",
    statusText: "已授权",
  },
  {
    key: "ads",
    name: "Google Ads",
    use: "广告实际搜索词的点击与花费，对不到具体访客",
    status: "missing",
    statusText: "未授权",
  },
];

export const SOURCE_AUTH_PAGES = {
  ads: {
    name: "Google Ads",
    title: "授权 Google Ads",
    hint: "授权后，访客搜索词会按词列出广告实际搜索词、点击、展示和花费。不对接到具体访客，也不指定落地页。",
    scopes: ["搜索词报告", "点击、展示与花费"],
    cta: "连接 Google Ads",
  },
  gsc: {
    name: "Google Search Console",
    title: "授权 Google Search Console",
    hint: "授权后列出自然搜索查询词的展示、点击和平均排名。不对接到具体访客，也不按词指定落地页。",
    scopes: ["网站查询词", "展示、点击与排名"],
    cta: "连接 Search Console",
  },
};

/** 对外仍叫「意图」：窗口访客深度四档互斥，流失是叠加标记。 */
export const DEPTH_INTENTS = [
  {
    id: "browse",
    name: "浏览型",
    meaning: "扫一眼就走",
    count: 627,
    percent: 38,
    color: "#78716c",
  },
  {
    id: "explore",
    name: "探索型",
    meaning: "在了解，还没选型",
    count: 512,
    percent: 31,
    color: "#e85d04",
  },
  {
    id: "compare",
    name: "比较型",
    meaning: "在纠结哪个适合",
    count: 297,
    percent: 18,
    color: "#1d4ed8",
  },
  {
    id: "decide",
    name: "决策型",
    meaning: "快动手了",
    count: 214,
    percent: 13,
    color: "#2f6b3a",
  },
];

export const CHURN_MARK = {
  percent: 12,
  count: 198,
  label: "带流失信号",
  hint: "流失不覆盖深度。这一周里到过决策、后来表单放弃的人，仍算决策型。",
};

/**
 * 每条是一个网站现象：一句话标题、数据表现、根本原因。
 * 根本原因要对上原话和页面现状。一个现象下可挂多条优化策略。
 * unresolved：已有未结案任务（待审批 / 执行中 / 监测中），不重复克隆新卡，直接关联原任务。
 */
export const RULE_CHECKS = [
  {
    key: "DX-01",
    lossId: "l1",
    state: "hit",
    title: "铝支架详情页留不住来询价的人",
    phenomenon: "来看型号和报价的人打开了铝支架详情页，第一屏看完就离开了。",
    layerLabel: "主卡点 · 没看进去",
    page: "主力型号详情页 · CNC-6061 铝支架",
    hypothesis: "主力详情首屏缺少型号参数与询价入口，精准搜索访客停在首屏流失",
    face: {
      data: "近 7 天有 420 人打开这页，只有 92 人继续往下看，占 21.9%。这些人平均停留 11 秒，页面大多只滚到 18%。",
      words: "他们搜索的是 aluminum bracket oem 和 cnc 6061 quote，想看型号、参数和报价。",
      pageFact: "这页第一屏是公司介绍和品牌口号，公差表在第三屏，第一屏没有询价入口。",
      cause: "他们搜索的是 aluminum bracket oem 和 cnc 6061 quote，想看型号、参数和报价。这页第一屏是公司介绍和品牌口号，公差表在第三屏，第一屏没有询价入口。",
    },
    briefKeys: ["t-detail"],
  },
  {
    key: "DX-02",
    lossId: "l1",
    state: "hit",
    title: "点了询价广告的人打开的是讲品牌的页面",
    phenomenon: "访客点的是询价广告，打开的却是一张讲品牌的页面，人来了马上离开。",
    layerLabel: "主卡点 · 没看进去",
    page: "Q3 OEM 营销落地页",
    hypothesis: "询价广告流量落在品牌宣传页，页面内容与询价来意错位",
    face: {
      data: "近 7 天广告带来 210 人，其中 179 人马上离开。留下来继续看的人只占 14.7%，平均停留 8 秒。",
      words: "他们搜索的是 cnc machining quote 和 oem cnc quote，是来询价的。",
      pageFact: "页面第一屏是工厂航拍和产能口号，没有代表型号，没有打样周期，也没有上传图纸的表单。",
      cause: "他们搜索的是 cnc machining quote 和 oem cnc quote，是来询价的。页面第一屏是工厂航拍和产能口号，没有代表型号，没有打样周期，也没有上传图纸的表单。",
    },
    briefKeys: ["t-landing"],
    adviceKeys: ["a-ads"],
  },
  {
    key: "DX-03",
    lossId: "l2",
    state: "hit",
    title: "站内搜索图纸格式和氧化膜厚度，没有结果",
    phenomenon: "访客在网站里搜索图纸格式和阳极氧化厚度，搜索结果是空的。",
    layerLabel: "次卡点 · 站内搜索无结果",
    unresolved: "pending_approval",
    page: "站内搜索 · 图纸格式与阳极氧化规格",
    hypothesis: "高频技术选型词站内搜索 100% 零结果，现有知识库材料未发成可检索内容",
    face: {
      data: "近 7 天站内一共搜索了 50 次，其中 16 次没有任何结果，占 32%。搜完就离开的人占 56%。",
      words: "没有结果的搜索集中在 custom bracket drawing dwg（9 次）和 anodizing thickness 6061（4 次）。",
      pageFact: "网站上没有这两页。知识库里有工艺规范，但还没有写成访客能搜到的文章。",
      cause: "没有结果的搜索集中在 custom bracket drawing dwg（9 次）和 anodizing thickness 6061（4 次）。网站上没有这两页。知识库里有工艺规范，但还没有写成访客能搜到的文章。",
    },
    briefKeys: ["t-article"],
  },
  {
    key: "DX-04",
    lossId: "l1",
    state: "hit",
    title: "想看打样交期的人进了产品列表",
    phenomenon: "访客想看样品多久能做出来，打开的却是产品列表，列表上没有 48 小时打样的说明。",
    layerLabel: "未结案跟进 · 不重复建卡",
    unresolved: "in_flight",
    page: "小批量打样词承接链路（48 hour sample）",
    hypothesis: "打样周期搜索访客缺少独立承接页，对应任务已在「进行中」",
    face: {
      data: "近 7 天有 64 人通过打样相关的词进来，都打开了综合产品列表。留下来继续看的人占 25%。",
      words: "他们搜索的是 48 hour sample 和 rapid cnc prototyping，想看交期和打样怎么走。",
      pageFact: "列表页只有产品缩略图。新的营销页草稿已经生成，还等你确认上线。",
      cause: "他们搜索的是 48 hour sample 和 rapid cnc prototyping，想看交期和打样怎么走。列表页只有产品缩略图，没有 48 小时打样的说明。",
    },
    trackKey: "k-sample",
  },
  {
    key: "DX-05",
    lossId: "l2",
    state: "hit",
    title: "零结果词需要按周持续供稿",
    phenomenon: "站内搜索零结果不止一篇文章能补上，需要一份按周发布的内容计划。",
    layerLabel: "次卡点 · 内容供给",
    unresolved: "pending_approval",
    page: "站内搜索 · 图纸格式与阳极氧化规格",
    hypothesis: "两个有依据的零结果词要按周写成可检索内容，而不是只发一篇",
    face: {
      data: "近 7 天站内一共搜索了 50 次，其中 16 次没有任何结果，占 32%。",
      words: "有原词的是 custom bracket drawing dwg（9 次）和 anodizing thickness 6061（4 次）。",
      pageFact: "知识库里有可接收图纸和膜厚，网站上还没有按这两个词持续发布的栏目内容。",
      cause: "有原词的是 custom bracket drawing dwg（9 次）和 anodizing thickness 6061（4 次）。知识库里有可接收图纸和膜厚，网站上还没有按这两个词持续发布的栏目内容。",
    },
    briefKeys: ["t-plan"],
  },
];

/**
 * 待审批任务说明（阶段二第 6–8 步产出）。
 * 子智能体仅两类：智能营销页智能体（生成/重做营销页）、内容运营智能体（单篇/多篇/主题计划/改产品详情）。
 * planPreview：第 7 步选定唯一直接主指标并按近期流量与固定 MDE 算出的观察计划预估。
 */
export const BRIEFS = [
  {
    key: "t-detail",
    priority: "P0",
    direction: "修改产品详情页",
    executor: "内容运营智能体",
    title: "改铝支架详情的正文",
    summary: "请内容运营智能体按大纲重写这页正文：开头写型号和规格，公司介绍放在后面。不改按钮。",
    target: "https://www.demo-cnc-oem.com/products/cnc-6061-bracket",
    why: "近 7 天 420 人从这页进来，只有 92 人看进去，接住率 21.9%，停了大约 11 秒。",
    ruleKeys: ["DX-01"],
    planPreview: {
      badge: "预计 1 周能看出结果",
      badgeTone: "processing",
      judgable: true,
      metric: "打开这页之后，继续往下看的人占多少。",
      formula: "用继续往下看的人数，除以打开这页的人数。",
      baseline: "现在是 21.9%。420 人打开这页，92 人继续往下看。",
      mde: "至少再多 5 个百分点。",
      threshold: "这个比例要升到 25.9%。",
      minSample: "至少还要有 385 人打开这页，才够判断。",
      estWeeks: "这页每天大约有 60 人，预计 1 周能看出结果。",
      sqlNote: "你点通过之后，用来比较的数字就固定下来，观察期间不再更换。",
    },
    refs: {
      site: {
        state: "ok",
        title: "CNC-6061 Aluminum Bracket",
        url: "https://www.demo-cnc-oem.com/products/cnc-6061-bracket",
        excerpt: `CNC-6061 Aluminum Bracket

20 Years of Precision Manufacturing
Trusted by Global Brands
ISO9001 Certified Factory · Dongguan

[Hero] factory aerial + company story. No model number. No RFQ.

Specifications (screen 3)
Material 6061-T6
Tolerance ±0.02 mm
Finish Anodizing / Powder coat
MOQ 50 pcs
Lead time 15–20 days`,
      },
      websearch: {
        state: "ok",
        query: "aluminum bracket oem first screen specifications",
        results: [
          {
            title: "CNC 6061 Bracket OEM | Specs & RFQ",
            url: "https://www.acme-cnc.com/products/6061-bracket",
            snippet: "Model CNC-6061 · 48-hour sample · Upload drawing. Material 6061-T6, ±0.02 mm.",
          },
          {
            title: "Aluminum Bracket Manufacturing Quote",
            url: "https://www.precisionparts.co/oem-bracket",
            snippet: "RFQ form on first screen. Inquiry conversion 2–3× pages that lead with brand story.",
          },
        ],
      },
      mcp: {
        state: "ok",
        tool: "page_metrics.get",
        fields: [
          { label: "path", value: "/products/cnc-6061-bracket" },
          { label: "window", value: "2026-09-14 – 2026-09-20" },
          { label: "visitors", value: "420" },
          { label: "continued", value: "92" },
          { label: "continue_rate", value: "21.9%" },
          { label: "avg_stay_sec", value: "11" },
          { label: "scroll_depth_p50", value: "18%" },
          { label: "top_queries", value: "aluminum bracket oem; cnc 6061 quote" },
        ],
      },
      knowledge: {
        state: "ok",
        title: "工艺与交期规范",
        excerpt: `材质：6061-T6
公差：±0.02mm
认证：ISO9001
打样周期：48 小时
批量交期：15–20 天`,
      },
    },
    requirementSections: [
      {
        label: "正文",
        mode: "全文按大纲重写该字段",
        lines: [
          "开头先写型号 CNC-6061。",
          "紧接着保留这些原句：Material 6061-T6；Tolerance ±0.02 mm；Finish Anodizing / Powder coat；MOQ 50 pcs；Lead time 15–20 days。",
          "打样周期写知识库原句：打样周期：48 小时。",
          "公司介绍和「20 Years of Precision Manufacturing」放到规格后面。",
        ],
      },
    ],
    constraints: ["不改标题，不改概述，不改按钮、页头、页脚。", "资料里没有的参数不编造。", "原有配图保留，这次不换封面。"],
    afterApprove: "改好的正文会先给你看。你确认之后，才会替换线上页面。",
  },
  {
    key: "t-landing",
    priority: "P0",
    direction: "新建营销页",
    executor: "智能营销页智能体",
    title: "新建一张产品营销页，替换现在的品牌页",
    summary: "请智能营销页智能体按入参新建一页。页面类型是产品营销，公司名称用当前站点名。只填资料里有的卖点、认证、打样周期和邮箱。",
    target: "新建页面 /campaign/cnc-oem-quote，用来替换现在的 /campaign/cnc-oem-q3。",
    why: "近 7 天广告带来 210 人，只有 31 人看进去，接住率 14.7%，大约 8 秒就走。",
    ruleKeys: ["DX-02"],
    planPreview: {
      badge: "预计 2 周能看出结果",
      badgeTone: "processing",
      judgable: true,
      metric: "打开询价页之后，继续往下看的人占多少。",
      formula: "用继续往下看的人数，除以打开这页的人数，并和现在这张品牌页比较。",
      baseline: "现在是 14.7%。210 人打开品牌页，31 人继续往下看。",
      mde: "至少再多 8 个百分点。",
      threshold: "这个比例要升到 20.1%。",
      minSample: "至少还要有 312 人打开这页，才够判断。",
      estWeeks: "这页每天大约有 30 人，预计 2 周能看出结果。",
      sqlNote: "你点通过之后，新页面和现在这张品牌页的比较方法就固定下来。",
    },
    refs: {
      site: {
        state: "ok",
        title: "Q3 OEM Capability",
        url: "https://www.demo-cnc-oem.com/campaign/cnc-oem-q3",
        excerpt: `Q3 OEM Capability

20,000 m² factory · 3–5 axis CNC
Trusted by global brands

[Hero] factory aerial. No model number. No 48-hour sample. No drawing upload.`,
      },
      websearch: {
        state: "ok",
        query: "cnc machining quote landing page inquiry form",
        results: [
          {
            title: "Get a CNC Machining Quote in 24 Hours",
            url: "https://www.protolabs.com/services/cnc-machining/",
            snippet: "First screen: part type, material, quantity, upload CAD. Quote form above the fold.",
          },
        ],
      },
      mcp: {
        state: "unauthorized",
        authKey: "ads",
        tool: "ads.search_terms.get",
        fields: [
          { label: "path", value: "/campaign/cnc-oem-q3" },
          { label: "ad_visitors", value: "210" },
          { label: "bounce", value: "179" },
          { label: "continue_rate", value: "14.7%" },
          { label: "ads_search_terms", value: "unauthorized" },
        ],
      },
      knowledge: {
        state: "ok",
        title: "公司资料",
        excerpt: `认证：ISO9001
加工：3–5 轴
打样：48 小时
邮箱：sales@demo-cnc-oem.com
买家画像：未收录`,
      },
    },
    requirementSections: [
      { label: "页面类型", lines: ["产品营销"] },
      { label: "公司名称", lines: ["Demo · CNC 精密加工件外贸站"] },
      { label: "官网地址", lines: ["https://www.demo-cnc-oem.com"] },
      { label: "主营产品/服务", lines: ["3–5 轴 CNC"] },
      { label: "核心卖点", lines: ["认证：ISO9001。加工：3–5 轴。打样：48 小时。"] },
      { label: "联系方式", lines: ["sales@demo-cnc-oem.com"] },
      { label: "产品认证", lines: ["ISO9001"] },
      { label: "生产交货周期", lines: ["打样：48 小时"] },
      { label: "语言", lines: ["English"] },
    ],
    constraints: [
      "所属行业、目标买家画像、产品规格/型号、最小起订量、竞品名称或网址、表单收集字段、目标国家/地区：这次没有原句，不填。",
      "Logo、旗主图、产品、主色调、字体不由任务说明指定。",
      "不写按钮文案，不写页面分块，不写成稿。",
    ],
    afterApprove: "草稿会先给你看。你确认之后，才会发布。",
  },
  {
    key: "t-article",
    priority: "P1",
    carryOver: "上周已经提出，你还没有决定",
    direction: "发布一篇文章",
    executor: "内容运营智能体",
    title: "写一篇图纸格式和氧化膜厚度的文章",
    summary: "请内容运营智能体新建一篇文章。标题用访客搜过的原词，概述和正文写清能收什么图纸、膜厚多少，文末链回铝支架详情。",
    target: "新建 /blog/6061-bracket-dwg-anodizing-guide",
    why: "custom bracket drawing dwg、anodizing thickness 6061 近 7 天搜了 13 次，一次结果都没有。上周这篇已经写好，还没批。",
    ruleKeys: ["DX-03"],
    planPreview: {
      badge: "预计 2 周能看出结果",
      badgeTone: "default",
      judgable: true,
      metric: "用这两个词搜索时，没有结果的次数占多少。",
      formula: "用搜出来仍然是 0 条的次数，除以用这两个词搜索的次数。",
      baseline: "现在 13 次全是 0 条结果。",
      mde: "",
      threshold: "没有结果的比例要降到 20% 及以下。",
      minSample: "这两个词还要再被搜索满 20 次，才够判断。",
      estWeeks: "这两个词每周大约被搜 13 次，预计 2 周能看出结果。",
      sqlNote: "你点通过之后，要比的词和算法就固定下来，到时间用同一套方法再算一次。",
    },
    refs: {
      site: {
        state: "ok",
        title: "CNC Tolerance Guide",
        url: "https://www.demo-cnc-oem.com/blog/tolerance-guide",
        excerpt: `CNC Tolerance Guide

General tolerances for milling and turning.
No DWG submission steps.
No anodizing thickness for 6061.`,
      },
      mcp: {
        state: "ok",
        tool: "site_search.queries.get",
        fields: [
          { label: "window", value: "2026-09-14 – 2026-09-20" },
          { label: "custom bracket drawing dwg", value: "9 searches · 0 results" },
          { label: "anodizing thickness 6061", value: "4 searches · 0 results" },
        ],
      },
      knowledge: {
        state: "ok",
        title: "工艺规范 · 图纸与阳极氧化",
        excerpt: `可接收图纸：STEP / DWG / PDF
本色阳极氧化：10–25 μm
黑色阳极氧化：10–25 μm`,
      },
    },
    requirementSections: [
      {
        label: "标题",
        lines: ["custom bracket drawing dwg 与 anodizing thickness 6061：6061 支架收什么图纸、氧化膜多厚"],
      },
      {
        label: "概述",
        lines: ["一段。必须出现原句：可接收图纸：STEP / DWG / PDF。本色阳极氧化：10–25 μm。黑色阳极氧化：10–25 μm。不写小节。"],
      },
      {
        label: "正文",
        lines: [
          "第 1 节回答能收什么图纸。必须出现：可接收图纸：STEP / DWG / PDF。",
          "第 2 节回答 6061 氧化膜多厚。必须出现：本色阳极氧化：10–25 μm；黑色阳极氧化：10–25 μm。",
          "最后一节写一句，链到 https://www.demo-cnc-oem.com/products/cnc-6061-bracket，锚文本用该页标题 CNC-6061 Aluminum Bracket。",
        ],
      },
    ],
    constraints: ["膜厚只写公司资料里的 10 到 25 微米，不要写其他标准。", "没打开内容列表，不指定栏目名。", "不写按钮，不改模板。"],
    afterApprove: "稿子会先给你看。发出去之后，我们会立刻用这两个词搜一次，确认已经能搜到。",
  },
  {
    key: "t-plan",
    priority: "P1",
    direction: "建立持续内容发布计划",
    executor: "内容运营智能体",
    title: "图纸格式与氧化膜厚度内容计划",
    summary: "请内容运营智能体按新建发布任务的入参建一份周计划。关键词用这两个搜索原词，生成后先给你确认再发布。",
    target: "新建发布任务。关键词：custom bracket drawing dwg、anodizing thickness 6061。",
    why: "近 7 天这两个词一共 13 次搜索，一次结果都没有。",
    ruleKeys: ["DX-05"],
    planPreview: {
      badge: "只给方向",
      badgeTone: "default",
      judgable: false,
      metric: "这两个词搜索时没有结果的次数占多少。",
      formula: "用没有结果的次数，除以用这两个词搜索的次数。",
      baseline: "custom bracket drawing dwg 9 次全无结果，anodizing thickness 6061 4 次全无结果。",
      mde: "",
      threshold: "只给方向",
      minSample: "只给方向",
      estWeeks: "只给方向",
      sqlNote: "你点通过之后，要比的词就固定下来。",
    },
    refs: {
      mcp: {
        state: "ok",
        tool: "site_search.queries.get",
        fields: [
          { label: "window", value: "2026-09-14 – 2026-09-20" },
          { label: "custom bracket drawing dwg", value: "9 searches · 0 results" },
          { label: "anodizing thickness 6061", value: "4 searches · 0 results" },
        ],
      },
      knowledge: {
        state: "ok",
        title: "工艺规范 · 图纸与阳极氧化",
        excerpt: `可接收图纸：STEP / DWG / PDF
本色阳极氧化：10–25 μm
黑色阳极氧化：10–25 μm`,
      },
    },
    requirementSections: [
      { label: "任务标题", lines: ["图纸格式与氧化膜厚度内容计划"] },
      { label: "任务主题", lines: ["常见问题", "知识百科"] },
      { label: "关键词", lines: ["custom bracket drawing dwg", "anodizing thickness 6061"] },
      { label: "开启配图", lines: ["关"] },
      { label: "推送频率", lines: ["每周"] },
      { label: "推送数量", lines: ["2 篇"] },
      { label: "推送开始时间", lines: ["客户批准当天"] },
      { label: "推送内容状态", lines: ["待审核（生成后先由你确认再发布）"] },
      {
        label: "任务说明（可选）",
        lines: [
          "每篇只回答一个关键词。",
          "图纸篇必须出现原句：可接收图纸：STEP / DWG / PDF。",
          "膜厚篇必须出现原句：本色阳极氧化：10–25 μm；黑色阳极氧化：10–25 μm。",
          "文末链到 https://www.demo-cnc-oem.com/products/cnc-6061-bracket，锚文本用该页标题 CNC-6061 Aluminum Bracket。",
        ],
      },
    ],
    constraints: [
      "推送应用、推送栏目、数据映射：没打开内容后台，不填，沿用新建任务的当前选项。",
      "不把每一篇正文写成可直接粘贴的成稿。",
    ],
    afterApprove: "内容计划建好后，每一篇仍会先给你看，确认之后才发布。",
  },
];

/** 站外 / 人工处理项：不属于两个子智能体代执行范围，需客户人工处理并确认。 */
export const ADVICE = [
  {
    key: "a-ads",
    owner: "需要你自己做",
    direction: "你自己修改广告",
    executor: "你自己",
    title: "把询价广告的打开地址改到新页面",
    summary: "请你在广告后台把询价广告的打开地址改到新的询价页。智能体不能登录广告账户。",
    target: "Google Ads 里询价词的落地网址。现在打开的是 /campaign/cnc-oem-q3。",
    requirementSections: [
      { label: "交给谁", lines: ["你自己。智能体不能登录广告账户。"] },
      {
        label: "改哪一个地址",
        lines: ["Google Ads 里 cnc machining quote 和 oem cnc quote 的落地网址。现在打开的是 /campaign/cnc-oem-q3。"],
      },
      {
        label: "改完后看到什么",
        lines: ["这两个词的广告打开新的询价页。等新页上线后再改。"],
      },
    ],
    constraints: ["智能体不能登录 Google Ads，这一步只能由你来做。"],
    refs: {
      site: {
        state: "ok",
        title: "Q3 OEM Capability",
        url: "https://www.demo-cnc-oem.com/campaign/cnc-oem-q3",
        excerpt: `Final URL in Google Ads (cnc machining quote / oem cnc quote):
https://www.demo-cnc-oem.com/campaign/cnc-oem-q3`,
      },
      mcp: {
        state: "ok",
        tool: "page_metrics.get",
        fields: [
          { label: "path", value: "/campaign/cnc-oem-q3" },
          { label: "ad_visitors", value: "210" },
          { label: "bounce", value: "179" },
          { label: "continue_rate", value: "14.7%" },
        ],
      },
    },
    planPreview: {
      badge: "新页面上线后由你修改",
      badgeTone: "warning",
      metric: "不单独计算一个新数字。效果看新询价页里继续往下看的人占多少。",
      formula: "新页面上线后，用那张页的访问数据来判断。",
      baseline: "现在广告打开的是品牌页，留下来继续看的人占 14.7%。",
      threshold: "广告打开的地址改成新询价页。",
      minSample: "这一步不需要再凑访客数量。",
      estWeeks: "新页面上线之后，你就可以去改。",
      sqlNote: "你标记已经改完之后，我们只记录广告地址已经换过。",
    },
    ruleKeys: ["DX-02"],
  },
];

/** 上线前不套通用工序。stage 是下标：待你同意 → 你已同意 → 进行中 → 已完成。 */
export const TRACK_STAGES = ["待你同意", "你已同意", "进行中", "已完成"];
export const APPROVED_STAGE = 1;
export const PROGRESS_STAGE = 2;
export const LAUNCH_STAGE = 3;
export const MONITOR_STAGE = 4;
export const RESULT_STAGE = 5;

/** 6 类客观结论标签（由程序按统计检验输出，模型不改判）。 */
export const VERDICTS = {
  effective: { label: "已经证明有效", color: "success" },
  trend: { label: "有变好的迹象", color: "processing" },
  flat: { label: "看不出变化", color: "default" },
  worse: { label: "变差了", color: "error" },
  mixed: { label: "同一时期还有别的改动", color: "purple" },
  thin: { label: "访客太少，还不能下结论", color: "default" },
};

/**
 * 往期已批准任务。
 * 子智能体：智能营销页智能体 / 内容运营智能体；站外或硬伤由人工处理。
 */
export const TRACKING = [
  {
    key: "k-sample",
    title: "「CNC 打样」专属营销页",
    direction: "生成营销落地页",
    executor: "智能营销页智能体",
    from: "8月31日–9月6日诊断",
    approvedAt: "09-08",
    stage: 2,
    note: "草稿已经生成。你确认已经上线之后，我们会马上检查页面能不能打开，并开始看 14 天的效果。",
    summary: "智能营销页智能体已经按「48 小时打样」新建了一页草稿。第一屏写打样流程和 ISO9001。",
    target: "/campaign/cnc-sample",
    requirements: [
      "这是一张英文页面，给欧美买家看。",
      "第一屏写清 48 小时打样怎么走，并留下上传图纸的入口。",
    ],
    readyMonitor: {
      metric: "打开打样页之后，继续往下看的人占多少",
      formula: "落地接住访客 / 落地访客",
      object: "/campaign/cnc-sample（接管列表页快样流量）",
      unit: "落地访客",
      verifiedAt: "刚刚 · 上线当场自动核验通过",
      before: { range: "09-07 – 09-20", value: 25.0, num: 32, den: 128 },
      current: { range: "待累计完整自然日（上线当天不计入）", value: 25.0, num: 0, den: 0 },
      mde: 8,
      threshold: 31.8,
      minSample: 120,
      minDays: 14,
      day: 0,
      checks: [
        { label: "生产 URL 正常打开 (HTTP 200)", ok: true },
        { label: "首屏 48h 打样模块与表单已渲染", ok: true },
        { label: "快样入口内链跳转已生效", ok: true },
      ],
      leads: {
        before: { range: "09-07 – 09-20", count: 2 },
        after: { range: "上线后累计", count: 0 },
      },
      gain: "达标时预计每周多接住约 8 名快样意向访客",
    },
  },
  {
    key: "k-quote",
    title: "「询价」落地页 v2",
    direction: "重做营销落地页",
    executor: "智能营销页智能体",
    from: "8月17日–23日诊断",
    approvedAt: "08-25",
    launchedAt: "09-17",
    stage: 4,
    summary: "询价页的第二版已经发布到网站上。",
    target: "/campaign/inquiry-v2",
    requirements: ["首屏对齐询价入口", "09-17 已发布生产环境"],
    monitor: {
      metric: "打开询价页之后，继续往下看的人占多少",
      formula: "落地接住访客 / 落地访客（已冻结前后对比 SQL）",
      object: "/campaign/inquiry-v2（替换 v1）",
      unit: "落地访客",
      verifiedAt: "09-17 16:08 上线当场核验通过",
      before: { range: "09-03 – 09-16", value: 18.6, num: 104, den: 560 },
      current: { range: "09-18 – 09-20", value: 24.2, num: 29, den: 120 },
      mde: 8,
      threshold: 22.4,
      minSample: 337,
      minDays: 14,
      day: 3,
      checks: [
        { label: "新页生产环境正常打开 (HTTP 200)", ok: true },
        { label: "原 v1 地址 301 跳转已生效", ok: true },
        { label: "首屏询价表单可正常提交", ok: true },
      ],
      leads: {
        before: { range: "09-03 – 09-16", count: 6 },
        after: { range: "09-18 – 09-20", count: 4 },
      },
      gain: "按当前走势，达标时每周约多接住 16 名询价访客",
    },
  },
  {
    key: "k-about",
    title: "关于我们 · 补 ISO 认证与检测图",
    direction: "修改已有内容页",
    executor: "内容运营智能体",
    from: "8月10日–16日诊断",
    approvedAt: "08-18",
    launchedAt: "08-20",
    stage: 5,
    summary: "关于我们页面已经补上 ISO9001 证书，以及三坐标检测设备的实拍图。",
    target: "/about",
    requirements: ["证书图置于资质首屏", "补充检测设备说明"],
    result: {
      verdict: "flat",
      metric: "在关于我们这页看完主要内容的人占多少",
      formula: "合格浏览访客 / 页面访客（冻结 SQL 同口径重跑）",
      unit: "页面访客",
      window: { range: "08-21 – 09-03", days: 14 },
      before: { range: "08-06 – 08-19", value: 56.2, num: 292, den: 520 },
      after: { range: "08-21 – 09-03", value: 57.5, num: 299, den: 520 },
      p: "0.33",
      overlap: "",
      leads: { before: 9, after: 10 },
      gain: "",
      attribution:
        "上线前后，在这页看完主要内容的人只从 56.2% 变成 57.5%，看不出明确提升。访客在这页本来就停留得够久。真正的问题是页面底部没有入口，让人回到具体型号去询价。只补证书图，没有让人走到下一步。",
    },
  },
  {
    key: "k-nav",
    title: "首页顶栏导航改版",
    direction: "人工处理",
    executor: "人工处理",
    from: "7月诊断",
    approvedAt: "07-06",
    launchedAt: "07-10",
    stage: 5,
    result: {
      verdict: "effective",
      metric: "从首页进入产品详情的人占多少",
      formula: "进入产品详情访客 / 首页访客（冻结 SQL 同口径重跑）",
      unit: "首页访客",
      window: { range: "07-11 – 07-17", days: 7 },
      before: { range: "07-03 – 07-09", value: 14.2, num: 1136, den: 8000 },
      after: { range: "07-11 – 07-17", value: 17.9, num: 1450, den: 8100 },
      p: "< 0.001",
      overlap: "",
      leads: { before: 21, after: 29 },
      gain: "每周约多送 300 名访客进入核心产品详情",
      attribution:
        "首页顶栏直接列出铝支架、钛合金支架这些主要型号之后，从首页进入产品详情的人从 14.2% 升到 17.9%。这段时间首页没有其他改动。",
    },
  },
];

/** 分析智能体建议过的事。week 空着表示落在当前选中的 7 天窗口。同一条建议只记一次，状态随执行更新。 */
export const SUGGESTIONS = [
  {
    key: "t-detail",
    kind: "brief",
    week: "",
    title: "铝支架详情页留不住来询价的人",
    direction: "修改产品详情页",
    text: "请内容运营智能体按大纲重写铝支架详情的正文，开头写型号和规格。不改按钮。",
  },
  {
    key: "t-landing",
    kind: "brief",
    week: "",
    title: "点了询价广告的人打开的是讲品牌的页面",
    direction: "新建营销页",
    text: "请智能营销页智能体新建一张询价页，替换现在这张品牌页。",
  },
  {
    key: "a-ads",
    kind: "advice",
    week: "",
    title: "点了询价广告的人打开的是讲品牌的页面",
    direction: "你自己修改广告",
    text: "请你在广告后台把询价广告的打开地址改到新的询价页。",
  },
  {
    key: "t-article",
    kind: "brief",
    week: "9月7日 – 9月13日",
    title: "站内搜索图纸格式和氧化膜厚度，没有结果",
    direction: "发布一篇文章",
    text: "请内容运营智能体用搜不到结果的两个词写一篇文章，并链回铝支架详情。",
  },
  {
    key: "k-sample",
    kind: "track",
    week: "8月31日 – 9月6日",
    title: "快样需求没有承接页",
    direction: "生成营销落地页",
    text: "针对 48 hour sample 快样询价词新建营销页，首屏对齐 48 小时打样流程与 ISO9001",
  },
  {
    key: "k-quote",
    kind: "track",
    week: "8月17日 – 8月23日",
    title: "询价页接不住",
    direction: "重做营销落地页",
    text: "询价落地页改第二版，首屏对齐询价入口",
  },
  {
    key: "k-about",
    kind: "track",
    week: "8月10日 – 8月16日",
    title: "关于我们看完资质不动手",
    direction: "修改已有内容页",
    text: "关于我们页补上 ISO9001 证书和检测设备图",
  },
  {
    key: "k-nav",
    kind: "track",
    week: "7月6日 – 7月12日",
    title: "首页进不到产品详情",
    direction: "人工处理",
    text: "首页顶栏直接展开铝支架、钛合金支架等主力型号入口",
  },
];

/** 站点留资：表单提交 + 客服留下联系方式。marks 是任务上线所在周。 */
export const LEADS = {
  form: 12,
  chat: 22,
  beforeAvg: 27,
  weeks: [
    { label: "6/29", value: 28 },
    { label: "7/6", value: 30 },
    { label: "7/13", value: 33 },
    { label: "7/20", value: 35 },
    { label: "7/27", value: 34 },
    { label: "8/3", value: 38 },
    { label: "8/10", value: 37 },
    { label: "8/17", value: 40 },
    { label: "8/24", value: 42 },
    { label: "8/31", value: 44 },
    { label: "9/7", value: 45 },
    { label: "9/14", value: 34 },
  ],
  marks: [
    { week: "7/6", title: "首页顶栏导航改版 · 07-10 上线" },
    { week: "8/17", title: "关于我们 · 补 ISO 认证 · 08-20 上线" },
    { week: "9/14", title: "「询价」落地页 v2 · 09-17 上线" },
  ],
};

/** 月度价值报告数据（只摆三件事：做完了什么、留资周趋势与上线标记、下月准备做的事）。 */
export const MONTHLY_REPORT = {
  monthLabel: "2026 年 9 月（截至 9 月 20 日）",
  done: [
    { tag: "智能营销页智能体", text: "询价页第二版已经上线。上线检查通过了，正在看 14 天的效果。" },
    { tag: "智能营销页智能体", text: "打样营销页的草稿已经生成，等你确认上线。" },
    { tag: "内容运营智能体", text: "关于我们页面补证书这件事已经看完 14 天。看不出变化，以后不再建议同样的改法。" },
  ],
  nextMonth: [
    "询价页第二版看到 10 月初，再判断有没有变好。",
    "等你决定铝支架详情的正文要不要改，以及新的询价页要不要做。",
    "把访客搜过但没有结果的图纸格式和氧化膜厚度，写成网站上能搜到的文章。",
  ],
};
