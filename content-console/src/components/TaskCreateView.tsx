import { useState } from 'react'
import { useStore } from '../store'
import { TODAY } from '../data'

// —— 数据映射表配置 ——
const MAP_ROWS = [
  { ai: '标题', opts: ['资讯标题', '产品标题', '文章标题'] },
  { ai: '关键词', opts: ['副标题', '标签', 'SEO 关键词'] },
  { ai: '正文', opts: ['资讯详情', '产品详情', '正文内容'] },
  { ai: '概要', opts: ['资讯概要', '摘要', '描述'] },
  { ai: '图片', opts: ['封面图', '缩略图', '正文配图'] },
]

const TOPIC_REC = ['行业方案', '行业动态', '新闻资讯', '应用场景', '注意事项', '常见问题', '工作原理', '知识百科', '产品介绍', '行业案例']
const KW_REC = ['渣浆泵', '污水泵', '离心泵厂家']

const APP_OPTS = ['产品管理', '新闻资讯', '常见问题', '企业图册']
const COL_OPTS = ['新闻资讯', '公司动态', '技术解读', '产品速递']
const FREQ_OPTS = ['仅一次', '每天', '每周', '每月']
const COUNT_OPTS = ['1 篇', '2 篇', '3 篇', '5 篇']

export function TaskCreateView({ directionId }: { directionId?: string }) {
  const { createTask, navigate, directions } = useStore()
  const dir = directionId ? directions.find((d) => d.id === directionId) : undefined

  const [title, setTitle] = useState(dir?.title ?? '')
  const [topics, setTopics] = useState<string[]>(
    dir?.topic ? dir.topic.split('/').map((s) => s.trim()).filter(Boolean) : [],
  )
  const [topicInput, setTopicInput] = useState('')
  const [kws, setKws] = useState<string[]>(dir?.kw ?? [])
  const [kwInput, setKwInput] = useState('')
  const [imgOn, setImgOn] = useState(false)
  const [app, setApp] = useState(dir?.app ?? APP_OPTS[0])
  const [col, setCol] = useState(dir?.col ?? COL_OPTS[0])
  const [mapSel, setMapSel] = useState<string[]>(MAP_ROWS.map((r) => r.opts[0]))
  const [freq, setFreq] = useState(dir?.freqText ?? '每周')
  const [count, setCount] = useState(dir?.countText ?? '2 篇')
  const [start, setStart] = useState(dir?.date ?? '2026-09-22')
  const [status, setStatus] = useState('review')
  const [note, setNote] = useState('')

  const addTag = (kind: 'topic' | 'kw', value: string) => {
    const v = value.trim()
    if (!v) return
    if (kind === 'topic') {
      if (!topics.includes(v)) setTopics([...topics, v])
      setTopicInput('')
    } else {
      if (!kws.includes(v)) setKws([...kws, v])
      setKwInput('')
    }
  }
  const removeTag = (kind: 'topic' | 'kw', v: string) => {
    if (kind === 'topic') setTopics(topics.filter((x) => x !== v))
    else setKws(kws.filter((x) => x !== v))
  }

  const validate = (): boolean => {
    if (!title.trim()) {
      alert('请填写任务标题')
      return false
    }
    if (topics.length === 0) {
      alert('请至少选择一个任务主题')
      return false
    }
    if (kws.length === 0) {
      alert('请至少添加一个关键词')
      return false
    }
    return true
  }

  const buildTask = () => ({
    title: title.trim(),
    app,
    col,
    freqText: freq,
    countText: count,
    start,
    next: freq !== '仅一次' ? addDays(start, 7) : '',
    topic: topics.join(' / '),
    kw: kws.slice(),
    note: note.trim(),
    imgOn,
    mode: (status === 'review' ? 'review' : 'publish') as 'review' | 'publish',
    map: mapSel.slice(),
    strat: ['eeat', 'geo'],
  })

  // 保存：存为草稿
  const saveDraft = () => {
    if (!validate()) return
    createTask(buildTask(), 'draft')
    navigate({ name: 'task-list' })
  }

  // 发布：直接创建任务（按开始时间决定未开始/进行中）
  const publish = () => {
    if (!validate()) return
    const taskStatus = start > TODAY ? 'pending' : 'active'
    createTask(buildTask(), taskStatus)
    navigate({ name: 'task-list' })
  }

  return (
    <div className="page">
      <div className="page-head">
        <button className="btn btn-ghost" onClick={() => navigate({ name: 'task-list' })}>‹ 返回</button>
        <h2>新建发布任务</h2>
      </div>

      <div className="form-card">
        <div className="form-sect">
          <div className="fs-h">基本信息</div>
          <div className="form-row">
            <label><span className="req">*</span>任务标题</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：9月工业传感器内容包" />
          </div>
          <div className="form-row">
            <label><span className="req">*</span>任务主题</label>
            <div className="tag-box">
              {topics.map((t) => (
                <span className="tag" key={t}>
                  {t}
                  <span className="tag-x" onClick={() => removeTag('topic', t)}>×</span>
                </span>
              ))}
              <input
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag('topic', topicInput)
                  }
                }}
                placeholder="输入主题回车添加"
              />
            </div>
            <div className="hint">推荐主题（点击添加）：</div>
            <div className="rec-tags">
              {TOPIC_REC.map((t) => (
                <span key={t} onClick={() => addTag('topic', t)}>{t}</span>
              ))}
            </div>
          </div>
          <div className="form-row">
            <label><span className="req">*</span>关键词</label>
            <div className="tag-box">
              {kws.map((k) => (
                <span className="tag" key={k}>
                  {k}
                  <span className="tag-x" onClick={() => removeTag('kw', k)}>×</span>
                </span>
              ))}
              <input
                value={kwInput}
                onChange={(e) => setKwInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag('kw', kwInput)
                  }
                }}
                placeholder="输入关键词回车添加"
              />
            </div>
            <div className="hint">推荐关键词（点击添加）：</div>
            <div className="rec-tags">
              {KW_REC.map((k) => (
                <span key={k} onClick={() => addTag('kw', k)}>{k}</span>
              ))}
            </div>
          </div>
          <div className="form-row">
            <div className="sw-row">
              <div>
                <div className="sw-lab">开启配图</div>
                <div className="sw-hint">文章生成时会插入一张关键词相关配图；配图需人工审核后再发布使用。</div>
              </div>
              <div className={'sw' + (imgOn ? ' on' : '')} onClick={() => setImgOn(!imgOn)} />
            </div>
          </div>
        </div>

        <div className="form-sect">
          <div className="fs-h">推送设置</div>
          <div className="form-row inline">
            <div>
              <label>推送应用</label>
              <select value={app} onChange={(e) => setApp(e.target.value)}>
                {APP_OPTS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label>推送栏目</label>
              <select value={col} onChange={(e) => setCol(e.target.value)}>
                {COL_OPTS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <label>数据映射</label>
            <table className="map-table">
              <thead>
                <tr><th>AI 文章字段</th><th className="arr">»</th><th>系统中字段</th></tr>
              </thead>
              <tbody>
                {MAP_ROWS.map((r, i) => (
                  <tr key={r.ai}>
                    <td>{r.ai}</td>
                    <td className="arr">»</td>
                    <td>
                      <select
                        value={mapSel[i]}
                        onChange={(e) => {
                          const next = mapSel.slice()
                          next[i] = e.target.value
                          setMapSel(next)
                        }}
                      >
                        {r.opts.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="map-note">* 映射在发布后生效，确保 AI 生成内容自动写入对应系统字段。</div>
          </div>
        </div>

        <div className="form-sect">
          <div className="fs-h">推送规则</div>
          <div className="form-row inline three">
            <div>
              <label>推送频率</label>
              <select value={freq} onChange={(e) => setFreq(e.target.value)}>
                {FREQ_OPTS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label>推送数量</label>
              <select value={count} onChange={(e) => setCount(e.target.value)}>
                {COUNT_OPTS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label>推送开始时间</label>
              <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <label>推送内容状态</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="review">待审核（推荐：生成后先由你确认再发布）</option>
              <option value="publish">立即发布（适合低风险的常规内容）</option>
            </select>
          </div>
          <div className="form-row">
            <label>任务说明（可选）</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="补充说明：语气倾向、必须包含的信息、需要避让的表述等" />
          </div>
        </div>
      </div>

      <div className="page-foot">
        <button className="btn btn-ghost" onClick={() => navigate({ name: 'task-list' })}>取消</button>
        <button className="btn btn-ghost" onClick={saveDraft}>保存</button>
        <button className="btn btn-primary" onClick={publish}>发布</button>
      </div>
    </div>
  )
}

function addDays(date: string, n: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}
