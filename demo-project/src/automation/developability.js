/** 开发价值：五星 = 高开发价值、高活跃。规则对齐评审稿第 7 节（洞察五步图）。 */

export const HIGH_ACTIVITY_MIN = 6;

export const MIDDLEMAN_KEYWORDS = [
  "trading",
  "trade",
  "import",
  "export",
  "wholesale",
  "distributor",
  "agent",
];

export const TAG_DEFS = {
  hsExact: { key: "hsExact", label: "HS精确匹配", polarity: "pos" },
  hsMismatch: { key: "hsMismatch", label: "HS非精确匹配", polarity: "neg" },
  stablePurchase: { key: "stablePurchase", label: "稳定采购", polarity: "pos" },
  occasionalPurchase: { key: "occasionalPurchase", label: "偶发采购", polarity: "neg" },
  lowCompetition: { key: "lowCompetition", label: "竞争少易切入", polarity: "pos" },
  scatteredBuy: { key: "scatteredBuy", label: "采购分散易替换", polarity: "pos" },
  averageStructure: { key: "averageStructure", label: "结构一般", polarity: "neg" },
  suspectedTrader: { key: "suspectedTrader", label: "疑似中间商", polarity: "neg" },
  active3m: { key: "active3m", label: "近3个月活跃", polarity: "pos" },
  stopped3m: { key: "stopped3m", label: "近3个月停采", polarity: "neg" },
  hasEmail: { key: "hasEmail", label: "有邮箱", polarity: "pos" },
  noEmail: { key: "noEmail", label: "无邮箱", polarity: "neg" },
};

function tokensOf(name) {
  return String(name || "")
    .toLowerCase()
    .split(/[^a-z0-9\u4e00-\u9fff]+/)
    .filter(Boolean);
}

export function buyerKey(buyer) {
  return String(buyer?.email || buyer?.company || "").trim();
}

export function isEasyEntrySupplier(count) {
  const n = Number(count) || 0;
  return (n >= 1 && n <= 3) || n > 5;
}

export function isSuspectedMiddleman(company, flagged) {
  if (flagged === true) return true;
  if (flagged === false) return false;
  const tokens = new Set(tokensOf(company));
  return MIDDLEMAN_KEYWORDS.some((word) => tokens.has(word));
}

export function isHsExact(recordHs, queryHs) {
  const record = String(recordHs || "").replace(/\D/g, "");
  const query = String(queryHs || "").replace(/\D/g, "");
  if (!query) return true;
  return Boolean(record) && record === query;
}

export function buildDevelopabilityReason({
  purchaseCount12m,
  supplierCount,
  purchasedInLast3Months,
  hasEmail,
  middleman,
  easyEntry,
  hsExact,
  hitKeyword,
}) {
  const parts = [];
  parts.push(hsExact ? "HS精确匹配" : "HS非精确匹配");
  parts.push(`近12月采购${purchaseCount12m}次`);
  parts.push(purchasedInLast3Months ? "最近一次采购在3个月内" : "近3个月无采购");
  if (easyEntry) {
    parts.push(
      supplierCount > 5
        ? `供应商${supplierCount}家（采购分散，易替换）`
        : `供应商${supplierCount}家（竞争少，易切入）`,
    );
  } else {
    parts.push(`供应商${supplierCount}家（结构一般）`);
  }
  if (middleman) parts.push(hitKeyword ? `名称含「${hitKeyword}」` : "名称命中中间商关键词");
  parts.push(hasEmail ? "有邮箱" : "无邮箱");
  return parts.join("，");
}

function matchedMiddlemanKeyword(company) {
  const tokens = new Set(tokensOf(company));
  return MIDDLEMAN_KEYWORDS.find((word) => tokens.has(word)) || "";
}

export function scoreDevelopability(raw = {}, { queryHs } = {}) {
  const purchaseCount12m = Number(raw.purchaseCount12m) || 0;
  const supplierCount = Number(raw.supplierCount) || 0;
  const purchasedInLast3Months = !!raw.purchasedInLast3Months;
  const email = String(raw.email || "").trim();
  const hasEmail = Boolean(email);
  const recordHs = raw.hsCode || raw.hs;
  const hsExact = isHsExact(recordHs, queryHs || raw.queryHs || recordHs);
  const hitKeyword = matchedMiddlemanKeyword(raw.company);
  const middleman = isSuspectedMiddleman(raw.company, raw.suspectedMiddleman);
  const easyEntry = isEasyEntrySupplier(supplierCount);
  const highActivity = purchaseCount12m >= HIGH_ACTIVITY_MIN;

  const tags = [];
  tags.push(hsExact ? TAG_DEFS.hsExact : TAG_DEFS.hsMismatch);
  tags.push(purchaseCount12m >= 3 ? TAG_DEFS.stablePurchase : TAG_DEFS.occasionalPurchase);
  if (supplierCount >= 1 && supplierCount <= 3) tags.push(TAG_DEFS.lowCompetition);
  else if (supplierCount > 5) tags.push(TAG_DEFS.scatteredBuy);
  else tags.push(TAG_DEFS.averageStructure);
  if (middleman) tags.push(TAG_DEFS.suspectedTrader);
  tags.push(purchasedInLast3Months ? TAG_DEFS.active3m : TAG_DEFS.stopped3m);
  tags.push(hasEmail ? TAG_DEFS.hasEmail : TAG_DEFS.noEmail);

  let cap = 5;
  if (!hasEmail) cap = Math.min(cap, 1);
  if (middleman) cap = Math.min(cap, 2);
  if (!purchasedInLast3Months) cap = Math.min(cap, 2);
  if (purchaseCount12m < 3) cap = Math.min(cap, 2);
  if (!hsExact) cap = Math.min(cap, 2);

  let score = 3;
  if (cap < 3) {
    score = cap;
  } else {
    if (easyEntry) score += 1;
    if (highActivity) score += 1;
    score = Math.min(score, cap);
  }

  const reason = buildDevelopabilityReason({
    purchaseCount12m,
    supplierCount,
    purchasedInLast3Months,
    hasEmail,
    middleman,
    easyEntry,
    hsExact,
    hitKeyword,
  });

  return {
    ...raw,
    email,
    hs: recordHs,
    purchaseCount12m,
    supplierCount,
    purchasedInLast3Months,
    tags,
    score,
    reason,
    inDefaultMail: score >= 4 && hasEmail,
    canOptInMail: score === 3 && hasEmail,
    excludeMail: score <= 2 || !hasEmail,
  };
}

export function defaultMailBuyers(buyers) {
  return (buyers || []).filter((b) => b.inDefaultMail);
}

export function sortByDevelopability(buyers) {
  return [...(buyers || [])].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return String(a.company || "").localeCompare(String(b.company || ""));
  });
}
