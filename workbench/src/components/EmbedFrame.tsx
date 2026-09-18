export const VISITOR_ANALYSIS_URL =
  import.meta.env.VITE_VISITOR_ANALYSIS_URL || 'http://127.0.0.1:5177/'

export const MARKETING_AGENT_URL =
  import.meta.env.VITE_MARKETING_AGENT_URL || 'http://127.0.0.1:5186/'

export const CONTENT_AGENT_URL =
  import.meta.env.VITE_CONTENT_AGENT_URL || 'http://127.0.0.1:5178/?embed=1'

export function EmbedFrame({ src, title }: { src: string; title: string }) {
  return (
    <div className="admin-embed-wrap">
      <iframe className="admin-embed" src={src} title={title} allow="clipboard-read; clipboard-write" />
    </div>
  )
}
