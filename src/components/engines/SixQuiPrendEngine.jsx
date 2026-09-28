import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { Avatar } from '../ui/Avatar'
import { BottomSheet } from '../ui/BottomSheet'
import { ScorePad } from '../ui/ScorePad'

export function SixQuiPrendEngine({ game, onFinish }) {
  const { updateScores } = useGame()
  const [roundScores, setRoundScores] = useState(Object.fromEntries(game.players.map(p => [p.id, 0])))
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

    // Vérifier élimination
    const eliminated = Object.entries(newScores).filter(([, s]) => s >= ELIMINATION_SCORE)
    if (eliminated.length > 0) {
      const winner = Object.entries(newScores).sort((a, b) => a[1] - b[1])[0][0]
      onFinish(winner)
    }
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
          Saisir les têtes de bœuf ramassées (élimination à 66 🐂)
        </p>
        <div className="space-y-2">
          {game.players.map(p => {
            const total = (game.scores[p.id] || 0)
            const danger = total >= 50
            return (
              <button
                key={p.id}
                onClick={() => { setEditingPlayer(p); setOpen(true) }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 active:scale-[0.98] transition-all"
              >
                <Avatar player={p} size="xs" />
                <span className="flex-1 font-semibold text-sm text-left text-zinc-900 dark:text-zinc-100">{p.name}</span>
                {danger && <AlertTriangle size={14} className="text-orange-400" />}
                <span className="text-xs text-zinc-400">+{roundScores[p.id] || 0}</span>
                <span className={`text-base font-black tabular-nums ml-2 ${danger ? 'text-orange-500' : 'text-zinc-900 dark:text-zinc-100'}`}>
                  {total}🐂
                </span>
              </button>
            )
          })}
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
        <BottomSheet open={open} onClose={() => setOpen(false)} title={`${editingPlayer.emoji} ${editingPlayer.name} — Têtes ramassées`}>
          <div className="px-4 pb-6">
            <ScorePad
              value={roundScores[editingPlayer.id] || 0}
              onChange={v => setRoundScores(prev => ({ ...prev, [editingPlayer.id]: Math.max(0, v) }))}
              onConfirm={() => setOpen(false)}
            />
          </div>
        </BottomSheet>
      )}
    </div>
  )
}
