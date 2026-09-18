export function slimPageDraftForRequest(draft) {
  if (!draft || typeof draft !== "object") return undefined;
  const layerC = draft.layerC?.apps?.map(({ cmsData, ...rest }) => rest) || undefined;
  const layerD = draft.layerD?.blocks?.map(({ items, ...rest }) => rest) || undefined;
  return {
    version: draft.version,
    draftId: draft.draftId,
    templateId: draft.templateId,
    industryName: draft.industryName,
    productCategory: draft.productCategory,
    draftTitle: draft.draftTitle,
    slots: draft.slots,
    generatableModules: draft.generatableModules || draft.contentModules,
    coverage: draft.coverage,
    ...(layerC ? { layerC: { apps: layerC } } : {}),
    ...(layerD ? { layerD: { blocks: layerD } } : {}),
  };
}

/** bridge 未发 page_draft 时，从 tool_result.output 兜底解析 */
export function parsePageDraftFromToolOutput(output, templateId = "industrial-robot-v1") {
  if (!output) return null;
  let parsed = output;
  if (typeof output === "string") {
    try {
      parsed = JSON.parse(output);
    } catch {
      return null;
    }
  }
  if (parsed?.pageDraft) return parsed.pageDraft;
  if (parsed?.independentFields || parsed?.htmlBody) {
    return buildPageDraftFromAgentResult(parsed, parsed.pageTemplateId || templateId);
  }
  if (parsed?.richTextSections) {
    return buildPageDraftFromAgentResult(parsed, parsed.pageTemplateId || templateId);
  }
  return null;
}

export function mergeContentModules(draft, modules) {
  if (!Array.isArray(modules) || !modules.length) return draft;
  return { ...draft, generatableModules: modules, contentModules: modules };
}

function parseMediaContent(content) {
  if (typeof content === "object" && content !== null) return content;
  const raw = String(content || "").trim();
  if (!raw) return { caption: "", items: [] };
  try {
    const data = JSON.parse(raw);
    if (typeof data === "object" && data !== null) return data;
  } catch {
    return { caption: raw, items: [] };
  }
  return { caption: raw, items: [] };
}

export function buildPageDraftFromAgentResult(agentResult, templateId = "industrial-robot-v1") {
  if (!agentResult || typeof agentResult !== "object") return null;

  const slots = {};

  for (const field of agentResult.independentFields || []) {
    const key = field.fieldTarget;
    if (!key) continue;
    if (key === "layerA.title") {
      slots[key] = {
        type: "title",
        label: field.fieldLabel || field.moduleName,
        source: "agent",
        value: parseTitleField(field.content),
      };
    } else if (key === "layerA.media") {
      slots[key] = {
        type: "image_meta",
        label: field.fieldLabel || field.moduleName,
        source: "agent",
        value: parseMediaContent(field.content),
      };
    } else if (key === "layerA.overview") {
      slots[key] = {
        type: "overview",
        label: field.fieldLabel || field.moduleName,
        source: "agent",
        value: String(field.content || ""),
      };
    }
  }

  const htmlBody = agentResult.htmlBody || {};
  let html = String(htmlBody.html || "");
  let outline = Array.isArray(htmlBody.outline) ? htmlBody.outline : [];

  if (!html) {
    for (const section of agentResult.richTextSections || []) {
      if (section.fieldTarget === "layerB.body") {
        html = String(section.markdown || section.html || "");
        outline = section.outline || [];
        break;
      }
    }
  }

  slots["layerB.body"] = {
    type: "html_richtext",
    label: "产品详情",
    source: "agent",
    value: { html, outline },
  };

  return {
    version: "2",
    draftId: agentResult.draftId || `draft-${Date.now()}`,
    templateId,
    industryName: agentResult.industryName || "",
    productCategory: agentResult.productCategory || "",
    slots,
    generatableModules: agentResult.generatableModules || [],
    coverage: agentResult.coverage,
    layerC: agentResult.layerC || null,
    layerD: agentResult.layerD || null,
  };
}

function parseTitleField(content) {
  const text = String(content || "").trim();
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  return {
    headline: lines[0] || text,
    sellingPoints: lines.slice(1).map((l) => l.replace(/^[-*•]\s*/, "")),
  };
}

export function getSlotValue(draft, key, fallback = "") {
  const slot = draft?.slots?.[key];
  if (!slot) return fallback;
  return slot.value ?? fallback;
}
