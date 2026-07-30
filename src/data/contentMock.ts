import type {
  ContentAsset,
  ContentCalendarItem,
  ContentTask,
  ContentThemePerformance,
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
    audience: '制造企业自动化负责人',
    userQuestion: '负载、工作半径和精度要求不同，应该如何选择机器人？',
    channels: ['website', 'linkedin', 'facebook', 'x'],
    dueDate: '2026-08-02',
    reason: '现有指南访问量高，但信息深度不足，访客在参数对比章节前大量离开。',
    outline: ['选型前先明确工艺目标', '六个关键参数', '不同场景的选型建议', '常见错误', '真实应用案例', 'FAQ'],
    masterDraft: '选择工业机器人不能只比较额定负载。负载、工作半径、重复定位精度、节拍、防护等级与末端工具需要作为一组条件综合判断。\n\n对于汽车零部件焊接场景，稳定节拍和工装适配往往比单一速度指标更重要。建议先明确工件重量、作业半径、环境粉尘与连续运行时长，再进入型号对比。\n\n本指南结合企业现有产品参数和项目经验，给出从需求梳理到方案验证的完整检查清单。',
    knowledge: [
      { id: 'kr-1', category: '产品参数', title: 'IR-20 / IR-50 产品规格表', source: '企业产品中心', verified: true },
      { id: 'kr-2', category: '应用案例', title: '汽车零部件焊接线项目摘要', source: '案例库 CASE-024', verified: true },
      { id: 'kr-3', category: '行业知识', title: '机器人负载与工作半径选型规则', source: '行业知识库', verified: true },
    ],
    missingMaterials: [],
    quality: { overall: 86, relevance: 19, accuracy: 18, completeness: 18, readability: 14, authenticity: 9, channelFit: 8 },
    compliance: [
      { id: 'ci-1', level: 'high', category: 'fact', title: '效率提升 40% 缺少可公开来源', detail: '建议改为案例中已确认的节拍变化，或删除百分比。', resolved: false },
      { id: 'ci-2', level: 'medium', category: 'advertising', title: '“行业第一”属于绝对化表达', detail: 'LinkedIn 版本中存在无法证明的绝对化表述。', resolved: false },
      { id: 'ci-3', level: 'low', category: 'brand', title: '术语需统一', detail: '将“机械臂”统一为品牌规范中的“工业机器人”。', resolved: true },
    ],
    channelVersions: [
      { channel: 'website', title: '工业机器人选型指南 2026', body: '完整指南：从工艺目标、负载、工作半径、精度、节拍到环境条件，逐项说明选型方法，并附真实应用案例与检查清单。', account: 'www.example.com', status: 'ready' },
      { channel: 'linkedin', title: '机器人选型最容易忽略的，不是负载', body: '很多选型从额定负载开始，却忽略了工作半径、节拍和末端工具共同形成的真实负载。我们整理了 6 个判断维度，并结合汽车零部件焊接案例说明如何验证方案。', account: 'Example Automation', status: 'ready' },
      { channel: 'facebook', title: '工业机器人怎么选？先看这 6 项', body: '负载只是第一步。工作半径、精度、节拍、防护等级和工具重量同样重要。查看完整选型清单与应用示例。', account: 'Example Automation Global', status: 'ready' },
      { channel: 'x', title: '工业机器人选型 6 项检查', body: '选机器人别只看负载：①工艺目标 ②工作半径 ③重复精度 ④节拍 ⑤环境 ⑥末端工具。完整指南将结合真实项目逐项展开。', account: '@ExampleAuto', status: 'ready' },
    ],
  },
  {
    id: 'ct-002', title: '汽车零部件焊接应用案例', kind: 'create', type: 'case', status: 'needs_material', priority: 'P1', theme: '汽车焊接自动化', audience: '汽车零部件工厂技术与生产负责人', userQuestion: '同类型工厂如何部署焊接工作站，实际改善了什么？', channels: ['website', 'linkedin'], dueDate: '2026-08-06', reason: '网站缺少可证明项目交付能力的真实案例。', outline: ['客户背景', '原有问题', '方案设计', '实施过程', '结果数据', '适用企业'], masterDraft: '', knowledge: [{ id: 'kr-4', category: '项目资料', title: '焊接线交付记录', source: '项目中心 PJ-106', verified: true }], missingMaterials: ['客户公开授权', '实施前后节拍数据'], quality: { overall: 48, relevance: 16, accuracy: 7, completeness: 7, readability: 10, authenticity: 3, channelFit: 5 }, compliance: [{ id: 'ci-4', level: 'blocking', category: 'privacy', title: '客户案例尚未获得公开授权', detail: '客户名称、Logo和现场图片均不可发布。', resolved: false }], channelVersions: [],
  },
  {
    id: 'ct-003', title: '工业机器人产品能力完整介绍', kind: 'create', type: 'product', status: 'generating', priority: 'P1', theme: '工业机器人产品', audience: '首次了解产品的技术与采购人员', userQuestion: '产品有哪些能力、适用场景和限制？', channels: ['website', 'linkedin', 'facebook'], dueDate: '2026-08-04', reason: '当前产品页只有参数表，缺少应用说明、限制条件和型号差异。', outline: ['核心能力', '型号矩阵', '应用场景', '集成条件', '限制说明', '常见问题'], masterDraft: '正在基于已验证产品资料生成母稿…', knowledge: [{ id: 'kr-5', category: '产品参数', title: '工业机器人全系列规格', source: 'PIM', verified: true }], missingMaterials: [], quality: { overall: 72, relevance: 17, accuracy: 17, completeness: 12, readability: 12, authenticity: 8, channelFit: 6 }, compliance: [], channelVersions: [],
  },
  {
    id: 'ct-004', title: '工业机器人常见问题', kind: 'create', type: 'faq', status: 'ready', priority: 'P2', theme: '工业机器人使用', audience: '正在评估部署条件的工程师', userQuestion: '部署、维护、环境和培训方面有哪些要求？', channels: ['website', 'x'], dueDate: '2026-08-08', reason: '客服与站内搜索中反复出现相同问题，现有页面没有集中回答。', outline: ['部署条件', '维护周期', '人员培训', '环境要求', '备件与服务'], masterDraft: '', knowledge: [], missingMaterials: [], quality: { overall: 0, relevance: 0, accuracy: 0, completeness: 0, readability: 0, authenticity: 0, channelFit: 0 }, compliance: [], channelVersions: [],
  },
  {
    id: 'ct-005', title: '码垛机器人应用白皮书社媒拆解', kind: 'repurpose', type: 'insight', status: 'pending_approval', priority: 'P2', theme: '码垛自动化', audience: '食品与物流行业运营负责人', userQuestion: '码垛自动化有哪些典型收益和实施条件？', channels: ['linkedin', 'facebook', 'x'], dueDate: '2026-08-01', reason: '网站白皮书阅读表现良好，可拆解为连续社媒内容扩大触达。', outline: ['行业问题', '方案摘要', '三项实施条件', '案例数据'], masterDraft: '基于已发布白皮书整理的社媒母稿。', knowledge: [], missingMaterials: [], quality: { overall: 88, relevance: 18, accuracy: 19, completeness: 18, readability: 15, authenticity: 10, channelFit: 8 }, compliance: [], channelVersions: [
      { channel: 'linkedin', title: '码垛自动化落地前，先确认这三件事', body: '稳定节拍、现场空间与来料一致性，是码垛项目能否稳定运行的三个前提。本文结合白皮书中的项目经验逐项说明。', account: 'Example Automation', status: 'ready' },
      { channel: 'facebook', title: '码垛自动化的 3 个实施前提', body: '准备引入码垛机器人？先确认节拍、空间和来料稳定性。完整白皮书已经整理好。', account: 'Example Automation Global', status: 'ready' },
      { channel: 'x', title: '码垛自动化实施清单', body: '码垛项目落地前确认：节拍稳定、现场空间、来料一致性。缺一项，后续调试成本都可能显著增加。', account: '@ExampleAuto', status: 'ready' },
    ],
  },
  {
    id: 'ct-006', title: '喷涂机器人安全说明更新', kind: 'compliance', type: 'product', status: 'scheduled', priority: 'P0', theme: '喷涂机器人安全', audience: '喷涂产线技术与安全负责人', userQuestion: '设备在易燃环境下有哪些安全前提？', channels: ['website'], dueDate: '2026-07-31', reason: '原页面引用的安全规范版本已更新，需要同步免责声明和适用条件。', outline: ['适用环境', '防护要求', '安装限制', '安全声明'], masterDraft: '已更新安全规范引用和设备适用边界。', knowledge: [], missingMaterials: [], quality: { overall: 91, relevance: 19, accuracy: 20, completeness: 19, readability: 14, authenticity: 10, channelFit: 9 }, compliance: [], channelVersions: [{ channel: 'website', title: '喷涂机器人安全与适用条件', body: '更新后的安全说明与适用边界。', account: 'www.example.com', scheduledAt: '2026-07-31 18:00', status: 'scheduled' }],
  },
  {
    id: 'ct-007', title: 'PLC 故障排查指南更新', kind: 'refresh', type: 'guide', status: 'observing', priority: 'P2', theme: 'PLC 故障排查', audience: '设备维护工程师', userQuestion: '常见通信与程序故障如何快速定位？', channels: ['website', 'linkedin'], dueDate: '2026-07-24', reason: '旧文章跳出率较高，已补充故障路径图和分步检查清单。', outline: ['故障分类', '排查路径', '常见错误', '检查清单'], masterDraft: '已发布的更新版本。', knowledge: [], missingMaterials: [], quality: { overall: 84, relevance: 18, accuracy: 18, completeness: 17, readability: 14, authenticity: 9, channelFit: 8 }, compliance: [], channelVersions: [{ channel: 'website', title: 'PLC 常见故障排查指南', body: '已发布', account: 'www.example.com', status: 'published', url: 'https://www.example.com/guides/plc-troubleshooting' }, { channel: 'linkedin', title: 'PLC 故障排查：先确认通信还是程序', body: '已发布', account: 'Example Automation', status: 'published', url: 'https://linkedin.com/posts/example-plc' }],
  },
]

export const contentCalendarData: ContentCalendarItem[] = [
  { id: 'cal-1', taskId: 'ct-001', date: '07-30', time: '14:00', title: '选型指南合规审核', channel: 'website', stage: 'review', state: 'warning' },
  { id: 'cal-2', taskId: 'ct-005', date: '07-31', time: '09:30', title: '白皮书社媒组发布', channel: 'linkedin', stage: 'publish', state: 'normal' },
  { id: 'cal-3', taskId: 'ct-006', date: '07-31', time: '18:00', title: '安全说明更新', channel: 'website', stage: 'publish', state: 'normal' },
  { id: 'cal-4', taskId: 'ct-003', date: '08-01', time: '11:00', title: '产品能力母稿完成', channel: 'website', stage: 'production', state: 'normal' },
  { id: 'cal-5', taskId: 'ct-002', date: '08-02', time: '16:00', title: '客户授权截止', channel: 'website', stage: 'review', state: 'warning' },
  { id: 'cal-6', taskId: 'ct-001', date: '08-03', time: '10:00', title: '选型指南多渠道发布', channel: 'facebook', stage: 'publish', state: 'normal' },
  { id: 'cal-7', taskId: 'ct-004', date: '08-05', time: '15:00', title: 'FAQ 初稿', channel: 'website', stage: 'production', state: 'normal' },
]

export const contentAssetsData: ContentAsset[] = [
  { id: 'ca-1', taskId: 'ct-007', title: 'PLC 常见故障排查指南', type: 'guide', language: '中文', status: 'published', qualityScore: 84, compliance: 'pass', channels: ['website', 'linkedin'], updatedAt: '2026-07-24', expiresAt: '2027-01-24', uv: 268, effectiveReadRate: 61 },
  { id: 'ca-2', taskId: 'ct-005', title: '码垛机器人应用白皮书', type: 'insight', language: '中文', status: 'published', qualityScore: 88, compliance: 'pass', channels: ['website'], updatedAt: '2026-07-18', expiresAt: '2027-01-18', uv: 326, effectiveReadRate: 68 },
  { id: 'ca-3', taskId: 'ct-001', title: '工业机器人选型指南 2026', type: 'guide', language: '中文', status: 'reviewing', qualityScore: 86, compliance: 'high', channels: ['website', 'linkedin', 'facebook', 'x'], updatedAt: '2026-07-29', expiresAt: '2027-01-29', uv: 0, effectiveReadRate: 0 },
  { id: 'ca-4', taskId: 'ct-003', title: '工业机器人产品能力完整介绍', type: 'product', language: '中文', status: 'draft', qualityScore: 72, compliance: 'low', channels: ['website', 'linkedin', 'facebook'], updatedAt: '2026-07-29', expiresAt: '2027-01-29', uv: 0, effectiveReadRate: 0 },
  { id: 'ca-5', taskId: 'ct-006', title: '喷涂机器人安全与适用条件', type: 'product', language: '中文', status: 'published', qualityScore: 91, compliance: 'pass', channels: ['website'], updatedAt: '2026-07-29', expiresAt: '2026-10-29', uv: 142, effectiveReadRate: 56 },
  { id: 'ca-6', taskId: 'ct-002', title: '汽车零部件焊接应用案例', type: 'case', language: '中文', status: 'needs_update', qualityScore: 48, compliance: 'blocking', channels: ['website', 'linkedin'], updatedAt: '2026-07-28', expiresAt: '2026-08-15', uv: 0, effectiveReadRate: 0 },
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

export const themePerformanceData: ContentThemePerformance[] = [
  { id: 'perf-1', theme: '工业机器人选型', taskId: 'ct-001', website: { uv: 428, effectiveReadRate: 64, avgDuration: '2m 18s', scrollRate: 71, bounceRate: 42, relatedClicks: 86 }, social: { impressions: 8200, engagements: 418, engagementRate: 5.1, linkClicks: 162 }, conclusion: '网站有效阅读和 LinkedIn 互动均高于平均值，建议扩展“负载选择”和“工作半径选择”两个子主题。', action: 'expand' },
  { id: 'perf-2', theme: 'PLC 故障排查', taskId: 'ct-007', website: { uv: 268, effectiveReadRate: 61, avgDuration: '1m 54s', scrollRate: 66, bounceRate: 46, relatedClicks: 49 }, social: { impressions: 4300, engagements: 146, engagementRate: 3.4, linkClicks: 72 }, conclusion: '更新后的故障路径图改善了阅读深度，可继续补充通信故障专题。', action: 'expand' },
  { id: 'perf-3', theme: '机器人维护保养', taskId: 'ct-004', website: { uv: 196, effectiveReadRate: 28, avgDuration: '0m 46s', scrollRate: 31, bounceRate: 72, relatedClicks: 12 }, social: { impressions: 2800, engagements: 81, engagementRate: 2.9, linkClicks: 26 }, conclusion: '访问后快速离开，现有内容缺少分步骤检查表和常见故障说明，建议重构。', action: 'optimize' },
  { id: 'perf-4', theme: '喷涂机器人安全', taskId: 'ct-006', website: { uv: 142, effectiveReadRate: 56, avgDuration: '1m 36s', scrollRate: 58, bounceRate: 49, relatedClicks: 22 }, social: { impressions: 0, engagements: 0, engagementRate: 0, linkClicks: 0 }, conclusion: '内容专业度稳定，但安全规范将在三个月后复核，建议保留复核任务。', action: 'review' },
]
