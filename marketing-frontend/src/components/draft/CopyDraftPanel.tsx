import { CheckCheck, Wand2, Loader2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DraftSectionCard } from './DraftSectionCard'
import type { DraftSection } from '@/types'

interface Props {
  sections: DraftSection[]
  allConfirmed: boolean
  isLoading: boolean
  onConfirmSection: (id: string, action: 'confirm' | 'rewrite' | 'regenerate' | 'delete', instructions?: string) => void
  onConfirmAll: () => void
  onGeneratePage: () => void
  onDirectEdit: (id: string, newContent: string) => void
}

export function CopyDraftPanel({
  sections,
  allConfirmed,
  isLoading,
  onConfirmSection,
  onConfirmAll,
  onGeneratePage,
  onDirectEdit,
}: Props) {
  const confirmedCount = sections.filter(s => s.status === 'confirmed').length

  if (sections.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8 text-gray-400">
        <FileText size={40} className="opacity-40" />
        <p className="text-sm">文字稿生成后会显示在这里</p>
        <p className="text-xs">Agent 完成文案撰写后，逐段确认内容再生成页面</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">文字稿</span>
          <span className="text-xs text-gray-500">
            {confirmedCount}/{sections.length} 已确认
          </span>
          {isLoading && <Loader2 size={13} className="animate-spin text-indigo-500" />}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onConfirmAll}
            disabled={allConfirmed || isLoading}
            className="h-7 text-xs gap-1"
          >
            <CheckCheck size={11} /> 全部采纳
          </Button>
          <Button
            size="sm"
            onClick={onGeneratePage}
            disabled={!allConfirmed || isLoading}
            className="h-7 text-xs gap-1"
          >
            <Wand2 size={11} /> 生成页面
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100 shrink-0">
        <div
          className="h-full bg-indigo-500 transition-all duration-500"
          style={{ width: sections.length > 0 ? `${(confirmedCount / sections.length) * 100}%` : '0%' }}
        />
      </div>

      {/* Cards */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {sections.map(section => (
            <DraftSectionCard
              key={section.id}
              section={section}
              isLoading={isLoading}
              onConfirm={() => {
                const action = section.status === 'confirmed' ? 'delete' : 'confirm'
                onConfirmSection(section.id, action)
              }}
              onRewrite={instructions => onConfirmSection(section.id, 'rewrite', instructions)}
              onRegenerate={() => onConfirmSection(section.id, 'regenerate')}
              onDelete={() => onConfirmSection(section.id, 'delete')}
              onDirectEdit={newContent => onDirectEdit(section.id, newContent)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
