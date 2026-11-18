import { ArrowRight } from 'lucide-react'
import { Button, Card, Statistic, Table, Tag } from 'antd'
import type { TableColumnsType } from 'antd'
import { useWorkbench } from '../context/WorkbenchContext'
import {
  DONE_METHOD_LABEL,
  overviewAgents,
  overviewDone,
  overviewMonth,
  overviewPending,
  type DoneMethod,
  type DoneTask,
} from '../data/overviewMock'

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

      <section className="ov-narrative" aria-label="增长工作台说明">
        <div className="ov-narrative__lead">
          <div className="ov-narrative__title-row">
            <span className="ov-narrative__tag">工作台说明</span>
            <h3>这是您的网站增长自动运营工作台</h3>
          </div>
          <p>
            几个智能体分工协作，帮你把网站做成「搜得到、看得进、留得下线索」的获客阵地——从底层收录体检、每周转化诊断，到自动改落地页、定期发内容。智能体平时按计划自己在后台跑；
            <strong>需要你拍板上线的事，都会汇总在下方「待审批任务」里。</strong>
          </p>
        </div>
        <div className="ov-narrative__foot">
          <span>
            平时如果想直接查某个数据、临时改一个产品页或发一篇文章，也可以随时找对话式助手处理：
          </span>
          <Button type="link" size="small" onClick={() => navigate('assistant')}>
            打开 AI 运营助手 <ArrowRight size={13} />
          </Button>
        </div>
      </section>

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

      <section className="ov-roles" aria-label="智能体分工">
        <div className="ov-roles__head">
          <h3>智能体分工</h3>
        </div>
        <div className="ov-narrative__grid">
          {overviewAgents.map((agent, index) => (
            <button
              key={agent.key}
              type="button"
              className="ov-guide-card"
              onClick={() => agent.view && navigate(agent.view)}
            >
              <div className="ov-guide-card__top">
                <span className="ov-guide-card__step">{index + 1}</span>
                <div className="ov-guide-card__titles">
                  <b>{agent.name}</b>
                  <span>{agent.role}</span>
                </div>
                <ArrowRight className="ov-guide-card__arrow" size={14} />
              </div>
              <dl className="ov-guide-card__body">
                <div>
                  <dt>价值</dt>
                  <dd>{agent.purpose}</dd>
                </div>
                <div>
                  <dt>能干什么</dt>
                  <dd>{agent.ability}</dd>
                </div>
              </dl>
            </button>
          ))}
        </div>
      </section>

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
