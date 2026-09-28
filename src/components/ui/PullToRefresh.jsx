import { useState, useEffect, useRef } from 'react'
import { RefreshCw } from 'lucide-react'

/**
 * Indicateur tactile de rafraîchissement (Pull-to-Refresh)
 * Permet de glisser vers le bas depuis le haut de l'écran pour actualiser l'application
 * (fonctionne en PWA standalone comme en navigateur classique).
 */
export function PullToRefreshIndicator() {
  const [pullY, setPullY] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(null)
  const active = useRef(false)

  useEffect(() => {
    const handleTouchStart = (e) => {
      if (refreshing) return
      // Ne déclencher que si le conteneur scrollable le plus proche est tout en haut
      const scrollable = e.target.closest('.overflow-y-auto')
      const scrollTop = scrollable ? scrollable.scrollTop : window.scrollY
      if (scrollTop <= 0) {
        startY.current = e.touches[0].clientY
        active.current = true
      } else {
        active.current = false
      }
    }

    const handleTouchMove = (e) => {
      if (!active.current || startY.current === null || refreshing) return
      const currentY = e.touches[0].clientY
      const dy = currentY - startY.current
      if (dy > 0) {
        // Résistance élastique progressive
        const damped = Math.min(dy * 0.42, 85)
        setPullY(damped)
      } else {
        active.current = false
        setPullY(0)
      }
    }

    const handleTouchEnd = () => {
      if (!active.current || refreshing) return
      active.current = false
      startY.current = null
      if (pullY >= 50) {
        setRefreshing(true)
        setPullY(50)
        setTimeout(() => {
          window.location.reload()
        }, 250)
      } else {
        setPullY(0)
      }
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [pullY, refreshing])

  if (pullY <= 0 && !refreshing) return null

  const isTriggered = pullY >= 50

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-transform duration-100 ease-out"
      style={{
        top: `calc(${pullY}px + env(safe-area-inset-top, 8px))`,
        opacity: Math.min(pullY / 35, 1),
      }}
    >
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full school-card shadow-lg border border-stone-300 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-xs font-semibold text-stone-700 dark:text-slate-200">
        <RefreshCw
          size={14}
          className={`${
            refreshing
              ? 'animate-spin text-[#c83b3b]'
              : isTriggered
              ? 'text-[#c83b3b] rotate-180 transition-transform'
              : 'text-stone-500'
          }`}
        />
        <span>
          {refreshing
            ? 'Actualisation...'
            : isTriggered
            ? 'Relâcher pour rafraîchir'
            : 'Glisser pour rafraîchir'}
        </span>
      </div>
    </div>
  )
}
