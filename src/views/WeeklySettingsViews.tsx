import { useState } from 'react'
import { Button } from '../components/Button'
import { AGENT_LIST, PLATFORM_NAME } from '../data/mock'
import { useWorkbench } from '../context/WorkbenchContext'
import { formatDelta } from '../lib/score'

export function WeeklyView() {
  const {
    weeklyRows,
    weeklyPreviewId,
    openWeeklyPreview,
    goDashboard,
    goReport,
    startFixIssue,
    issues,
    health,
  } = useWorkbench()

  // 计算是否有退步预警
  const recentDecline = weeklyRows.slice(0, 3).reduce((acc, row) => {
    if (row.score < row.previousScore) {
      return acc + (row.previousScore - row.score)
    }
    return 0
  }, 0)
  const hasDeclineAlert = recentDecline >= 5

  const preview = weeklyRows.find((r) => r.id === weeklyPreviewId) ?? null
  const tdkIssue = issues.find((i) => i.id === 'iss-tdk')

  if (preview) {
    return (
      <div className="stack">
        <div className="page-toolbar">
          <Button variant="text" size="sm" onClick={() => openWeeklyPreview(null)}>
            ← 返回周报列表
          </Button>
        </div>
        <div className="email-frame">
          <div className="email-frame__bar">
            <div>
              <strong>主题：</strong>[{PLATFORM_NAME}] 您的网站本周健康度报告 · {preview.weekLabel.split('—')[1]?.trim() ?? ''}
            </div>
            <div style={{ marginTop: 4 }}>发送时间 {preview.sentAt} · 收件邮箱（注册邮箱）</div>
          </div>
          <div className="email-body">
            <p>您好！</p>
            <p>本周（{preview.weekLabel}）您的网站健康度报告如下：</p>
            <div className="email-score-box">
              综合健康度：{preview.score} 分（上周 {preview.previousScore} 分）
              {preview.score >= preview.previousScore ? ' ↑' : ' ↓'}{' '}
              {Math.abs(preview.score - preview.previousScore)} 分
            </div>
            <p>
              <strong>六维分数变化</strong>
            </p>
            <table className="email-dim-table">
              <tbody>
                <tr>
                  <td>技术性能</td>
                  <td>14 → 16 (+2)</td>
                </tr>
                <tr>
                  <td>内容质量</td>
                  <td>12 → 12</td>
                </tr>
                <tr>
                  <td>SEO友好度</td>
                  <td>7 → 10 (+3)</td>
                </tr>
                <tr>
                  <td>GEO友好度</td>
                  <td>9 → 9</td>
                </tr>
                <tr>
                  <td>全球合规</td>
                  <td>14 → 14</td>
                </tr>
                <tr>
                  <td>商业转化</td>
                  <td>8 → 10 (+2)</td>
                </tr>
              </tbody>
            </table>
            <div className="admin-callout admin-callout--warn">
              <strong>本周建议关注</strong>
              <p style={{ margin: '8px 0' }}>P1：SEO TDK 仍有 40% 页面未填写</p>
              <Button
                size="sm"
                onClick={() => {
                  if (tdkIssue) startFixIssue(tdkIssue)
                }}
              >
                一键修复 Title 和描述
              </Button>
            </div>
            <p>
              <strong>本周获客数据</strong>
            </p>
            <p style={{ margin: '4px 0' }}>访客数 UV：1,234（较上周 +12%）</p>
            <p style={{ margin: '4px 0' }}>询盘转化率：2.3%（较上周 +0.4%）</p>
            <div className="email-cta-row">
              <Button onClick={goReport}>查看完整报告</Button>
              <Button variant="secondary" onClick={goDashboard}>
                进入增长工作台
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="stack">
      <p className="muted">运营 Agent 每周一 09:00 自动检测并邮件推送（PRD §8），此处为投递记录。</p>

      {/* 退步预警 */}
      {hasDeclineAlert && (
        <div className="admin-callout admin-callout--warn">
          <strong>⚠️ 退步预警</strong>
          <p style={{ margin: '8px 0' }}>
            近期分数累计下降 <strong>{recentDecline}</strong> 分，已触发预警阈值（连续下降 ≥5 分）。
            建议立即查看报告并处理待修复问题。
          </p>
          <div className="row" style={{ gap: 8 }}>
            <Button size="sm" onClick={goReport}>
              查看诊断报告
            </Button>
            <Button size="sm" variant="secondary" onClick={goDashboard}>
              进入数据看板
            </Button>
          </div>
        </div>
      )}

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>周期</th>
              <th>发送时间</th>
              <th>综合分</th>
              <th>较上周</th>
              <th>打开状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {weeklyRows.map((row) => {
              const delta = formatDelta(row.score, row.previousScore)
              return (
                <tr key={row.id}>
                  <td>{row.weekLabel}</td>
                  <td className="mono">{row.sentAt}</td>
                  <td className="mono" style={{ fontWeight: 600 }}>
                    {row.score}
                  </td>
                  <td className={delta.up ? 'delta--up' : 'delta--down'}>{delta.text}</td>
                  <td>
                    <span className={row.opened ? 'badge badge--success' : 'badge badge--neutral'}>
                      {row.opened ? '已打开' : '未打开'}
                    </span>
                  </td>
                  <td>
                    <Button size="sm" variant="text" onClick={() => openWeeklyPreview(row.id)}>
                      查看内容
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function SettingsView() {
  const { currentSite, sites, setSiteId, siteId } = useWorkbench()
  const [activeAgent, setActiveAgent] = useState<typeof AGENT_LIST[number] | null>(null)

  return (
    <div className="stack" style={{ maxWidth: 720 }}>
      <div className="card">
        <h2 className="card__title">主站设置</h2>
        <p className="muted" style={{ marginBottom: 16 }}>
          首次进入可选择优先检测的主站；各站点分数、报告、修复记录相互独立（PRD §12）。
        </p>
        <div className="form-grid">
          <label className="form-field">
            <span>当前主站</span>
            <select value={siteId} onChange={(e) => setSiteId(e.target.value)}>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.isPrimary ? '（主站）' : ''}
                </option>
              ))}
            </select>
          </label>
          <div className="form-field">
            <span>站点 URL</span>
            <div className="form-readonly">{currentSite.url}</div>
          </div>
          <div className="form-field">
            <span>站点语言 / 内外贸</span>
            <div className="form-readonly">
              {currentSite.language} · {currentSite.tradeType === 'export' ? '外贸' : '内贸'}
            </div>
          </div>
          <div className="form-field">
            <span>周报邮箱</span>
            <div className="form-readonly">ops@example.com（注册邮箱）</div>
          </div>
        </div>
        <div className="row" style={{ marginTop: 20 }}>
          <Button onClick={() => alert('设置已保存（样例）')}>保存设置</Button>
        </div>
      </div>

      {/* §10 自动检测策略 - 系统固定策略 */}
      <div className="card">
        <h2 className="card__title">自动检测策略</h2>
        <p className="muted" style={{ marginBottom: 16 }}>
          系统自动执行的检测策略，无需客户配置。
        </p>

        <div className="admin-callout admin-callout--info">
          <strong>每周针对性检测</strong>
          <p style={{ margin: '8px 0' }}>
            每周一 09:00 自动执行。系统会检测各维度得分：得分 &lt; 14 分或近期退步 ≥ 5 分的维度将被重点检测。
            仅检测问题维度，执行快速、省时。
          </p>
        </div>

        <div className="admin-callout admin-callout--info" style={{ marginTop: 12 }}>
          <strong>每月全量检测</strong>
          <p style={{ margin: '8px 0' }}>
            每月第一个周一执行完整检测，覆盖全部 6 个维度的 30+ 检测项。全面评估网站健康度，生成完整报告。
          </p>
        </div>

        <div className="admin-callout admin-callout--warn" style={{ marginTop: 12 }}>
          <strong>退步预警机制</strong>
          <p style={{ margin: '8px 0' }}>
            若健康度分数连续下降 ≥ 5 分，将自动触发退步预警邮件通知，提醒及时处理问题。
          </p>
        </div>
      </div>

      {/* §11 Agent 生态 - 可交互 */}
      <div className="card">
        <h2 className="card__title">Agent 生态</h2>
        <p className="muted" style={{ marginBottom: 16 }}>
          增长工作台由 11 个智能 Agent 协同工作，分四层。点击任意 Agent 查看详情。
        </p>

        <div className="agent-layers">
          {/* 入口层 */}
          <div className="agent-layer">
            <div className="agent-layer__title">入口层</div>
            <div className="agent-grid">
              {AGENT_LIST.filter((a) => a.layer === 'entry').map((agent) => (
                <div key={agent.id} className="agent-card">
                  <div className="agent-card__icon">{agent.icon}</div>
                  <div className="agent-card__name">{agent.name}</div>
                  <div className="agent-card__desc">{agent.description}</div>
                  <div className="agent-card__trigger">触发时机：{agent.triggerWhen}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 报告层 */}
          <div className="agent-layer">
            <div className="agent-layer__title">报告层</div>
            <div className="agent-grid">
              {AGENT_LIST.filter((a) => a.layer === 'report').map((agent) => (
                <div key={agent.id} className="agent-card" onClick={() => setActiveAgent(agent)} style={{cursor: 'pointer'}}>
                  <div className="agent-card__icon">{agent.icon}</div>
                  <div className="agent-card__name">{agent.name}</div>
                  <div className="agent-card__desc">{agent.description}</div>
                  <div className="agent-card__trigger">触发时机：{agent.triggerWhen}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 修复层 */}
          <div className="agent-layer">
            <div className="agent-layer__title">修复层</div>
            <div className="agent-grid">
              {AGENT_LIST.filter((a) => a.layer === 'fix').map((agent) => (
                <div key={agent.id} className="agent-card" onClick={() => setActiveAgent(agent)} style={{cursor: 'pointer'}}>
                  <div className="agent-card__icon">{agent.icon}</div>
                  <div className="agent-card__name">{agent.name}</div>
                  <div className="agent-card__desc">{agent.description}</div>
                  <div className="agent-card__trigger">触发时机：{agent.triggerWhen}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 运营层 */}
          <div className="agent-layer">
            <div className="agent-layer__title">运营层</div>
            <div className="agent-grid">
              {AGENT_LIST.filter((a) => a.layer === 'operation').map((agent) => (
                <div key={agent.id} className="agent-card" onClick={() => setActiveAgent(agent)} style={{cursor: 'pointer'}}>
                  <div className="agent-card__icon">{agent.icon}</div>
                  <div className="agent-card__name">{agent.name}</div>
                  <div className="agent-card__desc">{agent.description}</div>
                  <div className="agent-card__trigger">触发时机：{agent.triggerWhen}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Agent 详情弹窗 */}
      {activeAgent && (
        <div className="modal-overlay" onClick={() => setActiveAgent(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header__icon">{activeAgent.icon}</div>
              <div>
                <h3 className="modal-header__title">{activeAgent.name}</h3>
                <p className="muted">{activeAgent.description}</p>
              </div>
              <button className="modal-close" onClick={() => setActiveAgent(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-field">
                  <span>所属层级</span>
                  <div className="form-readonly">
                    {activeAgent.layer === 'entry' ? '入口层' :
                     activeAgent.layer === 'report' ? '报告层' :
                     activeAgent.layer === 'fix' ? '修复层' : '运营层'}
                  </div>
                </div>
                <div className="form-field">
                  <span>触发时机</span>
                  <div className="form-readonly">{activeAgent.triggerWhen}</div>
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <h4>功能说明</h4>
                <p style={{ color: 'var(--text-secondary)' }}>
                  {activeAgent.layer === 'entry' && '负责引导用户完成首次检测，并在检测过程中提供实时进度反馈。'}
                  {activeAgent.layer === 'report' && '汇总六个维度的检测结果，生成可视化报告，帮助用户快速了解网站健康状况。'}
                  {activeAgent.layer === 'fix' && `针对 ${activeAgent.name.replace('Agent', '')} 维度的问题，提供智能修复方案并自动执行。`}
                  {activeAgent.layer === 'operation' && '负责自动化运营工作，包括周报生成、邮件推送、异常预警等持续性运营任务。'}
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <Button variant="secondary" onClick={() => setActiveAgent(null)}>关闭</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
