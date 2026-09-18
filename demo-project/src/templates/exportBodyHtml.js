/** 从 pageDraft 取出 B 层正文 HTML（已是正常字符串，非 JSON 转义形态） */
export function extractBodyHtml(pageDraft) {
  const body = pageDraft?.slots?.["layerB.body"]?.value;
  if (!body) return "";
  if (typeof body === "string") return body.trim();
  return String(body.html || "").trim();
}

/** 汇总本会话内用户上传图，按发送顺序供 imageRef(n) 解析 */
export function collectSessionImageUrls({
  pendingImages = [],
  messages = [],
  sessionImages = [],
} = {}) {
  const urls = [];
  const seen = new Set();

  const push = (url) => {
    const u = String(url || "").trim();
    if (!u || seen.has(u)) return;
    seen.add(u);
    urls.push(u);
  };

  for (const msg of messages) {
    if (msg.type === "user") {
      const imgs = msg.attachments || msg.imageUrls;
      if (Array.isArray(imgs)) {
        for (const att of imgs) push(att);
      }
    }
  }
  for (const url of sessionImages) {
    push(url);
  }
  for (const img of pendingImages) {
    push(img.preview);
  }
  return urls;
}

const IMAGE_REF_RE = /imageRef\s*\(\s*["']?(\d+)["']?\s*\)/gi;
const UPLOAD_REF_RE = /upload:\/\/[^"'\s<>)]+/gi;

function pickImageUrl(imageUrls, index) {
  const i = Number(index);
  if (!Number.isFinite(i) || i < 0) return imageUrls[0] || "";
  return imageUrls[i] ?? (imageUrls[0] || "");
}

/** 将 HTML 内 imageRef(0) / upload:// 占位替换为会话图片 URL（通常为 data URL） */
export function resolveImageRefsInHtml(html, imageUrls = []) {
  if (!html) return "";
  if (!imageUrls.length) return html;

  let uploadSeq = 0;
  return html
    .replace(IMAGE_REF_RE, (_, idx) => pickImageUrl(imageUrls, idx) || `imageRef(${idx})`)
    .replace(UPLOAD_REF_RE, () => {
      const url = imageUrls[uploadSeq] ?? imageUrls[0] ?? "";
      uploadSeq += 1;
      return url;
    });
}

export function buildExportableBodyHtml(pageDraft, { pendingImages, messages, sessionImages } = {}) {
  const raw = extractBodyHtml(pageDraft);
  const urls = collectSessionImageUrls({ pendingImages, messages, sessionImages });
  return resolveImageRefsInHtml(raw, urls);
}

export function countUnresolvedImageRefs(html) {
  if (!html) return 0;
  const imageRefs = html.match(/imageRef\s*\(\s*["']?\d+["']?\s*\)/gi) || [];
  const uploads = html.match(/upload:\/\/[^"'\s<>)]+/gi) || [];
  return imageRefs.length + uploads.length;
}
