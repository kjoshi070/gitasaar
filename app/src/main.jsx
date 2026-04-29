import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ThemeProvider } from './context/ThemeContext'
import { GitaProvider } from './context/GitaContext'
import './index.css'
// Bootstrap grid & utilities only (no JS components needed)
import 'bootstrap/dist/css/bootstrap-grid.min.css'

// Register Service Worker (powers the /api/* REST endpoints)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(reg => {
        if (import.meta.env.DEV) console.info('[GitaSaar] Service Worker registered:', reg.scope)
      })
      .catch(err => {
        console.warn('[GitaSaar] Service Worker registration failed:', err)
      })
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <GitaProvider>
          <App />
        </GitaProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
