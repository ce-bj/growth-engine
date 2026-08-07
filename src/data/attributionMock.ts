/**
 * 业务指标归因分析 Mock（线 B）— 对齐产品方案 v1.4 第 10 章案例集
 * 9 例按「周期」分布到 5 期报告：一个周期只有一条留资率主线，每期指标自洽，
 * 期与期之间留资率水平连成时间线：
 *   P1 流量危机(稳定3.2) → P2 转化卡点(3.2→2.7) → 恢复 → P3 平台期(持平3.2)
 *   → P4 回升(3.2→3.7，采纳 P3 建议) → 本期 承接危机(3.7→3.2)
 * 分析过程统一 Agent 五步口吻：体检 → 定位 → 下钻 → 验证 → 结论
 */
import type {
  AttributionChange,
  AttributionReport,
  AgentTaskRow,
} from '../types'

/* ── 变化条目（9 例，按方案第 10 章编号） ─────────────────────── */

/** 案例 1 · 落地页优化（异常 · 确认后交接 · 成功）— 本期 */
const change1: AttributionChange = {
  id: 'chg-1',
  changeType: 'down',
  changedMetric: '留资率',
  changedValue: '3.2%',
  baselineValue: '3.7%',
  changeAmount: '比上期下降 0.5%',
  severity: 'P0',
  funnelSegment: 'landing_page',
  rootCause: '广告渠道落地页与广告创意不匹配',
  causeCategory: '内容不匹配搜索意图',
  confidence: 'high',
  evidence: [
    '广告渠道落地页跳出率 52%，显著高于其他渠道 42%',
    '广告渠道访客平均停留时长仅 28 秒，低于全站均值 45 秒',
    '广告渠道落地页滚动深度集中在首屏，产品区到达率不足 30%',
  ],
  analysisSteps: [
    '体检：本周留资率 3.2%，较上期 3.7% 跌 0.5pp，命中异常规则，定级 P0；UV 未跌。',
    '定位：UV 没跌 + 跳出率升，不是流量问题，定位到 ②落地页段。',
    '下钻：调渠道明细——广告渠道跳出率 52%，其他渠道平均 42%，仅广告渠道异常。',
    '验证：假设「落地页与广告创意不匹配」→ 广告访客停留 28s<45s ✓、滚动集中首屏（产品区到达率<30%）✓、跳出显著偏高 ✓，三条全成立。',
    '结论：广告渠道落地页与广告创意不匹配（高置信度 · 流失原因库「内容不匹配搜索意图」）。',
  ],
  measures: [
    {
      measureId: 'm-1-1',
      description: '按广告搜索意图重写落地页内容，匹配创意承诺',
      rootCause: '广告渠道落地页与广告创意不匹配',
      rootCauseConfidence: 'high',
      evidenceCard: {
        currentValue: '广告渠道落地页跳出率 52%',
        benchmark: '高于行业平均 42%',
        action: '按搜索意图重写落地页内容',
      },
      measureType: 'root_cure',
      cost: 'medium',
      timeToEffect: 'week',
      risk: 'low',
      targetModule: 'ai_content_engine',
      suggestedBoundary: 'confirm',
      reviewPeriod: 'T+7',
      demoPublishEnabled: true,
      deliverable: {
        kind: 'rewrite',
        title: '广告渠道落地页 · 重写版（预览）',
        url: '/preview/landing/ads-v2',
        previewNote: '按广告搜索意图重写：首屏对齐创意承诺，产品区上移，新增痛点-方案-案例结构。',
      },
      execStatus: 'pending_confirm',
    },
  ],
  reviewScript: {
    result: 'success',
    note: 'T+7 复盘：广告渠道跳出率 52%→44%（回归正常区间），同期其他渠道无变化，控制变量成立；该渠道线索销售转化率提升 8%，销售贡献显著。沉淀为标准措施「直接使用」。',
  },
}

/** 案例 2 · 404/死链修复（异常 · 可直接修复 · 成功）— 本期 */
const change2: AttributionChange = {
  id: 'chg-2',
  changeType: 'down',
  changedMetric: '网站健康度',
  changedValue: '死链 23 条',
  baselineValue: '死链 0 条',
  changeAmount: '新增 23 条',
  severity: 'P2',
  funnelSegment: 'landing_page',
  rootCause: '落地页 404/死链',
  causeCategory: '加载慢/技术问题',
  confidence: 'high',
  evidence: [
    '健康度问题列表新增 P0 问题：死链暴增 23 条',
    '死链集中在落地页与产品详情页',
    '死链页面跳出率 78%，显著高于正常页面',
  ],
  analysisSteps: [
    '体检：健康度问题列表新增 P0「死链暴增 23 条」，承接段跳出率微升，定级 P2。',
    '定位：技术因素干扰承接，定位到 ②落地页段。',
    '下钻：调页面明细——死链集中在落地页与产品详情页。',
    '验证：假设「死链导致跳出」→ 死链页跳出率 78% 显著高于正常页面 ✓，假设成立。',
    '结论：落地页 404/死链（高置信度 · 流失原因库「加载慢/技术问题」，技术止血类）。',
  ],
  measures: [
    {
      measureId: 'm-2-1',
      description: '修复 23 条死链，失效页面做 301 重定向',
      rootCause: '落地页 404/死链',
      rootCauseConfidence: 'high',
      evidenceCard: {
        currentValue: '死链 23 条集中在落地页',
        benchmark: '健康度问题列表 P0 级',
        action: '修复链接 / 301 重定向',
      },
      measureType: 'quick_fix',
      cost: 'low',
      timeToEffect: 'instant',
      risk: 'low',
      targetModule: 'tool_agent',
      suggestedBoundary: 'auto',
      reviewPeriod: 'T+3',
      deliverable: {
        kind: 'log',
        title: '死链修复执行日志',
        url: '/logs/deadlink-fix-2026-07-30',
        previewNote: '已修复 23 条死链：18 条修复链接，5 条 301 重定向至有效页面。',
      },
      execStatus: 'pending_confirm',
    },
  ],
  reviewScript: {
    result: 'success',
    note: 'T+3 复盘：死链 23→0，承接段跳出率回落，措施起效。沉淀为标准措施「直接使用」；销售贡献待观察（短期）。',
  },
}

/** 案例 3 · 预算削减（异常 · 仅展示 · 不追踪）— P1 流量危机期 */
const change3: AttributionChange = {
  id: 'chg-3',
  changeType: 'down',
  changedMetric: '广告渠道 UV',
  changedValue: '296',
  baselineValue: '494',
  changeAmount: '比上期下降 40%',
  severity: 'P1',
  funnelSegment: 'channel_arrival',
  rootCause: '广告投放预算削减（疑似外部因素）',
  causeCategory: '外部因素',
  confidence: 'medium',
  evidence: [
    '仅广告渠道 UV 环比跌 40%，其他渠道正常',
    '站内无内容/落地页变更记录',
    '留资数随广告 UV 同步下降，留资率未变',
  ],
  analysisSteps: [
    '体检：广告渠道 UV 494→296，环比跌 40%，命中异常规则，定级 P1；留资数同步下跌，留资率未变（量少了但质没变）。',
    '定位：UV 跌 + 留资数跌，定位到 ①渠道到达段。',
    '下钻：调渠道明细——仅广告渠道骤降，社交/SEO/直接访问均正常。',
    '验证：假设「预算削减」→ 站内无任何变更记录 ✓ 排除站内因素；留资率未变 ✓；投放账户数据站内不可查，无法进一步验证，标注「疑似外部因素」。',
    '结论：广告投放预算削减（中置信度 · 外部因素）。',
  ],
  measures: [
    {
      measureId: 'm-3-1',
      description: '检查广告投放账户预算设置，建议恢复至原预算水平',
      rootCause: '广告投放预算削减',
      rootCauseConfidence: 'medium',
      evidenceCard: {
        currentValue: '广告渠道 UV 494→296（-40%）',
        benchmark: '其他渠道 UV 正常',
        action: '建议恢复/调整广告预算',
      },
      measureType: 'root_cure',
      cost: 'high',
      timeToEffect: 'week',
      risk: 'medium',
      targetModule: 'none',
      suggestedBoundary: 'advice_only',
      execStatus: 'advice_only',
    },
  ],
}

/** 案例 4 · SEO 收录减少（异常 · 确认后交接 · T+30 未改善 · 失败沉淀）— P1 流量危机期 */
const change4: AttributionChange = {
  id: 'chg-4',
  changeType: 'down',
  changedMetric: 'SEO 渠道 UV',
  changedValue: '188',
  baselineValue: '222',
  changeAmount: '比上期下降 15%',
  severity: 'P1',
  funnelSegment: 'channel_arrival',
  rootCause: 'SEO 收录减少',
  causeCategory: '流量不精准/渠道匹配差',
  confidence: 'high',
  evidence: [
    '仅 SEO 渠道 UV 环比跌 15%，其他渠道正常',
    'SEO 关键词排名未降，排除排名因素',
    'Search Console 收录数下降',
  ],
  analysisSteps: [
    '体检：外贸 SEO 渠道 UV 222→188，环比跌 15%，命中异常规则，定级 P1；留资数随 UV 同步下降。',
    '定位：SEO 渠道 UV 跌 + 留资数跌，定位到 ①渠道到达段。',
    '下钻：调渠道明细——仅 SEO 渠道下降，其他渠道正常。',
    '验证：假设「收录减少」→ SEO 排名未降 ✓ 排除排名因素；Search Console 收录数下降 ✓，假设成立。',
    '结论：SEO 收录减少（高置信度 · 流失原因库「流量不精准/渠道匹配差」）。',
  ],
  measures: [
    {
      measureId: 'm-4-1',
      description: '补结构化数据 JSON-LD，重新提交 sitemap',
      rootCause: 'SEO 收录减少',
      rootCauseConfidence: 'high',
      evidenceCard: {
        currentValue: 'SEO 渠道 UV 222→188（-15%）',
        benchmark: '排名未降但收录数下降',
        action: '补结构化数据 JSON-LD + 提交 sitemap',
      },
      measureType: 'root_cure',
      cost: 'low',
      timeToEffect: 'month',
      risk: 'low',
      targetModule: 'ai_content_engine',
      suggestedBoundary: 'confirm',
      reviewPeriod: 'T+30',
      deliverable: {
        kind: 'page',
        title: '结构化数据 JSON-LD + sitemap 提交记录',
        url: '/logs/seo-structured-data-2026-07-30',
        previewNote: '已为 42 个产品页补 JSON-LD（Product/FAQ），sitemap 已重新提交 Search Console。',
      },
      execStatus: 'success',
    },
  ],
  reviewResult: 'failed',
  reviewNote:
    'T+30 复盘：SEO UV 222→218，未见改善。措施沉淀为「弃用」，异常任务已重开归因，回第 3 步重新下钻（候选方向：算法更新/竞对挤压，需调第二层数据再验证）。',
}

/** 案例 5 · CTA 文案优化（异常 · 确认后交接 · 部分改善）— P2 转化入口卡点儿（已复盘） */
const change5: AttributionChange = {
  id: 'chg-5',
  changeType: 'down',
  changedMetric: '留资率',
  changedValue: '2.7%',
  baselineValue: '3.2%',
  changeAmount: '比上期下降 0.5%',
  severity: 'P0',
  funnelSegment: 'conversion_interaction',
  rootCause: 'CTA 按钮文案不诱人',
  causeCategory: 'CTA 不明显/时机不对',
  confidence: 'medium',
  evidence: [
    'UV 与跳出率均正常，排除流量与承接问题',
    '详情页→询盘页 CTA 点击率仅 15%，低于行业 25%',
    'A/B 测试显示「获取报价」点击率高于「提交」38%',
  ],
  analysisSteps: [
    '体检：留资率 2.7%，环比跌 0.5pp，命中异常规则，定级 P0；UV 正常、跳出率正常。',
    '定位：前段（UV/跳出）正常而留资跌，定位到 ④转化交互段。',
    '下钻：调入口类型明细——CTA 点击率仅 15%，低于行业平均 25%。',
    '验证：假设「CTA 文案不诱人」→ A/B 测试「获取报价」点击率比「提交」高 38% ✓，假设成立。',
    '结论：CTA 按钮文案不诱人（中置信度 · 流失原因库「CTA 不明显/时机不对」）。',
  ],
  measures: [
    {
      measureId: 'm-5-1',
      description: '优化 CTA 文案为价值导向（如「获取报价」），并做 A/B 测试验证',
      rootCause: 'CTA 按钮文案不诱人',
      rootCauseConfidence: 'medium',
      evidenceCard: {
        currentValue: 'CTA 点击率 15%',
        benchmark: '低于行业平均 25%',
        action: '优化 CTA 文案 + A/B 测试',
      },
      measureType: 'root_cure',
      cost: 'low',
      timeToEffect: 'week',
      risk: 'low',
      targetModule: 'conversion_path_designer',
      suggestedBoundary: 'confirm',
      reviewPeriod: 'T+7',
      deliverable: {
        kind: 'ab_test',
        title: 'CTA 文案 A/B 变体（3 版）',
        url: '/preview/cta-variants',
        previewNote: '变体 A「获取专属报价」/ 变体 B「免费获取方案」/ 变体 C「立即咨询工程师」，已上线 50% 分流 A/B。',
      },
      execStatus: 'success',
    },
  ],
  reviewResult: 'partial',
  reviewNote:
    'T+7 复盘：留资率 2.7%→3.0%，有改善但未回归正常区间（≥3.2%），判定部分改善。沉淀为「调整后使用」，已追加措施（叠加增加 CTA 入口），次期留资率恢复至 3.2%。',
}

/** 案例 6 · 产品详情页优化（异常 · 确认后交接 · 成功）— 本期 */
const change6: AttributionChange = {
  id: 'chg-6',
  changeType: 'down',
  changedMetric: '产品详情页转化率',
  changedValue: '1.2%',
  baselineValue: '3.8%',
  changeAmount: '比上期下降 2.6%',
  severity: 'P2',
  funnelSegment: 'lead_success',
  rootCause: '产品详情页内容不符合行业规范，缺关键模块',
  causeCategory: '内容不吸引/没找到信息',
  confidence: 'high',
  evidence: [
    '/products/cnc-machining 页转化率 3.8%→1.2%，入榜跌幅 TOP5',
    '该页平均停留 32 秒，低于行业均值 60 秒',
    '内容字数低于行业均值，缺规格表与售后保障模块',
  ],
  analysisSteps: [
    '体检：页面转化率跌幅 TOP5 入榜——/products/cnc-machining 转化率 3.8%→1.2%，入榜即异常信号，定级 P2。',
    '定位：该页 UV 正常、跳出率略升、留资率跌，定位到 ⑤成功留资段。',
    '下钻：调页面明细，定位到该产品详情页。',
    '验证：假设「详情页内容质量差」→ 停留 32s<行业 60s ✓、内容字数低于行业均值 ✓、缺规格表/售后模块 ✓，三条全成立。',
    '结论：详情页内容不符合行业规范且缺关键模块（高置信度 · 流失原因库「内容不吸引/没找到信息」）。',
  ],
  measures: [
    {
      measureId: 'm-6-1',
      description: '按行业规范重写详情页，补充规格表与售后保障模块',
      rootCause: '详情页内容不符合行业规范',
      rootCauseConfidence: 'high',
      evidenceCard: {
        currentValue: '该详情页转化率 3.8%→1.2%，停留 32s',
        benchmark: '停留低于行业均值 60s',
        action: '按行业规范重写详情页 + 补规格表/售后模块',
      },
      measureType: 'root_cure',
      cost: 'medium',
      timeToEffect: 'week',
      risk: 'low',
      targetModule: 'ai_content_engine',
      suggestedBoundary: 'confirm',
      reviewPeriod: 'T+7',
      deliverable: {
        kind: 'rewrite',
        title: '产品详情页 · 重写版（预览）',
        url: '/preview/products/cnc-machining-v2',
        previewNote: '按行业规范重写：补规格参数表、售后保障模块、应用案例与 FAQ，字数达到行业均值。',
      },
      execStatus: 'pending_confirm',
    },
  ],
  reviewScript: {
    result: 'success',
    note: 'T+7 复盘：该页转化率 1.2%→3.5%（回归正常区间），措施起效；该页来源线索销售转化率提升 12%，销售贡献显著。沉淀为标准措施「直接使用」（按行业规范重写+补规格表）。',
  },
}

/** 案例 7 · SEO 内容优化见效（提升 · 夸赞不执行）— P4 回升期 */
const change7: AttributionChange = {
  id: 'chg-7',
  changeType: 'up',
  changedMetric: '留资率',
  changedValue: '3.7%',
  baselineValue: '3.2%',
  changeAmount: '比上期上升 0.5%',
  severity: null,
  funnelSegment: 'landing_page',
  rootCause: 'SEO 内容优化使落地页更匹配搜索意图',
  causeCategory: '内容匹配搜索意图',
  confidence: 'high',
  evidence: [
    'SEO 渠道跳出率从 48% 降至 41%',
    'SEO 落地页滚动深度变深，平均停留时长从 38s 升至 52s',
    '采纳上期「持平」建议后恢复内容周更，近 2 周持续产出新内容',
  ],
  analysisSteps: [
    '体检：本周留资率 3.7%，环比提升 0.5pp，命中提升规则；UV 同步涨 8%。',
    '定位：UV 涨 + 跳出率降，定位到 ②落地页段提升。',
    '下钻：调渠道明细——SEO 渠道跳出率 48%→41%，其他渠道无明显变化。',
    '验证：假设「SEO 内容优化见效」→ SEO 落地页滚动变深 ✓、停留 38s→52s ✓、近 2 周恢复周更（采纳上期持平期的内容更新建议）✓，三条全成立。',
    '结论：SEO 内容优化使落地页更匹配搜索意图（高置信度 · 提升原因库「内容匹配搜索意图/首屏价值强」）。',
  ],
  praiseText:
    '本周留资率提升 0.5pp，主要因 SEO 内容优化见效——落地页更匹配搜索意图，SEO 渠道跳出率从 48% 降到 41%。上期持平期的内容更新建议被采纳，效果已经显现。',
  keepAdvice: '继续强化 SEO 内容产出，保持周更频率，重点维护带来转化的 TOP5 落地页。',
}

/** 案例 8 · 内容长期未更新（持平 · 说明+建议仅展示）— P3 平台期 */
const change8: AttributionChange = {
  id: 'chg-8',
  changeType: 'flat',
  changedMetric: '留资率',
  changedValue: '3.2%',
  baselineValue: '3.2%',
  changeAmount: '与上期持平',
  severity: null,
  funnelSegment: 'site_browsing',
  rootCause: '内容无更新（长期未运营）',
  causeCategory: '内容无更新',
  confidence: 'high',
  evidence: [
    '留资率连续 2 期维持 3.2%±0.1pp（CTA 优化恢复后进入平台）',
    '各渠道 UV 占比稳定，无新增流量来源',
    'TOP5 落地页内容更新记录近 30 天为 0',
  ],
  analysisSteps: [
    '体检：留资率连续 2 期维持 3.2%±0.1pp，命中持平规则；UV/PV/跳出率均无明显变化。',
    '定位：各段指标均平稳，定位全段。',
    '下钻：调渠道/页面明细——各渠道占比稳定、无新增渠道；TOP5 落地页内容更新频率为 0。',
    '验证：假设「内容无更新（长期未运营）」→ 近 30 天更新记录为 0 ✓、页面无变化 ✓、无新内容上线 ✓，三条全成立。',
    '结论：内容无更新，缺乏新增流量与转化动力（高置信度 · 持平原因库「内容无更新」）。',
  ],
  explainText:
    '留资率连续 2 期维持 3.2%，主要因内容长期未更新，没有新增流量与转化动力。当前转化结构稳定，但增长缺乏引擎。',
  improveSuggestions: [
    {
      suggestion: '更新 TOP5 流量落地页内容，注入新的转化动力',
      targetModule: 'ai_content_engine',
      expectedEffect: '预计提升留资率 0.3-0.5pp',
    },
  ],
}

/** 案例 9 · 意图内容缺口（异常 · 确认后交接 · 智能营销页生成 · 成功）— 本期 */
const change9: AttributionChange = {
  id: 'chg-9',
  changeType: 'down',
  changedMetric: '落地页跳出率',
  changedValue: '53%',
  baselineValue: '46%',
  changeAmount: '比上期上升 7%',
  severity: 'P1',
  funnelSegment: 'landing_page',
  rootCause: '配件类采购意图存在内容缺口',
  causeCategory: '内容不匹配搜索意图 · 内容缺口',
  confidence: 'high',
  intentData: {
    siteSearch:
      '「CNC 加工配件/主轴配件」类搜索占比升至 22%，但 0 结果率 85%、搜索后跳出率 90%（站内搜索量周环比 +60%）',
    inboundKeyword: 'SEO 来路关键词中配件类词点击量上升，落地页却都是通用产品列表页',
    csIntent: '客服对话中配件咨询占比升至 18%',
  },
  evidence: [
    '配件类搜索词无匹配页面，0 结果率 85%',
    '客服对话中配件咨询占比升至 18%',
    '竞品均有配件专区承接该意图',
  ],
  analysisSteps: [
    '体检：落地页跳出率 46%→53%，环比升 7pp，定级 P1；同期站内搜索量周环比 +60%，两个信号联动异常（模型兜底命中，人工标注为真异常）。',
    '定位：UV 未跌 + 跳出率升，定位到 ②落地页段。',
    '下钻：调意图数据（query_search_intent）——站内搜索词中「CNC 加工配件/主轴配件」类占比升至 22%，0 结果率 85%、搜索后跳出率 90%；SEO 来路配件类词点击上升，落地页却是通用产品列表页。',
    '验证：假设「内容缺口——配件采购意图无承接内容」→ 配件类搜索词无匹配页面 ✓、客服对话配件咨询占比升至 18% ✓、竞品均有配件专区 ✓，三条全成立。',
    '结论：配件类采购意图存在内容缺口（高置信度 · 流失原因库「内容不匹配搜索意图」→ 细分「内容缺口」）。',
  ],
  measures: [
    {
      measureId: 'm-9-1',
      description: '生成「CNC 加工配件」智能营销页：配件选型表 + 适配机型 + FAQ，承接配件采购意图',
      rootCause: '配件类采购意图存在内容缺口',
      rootCauseConfidence: 'high',
      evidenceCard: {
        currentValue: '配件类站内搜索周环比 +60%、0 结果率 85%',
        benchmark: '竞品均有配件专区承接该意图',
        action: '生成「CNC 加工配件」智能营销页承接该意图',
      },
      measureType: 'root_cure',
      cost: 'medium',
      timeToEffect: 'week',
      risk: 'low',
      targetModule: 'ai_content_engine',
      suggestedBoundary: 'confirm',
      reviewPeriod: 'T+14',
      deliverable: {
        kind: 'page',
        title: 'CNC 加工配件 · 智能营销页（预览）',
        url: '/preview/marketing/cnc-parts',
        previewNote: '智能营销页生成 Agent 产出：配件选型表、适配机型对照、FAQ，已审核上线。',
      },
      execStatus: 'pending_confirm',
    },
  ],
  reviewScript: {
    result: 'success',
    note: 'T+14 复盘：配件类搜索 0 结果率 85%→0%，配件意图访客跳出率 53%→38%，新页带来留资 12 条，其中 2 条进入报价流程，销售贡献显著。沉淀为标准措施「直接使用」（意图缺口 → 智能营销页生成）；配件类搜索词聚类已回流 L3 搜索意图精准匹配，更新意图库。',
  },
}

/* ── 归因报告（本期 1 期 + 历史 4 期，按时间线排列） ───────────── */

/** 本期 · 2026-07-23 ~ 07-30「承接危机」：落地页段问题集中爆发，4 条异常可交互确认/交接 */
export const mockAttributionReport: AttributionReport = {
  id: 'attr-rpt-2026-07-30',
  periodLabel: '2026-07-23 ~ 2026-07-30',
  generatedAt: '2026-07-30 09:00',
  periodDays: 7,
  nextAnalysisAt: '2026-08-06 09:00',
  siteId: 'site-1',
  changes: [change1, change9, change2, change6],
}

/** 历史 4 期（新 → 旧）：全部已完结，静态展示复盘结论 */
export const mockAttributionHistoryReports: AttributionReport[] = [
  {
    // P4 回升期：采纳 P3 持平期建议恢复周更 → 留资率 3.2→3.7（夸赞）
    id: 'attr-rpt-2026-07-23',
    periodLabel: '2026-07-16 ~ 2026-07-23',
    generatedAt: '2026-07-23 09:00',
    periodDays: 7,
    nextAnalysisAt: '2026-07-30 09:00',
    siteId: 'site-1',
    changes: [change7],
  },
  {
    // P3 平台期：CTA 优化恢复后留资率持平 3.2，归因「内容无更新」→ 出建议
    id: 'attr-rpt-2026-07-16',
    periodLabel: '2026-07-09 ~ 2026-07-16',
    generatedAt: '2026-07-16 09:00',
    periodDays: 7,
    nextAnalysisAt: '2026-07-23 09:00',
    siteId: 'site-1',
    changes: [change8],
  },
  {
    // P2 转化入口卡点：留资率 3.2→2.7，CTA 文案优化 → T+7 部分改善
    id: 'attr-rpt-2026-07-09',
    periodLabel: '2026-07-02 ~ 2026-07-09',
    generatedAt: '2026-07-09 09:00',
    periodDays: 7,
    nextAnalysisAt: '2026-07-16 09:00',
    siteId: 'site-1',
    changes: [change5],
  },
  {
    // P1 流量危机：广告（仅展示）+ SEO（交接后 T+30 未改善，失败沉淀）
    id: 'attr-rpt-2026-06-23',
    periodLabel: '2026-06-16 ~ 2026-06-23',
    generatedAt: '2026-06-23 09:00',
    periodDays: 7,
    nextAnalysisAt: '2026-06-30 09:00',
    siteId: 'site-1',
    changes: [change3, change4],
  },
]

/* ── 智能体任务中心 · 归因任务（每期报告一条） ────────────────── */

export const mockAttributionTasks: AgentTaskRow[] = [
  {
    id: 'atask-1',
    module: 'attribution',
    title: '业务指标归因报告 · 4 条变化',
    summary: '异常 4 · 落地页段问题集中',
    status: 'pending',
    priority: 'P0',
    createdAt: '2026-07-30 09:00',
    updatedAt: '2026-07-30 09:00',
    attributionReportId: 'attr-rpt-2026-07-30',
  },
  {
    id: 'atask-h4',
    module: 'attribution',
    title: '业务指标归因报告 · 1 条变化',
    summary: '提升 1 · 已夸赞',
    status: 'done',
    priority: null,
    createdAt: '2026-07-23 09:00',
    updatedAt: '2026-07-23 09:00',
    attributionReportId: 'attr-rpt-2026-07-23',
  },
  {
    id: 'atask-h3',
    module: 'attribution',
    title: '业务指标归因报告 · 1 条变化',
    summary: '持平 1 · 已出提升建议',
    status: 'done',
    priority: null,
    createdAt: '2026-07-16 09:00',
    updatedAt: '2026-07-16 09:00',
    attributionReportId: 'attr-rpt-2026-07-16',
  },
  {
    id: 'atask-h2',
    module: 'attribution',
    title: '业务指标归因报告 · 1 条变化',
    summary: '异常 1 · 复盘部分改善',
    status: 'done',
    priority: 'P0',
    createdAt: '2026-07-09 09:00',
    updatedAt: '2026-07-17 09:00',
    attributionReportId: 'attr-rpt-2026-07-09',
  },
  {
    id: 'atask-h1',
    module: 'attribution',
    title: '业务指标归因报告 · 2 条变化',
    summary: '异常 2 · 1 条仅展示 · 1 条复盘未改善已沉淀',
    status: 'done',
    priority: 'P1',
    createdAt: '2026-06-23 09:00',
    updatedAt: '2026-07-24 09:00',
    attributionReportId: 'attr-rpt-2026-06-23',
  },
]

/** 归因分析周期默认配置 */
export const DEFAULT_ATTRIBUTION_CONFIG = {
  enabled: true,
  periodDays: 7,
}
