import { useRef, useState } from "react";
import "./honor-edit.css";

const HONOR_IMAGE = "/images/honor-cnas.png";

const CNAS = {
  name: "(CNAS)实验室",
  time: "2025-09-04 17:22:11",
  category: "企业资质",
  views: "0",
  realViews: 78,
  summary: "",
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

const TOOLS = ["↶", "↷", "查找", "刷", "⌫", "H", "A", "B", "I", "U", "字色", "≡", "图", "表", "符号"];
const TABS = [
  ["setting", "设置"],
  ["seo", "SEO"],
  ["tag", "标签"],
  ["related", "相关"],
];

function recordOf(row) {
  if (!row || row.name === CNAS.name) return CNAS;
  return {
    name: row.name,
    time: row.time,
    category: row.category,
    views: "0",
    realViews: 0,
    summary: "",
    rows: [
      ["荣誉名称", row.name],
      ["信源类别", row.category],
    ],
    source: "",
  };
}

export default function HonorEditPage({ record, onBack }) {
  const data = recordOf(record);
  const [tab, setTab] = useState("setting");
  const [visible, setVisible] = useState(true);
  const [time, setTime] = useState(data.time);
  const [views, setViews] = useState(data.views);
  const [access, setAccess] = useState("all");
  const [name, setName] = useState(data.name);
  const [summary, setSummary] = useState(data.summary);
  const [rows, setRows] = useState(data.rows);
  const [saved, setSaved] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractNote, setExtractNote] = useState("");
  const fileRef = useRef(null);
  const preview = uploadedUrl || (data.source ? HONOR_IMAGE : "");

  function onPickFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadedUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setExtractNote("");
    event.target.value = "";
  }

  function extractFromImage() {
    if (!uploadedUrl || extracting) return;
    setExtracting(true);
    setExtractNote("");
    window.setTimeout(() => {
      const extracted = data.name === CNAS.name ? CNAS.rows : [
        ["荣誉名称", name],
        ["信源类别", data.category],
        ["证书编号", ""],
        ["获证组织", ""],
        ["发证机构", ""],
        ["签发日期", ""],
        ["有效期至", ""],
        ["说明", "已根据上传图片提取，请核对后保存"],
      ];
      if (data.name === CNAS.name) {
        setName("实验室认可证书（CNAS）");
        setSummary("中国合格评定国家认可委员会颁发的实验室认可证书，注册号 CNAS L12279，有效期至 2030-11-25。");
      }
      setRows(extracted);
      setExtracting(false);
      setExtractNote("已从上传图片提取荣誉资质信息，并写入详情。");
    }, 700);
  }

  return (
    <div className="hedit">
      <header className="hedit-top">
        <button type="button" className="hedit-back" onClick={onBack}>
          <span aria-hidden>‹</span>
          返回
        </button>
        <h1>编辑数据</h1>
      </header>

      <div className="hedit-body">
        <aside className="hedit-side">
          <nav className="hedit-tabs" aria-label="编辑侧栏">
            {TABS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`hedit-tab${tab === id ? " is-on" : ""}`}
                onClick={() => setTab(id)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  {id === "setting" && <><circle cx="12" cy="12" r="3" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2" /></>}
                  {id === "seo" && <><circle cx="11" cy="11" r="6" /><path d="M16 16l5 5" /></>}
                  {id === "tag" && <path d="M4 12V5h7l9 9-7 7z" />}
                  {id === "related" && <path d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01" />}
                </svg>
                {label}
              </button>
            ))}
          </nav>

          {tab === "setting" ? (
            <div className="hedit-set">
              <div className="hedit-line">
                <span>在网站中显示</span>
                <button
                  type="button"
                  className={`hedit-switch${visible ? " is-on" : ""}`}
                  aria-pressed={visible}
                  onClick={() => setVisible((v) => !v)}
                >
                  <i />
                </button>
              </div>
              <div className="hedit-field">
                <label htmlFor="honor-time">发布时间</label>
                <input id="honor-time" type="text" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
              <div className="hedit-field">
                <label htmlFor="honor-views">访问量初始值</label>
                <input id="honor-views" type="text" value={views} onChange={(e) => setViews(e.target.value)} />
                <div className="hedit-hint">真实访问量: {data.realViews}</div>
              </div>
              <div className="hedit-field">
                <label htmlFor="honor-page">详情展示页面</label>
                <select id="honor-page" defaultValue="">
                  <option value="">请选择PC站展示页面</option>
                  <option>PC站</option>
                </select>
              </div>
              <div className="hedit-field">
                <div className="hedit-label">访问权限</div>
                <div className="hedit-hint" style={{ marginTop: 0, marginBottom: 8 }}>以下访客可以查看此内容</div>
                <div className="hedit-radio">
                  <label>
                    <input type="radio" name="honor-access" checked={access === "all"} onChange={() => setAccess("all")} />
                    全部访客
                  </label>
                  <label>
                    <input type="radio" name="honor-access" checked={access === "some"} onChange={() => setAccess("some")} />
                    指定访客
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="hedit-set">
              <p className="hedit-empty">{TABS.find((item) => item[0] === tab)?.[1]} 暂无配置</p>
            </div>
          )}
        </aside>

        <section className="hedit-main">
          <div className="hedit-form">
            <div className="hedit-row">
              <div className="hedit-k">分类</div>
              <div className="hedit-v" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="hedit-tag">
                  {data.category}
                  <button type="button" aria-label="移除分类">×</button>
                </span>
                <button type="button" className="hedit-link">新增分类</button>
              </div>
            </div>

            <div className="hedit-row">
              <div className="hedit-k">荣誉名称</div>
              <div className="hedit-v hedit-name">
                <input className="hedit-input" value={name} onChange={(e) => setName(e.target.value)} />
                <button type="button" className="hedit-link">AI标题优化</button>
              </div>
            </div>

            <div className="hedit-row">
              <div className="hedit-k">荣誉概要</div>
              <div className="hedit-v">
                <textarea value={summary} onChange={(e) => setSummary(e.target.value)} />
              </div>
            </div>

            <div className="hedit-row">
              <div className="hedit-k">荣誉图片</div>
              <div className="hedit-v">
                <div className="hedit-photo">
                  {preview ? (
                    <img src={preview} alt="荣誉图片" />
                  ) : (
                    <span className="hedit-hint">暂无图片</span>
                  )}
                  <div className="hedit-photo-actions">
                    <button type="button" className="hedit-link" onClick={() => fileRef.current?.click()}>
                      荣誉图片
                    </button>
                    <button
                      type="button"
                      className="hedit-extract"
                      disabled={!uploadedUrl || extracting}
                      onClick={extractFromImage}
                    >
                      {extracting ? "提取中…" : "荣誉资质图片信息提取"}
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={onPickFile}
                    />
                    {extractNote ? <div className="hedit-hint">{extractNote}</div> : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="hedit-row">
              <div className="hedit-k">详情</div>
              <div className="hedit-v">
                <div className="hedit-editor">
                  <div className="hedit-editor-bar">
                    <button type="button" className="hedit-link solid">语音播报</button>
                    <button type="button" className="hedit-link">返回旧版编辑器</button>
                    <button type="button" className="hedit-link">切换全览模式</button>
                    <button type="button" className="hedit-link">手机视图</button>
                    <span style={{ flexBasis: "100%" }} />
                    {TOOLS.map((tool) => (
                      <button key={tool} type="button" className="hedit-tool">{tool}</button>
                    ))}
                  </div>
                  <div className="hedit-canvas">
                    <div className="hedit-table-wrap">
                      <table className="hedit-table">
                        <tbody>
                          {rows.map(([label, value]) => (
                            <tr key={label}>
                              <th>{label}</th>
                              <td>
                                {label === "信息来源页" ? (
                                  <a href={value} target="_blank" rel="noreferrer">{value}</a>
                                ) : value}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {data.source && (
                      <>
                        <p className="hedit-source">
                          <a href={data.source} target="_blank" rel="noreferrer">{data.source}</a>
                        </p>
                        <div className="hedit-verify">
                          <div>证书核验入口</div>
                          <div>
                            <a href="https://www.cnas.org.cn/" target="_blank" rel="noreferrer">中国合格评定国家认可委员会（CNAS）官网</a>
                            {" — 在线服务 → 信息查询 → 检测和校准实验室；按“顾地科技股份有限公司实验室”或注册号 CNAS L12279 查询"}
                          </div>
                          <div>
                            <a href="https://www.cnas.org.cn/fzlm/zxfw/index.html" target="_blank" rel="noreferrer">CNAS 在线服务（信息查询入口）</a>
                            {" — 证书自带查询指引：有效性可在 CNAS 获认可机构名录中查询"}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <footer className="hedit-foot">
            <button type="button" className="hedit-btn" onClick={onBack}>取消</button>
            <button
              type="button"
              className="hedit-btn primary"
              onClick={() => data.source && window.open(data.source, "_blank", "noopener")}
            >
              预览
            </button>
            <button type="button" className="hedit-btn primary" onClick={() => setSaved(true)}>
              {saved ? "已保存" : "保存"}
            </button>
          </footer>
        </section>
      </div>
    </div>
  );
}
