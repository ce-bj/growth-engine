/** 网站策略页（Growth/vis-analysis）。与数字门户「数据分析-旧」已拆开。 */
import { useMemo, useState } from "react";
import { App as AntApp, Button, ConfigProvider, DatePicker, Dropdown, Segmented } from "antd";
import zhCN from "antd/locale/zh_CN";
import { ArrowLeftOutlined, SwapOutlined } from "@ant-design/icons";
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

const BOARD_SITES = [
  { id: "demo", lang: "英文", host: "www.demo-cnc-oem.com", name: "Demo · CNC 精密加工件外贸站" },
  { id: "live", lang: "中文简体", host: MCP_SITE.host, name: MCP_SITE.name },
  { id: "live2", lang: "中文简体", host: GOODY_SITE.host, name: GOODY_SITE.name },
];

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

function SiteSwitch({ value, onChange }) {
  const current = BOARD_SITES.find((site) => site.id === value) || BOARD_SITES[0];
  return (
    <div className="dan-site-switch">
      <span className="dan-site-switch__current" title={current.name}>
        {current.lang} {current.host}
      </span>
      <Dropdown
        trigger={["click"]}
        menu={{
          selectable: true,
          selectedKeys: [current.id],
          items: BOARD_SITES.map((site) => ({
            key: site.id,
            label: (
              <span className="dan-site-option">
                <b>{site.lang}</b>
                <span>{site.host}</span>
              </span>
            ),
          })),
          onClick: ({ key }) => onChange(key),
        }}
      >
        <button type="button" className="dan-site-switch__action" aria-label={`切换网站，当前 ${current.lang} ${current.host}`}>
          <SwapOutlined />
          切换网站
        </button>
      </Dropdown>
    </div>
  );
}

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
      backLabel={boardOnly ? "返回数据看板" : "返回访客洞察与策略"}
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
            <div className="dan-board-bar">
              <SiteSwitch value={boardKind} onChange={setBoardKind} />
              <div className="dan-board-switch">
                <span>Mock</span>
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
            </div>
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

  function openFullBoard() {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "growth-navigate", view: "board" }, "*");
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set("view", "board");
    window.location.assign(url.toString());
  }

  const diagnosed = site.diagnosed && week.id === WEEKS[0].id;

  const toolbarExtra = (
    <>
      {site.diagnosed ? (
        <DatePicker
          picker="week"
          className="dan-week-select"
          size="small"
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
      ) : null}
      <Button size="small" onClick={openFullBoard}>完整数据看板 &gt;</Button>
      <span className="dan-mock">
        <MockStateSwitch value={runState} onChange={setRunState} />
      </span>
    </>
  );

  return (
    <>
      {auth}
      <div className="dan-page" style={pageStyle}>
        <div className="dan-inner is-agent">
          <AgentPage
            key={`${site.id}-${week.id}`}
            weekId={week.id}
            weekLabel={week.label}
            diagnosed={diagnosed}
            quiet={quiet}
            authMap={authMap}
            onAuthorize={setAuthKey}
            onSelectLatestWeek={() => setWeekId(WEEKS[0].id)}
            toolbarExtra={toolbarExtra}
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
