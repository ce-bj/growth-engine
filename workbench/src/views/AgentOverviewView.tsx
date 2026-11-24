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
import { Button, Card, DatePicker, Modal, Select, Statistic, Table, Tag } from 'antd'
import type { TableColumnsType } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import { useEffect, useMemo, useState } from 'react'

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

type TodoFilter = 'all' | 'pending_strategy' | 'pending_optimize' | 'pending_publish'

const GUIDE_COLLAPSED_KEY = 'growth-overview-guide-collapsed'

function readGuideCollapsed() {
  try {
    return window.localStorage.getItem(GUIDE_COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

export function AgentOverviewView() {
  const { navigate, pushToast } = useWorkbench()
  const [flowState, setFlowState] = useState<GrowthFlowState>(() => readGrowthFlowState())
  const [filterStage, setFilterStage] = useState<TodoFilter>('all')
  const [guideCollapsed, setGuideCollapsed] = useState(readGuideCollapsed)
  const [historyOpen, setHistoryOpen] = useState(false)
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
    if (item.stage === 'pending_strategy') {
      // 点击 [待定策略] → 跳转第三幕【优化策略】并锚点高亮对应策略卡
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

  return (
    <div className="agent-overview">
      <section
        className={`ov-narrative${guideCollapsed ? ' is-collapsed' : ''}`}
        aria-label="网站增长决策工作台"
      >
        <div className="ov-narrative__head">
          <div>
            <h2>这是您的网站增长决策工作台</h2>
            {guideCollapsed ? null : (
              <p>
                {overviewMonth.span} · 更新于 {overviewMonth.updatedAt}
              </p>
            )}
          </div>
          <div className="ov-head__actions">
            {(Object.keys(flowState.approvedStrategies).length > 0 ||
              Object.keys(flowState.publishedTasks).length > 0 ||
              Object.keys(flowState.skippedStrategies).length > 0) && (
              <Button
                size="small"
                icon={<RotateCcw size={13} />}
                onClick={() => {
                  resetGrowthFlowState()
                  pushToast('info', '演示状态已重置为初始待办')
                }}
              >
                重置演示状态
              </Button>
            )}
            <button type="button" className="ov-weak-board-link" onClick={() => navigate('board')}>
              进入完整数据看板 &gt;
            </button>
          </div>
        </div>
        {guideCollapsed ? null : (
          <p className="ov-narrative__copy">
            系统持续为您盯紧网站访客与留资转化，自动诊断客户流失原因并给出优化方案，您只需在下方「待办」中拍板策略方向、预览确认后发布上线。
          </p>
        )}
        <button
          type="button"
          className="ov-narrative__toggle"
          aria-expanded={!guideCollapsed}
          onClick={() => toggleGuide(!guideCollapsed)}
        >
          {guideCollapsed ? (
            <>
              展开 <ChevronDown size={14} />
            </>
          ) : (
            <>
              收起 <ChevronUp size={14} />
            </>
          )}
        </button>
      </section>

      <section className="ov-kpi-section" aria-label="核心获客指标">
        <div className="ov-kpi-grid">
          {CORE_KPIS.map((kpi) => (
            <div
              key={kpi.id}
              className={`ov-kpi-card${kpi.trend === 'down' ? ' is-abnormal' : ' is-healthy'}`}
              role="button"
              tabIndex={0}
              onClick={() => navigate('intake')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  navigate('intake')
                }
              }}
            >
              <div className="ov-kpi-card__top">
                <span className="ov-kpi-card__label">{kpi.title}</span>
              </div>

              <div className="ov-kpi-card__value-row">
                <strong className="ov-kpi-card__num">{kpi.value}</strong>
                <span className={`ov-kpi-card__delta ${kpi.trend === 'down' ? 'is-down' : 'is-up'}`}>
                  {kpi.trend === 'down' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                  较上周环比 {kpi.deltaText}
                </span>
              </div>

              <div className="ov-kpi-card__meta">
                <span>{kpi.prevValue}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ② 当前待办 + 与顶部周周期对齐的本周已完成 */}
      <section className="ov-stats ov-stats--two" aria-label="待办与本周已完成">
        <Card size="small" classNames={{ root: 'ov-panel is-attention' }}>
          <div className="ov-summary-split">
            <div>
              <Statistic title="当前待办" value={board.totalPendingCount} suffix="项" />
            </div>
          </div>
        </Card>

        <Card size="small" classNames={{ root: 'ov-panel' }}>
          <div className="ov-summary-split">
            <div>
              <Statistic title="本周已完成" value={board.weekDoneList.length} suffix="项" />
            </div>
          </div>
        </Card>
      </section>

      {/* ③ 底部待办总表：任务名称 + 来源模块标签，按来源筛选 */}
      <Card
        classNames={{ root: 'ov-panel', body: 'ov-list' }}
        title={
          <span className="ov-card-title">
            待办
            <Tag color="orange">{board.totalPendingCount}</Tag>
            {filterStage !== 'all' && (
              <Button type="link" size="small" onClick={() => setFilterStage('all')}>
                显示全部
              </Button>
            )}
          </span>
        }
        extra={
          <div className="ov-summary-badges ov-todo-filters" role="group" aria-label="按来源筛选待办">
            <button
              type="button"
              className={`ov-gate-chip is-orange${filterStage === 'pending_strategy' ? ' is-active' : ''}`}
              aria-pressed={filterStage === 'pending_strategy'}
              onClick={() =>
                setFilterStage((cur) => (cur === 'pending_strategy' ? 'all' : 'pending_strategy'))
              }
            >
              <span>待定策略</span>
              <b>{board.pendingStrategyCount}</b>
            </button>
            <button
              type="button"
              className={`ov-gate-chip is-blue${filterStage === 'pending_publish' ? ' is-active' : ''}`}
              aria-pressed={filterStage === 'pending_publish'}
              onClick={() =>
                setFilterStage((cur) => (cur === 'pending_publish' ? 'all' : 'pending_publish'))
              }
            >
              <span>待确认发布</span>
              <b>{board.pendingPublishCount}</b>
            </button>
            <button
              type="button"
              className={`ov-gate-chip is-purple${filterStage === 'pending_optimize' ? ' is-active' : ''}`}
              aria-pressed={filterStage === 'pending_optimize'}
              onClick={() =>
                setFilterStage((cur) => (cur === 'pending_optimize' ? 'all' : 'pending_optimize'))
              }
            >
              <span>AI 友好度体检</span>
              <b>{board.pendingOptimizeCount}</b>
            </button>
          </div>
        }
      >
        {visibleTodos.length === 0 ? (
          <div className="ov-empty-todos">
            <CheckCircle2 size={22} />
            <span>当前筛选下所有待办均已处理完毕！</span>
          </div>
        ) : (
          visibleTodos.map((task) => {
            const isStrategy = task.stage === 'pending_strategy'
            const isOptimize = task.stage === 'pending_optimize'
            return (
              <div
                key={task.id}
                className={`ov-pending ${isOptimize ? 'is-gate-ready' : isStrategy ? 'is-gate-strategy' : 'is-gate-publish'}`}
              >
                <div className="ov-pending__main">
                  <div className="ov-pending__top">
                    <span
                      className={`ov-status-badge ${isOptimize ? 'is-optimize' : isStrategy ? 'is-strategy' : 'is-publish'}`}
                      onClick={() => handleOpenTodo(task)}
                      role="button"
                      tabIndex={0}
                    >
                      {isOptimize ? '[待优化]' : isStrategy ? '[待定策略]' : '[待确认发布]'}
                    </span>
                    <b>{task.title}</b>
                    <Tag variant="filled">{task.sourceAgent}</Tag>
                  </div>
                  <small>{task.submittedAt}</small>
                </div>

                <div className="ov-pending__cta">
                  {isOptimize ? (
                    <Button type="primary" onClick={() => handleOpenTodo(task)}>
                      去优化
                    </Button>
                  ) : isStrategy ? (
                    <Button
                      type="primary"
                      icon={<Sparkles size={14} />}
                      onClick={() => handleOpenTodo(task)}
                    >
                      去批策略
                    </Button>
                  ) : (
                    <Button
                      type="primary"
                      className="ov-btn-publish"
                      icon={<Eye size={14} />}
                      onClick={() => handleOpenTodo(task)}
                    >
                      去预览发布
                    </Button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </Card>

      <Card
        classNames={{ root: 'ov-panel' }}
        title="本周已完成"
        extra={
          <span className="ov-done-extra">
            <span className="ov-card-extra">共 {board.weekDoneList.length} 项</span>
            <button type="button" className="ov-weak-board-link" onClick={openHistory}>
              查看历史记录 &gt;
            </button>
          </span>
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
