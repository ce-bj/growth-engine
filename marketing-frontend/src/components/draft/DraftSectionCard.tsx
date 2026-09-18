import { useState } from 'react'
import { Check, RefreshCw, Pencil, Trash2, Link, Loader2, Edit3, Save, X, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { DraftSection } from '@/types'

interface Props {
  section: DraftSection
  onConfirm: () => void
  onRewrite: (instructions: string) => void
  onRegenerate: () => void
  onDelete: () => void
  onDirectEdit: (newContent: string) => void  // 直接编辑（本地，不调 AI）
  isLoading?: boolean
}

export function DraftSectionCard({
  section,
  onConfirm,
  onRewrite,
  onRegenerate,
  onDelete,
  onDirectEdit,
  isLoading,
}: Props) {
  const [mode, setMode] = useState<'view' | 'ai-rewrite' | 'direct-edit'>('view')
  const [instructions, setInstructions] = useState('')
  const [editContent, setEditContent] = useState(section.content)

  // Keep editContent in sync when section content changes externally
  if (mode === 'view' && editContent !== section.content) {
    setEditContent(section.content)
  }

  const handleRewrite = () => {
    if (instructions.trim()) {
      onRewrite(instructions.trim())
      setInstructions('')
      setMode('view')
    }
  }

  const handleSaveDirect = () => {
    onDirectEdit(editContent)
    setMode('view')
  }

  const handleCancelEdit = () => {
    setEditContent(section.content)
    setMode('view')
  }

  const isConfirmed = section.status === 'confirmed'
  const isBackend = section.dataSource === 'backend' || section.dataSource === 'hybrid'

  return (
    <div
      className={cn(
        'rounded-xl border bg-white transition-all',
        isConfirmed ? 'border-green-200 bg-green-50/30' : 'border-gray-200',
        isLoading && 'opacity-60 pointer-events-none'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-gray-800 truncate">{section.title}</span>
          {isBackend && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-blue-600 bg-blue-50 rounded-full px-2 py-0.5 border border-blue-100 shrink-0">
              <Link size={9} /> 来自后台
            </span>
          )}
          {section.dataSource === 'ai' && (
            <span className="text-[10px] font-medium text-indigo-500 bg-indigo-50 rounded-full px-2 py-0.5 border border-indigo-100 shrink-0">
              AI 生成
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isConfirmed && (
            <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
              <Check size={12} /> 已确认
            </div>
          )}
          {isLoading && <Loader2 size={13} className="animate-spin text-indigo-500" />}
        </div>
      </div>

      {/* Content — view or direct-edit mode */}
      <div className="px-4 pb-2">
        {mode === 'direct-edit' ? (
          <textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            rows={Math.max(4, editContent.split('\n').length + 1)}
            className="w-full text-xs border border-indigo-300 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 resize-y font-sans leading-relaxed bg-indigo-50/30"
            autoFocus
          />
        ) : (
          <pre
            className={cn(
              'text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed rounded-xl p-3 border border-gray-100',
              isConfirmed ? 'bg-green-50/40' : 'bg-gray-50'
            )}
          >
            {section.content}
          </pre>
        )}
        {section.bindingInfo && (
          <p className="text-[11px] text-blue-500 mt-1.5 flex items-center gap-1">
            <Link size={10} /> {section.bindingInfo}
          </p>
        )}
        {section.imageDescription && (
          <div className="mt-2 flex items-start gap-2 rounded-lg border border-dashed border-amber-300 bg-amber-50/60 px-3 py-2">
            <ImageIcon size={13} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-amber-700">图片占位</p>
              <p className="text-[10px] text-amber-600 leading-relaxed mt-0.5">{section.imageDescription}</p>
            </div>
          </div>
        )}
      </div>

      {/* Direct edit actions */}
      {mode === 'direct-edit' && (
        <div className="flex items-center gap-1.5 px-4 pb-3">
          <Button
            size="sm"
            onClick={handleSaveDirect}
            disabled={!editContent.trim()}
            className="h-7 text-xs gap-1"
          >
            <Save size={11} /> 保存
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-7 text-xs gap-1">
            <X size={11} /> 取消
          </Button>
        </div>
      )}

      {/* AI rewrite box */}
      {mode === 'ai-rewrite' && (
        <div className="px-4 pb-3 flex gap-2">
          <input
            autoFocus
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRewrite()}
            placeholder={'改写方向，如"语气更亲切，突出价格优势"'}
            className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-1.5 outline-none focus:border-indigo-400"
          />
          <Button size="sm" onClick={handleRewrite} disabled={!instructions.trim()} className="h-7 text-xs">
            AI 改写
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setMode('view')} className="h-7 text-xs">
            <X size={11} />
          </Button>
        </div>
      )}

      {/* Action bar (view mode only) */}
      {mode === 'view' && !isConfirmed && (
        <div className="flex items-center gap-1.5 px-4 pb-3 flex-wrap">
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
            className="h-7 text-xs bg-green-600 hover:bg-green-700 gap-1"
          >
            <Check size={11} /> 确认
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setMode('ai-rewrite')}
            disabled={isLoading}
            className="h-7 text-xs gap-1"
          >
            <Pencil size={11} /> AI 改写
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setEditContent(section.content); setMode('direct-edit') }}
            disabled={isLoading}
            className="h-7 text-xs gap-1"
          >
            <Edit3 size={11} /> 直接编辑
          </Button>
          {!isBackend && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRegenerate}
              disabled={isLoading}
              className="h-7 text-xs gap-1"
            >
              <RefreshCw size={11} /> 换一版
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            disabled={isLoading}
            className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 ml-auto gap-1"
          >
            <Trash2 size={11} /> 删除
          </Button>
        </div>
      )}

      {/* Confirmed — undo */}
      {mode === 'view' && isConfirmed && (
        <div className="flex items-center gap-3 px-4 pb-3">
          <button
            onClick={onConfirm}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            撤销确认
          </button>
          <button
            onClick={() => { setEditContent(section.content); setMode('direct-edit') }}
            className="text-xs text-indigo-400 hover:text-indigo-600 transition-colors flex items-center gap-1"
          >
            <Edit3 size={10} /> 直接编辑
          </button>
        </div>
      )}
    </div>
  )
}
