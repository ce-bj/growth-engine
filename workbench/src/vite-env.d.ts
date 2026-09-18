/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PORTAL_URL?: string
  readonly VITE_OPS_ASSISTANT_URL?: string
  readonly VITE_VISITOR_ANALYSIS_URL?: string
  readonly VITE_MARKETING_AGENT_URL?: string
  readonly VITE_CONTENT_AGENT_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}


interface ImportMeta {
  readonly env: ImportMetaEnv
}
