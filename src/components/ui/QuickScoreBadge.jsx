import { useState, useRef, useEffect } from 'react'
import { ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react'

/**
 * Badge de score compact avec roulette tactile intégrée (scroll tactile / glissement vertical).
 * - Glissement vers le haut = augmentation du score.
 * - Glissement vers le bas = diminution du score.
 * - Retour haptique vibrant à chaque cran.
 * - Support d'une variante haute (tall) couvrant 2 lignes pour équilibrer les choix manuels.
 * - Un simple clic/tap sans glisser ouvre la feuille complète (ScorePad).
 */
export function QuickScoreBadge({
  value,
  onChange,
  onOpenPad,
  min,
  max,
  step = 1,
  showPlus = true,
  tall = false,
  compact = false,
  formatBubble,
  formatDisplay,
  formatSub,
  values,
  fillZero = false,
  allowClear = false,
  disabled = false,
  isPast = false,
  isCurrentChoice = false,
  className = '',
}) {
  const [isDragging, setIsDragging] = useState(false)
  const dragStartXRef = useRef(0)
  const dragStartYRef = useRef(0)
  const dragStartValueRef = useRef(value ?? 0)
  const currentValueRef = useRef(value ?? 0)
  const hasMovedRef = useRef(false)
  const isDraggingRef = useRef(false)
  const isGestureDecidedRef = useRef(false)
  const isHorizontalScrollRef = useRef(false)
  const wasDraggingOrMovedRef = useRef(false)
  const openPadTimeoutRef = useRef(null)

  // Maintient la référence synchronisée avec la prop value
  useEffect(() => {
    if (!isDraggingRef.current) {
      currentValueRef.current = value ?? 0
    }
  }, [value])

  const clampValue = (val) => {
    let res = Number(val)
    if (isNaN(res)) res = min !== undefined ? min : 0
    if (values && values.length > 0) {
      if (values.includes(res)) return res
      return values.reduce((prev, curr) => Math.abs(curr - res) < Math.abs(prev - res) ? curr : prev)
    }
    if (min !== undefined && res < min) res = min
    if (max !== undefined && res > max) res = max
    return res
  }

  const handlePointerDown = (e) => {
    if (disabled) return
    dragStartXRef.current = e.clientX
    dragStartYRef.current = e.clientY
    hasMovedRef.current = false
    wasDraggingOrMovedRef.current = false

    // En mode grille compacte (Yam's), on ne capture pas le défilement tactile :
    // le scroll vertical natif de la page et horizontal du tableau restent 100% fluides.
    if (compact) return

    const initVal = value == null
      ? (allowClear ? null : (values && values.length > 0 ? values[0] : (min !== undefined ? min : 0)))
      : value
    dragStartValueRef.current = initVal
    currentValueRef.current = initVal
    isGestureDecidedRef.current = false
    isHorizontalScrollRef.current = false
    isDraggingRef.current = false
  }

  const handlePointerMove = (e) => {
    if (disabled || isHorizontalScrollRef.current) return

    // Sur badge compact, on détecte juste si l'utilisateur scroll pour éviter d'ouvrir le pad au lâcher
    if (compact) {
      const deltaX = Math.abs(e.clientX - dragStartXRef.current)
      const deltaY = Math.abs(e.clientY - dragStartYRef.current)
      if (deltaX > 8 || deltaY > 8) {
        hasMovedRef.current = true
        wasDraggingOrMovedRef.current = true
      }
      return
    }

    const deltaX = e.clientX - dragStartXRef.current
    const totalDeltaY = dragStartYRef.current - e.clientY // Vers le haut = augmentation

    // Décision de direction : tant que le mouvement est minime (< 6px), on attend
    if (!isGestureDecidedRef.current) {
      const absX = Math.abs(deltaX)
      const absY = Math.abs(totalDeltaY)

      if (absX < 6 && absY < 6) return

      isGestureDecidedRef.current = true

      // Si le geste part à l'horizontale : priorité absolue au scroll du conteneur (tableau) !
      if (absX > absY) {
        isHorizontalScrollRef.current = true
        isDraggingRef.current = false
        setIsDragging(false)
        return
      }

      // Si le geste est vertical : prise en charge tactile du score
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {}
      isDraggingRef.current = true
      setIsDragging(true)
      hasMovedRef.current = true
      wasDraggingOrMovedRef.current = true
      try {
        navigator.vibrate?.(10)
      } catch {}
    }

    if (!isDraggingRef.current) return
    hasMovedRef.current = true

    let nextVal
    if (values && values.length > 0) {
      if (allowClear) {
        // En mode allowClear, la liste commence à null (case non notée / tiret)
        const states = [null, ...values]
        const startIndex = states.indexOf(dragStartValueRef.current)
        const safeIndex = startIndex !== -1 ? startIndex : 0
        const indexSteps = Math.round(totalDeltaY / 22)
        const targetIndex = Math.max(0, Math.min(states.length - 1, safeIndex + indexSteps))
        nextVal = states[targetIndex]
      } else {
        const startIndex = values.indexOf(dragStartValueRef.current)
        const safeIndex = startIndex !== -1 ? startIndex : 0
        const indexSteps = Math.round(totalDeltaY / 22)
        const targetIndex = Math.max(0, Math.min(values.length - 1, safeIndex + indexSteps))
        nextVal = values[targetIndex]
      }
    } else {
      if (allowClear) {
        const minBound = min !== undefined ? min : 0
        if (dragStartValueRef.current === null) {
          if (totalDeltaY < 12) {
            nextVal = null
          } else {
            const stepsCount = Math.floor((totalDeltaY - 12) / 14) * step
            const tentative = minBound + stepsCount
            nextVal = max !== undefined ? Math.min(max, tentative) : tentative
          }
        } else {
          const stepsCount = Math.round(totalDeltaY / 14) * step
          const tentativeVal = dragStartValueRef.current + stepsCount
          if (tentativeVal < minBound) {
            nextVal = null
          } else {
            nextVal = max !== undefined ? Math.min(max, tentativeVal) : tentativeVal
          }
        }
      } else {
        // Sensibilité : ~14px par pas de score (identique à ScorePad)
        const stepsCount = Math.round(totalDeltaY / 14) * step
        nextVal = clampValue((dragStartValueRef.current ?? (min !== undefined ? min : 0)) + stepsCount)
      }
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
    if (compact) {
      if (hasMovedRef.current) {
        wasDraggingOrMovedRef.current = true
        setTimeout(() => {
          wasDraggingOrMovedRef.current = false
        }, 180)
      }
      return
    }

    const wasDragging = isDraggingRef.current
    const wasHorizontal = isHorizontalScrollRef.current
    const hasMoved = hasMovedRef.current

    isDraggingRef.current = false
    setIsDragging(false)
    isGestureDecidedRef.current = false
    isHorizontalScrollRef.current = false

    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}

    if (wasDragging && hasMoved) {
      wasDraggingOrMovedRef.current = true
      setTimeout(() => {
        wasDraggingOrMovedRef.current = false
      }, 180)
      try {
        navigator.vibrate?.(15)
      } catch {}
    } else if (!wasHorizontal && !hasMoved) {
      // Tap simple sans glisser : prépare l'ouverture ou s'exécute si pas de clic synthétique
      if (!disabled) {
        if (openPadTimeoutRef.current) clearTimeout(openPadTimeoutRef.current)
        openPadTimeoutRef.current = setTimeout(() => {
          onOpenPad?.()
          openPadTimeoutRef.current = null
        }, 220)
      }
    }
  }

  const handlePointerCancel = (e) => {
    isDraggingRef.current = false
    setIsDragging(false)
    isGestureDecidedRef.current = false
    isHorizontalScrollRef.current = false
    if (compact && hasMovedRef.current) {
      wasDraggingOrMovedRef.current = true
      setTimeout(() => {
        wasDraggingOrMovedRef.current = false
      }, 180)
    }
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}
  }

  const handleClick = (e) => {
    if (disabled) return
    if (wasDraggingOrMovedRef.current) {
      wasDraggingOrMovedRef.current = false
      return
    }
    if (openPadTimeoutRef.current) {
      clearTimeout(openPadTimeoutRef.current)
      openPadTimeoutRef.current = null
    }
    onOpenPad?.()
  }

  const cur = isDragging ? currentValueRef.current : value
  const isUnset = cur === null || cur === undefined
  const displaySign = showPlus && cur > 0 ? '+' : ''
  const displayedValue = isUnset ? (formatDisplay ? formatDisplay(null) : '—') : (formatDisplay ? formatDisplay(cur) : `${displaySign}${cur}`)
  const subText = isUnset ? null : (formatSub ? formatSub(cur) : null)
  const isFilled = !isUnset && (cur !== 0 || formatDisplay != null || fillZero || subText != null)

  return (
    <div className={`relative inline-flex items-center select-none flex-shrink-0 ${tall ? 'self-stretch' : ''} ${compact ? 'w-full' : ''}`}>

      {/* Zone interactive compacte ou haute */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={`Score : ${typeof displayedValue === 'string' || typeof displayedValue === 'number' ? displayedValue : cur}${subText ? ` (${subText})` : ''}.${disabled ? '' : ' Glisser vers le haut ou le bas pour ajuster.'}`}
        title={
          disabled
            ? isPast
              ? 'Score validé lors d\'une manche précédente'
              : 'Une seule case autorisée par manche'
            : 'Glisser vers le haut ou le bas pour ajuster rapidement, ou cliquer pour ouvrir le pavé'
        }
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={{ touchAction: disabled ? 'auto' : (compact ? 'pan-x pan-y' : 'manipulation') }}
        className={`group relative border transition-all select-none ${
          tall
            ? 'flex flex-col items-center justify-between min-w-[4.8rem] w-20 sm:w-24 h-full self-stretch py-2 px-1.5 rounded-2xl'
            : compact
            ? 'flex items-center justify-between gap-0.5 w-full min-w-0 h-7.5 sm:h-8 px-1 sm:px-1.5 py-0.5 rounded-lg'
            : 'flex items-center justify-between gap-1.5 min-w-[4.2rem] h-10 px-2.5 py-1 rounded-xl'
        } ${
          disabled
            ? isPast
              ? 'bg-stone-100/70 dark:bg-slate-800/60 border-stone-200/60 dark:border-slate-800 text-stone-700 dark:text-slate-200 font-extrabold cursor-default opacity-90'
              : 'bg-stone-50/50 dark:bg-slate-900/40 border-stone-200/40 dark:border-slate-800/40 text-stone-300 dark:text-slate-600 opacity-35 cursor-not-allowed'
            : isDragging
            ? `${tall ? 'scale-103' : 'scale-105'} border-[#c83b3b] bg-[#c83b3b]/15 text-[#c83b3b] ring-2 ring-[#c83b3b]/40 shadow-md z-30 cursor-ns-resize`
            : isCurrentChoice
            ? 'bg-[#c83b3b]/10 dark:bg-[#c83b3b]/20 border-[#c83b3b] text-[#c83b3b] dark:text-red-300 ring-2 ring-[#c83b3b]/60 shadow-xs cursor-pointer'
            : isFilled
            ? 'bg-[#c83b3b]/8 dark:bg-[#c83b3b]/15 border-[#c83b3b]/35 text-[#c83b3b] dark:text-red-300 hover:border-[#c83b3b] shadow-2xs cursor-pointer'
            : 'bg-white/80 dark:bg-slate-900/80 border-stone-200 dark:border-slate-800 text-stone-400 dark:text-slate-500 hover:border-[#c83b3b]/60 hover:text-[#c83b3b] shadow-2xs cursor-pointer'
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

            <div className="pb-0.5">
              <ChevronDown size={15} className="opacity-45 group-hover:opacity-100 transition-opacity text-stone-500 dark:text-slate-400 group-hover:text-[#c83b3b]" />
            </div>
          </>
        ) : (
          <>
            <div className="flex items-baseline justify-center gap-1 flex-1 text-center truncate">
              <span className={`${compact ? 'text-xs sm:text-sm font-extrabold' : 'text-base sm:text-lg font-black'} tabular-nums leading-none tracking-tight`}>
                {displayedValue}
              </span>
              {subText && (
                <span className="text-[9px] font-bold uppercase tracking-tight opacity-80">
                  {subText}
                </span>
              )}
            </div>
            {!disabled && (
              <div className="flex flex-col items-center justify-center -mr-0.5 opacity-40 group-hover:opacity-100 transition-opacity shrink-0">
                <ArrowUpDown size={compact ? 8.5 : 11} strokeWidth={2.5} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
