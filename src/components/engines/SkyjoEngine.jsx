import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { BottomSheet } from '../ui/BottomSheet'
import { ScorePad } from '../ui/ScorePad'
import { QuickScoreBadge } from '../ui/QuickScoreBadge'
import { Avatar } from '../ui/Avatar'
import { useGame } from '../../context/GameContext'
import { computeSkyjoRound, checkSkyjoEnd, isSkyjoScoreDoubled } from '../../engines/gameEngines'
import { Dialog } from '../ui/Dialog'

export function SkyjoEngine({ game, onFinish }) {
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
  const [closerId, setCloserId] = useState(() => {
    return game.restoredRound?.closerId || null
  })
  const [editingPlayer, setEditingPlayer] = useState(null)
  const [open, setOpen] = useState(false)
  const [alert, setAlert] = useState(null)
  const [showZeroConfirm, setShowZeroConfirm] = useState(false)

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

  const handleValidate = () => {
    if (!closerId) return
    const allZero = Object.values(roundScores).every(v => v === 0)
    if (allZero) {
      setShowZeroConfirm(true)
      return
    }
    submitRound()
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
          {game.players.map(p => {
            const current = game.scores[p.id] || 0
            const pts = roundScores[p.id] || 0
            const projected = current + pts

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
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">
                        {p.name}
                      </span>
                      {closerId === p.id && closerDoubled && (
                        <span className="text-xs text-[#c83b3b] font-bold shrink-0">
                          ×2 ({pts * 2})
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-stone-500 dark:text-slate-400 block mt-0.5">
                      {pts !== 0 ? (
                        <>Total : {current} <strong className="text-[#c83b3b] font-bold">➔ {projected} pts</strong> ({pts > 0 ? `+${pts}` : pts})</>
                      ) : (
                        `Total : ${current} pts`
                      )}
                    </span>
                  </div>
                </button>
                <QuickScoreBadge
                  value={roundScores[p.id] || 0}
                  onChange={v => setRoundScores(prev => ({ ...prev, [p.id]: v }))}
                  onOpenPad={() => { setEditingPlayer(p); setOpen(true) }}
                  showPlus={true}
                  formatBubble={(val) => {
                    const proj = current + val
                    if (proj >= 100) {
                      return { text: `💥 ${proj}`, variant: 'danger' }
                    }
                    return { text: `= ${proj}`, variant: 'default' }
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={handleValidate}
        disabled={!canSubmit}
        className="w-full py-3.5 rounded-xl font-bold text-base btn-margin-red disabled:opacity-40 cursor-pointer active:scale-[0.99] transition-all"
      >
        Valider la manche
      </button>

      {/* Dialog d'avertissement scores à 0 */}
      <Dialog
        open={showZeroConfirm}
        onClose={() => setShowZeroConfirm(false)}
        title="Scores à 0 point"
      >
        <div className="space-y-3 text-xs">
          <p className="text-stone-600 dark:text-slate-300 leading-relaxed">
            Tous les joueurs ont un score de <strong>0 point</strong> sur cette manche.
          </p>
          <p className="text-stone-500 dark:text-slate-400">
            Au Skyjo, chaque joueur additionne la valeur de ses 12 cartes révélées. Avez-vous bien renseigné les scores de chacun avant de valider ?
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowZeroConfirm(false)}
              className="w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white btn-margin-red cursor-pointer shadow-xs active:scale-[0.99] transition-all"
            >
              Saisir les scores
            </button>
          </div>
        </div>
      </Dialog>

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
              baseScore={game.scores[editingPlayer.id] || 0}
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
