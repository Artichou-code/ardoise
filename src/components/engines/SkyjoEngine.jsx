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
      setAlert({
        message: `${game.players.find(p => p.id === endPlayer[0])?.name} a atteint ou dépassé la barre des 100 points.`,
        winnerId: winner,
      })
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
      <div className="school-card rounded-xl p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-2.5">
          Clôtureur de la manche
        </p>
        <div className={`grid gap-2 ${
          game.players.length === 2 ? 'grid-cols-2' :
          game.players.length === 3 ? 'grid-cols-3' :
          game.players.length === 4 ? 'grid-cols-4' :
          game.players.length === 5 ? 'grid-cols-5' :
          game.players.length === 6 ? 'grid-cols-3 sm:grid-cols-6' :
          'grid-cols-4 sm:grid-cols-8'
        }`}>
          {game.players.map(p => {
            const isSelected = closerId === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setCloserId(p.id)}
                className={`flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl border transition-all active:scale-[0.98] w-full text-center cursor-pointer ${
                  isSelected
                    ? 'border-[#c83b3b] bg-[#c83b3b]/10 ring-1 ring-[#c83b3b]/30'
                    : 'school-subtle hover:border-[#c83b3b]/60'
                }`}
              >
                <Avatar player={p} size={game.players.length >= 5 ? 'xs' : 'sm'} leader={isSelected} />
                <span className="text-xs font-semibold truncate max-w-full">
                  {p.name}
                </span>
              </button>
            )
          })}
        </div>
        {closerDoubled && (
          <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-[#c83b3b]/40">
            <AlertTriangle size={14} className="text-[#c83b3b] flex-shrink-0" />
            <p className="text-xs text-[#c83b3b] dark:text-red-300 font-medium">
              Malus Skyjo : le clôtureur n'a pas le score strictement le plus bas (score ×2).
            </p>
          </div>
        )}
      </div>

      {/* Scores de la manche */}
      <div className="school-card rounded-xl p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-3">
          Scores de la manche
        </p>
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
              {closerId === p.id && closerDoubled && (
                <span className="text-xs text-[#c83b3b] font-bold">
                  ×2 ({roundScores[p.id] * 2})
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
        disabled={!canSubmit}
        className="w-full py-3.5 rounded-xl font-bold text-base btn-margin-red disabled:opacity-40"
      >
        Valider la manche
      </button>

      {editingPlayer && (
        <BottomSheet
          open={open}
          onClose={() => setOpen(false)}
          title={`${editingPlayer.name} — Score manche`}
        >
          <div className="px-5 pt-2 pb-6">
            <ScorePad
              value={roundScores[editingPlayer.id] || 0}
              onChange={v => setRoundScores(prev => ({ ...prev, [editingPlayer.id]: v }))}
              onConfirm={() => setOpen(false)}
            />
          </div>
        </BottomSheet>
      )}

      <Dialog open={!!alert} onClose={() => {}} title="Seuil des 100 points atteint">
        <p className="text-sm text-stone-600 dark:text-slate-400 mb-5">{alert?.message}</p>
        <button
          type="button"
          onClick={() => { onFinish(alert.winnerId); setAlert(null) }}
          className="w-full py-3 rounded-xl font-bold btn-margin-red"
        >
          Afficher le palmarès
        </button>
      </Dialog>
    </div>
  )
}
