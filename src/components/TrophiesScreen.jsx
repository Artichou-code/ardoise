import { useState, useMemo, useRef } from 'react'
import {
  ArrowLeft,
  Lock,
  BarChart3,
  Trophy,
  Search,
  X,
  Layers,
  Crown,
  Zap,
} from 'lucide-react'
import { useGame } from '../context/GameContext'
import { GAME_META, GAMES } from '../constants/games'
import { Avatar } from './ui/Avatar'
import { TrophyIcon } from './ui/TrophyIcon'
import { PlayerDetailSheet } from './PlayerDetailSheet'
import { BurgerMenuButton } from './BurgerMenu'
import { computeStats, TROPHIES_CATALOG } from '../utils/statsUtils'

/**
 * Carte de trophée moderne, compacte et inspirée des succès de jeux
 */
function TrophyCard({ trophy, onSelectPlayer, showGameTag = false }) {
  const isHeld = Boolean(trophy.holder)

  const colorStyles = {
    gold: {
      emblem: isHeld
        ? 'bg-amber-100/90 text-amber-800 border border-amber-200/90 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 shadow-2xs'
        : 'bg-stone-100/90 dark:bg-slate-800/70 text-stone-400 dark:text-slate-500 border border-stone-200/60 dark:border-slate-700/60',
    },
    amber: {
      emblem: isHeld
        ? 'bg-amber-100/90 text-amber-800 border border-amber-200/90 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 shadow-2xs'
        : 'bg-stone-100/90 dark:bg-slate-800/70 text-stone-400 dark:text-slate-500 border border-stone-200/60 dark:border-slate-700/60',
    },
    blue: {
      emblem: isHeld
        ? 'bg-sky-100/90 text-sky-800 border border-sky-200/90 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60 shadow-2xs'
        : 'bg-stone-100/90 dark:bg-slate-800/70 text-stone-400 dark:text-slate-500 border border-stone-200/60 dark:border-slate-700/60',
    },
    emerald: {
      emblem: isHeld
        ? 'bg-emerald-100/90 text-emerald-800 border border-emerald-200/90 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 shadow-2xs'
        : 'bg-stone-100/90 dark:bg-slate-800/70 text-stone-400 dark:text-slate-500 border border-stone-200/60 dark:border-slate-700/60',
    },
    rose: {
      emblem: isHeld
        ? 'bg-rose-100/90 text-rose-800 border border-rose-200/90 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60 shadow-2xs'
        : 'bg-stone-100/90 dark:bg-slate-800/70 text-stone-400 dark:text-slate-500 border border-stone-200/60 dark:border-slate-700/60',
    },
    purple: {
      emblem: isHeld
        ? 'bg-purple-100/90 text-purple-800 border border-purple-200/90 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60 shadow-2xs'
        : 'bg-stone-100/90 dark:bg-slate-800/70 text-stone-400 dark:text-slate-500 border border-stone-200/60 dark:border-slate-700/60',
    },
  }[trophy.color || 'gold'] || {
    emblem: isHeld
      ? 'bg-amber-100/90 text-amber-800 border border-amber-200/90 shadow-2xs'
      : 'bg-stone-100 dark:bg-slate-800 text-stone-400',
  }

  return (
    <div
      className={`p-3 sm:p-3.5 rounded-2xl school-card transition-all flex flex-col justify-between gap-2.5 ${
        isHeld
          ? 'border-amber-300/70 dark:border-amber-700/60 bg-white/95 dark:bg-slate-900/95 shadow-2xs'
          : 'border-stone-200/70 dark:border-slate-800/70 bg-white/75 dark:bg-slate-900/65'
      }`}
    >
      {/* Partie haute : Icône à gauche, Titre & Condition d'obtention à droite */}
      <div className="flex items-start gap-3">
        {/* Médaillon d'icône */}
        <div className="relative shrink-0">
          <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all ${colorStyles.emblem}`}>
            <TrophyIcon name={trophy.iconName} size={19} />
          </div>
          {!isHeld && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-stone-200 dark:bg-slate-700 border border-white dark:border-slate-900 flex items-center justify-center text-stone-600 dark:text-slate-300">
              <Lock size={9} />
            </div>
          )}
        </div>

        {/* Détails du trophée : Titre & Condition d'obtention */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1.5 flex-wrap">
            <h4 className="font-serif-title font-bold text-sm text-stone-900 dark:text-slate-100">
              {trophy.title}
            </h4>
            {showGameTag && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 shrink-0">
                {trophy.category}
              </span>
            )}
          </div>

          {/* Condition d'obtention (texte objectif avec contraste élevé conforme Google WCAG) */}
          <p className="text-xs text-stone-700 dark:text-slate-200 leading-snug mt-1 font-medium">
            {trophy.condition}
          </p>
        </div>
      </div>

      {/* Séparation graphique en pointillés & Phrase d'ambiance en pleine largeur (utilise l'espace sous l'icône) */}
      {trophy.description && (
        <div className="pt-2 border-t border-dashed border-stone-200/90 dark:border-slate-800/90">
          <p className="text-[11.5px] text-stone-600 dark:text-slate-300 italic leading-snug">
            « {trophy.description} »
          </p>
        </div>
      )}

      {/* Pied de carte : Détenteur ou statut verrouillé */}
      <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-slate-800/80 text-xs">
        <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500 dark:text-slate-400">
          {isHeld ? 'Détenteur actuel' : 'Statut'}
        </span>

        {isHeld ? (
          <button
            type="button"
            onClick={() => onSelectPlayer(trophy.holder)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 hover:border-emerald-400 transition-all cursor-pointer"
          >
            <Avatar player={trophy.holder} size="xs" />
            <span className="font-bold text-xs text-stone-900 dark:text-slate-100">
              {trophy.holder.name}
            </span>
            {trophy.holderDesc && (
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                · {trophy.holderDesc}
              </span>
            )}
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-600 dark:text-slate-400">
            <Lock size={11} className="text-stone-500 dark:text-slate-400" />
            À conquérir
          </span>
        )}
      </div>
    </div>
  )
}

export function TrophiesScreen() {
  const { games, players: registeredPlayers, setScreen } = useGame()
  const [categoryFilter, setCategoryFilter] = useState('all') // 'all' | 'general' | 'games' | gameType
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'unlocked' | 'locked'
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef(null)

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

  const generalTrophies = useMemo(() => {
    return trophiesWithHolders.filter((t) => !t.gameType)
  }, [trophiesWithHolders])

  const gameTrophies = useMemo(() => {
    return trophiesWithHolders.filter((t) => Boolean(t.gameType))
  }, [trophiesWithHolders])

  // Liste ordonnée des jeux disponibles dans les trophées
  const availableGames = useMemo(() => {
    const gameMap = new Map()
    gameTrophies.forEach((t) => {
      if (!t.gameType) return
      if (!gameMap.has(t.gameType)) {
        const meta = GAME_META[t.gameType]
        gameMap.set(t.gameType, {
          type: t.gameType,
          name: meta?.name?.split(' (')[0] || t.category || t.gameType,
          categoryBadge: meta?.categoryBadge || null,
          total: 0,
          unlocked: 0,
        })
      }
      const g = gameMap.get(t.gameType)
      g.total += 1
      if (t.holder) g.unlocked += 1
    })
    return Array.from(gameMap.values())
  }, [gameTrophies])

  // Trophées appartenant à la catégorie actuellement sélectionnée
  const scopedCategoryTrophies = useMemo(() => {
    if (categoryFilter === 'general') {
      return trophiesWithHolders.filter((t) => !t.gameType)
    }
    if (categoryFilter === 'games') {
      return trophiesWithHolders.filter((t) => Boolean(t.gameType))
    }
    if (categoryFilter !== 'all') {
      return trophiesWithHolders.filter((t) => t.gameType === categoryFilter)
    }
    return trophiesWithHolders
  }, [trophiesWithHolders, categoryFilter])

  // Compteurs synchronisés avec la catégorie active (évite tout conflit de chiffres !)
  const scopedTotal = scopedCategoryTrophies.length
  const scopedUnlocked = useMemo(() => {
    return scopedCategoryTrophies.filter((t) => t.holder).length
  }, [scopedCategoryTrophies])
  const scopedLocked = scopedTotal - scopedUnlocked
  const scopedProgress = scopedTotal > 0 ? Math.round((scopedUnlocked / scopedTotal) * 100) : 0

  const queryNorm = searchQuery.trim().toLowerCase()

  // Filtrage combiné : catégorie sélectionnée + statut + recherche textuelle
  const displayedTrophies = useMemo(() => {
    let list = scopedCategoryTrophies

    if (statusFilter === 'unlocked') {
      list = list.filter((t) => Boolean(t.holder))
    } else if (statusFilter === 'locked') {
      list = list.filter((t) => !t.holder)
    }

    if (queryNorm) {
      list = list.filter((t) => {
        const titleMatch = t.title?.toLowerCase().includes(queryNorm)
        const catMatch = t.category?.toLowerCase().includes(queryNorm)
        const descMatch = t.description?.toLowerCase().includes(queryNorm)
        const condMatch = t.condition?.toLowerCase().includes(queryNorm)
        const holderMatch = t.holder?.name?.toLowerCase().includes(queryNorm)
        const holderDescMatch = t.holderDesc?.toLowerCase().includes(queryNorm)
        const gameName = t.gameType ? GAME_META[t.gameType]?.name?.toLowerCase() : ''
        const gameMatch = gameName?.includes(queryNorm)
        return (
          titleMatch ||
          catMatch ||
          descMatch ||
          condMatch ||
          holderMatch ||
          holderDescMatch ||
          gameMatch
        )
      })
    }

    return list
  }, [scopedCategoryTrophies, statusFilter, queryNorm])

  const hasMatch = displayedTrophies.length > 0

  // Regroupement par sections pour l'affichage ordonné
  const groupedSections = useMemo(() => {
    const isSingleGame =
      categoryFilter !== 'all' &&
      categoryFilter !== 'general' &&
      categoryFilter !== 'games'

    // Si recherche active ou si un jeu unique est sélectionné : afficher liste directe sans double groupement
    if (queryNorm || isSingleGame) {
      return null
    }

    if (categoryFilter === 'general') {
      const prestigeIds = new Set(['strategist', 'invincible', 'active', 'podium'])
      const prestigeList = displayedTrophies.filter((t) => prestigeIds.has(t.id))
      const exploitsList = displayedTrophies.filter((t) => !prestigeIds.has(t.id))

      const sections = []
      if (prestigeList.length > 0) {
        sections.push({
          id: 'prestige',
          title: 'Prestige & Régularité',
          icon: Crown,
          category: 'Méta-Jeu',
          trophies: prestigeList,
        })
      }
      if (exploitsList.length > 0) {
        sections.push({
          id: 'exploits',
          title: 'Exploits & Tournants de Table',
          icon: Zap,
          category: 'Ambiance',
          trophies: exploitsList,
        })
      }
      return sections
    }

    if (categoryFilter === 'games' || categoryFilter === 'all') {
      const sections = []

      // Si onglet 'Tous', inclure d'abord les généraux
      if (categoryFilter === 'all') {
        const genList = displayedTrophies.filter((t) => !t.gameType)
        if (genList.length > 0) {
          sections.push({
            id: 'general',
            title: 'Trophées Généraux de la table',
            icon: Trophy,
            category: 'Tous jeux',
            trophies: genList,
          })
        }
      }

      // Sections par jeu
      availableGames.forEach((g) => {
        const gList = displayedTrophies.filter((t) => t.gameType === g.type)
        if (gList.length > 0) {
          sections.push({
            id: g.type,
            title: g.name,
            category: g.categoryBadge,
            totalCount: g.total,
            unlockedCount: g.unlocked,
            trophies: gList,
          })
        }
      })

      return sections
    }

    return null
  }, [displayedTrophies, categoryFilter, queryNorm, availableGames])

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden school-surface select-none">
      {/* En-tête de page aligné sur Statistiques / Archives / Joueurs */}
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
                queryNorm.length > 0 && hasMatch
                  ? 'border-emerald-500/70 dark:border-emerald-500/70 ring-2 ring-emerald-500/15'
                  : 'border-[#c83b3b]/70 dark:border-[#c83b3b]/70 ring-2 ring-[#c83b3b]/15'
              }`}
            >
              <Search
                size={15}
                className={`transition-colors shrink-0 ${
                  queryNorm.length > 0 && hasMatch
                    ? 'text-emerald-500'
                    : 'text-[#c83b3b]'
                }`}
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un trophée, jeu, joueur..."
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
              className="p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Retour à l'accueil"
            >
              <ArrowLeft size={18} className="text-stone-700 dark:text-slate-300" />
            </button>

            <div className="flex-1 min-w-0">
              <h1 className="font-serif-title font-bold text-lg leading-tight truncate">
                Trophées
              </h1>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(true)
                setTimeout(() => searchInputRef.current?.focus(), 50)
              }}
              className="p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Rechercher un trophée"
              aria-label="Rechercher"
            >
              <Search size={18} className="text-stone-700 dark:text-slate-300" />
            </button>

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
          </>
        )}
      </header>

      {/* Barre de sélection de catégorie (1 seule ligne horizontale fluide et scrollable) */}
      <div className="flex-shrink-0 px-4 py-2 border-b border-stone-200/60 dark:border-slate-800/60 bg-[#faf9f5]/70 dark:bg-[#151719]/70 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-1.5 min-w-max">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              categoryFilter === 'all'
                ? 'bg-[#c83b3b] text-white shadow-2xs font-bold'
                : 'bg-white/80 dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-200'
            }`}
          >
            Tous ({TROPHIES_CATALOG.length})
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('general')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              categoryFilter === 'general'
                ? 'bg-[#c83b3b] text-white shadow-2xs font-bold'
                : 'bg-white/80 dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-200'
            }`}
          >
            Généraux ({generalTrophies.length})
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('games')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              categoryFilter === 'games'
                ? 'bg-[#c83b3b] text-white shadow-2xs font-bold'
                : 'bg-white/80 dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-200'
            }`}
          >
            Tous les jeux ({gameTrophies.length})
          </button>
          {availableGames.map((g) => {
            const isSelected = categoryFilter === g.type
            return (
              <button
                key={g.type}
                type="button"
                onClick={() => setCategoryFilter(g.type)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#c83b3b] text-white border-[#c83b3b] shadow-2xs font-bold'
                    : 'bg-white/80 dark:bg-slate-800/80 border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-300 hover:border-[#c83b3b]/60'
                }`}
              >
                <span>{g.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : g.unlocked > 0
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                      : 'bg-stone-100 dark:bg-slate-700 text-stone-500 dark:text-slate-400'
                  }`}
                >
                  {g.unlocked > 0 ? `${g.unlocked}/${g.total}` : g.total}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Corps défilant sur fond cahier / ardoise */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-3 pb-8 scroll-bottom-space space-y-3.5 w-full max-w-full overflow-x-hidden">
        {/* Carte récapitulative de progression synchronisée */}
        <div className="p-3.5 rounded-2xl school-card space-y-2.5 w-full min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="p-2 rounded-xl bg-[#c83b3b]/10 dark:bg-[#c83b3b]/20 text-[#c83b3b] shrink-0">
                <Trophy size={17} />
              </span>
              <div className="min-w-0">
                <p className="font-serif-title font-bold text-sm text-stone-900 dark:text-slate-100 leading-tight truncate">
                  {categoryFilter === 'all'
                    ? 'Distinctions de la table'
                    : categoryFilter === 'general'
                    ? 'Trophées Généraux de la table'
                    : categoryFilter === 'games'
                    ? 'Trophées par jeu'
                    : `Trophées — ${availableGames.find((g) => g.type === categoryFilter)?.name || 'Jeu'}`}
                </p>
                <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate">
                  {scopedUnlocked} sur {scopedTotal} trophée{scopedTotal > 1 ? 's' : ''} conquis
                </p>
              </div>
            </div>
            <span className="text-xs font-extrabold text-[#c83b3b] tabular-nums shrink-0">
              {scopedProgress}%
            </span>
          </div>

          <div className="w-full bg-stone-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#c83b3b] h-full rounded-full transition-all duration-300"
              style={{ width: `${scopedProgress}%` }}
            />
          </div>

          {/* Filtres de statut avec compteurs dynamiques & protection responsive (grille 3 colonnes anti-wrap) */}
          <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-stone-100 dark:border-slate-800/80 w-full min-w-0">
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
        </div>

        {/* Indicateur de recherche active */}
        {queryNorm && (
          <div className="flex items-center justify-between px-1 py-1 text-xs font-semibold text-stone-500 dark:text-slate-400">
            <span>
              {displayedTrophies.length} trophée{displayedTrophies.length > 1 ? 's' : ''} trouvé{displayedTrophies.length > 1 ? 's' : ''} pour « {searchQuery.trim()} »
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setIsSearchOpen(false)
              }}
              className="text-[#c83b3b] hover:underline cursor-pointer"
            >
              Effacer le filtre
            </button>
          </div>
        )}

        {/* État vide si aucun résultat */}
        {displayedTrophies.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl school-card space-y-2.5 my-3">
            <div className="p-3 rounded-full bg-stone-100 dark:bg-slate-800 text-stone-400">
              <Trophy size={28} />
            </div>
            <p className="font-serif-title font-bold text-sm text-stone-800 dark:text-slate-200">
              Aucun trophée trouvé
            </p>
            <p className="text-xs text-stone-500 dark:text-slate-400 max-w-xs">
              {queryNorm
                ? `Aucun trophée ne correspond à votre recherche « ${searchQuery.trim()} ».`
                : statusFilter === 'unlocked'
                ? 'Aucun trophée de cette catégorie n’a encore été débloqué.'
                : 'Tous les trophées de cette sélection ont déjà été conquis !'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
                setCategoryFilter('all')
                setIsSearchOpen(false)
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold btn-margin-red text-white cursor-pointer"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : groupedSections ? (
          /* Affichage structuré par sections thématiques / jeux */
          <div className="space-y-4">
            {groupedSections.map((section) => {
              const SectionIcon = section.icon || null
              return (
                <div key={section.id} className="space-y-2.5">
                  {/* En-tête de section avec badge de complétion */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2 min-w-0">
                      {SectionIcon ? (
                        <span className="p-1 rounded-lg bg-[#c83b3b]/10 text-[#c83b3b] shrink-0">
                          <SectionIcon size={14} />
                        </span>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-[#c83b3b] shrink-0" />
                      )}
                      <h3 className="font-serif-title font-bold text-sm text-stone-900 dark:text-slate-100 truncate">
                        {section.title}
                      </h3>
                      {section.category && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-200/70 dark:bg-slate-800 text-stone-600 dark:text-slate-400 shrink-0">
                          {section.category}
                        </span>
                      )}
                    </div>
                    {section.totalCount != null && (
                      <span className="text-[11px] font-semibold text-stone-400 dark:text-slate-500 shrink-0">
                        {section.unlockedCount}/{section.totalCount} conquis
                      </span>
                    )}
                  </div>

                  {/* Cartes de la section */}
                  <div className="space-y-2.5">
                    {section.trophies.map((trophy) => (
                      <TrophyCard
                        key={trophy.id}
                        trophy={trophy}
                        onSelectPlayer={setSelectedPlayer}
                        showGameTag={categoryFilter === 'all' || categoryFilter === 'games'}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Affichage direct en liste (si recherche ou jeu unique sélectionné) */
          <div className="space-y-2.5">
            {displayedTrophies.map((trophy) => (
              <TrophyCard
                key={trophy.id}
                trophy={trophy}
                onSelectPlayer={setSelectedPlayer}
                showGameTag={categoryFilter === 'all' || categoryFilter === 'games'}
              />
            ))}
          </div>
        )}
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
