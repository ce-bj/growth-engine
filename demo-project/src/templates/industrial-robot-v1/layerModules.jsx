import { LayerTag } from "./IndustrialRobotTemplate.shared.jsx";

export function BreadcrumbApp({ app }) {
  const items = app.cmsData?.items || [];
  return (
    <nav className="ir-breadcrumb" data-cms-app={app.cmsAppKey} aria-label="breadcrumb">
      {items.map((item, i) => (
        <span key={`${item}-${i}`} style={{ display: "contents" }}>
          {i > 0 && <span className="sep">/</span>}
          <span className={i === items.length - 1 ? "current" : ""}>{item}</span>
        </span>
      ))}
    </nav>
  );
}

export function InquiryFormApp({ app }) {
  const { design = {}, cmsData = {} } = app;
  const fields = cmsData.fields || [];
  return (
    <section className="ir-inquiry-band" data-cms-app={app.cmsAppKey}>
      <div className="ir-inquiry-copy">
        <h3>{design.title || "获取报价与方案"}</h3>
        <p>{design.subtitle}</p>
      </div>
      <div className="ir-inquiry-form-wrap">
        <form className="ir-inquiry-form" onSubmit={(e) => e.preventDefault()}>
          {fields.map((f) => (
            f.type === "textarea" ? (
              <textarea key={f.key} rows={3} placeholder={f.placeholder || f.label} />
            ) : (
              <input key={f.key} placeholder={`${f.label}${f.required ? " *" : ""}`} />
            )
          ))}
          <button type="submit">{cmsData.submitLabel || "提交询价"}</button>
        </form>
      </div>
    </section>
  );
}

export function EnterpriseProfileApp({ app }) {
  const d = app.cmsData || {};
  const design = app.design || {};
  return (
    <section className="ir-enterprise-band" data-cms-app={app.cmsAppKey}>
      <div>
        <div className="ir-section-eyebrow" style={{ marginBottom: 8 }}>{design.headline || "关于制造商"}</div>
        <div className="ir-enterprise-co">{d.companyName}</div>
        <p className="ir-enterprise-slogan">{d.slogan}</p>
        {Array.isArray(d.certifications) && (
          <div className="ir-enterprise-certs">
            {d.certifications.map((c) => <span key={c}>{c}</span>)}
          </div>
        )}
      </div>
      <div className="ir-enterprise-stats">
        {d.founded && (
          <div className="ir-enterprise-stat"><span>成立</span><strong>{d.founded}</strong></div>
        )}
        {d.employees && (
          <div className="ir-enterprise-stat"><span>规模</span><strong>{d.employees}</strong></div>
        )}
        {d.sites && (
          <div className="ir-enterprise-stat"><span>服务网络</span><strong style={{ fontSize: "1rem" }}>{d.sites}</strong></div>
        )}
      </div>
    </section>
  );
}

export function LayerCApp({ app }) {
  if (app.cmsAppKey === "breadcrumb") return <BreadcrumbApp app={app} />;
  if (app.cmsAppKey === "inquiry-form") return <InquiryFormApp app={app} />;
  if (app.cmsAppKey === "enterprise-profile") return <EnterpriseProfileApp app={app} />;
  return null;
}

function MiniRobot() {
  return (
    <svg viewBox="0 0 80 96" fill="none" aria-hidden>
      <rect x="34" y="8" width="12" height="14" rx="3" fill="#94a3b8" />
      <rect x="26" y="22" width="28" height="20" rx="5" fill="#64748b" />
      <rect x="8" y="28" width="14" height="36" rx="6" fill="#475569" transform="rotate(15 15 46)" />
      <rect x="58" y="28" width="14" height="36" rx="6" fill="#475569" transform="rotate(-18 65 46)" />
      <circle cx="40" cy="84" r="6" fill="#334155" />
    </svg>
  );
}

export function RelatedProductsBlock({ block }) {
  const { design = {}, items = [] } = block;
  return (
    <section className="ir-related-section" data-block={block.blockId}>
      <div className="ir-related-head">
        <div>
          <h3>{design.title || "相关产品"}</h3>
          {design.subtitle && <p>{design.subtitle}</p>}
        </div>
        <button type="button" className="ir-btn-ghost">查看全部 →</button>
      </div>
      <div className="ir-related-grid">
        {items.map((p) => (
          <article key={p.productId || p.name} className="ir-related-card">
            <div className="ir-related-img"><MiniRobot /></div>
            <div className="ir-related-body">
              <strong>{p.name}</strong>
              {p.tag && <span className="ir-related-tag">{p.tag}</span>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
