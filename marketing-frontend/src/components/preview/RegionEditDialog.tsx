/**
 * RegionEditDialog — 点击预览页面中的区块后弹出的悬浮 AI 对话框。
 * 用户用自然语言描述修改意图，发送给 Agent 修改对应区域。
 */
import { useState, useRef, useEffect } from 'react'
import { X, Sparkles, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface RegionClickInfo {
  regionId: number
  regionName: string
  regionText: string
}

interface Props {
  region: RegionClickInfo
  onSend: (instruction: string) => void
  onClose: () => void
  isLoading?: boolean
}

const QUICK_ACTIONS: Record<string, string[]> = {
  'nav': ['换一个 Logo 样式', '修改导航链接文字', '修改 CTA 按钮文案'],
  'hero': ['换一个更吸引人的标题', '副标题更专业简洁', '修改 CTA 按钮颜色', 'Hero 区背景换色'],
  'features': ['增加一个卖点', '卖点描述更详细', '用数据支撑每个卖点', '图标换成更合适的'],
  'products': ['产品卡片排列调整', '加上询盘按钮', '突出显示最热销产品'],
  'trust': ['客户案例更具体', '加入具体数字', '加入客户评价引语'],
  'form': ['减少表单字段', '表单标题更有吸引力', '加入隐私声明', '提交按钮更醒目'],
  'footer': ['加入更多联系方式', '加入 ICP 备案号', '修改版权信息'],
}

const DEFAULT_ACTIONS = ['换一个更好的文案', '内容更简洁有力', '更专业的表达', '针对欧美客户优化']

export function RegionEditDialog({ region, onSend, onClose, isLoading }: Props) {
  const [instruction, setInstruction] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 50)
  }, [region.regionId])

  const quickActions = QUICK_ACTIONS[region.regionName] ?? DEFAULT_ACTIONS

  const handleSend = () => {
    const text = instruction.trim()
    if (!text || isLoading) return
    onSend(`请修改「${region.regionName}」区域：${text}`)
    setInstruction('')
  }

  const handleQuick = (action: string) => {
    onSend(`请修改「${region.regionName}」区域：${action}`)
  }

  return (
    <div className="absolute bottom-4 right-4 z-50 w-[300px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 text-white">
        <div className="flex items-center gap-2">
          <Sparkles size={14} />
          <span className="text-sm font-semibold">编辑 · {region.regionName}</span>
        </div>
        <button
          onClick={onClose}
          className="hover:bg-indigo-700 rounded-lg p-0.5 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Region text preview */}
      {region.regionText && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
          <p className="text-[10px] text-gray-400 mb-0.5 font-medium uppercase tracking-wide">当前内容</p>
          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{region.regionText}</p>
        </div>
      )}

      {/* Quick actions */}
      <div className="px-3 py-2.5 border-b border-gray-100">
        <p className="text-[10px] text-gray-400 mb-1.5 font-medium">快捷操作</p>
        <div className="flex flex-wrap gap-1.5">
          {quickActions.map(action => (
            <button
              key={action}
              type="button"
              onClick={() => handleQuick(action)}
              disabled={isLoading}
              className={cn(
                'text-[10px] bg-gray-100 hover:bg-indigo-100 hover:text-indigo-700',
                'text-gray-600 rounded-full px-2.5 py-1 transition-colors disabled:opacity-50'
              )}
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Custom instruction */}
      <div className="p-3">
        <textarea
          ref={textareaRef}
          value={instruction}
          onChange={e => setInstruction(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
          }}
          placeholder={`告诉 AI 如何修改「${region.regionName}」…`}
          rows={2}
          disabled={isLoading}
          className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-400 resize-none placeholder:text-gray-400 disabled:opacity-60"
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-[10px] text-gray-400">Enter 发送</p>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!instruction.trim() || isLoading}
            className="gap-1.5 h-7 text-xs"
          >
            {isLoading
              ? <Loader2 size={11} className="animate-spin" />
              : <Send size={11} />
            }
            发送
          </Button>
        </div>
      </div>
    </div>
  )
}
