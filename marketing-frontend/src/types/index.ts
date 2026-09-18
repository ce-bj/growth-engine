// ── Flow state machine ────────────────────────────────────────────
export type FlowState =
  | 'IDLE'
  | 'DRAFTING_INTENT'
  | 'RESEARCHING'
  | 'COPY_DRAFT'
  | 'PAGE_GENERATING'
  | 'PAGE_EDITING'
  | 'PUBLISHED'

// ── Page types ────────────────────────────────────────────────────
export type PageType =
  | 'product-marketing'
  | 'lead-gen'
  | 'brand'
  | 'promotion'
  | 'exhibition'

// ── Message types (chat) ──────────────────────────────────────────
export type MessageRole = 'user' | 'assistant' | 'system'

export type MessageType = 'text' | 'thinking' | 'chips' | 'tool_call' | 'tool_result' | 'draft_section' | 'image'

export interface ChipOption {
  id: string
  label: string
}

export interface ChatMessage {
  id: string
  role: MessageRole
  type: MessageType
  content: string
  chips?: ChipOption[]
  timestamp: number
  agentName?: string
  isStreaming?: boolean
  imageUrl?: string     // for type === 'image'
  imagePlacement?: string
}

// ── Agent progress steps ──────────────────────────────────────────
export type AgentStep = 'research' | 'copywriting' | 'ui-design' | 'code-build'

export type StepStatus = 'pending' | 'active' | 'done'

export interface ProgressStep {
  id: AgentStep
  label: string
  status: StepStatus
  artifact?: string
}

// ── Draft sections (copy draft phase) ────────────────────────────
export type SectionStatus = 'pending' | 'confirmed' | 'editing'
export type DataSource = 'ai' | 'backend' | 'hybrid'

export interface DraftSection {
  id: string
  title: string
  content: string
  dataSource: DataSource
  status: SectionStatus
  bindingInfo?: string
  imageDescription?: string  // 此区块推荐配套的图片描述，供 AI 生成或用户参考
}

// ── Recognized info (L2 inferred data) ───────────────────────────
export interface RecognizedInfo {
  industry?: string
  mainProducts?: string
  targetMarket?: string
  competitors?: string[]
  language?: string
  sellingPoints?: string[]
  certifications?: string[]
  companyName?: string
  primaryColor?: string  // 从官网 CSS 提取的主色调
}

// ── Generated image ───────────────────────────────────────────────
export interface GeneratedImage {
  url: string
  placement: string   // hero / product / background / logo
  prompt: string
  isMock: boolean
}

// ── Auto-fetched company info (from logged-in backend account) ────
export interface CompanyInfo {
  name: string
  industry: string
  main_products: string
  website: string
  logo_url: string
  employee_count: string
  founded_year: string
  data_source: string
}

// ── Product option (used in L3 product picker) ───────────────────
export interface ProductOption {
  id: string
  name: string
  model: string
  category: string
  imageUrl: string
  price: string
  url: string
  certs: string[]
}

// ── Left-panel sidebar configuration (all optional) ───────────────
// Company info is NOT here — it comes from CompanyInfo (auto-fetched).
// These are optional overrides / additional context the user can add.
export interface SidebarFields {
  // 竞品网址（可选，用于联网对比调研，与公司信息无关）
  competitorUrls: string            // 逗号分隔，如 "https://a.com, https://b.com"
  // L1 影响质量（可选，对话中追问兜底）
  sellingPoints: string
  targetAudience: string
  contactInfo: string
  // L3 后台关联（可选）
  selectedForms: string[]           // form IDs
  selectedProducts: ProductOption[] // product objects with metadata
  // 品牌素材（可选）
  logoUrl: string                   // base64 data URL (user upload, overrides company logo)
  heroImageUrl: string              // base64 data URL
  // 设计偏好（可选）
  primaryColor: string
  language: string
  targetRegion: string
  // 功能开关
  enableImageGen: boolean           // 是否允许 Agent 主动调用图片生成
}

export const defaultSidebarFields: SidebarFields = {
  competitorUrls: '',
  sellingPoints: '',
  targetAudience: '',
  contactInfo: '',
  selectedForms: [],
  selectedProducts: [],
  logoUrl: '',
  heroImageUrl: '',
  primaryColor: '#4F46E5',
  language: '中文简体',
  targetRegion: '中国大陆',
  enableImageGen: false,
}

// ── Session state ─────────────────────────────────────────────────
export interface SessionState {
  sessionId: string
  flowState: FlowState
  pageType: PageType | null
  recognizedInfo: RecognizedInfo
  messages: ChatMessage[]
  draftSections: DraftSection[]
  generatedHtml: string
  progressSteps: ProgressStep[]
}

// ── SSE event from backend ────────────────────────────────────────
export type SSEEventType =
  | 'text'
  | 'thinking'
  | 'tool_call'
  | 'tool_result'
  | 'question'
  | 'draft_section'
  | 'page_patch'
  | 'flow_state'
  | 'step_update'
  | 'recognized_info'
  | 'image_generated'
  | 'done'
  | 'error'

export interface SSEEvent {
  type: SSEEventType
  data: Record<string, unknown>
  sessionId?: string
}
