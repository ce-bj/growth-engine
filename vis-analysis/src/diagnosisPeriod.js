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

export const PHENOMENA = [
  {
    id: "ph-hero",
    intent: "browse",
    loss: "流失点 1",
    title: "主力铝支架详情第一屏没接住，多数人看了上半屏就走",
    page: "CNC-6061 铝支架详情",
    stat: "落地接住率 53.8% → 21.9% · 停留约 11 秒",
    causeKey: "B-01",
  },
  {
    id: "ph-ads",
    intent: "browse",
    loss: "流失点 1",
    title: "广告来的人也停在同一页首屏，不像单渠创意事故",
    page: "Q3 OEM 营销落地页 / 铝支架详情",
    stat: "广告渠有效浏览同步变差 · Ads 词还对不上人",
    causeKey: "B-03",
  },
  {
    id: "ph-explore",
    intent: "explore",
    loss: "流失点 2",
    title: "了解的人到了详情，仍很少开表单或开聊",
    page: "CNC-6061 铝支架详情",
    stat: "探索型占有效浏览 31% · 页内转化交互偏低",
    causeKey: "A-04",
  },
  {
    id: "ph-compare",
    intent: "compare",
    loss: "流失点 2",
    title: "在几个型号之间来回看，站内没有对比页帮他做决定",
    page: "铝支架相关详情组",
    stat: "比较型 18% · 同类页来回切换",
    causeKey: "A-05",
  },
  {
    id: "ph-decide",
    intent: "decide",
    loss: "流失点 2",
    title: "确认供应商的人去了关于我们，看完资质仍有一部分没开填",
    page: "关于我们 / 铝支架详情",
    stat: "决策型 13% · 资质页停留够，转化交互未跟上",
    causeKey: "A-04",
  },
];

export const ROOT_CAUSES = {
  hits: [
    {
      key: "B-01",
      role: "主因",
      axis: "轴二 · 页面表现",
      layer: "流失点 1",
      page: "主力型号详情页 · CNC-6061 铝支架",
      title: "这页第一屏没吸引人往下看，多数人停在首屏附近就走了",
      evidence:
        "落地接住率 53.8% → 21.9%，落地停留约 11 秒，滚动深度 P75 停在首屏附近。搜索、直接、外链、广告四渠同步变差。",
      trend: "近 8 周里有 5 周落地接住率在警戒线以下。",
    },
    {
      key: "A-01",
      role: "佐证",
      axis: "轴一 · 访客意图",
      layer: "流失点 1",
      page: "主力型号详情页 · CNC-6061 铝支架",
      title: "浏览型占比偏高，第一屏没回答「你是谁、有什么、跟我什么关系」",
      evidence: "该页浏览型访客占比 38%，警戒线 55% 未破、但与落地接住断崖同向，作为首屏没接住的人群旁证。",
    },
    {
      key: "B-03",
      role: "佐证",
      axis: "轴二 · 页面表现",
      layer: "流失点 1",
      page: "主力型号详情页 · CNC-6061 铝支架",
      title: "秒退升高，入口完全没接住人",
      evidence: "广告渠秒退同步变差，且人集中落在该详情。不像单渠刷量：全站 UV 持平，其它渠同一落地也变差。",
    },
  ],
  excluded: [
    {
      key: "H-01",
      layer: "访问入口",
      title: "不是某个渠道来少了",
      evidence: "全站 UV 与上期持平，搜索、直接、外链、广告都没有单独掉量。",
    },
    {
      key: "H-08",
      layer: "流失点 2",
      title: "不是没逛到产品详情",
      evidence: "转化交互层未破线。人不是卡在文章、列表出不去。",
    },
    {
      key: "H-17",
      layer: "流失点 3",
      title: "不是表单填一半就走",
      evidence: "表单开始后完成率未破线。本期不精简字段。",
    },
  ],
};

export const TASKS = [
  {
    key: "t-detail",
    kind: "task",
    type: "修改产品详情页",
    adoptAction: "edit_product",
    priority: "P0",
    title: "把主力铝支架详情第一屏改成型号、给谁用、核心参数，询价入口留在首屏",
    goal: "主力铝支架详情页首屏没接住访客，卡在流失点 1。落地接住率 53.8%→21.9%，停留约 11 秒。把首屏从公司介绍改为产品直答。",
    object: "https://www.demo-cnc-oem.com/products/cnc-6061-bracket",
    requirements: [
      "标题别改；第一屏改成型号 CNC-6061、给谁用、核心参数（材质、公差、表面处理、起订、打样周期）",
      "询价入口留在首屏；公司介绍 / 品牌故事下移，不要占第一屏",
      "对着 aluminum bracket oem、cnc 6061 quote 来写，别空喊实力强",
    ],
    constraints: ["局部修改，不整页重写", "不改标题", "保留原文配图，这次不换封面"],
    confirms: ["壁厚 1.5–3.0mm、起订量 50 标「待客户确认」，不编造", "首屏方案确认后再覆盖上线"],
    previewTitle: "产品详情 · CNC-6061 铝支架",
    previewHint: "对应页面暂未接入，仅作跳转占位。",
    listTitle: "CNC-6061 铝支架详情 · 改第一屏",
    listMeta: "任务说明 · 来源：落地接住率 53.8%→21.9%",
    listTitle: "CNC-6061 铝支架详情 · 改第一屏",
    listMeta: "任务说明 · 来源：落地接住率 53.8%→21.9%",
  },
  {
    key: "t-landing",
    kind: "task",
    type: "生成营销页",
    adoptAction: "generate_landing",
    priority: "P0",
    title: "按询价意图生成 CNC OEM 留资获客页，首屏对齐型号、打样周期和询价入口",
    goal: "为铝支架采购来意生成询价型营销页，减轻详情页第一屏压力。生成后建议把询价意图流量切到新页。",
    object: "目标网站 = 当前站点；新建 /campaign/cnc-oem-quote",
    requirements: [
      "页面类型 = 留资获客页；语言英语；市场美国 / 欧洲",
      "首屏必须出现型号 CNC-6061、「48 小时打样」和询价入口；广告没说过的免模 / 零起订别写",
      "表单收集公司名、邮箱、图纸/规格、数量、期望交期",
    ],
    constraints: ["卖点从现有页面提取，页上没有的不编", "买家写不出标「待填写」"],
    confirms: ["买家画像与联系方式请客户补充", "落地是否切到新页，由客户确认"],
    banner: {
      when: "探索型达成 · 当次访问第 2 个合格浏览的产品详情页",
      where: "页底非遮挡横幅",
      copy: "还在看？3 分钟弄清哪个型号适合您 →",
    },
    previewTitle: "智能营销页 · CNC OEM 询价留资页",
    previewHint: "对应页面暂未接入，仅作跳转占位。",
    listTitle: "CNC OEM 询价留资页",
    listMeta: "任务说明 · 来源：询价来意无专属承接页",
  },
  {
    key: "t-ads",
    kind: "display",
    type: "站外建议",
    priority: "P1",
    title: "广告渠有效浏览同步变差，核对该词落地是否仍指向该详情",
    reason:
      "Google Ads 尚未授权，广告搜索词还列不出来。广告渠与详情页第一屏问题同向，请投放侧核对落地地址，或把询价类广告切到新生成的留资页。",
    suggest: "内容智能体改不了投放设置。可与「生成营销页」「改产品详情」一起看，客户可两边都做或只做一边。",
    object: "该活动对应的广告创意与落地地址",
    listTitle: "核对广告落地是否仍指向该详情",
    listMeta: "站外建议 · 投放侧核对",
  },
];

/** 对照《指标字典与假设方案库》假设方案库原文。本期只钉流失点 1。 */
export const CAUSES = [
  {
    key: "H-06",
    layer: "流失点1",
    state: "命中",
    page: "主力型号详情页 · CNC-6061 铝支架",
    hypothesis: "这一页的第一屏没接住客户，客户看了上半屏就走了",
    evidence:
      "落地接住率 53.8% → 21.9%，落地停留均值 11s，滚动深度 P75 停在首屏附近。四渠交叉同步变差，不是单渠创意问题。",
  },
  {
    key: "H-04",
    layer: "流失点1",
    state: "命中",
    page: "Q3 OEM 营销落地页",
    hypothesis: "落地页和广告创意对不上，或和这个渠道来的人对不上",
    evidence:
      "广告渠询价词把人送到营销页，页上仍在讲品牌和产能故事。广告渠落地接住单独破线，停留约 9 秒就走。",
  },
  {
    key: "H-05",
    layer: "流失点1",
    state: "命中",
    page: "主力型号详情页 · CNC-6061 铝支架",
    hypothesis: "页面内容和搜索意图对不上",
    evidence:
      "搜索来的人带着型号、打样、询价，页上第一屏几乎不提这些，只堆公司介绍。词和页说的不是一回事。",
  },
  {
    key: "H-01",
    layer: "访问入口",
    state: "排除",
    page: "",
    hypothesis: "某个渠道来的人少了（投放缩了、搜索引擎优化掉了、或外链少了）",
    evidence: "全站 UV 与上期持平，搜索、直接、外链、广告都没有单独掉量，不钉入口来量。",
  },
  {
    key: "H-14",
    layer: "访问入口",
    state: "排除",
    page: "",
    hypothesis: "来的人不是采购商（这些词带来的是了解知识的人，不是正在找供应商的人）",
    evidence: "本期意图里产品意向、询价意向仍是大头，不是知识型词把人带进来。入口结构不按这条钉。",
  },
  {
    key: "H-08",
    layer: "流失点2",
    state: "排除",
    page: "",
    hypothesis: "没逛到产品详情页",
    evidence: "转化交互率相对上期未破线。人不是卡在文章、列表、关于我们出不去，不补详情入口。",
  },
  {
    key: "H-09",
    layer: "流失点2",
    state: "排除",
    page: "主力型号详情页 · CNC-6061 铝支架",
    hypothesis: "详情页上没有询价入口",
    evidence: "页上已有询价入口。转化交互层未破线，不按「缺入口」改。",
  },
  {
    key: "H-10",
    layer: "流失点2",
    state: "排除",
    page: "主力型号详情页 · CNC-6061 铝支架",
    hypothesis: "看完了仍写不出询盘（参数、认证、怎么报价）",
    evidence: "看进去的人里动手比例未破线。缺规格、认证是首屏没看见，不是看完写不出，归到流失点 1。",
  },
  {
    key: "H-16",
    layer: "流失点2",
    state: "排除",
    page: "",
    hypothesis: "有询价入口，但客户不知道点了会得到什么",
    evidence: "转化交互层持平，不改按钮文案。先把第一屏参数和来意对齐。",
  },
  {
    key: "H-12",
    layer: "流失点3",
    state: "排除",
    page: "",
    hypothesis: "客服越聊越劝退",
    evidence: "开聊后留下的比例未破线。客服话术本期不下手。",
  },
  {
    key: "H-17",
    layer: "流失点3",
    state: "排除",
    page: "",
    hypothesis: "客户愿意开始填，但表单要填的东西太多，填一半就走了",
    evidence: "表单开始后完成率未破线。不精简表单字段。",
  },
];

export const MEASURES = [
  {
    key: "s-landing",
    priority: "P0",
    kind: "skill",
    type: "生成营销页",
    adoptAction: "generate_landing",
    title: "按询价意图生成 CNC OEM 留资获客页，首屏对齐型号、打样周期和询价入口",
    targetObject: "新页 /campaign/cnc-oem-quote（生成后建议把询价意图流量切过去）",
    expected: "对照月看询价意向访客能否在专页完成留资，减轻详情页第一屏压力",
    previewTitle: "智能营销页 · CNC OEM 询价留资页",
    previewHint: "对应页面暂未接入，仅作跳转占位。",
    taskBrief: [
      "目标网站：Demo · CNC 精密加工件外贸站（https://www.demo-cnc-oem.com）",
      "instance：DEMO_CNC_OEM（Demo 占位；现网走 get_website_list 取 bossProductInstance）",
      "页面类型：留资获客页（pageType=lead）",
      "公司名称：Demo CNC Precision Co., Ltd.",
      "所属行业：精密机加工 / CNC 代工",
      "主营产品/服务：CNC-6061 铝支架小批量加工与打样；按图纸开孔；3–5 轴同一条线",
      "核心卖点：资质认证 ISO9001，按订单可提供材质报告；生产能力 3–5 轴、小批量和打样同一条线；交付能力 48 小时打样、批量 15–20 天；服务支持工程师看图、英文对接、WhatsApp 即时回复",
      "目标买家：核心客户为欧美设备厂 / 代工厂采购，要小批量铝支架 OEM；重点客户为要快打样、要图纸确认的工程师型买家；不主打纯倒货贸易商",
      "联系方式：sales@demo-cnc-oem.com；WhatsApp +86-138-0000-0000",
      "官网地址：https://www.demo-cnc-oem.com",
      "目标市场：美国 / 欧洲；语言：英语（lang=en）",
      "留资页专属：表单收集公司名、邮箱、图纸/规格、数量、期望交期",
      "要对上的词：cnc machining quote / oem cnc quote / aluminum bracket oem",
      "关联产品：CNC-6061 铝支架 · https://www.demo-cnc-oem.com/products/cnc-6061-bracket",
      "跟广告怎么对齐：首屏必须出现型号 CNC-6061、「48 小时打样」和询价入口；广告没说过的「免模 / 零起订」别写",
      "落地怎么切：新页生成后，建议把询价意图流量切到新页；旧详情仍留给看规格的人",
      "配色/字体：默认蓝色主题 / Inter（不追问）",
    ],
    evidenceCard: {
      currentValue:
        "询价意向访客多落在主力铝支架详情，第一屏是品牌故事，落地接住率 53.8% → 21.9%，平均只待约 11 秒",
      benchmark: "广告和搜索词在讲打样、询价、型号；现页首屏几乎不提这些，只堆公司介绍",
      action: "按留资获客页把参数一次填全，生成后切询价流量；不要再拿详情页硬接询价意图",
    },
    generatePayload: {
      pageType: "lead",
      company: "Demo CNC Precision Co., Ltd.",
      industry: "精密机加工 / CNC 代工",
      productName: "CNC-6061 铝支架小批量加工与打样；按图纸开孔；3–5 轴同一条线",
      usp: "资质认证：ISO9001，按订单可提供材质报告\n生产能力：3–5 轴、小批量和打样同一条线\n交付能力：48 小时打样、批量 15–20 天\n服务支持：工程师看图、英文对接、WhatsApp 即时回复",
      buyer:
        "核心客户：欧美设备厂 / 代工厂采购，要小批量铝支架 OEM\n重点客户：要快打样、要图纸确认的工程师型买家\n潜在客户：不主打纯倒货贸易商",
      contact: "sales@demo-cnc-oem.com；WhatsApp +86-138-0000-0000",
      websiteUrl: "https://www.demo-cnc-oem.com",
      market: "美国 / 欧洲",
      lang: "en",
      model: "CNC-6061",
      certification: "ISO9001",
      order: "小批量；打样 48 小时；批量 15–20 天",
    },
  },
  {
    key: "s-product",
    priority: "P0",
    kind: "skill",
    type: "修改已有产品详情",
    adoptAction: "edit_product",
    title: "把主力铝支架详情第一屏改成型号、给谁用、核心参数，询价入口留在首屏",
    targetObject: "https://www.demo-cnc-oem.com/products/cnc-6061-bracket",
    expected: "对照月看该详情有效浏览与留资能否回升",
    previewTitle: "产品详情 · CNC-6061 铝支架",
    previewHint: "对应页面暂未接入，仅作跳转占位。",
    taskBrief: [
      "产品详情地址：https://www.demo-cnc-oem.com/products/cnc-6061-bracket",
      "修改方式：在原文基础上改第一屏（不是另开一个新产品）",
      "修改要求：1）标题别改；2）第一屏改成型号 CNC-6061、给谁用、核心参数（材质、公差、表面处理、起订、打样周期）；3）询价入口留在首屏；4）把公司介绍 / 品牌故事下移，不要占第一屏；5）概述、规格表、应用场景、工艺和表面处理、能不能定制、包装物流、售后、常见问题写全",
      "对着客户常搜的词来写：aluminum bracket oem、cnc 6061 quote；别空喊「实力强」",
      "常见问题至少讲清：开孔能不能改、起订多少、打样多久、表面处理有哪些",
      "能核实的事实（没有的标「待客户确认」，别编）：材质 6061 铝合金；壁厚 1.5–3.0mm（待确认）；起订量 50（待确认）；打样 48 小时、批量 15–20 天；认证 ISO9001",
      "配图要求：原文里的图都留下；这次不换封面，除非原来就没有封面",
      "交给谁：运营助手 · 修改已有产品详情",
    ],
    evidenceCard: {
      currentValue: "该详情访问量不差，但第一屏是品牌故事，落地停留约 11 秒，滚动深度停在首屏附近",
      benchmark: "写得全、首屏能看到型号和参数的同类详情，留资大约是它的 2～3 倍",
      action: "在这个产品上改全再上线，不要再新建一条同款产品",
    },
  },
  {
    key: "s-ads",
    priority: "P1",
    kind: "display_only",
    type: "站外或人工处理建议",
    adoptAction: "",
    title: "广告渠有效浏览同步变差，核对该词落地是否仍指向该详情",
    targetObject: "该活动对应的广告创意与落地地址",
    expected: "仅展示，不交运营助手执行。Google Ads 尚未授权，广告搜索词还列不出来",
    previewTitle: "投放侧建议 · 落地地址核对",
    previewHint: "对应页面暂未接入，仅作跳转占位。",
    taskBrief: [
      "建议谁处理：投放侧",
      "建议做什么：把广告文案和落地页说的对齐；或把询价类广告落地地址切到新生成的留资获客页",
      "核对范围：当前广告落地是否仍指向 https://www.demo-cnc-oem.com/products/cnc-6061-bracket",
      "和站内任务的关系：可与「生成营销页」「改产品详情」一起看，客户可两边都做或只做一边",
      "限制：Google Ads 未授权，本期不能列出广告搜索词，只能按进站第一页统计",
    ],
    evidenceCard: {
      currentValue: "广告渠有效浏览同步变差，与详情页第一屏问题同向，不像单渠创意事故",
      benchmark: "搜索、直接、外链在同一落地页上也变差，说明页本身没接住",
      action: "投放侧核对落地地址；站内先把营销页和详情改对",
    },
  },
];

export const OBSERVING = [
  {
    key: "o1",
    title: "首页导航改版",
    note: "2026年7月已执行，对照月为 2026年8月。基数或全站同步变化未定时不下「修好了 / 无效」的结论。",
  },
];
