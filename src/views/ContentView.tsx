import { useState } from 'react'
import { useWorkbench } from '../context/WorkbenchContext'
import type {
  ContentArticle,
  ContentPlan,
  ContentStats,
  ArticleType,
  ArticleStatus,
} from '../types'

// ─── Mock 数据 ────────────────────────────────────────────────────────────────

const STATS: ContentStats = {
  totalArticles: 23,
  publishedThisWeek: 3,
  publishedThisMonth: 11,
  keywordCoverage: 18,
  estimatedWeeklyTraffic: 340,
  pendingCount: 5,
  running: false,
  monthlyUV: 160,
  monthlyPV: 418,
  monthlyInquiries: 3,
  avgBounceRate: 60,
}

const PLANS: ContentPlan[] = [
  { id: 'p1', keyword: '工业机器人选型指南', articleType: 'guide', targetWordCount: 1500, status: 'generating', estimatedTraffic: 85, createdAt: '2026-07-23', reason: '更新老文章：现有指南跳出率68%，访客留资仅1条', reasonType: 'A' },
  { id: 'p2', keyword: '2026年自动化设备趋势', articleType: 'insight', targetWordCount: 1200, status: 'pending', estimatedTraffic: 62, createdAt: '2026-07-22', reason: '搜索来源占40%是最大渠道，自动化趋势类内容仅1篇覆盖', reasonType: 'B' },
  { id: 'p3', keyword: '焊接工作站案例：某汽车零部件厂', articleType: 'case', targetWordCount: 800, status: 'pending', estimatedTraffic: 48, createdAt: '2026-07-21', reason: '站内无案例文章，搜索「自动化案例」无覆盖', reasonType: 'C' },
  { id: 'p4', keyword: 'PLC编程入门完全指南', articleType: 'blog', targetWordCount: 2000, status: 'ready', estimatedTraffic: 120, createdAt: '2026-07-20', reason: '更新老文章：现有PLC文章跳出率58%，留资为0', reasonType: 'A' },
  { id: 'p5', keyword: '如何选择合适的喷涂机器人', articleType: 'guide', targetWordCount: 1300, status: 'published', estimatedTraffic: 55, createdAt: '2026-07-19', reason: '长尾关键词「喷涂机器人选型」站内零覆盖', reasonType: 'C' },
]

const ARTICLES: ContentArticle[] = [
  { id: 'a1', title: '工业机器人选型指南', type: 'guide', keywords: ['机器人选型', '工业自动化'], status: 'published', wordCount: 1520, publishedAt: '2026-07-23', cmsUrl: '#', socialSync: ['linkedin'], uv: 35, pv: 89, inquiryCount: 1, bounceRate: 68 },
  { id: 'a2', title: '某食品包装线改造案例', type: 'case', keywords: ['食品包装', '自动化改造'], status: 'published', wordCount: 890, publishedAt: '2026-07-22', cmsUrl: '#', socialSync: ['linkedin', 'twitter'], uv: 36, pv: 82, inquiryCount: 1, bounceRate: 48 },
  { id: 'a3', title: '2026年制造业自动化趋势报告', type: 'insight', keywords: ['制造业趋势', '自动化'], status: 'published', wordCount: 2100, publishedAt: '2026-07-21', cmsUrl: '#', socialSync: ['linkedin'], uv: 25, pv: 67, inquiryCount: 1, bounceRate: 52 },
  { id: 'a4', title: 'PLC编程常见问题与解决方案', type: 'blog', keywords: ['PLC编程', '工控'], status: 'published', wordCount: 1100, publishedAt: '2026-07-19', cmsUrl: '#', socialSync: ['twitter'], uv: 36, pv: 95, inquiryCount: 0, bounceRate: 58 },
  { id: 'a5', title: '机器人维护保养手册', type: 'guide', keywords: ['机器人维护'], status: 'published', wordCount: 980, publishedAt: '2026-07-17', cmsUrl: '#', uv: 28, pv: 85, inquiryCount: 0, bounceRate: 72 },
  { id: 'a6', title: '码垛机器人应用白皮书', type: 'insight', keywords: ['码垛机器人'], status: 'draft', wordCount: 0 },
]

const ARTICLE_TYPES = [
  { key: 'blog' as ArticleType, label: '博客文章', icon: '📝', color: '#6366f1', desc: '覆盖长尾关键词' },
  { key: 'case' as ArticleType, label: '客户案例', icon: '🏭', color: '#22c55e', desc: '转化意向用户' },
  { key: 'insight' as ArticleType, label: '行业洞察', icon: '💡', color: '#f59e0b', desc: '建立专业形象' },
  { key: 'guide' as ArticleType, label: '教程指南', icon: '📖', color: '#3b82f6', desc: '搜索流量入口' },
]

const STATUS_LABELS: Record<ArticleStatus, { label: string; color: string; bg: string }> = {
  draft: { label: '草稿', color: '#64748b', bg: '#f1f5f9' },
  pending: { label: '待发布', color: '#f59e0b', bg: '#fef3c7' },
  generating: { label: '生成中', color: '#3b82f6', bg: '#dbeafe' },
  published: { label: '已发布', color: '#22c55e', bg: '#dcfce7' },
  failed: { label: '失败', color: '#ef4444', bg: '#fee2e2' },
}

const PLAN_STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '待生成', color: '#64748b', bg: '#f1f5f9' },
  generating: { label: '生成中', color: '#3b82f6', bg: '#dbeafe' },
  ready: { label: '待确认', color: '#f59e0b', bg: '#fef3c7' },
  published: { label: '已发布', color: '#22c55e', bg: '#dcfce7' },
  failed: { label: '失败', color: '#ef4444', bg: '#fee2e2' },
}

function typeInfo(key: ArticleType) {
  return ARTICLE_TYPES.find((t) => t.key === key) ?? ARTICLE_TYPES[0]
}

function formatNumber(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

// ─── 子组件 ────────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub }: { icon: string; label: string; value: string | number; sub?: string }) {
  return (
    <div className="content-stat-card">
      <div className="content-stat-card__icon">{icon}</div>
      <div className="content-stat-card__body">
        <div className="content-stat-card__value">{value}</div>
        <div className="content-stat-card__label">{label}</div>
        {sub && <div className="content-stat-card__sub">{sub}</div>}
      </div>
    </div>
  )
}

function StatusBadge({ status, statusMap }: { status: string; statusMap: Record<string, { label: string; color: string; bg: string }> }) {
  const s = statusMap[status] ?? { label: status, color: '#64748b', bg: '#f1f5f9' }
  return (
    <span className="content-badge" style={{ color: s.color, background: s.bg }}>
      {s.label}
    </span>
  )
}

function ArticleRow({ article }: { article: ContentArticle }) {
  const t = typeInfo(article.type)
  const s = STATUS_LABELS[article.status]
  const isAlert = article.inquiryCount === 0 && article.status === 'published'
  const isWarn = (article.bounceRate ?? 0) > 65 && article.status === 'published'
  const rowClass = isAlert ? 'content-article-row row--alert' : isWarn ? 'content-article-row row--warn' : 'content-article-row'
  return (
    <tr className={rowClass}>
      <td>
        <div className="content-article-row__type" style={{ color: t.color }}>
          {t.icon} {t.label}
        </div>
        <div className="content-article-row__title">{article.title}</div>
      </td>
      <td>
        <div className="content-article-row__keywords">
          {article.keywords.map((kw) => (
            <span key={kw} className="content-keyword-chip">{kw}</span>
          ))}
        </div>
      </td>
      <td>
        <span className="content-badge" style={{ color: s.color, background: s.bg }}>
          {s.label}
        </span>
      </td>
      <td>
        {article.uv !== undefined
          ? <span className="mono">{article.uv}</span>
          : <span className="muted">—</span>}
      </td>
      <td>
        {article.pv !== undefined
          ? <span className="mono">{article.pv}</span>
          : <span className="muted">—</span>}
      </td>
      <td>
        {article.bounceRate !== undefined
          ? <span style={{ color: article.bounceRate > 65 ? 'var(--color-danger)' : article.bounceRate > 50 ? 'var(--color-warning)' : 'inherit', fontWeight: article.bounceRate > 65 ? 600 : 400 }}>{article.bounceRate}%</span>
          : <span className="muted">—</span>}
      </td>
      <td>
        {article.inquiryCount !== undefined
          ? <span style={{ color: article.inquiryCount === 0 ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 600 }}>{article.inquiryCount}</span>
          : <span className="muted">—</span>}
      </td>
      <td className="muted">{article.publishedAt ?? '—'}</td>
      <td>
        {article.socialSync && article.socialSync.length > 0 && (
          <div className="content-social-sync">
            {article.socialSync.map((s) => (
              <span key={s} className="content-social-icon">{s === 'linkedin' ? '🔗' : '🐦'}</span>
            ))}
          </div>
        )}
      </td>
      <td>
        {article.status === 'published' && (
          <a href={article.cmsUrl} target="_blank" rel="noopener" className="content-link-btn">
            查看
          </a>
        )}
        {(article.status === 'draft' || article.status === 'pending') && (
          <button className="content-link-btn">编辑</button>
        )}
      </td>
    </tr>
  )
}

function PlanCard({ plan, onPublish }: { plan: ContentPlan; onPublish: (id: string) => void }) {
  const t = typeInfo(plan.articleType)
  const s = PLAN_STATUS_LABELS[plan.status]
  return (
    <div className="content-plan-card">
      <div className="content-plan-card__header">
        <div>
          <span className="content-plan-card__type" style={{ color: t.color }}>{t.icon} {t.label}</span>
          <div className="content-plan-card__keyword">{plan.keyword}</div>
        </div>
        <span className="content-badge" style={{ color: s.color, background: s.bg }}>{s.label}</span>
      </div>
      
      
      {plan.reason && (
        <div className="content-plan-reason">
          <span className="content-plan-reason__tag">
            {plan.reasonType === 'A' ? '🔄 更新' : plan.reasonType === 'B' ? '📊 补渠道' : '🔍 关键词'}
          </span>
          <span className="content-plan-reason__text">{plan.reason}</span>
        </div>
      )}
      {plan.status === 'ready' && (
        <button className="content-publish-btn" onClick={() => onPublish(plan.id)}>
          🚀 发布
        </button>
      )}
    </div>
  )
}

// ─── 主组件 ────────────────────────────────────────────────────────────────────

export function ContentView() {
  const { pushToast } = useWorkbench()
  const [stats] = useState<ContentStats>(STATS)
  const [plans] = useState<ContentPlan[]>(PLANS)
  const [articles] = useState<ContentArticle[]>(ARTICLES)
  const [running, setRunning] = useState(false)
  const [runningStep, setRunningStep] = useState('')
  const [showAddKeyword, setShowAddKeyword] = useState(false)
  const [newKeyword, setNewKeyword] = useState('')

  const startAutoRun = () => {
    setRunning(true)
    const steps = [
      '正在分析关键词机会...',
      '正在生成文章内容...',
      '正在优化 SEO TDK...',
      '正在发布到 CMS...',
      '正在同步到社交媒体...',
    ]
    let i = 0
    const interval = setInterval(() => {
      setRunningStep(steps[i] ?? '')
      i++
      if (i >= steps.length) {
        clearInterval(interval)
        setRunning(false)
        setRunningStep('')
        pushToast('success', '本周已完成 5 篇内容，已全部发布！', true)
      }
    }, 1500)
  }

  const handlePublish = (id: string) => {
    pushToast('info', '正在发布文章...', false)
    setTimeout(() => {
      pushToast('success', '文章已成功发布到网站！', true)
    }, 2000)
  }

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return
    pushToast('success', `关键词「${newKeyword}」已加入内容计划，Agent 将在下次运行时生成文章`, true)
    setNewKeyword('')
    setShowAddKeyword(false)
  }

  const pendingPlans = plans.filter((p) => p.status === 'pending' || p.status === 'generating')
  const readyPlans = plans.filter((p) => p.status === 'ready')
  const draftArticles = articles.filter((a) => a.status === 'draft' || a.status === 'pending')
  const publishedArticles = articles.filter((a) => a.status === 'published')

  return (
    <div className="content-view">
      {/* 统计概览 */}
      <div className="content-stats-grid">
        <StatCard icon="📝" label="本周发布" value={stats.publishedThisWeek} sub="篇" />
        <StatCard icon="📚" label="本月发布" value={stats.publishedThisMonth} sub="篇" />
        <StatCard icon="🔑" label="关键词覆盖" value={stats.keywordCoverage} sub="个" />

        <StatCard icon="⏳" label="待处理" value={stats.pendingCount} sub="篇" />
        <StatCard icon="🏆" label="累计发布" value={stats.totalArticles} sub="篇" />
      </div>

      {/* 内容ROI摘要 */}
      <div className="content-roi-card">
        <div className="content-roi-card__header">
          <span className="content-roi-card__title">📊 内容ROI摘要</span>
          <span className="content-roi-card__sub">近30天已发布内容数据</span>
        </div>
        <div className="content-roi-card__grid">
          <div className="content-roi-kpi">
            <div className="content-roi-kpi__value">{stats.monthlyUV ?? 0}</div>
            <div className="content-roi-kpi__label">内容UV</div>
          </div>
          <div className="content-roi-kpi">
            <div className="content-roi-kpi__value">{stats.monthlyPV ?? 0}</div>
            <div className="content-roi-kpi__label">内容PV</div>
          </div>
          <div className="content-roi-kpi">
            <div className="content-roi-kpi__value" style={{ color: 'var(--color-success)' }}>{stats.monthlyInquiries ?? 0}</div>
            <div className="content-roi-kpi__label">内容留资</div>
          </div>
          <div className="content-roi-kpi">
            <div className="content-roi-kpi__value" style={{ color: (stats.avgBounceRate ?? 0) > 60 ? 'var(--color-danger)' : 'inherit' }}>{stats.avgBounceRate ?? 0}%</div>
            <div className="content-roi-kpi__label">平均跳出</div>
          </div>
          <div className="content-roi-kpi">
            <div className="content-roi-kpi__value">{stats.totalArticles > 0 ? ((stats.monthlyInquiries ?? 0) / stats.totalArticles).toFixed(1) : '0.0'}</div>
            <div className="content-roi-kpi__label">篇均留资</div>
          </div>
        </div>
        <div className="content-roi-card__footer">
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            数据来源：已发布文章在近30天的着陆页表现。留资为0的文章已标红
          </span>
        </div>
      </div>

      {/* 启动运营区 */}
      <div className="content-cta-card">
        <div className="content-cta-card__left">
          <div className="content-cta-card__title">🚀 自动内容运营</div>
          <div className="content-cta-card__desc">
            Agent 将自动分析关键词、生成 SEO 文章、发布到网站并同步到社交媒体
          </div>
          {running ? (
            <div className="content-running">
              <div className="content-running__step">{runningStep}</div>
              <div className="content-running__bar">
                <div className="content-running__progress" />
              </div>
            </div>
          ) : (
            <div className="content-cta-card__actions">
              <button className="btn btn--primary btn--lg" onClick={startAutoRun}>
                启动自动运营
              </button>
              <button className="btn btn--secondary" onClick={() => setShowAddKeyword(true)}>
                + 添加关键词
              </button>
            </div>
          )}
        </div>
        <div className="content-cta-card__right">
          <div className="content-cta-card__tip">
            <div className="content-cta-card__tip-title">本周计划</div>
            <div className="content-cta-card__tip-items">
              {pendingPlans.map((p) => (
                <div key={p.id} className="content-cta-card__tip-item">
                  <span style={{ color: typeInfo(p.articleType).color }}>{typeInfo(p.articleType).icon}</span>
                  <span>{p.keyword}</span>
                </div>
              ))}
              {readyPlans.length > 0 && (
                <div className="content-cta-card__tip-item" style={{ color: '#f59e0b' }}>
                  ↑ {readyPlans.length} 篇待确认发布
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 内容计划 */}
      <div className="content-section">
        <div className="content-section__header">
          <h3>📋 内容计划</h3>
          <span className="muted">{plans.length} 篇</span>
        </div>
        <div className="content-plans-grid">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} onPublish={handlePublish} />
          ))}
        </div>
      </div>

      {/* 已发布记录 */}
      <div className="content-section">
        <div className="content-section__header">
          <h3>✅ 已发布文章</h3>
          <span className="muted">{publishedArticles.length} 篇</span>
        </div>
        <div className="table-wrap">
          <table className="content-table">
            <thead>
              <tr>
                <th>标题</th>
                <th>关键词</th>
                <th>状态</th>
                <th>7天UV</th>
                <th>7天PV</th>
                <th>跳出率</th>
                <th>留资数</th>
                <th>发布日期</th>
                <th>社媒</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {publishedArticles.map((article) => (
                <ArticleRow key={article.id} article={article} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 草稿 */}
      {draftArticles.length > 0 && (
        <div className="content-section">
          <div className="content-section__header">
            <h3>📝 草稿 / 待处理</h3>
            <span className="muted">{draftArticles.length} 篇</span>
          </div>
          <div className="table-wrap">
            <table className="content-table">
              <thead>
                <tr>
                  <th>标题</th>
                  <th>关键词</th>
                  <th>状态</th>
                  <th>7天UV</th>
                  <th>7天PV</th>
                  <th>跳出率</th>
                  <th>留资数</th>
                  <th>发布日期</th>
                  <th>社媒</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {draftArticles.map((article) => (
                  <ArticleRow key={article.id} article={article} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 内容类型说明 */}
      <div className="content-section">
        <div className="content-section__header">
          <h3>📖 内容类型说明</h3>
        </div>
        <div className="content-types-grid">
          {ARTICLE_TYPES.map((t) => (
            <div key={t.key} className="content-type-card">
              <div className="content-type-card__icon" style={{ background: t.color + '20', color: t.color }}>
                {t.icon}
              </div>
              <div className="content-type-card__name">{t.label}</div>
              <div className="content-type-card__desc muted">{t.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 添加关键词弹窗 */}
      {showAddKeyword && (
        <div className="modal-overlay" onClick={() => setShowAddKeyword(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-header__title">添加关键词</h3>
                <p className="muted">输入你想覆盖的关键词，Agent 将为你生成文章</p>
              </div>
              <button className="modal-close" onClick={() => setShowAddKeyword(false)}>×</button>
            </div>
            <div className="modal-body">
              <label className="form-field">
                <span>关键词</span>
                <input
                  type="text"
                  className="form-input"
                  placeholder="例如：工业机器人选型"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                  autoFocus
                />
              </label>
              <div className="content-type-select">
                <span className="muted" style={{ fontSize: 13 }}>文章类型：</span>
                {ARTICLE_TYPES.map((t) => (
                  <button key={t.key} className="content-type-chip" style={{ color: t.color }}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn--secondary" onClick={() => setShowAddKeyword(false)}>取消</button>
              <button className="btn btn--primary" onClick={handleAddKeyword} disabled={!newKeyword.trim()}>
                加入计划
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
