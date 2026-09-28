import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { BottomSheet } from '../ui/BottomSheet'
import { ScorePad } from '../ui/ScorePad'
import { Avatar } from '../ui/Avatar'
import { useGame } from '../../context/GameContext'
import { computeSkyjoRound, checkSkyjoEnd, isSkyjoScoreDoubled } from '../../engines/gameEngines'
import { Dialog } from '../ui/Dialog'

export function SkyjoEngine({ game, onFinish }) {
  const { updateScores } = useGame()
  const [roundScores, setRoundScores] = useState(
    Object.fromEntries(game.players.map(p => [p.id, 0]))
  )
  const [closerId, setCloserId] = useState(null)
  const [editingPlayer, setEditingPlayer] = useState(null)
  const [open, setOpen] = useState(false)
  const [alert, setAlert] = useState(null)

  const submitRound = () => {
    if (!closerId) return
    const { newScores, adjusted } = computeSkyjoRound(game.scores, roundScores, closerId)
    const delta = {}
    for (const p of game.players) {
      delta[p.id] = adjusted[p.id] || 0
    }
    updateScores({ scores: newScores, delta, closerId, type: 'skyjo' })

    const endPlayer = checkSkyjoEnd(newScores)
    if (endPlayer) {
      const winner = Object.entries(newScores).sort((a, b) => a[1] - b[1])[0][0]
      setAlert({ message: `${game.players.find(p => p.id === endPlayer[0])?.name} a atteint ou dépassé 100 points ! 🎉`, winnerId: winner })
    } else {
      setRoundScores(Object.fromEntries(game.players.map(p => [p.id, 0])))
      setCloserId(null)
    }
  }

  const canSubmit = closerId !== null
  const closerDoubled = isSkyjoScoreDoubled(roundScores, closerId)

  return (
    <div className="space-y-4 pt-2">
      {/* Sélection du fermeur */}
      <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">
          Qui a clôturé la manche ?
        </p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {game.players.map(p => (
            <button
              key={p.id}
              onClick={() => setCloserId(p.id)}
              className={`flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl transition-all active:scale-95 ${
                closerId === p.id ? 'ring-2 ring-offset-2 ring-[#fcc817]' : 'bg-white dark:bg-zinc-800'
              }`}
            >
              <Avatar player={p} size="xs" />
              <span className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 max-w-[48px] truncate">{p.name}</span>
            </button>
          ))}
        </div>
        {closerDoubled && (
          <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900">
            <AlertTriangle size={14} className="text-orange-500 flex-shrink-0" />
            <p className="text-xs text-orange-700 dark:text-orange-300">
              Score du fermeur doublé (il n'a pas le score strictement le plus bas) !
            </p>
          </div>
        )}
      </div>

      {/* Scores de la manche */}
      <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">
          Scores de la manche
        </p>
        <div className="space-y-2">
          {game.players.map(p => (
            <button
              key={p.id}
              onClick={() => { setEditingPlayer(p); setOpen(true) }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 active:scale-[0.98] transition-all"
            >
              <Avatar player={p} size="xs" />
              <span className="flex-1 font-semibold text-sm text-left text-zinc-900 dark:text-zinc-100">{p.name}</span>
              {closerId === p.id && closerDoubled && (
                <span className="text-xs text-orange-500 font-bold">×2 ({roundScores[p.id] * 2})</span>
              )}
              <span className="text-lg font-black tabular-nums text-zinc-900 dark:text-zinc-100">
                {roundScores[p.id] >= 0 ? '+' : ''}{roundScores[p.id]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={submitRound}
        disabled={!canSubmit}
        className="w-full py-3.5 rounded-xl font-bold text-base text-[#18181b] transition-all active:scale-[0.98] disabled:opacity-40"
        style={{ backgroundColor: '#fcc817' }}
      >
        Valider la manche
      </button>

      {editingPlayer && (
        <BottomSheet open={open} onClose={() => setOpen(false)} title={`${editingPlayer.emoji} ${editingPlayer.name} — Score manche`}>
          <div className="px-4 pb-6">
            <ScorePad
              value={roundScores[editingPlayer.id] || 0}
              onChange={v => setRoundScores(prev => ({ ...prev, [editingPlayer.id]: v }))}
              onConfirm={() => setOpen(false)}
            />
          </div>
        </BottomSheet>
      )}

      <Dialog open={!!alert} onClose={() => {}} title="Fin de partie !">
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">{alert?.message}</p>
        <button
          onClick={() => { onFinish(alert.winnerId); setAlert(null) }}
          className="w-full py-3 rounded-xl font-bold text-[#18181b]"
          style={{ backgroundColor: '#fcc817' }}
        >
          Voir le classement 🏆
        </button>
      </Dialog>
    </div>
  )
}
