import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, Rocket, History, Globe, RefreshCw, Send,
  ChevronDown, ChevronUp, Sparkles, Loader2, Settings,
  Package, Building2, ImageIcon, Palette, Languages,
  ExternalLink, Edit3, Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { PageTypePicker } from '@/components/sidebar/PageTypePicker'
import { RecognizedInfoCard } from '@/components/sidebar/RecognizedInfoCard'
import { FormPickerDropdown } from '@/components/sidebar/FormPickerDropdown'
import { ProductPickerModal, type ProductOption } from '@/components/sidebar/ProductPickerModal'
import { UploadArea } from '@/components/sidebar/UploadArea'
import { ProgressBar } from '@/components/chat/ProgressBar'
import { MessageList } from '@/components/chat/MessageList'
import { ChatInput } from '@/components/chat/ChatInput'
import { CopyDraftPanel } from '@/components/draft/CopyDraftPanel'
import { PreviewPanel } from '@/components/preview/PreviewPanel'
import { ModelSetupDialog } from '@/components/setup/ModelSetupDialog'
import { useSession } from '@/hooks/useSession'
import { cn } from '@/lib/utils'
import type { PageType, ChipOption, SidebarFields, CompanyInfo } from '@/types'
import { defaultSidebarFields } from '@/types'
import {
  fetchHistoryList, fetchHistoryItem, patchHistoryItem,
  deleteHistoryItem as apiDeleteHistory,
  clearHistory as apiClearHistory,
  imageMetaFromDataUrl,
  type HistorySummary,
} from '@/api/session'
import type { ChatMessage, DraftSection } from '@/types'

const PAGE_TYPE_LABELS: Record<PageType, string> = {
  'product-marketing': '产品营销',
  'lead-gen':          '留资获客',
  'brand':             '品牌实力',
  'promotion':         '促销活动',
  'exhibition':        '展会邀请',
}

const COLOR_PRESETS = [
  { name: '智能紫', value: '#4F46E5' },
  { name: '科技蓝', value: '#2563EB' },
  { name: '商务绿', value: '#059669' },
  { name: '活力橙', value: '#EA580C' },
  { name: '玫瑰红', value: '#E11D48' },
  { name: '沉稳灰', value: '#374151' },
]

/** Survives React StrictMode remount so wizard launch does not double-start. */
const startedLaunchNonces = new Set<number>()

// ── Build AI context message ─────────────────────────────────────
function buildContextMessage(
  companyInfo: CompanyInfo | null,
  fields: SidebarFields,
  pageType: PageType | null,
  userText: string,
): string {
  const parts: string[] = []
  if (pageType) parts.push(`页面类型：${PAGE_TYPE_LABELS[pageType]}`)

  // Company info from backend
  if (companyInfo) {
    parts.push(`公司名称：${companyInfo.name}`)
    parts.push(`所属行业：${companyInfo.industry}`)
    parts.push(`主营产品：${companyInfo.main_products}`)
    if (companyInfo.website) parts.push(`官网：${companyInfo.website}`)
  }

  // 竞品网址（用于联网调研，与公司信息无关）
  if (fields.competitorUrls) parts.push(`竞品网址：${fields.competitorUrls}`)

  // L1 optional overrides
  if (fields.sellingPoints)  parts.push(`核心卖点：${fields.sellingPoints}`)
  if (fields.targetAudience) parts.push(`目标买家：${fields.targetAudience}`)
  if (fields.contactInfo)    parts.push(`联系方式：${fields.contactInfo}`)
  if (fields.language !== '中文简体') parts.push(`语言：${fields.language}`)
  if (fields.targetRegion)   parts.push(`目标地区：${fields.targetRegion}`)
  if (fields.primaryColor !== '#4F46E5') parts.push(`主色调：${fields.primaryColor}`)

  // L3 selections
  if (fields.selectedForms.length > 0)
    parts.push(`收集表单：${fields.selectedForms.join('、')}`)
  if (fields.selectedProducts.length > 0)
    parts.push(`展示产品：${fields.selectedProducts.map(p => p.name).join('、')}`)

  // Brand assets
  if (fields.logoUrl)      parts.push(`Logo：已上传`)
  if (fields.heroImageUrl) parts.push(`主图：已上传`)

  // Feature flags
  parts.push(`图片生成：${fields.enableImageGen ? '已开启' : '已关闭'}`)

  const configBlock = parts.length > 0 ? `[配置信息]\n${parts.join('\n')}\n\n` : ''
  const needBlock   = userText.trim()
    ? `[需求]\n${userText.trim()}`
    : `[需求]\n请根据以上配置信息生成落地页`
  return configBlock + needBlock
}

export default function MarketingLandingPage({
  launch = null,
  onBackToWizard,
}: {
  launch?: { pageType: PageType; contextMessage: string; nonce?: number } | null
  onBackToWizard?: () => void
} = {}) {
  // ── UI state ──────────────────────────────────────────────────
  const [moreOpen,       setMoreOpen]       = useState(false)
  const [historyOpen,    setHistoryOpen]    = useState(false)
  const [centerTab,      setCenterTab]      = useState<'chat' | 'draft'>('chat')
  const [idleInput,      setIdleInput]      = useState('')
  const [showModelSetup, setShowModelSetup] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingCompany,   setEditingCompany]   = useState(false)
  // 对话附件工具栏（对话进行中可补充产品/Logo/主图）
  const [chatAttachOpen,   setChatAttachOpen]   = useState(false)
  const [showChatProductModal, setShowChatProductModal] = useState(false)

  // ── Preview pane resize ────────────────────────────────────────
  const [previewWidth,      setPreviewWidth]      = useState(440)
  const [previewFullscreen, setPreviewFullscreen] = useState(false)
  const isDraggingRef    = useRef(false)
  const dragStartXRef    = useRef(0)
  const dragStartWRef    = useRef(0)

  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current  = true
    dragStartXRef.current  = e.clientX
    dragStartWRef.current  = previewWidth
    e.preventDefault()
  }, [previewWidth])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      const delta = dragStartXRef.current - e.clientX   // drag left → wider preview
      const next  = Math.max(300, Math.min(900, dragStartWRef.current + delta))
      setPreviewWidth(next)
    }
    const onUp = () => {
      isDraggingRef.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }
  }, [])

  // Esc to exit fullscreen
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewFullscreen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Model config — persisted in sessionStorage
  const [modelConfig, setModelConfig] = useState<{ credentialId: string; modelName: string } | null>(() => {
    try {
      const s = sessionStorage.getItem('marketing_model_cfg')
      return s ? JSON.parse(s) as { credentialId: string; modelName: string } : null
    } catch { return null }
  })

  // ── Auto-fetch company info from backend ──────────────────────
  // Docs: GET /marketing/company-info → CompanyInfo
  // Real production: replace mock data in backend/router.py COMPANY_API_ENDPOINT
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null)
  const [companyLoading, setCompanyLoading] = useState(true)

  useEffect(() => {
    fetch('/marketing/company-info', { headers: { 'X-User-ID': 'dev' } })
      .then(r => r.ok ? r.json() : null)
      .then((data: CompanyInfo | null) => {
        if (data) setCompanyInfo(data)
      })
      .catch(() => {/* silently ignore, agent will ask if needed */})
      .finally(() => setCompanyLoading(false))
  }, [])

  // ── Sidebar optional fields ────────────────────────────────────
  const [fields, setFields] = useState<SidebarFields>(defaultSidebarFields)
  const setField = <K extends keyof SidebarFields>(key: K, val: SidebarFields[K]) =>
    setFields(prev => ({ ...prev, [key]: val }))

  // Company name override (shown when user clicks "修改")
  const [companyOverride, setCompanyOverride] = useState('')

  // ── Session ────────────────────────────────────────────────────
  const {
    flowState, pageType, setPageType,
    messages, draftSections, generatedHtml,
    progressSteps, recognizedInfo, isLoading,
    allSectionsConfirmed,
    startSession, sendMessage, abortChat,
    confirmSection, editSectionContent, confirmAll,
    generatePage, patchPage, restoreSession,
    agentId, sessionId,
  } = useSession()

  const launchOnce = useRef<number | null>(null)
  useEffect(() => {
    if (!launch) return
    const token = launch.nonce
    if (token == null) return
    if (launchOnce.current === token || startedLaunchNonces.has(token)) return
    launchOnce.current = token
    startedLaunchNonces.add(token)
    startSession(launch.pageType, launch.contextMessage, modelConfig?.credentialId, modelConfig?.modelName)
    setCenterTab('chat')
  }, [launch, startSession, modelConfig])

  const isActive = flowState !== 'IDLE'

  // 官网主色调自动应用：fetch_company_info 提取到颜色后，若用户未手动修改主色，自动应用
  useEffect(() => {
    if (recognizedInfo.primaryColor && fields.primaryColor === defaultSidebarFields.primaryColor) {
      setFields(prev => ({ ...prev, primaryColor: recognizedInfo.primaryColor! }))
    }
  }, [recognizedInfo.primaryColor])

  // ── History state（从后端加载）────────────────────────────────────
  const [historyItems, setHistoryItems] = useState<HistorySummary[]>([])
  // 用于刷新历史列表
  const refreshHistory = useCallback(() => {
    fetchHistoryList().then(setHistoryItems)
  }, [])

  // 初始化时加载历史
  useEffect(() => { refreshHistory() }, [refreshHistory])

  // Auto-switch to draft tab when sections arrive
  if (draftSections.length > 0 && flowState === 'COPY_DRAFT' && centerTab !== 'draft') {
    setCenterTab('draft')
  }

  // Inject uploaded images into generated HTML (post-process)
  const processedHtml = useMemo(() => {
    if (!generatedHtml) return ''
    let html = generatedHtml
    const effectiveLogo = fields.logoUrl || companyInfo?.logo_url || ''
    if (effectiveLogo && !fields.logoUrl && companyInfo?.logo_url) {
      // Already injected via context, skip
    }
    if (fields.logoUrl) {
      html = html.replace(/https?:\/\/placehold\.co\/200x[^"']*/g, fields.logoUrl)
    }
    if (fields.heroImageUrl) {
      html = html.replace(/https?:\/\/placehold\.co\/1200x[^"']*/g, fields.heroImageUrl)
    }
    return html
  }, [generatedHtml, fields.logoUrl, fields.heroImageUrl, companyInfo?.logo_url])

  // ── 自动同步历史记录（messages + draft_sections）───────────────
  // 触发时机：在 PAGE_EDITING 状态下每次 Agent 完成一轮（isLoading false）
  // Middleware 已在后端写好 html 条目，前端负责 PATCH 上 messages + draftSections
  useEffect(() => {
    if (flowState !== 'PAGE_EDITING' || isLoading || !sessionId) return

    // 1s 防抖，避免 loading 快速切换时重复请求
    const t = setTimeout(async () => {
      // 只保存有意义的消息：用户文本、助手文本/图片/chips、系统提示
      // 跳过 tool_call / tool_result / thinking（噪音太多）
      const filteredMessages: ChatMessage[] = messages
        .filter(m =>
          m.role === 'user' ||
          m.role === 'system' ||
          (m.role === 'assistant' && (m.type === 'text' || m.type === 'image' || m.type === 'chips'))
        )
        .map(m => ({ ...m, isStreaming: false }))

      await patchHistoryItem(sessionId, {
        messages:       filteredMessages,
        draftSections,
      })
      refreshHistory()
    }, 1000)

    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowState, isLoading, sessionId])
  // 注意：故意不把 messages/draftSections 加入依赖，
  // 只在 isLoading 变化（每轮结束）时触发一次，避免每条消息都 PATCH

  // ── Start session ──────────────────────────────────────────────
  const doStart = (text: string) => {
    if (!pageType) return
    // modelConfig 为可选：未手动配置时传 undefined，后端回退到 .env 的
    // DEFAULT_MODEL_NAME + 默认 credential。需要切换模型可点设置按钮打开弹窗。

    const effectiveCompany: CompanyInfo | null = companyOverride
      ? { ...(companyInfo ?? { industry:'', main_products:'', website:'', logo_url:'', employee_count:'', founded_year:'', data_source:'override' }), name: companyOverride }
      : companyInfo

    const contextMsg = buildContextMessage(effectiveCompany, fields, pageType, text)
    startSession(pageType, contextMsg, modelConfig?.credentialId, modelConfig?.modelName)
    setIdleInput('')
    setCenterTab('chat')
  }

  const handleModelConfigComplete = (credentialId: string, modelName: string) => {
    const cfg = { credentialId, modelName }
    setModelConfig(cfg)
    sessionStorage.setItem('marketing_model_cfg', JSON.stringify(cfg))
    setShowModelSetup(false)
    if (pageType) {
      const effectiveCompany = companyOverride
        ? { ...(companyInfo ?? { industry:'', main_products:'', website:'', logo_url:'', employee_count:'', founded_year:'', data_source:'override' }), name: companyOverride }
        : companyInfo
      const contextMsg = buildContextMessage(effectiveCompany, fields, pageType, idleInput)
      startSession(pageType, contextMsg, credentialId, modelName)
      setIdleInput('')
      setCenterTab('chat')
    }
  }

  const handleChipSelect  = (chip: ChipOption) => sendMessage(chip.label, 'chip')
  const handleAutoDecide  = () => sendMessage('你帮我决定', 'auto_decide')
  const handleGeneratePage = async () => { await generatePage(); setCenterTab('chat') }
  const handlePublish     = () => alert('发布功能需配置域名，当前为开发模式。')
  const handleActiveChat  = (msg: string) =>
    (flowState === 'PAGE_EDITING' ? patchPage : sendMessage)(msg)

  // ── 对话中补充附件 ─────────────────────────────────────────────
  const handleChatProductConfirm = (products: import('@/components/sidebar/ProductPickerModal').ProductOption[]) => {
    setField('selectedProducts', products)
    setShowChatProductModal(false)
    if (products.length > 0) {
      const names = products.map(p => p.name).join('、')
      sendMessage(`我补充了产品信息，请在落地页中展示以下产品：${names}`, 'upload_products')
    }
    setChatAttachOpen(false)
  }

  const handleChatLogoUpload = (dataUrl: string) => {
    setField('logoUrl', dataUrl)
    if (dataUrl) {
      const img = imageMetaFromDataUrl(dataUrl, 'logo')
      sendMessage(
        '我上传了公司 Logo，请在落地页中使用这个 Logo',
        'upload_logo',
        { images: img ? [img] : [] },
      )
    }
    setChatAttachOpen(false)
  }

  const handleChatHeroUpload = (dataUrl: string) => {
    setField('heroImageUrl', dataUrl)
    if (dataUrl) {
      const img = imageMetaFromDataUrl(dataUrl, 'hero')
      sendMessage(
        '我上传了主图，请将这张图片用作落地页 Hero 区域的背景图',
        'upload_hero',
        { images: img ? [img] : [] },
      )
    }
    setChatAttachOpen(false)
  }

  // ── Context summary chips (for idle hero display) ──────────────
  const contextChips: string[] = []
  if (companyInfo) contextChips.push(companyInfo.name)
  if (fields.sellingPoints) contextChips.push(`卖点: ${fields.sellingPoints.split(',')[0]}…`)
  if (fields.selectedForms.length)    contextChips.push(`${fields.selectedForms.length}个表单`)
  if (fields.selectedProducts.length) contextChips.push(`${fields.selectedProducts.length}个产品`)
  if (fields.logoUrl) contextChips.push('已上传Logo')

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {showModelSetup && (
        <ModelSetupDialog onComplete={handleModelConfigComplete} onSkip={() => setShowModelSetup(false)} />
      )}
      {showProductModal && (
        <ProductPickerModal
          selectedIds={fields.selectedProducts.map((p: ProductOption) => p.id)}
          onConfirm={products => setField('selectedProducts', products)}
          onClose={() => setShowProductModal(false)}
        />
      )}
      {showChatProductModal && (
        <ProductPickerModal
          selectedIds={fields.selectedProducts.map((p: ProductOption) => p.id)}
          onConfirm={handleChatProductConfirm}
          onClose={() => setShowChatProductModal(false)}
        />
      )}

      {/* ── Top nav ────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-4 h-12 border-b border-gray-200 bg-white shrink-0 z-10">
        <button
          type="button"
          className="text-gray-500 hover:text-gray-800"
          onClick={() => onBackToWizard?.()}
          title={onBackToWizard ? '返回选词' : undefined}
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <Rocket size={17} className="text-indigo-600" />
          <span className="font-semibold text-gray-900 text-sm">营销落地页</span>
        </div>
        <Badge variant="secondary" className="text-xs gap-1">
          <Sparkles size={10} /> 竞品调研优先
        </Badge>
        <Separator orientation="vertical" className="h-5 mx-1" />
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Globe size={12} />
          <span className="font-mono">未绑定域名</span>
          <button className="flex items-center gap-1 text-indigo-500 hover:text-indigo-700">
            <RefreshCw size={11} /> 切换网站
          </button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowModelSetup(true)}
            className={cn(
              'flex items-center gap-1.5 text-xs border rounded-lg px-3 h-7 transition-colors',
              modelConfig
                ? 'text-green-700 border-green-200 bg-green-50 hover:bg-green-100'
                : 'text-orange-600 border-orange-200 bg-orange-50 hover:bg-orange-100'
            )}
          >
            <Settings size={12} />
            {modelConfig ? modelConfig.modelName : '配置模型'}
          </button>
          <div className="relative">
            <button
              onClick={() => setHistoryOpen(v => !v)}
              className="flex items-center gap-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg px-3 h-7 hover:bg-gray-50"
            >
              <History size={12} /> 历史记录
              {historyItems.length > 0 && (
                <span className="bg-indigo-100 text-indigo-700 rounded-full px-1.5 text-[10px]">
                  {historyItems.length}
                </span>
              )}
            </button>
            {historyOpen && (
              <div className="absolute right-0 top-9 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
                  <span className="text-xs font-medium text-gray-500">最近生成</span>
                  {historyItems.length > 0 && (
                    <button
                      onClick={async () => {
                        if (confirm('清空所有历史记录？')) {
                          await apiClearHistory()
                          setHistoryItems([])
                          setHistoryOpen(false)
                        }
                      }}
                      className="text-[10px] text-gray-400 hover:text-red-500 flex items-center gap-0.5 transition-colors"
                    >
                      <Trash2 size={9} /> 清空
                    </button>
                  )}
                </div>

                {/* Items */}
                {historyItems.length === 0 ? (
                  <div className="px-3 py-6 text-center text-xs text-gray-400">
                    暂无历史记录
                    <br />
                    <span className="text-[10px]">生成落地页后自动保存</span>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {historyItems.map(h => (
                      <div key={h.id} className="group flex items-start gap-0 border-b border-gray-50 last:border-0">
                        <button
                          onClick={async () => {
                            const detail = await fetchHistoryItem(h.id)
                            if (!detail) return
                            restoreSession({
                              html:          detail.html,
                              pageType:      detail.page_type as PageType,
                              agentId:       detail.agent_id,
                              sessionId:     detail.session_id,
                              messages:      detail.messages      as ChatMessage[]  | undefined,
                              draftSections: detail.draft_sections as DraftSection[] | undefined,
                            })
                            setHistoryOpen(false)
                            // 有文字稿就切到文字稿 tab，否则切到对话
                            setCenterTab(
                              (detail.draft_sections as unknown[])?.length ? 'draft' : 'chat'
                            )
                          }}
                          className="flex-1 text-left px-3 py-2.5 hover:bg-gray-50 transition-colors min-w-0"
                        >
                          <p className="text-sm font-medium text-gray-800 truncate">{h.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full px-1.5 py-px">
                              {PAGE_TYPE_LABELS[h.page_type as PageType] ?? h.page_type}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(h.updated_at).toLocaleString('zh-CN', {
                                month: '2-digit', day: '2-digit',
                                hour: '2-digit', minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </button>
                        {/* 单条删除 */}
                        <button
                          onClick={async e => {
                            e.stopPropagation()
                            await apiDeleteHistory(h.id)
                            refreshHistory()
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 mt-2 mr-1 text-gray-300 hover:text-red-400"
                          title="删除此记录"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <Button size="sm" onClick={handlePublish}
            disabled={flowState !== 'PAGE_EDITING' && flowState !== 'PUBLISHED'}
            className="h-7 text-xs gap-1.5"
          >
            <Send size={12} /> 发布
          </Button>
        </div>
      </header>

      {/* ── Main 3-column layout ──────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left sidebar ────────────────────────────────────── */}
        <aside className="w-[272px] shrink-0 flex flex-col border-r border-gray-200 bg-white overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-3">

              {/* 1. 页面类型选择 */}
              <PageTypePicker
                value={pageType}
                onChange={t => !isActive && setPageType(t)}
                disabled={isActive}
              />

              {/* 2. 公司信息（自动获取）*/}
              <CompanyInfoPanel
                info={companyInfo}
                loading={companyLoading}
                override={companyOverride}
                onOverrideChange={setCompanyOverride}
                editing={editingCompany}
                onEditToggle={() => setEditingCompany(v => !v)}
              />

              {/* 3. 更多配置（可选，折叠）*/}
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setMoreOpen(v => !v)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    更多配置
                    <span className="text-[10px] text-gray-400 font-normal">（可选）</span>
                  </span>
                  {moreOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>

                {moreOpen && (
                  <div className="border-t border-gray-100 p-3 space-y-4">

                    {/* ── 竞品网址 ── */}
                    <SidebarSection label="竞品参考" color="purple"
                      hint="填写对手官网，Agent 联网分析对比，生成差异化内容">
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-1">竞品网址</label>
                        <textarea
                          value={fields.competitorUrls}
                          onChange={e => setField('competitorUrls', e.target.value)}
                          placeholder="https://competitor-a.com&#10;https://competitor-b.com"
                          disabled={isActive}
                          rows={2}
                          className={cn(
                            'w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none resize-none',
                            'focus:border-indigo-400 placeholder:text-gray-400 leading-relaxed',
                            isActive && 'bg-gray-50 text-gray-400 cursor-not-allowed'
                          )}
                        />
                        <p className="text-[9px] text-gray-400 mt-0.5">每行一个网址；留空则按行业关键词自动搜索</p>
                      </div>
                    </SidebarSection>

                    {/* ── L1 影响质量 ── */}
                    <SidebarSection label="L1 影响质量" color="orange"
                      hint="填写后 AI 生成质量更好，不填也可在对话中追问">
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-1">核心卖点</label>
                        <textarea
                          value={fields.sellingPoints}
                          onChange={e => setField('sellingPoints', e.target.value)}
                          placeholder="如：自有工厂15年,48h打样,CE认证"
                          disabled={isActive}
                          rows={2}
                          className={cn(
                            'w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none resize-none',
                            'focus:border-indigo-400 placeholder:text-gray-400 leading-relaxed',
                            isActive && 'bg-gray-50 text-gray-400 cursor-not-allowed'
                          )}
                        />
                        <p className="text-[9px] text-gray-400 mt-0.5">逗号分隔多个卖点</p>
                      </div>
                      <SidebarInput
                        label="目标买家"
                        value={fields.targetAudience}
                        onChange={v => setField('targetAudience', v)}
                        placeholder="如：欧美进口商、工程师采购"
                        disabled={isActive}
                      />
                      <SidebarInput
                        label="联系方式"
                        value={fields.contactInfo}
                        onChange={v => setField('contactInfo', v)}
                        placeholder="邮箱、电话或微信"
                        disabled={isActive}
                      />
                    </SidebarSection>

                    {/* ── L3 后台关联 ── */}
                    <SidebarSection label="L3 后台关联" color="green"
                      hint="选择表单类型与展示产品，AI 将据此生成对应内容">
                      {/* Form picker */}
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-1.5">
                          表单收集字段
                        </label>
                        <FormPickerDropdown
                          value={fields.selectedForms}
                          onChange={v => setField('selectedForms', v)}
                        />
                      </div>

                      {/* Product picker */}
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-1.5">产品关联</label>
                        <button
                          type="button"
                          onClick={() => setShowProductModal(true)}
                          className="w-full flex items-center gap-2 text-xs border border-gray-200 rounded-lg px-2.5 py-2 hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-left"
                        >
                          <Package size={11} className="text-gray-400 shrink-0" />
                          <span className="text-gray-500 flex-1 truncate">
                            {fields.selectedProducts.length > 0
                              ? `已关联 ${fields.selectedProducts.length} 个产品`
                              : '点击选择展示产品'}
                          </span>
                          {fields.selectedProducts.length > 0 && (
                            <span className="bg-indigo-100 text-indigo-700 rounded-full px-1.5 text-[10px] font-bold shrink-0">
                              {fields.selectedProducts.length}
                            </span>
                          )}
                        </button>
                        {fields.selectedProducts.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {fields.selectedProducts.slice(0, 3).map((p: ProductOption) => (
                              <span key={p.id}
                                className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-2 py-0.5 max-w-[120px] truncate">
                                {p.model || p.name.slice(0, 10)}
                              </span>
                            ))}
                            {fields.selectedProducts.length > 3 && (
                              <span className="text-[10px] text-gray-400">+{fields.selectedProducts.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </SidebarSection>

                    {/* ── 品牌素材 ── */}
                    <SidebarSection label="品牌素材" color="purple"
                      hint="上传后自动注入落地页，优先级高于后台素材">
                      <div className="grid grid-cols-2 gap-2">
                        <UploadArea
                          label="Logo"
                          hint="点击上传"
                          aspectHint="建议 2:1"
                          value={fields.logoUrl}
                          onChange={v => setField('logoUrl', v)}
                        />
                        <UploadArea
                          label="主图"
                          hint="点击上传"
                          aspectHint="建议 16:9"
                          value={fields.heroImageUrl}
                          onChange={v => setField('heroImageUrl', v)}
                        />
                      </div>
                      {(fields.logoUrl || fields.heroImageUrl) && (
                        <p className="text-[10px] text-indigo-500 flex items-center gap-1">
                          <ImageIcon size={9} /> 生成页面时自动注入
                        </p>
                      )}
                      {/* AI 图片生成开关 */}
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <p className="text-[10px] font-medium text-gray-700 flex items-center gap-1">
                            <Sparkles size={9} className="text-amber-500" /> AI 生成图片
                          </p>
                          <p className="text-[9px] text-gray-400 mt-0.5">
                            {fields.enableImageGen ? '生成后 Agent 将自动配图' : '关闭时 Agent 不主动配图'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setField('enableImageGen', !fields.enableImageGen)}
                          className={cn(
                            'relative w-9 h-5 rounded-full transition-colors shrink-0',
                            fields.enableImageGen ? 'bg-amber-500' : 'bg-gray-200'
                          )}
                          aria-label="AI 生成图片开关"
                        >
                          <span className={cn(
                            'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                            fields.enableImageGen && 'translate-x-4'
                          )} />
                        </button>
                      </div>
                    </SidebarSection>

                    {/* ── 设计偏好 ── */}
                    <SidebarSection label="设计偏好" color="blue">
                      {/* Color picker */}
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-1.5 flex items-center gap-1">
                          <Palette size={9} /> 主色调
                        </label>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {COLOR_PRESETS.map(c => (
                            <button
                              key={c.value}
                              type="button"
                              onClick={() => setField('primaryColor', c.value)}
                              title={c.name}
                              className={cn(
                                'w-5 h-5 rounded-full border-2 transition-transform hover:scale-110',
                                fields.primaryColor === c.value
                                  ? 'border-gray-700 scale-110'
                                  : 'border-white shadow-sm'
                              )}
                              style={{ background: c.value }}
                            />
                          ))}
                          <input
                            type="color"
                            value={fields.primaryColor}
                            onChange={e => setField('primaryColor', e.target.value)}
                            className="w-5 h-5 rounded border border-gray-200 cursor-pointer p-0 overflow-hidden"
                            title="自定义颜色"
                          />
                          <span className="text-[10px] text-gray-400 font-mono">{fields.primaryColor}</span>
                        </div>
                      </div>
                      {/* Language + region */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-gray-500 mb-1 flex items-center gap-1">
                            <Languages size={9} /> 语言
                          </label>
                          <select
                            value={fields.language}
                            onChange={e => setField('language', e.target.value)}
                            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-indigo-400"
                          >
                            <option>中文简体</option>
                            <option>中文繁体</option>
                            <option>英文</option>
                            <option>中英双语</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 block mb-1">目标地区</label>
                          <input
                            type="text"
                            value={fields.targetRegion}
                            onChange={e => setField('targetRegion', e.target.value)}
                            placeholder="中国大陆"
                            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-indigo-400"
                          />
                        </div>
                      </div>
                    </SidebarSection>

                    {/* ── L2 AI 推断（调研后出现）── */}
                    {Object.keys(recognizedInfo).length > 0 && (
                      <SidebarSection label="L2 AI 推断" color="blue"
                        hint="调研后自动填入，可在对话中修改">
                        {recognizedInfo.industry && (
                          <ReadOnlyRow label="行业" value={recognizedInfo.industry} />
                        )}
                        {recognizedInfo.targetMarket && (
                          <ReadOnlyRow label="目标市场" value={recognizedInfo.targetMarket} />
                        )}
                        {recognizedInfo.sellingPoints && recognizedInfo.sellingPoints.length > 0 && (
                          <div>
                            <span className="text-[10px] text-gray-500">推荐卖点</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {recognizedInfo.sellingPoints.slice(0, 3).map(sp => (
                                <span key={sp} className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">{sp}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </SidebarSection>
                    )}
                  </div>
                )}
              </div>

              {/* 4. RecognizedInfoCard（调研后展示）*/}
              {recognizedInfo.certifications && recognizedInfo.certifications.length > 0 && (
                <RecognizedInfoCard info={recognizedInfo} />
              )}
            </div>
          </ScrollArea>
          {/* 注：已移除底部"AI 智能生成落地页"按钮，使用中央输入区的"开始生成"统一触发 */}
        </aside>

        {/* ── Center workspace ──────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          {!isActive ? (
            <IdleHero
              value={idleInput}
              onChange={setIdleInput}
              onStart={doStart}
              pageType={pageType}
              contextChips={contextChips}
            />
          ) : (
            <Tabs
              value={centerTab}
              onValueChange={v => setCenterTab(v as 'chat' | 'draft')}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="shrink-0 bg-white border-b border-gray-100">
                <div className="flex items-center px-4 pt-2.5 gap-4">
                  <TabsList className="h-8">
                    <TabsTrigger value="chat" className="h-6 text-xs">对话</TabsTrigger>
                    <TabsTrigger value="draft" className="h-6 text-xs flex items-center gap-1">
                      文字稿
                      {draftSections.length > 0 && (
                        <span className="bg-indigo-100 text-indigo-700 rounded-full px-1.5 text-[10px]">
                          {draftSections.filter(s => s.status === 'confirmed').length}/{draftSections.length}
                        </span>
                      )}
                    </TabsTrigger>
                  </TabsList>
                  {isLoading && (
                    <div className="flex items-center gap-1.5 text-xs text-indigo-500 ml-2">
                      <Loader2 size={12} className="animate-spin" /> Agent 运行中
                    </div>
                  )}
                </div>
                <ProgressBar steps={progressSteps} />
              </div>

              <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden mt-0">
                <MessageList messages={messages} isLoading={isLoading} onChipSelect={handleChipSelect} />

                {/* ── 对话附件工具栏 ── */}
                {isActive && (
                  <ChatAttachBar
                    open={chatAttachOpen}
                    onToggle={() => setChatAttachOpen(v => !v)}
                    onProductClick={() => { setChatAttachOpen(false); setShowChatProductModal(true) }}
                    onLogoUpload={handleChatLogoUpload}
                    onHeroUpload={handleChatHeroUpload}
                    selectedProductCount={fields.selectedProducts.length}
                    hasLogo={!!fields.logoUrl}
                    hasHero={!!fields.heroImageUrl}
                    disabled={isLoading}
                  />
                )}

                <ChatInput
                  onSend={handleActiveChat}
                  onAbort={abortChat}
                  disabled={isLoading}
                  isLoading={isLoading}
                  placeholder={
                    flowState === 'PAGE_EDITING'
                      ? '对 AI 说：换个主色调、生成 hero 图、把产品区移前面…'
                      : '输入消息，或说"帮我生成一张图"…'
                  }
                  showAutoDecide={flowState === 'DRAFTING_INTENT' || flowState === 'RESEARCHING'}
                  onAutoDecide={handleAutoDecide}
                />
              </TabsContent>

              <TabsContent value="draft" className="flex-1 flex flex-col overflow-hidden mt-0">
                <CopyDraftPanel
                  sections={draftSections}
                  allConfirmed={allSectionsConfirmed}
                  isLoading={isLoading}
                  onConfirmSection={confirmSection}
                  onConfirmAll={confirmAll}
                  onGeneratePage={handleGeneratePage}
                  onDirectEdit={editSectionContent}
                />
              </TabsContent>
            </Tabs>
          )}
        </main>

        {/* ── Drag divider ──────────────────────────────────── */}
        <div
          onMouseDown={handleDividerMouseDown}
          className="w-1 shrink-0 bg-gray-200 hover:bg-indigo-400 active:bg-indigo-500 cursor-col-resize transition-colors select-none"
          title="拖动调整预览区宽度"
        />

        {/* ── Right preview pane ────────────────────────────── */}
        <aside
          style={{ width: `${previewWidth}px` }}
          className="shrink-0 flex flex-col overflow-hidden"
        >
          <PreviewPanel
            html={processedHtml}
            flowState={flowState}
            isLoading={isLoading}
            onPatchPage={patchPage}
            isFullscreen={false}
            onToggleFullscreen={() => setPreviewFullscreen(true)}
          />
        </aside>
      </div>

      {/* ── Fullscreen preview overlay ───────────────────────── */}
      {previewFullscreen && (
        <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
          <PreviewPanel
            html={processedHtml}
            flowState={flowState}
            isLoading={isLoading}
            onPatchPage={patchPage}
            isFullscreen={true}
            onToggleFullscreen={() => setPreviewFullscreen(false)}
          />
        </div>
      )}
    </div>
  )
}

// ── Company Info Panel ────────────────────────────────────────────

interface CompanyInfoPanelProps {
  info: CompanyInfo | null
  loading: boolean
  override: string
  onOverrideChange: (v: string) => void
  editing: boolean
  onEditToggle: () => void
}

function CompanyInfoPanel({ info, loading, override, onOverrideChange, editing, onEditToggle }: CompanyInfoPanelProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-3 bg-gray-50 rounded-xl border border-gray-200">
        <Loader2 size={13} className="animate-spin text-gray-400" />
        <span className="text-xs text-gray-400">加载公司信息…</span>
      </div>
    )
  }

  if (!info) return null

  const displayName = override || info.name

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-1.5">
          <Building2 size={12} className="text-gray-500" />
          <span className="text-xs font-semibold text-gray-700">公司信息</span>
          <span className="text-[10px] text-gray-400 bg-white border border-gray-200 rounded-full px-1.5 py-0.5">
            {info.data_source === 'mock' ? '示例数据' : '已同步'}
          </span>
        </div>
        <button
          onClick={onEditToggle}
          className="text-[10px] text-indigo-500 hover:text-indigo-700 flex items-center gap-0.5 transition-colors"
        >
          <Edit3 size={9} /> {editing ? '收起' : '修改'}
        </button>
      </div>

      {/* Content */}
      <div className="px-3 py-2.5 space-y-1.5">
        {editing ? (
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-500">公司名称（覆盖）</label>
            <input
              type="text"
              value={override}
              onChange={e => onOverrideChange(e.target.value)}
              placeholder={info.name}
              className="w-full text-xs border border-indigo-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500 bg-indigo-50/30"
              autoFocus
            />
            <p className="text-[10px] text-gray-400">留空则使用后台数据：{info.name}</p>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold text-gray-800 truncate" title={displayName}>
              {displayName}
            </p>
            {override && <p className="text-[10px] text-indigo-500">已覆盖后台数据</p>}
          </>
        )}

        <div className="space-y-1">
          <InfoRow icon="🏭" label="行业" value={info.industry} />
          <InfoRow icon="📦" label="主营" value={info.main_products} />
          {info.website && (
            <a
              href={`https://${info.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[10px] text-indigo-500 hover:text-indigo-700 transition-colors"
            >
              <ExternalLink size={9} />
              {info.website}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-1.5">
      <span className="text-[10px] w-3">{icon}</span>
      <span className="text-[10px] text-gray-400 shrink-0">{label}：</span>
      <span className="text-[10px] text-gray-700 leading-tight line-clamp-1">{value}</span>
    </div>
  )
}

// ── Idle hero ─────────────────────────────────────────────────────

interface IdleHeroProps {
  value: string
  onChange: (v: string) => void
  onStart: (text: string) => void
  pageType: PageType | null
  contextChips: string[]
}

function IdleHero({ value, onChange, onStart, pageType, contextChips }: IdleHeroProps) {
  const suggestions = [
    '给我们的工业电源做个面向欧美进口商的询盘页',
    '做个 SaaS 产品的 14 天免费试用落地页',
    '为广交会 E 区 12 号展位做一个邀约页面',
    '给本地装修公司做个留资获客落地页',
  ]

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
      <div className="text-center space-y-2 max-w-lg">
        <h2 className="text-2xl font-bold text-gray-900">
          {pageType ? `${PAGE_TYPE_LABELS[pageType]} 落地页` : '智能营销落地页'}
        </h2>
        <p className="text-sm text-gray-500">
          用一句话描述你的业务，AI 自动调研竞品、生成文字稿、构建页面
        </p>
        {contextChips.length > 0 && (
          <div className="flex items-center justify-center gap-1.5 flex-wrap pt-1">
            <span className="text-xs text-gray-400">已配置：</span>
            {contextChips.map(s => (
              <span key={s}
                className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-full px-2 py-0.5">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Main input */}
      <div className={cn(
        'w-full max-w-xl bg-white rounded-2xl border-2 transition-all shadow-sm',
        pageType ? 'border-indigo-300' : 'border-gray-200'
      )}>
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onStart(value) }
          }}
          placeholder={
            !pageType
              ? '先在左侧选择页面类型，再描述你的业务…'
              : `例如：${suggestions[0]}`
          }
          disabled={!pageType}
          rows={3}
          className="w-full resize-none bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none p-4 leading-relaxed rounded-2xl"
        />
        <div className="flex items-center justify-between px-4 pb-3">
          <span className="text-xs text-gray-400">Enter 发送，Shift+Enter 换行</span>
          <Button onClick={() => onStart(value)} disabled={!pageType} className="gap-2">
            <Sparkles size={14} /> 开始生成
          </Button>
        </div>
      </div>

      {/* Example suggestions */}
      <div className="w-full max-w-xl">
        <p className="text-xs text-gray-400 mb-2 text-center">示例</p>
        <div className="grid grid-cols-2 gap-2">
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => onChange(s)}
              disabled={!pageType}
              className="text-left text-xs text-gray-600 bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-xl px-3 py-2.5 transition-all disabled:opacity-40"
            >
              &ldquo;{s}&rdquo;
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Sidebar helper sub-components ─────────────────────────────────

type SectionColor = 'red' | 'orange' | 'blue' | 'green' | 'purple'

function SidebarSection({ label, color, hint, children }: {
  label: string
  color: SectionColor
  hint?: string
  children: React.ReactNode
}) {
  const colors: Record<SectionColor, string> = {
    red:    'text-red-600 bg-red-50 border-red-100',
    orange: 'text-orange-600 bg-orange-50 border-orange-100',
    blue:   'text-blue-600 bg-blue-50 border-blue-100',
    green:  'text-green-600 bg-green-50 border-green-100',
    purple: 'text-purple-600 bg-purple-50 border-purple-100',
  }
  return (
    <div className="space-y-2">
      <div>
        <span className={cn('inline-block text-[10px] font-semibold rounded-full px-2 py-0.5 border', colors[color])}>
          {label}
        </span>
        {hint && <p className="text-[9px] text-gray-400 mt-0.5">{hint}</p>}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function SidebarInput({ label, value, onChange, placeholder, disabled }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <div className="space-y-0.5">
      <label className="text-[10px] text-gray-500">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none transition-colors',
          disabled
            ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
            : 'bg-white focus:border-indigo-400 text-gray-700'
        )}
      />
    </div>
  )
}

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] text-gray-500 shrink-0">{label}</span>
      <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-1.5 py-0.5 truncate max-w-[140px]">
        {value}
      </span>
    </div>
  )
}

// ── 对话附件工具栏 ─────────────────────────────────────────────────

interface ChatAttachBarProps {
  open: boolean
  onToggle: () => void
  onProductClick: () => void
  onLogoUpload: (dataUrl: string) => void
  onHeroUpload: (dataUrl: string) => void
  selectedProductCount: number
  hasLogo: boolean
  hasHero: boolean
  disabled: boolean
}

function ChatAttachBar({
  open, onToggle, onProductClick, onLogoUpload, onHeroUpload,
  selectedProductCount, hasLogo, hasHero, disabled,
}: ChatAttachBarProps) {
  const logoInputRef = useRef<HTMLInputElement>(null)
  const heroInputRef = useRef<HTMLInputElement>(null)

  const readFile = (file: File, onDone: (url: string) => void) => {
    if (!file.type.startsWith('image/')) return
    const r = new FileReader()
    r.onload = e => onDone((e.target?.result as string) ?? '')
    r.readAsDataURL(file)
  }

  return (
    <div className="border-t border-gray-100 bg-white">
      {/* 收起状态：仅显示小按钮 */}
      <div className="flex items-center gap-1.5 px-3 py-1.5">
        <button
          onClick={onToggle}
          disabled={disabled}
          className={cn(
            'flex items-center gap-1 text-[10px] rounded-lg border px-2 py-1 transition-colors',
            open
              ? 'border-indigo-300 text-indigo-600 bg-indigo-50'
              : 'border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50'
          )}
        >
          <Package size={10} /> 附件补充
        </button>
        {selectedProductCount > 0 && (
          <span className="text-[9px] text-indigo-500 bg-indigo-50 border border-indigo-100 rounded-full px-1.5 py-0.5">
            {selectedProductCount} 个产品
          </span>
        )}
        {hasLogo && (
          <span className="text-[9px] text-indigo-500 bg-indigo-50 border border-indigo-100 rounded-full px-1.5 py-0.5">
            Logo ✓
          </span>
        )}
        {hasHero && (
          <span className="text-[9px] text-indigo-500 bg-indigo-50 border border-indigo-100 rounded-full px-1.5 py-0.5">
            主图 ✓
          </span>
        )}
      </div>

      {/* 展开状态：显示附件选项 */}
      {open && (
        <div className="border-t border-gray-100 px-3 py-2.5 flex items-start gap-3">
          {/* 产品关联 */}
          <button
            onClick={onProductClick}
            disabled={disabled}
            className="flex flex-col items-center gap-1 min-w-[56px] p-2 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-center"
          >
            <Package size={16} className={selectedProductCount > 0 ? 'text-indigo-500' : 'text-gray-400'} />
            <span className="text-[9px] text-gray-600">产品关联</span>
            {selectedProductCount > 0 && (
              <span className="text-[9px] text-indigo-600 font-medium">{selectedProductCount} 个</span>
            )}
          </button>

          {/* Logo 上传 */}
          <button
            onClick={() => logoInputRef.current?.click()}
            disabled={disabled}
            className="flex flex-col items-center gap-1 min-w-[56px] p-2 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-center"
          >
            <ImageIcon size={16} className={hasLogo ? 'text-indigo-500' : 'text-gray-400'} />
            <span className="text-[9px] text-gray-600">Logo</span>
            {hasLogo && <span className="text-[9px] text-green-600 font-medium">已上传</span>}
          </button>

          {/* 主图上传 */}
          <button
            onClick={() => heroInputRef.current?.click()}
            disabled={disabled}
            className="flex flex-col items-center gap-1 min-w-[56px] p-2 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-center"
          >
            <ImageIcon size={16} className={hasHero ? 'text-amber-500' : 'text-gray-400'} />
            <span className="text-[9px] text-gray-600">主图</span>
            {hasHero && <span className="text-[9px] text-green-600 font-medium">已上传</span>}
          </button>

          <p className="text-[9px] text-gray-400 self-center ml-1 leading-relaxed">
            选择后会自动<br/>发送消息给 AI
          </p>

          {/* 隐藏 file inputs */}
          <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) readFile(f, onLogoUpload); e.target.value = '' }} />
          <input ref={heroInputRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) readFile(f, onHeroUpload); e.target.value = '' }} />
        </div>
      )}
    </div>
  )
}
