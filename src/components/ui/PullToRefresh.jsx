import { useState, useEffect, useRef } from 'react'
import { RefreshCw } from 'lucide-react'

/**
 * Indicateur tactile de rafraîchissement (Pull-to-Refresh)
 * Permet de glisser vers le bas depuis le haut de l'écran pour actualiser l'application.
 * Totalement invisible et rétracté hors écran au repos pour éviter tout texte fantôme.
 */
export function PullToRefreshIndicator({ disabled = false }) {
  const [pullY, setPullY] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const startYRef = useRef(null)
  const activeRef = useRef(false)
  const pullYRef = useRef(0)
  const refreshingRef = useRef(false)
  const disabledRef = useRef(disabled)

  // Synchronise les refs pour les écouteurs d'événements stables
  useEffect(() => {
    refreshingRef.current = refreshing
  }, [refreshing])

  useEffect(() => {
    disabledRef.current = disabled
    if (disabled && !refreshingRef.current) {
      activeRef.current = false
      startYRef.current = null
      pullYRef.current = 0
      setPullY(0)
    }
  }, [disabled])

  useEffect(() => {
    const handleTouchStart = (e) => {
      if (disabledRef.current || refreshingRef.current) return
      
      // Ne jamais déclencher si le toucher commence sur un bouton ou élément interactif
      if (e.target.closest('button, [role="button"], input, select, textarea, [data-interactive], a, .quick-score, .score-pad')) {
        activeRef.current = false
        return
      }

      // Ne déclencher que si le conteneur scrollable actif est tout en haut
      const scrollable = e.target.closest('.overflow-y-auto')
      const scrollTop = scrollable ? scrollable.scrollTop : window.scrollY
      if (scrollTop <= 0) {
        startYRef.current = e.touches[0].clientY
        activeRef.current = true
      } else {
        activeRef.current = false
      }
    }

    const handleTouchMove = (e) => {
      if (disabledRef.current || !activeRef.current || startYRef.current === null || refreshingRef.current) return
      const currentY = e.touches[0].clientY
      const dy = currentY - startYRef.current

      if (dy > 12) {
        // Amortissement élastique avec seuil de départ minimal pour éviter tout micro-glissement
        const damped = Math.min((dy - 12) * 0.35, 80)
        pullYRef.current = damped
        setPullY(damped)
      } else if (dy <= 0) {
        activeRef.current = false
        startYRef.current = null
        pullYRef.current = 0
        setPullY(0)
      }
    }

    const handleTouchEnd = () => {
      if (disabledRef.current || !activeRef.current || refreshingRef.current) return
      const finalY = pullYRef.current
      activeRef.current = false
      startYRef.current = null
      pullYRef.current = 0

      // Si le glissement a dépassé le seuil sécurisé (65px), on déclenche l'actualisation
      if (finalY >= 65) {
        setRefreshing(true)
        setPullY(50)
        setTimeout(() => {
          window.location.reload()
        }, 250)
      } else {
        // Sinon retour immédiat à zéro (hors écran)
        setPullY(0)
      }
    }

    const handleCancel = () => {
      activeRef.current = false
      startYRef.current = null
      pullYRef.current = 0
      if (!refreshingRef.current) {
        setPullY(0)
      }
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
    window.addEventListener('touchcancel', handleCancel, { passive: true })
    window.addEventListener('blur', handleCancel, { passive: true })

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('touchcancel', handleCancel)
      window.removeEventListener('blur', handleCancel)
    }
  }, []) // Écouteurs stables attachés une seule fois au montage

  const isVisible = (pullY >= 20 || refreshing)
  const isTriggered = pullY >= 55

  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all ${
        activeRef.current ? 'duration-75' : 'duration-200 ease-out'
      }`}
      style={{
        top: 'calc(env(safe-area-inset-top, 0px) + 8px)',
        transform: `translate(-50%, ${isVisible ? `${Math.max(pullY - 15, 6)}px` : '-120px'})`,
        opacity: isVisible ? Math.min((pullY - 15) / 30, 1) : 0,
        visibility: isVisible ? 'visible' : 'hidden',
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
