import { useEffect, useMemo, useRef, useState } from 'react'

const CHECKED = 100
const FAILED = 0

const BOLTS = [
  '六角螺栓 M8×30',
  '膨胀螺栓 M10×80',
  '内六角螺栓 M6×20',
  '马车螺栓 M10×40',
  '地脚螺栓 M16×200',
  '双头螺栓 M12×60',
  '吊环螺栓 M8',
  'U型螺栓 M10',
  '方头螺栓 M12×40',
  '活节螺栓 M8×50',
  '沉头螺栓 M6×25',
  '半圆头螺栓 M8×20',
  'T型螺栓 M10×30',
  '铰链螺栓 M8×35',
  '法兰螺栓 M10×25',
  '不锈钢螺栓 M8×40',
  '高强度螺栓 M16×60',
  '化学锚栓 M12×110',
  '膨胀钩 M8',
  '止动螺栓 M6×16',
  '蝶形螺栓 M6',
  '焊接螺栓 M8×20',
  '台阶螺栓 M10×45',
  '防松螺栓 M12×35',
]

const NUTS = [
  '法兰螺母 M12',
  '六角螺母 M8',
  '尼龙锁紧螺母 M10',
  '盖形螺母 M8',
  '焊接螺母 M6',
  '蝶形螺母 M8',
  '开槽螺母 M12',
  '法兰尼龙螺母 M10',
  '四方螺母 M8',
  '高螺母 M12',
  '薄螺母 M8',
  '防松螺母 M10',
  '铆螺母 M6',
  '铜螺母 M8',
  '尼龙螺母 M6',
  '六角法兰螺母 M16',
  '锁紧螺母 M20',
  '盖形螺母 M10',
]

const WASHERS = [
  '平垫圈 M8',
  '弹垫圈 M8',
  '平垫圈 M10',
  '弹垫圈 M10',
  '鞍形垫圈 M8',
  '方斜垫圈 M12',
  '止动垫圈 M10',
  '波形垫圈 M8',
  '齿形垫圈 M6',
  '球面垫圈 M12',
  '锥形垫圈 M16',
  '加大平垫 M10',
  '绝缘垫圈 M8',
  '铜垫圈 M6',
  '尼龙垫圈 M8',
  '密封垫圈 M12',
  '平垫圈 M16',
  '弹垫圈 M12',
]

const CATEGORY_LABEL = { bolt: '螺栓', nut: '螺母', washer: '垫圈' }

function buildCatalog() {
  const groups = [
    ['bolt', BOLTS],
    ['nut', NUTS],
    ['washer', WASHERS],
  ]
  return groups.flatMap(([category, names]) => names.map((name, index) => ({ id: `${category}-${index}`, name, category })))
}

const CATALOG = buildCatalog()
const BY_ID = Object.fromEntries(CATALOG.map((item) => [item.id, item]))

const ISSUES = {
  'bolt-0': {
    direct: [{ id: 'scene', name: '应用场景', reason: '只写了「广泛应用于各行业」，没有具体工况' }],
    specReason: '整页没有规格，看不出哪项对应哪个值',
  },
  'bolt-1': {
    direct: [{ id: 'install', name: '安装与使用', reason: '只写了「按说明书使用」，步骤少于 3 个' }],
  },
  'nut-0': {
    direct: [
      { id: 'perf', name: '功能性能', reason: '只有产品名称和「品质可靠」，没有功能说明' },
      { id: 'faq', name: '常见问题', reason: '整页没有问答，抽不出可引用的答案' },
    ],
    specReason: '只有表头，没有数值',
  },
}

const FILE_ACCEPT = '.pdf,.xls,.xlsx,.doc,.docx,.jpg,.jpeg,.png'

const SHARED = [
  {
    id: 'service',
    name: '售后服务',
    lead: '这些产品的页面上，还没有可核验的保修范围、期限或响应方式。',
    placeholder: '建议写清保修范围、保修期限、响应方式。例如：非人为损坏的产品本体，出厂之日起 12 个月，工作日 24 小时内回复',
    applies: () => true,
  },
  {
    id: 'pack',
    name: '包装与物流',
    lead: '垫圈这组产品没有可核验的包装方式或交付信息。螺栓和螺母的页面上已经写了。',
    placeholder: '建议写清包装方式、运输或交付信息。例如：纸箱每箱 500 件，国内汽运，款到 7 日内发货',
    applies: (product) => product.category === 'washer',
  },
]

const SPEC_PLACEHOLDER = '建议至少写两项名称和对应数值。例如：直径 8 mm，长度 30 mm'

function emptyDraft(ids) {
  const categories = {}
  ids.forEach((id) => {
    categories[BY_ID[id].category] = true
  })
  return { text: '', fileName: '', mode: 'all', categories, picked: {}, query: '' }
}

function evidenceText(item) {
  if (!item) return ''
  return [item.text, item.fileName ? `附件 ${item.fileName}` : ''].filter(Boolean).join(' · ')
}

export default function ProductDetailGap({ detecting, onResolved }) {
  const [supplied, setSupplied] = useState({})
  const [optimized, setOptimized] = useState({})
  const [editing, setEditing] = useState(null)
  const [draft, setDraft] = useState(() => emptyDraft([]))
  const [namesOpen, setNamesOpen] = useState({})
  const [productForm, setProductForm] = useState(null)
  const [productDraft, setProductDraft] = useState({ text: '', fileName: '' })
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [evidenceOpen, setEvidenceOpen] = useState({})
  const reported = useRef(false)
  const onResolvedRef = useRef(onResolved)
  onResolvedRef.current = onResolved

  function materialStatus(productId, moduleId) {
    if (optimized[productId]?.[moduleId]) return 'done'
    if (supplied[productId]?.[moduleId]) return 'supplied'
    return 'pending'
  }

  function directLeft(productId) {
    return (ISSUES[productId]?.direct || []).filter((item) => !optimized[productId]?.[item.id])
  }

  function sensitiveLeft(product) {
    const rows = []
    SHARED.forEach((shared) => {
      if (!shared.applies(product)) return
      const status = materialStatus(product.id, shared.id)
      if (status === 'done') return
      rows.push({
        id: shared.id,
        name: shared.name,
        status,
        reason: '还没有可核验事实',
        placeholder: shared.placeholder,
        evidence: supplied[product.id]?.[shared.id],
      })
    })
    if (ISSUES[product.id]?.specReason && materialStatus(product.id, 'spec') !== 'done') {
      rows.push({
        id: 'spec',
        name: '规格参数',
        status: materialStatus(product.id, 'spec'),
        reason: ISSUES[product.id].specReason,
        placeholder: SPEC_PLACEHOLDER,
        evidence: supplied[product.id]?.spec,
      })
    }
    return rows
  }

  function isClear(product) {
    return directLeft(product.id).length === 0 && sensitiveLeft(product).length === 0
  }

  function canOptimize(product) {
    const sensitive = sensitiveLeft(product)
    if (sensitive.some((item) => item.status === 'pending')) return false
    return directLeft(product.id).length > 0 || sensitive.some((item) => item.status === 'supplied')
  }

  const ownProducts = CATALOG.filter((item) => ISSUES[item.id] && !isClear(item))
  const pendingProducts = CATALOG.filter((item) => !isClear(item))
  const sharedOnly = pendingProducts.filter((item) => !ISSUES[item.id]).length
  const passed = CHECKED - pendingProducts.length - FAILED
  const readyProducts = ownProducts.filter((item) => canOptimize(item))
  const readyModuleCount = readyProducts.reduce((sum, item) => sum + directLeft(item.id).length + sensitiveLeft(item).length, 0)
  const readySharedOnly = CATALOG.filter((item) => !ISSUES[item.id] && canOptimize(item))

  useEffect(() => {
    if (pendingProducts.length === 0 && !reported.current) {
      reported.current = true
      onResolvedRef.current?.()
    }
  }, [pendingProducts.length])

  useEffect(() => {
    if (!detecting) return
    reported.current = false
    setSupplied({})
    setOptimized({})
    setEditing(null)
    setDraft(emptyDraft([]))
    setNamesOpen({})
    setProductForm(null)
    setProductDraft({ text: '', fileName: '' })
    setBusy('')
    setError('')
    setNote('')
    setEvidenceOpen({})
  }, [detecting])

  function pendingIds(shared) {
    return CATALOG.filter((item) => shared.applies(item) && materialStatus(item.id, shared.id) === 'pending').map((item) => item.id)
  }

  function suppliedIds(shared) {
    return CATALOG.filter((item) => shared.applies(item) && materialStatus(item.id, shared.id) === 'supplied').map((item) => item.id)
  }

  function scopeIds(ids) {
    if (draft.mode === 'all') return ids
    if (draft.mode === 'category') return ids.filter((id) => draft.categories[BY_ID[id].category])
    return ids.filter((id) => draft.picked[id])
  }

  function groupsOf(moduleId, ids) {
    const groups = []
    ids.forEach((id) => {
      const item = supplied[id][moduleId]
      const key = `${item.text}\n${item.fileName}`
      let group = groups.find((entry) => entry.key === key)
      if (!group) {
        group = { key, text: item.text, fileName: item.fileName, ids: [] }
        groups.push(group)
      }
      group.ids.push(id)
    })
    return groups
  }

  function markSupplied(moduleId, ids, text, fileName) {
    setSupplied((current) => {
      const next = { ...current }
      ids.forEach((id) => {
        next[id] = { ...(next[id] || {}), [moduleId]: { text, fileName } }
      })
      return next
    })
  }

  function submitShared(shared, ids) {
    const chosen = scopeIds(ids)
    if (!draft.text.trim() && !draft.fileName) {
      setError('先填写资料，或上传文件')
      return
    }
    if (!chosen.length) {
      setError('先指定这一套用在哪些产品')
      return
    }
    const payload = { text: draft.text.trim(), fileName: draft.fileName }
    setBusy(shared.id)
    setError('')
    window.setTimeout(() => {
      markSupplied(shared.id, chosen, payload.text, payload.fileName)
      setEditing(null)
      setBusy('')
      setNote(`已为 ${chosen.length} 个产品补充「${shared.name}」，尚未优化。下面产品里的对应状态已改为已补充资料。`)
    }, 500)
  }

  function submitProduct(product, module) {
    if (!productDraft.text.trim() && !productDraft.fileName) {
      setError('先填写资料，或上传文件')
      return
    }
    const payload = { text: productDraft.text.trim(), fileName: productDraft.fileName }
    setBusy(`${product.id}-${module.id}`)
    setError('')
    window.setTimeout(() => {
      markSupplied(module.id, [product.id], payload.text, payload.fileName)
      setProductForm(null)
      setBusy('')
      setNote(module.id === 'spec' ? `已为「${product.name}」补充规格，尚未优化。` : `已为「${product.name}」补充${module.name}。共用事实里的数量已同步，尚未优化。`)
    }, 500)
  }

  function optimizeProducts(products) {
    const ready = products.filter((item) => canOptimize(item))
    if (!ready.length || busy) return
    setBusy('optimize')
    setError('')
    window.setTimeout(() => {
      setOptimized((current) => {
        const next = { ...current }
        ready.forEach((product) => {
          const bag = { ...(next[product.id] || {}) }
          directLeft(product.id).forEach((item) => {
            bag[item.id] = true
          })
          sensitiveLeft(product)
            .filter((item) => item.status === 'supplied')
            .forEach((item) => {
              bag[item.id] = true
            })
          next[product.id] = bag
        })
        return next
      })
      setBusy('')
      setNote(`已优化 ${ready.length} 个产品。这次才把已补充的资料写进页面。`)
    }, 500)
  }

  function toggleEvidence(key) {
    setEvidenceOpen((current) => ({ ...current, [key]: !current[key] }))
  }

  function evidenceGroups(products) {
    const groups = []
    products.forEach((product) => {
      sensitiveLeft(product)
        .filter((module) => module.status === 'supplied')
        .forEach((module) => {
          const text = module.evidence?.text || ''
          const fileName = module.evidence?.fileName || ''
          const key = `${module.id}\n${text}\n${fileName}`
          let group = groups.find((entry) => entry.key === key)
          if (!group) {
            group = { key, name: module.name, text, fileName, ids: [] }
            groups.push(group)
          }
          group.ids.push(product.id)
        })
    })
    return groups
  }

  function categoriesIn(ids) {
    return ['bolt', 'nut', 'washer']
      .map((key) => ({ key, count: ids.filter((id) => BY_ID[id].category === key).length }))
      .filter((item) => item.count)
  }

  return (
    <section className="pd-panel">
      <div className="pd-head">
        <h4>产品详情页信息不足</h4>
        <p>敏感资料还是待补充时，不能优化。补充后只改为已补充资料，要点优化才会写进页面。</p>
      </div>
      <div className="pd-stats">
        <span>已检测 {CHECKED}</span>
        <span className="is-hot">待处理 {pendingProducts.length}</span>
        <span>已通过 {passed}</span>
        <span>检测失败 {FAILED}</span>
      </div>
      <p className="pd-read">
        {pendingProducts.length
          ? `${pendingProducts.length} 个产品待处理。其中 ${sharedOnly} 个只在共用事实里。下面 ${ownProducts.length} 个还有本产品自己的问题。`
          : '待处理的产品已经清完。已通过的产品不在这里列出。'}
      </p>
      {note ? <p className="pd-note">{note}</p> : null}
      {busy ? (
        <p className="pd-busy">
          <i className="spin" /> 正在处理
        </p>
      ) : null}

      <h5 className="pd-label">共用事实</h5>
      <div className="pd-stack">
        {SHARED.map((shared) => {
          const waiting = pendingIds(shared)
          const filled = suppliedIds(shared)
          const groups = groupsOf(shared.id, filled)
          const chosen = editing === shared.id ? scopeIds(waiting) : []
          const visibleNames = waiting.filter((id) => BY_ID[id].name.includes(draft.query.trim()))
          if (!waiting.length && !filled.length) return null
          return (
            <article key={shared.id} className="pd-fact">
              {groups.map((group) => (
                <div key={group.key} className="pd-done">
                  <b>
                    {shared.name} 已补充资料 · {group.ids.length} 个产品，尚未优化
                  </b>
                  <p>{evidenceText(group)}</p>
                  <button type="button" className="pd-link" onClick={() => setNamesOpen((current) => ({ ...current, [group.key]: !current[group.key] }))}>
                    {namesOpen[group.key] ? '收起名单' : '查看名单'}
                  </button>
                  {namesOpen[group.key] ? (
                    <div className="pd-names">
                      {group.ids.map((id) => (
                        <span key={id}>{BY_ID[id].name}</span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
              {waiting.length ? (
                <>
                  <div className="pd-fact-top">
                    <div>
                      <b>{shared.name}</b>
                      <em>{waiting.length} 个产品待补充资料</em>
                    </div>
                    {editing === shared.id ? (
                      <button type="button" className="pd-btn" onClick={() => setEditing(null)}>
                        收起
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="pd-btn is-primary"
                        onClick={() => {
                          setEditing(shared.id)
                          setDraft(emptyDraft(waiting))
                          setProductForm(null)
                          setError('')
                        }}
                      >
                        填写并指定范围
                      </button>
                    )}
                  </div>
                  <p className="pd-lead">{shared.lead}</p>
                  <button type="button" className="pd-link" onClick={() => setNamesOpen((current) => ({ ...current, [shared.id]: !current[shared.id] }))}>
                    {namesOpen[shared.id] ? '收起产品' : `查看这 ${waiting.length} 个产品`}
                  </button>
                  {namesOpen[shared.id] ? (
                    <div className="pd-names">
                      {waiting.map((id) => (
                        <span key={id}>{BY_ID[id].name}</span>
                      ))}
                    </div>
                  ) : null}
                  {editing === shared.id ? (
                    <div className="pd-form">
                      <textarea value={draft.text} placeholder={shared.placeholder} onChange={(event) => setDraft((current) => ({ ...current, text: event.target.value }))} />
                      <FilePick fileName={draft.fileName} onPick={(fileName) => setDraft((current) => ({ ...current, fileName }))} />
                      <div className="pd-scope">
                        <span>用在哪些产品</span>
                        {[
                          ['all', `这 ${waiting.length} 个产品用同一套`],
                          ['category', '按产品分类'],
                          ['pick', '手动挑选'],
                        ].map(([mode, label]) => (
                          <label key={mode} className={draft.mode === mode ? 'is-on' : ''}>
                            <input type="radio" name={`scope-${shared.id}`} checked={draft.mode === mode} onChange={() => setDraft((current) => ({ ...current, mode }))} />
                            {label}
                          </label>
                        ))}
                      </div>
                      {draft.mode === 'category' ? (
                        <div className="pd-checks">
                          {categoriesIn(waiting).map((item) => (
                            <label key={item.key}>
                              <input
                                type="checkbox"
                                checked={Boolean(draft.categories[item.key])}
                                onChange={(event) => setDraft((current) => ({ ...current, categories: { ...current.categories, [item.key]: event.target.checked } }))}
                              />
                              {CATEGORY_LABEL[item.key]} · {item.count}
                            </label>
                          ))}
                        </div>
                      ) : null}
                      {draft.mode === 'pick' ? (
                        <div className="pd-pick">
                          <input value={draft.query} placeholder="按产品名筛选" onChange={(event) => setDraft((current) => ({ ...current, query: event.target.value }))} />
                          <div className="pd-pick-list">
                            {visibleNames.map((id) => (
                              <label key={id}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(draft.picked[id])}
                                  onChange={(event) => setDraft((current) => ({ ...current, picked: { ...current.picked, [id]: event.target.checked } }))}
                                />
                                {BY_ID[id].name}
                              </label>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {error && editing === shared.id ? <p className="pd-error">{error}</p> : null}
                      <button type="button" className="pd-btn is-primary" disabled={!!busy || !chosen.length} onClick={() => submitShared(shared, waiting)}>
                        补充到这 {chosen.length} 个产品
                      </button>
                    </div>
                  ) : null}
                </>
              ) : null}
            </article>
          )
        })}
      </div>

      <h5 className="pd-label">本产品自己的问题</h5>
      <div className="pd-batch">
        <span>
          {readyProducts.length
            ? `${readyProducts.length} 个产品的敏感资料已补完，可以优化 ${readyModuleCount} 项。`
            : '还有待补充资料。敏感资料补完之前，优化按钮不可点。'}
        </span>
        <button type="button" className={`pd-btn${readyProducts.length ? ' is-primary' : ''}`} disabled={!readyProducts.length || !!busy} onClick={() => optimizeProducts(readyProducts)}>
          优化这 {readyModuleCount} 项
        </button>
      </div>
      {readySharedOnly.length ? (
        <article className="pd-product">
          <div className="pd-product-top">
            <b>{readySharedOnly.length} 个产品的共用资料已补充，尚未优化</b>
          </div>
          <ul>
            {evidenceGroups(readySharedOnly).map((group) => {
              const viewKey = `batch:${group.key}`
              return (
                <li key={group.key}>
                  <span className="pd-tag is-supplied">已补充资料</span>
                  <strong>{group.name}</strong>
                  <span>{group.ids.length} 个产品</span>
                  <button type="button" className="pd-link" onClick={() => toggleEvidence(viewKey)}>
                    {evidenceOpen[viewKey] ? '收起资料' : '查看资料'}
                  </button>
                  {evidenceOpen[viewKey] ? <EvidenceView text={group.text} fileName={group.fileName} /> : null}
                </li>
              )
            })}
          </ul>
          <div className="pd-actions">
            <button type="button" className="pd-btn is-primary" disabled={!!busy} onClick={() => optimizeProducts(readySharedOnly)}>
              优化这 {readySharedOnly.length} 个产品
            </button>
          </div>
        </article>
      ) : null}
      {ownProducts.length ? (
        <div className="pd-stack">
          {ownProducts.map((product) => {
            const directs = directLeft(product.id)
            const sensitive = sensitiveLeft(product)
            const allowed = canOptimize(product)
            return (
              <article key={product.id} className="pd-product">
                <div className="pd-product-top">
                  <b>{product.name}</b>
                  <em>{CATEGORY_LABEL[product.category]}</em>
                </div>
                <ul>
                  {directs.map((module) => (
                    <li key={module.id}>
                      <span className="pd-tag is-direct">可直接优化</span>
                      <strong>{module.name}</strong>
                      <span>{module.reason}</span>
                    </li>
                  ))}
                  {sensitive.map((module) => {
                    const viewKey = `${product.id}:${module.id}`
                    return (
                      <li key={module.id}>
                        <span className={`pd-tag ${module.status === 'supplied' ? 'is-supplied' : 'is-wait'}`}>{module.status === 'supplied' ? '已补充资料' : '待补充资料'}</span>
                        <strong>{module.name}</strong>
                        {module.status === 'supplied' ? (
                          <button type="button" className="pd-link" onClick={() => toggleEvidence(viewKey)}>
                            {evidenceOpen[viewKey] ? '收起资料' : '查看资料'}
                          </button>
                        ) : (
                          <span>{module.reason}</span>
                        )}
                        {module.status === 'pending' ? (
                          <button
                            type="button"
                            className="pd-link"
                            onClick={() => {
                              const opening = !(productForm?.productId === product.id && productForm?.moduleId === module.id)
                              setProductForm(opening ? { productId: product.id, moduleId: module.id } : null)
                              setProductDraft({ text: '', fileName: '' })
                              setEditing(null)
                              setError('')
                            }}
                          >
                            {productForm?.productId === product.id && productForm?.moduleId === module.id ? '收起' : '补充资料'}
                          </button>
                        ) : null}
                        {module.status === 'supplied' && evidenceOpen[viewKey] ? (
                          <EvidenceView text={module.evidence?.text} fileName={module.evidence?.fileName} />
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
                {productForm?.productId === product.id ? (
                  <div className="pd-form">
                    <textarea
                      value={productDraft.text}
                      placeholder={sensitive.find((item) => item.id === productForm.moduleId)?.placeholder || ''}
                      onChange={(event) => setProductDraft((current) => ({ ...current, text: event.target.value }))}
                    />
                    <FilePick fileName={productDraft.fileName} onPick={(fileName) => setProductDraft((current) => ({ ...current, fileName }))} />
                    {error ? <p className="pd-error">{error}</p> : null}
                    <button
                      type="button"
                      className="pd-btn is-primary"
                      disabled={!!busy}
                      onClick={() => submitProduct(product, sensitive.find((item) => item.id === productForm.moduleId))}
                    >
                      只补充这个产品
                    </button>
                  </div>
                ) : null}
                <div className="pd-actions">
                  <button type="button" className={`pd-btn${allowed ? ' is-primary' : ''}`} disabled={!allowed || !!busy} onClick={() => optimizeProducts([product])}>
                    优化可改项
                  </button>
                  {allowed ? null : <span className="pd-hint">还有待补充资料，补充完才能优化</span>}
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <p className="pd-empty">没有需要按产品单独处理的问题。</p>
      )}
    </section>
  )
}

function EvidenceView({ text, fileName }) {
  return (
    <div className="pd-evidence">
      {text ? <p>{text}</p> : null}
      {fileName ? (
        <div className="pd-file">
          <span>{fileName}</span>
        </div>
      ) : null}
    </div>
  )
}

function FilePick({ fileName, onPick }) {
  return fileName ? (
    <div className="pd-file">
      <span>{fileName}</span>
      <button type="button" onClick={() => onPick('')}>
        移除
      </button>
    </div>
  ) : (
    <label className="pd-file is-pick">
      <span>上传文件（PDF / Excel / Word / JPG / PNG）</span>
      <input
        type="file"
        accept={FILE_ACCEPT}
        onChange={(event) => {
          const file = event.target.files && event.target.files[0]
          onPick(file ? file.name : '')
          event.target.value = ''
        }}
      />
    </label>
  )
}
