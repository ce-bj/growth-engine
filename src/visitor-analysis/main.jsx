import React from 'react'
import ReactDOM from 'react-dom/client'
import DataAnalysisNewPage from './DataAnalysisNewPage.jsx'
import './embed.css'

document.documentElement.dataset.visitorEmbed = '1'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DataAnalysisNewPage />
  </React.StrictMode>,
)
