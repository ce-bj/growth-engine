import { ArrowRight, Hexagon } from 'lucide-react'
import { Button, Card, Statistic, Tag, Timeline } from 'antd'
import { ValueFlywheel } from '../components/ValueFlywheel'
import { useWorkbench } from '../context/WorkbenchContext'
import {
  overviewFunnel,
  overviewKpis,
  overviewPeriod,
  overviewTimeline,
  overviewWork,
} from '../data/overviewMock'
import type { ViewId } from '../types'

const TONE_COLOR = {
  down: '#ef4444',
  up: '#16a34a',
  flat: '#1e293b',
}

export function AgentOverviewView() {
  const { navigate, currentSite } = useWorkbench()
  const maxFunnel = overviewFunnel.stages[0]?.value || 1

  const openTask = (view: ViewId) => {
    navigate(view)
  }

  return (
    <div className="agent-overview">
      <section className="ov-hero hud-frame">
        <div className="agent-overview__mark">
          <Hexagon size={18} strokeWidth={2.2} />
        </div>
        <div className="agent-overview__hero-copy">
          <h2>增长智能体自动运行中</h2>
          <p>
            本月已替您完成诊断、技术止血和营销页草稿。您无需每天登录。
            <span className="agent-overview__url">
              {currentSite.name} · {overviewPeriod.label}
            </span>
          </p>
        </div>
        <span className="agent-overview__live">
          <i className="agent-overview__pulse" />
          自动运行中
        </span>
      </section>

      <section className="ov-kpis">
        {overviewKpis.map((kpi) => (
          <Card key={kpi.key} size="small" classNames={{ root: 'ov-panel' }}>
            <Statistic
              title={kpi.label}
              value={kpi.value}
              suffix={kpi.suffix}
              styles={{ content: { color: TONE_COLOR[kpi.tone], fontFamily: 'var(--font-mono)' } }}
            />
            <div className={`ov-delta is-${kpi.tone}`}>{kpi.delta}</div>
          </Card>
        ))}
      </section>

      <ValueFlywheel onOpen={navigate} />

      <section className="ov-work">
        <Card size="small" classNames={{ root: 'ov-panel' }}>
          <Statistic title="本月自动执行" value={overviewWork.autoRuns} suffix="次" />
          <p className="ov-work__hint">诊断、修复、出草稿都算一次</p>
        </Card>
        <Card size="small" classNames={{ root: 'ov-panel' }}>
          <Statistic title="已完成任务" value={overviewWork.closedTickets} suffix="项" />
          <p className="ov-work__hint">sitemap、死链等系统已做完</p>
        </Card>
        <Card size="small" classNames={{ root: 'ov-panel ov-panel--next' }}>
          <div className="ov-next">
            <span className="ov-next__label">下次自动执行</span>
            <strong>{overviewPeriod.nextRun}</strong>
            <p>
              {overviewPeriod.nextTask}
              <small> · {overviewPeriod.baseline}</small>
            </p>
          </div>
        </Card>
      </section>

      <div className="ov-split">
        <Card
          classNames={{ root: 'ov-panel ov-funnel-card', body: 'ov-funnel-body' }}
          title="漏斗转化"
        >
          <p className="ov-funnel__summary">{overviewFunnel.summary}</p>
          <div className="ov-funnel">
            {overviewFunnel.stages.map((stage) => (
              <div
                key={stage.id}
                className={`ov-funnel__row${stage.drop ? ' is-drop' : ''}`}
              >
                <div className="ov-funnel__meta">
                  <b>{stage.name}</b>
                  <span>{stage.hint}</span>
                </div>
                <div className="ov-funnel__track">
                  <div
                    className="ov-funnel__bar"
                    style={{ width: `${Math.max(8, (stage.value / maxFunnel) * 100)}%` }}
                  />
                </div>
                <div className="ov-funnel__num">
                  <strong>{stage.value.toLocaleString()}</strong>
                  {stage.note ? <small>{stage.note}</small> : null}
                </div>
              </div>
            ))}
          </div>
          <Button
            type="link"
            classNames={{ root: 'ov-funnel__foot' }}
            onClick={() => navigate('visitor')}
          >
            去访客行为分析智能体查看具体诊断
            <ArrowRight size={14} />
          </Button>
        </Card>

        <Card classNames={{ root: 'ov-panel' }} title="最近在干活">
          <Timeline
            classNames={{ root: 'ov-timeline' }}
            items={overviewTimeline.map((item) => ({
              color: '#3B9FD0',
              content: (
                <div className="ov-tl">
                  <div className="ov-tl__top">
                    <div className="ov-tl__meta">
                      <b>{item.title}</b>
                      <Tag variant="filled">{item.agent}</Tag>
                    </div>
                    <Button
                      type="link"
                      size="small"
                      classNames={{ root: 'ov-tl__action' }}
                      onClick={() => openTask(item.view)}
                    >
                      {item.action === 'confirm' ? '去确认' : '去查看'}
                      <ArrowRight size={12} />
                    </Button>
                  </div>
                  <p>{item.desc}</p>
                  <small>{item.time}</small>
                </div>
              ),
            }))}
          />
        </Card>
      </div>
    </div>
  )
}
