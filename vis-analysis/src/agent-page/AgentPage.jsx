import { useRef, useState } from "react";
import { App as AntApp, Button, Card, ConfigProvider, Dropdown, Empty, Input, Steps, Tag } from "antd";
import { CheckCircleFilled, DownOutlined, ExclamationCircleFilled, LockOutlined } from "@ant-design/icons";
import { getStages, stateOfThrough, STUCK_LABEL, through } from "../funnel-review/data.js";
import { ADVICE, BRIEFS, RULE_CHECKS, TRACK_STAGES, TRACKING } from "../diagnosisPeriod.js";
import { BOARD_THEME } from "../board-theme.js";
import "./agent-page.css";

const SKIP_REASONS = [
  { key: "doing", label: "已经在做了", effect: "下周同一现象不再出任务" },
  { key: "disagree", label: "不认同这个判断", effect: "下次不再按这个判断出任务" },
  { key: "later", label: "以后再说", effect: "下周照常出" },
];

const SOURCE_STATE = {
  ok: { icon: <CheckCircleFilled />, label: "已取到" },
  unauthorized: { icon: <LockOutlined />, label: "未授权" },
  missing: { icon: <ExclamationCircleFilled />, label: "缺资料" },
};

const AGENT_VIEW = {
  智能营销页智能体: "marketing",
  AI运营助手: "assistant",
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
const layerShort = (lossId) => (lossId === "entry" ? "访问入口" : STUCK_LABEL[lossId].replace("这一层", ""));
const ruleOf = (key) => RULE_CHECKS.find((item) => item.key === key);
const briefOf = (key) => BRIEFS.find((item) => item.key === key);

function taskLabel(brief) {
  const action = brief.title.split("·").pop().trim();
  return `${brief.direction} · ${action}`;
}

const FACE_ROWS = [
  ["data", "数据表现"],
  ["phenomenon", "访客现象"],
  ["cause", "诊断原因"],
  ["plan", "应对方案"],
];

const STAGES = getStages("site");
const GATES = through(STAGES);
const [ENTRY, , , LEAD] = STAGES;
const STUCK = GATES.find((gate) => stateOfThrough(gate.pass, gate.passPrev) === "异常");

function compareWord(cur, prev, unit) {
  if (cur === prev) return "与上周持平";
  return `较上周${cur > prev ? "多" : "少"} ${fmtInt(Math.abs(cur - prev))} ${unit}`;
}

function SectionTitle({ title, hint, extra }) {
  return (
    <div className="ag-section-head">
      <h2>{title}</h2>
      {hint ? <span>{hint}</span> : null}
      {extra ? <div className="ag-section-extra">{extra}</div> : null}
    </div>
  );
}

function sourceView(source, authMap) {
  if (source.state === "unauthorized" && authMap?.[source.authKey]) {
    return { ...source, state: "ok", detail: "已授权，下次诊断起按广告实际搜索词取资料" };
  }
  return source;
}

function BriefCard({ brief, open, extra, authMap, onToggle, onExtra, onApprove, onSkip, onAuthorize, cardRef }) {
  const sources = brief.sources.map((item) => sourceView(item, authMap));
  const locked = sources.filter((item) => item.state === "unauthorized").length;

  return (
    <Card className="ag-brief" ref={cardRef}>
      <div className="ag-brief-head">
        <div className="ag-brief-title">
          <Tag color="error">{brief.priority}</Tag>
          <h3>{brief.title}</h3>
          <Tag variant="filled">方向 · {brief.direction}</Tag>
        </div>
        <div className="ag-brief-actions">
          <Button type="text" onClick={onToggle}>
            {open ? "收起说明" : "看完整说明"}
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
      {open ? null : <p className="ag-brief-summary">{brief.summary}</p>}
      <div className="ag-kv is-lead">
        <b>依据</b>
        <span>{brief.why}</span>
      </div>
      <div className="ag-brief-chips">
        <span>查了 {sources.length} 份资料</span>
        {locked ? <span className="is-lock">{locked} 项未授权</span> : null}
      </div>

      {open ? (
        <div className="ag-brief-body">
          <div className="ag-brief-col">
            <h4>为什么要做</h4>
            <ul className="ag-brief-rules">
              {brief.ruleKeys.map((key) => {
                const rule = ruleOf(key);
                return (
                  <li key={key}>
                    <span>{rule?.hypothesis}</span>
                  </li>
                );
              })}
            </ul>
            <h4>具体策略</h4>
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
            <p className="ag-brief-after">{brief.afterApprove}</p>
          </div>
          <div className="ag-brief-col">
            <h4>智能体查了什么</h4>
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

export default function AgentPage({ weekLabel, quiet, authMap, onAuthorize }) {
  const { message } = AntApp.useApp();
  const [decisions, setDecisions] = useState({});
  const [extraNotes, setExtraNotes] = useState({});
  const [openKeys, setOpenKeys] = useState([BRIEFS[0].key]);
  const cardRefs = useRef({});

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
      executor: brief.executor,
      from: `${weekLabel}诊断`,
      approvedAt: "刚刚",
      stage: 0,
      note: `已交给${brief.executor}，${brief.afterApprove}`,
      summary: brief.summary,
      target: brief.target,
      requirements: brief.requirements,
      extra: extraNotes[brief.key]?.trim() || "",
    })),
    ...TRACKING,
  ];
  const tracking = trackRows.length;

  function toggle(key) {
    setOpenKeys((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));
  }

  function openTask(key) {
    setOpenKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
    cardRefs.current[key]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openAdvice(key) {
    document.getElementById(`advice-${key}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function approve(brief) {
    setDecisions((prev) => ({ ...prev, [brief.key]: { status: "approved" } }));
    message.success(`已交给${brief.executor}`);
  }

  function skip(brief, reasonKey) {
    const reason = SKIP_REASONS.find((item) => item.key === reasonKey);
    setDecisions((prev) => ({ ...prev, [brief.key]: { status: "skipped", reason } }));
    message.info(`已暂不处理：${reason.effect}`);
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
    const port = view === "marketing" ? 5186 : view === "assistant" ? 5174 : 5178;
    const url = new URL(`http://${host}:${port}/`);
    if (view === "assistant") url.searchParams.set("embed", "assistant");
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

  const stuckPage = STUCK ? hits.find((rule) => rule.lossId === STUCK.lossId && rule.page)?.page : "";
  const headline = quiet
    ? `${weekLabel}：各层都在正常范围，没有要批的任务。`
    : `${weekLabel}：访问人数${compareWord(ENTRY.cur, ENTRY.prev, "人")}，留资访客${compareWord(LEAD.cur, LEAD.prev, "人")}${
        STUCK ? `，卡在「${layerShort(STUCK.lossId)}」这一层${stuckPage ? `（${stuckPage}）` : ""}` : ""
      }。写好 ${briefs.length} 份任务说明${advice.length ? `，另有 ${advice.length} 条站外建议` : ""}。`;

  return (
    <ConfigProvider theme={BOARD_THEME}>
      <div className="ag-page">
        <section className="ag-summary" aria-label="本期结论">
          <p>{headline}</p>
          <dl>
            <div className={pending.length ? "is-hot" : ""}>
              <dt>待你审批</dt>
              <dd>{pending.length}</dd>
            </div>
            <div>
              <dt>执行跟踪中</dt>
              <dd>{tracking}</dd>
            </div>
          </dl>
        </section>

        <SectionTitle title="待你审批" hint="查完资料后写的任务说明，通过后交给对应智能体执行" />
        {pending.length ? (
          pending.map((brief) => (
            <BriefCard
              key={brief.key}
              brief={brief}
              open={openKeys.includes(brief.key)}
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
              description={quiet ? "这一周没有要批的任务" : "本期任务说明都处理完了"}
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
        {advice.map((item) => (
          <div key={item.key} id={`advice-${item.key}`} className="ag-advice">
            <Tag color="warning">站外建议 · {item.owner}</Tag>
            <div>
              <b>{item.title}</b>
              <p>{item.detail}</p>
            </div>
          </div>
        ))}

        <SectionTitle title="诊断依据" hint="根据这周的访问数据做出的判断" />
        {hits.length ? (
          <div className="ag-rules-list">
            {hits.map((rule) => {
              const steps = [
                ...(rule.briefKeys || []).map((key) => ({ key, label: taskLabel(briefOf(key)), kind: "task" })),
                ...(rule.adviceKeys || []).map((key) => {
                  const item = ADVICE.find((row) => row.key === key);
                  return { key, label: `${item.owner} · ${item.title}`, kind: "advice" };
                }),
              ];
              return (
                <article key={rule.key} className="ag-rule">
                  <b>{rule.page}</b>
                  <dl className="ag-dx">
                    {FACE_ROWS.map(([field, label]) => (
                      <div key={field}>
                        <dt>{label}</dt>
                        <dd>{rule.face[field]}</dd>
                      </div>
                    ))}
                    <div>
                      <dt>具体策略</dt>
                      <dd className="ag-dx-steps">
                        {steps.map((step) => (
                          <Button
                            key={step.key}
                            className="ag-dx-link"
                            type="link"
                            size="small"
                            onClick={() => (step.kind === "task" ? openTask(step.key) : openAdvice(step.key))}
                          >
                            {step.label}
                          </Button>
                        ))}
                      </dd>
                    </div>
                  </dl>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="ag-layer-note">这周没有要说明的问题。</p>
        )}
        <SectionTitle title="执行跟踪" hint="批准过的任务现在到哪一步。要看这条任务，打开对应智能体" />
        <Card className="ag-track">
          {trackRows.map((row) => (
            <div key={row.key} className="ag-track-row">
              <div className="ag-track-info">
                <div className="ag-track-name">
                  <b>{row.title}</b>
                  {AGENT_VIEW[row.executor] ? (
                    <Button size="small" onClick={() => openAgentTask(row)}>
                      查看任务
                    </Button>
                  ) : null}
                </div>
                <span>
                  {row.executor} · 来自{row.from} · {row.approvedAt}批准
                </span>
                <small>{row.note}</small>
              </div>
              <Steps
                className="ag-track-steps"
                type="dot"
                size="small"
                current={row.stage}
                status={row.stage >= TRACK_STAGES.length - 1 ? "finish" : "process"}
                items={TRACK_STAGES.map((title) => ({ title }))}
              />
            </div>
          ))}
        </Card>
      </div>
    </ConfigProvider>
  );
}
