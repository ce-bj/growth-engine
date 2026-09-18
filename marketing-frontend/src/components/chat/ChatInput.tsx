import { useState, useRef, type KeyboardEvent } from 'react'
import { Send, Sparkles, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  onSend: (text: string) => void
  onAbort?: () => void
  disabled?: boolean
  isLoading?: boolean
  placeholder?: string
  showAutoDecide?: boolean
  onAutoDecide?: () => void
}

export function ChatInput({ onSend, onAbort, disabled, isLoading, placeholder, showAutoDecide, onAutoDecide }: Props) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const submit = () => {
    const text = value.trim()
    if (!text || disabled) return
    onSend(text)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const handleInput = () => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`
    }
  }

  return (
    <div className="border-t border-gray-100 bg-white p-3">
      {showAutoDecide && onAutoDecide && (
        <div className="flex justify-end mb-2">
          <button
            onClick={onAutoDecide}
            disabled={disabled}
            className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1 transition-colors"
          >
            <Sparkles size={12} />
            你帮我决定
          </button>
        </div>
      )}
      <div className={cn(
        'flex items-end gap-2 bg-gray-50 rounded-2xl border border-gray-200 px-3 py-2 transition-all',
        'focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100',
        disabled && !isLoading && 'opacity-60'
      )}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          disabled={disabled}
          placeholder={isLoading ? 'AI 正在思考中…' : (placeholder ?? '输入消息… (Enter 发送，Shift+Enter 换行)')}
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none max-h-40 leading-relaxed"
        />
        {isLoading && onAbort ? (
          <Button
            size="icon"
            onClick={onAbort}
            className="h-8 w-8 shrink-0 rounded-xl bg-red-500 hover:bg-red-600"
            title="中断"
          >
            <Square size={13} fill="white" />
          </Button>
        ) : (
          <Button
            size="icon"
            disabled={disabled || !value.trim()}
            onClick={submit}
            className="h-8 w-8 shrink-0 rounded-xl"
          >
            <Send size={15} />
          </Button>
        )}
      </div>
    </div>
  )
}
