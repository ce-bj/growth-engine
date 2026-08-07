/**
 * 业务指标归因分析 Mock（线 B）— 对齐方法论 §8.5 任务说明写全示例
 * 本期：D+站外并列 / 健康度 / B 改详情 / C 生成详情
 * 历史：P4 提升 · P3 持平+F 发布计划 · P2 A 改文案 · P1 E 单篇+站外预算
 * 数字与任务说明条目以 §8.5 原文为准，不自造复盘百分点。
 */
import type {
  AttributionChange,
  AttributionReport,
  AgentTaskRow,
} from '../types'

/* ── 变化条目（对齐 §8.5） ─────────────────────────────────────── */

/** 案例 D + 站外 · 广告落地页对不上（异常 · 内容交接 + 仅展示并列）— 本期 */
const change1: AttributionChange = {
  id: 'chg-1',
  changeType: 'down',
  changedMetric: '留资率',
  changedValue: '3.2%',
  baselineValue: '3.7%',
  changeAmount: '比上期下降 0.5%',
  severity: 'P0',
  funnelSegment: 'landing_page',
  rootCause: '广告写的是「48 小时打样 + ISO」，落地页首屏却在讲工厂设备和产线，人对不上号，跳出很高',
  causeCategory: '内容不匹配搜索意图',
  confidence: 'high',
  evidence: [
    '付费广告落到 /campaign/cnc-oem-q3，跳出大约 61%，平均只待 22 秒',
    '同样创意以前投到旧通用页时，跳出大约 45%',
    '广告主打 48 小时打样，现页首屏几乎不提打样，只堆设备清单',
  ],
  analysisSteps: [
    '体检：本周留资率 3.2%，较过去 4 周同期平均 3.7% 跌 0.5pp，命中异常规则，定级 P0；UV 未跌。',
    '定位：UV 没跌 + 付费来路跳出偏高，不是流量问题，定位到 ②落地页段。',
    '下钻：付费广告进来的人多落在 /campaign/cnc-oem-q3；该页跳出约 61%、停留约 22 秒。',
    '验证：假设「广告承诺与落地页对不上」→ 广告主打 48 小时打样 + ISO，首屏却堆设备清单 ✓；对照旧通用页跳出约 45% ✓。',
    '结论：落地页与广告创意不匹配（高置信度）。一条根因交两条任务：重做营销落地页 + 投放侧站外建议。',
  ],
  measures: [
    {
      measureId: 'm-1-1',
      description: '按广告承诺重做 /campaign/cnc-oem-q3 留资获客页',
      taskType: 'create_landing_page',
      targetObject: '/campaign/cnc-oem-q3（新页做好后，建议把广告指向切过去）',
      taskBrief: [
        '页面类型：留资获客页',
        '公司名称：Example Precision Co., Ltd.',
        '所属行业：精密机加工 / CNC 代工',
        '主营产品/服务：小批量 CNC 机加工和快速打样',
        '核心卖点：资质认证 ISO9001（按订单可提供材质报告）；生产能力 3–5 轴、小批量和打样同一条线；交付能力 48 小时打样（跟广告一致，别写弱了也别加码）；服务支持工程师看图、英文对接',
        '目标买家：主要欧美代工厂采购、设备厂采购；其次要小批量、要快打样的工程师型买家；不主打纯倒货贸易商',
        '联系方式：sales@example.com；WhatsApp +86-xxx',
        '官网地址：https://www.example.com',
        '目标市场：美国 / 欧洲；语言：英语',
        '跟广告怎么对齐：首屏必须出现「48 小时打样」和「ISO9001」；广告没说过的「免模 / 零起订」别写',
        '落地怎么切：新页生成后，建议把广告地址切到新页；旧地址下线还是跳转，投放和运营一起定',
      ],
      rootCause: '广告写的是「48 小时打样 + ISO」，落地页首屏却对不上',
      rootCauseConfidence: 'high',
      evidenceCard: {
        currentValue: '这个活动页付费流量跳出大约 61%，平均只待 22 秒；同样创意以前投到旧通用页时，跳出大约 45%',
        benchmark: '广告主打 48 小时打样，现页首屏几乎不提打样，只堆设备清单',
        action: '按留资页重做一版，先跟广告说的对齐，再切落地',
      },
      suggestedBoundary: 'confirm',
      reviewPeriod: 'T+7',
      demoPublishEnabled: true,
      deliverable: {
        kind: 'rewrite',
        title: 'CNC OEM Q3 · 留资获客页（重做预览）',
        url: '/preview/campaign/cnc-oem-q3-v2',
        previewNote: '首屏对齐「48 小时打样 + ISO9001」；卖点、买家与联系方式按任务说明写全。',
      },
      execStatus: 'pending_confirm',
    },
    {
      measureId: 'm-1-2',
      description: '投放侧对齐创意或切换落地地址',
      taskType: 'external_advice',
      targetObject: '该活动对应的广告创意与落地地址',
      taskBrief: [
        '建议谁处理：投放侧',
        '建议做什么：把广告文案和落地页说的对齐；或把落地地址切到重做后的新页',
        '和站内任务的关系：可与「重做营销落地页」那条一起看，客户可两边都做或只做一边',
      ],
      rootCause: '广告写的是「48 小时打样 + ISO」，落地页首屏却对不上',
      rootCauseConfidence: 'high',
      evidenceCard: {
        currentValue: '广告落到该页跳出明显高于其他来路',
        benchmark: '见同根因下的营销页重做任务',
        action: '投放侧改创意或换落地地址（站内内容能力改不了投放后台）',
      },
      suggestedBoundary: 'advice_only',
      execStatus: 'advice_only',
    },
  ],
  reviewScript: {
    result: 'success',
    note: 'T+7 复盘：新页上线且广告切流后，付费来路跳出回落、停留拉长；同创意对照改善。沉淀为标准任务说明可复用。',
  },
}

/** 健康度修复 · 死链仍有访问（异常 · 可直接修复）— 本期 */
const change2: AttributionChange = {
  id: 'chg-2',
  changeType: 'down',
  changedMetric: '整站跳出',
  changedValue: '偏高',
  baselineValue: '站点正常水平',
  changeAmount: '死链拖累跳出',
  severity: 'P2',
  funnelSegment: 'landing_page',
  rootCause: '人点进来是空白页，几乎立刻走，把整站跳出拉高了',
  causeCategory: '加载慢/技术问题',
  confidence: 'high',
  evidence: [
    '一批老地址已经打不开，但外面链接和旧广告还在往里送人',
    '进到打不开页面的会话，跳出接近 90%',
    '以前修过的那批死链，跳出后来能回到站点正常水平附近',
  ],
  analysisSteps: [
    '体检：整站跳出升高；健康度问题列表出现仍有访问的死链，定级 P2。',
    '定位：技术伤干扰承接，不当作独立漏斗段，挂到落地页/跳出问题上。',
    '下钻：近 7 天还有人点进来、但已经打不开的地址（名单随任务附上）。',
    '验证：假设「死链拉高跳出」→ 打不开页跳出接近 90% ✓；对照历史修复后能回正常水平 ✓。',
    '结论：页面打不开 / 死链（高置信度 · 技术止血类，可直接修复）。',
  ],
  measures: [
    {
      measureId: 'm-2-1',
      description: '处理仍有访问却打不开的地址名单',
      taskType: 'health_fix',
      targetObject: '仍有人访问、但已经打不开的地址列表（示例：https://www.example.com/product/old-cnc-jig-2019）',
      taskBrief: [
        '问题类型：页面打不开 / 死链',
        '影响范围：近 7 天还有人点进来、但已经打不开的地址共 N 条（名单随任务附上）',
        '建议动作：能恢复的恢复；恢复不了的，跳转到最接近的在线详情或类目页；修完再查一遍',
      ],
      rootCause: '人点进来是空白页，几乎立刻走，把整站跳出拉高了',
      rootCauseConfidence: 'high',
      evidenceCard: {
        currentValue: '进到打不开页面的会话，跳出接近 90%，明显拖累整站',
        benchmark: '以前修过的那批死链，跳出后来能回到站点正常水平附近',
        action: '按名单把还能进得来、却打不开的地址先处理掉，再复查',
      },
      suggestedBoundary: 'auto',
      reviewPeriod: 'T+3',
      deliverable: {
        kind: 'log',
        title: '死链修复执行日志',
        url: '/logs/deadlink-fix-2026-07-30',
        previewNote: '已按名单处理：可恢复的已恢复；不可恢复的已跳转到最接近的在线详情或类目页，并复查通过。',
      },
      execStatus: 'executing',
    },
  ],
  reviewScript: {
    result: 'success',
    note: 'T+3 复盘：名单内死链已处理，打不开页会话减少，整站跳出回落至正常水平附近。沉淀为标准健康度修复任务说明。',
  },
}

/** 站外 · 广告预算（异常 · 仅展示）— P1 */
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
    '体检：广告渠道 UV 494→296，环比跌 40%，命中异常规则，定级 P1；留资数同步下跌，留资率未变。',
    '定位：UV 跌 + 留资数跌，定位到 ①渠道到达段。',
    '下钻：仅广告渠道骤降，社交/SEO/直接访问均正常。',
    '验证：站内无变更记录 ✓；留资率未变 ✓；投放账户站内不可查，标注疑似外部因素。',
    '结论：广告投放预算削减（中置信度 · 站外建议）。',
  ],
  measures: [
    {
      measureId: 'm-3-1',
      description: '检查广告投放账户预算设置',
      taskType: 'external_advice',
      targetObject: '广告投放账户预算与计划',
      taskBrief: [
        '建议谁处理：投放侧',
        '建议做什么：检查广告投放账户预算设置，必要时恢复至原预算水平',
        '和站内任务的关系：本条为站外事项，站内内容能力改不了投放后台',
      ],
      rootCause: '广告投放预算削减',
      rootCauseConfidence: 'medium',
      evidenceCard: {
        currentValue: '广告渠道 UV 494→296（-40%）',
        benchmark: '其他渠道 UV 正常',
        action: '建议恢复/调整广告预算',
      },
      suggestedBoundary: 'advice_only',
      execStatus: 'advice_only',
    },
  ],
}

/** 案例 E · 生成并发布单篇内容（异常 · 已交接已复盘失败沉淀旁路：历史 SEO 改为 E）— P1 */
const change4: AttributionChange = {
  id: 'chg-4',
  changeType: 'down',
  changedMetric: '自然搜索询盘',
  changedValue: '偏弱',
  baselineValue: '有专文时更好',
  changeAmount: '相关词询盘变差',
  severity: 'P1',
  funnelSegment: 'channel_arrival',
  rootCause: '这类人想先搞懂公差怎么标，站里却没有专门讲这个的文章，只能甩到产品列表，看两眼就走',
  causeCategory: '内容不匹配搜索意图 · 内容缺口',
  confidence: 'medium',
  evidence: [
    '搜 “CNC machining tolerance” 相关词的人有点击，但比站里别的内容差',
    '现在多半落到产品列表，待的时间短',
    '以前给“怎么选型/怎么下单”写过专文的词，人更能点进内容页',
  ],
  analysisSteps: [
    '体检：自然搜索询盘相关信号走弱，定级 P1。',
    '定位：渠道到达段——公差相关词有人搜，但站内无专文承接。',
    '下钻：相关词多落到产品列表，停留短。',
    '验证：假设「缺专文」→ 对照有专文的词表现更好 ✓；本周先补一篇，不挂周更计划。',
    '结论：内容缺口（中高置信度）→ 生成并发布单篇内容。',
  ],
  measures: [
    {
      measureId: 'm-4-1',
      description: '写 1 篇讲清 CNC machining tolerance 的文章并发布',
      taskType: 'publish_single_content',
      targetObject: '写 1 篇讲清 “CNC machining tolerance” 的文章并发布',
      taskBrief: [
        '主题：CNC 机加工公差怎么标，代工零件采购要注意什么',
        '关键词：CNC machining tolerance, GD&T CNC, precision machining tolerance, OEM CNC specs',
        '写作角度：写给海外采购和工程师看——怎么标公差、常见范围、跟成本有什么关系；别写成公司软文',
        '语气：说人话、能核对；具体数字用行业常见说法，别伪造本厂能力',
        '语言：英语',
        '篇幅：中等就行（把概念讲清 + 3～5 条实操建议 + 几个短问答）',
        '配图要求：要 1 张示意图，封面和文里都能用',
        '是否挂持续发布计划：先不要。这周只要这一篇；以后要每周持续写，另开「建立持续内容发布计划」',
      ],
      rootCause: '站里没有专门讲公差怎么标的文章',
      rootCauseConfidence: 'medium',
      evidenceCard: {
        currentValue: '这些词有人搜，但点击比站里别的内容差；现在多半落到产品列表，待的时间短',
        benchmark: '以前给“怎么选型/怎么下单”这类问题写过专文的词，人更能点进内容页，后面也更容易去看详情',
        action: '先发这一篇把问题讲清楚，文里可以自然链到现有精密件详情',
      },
      suggestedBoundary: 'confirm',
      reviewPeriod: 'T+14',
      deliverable: {
        kind: 'page',
        title: 'CNC Machining Tolerance · 文章（已发布）',
        url: '/blog/cnc-machining-tolerance',
        previewNote: '已按任务说明发布英文专文；文内链到现有精密件详情。',
      },
      execStatus: 'success',
      contentPublished: true,
      contentPublishedAt: '2026-06-25',
    },
  ],
  reviewResult: 'partial',
  reviewNote:
    'T+14 复盘：专文已上线，相关词点击与内容页停留有改善，但询盘尚未明显回升。沉淀为「调整后使用」——可另开发布计划围词持续产出。',
}

/** 案例 A · 修改已有页面文案（异常 · 已复盘部分改善）— P2 */
const change5: AttributionChange = {
  id: 'chg-5',
  changeType: 'down',
  changedMetric: '留资率',
  changedValue: '2.7%',
  baselineValue: '3.2%',
  changeAmount: '比上期下降 0.5%',
  severity: 'P0',
  funnelSegment: 'landing_page',
  rootCause:
    '大家搜的是 “small batch CNC China”，这篇文章却没怎么讲小批量、中国工厂怎么接这类单，人进来看两眼就走',
  causeCategory: '内容不匹配搜索意图',
  confidence: 'high',
  evidence: [
    '自然搜索进来的人，多落在 /blog/cnc-machining-guide',
    '从 “small batch CNC China” 进来的人，跳出大约 58%，平均只待 32 秒',
    '站里别的教程页跳出大约 41%，能待 70 秒左右；这个词有人点，但这页几乎带不出询盘',
  ],
  analysisSteps: [
    '体检：留资率 2.7%，环比跌 0.5pp，定级 P0。',
    '定位：自然搜索进来的人多落在 /blog/cnc-machining-guide，定位到落地页段。',
    '下钻：该词跳出约 58%、停留约 32 秒；对照其他教程页约 41% / 70 秒。',
    '验证：假设「正文没讲小批量/中国工厂接单」→ 标题摘要可不动，只改正文 ✓。',
    '结论：文章与搜索词不对齐（高置信度）→ 修改已有页面文案。',
  ],
  measures: [
    {
      measureId: 'm-5-1',
      description: '按 “small batch CNC China” 改写教程正文',
      taskType: 'edit_page_copy',
      targetObject: 'https://www.example.com/blog/cnc-machining-guide',
      taskBrief: [
        '页面地址：https://www.example.com/blog/cnc-machining-guide',
        '修改要求：1）开头三段改清楚：小批量能不能接、起订大概怎么谈、交期怎么说；2）中间补一块「什么采购场景适合找我们」和「跟大批量代工有什么不一样」；3）文末加 2 条常见问题：起订量、样件要多久；4）标题和摘要不动，只改正文',
        '明确不做：不改版式，不改导航，不挪按钮位置',
      ],
      rootCause: '文章没怎么讲小批量、中国工厂怎么接这类单',
      rootCauseConfidence: 'high',
      evidenceCard: {
        currentValue: '从 “small batch CNC China” 进来的人，跳出大约 58%，平均只待 32 秒',
        benchmark: '站里别的教程页跳出大约 41%，能待 70 秒左右；这个词有人点，但这页几乎带不出询盘',
        action: '先把这篇文章按搜索词改明白；改完还不行，再另写一篇或做发布计划',
      },
      suggestedBoundary: 'confirm',
      reviewPeriod: 'T+7',
      deliverable: {
        kind: 'rewrite',
        title: 'CNC Machining Guide · 正文改写版',
        url: '/preview/blog/cnc-machining-guide-v2',
        previewNote: '已按任务说明只改正文：开头讲清小批量与交期，中间补场景对比，文末加 FAQ。',
      },
      execStatus: 'success',
      contentPublished: true,
      contentPublishedAt: '2026-07-10',
    },
  ],
  reviewResult: 'partial',
  reviewNote:
    'T+7 复盘：该词来路停留与跳出有改善，留资有回升但未完全回到上期水平。沉淀为「调整后使用」；若仍不够，可另开单篇或发布计划。',
}

/** 案例 B · 修改已有产品详情（异常 · 确认后交接）— 本期 */
const change6: AttributionChange = {
  id: 'chg-6',
  changeType: 'down',
  changedMetric: '留资率',
  changedValue: '详情页偏弱',
  baselineValue: '同类完整详情更好',
  changeAmount: '详情留资偏低',
  severity: 'P2',
  funnelSegment: 'site_browsing',
  rootCause: '人愿意点进这个详情，但页上规格、交期、起订都写得含糊，看完还是不敢留资',
  causeCategory: '内容不吸引/没找到信息',
  confidence: 'high',
  evidence: [
    '产品详情 /product/aluminum-cnc-enclosure-x200 访问量不差，但留资比同类完整详情差一截',
    '页上几乎看不到规格表和交期',
    '写得全的同类详情，留资大约是它的 2～3 倍',
  ],
  analysisSteps: [
    '体检：留资相关信号走弱，定位到站内浏览段的产品详情。',
    '定位：人愿意点进 /product/aluminum-cnc-enclosure-x200，但留资偏低。',
    '下钻：页上规格、交期、起订含糊；几乎看不到规格表。',
    '验证：对照写得全的同类详情留资约 2～3 倍 ✓ → 在原文上扩写，不另开新产品。',
    '结论：详情信息不全（高置信度）→ 修改已有产品详情。',
  ],
  measures: [
    {
      measureId: 'm-6-1',
      description: '按行业写法扩写铝壳产品详情',
      taskType: 'edit_product_detail',
      targetObject: 'https://www.example.com/product/aluminum-cnc-enclosure-x200',
      taskBrief: [
        '产品详情地址：https://www.example.com/product/aluminum-cnc-enclosure-x200',
        '修改方式：在原文基础上按行业写法扩写（不是另开一个新产品）',
        '修改要求：1）标题别改；2）把概述、规格表、应用场景、工艺和表面处理、能不能定制、包装物流、售后、常见问题写全；3）对着客户常搜的 “custom aluminum enclosure OEM” 来写，别空喊“实力强”；4）常见问题至少讲清：开孔能不能改、起订多少、打样多久、表面处理有哪些',
        '能核实的事实（没有的标「待客户确认」，别编）：材质 6061 铝合金；壁厚 1.5–3.0mm（待确认）；起订量 50（待确认）；打样 7 天、批量 15–20 天（待确认）；认证 ISO9001（如果别的页面已经写过，可以沿用）',
        '配图要求：原文里的图都留下；这次不换封面，除非原来就没有封面',
      ],
      rootCause: '规格、交期、起订都写得含糊，看完还是不敢留资',
      rootCauseConfidence: 'high',
      evidenceCard: {
        currentValue: '这个详情访问量不差，但留资比同类完整详情差一截；页上几乎看不到规格表和交期',
        benchmark: '写得全的同类详情，留资大约是它的 2～3 倍；说明人不是不看，是看完心里没底',
        action: '在这个产品上改全再上线，不要再新建一条同款产品',
      },
      suggestedBoundary: 'confirm',
      reviewPeriod: 'T+7',
      deliverable: {
        kind: 'rewrite',
        title: 'Aluminum CNC Enclosure X200 · 详情扩写预览',
        url: '/preview/product/aluminum-cnc-enclosure-x200-v2',
        previewNote: '已按任务说明扩写规格表、交期/起订、定制与 FAQ；缺资料处标「待客户确认」。',
      },
      execStatus: 'pending_confirm',
    },
  ],
  reviewScript: {
    result: 'success',
    note: 'T+7 复盘：该详情留资相对同类差距收窄，规格与交期可读性提升。沉淀为标准「修改已有产品详情」任务说明。',
  },
}

/** 提升 · SEO 内容见效 — P4 */
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
    'SEO 落地页平均停留时长从 38s 升至 52s',
    '采纳上期持平建议后恢复内容周更，近 2 周持续产出新内容',
  ],
  analysisSteps: [
    '体检：本周留资率 3.7%，环比提升 0.5pp，命中提升规则。',
    '定位：UV 涨 + 跳出率降，定位到落地页段提升。',
    '下钻：SEO 渠道跳出 48%→41%，其他渠道无明显变化。',
    '验证：停留 38s→52s ✓、近 2 周恢复周更 ✓。',
    '结论：SEO 内容优化见效（高置信度）。',
  ],
  praiseText:
    '本周留资率提升 0.5pp，主要因 SEO 内容优化见效——落地页更匹配搜索意图，SEO 渠道跳出率从 48% 降到 41%。上期持平期的内容更新建议被采纳，效果已经显现。',
  keepAdvice: '继续强化 SEO 内容产出，保持周更频率，重点维护带来转化的 TOP5 落地页。',
}

/** 持平 + 案例 F 发布计划建议 — P3 */
const change8: AttributionChange = {
  id: 'chg-8',
  changeType: 'flat',
  changedMetric: '留资率',
  changedValue: '3.2%',
  baselineValue: '3.2%',
  changeAmount: '与上期持平',
  severity: null,
  funnelSegment: 'channel_arrival',
  rootCause: '最近几乎没怎么发新内容，老文章也不更新，aluminum CNC 等词慢慢掉下来了',
  causeCategory: '内容无更新',
  confidence: 'high',
  evidence: [
    '留资率连续 2 期维持 3.2%±0.1pp',
    'aluminum CNC、custom CNC parts、CNC China 这几组词近 14 天点击和进站都在掉',
    '近 30 天几乎没发过新内容',
  ],
  analysisSteps: [
    '体检：留资率连续 2 期持平，命中持平规则。',
    '定位：渠道到达段——几组词整体变少，不是单页崩了。',
    '下钻：近 30 天几乎无新内容；上季度还能周更时这组词更稳。',
    '验证：假设「内容停更」→ 词掉 + 无更新 ✓。',
    '结论：内容无更新（高置信度）→ 预填「建立持续内容发布计划」（仅建议，不进交接）。',
  ],
  explainText:
    '留资率连续 2 期持平，主要因最近几乎没怎么发新内容，aluminum CNC 等词慢慢掉下来。当前转化结构尚稳，但增长缺乏引擎。',
  improveSuggestions: [
    {
      suggestion: '围着掉下来的词，按固定节奏发资讯',
      taskType: 'publish_plan',
      targetObject: '围着 aluminum CNC、custom CNC parts、CNC China 等词，按固定节奏发资讯',
      taskBrief: [
        '主题：给海外代工采购看的铝合金 / 定制 CNC 内容',
        '关键词（8 个）：aluminum CNC；custom CNC parts；CNC machining China；small batch CNC；precision CNC parts；CNC prototyping；OEM machining；CNC enclosure machining',
        '发布频率：每 7 天发 1 篇',
        '建议发布到：英文主站',
        '怎么写：可以轮着写工艺说明、采购注意点、应用场景；别篇篇硬广',
        '跟单篇任务的关系：这个任务管长期按周发；某个词要马上补一篇，另开「生成并发布单篇内容」',
      ],
    },
  ],
}

/** 案例 C · 生成产品详情页（异常 · 确认后交接）— 本期 */
const change9: AttributionChange = {
  id: 'chg-9',
  changeType: 'down',
  changedMetric: '询盘量',
  changedValue: '相关词偏弱',
  baselineValue: '有详情时更好',
  changeAmount: '缺详情承接',
  severity: 'P1',
  funnelSegment: 'landing_page',
  rootCause: '有人搜这个词进来，站里没有对应的产品详情，多半落到首页或列表后就走了',
  causeCategory: '内容不匹配搜索意图 · 内容缺口',
  confidence: 'high',
  intentData: {
    inboundKeyword: '搜索词 “precision CNC shaft” 近 7 天持续有人搜进来',
    siteSearch: '点进去常见的是首页或列表，几乎进不了具体产品页',
  },
  evidence: [
    '近 7 天 “precision CNC shaft” 一直有人搜进来，点进去常见的是首页或列表',
    '旁边差不多的词，只要已经有详情页，人就能点进去，询盘也明显好一些',
  ],
  analysisSteps: [
    '体检：询盘量相关信号走弱，定级 P1。',
    '定位：渠道到达 + 落地页——词有量，缺产品详情承接。',
    '下钻：该词多落到首页/列表；对照有详情的近义词询盘更好。',
    '验证：假设「缺产品详情」→ 补一条能上线的详情，再看是否还总落到首页/列表。',
    '结论：内容缺口（高置信度）→ 生成产品详情页。',
  ],
  measures: [
    {
      measureId: 'm-9-1',
      description: '给 “precision CNC shaft” 补一条产品详情',
      taskType: 'create_product_detail',
      targetObject: '给 “precision CNC shaft” 补一条产品详情',
      taskBrief: [
        '产品核心词：precision CNC shaft',
        '产品描述：精密 CNC 轴类零件，用在电机、自动化设备传动上；可按图纸定制，支持热处理和表面处理。',
        '语言：英语',
        '怎么生成：先用文字描述生成（暂时没有主图，生成时再配图）',
        '必须写到的内容：概述、规格参数、公差与材质、应用场景、定制流程、包装物流、售后、常见问题',
        '缺资料怎么处理：规格、起订量、交期客户没给的，写成「待填写」，不要瞎编数字',
        '配图要求：要；封面和应用场景都考虑配图',
        '发布建议：建议发到英文主站产品库，类目偏向轴类 / 机加工件（最终选站、选分类由运营确认）',
      ],
      rootCause: '站里没有对应的产品详情，多半落到首页或列表后就走了',
      rootCauseConfidence: 'high',
      evidenceCard: {
        currentValue: '近 7 天这个词一直有人搜进来，点进去常见的是首页或列表，几乎进不了具体产品页',
        benchmark: '旁边差不多的词，只要已经有详情页，人就能点进去，询盘也明显好一些',
        action: '先给这个词补一条能上线的产品详情，上线后再看这个词是不是还总落到首页/列表',
      },
      suggestedBoundary: 'confirm',
      reviewPeriod: 'T+14',
      deliverable: {
        kind: 'page',
        title: 'Precision CNC Shaft · 产品详情（预览）',
        url: '/preview/product/precision-cnc-shaft',
        previewNote: '按任务说明生成英文详情；缺规格处标「待填写」；建议配封面与应用场景图。',
      },
      execStatus: 'pending_confirm',
    },
  ],
  reviewScript: {
    result: 'success',
    note: 'T+14 复盘：详情上线后，该词更多落到产品页而非首页/列表，询盘有改善。沉淀为标准「生成产品详情页」任务说明。',
  },
}

/* ── 归因报告（本期 1 期 + 历史 4 期） ───────────────────────────── */

/** 本期：D+站外 / C 生成详情 / 健康度 / B 改详情 */
export const mockAttributionReport: AttributionReport = {
  id: 'attr-rpt-2026-07-30',
  periodLabel: '2026-07-23 ~ 2026-07-30',
  generatedAt: '2026-07-30 09:00',
  periodDays: 7,
  nextAnalysisAt: '2026-08-06 09:00',
  siteId: 'site-1',
  changes: [change1, change9, change2, change6],
}

/** 历史 4 期（新 → 旧） */
export const mockAttributionHistoryReports: AttributionReport[] = [
  {
    id: 'attr-rpt-2026-07-23',
    periodLabel: '2026-07-16 ~ 2026-07-23',
    generatedAt: '2026-07-23 09:00',
    periodDays: 7,
    nextAnalysisAt: '2026-07-30 09:00',
    siteId: 'site-1',
    changes: [change7],
  },
  {
    id: 'attr-rpt-2026-07-16',
    periodLabel: '2026-07-09 ~ 2026-07-16',
    generatedAt: '2026-07-16 09:00',
    periodDays: 7,
    nextAnalysisAt: '2026-07-23 09:00',
    siteId: 'site-1',
    changes: [change8],
  },
  {
    id: 'attr-rpt-2026-07-09',
    periodLabel: '2026-07-02 ~ 2026-07-09',
    generatedAt: '2026-07-09 09:00',
    periodDays: 7,
    nextAnalysisAt: '2026-07-16 09:00',
    siteId: 'site-1',
    changes: [change5],
  },
  {
    id: 'attr-rpt-2026-06-23',
    periodLabel: '2026-06-16 ~ 2026-06-23',
    generatedAt: '2026-06-23 09:00',
    periodDays: 7,
    nextAnalysisAt: '2026-06-30 09:00',
    siteId: 'site-1',
    changes: [change3, change4],
  },
]

export const mockAttributionTasks: AgentTaskRow[] = [
  {
    id: 'atask-1',
    module: 'attribution',
    title: '业务指标归因报告 · 4 条变化',
    summary: '异常 4 · 含内容待确认与健康度自动修',
    status: 'pending',
    priority: 'P0',
    createdAt: '2026-07-30 09:00',
    updatedAt: '2026-07-30 09:00',
    attributionReportId: 'attr-rpt-2026-07-30',
  },
  {
    id: 'atask-health-1',
    module: 'health_fix',
    title: '处理仍有访问却打不开的地址名单',
    summary: '接口自动修复中 · 死链',
    status: 'running',
    priority: 'P2',
    createdAt: '2026-07-30 09:00',
    updatedAt: '2026-07-30 09:01',
    attributionReportId: 'attr-rpt-2026-07-30',
    changeId: 'chg-2',
    measureId: 'm-2-1',
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
    summary: '持平 1 · 已出发布计划建议',
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
    summary: '异常 1 · 改文案复盘部分改善',
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
    summary: '异常 2 · 站外预算 + 单篇内容已复盘',
    status: 'done',
    priority: 'P1',
    createdAt: '2026-06-23 09:00',
    updatedAt: '2026-07-24 09:00',
    attributionReportId: 'attr-rpt-2026-06-23',
  },
]

export const DEFAULT_ATTRIBUTION_CONFIG = {
  enabled: true,
  periodDays: 7,
}
