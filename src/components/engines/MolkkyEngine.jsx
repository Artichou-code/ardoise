import { useState, useMemo } from 'react'
import { Trophy, Target, Users, AlertTriangle, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { Avatar } from '../ui/Avatar'
import { QuickScoreBadge } from '../ui/QuickScoreBadge'
import { BottomSheet } from '../ui/BottomSheet'
import { ScorePad } from '../ui/ScorePad'
import { formatTeamNames } from '../../utils/gameUtils'

export function MolkkyEngine({ game, onFinish }) {
  const { updateScores } = useGame()
  const isTeamMode = game.config?.mode === 'team' && game.players.length === 4

  // Points marqués lors de cette manche par chaque joueur (0 à 12 en un lancer standard)
  const [roundPoints, setRoundPoints] = useState(() => {
    const init = {}
    for (const p of game.players) {
      if (game.restoredRound?.roundPoints?.[p.id] != null) {
        init[p.id] = game.restoredRound.roundPoints[p.id]
      } else if (game.restoredDelta?.[p.id] != null) {
        init[p.id] = game.restoredDelta[p.id]
      } else {
        init[p.id] = 0
      }
    }
    return init
  })

  // Joueur en cours d'édition dans le ScorePad
  const [editingPlayer, setEditingPlayer] = useState(null)

  // Calcul du nombre de lancers ratés (0 point) consécutifs passés pour chaque joueur
  const pastZeroStreaks = useMemo(() => {
    const streaks = {}
    const rounds = Array.isArray(game.rounds) ? game.rounds : []

    for (const p of game.players) {
      let count = 0
      for (let i = rounds.length - 1; i >= 0; i--) {
        const round = rounds[i]
        const d = round?.delta?.[p.id]
        if (d === 0) {
          count++
        } else {
          break
        }
      }
      streaks[p.id] = count
    }
    return streaks
  }, [game.rounds, game.players])

  // Navigation dans le ScorePad
  const activeIndex = editingPlayer ? game.players.findIndex(p => p.id === editingPlayer.id) : -1
  const hasNextPlayer = activeIndex >= 0 && activeIndex < game.players.length - 1
  const hasPrevPlayer = activeIndex > 0
  const nextPlayer = hasNextPlayer ? game.players[activeIndex + 1] : null
  const prevPlayer = hasPrevPlayer ? game.players[activeIndex - 1] : null

  const handleNextInPad = () => {
    if (hasNextPlayer && nextPlayer) {
      setEditingPlayer(nextPlayer)
    } else {
      setEditingPlayer(null)
    }
  }

  const handlePrevInPad = () => {
    if (hasPrevPlayer && prevPlayer) {
      setEditingPlayer(prevPlayer)
    }
  }

  // Calcul des scores prévisionnels après cette manche
  const calculatedResult = useMemo(() => {
    const currentScores = game.scores || {}
    const newScores = {}
    const deltas = {}
    const projectedNewTotals = {}
    const overflowPlayers = new Set()
    const winningPlayers = new Set()
    const eliminatedPlayers = new Set()

    if (isTeamMode) {
      const pNous = [game.players[0], game.players[1]]
      const pEux = [game.players[2], game.players[3]]

      const oldScoreT1 = (currentScores[pNous[0]?.id] || 0) + (currentScores[pNous[1]?.id] || 0)
      const oldScoreT2 = (currentScores[pEux[0]?.id] || 0) + (currentScores[pEux[1]?.id] || 0)

      const roundT1 = (roundPoints[pNous[0]?.id] || 0) + (roundPoints[pNous[1]?.id] || 0)
      const roundT2 = (roundPoints[pEux[0]?.id] || 0) + (roundPoints[pEux[1]?.id] || 0)

      let totalT1 = oldScoreT1 + roundT1
      let totalT2 = oldScoreT2 + roundT2

      const overflowT1 = totalT1 > 50
      const overflowT2 = totalT2 > 50

      if (overflowT1) {
        totalT1 = 25
        overflowPlayers.add('nous')
      }
      if (overflowT2) {
        totalT2 = 25
        overflowPlayers.add('eux')
      }

      if (totalT1 === 50) winningPlayers.add('nous')
      if (totalT2 === 50) winningPlayers.add('eux')

      // Répartition des points pour les stats individuelles
      newScores[pNous[0].id] = overflowT1 ? 25 : (currentScores[pNous[0].id] || 0) + (roundPoints[pNous[0].id] || 0)
      newScores[pNous[1].id] = overflowT1 ? 0 : (currentScores[pNous[1].id] || 0) + (roundPoints[pNous[1].id] || 0)
      deltas[pNous[0].id] = roundPoints[pNous[0].id] || 0
      deltas[pNous[1].id] = roundPoints[pNous[1].id] || 0

      newScores[pEux[0].id] = overflowT2 ? 25 : (currentScores[pEux[0].id] || 0) + (roundPoints[pEux[0].id] || 0)
      newScores[pEux[1].id] = overflowT2 ? 0 : (currentScores[pEux[1].id] || 0) + (roundPoints[pEux[1].id] || 0)
      deltas[pEux[0].id] = roundPoints[pEux[0].id] || 0
      deltas[pEux[1].id] = roundPoints[pEux[1].id] || 0

      projectedNewTotals['nous'] = totalT1
      projectedNewTotals['eux'] = totalT2
    } else {
      for (const p of game.players) {
        const cur = currentScores[p.id] || 0
        const pts = roundPoints[p.id] || 0
        let nextTotal = cur + pts

        if (nextTotal > 50) {
          overflowPlayers.add(p.id)
          nextTotal = 25
        } else if (nextTotal === 50) {
          winningPlayers.add(p.id)
        }

        const streak = (pts === 0 ? (pastZeroStreaks[p.id] || 0) + 1 : 0)
        if (streak >= 3) {
          eliminatedPlayers.add(p.id)
        }

        projectedNewTotals[p.id] = nextTotal
        newScores[p.id] = nextTotal
        deltas[p.id] = pts
      }
    }

    return {
      newScores,
      deltas,
      projectedNewTotals,
      overflowPlayers,
      winningPlayers,
      eliminatedPlayers,
    }
  }, [game.scores, game.players, roundPoints, isTeamMode, pastZeroStreaks])

  const handleValidate = () => {
    const { newScores, deltas, winningPlayers } = calculatedResult

    updateScores({
      scores: newScores,
      delta: deltas,
      roundPoints,
      isTeamMode,
      type: 'molkky',
    })

    // Fin de partie automatique si 50 points atteints pile
    if (winningPlayers.size > 0) {
      if (isTeamMode) {
        const winningTeam = winningPlayers.has('nous') ? 'nous' : 'eux'
        const winnerPlayerId = winningTeam === 'nous' ? game.players[0]?.id : game.players[2]?.id
        setTimeout(() => {
          onFinish?.(winnerPlayerId)
        }, 150)
      } else {
        const firstWinner = Array.from(winningPlayers)[0]
        setTimeout(() => {
          onFinish?.(firstWinner)
        }, 150)
      }
    }
  }

  return (
    <div className="space-y-3 pb-8">
      {/* Barre d'en-tête du jeu */}
      <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl school-card border border-stone-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          <span className="p-1.5 rounded-xl bg-[#c83b3b]/10 text-[#c83b3b] shrink-0">
            {isTeamMode ? <Users size={16} /> : <Target size={16} />}
          </span>
          <div className="min-w-0">
            <h3 className="font-serif-title font-bold text-xs sm:text-sm text-stone-900 dark:text-slate-100 truncate">
              {isTeamMode ? 'Mölkky — Équipe 2 vs 2' : 'Mölkky — Individuel'}
            </h3>
            <p className="text-[10px] text-stone-500 dark:text-slate-400 truncate">
              Objectif : 50 points pile · Si &gt; 50 ➔ retombe à 25 pts · 3 ratés = éliminé
            </p>
          </div>
        </div>
      </div>

      {/* Cartes de saisie des joueurs */}
      <div className="space-y-2.5">
        {game.players.map((p, pIdx) => {
          const currentTotal = game.scores?.[p.id] || 0
          const pts = roundPoints[p.id] || 0
          const pastZeros = pastZeroStreaks[p.id] || 0
          const nextStreak = pts === 0 ? pastZeros + 1 : 0
          const isOverflow = !isTeamMode && calculatedResult.overflowPlayers.has(p.id)
          const isWinner = !isTeamMode && calculatedResult.winningPlayers.has(p.id)
          const isEliminated = !isTeamMode && calculatedResult.eliminatedPlayers.has(p.id)
          const projectedTotal = !isTeamMode ? calculatedResult.projectedNewTotals[p.id] : null

          return (
            <div
              key={p.id}
              className={`p-3 rounded-2xl school-card border transition-all ${
                isWinner
                  ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/40'
                  : isOverflow
                  ? 'border-amber-500/80 bg-amber-500/5'
                  : isEliminated
                  ? 'border-red-500/80 bg-red-500/5 opacity-80'
                  : 'border-stone-200/90 dark:border-slate-800'
              }`}
            >
              {/* Ligne 1 : Joueur, Total actuel, et Champ de score */}
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar player={p} size="sm" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-serif-title font-bold text-sm text-stone-900 dark:text-slate-100 truncate">
                        {p.name}
                      </span>
                      {isTeamMode && (
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md ${
                          pIdx < 2
                            ? 'bg-[#c83b3b]/15 text-[#c83b3b]'
                            : 'bg-[#1e3a5f]/15 text-[#1e3a5f] dark:text-sky-400'
                        }`}>
                          Éq. {pIdx < 2 ? '1' : '2'}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-stone-400 dark:text-slate-500">
                      Score actuel : {currentTotal} pts
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <QuickScoreBadge
                    value={pts}
                    onChange={(val) => setRoundPoints(prev => ({ ...prev, [p.id]: Math.max(0, Number(val) || 0) }))}
                    onOpenPad={() => setEditingPlayer(p)}
                    min={0}
                    max={12}
                    step={1}
                    values={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}
                    formatSub={(v) => (v === 0 ? 'Raté' : null)}
                    showPlus={true}
                  />
                </div>
              </div>

              {/* Statut et alertes pour ce joueur */}
              {!isTeamMode && (
                <div className="pt-2 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    {isWinner ? (
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Trophy size={13} />
                        50 points pile ! Victoire immédiate !
                      </span>
                    ) : isOverflow ? (
                      <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertTriangle size={13} />
                        Dépassement ({currentTotal + pts} pts) ➔ Chute à 25 points !
                      </span>
                    ) : (
                      <span className="text-stone-500 dark:text-slate-400 font-medium">
                        Nouveau total : <strong className="text-stone-800 dark:text-slate-200">{projectedTotal}</strong> / 50 pts
                      </span>
                    )}
                  </div>

                  {/* Alerte ratés consécutifs */}
                  {nextStreak > 0 && (
                    <span className={`font-semibold px-1.5 py-0.2 rounded text-[10px] ${
                      nextStreak >= 3
                        ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                        : 'bg-stone-200/60 dark:bg-slate-800 text-stone-500 dark:text-slate-400'
                    }`}>
                      {nextStreak >= 3 ? 'Éliminé (3 ratés d’affilée)' : `${nextStreak} raté${nextStreak > 1 ? 's' : ''} consécutif${nextStreak > 1 ? 's' : ''}`}
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Aperçu de la manche par équipe si mode équipe actif */}
      {isTeamMode && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between px-1">
            <span className="font-serif-title font-bold text-xs text-stone-700 dark:text-slate-300 flex items-center gap-1.5">
              <Users size={13} className="text-[#c83b3b]" />
              Aperçu des Équipes
            </span>
            <span className="text-[10px] text-stone-400 dark:text-slate-500 font-medium">
              Objectif 50 pts combinés
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Équipe 1 */}
            {(() => {
              const pNous = [game.players[0], game.players[1]]
              const roundT1 = (roundPoints[pNous[0]?.id] || 0) + (roundPoints[pNous[1]?.id] || 0)
              const isOverflow = calculatedResult.overflowPlayers.has('nous')
              const isWinner = calculatedResult.winningPlayers.has('nous')
              const nextTotal = calculatedResult.projectedNewTotals['nous']

              return (
                <div className={`flex flex-col justify-between rounded-xl px-2.5 py-2 sm:px-3 sm:py-2.5 min-h-[58px] school-card border transition-all ${
                  isWinner
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : isOverflow
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-[#c83b3b]/30 bg-[#c83b3b]/5 dark:bg-[#c83b3b]/10'
                }`}>
                  <div className="flex items-center justify-between w-full">
                    <div className="shrink-0 relative inline-flex items-center">
                      <div className="flex items-center -space-x-2.5">
                        <Avatar player={pNous[0]} size="sm-compact" />
                        <Avatar player={pNous[1]} size="sm-compact" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 flex items-center justify-end pl-1">
                      <span className="font-black tabular-nums leading-none text-2xl sm:text-3xl text-[#c83b3b] text-right">
                        +{roundT1}
                        <span className="text-xs font-sans font-bold text-[#c83b3b]/70 ml-0.5">pts</span>
                      </span>
                    </div>
                  </div>

                  <div className="w-full mt-1.5 min-w-0">
                    <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
                      <span className="font-bold text-[#c83b3b] dark:text-red-400 truncate">
                        {formatTeamNames(pNous, 8)}
                      </span>
                      <span className="font-bold tabular-nums text-stone-700 dark:text-slate-300">
                        {isOverflow ? '➔ 25 pts' : isWinner ? '➔ 50 pts (GAGNÉ)' : `➔ ${nextTotal}/50`}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Équipe 2 */}
            {(() => {
              const pEux = [game.players[2], game.players[3]]
              const roundT2 = (roundPoints[pEux[0]?.id] || 0) + (roundPoints[pEux[1]?.id] || 0)
              const isOverflow = calculatedResult.overflowPlayers.has('eux')
              const isWinner = calculatedResult.winningPlayers.has('eux')
              const nextTotal = calculatedResult.projectedNewTotals['eux']

              return (
                <div className={`flex flex-col justify-between rounded-xl px-2.5 py-2 sm:px-3 sm:py-2.5 min-h-[58px] school-card border transition-all ${
                  isWinner
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : isOverflow
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-[#1e3a5f]/30 bg-[#1e3a5f]/5 dark:bg-[#1e3a5f]/10'
                }`}>
                  <div className="flex items-center justify-between w-full">
                    <div className="shrink-0 relative inline-flex items-center">
                      <div className="flex items-center -space-x-2.5">
                        <Avatar player={pEux[0]} size="sm-compact" />
                        <Avatar player={pEux[1]} size="sm-compact" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 flex items-center justify-end pl-1">
                      <span className="font-black tabular-nums leading-none text-2xl sm:text-3xl text-[#1e3a5f] dark:text-sky-400 text-right">
                        +{roundT2}
                        <span className="text-xs font-sans font-bold text-[#1e3a5f]/70 dark:text-sky-400/70 ml-0.5">pts</span>
                      </span>
                    </div>
                  </div>

                  <div className="w-full mt-1.5 min-w-0">
                    <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
                      <span className="font-bold text-[#1e3a5f] dark:text-sky-400 truncate">
                        {formatTeamNames(pEux, 8)}
                      </span>
                      <span className="font-bold tabular-nums text-stone-700 dark:text-slate-300">
                        {isOverflow ? '➔ 25 pts' : isWinner ? '➔ 50 pts (GAGNÉ)' : `➔ ${nextTotal}/50`}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Bouton de validation principale */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleValidate}
          className="w-full py-3 rounded-xl font-bold text-sm text-white shadow-sm transition-all flex items-center justify-center gap-2 select-none bg-[#c83b3b] hover:bg-[#b03030] cursor-pointer active:scale-[0.99]"
        >
          <Trophy size={16} />
          <span>Valider la manche</span>
        </button>
      </div>

      {/* BottomSheet avec ScorePad pour saisie tactile au pavé numérique */}
      <BottomSheet open={!!editingPlayer} onClose={() => setEditingPlayer(null)}>
        {editingPlayer && (
          <div className="px-4 pt-1 pb-6 space-y-3">
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-stone-100/80 dark:bg-slate-800/60 border border-stone-200/80 dark:border-slate-700/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar player={editingPlayer} size="sm" />
                <div className="min-w-0">
                  <span className="font-serif-title font-bold text-sm text-stone-900 dark:text-slate-100 truncate block">
                    {editingPlayer.name}
                  </span>
                  <span className="text-[10px] text-stone-500 dark:text-slate-400 block truncate">
                    Score cumulé actuel : {game.scores?.[editingPlayer.id] || 0} pts
                  </span>
                </div>
              </div>

              {/* Navigation précédente / suivante */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevInPad}
                  disabled={!hasPrevPlayer}
                  className="p-1.5 rounded-lg border border-stone-200 dark:border-slate-700 disabled:opacity-30 disabled:pointer-events-none hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
                  title="Joueur précédent"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleNextInPad}
                  disabled={!hasNextPlayer}
                  className="p-1.5 rounded-lg border border-stone-200 dark:border-slate-700 disabled:opacity-30 disabled:pointer-events-none hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
                  title="Joueur suivant"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            <ScorePad
              value={roundPoints[editingPlayer.id] || 0}
              onChange={(val) => setRoundPoints(prev => ({ ...prev, [editingPlayer.id]: Math.max(0, Number(val) || 0) }))}
              onConfirm={handleNextInPad}
              confirmLabel={hasNextPlayer && nextPlayer ? `Valider & Suivant (${nextPlayer.name})` : 'Valider'}
              label="Points du lancer"
              subLabel="1 quille seule = sa valeur (1-12) · Plusieurs quilles = leur nombre (1-12) · 0 = raté"
              min={0}
              max={12}
              step={1}
              presets={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}
              baseScore={game.scores?.[editingPlayer.id] || 0}
              formatTotal={(val) => {
                const cur = game.scores?.[editingPlayer.id] || 0
                const sum = cur + val
                if (sum > 50) return `+${val} pts ➔ Dépassement (${sum} pts) retombe à 25 pts`
                if (sum === 50) return `+${val} pts ➔ 50 points pile ! VICTOIRE !`
                return `+${val} pts ➔ Nouveau total : ${sum} / 50 pts`
              }}
              showPlus={true}
            />
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
