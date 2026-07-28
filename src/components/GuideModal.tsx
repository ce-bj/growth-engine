import { Globe } from 'lucide-react'
import { Button } from './Button'
import { useWorkbench } from '../context/WorkbenchContext'

/** PRD §4 首次引导 — 产品内引导，非 Demo 说明 */
export function GuideModal() {
  const { showGuide, dismissGuide, startDetect } = useWorkbench()
  if (!showGuide) return null

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="guide-title">
      <div className="modal">
        <div className="modal__icon" aria-hidden>
          <Globe size={40} color="#6366F1" />
        </div>
        <h2 id="guide-title" className="modal__title">
          检测一下您的网站健康度？
        </h2>
        <p className="modal__desc">
          了解网站在搜索排名、内容质量、获客能力等六个维度的表现，并获得可执行的修复建议。
        </p>
        <div className="modal__actions">
          <Button onClick={startDetect}>立即检测</Button>
          <Button variant="secondary" onClick={dismissGuide}>
            稍后再说
          </Button>
        </div>
      </div>
    </div>
  )
}
