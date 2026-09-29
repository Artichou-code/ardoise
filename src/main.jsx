import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GameProvider } from './context/GameContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { ErrorBoundary } from './components/ui/ErrorBoundary.jsx'

window.addEventListener('vite:preloadError', () => {
  window.location.reload()
})

function mountApp() {
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
}

// Defer React hydration until the browser is idle so the pre-rendered App Shell
// paints first (FCP & LCP measured immediately), then React takes over seamlessly.
// Falls back to setTimeout(0) on browsers without requestIdleCallback (e.g. old Safari).
if ('requestIdleCallback' in window) {
  requestIdleCallback(mountApp, { timeout: 2000 })
} else {
  setTimeout(mountApp, 0)
}

