/** 贯穿案例 mock：UV 持平，有效浏览率 40%→30%，卡在流失点 1。人数漏斗，条数旁注。 */

export const SITE = {
  name: "Demo · CNC 精密加工件外贸站",
  origin: "www.demo-cnc-oem.com",
  period: "2026-08-04 ~ 2026-08-31 · 28 天",
  baseline: "对比：过去 4 周同期平均",
};

export const CHANNELS = [
  { id: "site", label: "全站" },
  { id: "search", label: "搜索引擎" },
  { id: "direct", label: "直接访问" },
  { id: "referral", label: "外部链接" },
  { id: "ads", label: "广告" },
];

export const LAYERS = [
  { id: "entry", name: "访问入口", hint: "来了多少人", color: "blue" },
  { id: "view", name: "有效浏览", hint: "看进去没", color: "green" },
  { id: "interact", name: "转化交互", hint: "动手没", color: "rose" },
  { id: "lead", name: "成功留资", hint: "留下没", color: "violet" },
];

export const INTENTS = [
  { id: "product", name: "产品意向" },
  { id: "spec", name: "技术评估" },
  { id: "supplier", name: "供应商评估" },
  { id: "quote", name: "询价意向" },
  { id: "content", name: "资讯浏览" },
  { id: "unclear", name: "意图不明" },
];

export const LOSSES = [
  {
    id: "l1",
    seq: 1,
    from: "entry",
    to: "view",
    title: "访问入口 → 有效浏览",
    meaning: "看进去没",
    primary: "有效浏览率",
    primaryHint: "落地停留 ≥15s，或当天已开填表单 / 主动开聊",
    failed: "没接住：一眼就走，或翻了几页都没停够",
    metrics: [
      { name: "有效浏览率", role: "定位主指标", group: "layer" },
      { name: "合格浏览率", role: "这一页自己停够没有", group: "page" },
      { name: "页面停留均值", role: "不限是否落地", group: "page" },
      { name: "滚动深度 P75", role: "旁证 · 多数人还在首屏附近", group: "page" },
      { name: "落地接住率", role: "只衡量进站第一页", group: "land" },
      { name: "落地停留均值", role: "只看进站第一页", group: "land" },
      { name: "秒退率", role: "升是坏 · 只看 1 页且停不够", group: "land" },
    ],
  },
  {
    id: "l2",
    seq: 2,
    from: "view",
    to: "interact",
    title: "有效浏览 → 转化交互",
    meaning: "看了没动手",
    primary: "转化交互率",
    primaryHint: "开填表单或主动开聊（点 CTA 无独立事件）",
    failed: "看进去了，但没填表、没开聊",
    metrics: [
      { name: "转化交互率", role: "定位主指标" },
      { name: "详情页到达率", role: "逛没逛到产品详情" },
      { name: "表单开始率", role: "通道拆分" },
      { name: "开聊率", role: "通道拆分" },
      { name: "未转化页出口率", role: "从哪一页离开" },
      { name: "询价入口个数", role: "读页，不是埋点" },
    ],
  },
  {
    id: "l3",
    seq: 3,
    from: "interact",
    to: "lead",
    title: "转化交互 → 成功留资",
    meaning: "动手没留下",
    primary: "留资完成（人数）",
    primaryHint: "漏斗用留资访客；询盘条数旁注，不要拿条数当层高",
    failed: "开填或开聊了，但线索没入库",
    metrics: [
      { name: "留资访客 / 转化交互访客", role: "漏斗层间" },
      { name: "表单完成率", role: "开始填的人交没交" },
      { name: "开聊留资率", role: "开聊的人留下没" },
      { name: "表单留资占比", role: "通道结构，不单独钉点" },
    ],
  },
];

const STAGE = {
  site: {
    entry: { cur: 1650, prev: 1650 },
    view: { cur: 495, prev: 660 },
    interact: { cur: 74, prev: 99 },
    lead: { cur: 34, prev: 45 },
    leadCount: { cur: 36, prev: 47 },
  },
  search: {
    entry: { cur: 780, prev: 770 },
    view: { cur: 195, prev: 308 },
    interact: { cur: 28, prev: 46 },
    lead: { cur: 12, prev: 21 },
    leadCount: { cur: 13, prev: 22 },
  },
  direct: {
    entry: { cur: 290, prev: 300 },
    view: { cur: 131, prev: 135 },
    interact: { cur: 22, prev: 23 },
    lead: { cur: 12, prev: 12 },
    leadCount: { cur: 13, prev: 13 },
  },
  referral: {
    entry: { cur: 210, prev: 220 },
    view: { cur: 84, prev: 92 },
    interact: { cur: 12, prev: 14 },
    lead: { cur: 6, prev: 7 },
    leadCount: { cur: 6, prev: 7 },
  },
  ads: {
    entry: { cur: 370, prev: 360 },
    view: { cur: 85, prev: 125 },
    interact: { cur: 12, prev: 16 },
    lead: { cur: 4, prev: 5 },
    leadCount: { cur: 4, prev: 5 },
  },
};

export function getStages(channelId) {
  const s = STAGE[channelId];
  return LAYERS.map((layer) => ({
    ...layer,
    cur: s[layer.id].cur,
    prev: s[layer.id].prev,
  }));
}

export function getLeadCount(channelId) {
  return STAGE[channelId].leadCount;
}

export function rate(n, d) {
  if (!d) return 0;
  return n / d;
}

export function pct(n) {
  return `${(n * 100).toFixed(1)}%`;
}

export function deltaPeople(cur, prev) {
  return cur - prev;
}

export function through(stages) {
  return [
    { lossId: "l1", from: stages[0], to: stages[1] },
    { lossId: "l2", from: stages[1], to: stages[2] },
    { lossId: "l3", from: stages[2], to: stages[3] },
  ].map((row) => {
    const dropped = row.from.cur - row.to.cur;
    const droppedPrev = row.from.prev - row.to.prev;
    const pass = rate(row.to.cur, row.from.cur);
    const passPrev = rate(row.to.prev, row.from.prev);
    return { ...row, dropped, droppedPrev, pass, passPrev };
  });
}

export const PAGE_META = {
  "/products/cnc-6061-bracket": {
    name: "主力型号详情页 · CNC-6061 铝支架",
    type: "产品详情",
    intent: "product",
  },
  "/campaign/cnc-oem-q3": { name: "Q3 OEM 营销落地页", type: "落地页", intent: "quote" },
  "/": { name: "首页", type: "首页" },
  "/blog/cnc-tolerance-guide": { name: "公差指南文章", type: "文章", intent: "spec" },
  "/about": { name: "关于我们", type: "关于", intent: "supplier" },
  "/products": { name: "产品列表", type: "列表", intent: "product" },
};

function withMeta(list) {
  return list.map((row) => ({ ...PAGE_META[row.path], ...row }));
}

function splitChannel(siteRows, patches) {
  const pack = { site: siteRows };
  for (const ch of ["search", "direct", "referral", "ads"]) {
    const patch = patches[ch] || {};
    pack[ch] = siteRows
      .map((row) => {
        if (patch[row.path] === false) return null;
        return { ...row, ...(patch[row.path] || {}) };
      })
      .filter(Boolean);
  }
  return pack;
}

const L1_PAGE_SITE = withMeta([
  { path: "/products/cnc-6061-bracket", qualifyRate: 0.24, qualifyRatePrev: 0.56, pageStay: 16, p75: 0.22 },
  { path: "/campaign/cnc-oem-q3", qualifyRate: 0.26, qualifyRatePrev: 0.27, pageStay: 14, p75: 0.24 },
  { path: "/", qualifyRate: 0.62, qualifyRatePrev: 0.61, pageStay: 36, p75: 0.54 },
  { path: "/blog/cnc-tolerance-guide", qualifyRate: 0.78, qualifyRatePrev: 0.77, pageStay: 52, p75: 0.74 },
  { path: "/about", qualifyRate: 0.58, qualifyRatePrev: 0.57, pageStay: 31, p75: 0.5 },
]);

const L1_LAND_SITE = withMeta([
  { path: "/products/cnc-6061-bracket", land: 420, catchRate: 0.219, catchRatePrev: 0.538, stay: 11, p75: 0.18, bounce: 0.61 },
  { path: "/campaign/cnc-oem-q3", land: 180, catchRate: 0.228, catchRatePrev: 0.23, stay: 13, p75: 0.22, bounce: 0.55 },
  { path: "/", land: 310, catchRate: 0.6, catchRatePrev: 0.6, stay: 34, p75: 0.52, bounce: 0.21 },
  { path: "/blog/cnc-tolerance-guide", land: 140, catchRate: 0.6, catchRatePrev: 0.6, stay: 48, p75: 0.71, bounce: 0.18 },
  { path: "/about", land: 90, catchRate: 0.578, catchRatePrev: 0.58, stay: 29, p75: 0.48, bounce: 0.24 },
]);

const L2_SITE = withMeta([
  { path: "/products/cnc-6061-bracket", viewed: 92, interactRate: 0.087, interactRatePrev: 0.09, detailReach: 1, exitShare: 0.41, ctaCount: 1 },
  { path: "/blog/cnc-tolerance-guide", viewed: 84, interactRate: 0.024, interactRatePrev: 0.025, detailReach: 0.19, exitShare: 0.38, ctaCount: 0 },
  { path: "/products", viewed: 110, interactRate: 0.045, interactRatePrev: 0.046, detailReach: 0.62, exitShare: 0.18, ctaCount: 0 },
]);

const L3_SITE = withMeta([
  { path: "/products/cnc-6061-bracket", started: 18, formDone: 0.44, formDonePrev: 0.44, chatLead: 0.5 },
]);

export const PAGES = {
  l1: {
    page: splitChannel(L1_PAGE_SITE, {
      search: {
        "/products/cnc-6061-bracket": { qualifyRate: 0.18, pageStay: 11, p75: 0.14 },
        "/campaign/cnc-oem-q3": { qualifyRate: 0.19, qualifyRatePrev: 0.2, pageStay: 11, p75: 0.16 },
        "/": { qualifyRate: 0.6, pageStay: 34, p75: 0.52 },
        "/blog/cnc-tolerance-guide": { qualifyRate: 0.79, pageStay: 54, p75: 0.76 },
        "/about": { qualifyRate: 0.55, pageStay: 28, p75: 0.46 },
      },
      direct: {
        "/products/cnc-6061-bracket": { qualifyRate: 0.56, pageStay: 38, p75: 0.58 },
        "/campaign/cnc-oem-q3": { qualifyRate: 0.48, pageStay: 28, p75: 0.44 },
        "/": { qualifyRate: 0.64, pageStay: 40, p75: 0.56 },
        "/blog/cnc-tolerance-guide": { qualifyRate: 0.8, pageStay: 56, p75: 0.76 },
        "/about": { qualifyRate: 0.6, pageStay: 34, p75: 0.52 },
      },
      referral: {
        "/products/cnc-6061-bracket": { qualifyRate: 0.32, pageStay: 18, p75: 0.26 },
        "/campaign/cnc-oem-q3": { qualifyRate: 0.4, pageStay: 22, p75: 0.36 },
      },
      ads: {
        "/products/cnc-6061-bracket": { qualifyRate: 0.22, qualifyRatePrev: 0.23, pageStay: 14, p75: 0.2 },
        "/campaign/cnc-oem-q3": { qualifyRate: 0.17, pageStay: 10, p75: 0.15 },
        "/": { qualifyRate: 0.5, pageStay: 28, p75: 0.42 },
        "/blog/cnc-tolerance-guide": { qualifyRate: 0.7, pageStay: 44, p75: 0.62 },
        "/about": { qualifyRate: 0.52, pageStay: 26, p75: 0.4 },
      },
    }),
    land: splitChannel(L1_LAND_SITE, {
      search: {
        "/products/cnc-6061-bracket": { land: 310, catchRate: 0.155, stay: 8, p75: 0.11, bounce: 0.72 },
        "/campaign/cnc-oem-q3": { land: 95, catchRate: 0.168, catchRatePrev: 0.17, stay: 9, p75: 0.14, bounce: 0.68 },
        "/": { land: 165, catchRate: 0.55, stay: 31, p75: 0.5, bounce: 0.24 },
        "/blog/cnc-tolerance-guide": { land: 130, catchRate: 0.62, stay: 51, p75: 0.73, bounce: 0.16 },
        "/about": { land: 50, catchRate: 0.52, stay: 26, p75: 0.44, bounce: 0.28 },
      },
      direct: {
        "/products/cnc-6061-bracket": { land: 70, catchRate: 0.54, stay: 29, p75: 0.55, bounce: 0.2 },
        "/campaign/cnc-oem-q3": { land: 15, catchRate: 0.47, stay: 24, p75: 0.42, bounce: 0.26 },
        "/": { land: 140, catchRate: 0.63, stay: 36, p75: 0.54, bounce: 0.18 },
        "/blog/cnc-tolerance-guide": { land: 25, catchRate: 0.64, stay: 46, p75: 0.7, bounce: 0.16 },
        "/about": { land: 35, catchRate: 0.6, stay: 32, p75: 0.5, bounce: 0.2 },
      },
      referral: {
        "/products/cnc-6061-bracket": { land: 95, catchRate: 0.28, stay: 12, p75: 0.2, bounce: 0.52 },
        "/campaign/cnc-oem-q3": { land: 20, catchRate: 0.4, stay: 20, p75: 0.34, bounce: 0.32 },
        "/": { land: 55, catchRate: 0.58, stay: 32, p75: 0.5, bounce: 0.22 },
        "/blog/cnc-tolerance-guide": { land: 25, catchRate: 0.6, stay: 44, p75: 0.68, bounce: 0.18 },
        "/about": { land: 12, catchRate: 0.5, stay: 27, p75: 0.46, bounce: 0.26 },
      },
      ads: {
        "/products/cnc-6061-bracket": { land: 110, catchRate: 0.2, catchRatePrev: 0.21, stay: 10, p75: 0.16, bounce: 0.62 },
        "/campaign/cnc-oem-q3": { land: 190, catchRate: 0.147, stay: 8, p75: 0.13, bounce: 0.71 },
        "/": { land: 45, catchRate: 0.49, stay: 26, p75: 0.4, bounce: 0.3 },
        "/blog/cnc-tolerance-guide": { land: 15, catchRate: 0.53, stay: 36, p75: 0.55, bounce: 0.22 },
        "/about": { land: 8, catchRate: 0.5, stay: 24, p75: 0.38, bounce: 0.28 },
      },
    }),
  },
  l2: splitChannel(L2_SITE, {
    search: {
      "/products/cnc-6061-bracket": { viewed: 48, interactRate: 0.06, detailReach: 1, exitShare: 0.52 },
      "/blog/cnc-tolerance-guide": { viewed: 62, interactRate: 0.016, detailReach: 0.22, exitShare: 0.48 },
      "/products": { viewed: 40, interactRate: 0.04, detailReach: 0.58, exitShare: 0.2 },
    },
    direct: {
      "/products/cnc-6061-bracket": { viewed: 38, interactRate: 0.16, detailReach: 1, exitShare: 0.18 },
      "/blog/cnc-tolerance-guide": { viewed: 22, interactRate: 0.05, detailReach: 0.36, exitShare: 0.22 },
      "/products": { viewed: 28, interactRate: 0.07, detailReach: 0.7, exitShare: 0.15 },
    },
    referral: {
      "/products/cnc-6061-bracket": { viewed: 22, interactRate: 0.09, detailReach: 1, exitShare: 0.28 },
      "/blog/cnc-tolerance-guide": { viewed: 18, interactRate: 0.03, detailReach: 0.28, exitShare: 0.33 },
      "/products": { viewed: 16, interactRate: 0.06, detailReach: 0.6, exitShare: 0.18 },
    },
    ads: {
      "/products/cnc-6061-bracket": { viewed: 20, interactRate: 0.08, detailReach: 1, exitShare: 0.36 },
      "/blog/cnc-tolerance-guide": { viewed: 12, interactRate: 0.02, detailReach: 0.15, exitShare: 0.4 },
      "/products": { viewed: 18, interactRate: 0.04, detailReach: 0.5, exitShare: 0.22 },
    },
  }),
  l3: splitChannel(L3_SITE, {
    search: {
      "/products/cnc-6061-bracket": { started: 8, formDone: 0.38, chatLead: 0.42 },
    },
    direct: {
      "/products/cnc-6061-bracket": { started: 6, formDone: 0.5, chatLead: 0.55 },
    },
    referral: {
      "/products/cnc-6061-bracket": { started: 3, formDone: 0.46, chatLead: 0.5 },
    },
    ads: {
      "/products/cnc-6061-bracket": { started: 4, formDone: 0.33, chatLead: 0.4 },
    },
  }),
};

const ADS_L2_CAMPAIGN = withMeta([
  {
    path: "/campaign/cnc-oem-q3",
    viewed: 30,
    interactRate: 0.03,
    interactRatePrev: 0.11,
    detailReach: 0.25,
    exitShare: 0.55,
    ctaCount: 1,
  },
]);
PAGES.l2.ads = [...ADS_L2_CAMPAIGN, ...PAGES.l2.ads];

export const PAGE_COLS = {
  l1: {
    page: [
      { key: "qualifyRate", label: "合格浏览率", fmt: "pct", prevKey: "qualifyRatePrev" },
      { key: "pageStay", label: "页面停留均值", fmt: "sec" },
      { key: "p75", label: "滚动深度 P75", fmt: "pct" },
    ],
    land: [
      { key: "land", label: "落地访客" },
      { key: "catchRate", label: "落地接住率", fmt: "pct", prevKey: "catchRatePrev" },
      { key: "stay", label: "落地停留均值", fmt: "sec" },
      { key: "p75", label: "滚动 P75", fmt: "pct" },
      { key: "bounce", label: "秒退率", fmt: "pct" },
    ],
  },
  l2: [
    { key: "viewed", label: "有效浏览访客" },
    { key: "interactRate", label: "页面转化交互率", fmt: "pct", prevKey: "interactRatePrev" },
    { key: "detailReach", label: "详情到达", fmt: "pct" },
    { key: "exitShare", label: "未转化出口占比", fmt: "pct" },
    { key: "ctaCount", label: "询价入口个数" },
  ],
  l3: [
    { key: "started", label: "开始交互访客" },
    { key: "formDone", label: "表单完成率", fmt: "pct", prevKey: "formDonePrev" },
    { key: "chatLead", label: "开聊留资率", fmt: "pct" },
  ],
};

export const VISITORS = [
  {
    id: "v01",
    channel: "search",
    loss: "l1",
    tag: "没看进去",
    ip: "185.203.44.18",
    company: "Apex Motion GmbH",
    inbound: "cnc aluminum bracket oem",
    siteSearch: [],
    land: "/products/cnc-6061-bracket",
    pages: [
      { path: "/products/cnc-6061-bracket", name: "CNC-6061 铝支架", stay: 8, scroll: 0.12 },
    ],
    caught: false,
    viewed: false,
    bounced: true,
    interacted: false,
    led: false,
    note: "搜索词对准主力型号，首屏 8 秒、滚动 12% 就走。",
  },
  {
    id: "v02",
    channel: "search",
    loss: "l1",
    tag: "没看进去",
    ip: "91.198.174.192",
    company: "Helix Precision Ltd.",
    inbound: "6061 bracket manufacturer",
    siteSearch: [],
    land: "/products/cnc-6061-bracket",
    pages: [
      { path: "/products/cnc-6061-bracket", name: "CNC-6061 铝支架", stay: 6, scroll: 0.09 },
    ],
    caught: false,
    viewed: false,
    bounced: true,
    interacted: false,
    led: false,
    note: "同样落在主力型号详情，停留不足 15s，未动手。",
  },
  {
    id: "v03",
    channel: "ads",
    loss: "l1",
    tag: "没看进去",
    ip: "52.14.88.203",
    company: "Northstar OEM Inc.",
    inbound: "cnc machining quote",
    siteSearch: [],
    land: "/campaign/cnc-oem-q3",
    pages: [{ path: "/campaign/cnc-oem-q3", name: "Q3 OEM 营销落地页", stay: 9, scroll: 0.16 }],
    caught: false,
    viewed: false,
    bounced: true,
    interacted: false,
    led: false,
    note: "广告词是询价，落地页首屏没把报价入口放出来。",
  },
  {
    id: "v04",
    channel: "search",
    loss: "l2",
    tag: "看了没动手",
    ip: "203.0.113.44",
    company: "Rhine Drive Systems",
    inbound: "cnc tolerance standard",
    siteSearch: ["6061 bracket drawing"],
    land: "/blog/cnc-tolerance-guide",
    pages: [
      { path: "/blog/cnc-tolerance-guide", name: "公差指南文章", stay: 74, scroll: 0.82 },
      { path: "/products", name: "产品列表", stay: 18, scroll: 0.4 },
      { path: "/products/cnc-6061-bracket", name: "CNC-6061 铝支架", stay: 41, scroll: 0.33 },
    ],
    caught: true,
    viewed: true,
    bounced: false,
    interacted: false,
    led: false,
    note: "文章读完了，进了详情，但详情首屏看不到询价入口旁的说明。",
  },
  {
    id: "v05",
    channel: "direct",
    loss: "l2",
    tag: "看了没动手",
    ip: "8.25.91.110",
    company: "Pacific Tooling LLC",
    inbound: "",
    siteSearch: [],
    land: "/",
    pages: [
      { path: "/", name: "首页", stay: 22, scroll: 0.45 },
      { path: "/products/cnc-6061-bracket", name: "CNC-6061 铝支架", stay: 88, scroll: 0.7 },
      { path: "/about", name: "关于我们", stay: 36, scroll: 0.55 },
      { path: "/", name: "首页", stay: 14, scroll: 0.28 },
      { path: "/products/cnc-6061-bracket", name: "CNC-6061 铝支架", stay: 40, scroll: 0.38 },
    ],
    caught: true,
    viewed: true,
    bounced: false,
    interacted: false,
    led: false,
    note: "当天来过两次：上午首页进详情再去关于我们，下午又从首页进了详情。路径按时间排，重复页不去重。没有开填、没有开聊。",
  },
  {
    id: "v06",
    channel: "search",
    loss: "l3",
    tag: "动手没留下",
    ip: "77.88.21.45",
    company: "Brant Metalworks",
    inbound: "oem cnc parts moq",
    siteSearch: [],
    land: "/products/cnc-6061-bracket",
    pages: [
      { path: "/products/cnc-6061-bracket", name: "CNC-6061 铝支架", stay: 96, scroll: 0.64 },
    ],
    caught: true,
    viewed: true,
    bounced: false,
    interacted: true,
    led: false,
    note: "开填了表单，国家/采购量是必填，填到一半离开。",
  },
  {
    id: "v07",
    channel: "direct",
    loss: null,
    tag: "留下了",
    ip: "34.102.18.66",
    company: "Keystone Automation",
    inbound: "",
    siteSearch: [],
    land: "/products/cnc-6061-bracket",
    pages: [
      { path: "/products/cnc-6061-bracket", name: "CNC-6061 铝支架", stay: 140, scroll: 0.78 },
    ],
    caught: true,
    viewed: true,
    bounced: false,
    interacted: true,
    led: true,
    note: "主动开聊后留下邮箱。对照样本，不是本期问题。",
  },
  {
    id: "v08",
    channel: "referral",
    loss: "l1",
    tag: "没看进去",
    ip: "114.55.12.88",
    company: "",
    inbound: "",
    siteSearch: [],
    land: "/products/cnc-6061-bracket",
    pages: [{ path: "/products/cnc-6061-bracket", name: "CNC-6061 铝支架", stay: 7, scroll: 0.1 }],
    caught: false,
    viewed: false,
    bounced: true,
    interacted: false,
    led: false,
    note: "外链同样落到改版后的详情首屏。",
  },
  {
    id: "v09",
    channel: "ads",
    loss: "l2",
    tag: "看了没动手",
    ip: "18.204.55.17",
    company: "Atlas Industrial Co.",
    inbound: "cnc machining quote",
    siteSearch: [],
    land: "/campaign/cnc-oem-q3",
    pages: [
      { path: "/campaign/cnc-oem-q3", name: "Q3 OEM 营销落地页", stay: 41, scroll: 0.58 },
      { path: "/products/cnc-6061-bracket", name: "CNC-6061 铝支架", stay: 22, scroll: 0.28 },
    ],
    caught: true,
    viewed: true,
    bounced: false,
    interacted: false,
    led: false,
    note: "广告词是询价，落地页停够了，但没开填、没开聊。",
  },
  {
    id: "v10",
    channel: "ads",
    loss: "l3",
    tag: "动手没留下",
    ip: "63.141.22.90",
    company: "Westline Parts",
    inbound: "oem cnc quote",
    siteSearch: [],
    land: "/campaign/cnc-oem-q3",
    pages: [
      { path: "/campaign/cnc-oem-q3", name: "Q3 OEM 营销落地页", stay: 28, scroll: 0.4 },
      { path: "/products/cnc-6061-bracket", name: "CNC-6061 铝支架", stay: 72, scroll: 0.55 },
    ],
    caught: true,
    viewed: true,
    bounced: false,
    interacted: true,
    led: false,
    note: "从广告落地页进了详情，开填后国家必填卡住。",
  },
];

export function arrivedLayer(visitor) {
  if (visitor.led) return "lead";
  if (visitor.interacted) return "interact";
  if (visitor.viewed) return "view";
  return "entry";
}

export function arrivedLabel(visitor) {
  return LAYERS.find((layer) => layer.id === arrivedLayer(visitor))?.name ?? "访问入口";
}

const INTENT_STAY_MIN = 15;
const INTENT_CAP = 3;

const WORD_CUES = {
  product: ["bracket", "parts"],
  spec: ["tolerance", "drawing"],
  supplier: ["manufacturer", "factory"],
  quote: ["quote", "oem", "moq"],
  content: ["tutorial", "how to", "怎么选"],
};

function wordHaystack(visitor) {
  return [visitor.inbound, ...(visitor.siteSearch || [])].filter(Boolean).join(" ").toLowerCase();
}

function intentsFromWords(text) {
  if (!text) return [];
  return INTENTS.filter((item) => {
    if (item.id === "unclear") return false;
    return (WORD_CUES[item.id] || []).some((cue) => text.includes(cue));
  }).map((item) => item.id);
}

function intentsFromPages(visitor) {
  const stayByIntent = new Map();
  for (const page of visitor.pages) {
    const id = PAGE_META[page.path]?.intent;
    if (!id || page.stay < INTENT_STAY_MIN) continue;
    stayByIntent.set(id, (stayByIntent.get(id) || 0) + page.stay);
  }
  return [...stayByIntent.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
}

/** 一人一天可多个意图。词（来路/广告/站内搜）先记，页停留 ≥15s 再补；最多 3 个。不明不与其他类并存。不用当天到达反推。 */
export function visitorIntents(visitor) {
  const merged = [];
  for (const id of [...intentsFromWords(wordHaystack(visitor)), ...intentsFromPages(visitor)]) {
    if (!merged.includes(id)) merged.push(id);
    if (merged.length >= INTENT_CAP) break;
  }
  return merged.length ? merged : ["unclear"];
}

export function intentLabel(id) {
  return INTENTS.find((item) => item.id === id)?.name ?? "意图不明";
}

export function visitorsListed(channelId, layerId, intentId) {
  return VISITORS.filter((v) => {
    if (channelId !== "site" && v.channel !== channelId) return false;
    if (layerId && arrivedLayer(v) !== layerId) return false;
    if (intentId && !visitorIntents(v).includes(intentId)) return false;
    return true;
  });
}

export function pageTitle(path) {
  return PAGE_META[path]?.name ?? path;
}

export function pathLine(visitor) {
  return visitor.pages.map((p) => PAGE_META[p.path]?.type || p.name).join(" → ");
}

export function pathStats(visitor) {
  return {
    pageCount: visitor.pages.length,
    totalStay: visitor.pages.reduce((sum, p) => sum + p.stay, 0),
    landName: pageTitle(visitor.land),
    landType: PAGE_META[visitor.land]?.type ?? "",
    line: pathLine(visitor),
  };
}

export function pinSpecFor(lossId, slice = "page") {
  if (lossId === "l1" && slice === "land") {
    return { key: "catchRate", prevKey: "catchRatePrev", minKey: "land" };
  }
  if (lossId === "l1") {
    return { key: "qualifyRate", prevKey: "qualifyRatePrev", minKey: null };
  }
  if (lossId === "l2") {
    return { key: "interactRate", prevKey: "interactRatePrev", minKey: "viewed" };
  }
  return { key: "formDone", prevKey: "formDonePrev", minKey: "started" };
}

export function annotatePins(rows, layerState, spec) {
  if (layerState !== "异常") {
    return rows.map((row) => ({ ...row, pin: "" }));
  }
  const enough = (row) => spec.minKey == null || (row[spec.minKey] ?? 0) >= 10;
  const broken = rows.filter(
    (row) => enough(row) && rateBrokeDown(row[spec.key], row[spec.prevKey]),
  );
  const mark = broken.length === 1 ? "钉这页" : broken.length >= 2 ? "一起变差" : "";
  return rows.map((row) => {
    if (!enough(row)) return { ...row, pin: "人太少" };
    if (rateBrokeDown(row[spec.key], row[spec.prevKey])) return { ...row, pin: mark };
    return { ...row, pin: "" };
  });
}

export function pinCaption(rows, layerState) {
  if (layerState !== "异常") {
    return "这一层没变差，不用往下找到某一页。";
  }
  const pinned = rows.filter((row) => row.pin === "钉这页");
  const synced = rows.filter((row) => row.pin === "一起变差");
  if (pinned.length === 1) return `变差主要出在：${pinned[0].name}`;
  if (synced.length) return "好几页一起变差，不单独钉某一页。";
  return "拆开看，没有哪一页自己变差。";
}

export function pagesFor(lossId, slice = "page", channelId = "site") {
  const pack = PAGES[lossId];
  if (!pack) return [];
  const ch = channelId || "site";
  if (lossId === "l1") {
    const group = pack[slice] || pack.page;
    if (!group) return [];
    return group[ch] || group.site || [];
  }
  if (Array.isArray(pack)) return pack;
  return pack[ch] || pack.site || [];
}

export function pageColsFor(lossId, slice = "page") {
  const cols = PAGE_COLS[lossId];
  if (!cols) return [];
  if (Array.isArray(cols)) return cols;
  return cols[slice] || [];
}

export function channelLabel(id) {
  return CHANNELS.find((c) => c.id === id)?.label ?? id;
}

export function fmtInt(n) {
  return new Intl.NumberFormat("zh-CN").format(n);
}

export function fmtPctPair(cur, prev) {
  return { cur: pct(cur), prev: pct(prev), down: cur < prev - 0.005 };
}

/** ③④⑤ 通过率同一套线：环比跌幅 >10% 且绝对跌幅 >2pp 才异常；提升反向同条件。 */
export function rateBrokeDown(cur, prev) {
  if (cur == null || prev == null || !prev) return false;
  const rel = (prev - cur) / prev;
  const pp = (prev - cur) * 100;
  return rel > 0.1 && pp > 2;
}

export function rateBrokeUp(cur, prev) {
  if (cur == null || prev == null || !prev) return false;
  const rel = (cur - prev) / prev;
  const pp = (cur - prev) * 100;
  return rel > 0.1 && pp > 2;
}

export function stateOfThrough(pass, passPrev) {
  if (rateBrokeDown(pass, passPrev)) return "异常";
  if (rateBrokeUp(pass, passPrev)) return "提升";
  return "持平";
}

export const STUCK_LABEL = {
  l1: "看进去这一层",
  l2: "动手这一层",
  l3: "留下这一层",
};

export function bottleneck(gates) {
  for (const g of gates) {
    const state = stateOfThrough(g.pass, g.passPrev);
    if (state === "异常") {
      return {
        ...g,
        state,
        loss: LOSSES.find((l) => l.id === g.lossId),
      };
    }
  }
  return null;
}

const STRIP = {
  l1: {
    site: {
      合格浏览率: { v: 0.36, fmt: "pct" },
      页面停留均值: { v: 22, fmt: "sec" },
      "滚动深度 P75": { v: 0.28, fmt: "pct" },
      落地接住率: { v: 0.33, fmt: "pct" },
      落地停留均值: { v: 18, fmt: "sec" },
      秒退率: { v: 0.42, fmt: "pct" },
    },
    search: {
      合格浏览率: { v: 0.28, fmt: "pct" },
      页面停留均值: { v: 16, fmt: "sec" },
      "滚动深度 P75": { v: 0.18, fmt: "pct" },
      落地接住率: { v: 0.24, fmt: "pct" },
      落地停留均值: { v: 11, fmt: "sec" },
      秒退率: { v: 0.55, fmt: "pct" },
    },
    direct: {
      合格浏览率: { v: 0.6, fmt: "pct" },
      页面停留均值: { v: 36, fmt: "sec" },
      "滚动深度 P75": { v: 0.5, fmt: "pct" },
      落地接住率: { v: 0.58, fmt: "pct" },
      落地停留均值: { v: 33, fmt: "sec" },
      秒退率: { v: 0.21, fmt: "pct" },
    },
    referral: {
      合格浏览率: { v: 0.42, fmt: "pct" },
      页面停留均值: { v: 24, fmt: "sec" },
      "滚动深度 P75": { v: 0.36, fmt: "pct" },
      落地接住率: { v: 0.4, fmt: "pct" },
      落地停留均值: { v: 22, fmt: "sec" },
      秒退率: { v: 0.36, fmt: "pct" },
    },
    ads: {
      合格浏览率: { v: 0.26, fmt: "pct" },
      页面停留均值: { v: 15, fmt: "sec" },
      "滚动深度 P75": { v: 0.2, fmt: "pct" },
      落地接住率: { v: 0.22, fmt: "pct" },
      落地停留均值: { v: 12, fmt: "sec" },
      秒退率: { v: 0.54, fmt: "pct" },
    },
  },
  l2: {
    site: {
      详情页到达率: { v: 0.58, fmt: "pct" },
      表单开始率: { v: 0.1, fmt: "pct" },
      开聊率: { v: 0.049, fmt: "pct" },
      未转化页出口率: { v: 0.41, fmt: "pct" },
      询价入口个数: { v: 1, fmt: "int" },
    },
    search: {
      详情页到达率: { v: 0.52, fmt: "pct" },
      表单开始率: { v: 0.09, fmt: "pct" },
      开聊率: { v: 0.054, fmt: "pct" },
      未转化页出口率: { v: 0.48, fmt: "pct" },
      询价入口个数: { v: 1, fmt: "int" },
    },
    direct: {
      详情页到达率: { v: 0.68, fmt: "pct" },
      表单开始率: { v: 0.12, fmt: "pct" },
      开聊率: { v: 0.048, fmt: "pct" },
      未转化页出口率: { v: 0.2, fmt: "pct" },
      询价入口个数: { v: 1, fmt: "int" },
    },
    referral: {
      详情页到达率: { v: 0.55, fmt: "pct" },
      表单开始率: { v: 0.1, fmt: "pct" },
      开聊率: { v: 0.043, fmt: "pct" },
      未转化页出口率: { v: 0.3, fmt: "pct" },
      询价入口个数: { v: 1, fmt: "int" },
    },
    ads: {
      详情页到达率: { v: 0.48, fmt: "pct" },
      表单开始率: { v: 0.08, fmt: "pct" },
      开聊率: { v: 0.061, fmt: "pct" },
      未转化页出口率: { v: 0.45, fmt: "pct" },
      询价入口个数: { v: 1, fmt: "int" },
    },
  },
  l3: {
    site: {
      表单完成率: { v: 0.44, fmt: "pct" },
      开聊留资率: { v: 0.5, fmt: "pct" },
      表单留资占比: { v: 0.61, fmt: "pct" },
    },
    search: {
      表单完成率: { v: 0.38, fmt: "pct" },
      开聊留资率: { v: 0.42, fmt: "pct" },
      表单留资占比: { v: 0.58, fmt: "pct" },
    },
    direct: {
      表单完成率: { v: 0.5, fmt: "pct" },
      开聊留资率: { v: 0.55, fmt: "pct" },
      表单留资占比: { v: 0.62, fmt: "pct" },
    },
    referral: {
      表单完成率: { v: 0.46, fmt: "pct" },
      开聊留资率: { v: 0.5, fmt: "pct" },
      表单留资占比: { v: 0.6, fmt: "pct" },
    },
    ads: {
      表单完成率: { v: 0.33, fmt: "pct" },
      开聊留资率: { v: 0.4, fmt: "pct" },
      表单留资占比: { v: 0.55, fmt: "pct" },
    },
  },
};

export function stripMetric(lossId, channelId, name, gate) {
  if (
    name === "有效浏览率" ||
    name === "转化交互率" ||
    name === "留资访客 / 转化交互访客"
  ) {
    return { v: gate.pass, fmt: "pct" };
  }
  return STRIP[lossId]?.[channelId]?.[name] ?? STRIP[lossId]?.site?.[name] ?? null;
}
