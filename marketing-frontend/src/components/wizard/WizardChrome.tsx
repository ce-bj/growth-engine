import { Rocket } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  { id: 'pick', label: '选词' },
  { id: 'plan', label: '方案' },
  { id: 'studio', label: '出页' },
] as const

export function WizardChrome({
  step,
  right,
  children,
}: {
  step: 1 | 2
  right?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-12 max-w-4xl items-center gap-3 px-5">
          <Rocket size={17} className="text-indigo-600" />
          <span className="text-sm font-semibold">智能落地页</span>
          <span className="hidden truncate text-xs text-gray-400 sm:inline">
            宁波海工精密机械
          </span>
          <nav className="ml-3 flex items-center text-xs" aria-label="出页步骤">
            {STEPS.map((s, i) => {
              const n = (i + 1) as 1 | 2 | 3
              const on = n === step
              const done = n < step
              return (
                <span key={s.id} className="flex items-center">
                  {i > 0 && <span className="mx-1.5 text-gray-300">/</span>}
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5',
                      on && 'bg-indigo-600 text-white',
                      done && 'font-medium text-indigo-600',
                      !on && !done && 'text-gray-400',
                    )}
                  >
                    {n} {s.label}
                  </span>
                </span>
              )
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2">{right}</div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-6">{children}</main>
    </div>
  )
}
