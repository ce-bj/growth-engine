import type { Draft, Section, SectionItem } from './MarketingStudio'
import { inferKind, mockProductsData, type BlockKind } from './blocks'
import { mockTemplatesData } from './templates'

// Mock of the first-draft rules (产品设计 3.3 / 6.4): expression-class copy is drafted from the
// requirement and site profile; facts, assets and data stay empty so the inspection marks them as gaps.
// Visitor-visible copy follows the page language; only 中文 and English are illustrated here.

type Lang = { language?: string }
const en = (d: Lang) => d.language === 'English'

const GOAL_LABELS: Record<string, string> = { 获取报价: 'Request a quote', 预约沟通: 'Book a call', 领取资料: 'Get the guide', 发起咨询: 'Contact us', 提交需求: 'Submit your needs', 活动报名: 'Register now' }
const FIELD_LABELS: Record<string, string> = { 姓名: 'Name', 邮箱: 'Email', 电话: 'Phone', 公司: 'Company', 职位: 'Job title', '国家/地区': 'Country/Region', 采购量: 'Quantity', 需求说明: 'Requirements', 预约日期: 'Preferred date' }

export const ctaLabel = (d: Lang & { goal: string }, goal = d.goal) => en(d) ? GOAL_LABELS[goal] || goal : goal
export const fieldLabel = (d: Lang, field: string) => en(d) ? FIELD_LABELS[field] || field : field

export const pageCopy = (d: Lang) => en(d)
  ? { contact: 'Contact', footerKicker: 'Next step', footerTitle: 'Start with a conversation.', contactPending: 'Contact details pending', formSent: 'Submitted (demo). Nothing was sent to a business system.', formNote: 'Demo form, no real data is sent', pendingRegion: 'Content for this section is being completed', learnMore: 'Learn more', productSpecPending: 'Specification pending' }
  : { contact: '联系我们', footerKicker: '下一步', footerTitle: '从一次交流开始。', contactPending: '联系方式待补充', formSent: '提交成功（演示）。信息未发送到业务系统。', formNote: '演示表单，不发送真实数据', pendingRegion: '此区域内容待完善', learnMore: '了解产品', productSpecPending: '规格待补充' }

const EYEBROWS: Record<string, [string, string]> = { 产品营销: ['产品方案', 'Product solutions'], 线索获取: ['需求评估', 'Needs assessment'], 品牌介绍: ['关于我们', 'About us'], 促销活动: ['采购专题', 'Procurement program'], 展会页面: ['展会邀请', 'Exhibition invitation'] }

function context(d: Draft) {
  const selected = mockProductsData.filter(p => d.productIds.includes(p.id)).map(p => p.name)
  const products = (selected.length ? selected : d.business.split(/[、，,]/).filter(Boolean)).slice(0, 2).join('、') || d.company
  const audience = d.optionalFields['目标买家画像']?.trim() || d.need.match(/面向([^，。,]+)/)?.[1] || '项目采购团队'
  const type = d.templateDefaults?.type || d.optionalFields['_pageType'] || mockTemplatesData.find(t => t.id === d.templateId)?.type || '产品营销'
  return { products, audience, type }
}

const GOAL_SENTENCES: Record<string, string> = { 获取报价: '提交需求即可获取报价', 预约沟通: '可预约专人沟通', 领取资料: '填写信息即可领取资料', 发起咨询: '欢迎随时发起咨询', 提交需求: '提交需求，获得针对性的方案建议', 活动报名: '在线报名即可参与' }

function heroCopy(d: Draft) {
  const { products, audience, type } = context(d)
  if (en(d)) return {
    title: `${d.company}: solutions you can specify with confidence`,
    subtitle: `For ${audience === '项目采购团队' ? 'project procurement teams' : audience}. See where our products fit and how we support you. ${GOAL_LABELS[d.goal] || ''}.`,
    eyebrow: EYEBROWS[type]?.[1] || 'Solutions', trustPoints: ['Selection guided by your needs', 'A dedicated contact for follow-up'],
  }
  const titles: Record<string, string> = { 产品营销: `${products}，从选型到交付的一站式支持`, 线索获取: `把你的${products}需求，交给专业团队评估`, 品牌介绍: `${d.company}，专注${products}`, 促销活动: `${products}采购专题`, 展会页面: `与${d.company}在展会现场面对面` }
  return {
    title: titles[type] || titles.产品营销,
    subtitle: `面向${audience}，介绍${products}的适用场景与服务方式，${GOAL_SENTENCES[d.goal] || '欢迎联系我们'}。`,
    eyebrow: EYEBROWS[type]?.[0] || '解决方案', trustPoints: ['按需求沟通选型', '专人跟进需求'],
  }
}

function sectionCopy(d: Draft, s: Section, kind: BlockKind): Pick<Section, 'body' | 'items'> | null {
  const { products, audience, type } = context(d)
  const item = (title: string, text: string): SectionItem => ({ title, text })
  if (en(d)) {
    if (kind === 'text') return { body: `How our products fit the needs of ${audience === '项目采购团队' ? 'project teams' : audience}, and how we work with you from enquiry to delivery.` }
    if (kind === 'features') return { body: '', items: [item('Needs review', 'We start from your project background and operating conditions.'), item('Recommendation', 'We suggest suitable products and configurations.'), item('Ongoing support', 'We stay in contact through delivery and installation.')] }
    if (kind === 'timeline') return { body: '', items: [item('Talk to us', 'Share your requirements.'), item('Confirm the plan', 'Agree on products and configuration.'), item('Delivery support', 'We coordinate delivery details with you.')] }
    if (kind === 'faq') return { body: '', items: [item('How do I choose the right product?', 'Describe your application in the form and we will suggest options.'), item('What should I prepare before contacting you?', 'Project background, operating conditions and estimated quantity help us respond faster.'), item('How can I reach the team?', 'Submit the form on this page; contact details are in the footer.')] }
    if (kind === 'products') return { body: 'Selection and configuration can be discussed for your project.' }
    if (kind === 'form') return { body: 'Leave your details and needs, and our team will get back to you.' }
    if (kind === 'cta') return { body: `${GOAL_LABELS[d.goal] || 'Contact us'} to get started.` }
    return null
  }
  if (kind === 'text') return { body: `${s.title}：结合${audience}关注的问题，说明${products}的适用方向与合作方式，帮助判断是否符合自身需求。` }
  if (kind === 'features') return { body: '', items: [item('需求沟通', `了解项目背景与使用条件，明确${products}的选型方向。`), item('方案建议', '结合沟通结果，整理产品与配置建议。'), item('持续支持', '在交付与使用过程中保持沟通，协助解决技术问题。')] }
  if (kind === 'timeline') return { body: '', items: type === '展会页面'
    ? [item('到场交流', '在展位了解产品与应用方向。'), item('产品展示', '现场查看展品并沟通需求。'), item('预约洽谈', '预约专人深入沟通合作细节。')]
    : [item('需求沟通', '说明项目背景与使用需求。'), item('方案确认', '确认产品选型与配置方案。'), item('交付支持', '协同推进交付与安装事项。')] }
  if (kind === 'faq') return { body: '', items: [item(`如何选择适合的${products}？`, '可在表单中说明使用场景和需求，团队会结合实际情况给出选型建议。'), item('咨询前需要准备哪些信息？', '建议准备项目背景、使用环境和大致需求量，便于更快给出建议。'), item('如何联系团队？', '通过本页表单提交信息即可，联系方式见页面底部。')] }
  if (kind === 'products') return { body: '可按项目需求沟通选型与配置。' }
  if (kind === 'form') return { body: '留下联系方式和需求，团队会尽快与你联系。' }
  if (kind === 'cta') return { body: `${GOAL_SENTENCES[d.goal] || '欢迎联系我们'}。` }
  return null
}

/** Draft one component added through the conversation (manual adds stay empty, 提示词 6.3). */
export function draftSection(d: Draft, s: Section): Section {
  const copy = sectionCopy(d, s, s.kind || inferKind(s.title))
  return copy ? { ...s, ...copy, drafted: true } : s
}

/** Draft hero and expression-class sections; sections that already have content are kept. */
export function draftExpressionContent(d: Draft): Draft {
  const template = mockTemplatesData.find(t => t.id === d.templateId)
  const hero = heroCopy(d)
  const keepTitle = d.title.trim() && d.title !== template?.headline
  const sections = d.sections.map(s => {
    if (s.hidden || s.body.trim() || s.items?.length) return s
    const copy = sectionCopy(d, s, s.kind || inferKind(s.title))
    return copy ? { ...s, ...copy, drafted: true } : s
  })
  return { ...d, title: keepTitle ? d.title : hero.title, subtitle: hero.subtitle, eyebrow: hero.eyebrow, trustPoints: hero.trustPoints, sections }
}
