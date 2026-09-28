import { createContext, useContext, useState, useEffect } from 'react'
import { saveTheme, loadTheme } from '../store/storage'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = loadTheme()
    return saved === 'dark' ? 'dark' : 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
      root.setAttribute('data-theme', 'dark')
    } else {
      root.classList.remove('dark')
      root.setAttribute('data-theme', 'light')
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]')
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#151719' : '#faf9f5')
    }
    const svgFavicon = document.querySelector('link[rel="icon"][type="image/svg+xml"]')
    if (svgFavicon) {
      svgFavicon.setAttribute('href', theme === 'dark' ? '/ardoise-fav.svg' : '/ardoise-fav-white.svg')
    }
    saveTheme(theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
