import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { Avatar } from '../ui/Avatar'
import { BottomSheet } from '../ui/BottomSheet'
import { ScorePad } from '../ui/ScorePad'

export function SixQuiPrendEngine({ game, onFinish }) {
  const { updateScores } = useGame()
  const [roundScores, setRoundScores] = useState(
    Object.fromEntries(game.players.map(p => [p.id, 0]))
  )
  const [editingPlayer, setEditingPlayer] = useState(null)
  const [open, setOpen] = useState(false)

  const ELIMINATION_SCORE = 66

  const submitRound = () => {
    const newScores = {}
    const delta = {}
    for (const p of game.players) {
      const heads = roundScores[p.id] || 0
      newScores[p.id] = (game.scores[p.id] || 0) + heads
      delta[p.id] = heads
    }
    updateScores({ scores: newScores, delta, type: 'six_qui_prend' })
    setRoundScores(Object.fromEntries(game.players.map(p => [p.id, 0])))

    const eliminated = Object.entries(newScores).filter(([, s]) => s >= ELIMINATION_SCORE)
    if (eliminated.length > 0) {
      const winner = Object.entries(newScores).sort((a, b) => a[1] - b[1])[0][0]
      onFinish(winner)
    }
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="school-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
            Têtes de bœuf ramassées
          </p>
          <span className="text-[11px] font-semibold text-stone-400 dark:text-slate-500">
            Arrêt à 66 têtes
          </span>
        </div>
        <div className="space-y-2">
          {game.players.map(p => {
            const total = game.scores[p.id] || 0
            const danger = total >= 50
            return (
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
                {danger && <AlertTriangle size={14} className="text-[#c83b3b]" />}
                <span className="text-xs font-medium text-stone-500 dark:text-slate-400">
                  Cumul : {total}/66
                </span>
                <span className="text-lg font-black tabular-nums ml-2 text-[#c83b3b]">
                  +{roundScores[p.id] || 0}
                </span>
              </button>
            )
          })}
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
          title={`${editingPlayer.name} — Têtes ramassées`}
        >
          <div className="px-5 pb-6">
            <ScorePad
              value={roundScores[editingPlayer.id] || 0}
              onChange={v => setRoundScores(prev => ({ ...prev, [editingPlayer.id]: Math.max(0, v) }))}
              onConfirm={() => setOpen(false)}
              min={0}
            />
          </div>
        </BottomSheet>
      )}
    </div>
  )
}
