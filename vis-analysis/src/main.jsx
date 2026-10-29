import React from 'react'
import ReactDOM from 'react-dom/client'
import DataAnalysisNewPage from './DataAnalysisNewPage.jsx'
import './embed.css'

document.documentElement.dataset.visitorEmbed = '1'

const view = new URLSearchParams(window.location.search).get('view') === 'board' ? 'board' : 'agent'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DataAnalysisNewPage view={view} />
  </React.StrictMode>,
)
