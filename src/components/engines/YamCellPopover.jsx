import { useState, useEffect, useRef, useMemo } from 'react'
import { X, Check, Trash2 } from 'lucide-react'
import { Avatar } from '../ui/Avatar'

/**
 * Retourne les choix de score possibles pour une catégorie du Yam's.
 * Conforme aux règles officielles et au souhait de l'utilisateur :
 * - As à Six : multiples de 1 à 5 dés (et 0 barré)
 * - Contrats fixes : 0 et score validé
 * - Brelan, Carré, Chance : scores les plus courants
 */
export function getYamCategoryChoices(cat) {
  if (!cat) return []

  if (cat.section === 'upper') {
    const d = cat.diceValue || 1
    return [
      { label: '0', value: 0, isZero: true, desc: 'Barré' },
      { label: `${d * 1}`, value: d * 1, count: 1 },
      { label: `${d * 2}`, value: d * 2, count: 2 },
      { label: `${d * 3}`, value: d * 3, count: 3 },
      { label: `${d * 4}`, value: d * 4, count: 4 },
      { label: `${d * 5}`, value: d * 5, count: 5 },
    ]
  }

  if (cat.fixed) {
    return [
      { label: '0', value: 0, isZero: true, desc: 'Barré' },
      { label: `${cat.fixed} pts`, value: cat.fixed, isFixed: true, desc: 'Validé' },
    ]
  }

  if (cat.id === 'three_kind') {
    // Brelan : 0 et sommes les plus fréquentes
    return [
      { label: '0', value: 0, isZero: true, desc: 'Barré' },
      { label: '15', value: 15 },
      { label: '18', value: 18 },
      { label: '20', value: 20 },
      { label: '24', value: 24 },
      { label: '28', value: 28 },
      { label: '30', value: 30 },
    ]
  }

  if (cat.id === 'four_kind') {
    // Carré : 0 et sommes les plus fréquentes
    return [
      { label: '0', value: 0, isZero: true, desc: 'Barré' },
      { label: '16', value: 16 },
      { label: '20', value: 20 },
      { label: '24', value: 24 },
      { label: '28', value: 28 },
      { label: '30', value: 30 },
    ]
  }

  if (cat.id === 'chance') {
    // Chance : 0 et sommes les plus fréquentes
    return [
      { label: '0', value: 0, isZero: true, desc: 'Barré' },
      { label: '15', value: 15 },
      { label: '20', value: 20 },
      { label: '22', value: 22 },
      { label: '25', value: 25 },
      { label: '30', value: 30 },
    ]
  }

  return [
    { label: '0', value: 0, isZero: true, desc: 'Barré' },
    ...(cat.presets || []).filter(v => v !== 0).map(v => ({ label: `${v}`, value: v })),
  ]
}

/**
 * Calcule la position ancrée (top, left, placement, position de la flèche)
 */
function calculateCoords(anchorRect, numChoices) {
  if (!anchorRect) {
    return { top: 0, left: 0, width: 280, arrowLeft: 140, placement: 'bottom' }
  }

  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  // Largeur adaptée au nombre de choix (de 220px pour 2 choix fixes à ~310px max)
  const estimatedWidth = Math.min(viewportWidth - 16, Math.max(220, numChoices * 44 + 32))
  const popoverHeight = 78

  const cellCenter = anchorRect.left + anchorRect.width / 2
  let left = cellCenter - estimatedWidth / 2

  // Clamper dans l'écran avec une marge de 8px
  left = Math.max(8, Math.min(viewportWidth - estimatedWidth - 8, left))

  // Position de la flèche relative au bord gauche du popover
  const arrowLeft = Math.max(16, Math.min(estimatedWidth - 16, cellCenter - left))

  // Verticalement : en dessous si l'espace le permet, sinon au-dessus
  const spaceBelow = viewportHeight - anchorRect.bottom
  const placement = spaceBelow >= popoverHeight + 12 ? 'bottom' : 'top'

  const top = placement === 'bottom'
    ? anchorRect.bottom + 8
    : Math.max(8, anchorRect.top - popoverHeight - 8)

  return { top, left, width: estimatedWidth, arrowLeft, placement }
}

/**
 * Bulle / Popover rectangulaire compacte ancrée sur la case cliquée
 */
export function YamCellPopover({
  anchorRect,
  player,
  category,
  currentValue,
  onSelect,
  onClear,
  onClose,
}) {
  const choices = useMemo(() => getYamCategoryChoices(category), [category])
  const [coords, setCoords] = useState(() => calculateCoords(anchorRect, choices.length))

  // Repositionner ou fermer si la page scroll / redimensionne
  useEffect(() => {
    const handleScrollOrResize = () => {
      onClose?.()
    }
    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('resize', handleScrollOrResize)
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('resize', handleScrollOrResize)
    }
  }, [onClose])

  if (!player || !category) return null

  return (
    <>
      {/* Fond invisible pour fermer en cliquant à côté */}
      <div
        className="fixed inset-0 z-40 bg-black/10 dark:bg-black/25 backdrop-blur-[0.5px]"
        onClick={onClose}
      />

      {/* Popover rectangulaire ancré */}
      <div
        style={{
          position: 'fixed',
          top: `${coords.top}px`,
          left: `${coords.left}px`,
          width: `${coords.width}px`,
        }}
        className="z-50 bg-white dark:bg-slate-900 border border-stone-200/90 dark:border-slate-700/80 rounded-2xl shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-1.5 select-none"
      >
        {/* Flèche pointant vers la case */}
        <div
          style={{ left: `${coords.arrowLeft}px` }}
          className={`absolute w-3 h-3 bg-white dark:bg-slate-900 border-stone-200/90 dark:border-slate-700/80 transform -translate-x-1/2 rotate-45 ${
            coords.placement === 'bottom'
              ? '-top-1.5 border-t border-l'
              : '-bottom-1.5 border-b border-r'
          }`}
        />

        {/* En-tête compact : Joueur · Catégorie */}
        <div className="flex items-center justify-between px-1 text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <Avatar player={player} size="xs" />
            <span className="font-bold text-stone-900 dark:text-slate-100 truncate text-[11px] sm:text-xs">
              {player.name}
            </span>
            <span className="text-stone-400 dark:text-slate-500 text-[10px] sm:text-[11px] truncate">
              · {category.name}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X size={13} />
          </button>
        </div>

        {/* Ligne des choix possibles */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
          {choices.map((choice) => {
            const isSelected = currentValue === choice.value
            return (
              <button
                key={choice.value}
                type="button"
                data-choice-val={choice.value}
                onClick={() => {
                  try { navigator.vibrate?.(10) } catch {}
                  onSelect(choice.value)
                  onClose()
                }}
                className={`flex-1 min-w-[32px] sm:min-w-[36px] h-8 sm:h-9 px-1 rounded-xl font-black text-xs sm:text-sm flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs border ${
                  isSelected
                    ? 'bg-[#c83b3b] text-white border-[#c83b3b] ring-2 ring-[#c83b3b]/30'
                    : choice.isZero
                    ? 'bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 border-stone-200 dark:border-slate-700 hover:border-stone-400'
                    : choice.isFixed
                    ? 'bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/25'
                    : 'bg-stone-50 dark:bg-slate-800/90 text-stone-800 dark:text-slate-200 border-stone-200 dark:border-slate-700 hover:border-[#c83b3b] hover:text-[#c83b3b]'
                }`}
              >
                {choice.isZero ? (
                  <span className="line-through decoration-red-500 decoration-2 font-bold">0</span>
                ) : (
                  <span>{choice.label}</span>
                )}
                {choice.count && (
                  <span className={`text-[8px] leading-none ${isSelected ? 'text-white/80' : 'text-stone-400 dark:text-slate-500'}`}>
                    {choice.count}×
                  </span>
                )}
              </button>
            )
          })}

          {/* Bouton Effacer si la case a déjà un score */}
          {currentValue != null && (
            <button
              type="button"
              data-action="clear"
              onClick={() => {
                try { navigator.vibrate?.(10) } catch {}
                onClear()
                onClose()
              }}
              className="px-2 h-8 sm:h-9 rounded-xl font-bold text-[11px] text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 border border-stone-200 dark:border-slate-700 hover:border-red-300 transition-all flex items-center justify-center shrink-0 cursor-pointer"
              title="Effacer le score (remettre à vide)"
            >
              <Trash2 size={12} className="mr-0.5" />
              <span>—</span>
            </button>
          )}
        </div>
      </div>
    </>
  )
}
