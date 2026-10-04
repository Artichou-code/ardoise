import { useState, useMemo } from 'react'
import { Lock } from 'lucide-react'
import { BottomSheet } from './ui/BottomSheet'
import { Avatar } from './ui/Avatar'
import { TrophyIcon } from './ui/TrophyIcon'
import { TROPHIES_CATALOG } from '../utils/statsUtils'

/**
 * Fiche modale détaillant l'ensemble des trophées, distinctions et leurs critères d'obtention
 */
export function TrophiesSheet({ open, onClose, playersStats = [] }) {
  const [filter, setFilter] = useState('all') // 'all' | 'general' | 'games'

  // Associer chaque trophée à son détenteur actuel
  const trophiesWithHolders = useMemo(() => {
    return TROPHIES_CATALOG.map(trophy => {
      // Trouver le joueur qui possède ce badge
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

  const filteredTrophies = useMemo(() => {
    if (filter === 'general') {
      return trophiesWithHolders.filter(t => !t.gameType)
    }
    if (filter === 'games') {
      return trophiesWithHolders.filter(t => Boolean(t.gameType))
    }
    return trophiesWithHolders
  }, [trophiesWithHolders, filter])

  const unlockedCount = useMemo(() => {
    return trophiesWithHolders.filter(t => t.holder).length
  }, [trophiesWithHolders])

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      position="bottom"
      title="Guide des trophées"
      subtitle={`${unlockedCount} sur ${TROPHIES_CATALOG.length} distinctions actuellement détenues`}
    >
      <div className="px-4 py-3 space-y-3.5">
        {/* Filtres de catégorie */}
        <div className="flex items-center gap-1.5 p-0.5 rounded-xl bg-stone-200/70 dark:bg-slate-800/80 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
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
            className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
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
            className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
              filter === 'games'
                ? 'bg-white dark:bg-slate-700 text-stone-900 dark:text-slate-100 shadow-xs font-bold'
                : 'text-stone-600 dark:text-slate-400 hover:text-stone-900'
            }`}
          >
            Par jeu ({gamesCount})
          </button>
        </div>

        {/* Liste des trophées */}
        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto scrollbar-hide pr-0.5 pb-4">
          {filteredTrophies.map(trophy => {
            const isHeld = Boolean(trophy.holder)

            // Palette selon la couleur du trophée
            const badgeBg = {
              gold: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
              amber: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
              blue: 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
              red: 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
              rose: 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
              emerald: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
              green: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
              purple: 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
              theme: 'bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/50',
            }[trophy.color || 'gold']

            return (
              <div
                key={trophy.id}
                className="p-3.5 rounded-2xl school-card space-y-2 border transition-all"
              >
                {/* En-tête : Titre du trophée + Catégorie */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold border ${badgeBg}`}
                    >
                      <TrophyIcon name={trophy.iconName} size={13} />
                      {trophy.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-slate-500">
                    {trophy.category}
                  </span>
                </div>

                {/* Description de l'exploit */}
                <p className="text-xs text-stone-600 dark:text-slate-300 leading-snug">
                  {trophy.description}
                </p>

                {/* Condition précise */}
                <p className="p-2 rounded-xl bg-stone-100/80 dark:bg-slate-800/60 border border-stone-200/60 dark:border-slate-800 text-[11px] text-stone-700 dark:text-slate-300 leading-snug">
                  <span className="font-bold text-stone-900 dark:text-slate-100 mr-1.5">
                    Critère&nbsp;:
                  </span>
                  {trophy.condition}
                </p>

                {/* Détenteur actuel */}
                <div className="flex items-center justify-between pt-1 border-t border-stone-100 dark:border-slate-800/80 text-xs">
                  <span className="text-[11px] text-stone-400 dark:text-slate-500 font-medium">
                    Statut actuel :
                  </span>

                  {isHeld ? (
                    <div className="flex items-center gap-1.5">
                      <Avatar player={trophy.holder} size="xs" />
                      <span className="font-bold text-stone-900 dark:text-slate-100">
                        {trophy.holder.name}
                      </span>
                      {trophy.holderDesc && (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          ({trophy.holderDesc})
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-stone-400 dark:text-slate-500 italic text-[11px]">
                      <Lock size={12} />
                      <span>Non attribué</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </BottomSheet>
  )
}
