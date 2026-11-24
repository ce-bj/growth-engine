/** 访问统计快照：租户 366622，www.goody.com.cn，截至 2026-11-16。
 *  渠道人数来自站点日表，按日访客相加。AI 在会话里单列，已从「搜索引擎」中拆出。
 *  具体来源、落地页按人去重。页面清单来自会话里的访问路径，追踪参数已并进原页面。
 *  合格浏览、滚动、有效浏览、转化交互和表单提交来自页面日表，按路径把带参地址加总。
 *  英文站 en.goody.com.cn 是另一个租户，没有并进来。
 */
import pageCatalogText from "./catalog/goody/pages.tsv?raw"
import pageDayText from "./catalog/goody/page-day.tsv?raw"
import landCatalogText from "./catalog/goody/lands.tsv?raw"
import pathCatalogText from "./catalog/goody/paths.tsv?raw"
import termCatalogText from "./catalog/goody/terms.tsv?raw"
import { pageDayFields, readPageDay } from "./pageDayMetrics.js"

const TREND = [
  ["2026-10-15", 562], ["2026-10-16", 497], ["2026-10-17", 428], ["2026-10-18", 376],
  ["2026-10-19", 512], ["2026-10-20", 635], ["2026-10-21", 551], ["2026-10-22", 613],
  ["2026-10-23", 497], ["2026-10-24", 466], ["2026-10-25", 434], ["2026-10-26", 523],
  ["2026-10-27", 534], ["2026-10-28", 594], ["2026-10-29", 596], ["2026-10-30", 592],
  ["2026-10-31", 506], ["2026-11-01", 491], ["2026-11-02", 623], ["2026-11-03", 407],
  ["2026-11-04", 452], ["2026-11-05", 375], ["2026-11-06", 448], ["2026-11-07", 374],
  ["2026-11-08", 306], ["2026-11-09", 450], ["2026-11-10", 486], ["2026-11-11", 382],
  ["2026-11-12", 376], ["2026-11-13", 383], ["2026-11-14", 221], ["2026-11-15", 204],
  ["2026-11-16", 339],
]

function metric(uv, pv, view, convert, leadUv, leadCnt, bounce, held, landSec, scrollSum = null, scrollN = null, pageSec = null, edit = 0, chat = 0) {
  return {
    uv, pv, view, convert, edit, chat, leadUv, leadCnt, detail: 0,
    bounce, landUv: uv, held, landSec, scrollSum, scrollN, pageSec,
  }
}

const zero = metric(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
const aiBundle = metric(12, 25, 7, 0, 0, 0, 6, 7, 1098, null, null, null, 0, 0)

const WINDOWS = {
  d7: {
    start: "2026-11-10",
    end: "2026-11-16",
    compare: true,
    lossUv: 394,
    qual: 702,
    qualPrev: 730,
    all: metric(2391, 5454, 704, 23, 3, 3, 1573, 489, 125604, 109424, 1880, 306118, 4, 20),
    allPrev: metric(2812, 5959, 730, 23, 2, 2, 1974, 486, 53706, 129876.22, 2221, 225936, 3, 21),
    channels: {
      search: metric(308, 1392, 241, 14, 3, 3, 35, 158, 39984, 41863.42, 732, 112939, 3, 12),
      direct: metric(2060, 4013, 448, 9, 0, 0, 1530, 316, 82831, 67034.25, 1137, 191402, 1, 8),
      referral: metric(11, 24, 8, 0, 0, 0, 2, 8, 1691, 526.33, 11, 1777, 0, 0),
      ads: zero,
      ai: aiBundle,
    },
    channelPrev: {
      search: metric(300, null, 244, 10, 1, 1, 29, 143, 11599, 44285.23, 765, 51902, 2, 9),
      direct: metric(2487, null, 466, 13, 1, 1, 1941, 330, 40998, 81608.69, 1394, 171277, 1, 12),
      referral: metric(25, null, 20, 0, 0, 0, 4, 13, 1109, 3982.3, 62, 2757, 0, 0),
      ads: zero,
      ai: zero,
    },
    intents: {
      all: { 浏览型: [1655, 0], 探索型: [647, 0], 比较型: [8, 0], 决策型: [81, 3] },
      search: { 浏览型: [57, 0], 探索型: [202, 0], 比较型: [3, 0], 决策型: [46, 3] },
      direct: { 浏览型: [1591, 0], 探索型: [430, 0], 比较型: [5, 0], 决策型: [34, 0] },
      referral: { 浏览型: [2, 0], 探索型: [8, 0], 比较型: [0, 0], 决策型: [1, 0] },
      ads: { 浏览型: [0, 0], 探索型: [0, 0], 比较型: [0, 0], 决策型: [0, 0] },
      ai: { 浏览型: [5, 0], 探索型: [7, 0], 比较型: [0, 0], 决策型: [0, 0] },
    },
  },
  d30: {
    start: "2026-10-18",
    end: "2026-11-16",
    compare: false,
    lossUv: 1605,
    all: metric(13746, 26199, 2847, 78, 7, 7, 10459, 1972, 349783, 500032.22, 8350, 1004756, 12, 69),
    channels: {
      search: metric(1152, 5244, 906, 40, 5, 5, 138, 588, 83911, 162037.53, 2771, 280119, 6, 37),
      direct: metric(12510, 20558, 1885, 38, 2, 2, 10302, 1340, 260725, 327569.08, 5414, 714035, 6, 32),
      referral: metric(72, 372, 49, 0, 0, 0, 13, 37, 4049, 10425.61, 165, 10602, 0, 0),
      ads: zero,
      ai: aiBundle,
    },
    intents: {
      all: { 浏览型: [10784, 0], 探索型: [2580, 0], 比较型: [52, 0], 决策型: [330, 7] },
      search: { 浏览型: [205, 0], 探索型: [756, 0], 比较型: [15, 0], 决策型: [176, 5] },
      direct: { 浏览型: [10554, 0], 探索型: [1776, 0], 比较型: [33, 0], 决策型: [147, 2] },
      referral: { 浏览型: [20, 0], 探索型: [41, 0], 比较型: [4, 0], 决策型: [7, 0] },
      ads: { 浏览型: [0, 0], 探索型: [0, 0], 比较型: [0, 0], 决策型: [0, 0] },
      ai: { 浏览型: [5, 0], 探索型: [7, 0], 比较型: [0, 0], 决策型: [0, 0] },
    },
  },
  d90: {
    start: "2026-10-15",
    end: "2026-11-16",
    compare: false,
    partial: "访问统计从 10-15 才有数，近 3 个月实际是这 33 天",
    lossUv: 1752,
    all: metric(15233, 28970, 3117, 81, 7, 7, 11601, 2165, 380782, 552940.88, 9199, 1104801, 13, 71),
    channels: {
      search: metric(1255, 5689, 984, 41, 5, 5, 151, 641, 88625, 175674.37, 2997, 298220, 7, 37),
      direct: metric(13886, 22858, 2075, 40, 2, 2, 11428, 1478, 286659, 366622.79, 6030, 794741, 6, 34),
      referral: metric(80, 398, 51, 0, 0, 0, 16, 39, 4400, 10643.72, 172, 11840, 0, 0),
      ads: zero,
      ai: aiBundle,
    },
    intents: {
      all: { 浏览型: [11985, 0], 探索型: [2841, 0], 比较型: [57, 0], 决策型: [350, 7] },
      search: { 浏览型: [225, 0], 探索型: [830, 0], 比较型: [15, 0], 决策型: [185, 5] },
      direct: { 浏览型: [11730, 0], 探索型: [1960, 0], 比较型: [38, 0], 决策型: [158, 2] },
      referral: { 浏览型: [25, 0], 探索型: [44, 0], 比较型: [4, 0], 决策型: [7, 0] },
      ads: { 浏览型: [0, 0], 探索型: [0, 0], 比较型: [0, 0], 决策型: [0, 0] },
      ai: { 浏览型: [5, 0], 探索型: [7, 0], 比较型: [0, 0], 决策型: [0, 0] },
    },
  },
}

const SOURCE_ROWS = `
direct,直接访问,1960,4045,0,11769,20650,2,13039,22949,2
search,未标明搜索引擎,58,278,0,736,4055,2,815,4487,2
search,百度,154,729,1,154,729,1,154,729,1
referral,外部链接,11,23,0,72,386,0,84,426,0
search,Bing,60,229,2,60,229,2,60,229,2
search,360,12,77,0,12,77,0,12,77,0
ai,豆包,10,21,0,10,21,0,10,21,0
search,Google,9,43,0,9,43,0,9,43,0
ai,腾讯元宝,1,4,0,1,4,0,1,4,0
search,搜狗搜索,1,5,0,1,5,0,1,5,0
`.trim()

const PAGE_TITLES = {
  "/": "首页",
  "/contact_us.html": "联系我们",
  "/company.html": "公司介绍",
  "/faq.html": "常见问题",
  "/aftercare.html": "售后服务",
  "/network.html": "销售网络",
  "/download.html": "下载中心",
  "/about_us_1/1.html": "关于我们",
  "/honor_list/1839913351018856448.html": "荣誉资质",
  "/honor_detail/3.html": "荣誉详情",
  "/products_list_1/2.html": "产品列表",
  "/investor_list/3.html": "投资者关系",
  "/news_list_1/1.html": "资讯",
}

export const GOODY_SITE = {
  tenantId: "366622",
  name: "顾地科技股份有限公司",
  host: "www.goody.com.cn",
  asOf: "2026-11-16",
}

const INTENT_NAME = { 浏览型: "browse", 探索型: "explore", 比较型: "compare", 决策型: "decide" }

function num(value) {
  if (value == null || value === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function lines(text) {
  return text.trim().split("\n").filter((line) => line.trim()).map((line) => line.split(","))
}

function dayLabel(iso) {
  return iso.slice(5)
}

function rate(part, whole) {
  if (part == null || !whole) return null
  return part / whole
}

function scrollRate(sum, count) {
  if (!count) return null
  const avg = sum / count
  return avg > 1 ? avg / 100 : avg
}

function stay(sec, base) {
  if (!base || sec == null) return null
  return Math.round(sec / base)
}

const HOST = "https://www.goody.com.cn"

export function pageTitle(url) {
  let path = url
  try {
    path = decodeURIComponent(new URL(url).pathname)
  } catch {
    path = url
  }
  const titled = PAGE_TITLES[path.toLowerCase()] || PAGE_TITLES[path]
  if (titled) return titled
  return path === "/" ? "首页" : path
}

function pageType(path) {
  const text = path.toLowerCase()
  if (text === "/" || text === "") return "首页"
  if (text.includes("product_detail") || text.includes("household_detail")) return "产品详情页"
  if (text.includes("product_list") || text.includes("products")) return "产品列表页"
  if (text.includes("contact") || text.includes("message")) return "联系/询价页"
  if (
    text.includes("about") || text.includes("honor") || text.includes("investor") || text.includes("company")
    || text.includes("aftercare") || text.includes("network") || text.includes("brand") || text.includes("digitalcard")
    || text.includes("partner") || text.includes("agency") || text.includes("social") || text.includes("production")
  ) return "公司信息/资质/工厂页"
  if (text.includes("case")) return "案例页"
  if (text.includes("news") || text.includes("faq")) return "资讯/文章页"
  if (text.includes("job")) return "招聘"
  if (text.includes("search")) return "站内搜索页"
  if (text.includes("download")) return "下载"
  return "其他"
}

const PAGE_DAY = readPageDay(pageDayText)

const PAGE_CATALOG = {}
pageCatalogText.split("\n").forEach((line) => {
  if (!line.trim()) return
  const [win, channel, path, pv, uv, sec] = line.split("\t")
  if (!PAGE_CATALOG[win]) PAGE_CATALOG[win] = {}
  if (!PAGE_CATALOG[win][channel]) PAGE_CATALOG[win][channel] = []
  PAGE_CATALOG[win][channel].push({
    url: `${HOST}${path}`,
    path,
    pv: Number(pv),
    uv: Number(uv),
    sec: Number(sec) > 0 ? Number(sec) : null,
  })
})

const LAND_CATALOG = {}
landCatalogText.split("\n").forEach((line) => {
  if (!line.trim()) return
  const [win, channel, path, uv, bounce, held, sec, leads, scroll] = line.split("\t")
  if (!LAND_CATALOG[win]) LAND_CATALOG[win] = {}
  if (!LAND_CATALOG[win][channel]) LAND_CATALOG[win][channel] = []
  const scrollNum = Number(scroll)
  LAND_CATALOG[win][channel].push({
    url: `${HOST}${path}`,
    path,
    uv: Number(uv),
    bounce: Number(bounce),
    held: Number(held),
    sec: Number(sec) > 0 ? Number(sec) : null,
    leads: Number(leads),
    scroll: Number.isFinite(scrollNum) ? scrollNum : null,
  })
})

const PATH_LEVEL = { all: "all", 浏览型: "browse", 探索型: "explore", 比较型: "compare", 决策型: "decide" }
const PATH_CATALOG = {}
pathCatalogText.split("\n").forEach((line) => {
  if (!line.trim()) return
  const [win, channel, level, name, count] = line.split("\t")
  const bucket = PATH_LEVEL[level]
  if (!win || !channel || !bucket || !name) return
  if (!PATH_CATALOG[win]) PATH_CATALOG[win] = {}
  if (!PATH_CATALOG[win][channel]) PATH_CATALOG[win][channel] = {}
  if (!PATH_CATALOG[win][channel][bucket]) PATH_CATALOG[win][channel][bucket] = []
  const people = Number(count)
  if (people > 0) PATH_CATALOG[win][channel][bucket].push({ name, [win]: people })
})

const TERM_CATALOG = termCatalogText.split("\n").filter((line) => line.trim()).map((line) => line.split("\t"))
const TERM_AT = { d7: 1, d30: 6, d90: 11 }

const SOURCES = lines(SOURCE_ROWS).map((cells) => ({
  cat: cells[0],
  name: cells[1],
  d7: { uv: num(cells[2]), pv: num(cells[3]), leads: num(cells[4]) },
  d30: { uv: num(cells[5]), pv: num(cells[6]), leads: num(cells[7]) },
  d90: { uv: num(cells[8]), pv: num(cells[9]), leads: num(cells[10]) },
}))

function stagesOf(current, previous) {
  return [
    { name: "访问入口", cur: current.uv, prev: previous?.uv ?? null },
    { name: "有效浏览", cur: current.view, prev: previous?.view ?? null },
    { name: "转化交互", cur: current.convert, prev: previous?.convert ?? null },
    { name: "成功留资", cur: current.leadUv, prev: previous?.leadUv ?? null },
  ]
}

function stripOf(current, previous, qual, qualPrev) {
  const viewRate = rate(current.view, current.uv)
  const viewPrev = rate(previous?.view, previous?.uv)
  return {
    l1: {
      pass: viewRate,
      passPrev: viewPrev,
      from: current.uv,
      to: current.view,
      items: [
        { name: "合格浏览率", value: rate(qual, current.uv), prev: rate(qualPrev, previous?.uv), fmt: "pct" },
        { name: "页面平均停留时长", value: stay(current.pageSec, current.pv), fmt: "sec" },
        { name: "平均滚动深度", value: scrollRate(current.scrollSum, current.scrollN), fmt: "pct" },
        { name: "落地接住率", value: rate(current.held, current.landUv), prev: rate(previous?.held, previous?.landUv), fmt: "pct" },
        { name: "落地平均停留时长", value: stay(current.landSec, current.landUv), fmt: "sec" },
        { name: "秒退率", value: rate(current.bounce, current.uv), prev: rate(previous?.bounce, previous?.uv), fmt: "pct" },
      ],
    },
    l2: {
      pass: rate(current.convert, current.view),
      passPrev: rate(previous?.convert, previous?.view),
      from: current.view,
      to: current.convert,
      items: [
        { name: "产品详情页到达率", value: null, fmt: "pct", empty: "站点日表里的详情到达对这个站是 0，页面类型对不上" },
        { name: "表单开始率", value: rate(current.edit, current.view), fmt: "pct" },
        { name: "开聊率", value: rate(current.chat, current.view), fmt: "pct" },
      ],
    },
    l3: {
      pass: rate(current.leadUv, current.convert),
      passPrev: rate(previous?.leadUv, previous?.convert),
      from: current.convert,
      to: current.leadUv,
      items: [
        { name: "表单完成率", value: rate(current.leadUv, current.edit), fmt: "pct" },
        { name: "开聊留资率", value: null, fmt: "pct", empty: "没有「客服里留下联系方式」" },
      ],
    },
  }
}

function pageFromVisit(row, win, channel) {
  return {
    url: row.url,
    name: pageTitle(row.url),
    type: pageType(row.path),
    pv: row.pv,
    uv: row.uv,
    pageStay: stay(row.sec, row.pv),
    ...pageDayFields(PAGE_DAY, win, channel, row.path),
  }
}

function landFromCatalog(row) {
  return {
    url: row.url,
    name: pageTitle(row.url),
    type: pageType(row.path),
    landUv: row.uv,
    bounceUv: row.bounce,
    bounce: rate(row.bounce, row.uv),
    catchRate: rate(row.held, row.uv),
    catchRatePrev: null,
    landStay: stay(row.sec, row.uv),
    scroll: row.scroll == null ? null : row.scroll / 100,
    landLeads: row.leads,
  }
}

export function getGoodyBoard(range) {
  const win = WINDOWS[range] || WINDOWS.d7
  const trend = TREND.filter(([date]) => date >= win.start && date <= win.end).map(([date, value]) => ({
    label: dayLabel(date),
    value,
  }))
  const channelIds = ["search", "direct", "referral", "ads", "ai"]
  const stages = { all: stagesOf(win.all, win.allPrev) }
  const strips = {
    all: stripOf(win.all, win.allPrev, win.qual, win.qualPrev),
  }
  channelIds.forEach((id) => {
    stages[id] = stagesOf(win.channels[id], win.channelPrev?.[id])
    strips[id] = stripOf(win.channels[id], win.channelPrev?.[id], null, null)
  })
  const catalog = PAGE_CATALOG[range] || {}
  const landCatalog = LAND_CATALOG[range] || {}
  const pages = {}
  const lands = {}
  ;["all", ...channelIds].forEach((id) => {
    pages[id] = (catalog[id] || [])
      .map((row) => pageFromVisit(row, range, id))
      .sort((a, b) => b.uv - a.uv || b.pv - a.pv)
    lands[id] = (landCatalog[id] || [])
      .map(landFromCatalog)
      .sort((a, b) => b.landUv - a.landUv || b.bounceUv - a.bounceUv)
  })
  const intents = {}
  Object.entries(win.intents).forEach(([id, bag]) => {
    intents[id] = Object.entries(bag).map(([name, pair]) => ({
      id: INTENT_NAME[name],
      name,
      count: pair[0],
      leads: pair[1],
    }))
  })
  const pathBag = PATH_CATALOG[range] || {}
  const paths = {}
  ;["all", ...channelIds].forEach((id) => {
    const levels = pathBag[id] || {}
    paths[id] = {
      all: (levels.all || []).slice().sort((a, b) => b[range] - a[range]),
      browse: (levels.browse || []).slice().sort((a, b) => b[range] - a[range]),
      explore: (levels.explore || []).slice().sort((a, b) => b[range] - a[range]),
      compare: (levels.compare || []).slice().sort((a, b) => b[range] - a[range]),
      decide: (levels.decide || []).slice().sort((a, b) => b[range] - a[range]),
    }
  })
  const termAt = TERM_AT[range]
  const terms = TERM_CATALOG.map((cells) => {
    const searches = Number(cells[termAt])
    const uv = Number(cells[termAt + 1])
    const zeroHits = Number(cells[termAt + 2])
    const unknown = Number(cells[termAt + 3])
    const leaveUv = Number(cells[termAt + 4])
    return {
      term: cells[0],
      searches,
      uv,
      zeroHits,
      unknown,
      leaveUv,
      zeroRate: rate(zeroHits, searches - unknown),
      leaveRate: rate(leaveUv, uv),
    }
  }).filter((row) => row.searches > 0).sort((a, b) => b.searches - a.searches || b.uv - a.uv)
  return {
    range,
    compare: win.compare,
    partial: win.partial || "",
    span: `${trend[0]?.label || ""} – ${trend[trend.length - 1]?.label || ""}`,
    trend,
    all: win.all,
    allPrev: win.allPrev || null,
    channels: channelIds.map((id) => ({ id, ...win.channels[id] })),
    stages,
    strips,
    pages,
    lands,
    intents,
    paths,
    pathSplit: { all: true },
    sources: SOURCES.map((row) => ({ ...row, ...row[range] })).sort((a, b) => b.uv - a.uv),
    terms,
    lossShare: win.lossUv && win.all.uv ? win.lossUv / win.all.uv : null,
  }
}
