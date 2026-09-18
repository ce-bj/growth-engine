import { useState } from "react";
import { Icon } from "./Icons";

const TOOLBAR = [
  "↶",
  "↷",
  "|",
  "🔍",
  "🖌",
  "⌫",
  "|",
  "H",
  "A▼",
  "▮",
  "|",
  "B",
  "I",
  "U",
  "S",
  "x²",
  "x₂",
  "|",
  "左",
  "中",
  "右",
  "两端",
  "|",
  "•",
  "1.",
  "|",
  "🖼",
  "▶",
  "📎",
  "表",
  "🔗",
  "<>",
];

export default function ProductEditPage({
  product,
  onProductChange,
  onAiOptimize,
  onBack,
  aiOptimizeButtonState = { disabled: false, label: "AI 优化详情" },
}) {
  const [extendedOpen, setExtendedOpen] = useState(true);
  const [paramOpen, setParamOpen] = useState(true);
  const [specOpen, setSpecOpen] = useState(true);
  const [salesOpen, setSalesOpen] = useState(true);
  const [editorTab, setEditorTab] = useState("info");
  const [specEnabled, setSpecEnabled] = useState(false);

  function update(key, value) {
    onProductChange({ ...product, [key]: value });
  }

  return (
    <>
      <header className="page-header">
        <button className="back" type="button" onClick={onBack}>
          <Icon name="back" size={14} />
          <span className="back-text">返回</span>
        </button>
        <h1>编辑产品</h1>
      </header>

      <div className="page-body">
        <nav className="icon-rail" aria-label="侧栏导航">
          {[
            ["setting", "设置", true],
            ["seo", "SEO", false],
            ["tag", "标签", false],
            ["related", "相关", false],
          ].map(([icon, label, active]) => (
            <button
              key={label}
              className={`icon-rail-btn${active ? " active" : ""}`}
              type="button"
            >
              <span className="glyph">
                <Icon name={icon} size={18} />
              </span>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <aside className="settings-panel">
          <div className="settings-row">
            <span className="settings-label">显示状态</span>
            <button className="switch on" type="button" aria-label="显示状态" />
          </div>

          <div className="settings-block">
            <span className="settings-label">发布时间</span>
            <div className="input-with-prefix">
              <Icon name="calendar" size={14} color="rgba(0,0,0,0.45)" />
              <input defaultValue="2026-07-22 14:38:53" readOnly />
            </div>
          </div>

          <div className="settings-block">
            <span className="settings-label">浏览量</span>
            <div className="input-with-addon">
              <input className="input" placeholder="请输入浏览量" />
              <button className="addon-btn" type="button">
                随机
              </button>
            </div>
          </div>

          <div className="settings-block">
            <span className="settings-label">产品展示页面</span>
            <div className="field-stack">
              <div>
                <div className="sub-label">PC站</div>
                <select className="select" defaultValue="">
                  <option value="" disabled>
                    请选择PC站展示页面
                  </option>
                </select>
              </div>
              <div>
                <div className="sub-label">H5站</div>
                <select className="select" defaultValue="">
                  <option value="" disabled>
                    请选择H5站展示页面
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div className="settings-block">
            <span className="settings-label">会员权限</span>
            <p className="settings-hint">以下访客可以查看此内容</p>
            <div className="radio-group">
              <label className="radio">
                <input type="radio" name="member" defaultChecked />
                全部访客
              </label>
              <label className="radio">
                <input type="radio" name="member" />
                指定访客
              </label>
            </div>
          </div>
        </aside>

        <main className="editor-pane">
          {/* 顶部元信息 */}
          <section className="card">
            <div className="meta-row">
              <div className="form-item" style={{ marginBottom: 0 }}>
                <label className="form-label">产品类型</label>
                <select className="select" defaultValue="normal">
                  <option value="normal">普通商品</option>
                </select>
              </div>
              <div className="form-item" style={{ marginBottom: 0 }}>
                <label className="form-label required">产品分类</label>
                <div className="category-field">
                  <div className="tag-box">
                    <span className="tag blue">
                      {product.categoryName}
                      <button className="x" type="button">
                        ×
                      </button>
                    </span>
                  </div>
                  <button className="link-btn" type="button">
                    新增分类
                  </button>
                </div>
              </div>
              <div className="form-item" style={{ marginBottom: 0 }}>
                <label className="form-label">所属模板</label>
                <select className="select" defaultValue="default">
                  <option value="default">默认属性类型</option>
                </select>
              </div>
            </div>
          </section>

          {/* 基本信息 */}
          <section className="card">
            <h2 className="section-head">基本信息</h2>

            <div className="form-item">
              <label className="form-label required">产品名称</label>
              <input
                className="input"
                value={product.title}
                onChange={(e) => update("title", e.target.value)}
              />
            </div>

            <div className="form-item">
              <label className="form-label">产品图片</label>
              <p className="upload-hint">可将本地文件拖拽到此处上传</p>
              <div className="upload-box image">
                <Icon name="plus" size={28} />
              </div>
            </div>

            <div className="form-item">
              <label className="form-label">产品视频</label>
              <div className="upload-box video">
                <Icon name="video" size={40} />
              </div>
            </div>

            <div className="form-item">
              <label className="form-label">编号</label>
              <input
                className="input"
                placeholder="请输入编号"
                value={product.sku}
                onChange={(e) => update("sku", e.target.value)}
                style={{ maxWidth: 480 }}
              />
            </div>
          </section>

          {/* 扩展信息 */}
          <section className="card">
            <button
              className="section-head bar"
              type="button"
              onClick={() => setExtendedOpen((v) => !v)}
              style={{ width: "100%", border: "none", textAlign: "left" }}
            >
              扩展信息
              <span className="chevron">
                <Icon name={extendedOpen ? "up" : "down"} size={14} />
              </span>
            </button>

            {extendedOpen ? (
              <div style={{ paddingTop: 20 }}>
                <div className="form-item">
                  <label className="form-label">产品型号</label>
                  <input
                    className="input"
                    value={product.model}
                    onChange={(e) => update("model", e.target.value)}
                  />
                </div>

                <div className="form-item">
                  <label className="form-label">重量</label>
                  <div className="input-affix" style={{ maxWidth: 480 }}>
                    <input
                      className="input"
                      value={product.weight}
                      onChange={(e) => update("weight", e.target.value)}
                    />
                    <span className="affix">
                      kg <Icon name="down" size={12} />
                    </span>
                  </div>
                </div>

                <div className="form-item">
                  <label className="form-label">体积</label>
                  <div className="input-affix" style={{ maxWidth: 480 }}>
                    <input
                      className="input"
                      value={product.volume}
                      onChange={(e) => update("volume", e.target.value)}
                    />
                    <span className="affix">
                      m³ <Icon name="down" size={12} />
                    </span>
                  </div>
                </div>

                <div className="form-item">
                  <label className="form-label">交货期</label>
                  <input
                    className="input"
                    value={product.delivery}
                    onChange={(e) => update("delivery", e.target.value)}
                    style={{ maxWidth: 480 }}
                  />
                </div>

                <div className="form-item">
                  <label className="form-label">产品附件</label>
                  <div className="attach-zone">
                    <div className="hint">可将本地文件拖拽到此处上传</div>
                    <button className="btn btn-primary" type="button">
                      添加文件
                    </button>
                  </div>
                </div>

                <div className="form-item">
                  <div className="btn-link-row">
                    <button className="link-btn" type="button">
                      <Icon name="old-editor" size={14} /> 返回旧版编辑器
                    </button>
                    <div className="editor-tools-right">
                      {typeof onAiOptimize === "function" ? (
                      <button
                        className={`ai-optimize-btn${aiOptimizeButtonState.disabled ? " is-busy" : ""}`}
                        type="button"
                        onClick={onAiOptimize}
                        disabled={aiOptimizeButtonState.disabled}
                        title={
                          aiOptimizeButtonState.hint ||
                          "一键唤起运营助手，优化当前产品详情"
                        }
                      >
                        <span className="spark">✨</span>
                        {aiOptimizeButtonState.label}
                      </button>
                      ) : null}
                      <button type="button">
                        <Icon name="expand" size={14} /> 切换全宽模式
                      </button>
                      <button type="button">
                        <Icon name="phone" size={14} /> 手机预览
                      </button>
                    </div>
                  </div>

                  <div className="editor-tabs">
                    <button
                      className={`editor-tab${editorTab === "info" ? " active" : ""}`}
                      type="button"
                      onClick={() => setEditorTab("info")}
                    >
                      详情
                    </button>
                    <button
                      className={`editor-tab${editorTab === "detail" ? " active" : ""}`}
                      type="button"
                      onClick={() => setEditorTab("detail")}
                    >
                      产品详情
                    </button>
                  </div>

                  <div className="rich-editor">
                    <div className="rich-toolbar">
                      {TOOLBAR.map((item, idx) =>
                        item === "|" ? (
                          <span className="tool-sep" key={`sep-${idx}`} />
                        ) : (
                          <button className="tool-btn" type="button" key={`${item}-${idx}`}>
                            {item}
                          </button>
                        )
                      )}
                    </div>
                    <div className="rich-body">
                      <p>
                        中科重联 PS2004
                        动力换挡拖拉机，147.5kW高效动力输出，专为水田耕作与多场景作业打造。整机兼顾高效作业、稳定操控与耐用性，满足专业农业用户的连续作业需求。
                      </p>
                      <h3 style={{ borderLeft: "3px solid #3B9FD0", paddingLeft: 8 }}>
                        产品规格参数列表
                      </h3>
                      <table className="spec-table">
                        <thead>
                          <tr>
                            <th>参数名称</th>
                            <th>单位</th>
                            <th>参数值</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>额定功率</td>
                            <td>kW</td>
                            <td>147.5</td>
                          </tr>
                          <tr>
                            <td>驱动型式</td>
                            <td>—</td>
                            <td>四轮驱动</td>
                          </tr>
                          <tr>
                            <td>适用场景</td>
                            <td>—</td>
                            <td>水田 / 旱地耕作</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="form-item">
                  <button className="btn btn-primary" type="button">
                    产品详情设计器
                  </button>
                </div>

                <div className="form-item">
                  <label className="form-label">摘要描述</label>
                  <div className="summary-box">{product.summary}</div>
                  <button className="link-btn" type="button" style={{ marginTop: 8 }}>
                    从富文本获取
                  </button>
                </div>

                <div className="form-item">
                  <label className="form-label">360°全景展示</label>
                  <div className="upload-zone gray">
                    <div>可将本地文件拖拽到此处上传</div>
                    <div className="plus-box">
                      <Icon name="plus" size={24} />
                    </div>
                    <div className="sub">上传图片大小保持一致</div>
                  </div>
                </div>

                <div className="form-item">
                  <label className="form-label">所属橱窗</label>
                  <select className="select" defaultValue="">
                    <option value="" disabled>
                      请选择
                    </option>
                  </select>
                </div>
                <div className="form-item">
                  <label className="form-label">所属标记</label>
                  <select className="select" defaultValue="">
                    <option value="" disabled>
                      请选择
                    </option>
                  </select>
                </div>
                <div className="form-item">
                  <label className="form-label">所属品牌</label>
                  <select className="select" defaultValue="">
                    <option value="" disabled>
                      请选择
                    </option>
                  </select>
                </div>

                <div className="form-item">
                  <label className="form-label">扩展按钮</label>
                  <div className="ext-btn-row">
                    <input
                      className="input"
                      placeholder="请输入完整链接 例: http://www.300.cn"
                    />
                    <span className="ext-label">扩展按钮</span>
                  </div>
                </div>
              </div>
            ) : null}
          </section>

          {/* 产品参数 */}
          <section className="card collapse-card">
            <button
              className="section-head bar"
              type="button"
              onClick={() => setParamOpen((v) => !v)}
              style={{ width: "100%", border: "none", textAlign: "left" }}
            >
              产品参数
              <span className="chevron">
                <Icon name={paramOpen ? "up" : "down"} size={14} />
              </span>
            </button>
            {paramOpen ? (
              <div className="collapse-body">
                <div className="section-head bar" style={{ marginBottom: 16, cursor: "default" }}>
                  参数
                </div>
                <div className="form-item">
                  <label className="form-label">参数1</label>
                  <input className="input" />
                </div>
              </div>
            ) : null}
          </section>

          {/* 产品规格 */}
          <section className="card collapse-card">
            <button
              className="section-head bar"
              type="button"
              onClick={() => setSpecOpen((v) => !v)}
              style={{ width: "100%", border: "none", textAlign: "left" }}
            >
              产品规格
              <span className="chevron">
                <Icon name={specOpen ? "up" : "down"} size={14} />
              </span>
            </button>
            {specOpen ? (
              <div className="collapse-body">
                <div className="form-item" style={{ marginBottom: 0 }}>
                  <label className="form-label">规格设置</label>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <button
                      className={`switch${specEnabled ? " on" : ""}`}
                      type="button"
                      onClick={() => setSpecEnabled((v) => !v)}
                    />
                    <span className="help-inline">
                      若未开启规格，则无法选择“根据规格设置阶梯价格”的定价方式，仅支持“根据数量设置阶梯价格”
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </section>

          {/* 销售方式 */}
          <section className="card collapse-card">
            <button
              className="section-head bar"
              type="button"
              onClick={() => setSalesOpen((v) => !v)}
              style={{ width: "100%", border: "none", textAlign: "left" }}
            >
              销售方式
              <span className="chevron">
                <Icon name={salesOpen ? "up" : "down"} size={14} />
              </span>
            </button>
            {salesOpen ? (
              <div className="collapse-body">
                <div className="form-item">
                  <label className="form-label">定价方式</label>
                  <label className="radio">
                    <input type="radio" name="price" defaultChecked />
                    根据数量设置阶梯价格
                    <Icon name="info" size={14} color="rgba(0,0,0,0.45)" />
                  </label>
                </div>

                <div className="form-item">
                  <label className="form-label">库存</label>
                  <input className="input" placeholder="请输入库存" style={{ maxWidth: 360 }} />
                </div>

                <div className="form-item">
                  <label className="form-label">最低起订量</label>
                  <input
                    className="input"
                    placeholder="请输入最低起订量"
                    style={{ maxWidth: 360 }}
                  />
                  <p className="note-text">
                    若产品有多个规格，最低起订量针对每个规格分别生效；下单时各规格购买数量均需满足最低起订量。
                  </p>
                </div>

                <table className="tier-table">
                  <thead>
                    <tr>
                      <th>操作</th>
                      <th>阶梯最小购买数量</th>
                      <th>
                        阶梯最大购买数量 <Icon name="info" size={12} color="rgba(0,0,0,0.45)" />
                      </th>
                      <th>批发价(¥)</th>
                      <th>预览</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div className="ops">
                          <button className="link-btn" type="button">
                            删除
                          </button>
                          <button className="link-btn" type="button">
                            添加
                          </button>
                        </div>
                      </td>
                      <td>
                        <input className="input" defaultValue="1" style={{ width: 80 }} />
                      </td>
                      <td>
                        <input className="input" defaultValue="2" style={{ width: 80 }} />
                      </td>
                      <td>
                        <input className="input" defaultValue="1" style={{ width: 80 }} />
                      </td>
                      <td>
                        <div className="tier-preview">
                          购买数量 1-2 个：批发价 ¥1 / 个 如果 &gt; 2个，价格按 ¥1 / 个。
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p className="note-text">
                  若实际购买数量大于设置的最大阶梯数量，则按最后一个阶梯的价格计算。
                </p>
              </div>
            ) : null}
          </section>
        </main>
      </div>

      <footer className="page-footer">
        <button className="btn" type="button">
          取消
        </button>
        <button className="btn btn-primary" type="button">
          发布
        </button>
        <button className="btn btn-ghost-primary" type="button">
          预览
        </button>
      </footer>
    </>
  );
}
