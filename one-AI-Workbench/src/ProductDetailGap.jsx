import { useEffect, useRef, useState } from 'react'
import { Button, ConfigProvider, Table, Tag } from 'antd'

const CHECKED = 100
const FAILED = 0
const PAGE_SIZE = 20

const QUEUE_THEME = {
  token: {
    colorPrimary: '#2563eb',
    fontSize: 13,
    borderRadius: 6,
  },
  components: {
    Table: {
      headerBg: '#fafafa',
      headerColor: '#909399',
      headerSplitColor: '#f0f0f0',
      borderColor: '#f0f0f0',
      cellFontSizeSM: 13,
      cellPaddingBlockSM: 10,
      cellPaddingInlineSM: 12,
    },
  },
}

function analysisColor(part) {
  if (part.startsWith('待补充')) return 'warning'
  if (part === '全部合格') return 'success'
  return 'processing'
}

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
    specReason: '整页没有规格，看不出哪项对应哪个值',
  },
  'bolt-1': {},
  'nut-0': {
    specReason: '只有表头，没有数值',
  },
}

const FILE_ACCEPT = '.pdf,.xls,.xlsx,.doc,.docx,.jpg,.jpeg,.png'
const SPEC_PLACEHOLDER = '建议至少写两项名称和对应数值。例如：直径 8 mm，长度 30 mm'

const SHARED = [
  {
    id: 'spec',
    name: '规格参数',
    placeholder: SPEC_PLACEHOLDER,
    applies: (product) => Boolean(ISSUES[product.id]?.specReason),
    gap: {
      exists: false,
      comment: '要补至少两项，每项写明名称和对应值。数值用客户补充的资料，不能编造。不合格。',
      suggestion: '新增模块',
    },
  },
  {
    id: 'service',
    name: '售后服务',
    placeholder: '建议写清保修范围、保修期限、响应方式。例如：非人为损坏的产品本体，出厂之日起 12 个月，工作日 24 小时内回复',
    applies: () => true,
    gap: {
      exists: false,
      comment: '要写清可核验的服务范围、响应方式或期限。质保年数和上门时效用客户补充的资料，不能编造。不合格。',
      suggestion: '新增模块',
    },
  },
  {
    id: 'pack',
    name: '包装与物流',
    placeholder: '建议写清包装方式、运输或交付信息。例如：纸箱每箱 500 件，国内汽运，款到 7 日内发货',
    applies: (product) => product.category === 'washer',
    gap: {
      exists: false,
      comment: '要写清包装、运输或交付里至少一件可核验事实。运费和交货天数用客户补充的资料，不能编造。不合格。',
      suggestion: '新增模块',
    },
  },
  {
    id: 'nutrition',
    name: '营养成分',
    placeholder: '建议写明可核验的成分和含量。例如：蛋白质 12 g/100 g',
    applies: () => false,
    industryOnly: '仅食品、医药',
    gap: {
      exists: false,
      comment: '要写清可核验的营养成分和含量。数值用客户补充的资料，不能编造。不合格。',
      suggestion: '新增模块',
    },
  },
  {
    id: 'audience',
    name: '适用人群与禁忌',
    placeholder: '建议写明适用人群和禁忌。例如：成人食用，婴幼儿不宜',
    applies: () => false,
    industryOnly: '仅食品、医药',
    gap: {
      exists: false,
      comment: '要写明适用人群，以及至少一条禁忌或注意事项。用客户补充的资料，不能编造。不合格。',
      suggestion: '新增模块',
    },
  },
]

const MODULE_DEFS = [
  { id: 'spec', name: '规格参数', sensitive: true },
  { id: 'perf', name: '功能性能' },
  { id: 'scene', name: '应用场景' },
  { id: 'solution', name: '行业解决方案' },
  { id: 'process', name: '技术原理或工艺' },
  { id: 'install', name: '安装与使用' },
  { id: 'maintain', name: '维护保养' },
  { id: 'safety', name: '安全注意事项' },
  { id: 'service', name: '售后服务', sensitive: true },
  { id: 'pack', name: '包装与物流', sensitive: true },
  { id: 'env', name: '环保说明' },
  { id: 'faq', name: '常见问题' },
]

const PASS_LINE = {
  spec: '至少两项，名称和对应值对得上。合格。',
  perf: '写了能做什么、做到什么程度。合格。',
  scene: '写了一个具体情形，能看出谁在什么情况下用。合格。',
  solution: '写明了面对谁或哪个问题，以及对应做法。合格。',
  process: '能看出步骤或因果关系。合格。',
  install: '写清了怎么开始和怎么完成，至少两个条件或动作是具体的。合格。',
  maintain: '写了后续要做的动作，或写清了周期和对应动作。合格。',
  safety: '至少两条具体注意事项，能看出要避免什么。合格。',
  service: '有可核验的服务范围、响应方式或期限。合格。',
  pack: '有可核验的包装、运输或交付事实。合格。',
  env: '写清了一件具体的环境事实。合格。',
  faq: '至少三组问答，涉及两类问题。合格。',
}

const SERVICE_GAP = SHARED.find((item) => item.id === 'service').gap
const PACK_GAP = SHARED.find((item) => item.id === 'pack').gap

function reviewSentence(row) {
  const body = `${row.comment}建议：${row.suggestion}。`
  return row.exists ? body : `原文缺失。${body}`
}

const WEAK = {
  perf: { exists: true, comment: '只有产品名称和「品质可靠」，没有说明能做什么、做到什么程度。不合格。', suggestion: '基于原模块内容扩写' },
  scene: { exists: true, comment: '只写了「广泛应用于各行业」，看不出谁在什么情况下用。不合格。', suggestion: '基于原模块内容扩写' },
  solution: { exists: true, comment: '把功能介绍又写了一遍，看不出针对谁或哪个问题。不合格。', suggestion: '基于原模块内容扩写' },
  process: { exists: true, comment: '只写了「技术先进、工艺成熟」，看不出步骤或因果关系。不合格。', suggestion: '基于原模块内容扩写' },
  install: { exists: true, comment: '只写了「按说明书使用」，看不出怎么开始、怎么完成。不合格。', suggestion: '基于原模块内容扩写' },
  maintain: { exists: true, comment: '只写了「定期维护」，没有对应动作。不合格。', suggestion: '基于原模块内容扩写' },
  safety: { exists: true, comment: '只写了「注意安全」，不足两条具体注意事项。不合格。', suggestion: '基于原模块内容扩写' },
  env: { exists: true, comment: '只写了「绿色环保」，没有具体的材料、能耗、排放或回收。不合格。', suggestion: '基于原模块内容扩写' },
  faq: { exists: true, comment: '只有一组问答，不足 3 组，也没有两类问题。不合格。', suggestion: '基于原模块内容扩写' },
}

const ADD = {
  perf: { exists: false, comment: '要写能做什么、做到什么程度，至少一段或 3 条，不要只有产品名称或广告口号。不合格。', suggestion: '新增模块' },
  scene: { exists: false, comment: '要写至少一个具体情形，能看出谁在什么情况下用，或用完得到什么结果。不要只写「用途广泛」。不合格。', suggestion: '新增模块' },
  solution: { exists: false, comment: '要写明面对谁或哪个问题，以及对应做法，不能只把功能介绍再抄一遍。不合格。', suggestion: '新增模块' },
  process: { exists: false, comment: '要写清这件事怎么完成，让读者看出步骤或因果关系，不要只写「技术先进、工艺成熟」。不合格。', suggestion: '新增模块' },
  install: { exists: false, comment: '要写清怎么开始和怎么完成，其中至少两个条件或动作是具体的。不要只写「按说明书使用」。不合格。', suggestion: '新增模块' },
  maintain: { exists: false, comment: '要写至少两个后续动作，或写清周期和对应动作，不要只写「注意保养」。不合格。', suggestion: '新增模块' },
  safety: { exists: false, comment: '要写至少两条具体注意事项，能看出要避免什么或要做什么。不要只写「注意安全」。不合格。', suggestion: '新增模块' },
  env: { exists: false, comment: '要写清一件具体的环境事实，例如材料、能耗、排放或回收，不要只写「绿色环保」。不合格。', suggestion: '新增模块' },
  faq: { exists: false, comment: '要新增至少 3 组问答，至少涉及两类问题。答案里的参数、价格、期限只用页面上已有的事实。不合格。', suggestion: '新增模块' },
}

const IMAGE_CHECK = {
  'bolt-0': { total: 4, missing: 2 },
  'bolt-1': { total: 3, missing: 0 },
  'nut-0': { total: 0, missing: 0 },
}

function imageRow(product, written) {
  const check = IMAGE_CHECK[product.id] || { total: 0, missing: 0 }
  if (written && check.total) {
    return {
      id: 'image',
      name: '图片说明',
      tag: '合格',
      tone: 'pass',
      plainReview: true,
      comment: `${check.total}张图片均有图片说明，合格。`,
      status: 'image',
    }
  }
  if (!check.total) {
    return {
      id: 'image',
      name: '图片说明',
      tag: '无图片',
      tone: 'none',
      plainReview: true,
      comment: '详情里没有配图。',
      status: 'image',
    }
  }
  if (!check.missing) {
    return {
      id: 'image',
      name: '图片说明',
      tag: '合格',
      tone: 'pass',
      plainReview: true,
      comment: `${check.total}张图片均有图片说明，合格。`,
      status: 'image',
    }
  }
  return {
    id: 'image',
    name: '图片说明',
    tag: '不合格',
    tone: 'fail',
    plainReview: true,
    comment: `共${check.total}张图片，其中${check.missing}张图片没有图片说明。`,
    status: 'image',
  }
}

const GAP = {
  'bolt-0': {
    spec: { exists: false, comment: '要补至少两项，每项写明名称和对应值。表格、分项或逐行都可以，数值用客户补充的资料，不能编造。不合格。', suggestion: '新增模块' },
    perf: WEAK.perf,
    scene: WEAK.scene,
    solution: ADD.solution,
    process: ADD.process,
    install: WEAK.install,
    maintain: ADD.maintain,
    safety: WEAK.safety,
    env: WEAK.env,
    faq: WEAK.faq,
  },
  'bolt-1': {
    perf: WEAK.perf,
    scene: ADD.scene,
    solution: ADD.solution,
    process: WEAK.process,
    install: WEAK.install,
    maintain: ADD.maintain,
    safety: WEAK.safety,
    env: ADD.env,
    faq: WEAK.faq,
  },
  'nut-0': {
    spec: { exists: true, comment: '只有表头，没有数值。按原表补上至少两项名称和对应值，数值用客户补充的资料，不能编造。不合格。', suggestion: '基于原模块内容扩写' },
    perf: WEAK.perf,
    scene: ADD.scene,
    solution: WEAK.solution,
    process: ADD.process,
    install: ADD.install,
    maintain: WEAK.maintain,
    safety: ADD.safety,
    env: WEAK.env,
    faq: ADD.faq,
  },
}

function emptyDraft(ids) {
  const categories = {}
  ids.forEach((id) => {
    categories[BY_ID[id].category] = true
  })
  return { text: '', fileName: '', mode: 'all', categories, picked: {}, query: '' }
}

function openProductPage(id) {
  window.location.hash = `product/${id}`
}

function productPageCopy(product, def) {
  const gap = (GAP[product.id] || {})[def.id]
  if (gap) {
    if (!gap.exists) return '详情页上还没有这一块内容。'
    return gap.comment.replace(/不合格。$/, '')
  }
  if (def.sensitive) return '详情页上还没有这一块内容。'
  return PASS_LINE[def.id]
}

function evidenceText(item) {
  if (!item) return ''
  return [item.text, item.fileName ? `附件 ${item.fileName}` : ''].filter(Boolean).join(' · ')
}

export function ProductPage({ id, onBack }) {
  const product = BY_ID[id]
  if (!product) {
    return (
      <div className="pd-page">
        <button type="button" className="pd-btn" onClick={onBack}>
          返回
        </button>
        <p>找不到这个产品详情页。</p>
      </div>
    )
  }
  const modules = MODULE_DEFS.filter((def) => def.id !== 'pack' || product.category === 'washer')
  return (
    <article className="pd-page">
      <button type="button" className="pd-btn" onClick={onBack}>
        返回诊断
      </button>
      <p className="pd-page-kicker">{CATEGORY_LABEL[product.category]} · 产品详情页</p>
      <h1>{product.name}</h1>
      {modules.map((def) => (
        <section key={def.id}>
          <h2>{def.name}</h2>
          <p>{productPageCopy(product, def)}</p>
        </section>
      ))}
    </article>
  )
}

export default function ProductDetailGap({ initialGap, onGapChange, onResolved, onDirty }) {
  const [supplied, setSupplied] = useState(() => initialGap?.supplied || {})
  const [optimized, setOptimized] = useState(() => initialGap?.optimized || {})
  const [aiPassed, setAiPassed] = useState(() => initialGap?.aiPassed || {})
  const [editing, setEditing] = useState(null)
  const [draft, setDraft] = useState(() => emptyDraft([]))
  const [namesOpen, setNamesOpen] = useState({})
  const [productForm, setProductForm] = useState(null)
  const [productDraft, setProductDraft] = useState({ text: '', fileName: '' })
  const [busy, setBusy] = useState('')
  const [optimizingIds, setOptimizingIds] = useState([])
  const [optimizeScope, setOptimizeScope] = useState('')
  const [error, setError] = useState('')
  const [evidenceOpen, setEvidenceOpen] = useState({})
  const [detailOpen, setDetailOpen] = useState(false)
  const [batchOpen, setBatchOpen] = useState({})
  const [detailId, setDetailId] = useState(null)
  const [page, setPage] = useState(1)
  const [ownCategory, setOwnCategory] = useState('all')
  const [ownQuery, setOwnQuery] = useState('')
  const [ownStatus, setOwnStatus] = useState('pending')
  const reported = useRef(false)
  const optimizeJobs = useRef([])
  const onResolvedRef = useRef(onResolved)
  const onDirtyRef = useRef(onDirty)
  const onGapChangeRef = useRef(onGapChange)
  onResolvedRef.current = onResolved
  onDirtyRef.current = onDirty
  onGapChangeRef.current = onGapChange

  function materialStatus(productId, moduleId) {
    if (optimized[productId]?.[moduleId]) return 'done'
    if (supplied[productId]?.[moduleId]) return 'supplied'
    return 'pending'
  }

  function directLeft(productId) {
    const gaps = GAP[productId] || {}
    return MODULE_DEFS.filter((def) => !def.sensitive && gaps[def.id] && !optimized[productId]?.[def.id]).map((def) => ({ id: def.id, name: def.name }))
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

  const ownIssueProducts = CATALOG.filter((item) => ISSUES[item.id])
  const pendingProducts = CATALOG.filter((item) => !isClear(item))
  const passed = CHECKED - pendingProducts.length - FAILED
  const ownProducts = ownIssueProducts.filter((item) => {
    if (ownStatus === 'checked') return true
    if (ownStatus === 'failed') return false
    return isClear(item) ? ownStatus === 'passed' : ownStatus === 'pending'
  })
  const readyProducts = ownProducts.filter((item) => canOptimize(item))
  const batchReady = readyProducts.filter((item) => !optimizingIds.includes(item.id))
  const readySharedOnly = CATALOG.filter((item) => !ISSUES[item.id] && canOptimize(item))
  const ownQueryText = ownQuery.trim()
  const ownShown = ownProducts.filter((item) => {
    if (ownCategory !== 'all' && item.category !== ownCategory) return false
    if (ownQueryText && !item.name.includes(ownQueryText)) return false
    return true
  })
  const detailProduct = CATALOG.find((item) => item.id === detailId) || null

  useEffect(() => {
    onGapChangeRef.current?.({ supplied, optimized, aiPassed })
  }, [supplied, optimized, aiPassed])

  useEffect(() => {
    if (pendingProducts.length === 0) {
      if (!reported.current) {
        reported.current = true
        onResolvedRef.current?.()
      }
      return
    }
    reported.current = false
    onDirtyRef.current?.()
  }, [pendingProducts.length])

  useEffect(() => () => {
    optimizeJobs.current.forEach((job) => job.timers.forEach((id) => window.clearTimeout(id)))
  }, [])

  useEffect(() => {
    if (!detailId) return undefined
    function onKey(event) {
      if (event.key === 'Escape') setDetailId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [detailId])

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
    }, 500)
  }

  function finishOptimize(ready) {
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
    setAiPassed((current) => {
      const next = { ...current }
      ready.forEach((product) => {
        next[product.id] = true
      })
      return next
    })
  }

  function optimizeProducts(products, scope = 'row') {
    const running = new Set(optimizeJobs.current.flatMap((job) => job.ids))
    const ready = products.filter((item) => canOptimize(item) && !running.has(item.id))
    if (!ready.length) return false
    if (scope === 'batch' && optimizeJobs.current.some((job) => job.scope === 'batch')) return false
    const job = { ids: ready.map((item) => item.id), scope, timers: [] }
    optimizeJobs.current.push(job)
    setOptimizingIds(optimizeJobs.current.flatMap((item) => item.ids))
    if (scope === 'batch') setOptimizeScope('batch')
    setError('')
    const first = window.setTimeout(() => {
      const second = window.setTimeout(() => {
        finishOptimize(ready)
        optimizeJobs.current = optimizeJobs.current.filter((item) => item !== job)
        setOptimizingIds(optimizeJobs.current.flatMap((item) => item.ids))
        if (scope === 'batch') setOptimizeScope('')
      }, 4000)
      job.timers.push(second)
    }, 5000)
    job.timers.push(first)
    return true
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

  function gapOf(product, def) {
    if (def.id === 'service') return SERVICE_GAP
    if (def.id === 'pack') return product.category === 'washer' ? PACK_GAP : null
    return GAP[product.id]?.[def.id] || null
  }

function moduleRows(product) {
  const rows = MODULE_DEFS.map((def) => {
      if (optimized[product.id]?.[def.id]) {
        return {
          ...def,
          tag: '合格',
          tone: 'pass',
          exists: true,
          comment: '已写入页面，达到合格线。合格。',
          suggestion: '保持原内容不变',
          status: 'done',
        }
      }
      const gap = gapOf(product, def)
      if (!gap) {
        return {
          ...def,
          tag: '合格',
          tone: 'pass',
          exists: true,
          comment: PASS_LINE[def.id],
          suggestion: '保持原内容不变',
          status: 'pass',
        }
      }
      if (def.sensitive) {
        const status = materialStatus(product.id, def.id)
        const shared = SHARED.find((item) => item.id === def.id)
        return {
          ...def,
          ...gap,
          tag: status === 'supplied' ? '已补充资料可优化' : '待补充资料',
          tone: status === 'supplied' ? 'supplied' : 'wait',
          status,
          placeholder: def.id === 'spec' ? SPEC_PLACEHOLDER : shared?.placeholder || '',
          evidence: supplied[product.id]?.[def.id],
        }
      }
      return { ...def, ...gap, tag: '可优化', tone: 'direct', status: 'direct' }
    })
    rows.push(imageRow(product, !!aiPassed[product.id]))
    return rows
  }

  function categoriesIn(ids) {
    return ['bolt', 'nut', 'washer']
      .map((key) => ({ key, count: ids.filter((id) => BY_ID[id].category === key).length }))
      .filter((item) => item.count)
  }

  function togglePicked(id) {
    setDraft((current) => ({ ...current, picked: { ...current.picked, [id]: !current.picked[id] } }))
  }

  function analysisParts(product) {
    if (isClear(product)) return ['全部合格']
    const waiting = sensitiveLeft(product).filter((item) => item.status === 'pending').length
    const suppliedCount = sensitiveLeft(product).filter((item) => item.status === 'supplied').length
    const direct = directLeft(product.id).length
    return [
      waiting ? `待补充 ${waiting}` : '',
      suppliedCount ? `已补充 ${suppliedCount}` : '',
      direct ? `可优化 ${direct}` : '',
    ].filter(Boolean)
  }

  function nextStep(product) {
    if (sensitiveLeft(product).some((item) => item.status === 'pending')) return 'supply'
    if (canOptimize(product)) return 'optimize'
    return 'view'
  }

  function openDetail(product, supply) {
    setDetailId(product.id)
    setEditing(null)
    setError('')
    if (!supply) {
      setProductForm(null)
      return
    }
    const pending = sensitiveLeft(product).filter((item) => item.status === 'pending')
    const first = pending.find((item) => item.id === 'spec') || pending[0]
    setProductForm(first ? { productId: product.id, moduleId: first.id } : null)
    setProductDraft({ text: '', fileName: '' })
  }

  function renderProduct(product) {
    const rows = moduleRows(product)
    const allowed = canOptimize(product)
    return (
      <article className="pd-product">
        <ul>
          {rows.map((module) => {
            const viewKey = `${product.id}:${module.id}`
            const formOpen = productForm?.productId === product.id && productForm?.moduleId === module.id
            const openForm = (existing) => {
              setProductForm(formOpen ? null : { productId: product.id, moduleId: module.id })
              setProductDraft(formOpen ? { text: '', fileName: '' } : { text: existing?.text || '', fileName: existing?.fileName || '' })
              setEditing(null)
              setError('')
            }
            return (
              <li key={module.id} className="pd-mod">
                <div className="pd-mod-side">
                  <strong>{module.name}</strong>
                  <span className={`pd-tag ${module.tone === 'pass' ? 'is-pass' : module.tone === 'fail' ? 'is-fail' : module.tone === 'none' ? 'is-none' : module.tone === 'direct' ? 'is-direct' : module.tone === 'supplied' ? 'is-supplied' : 'is-wait'}`}>{module.tag}</span>
                  {module.status === 'supplied' ? (
                    <>
                      <button type="button" className="pd-link" onClick={() => toggleEvidence(viewKey)}>
                        {evidenceOpen[viewKey] ? '收起资料' : '查看资料'}
                      </button>
                      <button type="button" className="pd-link" onClick={() => openForm(module.evidence)}>
                        {formOpen ? '收起' : '继续补充资料'}
                      </button>
                    </>
                  ) : null}
                  {module.status === 'pending' ? (
                    <button type="button" className="pd-link" onClick={() => openForm(null)}>
                      {formOpen ? '收起' : '补充资料'}
                    </button>
                  ) : null}
                </div>
                <p className="pd-review">{module.plainReview ? module.comment : reviewSentence(module)}</p>
                {module.status === 'supplied' && evidenceOpen[viewKey] ? (
                  <EvidenceView text={module.evidence?.text} fileName={module.evidence?.fileName} />
                ) : null}
                {formOpen ? (
                  <div className="pd-form">
                    <textarea
                      value={productDraft.text}
                      placeholder={module.placeholder || ''}
                      onChange={(event) => setProductDraft((current) => ({ ...current, text: event.target.value }))}
                    />
                    <FilePick fileName={productDraft.fileName} onPick={(fileName) => setProductDraft((current) => ({ ...current, fileName }))} />
                    {error ? <p className="pd-error">{error}</p> : null}
                    <button type="button" className="pd-btn is-primary" disabled={busy === `${product.id}-${module.id}`} onClick={() => submitProduct(product, module)}>
                      只补充这个产品
                    </button>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
        <div className="pd-actions">
          <button type="button" className={`pd-btn${allowed && !optimizingIds.includes(product.id) ? ' is-primary' : ''}`} disabled={!allowed || optimizingIds.includes(product.id)} onClick={() => {
            if (optimizeProducts([product])) setDetailId(null)
          }}>
            {optimizingIds.includes(product.id) ? (
              <>
                <i className="spin" /> AI优化中
              </>
            ) : (
              '优化该产品'
            )}
          </button>
          <button type="button" className="pd-btn" onClick={() => openProductPage(product.id)}>
            去查看
          </button>
        </div>
      </article>
    )
  }

  const queueColumns = [
    {
      title: '产品',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (name, product) => (
        <span className="pd-name">
          {name}
          {aiPassed[product.id] ? <Tag color="success">AI优化</Tag> : null}
        </span>
      ),
    },
    {
      title: '产品分类',
      dataIndex: 'category',
      key: 'category',
      width: 96,
      render: (category) => CATEGORY_LABEL[category],
    },
    {
      title: '分析结果',
      key: 'analysis',
      width: 248,
      render: (_, product) => (
        <div className="pd-analysis">
          {analysisParts(product).map((part) => (
            <Tag key={part} color={analysisColor(part)}>
              {part}
            </Tag>
          ))}
          <Button type="link" size="small" style={{ height: 'auto', padding: 0 }} onClick={() => openDetail(product, false)}>
            详情
          </Button>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 136,
      align: 'right',
      render: (_, product) => {
        const step = nextStep(product)
        const optimizing = optimizingIds.includes(product.id)
        if (optimizing) {
          return (
            <Button size="small" disabled style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <i className="spin" /> AI优化中
            </Button>
          )
        }
        if (step === 'supply') {
          return (
            <Button type="primary" size="small" onClick={() => openDetail(product, true)}>
              补充资料
            </Button>
          )
        }
        if (step === 'optimize') {
          return (
            <Button type="primary" size="small" onClick={() => optimizeProducts([product])}>
              优化
            </Button>
          )
        }
        return (
          <Button size="small" onClick={() => openProductPage(product.id)}>
            去查看
          </Button>
        )
      },
    },
  ]

  const statusBar = (
    <div className="pd-stats">
      {[
        ['checked', `已检测 ${CHECKED}`],
        ['pending', `待处理 ${pendingProducts.length}`],
        ['passed', `已通过 ${passed}`],
        ['failed', `检测失败 ${FAILED}`],
      ].map(([key, label]) => (
        <button key={key} type="button" className={ownStatus === key ? 'is-on' : ''} aria-pressed={ownStatus === key} onClick={() => {
          setOwnStatus(key)
          setDetailId(null)
          setPage(1)
          setOwnCategory('all')
          setOwnQuery('')
          setDetailOpen(true)
        }}>
          {label}
        </button>
      ))}
    </div>
  )

  return (
    <section className="pd-panel">
      <div className="pd-head">
        <div className="pd-head-main">
          <span className="pd-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 3.5l1.8 4.7 4.7 1.8-4.7 1.8L10 16.5l-1.8-4.7L3.5 10l4.7-1.8L10 3.5zM18 14.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z" />
            </svg>
          </span>
          <h4>产品详情页信息不足</h4>
          <span className="pd-auto">AI 可自动优化</span>
          <button type="button" className="pd-fold" aria-expanded={detailOpen} onClick={() => setDetailOpen((open) => !open)}>
            <i className={`pd-chevron${detailOpen ? ' is-open' : ''}`} />
            {detailOpen ? '收起' : '展开'}
          </button>
        </div>
      </div>
      <div className="pd-under">
      {detailOpen ? null : statusBar}

      {detailOpen ? (
      <>
      <h5 className="pd-label">本产品自己的问题</h5>
      {ownStatus === 'passed' || ownStatus === 'failed' ? null : (
      <>
      <div className="pd-batch">
        <button type="button" className={`pd-btn${batchReady.length && optimizeScope !== 'batch' ? ' is-primary' : ''}`} disabled={!batchReady.length || optimizeScope === 'batch'} onClick={() => optimizeProducts(batchReady, 'batch')}>
          {optimizeScope === 'batch' ? (
            <>
              <i className="spin" /> AI优化中
            </>
          ) : (
            `一键优化 ${batchReady.length} 个产品详情`
          )}
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
                  <span className="pd-tag is-supplied">已补充资料可优化</span>
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
            <button type="button" className="pd-btn is-primary" disabled={readySharedOnly.every((item) => optimizingIds.includes(item.id))} onClick={() => optimizeProducts(readySharedOnly)}>
              优化这 {readySharedOnly.length} 个产品
            </button>
          </div>
        </article>
      ) : null}
      </>
      )}
      {statusBar}
      {ownProducts.length ? (
        <>
          <div className="pd-own-nav">
            <input
              value={ownQuery}
              placeholder="搜索产品名"
              onChange={(event) => {
                setOwnQuery(event.target.value)
                setPage(1)
              }}
            />
            <div className="pd-pick-tabs">
              <button
                type="button"
                className={ownCategory === 'all' ? 'is-on' : ''}
                onClick={() => {
                  setOwnCategory('all')
                  setPage(1)
                }}
              >
                全部 {ownProducts.length}
              </button>
              {categoriesIn(ownProducts.map((item) => item.id)).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={ownCategory === item.key ? 'is-on' : ''}
                  onClick={() => {
                    setOwnCategory(item.key)
                    setPage(1)
                  }}
                >
                  {CATEGORY_LABEL[item.key]} {item.count}
                </button>
              ))}
            </div>
          </div>
          <ConfigProvider theme={QUEUE_THEME}>
            <Table
              className="pd-queue"
              size="small"
              rowKey="id"
              tableLayout="fixed"
              scroll={{ x: 700 }}
              columns={queueColumns}
              dataSource={ownShown}
              pagination={{
                current: page,
                pageSize: PAGE_SIZE,
                size: 'small',
                showSizeChanger: false,
                hideOnSinglePage: true,
                showTotal: (total) => `共 ${total} 个产品`,
                onChange: (next) => setPage(next),
              }}
              locale={{ emptyText: '这个分类里没有叫这个名字的产品' }}
            />
          </ConfigProvider>
          {detailProduct ? (
            <div className="ready-dialog-mask" onClick={() => setDetailId(null)}>
              <div className="ready-dialog pd-detail-dialog" role="dialog" aria-modal="true" aria-label={`${detailProduct.name}的分析结果`} onClick={(event) => event.stopPropagation()}>
                <header>
                  <span>
                    {detailProduct.name}
                    <em>{CATEGORY_LABEL[detailProduct.category]}</em>
                    {aiPassed[detailProduct.id] ? <span className="pd-tag is-ai">AI优化</span> : null}
                  </span>
                  <button type="button" onClick={() => setDetailId(null)} aria-label="关闭">
                    ×
                  </button>
                </header>
                <div className="body">{renderProduct(detailProduct)}</div>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <p className="pd-empty">
          {ownStatus === 'failed'
            ? '没有检测失败的产品。'
            : ownStatus === 'passed'
              ? '没有已通过、且带有本产品自己问题的产品。'
              : ownStatus === 'checked'
                ? '没有已检测、且带有本产品自己问题的产品。'
                : '没有待处理、且带有本产品自己问题的产品。'}
        </p>
      )}
      <h5 className="pd-label">批量补充资料</h5>
      <div className="pd-stack">
        {SHARED.map((shared) => {
          const waiting = pendingIds(shared)
          const filled = suppliedIds(shared)
          const groups = groupsOf(shared.id, filled)
          const chosen = editing === shared.id ? scopeIds(waiting) : []
          const pickCategories = categoriesIn(waiting)
          const pickCategory = pickCategories.some((item) => item.key === draft.pickCategory) ? draft.pickCategory : pickCategories[0]?.key
          const pickQuery = draft.query.trim()
          const pickPool = pickQuery ? waiting.filter((id) => BY_ID[id].name.includes(pickQuery)) : waiting.filter((id) => BY_ID[id].category === pickCategory)
          const inactive = !waiting.length && !filled.length
          const open = Boolean(batchOpen[shared.id])
          return (
            <article key={shared.id} className="pd-fact">
              <div className="pd-fact-top">
                <div>
                  <b>{shared.name}</b>
                  <em>{inactive ? shared.industryOnly || '没有待补充的产品' : `${waiting.length} 个产品待补充资料`}</em>
                </div>
                <button
                  type="button"
                  className="pd-fold"
                  aria-expanded={open}
                  onClick={() => setBatchOpen((current) => ({ ...current, [shared.id]: !current[shared.id] }))}
                >
                  <i className={`pd-chevron${open ? ' is-open' : ''}`} />
                  {open ? '收起' : '展开'}
                </button>
              </div>
              {open && inactive ? <p className="pd-review">当前站点不是食品或医药，不检测这一项。</p> : null}
              {open && !inactive ? (
                <>
              {groups.map((group) => (
                <div key={group.key} className="pd-done">
                  <b>
                    {shared.name} 已补充资料可优化 · {group.ids.length} 个产品，尚未优化
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
                  <div className="pd-actions">
                    {editing === shared.id ? (
                      <button type="button" className="pd-btn" onClick={() => setEditing(null)}>
                        收起填写
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
                  <p className="pd-review">{reviewSentence(shared.gap)}</p>
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
                          <input value={draft.query} placeholder="搜索产品名" onChange={(event) => setDraft((current) => ({ ...current, query: event.target.value }))} />
                          <div className="pd-chosen">
                            {chosen.length ? (
                              chosen.map((id) => (
                                <button type="button" key={id} className="pd-chip is-on" onClick={() => togglePicked(id)}>
                                  {BY_ID[id].name}
                                  <span>×</span>
                                </button>
                              ))
                            ) : (
                              <span className="pd-hint">还没选。先选分类，再点产品名。</span>
                            )}
                          </div>
                          {pickQuery ? null : (
                            <div className="pd-pick-tabs">
                              {pickCategories.map((item) => (
                                <button
                                  key={item.key}
                                  type="button"
                                  className={pickCategory === item.key ? 'is-on' : ''}
                                  onClick={() => setDraft((current) => ({ ...current, pickCategory: item.key }))}
                                >
                                  {CATEGORY_LABEL[item.key]} {item.count}
                                </button>
                              ))}
                            </div>
                          )}
                          <div className="pd-chips">
                            {pickPool.map((id) => (
                              <button type="button" key={id} className={`pd-chip${draft.picked[id] ? ' is-on' : ''}`} onClick={() => togglePicked(id)}>
                                {BY_ID[id].name}
                              </button>
                            ))}
                          </div>
                          {pickPool.length ? null : <span className="pd-hint">没有叫这个名字的产品</span>}
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
                </>
              ) : null}
            </article>
          )
        })}
      </div>

      </>
      ) : null}
      </div>
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
