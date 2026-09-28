import React, { useEffect, useRef } from 'react'
import { useScrollLock } from '../../hooks/useScrollLock'
import { X } from 'lucide-react'

/**
 * Bottom Sheet tactile avec poignée de glissement.
 * Remplace les <select> natifs et les boîtes de dialogue sur mobile.
 */
export function BottomSheet({ open, onClose, title, subtitle, children, className = '' }) {
  useScrollLock(open)
  const sheetRef = useRef(null)
  const startY = useRef(null)

  useEffect(() => {
    if (!open) return
    const sheet = sheetRef.current
    if (!sheet) return

    const handleTouchStart = (e) => { startY.current = e.touches[0].clientY }
    const handleTouchMove = (e) => {
      if (startY.current === null) return
      const dy = e.touches[0].clientY - startY.current
      if (dy > 0 && sheet.scrollTop <= 0) {
        sheet.style.transform = `translateY(${dy}px)`
      }
    }
    const handleTouchEnd = (e) => {
      if (startY.current === null) return
      const dy = e.changedTouches[0].clientY - startY.current
      startY.current = null
      if (dy > 100) {
        sheet.style.transform = ''
        onClose()
      } else {
        sheet.style.transform = ''
      }
    }

    sheet.addEventListener('touchstart', handleTouchStart, { passive: true })
    sheet.addEventListener('touchmove', handleTouchMove, { passive: true })
    sheet.addEventListener('touchend', handleTouchEnd, { passive: true })
    return () => {
      sheet.removeEventListener('touchstart', handleTouchStart)
      sheet.removeEventListener('touchmove', handleTouchMove)
      sheet.removeEventListener('touchend', handleTouchEnd)
    }
  }, [open, onClose])

  if (!open) return null

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
        {/* Poignée */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-stone-300 dark:bg-slate-700" />
        </div>
        {/* Header */}
        {title && (
          <div className="flex items-start justify-between px-5 py-2.5 border-b border-stone-100 dark:border-slate-800/80 flex-shrink-0">
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
        {/* Contenu scrollable */}
        <div className="overflow-y-auto flex-1 scrollbar-hide">
          {children}
        </div>
        {/* Safe area iOS */}
        <div className="safe-bottom flex-shrink-0" />
      </div>
    </div>
  )
}
