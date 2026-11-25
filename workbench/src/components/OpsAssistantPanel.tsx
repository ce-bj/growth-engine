import { MessageSquare, Minus } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ViewId } from '../types'
import { opsAssistantFloatUrl } from './EmbedFrame'

const FAB_KEY = 'growth-ops-assistant-fab'
const EDGE = 12

interface FabPlace {
  right: number
  bottom: number
  collapsed: boolean
}

function defaultPlace(): FabPlace {
  return { right: 20, bottom: 20, collapsed: false }
}

function readPlace(): FabPlace {
  try {
    const raw = localStorage.getItem(FAB_KEY)
    if (!raw) return defaultPlace()
    const data = JSON.parse(raw) as Partial<FabPlace>
    if (typeof data.right !== 'number' || typeof data.bottom !== 'number') return defaultPlace()
    return { right: data.right, bottom: data.bottom, collapsed: Boolean(data.collapsed) }
  } catch {
    return defaultPlace()
  }
}

function clampPlace(place: FabPlace, width: number, height: number): FabPlace {
  const maxRight = Math.max(EDGE, window.innerWidth - width - EDGE)
  const maxBottom = Math.max(EDGE, window.innerHeight - height - EDGE)
  return {
    ...place,
    right: Math.min(maxRight, Math.max(EDGE, place.right)),
    bottom: Math.min(maxBottom, Math.max(EDGE, place.bottom)),
  }
}

function remember(place: FabPlace) {
  try {
    localStorage.setItem(FAB_KEY, JSON.stringify(place))
  } catch {
    /* 存储不可用时只保留本次会话里的位置 */
  }
}

const PAGE: Record<string, { name: string; hint: string }> = {
  board: { name: '数据看板', hint: '看访问、询盘、有效浏览和渠道' },
  dashboard: { name: '智能体概览', hint: '看各智能体是否在跑、有没有待处理的事' },
  intake: { name: '访客洞察与策略', hint: '看访客漏斗与趋势变化，逐条拍板页面优化策略' },
  visitor: { name: '访客洞察与策略', hint: '看访客漏斗与趋势变化，逐条拍板页面优化策略' },
  marketing: { name: '智能营销页', hint: '看在投的落地页和留资' },
  content: { name: '内容发布', hint: '看在线产品和文章，准备发布或修改' },
  knowledge: { name: '知识库', hint: '看已发布的企业资料' },
  settings: { name: '站点设置', hint: '看站点、域名和基础配置' },
  ready: { name: 'AI Ready', hint: '看站点能不能被 AI 读懂' },
  credits: { name: '积分余额', hint: '看账户积分够不够用' },
  assistant: { name: 'AI运营助手', hint: '直接交代一项运营任务' },
  scanning: { name: '正在检测', hint: '看这一次检测进行到哪一步' },
}

interface Props {
  open: boolean
  view: ViewId
  onClose: () => void
  onOpen: () => void
}

export function OpsAssistantPanel({ open, view, onClose, onOpen }: Props) {
  const src = useMemo(() => opsAssistantFloatUrl(), [])
  const frameRef = useRef<HTMLIFrameElement>(null)
  const dockRef = useRef<HTMLDivElement>(null)
  const placeRef = useRef<FabPlace>(readPlace())
  const suppressClick = useRef(false)
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    rectRight: number
    rectBottom: number
    width: number
    height: number
    moved: boolean
  } | null>(null)
  const [place, setPlace] = useState<FabPlace>(placeRef.current)
  const [dragging, setDragging] = useState(false)
  const page = PAGE[view] ?? { name: '当前页面', hint: '用户正在这个页面上工作' }

  function commit(next: FabPlace, persist = true) {
    placeRef.current = next
    setPlace(next)
    if (persist) remember(next)
  }

  useLayoutEffect(() => {
    if (open) return
    const dock = dockRef.current
    if (!dock) return
    const rect = dock.getBoundingClientRect()
    if (rect.width < 1 || rect.height < 1) return
    const next = clampPlace(placeRef.current, rect.width, rect.height)
    if (next.right !== placeRef.current.right || next.bottom !== placeRef.current.bottom) commit(next)
  }, [open, place.collapsed])

  useEffect(() => {
    function onResize() {
      const dock = dockRef.current
      if (!dock) return
      const rect = dock.getBoundingClientRect()
      if (rect.width < 1 || rect.height < 1) return
      const next = clampPlace(placeRef.current, rect.width, rect.height)
      if (next.right !== placeRef.current.right || next.bottom !== placeRef.current.bottom) commit(next)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  function onPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return
    const dock = dockRef.current
    if (!dock) return
    const rect = dock.getBoundingClientRect()
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      rectRight: rect.right,
      rectBottom: rect.bottom,
      width: rect.width,
      height: rect.height,
      moved: false,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const dx = event.clientX - drag.startX
    const dy = event.clientY - drag.startY
    if (!drag.moved && Math.hypot(dx, dy) < 4) return
    drag.moved = true
    setDragging(true)
    commit(
      clampPlace(
        {
          ...placeRef.current,
          right: window.innerWidth - (drag.rectRight + dx),
          bottom: window.innerHeight - (drag.rectBottom + dy),
        },
        drag.width,
        drag.height,
      ),
      false,
    )
  }

  function onPointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    dragRef.current = null
    setDragging(false)
    if (drag.moved) {
      suppressClick.current = true
      remember(placeRef.current)
    }
  }

  function onFabClick() {
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }
    if (placeRef.current.collapsed) commit({ ...placeRef.current, collapsed: false })
    else onOpen()
  }

  function collapseFab() {
    commit({ ...placeRef.current, collapsed: true })
  }

  useEffect(() => {
    let origin = ''
    try {
      origin = new URL(src).origin
    } catch {
      origin = ''
    }
    function publish() {
      frameRef.current?.contentWindow?.postMessage(
        { type: 'growth-assistant-page', page: { id: view, name: page.name, hint: page.hint } },
        origin || '*',
      )
    }
    function onMessage(event: MessageEvent) {
      if (origin && event.origin !== origin) return
      if (event.data?.type === 'growth-assistant-ready') {
        publish()
        return
      }
      if (event.data?.type !== 'growth-close-assistant') return
      onClose()
      window.setTimeout(() => document.querySelector<HTMLButtonElement>('.ops-assistant__fab')?.focus(), 0)
    }
    window.addEventListener('message', onMessage)
    publish()
    return () => window.removeEventListener('message', onMessage)
  }, [onClose, src, view, page.name, page.hint])

  return (
    <>
      <aside
        className={`ops-assistant${open ? ' is-open' : ' is-hidden'}`}
        aria-hidden={!open}
        aria-label="AI运营助手"
        inert={open ? undefined : true}
      >
        <iframe ref={frameRef} className="ops-assistant__frame" src={src} title="AI运营助手" />
      </aside>
      <div
        ref={dockRef}
        className={`ops-assistant__dock${open ? ' is-hidden' : ''}${dragging ? ' is-dragging' : ''}`}
        style={{ right: place.right, bottom: place.bottom }}
      >
        {place.collapsed ? null : (
          <button type="button" className="ops-assistant__fold" aria-label="收起 AI运营助手" title="收起" onClick={collapseFab}>
            <Minus size={14} />
          </button>
        )}
        <button
          type="button"
          className={`ops-assistant__fab${place.collapsed ? ' is-collapsed' : ''}`}
          aria-label={place.collapsed ? '展开 AI运营助手' : '打开 AI运营助手'}
          title={place.collapsed ? '展开' : undefined}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClick={onFabClick}
        >
          <MessageSquare size={18} />
          {place.collapsed ? null : 'AI运营助手'}
        </button>
      </div>
    </>
  )
}
