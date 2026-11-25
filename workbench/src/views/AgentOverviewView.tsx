import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { Button, Card, DatePicker, Modal, Segmented, Select, Table, Tag } from 'antd'
import type { TableColumnsType } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

dayjs.extend(isoWeek)

const HISTORY_YEAR = 2026
const HISTORY_LATEST = dayjs('2026-09-20')

function doneAt(time: string) {
  const matched = /^(\d{2})-(\d{2})/.exec(time.trim())
  if (!matched) return dayjs(`${HISTORY_YEAR}-09-21`)
  return dayjs(`${HISTORY_YEAR}-${matched[1]}-${matched[2]}`)
}

function formatHistoryWeek(value: Dayjs) {
  const start = value.startOf('isoWeek')
  const end = value.endOf('isoWeek')
  const startText = `${start.year()}年 ${start.month() + 1}月${start.date()}日`
  const endText =
    start.year() === end.year()
      ? `${end.month() + 1}月${end.date()}日`
      : `${end.year()}年 ${end.month() + 1}月${end.date()}日`
  return `${startText} – ${endText}`
}
import { useWorkbench } from '../context/WorkbenchContext'
import {
  CORE_KPIS,
  GROWTH_FLOW_EVENT,
  GROWTH_FLOW_STORAGE_KEY,
  computeGrowthBoard,
  overviewMonth,
  readGrowthFlowState,
  resetGrowthFlowState,
  type DoneTask,
  type GrowthFlowState,
  type GrowthTodoItem,
} from '../data/overviewMock'

type TodoFilter = 'all' | 'pending_strategy' | 'pending_manual' | 'pending_optimize' | 'pending_publish'

const GUIDE_COLLAPSED_KEY = 'growth-overview-guide-collapsed'

function readGuideCollapsed() {
  try {
    return window.localStorage.getItem(GUIDE_COLLAPSED_KEY) !== '0'
  } catch {
    return true
  }
}

function todoKind(stage: GrowthTodoItem['stage']) {
  if (stage === 'pending_optimize') return 'optimize' as const
  if (stage === 'pending_strategy' || stage === 'pending_manual') return 'strategy' as const
  return 'publish' as const
}

function filterLabel(name: string, count: number) {
  return (
    <span className="ov-filter-label">
      {name}
      <b>{count}</b>
    </span>
  )
}

export function AgentOverviewView() {
  const { navigate, pushToast } = useWorkbench()
  const [flowState, setFlowState] = useState<GrowthFlowState>(() => readGrowthFlowState())
  const [filterStage, setFilterStage] = useState<TodoFilter>('all')
  const [guideCollapsed, setGuideCollapsed] = useState(readGuideCollapsed)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [historyYear, setHistoryYear] = useState<'all' | number>('all')
  const [historyWeek, setHistoryWeek] = useState<Dayjs | null>(null)
  const [historyPage, setHistoryPage] = useState(1)

  function toggleGuide(next: boolean) {
    setGuideCollapsed(next)
    try {
      window.localStorage.setItem(GUIDE_COLLAPSED_KEY, next ? '1' : '0')
    } catch {
      /* 演示环境写不进本地存储时，本次会话内仍然收起 */
    }
  }

  useEffect(() => {
    const sync = () => setFlowState(readGrowthFlowState())
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === GROWTH_FLOW_STORAGE_KEY) sync()
    }
    window.addEventListener(GROWTH_FLOW_EVENT, sync)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(GROWTH_FLOW_EVENT, sync)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const board = useMemo(() => computeGrowthBoard(flowState), [flowState])
  const visibleTodos = useMemo(() => {
    if (filterStage === 'all') return board.todos
    return board.todos.filter((item) => item.stage === filterStage)
  }, [board.todos, filterStage])

  function openDoneResult(item: DoneTask) {
    if (item.liveUrl) {
      window.open(item.liveUrl, '_blank', 'noopener,noreferrer')
      return
    }
    if (item.view) navigate(item.view)
  }

  const doneColumns: TableColumnsType<DoneTask> = useMemo(
    () => [
      {
        title: '完成时间',
        dataIndex: 'time',
        width: 130,
        render: (value: string) => <span className="ov-mono">{value}</span>,
      },
      {
        title: '所属模块',
        dataIndex: 'agent',
        width: 160,
        render: (value: string) => <Tag variant="filled">{value}</Tag>,
      },
      { title: '任务', dataIndex: 'title' },
      {
        title: '操作',
        key: 'action',
        width: 110,
        render: (_value, record) => (
          <button type="button" className="ov-done-link" onClick={() => openDoneResult(record)}>
            去查看 &gt;
          </button>
        ),
      },
    ],
    [navigate],
  )

  const historyYears = useMemo(() => {
    const years = new Set(board.doneList.map((item) => doneAt(item.time).year()))
    return [...years].sort((a, b) => b - a)
  }, [board.doneList])

  const historyRows = useMemo(() => {
    return board.doneList.filter((item) => {
      const at = doneAt(item.time)
      if (historyYear !== 'all' && at.year() !== historyYear) return false
      if (!historyWeek) return true
      const start = historyWeek.startOf('isoWeek')
      const end = historyWeek.endOf('isoWeek')
      return !at.isBefore(start, 'day') && !at.isAfter(end, 'day')
    })
  }, [board.doneList, historyYear, historyWeek])

  function openHistory() {
    setHistoryYear('all')
    setHistoryWeek(null)
    setHistoryPage(1)
    setHistoryOpen(true)
  }

  function handleOpenTodo(item: GrowthTodoItem) {
    if (item.stage === 'pending_optimize') {
      window.dispatchEvent(
        new CustomEvent('growth-focus-strategy', {
          detail: { view: 'ready', focusKey: item.focusKey },
        }),
      )
      return
    }
    if (item.stage === 'pending_strategy' || item.stage === 'pending_manual') {
      window.dispatchEvent(
        new CustomEvent('growth-focus-strategy', {
          detail: { view: 'visitor', focusKey: item.focusKey },
        }),
      )
      return
    }
    // 点击 [待确认发布] → 一步直达第四幕【智能营销页】或【官网内容发布】的草稿预览界面
    window.dispatchEvent(
      new CustomEvent('growth-focus-strategy', {
        detail: {
          view: item.targetView,
          focusKey: item.focusKey,
          task: {
            id: item.focusKey,
            focusKey: item.focusKey,
            view: item.targetView,
            title: item.title,
            executor: item.targetView === 'marketing' ? '智能营销页' : '官网内容发布',
            from: `${overviewMonth.span}诊断`,
            approvedAt: flowState.approvedStrategies[item.focusKey] || item.submittedAt,
            stage: '待预览发布',
            note: item.desc,
            summary: item.desc,
            target: item.targetUrl,
            draftPreview: item.draftPreview,
          },
        },
      }),
    )
  }

  function openInsightPage(lens: 'funnel' | 'trend' = 'funnel') {
    window.dispatchEvent(
      new CustomEvent('growth-focus-strategy', {
        detail: { view: 'visitor', lens },
      }),
    )
  }

  const todoFilters: { value: TodoFilter; label: ReactNode }[] = [
    { value: 'all', label: filterLabel('全部', board.totalPendingCount) },
    { value: 'pending_strategy', label: filterLabel('待定策略', board.pendingStrategyCount) },
    { value: 'pending_publish', label: filterLabel('待确认发布', board.pendingPublishCount) },
    { value: 'pending_optimize', label: filterLabel('AI 友好度', board.pendingOptimizeCount) },
  ]

  return (
    <div className="agent-overview">
      <section
        className={`ov-narrative${guideCollapsed ? ' is-collapsed' : ''}`}
        aria-label="网站增长决策工作台"
      >
        <div className="ov-narrative__head">
          <div className="ov-narrative__title">
            <span className="ai-mark">AI 本周诊断</span>
            <h1>这是您的网站增长决策工作台</h1>
            <span className="ov-narrative__meta">更新于 {overviewMonth.updatedAt}</span>
          </div>
          <div className="ov-head__actions">
            {(Object.keys(flowState.approvedStrategies).length > 0 ||
              Object.keys(flowState.publishedTasks).length > 0 ||
              Object.keys(flowState.skippedStrategies).length > 0) && (
              <Button
                size="small"
                icon={<RotateCcw size={14} />}
                onClick={() => setResetOpen(true)}
              >
                重置演示状态
              </Button>
            )}
            <button
              type="button"
              className="ov-narrative__toggle"
              aria-expanded={!guideCollapsed}
              onClick={() => toggleGuide(!guideCollapsed)}
            >
              {guideCollapsed ? (
                <>
                  说明 <ChevronDown size={14} />
                </>
              ) : (
                <>
                  收起 <ChevronUp size={14} />
                </>
              )}
            </button>
          </div>
        </div>
        {guideCollapsed ? null : (
          <p className="ov-narrative__copy">
            系统持续为您盯紧网站访客与留资转化，自动诊断客户流失原因并给出优化方案，您只需在下方「待办」中拍板策略方向、预览确认后发布上线。
          </p>
        )}
      </section>

      <section className="ov-kpi-section" aria-label="核心转化表现">
        <div className="ov-kpi-section__bar">
          <div className="ov-kpi-section__title">
            <h3>核心转化表现</h3>
            <span className="ov-kpi-section__period">{overviewMonth.span}</span>
          </div>
          <button
            type="button"
            className="ov-kpi-insight-link"
            onClick={() => openInsightPage('trend')}
          >
            查看趋势与数据洞察
          </button>
        </div>

        <div className="ov-kpi-grid">
          {CORE_KPIS.map((kpi) => (
            <button
              type="button"
              key={kpi.id}
              className={`ov-kpi-card${kpi.trend === 'down' ? ' is-abnormal' : kpi.trend === 'up' ? ' is-healthy' : ' is-flat'}`}
              aria-label={`${kpi.title} ${kpi.value}，${kpi.prevValue}`}
              onClick={() => openInsightPage('funnel')}
            >
              <span className="ov-kpi-card__label">{kpi.title}</span>
              <strong className="ov-kpi-card__num">{kpi.value}</strong>
              <span className={`ov-kpi-card__delta ${kpi.trend === 'down' ? 'is-down' : kpi.trend === 'up' ? 'is-up' : 'is-flat'}`}>
                {kpi.trend === 'down' ? <ArrowDownRight size={12} /> : kpi.trend === 'up' ? <ArrowUpRight size={12} /> : null}
                {kpi.trend === 'flat'
                  ? '与上周持平'
                  : kpi.id === 'viewRate' || kpi.id === 'leadRate'
                    ? `${kpi.deltaText.replace('%', '').replace(/^[+-]/, '')} 个百分点`
                    : kpi.deltaText.replace(/^[+-]/, '')}
              </span>
              <span className="ov-kpi-card__meta">{kpi.prevValue}</span>
            </button>
          ))}
        </div>
      </section>

      <Card
        classNames={{ root: 'ov-panel ov-queue', body: 'ov-list' }}
        title={
          <span className="ov-card-title">
            待办
            <Tag>{board.totalPendingCount}</Tag>
            <span className="ai-mark">已排好顺序</span>
          </span>
        }
        extra={
          <div className="ov-queue__filters" role="group" aria-label="按来源筛选待办">
            <Segmented
              size="small"
              value={filterStage}
              options={todoFilters}
              onChange={(value) => setFilterStage(value as TodoFilter)}
            />
          </div>
        }
      >
        {visibleTodos.length === 0 ? (
          <div className="ov-empty-todos">
            <CheckCircle2 size={16} />
            <span>当前筛选下所有待办均已处理完毕</span>
          </div>
        ) : (
          visibleTodos.map((task, index) => {
            const kind = todoKind(task.stage)
            const isNext = index === 0
            return (
              <div
                key={task.id}
                className={`ov-pending is-gate-${kind}${isNext ? ' is-next' : ''}`}
              >
                <div className="ov-pending__main">
                  <div className="ov-pending__top">
                    <span className={`ov-status-badge is-${kind}`}>
                      {kind === 'optimize' ? '待优化' : kind === 'strategy' ? '待定策略' : '待确认发布'}
                    </span>
                    <b>{task.title}</b>
                    <Tag variant="filled">{task.sourceAgent}</Tag>
                  </div>
                  <small>{task.submittedAt}</small>
                </div>

                <div className="ov-pending__cta">
                  <Button
                    size="small"
                    type={kind === 'publish' ? 'primary' : 'default'}
                    icon={kind === 'strategy' ? <Sparkles size={14} /> : kind === 'publish' ? <Eye size={14} /> : undefined}
                    onClick={() => handleOpenTodo(task)}
                  >
                    {kind === 'optimize' ? '去优化' : kind === 'strategy' ? '去批策略' : '去预览发布'}
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </Card>

      <Card
        classNames={{ root: 'ov-panel ov-done' }}
        title={
          <span className="ov-card-title">
            本周已完成
            <span className="ov-card-extra">{board.weekDoneList.length}</span>
          </span>
        }
        extra={
          <button type="button" className="ov-weak-board-link" onClick={openHistory}>
            查看历史记录
          </button>
        }
      >
        <Table<DoneTask>
          size="small"
          rowKey="id"
          pagination={false}
          columns={doneColumns}
          dataSource={board.weekDoneList}
        />
      </Card>

      <Modal
        title="重置演示状态"
        open={resetOpen}
        okText="重置"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        onOk={() => {
          resetGrowthFlowState()
          pushToast('info', '演示状态已重置为初始待办')
          setResetOpen(false)
        }}
        onCancel={() => setResetOpen(false)}
      >
        待办、已同意和已跳过会回到初始状态。
      </Modal>

      <Modal
        title="历史上线记录"
        open={historyOpen}
        footer={null}
        width={880}
        onCancel={() => setHistoryOpen(false)}
        destroyOnHidden
      >
        <div className="ov-history-filters">
          <span>年份</span>
          <Select
            value={historyYear}
            style={{ width: 120 }}
            options={[
              { value: 'all', label: '全部年份' },
              ...historyYears.map((year) => ({ value: year, label: `${year}年` })),
            ]}
            onChange={(value) => {
              setHistoryYear(value)
              setHistoryPage(1)
              if (value !== 'all' && historyWeek && historyWeek.year() !== value) setHistoryWeek(null)
            }}
          />
          <span>自然周</span>
          <DatePicker
            picker="week"
            className="ov-history-week"
            allowClear
            inputReadOnly
            placeholder="全部周"
            value={historyWeek}
            format={formatHistoryWeek}
            maxDate={HISTORY_LATEST}
            disabledDate={(date) => date.endOf('isoWeek').isAfter(HISTORY_LATEST, 'day')}
            classNames={{ popup: { root: 'ov-week-popup' } }}
            aria-label="按自然周筛选，周一至周日"
            onChange={(value) => {
              setHistoryWeek(value)
              setHistoryPage(1)
              if (value) setHistoryYear(value.startOf('isoWeek').year())
            }}
          />
        </div>
        <Table<DoneTask>
          size="small"
          rowKey="id"
          columns={doneColumns}
          dataSource={historyRows}
          locale={{ emptyText: '这个范围内还没有上线记录' }}
          pagination={{
            current: historyPage,
            pageSize: 5,
            showSizeChanger: false,
            hideOnSinglePage: false,
            showTotal: (total) => `共 ${total} 项`,
            onChange: (page) => setHistoryPage(page),
          }}
        />
      </Modal>
    </div>
  )
}
