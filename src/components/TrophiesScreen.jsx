import { useState, useMemo } from 'react'
import { ArrowLeft, Award, Lock, BarChart3, Trophy } from 'lucide-react'
import { useGame } from '../context/GameContext'
import { Avatar } from './ui/Avatar'
import { PlayerDetailSheet } from './PlayerDetailSheet'
import { BurgerMenuButton } from './BurgerMenu'
import { computeStats, TROPHIES_CATALOG } from '../utils/statsUtils'

export function TrophiesScreen() {
  const { games, players: registeredPlayers, setScreen } = useGame()
  const [filter, setFilter] = useState('all') // 'all' | 'general' | 'games'
  const [selectedPlayer, setSelectedPlayer] = useState(null)

  const playersStats = useMemo(() => {
    return computeStats(games, 'all', registeredPlayers).playersStats
  }, [games, registeredPlayers])

  // Associer chaque trophée à son détenteur actuel
  const trophiesWithHolders = useMemo(() => {
    return TROPHIES_CATALOG.map((trophy) => {
      const holder =
        playersStats.find((p) => p.badges?.some((b) => b.id === trophy.id)) || null
      const badgeInfo = holder
        ? holder.badges.find((b) => b.id === trophy.id)
        : null
      return {
        ...trophy,
        holder,
        holderDesc: badgeInfo?.desc || null,
      }
    })
  }, [playersStats])

  const filteredTrophies = useMemo(() => {
    if (filter === 'general') {
      return trophiesWithHolders.filter(
        (t) =>
          t.category === 'Général' ||
          t.category === 'Prestige' ||
          t.category === 'Dourak'
      )
    }
    if (filter === 'games') {
      return trophiesWithHolders.filter((t) => t.gameType)
    }
    return trophiesWithHolders
  }, [trophiesWithHolders, filter])

  const unlockedCount = useMemo(() => {
    return trophiesWithHolders.filter((t) => t.holder).length
  }, [trophiesWithHolders])

  const progressPercent = Math.round(
    (unlockedCount / TROPHIES_CATALOG.length) * 100
  )

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden school-surface select-none">
      {/* En-tête de page aligné sur Statistiques / Archives / Joueurs */}
      <header className="flex items-center gap-2 px-4 header-safe pb-3 flex-shrink-0 border-b border-stone-200/90 dark:border-slate-800/90 bg-[#faf9f5]/90 dark:bg-[#151719]/90 backdrop-blur-xs">
        <button
          type="button"
          onClick={() => setScreen('home')}
          className="p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Retour à l'accueil"
        >
          <ArrowLeft size={18} className="text-stone-700 dark:text-slate-300" />
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="font-serif-title font-bold text-lg leading-tight truncate">
            Guide des trophées
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setScreen('stats')}
          className="p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Voir les statistiques"
          aria-label="Statistiques"
        >
          <BarChart3 size={18} className="text-stone-700 dark:text-slate-300" />
        </button>
        <BurgerMenuButton />
      </header>

      {/* Barre d'onglets de filtrage */}
      <div className="flex-shrink-0 px-4 py-2.5 border-b border-stone-200/60 dark:border-slate-800/60 bg-[#faf9f5]/60 dark:bg-[#151719]/60">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-stone-200/70 dark:bg-slate-800/80 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer ${
              filter === 'all'
                ? 'bg-white dark:bg-slate-700 text-stone-900 dark:text-slate-100 shadow-xs font-bold'
                : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-200'
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
                : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-200'
            }`}
          >
            Généraux (5)
          </button>
          <button
            type="button"
            onClick={() => setFilter('games')}
            className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer ${
              filter === 'games'
                ? 'bg-white dark:bg-slate-700 text-stone-900 dark:text-slate-100 shadow-xs font-bold'
                : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-200'
            }`}
          >
            Par jeu (6)
          </button>
        </div>
      </div>

      {/* Corps défilant sur fond cahier / ardoise */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-3.5 pb-8 scroll-bottom-space space-y-3">
        {/* Carte récapitulative de progression */}
        <div className="p-3.5 rounded-2xl school-card space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#c83b3b]/10 dark:bg-[#c83b3b]/20 text-[#c83b3b] shrink-0">
                <Trophy size={16} />
              </span>
              <div>
                <p className="font-serif-title font-bold text-sm text-stone-900 dark:text-slate-100 leading-tight">
                  Distinctions de la table
                </p>
                <p className="text-[11px] text-stone-500 dark:text-slate-400">
                  {unlockedCount} sur {TROPHIES_CATALOG.length} trophées actuellement détenus
                </p>
              </div>
            </div>
            <span className="text-xs font-extrabold text-[#c83b3b] tabular-nums">
              {progressPercent}%
            </span>
          </div>

          <div className="w-full bg-stone-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#c83b3b] h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Liste des cartes de trophées */}
        {filteredTrophies.map((trophy) => {
          const isHeld = Boolean(trophy.holder)

          const badgeBg = {
            gold: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
            blue: 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
            red: 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
            rose: 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
            emerald: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
            purple: 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
            theme: 'bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/50',
          }[trophy.color || 'gold']

          return (
            <div
              key={trophy.id}
              className="p-3.5 rounded-2xl school-card space-y-2.5 transition-all"
            >
              {/* En-tête : Titre du trophée + Catégorie */}
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold border ${badgeBg}`}
                >
                  <Award size={13} />
                  {trophy.title}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-slate-500">
                  {trophy.category}
                </span>
              </div>

              {/* Description de l'exploit */}
              <p className="text-xs text-stone-600 dark:text-slate-300 leading-snug">
                {trophy.description}
              </p>

              {/* Condition précise */}
              <div className="p-2.5 rounded-xl bg-stone-100/80 dark:bg-slate-800/60 border border-stone-200/60 dark:border-slate-800 text-[11px] text-stone-700 dark:text-slate-300 flex items-start gap-1.5">
                <span className="font-bold text-stone-900 dark:text-slate-100 flex-shrink-0">
                  Critère&nbsp;:
                </span>
                <span className="leading-tight">{trophy.condition}</span>
              </div>

              {/* Détenteur actuel */}
              <div className="flex items-center justify-between pt-1.5 border-t border-stone-100 dark:border-slate-800/80 text-xs">
                <span className="text-[11px] text-stone-400 dark:text-slate-500 font-medium">
                  Statut actuel&nbsp;:
                </span>

                {isHeld ? (
                  <button
                    type="button"
                    onClick={() => setSelectedPlayer(trophy.holder)}
                    className="flex items-center gap-1.5 hover:opacity-85 transition-opacity cursor-pointer"
                  >
                    <Avatar player={trophy.holder} size="xs" />
                    <span className="font-bold text-stone-900 dark:text-slate-100">
                      {trophy.holder.name}
                    </span>
                    {trophy.holderDesc && (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        ({trophy.holderDesc})
                      </span>
                    )}
                  </button>
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

      {/* Fiche détaillée au clic sur le joueur détenteur */}
      <PlayerDetailSheet
        player={selectedPlayer}
        open={Boolean(selectedPlayer)}
        onClose={() => setSelectedPlayer(null)}
      />
    </div>
  )
}
