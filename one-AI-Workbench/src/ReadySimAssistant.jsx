import { useEffect, useRef, useState } from 'react'
import { lookupSimProduct } from './ProductDetailGap.jsx'
import { SIM_SESSIONS_EVENT, loadSimSessions, removeSimSession } from './readySimStore.js'
import './ready-sim.css'

const CAPABILITIES = [
  ['发布产品', '帮我发布产品'],
  ['发布内容', '帮我发布内容'],
  ['修改内容', '帮我修改内容'],
  ['商机挖掘', '帮我挖掘客户'],
  ['邮件营销', '帮我生成邮件'],
  ['创建内容发布计划', '帮我创建发布内容计划'],
  ['生成智能营销页', '帮我生成智能营销页'],
  ['查找替换内容', '帮我查找并替换内容'],
  ['查看运营数据', '帮我查看运营数据'],
  ['辅助配置消息提醒', '帮我配置消息提醒'],
  ['辅助配置运营报告', '帮我配置运营报告'],
]

const INITIAL_HISTORY = [
  '我没客户怎么办',
  '创建内容发布产品（帮我创建发布内容计划）',
  '邮件营销',
  '帮我找客户',
  '帮我发布一篇新闻',
  '我需要最近一个月网站访问数据',
  '帮我设置每周一、周三、周五更新',
  '帮我设置每周一、周三、周五更新',
  '帮我写一篇关于有机肥料的新闻',
  '帮我写一篇产品介绍',
  '产品怎么上传',
  '帮我把',
  '帮我生成新闻',
  'AI工作台',
  '帮我把',
  '帮我发布新闻内容',
  '发布产品',
  '发布产品 律所服务 民事诉讼的咨询',
]

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="8.5" cy="10" r="1.3" fill="currentColor" />
      <path d="M7 16.5l3.2-3.2 2.2 2.1 2.1-2.4L18 16.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}

const PRODUCT_MODULES = [
  ['产品规格参数列表', '规格参数表'],
  ['产品功能性能介绍', '功能性能介绍'],
  ['应用场景使用案例', '使用场景'],
  ['行业解决方案', '行业解决方案'],
  ['技术原理工艺流程', '工艺流程'],
  ['安装使用指南', '安装使用指南'],
  ['维护保养指南', '维护保养'],
  ['安全注意事项', '安全注意事项'],
  ['售后服务承诺', '售后服务承诺'],
  ['包装与物流信息', '包装与物流'],
  ['环保可持续性说明', '环保说明'],
  ['常见问题FAQ', '常见问题 FAQ'],
]

const CATEGORY_FOCUS = {
  bolt: '规格、强度与适用装配场景',
  nut: '规格、锁紧特点与适用装配场景',
  washer: '规格、配套用途与适用装配场景',
}

function parseProductRequest(message) {
  const source = String(message || '')
  const head = source.match(/^帮我把(\S+)的产品按(?:「([^」]+)」行业规范|通用行业规范)优化下，/)
  if (!head) return null
  const url = head[1]
  const industry = head[2] || '通用'
  const ruleAt = source.indexOf('写进产品详情时，')
  const body = source.slice(head[0].length, ruleAt >= 0 ? ruleAt : source.length)
  const marks = PRODUCT_MODULES.map(([full, short]) => ({ full, short, at: body.indexOf(`${full}。`) }))
    .filter((item) => item.at >= 0)
    .sort((a, b) => a.at - b.at)
  const modules = marks.map((item, index) => {
    const start = item.at + item.full.length + 1
    const end = index + 1 < marks.length ? marks[index + 1].at : body.length
    const chunk = body.slice(start, end)
    const suggestion = (chunk.match(/建议：([^。]*)/) || [])[1] || ''
    return { short: item.short, kept: suggestion.includes('保持原内容不变'), suggestion }
  })
  const idMatch = url.match(/\/products\/([^/?#]+)/)
  return { url, industry, productId: idMatch ? decodeURIComponent(idMatch[1]) : '', modules }
}

function buildProductReply(session) {
  const parsed = parseProductRequest(session.message)
  const brief = lookupSimProduct(parsed?.productId || session.productId || '')
  const name = session.productName || brief?.name || '该产品'
  const url = parsed?.url || session.productUrl || ''
  const industry = parsed?.industry || '通用'
  const modules = parsed?.modules || []
  const added = modules.filter((item) => !item.kept && item.suggestion.includes('新增')).map((item) => item.short)
  const expanded = modules.filter((item) => !item.kept && !item.suggestion.includes('新增')).map((item) => item.short)
  const kept = modules.filter((item) => item.kept).map((item) => item.short)
  const focus = CATEGORY_FOCUS[brief?.category] || '规格、用途与适用场景'
  const imageTotal = brief?.imageTotal || 0
  const where = url ? `，详情页 ${url}` : ''
  const clauses = [
    added.length ? `新增了${added.join('、')}` : '',
    expanded.length ? `优化扩写了${expanded.join('、')}` : '',
    kept.length ? `保持原内容不变的有${kept.join('、')}` : '',
  ].filter(Boolean)
  return {
    locate: `已定位到该产品「${name}」${where}。原标题为「${name}」。我已按${industry === '通用' ? '通用行业规范' : `「${industry}」行业规范`}准备优化。`,
    name,
    summary: `将生成 80–120 字 SEO 摘要，概述${name}的${focus}`,
    added,
    expanded,
    kept,
    images: imageTotal
      ? `原详情含 ${imageTotal} 张图片，将全部保留，不新增配图`
      : '原详情无配图，不新增配图',
    done: `更新成功。已更新产品「${name}」${where}。该产品已优化完成，内容已覆盖并发布到线上。`,
    detail: `本次优化按【${industry}】行业标准，为「${name}」${clauses.join('，') || '完成了详情优化'}。全部采用带内联样式的 SEO 富文本 HTML 结构。`,
  }
}

function ProductReply({ session }) {
  const reply = buildProductReply(session)
  return (
    <div className="ready-sim__bubble is-ai">
      <p>{reply.done}</p>
      <p>{reply.detail}</p>
      <p>如需调整，请在编辑页手动修改后再次发布；退出取消不会自动还原上一版。</p>
      <p>{reply.locate}</p>
      <p className="ready-sim__plan-title">优化方案如下：</p>
      <ul className="ready-sim__plan">
        <li>标题：原样沿用「{reply.name}」</li>
        <li>摘要：{reply.summary}</li>
        <li>
          正文结构优化：
          <ul>
            {reply.added.length ? <li>新增：{reply.added.join('、')}</li> : null}
            {reply.expanded.length ? <li>优化扩写：{reply.expanded.join('、')}</li> : null}
            {reply.kept.length ? <li>保持原内容不变：{reply.kept.join('、')}</li> : null}
            <li>升级为带内联样式的 SEO 富文本 HTML 结构（卡片式 section、规格表格、FAQ 卡片）</li>
            <li>配图：{reply.images}</li>
          </ul>
        </li>
      </ul>
    </div>
  )
}

function ReplaceThread({ session, notes }) {
  if (session.kind === 'product' || !session.rows) {
    return (
      <div className="ready-sim__thread">
        <div className="ready-sim__bubble is-user">{session.message}</div>
        <ProductReply session={session} />
        {notes.map((item, index) => (
          <div key={`${item.text}-${index}`} className="ready-sim__bubble is-user">
            {item.text || '（仅上传了图片）'}
            {item.fileName ? <small>{item.fileName}</small> : null}
          </div>
        ))}
      </div>
    )
  }
  const status = sessionStatus(session)
  const summary = session.failed
    ? '本次查找替换失败。有一处没有替换成功，整次任务都没有生效。'
    : '替换已经开始，下面每一处都替换成功。'
  return (
    <div className="ready-sim__thread">
      <div className="ready-sim__bubble is-user">{session.message}</div>
      <div className="ready-sim__bubble is-ai">
        <p>{summary}</p>
        <div className="ready-sim__table-wrap">
          <table className="ready-sim__table">
          <thead>
            <tr>
              <th>原关键词</th>
              <th>所在URL</th>
              <th>替换状态</th>
            </tr>
          </thead>
          <tbody>
            {session.rows.map((row, index) => (
              <tr key={`${index}-${row.keyword}-${row.url}`}>
                <td>{row.keyword}</td>
                <td>{row.url || '—'}</td>
                <td>
                  <span className={`ready-sim__status is-${status === '成功' ? 'ok' : 'fail'}`}>{status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
      {notes.map((item, index) => (
        <div key={`${item.text}-${index}`} className="ready-sim__bubble is-user">
          {item.text || '（仅上传了图片）'}
          {item.fileName ? <small>{item.fileName}</small> : null}
        </div>
      ))}
    </div>
  )
}

function sessionStatus(session) {
  return session.failed ? '失败' : '成功'
}

export default function ReadySimAssistant({ onBack }) {
  const [sessions, setSessions] = useState(loadSimSessions)
  const [history, setHistory] = useState(INITIAL_HISTORY)
  const [activeId, setActiveId] = useState(() => loadSimSessions()[0]?.id || null)
  const [staticKey, setStaticKey] = useState(null)
  const [menuKey, setMenuKey] = useState(null)
  const [draft, setDraft] = useState('')
  const [fileName, setFileName] = useState('')
  const [sent, setSent] = useState([])
  const [notes, setNotes] = useState({})
  const fileRef = useRef(null)
  const menuRef = useRef(null)
  const active = sessions.find((item) => item.id === activeId) || null

  useEffect(() => {
    function sync() {
      setSessions(loadSimSessions())
    }
    window.addEventListener(SIM_SESSIONS_EVENT, sync)
    return () => window.removeEventListener(SIM_SESSIONS_EVENT, sync)
  }, [])

  useEffect(() => {
    if (menuKey === null) return undefined
    function onPointer(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuKey(null)
    }
    window.addEventListener('pointerdown', onPointer)
    return () => window.removeEventListener('pointerdown', onPointer)
  }, [menuKey])

  function send() {
    const text = draft.trim()
    if (!text && !fileName) return
    if (active) {
      setNotes((current) => ({ ...current, [active.id]: [...(current[active.id] || []), { text, fileName }] }))
    } else {
      setSent((current) => [...current, { text, fileName }])
      setHistory((current) => [text || fileName, ...current])
    }
    setDraft('')
    setFileName('')
  }

  function openFresh() {
    setActiveId(null)
    setStaticKey(null)
    setDraft('')
    setFileName('')
    setSent([])
    setMenuKey(null)
  }

  return (
    <div className="ready-sim">
      <aside className="ready-sim__side">
        <div className="ready-sim__side-top">
          <button type="button" className="ready-sim__old" onClick={onBack}>
            <span aria-hidden="true">‹</span>
            进入旧版
          </button>
          <button type="button" className="ready-sim__menu" aria-label="菜单">
            <MenuIcon />
          </button>
        </div>
        <button type="button" className="ready-sim__new" onClick={openFresh}>
          <span>+</span>
          新对话
        </button>
        <div className="ready-sim__label">历史对话</div>
        <div className="ready-sim__list">
          {sessions.map((session) => (
            <div key={session.id} className={`ready-sim__item${active?.id === session.id ? ' is-on' : ''}`}>
              <button type="button" className="ready-sim__item-title" title={session.title} onClick={() => { setActiveId(session.id); setStaticKey(null) }}>
                {session.title}
              </button>
              <button
                type="button"
                className="ready-sim__more"
                aria-label={`${session.title} 的更多操作`}
                onClick={() => setMenuKey(menuKey === session.id ? null : session.id)}
              >
                ···
              </button>
              {menuKey === session.id ? (
                <div className="ready-sim__pop" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => {
                      removeSimSession(session.id)
                      setSessions(loadSimSessions())
                      if (activeId === session.id) setActiveId(null)
                      setMenuKey(null)
                    }}
                  >
                    删除
                  </button>
                </div>
              ) : null}
            </div>
          ))}
          {history.map((title, index) => {
            const key = `static-${index}`
            return (
              <div key={`${title}-${index}`} className={`ready-sim__item${staticKey === key ? ' is-on' : ''}`}>
                <button type="button" className="ready-sim__item-title" title={title} onClick={() => { setActiveId(null); setStaticKey(key) }}>
                  {title}
                </button>
                <button type="button" className="ready-sim__more" aria-label={`${title} 的更多操作`} onClick={() => setMenuKey(menuKey === key ? null : key)}>
                  ···
                </button>
                {menuKey === key ? (
                  <div className="ready-sim__pop" ref={menuRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setHistory((current) => current.filter((_, itemIndex) => itemIndex !== index))
                        if (staticKey === key) setStaticKey(null)
                        setMenuKey(null)
                      }}
                    >
                      删除
                    </button>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </aside>
      <section className="ready-sim__main">
        {active ? (
          <ReplaceThread session={active} notes={notes[active.id] || []} />
        ) : (
          <div className="ready-sim__welcome">
            <p>Hi~我是您的专属运营助手，我可以帮您</p>
            <ul>
              {CAPABILITIES.map(([name, sample]) => (
                <li key={name}>
                  {name}（{sample}）
                </li>
              ))}
            </ul>
            <p>有什么需要我操作的，向我提问吧！</p>
            {sent.length ? (
              <div className="ready-sim__sent">
                {sent.map((item, index) => (
                  <p key={`${item.text}-${index}`}>
                    {item.text || '（仅上传了图片）'}
                    {item.fileName ? <small>{item.fileName}</small> : null}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        )}
        <div className="ready-sim__composer">
          {fileName ? (
            <div className="ready-sim__file">
              <span>{fileName}</span>
              <button type="button" onClick={() => setFileName('')}>
                移除
              </button>
            </div>
          ) : null}
          <textarea
            value={draft}
            placeholder="可以描述任务或提问问题"
            rows={3}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                send()
              }
            }}
          />
          <div className="ready-sim__composer-bar">
            <button type="button" className="ready-sim__image" aria-label="上传图片" onClick={() => fileRef.current?.click()}>
              <ImageIcon />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => {
                const file = event.target.files && event.target.files[0]
                setFileName(file ? file.name : '')
                event.target.value = ''
              }}
            />
            <button type="button" className="ready-sim__send" aria-label="发送" disabled={!draft.trim() && !fileName} onClick={send}>
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path d="M12 18V7M7.5 11.5L12 6.5l4.5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
