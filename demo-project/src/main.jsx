import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import DataAnalysisNewPage from './components/DataAnalysisNewPage.jsx'

const embed = new URLSearchParams(window.location.search).get('embed')
const visitorEmbed = embed === 'visitor-analysis'

if (visitorEmbed) {
  document.documentElement.dataset.visitorEmbed = '1'
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {visitorEmbed ? <DataAnalysisNewPage /> : <App />}
  </React.StrictMode>,
)
