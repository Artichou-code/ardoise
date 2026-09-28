import { useState } from 'react'
import { useGame } from '../../context/GameContext'
import { Avatar } from '../ui/Avatar'
import { BottomSheet } from '../ui/BottomSheet'
import { ScorePad } from '../ui/ScorePad'
import { GAME_META } from '../../constants/games'

export function UniverselEngine({ game, onFinish }) {
  const { updateScores } = useGame()
  const [roundScores, setRoundScores] = useState(Object.fromEntries(game.players.map(p => [p.id, 0])))
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

    // Vérifier fin
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
      <div className="flex items-center gap-2 px-1">
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          {scoreDir === 'high' ? '🏅 Le score le plus élevé gagne' : `💀 Premier à ${limit} pts perd`}
        </span>
      </div>

      <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">
          Points de la manche
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
              {limit && (
                <span className="text-xs text-zinc-400">{game.scores[p.id] || 0}/{limit}</span>
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
        className="w-full py-3.5 rounded-xl font-bold text-base text-[#18181b] transition-all active:scale-[0.98]"
        style={{ backgroundColor: '#fcc817' }}
      >
        Valider la manche
      </button>

      {editingPlayer && (
        <BottomSheet open={open} onClose={() => setOpen(false)} title={`${editingPlayer.emoji} ${editingPlayer.name}`}>
          <div className="px-4 pb-6">
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
