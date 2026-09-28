import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { RotateCcw, Home, Award, AlertCircle } from 'lucide-react'
import { useGame } from '../context/GameContext'
import { GAME_META, GAMES } from '../constants/games'
import { Avatar } from './ui/Avatar'
import { getRanking, formatDuration } from '../utils/gameUtils'
import { ThemeToggle } from './ui/ThemeToggle'

export function VictoryScreen() {
  const { activeGame, rematch, exitGame } = useGame()
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current || !activeGame) return
    fired.current = true

    const colors = ['#c83b3b', '#1e3a5f', '#b47b18', '#1f5c43']
    confetti({
      particleCount: 65,
      spread: 80,
      origin: { x: 0.5, y: 0.35 },
      colors,
    })
  }, [activeGame])

  if (!activeGame) return null

  const meta = GAME_META[activeGame.type]
  const isDourak = activeGame.type === GAMES.DOURAK
  const isDourakCards = isDourak && activeGame.config?.mode === 'cards'
  const scoreUnit = isDourak
    ? isDourakCards
      ? 'cartes'
      : 'déf.'
    : 'pts'

  const scoreDir =
    activeGame.config?.scoreDir === 'low' ||
    activeGame.config?.scoreDir === 'low_limit' ||
    meta?.scoreDir === 'low'
      ? 'low'
      : 'high'

  const ranking = getRanking(activeGame.scores, scoreDir)
  const winner =
    activeGame.players.find(p => p.id === activeGame.winner) ||
    activeGame.players.find(p => p.id === ranking[0]?.id)

  const grandDourakEntry = ranking[ranking.length - 1]
  const grandDourak = isDourak
    ? activeGame.players.find(p => p.id === grandDourakEntry?.id)
    : null

  const duration = activeGame.finishedAt
    ? formatDuration(activeGame.finishedAt - activeGame.startedAt)
    : null

  const podiumOrder = [ranking[1], ranking[0], ranking[2]].filter(Boolean)
  const heights = ['h-20', 'h-28', 'h-16']
  const labels = ['2e', '1er', '3e']

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden school-surface select-none">
      <header className="flex items-center justify-between px-4 pt-safe pt-3.5 pb-3 flex-shrink-0 border-b border-stone-200/90 dark:border-slate-800/90">
        <span className="font-serif-title text-lg font-bold">
          {isDourak ? 'Verdict du Dourak (Дурак)' : 'Palmarès de la partie'}
        </span>
        <ThemeToggle />
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide overscroll-contain px-4 pt-3 scroll-bottom-space">
        {/* Lauréat & Grand Dourak (si jeu Dourak) */}
        {isDourak ? (
          <div className="grid grid-cols-2 gap-3 mt-4 mb-6">
            {/* Meilleur joueur (0 défaite / invaincu) */}
            {winner && (
              <div className="school-card rounded-xl p-3.5 text-center border-t-4 border-t-emerald-700 dark:border-t-emerald-500">
                <div className="inline-flex justify-center">
                  <Avatar player={winner} size="md" />
                </div>
                <span className="mt-2 block text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Meilleur joueur
                </span>
                <p className="font-serif-title font-bold text-base truncate mt-0.5">
                  {winner.name}
                </p>
                <p className="text-xs font-bold text-stone-500 dark:text-slate-400 mt-0.5 tabular-nums">
                  {activeGame.scores[winner.id] || 0} {scoreUnit}
                </p>
              </div>
            )}

            {/* Le Grand Dourak de la soirée */}
            {grandDourak && (
              <div className="school-card rounded-xl p-3.5 text-center border-t-4 border-t-[#c83b3b] bg-[#c83b3b]/5">
                <div className="inline-flex justify-center">
                  <Avatar player={grandDourak} size="md" leader />
                </div>
                <span className="mt-2 inline-flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#c83b3b]">
                  <AlertCircle size={11} /> Grand Dourak
                </span>
                <p className="font-serif-title font-bold text-base truncate mt-0.5">
                  {grandDourak.name}
                </p>
                <p className="text-xs font-black text-[#c83b3b] mt-0.5 tabular-nums">
                  {activeGame.scores[grandDourak.id] || 0} {scoreUnit}
                </p>
              </div>
            )}
          </div>
        ) : (
          winner && (
            <div className="text-center mt-5 mb-6">
              <div className="inline-flex flex-col items-center">
                <Avatar player={winner} size="xl" leader />
                <span className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#c83b3b] text-white text-[11px] font-bold uppercase tracking-wider">
                  <Award size={12} /> Vainqueur
                </span>
              </div>
              <h1 className="font-serif-title text-2xl font-bold mt-2">
                {winner.name} l'emporte
              </h1>
              <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                {meta?.name}
                {duration ? ` · ${duration}` : ''} · {activeGame.rounds.length} manche
                {activeGame.rounds.length > 1 ? 's' : ''}
              </p>
            </div>
          )
        )}

        {/* Podium typographique sans émoji */}
        {ranking.length >= 2 && (
          <div className="flex items-end justify-center gap-2.5 mb-6">
            {podiumOrder.map((r, i) => {
              if (!r) return <div key={i} className="w-24" />
              const player = activeGame.players.find(p => p.id === r.id)
              if (!player) return null
              const isFirst = r.rank === 1
              return (
                <div key={r.id} className="flex flex-col items-center gap-1 w-24">
                  <Avatar player={player} size="sm" leader={isFirst} />
                  <span className="text-xs font-semibold truncate w-full text-center px-1">
                    {player.name}
                  </span>
                  <span className={`text-xs font-black tabular-nums ${isFirst ? 'text-[#c83b3b]' : ''}`}>
                    {r.score} {scoreUnit}
                  </span>
                  <div
                    className={`${heights[i]} w-full rounded-t-xl flex items-start justify-center pt-2.5 font-serif-title font-bold text-sm border-t border-x ${
                      isFirst
                        ? 'bg-[#c83b3b] text-white border-[#c83b3b]'
                        : 'school-card text-stone-600 dark:text-slate-300'
                    }`}
                  >
                    {labels[i]}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Classement complet */}
        <div className="school-card rounded-xl p-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 mb-2">
            {isDourak ? 'Bilan de la soirée (du meilleur au Grand Dourak)' : 'Tableau final'}
          </p>
          {ranking.map(({ id, score, rank }) => {
            const player = activeGame.players.find(p => p.id === id)
            if (!player) return null
            const isLast = isDourak && rank === ranking.length
            return (
              <div key={id} className="flex items-center gap-3 py-1">
                <span
                  className={`w-7 text-xs font-bold tabular-nums ${
                    rank === 1
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : isLast
                      ? 'text-[#c83b3b]'
                      : 'text-stone-400 dark:text-slate-500'
                  }`}
                >
                  {rank === 1 ? '1er' : `${rank}e`}
                </span>
                <Avatar player={player} size="xs" />
                <span className="flex-1 font-semibold text-sm truncate">
                  {player.name}
                </span>
                {isLast && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#c83b3b]/15 text-[#c83b3b]">
                    Grand Dourak
                  </span>
                )}
                <span
                  className={`font-black text-sm tabular-nums ${
                    isLast ? 'text-[#c83b3b]' : ''
                  }`}
                >
                  {score} {scoreUnit}
                </span>
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={exitGame}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border border-stone-300 dark:border-slate-700 font-semibold text-sm hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Home size={16} /> Accueil
          </button>
          <button
            type="button"
            onClick={rematch}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm btn-margin-red"
          >
            <RotateCcw size={16} /> Revanche
          </button>
        </div>
      </div>
    </div>
  )
}
