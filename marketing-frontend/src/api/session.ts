/**
 * API layer that talks to AgentScope 2.0 native endpoints + the custom
 * /marketing/setup bootstrap endpoint.
 *
 * AgentScope endpoint map (all relative to /):
 *   POST /marketing/setup             → create agent + session, return IDs
 *   POST /chat/                       → trigger chat run (fire-and-forget)
 *   GET  /sessions/{sid}/stream       → SSE event stream
 *   POST /sessions/                   → create a new session
 *   POST /credential/                 → upsert a credential (API key)
 */
import type { PageType } from '@/types'

// ── AgentScope event types we care about ────────────────────────────────────
// AgentScope 2.0 uses typed events; CUSTOM events carry name+value pairs.
// See agentscope/event/_event.py → EventType
export type ASEventType =
  | 'TEXT_BLOCK_DELTA'
  | 'TEXT_BLOCK_START'
  | 'TEXT_BLOCK_END'
  | 'THINKING_BLOCK_DELTA'
  | 'TOOL_CALL_START'
  | 'TOOL_CALL_END'
  | 'TOOL_RESULT_START'
  | 'TOOL_RESULT_TEXT_DELTA'
  | 'TOOL_RESULT_END'
  | 'REPLY_START'
  | 'REPLY_END'
  | 'CUSTOM'
  | 'EXCEED_MAX_ITERS'

// Custom event names emitted by MarketingMiddleware
export type MarketingCustomEvent =
  | 'ask_question'       // Agent 向用户提问 + 可点击选项（chips）
  | 'draft_section'
  | 'section_rewritten'
  | 'page_patch'
  | 'flow_state'
  | 'step_update'
  | 'research_result'
  | 'recognized_info'
  | 'backend_products'
  | 'brand_assets'
  | 'image_generated'
  | 'state_updated'
  | 'team_updated'

// ── HTTP helpers ─────────────────────────────────────────────────────────────

const USER_ID = 'dev'  // Single-user dev mode; replace with real auth in prod

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': USER_ID,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

// ── Setup: create agent + session ────────────────────────────────────────────

export interface SetupResult {
  agent_id: string
  session_id: string
  user_id: string
}

export async function marketingSetup(
  pageType: PageType,
  credentialId?: string,
  modelName?: string,
): Promise<SetupResult> {
  return post<SetupResult>('/marketing/setup', {
    page_type: pageType,
    credential_id: credentialId,
    model_name: modelName,
  })
}

// ── Chat trigger (AgentScope native) ─────────────────────────────────────────
//
// AgentScope 2.0 Msg.content is list[ContentBlock], NOT a plain string.
// ContentBlock shape: { type: "text", text: "...", id?: "..." }
//
export interface ASTextBlock {
  type: 'text'
  text: string
}

export interface ASMsg {
  role: 'user' | 'assistant' | 'system'
  name: string
  content: ASTextBlock[]   // ← must be array of blocks, not a string
}

export interface ChatRequest {
  agent_id: string
  session_id: string
  input: ASMsg | null
}

/** Build an AgentScope-compatible user Msg from a plain text string. */
export function buildUserMsg(name: string, text: string): ASMsg {
  return {
    role: 'user',
    name,
    content: [{ type: 'text', text }],
  }
}

export async function triggerChat(req: ChatRequest): Promise<{ status: string; session_id: string }> {
  return post('/chat/', req)
}

// ── SSE stream (AgentScope native) ───────────────────────────────────────────

export interface ASEvent {
  type: ASEventType
  // TEXT_BLOCK_DELTA
  delta?: string
  // TOOL_CALL_START / END
  name?: string
  // TOOL_RESULT_TEXT_DELTA
  text?: string
  // CUSTOM
  name_field?: string   // renamed to avoid clash with tool name
  value?: Record<string, unknown>
  // REPLY_START
  reply_id?: string
  agent_name?: string
}

type SSEHandlers = {
  onTextDelta?: (delta: string) => void
  onThinkingDelta?: (delta: string) => void
  onToolCall?: (toolName: string) => void
  onToolResultDelta?: (text: string) => void
  onCustom?: (name: MarketingCustomEvent, value: Record<string, unknown>) => void
  onReplyEnd?: () => void
  onError?: (err: Event) => void
}

/**
 * Connect to AgentScope 2.0 SSE stream using fetch (not EventSource).
 *
 * EventSource doesn't support custom request headers, but AgentScope
 * requires `X-User-ID` and `agent_id` query param. We replicate the
 * SSE parsing done by the official agentscope web_ui frontend.
 *
 * Returns an AbortController so the caller can close the stream.
 */
export function connectSSEStream(
  sessionId: string,
  agentId: string,
  handlers: SSEHandlers,
): AbortController {
  const controller = new AbortController()

  const url = `/sessions/${sessionId}/stream?agent_id=${encodeURIComponent(agentId)}`

  void (async () => {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'X-User-ID': USER_ID },
        signal: controller.signal,
      })

      if (!res.ok || !res.body) {
        handlers.onError?.(new Event('fetch-error'))
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const json = line.slice(6).trim()
            if (!json) continue

            try {
              const event = JSON.parse(json) as Record<string, unknown>
              dispatchEvent(event, handlers)
            } catch {
              // skip malformed line
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        handlers.onError?.(new Event('stream-error'))
      }
    }
  })()

  return controller
}

function dispatchEvent(event: Record<string, unknown>, handlers: SSEHandlers) {
  const type = event.type as ASEventType
  switch (type) {
    case 'TEXT_BLOCK_DELTA':
      handlers.onTextDelta?.((event.delta as string) ?? '')
      break
    case 'THINKING_BLOCK_DELTA':
      handlers.onThinkingDelta?.((event.delta as string) ?? '')
      break
    case 'TOOL_CALL_START':
      // AgentScope 2.0 用 tool_call_name 字段，不是 name
      handlers.onToolCall?.((event.tool_call_name as string) ?? (event.name as string) ?? '')
      break
    case 'TOOL_RESULT_TEXT_DELTA':
      handlers.onToolResultDelta?.((event.text as string) ?? '')
      break
    case 'REPLY_END':
      handlers.onReplyEnd?.()
      break
    case 'CUSTOM': {
      const customName = event.name as MarketingCustomEvent
      const customValue = (event.value ?? {}) as Record<string, unknown>
      handlers.onCustom?.(customName, customValue)
      break
    }
    default:
      break
  }
}

// ── Credential management ─────────────────────────────────────────────────────

export interface CredentialResult {
  credential_id: string
}

export async function upsertCredential(
  type: string,
  data: Record<string, string>,
): Promise<CredentialResult> {
  return post<CredentialResult>('/credential/', { type, data })
}

// ── History management ────────────────────────────────────────────────────────

export interface HistorySummary {
  id: string
  session_id: string
  agent_id: string | null
  page_type: string
  title: string
  updated_at: string
}

export interface HistoryDetail extends HistorySummary {
  html: string
  messages?:       unknown[]   // 过滤后的对话消息
  draft_sections?: unknown[]   // 文字稿区块
}

export async function fetchHistoryList(): Promise<HistorySummary[]> {
  try {
    const res = await fetch('/marketing/history', { headers: { 'X-User-ID': USER_ID } })
    if (!res.ok) return []
    const data = await res.json() as { history: HistorySummary[] }
    return data.history ?? []
  } catch { return [] }
}

export async function fetchHistoryItem(id: string): Promise<HistoryDetail | null> {
  try {
    const res = await fetch(`/marketing/history/${encodeURIComponent(id)}`, {
      headers: { 'X-User-ID': USER_ID },
    })
    if (!res.ok) return null
    return res.json() as Promise<HistoryDetail>
  } catch { return null }
}

export async function patchHistoryItem(
  id: string,
  data: { messages?: unknown[]; draftSections?: unknown[] },
): Promise<void> {
  try {
    await fetch(`/marketing/history/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'X-User-ID': USER_ID, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages:       data.messages,
        draft_sections: data.draftSections,
      }),
    })
  } catch { /* silent — history update is best-effort */ }
}

export async function deleteHistoryItem(id: string): Promise<void> {
  await fetch(`/marketing/history/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'X-User-ID': USER_ID },
  })
}

export async function clearHistory(): Promise<void> {
  await fetch('/marketing/history', {
    method: 'DELETE',
    headers: { 'X-User-ID': USER_ID },
  })
}

/** 页面交互日志，写入后端会话目录 */
export interface ImageLogMeta {
  filename: string
  type: string
  has_data: boolean
  bytes: number
}

export function imageMetaFromDataUrl(dataUrl: string, filename = ''): ImageLogMeta | null {
  if (!dataUrl) return null
  const m = /^data:([^;,]+);base64,([\s\S]+)$/i.exec(dataUrl)
  if (!m) {
    return { filename, type: '', has_data: true, bytes: dataUrl.length }
  }
  const b64 = m[2].replace(/\s/g, '')
  const pad = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0
  const bytes = Math.max(0, Math.floor((b64.length * 3) / 4) - pad)
  return { filename, type: m[1], has_data: true, bytes }
}

export function extractImageMeta(text: string): ImageLogMeta[] {
  const out: ImageLogMeta[] = []
  const re = /data:([^;,]+);base64,([A-Za-z0-9+/=\s]+)/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(text))) {
    const b64 = match[2].replace(/\s/g, '')
    const pad = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0
    out.push({
      filename: '',
      type: match[1],
      has_data: true,
      bytes: Math.max(0, Math.floor((b64.length * 3) / 4) - pad),
    })
  }
  return out
}

export async function logUiEvent(
  sessionId: string | null | undefined,
  name: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  if (!sessionId) return
  const body = JSON.stringify({
    session_id: sessionId,
    events: [{ name, payload }],
  })
  try {
    await fetch('/marketing/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': USER_ID,
      },
      body,
      keepalive: true,
    })
  } catch { /* 排查日志失败不影响主流程 */ }
}
