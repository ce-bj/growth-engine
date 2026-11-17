/** 访问统计快照：租户 304868，www.shlanbao.cn，截至 2026-11-15。
 *  渠道人数来自站点日表，按日访客相加。AI 在会话里单列，已从「搜索引擎」中拆出。
 *  具体来源、落地页按人去重。页面清单来自会话里的访问路径，追踪参数已并进原页面。
 */
import pageCatalogText from "./catalog/pages.tsv?raw"
import landCatalogText from "./catalog/lands.tsv?raw"
import pathCatalogText from "./catalog/paths.tsv?raw"
import termCatalogText from "./catalog/terms.tsv?raw"

const TREND = [
  ["2026-10-15", 304], ["2026-10-16", 329], ["2026-10-17", 185], ["2026-10-18", 128],
  ["2026-10-19", 360], ["2026-10-20", 333], ["2026-10-21", 342], ["2026-10-22", 309],
  ["2026-10-23", 285], ["2026-10-24", 181], ["2026-10-25", 218], ["2026-10-26", 318],
  ["2026-10-27", 354], ["2026-10-28", 292], ["2026-10-29", 308], ["2026-10-30", 298],
  ["2026-10-31", 177], ["2026-11-01", 192], ["2026-11-02", 344], ["2026-11-03", 380],
  ["2026-11-04", 312], ["2026-11-05", 363], ["2026-11-06", 381], ["2026-11-07", 237],
  ["2026-11-08", 209], ["2026-11-09", 518], ["2026-11-10", 485], ["2026-11-11", 480],
  ["2026-11-12", 357], ["2026-11-13", 378], ["2026-11-14", 200], ["2026-11-15", 164],
]

function metric(uv, pv, view, convert, leadUv, leadCnt, bounce, held, landSec, scrollSum = null, scrollN = null, pageSec = null) {
  return {
    uv, pv, view, convert, edit: convert, chat: 0, leadUv, leadCnt, detail: 0,
    bounce, landUv: uv, held, landSec, scrollSum, scrollN, pageSec,
  }
}

const WINDOWS = {
  d7: {
    start: "2026-11-09",
    end: "2026-11-15",
    compare: true,
    lossUv: 692,
    qual: 1232,
    qualPrev: 1088,
    all: metric(2582, 10444, 1237, 155, 139, 317, 1212, 851, 94990, 41549.31, 800, 110667),
    allPrev: metric(2226, null, 1098, 139, 118, 197, 1031, 700, 111672, 45815.17, 873, 114152),
    channels: {
      search: metric(693, 5191, 581, 90, 79, 178, 76, 375, 34091, 20811.76, 436, 57121),
      direct: metric(1701, 4177, 501, 34, 31, 77, 1107, 361, 52115, 14667.5, 248, 42444),
      referral: metric(37, 225, 29, 5, 5, 11, 6, 23, 2785, 1459.92, 29, 2369),
      ads: metric(140, 794, 115, 22, 21, 48, 21, 84, 3921, 4610.13, 87, 8733),
      ai: metric(11, 57, 11, 4, 3, 3, 2, 8, 2078),
    },
    channelPrev: {
      search: metric(694, null, 592, 75, 62, 87, 70, 369, 43714, 22994.72, 470, 65917),
      direct: metric(1338, null, 360, 49, 43, 86, 925, 245, 54081, 16004.74, 277, 27227),
      referral: metric(65, null, 48, 7, 6, 10, 12, 29, 5160, 1596.76, 37, 7611),
      ads: metric(129, null, 98, 8, 7, 14, 24, 57, 8717, 5218.95, 89, 13397),
    },
    intents: {
      all: { 浏览型: [1307, 0], 探索型: [908, 0], 比较型: [90, 0], 决策型: [277, 139] },
      search: { 浏览型: [105, 0], 探索型: [383, 0], 比较型: [57, 0], 决策型: [148, 79] },
      direct: { 浏览型: [1170, 0], 探索型: [424, 0], 比较型: [28, 0], 决策型: [79, 31] },
      referral: { 浏览型: [7, 0], 探索型: [21, 0], 比较型: [1, 0], 决策型: [8, 5] },
      ads: { 浏览型: [25, 0], 探索型: [76, 0], 比较型: [4, 0], 决策型: [35, 21] },
      ai: { 浏览型: [0, 0], 探索型: [4, 0], 比较型: [0, 0], 决策型: [7, 3] },
    },
  },
  d30: {
    start: "2026-10-17",
    end: "2026-11-15",
    compare: false,
    all: metric(9088, 37470, 4781, 601, 516, 986, 3845, 3160, 410495, 190331.47, 3589, 457750),
    channels: {
      search: metric(2938, 18863, 2482, 334, 276, 519, 306, 1559, 149674, 96023.31, 1940, 256124),
      direct: metric(5379, 14459, 1688, 188, 172, 327, 3408, 1210, 220165, 67836.26, 1147, 136657),
      referral: metric(245, 1273, 189, 21, 17, 35, 46, 113, 15062, 9125.43, 177, 21986),
      ads: metric(515, 2818, 411, 54, 48, 102, 83, 270, 23516, 17346.47, 325, 42983),
      ai: metric(11, 57, 11, 4, 3, 3, 2, 8, 2078),
    },
    intents: {
      all: { 浏览型: [4163, 0], 探索型: [3468, 1], 比较型: [405, 0], 决策型: [1052, 515] },
      search: { 浏览型: [424, 0], 探索型: [1724, 0], 比较型: [225, 0], 决策型: [565, 276] },
      direct: { 浏览型: [3585, 0], 探索型: [1338, 1], 比较型: [137, 0], 决策型: [319, 171] },
      referral: { 浏览型: [55, 0], 探索型: [128, 0], 比较型: [12, 0], 决策型: [50, 17] },
      ads: { 浏览型: [99, 0], 探索型: [274, 0], 比较型: [31, 0], 决策型: [111, 48] },
      ai: { 浏览型: [0, 0], 探索型: [4, 0], 比较型: [0, 0], 决策型: [7, 3] },
    },
  },
  d90: {
    start: "2026-10-15",
    end: "2026-11-15",
    compare: false,
    partial: "访问统计从 10-15 才有数，近 3 个月实际是这 32 天",
    all: metric(9721, 40307, 5189, 655, 562, 1072, 4038, 3427, 440610, 207685.76, 3931, 497870),
    channels: {
      search: metric(3200, 20466, 2705, 367, 305, 586, 332, 1703, 159995, 104502.57, 2110, 271889),
      direct: metric(5688, 15338, 1821, 202, 185, 342, 3568, 1298, 235352, 74549.82, 1280, 150310),
      referral: metric(267, 1374, 207, 25, 20, 38, 49, 123, 17117, 9596.42, 186, 22468),
      ads: metric(555, 3072, 445, 57, 49, 103, 87, 295, 26068, 19036.95, 355, 53203),
      ai: metric(11, 57, 11, 4, 3, 3, 2, 8, 2078),
    },
    intents: {
      all: { 浏览型: [4377, 0], 探索型: [3764, 2], 比较型: [433, 0], 决策型: [1147, 560] },
      search: { 浏览型: [459, 0], 探索型: [1876, 0], 比较型: [245, 0], 决策型: [620, 305] },
      direct: { 浏览型: [3754, 0], 探索型: [1447, 2], 比较型: [141, 0], 决策型: [346, 183] },
      referral: { 浏览型: [59, 0], 探索型: [139, 0], 比较型: [13, 0], 决策型: [56, 20] },
      ads: { 浏览型: [105, 0], 探索型: [298, 0], 比较型: [34, 0], 决策型: [118, 49] },
      ai: { 浏览型: [0, 0], 探索型: [4, 0], 比较型: [0, 0], 决策型: [7, 3] },
    },
  },
}

/** channel,url,type, d7 的 pv uv sec qual scroll scrollN view convert leadUv leadCnt, p7 的 uv qual, 然后 d30、d90 各 10 个 */
const PAGE_ROWS = `
all,https://www.shlanbao.cn/,首页,1338,1101,58956,499,13871.22,281,843,0,0,0,947,390,5205,4205,187370,1789,63146.3,1261,3178,2,1,1,5660,4561,198706,1938,68495.72,1374,3456,2,1,1
all,https://www.shlanbao.cn/products.html,产品列表页,403,242,17933,137,9344.25,170,225,1,1,1,232,120,1572,975,77854,519,39000.62,707,887,1,1,1,1701,1056,88502,572,42480.48,774,965,1,1,1
all,https://www.shlanbao.cn/Contact.html,联系/询价页,233,184,18201,135,6057.74,146,162,2,2,2,159,123,890,670,106314,500,24681.35,588,606,12,8,8,977,732,114515,545,26884.07,648,662,12,8,8
all,https://www.shlanbao.cn/Aboutus.html,公司信息/资质/工厂页,154,119,8255,66,4414.07,78,98,0,0,0,138,87,644,503,41880,326,22906.85,391,423,2,2,2,698,545,45246,357,25156.49,430,459,2,2,2
all,https://www.shlanbao.cn/application.html,案例页,60,54,1599,17,817.58,11,37,0,0,0,28,13,199,158,4222,69,4970.33,77,122,0,0,0,220,172,4605,79,5940.43,90,136,0,0,0
all,https://www.shlanbao.cn/news_list_1/3366.html,资讯/文章页,56,49,465,18,1000.25,16,29,0,0,0,30,10,147,122,3884,40,3479.83,53,74,0,0,0,157,131,3965,44,3859.41,59,81,0,0,0
search,https://www.shlanbao.cn/,首页,643,489,26618,225,7950.6,174,428,0,0,0,513,241,2750,2143,104696,981,33797.6,750,1891,2,1,1,2998,2333,109095,1064,36231.24,807,2056,2,1,1
search,https://www.shlanbao.cn/products.html,产品列表页,250,137,13114,81,5407.16,109,134,1,1,1,135,70,927,559,51136,306,22734.12,428,531,1,1,1,1013,608,57404,338,25142.68,471,578,1,1,1
search,https://www.shlanbao.cn/Contact.html,联系/询价页,110,80,10458,69,3086.72,78,78,1,1,1,90,76,453,330,59037,265,12536.02,321,320,7,5,5,495,360,62458,289,13655.37,351,348,7,5,5
search,https://www.shlanbao.cn/Aboutus.html,公司信息/资质/工厂页,72,53,6011,34,2229.07,42,46,0,0,0,76,57,315,248,28381,192,12756.37,216,231,1,1,1,343,268,29552,208,13838.48,235,249,1,1,1
search,https://www.shlanbao.cn/application.html,案例页,15,13,378,5,413.58,5,8,0,0,0,10,3,78,65,1942,32,2451.99,37,55,0,0,0,86,71,2126,36,2959.76,43,61,0,0,0
direct,https://www.shlanbao.cn/,首页,648,571,30376,253,5284.59,96,381,0,0,0,372,130,2197,1840,71217,717,25445.12,441,1111,0,0,0,2380,1988,77877,776,28139.44,493,1208,0,0,0
direct,https://www.shlanbao.cn/products.html,产品列表页,109,78,2861,40,2679.04,42,65,0,0,0,75,39,487,317,18590,158,12394.06,212,260,0,0,0,520,343,21279,175,13172.4,232,285,0,0,0
direct,https://www.shlanbao.cn/Contact.html,联系/询价页,91,82,5940,47,2092.19,43,63,1,1,1,44,27,277,229,28858,139,7245.69,157,180,3,1,1,302,251,30668,152,7731.82,177,198,3,1,1
direct,https://www.shlanbao.cn/Aboutus.html,公司信息/资质/工厂页,60,53,892,21,1417.39,23,40,0,0,0,42,14,227,179,8164,76,6237.47,104,119,0,0,0,248,196,10244,88,7195.12,119,132,0,0,0
direct,https://www.shlanbao.cn/application.html,案例页,44,40,798,11,308.38,5,28,0,0,0,15,8,111,86,1758,33,2057.66,34,60,0,0,0,122,92,1882,38,2385.33,39,66,0,0,0
referral,https://www.shlanbao.cn/,首页,37,33,881,18,536.03,10,26,0,0,0,52,13,226,194,9002,76,3503.07,63,148,0,0,0,249,211,9272,83,3724.53,67,163,0,0,0
referral,https://www.shlanbao.cn/Contact.html,联系/询价页,6,5,314,5,218.19,6,5,0,0,0,12,9,66,41,8238,35,2069.43,43,39,2,2,2,69,44,8442,38,2268.25,46,42,2,2,2
referral,https://www.shlanbao.cn/products.html,产品列表页,9,6,86,4,291.36,5,6,0,0,0,6,4,49,30,1760,20,1141.62,23,30,0,0,0,51,31,1764,20,1141.62,23,31,0,0,0
referral,https://www.shlanbao.cn/Aboutus.html,公司信息/资质/工厂页,7,3,1006,2,137.92,3,3,0,0,0,6,4,41,30,2460,17,1271.29,27,28,1,1,1,42,31,2462,17,1274.84,28,29,1,1,1
ads,https://www.shlanbao.cn/products.html,产品列表页,35,21,1872,12,966.69,14,20,0,0,0,16,7,109,69,6368,35,2730.82,44,66,0,0,0,117,74,8055,39,3023.78,48,71,0,0,0
ads,https://www.shlanbao.cn/Contact.html,联系/询价页,26,17,1489,14,660.64,19,16,0,0,0,13,11,94,70,10181,61,2830.21,67,67,0,0,0,111,77,12947,66,3228.63,74,74,0,0,0
ads,https://www.shlanbao.cn/Aboutus.html,公司信息/资质/工厂页,15,10,346,9,629.69,10,9,0,0,0,14,12,61,46,2875,41,2641.72,44,45,0,0,0,65,50,2988,44,2848.05,48,49,0,0,0
ads,https://www.shlanbao.cn/,首页,10,8,1081,3,100,1,8,0,0,0,10,6,32,28,2455,15,400.51,7,28,0,0,0,33,29,2462,15,400.51,7,29,0,0,0
ads,https://www.shlanbao.cn/news_list_1/3366.html,资讯/文章页,9,3,128,2,251.5,4,3,0,0,0,5,2,19,9,271,4,495.71,7,9,0,0,0,19,9,271,4,495.71,7,9,0,0,0
`.trim()

/** channel,url, d7 uv bounce held sec lead scroll, p7 uv held, d30 六个数, d90 六个数。scroll 为 0-100 */
const LAND_ROWS = `
all,https://www.shlanbao.cn/,1000,204,520,56201,65,75.16,844,408,3513,875,1765,183352,266,75.62,3799,952,1917,194676,295,75.38
all,https://www.shlanbao.cn/JobPosting.html,36,10,17,820,0,81.09,18,6,163,35,85,4242,0,78.19,182,36,102,6767,0,78.56
all,https://www.shlanbao.cn/Contact.html,30,16,11,486,1,59.37,12,3,78,49,24,11445,1,58.43,81,51,25,11509,1,55.89
all,https://www.shlanbao.cn/product_lists/34.html,29,10,16,1504,3,74.39,23,12,84,22,48,10859,6,72.20,87,22,50,11261,7,73.74
all,https://www.shlanbao.cn/Aboutus.html,25,14,8,1728,0,71.16,45,17,119,58,38,5979,2,73.93,128,64,41,6310,2,73.05
all,https://www.shlanbao.cn/products.html,24,10,8,1022,1,75.54,23,8,90,43,31,10102,7,79.69,96,45,34,11985,7,79.01
search,https://www.shlanbao.cn/,450,53,252,24992,48,76.25,484,260,1854,205,1024,101294,180,76.82,2015,227,1114,105654,201,76.60
search,https://www.shlanbao.cn/JobPosting.html,20,3,15,642,0,83.50,7,6,109,17,78,3526,0,77.44,125,18,94,5909,0,78.04
search,https://www.shlanbao.cn/product_lists/34.html,20,5,12,485,2,69.52,15,9,61,10,38,7030,4,70.07,63,10,40,7425,5,71.73
search,https://www.shlanbao.cn/product_detail_1_2/136.html,16,6,12,1500,2,63.81,11,10,41,13,32,5819,4,66.80,43,14,33,6925,4,65.29
search,https://www.shlanbao.cn/product_detaild/79.html,15,3,14,5519,1,67.43,12,12,40,8,38,8915,2,69.13,43,8,41,10942,2,68.25
direct,https://www.shlanbao.cn/,525,144,252,22609,14,72.81,321,131,1543,619,679,62485,77,73.50,1662,669,734,69140,83,73.14
direct,https://www.shlanbao.cn/Contact.html,25,16,9,419,1,69.89,8,1,59,44,14,4572,1,62.05,61,46,14,4580,1,58.51
direct,https://www.shlanbao.cn/Aboutus.html,19,12,6,164,0,71.00,32,9,85,53,22,3489,1,73.42,92,58,24,3765,1,72.34
direct,https://www.shlanbao.cn/products.html,17,9,6,839,1,67.14,14,5,61,33,23,9131,7,77.40,63,34,24,10962,7,75.80
direct,https://www.shlanbao.cn/JobPosting.html,16,7,2,178,0,76.27,11,0,54,18,7,716,0,80.49,57,18,8,858,0,80.33
referral,https://www.shlanbao.cn/,39,7,21,8600,4,75.07,57,21,209,52,92,19573,14,73.05,225,57,103,19882,16,73.39
referral,https://www.shlanbao.cn/Aboutus.html,1,0,0,3,0,100,1,1,12,0,3,148,1,76.67,12,0,3,150,1,78.34
ads,https://www.shlanbao.cn/product_detail_1_2/136.html,3,0,3,1589,0,74.45,2,2,8,0,8,5461,0,74.40,8,0,8,5461,0,74.40
ads,https://www.shlanbao.cn/product_detail_1_2/130.html,2,0,2,218,0,83.99,0,0,5,1,4,491,0,83.49,5,1,4,491,0,83.49
ads,https://www.shlanbao.cn/optical_fiber_des/5.html,1,0,1,26,1,74.47,0,0,4,0,3,244,1,72.03,4,0,3,244,1,72.03
ads,https://www.shlanbao.cn/product_detail_1_2/132.html,1,0,1,22,0,83.85,1,0,4,0,3,75,0,75.05,4,0,3,75,0,75.05
ads,https://www.shlanbao.cn/product_detaildrs/25.html,1,1,0,3,0,15.78,1,1,3,1,2,337,1,68.84,3,1,2,337,1,68.84
`.trim()

/** channel,level,name,d7,d30,d90。level=all 表示不拆浏览等级 */
const PATH_ROWS = `
all,all,首页,396,1698,1849
direct,all,首页,238,1019,1104
search,all,首页,110,447,497
all,all,产品列表页,61,286,297
all,all,资讯/文章页,83,280,292
direct,all,产品列表页,60,271,280
direct,all,资讯/文章页,79,269,281
all,all,首页>联系/询价页,59,217,240
all,all,案例页,54,176,188
ads,all,首页,31,145,155
direct,all,案例页,44,145,150
all,all,首页>产品列表页,24,80,80
search,all,首页>联系/询价页,19,73,80
all,all,公司信息/资质/工厂页,5,41,41
direct,all,首页>联系/询价页,18,36,42
all,all,联系/询价页,13,29,29
direct,all,联系/询价页,12,28,28
direct,all,公司信息/资质/工厂页,0,27,27
direct,all,首页>产品列表页,11,22,22
search,all,首页>产品列表页,5,15,15
referral,all,首页,0,10,15
search,all,首页>公司信息/资质/工厂页,0,5,5
all,浏览型,首页,212,943,1019
all,探索型,首页,151,641,707
all,浏览型,产品列表页,55,264,273
all,浏览型,资讯/文章页,70,225,234
all,决策型,首页>联系/询价页,51,194,212
all,浏览型,案例页,47,156,156
all,探索型,首页>产品列表页,13,48,48
all,浏览型,联系/询价页,7,23,23
all,探索型,首页>公司信息/资质/工厂页,0,15,15
all,决策型,首页,5,12,17
all,浏览型,公司信息/资质/工厂页,0,11,11
all,探索型,资讯/文章页,5,5,5
`.trim()

/** cat,name,d7 uv pv lead,d30,d90。人数是会话去重 */
const SOURCE_ROWS = `
direct,直接访问,1637,4258,32,4916,14819,140,5184,15743,152
search,未标明搜索引擎,245,1583,27,2058,15012,196,2260,16571,219
search,Bing,245,2282,30,245,2282,30,245,2282,30
search,百度,140,1208,14,140,1208,14,140,1208,14
ads,百度,68,396,12,68,396,12,68,396,12
ads,未标明广告,52,229,6,388,2131,28,423,2381,29
referral,外部链接,44,229,5,252,1363,20,269,1467,22
ads,Bing,16,85,3,16,85,3,16,85,3
ai,豆包,11,57,3,11,57,3,11,57,3
search,搜狗搜索,5,22,0,5,22,0,5,22,0
search,Google,5,32,0,5,32,0,5,32,0
search,360,3,51,1,3,51,1,3,51,1
search,谷歌中国,1,12,1,1,12,1,1,12,1
`.trim()

const TERM_ROWS = `
d30,LR12,49,17,0,0,1
d30,PSE,41,17,0,0,1
d30,LR18,23,10,0,0,0
d30,PU05S-TGNR-L,22,11,0,0,1
d30,LR,21,3,0,0,1
d30,PSEA-CM4DPRV,18,4,18,0,2
d30,LE17SF05DNC,17,4,0,0,2
d30,LR30,17,4,0,0,0
d7,LR,17,2,0,0,1
d7,PU05S-TGNR-L,17,6,0,0,1
d7,LR12,11,4,0,0,0
d7,PR,10,1,0,0,0
d7,对射,8,3,0,0,1
d7,CR18CF05DNO,8,1,0,0,1
d7,LR08,7,5,0,0,0
d7,PSE,7,7,0,0,0
d90,LR12,50,18,0,0,1
d90,PSE,41,17,0,0,1
d90,LR18,23,10,0,0,0
d90,PU05S-TGNR-L,23,12,0,0,2
d90,LR,21,3,0,0,1
d90,PSEA-CM4DPRV,18,4,18,0,2
d90,LE17SF05DNC,18,4,0,0,2
d90,LR30,17,4,0,0,0
`.trim()

const PAGE_TITLES = {
  "https://www.shlanbao.cn/": "首页",
  "https://www.shlanbao.cn/products.html": "产品中心",
  "https://www.shlanbao.cn/Contact.html": "联系我们",
  "https://www.shlanbao.cn/Aboutus.html": "走进兰宝",
  "https://www.shlanbao.cn/application.html": "应用案例",
  "https://www.shlanbao.cn/JobPosting.html": "招聘",
  "https://www.shlanbao.cn/product_lists/34.html": "产品列表",
  "https://www.shlanbao.cn/news_list_1/3366.html": "公司动态",
  "https://www.shlanbao.cn/news_list_1/1.html": "资讯列表",
}

export const MCP_SITE = {
  tenantId: "304868",
  name: "上海兰宝传感科技股份有限公司",
  host: "www.shlanbao.cn",
  asOf: "2026-11-15",
}

const INTENT_NAME = { 浏览型: "browse", 探索型: "explore", 比较型: "compare", 决策型: "decide" }

function num(value) {
  if (value == null || value === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function lines(text) {
  return text.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => line.split(","))
}

function takePage(cells) {
  return {
    pv: num(cells[0]), uv: num(cells[1]), sec: num(cells[2]), qual: num(cells[3]),
    scroll: num(cells[4]), scrollN: num(cells[5]), view: num(cells[6]), convert: num(cells[7]),
    leadUv: num(cells[8]), leadCnt: num(cells[9]),
  }
}

function takeLand(cells) {
  return {
    uv: num(cells[0]), bounce: num(cells[1]), held: num(cells[2]), sec: num(cells[3]),
    lead: num(cells[4]), scroll: num(cells[5]),
  }
}

const PAGES = lines(PAGE_ROWS).map((cells) => ({
  channel: cells[0],
  url: cells[1],
  type: cells[2],
  d7: takePage(cells.slice(3, 13)),
  p7: { uv: num(cells[13]), qual: num(cells[14]) },
  d30: takePage(cells.slice(15, 25)),
  d90: takePage(cells.slice(25, 35)),
}))

const LANDS = lines(LAND_ROWS).map((cells) => ({
  channel: cells[0],
  url: cells[1],
  d7: takeLand(cells.slice(2, 8)),
  p7: { uv: num(cells[8]), held: num(cells[9]) },
  d30: takeLand(cells.slice(10, 16)),
  d90: takeLand(cells.slice(16, 22)),
}))

const PATHS = lines(PATH_ROWS).map((cells) => ({
  channel: cells[0],
  level: cells[1],
  name: cells[2],
  d7: num(cells[3]),
  d30: num(cells[4]),
  d90: num(cells[5]),
}))

const SOURCES = lines(SOURCE_ROWS).map((cells) => ({
  cat: cells[0],
  name: cells[1],
  d7: { uv: num(cells[2]), pv: num(cells[3]), leads: num(cells[4]) },
  d30: { uv: num(cells[5]), pv: num(cells[6]), leads: num(cells[7]) },
  d90: { uv: num(cells[8]), pv: num(cells[9]), leads: num(cells[10]) },
}))

const TERMS = lines(TERM_ROWS).map((cells) => ({
  win: cells[0],
  term: cells[1],
  searches: num(cells[2]),
  uv: num(cells[3]),
  zeroHits: num(cells[4]),
  unknown: num(cells[5]),
  leaveUv: num(cells[6]),
}))

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

const HOST = "https://www.shlanbao.cn"

export function pageTitle(url) {
  if (PAGE_TITLES[url]) return PAGE_TITLES[url]
  try {
    const path = decodeURIComponent(new URL(url).pathname)
    return path === "/" ? "首页" : path
  } catch {
    return url
  }
}

function pageType(path) {
  const text = path.toLowerCase()
  if (text === "/" || text === "") return "首页"
  if (text.includes("product_detail") || text.includes("optical_fiber") || text.includes("light_curtain") || text.includes("pressure") || text.includes("magnetic") || text.includes("color_")) return "产品详情页"
  if (text.includes("product_list") || text.includes("products") || text.includes("product_series")) return "产品列表页"
  if (text.includes("contact")) return "联系/询价页"
  if (text.includes("about") || text.includes("strength") || text.includes("manufactur") || text.includes("welfare") || text.includes("service")) return "公司信息/资质/工厂页"
  if (text.includes("application") || text.includes("industry")) return "案例页"
  if (text.includes("news") || text.includes("translate") || text.includes("faq")) return "资讯/文章页"
  if (text.includes("job")) return "招聘"
  if (text.includes("search")) return "站内搜索页"
  if (text.includes("download")) return "下载"
  return "其他"
}

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
        { name: "产品详情页到达率", value: current.detail ? rate(current.detail, current.view) : null, fmt: "pct", empty: "汇总里详情到达为 0，且没有归到产品详情页的类型" },
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

function pageFromVisit(row) {
  return {
    url: row.url,
    name: pageTitle(row.url),
    type: pageType(row.path),
    pv: row.pv,
    uv: row.uv,
    pageStay: stay(row.sec, row.pv),
    qualifyRate: null,
    qualifyRatePrev: null,
    scroll: null,
    viewed: null,
    interactRate: null,
    started: null,
    formDone: null,
    chatLead: null,
    pageLeads: null,
    leadUv: null,
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

function landView(row, key, compare) {
  const cur = row[key]
  const prev = compare ? row.p7 : null
  return {
    url: row.url,
    name: pageTitle(row.url),
    type: "",
    landUv: cur.uv,
    bounceUv: cur.bounce,
    bounce: rate(cur.bounce, cur.uv),
    catchRate: rate(cur.held, cur.uv),
    catchRatePrev: rate(prev?.held, prev?.uv),
    landStay: stay(cur.sec, cur.uv),
    scroll: cur.scroll == null ? null : cur.scroll / 100,
    landLeads: cur.lead,
  }
}

export function getMcpBoard(range) {
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
  const pageKey = range
  const catalog = PAGE_CATALOG[range] || {}
  const landCatalog = LAND_CATALOG[range] || {}
  const pages = {}
  const lands = {}
  ;["all", ...channelIds].forEach((id) => {
    pages[id] = (catalog[id] || [])
      .map(pageFromVisit)
      .sort((a, b) => b.uv - a.uv || b.pv - a.pv)
    const fullLands = landCatalog[id]
    lands[id] = fullLands?.length
      ? fullLands.map(landFromCatalog).sort((a, b) => b.landUv - a.landUv || b.bounceUv - a.bounceUv)
      : LANDS.filter((row) => row.channel === id && row[pageKey]?.uv)
        .map((row) => landView(row, pageKey, win.compare))
        .sort((a, b) => b.landUv - a.landUv)
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
    pathSplit: range ? { all: true } : {},
    sources: SOURCES.map((row) => ({ ...row, ...row[pageKey] })).sort((a, b) => b.uv - a.uv),
    terms,
    lossShare: win.lossUv && win.all.uv ? win.lossUv / win.all.uv : null,
  }
}
