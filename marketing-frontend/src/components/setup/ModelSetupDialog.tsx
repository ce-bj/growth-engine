/**
 * ModelSetupDialog — 配置 LLM credential + 模型。
 * 模型名、Base URL 均可自由填写（兼容自建 OpenAI 网关）。
 */
import { useEffect, useState } from 'react'
import { Key, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const PROVIDERS = [
  {
    label: 'OpenAI 兼容',
    type: 'openai_credential',
    models: ['qwen3.6-plus', 'qwen-plus', 'qwen-max', 'claude-sonnet-4-6-high', 'gpt-5.5', 'gpt-4o'],
    defaultBaseUrl: '',
  },
  { label: 'Anthropic (Claude)', type: 'anthropic_credential', models: ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-haiku-4-5'], defaultBaseUrl: '' },
  { label: 'DeepSeek', type: 'deepseek_credential', models: ['deepseek-chat', 'deepseek-reasoner'], defaultBaseUrl: '' },
  { label: 'DashScope (通义)', type: 'dashscope_credential', models: ['qwen-max', 'qwen-plus', 'qwen-turbo', 'qwen3.6-plus'], defaultBaseUrl: '' },
]

const USER_ID = 'dev'

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-User-ID': USER_ID },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  return res.json() as Promise<T>
}

interface Props {
  onComplete: (credentialId: string, modelName: string) => void
  onSkip: () => void
}

export function ModelSetupDialog({ onComplete, onSkip }: Props) {
  const [providerIdx, setProviderIdx] = useState(0)
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [modelName, setModelName] = useState('')
  const [envCredentialId, setEnvCredentialId] = useState<string | null>(null)
  const [hasEnvKey, setHasEnvKey] = useState(false)
  const [envBaseUrl, setEnvBaseUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const provider = PROVIDERS[providerIdx]

  useEffect(() => {
    void fetch('/marketing/model-defaults', { headers: { 'X-User-ID': USER_ID } })
      .then(r => r.ok ? r.json() : null)
      .then((d: { api_base_url?: string; default_model_name?: string; has_api_key?: boolean; credential_id?: string | null } | null) => {
        if (!d) return
        if (d.api_base_url) {
          setBaseUrl(d.api_base_url)
          setEnvBaseUrl(d.api_base_url)
        }
        if (d.default_model_name) setModelName(d.default_model_name)
        setHasEnvKey(Boolean(d.has_api_key))
        setEnvCredentialId(d.credential_id ?? null)
      })
      .catch(() => { /* 弹窗仍可手填 */ })
  }, [])

  const handleSave = async () => {
    const model = modelName.trim()
    if (!model) { setError('请填写模型名称'); return }
    const urlChanged = baseUrl.trim() !== envBaseUrl.trim()
    if (urlChanged && !apiKey.trim()) {
      setError('修改 Base URL 后需要填写 API Key')
      return
    }
    if (!apiKey.trim() && !envCredentialId) { setError('请输入 API Key'); return }
    setError('')
    setLoading(true)
    try {
      let credentialId = envCredentialId ?? ''
      if (apiKey.trim()) {
        const credData: Record<string, string> = {
          type: provider.type,
          api_key: apiKey.trim(),
        }
        if (baseUrl.trim()) credData.base_url = baseUrl.trim()
        const created = await post<{ credential_id: string }>(
          '/credential/',
          { data: credData },
        )
        credentialId = created.credential_id
      }
      setDone(true)
      setTimeout(() => onComplete(credentialId, model), 800)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Key size={20} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">配置 AI 模型</h2>
            <p className="text-xs text-gray-500">模型名和网关地址可自由填写，兼容 OpenAI 接口</p>
          </div>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 size={48} className="text-green-500" />
            <p className="font-medium text-gray-800">配置成功！正在启动…</p>
          </div>
        ) : (
          <>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">协议类型</label>
              <div className="grid grid-cols-2 gap-2">
                {PROVIDERS.map((p, i) => (
                  <button
                    key={p.type}
                    onClick={() => {
                      setProviderIdx(i)
                      if (!modelName.trim()) setModelName(p.models[0] ?? '')
                    }}
                    className={cn(
                      'text-xs rounded-lg border-2 px-3 py-2 text-left transition-all',
                      providerIdx === i
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                模型名称 <span className="text-gray-400 font-normal">（可手填）</span>
              </label>
              <input
                type="text"
                value={modelName}
                onChange={e => setModelName(e.target.value)}
                placeholder="例如 qwen3.6-plus"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 font-mono"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {provider.models.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setModelName(m)}
                    className={cn(
                      'text-[11px] px-2 py-0.5 rounded-md border',
                      modelName === m
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                Base URL <span className="text-gray-400 font-normal">（OpenAI 兼容网关必填）</span>
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={e => setBaseUrl(e.target.value)}
                placeholder="https://your-gateway.com/v1"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                API Key
                {hasEnvKey && (
                  <span className="text-gray-400 font-normal">（.env 已有 Key，可留空）</span>
                )}
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder={hasEnvKey ? '留空则使用 backend/.env 中的 Key' : `${provider.label} API Key`}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 font-mono"
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <Button
                onClick={() => void handleSave()}
                disabled={loading}
                className="flex-1"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : '保存并继续'}
              </Button>
              <Button variant="ghost" onClick={onSkip} className="text-gray-500">
                {hasEnvKey ? '使用 .env 配置' : '跳过'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
