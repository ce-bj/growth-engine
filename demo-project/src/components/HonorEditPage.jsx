import { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState } from "react";
import "./honor-edit.css";

const HONOR_IMAGE = "/images/honor-cnas.png";

const CNAS = {
  name: "(CNAS)实验室",
  time: "2025-09-04 17:22:11",
  category: "企业资质",
  views: "0",
  realViews: 153,
  summary: "",
  url: "/honor_detail/1.html",
  rows: [
    ["资质名称", "实验室认可证书（CNAS）"],
    ["信源类别", "企业资质"],
    ["证书编号", "CNAS L12279"],
    ["获证组织", "顾地科技股份有限公司实验室"],
    ["发证机构", "中国合格评定国家认可委员会（CNAS）"],
    ["认证依据", "ISO/IEC 17025:2017《检测和校准实验室能力的通用要求》（CNAS-CL01）"],
    ["签发日期", "2024-11-26"],
    ["有效期至", "2030-11-25"],
    ["认证/认可范围", "证书附件所列检测与校准服务能力"],
    ["信息来源页", "https://www.goody.com.cn/honor_list/1839915515598487552.html"],
  ],
  source: "https://www.goody.com.cn/honor_list/1839915515598487552.html",
};

const ALT_SOURCE = "https://www.goody.com.cn/honor_list/1839915515598488000.html";
const DETAIL_NOTE = {
  cnas: {
    source: CNAS.source,
    lines: [
      ["https://www.cnas.org.cn/", "中国合格评定国家认可委员会（CNAS）官网", "在线服务 → 信息查询 → 检测和校准实验室；按“顾地科技股份有限公司实验室”或注册号 CNAS L12279 查询"],
      ["https://www.cnas.org.cn/fzlm/zxfw/index.html", "CNAS 在线服务（信息查询入口）", "证书自带查询指引：有效性可在 CNAS 获认可机构名录中查询"],
    ],
  },
  alt: {
    source: ALT_SOURCE,
    lines: [
      ["https://www.innocom.gov.cn/", "高新技术企业认定管理工作网", "按证书编号 GR202442001234 或企业名称“顾地科技股份有限公司”查询"],
      ["https://www.innocom.gov.cn/", "全国高新技术企业认定管理工作领导小组办公室", "证书有效性以认定管理工作网公示结果为准"],
    ],
  },
};

const ALT_ROWS = [
  ["资质名称", "高新技术企业证书"],
  ["信源类别", "企业荣誉"],
  ["证书编号", "GR202442001234"],
  ["获证组织", "顾地科技股份有限公司"],
  ["发证机构", "湖北省科学技术厅、湖北省财政厅、国家税务总局湖北省税务局"],
  ["认证依据", "《高新技术企业认定管理办法》"],
  ["签发日期", "2024-11-05"],
  ["有效期至", "2027-11-04"],
  ["认证/认可范围", "塑料管道及相关制品的研发与生产"],
  ["信息来源页", ALT_SOURCE],
];

const TABS = [
  ["setting", "设置"],
  ["seo", "SEO"],
  ["tag", "标签"],
  ["related", "相关"],
];

const CK_GROUPS = [
  [
    { id: "undo", title: "撤销" },
    { id: "redo", title: "重做" },
  ],
  [
    { id: "find", title: "查找" },
    { id: "brush", title: "格式刷", split: true },
    { id: "clear", title: "删除格式" },
  ],
  [
    { id: "style", title: "样式", text: "样式", drop: true },
    { id: "heading", title: "标题", text: "标题", drop: true },
    { id: "font", title: "字体", drop: true },
    { id: "size", title: "字号", drop: true },
  ],
  [
    { id: "bold", title: "加粗", on: true },
    { id: "italic", title: "斜体" },
    { id: "underline", title: "下划线" },
    { id: "color", title: "颜色", drop: true },
    { id: "effect", title: "效果字", drop: true },
    { id: "line", title: "行高", drop: true },
    { id: "align", title: "对齐", drop: true },
  ],
  [
    { id: "ul", title: "无序列表", split: true },
    { id: "ol", title: "有序列表", split: true },
    { id: "indent", title: "段落缩进", drop: true },
  ],
  [
    { id: "image", title: "插入图片" },
    { id: "imgtxt", title: "插入图文" },
    { id: "imggroup", title: "插入图组" },
    { id: "video", title: "插入视频" },
    { id: "table", title: "插入表格", drop: true },
    { id: "doc", title: "插入文档" },
    { id: "product", title: "插入产品" },
    { id: "symbol", title: "符号", drop: true },
  ],
  [
    { id: "quote", title: "引用" },
    { id: "code", title: "code", split: true },
    { id: "hr", title: "分割线" },
    { id: "link", title: "链接" },
    { id: "anchor", title: "添加锚点", drop: true },
  ],
  [
    { id: "tpl", title: "模板库", drop: true },
    { id: "layout", title: "排版", drop: true },
    { id: "beauty", title: "美化", text: "美化" },
    { id: "source", title: "源码", text: "源码" },
    { id: "preview", title: "预览" },
    { id: "aiwrite", title: "AI写作", text: "AI写作" },
    { id: "aiask", title: "提问AI", text: "提问AI" },
  ],
];

const SEO_CHIPS = ["网站名称", "主营行业", "主营产品", "主营业务介绍", "经营模式", "标题", "默认参数", "seo优化参数"];
const EXTRACT_TIP = "从当前荣誉图片提取结构化字段，写入下方详情";
const EXTRACTED_TIP = "当前图片已提取。更换图片后可再次提取，新内容加在详情顶部，不覆盖已有内容";

function Spark() {
  return (
    <svg className="hedit-spark" width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <path fill="#F5B400" d="M6.1 1.1 7 4.4l3.2.9L7 6.2l-.9 3.3-.9-3.3-3.2-.9 3.2-.9z" />
      <path fill="#F8C93A" d="M12.15 6.7l.5 1.55 1.55.5-1.55.5-.5 1.55-.5-1.55-1.55-.5 1.55-.5z" />
    </svg>
  );
}

const TOOL_CMD = {
  undo: "undo",
  redo: "redo",
  bold: "bold",
  italic: "italic",
  underline: "underline",
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function detailHtml(key) {
  const rows = key === "cnas" ? CNAS.rows : ALT_ROWS;
  const note = DETAIL_NOTE[key];
  const body = rows.map(([label, value]) => {
    const cell = label === "信息来源页"
      ? `<a href="${escapeHtml(value)}" target="_blank" rel="noreferrer">${escapeHtml(value)}</a>`
      : escapeHtml(value);
    return `<tr><th>${escapeHtml(label)}</th><td>${cell}</td></tr>`;
  }).join("");
  const lines = note.lines.map(([href, label, rest]) => (
    `<div><a href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a> — ${escapeHtml(rest)}</div>`
  )).join("");
  return `<div class="hedit-block"><table class="hedit-table"><tbody>${body}</tbody></table><p class="hedit-source"><a href="${escapeHtml(note.source)}" target="_blank" rel="noreferrer">${escapeHtml(note.source)}</a></p><div class="hedit-verify"><div>证书核验入口</div>${lines}</div></div>`;
}

const EditorSurface = memo(forwardRef(function EditorSurface(_, ref) {
  const el = useRef(null);
  useImperativeHandle(ref, () => ({
    prepend(html) {
      const node = el.current;
      if (!node) return;
      node.insertAdjacentHTML("afterbegin", html);
      node.querySelector(".hedit-block")?.scrollIntoView({ block: "nearest" });
      node.classList.remove("is-flash");
      void node.offsetWidth;
      node.classList.add("is-flash");
    },
    focus() {
      el.current?.focus();
    },
    exec(command) {
      el.current?.focus();
      document.execCommand(command);
    },
  }), []);
  return (
    <div
      ref={el}
      className="hedit-canvas"
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-label="详情"
    />
  );
}), () => true);

function recordOf(row) {
  if (!row || row.name === CNAS.name) return CNAS;
  return {
    name: row.name,
    time: row.time,
    category: row.category,
    views: "0",
    realViews: 0,
    summary: "",
    url: "",
    rows: [
      ["荣誉名称", row.name],
      ["信源类别", row.category],
    ],
    source: "",
  };
}

function Icon({ name }) {
  const p = {
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
  if (name === "setting") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.07 7.07 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 2h-3.8a.5.5 0 0 0-.49.42l-.36 2.54c-.59.24-1.13.55-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.48a.5.5 0 0 0 .12.64L4.86 10.7c-.04.31-.06.63-.06.94s.02.63.06.94L2.83 14.16a.5.5 0 0 0-.12.64l1.92 3.32c.14.24.43.34.69.22l2.39-.96c.5.39 1.04.7 1.63.94l.36 2.54c.05.24.25.42.49.42h3.8c.24 0 .44-.18.49-.42l.36-2.54c.59-.24 1.13-.55 1.63-.94l2.39.96c.26.12.55.02.69-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z" />
      </svg>
    );
  }
  if (name === "seo") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
        <circle cx="11" cy="11" r="6.5" />
        <path d="M16 16l5 5" />
        <path d="M8 11h6M11 8v6" />
      </svg>
    );
  }
  if (name === "tag") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
        <path d="M3 12V4h8l10 10-8 8z" />
        <circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (name === "related") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
        <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
      </svg>
    );
  }
  const map = {
    undo: <path d="M8 8H4v4M4.5 12A8 8 0 1 0 6 6" />,
    redo: <path d="M16 8h4v4M19.5 12A8 8 0 1 1 18 6" />,
    find: <><circle cx="11" cy="11" r="6" /><path d="M16 16l5 5" /></>,
    brush: <path d="M6 20h4l9-9-4-4-9 9v4zM15 7l4 4" />,
    clear: <path d="M5 7h14M9 7V5h6v2M8 7l1 12h6l1-12" />,
    style: <path d="M5 19h14M8 16l4-12 4 12M9.5 12h5" />,
    heading: <path d="M6 5v14M18 5v14M6 12h12" />,
    font: <path d="M5 19h14M8 16l4-12 4 12" />,
    size: <path d="M4 18V8h4M14 18V6h6" />,
    bold: <path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zm0 7h7a3.5 3.5 0 0 1 0 7H7z" />,
    italic: <path d="M10 5h8M6 19h8M14 5l-4 14" />,
    underline: <path d="M7 5v8a5 5 0 0 0 10 0V5M5 21h14" />,
    color: <path d="M12 4l6 12H6zM5 20h14" />,
    effect: <path d="M4 18h16M8 14l4-10 4 10" />,
    line: <path d="M4 7h16M4 12h16M4 17h10" />,
    align: <path d="M4 7h16M6 12h12M4 17h16" />,
    ul: <path d="M9 7h11M9 12h11M9 17h11M5 7h.01M5 12h.01M5 17h.01" />,
    ol: <path d="M9 7h11M9 12h11M9 17h11M4 7h2M4 12h2M4 17h2" />,
    indent: <path d="M4 7h16M10 12h10M4 17h16M4 10l3 2-3 2" />,
    image: <><rect x="4" y="6" width="16" height="12" rx="1" /><circle cx="9" cy="11" r="1.4" /><path d="M4 16l5-4 4 3 3-2 4 3" /></>,
    imgtxt: <><rect x="4" y="6" width="7" height="12" /><path d="M13 8h7M13 12h7M13 16h5" /></>,
    imggroup: <><rect x="6" y="8" width="12" height="10" /><rect x="9" y="5" width="12" height="10" /></>,
    video: <><rect x="4" y="7" width="12" height="10" rx="1" /><path d="M16 10l5-2v8l-5-2z" /></>,
    table: <path d="M4 6h16v12H4zM4 10h16M4 14h16M10 6v12M16 6v12" />,
    doc: <path d="M7 4h7l5 5v11H7zM14 4v5h5" />,
    product: <path d="M4 8h16v11H4zM8 8V6h8v2" />,
    symbol: <path d="M8 8h8M8 16h8M10 4l-2 16M16 4l-2 16" />,
    quote: <path d="M7 11h4v6H5v-4c0-3 2-6 5-7M17 11h4v6h-6v-4c0-3 2-6 5-7" />,
    code: <path d="M8 8l-4 4 4 4M16 8l4 4-4 4" />,
    hr: <path d="M4 12h16" />,
    link: <path d="M9 12a4 4 0 0 1 0-6l2-2a4 4 0 0 1 6 6l-1 1M15 12a4 4 0 0 1 0 6l-2 2a4 4 0 0 1-6-6l1-1" />,
    anchor: <path d="M12 4v16M8 9a4 4 0 1 0 8 0M5 16c2 3 4 4 7 4s5-1 7-4" />,
    tpl: <path d="M5 5h6v6H5zM13 5h6v6h-6zM5 13h6v6H5zM13 13h6v6h-6z" />,
    layout: <path d="M4 5h16v14H4zM10 5v14M4 12h16" />,
    beauty: <path d="M12 3l2 6 6 1-4.5 4 1.5 6L12 17l-5 3 1.5-6L4 10l6-1z" />,
    source: <path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13 6l-2 12" />,
    preview: <><circle cx="12" cy="12" r="3" /><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" /></>,
    aiwrite: <path d="M5 19l4-1 9-9-3-3-9 9-1 4zM14 7l3 3" />,
    aiask: <path d="M9 18h6M8 22h8M12 2a6 6 0 0 1 3 11c-.8.5-1 1.2-1 2H10c0-.8-.2-1.5-1-2A6 6 0 0 1 12 2z" />,
  };
  return <svg {...p}>{map[name] || <circle cx="12" cy="12" r="3" />}</svg>;
}

function Radio({ checked, children, onChange }) {
  return (
    <label className={checked ? "is-on" : ""}>
      <input type="radio" checked={checked} onChange={onChange} />
      <i className="hedit-dot" />
      {children}
    </label>
  );
}

function SettingPanel({ data, visible, setVisible, time, setTime, views, setViews, access, setAccess }) {
  return (
    <>
      <div className="hedit-switch-row">
        <span>在网站中显示</span>
        <button
          type="button"
          className={`hedit-switch${visible ? "" : " is-off"}`}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
        >
          <i />
        </button>
      </div>

      <div className="hedit-field">
        <label>发布时间</label>
        <div className="hedit-date">
          <svg className="hedit-clock" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="8" />
            <path d="M12 8v5l3 2" />
          </svg>
          <input className="hedit-input" value={time} placeholder="立即发布" onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>

      <div className="hedit-field">
        <label>访问量初始值</label>
        <div className="hedit-views">
          <input className="hedit-input" value={views} placeholder="请输入内容" onChange={(e) => setViews(e.target.value)} />
          <span className="hedit-real">真实访问量:{data.realViews}</span>
        </div>
      </div>

      <div className="hedit-field">
        <label>详情展示页面</label>
        <div className="hedit-page-row">
          <span>PC站</span>
          <div className="hedit-select">
            <select defaultValue="">
              <option value="">请选择PC站展示页面</option>
              <option>资质荣誉详情</option>
            </select>
            <svg className="caret" viewBox="0 0 12 12">
              <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </div>
        </div>
      </div>

      <div className="hedit-field">
        <div className="hedit-label">访问权限</div>
        <p className="hedit-hint-gray">以下访客可以查看此内容</p>
        <div className="hedit-radio">
          <Radio checked={access === "all"} onChange={() => setAccess("all")}>全部访客</Radio>
          <Radio checked={access === "some"} onChange={() => setAccess("some")}>指定访客</Radio>
        </div>
        {access === "some" && (
          <div className="hedit-members">
            <label><input type="checkbox" defaultChecked /> 全选</label>
            <label><input type="checkbox" defaultChecked /> 普通会员</label>
          </div>
        )}
      </div>
    </>
  );
}

function SeoPanel({ url }) {
  return (
    <>
      <div className="hedit-field">
        <label>自定义URL</label>
        <div className="hedit-url-row">
          <input className="hedit-input" disabled value={url} placeholder="数据保存后自动生成访问地址" />
          <button type="button" aria-label="编辑URL">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M4 20h4l11-11-4-4L4 16v4z" />
            </svg>
          </button>
        </div>
        <p className="hedit-warn">改变该URL将导致原地址无法访问，请谨慎操作。</p>
        <div className="hedit-alert">
          如果你不是专业人员建议使用默认规则，谨慎操作，点击<a href="#restore">恢复默认</a>链接将恢复默认规则！站内页面如果没有SEO信息则继承首页SEO设置的信息。
        </div>
      </div>
      <div className="hedit-label">优化规则:</div>
      <div className="hedit-rule">
        <b style={{ fontWeight: 400 }}>通用规则</b>
        <button type="button" className="hedit-switch is-off" aria-label="自定义规则">
          <i />
        </button>
        <span>自定义规则</span>
      </div>
      <div className="hedit-label">标题（title）</div>
      <div className="hedit-seo-box">
        <span className="hedit-seo-tag">标题</span>
        <span className="hedit-seo-sign">-</span>
        <span className="hedit-seo-tag">网站名称</span>
      </div>
      <div className="hedit-label">关键词（Keywords）</div>
      <div className="hedit-seo-box">
        <span className="hedit-seo-tag">主营产品</span>
      </div>
      <div className="hedit-label">描述（Description）</div>
      <div className="hedit-desc-box">&lt;(网站名称)&gt;&lt;(主营业务介绍)&gt;</div>
      <div className="hedit-chips">
        {SEO_CHIPS.map((item) => (
          <button type="button" key={item}>+{item}</button>
        ))}
      </div>
    </>
  );
}

function TagPanel() {
  return (
    <>
      <div className="hedit-tag-box">
        <p>已选标签</p>
        <p className="sub">点击下方按钮添加标签</p>
      </div>
      <div className="hedit-tag-acts">
        <button type="button">添加标签</button>
        <button type="button">获取推荐标签</button>
      </div>
      <div className="hedit-muted">暂无系统推荐标签</div>
    </>
  );
}

export default function HonorEditPage({ record, onBack }) {
  const data = recordOf(record);
  const [tab, setTab] = useState("setting");
  const [fold, setFold] = useState(false);
  const [visible, setVisible] = useState(true);
  const [time, setTime] = useState(data.time);
  const [views, setViews] = useState(data.views);
  const [access, setAccess] = useState("all");
  const [name, setName] = useState(data.name);
  const [summary, setSummary] = useState(data.summary);
  const [cat, setCat] = useState(data.category);
  const [imageSrc, setImageSrc] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(false);
  const [dockOn, setDockOn] = useState(true);
  const extractTimer = useRef(0);
  const busyRef = useRef(false);
  const fileRef = useRef(null);
  const editorRef = useRef(null);
  const preview = imageSrc;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(extractTimer.current);
    };
  }, []);

  function replaceImage(next) {
    setImageSrc((prev) => {
      if (prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return next;
    });
    setExtracted(false);
  }

  function onSwitchFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || busyRef.current) return;
    replaceImage(URL.createObjectURL(file));
  }

  function extractFromImage() {
    if (!preview || busyRef.current || extracted) return;
    busyRef.current = true;
    window.clearTimeout(extractTimer.current);
    setExtracting(true);
    extractTimer.current = window.setTimeout(() => {
      const key = preview === HONOR_IMAGE ? "cnas" : "alt";
      busyRef.current = false;
      editorRef.current?.prepend(detailHtml(key));
      setExtracting(false);
      setExtracted(true);
    }, 7000);
  }

  function removeImage() {
    if (busyRef.current) return;
    window.clearTimeout(extractTimer.current);
    setExtracting(false);
    setExtracted(false);
    setImageSrc((prev) => {
      if (prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return "";
    });
  }

  return (
    <div className="hedit">
      <header className="hedit-top">
        <button type="button" className="hedit-back" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M10 3L5 8l5 5" />
          </svg>
          返回
        </button>
        <h1><em>编辑</em> 数据</h1>
      </header>

      <div className="hedit-body">
        <aside className={`hedit-side${fold ? " is-fold" : ""}`}>
          <nav className="hedit-tabs" aria-label="编辑侧栏">
            {TABS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`hedit-tab${tab === id ? " is-on" : ""}`}
                onClick={() => { setTab(id); setFold(false); }}
              >
                <Icon name={id} />
                {label}
              </button>
            ))}
          </nav>
          <div className="hedit-set">
            {tab === "setting" && (
              <SettingPanel
                data={data}
                visible={visible}
                setVisible={setVisible}
                time={time}
                setTime={setTime}
                views={views}
                setViews={setViews}
                access={access}
                setAccess={setAccess}
              />
            )}
            {tab === "seo" && <SeoPanel url={data.url} />}
            {tab === "tag" && <TagPanel />}
            {tab === "related" && <div className="hedit-empty">暂无数据</div>}
          </div>
          <button type="button" className="hedit-fold" aria-label="折叠侧栏" onClick={() => setFold((v) => !v)}>
            {fold ? "›" : "‹"}
          </button>
        </aside>

        <section className="hedit-main">
          <div className="hedit-row">
            <div className="hedit-k">分类</div>
            <div className="hedit-v hedit-cat">
              <div className="hedit-tree">
                {cat ? (
                  <span className="hedit-chip">
                    {cat}
                    <button type="button" aria-label="移除分类" onClick={() => setCat("")}>×</button>
                  </span>
                ) : (
                  <span style={{ color: "#c0c4cc", fontSize: 13 }}>选择分类</span>
                )}
              </div>
              <button type="button" className="hedit-add-cat">新增分类</button>
            </div>
          </div>

          <div className="hedit-row">
            <div className="hedit-k is-req">荣誉名称</div>
            <div className="hedit-v hedit-name-row">
              <input className="hedit-input" value={name} onChange={(e) => setName(e.target.value)} />
              <button type="button" className="hedit-ai-title">AI标题优化</button>
            </div>
          </div>

          <div className="hedit-row">
            <div className="hedit-k">荣誉概要</div>
            <div className="hedit-v">
              <textarea className="hedit-summary" value={summary} onChange={(e) => setSummary(e.target.value)} />
            </div>
          </div>

          <div className="hedit-row">
            <div className="hedit-k">荣誉图片</div>
            <div className="hedit-v">
              <div className={`hedit-photo-box${preview ? "" : " is-empty"}`}>
                {preview ? (
                  <>
                    <div className={`hedit-thumb${extracting ? " is-busy" : ""}`}>
                      <img src={preview} alt="荣誉图片" />
                      {extracting && (
                        <div className="hedit-thumb-mask" aria-hidden>
                          <svg className="hedit-anticon hedit-anticon-lg" viewBox="0 0 1024 1024">
                            <path d="M988 548c-19.9 0-36-16.1-36-36 0-59.4-11.6-117-34.6-171.3a440.45 440.45 0 00-94.3-139.9 437.71 437.71 0 00-139.9-94.3C629 83.6 571.4 72 512 72c-19.9 0-36-16.1-36-36s16.1-36 36-36c69.1 0 136.2 13.5 199.3 40.3C772.3 66 827 103 874 150c47 47 83.9 101.8 109.7 162.7 26.7 63.1 40.2 130.2 40.2 199.3.1 19.9-16 36-35.9 36z" />
                          </svg>
                        </div>
                      )}
                      <div className="hedit-thumb-hover">
                        <button type="button" aria-label="切换图片" onClick={() => fileRef.current?.click()}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M8 7h8M8 12h8M8 17h8" />
                          </svg>
                        </button>
                        <button type="button" aria-label="删除图片" onClick={removeImage}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M5 7h14M9 7V5h6v2M8 7l1 12h6l1-12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <span className="hedit-ai-tip" data-tip={extracting ? "" : extracted ? EXTRACTED_TIP : EXTRACT_TIP}>
                    <button
                      type="button"
                      className={`hedit-ai-extract${extracting ? " is-busy" : ""}${extracted ? " is-done" : ""}`}
                      disabled={extracting || extracted}
                      onClick={extractFromImage}
                    >
                      {extracted ? (
                        <>
                          <Spark />
                          已提取
                        </>
                      ) : extracting ? (
                        <>
                          <svg className="hedit-anticon" viewBox="0 0 1024 1024" aria-hidden>
                            <path d="M988 548c-19.9 0-36-16.1-36-36 0-59.4-11.6-117-34.6-171.3a440.45 440.45 0 00-94.3-139.9 437.71 437.71 0 00-139.9-94.3C629 83.6 571.4 72 512 72c-19.9 0-36-16.1-36-36s16.1-36 36-36c69.1 0 136.2 13.5 199.3 40.3C772.3 66 827 103 874 150c47 47 83.9 101.8 109.7 162.7 26.7 63.1 40.2 130.2 40.2 199.3.1 19.9-16 36-35.9 36z" />
                          </svg>
                          正在提取...
                        </>
                      ) : (
                        <>
                          <Spark />
                          AI 提取
                        </>
                      )}
                    </button>
                    </span>
                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={onSwitchFile} />
                  </>
                ) : (
                  <>
                    <span className="hedit-drop-hint">可将本地文件拖到此处上传</span>
                    <button type="button" className="hedit-plus" onClick={() => replaceImage(HONOR_IMAGE)} aria-label="上传荣誉图片">
                      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
                        <path d="M11 2.5v17M2.5 11h17" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="hedit-row">
            <div className="hedit-k">详情</div>
            <div className="hedit-v">
              <div className="hedit-ed-head">
                <button type="button" className="hedit-voice">语音播报</button>
                <div className="hedit-ops">
                  <button type="button">
                    <svg width="17" height="16" viewBox="0 0 17 16" fill="none">
                      <rect x="1" y="1.5" width="15" height="11.5" rx="1.2" stroke="#8c8e91" />
                      <path d="M6.4 4l6 2.1-6 2.1V4z" fill="#8c8e91" />
                    </svg>
                    返回旧版编辑器
                  </button>
                  <button type="button">
                    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="#8c8e91" strokeWidth="1.2">
                      <rect x="2" y="3" width="13" height="11" rx="1" />
                      <path d="M2 7h13" />
                    </svg>
                    切换全览模式
                  </button>
                  <button type="button">
                    <svg width="12" height="17" viewBox="0 0 12 17" fill="none" stroke="#8c8e91" strokeWidth="1.2">
                      <rect x="1" y="1" width="10" height="15" rx="1.5" />
                      <circle cx="6" cy="13.5" r="0.8" fill="#8c8e91" stroke="none" />
                    </svg>
                    手机视图
                  </button>
                </div>
              </div>

              <div className="hedit-editor">
                <div className="hedit-ck">
                  {CK_GROUPS.map((group, gi) => (
                    <span key={gi} style={{ display: "inline-flex", alignItems: "center", flexWrap: "wrap" }}>
                      {gi > 0 && <i className="hedit-ck-sep" />}
                      {group.map((tool) => (
                        <button
                          key={tool.id}
                          type="button"
                          className={`hedit-ck-btn${tool.on ? " is-on" : ""}`}
                          title={tool.title}
                          onMouseDown={(event) => {
                            const command = TOOL_CMD[tool.id];
                            if (!command) return;
                            event.preventDefault();
                            editorRef.current?.exec(command);
                          }}
                        >
                          {tool.text ? <span>{tool.text}</span> : <Icon name={tool.id} />}
                          {tool.drop || tool.split ? <b className="caret" /> : null}
                        </button>
                      ))}
                    </span>
                  ))}
                </div>
                <EditorSurface ref={editorRef} />
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className="hedit-foot">
        <button type="button" className="hedit-btn" onClick={onBack}>取消</button>
        <button
          type="button"
          className="hedit-btn plain"
          onClick={() => data.source && window.open(data.source, "_blank", "noopener")}
        >
          预览
        </button>
        <button type="button" className="hedit-btn primary">保存</button>
      </footer>

      {dockOn ? (
        <div className="hedit-dock">
          <div className="hedit-dock-avatar" aria-hidden>
            <svg width="28" height="28" viewBox="0 0 28 28">
              <circle cx="14" cy="11" r="5" fill="#ffe0c2" />
              <path d="M6 26c1.2-6 4-8 8-8s6.8 2 8 8" fill="#1f6feb" />
            </svg>
            <span>运营助手</span>
          </div>
          <div className="hedit-dock-card">
            <div className="hedit-badge">99+</div>
            <button type="button">业务</button>
            <button type="button">帮助</button>
            <button type="button">回顶</button>
            <button type="button" aria-label="收起侧栏" onClick={() => setDockOn(false)}>›</button>
          </div>
        </div>
      ) : (
        <button type="button" className="hedit-fold" style={{ right: 0, top: "46%", position: "fixed", zIndex: 52, borderRadius: "6px 0 0 6px" }} onClick={() => setDockOn(true)}>‹</button>
      )}
    </div>
  );
}
