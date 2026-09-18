import { useEffect, useRef, useState } from 'react'
import { Bot, User, Wrench, Loader2, Lightbulb, ImageIcon, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChatMessage, ChipOption } from '@/types'

interface Props {
  messages: ChatMessage[]
  isLoading: boolean
  onChipSelect: (chip: ChipOption) => void
}

// 工具名称 → 中文标签 + 颜色
const TOOL_META: Record<string, { label: string; color: string }> = {
  fetch_company_info:      { label: '获取公司信息',   color: 'bg-blue-50   text-blue-600   border-blue-200'   },
  fetch_product_list:      { label: '获取产品列表',   color: 'bg-blue-50   text-blue-600   border-blue-200'   },
  fetch_brand_assets:      { label: '获取品牌素材',   color: 'bg-blue-50   text-blue-600   border-blue-200'   },
  web_search_competitors:  { label: '竞品调研',       color: 'bg-purple-50 text-purple-600 border-purple-200' },
  analyze_industry:        { label: '行业分析',       color: 'bg-purple-50 text-purple-600 border-purple-200' },
  generate_copy_draft:     { label: '生成文字稿',     color: 'bg-green-50  text-green-600  border-green-200'  },
  rewrite_section:         { label: '改写区块',       color: 'bg-green-50  text-green-600  border-green-200'  },
  render_page:             { label: '渲染页面',       color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  modify_page:             { label: '修改页面',       color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  patch_page_style:        { label: '修改样式',       color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  generate_image:          { label: '生成图片',       color: 'bg-orange-50 text-orange-600 border-orange-200' },
}

export function MessageList({ messages, isLoading, onChipSelect }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, isLoading])

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center">
          <Bot size={32} className="text-indigo-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-800">智能营销落地页助手</p>
          <p className="text-sm text-gray-500 mt-1">选择页面类型，然后用一句话告诉我你想做什么</p>
        </div>
        <div className="flex flex-col gap-2 w-full max-w-xs text-left">
          {[
            '给工业电源做个面向欧美进口商的询盘页',
            '做个 SaaS 产品的免费试用落地页',
            '为广交会做个展位邀约页面',
          ].map(example => (
            <div key={example} className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
              &ldquo;{example}&rdquo;
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map(msg => (
        <MessageBubble key={msg.id} msg={msg} onChipSelect={onChipSelect} />
      ))}
      {isLoading && (
        <div className="flex items-center gap-2 pl-1">
          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            <Loader2 size={14} className="animate-spin text-indigo-600" />
          </div>
          <span className="text-sm text-gray-400">Agent 执行中…</span>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}

function MessageBubble({ msg, onChipSelect }: { msg: ChatMessage; onChipSelect: (c: ChipOption) => void }) {
  const [thinkingExpanded, setThinkingExpanded] = useState(false)

  // ── 系统错误/警告 ──────────────────────────────────────────────────────────
  if (msg.role === 'system') {
    const isError = msg.content.startsWith('❌') || msg.content.startsWith('⚠️')
    return (
      <div className={cn(
        'flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm border',
        isError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'
      )}>
        <AlertCircle size={15} className="mt-0.5 shrink-0" />
        <span>{msg.content}</span>
      </div>
    )
  }

  // ── 思考块（可折叠）────────────────────────────────────────────────────────
  if (msg.type === 'thinking') {
    const isStreaming = !!msg.isStreaming
    const preview = msg.content.slice(0, 60) + (msg.content.length > 60 ? '…' : '')

    return (
      <div className="flex items-start gap-2">
        {/* 左侧细线指示 */}
        <div className="flex flex-col items-center pt-1 shrink-0">
          <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
            {isStreaming
              ? <Loader2 size={10} className="animate-spin text-gray-400" />
              : <Lightbulb size={10} className="text-gray-400" />
            }
          </div>
          {thinkingExpanded && <div className="w-px flex-1 bg-gray-200 mt-1 min-h-[8px]" />}
        </div>

        <div className="flex-1 min-w-0">
          {/* 标题行（点击展开/收起）*/}
          <button
            onClick={() => !isStreaming && setThinkingExpanded(v => !v)}
            disabled={isStreaming}
            className={cn(
              'flex items-center gap-1.5 text-[11px] text-gray-400 w-full text-left',
              !isStreaming && 'hover:text-gray-600 cursor-pointer'
            )}
          >
            {isStreaming ? (
              <>
                <span className="italic">正在思考…</span>
                <span className="text-gray-300 truncate max-w-[200px]">{preview}</span>
              </>
            ) : (
              <>
                {thinkingExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                <span>思考过程</span>
                <span className="text-gray-300 truncate max-w-[200px]">{preview}</span>
              </>
            )}
          </button>

          {/* 展开内容 */}
          {thinkingExpanded && !isStreaming && (
            <div className="mt-1.5 text-xs text-gray-500 italic bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 leading-relaxed whitespace-pre-wrap">
              {msg.content}
            </div>
          )}

          {/* 流式时显示滚动内容（最后 80 字）*/}
          {isStreaming && msg.content.length > 0 && (
            <div className="mt-1 text-[11px] text-gray-400 italic truncate max-w-xs">
              {msg.content.slice(-80)}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── 工具调用 ──────────────────────────────────────────────────────────────
  if (msg.type === 'tool_call') {
    const toolName = msg.content || ''
    const meta = TOOL_META[toolName] ?? { label: toolName, color: 'bg-gray-100 text-gray-600 border-gray-300' }
    return (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
          <Wrench size={13} className="text-orange-500" />
        </div>
        <span className={cn(
          'inline-flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg border',
          meta.color
        )}>
          {meta.label}
          {toolName && meta.label !== toolName && (
            <span className="font-mono text-xs opacity-50">{toolName}</span>
          )}
        </span>
      </div>
    )
  }

  if (msg.type === 'tool_result') return null

  // ── 用户消息 ──────────────────────────────────────────────────────────────
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="flex items-end gap-2 max-w-[80%]">
          <div className="bg-indigo-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed">
            {msg.content}
          </div>
          <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
            <User size={14} className="text-gray-600" />
          </div>
        </div>
      </div>
    )
  }

  // ── 图片消息 ──────────────────────────────────────────────────────────────
  if (msg.type === 'image') {
    return (
      <div className="flex items-start gap-2">
        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
          <ImageIcon size={13} className="text-indigo-600" />
        </div>
        <div className="space-y-2 max-w-xs">
          {msg.imageUrl && (
            <img src={msg.imageUrl} alt={msg.content}
              className="rounded-xl border border-gray-200 w-full shadow-sm" />
          )}
          <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
            {msg.content}
          </p>
        </div>
      </div>
    )
  }

  // ── 选项 chip 消息 ────────────────────────────────────────────────────────
  if (msg.type === 'chips') {
    return (
      <div className="flex items-start gap-2">
        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
          <Bot size={14} className="text-indigo-600" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-gray-800 max-w-sm">
            {msg.content}
          </div>
          {msg.chips && (
            <div className="flex flex-wrap gap-2">
              {msg.chips.map(chip => (
                <button key={chip.id} onClick={() => onChipSelect(chip)}
                  className="px-3 py-1.5 text-xs font-medium bg-white border-2 border-indigo-200 text-indigo-700 rounded-full hover:bg-indigo-50 hover:border-indigo-400 transition-all">
                  {chip.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── 普通 assistant 文本 ───────────────────────────────────────────────────
  return (
    <div className="flex items-start gap-2">
      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
        <Bot size={14} className="text-indigo-600" />
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-gray-800 max-w-sm shadow-sm leading-relaxed">
        {msg.content}
        {msg.isStreaming && <span className="inline-block w-1 h-4 bg-indigo-500 ml-0.5 animate-pulse rounded-sm" />}
      </div>
    </div>
  )
}
