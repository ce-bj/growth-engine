import { useRef, useState } from "react";
import { App as AntApp, Button, Card, ConfigProvider, Modal, Progress, Steps, Table, Tag, Tooltip } from "antd";
import {
  ArrowRightOutlined,
  CheckCircleFilled,
  CheckOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  DownOutlined,
  ExclamationCircleFilled,
  FlagFilled,
  LockOutlined,
} from "@ant-design/icons";
import {
  BRIEFS,
  LEADS,
  MONITOR_STAGE,
  PROGRESS_STAGE,
  MONTHLY_REPORT,
  ONBOARD_TIMELINE,
  RESULT_STAGE,
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

const fmtInt = (value) => value.toLocaleString("en-US");
const pct = (value) => `${value.toFixed(1)}%`;
const fmtP = (p) => (p.startsWith("<") ? `p ${p}` : `p = ${p}`);
function SectionTitle({ title, extra }) {
  return (
    <div className="ag-section-head">
      <h2>{title}</h2>
      {extra ? <div className="ag-section-extra">{extra}</div> : null}
    </div>
  );
}

function OnboardScreen({ site }) {
  return (
    <Card className="ag-onboard">
      <div className="ag-onboard-head">
        <Tag color="processing" icon={<ClockCircleOutlined />}>
          正在收集第一个 7 天的访问
        </Tag>
        <h2>
          {site.connectedAt} 接入 · {site.firstReportAt} 出首期
        </h2>
      </div>
      <div className="ag-onboard-steps">
        {ONBOARD_TIMELINE.map((item) => (
          <div key={item.step} className="ag-onboard-item">
            <span>{item.step}</span>
            <b>{item.title}</b>
          </div>
        ))}
      </div>
    </Card>
  );
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

function LeadStrip({ data, counts }) {
  const { weeks } = data;
  const cur = weeks[weeks.length - 1].value;
  const diff = cur - weeks[weeks.length - 2].value;

  return (
    <section className="ag-leads" aria-label="留资">
      <div className="ag-leads-num">
        <span>近 7 天留下联系方式</span>
        <b>{cur}</b>
        <div className="ag-leads-split">
          <span>表单留下 {data.form} 人</span>
          <span>客服留下 {data.chat} 人</span>
        </div>
        <div className="ag-leads-tags">
          <Tag variant="filled" color={diff < 0 ? "error" : "success"}>
            比上一周{diff > 0 ? "多" : "少"} {Math.abs(diff)} 人
          </Tag>
          <Tag variant="filled">开始使用前，平均每周 {data.beforeAvg} 人</Tag>
        </div>
      </div>
      <LeadBarChart weeks={weeks} marks={data.marks} />
      {counts?.length ? (
        <dl className="ag-counts">
          {counts.map((item) => (
            <div key={item.key} className={item.hot ? "is-hot" : ""}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}

function StageTitle({ title, index, row, onOpen, onOpenAgent }) {
  if (row.stage === index && index === PROGRESS_STAGE && AGENT_VIEW[row.executor]) {
    return (
      <button type="button" className="ag-stage-link" onClick={() => onOpenAgent(row)}>
        {title}
      </button>
    );
  }
  if (row.stage === index && (index === MONITOR_STAGE || index === RESULT_STAGE)) {
    return (
      <button type="button" className="ag-stage-link" onClick={() => onOpen(row)}>
        {title}
      </button>
    );
  }
  return title;
}

function TrackReadout({ row, onOpen }) {
  if (row.stage < MONITOR_STAGE && row.note) {
    return <span className="ag-track-note">{row.note}</span>;
  }
  if (row.stage === MONITOR_STAGE && row.monitor) {
    const m = row.monitor;
    return (
      <button type="button" className="ag-readout" onClick={() => onOpen(row)}>
        <Tag color="success">上线检查已通过</Tag>
        <span className="ag-readout-metric">{m.metric}</span>
        <span className="ag-readout-val">
          {pct(m.before.value)} <ArrowRightOutlined /> <b className={m.current.value >= m.threshold ? "is-up" : ""}>{pct(m.current.value)}</b>
        </span>
        <span className="ag-readout-line">目标 {pct(m.threshold)}</span>
        <Progress className="ag-readout-prog" percent={Math.round((m.day / m.minDays) * 100)} size="small" showInfo={false} />
        <span className="ag-readout-day">
          {m.day}/{m.minDays} 天
        </span>
      </button>
    );
  }
  if (row.stage === RESULT_STAGE && row.result) {
    const r = row.result;
    const verdict = VERDICTS[r.verdict];
    return (
      <button type="button" className="ag-readout" onClick={() => onOpen(row)}>
        <Tag color={verdict.color}>{verdict.label}</Tag>
        <span className="ag-readout-metric">{r.metric}</span>
        <span className="ag-readout-val">
          {pct(r.before.value)} <ArrowRightOutlined /> <b>{pct(r.after.value)}</b>
        </span>
        <span className="ag-readout-line">
          留下联系方式 {r.leads.before} 人 <ArrowRightOutlined /> {r.leads.after} 人
        </span>
      </button>
    );
  }
  return null;
}

function ModalTitle({ row, tag }) {
  return (
    <div className="ag-mdl-title">
      <span>{row.title}</span>
      {tag}
    </div>
  );
}

function LeadPair({ before, after }) {
  return (
    <section className="ag-mdl-block">
      <h4>
        留下联系方式的人数
      </h4>
      <div className="ag-mdl-pair">
        <div>
          <small>上线前 · {before.range}</small>
          <b>{before.count}</b>
        </div>
        <ArrowRightOutlined />
        <div className="is-after">
          <small>上线后 · {after.range}</small>
          <b>{after.count}</b>
        </div>
      </div>
    </section>
  );
}

function MetricScale({ marks }) {
  const values = marks.map((mark) => mark.value);
  const lo = Math.floor(Math.min(...values) - 4);
  const hi = Math.ceil(Math.max(...values) + 4);
  const span = Math.max(1, hi - lo);
  const pos = (value) => `${((value - lo) / span) * 100}%`;
  const base = marks.find((mark) => mark.kind === "base");
  const now = marks.find((mark) => mark.kind === "now");

  return (
    <div className="ag-scale">
      <div className="ag-scale-track">
        <span
          className="ag-scale-fill"
          style={{
            left: pos(Math.min(base.value, now.value)),
            width: `calc(${pos(Math.max(base.value, now.value))} - ${pos(Math.min(base.value, now.value))})`,
          }}
        />
        {marks.map((mark) => (
          <span key={mark.kind} className={`ag-scale-mark is-${mark.kind}`} style={{ left: pos(mark.value) }}>
            <i />
            <b>{pct(mark.value)}</b>
            <small>{mark.label}</small>
          </span>
        ))}
      </div>
    </div>
  );
}

function MonitorModal({ row, onClose }) {
  const m = row.monitor;
  return (
    <Modal
      open
      width={620}
      footer={null}
      onCancel={onClose}
      title={<ModalTitle row={row} tag={<Tag color="processing">监测中 · {m.day}/{m.minDays} 天</Tag>} />}
    >
      <div className="ag-mdl">
        <LeadPair before={m.leads.before} after={m.leads.after} />
        <section className="ag-mdl-block">
          <h4>
            上线后当场检查了这些 {m.verifiedAt ? <small>{m.verifiedAt}</small> : null}
          </h4>
          <ul className="ag-mdl-checks">
            {m.checks.map((check) => (
              <li key={check.label} className={check.ok ? "is-ok" : "is-bad"}>
                {check.ok ? <CheckOutlined /> : <CloseOutlined />}
                {check.label}
              </li>
            ))}
          </ul>
        </section>
        <section className="ag-mdl-block">
          <h4>
            用这个数字判断有没有效果 <span>{m.metric}</span>
            <small>{m.formula}</small>
          </h4>
          <MetricScale
            marks={[
              { kind: "base", label: "上线前基线", value: m.before.value },
              { kind: "line", label: "95% 达标线", value: m.threshold },
              { kind: "now", label: "当前实测", value: m.current.value },
            ]}
          />
          <dl className="ag-mdl-stats is-3">
            <div>
              <dt>至少要提升多少</dt>
              <dd>+{m.mde} 个百分点</dd>
            </div>
            <div>
              <dt>至少要有多少访客</dt>
              <dd>
                {fmtInt(m.minSample)} {m.unit}
              </dd>
            </div>
            <div>
              <dt>最快多久能下结论</dt>
              <dd>{m.minDays} 天</dd>
            </div>
          </dl>
          <div className="ag-mdl-progress">
            <span>访客已经来了多少</span>
            <Progress
              percent={Math.min(100, Math.round((m.current.den / m.minSample) * 100))}
              format={() => `${fmtInt(m.current.den)} / ${fmtInt(m.minSample)}`}
            />
          </div>
        </section>
      </div>
    </Modal>
  );
}

function CompareCol({ label, side, unit, after }) {
  return (
    <div className={`ag-mdl-side${after ? " is-after" : ""}`}>
      <small>
        {label} · {side.range}
      </small>
      <b>{pct(side.value)}</b>
      <span className="ag-mdl-side-bar">
        <i style={{ width: `${Math.min(100, side.value)}%` }} />
      </span>
      <small>
        {fmtInt(side.num)} / {fmtInt(side.den)} {unit}
      </small>
    </div>
  );
}

function ResultModal({ row, reworked, onRework, onClose }) {
  const r = row.result;
  const verdict = VERDICTS[r.verdict];
  const delta = r.after.value - r.before.value;
  const positive = r.verdict === "effective";
  const negative = r.verdict === "flat" || r.verdict === "worse";

  let footer = null;
  if (negative) {
    footer = (
      <div className="ag-mdl-foot">
        <span>这个做法没有带来变化，以后不再建议同样的修改。</span>
        {reworked ? (
          <Button disabled>已提交换方向重做</Button>
        ) : (
          <Button type="primary" onClick={onRework}>
            换一种做法
          </Button>
        )}
      </div>
    );
  }

  return (
    <Modal
      open
      width={620}
      onCancel={onClose}
      footer={footer}
      title={<ModalTitle row={row} tag={<Tag color={verdict.color}>{verdict.label}</Tag>} />}
    >
      <div className="ag-mdl">
        <LeadPair
          before={{ range: r.before.range, count: r.leads.before }}
          after={{ range: r.after.range, count: r.leads.after }}
        />
        <section className="ag-mdl-block">
          <h4>
            用这个数字判断有没有效果 <span>{r.metric}</span>
            <small>{r.formula}</small>
          </h4>
          <div className="ag-mdl-compare">
            <CompareCol label="上线前" side={r.before} unit={r.unit} />
            <CompareCol label="上线后" side={r.after} unit={r.unit} after />
          </div>
          <dl className="ag-mdl-stats">
            <div>
              <dt>变化</dt>
              <dd className={positive ? "is-up" : undefined}>
                {delta > 0 ? "+" : ""}
                {delta.toFixed(1)} 个百分点
              </dd>
            </div>
            <div>
              <dt>观察窗口</dt>
              <dd>{r.window.days} 天</dd>
            </div>
            <div>
              <dt>这个变化像不像碰巧</dt>
              <dd>{fmtP(r.p)}</dd>
            </div>
            <div>
              <dt>同一时期还有没有别的改动</dt>
              <dd>{r.overlap || "无"}</dd>
            </div>
          </dl>
          {r.gain ? <p className="ag-mdl-gain">{r.gain}</p> : null}
        </section>
        {r.attribution ? (
          <section className="ag-mdl-block">
            <h4>为什么是这个结果</h4>
            <p className="ag-mdl-attr">{r.attribution}</p>
          </section>
        ) : null}
      </div>
    </Modal>
  );
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
  if (row) return { label: TRACK_STAGES[row.stage], color: "processing" };
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

export default function AgentPage({ site, weekLabel, quiet, authMap, onAuthorize, monthlyOpen, onCloseMonthly, ledgerOpen, onCloseLedger }) {
  const { message } = AntApp.useApp();
  const [decisions, setDecisions] = useState({});
  const [adviceDone, setAdviceDone] = useState({});
  const [extraNotes, setExtraNotes] = useState({});
  const [openKeys, setOpenKeys] = useState([]);
  const [baseTracking, setBaseTracking] = useState(TRACKING);
  const [reworkedKeys, setReworkedKeys] = useState({});
  const [flashKey, setFlashKey] = useState("");
  const [modalRow, setModalRow] = useState(null);
  const cardRefs = useRef({});
  const trackRefs = useRef({});
  const ruleRefs = useRef({});

  if (site && !site.diagnosed) {
    return (
      <ConfigProvider theme={BOARD_THEME}>
        <div className="ag-page">
          <OnboardScreen site={site} />
        </div>
      </ConfigProvider>
    );
  }

  const briefs = quiet ? [] : BRIEFS;
  const pending = briefs.filter((brief) => !decisions[brief.key]);
  const approved = briefs.filter((brief) => decisions[brief.key]?.status === "approved");

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
      requirements: brief.requirements,
      extra: extraNotes[brief.key]?.trim() || "",
    })),
    ...baseTracking,
  ];

  /** 顶部收敛为 4 个核心状态数字（去掉客户侧「本站策略」）。 */
  const counts = [
    { key: "pending", label: "等你决定", value: pending.length, hot: pending.length > 0 },
    { key: "running", label: "正在做", value: trackRows.filter((row) => row.stage < MONITOR_STAGE).length },
    { key: "monitor", label: "正在看效果", value: trackRows.filter((row) => row.stage === MONITOR_STAGE).length },
    { key: "proven", label: "已经证明有效", value: trackRows.filter((row) => row.result?.verdict === "effective").length },
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
    if (decisions[key]?.status === "approved") {
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

  function confirmLaunch(row) {
    setBaseTracking((prev) =>
      prev.map((item) =>
        item.key === row.key
          ? {
              ...item,
              stage: MONITOR_STAGE,
              launchedAt: "刚刚",
              monitor: item.readyMonitor,
            }
          : item,
      ),
    );
    message.success("已记录上线。我们开始看这页的效果。");
  }

  function rework(row) {
    setReworkedKeys((prev) => ({ ...prev, [row.key]: true }));
    message.success("已经记下这个做法没有效果。下次会换一种做法。");
    setModalRow(null);
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
      stage: TRACK_STAGES[row.stage] || "",
      note: row.note || "",
      summary: row.summary || "",
      target: row.target || "",
      requirements: row.requirements || [],
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

  const activeModalRow = modalRow ? trackRows.find((item) => item.key === modalRow.key) || modalRow : null;

  return (
    <ConfigProvider theme={BOARD_THEME}>
      <div className="ag-page">
        <LeadStrip data={LEADS} counts={counts} />

        <DecisionSection
          quiet={quiet}
          decisions={decisions}
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
                  {AGENT_VIEW[row.executor] ? (
                    <Button size="small" onClick={() => openAgentTask(row)}>
                      打开这个任务
                    </Button>
                  ) : null}
                  {row.stage === PROGRESS_STAGE && row.readyMonitor ? (
                    <Button size="small" type="primary" ghost onClick={() => confirmLaunch(row)}>
                      我确认已经上线
                    </Button>
                  ) : null}
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
                  current={row.stage}
                  status={row.stage === RESULT_STAGE ? "finish" : "process"}
                  items={TRACK_STAGES.map((title, index) => ({
                    title: (
                      <StageTitle
                        title={title}
                        index={index}
                        row={row}
                        onOpen={setModalRow}
                        onOpenAgent={openAgentTask}
                      />
                    ),
                  }))}
                />
                <TrackReadout row={row} onOpen={setModalRow} />
              </div>
            </div>
          ))}
        </Card>
      </div>

      {activeModalRow?.stage === MONITOR_STAGE ? (
        <MonitorModal row={activeModalRow} onClose={() => setModalRow(null)} />
      ) : null}
      {activeModalRow?.stage === RESULT_STAGE ? (
        <ResultModal
          row={activeModalRow}
          reworked={Boolean(reworkedKeys[activeModalRow.key])}
          onRework={() => rework(activeModalRow)}
          onClose={() => setModalRow(null)}
        />
      ) : null}
      <MonthlyModal open={Boolean(monthlyOpen)} onClose={onCloseMonthly} />
      <SuggestionModal
        open={Boolean(ledgerOpen)}
        weekLabel={weekLabel}
        decisions={decisions}
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
