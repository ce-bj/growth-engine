import { Send, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export type AssistantQuickAction = { label: string; onClick: () => void; disabled?: boolean }

type ChatEntry = { role: 'assistant' | 'user'; text: string }

/** 工作台侧边的场景化助手：按当前步骤展示脚本提示与快捷操作，输入框仅做原型阶段的模拟对话，不做真实语义解析 */
export function ContentAssistantPanel({ step, message, quickActions }: { step: number; message: string; quickActions: AssistantQuickAction[] }) {
  const [log, setLog] = useState<ChatEntry[]>([{ role: 'assistant', text: message }])
  const [draft, setDraft] = useState('')
  const lastMessage = useRef(message)
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (message === lastMessage.current) return
    lastMessage.current = message
    setLog((current) => [...current, { role: 'assistant', text: message }])
  }, [step, message])

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [log])

  function sendDraft() {
    const text = draft.trim()
    if (!text) return
    setLog((current) => [...current, { role: 'user', text }, { role: 'assistant', text: '已记录，你可以使用下方快捷操作或步骤内的按钮继续，也可以告诉我更多细节。' }])
    setDraft('')
  }

  return <aside className="content-assistant-panel">
    <div className="content-assistant-panel__head"><Sparkles size={15} /><b>AI 助手</b></div>
    <div className="content-assistant-panel__log" ref={logRef}>{log.map((entry, index) => <div key={index} className={`content-assistant-msg content-assistant-msg--${entry.role}`}><span className="content-assistant-msg__text">{entry.text}</span></div>)}</div>
    {quickActions.length > 0 && <div className="content-assistant-panel__quick">{quickActions.map((action) => <button key={action.label} disabled={action.disabled} onClick={action.onClick}>{action.label}</button>)}</div>}
    <form className="content-assistant-panel__composer" onSubmit={(e) => { e.preventDefault(); sendDraft() }}>
      <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="向助手说点什么…" />
      <button type="submit"><Send size={14} /></button>
    </form>
  </aside>
}
