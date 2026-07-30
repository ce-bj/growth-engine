/**
 * 业务指标归因分析 Mock（线 B）— 对齐产品方案 v1.1 第 10 章案例集
 * 8 例覆盖三类变化（异常/提升/持平）+ 6 段漏斗 + 三档执行边界 + 复盘判定
 */
import type {
  AttributionChange,
  AttributionReport,
  AgentTaskRow,
} from '../types'

/* ── 变化条目（8 例） ─────────────────────────────────────────── */

/** 案例 1 · 落地页优化（异常 · 确认后执行 · 成功） */
const change1: AttributionChange = {
  id: 'chg-1',
  changeType: 'down',
  changedMetric: '留资率',
  changedValue: '2.7%',
  baselineValue: '3.2%',
  changeAmount: '-0.5pp',
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
    '本周留资率 2.7%，环比下降 0.5pp，触发异常规则（P0）。',
    'UV 未下降，排除流量侧问题，定位到落地页段。',
    '下钻渠道维度：广告渠道跳出率 52%，其他渠道平均 42%，广告渠道明显异常。',
    '验证假设"落地页与创意不匹配"：广告访客停留 28s 偏短、滚动深度浅，假设成立。',
    '结论：广告渠道落地页与创意不匹配（高置信度）。',
  ],
  measures: [
    {
      measureId: 'm-1-1',
      description: '按广告搜索意图重写落地页内容，匹配创意承诺',
      rootCause: '广告渠道落地页与创意不匹配',
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
      execStatus: 'pending_confirm',
    },
  ],
}

/** 案例 2 · 404/死链修复（异常 · 自动执行 · 成功） */
const change2: AttributionChange = {
  id: 'chg-2',
  changeType: 'down',
  changedMetric: '网站健康度',
  changedValue: '死链 23 条',
  baselineValue: '死链 0 条',
  changeAmount: '+23',
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
    '网站健康度检测发现死链 23 条，承接段跳出率微升。',
    '下钻页面维度：死链集中在落地页与产品详情页。',
    '验证假设"死链导致跳出"：死链页跳出率 78% 显著偏高，假设成立。',
    '结论：落地页 404/死链（高置信度，技术止血类）。',
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
      execStatus: 'pending_confirm',
    },
  ],
}

/** 案例 3 · 预算削减（异常 · 只出方案 · 不追踪） */
const change3: AttributionChange = {
  id: 'chg-3',
  changeType: 'down',
  changedMetric: '广告渠道 UV',
  changedValue: '296',
  baselineValue: '494',
  changeAmount: '-40%',
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
    '广告渠道 UV 494→296，环比跌 40%，触发异常规则（P1）。',
    '下钻渠道：仅广告渠道骤降，社交/SEO/直接访问均正常。',
    '验证假设"预算削减"：站内无任何变更，留资率未变（来的量少了但质没变），疑似投放侧外部因素，站内数据无法进一步验证。',
    '结论：广告投放预算削减（中置信度，疑似外部因素）。',
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

/** 案例 5 · CTA 文案优化（异常 · 确认后执行 · 部分改善） */
const change5: AttributionChange = {
  id: 'chg-5',
  changeType: 'down',
  changedMetric: '留资率',
  changedValue: '2.7%',
  baselineValue: '3.2%',
  changeAmount: '-0.5pp',
  severity: 'P0',
  funnelSegment: 'conversion_entry',
  rootCause: 'CTA 按钮文案不诱人',
  causeCategory: 'CTA 不明显/时机不对',
  confidence: 'medium',
  evidence: [
    'UV 与跳出率均正常，排除流量与承接问题',
    '详情页→询盘页 CTA 点击率仅 15%，低于行业 25%',
    'A/B 测试显示"获取报价"点击率高于"提交"38%',
  ],
  analysisSteps: [
    '留资率 2.7%，环比跌 0.5pp（P0），但 UV 正常、跳出率正常。',
    '定位到转化入口触发段。',
    '下钻入口类型：CTA 点击率 15%，低于行业平均 25%。',
    '验证假设"CTA 文案不诱人"：A/B 测试"获取报价"比"提交"点击率高 38%，假设成立。',
    '结论：CTA 按钮文案不诱人（中置信度）。',
  ],
  measures: [
    {
      measureId: 'm-5-1',
      description: '优化 CTA 文案为价值导向（如"获取报价"），并做 A/B 测试验证',
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
      execStatus: 'pending_confirm',
    },
  ],
}

/** 案例 6 · 产品详情页优化（异常 · 确认后执行 · 成功） */
const change6: AttributionChange = {
  id: 'chg-6',
  changeType: 'down',
  changedMetric: '产品详情页转化率',
  changedValue: '1.2%',
  baselineValue: '3.8%',
  changeAmount: '-2.6pp',
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
    '页面转化率跌幅 TOP5 入榜：/products/cnc-machining 转化率 3.8%→1.2%。',
    '该页 UV 正常、跳出率略升、留资率跌，定位到成功留资段。',
    '验证假设"详情页内容质量差"：停留 32s 偏短、缺规格表/售后模块，假设成立。',
    '结论：详情页内容不符合行业规范且缺关键模块（高置信度）。',
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
      execStatus: 'pending_confirm',
    },
  ],
}

/** 案例 7 · SEO 内容优化见效（提升 · 夸赞不执行） */
const change7: AttributionChange = {
  id: 'chg-7',
  changeType: 'up',
  changedMetric: '留资率',
  changedValue: '3.7%',
  baselineValue: '3.2%',
  changeAmount: '+0.5pp',
  severity: null,
  funnelSegment: 'landing_page',
  rootCause: 'SEO 内容优化使落地页更匹配搜索意图',
  causeCategory: '内容匹配搜索意图',
  confidence: 'high',
  evidence: [
    'SEO 渠道跳出率从 48% 降至 41%',
    'SEO 落地页滚动深度变深，平均停留时长从 38s 升至 52s',
    '近 4 周保持周更内容节奏',
  ],
  analysisSteps: [
    '本周留资率 3.7%，环比提升 0.5pp，触发提升规则。',
    'UV 同步涨 8%，定位到落地页段提升。',
    '下钻渠道：SEO 渠道跳出率 48%→41%，其他渠道无明显变化。',
    '验证：SEO 落地页停留变长、滚动变深，近期持续周更内容，归因成立。',
  ],
  praiseText: '本周留资率提升 0.5pp，主要因 SEO 内容优化见效——落地页更匹配搜索意图，SEO 渠道跳出率从 48% 降到 41%。',
  keepAdvice: '继续保持当前内容周更节奏，重点维护带来转化的 TOP5 落地页。',
}

/** 案例 8 · 内容长期未更新（持平 · 说明+建议只出方案） */
const change8: AttributionChange = {
  id: 'chg-8',
  changeType: 'flat',
  changedMetric: '留资率',
  changedValue: '3.0%',
  baselineValue: '3.0%',
  changeAmount: '持平',
  severity: null,
  funnelSegment: 'site_browsing',
  rootCause: '内容无更新（长期未运营）',
  causeCategory: '内容无更新',
  confidence: 'high',
  evidence: [
    '留资率连续 4 期维持 3.0%±0.1pp',
    '各渠道 UV 占比稳定，无新增流量来源',
    'TOP5 落地页内容更新记录近 30 天为 0',
  ],
  analysisSteps: [
    '留资率连续 4 期维持 3.0%，触发持平规则。',
    '各段指标均平稳：UV 稳定、跳出率稳定、各渠道占比不变。',
    '下钻运营行为：TOP5 落地页近 30 天无内容更新，无新内容上线。',
    '结论：内容长期未更新，缺乏新增流量与转化动力（高置信度）。',
  ],
  explainText: '留资率连续 4 期维持 3.0%，主要因内容长期未更新，没有新增流量与转化动力。当前转化结构稳定，但增长缺乏引擎。',
  improveSuggestions: [
    {
      suggestion: '更新 TOP5 流量落地页内容，注入新的转化动力',
      targetModule: 'ai_content_engine',
      expectedEffect: '预计提升留资率 0.3-0.5pp',
    },
  ],
}

/* ── 本期归因报告 ─────────────────────────────────────────────── */

export const mockAttributionReport: AttributionReport = {
  id: 'attr-rpt-2026-07-30',
  periodLabel: '2026-07-23 ~ 2026-07-30',
  generatedAt: '2026-07-30 09:00',
  periodDays: 7,
  nextAnalysisAt: '2026-08-06 09:00',
  siteId: 'site-1',
  changes: [change1, change2, change3, change5, change6, change7, change8],
}

/** 历史报告（上期，部分条目已复盘，演示闭环） */
export const mockAttributionHistoryReports: AttributionReport[] = [
  {
    id: 'attr-rpt-2026-07-23',
    periodLabel: '2026-07-16 ~ 2026-07-23',
    generatedAt: '2026-07-23 09:00',
    periodDays: 7,
    nextAnalysisAt: '2026-07-30 09:00',
    siteId: 'site-1',
    changes: [
      {
        ...change1,
        id: 'chg-h1',
        measures: [
          {
            ...change1.measures![0],
            measureId: 'm-h1-1',
            execStatus: 'success',
          },
        ],
        reviewResult: 'success',
        reviewNote: 'T+7 复盘：广告渠道跳出率 52%→44%（回归正常区间），同期其他渠道无变化，归因明确。沉淀为标准措施。',
      },
      {
        ...change7,
        id: 'chg-h7',
      },
    ],
  },
]

/* ── 智能体任务中心 · 归因任务 ────────────────────────────────── */

export const mockAttributionTasks: AgentTaskRow[] = [
  {
    id: 'atask-1',
    module: 'attribution',
    title: '业务指标归因报告 · 7 条变化',
    summary: '异常 5 · 提升 1 · 持平 1',
    status: 'pending',
    priority: 'P0',
    createdAt: '2026-07-30 09:00',
    updatedAt: '2026-07-30 09:00',
    attributionReportId: 'attr-rpt-2026-07-30',
  },
  {
    id: 'atask-h1',
    module: 'attribution',
    title: '业务指标归因报告 · 2 条变化',
    summary: '异常 1 · 提升 1',
    status: 'done',
    priority: null,
    createdAt: '2026-07-23 09:00',
    updatedAt: '2026-07-30 09:00',
    attributionReportId: 'attr-rpt-2026-07-23',
  },
]

/** 归因分析周期默认配置 */
export const DEFAULT_ATTRIBUTION_CONFIG = {
  enabled: true,
  periodDays: 7,
}
