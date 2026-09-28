import React, { useEffect, useRef } from 'react'
import { useScrollLock } from '../../hooks/useScrollLock'
import { X } from 'lucide-react'

/**
 * Bottom Sheet tactile (position="bottom") ou Modale haute (position="top") placée au plus haut de l'écran pour éviter le masquage par le clavier virtuel mobile.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  className = '',
  position = 'bottom', // 'bottom' | 'top'
}) {
  useScrollLock(open)
  const sheetRef = useRef(null)
  const headerRef = useRef(null)
  const startY = useRef(null)

  useEffect(() => {
    if (!open || position === 'top') return
    const sheet = sheetRef.current
    const header = headerRef.current
    if (!sheet || !header) return

    const handleTouchStart = (e) => {
      startY.current = e.touches[0].clientY
    }

    const handleTouchMove = (e) => {
      if (startY.current === null) return
      const dy = e.touches[0].clientY - startY.current
      if (dy > 0) {
        sheet.style.transform = `translateY(${dy}px)`
      }
    }

    const handleTouchEnd = (e) => {
      if (startY.current === null) return
      const dy = e.changedTouches[0].clientY - startY.current
      startY.current = null
      if (dy > 80) {
        sheet.style.transform = ''
        onClose()
      } else {
        sheet.style.transform = ''
      }
    }

    const handleTouchCancel = () => {
      startY.current = null
      sheet.style.transform = ''
    }

    header.addEventListener('touchstart', handleTouchStart, { passive: true })
    header.addEventListener('touchmove', handleTouchMove, { passive: true })
    header.addEventListener('touchend', handleTouchEnd, { passive: true })
    header.addEventListener('touchcancel', handleTouchCancel, { passive: true })

    return () => {
      header.removeEventListener('touchstart', handleTouchStart)
      header.removeEventListener('touchmove', handleTouchMove)
      header.removeEventListener('touchend', handleTouchEnd)
      header.removeEventListener('touchcancel', handleTouchCancel)
    }
  }, [open, onClose, position])

  if (!open) return null

  // Mode positionné au plus haut (anti-clavier mobile)
  if (position === 'top') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-start justify-center p-3 pt-safe pt-5 sm:pt-8 bg-black/60 backdrop-blur-sm overflow-y-auto"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          ref={sheetRef}
          className={`relative w-full max-w-lg school-card rounded-2xl shadow-2xl border transition-all duration-150 max-h-[calc(100dvh-2rem)] flex flex-col mt-1 sm:mt-3 mb-auto ${className}`}
        >
          {title && (
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-100 dark:border-slate-800/80 flex-shrink-0">
              <div>
                <h2 className="font-serif-title text-lg font-bold leading-tight">{title}</h2>
                {subtitle && (
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 -mr-1 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Fermer"
              >
                <X size={18} className="text-stone-500 dark:text-slate-400" />
              </button>
            </div>
          )}
          <div className="overflow-y-auto flex-1 scrollbar-hide overscroll-contain">
            {children}
          </div>
        </div>
      </div>
    )
  }

  // Mode Bottom Sheet classique (position="bottom")
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={sheetRef}
        className={`relative w-full max-w-lg school-card rounded-t-2xl shadow-2xl border-t transition-transform duration-200 max-h-[88dvh] flex flex-col ${className}`}
      >
        {/* Zone tactile de glissement pour fermer (Poignée tactile + Titre) */}
        <div ref={headerRef} className="touch-none select-none flex-shrink-0 cursor-grab active:cursor-grabbing">
          {/* Poignée tactile */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-stone-300 dark:bg-slate-700" />
          </div>
          {/* Header */}
          {title && (
            <div className="flex items-start justify-between px-5 pt-1 pb-3 border-b border-stone-200/80 dark:border-slate-800/80">
              <div>
                <h2 className="font-serif-title text-xl font-bold leading-snug">{title}</h2>
                {subtitle && (
                  <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 -mr-1 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Fermer"
              >
                <X size={18} className="text-stone-500 dark:text-slate-400" />
              </button>
            </div>
          )}
        </div>
        {/* Contenu scrollable */}
        <div className="overflow-y-auto flex-1 scrollbar-hide overscroll-contain pt-1">
          {children}
        </div>
        {/* Safe area iOS */}
        <div className="safe-bottom flex-shrink-0" />
      </div>
    </div>
  )
}
