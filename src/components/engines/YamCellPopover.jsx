import { useMemo, useEffect } from 'react'
import { X, Check, Trash2 } from 'lucide-react'
import { Avatar } from '../ui/Avatar'

/**
 * Retourne les choix de score possibles pour une catégorie du Yam's.
 * Conforme aux règles officielles et au souhait de l'utilisateur :
 * - As à Six : multiples de 1 à 5 dés (et 0 barré)
 * - Contrats fixes : 0 et score validé (ex : 25 pts)
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
 * Popover rectangulaire compact centré au milieu de l'écran.
 * Évite toute coupure en bord d'écran, sous les barres de navigation Android ou en cas de scroll.
 */
export function YamCellPopover({
  player,
  category,
  currentValue,
  onSelect,
  onClear,
  onClose,
}) {
  const choices = useMemo(() => getYamCategoryChoices(category), [category])

  // Fermeture avec la touche Échap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!player || !category) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 dark:bg-black/60 backdrop-blur-[1.5px] animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[360px] bg-white dark:bg-slate-900 border border-stone-200/90 dark:border-slate-700/80 rounded-2xl shadow-2xl p-3.5 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête : Joueur · Catégorie + Description */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar player={player} size="sm" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 leading-tight">
                <span className="font-bold text-stone-900 dark:text-slate-100 text-xs sm:text-sm truncate">
                  {player.name}
                </span>
                <span className="text-stone-300 dark:text-slate-600 text-xs font-semibold">
                  ·
                </span>
                <span className="font-extrabold text-[#c83b3b] dark:text-red-400 text-xs sm:text-sm truncate">
                  {category.name}
                </span>
              </div>
              {category.desc && (
                <p className="text-[10px] sm:text-[10.5px] text-stone-400 dark:text-slate-500 truncate leading-tight mt-0.5">
                  {category.desc}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Ligne des choix possibles */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
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
                className={`flex-1 min-w-[34px] sm:min-w-[38px] h-9 sm:h-10 px-1 rounded-xl font-black text-xs sm:text-sm flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs border ${
                  isSelected
                    ? 'bg-[#c83b3b] text-white border-[#c83b3b] ring-2 ring-[#c83b3b]/30'
                    : choice.isZero
                    ? 'bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 border-stone-200 dark:border-slate-700 hover:border-stone-400'
                    : choice.isFixed
                    ? 'bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/25 font-bold'
                    : 'bg-stone-50 dark:bg-slate-800/90 text-stone-800 dark:text-slate-200 border-stone-200 dark:border-slate-700 hover:border-[#c83b3b] hover:text-[#c83b3b]'
                }`}
              >
                {choice.isZero ? (
                  <span className="line-through decoration-red-500 decoration-2 font-bold">0</span>
                ) : (
                  <span>{choice.label}</span>
                )}
                {choice.count && (
                  <span className={`text-[8.5px] leading-none ${isSelected ? 'text-white/80' : 'text-stone-400 dark:text-slate-500'}`}>
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
              className="px-2.5 h-9 sm:h-10 rounded-xl font-bold text-xs text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 border border-stone-200 dark:border-slate-700 hover:border-red-300 transition-all flex items-center justify-center shrink-0 cursor-pointer"
              title="Effacer le score (remettre à vide)"
            >
              <Trash2 size={13} className="mr-0.5" />
              <span>—</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
