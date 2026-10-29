import { ArrowRight } from 'lucide-react'
import { Badge, Button, Card, Statistic, Table, Tag } from 'antd'
import type { TableColumnsType } from 'antd'
import { useWorkbench } from '../context/WorkbenchContext'
import {
  overviewAgents,
  overviewDone,
  overviewMonth,
  overviewPending,
  type AgentStatus,
  type DoneTask,
} from '../data/overviewMock'
import { initialBalance } from './oneai/creditsData.js'

const STATUS: Record<AgentStatus, { badge: 'processing' | 'warning' | 'default'; label: string }> = {
  running: { badge: 'processing', label: '运行中' },
  waiting: { badge: 'warning', label: '有待审批' },
  soon: { badge: 'default', label: '即将上线' },
}

const autoRuns = overviewAgents.reduce((sum, agent) => sum + agent.monthRuns, 0)
const doneByHand = overviewDone.filter((task) => task.byHand).length
const onlineCount = overviewAgents.filter((agent) => agent.status !== 'soon').length

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
  { title: '结果', dataIndex: 'result' },
  {
    title: '方式',
    dataIndex: 'byHand',
    width: 110,
    render: (byHand: boolean) =>
      byHand ? <Tag color="blue">经你确认</Tag> : <Tag color="green">自动完成</Tag>,
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
        <Card size="small" classNames={{ root: 'ov-panel' }}>
          <Statistic title="本月自动执行" value={autoRuns} suffix="次" />
          <p className="ov-stat__hint">诊断、复检、出草稿、发布各算一次</p>
        </Card>
        <Card size="small" classNames={{ root: 'ov-panel' }}>
          <Statistic title="已完成任务" value={overviewDone.length} suffix="项" />
          <p className="ov-stat__hint">其中 {doneByHand} 项经你确认后执行</p>
        </Card>
        <Card size="small" classNames={{ root: 'ov-panel is-attention' }}>
          <Statistic title="待审批任务" value={overviewPending.length} suffix="项" />
          <p className="ov-stat__hint">最早一条{overviewPending[0]?.waiting}</p>
        </Card>
        <Card size="small" classNames={{ root: 'ov-panel' }}>
          <Statistic title="积分余额" value={initialBalance} />
          <p className="ov-stat__hint">
            智能体执行按次扣积分
            <Button
              type="link"
              size="small"
              classNames={{ root: 'ov-stat__link' }}
              onClick={() => navigate('credits')}
            >
              看明细
            </Button>
          </p>
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
                {agent.status === 'soon' ? null : (
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
                )}
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
              <div key={agent.key} className="ov-agent is-soon">
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
