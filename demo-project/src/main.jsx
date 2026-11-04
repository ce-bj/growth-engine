import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AgentTaskDetail from './AgentTaskDetail.jsx'
import DataAnalysisNewPage from './components/DataAnalysisNewPage.jsx'
import FloatAssistant from './float/FloatAssistant.jsx'

const embed = new URLSearchParams(window.location.search).get('embed')
const visitorEmbed = embed === 'visitor-analysis'
const floatEmbed = embed === 'float'

if (visitorEmbed) {
  document.documentElement.dataset.visitorEmbed = '1'
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {visitorEmbed ? (
      <DataAnalysisNewPage />
    ) : floatEmbed ? (
      <FloatAssistant />
    ) : (
      <>
        <App />
        <AgentTaskDetail />
      </>
    )}
  </React.StrictMode>,
)
