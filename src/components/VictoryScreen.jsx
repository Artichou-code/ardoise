import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { Trophy, RotateCcw, Home } from 'lucide-react'
import { useGame } from '../context/GameContext'
import { GAME_META } from '../constants/games'
import { Avatar } from './ui/Avatar'
import { getRanking, formatDuration } from '../utils/gameUtils'
import { ThemeToggle } from './ui/ThemeToggle'

export function VictoryScreen() {
  const { activeGame, rematch, exitGame } = useGame()
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current || !activeGame) return
    fired.current = true

    // Confettis dorés
    const duration = 2500
    const end = Date.now() + duration
    const colors = ['#fcc817', '#f59e0b', '#fbbf24', '#fde68a', '#ffffff']

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()

    // Burst central
    setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { x: 0.5, y: 0.4 },
        colors,
        scalar: 1.2,
      })
    }, 300)
  }, [activeGame])

  if (!activeGame) return null

  const meta = GAME_META[activeGame.type]
  const scoreDir = activeGame.config?.scoreDir === 'low' || meta?.scoreDir === 'low' ? 'low' : 'high'
  const ranking = getRanking(activeGame.scores, scoreDir)
  const winner = activeGame.players.find(p => p.id === activeGame.winner)
  const duration = activeGame.finishedAt
    ? formatDuration(activeGame.finishedAt - activeGame.startedAt)
    : null

  const podiumOrder = [ranking[1], ranking[0], ranking[2]].filter(Boolean)
  const heights = ['h-24', 'h-32', 'h-16']
  const medals = ['🥈', '🥇', '🥉']

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-white dark:bg-zinc-950">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-safe pt-4 pb-3 flex-shrink-0">
        <span className="text-lg font-black text-zinc-900 dark:text-zinc-100">🏁 Fin de partie</span>
        <ThemeToggle />
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-6">
        {/* Winner hero */}
        {winner && (
          <div className="text-center mt-4 mb-8">
            <div className="relative inline-block">
              <Avatar player={winner} size="xl" leader />
              <span className="absolute -top-2 -right-2 text-3xl">👑</span>
            </div>
            <h1 className="text-2xl font-black mt-3 text-zinc-900 dark:text-zinc-100">
              {winner.name} gagne !
            </h1>
            <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
              {meta?.emoji} {meta?.name}{duration ? ` · ${duration}` : ''}
            </p>
          </div>
        )}

        {/* Podium */}
        {ranking.length >= 2 && (
          <div className="flex items-end justify-center gap-2 mb-6">
            {podiumOrder.map((r, i) => {
              if (!r) return <div key={i} className="w-24" />
              const player = activeGame.players.find(p => p.id === r.id)
              if (!player) return null
              return (
                <div key={r.id} className="flex flex-col items-center gap-1 w-24">
                  <Avatar player={player} size="sm" leader={i === 1} />
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 text-center truncate w-full px-1">{player.name}</span>
                  <span className="text-sm font-black" style={i === 1 ? { color: '#fcc817' } : {}}>{r.score}</span>
                  <div
                    className={`${heights[i]} w-full rounded-t-xl flex items-start justify-center pt-2 text-xl`}
                    style={{ backgroundColor: i === 1 ? '#fcc817' : i === 0 ? '#d4d4d4' : '#cd7f32' }}
                  >
                    {medals[i]}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Classement complet */}
        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">Classement</p>
          {ranking.map(({ id, score, rank }) => {
            const player = activeGame.players.find(p => p.id === id)
            if (!player) return null
            return (
              <div key={id} className="flex items-center gap-3">
                <span className="w-6 text-center font-black text-zinc-400 dark:text-zinc-500">
                  {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                </span>
                <Avatar player={player} size="xs" />
                <span className="flex-1 font-semibold text-sm text-zinc-800 dark:text-zinc-200">{player.name}</span>
                <span
                  className="font-black text-base tabular-nums"
                  style={rank === 1 ? { color: '#fcc817' } : {}}
                >
                  {score}
                </span>
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={exitGame}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 font-semibold text-zinc-700 dark:text-zinc-300 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            <Home size={18} /> Accueil
          </button>
          <button
            onClick={rematch}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-[#18181b] text-sm transition-all active:scale-[0.98]"
            style={{ backgroundColor: '#fcc817' }}
          >
            <RotateCcw size={18} /> Revanche !
          </button>
        </div>
      </div>
    </div>
  )
}
