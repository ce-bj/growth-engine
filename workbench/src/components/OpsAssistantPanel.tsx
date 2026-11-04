import { MessageSquare } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import type { ViewId } from '../types'
import { opsAssistantFloatUrl } from './EmbedFrame'

const PAGE: Record<string, { name: string; hint: string }> = {
  board: { name: '数据看板', hint: '看访问、询盘、有效浏览和渠道' },
  dashboard: { name: '智能体概览', hint: '看各智能体是否在跑、有没有待处理的事' },
  visitor: { name: '访客行为分析', hint: '看访客从哪来、看了什么、有没有留下询盘' },
  marketing: { name: '智能营销页', hint: '看在投的落地页和留资' },
  content: { name: '内容发布', hint: '看在线产品和文章，准备发布或修改' },
  knowledge: { name: '知识库', hint: '看已发布的企业资料' },
  settings: { name: '站点设置', hint: '看站点、域名和基础配置' },
  ready: { name: 'AI 友好度', hint: '看站点能不能被 AI 读懂' },
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
  const page = PAGE[view] ?? { name: '当前页面', hint: '用户正在这个页面上工作' }

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
      <button type="button" className={`ops-assistant__fab${open ? ' is-hidden' : ''}`} onClick={onOpen}>
        <MessageSquare size={18} />
        AI运营助手
      </button>
    </>
  )
}
