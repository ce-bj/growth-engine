/** 访客行为分析智能体（Growth/vis-analysis）。与数字门户「数据分析-新」已拆开。 */
import { useEffect, useMemo, useState } from "react";
import {
  App as AntApp,
  Button,
  ConfigProvider,
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
  SearchOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import FunnelReviewApp from "./funnel-review/App.jsx";
import "./funnel-review/styles.css";
import "./data-analysis-new.css";
import {
  AUTH_SOURCES,
  CHURN_MARK,
  DEPTH_INTENTS,
  PERIOD,
  PHENOMENA,
  ROOT_CAUSES,
  SITES,
  SOURCE_AUTH_PAGES,
  TASKS,
} from "./diagnosisPeriod.js";
import SearchTerms from "./funnel-review/SearchTerms.jsx";

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
    controlHeight: 40,
    controlHeightLG: 48,
  },
  components: {
    Button: {
      fontWeight: 600,
      paddingInlineLG: 28,
    },
    Select: {
      optionSelectedBg: "#fff4e5",
    },
  },
};

function AuthConnect({ sourceKey, onBack, onDone }) {
  const { message } = AntApp.useApp();
  const [busy, setBusy] = useState(false);
  const copy = SOURCE_AUTH_PAGES[sourceKey] || {
    name: sourceKey,
    title: `授权 ${sourceKey}`,
    hint: "授权后，对应来源的搜索词会出现在明细里。不对接到具体访客。",
    scopes: ["搜索词明细"],
    cta: "去授权",
  };

  async function connect() {
    setBusy(true);
    await new Promise((resolve) => setTimeout(resolve, 640));
    message.success(`${copy.name}已授权，搜索词已写入明细`);
    onDone(sourceKey);
  }

  return (
    <div className="dan-blank">
      <div className="dan-blank-bar">
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
          返回明细数据
        </Button>
      </div>
      <div className="dan-blank-body">
        <div className="dan-blank-card dan-auth-card">
          <p className="dan-kicker">数据源授权</p>
          <h1>{copy.title}</h1>
          <p>{copy.hint}</p>
          <ul>
            {copy.scopes.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <Button type="primary" size="large" loading={busy} onClick={connect}>
            {copy.cta}
          </Button>
        </div>
      </div>
    </div>
  );
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

function TaskBrief({ row }) {
  if (row.kind !== "task") {
    return (
      <div className="dan-display">
        <p>
          <b>原因</b>
          {row.reason}
        </p>
        <p>
          <b>建议</b>
          {row.suggest}
        </p>
        <p className="dan-kpi-h">{row.object}</p>
      </div>
    );
  }
  return (
    <dl className="dan-brief-dl">
      <div>
        <dt>任务目标</dt>
        <dd>{row.goal}</dd>
      </div>
      <div>
        <dt>任务对象</dt>
        <dd>{row.object}</dd>
      </div>
      <div>
        <dt>内容要求</dt>
        <dd>
          <ul>
            {row.requirements.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </dd>
      </div>
      <div>
        <dt>约束</dt>
        <dd>{row.constraints.join("；")}</dd>
      </div>
      <div>
        <dt>确认点</dt>
        <dd>{row.confirms.join("；")}</dd>
      </div>
      {row.banner ? (
        <div>
          <dt>横幅时机</dt>
          <dd>
            {row.banner.when} · {row.banner.where}
            <br />
            「{row.banner.copy}」
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Workbench() {
  const { message } = AntApp.useApp();
  const [taskState, setTaskState] = useState({});
  const [openKey, setOpenKey] = useState(null);
  const [preview, setPreview] = useState(null);
  const [authKey, setAuthKey] = useState(null);
  const [granted, setGranted] = useState({});
  const [preferSource, setPreferSource] = useState(null);
  const [scrollSearch, setScrollSearch] = useState(false);
  const [adoptingKey, setAdoptingKey] = useState("");
  const [siteId, setSiteId] = useState(SITES[0].id);
  const [intentId, setIntentId] = useState(null);
  const [mainTab, setMainTab] = useState("agent");
  const site = SITES.find((item) => item.id === siteId) ?? SITES[0];
  const authMap = useMemo(() => {
    const map = {};
    AUTH_SOURCES.forEach((item) => {
      map[item.key] = item.status === "ok" || Boolean(granted[item.key]);
    });
    return map;
  }, [granted]);
  const missingAuth = AUTH_SOURCES.filter((item) => !authMap[item.key]);
  const executable = TASKS.filter((item) => item.kind === "task");
  const displayTasks = TASKS.filter((item) => item.kind === "display");
  const pending = executable.filter((item) => !taskState[item.key]);
  const adopted = executable.filter((item) => taskState[item.key] === "adopted");
  const produced = TASKS.length;
  const phenomena = useMemo(
    () => (intentId ? PHENOMENA.filter((item) => item.intent === intentId) : PHENOMENA),
    [intentId],
  );

  function openPreview(row) {
    setPreview({
      title: row.previewTitle,
      hint: row.previewHint,
    });
  }

  async function adoptTask(row) {
    if (row.kind !== "task") return;
    setAdoptingKey(row.key);
    await new Promise((resolve) => setTimeout(resolve, 420));
    setTaskState((prev) => ({ ...prev, [row.key]: "adopted" }));
    setAdoptingKey("");
    if (openKey === row.key) setOpenKey(null);
    message.success("已确认，已交给对应子智能体。");
  }

  function skipTask(row) {
    setTaskState((prev) => ({ ...prev, [row.key]: "skipped" }));
    if (openKey === row.key) setOpenKey(null);
    message.info("这条先不执行。");
  }

  function openAuth(key) {
    setPreview(null);
    setMainTab("data");
    setAuthKey(key);
  }

  function finishAuth(key) {
    setGranted((prev) => ({ ...prev, [key]: true }));
    setAuthKey(null);
    setMainTab("data");
    setPreferSource(key === "gsc" || key === "ads" || key === "site" ? key : "all");
    setScrollSearch(true);
  }

  useEffect(() => {
    if (mainTab !== "data" || authKey || !scrollSearch) return undefined;
    const timer = window.setTimeout(() => {
      scrollToId("dan-search-terms");
      setScrollSearch(false);
    }, 60);
    return () => window.clearTimeout(timer);
  }, [mainTab, authKey, scrollSearch]);

  if (authKey) {
    return (
      <AuthConnect
        sourceKey={authKey}
        onBack={() => setAuthKey(null)}
        onDone={finishAuth}
      />
    );
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
            <p className="dan-kicker">诊断层 · 28 天窗口</p>
            <h1 className="dan-title">AI 访客行为分析智能体</h1>
          </div>
          <div className="dan-hero-tools">
            <Select
              className="dan-site-select"
              size="middle"
              value={siteId}
              showSearch={false}
              allowClear={false}
              suffixIcon={<DownOutlined />}
              aria-label="已绑定网站"
              style={{ minWidth: 280 }}
              options={SITES.map((item) => ({
                value: item.id,
                label: `${item.name.replace("Demo · ", "")}`,
              }))}
              onChange={(id) => setSiteId(id)}
            />
            <span className="dan-pill is-on">{PERIOD.label}</span>
            <span className="dan-pill">{PERIOD.range}</span>
            {missingAuth.map((item) => (
              <button
                key={item.key}
                type="button"
                className="dan-pill is-miss"
                title={`${item.use}。点击去授权`}
                onClick={() => openAuth(item.key)}
              >
                {item.name}未授权
              </button>
            ))}
          </div>
        </header>

        <nav className="dan-tabs" role="tablist" aria-label="页面视图">
          <button
            type="button"
            role="tab"
            aria-selected={mainTab === "agent"}
            className={mainTab === "agent" ? "is-on" : ""}
            onClick={() => setMainTab("agent")}
          >
            智能体分析
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mainTab === "data"}
            className={mainTab === "data" ? "is-on" : ""}
            onClick={() => setMainTab("data")}
          >
            明细数据
          </button>
        </nav>

        {mainTab === "agent" ? (
          <>
        <section className="dan-run" aria-label="任务概览">
          <div className="dan-run-banner">
            <span className="dan-run-ico" aria-hidden="true">
              ✦
            </span>
            <div>
              <p className="dan-run-kicker">访客行为分析智能体 · 自主运行中</p>
              <p className="dan-run-copy">
                本窗口已扫描近 28 天行为并完成诊断，产出
                <b> {executable.length} </b>
                份任务说明、
                <b> {displayTasks.length} </b>
                条站外建议
                {adopted.length ? (
                  <>
                    ；其中
                    <b> {adopted.length} </b>
                    份已确认执行
                  </>
                ) : null}
                ；目前有
                <b> {pending.length} </b>
                份正在等你确认执行。诊断我会按窗口继续跑，你只需在确认这一步把关。
              </p>
            </div>
          </div>
          <div className="dan-run-stats">
            <article className="dan-run-stat is-pending">
              <div className="dan-run-n">{pending.length}</div>
              <div className="dan-run-l">待你确认</div>
              <div className="dan-run-h">这是今天唯一需要你做的事</div>
            </article>
            <article className="dan-run-stat is-made">
              <div className="dan-run-n">{produced}</div>
              <div className="dan-run-l">本窗口产出</div>
              <div className="dan-run-h">无需你介入的扫描与诊断</div>
            </article>
          </div>
          <div className="dan-inbox">
            <div className="dan-inbox-head">
              <h2>
                待你确认
                <span>{pending.length}</span>
              </h2>
              <p>智能体已写好任务说明，确认后交给对应子智能体</p>
            </div>
            {pending.length ? (
              <ul className="dan-inbox-list">
                {pending.map((row) => {
                  const open = openKey === row.key;
                  return (
                    <li key={row.key} className={`dan-inbox-item${open ? " is-open" : ""}`}>
                      <div className="dan-inbox-row">
                        <div className="dan-inbox-copy">
                          <h3>{row.listTitle || row.title}</h3>
                          <p>{row.listMeta || row.type}</p>
                        </div>
                        <div className="dan-inbox-actions">
                          <Button
                            onClick={() => setOpenKey(open ? null : row.key)}
                          >
                            {open ? "收起说明" : "看任务说明"}
                          </Button>
                          <Button
                            icon={<ExportOutlined />}
                            onClick={() => openPreview(row)}
                          >
                            查看页面
                          </Button>
                          <Button danger onClick={() => skipTask(row)}>
                            暂不处理
                          </Button>
                          <Button
                            type="primary"
                            className="dan-inbox-go"
                            loading={adoptingKey === row.key}
                            onClick={() => adoptTask(row)}
                          >
                            确认执行
                          </Button>
                        </div>
                      </div>
                      {open ? (
                        <div className="dan-inbox-detail">
                          <p className="dan-inbox-full">{row.title}</p>
                          <TaskBrief row={row} />
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="dan-inbox-empty">没有需要你确认的任务说明。</p>
            )}
            <div className="dan-inbox-done">
              <div className="dan-inbox-head is-done">
                <h2>
                  本期已确认
                  <span>{adopted.length}</span>
                </h2>
                <p>已交给对应子智能体，可回看任务说明</p>
              </div>
              {adopted.length ? (
                <ul className="dan-inbox-list is-done">
                  {adopted.map((row) => {
                    const open = openKey === row.key;
                    return (
                      <li key={row.key} className={`dan-inbox-item${open ? " is-open" : ""}`}>
                        <div className="dan-inbox-row">
                          <div className="dan-inbox-copy">
                            <h3>{row.listTitle || row.title}</h3>
                            <p>已交给对应子智能体 · {row.listMeta || row.type}</p>
                          </div>
                          <div className="dan-inbox-actions">
                            <Button onClick={() => setOpenKey(open ? null : row.key)}>
                              {open ? "收起说明" : "看任务说明"}
                            </Button>
                            <Button
                              icon={<ExportOutlined />}
                              onClick={() => openPreview(row)}
                            >
                              查看页面
                            </Button>
                          </div>
                        </div>
                        {open ? (
                          <div className="dan-inbox-detail">
                            <p className="dan-inbox-full">{row.title}</p>
                            <TaskBrief row={row} />
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="dan-inbox-empty">本窗口还没有确认过任务。</p>
              )}
            </div>
            {displayTasks.length ? (
              <div className="dan-inbox-display">
                <ul className="dan-inbox-list is-quiet">
                  {displayTasks.map((row) => {
                    const open = openKey === row.key;
                    return (
                      <li key={row.key} className={`dan-inbox-item${open ? " is-open" : ""}`}>
                        <div className="dan-inbox-row">
                          <div className="dan-inbox-copy">
                            <h3>{row.listTitle || row.title}</h3>
                            <p>{row.listMeta || row.type}</p>
                          </div>
                          <div className="dan-inbox-actions">
                            <Button onClick={() => setOpenKey(open ? null : row.key)}>
                              {open ? "收起" : "看建议"}
                            </Button>
                          </div>
                        </div>
                        {open ? (
                          <div className="dan-inbox-detail">
                            <TaskBrief row={row} />
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </div>
        </section>

        <section className="dan-card" aria-labelledby="dan-intent-title">
          <div className="dan-head">
            <div className="dan-head-l">
              <span className="dan-ico" aria-hidden="true">
                <ThunderboltOutlined />
              </span>
              <h2 id="dan-intent-title">本期访客意图分布</h2>
            </div>
            <span className="dan-churn" title={CHURN_MARK.hint}>
              其中 {CHURN_MARK.percent}% {CHURN_MARK.label}
            </span>
          </div>
          <p className="dan-path-note">
            按近 28 天窗口最深一级计，一人只算一个。点某一档，现象跟着切；漏斗和路径在「明细数据」里看。流失是叠加标记，不占第五档。
          </p>
          <div className="dan-intents is-depth">
            {DEPTH_INTENTS.map((item) => {
              const on = intentId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`dan-intent is-btn${on ? " is-on" : ""}`}
                  aria-pressed={on}
                  onClick={() => setIntentId(on ? null : item.id)}
                >
                  <div className="dan-intent-top">
                    <span className="dan-intent-name">
                      <i style={{ background: item.color }} />
                      {item.name}
                    </span>
                    <span className="dan-intent-n">
                      {item.count} 人 · {item.percent}%
                    </span>
                  </div>
                  <div className="dan-bar" aria-hidden="true">
                    <span style={{ width: `${item.percent}%`, background: item.color }} />
                  </div>
                  <p className="dan-intent-hint">{item.meaning}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="dan-card" aria-labelledby="dan-phen-title">
          <div className="dan-head">
            <div className="dan-head-l">
              <span className="dan-ico" aria-hidden="true">
                <UnorderedListOutlined />
              </span>
              <h2 id="dan-phen-title">网站访客现象</h2>
            </div>
            <Button type="link" onClick={() => scrollToId("dan-diagnose")}>
              看为什么、怎么改
            </Button>
          </div>
          {!site.diagnosed ? (
            <p className="dan-path-note">该站尚未出过诊断。下面仍展示 CNC Demo 贯穿案例，便于看界面。</p>
          ) : null}
          <div className="dan-phenomena">
            {phenomena.map((item) => (
              <button
                key={item.id}
                type="button"
                className="dan-phen"
                onClick={() => scrollToId("dan-diagnose")}
              >
                <div className="dan-phen-top">
                  <Tag>{item.loss}</Tag>
                  <span className="dan-kpi-k">{item.page}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.stat}</p>
              </button>
            ))}
          </div>
        </section>

        <section id="dan-diagnose" className="dan-card" aria-labelledby="dan-cause-title">
          <div className="dan-head">
            <div className="dan-head-l">
              <span className="dan-ico" aria-hidden="true">
                <SearchOutlined />
              </span>
              <h2 id="dan-cause-title">诊断原因</h2>
            </div>
          </div>
          <p className="dan-path-note">
            只展示本窗口已命中的原因。同页多规则已合并；轴二优先出主因，轴一、秒退作佐证。
          </p>
          <div className="dan-causes">
            {ROOT_CAUSES.hits.map((item) => (
              <article
                key={item.key}
                className={`dan-cause${item.role === "主因" ? " is-hot" : ""}`}
              >
                <div className="dan-cause-top">
                  <Tag color={item.role === "主因" ? "error" : "default"}>{item.role}</Tag>
                  <span className="dan-kpi-k">{item.key}</span>
                  <span className="dan-kpi-k">{item.axis}</span>
                  <span className="dan-kpi-k">{item.layer}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.evidence}</p>
                <p className="dan-cause-page">{item.page}</p>
              </article>
            ))}
          </div>
        </section>
          </>
        ) : (
          <div className="dan-data-tab">
            {intentId ? (
              <p className="dan-path-note dan-data-filter">
                当前按「{DEPTH_INTENTS.find((item) => item.id === intentId)?.name ?? ""}」切开。切回「智能体分析」可改档。
              </p>
            ) : null}
            <section className="dan-card">
              <div className="dan-head">
                <div className="dan-head-l">
                  <span className="dan-ico" aria-hidden="true">
                    <FunnelPlotOutlined />
                  </span>
                  <h2>转化漏斗</h2>
                </div>
              </div>
              <p className="dan-path-note">
                用来讲流失点。按渠道或访客意图切开，不驱动诊断。点某一档意图，能看到这类人主要看了哪些页、漏斗掉在哪一层。
              </p>
              <div className="funnel-embed is-antd">
                <FunnelReviewApp
                  variant="funnel"
                  intentId={intentId}
                  onIntent={setIntentId}
                />
              </div>
            </section>
            <section id="dan-search-terms" className="dan-card">
              <div className="dan-head">
                <div className="dan-head-l">
                  <span className="dan-ico" aria-hidden="true">
                    <SearchOutlined />
                  </span>
                  <h2>访客搜索词</h2>
                </div>
              </div>
              <p className="dan-path-note">
                主键是搜索词，按来源分开看：站内搜索、Google 自然搜索、谷歌广告。不对接到人。
                {missingAuth.length
                  ? "没授权的来源显示未授权，可从这里一键去授权。"
                  : null}
              </p>
              <div className="funnel-embed is-antd">
                <SearchTerms
                  authMap={authMap}
                  preferSource={preferSource}
                  onAuthorize={openAuth}
                />
              </div>
            </section>
            <section className="dan-card">
              <div className="dan-head">
                <div className="dan-head-l">
                  <span className="dan-ico" aria-hidden="true">
                    <ClusterOutlined />
                  </span>
                  <h2>访客路径</h2>
                </div>
              </div>
              <p className="dan-path-note">
                一期按页序聚合，不展示个人。相同页面类型序列算一条。意图筛的是人，同一条页序里可以有好几档。点开链路，下方展开具体页的 Title、页面类型和 URL。人数不足 5 不出。
              </p>
              <div className="funnel-embed is-antd">
                <FunnelReviewApp
                  variant="path"
                  intentId={intentId}
                  onIntent={setIntentId}
                />
              </div>
            </section>
          </div>
        )}
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
