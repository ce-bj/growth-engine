import { useEffect, useMemo, useRef, useState } from "react";
import HonorEditPage from "./HonorEditPage";
import "./site-manage.css";

const RAIL = [
  ["product", "产品管理"],
  ["content", "内容管理"],
  ["audit", "审核管理"],
  ["form", "表单管理"],
  ["seo", "SEO优化"],
  ["visual", "可视化管理"],
  ["i18n", "国际化翻译"],
  ["setting", "网站设置"],
  ["vendor", "供应商管理"],
  ["job", "招聘管理"],
  ["anti", "防伪查询"],
  ["files", "文件资料查询"],
  ["card", "数字名片"],
  ["manual", "扫码看说明书"],
  ["cert", "证书到期提醒"],
];

const CONTENT_TREE = [
  { title: "企业概况", children: ["企业概况", "投资者关系"] },
  { title: "新闻资讯", children: ["新闻资讯", "投资者互动", "工程案例", "生产基地"] },
  { title: "图册展示", children: ["图册展示"] },
  { title: "视频展示", children: ["视频展示"] },
  { title: "企业网点", children: ["网点管理", "名片管理", "门店预约"] },
  { title: "常见问题", children: ["常见问题"] },
  { title: "文件下载", children: ["文件下载", "线索收集", "密码下载"] },
  { title: "友情链接", children: ["友情链接"] },
  { title: "领导介绍", children: ["领导介绍"] },
  { title: "品牌历史", children: ["品牌历史"] },
  { title: "荣誉资质", children: ["荣誉资质"] },
  { title: "党建频道", children: ["党建频道"] },
  { title: "采购招标", children: ["采购招标", "申请信息"] },
];

const PRODUCT_TREE = ["产品列表", "分类管理", "属性模板", "标记管理", "品牌管理", "筛选管理", "橱窗管理"];

const HONORS = [
  ["(CNAS)实验室", "2025-09-04 17:22:11", "企业资质"],
  ["高新技术企业证书", "2024-11-05 11:12:46", "企业荣誉"],
  ["国家知识产权优势企业", "2024-11-05 11:12:20", "企业荣誉"],
  ["AAA级信用企业", "2024-11-05 11:11:58", "企业荣誉"],
  ["我最喜爱的湖北品牌银奖", "2024-11-05 11:10:54", "企业荣誉"],
  ["副理事长单位", "2024-11-05 11:10:23", "企业荣誉"],
  ["中小企业技术中心", "2024-11-05 11:10:13", "企业荣誉"],
  ["一种检测聚氯乙烯或氯化聚氯乙烯熔合度的方法--佛山顾地塑胶有限公司", "2024-09-28 14:26:08", "企业专利"],
  ["一种高强度的模压塑料管材", "2024-09-28 14:25:54", "企业专利"],
  ["一种超韧硬质聚氯乙烯管材配料的制备方法", "2024-09-28 14:25:30", "企业专利"],
];

const NAME_LABEL = {
  荣誉资质: "荣誉名称",
  新闻资讯: "新闻标题",
  图册展示: "图册名称",
  视频展示: "视频名称",
  常见问题: "问题",
  文件下载: "文件名称",
  领导介绍: "姓名",
  友情链接: "链接名称",
};

function RailIcon({ name }) {
  const props = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.7",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
  if (name === "product") {
    return (
      <svg {...props}>
        <path d="M4 7h16v12H4z" />
        <path d="M8 7V5h8v2M8 12h8" />
      </svg>
    );
  }
  if (name === "content") {
    return (
      <svg {...props}>
        <path d="M6 4h9l3 3v13H6z" />
        <path d="M15 4v3h3M8 12h8M8 16h6" />
      </svg>
    );
  }
  if (name === "audit") {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="8" />
        <path d="M8.5 12.5l2.2 2.2 4.8-5" />
      </svg>
    );
  }
  if (name === "form") {
    return (
      <svg {...props}>
        <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
      </svg>
    );
  }
  if (name === "seo") {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="7" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      </svg>
    );
  }
  if (name === "visual") {
    return (
      <svg {...props}>
        <path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" />
      </svg>
    );
  }
  if (name === "i18n") {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="8" />
        <path d="M4 12h16M12 4c2.5 2.8 2.5 13.2 0 16M12 4c-2.5 2.8-2.5 13.2 0 16" />
      </svg>
    );
  }
  if (name === "setting") {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
      </svg>
    );
  }
  if (name === "vendor") {
    return (
      <svg {...props}>
        <circle cx="12" cy="8" r="3" />
        <path d="M5 19c1.2-3 3.4-4.5 7-4.5S17.8 16 19 19" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <path d="M7 3h8l4 4v14H7z" />
      <path d="M15 3v4h4" />
    </svg>
  );
}

function Caret({ open }) {
  return (
    <svg className={`sms-caret${open ? " is-open" : ""}`} viewBox="0 0 12 12" aria-hidden>
      <path d="M2.2 4.2 6 8l3.8-3.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function findGroup(name) {
  return CONTENT_TREE.find((group) => group.children.includes(name))?.title || name;
}

export default function SiteManageShell({ editing, onExitEdit, productList, productEdit }) {
  const [lang, setLang] = useState("zh");
  const [rail, setRail] = useState("content");
  const [opened, setOpened] = useState({ 荣誉资质: true });
  const [contentKey, setContentKey] = useState("荣誉资质");
  const [productKey, setProductKey] = useState("产品列表");
  const [keyword, setKeyword] = useState("");
  const [sortDir, setSortDir] = useState("desc");
  const [menu, setMenu] = useState(null);
  const [honor, setHonor] = useState(null);
  const [dockOn, setDockOn] = useState(true);
  const [atTop, setAtTop] = useState(true);
  const stageRef = useRef(null);
  const railNow = editing ? "product" : rail;
  const productNow = editing ? "产品列表" : productKey;

  useEffect(() => {
    const close = () => setMenu(null);
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, []);

  const showProductPage = !editing && railNow === "product" && productNow === "产品列表";
  const railLabel = RAIL.find((item) => item[0] === railNow)?.[1] || "内容管理";

  const rows = useMemo(() => {
    if (contentKey !== "荣誉资质") return [];
    const list = HONORS.filter((row) => !keyword || row[0].includes(keyword));
    return [...list].sort((a, b) => (sortDir === "desc" ? b[1].localeCompare(a[1]) : a[1].localeCompare(b[1])));
  }, [contentKey, keyword, sortDir]);

  const crumb = railNow === "product"
    ? ["首页", "网站管理", "数字门户全球营销版", "产品管理", productNow]
    : railNow === "content"
      ? ["首页", "网站管理", "数字门户全球营销版", "内容管理", findGroup(contentKey), contentKey]
      : ["首页", "网站管理", "数字门户全球营销版", railLabel];
  const pageTitle = railNow === "content" ? contentKey : railNow === "product" ? productNow : railLabel;

  function scrollContentTop() {
    const root = stageRef.current;
    if (!root) return;
    const nodes = [root, ...root.querySelectorAll("*")];
    const scroller = nodes.find((el) => el.scrollHeight > el.clientHeight + 8);
    (scroller || root).scrollTo({ top: 0, behavior: "smooth" });
    setAtTop(true);
  }
  const nameLabel = NAME_LABEL[contentKey] || "名称";

  function pickRail(id) {
    setMenu(null);
    setKeyword("");
    setHonor(null);
    if (id === "product") {
      setRail("product");
      setProductKey("产品列表");
      onExitEdit();
      return;
    }
    onExitEdit();
    setRail(id);
  }

  function pickContent(name) {
    setContentKey(name);
    setKeyword("");
    setMenu(null);
    setHonor(null);
    onExitEdit();
  }

  function pickProduct(name) {
    setProductKey(name);
    setKeyword("");
    setMenu(null);
    setHonor(null);
    onExitEdit();
  }

  return (
    <div className="sms">
      {!honor && <aside className="sms-aside" aria-label="网站管理导航">
        <div className="sms-rail">
          <div className="sms-lang">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
              {lang === "zh" ? (
                <>
                  <rect width="16" height="16" rx="1" fill="#de2910" />
                  <path fill="#ffde00" d="M3.2 1.6 3.7 3l1.4.1-1.1.9.4 1.4-1.2-.8-1.2.8.4-1.4-1.1-.9 1.4-.1z" />
                </>
              ) : (
                <>
                  <rect width="16" height="16" fill="#012169" />
                  <path stroke="#fff" strokeWidth="3" d="M0 0l16 16M16 0 0 16" />
                  <path stroke="#c8102e" strokeWidth="1.4" d="M0 0l16 16M16 0 0 16" />
                  <path stroke="#fff" strokeWidth="4" d="M8 0v16M0 8h16" />
                  <path stroke="#c8102e" strokeWidth="2" d="M8 0v16M0 8h16" />
                </>
              )}
            </svg>
            <span>{lang === "zh" ? "中文简体" : "英文"}</span>
            <button type="button" aria-label="切换语言" onClick={() => setLang((v) => (v === "zh" ? "en" : "zh"))}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M2 5h8l-2-2M12 9H4l2 2" />
              </svg>
            </button>
          </div>
          <div className="sms-rail-list">
            {RAIL.map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`sms-rail-item${railNow === id ? " is-on" : ""}`}
                onClick={() => pickRail(id)}
              >
                <RailIcon name={id} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {railNow === "content" && (
          <nav className="sms-tree" aria-label="内容管理">
            {CONTENT_TREE.map((group) => {
              const open = !!opened[group.title];
              return (
                <div key={group.title}>
                  <button
                    type="button"
                    className="sms-sub"
                    aria-expanded={open}
                    onClick={() => setOpened((prev) => ({ ...prev, [group.title]: !prev[group.title] }))}
                  >
                    <span>{group.title}</span>
                    <Caret open={open} />
                  </button>
                  {open && group.children.map((child) => (
                    <button
                      key={child}
                      type="button"
                      className={`sms-leaf${contentKey === child ? " is-on" : ""}`}
                      onClick={() => pickContent(child)}
                    >
                      {child}
                    </button>
                  ))}
                </div>
              );
            })}
          </nav>
        )}

        {railNow === "product" && (
          <nav className="sms-tree" aria-label="产品管理">
            {PRODUCT_TREE.map((item) => (
              <button
                key={item}
                type="button"
                className={`sms-leaf${productNow === item ? " is-on" : ""}`}
                style={{ paddingLeft: 20 }}
                onClick={() => pickProduct(item)}
              >
                {item}
              </button>
            ))}
          </nav>
        )}
      </aside>}

      <section className="sms-main">
        {!honor && <div className="sms-crumb">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" />
          </svg>
          {crumb.map((item, index) => (
            <span key={`${item}-${index}`}>
              {index > 0 && <span className="sms-sep">›</span>}
              {index === crumb.length - 1 ? <b>{item}</b> : item}
            </span>
          ))}
        </div>}

        <div className="sms-stage" ref={stageRef}>
          {honor ? (
            <HonorEditPage record={honor} onBack={() => setHonor(null)} />
          ) : editing ? productEdit : showProductPage ? productList : (
            <div className="sms-panel">
              <div className="sms-head">
                <h1 className="sms-title">{pageTitle}</h1>
                <label className="sms-search">
                  <input
                    value={keyword}
                    placeholder="请输入关键词"
                    onChange={(event) => setKeyword(event.target.value)}
                  />
                  <button type="button" aria-label="搜索">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="6" />
                      <path d="M16 16l5 5" />
                    </svg>
                  </button>
                </label>
              </div>
              <div className="sms-tools">
                <div className="sms-tool-line">
                  <div className="sms-split" onMouseDown={(event) => event.stopPropagation()}>
                    <button type="button" className="sms-btn-add">添 加</button>
                    <button
                      type="button"
                      className="sms-btn-caret"
                      aria-label="更多添加方式"
                      onClick={() => setMenu(menu === "add" ? null : "add")}
                    >
                      <Caret open={menu === "add"} />
                    </button>
                    {menu === "add" && (
                      <div className="sms-menu">
                        <button type="button">批量添加</button>
                      </div>
                    )}
                  </div>
                  <button type="button" className="sms-btn">分类管理</button>
                  <button type="button" className="sms-btn">回收站</button>
                </div>
                <div className="sms-tool-line">
                  <button type="button" className="sms-btn">排序</button>
                  <div className="sms-split" onMouseDown={(event) => event.stopPropagation()}>
                    <button type="button" className="sms-btn" onClick={() => setMenu(menu === "ops" ? null : "ops")}>
                      更多操作
                      <Caret open={menu === "ops"} />
                    </button>
                    {menu === "ops" && (
                      <div className="sms-menu">
                        <button type="button">批量发布</button>
                        <button type="button">批量删除</button>
                        <button type="button">导出</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div
                className="sms-table-wrap"
                onScroll={(event) => setAtTop(event.currentTarget.scrollTop < 8)}
              >
                <table className="sms-table">
                  <thead>
                    <tr>
                      <th style={{ width: 42 }}>
                        <input type="checkbox" aria-label="全选" />
                      </th>
                      <th style={{ width: 110 }}>发布状态</th>
                      <th>
                        <button type="button" className="sms-sort" onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}>
                          {railNow === "content" ? nameLabel : "名称"}
                          <Caret open={sortDir === "asc"} />
                        </button>
                      </th>
                      <th style={{ width: 180 }}>发布时间</th>
                      <th style={{ width: 120 }}>分类</th>
                      <th style={{ width: 120 }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 && (
                      <tr>
                        <td className="sms-empty" colSpan={6}>暂无数据</td>
                      </tr>
                    )}
                    {rows.map((row) => (
                      <tr key={row[0]}>
                        <td><input type="checkbox" aria-label={`选择${row[0]}`} /></td>
                        <td><span className="sms-tag">已发布</span></td>
                        <td>{row[0]}</td>
                        <td>{row[1]}</td>
                        <td>{row[2]}</td>
                        <td>
                          <div className="sms-op" onMouseDown={(event) => event.stopPropagation()}>
                            <button
                              type="button"
                              className="sms-link"
                              onClick={() => setHonor({ name: row[0], time: row[1], category: row[2] })}
                            >
                              编辑
                            </button>
                            <span className="sms-gap">|</span>
                            <button
                              type="button"
                              className="sms-link"
                              onClick={() => setMenu(menu === row[0] ? null : row[0])}
                            >
                              更多
                            </button>
                            {menu === row[0] && (
                              <div className="sms-menu" style={{ right: 0, left: "auto", top: 28 }}>
                                <button type="button">浏览</button>
                                <button type="button">撤销发布</button>
                                <button type="button">定时撤销</button>
                                <button type="button">转移</button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      {dockOn ? (
        <div className="sms-dock">
          <div className="sms-dock-avatar" aria-hidden>
            <svg width="28" height="28" viewBox="0 0 28 28">
              <circle cx="14" cy="11" r="5" fill="#ffe0c2" />
              <path d="M6 26c1.2-6 4-8 8-8s6.8 2 8 8" fill="#1f6feb" />
            </svg>
            <span>运营助手</span>
          </div>
          <div className="sms-dock-card">
            <div className="sms-badge">99+</div>
            <button type="button">业务</button>
            <button type="button">帮助</button>
            <button
              type="button"
              className={atTop ? "sms-dock-muted" : ""}
              onClick={scrollContentTop}
            >
              {atTop ? "不回顶" : "回顶"}
            </button>
            <button type="button" aria-label="收起侧栏" onClick={() => setDockOn(false)}>›</button>
          </div>
        </div>
      ) : (
        <button type="button" className="sms-dock-tab" aria-label="展开运营助手" onClick={() => setDockOn(true)}>‹</button>
      )}
    </div>
  );
}
