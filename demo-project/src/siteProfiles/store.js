import { MOCK_SITES } from "./mockSites.js";
import { HEADER_FIELDS, NAV_COLUMNS, SECTIONS } from "./schema.js";

const STORAGE_KEY = "ai-ops-site-profiles-v2";

const EXTRACT_PENDING_FIELDS = [
  "当前主推（最多 5 个，名称以网站为准）",
  "对外电话",
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

export function formatToday() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function formatNow() {
  const d = new Date();
  return `${formatToday()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function normalizeSite(site) {
  const next = clone(site) || {};
  next.status = next.status === "pending" ? "pending" : "saved";
  next.pendingFields = Array.isArray(next.pendingFields) ? next.pendingFields : [];
  next.savedAt = next.savedAt || "";
  return next;
}

export function applySiteExtract(site) {
  const next = normalizeSite(site);
  next.header = { ...(next.header || {}), 最近抽取日期: formatToday() };
  next.status = "pending";
  next.pendingFields = [...EXTRACT_PENDING_FIELDS];
  return next;
}

export function applySiteSave(site) {
  const next = normalizeSite(site);
  next.status = "saved";
  next.pendingFields = [];
  next.savedAt = formatNow();
  return next;
}

export function siteStatusLabel(site) {
  if (site?.status === "pending") return "待确认";
  if (site?.savedAt) return `已保存 ${site.savedAt}`;
  return "已保存";
}

function cell(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function fieldCaption(label) {
  return String(label).includes("：") ? `${label}` : `${label}：`;
}

function bullet(label, value) {
  const text = String(value ?? "").trim();
  const prefix = `- ${fieldCaption(label)}`;
  if (!text) return prefix;
  if (text.includes("\n")) {
    const lines = text.split("\n").map((line) => `  ${line}`).join("\n");
    return `${prefix}\n${lines}`;
  }
  const joiner = String(label).includes("：") ? " " : "";
  return `${prefix}${joiner}${text}`;
}

export function siteToMarkdown(site) {
  const lines = ["# 网站档案", ""];
  for (const field of HEADER_FIELDS) {
    lines.push(bullet(field, site?.header?.[field]));
  }

  for (const section of SECTIONS) {
    lines.push("", `## ${section.title}`, "");
    const block = site?.sections?.[section.title] || {};
    if (section.nav) {
      lines.push(`| ${NAV_COLUMNS.join(" | ")} |`);
      lines.push(`|${NAV_COLUMNS.map(() => "------").join("|")}|`);
      const rows = Array.isArray(block.nav) && block.nav.length ? block.nav : [{}];
      for (const row of rows) {
        lines.push(
          `| ${NAV_COLUMNS.map((col) => cell(row?.[col])).join(" | ")} |`,
        );
      }
      lines.push("");
      const extras = block.extras || {};
      for (const field of section.fields) {
        lines.push(bullet(field, extras[field]));
      }
    } else {
      for (const field of section.fields) {
        lines.push(bullet(field, block[field]));
      }
    }
  }

  return lines.join("\n");
}

export function formatSiteArchivesForAgent(sites) {
  const list = Array.isArray(sites) ? sites : [];
  const bodies = list.map((site) => {
    const status = site?.status === "pending" ? "待确认" : "已确认";
    const pending = (site?.pendingFields || []).join("、");
    const head = pending
      ? `页头状态：${status}\n待确认字段：${pending}`
      : `页头状态：${status}`;
    return `${head}\n\n${siteToMarkdown(site)}`;
  }).join("\n\n---\n\n");
  return [
    "【网站档案】",
    `本门户共 ${list.length} 个网站。已确认字段按事实使用。待确认字段不用于硬事实。空字段不要编。发到哪个站、改哪一页按任务问。`,
    "",
    bodies,
  ].join("\n");
}

export function loadSiteProfiles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        return parsed.map(normalizeSite);
      }
    }
  } catch {
    /* ignore */
  }
  const sites = clone(MOCK_SITES).map(normalizeSite);
  saveSiteProfiles(sites);
  return sites;
}

export function saveSiteProfiles(sites) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sites));
  } catch {
    /* ignore */
  }
}
