import { ArrowRight } from 'lucide-react'
import { Button } from './Button'
import { useWorkbench } from '../context/WorkbenchContext'

/** 站点切换检测弹窗 */
export function SiteSwitchModal() {
  const { pendingSiteId, sites, confirmSiteSwitch, cancelSiteSwitch } = useWorkbench()
  
  if (!pendingSiteId) return null

  const targetSite = sites.find((s) => s.id === pendingSiteId)
  const siteName = targetSite?.name || pendingSiteId

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="switch-title">
      <div className="modal">
        <div className="modal__icon" aria-hidden>
          <ArrowRight size={40} color="#6366F1" />
        </div>
        <h2 id="switch-title" className="modal__title">
          是否对「{siteName}」进行健康度检测？
        </h2>
        <p className="modal__desc">
          检测将分析网站在技术性能、SEO、GEO、内容质量、全球合规、商业转化等维度的表现，并给出优化建议。
        </p>
        <div className="modal__actions">
          <Button onClick={confirmSiteSwitch}>开始检测</Button>
          <Button variant="secondary" onClick={cancelSiteSwitch}>
            跳过，直接切换
          </Button>
        </div>
      </div>
    </div>
  )
}
