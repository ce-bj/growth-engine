import { useMemo, useState } from 'react'
import { Button, Card, Checkbox, Input, Modal, Switch, Tag, Tooltip } from 'antd'
import { CircleAlert, ExternalLink, Pencil, Plus, Radar, Trash2 } from 'lucide-react'
import { useWorkbench } from '../context/WorkbenchContext'
import { COMPANY_NAME } from '../data/mock'
import {
  buildGeoCells,
  buildInitialQuestions,
  cellKey,
  DEFAULT_PLATFORM_CODES,
  GEO_PLATFORMS,
  GEO_PLATFORM_MAP,
  GEO_REGION_LABEL,
  GEO_UNIT_PRICE,
  summarizeCitations,
  type GeoCell,
  type GeoQuestion,
} from '../data/geoMonitorMock'
import './geo-monitor.css'

const UNIT_PRICE = GEO_UNIT_PRICE

function formatMoney(value: number) {
  return `¥${value.toFixed(2)}`
}

export function GeoMonitorView() {
  const { currentSite } = useWorkbench()
  const brand = COMPANY_NAME

  const initial = useMemo(() => {
    const initialQuestions = buildInitialQuestions(brand)
    return { questions: initialQuestions, cells: buildGeoCells(initialQuestions) }
  }, [brand])
  const [questions, setQuestions] = useState<GeoQuestion[]>(initial.questions)
  const [cells, setCells] = useState<Record<string, GeoCell>>(initial.cells)
  const [editor, setEditor] = useState<{ mode: 'add' | 'edit'; questionId?: string } | null>(null)
  const [draftText, setDraftText] = useState('')
  const [draftPlatforms, setDraftPlatforms] = useState<string[]>(DEFAULT_PLATFORM_CODES)
  const [tip, setTip] = useState<string | null>(null)

  const enabledQuestions = questions.filter((q) => q.enabled)

  // 只汇总启用中的问题，停用后结果同步消失，避免数字对不上
  const contentItems = useMemo(
    () => summarizeCitations(cells, questions.filter((q) => q.enabled)),
    [cells, questions],
  )
  const ownContentCount = useMemo(() => contentItems.filter((item) => item.own).length, [contentItems])
  const coveredPlatforms = useMemo(() => {
    const set = new Set<string>()
    enabledQuestions.forEach((q) => q.platforms.forEach((code) => set.add(code)))
    return set.size
  }, [enabledQuestions])

  const hasCitation = (questionId: string, code: string) =>
    (cells[cellKey(questionId, code)]?.citations.length ?? 0) > 0

  const openAdd = () => {
    setEditor({ mode: 'add' })
    setDraftText('')
    setDraftPlatforms([...DEFAULT_PLATFORM_CODES])
  }

  const openEdit = (question: GeoQuestion) => {
    setEditor({ mode: 'edit', questionId: question.id })
    setDraftText(question.text)
    setDraftPlatforms([...question.platforms])
  }

  const closeEditor = () => setEditor(null)

  const flash = (text: string) => {
    setTip(text)
    window.setTimeout(() => setTip(null), 2600)
  }

  const saveQuestion = () => {
    const text = draftText.trim()
    if (!text) {
      flash('请填写要监测的问题')
      return
    }
    if (draftPlatforms.length === 0) {
      flash('请至少选择一个监测模型')
      return
    }
    if (editor?.mode === 'add') {
      if (questions.some((q) => q.text === text)) {
        flash('该问题已存在，请勿重复添加')
        return
      }
      const next: GeoQuestion = {
        id: `gp-c-${Date.now()}`,
        text,
        preset: false,
        enabled: true,
        platforms: [...draftPlatforms],
        createdAt: '2026-11-12',
      }
      const nextQuestions = [...questions, next]
      setQuestions(nextQuestions)
      setCells(buildGeoCells(nextQuestions))
      setEditor(null)
      flash('已添加问题，已纳入本周监测')
      return
    }

    const target = questions.find((q) => q.id === editor?.questionId)
    if (!target) {
      setEditor(null)
      return
    }
    const textChanged = target.text !== text
    const nextQuestion: GeoQuestion = {
      ...target,
      // 文案变更视为新问题，趋势重新累计，避免周环比失真
      id: textChanged ? `${target.id.split('-v')[0]}-v${Date.now().toString().slice(-5)}` : target.id,
      text,
      platforms: [...draftPlatforms],
    }
    const nextQuestions = questions.map((q) => (q.id === target.id ? nextQuestion : q))
    setQuestions(nextQuestions)
    setCells(buildGeoCells(nextQuestions))
    setEditor(null)
    flash(textChanged ? '问题文案已变更，已作为新问题重新监测' : '监测模型已更新')
  }

  const removeQuestion = () => {
    if (editor?.mode !== 'edit') return
    const nextQuestions = questions.filter((q) => q.id !== editor.questionId)
    setQuestions(nextQuestions)
    setCells(buildGeoCells(nextQuestions))
    setEditor(null)
    flash('问题已删除，历史监测记录保留')
  }

  const toggleQuestion = (id: string, enabled: boolean) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, enabled } : q)))
  }

  const editorValid = draftText.trim().length > 0 && draftPlatforms.length > 0
  const editorWeeklyCost = draftPlatforms.length * UNIT_PRICE

  return (
    <div className="geo">
      <header className="geo-head">
        <div className="geo-head__title">
          <span className="geo-head__mark" aria-hidden>
            <Radar size={18} strokeWidth={2.2} />
          </span>
          <div>
            <h2>
              GEO 信源监测
            </h2>
            <p>
              监测品牌：<b>{brand}</b>
              <span className="geo-head__site">{currentSite.name}</span>
            </p>
          </div>
        </div>
      </header>

      <section className="geo-intro" aria-label="功能介绍">
        <p className="geo-intro__lead">
          每周向国内外主流大模型提问你关心的问题，记录回答中引用的每一条内容来源。
        </p>
        <p className="geo-intro__lead">
          看清 AI 在介绍你的品牌时，到底引用了谁的页面。
        </p>
        <p className="geo-intro__points">
          <span>覆盖国内 6 个、海外 3 个大模型</span>
          <span>每条内容记录标题与原始链接</span>
          <span>标注内容被哪些模型引用</span>
        </p>
      </section>

      {tip ? (
        <div className="geo-tip" role="status">
          <CircleAlert size={14} />
          {tip}
        </div>
      ) : null}

      <section className="geo-block" aria-label="支持的大模型">
        <div className="geo-block__head">
          <h3>支持的大模型</h3>
        </div>
        {(['cn', 'overseas'] as const).map((region) => (
          <div key={region} className="geo-models">
            <div className="geo-models__region">{GEO_REGION_LABEL[region]}平台</div>
            <div className="geo-models__grid">
              {GEO_PLATFORMS.filter((platform) => platform.region === region).map((platform) => (
                <Tooltip
                  key={platform.code}
                  title={platform.available ? platform.name : `${platform.name} · ${platform.note ?? '暂不支持'}`}
                >
                  <div className={`geo-model${platform.available ? '' : ' is-off'}`}>
                    <img className="geo-model__logo" src={platform.logo} alt="" loading="lazy" />
                    <span className="geo-model__name">{platform.name}</span>
                    {platform.available ? null : <span className="geo-model__off">暂不支持</span>}
                  </div>
                </Tooltip>
              ))}
            </div>
          </div>
        ))}
      </section>

      <Card
        classNames={{ root: 'geo-panel', body: 'geo-questions-body' }}
        title={
          <div className="geo-block__head is-inline">
            <h3>目前监测的问题</h3>
            <span className="geo-block__meta">
              {enabledQuestions.length} 个启用 · 覆盖 {coveredPlatforms} 个模型
            </span>
          </div>
        }
        extra={
          <Button type="primary" icon={<Plus size={14} />} onClick={openAdd}>
            添加问题
          </Button>
        }
      >
        <ul className="geo-questions">
          {questions.map((question, index) => (
            <li key={question.id} className={question.enabled ? '' : 'is-off'}>
              <span className="geo-questions__idx">{index + 1}</span>
              <div className="geo-questions__main">
                <div className="geo-questions__text">
                  <b>{question.text}</b>
                  {question.preset ? <Tag color="blue">预置</Tag> : <Tag>自定义</Tag>}
                  {question.enabled ? null : <Tag>已停用</Tag>}
                </div>
                <div className="geo-questions__models">
                  {question.platforms.map((code) => {
                    const platform = GEO_PLATFORM_MAP[code]
                    const hit = hasCitation(question.id, code)
                    return (
                      <Tooltip
                        key={code}
                        title={`${platform.name} · ${hit ? '引用了内容' : '未给出引用'}`}
                      >
                        <span className={`geo-modelsign${hit ? ' is-hit' : ''}`}>
                          <i />
                          {platform.short}
                        </span>
                      </Tooltip>
                    )
                  })}
                </div>
              </div>
              <div className="geo-questions__ops">
                <Switch
                  size="small"
                  checked={question.enabled}
                  onChange={(checked) => toggleQuestion(question.id, checked)}
                />
                <button
                  type="button"
                  className="geo-iconbtn"
                  aria-label="编辑问题与监测模型"
                  onClick={() => openEdit(question)}
                >
                  <Pencil size={13} />
                </button>
              </div>
            </li>
          ))}
        </ul>
        <p className="geo-panel__note">
          模型简称前的实心点表示该模型本次在回答中引用了内容，空心点表示有回答但未给出引用来源。
          点击铅笔可调整问题文案与监测模型。
        </p>
      </Card>

      <Card
        classNames={{ root: 'geo-panel', body: 'geo-content-body' }}
        title={
          <div className="geo-block__head is-inline">
            <h3>被引用的内容</h3>
            <span className="geo-block__meta">
              {contentItems.length} 条不重复链接
              {ownContentCount > 0 ? ` · 含我方官网 ${ownContentCount} 条` : ''}
            </span>
          </div>
        }
      >
        {contentItems.length === 0 ? (
          <div className="geo-content-empty">本周期没有任何平台在回答中引用外部内容。</div>
        ) : (
          <ul className="geo-content">
            {contentItems.map((item, index) => (
              <li key={item.url} className={item.own ? 'is-own' : ''}>
                <span className="geo-content__idx">{index + 1}</span>
                <div className="geo-content__body">
                  <a href={item.url} target="_blank" rel="noreferrer">
                    {item.title}
                    <ExternalLink size={12} />
                  </a>
                  <p className="geo-content__summary">{item.summary}</p>
                  <div className="geo-content__meta">
                    <span className="geo-content__domain">{item.domain}</span>
                    {item.own ? <Tag color="green">我方官网</Tag> : null}
                    <span className="geo-content__models">
                      {item.models.map((code) => {
                        const platform = GEO_PLATFORM_MAP[code]
                        return (
                          <Tooltip key={code} title={`${platform.name} 引用了这条内容`}>
                            <i>{platform.short}</i>
                          </Tooltip>
                        )
                      })}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="geo-panel__note">
          只列出模型回答中明确标注的来源链接，按 URL 去重；右侧标签表示这条内容被哪些模型引用。
        </p>
      </Card>

      <Modal
        open={Boolean(editor)}
        title={editor?.mode === 'add' ? '添加监测问题' : '编辑问题与监测模型'}
        onCancel={closeEditor}
        footer={
          <div className="geo-modal-foot">
            {editor?.mode === 'edit' ? (
              <Button danger type="text" icon={<Trash2 size={14} />} onClick={removeQuestion}>
                删除此问题
              </Button>
            ) : (
              <span />
            )}
            <div>
              <Button onClick={closeEditor}>取消</Button>
              <Button type="primary" disabled={!editorValid} onClick={saveQuestion}>
                保存
              </Button>
            </div>
          </div>
        }
      >
        <div className="geo-editor">
          <label className="geo-editor__label" htmlFor="geo-question-input">
            监测问题
          </label>
          <Input.TextArea
            id="geo-question-input"
            value={draftText}
            onChange={(event) => setDraftText(event.target.value)}
            placeholder="例如：Example Trading Co. 品牌怎么样"
            maxLength={100}
            showCount
            autoSize={{ minRows: 2, maxRows: 4 }}
          />
          {editor?.mode === 'edit' ? (
            <p className="geo-editor__hint">修改文案后该问题将作为新问题重新监测，原有记录仍保留。</p>
          ) : null}

          <label className="geo-editor__label">监测模型</label>
          {(['cn', 'overseas'] as const).map((region) => (
            <div key={region} className="geo-editor__group">
              <div className="geo-editor__group-head">{GEO_REGION_LABEL[region]}平台</div>
              <Checkbox.Group
                value={draftPlatforms}
                // 国内、海外是两个独立的 Group，共用一个 state。
                // 直接覆盖会把另一组的勾选清空，因此只替换本组的部分。
                onChange={(values) => {
                  const selected = values as string[]
                  const others = draftPlatforms.filter(
                    (code) => GEO_PLATFORM_MAP[code]?.region !== region,
                  )
                  const order = new Map(GEO_PLATFORMS.map((p, index) => [p.code, index]))
                  setDraftPlatforms(
                    [...others, ...selected].sort(
                      (a, b) => (order.get(a) ?? 99) - (order.get(b) ?? 99),
                    ),
                  )
                }}
                className="geo-editor__options"
              >
                {GEO_PLATFORMS.filter((p) => p.region === region)
                  // 不可用的平台排在组内末尾，避免占住可选项位置
                  .slice()
                  .sort((a, b) => Number(b.available) - Number(a.available))
                  .map((platform) => (
                    <Checkbox key={platform.code} value={platform.code} disabled={!platform.available}>
                      {platform.name}
                      {platform.available ? (
                        <span className="geo-editor__price">{formatMoney(platform.price)}</span>
                      ) : (
                        <span className="geo-editor__off">暂不支持</span>
                      )}
                    </Checkbox>
                  ))}
              </Checkbox.Group>
            </div>
          ))}

          <p className="geo-editor__note">
            已选 <b>{draftPlatforms.length}</b> 个模型 · 每周 {formatMoney(editorWeeklyCost)} · 每个模型每次{' '}
            {formatMoney(UNIT_PRICE)}，每周执行一次，调用失败不扣费。
          </p>
        </div>
      </Modal>
    </div>
  )
}
