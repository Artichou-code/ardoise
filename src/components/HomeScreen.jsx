import { useState } from 'react'
import { Plus, History, Users, ChevronRight } from 'lucide-react'
import { useGame } from '../context/GameContext'
import { GAME_META, GAMES } from '../constants/games'
import { ThemeToggle } from './ui/ThemeToggle'
import { GameSetupSheet } from './GameSetupSheet'
import { formatDate } from '../utils/gameUtils'
import { Avatar } from './ui/Avatar'

export function HomeScreen() {
  const { games, setScreen, resumeGame } = useGame()
  const [setupGame, setSetupGame] = useState(null)

  const activeGames = games.filter(g => g.status === 'active')
  const finishedGames = games.filter(g => g.status === 'finished').slice(0, 3)

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-white dark:bg-zinc-950">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-safe pt-4 pb-3 flex-shrink-0 border-b border-zinc-100 dark:border-zinc-900">
        <div className="flex items-center gap-2.5">
          <svg className="w-7 h-7" viewBox="0 0 64 64" fill="none">
            <rect width="64" height="64" rx="14" fill="#18181b"/>
            <path d="M16 48 L32 16 L48 48" stroke="#fcc817" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 38 L42 38" stroke="#fcc817" strokeWidth="4" strokeLinecap="round"/>
          </svg>
          <span className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Ardoise</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setScreen('history')}
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Historique"
          >
            <History size={20} className="text-zinc-600 dark:text-zinc-400" />
          </button>
          <button
            onClick={() => setScreen('players')}
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Joueurs"
          >
            <Users size={20} className="text-zinc-600 dark:text-zinc-400" />
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-6">
        {/* Parties en cours */}
        {activeGames.length > 0 && (
          <section className="mt-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">
              En cours
            </h2>
            <div className="space-y-2">
              {activeGames.map(game => (
                <button
                  key={game.id}
                  onClick={() => resumeGame(game.id)}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-left hover:border-[#fcc817] transition-colors active:scale-[0.98]"
                >
                  <span className="text-2xl">{GAME_META[game.type]?.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{game.name}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      {game.players.map(p => p.name).join(' · ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg" style={{ backgroundColor: '#fcc81722', color: '#fcc817' }}>
                    Reprendre
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Nouveaux jeux */}
        <section className="mt-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">
            Nouvelle partie
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.values(GAME_META).map(meta => (
              <button
                key={meta.id}
                onClick={() => setSetupGame(meta.id)}
                className="flex flex-col items-start gap-2 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-left hover:border-[#fcc817] transition-all active:scale-[0.97] group"
              >
                <span className="text-3xl">{meta.emoji}</span>
                <div>
                  <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 leading-tight">{meta.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug line-clamp-2">{meta.description}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Dernières parties */}
        {finishedGames.length > 0 && (
          <section className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Dernières parties
              </h2>
              <button
                onClick={() => setScreen('history')}
                className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-0.5"
              >
                Voir tout <ChevronRight size={14} />
              </button>
            </div>
            <div className="space-y-2">
              {finishedGames.map(game => {
                const winner = game.players.find(p => p.id === game.winner)
                return (
                  <div
                    key={game.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800"
                  >
                    <span className="text-xl">{GAME_META[game.type]?.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">{game.name}</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">{formatDate(game.finishedAt || game.startedAt)}</p>
                    </div>
                    {winner && (
                      <div className="flex items-center gap-1.5">
                        <Avatar player={winner} size="xs" />
                        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{winner.name}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>

      {/* FAB */}
      <div className="absolute bottom-6 right-4 safe-bottom">
        {/* Already handled by the grid above */}
      </div>

      {/* Setup sheet */}
      <GameSetupSheet
        gameType={setupGame}
        onClose={() => setSetupGame(null)}
      />
    </div>
  )
}
