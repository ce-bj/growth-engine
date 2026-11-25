import React from 'react'
import ReactDOM from 'react-dom/client'
import DataAnalysisNewPage from './DataAnalysisNewPage.jsx'
import './embed.css'

document.documentElement.dataset.visitorEmbed = '1'

const rawView = new URLSearchParams(window.location.search).get('view')
const view = rawView === 'board' || rawView === 'intake' ? rawView : 'agent'
if (view === 'board') document.documentElement.dataset.boardTone = 'portal'
document.title = view === 'board' ? '数据看板' : '访客洞察与策略'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DataAnalysisNewPage view={view} />
  </React.StrictMode>,
)
