import { useState } from 'react'
import { AlertTriangle, Sparkles, Check, Trophy } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { Avatar } from '../ui/Avatar'
import { QuickScoreBadge } from '../ui/QuickScoreBadge'
import { BottomSheet } from '../ui/BottomSheet'
import { ScorePad } from '../ui/ScorePad'

export function RamiEngine({ game, onFinish }) {
  const { updateScores } = useGame()
  const LIMIT = game.config?.limit || 100

  // Gagnant de la manche (celui qui s'est défaussé de toutes ses cartes = 0 pt)
  const [winnerId, setWinnerId] = useState(() => {
    return game.restoredRound?.winnerId || game.players[0]?.id || null
  })

  // Est-ce un Rami Sec ? (pose d'un coup sans avoir rien posé avant -> x2 aux adversaires)
  const [isRamiSec, setIsRamiSec] = useState(() => {
    return game.restoredRound?.isRamiSec || false
  })

  // Pénalités de cartes restant en main pour chaque joueur
  const [handPenalties, setHandPenalties] = useState(() => {
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

  // Calcul du delta de manche pour chaque joueur
  const computePlayerDelta = (playerId) => {
    if (playerId === winnerId) return 0
    const raw = handPenalties[playerId] || 0
    return isRamiSec ? raw * 2 : raw
  }

  const submitRound = () => {
    const newScores = {}
    const delta = {}

    for (const p of game.players) {
      const d = computePlayerDelta(p.id)
      delta[p.id] = d
      newScores[p.id] = (game.scores[p.id] || 0) + d
    }

    updateScores({
      scores: newScores,
      delta,
      winnerId,
      isRamiSec,
      type: 'rami',
    })

    // Réinitialisation
    setHandPenalties(Object.fromEntries(game.players.map(p => [p.id, 0])))
    setIsRamiSec(false)

    // Vérification d'élimination
    const overLimit = Object.entries(newScores).filter(([, s]) => s >= LIMIT)
    if (overLimit.length > 0) {
      const finalWinner = Object.entries(newScores).sort((a, b) => a[1] - b[1])[0][0]
      onFinish(finalWinner)
    }
  }

  return (
    <div className="space-y-2 pt-0">
      <div className="school-card rounded-xl p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
            Résolution de la manche
          </p>
          <span className="text-[11px] font-semibold text-stone-400 dark:text-slate-500">
            Seuil éliminatoire : {LIMIT} pts
          </span>
        </div>

        {/* Sélection du gagnant de la manche & Option Rami Sec */}
        <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-slate-700 mb-2 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-stone-700 dark:text-slate-300">
              Vainqueur de la manche (0 pt) :
            </span>
            <div className="flex gap-1 overflow-x-auto py-0.5">
              {game.players.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setWinnerId(p.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                    winnerId === p.id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-400'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1.5 border-t border-stone-200/80 dark:border-slate-700/80">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-stone-700 dark:text-slate-300">
                Rami Sec (posé d'un coup) :
              </span>
              <span className="text-[10px] text-stone-400 hidden xs:inline">Double les pénalités</span>
            </div>
            <button
              type="button"
              onClick={() => setIsRamiSec(v => !v)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                isRamiSec
                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                  : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-400 hover:border-amber-400'
              }`}
            >
              {isRamiSec ? '⚡ Rami Sec (x2)' : 'Normal'}
            </button>
          </div>
        </div>

        {/* Liste des pénalités des autres joueurs */}
        <div className="space-y-1.5">
          {game.players.map(p => {
            const isWinner = winnerId === p.id
            const currentTotal = game.scores[p.id] || 0
            const delta = computePlayerDelta(p.id)
            const projected = currentTotal + delta
            const danger = currentTotal >= LIMIT - 20
            const rawPts = handPenalties[p.id] || 0

            return (
              <div
                key={p.id}
                className={`px-3 py-2 rounded-xl border transition-all ${
                  isWinner
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'school-subtle hover:border-stone-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar player={p} size="xs" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm truncate">{p.name}</span>
                        {isWinner && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                            Vainqueur (0 pt)
                          </span>
                        )}
                        {danger && !isWinner && <AlertTriangle size={13} className="text-[#c83b3b] shrink-0" />}
                      </div>
                      <span className="text-[11px] text-stone-500 dark:text-slate-400 block">
                        Pénalités : {currentTotal} pts {!isWinner && delta > 0 && <span className="text-[#c83b3b] font-bold">(+{delta} = {projected})</span>}
                      </span>
                    </div>
                  </div>

                  {!isWinner && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <QuickScoreBadge
                        value={rawPts}
                        onChange={v => setHandPenalties(prev => ({ ...prev, [p.id]: Math.max(0, v) }))}
                        onOpenPad={() => { setEditingPlayer(p); setOpen(true) }}
                        min={0}
                        step={1}
                        showPlus={true}
                        formatDisplay={(v) => `${isRamiSec ? v * 2 : v} pts`}
                        formatBubble={(v) => {
                          const d = isRamiSec ? v * 2 : v
                          const proj = currentTotal + d
                          return {
                            text: `+${d} pts (total ${proj})`,
                            variant: proj >= LIMIT ? 'danger' : 'default',
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-2.5 pt-2 border-t border-stone-200/80 dark:border-slate-800">
          <button
            type="button"
            onClick={submitRound}
            className="w-full py-2.5 rounded-xl bg-[#c83b3b] hover:bg-[#b03030] text-white font-bold text-sm shadow-sm transition-all active:scale-[0.99] cursor-pointer"
          >
            Valider la manche
          </button>
        </div>
      </div>

      {/* BottomSheet saisie de pénalités de main */}
      <BottomSheet open={open} onClose={() => setOpen(false)}>
        {editingPlayer && (
          <div className="p-4">
            <h3 className="font-serif-title font-bold text-lg mb-1">
              Cartes en main de {editingPlayer.name}
            </h3>
            <p className="text-xs text-stone-500 dark:text-slate-400 mb-4">
              Additionnez les points des cartes restantes (Figures = 10, As = 11, Joker = 20).
            </p>
            <ScorePad
              value={handPenalties[editingPlayer.id] || 0}
              onChange={v => setHandPenalties(prev => ({ ...prev, [editingPlayer.id]: Math.max(0, v) }))}
              onConfirm={() => setOpen(false)}
              min={0}
              step={1}
              label="Pénalités de main"
              showPlus={true}
              customButtons={[
                { label: '0 pt', value: 0 },
                { label: '+10 (Figure)', value: (handPenalties[editingPlayer.id] || 0) + 10 },
                { label: '+11 (As)', value: (handPenalties[editingPlayer.id] || 0) + 11 },
                { label: '+20 (Joker)', value: (handPenalties[editingPlayer.id] || 0) + 20 },
                { label: '+25', value: (handPenalties[editingPlayer.id] || 0) + 25 },
                { label: '+30', value: (handPenalties[editingPlayer.id] || 0) + 30 },
              ]}
            />
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
