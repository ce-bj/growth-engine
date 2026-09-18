import { Globe } from 'lucide-react'
import { Button } from './Button'
import { useWorkbench } from '../context/WorkbenchContext'

/** PRD §4 首次引导 — 产品内引导，非 Demo 说明 */
export function GuideModal() {
  const { showGuide, dismissGuide, startDetect, currentSite } = useWorkbench()
  if (!showGuide) return null

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="guide-title">
      <div className="modal">
        <div className="modal__icon" aria-hidden>
          <Globe size={40} color="#6366F1" />
        </div>
        <h2 id="guide-title" className="modal__title">
          是否对当前网站进行健康度检测？
        </h2>
        <p className="modal__desc">
          检测将分析网站在技术性能、SEO、GEO、内容质量、全球合规、商业转化等维度的表现，并给出优化建议。
        </p>
        <div className="modal__actions">
          <Button onClick={startDetect}>开始检测</Button>
          <Button variant="secondary" onClick={dismissGuide}>
            跳过，先看看
          </Button>
        </div>
      </div>
    </div>
  )
}
