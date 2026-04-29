import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const THEMES = ['light', 'dark', 'system']
const STORAGE_KEY = 'gitasaar-theme'

const ThemeContext = createContext(null)

function resolveTheme(pref) {
  if (pref === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return pref
}

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return THEMES.includes(stored) ? stored : 'system'
  })

  const [resolved, setResolved] = useState(() => resolveTheme(
    localStorage.getItem(STORAGE_KEY) || 'system'
  ))

  // Apply theme to <html data-theme>
  useEffect(() => {
    const apply = () => {
      const r = resolveTheme(preference)
      setResolved(r)
      document.documentElement.setAttribute('data-theme', r)
    }
    apply()

    if (preference === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }
  }, [preference])

  const setTheme = useCallback((pref) => {
    if (!THEMES.includes(pref)) return
    localStorage.setItem(STORAGE_KEY, pref)
    setPreference(pref)
  }, [])

  return (
    <ThemeContext.Provider value={{ preference, resolved, setTheme, THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider')
  return ctx
}
