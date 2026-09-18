/**
 * FormPickerDropdown — 多选下拉，选择落地页收集哪些表单的信息。
 *
 * Mock 数据，真实接入配置：
 *   const FORMS_API = '/api/forms'   // GET → { forms: FormOption[] }
 *   useEffect(() => { fetch(FORMS_API).then(r=>r.json()).then(d=>setForms(d.forms)) }, [])
 */
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, FileText, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── 配置区（接入真实接口时替换此处）─────────────────────────────────────────
// const FORMS_API_ENDPOINT = '/api/forms'

export interface FormOption {
  id: string
  name: string
  description: string
  fields: string[]
}

const MOCK_FORMS: FormOption[] = [
  {
    id: 'inquiry',
    name: '询盘表单',
    description: '收集产品询价信息',
    fields: ['姓名', '邮箱', '公司', '采购量', '需求描述'],
  },
  {
    id: 'lead',
    name: '在线留资表单',
    description: '获取潜在客户信息',
    fields: ['姓名', '电话', '邮箱', '职位'],
  },
  {
    id: 'cert',
    name: '证书查询表单',
    description: '认证查询与下载申请',
    fields: ['姓名', '公司', '邮箱', '证书类型'],
  },
  {
    id: 'bid',
    name: '招投标管理表单',
    description: '项目招投标信息收集',
    fields: ['公司名称', '项目名称', '预算范围', '联系人', '电话'],
  },
  {
    id: 'member',
    name: '会员注册表单',
    description: '用户注册获取会员权益',
    fields: ['用户名', '邮箱', '手机'],
  },
  {
    id: 'custom',
    name: '定制报价表单',
    description: '收集定制化需求',
    fields: ['姓名', '公司', '产品型号', '定制需求', '期望交期'],
  },
]

interface Props {
  value: string[]
  onChange: (ids: string[]) => void
}

export function FormPickerDropdown({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // TODO: 替换为真实接口
  // const [forms, setForms] = useState<FormOption[]>([])
  // useEffect(() => {
  //   fetch(FORMS_API_ENDPOINT).then(r=>r.json()).then(d=>setForms(d.forms))
  // }, [])
  const forms = MOCK_FORMS

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id])
  }

  const remove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(value.filter(v => v !== id))
  }

  const selectedForms = forms.filter(f => value.includes(f.id))

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={cn(
          'w-full flex items-center justify-between text-xs border rounded-lg px-2.5 py-2 outline-none transition-colors text-left',
          open ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-1">
          <FileText size={11} className="text-gray-400 shrink-0" />
          {value.length === 0 ? (
            <span className="text-gray-400 truncate">如：在线留资表单、证书查询表单</span>
          ) : (
            <span className="text-gray-700 truncate">
              {selectedForms.map(f => f.name).join('、')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {value.length > 0 && (
            <span className="bg-indigo-100 text-indigo-700 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
              {value.length}
            </span>
          )}
          <ChevronDown size={11} className={cn('text-gray-400 transition-transform', open && 'rotate-180')} />
        </div>
      </button>

      {/* Selected tags */}
      {selectedForms.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {selectedForms.map(f => (
            <span
              key={f.id}
              className="flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full pl-2 pr-1 py-0.5"
            >
              {f.name}
              <button type="button" onClick={e => remove(f.id, e)} className="hover:bg-indigo-200 rounded-full">
                <X size={9} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="py-1 px-3 pt-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
            选择表单（可多选）
          </div>
          <div className="max-h-52 overflow-y-auto">
            {forms.map(form => {
              const selected = value.includes(form.id)
              return (
                <button
                  key={form.id}
                  type="button"
                  onClick={() => toggle(form.id)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 hover:bg-gray-50 flex items-start gap-2.5 transition-colors',
                    selected && 'bg-indigo-50'
                  )}
                >
                  <div
                    className={cn(
                      'w-3.5 h-3.5 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors',
                      selected ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300'
                    )}
                  >
                    {selected && <Check size={9} className="text-white" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-800">{form.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                      {form.fields.join(' · ')}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
