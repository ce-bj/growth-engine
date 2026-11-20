import { useState } from "react";
import { Button, Card, Descriptions, Drawer, Dropdown, Empty, Input, Tag, Typography } from "antd";
import { ApiOutlined, BookOutlined, DownOutlined, GlobalOutlined, SearchOutlined } from "@ant-design/icons";
import { ADVICE, BRIEFS, RULE_CHECKS, TRACKING } from "../diagnosisPeriod.js";

const SKIP_REASONS = [
  { key: "doing", label: "这件事我已经在做了", effect: "下周如果还是这个问题，不再重复发给你。" },
  { key: "disagree", label: "我不同意这个判断", effect: "我们记下来，以后换一种做法。" },
  { key: "later", label: "以后再说", effect: "下周如果问题还在，会再提醒你。" },
];

const REF_CHANNELS = [
  { key: "site", name: "本站页面", icon: <GlobalOutlined /> },
  { key: "websearch", name: "WebSearch", icon: <SearchOutlined /> },
  { key: "mcp", name: "MCP明细数据", icon: <ApiOutlined /> },
  { key: "knowledge", name: "企业知识库", icon: <BookOutlined /> },
];

const PANE_STYLES = { body: { padding: 12 } };
const DESC_STYLES = { label: { width: 112, whiteSpace: "nowrap" } };

function resolveRefs(refs, authMap) {
  return REF_CHANNELS.map((channel) => {
    const hit = refs?.[channel.key];
    if (!hit || hit.state === "empty") return null;
    const authorized = hit.state === "unauthorized" && authMap?.[hit.authKey];
    return {
      ...channel,
      ...hit,
      state: authorized ? "ok" : hit.state || "ok",
    };
  }).filter(Boolean);
}

function citeLabel(row) {
  if (row.key === "site") {
    if (row.url) {
      try {
        const path = new URL(row.url).pathname.replace(/\/$/, "");
        return path.split("/").filter(Boolean).pop() || row.title;
      } catch {
        return row.title || row.url;
      }
    }
    return row.title;
  }
  if (row.key === "websearch") return row.query;
  if (row.key === "mcp") return row.tool;
  return row.title;
}

function SourceBody({ row, onAuthorize }) {
  if (row.state === "unauthorized") {
    return (
      <div className="ag-cite-body">
        {row.fields?.length ? <Descriptions bordered size="small" column={1} items={row.fields.map((item) => ({ key: item.label, label: item.label, children: item.value }))} /> : null}
        <p className="ag-cite-auth">
          这项数据还没授权。
          {onAuthorize && row.authKey ? (
            <Button type="link" onClick={() => onAuthorize(row.authKey)}>
              去授权
            </Button>
          ) : null}
        </p>
      </div>
    );
  }
  if (row.key === "websearch") {
    return (
      <ul className="ag-cite-results">
        {(row.results || []).map((item) => (
          <li key={item.url || item.title}>
            <Typography.Link href={item.url} target="_blank" rel="noreferrer">
              {item.title}
            </Typography.Link>
            {item.url ? <span>{item.url}</span> : null}
            {item.snippet ? <p>{item.snippet}</p> : null}
          </li>
        ))}
      </ul>
    );
  }
  if (row.key === "mcp" && row.fields?.length) {
    return <Descriptions bordered size="small" column={1} items={row.fields.map((item) => ({ key: item.label, label: item.label, children: item.value }))} />;
  }
  if (row.excerpt) return <pre className="ag-cite-excerpt">{row.excerpt}</pre>;
  return null;
}

function Lines({ value }) {
  if (value == null || value === "") return null;
  const items = (Array.isArray(value) ? value : [value]).filter(Boolean);
  if (!items.length) return null;
  if (items.length === 1) return items[0];
  return (
    <ol className="ag-lines">
      {items.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ol>
  );
}

function TargetValue({ value }) {
  if (typeof value === "string" && /^https?:\/\//.test(value)) {
    return (
      <Typography.Link href={value} target="_blank" rel="noreferrer">
        {value}
      </Typography.Link>
    );
  }
  return value;
}

function RequirementBody({ sections, fallback, constraints }) {
  const limits = (Array.isArray(constraints) ? constraints : constraints ? [constraints] : []).filter(Boolean);
  if (sections?.length || limits.length) {
    return (
      <div className="ag-req">
        {(sections || []).map((section) => (
          <section key={`${section.label}-${section.mode || ""}`}>
            <h4>{section.label}</h4>
            {section.mode ? <p className="ag-req-mode">{section.mode}</p> : null}
            <Lines value={section.lines} />
          </section>
        ))}
        {limits.length ? (
          <section>
            <h4>约束</h4>
            <Lines value={limits} />
          </section>
        ) : null}
      </div>
    );
  }
  return <Lines value={fallback} />;
}

function FieldDesc({ items, column = 1 }) {
  const visible = items
    .filter((item) => {
      const value = item.children;
      return Array.isArray(value) ? value.filter(Boolean).length > 0 : Boolean(value);
    })
    .map((item) => ({
      ...item,
      children: Array.isArray(item.children) ? <Lines value={item.children} /> : item.children,
    }));
  if (!visible.length) return null;
  return <Descriptions bordered size="small" column={column} items={visible} styles={DESC_STYLES} />;
}

function SourceList({ refs, authMap, onAuthorize }) {
  const [openKey, setOpenKey] = useState("");
  const view = resolveRefs(refs, authMap);
  const current = view.find((row) => row.key === openKey);
  if (!view.length) return <Typography.Text type="secondary">这次没有引用外部资料。</Typography.Text>;
  return (
    <>
      <div className="ag-cites">
        {view.map((row) => (
          <button
            key={row.key}
            type="button"
            className={`ag-cite${row.state === "unauthorized" ? " is-warn" : ""}`}
            onClick={() => setOpenKey(row.key)}
          >
            {row.icon}
            <span className="ag-cite-kind">{row.name}</span>
            <span className="ag-cite-title">{citeLabel(row)}</span>
          </button>
        ))}
      </div>
      <Drawer
        open={Boolean(current)}
        size={420}
        title={
          current ? (
            <span className="ag-cite-drawer-title">
              {current.icon}
              {current.name}
            </span>
          ) : null
        }
        extra={
          current?.url ? (
            <Typography.Link href={current.url} target="_blank" rel="noreferrer">
              打开原页
            </Typography.Link>
          ) : current?.query ? (
            <Typography.Text type="secondary">{current.query}</Typography.Text>
          ) : current?.tool ? (
            <Typography.Text type="secondary">{current.tool}</Typography.Text>
          ) : current?.title ? (
            <Typography.Text type="secondary">{current.title}</Typography.Text>
          ) : null
        }
        onClose={() => setOpenKey("")}
      >
        {current ? <SourceBody row={current} onAuthorize={onAuthorize} /> : null}
      </Drawer>
    </>
  );
}

function strategySentence(item) {
  if (item.kind === "advice") return "这件事不交给智能体。请你自己到广告后台，把询价广告的打开地址改到新页面。";
  if (item.kind === "track") return `${item.direction}。这件事已经交给${item.executor}，正在做，还没上线。`;
  return `${item.direction}。这件事交给${item.executor}来做。`;
}

function TaskCard({
  item,
  rule,
  decision,
  extra,
  open,
  highlighted,
  authMap,
  onToggle,
  onExtra,
  onApprove,
  onSkip,
  onUndo,
  onAuthorize,
  onLocateTrack,
  cardRef,
}) {
  const plan = item.planPreview;
  const waiting = item.kind === "brief" && !decision;
  const approved = decision?.status === "approved";
  const skipped = decision?.status === "skipped";
  let status = "等你决定";
  let statusColor = "warning";
  if (item.kind === "advice") {
    status = "人工处理建议";
    statusColor = "warning";
  } else if (skipped) {
    status = "这次先不做";
    statusColor = "default";
  } else if (approved || item.kind === "track") {
    status = "你已经同意";
    statusColor = "success";
  }

  return (
    <article ref={cardRef} id={`task-${item.key}`} className={`ag-task${open ? " is-open" : ""}${highlighted ? " is-flash" : ""}`}>
      <header className="ag-task-head">
        <div className="ag-task-lead">
          <h3>{item.title}</h3>
          <div className="ag-task-tags">
            <Tag color={statusColor}>{status}</Tag>
          </div>
        </div>
        <div className="ag-task-actions">
          <Button type="link" onClick={() => onToggle(item.key)}>
            {open ? "收起" : "查看明细"}
          </Button>
          {item.kind === "brief" && waiting ? (
            <>
              <Dropdown
                trigger={["click"]}
                menu={{
                  items: SKIP_REASONS.map((reason) => ({ key: reason.key, label: reason.label })),
                  onClick: ({ key }) => onSkip(item, key),
                }}
              >
                <Button>
                  这次先不做 <DownOutlined />
                </Button>
              </Dropdown>
              <Button type="primary" onClick={() => onApprove(item)}>
                同意，交给{item.executor}
              </Button>
            </>
          ) : null}
          {skipped ? (
            <Button type="link" onClick={() => onUndo(item)}>
              撤回，重新决定
            </Button>
          ) : null}
          {approved || item.kind === "track" ? (
            <Button onClick={() => onLocateTrack(item.kind === "track" ? item.trackKey : item.key)}>查看这件事做到哪一步</Button>
          ) : null}
        </div>
      </header>

      {open ? <p className="ag-sentence">{item.summary}</p> : null}
      {!open && rule?.face?.cause ? <p className="ag-why">原因：{rule.face.cause}</p> : null}
      {approved && item.afterApprove ? <p className="ag-task-note">{item.afterApprove}</p> : null}

      {open ? (
        <div className={`ag-task-grid${item.kind === "advice" ? " is-no-plan" : ""}`}>
          <Card className="ag-pane ag-pane-spec" size="small" type="inner" title="任务说明" styles={PANE_STYLES}>
            <FieldDesc
              items={[
                {
                  key: "name",
                  label: "任务名称",
                  children: (
                    <div>
                      <div>{item.title}</div>
                      {item.target ? (
                        <div className="ag-req-target">
                          <TargetValue value={item.target} />
                        </div>
                      ) : null}
                    </div>
                  ),
                },
                {
                  key: "req",
                  label: "任务要求",
                  children: (
                    <RequirementBody
                      sections={item.requirementSections}
                      fallback={item.requirements}
                      constraints={item.constraints}
                    />
                  ),
                },
                item.extra && !waiting ? { key: "extra", label: "你补充的要求", children: item.extra } : null,
              ].filter(Boolean)}
            />
            {item.kind === "brief" && waiting ? (
              <div className="ag-extra-block">
                <Typography.Text type="secondary">你还想补充</Typography.Text>
                <Input.TextArea
                  value={extra}
                  placeholder="可以写别的要求。没有就留空。"
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  onChange={(event) => onExtra(item.key, event.target.value)}
                />
              </div>
            ) : null}
          </Card>

          <Card className="ag-pane ag-pane-reason" size="small" type="inner" title="依据是什么" styles={PANE_STYLES}>
            <FieldDesc
              items={[
                { key: "phenomenon", label: "网站现象", children: rule?.phenomenon },
                { key: "data", label: "数据表现", children: rule?.face?.data },
                { key: "cause", label: "根本原因", children: rule?.face?.cause },
                { key: "strategy", label: "优化策略", children: strategySentence(item) },
              ]}
            />
          </Card>

          <Card className="ag-pane ag-pane-sources" size="small" type="inner" title="智能体参考了什么" styles={PANE_STYLES}>
            <SourceList refs={item.refs} authMap={authMap} onAuthorize={onAuthorize} />
          </Card>

          {item.kind === "advice" ? null : (
            <Card
              className="ag-pane ag-pane-plan"
              size="small"
              type="inner"
              title="评估计划"
              extra={plan?.badge ? <Tag>{plan.badge}</Tag> : null}
              styles={PANE_STYLES}
            >
              {plan ? (
                <FieldDesc
                  items={[
                    { key: "metric", label: "看什么", children: [plan.metric, plan.formula].filter(Boolean) },
                    { key: "baseline", label: "现在是多少", children: plan.baseline },
                    { key: "goal", label: "做成什么样算有效", children: [plan.threshold, plan.mde].filter(Boolean) },
                    { key: "sample", label: "至少要有多少访客", children: plan.minSample },
                    { key: "when", label: "预计多久能下结论", children: plan.estWeeks || plan.badge },
                    { key: "after", label: "你点通过之后", children: plan.sqlNote },
                  ]}
                />
              ) : (
                <Typography.Text type="secondary">这件事已经在做，进度和效果数字在下方「已经在做的事」里。</Typography.Text>
              )}
            </Card>
          )}
        </div>
      ) : null}
    </article>
  );
}

function tasksForRule(rule, decisions, adviceDone) {
  const tasks = [];
  (rule.briefKeys || []).forEach((key) => {
    const brief = BRIEFS.find((item) => item.key === key);
    if (!brief) return;
    const decision = decisions[key];
    tasks.push({ ...brief, kind: "brief", decision, extraNote: "" });
  });
  (rule.adviceKeys || []).forEach((key) => {
    const item = ADVICE.find((row) => row.key === key);
    if (!item) return;
    tasks.push({ ...item, kind: "advice", done: Boolean(adviceDone[key]) });
  });
  if (rule.trackKey && !rule.briefKeys?.length) {
    const row = TRACKING.find((item) => item.key === rule.trackKey);
    if (row) {
      tasks.push({
        key: rule.trackKey,
        kind: "track",
        trackKey: rule.trackKey,
        title: row.title,
        summary: row.summary,
        target: row.target,
        requirements: row.requirements,
        constraints: [],
        direction: row.direction,
        executor: row.executor,
        refs: {
          ...(rule.face?.pageFact
            ? {
                site: {
                  state: "ok",
                  title: row.title,
                  url: row.target?.startsWith("http") ? row.target : undefined,
                  excerpt: rule.face.pageFact,
                },
              }
            : {}),
          ...(rule.face?.data
            ? {
                mcp: {
                  state: "ok",
                  tool: "page_metrics.get",
                  excerpt: rule.face.data,
                },
              }
            : {}),
        },
        planPreview: row.readyMonitor
          ? {
              metric: "打开新的打样页之后，继续往下看的人占多少。",
              formula: "用继续往下看的人数，除以打开这页的人数。",
              baseline: `上线前，打开产品列表后继续看的人占 ${row.readyMonitor.before.value}%。`,
              threshold: `这个比例要达到 ${row.readyMonitor.threshold}%。`,
              minSample: `至少要有 ${row.readyMonitor.minSample} 人打开这页，才够判断。`,
              estWeeks: `你确认上线之后，最快 ${row.readyMonitor.minDays} 天能下结论。`,
              sqlNote: "你确认上线之后，用来比较的数字就固定下来。",
            }
          : null,
      });
    }
  }
  return tasks;
}

export function DecisionSection({
  quiet,
  decisions,
  adviceDone,
  extraNotes,
  authMap,
  openKeys = [],
  flashKey,
  onToggle,
  onApprove,
  onSkip,
  onUndo,
  onExtra,
  onAuthorize,
  onLocateTrack,
  cardRef,
}) {
  const rules = quiet ? [] : RULE_CHECKS.filter((rule) => rule.state === "hit");
  const cards = rules
    .flatMap((rule) => tasksForRule(rule, decisions, adviceDone).map((item) => ({ rule, item })))
    .sort((a, b) => Number(a.item.kind === "advice") - Number(b.item.kind === "advice"));

  return (
    <section className="ag-decisions">
      <div className="ag-section-head">
        <h2>本期要你决定的事</h2>
      </div>
      {cards.length ? (
        cards.map(({ rule, item }) => (
          <TaskCard
            key={item.key}
            item={{ ...item, extra: extraNotes[item.key] }}
            rule={rule}
            decision={decisions[item.key]}
            extra={extraNotes[item.key] || ""}
            open={openKeys.includes(item.key)}
            highlighted={flashKey === item.key}
            authMap={authMap}
            onToggle={onToggle}
            onExtra={onExtra}
            onApprove={onApprove}
            onSkip={onSkip}
            onUndo={onUndo}
            onAuthorize={onAuthorize}
            onLocateTrack={onLocateTrack}
            cardRef={(node) => cardRef(item.key, node)}
          />
        ))
      ) : (
        <Card className="ag-empty">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={quiet ? "这一周网站没有需要你决定的修改。" : "这一期需要你决定的事，你都处理完了。"} />
        </Card>
      )}
    </section>
  );
}
