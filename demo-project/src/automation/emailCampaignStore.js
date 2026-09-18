const KEY = "ai-ops-email-campaigns-v1";

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

export const SEED_CAMPAIGNS = [
  {
    id: "seed-dried-veg",
    title: "Professional Dried Vegetables & Herbs Supplier From China",
    location: "中国-北京",
    sentAt: Date.parse("2024-05-25T18:29:36"),
    status: "sent",
    recipientCount: 12,
    source: "seed",
    emails: [
      {
        to: "buyer@example.com",
        company: "Global Produce Trading",
        subject: "Professional Dried Vegetables & Herbs Supplier From China",
        preview: "We supply dried vegetables and herbs with stable monthly capacity and export documents ready.",
      },
    ],
  },
  {
    id: "seed-metal-parts",
    title: "High Quality Custom Metal Parts Manufacturer",
    location: "中国-北京",
    sentAt: Date.parse("2024-05-24T11:08:12"),
    status: "sent",
    recipientCount: 8,
    source: "seed",
    emails: [
      {
        to: "purchasing@midwestflow.com",
        company: "Midwest Flow Control Inc.",
        subject: "High Quality Custom Metal Parts Manufacturer",
        preview: "Custom CNC and casting parts with inspection reports before shipment.",
      },
    ],
  },
  {
    id: "seed-valve-draft",
    title: "One-stop Industrial Valve Solutions for Global Buyers",
    location: "中国-北京",
    sentAt: Date.parse("2024-05-22T09:41:05"),
    status: "draft",
    recipientCount: 0,
    source: "seed",
    emails: [],
  },
];

export function campaignIdFromRun(runId) {
  return runId ? `campaign-${runId}` : `campaign-${Date.now()}`;
}

export function loadCampaigns() {
  const stored = readJson(KEY, null);
  if (!Array.isArray(stored) || stored.length === 0) {
    writeJson(KEY, SEED_CAMPAIGNS);
    return [...SEED_CAMPAIGNS];
  }
  const hasSeed = SEED_CAMPAIGNS.every((seed) => stored.some((item) => item.id === seed.id));
  if (hasSeed) {
    return stored.sort((a, b) => (b.sentAt || 0) - (a.sentAt || 0));
  }
  const merged = [...stored];
  for (const seed of SEED_CAMPAIGNS) {
    if (!merged.some((item) => item.id === seed.id)) merged.push(seed);
  }
  writeJson(KEY, merged);
  return merged.sort((a, b) => (b.sentAt || 0) - (a.sentAt || 0));
}

export function upsertCampaign(campaign) {
  if (!campaign?.id) return loadCampaigns();
  const list = loadCampaigns();
  const next = {
    location: "中国-北京",
    status: "sent",
    recipientCount: 0,
    emails: [],
    ...campaign,
    sentAt: campaign.sentAt || Date.now(),
  };
  const idx = list.findIndex((item) => item.id === next.id);
  if (idx >= 0) list[idx] = { ...list[idx], ...next };
  else list.unshift(next);
  writeJson(KEY, list);
  return list.sort((a, b) => (b.sentAt || 0) - (a.sentAt || 0));
}

export function deleteCampaign(id) {
  const list = loadCampaigns().filter((item) => item.id !== id);
  writeJson(KEY, list);
  return list;
}

export function buildCampaignFromLeadGen({ runId, emails = [], buyers = [], recipients = [], sentAt } = {}) {
  const mail = emails[0];
  const mailed = recipients.length ? recipients : (mail?.recipients || buyers.filter((b) => b.inDefaultMail));
  const title = mail?.subject || "Reliable supply partnership from China";
  return {
    id: campaignIdFromRun(runId),
    title,
    location: "中国-北京",
    sentAt: sentAt || Date.now(),
    status: "sent",
    recipientCount: mailed.length || 0,
    source: "lead_gen",
    runId: runId || "",
    emails,
    buyers,
    recipients: mailed,
  };
}
