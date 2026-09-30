import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { Avatar } from '../ui/Avatar'
import { BottomSheet } from '../ui/BottomSheet'
import { ScorePad } from '../ui/ScorePad'
import { QuickScoreBadge } from '../ui/QuickScoreBadge'

export function SixQuiPrendEngine({ game, onFinish }) {
  const { updateScores } = useGame()
  const [roundScores, setRoundScores] = useState(() => {
    const initial = {}
    for (const p of game.players) {
      initial[p.id] = (game.restoredDelta && game.restoredDelta[p.id] != null)
        ? game.restoredDelta[p.id]
        : 0
    }
    return initial
  })
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
            const heads = roundScores[p.id] || 0
            return (
              <div
                key={p.id}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl school-subtle hover:border-[#c83b3b]/60 transition-all"
              >
                <button
                  type="button"
                  onClick={() => { setEditingPlayer(p); setOpen(true) }}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer focus:outline-none select-none active:opacity-80 transition-opacity"
                >
                  <Avatar player={p} size="xs" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm truncate">
                        {p.name}
                      </span>
                      {danger && <AlertTriangle size={13} className="text-[#c83b3b] shrink-0" />}
                    </div>
                    <span className="text-[11px] font-medium text-stone-500 dark:text-slate-400 block mt-0.5">
                      Cumul : {total}/66
                    </span>
                  </div>
                </button>
                <QuickScoreBadge
                  value={heads}
                  onChange={v => setRoundScores(prev => ({ ...prev, [p.id]: Math.max(0, v) }))}
                  onOpenPad={() => { setEditingPlayer(p); setOpen(true) }}
                  min={0}
                  showPlus={true}
                  formatBubble={(val) => {
                    const current = game.scores[p.id] || 0
                    const proj = current + val
                    if (proj >= 66) {
                      return { text: `Total : ${proj}/66 🐮 (Fin !)`, variant: 'danger' }
                    }
                    return { text: `Total : ${proj}/66 🐮`, variant: 'default' }
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={submitRound}
        className="w-full py-3.5 rounded-xl font-bold text-base btn-margin-red"
      >
        {game.isCorrection ? 'Valider la correction' : 'Valider la manche'}
      </button>

      {editingPlayer && (
        <BottomSheet
          open={open}
          onClose={() => setOpen(false)}
          title={`${editingPlayer.name} — Têtes ramassées`}
        >
          <div className="px-5 pt-2 pb-6">
            <ScorePad
              value={roundScores[editingPlayer.id] || 0}
              onChange={v => setRoundScores(prev => ({ ...prev, [editingPlayer.id]: Math.max(0, v) }))}
              onConfirm={() => setOpen(false)}
              min={0}
              baseScore={game.scores[editingPlayer.id] || 0}
              formatTotal={(val) => `Total : ${(game.scores[editingPlayer.id] || 0) + val}/66 🐮`}
            />
          </div>
        </BottomSheet>
      )}
    </div>
  )
}
