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

export function marketingAgentUrl() {
  return lanServiceUrl(import.meta.env.VITE_MARKETING_AGENT_URL, 5186)
}

export function contentAgentUrl() {
  return lanServiceUrl(import.meta.env.VITE_CONTENT_AGENT_URL, 5178, '/?embed=1')
}

export function EmbedFrame({ src, title }: { src: string; title: string }) {
  return (
    <div className="admin-embed-wrap">
      <iframe className="admin-embed" src={src} title={title} allow="clipboard-read; clipboard-write" />
    </div>
  )
}
