const INSIGHT_KEY = "ai-ops-prereq-insight-installed";
const DOMAIN_OK_KEY = "ai-ops-prereq-email-domain-ok";
const DOMAIN_VALUE_KEY = "ai-ops-prereq-email-domain-value";

function readFlag(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return raw === "1" || raw === "true";
  } catch {
    return fallback;
  }
}

function writeFlag(key, value) {
  try {
    localStorage.setItem(key, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function getInsightInstalled() {
  return readFlag(INSIGHT_KEY, false);
}

export function setInsightInstalled(value) {
  writeFlag(INSIGHT_KEY, Boolean(value));
}

export function getEmailDomainOk() {
  return readFlag(DOMAIN_OK_KEY, false);
}

export function getEmailDomainValue() {
  try {
    return localStorage.getItem(DOMAIN_VALUE_KEY) || "";
  } catch {
    return "";
  }
}

export function setEmailDomainConfig({ domain, verified }) {
  writeFlag(DOMAIN_OK_KEY, Boolean(verified));
  try {
    if (domain != null) localStorage.setItem(DOMAIN_VALUE_KEY, String(domain).trim());
  } catch {
    /* ignore */
  }
}

export async function checkLeadGenPrerequisites() {
  return {
    insightInstalled: getInsightInstalled(),
    emailDomainOk: getEmailDomainOk(),
  };
}

export const LEAD_GEN_MOCK_SCENARIOS = [
  { id: "insight-missing", label: "外贸客户洞察未安装" },
  { id: "domain-missing", label: "群发域名未通过" },
  { id: "pass", label: "校验通过" },
  { id: "run-fail", label: "下次执行失败" },
];

const RUN_FAIL_KEY = "ai-ops-mock-run-fail";

export function getMockRunFail() {
  return readFlag(RUN_FAIL_KEY, false);
}

export function setMockRunFail(value) {
  writeFlag(RUN_FAIL_KEY, Boolean(value));
}

export function getLeadGenMockScenario() {
  if (getMockRunFail()) return "run-fail";
  const insight = getInsightInstalled();
  const domain = getEmailDomainOk();
  if (!insight) return "insight-missing";
  if (!domain) return "domain-missing";
  return "pass";
}

export function setLeadGenMockScenario(id) {
  if (id === "insight-missing") {
    setMockRunFail(false);
    setInsightInstalled(false);
    return;
  }
  if (id === "domain-missing") {
    setMockRunFail(false);
    setInsightInstalled(true);
    setEmailDomainConfig({ domain: getEmailDomainValue(), verified: false });
    return;
  }
  if (id === "run-fail") {
    setInsightInstalled(true);
    setEmailDomainConfig({
      domain: getEmailDomainValue() || "mail.demo.com",
      verified: true,
    });
    setMockRunFail(true);
    return;
  }
  setMockRunFail(false);
  setInsightInstalled(true);
  setEmailDomainConfig({
    domain: getEmailDomainValue() || "mail.demo.com",
    verified: true,
  });
}
