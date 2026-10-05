import { useState, useMemo, useEffect } from 'react'
import { Trophy, Target, Users, AlertTriangle, ChevronLeft, ChevronRight, Check, HelpCircle } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { Avatar } from '../ui/Avatar'
import { QuickScoreBadge } from '../ui/QuickScoreBadge'
import { BottomSheet } from '../ui/BottomSheet'
import { ScorePad } from '../ui/ScorePad'
import { Dialog } from '../ui/Dialog'
import { formatTeamNames } from '../../utils/gameUtils'

function getMolkkyTargetInfo(baseScore) {
  const effectiveBase = baseScore > 50 ? 25 : baseScore
  const remaining = Math.max(0, 50 - effectiveBase)

  if (remaining === 0) {
    return {
      remaining: 0,
      isClose: false,
      text: '50 pts atteints !',
      shortText: '50 pts atteints',
      warning: false,
    }
  }
  if (remaining === 1) {
    return {
      remaining: 1,
      isClose: true,
      text: 'Viser 1 pt (si > 1 ➔ 25 pts)',
      shortText: 'Viser 1 pt (si > 1 ➔ 25 pts)',
      warning: true,
    }
  }
  if (remaining <= 12) {
    return {
      remaining,
      isClose: true,
      text: `Viser ${remaining} pts (si > ${remaining} ➔ 25 pts)`,
      shortText: `Viser ${remaining} pts (si > ${remaining} ➔ 25 pts)`,
      warning: true,
    }
  }
  return {
    remaining,
    isClose: false,
    text: `Reste ${remaining} pts pour 50`,
    shortText: `Reste ${remaining} pts pour 50`,
    warning: false,
  }
}

// Calcul des ratés d'équipe consécutifs passés (règle officielle F.F.Mölkky)
function getTeamPastMissStreak(players, rounds) {
  if (!Array.isArray(rounds) || rounds.length === 0 || !players || players.length < 2) return 0
  let streak = 0
  for (let i = rounds.length - 1; i >= 0; i--) {
    const round = rounds[i]
    const p1 = players[0]
    const p2 = players[1]
    const d2 = round?.roundPoints?.[p2?.id] ?? round?.delta?.[p2?.id]
    const d1 = round?.roundPoints?.[p1?.id] ?? round?.delta?.[p1?.id]

    // Dans une manche, P2 lance après P1. On regarde à reculons :
    if (d2 === 0) {
      streak++
      if (d1 === 0) {
        streak++
      } else {
        break
      }
    } else {
      break
    }
  }
  return streak
}

// Calcul de la série de ratés d'équipe dans la manche en cours
function computeTeamCurrentStreak(p1Id, p2Id, roundPoints, pastStreak) {
  const pts1 = roundPoints[p1Id]
  const pts2 = roundPoints[p2Id]
  const hasPlayed1 = pts1 !== null && pts1 !== undefined
  const hasPlayed2 = pts2 !== null && pts2 !== undefined

  if (!hasPlayed1 && !hasPlayed2) {
    return pastStreak
  }
  if (hasPlayed1 && !hasPlayed2) {
    return pts1 === 0 ? pastStreak + 1 : 0
  }
  if (!hasPlayed1 && hasPlayed2) {
    return pts2 === 0 ? pastStreak + 1 : 0
  }
  // Les deux ont joué : P1 puis P2
  if (pts1 === 0 && pts2 === 0) {
    return pastStreak + 2
  }
  if (pts1 > 0 && pts2 === 0) {
    return 1
  }
  // Si pts2 > 0 : le dernier lancer rapporte des points, série rompue
  return 0
}

export function MolkkyEngine({ game, onFinish }) {
  const { updateScores } = useGame()
  const isTeamMode = game.config?.mode === 'team' && game.players.length === 4
  const roundNum = (game.rounds?.length || 0) + 1

  // Points marqués lors de cette manche par chaque joueur (0 à 12 en un lancer standard)
  // null = en attente de lancer (affiche un tiret '—' sans compter comme un raté 0)
  const [roundPoints, setRoundPoints] = useState(() => {
    const init = {}
    for (const p of game.players) {
      if (game.restoredRound?.roundPoints?.[p.id] != null) {
        init[p.id] = game.restoredRound.roundPoints[p.id]
      } else if (game.restoredDelta?.[p.id] != null) {
        init[p.id] = game.restoredDelta[p.id]
      } else {
        init[p.id] = null
      }
    }
    return init
  })

  // Réinitialiser les scores à null à chaque nouvelle manche
  useEffect(() => {
    setRoundPoints(() => {
      const init = {}
      for (const p of game.players) {
        if (game.restoredRound?.roundPoints?.[p.id] != null) {
          init[p.id] = game.restoredRound.roundPoints[p.id]
        } else if (game.restoredDelta?.[p.id] != null) {
          init[p.id] = game.restoredDelta[p.id]
        } else {
          init[p.id] = null
        }
      }
      return init
    })
  }, [game.rounds?.length, game.players])

  // Joueur en cours d'édition dans le ScorePad
  const [editingPlayer, setEditingPlayer] = useState(null)
  const [showRulesMemo, setShowRulesMemo] = useState(false)

  // Calcul des ratés consécutifs passés :
  // En mode équipe : calcul par équipe selon la règle officielle F.F.Mölkky
  const team1PastZeros = useMemo(() => {
    if (!isTeamMode) return 0
    return getTeamPastMissStreak([game.players[0], game.players[1]], game.rounds)
  }, [isTeamMode, game.players, game.rounds])

  const team2PastZeros = useMemo(() => {
    if (!isTeamMode) return 0
    return getTeamPastMissStreak([game.players[2], game.players[3]], game.rounds)
  }, [isTeamMode, game.players, game.rounds])

  // Série de ratés d'équipe actuelle dans la manche
  const streakT1 = useMemo(() => {
    if (!isTeamMode) return 0
    return computeTeamCurrentStreak(game.players[0]?.id, game.players[1]?.id, roundPoints, team1PastZeros)
  }, [isTeamMode, game.players, roundPoints, team1PastZeros])

  const streakT2 = useMemo(() => {
    if (!isTeamMode) return 0
    return computeTeamCurrentStreak(game.players[2]?.id, game.players[3]?.id, roundPoints, team2PastZeros)
  }, [isTeamMode, game.players, roundPoints, team2PastZeros])

  // En mode individuel : calcul par joueur
  const pastZeroStreaks = useMemo(() => {
    if (isTeamMode) return {}
    const streaks = {}
    const rounds = Array.isArray(game.rounds) ? game.rounds : []

    for (const p of game.players) {
      let count = 0
      for (let i = rounds.length - 1; i >= 0; i--) {
        const round = rounds[i]
        const d = round?.roundPoints?.[p.id] ?? round?.delta?.[p.id]
        if (d === 0) {
          count++
        } else {
          break
        }
      }
      streaks[p.id] = count
    }
    return streaks
  }, [isTeamMode, game.rounds, game.players])

  // Navigation dans le ScorePad
  const activeIndex = editingPlayer ? game.players.findIndex(p => p.id === editingPlayer.id) : -1
  const hasNextPlayer = activeIndex >= 0 && activeIndex < game.players.length - 1
  const hasPrevPlayer = activeIndex > 0
  const nextPlayer = hasNextPlayer ? game.players[activeIndex + 1] : null
  const prevPlayer = hasPrevPlayer ? game.players[activeIndex - 1] : null

  const handleNextInPad = () => {
    if (editingPlayer && roundPoints[editingPlayer.id] == null) {
      setRoundPoints(prev => ({ ...prev, [editingPlayer.id]: 0 }))
    }
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

  // Données de l'équipe et cible pour le joueur en cours d'édition dans le ScorePad
  const editingPlayerIdx = editingPlayer ? game.players.findIndex(p => p.id === editingPlayer.id) : -1
  const isEditingTeam1 = editingPlayerIdx < 2
  const editingPartner = isTeamMode && editingPlayerIdx >= 0
    ? (isEditingTeam1 ? (editingPlayerIdx === 0 ? game.players[1] : game.players[0]) : (editingPlayerIdx === 2 ? game.players[3] : game.players[2]))
    : null
  const editingPartnerPts = editingPartner ? (roundPoints[editingPartner.id] || 0) : 0

  const editingBaseRaw = isTeamMode && editingPlayerIdx >= 0
    ? (isEditingTeam1
        ? (game.scores?.[game.players[0]?.id] || 0) + (game.scores?.[game.players[1]?.id] || 0)
        : (game.scores?.[game.players[2]?.id] || 0) + (game.scores?.[game.players[3]?.id] || 0)) + editingPartnerPts
    : (game.scores?.[editingPlayer?.id] || 0)

  const editingActiveBaseScore = editingBaseRaw > 50 ? 25 : editingBaseRaw
  const editingTargetInfo = getMolkkyTargetInfo(editingActiveBaseScore)

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

      const hasPlayedT1 = roundPoints[pNous[0]?.id] != null || roundPoints[pNous[1]?.id] != null
      const hasPlayedT2 = roundPoints[pEux[0]?.id] != null || roundPoints[pEux[1]?.id] != null

      const overflowT1 = hasPlayedT1 && totalT1 > 50
      const overflowT2 = hasPlayedT2 && totalT2 > 50

      if (overflowT1) {
        totalT1 = 25
        overflowPlayers.add('nous')
      }
      if (overflowT2) {
        totalT2 = 25
        overflowPlayers.add('eux')
      }

      if (totalT1 === 50 && hasPlayedT1) winningPlayers.add('nous')
      if (totalT2 === 50 && hasPlayedT2) winningPlayers.add('eux')

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

      // Vérification des ratés d'équipe (règle officielle F.F.Mölkky : 3 ratés consécutifs = élimination de l'équipe)
      if (streakT1 >= 3) {
        eliminatedPlayers.add('nous')
      }
      if (streakT2 >= 3) {
        eliminatedPlayers.add('eux')
      }

      if (streakT1 >= 3 && streakT2 < 3) winningPlayers.add('eux')
      if (streakT2 >= 3 && streakT1 < 3) winningPlayers.add('nous')
    } else {
      for (const p of game.players) {
        const cur = currentScores[p.id] || 0
        const hasPlayed = roundPoints[p.id] != null
        const pts = roundPoints[p.id] || 0
        let nextTotal = cur + pts

        if (hasPlayed && nextTotal > 50) {
          overflowPlayers.add(p.id)
          nextTotal = 25
        } else if (hasPlayed && nextTotal === 50) {
          winningPlayers.add(p.id)
        }

        const pastZeros = pastZeroStreaks[p.id] || 0
        const streak = hasPlayed ? (pts === 0 ? pastZeros + 1 : 0) : pastZeros
        if (streak >= 3) {
          eliminatedPlayers.add(p.id)
        }

        projectedNewTotals[p.id] = nextTotal
        newScores[p.id] = nextTotal
        deltas[p.id] = pts
      }

      // Si tous les joueurs sauf 1 sont éliminés, le survivant l'emporte immédiatement
      const activePlayers = game.players.filter(p => !eliminatedPlayers.has(p.id))
      if (activePlayers.length === 1 && game.players.length > 1) {
        winningPlayers.add(activePlayers[0].id)
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
  }, [game.scores, game.players, roundPoints, isTeamMode, pastZeroStreaks, streakT1, streakT2])

  // Validation : tous les lancers de la manche doivent être saisis
  const unplayedPlayers = useMemo(
    () => game.players.filter(p => roundPoints[p.id] == null),
    [game.players, roundPoints]
  )
  const canValidate = unplayedPlayers.length === 0
  const filledCount = game.players.length - unplayedPlayers.length

  const handleValidate = () => {
    if (!canValidate) return
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
              50 pts pile · Si &gt; 50 ➔ 25 pts
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowRulesMemo(true)}
          className="p-1.5 rounded-xl border border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-500 dark:text-slate-400 transition-colors shrink-0 cursor-pointer"
          title="Règles officielles du Mölkky"
        >
          <HelpCircle size={15} />
        </button>
      </div>

      {/* Cartes de saisie des scores */}
      {isTeamMode ? (
        <div className="space-y-2.5">
          {[
            {
              teamKey: 'nous',
              teamNum: 1,
              players: [game.players[0], game.players[1]],
              colorBadge: 'bg-[#c83b3b]/15 text-[#c83b3b]',
              colorText: 'text-[#c83b3b] dark:text-red-400',
              pastZeros: team1PastZeros,
              streak: streakT1,
            },
            {
              teamKey: 'eux',
              teamNum: 2,
              players: [game.players[2], game.players[3]],
              colorBadge: 'bg-[#1e3a5f]/15 text-[#1e3a5f] dark:text-sky-400',
              colorText: 'text-[#1e3a5f] dark:text-sky-400',
              pastZeros: team2PastZeros,
              streak: streakT2,
            },
          ].map(({ teamKey, teamNum, players: teamPlayers, colorBadge, colorText, pastZeros, streak }) => {
            const p1 = teamPlayers[0]
            const p2 = teamPlayers[1]

            const startScore = (game.scores?.[p1?.id] || 0) + (game.scores?.[p2?.id] || 0)
            const pts1 = roundPoints[p1?.id]
            const pts2 = roundPoints[p2?.id]
            const hasPlayed1 = pts1 !== null && pts1 !== undefined
            const hasPlayed2 = pts2 !== null && pts2 !== undefined
            const hasPlayedAny = hasPlayed1 || hasPlayed2

            const teamRoundTotal = (pts1 || 0) + (pts2 || 0)
            const unclampedSum = startScore + teamRoundTotal

            const isOverflow = calculatedResult.overflowPlayers.has(teamKey)
            const isWinner = calculatedResult.winningPlayers.has(teamKey)
            const isEliminated = calculatedResult.eliminatedPlayers.has(teamKey)
            const projectedTotal = calculatedResult.projectedNewTotals[teamKey]

            const currentBaseForTarget = teamRoundTotal > 0
              ? (isOverflow ? 25 : unclampedSum)
              : startScore

            const targetInfo = getMolkkyTargetInfo(currentBaseForTarget)

            return (
              <div
                key={teamKey}
                className={`p-3 rounded-2xl school-card border transition-all ${
                  isWinner
                    ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/40'
                    : isOverflow
                    ? 'border-[#c83b3b]/70 bg-[#c83b3b]/5'
                    : isEliminated
                    ? 'border-red-500/80 bg-red-500/5 opacity-80'
                    : 'border-stone-200/90 dark:border-slate-800'
                }`}
              >
                {/* Ligne 1 : Nom de l'équipe, Total dynamique et Score cumulé de la manche */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md shrink-0 ${colorBadge}`}>
                      Équipe {teamNum}
                    </span>

                    {/* Total dynamique équipe */}
                    <div className="flex items-center gap-1 text-[11px] leading-tight min-w-0">
                      <span className="text-stone-400 dark:text-slate-500 font-medium shrink-0">
                        Total :
                      </span>
                      {isWinner ? (
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          50 pts (Gagné !)
                        </span>
                      ) : isOverflow ? (
                        <span className="font-extrabold text-[#c83b3b] dark:text-red-400 tabular-nums">
                          Chute ➔ 25 pts
                        </span>
                      ) : (
                        <span className="font-bold text-stone-700 dark:text-slate-200 tabular-nums truncate">
                          {projectedTotal} <span className="font-normal text-stone-400 dark:text-slate-500">/ 50 pts</span>
                          {50 - (projectedTotal || 0) > 0 && (
                            <span className="text-[10px] font-normal text-stone-400 dark:text-slate-500 ml-1">
                              (-{50 - (projectedTotal || 0)})
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score cumulé de la manche pour l'équipe */}
                  <div className="shrink-0 flex items-center justify-end pl-1">
                    <span className={`font-black tabular-nums leading-none text-xl sm:text-2xl ${colorText}`}>
                      {!hasPlayedAny ? '—' : `+${teamRoundTotal}`}
                      <span className="text-xs font-sans font-bold opacity-75 ml-0.5">pts</span>
                    </span>
                  </div>
                </div>

                {/* Ligne 2 : Les deux joueurs sur la même ligne avec leurs zones de saisie distinctes */}
                <div className="grid grid-cols-2 gap-2 my-2.5">
                  {[p1, p2].map((p) => {
                    const pVal = roundPoints[p.id]
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-xl bg-stone-50/90 dark:bg-slate-800/60 border border-stone-200/70 dark:border-slate-700/60 min-w-0"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Avatar player={p} size="xs" />
                          <span className="font-serif-title font-bold text-xs sm:text-sm text-stone-900 dark:text-slate-100 truncate">
                            {p.name}
                          </span>
                        </div>
                        <QuickScoreBadge
                          value={pVal}
                          onChange={(val) => setRoundPoints(prev => ({ ...prev, [p.id]: val === null ? null : Math.max(0, Number(val) || 0) }))}
                          onOpenPad={() => setEditingPlayer(p)}
                          min={0}
                          max={12}
                          step={1}
                          values={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}
                          formatSub={(v) => (v === 0 ? 'Raté' : null)}
                          showPlus={true}
                          fillZero={true}
                        />
                      </div>
                    )
                  })}
                </div>

                {/* Ligne 3 : Conseil de visée unifié pour l'équipe et Jauge des 3 ratés unifiée */}
                <div className="pt-2 border-t border-stone-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {isWinner ? (
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Trophy size={13} />
                        50 pts pile ! Victoire Équipe {teamNum} !
                      </span>
                    ) : isOverflow ? (
                      <span className="font-bold text-[#c83b3b] dark:text-red-400 flex items-center gap-1 truncate">
                        <AlertTriangle size={13} className="shrink-0" />
                        <span>Chute ➔ 25 pts ({unclampedSum} pts)</span>
                      </span>
                    ) : isEliminated ? (
                      <span className="font-bold text-red-600 dark:text-red-400 flex items-center gap-1 truncate">
                        <AlertTriangle size={13} className="shrink-0" />
                        <span>Équipe éliminée (3 ratés)</span>
                      </span>
                    ) : (
                      <span className="font-semibold text-[#c83b3b] dark:text-red-400 flex items-center gap-1 truncate">
                        <Target size={13} className="shrink-0" />
                        <span>{targetInfo.shortText}</span>
                      </span>
                    )}
                  </div>

                  {/* Jauge des 3 ratés d'équipe vers l'élimination */}
                  {(streak > 0 || pastZeros > 0) && (
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[10px] shrink-0 transition-all ${
                      streak >= 3
                        ? 'bg-red-500/15 border-red-500/30 text-red-600 dark:text-red-400'
                        : streak === 2
                        ? 'bg-[#c83b3b]/10 border-[#c83b3b]/25 text-[#c83b3b] dark:text-red-400'
                        : streak === 1
                        ? 'bg-stone-100 dark:bg-slate-800/80 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-400'
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3].map((dotIdx) => {
                          const isFilled = streak >= dotIdx
                          return (
                            <span
                              key={dotIdx}
                              className={`w-1.5 h-1.5 rounded-full transition-all ${
                                streak >= 3
                                  ? 'bg-red-600 dark:bg-red-400'
                                  : isFilled
                                  ? 'bg-[#c83b3b] dark:bg-red-400'
                                  : 'bg-stone-300 dark:bg-slate-600'
                              }`}
                            />
                          )
                        })}
                      </div>

                      <span className="font-bold tabular-nums">
                        {streak >= 3
                          ? 'Éliminé (3/3)'
                          : streak === 2
                          ? (hasPlayedAny ? 'Alerte (2/3)' : 'Attention (2/3)')
                          : streak === 1
                          ? (hasPlayedAny ? 'Raté (1/3)' : '1 raté (1/3)')
                          : 'Sauvé (0/3)'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Cartes de saisie des joueurs en mode individuel */
        <div className="space-y-2.5">
          {game.players.map((p) => {
            const currentTotal = game.scores?.[p.id] || 0
            const pts = roundPoints[p.id]
            const hasPlayed = pts !== null && pts !== undefined
            const pastZeros = pastZeroStreaks[p.id] || 0
            const nextStreak = hasPlayed ? (pts === 0 ? pastZeros + 1 : 0) : pastZeros

            const unclampedSum = currentTotal + (pts || 0)
            const isOverflow = calculatedResult.overflowPlayers.has(p.id)
            const isWinner = calculatedResult.winningPlayers.has(p.id)
            const isEliminated = calculatedResult.eliminatedPlayers.has(p.id)
            const projectedTotal = calculatedResult.projectedNewTotals[p.id]

            const currentBaseForTarget = hasPlayed && pts > 0
              ? (isOverflow ? 25 : unclampedSum)
              : currentTotal

            const targetInfo = getMolkkyTargetInfo(currentBaseForTarget)

            return (
              <div
                key={p.id}
                className={`p-3 rounded-2xl school-card border transition-all ${
                  isWinner
                    ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/40'
                    : isOverflow
                    ? 'border-[#c83b3b]/70 bg-[#c83b3b]/5'
                    : isEliminated
                    ? 'border-red-500/80 bg-red-500/5 opacity-80'
                    : 'border-stone-200/90 dark:border-slate-800'
                }`}
              >
                {/* Ligne 1 : Joueur, Total dynamique selon les points marqués, et Champ de score */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar player={p} size="sm" />
                    <div className="min-w-0">
                      <span className="font-serif-title font-bold text-sm text-stone-900 dark:text-slate-100 truncate block">
                        {p.name}
                      </span>

                      {/* Total dynamique en fonction du score marqué */}
                      <div className="flex items-center gap-1 text-[11px] leading-tight mt-0.5">
                        <span className="text-stone-400 dark:text-slate-500 font-medium shrink-0">
                          Total :
                        </span>
                        {isWinner ? (
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                            50 pts (Gagné !)
                          </span>
                        ) : isOverflow ? (
                          <span className="font-extrabold text-[#c83b3b] dark:text-red-400 tabular-nums">
                            Chute ➔ 25 pts
                          </span>
                        ) : (
                          <span className="font-bold text-stone-700 dark:text-slate-200 tabular-nums">
                            {projectedTotal} <span className="font-normal text-stone-400 dark:text-slate-500">/ 50 pts</span>
                            {50 - (projectedTotal || 0) > 0 && (
                              <span className="text-[10px] font-normal text-stone-400 dark:text-slate-500 ml-1">
                                (-{50 - (projectedTotal || 0)})
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <QuickScoreBadge
                      value={pts}
                      onChange={(val) => setRoundPoints(prev => ({ ...prev, [p.id]: val === null ? null : Math.max(0, Number(val) || 0) }))}
                      onOpenPad={() => setEditingPlayer(p)}
                      min={0}
                      max={12}
                      step={1}
                      values={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}
                      formatSub={(v) => (v === 0 ? 'Raté' : null)}
                      showPlus={true}
                      fillZero={true}
                    />
                  </div>
                </div>

                {/* Ligne 2 : Statut, commentaire sur quoi viser en rouge ardoise et jauge visuelle des ratés */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {isWinner ? (
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Trophy size={13} />
                        50 pts pile ! Victoire immédiate !
                      </span>
                    ) : isOverflow ? (
                      <span className="font-bold text-[#c83b3b] dark:text-red-400 flex items-center gap-1 truncate">
                        <AlertTriangle size={13} className="shrink-0" />
                        <span>Chute ➔ 25 pts ({unclampedSum} pts)</span>
                      </span>
                    ) : isEliminated ? (
                      <span className="font-bold text-red-600 dark:text-red-400 flex items-center gap-1 truncate">
                        <AlertTriangle size={13} className="shrink-0" />
                        <span>Éliminé (3 ratés)</span>
                      </span>
                    ) : (
                      <span className="font-semibold text-[#c83b3b] dark:text-red-400 flex items-center gap-1 truncate">
                        <Target size={13} className="shrink-0" />
                        <span>{targetInfo.shortText}</span>
                      </span>
                    )}
                  </div>

                  {/* Jauge visuelle des 3 ratés consécutifs vers l'élimination */}
                  {(nextStreak > 0 || pastZeros > 0) && (
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[10px] shrink-0 transition-all ${
                      nextStreak >= 3
                        ? 'bg-red-500/15 border-red-500/30 text-red-600 dark:text-red-400'
                        : nextStreak === 2
                        ? (hasPlayed ? 'Alerte (2/3)' : 'Attention (2/3)')
                        : nextStreak === 1
                        ? (hasPlayed ? 'Raté (1/3)' : '1 raté (1/3)')
                        : 'Sauvé (0/3)'}
                    `}>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3].map((dotIdx) => {
                          const isFilled = nextStreak >= dotIdx
                          return (
                            <span
                              key={dotIdx}
                              className={`w-1.5 h-1.5 rounded-full transition-all ${
                                nextStreak >= 3
                                  ? 'bg-red-600 dark:bg-red-400'
                                  : isFilled
                                  ? 'bg-[#c83b3b] dark:bg-red-400'
                                  : 'bg-stone-300 dark:bg-slate-600'
                              }`}
                            />
                          )
                        })}
                      </div>

                      <span className="font-bold tabular-nums">
                        {nextStreak >= 3
                          ? 'Éliminé (3/3)'
                          : nextStreak === 2
                          ? (hasPlayed ? 'Alerte (2/3)' : 'Attention (2/3)')
                          : nextStreak === 1
                          ? (hasPlayed ? 'Raté (1/3)' : '1 raté (1/3)')
                          : 'Sauvé (0/3)'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Bouton de validation principale */}
      <div className="pt-2">
        <button
          type="button"
          disabled={!canValidate}
          onClick={handleValidate}
          className={`w-full py-3 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 select-none ${
            canValidate
              ? 'bg-[#c83b3b] hover:bg-[#b03030] text-white cursor-pointer active:scale-[0.99]'
              : 'bg-stone-200 dark:bg-slate-800 text-stone-400 dark:text-slate-500 cursor-not-allowed'
          }`}
        >
          <Trophy size={16} />
          <span>Valider la manche</span>
          {!canValidate && (
            <span className="text-xs font-normal opacity-75">
              ({filledCount}/{game.players.length} saisis)
            </span>
          )}
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
                    {isTeamMode ? (
                      <>Équipe {isEditingTeam1 ? '1' : '2'} : <strong className="text-stone-700 dark:text-slate-300 tabular-nums">{editingActiveBaseScore} pts</strong></>
                    ) : (
                      <>Score actuel : <strong className="text-stone-700 dark:text-slate-300 tabular-nums">{game.scores?.[editingPlayer.id] || 0} pts</strong></>
                    )}
                    {editingTargetInfo.warning && (
                      <span className="text-[#c83b3b] dark:text-red-400 font-bold ml-1.5">
                        ({editingTargetInfo.shortText})
                      </span>
                    )}
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
              subLabel={
                editingTargetInfo.warning
                  ? `🎯 ${editingTargetInfo.text} · 0 = raté`
                  : "1 quille seule = sa valeur (1-12) · Plusieurs quilles = leur nombre (1-12) · 0 = raté"
              }
              min={0}
              max={12}
              step={1}
              presets={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}
              baseScore={editingActiveBaseScore}
              formatTotal={(val) => {
                const sum = editingActiveBaseScore + val
                if (sum > 50) return `+${val} pts ➔ Dépassement (${sum} pts) retombe à 25 pts`
                if (sum === 50) return `+${val} pts ➔ 50 points pile ! VICTOIRE !`
                return `+${val} pts ➔ ${isTeamMode ? 'Total équipe' : 'Total'} : ${sum} / 50 pts (-${50 - sum})`
              }}
              showPlus={true}
            />
          </div>
        )}
      </BottomSheet>

      {/* Dialog Mémo des règles officielles du Mölkky */}
      <Dialog
        open={showRulesMemo}
        onClose={() => setShowRulesMemo(false)}
        title="Règles officielles du Mölkky (F.F.Mölkky)"
      >
        <div className="space-y-2.5 text-xs text-stone-600 dark:text-slate-300">
          <p className="leading-relaxed font-semibold">
            Objectif : Être le premier à atteindre exactement 50 points !
          </p>
          <ul className="space-y-1.5 pl-3 list-disc text-[11px]">
            <li><strong>Une seule quille abattue :</strong> Le joueur marque la valeur inscrite sur la quille (de 1 à 12 points).</li>
            <li><strong>Plusieurs quilles abattues :</strong> Le joueur marque le nombre de quilles tombées (ex. 3 quilles = 3 points), quel que soit leur numéro.</li>
            <li><strong>Dépassement de 50 points :</strong> Si un lancer fait dépasser 50 points, le score retombe immédiatement à 25 points.</li>
            <li><strong>3 lancers ratés consécutifs :</strong> Si un joueur fait 3 fois de suite 0 point (aucune quille tombée), il est éliminé de la manche.</li>
            <li><strong>Mode Équipe (2 vs 2) :</strong> Les coéquipiers alternent leurs lancers et cumulent leurs points pour leur équipe vers les 50 points.</li>
          </ul>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowRulesMemo(false)}
              className="w-full py-2 rounded-xl font-bold text-xs btn-margin-red text-white cursor-pointer"
            >
              Compris
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
