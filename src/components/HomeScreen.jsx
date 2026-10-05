import { useState, useMemo, useEffect, useRef, lazy, Suspense } from 'react'
import { ChevronRight, BookOpen, Play, Bookmark, Trash2, Clock, Trophy, Scale, Radio, Share2, CheckCircle2, X, Dices, ChevronDown, Search } from 'lucide-react'
import { useGame } from '../context/GameContext'
import { GAME_META, GAMES, getGameDisplayName } from '../constants/games'
import { ThemeToggle } from './ui/ThemeToggle'
import { AppLogo } from './ui/AppLogo'
import { BurgerMenuButton } from './BurgerMenu'
import { ArtCreaLogo } from './ui/ArtCreaLogo'
import { formatDate, formatGameStart, getTeamGameData, getRanking } from '../utils/gameUtils'
import { Avatar } from './ui/Avatar'
import { formatTypography } from '../utils/typography'
import { getActiveSession } from '../store/liveSession'
import { RulesSheet } from './RulesSheet'
import { GameDetailSheet } from './GameDetailSheet'
import { GameSetupSheet } from './GameSetupSheet'
import { ShareGamesModal } from './ShareGamesModal'
import { ShareGameModal } from './ShareGameModal'
import { SyncModal } from './SyncModal'

import { LegalModal } from './LegalModal'
import { ArtCreaUniverseModal } from './ArtCreaUniverseModal'

const LiveSessionModal = lazy(() => import('./LiveSessionModal').then((m) => ({ default: m.LiveSessionModal })))

export function HomeScreen() {
  const { games, setScreen, resumeGame, customPresets, deletePreset, createGame, reloadStorage, liveSessionNotice, setLiveSessionNotice } = useGame()
  const [setupGame, setSetupGame] = useState(null)
  const [setupPreset, setSetupPreset] = useState(null)
  const [rulesGame, setRulesGame] = useState(null)
  const [detailGame, setDetailGame] = useState(null)
  const [legalTab, setLegalTab] = useState(null)
  const [isArtCreaModalOpen, setIsArtCreaModalOpen] = useState(false)
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false)
  const [isShareGamesModalOpen, setIsShareGamesModalOpen] = useState(false)
  const [liveSession, setLiveSession] = useState(() => getActiveSession())
  const [deckFilter, setDeckFilter] = useState(null) // null = tous, 'classic', 'dedicated'
  const [sharingPresetGame, setSharingPresetGame] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const searchInputRef = useRef(null)
  const [isPresetsCollapsed, setIsPresetsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('ardoise_presets_collapsed') === 'true'
    } catch {
      return false
    }
  })

  const togglePresetsCollapse = () => {
    setIsPresetsCollapsed(prev => {
      const next = !prev
      try {
        localStorage.setItem('ardoise_presets_collapsed', String(next))
      } catch {}
      return next
    })
  }

  const handleSharePreset = (preset, e) => {
    e.stopPropagation()
    const templateGame = {
      id: `template-${preset.id || Date.now()}`,
      name: preset.name,
      type: 'universel',
      status: 'template',
      config: {
        customGameName: preset.name,
        scoreDir: preset.scoreDir || 'high',
        targetScore: preset.scoreDir === 'low_limit' ? (preset.limit || 100) : 0,
        limit: preset.limit || 100,
        specialRule: preset.specialRule || { enabled: false },
        playersPreset: preset.players || []
      },
      players: (preset.players && preset.players.length > 0)
        ? preset.players.map((p, idx) => (typeof p === 'string' ? { id: `p${idx + 1}`, name: p } : { id: p.id || `p${idx + 1}`, name: p.name || `Joueur ${idx + 1}` }))
        : [
            { id: 'p1', name: 'Joueur 1' },
            { id: 'p2', name: 'Joueur 2' }
          ],
      rounds: [],
      dealerIdx: 0,
      startedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }
    setSharingPresetGame(templateGame)
  }

  useEffect(() => {
    const handleSessionChanged = (e) => {
      setLiveSession(e.detail)
    }
    window.addEventListener('ardoise-live-session-changed', handleSessionChanged)

    // Deep-linking SEO : si le visiteur arrive depuis Google/IA sur /jeux/<slug>, ouvre la fiche du jeu
    const pathMatch = window.location.pathname.match(/^\/jeux\/([a-z0-9-]+)\/?$/i)
    if (pathMatch) {
      const slug = pathMatch[1].toLowerCase()
      const slugToGameId = {
        caracole: 'caracole',
        dourak: 'dourak',
        skyjo: 'skyjo',
        belote: 'belote',
        tarot: 'tarot',
        president: 'president',
        '6-qui-prend': 'six_qui_prend',
        'dame-de-pique': 'dame_de_pique',
        'flip-7': 'flip_7',
        'sea-salt-paper': 'sea_salt_paper',
        ascenseur: 'ascenseur',
        rikiki: 'ascenseur',
        rami: 'rami',
        yaniv: 'yaniv',
        'le-yaniv': 'yaniv',
        barbu: 'barbu',
        'le-barbu': 'barbu',
        'compteur-universel': 'universel',
        uno: 'uno',
      }
      const targetGameId = slugToGameId[slug]
      if (targetGameId && GAME_META[targetGameId]) {
        setRulesGame(targetGameId)
      }
    }

    return () => {
      window.removeEventListener('ardoise-live-session-changed', handleSessionChanged)
    }
  }, [])

  const activeGames = games.filter(g => g.status === 'active')
  const finishedGames = games.filter(g => g.status === 'finished').slice(0, 3)

  // Nombre de fois où chaque jeu a été joué (parties en cours + terminées)
  const gamePlayCounts = useMemo(() => {
    const counts = {}
    games.forEach(g => {
      if (g.type) counts[g.type] = (counts[g.type] || 0) + 1
    })
    return counts
  }, [games])

  // Recherche textuelle normalisée
  const normalizedQuery = searchQuery.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  // Tri dynamique : les jeux les plus joués se placent automatiquement en premier
  const { sortedGames, isUniversalFallback, totalAvailableCount } = useMemo(() => {
    const list = Object.values(GAME_META)
    const totalAvailableCount = list.length
    const initialIndex = list.reduce((acc, m, i) => {
      acc[m.id] = i
      return acc
    }, {})

    const sorted = [...list].sort((a, b) => {
      const countA = gamePlayCounts[a.id] || 0
      const countB = gamePlayCounts[b.id] || 0
      if (countB !== countA) return countB - countA
      return initialIndex[a.id] - initialIndex[b.id]
    })

    const filteredByDeck = !deckFilter
      ? sorted
      : sorted.filter(m => m.deckType === deckFilter || m.deckType === 'any')

    if (normalizedQuery) {
      const matches = filteredByDeck.filter(m => {
        const nameNorm = (m.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        const descNorm = (m.description || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        const badgeNorm = (m.categoryBadge || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        const idNorm = (m.id || '').toLowerCase()

        // Synonymes et mots-clés courants
        const keywords = []
        if (m.id === 'belote') keywords.push('coinche', 'atout', 'belote-rebelote')
        if (m.id === 'president') keywords.push('trou du cul', 'tdc', 'president')
        if (m.id === 'ascenseur') keywords.push('rikiki', 'oh hell', 'plis')
        if (m.id === 'barbu') keywords.push('tonton', 'contrats', 'salade')
        if (m.id === 'yaniv') keywords.push('asaf', 'assaf')
        if (m.id === 'six_qui_prend') keywords.push('boeuf', 'taureau', '6', 'six')
        if (m.id === 'sea_salt_paper') keywords.push('origami', 'mer', 'sirene')
        if (m.id === 'dame_de_pique') keywords.push('coeur', 'reine', 'grand chelem')
        if (m.id === 'uno') keywords.push('+4', 'plus 4', 'joker', 'cartes')
        if (m.id === 'symbiose') keywords.push('subverti', 'mare', 'riviere', 'grenouille', 'societe', 'animaux')
        if (m.id === 'molkky') keywords.push('molkki', 'quille', 'quilles', 'plein air', 'bois', 'finlande', '50')
        if (m.id === 'yam') keywords.push('yahtzee', 'yams', 'des', 'combinaison', 'full', 'brelan', 'carre', 'suite')
        if (m.id === 'dixit') keywords.push('conteur', 'conte', 'carte', 'cartes', 'illustration', 'imagination', 'vote', 'bluff')
        if (m.id === 'universel') keywords.push('libre', 'autre', 'personnalise', 'scrabble', 'tarot')

        const matchesKeyword = keywords.some(k => k.includes(normalizedQuery))

        return nameNorm.includes(normalizedQuery) ||
               descNorm.includes(normalizedQuery) ||
               badgeNorm.includes(normalizedQuery) ||
               idNorm.includes(normalizedQuery) ||
               matchesKeyword
      })

      // Si aucun jeu spécifique trouvé : toujours montrer le Compteur Universel
      if (matches.length === 0) {
        const universalMeta = GAME_META[GAMES.UNIVERSEL]
        return {
          sortedGames: universalMeta ? [universalMeta] : [],
          isUniversalFallback: true,
          totalAvailableCount,
        }
      }

      return {
        sortedGames: matches,
        isUniversalFallback: false,
        totalAvailableCount,
      }
    }

    return {
      sortedGames: filteredByDeck,
      isUniversalFallback: false,
      totalAvailableCount,
    }
  }, [gamePlayCounts, deckFilter, normalizedQuery])

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden school-surface select-none">
      {/* Header style cahier d'écolier / ardoise */}
      <header className="flex items-center justify-between px-4 header-safe pb-3 flex-shrink-0 border-b border-stone-200/90 dark:border-slate-800/90 bg-[#faf9f5]/90 dark:bg-[#151719]/90 backdrop-blur-xs">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('ardoise-open-share-app'))}
            className="rounded-xl shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-transform focus:outline-none"
            title="QR code & lien de l'application Ardoise"
            aria-label="Partager l'application Ardoise par QR code ou lien"
          >
            <AppLogo className="w-8 h-8 shadow-2xs" />
          </button>
          <div>
            <h1 className="font-serif-title text-xl font-bold tracking-tight leading-none">
              Ardoise
            </h1>
            <p className="text-[11px] text-stone-500 dark:text-slate-400 leading-none mt-0.5">
              Carnet de scores & règles
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Si une table en direct est active, icône discrète cliquable (rond) */}
          {liveSession && (
            <button
              type="button"
              onClick={() => setIsLiveModalOpen(true)}
              className="w-8 h-8 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer shrink-0 flex items-center justify-center"
              title={`Table en direct : ${liveSession.name} (${liveSession.code}) — Afficher le QR code et le code`}
              aria-label="Table en direct"
            >
              <Radio size={15} className="animate-pulse" />
            </button>
          )}

          {/* Bascule de thème rapide */}
          <ThemeToggle />

          {/* Bouton Menu Burger */}
          <BurgerMenuButton />
        </div>
      </header>

      {/* Corps scrollable */}
      <main className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-3 scroll-bottom-space">
        {/* Notification de clôture de Table en direct */}
        {liveSessionNotice && (
          <div className="mb-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-start justify-between gap-2 text-xs">
            <div className="flex items-start gap-2">
              <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-stone-800 dark:text-slate-200 font-medium leading-snug">
                {liveSessionNotice}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setLiveSessionNotice(null)}
              className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 shrink-0 cursor-pointer"
            >
              <X size={13} />
            </button>
          </div>
        )}
        {/* Parties en cours */}
        {activeGames.length > 0 && (
          <section className="mt-4">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="w-1.5 h-3.5 rounded-full bg-[#c83b3b]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                Parties en cours
              </h2>
            </div>
            <div className="space-y-2">
              {activeGames.map(game => (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => resumeGame(game.id)}
                  className="w-full flex flex-col gap-2 p-3.5 rounded-xl bg-[#c83b3b]/[0.04] dark:bg-[#c83b3b]/[0.08] border border-[#c83b3b]/35 dark:border-[#c83b3b]/45 hover:border-[#c83b3b] transition-all active:scale-[0.99] text-left shadow-2xs group cursor-pointer"
                >
                  {/* Ligne supérieure pleine largeur : Titre et Pastille */}
                  <div className="flex items-center gap-2 min-w-0 w-full">
                    <p className="font-serif-title font-bold text-base leading-tight truncate">
                      {getGameDisplayName(game)}
                    </p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 whitespace-nowrap shrink-0">
                      Manche {game.rounds.length + 1}
                    </span>
                  </div>

                  {/* Ligne inférieure : Joueurs, heure de lancement & Bouton Reprendre légèrement plus bas */}
                  <div className="flex items-center justify-between gap-3 w-full">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-stone-500 dark:text-slate-400 truncate">
                        {(() => {
                          const td = getTeamGameData(game)
                          return td ? `${td.teams[0].label} vs ${td.teams[1].label}` : game.players.map(p => p.name).join(' · ')
                        })()}
                      </p>
                      {game.startedAt && (
                        <p className="text-[11px] text-stone-400 dark:text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                          <Clock size={11} className="opacity-70 shrink-0" />
                          <span className="truncate whitespace-nowrap">Lancée {formatGameStart(game.startedAt)}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-[#c83b3b] text-white shrink-0 group-hover:bg-[#b03030] transition-colors shadow-2xs">
                      <Play size={12} fill="currentColor" /> Reprendre
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}


        {/* Jeux personnalisés enregistrés */}
        {customPresets && customPresets.length > 0 && (
          <section className="mt-4">
            <button
              type="button"
              onClick={togglePresetsCollapse}
              className="w-full flex items-center justify-between mb-2.5 group cursor-pointer text-left select-none p-1 -m-1 rounded-lg hover:bg-stone-100/70 dark:hover:bg-slate-800/50 transition-colors"
              aria-expanded={!isPresetsCollapsed}
              title={isPresetsCollapsed ? 'Déplier mes jeux enregistrés' : 'Replier mes jeux enregistrés'}
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-3.5 rounded-full bg-amber-500" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 group-hover:text-stone-800 dark:group-hover:text-slate-200 transition-colors">
                  Mes jeux enregistrés
                </h2>
                <ChevronDown
                  size={14}
                  className={`text-stone-400 dark:text-slate-500 group-hover:text-amber-500 transition-transform duration-200 ${
                    isPresetsCollapsed ? '-rotate-90' : 'rotate-0'
                  }`}
                />
              </div>
              <span className="text-[11px] text-stone-400 dark:text-slate-500">
                {customPresets.length} modèle{customPresets.length > 1 ? 's' : ''}
              </span>
            </button>

            {!isPresetsCollapsed && (
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5 animate-in fade-in duration-200">
                {customPresets.map(preset => {
                  const isSpecial = preset.specialRule?.enabled
                  const ruleDesc = isSpecial
                    ? `Si ${preset.specialRule.target} pts → ${
                        preset.specialRule.action === 'divide'
                          ? `÷${preset.specialRule.value || 2}`
                          : preset.specialRule.action === 'multiply'
                          ? `×${preset.specialRule.value || 2}`
                          : `${preset.specialRule.value || 0} pts`
                      }`
                    : (preset.scoreDir === 'low_limit' ? `Seuil de ${preset.limit || 100} pts` : 'Score le plus élevé')

                  return (
                    <div
                      key={preset.id}
                      onClick={() => {
                        setSetupPreset(preset)
                        setSetupGame('universel')
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setSetupPreset(preset)
                          setSetupGame('universel')
                        }
                      }}
                      className="relative flex flex-col justify-between p-2.5 sm:p-3 rounded-xl school-card border-l-4 border-l-amber-500/80 hover:border-amber-500 dark:hover:border-amber-500/80 transition-all active:scale-[0.98] cursor-pointer shadow-2xs group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <Bookmark size={13} className="text-amber-500 shrink-0" />
                            <h3 className="font-serif-title font-bold text-sm sm:text-base leading-snug truncate">
                              {preset.name}
                            </h3>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0 -mr-1 -mt-0.5">
                            <button
                              type="button"
                              onClick={(e) => handleSharePreset(preset, e)}
                              className="p-1 rounded-lg text-stone-400 hover:text-amber-600 dark:text-slate-500 dark:hover:text-amber-400 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Partager ce jeu"
                            >
                              <Share2 size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                deletePreset(preset.id)
                              }}
                              className="p-1 rounded-lg text-stone-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Supprimer ce modèle"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate mt-0.5">
                          {ruleDesc}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-stone-100 dark:border-slate-800/60">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 truncate max-w-[85px]">
                          {preset.scoreDir === 'low_limit' ? `Seuil ${preset.limit || 100}` : 'Score max'}
                        </span>
                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5 shrink-0 group-hover:translate-x-0.5 transition-transform">
                          Lancer <ChevronRight size={13} />
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* Grille des jeux (Zéro émoji, style Cahier & Ardoise) */}
        <section className="mt-4">
          <div className="flex items-center justify-between mb-2.5 gap-2">
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-1.5 h-3.5 rounded-full bg-[#c83b3b]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-slate-300 whitespace-nowrap">
                Choisir un jeu
              </h2>
            </div>

            {/* Barre de recherche qui s'étire jusqu'au titre à gauche au clic */}
            <div className={`transition-all duration-200 ease-out flex items-center justify-end ${
              isSearchOpen || searchQuery ? 'flex-1 min-w-0' : 'shrink-0'
            }`}>
              {!isSearchOpen && !searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(true)
                    setTimeout(() => searchInputRef.current?.focus(), 50)
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-slate-800/90 hover:bg-stone-200/70 dark:hover:bg-slate-700/70 text-[11px] font-medium text-stone-700 dark:text-slate-200 border border-stone-200/90 dark:border-slate-700 transition-all cursor-pointer shadow-2xs group shrink-0"
                  aria-label="Rechercher un jeu"
                  title="Cliquer pour rechercher un jeu"
                >
                  <Search size={11} className="text-[#c83b3b] transition-colors shrink-0" />
                  <span>{totalAvailableCount} jeux disponibles</span>
                </button>
              ) : (
                <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-900 border shadow-2xs transition-all w-full animate-in fade-in duration-150 ${
                  searchQuery.trim().length > 0 && !isUniversalFallback
                    ? 'border-emerald-500/70 dark:border-emerald-500/70 ring-2 ring-emerald-500/15'
                    : 'border-[#c83b3b]/70 dark:border-[#c83b3b]/70 ring-2 ring-[#c83b3b]/15'
                }`}>
                  <Search
                    size={11}
                    className={`shrink-0 transition-colors ${
                      searchQuery.trim().length > 0 && !isUniversalFallback
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-[#c83b3b]'
                    }`}
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => {
                      if (!searchQuery.trim()) {
                        setIsSearchOpen(false)
                      }
                    }}
                    placeholder={`${totalAvailableCount} jeux disponibles`}
                    className="w-full bg-transparent text-[11px] font-medium text-stone-800 dark:text-slate-200 placeholder:text-stone-400 dark:placeholder:text-slate-500 outline-none min-w-0"
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setSearchQuery('')
                        setIsSearchOpen(false)
                      }
                    }}
                  />
                  {searchQuery ? (
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setSearchQuery('')
                        searchInputRef.current?.focus()
                      }}
                      className="p-0.5 text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 cursor-pointer shrink-0"
                      aria-label="Effacer la recherche"
                      title="Effacer"
                    >
                      <X size={11} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setIsSearchOpen(false)}
                      className="p-0.5 text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 cursor-pointer shrink-0"
                      aria-label="Fermer la recherche"
                      title="Fermer"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Note discrète et compacte si jeu non répertorié */}
          {isUniversalFallback && (
            <div className="mb-2 px-2.5 py-1 rounded-lg bg-stone-100/80 dark:bg-slate-800/60 border border-stone-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2 text-[11px] text-stone-700 dark:text-slate-200 animate-in fade-in duration-150">
              <span className="truncate">
                Non listé · <strong className="text-stone-900 dark:text-slate-100 font-semibold">Compteur Universel</strong> proposé
              </span>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  searchInputRef.current?.focus()
                }}
                className="text-[10px] font-bold text-[#c83b3b] hover:underline shrink-0 cursor-pointer whitespace-nowrap"
              >
                Effacer
              </button>
            </div>
          )}

          {/* Filtres par type de matériel */}
          <div className="flex items-center gap-1.5 mb-2.5">
            {[
              { key: null, label: 'Tous', icon: null },
              { key: 'classic', label: 'Cartes classiques', icon: <span className="text-[13px] leading-none" aria-hidden="true">🂱</span> },
              { key: 'dedicated', label: 'Jeu de société', icon: <Dices size={12} className="shrink-0" /> },
            ].map(({ key, label, icon }) => (
              <button
                key={String(key)}
                type="button"
                onClick={() => setDeckFilter(prev => prev === key ? null : key)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border whitespace-nowrap ${
                  deckFilter === key
                    ? 'bg-[#c83b3b] text-white border-[#c83b3b]'
                    : 'bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-200 border-stone-200 dark:border-slate-700 hover:border-[#c83b3b] hover:text-[#c83b3b]'
                }`}
              >
                {icon}{label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {sortedGames.map(meta => {
              const playCount = gamePlayCounts[meta.id] || 0
              return (
                <div
                  key={meta.id}
                  onClick={() => setSetupGame(meta.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setSetupGame(meta.id)}
                  className="relative flex flex-col justify-between p-4 rounded-xl school-card hover:border-[#c83b3b] transition-all active:scale-[0.99] cursor-pointer shadow-2xs border-l-4 border-l-[#c83b3b]/80"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-serif-title font-bold text-lg leading-snug">
                        {formatTypography(meta.name)}
                      </h3>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setRulesGame(meta.id)
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/80 text-[11px] font-semibold text-stone-700 dark:text-slate-300 hover:border-[#c83b3b] hover:text-[#c83b3b] transition-colors flex-shrink-0"
                        title={`Lire les règles de ${meta.name}`}
                      >
                        <BookOpen size={12} />
                        <span>Règles</span>
                      </button>
                    </div>

                    <p className="text-xs text-stone-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {formatTypography(meta.description)}
                    </p>
                  </div>

                  {/* Badges discrets d'écolier */}
                  <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-stone-100 dark:border-slate-800/70">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300">
                      {meta.playersBadge}
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded border border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-300">
                      {meta.categoryBadge}
                    </span>
                    {playCount > 0 && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#c83b3b]/10 text-[#c83b3b] border border-[#c83b3b]/20">
                        {playCount} partie{playCount > 1 ? 's' : ''}
                      </span>
                    )}
                    <span className="ml-auto text-xs font-bold text-[#c83b3b] flex items-center gap-0.5">
                      Jouer <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Dernières parties terminées */}
        {finishedGames.length > 0 && (
          <section className="mt-6">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-3.5 rounded-full bg-stone-400 dark:bg-slate-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                  Dernières parties
                </h2>
                <button
                  type="button"
                  onClick={() => setIsShareGamesModalOpen(true)}
                  className="text-xs font-semibold text-stone-600 dark:text-slate-300 hover:text-[#c83b3b] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Share2 size={12} className="text-[#c83b3b]" />
                  <span>Partager</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setScreen('history')}
                className="text-xs font-semibold text-[#c83b3b] flex items-center gap-0.5 cursor-pointer"
              >
                Tout voir <ChevronRight size={14} />
              </button>
            </div>
            <div className="space-y-2">
              {finishedGames.map(game => {
                const teamData = getTeamGameData(game)
                const ranking = getRanking(game.scores || {}, game.config?.scoreDir || 'high', game)
                const firstRankEntries = ranking.filter(r => r.rank === 1)
                const isTie = !teamData && firstRankEntries.length > 1
                const tiedWinners = isTie ? firstRankEntries.map(e => game.players.find(p => p.id === e.id)).filter(Boolean) : []
                const isTeamTie = teamData && teamData.teams[0].score === teamData.teams[1].score
                const winner = game.players.find(p => p.id === (game.winner?.id || game.winner)) || (firstRankEntries.length > 0 ? game.players.find(p => p.id === firstRankEntries[0].id) : null)

                return (
                  <div
                    key={game.id}
                    onClick={() => setDetailGame(game)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setDetailGame(game)}
                    className="flex items-center gap-3 p-3 rounded-xl school-card cursor-pointer hover:border-[#c83b3b]/60 transition-all active:scale-[0.99] group shadow-2xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-serif-title font-bold text-sm truncate">
                          {getGameDisplayName(game)}
                        </p>
                        <span className="text-[10px] font-semibold text-stone-400 group-hover:text-[#c83b3b] transition-colors">
                          · {game.rounds.length} m.
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-slate-400">
                        {formatDate(game.finishedAt || game.startedAt)}
                      </p>
                    </div>
                    {isTie ? (
                      <div className="flex flex-col items-center shrink-0 min-w-[56px] pt-1">
                        <div className="relative shrink-0 flex items-center -space-x-2">
                          {tiedWinners.map(p => (
                            <div key={p.id} className="relative rounded-full ring-2 ring-white dark:ring-slate-900">
                              <Avatar player={p} size="xs" leader leaderColor="#10b981" crown />
                            </div>
                          ))}
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 truncate max-w-[80px] text-center leading-none mt-2">
                          Égalité
                        </span>
                      </div>
                    ) : isTeamTie ? (
                      <div className="flex flex-col items-center shrink-0 min-w-[56px] pt-1">
                        <div className="relative shrink-0 flex items-center -space-x-2">
                          {game.players.map(p => (
                            <div key={p.id} className="relative rounded-full ring-2 ring-white dark:ring-slate-900">
                              <Avatar player={p} size="xs" leader leaderColor="#10b981" crown />
                            </div>
                          ))}
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 truncate max-w-[80px] text-center leading-none mt-2">
                          Égalité
                        </span>
                      </div>
                    ) : winner ? (
                      <div className="flex flex-col items-center shrink-0 min-w-[56px] pt-1">
                        <Avatar player={winner} size="xs" leader leaderColor="#10b981" crown />
                        <span className="text-[11px] font-bold text-stone-700 dark:text-slate-300 truncate max-w-[64px] text-center leading-none mt-2">
                          {winner.name}
                        </span>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Footer institutionnel & Hub Juridique minimaliste sur une seule ligne */}
        <footer className="mt-4 pt-3 pb-1 border-t border-stone-200/50 dark:border-slate-800/50 flex items-center justify-center gap-2 text-center select-none">
          <div className="flex items-center gap-1.5 text-stone-600 dark:text-slate-400">
            <span className="font-serif-title font-bold text-stone-800 dark:text-slate-200 text-sm leading-none">
              Ardoise
            </span>
            <span className="font-serif italic text-stone-400 dark:text-slate-500 text-xs leading-none">by</span>
            <button
              type="button"
              onClick={() => setIsArtCreaModalOpen(true)}
              className="inline-flex items-center cursor-pointer hover:scale-105 active:scale-95 transition-transform focus:outline-none"
              title="Découvrir l'univers ART-créa"
              aria-label="Découvrir l'univers ART-créa"
            >
              <ArtCreaLogo className="h-[17px] self-center" />
            </button>
          </div>

          <span className="text-stone-300 dark:text-slate-700 select-none">·</span>

          <button
            type="button"
            onClick={() => setLegalTab('mentions')}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer group"
            title="Ouvrir le Hub juridique (Mentions légales, Confidentialité, CGU)"
          >
            <Scale size={12} className="text-[#c83b3b] group-hover:scale-110 transition-transform" />
            <span className="underline underline-offset-2 decoration-stone-300 dark:decoration-slate-700 group-hover:decoration-current">
              Hub juridique
            </span>
          </button>
        </footer>
      </main>

      <Suspense fallback={null}>
        {/* Feuille de détails et déroulement complet */}
        {detailGame && (
          <GameDetailSheet
            game={detailGame}
            open={!!detailGame}
            onClose={() => setDetailGame(null)}
            onResume={(id) => {
              setDetailGame(null)
              resumeGame(id)
            }}
            onRematch={(g) => {
              setDetailGame(null)
              createGame(g.type, g.players, g.config)
            }}
          />
        )}

        {/* Modale de préparation de partie */}
        {setupGame && (
          <GameSetupSheet
            gameType={setupGame}
            initialPreset={setupPreset}
            onClose={() => {
              setSetupGame(null)
              setSetupPreset(null)
            }}
            onOpenRules={(type) => setRulesGame(type)}
          />
        )}

        {/* Bottom Sheet de consultation des Règles Officielles */}
        {rulesGame && (
          <RulesSheet
            gameType={rulesGame}
            onClose={() => {
              setRulesGame(null)
              if (window.location.pathname.startsWith('/jeux/')) {
                window.history.replaceState({}, '', '/')
              }
            }}
            onStartSetup={(type) => {
              if (window.location.pathname.startsWith('/jeux/')) {
                window.history.replaceState({}, '', '/')
              }
              setSetupGame(type)
            }}
          />
        )}

        {/* Hub Juridique (Mentions Légales, Confidentialité RGPD, CGU) */}
        {legalTab && (
          <LegalModal
            open={Boolean(legalTab)}
            onClose={() => setLegalTab(null)}
            activeTab={legalTab}
            onSelectTab={setLegalTab}
          />
        )}

        {/* Modale interactive : Univers ART-créa */}
        {isArtCreaModalOpen && (
          <ArtCreaUniverseModal
            isOpen={isArtCreaModalOpen}
            onClose={() => setIsArtCreaModalOpen(false)}
          />
        )}

        {/* Modale Sauvegarde & Synchronisation (Multi-appareils / Fichier) */}
        {isSyncModalOpen && (
          <SyncModal
            isOpen={isSyncModalOpen}
            onClose={() => setIsSyncModalOpen(false)}
            onDataUpdated={reloadStorage}
          />
        )}

        {/* Modale Session Journée & Table en direct */}
        {isLiveModalOpen && (
          <LiveSessionModal
            isOpen={isLiveModalOpen}
            onClose={() => setIsLiveModalOpen(false)}
            onSessionChanged={(s) => setLiveSession(s)}
          />
        )}

        {/* Modale de partage et d'import de lots de parties */}
        {isShareGamesModalOpen && (
          <ShareGamesModal
            isOpen={isShareGamesModalOpen}
            onClose={() => setIsShareGamesModalOpen(false)}
            onOpenImportGames={(importedGames) => {
              window.dispatchEvent(new CustomEvent('ardoise-open-import-games', { detail: importedGames }))
            }}
          />
        )}

        {/* Modale de partage d'un modèle / raccourci de jeu */}
        {sharingPresetGame && (
          <ShareGameModal
            isOpen={Boolean(sharingPresetGame)}
            onClose={() => setSharingPresetGame(null)}
            game={sharingPresetGame}
          />
        )}
      </Suspense>
    </div>
  )
}
