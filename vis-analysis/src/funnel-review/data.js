/** 贯穿案例 mock：UV 持平，有效浏览率 40%→30%，卡在流失点 1。人数漏斗，条数旁注。 */

export const SITE = {
  name: "Demo · CNC 精密加工件外贸站",
  origin: "www.demo-cnc-oem.com",
  period: "9月14日 – 9月20日",
  baseline: "对照上一周 · 9月7日 – 9月13日",
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

/** 对人只打深度。内容方向由深度 × 页面类型读出，不再单独贴 6 类标签。 */
export const INTENTS = [
  { id: "browse", name: "浏览型" },
  { id: "explore", name: "探索型" },
  { id: "compare", name: "比较型" },
  { id: "decide", name: "决策型" },
];

export function intentLabel(id) {
  return INTENTS.find((item) => item.id === id)?.name ?? id;
}

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
      { name: "页面平均停留时长", role: "不限是否落地", group: "page" },
      { name: "平均滚动深度", role: "旁证 · 多数人还在首屏附近", group: "page" },
      { name: "落地接住率", role: "只衡量进站第一页", group: "land" },
      { name: "落地平均停留时长", role: "只看进站第一页", group: "land" },
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
      { name: "产品详情页到达率", role: "逛没逛到产品详情" },
      { name: "表单开始率", role: "通道拆分" },
      { name: "开聊率", role: "通道拆分" },
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

/** 窗口深度四档的漏斗人数。四档入口之和 = 全站 1650。 */
const INTENT_STAGE = {
  browse: {
    entry: { cur: 627, prev: 580 },
    view: { cur: 40, prev: 80 },
    interact: { cur: 2, prev: 4 },
    lead: { cur: 0, prev: 1 },
    leadCount: { cur: 0, prev: 1 },
  },
  explore: {
    entry: { cur: 512, prev: 530 },
    view: { cur: 318, prev: 325 },
    interact: { cur: 18, prev: 28 },
    lead: { cur: 4, prev: 8 },
    leadCount: { cur: 4, prev: 8 },
  },
  compare: {
    entry: { cur: 297, prev: 310 },
    view: { cur: 178, prev: 186 },
    interact: { cur: 18, prev: 32 },
    lead: { cur: 8, prev: 12 },
    leadCount: { cur: 9, prev: 13 },
  },
  decide: {
    entry: { cur: 214, prev: 230 },
    view: { cur: 95, prev: 120 },
    interact: { cur: 32, prev: 37 },
    lead: { cur: 22, prev: 24 },
    leadCount: { cur: 23, prev: 25 },
  },
};

function scaleCount(n, num, den) {
  if (!den) return 0;
  return Math.round(n * (num / den));
}

export function getStages(channelId, intentId) {
  const ch = STAGE[channelId] || STAGE.site;
  if (!intentId) {
    return LAYERS.map((layer) => ({
      ...layer,
      cur: ch[layer.id].cur,
      prev: ch[layer.id].prev,
    }));
  }
  const intent = INTENT_STAGE[intentId];
  if (!intent) return getStages(channelId);
  if (channelId === "site") {
    return LAYERS.map((layer) => ({
      ...layer,
      cur: intent[layer.id].cur,
      prev: intent[layer.id].prev,
    }));
  }
  const site = STAGE.site;
  return LAYERS.map((layer) => ({
    ...layer,
    cur: scaleCount(intent[layer.id].cur, ch[layer.id].cur, site[layer.id].cur),
    prev: scaleCount(intent[layer.id].prev, ch[layer.id].prev, site[layer.id].prev),
  }));
}

export function getLeadCount(channelId, intentId) {
  if (!intentId) return (STAGE[channelId] || STAGE.site).leadCount;
  const intent = INTENT_STAGE[intentId];
  if (!intent) return getLeadCount(channelId);
  if (channelId === "site") return intent.leadCount;
  const ch = STAGE[channelId] || STAGE.site;
  const site = STAGE.site;
  return {
    cur: scaleCount(intent.leadCount.cur, ch.leadCount.cur, site.leadCount.cur),
    prev: scaleCount(intent.leadCount.prev, ch.leadCount.prev, site.leadCount.prev),
  };
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
    title: "CNC 6061 Aluminum Bracket for OEM | Tight-Tolerance Machining",
    type: "产品详情页",
    url: "https://www.demo-cnc-oem.com/products/cnc-6061-bracket",
  },
  "/products/cnc-ti-bracket": {
    name: "钛合金支架详情",
    title: "Titanium CNC Bracket | Lightweight High-Strength OEM Parts",
    type: "产品详情页",
    url: "https://www.demo-cnc-oem.com/products/cnc-ti-bracket",
  },
  "/products/cnc-ss-bracket": {
    name: "不锈钢支架详情",
    title: "Stainless Steel CNC Bracket | Corrosion-Resistant Parts",
    type: "产品详情页",
    url: "https://www.demo-cnc-oem.com/products/cnc-ss-bracket",
  },
  "/campaign/cnc-oem-q3": {
    name: "Q3 OEM 营销落地页",
    title: "Q3 OEM CNC Machining — RFQ in 24 Hours | Demo CNC",
    type: "智能营销页",
    url: "https://www.demo-cnc-oem.com/campaign/cnc-oem-q3",
  },
  "/": {
    name: "首页",
    title: "Precision CNC Machining for OEM Buyers | Demo CNC",
    type: "首页",
    url: "https://www.demo-cnc-oem.com/",
  },
  "/blog/cnc-tolerance-guide": {
    name: "公差指南文章",
    title: "CNC Tolerance Guide for Aluminum Parts | Demo CNC",
    type: "资讯/文章页",
    url: "https://www.demo-cnc-oem.com/blog/cnc-tolerance-guide",
  },
  "/cases/oem-bracket": {
    name: "OEM 支架交付案例",
    title: "OEM Bracket Delivery Case | 0.02mm Tolerance | Demo CNC",
    type: "案例页",
    url: "https://www.demo-cnc-oem.com/cases/oem-bracket",
  },
  "/about": {
    name: "关于我们",
    title: "About Us | ISO 9001 CNC Machine Shop | Demo CNC",
    type: "公司信息/资质/工厂页",
    url: "https://www.demo-cnc-oem.com/about",
  },
  "/products": {
    name: "产品列表",
    title: "CNC Machined Parts Catalog | Aluminum, Titanium, Steel",
    type: "产品列表页",
    url: "https://www.demo-cnc-oem.com/products",
  },
  "/contact": {
    name: "联系/询价页",
    title: "Request a Quote | CNC OEM Machining | Demo CNC",
    type: "联系/询价页",
    url: "https://www.demo-cnc-oem.com/contact",
  },
};

function pageFields(path) {
  const meta = PAGE_META[path] || {};
  return {
    path,
    name: meta.name || path,
    title: meta.title || meta.name || path,
    type: meta.type || "未归类",
    url: meta.url || `https://${SITE.origin}${path === "/" ? "/" : path}`,
  };
}

/** 深度 × 主要页面类型 → 读出来的内容方向。给人看，不另打标签。 */
export const INTENT_PAGE_MIX = {
  browse: {
    reading: "主要落在产品详情和营销页，扫一眼就走。来意没被首屏接住。",
    implied: "在找产品 / 询价，页没接住",
    rows: [
      { type: "产品详情", share: 0.58, pages: "CNC-6061 铝支架", hint: "第一屏是公司介绍" },
      { type: "营销落地页", share: 0.22, pages: "Q3 OEM", hint: "广告询价词进来" },
      { type: "首页", share: 0.12, pages: "首页", hint: "直接访问" },
    ],
  },
  explore: {
    reading: "集中在资讯、案例，再进详情。在了解行业和工艺，还没选型。",
    implied: "在了解行业",
    rows: [
      { type: "资讯/指南", share: 0.46, pages: "公差指南", hint: "读得进去" },
      { type: "案例", share: 0.18, pages: "OEM 支架交付案例", hint: "看别人怎么做" },
      { type: "产品详情", share: 0.28, pages: "铝支架详情", hint: "看完文章进了详情仍少动手" },
    ],
  },
  compare: {
    reading: "在几个型号详情之间来回切。在比产品，站内没有对比页帮他选。",
    implied: "在比产品",
    rows: [
      { type: "产品详情", share: 0.71, pages: "铝支架 / 钛合金 / 不锈钢 三个型号", hint: "同类页来回切换" },
      { type: "产品列表", share: 0.19, pages: "产品列表", hint: "从列表再进详情" },
    ],
  },
  decide: {
    reading: "会去关于我们、资质，再开填或开聊。在确认这家能不能做。",
    implied: "在确认供应商",
    rows: [
      { type: "资质/关于", share: 0.41, pages: "关于我们", hint: "停留够，在核供应商" },
      { type: "产品详情", share: 0.39, pages: "铝支架详情", hint: "开填或开聊前再看型号" },
      { type: "营销落地页", share: 0.12, pages: "Q3 OEM", hint: "广告进来后动手" },
    ],
  },
};

/** 一期只排页面类型序列。意图打在人身上，同一条页序可以混几档。人数 < 5 不出。 */
export const WALKS = [
  {
    id: "w-pdp",
    types: ["产品详情"],
    implied: "只落在详情",
    counts: { site: 280, search: 168, direct: 22, referral: 38, ads: 52 },
    byIntent: { browse: 248, explore: 22, compare: 0, decide: 10 },
    urls: [
      { line: ["/products/cnc-6061-bracket"], count: 214 },
      { line: ["/products/cnc-ti-bracket"], count: 28 },
    ],
  },
  {
    id: "w-campaign",
    types: ["营销落地页"],
    implied: "广告进来停在落地页",
    counts: { site: 90, search: 18, direct: 6, referral: 8, ads: 58 },
    byIntent: { browse: 72, explore: 6, compare: 0, decide: 12 },
    urls: [{ line: ["/campaign/cnc-oem-q3"], count: 82 }],
  },
  {
    id: "w-home",
    types: ["首页"],
    implied: "进了首页就走",
    counts: { site: 52, search: 12, direct: 28, referral: 8, ads: 4 },
    byIntent: { browse: 40, explore: 8, compare: 0, decide: 4 },
    urls: [{ line: ["/"], count: 52 }],
  },
  {
    id: "w-guide-pdp",
    types: ["资讯/指南", "产品详情"],
    implied: "先读指南再进详情",
    counts: { site: 96, search: 62, direct: 14, referral: 12, ads: 8 },
    byIntent: { browse: 14, explore: 74, compare: 0, decide: 8 },
    urls: [
      { line: ["/blog/cnc-tolerance-guide", "/products/cnc-6061-bracket"], count: 71 },
      { line: ["/blog/cnc-tolerance-guide", "/products/cnc-ti-bracket"], count: 12 },
    ],
  },
  {
    id: "w-guide-case",
    types: ["资讯/指南", "案例", "产品详情"],
    implied: "指南和案例都读了，最后看详情",
    counts: { site: 48, search: 31, direct: 8, referral: 6, ads: 3 },
    byIntent: { browse: 0, explore: 39, compare: 0, decide: 9 },
    urls: [
      {
        line: ["/blog/cnc-tolerance-guide", "/cases/oem-bracket", "/products/cnc-6061-bracket"],
        count: 41,
      },
    ],
  },
  {
    id: "w-guide",
    types: ["资讯/指南"],
    implied: "只读了文章",
    counts: { site: 70, search: 48, direct: 10, referral: 8, ads: 4 },
    byIntent: { browse: 18, explore: 52, compare: 0, decide: 0 },
    urls: [{ line: ["/blog/cnc-tolerance-guide"], count: 64 }],
  },
  {
    id: "w-pdp-x3",
    types: ["产品详情", "产品详情", "产品详情"],
    implied: "几个型号来回切",
    counts: { site: 86, search: 54, direct: 16, referral: 10, ads: 6 },
    byIntent: { browse: 0, explore: 0, compare: 70, decide: 16 },
    urls: [
      {
        line: [
          "/products/cnc-6061-bracket",
          "/products/cnc-ti-bracket",
          "/products/cnc-6061-bracket",
        ],
        count: 32,
      },
      {
        line: [
          "/products/cnc-6061-bracket",
          "/products/cnc-ss-bracket",
          "/products/cnc-ti-bracket",
        ],
        count: 18,
      },
      {
        line: [
          "/products/cnc-ti-bracket",
          "/products/cnc-ss-bracket",
          "/products/cnc-6061-bracket",
        ],
        count: 11,
      },
    ],
  },
  {
    id: "w-list-pdp",
    types: ["产品列表", "产品详情", "产品详情"],
    implied: "从列表进两个型号",
    counts: { site: 41, search: 22, direct: 9, referral: 6, ads: 4 },
    byIntent: { browse: 0, explore: 10, compare: 31, decide: 0 },
    urls: [
      {
        line: ["/products", "/products/cnc-6061-bracket", "/products/cnc-ti-bracket"],
        count: 27,
      },
    ],
  },
  {
    id: "w-pdp-about",
    types: ["产品详情", "资质/关于"],
    implied: "看完型号去核资质",
    counts: { site: 48, search: 18, direct: 16, referral: 8, ads: 6 },
    byIntent: { browse: 0, explore: 10, compare: 0, decide: 38 },
    urls: [{ line: ["/products/cnc-6061-bracket", "/about"], count: 39 }],
  },
  {
    id: "w-about-pdp",
    types: ["资质/关于", "产品详情"],
    implied: "先核这家再回详情",
    counts: { site: 32, search: 14, direct: 10, referral: 5, ads: 3 },
    byIntent: { browse: 0, explore: 8, compare: 0, decide: 24 },
    urls: [{ line: ["/about", "/products/cnc-6061-bracket"], count: 26 }],
  },
  {
    id: "w-campaign-pdp",
    types: ["营销落地页", "产品详情"],
    implied: "广告进来后进了详情",
    counts: { site: 22, search: 4, direct: 2, referral: 2, ads: 14 },
    byIntent: { browse: 6, explore: 4, compare: 0, decide: 12 },
    urls: [{ line: ["/campaign/cnc-oem-q3", "/products/cnc-6061-bracket"], count: 18 }],
  },
];

const WALK_MIN = 5;

function scaleBag(bag, count, site) {
  const empty = { browse: 0, explore: 0, compare: 0, decide: 0 };
  const keys = INTENTS.map((item) => item.id).filter((id) => (bag[id] || 0) > 0);
  if (!keys.length || !site || !count) return empty;
  if (count === site) return { ...empty, ...bag };
  const scaled = { ...empty };
  let acc = 0;
  keys.forEach((id, index) => {
    if (index === keys.length - 1) {
      scaled[id] = Math.max(0, count - acc);
      return;
    }
    scaled[id] = Math.round(((bag[id] || 0) / site) * count);
    acc += scaled[id];
  });
  return scaled;
}

export function walksListed(channelId = "site", intentId = null) {
  const ch = channelId || "site";
  return WALKS.map((walk) => {
    const total = walk.counts[ch] ?? 0;
    const site = walk.counts.site || 1;
    const byIntent = scaleBag(walk.byIntent, total, site);
    const count = intentId ? byIntent[intentId] || 0 : total;
    const share = total ? count / total : 0;
    const mix = INTENTS.map((item) => ({
      id: item.id,
      name: item.name,
      count: byIntent[item.id] || 0,
    })).filter((row) => row.count > 0);
    const urls = walk.urls
      .map((row) => {
        const raw = ch === "site" ? row.count : Math.round(row.count * (total / site));
        return {
          count: intentId ? Math.round(raw * share) : raw,
          pages: (row.line || []).map(pageFields),
        };
      })
      .filter((row) => row.count >= WALK_MIN);
    return { ...walk, count, total, byIntent, mix, urls };
  })
    .filter((walk) => walk.count >= WALK_MIN)
    .sort((a, b) => b.count - a.count);
}

function withMeta(list) {
  return list.map((row) => {
    const fields = pageFields(row.path);
    return { ...fields, ...PAGE_META[row.path], ...row };
  });
}

/** onlyPatched：渠道只保留显式写出的页。落地页必须用，否则会把全站清单原样拷到每个渠道。 */
function splitChannel(siteRows, patches, { onlyPatched = false } = {}) {
  const pack = { site: siteRows };
  for (const ch of ["search", "direct", "referral", "ads"]) {
    const patch = patches[ch] || {};
    pack[ch] = siteRows
      .map((row) => {
        const extra = patch[row.path];
        if (extra === false) return null;
        if (onlyPatched && extra == null) return null;
        const next = { ...row, ...(extra || {}) };
        if (extra && extra.land != null && extra.pv == null) {
          next.pv = Math.round(extra.land * 1.16);
        }
        return next;
      })
      .filter(Boolean);
  }
  return pack;
}

const L1_PAGE_SITE = withMeta([
  { path: "/products/cnc-6061-bracket", pv: 680, uv: 520, qualifyRate: 0.24, qualifyRatePrev: 0.56, pageStay: 16, p75: 0.22, leads: 8 },
  { path: "/campaign/cnc-oem-q3", pv: 240, uv: 190, qualifyRate: 0.26, qualifyRatePrev: 0.27, pageStay: 14, p75: 0.24, leads: 4 },
  { path: "/", pv: 420, uv: 310, qualifyRate: 0.62, qualifyRatePrev: 0.61, pageStay: 36, p75: 0.54, leads: 6 },
  { path: "/blog/cnc-tolerance-guide", pv: 180, uv: 150, qualifyRate: 0.78, qualifyRatePrev: 0.77, pageStay: 52, p75: 0.74, leads: 2 },
  { path: "/about", pv: 120, uv: 95, qualifyRate: 0.58, qualifyRatePrev: 0.57, pageStay: 31, p75: 0.5, leads: 5 },
  { path: "/products", pv: 210, uv: 160, qualifyRate: 0.44, qualifyRatePrev: 0.45, pageStay: 22, p75: 0.36, leads: 3 },
  { path: "/cases/oem-bracket", pv: 96, uv: 82, qualifyRate: 0.71, qualifyRatePrev: 0.7, pageStay: 44, p75: 0.66, leads: 1 },
  { path: "/contact", pv: 48, uv: 42, qualifyRate: 0.71, qualifyRatePrev: 0.7, pageStay: 41, p75: 0.62, leads: 11 },
]);

const L1_LAND_SITE = withMeta([
  { path: "/products/cnc-6061-bracket", land: 420, pv: 486, catchRate: 0.219, catchRatePrev: 0.538, stay: 11, p75: 0.18, bounce: 0.61, leads: 3 },
  { path: "/campaign/cnc-oem-q3", land: 180, pv: 214, catchRate: 0.228, catchRatePrev: 0.23, stay: 13, p75: 0.22, bounce: 0.55, leads: 2 },
  { path: "/", land: 310, pv: 358, catchRate: 0.6, catchRatePrev: 0.6, stay: 34, p75: 0.52, bounce: 0.21, leads: 5 },
  { path: "/blog/cnc-tolerance-guide", land: 140, pv: 162, catchRate: 0.6, catchRatePrev: 0.6, stay: 48, p75: 0.71, bounce: 0.18, leads: 1 },
  { path: "/about", land: 90, pv: 104, catchRate: 0.578, catchRatePrev: 0.58, stay: 29, p75: 0.48, bounce: 0.24, leads: 4 },
  { path: "/products", land: 70, pv: 82, catchRate: 0.48, catchRatePrev: 0.49, stay: 20, p75: 0.34, bounce: 0.22, leads: 1 },
  { path: "/cases/oem-bracket", land: 40, pv: 48, catchRate: 0.58, catchRatePrev: 0.57, stay: 40, p75: 0.62, bounce: 0.2, leads: 1 },
  { path: "/contact", land: 28, pv: 31, catchRate: 0.68, catchRatePrev: 0.67, stay: 38, p75: 0.58, bounce: 0.14, leads: 9 },
]);

const L2_SITE = withMeta([
  { path: "/products/cnc-6061-bracket", viewed: 92, interactRate: 0.087, interactRatePrev: 0.09, detailReach: 1, exitShare: 0.41, ctaCount: 1 },
  { path: "/campaign/cnc-oem-q3", viewed: 49, interactRate: 0.082, interactRatePrev: 0.09, detailReach: 0.28, exitShare: 0.44, ctaCount: 1 },
  { path: "/", viewed: 192, interactRate: 0.042, interactRatePrev: 0.043, detailReach: 0.42, exitShare: 0.22, ctaCount: 1 },
  { path: "/blog/cnc-tolerance-guide", viewed: 84, interactRate: 0.024, interactRatePrev: 0.025, detailReach: 0.19, exitShare: 0.38, ctaCount: 0 },
  { path: "/about", viewed: 55, interactRate: 0.145, interactRatePrev: 0.15, detailReach: 0.36, exitShare: 0.18, ctaCount: 0 },
  { path: "/products", viewed: 110, interactRate: 0.045, interactRatePrev: 0.046, detailReach: 0.62, exitShare: 0.18, ctaCount: 0 },
  { path: "/cases/oem-bracket", viewed: 58, interactRate: 0.034, interactRatePrev: 0.035, detailReach: 0.34, exitShare: 0.26, ctaCount: 0 },
  { path: "/contact", viewed: 30, interactRate: 0.4, interactRatePrev: 0.39, detailReach: 0.12, exitShare: 0.08, ctaCount: 2 },
]);

const L3_SITE = withMeta([
  { path: "/products/cnc-6061-bracket", started: 18, formDone: 0.44, formDonePrev: 0.44, chatLead: 0.5, leads: 8 },
  { path: "/campaign/cnc-oem-q3", started: 4, formDone: 0.5, formDonePrev: 0.52, chatLead: 0.4, leads: 4 },
  { path: "/", started: 8, formDone: 0.38, formDonePrev: 0.4, chatLead: 0.42, leads: 6 },
  { path: "/blog/cnc-tolerance-guide", started: 2, formDone: 0.5, formDonePrev: 0.5, chatLead: 0.5, leads: 2 },
  { path: "/about", started: 8, formDone: 0.38, formDonePrev: 0.4, chatLead: 0.5, leads: 3 },
  { path: "/products", started: 5, formDone: 0.4, formDonePrev: 0.42, chatLead: 0.4, leads: 3 },
  { path: "/cases/oem-bracket", started: 2, formDone: 0.5, formDonePrev: 0.5, chatLead: 0.5, leads: 1 },
  { path: "/contact", started: 12, formDone: 0.72, formDonePrev: 0.7, chatLead: 0.6, leads: 11 },
]);

export const PAGES = {
  l1: {
    page: splitChannel(L1_PAGE_SITE, {
      search: {
        "/products/cnc-6061-bracket": { pv: 340, uv: 248, qualifyRate: 0.18, pageStay: 11, p75: 0.14 },
        "/campaign/cnc-oem-q3": { pv: 62, uv: 48, qualifyRate: 0.19, qualifyRatePrev: 0.2, pageStay: 11, p75: 0.16 },
        "/": { pv: 198, uv: 148, qualifyRate: 0.6, pageStay: 34, p75: 0.52 },
        "/blog/cnc-tolerance-guide": { pv: 132, uv: 112, qualifyRate: 0.79, pageStay: 54, p75: 0.76 },
        "/about": { pv: 48, uv: 38, qualifyRate: 0.55, pageStay: 28, p75: 0.46 },
        "/products": { pv: 98, uv: 76, qualifyRate: 0.42, pageStay: 20, p75: 0.34 },
        "/cases/oem-bracket": { pv: 44, uv: 38, qualifyRate: 0.7, pageStay: 42, p75: 0.64 },
        "/contact": { pv: 16, uv: 14, qualifyRate: 0.68, pageStay: 38, p75: 0.58 },
      },
      direct: {
        "/products/cnc-6061-bracket": { pv: 88, uv: 68, qualifyRate: 0.56, pageStay: 38, p75: 0.58 },
        "/campaign/cnc-oem-q3": { pv: 18, uv: 14, qualifyRate: 0.48, pageStay: 28, p75: 0.44 },
        "/": { pv: 155, uv: 118, qualifyRate: 0.64, pageStay: 40, p75: 0.56 },
        "/blog/cnc-tolerance-guide": { pv: 28, uv: 24, qualifyRate: 0.8, pageStay: 56, p75: 0.76 },
        "/about": { pv: 42, uv: 34, qualifyRate: 0.6, pageStay: 34, p75: 0.52 },
        "/products": { pv: 48, uv: 36, qualifyRate: 0.46, pageStay: 24, p75: 0.38 },
        "/cases/oem-bracket": { pv: 20, uv: 16, qualifyRate: 0.72, pageStay: 46, p75: 0.68 },
        "/contact": { pv: 24, uv: 22, qualifyRate: 0.76, pageStay: 44, p75: 0.66 },
      },
      referral: {
        "/products/cnc-6061-bracket": { pv: 108, uv: 82, qualifyRate: 0.32, pageStay: 18, p75: 0.26 },
        "/campaign/cnc-oem-q3": { pv: 24, uv: 18, qualifyRate: 0.4, pageStay: 22, p75: 0.36 },
        "/": { pv: 68, uv: 50, qualifyRate: 0.58, pageStay: 32, p75: 0.5 },
        "/blog/cnc-tolerance-guide": { pv: 34, uv: 28, qualifyRate: 0.76, pageStay: 48, p75: 0.7 },
        "/about": { pv: 16, uv: 12, qualifyRate: 0.54, pageStay: 28, p75: 0.46 },
        "/products": { pv: 32, uv: 24, qualifyRate: 0.44, pageStay: 21, p75: 0.35 },
        "/cases/oem-bracket": { pv: 42, uv: 36, qualifyRate: 0.7, pageStay: 42, p75: 0.64 },
        "/contact": { pv: 8, uv: 6, qualifyRate: 0.7, pageStay: 36, p75: 0.56 },
      },
      ads: {
        "/products/cnc-6061-bracket": { pv: 142, uv: 110, qualifyRate: 0.22, qualifyRatePrev: 0.23, pageStay: 14, p75: 0.2 },
        "/campaign/cnc-oem-q3": { pv: 210, uv: 175, qualifyRate: 0.17, pageStay: 10, p75: 0.15 },
        "/": { pv: 48, uv: 36, qualifyRate: 0.5, pageStay: 28, p75: 0.42 },
        "/blog/cnc-tolerance-guide": { pv: 16, uv: 12, qualifyRate: 0.7, pageStay: 44, p75: 0.62 },
        "/about": { pv: 10, uv: 8, qualifyRate: 0.52, pageStay: 26, p75: 0.4 },
        "/products": { pv: 26, uv: 20, qualifyRate: 0.4, pageStay: 18, p75: 0.3 },
        "/cases/oem-bracket": { pv: 8, uv: 6, qualifyRate: 0.66, pageStay: 38, p75: 0.58 },
        "/contact": { pv: 6, uv: 5, qualifyRate: 0.64, pageStay: 32, p75: 0.5 },
      },
    }),
    land: splitChannel(L1_LAND_SITE, {
      // 搜索：SEO 详情 + 文章 + 列表为主，营销页很少
      search: {
        "/products/cnc-6061-bracket": { land: 310, catchRate: 0.155, stay: 8, p75: 0.11, bounce: 0.72, leads: 1 },
        "/": { land: 165, catchRate: 0.55, stay: 31, p75: 0.5, bounce: 0.24, leads: 2 },
        "/blog/cnc-tolerance-guide": { land: 130, catchRate: 0.62, stay: 51, p75: 0.73, bounce: 0.16, leads: 1 },
        "/products": { land: 70, catchRate: 0.48, stay: 20, p75: 0.34, bounce: 0.22, leads: 0 },
        "/about": { land: 50, catchRate: 0.52, stay: 26, p75: 0.44, bounce: 0.28, leads: 1 },
        "/campaign/cnc-oem-q3": { land: 40, catchRate: 0.168, catchRatePrev: 0.17, stay: 9, p75: 0.14, bounce: 0.68, leads: 0 },
        "/cases/oem-bracket": { land: 15, catchRate: 0.58, stay: 40, p75: 0.62, bounce: 0.2, leads: 0 },
      },
      // 直接访问：书签首页/关于/询价，几乎不落营销页
      direct: {
        "/": { land: 140, catchRate: 0.63, stay: 36, p75: 0.54, bounce: 0.18, leads: 3 },
        "/products/cnc-6061-bracket": { land: 55, catchRate: 0.54, stay: 29, p75: 0.55, bounce: 0.2, leads: 1 },
        "/about": { land: 40, catchRate: 0.6, stay: 32, p75: 0.5, bounce: 0.2, leads: 2 },
        "/products": { land: 25, catchRate: 0.5, stay: 22, p75: 0.36, bounce: 0.2, leads: 0 },
        "/contact": { land: 20, catchRate: 0.72, stay: 40, p75: 0.6, bounce: 0.12, leads: 5 },
        "/blog/cnc-tolerance-guide": { land: 10, catchRate: 0.64, stay: 46, p75: 0.7, bounce: 0.16, leads: 0 },
      },
      // 外链：详情 + 案例目录站为主
      referral: {
        "/products/cnc-6061-bracket": { land: 80, catchRate: 0.28, stay: 12, p75: 0.2, bounce: 0.52, leads: 1 },
        "/cases/oem-bracket": { land: 45, catchRate: 0.58, stay: 40, p75: 0.62, bounce: 0.2, leads: 1 },
        "/": { land: 40, catchRate: 0.58, stay: 32, p75: 0.5, bounce: 0.22, leads: 1 },
        "/blog/cnc-tolerance-guide": { land: 25, catchRate: 0.6, stay: 44, p75: 0.68, bounce: 0.18, leads: 0 },
        "/about": { land: 12, catchRate: 0.5, stay: 27, p75: 0.46, bounce: 0.26, leads: 0 },
        "/campaign/cnc-oem-q3": { land: 8, catchRate: 0.4, stay: 20, p75: 0.34, bounce: 0.32, leads: 0 },
      },
      // 广告：营销落地页第一，一部分仍投到铝支架详情
      ads: {
        "/campaign/cnc-oem-q3": { land: 210, catchRate: 0.147, stay: 8, p75: 0.13, bounce: 0.71, leads: 1 },
        "/products/cnc-6061-bracket": { land: 120, catchRate: 0.2, catchRatePrev: 0.21, stay: 10, p75: 0.16, bounce: 0.62, leads: 1 },
        "/": { land: 28, catchRate: 0.49, stay: 26, p75: 0.4, bounce: 0.3, leads: 0 },
        "/products": { land: 12, catchRate: 0.4, stay: 16, p75: 0.28, bounce: 0.28, leads: 0 },
      },
    }, { onlyPatched: true }),
  },
  l2: splitChannel(L2_SITE, {
    search: {
      "/products/cnc-6061-bracket": { viewed: 48, interactRate: 0.06, detailReach: 1, exitShare: 0.52 },
      "/campaign/cnc-oem-q3": { viewed: 12, interactRate: 0.05, detailReach: 0.22, exitShare: 0.42 },
      "/": { viewed: 88, interactRate: 0.03, detailReach: 0.38, exitShare: 0.26 },
      "/blog/cnc-tolerance-guide": { viewed: 62, interactRate: 0.016, detailReach: 0.22, exitShare: 0.48 },
      "/about": { viewed: 22, interactRate: 0.12, detailReach: 0.32, exitShare: 0.22 },
      "/products": { viewed: 40, interactRate: 0.04, detailReach: 0.58, exitShare: 0.2 },
      "/cases/oem-bracket": { viewed: 26, interactRate: 0.03, detailReach: 0.3, exitShare: 0.28 },
      "/contact": { viewed: 10, interactRate: 0.36, detailReach: 0.12, exitShare: 0.1 },
    },
    direct: {
      "/products/cnc-6061-bracket": { viewed: 38, interactRate: 0.16, detailReach: 1, exitShare: 0.18 },
      "/campaign/cnc-oem-q3": { viewed: 5, interactRate: 0.14, detailReach: 0.4, exitShare: 0.2 },
      "/": { viewed: 58, interactRate: 0.06, detailReach: 0.5, exitShare: 0.16 },
      "/blog/cnc-tolerance-guide": { viewed: 22, interactRate: 0.05, detailReach: 0.36, exitShare: 0.22 },
      "/about": { viewed: 20, interactRate: 0.18, detailReach: 0.42, exitShare: 0.12 },
      "/products": { viewed: 28, interactRate: 0.07, detailReach: 0.7, exitShare: 0.15 },
      "/cases/oem-bracket": { viewed: 14, interactRate: 0.05, detailReach: 0.4, exitShare: 0.22 },
      "/contact": { viewed: 12, interactRate: 0.5, detailReach: 0.14, exitShare: 0.05 },
    },
    referral: {
      "/products/cnc-6061-bracket": { viewed: 22, interactRate: 0.09, detailReach: 1, exitShare: 0.28 },
      "/campaign/cnc-oem-q3": { viewed: 4, interactRate: 0.08, detailReach: 0.3, exitShare: 0.28 },
      "/": { viewed: 28, interactRate: 0.04, detailReach: 0.4, exitShare: 0.2 },
      "/blog/cnc-tolerance-guide": { viewed: 18, interactRate: 0.03, detailReach: 0.28, exitShare: 0.33 },
      "/about": { viewed: 8, interactRate: 0.14, detailReach: 0.35, exitShare: 0.16 },
      "/products": { viewed: 16, interactRate: 0.06, detailReach: 0.6, exitShare: 0.18 },
      "/cases/oem-bracket": { viewed: 12, interactRate: 0.04, detailReach: 0.35, exitShare: 0.24 },
      "/contact": { viewed: 4, interactRate: 0.4, detailReach: 0.1, exitShare: 0.08 },
    },
    ads: {
      "/products/cnc-6061-bracket": { viewed: 20, interactRate: 0.08, detailReach: 1, exitShare: 0.36 },
      "/campaign/cnc-oem-q3": { viewed: 30, interactRate: 0.03, interactRatePrev: 0.11, detailReach: 0.25, exitShare: 0.55 },
      "/": { viewed: 18, interactRate: 0.03, detailReach: 0.28, exitShare: 0.3 },
      "/blog/cnc-tolerance-guide": { viewed: 12, interactRate: 0.02, detailReach: 0.15, exitShare: 0.4 },
      "/about": { viewed: 5, interactRate: 0.12, detailReach: 0.28, exitShare: 0.24 },
      "/products": { viewed: 18, interactRate: 0.04, detailReach: 0.5, exitShare: 0.22 },
      "/cases/oem-bracket": { viewed: 6, interactRate: 0.03, detailReach: 0.28, exitShare: 0.3 },
      "/contact": { viewed: 4, interactRate: 0.32, detailReach: 0.1, exitShare: 0.12 },
    },
  }),
  l3: splitChannel(L3_SITE, {
    search: {
      "/products/cnc-6061-bracket": { started: 8, formDone: 0.38, chatLead: 0.42 },
      "/campaign/cnc-oem-q3": { started: 1, formDone: 0.46, chatLead: 0.35 },
      "/": { started: 3, formDone: 0.33, chatLead: 0.38 },
      "/blog/cnc-tolerance-guide": { started: 1, formDone: 0.5, chatLead: 0.5 },
      "/about": { started: 3, formDone: 0.33, chatLead: 0.45 },
      "/products": { started: 2, formDone: 0.38, chatLead: 0.35 },
      "/cases/oem-bracket": { started: 1, formDone: 0.5, chatLead: 0.5 },
      "/contact": { started: 4, formDone: 0.68, chatLead: 0.55 },
    },
    direct: {
      "/products/cnc-6061-bracket": { started: 6, formDone: 0.5, chatLead: 0.55 },
      "/campaign/cnc-oem-q3": { started: 1, formDone: 0.55, chatLead: 0.5 },
      "/": { started: 3, formDone: 0.42, chatLead: 0.48 },
      "/blog/cnc-tolerance-guide": { started: 1, formDone: 0.5, chatLead: 0.5 },
      "/about": { started: 3, formDone: 0.42, chatLead: 0.55 },
      "/products": { started: 2, formDone: 0.45, chatLead: 0.45 },
      "/cases/oem-bracket": { started: 1, formDone: 0.5, chatLead: 0.5 },
      "/contact": { started: 5, formDone: 0.76, chatLead: 0.65 },
    },
    referral: {
      "/products/cnc-6061-bracket": { started: 3, formDone: 0.46, chatLead: 0.5 },
      "/campaign/cnc-oem-q3": { started: 1, formDone: 0.5, chatLead: 0.4 },
      "/": { started: 1, formDone: 0.38, chatLead: 0.4 },
      "/blog/cnc-tolerance-guide": { started: 1, formDone: 0.5, chatLead: 0.5 },
      "/about": { started: 1, formDone: 0.38, chatLead: 0.5 },
      "/products": { started: 1, formDone: 0.4, chatLead: 0.4 },
      "/cases/oem-bracket": { started: 1, formDone: 0.5, chatLead: 0.5 },
      "/contact": { started: 2, formDone: 0.7, chatLead: 0.58 },
    },
    ads: {
      "/products/cnc-6061-bracket": { started: 4, formDone: 0.33, chatLead: 0.4 },
      "/campaign/cnc-oem-q3": { started: 1, formDone: 0.4, chatLead: 0.3 },
      "/": { started: 1, formDone: 0.3, chatLead: 0.35 },
      "/blog/cnc-tolerance-guide": { started: 1, formDone: 0.5, chatLead: 0.4 },
      "/about": { started: 1, formDone: 0.35, chatLead: 0.4 },
      "/products": { started: 1, formDone: 0.35, chatLead: 0.35 },
      "/cases/oem-bracket": { started: 1, formDone: 0.5, chatLead: 0.4 },
      "/contact": { started: 1, formDone: 0.65, chatLead: 0.5 },
    },
  }),
};

const PAGES_INTENT = {
  browse: {
    l1: {
      page: withMeta([
        { path: "/products/cnc-6061-bracket", qualifyRate: 0.16, qualifyRatePrev: 0.52, pageStay: 10, p75: 0.14 },
        { path: "/campaign/cnc-oem-q3", qualifyRate: 0.18, qualifyRatePrev: 0.24, pageStay: 11, p75: 0.16 },
        { path: "/", qualifyRate: 0.41, qualifyRatePrev: 0.44, pageStay: 18, p75: 0.28 },
      ]),
      land: withMeta([
        { path: "/products/cnc-6061-bracket", land: 360, catchRate: 0.14, catchRatePrev: 0.48, stay: 8, p75: 0.12, bounce: 0.72 },
        { path: "/campaign/cnc-oem-q3", land: 140, catchRate: 0.16, catchRatePrev: 0.22, stay: 9, p75: 0.15, bounce: 0.68 },
        { path: "/", land: 80, catchRate: 0.38, catchRatePrev: 0.4, stay: 16, p75: 0.26, bounce: 0.42 },
      ]),
    },
    l2: withMeta([
      { path: "/products/cnc-6061-bracket", viewed: 18, interactRate: 0.02, interactRatePrev: 0.03, detailReach: 1, exitShare: 0.7, ctaCount: 1 },
      { path: "/campaign/cnc-oem-q3", viewed: 8, interactRate: 0.01, interactRatePrev: 0.02, detailReach: 0.2, exitShare: 0.72, ctaCount: 1 },
      { path: "/", viewed: 12, interactRate: 0.02, interactRatePrev: 0.02, detailReach: 0.25, exitShare: 0.55, ctaCount: 1 },
    ]),
    l3: withMeta([
      { path: "/products/cnc-6061-bracket", started: 2, formDone: 0, formDonePrev: 0.2, chatLead: 0, leads: 0 },
      { path: "/campaign/cnc-oem-q3", started: 0, formDone: 0, formDonePrev: 0.1, chatLead: 0, leads: 0 },
      { path: "/", started: 0, formDone: 0, formDonePrev: 0.1, chatLead: 0, leads: 0 },
    ]),
  },
  explore: {
    l1: {
      page: withMeta([
        { path: "/blog/cnc-tolerance-guide", qualifyRate: 0.78, qualifyRatePrev: 0.77, pageStay: 52, p75: 0.74 },
        { path: "/cases/oem-bracket", qualifyRate: 0.71, qualifyRatePrev: 0.7, pageStay: 44, p75: 0.66 },
        { path: "/products/cnc-6061-bracket", qualifyRate: 0.36, qualifyRatePrev: 0.38, pageStay: 22, p75: 0.3 },
      ]),
      land: withMeta([
        { path: "/blog/cnc-tolerance-guide", land: 210, catchRate: 0.62, catchRatePrev: 0.63, stay: 48, p75: 0.71, bounce: 0.16 },
        { path: "/cases/oem-bracket", land: 90, catchRate: 0.58, catchRatePrev: 0.57, stay: 40, p75: 0.62, bounce: 0.2 },
        { path: "/products/cnc-6061-bracket", land: 140, catchRate: 0.34, catchRatePrev: 0.36, stay: 18, p75: 0.26, bounce: 0.38 },
      ]),
    },
    l2: withMeta([
      { path: "/blog/cnc-tolerance-guide", viewed: 96, interactRate: 0.02, interactRatePrev: 0.025, detailReach: 0.22, exitShare: 0.46, ctaCount: 0 },
      { path: "/cases/oem-bracket", viewed: 48, interactRate: 0.03, interactRatePrev: 0.03, detailReach: 0.31, exitShare: 0.28, ctaCount: 0 },
      { path: "/products/cnc-6061-bracket", viewed: 62, interactRate: 0.05, interactRatePrev: 0.06, detailReach: 1, exitShare: 0.36, ctaCount: 1 },
    ]),
    l3: withMeta([
      { path: "/products/cnc-6061-bracket", started: 8, formDone: 0.38, formDonePrev: 0.4, chatLead: 0.4, leads: 3 },
      { path: "/blog/cnc-tolerance-guide", started: 2, formDone: 0.5, formDonePrev: 0.5, chatLead: 0.5, leads: 1 },
      { path: "/cases/oem-bracket", started: 2, formDone: 0.5, formDonePrev: 0.5, chatLead: 0.5, leads: 1 },
    ]),
  },
  compare: {
    l1: {
      page: withMeta([
        { path: "/products/cnc-6061-bracket", qualifyRate: 0.54, qualifyRatePrev: 0.56, pageStay: 34, p75: 0.46 },
        { path: "/products/cnc-ti-bracket", qualifyRate: 0.51, qualifyRatePrev: 0.52, pageStay: 32, p75: 0.44 },
        { path: "/products/cnc-ss-bracket", qualifyRate: 0.48, qualifyRatePrev: 0.5, pageStay: 30, p75: 0.42 },
        { path: "/products", qualifyRate: 0.4, qualifyRatePrev: 0.41, pageStay: 22, p75: 0.36 },
      ]),
      land: withMeta([
        { path: "/products/cnc-6061-bracket", land: 110, catchRate: 0.52, catchRatePrev: 0.54, stay: 28, p75: 0.42, bounce: 0.18 },
        { path: "/products", land: 80, catchRate: 0.48, catchRatePrev: 0.49, stay: 20, p75: 0.34, bounce: 0.22 },
        { path: "/products/cnc-ti-bracket", land: 55, catchRate: 0.5, catchRatePrev: 0.51, stay: 26, p75: 0.4, bounce: 0.2 },
        { path: "/products/cnc-ss-bracket", land: 48, catchRate: 0.46, catchRatePrev: 0.48, stay: 24, p75: 0.38, bounce: 0.22 },
      ]),
    },
    l2: withMeta([
      { path: "/products/cnc-6061-bracket", viewed: 88, interactRate: 0.07, interactRatePrev: 0.08, detailReach: 1, exitShare: 0.34, ctaCount: 1 },
      { path: "/products/cnc-ti-bracket", viewed: 72, interactRate: 0.05, interactRatePrev: 0.06, detailReach: 1, exitShare: 0.3, ctaCount: 1 },
      { path: "/products/cnc-ss-bracket", viewed: 61, interactRate: 0.04, interactRatePrev: 0.05, detailReach: 1, exitShare: 0.28, ctaCount: 1 },
      { path: "/products", viewed: 48, interactRate: 0.04, interactRatePrev: 0.041, detailReach: 0.58, exitShare: 0.2, ctaCount: 0 },
    ]),
    l3: withMeta([
      { path: "/products/cnc-6061-bracket", started: 10, formDone: 0.4, formDonePrev: 0.42, chatLead: 0.45, leads: 4 },
      { path: "/products/cnc-ti-bracket", started: 4, formDone: 0.38, formDonePrev: 0.4, chatLead: 0.4, leads: 2 },
      { path: "/products/cnc-ss-bracket", started: 3, formDone: 0.36, formDonePrev: 0.38, chatLead: 0.4, leads: 1 },
      { path: "/products", started: 4, formDone: 0.4, formDonePrev: 0.42, chatLead: 0.4, leads: 2 },
    ]),
  },
  decide: {
    l1: {
      page: withMeta([
        { path: "/about", qualifyRate: 0.74, qualifyRatePrev: 0.73, pageStay: 46, p75: 0.68 },
        { path: "/products/cnc-6061-bracket", qualifyRate: 0.62, qualifyRatePrev: 0.63, pageStay: 52, p75: 0.58 },
        { path: "/campaign/cnc-oem-q3", qualifyRate: 0.5, qualifyRatePrev: 0.51, pageStay: 28, p75: 0.4 },
      ]),
      land: withMeta([
        { path: "/about", land: 70, catchRate: 0.71, catchRatePrev: 0.7, stay: 42, p75: 0.64, bounce: 0.12 },
        { path: "/products/cnc-6061-bracket", land: 86, catchRate: 0.58, catchRatePrev: 0.6, stay: 36, p75: 0.5, bounce: 0.16 },
        { path: "/campaign/cnc-oem-q3", land: 32, catchRate: 0.47, catchRatePrev: 0.48, stay: 24, p75: 0.36, bounce: 0.22 },
      ]),
    },
    l2: withMeta([
      { path: "/about", viewed: 58, interactRate: 0.12, interactRatePrev: 0.13, detailReach: 0.62, exitShare: 0.18, ctaCount: 0 },
      { path: "/products/cnc-6061-bracket", viewed: 64, interactRate: 0.28, interactRatePrev: 0.29, detailReach: 1, exitShare: 0.14, ctaCount: 1 },
      { path: "/campaign/cnc-oem-q3", viewed: 22, interactRate: 0.18, interactRatePrev: 0.19, detailReach: 0.4, exitShare: 0.16, ctaCount: 1 },
    ]),
    l3: withMeta([
      { path: "/products/cnc-6061-bracket", started: 22, formDone: 0.48, formDonePrev: 0.5, chatLead: 0.55, leads: 10 },
      { path: "/about", started: 8, formDone: 0.38, formDonePrev: 0.4, chatLead: 0.5, leads: 3 },
      { path: "/campaign/cnc-oem-q3", started: 4, formDone: 0.5, formDonePrev: 0.52, chatLead: 0.5, leads: 2 },
    ]),
  },
};

export const PAGE_COLS = {
  l1: {
    page: [
      { key: "pv", label: "浏览次数PV" },
      { key: "uv", label: "独立访客UV" },
      { key: "pageStay", label: "页面平均停留时长", fmt: "sec" },
      { key: "qualifyRate", label: "合格浏览率", fmt: "pct", prevKey: "qualifyRatePrev" },
      { key: "p75", label: "平均滚动深度", fmt: "pct" },
    ],
    land: [
      { key: "pv", label: "浏览次数PV" },
      { key: "uv", label: "独立访客UV" },
      { key: "bounceUv", label: "秒退访客数" },
      { key: "bounce", label: "秒退率", fmt: "pct" },
      { key: "catchRate", label: "落地接住率", fmt: "pct", prevKey: "catchRatePrev" },
      { key: "stay", label: "落地平均停留时长", fmt: "sec" },
      { key: "p75", label: "平均滚动深度", fmt: "pct" },
      { key: "leads", label: "落地页留资数" },
    ],
  },
  l2: [
    { key: "viewed", label: "有效浏览访客" },
    { key: "interactRate", label: "页面转化交互率", fmt: "pct", prevKey: "interactRatePrev" },
  ],
  l3: [
    { key: "started", label: "开始交互访客" },
    { key: "formDone", label: "表单完成率", fmt: "pct", prevKey: "formDonePrev" },
    { key: "chatLead", label: "开聊留资率", fmt: "pct" },
    { key: "leads", label: "页面留资数" },
  ],
};

/** 页面名称是主键。页面概览合并流失点 1/2/3 的页指标；落地页概览只放进站第一页口径。 */
export const PAGE_ID_COLS = [
  { key: "name", label: "页面名称" },
  { key: "url", label: "url", fmt: "url" },
  { key: "type", label: "页面类型" },
];

export const PAGE_CATALOG_COLS = {
  page: [
    { key: "pv", label: "浏览次数PV" },
    { key: "uv", label: "独立访客UV" },
    { key: "pageStay", label: "页面平均停留时长", fmt: "sec" },
    { key: "qualifyRate", label: "合格浏览率", fmt: "pct", prevKey: "qualifyRatePrev" },
    { key: "p75", label: "平均滚动深度", fmt: "pct" },
    { key: "viewed", label: "有效浏览访客" },
    { key: "interactRate", label: "页面转化交互率", fmt: "pct", prevKey: "interactRatePrev" },
    { key: "started", label: "开始交互访客" },
    { key: "formDone", label: "表单完成率", fmt: "pct", prevKey: "formDonePrev" },
    { key: "chatLead", label: "开聊留资率", fmt: "pct" },
    { key: "pageLeads", label: "页面留资数" },
  ],
  land: [
    { key: "landPv", label: "浏览次数PV" },
    { key: "landUv", label: "独立访客UV" },
    { key: "bounceUv", label: "秒退访客数" },
    { key: "bounce", label: "秒退率", fmt: "pct" },
    { key: "catchRate", label: "落地接住率", fmt: "pct", prevKey: "catchRatePrev" },
    { key: "landStay", label: "落地平均停留时长", fmt: "sec" },
    { key: "landP75", label: "平均滚动深度", fmt: "pct" },
    { key: "landLeads", label: "落地页留资数" },
  ],
};

export const PAGE_METRIC_GROUPS = {
  page: [
    { label: "浏览", keys: ["pv", "uv", "pageStay", "qualifyRate", "p75"] },
    { label: "转化", keys: ["viewed", "interactRate"] },
    { label: "留资", keys: ["started", "formDone", "chatLead", "pageLeads"] },
  ],
  land: [{ label: "落地", keys: PAGE_CATALOG_COLS.land.map((col) => col.key) }],
};

/** 访客搜索词：主键是搜索词，不接到人。来源各自一套指标。 */
export const SEARCH_TERM_SOURCES = [
  {
    key: "all",
    label: "全部",
    authKey: null,
    hint: "只列搜索词和来源。站内搜索、自然搜索、广告的指标口径不一样，不能揉成次数/覆盖/效率来比，点对应来源看。",
  },
  {
    key: "site",
    label: "站内搜索",
    authKey: "site",
    hint: "站内搜索事件。期内站点搜索结果没改时，一个词要么全是 0 结果，要么全不是。搜后去了哪一页一期追不到。",
  },
  {
    key: "gsc",
    label: "Google 自然搜索",
    authKey: "gsc",
    hint: "Search Console 按查询词的展示、点击、排名。一期不按词指定落地页。",
  },
  {
    key: "ads",
    label: "谷歌广告",
    authKey: "ads",
    hint: "广告实际搜索词的点击、展示、花费。搜索词对不上唯一落地 URL。",
  },
];

const SOURCE_RANK = { site: 0, gsc: 1, ads: 2 };

export const SEARCH_TERM_COLS = {
  all: [
    { key: "term", label: "搜索词" },
    { key: "sourceLabel", label: "来源" },
  ],
  site: [
    { key: "term", label: "搜索词" },
    { key: "searches", label: "搜索次数" },
    { key: "uv", label: "搜过该词访客" },
    { key: "zeroHits", label: "0结果次数" },
    { key: "zeroRate", label: "0结果率", fmt: "pct" },
    { key: "leaveRate", label: "搜后离站率", fmt: "pct" },
  ],
  gsc: [
    { key: "term", label: "搜索词" },
    { key: "clicks", label: "点击" },
    { key: "impressions", label: "展示" },
    { key: "ctr", label: "CTR", fmt: "pct" },
    { key: "position", label: "平均排名", fmt: "pos" },
  ],
  ads: [
    { key: "term", label: "搜索词" },
    { key: "clicks", label: "点击" },
    { key: "impressions", label: "展示" },
    { key: "ctr", label: "CTR", fmt: "pct" },
    { key: "cost", label: "花费", fmt: "money" },
  ],
};

export const SEARCH_TERMS = [
  {
    source: "site",
    term: "cnc aluminum quote",
    searches: 12,
    uv: 9,
    zeroHits: 0,
    leaveUv: 3,
  },
  {
    source: "site",
    term: "custom bracket drawing dwg",
    searches: 9,
    uv: 6,
    zeroHits: 9,
    leaveUv: 5,
  },
  {
    source: "site",
    term: "6061 bracket drawing",
    searches: 8,
    uv: 5,
    zeroHits: 0,
    leaveUv: 1,
  },
  {
    source: "site",
    term: "titanium bracket",
    searches: 6,
    uv: 4,
    zeroHits: 0,
    leaveUv: 1,
  },
  {
    source: "site",
    term: "stainless bracket",
    searches: 5,
    uv: 3,
    zeroHits: 0,
    leaveUv: 1,
  },
  {
    source: "site",
    term: "anodizing thickness 6061",
    searches: 4,
    uv: 3,
    zeroHits: 4,
    leaveUv: 2,
  },
  {
    source: "site",
    term: "iso 9001 certificate download",
    searches: 3,
    uv: 3,
    zeroHits: 3,
    leaveUv: 1,
  },
  {
    source: "site",
    term: "48 hour sample",
    searches: 3,
    uv: 3,
    zeroHits: 0,
    leaveUv: 1,
  },
  {
    source: "gsc",
    term: "cnc aluminum bracket oem",
    clicks: 86,
    impressions: 1240,
    position: 8.4,
  },
  {
    source: "gsc",
    term: "6061 bracket manufacturer",
    clicks: 54,
    impressions: 980,
    position: 11.2,
  },
  {
    source: "gsc",
    term: "cnc machining quote",
    clicks: 42,
    impressions: 890,
    position: 12.1,
  },
  {
    source: "gsc",
    term: "precision cnc parts oem china",
    clicks: 31,
    impressions: 760,
    position: 14.8,
  },
  {
    source: "gsc",
    term: "custom cnc machining",
    clicks: 22,
    impressions: 1100,
    position: 18.3,
  },
  {
    source: "gsc",
    term: "aluminum bracket drawing",
    clicks: 18,
    impressions: 420,
    position: 9.6,
  },
  {
    source: "ads",
    term: "cnc machining quote",
    clicks: 128,
    impressions: 4100,
    cost: 186,
  },
  {
    source: "ads",
    term: "aluminum bracket oem",
    clicks: 76,
    impressions: 2200,
    cost: 94,
  },
  {
    source: "ads",
    term: "request cnc quote",
    clicks: 55,
    impressions: 960,
    cost: 71,
  },
  {
    source: "ads",
    term: "cnc parts manufacturer china",
    clicks: 41,
    impressions: 1800,
    cost: 62,
  },
];

function enrichSearchTerm(row) {
  const source = SEARCH_TERM_SOURCES.find((item) => item.key === row.source);
  const searches = row.searches ?? null;
  const uv = row.uv ?? null;
  const clicks = row.clicks ?? null;
  const impressions = row.impressions ?? null;
  const zeroRate = searches ? (row.zeroHits || 0) / searches : null;
  const leaveRate = uv ? (row.leaveUv || 0) / uv : null;
  const ctr = impressions ? clicks / impressions : null;
  return {
    ...row,
    id: `${row.source}::${row.term}`,
    sourceLabel: source?.label ?? row.source,
    sourceRank: SOURCE_RANK[row.source] ?? 9,
    zeroRate,
    leaveRate,
    ctr,
  };
}

export function searchTermRows(sourceKey, authMap) {
  const rows = SEARCH_TERMS.filter((row) => {
    if (sourceKey && sourceKey !== "all" && row.source !== sourceKey) return false;
    if (authMap && authMap[row.source] === false) return false;
    return true;
  }).map(enrichSearchTerm);
  if (sourceKey === "all") {
    return rows.sort(
      (a, b) => a.sourceRank - b.sourceRank || a.term.localeCompare(b.term),
    );
  }
  return rows.sort(
    (a, b) => (b.searches ?? b.clicks ?? 0) - (a.searches ?? a.clicks ?? 0),
  );
}

export const VISITORS = [
  {
    id: "v01",
    depth: "browse",
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
    depth: "browse",
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
    depth: "browse",
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
    depth: "explore",
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
    depth: "decide",
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
    depth: "decide",
    churn: true,
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
    depth: "decide",
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
    depth: "browse",
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
    depth: "explore",
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
    depth: "decide",
    churn: true,
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
  {
    id: "v11",
    depth: "compare",
    channel: "search",
    loss: "l2",
    tag: "看了没动手",
    ip: "62.210.16.72",
    company: "Seine Drive Components",
    inbound: "cnc bracket 6061 vs titanium",
    siteSearch: ["titanium bracket", "stainless bracket"],
    land: "/products/cnc-6061-bracket",
    pages: [
      { path: "/products/cnc-6061-bracket", name: "CNC-6061 铝支架", stay: 38, scroll: 0.42 },
      { path: "/products/cnc-ti-bracket", name: "钛合金支架详情", stay: 44, scroll: 0.51 },
      { path: "/products/cnc-6061-bracket", name: "CNC-6061 铝支架", stay: 26, scroll: 0.3 },
      { path: "/products/cnc-ss-bracket", name: "不锈钢支架详情", stay: 41, scroll: 0.48 },
      { path: "/products/cnc-ti-bracket", name: "钛合金支架详情", stay: 22, scroll: 0.28 },
    ],
    caught: true,
    viewed: true,
    bounced: false,
    interacted: false,
    led: false,
    note: "三个型号来回切，没有对比页帮他选。比较型 × 产品详情 = 在比产品。",
  },
  {
    id: "v12",
    depth: "explore",
    channel: "search",
    loss: "l2",
    tag: "看了没动手",
    ip: "81.17.28.44",
    company: "Nordic Fixture AB",
    inbound: "cnc machining case study",
    siteSearch: [],
    land: "/blog/cnc-tolerance-guide",
    pages: [
      { path: "/blog/cnc-tolerance-guide", name: "公差指南文章", stay: 62, scroll: 0.76 },
      { path: "/cases/oem-bracket", name: "OEM 支架交付案例", stay: 48, scroll: 0.68 },
      { path: "/products/cnc-6061-bracket", name: "CNC-6061 铝支架", stay: 21, scroll: 0.24 },
    ],
    caught: true,
    viewed: true,
    bounced: false,
    interacted: false,
    led: false,
    note: "指南和案例都读完了，进详情只扫了下半屏。探索型 × 资讯/案例 = 在了解行业。",
  },
  {
    id: "v13",
    depth: "decide",
    channel: "search",
    loss: "l2",
    tag: "看了没动手",
    ip: "45.77.12.190",
    company: "Harbor OEM LLC",
    inbound: "cnc factory iso9001",
    siteSearch: [],
    land: "/about",
    pages: [
      { path: "/about", name: "关于我们", stay: 54, scroll: 0.72 },
      { path: "/products/cnc-6061-bracket", name: "CNC-6061 铝支架", stay: 33, scroll: 0.4 },
    ],
    caught: true,
    viewed: true,
    bounced: false,
    interacted: false,
    led: false,
    note: "先核资质再回详情。决策型 × 关于/资质 = 在确认供应商，这一次还没动手。",
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

export function visitorDepth(visitor) {
  return visitor.depth || "browse";
}

export function visitorsListed(channelId, layerId, intentId) {
  return VISITORS.filter((v) => {
    if (channelId !== "site" && v.channel !== channelId) return false;
    if (layerId && arrivedLayer(v) !== layerId) return false;
    if (intentId && visitorDepth(v) !== intentId) return false;
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

function fillOverviewMetrics(row) {
  const uv = row.uv ?? row.land ?? row.viewed ?? 100;
  const pv = row.pv ?? Math.round(uv * 1.16);
  const bounceUv =
    row.bounceUv ??
    (typeof row.bounce === "number" ? Math.round(uv * row.bounce) : undefined);
  return { ...row, uv, pv, bounceUv, leads: row.leads ?? 0 };
}

export function pagesFor(lossId, slice = "page", channelId = "site", intentId = null) {
  let rows = [];
  if (intentId) {
    const pack = PAGES_INTENT[intentId]?.[lossId];
    if (pack) {
      if (lossId === "l1") {
        rows = pack[slice] || pack.page || [];
      } else {
        rows = Array.isArray(pack) ? pack : [];
      }
    }
  }
  if (!rows.length) {
    const pack = PAGES[lossId];
    if (!pack) return [];
    const ch = channelId || "site";
    if (lossId === "l1") {
      const group = pack[slice] || pack.page;
      rows = group ? group[ch] || group.site || [] : [];
    } else if (Array.isArray(pack)) {
      rows = pack;
    } else {
      rows = pack[ch] || pack.site || [];
    }
  }
  return rows.map(fillOverviewMetrics);
}

export function pageColsFor(lossId, slice = "page") {
  const cols = PAGE_COLS[lossId];
  if (!cols) return [];
  if (Array.isArray(cols)) return cols;
  return cols[slice] || [];
}

function mergeCatalogRow(map, row, extra) {
  const prev = map.get(row.path) || {
    path: row.path,
    name: row.name,
    url: row.url,
    type: row.type,
  };
  map.set(row.path, {
    ...prev,
    name: row.name || prev.name,
    url: row.url || prev.url,
    type: row.type || prev.type,
    ...extra,
  });
}

/** 按页面名称/path 合并各流失点页指标，缺的格子空着。 */
export function catalogRows(slice = "page", channelId = "site", intentId = null) {
  const map = new Map();
  pagesFor("l1", "page", channelId, intentId).forEach((row) => {
    mergeCatalogRow(map, row, {
      pv: row.pv,
      uv: row.uv,
      pageStay: row.pageStay,
      qualifyRate: row.qualifyRate,
      qualifyRatePrev: row.qualifyRatePrev,
      p75: row.p75,
      pageLeads: row.leads,
    });
  });
  pagesFor("l1", "land", channelId, intentId).forEach((row) => {
    mergeCatalogRow(map, row, {
      landPv: row.pv,
      landUv: row.uv ?? row.land,
      bounceUv: row.bounceUv,
      bounce: row.bounce,
      catchRate: row.catchRate,
      catchRatePrev: row.catchRatePrev,
      landStay: row.stay,
      landP75: row.p75,
      landLeads: row.leads,
    });
  });
  pagesFor("l2", "page", channelId, intentId).forEach((row) => {
    mergeCatalogRow(map, row, {
      viewed: row.viewed,
      interactRate: row.interactRate,
      interactRatePrev: row.interactRatePrev,
      detailReach: row.detailReach,
      exitShare: row.exitShare,
      ctaCount: row.ctaCount,
    });
  });
  pagesFor("l3", "page", channelId, intentId).forEach((row) => {
    mergeCatalogRow(map, row, {
      started: row.started,
      formDone: row.formDone,
      formDonePrev: row.formDonePrev,
      chatLead: row.chatLead,
      pageLeads: row.leads ?? row.pageLeads,
    });
  });
  let rows = [...map.values()];
  if (slice === "land") {
    rows = rows.filter((row) => row.landUv != null || row.landPv != null);
  }
  return rows.sort((a, b) => {
    const primary = slice === "land" ? "landUv" : "uv";
    const secondary = slice === "land" ? "landPv" : "landUv";
    return (b[primary] || b[secondary] || 0) - (a[primary] || a[secondary] || 0);
  });
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
      页面平均停留时长: { v: 22, fmt: "sec" },
      平均滚动深度: { v: 0.28, fmt: "pct" },
      落地接住率: { v: 0.33, fmt: "pct" },
      落地平均停留时长: { v: 18, fmt: "sec" },
      秒退率: { v: 0.42, fmt: "pct" },
    },
    search: {
      合格浏览率: { v: 0.28, fmt: "pct" },
      页面平均停留时长: { v: 16, fmt: "sec" },
      平均滚动深度: { v: 0.18, fmt: "pct" },
      落地接住率: { v: 0.24, fmt: "pct" },
      落地平均停留时长: { v: 11, fmt: "sec" },
      秒退率: { v: 0.55, fmt: "pct" },
    },
    direct: {
      合格浏览率: { v: 0.6, fmt: "pct" },
      页面平均停留时长: { v: 36, fmt: "sec" },
      平均滚动深度: { v: 0.5, fmt: "pct" },
      落地接住率: { v: 0.58, fmt: "pct" },
      落地平均停留时长: { v: 33, fmt: "sec" },
      秒退率: { v: 0.21, fmt: "pct" },
    },
    referral: {
      合格浏览率: { v: 0.42, fmt: "pct" },
      页面平均停留时长: { v: 24, fmt: "sec" },
      平均滚动深度: { v: 0.36, fmt: "pct" },
      落地接住率: { v: 0.4, fmt: "pct" },
      落地平均停留时长: { v: 22, fmt: "sec" },
      秒退率: { v: 0.36, fmt: "pct" },
    },
    ads: {
      合格浏览率: { v: 0.26, fmt: "pct" },
      页面平均停留时长: { v: 15, fmt: "sec" },
      平均滚动深度: { v: 0.2, fmt: "pct" },
      落地接住率: { v: 0.22, fmt: "pct" },
      落地平均停留时长: { v: 12, fmt: "sec" },
      秒退率: { v: 0.54, fmt: "pct" },
    },
    browse: {
      合格浏览率: { v: 0.16, fmt: "pct" },
      页面平均停留时长: { v: 10, fmt: "sec" },
      平均滚动深度: { v: 0.14, fmt: "pct" },
      落地接住率: { v: 0.15, fmt: "pct" },
      落地平均停留时长: { v: 8, fmt: "sec" },
      秒退率: { v: 0.7, fmt: "pct" },
    },
    explore: {
      合格浏览率: { v: 0.62, fmt: "pct" },
      页面平均停留时长: { v: 38, fmt: "sec" },
      平均滚动深度: { v: 0.58, fmt: "pct" },
      落地接住率: { v: 0.52, fmt: "pct" },
      落地平均停留时长: { v: 34, fmt: "sec" },
      秒退率: { v: 0.22, fmt: "pct" },
    },
    compare: {
      合格浏览率: { v: 0.5, fmt: "pct" },
      页面平均停留时长: { v: 32, fmt: "sec" },
      平均滚动深度: { v: 0.44, fmt: "pct" },
      落地接住率: { v: 0.5, fmt: "pct" },
      落地平均停留时长: { v: 26, fmt: "sec" },
      秒退率: { v: 0.2, fmt: "pct" },
    },
    decide: {
      合格浏览率: { v: 0.64, fmt: "pct" },
      页面平均停留时长: { v: 44, fmt: "sec" },
      平均滚动深度: { v: 0.56, fmt: "pct" },
      落地接住率: { v: 0.6, fmt: "pct" },
      落地平均停留时长: { v: 36, fmt: "sec" },
      秒退率: { v: 0.15, fmt: "pct" },
    },
  },
  l2: {
    site: {
      产品详情页到达率: { v: 0.58, fmt: "pct" },
      表单开始率: { v: 0.1, fmt: "pct" },
      开聊率: { v: 0.049, fmt: "pct" },
      未转化页出口率: { v: 0.41, fmt: "pct" },
      询价入口个数: { v: 1, fmt: "int" },
    },
    search: {
      产品详情页到达率: { v: 0.52, fmt: "pct" },
      表单开始率: { v: 0.09, fmt: "pct" },
      开聊率: { v: 0.054, fmt: "pct" },
      未转化页出口率: { v: 0.48, fmt: "pct" },
      询价入口个数: { v: 1, fmt: "int" },
    },
    direct: {
      产品详情页到达率: { v: 0.68, fmt: "pct" },
      表单开始率: { v: 0.12, fmt: "pct" },
      开聊率: { v: 0.048, fmt: "pct" },
      未转化页出口率: { v: 0.2, fmt: "pct" },
      询价入口个数: { v: 1, fmt: "int" },
    },
    referral: {
      产品详情页到达率: { v: 0.55, fmt: "pct" },
      表单开始率: { v: 0.1, fmt: "pct" },
      开聊率: { v: 0.043, fmt: "pct" },
      未转化页出口率: { v: 0.3, fmt: "pct" },
      询价入口个数: { v: 1, fmt: "int" },
    },
    ads: {
      产品详情页到达率: { v: 0.48, fmt: "pct" },
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
    },
    search: {
      表单完成率: { v: 0.38, fmt: "pct" },
      开聊留资率: { v: 0.42, fmt: "pct" },
    },
    direct: {
      表单完成率: { v: 0.5, fmt: "pct" },
      开聊留资率: { v: 0.55, fmt: "pct" },
    },
    referral: {
      表单完成率: { v: 0.46, fmt: "pct" },
      开聊留资率: { v: 0.5, fmt: "pct" },
    },
    ads: {
      表单完成率: { v: 0.33, fmt: "pct" },
      开聊留资率: { v: 0.4, fmt: "pct" },
    },
  },
};

export function stripMetric(lossId, channelId, name, gate, intentId) {
  if (
    name === "有效浏览率" ||
    name === "转化交互率" ||
    name === "留资访客 / 转化交互访客"
  ) {
    return { v: gate.pass, fmt: "pct" };
  }
  return (
    (intentId && STRIP[lossId]?.[intentId]?.[name]) ||
    STRIP[lossId]?.[channelId]?.[name] ||
    STRIP[lossId]?.site?.[name] ||
    null
  );
}

export function sliceCaption(channelId, intentId) {
  const ch = channelId !== "site" ? channelLabel(channelId) : "";
  const intent = intentId ? intentLabel(intentId) : "";
  if (ch && intent) return `${ch} · ${intent}`;
  return intent || ch || "全站";
}
