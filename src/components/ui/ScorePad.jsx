import { useState, useRef, useEffect } from 'react'
import { ArrowUpDown } from 'lucide-react'

/**
 * Pavé de saisie tactile pour scores avec roulette interactive.
 * - Boutons aux nuances rouges Ardoise avec transparences graduées (#c83b3b).
 * - Roulette tactile sur le score central : glissement vertical continu avec retour haptique.
 * - Le relâchement du doigt conserve le score choisi sans fermer la page.
 * - La validation finale et fermeture se fait par le bouton rouge « Valider ».
 */
export function ScorePad({ value = 0, onChange, onConfirm, label, min, baseScore, formatTotal }) {
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
    if (min !== undefined && val < min) return min
    return val
  }

  // Déclinaison monochrome rouge Ardoise avec transparences graduées
  const buttons = [
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
    const step = Math.round(totalDeltaY / 14)
    const nextVal = clampValue(dragStartValueRef.current + step)

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

  const cur = currentValueRef.current
  const totalScore = baseScore !== undefined ? baseScore + cur : null
  const totalText = formatTotal
    ? formatTotal(cur)
    : totalScore !== null
    ? `Total : ${totalScore}`
    : null

  return (
    <div className="flex flex-col gap-3 pt-2">
      {label && (
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400">
          {label}
        </p>
      )}

      {/* Roulette tactile & affichage du score */}
      <div className="relative">
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          style={{ touchAction: 'none' }}
          className={`relative select-none cursor-grab active:cursor-grabbing flex flex-col items-center justify-center transition-colors duration-150 rounded-2xl border-2 ${
            isDragging
              ? 'py-3 bg-[#c83b3b]/10 dark:bg-[#c83b3b]/15 border-[#c83b3b] shadow-xs ring-2 ring-[#c83b3b]/30'
              : 'py-3 bg-stone-50/80 dark:bg-slate-800/40 border-stone-200 dark:border-slate-800 hover:border-[#c83b3b]/40'
          }`}
        >
          {isDragging ? (
            <div className="flex flex-col items-center justify-center overflow-hidden py-0.5 w-full pointer-events-none">
              {/* Pastille minimaliste du score total pendant le glissement */}
              {totalText && (
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100/90 dark:bg-slate-800/90 text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-700 text-[11px] font-semibold shadow-2xs mb-1">
                  <span>{totalText}</span>
                </div>
              )}

              {/* Cylindre de roulette */}
              <div className="flex flex-col items-center leading-none">
                <span className="text-xs font-semibold text-stone-400 dark:text-slate-500 opacity-40 tabular-nums">
                  {clampValue(cur + 2) >= 0 ? '+' : ''}{clampValue(cur + 2)}
                </span>
                <span className="text-base font-bold text-stone-500 dark:text-slate-400 opacity-70 my-1 tabular-nums">
                  {clampValue(cur + 1) >= 0 ? '+' : ''}{clampValue(cur + 1)}
                </span>

                {/* Mire centrale */}
                <div className="relative flex items-center justify-center px-6 py-1 my-0.5 rounded-xl bg-white dark:bg-slate-900 border border-[#c83b3b]/40 shadow-xs">
                  <span className="absolute left-2 text-[#c83b3b] font-mono text-xs font-black">▶</span>
                  <span className="text-4xl font-black text-[#c83b3b] dark:text-red-400 tabular-nums tracking-tight">
                    {cur >= 0 ? '+' : ''}{cur}
                  </span>
                  <span className="absolute right-2 text-[#c83b3b] font-mono text-xs font-black">◀</span>
                </div>

                <span className="text-base font-bold text-stone-500 dark:text-slate-400 opacity-70 my-1 tabular-nums">
                  {clampValue(cur - 1) >= 0 ? '+' : ''}{clampValue(cur - 1)}
                </span>
                <span className="text-xs font-semibold text-stone-400 dark:text-slate-500 opacity-40 tabular-nums">
                  {clampValue(cur - 2) >= 0 ? '+' : ''}{clampValue(cur - 2)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-0.5 py-1">
              <span className="text-4xl font-black tabular-nums tracking-tight text-stone-900 dark:text-slate-100">
                {value >= 0 ? '+' : ''}{value}
              </span>
              {totalScore !== null ? (
                <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">
                  {formatTotal ? formatTotal(value) : `Total : ${baseScore + value}`}
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-stone-400 dark:text-slate-500 flex items-center gap-1">
                  <ArrowUpDown size={11} className="text-[#c83b3b]" />
                  Maintenir & glisser pour faire tourner
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Boutons incrémentaux aux nuances de rouge avec transparences */}
      <div className="grid grid-cols-5 gap-2 pt-1">
        {buttons.map(({ label: lbl, delta, colorClass }) => (
          <button
            key={lbl}
            type="button"
            onPointerDown={(e) => {
              e.preventDefault()
              const next = clampValue(value + delta)
              onChange(next)
              try { navigator.vibrate?.(10) } catch {}
            }}
            className={`h-12 rounded-xl font-black text-sm select-none transition-all active:scale-90 flex items-center justify-center ${colorClass}`}
          >
            {lbl}
          </button>
        ))}
      </div>

      {/* Bouton valider final */}
      {onConfirm && (
        <button
          type="button"
          onClick={onConfirm}
          className="w-full py-3.5 rounded-xl font-bold text-base btn-margin-red mt-1 shadow-sm"
        >
          Valider
        </button>
      )}
    </div>
  )
}
