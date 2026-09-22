/** 智能体概览 mock：对齐访客分析 CNC 贯穿案例，给「很少登录」的人看价值 */

export const overviewPeriod = {
  label: '2026-08-04 ~ 2026-08-31 · 28 天',
}

export const overviewKpis = [
  {
    key: 'uv',
    label: '本期访问',
    value: 1650,
    suffix: '人',
    delta: '与上期持平',
    tone: 'flat' as const,
  },
  {
    key: 'leads',
    label: '留资',
    value: 36,
    suffix: '条',
    delta: '上期 47 · 少 11',
    tone: 'down' as const,
  },
  {
    key: 'cvr',
    label: '询盘转化率',
    value: '2.2%',
    suffix: '',
    delta: '上期 2.8%',
    tone: 'down' as const,
  },
  {
    key: 'browse',
    label: '有效浏览率',
    value: '30%',
    suffix: '',
    delta: '上期 40% · 异常',
    tone: 'down' as const,
  },
]

export const overviewWork = {
  autoRuns: 12,
  closedTickets: 3,
  pendingConfirm: 1,
  pendingTitle: '营销落地页草稿待确认发布',
}

export const overviewFunnel = {
  summary:
    '人来了，但没看进去。有效浏览率 40% 掉到 30%。访客分析已定位，营销页智能体已按广告承诺重做落地页草稿。',
  stages: [
    { id: 'entry', name: '到达', hint: '来了多少人', value: 1650, prev: 1650 },
    { id: 'view', name: '有效浏览', hint: '看进去没', value: 495, prev: 660, drop: true },
    { id: 'interact', name: '互动', hint: '动手没', value: 74, prev: 99 },
    { id: 'lead', name: '留资', hint: '留下没', value: 34, prev: 45, note: '36 条' },
  ],
}

export const overviewTimeline = [
  {
    time: '08-31 09:20',
    title: '落地页草稿待确认发布',
    desc: '首屏对齐「48 小时打样 + ISO」，发布前需您拍板。',
    agent: 'AI智能营销页',
    action: 'confirm' as const,
    view: 'marketing' as const,
  },
  {
    time: '08-31 09:05',
    title: '2 篇内容过质检待发布',
    desc: 'SDPH 产品介绍、PT100 选型指南已自检通过。',
    agent: 'AI内容运营',
    action: 'confirm' as const,
    view: 'content' as const,
  },
  {
    time: '08-31 02:00',
    title: '本期漏斗诊断完成',
    desc: '访问持平，留资下跌，卡点在有效浏览。',
    agent: 'AI访客行为分析',
    action: 'view' as const,
    view: 'visitor' as const,
  },
  {
    time: '08-30 21:40',
    title: '询价意图扫描',
    desc: '询价意向访客增多，多数停在首屏就走。',
    agent: 'AI访客行为分析',
    action: 'view' as const,
    view: 'visitor' as const,
  },
  {
    time: '08-29 11:20',
    title: '本周 6 篇增信内容已发布',
    desc: '全部通过 EEAT / GEO 门禁，无需再处理。',
    agent: 'AI内容运营',
    action: 'view' as const,
    view: 'content' as const,
  },
]

export const overviewOutcomes = [
  { label: '已定位卡点', value: '有效浏览率 -10pp', tone: 'warn' as const },
  { label: '已自动修好', value: 'sitemap / 死链', tone: 'ok' as const },
  { label: '已出草稿', value: '1 份落地页', tone: 'ok' as const },
]
