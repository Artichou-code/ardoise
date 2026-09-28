import { useState, useRef, useEffect } from 'react'
import { ArrowUpDown, Check } from 'lucide-react'

/**
 * Pavé de saisie tactile pour scores avec roulette interactive.
 * - Boutons colorés et ludiques (+1 en bleu, +5 en ambre, +10 en rouge marge).
 * - Roulette tactile sur le score central : glissement vertical continu avec retour haptique
 *   et validation instantanée dès qu'on relâche le doigt !
 */
export function ScorePad({ value = 0, onChange, onConfirm, label, min }) {
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

  const buttons = [
    { label: '+1', delta: 1, colorClass: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white shadow-xs' },
    { label: '+5', delta: 5, colorClass: 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white shadow-xs' },
    { label: '+10', delta: 10, colorClass: 'bg-[#c83b3b] hover:bg-[#b03030] active:bg-[#9a2828] text-white shadow-xs' },
    { label: '-1', delta: -1, colorClass: 'bg-stone-200 hover:bg-stone-300 active:bg-stone-400 dark:bg-slate-700 dark:hover:bg-slate-600 text-stone-800 dark:text-slate-100' },
    { label: '0', delta: -value, colorClass: 'bg-white dark:bg-slate-900 border-2 border-stone-300 dark:border-slate-700 hover:border-stone-400 text-stone-600 dark:text-slate-400' },
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

    // Si le joueur a fait défiler la roulette, on valide automatiquement dès le relâchement !
    if (hasMovedRef.current) {
      try {
        navigator.vibrate?.([15, 60, 20])
      } catch {}
      if (onConfirm) {
        setTimeout(() => {
          onConfirm()
        }, 50)
      }
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

  return (
    <div className="flex flex-col gap-3 pt-1">
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
          className={`relative select-none cursor-grab active:cursor-grabbing flex flex-col items-center justify-center transition-all duration-150 rounded-2xl border-2 ${
            isDragging
              ? 'py-4 bg-[#c83b3b]/10 dark:bg-[#c83b3b]/15 border-[#c83b3b] shadow-inner ring-4 ring-[#c83b3b]/20 scale-[1.02]'
              : 'py-3.5 bg-stone-50/80 dark:bg-slate-800/40 border-stone-200 dark:border-slate-800 hover:border-[#c83b3b]/40'
          }`}
        >
          {isDragging ? (
            <div className="flex flex-col items-center justify-center overflow-hidden py-1 w-full pointer-events-none">
              {/* Badge Relâcher pour valider */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c83b3b] text-white text-[11px] font-bold shadow-sm mb-1.5 animate-pulse">
                <Check size={12} strokeWidth={3} />
                <span>Relâcher pour valider</span>
              </div>

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
            <div className="flex flex-col items-center gap-1 py-1">
              <span className="text-4xl font-black tabular-nums tracking-tight text-stone-900 dark:text-slate-100">
                {value >= 0 ? '+' : ''}{value}
              </span>
              <span className="text-[11px] font-semibold text-stone-400 dark:text-slate-500 flex items-center gap-1">
                <ArrowUpDown size={11} className="text-[#c83b3b]" />
                Maintenir & glisser pour faire tourner
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Boutons incrémentaux colorés & fun */}
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

      {/* Bouton valider */}
      {onConfirm && (
        <button
          type="button"
          onClick={onConfirm}
          className="w-full py-3.5 rounded-xl font-bold text-base btn-margin-red mt-1"
        >
          Valider
        </button>
      )}
    </div>
  )
}
