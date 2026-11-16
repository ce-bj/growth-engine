function lanServiceUrl(explicit: string | undefined, port: number, suffix = '/') {
  const host = window.location.hostname || '127.0.0.1'
  if (explicit) {
    try {
      const url = new URL(explicit, window.location.origin)
      if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
        url.hostname = host
      }
      return url.toString()
    } catch {
      return explicit
    }
  }
  const path = suffix.startsWith('/') ? suffix : `/${suffix}`
  return `http://${host}:${port}${path}`
}

export function visitorAnalysisUrl() {
  return lanServiceUrl(import.meta.env.VITE_VISITOR_ANALYSIS_URL, 5177)
}

/** 访客行为分析里单独拆出的数据看板（?view=board） */
export function dataBoardUrl() {
  const url = new URL(visitorAnalysisUrl(), window.location.origin)
  url.searchParams.set('view', 'board')
  return url.toString()
}

export function marketingAgentUrl() {
  return lanServiceUrl(import.meta.env.VITE_MARKETING_AGENT_URL, 5186)
}

export function contentAgentUrl() {
  return lanServiceUrl(import.meta.env.VITE_CONTENT_AGENT_URL, 5178, '/?embed=1')
}

/** 数字门户里的 AI 运营助手对话界面（?embed=assistant）。
 *  线上若只配了门户根地址，也要补上 embed，否则门户会跳到一期工作台的 AI Ready。 */
export function opsAssistantUrl() {
  const raw = lanServiceUrl(import.meta.env.VITE_OPS_ASSISTANT_URL, 5174, '/?embed=assistant')
  try {
    const url = new URL(raw, window.location.origin)
    if (!url.searchParams.get('embed')) url.searchParams.set('embed', 'assistant')
    return url.toString()
  } catch {
    return raw
  }
}

/** 工作台悬浮窗：同一套会话和对话，精简操作 */
export function opsAssistantFloatUrl() {
  const url = new URL(opsAssistantUrl(), window.location.origin)
  url.searchParams.set('embed', 'float')
  url.hash = ''
  return url.toString()
}

export function EmbedFrame({ src, title }: { src: string; title: string }) {
  return (
    <div className="admin-embed-wrap">
      <iframe className="admin-embed" src={src} title={title} allow="clipboard-read; clipboard-write" />
    </div>
  )
}
