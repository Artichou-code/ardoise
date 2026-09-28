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

    // Vérifier fin (un joueur a ≥ seuil — configurable, défaut 100)
    const limit = game.config?.limit || 100
    const eliminated = Object.entries(newScores).find(([, s]) => s >= limit)
    if (eliminated) {
      const winner = Object.entries(newScores).sort((a, b) => a[1] - b[1])[0][0]
      onFinish(winner)
    }
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
          Saisir les cartes restantes en main de chaque joueur (pénalités).
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
              <span className="text-lg font-black tabular-nums text-zinc-900 dark:text-zinc-100">
                +{roundPenalties[p.id] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={submitRound}
        className="w-full py-3.5 rounded-xl font-bold text-base text-[#18181b] transition-all active:scale-[0.98]"
        style={{ backgroundColor: '#fcc817' }}
      >
        Valider la manche
      </button>

      {editingPlayer && (
        <BottomSheet
          open={open}
          onClose={() => setOpen(false)}
          title={`${editingPlayer.emoji} ${editingPlayer.name} — Cartes restantes`}
        >
          <div className="px-4 pb-6">
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
