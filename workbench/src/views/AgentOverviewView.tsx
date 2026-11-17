import { ArrowRight } from 'lucide-react'
import { Badge, Button, Card, Statistic, Table, Tag } from 'antd'
import type { TableColumnsType } from 'antd'
import { useWorkbench } from '../context/WorkbenchContext'
import {
  DONE_METHOD_LABEL,
  overviewAgents,
  overviewDone,
  overviewMonth,
  overviewPending,
  type AgentStatus,
  type DoneMethod,
  type DoneTask,
} from '../data/overviewMock'

const STATUS: Record<AgentStatus, { badge: 'processing' | 'warning' | 'default'; label: string }> = {
  waiting: { badge: 'warning', label: '有待审批' },
  running: { badge: 'processing', label: '运行中' },
  idle: { badge: 'default', label: '待命' },
}

const METHOD_TAG: Record<DoneMethod, { color: string; label: string }> = {
  agreed: { color: '#6366f1', label: DONE_METHOD_LABEL.agreed },
  manual: { color: 'gold', label: DONE_METHOD_LABEL.manual },
  strategy: { color: 'default', label: DONE_METHOD_LABEL.strategy },
}

const onlineCount = overviewAgents.length

const DONE_COLUMNS: TableColumnsType<DoneTask> = [
  {
    title: '完成时间',
    dataIndex: 'time',
    width: 120,
    render: (value: string) => <span className="ov-mono">{value}</span>,
  },
  {
    title: '智能体',
    dataIndex: 'agent',
    width: 180,
    filters: [...new Set(overviewDone.map((task) => task.agent))].map((name) => ({
      text: name,
      value: name,
    })),
    onFilter: (value, record) => record.agent === value,
    render: (value: string) => <Tag variant="filled">{value}</Tag>,
  },
  { title: '任务', dataIndex: 'title' },
  {
    title: '方式',
    dataIndex: 'method',
    width: 120,
    filters: (Object.keys(DONE_METHOD_LABEL) as DoneMethod[]).map((method) => ({
      text: DONE_METHOD_LABEL[method],
      value: method,
    })),
    onFilter: (value, record) => record.method === value,
    render: (method: DoneMethod) => {
      const item = METHOD_TAG[method]
      return <Tag color={item.color}>{item.label}</Tag>
    },
  },
]

export function AgentOverviewView() {
  const { navigate } = useWorkbench()

  return (
    <div className="agent-overview">
      <header className="ov-head">
        <div>
          <h2>智能体概览</h2>
          <p>
            {overviewMonth.span} · 更新于 {overviewMonth.updatedAt}
          </p>
        </div>
        <span className="ov-live">
          <i />
          {onlineCount} 个智能体在线
        </span>
      </header>

      <section className="ov-stats">
        <Card size="small" classNames={{ root: 'ov-panel is-attention' }}>
          <Statistic title="本月待审批任务" value={overviewPending.length} suffix="项" />
          <p className="ov-stat__hint">最早一条{overviewPending[0]?.waiting}</p>
        </Card>
        <Card size="small" classNames={{ root: 'ov-panel' }}>
          <Statistic title="已完成任务" value={overviewDone.length} suffix="项" />
          <p className="ov-stat__hint">你已同意、人工处理或出策略</p>
        </Card>
        <Card size="small" classNames={{ root: 'ov-panel' }}>
          <div className="ov-free">
            <span>积分余额</span>
            <strong>限时免费，不限额度！</strong>
          </div>
        </Card>
      </section>

      <div className="ov-split">
        <Card
          classNames={{ root: 'ov-panel', body: 'ov-list' }}
          title={
            <span className="ov-card-title">
              待审批任务
              <Tag color="orange">{overviewPending.length}</Tag>
            </span>
          }
          extra={<span className="ov-card-extra">按等待时长排序</span>}
        >
          {overviewPending.map((task) => (
            <div key={task.id} className="ov-pending">
              <div className="ov-pending__main">
                <div className="ov-pending__top">
                  <b>{task.title}</b>
                  <Tag variant="filled">{task.agent}</Tag>
                </div>
                <p>{task.desc}</p>
                <small>
                  {task.submittedAt} 提交 · <em>{task.waiting}</em>
                </small>
              </div>
              <Button type="primary" onClick={() => navigate(task.view)}>
                去审批
              </Button>
            </div>
          ))}
        </Card>

        <Card classNames={{ root: 'ov-panel', body: 'ov-list' }} title="智能体运行状态">
          {overviewAgents.map((agent) => {
            const status = STATUS[agent.status]
            const body = (
              <>
                <div className="ov-agent__head">
                  <Badge status={status.badge} text={<b>{agent.name}</b>} />
                  <span className={`ov-agent__state is-${agent.status}`}>{status.label}</span>
                </div>
                <p className="ov-agent__cadence">{agent.cadence}</p>
                <dl className="ov-agent__meta">
                  <div>
                    <dt>上次</dt>
                    <dd>
                      <span className="ov-mono">{agent.lastRun}</span> · {agent.lastResult}
                    </dd>
                  </div>
                  <div>
                    <dt>下次</dt>
                    <dd>
                      <span className="ov-mono">{agent.nextRun}</span>
                      <span className="ov-agent__runs">本月 {agent.monthRuns} 次</span>
                    </dd>
                  </div>
                </dl>
              </>
            )
            return agent.view ? (
              <button
                key={agent.key}
                type="button"
                className="ov-agent"
                onClick={() => navigate(agent.view!)}
              >
                {body}
                <ArrowRight className="ov-agent__go" size={14} />
              </button>
            ) : (
              <div key={agent.key} className="ov-agent is-idle">
                {body}
              </div>
            )
          })}
        </Card>
      </div>

      <Card
        classNames={{ root: 'ov-panel' }}
        title={`${overviewMonth.label}已完成`}
        extra={<span className="ov-card-extra">共 {overviewDone.length} 项</span>}
      >
        <Table<DoneTask>
          rowKey="id"
          size="small"
          columns={DONE_COLUMNS}
          dataSource={overviewDone}
          pagination={{ pageSize: 5, hideOnSinglePage: true, showSizeChanger: false }}
        />
      </Card>
    </div>
  )
}
