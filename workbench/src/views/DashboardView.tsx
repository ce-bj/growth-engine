import { ArrowRight, RefreshCw, ChevronDown, ChevronUp, X, TrendingUp, TrendingDown } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../components/Button'
import { useWorkbench } from '../context/WorkbenchContext'
import { formatDelta, scoreColor, scoreLevel, scoreLevelBadgeClass, scoreLevelLabel } from '../lib/score'
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, CartesianGrid } from 'recharts'

/** 渠道详情数据 */
interface ChannelDetail {
  key: string
  name: string
  uv: number
  uvDelta: string
  uvPercent: number
  pv: number
  avgPages: string
  bounceRate: number
  bounceRateDelta: string
  stayTime: string
  ctaRate: string
  ctaDelta: string
  formRate: string
  formDelta: string
  aiChat: number
  aiChatDelta: string
  socialJump: number
  socialJumpDelta: string
  inquiryCount: number
  inquiryDelta: string
  inquiryRate: string
  inquiryRateDelta: string
  landingPages: LandingPage[]
  isSocial?: boolean
  socialSources?: SocialSource[]
  /** 广告投放是否已配置 Google Ads 账号 */
  adsConfigured?: boolean
  /** 全球SEO是否已配置 Google Search Console */
  gscConfigured?: boolean
}

interface LandingPage {
  path: string
  name: string
  uv: number
  uvDelta: string
  pv: number
  avgPages: string
  bounceRate: number
  stayTime: string
  ctaRate: string
  formRate: string
  aiChat: number
  socialJump: number
  inquiryCount: number
  inquiryRate: string
  /** 文章类型标签，article 类页面才有值 */
  articleType?: 'blog' | 'case' | 'insight' | 'guide'
  /** 是否为文章级页面（用于样式区分） */
  isArticle?: boolean
}

interface SocialSource {
  name: string
  uv: number
  uvPercent: number
  pv: number
  avgPages: string
  bounceRate: number
  stayTime: string
  ctaRate: string
  formRate: string
  aiChat: number
  socialJump: number
  inquiryCount: number
  inquiryRate: string
  landingPages: LandingPage[]
}

/** Mock 数据 */
const CHANNEL_DATA: ChannelDetail[] = [
  {
    key: 'ad',
    name: '广告投放',
    adsConfigured: false,
    uv: 494,
    uvDelta: '+12%',
    uvPercent: 40,
    pv: 1482,
    avgPages: '3.0',
    bounceRate: 52,
    bounceRateDelta: '-3%',
    stayTime: '48s',
    ctaRate: '5.2%',
    ctaDelta: '+0.3%',
    formRate: '9.1%',
    formDelta: '+1.2%',
    aiChat: 18,
    aiChatDelta: '+3',
    socialJump: 12,
    socialJumpDelta: '+2',
    inquiryCount: 16,
    inquiryDelta: '+4',
    inquiryRate: '3.2%',
    inquiryRateDelta: '-0.2%',
    landingPages: [
      { path: '/', name: '首页', uv: 120, uvDelta: '+8%', pv: 180, avgPages: '1.5', bounceRate: 45, stayTime: '52s', ctaRate: '5.8%', formRate: '8.3%', aiChat: 6, socialJump: 3, inquiryCount: 8, inquiryRate: '6.7%' },
      { path: '/products', name: '产品页', uv: 85, uvDelta: '+5%', pv: 142, avgPages: '1.7', bounceRate: 52, stayTime: '48s', ctaRate: '4.2%', formRate: '9.1%', aiChat: 4, socialJump: 2, inquiryCount: 3, inquiryRate: '3.5%' },
      { path: '/about', name: '关于我们', uv: 62, uvDelta: '+3%', pv: 98, avgPages: '1.6', bounceRate: 38, stayTime: '62s', ctaRate: '6.1%', formRate: '7.2%', aiChat: 3, socialJump: 1, inquiryCount: 2, inquiryRate: '3.2%' },
      { path: '/contact', name: '联系页', uv: 48, uvDelta: '+2%', pv: 76, avgPages: '1.6', bounceRate: 28, stayTime: '58s', ctaRate: '7.2%', formRate: '11.5%', aiChat: 2, socialJump: 1, inquiryCount: 2, inquiryRate: '4.2%' },
      { path: '/blog/industrial-robot-selection', name: '工业机器人选型指南', uv: 35, uvDelta: '-2%', pv: 52, avgPages: '1.5', bounceRate: 68, stayTime: '32s', ctaRate: '2.8%', formRate: '3.2%', aiChat: 1, socialJump: 0, inquiryCount: 1, inquiryRate: '2.9%', articleType: 'guide', isArticle: true },
    ],
  },
  {
    key: 'social',
    name: '社交媒体',
    uv: 309,
    uvDelta: '+8%',
    uvPercent: 25,
    pv: 892,
    avgPages: '2.9',
    bounceRate: 48,
    bounceRateDelta: '-2%',
    stayTime: '42s',
    ctaRate: '3.8%',
    ctaDelta: '+0.2%',
    formRate: '5.6%',
    formDelta: '+0.8%',
    aiChat: 12,
    aiChatDelta: '+2',
    socialJump: 8,
    socialJumpDelta: '+1',
    inquiryCount: 7,
    inquiryDelta: '+2',
    inquiryRate: '2.3%',
    inquiryRateDelta: '+0.1%',
    landingPages: [],
    isSocial: true,
    socialSources: [
      {
        name: 'LinkedIn',
        uv: 125,
        uvPercent: 40,
        pv: 382,
        avgPages: '3.1',
        bounceRate: 42,
        stayTime: '52s',
        ctaRate: '4.5%',
        formRate: '6.8%',
        aiChat: 5,
        socialJump: 2,
        inquiryCount: 4,
        inquiryRate: '3.2%',
        landingPages: [
          { path: '/', name: '首页', uv: 45, uvDelta: '+5%', pv: 72, avgPages: '1.6', bounceRate: 42, stayTime: '58s', ctaRate: '4.5%', formRate: '6.8%', aiChat: 2, socialJump: 0, inquiryCount: 2, inquiryRate: '4.4%' },
          { path: '/products', name: '产品页', uv: 32, uvDelta: '+3%', pv: 58, avgPages: '1.8', bounceRate: 48, stayTime: '45s', ctaRate: '3.8%', formRate: '5.2%', aiChat: 1, socialJump: 0, inquiryCount: 1, inquiryRate: '3.1%' },
          { path: '/about', name: '关于我们', uv: 28, uvDelta: '+2%', pv: 45, avgPages: '1.6', bounceRate: 38, stayTime: '62s', ctaRate: '5.2%', formRate: '7.1%', aiChat: 1, socialJump: 0, inquiryCount: 1, inquiryRate: '3.6%' },
          { path: '/contact', name: '联系页', uv: 20, uvDelta: '+1%', pv: 32, avgPages: '1.6', bounceRate: 35, stayTime: '48s', ctaRate: '6.8%', formRate: '9.2%', aiChat: 1, socialJump: 2, inquiryCount: 0, inquiryRate: '0%' },
        ],
      },
      {
        name: 'Twitter',
        uv: 102,
        uvPercent: 33,
        pv: 298,
        avgPages: '2.9',
        bounceRate: 55,
        stayTime: '38s',
        ctaRate: '3.2%',
        formRate: '4.1%',
        aiChat: 4,
        socialJump: 4,
        inquiryCount: 2,
        inquiryRate: '2.0%',
        landingPages: [
          { path: '/', name: '首页', uv: 38, uvDelta: '+2%', pv: 62, avgPages: '1.6', bounceRate: 55, stayTime: '38s', ctaRate: '3.2%', formRate: '4.1%', aiChat: 1, socialJump: 2, inquiryCount: 1, inquiryRate: '2.6%' },
          { path: '/products', name: '产品页', uv: 28, uvDelta: '+1%', pv: 52, avgPages: '1.9', bounceRate: 52, stayTime: '42s', ctaRate: '2.8%', formRate: '3.5%', aiChat: 1, socialJump: 1, inquiryCount: 1, inquiryRate: '3.6%' },
          { path: '/blog/plc-programming-guide', name: 'PLC编程入门完全指南', uv: 36, uvDelta: '+4%', pv: 68, avgPages: '1.9', bounceRate: 58, stayTime: '35s', ctaRate: '3.5%', formRate: '4.8%', aiChat: 2, socialJump: 1, inquiryCount: 0, inquiryRate: '0%', articleType: 'blog', isArticle: true },
        ],
      },
      {
        name: 'Facebook',
        uv: 82,
        uvPercent: 27,
        pv: 212,
        avgPages: '2.6',
        bounceRate: 48,
        stayTime: '45s',
        ctaRate: '3.8%',
        formRate: '5.2%',
        aiChat: 3,
        socialJump: 2,
        inquiryCount: 1,
        inquiryRate: '1.2%',
        landingPages: [
          { path: '/', name: '首页', uv: 32, uvDelta: '+3%', pv: 52, avgPages: '1.6', bounceRate: 45, stayTime: '48s', ctaRate: '4.2%', formRate: '5.8%', aiChat: 1, socialJump: 1, inquiryCount: 1, inquiryRate: '3.1%' },
          { path: '/products', name: '产品页', uv: 28, uvDelta: '+2%', pv: 48, avgPages: '1.7', bounceRate: 52, stayTime: '42s', ctaRate: '3.5%', formRate: '4.8%', aiChat: 1, socialJump: 1, inquiryCount: 0, inquiryRate: '0%' },
          { path: '/about', name: '关于我们', uv: 22, uvDelta: '+1%', pv: 38, avgPages: '1.7', bounceRate: 42, stayTime: '52s', ctaRate: '3.8%', formRate: '5.2%', aiChat: 1, socialJump: 0, inquiryCount: 0, inquiryRate: '0%' },
        ],
      },
    ],
  },
  {
    key: 'seo',
    name: '全球SEO',
    gscConfigured: true,
    uv: 222,
    uvDelta: '+15%',
    uvPercent: 18,
    pv: 668,
    avgPages: '3.0',
    bounceRate: 42,
    bounceRateDelta: '-5%',
    stayTime: '55s',
    ctaRate: '4.8%',
    ctaDelta: '+0.5%',
    formRate: '7.2%',
    formDelta: '+1.5%',
    aiChat: 8,
    aiChatDelta: '+2',
    socialJump: 3,
    socialJumpDelta: '+1',
    inquiryCount: 9,
    inquiryDelta: '+3',
    inquiryRate: '4.1%',
    inquiryRateDelta: '+0.3%',
    landingPages: [
      { path: '/', name: '首页', uv: 68, uvDelta: '+12%', pv: 125, avgPages: '1.8', bounceRate: 38, stayTime: '62s', ctaRate: '5.2%', formRate: '8.5%', aiChat: 3, socialJump: 1, inquiryCount: 3, inquiryRate: '4.4%' },
      { path: '/products', name: '产品页', uv: 52, uvDelta: '+10%', pv: 98, avgPages: '1.9', bounceRate: 45, stayTime: '52s', ctaRate: '4.5%', formRate: '7.8%', aiChat: 2, socialJump: 1, inquiryCount: 2, inquiryRate: '3.8%' },
      { path: '/about', name: '关于我们', uv: 38, uvDelta: '+8%', pv: 72, avgPages: '1.9', bounceRate: 35, stayTime: '68s', ctaRate: '5.8%', formRate: '8.2%', aiChat: 1, socialJump: 0, inquiryCount: 2, inquiryRate: '5.3%' },
      { path: '/contact', name: '联系页', uv: 28, uvDelta: '+5%', pv: 52, avgPages: '1.9', bounceRate: 32, stayTime: '58s', ctaRate: '6.2%', formRate: '9.5%', aiChat: 1, socialJump: 1, inquiryCount: 1, inquiryRate: '3.6%' },
      { path: '/blog/food-packaging-case', name: '食品包装线改造案例', uv: 36, uvDelta: '+20%', pv: 82, avgPages: '2.3', bounceRate: 48, stayTime: '72s', ctaRate: '3.8%', formRate: '6.5%', aiChat: 1, socialJump: 0, inquiryCount: 1, inquiryRate: '2.8%', articleType: 'case', isArticle: true },
    ],
  },
  {
    key: 'direct',
    name: '直接访问',
    uv: 148,
    uvDelta: '+5%',
    uvPercent: 12,
    pv: 428,
    avgPages: '2.9',
    bounceRate: 45,
    bounceRateDelta: '-2%',
    stayTime: '48s',
    ctaRate: '5.5%',
    ctaDelta: '+0.4%',
    formRate: '8.2%',
    formDelta: '+1.0%',
    aiChat: 5,
    aiChatDelta: '+1',
    socialJump: 2,
    socialJumpDelta: '0',
    inquiryCount: 5,
    inquiryDelta: '+1',
    inquiryRate: '3.4%',
    inquiryRateDelta: '+0.1%',
    landingPages: [
      { path: '/', name: '首页', uv: 58, uvDelta: '+3%', pv: 112, avgPages: '1.9', bounceRate: 42, stayTime: '52s', ctaRate: '6.2%', formRate: '9.5%', aiChat: 2, socialJump: 1, inquiryCount: 2, inquiryRate: '3.4%' },
      { path: '/products', name: '产品页', uv: 42, uvDelta: '+4%', pv: 82, avgPages: '2.0', bounceRate: 48, stayTime: '45s', ctaRate: '5.1%', formRate: '7.8%', aiChat: 1, socialJump: 1, inquiryCount: 2, inquiryRate: '4.8%' },
      { path: '/contact', name: '联系页', uv: 28, uvDelta: '+2%', pv: 52, avgPages: '1.9', bounceRate: 35, stayTime: '55s', ctaRate: '6.8%', formRate: '10.2%', aiChat: 1, socialJump: 0, inquiryCount: 1, inquiryRate: '3.6%' },
      { path: '/about', name: '关于我们', uv: 20, uvDelta: '+5%', pv: 38, avgPages: '1.9', bounceRate: 38, stayTime: '48s', ctaRate: '5.5%', formRate: '7.2%', aiChat: 1, socialJump: 0, inquiryCount: 0, inquiryRate: '0%' },
    ],
  },
  {
    key: 'referral',
    name: '外链',
    uv: 61,
    uvDelta: '+3%',
    uvPercent: 5,
    pv: 168,
    avgPages: '2.8',
    bounceRate: 55,
    bounceRateDelta: '-1%',
    stayTime: '38s',
    ctaRate: '3.2%',
    ctaDelta: '+0.2%',
    formRate: '4.5%',
    formDelta: '+0.5%',
    aiChat: 2,
    aiChatDelta: '+1',
    socialJump: 1,
    socialJumpDelta: '0',
    inquiryCount: 2,
    inquiryDelta: '+1',
    inquiryRate: '3.3%',
    inquiryRateDelta: '+0.2%',
    landingPages: [
      { path: '/blog/automation-trends-2026', name: '2026年制造业自动化趋势', uv: 25, uvDelta: '+5%', pv: 48, avgPages: '1.9', bounceRate: 52, stayTime: '42s', ctaRate: '3.5%', formRate: '5.2%', aiChat: 1, socialJump: 0, inquiryCount: 1, inquiryRate: '4.0%', articleType: 'insight', isArticle: true },
      { path: '/products', name: '产品页', uv: 22, uvDelta: '+2%', pv: 42, avgPages: '1.9', bounceRate: 58, stayTime: '35s', ctaRate: '2.8%', formRate: '4.2%', aiChat: 1, socialJump: 1, inquiryCount: 1, inquiryRate: '4.5%' },
      { path: '/', name: '首页', uv: 14, uvDelta: '+3%', pv: 28, avgPages: '2.0', bounceRate: 48, stayTime: '38s', ctaRate: '3.2%', formRate: '4.8%', aiChat: 0, socialJump: 0, inquiryCount: 0, inquiryRate: '0%' },
    ],
  },
  {
    key: 'discovery',
    name: '自然收录',
    uv: 78,
    uvDelta: '+22%',
    uvPercent: 6,
    pv: 234,
    avgPages: '3.0',
    bounceRate: 38,
    bounceRateDelta: '-8%',
    stayTime: '62s',
    ctaRate: '5.8%',
    ctaDelta: '+0.8%',
    formRate: '8.5%',
    formDelta: '+2.0%',
    aiChat: 3,
    aiChatDelta: '+1',
    socialJump: 0,
    socialJumpDelta: '0',
    inquiryCount: 4,
    inquiryDelta: '+2',
    inquiryRate: '5.1%',
    inquiryRateDelta: '+0.5%',
    landingPages: [
      { path: '/blog/industry-news', name: '行业资讯', uv: 32, uvDelta: '+15%', pv: 58, avgPages: '1.8', bounceRate: 35, stayTime: '68s', ctaRate: '6.2%', formRate: '9.5%', aiChat: 1, socialJump: 0, inquiryCount: 2, inquiryRate: '6.3%', articleType: 'insight', isArticle: true },
      { path: '/products/smart-sensor', name: '智能传感器产品', uv: 28, uvDelta: '+10%', pv: 52, avgPages: '1.9', bounceRate: 42, stayTime: '58s', ctaRate: '5.5%', formRate: '8.2%', aiChat: 1, socialJump: 0, inquiryCount: 1, inquiryRate: '3.6%' },
      { path: '/', name: '首页', uv: 18, uvDelta: '+8%', pv: 35, avgPages: '1.9', bounceRate: 38, stayTime: '52s', ctaRate: '5.2%', formRate: '7.8%', aiChat: 1, socialJump: 0, inquiryCount: 1, inquiryRate: '5.6%' },
    ],
  },
]

/** 总览数据展示组件 */
function OverviewMetrics({ channel }: { channel: ChannelDetail }) {
  return (
    <div className="channel-overview">
      {/* 核心指标大字展示 */}
      <div className="channel-kpi-row">
        <div className="channel-kpi">
          <div className="channel-kpi__value">{channel.uv.toLocaleString()}</div>
          <div className="channel-kpi__label">UV</div>
          <div className="channel-kpi__delta">{channel.uvDelta}</div>
        </div>
        <div className="channel-kpi">
          <div className="channel-kpi__value" style={{ color: channel.bounceRate > 50 ? 'var(--color-warning)' : 'inherit' }}>
            {channel.bounceRate}%
          </div>
          <div className="channel-kpi__label">跳出率</div>
          <div className="channel-kpi__delta">{channel.bounceRateDelta}</div>
        </div>
        <div className="channel-kpi">
          <div className="channel-kpi__value">{channel.inquiryCount}</div>
          <div className="channel-kpi__label">留资数</div>
          <div className="channel-kpi__delta">{channel.inquiryDelta}</div>
        </div>
        <div className="channel-kpi">
          <div className="channel-kpi__value">{channel.inquiryRate}</div>
          <div className="channel-kpi__label">留资率</div>
          <div className="channel-kpi__delta">{channel.inquiryRateDelta}</div>
        </div>
      </div>

      {/* 辅助指标紧凑展示 */}
      <div className="channel-metrics-row">
        <span className="metric-tag">PV {channel.pv.toLocaleString()}</span>
        <span className="metric-tag">平均 {channel.avgPages} 页</span>
        <span className="metric-tag">停留 {channel.stayTime}</span>
        <span className="metric-tag">CTA {channel.ctaRate} {channel.ctaDelta}</span>
        <span className="metric-tag">表单 {channel.formRate} {channel.formDelta}</span>
        <span className="metric-tag">智能客服 {channel.aiChat}次 {channel.aiChatDelta}</span>
        {channel.socialJump > 0 && (
          <span className="metric-tag">社媒跳转 {channel.socialJump}次 {channel.socialJumpDelta}</span>
        )}
      </div>
    </div>
  )
}

/** 着陆页表格组件 */
const ARTICLE_TYPE_META = {
  blog: { label: '博客', color: '#6366f1', bg: '#eef2ff' },
  case: { label: '案例', color: '#22c55e', bg: '#dcfce7' },
  insight: { label: '洞察', color: '#f59e0b', bg: '#fef3c7' },
  guide: { label: '指南', color: '#6366f1', bg: '#e0e7ff' },
}

function LandingPagesTable({ pages, showAll = false }: { pages: LandingPage[]; showAll?: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const displayedPages = showAll || expanded ? pages : pages.slice(0, 3)
  const hasMore = pages.length > 3
  const hasSocial = pages.some(p => p.socialJump > 0)

  return (
    <div className="landing-pages">
      <table className="landing-table">
        <thead>
          <tr>
            <th>页面</th>
            <th>UV</th>
            <th>PV</th>
            <th>浏览</th>
            <th>跳出率</th>
            <th>停留</th>
            <th>CTA</th>
            <th>表单</th>
            <th>智能客服</th>
            {hasSocial && <th>社媒跳转</th>}
            <th>留资数</th>
            <th>留资率</th>
          </tr>
        </thead>
        <tbody>
          {displayedPages.map((page) => {
            const isAlert = page.bounceRate > 65 || page.inquiryCount === 0
            const typeMeta = page.articleType ? ARTICLE_TYPE_META[page.articleType] : null
            return (
              <tr key={page.path} className={isAlert ? 'landing-row--alert' : ''}>
                <td>
                  <div className="page-name">{page.name}</div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="page-path muted">{page.path}</div>
                    {typeMeta && (
                      <span style={{
                        color: typeMeta.color,
                        background: typeMeta.bg,
                        borderRadius: 4,
                        padding: '1px 6px',
                        fontSize: 11,
                        fontWeight: 500,
                      }}>
                        {typeMeta.label}
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <span className="mono">{page.uv}</span>
                  <span className="delta-small">{page.uvDelta}</span>
                </td>
                <td>
                  <span className="mono">{page.pv}</span>
                </td>
                <td>
                  <span className="mono">{page.avgPages} 页</span>
                </td>
                <td>
                  <span style={{
                    color: page.bounceRate > 65 ? 'var(--color-danger)' : page.bounceRate > 50 ? 'var(--color-warning)' : 'inherit',
                    fontWeight: page.bounceRate > 65 ? 600 : 400,
                  }}>
                    {page.bounceRate}%
                  </span>
                </td>
                <td className="mono">{page.stayTime}</td>
                <td>{page.ctaRate}</td>
                <td>{page.formRate}</td>
                <td>{page.aiChat}次</td>
                {hasSocial && (
                  <td>{page.socialJump > 0 ? `${page.socialJump}次` : '-'}</td>
                )}
                <td>
                  <span style={{
                    fontWeight: 600,
                    color: page.inquiryCount === 0 ? 'var(--color-danger)' : 'inherit',
                  }}>
                    {page.inquiryCount}
                  </span>
                </td>
                <td>
                  <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{page.inquiryRate}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {hasMore && !showAll && (
        <button className="expand-btn" onClick={() => setExpanded(true)}>
          <ChevronDown size={16} />
          查看全部 {pages.length} 个着陆页
        </button>
      )}
    </div>
  )
}

/** 渠道详情弹窗组件 */
function ChannelDetailModal({
  channel,
  onClose,
}: {
  channel: ChannelDetail
  onClose: () => void
}) {
  const [activeSource, setActiveSource] = useState<string | null>(null)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{channel.name} · 近7天</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* 留资转化 */}
          <div className="inquiry-hero">
            <div className="inquiry-hero__item">
              <div className="inquiry-hero__value">{channel.inquiryCount}</div>
              <div className="inquiry-hero__label">留资数</div>
              <div className="delta-small">{channel.inquiryDelta}</div>
            </div>
            <div className="inquiry-hero__item">
              <div className="inquiry-hero__value">{channel.inquiryRate}</div>
              <div className="inquiry-hero__label">留资率</div>
              <div className="delta-small">{channel.inquiryRateDelta}</div>
            </div>
            <div className="inquiry-hero__item">
              <div className="inquiry-hero__value">{channel.uv.toLocaleString()}</div>
              <div className="inquiry-hero__label">UV</div>
              <div className="delta-small">{channel.uvDelta}</div>
            </div>
            <div className="inquiry-hero__item">
              <div className="inquiry-hero__value">{channel.pv.toLocaleString()}</div>
              <div className="inquiry-hero__label">PV</div>
              <div className="delta-small">↑ 8%</div>
            </div>
            <div className="inquiry-hero__item">
              <div className="inquiry-hero__value">{channel.bounceRate}%</div>
              <div className="inquiry-hero__label">跳出率</div>
              <div className="delta-small">{channel.bounceRateDelta}</div>
            </div>
          </div>

          {/* 总览数据 */}
          <div className="section">
            <h3 className="section-title">总览数据</h3>
            <OverviewMetrics channel={channel} />
          </div>

          {/* 社交媒体来源 */}
          {channel.isSocial && channel.socialSources && (
            <div className="section">
              <h3 className="section-title">社交媒体来源</h3>
              <div className="social-sources">
                {channel.socialSources.map((source) => (
                  <div
                    key={source.name}
                    className={`social-source-card ${activeSource === source.name ? 'active' : ''}`}
                    onClick={() => setActiveSource(activeSource === source.name ? null : source.name)}
                  >
                    <div className="social-source-header">
                      <span className="social-source-name">{source.name}</span>
                      <span className="social-source-uv">{source.uv} UV</span>
                    </div>
                    <div className="social-source-bars">
                      <div className="mini-bar" style={{ width: `${source.uvPercent}%` }} />
                    </div>

                    {activeSource === source.name && (
                      <div className="social-source-detail">
                        <div className="source-kpi-row">
                          <span>PV {source.pv}</span>
                          <span>跳出率 {source.bounceRate}%</span>
                          <span>停留 {source.stayTime}</span>
                          <span>留资率 {source.inquiryRate}</span>
                        </div>
                        <LandingPagesTable pages={source.landingPages} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 着陆页列表 */}
          {!channel.isSocial && channel.landingPages.length > 0 && (
            <div className="section">
              <h3 className="section-title">着陆页</h3>
              <LandingPagesTable pages={channel.landingPages} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** PRD §3 数据看板重构版 */
export function DashboardView() {
  const wb = useWorkbench()
  const {
    hasDetected,
    loadingDashboard,
    scanning,
    health,
    funnel,
    p0Count,
    p1Count,
    startDetect,
    goReport,
    navigate,
    adsConfigured,
    seoConfigured,
    discoveryActive,
    issues,
    dismissConfigIssue,
  } = wb

  const [expandedChannel, setExpandedChannel] = useState<string | null>(null)
  const [showChannelModal, setShowChannelModal] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('week')

  /** 多渠道7日趋势 mock（增长平稳） */
  const TREND_DATA = [
    { day: '周一', 广告投放: 462, 社交媒体: 285, 全球SEO: 198, 直接访问: 138, 外链: 56, 自然收录: 52 },
    { day: '周二', 广告投放: 478, 社交媒体: 296, 全球SEO: 205, 直接访问: 142, 外链: 58, 自然收录: 58 },
    { day: '周三', 广告投放: 485, 社交媒体: 302, 全球SEO: 212, 直接访问: 144, 外链: 60, 自然收录: 62 },
    { day: '周四', 广告投放: 494, 社交媒体: 309, 全球SEO: 222, 直接访问: 148, 外链: 61, 自然收录: 68 },
    { day: '周五', 广告投放: 510, 社交媒体: 318, 全球SEO: 235, 直接访问: 152, 外链: 65, 自然收录: 72 },
    { day: '周六', 广告投放: 488, 社交媒体: 295, 全球SEO: 218, 直接访问: 145, 外链: 59, 自然收录: 65 },
    { day: '周日', 广告投放: 502, 社交媒体: 312, 全球SEO: 228, 直接访问: 150, 外链: 63, 自然收录: 78 },
  ]

  const CHANNEL_COLORS: Record<string, string> = {
    '广告投放': '#6366f1',
    '社交媒体': '#22c55e',
    '全球SEO': '#4338ca',
  '自然收录': '#14b8a6',
    '直接访问': '#f59e0b',
    '外链': '#ef4444',
  }

  /** 转化率趋势 mock（留资率% + 留资数，双轴） */
  const CONVERSION_TREND = [
    { day: '周一', 留资率: 2.8, 留资数: 5 },
    { day: '周二', 留资率: 3.0, 留资数: 5 },
    { day: '周三', 留资率: 3.1, 留资数: 6 },
    { day: '周四', 留资率: 3.2, 留资数: 6 },
    { day: '周五', 留资率: 3.4, 留资数: 6 },
    { day: '周六', 留资率: 3.0, 留资数: 5 },
    { day: '周日', 留资率: 3.3, 留资数: 6 },
  ]

  // 根据时间范围获取不同的 mock 数据
  const getChannelData = () => {
    switch (dateRange) {
      case 'month':
        return CHANNEL_DATA.map(ch => ({
          ...ch,
          uv: Math.round(ch.uv * 4.2),
          uvDelta: '+8%',
          pv: Math.round(ch.pv * 4.0),
          bounceRate: ch.bounceRate + 3,
          bounceRateDelta: '-1%',
          ctaRate: (parseFloat(ch.ctaRate) + 0.2).toFixed(1) + '%',
          formRate: (parseFloat(ch.formRate) + 0.5).toFixed(1) + '%',
          aiChat: ch.aiChat * 4,
          aiChatDelta: '+12',
          socialJump: ch.socialJump * 3,
          socialJumpDelta: '+5',
          inquiryCount: Math.round(ch.inquiryCount * 4.2),
          inquiryDelta: '+18',
          inquiryRate: (parseFloat(ch.inquiryRate) + 0.3).toFixed(1) + '%',
          inquiryRateDelta: '+0.4%',
          landingPages: ch.landingPages.map(p => ({
            ...p,
            uv: Math.round(p.uv * 4.2),
            pv: Math.round(p.pv * 4.0),
          })),
        }))
      case 'year':
        return CHANNEL_DATA.map(ch => ({
          ...ch,
          uv: Math.round(ch.uv * 12),
          uvDelta: '+25%',
          pv: Math.round(ch.pv * 11),
          bounceRate: ch.bounceRate - 2,
          bounceRateDelta: '-3%',
          ctaRate: (parseFloat(ch.ctaRate) + 0.8).toFixed(1) + '%',
          formRate: (parseFloat(ch.formRate) + 1.2).toFixed(1) + '%',
          aiChat: ch.aiChat * 12,
          aiChatDelta: '+42',
          socialJump: ch.socialJump * 10,
          socialJumpDelta: '+15',
          inquiryCount: Math.round(ch.inquiryCount * 12),
          inquiryDelta: '+65',
          inquiryRate: (parseFloat(ch.inquiryRate) + 0.8).toFixed(1) + '%',
          inquiryRateDelta: '+1.2%',
          landingPages: ch.landingPages.map(p => ({
            ...p,
            uv: Math.round(p.uv * 12),
            pv: Math.round(p.pv * 11),
          })),
        }))
      default:
        return CHANNEL_DATA.filter((ch) => {
          if (ch.key === 'ad' && !adsConfigured) return false
          if (ch.key === 'seo' && !seoConfigured) return false
          if (ch.key === 'discovery' && !discoveryActive) return false
          return true
        })
    }
  }

  const activeChannelData = getChannelData()
  const activeChannel = activeChannelData.find((ch) => ch.key === showChannelModal)

  // 冷启动任务（config 维度未完成项）
  const configIssues = issues.filter(i => i.dimensionKey === 'config')

  if (loadingDashboard) {
    return (
      <div className="stack">
        <div className="skeleton skeleton--card" style={{ height: 120 }} />
        <div className="skeleton skeleton--card" style={{ height: 200 }} />
        <div className="skeleton skeleton--card" style={{ height: 80 }} />
      </div>
    )
  }

  // 正常数据看板
  const level = scoreLevel(health.totalScore)
  const delta = formatDelta(health.totalScore, health.previousScore)
  const pending = p0Count + p1Count

  // 计算整体留资数据
  const totalInquiry = activeChannelData.reduce((sum, ch) => sum + ch.inquiryCount, 0)
  const totalUV = activeChannelData.reduce((sum, ch) => sum + ch.uv, 0)
  const overallInquiryRate = ((totalInquiry / totalUV) * 100).toFixed(1)

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case 'month': return '近一个月'
      case 'year': return '近一年'
      default: return '近一周'
    }
  }

  return (
    <div className="stack">
      {/* 冷启动任务面板 - 看板顶部 */}
      {configIssues.length > 0 && (
        <section className="card cold-start-panel">
          <div className="cold-start-panel__header">
            <h2 className="card__title">🎉 欢迎使用增长工作台</h2>
            <p className="cold-start-panel__desc">
              完成以下 {configIssues.length} 项基础配置，即可解锁全部数据洞察功能，让您的网站流量和转化更上一层楼！
            </p>
          </div>
          <div className="cold-start-list">
            {configIssues.map((issue, index) => (
              <div key={issue.id} className="cold-start-item">
                <div className="cold-start-item__left">
                  <span className="cold-start-item__step">{index + 1}</span>
                  <div className="cold-start-item__content">
                    <span className="cold-start-item__title">{issue.title}</span>
                    <span className={`cold-start-item__priority cold-start-item__priority--${issue.priority.toLowerCase()}`}>
                      {issue.priority}
                    </span>
                  </div>
                </div>
                <button className="btn btn--sm btn--primary" onClick={() => alert(`配置: ${issue.title}`)}>
                  去设置
                </button>
              </div>
            ))}
          </div>
          <div className="cold-start-panel__footer">
            <p className="cold-start-panel__tip">💡 完成配置后，系统将自动为您展示网站健康度报告和流量转化数据</p>
          </div>
        </section>
      )}

      {/* 留资转化 - 核心关注 */}
      <section className="card">
        <div className="section-header">
          <h2 className="card__title">留资转化总览</h2>
          <div className="date-filter">
            <button
              className={`date-filter__btn ${dateRange === 'week' ? 'active' : ''}`}
              onClick={() => setDateRange('week')}
            >
              近一周
            </button>
            <button
              className={`date-filter__btn ${dateRange === 'month' ? 'active' : ''}`}
              onClick={() => setDateRange('month')}
            >
              近一个月
            </button>
            <button
              className={`date-filter__btn ${dateRange === 'year' ? 'active' : ''}`}
              onClick={() => setDateRange('year')}
            >
              近一年
            </button>
          </div>
        </div>
        <div className="kpi-grid-6">
          <div className="kpi-card">
            <div className="kpi-card__icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>🎯</div>
            <div className="kpi-card__body">
              <div className="kpi-card__label">留资率</div>
              <div className="kpi-card__value">{overallInquiryRate}%</div>
              <div className="kpi-card__delta kpi-card__delta--up"><TrendingUp size={12} /> 0.3%</div>
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-card__icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>✅</div>
            <div className="kpi-card__body">
              <div className="kpi-card__label">留资数</div>
              <div className="kpi-card__value">{totalInquiry}</div>
              <div className="kpi-card__delta kpi-card__delta--up"><TrendingUp size={12} /> 12</div>
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-card__icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>👁</div>
            <div className="kpi-card__body">
              <div className="kpi-card__label">UV</div>
              <div className="kpi-card__value">{totalUV.toLocaleString()}</div>
              <div className="kpi-card__delta kpi-card__delta--up"><TrendingUp size={12} /> 12%</div>
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-card__icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>📄</div>
            <div className="kpi-card__body">
              <div className="kpi-card__label">PV</div>
              <div className="kpi-card__value">{(totalUV * 3.0).toLocaleString()}</div>
              <div className="kpi-card__delta kpi-card__delta--up"><TrendingUp size={12} /> 8%</div>
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-card__icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>⏱</div>
            <div className="kpi-card__body">
              <div className="kpi-card__label">平均停留</div>
              <div className="kpi-card__value">48s</div>
              <div className="kpi-card__delta kpi-card__delta--up"><TrendingUp size={12} /> 5s</div>
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-card__icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>⚠</div>
            <div className="kpi-card__body">
              <div className="kpi-card__label">跳出率</div>
              <div className="kpi-card__value" style={{ color: '#ef4444' }}>48%</div>
              <div className="kpi-card__delta kpi-card__delta--down"><TrendingDown size={12} /> 2%</div>
            </div>
          </div>
        </div>
      </section>

      {/* 趋势 + 来源分布 两列 */}
      <div className="chart-row">
        <section className="card chart-card">
          <div className="section-header">
            <h3 className="card__title">📈 多渠道流量趋势</h3>
            <span className="muted">近7天</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={TREND_DATA} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="广告投放" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="社交媒体" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="全球SEO" stroke="#4338ca" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="自然收录" stroke="#14b8a6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="直接访问" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="外链" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </section>
        <section className="card chart-card">
          <div className="section-header">
            <h3 className="card__title">🍩 流量来源分布</h3>
            <span className="muted">访客占比</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={activeChannelData.map(ch => ({ name: ch.name, value: ch.uv, color: CHANNEL_COLORS[ch.name] || '#64748b' }))}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={2}
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {activeChannelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHANNEL_COLORS[entry.name] || '#64748b'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </section>
      </div>

      {/* 转化率趋势 + 转化洞察 */}
      <div className="chart-row">
        <section className="card chart-card">
          <div className="section-header">
            <h3 className="card__title">📉 转化率趋势</h3>
            <span className="muted">近7天 · 留资率 vs 留资数</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={CONVERSION_TREND} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
              <YAxis yAxisId="left" stroke="#22c55e" fontSize={12} tickFormatter={(v) => `${v}%`} />
              <YAxis yAxisId="right" orientation="right" stroke="#6366f1" fontSize={12} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                labelStyle={{ color: '#e2e8f0' }}
                formatter={(value, name) => [
                  name === '留资率' ? `${Number(value)}%` : `${value} 条`,
                  name,
                ]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line yAxisId="left" type="monotone" dataKey="留资率" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line yAxisId="right" type="monotone" dataKey="留资数" stroke="#6366f1" strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </section>
        <section className="card chart-card conversion-insight">
          <div className="section-header">
            <h3 className="card__title">💡 转化洞察</h3>
          </div>
          <div className="conversion-insight__body">
            <div className="conversion-insight__item">
              <div className="conversion-insight__label">本周留资率</div>
              <div className="conversion-insight__value" style={{ color: '#22c55e' }}>{overallInquiryRate}%</div>
              <div className="kpi-card__delta kpi-card__delta--up"><TrendingUp size={11} /> 0.3%</div>
            </div>
            <div className="conversion-insight__divider" />
            <div className="conversion-insight__item">
              <div className="conversion-insight__label">流量涨 / 转化涨</div>
              <div className="conversion-insight__value">12% <span className="conversion-insight__vs">/</span> +0.3%</div>
              <div className="conversion-insight__note">流量增长未完全转化为留资提升</div>
            </div>
          </div>
        </section>
      </div>

      {/* 流量来源 - 核心关注 */}
      <section className="card">
        <div className="section-header">
          <h2 className="card__title">流量来源</h2>
          <span className="muted">{activeChannelData.length + (!adsConfigured ? 1 : 0) + (!seoConfigured ? 1 : 0)} 个渠道</span>
        </div>
        <div className="channel-cards-grid">
          {/* 广告投放骨架卡片 - 未配置时显示 */}
          {!adsConfigured && (
            <div className="channel-card channel-card--skeleton">
              <div className="channel-card__head">
                <div className="channel-card__title">
                  <span className="channel-card__name">广告投放</span>
                  <span className="channel-card__tag">未配置</span>
                </div>
              </div>
              <div className="channel-card__body">
                <p style={{ color: '#64748b', fontSize: 14, margin: '12px 0' }}>
                  配置 Google Ads 账号后可查看广告投放数据
                </p>
                <button className="btn btn--primary btn--sm" onClick={() => alert('配置 Google Ads 账号')}>
                  连接账号
                </button>
              </div>
            </div>
          )}
          {/* 全球SEO骨架卡片 - 未配置时显示 */}
          {!seoConfigured && (
            <div className="channel-card channel-card--skeleton">
              <div className="channel-card__head">
                <div className="channel-card__title">
                  <span className="channel-card__name">全球SEO</span>
                  <span className="channel-card__tag">未配置</span>
                </div>
              </div>
              <div className="channel-card__body">
                <p style={{ color: '#64748b', fontSize: 14, margin: '12px 0' }}>
                  连接 Google Search Console 后可查看SEO数据
                </p>
                <button className="btn btn--primary btn--sm" onClick={() => alert('配置 Google Search Console')}>
                  连接账号
                </button>
              </div>
            </div>
          )}
          {activeChannelData.map((channel) => {
            const color = CHANNEL_COLORS[channel.name] || '#64748b'
            const isHi = channel.uvPercent >= 25
            const isLow = channel.uvPercent < 10
            return (
              <div
                key={channel.key}
                className={`channel-card ${expandedChannel === channel.key ? 'expanded' : ''}`}
                style={{ borderLeft: `4px solid ${color}` }}
              >
                <div
                  className="channel-card__head"
                  onClick={() => setExpandedChannel(expandedChannel === channel.key ? null : channel.key)}
                >
                  <div className="channel-card__title">
                    <span className="channel-card__name">{channel.name}</span>
                    {isHi && <span className="channel-card__tag channel-card__tag--hi">重点渠道</span>}
                    {isLow && <span className="channel-card__tag channel-card__tag--low">流量偏低</span>}
                  </div>
                  <div className="channel-card__metrics">
                    <div className="channel-card__metric">
                      <div className="channel-card__metric-label">UV</div>
                      <div className="channel-card__metric-value" style={{ color }}>{channel.uv.toLocaleString()}</div>
                      <div className={`channel-card__delta ${channel.uvDelta.startsWith('+') ? 'kpi-card__delta--up' : 'kpi-card__delta--down'}`}>
                        {channel.uvDelta.startsWith('+') ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {channel.uvDelta}
                      </div>
                    </div>
                    <div className="channel-card__metric">
                      <div className="channel-card__metric-label">留资数</div>
                      <div className="channel-card__metric-value" style={{ color: '#22c55e' }}>{channel.inquiryCount}</div>
                      <div className="kpi-card__delta kpi-card__delta--up">
                        <TrendingUp size={10} />
                        {channel.inquiryDelta}
                      </div>
                    </div>
                    <div className="channel-card__metric">
                      <div className="channel-card__metric-label">留资率</div>
                      <div className="channel-card__metric-value">{channel.inquiryRate}</div>
                      <div className={`channel-card__delta ${!channel.inquiryRateDelta.startsWith('-') ? 'kpi-card__delta--up' : 'kpi-card__delta--down'}`}>
                        {!channel.inquiryRateDelta.startsWith('-') ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {channel.inquiryRateDelta}
                      </div>
                    </div>
                    <div className="channel-card__metric">
                      <div className="channel-card__metric-label">跳出率</div>
                      <div className="channel-card__metric-value" style={{ color: channel.bounceRate > 50 ? '#ef4444' : 'inherit' }}>{channel.bounceRate}%</div>
                      <div className={`channel-card__delta ${channel.bounceRateDelta.startsWith('-') ? 'kpi-card__delta--up' : 'kpi-card__delta--down'}`}>
                        {channel.bounceRateDelta.startsWith('-') ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
                        {channel.bounceRateDelta}
                      </div>
                    </div>
                  </div>
                  <div className="channel-card__progress">
                    <div
                      className="channel-card__progress-bar"
                      style={{ width: `${channel.uvPercent}%`, background: `linear-gradient(90deg, ${color}CC, ${color})` }}
                    />
                    <span className="channel-card__progress-label">占比 {channel.uvPercent}%</span>
                  </div>
                  <div className="channel-card__actions">
                    <button
                      className="channel-card__toggle"
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpandedChannel(expandedChannel === channel.key ? null : channel.key)
                      }}
                    >
                      {expandedChannel === channel.key ? '收起明细' : '展开指标'}
                      <ChevronDown size={14} className={expandedChannel === channel.key ? 'expanded-icon' : ''} />
                    </button>
                    <button
                      className="channel-card__detail-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowChannelModal(channel.key)
                      }}
                    >
                      查看完整报表 →
                    </button>
                  </div>
                </div>

                {expandedChannel === channel.key && (
                  <div className="channel-card__expanded">
                    <OverviewMetrics channel={channel} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* 着陆页转化排行 + 渠道转化对比 两列 */}
      <div className="chart-row">
        <section className="card chart-card">
          <div className="section-header">
            <h3 className="card__title">🏆 页面转化率排行</h3>
            <span className="muted">TOP 5</span>
          </div>
          <div className="rank-list">
            {(() => {
              const allPages = activeChannelData.flatMap(ch => ch.landingPages || [])
              const top5 = [...allPages].sort((a, b) => parseFloat(b.inquiryRate) - parseFloat(a.inquiryRate)).slice(0, 5)
              const maxRate = Math.max(...top5.map(p => parseFloat(p.inquiryRate)))
              return top5.map((page, idx) => {
                const rate = parseFloat(page.inquiryRate)
                const widthPct = (rate / maxRate) * 100
                const isZero = page.inquiryCount === 0
                return (
                  <div key={page.path} className={`rank-item ${isZero ? 'rank-item--alert' : ''}`}>
                    <div className="rank-item__num">{idx + 1}</div>
                    <div className="rank-item__body">
                      <div className="rank-item__name">{page.name}</div>
                      <div className="rank-item__bar-wrap">
                        <div
                          className="rank-item__bar"
                          style={{ width: `${widthPct}%`, background: isZero ? 'var(--color-danger)' : 'linear-gradient(90deg, #22c55e, #6366f1)' }}
                        />
                      </div>
                    </div>
                    <div className="rank-item__value" style={{ color: isZero ? 'var(--color-danger)' : 'var(--color-text)' }}>
                      {page.inquiryRate}
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        </section>
        <section className="card chart-card">
          <div className="section-header">
            <h3 className="card__title">📊 各渠道转化率对比</h3>
            <span className="muted">访客→留资</span>
          </div>
          <div className="channel-bar-list">
            {activeChannelData.map(ch => {
              const rate = parseFloat(ch.inquiryRate)
              const maxRate = Math.max(...activeChannelData.map(c => parseFloat(c.inquiryRate)))
              const widthPct = (rate / maxRate) * 100
              return (
                <div key={ch.key} className="channel-bar-item">
                  <div className="channel-bar-item__label">{ch.name}</div>
                  <div className="channel-bar-item__bar-wrap">
                    <div
                      className="channel-bar-item__bar"
                      style={{ width: `${widthPct}%`, background: CHANNEL_COLORS[ch.name] || '#64748b' }}
                    />
                  </div>
                  <div className="channel-bar-item__value">{ch.inquiryRate}</div>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      {/* 网站健康度 - 辅助信息 */}
      <section className="card health-mini">
        <div className="row row--between">
          <div>
            <h2 className="card__title" style={{ marginBottom: 4 }}>网站健康度</h2>
            <div className="row" style={{ gap: 12 }}>
              <span
                className="score-badge"
                style={{ background: scoreColor(health.totalScore) }}
              >
                {health.totalScore} 分
              </span>
              <span className={scoreLevelBadgeClass(level)}>{scoreLevelLabel(level)}</span>
              {pending > 0 && (
                <span className="muted">{pending} 个问题待处理</span>
              )}
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={goReport}>
            查看报告
            <ArrowRight size={14} />
          </Button>
        </div>
      </section>

      {/* 渠道详情弹窗 */}
      {activeChannel && (
        <ChannelDetailModal
          channel={activeChannel}
          onClose={() => setShowChannelModal(null)}
        />
      )}

      {/* 底部操作 */}
      <div className="row" style={{ marginTop: 16 }}>
        <Button variant="secondary" onClick={() => navigate('tasks')}>
          处理智能体任务
        </Button>
        <Button variant="secondary" onClick={startDetect} disabled={scanning}>
          <RefreshCw size={16} />
          重新检测
        </Button>
      </div>
    </div>
  )
}
