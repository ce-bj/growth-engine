import { isAutoEmailSend, planDisplayName } from "./constants";
import { scoreDevelopability, sortByDevelopability, defaultMailBuyers } from "./developability";

function clock() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** 演示洞察改为只限数量后的混杂名单：用来对照开发价值规则。 */
export const DEMO_BUYER_FACTS = [
  {
    company: "Pacific Valve Works Co.",
    country: "美国",
    hs: "848180",
    email: "purchasing@pacificvalve.com",
    purchaseCount12m: 12,
    supplierCount: 2,
    purchasedInLast3Months: true,
  },
  {
    company: "Harbor Industrial Supply LLC",
    country: "美国",
    hs: "848180",
    email: "parts@harbor-ind.com",
    purchaseCount12m: 7,
    supplierCount: 13,
    purchasedInLast3Months: true,
  },
  {
    company: "Midwest Flow Control Inc.",
    country: "美国",
    hs: "848180",
    email: "buyer@midwestflow.com",
    purchaseCount12m: 4,
    supplierCount: 2,
    purchasedInLast3Months: true,
  },
  {
    company: "Atlas Process Equipment Ltd.",
    country: "美国",
    hs: "848180",
    email: "sourcing@atlas-process.com",
    purchaseCount12m: 5,
    supplierCount: 4,
    purchasedInLast3Months: true,
  },
  {
    company: "Apex Global Trading Ltd.",
    country: "美国",
    hs: "848180",
    email: "ops@apex-trading.com",
    purchaseCount12m: 8,
    supplierCount: 2,
    purchasedInLast3Months: true,
  },
  {
    company: "Dormant Valve Parts Inc.",
    country: "美国",
    hs: "848180",
    email: "mill@dormantvalve.com",
    purchaseCount12m: 4,
    supplierCount: 2,
    purchasedInLast3Months: false,
  },
  {
    company: "One-Shot Produce Inc.",
    country: "美国",
    hs: "848180",
    email: "info@oneshotproduce.com",
    purchaseCount12m: 1,
    supplierCount: 2,
    purchasedInLast3Months: true,
  },
  {
    company: "Quiet Mill GmbH",
    country: "美国",
    hs: "848180",
    email: "",
    purchaseCount12m: 9,
    supplierCount: 2,
    purchasedInLast3Months: true,
  },
  {
    company: "Northline Pump Components Inc.",
    country: "美国",
    hs: "841370",
    email: "buy@northline-pump.com",
    purchaseCount12m: 8,
    supplierCount: 2,
    purchasedInLast3Months: true,
  },
];

export function buildDemoBuyers(plan) {
  const queryHs = plan?.hsCode;
  const scored = DEMO_BUYER_FACTS.map((item) => scoreDevelopability({
    ...item,
    country: plan?.destinationCountryName || item.country,
    queryHs,
  }, { queryHs }));
  return sortByDevelopability(scored);
}

export function buildGenericOutreachEmail(plan, recipients) {
  const hs = plan?.hsCode || "848180";
  const list = recipients || [];
  return {
    to: list.map((b) => b.email).filter(Boolean).join(", "),
    recipients: list,
    subject: `Reliable HS ${hs} supply partnership from China`,
    preview: "Dear Sir/Madam, We are a China-based manufacturer serving overseas buyers of this HS code. Stable monthly capacity, export documents ready, and sample lead time can be confirmed before PO. Reply to this email if you would like a spec sheet.",
  };
}

export const DEMO_BUYERS = DEMO_BUYER_FACTS;

export function triggerLabel(type) {
  return type === "manual" ? "手动触发" : "自动执行";
}

export function buildLeadGenStartMessages({ plan, prompt, triggerType, runId }) {
  const time = clock();
  const name = planDisplayName(plan);
  const how = triggerLabel(triggerType);
  const autoSend = isAutoEmailSend(plan);
  return [
    {
      type: "user",
      html: prompt || `执行「${name}」`,
      time,
    },
    {
      type: "ai",
      html: autoSend
        ? `已${how}「${name}」。正在向外贸客户洞察提交查询（异步，实际约几分钟）。演示里压缩成几秒，结果会写在这条会话里。名单返回后将按开发价值打标，并为 4 星、5 星自动发送一封通用开发信。`
        : `已${how}「${name}」。正在向外贸客户洞察提交查询（异步，实际约几分钟）。演示里压缩成几秒，结果会写在这条会话里，你可以先离开。名单会打上开发价值；通用开发信默认只覆盖 4 星、5 星，群发前仍需你确认。`,
      time,
    },
    {
      type: "tool",
      id: `lead-query-${runId}`,
      name: "customs_query_third_customer_list",
      title: "外贸客户洞察 · 查询采购商",
      status: "running",
      defaultOpen: true,
      input: `hsCode=${plan.hsCode}\ndestinationCountry=${plan.destinationCountryName}`,
      output: "已提交查询，等待海关库返回…",
      steps: ["提交外贸客户洞察查询", "等待异步结果返回"],
      progressPct: 18,
      time,
    },
  ];
}

export function finishLeadGenDemoMessages({ current, queryId, plan, runId, failed }) {
  const time = clock();
  const buyers = failed ? [] : buildDemoBuyers(plan);
  const mailCount = defaultMailBuyers(buyers).length;
  const done = (current || []).map((m) => {
    if (m.id !== queryId) return m;
    if (failed) {
      return {
        ...m,
        status: "done",
        progressPct: 100,
        output: "查询失败：海关库暂无返回。",
        steps: ["提交外贸客户洞察查询", "等待异步结果返回", "查询失败"],
      };
    }
    return {
      ...m,
      status: "done",
      progressPct: 100,
      output: `已返回 ${buyers.length} 家采购商，已按开发价值打标（4–5 星 ${mailCount} 家写入通用信）`,
      steps: ["提交外贸客户洞察查询", "等待异步结果返回", "打标并生成通用开发信"],
    };
  });
  if (failed) {
    done.push({
      type: "ai",
      html: "这次执行失败了。计划仍会按原周期继续跑；你可以稍后在「我的任务」里手动执行重试。",
      time,
    });
    return done;
  }
  done.push({
    type: "ai",
    html: `已找到 ${buyers.length} 家采购商，并按开发价值打标。五星表示高开发价值、高活跃。默认只为 ${mailCount} 家 4 星、5 星生成一封通用开发信；其余留在名单里并写明原因，不进这封群发。`,
    time,
  });
  done.push(buildLeadGenResultMessage({ plan, runId, buyers }));
  return done;
}

export function buildLeadGenResultMessage({ plan, runId, buyers: presetBuyers }) {
  const buyers = presetBuyers || buildDemoBuyers(plan);
  const autoSend = isAutoEmailSend(plan);
  const mailBuyers = defaultMailBuyers(buyers);
  const generic = buildGenericOutreachEmail(plan, mailBuyers);
  return {
    type: "lead_gen_result",
    id: `lead-result-${runId}`,
    campaignId: `campaign-${runId}`,
    time: clock(),
    actionState: autoSend ? "sent" : "pending",
    sendMode: autoSend ? "auto" : "manual",
    buyers,
    mailRecipients: mailBuyers,
    emails: [generic],
  };
}
