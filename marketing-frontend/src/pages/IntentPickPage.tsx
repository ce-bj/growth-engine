import { ArrowRight, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  intentCandidates,
  planByIntentId,
  clonePlan,
  SOURCE_LABELS,
  STAGE_LABELS,
  PAGE_TYPE_LABELS,
  type PrefabPlan,
} from '@/data/prefab'
import { Button } from '@/components/ui/button'
import { WizardChrome } from '@/components/wizard/WizardChrome'

interface Props {
  onPick: (plan: PrefabPlan) => void
  onExpert: () => void
}

export default function IntentPickPage({ onPick, onExpert }: Props) {
  return (
    <WizardChrome
      step={1}
      right={
        <Button variant="outline" size="sm" onClick={onExpert}>
          专家模式（直接出页）
        </Button>
      }
    >
      <div className="mb-5">
        <h1 className="text-lg font-semibold tracking-tight">待承接</h1>
        <p className="mt-1 text-sm text-gray-500">
          点一条候选词即选定意图。拉词不等于出页，下一屏才是预制方案。数据来自海工精密 mock。
        </p>
      </div>

      <ul className="space-y-2">
        {intentCandidates.map(c => {
          const plan = planByIntentId(c.id)
          const blocked = Boolean(plan && !plan.can_start)
          return (
            <li key={c.id}>
              <button
                type="button"
                disabled={!plan}
                onClick={() => {
                  if (!plan) return
                  onPick(clonePlan(plan))
                }}
                className={cn(
                  'group flex w-full items-stretch overflow-hidden rounded-xl border bg-white text-left transition-colors',
                  'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                )}
              >
                <span
                  className={cn(
                    'w-1 shrink-0',
                    blocked ? 'bg-amber-400' : 'bg-indigo-500',
                  )}
                />
                <span className="flex min-w-0 flex-1 items-start justify-between gap-3 px-4 py-3">
                  <span className="min-w-0">
                    <span className="block font-medium text-gray-900">{c.query}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-600">
                        {SOURCE_LABELS[c.source]}
                      </span>
                      {c.clicks_28d != null && <span>近 28 天点击 {c.clicks_28d}</span>}
                      {c.impressions_28d != null && <span>曝光 {c.impressions_28d}</span>}
                      {plan && (
                        <span>
                          {STAGE_LABELS[plan.stage]} × {PAGE_TYPE_LABELS[plan.page_type]}
                        </span>
                      )}
                    </span>
                    {c.comment && (
                      <span className="mt-1.5 flex items-start gap-1 text-xs text-amber-800">
                        <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                        {c.comment}
                      </span>
                    )}
                    {blocked && plan && (
                      <span className="mt-1 block text-xs text-amber-700">
                        缺事实，不能直接生成
                      </span>
                    )}
                  </span>
                  <span className="mt-1 flex shrink-0 items-center gap-1 text-xs text-gray-400 group-hover:text-indigo-600">
                    用这条
                    <ArrowRight size={14} />
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </WizardChrome>
  )
}
