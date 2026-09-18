export const LEAD_GEN_TEMPLATE_ID = "lead-gen-plan";

export const PROMPT_TEMPLATE =
  "帮我找 HS 编码为【HS编码】、目的国家/地区是【目标国家/地区名称】的产品采购商，回信邮箱地址是【回信邮箱地址】";

export const WEEKDAYS = [
  { value: 1, label: "周一" },
  { value: 2, label: "周二" },
  { value: 3, label: "周三" },
  { value: 4, label: "周四" },
  { value: 5, label: "周五" },
  { value: 6, label: "周六" },
  { value: 7, label: "周日" },
];

export const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

export const HS_CODES = [
  { code: "848180", name: "阀门（龙头、旋塞及类似装置）" },
  { code: "848110", name: "减压阀" },
  { code: "848130", name: "止回阀" },
  { code: "848140", name: "安全阀或溢流阀" },
  { code: "841370", name: "离心泵" },
  { code: "841381", name: "液体泵" },
  { code: "841459", name: "风扇、风机" },
  { code: "842139", name: "气体过滤、净化装置" },
  { code: "846693", name: "金属加工机床零件" },
  { code: "845710", name: "加工中心（金属切削）" },
  { code: "847989", name: "其他未列名机器及机械器具" },
  { code: "850440", name: "静止式变流器" },
  { code: "853710", name: "数控装置 / 控制柜" },
  { code: "401693", name: "硫化橡胶密封件" },
  { code: "730890", name: "钢铁结构体及零件" },
];

export const COUNTRIES = [
  { code: "US", name: "美国" },
  { code: "DE", name: "德国" },
  { code: "GB", name: "英国" },
  { code: "JP", name: "日本" },
  { code: "KR", name: "韩国" },
  { code: "IN", name: "印度" },
  { code: "VN", name: "越南" },
  { code: "TH", name: "泰国" },
  { code: "ID", name: "印度尼西亚" },
  { code: "MY", name: "马来西亚" },
  { code: "SG", name: "新加坡" },
  { code: "AE", name: "阿联酋" },
  { code: "SA", name: "沙特阿拉伯" },
  { code: "TR", name: "土耳其" },
  { code: "IT", name: "意大利" },
  { code: "FR", name: "法国" },
  { code: "ES", name: "西班牙" },
  { code: "NL", name: "荷兰" },
  { code: "PL", name: "波兰" },
  { code: "RU", name: "俄罗斯" },
  { code: "BR", name: "巴西" },
  { code: "MX", name: "墨西哥" },
  { code: "AU", name: "澳大利亚" },
  { code: "CA", name: "加拿大" },
  { code: "ZA", name: "南非" },
];

export function fillLeadGenPrompt(hsCode, countryName, replyEmail) {
  const hs = String(hsCode || "").trim() || "【HS编码】";
  const country = String(countryName || "").trim() || "【目标国家/地区名称】";
  const email = String(replyEmail || "").trim() || "【回信邮箱地址】";
  return `帮我找 HS 编码为${hs}、目的国家/地区是${country}的产品采购商，回信邮箱地址是${email}`;
}

export function weekdayLabel(value) {
  return WEEKDAYS.find((d) => d.value === Number(value))?.label || "周一";
}

export function formatScheduleText(plan) {
  const time = plan.executeTime || "09:00";
  if (plan.repeatCycle === "monthly") {
    return `每月第${plan.monthDay || 1}天 ${time}`;
  }
  return `每${weekdayLabel(plan.weekday || 1)} ${time}`;
}

export const EMAIL_SEND_MODES = [
  { value: "auto", label: "自动发送" },
  { value: "manual", label: "手动确认后再发送" },
];

export function emailSendModeLabel(mode) {
  return mode === "auto" ? "自动发送" : "手动确认后再发送";
}

export function isAutoEmailSend(plan) {
  return plan?.emailSendMode === "auto";
}

export function planDisplayName(plan) {
  return [plan?.name || "获客计划", plan?.destinationCountryName, plan?.hsCode]
    .filter(Boolean)
    .join(" · ");
}

export function runTaskName(run, plans = []) {
  if (run?.taskName) return run.taskName;
  const plan = Array.isArray(plans) ? plans.find((p) => p.id === run?.planId) : null;
  if (plan) return planDisplayName(plan);
  const detail = String(run?.detail || "");
  const match = detail.match(/^(获客计划(?:\s*·\s*[^·]+){0,2})/);
  if (match) return match[1].trim();
  return "获客计划";
}

export function hsOptionLabel(item) {
  return `${item.code}  ${item.name}`;
}
