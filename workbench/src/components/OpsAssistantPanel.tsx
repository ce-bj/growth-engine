import { X } from 'lucide-react'

function assistantEmbedUrl() {
  const explicit = import.meta.env.VITE_OPS_ASSISTANT_URL as string | undefined
  const host = window.location.hostname || '127.0.0.1'
  const url = new URL(explicit || `http://${host}:5174/`, window.location.origin)
  if (!explicit && (url.hostname === '127.0.0.1' || url.hostname === 'localhost')) {
    url.hostname = host
  } else if (explicit && (url.hostname === '127.0.0.1' || url.hostname === 'localhost')) {
    url.hostname = host
  }
  url.searchParams.set('embed', 'assistant')
  return url.toString()
}

interface Props {
  open: boolean
  loaded: boolean
  onClose: () => void
}

export function OpsAssistantPanel({ open, loaded, onClose }: Props) {
  if (!loaded) return null

  return (
    <aside
      className={`ops-assistant${open ? ' is-open' : ' is-hidden'}`}
      aria-hidden={!open}
      aria-label="AI 运营助手"
    >
      <div className="ops-assistant__bar">
        <div>
          <strong>AI 运营助手</strong>
          <small>工作台仍在左侧，可一边看数一边对话</small>
        </div>
        <button type="button" className="ops-assistant__close" onClick={onClose} aria-label="关闭运营助手">
          <X size={16} />
        </button>
      </div>
      <iframe
        className="ops-assistant__frame"
        title="AI 运营助手"
        src={assistantEmbedUrl()}
        allow="clipboard-read; clipboard-write"
      />
    </aside>
  )
}
