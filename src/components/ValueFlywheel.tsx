import {
  ArrowRight,
  Database,
  Headset,
  PanelsTopLeft,
  RefreshCw,
  ScanSearch,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ViewId } from '../types'

const LOOP =
  'M 125 18 C 170 92 300 132 500 138 C 700 132 830 92 875 18 C 930 96 880 198 500 218 C 120 198 70 96 125 18'

const HOPS = ['定位卡点', '生产内容', '承接来意', '接待询盘', '沉淀知识']

type AgentView = Extract<ViewId, 'visitor' | 'content' | 'marketing'>

type FlyNode = {
  id: string
  name: string
  role: string
  metric: string
  status: 'on' | 'soon'
  statusText: string
  icon: LucideIcon
  view?: AgentView
}

const NODES: FlyNode[] = [
  {
    id: 'visitor',
    name: 'AI访客行为分析',
    role: '诊断',
    metric: '卡点在有效浏览',
    status: 'on',
    statusText: '运行中',
    icon: ScanSearch,
    view: 'visitor',
  },
  {
    id: 'content',
    name: 'AI内容运营',
    role: '生产',
    metric: '2 篇待确认发布',
    status: 'on',
    statusText: '运行中',
    icon: Sparkles,
    view: 'content',
  },
  {
    id: 'marketing',
    name: 'AI智能营销页',
    role: '承接',
    metric: '1 份落地页草稿',
    status: 'on',
    statusText: '运行中',
    icon: PanelsTopLeft,
    view: 'marketing',
  },
  {
    id: 'service',
    name: 'AI智能客服Pro',
    role: '转化',
    metric: '询盘接待稍后接入',
    status: 'soon',
    statusText: '即将上线',
    icon: Headset,
  },
]

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return reduced
}

export function ValueFlywheel({ onOpen }: { onOpen: (view: AgentView) => void }) {
  const reduced = useReducedMotion()

  return (
    <section className="fw hud-frame" aria-label="智能体价值飞轮">
      <header className="fw__head">
        <div>
          <h3>价值飞轮 · 多智能体自动闭环</h3>
          <p>知识库托底，诊断 → 内容 → 落地页 → 客服按环流转，对话再沉淀回去。</p>
        </div>
        <span className="fw__live">
          <i />
          闭环运转中
        </span>
      </header>

      <div className="fw__stage">
        <div className="fw__nodes">
          {NODES.map((node) => {
            const Icon = node.icon
            const inner = (
              <>
                <span className="fw__badge">{node.role}</span>
                <span className={`fw__status is-${node.status}`}>{node.statusText}</span>
                <span className="fw__icon" aria-hidden>
                  <Icon size={18} />
                </span>
                <strong>{node.name}</strong>
                <small>{node.metric}</small>
                {node.view ? (
                  <span className="fw__go">
                    进入
                    <ArrowRight size={13} />
                  </span>
                ) : null}
              </>
            )
            if (node.view) {
              return (
                <button
                  key={node.id}
                  type="button"
                  className={`fw__node is-${node.id}`}
                  onClick={() => onOpen(node.view!)}
                >
                  {inner}
                </button>
              )
            }
            return (
              <div key={node.id} className={`fw__node is-soon is-${node.id}`}>
                {inner}
              </div>
            )
          })}
        </div>

        <svg className="fw__svg" viewBox="0 0 1000 240" aria-hidden="true">
          <defs>
            <linearGradient id="fwStroke" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7DD3F0" />
              <stop offset="50%" stopColor="#3B9FD0" />
              <stop offset="100%" stopColor="#7DD3F0" />
            </linearGradient>
            <filter id="fwGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path className="fw__track" d={LOOP} />
          <path
            id="fwLoop"
            className="fw__flow"
            d={LOOP}
            stroke="url(#fwStroke)"
            filter="url(#fwGlow)"
          />
          {reduced
            ? null
            : [0, 2.6, 5.2].map((begin) => (
                <circle key={begin} r="5" fill="#7DD3F0" filter="url(#fwGlow)">
                  <animateMotion dur="8s" begin={`${begin}s`} repeatCount="indefinite">
                    <mpath href="#fwLoop" />
                  </animateMotion>
                </circle>
              ))}
        </svg>

        <div className="fw__core" aria-hidden="true">
          <RefreshCw className="fw__spin" size={22} />
          <div className="fw__hops">
            {HOPS.map((hop) => (
              <span key={hop}>{hop}</span>
            ))}
          </div>
        </div>

        <div className="fw__hub">
          <span className="fw__icon fw__icon--hub" aria-hidden>
            <Database size={18} />
          </span>
          <div>
            <b>AI知识库</b>
            <p>基座 · 持续沉淀。企业 + 行业双库托底，智能体越跑越准。</p>
          </div>
          <dl>
            <div>
              <dt>知识条数</dt>
              <dd>1,286</dd>
            </div>
            <div>
              <dt>切片条数</dt>
              <dd>18,942</dd>
            </div>
            <div>
              <dt>回答准确率</dt>
              <dd>94%</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  )
}
