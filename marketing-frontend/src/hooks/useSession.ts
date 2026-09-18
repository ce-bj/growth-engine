import { useCallback, useEffect, useRef, useState } from 'react'
import {
  marketingSetup,
  triggerChat,
  buildUserMsg,
  connectSSEStream,
  logUiEvent,
  extractImageMeta,
  type ImageLogMeta,
  type MarketingCustomEvent,
} from '@/api/session'
import type {
  ChatMessage,
  DraftSection,
  FlowState,
  GeneratedImage,
  PageType,
  ProgressStep,
  RecognizedInfo,
  SectionStatus,
} from '@/types'
import { generateId } from '@/lib/utils'

// ── 把生成的图片注入到页面 HTML 对应 data-region 区块 ────────────────────────
function _injectImage(html: string, url: string, placement: string): string {
  const safe = url.replace(/'/g, "\\'")

  if (placement === 'hero') {
    // hero 区块：替换现有 hero-bg 或在 hero div 内插入
    if (html.includes('class="hero-bg"')) {
      return html.replace(
        /(<img class="hero-bg")[^>]*(\/?>)/,
        `<img class="hero-bg" src="${url}" alt="hero background"/>`
      )
    }
    return html.replace(
      /(<[^>]*data-region="hero"[^>]*>)/,
      `$1<img class="hero-bg" src="${url}" alt="hero background"/>`
    )
  }

  // 其他区块：给 data-region 对应元素加 background-image CSS
  const region = placement === 'background' ? 'features' : placement
  return html.replace(
    new RegExp(`(<(?:section|div|nav|footer)[^>]*data-region="${region}")(\\s[^>]*)?(>)`, 'i'),
    (_m, tag, attrs, close) => {
      const existing = attrs ?? ''
      // 如果已有 style 属性，追加；否则新建
      if (existing.includes('style=')) {
        return `${tag}${existing.replace(/style="([^"]*)"/, `style="$1;background-image:url('${safe}');background-size:cover;background-position:center;"`)  }${close}`
      }
      return `${tag}${existing} style="background-image:url('${safe}');background-size:cover;background-position:center;position:relative;"${close}`
    }
  )
}

const INITIAL_STEPS: ProgressStep[] = [
  { id: 'research',    label: '竞品调研',  status: 'pending' },
  { id: 'copywriting', label: '文案撰写',  status: 'pending' },
  { id: 'ui-design',   label: 'UI设计',    status: 'pending' },
  { id: 'code-build',  label: '代码构建',  status: 'pending' },
]

export function useSession() {
  const [agentId,       setAgentId]       = useState<string | null>(null)
  const [sessionId,     setSessionId]     = useState<string | null>(null)
  const [flowState,     setFlowState]     = useState<FlowState>('IDLE')
  const [pageType,      setPageType]      = useState<PageType | null>(null)
  const [messages,      setMessages]      = useState<ChatMessage[]>([])
  const [draftSections, setDraftSections] = useState<DraftSection[]>([])
  const [generatedHtml, setGeneratedHtml] = useState('')
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>(INITIAL_STEPS)
  const [recognizedInfo, setRecognizedInfo] = useState<RecognizedInfo>({})
  const [isLoading,     setIsLoading]     = useState(false)

  const streamCleanup  = useRef<AbortController | null>(null)
  const currentTextRef = useRef('')
  const sessionIdRef   = useRef<string | null>(null)
  // Chip questions from ask_question are buffered here and only rendered after onReplyEnd,
  // so the user cannot click a chip while the agent stream is still active (avoids 409).
  const pendingChipRef = useRef<{ question: string; options: string[] } | null>(null)

  // ── 看门狗：上游断流时 AgentScope 会吞掉异常且不推送结束事件，
  //    导致前端永远停在「思考中」（假死）。在持续静默超过阈值后自动复位。
  const STALL_MS       = 70_000
  const watchdogRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLoadingRef   = useRef(false)

  // ── message helpers ─────────────────────────────────────────────────────────

  const addMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setMessages(prev => [...prev, { ...msg, id: generateId(), timestamp: Date.now() }])
  }, [])

  const appendTextDelta = useCallback((delta: string) => {
    currentTextRef.current += delta
    setMessages(prev => {
      const last = prev[prev.length - 1]
      if (last?.role === 'assistant' && last.type === 'text' && last.isStreaming) {
        return [...prev.slice(0, -1), { ...last, content: last.content + delta }]
      }
      return [
        ...prev,
        {
          id: generateId(),
          role: 'assistant' as const,
          type: 'text' as const,
          content: delta,
          timestamp: Date.now(),
          isStreaming: true,
        },
      ]
    })
  }, [])

  // 与 appendTextDelta 相同逻辑：将思考增量追加到最后一条 thinking 消息
  const appendThinkingDelta = useCallback((delta: string) => {
    setMessages(prev => {
      const last = prev[prev.length - 1]
      if (last?.role === 'assistant' && last.type === 'thinking' && last.isStreaming) {
        return [...prev.slice(0, -1), { ...last, content: last.content + delta }]
      }
      return [
        ...prev,
        {
          id: generateId(),
          role: 'assistant' as const,
          type: 'thinking' as const,
          content: delta,
          timestamp: Date.now(),
          isStreaming: true,
        },
      ]
    })
  }, [])

  const finalizeStreaming = useCallback(() => {
    currentTextRef.current = ''
    const chip = pendingChipRef.current
    pendingChipRef.current = null
    setMessages(prev => {
      const finalized = prev.map(msg => msg.isStreaming ? { ...msg, isStreaming: false } : msg)
      if (chip) {
        return [...finalized, {
          id: generateId(),
          role: 'assistant' as const,
          type: 'chips' as const,
          content: chip.question,
          chips: chip.options.map((label, i) => ({ id: `q-${i}-${Date.now()}`, label })),
          timestamp: Date.now(),
        }]
      }
      return finalized
    })
    setIsLoading(false)
  }, [])

  // ── 看门狗控制 ────────────────────────────────────────────────────────────────
  const clearWatchdog = useCallback(() => {
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current)
      watchdogRef.current = null
    }
  }, [])

  // 收到任意流事件时重置计时；静默超过 STALL_MS 视为上游断流，复位并提示重试。
  const pokeWatchdog = useCallback(() => {
    clearWatchdog()
    watchdogRef.current = setTimeout(() => {
      if (!isLoadingRef.current) return
      finalizeStreaming()
      logUiEvent(sessionIdRef.current, 'stream_stall', { stall_ms: STALL_MS })
      addMessage({
        role: 'system',
        type: 'text',
        content: '⚠️ 响应中断（可能是上游连接断开或超时），本轮已结束，请重试。',
      })
    }, STALL_MS)
  }, [clearWatchdog, finalizeStreaming, addMessage])

  // isLoading 变化时同步 ref，并据此启停看门狗
  useEffect(() => {
    isLoadingRef.current = isLoading
    if (isLoading) pokeWatchdog()
    else clearWatchdog()
  }, [isLoading, pokeWatchdog, clearWatchdog])

  // ── custom event handler ────────────────────────────────────────────────────

  const handleCustom = useCallback(
    (name: MarketingCustomEvent, value: Record<string, unknown>) => {
      switch (name) {
        case 'draft_section': {
          const section = value as unknown as DraftSection
          setDraftSections(prev => {
            const idx = prev.findIndex(s => s.id === section.id)
            if (idx >= 0) {
              const next = [...prev]; next[idx] = section; return next
            }
            return [...prev, section]
          })
          setProgressSteps(prev =>
            prev.map(s => s.id === 'copywriting' ? { ...s, status: 'active' } : s)
          )
          break
        }
        case 'section_rewritten': {
          const { section_id, content } = value as { section_id: string; content: string }
          setDraftSections(prev =>
            prev.map(s => s.id === section_id ? { ...s, content, status: 'pending' } : s)
          )
          setIsLoading(false)
          break
        }
        case 'page_patch': {
          const html = value.html as string
          if (html) setGeneratedHtml(html)
          setProgressSteps(prev =>
            prev.map(s =>
              s.id === 'ui-design' || s.id === 'code-build' ? { ...s, status: 'done' } : s
            )
          )
          break
        }
        case 'flow_state': {
          setFlowState(value.state as FlowState)
          if (value.state === 'COPY_DRAFT') {
            setProgressSteps(prev =>
              prev.map(s => s.id === 'copywriting' ? { ...s, status: 'done' } : s)
            )
          }
          break
        }
        case 'step_update': {
          const { step, status } = value as { step: string; status: 'pending' | 'active' | 'done' }
          setProgressSteps(prev =>
            prev.map(s => s.id === step ? { ...s, status } : s)
          )
          break
        }
        case 'research_result': {
          const insights = (value.industry_insights as Record<string, unknown>) ?? {}
          if (insights.recommended_selling_points) {
            setRecognizedInfo(prev => ({
              ...prev,
              sellingPoints: (insights.recommended_selling_points as string[]).slice(0, 3),
            }))
          }
          setProgressSteps(prev =>
            prev.map(s => s.id === 'research' ? { ...s, status: 'done' } : s)
          )
          break
        }
        case 'recognized_info': {
          const { company, extracted_primary_color } = value as {
            company?: Record<string, string>
            extracted_primary_color?: string
          }
          setRecognizedInfo(prev => ({
            ...prev,
            ...(company ? { companyName: company.name, industry: company.location } : {}),
            ...(extracted_primary_color ? { primaryColor: extracted_primary_color } : {}),
          }))
          break
        }
        case 'brand_assets': {
          const { assets } = value as { assets?: Record<string, unknown> }
          if (assets?.certifications) {
            setRecognizedInfo(prev => ({
              ...prev,
              certifications: assets.certifications as string[],
            }))
          }
          break
        }
        case 'image_generated': {
          const { url, placement, prompt, is_mock } = value as {
            url: string; placement: string; prompt: string; is_mock: boolean
          }
          const img: GeneratedImage = { url, placement, prompt, isMock: is_mock }
          setGeneratedImages(prev => [...prev, img])

          const placementLabel: Record<string, string> = {
            hero: 'Hero 横幅', features: '核心优势', products: '产品展示',
            trust: '合作伙伴', form: '联系表单', footer: '页脚', logo: 'Logo',
          }
          addMessage({
            role: 'assistant',
            type: 'image',
            content: `已生成「${placementLabel[placement] ?? placement}」区块图片${is_mock ? '（占位图，配置 API_KEY 后可生成真实图片）' : ''}`,
            imageUrl: url,
            imagePlacement: placement,
          })

          // 把生成的图片注入到页面 HTML 对应区块
          if (url) {
            setGeneratedHtml(prev => prev ? _injectImage(prev, url, placement) : prev)
          }
          setIsLoading(false)
          break
        }
        case 'ask_question': {
          // Buffer the chip question — show it only after onReplyEnd so the stream is fully
          // done before the user can click, preventing the 409 "task still running" error.
          const { question, options } = value as { question: string; options: string[] }
          if (question) {
            pendingChipRef.current = { question, options: options ?? [] }
          }
          break
        }
        case 'state_updated':
        case 'team_updated':
          break
        default:
          break
      }
    },
    [addMessage]
  )

  // ── SSE stream ──────────────────────────────────────────────────────────────

  const attachStream = useCallback(
    (sid: string, aid: string) => {
      streamCleanup.current?.abort()
      const controller = connectSSEStream(sid, aid, {
        onTextDelta:       d => { pokeWatchdog(); appendTextDelta(d) },
        onThinkingDelta:   d => { pokeWatchdog(); appendThinkingDelta(d) },
        onToolCall:        name => { pokeWatchdog(); addMessage({ role: 'assistant', type: 'tool_call', content: name }) },
        onToolResultDelta: () => {},
        onCustom:          (n, v) => { pokeWatchdog(); handleCustom(n, v) },
        onReplyEnd:        () => {
          logUiEvent(sessionIdRef.current, 'stream_reply_end')
          finalizeStreaming()
        },
        onError:           () => {
          logUiEvent(sessionIdRef.current, 'stream_error')
          clearWatchdog()
          setIsLoading(false)
        },
      })
      streamCleanup.current = controller
    },
    [addMessage, appendTextDelta, appendThinkingDelta, handleCustom, finalizeStreaming, pokeWatchdog, clearWatchdog]
  )

  useEffect(() => () => { streamCleanup.current?.abort(); clearWatchdog() }, [clearWatchdog])

  // ── public actions ──────────────────────────────────────────────────────────

  const startSession = useCallback(
    async (type: PageType, userMessage: string, credentialId?: string, modelName?: string) => {
      setIsLoading(true)
      setPageType(type)
      setFlowState('DRAFTING_INTENT')
      setMessages([{ id: generateId(), role: 'user', type: 'text', content: userMessage, timestamp: Date.now() }])
      setDraftSections([])
      setGeneratedHtml('')
      setGeneratedImages([])
      setProgressSteps(INITIAL_STEPS)
      setRecognizedInfo({})

      try {
        const { agent_id, session_id } = await marketingSetup(type, credentialId, modelName)
        setAgentId(agent_id)
        setSessionId(session_id)
        sessionIdRef.current = session_id
        await logUiEvent(session_id, 'start_session', {
          page_type: type,
          text: userMessage,
          via: 'start_session',
          client_action: 'start_session',
          images: extractImageMeta(userMessage),
        })
        attachStream(session_id, agent_id)
        // Use direct triggerChat here — session is brand-new, 409 impossible
        try {
          await triggerChat({ agent_id, session_id, input: buildUserMsg('user', userMessage) })
        } catch (chatErr) {
          const msg = String(chatErr)
          addMessage({
            role: 'system',
            type: 'text',
            content: `❌ 启动对话失败：${msg.replace(/^Error:\s*API \d+:\s*/, '').slice(0, 120)}`,
          })
          setIsLoading(false)
          setFlowState('IDLE')
        }
      } catch (err) {
        setIsLoading(false)
        setFlowState('IDLE')
        addMessage({ role: 'system', type: 'text', content: `❌ 初始化失败：${String(err).slice(0, 120)}` })
      }
    },
    [addMessage, attachStream]
  )

  // ── safe chat wrapper — handles 409 + generic errors ──────────────────────

  const safeChat = useCallback(
    async (agentId: string, sessionId: string, text: string): Promise<boolean> => {
      try {
        await triggerChat({ agent_id: agentId, session_id: sessionId, input: buildUserMsg('user', text) })
        return true
      } catch (err) {
        const msg = String(err)
        if (msg.includes('409')) {
          addMessage({
            role: 'system',
            type: 'text',
            content: '⚠️ 上一个任务仍在处理中，请稍候片刻再试。',
          })
        } else {
          addMessage({
            role: 'system',
            type: 'text',
            content: `❌ 请求失败：${msg.replace(/^Error:\s*API \d+:\s*/, '').slice(0, 120)}`,
          })
        }
        setIsLoading(false)
        return false
      }
    },
    [addMessage]
  )

  const sendMessage = useCallback(
    async (content: string, via = 'chat', extras?: { images?: ImageLogMeta[] }) => {
      if (!agentId || !sessionId) return
      setIsLoading(true)
      addMessage({ role: 'user', type: 'text', content })
      const images = extras?.images ?? extractImageMeta(content)
      await logUiEvent(sessionId, 'send_message', {
        via,
        client_action: via === 'chat' ? '' : via,
        text: content,
        images,
      })
      await safeChat(agentId, sessionId, content)
    },
    [agentId, sessionId, addMessage, safeChat]
  )

  const confirmSection = useCallback(
    async (sectionId: string, action: 'confirm' | 'rewrite' | 'regenerate' | 'delete', instructions?: string) => {
      logUiEvent(sessionId, 'draft_section', { section_id: sectionId, action, instructions: instructions?.slice(0, 200) })
      if (action === 'confirm') {
        setDraftSections(prev =>
          prev.map(s => s.id === sectionId ? { ...s, status: 'confirmed' as SectionStatus } : s)
        )
      } else if (action === 'delete') {
        setDraftSections(prev => prev.filter(s => s.id !== sectionId))
      } else if ((action === 'rewrite' || action === 'regenerate') && agentId && sessionId) {
        setIsLoading(true)
        const msg = action === 'rewrite'
          ? `请改写「${sectionId}」区块，方向：${instructions ?? '换一个角度'}`
          : `请重新生成「${sectionId}」区块的文案`
        await logUiEvent(sessionId, 'send_message', {
          via: action,
          client_action: action,
          text: msg,
        })
        await safeChat(agentId, sessionId, msg)
      }
    },
    [agentId, sessionId, safeChat]
  )

  // Direct local edit (no AI, just update content in state)
  const editSectionContent = useCallback((sectionId: string, newContent: string) => {
    logUiEvent(sessionId, 'draft_edit', { section_id: sectionId, len: newContent.length })
    setDraftSections(prev =>
      prev.map(s => s.id === sectionId ? { ...s, content: newContent } : s)
    )
  }, [sessionId])

  const confirmAll = useCallback(() => {
    logUiEvent(sessionId, 'draft_confirm_all', { n: draftSections.length })
    setDraftSections(prev => prev.map(s => ({ ...s, status: 'confirmed' as SectionStatus })))
  }, [sessionId, draftSections.length])

  const generatePage = useCallback(async () => {
    if (!agentId || !sessionId) return
    setIsLoading(true)
    setFlowState('PAGE_GENERATING')
    await logUiEvent(sessionId, 'generate_page', {
      via: 'generate_page',
      client_action: 'generate_page',
      text: '所有文字稿已确认，请生成落地页',
    })
    setProgressSteps(prev =>
      prev.map(s => s.id === 'ui-design' ? { ...s, status: 'active' } : s)
    )
    const ok = await safeChat(agentId, sessionId, '所有文字稿已确认，请生成落地页')
    if (!ok) setFlowState('COPY_DRAFT')   // roll back state on error
  }, [agentId, sessionId, safeChat])

  const patchPage = useCallback(
    async (instruction: string) => {
      if (!agentId || !sessionId) return
      setIsLoading(true)
      addMessage({ role: 'user', type: 'text', content: instruction })
      await logUiEvent(sessionId, 'patch_page', {
        via: 'patch_page',
        client_action: 'patch_page',
        text: instruction,
        images: extractImageMeta(instruction),
      })
      await safeChat(agentId, sessionId, instruction)
    },
    [agentId, sessionId, addMessage, safeChat]
  )

  const abortChat = useCallback(() => {
    logUiEvent(sessionIdRef.current, 'abort_chat')
    streamCleanup.current?.abort()
    setMessages(prev => prev.map(m => m.isStreaming ? { ...m, isStreaming: false } : m))
    setIsLoading(false)
  }, [])

  // ── 恢复历史记录 ─────────────────────────────────────────────────────────────
  // 从 localStorage 保存的 HistoryItem 恢复状态。
  // 如果保存了 agentId / sessionId 且 server 仍在运行，可继续对话；
  // 否则仅恢复 HTML 预览（仍可用编辑模式修改）。
  const restoreSession = useCallback(
    (opts: {
      html: string
      pageType: PageType
      agentId?: string | null
      sessionId?: string | null
      messages?: ChatMessage[]
      draftSections?: DraftSection[]
    }) => {
      // 中止当前 stream
      streamCleanup.current?.abort()

      setGeneratedHtml(opts.html)
      setPageType(opts.pageType)
      setFlowState('PAGE_EDITING')
      setGeneratedImages([])
      setRecognizedInfo({})
      setIsLoading(false)
      setProgressSteps(INITIAL_STEPS.map(s => ({ ...s, status: 'done' as const })))

      // 还原文字稿（如有）
      if (opts.draftSections?.length) {
        setDraftSections(opts.draftSections.map(s => ({ ...s, status: 'confirmed' as SectionStatus })))
      } else {
        setDraftSections([])
      }

      // 还原对话消息（如有），末尾追加"已加载"提示
      const notice: ChatMessage = {
        id: generateId(),
        role: 'assistant' as const,
        type: 'text' as const,
        content: opts.agentId
          ? '✅ 历史记录已加载。服务未重启时可继续对话修改页面。'
          : '✅ 历史记录已加载。可在右侧预览区进入编辑模式修改页面。',
        timestamp: Date.now(),
      }
      if (opts.messages?.length) {
        setMessages([
          ...opts.messages.map(m => ({ ...m, isStreaming: false })),
          notice,
        ])
      } else {
        setMessages([notice])
      }

      if (opts.agentId && opts.sessionId) {
        setAgentId(opts.agentId)
        setSessionId(opts.sessionId)
        sessionIdRef.current = opts.sessionId
        logUiEvent(opts.sessionId, 'restore_history', { page_type: opts.pageType, html_len: opts.html.length })
        attachStream(opts.sessionId, opts.agentId)
      } else {
        setAgentId(null)
        setSessionId(null)
        sessionIdRef.current = null
        logUiEvent(null, 'restore_history', { page_type: opts.pageType, html_len: opts.html.length })
      }
    },
    [attachStream]
  )

  const allSectionsConfirmed =
    draftSections.length > 0 && draftSections.every(s => s.status === 'confirmed')

  return {
    sessionId,
    agentId,
    flowState,
    pageType,
    setPageType,
    messages,
    draftSections,
    generatedHtml,
    generatedImages,
    progressSteps,
    recognizedInfo,
    isLoading,
    allSectionsConfirmed,
    startSession,
    sendMessage,
    abortChat,
    confirmSection,
    editSectionContent,
    confirmAll,
    generatePage,
    patchPage,
    restoreSession,
  }
}
