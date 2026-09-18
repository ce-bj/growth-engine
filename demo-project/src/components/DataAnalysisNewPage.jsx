import { useMemo, useState } from "react";
import {
  App as AntApp,
  Button,
  ConfigProvider,
  Segmented,
  Select,
  Tag,
} from "antd";
import zhCN from "antd/locale/zh_CN";
import {
  ArrowLeftOutlined,
  ClusterOutlined,
  DownOutlined,
  ExportOutlined,
  FunnelPlotOutlined,
  PlayCircleOutlined,
  SearchOutlined,
  SolutionOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import FunnelReviewApp from "../funnel-review/App.jsx";
import "../funnel-review/styles.css";
import "./data-analysis-new.css";
import {
  INTENTS,
  getLeadCount,
  getStages,
  intentLabel,
  pct,
  rate,
  visitorIntents,
  visitorsListed,
} from "../funnel-review/data.js";
import {
  AUTH_SOURCES,
  CAUSES,
  MEASURES,
  OBSERVING,
  PERIOD,
  SITES,
} from "./diagnosisPeriod.js";

const THEME = {
  token: {
    colorPrimary: "#e85d04",
    colorInfo: "#e85d04",
    colorSuccess: "#2f6b3a",
    colorWarning: "#b45309",
    colorError: "#b42318",
    colorText: "#1a1d21",
    colorTextSecondary: "#5c6570",
    colorBorder: "#e6e9ee",
    colorBgContainer: "#ffffff",
    colorBgLayout: "#f5f7fb",
    borderRadius: 14,
    fontFamily: "'Noto Sans SC', sans-serif",
    fontSize: 15,
    controlHeight: 44,
    controlHeightLG: 52,
  },
  components: {
    Button: {
      fontWeight: 600,
      paddingInlineLG: 28,
    },
    Select: {
      optionSelectedBg: "#fff4e5",
    },
    Segmented: {
      itemSelectedBg: "#fff4e5",
      itemSelectedColor: "#c2410c",
      trackBg: "#f0f2f6",
    },
  },
};

const INTENT_COLOR = {
  product: "#e85d04",
  spec: "#0f766e",
  supplier: "#1d4ed8",
  quote: "#be123c",
  content: "#7c3aed",
  unclear: "#78716c",
};

function intentDistribution() {
  const rows = visitorsListed("site");
  const counts = Object.fromEntries(INTENTS.map((item) => [item.id, 0]));
  for (const visitor of rows) {
    for (const id of visitorIntents(visitor)) {
      counts[id] += 1;
    }
  }
  return {
    total: rows.length,
    rows: INTENTS.map((item) => ({
      ...item,
      count: counts[item.id],
      percent: rows.length ? Math.round((counts[item.id] / rows.length) * 100) : 0,
    })),
  };
}

function BlankPreview({ title, hint, onBack }) {
  return (
    <div className="dan-blank">
      <div className="dan-blank-bar">
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
          返回诊断
        </Button>
      </div>
      <div className="dan-blank-body">
        <div className="dan-blank-card">
          <p className="dan-kicker">对应页面 · 暂未接入</p>
          <h1>{title}</h1>
          <p>{hint}</p>
        </div>
      </div>
    </div>
  );
}

function Workbench() {
  const { message } = AntApp.useApp();
  const [measureState, setMeasureState] = useState({});
  const [openKey, setOpenKey] = useState(MEASURES[0]?.key ?? null);
  const [preview, setPreview] = useState(null);
  const [adoptingKey, setAdoptingKey] = useState("");
  const [siteId, setSiteId] = useState(SITES[0].id);
  const site = SITES.find((item) => item.id === siteId) ?? SITES[0];
  const mix = useMemo(() => intentDistribution(), []);
  const stages = getStages("site");
  const leads = getLeadCount("site");
  const viewRate = rate(stages[1].cur, stages[0].cur);
  const viewPrev = rate(stages[1].prev, stages[0].prev);
  const leadRate = rate(leads.cur, stages[0].cur);
  const leadRatePrev = rate(leads.prev, stages[0].prev);

  function openPreview(row) {
    setPreview({
      title: row.previewTitle,
      hint: row.previewHint,
    });
  }

  async function adoptMeasure(row) {
    if (row.kind !== "skill") return;
    setAdoptingKey(row.key);
    await new Promise((resolve) => setTimeout(resolve, 480));
    setMeasureState((prev) => ({ ...prev, [row.key]: "adopted" }));
    setAdoptingKey("");
    if (row.adoptAction === "generate_landing") {
      message.success("已按任务说明调用智能营销页生成。对应页面暂未接入。");
    } else if (row.adoptAction === "edit_product") {
      message.success("已按任务说明交给运营助手修改产品。对应页面暂未接入。");
    } else {
      message.success("已确认执行。");
    }
    openPreview(row);
  }

  if (preview) {
    return (
      <BlankPreview
        title={preview.title}
        hint={preview.hint}
        onBack={() => setPreview(null)}
      />
    );
  }

  return (
    <div className="dan-page">
      <div className="dan-inner">
        <header className="dan-hero">
          <div>
            <p className="dan-kicker">诊断层 · 自然月自动诊断</p>
            <h1 className="dan-title">AI 访客行为分析智能体</h1>
            <p className="dan-sub">
              {site.name} · {site.origin.replace(/^https:\/\//, "")}
            </p>
          </div>
          <div className="dan-pills">
            <span className="dan-pill is-on">本期 {PERIOD.label}</span>
            <span className="dan-pill">对照 {PERIOD.baseline}</span>
            <span className="dan-pill">{PERIOD.sampleNote}</span>
          </div>
        </header>

        <section className="dan-kpis" aria-label="本期关键数">
          {[
            {
              label: "线索数",
              value: `${leads.cur} 条`,
              hint: `上期 ${leads.prev} · 少 ${leads.prev - leads.cur} 条`,
              alert: true,
            },
            {
              label: "来了多少人",
              value: stages[0].cur.toLocaleString(),
              hint: "与上期持平",
            },
            {
              label: "有效浏览率",
              value: pct(viewRate),
              hint: `上期 ${pct(viewPrev)} · 异常`,
              alert: true,
            },
            {
              label: "留资率",
              value: pct(leadRate),
              hint: `上期 ${pct(leadRatePrev)} · 线索÷UV`,
              alert: true,
            },
          ].map((item) => (
            <article key={item.label} className="dan-kpi">
              <div className="dan-kpi-k">{item.label}</div>
              <div className={`dan-kpi-v${item.alert ? " is-alert" : ""}`}>{item.value}</div>
              <div className="dan-kpi-h">{item.hint}</div>
            </article>
          ))}
        </section>

        <section className="dan-card" aria-labelledby="dan-run-title">
          <div className="dan-head">
            <div className="dan-head-l">
              <span className="dan-ico" aria-hidden="true">
                <PlayCircleOutlined />
              </span>
              <h2 id="dan-run-title">运行控制</h2>
            </div>
            <span className="dan-live">
              <i />
              上次 {PERIOD.lastRun}
            </span>
          </div>
          <div className="dan-run">
            <div>
              <span className="dan-field-l">网站 URL</span>
              <Select
                className="dan-site-select"
                size="large"
                value={siteId}
                showSearch={false}
                allowClear={false}
                suffixIcon={<DownOutlined />}
                placeholder="选择已绑定网站"
                aria-label="网站 URL"
                style={{ width: "100%" }}
                options={SITES.map((item) => ({
                  value: item.id,
                  label: `${item.name} · ${item.origin.replace(/^https:\/\//, "")}`,
                }))}
                onChange={(id) => setSiteId(id)}
              />
            </div>
            <div>
              <span className="dan-field-l">诊断窗口</span>
              <Segmented
                block
                size="large"
                shape="round"
                value="aug"
                options={[
                  { label: PERIOD.label, value: "aug" },
                  { label: "对照 7月", value: "jul", disabled: true },
                ]}
              />
            </div>
          </div>
          <div className="dan-auth">
            {AUTH_SOURCES.map((item) => (
              <span
                key={item.key}
                className={`dan-chip${item.status === "ok" ? "" : " is-miss"}`}
                title={item.use}
              >
                <i className="dan-dot" />
                <b>{item.name}</b>
                {item.statusText}
              </span>
            ))}
          </div>
          <p className="dan-note">
            Google Ads 未授权，广告词暂不能按人对上。广告渠仍按进站第一页统计。调度：{PERIOD.schedule}。
          </p>
        </section>

        <section className="dan-card" aria-labelledby="dan-intent-title">
          <div className="dan-head">
            <div className="dan-head-l">
              <span className="dan-ico" aria-hidden="true">
                <ThunderboltOutlined />
              </span>
              <h2 id="dan-intent-title">本期访客意图分布</h2>
            </div>
          </div>
          <p className="dan-path-note">
            一人一天可以多个意图。柱长是「含此类」的人数，加总可以超过访客人数。不是实时在线，是 {PERIOD.label} 这一期。
          </p>
          <div className="dan-intents">
            {mix.rows.map((item) => (
              <article key={item.id} className="dan-intent">
                <div className="dan-intent-top">
                  <span className="dan-intent-name">
                    <i style={{ background: INTENT_COLOR[item.id] }} />
                    {intentLabel(item.id)}
                  </span>
                  <span className="dan-intent-n">
                    {item.count} 人 · {item.percent}%
                  </span>
                </div>
                <div className="dan-bar" aria-hidden="true">
                  <span
                    style={{
                      width: `${item.percent}%`,
                      background: INTENT_COLOR[item.id],
                    }}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="dan-card" aria-labelledby="dan-path-title">
          <div className="dan-head">
            <div className="dan-head-l">
              <span className="dan-ico" aria-hidden="true">
                <ClusterOutlined />
              </span>
              <h2 id="dan-path-title">本期访客路径</h2>
            </div>
          </div>
          <div className="funnel-embed is-antd">
            <FunnelReviewApp variant="path" />
          </div>
        </section>

        <section className="dan-card" aria-labelledby="dan-funnel-title">
          <div className="dan-head">
            <div className="dan-head-l">
              <span className="dan-ico" aria-hidden="true">
                <FunnelPlotOutlined />
              </span>
              <h2 id="dan-funnel-title">本期转化漏斗</h2>
            </div>
          </div>
          <div className="funnel-embed is-antd">
            <FunnelReviewApp variant="funnel" />
          </div>
        </section>

        <section className="dan-card" aria-labelledby="dan-cause-title">
          <div className="dan-head">
            <div className="dan-head-l">
              <span className="dan-ico" aria-hidden="true">
                <SearchOutlined />
              </span>
              <h2 id="dan-cause-title">主要根因归类</h2>
            </div>
          </div>
          <p className="dan-path-note">
            对照假设方案库逐条核对。命中的才往下出活，排除的写清为什么不下手。
          </p>
          <div className="dan-causes">
            {CAUSES.map((item) => (
              <article
                key={item.key}
                className={`dan-cause${item.state === "命中" ? " is-hot" : ""}`}
              >
                <div className="dan-cause-top">
                  <Tag color={item.state === "命中" ? "error" : "default"}>{item.state}</Tag>
                  <span className="dan-kpi-k">{item.key}</span>
                  <span className="dan-kpi-k">{item.layer}</span>
                  {item.page ? <span className="dan-kpi-k">{item.page}</span> : null}
                </div>
                <h3>{item.hypothesis}</h3>
                <p>{item.evidence}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="dan-card" aria-labelledby="dan-act-title">
          <div className="dan-head">
            <div className="dan-head-l">
              <span className="dan-ico" aria-hidden="true">
                <SolutionOutlined />
              </span>
              <h2 id="dan-act-title">改进建议</h2>
            </div>
          </div>
          <p className="dan-path-note">点开一条看任务说明。参数按现网 Skill 一次写全，确认后再交接。</p>
          <div className="dan-measures">
            {MEASURES.map((row, index) => {
              const state = measureState[row.key];
              const open = openKey === row.key;
              return (
                <article
                  key={row.key}
                  className={`dan-measure${open ? " is-open" : ""}`}
                >
                  <button
                    type="button"
                    className="dan-measure-head"
                    aria-expanded={open}
                    onClick={() => setOpenKey(open ? null : row.key)}
                  >
                    <div className="dan-rank">#{index + 1}</div>
                    <div>
                      <div className="dan-measure-meta">
                        <Tag color={row.priority === "P0" ? "red" : "gold"}>{row.priority}</Tag>
                        <Tag color={row.kind === "skill" ? "orange" : "default"}>
                          {row.kind === "skill" ? "可执行" : "仅展示"}
                        </Tag>
                        <Tag>{row.type}</Tag>
                        {state === "adopted" ? <Tag color="success">已确认执行</Tag> : null}
                      </div>
                      <h3>{row.title}</h3>
                      <p className="dan-kpi-h">{row.expected}</p>
                    </div>
                    <DownOutlined className={`dan-chevron${open ? " is-up" : ""}`} />
                  </button>
                  {open ? (
                    <div className="dan-measure-body">
                      <p className="dan-target">
                        <b>目标对象</b>
                        {row.targetObject}
                      </p>
                      <div className="dan-brief">
                        <div className="dan-brief-k">任务说明</div>
                        <ul>
                          {row.taskBrief.map((line) => (
                            <li key={line}>{line}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="dan-evidence">
                        <div className="dan-evidence-k">依据</div>
                        <div className="dan-evidence-row">
                          <b>现状</b>
                          <span>{row.evidenceCard.currentValue}</span>
                        </div>
                        <div className="dan-evidence-row">
                          <b>对照</b>
                          <span>{row.evidenceCard.benchmark}</span>
                        </div>
                        <div className="dan-evidence-row">
                          <b>动作</b>
                          <span>{row.evidenceCard.action}</span>
                        </div>
                      </div>
                      {row.kind === "skill" ? (
                        <div className="dan-measure-actions">
                          {state === "adopted" ? (
                            <Button
                              size="large"
                              className="dan-btn-view"
                              icon={<ExportOutlined />}
                              onClick={() => openPreview(row)}
                            >
                              去查看
                            </Button>
                          ) : (
                            <Button
                              type="primary"
                              size="large"
                              loading={adoptingKey === row.key}
                              onClick={() => adoptMeasure(row)}
                            >
                              {row.adoptAction === "generate_landing"
                                ? "一键采纳并生成营销页"
                                : "一键采纳"}
                            </Button>
                          )}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
          {OBSERVING.map((item) => (
            <div key={item.key} className="dan-observe">
              <b>观察中 · {item.title}</b>
              <p>{item.note}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

export default function DataAnalysisNewPage() {
  return (
    <ConfigProvider locale={zhCN} theme={THEME} button={{ autoInsertSpace: false }}>
      <AntApp style={{ flex: 1, minWidth: 0, minHeight: 0, height: "100%", display: "flex" }}>
        <Workbench />
      </AntApp>
    </ConfigProvider>
  );
}
