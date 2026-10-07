import { useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Check, Trash2 } from 'lucide-react'
import { Avatar } from '../ui/Avatar'

/**
 * Retourne la configuration de saisie selon la catégorie du Yam's :
 * - Section Supérieure : Multiples de 1 à 5 dés + 0 barré
 * - Contrats Fixes : 0 barré et score validé (ex : 25 pts)
 * - Contrats Libres (Chance, Brelan, Carré) : Grille complète de tous les scores possibles (5 à 30 + 0 barré)
 */
export function getYamCategoryConfig(cat) {
  if (!cat) return { type: 'upper', choices: [] }

  if (cat.section === 'upper') {
    const d = cat.diceValue || 1
    return {
      type: 'upper',
      choices: [
        { label: '0', value: 0, isZero: true, desc: 'Barré' },
        { label: `${d * 1}`, value: d * 1, count: 1 },
        { label: `${d * 2}`, value: d * 2, count: 2 },
        { label: `${d * 3}`, value: d * 3, count: 3 },
        { label: `${d * 4}`, value: d * 4, count: 4 },
        { label: `${d * 5}`, value: d * 5, count: 5 },
      ],
    }
  }

  if (cat.fixed) {
    return {
      type: 'fixed',
      choices: [
        { label: '0', value: 0, isZero: true, desc: 'Barré' },
        { label: `${cat.fixed} pts`, value: cat.fixed, isFixed: true, desc: 'Validé' },
      ],
    }
  }

  // Contrats libres (Chance, Brelan, Carré) : Tous les scores possibles de 5 à 30
  const scores = []
  for (let s = 5; s <= 30; s++) {
    scores.push({ label: `${s}`, value: s })
  }

  return {
    type: 'fullGrid',
    zero: { label: '0', value: 0, isZero: true, desc: 'Barré' },
    scores, // 26 entiers de 5 à 30
  }
}

/**
 * Popover rectangulaire compact monté directement sur document.body via Portal.
 * Positionné sur la 3ème partie de l'écran (62.5% de hauteur, zone naturelle du pouce).
 * Offre un mini-sélecteur numérique complet (0 + 5 à 30) pour la Chance, le Brelan et le Carré.
 */
export function YamCellPopover({
  player,
  category,
  currentValue,
  onSelect,
  onClear,
  onClose,
}) {
  const config = useMemo(() => getYamCategoryConfig(category), [category])

  // Fermeture avec la touche Échap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!player || !category || typeof document === 'undefined') return null

  // Sous-titre explicatif adapté
  const subtitle =
    category.id === 'chance'
      ? 'Somme totale des 5 dés (min 5 · max 30)'
      : category.id === 'three_kind'
      ? '3 dés identiques + somme des 5 dés'
      : category.id === 'four_kind'
      ? '4 dés identiques + somme des 5 dés'
      : category.desc

  return createPortal(
    <div
      className="fixed inset-0 z-[100] select-none"
      style={{ touchAction: 'none' }}
    >
      {/* Fond sombre semi-transparent qui capture le clic pour fermer */}
      <div
        data-backdrop="true"
        className="fixed inset-0 bg-black/35 dark:bg-black/55 backdrop-blur-[1.5px] animate-in fade-in duration-150"
        onClick={onClose}
        onTouchMove={(e) => e.preventDefault()}
      />

      {/* Carte compacte positionnée sur la 3ème partie (sur 4) de l'écran du téléphone */}
      <div
        style={{
          top: '62.5%',
          transform: 'translate(-50%, -50%)',
        }}
        className="fixed left-1/2 w-[94vw] max-w-[370px] bg-white dark:bg-slate-900 border border-stone-200/90 dark:border-slate-700/80 rounded-2xl shadow-2xl p-3 sm:p-3.5 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-2.5 z-10"
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
              {subtitle && (
                <p className="text-[10px] sm:text-[10.5px] text-stone-400 dark:text-slate-500 truncate leading-tight mt-0.5">
                  {subtitle}
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

        {/* CONTENU SELON LE TYPE DE CATÉGORIE */}

        {/* 1. Contrats Libres : Chance, Brelan, Carré ➔ Mini sélecteur complet en grille 4x7 (0 + 5 à 30) */}
        {config.type === 'fullGrid' && (
          <div className="grid grid-cols-7 gap-1 py-0.5">
            {/* Case 1 : 0 (barré) */}
            <button
              type="button"
              data-choice-val={0}
              onClick={() => {
                try { navigator.vibrate?.(10) } catch {}
                onSelect(0)
                onClose()
              }}
              className={`h-8 sm:h-8.5 rounded-lg font-black text-xs sm:text-sm flex items-center justify-center transition-all cursor-pointer active:scale-95 border ${
                currentValue === 0
                  ? 'bg-[#c83b3b] text-white border-[#c83b3b] ring-2 ring-[#c83b3b]/30'
                  : 'bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 border-stone-200 dark:border-slate-700 hover:border-stone-400'
              }`}
              title="0 (barré)"
            >
              <span className="line-through decoration-red-500 decoration-2 font-bold">0</span>
            </button>

            {/* Cases 2 à 27 : Tous les scores de 5 à 30 */}
            {config.scores.map((sc) => {
              const isSelected = currentValue === sc.value
              return (
                <button
                  key={sc.value}
                  type="button"
                  data-choice-val={sc.value}
                  onClick={() => {
                    try { navigator.vibrate?.(10) } catch {}
                    onSelect(sc.value)
                    onClose()
                  }}
                  className={`h-8 sm:h-8.5 rounded-lg font-black text-xs sm:text-sm tabular-nums flex items-center justify-center transition-all cursor-pointer active:scale-95 border ${
                    isSelected
                      ? 'bg-[#c83b3b] text-white border-[#c83b3b] ring-2 ring-[#c83b3b]/30 shadow-xs'
                      : 'bg-stone-50 dark:bg-slate-800/90 text-stone-800 dark:text-slate-200 border-stone-200 dark:border-slate-700 hover:border-[#c83b3b] hover:text-[#c83b3b]'
                  }`}
                >
                  {sc.label}
                </button>
              )
            })}

            {/* Case 28 : Bouton Effacer (—) */}
            <button
              type="button"
              data-action="clear"
              disabled={currentValue == null}
              onClick={() => {
                if (currentValue != null) {
                  try { navigator.vibrate?.(10) } catch {}
                  onClear()
                  onClose()
                }
              }}
              className={`h-8 sm:h-8.5 rounded-lg font-bold text-xs flex items-center justify-center transition-all border ${
                currentValue != null
                  ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-100 cursor-pointer active:scale-95'
                  : 'bg-stone-50/50 dark:bg-slate-900/40 text-stone-300 dark:text-slate-600 border-stone-200/40 dark:border-slate-800/40 cursor-default opacity-50'
              }`}
              title={currentValue != null ? 'Effacer le score (remettre à vide)' : 'Aucun score'}
            >
              <Trash2 size={12} className="mr-0.5" />
              <span>—</span>
            </button>
          </div>
        )}

        {/* 2. Contrats Fixes : Full, P.Suite, G.Suite, Yam's ➔ 2 grands boutons confortables */}
        {config.type === 'fixed' && (
          <div className="flex items-center gap-2 py-0.5">
            {config.choices.map((choice) => {
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
                  className={`flex-1 h-11 px-2 rounded-xl font-black text-sm sm:text-base flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs border ${
                    isSelected
                      ? 'bg-[#c83b3b] text-white border-[#c83b3b] ring-2 ring-[#c83b3b]/30'
                      : choice.isZero
                      ? 'bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 border-stone-200 dark:border-slate-700 hover:border-stone-400'
                      : 'bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/25'
                  }`}
                >
                  {choice.isZero ? (
                    <span className="line-through decoration-red-500 decoration-2 font-bold">0 (Barré)</span>
                  ) : (
                    <>
                      <Check size={16} strokeWidth={3} className="text-emerald-600 dark:text-emerald-400" />
                      <span>{choice.label}</span>
                    </>
                  )}
                </button>
              )
            })}

            {/* Bouton Effacer si case remplie */}
            {currentValue != null && (
              <button
                type="button"
                data-action="clear"
                onClick={() => {
                  try { navigator.vibrate?.(10) } catch {}
                  onClear()
                  onClose()
                }}
                className="px-3 h-11 rounded-xl font-bold text-xs text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 border border-stone-200 dark:border-slate-700 hover:border-red-300 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                title="Effacer le score (remettre à vide)"
              >
                <Trash2 size={14} className="mr-1" />
                <span>Effacer</span>
              </button>
            )}
          </div>
        )}

        {/* 3. Section Supérieure : As à Six ➔ 6 multiples de dés */}
        {config.type === 'upper' && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
            {config.choices.map((choice) => {
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

            {/* Bouton Effacer si case remplie */}
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
        )}
      </div>
    </div>,
    document.body
  )
}
