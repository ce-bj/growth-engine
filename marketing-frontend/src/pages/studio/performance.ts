import type { PublishedVersion } from './releaseVersions'

// Mock analytics for the results page (产品设计 7.4): every published version owns its own data, generated
// deterministically from the page id and version so the numbers stay stable across reloads.

export interface VisitRecord {
  id: string; time: string; source: string; placement?: string; device: '电脑' | '手机' | '平板'; region: string
  durationSec: number; depth: number; converted: boolean; action?: string
}
export interface DailyPoint { date: string; visits: number; conversions: number }
export interface PlacementStat { name: string; views: number; clicks: number; arrivals: number; conversions: number }
export interface SourceStat { name: string; visits: number; conversions: number }
export interface VersionPerformance {
  version: string; period: { start: string; end: string }; current: boolean; summary?: string
  daily: DailyPoint[]; records: VisitRecord[]; placements: PlacementStat[]; sources: SourceStat[]; strategyDemo: boolean
  visits: number; conversions: number; leads: number; avgDurationSec: number; bounceRate: number
}

export const RANGES = ['最近 7 天', '最近 30 天', '上线以来'] as const
export type Range = typeof RANGES[number]
const DAY = 86400000
const DEMO_PLACEMENTS = ['页中横幅', '智能客服推送', '首屏 Banner']
const REGIONS = ['广东', '江苏', '浙江', '上海', '北京', '山东', '河北', '四川']
const OTHER_SOURCES = ['直接访问', '搜索引擎', '社媒与外链']

function seeded(key: string) {
  let h = 2166136261
  for (const c of key) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296 }
}
const fmtDate = (t: number) => new Date(t).toISOString().slice(0, 10)

/**
 * Each version gets a synthetic 14-day online period, newest last, so older versions have their own history
 * even though prototype releases happen minutes apart. Newer versions convert slightly better to make the
 * version comparison meaningful.
 */
export function versionPerformance(pageId: string, history: PublishedVersion[], index: number, range: Range, now = Date.now()): VersionPerformance {
  const v = history[index]
  const newest = index === history.length - 1
  const age = history.length - 1 - index
  const end = now - age * 14 * DAY
  const start = end - 14 * DAY
  const rand = seeded(`${pageId}:${v.version}`)
  const span = newest ? (range === '最近 7 天' ? 7 : range === '最近 30 天' ? 30 : 14) : 14
  const convRate = 0.03 + index * 0.008 + rand() * 0.01
  const enabled = (v.draft.promote ? v.draft.placements.filter(p => p.enabled).map(p => p.name) : [])
  // Visits only come from placements that this version actually enabled.
  const placements = enabled
  const weights = [...placements.map(() => 0.18 + rand() * 0.2), ...OTHER_SOURCES.map(() => 0.08 + rand() * 0.12)]
  const total = weights.reduce((a, b) => a + b, 0)
  const sources = [...placements, ...OTHER_SOURCES]
  const daily: DailyPoint[] = []
  const records: VisitRecord[] = []
  for (let d = span - 1; d >= 0; d--) {
    const day = end - d * DAY
    const visits = Math.round(40 + rand() * 70 + (d % 7 < 2 ? -12 : 8))
    let conversions = 0
    for (let i = 0; i < visits; i++) {
      let r = rand() * total, s = 0
      while (r > weights[s] && s < weights.length - 1) r -= weights[s++]
      const converted = rand() < convRate * (s < placements.length ? 1.2 : 0.8)
      if (converted) conversions++
      // Keep a detail record for a sample of visits; the list shows the most recent ones.
      if (d < 3 || converted || rand() < 0.12) records.push({
        id: `${v.version}-${d}-${i}`, time: new Date(day - rand() * DAY * 0.9).toISOString(),
        source: s < placements.length ? '站内推广' : sources[s], placement: s < placements.length ? sources[s] : undefined,
        device: rand() < 0.55 ? '电脑' : rand() < 0.85 ? '手机' : '平板', region: REGIONS[Math.floor(rand() * REGIONS.length)],
        durationSec: Math.round(15 + rand() * (converted ? 260 : 140)), depth: Math.round(20 + rand() * (converted ? 80 : 60)),
        converted, action: converted ? `提交表单 · ${v.draft.goal}` : undefined,
      })
    }
    daily.push({ date: fmtDate(day), visits, conversions })
  }
  const visits = daily.reduce((a, p) => a + p.visits, 0)
  const conversions = daily.reduce((a, p) => a + p.conversions, 0)
  const placementStats = placements.length ? placements.map(name => {
    const own = records.filter(r => r.placement === name)
    const share = own.length / Math.max(1, records.length)
    const arrivals = Math.round(visits * share)
    const clicks = Math.round(arrivals / (0.9 + rand() * 0.08))
    return { name, arrivals, clicks, views: Math.round(clicks / (0.03 + rand() * 0.05)), conversions: Math.round(conversions * (own.filter(r => r.converted).length / Math.max(1, records.filter(r => r.converted).length))) }
  })
    // No promotion in this version: the strategy table shows clearly labelled demo rows, unrelated to the visits.
    : DEMO_PLACEMENTS.map(name => { const arrivals = Math.round(60 + rand() * 120); const clicks = Math.round(arrivals / 0.94); return { name, arrivals, clicks, views: Math.round(clicks / (0.03 + rand() * 0.05)), conversions: Math.round(arrivals * (0.02 + rand() * 0.05)) } })
  // Non-promotion sources use the same scaling as placements, so placements and sources add up to the totals.
  const convertedSample = Math.max(1, records.filter(r => r.converted).length)
  const sourceStats = OTHER_SOURCES.map(name => { const own = records.filter(r => r.source === name); return { name, visits: Math.round(visits * own.length / Math.max(1, records.length)), conversions: Math.round(conversions * own.filter(r => r.converted).length / convertedSample) } })
  records.sort((a, b) => b.time.localeCompare(a.time))
  return {
    version: v.version!, period: { start: fmtDate(start), end: newest ? '至今' : fmtDate(end) }, current: newest, summary: v.summary,
    daily, records, placements: placementStats, sources: sourceStats, strategyDemo: !enabled.length,
    visits, conversions, leads: Math.round(conversions * 0.85), avgDurationSec: Math.round(records.reduce((a, r) => a + r.durationSec, 0) / Math.max(1, records.length)),
    bounceRate: Math.round(25 + rand() * 20),
  }
}

export const rate = (part: number, whole: number) => whole ? `${(part / whole * 100).toFixed(1)}%` : '—'
export const duration = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`
