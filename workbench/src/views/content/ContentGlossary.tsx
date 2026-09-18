import { Languages, Search, Sparkles, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '../../components/Button'
import type { ContentLocale, GlossaryTerm } from '../../types'
import { getGlossaryStatus, GlossaryStatusBadge } from './ContentPrimitives'

export function ContentGlossary({ terms, locales, highlightTerms = [], onClose, onUpdateTranslation, onSyncKnowledge }: {
  terms: GlossaryTerm[]
  locales: ContentLocale[]
  /** 从工作台跳转过来时需要重点提示的术语 */
  highlightTerms?: string[]
  onClose: () => void
  onUpdateTranslation: (termId: string, localeCode: string, value: string) => void
  onSyncKnowledge: () => void
}) {
  const [keyword, setKeyword] = useState('')
  const [onlyIncomplete, setOnlyIncomplete] = useState(highlightTerms.length > 0)

  const rows = useMemo(() => terms.map((term) => ({ term, status: getGlossaryStatus(term, locales) })), [terms, locales])
  const filtered = rows.filter(({ term, status }) => {
    const query = keyword.trim().toLowerCase()
    return (!onlyIncomplete || status !== 'ready')
      && (!query || [term.term, term.category, term.definition].some((value) => value.toLowerCase().includes(query)))
  })

  const missingCount = rows.filter((row) => row.status !== 'ready').length

  return <div className="drawer-root" role="dialog" aria-modal="true" aria-label="术语与翻译配置">
    <button type="button" className="drawer-mask" aria-label="关闭" onClick={onClose} />
    <aside className="drawer-panel content-glossary-drawer">
      <div className="drawer-header">
        <div><div className="muted" style={{ marginBottom: 4 }}>内容运营 · 全球站配置</div><h2 className="drawer-title"><Languages size={18} />术语与翻译</h2></div>
        <button type="button" className="drawer-close" onClick={onClose} aria-label="关闭"><X size={18} /></button>
      </div>

      <div className="drawer-body content-glossary-body">
        <div className="content-note"><Sparkles size={16} /><p>母稿生成与多语言站点发布都会引用这里的译名。译名缺失时，母稿会保留中文原词并在「母稿生产」结果页提示补充。</p></div>

        {highlightTerms.length > 0 && <div className="content-glossary-highlight">
          <b>当前内容有 {highlightTerms.length} 个专业名词缺少译名</b>
          <div>{highlightTerms.map((item) => <em key={item}>{item}</em>)}</div>
        </div>}

        <div className="content-glossary-toolbar">
          <span className="content-search"><Search size={14} /><input className="form-input" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="术语 / 分类 / 定义" /></span>
          <label className="content-glossary-toggle"><input type="checkbox" checked={onlyIncomplete} onChange={(e) => setOnlyIncomplete(e.target.checked)} />只看译名不完整（{missingCount}）</label>
        </div>

        <div className="table-wrap"><table className="content-data-table content-glossary-table"><thead><tr>
          <th>专业名词</th>{locales.map((locale) => <th key={locale.code}>{locale.label}</th>)}<th>状态</th>
        </tr></thead><tbody>
          {filtered.length === 0 ? <tr><td colSpan={locales.length + 2} className="content-empty-row">没有匹配的术语。</td></tr> : filtered.map(({ term, status }) => <tr key={term.id} className={highlightTerms.includes(term.term) ? 'is-highlight' : ''}>
            <td><b>{term.term}</b><span>{term.category} · 更新于 {term.updatedAt}</span><p>{term.definition}</p></td>
            {locales.map((locale) => <td key={locale.code}>
              <input className={`form-input content-glossary-input ${term.translations[locale.code]?.trim() ? '' : 'is-empty'}`} value={term.translations[locale.code] ?? ''} placeholder="待补充译名" onChange={(e) => onUpdateTranslation(term.id, locale.code, e.target.value)} />
            </td>)}
            <td><GlossaryStatusBadge status={status} /></td>
          </tr>)}
        </tbody></table></div>
      </div>

      <div className="drawer-footer">
        <Button onClick={onClose}>完成配置</Button>
        <Button variant="secondary" onClick={onSyncKnowledge}><Sparkles size={14} />同步到知识库</Button>
      </div>
    </aside>
  </div>
}
