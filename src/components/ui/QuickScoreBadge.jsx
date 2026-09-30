import { useState, useRef, useEffect } from 'react'
import { ArrowUpDown } from 'lucide-react'

/**
 * Badge de score compact avec roulette tactile intégrée (scroll tactile / glissement vertical).
 * - Glissement vers le haut = augmentation du score.
 * - Glissement vers le bas = diminution du score.
 * - Retour haptique vibrant à chaque cran.
 * - Bulle flottante au-dessus du doigt pour ne pas masquer le chiffre lors du glissement tactile.
 * - Un simple clic/tap sans glisser ouvre la feuille complète (ScorePad).
 * - Prise en charge de la molette de la souris sur ordinateur.
 */
export function QuickScoreBadge({
  value = 0,
  onChange,
  onOpenPad,
  min,
  max,
  step = 1,
  showPlus = true,
  className = '',
}) {
  const [isDragging, setIsDragging] = useState(false)
  const dragStartYRef = useRef(0)
  const dragStartValueRef = useRef(value)
  const currentValueRef = useRef(value)
  const hasMovedRef = useRef(false)
  const isDraggingRef = useRef(false)

  // Maintient la référence synchronisée avec la prop value
  useEffect(() => {
    if (!isDraggingRef.current) {
      currentValueRef.current = value
    }
  }, [value])

  const clampValue = (val) => {
    let res = val
    if (min !== undefined && res < min) res = min
    if (max !== undefined && res > max) res = max
    return res
  }

  const handlePointerDown = (e) => {
    e.stopPropagation()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}

    dragStartYRef.current = e.clientY
    dragStartValueRef.current = value
    currentValueRef.current = value
    hasMovedRef.current = false
    isDraggingRef.current = true
    setIsDragging(true)

    try {
      navigator.vibrate?.(10)
    } catch {}
  }

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return
    e.stopPropagation()

    const totalDeltaY = dragStartYRef.current - e.clientY // Vers le haut = augmentation
    if (Math.abs(totalDeltaY) > 5) {
      hasMovedRef.current = true
    }

    // Sensibilité : ~14px par pas de score (identique à ScorePad)
    const stepsCount = Math.round(totalDeltaY / 14) * step
    const nextVal = clampValue(dragStartValueRef.current + stepsCount)

    if (nextVal !== currentValueRef.current) {
      currentValueRef.current = nextVal
      onChange?.(nextVal)
      try {
        navigator.vibrate?.(8)
      } catch {}
    }
  }

  const handlePointerUp = (e) => {
    if (!isDraggingRef.current) return
    e.stopPropagation()
    isDraggingRef.current = false
    setIsDragging(false)

    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}

    if (hasMovedRef.current) {
      try {
        navigator.vibrate?.(15)
      } catch {}
    } else {
      // Simple tap sans glissement : ouvrir la modale complète
      onOpenPad?.()
    }
  }

  const handlePointerCancel = (e) => {
    if (!isDraggingRef.current) return
    e.stopPropagation()
    isDraggingRef.current = false
    setIsDragging(false)
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}
  }

  const handleWheel = (e) => {
    e.stopPropagation()
    e.preventDefault()
    const delta = e.deltaY < 0 ? step : -step
    const nextVal = clampValue(value + delta)
    if (nextVal !== value) {
      onChange?.(nextVal)
      try {
        navigator.vibrate?.(8)
      } catch {}
    }
  }

  const cur = isDragging ? currentValueRef.current : value
  const displaySign = showPlus && cur > 0 ? '+' : ''
  const isNonZero = cur !== 0

  return (
    <div className="relative inline-flex items-center select-none flex-shrink-0">
      {/* Bulle flottante au-dessus du doigt pendant le glissement */}
      {isDragging && (
        <div className="absolute -top-11 left-1/2 -translate-x-1/2 z-40 px-3 py-1 rounded-full bg-[#c83b3b] text-white text-xs font-black shadow-xl whitespace-nowrap flex items-center gap-1 animate-in fade-in zoom-in-95 pointer-events-none">
          <ArrowUpDown size={11} className="animate-pulse" />
          <span>{displaySign}{cur}</span>
        </div>
      )}

      {/* Zone interactive compacte */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`Score : ${displaySign}${cur}. Glisser vers le haut ou le bas pour ajuster.`}
        title="Glisser vers le haut ou le bas pour ajuster rapidement, ou cliquer pour ouvrir le pavé"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onWheel={handleWheel}
        style={{ touchAction: 'none' }}
        className={`group relative flex items-center justify-between gap-1.5 min-w-[4.2rem] h-10 px-2.5 py-1 rounded-xl border transition-all cursor-ns-resize ${
          isDragging
            ? 'scale-108 border-[#c83b3b] bg-[#c83b3b]/15 text-[#c83b3b] ring-2 ring-[#c83b3b]/40 shadow-md z-30'
            : isNonZero
            ? 'bg-[#c83b3b]/8 dark:bg-[#c83b3b]/15 border-[#c83b3b]/35 text-[#c83b3b] dark:text-red-300 hover:border-[#c83b3b] shadow-2xs'
            : 'bg-white/80 dark:bg-slate-900/80 border-stone-200 dark:border-slate-800 text-stone-700 dark:text-slate-300 hover:border-[#c83b3b]/60 hover:text-[#c83b3b] shadow-2xs'
        } ${className}`}
      >
        <span className="text-base sm:text-lg font-black tabular-nums leading-none tracking-tight flex-1 text-center">
          {displaySign}{cur}
        </span>
        <div className="flex flex-col items-center justify-center -mr-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
          <ArrowUpDown size={11} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  )
}
