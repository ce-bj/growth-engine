import { Search, PenLine, Palette, Code2, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { ProgressStep } from '@/types'

const ICONS = {
  research: <Search size={16} />,
  copywriting: <PenLine size={16} />,
  'ui-design': <Palette size={16} />,
  'code-build': <Code2 size={16} />,
}

interface Props {
  steps: ProgressStep[]
}

export function ProgressBar({ steps }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="flex items-center gap-1 px-4 py-3 border-b border-gray-100 bg-white">
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-center flex-1">
          <button
            onClick={() => step.artifact && setExpanded(expanded === step.id ? null : step.id)}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-1.5 px-2 rounded-lg transition-all',
              step.status === 'active' && 'bg-indigo-50',
              step.artifact && 'cursor-pointer hover:bg-gray-50'
            )}
          >
            <div
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all',
                step.status === 'done' && 'border-indigo-500 bg-indigo-500 text-white',
                step.status === 'active' && 'border-indigo-500 text-indigo-600 bg-white animate-pulse',
                step.status === 'pending' && 'border-gray-200 text-gray-400 bg-white'
              )}
            >
              {ICONS[step.id]}
            </div>
            <span
              className={cn(
                'text-[10px] font-medium whitespace-nowrap',
                step.status === 'done' && 'text-indigo-600',
                step.status === 'active' && 'text-indigo-600',
                step.status === 'pending' && 'text-gray-400'
              )}
            >
              {step.label}
              {step.artifact && <ChevronDown size={10} className="inline ml-0.5" />}
            </span>
          </button>
          {i < steps.length - 1 && (
            <div
              className={cn(
                'h-[2px] w-4 shrink-0 rounded-full',
                step.status === 'done' ? 'bg-indigo-400' : 'bg-gray-200'
              )}
            />
          )}
        </div>
      ))}
      {expanded && steps.find(s => s.id === expanded)?.artifact && (
        <div className="absolute top-16 left-4 right-4 z-10 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-xs text-gray-700 max-h-48 overflow-auto">
          <pre className="whitespace-pre-wrap">{steps.find(s => s.id === expanded)?.artifact}</pre>
        </div>
      )}
    </div>
  )
}
