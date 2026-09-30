import { useState, useRef, useEffect } from 'react'
import { ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react'

/**
 * Badge de score compact avec roulette tactile intégrée (scroll tactile / glissement vertical).
 * - Glissement vers le haut = augmentation du score.
 * - Glissement vers le bas = diminution du score.
 * - Retour haptique vibrant à chaque cran.
 * - Support d'une variante haute (tall) couvrant 2 lignes pour équilibrer les choix manuels.
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
  tall = false,
  formatBubble,
  formatDisplay,
  formatSub,
  values,
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
    if (values && values.length > 0) {
      if (values.includes(val)) return val
      return values.reduce((prev, curr) => Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev)
    }
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

    let nextVal
    if (values && values.length > 0) {
      const startIndex = values.indexOf(dragStartValueRef.current)
      const safeIndex = startIndex !== -1 ? startIndex : 0
      const indexSteps = Math.round(totalDeltaY / 22)
      const targetIndex = Math.max(0, Math.min(values.length - 1, safeIndex + indexSteps))
      nextVal = values[targetIndex]
    } else {
      // Sensibilité : ~14px par pas de score (identique à ScorePad)
      const stepsCount = Math.round(totalDeltaY / 14) * step
      nextVal = clampValue(dragStartValueRef.current + stepsCount)
    }

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

  const badgeRef = useRef(null)

  useEffect(() => {
    const el = badgeRef.current
    if (!el) return
    const handleNativeWheel = (e) => {
      e.stopPropagation()
      e.preventDefault()
      let nextVal
      if (values && values.length > 0) {
        const curIdx = values.indexOf(currentValueRef.current)
        const safeIdx = curIdx !== -1 ? curIdx : 0
        const delta = e.deltaY < 0 ? 1 : -1
        const targetIdx = Math.max(0, Math.min(values.length - 1, safeIdx + delta))
        nextVal = values[targetIdx]
      } else {
        const delta = e.deltaY < 0 ? step : -step
        nextVal = clampValue(currentValueRef.current + delta)
      }
      if (nextVal !== currentValueRef.current) {
        currentValueRef.current = nextVal
        onChange?.(nextVal)
        try {
          navigator.vibrate?.(8)
        } catch {}
      }
    }
    el.addEventListener('wheel', handleNativeWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleNativeWheel)
  }, [step, onChange, min, max, values])

  const cur = isDragging ? currentValueRef.current : value
  const displaySign = showPlus && cur > 0 ? '+' : ''
  const isNonZero = cur !== 0
  const displayedValue = formatDisplay ? formatDisplay(cur) : `${displaySign}${cur}`
  const subText = formatSub ? formatSub(cur) : null

  return (
    <div className={`relative inline-flex items-center select-none flex-shrink-0 ${tall ? 'self-stretch' : ''}`}>

      {/* Zone interactive compacte ou haute */}
      <div
        ref={badgeRef}
        role="button"
        tabIndex={0}
        aria-label={`Score : ${displayedValue}${subText ? ` (${subText})` : ''}. Glisser vers le haut ou le bas pour ajuster.`}
        title="Glisser vers le haut ou le bas pour ajuster rapidement, ou cliquer pour ouvrir le pavé"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={{ touchAction: 'none' }}
        className={`group relative border transition-all cursor-ns-resize select-none ${
          tall
            ? 'flex flex-col items-center justify-between min-w-[4.8rem] w-20 sm:w-24 h-full self-stretch py-2 px-1.5 rounded-2xl'
            : 'flex items-center justify-between gap-1.5 min-w-[4.2rem] h-10 px-2.5 py-1 rounded-xl'
        } ${
          isDragging
            ? `${tall ? 'scale-103' : 'scale-108'} border-[#c83b3b] bg-[#c83b3b]/15 text-[#c83b3b] ring-2 ring-[#c83b3b]/40 shadow-md z-30`
            : isNonZero
            ? 'bg-[#c83b3b]/8 dark:bg-[#c83b3b]/15 border-[#c83b3b]/35 text-[#c83b3b] dark:text-red-300 hover:border-[#c83b3b] shadow-2xs'
            : 'bg-white/80 dark:bg-slate-900/80 border-stone-200 dark:border-slate-800 text-stone-700 dark:text-slate-300 hover:border-[#c83b3b]/60 hover:text-[#c83b3b] shadow-2xs'
        } ${className}`}
      >
        {tall ? (
          <>
            <div className="pt-0.5">
              <ChevronUp size={15} className="opacity-45 group-hover:opacity-100 transition-opacity text-stone-500 dark:text-slate-400 group-hover:text-[#c83b3b]" />
            </div>

            {/* Valeur du score parfaitement centrée dans le badge */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center min-w-0 max-w-full px-1 pointer-events-none">
              <span className="text-xl sm:text-2xl font-black tabular-nums leading-none tracking-tight text-center">
                {displayedValue}
              </span>
              {subText && (
                <span className="text-[10px] font-extrabold uppercase tracking-tight text-center mt-0.5 leading-none opacity-90 truncate max-w-full">
                  {subText}
                </span>
              )}
            </div>

            {/* Repère tactile discret : masqué automatiquement pendant le glissement tactile */}
            <div className="flex flex-col items-center gap-0.5 pb-0.5">
              <div
                className={`relative flex items-center justify-center w-6 h-6 pointer-events-none mb-0.5 transition-all duration-200 ${
                  isDragging ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
                }`}
              >
                <span className="absolute w-4 h-4 rounded-full bg-stone-500/15 dark:bg-slate-400/15 anim-tap-ripple" />
                <svg
                  className="w-4 h-4 text-stone-500 dark:text-slate-400 opacity-55 group-hover:opacity-100 group-hover:text-[#c83b3b] anim-finger-tap transition-all"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777"
                  />
                </svg>
              </div>
              <ChevronDown size={15} className="opacity-45 group-hover:opacity-100 transition-opacity text-stone-500 dark:text-slate-400 group-hover:text-[#c83b3b]" />
            </div>
          </>
        ) : (
          <>
            <div className="flex items-baseline justify-center gap-1 flex-1 text-center truncate">
              <span className="text-base sm:text-lg font-black tabular-nums leading-none tracking-tight">
                {displayedValue}
              </span>
              {subText && (
                <span className="text-[9px] font-bold uppercase tracking-tight opacity-80">
                  {subText}
                </span>
              )}
            </div>
            <div className="flex flex-col items-center justify-center -mr-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
              <ArrowUpDown size={11} strokeWidth={2.5} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
