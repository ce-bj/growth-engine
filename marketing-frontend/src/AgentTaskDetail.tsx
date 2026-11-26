import { useEffect, useState, type CSSProperties } from 'react'

export type DraftPreviewHighlight = {
  tag: string
  label: string
  before: string
  after: string
}

export type DraftPreviewData = {
  pageType: string
  targetUrl: string
  heroHeadline: string
  heroSubhead: string
  highlights: DraftPreviewHighlight[]
  sections: Array<{ title: string; content: string }>
}

export type HandoffTask = {
  id?: string
  focusKey?: string
  title: string
  executor?: string
  from?: string
  approvedAt?: string
  stage?: string
  intent?: 'preview' | 'list' | string
  note?: string
  summary?: string
  target?: string
  requirements?: string[]
  requirementSections?: { label: string; mode?: string; lines?: string[] }[]
  constraints?: string[]
  extra?: string
  view?: string
  draftPreview?: DraftPreviewData
}

const FLOW_STORAGE_KEY = 'growth-workbench-flow-v1'

const FALLBACK_DRAFTS: Record<string, DraftPreviewData> = {
  'k-sample': {
    pageType: '营销落地页成品草稿（待发布）',
    targetUrl: '/campaign/cnc-sample',
    heroHeadline: '48-Hour Rapid CNC Prototyping · ISO9001 Certified Factory',
    heroSubhead: 'Built for 48 hour sample & rapid cnc prototyping buyers · Direct engineering review & instant quote',
    highlights: [
      {
        tag: '新增交期模块',
        label: '首屏显著标注 48 小时快样交付流程',
        before: '原快样流量落在综合产品列表页，无打样交期说明（接住率仅 25%）',
        after: '首屏展示「图纸评估 → 48h 机加出样 → 三坐标检测 → 顺丰/DHL 寄样」四步承诺',
      },
      {
        tag: '认证资质',
        label: '嵌入 ISO9001 质量认证与公差保障',
        before: '列表页无资质展示',
        after: '首屏右侧挂载 ISO9001 认证标识，打消海外采购首单顾虑',
      },
      {
        tag: '询盘入口',
        label: '「获取快样报价」专属 CTA 与表单',
        before: '需点进子详情页才能找到联系入口',
        after: '首屏直出 Get 48h Sample Quote 表单，预计每周多接住约 8 名快样意向访客',
      },
    ],
    sections: [
      {
        title: '首屏 Hero 与快样询价表单',
        content: '针对 48 hour sample 搜索意图定制，首屏左列展示核心卖点（打样：48 小时 / 认证：ISO9001），右列为快速获取报价表单。',
      },
    ],
  },
  't-landing': {
    pageType: '营销落地页草稿（English）',
    targetUrl: '/campaign/cnc-oem-quote（替换 /campaign/cnc-oem-q3）',
    heroHeadline: 'Get Your 3–5 Axis CNC Machining Quote in 24 Hours',
    heroSubhead: 'ISO9001 Certified · 48-Hour Sample Delivery · Upload STEP / DWG / PDF Drawings Directly',
    highlights: [
      {
        tag: '来意对齐',
        label: '首屏价值主张对齐询价搜索词',
        before: '原页标题 Q3 OEM Capability，主讲 20,000㎡ 厂房航拍',
        after: '直击 cnc machining quote / oem cnc quote，首屏承诺 48 小时出样与快速报价',
      },
      {
        tag: '询盘入口',
        label: '首屏内嵌图纸上传与快速询价表单',
        before: '首屏无表单，需滚动到底部联系邮箱',
        after: '首屏右侧直接提供材质/数量选择与图纸上传入口（直连 sales@demo-cnc-oem.com）',
      },
      {
        tag: '加工能力',
        label: '标注 3–5 轴 CNC 与 ISO9001 认证',
        before: '散落在多段介绍中',
        after: '首屏三大信任徽章：3–5 轴精密加工、ISO9001 体系、48h 快样',
      },
    ],
    sections: [
      {
        title: 'Hero 首屏模块',
        content:
          '主标题强调 3–5 轴 CNC 定制报价与 48 小时打样，副标题写明支持 STEP / DWG / PDF 图纸直传，右侧配置精简 4 字段留资表单。',
      },
      {
        title: '工艺与质量背书模块',
        content: '严格调用知识库已授权字段：ISO9001 认证、3–5 轴加工中心、打样周期 48 小时，不虚构客户 Logo。',
      },
    ],
  },
}

function decodeTask(value: string): HandoffTask | null {
  try {
    const binary = atob(value)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    const task = JSON.parse(new TextDecoder().decode(bytes)) as HandoffTask
    if (!task || typeof task.title !== 'string' || !task.title) return null
    return task
  } catch {
    return null
  }
}

export function readHandoffTask() {
  return decodeTask(new URLSearchParams(window.location.search).get('task') || '')
}

function readTask() {
  return readHandoffTask()
}

export default function AgentTaskDetail() {
  const [task, setTask] = useState<HandoffTask | null>(() => readTask())
  const [editing, setEditing] = useState(false)
  const [published, setPublished] = useState(false)

  const focusKey = task?.focusKey || task?.id || 'k-sample'
  const draft: DraftPreviewData =
    task?.draftPreview || FALLBACK_DRAFTS[focusKey] || FALLBACK_DRAFTS['k-sample']

  const [headline, setHeadline] = useState(draft.heroHeadline)
  const [subhead, setSubhead] = useState(draft.heroSubhead)

  useEffect(() => {
    const onPop = () => setTask(readTask())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    setHeadline(draft.heroHeadline)
    setSubhead(draft.heroSubhead)
  }, [draft.heroHeadline, draft.heroSubhead])

  if (!task || task.intent === 'list') return null

  function stay() {
    const url = new URL(window.location.href)
    url.searchParams.delete('task')
    url.searchParams.delete('handoff')
    url.searchParams.delete('focus')
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
    setTask(null)
  }

  function confirmPublish() {
    setPublished(true)
    try {
      const raw = window.localStorage.getItem(FLOW_STORAGE_KEY)
      const cur = raw ? JSON.parse(raw) : {}
      cur.publishedTasks = { ...(cur.publishedTasks || {}), [focusKey]: '刚刚' }
      window.localStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify(cur))
    } catch {
      /* ignore */
    }
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'growth-flow-update',
          action: 'publish',
          focusKey,
          title: task?.title || draft.heroHeadline,
        },
        '*',
      )
    }
  }

  function backToHome() {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'growth-navigate', view: 'dashboard' }, '*')
      return
    }
    stay()
  }

  return (
    <div style={overlay}>
      <article className="agent-task-detail" style={card}>
        <div style={topBar}>
          <span style={statusPill(published)}>{published ? '已上线' : '待发布'}</span>
          <button type="button" style={ghostBtn} onClick={stay}>
            进入智能营销页编辑器
          </button>
        </div>

        <h1 style={title}>{task.title}</h1>
        <p style={summary}>
          <code style={codeTag}>{draft.targetUrl}</code>
        </p>

        <section style={sectionBox}>
          <div style={sectionHeader}>
            <h2 style={sub}>修改点</h2>
          </div>
          <div style={highlightGrid}>
            {draft.highlights.map((h) => (
              <div key={h.label} style={highlightCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={badgeTag}>{h.tag}</span>
                  <strong style={{ fontSize: 14, color: '#0f172a' }}>{h.label}</strong>
                </div>
                <p style={diffOld}>{h.before}</p>
                <p style={diffNew}>{h.after}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ② AI 生成成品预览视图（支持在线微调） */}
        <section style={previewBox}>
          <div style={sectionHeader}>
            <h2 style={sub}>页面预览</h2>
            <button type="button" style={linkBtn} onClick={() => setEditing((v) => !v)}>
              {editing ? '完成微调' : '在线微调文案'}
            </button>
          </div>

          <div style={mockPageHero}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                <span style={trustChip}>ISO9001:2015 Certified</span>
                <span style={trustChip}>48-Hour Rapid Sample</span>
                <span style={trustChip}>±0.02mm Tolerance</span>
              </div>
              {editing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    style={inputStyle}
                  />
                  <textarea
                    value={subhead}
                    onChange={(e) => setSubhead(e.target.value)}
                    rows={2}
                    style={inputStyle}
                  />
                </div>
              ) : (
                <>
                  <h3 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: '#0f172a' }}>
                    {headline}
                  </h3>
                  <p style={{ margin: 0, fontSize: 14, color: '#334155', lineHeight: 1.55 }}>
                    {subhead}
                  </p>
                </>
              )}

              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {draft.sections.map((sec) => (
                  <div key={sec.title} style={secBlock}>
                    <strong style={{ fontSize: 13, color: '#1e293b' }}>{sec.title}</strong>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                      {sec.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div style={mockRfqCard}>
              <strong style={{ fontSize: 15, color: '#0f172a' }}>Request a 24h CNC Quote</strong>
              <span style={{ fontSize: 12, color: '#64748b' }}>
                Upload STEP / DWG / PDF · Direct to Engineering
              </span>
              <div style={fakeField}>Part Material: Aluminum 6061-T6 / 7075 / Stainless</div>
              <div style={fakeField}>Quantity & Target Lead Time (48h Sample Available)</div>
              <div style={fakeField}>Work Email & Company Name</div>
              <div style={fakeCta}>Get Instant Quote &amp; DFM Feedback</div>
            </div>
          </div>
        </section>

        {/* ③ 底部操作栏：确认发布上线 */}
        <footer style={footerBar}>
          <div />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button type="button" style={ghostBtn} onClick={stay}>
              留在智能营销页微调
            </button>
            {published ? (
              <button type="button" style={successBtn} onClick={backToHome}>
                返回增长首页
              </button>
            ) : (
              <button type="button" style={primaryBtn} onClick={confirmPublish}>
                确认发布上线
              </button>
            )}
          </div>
        </footer>
      </article>
    </div>
  )
}

const overlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 4000,
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  overflow: 'auto',
  padding: '28px 20px',
  background: 'rgba(15, 23, 42, 0.45)',
  backdropFilter: 'blur(4px)',
}

const card: CSSProperties = {
  width: 'min(960px, 100%)',
  padding: '24px 28px',
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  boxShadow: '0 20px 50px rgba(15, 23, 42, 0.18)',
  color: '#0f172a',
  fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
}

const topBar: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 12,
}

const statusPill = (done: boolean): CSSProperties => ({
  padding: '3px 10px',
  borderRadius: 999,
  background: done ? '#dcfce7' : '#dbeafe',
  color: done ? '#15803d' : '#1d4ed8',
  fontSize: 12,
  fontWeight: 700,
})

const title: CSSProperties = {
  margin: 0,
  fontSize: 20,
  fontWeight: 700,
  lineHeight: 1.35,
}

const summary: CSSProperties = {
  margin: '8px 0 16px',
  fontSize: 13.5,
  lineHeight: 1.6,
  color: '#475569',
}

const codeTag: CSSProperties = {
  padding: '2px 6px',
  borderRadius: 4,
  background: '#f1f5f9',
  color: '#0f172a',
  fontSize: 12.5,
}

const sectionBox: CSSProperties = {
  padding: '16px 18px',
  borderRadius: 10,
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  marginBottom: 16,
}

const previewBox: CSSProperties = {
  padding: '16px 18px',
  borderRadius: 10,
  background: '#ffffff',
  border: '1px solid #cbd5e1',
  marginBottom: 18,
}

const sectionHeader: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 12,
}

const sub: CSSProperties = {
  margin: 0,
  fontSize: 15,
  fontWeight: 700,
  color: '#0f172a',
}

const highlightGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 12,
}

const highlightCard: CSSProperties = {
  padding: '12px 14px',
  borderRadius: 8,
  background: '#ffffff',
  border: '1px solid #e2e8f0',
}

const badgeTag: CSSProperties = {
  padding: '2px 7px',
  borderRadius: 4,
  background: '#eff6ff',
  color: '#2563eb',
  fontSize: 11,
  fontWeight: 700,
}

const diffOld: CSSProperties = {
  margin: '0 0 6px',
  fontSize: 12.5,
  color: '#64748b',
  lineHeight: 1.45,
}

const diffNew: CSSProperties = {
  margin: 0,
  fontSize: 12.5,
  color: '#0f172a',
  lineHeight: 1.45,
}

const mockPageHero: CSSProperties = {
  display: 'flex',
  gap: 20,
  flexWrap: 'wrap',
  padding: 18,
  borderRadius: 8,
  background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
  border: '1px solid #bfdbfe',
}

const trustChip: CSSProperties = {
  padding: '3px 9px',
  borderRadius: 999,
  background: '#ffffff',
  border: '1px solid #93c5fd',
  color: '#1d4ed8',
  fontSize: 11.5,
  fontWeight: 600,
}

const secBlock: CSSProperties = {
  padding: '10px 12px',
  borderRadius: 6,
  background: 'rgba(255,255,255,0.85)',
  border: '1px solid #e2e8f0',
}

const mockRfqCard: CSSProperties = {
  width: 280,
  padding: 16,
  borderRadius: 8,
  background: '#ffffff',
  border: '1px solid #cbd5e1',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
}

const fakeField: CSSProperties = {
  padding: '7px 10px',
  borderRadius: 6,
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  fontSize: 12,
  color: '#475569',
}

const fakeCta: CSSProperties = {
  marginTop: 4,
  padding: '9px 12px',
  borderRadius: 6,
  background: '#2563eb',
  color: '#ffffff',
  fontSize: 13,
  fontWeight: 600,
  textAlign: 'center',
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 6,
  border: '1px solid #93c5fd',
  fontSize: 14,
}

const footerBar: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  flexWrap: 'wrap',
  paddingTop: 14,
  borderTop: '1px solid #e2e8f0',
}

const primaryBtn: CSSProperties = {
  height: 38,
  padding: '0 20px',
  fontSize: 14,
  fontWeight: 600,
  color: '#fff',
  background: '#2563eb',
  border: 0,
  borderRadius: 8,
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
}

const successBtn: CSSProperties = {
  height: 38,
  padding: '0 20px',
  fontSize: 14,
  fontWeight: 600,
  color: '#fff',
  background: '#16a34a',
  border: 0,
  borderRadius: 8,
  cursor: 'pointer',
}

const ghostBtn: CSSProperties = {
  height: 36,
  padding: '0 14px',
  fontSize: 13,
  fontWeight: 500,
  color: '#334155',
  background: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  cursor: 'pointer',
}

const linkBtn: CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: '#2563eb',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
}
