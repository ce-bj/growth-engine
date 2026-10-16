// 积分余额 · 模拟数据
// 真实接入时把这里替换为后台接口返回即可。

// 当前剩余积分（初始值，与下方明细末条余额一致）
export const initialBalance = 2480

// 业务类型：消耗类（consume）与充值类（add）
export const creditCategories = [
  { key: 'customs', name: '海关数据', type: 'consume', icon: 'database', color: '#0ea5e9' },
  { key: 'aiready', name: 'AI Ready', type: 'consume', icon: 'sparkles', color: '#9333ea' },
  { key: 'product', name: '产品详情页', type: 'consume', icon: 'file-text', color: '#f59e0b' },
  { key: 'publish', name: 'AI 内容发布', type: 'consume', icon: 'send', color: '#10b981' },
  { key: 'recharge', name: '充值', type: 'add', icon: 'arrow-down-left', color: '#22c55e' },
]

// 积分明细：最新在前。balance 为该笔发生后的剩余积分（按 initialBalance 反推保持一致）
export const creditRecords = [
  { id: 12, time: '2026-10-14 09:12', category: 'customs', note: '查询 HS 编码海关进出口数据（3 次）', change: -120, balance: 2480 },
  { id: 11, time: '2026-10-13 18:05', category: 'publish', note: '发布"六角螺栓 M8×30"英文站产品页', change: -60, balance: 2600 },
  { id: 10, time: '2026-10-13 11:20', category: 'aiready', note: 'AI Ready 全站检测（品牌一致性）', change: -200, balance: 2660 },
  { id: 9, time: '2026-10-12 15:48', category: 'product', note: '生成"膨胀锚栓 M12"详情页 AI 内容', change: -150, balance: 2860 },
  { id: 8, time: '2026-10-12 10:30', category: 'customs', note: '导出"螺母类"年度进出口报表', change: -180, balance: 3010 },
  { id: 7, time: '2026-10-11 14:22', category: 'publish', note: '批量发布 5 条产品动态到社交平台', change: -100, balance: 3190 },
  { id: 6, time: '2026-10-10 09:50', category: 'recharge', note: '购买积分套餐（1,000 积分）', change: 1000, balance: 3290 },
  { id: 5, time: '2026-10-09 17:33', category: 'aiready', note: 'AI Ready 内容可信性检测', change: -200, balance: 2290 },
  { id: 4, time: '2026-10-09 13:10', category: 'product', note: '优化"平垫圈 D16"详情页（AI 改写）', change: -120, balance: 2490 },
  { id: 3, time: '2026-10-08 16:05', category: 'customs', note: '查询"锚栓"目标市场进口商名录', change: -150, balance: 2610 },
  { id: 2, time: '2026-10-08 10:40', category: 'publish', note: '发布"法兰螺母 M10"西班牙语站产品页', change: -60, balance: 2760 },
  { id: 1, time: '2026-10-07 14:18', category: 'aiready', note: 'AI Ready 可读性检测（首检）', change: -200, balance: 2820 },
]

// 充值套餐（积分值），价格按 0.1 元/积分 计算
export const rechargePackages = [500, 1000, 2000, 5000]
