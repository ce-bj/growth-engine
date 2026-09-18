import { useEffect } from 'react'
import { X } from 'lucide-react'
import type { ToastItem } from '../types'

interface Props {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}

export function ToastStack({ toasts, onDismiss }: Props) {
  useEffect(() => {
    const timers = toasts
      .filter((t) => t.autoDismiss)
      .map((t) =>
        window.setTimeout(() => {
          onDismiss(t.id)
        }, 3000),
      )
    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [toasts, onDismiss])

  if (toasts.length === 0) return null

  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.type}`}>
          <span>{t.message}</span>
          <button
            type="button"
            className="toast__close"
            aria-label="关闭"
            onClick={() => onDismiss(t.id)}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
