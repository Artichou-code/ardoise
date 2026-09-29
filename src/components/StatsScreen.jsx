import { useState, useMemo } from 'react'
import {
  ArrowLeft,
  BarChart3,
  Trophy,
  History,
  Clock,
  Layers,
  Sparkles,
  Award,
  ChevronRight,
  TrendingUp,
  Cloud,
} from 'lucide-react'
import { useGame } from '../context/GameContext'
import { GAME_META } from '../constants/games'
import { Avatar } from './ui/Avatar'
import { ThemeToggle } from './ui/ThemeToggle'
import { PlayerDetailSheet } from './PlayerDetailSheet'
import { TrophiesSheet } from './TrophiesSheet'
import { SyncModal } from './SyncModal'
import {
  computeStats,
  sortPlayers,
  formatStatDuration
} from '../utils/statsUtils'

export function StatsScreen() {
  const { games, players: registeredPlayers, setScreen, reloadStorage } = useGame()
  const [selectedGameType, setSelectedGameType] = useState('all') // 'all' | gameId
  const [sortBy, setSortBy] = useState('winRate') // 'winRate' (défaut) | 'wins' | 'games'
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [showTrophies, setShowTrophies] = useState(false)
  const [showSyncModal, setShowSyncModal] = useState(false)

  // Calcul des statistiques
  const stats = useMemo(() => {
    return computeStats(games, selectedGameType, registeredPlayers)
  }, [games, selectedGameType, registeredPlayers])

  // Tri des joueurs
  const sortedPlayers = useMemo(() => {
    return sortPlayers(stats.playersStats, sortBy)
  }, [stats.playersStats, sortBy])

  // Onglets disponibles
  const tabs = useMemo(() => {
    const list = [
      { id: 'all', label: 'Tous les jeux', count: games.length },
    ]
    Object.entries(GAME_META).forEach(([id, meta]) => {
      const count = games.filter(g => g.type === id).length
      list.push({ id, label: meta.name.split(' (')[0], count })
    })
    return list
  }, [games])

  const { kpis, titles, gamesDistribution } = stats

  const honorsList = useMemo(() => {
    const list = []
    if (titles.bestStrategist && titles.bestStrategist.winRate > 0) {
      list.push({
        id: 'strategist',
        player: titles.bestStrategist,
        label: 'Meilleur stratège',
        sub: `${titles.bestStrategist.winRate}% victoires`,
        cardStyle: 'border-amber-200/90 dark:border-amber-900/40 bg-amber-50/70 dark:bg-amber-950/20',
        labelStyle: 'text-amber-700 dark:text-amber-300',
        subStyle: 'text-amber-800/80 dark:text-amber-400/80',
      })
    }
    if (titles.mostActive && titles.mostActive.totalGames >= 2) {
      list.push({
        id: 'active',
        player: titles.mostActive,
        label: 'Fidèle au poste',
        sub: `${titles.mostActive.totalGames} parties`,
        cardStyle: 'border-blue-200/90 dark:border-blue-900/40 bg-blue-50/70 dark:bg-blue-950/20',
        labelStyle: 'text-blue-700 dark:text-blue-300',
        subStyle: 'text-blue-800/80 dark:text-blue-400/80',
      })
    }
    if (titles.grandDourak && titles.grandDourak.dourakLosses > 0) {
      list.push({
        id: 'dourak',
        player: titles.grandDourak,
        label: 'Grand Dourak',
        sub: `${titles.grandDourak.dourakLosses} revers`,
        cardStyle: 'border-rose-200/90 dark:border-rose-900/40 bg-rose-50/70 dark:bg-rose-950/20',
        labelStyle: 'text-rose-700 dark:text-rose-300',
        subStyle: 'text-rose-800/80 dark:text-rose-400/80',
      })
    }
    if (titles.podiumKing && titles.podiumKing.podiums >= 2 && titles.podiumKing.name !== titles.bestStrategist?.name) {
      list.push({
        id: 'podium',
        player: titles.podiumKing,
        label: 'Roi du podium',
        sub: `${titles.podiumKing.podiums} Top 3`,
        cardStyle: 'border-emerald-200/90 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-950/20',
        labelStyle: 'text-emerald-700 dark:text-emerald-300',
        subStyle: 'text-emerald-800/80 dark:text-emerald-400/80',
      })
    }
    return list
  }, [titles])

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden school-surface select-none">
      {/* Header avec espacement mobile sécurisé */}
      <header className="flex items-center gap-2 px-4 header-safe pb-3 flex-shrink-0 border-b border-stone-200/90 dark:border-slate-800/90 bg-[#faf9f5]/90 dark:bg-[#151719]/90 backdrop-blur-xs">
        <button
          type="button"
          onClick={() => setScreen('history')}
          className="p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Retour aux archives"
        >
          <ArrowLeft size={18} className="text-stone-700 dark:text-slate-300" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-serif-title font-bold text-lg leading-tight truncate">
            Statistiques
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setShowSyncModal(true)}
          className="p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
          title="Sauvegarder & Partager mes statistiques"
          aria-label="Sauvegarde et synchronisation"
        >
          <Cloud size={18} className="text-stone-700 dark:text-slate-300" />
        </button>
        <button
          type="button"
          onClick={() => setShowTrophies(true)}
          className="p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
          title="Guide des trophées & distinctions"
          aria-label="Guide des trophées"
        >
          <Award size={18} className="text-stone-700 dark:text-slate-300" />
        </button>
        <ThemeToggle />
      </header>

      {/* Onglets horizontaux de filtre par jeu */}
      <div className="flex-shrink-0 px-4 py-2.5 border-b border-stone-200/60 dark:border-slate-800/60 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-2">
          {tabs.map(tab => {
            const isActive = selectedGameType === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedGameType(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                  isActive
                    ? 'bg-[#1e3a5f] dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                    : 'bg-white/80 dark:bg-slate-900/80 text-stone-600 dark:text-slate-300 border border-stone-200 dark:border-slate-800 hover:bg-stone-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900'
                        : 'bg-stone-200/80 dark:bg-slate-800 text-stone-500 dark:text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Contenu principal défilant */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-3.5 pb-8 scroll-bottom-space space-y-4">
        {games.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-6">
            <div className="w-14 h-14 rounded-2xl school-card flex items-center justify-center mb-3">
              <BarChart3 size={24} className="text-stone-400 dark:text-slate-500" />
            </div>
            <p className="font-serif-title font-bold text-base mb-1">
              Aucune statistique disponible
            </p>
            <p className="text-stone-500 dark:text-slate-400 text-xs max-w-xs">
              Lancez et enregistrez vos premières parties depuis l'accueil pour découvrir les classements, taux de réussite et analyses détaillées.
            </p>
          </div>
        ) : (
          <>
            {/* Grille des 4 KPIs clés */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Carte 1 : Parties */}
              <div className="p-3 rounded-2xl school-card flex flex-col justify-between">
                <div className="flex items-center justify-between text-stone-500 dark:text-slate-400 mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Parties
                  </span>
                  <History size={16} className="text-[#1e3a5f] dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-serif-title font-bold text-2xl text-stone-900 dark:text-slate-100">
                    {kpis.totalGamesCount}
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5 truncate">
                    {kpis.finishedGamesCount} terminée{kpis.finishedGamesCount > 1 ? 's' : ''}
                    {kpis.activeGamesCount > 0 ? ` · ${kpis.activeGamesCount} en cours` : ''}
                  </p>
                </div>
              </div>

              {/* Carte 2 : Temps de jeu */}
              <div className="p-3 rounded-2xl school-card flex flex-col justify-between">
                <div className="flex items-center justify-between text-stone-500 dark:text-slate-400 mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Temps de jeu
                  </span>
                  <Clock size={16} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-serif-title font-bold text-2xl text-stone-900 dark:text-slate-100">
                    {formatStatDuration(kpis.totalPlayTimeMs)}
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5">
                    Cumul enregistré
                  </p>
                </div>
              </div>

              {/* Carte 3 : Manches */}
              <div className="p-3 rounded-2xl school-card flex flex-col justify-between">
                <div className="flex items-center justify-between text-stone-500 dark:text-slate-400 mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Manches
                  </span>
                  <Layers size={16} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-serif-title font-bold text-2xl text-stone-900 dark:text-slate-100">
                    {kpis.totalRounds}
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5">
                    Manches disputées
                  </p>
                </div>
              </div>

              {/* Carte 4 : Jeu favori */}
              <div className="p-3 rounded-2xl school-card flex flex-col justify-between">
                <div className="flex items-center justify-between text-stone-500 dark:text-slate-400 mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    {selectedGameType === 'all' ? 'Jeu favori' : 'Discipline'}
                  </span>
                  <Sparkles size={16} className="text-[#c83b3b]" />
                </div>
                <div>
                  <p className="font-serif-title font-bold text-lg text-stone-900 dark:text-slate-100 truncate">
                    {selectedGameType === 'all'
                      ? kpis.favoriteGame?.name || '—'
                      : GAME_META[selectedGameType]?.name || '—'}
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5 truncate">
                    {selectedGameType === 'all'
                      ? kpis.favoriteGame
                        ? `${kpis.favoriteGame.percent}% du volume total`
                        : 'Aucune partie'
                      : `${kpis.totalGamesCount} partie${kpis.totalGamesCount > 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Bannière de Synchronisation & Sauvegarde des Statistiques */}
            <div className="p-3 rounded-2xl border border-stone-200/90 dark:border-slate-800/90 bg-white/70 dark:bg-slate-900/60 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#c83b3b]/10 dark:bg-[#FFC107]/10 flex items-center justify-center flex-shrink-0 text-[#c83b3b] dark:text-[#FFC107]">
                  <Cloud size={16} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-stone-800 dark:text-slate-200 truncate">
                    Sauvegarder & Partager mes stats
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate">
                    Synchronisez vos données sur votre PC ou un autre téléphone
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSyncModal(true)}
                className="px-3 py-1.5 rounded-xl bg-[#c83b3b] hover:bg-[#b91c1c] text-white dark:bg-[#FFC107] dark:hover:bg-[#ffcd38] dark:text-stone-900 font-bold text-xs flex-shrink-0 transition-colors cursor-pointer shadow-2xs"
              >
                Gérer
              </button>
            </div>

            {/* Distinctions / Panthéon (si des titres sont attribués) */}
            {honorsList.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 px-0.5">
                  <Award size={15} className="text-amber-600 dark:text-amber-400" />
                  <h3 className="font-serif-title font-bold text-sm text-stone-800 dark:text-slate-200">
                    Honneurs de la table
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {honorsList.map((honor, index) => {
                    const isOddLast = honorsList.length % 2 !== 0 && index === honorsList.length - 1
                    return (
                      <div
                        key={honor.id}
                        onClick={() => setSelectedPlayer(honor.player)}
                        className={`p-2.5 rounded-xl border ${honor.cardStyle} flex items-center gap-2.5 cursor-pointer active:scale-[0.98] transition-transform ${
                          isOddLast ? 'col-span-2' : ''
                        }`}
                      >
                        <Avatar player={honor.player} size="sm" />
                        <div className="min-w-0 flex-1">
                          <span className={`block text-[10px] font-bold ${honor.labelStyle} uppercase tracking-wider`}>
                            {honor.label}
                          </span>
                          <p className="font-semibold text-xs text-stone-900 dark:text-slate-100 truncate">
                            {honor.player.name}
                          </p>
                          <span className={`text-[10px] ${honor.subStyle}`}>
                            {honor.sub}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Section Classement des Joueurs */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Trophy size={16} className="text-[#c83b3b] flex-shrink-0" />
                  <h3 className="font-serif-title font-bold text-base text-stone-900 dark:text-slate-100 whitespace-nowrap">
                    Classement des joueurs
                  </h3>
                </div>
                {sortedPlayers.length > 0 && (
                  <span className="text-xs text-stone-500 dark:text-slate-400 font-medium flex-shrink-0">
                    {sortedPlayers.length} joueur{sortedPlayers.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Filtres de tri en bandeau 3 colonnes responsive */}
              <div className="grid grid-cols-3 bg-stone-200/70 dark:bg-slate-800/80 p-0.5 rounded-xl text-xs font-semibold text-center">
                <button
                  type="button"
                  onClick={() => setSortBy('winRate')}
                  className={`py-1.5 px-1 rounded-lg transition-all whitespace-nowrap text-[11px] sm:text-xs ${
                    sortBy === 'winRate'
                      ? 'bg-white dark:bg-slate-700 text-stone-900 dark:text-slate-100 shadow-xs font-bold'
                      : 'text-stone-600 dark:text-slate-400 hover:text-stone-900'
                  }`}
                >
                  Taux (%)
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('wins')}
                  className={`py-1.5 px-1 rounded-lg transition-all whitespace-nowrap text-[11px] sm:text-xs ${
                    sortBy === 'wins'
                      ? 'bg-white dark:bg-slate-700 text-stone-900 dark:text-slate-100 shadow-xs font-bold'
                      : 'text-stone-600 dark:text-slate-400 hover:text-stone-900'
                  }`}
                >
                  Victoires
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('games')}
                  className={`py-1.5 px-1 rounded-lg transition-all whitespace-nowrap text-[11px] sm:text-xs ${
                    sortBy === 'games'
                      ? 'bg-white dark:bg-slate-700 text-stone-900 dark:text-slate-100 shadow-xs font-bold'
                      : 'text-stone-600 dark:text-slate-400 hover:text-stone-900'
                  }`}
                >
                  Parties
                </button>
              </div>

              {sortedPlayers.length === 0 ? (
                <div className="p-4 rounded-xl school-card text-center text-xs text-stone-500 dark:text-slate-400">
                  Aucun joueur n'a encore enregistré de score pour ce filtre.
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedPlayers.map((player, index) => {
                    const rank = index + 1
                    const isTop1 = rank === 1
                    const isTop2 = rank === 2
                    const isTop3 = rank === 3

                    const rankBadgeColor = isTop1
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300/80 dark:border-amber-800'
                      : isTop2
                      ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                      : isTop3
                      ? 'bg-amber-700/10 text-amber-900 dark:bg-amber-900/30 dark:text-amber-400 border-amber-600/30'
                      : 'bg-stone-100 text-stone-600 dark:bg-slate-800/50 dark:text-slate-400 border-stone-200 dark:border-slate-800'

                    return (
                      <div
                        key={player.name}
                        onClick={() => setSelectedPlayer(player)}
                        className="p-3 rounded-2xl school-card flex items-center gap-3 cursor-pointer active:scale-[0.99] transition-all hover:border-stone-300 dark:hover:border-slate-700"
                      >
                        {/* Numéro de classement */}
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs border flex-shrink-0 ${rankBadgeColor}`}
                        >
                          {rank}
                        </div>

                        {/* Avatar */}
                        <Avatar player={player} size="sm" />

                        {/* Nom et barre de progression */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-serif-title font-bold text-sm text-stone-900 dark:text-slate-100 truncate">
                              {player.name}
                            </span>
                            <span className="font-semibold text-xs text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                              {player.winRate}% victoires
                            </span>
                          </div>

                          {/* Barre de taux de victoire */}
                          <div className="w-full bg-stone-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 dark:bg-emerald-400 h-full rounded-full transition-all duration-300"
                              style={{ width: `${player.winRate}%` }}
                            />
                          </div>

                          {/* Sous-titre détails */}
                          <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-slate-400 mt-1.5">
                            <span>
                              {player.wins} vict. / {player.finishedGames} terminée{player.finishedGames > 1 ? 's' : ''}
                            </span>
                            <span>
                              {player.podiums} podium{player.podiums > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>

                        <ChevronRight
                          size={16}
                          className="text-stone-300 dark:text-slate-600 flex-shrink-0"
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Répartition des jeux (uniquement visible sur l'onglet Tous les jeux) */}
            {selectedGameType === 'all' && gamesDistribution.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-1.5 px-0.5">
                  <TrendingUp size={16} className="text-stone-700 dark:text-slate-300" />
                  <h3 className="font-serif-title font-bold text-base text-stone-900 dark:text-slate-100">
                    Répartition par jeu
                  </h3>
                </div>

                <div className="p-3.5 rounded-2xl school-card space-y-3">
                  {gamesDistribution.map(item => {
                    if (item.count === 0) return null
                    return (
                      <div key={item.type} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-semibold text-stone-800 dark:text-slate-200 truncate">
                              {item.name}
                            </span>
                            {item.categoryBadge && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400 flex-shrink-0">
                                {item.categoryBadge}
                              </span>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0 text-stone-600 dark:text-slate-400">
                            <span className="font-bold text-stone-900 dark:text-slate-100">
                              {item.count}
                            </span>
                            <span className="text-[10px] ml-1 text-stone-400">
                              ({item.percent}%)
                            </span>
                          </div>
                        </div>

                        {/* Barre de proportion relative */}
                        <div className="w-full bg-stone-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-[#1e3a5f] dark:bg-blue-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${item.percent}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Fiche détaillée au clic sur un joueur */}
      <PlayerDetailSheet
        player={selectedPlayer}
        open={Boolean(selectedPlayer)}
        onClose={() => setSelectedPlayer(null)}
      />

      {/* Guide complet des trophées & distinctions */}
      <TrophiesSheet
        open={showTrophies}
        onClose={() => setShowTrophies(false)}
        playersStats={stats.playersStats}
      />

      {/* Modale Sauvegarde & Synchronisation */}
      <SyncModal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        onDataUpdated={reloadStorage}
      />
    </div>
  )
}
