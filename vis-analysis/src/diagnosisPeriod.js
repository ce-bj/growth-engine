/** 访客行为分析：每 7 天定时检测最近一个已结束窗口，可回看最近 13 期。漏斗人数与路径仍读 funnel-review/data。 */

function weekLabel(date) {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function shiftDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** 最近 13 个已结束 7 天窗口 (IS_CLOSED = 1)，最新一期在前。 */
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
    title: "攒满首个完整 7 天窗口，生成诊断与待批任务",
    detail: "锁定最近已结束的 7 天访问数据，核对访客路径、搜索词与页面现状，输出可执行任务说明与预计判定周数。",
  },
  {
    step: "第 2–3 周",
    title: "任务上线即刻核验生效，跑满观察期出首批结论",
    detail: "审批通过后由智能营销页智能体或内容运营智能体上线变更，当场确认生效，按冻结主指标做单侧 95% 检验。",
  },
  {
    step: "持续迭代",
    title: "小流量同类页合批评估，无效改法自动防重",
    detail: "流量偏小的同类详情页按同一改法合并样本评估；未见变化或变差的做法自动记入本站防重，后续不再重复建议。",
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
    title: "铝支架详情没接住询价",
    phenomenon: "找型号和报价的人进了铝支架详情，第一屏看完就走",
    layerLabel: "主卡点 · 没看进去",
    page: "主力型号详情页 · CNC-6061 铝支架",
    hypothesis: "主力详情首屏缺少型号参数与询价入口，精准搜索访客停在首屏流失",
    face: {
      data: "近 7 天 420 人从 CNC-6061 铝支架详情进来，只有 92 人看进去，接住率 21.9%，平均停 11 秒，滚动停在 18%。",
      words: "搜的是 aluminum bracket oem、cnc 6061 quote，来找型号参数和报价。",
      pageFact: "第一屏是公司介绍和品牌口号，6061 材质公差表在第三屏，首屏没有询价入口。",
      cause: "搜的是 aluminum bracket oem、cnc 6061 quote，要型号参数和报价。第一屏是公司介绍和品牌口号，公差表在第三屏，没有询价入口。",
    },
    briefKeys: ["t-detail"],
  },
  {
    key: "DX-02",
    lossId: "l1",
    state: "hit",
    title: "询价流量落在品牌页",
    phenomenon: "询价广告落在讲品牌的页上，人来了马上走",
    layerLabel: "主卡点 · 没看进去",
    page: "Q3 OEM 营销落地页",
    hypothesis: "询价广告流量落在品牌宣传页，页面内容与询价来意错位",
    face: {
      data: "广告带来 210 人落在这张营销页，179 人马上走了，接住率 14.7%，平均停 8 秒。",
      words: "词是 cnc machining quote、oem cnc quote，来询价。",
      pageFact: "第一屏是工厂航拍和产能口号，没有代表型号、打样周期，也没有传图纸的表单。",
      cause: "词是 cnc machining quote、oem cnc quote，来询价。第一屏是工厂航拍和产能口号，没有型号、打样周期，也没有传图纸的表单。",
    },
    briefKeys: ["t-landing"],
    adviceKeys: ["a-ads"],
  },
  {
    key: "DX-03",
    lossId: "l2",
    state: "hit",
    title: "站内搜不到图纸和膜厚",
    phenomenon: "站里搜图纸格式和阳极氧化厚度，一次结果都没有",
    layerLabel: "次卡点 · 站内搜索无结果",
    unresolved: "pending_approval",
    page: "站内搜索 · 图纸格式与阳极氧化规格",
    hypothesis: "高频技术选型词站内搜索 100% 零结果，现有知识库材料未发成可检索内容",
    face: {
      data: "近 7 天站内搜了 50 次，16 次是 0 结果，零结果率 32%，搜完当场离开的占 56%。",
      words: "0 结果集中在 custom bracket drawing dwg（9 次）、anodizing thickness 6061（4 次）。",
      pageFact: "站里没有图纸格式和表面处理厚度这两页。知识库里的工艺规范是有的，还没发成能搜到的正文。",
      cause: "搜的是 custom bracket drawing dwg（9 次）、anodizing thickness 6061（4 次）。站里没有这两页，知识库里的工艺规范还没发成能搜到的正文。",
    },
    briefKeys: ["t-article"],
  },
  {
    key: "DX-04",
    lossId: "l1",
    state: "hit",
    title: "快样需求没有承接页",
    phenomenon: "搜快样交期的人落在产品列表，页上没有 48 小时打样",
    layerLabel: "未结案跟进 · 不重复建卡",
    unresolved: "in_flight",
    page: "小批量打样词承接链路（48 hour sample）",
    hypothesis: "打样周期搜索访客缺少独立承接页，对应任务已在「待确认上线」",
    face: {
      data: "近 7 天打样相关词进来 64 人，落在综合产品列表，接住率 25%。",
      words: "搜的是 48 hour sample、rapid cnc prototyping，看交期和快样怎么走。",
      pageFact: "列表页只有产品缩略图，没有 48 小时快样说明。新营销页草稿已经生成。",
      cause: "搜的是 48 hour sample、rapid cnc prototyping，看交期和快样怎么走。列表页只有产品缩略图，没有 48 小时快样说明。",
    },
    trackKey: "k-sample",
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
    direction: "修改已有产品详情",
    executor: "内容运营智能体",
    title: "CNC-6061 铝支架详情 · 改第一屏",
    summary: "把第一屏从公司介绍改成 CNC-6061、给谁用、核心参数，询价入口留在首屏",
    target: "https://www.demo-cnc-oem.com/products/cnc-6061-bracket",
    why: "近 7 天 420 人从这页进来，只有 92 人看进去，接住率 21.9%，停了大约 11 秒。",
    ruleKeys: ["DX-01"],
    planPreview: {
      badge: "预计 1 周出结论",
      badgeTone: "processing",
      judgable: true,
      metric: "这页的落地接住率",
      formula: "看进去的人 / 从这页进来的人",
      baseline: "21.9%，92 人看进去，420 人从这页进来",
      mde: "再多 5 个百分点",
      threshold: "升到 25.9%",
      minSample: "385 个从这页进来的人",
      estWeeks: "按每天约 60 人，大约 1 周",
      sqlNote: "点通过后这条对比就冻住，监测期间不换指标",
    },
    sources: [
      { name: "页面现状", state: "ok", detail: "第一屏是公司介绍和品牌故事，型号和参数排在第三屏，首屏没有询价入口" },
      { name: "站内行为", state: "ok", detail: "近 7 天 420 人从这页进来，92 人看进去，平均停 11 秒，滚动停在 18%" },
      { name: "Google Search Console", state: "ok", detail: "进这页的主要搜索词：aluminum bracket oem、cnc 6061 quote" },
      { name: "知识库 · 公司资料", state: "ok", detail: "材质 6061-T6、公差 ±0.02mm、ISO9001、48 小时打样、批量 15–20 天" },
      { name: "同类详情页", state: "ok", detail: "首屏能看到型号和参数的同类详情，留资约为它的 2～3 倍" },
    ],
    requirements: [
      "标题不改；第一屏改成型号 CNC-6061、给谁用、核心参数（材质、公差、表面处理、起订、打样周期）",
      "询价入口留在首屏；公司介绍、品牌故事下移",
      "对着 aluminum bracket oem、cnc 6061 quote 来写，不空喊实力强",
      "常见问题讲清：开孔能不能改、起订多少、打样多久、表面处理有哪些",
    ],
    constraints: ["局部修改，不整页重写", "原文配图都留下，这次不换封面", "知识库里没有的参数不编"],
    afterApprove: "改好的首屏会先给你看，确认后才覆盖上线。",
  },
  {
    key: "t-landing",
    priority: "P0",
    direction: "生成营销落地页",
    executor: "智能营销页智能体",
    title: "CNC OEM 询价留资页",
    summary: "按询价意图新建留资获客页，首屏对齐型号、48 小时打样和询价入口",
    target: "新建 /campaign/cnc-oem-quote，接管现在的 /campaign/cnc-oem-q3",
    why: "近 7 天广告带来 210 人，只有 31 人看进去，接住率 14.7%，大约 8 秒就走。",
    ruleKeys: ["DX-02"],
    planPreview: {
      badge: "预计 2 周出结论",
      badgeTone: "processing",
      judgable: true,
      metric: "询价页的落地接住率",
      formula: "看进去的人 / 落到这页的人，和现在这张品牌页比",
      baseline: "14.7%，31 人看进去，210 人落地",
      mde: "再多 8 个百分点",
      threshold: "升到 20.1%",
      minSample: "312 个落地的人",
      estWeeks: "按每天约 30 人，大约 2 周",
      sqlNote: "点通过后，新页和现在这张品牌页怎么比就冻住",
    },
    sources: [
      { name: "页面现状", state: "ok", detail: "Q3 OEM 营销页首屏讲品牌和产能，没有型号、打样周期，也没有传图纸的表单" },
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
    afterApprove: "草稿出来后会先给你看，确认后才发布。",
  },
  {
    key: "t-article",
    priority: "P1",
    carryOver: "仍未解除 · 上周待批",
    direction: "发布单篇内容",
    executor: "内容运营智能体",
    title: "写一篇：6061 铝支架图纸格式和阳极氧化厚度",
    summary: "用站里搜不到的两个原词写一篇，讲清能收什么图纸、膜厚多少，文末链回铝支架详情",
    target: "新建 /blog/6061-bracket-dwg-anodizing-guide",
    why: "custom bracket drawing dwg、anodizing thickness 6061 近 7 天搜了 13 次，一次结果都没有。上周这篇已经写好，还没批。",
    ruleKeys: ["DX-03"],
    planPreview: {
      badge: "预计 2 周出结论",
      badgeTone: "default",
      judgable: true,
      metric: "这两个词的站内 0 结果率",
      formula: "搜出来还是 0 条的次数 / 用这两个词搜的次数",
      baseline: "13 次全是 0 结果",
      mde: "",
      threshold: "降到 20% 及以下",
      minSample: "再用这两个词搜满 20 次",
      estWeeks: "按每周约 13 次，大约 2 周",
      sqlNote: "点通过后，词和算法冻住，到点用同一条重算",
    },
    sources: [
      { name: "站内搜索", state: "ok", detail: "custom bracket drawing dwg 搜了 9 次都是 0 条；anodizing thickness 6061 搜了 4 次都是 0 条" },
      { name: "页面现状", state: "ok", detail: "站里现有的公差指南没写 DWG 怎么交、阳极氧化膜厚是多少" },
      { name: "知识库 · 工艺文件", state: "ok", detail: "能收 STEP / DWG / PDF；本色和黑色阳极氧化，常规膜厚 10–25μm" },
    ],
    requirements: [
      "标题和二级标题直接用 custom bracket drawing dwg、anodizing thickness 6061，别换成中文概括",
      "正文写清能收哪些图纸、6061 阳极氧化膜厚多少、公差怎么配",
      "文末链到 CNC-6061 铝支架详情，并留一个传图纸询价的入口",
    ],
    constraints: ["膜厚只写知识库里的 10–25μm，别的标准不写"],
    afterApprove: "稿子会先给你看，发出去之后当场用这两个词搜一次，确认已经有结果。",
  },
];

/** 站外 / 人工处理项：不属于两个子智能体代执行范围，需客户人工处理并确认。 */
export const ADVICE = [
  {
    key: "a-ads",
    owner: "投放侧人工处理",
    title: "核对并切换询价类广告落地地址",
    detail:
      "当前询价广告仍投向品牌向的 /campaign/cnc-oem-q3（接住率 14.7%）。智能体无法直接修改 Google Ads 投放后台；新询价营销页上线后，请人工将询价词广告切至新地址。",
    ruleKeys: ["DX-02"],
  },
];

/** 执行跟踪六步。stage 是下标；真实生产上线后当场执行生效确认，再跑满观察期出结论。 */
export const TRACK_STAGES = ["已批准", "生成中", "待确认上线", "已上线", "监测中", "有结论"];
export const MONITOR_STAGE = 4;
export const RESULT_STAGE = 5;

/** 6 类客观结论标签（由程序按统计检验输出，模型不改判）。 */
export const VERDICTS = {
  effective: { label: "已证实有效", color: "success" },
  trend: { label: "有提升迹象", color: "processing" },
  flat: { label: "未见变化", color: "default" },
  worse: { label: "变差了", color: "error" },
  mixed: { label: "与其他改动叠加", color: "purple" },
  thin: { label: "流量不足", color: "default" },
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
    note: "草稿已生成，确认发布上线后将即刻核验生效并启动 14 天监测",
    summary: "针对 48 hour sample 快样询价词新建营销页，首屏对齐 48 小时打样流程与 ISO9001。",
    target: "/campaign/cnc-sample",
    requirements: [
      "页面类型：英文留资获客页；市场欧美",
      "首屏包含「48 小时打样」流程与图纸上传入口",
    ],
    readyMonitor: {
      metric: "快样承接页落地接住率",
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
    summary: "询价落地页第二版已发布上线。",
    target: "/campaign/inquiry-v2",
    requirements: ["首屏对齐询价入口", "09-17 已发布生产环境"],
    monitor: {
      metric: "询价页落地接住率",
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
    summary: "关于我们页补齐 ISO9001 证书与三坐标检测设备实拍图。",
    target: "/about",
    requirements: ["证书图置于资质首屏", "补充检测设备说明"],
    result: {
      verdict: "flat",
      metric: "关于我们合格浏览率",
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
        "上线前后合格浏览率仅 +1.3pp（p = 0.33，未达显著）。细分看访客在关于我们页原本停留已充足，卡点在于页底缺少返回具体型号报价的承接入口，单纯增补证书图未能拉动下一步。",
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
      metric: "首页进入产品详情率",
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
        "顶栏直接展开铝支架、钛合金支架等主力型号入口后，首页进详情率提升 +3.7pp（p < 0.001），同期首页无其他上线改动；实验档案已后台落库供跨站策略聚合。",
    },
  },
];

/** 分析智能体建议过的事。week 空着表示落在当前选中的 7 天窗口。同一条建议只记一次，状态随执行更新。 */
export const SUGGESTIONS = [
  {
    key: "t-detail",
    kind: "brief",
    week: "",
    title: "铝支架详情没接住询价",
    direction: "修改已有产品详情",
    text: "把第一屏从公司介绍改成 CNC-6061、给谁用、核心参数，询价入口留在首屏",
  },
  {
    key: "t-landing",
    kind: "brief",
    week: "",
    title: "询价流量落在品牌页",
    direction: "生成营销落地页",
    text: "按询价意图新建留资获客页，首屏对齐型号、48 小时打样和询价入口",
  },
  {
    key: "a-ads",
    kind: "advice",
    week: "",
    title: "询价流量落在品牌页",
    direction: "人工处理",
    text: "核对并切换询价类广告落地地址",
  },
  {
    key: "t-article",
    kind: "brief",
    week: "9月7日 – 9月13日",
    title: "站内搜不到图纸和膜厚",
    direction: "发布单篇内容",
    text: "用站里搜不到的两个原词写一篇，讲清能收什么图纸、膜厚多少，文末链回铝支架详情",
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
    { tag: "智能营销页智能体", text: "改版并上线「询价」落地页 v2，当场生效核验通过，正在 14 天观察期" },
    { tag: "智能营销页智能体", text: "生成「CNC 打样」专属营销页草稿，待确认发布上线" },
    { tag: "内容运营智能体", text: "完成「关于我们 · 补 ISO 认证」14 天结案评估，无效改法已自动记入本站防重" },
  ],
  nextMonth: [
    "跟进「询价」落地页 v2 观察期满结案（预计 10 月初产出显著性结论）",
    "推进主力 CNC-6061 铝支架详情首屏重排与新建 OEM 询价页审批上线",
    "围绕站内高频 0 结果词（DWG 图纸规范、6061 阳极氧化厚度）补齐技术承接内容",
  ],
};
