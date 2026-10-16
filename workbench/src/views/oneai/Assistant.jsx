import { useState } from 'react'
import { ArrowLeft, ArrowRight, MessageSquare } from 'lucide-react'
import './oneai.css'

function assistantEmbedUrl() {
  const host = window.location.hostname || '127.0.0.1'
  const url = new URL(`http://${host}:5174/`)
  url.searchParams.set('embed', 'assistant')
  return url.toString()
}

const ENTRIES = [
  {
    id: 'ops-assistant',
    title: 'AI 运营助手',
    mark: '原型',
    desc: '数字门户里的对话界面。发布产品、修改产品、查看运营数据，从这里进入。',
  },
]

export default function Assistant() {
  const [opened, setOpened] = useState(null)
  const current = ENTRIES.find((item) => item.id === opened)

  if (current) {
    return (
      <div className="assistant-open">
        <div className="assistant-open__bar">
          <button type="button" className="assistant-open__back" onClick={() => setOpened(null)}>
            <ArrowLeft size={16} />
            返回入口
          </button>
          <div>
            <strong>{current.title}</strong>
            <small>{current.desc}</small>
          </div>
        </div>
        <iframe className="assistant-open__frame" title={current.title} src={assistantEmbedUrl()} allow="clipboard-read; clipboard-write" />
      </div>
    )
  }

  return (
    <div className="oneai-page">
      <div className="oneai-page__head">
        <div className="oneai-page__kicker">
          <span className="oneai-page__pill">AI 运营助手</span>
          <span className="oneai-page__badge">一期工作台 · 入口</span>
        </div>
        <h1 className="oneai-page__title">从这里进入运营能力</h1>
        <p className="oneai-page__desc">选一个入口开始。原型里的对话助手已经接在下面。</p>
      </div>
      <div className="oneai-grid">
        {ENTRIES.map((item) => (
          <button key={item.id} type="button" className="assistant-entry" onClick={() => setOpened(item.id)}>
            <span className="assistant-entry__icon" aria-hidden>
              <MessageSquare size={20} />
            </span>
            <span className="assistant-entry__body">
              <span className="assistant-entry__title">
                {item.title}
                <span className="assistant-entry__mark">{item.mark}</span>
              </span>
              <span className="assistant-entry__desc">{item.desc}</span>
            </span>
            <span className="assistant-entry__go">
              进入
              <ArrowRight size={16} />
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
