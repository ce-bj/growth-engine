import { Sparkles, Edit2 } from 'lucide-react'
import type { RecognizedInfo } from '@/types'

interface Props {
  info: RecognizedInfo
}

export function RecognizedInfoCard({ info }: Props) {
  const entries = Object.entries(info).filter(([, v]) => v && (Array.isArray(v) ? v.length > 0 : true))
  if (entries.length === 0) return null

  const labels: Record<string, string> = {
    industry: '所属行业',
    mainProducts: '主营产品',
    targetMarket: '目标市场',
    competitors: '竞品',
    language: '语言',
  }

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700">
        <Sparkles size={13} />
        已识别信息
        <span className="ml-auto text-indigo-400 text-[10px] font-normal">AI 推断</span>
      </div>
      <div className="space-y-1.5">
        {entries.map(([key, val]) => (
          <div key={key} className="flex items-start justify-between gap-2">
            <span className="text-[11px] text-gray-500 shrink-0">{labels[key] ?? key}</span>
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-gray-800 text-right">
                {Array.isArray(val) ? val.join('、') : val as string}
              </span>
              <button className="text-gray-400 hover:text-indigo-600 transition-colors">
                <Edit2 size={10} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
