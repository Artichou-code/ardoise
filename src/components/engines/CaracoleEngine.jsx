import { useState } from 'react'
import { BottomSheet } from '../ui/BottomSheet'
import { ScorePad } from '../ui/ScorePad'
import { Avatar } from '../ui/Avatar'
import { useGame } from '../../context/GameContext'

export function CaracoleEngine({ game, onFinish }) {
  const { updateScores } = useGame()
  const [open, setOpen] = useState(false)
  const [roundPenalties, setRoundPenalties] = useState(
    Object.fromEntries(game.players.map(p => [p.id, 0]))
  )
  const [editingPlayer, setEditingPlayer] = useState(null)

  const limit = game.config?.limit || 100

  const setPenalty = (id, val) => {
    setRoundPenalties(prev => ({ ...prev, [id]: Math.max(0, val) }))
  }

  const submitRound = () => {
    const newScores = {}
    const delta = {}
    for (const p of game.players) {
      const pen = roundPenalties[p.id] || 0
      newScores[p.id] = (game.scores[p.id] || 0) + pen
      delta[p.id] = pen
    }
    updateScores({ scores: newScores, delta, type: 'caracole' })
    setRoundPenalties(Object.fromEntries(game.players.map(p => [p.id, 0])))
    setOpen(false)

    const eliminated = Object.entries(newScores).find(([, s]) => s >= limit)
    if (eliminated) {
      const winner = Object.entries(newScores).sort((a, b) => a[1] - b[1])[0][0]
      onFinish(winner)
    }
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="school-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
            Pénalités de la manche (cartes en main)
          </p>
          <span className="text-[11px] font-semibold text-stone-400 dark:text-slate-500">
            Seuil : {limit} pts
          </span>
        </div>
        <div className="space-y-2">
          {game.players.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => { setEditingPlayer(p); setOpen(true) }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl school-subtle hover:border-[#c83b3b] active:scale-[0.99] transition-all"
            >
              <Avatar player={p} size="xs" />
              <span className="flex-1 font-semibold text-sm text-left truncate">
                {p.name}
              </span>
              <span className="text-lg font-black tabular-nums">
                +{roundPenalties[p.id] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={submitRound}
        className="w-full py-3.5 rounded-xl font-bold text-base btn-margin-red"
      >
        Valider la manche
      </button>

      {editingPlayer && (
        <BottomSheet
          open={open}
          onClose={() => setOpen(false)}
          title={`${editingPlayer.name} — Points de pénalité`}
        >
          <div className="px-5 pb-6">
            <ScorePad
              value={roundPenalties[editingPlayer.id] || 0}
              onChange={v => setPenalty(editingPlayer.id, v)}
              onConfirm={() => setOpen(false)}
            />
          </div>
        </BottomSheet>
      )}
    </div>
  )
}
