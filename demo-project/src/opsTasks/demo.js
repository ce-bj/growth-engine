export const OPS_DIAGNOSIS_HINT = "这周询盘怎么少了";

export function isOpsDiagnosisQuery(text) {
  const t = String(text || "").trim();
  if (!t) return false;
  if (t === OPS_DIAGNOSIS_HINT) return true;
  return /询盘/.test(t) && /(少|掉|为什么|怎么)/.test(t);
}

export function buildDiagnosisPayload() {
  return {
    summaryHtml:
      "主力球阀详情页首屏没有口径和材质，访客看两眼就走。站内能做的就这一件；投放预算我动不了。",
    tasks: [
      {
        id: "task-edit-q41f",
        title: "改主力球阀详情",
        boundary: "confirm",
        skill: "product_edit_flow",
        objectUrl: "https://www.bj-valve.com/products/q41f-16p.html",
        objectLabel: "Q41F-16P 不锈钢法兰球阀",
        filled: "首屏补 DN50 / PN16 / 不锈钢 304",
        stopAt: "出草稿，不直接上线",
        siteId: "site-cn",
        siteName: "北京阀门 · 中文站",
        status: "pending",
      },
      {
        id: "task-ads-advice",
        title: "投放文案和落地页对不齐",
        boundary: "advice",
        note: "要投放侧把落地地址切到新页。助手不改广告后台。",
        status: "pending",
      },
    ],
  };
}

function clock() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function patchTasksInMessages(messages, messageId, taskId, patch) {
  return (messages || []).map((msg) => {
    if (msg.id !== messageId || msg.type !== "ops_tasks") return msg;
    return {
      ...msg,
      tasks: (msg.tasks || []).map((task) => (
        task.id === taskId ? { ...task, ...patch } : task
      )),
    };
  });
}

export function buildOpsTaskStartMessages(task) {
  const time = clock();
  return [
    {
      type: "ai",
      id: "ops-accept",
      opsTaskRun: true,
      html: `已接单：${task.title}。对象是 ${task.objectLabel}，走「修改产品」，工单参数已带上，不再问一遍。先出草稿，发布还要你在产品页上点。`,
      time,
    },
    {
      type: "tool",
      id: "ops-edit-tool",
      opsTaskRun: true,
      name: "product_edit_flow",
      title: "修改产品 · 局部改首屏",
      status: "running",
      defaultOpen: true,
      input: `site=${task.siteId}\nurl=${task.objectUrl}\npatch=${task.filled}`,
      output: "正在按工单改这一页…",
      steps: ["读取网站档案", "对照产品页首屏", "写入草稿"],
      progressPct: 22,
      time,
    },
  ];
}

export function finishOpsTaskMessages(current, task) {
  const time = clock();
  const next = (current || []).map((msg) => {
    if (msg.id !== "ops-edit-tool") return msg;
    return {
      ...msg,
      status: "done",
      progressPct: 100,
      output: `已写入草稿：${task.filled}。尚未发布。`,
    };
  });
  next.push({
    type: "ai",
    id: "ops-draft-ready",
    opsTaskRun: true,
    html: "首屏已补口径、压力、材质。还没发布。打开右侧产品页检查，发布用页上的按钮。",
    time,
  });
  return next;
}
