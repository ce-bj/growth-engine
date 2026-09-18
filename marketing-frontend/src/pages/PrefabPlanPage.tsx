import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { WizardChrome } from '@/components/wizard/WizardChrome'
import type { PageType } from '@/types'
import {
  applyStage,
  buildContextMessage,
  mockProducts,
  PAGE_TYPE_LABELS,
  SOURCE_LABELS,
  STAGE_LABELS,
  withStartGate,
  type PrefabPlan,
  type Source,
  type Stage,
} from '@/data/prefab'

interface Props {
  plan: PrefabPlan
  onChange: (plan: PrefabPlan) => void
  onBack: () => void
  onStart: (pageType: PageType, contextMessage: string) => void
}

const STAGES: Stage[] = ['awareness', 'consideration', 'decision']
const TYPES: PageType[] = ['product-marketing', 'lead-gen', 'brand', 'promotion', 'exhibition']
const SOURCES: Source[] = ['seo', 'sem', 'social', 'manual']

function Chip({
  on,
  children,
  onClick,
}: {
  on: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'mb-1.5 mr-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors',
        on
          ? 'border-indigo-600 bg-indigo-600 text-white'
          : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300',
      )}
    >
      {children}
    </button>
  )
}

export default function PrefabPlanPage({ plan, onChange, onBack, onStart }: Props) {
  const [ctaDraft, setCtaDraft] = useState(plan.cta_text)
  const gated = useMemo(() => withStartGate({ ...plan, cta_text: ctaDraft.trim() || plan.cta_text }), [plan, ctaDraft])

  useEffect(() => {
    setCtaDraft(plan.cta_text)
  }, [plan.cta_text])

  const set = (patch: Partial<PrefabPlan>) => onChange(withStartGate({ ...plan, ...patch }))

  const pickType = (t: PageType) => {
    const patch: Partial<PrefabPlan> = {
      page_type: t,
      selected_form: t === 'lead-gen' || t === 'exhibition' || t === 'promotion' ? 'lead' : 'inquiry',
    }
    if (t === 'exhibition') {
      patch.exhibition = plan.exhibition ?? { name: '', date: '', location: '', booth: null }
    }
    if (t === 'promotion') {
      patch.promotion = plan.promotion ?? { end_date: '', discount: null }
    }
    if (t === 'lead-gen' && !plan.lead_hook) {
      patch.lead_hook = ''
    }
    set(patch)
  }

  const start = () => {
    const next = withStartGate({ ...plan, cta_text: ctaDraft.trim() || plan.cta_text })
    onChange(next)
    if (!next.can_start) return
    onStart(next.page_type, buildContextMessage(next))
  }

  return (
    <WizardChrome
      step={2}
      right={
        <Button variant="outline" size="sm" onClick={onBack}>
          换一条词
        </Button>
      }
    >
      <div className="mb-5">
        <h1 className="text-lg font-semibold tracking-tight">{plan.query}</h1>
        <p className="mt-1 text-sm text-gray-500">
          关键词、来源、网站档案、知识库已预填。不对就改芯片。开始生成后进入现有文字稿确认，不会直接出 HTML。
        </p>
      </div>

      <p className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm text-indigo-950">
        {STAGE_LABELS[plan.stage]} × {PAGE_TYPE_LABELS[plan.page_type]} = 这一页
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <Field label="渠道">
            {SOURCES.map(s => (
              <Chip key={s} on={plan.source === s} onClick={() => set({ source: s })}>
                {SOURCE_LABELS[s]}
              </Chip>
            ))}
          </Field>
          <Field label="阶段（会带上默认页面类型与 CTA）">
            {STAGES.map(s => (
              <Chip key={s} on={plan.stage === s} onClick={() => onChange(applyStage(plan, s))}>
                {STAGE_LABELS[s]}
              </Chip>
            ))}
          </Field>
          <Field label="页面类型">
            {TYPES.map(t => (
              <Chip key={t} on={plan.page_type === t} onClick={() => pickType(t)}>
                {PAGE_TYPE_LABELS[t]}
              </Chip>
            ))}
          </Field>
          <Field label="主 CTA">
            <input
              value={ctaDraft}
              onChange={e => setCtaDraft(e.target.value)}
              onBlur={() => set({ cta_text: ctaDraft.trim() || plan.cta_text })}
              className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400"
            />
          </Field>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-2 text-xs text-gray-500">网站档案 / 知识库预填</div>
          <p className="text-sm font-medium">{plan.company_name}</p>
          <p className="mt-1 text-xs text-gray-600">{plan.selling_points}</p>
          <p className="mt-1 text-xs text-gray-600">买家：{plan.target_audience}</p>
          <p className="mt-1 text-xs text-gray-600">{plan.contact_info}</p>
          <div className="mt-3 space-y-1.5">
            {mockProducts.map(p => {
              const on = plan.selected_product_ids.includes(p.id)
              return (
                <label key={p.id} className="flex cursor-pointer items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-0.5 accent-indigo-600"
                    checked={on}
                    onChange={() => {
                      const ids = on
                        ? plan.selected_product_ids.filter(id => id !== p.id)
                        : [...plan.selected_product_ids, p.id]
                      set({ selected_product_ids: ids })
                    }}
                  />
                  <span>
                    {p.name_zh}
                    <span className="ml-1 text-xs text-gray-400">{p.name}</span>
                  </span>
                </label>
              )
            })}
          </div>
        </section>
      </div>

      {plan.page_type === 'lead-gen' && (
        <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
          <Field label="留资钩子">
            <input
              value={plan.lead_hook ?? ''}
              onChange={e => set({ lead_hook: e.target.value || null })}
              placeholder="例如：48 小时出样说明"
              className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400"
            />
          </Field>
        </section>
      )}

      {plan.page_type === 'exhibition' && (
        <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-2 text-xs font-medium text-gray-700">展会（缺展位号则不能生成）</div>
          <div className="grid gap-2 sm:grid-cols-2 text-sm">
            <ReadOnly k="名称" v={plan.exhibition?.name || '—'} />
            <ReadOnly k="日期" v={plan.exhibition?.date || '—'} />
            <ReadOnly k="地点" v={plan.exhibition?.location || '—'} />
            <label className="text-xs text-gray-500">
              展位号
              <input
                value={plan.exhibition?.booth ?? ''}
                onChange={e => set({
                  exhibition: {
                    name: plan.exhibition?.name ?? '',
                    date: plan.exhibition?.date ?? '',
                    location: plan.exhibition?.location ?? '',
                    booth: e.target.value || null,
                  },
                })}
                placeholder="补上才能开始生成"
                className="mt-1 w-full rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-sm text-gray-900 outline-none"
              />
            </label>
          </div>
        </section>
      )}

      {plan.page_type === 'promotion' && (
        <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-2 text-xs font-medium text-gray-700">促销（缺折扣力度则不能生成）</div>
          <ReadOnly k="截止" v={plan.promotion?.end_date || '—'} />
          <label className="mt-2 block text-xs text-gray-500">
            折扣力度
            <input
              value={plan.promotion?.discount ?? ''}
              onChange={e => set({
                promotion: {
                  end_date: plan.promotion?.end_date ?? '',
                  discount: e.target.value || null,
                },
              })}
              placeholder="例如：批量满 500 件 9 折。禁止虚构则留空。"
              className="mt-1 w-full rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-sm text-gray-900 outline-none"
            />
          </label>
        </section>
      )}

      <details className="mt-4 rounded-xl border border-gray-200 bg-white p-4 text-xs text-gray-600">
        <summary className="cursor-pointer text-sm text-gray-700">将发给现有出页的配置</summary>
        <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-5">
          {buildContextMessage(gated)}
        </pre>
      </details>

      {gated.blockers.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {gated.blockers.map(b => <div key={b}>{b}</div>)}
        </div>
      )}

      <div className="sticky bottom-0 mt-6 flex justify-end gap-2 border-t border-gray-200 bg-gray-50 py-3">
        <Button variant="outline" onClick={onBack}>返回</Button>
        <Button disabled={!gated.can_start} onClick={start}>开始生成</Button>
      </div>
    </WizardChrome>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1 text-xs text-gray-500">{label}</div>
      {children}
    </div>
  )
}

function ReadOnly({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{k}</div>
      <div className="text-sm">{v}</div>
    </div>
  )
}
