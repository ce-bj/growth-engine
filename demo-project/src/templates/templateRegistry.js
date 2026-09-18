import { IndustrialRobotTemplate } from "./industrial-robot-v1/IndustrialRobotTemplate.jsx";
import manifest from "./industrial-robot-v1/manifest.json";
import { SAMPLE_INDUSTRIAL_ROBOT_DRAFT } from "./sampleIndustrialRobotDraft.js";

export const TEMPLATE_REGISTRY = {
  "industrial-robot-v1": {
    manifest,
    component: IndustrialRobotTemplate,
    sampleDraft: SAMPLE_INDUSTRIAL_ROBOT_DRAFT,
  },
};

export function resolveTemplate(templateId) {
  return TEMPLATE_REGISTRY[templateId] || TEMPLATE_REGISTRY["industrial-robot-v1"];
}

export { IndustrialRobotTemplate, SAMPLE_INDUSTRIAL_ROBOT_DRAFT };
