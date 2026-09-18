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
      { name: "有效浏览率", role: "定位主指标" },
      { name: "秒退率", role: "升是坏 · 只看 1 页且停不够" },
      { name: "落地接住率", role: "只衡量进站第一页" },
      { name: "合格浏览率", role: "这一页自己停够没有" },
      { name: "落地停留均值", role: "旁证" },
      { name: "滚动深度 P75", role: "旁证 · 多数人还在首屏附近" },
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

export const PAGES = {
  l1: [
    {
      path: "/products/cnc-6061-bracket",
      name: "主力型号详情页 · CNC-6061 铝支架",
      type: "产品详情",
      land: 420,
      catchRate: 0.219,
      catchPrev: 0.44,
      stay: 11,
      stayPrev: 28,
      p75: 0.18,
      bounce: 0.61,
      bouncePrev: 0.29,
      state: "异常",
    },
    {
      path: "/campaign/cnc-oem-q3",
      name: "Q3 OEM 营销落地页",
      type: "落地页",
      land: 180,
      catchRate: 0.228,
      catchPrev: 0.38,
      stay: 13,
      stayPrev: 24,
      p75: 0.22,
      bounce: 0.55,
      bouncePrev: 0.33,
      state: "异常",
    },
    {
      path: "/",
      name: "首页",
      type: "首页",
      land: 310,
      catchRate: 0.6,
      catchPrev: 0.61,
      stay: 34,
      stayPrev: 36,
      p75: 0.52,
      bounce: 0.21,
      bouncePrev: 0.2,
      state: "持平",
    },
    {
      path: "/blog/cnc-tolerance-guide",
      name: "公差指南文章",
      type: "文章",
      land: 140,
      catchRate: 0.6,
      catchPrev: 0.58,
      stay: 48,
      stayPrev: 44,
      p75: 0.71,
      bounce: 0.18,
      bouncePrev: 0.19,
      state: "持平",
    },
    {
      path: "/about",
      name: "关于我们",
      type: "关于",
      land: 90,
      catchRate: 0.578,
      catchPrev: 0.55,
      stay: 29,
      stayPrev: 27,
      p75: 0.48,
      bounce: 0.24,
      bouncePrev: 0.26,
      state: "持平",
    },
  ],
  l2: [
    {
      path: "/products/cnc-6061-bracket",
      name: "主力型号详情页 · CNC-6061 铝支架",
      type: "产品详情",
      viewed: 92,
      interactRate: 0.087,
      interactPrev: 0.09,
      detailReach: 1,
      exitShare: 0.41,
      exitPrev: 0.22,
      ctaCount: 1,
      state: "旁证",
    },
    {
      path: "/blog/cnc-tolerance-guide",
      name: "公差指南文章",
      type: "文章",
      viewed: 84,
      interactRate: 0.024,
      interactPrev: 0.03,
      detailReach: 0.19,
      exitShare: 0.38,
      exitPrev: 0.2,
      ctaCount: 0,
      state: "异常",
    },
    {
      path: "/products",
      name: "产品列表",
      type: "列表",
      viewed: 110,
      interactRate: 0.045,
      interactPrev: 0.05,
      detailReach: 0.62,
      exitShare: 0.18,
      exitPrev: 0.17,
      ctaCount: 0,
      state: "持平",
    },
  ],
  l3: [
    {
      path: "/products/cnc-6061-bracket",
      name: "主力型号详情页 · CNC-6061 铝支架",
      type: "产品详情",
      started: 18,
      formDone: 0.44,
      formPrev: 0.46,
      chatLead: 0.5,
      chatPrev: 0.48,
      state: "持平",
    },
  ],
};

export const PAGE_COLS = {
  l1: [
    { key: "land", label: "落地访客" },
    { key: "catchRate", label: "落地接住率", fmt: "pct" },
    { key: "stay", label: "落地停留秒", fmt: "sec" },
    { key: "p75", label: "滚动 P75", fmt: "pct" },
    { key: "bounce", label: "秒退率", fmt: "pct" },
  ],
  l2: [
    { key: "viewed", label: "有效浏览访客" },
    { key: "interactRate", label: "页面转化交互率", fmt: "pct" },
    { key: "detailReach", label: "详情到达", fmt: "pct" },
    { key: "exitShare", label: "未转化出口占比", fmt: "pct" },
    { key: "ctaCount", label: "询价入口个数" },
  ],
  l3: [
    { key: "started", label: "开始交互访客" },
    { key: "formDone", label: "表单完成率", fmt: "pct" },
    { key: "chatLead", label: "开聊留资率", fmt: "pct" },
  ],
};

export const VISITORS = [
  {
    id: "v01",
    channel: "search",
    loss: "l1",
    tag: "没看进去",
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
    inbound: "",
    siteSearch: [],
    land: "/",
    pages: [
      { path: "/", name: "首页", stay: 22, scroll: 0.45 },
      { path: "/products/cnc-6061-bracket", name: "CNC-6061 铝支架", stay: 88, scroll: 0.7 },
      { path: "/about", name: "关于我们", stay: 36, scroll: 0.55 },
    ],
    caught: true,
    viewed: true,
    bounced: false,
    interacted: false,
    led: false,
    note: "逛了详情和关于我们，没有开填、没有开聊。",
  },
  {
    id: "v06",
    channel: "search",
    loss: "l3",
    tag: "动手没留下",
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
];

export function visitorsFor(channelId, lossId) {
  return VISITORS.filter((v) => {
    if (lossId && v.loss !== lossId) return false;
    if (channelId !== "site" && v.channel !== channelId) return false;
    return true;
  });
}

export function pagesFor(lossId) {
  return PAGES[lossId] || [];
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

export function stateOfThrough(pass, passPrev, lossId) {
  if (lossId === "l1") {
    const rel = (passPrev - pass) / passPrev;
    const pp = (passPrev - pass) * 100;
    if (rel > 0.1 && pp > 2) return "异常";
    if ((pass - passPrev) / passPrev > 0.1 && (pass - passPrev) * 100 > 2) return "提升";
    return "持平";
  }
  const rel = Math.abs(pass - passPrev) / (passPrev || 1);
  if (rel < 0.1) return "持平";
  return pass < passPrev ? "异常" : "提升";
}
