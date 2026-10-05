import { useState, useMemo } from 'react'
import { Lock, Trophy } from 'lucide-react'
import { BottomSheet } from './ui/BottomSheet'
import { Avatar } from './ui/Avatar'
import { TrophyIcon } from './ui/TrophyIcon'
import { TROPHIES_CATALOG } from '../utils/statsUtils'

/**
 * Fiche modale détaillant l'ensemble des trophées, distinctions et leurs critères d'obtention
 */
export function TrophiesSheet({ open, onClose, playersStats = [] }) {
  const [filter, setFilter] = useState('all') // 'all' | 'general' | 'games'
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'unlocked' | 'locked'

  // Associer chaque trophée à son détenteur actuel
  const trophiesWithHolders = useMemo(() => {
    return TROPHIES_CATALOG.map(trophy => {
      const holder = playersStats.find(p => p.badges?.some(b => b.id === trophy.id)) || null
      const badgeInfo = holder ? holder.badges.find(b => b.id === trophy.id) : null
      return {
        ...trophy,
        holder,
        holderDesc: badgeInfo?.desc || null,
      }
    })
  }, [playersStats])

  const generalCount = useMemo(() => {
    return trophiesWithHolders.filter(t => !t.gameType).length
  }, [trophiesWithHolders])

  const gamesCount = useMemo(() => {
    return trophiesWithHolders.filter(t => Boolean(t.gameType)).length
  }, [trophiesWithHolders])

  const unlockedCount = useMemo(() => {
    return trophiesWithHolders.filter(t => t.holder).length
  }, [trophiesWithHolders])

  const lockedCount = trophiesWithHolders.length - unlockedCount

  const categoryTrophies = useMemo(() => {
    let list = trophiesWithHolders
    if (filter === 'general') {
      return list.filter(t => !t.gameType)
    } else if (filter === 'games') {
      return list.filter(t => Boolean(t.gameType))
    }
    return list
  }, [trophiesWithHolders, filter])

  const scopedTotal = categoryTrophies.length
  const scopedUnlocked = useMemo(() => {
    return categoryTrophies.filter(t => t.holder).length
  }, [categoryTrophies])
  const scopedLocked = scopedTotal - scopedUnlocked

  const filteredTrophies = useMemo(() => {
    let list = categoryTrophies
    if (statusFilter === 'unlocked') {
      list = list.filter(t => Boolean(t.holder))
    } else if (statusFilter === 'locked') {
      list = list.filter(t => !t.holder)
    }
    return list
  }, [categoryTrophies, statusFilter])

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      position="bottom"
      title="Guide des trophées"
      subtitle={`${unlockedCount} sur ${TROPHIES_CATALOG.length} distinctions actuellement détenues`}
    >
      <div className="px-4 py-3 space-y-3">
        {/* Filtres de catégorie principaux */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-stone-200/70 dark:bg-slate-800/80 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer ${
              filter === 'all'
                ? 'bg-white dark:bg-slate-700 text-stone-900 dark:text-slate-100 shadow-xs font-bold'
                : 'text-stone-600 dark:text-slate-400 hover:text-stone-900'
            }`}
          >
            Tous ({TROPHIES_CATALOG.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('general')}
            className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer ${
              filter === 'general'
                ? 'bg-white dark:bg-slate-700 text-stone-900 dark:text-slate-100 shadow-xs font-bold'
                : 'text-stone-600 dark:text-slate-400 hover:text-stone-900'
            }`}
          >
            Généraux ({generalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('games')}
            className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer ${
              filter === 'games'
                ? 'bg-white dark:bg-slate-700 text-stone-900 dark:text-slate-100 shadow-xs font-bold'
                : 'text-stone-600 dark:text-slate-400 hover:text-stone-900'
            }`}
          >
            Par jeu ({gamesCount})
          </button>
        </div>

        {/* Filtres de statut rapides avec protection responsive (grille 3 colonnes anti-wrap) */}
        <div className="grid grid-cols-3 gap-1.5 w-full min-w-0">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`py-1.5 px-1 rounded-xl text-[11px] sm:text-xs font-semibold transition-all cursor-pointer text-center truncate whitespace-nowrap min-w-0 ${
              statusFilter === 'all'
                ? 'bg-stone-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs font-bold'
                : 'bg-stone-100/90 dark:bg-slate-800/90 text-stone-600 dark:text-slate-400 hover:text-stone-900'
            }`}
          >
            Tous ({scopedTotal})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('unlocked')}
            className={`py-1.5 px-1 rounded-xl text-[11px] sm:text-xs font-semibold transition-all cursor-pointer inline-flex items-center justify-center gap-1 min-w-0 truncate whitespace-nowrap ${
              statusFilter === 'unlocked'
                ? 'bg-emerald-800 dark:bg-emerald-600 text-white shadow-2xs font-bold'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/80'
            }`}
          >
            <Trophy size={11} className="shrink-0" />
            <span className="truncate whitespace-nowrap">Détenus ({scopedUnlocked})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('locked')}
            className={`py-1.5 px-1 rounded-xl text-[11px] sm:text-xs font-semibold transition-all cursor-pointer inline-flex items-center justify-center gap-1 min-w-0 truncate whitespace-nowrap ${
              statusFilter === 'locked'
                ? 'bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 shadow-2xs font-bold'
                : 'bg-stone-100/90 dark:bg-slate-800/90 text-stone-600 dark:text-slate-400 hover:text-stone-900'
            }`}
          >
            <Lock size={11} className="shrink-0" />
            <span className="truncate whitespace-nowrap">Restants ({scopedLocked})</span>
          </button>
        </div>

        {/* Liste des trophées */}
        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto scrollbar-hide pr-0.5 pb-4">
          {filteredTrophies.length === 0 ? (
            <div className="py-8 text-center text-stone-400 dark:text-slate-500 text-xs">
              Aucun trophée ne correspond à ce filtre.
            </div>
          ) : (
            filteredTrophies.map(trophy => {
              const isHeld = Boolean(trophy.holder)

              const colorStyles = {
                gold: isHeld
                  ? 'bg-amber-100/90 text-amber-800 border border-amber-200/90 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 shadow-2xs'
                  : 'bg-stone-100/90 dark:bg-slate-800/70 text-stone-400 dark:text-slate-500 border border-stone-200/60 dark:border-slate-700/60',
                amber: isHeld
                  ? 'bg-amber-100/90 text-amber-800 border border-amber-200/90 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 shadow-2xs'
                  : 'bg-stone-100/90 dark:bg-slate-800/70 text-stone-400 dark:text-slate-500 border border-stone-200/60 dark:border-slate-700/60',
                blue: isHeld
                  ? 'bg-sky-100/90 text-sky-800 border border-sky-200/90 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60 shadow-2xs'
                  : 'bg-stone-100/90 dark:bg-slate-800/70 text-stone-400 dark:text-slate-500 border border-stone-200/60 dark:border-slate-700/60',
                emerald: isHeld
                  ? 'bg-emerald-100/90 text-emerald-800 border border-emerald-200/90 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 shadow-2xs'
                  : 'bg-stone-100/90 dark:bg-slate-800/70 text-stone-400 dark:text-slate-500 border border-stone-200/60 dark:border-slate-700/60',
                rose: isHeld
                  ? 'bg-rose-100/90 text-rose-800 border border-rose-200/90 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60 shadow-2xs'
                  : 'bg-stone-100/90 dark:bg-slate-800/70 text-stone-400 dark:text-slate-500 border border-stone-200/60 dark:border-slate-700/60',
                purple: isHeld
                  ? 'bg-purple-100/90 text-purple-800 border border-purple-200/90 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60 shadow-2xs'
                  : 'bg-stone-100/90 dark:bg-slate-800/70 text-stone-400 dark:text-slate-500 border border-stone-200/60 dark:border-slate-700/60',
              }[trophy.color || 'gold'] || (isHeld ? 'bg-amber-100/90 text-amber-800 border border-amber-200/90 shadow-2xs' : 'bg-stone-100 dark:bg-slate-800 text-stone-400')

              return (
                <div
                  key={trophy.id}
                  className={`p-3 rounded-2xl school-card transition-all flex flex-col justify-between gap-2 border ${
                    isHeld
                      ? 'border-amber-300/60 dark:border-amber-700/60 bg-white/95 dark:bg-slate-900/95'
                      : 'border-stone-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-900/60'
                  }`}
                >
                  {/* Partie haute : Icône à gauche, Titre & Condition d'obtention à droite */}
                  <div className="flex items-start gap-3">
                    {/* Médaillon d'icône */}
                    <div className="relative shrink-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorStyles}`}>
                        <TrophyIcon name={trophy.iconName} size={18} />
                      </div>
                      {!isHeld && (
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-stone-200 dark:bg-slate-700 border border-white dark:border-slate-900 flex items-center justify-center text-stone-600 dark:text-slate-300">
                          <Lock size={8} />
                        </div>
                      )}
                    </div>

                    {/* Détails du trophée : Titre & Condition d'obtention */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5 flex-wrap">
                        <h4 className="font-serif-title font-bold text-sm text-stone-900 dark:text-slate-100">
                          {trophy.title}
                        </h4>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 shrink-0">
                          {trophy.category}
                        </span>
                      </div>

                      {/* Condition d'obtention (contraste élevé conforme WCAG) */}
                      <p className="text-xs text-stone-700 dark:text-slate-200 leading-snug mt-1 font-medium">
                        {trophy.condition}
                      </p>
                    </div>
                  </div>

                  {/* Séparation graphique en pointillés & Phrase d'ambiance en pleine largeur (espace sous l'icône) */}
                  {trophy.description && (
                    <div className="pt-2 border-t border-dashed border-stone-200/90 dark:border-slate-800/90">
                      <p className="text-[11.5px] text-stone-600 dark:text-slate-300 italic leading-snug">
                        « {trophy.description} »
                      </p>
                    </div>
                  )}

                  {/* Pied de carte : Détenteur ou statut */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-stone-100 dark:border-slate-800/80 text-xs">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500 dark:text-slate-400">
                      {isHeld ? 'Détenteur' : 'Statut'}
                    </span>

                    {isHeld ? (
                      <div className="flex items-center gap-1.5">
                        <Avatar player={trophy.holder} size="xs" />
                        <span className="font-bold text-xs text-stone-900 dark:text-slate-100">
                          {trophy.holder.name}
                        </span>
                        {trophy.holderDesc && (
                          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                            ({trophy.holderDesc})
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-600 dark:text-slate-400">
                        <Lock size={11} className="text-stone-500 dark:text-slate-400" />
                        À conquérir
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </BottomSheet>
  )
}
