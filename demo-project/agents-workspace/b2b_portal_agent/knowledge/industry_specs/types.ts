/** 用户侧 Agent 规范表类型 · 由 export-agent-content-spec.mjs 生成 */

export type ContentOutputShape =
  | 'overview'
  | 'title_selling_points'
  | 'image_meta'
  | 'text'
  | 'spec_table'
  | 'scenario_cards'
  | 'bullet_list'
  | 'step_list'
  | 'faq_list'
  | 'comparison_table'
  | 'doc_links'
  | 'changelog'

export type ContentModulePriority = 'required' | 'recommended'

export interface AgentModuleCatalogEntry {
  id: number
  name: string
  layer: 'A' | 'B'
  aiGeneratable: true
  outputShape: ContentOutputShape
  fieldTarget: string
  note?: string
}

export interface AgentModuleCatalog {
  version: string
  scope: 'user-agent-content-ab-only'
  description: string
  moduleCount: number
  modules: AgentModuleCatalogEntry[]
  outputShapeGlossary: Record<string, string>
}

export interface AgentContentModule {
  id: number
  name: string
  layer: 'A' | 'B'
  priority: ContentModulePriority
  outputShape: ContentOutputShape
  fieldTarget: string
  guidance: string | null
  note?: string
}

export interface AgentIndustryContentSpec {
  industryName: string
  productCategory: string
  industryType: string
  aliases: string[]
  contentModuleIds: number[]
  contentModules: AgentContentModule[]
}

export interface AgentIndustryContentSpecLibrary {
  version: string
  source: string
  derivedFrom: string
  generatedAt: string
  scope: 'user-agent-content-ab-only'
  scopeNote: string
  industryCount: number
  industries: AgentIndustryContentSpec[]
}

export interface AgentIndustryTypeFallbackTemplate {
  industryType: string
  industryCount: number
  contentModuleIds: number[]
  contentModules: AgentContentModule[]
}

export interface AgentIndustryTypeFallback {
  version: string
  source: string
  derivedFrom: string
  generatedAt: string
  scope: 'user-agent-content-ab-only'
  description: string
  templateCount: number
  templates: Record<string, AgentIndustryTypeFallbackTemplate>
}

export type AgentContentSpecMatch = 'exact' | 'fuzzy' | 'type-fallback' | 'default'

export interface ResolvedAgentContentSpec {
  match: AgentContentSpecMatch
  industryName: string
  productCategory: string
  industryType: string
  contentModuleIds: number[]
  contentModules: AgentContentModule[]
  /** Agent 不应生成的模块类型说明 */
  doNotGenerate: string[]
}
