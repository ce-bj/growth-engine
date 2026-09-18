import DOMPurify from "dompurify";
import policy from "./html-sanitizer-policy.json";

const {
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  ALLOW_DATA_ATTR,
  FORBID_TAGS,
  FORBID_ATTR,
  ALLOWED_URI_REGEXP,
} = policy.config;

const PURIFY_CONFIG = {
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  ALLOW_DATA_ATTR,
  FORBID_TAGS,
  FORBID_ATTR,
  ...(ALLOWED_URI_REGEXP
    ? { ALLOWED_URI_REGEXP: new RegExp(ALLOWED_URI_REGEXP) }
    : {}),
};

/** layerB.body.html 渲染前强制消毒 */
export function sanitizeProductHtml(rawHtml) {
  const html = String(rawHtml || "").trim();
  if (!html) return "";
  return DOMPurify.sanitize(html, PURIFY_CONFIG);
}

export function slugifyHeading(text, index = 0) {
  const base = String(text || "section")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u4e00-\u9fff-]/g, "");
  return base || `section-${index}`;
}
