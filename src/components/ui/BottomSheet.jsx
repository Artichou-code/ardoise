import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
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
  headerAction,
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

  const renderSheet = () => {
    // Mode positionné au plus haut (anti-clavier mobile)
    if (position === 'top') {
      return (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center p-3.5 bg-black/60 backdrop-blur-sm overflow-y-auto"
          style={{
            paddingTop: 'max(calc(env(safe-area-inset-top, 0px) + 1.5rem), 2.5rem)',
          }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <div
            ref={sheetRef}
            className={`relative w-full max-w-lg school-surface rounded-2xl shadow-2xl border border-stone-200 dark:border-slate-800 transition-all duration-150 max-h-[calc(100dvh-4rem)] flex flex-col mb-auto ${className}`}
          >
            {title ? (
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-200/80 dark:border-slate-800/80 bg-[#faf9f5]/90 dark:bg-[#151719]/90 rounded-t-2xl flex-shrink-0">
                <div>
                  <h2 className="font-serif-title text-lg font-bold leading-tight">{title}</h2>
                  {subtitle && (
                    <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 -mr-1">
                  {headerAction}
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Fermer"
                  >
                    <X size={18} className="text-stone-500 dark:text-slate-400" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="absolute top-2.5 right-3 z-10 flex items-center gap-1">
                {headerAction}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
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
          className={`relative w-full max-w-lg school-surface rounded-t-2xl shadow-2xl border-t border-stone-200 dark:border-slate-800 transition-transform duration-200 max-h-[88dvh] flex flex-col ${className}`}
        >
          {/* Zone tactile de glissement pour fermer (Poignée tactile + Titre ou bouton X) */}
          <div ref={headerRef} className="touch-none select-none flex-shrink-0 cursor-grab active:cursor-grabbing bg-[#faf9f5]/90 dark:bg-[#151719]/90 rounded-t-2xl relative">
            {title ? (
              <>
                {/* Poignée tactile */}
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 rounded-full bg-stone-300 dark:bg-slate-700" />
                </div>
                {/* Header */}
                <div className="flex items-start justify-between px-5 pt-1 pb-2 border-b border-stone-200/80 dark:border-slate-800/80">
                  <div>
                    <h2 className="font-serif-title text-xl font-bold leading-snug">{title}</h2>
                    {subtitle && (
                      <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 -mr-1">
                    {headerAction}
                    <button
                      type="button"
                      onClick={onClose}
                      className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
                      aria-label="Fermer"
                    >
                      <X size={18} className="text-stone-500 dark:text-slate-400" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* En-tête compact sans titre : poignée tactile centrée + bouton X accessible */
              <div className="relative flex items-center justify-between px-4 pt-2.5 pb-1 min-h-[38px]">
                {/* Poignée tactile centrée */}
                <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-10 h-1 rounded-full bg-stone-300 dark:bg-slate-700 pointer-events-none" />
                
                {/* Espace gauche pour équilibrer */}
                <div className="w-8 shrink-0" />

                {/* Actions & bouton X à droite */}
                <div className="flex items-center justify-end gap-1 ml-auto z-10">
                  {headerAction}
                  <button
                    type="button"
                    onClick={onClose}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="p-2 -mr-1 rounded-full hover:bg-stone-200/70 dark:hover:bg-slate-800 text-stone-500 hover:text-stone-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    aria-label="Fermer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
          {/* Contenu scrollable */}
          <div className="overflow-y-auto flex-1 scrollbar-hide overscroll-contain">
            {children}
          </div>
          {/* Safe area iOS */}
          <div className="safe-bottom flex-shrink-0" />
        </div>
      </div>
    )
  }

  if (typeof document !== 'undefined') {
    return createPortal(renderSheet(), document.body)
  }

  return renderSheet()
}
