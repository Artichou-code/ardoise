import { useState, useMemo, useRef, useEffect } from 'react'
import {
  ArrowLeft,
  BarChart3,
  Trophy,
  Dices,
  Clock,
  Layers,
  Heart,
  Award,
  ChevronRight,
  TrendingUp,
  Cloud,
  Search,
  X,
} from 'lucide-react'
import { useGame } from '../context/GameContext'
import { GAME_META } from '../constants/games'
import { Avatar } from './ui/Avatar'
import { ThemeToggle } from './ui/ThemeToggle'
import { PlayerDetailSheet } from './PlayerDetailSheet'
import { TrophiesSheet } from './TrophiesSheet'
import { SyncModal } from './SyncModal'
import { BurgerMenuButton } from './BurgerMenu'
import {
  computeStats,
  sortPlayers,
  formatStatDuration
} from '../utils/statsUtils'
import { computePlayDuration } from '../utils/gameUtils'

export function StatsScreen() {
  const { games, players: registeredPlayers, setScreen, reloadStorage } = useGame()
  const [selectedGameType, setSelectedGameType] = useState('all') // 'all' | gameId
  const [sortBy, setSortBy] = useState('winRate') // 'winRate' (défaut) | 'wins' | 'games'
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [showTrophies, setShowTrophies] = useState(false)
  const [showSyncModal, setShowSyncModal] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef(null)

  const tabsContainerRef = useRef(null)
  const tabButtonRefs = useRef({})

  const normalizedQuery = useMemo(() => {
    return searchQuery.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  }, [searchQuery])

  // Centrage fluide de l'onglet actif dans la barre horizontale
  const scrollToTab = (buttonEl) => {
    if (!buttonEl || !tabsContainerRef.current) return
    const container = tabsContainerRef.current
    const containerRect = container.getBoundingClientRect()
    const elRect = buttonEl.getBoundingClientRect()
    const elOffsetLeft = elRect.left - containerRect.left + container.scrollLeft
    const targetScrollLeft = elOffsetLeft - (container.clientWidth / 2) + (elRect.width / 2)
    container.scrollTo({
      left: Math.max(0, targetScrollLeft),
      behavior: 'smooth',
    })
  }

  const handleSelectTab = (tabId, buttonEl) => {
    setSelectedGameType(tabId)
    scrollToTab(buttonEl)
  }

  // Centrage automatique lors de la sélection
  useEffect(() => {
    const buttonEl = tabButtonRefs.current[selectedGameType]
    if (buttonEl) {
      const timer = setTimeout(() => scrollToTab(buttonEl), 60)
      return () => clearTimeout(timer)
    }
  }, [selectedGameType])

  // Calcul des statistiques
  const stats = useMemo(() => {
    return computeStats(games, selectedGameType, registeredPlayers)
  }, [games, selectedGameType, registeredPlayers])

  // Tri des joueurs
  const sortedPlayers = useMemo(() => {
    return sortPlayers(stats.playersStats, sortBy)
  }, [stats.playersStats, sortBy])

  // Joueurs filtrés selon la recherche
  const displayedPlayers = useMemo(() => {
    if (!normalizedQuery) return sortedPlayers
    return sortedPlayers.filter(p => {
      const pNameNorm = (p.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      return pNameNorm.includes(normalizedQuery)
    })
  }, [sortedPlayers, normalizedQuery])

  // Onglets disponibles triés par nombre de parties jouées, puis par temps de jeu en cas d'égalité
  const tabs = useMemo(() => {
    // 1. Calcul des statistiques par type de jeu
    const gameStats = {}
    Object.keys(GAME_META).forEach(id => {
      gameStats[id] = { count: 0, durationMs: 0 }
    })
    games.forEach(g => {
      if (!g) return
      const type = g.type || 'universel'
      if (!gameStats[type]) {
        gameStats[type] = { count: 0, durationMs: 0 }
      }
      gameStats[type].count += 1
      gameStats[type].durationMs += computePlayDuration(g)
    })

    const initialKeys = Object.keys(GAME_META)
    const initialIndex = initialKeys.reduce((acc, id, i) => {
      acc[id] = i
      return acc
    }, {})

    // 2. Trier les jeux : nb de parties décroissant, puis temps passé décroissant, puis ordre initial
    const sortedGameEntries = Object.entries(GAME_META).sort(([idA], [idB]) => {
      const statsA = gameStats[idA] || { count: 0, durationMs: 0 }
      const statsB = gameStats[idB] || { count: 0, durationMs: 0 }

      if (statsB.count !== statsA.count) {
        return statsB.count - statsA.count
      }
      if (statsB.durationMs !== statsA.durationMs) {
        return statsB.durationMs - statsA.durationMs
      }
      return (initialIndex[idA] ?? 999) - (initialIndex[idB] ?? 999)
    })

    const list = [
      { id: 'all', label: 'Tous les jeux', count: games.length },
    ]
    sortedGameEntries.forEach(([id, meta]) => {
      const count = gameStats[id]?.count || 0
      list.push({ id, label: meta.name.split(' (')[0], count })
    })
    return list
  }, [games])

  // Onglets filtrés selon la recherche
  const filteredTabs = useMemo(() => {
    if (!normalizedQuery) return tabs
    return tabs.filter(tab => {
      if (tab.id === 'all') return true
      const labelNorm = tab.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const meta = GAME_META[tab.id]
      const descNorm = (meta?.description || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const badgeNorm = (meta?.categoryBadge || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      return (
        labelNorm.includes(normalizedQuery) ||
        descNorm.includes(normalizedQuery) ||
        badgeNorm.includes(normalizedQuery) ||
        tab.id.toLowerCase().includes(normalizedQuery)
      )
    })
  }, [tabs, normalizedQuery])

  const hasMatch = useMemo(() => {
    if (!normalizedQuery) return false
    const matchGame = filteredTabs.some(t => t.id !== 'all')
    const matchPlayer = displayedPlayers.length > 0
    return matchGame || matchPlayer
  }, [normalizedQuery, filteredTabs, displayedPlayers])

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
        {isSearchOpen ? (
          <>
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(false)
                setSearchQuery('')
              }}
              className="p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              aria-label="Fermer la recherche"
            >
              <ArrowLeft size={18} className="text-stone-700 dark:text-slate-300" />
            </button>
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border shadow-2xs transition-all flex-1 min-w-0 ${
                searchQuery.trim().length > 0 && hasMatch
                  ? 'border-emerald-500/70 dark:border-emerald-500/70 ring-2 ring-emerald-500/15'
                  : 'border-[#c83b3b]/70 dark:border-[#c83b3b]/70 ring-2 ring-[#c83b3b]/15'
              }`}
            >
              <Search
                size={15}
                className={`transition-colors shrink-0 ${
                  searchQuery.trim().length > 0 && hasMatch
                    ? 'text-emerald-500'
                    : 'text-[#c83b3b]'
                }`}
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un jeu ou joueur..."
                className="w-full bg-transparent text-xs sm:text-sm font-medium text-stone-900 dark:text-slate-100 placeholder-stone-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-0.5 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer shrink-0"
                  aria-label="Effacer le texte"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setScreen('home')}
              className="p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Retour à l'accueil"
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
              className="p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Sauvegarde & Synchronisation"
              aria-label="Sauvegarde & Synchronisation"
            >
              <Cloud size={18} className="text-stone-700 dark:text-slate-300" />
            </button>
            <button
              type="button"
              onClick={() => setScreen('trophies')}
              className="p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Guide des trophées & distinctions"
              aria-label="Guide des trophées"
            >
              <Award size={18} className="text-stone-700 dark:text-slate-300" />
            </button>
            <BurgerMenuButton />
          </>
        )}
      </header>

      {/* Onglets horizontaux de filtre par jeu avec centrage fluide au clic */}
      <div
        ref={tabsContainerRef}
        className="flex-shrink-0 px-4 py-2.5 border-b border-stone-200/60 dark:border-slate-800/60 overflow-x-auto scrollbar-hide scroll-smooth"
      >
        <div className="flex items-center gap-2 pr-[50vw]">
          {!isSearchOpen && (
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(true)
                setTimeout(() => searchInputRef.current?.focus(), 50)
              }}
              className="flex items-center justify-center w-7 h-7 rounded-full bg-white/80 dark:bg-slate-900/80 border border-stone-200 dark:border-slate-800 hover:border-[#c83b3b] text-[#c83b3b] transition-colors flex-shrink-0 cursor-pointer shadow-2xs"
              title="Rechercher un jeu ou joueur"
              aria-label="Rechercher"
            >
              <Search size={13} />
            </button>
          )}

          {filteredTabs.map(tab => {
            const isActive = selectedGameType === tab.id
            return (
              <button
                key={tab.id}
                ref={el => {
                  if (el) tabButtonRefs.current[tab.id] = el
                }}
                type="button"
                onClick={(e) => handleSelectTab(tab.id, e.currentTarget)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#c83b3b] text-white shadow-xs'
                    : 'bg-white/80 dark:bg-slate-900/80 text-stone-600 dark:text-slate-300 border border-stone-200 dark:border-slate-800 hover:bg-stone-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-white/25 text-white'
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
              <div className="p-3 rounded-2xl school-card flex flex-col justify-between min-h-[102px]">
                <div className="flex items-center justify-between text-stone-500 dark:text-slate-400 mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Parties
                  </span>
                  <Dices size={16} className="text-[#c83b3b]" />
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
              <div className="p-3 rounded-2xl school-card flex flex-col justify-between min-h-[102px]">
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
              <div className="p-3 rounded-2xl school-card flex flex-col justify-between min-h-[102px]">
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

              {/* Carte 4 : Jeu favori / Discipline */}
              <div className="p-3 rounded-2xl school-card flex flex-col justify-between min-h-[102px]">
                <div className="flex items-center justify-between text-stone-500 dark:text-slate-400 mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    {selectedGameType === 'all' ? 'Jeu favori' : 'Discipline'}
                  </span>
                  <Heart size={16} className="text-[#c83b3b]" />
                </div>
                <div className="min-w-0">
                  <p className="font-serif-title font-bold text-sm sm:text-base leading-tight text-stone-900 dark:text-slate-100 line-clamp-2">
                    {selectedGameType === 'all'
                      ? kpis.favoriteGame?.name || '—'
                      : GAME_META[selectedGameType]?.name.split(' (')[0] || '—'}
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-1 truncate">
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
                          <span className={`block text-[9px] font-bold ${honor.labelStyle} uppercase tracking-wider`}>
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
                {displayedPlayers.length > 0 && (
                  <span className="text-xs text-stone-500 dark:text-slate-400 font-medium flex-shrink-0">
                    {displayedPlayers.length} joueur{displayedPlayers.length > 1 ? 's' : ''}
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

              {displayedPlayers.length === 0 ? (
                <div className="p-4 rounded-xl school-card text-center text-xs text-stone-500 dark:text-slate-400">
                  {normalizedQuery
                    ? `Aucun joueur trouvé pour « ${searchQuery} »`
                    : "Aucun joueur n'a encore enregistré de score pour ce filtre."}
                </div>
              ) : (
                <div className="space-y-2">
                  {displayedPlayers.map((player, index) => {
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
                            className="bg-[#c83b3b] h-full rounded-full transition-all duration-300"
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
