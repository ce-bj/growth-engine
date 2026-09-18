import { useEffect, useMemo, useState } from "react";
import { deleteCampaign, loadCampaigns, upsertCampaign } from "../automation/emailCampaignStore";

const SIDEBAR = [
  {
    title: "搜索引擎优化",
    items: ["关键词密度", "蜘蛛频次分析"],
  },
  {
    title: "推广营销",
    items: ["谷歌广告投放", "群发邮件", "群发短信", "邮件营销"],
  },
  {
    title: "营销渠道",
    items: ["Facebook", "Instagram", "LinkedIn", "TikTok", "WhatsApp", "YouTube", "Pinterest"],
  },
];

function formatStamp(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function EnvelopeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="#3B9FD0" strokeWidth="1.6" />
      <path d="M4 7.2L12 13.2L20 7.2" stroke="#3B9FD0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 11.5L12 4l8 7.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-8.5z" stroke="#8c8c8c" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export default function EmailMarketingPage({ highlightId, onBackToAssistant }) {
  const [campaigns, setCampaigns] = useState(() => loadCampaigns());
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [viewing, setViewing] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    setCampaigns(loadCampaigns());
  }, [highlightId]);

  useEffect(() => {
    if (!highlightId) return;
    const el = document.getElementById(`campaign-row-${highlightId}`);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [highlightId, campaigns]);

  const visible = useMemo(() => {
    return campaigns.filter((item) => {
      if (statusFilter === "sent" && item.status !== "sent") return false;
      if (statusFilter === "draft" && item.status !== "draft") return false;
      if (startDate) {
        const start = new Date(`${startDate}T00:00:00`).getTime();
        if ((item.sentAt || 0) < start) return false;
      }
      if (endDate) {
        const end = new Date(`${endDate}T23:59:59`).getTime();
        if ((item.sentAt || 0) > end) return false;
      }
      return true;
    });
  }, [campaigns, statusFilter, startDate, endDate]);

  const handleNew = () => {
    const next = upsertCampaign({
      id: `draft-${Date.now()}`,
      title: "未命名邮件",
      status: "draft",
      recipientCount: 0,
      sentAt: Date.now(),
      source: "manual",
      emails: [],
    });
    setCampaigns(next);
  };

  return (
    <div style={css.page}>
      <aside style={css.sidebar}>
        {SIDEBAR.map((group) => (
          <div key={group.title} style={{ marginBottom: 18 }}>
            <div style={css.sideTitle}>{group.title}</div>
            {group.items.map((item) => {
              const active = item === "邮件营销";
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
        <div style={css.crumb}>
          <HomeIcon />
          <span>首页</span>
          <span style={css.crumbSep}>&gt;</span>
          <span>营销管理</span>
          <span style={css.crumbSep}>&gt;</span>
          <span>推广营销</span>
          <span style={css.crumbSep}>&gt;</span>
          <span>邮件营销</span>
          <span style={css.crumbSep}>&gt;</span>
          <span style={{ color: "#595959" }}>邮件营销</span>
          {typeof onBackToAssistant === "function" ? (
            <button type="button" style={css.crumbBack} onClick={onBackToAssistant}>
              返回增长工作台
            </button>
          ) : null}
        </div>

        <div style={css.title}>邮件营销</div>

        <div style={css.toolbar}>
          <button type="button" style={css.primaryBtn} onClick={handleNew}>
            + 新建邮件
          </button>
          <div style={css.filters}>
            <select
              style={css.select}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">全部状态</option>
              <option value="sent">已发送</option>
              <option value="draft">草稿</option>
            </select>
            <div style={css.dateField}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={css.dateInput}
                aria-label="开始时间"
              />
              <span style={{ color: "#bfbfbf", fontSize: 12 }}>-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={css.dateInput}
                aria-label="结束时间"
              />
            </div>
          </div>
        </div>

        <div style={css.list}>
          {visible.map((item) => {
            const active = highlightId && item.id === highlightId;
            const sent = item.status === "sent";
            return (
              <div key={item.id} id={`campaign-row-${item.id}`} style={active ? css.rowActive : css.row}>
                <div style={css.mailIcon}>
                  <EnvelopeIcon />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <button
                    type="button"
                    style={css.mailTitle}
                    onClick={() => setViewing(item)}
                  >
                    {item.title}
                  </button>
                  <div style={css.mailMeta}>
                    {sent ? "发送于" : "创建于"} {item.location || "中国-北京"} {formatStamp(item.sentAt)}
                  </div>
                </div>
                <div style={sent ? css.statusSent : css.statusDraft}>
                  {sent ? "已发送" : "草稿"}
                </div>
                <div style={css.recipients}>收件人：{item.recipientCount || 0}人</div>
                <div style={css.actions}>
                  {sent ? (
                    <>
                      <button type="button" style={css.linkBtn} onClick={() => setViewing(item)}>
                        查看邮件
                      </button>
                      <button type="button" style={css.linkBtn} onClick={() => setStats(item)}>
                        查看数据
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" style={css.linkBtn} onClick={() => setViewing(item)}>
                        编辑
                      </button>
                      <button
                        type="button"
                        style={css.linkBtn}
                        onClick={() => setCampaigns(deleteCampaign(item.id))}
                      >
                        删除
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {visible.length === 0 ? (
            <div style={css.empty}>暂无邮件</div>
          ) : null}
        </div>
      </div>

      {viewing ? (
        <Modal title={viewing.status === "draft" ? "编辑邮件" : "查看邮件"} onClose={() => setViewing(null)}>
          <div style={{ fontSize: 16, fontWeight: 650, color: "#262626", lineHeight: 1.5 }}>{viewing.title}</div>
          <div style={{ marginTop: 8, fontSize: 13, color: "#8c8c8c" }}>
            {viewing.status === "sent" ? "已发送" : "草稿"} · 收件人 {viewing.recipientCount || 0} 人
          </div>
          <div style={{ marginTop: 16 }}>
            {(viewing.emails || []).length === 0 ? (
              <div style={{ fontSize: 13, color: "#8c8c8c" }}>这封还是草稿，没有收件内容。</div>
            ) : (
              viewing.emails.map((mail) => (
                <div key={mail.to || mail.subject} style={css.mailCard}>
                  <div style={{ fontSize: 13, color: "#262626", fontWeight: 600 }}>{mail.subject}</div>
                  <div style={{ marginTop: 6, fontSize: 12, color: "#8c8c8c" }}>
                    To: {mail.to}{mail.company ? `（${mail.company}）` : ""}
                  </div>
                  <div style={{ marginTop: 10, fontSize: 13, color: "#595959", lineHeight: 1.7 }}>
                    {mail.preview}
                  </div>
                </div>
              ))
            )}
          </div>
        </Modal>
      ) : null}

      {stats ? (
        <Modal title="查看数据" onClose={() => setStats(null)}>
          <div style={{ fontSize: 14, color: "#262626", marginBottom: 16 }}>{stats.title}</div>
          <div style={css.statGrid}>
            <Stat label="发送成功" value={String(stats.recipientCount || 0)} />
            <Stat label="打开次数" value="—" />
            <Stat label="点击次数" value="—" />
          </div>
          <div style={{ marginTop: 14, fontSize: 12, color: "#8c8c8c" }}>演示数据，未接真实发信统计。</div>
        </Modal>
      ) : null}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={css.stat}>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#262626" }}>{value}</div>
      <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 4 }}>{label}</div>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={css.mask} onClick={onClose} role="presentation">
      <div style={css.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div style={css.modalHead}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#262626" }}>{title}</div>
          <button type="button" style={css.closeBtn} onClick={onClose} aria-label="关闭">×</button>
        </div>
        <div style={css.modalBody}>{children}</div>
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
    padding: "16px 28px 24px",
    overflow: "auto",
    background: "#fff",
  },
  crumb: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    color: "#8c8c8c",
    marginBottom: 12,
  },
  crumbSep: { color: "#d9d9d9" },
  crumbBack: {
    marginLeft: "auto",
    border: "1px solid #d9d9d9",
    background: "#fff",
    height: 28,
    padding: "0 10px",
    borderRadius: 4,
    fontSize: 12,
    color: "#595959",
    cursor: "pointer",
  },
  title: { fontSize: 22, fontWeight: 700, color: "#262626", marginBottom: 16 },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 12,
  },
  primaryBtn: {
    height: 32,
    padding: "0 14px",
    border: "none",
    borderRadius: 4,
    background: "#3B9FD0",
    color: "#fff",
    fontSize: 13,
    cursor: "pointer",
  },
  filters: { display: "flex", alignItems: "center", gap: 10 },
  select: {
    height: 32,
    border: "1px solid #d9d9d9",
    borderRadius: 4,
    padding: "0 8px",
    fontSize: 13,
    background: "#fff",
    color: "#595959",
  },
  dateField: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    height: 32,
    border: "1px solid #d9d9d9",
    borderRadius: 4,
    padding: "0 8px",
    background: "#fff",
  },
  dateInput: {
    border: "none",
    outline: "none",
    fontSize: 12,
    color: "#8c8c8c",
    background: "transparent",
    width: 118,
  },
  list: { marginTop: 8 },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "18px 8px",
    borderBottom: "1px solid #f5f5f5",
  },
  rowActive: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "18px 8px",
    borderBottom: "1px solid #f5f5f5",
    background: "#f0f7ff",
    borderRadius: 6,
  },
  mailIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    background: "#E8F4FA",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  mailTitle: {
    border: "none",
    background: "none",
    padding: 0,
    color: "#3B9FD0",
    fontSize: 14,
    cursor: "pointer",
    textAlign: "left",
    lineHeight: 1.5,
  },
  mailMeta: { marginTop: 6, fontSize: 12, color: "#8c8c8c" },
  statusSent: { width: 72, flexShrink: 0, fontSize: 13, color: "#52c41a", fontWeight: 500 },
  statusDraft: { width: 72, flexShrink: 0, fontSize: 13, color: "#8c8c8c" },
  recipients: { width: 110, flexShrink: 0, fontSize: 13, color: "#595959" },
  actions: { display: "flex", gap: 16, flexShrink: 0, width: 140, justifyContent: "flex-end" },
  linkBtn: {
    border: "none",
    background: "none",
    color: "#3B9FD0",
    fontSize: 13,
    cursor: "pointer",
    padding: 0,
  },
  empty: { padding: "48px 0", textAlign: "center", color: "#8c8c8c", fontSize: 13 },
  mask: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    zIndex: 90,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "48px 16px",
  },
  modal: {
    width: 640,
    maxWidth: "100%",
    background: "#fff",
    borderRadius: 8,
    boxShadow: "0 12px 48px rgba(0,0,0,0.18)",
  },
  modalHead: {
    padding: "14px 20px",
    borderBottom: "1px solid #f0f0f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
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
  modalBody: { padding: "16px 20px 20px" },
  mailCard: {
    padding: 12,
    border: "1px solid #f0f0f0",
    borderRadius: 6,
    background: "#fafafa",
    marginBottom: 10,
  },
  statGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 },
  stat: {
    padding: "16px 12px",
    background: "#fafafa",
    borderRadius: 6,
    textAlign: "center",
  },
};
