import { useState, useRef, useEffect } from 'react'
import { ArrowUpDown } from 'lucide-react'

/**
 * Pavé de saisie tactile pour scores avec roulette interactive.
 * - Boutons aux nuances rouges Ardoise avec transparences graduées (#c83b3b).
 * - Roulette tactile sur le score central : glissement vertical continu avec retour haptique.
 * - Le relâchement du doigt conserve le score choisi sans fermer la page.
 * - La validation finale et fermeture se fait par le bouton rouge « Valider ».
 */
export function ScorePad({
  value = 0,
  onChange,
  onConfirm,
  confirmLabel = 'Valider',
  label,
  subLabel,
  min,
  max,
  step = 1,
  baseScore,
  formatTotal,
  formatDisplay,
  presets,
  showPlus = true,
  customButtons,
  disabled = false,
  disabledMessage,
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
    let num = Number(val)
    if (isNaN(num)) num = min !== undefined ? min : 0
    if (min !== undefined && num < min) num = min
    if (max !== undefined && num > max) num = max
    return num
  }

  // Déclinaison monochrome rouge Ardoise avec transparences graduées (#c83b3b)
  const defaultButtons = [
    {
      label: '+1',
      delta: 1,
      colorClass:
        'bg-[#c83b3b]/15 hover:bg-[#c83b3b]/25 dark:bg-[#c83b3b]/20 dark:hover:bg-[#c83b3b]/30 text-[#c83b3b] dark:text-red-300 border border-[#c83b3b]/25',
    },
    {
      label: '+5',
      delta: 5,
      colorClass:
        'bg-[#c83b3b]/35 hover:bg-[#c83b3b]/45 dark:bg-[#c83b3b]/40 dark:hover:bg-[#c83b3b]/50 text-[#c83b3b] dark:text-red-200 border border-[#c83b3b]/35',
    },
    {
      label: '+10',
      delta: 10,
      colorClass:
        'bg-[#c83b3b] hover:bg-[#b03030] active:bg-[#9a2828] text-white border border-[#c83b3b] shadow-2xs',
    },
    {
      label: '-1',
      delta: -1,
      colorClass:
        'bg-[#c83b3b]/8 hover:bg-[#c83b3b]/15 dark:bg-[#c83b3b]/10 dark:hover:bg-[#c83b3b]/20 text-stone-700 dark:text-slate-300 border border-[#c83b3b]/15',
    },
    {
      label: '0',
      delta: -value,
      colorClass:
        'bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-700 hover:border-[#c83b3b]/40 text-stone-600 dark:text-slate-400',
    },
  ]

  const buttons = customButtons !== undefined ? customButtons : defaultButtons

  const handlePointerDown = (e) => {
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
      navigator.vibrate?.(12)
    } catch {}
  }

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return
    const totalDeltaY = dragStartYRef.current - e.clientY // Vers le haut = augmentation
    if (Math.abs(totalDeltaY) > 5) {
      hasMovedRef.current = true
    }

    // Sensibilité : ~14px par pas de score
    const dragStep = step || 1
    const stepsCount = Math.round(totalDeltaY / 14) * dragStep
    const nextVal = clampValue(dragStartValueRef.current + stepsCount)

    if (nextVal !== currentValueRef.current) {
      currentValueRef.current = nextVal
      onChange(nextVal)
      try {
        navigator.vibrate?.(8)
      } catch {}
    }
  }

  const handlePointerUp = (e) => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    setIsDragging(false)
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}

    // Le score choisi reste sélectionné dans le champ, la validation se fait au clic sur le bouton "Valider"
    if (hasMovedRef.current) {
      try {
        navigator.vibrate?.(15)
      } catch {}
    }
  }

  const handlePointerCancel = (e) => {
    isDraggingRef.current = false
    setIsDragging(false)
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}
  }

  const dragStep = step || 1
  const cur = isDragging ? currentValueRef.current : value
  const totalScore = baseScore !== undefined ? baseScore + cur : null
  const totalObj = formatTotal
    ? (typeof formatTotal(cur) === 'object' && formatTotal(cur) !== null
        ? formatTotal(cur)
        : { text: formatTotal(cur), variant: undefined })
    : totalScore !== null
    ? { text: `Total : ${totalScore}`, variant: undefined }
    : null

  const totalText = totalObj?.text ?? null
  const totalVariant = totalObj?.variant || (
    totalText && (
      String(totalText).includes('Élimin') ||
      String(totalText).includes('danger') ||
      String(totalText).includes('⚠️') ||
      String(totalText).includes('Min.') ||
      String(totalText).startsWith('-')
    ) ? 'danger' : 'default'
  )

  const displayVal = (v) => {
    const clamped = clampValue(v)
    if (formatDisplay) return formatDisplay(clamped)
    const sign = showPlus && clamped > 0 ? '+' : ''
    return `${sign}${clamped}`
  }

  const getDisplayLength = (val) => {
    if (typeof val === 'string' || typeof val === 'number') {
      return String(val).length
    }
    return 3
  }

  const valAbove2 = cur + dragStep * 2
  const isAbove2Valid = (min === undefined || valAbove2 >= min) && (max === undefined || valAbove2 <= max)

  const valAbove1 = cur + dragStep
  const isAbove1Valid = (min === undefined || valAbove1 >= min) && (max === undefined || valAbove1 <= max)

  const valBelow1 = cur - dragStep
  const isBelow1Valid = (min === undefined || valBelow1 >= min) && (max === undefined || valBelow1 <= max)

  const valBelow2 = cur - dragStep * 2
  const isBelow2Valid = (min === undefined || valBelow2 >= min) && (max === undefined || valBelow2 <= max)

  return (
    <div className="flex flex-col gap-3 pt-2">
      {(label || subLabel) && (
        <div className="flex items-center justify-between gap-2">
          {label && (
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400 truncate">
              {label}
            </p>
          )}
          {subLabel && (
            <span className="text-[11px] font-semibold text-stone-500 dark:text-slate-400 shrink-0">
              {subLabel}
            </span>
          )}
        </div>
      )}

      {/* Roulette tactile & affichage du score */}
      <div className="relative">
        <div
          onPointerDown={disabled ? undefined : handlePointerDown}
          onPointerMove={disabled ? undefined : handlePointerMove}
          onPointerUp={disabled ? undefined : handlePointerUp}
          onPointerCancel={disabled ? undefined : handlePointerCancel}
          style={{ touchAction: disabled ? 'auto' : 'none' }}
          className={`relative select-none flex flex-col items-center justify-center transition-colors duration-150 rounded-2xl border-2 ${
            presets && presets.length > 7
              ? 'h-[156px] sm:h-[174px]'
              : 'h-[174px]'
          } ${
            disabled
              ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300/60 dark:border-emerald-800/50 cursor-default'
              : isDragging
              ? 'bg-[#c83b3b]/10 dark:bg-[#c83b3b]/15 border-[#c83b3b] shadow-xs ring-2 ring-[#c83b3b]/30 cursor-grab active:cursor-grabbing'
              : 'bg-stone-50/80 dark:bg-slate-800/40 border-stone-200 dark:border-slate-800 hover:border-[#c83b3b]/40 cursor-grab active:cursor-grabbing'
          }`}
        >
          {isDragging ? (
            <div className="flex flex-col items-center justify-between overflow-hidden w-full h-full pointer-events-none pt-2.5 pb-2">
              {/* Pastille décollée du haut avec marge nette */}
              <div className="shrink-0 flex items-center justify-center w-full px-3">
                {totalText ? (
                  <div className={`inline-flex items-center justify-center gap-1 px-3 py-0.5 rounded-full text-white text-[11px] font-bold shadow-xs max-w-full truncate ${
                    totalVariant === 'danger'
                      ? 'bg-[#c83b3b]'
                      : 'bg-emerald-600'
                  }`}>
                    <span className="truncate">{totalText}</span>
                  </div>
                ) : <div className="h-4" />}
              </div>

              {/* Cylindre de roulette centré et aéré */}
              <div className="flex flex-col items-center leading-none my-auto">
                <span className={`h-5 shrink-0 flex items-center justify-center text-xs font-semibold text-stone-400 dark:text-slate-500 opacity-50 tabular-nums ${isAbove1Valid ? '' : 'invisible select-none'}`}>
                  {isAbove1Valid ? displayVal(valAbove1) : '\u00A0'}
                </span>

                {/* Mire centrale */}
                <div className="h-11 shrink-0 my-1 relative flex items-center justify-center px-6 rounded-xl bg-white dark:bg-slate-900 border border-[#c83b3b]/40 shadow-xs">
                  <span className="absolute left-2.5 text-[#c83b3b] font-mono text-xs font-black">▶</span>
                  <span className={`font-black text-[#c83b3b] dark:text-red-400 tabular-nums tracking-tight ${
                    getDisplayLength(displayVal(cur)) > 8 ? 'text-2xl sm:text-3xl' : getDisplayLength(displayVal(cur)) > 5 ? 'text-3xl sm:text-4xl' : 'text-3xl sm:text-4xl'
                  }`}>
                    {displayVal(cur)}
                  </span>
                  <span className="absolute right-2.5 text-[#c83b3b] font-mono text-xs font-black">◀</span>
                </div>

                <span className={`h-5 shrink-0 flex items-center justify-center text-xs font-semibold text-stone-400 dark:text-slate-500 opacity-50 tabular-nums ${isBelow1Valid ? '' : 'invisible select-none'}`}>
                  {isBelow1Valid ? displayVal(valBelow1) : '\u00A0'}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1.5 h-full w-full py-2">
              <span className={`font-black tabular-nums tracking-tight ${
                disabled
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-stone-900 dark:text-slate-100'
              } ${
                getDisplayLength(displayVal(value)) > 8 ? 'text-2xl sm:text-3xl' : getDisplayLength(displayVal(value)) > 5 ? 'text-3xl sm:text-4xl' : 'text-4xl'
              }`}>
                {displayVal(value)}
              </span>
              {totalText !== null ? (
                <div className="flex flex-col items-center max-w-full px-3">
                  <span className={`text-xs font-bold text-center truncate max-w-full ${
                    totalVariant === 'danger'
                      ? 'text-[#c83b3b] dark:text-red-400'
                      : totalVariant === 'success'
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-stone-600 dark:text-slate-400'
                  }`}>
                    {totalText}
                  </span>
                  {!disabled && (
                    <span className="animate-breathe text-[10.5px] text-stone-400 dark:text-slate-500 flex items-center gap-1.5 mt-2.5 font-medium select-none">
                      <ArrowUpDown size={11} className="text-[#c83b3b] shrink-0" />
                      <span>Maintenir & glisser pour faire tourner</span>
                    </span>
                  )}
                  {disabled && (
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 mt-2 select-none">
                      <span>✓ {disabledMessage || 'Score verrouillé à 0 pt'}</span>
                    </span>
                  )}
                </div>
              ) : (
                !disabled ? (
                  <span className="animate-breathe text-[11px] font-medium text-stone-400 dark:text-slate-500 flex items-center gap-1.5 mt-2.5 select-none">
                    <ArrowUpDown size={11} className="text-[#c83b3b] shrink-0" />
                    <span>Maintenir & glisser pour faire tourner</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 mt-2 select-none">
                    <span>✓ {disabledMessage || 'Score verrouillé à 0 pt'}</span>
                  </span>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Raccourcis prédéfinis */}
      {presets && presets.length > 0 && (() => {
        const isMultiRow = presets.length > 7
        const cols = isMultiRow ? Math.ceil(presets.length / 2) : presets.length

        return (
          <div
            className={`grid w-full py-0.5 transition-opacity ${isMultiRow ? 'gap-1 sm:gap-1.5' : 'gap-1.5'} ${
              disabled ? 'opacity-30 pointer-events-none select-none grayscale' : ''
            }`}
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {presets.map(p => {
              const pVal = typeof p === 'object' ? p.value : p
              const pLabel = typeof p === 'object' ? p.label : `${showPlus && pVal > 0 ? '+' : ''}${pVal}`
              const isSelected = value === pVal
              return (
                <button
                  key={pVal}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onChange(pVal)
                    try { navigator.vibrate?.(10) } catch {}
                  }}
                  className={`min-w-0 text-center rounded-lg font-bold border transition-all cursor-pointer select-none active:scale-95 flex items-center justify-center ${
                    isMultiRow
                      ? 'h-8 sm:h-9 text-xs sm:text-sm px-1'
                      : 'h-8.5 sm:h-9.5 text-xs sm:text-sm px-2'
                  } ${
                    isSelected
                      ? 'bg-[#c83b3b] text-white border-[#c83b3b] shadow-2xs font-black'
                      : 'school-subtle hover:border-[#c83b3b]/40 text-stone-700 dark:text-slate-300'
                  }`}
                >
                  <span className="truncate block leading-tight">{pLabel}</span>
                </button>
              )
            })}
          </div>
        )
      })()}

      {/* Boutons incrémentaux ou raccourcis personnalisés */}
      {buttons && buttons.length > 0 && (
        <div className={`grid gap-2 pt-1 transition-opacity ${buttons.length === 5 ? 'grid-cols-5' : 'grid-cols-4 sm:grid-cols-5'} ${
          disabled ? 'opacity-30 pointer-events-none select-none grayscale' : ''
        }`}>
          {buttons.map((btn, idx) => {
            let main = btn.main
            let sub = btn.sub
            if (!main && btn.label) {
              const match = btn.label.match(/^(.*?)\s*\((.*?)\)$/)
              if (match) {
                main = match[1]
                sub = match[2]
              } else {
                main = btn.label
              }
            }

            const isSelected = btn.value !== undefined && value === btn.value

            return (
              <button
                key={btn.label || btn.main || idx}
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault()
                  const next = btn.value !== undefined
                    ? clampValue(btn.value)
                    : clampValue((Number(value) || 0) + (btn.delta || 0))
                  onChange(next)
                  try { navigator.vibrate?.(10) } catch {}
                }}
                className={`h-12 rounded-xl select-none transition-all active:scale-95 flex flex-col items-center justify-center px-0.5 py-1 border cursor-pointer ${
                  btn.colorClass
                    ? btn.colorClass
                    : isSelected
                    ? 'bg-[#c83b3b] text-white border-[#c83b3b] shadow-2xs'
                    : 'school-subtle hover:border-[#c83b3b]/40 text-stone-700 dark:text-slate-300'
                }`}
              >
                <span className={`font-black text-sm leading-tight ${isSelected && !btn.colorClass ? 'text-white' : ''}`}>
                  {main}
                </span>
                {sub && (
                  <span className={`text-[8px] sm:text-[9px] font-semibold tracking-tighter leading-none mt-0.5 truncate max-w-full text-center ${
                    isSelected && !btn.colorClass
                      ? 'text-white/85'
                      : 'text-stone-400 dark:text-slate-500'
                  }`}>
                    {sub}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Bouton valider final */}
      {onConfirm && (
        <button
          type="button"
          onClick={onConfirm}
          className="w-full py-3.5 px-3 rounded-xl font-bold text-base btn-margin-red mt-1 shadow-sm active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center text-center"
        >
          {confirmLabel}
        </button>
      )}
    </div>
  )
}
