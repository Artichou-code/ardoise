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
    const isDark = theme === 'dark'
    if (isDark && !root.classList.contains('dark')) {
      root.classList.add('dark')
      root.setAttribute('data-theme', 'dark')
    } else if (!isDark && root.classList.contains('dark')) {
      root.classList.remove('dark')
      root.setAttribute('data-theme', 'light')
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]')
    const expectedColor = isDark ? '#151719' : '#faf9f5'
    if (metaTheme && metaTheme.getAttribute('content') !== expectedColor) {
      metaTheme.setAttribute('content', expectedColor)
    }
    const svgFavicon = document.querySelector('link[rel="icon"][type="image/svg+xml"]')
    const expectedFavicon = isDark ? '/Ardoise_v2-dark.svg' : '/Ardoise_v2-white.svg'
    if (svgFavicon && svgFavicon.getAttribute('href') !== expectedFavicon) {
      svgFavicon.setAttribute('href', expectedFavicon)
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
