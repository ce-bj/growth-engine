import { useCallback, useMemo, useState } from "react";
import "./industrial-robot-v1.css";
import { LayerCApp, RelatedProductsBlock } from "./layerModules.jsx";
import manifest from "./manifest.json";
import { resolveImageRefsInHtml } from "../exportBodyHtml.js";
import { sanitizeProductHtml, slugifyHeading } from "../sanitizeHtml.js";

function RobotHeroVisual() {
  return (
    <svg viewBox="0 0 320 380" fill="none" aria-hidden>
      <defs>
        <linearGradient id="armGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="50%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id="jointGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        <filter id="robotShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#0a1628" floodOpacity="0.18" />
        </filter>
      </defs>
      <g filter="url(#robotShadow)">
        <ellipse cx="160" cy="350" rx="90" ry="12" fill="#0a1628" opacity="0.08" />
        <rect x="148" y="28" width="24" height="32" rx="6" fill="url(#armGrad)" stroke="#94a3b8" strokeWidth="1" />
        <circle cx="160" cy="36" r="6" fill="url(#jointGrad)" />
        <rect x="118" y="58" width="84" height="52" rx="10" fill="url(#armGrad)" stroke="#94a3b8" strokeWidth="1.2" />
        <circle cx="160" cy="84" r="8" fill="url(#jointGrad)" />
        <rect x="52" y="72" width="36" height="100" rx="14" fill="url(#armGrad)" stroke="#94a3b8" strokeWidth="1" transform="rotate(22 70 122)" />
        <circle cx="62" cy="88" r="7" fill="url(#jointGrad)" />
        <rect x="232" y="72" width="36" height="100" rx="14" fill="url(#armGrad)" stroke="#94a3b8" strokeWidth="1" transform="rotate(-28 250 122)" />
        <circle cx="258" cy="88" r="7" fill="url(#jointGrad)" />
        <rect x="132" y="110" width="56" height="68" rx="8" fill="url(#armGrad)" stroke="#94a3b8" strokeWidth="1" />
        <circle cx="160" cy="148" r="8" fill="url(#jointGrad)" />
        <rect x="88" y="168" width="32" height="110" rx="12" fill="url(#armGrad)" stroke="#94a3b8" strokeWidth="1" transform="rotate(8 104 223)" />
        <circle cx="98" cy="182" r="7" fill="url(#jointGrad)" />
        <rect x="200" y="168" width="32" height="110" rx="12" fill="url(#armGrad)" stroke="#94a3b8" strokeWidth="1" transform="rotate(-14 216 223)" />
        <circle cx="216" cy="182" r="7" fill="url(#jointGrad)" />
        <circle cx="160" cy="290" r="18" fill="#1e293b" stroke="#475569" strokeWidth="2" />
        <circle cx="160" cy="290" r="10" fill="#334155" />
        <rect x="148" y="308" width="24" height="28" rx="4" fill="#475569" />
      </g>
    </svg>
  );
}

function Editable({
  slotKey, editable, className, tag: Tag = "div", value, onChange, children, ...rest
}) {
  const handleBlur = useCallback((e) => {
    if (!editable || !onChange) return;
    onChange(slotKey, e.currentTarget.innerText);
  }, [editable, onChange, slotKey]);

  if (!editable) {
    return <Tag className={className} data-slot={slotKey} {...rest}>{children ?? value}</Tag>;
  }
  return (
    <Tag
      className={`${className || ""} ir-editable`.trim()}
      data-slot={slotKey}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      {...rest}
    >
      {children ?? value}
    </Tag>
  );
}

function RichHtmlBody({ html, imageUrls = [], editable, onChange }) {
  const safeHtml = useMemo(() => {
    const resolved = resolveImageRefsInHtml(html, imageUrls);
    return sanitizeProductHtml(resolved);
  }, [html, imageUrls]);
  if (!safeHtml && !editable) {
    return <div className="ir-placeholder">待生成</div>;
  }
  if (editable) {
    return (
      <div
        className="ir-rich-html ir-editable"
        data-slot="layerB.body"
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => onChange?.("layerB.body", { html: e.currentTarget.innerHTML, outline: [] })}
        dangerouslySetInnerHTML={{ __html: safeHtml || "<p>在此编辑产品详情 HTML…</p>" }}
      />
    );
  }
  return (
    <div
      className="ir-rich-html"
      data-slot="layerB.body"
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}

function resolveNavItems(draft) {
  const body = draft?.slots?.["layerB.body"]?.value;
  const outline = Array.isArray(body?.outline) ? body.outline : [];
  if (outline.length) {
    return outline.map((item, i) => ({
      id: slugifyHeading(item.heading, i),
      label: item.heading,
    }));
  }
  if (draft?.version === "2" || draft?.slots?.["layerB.body"]) {
    return [{ id: "product-detail", label: "产品详情" }];
  }
  return manifest.slotOrderB.map((fieldTarget) => ({
    id: fieldTarget.replace(/[[\].]/g, "-"),
    label: draft?.slots?.[fieldTarget]?.label || fieldTarget,
  }));
}

export function IndustrialRobotTemplate({ draft, imageUrls = [], editable = false, onSlotChange }) {
  const slots = draft?.slots || {};
  const layerCApps = draft?.layerC?.apps || [];
  const layerDBlocks = draft?.layerD?.blocks || [];
  const navItems = useMemo(() => resolveNavItems(draft), [draft]);
  const [activeThumb, setActiveThumb] = useState(0);
  const [activeNav, setActiveNav] = useState(() => navItems[0]?.id || "product-detail");

  const breadcrumbApp = layerCApps.find((a) => a.cmsAppKey === "breadcrumb");
  const footerCApps = layerCApps.filter((a) => a.placement !== "header" && a.cmsAppKey !== "breadcrumb");
  const enterpriseApp = footerCApps.find((a) => a.cmsAppKey === "enterprise-profile");
  const inquiryApp = footerCApps.find((a) => a.cmsAppKey === "inquiry-form");

  const titleSlot = slots["layerA.title"]?.value || {};
  const headline = titleSlot.headline || "产品名称";
  const sellingPoints = titleSlot.sellingPoints || [];
  const overview = slots["layerA.overview"]?.value || "";
  const media = slots["layerA.media"]?.value || {};
  const bodyHtml = slots["layerB.body"]?.value?.html || "";

  const mediaAlts = (media.items || []).map((it) => it.alt).filter(Boolean);

  const kpis = useMemo(() => {
    if (sellingPoints.length >= 2) {
      return sellingPoints.slice(0, 4).map((sp) => {
        const [val, ...rest] = String(sp).split(/[·|]/).map((s) => s.trim());
        return { value: val, label: rest.join(" · ") || "核心指标" };
      });
    }
    return null;
  }, [sellingPoints]);

  const breadcrumbItems = breadcrumbApp?.cmsData?.items
    || ["首页", "产品中心", draft?.industryName || "产品中心", headline.split(" ")[0]];

  const handleBodyChange = useCallback((key, val) => {
    onSlotChange?.(key, val);
  }, [onSlotChange]);

  return (
    <div className="ir-page">
      <header className="ir-topbar">
        {breadcrumbApp ? <LayerCApp app={breadcrumbApp} /> : (
          <nav className="ir-breadcrumb" aria-label="breadcrumb">
            {breadcrumbItems.map((item, i) => (
              <span key={`${item}-${i}`} style={{ display: "contents" }}>
                {i > 0 && <span className="sep">/</span>}
                <span className={i === breadcrumbItems.length - 1 ? "current" : ""}>{item}</span>
              </span>
            ))}
          </nav>
        )}
        <div className="ir-topbar-actions">
          <button type="button" className="ir-btn-ghost">分享</button>
          <button type="button" className="ir-btn-ghost">打印规格书</button>
        </div>
      </header>

      <section className="ir-hero">
        <div className="ir-gallery">
          <div className="ir-gallery-main">
            <span className="ir-gallery-badge">产品图册</span>
            {imageUrls[activeThumb] ? (
              <img
                className="ir-gallery-img"
                src={imageUrls[activeThumb]}
                alt={mediaAlts[activeThumb] || `产品视图 ${activeThumb + 1}`}
              />
            ) : null}
          </div>
          {imageUrls.length > 0 && (
            <div className="ir-thumbs">
              {imageUrls.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  className={`ir-thumb${activeThumb === i ? " active" : ""}`}
                  onClick={() => setActiveThumb(i)}
                  aria-label={mediaAlts[i] || `视图 ${i + 1}`}
                  title={mediaAlts[i] || undefined}
                >
                  <img className="ir-thumb-img" src={url} alt={mediaAlts[i] || `视图 ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
          <Editable
            slotKey="layerA.media.caption"
            editable={editable}
            className="ir-gallery-caption"
            value={media.caption || ""}
            onChange={(_, v) => onSlotChange?.("layerA.media", { ...media, caption: v })}
          >
            {media.caption || (mediaAlts.length ? mediaAlts.join(" · ") : "产品实拍图册")}
          </Editable>
        </div>

        <div className="ir-product-info">
          <div className="ir-category">{draft?.productCategory || draft?.industryName || ""}</div>
          <Editable
            slotKey="layerA.title.headline"
            editable={editable}
            tag="h1"
            className="ir-title"
            value={headline}
            onChange={(_, v) => onSlotChange?.("layerA.title", { ...titleSlot, headline: v })}
          >
            {headline}
          </Editable>
          <Editable
            slotKey="layerA.overview"
            editable={editable}
            tag="p"
            className="ir-overview"
            value={overview}
            onChange={(_, v) => onSlotChange?.("layerA.overview", v)}
          >
            {overview || (editable ? "产品概述待生成" : "")}
          </Editable>
          {sellingPoints.length > 0 && (
            <div className="ir-chips">
              {sellingPoints.map((sp) => <span key={sp} className="ir-chip">{sp}</span>)}
            </div>
          )}
          <div className="ir-cta-row">
            <button type="button" className="ir-btn-primary">获取报价</button>
            <button type="button" className="ir-btn-outline">
              <span>↓</span> 下载产品手册
            </button>
          </div>
        </div>
      </section>

      {kpis && (
        <div className="ir-kpi-strip">
          {kpis.map((k) => (
            <div key={k.label} className="ir-kpi">
              <div className="ir-kpi-value">{k.value}</div>
              <div className="ir-kpi-label">{k.label}</div>
            </div>
          ))}
        </div>
      )}

      {navItems.length > 0 && (
        <nav className="ir-sticky-nav" aria-label="页面导航">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`ir-nav-tab${activeNav === item.id ? " active" : ""}`}
              onClick={() => {
                setActiveNav(item.id);
                document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      )}

      <main className="ir-body">
        <section className="ir-section" id={navItems[0]?.id || "product-detail"}>
          <div className="ir-section-head">
            <div className="ir-section-eyebrow">详情说明</div>
            <h2 className="ir-section-title">产品详情</h2>
          </div>
          <RichHtmlBody
            html={bodyHtml}
            imageUrls={imageUrls}
            editable={editable}
            onChange={handleBodyChange}
          />
        </section>

        {enterpriseApp && <LayerCApp app={enterpriseApp} />}
        {inquiryApp && <LayerCApp app={inquiryApp} />}
        {layerDBlocks.map((block) => (
          <RelatedProductsBlock key={block.blockId} block={block} />
        ))}
      </main>
    </div>
  );
}
