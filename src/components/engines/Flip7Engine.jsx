import { useState } from 'react'
import { Sparkles, Trophy, Flame } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { Avatar } from '../ui/Avatar'
import { QuickScoreBadge } from '../ui/QuickScoreBadge'
import { BottomSheet } from '../ui/BottomSheet'
import { ScorePad } from '../ui/ScorePad'

export function Flip7Engine({ game, onFinish }) {
  const { updateScores } = useGame()
  const TARGET_SCORE = game.config?.limit || 200

  const [roundScores, setRoundScores] = useState(() => {
    const initial = {}
    for (const p of game.players) {
      initial[p.id] = (game.restoredDelta && game.restoredDelta[p.id] != null)
        ? game.restoredDelta[p.id]
        : 0
    }
    return initial
  })

  // Suivi des joueurs ayant réussi un coup « Flip 7 ! » lors de la manche (+15 pts bonus)
  const [flip7BonusPlayers, setFlip7BonusPlayers] = useState(() => {
    return game.restoredRound?.flip7BonusPlayers || {}
  })

  // Suivi des joueurs éliminés (Bust) lors de la manche (score à 0)
  const [bustedPlayers, setBustedPlayers] = useState(() => {
    return game.restoredRound?.bustedPlayers || {}
  })

  const [editingPlayer, setEditingPlayer] = useState(null)
  const [open, setOpen] = useState(false)

  const toggleFlip7 = (playerId) => {
    setBustedPlayers(prev => ({ ...prev, [playerId]: false }))
    setFlip7BonusPlayers(prev => {
      const active = !prev[playerId]
      if (active) {
        // Ajouter le bonus de 15 points
        setRoundScores(rs => ({ ...rs, [playerId]: (rs[playerId] || 0) + 15 }))
      } else {
        // Retirer le bonus
        setRoundScores(rs => ({ ...rs, [playerId]: Math.max(0, (rs[playerId] || 0) - 15) }))
      }
      return { ...prev, [playerId]: active }
    })
  }

  const toggleBust = (playerId) => {
    setBustedPlayers(prev => {
      const nextBust = !prev[playerId]
      if (nextBust) {
        setRoundScores(rs => ({ ...rs, [playerId]: 0 }))
        setFlip7BonusPlayers(fs => ({ ...fs, [playerId]: false }))
      }
      return { ...prev, [playerId]: nextBust }
    })
  }

  const handleScoreChange = (playerId, val) => {
    const nextVal = Math.max(0, val)
    setRoundScores(prev => ({ ...prev, [playerId]: nextVal }))
    if (nextVal > 0) {
      setBustedPlayers(prev => ({ ...prev, [playerId]: false }))
    }
  }

  const submitRound = () => {
    const newScores = {}
    const delta = {}

    for (const p of game.players) {
      const pts = roundScores[p.id] || 0
      delta[p.id] = pts
      newScores[p.id] = (game.scores[p.id] || 0) + pts
    }

    updateScores({
      scores: newScores,
      delta,
      flip7BonusPlayers,
      bustedPlayers,
      type: 'flip_7',
    })

    setRoundScores(Object.fromEntries(game.players.map(p => [p.id, 0])))
    setFlip7BonusPlayers({})
    setBustedPlayers({})

    // Vérification de victoire : premier à atteindre 200 points
    const winners = Object.entries(newScores).filter(([, s]) => s >= TARGET_SCORE)
    if (winners.length > 0) {
      const winner = Object.entries(newScores).sort((a, b) => b[1] - a[1])[0][0]
      onFinish(winner)
    }
  }

  return (
    <div className="space-y-2 pt-0">
      <div className="school-card rounded-xl p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
            Scores de la manche
          </p>
          <span className="text-[11px] font-semibold text-stone-400 dark:text-slate-500">
            Objectif : {TARGET_SCORE} pts
          </span>
        </div>

        <div className="space-y-1.5">
          {game.players.map(p => {
            const currentTotal = game.scores[p.id] || 0
            const roundPts = roundScores[p.id] || 0
            const projected = currentTotal + roundPts
            const isNearWin = projected >= TARGET_SCORE
            const hasFlip7 = !!flip7BonusPlayers[p.id]
            const isBust = !!bustedPlayers[p.id]

            return (
              <div
                key={p.id}
                className={`px-3 py-2 rounded-xl border transition-all ${
                  hasFlip7
                    ? 'border-amber-400/80 bg-amber-50/40 dark:bg-amber-950/20'
                    : isNearWin
                    ? 'border-emerald-400/80 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'school-subtle hover:border-stone-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => { setEditingPlayer(p); setOpen(true) }}
                    className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer select-none"
                  >
                    <Avatar player={p} size="xs" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm truncate">{p.name}</span>
                        {isNearWin && <Trophy size={13} className="text-emerald-600 shrink-0" />}
                        {hasFlip7 && <Flame size={13} className="text-amber-500 shrink-0" />}
                      </div>
                      <span className="text-[11px] text-stone-500 dark:text-slate-400 block">
                        Total : {currentTotal} pts {roundPts > 0 && <span className="text-emerald-600 dark:text-emerald-400 font-bold">(+{roundPts} = {projected})</span>}
                      </span>
                    </div>
                  </button>

                  {/* Actions rapides Bust et Flip 7 */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleBust(p.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border cursor-pointer select-none ${
                        isBust
                          ? 'border-[#c83b3b] bg-[#c83b3b] text-white shadow-2xs'
                          : 'school-subtle text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-200 hover:border-stone-300 dark:hover:border-slate-600'
                      }`}
                      title={isBust ? "Annuler le Bust" : "Marquer comme Bust (0 point pour la manche)"}
                    >
                      Bust
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleFlip7(p.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border cursor-pointer select-none ${
                        hasFlip7
                          ? 'border-amber-600 bg-amber-600 text-white shadow-2xs'
                          : 'school-subtle text-stone-600 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-300 hover:border-amber-400/60'
                      }`}
                      title={hasFlip7 ? "Désactiver le bonus Flip 7" : "Activer le bonus de manche Flip 7 (+15 points)"}
                    >
                      <Sparkles size={11} className={hasFlip7 ? 'text-white' : 'text-stone-400 dark:text-slate-500'} /> Flip 7
                    </button>

                    {/* Badge de score avec roulette */}
                    <QuickScoreBadge
                      value={roundPts}
                      onChange={v => handleScoreChange(p.id, v)}
                      onOpenPad={() => { setEditingPlayer(p); setOpen(true) }}
                      min={0}
                      step={1}
                      showPlus={true}
                      formatBubble={(v) => {
                        const proj = currentTotal + v
                        if (proj >= TARGET_SCORE) {
                          return { text: `🏆 ${proj} pts (Gagné !)`, variant: 'success' }
                        }
                        return { text: `= ${proj} pts`, variant: 'default' }
                      }}
                    />
                  </div>
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

      {/* BottomSheet de saisie précise */}
      <BottomSheet open={open} onClose={() => setOpen(false)}>
        {editingPlayer && (
          <div className="p-4">
            <h3 className="font-serif-title font-bold text-lg mb-1">
              Points de {editingPlayer.name}
            </h3>
            <p className="text-xs text-stone-500 dark:text-slate-400 mb-4">
              Indiquez les points cumulés des cartes de la manche.
            </p>
            <ScorePad
              value={roundScores[editingPlayer.id] || 0}
              onChange={v => handleScoreChange(editingPlayer.id, v)}
              onConfirm={() => setOpen(false)}
              min={0}
              step={1}
              label="Points de la manche"
              showPlus={true}
              customButtons={[
                { label: '0 (Bust)', value: 0 },
                { label: '+5', value: (roundScores[editingPlayer.id] || 0) + 5 },
                { label: '+10', value: (roundScores[editingPlayer.id] || 0) + 10 },
                { label: '+15 (Flip 7)', value: (roundScores[editingPlayer.id] || 0) + 15 },
                { label: '+20', value: (roundScores[editingPlayer.id] || 0) + 20 },
                { label: '+25', value: (roundScores[editingPlayer.id] || 0) + 25 },
                { label: '+30', value: (roundScores[editingPlayer.id] || 0) + 30 },
                { label: '+50', value: (roundScores[editingPlayer.id] || 0) + 50 },
              ]}
            />
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
