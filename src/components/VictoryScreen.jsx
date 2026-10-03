import { useState, useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { RotateCcw, Home, Award, AlertCircle, QrCode } from 'lucide-react'
import { useGame } from '../context/GameContext'
import { GAME_META, GAMES, getGameDisplayName } from '../constants/games'
import { Avatar } from './ui/Avatar'
import { getRanking, formatDuration } from '../utils/gameUtils'
import { ShareGameModal } from './ShareGameModal'

export function VictoryScreen() {
  const { activeGame, rematch, exitGame } = useGame()
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current || !activeGame) return
    fired.current = true

    const colors = ['#c83b3b', '#b47b18', '#1f5c43']
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
  const isBelote = activeGame.type === GAMES.BELOTE && activeGame.players.length === 4
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

  const pNous = isBelote ? [activeGame.players[0], activeGame.players[1]].filter(Boolean) : []
  const pEux = isBelote ? [activeGame.players[2], activeGame.players[3]].filter(Boolean) : []
  const scoreNous = isBelote ? (activeGame.scores[pNous[0]?.id] || 0) : 0
  const scoreEux = isBelote ? (activeGame.scores[pEux[0]?.id] || 0) : 0
  const winningTeam = scoreNous >= scoreEux ? 'nous' : 'eux'
  const winningPlayers = winningTeam === 'nous' ? pNous : pEux
  const losingPlayers = winningTeam === 'nous' ? pEux : pNous
  const winningScore = Math.max(scoreNous, scoreEux)
  const losingScore = Math.min(scoreNous, scoreEux)

  const podiumOrder = [ranking[1], ranking[0], ranking[2]].filter(Boolean)
  const heights = ['h-16', 'h-24', 'h-12']
  const labels = ['2e', '1er', '3e']

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden school-surface select-none">
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-safe pt-5 pb-4 pb-safe">
        {/* Lauréat & Grand Dourak (si jeu Dourak) */}
        {isDourak ? (
          <div className="grid grid-cols-2 gap-2.5 mt-2 mb-3">
            {/* Meilleur joueur (0 défaite / invaincu) */}
            {winner && (
              <div className="school-card rounded-xl p-3 flex flex-col items-center justify-center text-center border-t-4 border-t-emerald-700 dark:border-t-emerald-500">
                <Avatar player={winner} size="md" />
                <span className="mt-1.5 flex items-center justify-center text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 w-full text-center">
                  Meilleur joueur
                </span>
                <p className="font-serif-title font-bold text-sm sm:text-base truncate w-full mt-0.5">
                  {winner.name}
                </p>
                <p className="text-xs font-bold text-stone-500 dark:text-slate-400 mt-0.5 tabular-nums">
                  {activeGame.scores[winner.id] || 0} {scoreUnit}
                </p>
              </div>
            )}

            {/* Le Grand Dourak de la soirée */}
            {grandDourak && (
              <div className="school-card rounded-xl p-3 flex flex-col items-center justify-center text-center border-t-4 border-t-[#c83b3b] bg-[#c83b3b]/5">
                <Avatar player={grandDourak} size="md" leader />
                <span className="mt-1.5 flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#c83b3b] w-full text-center">
                  <AlertCircle size={11} className="flex-shrink-0" />
                  <span className="truncate">Grand Dourak</span>
                </span>
                <p className="font-serif-title font-bold text-sm sm:text-base truncate w-full mt-0.5">
                  {grandDourak.name}
                </p>
                <p className="text-xs font-black text-[#c83b3b] mt-0.5 tabular-nums">
                  {activeGame.scores[grandDourak.id] || 0} {scoreUnit}
                </p>
              </div>
            )}
          </div>
        ) : isBelote ? (
          <div className="text-center mt-2 mb-3">
            <div className="inline-flex flex-col items-center">
              <div className="flex items-center justify-center -space-x-2">
                {winningPlayers.map(p => (
                  <Avatar key={p.id} player={p} size="lg" leader />
                ))}
              </div>
              <span className="mt-2 inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-[#c83b3b] text-white text-[11px] font-bold uppercase tracking-wider">
                <Award size={12} /> Équipe victorieuse
              </span>
            </div>
            <h1 className="font-serif-title text-xl font-bold mt-1">
              {winningPlayers.map(p => p.name).join(' & ')} l'emportent !
            </h1>
            <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
              {getGameDisplayName(activeGame)} · {winningTeam === 'nous' ? 'Équipe 1' : 'Équipe 2'}
              {duration ? ` · ${duration}` : ''} · {activeGame.rounds.length} donne{activeGame.rounds.length > 1 ? 's' : ''}
            </p>
          </div>
        ) : (
          winner && (
            <div className="text-center mt-2 mb-3">
              <div className="inline-flex flex-col items-center">
                <Avatar player={winner} size="lg" leader />
                <span className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#c83b3b] text-white text-[10px] font-bold uppercase tracking-wider">
                  <Award size={12} /> Vainqueur
                </span>
              </div>
              <h1 className="font-serif-title text-xl font-bold mt-1">
                {winner.name} l'emporte
              </h1>
              <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                {getGameDisplayName(activeGame)}
                {duration ? ` · ${duration}` : ''} · {activeGame.rounds.length} manche
                {activeGame.rounds.length > 1 ? 's' : ''}
              </p>
            </div>
          )
        )}

        {/* Podium ou face-à-face par équipes */}
        {isBelote ? (
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            {/* Équipe gagnante */}
            <div className="school-card rounded-xl p-3 flex flex-col items-center text-center border-t-4 border-t-[#c83b3b] bg-[#c83b3b]/5">
              <div className="flex items-center -space-x-1.5 py-0.5">
                {winningPlayers.map(p => (
                  <Avatar key={p.id} player={p} size="sm" leader />
                ))}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#c83b3b] mt-1.5">
                1er · {winningTeam === 'nous' ? 'Équipe 1' : 'Équipe 2'}
              </span>
              <p className="font-semibold text-xs truncate max-w-full mt-0.5">
                {winningPlayers.map(p => p.name).join(' & ')}
              </p>
              <p className="font-black tabular-nums text-lg text-[#c83b3b] mt-1">
                {winningScore} pts
              </p>
            </div>

            {/* Équipe adverse */}
            <div className="school-card rounded-xl p-3 flex flex-col items-center text-center border-t-4 border-t-stone-300 dark:border-t-slate-700">
              <div className="flex items-center -space-x-1.5 py-0.5">
                {losingPlayers.map(p => (
                  <Avatar key={p.id} player={p} size="sm" />
                ))}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 mt-1.5">
                2e · {winningTeam === 'nous' ? 'Équipe 2' : 'Équipe 1'}
              </span>
              <p className="font-semibold text-xs truncate max-w-full mt-0.5">
                {losingPlayers.map(p => p.name).join(' & ')}
              </p>
              <p className="font-black tabular-nums text-lg text-stone-700 dark:text-slate-300 mt-1">
                {losingScore} pts
              </p>
            </div>
          </div>
        ) : (
          ranking.length >= 2 && (
            <div className="flex items-end justify-center gap-2 mb-3">
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
                      className={`${heights[i]} w-full rounded-t-xl flex items-start justify-center pt-2 font-serif-title font-bold text-sm border-t border-x ${
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
          )
        )}

        {/* Classement complet */}
        <div className="school-card rounded-xl p-3.5 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 mb-1.5">
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
                <span className="flex-1 font-semibold text-xs sm:text-sm truncate">
                  {player.name}
                  {isBelote && (
                    <span className="text-[10px] font-normal text-stone-400 dark:text-slate-500 ml-1.5">
                      ({pNous.some(p => p.id === player.id) ? 'Équipe 1' : 'Équipe 2'})
                    </span>
                  )}
                </span>
                {isLast && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#c83b3b]/15 text-[#c83b3b]">
                    Grand Dourak
                  </span>
                )}
                <span
                  className={`font-black text-xs sm:text-sm tabular-nums ${
                    isLast ? 'text-[#c83b3b]' : ''
                  }`}
                >
                  {score} {scoreUnit}
                </span>
              </div>
            )
          })}
        </div>

        {/* Bouton Partager la feuille de match */}
        <button
          type="button"
          onClick={() => setIsShareModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 font-bold text-xs hover:bg-stone-50 dark:hover:bg-slate-800 text-stone-800 dark:text-slate-200 transition-colors cursor-pointer shadow-2xs mt-3"
        >
          <QrCode size={15} className="text-[#c83b3b]" />
          <span>Partager la feuille de match (QR Code)</span>
        </button>

        {/* Actions */}
        <div className="flex gap-2.5 mt-2.5">
          <button
            type="button"
            onClick={exitGame}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-stone-300 dark:border-slate-700 font-semibold text-sm hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Home size={16} /> Accueil
          </button>
          <button
            type="button"
            onClick={rematch}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm btn-margin-red"
          >
            <RotateCcw size={16} /> Revanche
          </button>
        </div>
      </div>

      {/* Modale de partage de match */}
      <ShareGameModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        game={activeGame}
      />
    </div>
  )
}
