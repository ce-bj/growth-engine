/**
 * UploadArea — 图片 / Logo 上传区域（拖拽或点击）。
 * 返回 base64 data URL，通过 onChange 传出。
 */
import { useState, useRef, useCallback } from 'react'
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  label: string
  hint?: string
  value: string            // base64 data URL 或 ""
  onChange: (dataUrl: string) => void
  accept?: string
  maxSizeMb?: number
  aspectHint?: string      // e.g. "建议 2:1"
}

export function UploadArea({
  label,
  hint,
  value,
  onChange,
  accept = 'image/*',
  maxSizeMb = 5,
  aspectHint,
}: Props) {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(
    (file: File) => {
      setError('')
      if (!file.type.startsWith('image/')) {
        setError('请上传图片文件')
        return
      }
      if (file.size > maxSizeMb * 1024 * 1024) {
        setError(`文件不超过 ${maxSizeMb}MB`)
        return
      }
      setLoading(true)
      const reader = new FileReader()
      reader.onload = e => {
        onChange((e.target?.result as string) ?? '')
        setLoading(false)
      }
      reader.onerror = () => { setLoading(false); setError('读取失败') }
      reader.readAsDataURL(file)
    },
    [onChange, maxSizeMb]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  if (value) {
    return (
      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
        <div className="relative">
          <img
            src={value}
            alt={label}
            className="w-full h-[72px] object-contain p-1 bg-gray-50"
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow"
          >
            <X size={10} />
          </button>
        </div>
        <div className="flex items-center justify-between px-2 py-1.5 border-t border-gray-100">
          <p className="text-[10px] text-gray-500">{label}</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-[10px] text-indigo-500 hover:text-indigo-700"
          >
            替换
          </button>
        </div>
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={onFileChange} />
      </div>
    )
  }

  return (
    <div>
      <div
        onClick={() => !loading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all min-h-[72px] px-2 py-3',
          dragging
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
        )}
      >
        {loading ? (
          <Loader2 size={18} className="text-indigo-400 animate-spin" />
        ) : dragging ? (
          <Upload size={18} className="text-indigo-500" />
        ) : (
          <ImageIcon size={18} className="text-gray-300" />
        )}
        <div className="text-center">
          <p className="text-[11px] font-medium text-gray-600">{label}</p>
          {hint && <p className="text-[9px] text-gray-400 mt-0.5">{hint}</p>}
          {aspectHint && <p className="text-[9px] text-gray-400">{aspectHint}</p>}
          {!hint && !aspectHint && (
            <p className="text-[9px] text-gray-400 mt-0.5">点击或拖拽上传</p>
          )}
        </div>
      </div>
      {error && <p className="text-[10px] text-red-500 mt-1 px-1">{error}</p>}
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={onFileChange} />
    </div>
  )
}
