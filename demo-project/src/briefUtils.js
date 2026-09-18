/** 生成前摘要（GenerationBrief v1）工具函数 */

export function slimBriefForRequest(brief) {
  if (!brief?.briefId) return undefined;
  return {
    version: brief.version || "1",
    briefId: brief.briefId,
    status: brief.status,
    recognition: brief.recognition,
    clarification: brief.clarification,
    generatableModules: brief.generatableModules,
    suggestedTopics: brief.suggestedTopics,
    gaps: brief.gaps,
    pageTemplateId: brief.pageTemplateId,
  };
}

export function getSelectedTopicLabels(brief) {
  return (brief?.suggestedTopics || [])
    .filter((t) => t?.selected && t?.label)
    .map((t) => t.label);
}

export function updateBriefDimension(brief, dimId, patch) {
  if (!brief?.clarification?.dimensions) return brief;
  const dimensions = brief.clarification.dimensions.map((dim) => {
    if (dim.id !== dimId) return dim;
    return { ...dim, ...patch };
  });
  return {
    ...brief,
    clarification: { ...brief.clarification, dimensions },
  };
}

export function toggleBriefTopic(brief, topicId) {
  const suggestedTopics = (brief?.suggestedTopics || []).map((t) => (
    t.id === topicId ? { ...t, selected: !t.selected } : t
  ));
  return { ...brief, suggestedTopics };
}

export function finalizeClarificationForGenerate(brief) {
  const dimensions = (brief?.clarification?.dimensions || []).map((d) => {
    const hasAnswer = d.answered
      || Boolean(d.value)
      || (d.values || []).length > 0;
    if (hasAnswer) {
      return {
        ...d,
        answered: true,
        skipped: false,
      };
    }
    return {
      ...d,
      skipped: true,
      answered: false,
      selectedOptionId: null,
      selectedOptionIds: [],
      value: null,
      values: [],
    };
  });
  return {
    ...brief,
    status: "confirmed",
    clarification: { ...brief.clarification, dimensions },
  };
}

/** @deprecated 摘要卡流程；澄清卡提交请用 finalizeClarificationForGenerate */
export function finalizeClarificationDimensions(brief) {
  const dimensions = (brief?.clarification?.dimensions || []).map((d) => {
    const hasAnswer = d.answered
      || d.skipped
      || Boolean(d.value)
      || (d.values || []).length > 0;
    if (hasAnswer) {
      return {
        ...d,
        answered: Boolean(d.answered || d.value || (d.values || []).length > 0),
      };
    }
    return {
      ...d,
      skipped: true,
      answered: false,
      selectedOptionId: null,
      selectedOptionIds: [],
      value: null,
      values: [],
    };
  });
  return {
    ...brief,
    status: "awaiting_confirm",
    clarification: { ...brief.clarification, dimensions },
  };
}

export function markBriefAwaitingConfirm(brief) {
  return { ...brief, status: "awaiting_confirm" };
}

export function markBriefConfirmed(brief) {
  return { ...brief, status: "confirmed" };
}
