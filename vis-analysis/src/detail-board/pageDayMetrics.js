/** 页面日表按路径汇总后的指标。分子分母都在这张表里，不和访问路径上的 UV 混除。 */

function num(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function rate(part, whole) {
  if (!whole) return null
  return part / whole
}

export function normalizePagePath(path) {
  let text = path || "/"
  try {
    text = decodeURIComponent(text)
  } catch {
    /* 保持原样 */
  }
  const cut = text.search(/[?#]/)
  if (cut >= 0) text = text.slice(0, cut)
  if (!text.startsWith("/")) text = `/${text}`
  if (text.length > 1 && text.endsWith("/")) text = text.slice(0, -1)
  return text || "/"
}

export function readPageDay(text) {
  const index = {}
  text.split("\n").forEach((line) => {
    if (!line.trim()) return
    const [win, channel, path, qual, uv, scrollSum, scrollN, viewed, convert, formEdit, submitUv] = line.split("\t")
    if (!win || !channel || !path) return
    if (!index[win]) index[win] = {}
    if (!index[win][channel]) index[win][channel] = {}
    index[win][channel][path] = {
      qual: num(qual),
      uv: num(uv),
      scrollSum: num(scrollSum),
      scrollN: num(scrollN),
      viewed: num(viewed),
      convert: num(convert),
      formEdit: num(formEdit),
      submitUv: num(submitUv),
    }
  })
  return index
}

const EMPTY = {
  qualifyRate: null,
  qualifyRatePrev: null,
  scroll: null,
  viewed: null,
  interactRate: null,
  started: null,
  formDone: null,
  chatLead: null,
  pageLeads: null,
  leadUv: null,
}

export function pageDayFields(index, win, channel, path) {
  const key = normalizePagePath(path)
  const hit = index[win]?.[channel]?.[key]
  if (!hit) return EMPTY
  const prev = win === "d7" ? index.p7?.[channel]?.[key] : null
  return {
    qualifyRate: rate(hit.qual, hit.uv),
    qualifyRatePrev: prev ? rate(prev.qual, prev.uv) : null,
    scroll: hit.scrollN ? hit.scrollSum / hit.scrollN / 100 : null,
    viewed: hit.viewed,
    interactRate: rate(hit.convert, hit.viewed),
    started: hit.convert,
    formDone: rate(hit.submitUv, hit.formEdit),
    chatLead: null,
    pageLeads: hit.submitUv,
    leadUv: hit.submitUv,
  }
}
