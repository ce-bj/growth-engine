import { useRef, useState } from "react";
import { App as AntApp, Alert, Button, Card, ConfigProvider, Dropdown, Flex, Modal, Skeleton, Spin, Statistic, Steps, Table, Tag, Tooltip } from "antd";
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
  PROGRESS_STAGE,
  MONTHLY_REPORT,
  SUGGESTIONS,
  TRACK_STAGES,
  TRACKING,
  VERDICTS,
} from "../diagnosisPeriod.js";
import { BOARD_THEME } from "../board-theme.js";
import { DecisionSection } from "./DecisionCards.jsx";

const SKIP_REASONS = [
  { key: "doing", label: "这件事我已经在做了", effect: "下周如果还是这个问题，不再重复发给你。" },
  { key: "disagree", label: "我不同意这个判断", effect: "我们记下来，以后换一种做法。" },
  { key: "later", label: "以后再说", effect: "下周如果问题还在，会再提醒你。" },
];

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
          <span className="ag-gate-pill">优化策略</span>
          <span>洞察与诊断 · 每周转化诊断</span>
        </div>
        <h1>让访客看得进、留得下</h1>
        <p>
          每周看访客洞察，找出没接住的页面。
          <br />
          开出改版任务，<em>改哪些由你点</em>。
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
  if (mode === "pending") {
    return (
      <Alert
        type="info"
        showIcon
        title="还有未审批的任务"
        description="任务全部审批完成后，才会启用新一轮的分析。"
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
  if (index === LAUNCH_STAGE && trackStage(row) >= LAUNCH_STAGE && AGENT_VIEW[row.executor]) {
    return (
      <button type="button" className="ag-stage-link" onClick={() => onOpenAgent(row)}>
        {title}
      </button>
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

export default function AgentPage({ site, weekLabel, quiet, authMap, onAuthorize, monthlyOpen, onCloseMonthly, ledgerOpen, onCloseLedger, runState = "pending", onRunState }) {
  const { message } = AntApp.useApp();
  const [decisions, setDecisions] = useState({});
  const [adviceDone, setAdviceDone] = useState({});
  const [extraNotes, setExtraNotes] = useState({});
  const [openKeys, setOpenKeys] = useState([]);
  const [baseTracking] = useState(TRACKING);
  const [flashKey, setFlashKey] = useState("");
  const cardRefs = useRef({});
  const trackRefs = useRef({});
  const ruleRefs = useRef({});

  const briefs = quiet ? [] : BRIEFS;
  const viewDecisions = HANDLED_STATES.has(runState) ? { ...ARMED_DECISIONS, ...decisions } : decisions;
  const pending = briefs.filter((brief) => !viewDecisions[brief.key]);
  const approved = briefs.filter((brief) => viewDecisions[brief.key]?.status === "approved");

  const trackRows = [
    ...approved.map((brief) => ({
      key: brief.key,
      title: brief.title,
      direction: brief.direction,
      executor: brief.executor,
      from: `${weekLabel}诊断`,
      approvedAt: "刚刚",
      stage: PROGRESS_STAGE,
      note: brief.planPreview?.metric || "",
      summary: brief.summary,
      target: brief.target,
      requirements: requirementLines(brief),
      requirementSections: brief.requirementSections || [],
      constraints: brief.constraints || [],
      extra: extraNotes[brief.key]?.trim() || "",
    })),
    ...baseTracking,
  ];

  const counts = [
    { key: "pending", label: "待审批", value: pending.length, hot: pending.length > 0 },
    { key: "approved", label: "已审批", value: approved.length + baseTracking.length },
  ];

  function flash(key) {
    setFlashKey(key);
    window.setTimeout(() => {
      setFlashKey((cur) => (cur === key ? "" : cur));
    }, 1800);
  }

  function toggle(key) {
    setOpenKeys((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));
  }

  function locateBriefOrTrack(key) {
    if (viewDecisions[key]?.status === "approved") {
      locateTrack(key);
      return;
    }
    setOpenKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
    cardRefs.current[key]?.scrollIntoView({ behavior: "smooth", block: "center" });
    flash(key);
  }

  function locateTrack(key) {
    trackRefs.current[key]?.scrollIntoView({ behavior: "smooth", block: "center" });
    flash(key);
  }

  function locateAdvice(key) {
    setOpenKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
    const node = cardRefs.current[key] || document.getElementById(`task-${key}`);
    node?.scrollIntoView({ behavior: "smooth", block: "center" });
    flash(key);
  }

  function locateRule(key) {
    ruleRefs.current[key]?.scrollIntoView({ behavior: "smooth", block: "center" });
    flash(key);
  }

  function locateMove(item) {
    if (item.kind === "brief") locateBriefOrTrack(item.key);
    else locateAdvice(item.key);
  }

  function approve(brief) {
    setDecisions((prev) => ({ ...prev, [brief.key]: { status: "approved" } }));
    message.success(`已经交给${brief.executor}。做好后会先给你看，你确认了才会上线。`);
  }

  function skip(brief, reasonKey) {
    const reason = SKIP_REASONS.find((item) => item.key === reasonKey);
    setDecisions((prev) => ({ ...prev, [brief.key]: { status: "skipped", reason } }));
    message.info(reason.effect);
  }

  function openAgentTask(row) {
    const view = AGENT_VIEW[row.executor];
    if (!view) return;
    const task = {
      id: row.key,
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
      window.parent.postMessage({ type: "growth-open-task", view, task }, "*");
      return;
    }
    const host = window.location.hostname || "127.0.0.1";
    const port = view === "marketing" ? 5186 : 5178;
    const url = new URL(`http://${host}:${port}/`);
    if (view === "content") url.searchParams.set("embed", "1");
    url.searchParams.set("task", encodeTask(task));
    window.location.assign(url.toString());
  }

  function undo(brief) {
    setDecisions((prev) => {
      const next = { ...prev };
      delete next[brief.key];
      return next;
    });
  }

  const showWorkbench = WORKBENCH_STATES.has(runState);

  return (
    <ConfigProvider theme={BOARD_THEME}>
      <div className="ag-page">
        {runState === "off" ? <GateScreen onStart={() => onRunState("running")} /> : null}
        <RunNote mode={runState} />
        {runState === "running" ? <AnalyzingMotion /> : null}
        {showWorkbench ? <LeadStrip counts={counts} /> : null}
        {showWorkbench ? (
          <DecisionSection
            quiet={quiet}
            decisions={viewDecisions}
            adviceDone={adviceDone}
            extraNotes={extraNotes}
            authMap={authMap}
            openKeys={openKeys}
            flashKey={flashKey}
            onToggle={toggle}
            onApprove={approve}
            onSkip={skip}
            onUndo={undo}
            onExtra={(key, value) => setExtraNotes((prev) => ({ ...prev, [key]: value }))}
            onAuthorize={onAuthorize}
            onLocateTrack={locateTrack}
            cardRef={(key, node) => {
              cardRefs.current[key] = node;
            }}
          />
        ) : null}

        {showWorkbench ? (
          <>
        <SectionTitle title="已经在做的事" />
        <Card className="ag-track">
          {trackRows.map((row) => (
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
                  {row.executor} · {row.approvedAt} 批准{row.launchedAt ? ` · ${row.launchedAt} 上线` : ""}
                </span>
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
          </>
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
            if (record.kind === "brief") locateBriefOrTrack(record.key);
            else if (record.kind === "track") locateTrack(record.key);
            else locateAdvice(record.key);
          }, 0);
        }}
      />
    </ConfigProvider>
  );
}
