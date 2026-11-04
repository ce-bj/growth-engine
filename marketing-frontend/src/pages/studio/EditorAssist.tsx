import { FileText, FormInput, ImageIcon, MoreHorizontal, Package, Plus } from 'lucide-react'
import { BLOCKS, inferKind, mockProductsData } from './blocks'
import { getFormFields } from './formFields'
import type { MarketingGap } from './marketingInspection'
import type { Draft } from './MarketingStudio'

// Edit-page assistance (产品设计 5.5.1): the materials bar lets users add what they skipped on the
// creation page, and the guide tells them what they can ask for in the conversation.

export type MaterialTarget = 'products' | 'formFields' | 'images' | 'documents'
export type MoreTarget = 'intentImport' | 'structure' | 'knowledge' | 'settings'

export function PageMaterials({ draft, gaps, onOpen, onMore }: { draft: Draft; gaps: MarketingGap[]; onOpen: (target: MaterialTarget) => void; onMore: (target: MoreTarget) => void }) {
  const has = (...ids: string[]) => gaps.some(g => ids.some(id => g.id === id || g.id.startsWith(id)))
  const products = mockProductsData.filter(p => draft.productIds.includes(p.id))
  const fields = getFormFields(draft)
  const images = (draft.assets || []).filter(a => a.type === 'image').length + (draft.image ? 1 : 0)
  const documents = (draft.assets || []).filter(a => a.type === 'document').length
  const allDirs = !draft.knowledgeDirs.length || draft.knowledgeDirs.length === 6
  const items: { target: MaterialTarget; label: string; detail: string; missing: boolean; icon: typeof Package }[] = [
    { target: 'products', label: '产品', icon: Package, detail: products.length ? `${products.length} 个` : '未添加', missing: has('product-binding', 'product-specification', 'comparison-') },
    { target: 'formFields', label: '表单', icon: FormInput, detail: fields.length ? `${fields.length} 个字段` : '未设置', missing: has('form-binding') },
    { target: 'images', label: '图片', icon: ImageIcon, detail: images ? `${images} 张` : '未添加', missing: has('hero-image', 'gallery-') },
    { target: 'documents', label: '资料', icon: FileText, detail: documents ? `${documents} 个文档` : allDirs ? '全部目录' : `${draft.knowledgeDirs.length} 个目录`, missing: has('stats-evidence', 'testimonials-evidence') },
  ]
  return <section className="page-materials" aria-label="页面资料">
    <header><span>页面资料 · 随时可补充</span>
      <details className="page-materials-more"><summary aria-label="更多设置"><MoreHorizontal size={14} /></summary><div onClick={e => e.currentTarget.closest('details')?.removeAttribute('open')}>
        <button type="button" onClick={() => onMore('intentImport')}>意图说明</button>
        <button type="button" onClick={() => onMore('structure')}>页面结构与布局</button>
        <button type="button" onClick={() => onMore('knowledge')}>知识目录范围</button>
        <button type="button" onClick={() => onMore('settings')}>高级设置</button>
      </div></details>
    </header>
    <div className="page-materials-grid">{items.map(item => <button type="button" key={item.target} className={item.missing ? 'is-missing' : ''} onClick={() => onOpen(item.target)} title={item.missing ? `页面需要${item.label}，点击补充` : `查看或修改${item.label}`}>
      <item.icon size={15} /><strong>{item.label}</strong><small>{item.missing ? <><Plus size={10} />添加</> : item.detail}</small>
    </button>)}</div>
  </section>
}

export interface Suggestion { label: string; action: 'products' | 'images' | 'prompt'; text?: string; target?: string }

/** Suggestions follow the page state: missing materials first, then common edits; a selection narrows them. */
export function editorSuggestions(draft: Draft, gaps: MarketingGap[], selection: string): Suggestion[] {
  if (selection) return [{ label: '更简洁', action: 'prompt', text: '精简内容' }, { label: '改成指定文字', action: 'prompt', text: '改为：' }]
  const kinds = draft.sections.filter(s => !s.hidden).map(s => s.kind || inferKind(s.title))
  const list: Suggestion[] = []
  if (gaps.some(g => g.id === 'product-binding')) list.push({ label: '补充产品', action: 'products' })
  if (gaps.some(g => g.id === 'hero-image')) list.push({ label: '添加主图', action: 'images' })
  list.push({ label: '首屏更简洁', action: 'prompt', text: '精简内容', target: 'hero:body' })
  if (!kinds.includes('testimonials')) list.push({ label: '加一个客户案例', action: 'prompt', text: '加一个客户案例' })
  if (!kinds.includes('faq')) list.push({ label: '加一个常见问题', action: 'prompt', text: '加一个常见问题' })
  return list.slice(0, 4)
}

export function EditorGuide({ suggestions, onPick }: { suggestions: Suggestion[]; onPick: (s: Suggestion) => void }) {
  return <div className="editor-guide">
    <strong>你可以这样修改页面</strong>
    <p>点右侧任意区域或文字，再在下方说要怎么改；也可以直接说“加一个模块”“换一张图”。缺的产品、表单、图片和资料可在上方补充。</p>
    <div>{suggestions.map(s => <button type="button" key={s.label} onClick={() => onPick(s)}>{s.label}</button>)}</div>
  </div>
}

/** Map a chat request such as “加一个客户案例” to a component kind. */
export function requestedBlock(text: string) {
  const name = text.match(/^(?:加|添加|增加|新增)(?:一个|一段|一组)?(.+?)(?:模块|组件|区域)?$/)?.[1]
  return name ? BLOCKS.find(b => b.label.includes(name) || name.includes(b.label)) : undefined
}
