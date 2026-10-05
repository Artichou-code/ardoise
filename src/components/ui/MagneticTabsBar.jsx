import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Composant de navigation horizontale réutilisable avec :
 * - Centrage magnétique automatique de l'onglet actif (au clic et au chargement)
 * - Navigation par swipe / glisser-déplacer à la souris sur PC (drag-to-scroll)
 * - Défilement horizontal via la molette de la souris sur PC (wheel)
 * - Chevrons de défilement discrets pour Desktop
 * - Marge de fin généreuse pour permettre le centrage complet du dernier onglet
 */
export function MagneticTabsBar({
  tabs = [],
  activeId,
  onChange,
  prepend = null,
  className = '',
  innerClassName = '',
}) {
  const containerRef = useRef(null)
  const buttonRefs = useRef({})
  const [isDragging, setIsDragging] = useState(false)
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const scrollLeftStartRef = useRef(0)
  const hasMovedRef = useRef(false)
  const lastXRef = useRef(0)
  const lastTimeRef = useRef(0)
  const velocityRef = useRef(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollIndicators = () => {
    const el = containerRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 6)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 6)
  }

  // Centrage fluide et magnétique de l'onglet actif
  const scrollToTab = (buttonEl, smooth = true) => {
    if (!buttonEl || !containerRef.current) return
    const container = containerRef.current
    const containerRect = container.getBoundingClientRect()
    const elRect = buttonEl.getBoundingClientRect()
    const elOffsetLeft = elRect.left - containerRect.left + container.scrollLeft
    const targetScrollLeft = elOffsetLeft - (container.clientWidth / 2) + (elRect.width / 2)
    container.scrollTo({
      left: Math.max(0, targetScrollLeft),
      behavior: smooth ? 'smooth' : 'auto',
    })
  }

  // Centrage automatique lors de l'activation d'un onglet
  useEffect(() => {
    const buttonEl = buttonRefs.current[activeId]
    if (buttonEl) {
      const timer = setTimeout(() => {
        scrollToTab(buttonEl)
        updateScrollIndicators()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [activeId])

  // Détection du scroll pour afficher/masquer les chevrons PC
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    updateScrollIndicators()
    container.addEventListener('scroll', updateScrollIndicators, { passive: true })
    window.addEventListener('resize', updateScrollIndicators)
    return () => {
      container.removeEventListener('scroll', updateScrollIndicators)
      window.removeEventListener('resize', updateScrollIndicators)
    }
  }, [tabs])

  // Molette de souris sur PC (traduction verticale -> défilement horizontal)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const onWheel = (e) => {
      if (Math.abs(e.deltaY) > 0 || Math.abs(e.deltaX) > 0) {
        e.preventDefault()
        const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX
        container.scrollLeft += delta * 0.95
        updateScrollIndicators()
      }
    }

    container.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      container.removeEventListener('wheel', onWheel)
    }
  }, [])

  // Drag-to-scroll à la souris sur PC (0ms de latence, réactivité 1:1 immédiate)
  const handleMouseDown = (e) => {
    if (e.button !== 0) return
    const container = containerRef.current
    if (!container) return

    isDraggingRef.current = true
    hasMovedRef.current = false
    startXRef.current = e.pageX
    scrollLeftStartRef.current = container.scrollLeft
    lastXRef.current = e.pageX
    lastTimeRef.current = performance.now()
    velocityRef.current = 0

    // Débrayage synchrone immédiat du smooth-scroll et du snap CSS pour réactivité instantanée à 0ms
    container.style.scrollBehavior = 'auto'
    container.style.scrollSnapType = 'none'
    setIsDragging(true)
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingRef.current || !containerRef.current) return
      const container = containerRef.current
      const walk = e.pageX - startXRef.current // Ratio 1:1 parfait sans décalage
      if (Math.abs(walk) > 3) {
        hasMovedRef.current = true
      }

      // Suivi de la vélocité pour une inertie naturelle au relâchement
      const now = performance.now()
      const dt = now - lastTimeRef.current
      if (dt > 0 && dt < 80) {
        const curVelocity = (e.pageX - lastXRef.current) / dt
        velocityRef.current = velocityRef.current * 0.4 + curVelocity * 0.6
      }
      lastXRef.current = e.pageX
      lastTimeRef.current = now

      container.scrollLeft = scrollLeftStartRef.current - walk
      updateScrollIndicators()
    }

    const handleMouseUp = () => {
      if (!isDraggingRef.current) return
      isDraggingRef.current = false
      setIsDragging(false)

      const container = containerRef.current
      const now = performance.now()
      const isRecentMove = now - lastTimeRef.current < 60
      const velocity = velocityRef.current

      if (container) {
        // Si l'utilisateur a relâché avec un mouvement vif (flick) : application d'une légère inertie fluide
        if (hasMovedRef.current && isRecentMove && Math.abs(velocity) > 0.25) {
          container.style.scrollBehavior = 'smooth'
          const momentum = -velocity * 220
          container.scrollBy({ left: momentum, behavior: 'smooth' })
          setTimeout(() => {
            if (container) {
              container.style.scrollBehavior = ''
              container.style.scrollSnapType = ''
            }
          }, 260)
        } else {
          container.style.scrollBehavior = ''
          container.style.scrollSnapType = ''
        }
      }

      // Délai pour que le onClick du bouton puisse vérifier si un swipe a eu lieu
      setTimeout(() => {
        hasMovedRef.current = false
      }, 80)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const handleTabClick = (tabId) => {
    if (hasMovedRef.current) return
    if (onChange) onChange(tabId)
    const buttonEl = buttonRefs.current[tabId]
    if (buttonEl) {
      scrollToTab(buttonEl)
    }
  }

  const scrollByAmount = (amount) => {
    const container = containerRef.current
    if (!container) return
    container.scrollBy({ left: amount, behavior: 'smooth' })
  }

  return (
    <div
      className={`relative flex-shrink-0 border-b border-stone-200/60 dark:border-slate-800/60 bg-[#faf9f5]/70 dark:bg-[#151719]/70 group ${className}`}
    >
      {/* Flèche de défilement gauche (Desktop / PC) */}
      {canScrollLeft && (
        <div className="hidden sm:flex absolute left-0 top-0 bottom-0 z-20 items-center pl-2 pr-6 bg-gradient-to-r from-[#faf9f5] via-[#faf9f5]/90 to-transparent dark:from-[#151719] dark:via-[#151719]/90 dark:to-transparent pointer-events-none">
          <button
            type="button"
            onClick={() => scrollByAmount(-220)}
            className="pointer-events-auto w-7 h-7 rounded-full bg-white dark:bg-slate-800 shadow-md border border-stone-200 dark:border-slate-700 flex items-center justify-center text-stone-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            aria-label="Faire défiler vers la gauche"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      )}

      {/* Conteneur défilant avec drag à la souris et magnétisme */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onDragStart={(e) => e.preventDefault()}
        className={`px-4 py-2 overflow-x-auto scrollbar-hide select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        } ${innerClassName}`}
        style={{
          scrollSnapType: isDragging ? 'none' : 'x proximity',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div className="flex items-center gap-1.5 min-w-max pr-[45vw] sm:pr-[40vw]">
          {prepend}

          {tabs.map((tab) => {
            const isActive = activeId === tab.id
            const hasBadgeText =
              tab.badgeText !== undefined &&
              tab.badgeText !== null &&
              tab.badgeText !== ''
            const hasPositiveCount =
              tab.count !== undefined &&
              tab.count !== null &&
              (typeof tab.count === 'string' ? tab.count !== '' : tab.count > 0)
            const showBadge = hasBadgeText || hasPositiveCount
            const badgeContent = hasBadgeText ? tab.badgeText : tab.count

            return (
              <button
                key={tab.id}
                ref={(el) => {
                  if (el) buttonRefs.current[tab.id] = el
                }}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                className={`snap-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 border ${
                  isDragging ? 'cursor-grabbing' : 'cursor-pointer'
                } ${
                  isActive
                    ? 'bg-[#c83b3b] text-white border-[#c83b3b] shadow-2xs font-bold'
                    : 'bg-white/80 dark:bg-slate-800/80 border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-300 hover:border-[#c83b3b]/60'
                }`}
              >
                <span>{tab.label}</span>
                {showBadge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : tab.badgeVariant === 'emerald'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                        : 'bg-stone-100 dark:bg-slate-700 text-stone-500 dark:text-slate-400'
                    }`}
                  >
                    {badgeContent}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Flèche de défilement droite (Desktop / PC) */}
      {canScrollRight && (
        <div className="hidden sm:flex absolute right-0 top-0 bottom-0 z-20 items-center pr-2 pl-6 bg-gradient-to-l from-[#faf9f5] via-[#faf9f5]/90 to-transparent dark:from-[#151719] dark:via-[#151719]/90 dark:to-transparent pointer-events-none">
          <button
            type="button"
            onClick={() => scrollByAmount(220)}
            className="pointer-events-auto w-7 h-7 rounded-full bg-white dark:bg-slate-800 shadow-md border border-stone-200 dark:border-slate-700 flex items-center justify-center text-stone-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            aria-label="Faire défiler vers la droite"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
