import { useRef, useState } from "react";
import { App as AntApp, Button, Card, ConfigProvider, Dropdown, Empty, Input, Modal, Progress, Steps, Table, Tag, Tooltip } from "antd";
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
  ADVICE,
  BRIEFS,
  LEADS,
  MONITOR_STAGE,
  MONTHLY_REPORT,
  ONBOARD_TIMELINE,
  RESULT_STAGE,
  RULE_CHECKS,
  SUGGESTIONS,
  TRACK_STAGES,
  TRACKING,
  VERDICTS,
} from "../diagnosisPeriod.js";
import { BOARD_THEME } from "../board-theme.js";
import "./agent-page.css";

const SKIP_REASONS = [
  { key: "doing", label: "已经在做了", effect: "下周同一现象不再重复派发" },
  { key: "disagree", label: "不认同这个判断", effect: "记入本站防重，后续换方向" },
  { key: "later", label: "以后再说", effect: "下周若未解除继续提示" },
];

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
const briefOf = (key) => BRIEFS.find((item) => item.key === key);

const FACE_ROWS = [
  ["data", "数据表现"],
  ["cause", "根本原因"],
];

function SectionTitle({ title, extra }) {
  return (
    <div className="ag-section-head">
      <h2>{title}</h2>
      {extra ? <div className="ag-section-extra">{extra}</div> : null}
    </div>
  );
}

function sourceView(source, authMap) {
  if (source.state === "unauthorized" && authMap?.[source.authKey]) {
    return { ...source, state: "ok", detail: "已授权，下次诊断起读取广告实际搜索词明细" };
  }
  return source;
}

function OnboardScreen({ site }) {
  return (
    <Card className="ag-onboard">
      <div className="ag-onboard-head">
        <Tag color="processing" icon={<ClockCircleOutlined />}>
          首个 7 天窗口采集中
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

function BriefCard({
  brief,
  open,
  highlighted,
  extra,
  authMap,
  onToggle,
  onExtra,
  onApprove,
  onSkip,
  onAuthorize,
  cardRef,
}) {
  const sources = brief.sources.map((item) => sourceView(item, authMap));
  const locked = sources.filter((item) => item.state === "unauthorized").length;
  const plan = brief.planPreview;

  return (
    <Card className={`ag-brief${highlighted ? " is-flash" : ""}`} ref={cardRef}>
      <div className="ag-brief-head">
        <div className="ag-brief-title">
          <Tag color={brief.priority === "P0" ? "error" : "warning"}>{brief.priority}</Tag>
          {brief.carryOver ? <Tag color="warning">{brief.carryOver}</Tag> : null}
          <h3>{brief.title}</h3>
          <Tag variant="filled">{brief.direction}</Tag>
          {plan ? <Tag color={plan.badgeTone}>{plan.badge}</Tag> : null}
          {locked ? <Tag color="warning">待授权</Tag> : null}
        </div>
        <div className="ag-brief-actions">
          <Button type="text" onClick={onToggle}>
            {open ? "收起" : "详情"}
          </Button>
          <Dropdown
            trigger={["click"]}
            menu={{
              items: SKIP_REASONS.map((reason) => ({
                key: reason.key,
                label: reason.label,
                extra: reason.effect,
              })),
              onClick: ({ key }) => onSkip(key),
            }}
          >
            <Button>
              暂不处理 <DownOutlined />
            </Button>
          </Dropdown>
          <Button type="primary" onClick={onApprove}>
            通过，交给{brief.executor}
          </Button>
        </div>
      </div>

      {plan && !open ? (
        <div className="ag-plan-strip">
          <span>{plan.metric}</span>
          <em>
            {plan.baseline} <ArrowRightOutlined /> {plan.threshold}
          </em>
          <small>{plan.minSample}</small>
        </div>
      ) : null}

      {open ? (
        <div className="ag-brief-body">
          <div className="ag-brief-col">
            <h4>任务说明</h4>
            <div className="ag-strategy">
              <div className="ag-kv">
                <b>任务目标</b>
                <span>{brief.summary}</span>
              </div>
              <div className="ag-kv">
                <b>任务对象</b>
                <span>{brief.target}</span>
              </div>
              <div className="ag-kv">
                <b>内容要求</b>
                <ol className="ag-brief-reqs">
                  {brief.requirements.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ol>
              </div>
              <div className="ag-kv">
                <b>约束</b>
                <span>{brief.constraints.join("；")}</span>
              </div>
              <label className="ag-kv ag-kv-input">
                <b>额外补充</b>
                <Input.TextArea
                  className="ag-extra-input"
                  value={extra}
                  placeholder="可以写别的要求，没有就留空"
                  autoSize={{ minRows: 2, maxRows: 5 }}
                  onChange={(event) => onExtra(event.target.value)}
                />
              </label>
            </div>

            {plan ? (
              <>
                <h4>评估计划</h4>
                <div className="ag-strategy">
                  <div className="ag-kv">
                    <b>看什么</b>
                    <span>
                      {plan.metric}
                      {plan.formula ? `，${plan.formula}` : ""}
                    </span>
                  </div>
                  <div className="ag-kv">
                    <b>现在</b>
                    <span>{plan.baseline}</span>
                  </div>
                  <div className="ag-kv">
                    <b>做成</b>
                    <span>
                      {plan.threshold}
                      {plan.mde ? `，${plan.mde}` : ""}
                    </span>
                  </div>
                  <div className="ag-kv">
                    <b>至少</b>
                    <span>{plan.minSample}</span>
                  </div>
                  <div className="ag-kv">
                    <b>多久</b>
                    <span>{plan.estWeeks}</span>
                  </div>
                  <div className="ag-kv">
                    <b>通过后</b>
                    <span>{plan.sqlNote}</span>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          <div className="ag-brief-col">
            <h4>智能体都参考了什么</h4>
            <ul className="ag-sources">
              {sources.map((source) => (
                <li key={source.name} className={`is-${source.state}`}>
                  <span className="ag-source-icon" aria-label={SOURCE_STATE[source.state].label}>
                    {SOURCE_STATE[source.state].icon}
                  </span>
                  <div>
                    <b>{source.name}</b>
                    <span>{source.detail}</span>
                  </div>
                  {source.state === "unauthorized" && onAuthorize ? (
                    <Button size="small" type="link" onClick={() => onAuthorize(source.authKey)}>
                      去授权
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
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
        <span>近 7 天留资</span>
        <b>{cur}</b>
        <div className="ag-leads-split">
          <span>表单 {data.form}</span>
          <span>客服 {data.chat}</span>
        </div>
        <div className="ag-leads-tags">
          <Tag variant="filled" color={diff < 0 ? "error" : "success"}>
            较上周 {diff > 0 ? "+" : ""}
            {diff}
          </Tag>
          <Tag variant="filled">使用前周均 {data.beforeAvg}</Tag>
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

function StageTitle({ title, index, row, onOpen }) {
  const clickable = row.stage === index && (index === MONITOR_STAGE || index === RESULT_STAGE);
  if (!clickable) return title;
  return (
    <button type="button" className="ag-stage-link" onClick={() => onOpen(row)}>
      {title}
    </button>
  );
}

function TrackReadout({ row, onOpen }) {
  if (row.stage < MONITOR_STAGE && row.note) {
    return <span className="ag-track-note">{row.note}</span>;
  }
  if (row.stage === MONITOR_STAGE && row.monitor) {
    const m = row.monitor;
    return (
      <button type="button" className="ag-readout" onClick={() => onOpen(row)}>
        <Tag color="success">生效已核验</Tag>
        <span className="ag-readout-metric">{m.metric}</span>
        <span className="ag-readout-val">
          {pct(m.before.value)} <ArrowRightOutlined /> <b className={m.current.value >= m.threshold ? "is-up" : ""}>{pct(m.current.value)}</b>
        </span>
        <span className="ag-readout-line">达标 {pct(m.threshold)}</span>
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
          关联留资 {r.leads.before} <ArrowRightOutlined /> {r.leads.after}
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
        关联留资
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
            上线即刻生效确认 {m.verifiedAt ? <small>{m.verifiedAt}</small> : null}
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
            冻结直接主指标 <span>{m.metric}</span>
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
              <dt>最小可检出提升</dt>
              <dd>+{m.mde} 个百分点</dd>
            </div>
            <div>
              <dt>最小样本量</dt>
              <dd>
                {fmtInt(m.minSample)} {m.unit}
              </dd>
            </div>
            <div>
              <dt>最短可判定周期</dt>
              <dd>{m.minDays} 天</dd>
            </div>
          </dl>
          <div className="ag-mdl-progress">
            <span>样本进度</span>
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
        <span>该做法已自动记入本站防重历史，后续诊断不再重复建议</span>
        {reworked ? (
          <Button disabled>已提交换方向重做</Button>
        ) : (
          <Button type="primary" onClick={onRework}>
            换个方向重做
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
            冻结直接主指标 <span>{r.metric}</span>
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
              <dt>统计显著性</dt>
              <dd>{fmtP(r.p)}</dd>
            </div>
            <div>
              <dt>同期干扰</dt>
              <dd>{r.overlap || "无"}</dd>
            </div>
          </dl>
          {r.gain ? <p className="ag-mdl-gain">{r.gain}</p> : null}
        </section>
        {r.attribution ? (
          <section className="ag-mdl-block">
            <h4>归因与原因小结</h4>
            <p className="ag-mdl-attr">{r.attribution}</p>
          </section>
        ) : null}
      </div>
    </Modal>
  );
}

function suggestionStatus(item, decisions, adviceDone, trackRows) {
  if (item.kind === "advice") {
    return adviceDone[item.key]
      ? { label: "已处理", color: "success" }
      : { label: "待人工处理", color: "warning" };
  }
  if (item.kind === "brief") {
    const decision = decisions[item.key];
    if (decision?.status === "approved") return { label: "已批准", color: "processing" };
    if (decision?.status === "skipped") return { label: "暂不处理", color: "default" };
    return { label: "待你审批", color: "warning" };
  }
  const row = trackRows.find((track) => track.key === item.key);
  if (row?.result?.verdict) {
    const verdict = VERDICTS[row.result.verdict];
    return { label: verdict.label, color: verdict.color };
  }
  if (row) return { label: TRACK_STAGES[row.stage], color: "processing" };
  return { label: "执行中", color: "processing" };
}

function SuggestionModal({ open, weekLabel, decisions, adviceDone, trackRows, onClose, onOpen }) {
  const rows = SUGGESTIONS.map((item) => ({
    ...item,
    weekLabel: item.week || weekLabel,
    status: suggestionStatus(item, decisions, adviceDone, trackRows),
  }));

  return (
    <Modal open={open} width={920} footer={null} onCancel={onClose} title="建议记录">
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
          { title: "现象", dataIndex: "title", width: 168 },
          {
            title: "建议",
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
    <Modal open={open} width={660} footer={null} onCancel={onClose} title={`月度价值报告 · ${MONTHLY_REPORT.monthLabel}`}>
      <div className="ag-mdl">
        <section className="ag-mdl-block">
          <h4>本月已推进动作</h4>
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
            留资周趋势与动作上线节点 <small>使用前周均 {LEADS.beforeAvg} 条 · 小旗为动作上线周</small>
          </h4>
          <div className="ag-month-chart">
            <LeadBarChart weeks={LEADS.weeks} marks={LEADS.marks} />
          </div>
        </section>
        <section className="ag-mdl-block">
          <h4>下月准备做的事</h4>
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
  const advice = quiet ? [] : ADVICE;
  const pending = briefs.filter((brief) => !decisions[brief.key]);
  const skipped = briefs.filter((brief) => decisions[brief.key]?.status === "skipped");
  const approved = briefs.filter((brief) => decisions[brief.key]?.status === "approved");
  const hits = quiet ? [] : RULE_CHECKS.filter((rule) => rule.state === "hit");

  const trackRows = [
    ...approved.map((brief) => ({
      key: brief.key,
      title: brief.title,
      direction: brief.direction,
      executor: brief.executor,
      from: `${weekLabel}诊断`,
      approvedAt: "刚刚",
      stage: 0,
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
    { key: "pending", label: "待你审批", value: pending.length, hot: pending.length > 0 },
    { key: "running", label: "执行中", value: trackRows.filter((row) => row.stage < MONITOR_STAGE).length },
    { key: "monitor", label: "监测中", value: trackRows.filter((row) => row.stage === MONITOR_STAGE).length },
    { key: "proven", label: "已证实有效", value: trackRows.filter((row) => row.result?.verdict === "effective").length },
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
    document.getElementById(`advice-${key}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    flash(key);
  }

  function approve(brief) {
    setDecisions((prev) => ({ ...prev, [brief.key]: { status: "approved" } }));
    message.success(`已分发至${brief.executor}`);
  }

  function skip(brief, reasonKey) {
    const reason = SKIP_REASONS.find((item) => item.key === reasonKey);
    setDecisions((prev) => ({ ...prev, [brief.key]: { status: "skipped", reason } }));
    message.info(`已暂不处理：${reason.effect}`);
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
    message.success("生产上线已确认，当场生效核验通过，已切入监测期");
  }

  function rework(row) {
    setReworkedKeys((prev) => ({ ...prev, [row.key]: true }));
    message.success("原做法已记入本站防重，下一轮诊断将换方向生成新方案");
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

        <SectionTitle title="待你审批" />
        {pending.length ? (
          pending.map((brief) => (
            <BriefCard
              key={brief.key}
              brief={brief}
              open={openKeys.includes(brief.key)}
              highlighted={flashKey === brief.key}
              extra={extraNotes[brief.key] || ""}
              authMap={authMap}
              cardRef={(node) => {
                cardRefs.current[brief.key] = node;
              }}
              onToggle={() => toggle(brief.key)}
              onExtra={(value) => setExtraNotes((prev) => ({ ...prev, [brief.key]: value }))}
              onApprove={() => approve(brief)}
              onSkip={(reasonKey) => skip(brief, reasonKey)}
              onAuthorize={onAuthorize}
            />
          ))
        ) : (
          <Card className="ag-empty">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={quiet ? "本周全站表现平稳，无新增任务" : "本期所有待审批任务均已处理"}
            />
          </Card>
        )}

        {skipped.length ? (
          <div className="ag-skipped">
            {skipped.map((brief) => (
              <div key={brief.key} className="ag-skipped-row">
                <Tag>暂不处理</Tag>
                <b>{brief.title}</b>
                <span>
                  {decisions[brief.key].reason.label} · {decisions[brief.key].reason.effect}
                </span>
                <Button type="link" size="small" onClick={() => undo(brief)}>
                  撤回
                </Button>
              </div>
            ))}
          </div>
        ) : null}

        {advice.map((item) => {
          const done = Boolean(adviceDone[item.key]);
          return (
            <div key={item.key} id={`advice-${item.key}`} className={`ag-advice${flashKey === item.key ? " is-flash" : ""}`}>
              <Tag color={done ? "success" : "warning"}>{done ? "已处理" : "人工"}</Tag>
              <div className="ag-advice-main">
                <b>{item.title}</b>
              </div>
              <Button
                size="small"
                onClick={() => {
                  setAdviceDone((prev) => ({ ...prev, [item.key]: !done }));
                  if (!done) message.success("已记录人工处理状态");
                }}
              >
                {done ? "撤回状态" : "标记已处理"}
              </Button>
            </div>
          );
        })}

        <SectionTitle title="诊断依据" />
        {hits.length ? (
          <div className="ag-rules-list">
            {hits.map((rule) => {
              const strategies = [];
              (rule.briefKeys || []).forEach((key) => {
                const brief = briefOf(key);
                if (!brief) return;
                const isApproved = decisions[key]?.status === "approved";
                strategies.push({
                  key,
                  kind: "brief",
                  direction: brief.direction,
                  status: isApproved ? "已批准" : brief.carryOver || "",
                  statusColor: isApproved ? "success" : "warning",
                  label: brief.summary,
                });
              });
              if (rule.trackKey) {
                const tr = trackRows.find((row) => row.key === rule.trackKey);
                if (tr) {
                  strategies.push({
                    key: tr.key,
                    kind: "track",
                    direction: tr.direction || tr.executor,
                    status: TRACK_STAGES[tr.stage],
                    statusColor: "processing",
                    label: tr.summary || tr.title,
                  });
                }
              }
              (rule.adviceKeys || []).forEach((key) => {
                const item = ADVICE.find((row) => row.key === key);
                if (item) {
                  strategies.push({
                    key,
                    kind: "advice",
                    direction: "人工处理",
                    status: adviceDone[item.key] ? "已处理" : "",
                    statusColor: "success",
                    label: item.title,
                  });
                }
              });

              return (
                <article key={rule.key} className="ag-rule">
                  <h3 className="ag-rule-title">{rule.title}</h3>
                  <dl className="ag-dx">
                    <div>
                      <dt>网站现象</dt>
                      <dd>{rule.phenomenon}</dd>
                    </div>
                    {FACE_ROWS.map(([field, label]) => (
                      <div key={field}>
                        <dt>{label}</dt>
                        <dd>{rule.face[field]}</dd>
                      </div>
                    ))}
                    <div>
                      <dt>优化策略</dt>
                      <dd>
                        <ul className="ag-strategies">
                          {strategies.map((item) => (
                            <li key={item.key}>
                              <Tag variant="filled">{item.direction}</Tag>
                              {item.status ? <Tag color={item.statusColor}>{item.status}</Tag> : null}
                              <Button
                                type="link"
                                size="small"
                                onClick={() => {
                                  if (item.kind === "brief") locateBriefOrTrack(item.key);
                                  else if (item.kind === "track") locateTrack(item.key);
                                  else locateAdvice(item.key);
                                }}
                              >
                                {item.label}
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                  </dl>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="ag-layer-note">本周各转化环节均在正常区间，无可归因卡点。</p>
        )}

        <SectionTitle title="执行跟踪" />
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
                      查看任务
                    </Button>
                  ) : null}
                  {row.stage === 2 && row.readyMonitor ? (
                    <Button size="small" type="primary" ghost onClick={() => confirmLaunch(row)}>
                      确认已上线
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
                    title: <StageTitle title={title} index={index} row={row} onOpen={setModalRow} />,
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
