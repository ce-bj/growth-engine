import { useMemo, useState } from "react";
import { C } from "../theme";
import { SearchableSelect } from "./SearchableSelect";
import { TriggerTimeRow } from "./TriggerTimeFields";
import {
  checkLeadGenPrerequisites,
  getLeadGenMockScenario,
  LEAD_GEN_MOCK_SCENARIOS,
  setLeadGenMockScenario,
} from "../automation/prereqCheck";
import {
  COUNTRIES,
  EMAIL_SEND_MODES,
  HS_CODES,
  fillLeadGenPrompt,
  hsOptionLabel,
} from "../automation/constants";

const hsOptions = HS_CODES.map((item) => ({
  value: item.code,
  label: hsOptionLabel(item),
  keywords: `${item.code} ${item.name}`,
}));

const countryOptions = COUNTRIES.map((item) => ({
  value: item.code,
  label: item.name,
  keywords: `${item.code} ${item.name}`,
  name: item.name,
}));

function FieldLabel({ children }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 600, color: C.textSec, marginBottom: 8 }}>
      {children}
    </div>
  );
}

export function LeadGenPlanModal({ open, onClose, onSubmit, onOpenEmailDomainConfig }) {
  const [repeatCycle, setRepeatCycle] = useState("weekly");
  const [weekday, setWeekday] = useState(1);
  const [monthDay, setMonthDay] = useState(1);
  const [executeTime, setExecuteTime] = useState("09:00");
  const [hsCode, setHsCode] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [countryName, setCountryName] = useState("");
  const [emailSendMode, setEmailSendMode] = useState("manual");
  const [replyEmail, setReplyEmail] = useState("");
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);
  const [mockOpen, setMockOpen] = useState(false);
  const [mockScenario, setMockScenario] = useState(() => getLeadGenMockScenario());

  const prompt = useMemo(
    () => fillLeadGenPrompt(hsCode, countryName, replyEmail),
    [hsCode, countryName, replyEmail],
  );

  if (!open) return null;

  const handleSubmit = async () => {
    if (!String(hsCode).trim()) {
      setError({ kind: "form", message: "请选择或输入目标品类 HS 编码" });
      return;
    }
    if (!countryName) {
      setError({ kind: "form", message: "请选择目标国家/地区" });
      return;
    }
    const email = String(replyEmail).trim();
    if (!email) {
      setError({ kind: "form", message: "请输入回信邮箱地址" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError({ kind: "form", message: "请输入正确的回信邮箱地址" });
      return;
    }
    setChecking(true);
    try {
      const pre = await checkLeadGenPrerequisites();
      if (!pre.insightInstalled) {
        setError({ kind: "insight", message: "外贸客户洞察应用未安装！无法创建任务！" });
        return;
      }
      if (!pre.emailDomainOk) {
        setError({ kind: "domain", message: "需要配置群发域名！" });
        return;
      }
      setError(null);
      onSubmit({
        repeatCycle,
        weekday,
        monthDay,
        executeTime,
        hsCode: String(hsCode).trim(),
        destinationCountry: countryCode || countryName,
        destinationCountryName: countryName,
        emailSendMode,
        replyEmail: email,
        prompt,
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div
      onClick={onClose}
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        background: "rgba(15,23,42,0.45)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "32px 24px",
        overflowY: "auto",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-gen-plan-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 540,
          maxWidth: "100%",
          overflow: "visible",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 24px 64px rgba(15,23,42,0.22)",
        }}
      >
        <div
          style={{
            padding: "18px 22px 14px",
            borderBottom: `1px solid ${C.borderLight}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div id="lead-gen-plan-title" style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
              获客计划
            </div>
            <div style={{ fontSize: 12, color: C.textDim, marginTop: 4 }}>
              到点后先查外贸客户洞察，名单返回再自动写信。发送方式可在下方选择。
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, position: "relative" }}>
            <div>
              <button
                type="button"
                onClick={() => setMockOpen((v) => !v)}
                title="模拟校验状态（暂时）"
                style={{
                  height: 22,
                  padding: "0 7px",
                  borderRadius: 999,
                  border: "1px dashed #CBD5E1",
                  background: "#F8FAFC",
                  color: "#64748B",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 0.3,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                mock
              </button>
              {mockOpen ? (
                <div
                  style={{
                    position: "absolute",
                    right: 36,
                    top: 28,
                    zIndex: 20,
                    width: 188,
                    background: "#fff",
                    border: `1px solid ${C.border}`,
                    borderRadius: 10,
                    boxShadow: "0 10px 28px rgba(15,23,42,0.14)",
                    padding: 6,
                  }}
                >
                  <div style={{ fontSize: 10, color: C.textDim, padding: "4px 8px 6px" }}>
                    模拟校验（暂时）
                  </div>
                  {LEAD_GEN_MOCK_SCENARIOS.map((item) => {
                    const active = mockScenario === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setLeadGenMockScenario(item.id);
                          setMockScenario(item.id);
                          setMockOpen(false);
                          setError(null);
                        }}
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          border: "none",
                          borderRadius: 7,
                          background: active ? "rgba(59,159,208,0.08)" : "transparent",
                          color: active ? C.brand : C.text,
                          fontSize: 12,
                          padding: "7px 8px",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          fontWeight: active ? 650 : 500,
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: 28,
                height: 28,
                border: "none",
                background: C.surfaceDark,
                borderRadius: 8,
                cursor: "pointer",
                color: C.textSec,
                fontSize: 16,
              }}
            >
              ×
            </button>
          </div>
        </div>

        <div style={{ padding: "18px 22px 8px", display: "flex", flexDirection: "column", gap: 18 }}>
          <TriggerTimeRow
            repeatCycle={repeatCycle}
            weekday={weekday}
            monthDay={monthDay}
            executeTime={executeTime}
            onCycleChange={setRepeatCycle}
            onWeekdayChange={setWeekday}
            onMonthDayChange={setMonthDay}
            onTimeChange={setExecuteTime}
          />

          <section>
            <FieldLabel>目标品类（HS 编码）</FieldLabel>
            <SearchableSelect
              value={hsCode}
              allowCustom
              placeholder="搜索或直接输入 HS 编码"
              filterHint="搜索编码 / 品类"
              options={hsOptions}
              onChange={(next) => setHsCode(next)}
            />
          </section>

          <section>
            <FieldLabel>目标国家/地区</FieldLabel>
            <SearchableSelect
              value={countryCode}
              placeholder="搜索国家或地区"
              filterHint="搜索国家/地区"
              options={countryOptions}
              onChange={(code, option) => {
                setCountryCode(code);
                setCountryName(option?.name || option?.label || "");
              }}
            />
          </section>

          <section>
            <FieldLabel>是否自动发送邮件</FieldLabel>
            <select
              value={emailSendMode}
              onChange={(e) => setEmailSendMode(e.target.value)}
              style={{
                width: "100%",
                height: 38,
                boxSizing: "border-box",
                padding: "0 10px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: "#fff",
                fontSize: 13,
                color: C.text,
                fontFamily: "inherit",
                outline: "none",
              }}
            >
              {EMAIL_SEND_MODES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </section>

          <section>
            <FieldLabel>回信邮箱地址</FieldLabel>
            <input
              type="email"
              value={replyEmail}
              placeholder="请输入回信邮箱地址"
              onChange={(e) => setReplyEmail(e.target.value)}
              style={{
                width: "100%",
                height: 38,
                boxSizing: "border-box",
                padding: "0 12px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: "#fff",
                fontSize: 13,
                color: C.text,
                fontFamily: "inherit",
                outline: "none",
              }}
            />
          </section>

          <section>
            <FieldLabel>任务指令</FieldLabel>
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                background: "#F8FAFC",
                border: `1px solid ${C.border}`,
                fontSize: 13,
                lineHeight: 1.7,
                color: C.textSec,
              }}
            >
              {prompt}
            </div>
          </section>

          {error ? (
            <div style={{ fontSize: 13, color: "#dc2626", lineHeight: 1.7 }}>
              <div>{error.message}</div>
              {error.kind === "domain" ? (
                <button
                  type="button"
                  onClick={() => onOpenEmailDomainConfig?.()}
                  style={{
                    marginTop: 6,
                    padding: 0,
                    border: "none",
                    background: "none",
                    color: "#3B9FD0",
                    fontSize: 13,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    textDecoration: "underline",
                  }}
                >
                  前往配置群发域名
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <div
          style={{
            padding: "14px 22px 18px",
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            borderTop: `1px solid ${C.borderLight}`,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: "#fff",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={checking}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: C.brand,
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: checking ? "wait" : "pointer",
              opacity: checking ? 0.75 : 1,
              fontFamily: "inherit",
            }}
          >
            {checking ? "校验中…" : "开启计划"}
          </button>
        </div>
      </div>
    </div>
  );
}
