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
  Swords,
} from 'lucide-react'
import { useGame } from '../context/GameContext'
import { GAME_META } from '../constants/games'
import { Avatar } from './ui/Avatar'
import { ThemeToggle } from './ui/ThemeToggle'
import { BottomSheet } from './ui/BottomSheet'
import {
  computeStats,
  sortPlayers,
  formatStatDuration
} from '../utils/statsUtils'

/**
 * Fiche détaillée d'un joueur affichée dans un BottomSheet
 */
function PlayerDetailSheet({ player, open, onClose }) {
  if (!player) return null

  const gamesPlayedEntries = Object.entries(player.gameBreakdown || {}).filter(
    ([, data]) => data.played > 0
  )

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      position="bottom"
      title={player.name}
      subtitle="Statistiques individuelles"
    >
      <div className="px-4 py-3 space-y-4">
        {/* En-tête profil */}
        <div className="flex items-center gap-3.5 p-3 rounded-2xl school-card">
          <Avatar player={player} size="lg" />
          <div className="flex-1 min-w-0">
            <h3 className="font-serif-title font-bold text-lg text-stone-900 dark:text-slate-100 truncate">
              {player.name}
            </h3>
            {player.badges && player.badges.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {player.badges.map(b => (
                  <span
                    key={b.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60"
                  >
                    <Award size={12} />
                    {b.title}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-500 dark:text-slate-400">
                {player.finishedGames} partie{player.finishedGames > 1 ? 's' : ''} terminée{player.finishedGames > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {/* Indicateurs clés du joueur */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl school-card text-center">
            <p className="text-[11px] font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wider">
              Taux
            </p>
            <p className="font-serif-title font-bold text-xl text-emerald-600 dark:text-emerald-400 mt-0.5">
              {player.winRate}%
            </p>
            <p className="text-[10px] text-stone-400 dark:text-slate-500">
              de victoires
            </p>
          </div>

          <div className="p-3 rounded-xl school-card text-center">
            <p className="text-[11px] font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wider">
              Victoires
            </p>
            <p className="font-serif-title font-bold text-xl text-stone-900 dark:text-slate-100 mt-0.5">
              {player.wins}
            </p>
            <p className="text-[10px] text-stone-400 dark:text-slate-500">
              sur {player.finishedGames} p.
            </p>
          </div>

          <div className="p-3 rounded-xl school-card text-center">
            <p className="text-[11px] font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wider">
              Podiums
            </p>
            <p className="font-serif-title font-bold text-xl text-amber-600 dark:text-amber-400 mt-0.5">
              {player.podiums}
            </p>
            <p className="text-[10px] text-stone-400 dark:text-slate-500">
              Top 3
            </p>
          </div>
        </div>

        {/* Adversaire favori */}
        {player.topOpponent && (
          <div className="flex items-center justify-between p-3 rounded-xl school-card text-xs">
            <div className="flex items-center gap-2 text-stone-600 dark:text-slate-400">
              <Swords size={16} className="text-stone-500 dark:text-slate-400" />
              <span>Adversaire le plus fréquent :</span>
            </div>
            <span className="font-semibold text-stone-900 dark:text-slate-100">
              {player.topOpponent.name} ({player.topOpponent.count} duels)
            </span>
          </div>
        )}

        {/* Répartition par jeu */}
        <div>
          <h4 className="font-serif-title font-bold text-sm text-stone-900 dark:text-slate-100 mb-2">
            Performance par jeu
          </h4>
          {gamesPlayedEntries.length === 0 ? (
            <p className="text-xs text-stone-400 dark:text-slate-500 italic">
              Aucune partie terminée pour ce joueur.
            </p>
          ) : (
            <div className="space-y-2">
              {gamesPlayedEntries.map(([type, data]) => {
                const meta = GAME_META[type]
                const rate = data.played > 0 ? Math.round((data.wins / data.played) * 100) : 0
                return (
                  <div
                    key={type}
                    className="p-2.5 rounded-xl border border-stone-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-800 dark:text-slate-200 truncate">
                          {meta?.name || type}
                        </span>
                        {meta?.categoryBadge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400">
                            {meta.categoryBadge}
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-stone-100 dark:bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {data.wins}V
                      </span>
                      <span className="text-stone-400 dark:text-slate-500 mx-1">/</span>
                      <span className="text-stone-600 dark:text-slate-400">
                        {data.played}P
                      </span>
                      <span className="text-[11px] text-stone-400 dark:text-slate-500 ml-1.5">
                        ({rate}%)
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Historique récent */}
        <div>
          <h4 className="font-serif-title font-bold text-sm text-stone-900 dark:text-slate-100 mb-2">
            Historique récent
          </h4>
          {player.recentHistory && player.recentHistory.length > 0 ? (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {player.recentHistory.slice(0, 8).map((hist, idx) => (
                <div
                  key={`${hist.gameId}-${idx}`}
                  className="flex items-center justify-between p-2 rounded-lg bg-stone-50 dark:bg-slate-900/40 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[11px] ${
                        hist.isWinner
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                          : hist.rank <= 3
                          ? 'bg-stone-200 dark:bg-slate-800 text-stone-700 dark:text-slate-300'
                          : 'bg-stone-100 dark:bg-slate-800/50 text-stone-500 dark:text-slate-400'
                      }`}
                    >
                      {hist.rank === 1 ? '1er' : `${hist.rank}e`}
                    </span>
                    <span className="text-stone-700 dark:text-slate-300 truncate">
                      {hist.gameName}
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-400 dark:text-slate-500 flex-shrink-0">
                    {hist.isWinner ? 'Victoire' : `${hist.rank}/${hist.totalPlayers}`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-400 dark:text-slate-500 italic">
              Aucune manche enregistrée.
            </p>
          )}
        </div>
      </div>
    </BottomSheet>
  )
}

export function StatsScreen() {
  const { games, players: registeredPlayers, setScreen } = useGame()
  const [selectedGameType, setSelectedGameType] = useState('all') // 'all' | gameId
  const [sortBy, setSortBy] = useState('winRate') // 'winRate' (défaut) | 'wins' | 'games'
  const [selectedPlayer, setSelectedPlayer] = useState(null)

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

            {/* Distinctions / Panthéon (si des titres sont attribués) */}
            {(titles.bestStrategist || titles.mostActive || titles.grandDourak || titles.podiumKing) && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 px-0.5">
                  <Award size={15} className="text-amber-600 dark:text-amber-400" />
                  <h3 className="font-serif-title font-bold text-sm text-stone-800 dark:text-slate-200">
                    Honneurs de la table
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {titles.bestStrategist && (
                    <div
                      onClick={() => setSelectedPlayer(titles.bestStrategist)}
                      className="p-2.5 rounded-xl border border-amber-200/90 dark:border-amber-900/40 bg-amber-50/70 dark:bg-amber-950/20 flex items-center gap-2.5 cursor-pointer active:scale-[0.98] transition-transform"
                    >
                      <Avatar player={titles.bestStrategist} size="sm" />
                      <div className="min-w-0 flex-1">
                        <span className="block text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                          Meilleur stratège
                        </span>
                        <p className="font-semibold text-xs text-stone-900 dark:text-slate-100 truncate">
                          {titles.bestStrategist.name}
                        </p>
                        <span className="text-[10px] text-amber-800/80 dark:text-amber-400/80">
                          {titles.bestStrategist.winRate}% victoires
                        </span>
                      </div>
                    </div>
                  )}

                  {titles.mostActive && (
                    <div
                      onClick={() => setSelectedPlayer(titles.mostActive)}
                      className="p-2.5 rounded-xl border border-blue-200/90 dark:border-blue-900/40 bg-blue-50/70 dark:bg-blue-950/20 flex items-center gap-2.5 cursor-pointer active:scale-[0.98] transition-transform"
                    >
                      <Avatar player={titles.mostActive} size="sm" />
                      <div className="min-w-0 flex-1">
                        <span className="block text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                          Fidèle au poste
                        </span>
                        <p className="font-semibold text-xs text-stone-900 dark:text-slate-100 truncate">
                          {titles.mostActive.name}
                        </p>
                        <span className="text-[10px] text-blue-800/80 dark:text-blue-400/80">
                          {titles.mostActive.totalGames} parties
                        </span>
                      </div>
                    </div>
                  )}

                  {titles.grandDourak && (
                    <div
                      onClick={() => setSelectedPlayer(titles.grandDourak)}
                      className="p-2.5 rounded-xl border border-rose-200/90 dark:border-rose-900/40 bg-rose-50/70 dark:bg-rose-950/20 flex items-center gap-2.5 cursor-pointer active:scale-[0.98] transition-transform"
                    >
                      <Avatar player={titles.grandDourak} size="sm" />
                      <div className="min-w-0 flex-1">
                        <span className="block text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
                          Grand Dourak
                        </span>
                        <p className="font-semibold text-xs text-stone-900 dark:text-slate-100 truncate">
                          {titles.grandDourak.name}
                        </p>
                        <span className="text-[10px] text-rose-800/80 dark:text-rose-400/80">
                          {titles.grandDourak.dourakLosses} revers
                        </span>
                      </div>
                    </div>
                  )}

                  {titles.podiumKing && titles.podiumKing.name !== titles.bestStrategist?.name && (
                    <div
                      onClick={() => setSelectedPlayer(titles.podiumKing)}
                      className="p-2.5 rounded-xl border border-emerald-200/90 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-950/20 flex items-center gap-2.5 cursor-pointer active:scale-[0.98] transition-transform"
                    >
                      <Avatar player={titles.podiumKing} size="sm" />
                      <div className="min-w-0 flex-1">
                        <span className="block text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                          Roi du podium
                        </span>
                        <p className="font-semibold text-xs text-stone-900 dark:text-slate-100 truncate">
                          {titles.podiumKing.name}
                        </p>
                        <span className="text-[10px] text-emerald-800/80 dark:text-emerald-400/80">
                          {titles.podiumKing.podiums} Top 3
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Section Classement des Joueurs */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-1.5">
                  <Trophy size={16} className="text-[#c83b3b]" />
                  <h3 className="font-serif-title font-bold text-base text-stone-900 dark:text-slate-100">
                    Classement des joueurs
                  </h3>
                </div>

                {/* Filtres de tri */}
                <div className="flex items-center bg-stone-200/70 dark:bg-slate-800/80 p-0.5 rounded-lg text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setSortBy('winRate')}
                    className={`px-2 py-0.5 rounded-md transition-all ${
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
                    className={`px-2 py-0.5 rounded-md transition-all ${
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
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      sortBy === 'games'
                        ? 'bg-white dark:bg-slate-700 text-stone-900 dark:text-slate-100 shadow-xs font-bold'
                        : 'text-stone-600 dark:text-slate-400 hover:text-stone-900'
                    }`}
                  >
                    Parties
                  </button>
                </div>
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
    </div>
  )
}
