import { Building2, FolderOpen, Languages, Package } from 'lucide-react'
import './knowledge.css'

/** 知识域：各智能体生成内容时按域只读检索 */
const DOMAINS = [
  {
    id: 'company',
    name: '企业知识库',
    icon: Building2,
    desc: '公司简介、资质认证、产能与服务能力，保证对外内容口径统一。',
  },
  {
    id: 'product',
    name: '产品与参数库',
    icon: Package,
    desc: '产品型号、规格参数、材质与应用场景，与 PIM 保持同步。',
  },
  {
    id: 'case',
    name: '案例与证据库',
    icon: FolderOpen,
    desc: '项目案例、检测报告、客户授权资料，作为内容引用的证据来源。',
  },
  {
    id: 'glossary',
    name: '术语与译名库',
    icon: Languages,
    desc: '专业名词定义与各语言站点译名，生成母稿时自动校核。',
  },
]

export function KnowledgeBaseView() {
  return (
    <div className="kb-view">
      <div className="kb-view__head">
        <h1 className="page-title">知识库</h1>
        <p className="kb-view__desc">
          企业知识资产统一入口。各智能体生成内容时按知识域只读检索，命中结果带来源与授权状态，未命中的缺口会回流到物料清单。
        </p>
      </div>

      <div className="kb-view__grid">
        {DOMAINS.map((domain) => {
          const Icon = domain.icon
          return (
            <div className="kb-card" key={domain.id}>
              <span className="kb-card__icon" aria-hidden>
                <Icon size={18} />
              </span>
              <div className="kb-card__body">
                <div className="kb-card__title">
                  {domain.name}
                  <span className="kb-card__tag">接入中</span>
                </div>
                <p className="kb-card__desc">{domain.desc}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="kb-note">
        <strong>模块待接入</strong>
        <span>
          知识库的数据接入与检索（RAG）尚未接通，当前为占位页。接通后这里会显示各知识域的条目数、最近更新时间与授权状态，并支持从缺口直接补充条目。
        </span>
      </div>
    </div>
  )
}
