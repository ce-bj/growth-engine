import { CheckCircle2, Loader2, X } from 'lucide-react'
import { DIMENSION_META } from '../data/mock'
import { useWorkbench } from '../context/WorkbenchContext'
import { Button } from './Button'

/** 冷启动配置项：指引里可一键跳数据看板 */
const CONFIG_DASHBOARD_ISSUE_IDS = new Set([
  'cfg-domain',
  'cfg-info',
  'cfg-notification',
  'cfg-gsc',
])

const CONFIG_GUIDE_COPY: Record<string, { summary: string; steps: string[] }> = {
  'cfg-domain': {
    summary: '自定义域名未绑定，网站可能无法正常访问。请到数据看板完成域名绑定。',
    steps: ['打开数据看板中的基础配置项', '完成自定义域名绑定并生效', '返回此处可点「已完成操作」验证'],
  },
  'cfg-info': {
    summary: '网站名称、联系方式、公司简介等基础信息缺失。请到数据看板完善基础信息。',
    steps: ['打开数据看板中的基础配置项', '补全网站名称、联系方式与公司简介', '返回此处可点「已完成操作」验证'],
  },
  'cfg-notification': {
    summary: '未配置邮件/短信/微信通知渠道，线索提醒可能收不到。请到数据看板配置通知渠道。',
    steps: ['打开数据看板中的基础配置项', '配置至少一种通知渠道', '返回此处可点「已完成操作」验证'],
  },
  'cfg-gsc': {
    summary: '网站尚未提交至搜索引擎（如 Google Search Console），影响收录。请到数据看板完成提交。',
    steps: ['打开数据看板中的基础配置项', '完成搜索引擎提交/验证', '返回此处可点「已完成操作」验证'],
  },
}

/** PRD §7 修复 — 右侧抽屉，不打断后台上下文 */
export function FixDrawer() {
  const {
    fixTarget,
    fixPhase,
    fixLogs,
    confirmManualDone,
    cancelFix,
    navigate,
  } = useWorkbench()

  if (!fixTarget) return null

  const dimName =
    DIMENSION_META.find((d) => d.key === fixTarget.dimensionKey)?.name ?? fixTarget.dimensionKey
  const isManual = fixTarget.fixMode === 'manual' || fixTarget.fixMode === 'guide'
  const issueId = fixTarget.issueId ?? ''
  const isConfigGuide = CONFIG_DASHBOARD_ISSUE_IDS.has(issueId)
  const configCopy = CONFIG_GUIDE_COPY[issueId]

  const goDashboardConfig = () => {
    cancelFix()
    navigate('dashboard')
  }

  return (
    <div className="drawer-root" role="dialog" aria-modal="true" aria-label="智能体修复">
      <button type="button" className="drawer-mask" aria-label="关闭" onClick={cancelFix} />
      <aside className="drawer-panel">
        <div className="drawer-header">
          <div>
            <div className="muted" style={{ marginBottom: 4 }}>
              智能体修复 · {dimName}
            </div>
            <h2 className="drawer-title">{fixTarget.title}</h2>
            <p className="muted" style={{ marginTop: 6 }}>
              当前维度分 {fixTarget.currentRaw} / 20
              {isManual ? ' · 需人工完成后验证' : ' · 平台可自动修复，无需再确认'}
            </p>
          </div>
          <button type="button" className="drawer-close" onClick={cancelFix} aria-label="关闭">
            <X size={18} />
          </button>
        </div>

        <div className="drawer-body">
          {fixPhase === 'analyzing' ? (
            <p className="drawer-status">
              <Loader2 size={16} className="spin" /> AI 正在分析问题并生成修复方案…
            </p>
          ) : null}
          {!isManual && fixPhase === 'applying' ? (
            <p className="drawer-status">
              <Loader2 size={16} className="spin" /> 正在自动修复并写入平台…
            </p>
          ) : null}

          <div className="fix-log">
            {fixLogs.map((log, i) => (
              <div key={`${log}-${i}`} className="fix-log__item">
                <CheckCircle2 size={16} color="#22C55E" />
                <span>{log}</span>
              </div>
            ))}
          </div>

          {isManual && (fixPhase === 'manual' || fixPhase === 'applying' || fixPhase === 'done') ? (
            <div className="drawer-section">
              <h3 className="card__title">分析结果</h3>
              {fixTarget.issueId === 'iss-ssl' ? (
                <>
                  <p>
                    您的 SSL 证书将于 2026-08-01 过期。过期后浏览器将显示「不安全」警告，影响信任与排名。
                  </p>
                  <h3 className="card__title" style={{ marginTop: 16 }}>
                    操作指引
                  </h3>
                  <ol className="steps-list">
                    <li>登录证书供应商后台（证书由 [XX] 颁发）</li>
                    <li>选择「续费」或「重新申请」</li>
                    <li>下载新证书并上传至服务器</li>
                    <li>返回此处点击「已完成操作」触发验证</li>
                  </ol>
                </>
              ) : isConfigGuide && configCopy ? (
                <>
                  <p>{configCopy.summary}</p>
                  <h3 className="card__title" style={{ marginTop: 16 }}>
                    操作指引
                  </h3>
                  <ol className="steps-list">
                    {configCopy.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </>
              ) : (
                <>
                  <p>请按平台设置完成配置后，再由系统增量验证。</p>
                  <ol className="steps-list">
                    <li>打开对应设置页并完成修改</li>
                    <li>保存并发布</li>
                    <li>返回点击「已完成操作」</li>
                  </ol>
                </>
              )}
            </div>
          ) : null}

          {fixPhase === 'done' ? (
            <p className="drawer-done">修复完成，分数已更新</p>
          ) : null}
        </div>

        <div className="drawer-footer">
          {isManual && fixPhase === 'manual' ? (
            <>
              {isConfigGuide ? (
                <Button onClick={goDashboardConfig}>去数据看板配置</Button>
              ) : null}
              <Button variant={isConfigGuide ? 'secondary' : 'primary'} onClick={confirmManualDone}>
                已完成操作
              </Button>
              <Button variant="secondary" onClick={cancelFix}>
                取消
              </Button>
            </>
          ) : null}
          {(fixPhase === 'applying' || fixPhase === 'analyzing') && (
            <Button disabled>
              {fixPhase === 'applying' ? (isManual ? '验证中…' : '自动修复中…') : '分析中…'}
            </Button>
          )}
        </div>
      </aside>
      <style>{`
        .spin { animation: spin 1s linear infinite; display: inline-block; vertical-align: -2px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
