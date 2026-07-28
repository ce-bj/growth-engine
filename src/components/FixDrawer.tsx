import { CheckCircle2, Loader2, X } from 'lucide-react'
import { DIMENSION_META } from '../data/mock'
import { useWorkbench } from '../context/WorkbenchContext'
import { Button } from './Button'

/** PRD §7 修复 — 右侧抽屉，不打断后台上下文 */
export function FixDrawer() {
  const {
    fixTarget,
    fixPhase,
    fixLogs,
    confirmApply,
    confirmManualDone,
    cancelFix,
  } = useWorkbench()

  if (!fixTarget) return null

  const dimName =
    DIMENSION_META.find((d) => d.key === fixTarget.dimensionKey)?.name ?? fixTarget.dimensionKey
  const isManual = fixTarget.fixMode === 'manual' || fixTarget.fixMode === 'guide'

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
              {isManual ? ' · 需人工完成后验证' : ' · 可一键写入平台'}
            </p>
          </div>
          <button type="button" className="drawer-close" onClick={cancelFix} aria-label="关闭">
            <X size={18} />
          </button>
        </div>

        <div className="drawer-body">
          {(fixPhase === 'analyzing' || (!isManual && fixPhase === 'confirm')) && (
            <p className="drawer-status">
              {fixPhase === 'analyzing' ? (
                <>
                  <Loader2 size={16} className="spin" /> AI 正在分析问题并生成修复方案…
                </>
              ) : (
                '修复方案已生成，请确认后应用'
              )}
            </p>
          )}

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
              <Button onClick={confirmManualDone}>已完成操作</Button>
              <Button variant="secondary" onClick={cancelFix}>
                取消
              </Button>
            </>
          ) : null}
          {!isManual && fixPhase === 'confirm' ? (
            <>
              <Button onClick={confirmApply}>确认应用</Button>
              <Button variant="secondary" onClick={cancelFix}>
                取消
              </Button>
            </>
          ) : null}
          {(fixPhase === 'applying' || fixPhase === 'analyzing') && (
            <Button disabled>{fixPhase === 'applying' ? '处理中…' : '分析中…'}</Button>
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
