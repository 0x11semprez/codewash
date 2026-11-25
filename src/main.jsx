import React from 'react'
import ReactDOM from 'react-dom/client'
import LoadingGate from './components/LoadingGate.jsx'
import ErrorBoundary from './components/ui/ErrorBoundary.jsx'
import { reportWebVitals } from './utils/webVitals.js'
import './index.css'

reportWebVitals(({ name, value, rating }) => {
  console.info(`[web-vitals] ${name}: ${value.toFixed(name === 'CLS' ? 3 : 0)} (${rating})`)
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <LoadingGate />
    </ErrorBoundary>
  </React.StrictMode>,
)