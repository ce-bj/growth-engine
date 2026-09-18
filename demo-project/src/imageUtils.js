export const MAX_UPLOAD_IMAGES = 5;
export const MAX_IMAGE_SIZE_MB = 8;
/** 识图上传：长边上限，显著降低多模态 API 延迟 */
export const VISION_MAX_EDGE = 1280;
export const VISION_JPEG_QUALITY = 0.82;
/** 小于此体积且已是 JPEG 时跳过重编码 */
export const VISION_SKIP_COMPRESS_BELOW_BYTES = 180 * 1024;

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImageElement(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("图片解码失败"));
    img.src = dataUrl;
  });
}

/**
 * 压缩图片供识图 API 使用：限制长边、转 JPEG，预览仍用压缩结果。
 */
async function compressImageForVision(file) {
  const preview = await readAsDataUrl(file);
  if (
    file.size < VISION_SKIP_COMPRESS_BELOW_BYTES
    && (file.type === "image/jpeg" || file.type === "image/jpg")
  ) {
    return {
      preview,
      data: String(preview).split(",")[1] || "",
      media_type: file.type || "image/jpeg",
      name: file.name || "upload.jpg",
    };
  }

  const img = await loadImageElement(preview);
  let { width, height } = img;
  const maxEdge = VISION_MAX_EDGE;
  if (width > maxEdge || height > maxEdge) {
    if (width >= height) {
      height = Math.round((height * maxEdge) / width);
      width = maxEdge;
    } else {
      width = Math.round((width * maxEdge) / height);
      height = maxEdge;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("浏览器无法处理图片");
  }
  ctx.drawImage(img, 0, 0, width, height);

  const outType = "image/jpeg";
  const outUrl = canvas.toDataURL(outType, VISION_JPEG_QUALITY);
  const baseName = (file.name || "upload").replace(/\.[^.]+$/, "");

  return {
    preview: outUrl,
    data: outUrl.split(",")[1] || "",
    media_type: outType,
    name: `${baseName}.jpg`,
  };
}

export async function fileToImagePayload(file) {
  if (!file.type.startsWith("image/")) {
    throw new Error("仅支持上传图片文件");
  }
  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    throw new Error(`单张图片不能超过 ${MAX_IMAGE_SIZE_MB}MB`);
  }

  const compressed = await compressImageForVision(file);

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    preview: compressed.preview,
    data: compressed.data,
    media_type: compressed.media_type,
    name: compressed.name,
  };
}

export async function filesToImagePayloads(files, currentCount = 0) {
  const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
  if (!list.length) {
    throw new Error("请选择图片文件");
  }
  if (currentCount + list.length > MAX_UPLOAD_IMAGES) {
    throw new Error(`最多上传 ${MAX_UPLOAD_IMAGES} 张图片`);
  }
  return Promise.all(list.map(fileToImagePayload));
}

export function toApiImages(images) {
  return images.map(({ data, media_type, name }) => ({
    data,
    media_type,
    name,
  }));
}
