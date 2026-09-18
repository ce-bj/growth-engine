/**
 * ProductPickerModal — 选择落地页中展示的产品（多选）。
 * 支持搜索、超链接跳转。
 *
 * Mock 数据，真实接入配置：
 *   const PRODUCTS_API = '/api/products?category=&limit=50'
 *   // GET → { products: ProductOption[] }
 */
import { useState } from 'react'
import { X, Search, Check, Package, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { ProductOption } from '@/types'

// Re-export so callers can import from either location
export type { ProductOption }

// ── 配置区（接入真实接口时替换此处）─────────────────────────────────────────
// const PRODUCTS_API_ENDPOINT = '/api/products'

const MOCK_PRODUCTS: ProductOption[] = [
  {
    id: 'p1', name: '工业级开关电源 SPS-500W', model: 'SPS-500W', category: '开关电源',
    imageUrl: 'https://placehold.co/200x150/4F46E5/white?text=SPS-500W',
    price: '¥380/pc', url: '#', certs: ['CE', 'RoHS'],
  },
  {
    id: 'p2', name: 'UPS 不间断电源 UPS-3KVA', model: 'UPS-3KVA', category: 'UPS电源',
    imageUrl: 'https://placehold.co/200x150/6366f1/white?text=UPS-3KVA',
    price: '¥2,800/台', url: '#', certs: ['CE', 'ISO9001'],
  },
  {
    id: 'p3', name: 'DC-DC 模块电源 DM-48V', model: 'DM-48V', category: '模块电源',
    imageUrl: 'https://placehold.co/200x150/818cf8/white?text=DM-48V',
    price: '¥120/pc', url: '#', certs: ['CE'],
  },
  {
    id: 'p4', name: '轨道式开关电源 DIN-120W', model: 'DIN-120W', category: '开关电源',
    imageUrl: 'https://placehold.co/200x150/4338ca/white?text=DIN-120W',
    price: '¥260/pc', url: '#', certs: ['CE', 'UL'],
  },
  {
    id: 'p5', name: '医疗级电源 MED-300W', model: 'MED-300W', category: '医疗电源',
    imageUrl: 'https://placehold.co/200x150/7c3aed/white?text=MED-300W',
    price: '¥680/pc', url: '#', certs: ['CE', 'IEC60601'],
  },
  {
    id: 'p6', name: '户外防水电源 WP-200W', model: 'WP-200W', category: '防水电源',
    imageUrl: 'https://placehold.co/200x150/0369a1/white?text=WP-200W',
    price: '¥320/pc', url: '#', certs: ['CE', 'IP67'],
  },
  {
    id: 'p7', name: '充电桩专用电源 EV-7KW', model: 'EV-7KW', category: '新能源',
    imageUrl: 'https://placehold.co/200x150/059669/white?text=EV-7KW',
    price: '¥1,200/pc', url: '#', certs: ['CE', 'UL'],
  },
  {
    id: 'p8', name: '通信基站电源 COM-48V', model: 'COM-48V', category: '通信电源',
    imageUrl: 'https://placehold.co/200x150/0891b2/white?text=COM-48V',
    price: '¥950/pc', url: '#', certs: ['CE', 'ETSI'],
  },
]

interface Props {
  selectedIds: string[]
  onConfirm: (products: ProductOption[]) => void
  onClose: () => void
}

export function ProductPickerModal({ selectedIds, onConfirm, onClose }: Props) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds))

  // TODO: 替换为真实接口
  // const [products, setProducts] = useState<ProductOption[]>([])
  // useEffect(() => {
  //   fetch(PRODUCTS_API_ENDPOINT + '?limit=50')
  //     .then(r => r.json())
  //     .then(d => setProducts(d.products))
  // }, [])
  const products = MOCK_PRODUCTS

  const filtered = products.filter(
    p => !search || [p.name, p.model, p.category].some(s => s.includes(search))
  )

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleConfirm = () => {
    onConfirm(products.filter(p => selected.has(p.id)))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-[580px] max-h-[82vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-indigo-500" />
            <h3 className="font-bold text-gray-900">关联展示产品</h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              已选 {selected.size} 个
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200 focus-within:border-indigo-400 focus-within:bg-white transition-colors">
            <Search size={13} className="text-gray-400 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索产品名称、型号、类别…"
              className="bg-transparent text-sm outline-none text-gray-700 flex-1 placeholder:text-gray-400"
              autoFocus
            />
          </div>
        </div>

        {/* Product grid */}
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-2 gap-3 p-4">
            {filtered.map(product => {
              const isSelected = selected.has(product.id)
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => toggle(product.id)}
                  className={cn(
                    'relative text-left rounded-xl border-2 p-3 transition-all hover:shadow-sm group',
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/60'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  )}
                >
                  {/* Selection indicator */}
                  <div
                    className={cn(
                      'absolute top-2.5 right-2.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                      isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300 group-hover:border-indigo-300'
                    )}
                  >
                    {isSelected && <Check size={11} className="text-white" />}
                  </div>

                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-[80px] object-cover rounded-lg mb-2.5 bg-gray-100"
                  />
                  <p className="text-xs font-semibold text-gray-800 leading-tight mb-1 pr-6">
                    {product.name}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                    <span className="text-[10px] text-gray-400">{product.model}</span>
                    <span className="text-[10px] font-semibold text-indigo-600">{product.price}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap mb-1.5">
                    {product.certs.map(c => (
                      <span
                        key={c}
                        className="text-[9px] bg-green-50 text-green-700 border border-green-200 rounded px-1 py-0.5"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                  {product.url && product.url !== '#' && (
                    <a
                      href={product.url}
                      onClick={e => e.stopPropagation()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-0.5 text-[10px] text-indigo-500 hover:text-indigo-700 transition-colors"
                    >
                      <ExternalLink size={9} />
                      产品详情
                    </a>
                  )}
                </button>
              )
            })}
            {filtered.length === 0 && (
              <div className="col-span-2 py-12 text-center text-gray-400 text-sm">
                <Package size={32} className="mx-auto mb-3 opacity-30" />
                没有找到匹配的产品
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            清空选择
          </button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} size="sm" className="text-gray-500">
              取消
            </Button>
            <Button onClick={handleConfirm} size="sm" className="gap-1.5">
              <Check size={12} />
              确认关联 ({selected.size})
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
