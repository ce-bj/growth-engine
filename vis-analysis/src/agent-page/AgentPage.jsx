import { useEffect, useMemo, useRef, useState } from "react";
import { App as AntApp, Alert, Button, Card, ConfigProvider, Dropdown, Empty, Flex, Modal, Segmented, Skeleton, Spin, Steps, Table, Tag, Tooltip } from "antd";
import {
  CheckCircleFilled,
  DownOutlined,
  ExclamationCircleFilled,
  FlagFilled,
  LoadingOutlined,
  LockOutlined,
} from "@ant-design/icons";
import {
  BRIEFS,
  LEADS,
  LAUNCH_STAGE,
  PREVIEW_STAGE,
  MONTHLY_REPORT,
  SUGGESTIONS,
  TRACK_STAGES,
  TRACKING,
  VERDICTS,
} from "../diagnosisPeriod.js";
import { BOARD_THEME } from "../board-theme.js";
import InsightStrategyWorkspace from "./InsightStrategyWorkspace.jsx";

const SKIP_REASONS = [
  { key: "doing", label: "这件事我已经在做了", effect: "下周如果还是这个问题，不再重复发给你。" },
  { key: "disagree", label: "我不同意这个判断", effect: "我们记下来，以后换一种做法。" },
  { key: "later", label: "以后再说", effect: "下周如果问题还在，会再提醒你。" },
];

function displayExecutor(name) {
  if (name === "内容运营智能体" || name === "内容发布智能体") return "官网内容发布";
  if (name === "智能营销页智能体") return "智能营销页";
  return name || "";
}

function liveHref(row) {
  const path = row?.target || "";
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  return `https://www.demo-cnc-oem.com${path.startsWith("/") ? path : `/${path}`}`;
}

function embeddedFrame() {
  return typeof window !== "undefined" && window.parent && window.parent !== window;
}

function decisionsFromFlow(flow) {
  const map = {};
  Object.keys(flow?.approvedStrategies || {}).forEach((key) => {
    map[key] = { status: "approved" };
  });
  Object.entries(flow?.skippedStrategies || {}).forEach(([key, reasonLabel]) => {
    const reason = SKIP_REASONS.find((item) => item.label === reasonLabel) || SKIP_REASONS[2];
    map[key] = { status: "skipped", reason };
  });
  return map;
}

const ARMED_DECISIONS = {
  "t-detail": { status: "approved" },
  "t-landing": { status: "approved" },
  "t-article": { status: "skipped", reason: SKIP_REASONS[2] },
};

function requirementLines(item) {
  if (item?.requirementSections?.length) {
    return item.requirementSections.flatMap((section) => {
      const head = section.mode ? `${section.label}（${section.mode}）` : section.label;
      return [head, ...(section.lines || [])];
    });
  }
  return item?.requirements || [];
}
import "./agent-page.css";

const SOURCE_STATE = {
  ok: { icon: <CheckCircleFilled />, label: "已取到" },
  unauthorized: { icon: <LockOutlined />, label: "未授权" },
  missing: { icon: <ExclamationCircleFilled />, label: "缺资料" },
};

/** 仅两类专项执行子智能体：智能营销页智能体、内容运营智能体。 */
const AGENT_VIEW = {
  智能营销页智能体: "marketing",
  内容运营智能体: "content",
  内容发布智能体: "content",
};

function encodeTask(task) {
  const bytes = new TextEncoder().encode(JSON.stringify(task));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function trackStage(row) {
  return Math.min(row.stage ?? 0, LAUNCH_STAGE);
}

function SectionTitle({ title, extra }) {
  return (
    <div className="ag-section-head">
      <h2>{title}</h2>
      {extra ? <div className="ag-section-extra">{extra}</div> : null}
    </div>
  );
}

const RUN_STATES = [
  { id: "off", label: "未开启" },
  { id: "running", label: "分析中" },
  { id: "pending", label: "未处理完成" },
  { id: "done", label: "处理完成" },
  { id: "rerun", label: "新分析任务在跑" },
];

const WORKBENCH_STATES = new Set(["pending", "done", "rerun"]);
const HANDLED_STATES = new Set(["done", "rerun"]);
const ANALYZING_STATES = new Set(["running", "rerun"]);

export function MockStateSwitch({ value, onChange }) {
  return (
    <Dropdown
      trigger={["click"]}
      classNames={{ root: "ag-mock-menu", item: "ag-mock-item" }}
      styles={{ root: { minWidth: 200 } }}
      menu={{
        selectable: true,
        selectedKeys: [value],
        items: RUN_STATES.map((item) => ({ key: item.id, label: item.label })),
        onClick: ({ key }) => onChange(key),
      }}
    >
      <Button size="small" type="dashed" aria-label="演示状态">
        Mock
        <DownOutlined />
      </Button>
    </Dropdown>
  );
}

function GateScreen({ onStart }) {
  return (
    <div className="ag-gate">
      <div className="ag-gate-inner">
        <div className="ag-gate-kicker">
          <span className="ag-gate-pill">访客洞察与策略</span>
          <span>诊断与决策 · 每周转化诊断</span>
        </div>
        <h1>让访客看得进、留得下</h1>
        <p>
          每周看访客漏斗与趋势，找出没接住的页面。
          <br />
          同页列出网站问题与改版策略，<em>改哪些由你点</em>。
          <br />
          同意之后，营销页和内容智能体接着做。
        </p>
        <button type="button" className="ag-gate-start" onClick={onStart}>
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path fill="currentColor" d="M5.2 3.2v9.6L13 8 5.2 3.2z" />
          </svg>
          开始分析
        </button>
        <small>先看 9月14日 – 9月20日</small>
      </div>
    </div>
  );
}

function AnalyzingMotion() {
  return (
    <>
      <Card>
        <Flex align="center" gap={16} style={{ marginBottom: 24 }}>
          <Spin indicator={<LoadingOutlined spin style={{ fontSize: 28 }} />} />
          <Skeleton active title={false} paragraph={{ rows: 2 }} />
        </Flex>
        <Skeleton active paragraph={{ rows: 4 }} />
      </Card>
      <Card>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    </>
  );
}

function RunNote({ mode }) {
  if (ANALYZING_STATES.has(mode)) {
    return (
      <Alert
        type="info"
        showIcon
        icon={<LoadingOutlined spin />}
        title="正在分析"
        description="9月14日 – 9月20日"
      />
    );
  }
  return null;
}

function LeadBarChart({ weeks, marks }) {
  const max = Math.max(...weeks.map((week) => week.value));
  const markMap = new Map(marks.map((mark) => [mark.week, mark.title]));

  return (
    <div className="ag-leads-chart" role="img" aria-label={`近 ${weeks.length} 周留资`}>
      {weeks.map((week, index) => (
        <Tooltip key={week.label} title={markMap.get(week.label) ? `${week.value} 条 · ${markMap.get(week.label)}` : `${week.value} 条`}>
          <div className={`ag-leads-col${index === weeks.length - 1 ? " is-cur" : ""}`}>
            <span className="ag-leads-flag">{markMap.has(week.label) ? <FlagFilled /> : null}</span>
            <span className="ag-leads-bar">
              <i style={{ height: `${(week.value / max) * 100}%` }} />
            </span>
            <small>{week.label}</small>
          </div>
        </Tooltip>
      ))}
    </div>
  );
}

function LeadStrip({ counts }) {
  if (!counts?.length) return null;
  return (
    <Flex gap={16} wrap="wrap" className="ag-leads" aria-label="任务状态">
      {counts.map((item) => (
        <Card
          key={item.key}
          classNames={{ root: item.hot ? "ag-stat-card is-hot" : "ag-stat-card" }}
        >
          <Statistic
            title={item.label}
            value={item.value}
            suffix="项"
            valueStyle={item.hot ? { color: "#F59E0B" } : undefined}
          />
        </Card>
      ))}
    </Flex>
  );
}

function StageTitle({ title, index, row, onOpenAgent }) {
  const curStage = trackStage(row);
  if (index === PREVIEW_STAGE && curStage === PREVIEW_STAGE && AGENT_VIEW[row.executor]) {
    return (
      <span className="ag-stage-preview-wrap">
        <span className="ag-stage-preview-label">{title}</span>
        <button
          type="button"
          className="ag-stage-preview-btn"
          onClick={() => onOpenAgent(row)}
        >
          去预览发布 &gt;
        </button>
      </span>
    );
  }
  return title;
}

function suggestionStatus(item, decisions, adviceDone, trackRows) {
  if (item.kind === "advice") {
    return { label: "人工处理建议", color: adviceDone[item.key] ? "success" : "warning" };
  }
  if (item.kind === "brief") {
    const decision = decisions[item.key];
    if (decision?.status === "approved") return { label: "你已经同意", color: "processing" };
    if (decision?.status === "skipped") return { label: "以后再说", color: "default" };
    return { label: "等你决定", color: "warning" };
  }
  const row = trackRows.find((track) => track.key === item.key);
  if (row?.result?.verdict) {
    const verdict = VERDICTS[row.result.verdict];
    return { label: verdict.label, color: verdict.color };
  }
  if (row) return { label: TRACK_STAGES[trackStage(row)], color: "processing" };
  return { label: "正在做", color: "processing" };
}

function SuggestionModal({ open, weekLabel, decisions, adviceDone, trackRows, onClose, onOpen }) {
  const rows = SUGGESTIONS.map((item) => ({
    ...item,
    weekLabel: item.week || weekLabel,
    status: suggestionStatus(item, decisions, adviceDone, trackRows),
  }));

  return (
    <Modal open={open} width={920} footer={null} onCancel={onClose} title="以前建议过的事">
      <Table
        className="ag-ledger"
        size="middle"
        pagination={false}
        rowKey="key"
        dataSource={rows}
        onRow={(record) => ({
          onClick: () => onOpen(record),
        })}
        columns={[
          { title: "周期", dataIndex: "weekLabel", width: 168 },
          { title: "发现的问题", dataIndex: "title", width: 200 },
          {
            title: "建议你做的事",
            dataIndex: "text",
            render: (_, record) => (
              <span className="ag-ledger-advice">
                <Tag variant="filled">{record.direction}</Tag>
                {record.text}
              </span>
            ),
          },
          {
            title: "状态",
            dataIndex: "status",
            width: 120,
            render: (status) => <Tag color={status.color}>{status.label}</Tag>,
          },
        ]}
      />
    </Modal>
  );
}

function MonthlyModal({ open, onClose }) {
  return (
    <Modal open={open} width={660} footer={null} onCancel={onClose} title={`这个月做了什么 · ${MONTHLY_REPORT.monthLabel}`}>
      <div className="ag-mdl">
        <section className="ag-mdl-block">
          <h4>这个月已经做完的事</h4>
          <ul className="ag-month-list">
            {MONTHLY_REPORT.done.map((item) => (
              <li key={item.text}>
                <Tag variant="filled">{item.tag}</Tag>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="ag-mdl-block">
          <h4>
            每周留下联系方式的人数。小旗标出修改上线的那一周。
          </h4>
          <div className="ag-month-chart">
            <LeadBarChart weeks={LEADS.weeks} marks={LEADS.marks} />
          </div>
        </section>
        <section className="ag-mdl-block">
          <h4>下个月准备做的事</h4>
          <ol className="ag-month-next">
            {MONTHLY_REPORT.nextMonth.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </section>
      </div>
    </Modal>
  );
}

const FLOW_STORAGE_KEY = "growth-workbench-flow-v1";
const ADVICE_STORAGE_KEY = "growth-workbench-advice-v1";

function readAdviceDone() {
  try {
    const raw = window.localStorage.getItem(ADVICE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function readSharedFlow() {
  try {
    const raw = window.localStorage.getItem(FLOW_STORAGE_KEY);
    if (!raw) return { approvedStrategies: {}, skippedStrategies: {}, publishedTasks: {} };
    const parsed = JSON.parse(raw);
    return {
      approvedStrategies: parsed.approvedStrategies || {},
      skippedStrategies: parsed.skippedStrategies || {},
      publishedTasks: parsed.publishedTasks || {},
    };
  } catch {
    return { approvedStrategies: {}, skippedStrategies: {}, publishedTasks: {} };
  }
}

export default function AgentPage({
  weekId,
  weekLabel,
  diagnosed = true,
  quiet,
  authMap,
  onAuthorize,
  onSelectLatestWeek,
  toolbarExtra,
  monthlyOpen,
  onCloseMonthly,
  ledgerOpen,
  onCloseLedger,
  runState = "pending",
  onRunState,
}) {
  const { message } = AntApp.useApp();
  const framed = embeddedFrame();
  const [sharedFlow, setSharedFlow] = useState(() => (
    framed
      ? { approvedStrategies: {}, skippedStrategies: {}, publishedTasks: {}, handledAdvice: {} }
      : readSharedFlow()
  ));
  const [decisions, setDecisions] = useState(() => (framed ? {} : decisionsFromFlow(readSharedFlow())));
  const [adviceDone, setAdviceDone] = useState(() => (framed ? {} : readAdviceDone()));
  const [trackFilter, setTrackFilter] = useState("all");
  const [extraNotes, setExtraNotes] = useState({});
  const [baseTracking] = useState(TRACKING);
  const [flashKey, setFlashKey] = useState("");
  const [activeTab, setActiveTab] = useState("strategy");
  const initialParams = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      focus: params.get("focus") || "",
      lens: params.get("lens") || "funnel",
    };
  }, []);
  const [focusedKey, setFocusedKey] = useState(initialParams.focus);
  const trackRefs = useRef({});

  useEffect(() => {
    if (framed) {
      window.parent.postMessage({ type: "growth-flow-ready" }, "*");
    }
    const onMessage = (event) => {
      const data = event.data;
      if (!data || data.type !== "growth-flow-sync" || !data.flow) return;
      const flow = data.flow;
      setSharedFlow({
        approvedStrategies: flow.approvedStrategies || {},
        skippedStrategies: flow.skippedStrategies || {},
        publishedTasks: flow.publishedTasks || {},
        handledAdvice: flow.handledAdvice || {},
      });
      setDecisions(decisionsFromFlow(flow));
      setAdviceDone(flow.handledAdvice || {});
    };
    const onStorage = (event) => {
      if (framed) return;
      if (event.key && event.key !== FLOW_STORAGE_KEY) return;
      const nextFlow = readSharedFlow();
      setSharedFlow(nextFlow);
      setDecisions(decisionsFromFlow(nextFlow));
    };
    window.addEventListener("message", onMessage);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("storage", onStorage);
    };
  }, [framed]);

  const briefs = quiet || !diagnosed ? [] : BRIEFS;
  const viewDecisions = HANDLED_STATES.has(runState) ? { ...ARMED_DECISIONS, ...decisions } : decisions;
  const pending = briefs.filter((brief) => !viewDecisions[brief.key]);
  const approved = briefs.filter((brief) => viewDecisions[brief.key]?.status === "approved");

  const publishedMap = sharedFlow.publishedTasks || {};

  const trackRows = [
    ...approved.map((brief) => ({
      key: brief.key,
      title: brief.title,
      direction: brief.direction,
      executor: brief.executor,
      from: `${weekLabel}诊断`,
      approvedAt: sharedFlow.approvedStrategies?.[brief.key] || "刚刚",
      launchedAt: publishedMap[brief.key] ? "刚刚" : undefined,
      stage: publishedMap[brief.key] ? LAUNCH_STAGE : PREVIEW_STAGE,
      note: brief.summary,
      summary: brief.summary,
      target: brief.target,
      requirements: requirementLines(brief),
      requirementSections: brief.requirementSections || [],
      constraints: brief.constraints || [],
      extra: extraNotes[brief.key]?.trim() || "",
    })),
    ...baseTracking.map((row) =>
      publishedMap[row.key]
        ? {
            ...row,
            stage: LAUNCH_STAGE,
            launchedAt: row.launchedAt || "刚刚",
          }
        : row,
    ),
  ];
  const doingCount = trackRows.filter((row) => trackStage(row) < LAUNCH_STAGE).length;
  const liveCount = trackRows.filter((row) => trackStage(row) >= LAUNCH_STAGE).length;
  const visibleTracks = trackRows.filter((row) => {
    if (trackFilter === "doing") return trackStage(row) < LAUNCH_STAGE;
    if (trackFilter === "live") return trackStage(row) >= LAUNCH_STAGE;
    return true;
  });

  function flash(key) {
    setFlashKey(key);
    window.setTimeout(() => {
      setFlashKey((cur) => (cur === key ? "" : cur));
    }, 2000);
  }

  function locateTrack(key) {
    setActiveTab("tracking");
    window.setTimeout(() => {
      trackRefs.current[key]?.scrollIntoView({ behavior: "smooth", block: "center" });
      flash(key);
    }, 80);
  }

  function syncToParent(action, focusKey, extra = {}) {
    try {
      const cur = readSharedFlow();
      if (action === "approve") {
        cur.approvedStrategies = { ...(cur.approvedStrategies || {}), [focusKey]: "刚刚" };
        if (cur.skippedStrategies) delete cur.skippedStrategies[focusKey];
      } else if (action === "skip") {
        cur.skippedStrategies = { ...(cur.skippedStrategies || {}), [focusKey]: extra.reason || "以后再说" };
        if (cur.approvedStrategies) delete cur.approvedStrategies[focusKey];
      } else if (action === "undo") {
        if (cur.approvedStrategies) delete cur.approvedStrategies[focusKey];
        if (cur.skippedStrategies) delete cur.skippedStrategies[focusKey];
      }
      window.localStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify(cur));
      setSharedFlow(cur);
    } catch {
      /* ignore */
    }
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "growth-flow-update", action, focusKey, ...extra }, "*");
    }
  }

  function approve(brief) {
    setDecisions((prev) => ({ ...prev, [brief.key]: { status: "approved" } }));
    syncToParent("approve", brief.key, { title: brief.title });
    message.success(`已经交给${displayExecutor(brief.executor)}生成草稿，你预览确认后才会正式上线。`);
  }

  function skip(brief, reasonKey) {
    const reason = SKIP_REASONS.find((item) => item.key === reasonKey);
    setDecisions((prev) => ({ ...prev, [brief.key]: { status: "skipped", reason } }));
    syncToParent("skip", brief.key, { reason: reason?.label });
    message.info(reason.effect);
  }

  function openAgentTask(row) {
    const view = AGENT_VIEW[row.executor];
    if (!view) return;
    const task = {
      id: row.key,
      focusKey: row.key,
      view,
      title: row.title,
      executor: row.executor,
      from: row.from,
      approvedAt: row.approvedAt,
      stage: TRACK_STAGES[trackStage(row)] || "",
      note: row.note || "",
      summary: row.summary || "",
      target: row.target || "",
      requirements: requirementLines(row),
      requirementSections: row.requirementSections || [],
      constraints: row.constraints || [],
      extra: row.extra || "",
    };
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "growth-open-task", view, focusKey: row.key, task }, "*");
      return;
    }
    const host = window.location.hostname || "127.0.0.1";
    const port = view === "marketing" ? 5186 : 5178;
    const url = new URL(`http://${host}:${port}/`);
    if (view === "content") url.searchParams.set("embed", "1");
    url.searchParams.set("task", encodeTask(task));
    window.location.assign(url.toString());
  }

  function openPreviewByKey(key) {
    const found = trackRows.find((r) => r.key === key);
    if (found) {
      openAgentTask(found);
      return;
    }
    const brief = BRIEFS.find((b) => b.key === key);
    if (brief) {
      openAgentTask({
        key: brief.key,
        title: brief.title,
        executor: brief.executor,
        from: `${weekLabel}诊断`,
        approvedAt: sharedFlow.approvedStrategies?.[brief.key] || "刚刚",
        stage: PREVIEW_STAGE,
        note: brief.summary,
        summary: brief.summary,
        target: brief.target,
        requirements: requirementLines(brief),
        requirementSections: brief.requirementSections || [],
        constraints: brief.constraints || [],
        extra: extraNotes[brief.key]?.trim() || "",
      });
    }
  }

  function undo(brief) {
    setDecisions((prev) => {
      const next = { ...prev };
      delete next[brief.key];
      return next;
    });
    syncToParent("undo", brief.key);
  }

  function toggleAdviceDone(key) {
    setAdviceDone((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        window.localStorage.setItem(ADVICE_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* 演示环境写不进本地存储时，本次会话内仍然生效 */
      }
      const done = !!next[key];
      message.success(done ? "已标记为人工处理完成" : "已撤回完成状态");
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: "growth-flow-update",
          action: done ? "advice-done" : "advice-undo",
          focusKey: key,
        }, "*");
      }
      return next;
    });
  }

  const showWorkbench = WORKBENCH_STATES.has(runState);
  const trackingAttention = trackRows.filter((row) => trackStage(row) < LAUNCH_STAGE).length;

  return (
    <ConfigProvider theme={BOARD_THEME}>
      <div className="ag-page">
        <header className="dan-toolbar is-unified">
          <div className="dan-toolbar-tabs">
            {runState !== "off" ? <h1 className="ag-page-title">访客洞察与策略</h1> : null}
            <Segmented
              value={activeTab}
              onChange={setActiveTab}
              options={[
                {
                  value: "strategy",
                  label: (
                    <span className="isw-tab-label">
                      洞察与策略
                      {diagnosed && pending.length > 0 ? (
                        <em className="isw-tab-badge is-orange">{pending.length}</em>
                      ) : null}
                    </span>
                  ),
                },
                {
                  value: "tracking",
                  label: (
                    <span className="isw-tab-label" title="还没上线、需要你继续看的策略">
                      执行追踪
                      {trackingAttention > 0 ? (
                        <em className="isw-tab-badge is-blue">{trackingAttention}</em>
                      ) : null}
                    </span>
                  ),
                },
              ]}
            />
          </div>
          <div className="dan-toolbar-right">{toolbarExtra}</div>
        </header>

        {runState === "off" ? <GateScreen onStart={() => onRunState("running")} /> : null}
        <RunNote mode={runState} />
        {runState === "running" ? <AnalyzingMotion /> : null}

        {showWorkbench && activeTab === "strategy" ? (
          <InsightStrategyWorkspace
            weekId={weekId}
            diagnosed={diagnosed}
            quiet={quiet}
            decisions={viewDecisions}
            publishedMap={publishedMap}
            adviceDone={adviceDone}
            extraNotes={extraNotes}
            authMap={authMap}
            initialFocusKey={focusedKey}
            initialLens={initialParams.lens}
            onSelectLatestWeek={onSelectLatestWeek}
            onApprove={approve}
            onSkip={skip}
            onUndo={undo}
            onToggleAdviceDone={toggleAdviceDone}
            onExtra={(key, value) => setExtraNotes((prev) => ({ ...prev, [key]: value }))}
            onAuthorize={onAuthorize}
            onOpenPreview={openPreviewByKey}
            onOpenTracking={locateTrack}
          />
        ) : null}

        {showWorkbench && activeTab === "tracking" ? (
          <section className="isw-tracking-pane" aria-label="策略执行追踪">
            <SectionTitle
              title="已经在做的事"
              extra={
                <span className="isw-tracking-sub">
                  进行中 {doingCount} 项，已上线 {liveCount} 项
                </span>
              }
            />
            <div className="isw-track-filter">
              <Segmented
                size="small"
                value={trackFilter}
                onChange={setTrackFilter}
                options={[
                  { label: `全部 ${trackRows.length}`, value: "all" },
                  { label: `进行中 ${doingCount}`, value: "doing" },
                  { label: `已上线 ${liveCount}`, value: "live" },
                ]}
              />
            </div>
            {visibleTracks.length ? (
              <Card className="ag-track">
                {visibleTracks.map((row) => (
                  <div
                    key={row.key}
                    ref={(node) => {
                      trackRefs.current[row.key] = node;
                    }}
                    className={`ag-track-row${flashKey === row.key ? " is-flash" : ""}`}
                  >
                    <div className="ag-track-info">
                      <div className="ag-track-name">
                        <b>{row.title}</b>
                      </div>
                      <span>
                        {displayExecutor(row.executor)} · {row.approvedAt} 批准{row.launchedAt ? ` · ${row.launchedAt} 上线` : ""}
                      </span>
                      {trackStage(row) >= LAUNCH_STAGE && liveHref(row) ? (
                        <Button type="link" size="small" className="ag-live-link" href={liveHref(row)} target="_blank">
                          查看线上效果 &gt;
                        </Button>
                      ) : null}
                    </div>
                    <div className="ag-track-main">
                      <Steps
                        className="ag-track-steps"
                        type="dot"
                        size="small"
                        current={trackStage(row)}
                        status={trackStage(row) === LAUNCH_STAGE ? "finish" : "process"}
                        items={TRACK_STAGES.map((title, index) => ({
                          title: (
                            <StageTitle
                              title={title}
                              index={index}
                              row={row}
                              onOpenAgent={openAgentTask}
                            />
                          ),
                        }))}
                      />
                    </div>
                  </div>
                ))}
              </Card>
            ) : (
              <Card className="ag-empty">
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前还没有已批准进入执行的策略" />
              </Card>
            )}
          </section>
        ) : null}
      </div>

      <MonthlyModal open={Boolean(monthlyOpen)} onClose={onCloseMonthly} />
      <SuggestionModal
        open={Boolean(ledgerOpen)}
        weekLabel={weekLabel}
        decisions={viewDecisions}
        adviceDone={adviceDone}
        trackRows={trackRows}
        onClose={onCloseLedger}
        onOpen={(record) => {
          onCloseLedger();
          window.setTimeout(() => {
            if (record.kind === "track") {
              locateTrack(record.key);
            } else {
              setActiveTab("strategy");
              setFocusedKey(record.key);
            }
          }, 0);
        }}
      />
    </ConfigProvider>
  );
}
