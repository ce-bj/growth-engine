export const checks = [
  {
    id: 'llms-txt',
    name: 'llms.txt 配置',
    status: 'pass',
    concept:
      '这是一份放在网站里、专门给 AI 看的"网站说明书"。它用简短的文字告诉 ChatGPT、豆包这些 AI 引擎：我们公司是做什么的、有哪些产品、哪些页面最值得看。',
    importance:
      '没有这份说明书，AI 引擎需要自己一点点摸索你的网站，可能找不到产品信息，或者抓错内容。有了它，AI 一眼就能看到你的品牌介绍和产品目录，用户问相关问题时，AI 更有可能推荐你的产品。',
    detail: '已自动生成标准 llms.txt，包含品牌摘要、产品目录、核心页面链接',
    expandable: true,
  },
  {
    id: 'schema-jsonld',
    name: 'Schema JSON-LD 结构化数据',
    status: 'pass',
    concept:
      '这是给 AI 看的"产品标签"。就像超市商品上的条形码一样，它把产品的名称、价格、品牌、库存等关键信息，用 AI 能直接读懂的方式标注出来。',
    importance:
      '没有这个标签，AI 只能从网页大段文字里"猜"你的产品信息，容易看错或看漏。有了它，AI 能准确知道"这是哪款产品、多少钱"，在回答用户问题时可以直接引用你的产品信息。',
    detail: '核心页面已配置 4 类标签：公司信息、产品、文章、常见问题',
    expandable: true,
  },
  {
    id: 'robots-txt',
    name: 'robots.txt AI 爬虫准入',
    status: 'pass',
    concept:
      '这是网站的"访客规则"，明确告诉各个 AI 引擎（比如 ChatGPT、豆包、文心一言等）：欢迎来抓取我网站的内容。',
    importance:
      '如果规则写得不清楚，部分 AI 引擎会默认不抓取你的网站，等于把产品信息挡在 AI 门外。我们已经明确对全部主流 AI 引擎开放访问，确保你的网站内容能被它们收录。',
    detail: '8 类 AI 引擎全部放行：ChatGPT、Claude、Perplexity、豆包、Google、Bing、Apple、Meta',
    expandable: true,
  },
  {
    id: 'ssr',
    name: '服务端渲染 SSR',
    status: 'pass',
    concept:
      '这是一种让网页在"打开瞬间就准备好全部内容"的方式。不需要用户和 AI 等待加载，一打开就能看到完整的页面。',
    importance:
      'AI 不像人那样有耐心等待。如果网页要等一会儿才显示内容，AI 可能看到一个空白页就走了，完全抓不到产品信息。我们的网站在 AI 访问时立刻呈现全部内容，确保产品信息不被漏掉。',
    detail: '全站采用即时内容输出，打开即可看到完整内容',
  },
  {
    id: 'https',
    name: 'HTTPS 安全协议',
    status: 'pass',
    concept:
      'HTTPS 是网站的"安全锁"，它加密了用户和网站之间的所有信息传输，防止数据被窃取。浏览器地址栏显示的小锁图标就是它。',
    importance:
      '主流 AI 引擎只信任有安全锁的网站。没有安全锁，AI 可能认为你的网站不安全，降低信任度甚至不收录内容。我们的网站已启用最高级别的安全加密。',
    detail: '全站启用安全加密，达到最高安全级别',
  },
  {
    id: 'sitemap',
    name: 'XML Sitemap 站点地图',
    status: 'pass',
    concept: '这是一份网站的"目录清单"，把网站所有页面的地址列出来，方便 AI 引擎快速找到全部内容。',
    importance:
      '没有这份目录，AI 可能漏掉网站深处的页面，比如某个产品详情页。有了它，AI 能系统地发现并收录你网站的每一个页面，让产品信息更全面地被 AI 引用。',
    detail: '已自动生成站点地图，包含 48 个页面',
  },
  {
    id: 'og-tags',
    name: 'Open Graph 标签',
    status: 'warn',
    concept:
      '这是网页分享时的"名片"。当别人把你的网页链接分享到微信、朋友圈或 AI 平台时，名片决定了显示什么标题、描述和图片。',
    importance:
      'AI 在回答问题时，会参考这张"名片"来理解你的页面。如果名片信息不全，AI 可能用错误的标题和描述介绍你的产品。我们有 3 个产品页还缺少分享图片，补充后会更完整。',
    detail: '3 个产品页缺少分享图片，需补充产品主图',
    expandable: true,
  },
]

export const initialProducts = [
  {
    id: 'p1',
    name: '六角螺栓 M8×30',
    title: '六角螺栓 M8×30',
    url: '/products/hex-bolt-m8x30',
    score: 62,
    issues: [
      { key: 'spec', module: '规格参数', sensitive: true, weight: 12, desc: '整页没有可核验的名称和数值' },
      { key: 'service', module: '售后服务', sensitive: true, weight: 10, desc: '只有「优质售后」，没有服务范围、响应方式或质保事实' },
      { key: 'scene', module: '应用场景', sensitive: false, weight: 8, desc: '只写了「广泛应用于各行业」，没有具体工况' },
      { key: 'faq', module: '常见问题', sensitive: false, weight: 8, desc: '不足 3 组问答' },
    ],
  },
  {
    id: 'p2',
    name: '法兰螺母 M10',
    title: '法兰螺母 M10',
    url: '/products/flange-nut-m10',
    score: 78,
    issues: [
      { key: 'perf', module: '功能性能', sensitive: false, weight: 12, desc: '只有产品名称，没有功能或性能说明' },
      { key: 'install', module: '安装与使用', sensitive: false, weight: 10, desc: '只写了「按说明书使用」，步骤少于 3 个' },
    ],
  },
  {
    id: 'p3',
    name: '膨胀锚栓 M12',
    title: '膨胀锚栓 M12',
    url: '/products/anchor-bolt-m12',
    score: 92,
    issues: [
      { key: 'maintain', module: '维护保养', sensitive: false, weight: 8, desc: '只写了「注意保养」，没有周期和对应动作' },
    ],
  },
  {
    id: 'p4',
    name: '平垫圈 D16',
    title: '平垫圈 D16',
    url: '/products/flat-washer-d16',
    score: 100,
    issues: [],
  },
]

export function buildProductDraft(product) {
  const note = (product.materials?.text || '').trim()
  const files = product.materials?.files || []
  const fileLine = files.length ? `已参考附件：${files.join('、')}。` : ''
  const blocks = ['配图沿用原产品图片地址。']
  if (fileLine) blocks.push(fileLine)

  product.issues.forEach((issue) => {
    if (issue.key === 'spec') {
      blocks.push(
        note
          ? `规格参数\n按补充资料撰写：${note}`
          : '规格参数\n可按直径、长度、材质、强度等级列出参数。未补充资料，此处不写入具体尺寸和强度数字。',
      )
    } else if (issue.key === 'service') {
      blocks.push(
        note
          ? `售后服务\n页面其他区块已有售后说明。以下按补充资料重新撰写，未照搬原区块。\n${note}`
          : '售后服务\n页面其他区块已有售后说明。以下为重新撰写，未照搬原区块。支持按订单提供售后咨询，具体范围以双方确认为准。未补充资料，此处不写入质保年数和上门时效。',
      )
    } else if (issue.key === 'scene') {
      blocks.push('应用场景\n用于机械设备装配，以及钢结构节点的紧固连接。')
    } else if (issue.key === 'faq') {
      blocks.push(
        '常见问题\n问：怎么选直径和长度？\n答：按被连接件厚度和设计孔径选取，具体数值以图纸为准。\n问：安装时要注意什么？\n答：对正孔位后拧紧，避免螺纹损伤。\n问：如何保养？\n答：保持螺纹清洁干燥，定期检查是否松动。',
      )
    } else if (issue.key === 'perf') {
      blocks.push('功能性能\n法兰面增大接触面积，拧紧后不易松动，适合有振动的装配部位。')
    } else if (issue.key === 'install') {
      blocks.push('安装与使用\n1. 核对螺纹规格与被连接件孔径。\n2. 对正法兰面后用手带紧。\n3. 按规定顺序拧紧，并复查是否松动。')
    } else if (issue.key === 'maintain') {
      blocks.push('维护保养\n安装后 7 日内复查拧紧状态。此后按使用环境定期检查锚固是否松动，发现锈蚀及时处理。')
    }
  })

  const summaries = {
    p1: '六角螺栓 M8×30 用于机械设备装配和钢结构节点连接，承担紧固与定位。本页说明适用工况、选型时要核对的规格项，以及安装和保养时常见的问题。',
    p2: '法兰螺母 M10 用于有振动的装配部位，靠法兰面增大接触、减少松动。本页说明它的防松作用，以及核对规格、对正和拧紧的安装步骤。',
    p3: '膨胀锚栓 M12 用于混凝土等基层的重型锚固。本页补充安装后的复查时间和日常检查动作，便于现场保持锚固可靠。',
    p4: '平垫圈 D16 用于螺栓连接中分散压力、保护接触面，适用于一般机械装配。',
  }

  return {
    title: product.title,
    summary: summaries[product.id] || `${product.name} 的产品说明。`,
    content: blocks.join('\n\n'),
  }
}

export const crawlerLogs = [
  { time: '2026-09-23 14:32:18', bot: 'GPTBot', page: '/products/hex-bolt-m8x30', status: 200, duration: '0.42s', ua: 'GPTBot/1.0' },
  { time: '2026-09-23 14:28:05', bot: 'ClaudeBot', page: '/products/flange-nut-m10', status: 200, duration: '0.38s', ua: 'ClaudeBot/1.0' },
  { time: '2026-09-23 14:15:33', bot: 'PerplexityBot', page: '/', status: 200, duration: '0.51s', ua: 'PerplexityBot/1.0' },
  { time: '2026-09-23 13:58:22', bot: 'Googlebot', page: '/products/anchor-bolt-m12', status: 200, duration: '0.33s', ua: 'Googlebot/2.1' },
  { time: '2026-09-23 13:42:10', bot: 'GPTBot', page: '/products/flat-washer-d16', status: 200, duration: '0.29s', ua: 'GPTBot/1.0' },
  { time: '2026-09-23 13:20:47', bot: 'Bytespider', page: '/', status: 200, duration: '0.45s', ua: 'Bytespider/1.0' },
  { time: '2026-09-23 12:55:18', bot: 'ClaudeBot', page: '/products/hex-bolt-m8x30', status: 200, duration: '0.41s', ua: 'ClaudeBot/1.0' },
  { time: '2026-09-23 12:30:05', bot: 'Bingbot', page: '/products/flange-nut-m10', status: 200, duration: '0.36s', ua: 'Bingbot/2.0' },
  { time: '2026-09-23 11:48:33', bot: 'PerplexityBot', page: '/products/anchor-bolt-m12', status: 200, duration: '0.44s', ua: 'PerplexityBot/1.0' },
  { time: '2026-09-23 11:15:22', bot: 'AppleBot', page: '/', status: 200, duration: '0.39s', ua: 'AppleBot/1.0' },
]

export const LLMS_TEXT = `# 越通紧固件 Fasteners

> 邯郸市越通紧固件有限公司，专注高品质紧固件制造 20 年，产品涵盖螺栓、螺母、垫圈、锚栓全品类，服务全球工业客户。

## 产品目录
- [六角螺栓系列](/products/hex-bolts): 规格 M6-M48，材质碳钢/不锈钢
- [法兰螺母系列](/products/flange-nuts): 规格 M6-M24，防松动设计
- [膨胀锚栓系列](/products/anchor-bolts): 规格 M6-M24，重型锚固方案

## 核心页面
- [关于我们](/about): 公司资质、认证、产能介绍
- [产品目录](/products): 全品类紧固件在线目录
- [技术资料](/tech): 选型指南、扭矩表、材质说明
- [FAQ](/faq): 常见问题与解答`

export const PRODUCT_JSONLD = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "六角螺栓 M8×30",
  "brand": { "@type": "Brand", "name": "越通紧固件" },
  "offers": {
    "@type": "Offer",
    "priceCurrency": "CNY",
    "price": "0.85",
    "availability": "https://schema.org/InStock"
  }
}
</script>`

export const ROBOTS_TEXT = `User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: *
Allow: /

Sitemap: https://www.ytfasteners.com/sitemap.xml`

export const BOT_BASELINE = {
  GPTBot: 5,
  ClaudeBot: 4,
  PerplexityBot: 3,
  Googlebot: 3,
  Bytespider: 2,
  Bingbot: 2,
  AppleBot: 1,
}

export const BOT_COLORS = {
  GPTBot: '#10b981',
  ClaudeBot: '#f59e0b',
  PerplexityBot: '#8b5cf6',
  Googlebot: '#3b82f6',
  Bytespider: '#ef4444',
  Bingbot: '#06b6d4',
  AppleBot: '#64748b',
}

export const crawlTrend30d = (() => {
  const bots = Object.keys(BOT_BASELINE)
  const today = new Date(2026, 8, 23)
  const out = []
  for (let i = 29; i >= 0; i -= 1) {
    const day = new Date(today)
    day.setDate(day.getDate() - i)
    const counts = {}
    bots.forEach((bot, index) => {
      const base = BOT_BASELINE[bot]
      const wave = Math.sin(i * 0.7 + index * 1.3) * base * 0.5 + Math.cos(i * 0.4 + index) * 1.2
      const trend = (29 - i) * 0.08
      counts[bot] = Math.max(0, Math.round(base + wave + trend))
    })
    out.push({ date: `${day.getMonth() + 1}/${day.getDate()}`, counts })
  }
  return out
})()
