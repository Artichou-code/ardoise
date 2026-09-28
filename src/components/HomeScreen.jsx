import { useState, useMemo } from 'react'
import { History, Users, ChevronRight, BookOpen, Play, Bookmark, Trash2, Clock, Trophy } from 'lucide-react'
import { useGame } from '../context/GameContext'
import { GAME_META } from '../constants/games'
import { ThemeToggle } from './ui/ThemeToggle'
import { AppLogo } from './ui/AppLogo'
import { GameSetupSheet } from './GameSetupSheet'
import { RulesSheet } from './RulesSheet'
import { GameDetailSheet } from './GameDetailSheet'
import { formatDate, formatGameStart } from '../utils/gameUtils'
import { Avatar } from './ui/Avatar'

export function HomeScreen() {
  const { games, setScreen, resumeGame, customPresets, deletePreset, createGame } = useGame()
  const [setupGame, setSetupGame] = useState(null)
  const [setupPreset, setSetupPreset] = useState(null)
  const [rulesGame, setRulesGame] = useState(null)
  const [detailGame, setDetailGame] = useState(null)

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

  // Tri dynamique : les jeux les plus joués se placent automatiquement en premier
  const sortedGames = useMemo(() => {
    const list = Object.values(GAME_META)
    const initialIndex = list.reduce((acc, m, i) => {
      acc[m.id] = i
      return acc
    }, {})

    return [...list].sort((a, b) => {
      const countA = gamePlayCounts[a.id] || 0
      const countB = gamePlayCounts[b.id] || 0
      if (countB !== countA) return countB - countA
      return initialIndex[a.id] - initialIndex[b.id]
    })
  }, [gamePlayCounts])

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden school-surface select-none">
      {/* Header style cahier d'écolier / ardoise */}
      <header className="flex items-center justify-between px-4 pt-safe pt-3.5 pb-3 flex-shrink-0 border-b border-stone-200/90 dark:border-slate-800/90 bg-[#faf9f5]/90 dark:bg-[#151719]/90 backdrop-blur-xs">
        <div className="flex items-center gap-2.5">
          <AppLogo className="w-8 h-8 shadow-2xs" />
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
          <button
            type="button"
            onClick={() => setScreen('history')}
            className="p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Historique des parties"
            title="Historique"
          >
            <History size={18} className="text-stone-700 dark:text-slate-300" />
          </button>
          <button
            type="button"
            onClick={() => setScreen('players')}
            className="p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Bibliothèque de joueurs"
            title="Joueurs"
          >
            <Users size={18} className="text-stone-700 dark:text-slate-300" />
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* Corps scrollable */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-3 scroll-bottom-space">
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
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl school-card hover:border-[#c83b3b] transition-all active:scale-[0.99] text-left shadow-2xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-serif-title font-bold text-base leading-tight">
                        {game.name}
                      </p>
                      <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-400">
                        Manche {game.rounds.length + 1}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-slate-400 truncate mt-1">
                      {game.players.map(p => p.name).join(' · ')}
                    </p>
                    {game.startedAt && (
                      <p className="text-[11px] text-stone-400 dark:text-slate-500 flex items-center gap-1 mt-1">
                        <Clock size={11} className="opacity-70 shrink-0" />
                        <span>Lancée {formatGameStart(game.startedAt)}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-[#c83b3b] text-white shrink-0">
                    <Play size={12} fill="currentColor" /> Reprendre
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Jeux personnalisés enregistrés */}
        {customPresets && customPresets.length > 0 && (
          <section className="mt-4">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-3.5 rounded-full bg-amber-500" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                  Mes jeux enregistrés
                </h2>
              </div>
              <span className="text-[11px] text-stone-400 dark:text-slate-500">
                {customPresets.length} modèle{customPresets.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                    className="relative flex flex-col justify-between p-3.5 rounded-xl school-card hover:border-amber-500 transition-all active:scale-[0.99] cursor-pointer shadow-2xs border-l-4 border-l-amber-500"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Bookmark size={15} className="text-amber-500 shrink-0" />
                          <h3 className="font-serif-title font-bold text-base leading-snug truncate">
                            {preset.name}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            deletePreset(preset.id)
                          }}
                          className="p-1 rounded-lg text-stone-400 hover:text-red-500 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                          title="Supprimer ce modèle"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <p className="text-xs text-stone-500 dark:text-slate-400 truncate mt-1">
                        {ruleDesc}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-stone-100 dark:border-slate-800/70">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                        {preset.scoreDir === 'low_limit' ? `Seuil ${preset.limit || 100} pts` : 'Score max'}
                      </span>
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                        Lancer <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Grille des jeux (Zéro émoji, style Cahier & Ardoise) */}
        <section className="mt-4">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-3.5 rounded-full bg-[#c83b3b]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                Choisir un jeu
              </h2>
            </div>
            <span className="text-[11px] text-stone-400 dark:text-slate-500">
              {Object.keys(GAME_META).length} calculateurs officiels
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                        {meta.name}
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

                    <p className="text-xs text-stone-500 dark:text-slate-400 truncate mt-1">
                      {meta.description}
                    </p>
                  </div>

                  {/* Badges discrets d'écolier */}
                  <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-stone-100 dark:border-slate-800/70">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300">
                      {meta.playersBadge}
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded border border-stone-200 dark:border-slate-700 text-stone-500 dark:text-slate-400">
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
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-3.5 rounded-full bg-stone-400 dark:bg-slate-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                  Dernières parties
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setScreen('history')}
                className="text-xs font-semibold text-[#c83b3b] flex items-center gap-0.5"
              >
                Tout voir <ChevronRight size={14} />
              </button>
            </div>
            <div className="space-y-2">
              {finishedGames.map(game => {
                const winner = game.players.find(p => p.id === game.winner)
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
                          {game.name}
                        </p>
                        <span className="text-[10px] font-semibold text-stone-400 group-hover:text-[#c83b3b] transition-colors">
                          · {game.rounds.length} m.
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-slate-400">
                        {formatDate(game.finishedAt || game.startedAt)}
                      </p>
                    </div>
                    {winner && (
                      <div className="flex flex-col items-center gap-0.5 shrink-0 min-w-[54px]">
                        <div className="relative">
                          <Avatar player={winner} size="xs" leader leaderColor="#10b981" />
                          <span
                            className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-2xs ring-1 ring-white dark:ring-slate-900"
                            title="Vainqueur"
                          >
                            <Trophy size={8} strokeWidth={2.5} />
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-stone-700 dark:text-slate-300 truncate max-w-[64px] text-center leading-tight">
                          {winner.name}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>

      {/* Feuille de détails et déroulement complet */}
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

      {/* Modale de préparation de partie */}
      <GameSetupSheet
        gameType={setupGame}
        initialPreset={setupPreset}
        onClose={() => {
          setSetupGame(null)
          setSetupPreset(null)
        }}
        onOpenRules={(type) => setRulesGame(type)}
      />

      {/* Bottom Sheet de consultation des Règles Officielles */}
      <RulesSheet
        gameType={rulesGame}
        onClose={() => setRulesGame(null)}
        onStartSetup={(type) => setSetupGame(type)}
      />
    </div>
  )
}
