/** 访客行为分析：每周一出上一自然周，可回看最近 13 期。漏斗人数与路径仍读 funnel-review/data。 */

function weekLabel(date) {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function shiftDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** 最近 13 个已出自然周，最新一期在前。对照周是再往前的 7 天。 */
export const WEEKS = Array.from({ length: 13 }, (_, index) => {
  const end = shiftDays(new Date(2026, 8, 20), -7 * index);
  const start = shiftDays(end, -6);
  const baselineEnd = shiftDays(start, -1);
  const baselineStart = shiftDays(baselineEnd, -6);
  const label = `${weekLabel(start)} – ${weekLabel(end)}`;
  const baselineLabel = `${weekLabel(baselineStart)} – ${weekLabel(baselineEnd)}`;
  return {
    id: `${start.getFullYear()}-${start.getMonth() + 1}-${start.getDate()}`,
    label,
    baselineLabel,
    current: index === 0,
  };
});

/** 这些周 7 条策略都没命中，页面只显示没有任务，不再逐条写结果。 */
export const QUIET_WEEK_IDS = new Set(["2026-6-22"]);

export const PERIOD = {
  siteName: "Demo · CNC 精密加工件外贸站",
  origin: "https://www.demo-cnc-oem.com",
  label: WEEKS[0].label,
  baselineLabel: WEEKS[0].baselineLabel,
  baseline: `对照上一自然周（${WEEKS[0].baselineLabel}）`,
  schedule: "每周一 02:00 出上一自然周",
  retainedWeeks: WEEKS.length,
  lastRun: "2026-09-21 02:14",
  nextRun: "2026-09-28 02:00",
  sampleNote: "样例数，非现网",
};

/** 门户已绑定站点。运行控制只许切换，不许手填 URL。 */
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
  },
  {
    id: "site-en",
    name: "Beijing Valve Co., Ltd.",
    origin: "https://en.bj-valve.com",
    diagnosed: false,
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
 * 智能体分析页数据，按「诊断 → 任务说明 → 审批 → 执行」一条链组织。
 * 诊断是规则库写死的：指标组合命中 → 现象 + 宽泛方向；任务说明是智能体取资料后写出的具体做法。
 */

/** 本期逐条对照假设方案库。hit 的 direction 是规则写死的方向，briefKeys / adviceKeys 指向本期据此写出的产出。 */
export const RULE_CHECKS = [
  {
    key: "H-06",
    lossId: "l1",
    state: "hit",
    page: "主力型号详情页 · CNC-6061 铝支架",
    hypothesis: "这一页的第一屏没接住客户，客户看了上半屏就走了",
    evidence:
      "落地接住率 53.8% → 21.9%，落地停留均值 11s，滚动深度 P75 停在首屏附近。四渠交叉同步变差，不是单渠创意问题。",
    face: {
      data: "铝支架详情从这一页进站的人，接住率从 53.8% 掉到 21.9%，停留约 11 秒，滚动停在首屏。",
      phenomenon: "看了上半屏就走。",
      cause: "第一屏是公司介绍和品牌故事，型号、打样、询价都不在首屏。四个渠道一起变差，不是某一条广告的问题。",
      plan: "优化产品详情",
    },
    direction: "优化产品详情",
    briefKeys: ["t-detail"],
  },
  {
    key: "H-05",
    lossId: "l1",
    state: "hit",
    page: "主力型号详情页 · CNC-6061 铝支架",
    hypothesis: "页面内容和搜索意图对不上",
    evidence:
      "搜索来的人带着型号、打样、询价，页上第一屏几乎不提这些，只堆公司介绍。词和页说的不是一回事。",
    face: {
      data: "进铝支架详情的搜索带着型号、打样、询价，型号和参数排在第三屏。",
      phenomenon: "第一屏几乎不提这些，只讲公司。",
      cause: "人搜的和页上写的不是一回事。",
      plan: "优化产品详情，另做一张询价用的营销页",
    },
    direction: "优化产品详情 / 生成营销落地页",
    briefKeys: ["t-detail", "t-landing"],
  },
  {
    key: "H-04",
    lossId: "l1",
    state: "hit",
    page: "Q3 OEM 营销落地页",
    hypothesis: "落地页和广告创意对不上，或和这个渠道来的人对不上",
    evidence:
      "广告渠询价词把人送到营销页，页上仍在讲品牌和产能故事。广告渠落地接住单独破线，停留约 9 秒就走。",
    face: {
      data: "广告带来的人落在 Q3 OEM 营销页，约 9 秒就走，这一页的接住率单独往下掉。",
      phenomenon: "来询价的人停在讲品牌和产能的页上。",
      cause: "广告送来的是询价，页上没有型号、打样和询价入口。",
      plan: "生成营销落地页，并核对广告落在哪一页",
    },
    direction: "生成营销落地页 / 投放侧核对",
    briefKeys: ["t-landing"],
    adviceKeys: ["a-ads"],
  },
  {
    key: "H-01",
    lossId: "entry",
    state: "excluded",
    hypothesis: "某个渠道来的人少了（投放缩了、搜索引擎优化掉了、或外链少了）",
    evidence: "全站 UV 与上期持平，搜索、直接、外链、广告都没有单独掉量。",
  },
  {
    key: "H-14",
    lossId: "entry",
    state: "excluded",
    hypothesis: "来的人不是采购商（这些词带来的是了解知识的人，不是正在找供应商的人）",
    evidence: "本期产品意向、询价意向仍是大头，不是知识型词把人带进来。",
  },
  {
    key: "H-08",
    lossId: "l2",
    state: "excluded",
    hypothesis: "没逛到产品详情页",
    evidence: "转化交互率相对上期未破线，人不是卡在文章、列表、关于我们出不去。",
  },
  {
    key: "H-09",
    lossId: "l2",
    state: "excluded",
    hypothesis: "详情页上没有询价入口",
    evidence: "页上已有询价入口，转化交互层未破线。",
  },
  {
    key: "H-10",
    lossId: "l2",
    state: "excluded",
    hypothesis: "看完了仍写不出询盘（参数、认证、怎么报价）",
    evidence: "看进去的人里动手比例未破线。缺规格、认证是首屏没看见，归到 H-06。",
  },
  {
    key: "H-16",
    lossId: "l2",
    state: "excluded",
    hypothesis: "有询价入口，但客户不知道点了会得到什么",
    evidence: "转化交互层持平，不改按钮文案。",
  },
  {
    key: "H-12",
    lossId: "l3",
    state: "excluded",
    hypothesis: "客服越聊越劝退",
    evidence: "开聊后留下的比例未破线。",
  },
  {
    key: "H-17",
    lossId: "l3",
    state: "excluded",
    hypothesis: "客户愿意开始填，但表单要填的东西太多，填一半就走了",
    evidence: "表单开始后完成率未破线。",
  },
];

/** 漏斗各层没有具体现象时，用一句话说明这一层的人在做什么。 */
export const LAYER_NOTES = {
  entry: "全站访问人数与上周持平，搜索、直接、外链、广告都没有单独掉量。",
  l1: "",
  l2: "看进去的人里，动手的比例和上周差不多。下面几类访客值得留意，但没到规则阈值。",
  l3: "开始填表或开聊的人，大多数都留下了联系方式。",
};

/** 本周访客行为，按流失点归层。outcome：brief 已出任务说明 / watch 只观察。 */
export const BEHAVIORS = [
  {
    id: "b-hero",
    lossId: "l1",
    intent: "browse",
    title: "主力铝支架详情第一屏没接住，多数人看了上半屏就走",
    page: "CNC-6061 铝支架详情",
    stat: "落地接住率 53.8% → 21.9% · 停留约 11 秒",
    ruleKeys: ["H-06", "H-05"],
    outcome: { type: "brief", key: "t-detail" },
  },
  {
    id: "b-ads",
    lossId: "l1",
    intent: "browse",
    title: "广告带来的询价访客落在讲品牌故事的营销页，约 9 秒就走",
    page: "Q3 OEM 营销落地页",
    stat: "广告渠落地接住单独破线 · 广告搜索词还对不上人",
    ruleKeys: ["H-04"],
    outcome: { type: "brief", key: "t-landing" },
  },
  {
    id: "b-explore",
    lossId: "l2",
    intent: "explore",
    title: "了解型访客到了详情，仍很少开表单或开聊",
    page: "CNC-6061 铝支架详情",
    stat: "探索型占 31% · 页内转化交互偏低",
    ruleKeys: [],
    outcome: { type: "watch", note: "转化交互层未破线，本期不出任务" },
  },
  {
    id: "b-compare",
    lossId: "l2",
    intent: "compare",
    title: "在几个型号之间来回看，站内没有对比页帮他做决定",
    page: "铝支架相关详情组",
    stat: "比较型占 18% · 同类页来回切换",
    ruleKeys: [],
    outcome: { type: "watch", note: "规则库还没有对应假设，先观察" },
  },
  {
    id: "b-decide",
    lossId: "l2",
    intent: "decide",
    title: "确认供应商的人去了关于我们，看完资质仍有一部分没开填",
    page: "关于我们 / 铝支架详情",
    stat: "决策型占 13% · 资质页停留够，转化交互未跟上",
    ruleKeys: [],
    outcome: { type: "watch", note: "转化交互层未破线，本期不出任务" },
  },
];

/**
 * 任务说明：智能体按规则方向取资料后写出的具体做法。
 * sources.state：ok 已取到 / unauthorized 未授权 / missing 缺资料；gaps 是审批时可补的待确认项。
 */
export const BRIEFS = [
  {
    key: "t-detail",
    priority: "P0",
    direction: "优化产品详情",
    executor: "AI运营助手",
    title: "CNC-6061 铝支架详情 · 改第一屏",
    summary: "把第一屏从品牌故事改成型号、给谁用、核心参数，询价入口留在首屏",
    target: "https://www.demo-cnc-oem.com/products/cnc-6061-bracket",
    why: "落地接住率 53.8% → 21.9%，落地停留约 11 秒，滚动深度停在首屏附近。",
    ruleKeys: ["H-06", "H-05"],
    sources: [
      { name: "页面现状", state: "ok", detail: "第一屏是公司介绍和品牌故事，型号和参数排在第三屏" },
      { name: "站内行为埋点", state: "ok", detail: "滚动深度 P75 停在首屏附近，落地停留约 11 秒" },
      { name: "Google Search Console", state: "ok", detail: "进这页的主要搜索词：aluminum bracket oem、cnc 6061 quote" },
      { name: "知识库 · 公司资料", state: "ok", detail: "材质 6061、ISO9001、48 小时打样、批量 15–20 天" },
      { name: "同类详情页", state: "ok", detail: "首屏能看到型号和参数的同类详情，留资约为它的 2～3 倍" },
    ],
    requirements: [
      "标题不改；第一屏改成型号 CNC-6061、给谁用、核心参数（材质、公差、表面处理、起订、打样周期）",
      "询价入口留在首屏；公司介绍、品牌故事下移",
      "对着 aluminum bracket oem、cnc 6061 quote 来写，不空喊实力强",
      "常见问题讲清：开孔能不能改、起订多少、打样多久、表面处理有哪些",
    ],
    constraints: ["局部修改，不整页重写", "原文配图都留下，这次不换封面"],
    gaps: [
      { key: "wall", label: "壁厚", draft: "1.5–3.0mm", hint: "按同类产品估的，未核实" },
      { key: "moq", label: "起订量", draft: "50 件", hint: "按同类产品估的，未核实" },
    ],
    afterApprove: "改好的首屏会先给你看，确认后才覆盖上线。",
  },
  {
    key: "t-landing",
    priority: "P0",
    direction: "生成营销落地页",
    executor: "智能营销页智能体",
    title: "CNC OEM 询价留资页",
    summary: "按询价意图新建留资获客页，首屏对齐型号、48 小时打样和询价入口",
    target: "新建 /campaign/cnc-oem-quote",
    why: "询价访客没有专属承接页，落在讲品牌故事的营销页上，约 9 秒就走。",
    ruleKeys: ["H-04", "H-05"],
    sources: [
      { name: "页面现状", state: "ok", detail: "Q3 OEM 营销落地页首屏讲品牌和产能，没有型号和打样周期" },
      { name: "Google Search Console", state: "ok", detail: "询价类词：cnc machining quote、oem cnc quote" },
      { name: "Google Ads", state: "unauthorized", authKey: "ads", detail: "广告实际搜索词列不出来，只能按进站第一页推断" },
      { name: "知识库 · 公司资料", state: "ok", detail: "ISO9001、3–5 轴同线、48 小时打样；sales@demo-cnc-oem.com" },
      { name: "买家画像", state: "missing", detail: "知识库里没有，智能体按访客来源写了草稿" },
    ],
    requirements: [
      "页面类型：留资获客页；英语；市场美国 / 欧洲",
      "首屏必须出现型号 CNC-6061、「48 小时打样」和询价入口",
      "表单收集公司名、邮箱、图纸/规格、数量、期望交期",
      "对上的词：cnc machining quote、oem cnc quote、aluminum bracket oem",
      "横幅时机：当次访问里第 2 个停满 15 秒的产品详情页（回访按 7 天累计到第 2 个），在该页页底弹出非遮挡横幅，链到这张询价留资页。文案示例：还在看铝支架？留下图纸，48 小时给打样",
    ],
    constraints: ["卖点只从现有页面和知识库里取，没有的不编", "广告没说过的「免模 / 零起订」不写"],
    gaps: [
      { key: "buyer", label: "目标买家", draft: "欧美设备厂 / 代工厂采购，要小批量铝支架 OEM", hint: "按访客来源推断的草稿" },
      { key: "switch", label: "询价流量切到新页", draft: "", hint: "可以等草稿出来再定" },
    ],
    afterApprove: "草稿出来后会先给你看，确认后才发布。",
  },
];

/** 站外建议：智能体执行不了，只提示给人。 */
export const ADVICE = [
  {
    key: "a-ads",
    owner: "投放侧",
    title: "核对询价类广告的落地地址",
    detail:
      "广告渠有效浏览和详情页第一屏问题同向。请核对广告是否仍落在该详情；新留资页上线后，可把询价类广告切过去。智能体改不了投放设置。",
    ruleKeys: ["H-04"],
  },
];

/** 执行跟踪的阶段，stage 是下标。做到「已上线」为止，之后去子智能体看这条任务。 */
export const TRACK_STAGES = ["已批准", "生成中", "待你确认上线", "已上线"];

/** 往期批准过的任务。人工执行没有子智能体，不提供跳转。 */
export const TRACKING = [
  {
    key: "k-sample",
    title: "「CNC 打样」落地页",
    executor: "智能营销页智能体",
    from: "8月31日–9月6日诊断",
    approvedAt: "09-08",
    stage: 2,
    note: "草稿已出，等你确认发布",
    summary: "按打样询价做留资页，首屏对齐 48 小时打样和 ISO9001。草稿已出。",
    target: "新建 /campaign/cnc-sample",
    requirements: [
      "页面类型：留资获客页；英语；市场美国 / 欧洲",
      "首屏必须出现「48 小时打样」和 ISO9001",
      "发布前先给你看草稿",
    ],
  },
  {
    key: "k-quote",
    title: "「询价」落地页 v2",
    executor: "智能营销页智能体",
    from: "8月17日–23日诊断",
    approvedAt: "08-25",
    stage: 3,
    note: "09-17 已上线",
    summary: "询价落地页第二版已发布。",
    target: "/campaign/inquiry-v2",
    requirements: ["首屏对齐询价入口", "09-17 已发布"],
  },
  {
    key: "k-nav",
    title: "首页导航改版",
    executor: "人工执行",
    from: "7月诊断",
    approvedAt: "07-06",
    stage: 3,
    note: "人工改完，已上线",
  },
];
