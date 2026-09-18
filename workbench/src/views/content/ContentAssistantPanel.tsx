import { AlertTriangle, Check, Circle, FileCheck2, GitBranch, LoaderCircle } from 'lucide-react'

export type AssistantQuickAction = { label: string; onClick: () => void; disabled?: boolean }
export type AgentRunState = 'completed' | 'running' | 'waiting' | 'blocked'
export type AgentRunItem = { name: string; action: string; state: AgentRunState; output?: string }
export type AgentArtifactItem = { name: string; version: string; state: 'ready' | 'pending' | 'invalid' }

/** 多 Agent 是可追踪的生产执行链，不伪装成聊天助手。 */
export function ContentAssistantPanel({ message, quickActions, agentName, agentRole, gateState, runs, artifacts, blockers }: {
  step: number
  message: string
  quickActions: AssistantQuickAction[]
  agentName: string
  agentRole: string
  gateState: 'working' | 'waiting' | 'passed' | 'blocked'
  runs: AgentRunItem[]
  artifacts: AgentArtifactItem[]
  blockers: string[]
}) {
  const stateLabel = gateState === 'working' ? '执行中' : gateState === 'waiting' ? '等待确认' : gateState === 'passed' ? '门禁通过' : '已阻断'
  return <aside className="content-assistant-panel content-agent-console">
    <div className="content-assistant-panel__head"><GitBranch size={15} /><div><b>Agent 执行控制台</b><span>主 Agent 编排 · 专项 Agent 结构化交接</span></div><em className={`is-${gateState}`}>{stateLabel}</em></div>

    <section className="content-agent-console__current"><span>当前决策</span><b>{agentName}</b><small>{agentRole}</small><p>{message}</p></section>

    <section className="content-agent-console__section"><div className="content-agent-console__title"><span>执行链</span><em>{runs.filter((item) => item.state === 'completed').length}/{runs.length}</em></div><div className="content-agent-run-list">{runs.map((run, index) => <article key={`${run.name}-${index}`} className={`is-${run.state}`}><span className="content-agent-run-icon">{run.state === 'completed' ? <Check size={12} /> : run.state === 'running' ? <LoaderCircle size={12} /> : run.state === 'blocked' ? <AlertTriangle size={12} /> : <Circle size={10} />}</span><div><b>{run.name}</b><p>{run.action}</p>{run.output && <small>产出：{run.output}</small>}</div></article>)}</div></section>

    <section className="content-agent-console__section"><div className="content-agent-console__title"><span>本任务制品</span><FileCheck2 size={13} /></div><div className="content-agent-artifacts">{artifacts.map((item) => <span key={item.name} className={`is-${item.state}`}><b>{item.name}</b><small>{item.version}</small></span>)}</div></section>

    {blockers.length > 0 && <section className="content-agent-console__blockers"><b><AlertTriangle size={13} />等待人工处理</b>{blockers.map((item) => <span key={item}>{item}</span>)}</section>}

    {quickActions.length > 0 && <div className="content-assistant-panel__quick"><span>下一步操作</span>{quickActions.map((action) => <button key={action.label} disabled={action.disabled} onClick={action.onClick}>{action.label}</button>)}</div>}
  </aside>
}
