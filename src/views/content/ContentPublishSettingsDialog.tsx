import { Check, Settings2, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/Button'
import type { ContentChannel, ContentLocale, ContentTask, PublishSettings } from '../../types'
import { CHANNEL_META, isPublishedStatus, StatusBadge, TYPE_LABEL } from './ContentPrimitives'

const CHANNELS = Object.keys(CHANNEL_META) as ContentChannel[]

export function ContentPublishSettingsDialog({ tasks, locales, onClose, onSave }: {
  tasks: ContentTask[]
  locales: ContentLocale[]
  onClose: () => void
  onSave: (settings: PublishSettings) => void
}) {
  const candidates = tasks.filter((task) => !isPublishedStatus(task.status))
  const [contentIds, setContentIds] = useState<string[]>(candidates.filter((task) => task.status === 'pending_approval' || task.status === 'scheduled').map((task) => task.id))
  const [channels, setChannels] = useState<ContentChannel[]>(['website', 'linkedin'])
  const [pickedLocales, setPickedLocales] = useState<string[]>([])
  const [mode, setMode] = useState<'immediate' | 'scheduled'>('scheduled')
  const [scheduledAt, setScheduledAt] = useState('2026-08-03T10:00')
  const [failStrategy, setFailStrategy] = useState<'continue' | 'stop'>('continue')
  const [approval, setApproval] = useState<'manual' | 'auto'>('manual')

  const toggle = <T,>(setter: (updater: (current: T[]) => T[]) => void, value: T) =>
    setter((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value])

  const valid = contentIds.length > 0 && channels.length > 0

  return <div className="content-modal-root" role="dialog" aria-modal="true" aria-label="发布设置">
    <button type="button" className="content-modal-mask" aria-label="关闭" onClick={onClose} />
    <div className="content-modal-panel">
      <header className="content-modal-header">
        <div><span className="content-eyebrow">PUBLISH SETTINGS</span><h3><Settings2 size={17} />发布设置</h3><p>选择要发布的内容，并统一配置渠道、语言站点、时间与失败策略。</p></div>
        <button type="button" className="content-modal-close" onClick={onClose} aria-label="关闭"><X size={18} /></button>
      </header>

      <div className="content-modal-body">
        <section className="content-setting-block">
          <div className="content-setting-block__head"><b>选择内容 *</b><span>已选 {contentIds.length} / {candidates.length} 项</span></div>
          <div className="content-select-list">
            {candidates.length === 0 ? <p className="muted">当前没有待发布的内容。</p> : candidates.map((task) => {
              const checked = contentIds.includes(task.id)
              return <button type="button" key={task.id} className={checked ? 'is-checked' : ''} onClick={() => toggle(setContentIds, task.id)}>
                <span className="content-checkbox">{checked && <Check size={12} />}</span>
                <span className="content-select-list__body"><b>{task.title}</b><small>{TYPE_LABEL[task.type]} · {task.theme} · 计划 {task.dueDate}</small></span>
                <StatusBadge status={task.status} />
              </button>
            })}
          </div>
          <div className="content-select-actions">
            <button type="button" onClick={() => setContentIds(candidates.map((task) => task.id))}>全选</button>
            <button type="button" onClick={() => setContentIds([])}>清空</button>
          </div>
        </section>

        <section className="content-setting-block">
          <div className="content-setting-block__head"><b>发布渠道 *</b><span>选择已完成生成、审查与预览确认的渠道内容</span></div>
          <div className="content-chip-group">{CHANNELS.map((item) => <button type="button" key={item} className={channels.includes(item) ? 'is-active' : ''} onClick={() => toggle(setChannels, item)}>{CHANNEL_META[item].label}</button>)}</div>
        </section>

        <section className="content-setting-block">
          <div className="content-setting-block__head"><b>语言站点</b><span>全球站可同步发布到多语言站点，需先完成术语译名配置</span></div>
          <div className="content-chip-group">{locales.map((locale) => <button type="button" key={locale.code} className={pickedLocales.includes(locale.code) ? 'is-active' : ''} onClick={() => toggle(setPickedLocales, locale.code)}>{locale.label}<small>{locale.site}</small></button>)}</div>
        </section>

        <div className="content-setting-grid">
          <label className="content-form-field"><span>发布方式</span><select value={mode} onChange={(e) => setMode(e.target.value as 'immediate' | 'scheduled')}><option value="scheduled">定时发布</option><option value="immediate">审批通过后立即发布</option></select></label>
          <label className="content-form-field"><span>发布时间</span><input type="datetime-local" value={scheduledAt} disabled={mode === 'immediate'} onChange={(e) => setScheduledAt(e.target.value)} /></label>
          <label className="content-form-field"><span>失败策略</span><select value={failStrategy} onChange={(e) => setFailStrategy(e.target.value as 'continue' | 'stop')}><option value="continue">其他渠道继续发布</option><option value="stop">任一渠道失败则停止整组</option></select></label>
          <label className="content-form-field"><span>审批模式</span><select value={approval} onChange={(e) => setApproval(e.target.value as 'manual' | 'auto')}><option value="manual">人工审批</option><option value="auto">质量与合规通过后自动发布</option></select></label>
        </div>
      </div>

      <footer className="content-modal-footer">
        <span className="muted">将对 {contentIds.length} 项内容、{channels.length} 个渠道{pickedLocales.length ? `、${pickedLocales.length} 个语言站点` : ''}生效</span>
        <div>
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button disabled={!valid} onClick={() => onSave({ contentIds, channels, locales: pickedLocales, mode, scheduledAt, failStrategy, approval })}>保存发布设置</Button>
        </div>
      </footer>
    </div>
  </div>
}
