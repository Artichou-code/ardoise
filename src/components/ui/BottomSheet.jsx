import { useEffect, useRef } from 'react'
import { useScrollLock } from '../../hooks/useScrollLock'
import { X } from 'lucide-react'

/**
 * Bottom Sheet tactile avec poignée de glissement.
 * Remplace les <select> natifs et les boîtes de dialogue sur mobile.
 */
export function BottomSheet({ open, onClose, title, children, className = '' }) {
  useScrollLock(open)
  const sheetRef = useRef(null)
  const startY = useRef(null)

  useEffect(() => {
    if (!open) return
    const sheet = sheetRef.current
    if (!sheet) return

    const handleTouchStart = (e) => { startY.current = e.touches[0].clientY }
    const handleTouchMove = (e) => {
      const dy = e.touches[0].clientY - startY.current
      if (dy > 0) sheet.style.transform = `translateY(${dy}px)`
    }
    const handleTouchEnd = (e) => {
      const dy = e.changedTouches[0].clientY - startY.current
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
    <div className="fixed inset-0 z-50 flex items-end" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={sheetRef}
        className={`relative w-full bg-white dark:bg-zinc-900 rounded-t-2xl shadow-xl border-t border-zinc-200 dark:border-zinc-800 transition-transform duration-200 max-h-[90dvh] flex flex-col ${className}`}
      >
        {/* Poignée */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        </div>
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 py-2 flex-shrink-0">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X size={18} className="text-zinc-500" />
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

/**
 * Sélecteur custom — remplace <select> natif.
 */
export function CustomSelect({ options, value, onChange, label, placeholder = 'Sélectionner...' }) {
  const selected = options.find(o => o.value === value)
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-left text-sm"
      >
        <span className={selected ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400'}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="text-zinc-400">▼</span>
      </button>
      <BottomSheet open={open} onClose={() => setOpen(false)} title={label}>
        <div className="px-4 pb-4 space-y-1">
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`w-full px-4 py-3 rounded-xl text-sm text-left font-medium transition-colors ${
                opt.value === value
                  ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
              }`}
              style={opt.value === value ? { backgroundColor: '#fcc817', color: '#18181b' } : {}}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </BottomSheet>
    </>
  )
}

import React from 'react'
