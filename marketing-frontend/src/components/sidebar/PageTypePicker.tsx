import { Package, Users, Award, Zap, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PageType } from '@/types'

interface PageTypeConfig {
  id: PageType
  label: string
  icon: React.ReactNode
  color: string
}

const PAGE_TYPES: PageTypeConfig[] = [
  { id: 'product-marketing', label: '产品营销', icon: <Package size={20} />, color: 'text-indigo-600' },
  { id: 'lead-gen', label: '留资获客', icon: <Users size={20} />, color: 'text-emerald-600' },
  { id: 'brand', label: '品牌实力', icon: <Award size={20} />, color: 'text-amber-600' },
  { id: 'promotion', label: '促销活动', icon: <Zap size={20} />, color: 'text-orange-600' },
  { id: 'exhibition', label: '展会邀请', icon: <Calendar size={20} />, color: 'text-purple-600' },
]

interface Props {
  value: PageType | null
  onChange: (type: PageType) => void
  disabled?: boolean
}

export function PageTypePicker({ value, onChange, disabled }: Props) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-gray-500 px-1">页面类型</p>
      <div className="grid grid-cols-2 gap-2">
        {PAGE_TYPES.slice(0, 4).map(pt => (
          <button
            key={pt.id}
            disabled={disabled}
            onClick={() => onChange(pt.id)}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-xs font-medium transition-all hover:border-indigo-300',
              value === pt.id
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span className={pt.color}>{pt.icon}</span>
            {pt.label}
          </button>
        ))}
      </div>
      <div className="px-0.5">
        {PAGE_TYPES.slice(4).map(pt => (
          <button
            key={pt.id}
            disabled={disabled}
            onClick={() => onChange(pt.id)}
            className={cn(
              'w-full flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-xs font-medium transition-all hover:border-indigo-300',
              value === pt.id
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span className={pt.color}>{pt.icon}</span>
            {pt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
