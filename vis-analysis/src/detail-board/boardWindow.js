import { getLeadCount, getStages, regionBoard, trafficBoard } from "../funnel-review/data.js";

/** 近 7 天的日独立访客，合计等于全站访问入口。后两个窗口的末段与它衔接。 */
const D7_VALUES = [198, 214, 236, 221, 248, 265, 268];
const WINDOW_END = new Date(2026, 8, 20);
const WEEKDAY = [0.74, 1, 1.05, 1.08, 1.04, 0.98, 0.7];

export const BOARD_RANGES = [
  { value: "d7", label: "近 7 天", days: 7 },
  { value: "d30", label: "近 30 天", days: 30 },
  { value: "d90", label: "近 3 个月", days: 90 },
];

const CHANNELS = ["search", "direct", "referral", "ads", "ai"];

function datesEnding(days) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(WINDOW_END);
    date.setDate(WINDOW_END.getDate() - (days - 1 - index));
    return date;
  });
}

function dayLabel(date) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** 按权重把整数分到目标和，避免四舍五入之后对不上。 */
export function allocate(weights, total) {
  const sum = weights.reduce((acc, value) => acc + value, 0);
  if (!sum || total <= 0) return weights.map(() => 0);
  const raw = weights.map((value) => (value / sum) * total);
  const floors = raw.map((value) => Math.floor(value));
  let remain = total - floors.reduce((acc, value) => acc + value, 0);
  raw
    .map((value, index) => ({ index, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac)
    .forEach((item) => {
      if (remain > 0) {
        floors[item.index] += 1;
        remain -= 1;
      }
    });
  return floors;
}

function grow(days, tail, startRatio) {
  const dates = datesEnding(days);
  const headLen = days - tail.length;
  const recent = tail.reduce((acc, value) => acc + value, 0) / tail.length;
  const head = dates.slice(0, headLen).map((date, index) => {
    const progress = headLen <= 1 ? 1 : index / (headLen - 1);
    const level = recent * (startRatio + (0.92 - startRatio) * progress);
    return Math.max(30, Math.round(level * WEEKDAY[date.getDay()]));
  });
  return { labels: dates.map(dayLabel), values: head.concat(tail) };
}

function frameOf(range) {
  const spec = BOARD_RANGES.find((item) => item.value === range) || BOARD_RANGES[0];
  const baseUv = getStages("site")[0].cur;
  let trend;
  if (spec.days === 7) trend = { labels: datesEnding(7).map(dayLabel), values: D7_VALUES };
  else if (spec.days === 30) trend = grow(30, D7_VALUES, 0.58);
  else trend = grow(90, grow(30, D7_VALUES, 0.58).values, 0.48);
  const siteUv = trend.values.reduce((acc, value) => acc + value, 0);
  return {
    ...spec,
    compare: spec.days === 7,
    unit: "日独立访客",
    labels: trend.labels,
    values: trend.values,
    span: `${trend.labels[0]} – ${trend.labels[trend.labels.length - 1]}`,
    siteUv,
    factor: siteUv / baseUv,
  };
}

function scaleTraffic(frame) {
  const base = trafficBoard();
  if (frame.factor === 1) return base;
  const live = base.cats.filter((cat) => cat.uv != null);
  const uvs = allocate(live.map((cat) => cat.uv), frame.siteUv);
  const pvTarget = Math.round(live.reduce((acc, cat) => acc + cat.pv, 0) * frame.factor);
  const pvs = allocate(live.map((cat) => cat.pv), pvTarget);
  let cursor = 0;
  const cats = base.cats.map((cat) => {
    if (cat.uv == null) return cat;
    const uv = uvs[cursor];
    const pv = pvs[cursor];
    cursor += 1;
    const sourceUv = allocate(cat.sources.map((item) => item.uv), uv);
    const sourcePv = allocate(cat.sources.map((item) => item.pv), pv);
    return {
      ...cat,
      uv,
      pv,
      sources: cat.sources.map((item, index) => ({ ...item, uv: sourceUv[index], pv: sourcePv[index] })),
    };
  });
  return { siteUv: frame.siteUv, cats, sources: cats.flatMap((cat) => cat.sources) };
}

function scaleStages(frame, traffic) {
  const ids = ["site", ...CHANNELS];
  if (frame.factor === 1) return Object.fromEntries(ids.map((id) => [id, getStages(id)]));
  const book = {};
  CHANNELS.forEach((id) => {
    book[id] = getStages(id).map((stage) => ({ ...stage }));
  });
  const entryOf = Object.fromEntries(traffic.cats.filter((cat) => cat.channelId).map((cat) => [cat.channelId, cat.uv]));
  CHANNELS.forEach((id) => {
    book[id][0] = { ...book[id][0], cur: entryOf[id] };
  });
  for (let layer = 1; layer < 4; layer += 1) {
    const weights = CHANNELS.map((id) => getStages(id)[layer].cur);
    const target = Math.round(getStages("site")[layer].cur * frame.factor);
    const parts = allocate(weights, target);
    CHANNELS.forEach((id, index) => {
      book[id][layer] = { ...book[id][layer], cur: Math.min(book[id][layer - 1].cur, parts[index]) };
    });
  }
  const site = getStages("site").map((stage) => ({ ...stage }));
  for (let layer = 0; layer < 4; layer += 1) {
    site[layer] = { ...site[layer], cur: CHANNELS.reduce((acc, id) => acc + book[id][layer].cur, 0) };
  }
  book.site = site;
  return book;
}

function applyLead(traffic, stages) {
  const cats = traffic.cats.map((cat) => {
    if (!cat.channelId) return cat;
    const leads = stages[cat.channelId][3].cur;
    const sourceLeads = allocate(cat.sources.map((item) => item.leads), leads);
    return {
      ...cat,
      leads,
      sources: cat.sources.map((item, index) => ({ ...item, leads: sourceLeads[index] })),
    };
  });
  return { ...traffic, sources: cats.flatMap((cat) => cat.sources), cats };
}

function scaleRegions(frame, leadVisitors) {
  const base = regionBoard();
  if (frame.factor === 1) return base;
  const flat = base.countries.flatMap((country) => country.cities);
  const uvs = allocate(flat.map((city) => city.uv), frame.siteUv);
  const pvs = allocate(
    flat.map((city) => city.pv),
    Math.round(flat.reduce((acc, city) => acc + city.pv, 0) * frame.factor),
  );
  const leads = allocate(flat.map((city) => city.leads), leadVisitors);
  let cursor = 0;
  const countries = base.countries.map((country) => {
    const cities = country.cities.map((city) => {
      const row = { ...city, uv: uvs[cursor], pv: pvs[cursor], leads: leads[cursor] };
      cursor += 1;
      return row;
    });
    const sumOf = (key) => cities.reduce((acc, city) => acc + city[key], 0);
    return { ...country, uv: sumOf("uv"), pv: sumOf("pv"), leads: sumOf("leads"), cities };
  }).sort((a, b) => b.pv - a.pv);
  return {
    countries,
    cities: countries.flatMap((country) => country.cities).sort((a, b) => b.pv - a.pv),
  };
}

export function buildBoardModel(range) {
  const frame = frameOf(range);
  const stages = scaleStages(frame, scaleTraffic(frame));
  const traffic = applyLead(scaleTraffic(frame), stages);
  const baseLead = getLeadCount("site");
  const leadCount = frame.factor === 1
    ? baseLead
    : { cur: Math.max(stages.site[3].cur, Math.round(baseLead.cur * frame.factor)), prev: baseLead.prev };
  return {
    frame,
    stages,
    traffic,
    leadCount,
    regions: scaleRegions(frame, stages.site[3].cur),
  };
}
