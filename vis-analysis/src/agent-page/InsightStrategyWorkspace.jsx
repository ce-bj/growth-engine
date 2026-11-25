import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Descriptions,
  Drawer,
  Dropdown,
  Empty,
  Input,
  Segmented,
  Tag,
  Typography,
} from "antd";
import {
  ApiOutlined,
  BarChartOutlined,
  BookOutlined,
  CheckCircleFilled,
  DownOutlined,
  GlobalOutlined,
  LeftOutlined,
  RightOutlined,
  SearchOutlined,
  UpOutlined,
} from "@ant-design/icons";
import { ADVICE, BRIEFS, RULE_CHECKS, TRACKING, WEEKS } from "../diagnosisPeriod.js";
import { fmtInt, pct } from "../funnel-review/data.js";
import { buildWeekModel } from "../detail-board/boardWindow.js";
import { getMcpBoard } from "../detail-board/mcpBoardData.js";
import {
  LOSS_PLAN,
  LossEvidence,
  RateTrend,
  TONE_LABEL,
  TONE_TAG,
  buildLosses,
  peopleMove,
  trendDelta,
  weekShortfall,
} from "../detail-board/IntakeInsight.jsx";
import "../detail-board/detail-board.css";

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

const ACTION_MAP = {
  l1: { id: "l1", no: 1, title: "提升有效浏览", short: "流失点 1 · 有效浏览", filter: "有效浏览" },
  l2: { id: "l2", no: 2, title: "提升转化交互", short: "流失点 2 · 转化交互", filter: "转化交互" },
  l3: { id: "l3", no: 3, title: "提升留资完成", short: "流失点 3 · 留资完成", filter: "留资完成" },
};

const QUICK_IMPACT = {
  "t-detail": "影响 420 人 · 有效浏览率 21.9%（建议 ≥ 40%）",
  "t-landing": "影响 210 人 · 跳失率 85.3%（建议压到 35% 以下）",
  "k-sample": "影响 64 人 · 继续往下看仅 25%（草稿已生成）",
  "t-article": "16 次站内无结果搜索 · 56% 搜完即走",
  "t-plan": "2 个高频零结果词缺少持续专栏承接",
  "a-ads": "需在广告后台把询价词落地页切到新页",
};

const ISSUE_TITLE_OVERRIDE = {
  "a-ads": "询价广告落地地址仍指向旧品牌页",
};

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
  if (row.key === "mcp") {
    if (row.tool === "page_metrics.get") return "页面访问与停留数据（近 7 天）";
    if (row.tool === "site_search.queries.get") return "站内搜索词（近 7 天）";
    return "页面数据";
  }
  return row.title;
}

function SourceDrawerBody({ row, onAuthorize }) {
  if (row.state === "unauthorized") {
    return (
      <div className="ag-cite-body">
        {row.fields?.length ? (
          <Descriptions
            bordered
            size="small"
            column={1}
            items={row.fields.map((item) => ({ key: item.label, label: item.label, children: item.value }))}
          />
        ) : null}
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
    return (
      <Descriptions
        bordered
        size="small"
        column={1}
        items={row.fields.map((item) => ({ key: item.label, label: item.label, children: item.value }))}
      />
    );
  }
  if (row.excerpt) return <pre className="ag-cite-excerpt">{row.excerpt}</pre>;
  return null;
}

function TargetValue({ value }) {
  if (typeof value === "string" && /^https?:\/\//.test(value)) {
    return (
      <Typography.Link href={value} target="_blank" rel="noreferrer">
        {value}
      </Typography.Link>
    );
  }
  return <span>{value}</span>;
}

function isOperatorLine(line) {
  const text = String(line || "").trim();
  return text === "不填" || text.startsWith("不填，") || text.startsWith("不填。") || /^不(改|填|写|编|换|指定)/.test(text);
}

function displayExecutor(name) {
  if (name === "内容运营智能体" || name === "内容发布智能体") return "官网内容发布";
  if (name === "智能营销页智能体") return "智能营销页";
  return name || "";
}

function bossCopy(text) {
  return String(text || "")
    .replace(/内容运营智能体|内容发布智能体/g, "官网内容发布")
    .replace(/智能营销页智能体/g, "智能营销页")
    .replace(/不改[^。；\n]*[。；]?/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function RequirementBody({ sections, fallback }) {
  const visible = (sections || [])
    .map((section) => ({
      ...section,
      lines: (section.lines || []).filter((line) => !isOperatorLine(line)),
    }))
    .filter((section) => section.lines.length && section.mode !== "不填");
  if (visible.length) {
    return (
      <div className="ag-req">
        {visible.map((section) => (
          <section key={`${section.label}-${section.mode || ""}`}>
            <h4>{section.label}</h4>
            {section.lines.length === 1 ? (
              <p className="ag-sentence">{section.lines[0]}</p>
            ) : (
              <ol className="ag-lines">
                {section.lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ol>
            )}
          </section>
        ))}
      </div>
    );
  }
  const lines = (fallback || []).filter((line) => !isOperatorLine(line));
  if (!lines.length) return null;
  return (
    <ul className="ag-lines">
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}

function buildItems(quiet) {
  if (quiet) return [];
  const rules = RULE_CHECKS.filter((rule) => rule.state === "hit");
  const rows = [];
  rules.forEach((rule) => {
    const adviceNotes = (rule.adviceKeys || [])
      .map((key) => ADVICE.find((item) => item.key === key))
      .filter(Boolean)
      .map((advice) => ({
        key: advice.key,
        title: advice.title,
        summary: advice.summary,
      }));
    (rule.briefKeys || []).forEach((key) => {
      const brief = BRIEFS.find((item) => item.key === key);
      if (!brief) return;
      rows.push({
        key: brief.key,
        kind: "brief",
        rule,
        issueTitle: ISSUE_TITLE_OVERRIDE[brief.key] || rule.title,
        impact: QUICK_IMPACT[brief.key] || brief.why || rule.face?.data,
        item: { ...brief, kind: "brief" },
        adviceNotes,
      });
    });
    if (rule.trackKey && !rule.briefKeys?.length) {
      const track = TRACKING.find((item) => item.key === rule.trackKey);
      if (track) {
        rows.push({
          key: track.key,
          kind: "track",
          rule,
          issueTitle: rule.title,
          impact: QUICK_IMPACT[track.key] || rule.face?.data,
          item: {
            key: track.key,
            kind: "track",
            trackKey: track.key,
            title: track.title,
            summary: track.summary,
            target: track.target,
            requirements: track.requirements,
            requirementSections: track.requirementSections,
            constraints: track.constraints || [],
            direction: track.direction,
            executor: track.executor,
            refs: {
              ...(rule.face?.pageFact
                ? {
                    site: {
                      state: "ok",
                      title: track.title,
                      url: track.target?.startsWith("http") ? track.target : undefined,
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
            planPreview: track.readyMonitor
              ? {
                  badge: `最快 ${track.readyMonitor.minDays} 天可下结论`,
                  metric: "打开新的打样页之后，继续往下看的人占多少。",
                  formula: "用继续往下看的人数，除以打开这页的人数。",
                  baseline: `上线前，打开产品列表后继续看的人占 ${track.readyMonitor.before.value}%。`,
                  threshold: `这个比例要达到 ${track.readyMonitor.threshold}%。`,
                  minSample: `至少要有 ${track.readyMonitor.minSample} 人打开这页，才够判断。`,
                  estWeeks: `你确认上线之后，最快 ${track.readyMonitor.minDays} 天能下结论。`,
                  sqlNote: "你确认上线之后，用来比较的数字就固定下来。",
                }
              : null,
          },
        });
      }
    }
  });
  return rows.sort((a, b) => Number(a.kind === "advice") - Number(b.kind === "advice"));
}

function resolveItemState(row, decisions, publishedMap, adviceDone) {
  const { key, kind } = row;
  if (kind === "advice") {
    if (adviceDone[key]) return { code: "done", label: "已处理", color: "success" };
    return { code: "advice", label: "人工处理建议", color: "gold" };
  }
  if (publishedMap[key]) {
    return { code: "live", label: "已上线", color: "success" };
  }
  const decision = decisions[key];
  if (decision?.status === "skipped") {
    return { code: "skipped", label: "先不做", color: "default" };
  }
  if (decision?.status === "approved" || kind === "track") {
    return { code: "preview", label: "待确认发布", color: "processing" };
  }
  return { code: "waiting", label: "待定策略", color: "warning" };
}

function ppDelta(move) {
  if (!move || move.dir === "flat" || !Number.isFinite(move.pp) || Math.abs(move.pp) < 0.05) return "持平";
  return `${move.pp > 0 ? "+" : ""}${move.pp.toFixed(1)} 个百分点`;
}

function ratePhrase(move) {
  const text = ppDelta(move);
  return text === "持平" ? "较上周环比持平" : `较上周 ${text}`;
}

const FUNNEL_COLORS = ["#155a7d", "#1f6f96", "#2f8bb8", "#4b9fc8"];
const FunnelChart = lazy(() => import("@ant-design/plots").then((mod) => ({ default: mod.Funnel })));

function funnelShape(stages) {
  const entry = stages[0]?.cur || 1;
  return stages.map((stage) => ({
    stage: stage.name,
    count: stage.cur,
    share: stage.cur / entry,
    width: 0.3 + 0.7 * Math.pow(stage.cur / entry, 0.35),
  }));
}

/** 旧版梯形漏斗 + 右侧流失点说明。外框高度由近期趋势撑开，这里铺满同一块。 */
function ClassicFunnel({ stages, losses, activeId, diagnosed, evidenceModel, onSelect }) {
  const boxRef = useRef(null);
  const [chartH, setChartH] = useState(360);
  const active = losses.find((item) => item.id === activeId) || losses[0];

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const measure = () => {
      const next = Math.round(el.clientHeight);
      setChartH((prev) => (next > 80 && Math.abs(prev - next) > 2 ? next : prev));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    measure();
    return () => observer.disconnect();
  }, []);

  if (!active) return null;

  return (
    <div className="db-insight-board__grid isw-funnel-classic">
      <div className="db-fd db-insight-funnel" ref={boxRef}>
        <div className="db-fd-chart">
          <Suspense fallback={<div className="db-chart-wait" style={{ height: chartH }} />}>
            <FunnelChart
              data={funnelShape(stages)}
              xField="stage"
              yField="width"
              height={chartH}
              autoFit
              margin={0}
              padding={0}
              legend={false}
              scale={{ color: { range: FUNNEL_COLORS } }}
              style={{ stroke: "#fff", lineWidth: 2 }}
              label={{
                text: (d) => `${d.stage}\n${fmtInt(d.count)} 人 · ${pct(d.share)}`,
                position: "inside",
                transform: [],
                fill: "#fff",
                fontSize: 13,
                fontWeight: 600,
                lineHeight: 18,
                textAlign: "center",
              }}
              tooltip={{
                title: "stage",
                items: [{ field: "count", name: "人数", valueFormatter: (value) => `${fmtInt(value)} 人` }],
              }}
            />
          </Suspense>
        </div>
        <div className="db-fd-rail">
          {losses.map((loss, index) => (
            <button
              key={loss.id}
              type="button"
              className={`db-fd-loss${active.id === loss.id ? " is-on" : ""}${loss.tone === "bad" ? " is-bad" : loss.tone === "flat" ? " is-flat" : ""}`}
              style={{ top: `${((index + 1) / stages.length) * 100}%` }}
              aria-pressed={active.id === loss.id}
              onClick={() => onSelect(loss.id)}
            >
              <span className="db-fd-loss-k">
                流失点 {index + 1}
                <Tag color={TONE_TAG[loss.tone]} className="db-tag-mini">
                  {TONE_LABEL[loss.tone]}
                </Tag>
              </span>
              <span className="db-fd-loss-v">{loss.action}</span>
            </button>
          ))}
        </div>
      </div>
      <aside className={`db-insight-detail is-${active.tone}`}>
        <div className="db-insight-detail__title">
          <h2>
            流失点 {losses.findIndex((item) => item.id === active.id) + 1} · {active.action}
          </h2>
          <Tag className={`db-insight-tone is-${active.tone}`}>{TONE_LABEL[active.tone]}</Tag>
        </div>
        <p className="db-insight-detail__path">{active.fromTo}</p>
        <div className="db-insight-detail__rate">
          <div className="db-insight-detail__main">
            <span>本环节{active.action.replace("提升", "")}率</span>
            <strong>{pct(active.gate.pass)}</strong>
          </div>
          <div className="db-insight-detail__side">
            <p>
              <em className={active.rateMove.dir === "up" ? "is-up" : active.rateMove.dir === "down" && active.tone === "bad" ? "is-down" : undefined}>
                {ppDelta(active.rateMove)}
              </em>
              {" ｜ "}建议 ≥ {pct(active.target)}
            </p>
            <p>{weekShortfall(active)}</p>
          </div>
        </div>
        {diagnosed ? <LossEvidence id={active.id} model={evidenceModel} /> : null}
      </aside>
    </div>
  );
}

export default function InsightStrategyWorkspace({
  weekId,
  diagnosed,
  quiet,
  decisions,
  publishedMap,
  adviceDone,
  extraNotes,
  authMap,
  initialFocusKey,
  initialLens,
  onSelectLatestWeek,
  onApprove,
  onSkip,
  onUndo,
  onToggleAdviceDone,
  onExtra,
  onAuthorize,
  onOpenPreview,
  onOpenTracking,
}) {
  const weekModel = useMemo(() => buildWeekModel(weekId), [weekId]);
  const stages = weekModel.stages.site;
  const losses = useMemo(() => buildLosses(stages), [stages]);
  const evidenceModel = useMemo(() => getMcpBoard("d7"), []);

  const [entry, , , lead] = stages;
  const entryMove = peopleMove(entry.cur, entry.prev);
  const leadMove = peopleMove(lead.cur, lead.prev);

  const allRows = useMemo(() => (diagnosed ? buildItems(quiet) : []), [diagnosed, quiet]);

  const [insightCollapsed, setInsightCollapsed] = useState(() => Boolean(initialFocusKey));
  const [lens, setLens] = useState(() => (initialLens === "trend" ? "trend" : "funnel"));
  const [lossFilter, setLossFilter] = useState("all");
  const [activeLossId, setActiveLossId] = useState("");
  const [selectedKey, setSelectedKey] = useState(() => {
    if (initialFocusKey && allRows.some((r) => r.key === initialFocusKey)) return initialFocusKey;
    return allRows[0]?.key || "";
  });
  const [drawerSource, setDrawerSource] = useState(null);
  const [drawerLossId, setDrawerLossId] = useState("");
  const [planOpen, setPlanOpen] = useState(false);
  const detailHeadRef = useRef(null);
  const skipDetailScroll = useRef(true);

  const visibleRows = useMemo(() => {
    if (lossFilter === "all") return allRows;
    return allRows.filter((row) => row.rule.lossId === lossFilter);
  }, [allRows, lossFilter]);

  useEffect(() => {
    if (!visibleRows.length) return;
    if (!visibleRows.some((r) => r.key === selectedKey)) {
      setSelectedKey(visibleRows[0].key);
    }
  }, [visibleRows, selectedKey]);

  useEffect(() => {
    if (initialFocusKey && allRows.some((r) => r.key === initialFocusKey)) {
      setLossFilter("all");
      setSelectedKey(initialFocusKey);
      setInsightCollapsed(true);
    }
  }, [initialFocusKey, allRows]);

  useEffect(() => {
    setPlanOpen(false);
    if (skipDetailScroll.current) {
      skipDetailScroll.current = false;
      return;
    }
    const node = detailHeadRef.current;
    if (!node) return;
    const top = node.getBoundingClientRect().top;
    if (top < 8 || top > window.innerHeight - 48) {
      node.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedKey]);

  const selectedIndex = visibleRows.findIndex((r) => r.key === selectedKey);
  const activeRow = visibleRows[selectedIndex] || visibleRows[0] || null;

  const waitingRows = useMemo(
    () => allRows.filter((row) => resolveItemState(row, decisions, publishedMap, adviceDone).code === "waiting"),
    [allRows, decisions, publishedMap, adviceDone],
  );

  const shortLoss = losses.find((item) => item.tone === "bad") || losses[0];
  const leadRate = entry.cur ? lead.cur / entry.cur : 0;
  const weekLabel = WEEKS.find((item) => item.id === weekId)?.label || "";
  const steadyLosses = losses.filter((item) => item.id !== shortLoss.id);
  const steadyHeld = steadyLosses.every((item) => item.tone === "ok");
  const ledger = useMemo(() => {
    const counts = { waiting: 0, preview: 0, advice: 0, skipped: 0, live: 0, done: 0, total: allRows.length };
    allRows.forEach((row) => {
      const code = resolveItemState(row, decisions, publishedMap, adviceDone).code;
      counts[code] = (counts[code] || 0) + 1;
    });
    const parts = [];
    if (counts.waiting) parts.push(`${counts.waiting} 项待定策略`);
    if (counts.preview) parts.push(`${counts.preview} 项待确认发布`);
    if (counts.advice) parts.push(`${counts.advice} 条人工处理建议`);
    if (counts.skipped) parts.push(`${counts.skipped} 项这次先不做`);
    if (counts.live) parts.push(`${counts.live} 项已上线`);
    if (counts.done) parts.push(`${counts.done} 项已处理`);
    return { ...counts, text: parts.join("、") };
  }, [allRows, decisions, publishedMap, adviceDone]);

  function toggleLossFilter(lossId) {
    setActiveLossId(lossId);
    setLossFilter((cur) => (cur === lossId ? "all" : lossId));
  }

  function selectLoss(lossId) {
    setActiveLossId(lossId);
    const count = allRows.filter((row) => row.rule.lossId === lossId).length;
    if (count > 0) setLossFilter(lossId);
  }

  function jumpNextWaiting(excludeKey) {
    const next = waitingRows.find((row) => row.key !== excludeKey);
    if (!next) return;
    if (lossFilter !== "all" && next.rule.lossId !== lossFilter) {
      setLossFilter("all");
    }
    setSelectedKey(next.key);
  }

  function handleSkipAndAdvance(item, reasonKey) {
    onSkip(item, reasonKey);
    jumpNextWaiting(item.key);
  }

  function handleApprove(item) {
    onApprove(item);
    jumpNextWaiting(item.key);
  }

  const activeState = activeRow ? resolveItemState(activeRow, decisions, publishedMap, adviceDone) : null;
  const activeItem = activeRow?.item;
  const activeRule = activeRow?.rule;
  const activeAction = activeRule ? ACTION_MAP[activeRule.lossId] || ACTION_MAP.l1 : ACTION_MAP.l1;
  const activeRefs = activeItem ? resolveRefs(activeItem.refs, authMap) : [];
  const nextWaiting = activeRow ? waitingRows.find((row) => row.key !== activeRow.key) : null;

  return (
    <div className="isw-root">
      {/* 第一层：轻量可折叠洞察头 */}
      <section className={`isw-insight${insightCollapsed ? " is-collapsed" : ""}`} aria-label="转化漏斗与趋势洞察">
        <div className="isw-insight-toolbar">
          {insightCollapsed ? (
            <p className="isw-insight-collapsed-line">
              <span className="ai-mark">AI 诊断</span>
              本周转化诊断小结（{weekLabel}）
            </p>
          ) : (
            <span className="ai-mark">AI 本周诊断</span>
          )}
          <div className="isw-insight-controls">
            {!insightCollapsed ? (
              <Segmented
                size="small"
                value={lens}
                onChange={setLens}
                options={[
                  { label: "漏斗结构", value: "funnel" },
                  { label: "近期趋势", value: "trend" },
                ]}
              />
            ) : null}
            <button
              type="button"
              className="isw-collapse-btn"
              aria-expanded={!insightCollapsed}
              onClick={() => setInsightCollapsed((v) => !v)}
            >
              {insightCollapsed ? (
                <>
                  展开洞察 <DownOutlined />
                </>
              ) : (
                <>
                  收起洞察 <UpOutlined />
                </>
              )}
            </button>
          </div>
        </div>

        {!insightCollapsed ? (
          <div className="isw-insight-body">
            <div className="dan-board isw-insight-summary">
              <div className="db-insight-summary">
                <div className="db-insight-summary__main">
                <span className="db-insight-summary__tag">本周转化诊断小结（{weekLabel}）</span>
                <p>
                  本周官网
                  {entryMove.dir === "flat" ? (
                    <>进站流量保持稳定（<strong>{fmtInt(entry.cur)} 人</strong>，较上周环比持平）</>
                  ) : (
                    <>进站 <strong>{fmtInt(entry.cur)} 人</strong>（{entryMove.text}）</>
                  )}
                  {leadMove.dir === "down" ? (
                    <>，但最终留资下滑至 <strong>{fmtInt(lead.cur)} 条</strong>（{leadMove.text}）</>
                  ) : leadMove.dir === "up" ? (
                    <>，最终留资回升至 <strong>{fmtInt(lead.cur)} 条</strong>（{leadMove.text}）</>
                  ) : (
                    <>，最终留资 <strong>{fmtInt(lead.cur)} 条</strong>（较上周环比持平）</>
                  )}
                  。留资转化率 <strong>{pct(leadRate)}</strong>。从 4 层漏斗来看：
                </p>
                <ul>
                  <li>
                    <strong>核心短板在「流失点 {LOSS_PLAN.findIndex((item) => item.id === shortLoss.id) + 1}（{shortLoss.fromTo}）」</strong>
                    ：{shortLoss.action.replace("提升", "")}率 {shortLoss.tone === "bad" ? "跌至" : "为"} <strong>{pct(shortLoss.gate.pass)}</strong>
                    （{ratePhrase(shortLoss.rateMove)}
                    ，{shortLoss.gate.pass + 1e-9 < shortLoss.target ? "低于" : "达到"}建议值 <strong>{pct(shortLoss.target)}</strong>）
                    {shortLoss.gap > 0 ? <>，本周多流失了 <strong>{fmtInt(shortLoss.gap)} 名</strong>潜在买家</> : null}
                    {diagnosed && shortLoss.pages ? <>，主要卡在 {shortLoss.pages} 首屏未命中采购商诉求</> : null}
                    。
                  </li>
                  <li>
                    <strong>{steadyHeld ? "中后端环节基本稳住" : "其余环节"}</strong>
                    ：
                    {steadyLosses.map((item, index) => (
                      <span key={item.id}>
                        {index ? "；" : ""}
                        「流失点 {LOSS_PLAN.findIndex((plan) => plan.id === item.id) + 1}（{item.fromTo}）」{item.action.replace("提升", "")}率 <strong>{pct(item.gate.pass)}</strong>
                        （{ratePhrase(item.rateMove)}）
                      </span>
                    ))}
                    {steadyHeld ? "。只要买家愿意发起交互，最终留资意愿依然较强。" : "。"}
                  </li>
                  {diagnosed && ledger.total ? (
                    <li>
                      <strong>本周共 {ledger.total} 个问题</strong>
                      ：{ledger.text}。就在下方优化策略箱里，点开即可处理。
                    </li>
                  ) : (
                    <li>这一周没有单独挂出的待拍板策略。要处理已经生成的策略，请切回最新一期。</li>
                  )}
                </ul>
                </div>
              </div>
            </div>
            <div className="isw-lens-stage dan-board">
              <div className={`isw-lens-pane is-trend${lens === "trend" ? "" : " is-off"}`} aria-hidden={lens !== "trend"} inert={lens !== "trend" ? "" : undefined}>
                <div className="isw-trend-wrap">
                  <RateTrend
                    stages={stages}
                    weekId={weekId}
                    losses={losses}
                    active={lens === "trend"}
                    chartFloor={120}
                    onOpen={selectLoss}
                  />
                </div>
              </div>
              <div className={`isw-lens-pane is-funnel${lens === "funnel" ? "" : " is-off"}`} aria-hidden={lens !== "funnel"} inert={lens !== "funnel" ? "" : undefined}>
                <ClassicFunnel
                  stages={stages}
                  losses={losses}
                  activeId={activeLossId || shortLoss.id}
                  diagnosed={diagnosed}
                  evidenceModel={evidenceModel}
                  onSelect={selectLoss}
                />
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {/* 第二层：左问题清单 + 右策略决策卡 */}
      {!diagnosed ? (
        <section className="isw-empty-card">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="历史周期仅回看漏斗与转化趋势。需要拍板的优化策略挂在最新一期。"
          >
            <Button type="primary" onClick={onSelectLatestWeek}>
              切回最新一期处理策略
            </Button>
          </Empty>
        </section>
      ) : quiet || !allRows.length ? (
        <section className="isw-empty-card">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="这一周网站没有需要你拍板的转化问题。" />
        </section>
      ) : (
        <section className="isw-split" aria-label="优化策略箱">
          {/* 左栏：问题 1234 极简清单 */}
          <aside className="isw-list-col">
            <div className="isw-list-head">
              <div className="isw-list-title">
                <h2>
                  优化策略箱
                  <span className="ai-mark">已归类</span>
                </h2>
                <span className="isw-list-total">
                  {lossFilter === "all" ? `${allRows.length} 项` : `${visibleRows.length} / ${allRows.length} 项`}
                  {waitingRows.length ? ` · ${waitingRows.length} 待拍板` : ""}
                </span>
              </div>
              <div className="isw-filter-chips" role="group" aria-label="按流失点筛选策略">
                <button
                  type="button"
                  className={`isw-chip${lossFilter === "all" ? " is-active" : ""}`}
                  onClick={() => setLossFilter("all")}
                >
                  全部 <b>{allRows.length}</b>
                </button>
                {LOSS_PLAN.filter((p) => allRows.some((r) => r.rule.lossId === p.id)).map((plan) => {
                  const count = allRows.filter((r) => r.rule.lossId === plan.id).length;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      className={`isw-chip is-${plan.id}${lossFilter === plan.id ? " is-active" : ""}`}
                      onClick={() => toggleLossFilter(plan.id)}
                    >
                      {ACTION_MAP[plan.id]?.filter || plan.action} <b>{count}</b>
                    </button>
                  );
                })}
              </div>
            </div>

            {visibleRows.length ? (
              <div className="isw-problem-list">
                {visibleRows.map((row, idx) => {
                  const st = resolveItemState(row, decisions, publishedMap, adviceDone);
                  const selected = activeRow?.key === row.key;
                  const act = ACTION_MAP[row.rule.lossId] || ACTION_MAP.l1;
                  return (
                    <button
                      key={row.key}
                      type="button"
                      aria-current={selected ? "true" : undefined}
                      className={`isw-problem-item is-state-${st.code}${selected ? " is-selected" : ""}`}
                      onClick={() => setSelectedKey(row.key)}
                    >
                      <div className="isw-problem-top">
                        <span className="isw-problem-no">{String(idx + 1).padStart(2, "0")}</span>
                        <span className="isw-problem-title">{row.issueTitle}</span>
                        <span className={`isw-status is-${st.code}`}>{st.label}</span>
                      </div>
                      <p className="isw-problem-impact">{row.impact}</p>
                      <div className="isw-problem-foot">
                        <span className={`isw-loss-dot is-${act.id}`}>{act.short}</span>
                        <span className="isw-problem-dir">{row.item.direction}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="isw-list-empty">
                <p>当前流失点下没有策略</p>
                <Button size="small" onClick={() => setLossFilter("all")}>
                  查看全部策略
                </Button>
              </div>
            )}
          </aside>

          {/* 右栏：瘦身后的策略决策工作台 */}
          <main className="isw-detail-col">
            {activeRow && activeItem ? (
              <article className="isw-detail-card">
                {/* 卡片顶部：标题 + 决策主操作 */}
                <header className="isw-detail-head" ref={detailHeadRef}>
                  <div className="isw-detail-meta">
                    <div className="isw-detail-tags">
                      <span className="isw-detail-index">
                        {String(selectedIndex + 1).padStart(2, "0")} / {String(visibleRows.length).padStart(2, "0")}
                      </span>
                      <span className={`isw-action-pill is-${activeAction.id}`}>{activeAction.short}</span>
                      <span className={`isw-status is-${activeState.code}`}>{activeState.label}</span>
                      <span className="isw-executor">{displayExecutor(activeItem.executor)}</span>
                    </div>
                    <div className="isw-pager">
                      <Button
                        size="small"
                        icon={<LeftOutlined />}
                        disabled={selectedIndex <= 0}
                        onClick={() => setSelectedKey(visibleRows[selectedIndex - 1].key)}
                      >
                        上一条
                      </Button>
                      <Button
                        size="small"
                        icon={<RightOutlined />}
                        iconPlacement="end"
                        disabled={selectedIndex < 0 || selectedIndex >= visibleRows.length - 1}
                        onClick={() => setSelectedKey(visibleRows[selectedIndex + 1].key)}
                      >
                        下一条
                      </Button>
                    </div>
                  </div>

                  <div className="isw-detail-title-row">
                    <div>
                      <p className="isw-detail-issue-ref">针对问题：{activeRow.issueTitle}</p>
                      <h2>{activeItem.title}</h2>
                    </div>
                  </div>

                  {/* 决策操作条 */}
                  <div className={`isw-decision-bar is-${activeState.code}`}>
                    {activeState.code === "waiting" ? (
                      <>
                        <div className="isw-decision-hint">
                          确认后将交由 <strong>{displayExecutor(activeItem.executor)}</strong> 生成草稿，你预览确认后才会正式上线。
                        </div>
                        <div className="isw-decision-btns">
                          <Dropdown
                            trigger={["click"]}
                            menu={{
                              items: SKIP_REASONS.map((r) => ({ key: r.key, label: r.label })),
                              onClick: ({ key }) => handleSkipAndAdvance(activeItem, key),
                            }}
                          >
                            <Button>
                              这次先不做 <DownOutlined />
                            </Button>
                          </Dropdown>
                          <Button type="primary" onClick={() => handleApprove(activeItem)}>
                            同意并生成草稿
                          </Button>
                        </div>
                      </>
                    ) : null}

                    {activeState.code === "preview" ? (
                      <>
                        <div className="isw-decision-hint">
                          <CheckCircleFilled style={{ color: "#3989ff", marginRight: 6 }} />
                          <strong>草稿已就绪</strong>，可立即预览确认发布，或先继续拍板剩余策略。
                        </div>
                        <div className="isw-decision-btns">
                          {nextWaiting ? (
                            <Button onClick={() => jumpNextWaiting(activeRow.key)}>
                              下一条待拍板 ({waitingRows.length}) &gt;
                            </Button>
                          ) : null}
                          <Button onClick={() => onOpenTracking(activeRow.key)}>查看执行追踪</Button>
                          <Button type="primary" onClick={() => onOpenPreview(activeRow.key)}>
                            去预览发布 &gt;
                          </Button>
                        </div>
                      </>
                    ) : null}

                    {activeState.code === "live" ? (
                      <>
                        <div className="isw-decision-hint">
                          <CheckCircleFilled style={{ color: "#10b981", marginRight: 6 }} />
                          <strong>已确认上线</strong>，系统正在按评估计划持续观察转化变化。
                        </div>
                        <div className="isw-decision-btns">
                          <Button onClick={() => onOpenTracking(activeRow.key)}>查看执行追踪</Button>
                        </div>
                      </>
                    ) : null}

                    {activeState.code === "skipped" ? (
                      <>
                        <div className="isw-decision-hint">
                          已标记「这次先不做」
                          {decisions[activeRow.key]?.reason?.label
                            ? `（${decisions[activeRow.key].reason.label}）`
                            : ""}
                          。
                        </div>
                        <div className="isw-decision-btns">
                          {nextWaiting ? (
                            <Button onClick={() => jumpNextWaiting(activeRow.key)}>
                              下一条待拍板 ({waitingRows.length}) &gt;
                            </Button>
                          ) : null}
                          <Button type="link" onClick={() => onUndo(activeItem)}>
                            撤回，重新决定
                          </Button>
                        </div>
                      </>
                    ) : null}

                  </div>
                </header>

                {/* 模块 1：精简诊断依据 + 证据抽屉入口 */}
                <section className="isw-block">
                  <h3 className="isw-block-title">问题诊断与数据依据</h3>
                  <div className="isw-diag-grid">
                    <div className="isw-diag-item">
                      <span>数据事实</span>
                      <p>{activeRule?.face?.data || activeItem.why || activeRow.impact}</p>
                    </div>
                    <div className="isw-diag-item">
                      <span>原因洞察</span>
                      <p>{activeRule?.face?.cause || activeRule?.phenomenon}</p>
                    </div>
                  </div>
                  <div className="isw-evidence-row">
                    <span className="isw-evidence-label">证据与参考</span>
                    <div className="isw-cites">
                      <button
                        type="button"
                        className="ag-cite is-evidence-btn"
                        onClick={() => setDrawerLossId(activeRule.lossId)}
                      >
                        <BarChartOutlined />
                        <span className="ag-cite-kind">漏斗明细</span>
                        <span className="ag-cite-title">{activeAction.short} TOP 3</span>
                      </button>
                      {activeRefs.map((row) => (
                        <button
                          key={row.key}
                          type="button"
                          className={`ag-cite${row.state === "unauthorized" ? " is-warn" : ""}`}
                          onClick={() => setDrawerSource(row)}
                        >
                          {row.icon}
                          <span className="ag-cite-kind">{row.name}</span>
                          <span className="ag-cite-title">{citeLabel(row)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                {/* 模块 2：优化策略与修改方案 */}
                <section className="isw-block">
                  <h3 className="isw-block-title">优化方案与执行要求</h3>
                  <Descriptions
                    bordered
                    size="small"
                    column={1}
                    styles={{ label: { width: 88, whiteSpace: "nowrap", verticalAlign: "top" } }}
                    items={[
                      {
                        key: "name",
                        label: "任务名称",
                        children: (
                          <div>
                            <div>{activeItem.title}</div>
                            {activeItem.target ? (
                              <div className="ag-req-target">
                                <TargetValue value={activeItem.target} />
                              </div>
                            ) : null}
                          </div>
                        ),
                      },
                      {
                        key: "spec",
                        label: "任务说明",
                        children: (
                          <div className="ag-req">
                            {activeItem.summary ? <p className="ag-sentence">{bossCopy(activeItem.summary)}</p> : null}
                            <RequirementBody
                              sections={activeItem.requirementSections}
                              fallback={activeItem.requirements}
                              constraints={activeItem.constraints}
                            />
                          </div>
                        ),
                      },
                    ]}
                  />

                  {activeRow.adviceNotes?.length ? (
                    <div className="isw-advice-note">
                      <span>人工处理建议</span>
                      {activeRow.adviceNotes.map((note) => (
                        <p key={note.key}>{bossCopy(note.summary)}</p>
                      ))}
                    </div>
                  ) : null}

                  {activeState.code === "waiting" ? (
                    <div className="isw-extra-input">
                      <label htmlFor={`extra-${activeItem.key}`}>补充要求（可选）</label>
                      <Input.TextArea
                        id={`extra-${activeItem.key}`}
                        value={extraNotes[activeItem.key] || ""}
                        placeholder="如果有额外的修改偏好或限制条件，可写在这里，没有可留空。"
                        autoSize={{ minRows: 2, maxRows: 4 }}
                        onChange={(e) => onExtra(activeItem.key, e.target.value)}
                      />
                    </div>
                  ) : extraNotes[activeItem.key]?.trim() ? (
                    <div className="isw-target-line">
                      <span>你补充的要求</span>
                      <span>{extraNotes[activeItem.key]}</span>
                    </div>
                  ) : null}
                </section>

                {/* 模块 3：评估计划（默认折叠一行摘要） */}
                {activeItem.planPreview ? (
                  <section className="isw-block isw-plan-block">
                    <button
                      type="button"
                      className="isw-plan-bar"
                      aria-expanded={planOpen}
                      onClick={() => setPlanOpen((v) => !v)}
                    >
                      <div className="isw-plan-summary">
                        <span className="isw-plan-label">效果评估计划</span>
                        {activeItem.planPreview.badge ? <Tag>{activeItem.planPreview.badge}</Tag> : null}
                        <span className="isw-plan-brief">
                          {activeItem.planPreview.baseline} → {activeItem.planPreview.threshold}
                        </span>
                      </div>
                      <span className="isw-plan-toggle">
                        {planOpen ? "收起详情" : "展开详情"} {planOpen ? <UpOutlined /> : <DownOutlined />}
                      </span>
                    </button>
                    {planOpen ? (
                      <div className="isw-plan-body">
                        <Descriptions
                          bordered
                          size="small"
                          column={1}
                          styles={{ label: { width: 120, whiteSpace: "nowrap" } }}
                          items={[
                            {
                              key: "metric",
                              label: "核心指标",
                              children: [activeItem.planPreview.metric, activeItem.planPreview.formula]
                                .filter(Boolean)
                                .join(" "),
                            },
                            { key: "baseline", label: "当前基线", children: activeItem.planPreview.baseline },
                            {
                              key: "goal",
                              label: "有效标准",
                              children: [activeItem.planPreview.threshold, activeItem.planPreview.mde]
                                .filter(Boolean)
                                .join(" "),
                            },
                            { key: "sample", label: "最低样本量", children: activeItem.planPreview.minSample },
                            { key: "when", label: "观察周期", children: activeItem.planPreview.estWeeks },
                            { key: "after", label: "锁定机制", children: activeItem.planPreview.sqlNote },
                          ].filter((x) => x.children)}
                        />
                      </div>
                    ) : null}
                  </section>
                ) : null}
              </article>
            ) : (
              <div className="isw-empty-card">
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="从左侧选择一条优化策略" />
              </div>
            )}
          </main>
        </section>
      )}

      {/* 信源原文抽屉 */}
      <Drawer
        open={Boolean(drawerSource)}
        size={460}
        title={
          drawerSource ? (
            <span className="ag-cite-drawer-title">
              {drawerSource.icon}
              {drawerSource.name}
            </span>
          ) : null
        }
        extra={
          drawerSource?.url ? (
            <Typography.Link href={drawerSource.url} target="_blank" rel="noreferrer">
              打开原页
            </Typography.Link>
          ) : drawerSource?.query ? (
            <Typography.Text type="secondary">{drawerSource.query}</Typography.Text>
          ) : drawerSource?.tool ? (
            <Typography.Text type="secondary">{drawerSource.tool}</Typography.Text>
          ) : drawerSource?.title ? (
            <Typography.Text type="secondary">{drawerSource.title}</Typography.Text>
          ) : null
        }
        onClose={() => setDrawerSource(null)}
      >
        {drawerSource ? <SourceDrawerBody row={drawerSource} onAuthorize={onAuthorize} /> : null}
      </Drawer>

      {/* 漏斗环节 TOP3 明细抽屉 */}
      <Drawer
        open={Boolean(drawerLossId)}
        size={560}
        title={
          drawerLossId
            ? `${ACTION_MAP[drawerLossId]?.short || "漏斗明细"} · 数据明细`
            : "漏斗明细"
        }
        onClose={() => setDrawerLossId("")}
      >
        {drawerLossId ? (
          <div className="dan-board isw-evidence-drawer">
            <LossEvidence id={drawerLossId} model={evidenceModel} />
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
