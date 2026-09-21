import type {
  ContentAsset,
  ContentCalendarItem,
  ContentLocale,
  ContentOpportunity,
  ContentPlanItem,
  ContentPublishStat,
  ContentTask,
  ContentThemePerformance,
  ContentWeeklyPerformance,
  GlossaryTerm,
  KnowledgeRiskEvent,
  MaterialBudgetItem,
  PublicationRecord,
} from '../types'

export const contentTasksData: ContentTask[] = [
  {
    id: 'ct-001',
    title: '工业机器人选型指南 2026',
    kind: 'optimize',
    type: 'guide',
    status: 'compliance_review',
    priority: 'P1',
    theme: '工业机器人选型',
    contentSubject: '工业机器人选型',
    knowledgeScopes: ['product', 'case', 'industry'],
    audience: '制造企业自动化负责人',
    userQuestion: '负载、工作半径和精度要求不同，应该如何选择机器人？',
    businessGoal: 'decision',
    successMetric: '滚动深度 ≥ 55%，选型咨询 CTA 点击率 ≥ 3%',
    journeyStage: 'compare',
    coreMessage: '工业机器人选型必须基于工况、末端负载、工作半径、节拍与环境条件综合校核，不能只比较额定负载。',
    desiredAction: '下载选型检查清单，或提交工况参数咨询选型',
    mustInclude: '六项参数、适用边界、参数来源、真实案例的授权状态',
    mustAvoid: '固定效率提升承诺、行业第一等绝对化表达',
    owner: '内容运营组 · 李静',
    channels: ['website', 'linkedin', 'facebook', 'x'],
    locales: ['en', 'de'],
    missingTerms: ['重复定位精度', '节拍时间'],
    origin: { source: 'opportunity', sourceLabel: '内容洞察 · 阅读表现', evidence: { currentValue: '现有指南访问量高', benchmark: '信息深度不足', action: '重构参数对比章节，补齐深度' } },
    dueDate: '2026-08-02',
    reason: '现有指南访问量高，但信息深度不足，访客在参数对比章节前大量离开。',
    outline: ['选型前先明确工艺目标', '六个关键参数逐项拆解', '不同场景的选型建议', '常见选型错误与代价', '真实应用案例：汽车零部件焊接线', '选型 FAQ 与检查清单'],
    masterDraft: '选型前先明确工艺目标\n\n选择工业机器人不能只比较额定负载。负载、工作半径、重复定位精度、节拍、防护等级与末端工具需要作为一组条件综合判断。开始比较型号之前，先把工艺目标写清楚：搬运什么、从哪到哪、多快一次、环境如何、由谁维护。\n\n六个关键参数逐项拆解\n\n① 额定负载：需包含末端执行器自重与最不利姿态下的力矩；② 工作半径：以最远作业点为准并预留 10% 余量；③ 重复定位精度：与工艺公差匹配即可，过度追求会显著抬高成本；④ 节拍时间：按整线产能倒推单机节拍；⑤ 防护等级：粉尘、水汽、油雾环境对应不同 IP 要求；⑥ 末端执行器：夹爪、焊枪、喷头的重量与接口决定可选机型范围。\n\n不同场景的选型建议\n\n对于汽车零部件焊接场景，稳定节拍和工装适配往往比单一速度指标更重要。码垛场景优先看工作半径与负载曲线；喷涂场景优先看防爆与防护等级；装配场景优先看重复定位精度与柔顺控制能力。\n\n常见选型错误与代价\n\n最常见的三个错误：只按额定负载选型而忽略力矩、忽略末端工具自重、用样本节拍直接当作产线节拍。这些错误通常在调试阶段才暴露，返工成本远高于选型阶段多花的时间。\n\n真实应用案例：汽车零部件焊接线\n\n某汽车零部件工厂的焊接工作站改造中，先明确了工件重量、作业半径、环境粉尘与连续运行时长，再进入型号对比，最终方案在验证阶段一次通过。（案例结果数据待客户授权后补充）\n\n选型 FAQ 与检查清单\n\nQ：精度越高越好吗？不是，与工艺公差匹配即可。Q：需要预留多少余量？负载与半径建议各预留 10%-15%。完整检查清单见文末附件。',
    knowledge: [
      { id: 'kr-1', category: '产品参数', title: 'IR-20 / IR-50 产品规格表', source: '企业产品中心', verified: true },
      { id: 'kr-2', category: '应用案例', title: '汽车零部件焊接线项目摘要', source: '案例库 CASE-024', verified: true },
      { id: 'kr-3', category: '行业知识', title: '机器人负载与工作半径选型规则', source: '行业知识库', verified: true },
      { id: 'kr-8', category: '合规资料', title: 'IP 防护等级对照与适用环境说明', source: '合规中心 REG-011', verified: true },
      { id: 'kr-9', category: '技术文档', title: '末端执行器接口与自重对照表', source: 'PIM', verified: true },
      { id: 'kr-10', category: '行业数据', title: '2026 年工业机器人节拍基准数据', source: '第三方行业报告', verified: false },
    ],
    missingMaterials: ['焊接案例的实施前后节拍对比数据（待客户授权）'],
    quality: { overall: 86, experience: 21, expertise: 22, authority: 22, trustworthiness: 21 },
    compliance: [
      { id: 'ci-1', level: 'high', category: 'fact', title: '效率提升 40% 缺少可公开来源', detail: '建议改为案例中已确认的节拍变化，或删除百分比。', resolved: false },
      { id: 'ci-2', level: 'medium', category: 'advertising', title: '“行业第一”属于绝对化表达', detail: 'LinkedIn 版本中存在无法证明的绝对化表述。', resolved: false },
      { id: 'ci-3', level: 'low', category: 'brand', title: '术语需统一', detail: '将“机械臂”统一为品牌规范中的“工业机器人”。', resolved: true },
      { id: 'ci-8', level: 'low', category: 'copyright', title: '第三方节拍基准数据需标注出处', detail: '引用行业报告数据时需注明报告名称与年份，已补充脚注。', resolved: true },
      { id: 'ci-9', level: 'medium', category: 'localization', title: '外语站需确认专业名词译名', detail: '“重复定位精度”“节拍时间”在英语与德语站尚未配置标准译名。', resolved: false },
    ],
    channelVersions: [
      { channel: 'website', title: '工业机器人选型指南 2026', body: '完整指南：从工艺目标、负载、工作半径、精度、节拍到环境条件，逐项说明选型方法，并附真实应用案例与检查清单。', account: 'www.example.com', status: 'ready' },
      { channel: 'linkedin', title: '机器人选型最容易忽略的，不是负载', body: '很多选型从额定负载开始，却忽略了工作半径、节拍和末端工具共同形成的真实负载。我们整理了 6 个判断维度，并结合汽车零部件焊接案例说明如何验证方案。', account: 'Example Automation', status: 'ready' },
      { channel: 'facebook', title: '工业机器人怎么选？先看这 6 项', body: '负载只是第一步。工作半径、精度、节拍、防护等级和工具重量同样重要。查看完整选型清单与应用示例。', account: 'Example Automation Global', status: 'ready' },
      { channel: 'x', title: '工业机器人选型 6 项检查', body: '选机器人别只看负载：①工艺目标 ②工作半径 ③重复精度 ④节拍 ⑤环境 ⑥末端工具。完整指南将结合真实项目逐项展开。', account: '@ExampleAuto', status: 'ready' },
    ],
    channelProfiles: [
      { channel: 'website', fields: { columnPath: '/guides/robot-selection', seoKeyword: '工业机器人选型', template: '长文指南模板' } },
      { channel: 'linkedin', fields: { account: 'Example Automation', language: '中文 + 英语', hashtags: '#IndustrialRobots #Automation' } },
      { channel: 'facebook', fields: { account: 'Example Automation Global', audienceRegion: '欧洲 / 北美', imageSpec: '1200x630 横版' } },
      { channel: 'x', fields: { account: '@ExampleAuto', threadMode: '单条 + 图文', hashtags: '#Robotics #Manufacturing' } },
    ],
  },
  {
    id: 'ct-002', title: '汽车零部件焊接应用案例', kind: 'create', type: 'case', status: 'needs_material', priority: 'P1', theme: '汽车焊接自动化', contentSubject: '汽车零部件焊接工作站', knowledgeScopes: ['case', 'product', 'industry'], audience: '汽车零部件工厂技术与生产负责人', userQuestion: '同类型工厂如何部署焊接工作站，实际改善了什么？', businessGoal: 'decision', successMetric: '案例页滚动深度 ≥ 55%，项目咨询 ≥ 5 条/月', journeyStage: 'evaluate', coreMessage: '焊接工作站的真实价值必须由项目约束、实施过程和授权后的前后数据共同证明。', desiredAction: '查看方案能力并提交项目工况', mustInclude: '客户授权、实施前后数据、适用边界', mustAvoid: '未授权客户名、Logo、现场图片和无法证明的提升比例', owner: '行业内容组 · 王晨', channels: ['website', 'linkedin'], dueDate: '2026-08-06', reason: '网站缺少可证明项目交付能力的真实案例。', origin: { source: 'manual', sourceLabel: '运营人员手动创建', evidence: { currentValue: '网站暂无客户案例', benchmark: '竞品平均 3+ 案例', action: '补一篇可证明交付能力的真实案例' } }, outline: ['客户背景', '原有问题', '方案设计', '实施过程', '结果数据', '适用企业'], masterDraft: '', knowledge: [{ id: 'kr-4', category: '项目资料', title: '焊接线交付记录', source: '项目中心 PJ-106', verified: true }], missingMaterials: ['客户公开授权', '实施前后节拍数据'], materialBudget: [
      { id: 'mb-1', templateKey: 'auth', name: '客户公开授权', status: 'pending_auth', note: '需法务 / 客户确认' },
      { id: 'mb-2', templateKey: 'before_after', name: '实施前后数据', status: 'missing', note: '需项目中心提供' },
      { id: 'mb-3', templateKey: 'quote', name: '客户证言', status: 'ready', source: '案例库' },
      { id: 'mb-4', templateKey: 'photo', name: '现场图片授权', status: 'pending_auth', note: '需确认可公开' },
    ], quality: { overall: 48, experience: 12, expertise: 12, authority: 12, trustworthiness: 12 }, compliance: [{ id: 'ci-4', level: 'blocking', category: 'privacy', title: '客户案例尚未获得公开授权', detail: '客户名称、Logo和现场图片均不可发布。', resolved: false }], channelVersions: [],
  },
  {
    id: 'ct-003', title: '工业机器人产品能力完整介绍', kind: 'create', type: 'product', status: 'generating', priority: 'P1', theme: '工业机器人产品', audience: '首次了解产品的技术与采购人员', userQuestion: '产品有哪些能力、适用场景和限制？', channels: ['website', 'linkedin', 'facebook'], locales: ['en'], missingTerms: ['末端执行器', '防护等级'], dueDate: '2026-08-04', reason: '当前产品页只有参数表，缺少应用说明、限制条件和型号差异。', outline: ['核心能力', '型号矩阵', '应用场景', '集成条件', '限制说明', '常见问题'], masterDraft: '正在基于已验证产品资料生成母稿…', knowledge: [{ id: 'kr-5', category: '产品参数', title: '工业机器人全系列规格', source: 'PIM', verified: true }], missingMaterials: [], quality: { overall: 72, experience: 18, expertise: 18, authority: 18, trustworthiness: 18 }, compliance: [], channelVersions: [],
  },
  {
    id: 'ct-004', title: '工业机器人常见问题', kind: 'create', type: 'faq', status: 'ready', priority: 'P2', theme: '工业机器人使用', audience: '正在评估部署条件的工程师', userQuestion: '部署、维护、环境和培训方面有哪些要求？', channels: ['website', 'x'], dueDate: '2026-08-08', reason: '客服与站内搜索中反复出现相同问题，现有页面没有集中回答。', outline: ['部署条件', '维护周期', '人员培训', '环境要求', '备件与服务'], masterDraft: '', knowledge: [], missingMaterials: [], quality: { overall: 0, experience: 0, expertise: 0, authority: 0, trustworthiness: 0 }, compliance: [], channelVersions: [],
  },
  {
    id: 'ct-005', title: '码垛机器人应用白皮书社媒拆解', kind: 'repurpose', type: 'insight', status: 'pending_approval', priority: 'P2', theme: '码垛自动化', audience: '食品与物流行业运营负责人', userQuestion: '码垛自动化有哪些典型收益和实施条件？', channels: ['linkedin', 'facebook', 'x'], dueDate: '2026-08-01', reason: '网站白皮书阅读表现良好，可拆解为连续社媒内容扩大触达。', outline: ['行业问题', '方案摘要', '三项实施条件', '案例数据'], masterDraft: '基于已发布白皮书整理的社媒母稿。', knowledge: [], missingMaterials: [], quality: { overall: 88, experience: 22, expertise: 22, authority: 22, trustworthiness: 22 }, compliance: [], channelVersions: [
      { channel: 'linkedin', title: '码垛自动化落地前，先确认这三件事', body: '稳定节拍、现场空间与来料一致性，是码垛项目能否稳定运行的三个前提。本文结合白皮书中的项目经验逐项说明。', account: 'Example Automation', status: 'ready' },
      { channel: 'facebook', title: '码垛自动化的 3 个实施前提', body: '准备引入码垛机器人？先确认节拍、空间和来料稳定性。完整白皮书已经整理好。', account: 'Example Automation Global', status: 'ready' },
      { channel: 'x', title: '码垛自动化实施清单', body: '码垛项目落地前确认：节拍稳定、现场空间、来料一致性。缺一项，后续调试成本都可能显著增加。', account: '@ExampleAuto', status: 'ready' },
    ],
    channelProfiles: [
      { channel: 'linkedin', fields: { account: 'Example Automation', language: '中文 + 英语', hashtags: '#Palletizing #Logistics' } },
      { channel: 'facebook', fields: { account: 'Example Automation Global', audienceRegion: '东南亚 / 中东', imageSpec: '1200x630 横版' } },
      { channel: 'x', fields: { account: '@ExampleAuto', threadMode: '单条 + 图文', hashtags: '#Automation' } },
    ],
  },
  {
    id: 'ct-006', title: '喷涂机器人安全说明更新', kind: 'compliance', type: 'product', status: 'scheduled', priority: 'P0', theme: '喷涂机器人安全', audience: '喷涂产线技术与安全负责人', userQuestion: '设备在易燃环境下有哪些安全前提？', channels: ['website'], dueDate: '2026-07-31', reason: '原页面引用的安全规范版本已更新，需要同步免责声明和适用条件。', outline: ['适用环境', '防护要求', '安装限制', '安全声明'], masterDraft: '已更新安全规范引用和设备适用边界。', knowledge: [], missingMaterials: [], quality: { overall: 91, experience: 23, expertise: 23, authority: 22, trustworthiness: 23 }, compliance: [], channelVersions: [{ channel: 'website', title: '喷涂机器人安全与适用条件', body: '更新后的安全说明与适用边界。', account: 'www.example.com', scheduledAt: '2026-07-31 18:00', status: 'scheduled' }],
  },
  {
    id: 'ct-007', title: 'PLC 故障排查指南更新', kind: 'refresh', type: 'guide', status: 'observing', priority: 'P2', theme: 'PLC 故障排查', audience: '设备维护工程师', userQuestion: '常见通信与程序故障如何快速定位？', channels: ['website', 'linkedin'], dueDate: '2026-07-24', reason: '旧文章跳出率较高，已补充故障路径图和分步检查清单。', outline: ['故障分类', '排查路径', '常见错误', '检查清单'], masterDraft: '已发布的更新版本。', knowledge: [], missingMaterials: [], quality: { overall: 84, experience: 21, expertise: 21, authority: 21, trustworthiness: 21 }, compliance: [], channelVersions: [{ channel: 'website', title: 'PLC 常见故障排查指南', body: '已发布', account: 'www.example.com', status: 'published', url: 'https://www.example.com/guides/plc-troubleshooting' }, { channel: 'linkedin', title: 'PLC 故障排查：先确认通信还是程序', body: '已发布', account: 'Example Automation', status: 'published', url: 'https://linkedin.com/posts/example-plc' }],
  },
  {
    id: 'ct-008', title: '广告渠道落地页 · 重写版', kind: 'optimize', type: 'solution', status: 'ready', priority: 'P0', theme: '广告渠道落地页内容重写', contentSubject: '广告承诺对应的工业机器人方案', knowledgeScopes: ['product', 'service', 'case'], audience: '通过广告到达落地页的采购决策者', userQuestion: '广告承诺的能力与落地页内容为什么不匹配？', businessGoal: 'conversion', successMetric: '落地页跳出率从 52% 降至 ≤42%，咨询 CTA 点击率 ≥4%', journeyStage: 'decide', coreMessage: '首屏应直接承接广告承诺，并用可验证能力、案例与适用边界支持采购判断。', desiredAction: '提交方案咨询', mustInclude: '广告承诺、方案能力、证据、适用边界', mustAvoid: '无法证明的效果保证', owner: '增长内容组 · 陈可', channels: ['website'], dueDate: '2026-08-08', reason: '归因分析发现广告渠道落地页跳出率 52%，高于行业基准 42%。', origin: { source: 'attribution', sourceLabel: '归因分析 · 广告渠道落地页跳出率', attributionRef: { changeId: 'chg-1', measureId: 'm-1-1', reviewPeriod: 'T+7' }, evidence: { currentValue: '广告渠道落地页跳出率 52%', benchmark: '高于行业平均 42%', action: '按搜索意图重写落地页内容，匹配创意承诺' } }, outline: ['首屏对齐创意承诺', '痛点-方案-案例结构', '产品能力上移'], masterDraft: '', knowledge: [], missingMaterials: [], quality: { overall: 0, experience: 0, expertise: 0, authority: 0, trustworthiness: 0 }, compliance: [], channelVersions: [],
  },
]

export const contentCalendarData: ContentCalendarItem[] = [
  // ── 历史：2026-07-13 当周 ──
  { id: 'cal-h1', taskId: 'ct-007', date: '2026-07-14', time: '10:00', title: 'PLC 排查指南母稿定稿', channel: 'website', stage: 'production', state: 'normal', done: true },
  { id: 'cal-h2', taskId: 'ct-007', date: '2026-07-16', time: '15:00', title: 'PLC 排查指南合规审核', channel: 'website', stage: 'review', state: 'normal', done: true },
  { id: 'cal-h3', taskId: 'ct-005', date: '2026-07-18', time: '09:00', title: '码垛白皮书官网发布', channel: 'website', stage: 'publish', state: 'normal', done: true },
  // ── 历史：2026-07-20 当周 ──
  { id: 'cal-h4', taskId: 'ct-007', date: '2026-07-24', time: '10:00', title: 'PLC 排查指南多渠道发布', channel: 'website', stage: 'publish', state: 'normal', done: true },
  { id: 'cal-h5', taskId: 'ct-007', date: '2026-07-24', time: '10:30', title: 'PLC 排查指南 LinkedIn 发布', channel: 'linkedin', stage: 'publish', state: 'normal', done: true },
  { id: 'cal-h6', taskId: 'ct-002', date: '2026-07-22', time: '14:00', title: '焊接案例资料收集', channel: 'website', stage: 'production', state: 'warning', done: true },
  // ── 本周：2026-07-27 当周 ──
  { id: 'cal-h7', taskId: 'ct-001', date: '2026-07-28', time: '09:00', title: '选型指南渠道预发布', channel: 'facebook', stage: 'publish', state: 'failed', done: true },
  { id: 'cal-1', taskId: 'ct-001', date: '2026-07-30', time: '14:00', title: '选型指南合规审核', channel: 'website', stage: 'review', state: 'warning' },
  { id: 'cal-2', taskId: 'ct-005', date: '2026-07-31', time: '09:30', title: '白皮书社媒组发布', channel: 'linkedin', stage: 'publish', state: 'normal' },
  { id: 'cal-3', taskId: 'ct-006', date: '2026-07-31', time: '18:00', title: '安全说明更新', channel: 'website', stage: 'publish', state: 'normal' },
  { id: 'cal-4', taskId: 'ct-003', date: '2026-08-01', time: '11:00', title: '产品能力母稿完成', channel: 'website', stage: 'production', state: 'normal' },
  { id: 'cal-5', taskId: 'ct-002', date: '2026-08-02', time: '16:00', title: '客户授权截止', channel: 'website', stage: 'review', state: 'warning' },
  // ── 未来：2026-08-03 当周 ──
  { id: 'cal-6', taskId: 'ct-001', date: '2026-08-03', time: '10:00', title: '选型指南多渠道发布', channel: 'facebook', stage: 'publish', state: 'normal' },
  { id: 'cal-7', taskId: 'ct-004', date: '2026-08-05', time: '15:00', title: 'FAQ 初稿', channel: 'website', stage: 'production', state: 'normal' },
  { id: 'cal-8', taskId: 'ct-003', date: '2026-08-06', time: '11:00', title: '产品能力内容审核', channel: 'website', stage: 'review', state: 'normal' },
  { id: 'cal-9', taskId: 'ct-002', date: '2026-08-07', time: '14:30', title: '焊接案例母稿生产', channel: 'website', stage: 'production', state: 'normal' },
]

/** 全球站：已开通的语言站点 */
export const contentLocalesData: ContentLocale[] = [
  { code: 'en', label: '英语站', site: 'www.example.com/en' },
  { code: 'de', label: '德语站', site: 'de.example.com' },
  { code: 'es', label: '西班牙语站', site: 'es.example.com' },
]

/** 专业名词与各语言站点译名配置 */
export const glossaryTermsData: GlossaryTerm[] = [
  { id: 'gt-1', term: '工业机器人', category: '产品术语', definition: '用于工业自动化生产的多关节机械装置，品牌规范中统一使用该译法，不使用「机械臂」。', translations: { en: 'Industrial Robot', de: 'Industrieroboter', es: 'Robot Industrial' }, updatedAt: '2026-07-12' },
  { id: 'gt-2', term: '重复定位精度', category: '技术参数', definition: '机器人多次返回同一目标位置时的位置偏差范围，单位通常为 ±mm。', translations: { en: 'Repeatability', de: '', es: '' }, updatedAt: '2026-07-20' },
  { id: 'gt-3', term: '节拍时间', category: '技术参数', definition: '完成一个完整作业循环所需的时间，是产线产能测算的核心指标。', translations: { en: '', de: '', es: '' }, updatedAt: '2026-07-25' },
  { id: 'gt-4', term: '末端执行器', category: '产品术语', definition: '安装在机器人手腕法兰上的作业工具，如夹爪、焊枪、喷头。', translations: { en: 'End Effector', de: 'Endeffektor', es: '' }, updatedAt: '2026-07-18' },
  { id: 'gt-5', term: '防护等级', category: '合规术语', definition: '设备对固体异物与液体侵入的防护能力等级，按 IP 编码表示。', translations: { en: 'Ingress Protection Rating', de: '', es: '' }, updatedAt: '2026-07-22' },
  { id: 'gt-6', term: '工作半径', category: '技术参数', definition: '机器人末端可达空间的最大水平距离，决定可覆盖的作业范围。', translations: { en: 'Reach', de: 'Reichweite', es: 'Alcance' }, updatedAt: '2026-07-10' },
  { id: 'gt-7', term: '码垛', category: '应用场景', definition: '将物料按设定层数与排布堆叠到托盘上的自动化作业。', translations: { en: 'Palletizing', de: 'Palettieren', es: 'Paletizado' }, updatedAt: '2026-07-08' },
  { id: 'gt-8', term: '示教器', category: '产品术语', definition: '用于机器人手动操作与程序示教的手持终端设备。', translations: { en: 'Teach Pendant', de: '', es: '' }, updatedAt: '2026-07-26' },
]

export const contentAssetsData: ContentAsset[] = [
  { id: 'ca-1', taskId: 'ct-007', title: 'PLC 常见故障排查指南', type: 'guide', language: '中文', status: 'published', qualityScore: 84, compliance: 'pass', channels: ['website', 'linkedin'], updatedAt: '2026-07-24', expiresAt: '2027-01-24', uv: 268, scrollDepth: 61 },
  { id: 'ca-2', taskId: 'ct-005', title: '码垛机器人应用白皮书', type: 'insight', language: '中文', status: 'published', qualityScore: 88, compliance: 'pass', channels: ['website'], updatedAt: '2026-07-18', expiresAt: '2027-01-18', uv: 326, scrollDepth: 68 },
  { id: 'ca-3', taskId: 'ct-001', title: '工业机器人选型指南 2026', type: 'guide', language: '中文', status: 'reviewing', qualityScore: 86, compliance: 'high', channels: ['website', 'linkedin', 'facebook', 'x'], updatedAt: '2026-07-29', expiresAt: '2027-01-29', uv: 0, scrollDepth: 0 },
  { id: 'ca-4', taskId: 'ct-003', title: '工业机器人产品能力完整介绍', type: 'product', language: '中文', status: 'draft', qualityScore: 72, compliance: 'low', channels: ['website', 'linkedin', 'facebook'], updatedAt: '2026-07-29', expiresAt: '2027-01-29', uv: 0, scrollDepth: 0 },
  { id: 'ca-5', taskId: 'ct-006', title: '喷涂机器人安全与适用条件', type: 'product', language: '中文', status: 'published', qualityScore: 91, compliance: 'pass', channels: ['website'], updatedAt: '2026-07-29', expiresAt: '2026-10-29', uv: 142, scrollDepth: 56 },
  { id: 'ca-6', taskId: 'ct-002', title: '汽车零部件焊接应用案例', type: 'case', language: '中文', status: 'needs_update', qualityScore: 48, compliance: 'blocking', channels: ['website', 'linkedin'], updatedAt: '2026-07-28', expiresAt: '2026-08-15', uv: 0, scrollDepth: 0 },
]

export const publicationRecordsData: PublicationRecord[] = [
  { id: 'pub-1', taskId: 'ct-005', title: '码垛机器人应用白皮书社媒拆解', status: 'pending_approval', channels: contentTasksData.find((t) => t.id === 'ct-005')!.channelVersions },
  { id: 'pub-2', taskId: 'ct-006', title: '喷涂机器人安全说明更新', status: 'scheduled', approvedBy: '张敏', scheduledAt: '2026-07-31 18:00', channels: contentTasksData.find((t) => t.id === 'ct-006')!.channelVersions },
  { id: 'pub-3', taskId: 'ct-007', title: 'PLC 故障排查指南更新', status: 'published', approvedBy: '张敏', scheduledAt: '2026-07-24 10:00', channels: contentTasksData.find((t) => t.id === 'ct-007')!.channelVersions },
  { id: 'pub-4', taskId: 'ct-001', title: '工业机器人选型指南渠道预发布', status: 'partial', approvedBy: '李静', scheduledAt: '2026-07-28 09:00', channels: [
      { channel: 'website', title: '工业机器人选型指南 2026', body: '预发布版本', account: 'www.example.com', status: 'published', url: 'https://www.example.com/guides/robot-selection-2026' },
      { channel: 'linkedin', title: '机器人选型最容易忽略的，不是负载', body: '预发布版本', account: 'Example Automation', status: 'published', url: 'https://linkedin.com/posts/example-selection' },
      { channel: 'facebook', title: '工业机器人怎么选？先看这 6 项', body: '预发布版本', account: 'Example Automation Global', status: 'failed', error: '平台授权已失效，请重新连接账号' },
      { channel: 'x', title: '工业机器人选型 6 项检查', body: '预发布版本', account: '@ExampleAuto', status: 'published', url: 'https://x.com/ExampleAuto/status/001' },
    ] },
]

export const knowledgeRiskEventsData: KnowledgeRiskEvent[] = [
  { id: 'kre-1', taskId: 'ct-003', taskTitle: '工业机器人产品能力完整介绍', issueType: 'RAG no-hit：型号矩阵未命中', diagnosis: '调用产品知识库检索型号矩阵时未命中任何结果，母稿中的型号对比章节暂时留空，需人工补充或重新生成。', level: 'high', status: 'pending', occurredAt: '2026-07-29 16:42' },
  { id: 'kre-2', taskId: 'ct-001', taskTitle: '工业机器人选型指南 2026', issueType: 'RAG no-hit：选型规则未命中', diagnosis: 'AI 重写“负载选择”段落时检索行业知识库未命中最新选型规则，改用了通用表述，建议人工核实后替换。', level: 'high', status: 'pending', occurredAt: '2026-07-29 11:05' },
  { id: 'kre-9', taskId: 'ct-001', taskTitle: '工业机器人选型指南 2026', issueType: 'RAG no-hit：节拍基准数据未命中', diagnosis: '生成“六个关键参数”章节时检索企业知识库未命中 2026 年节拍基准数据，母稿改引第三方行业报告，需合规确认引用出处。', level: 'medium', status: 'pending', occurredAt: '2026-07-29 09:40' },
  { id: 'kre-10', taskId: 'ct-001', taskTitle: '工业机器人选型指南 2026', issueType: 'RAG no-hit：焊接案例结果数据未命中', diagnosis: '生成“真实应用案例”章节时检索案例库未命中可公开的前后节拍数据，该小节已留空待补，是当前合规高风险项的来源。', level: 'critical', status: 'pending', occurredAt: '2026-07-28 17:20' },
  { id: 'kre-3', taskId: 'ct-002', taskTitle: '汽车零部件焊接应用案例', issueType: 'RAG no-hit：客户案例授权未命中', diagnosis: '检索客户案例授权状态时知识库未返回任何结果，母稿生成被迫跳过结果数据小节。', level: 'medium', status: 'pending', occurredAt: '2026-07-28 09:20' },
  { id: 'kre-4', taskId: 'ct-003', taskTitle: '工业机器人产品能力完整介绍', issueType: 'RAG no-hit：应用场景案例未命中', diagnosis: '生成“应用场景”章节时检索企业案例库未命中任何相关记录，建议补充案例后重新生成该章节。', level: 'critical', status: 'pending', occurredAt: '2026-07-25 10:15' },
  { id: 'kre-5', taskId: 'ct-005', taskTitle: '码垛机器人应用白皮书社媒拆解', issueType: 'RAG no-hit：行业数据未命中', diagnosis: '社媒版本生成时检索行业数据知识库未命中最新数据，已改用白皮书内已有数据，风险已确认可接受。', level: 'low', status: 'resolved', occurredAt: '2026-07-26 14:10' },
  { id: 'kre-6', taskId: 'ct-004', taskTitle: '工业机器人常见问题', issueType: 'RAG no-hit：维护周期条款未命中', diagnosis: '检索维护周期相关条款时知识库未命中，FAQ 草稿中对应问答已人工补充确认。', level: 'medium', status: 'resolved', occurredAt: '2026-07-24 15:30' },
  { id: 'kre-7', taskId: 'ct-007', taskTitle: 'PLC 故障排查指南更新', issueType: 'RAG no-hit：通信协议条目未命中', diagnosis: '检索特定通信协议故障条目时知识库未命中，已发布版本沿用旧版排查路径，建议下一轮更新时补充资料。', level: 'high', status: 'pending', occurredAt: '2026-07-20 09:00' },
  { id: 'kre-8', taskId: 'ct-006', taskTitle: '喷涂机器人安全说明更新', issueType: 'RAG no-hit：旧版安全规范未命中', diagnosis: '检索最新安全规范编号时知识库未命中，已由人工确认并替换为正确引用。', level: 'low', status: 'resolved', occurredAt: '2026-07-18 13:45' },
]

export const themePerformanceData: ContentThemePerformance[] = [
  { id: 'perf-1', theme: '工业机器人选型', taskId: 'ct-001', website: { uv: 428, scrollDepth: 64, avgDuration: '2m 18s', scrollRate: 71, bounceRate: 42, relatedClicks: 86 }, social: { impressions: 8200, engagements: 418, engagementRate: 5.1, linkClicks: 162 }, conclusion: '网站滚动深度和 LinkedIn 互动均高于平均值，建议扩展“负载选择”和“工作半径选择”两个子主题。', action: 'expand' },
  { id: 'perf-2', theme: 'PLC 故障排查', taskId: 'ct-007', website: { uv: 268, scrollDepth: 61, avgDuration: '1m 54s', scrollRate: 66, bounceRate: 46, relatedClicks: 49 }, social: { impressions: 4300, engagements: 146, engagementRate: 3.4, linkClicks: 72 }, conclusion: '更新后的故障路径图改善了阅读深度，可继续补充通信故障专题。', action: 'expand' },
  { id: 'perf-3', theme: '机器人维护保养', taskId: 'ct-004', website: { uv: 196, scrollDepth: 28, avgDuration: '0m 46s', scrollRate: 31, bounceRate: 72, relatedClicks: 12 }, social: { impressions: 2800, engagements: 81, engagementRate: 2.9, linkClicks: 26 }, conclusion: '访问后快速离开，现有内容缺少分步骤检查表和常见故障说明，建议重构。', action: 'optimize' },
  { id: 'perf-4', theme: '喷涂机器人安全', taskId: 'ct-006', website: { uv: 142, scrollDepth: 56, avgDuration: '1m 36s', scrollRate: 58, bounceRate: 49, relatedClicks: 22 }, social: { impressions: 0, engagements: 0, engagementRate: 0, linkClicks: 0 }, conclusion: '内容专业度稳定，但安全规范将在三个月后复核，建议保留复核任务。', action: 'review' },
]

/** 效果分析：按周维度的总统计（周一为一周起点） */
export const weeklyPerformanceData: ContentWeeklyPerformance[] = [
  { weekStart: '2026-07-27', label: '07/27 - 08/02', websiteUv: 612, scrollDepth: 48, socialImpressions: 7400, engagementRate: 4.6, linkClicks: 148, websitePublished: 2, socialPublished: 4 },
  { weekStart: '2026-07-20', label: '07/20 - 07/26', websiteUv: 528, scrollDepth: 45, socialImpressions: 6100, engagementRate: 4.1, linkClicks: 126, websitePublished: 2, socialPublished: 3 },
  { weekStart: '2026-07-13', label: '07/13 - 07/19', websiteUv: 274, scrollDepth: 42, socialImpressions: 3200, engagementRate: 3.6, linkClicks: 62, websitePublished: 1, socialPublished: 1 },
  { weekStart: '2026-07-06', label: '07/06 - 07/12', websiteUv: 146, scrollDepth: 38, socialImpressions: 1900, engagementRate: 3.1, linkClicks: 22, websitePublished: 1, socialPublished: 0 },
]

/** 效果分析：单条已发布内容的官网 / 社媒发布计数与效果明细 */
export const contentPublishStatsData: ContentPublishStat[] = [
  {
    id: 'cps-1', taskId: 'ct-007', weekStart: '2026-07-20', title: 'PLC 常见故障排查指南', publishedAt: '2026-07-24 10:00',
    websiteCount: 2, socialCount: 3,
    channelCounts: [
      { channel: 'website', count: 2, url: 'https://www.example.com/guides/plc-troubleshooting', lastPublishedAt: '2026-07-24 10:00' },
      { channel: 'linkedin', count: 2, url: 'https://linkedin.com/posts/example-plc', lastPublishedAt: '2026-07-24 10:30' },
      { channel: 'x', count: 1, url: 'https://x.com/ExampleAuto/status/007', lastPublishedAt: '2026-07-25 09:00' },
    ],
    uv: 268, scrollDepth: 61, avgDuration: '1m 54s', impressions: 4300, engagements: 146, engagementRate: 3.4, linkClicks: 72,
  },
  {
    id: 'cps-2', taskId: 'ct-005', weekStart: '2026-07-13', title: '码垛机器人应用白皮书', publishedAt: '2026-07-18 09:00',
    websiteCount: 1, socialCount: 1,
    channelCounts: [
      { channel: 'website', count: 1, url: 'https://www.example.com/whitepaper/palletizing', lastPublishedAt: '2026-07-18 09:00' },
      { channel: 'linkedin', count: 1, url: 'https://linkedin.com/posts/example-palletizing', lastPublishedAt: '2026-07-19 10:00' },
    ],
    uv: 326, scrollDepth: 68, avgDuration: '2m 42s', impressions: 5200, engagements: 268, engagementRate: 5.2, linkClicks: 104,
  },
  {
    id: 'cps-3', taskId: 'ct-001', weekStart: '2026-07-27', title: '工业机器人选型指南 2026（预发布）', publishedAt: '2026-07-28 09:00',
    websiteCount: 1, socialCount: 2,
    channelCounts: [
      { channel: 'website', count: 1, url: 'https://www.example.com/guides/robot-selection-2026', lastPublishedAt: '2026-07-28 09:00' },
      { channel: 'linkedin', count: 1, url: 'https://linkedin.com/posts/example-selection', lastPublishedAt: '2026-07-28 09:10' },
      { channel: 'x', count: 1, url: 'https://x.com/ExampleAuto/status/001', lastPublishedAt: '2026-07-28 09:20' },
      { channel: 'facebook', count: 0, lastPublishedAt: '—' },
    ],
    uv: 428, scrollDepth: 64, avgDuration: '2m 18s', impressions: 8200, engagements: 418, engagementRate: 5.1, linkClicks: 162,
  },
  {
    id: 'cps-4', taskId: 'ct-006', weekStart: '2026-07-27', title: '喷涂机器人安全与适用条件', publishedAt: '2026-07-29 16:00',
    websiteCount: 1, socialCount: 0,
    channelCounts: [
      { channel: 'website', count: 1, url: 'https://www.example.com/products/painting-safety', lastPublishedAt: '2026-07-29 16:00' },
    ],
    uv: 142, scrollDepth: 56, avgDuration: '1m 36s', impressions: 0, engagements: 0, engagementRate: 0, linkClicks: 0,
  },
  {
    id: 'cps-5', taskId: 'ct-004', weekStart: '2026-07-06', title: '机器人维护保养常见问题（旧版）', publishedAt: '2026-07-08 11:00',
    websiteCount: 1, socialCount: 1,
    channelCounts: [
      { channel: 'website', count: 1, url: 'https://www.example.com/faq/maintenance', lastPublishedAt: '2026-07-08 11:00' },
      { channel: 'x', count: 1, url: 'https://x.com/ExampleAuto/status/004', lastPublishedAt: '2026-07-09 09:00' },
    ],
    uv: 196, scrollDepth: 28, avgDuration: '0m 46s', impressions: 2800, engagements: 81, engagementRate: 2.9, linkClicks: 26,
  },
]

/** 内容洞察：内容运营 Agent 工作方法论 §2.3 第①段"内容洞察"产出，尚未被采纳前不属于计划 */
export const contentOpportunitiesData: ContentOpportunity[] = [
  { id: 'op-1', source: 'inventory', evidence: '内容盘点发现「装配机器人」产品线缺少 FAQ，客服工单中相关问题占比 18%。', suggestedTitle: '装配机器人常见问题', suggestedTheme: '装配机器人使用', suggestedChannels: ['website'], suggestedPriority: 'P1', inferredAudience: '正在评估装配自动化的工程师', status: 'open' },
  { id: 'op-2', source: 'read_performance', evidence: '「机器人维护保养」内容近 30 天滚动深度降至 28%，跳出率 72%，明显低于同类内容均值。', suggestedTitle: '机器人维护保养指南重构', suggestedTheme: '机器人维护保养', suggestedChannels: ['website'], suggestedPriority: 'P1', relatedTaskId: 'ct-004', inferredAudience: '设备维护工程师', status: 'open' },
  { id: 'op-3', source: 'social_performance', evidence: '「工业机器人选型指南」LinkedIn 版本互动率 5.1%，显著高于账号均值，具备扩展为系列内容的潜力。', suggestedTitle: '选型系列：负载与工作半径深度拆解', suggestedTheme: '工业机器人选型', suggestedChannels: ['linkedin', 'facebook'], suggestedPriority: 'P2', relatedTaskId: 'ct-001', inferredAudience: '制造企业自动化负责人', status: 'open' },
  { id: 'op-4', source: 'business_focus', evidence: '业务侧新增中东市场拓展计划，官网与社媒尚无面向该地区的本地化内容。', suggestedTitle: '中东市场喷涂自动化应用介绍', suggestedTheme: '喷涂机器人海外拓展', suggestedChannels: ['website', 'facebook'], suggestedPriority: 'P2', inferredAudience: '中东地区喷涂自动化决策者', status: 'open' },
]

/** 计划项：内容运营 Agent 工作方法论 §2.3 第②段"内容计划"产出，转入生产前不占用生产资源 */
export const contentPlanItemsData: ContentPlanItem[] = [
  { id: 'pi-1', opportunityId: 'op-1', title: '装配机器人常见问题', type: 'faq', kind: 'create', theme: '装配机器人使用', audience: '正在评估装配自动化的工程师', channels: ['website'], priority: 'P1', dueDate: '2026-08-12', reason: '内容盘点发现客服工单集中反映的问题尚无官网内容覆盖。', status: 'accepted' },
  { id: 'pi-2', opportunityId: 'op-2', title: '机器人维护保养指南重构', type: 'guide', kind: 'optimize', theme: '机器人维护保养', audience: '设备维护工程师', channels: ['website'], priority: 'P1', dueDate: '2026-08-10', reason: '现有内容阅读表现持续下滑，需重构结构与检查清单。', status: 'promoted', promotedTaskId: 'ct-004' },
  { id: 'pi-3', opportunityId: 'op-3', title: '选型系列：负载与工作半径深度拆解', type: 'guide', kind: 'expand', theme: '工业机器人选型', audience: '制造企业自动化负责人', channels: ['linkedin', 'facebook'], priority: 'P2', dueDate: '2026-08-15', reason: '选型指南社媒互动表现突出，扩展子主题可延续热度。', status: 'proposed' },
  { id: 'pi-4', title: '备件供应与响应时效说明', type: 'faq', kind: 'create', theme: '售后服务', audience: '设备采购与维护负责人', channels: ['website'], priority: 'P2', dueDate: '2026-08-20', reason: '运营人员反馈售前咨询中常问备件供应周期，暂无内容承接。', status: 'dropped' },
]
