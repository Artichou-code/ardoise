import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GameProvider } from './context/GameContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { ErrorBoundary } from './components/ui/ErrorBoundary.jsx'

// Ardoise v2.4.1 - Production build
window.__ARDOISE_VERSION__ = '2.4.1'
// Gestion transparente des rechargements lors de nouveaux déploiements (chunks obsolètes)
window.addEventListener('vite:preloadError', (event) => {
  event?.preventDefault?.()
  const hasReloaded = sessionStorage.getItem('chunk_reload_lock')
  if (!hasReloaded) {
    sessionStorage.setItem('chunk_reload_lock', 'true')
    window.location.reload()
  }
})

window.addEventListener('error', (event) => {
  const msg = event?.message || ''
  if (
    msg.includes('Failed to load module script') ||
    msg.includes('dynamically imported module') ||
    msg.includes('error loading dynamically imported module')
  ) {
    const hasReloaded = sessionStorage.getItem('chunk_reload_lock')
    if (!hasReloaded) {
      sessionStorage.setItem('chunk_reload_lock', 'true')
      window.location.reload()
    }
  }
})

setTimeout(() => {
  sessionStorage.removeItem('chunk_reload_lock')
}, 3000)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <GameProvider>
          <App />
        </GameProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)

