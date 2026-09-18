import { useState, useEffect, useRef, useCallback } from 'react'
import { Monitor, Tablet, Smartphone, Code2, Eye, Loader2, Globe, Pencil, Lock, Maximize2, Minimize2 } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { RegionEditDialog, type RegionClickInfo } from './RegionEditDialog'
import { cn } from '@/lib/utils'
import type { FlowState } from '@/types'

type Device = 'desktop' | 'tablet' | 'mobile'

interface Props {
  html: string
  flowState: FlowState
  isLoading: boolean
  onPatchPage?: (instruction: string) => void
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
}

const DEVICE_WIDTHS: Record<Device, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
}

const DEVICE_ICONS = {
  desktop: <Monitor size={14} />,
  tablet: <Tablet size={14} />,
  mobile: <Smartphone size={14} />,
}

// Edit-mode overlay script injected into the iframe HTML.
// Listens for hover + click on data-region elements and posts messages to parent.
const EDIT_MODE_SCRIPT = `
<style id="__edit_style__">
  [data-region] {
    cursor: pointer !important;
    transition: outline 0.12s, outline-offset 0.12s;
  }
  [data-region]:hover {
    outline: 2px dashed #4F46E5 !important;
    outline-offset: 3px !important;
  }
  .__region_badge__ {
    position: fixed;
    background: #4F46E5;
    color: white;
    font-size: 11px;
    font-family: system-ui, sans-serif;
    padding: 3px 10px;
    border-radius: 4px;
    z-index: 99999;
    pointer-events: none;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(79,70,229,0.4);
  }
</style>
<script id="__edit_script__">
(function() {
  var badge = null;
  function removeBadge() { if (badge) { badge.remove(); badge = null; } }

  document.querySelectorAll('[data-region]').forEach(function(el) {
    var name = el.getAttribute('data-region');

    el.addEventListener('mouseenter', function(e) {
      removeBadge();
      badge = document.createElement('div');
      badge.className = '__region_badge__';
      badge.textContent = '✏ ' + name;
      document.body.appendChild(badge);
    });

    el.addEventListener('mousemove', function(e) {
      if (badge) {
        badge.style.left = (e.clientX + 14) + 'px';
        badge.style.top  = (e.clientY - 28) + 'px';
      }
    });

    el.addEventListener('mouseleave', function() { removeBadge(); });

    el.addEventListener('click', function(e) {
      e.stopPropagation();
      removeBadge();
      window.parent.postMessage({
        type: 'region_click',
        regionName: name,
        regionText: el.innerText.slice(0, 300)
      }, '*');
    });
  });
})();
<\/script>
`

// djb2 哈希，用于在 html 变化时强制 iframe 重新挂载（仅渲染时计算一次）
function hashHtml(html: string): number {
  let h = 5381
  for (let i = 0; i < html.length; i++) h = ((h << 5) + h + html.charCodeAt(i)) | 0
  return h
}

function injectEditScript(html: string): string {
  if (html.includes('__edit_script__')) return html
  const injection = EDIT_MODE_SCRIPT
  if (html.includes('</body>')) {
    return html.replace('</body>', injection + '\n</body>')
  }
  return html + injection
}

export function PreviewPanel({ html, flowState, isLoading, onPatchPage, isFullscreen = false, onToggleFullscreen }: Props) {
  const [device, setDevice] = useState<Device>('desktop')
  const [isEditing, setIsEditing] = useState(false)
  const [activeRegion, setActiveRegion] = useState<RegionClickInfo | null>(null)

  const isEmpty = !html
  const isGenerating = flowState === 'PAGE_GENERATING'

  // Listen for region click messages from the iframe
  const handleMessage = useCallback((e: MessageEvent) => {
    if (e.data?.type === 'region_click') {
      setActiveRegion({
        regionId: 0,
        regionName: e.data.regionName as string,
        regionText: e.data.regionText as string,
      })
    }
  }, [])

  useEffect(() => {
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [handleMessage])

  // Reset edit mode when html changes significantly
  const prevHtmlRef = useRef(html)
  useEffect(() => {
    if (html !== prevHtmlRef.current) {
      prevHtmlRef.current = html
      setActiveRegion(null)
    }
  }, [html])

  const handleRegionSend = (instruction: string) => {
    onPatchPage?.(instruction)
    setActiveRegion(null)
  }

  const displayHtml = isEditing && html ? injectEditScript(html) : html

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-1.5">
          <Globe size={13} className="text-gray-400" />
          <span className="text-xs text-gray-500 font-mono">preview.local</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Edit mode toggle (only when HTML is ready) */}
          {html && flowState !== 'PAGE_GENERATING' && (
            <button
              onClick={() => { setIsEditing(v => !v); setActiveRegion(null) }}
              className={cn(
                'flex items-center gap-1.5 text-xs rounded-lg px-2.5 h-6 border transition-all',
                isEditing
                  ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                  : 'text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
              )}
            >
              {isEditing ? <><Lock size={11} /> 退出编辑</> : <><Pencil size={11} /> 编辑模式</>}
            </button>
          )}

          {/* Device switcher */}
          <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
            {(['desktop', 'tablet', 'mobile'] as Device[]).map(d => (
              <button
                key={d}
                onClick={() => setDevice(d)}
                title={d === 'desktop' ? '电脑' : d === 'tablet' ? '平板' : '手机'}
                className={cn(
                  'rounded-md px-2 py-1 transition-all',
                  device === d ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {DEVICE_ICONS[d]}
              </button>
            ))}
          </div>

          {/* Fullscreen toggle */}
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              title={isFullscreen ? '退出全屏' : '全屏预览'}
              className="flex items-center justify-center w-6 h-6 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200 transition-colors"
            >
              {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          )}
        </div>
      </div>

      {/* Edit mode hint bar */}
      {isEditing && html && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 text-white text-xs shrink-0">
          <Pencil size={11} />
          <span>点击页面任意区块，用 AI 修改内容</span>
          <span className="ml-auto text-indigo-200">Esc 退出</span>
        </div>
      )}

      <Tabs defaultValue="preview" className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center px-4 py-2 border-b border-gray-200 bg-white shrink-0">
          <TabsList className="h-7">
            <TabsTrigger value="preview" className="h-5 text-xs gap-1">
              <Eye size={11} /> 预览
            </TabsTrigger>
            <TabsTrigger value="code" className="h-5 text-xs gap-1">
              <Code2 size={11} /> 代码
            </TabsTrigger>
          </TabsList>
          {isEditing && (
            <span className="ml-3 text-[10px] text-indigo-500 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
              编辑中
            </span>
          )}
        </div>

        <TabsContent value="preview" className="flex-1 overflow-hidden mt-0 flex flex-col items-center bg-gray-100 p-4 relative">
          {isEmpty && !isGenerating ? (
            <EmptyPreview />
          ) : isGenerating ? (
            <GeneratingPreview />
          ) : (
            <>
              <div
                className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 h-full relative"
                style={{ width: DEVICE_WIDTHS[device], maxWidth: '100%' }}
              >
                <iframe
                  // remount on mode switch AND on every html change，避免 srcDoc 原地更新时 webview 不重渲染
                  key={`${isEditing ? 'edit' : 'view'}:${hashHtml(displayHtml)}`}
                  srcDoc={displayHtml}
                  className="w-full h-full border-0"
                  title="Landing page preview"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>

              {/* Region edit dialog — overlay on preview area */}
              {isEditing && activeRegion && (
                <RegionEditDialog
                  region={activeRegion}
                  onSend={handleRegionSend}
                  onClose={() => setActiveRegion(null)}
                  isLoading={isLoading}
                />
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="code" className="flex-1 overflow-auto mt-0 bg-gray-900">
          {isEmpty ? (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              生成页面后代码将显示在这里
            </div>
          ) : (
            <pre className="p-4 text-xs text-green-400 font-mono leading-relaxed whitespace-pre-wrap break-all">
              {html}
            </pre>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EmptyPreview() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
      <div className="w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-gray-300 flex items-center justify-center">
        <Monitor size={32} className="text-gray-300" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">页面预览</p>
        <p className="text-xs text-gray-400 mt-1">文字稿确认后点击"生成页面"</p>
      </div>
    </div>
  )
}

function GeneratingPreview() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="w-20 h-20 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center">
        <Loader2 size={32} className="text-indigo-500 animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-600">正在生成页面…</p>
        <p className="text-xs text-gray-400 mt-1">UI 设计 + 代码构建中</p>
      </div>
    </div>
  )
}
