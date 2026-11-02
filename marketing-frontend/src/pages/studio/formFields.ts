import { FIELD_SETS, FORM_FIELDS } from './blocks'

type FormDraft = { goal: string; formConfigured: boolean; formFields: string[]; formGuidance?: string }

const aliases: Record<string, string[]> = {
  姓名: ['姓名', '名字'], 邮箱: ['邮箱', '电子邮件'], 电话: ['电话', '手机号', '联系电话'],
  公司: ['公司', '企业名称'], 职位: ['职位', '职务'], '国家/地区': ['国家/地区', '地区', '国家'],
  采购量: ['采购量', '采购数量'], 需求说明: ['需求说明', '需求描述'], 预约日期: ['预约日期', '预约时间'],
}

export function getFormFields(draft: FormDraft): string[] {
  if (draft.formConfigured) return draft.formFields.filter(field => FORM_FIELDS.includes(field)).slice(0, 6)
  const preset = draft.goal === '活动报名' ? '活动报名' : draft.goal === '领取资料' ? '资料领取' : draft.goal === '获取报价' ? '采购询价' : '基础联系'
  const fields = [...FIELD_SETS[preset]]
  const guidance = (draft.formGuidance || '').slice(0, 120)
  if (!guidance.trim()) return fields
  for (const field of FORM_FIELDS) {
    const names = aliases[field] || [field]
    const mentioned = names.some(name => guidance.includes(name))
    if (!mentioned) continue
    const removed = names.some(name => new RegExp(`(?:不要|去掉|移除|无需|不收集|不需要)\\s*(?:填写|收集)?\\s*${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(guidance))
    if (removed) {
      const index = fields.indexOf(field)
      if (index >= 0 && fields.length > 1) fields.splice(index, 1)
    } else if (!fields.includes(field) && fields.length < 6) fields.push(field)
  }
  return fields
}
