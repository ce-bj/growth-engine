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
  note?: string
  summary?: string
  target?: string
  draftPreview?: DraftPreviewData
}

const FLOW_STORAGE_KEY = 'growth-workbench-flow-v1'

const FALLBACK_CONTENT_DRAFTS: Record<string, DraftPreviewData> = {
  td1: {
    pageType: '官网内容修正与专业文章（2 篇待发）',
    targetUrl: '/products/sdph-series · /blog/pt100-selection-guide',
    heroHeadline: 'SDPH 系列全国产大电流型产品介绍 & PT100 温度传感器选型指南',
    heroSubhead: '已完成参数勘误、EEAT 权威信源补强与 GEO 结构化问答排版',
    highlights: [
      {
        tag: '参数勘误',
        label: '修正 SDPH 系列额定电流与温升规格表',
        before: '原页面电流规格表述存在前后不一致，易引发工程采购疑虑',
        after: '对照产品与参数库统一修正额定电流与散热曲线说明',
      },
      {
        tag: '结构化摘要',
        label: '新增 GEO 友好型核心结论框与 FAQ',
        before: '纯长文段落，AI 搜索引擎与买家均难以快速抓取选型结论',
        after: '篇首新增 3 条选型速查表与 A/B 级精度对照参数',
      },
      {
        tag: '询盘引导',
        label: '底部挂载选型咨询与样品申请入口',
        before: '文末无转化动作',
        after: '新增「索取完整规格书 / 预约工程师选型」入口',
      },
    ],
    sections: [
      {
        title: '篇目 1：SDPH 系列全国产大电流型 — 产品介绍',
        content: '已修正额定电流参数表，补齐国产化元器件批次说明与高负载温升测试数据。',
      },
      {
        title: '篇目 2：PT100 温度传感器选型指南',
        content: '已补齐 Class A / Class B 精度等级对照表及三线制/四线制接线建议，通过合规与质量自检。',
      },
    ],
  },
  't-detail': {
    pageType: '产品详情页改版草稿',
    targetUrl: '/products/cnc-6061-bracket',
    heroHeadline: 'CNC-6061 Aluminum Bracket · ±0.02mm Precision OEM',
    heroSubhead: 'Material 6061-T6 · Anodizing 10–25 μm · 48-Hour Rapid Sample · MOQ 50 pcs',
    highlights: [
      {
        tag: '首屏重构',
        label: '核心规格参数前置',
        before: '首屏仅展示工厂航拍与 20 年品牌故事，参数表埋在第 3 屏',
        after: '首屏第一段直出型号 CNC-6061、材质 6061-T6、公差 ±0.02mm、MOQ 50 pcs',
      },
      {
        tag: '交期承诺',
        label: '补齐打样与批量周期',
        before: '未写明打样耗时，询价买家因交期不明离开',
        after: '引用企业知识库规范：打样周期 48 小时，批量交期 15–20 天',
      },
      {
        tag: '资质背书',
        label: 'ISO9001 认证随参数同屏展示',
        before: '仅底部文字提及认证',
        after: '首屏规格栏旁展示 ISO9001:2015 认证编号与检测说明',
      },
    ],
    sections: [
      {
        title: '第一屏正文（AI 生成草稿）',
        content:
          'Model: CNC-6061 Aluminum Bracket. Material: 6061-T6; Tolerance: ±0.02 mm; Finish: Anodizing / Powder coat; MOQ: 50 pcs; Lead time: 15–20 days; Rapid prototyping: 48 hours.',
      },
      {
        title: '保留模块（未改动）',
        content: '页面标题、询盘按钮样式、页头页脚与产品实拍图保持原样，不额外编造未授权参数。',
      },
    ],
  },
  't-article': {
    pageType: '官网专业文章草稿',
    targetUrl: '/blog/6061-bracket-dwg-anodizing-guide',
    heroHeadline: 'custom bracket drawing dwg 与 anodizing thickness 6061：图纸格式与氧化膜厚指南',
    heroSubhead: '可接收图纸：STEP / DWG / PDF · 本色/黑色阳极氧化：10–25 μm · 附 CNC-6061 支架选型入口',
    highlights: [
      {
        tag: '零结果词覆盖',
        label: '标题与首段精确命中站内零结果搜索词',
        before: '站内搜索 13 次均返回空列表，56% 访客当场离开',
        after: '全文覆盖 custom bracket drawing dwg 与 anodizing thickness 6061，上线即消除零结果',
      },
      {
        tag: '工艺参数校验',
        label: '严格采用企业知识库膜厚标准',
        before: '旧教程未说明 6061 氧化膜厚区间',
        after: '写明本色阳极氧化 10–25 μm、黑色阳极氧化 10–25 μm，不引用外部未授权标准',
      },
      {
        tag: '转化内链',
        label: '文末直连主力型号详情页',
        before: '技术文章无产品跳转入口',
        after: '文末锚文本直链 CNC-6061 Aluminum Bracket 产品详情页，承接选型询价',
      },
    ],
    sections: [
      {
        title: '第 1 节：可接收图纸格式',
        content: '明确回答工程买家：可接收图纸：STEP / DWG / PDF，支持 3D 与 2D 公差标注核对。',
      },
      {
        title: '第 2 节：6061 阳极氧化膜厚与产品内链',
        content:
          '明确回答：本色阳极氧化：10–25 μm；黑色阳极氧化：10–25 μm。文末引导访问 CNC-6061 Aluminum Bracket 获取报价。',
      },
    ],
  },
}

function decodeTask(): HandoffTask | null {
  try {
    const raw = new URLSearchParams(window.location.search).get('task')
    if (!raw) return null
    const binary = atob(raw)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    const task = JSON.parse(new TextDecoder().decode(bytes)) as HandoffTask
    if (!task || !task.title) return null
    return task
  } catch {
    return null
  }
}

export function GatePreviewModal() {
  const [task, setTask] = useState<HandoffTask | null>(() => decodeTask())
  const [editing, setEditing] = useState(false)
  const [published, setPublished] = useState(false)

  const focusKey = task?.focusKey || task?.id || 'td1'
  const draft =
    task?.draftPreview || FALLBACK_CONTENT_DRAFTS[focusKey] || FALLBACK_CONTENT_DRAFTS.td1

  const [headline, setHeadline] = useState(draft.heroHeadline)
  const [subhead, setSubhead] = useState(draft.heroSubhead)

  useEffect(() => {
    setHeadline(draft.heroHeadline)
    setSubhead(draft.heroSubhead)
  }, [draft.heroHeadline, draft.heroSubhead])

  if (!task) return null

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
      <article style={card}>
        <div style={topBar}>
          <span style={statusPill(published)}>{published ? '已上线' : '待发布'}</span>
          <button type="button" style={ghostBtn} onClick={stay}>
            进入内容发布后台列表
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

        <section style={previewBox}>
          <div style={sectionHeader}>
            <h2 style={sub}>内容预览</h2>
            <button type="button" style={linkBtn} onClick={() => setEditing((v) => !v)}>
              {editing ? '完成微调' : '在线微调正文'}
            </button>
          </div>

          <div style={{ padding: 16, borderRadius: 8, background: '#f8fafc', border: '1px solid #cbd5e1' }}>
            {editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                <input value={headline} onChange={(e) => setHeadline(e.target.value)} style={inputStyle} />
                <textarea value={subhead} onChange={(e) => setSubhead(e.target.value)} rows={2} style={inputStyle} />
              </div>
            ) : (
              <>
                <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{headline}</h3>
                <p style={{ margin: '0 0 12px', fontSize: 13.5, color: '#334155' }}>{subhead}</p>
              </>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {draft.sections.map((sec) => (
                <div
                  key={sec.title}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 6,
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <strong style={{ fontSize: 13, color: '#0f172a' }}>{sec.title}</strong>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#475569', lineHeight: 1.55 }}>{sec.content}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer style={footerBar}>
          <div />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button type="button" style={ghostBtn} onClick={stay}>
              留在内容发布管理页
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
  width: 'min(920px, 100%)',
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
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
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
