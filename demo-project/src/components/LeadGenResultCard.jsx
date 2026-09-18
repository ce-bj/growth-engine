import { useMemo, useState } from "react";
import { C } from "../theme";
import { buyerKey } from "../automation/developability";

function StarRow({ score }) {
  const n = Number(score) || 0;
  return (
    <span style={{ letterSpacing: 1, fontSize: 12, color: "#D97706", fontWeight: 700 }} aria-label={`开发价值 ${n} 星`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < n ? "#D97706" : "#CBD5E1" }}>★</span>
      ))}
      <span style={{ marginLeft: 6, letterSpacing: 0, fontSize: 11, color: C.textSec, fontWeight: 650 }}>
        {n} 星
      </span>
    </span>
  );
}

function TagChip({ tag }) {
  const pos = tag.polarity === "pos";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "1px 7px",
        borderRadius: 999,
        fontSize: 10,
        lineHeight: "18px",
        background: pos ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.14)",
        color: pos ? "#047857" : "#B45309",
      }}
    >
      {tag.label}
    </span>
  );
}

function mailBadge(buyer, included) {
  if (buyer.inDefaultMail) return { text: "写入通用信", color: "#047857", bg: "rgba(16,185,129,0.12)" };
  if (buyer.canOptInMail && included) return { text: "已加入本次", color: "#2F8BB8", bg: "rgba(59,159,208,0.1)" };
  if (buyer.canOptInMail) return { text: "可勾选加入", color: "#475569", bg: "#F1F5F9" };
  return { text: "不发送", color: "#94A3B8", bg: "#F8FAFC" };
}

export function LeadGenResultCard({
  buyers = [],
  emails = [],
  mailRecipients = [],
  actionState = "pending",
  sendMode = "manual",
  onConfirm,
  onSkip,
  onOpenEmailMarketing,
}) {
  const pending = actionState === "pending";
  const autoSent = sendMode === "auto" && actionState === "sent";
  const generic = emails[0];
  const [optInKeys, setOptInKeys] = useState(() => new Set());

  const includedBuyers = useMemo(() => {
    return buyers.filter((b) => {
      if (b.inDefaultMail) return true;
      if (!pending) {
        const sentKeys = new Set((mailRecipients || []).map(buyerKey));
        return sentKeys.has(buyerKey(b));
      }
      return b.canOptInMail && optInKeys.has(buyerKey(b));
    });
  }, [buyers, pending, optInKeys, mailRecipients]);

  const defaultCount = buyers.filter((b) => b.inDefaultMail).length;
  const includedCount = includedBuyers.length;

  const toggleOptIn = (key) => {
    setOptInKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleConfirm = () => {
    const recipients = includedBuyers.filter((b) => b.email);
    onConfirm?.({
      recipients,
      emails: generic
        ? [{ ...generic, to: recipients.map((b) => b.email).join(", "), recipients }]
        : emails,
    });
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 560,
        background: "#fff",
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "12px 14px 10px", borderBottom: `1px solid ${C.borderLight}` }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
          已找到 {buyers.length} 家采购商
        </div>
        <div style={{ fontSize: 11, color: C.textDim, marginTop: 4, lineHeight: 1.55 }}>
          开发价值：星级越高，采购越活跃、越好跟。默认 {defaultCount} 家 4–5 星写入这封通用开发信。
          {autoSent ? " 已按计划自动发送。" : pending ? " 3 星可勾选加入；1–2 星只展示，不进群发。" : ""}
        </div>
      </div>

      <div style={{ maxHeight: 340, overflowY: "auto", padding: "8px 10px" }}>
        {buyers.map((b) => {
          const key = buyerKey(b);
          const included = includedBuyers.some((x) => buyerKey(x) === key);
          const badge = mailBadge(b, included);
          return (
            <div
              key={key || b.company}
              style={{
                padding: "8px 8px",
                borderRadius: 8,
                marginBottom: 6,
                background: C.surfaceDark,
                border: included ? "1px solid rgba(16,185,129,0.35)" : "1px solid transparent",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 650, color: C.text }}>{b.company}</div>
                  <div style={{ marginTop: 3 }}>
                    <StarRow score={b.score} />
                  </div>
                </div>
                <span
                  style={{
                    flexShrink: 0,
                    fontSize: 10,
                    fontWeight: 650,
                    padding: "2px 7px",
                    borderRadius: 999,
                    color: badge.color,
                    background: badge.bg,
                  }}
                >
                  {badge.text}
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                {(b.tags || []).map((tag) => (
                  <TagChip key={tag.key} tag={tag} />
                ))}
              </div>
              <div style={{ fontSize: 11, color: C.textSec, marginTop: 5, lineHeight: 1.5 }}>{b.reason}</div>
              <div style={{ fontSize: 11, color: C.textDim, marginTop: 3 }}>
                {b.country} · HS {b.hs}
                {b.email ? ` · ${b.email}` : " · 无邮箱"}
              </div>
              {pending && b.canOptInMail ? (
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 6,
                    fontSize: 11,
                    color: C.textSec,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={optInKeys.has(key)}
                    onChange={() => toggleOptIn(key)}
                  />
                  加入本次通用信发送
                </label>
              ) : null}
            </div>
          );
        })}
      </div>

      <div style={{ padding: "4px 10px 10px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.textSec, margin: "4px 8px 8px" }}>
          通用开发信（{includedCount} 家）
        </div>
        {generic ? (
          <div style={{ marginBottom: 6, border: `1px solid ${C.borderLight}`, borderRadius: 8 }}>
            <div style={{ padding: "8px 10px" }}>
              <div style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{generic.subject}</div>
              <div style={{ fontSize: 11, color: C.textDim, marginTop: 4, lineHeight: 1.55 }}>
                To: {includedBuyers.map((b) => b.email).filter(Boolean).join(", ") || "（无收件人）"}
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: C.textSec, lineHeight: 1.6 }}>
                {generic.preview}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: C.textDim, padding: "0 8px 8px" }}>
            没有 4 星、5 星可发信对象，未生成通用开发信。
          </div>
        )}
      </div>

      <div
        style={{
          padding: "10px 12px 12px",
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          borderTop: `1px solid ${C.borderLight}`,
        }}
      >
        {!pending && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <div style={{ fontSize: 12, color: actionState === "sent" ? C.success : C.textDim, fontWeight: 600 }}>
              {actionState === "sent"
                ? (autoSent
                  ? `已自动发送给 ${includedCount} 家（演示未真实发信）`
                  : `已确认群发给 ${includedCount} 家（演示未真实发信）`)
                : "已暂不发送"}
            </div>
            {actionState === "sent" && typeof onOpenEmailMarketing === "function" ? (
              <button
                type="button"
                onClick={onOpenEmailMarketing}
                style={{
                  border: "none",
                  background: "none",
                  padding: 0,
                  color: C.brand,
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textDecoration: "underline",
                  textUnderlineOffset: 2,
                }}
              >
                去邮件营销查看
              </button>
            ) : null}
          </div>
        )}
        {pending && (
          <>
            <button
              type="button"
              onClick={onSkip}
              style={{
                padding: "7px 12px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: "#fff",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              暂不发送
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={includedCount === 0}
              style={{
                padding: "7px 12px",
                borderRadius: 8,
                border: "none",
                background: includedCount === 0 ? C.textDim : C.brand,
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                cursor: includedCount === 0 ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              确认群发（{includedCount} 家）
            </button>
          </>
        )}
      </div>
    </div>
  );
}
