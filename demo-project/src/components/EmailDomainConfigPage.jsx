import { useState } from "react";
import {
  getEmailDomainOk,
  getEmailDomainValue,
  setEmailDomainConfig,
} from "../automation/prereqCheck";

const DEFAULT_DOMAIN = "mailbox.mail.xuoumail.cn";

const SIDEBAR = [
  {
    title: "消息服务",
    items: ["消息模板", "短信通道", "邮箱配置", "企微通道", "钉钉通道", "站内消息"],
  },
  { title: "账号与安全", items: ["账号管理", "角色权限"] },
  { title: "网站设置", items: ["站点信息"] },
  { title: "系统设置", items: ["基础配置"] },
];

const RAIL = ["业务", "网站", "国际", "客服", "营销", "应用", "管理"];

function dnsRecords(domain) {
  return {
    send: [
      {
        name: "SPF",
        required: true,
        type: "TXT",
        host: domain,
        value: "v=spf1 include:spf.sendcloud.org ~all",
      },
      {
        name: "DKIM",
        required: true,
        type: "TXT",
        host: `mail._domainkey.${domain}`,
        value:
          "k=rsa;p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCqGKukO1De7zhZj6+H0qtjTkVxwTCpvKe4eCZ0FPqri0cb2JZfXJ/DgYSF6vUpwmJG8wVQZKjeGcjDOL5UlsuusFncCzWBQ7RKNUSesmQRMSGkVb1/3j+skZ6UtW+5u09lHNsj6tQ51s1SPrCBkedbNf0Tp0GbMJDyR4e9T04ZZwIDAQAB",
      },
      {
        name: "DMARC",
        required: false,
        type: "TXT",
        host: `_dmarc.${domain}`,
        value: `v=DMARC1;p=reject;ruf=mailto:dmarc@${domain};rua=mailto:dmarc_report@${domain}`,
      },
    ],
    recv: [
      {
        name: "MX",
        required: true,
        type: "MX",
        host: domain,
        value: "mx2.sendcloud.org",
      },
    ],
  };
}

function copyText(text) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
    return;
  }
  const el = document.createElement("textarea");
  el.value = text;
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
}

export default function EmailDomainConfigPage({ onBackToAssistant }) {
  const [tab, setTab] = useState("bulk");
  const [dnsOpen, setDnsOpen] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [copied, setCopied] = useState("");
  const [checkHint, setCheckHint] = useState("");
  const domain = getEmailDomainValue() || DEFAULT_DOMAIN;
  const [verified, setVerified] = useState(() => getEmailDomainOk());
  const records = dnsRecords(domain);

  const markCopied = (key) => {
    setCopied(key);
    window.setTimeout(() => setCopied(""), 1200);
  };

  const handleCheck = () => {
    setEmailDomainConfig({ domain, verified: true });
    setVerified(true);
    setCheckHint("检测通过，域名可使用");
  };

  const allText = [...records.send, ...records.recv]
    .map((item) => `${item.name}\t${item.type}\t${item.host}\t${item.value}`)
    .join("\n");

  return (
    <div style={css.page}>
      <aside style={css.sidebar}>
        {SIDEBAR.map((group) => (
          <div key={group.title} style={{ marginBottom: 18 }}>
            <div style={css.sideTitle}>{group.title}</div>
            {group.items.map((item) => {
              const active = item === "邮箱配置";
              return (
                <div key={item} style={active ? css.sideItemActive : css.sideItem}>
                  {item}
                </div>
              );
            })}
          </div>
        ))}
      </aside>

      <div style={css.content}>
        <div style={css.crumb}>首页 &gt; 管理设置 &gt; 消息服务 &gt; 邮箱配置</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={css.title}>邮件服务器配置</div>
          {typeof onBackToAssistant === "function" && (
            <button type="button" style={css.ghostBtn} onClick={onBackToAssistant}>
              返回增长工作台
            </button>
          )}
        </div>

        <div style={css.tabs}>
          {[
            { id: "message", label: "消息类邮箱配置" },
            { id: "bulk", label: "群发域名配置" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              style={tab === item.id ? css.tabActive : css.tab}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "message" ? (
          <div style={css.placeholder}>演示页仅展示「群发域名配置」。</div>
        ) : (
          <>
            <div style={css.alert}>
              您最多可创建 1 个发信域名：
              <span style={css.alertLink}>了解什么是发信域名？</span>
            </div>
            <div style={css.domainRow}>
              <div style={{ fontSize: 14, color: "#262626" }}>{domain}</div>
              <span style={verified ? css.okTag : css.badTag}>
                {verified ? "已验证" : "未验证"}
              </span>
              <button
                type="button"
                aria-label="启用域名"
                onClick={() => setEnabled((v) => !v)}
                style={{
                  ...css.switch,
                  background: enabled ? "#52c41a" : "#bfbfbf",
                }}
              >
                <span
                  style={{
                    ...css.switchDot,
                    transform: enabled ? "translateX(16px)" : "translateX(0)",
                  }}
                />
              </button>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <button type="button" style={css.btn} onClick={() => setDnsOpen(true)}>
                  配置DNS
                </button>
                <button type="button" style={css.btn}>删除</button>
              </div>
            </div>
          </>
        )}
      </div>

      <aside style={css.rail}>
        {RAIL.map((item) => (
          <div key={item} style={item === "管理" ? css.railActive : css.railItem}>
            {item}
          </div>
        ))}
      </aside>

      {dnsOpen ? (
        <div style={css.mask} onClick={() => setDnsOpen(false)} role="presentation">
          <div style={css.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div style={css.modalHead}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#262626" }}>发信域名配置</div>
                <div style={{ marginTop: 8, fontSize: 13, color: "#595959" }}>
                  发信域名：{domain}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <button type="button" style={css.linkBtn}>如何在DNS平台上配置域名？</button>
                <button type="button" style={css.closeBtn} onClick={() => setDnsOpen(false)}>×</button>
              </div>
            </div>

            <div style={css.steps}>
              {[
                "登录DNS平台",
                "在DNS平台添加记录，并将以下配置信息填写到记录中",
                "配置完成后，点击【检测配置】",
              ].map((text, idx) => (
                <div key={text} style={css.step}>
                  <span style={css.stepNum}>{idx + 1}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>

            <div style={css.modalBody}>
              <SectionTitle icon="send">发信配置</SectionTitle>
              {records.send.map((item) => (
                <RecordRow
                  key={item.name}
                  item={item}
                  copied={copied}
                  onCopy={(key, text) => {
                    copyText(text);
                    markCopied(key);
                  }}
                  passed={verified}
                />
              ))}
              <SectionTitle icon="recv">收信配置</SectionTitle>
              {records.recv.map((item) => (
                <RecordRow
                  key={item.name}
                  item={item}
                  copied={copied}
                  onCopy={(key, text) => {
                    copyText(text);
                    markCopied(key);
                  }}
                  passed={verified}
                />
              ))}
            </div>

            <div style={css.modalFoot}>
              <button
                type="button"
                style={css.btn}
                onClick={() => {
                  copyText(allText);
                  markCopied("all");
                }}
              >
                {copied === "all" ? "已复制" : "一键复制全部"}
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: "auto" }}>
                <span style={{ fontSize: 13, color: verified ? "#52c41a" : "#8c8c8c" }}>
                  {checkHint || (verified ? "检测通过，域名可使用" : "配置完成后请检测")}
                </span>
                <button type="button" style={css.primaryBtn} onClick={handleCheck}>
                  检测配置
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SectionTitle({ icon, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0 12px", fontSize: 14, fontWeight: 650, color: "#262626" }}>
      <span style={css.sectionIcon}>{icon === "send" ? "✈" : "☺"}</span>
      {children}
    </div>
  );
}

function RecordRow({ item, copied, onCopy, passed }) {
  return (
    <div style={css.record}>
      <div style={{ width: 88, flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 650 }}>{item.name}</div>
        <div style={{ fontSize: 12, color: item.required ? "#ff4d4f" : "#52c41a", marginTop: 2 }}>
          {item.required ? "必配项" : "选配项"}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: "#595959", lineHeight: 1.7 }}>
        <div>记录类型：{item.type}</div>
        <div>
          主机记录：{item.host}{" "}
          <button type="button" style={css.linkBtn} onClick={() => onCopy(`${item.name}-host`, item.host)}>
            {copied === `${item.name}-host` ? "已复制" : "复制"}
          </button>
        </div>
        <div style={{ wordBreak: "break-all" }}>
          记录值：{item.value}{" "}
          <button type="button" style={css.linkBtn} onClick={() => onCopy(`${item.name}-value`, item.value)}>
            {copied === `${item.name}-value` ? "已复制" : "复制"}
          </button>
        </div>
      </div>
      <div style={{ width: 92, textAlign: "right", color: passed ? "#52c41a" : "#bfbfbf", fontSize: 12 }}>
        {passed ? "✓ 检测通过" : "待检测"}
      </div>
    </div>
  );
}

const css = {
  page: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    background: "#f5f6f8",
    overflow: "hidden",
  },
  sidebar: {
    width: 220,
    flexShrink: 0,
    background: "#fff",
    borderRight: "1px solid #f0f0f0",
    padding: "16px 10px",
    overflowY: "auto",
  },
  sideTitle: { fontSize: 12, color: "#8c8c8c", padding: "4px 12px 8px" },
  sideItem: {
    padding: "8px 12px",
    fontSize: 13,
    color: "#595959",
    borderRadius: 4,
    cursor: "default",
  },
  sideItemActive: {
    padding: "8px 12px",
    fontSize: 13,
    color: "#3B9FD0",
    background: "#E8F4FA",
    borderRadius: 4,
    fontWeight: 600,
  },
  content: {
    flex: 1,
    minWidth: 0,
    padding: "16px 24px 24px",
    overflow: "auto",
    background: "#fff",
  },
  crumb: { fontSize: 12, color: "#8c8c8c", marginBottom: 10 },
  title: { fontSize: 20, fontWeight: 700, color: "#262626" },
  tabs: {
    display: "flex",
    gap: 24,
    borderBottom: "1px solid #f0f0f0",
    marginTop: 16,
  },
  tab: {
    border: "none",
    background: "none",
    padding: "10px 0",
    fontSize: 14,
    color: "#595959",
    cursor: "pointer",
  },
  tabActive: {
    border: "none",
    background: "none",
    padding: "10px 0",
    fontSize: 14,
    color: "#3B9FD0",
    borderBottom: "2px solid #3B9FD0",
    fontWeight: 600,
    cursor: "pointer",
  },
  alert: {
    marginTop: 16,
    background: "#fffbe6",
    border: "1px solid #ffe58f",
    borderRadius: 4,
    padding: "10px 14px",
    fontSize: 13,
    color: "#ad6800",
  },
  alertLink: { color: "#3B9FD0", marginLeft: 4, cursor: "pointer" },
  domainRow: {
    marginTop: 16,
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 16px",
    border: "1px solid #f0f0f0",
    borderRadius: 6,
  },
  okTag: {
    fontSize: 12,
    color: "#389e0d",
    background: "#f6ffed",
    border: "1px solid #b7eb8f",
    borderRadius: 4,
    padding: "1px 8px",
  },
  badTag: {
    fontSize: 12,
    color: "#cf1322",
    background: "#fff1f0",
    border: "1px solid #ffa39e",
    borderRadius: 4,
    padding: "1px 8px",
  },
  switch: {
    width: 40,
    height: 22,
    border: "none",
    borderRadius: 11,
    padding: 2,
    cursor: "pointer",
  },
  switchDot: {
    display: "block",
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: "#fff",
    transition: "transform 0.15s ease",
  },
  btn: {
    height: 32,
    padding: "0 12px",
    border: "1px solid #d9d9d9",
    borderRadius: 4,
    background: "#fff",
    fontSize: 13,
    cursor: "pointer",
  },
  ghostBtn: {
    height: 32,
    padding: "0 12px",
    border: "1px solid #d9d9d9",
    borderRadius: 4,
    background: "#fff",
    fontSize: 13,
    cursor: "pointer",
    color: "#595959",
  },
  primaryBtn: {
    height: 32,
    padding: "0 16px",
    border: "none",
    borderRadius: 4,
    background: "#3B9FD0",
    color: "#fff",
    fontSize: 13,
    cursor: "pointer",
  },
  placeholder: { marginTop: 48, textAlign: "center", color: "#8c8c8c", fontSize: 13 },
  rail: {
    width: 56,
    flexShrink: 0,
    background: "#fff",
    borderLeft: "1px solid #f0f0f0",
    paddingTop: 12,
  },
  railItem: { fontSize: 12, color: "#8c8c8c", textAlign: "center", padding: "12px 0" },
  railActive: { fontSize: 12, color: "#3B9FD0", textAlign: "center", padding: "12px 0", fontWeight: 650 },
  mask: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    zIndex: 90,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "40px 16px",
    overflowY: "auto",
  },
  modal: {
    width: 860,
    maxWidth: "100%",
    background: "#fff",
    borderRadius: 8,
    boxShadow: "0 12px 48px rgba(0,0,0,0.18)",
  },
  modalHead: {
    padding: "16px 20px 12px",
    borderBottom: "1px solid #f0f0f0",
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
  },
  closeBtn: {
    width: 28,
    height: 28,
    border: "none",
    background: "none",
    fontSize: 20,
    cursor: "pointer",
    color: "#8c8c8c",
  },
  steps: {
    display: "flex",
    gap: 16,
    padding: "14px 20px",
    background: "#fafafa",
    fontSize: 12,
    color: "#595959",
    lineHeight: 1.5,
  },
  step: { display: "flex", gap: 8, flex: 1, alignItems: "flex-start" },
  stepNum: {
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: "#3B9FD0",
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    flexShrink: 0,
    marginTop: 1,
  },
  modalBody: { padding: "12px 20px 8px", maxHeight: 420, overflowY: "auto" },
  sectionIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    background: "#E8F4FA",
    color: "#3B9FD0",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
  },
  record: {
    display: "flex",
    gap: 12,
    padding: "12px 0",
    borderBottom: "1px solid #f5f5f5",
  },
  linkBtn: {
    border: "none",
    background: "none",
    color: "#3B9FD0",
    fontSize: 13,
    cursor: "pointer",
    padding: 0,
  },
  modalFoot: {
    padding: "12px 20px 16px",
    borderTop: "1px solid #f0f0f0",
    display: "flex",
    alignItems: "center",
  },
};
