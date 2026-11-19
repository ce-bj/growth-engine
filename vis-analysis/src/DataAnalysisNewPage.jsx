/** 网站策略页（Growth/vis-analysis）。与数字门户「数据分析-旧」已拆开。 */
import { useMemo, useState } from "react";
import { App as AntApp, Button, ConfigProvider, DatePicker, Segmented } from "antd";
import zhCN from "antd/locale/zh_CN";
import { ArrowLeftOutlined, FileTextOutlined, HistoryOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import "dayjs/locale/zh-cn";
import AgentPage, { MockStateSwitch } from "./agent-page/AgentPage.jsx";
import DetailBoard from "./detail-board/DetailBoard.jsx";
import McpDetailBoard from "./detail-board/McpDetailBoard.jsx";
import { MCP_SITE } from "./detail-board/mcpBoardData.js";
import { getGoodyBoard, GOODY_SITE } from "./detail-board/goodyBoardData.js";
import "./data-analysis-new.css";
import { AUTH_SOURCES, LATEST_CLOSED_WEEK_END, QUIET_WEEK_IDS, SITES, SOURCE_AUTH_PAGES, WEEKS, weekFromId } from "./diagnosisPeriod.js";

dayjs.extend(isoWeek);
dayjs.locale("zh-cn");

const LATEST_CLOSED = dayjs(LATEST_CLOSED_WEEK_END);

function weekIdFromDayjs(value) {
  const start = value.startOf("isoWeek");
  return `${start.year()}-${start.month() + 1}-${start.date()}`;
}

function dayjsFromWeekId(id) {
  const week = weekFromId(id);
  const [year, month, day] = week.id.split("-").map(Number);
  return dayjs(new Date(year, month - 1, day));
}

function formatClosedWeek(value) {
  if (!value) return "";
  const start = value.startOf("isoWeek");
  const end = value.endOf("isoWeek");
  const startText = `${start.year()}年 ${start.month() + 1}月${start.date()}日`;
  const endText = start.year() === end.year()
    ? `${end.month() + 1}月${end.date()}日`
    : `${end.year()}年 ${end.month() + 1}月${end.date()}日`;
  return `${startText} – ${endText}`;
}

const THEME = {
  token: {
    colorPrimary: "#3989FF",
    colorInfo: "#3989FF",
    colorSuccess: "#10b981",
    colorWarning: "#f59e0b",
    colorError: "#ef4444",
    colorText: "#0f172a",
    colorTextSecondary: "#475569",
    colorBorder: "#e7ebf3",
    colorBorderSecondary: "#e7ebf3",
    colorBgContainer: "#ffffff",
    colorBgLayout: "#f5f7fb",
    borderRadius: 6,
    fontFamily: "'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', 'Segoe UI', sans-serif",
    fontSize: 14,
    controlHeight: 40,
  },
  components: {
    Select: {
      optionSelectedBg: "#eef6ff",
    },
    Card: { borderRadiusLG: 8 },
  },
};

const BOARD_PAGE_THEME = {
  ...THEME,
  token: {
    ...THEME.token,
    colorPrimary: "#2f8bb8",
    colorInfo: "#2f8bb8",
    controlHeight: 32,
  },
  components: {
    ...THEME.components,
    Select: { optionSelectedBg: "#e8f4fb" },
  },
};

function AuthConnect({ sourceKey, backLabel, onBack, onDone }) {
  const { message } = AntApp.useApp();
  const [busy, setBusy] = useState(false);
  const copy = SOURCE_AUTH_PAGES[sourceKey] || {
    name: sourceKey,
    title: `授权 ${sourceKey}`,
    hint: "授权后，对应来源的搜索词会进入智能体取资料的范围。不对接到具体访客。",
    scopes: ["搜索词明细"],
    cta: "去授权",
  };

  async function connect() {
    setBusy(true);
    await new Promise((resolve) => setTimeout(resolve, 640));
    message.success(`${copy.name}已授权`);
    onDone(sourceKey);
  }

  return (
    <div className="dan-blank">
      <div className="dan-blank-bar">
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
          {backLabel}
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

function Workbench({ boardOnly, intakeOnly }) {
  const [authKey, setAuthKey] = useState(null);
  const [granted, setGranted] = useState({});
  const [weekId, setWeekId] = useState(WEEKS[0].id);
  const [monthlyOpen, setMonthlyOpen] = useState(false);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [boardKind, setBoardKind] = useState("demo");
  const [runState, setRunState] = useState("pending");

  const site = SITES[0];
  const week = weekFromId(weekId);
  const quiet = QUIET_WEEK_IDS.has(week.id);
  const authMap = useMemo(() => {
    const map = {};
    AUTH_SOURCES.forEach((item) => {
      map[item.key] = item.status === "ok" || Boolean(granted[item.key]);
    });
    return map;
  }, [granted]);

  function finishAuth(key) {
    setGranted((prev) => ({ ...prev, [key]: true }));
    setAuthKey(null);
  }

  const auth = authKey ? (
    <AuthConnect
      sourceKey={authKey}
      backLabel={boardOnly ? "返回数据看板" : intakeOnly ? "返回网站承接数据" : "返回网站策略"}
      onBack={() => setAuthKey(null)}
      onDone={finishAuth}
    />
  ) : null;
  const pageStyle = authKey ? { display: "none" } : undefined;

  if (boardOnly) {
    return (
      <>
        {auth}
        <div className="dan-page is-board" style={pageStyle}>
          <div className="dan-inner is-agent">
            <div className="dan-board-switch">
              <span>看板</span>
              <Segmented
                value={boardKind}
                onChange={setBoardKind}
                options={[
                  { value: "demo", label: "演示数据" },
                  { value: "live", label: "实际数据" },
                  { value: "live2", label: "实际数据2" },
                ]}
              />
              <span className="dan-board-switch-note">
                {boardKind === "demo"
                  ? "样例站点，模块和数字都是演示数据。"
                  : boardKind === "live2"
                    ? `${GOODY_SITE.name} · ${GOODY_SITE.host} · 截至 ${GOODY_SITE.asOf}`
                    : `${MCP_SITE.name} · ${MCP_SITE.host} · 截至 ${MCP_SITE.asOf}`}
              </span>
            </div>
            {boardKind !== "demo" ? (
              <header className="dan-toolbar">
                <span className="dan-live-site">{boardKind === "live2" ? GOODY_SITE.name : MCP_SITE.name}</span>
              </header>
            ) : null}
            {boardKind === "demo" ? (
              <DetailBoard authMap={authMap} onAuthorize={setAuthKey} />
            ) : boardKind === "live2" ? (
              <McpDetailBoard getBoard={getGoodyBoard} />
            ) : (
              <McpDetailBoard />
            )}
          </div>
        </div>
      </>
    );
  }

  if (intakeOnly) {
    return (
      <>
        {auth}
        <div className="dan-page" style={pageStyle}>
          <div className="dan-inner is-agent">
            <DetailBoard authMap={authMap} onAuthorize={setAuthKey} mode="intake" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {auth}
      <div className="dan-page" style={pageStyle}>
        <div className="dan-inner is-agent">
          <header className="dan-toolbar">
            {site.diagnosed ? (
              <Button icon={<HistoryOutlined />} onClick={() => setLedgerOpen(true)}>
                以前建议过的事
              </Button>
            ) : null}
            {site.diagnosed ? (
              <>
                <DatePicker
                  picker="week"
                  className="dan-week-select"
                  size="middle"
                  allowClear={false}
                  inputReadOnly
                  placeholder="选择自然周"
                  value={dayjsFromWeekId(week.id)}
                  format={formatClosedWeek}
                  maxDate={LATEST_CLOSED}
                  disabledDate={(date) => date.endOf("isoWeek").isAfter(LATEST_CLOSED, "day")}
                  classNames={{ popup: { root: "dan-week-popup" } }}
                  aria-label="选择已结束的自然周（周一至周日）"
                  onChange={(value) => {
                    if (value) setWeekId(weekIdFromDayjs(value));
                  }}
                />
                <Button icon={<FileTextOutlined />} onClick={() => setMonthlyOpen(true)}>
                  这个月做了什么
                </Button>
              </>
            ) : null}
            <span className="dan-mock">
              <MockStateSwitch value={runState} onChange={setRunState} />
            </span>
          </header>
          <AgentPage
            key={`${site.id}-${week.id}`}
            site={site}
            weekLabel={week.label}
            quiet={quiet}
            authMap={authMap}
            onAuthorize={setAuthKey}
            monthlyOpen={monthlyOpen}
            onCloseMonthly={() => setMonthlyOpen(false)}
            ledgerOpen={ledgerOpen}
            onCloseLedger={() => setLedgerOpen(false)}
            runState={runState}
            onRunState={setRunState}
          />
        </div>
      </div>
    </>
  );
}

export default function DataAnalysisNewPage({ view = "agent" }) {
  return (
    <ConfigProvider locale={zhCN} theme={view === "board" ? BOARD_PAGE_THEME : THEME} button={{ autoInsertSpace: false }}>
      <AntApp style={{ flex: 1, minWidth: 0, minHeight: 0, height: "100%", display: "flex" }}>
        <Workbench boardOnly={view === "board"} intakeOnly={view === "intake"} />
      </AntApp>
    </ConfigProvider>
  );
}
