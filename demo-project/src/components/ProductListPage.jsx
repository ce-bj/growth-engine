import { useState } from "react";

const MOCK_PRODUCTS = [
  { id: "1529185917308903424", name: "PS2004 动力换挡拖拉机 147.5kW", category: "农业机械", status: "已发布", descLen: 42,  updateTime: "2026-07-20", views: 128 },
  { id: "1529185917308903425", name: "截止阀 DN50 不锈钢法兰式",       category: "阀门管件", status: "已发布", descLen: 318, updateTime: "2026-07-19", views: 254 },
  { id: "1529185917308903426", name: "球阀 Q41F-16 碳钢全通径",        category: "阀门管件", status: "已发布", descLen: 0,   updateTime: "2026-07-18", views: 76  },
  { id: "1529185917308903427", name: "蝶阀 D71X-10 对夹式衬胶",        category: "阀门管件", status: "草稿",   descLen: 55,  updateTime: "2026-07-17", views: 0   },
  { id: "1529185917308903428", name: "减压阀 Y43H-16C 可调式",         category: "控制阀",   status: "已发布", descLen: 0,   updateTime: "2026-07-16", views: 89  },
  { id: "1529185917308903429", name: "电动调节阀 ZAZP DN80",           category: "控制阀",   status: "已发布", descLen: 127, updateTime: "2026-07-15", views: 203 },
  { id: "1529185917308903430", name: "过滤器 Y型 DN100 铸铁",          category: "管道附件", status: "已发布", descLen: 0,   updateTime: "2026-07-14", views: 61  },
  { id: "1529185917308903431", name: "安全阀 A28H-16 弹簧全启式",      category: "安全阀",   status: "草稿",   descLen: 88,  updateTime: "2026-07-13", views: 0   },
  { id: "1529185917308903432", name: "闸阀 Z41H-16 明杆楔式",          category: "阀门管件", status: "已发布", descLen: 290, updateTime: "2026-07-12", views: 175 },
  { id: "1529185917308903433", name: "止回阀 H44H-16 升降式",          category: "阀门管件", status: "已发布", descLen: 22,  updateTime: "2026-07-11", views: 44  },
];

const CATEGORIES = ["全部分类", "阀门管件", "控制阀", "安全阀", "管道附件", "农业机械"];
const BAD_THRESHOLD = 100;

function qualityTag(len) {
  if (len === 0)         return { label: "描述为空", color: "#ff4d4f", bg: "#fff1f0" };
  if (len < BAD_THRESHOLD) return { label: `仅 ${len} 字`, color: "#fa8c16", bg: "#fff7e6" };
  return { label: "内容完善", color: "#52c41a", bg: "#f6ffed" };
}

export default function ProductListPage({ onEditProduct }) {
  const [selectedCategory, setSelectedCategory] = useState("全部分类");
  const [filterBad, setFilterBad]               = useState(false);
  const [keyword, setKeyword]                   = useState("");
  const [selected, setSelected]                 = useState([]);

  const filtered = MOCK_PRODUCTS.filter((p) => {
    if (selectedCategory !== "全部分类" && p.category !== selectedCategory) return false;
    if (filterBad && p.descLen >= BAD_THRESHOLD) return false;
    if (keyword && !p.name.includes(keyword)) return false;
    return true;
  });

  const allChecked = filtered.length > 0 && filtered.every((p) => selected.includes(p.id));

  function toggleAll() {
    if (allChecked) setSelected([]);
    else setSelected(filtered.map((p) => p.id));
  }

  function toggleOne(id) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  const badCount = MOCK_PRODUCTS.filter((p) => p.descLen < BAD_THRESHOLD).length;

  return (
    <div style={css.page}>
      {/* 页头 */}
      <div style={css.header}>
        <div>
          <span style={css.title}>产品管理</span>
          <span style={css.subtitle}>共 {MOCK_PRODUCTS.length} 个产品，其中 <span style={{ color: "#fa8c16", fontWeight: 600 }}>{badCount}</span> 个详情内容不完善</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={css.btnDefault} onClick={() => { setFilterBad(false); setKeyword(""); setSelectedCategory("全部分类"); }}>
            重置筛选
          </button>
          <button
            style={{ ...css.btnPrimary, opacity: selected.length === 0 ? 0.5 : 1 }}
            disabled={selected.length === 0}
            onClick={() => alert(`已选 ${selected.length} 个产品，AI批量优化（原型演示）`)}
          >
            🤖 AI 批量优化 {selected.length > 0 ? `(${selected.length})` : ""}
          </button>
          <button style={css.btnPrimary} onClick={() => onEditProduct(MOCK_PRODUCTS[0])}>
            + 新建产品
          </button>
        </div>
      </div>

      {/* 筛选栏 */}
      <div style={css.toolbar}>
        <input
          style={css.searchInput}
          placeholder="搜索产品名称…"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <select style={css.select} value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <label style={css.checkLabel}>
          <input type="checkbox" checked={filterBad} onChange={(e) => setFilterBad(e.target.checked)} />
          <span style={{ color: "#fa8c16" }}>仅看内容不完善</span>
        </label>
        {selected.length > 0 && (
          <span style={{ marginLeft: "auto", color: "#3B9FD0", fontSize: 13 }}>
            已选 {selected.length} 项
          </span>
        )}
      </div>

      {/* 表格 */}
      <div style={css.tableWrap}>
        <table style={css.table}>
          <thead>
            <tr style={css.thead}>
              <th style={{ ...css.th, width: 40 }}>
                <input type="checkbox" checked={allChecked} onChange={toggleAll} />
              </th>
              <th style={css.th}>产品名称</th>
              <th style={css.th}>分类</th>
              <th style={css.th}>内容质量</th>
              <th style={css.th}>状态</th>
              <th style={css.th}>更新时间</th>
              <th style={css.th}>浏览量</th>
              <th style={css.th}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => {
              const tag = qualityTag(p.descLen);
              const isBad = p.descLen < BAD_THRESHOLD;
              return (
                <tr key={p.id} style={{ ...css.tr, background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={css.td}>
                    <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleOne(p.id)} />
                  </td>
                  <td style={css.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {isBad && <span style={css.badDot} title="内容不完善" />}
                      <span style={{ fontWeight: 500, color: "#262626" }}>{p.name}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#8c8c8c", marginTop: 2 }}>{p.id}</div>
                  </td>
                  <td style={css.td}><span style={css.categoryTag}>{p.category}</span></td>
                  <td style={css.td}>
                    <span style={{ ...css.qualityTag, color: tag.color, background: tag.bg }}>{tag.label}</span>
                  </td>
                  <td style={css.td}>
                    <span style={{ ...css.statusTag, color: p.status === "已发布" ? "#52c41a" : "#8c8c8c", background: p.status === "已发布" ? "#f6ffed" : "#f5f5f5" }}>
                      {p.status}
                    </span>
                  </td>
                  <td style={css.td}>{p.updateTime}</td>
                  <td style={css.td}>{p.views}</td>
                  <td style={css.td}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={css.linkBtn} onClick={() => onEditProduct(p)}>编辑</button>
                      {isBad && (
                        <button style={{ ...css.linkBtn, color: "#3B9FD0", fontWeight: 600 }} onClick={() => onEditProduct(p)}>
                          AI 优化
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "40px 0", color: "#8c8c8c" }}>暂无符合条件的产品</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const css = {
  page: {
    flex: 1, display: "flex", flexDirection: "column", background: "#F5F7FA",
    minHeight: 0, overflow: "hidden",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "16px 24px 12px", background: "#fff",
    borderBottom: "1px solid #f0f0f0", flexShrink: 0,
  },
  title: { fontSize: 18, fontWeight: 700, color: "#262626", marginRight: 12 },
  subtitle: { fontSize: 13, color: "#8c8c8c" },
  btnDefault: {
    height: 34, padding: "0 16px", border: "1px solid #d9d9d9", borderRadius: 4,
    background: "#fff", color: "#595959", fontSize: 14, cursor: "pointer",
  },
  btnPrimary: {
    height: 34, padding: "0 16px", border: "none", borderRadius: 4,
    background: "#3B9FD0", color: "#fff", fontSize: 14, cursor: "pointer",
  },
  toolbar: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "10px 24px", background: "#fff",
    borderBottom: "1px solid #f0f0f0", flexShrink: 0,
  },
  searchInput: {
    height: 32, border: "1px solid #d9d9d9", borderRadius: 4,
    padding: "0 12px", fontSize: 14, outline: "none", width: 220,
  },
  select: {
    height: 32, border: "1px solid #d9d9d9", borderRadius: 4,
    padding: "0 8px", fontSize: 14, outline: "none", background: "#fff",
  },
  checkLabel: { display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" },
  tableWrap: { flex: 1, overflow: "auto", padding: "16px 24px" },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 6, overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.06)" },
  thead: { background: "#fafafa" },
  th: { padding: "12px 16px", textAlign: "left", fontSize: 13, color: "#8c8c8c", fontWeight: 500, borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" },
  tr: { transition: "background 0.1s" },
  td: { padding: "12px 16px", fontSize: 14, color: "#595959", borderBottom: "1px solid #f5f5f5", verticalAlign: "middle" },
  badDot: { width: 8, height: 8, borderRadius: "50%", background: "#fa8c16", flexShrink: 0 },
  categoryTag: { display: "inline-block", padding: "1px 8px", borderRadius: 12, background: "#E8F4FA", color: "#3B9FD0", fontSize: 12 },
  qualityTag: { display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 12 },
  statusTag: { display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 12 },
  linkBtn: { background: "none", border: "none", color: "#3B9FD0", fontSize: 13, cursor: "pointer", padding: 0 },
};
