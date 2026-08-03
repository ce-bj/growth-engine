import { Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/Button'
import type { ContentChannel, ContentTaskKind, ContentType } from '../../types'
import { CHANNEL_META, KIND_LABEL, TYPE_LABEL } from './ContentPrimitives'

export interface ContentCreatePayload {
  title: string
  type: ContentType
  kind: ContentTaskKind
  priority: 'P0' | 'P1' | 'P2'
  channels: ContentChannel[]
  theme: string
  audience: string
  userQuestion: string
  dueDate: string
  reason: string
}

const SOURCE_PRESETS = [
  { id: 'gap', label: '网站内容不足（诊断建议）', reason: '检测发现网站在该主题下内容覆盖不足，建议新增内容补齐访客关注的问题。' },
  { id: 'performance', label: '效果分析建议', reason: '根据近期多渠道效果分析，该主题值得扩展或优化以承接更多流量。' },
  { id: 'manual', label: '人工新增', reason: '由运营人员根据业务需要手动创建。' },
] as const

const CHANNELS = Object.keys(CHANNEL_META) as ContentChannel[]

export function ContentCreateDrawer({ onClose, onSubmit }: { onClose: () => void; onSubmit: (payload: ContentCreatePayload) => void }) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<ContentType>('guide')
  const [kind, setKind] = useState<ContentTaskKind>('create')
  const [priority, setPriority] = useState<'P0' | 'P1' | 'P2'>('P1')
  const [channels, setChannels] = useState<ContentChannel[]>(['website'])
  const [theme, setTheme] = useState('')
  const [audience, setAudience] = useState('')
  const [dueDate, setDueDate] = useState('2026-08-15')
  const [sourceId, setSourceId] = useState<typeof SOURCE_PRESETS[number]['id']>('gap')
  const [reason, setReason] = useState<string>(SOURCE_PRESETS[0].reason)

  const toggleChannel = (channel: ContentChannel) => setChannels((current) => current.includes(channel) ? current.filter((item) => item !== channel) : [...current, channel])
  const pickSource = (preset: typeof SOURCE_PRESETS[number]) => { setSourceId(preset.id); setReason(preset.reason) }

  const valid = title.trim() && theme.trim() && audience.trim() && channels.length > 0

  const submit = () => {
    if (!valid) return
    onSubmit({
      title: title.trim(), type, kind, priority, channels, theme: theme.trim(), audience: audience.trim(),
      userQuestion: `${audience.trim()}在${theme.trim()}上最关心什么？`,
      dueDate, reason: reason.trim(),
    })
  }

  return <div className="drawer-root" role="dialog" aria-modal="true" aria-label="新建内容任务">
    <button type="button" className="drawer-mask" aria-label="关闭" onClick={onClose} />
    <aside className="drawer-panel content-create-drawer">
      <div className="drawer-header">
        <div><div className="muted" style={{ marginBottom: 4 }}>内容运营 · 新增内容任务</div><h2 className="drawer-title">新建内容任务</h2></div>
        <button type="button" className="drawer-close" onClick={onClose} aria-label="关闭"><X size={18} /></button>
      </div>

      <div className="drawer-body content-create-form">
        <label className="content-form-field"><span>任务来源</span><div className="content-chip-group">{SOURCE_PRESETS.map((preset) => <button type="button" key={preset.id} className={sourceId === preset.id ? 'is-active' : ''} onClick={() => pickSource(preset)}>{preset.label}</button>)}</div></label>
        <label className="content-form-field"><span>任务背景说明</span><textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} /></label>

        <label className="content-form-field"><span>内容标题 *</span><input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：工业机器人负载选择指南" /></label>

        <div className="content-form-row">
          <label className="content-form-field"><span>内容类型</span><select value={type} onChange={(e) => setType(e.target.value as ContentType)}>{Object.entries(TYPE_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label className="content-form-field"><span>任务类型</span><select value={kind} onChange={(e) => setKind(e.target.value as ContentTaskKind)}>{Object.entries(KIND_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label className="content-form-field"><span>优先级</span><select value={priority} onChange={(e) => setPriority(e.target.value as 'P0' | 'P1' | 'P2')}><option value="P0">P0</option><option value="P1">P1</option><option value="P2">P2</option></select></label>
        </div>

        <label className="content-form-field"><span>目标渠道 *</span><div className="content-chip-group">{CHANNELS.map((channel) => <button type="button" key={channel} className={channels.includes(channel) ? 'is-active' : ''} onClick={() => toggleChannel(channel)}>{CHANNEL_META[channel].label}</button>)}</div></label>

        <label className="content-form-field"><span>内容主题 *</span><input className="form-input" value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="例如：工业机器人负载选型" /></label>
        <label className="content-form-field"><span>目标受众 *</span><input className="form-input" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="例如：正在选型工业机器人的采购/工艺工程师" /></label>

        <div className="content-form-row">
          <label className="content-form-field"><span>计划完成时间</span><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></label>
        </div>

        <div className="content-note"><Sparkles size={16} /><p>访客问题、所需资料等细节将在内容生成阶段由 AI 自动分析补全，无需在此提前填写。</p></div>
      </div>

      <div className="drawer-footer">
        <Button disabled={!valid} onClick={submit}>创建内容任务</Button>
        <Button variant="secondary" onClick={onClose}>取消</Button>
      </div>
    </aside>
  </div>
}
