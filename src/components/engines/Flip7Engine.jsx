import { useState } from 'react'
import { Trophy, Flame, ChevronLeft, ChevronRight } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { Avatar } from '../ui/Avatar'
import { QuickScoreBadge } from '../ui/QuickScoreBadge'
import { BottomSheet } from '../ui/BottomSheet'
import { ScorePad } from '../ui/ScorePad'
import { Dialog } from '../ui/Dialog'

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
  const [showZeroConfirm, setShowZeroConfirm] = useState(false)

  // Navigation séquentielle entre joueurs dans le ScorePad
  const currentEditingIndex = editingPlayer ? game.players.findIndex(p => p.id === editingPlayer.id) : -1
  const hasPrevPlayer = currentEditingIndex > 0
  const hasNextPlayer = currentEditingIndex >= 0 && currentEditingIndex < game.players.length - 1
  const prevPlayer = hasPrevPlayer ? game.players[currentEditingIndex - 1] : null
  const nextPlayer = hasNextPlayer ? game.players[currentEditingIndex + 1] : null

  const handleConfirmPad = () => {
    if (hasNextPlayer) {
      setEditingPlayer(nextPlayer)
    } else {
      setOpen(false)
    }
  }

  const confirmLabel = hasNextPlayer
    ? `Valider & Suivant (${nextPlayer.name})`
    : 'Valider et terminer'

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

  const handleValidate = () => {
    const allZero = Object.values(roundScores).every(v => v === 0)
    const anyBust = Object.values(bustedPlayers).some(Boolean)
    const anyFlip = Object.values(flip7BonusPlayers).some(Boolean)
    if (allZero && !anyBust && !anyFlip) {
      setShowZeroConfirm(true)
      return
    }
    submitRound()
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
                      <div className="text-[11px] text-stone-500 dark:text-slate-400 flex items-center gap-1.5 min-w-0">
                        {roundPts > 0 ? (
                          <span className="truncate">
                            Total : {currentTotal} <strong className="text-emerald-600 dark:text-emerald-400 font-bold">➔ {projected} pts</strong>
                          </span>
                        ) : (
                          <span className="truncate">Total : {currentTotal} pts</span>
                        )}
                      </div>
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
                      <Flame size={11} className={hasFlip7 ? 'text-white' : 'text-stone-400 dark:text-slate-500'} /> Flip 7
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
            onClick={handleValidate}
            className="w-full py-2.5 rounded-xl bg-[#c83b3b] hover:bg-[#b03030] text-white font-bold text-sm shadow-sm transition-all active:scale-[0.99] cursor-pointer"
          >
            Valider la manche
          </button>
        </div>
      </div>

      {/* Dialog d'avertissement scores à 0 */}
      <Dialog
        open={showZeroConfirm}
        onClose={() => setShowZeroConfirm(false)}
        title="Aucun score saisi"
      >
        <div className="space-y-3 text-xs">
          <p className="text-stone-600 dark:text-slate-300 leading-relaxed">
            Tous les joueurs ont un score de <strong>0 point</strong> sur cette manche.
          </p>
          <p className="text-stone-500 dark:text-slate-400">
            Au Flip 7, les joueurs qui ne sont pas éliminés (Bust) marquent la valeur des cartes de leur main. Avez-vous bien renseigné les scores ?
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

      {/* BottomSheet de saisie précise */}
      <BottomSheet open={open} onClose={() => setOpen(false)}>
        {editingPlayer && (
          <div className="px-4 pt-1 pb-6 space-y-3">
            {/* Carte du joueur actif & Navigation Joueur précédent / Joueur suivant */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-stone-100/80 dark:bg-slate-800/60 border border-stone-200/80 dark:border-slate-700/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar
                  player={editingPlayer}
                  size="sm"
                  leader={flip7BonusPlayers[editingPlayer.id]}
                  leaderColor="#f59e0b"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm truncate text-stone-900 dark:text-slate-100">
                      {editingPlayer.name}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-stone-200/80 dark:bg-slate-700 text-stone-600 dark:text-slate-300 shrink-0">
                      {currentEditingIndex + 1}/{game.players.length}
                    </span>
                    {flip7BonusPlayers[editingPlayer.id] && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 shrink-0">
                        Flip 7 (+15)
                      </span>
                    )}
                    {bustedPlayers[editingPlayer.id] && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-stone-200 dark:bg-slate-700 text-stone-600 dark:text-slate-400 shrink-0">
                        Bust (0 pt)
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-stone-500 dark:text-slate-400">
                    Total actuel : {game.scores[editingPlayer.id] || 0} pts
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={!hasPrevPlayer}
                  onClick={() => prevPlayer && setEditingPlayer(prevPlayer)}
                  className="p-1.5 rounded-lg border border-stone-200 dark:border-slate-700 disabled:opacity-25 disabled:pointer-events-none hover:bg-white dark:hover:bg-slate-700 text-stone-600 dark:text-slate-300 transition-all cursor-pointer active:scale-95"
                  title={prevPlayer ? `Précédent : ${prevPlayer.name}` : undefined}
                  aria-label="Joueur précédent"
                >
                  <ChevronLeft size={17} />
                </button>
                <button
                  type="button"
                  disabled={!hasNextPlayer}
                  onClick={() => nextPlayer && setEditingPlayer(nextPlayer)}
                  className="p-1.5 rounded-lg border border-stone-200 dark:border-slate-700 disabled:opacity-25 disabled:pointer-events-none hover:bg-white dark:hover:bg-slate-700 text-stone-600 dark:text-slate-300 transition-all cursor-pointer active:scale-95"
                  title={nextPlayer ? `Suivant : ${nextPlayer.name}` : undefined}
                  aria-label="Joueur suivant"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>

            {/* Raccourcis rapides Bust / Flip 7 */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => toggleBust(editingPlayer.id)}
                className={`p-2 px-3 rounded-xl border flex items-center justify-between text-xs font-semibold transition-all cursor-pointer select-none active:scale-95 ${
                  bustedPlayers[editingPlayer.id]
                    ? 'border-stone-400 bg-stone-200 dark:bg-slate-700 text-stone-900 dark:text-white'
                    : 'school-subtle text-stone-600 dark:text-slate-400 hover:border-stone-400'
                }`}
              >
                <span>{bustedPlayers[editingPlayer.id] ? '✓ Éliminé (Bust)' : 'Bust (0 pt)'}</span>
                <span className="text-[10px] opacity-75">0 pt</span>
              </button>

              <button
                type="button"
                onClick={() => toggleFlip7(editingPlayer.id)}
                className={`p-2 px-3 rounded-xl border flex items-center justify-between text-xs font-semibold transition-all cursor-pointer select-none active:scale-95 ${
                  flip7BonusPlayers[editingPlayer.id]
                    ? 'border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-200 ring-1 ring-amber-500/40'
                    : 'school-subtle text-stone-600 dark:text-slate-400 hover:border-amber-400'
                }`}
              >
                <span className="flex items-center gap-1">
                  <Flame size={13} className="text-amber-500" />
                  <span>{flip7BonusPlayers[editingPlayer.id] ? '✓ Flip 7 !' : 'Flip 7 !'}</span>
                </span>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">+15 pts</span>
              </button>
            </div>

            <ScorePad
              key={editingPlayer.id}
              value={roundScores[editingPlayer.id] || 0}
              onChange={v => handleScoreChange(editingPlayer.id, v)}
              onConfirm={handleConfirmPad}
              confirmLabel={confirmLabel}
              min={0}
              step={1}
              label="Points de la manche"
              subLabel={`Objectif : ${TARGET_SCORE} pts`}
              presets={[0, 10, 15, 20, 25, 30, 40, 50]}
              formatDisplay={v => `${v} pts`}
              formatTotal={val => {
                const cur = game.scores[editingPlayer.id] || 0
                const proj = cur + val
                const isWin = proj >= TARGET_SCORE
                return `+${val} pts · Nouveau total : ${proj}/${TARGET_SCORE} pts${isWin ? ' 🏆 Seuil atteint !' : ''}`
              }}
              baseScore={game.scores[editingPlayer.id] || 0}
              showPlus={false}
              customButtons={[
                { label: '0', delta: -(roundScores[editingPlayer.id] || 0) },
                { label: '+1', delta: 1 },
                { label: '+5', delta: 5 },
                { label: '+10', delta: 10 },
                { label: '+15 (Flip 7)', delta: 15 },
              ]}
            />
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
