import { ArrowLeft, BarChart3, CircleHelp, Clock3, PanelLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StudioHeaderProps {
  stage: string
  pageTitle: string
  hasDraft: boolean
  published: boolean
  busy: boolean
  panelCollapsed: boolean
  onLibrary: () => void
  onEditor: () => void
  onResults: () => void
  onVersions: () => void
  onHelp: () => void
  onTogglePanel: () => void
}

/** Marketing tools stay in the page header so the host owns the primary sidebar. */
export default function StudioHeader(props: StudioHeaderProps) {
  const inLibrary = props.stage === 'library'
  const inWorkspace = !['library', 'templates', 'results'].includes(props.stage)

  return (
    <header className={`marketing-header${props.published || (inLibrary && props.hasDraft) ? ' has-page-actions' : ''}`}>
      <div className="marketing-header__identity">
        {!inLibrary && (
          <Button variant="ghost" size="sm" onClick={props.onLibrary} disabled={props.busy}>
            <ArrowLeft size={14} />页面列表
          </Button>
        )}
        <div className="marketing-header__title">
          <strong title={inLibrary ? '智能营销页' : props.pageTitle}>
            {inLibrary ? '智能营销页' : props.pageTitle}
          </strong>
          <span>{inLibrary ? '创建、发布与管理营销页面' : props.published ? '已发布 · 修改保存在本地草稿' : '草稿保存在当前浏览器'}</span>
        </div>
      </div>
      <nav className="marketing-header__actions" aria-label="营销页面操作">
        {props.hasDraft && (inLibrary || props.stage === 'results') && (
          <Button variant="outline" size="sm" onClick={props.onEditor} disabled={props.busy}>继续编辑</Button>
        )}
        {inWorkspace && (
          <Button
            className="marketing-panel-toggle" variant="ghost" size="sm"
            aria-label={props.panelCollapsed ? '展开编辑面板' : '收起编辑面板'}
            aria-expanded={!props.panelCollapsed} aria-controls="marketing-editor-panel"
            onClick={props.onTogglePanel}
          >
            <PanelLeft size={15} /><span>{props.panelCollapsed ? '展开面板' : '收起面板'}</span>
          </Button>
        )}
        {props.published && !inLibrary && (
          <>
            <Button variant="ghost" size="sm" aria-current={props.stage === 'results' ? 'page' : undefined} onClick={props.onResults} disabled={props.busy}>
              <BarChart3 size={14} />效果分析
            </Button>
            <Button variant="ghost" size="sm" onClick={props.onVersions} disabled={props.busy}>
              <Clock3 size={14} />发布版本
            </Button>
          </>
        )}
        <Button variant="ghost" size="icon" aria-label="使用说明" title="使用说明" onClick={props.onHelp}>
          <CircleHelp size={17} />
        </Button>
      </nav>
    </header>
  )
}
