import { useState } from 'react'
import { History, Users, ChevronRight, BookOpen, Play } from 'lucide-react'
import { useGame } from '../context/GameContext'
import { GAME_META } from '../constants/games'
import { ThemeToggle } from './ui/ThemeToggle'
import { GameSetupSheet } from './GameSetupSheet'
import { RulesSheet } from './RulesSheet'
import { formatDate } from '../utils/gameUtils'
import { Avatar } from './ui/Avatar'

export function HomeScreen() {
  const { games, setScreen, resumeGame } = useGame()
  const [setupGame, setSetupGame] = useState(null)
  const [rulesGame, setRulesGame] = useState(null)

  const activeGames = games.filter(g => g.status === 'active')
  const finishedGames = games.filter(g => g.status === 'finished').slice(0, 3)

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden school-surface">
      {/* Header style cahier d'écolier / ardoise */}
      <header className="flex items-center justify-between px-4 pt-safe pt-3.5 pb-3 flex-shrink-0 border-b border-stone-200/90 dark:border-slate-800/90 bg-[#faf9f5]/90 dark:bg-[#151719]/90 backdrop-blur-xs">
        <div className="flex items-center gap-2.5">
          <img
            src="/ardoise-fav.svg"
            alt="Ardoise"
            className="w-8 h-8 rounded-lg shadow-2xs flex-shrink-0"
          />
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
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-6">
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
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-[#c83b3b] text-white">
                    <Play size={12} fill="currentColor" /> Reprendre
                  </div>
                </button>
              ))}
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
              7 calculateurs officiels
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {Object.values(GAME_META).map(meta => (
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
                  <span className="ml-auto text-xs font-bold text-[#c83b3b] flex items-center gap-0.5">
                    Jouer <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            ))}
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
                    className="flex items-center gap-3 p-3 rounded-xl school-card"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-serif-title font-bold text-sm">
                        {game.name}
                      </p>
                      <p className="text-[11px] text-stone-500 dark:text-slate-400">
                        {formatDate(game.finishedAt || game.startedAt)}
                      </p>
                    </div>
                    {winner && (
                      <div className="flex items-center gap-2">
                        <Avatar player={winner} size="xs" />
                        <span className="text-xs font-bold">
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

      {/* Modale de préparation de partie */}
      <GameSetupSheet
        gameType={setupGame}
        onClose={() => setSetupGame(null)}
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
