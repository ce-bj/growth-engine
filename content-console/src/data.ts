import type { PublishTask, Strategy, CalendarItem, TodoRow, Direction, PublishLog } from './types'

// 演示基准日
export const TODAY = '2026-09-22'

// 冷启动推荐任务（上线初始推荐，待确认）
export const DIRECTIONS: Direction[] = [
  {
    id: 'd1',
    title: '伺服驱动器散热设计专题',
    type: '常见问题',
    strat: ['GEO 4 项', '权威信源'],
    date: '2026-09-30',
    status: 'pending',
    app: '常见问题',
    col: '技术解读',
    freqText: '每周',
    countText: '2 篇',
    topic: '伺服散热 / 选型',
    kw: ['伺服驱动器', '散热设计'],
  },
]

// 待办数据（三类来源：行为分析智能体·修改/新增、自建任务·新增）
export const INITIAL_TODOS: TodoRow[] = [
  // ① 行为分析智能体 · 修改内容
  {
    id: 'td1', title: 'SDPH 系列全国产大电流型 — 产品介绍（修正：参数错误）',
    type: '产品管理', date: '2026-09-22', source: 'behavior-fix',
    strat: ['EEAT 强化', 'GEO 4 项'], note: '访客行为分析发现参数表述有误，需修正电流规格',
    needKb: false, kbName: '',
  },
  {
    id: 'td2', title: 'PT100 温度传感器选型指南（英文站）（修正：精度等级）',
    type: '常见问题', date: '2026-09-22', source: 'behavior-fix',
    strat: ['EEAT 强化', '权威信源'], note: '精度等级 A/B 级数据需核对权威来源',
    needKb: true, kbName: '英文站品牌词库',
  },
  // ② 行为分析智能体 · 新增内容
  {
    id: 'td3', title: '伺服驱动器散热设计专题',
    type: '常见问题', date: '2026-09-22', source: 'behavior-new',
    strat: ['GEO 4 项', '权威信源'], note: '访客高频搜索“伺服散热”，建议新增专题',
    needKb: false, kbName: '',
  },
  {
    id: 'td4', title: '工业温度传感器校准白皮书解读',
    type: '新闻资讯', date: '2026-09-22', source: 'behavior-new',
    strat: ['GEO 4 项'], note: '访客行为命中“校准”关键词，建议新增解读',
    needKb: false, kbName: '',
  },
  // ③ 自建任务 · 新增内容
  {
    id: 'td5', title: 'servo 驱动器散热设计要点',
    type: '企业图册', date: '2026-09-22', source: 'self-new',
    strat: ['EEAT 强化', 'GEO 4 项'], note: '来自自建发布任务《10月行业方案内容包》',
    needKb: false, kbName: '',
  },
]

// 发布任务（容器）：一套生产规则，持续产出多条内容
export const INITIAL_TASKS: PublishTask[] = [
  // 进行中
  {
    id: 'tk1', taskNo: '2122261673', title: '10月行业方案内容包', from: 'manual', status: 'active',
    app: '产品中心', col: '行业方案', freqText: '每周', countText: '2 篇',
    start: '2026-10-12', createdAt: '2026-10-10', next: '2026-10-19',
    topic: '行业方案 / 应用场景', kw: ['伺服驱动器', '散热设计', '选型'],
    note: '围绕行业方案持续产出，配图开启后需人工审核', imgOn: true, mode: 'review',
    map: ['伺服驱动器', '产品中心', '行业方案', 'termoline.com', '自动匹配'],
    strat: ['eeat', 'geo'],
  },
  {
    id: 'tk2', taskNo: '966129152', title: '英文站 PT100 选型专题（常见问题）', from: 'agent', status: 'active',
    app: '博客文章', col: '英文站 · Technical Blog', freqText: '每周', countText: '1 篇',
    start: '2026-09-16', createdAt: '2026-09-14', next: '2026-09-23',
    topic: '选型指南 / 误差分析', kw: ['PT100', '铂电阻', '温度传感器'],
    note: '智能体依据已确认的选题方向自动排产', imgOn: false, mode: 'review',
    map: ['PT100', '博客文章', '英文站', 'termoline.com', '自动匹配'],
    strat: ['geo', 'auth'],
  },
  {
    id: 'tk3', taskNo: '3102871546', title: '伺服驱动器散热设计专题', from: 'manual', status: 'active',
    app: '常见问题', col: '技术解读', freqText: '每周', countText: '2 篇',
    start: '2026-11-10', createdAt: '2026-11-08', next: '2026-11-17',
    topic: '散热设计 / 选型', kw: ['伺服驱动器', '散热设计', '温升'],
    note: '围绕伺服散热高频搜索词持续产出', imgOn: false, mode: 'publish',
    map: ['散热设计', '常见问题', '技术解读', 'termoline.com', '自动匹配'],
    strat: ['geo', 'auth'],
  },
  // 已完成
  {
    id: 'tk4', taskNo: '2088110421', title: '知识百科', from: 'manual', status: 'done',
    app: '企业图册', col: '知识百科', freqText: '仅一次', countText: '1 篇',
    start: '2026-10-21', createdAt: '2026-10-19', next: '',
    topic: '知识百科', kw: ['渣浆泵', '污水泵', '离心泵厂家', '工作原理'],
    note: '一次性知识百科内容，已全部产出', imgOn: false, mode: 'publish',
    map: ['知识百科', '企业图册', '知识百科', 'termoline.com', '自动匹配'],
    strat: ['eeat', 'auth'],
  },
  {
    id: 'tk5', taskNo: '1552009876', title: 'SDPH 系列产品介绍专题', from: 'agent', status: 'done',
    app: '产品管理', col: '产品速递', freqText: '每周', countText: '1 篇',
    start: '2026-08-25', createdAt: '2026-08-23', next: '',
    topic: '产品介绍 / 参数', kw: ['SDPH', '全国产', '大电流'],
    note: '产品介绍系列已完成排产', imgOn: true, mode: 'review',
    map: ['产品介绍', '产品管理', '产品速递', 'termoline.com', '自动匹配'],
    strat: ['eeat', 'geo'],
  },
  // 草稿
  {
    id: 'tk6', taskNo: '8773104520', title: '工业温度传感器校准白皮书解读', from: 'manual', status: 'draft',
    app: '新闻资讯', col: '技术解读', freqText: '每周', countText: '1 篇',
    start: '2026-12-01', createdAt: '2026-08-19', next: '',
    topic: '校准 / 精度', kw: ['温度传感器', '校准', '白皮书'],
    note: '草稿，尚未发布', imgOn: false, mode: 'review',
    map: ['白皮书', '新闻资讯', '技术解读', 'termoline.com', '自动匹配'],
    strat: ['geo'],
  },
  // 未开始
  {
    id: 'tk7', taskNo: '4226819503', title: '全国产运动控制方案专题', from: 'manual', status: 'pending',
    app: '产品管理', col: '行业方案', freqText: '每月', countText: '3 篇',
    start: '2026-12-15', createdAt: '2026-11-17', next: '',
    topic: '运动控制 / 半导体', kw: ['运动控制', '半导体', '全国产'],
    note: '计划未来启动的专题', imgOn: false, mode: 'review',
    map: ['运动控制', '产品管理', '行业方案', 'termoline.com', '自动匹配'],
    strat: ['eeat', 'red'],
  },
]

// 内容（任务产出的结果条 + 历史已发布内容）
export const INITIAL_ITEMS: CalendarItem[] = [
  // 历史已发布内容
  { id: 'cal1', title: 'SDM 系列调试软件使用说明', type: 'prod', date: '2026-09-23', status: 'published', tid: '', strat: ['geo', 'auth'], body: `<h3>软件安装</h3><p>SDM 调试软件支持 Windows 10 / 11，安装前请确认已连接驱动器。</p><h3>参数调试</h3><ul><li>连接方式：USB / RS485</li><li>支持离线参数读写与示波器采样</li></ul>` },
  { id: 'cal_t1', title: 'SDPH 系列全国产大电流型 — 产品介绍', type: 'prod', date: '2026-09-22', status: 'published', tid: '', strat: ['eeat', 'geo'], body: `<h3>产品定位</h3><p>SDPH 系列是全国产大电流伺服驱动器，连续 50A / 峰值 125A，自主可控。</p><h3>核心参数</h3><ul><li>供电：24 ~ 72 VDC</li><li>额定连续电流：50 A</li><li>峰值电流：125 A</li></ul>` },
  { id: 'cal_t2', title: 'PT100 温度传感器选型指南（英文站）', type: 'prod', date: '2026-09-22', status: 'published', tid: '', strat: ['eeat', 'auth'], body: `<h3>选型核心指标</h3><p>PT100 铂电阻是工业测温最常用的元件之一。</p><ul><li>测温范围：-200 ~ +850 ℃</li><li>精度等级：A 级 ±0.15 ℃ / B 级 ±0.30 ℃</li></ul>` },
  // 今日待发布（今天该发，未确认则到期自动发）
  { id: 'cal_t4', title: '全国产运动控制方案（半导体场景）', type: 'case', date: '2026-09-22', status: 'scheduled', tid: '', strat: ['eeat', 'red'], body: `<h3>场景需求</h3><p>半导体设备对运动控制的精度与稳定性要求极高，需要全国产、自主可控的解决方案。</p>` },
  // 已驳回（用户取消发布）
  { id: 'rej1', title: '旧版伺服参数对照表', type: 'prod', date: '2026-09-21', status: 'rejected', tid: '', strat: ['geo'], body: '' },
  // 任务 tk1 产出
  { id: 'n1', title: '伺服散热设计要点', type: 'blog', date: '2026-10-12', status: 'published', tid: 'tk1', strat: ['eeat', 'geo'], body: `<h3>为什么散热决定伺服寿命</h3><p>大电流伺服驱动器在峰值输出时会产生显著热量，散热设计直接影响其长期稳定性。</p>` },
  { id: 'n2', title: '伺服选型对照表', type: 'prod', date: '2026-10-15', status: 'scheduled', tid: 'tk1', strat: ['geo', 'auth'], body: `<h3>选型要点</h3><p>按连续电流、峰值电流与安装空间三个维度给出对照，便于快速定位型号。</p>` },
  { id: 'n3', title: '半导体场景落地方案', type: 'case', date: '2026-10-19', status: 'planned', tid: 'tk1', strat: ['eeat', 'red'], body: '' },
  // 任务 tk2 产出
  { id: 'n4', title: 'PT100 铂电阻误差分析与选型要点', type: 'blog', date: '2026-09-22', status: 'scheduled', tid: 'tk2', strat: ['geo', 'auth'], body: `<h3>误差从哪里来</h3><p>从等级精度、导线电阻到自热效应，逐项拆解 PT100 的误差来源与压降手段。</p>` },
]

// 运营看板：总计数据
export const DASH_STATS = { total: 128, thisWeek: 7, thisMonth: 23, fixed: 11 }

// 发布清单（任务日志）：各任务产出的推送记录
export const PUBLISH_LOGS: PublishLog[] = [
  {
    id: 'lg1', taskId: 'tk1', taskNo: '2122261673', taskName: '10月行业方案内容包',
    kw: '伺服驱动器', topic: '行业方案', contentTitle: '伺服散热设计要点',
    app: '产品中心', expectTime: '2026-10-12', actualTime: '2026-10-12',
    pushStatus: '已推送', updateTime: '2026-10-12',
  },
  {
    id: 'lg2', taskId: 'tk1', taskNo: '2122261673', taskName: '10月行业方案内容包',
    kw: '伺服驱动器', topic: '应用场景', contentTitle: '伺服选型对照表',
    app: '产品中心', expectTime: '2026-10-15', actualTime: '2026-10-15',
    pushStatus: '已推送', updateTime: '2026-10-15',
  },
  {
    id: 'lg3', taskId: 'tk1', taskNo: '2122261673', taskName: '10月行业方案内容包',
    kw: '伺服驱动器', topic: '应用场景', contentTitle: '半导体场景落地方案',
    app: '产品中心', expectTime: '2026-10-19', actualTime: '',
    pushStatus: '待推送', updateTime: '2026-10-16',
  },
  {
    id: 'lg4', taskId: 'tk2', taskNo: '966129152', taskName: '英文站 PT100 选型专题（常见问题）',
    kw: 'PT100', topic: '选型指南', contentTitle: 'PT100 铂电阻误差分析与选型要点',
    app: '博客文章', expectTime: '2026-09-22', actualTime: '',
    pushStatus: '待推送', updateTime: '2026-09-22',
  },
  {
    id: 'lg5', taskId: 'tk3', taskNo: '3102871546', taskName: '伺服驱动器散热设计专题',
    kw: '散热设计', topic: '散热设计', contentTitle: '--',
    app: '常见问题', expectTime: '2026-11-18', actualTime: '',
    pushStatus: '待推送', updateTime: '2026-11-17',
  },
]

// 生产内容策略
export const STRATEGIES: Strategy[] = [
  { key: 'eeat', name: 'EEAT 强化', icon: '🎯', slogan: '让每篇内容有据可依', desc: '补强经验 / 专业 / 权威 / 可信四个维度，附作者资质与数据出处' },
  { key: 'geo', name: 'GEO 4 项', icon: '🧭', slogan: '让 AI 引擎优先引用你', desc: '面向生成式引擎优化：结构清晰、问答对齐、实体明确、引用规范' },
  { key: 'red', name: '红线自检', icon: '🛡️', slogan: '上线前零违规风险', desc: '发布前自动检测并规避违规、敏感表述' },
  { key: 'auth', name: '权威信源', icon: '📚', slogan: '每个结论都可核验', desc: '关键结论附可核验来源，提升可信度' },
]

// 类型标签映射
export const TYPE_LABEL: Record<string, string> = {
  prod: '产品管理',
  blog: '常见问题',
  news: '新闻资讯',
  case: '企业图册',
}

export const TYPE_COLOR: Record<string, string> = {
  prod: '#2563eb',
  blog: '#f59e0b',
  news: '#0ea5e9',
  case: '#a21caf',
}
