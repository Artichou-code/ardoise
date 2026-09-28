import { useState } from 'react'
import { useGame } from '../../context/GameContext'
import { Avatar } from '../ui/Avatar'
import { BottomSheet } from '../ui/BottomSheet'
import { ScorePad } from '../ui/ScorePad'

export function UniverselEngine({ game, onFinish }) {
  const { updateScores } = useGame()
  const [roundScores, setRoundScores] = useState(
    Object.fromEntries(game.players.map(p => [p.id, 0]))
  )
  const [editingPlayer, setEditingPlayer] = useState(null)
  const [open, setOpen] = useState(false)

  const scoreDir = game.config?.scoreDir || 'high'
  const limit = game.config?.limit || null

  const submitRound = () => {
    const newScores = {}
    const delta = {}
    for (const p of game.players) {
      delta[p.id] = roundScores[p.id] || 0
      newScores[p.id] = (game.scores[p.id] || 0) + (roundScores[p.id] || 0)
    }
    updateScores({ scores: newScores, delta, type: 'universel' })
    setRoundScores(Object.fromEntries(game.players.map(p => [p.id, 0])))

    if (scoreDir === 'low_limit' && limit) {
      const eliminated = Object.entries(newScores).find(([, s]) => s >= limit)
      if (eliminated) {
        const winner = Object.entries(newScores).sort((a, b) => a[1] - b[1])[0][0]
        onFinish(winner)
      }
    }
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="school-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
            Points de la manche
          </p>
          <span className="text-[11px] font-semibold text-stone-400 dark:text-slate-500">
            {scoreDir === 'high' ? 'Score élevé gagne' : `Seuil : ${limit} pts`}
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
              {scoreDir === 'low_limit' && limit && (
                <span className="text-xs text-stone-400 dark:text-slate-500">
                  {game.scores[p.id] || 0}/{limit}
                </span>
              )}
              <span className="text-lg font-black tabular-nums">
                {roundScores[p.id] >= 0 ? '+' : ''}{roundScores[p.id]}
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
          title={`${editingPlayer.name} — Points manche`}
        >
          <div className="px-5 pb-6">
            <ScorePad
              value={roundScores[editingPlayer.id] || 0}
              onChange={v => setRoundScores(prev => ({ ...prev, [editingPlayer.id]: v }))}
              onConfirm={() => setOpen(false)}
            />
          </div>
        </BottomSheet>
      )}
    </div>
  )
}
