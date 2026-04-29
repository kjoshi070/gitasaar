import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header  from './Header'
import { useGita } from '../../context/GitaContext'

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { loadIndex } = useGita()
  const location = useLocation()

  // Load index data on mount
  useEffect(() => { loadIndex() }, [loadIndex])

  // Close mobile sidebar on navigation
  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  const toggleSidebar = useCallback(() => setSidebarOpen(v => !v), [])
  const closeSidebar  = useCallback(() => setSidebarOpen(false), [])

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' sidebar-overlay--visible' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      <Sidebar isOpen={sidebarOpen} />

      <div className="main-content" id="main-content" role="main">
        <Header onMenuToggle={toggleSidebar} />
        {children}
      </div>
    </div>
  )
}
