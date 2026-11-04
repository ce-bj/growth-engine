import type { Draft } from './MarketingStudio'
import type { MarketingGap } from './marketingInspection'
import { mockProductsData, productSpec } from './blocks'
import { draftSection } from './firstDraft'

// Mock of the generation service returning AI completion results (产品设计 5.4): sending the request in the
// conversation is the user's confirmation, so results are applied to the draft right away and reported in
// the chat. Retrieved facts carry their source; anything the service cannot produce stays a gap.

const SOURCE = '企业知识库（示例）'

/** A labelled SVG placeholder standing in for an AI-generated illustration. */
export function aiIllustration(color: string, label = 'AI 示意图') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="560"><rect width="800" height="560" fill="${color}" opacity=".12"/><circle cx="560" cy="250" r="150" fill="${color}" opacity=".28"/><rect x="120" y="170" width="300" height="200" rx="18" fill="${color}" opacity=".4"/><text x="40" y="520" font-family="sans-serif" font-size="26" fill="${color}">${label}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export function applyAiCompletion(d: Draft, gaps: MarketingGap[]): { draft: Draft; done: string[]; pending: string[] } {
  let next: Draft = { ...d, sections: [...d.sections], elementImages: { ...d.elementImages }, productSpecs: { ...d.productSpecs }, optionalFields: { ...d.optionalFields } }
  const done: string[] = [], pending: string[] = []
  const color = d.color || '#314ed8'
  const setBody = (ids: string[], body: string) => { next.sections = next.sections.map(s => ids.includes(s.id) && !s.body.trim() ? { ...s, body, drafted: true } : s) }
  for (const gap of gaps) {
    if (gap.id === 'hero-image') { next = { ...next, image: aiIllustration(color), imageReady: true }; done.push('页面主图（AI 示意图）') }
    else if (gap.id.startsWith('gallery-')) { const id = gap.targetComponentIds[0]; [1, 2, 3].forEach(i => { next.elementImages![`${id}:image${i}`] = aiIllustration(color, `AI 示意图 ${i}`) }); done.push(`${gap.targetLabels?.[0] || '图库'}（AI 示意图）`) }
    else if (gap.id.startsWith('content-')) { next.sections = next.sections.map(s => gap.targetComponentIds.includes(s.id) ? draftSection(next, { ...s, body: '', items: undefined }) : s); done.push(gap.label) }
    else if (gap.id === 'product-binding' || gap.id === 'comparison-products') {
      // Recommend from the authorized catalogue only, preferring products that already have specs.
      const picks = [...mockProductsData].sort((a, b) => Number(!!b.spec) - Number(!!a.spec)).slice(0, 2).map(p => p.id)
      next = { ...next, productIds: [...new Set([...next.productIds, ...picks])] }
      done.push(`关联产品：${mockProductsData.filter(p => picks.includes(p.id)).map(p => p.name).join('、')}`)
    }
    else if (gap.id === 'product-specification' || gap.id === 'comparison-evidence') {
      for (const p of mockProductsData.filter(p => next.productIds.includes(p.id) && !productSpec(next, p))) next.productSpecs![p.id] = `示例规格（来源：${SOURCE}）`
      done.push('产品规格')
    }
    else if (gap.id === 'contact-information') { next.optionalFields!['联系方式'] = `sales@example.com（来源：${SOURCE}）`; done.push('联系方式') }
    else if (gap.id === 'stats-evidence') { setBody(gap.targetComponentIds, `示例数值 · 来源：${SOURCE}`); done.push('实力数据') }
    else if (gap.id === 'testimonials-evidence') { setBody(gap.targetComponentIds, `示例案例：某水利工程项目选用本公司产品完成闸门改造。来源：${SOURCE}`); done.push('客户案例') }
    else if (gap.id === 'form-binding') { next = { ...next, formConfigured: false }; done.push('表单字段（按转化目标推荐）') }
    else pending.push(gap.label)
  }
  const handled = gaps.filter(g => !pending.includes(g.label)).map(g => g.id)
  const aiJobs = Object.fromEntries(Object.entries(next.aiJobs || {}).filter(([id]) => !handled.includes(id)))
  return { draft: { ...next, aiJobs, revision: d.revision + 1 }, done, pending }
}
