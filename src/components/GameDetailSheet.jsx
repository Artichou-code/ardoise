import { useState, useMemo } from 'react'
import { Play, RotateCcw, FileText, QrCode } from 'lucide-react'
import { BottomSheet } from './ui/BottomSheet'
import { Avatar } from './ui/Avatar'
import { GAME_META, GAMES, getGameDisplayName } from '../constants/games'
import { getRanking, formatDate, formatDuration, computePlayDuration, getTeamGameData } from '../utils/gameUtils'
import { ShareGameModal } from './ShareGameModal'

/**
 * Feuille détaillée affichant le déroulement complet d'une partie :
 * - Podium & classement final
 * - Relevé de compteurs manche par manche style carnet de scores
 * - Actions (Revanche ou Reprendre)
 */
export function GameDetailSheet({ game, open, onClose, onResume, onRematch }) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const meta = game ? GAME_META[game.type] : null
  const isDourak = game?.type === GAMES.DOURAK
  const isDourakCards = isDourak && game?.config?.mode === 'cards'
  const scoreUnit = isDourak ? (isDourakCards ? 'cartes' : 'déf.') : 'pts'

  const scoreDir =
    game?.config?.scoreDir === 'low' ||
    game?.config?.scoreDir === 'low_limit' ||
    meta?.scoreDir === 'low'
      ? 'low'
      : 'high'

  const ranking = useMemo(() => {
    if (!game) return []
    return getRanking(game.scores || {}, scoreDir, game)
  }, [game, scoreDir])

  const teamData = useMemo(() => {
    if (!game) return null
    return getTeamGameData(game)
  }, [game])

  const firstRankEntries = useMemo(() => {
    return ranking.filter(r => r.rank === 1)
  }, [ranking])

  const isTie = !teamData && firstRankEntries.length > 1
  const tiedWinners = useMemo(() => {
    if (!game) return []
    return firstRankEntries.map(r => game.players.find(p => p.id === r.id)).filter(Boolean)
  }, [game, firstRankEntries])

  const isTeamTie = Boolean(
    teamData &&
    teamData.teams.length >= 2 &&
    teamData.teams[0].score === teamData.teams[1].score
  )

  const winner = useMemo(() => {
    if (!game) return null
    if (isTie) return null
    return (
      game.players.find(p => p.id === game.winner) ||
      game.players.find(p => p.id === ranking[0]?.id) ||
      null
    )
  }, [game, ranking, isTie])

  const duration = useMemo(() => {
    if (!game?.finishedAt) return null
    return formatDuration(computePlayDuration(game))
  }, [game])

  // Calcul des scores cumulés manche par manche de manière sûre
  const runningTotals = useMemo(() => {
    if (!game?.rounds || !game?.players) return []
    let cumulative = Object.fromEntries(game.players.map(p => [p.id, 0]))
    return game.rounds.map((round) => {
      if (round.scores) {
        cumulative = { ...round.scores }
      } else {
        const next = { ...cumulative }
        game.players.forEach(p => {
          const d = round.delta?.[p.id] || 0
          next[p.id] = (next[p.id] || 0) + d
        })
        cumulative = next
      }
      return { ...cumulative }
    })
  }, [game])

  if (!game) return null

  const subtitle = `${formatDate(game.startedAt)}${duration ? ` · ${duration}` : ''} · ${game.rounds.length} manche${game.rounds.length > 1 ? 's' : ''}`

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={getGameDisplayName(game)}
      subtitle={subtitle}
    >
      <div className="px-3 sm:px-4 py-3 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-hide">
        {/* Statut & Vainqueur */}
        <div className="flex items-center justify-between gap-2.5 p-3 rounded-xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200/80 dark:border-slate-700/80">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {teamData ? (
              <div className="relative shrink-0 flex items-center -space-x-2">
                {(isTeamTie ? [...teamData.teams[0].players, ...teamData.teams[1].players] : teamData.teams[0].players).map((p, pIdx) => (
                  <div key={p.id} className="relative rounded-full ring-2 ring-white dark:ring-slate-900">
                    <Avatar
                      player={p}
                      size="sm"
                      leader={game.status === 'finished' || teamData.teams[0].isLeader}
                      leaderColor="#10b981"
                      crown={(game.status === 'finished' || teamData.teams[0].isLeader) && (isTeamTie || pIdx === 0)}
                    />
                  </div>
                ))}
              </div>
            ) : isTie ? (
              <div className="relative shrink-0 flex items-center -space-x-2">
                {tiedWinners.map(p => (
                  <div key={p.id} className="relative rounded-full ring-2 ring-white dark:ring-slate-900">
                    <Avatar
                      player={p}
                      size="sm"
                      leader={game.status === 'finished'}
                      leaderColor="#10b981"
                      crown={game.status === 'finished'}
                    />
                  </div>
                ))}
              </div>
            ) : (
              winner && <Avatar player={winner} size="sm" leader={game.status === 'finished'} leaderColor="#10b981" crown={game.status === 'finished'} />
            )}
            <div className="min-w-0 flex-1">
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  game.status === 'finished'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-[#c83b3b]/15 text-[#c83b3b] border border-[#c83b3b]/30'
                }`}>
                  {game.status === 'finished'
                    ? (isTie || isTeamTie ? 'Égalité · Ex-æquo' : 'Partie terminée')
                    : 'En cours'}
                </span>
              </div>
              <p className="font-serif-title font-bold text-sm sm:text-base leading-snug break-words mt-1 text-stone-900 dark:text-slate-100">
                {teamData
                  ? (isTeamTie ? 'Équipe 1 & Équipe 2 (Égalité)' : (teamData.teams[0].labelFull || teamData.teams[0].label))
                  : isTie
                  ? `${tiedWinners.map(p => p.name).join(' & ')} (Égalité)`
                  : (winner?.name || '—')}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs font-bold text-stone-500 dark:text-slate-400 block whitespace-nowrap">
              {teamData
                ? (game.status === 'finished' ? (isTeamTie ? 'Score égalité' : 'Score vainqueurs') : 'Score leader')
                : (game.status === 'finished' ? (isTie ? 'Score égalité' : 'Score vainqueur') : 'Score leader')}
            </span>
            <span className="font-black text-base text-emerald-700 dark:text-emerald-400 tabular-nums">
              {teamData ? teamData.teams[0].score : (firstRankEntries[0]?.score ?? (winner ? game.scores[winner.id] || 0 : 0))} {scoreUnit}
            </span>
          </div>
        </div>

        {/* Classement des joueurs ou des équipes */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 mb-2">
            {teamData ? 'Classement des équipes' : 'Classement des joueurs'}
          </p>
          {teamData ? (
            <div className="grid grid-cols-2 gap-2">
              {teamData.teams.map((t) => {
                const isFirst = t.rank === 1
                return (
                  <div
                    key={t.id}
                    className={`relative rounded-xl border flex flex-col items-center text-center px-2 pt-[13px] pb-[3px] sm:px-2.5 sm:pt-[15px] sm:pb-[5px] transition-all ${
                      isFirst
                        ? 'bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-950/20'
                        : 'school-card border-stone-200 dark:border-slate-800'
                    }`}
                  >
                    {/* Badge de rang 1er / 2e positionné en haut à gauche */}
                    <span className={`absolute top-2 left-2 text-[8.5px] font-extrabold uppercase tracking-wider ${
                      isFirst
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-stone-400 dark:text-slate-500'
                    }`}>
                      {t.rank === 1 ? '1er' : `${t.rank}e`}
                    </span>

                    {/* Avatars plus grands groupés côte à côte */}
                    <div className="relative shrink-0 flex items-center -space-x-2.5 mt-0.5 mb-1">
                      {t.players.map((p, idx) => (
                        <div key={p.id} className="relative rounded-full ring-2 ring-white dark:ring-slate-900">
                          <Avatar
                            player={p}
                            size="sm"
                            leader={isFirst}
                            leaderColor="#10b981"
                            crown={isFirst && idx === 0}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Noms de l'équipe */}
                    <span className="text-xs font-bold leading-tight text-center w-full px-1 break-words text-stone-900 dark:text-slate-100">
                      {t.labelFull || t.label}
                    </span>

                    {/* Détail d'addition si Symbiose */}
                    {t.detail && (
                      <span className="text-[10px] text-stone-400 dark:text-slate-500 font-medium tabular-nums mt-0.5">
                        {t.detail}
                      </span>
                    )}

                    {/* Score */}
                    <span className={`font-black text-base sm:text-lg tabular-nums mt-0.5 ${
                      isFirst ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-900 dark:text-slate-100'
                    }`}>
                      {t.score} {scoreUnit}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className={`grid ${
              ranking.length <= 2 ? 'grid-cols-2 gap-2' :
              ranking.length === 3 ? 'grid-cols-3 gap-2' :
              ranking.length === 4 ? 'grid-cols-4 gap-1.5 sm:gap-2' :
              ranking.length === 5 ? 'grid-cols-5 gap-1.5' :
              ranking.length === 6 ? 'grid-cols-6 gap-1' :
              'grid-cols-3 sm:grid-cols-4 gap-2'
            }`}>
              {ranking.map(({ id, score, rank }) => {
                const player = game.players.find(p => p.id === id)
                if (!player) return null
                const isFirst = rank === 1
                const isLast = isDourak && rank === ranking.length
                const isCrowded = ranking.length >= 5
                return (
                  <div
                    key={id}
                    className={`rounded-xl border flex flex-col items-center text-center transition-all ${
                      isCrowded ? 'p-1.5 gap-0.5' : 'p-2.5'
                    } ${
                      isFirst
                        ? 'bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-950/20'
                        : isLast
                        ? 'bg-[#c83b3b]/10 border-[#c83b3b]/30 dark:bg-rose-950/20'
                        : 'school-card border-stone-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-0.5 px-0.5">
                      <span className={`text-[9px] font-extrabold uppercase ${
                        isFirst
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : isLast
                          ? 'text-[#c83b3b]'
                          : 'text-stone-400 dark:text-slate-500'
                      }`}>
                        {rank === 1 ? '1er' : `${rank}e`}
                      </span>
                      {isLast && (
                        <span className="text-[8px] font-bold text-[#c83b3b] uppercase tracking-tight">
                          Dourak
                        </span>
                      )}
                    </div>
                    <Avatar player={player} size="xs" leader={isFirst} leaderColor="#10b981" crown={isFirst && game.status === 'finished'} />
                    <span className="text-[11px] sm:text-xs font-semibold truncate w-full mt-0.5 px-0.5">
                      {player.name}
                    </span>
                    <span className={`font-black text-xs sm:text-sm tabular-nums mt-0.5 ${
                      isFirst ? 'text-emerald-700 dark:text-emerald-400' : isLast ? 'text-[#c83b3b]' : ''
                    }`}>
                      {score} {scoreUnit}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Déroulement complet manche par manche */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 flex items-center gap-1.5">
              <FileText size={13} className="text-[#c83b3b]" /> Déroulement des manches ({game.rounds.length})
            </p>
          </div>

          {game.rounds.length === 0 ? (
            <div className="p-4 rounded-xl text-center text-xs text-stone-400 dark:text-slate-500 border border-dashed border-stone-200 dark:border-slate-800">
              Aucune manche enregistrée pour le moment.
            </div>
          ) : (
            <div className="border border-stone-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-2xs max-h-[48vh] sm:max-h-[54vh] overflow-y-auto overflow-x-auto scrollbar-hide relative">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-20 shadow-xs">
                  <tr className="bg-stone-100 dark:bg-slate-800 border-b border-stone-200 dark:border-slate-700 text-[10px] font-bold text-stone-700 dark:text-slate-200">
                    <th className="py-1.5 px-1.5 sticky left-0 top-0 z-30 bg-stone-100 dark:bg-slate-800 w-9 text-center border-r border-stone-200/80 dark:border-slate-700">
                      M.
                    </th>
                    {teamData ? (
                      <>
                        <th className="py-1.5 px-1 text-center min-w-[100px] sm:min-w-[120px] sticky top-0 bg-stone-100 dark:bg-slate-800 z-20 border-r border-stone-200/50 dark:border-slate-700/50">
                          <span className="text-[9px] font-extrabold block uppercase tracking-wider text-[#c83b3b]">
                            Éq. 1
                          </span>
                          <span className="truncate max-w-[110px] sm:max-w-[140px] font-bold block mx-auto text-[11px] text-stone-800 dark:text-slate-100">
                            {[game.players[0], game.players[1]].filter(Boolean).map(p => p.name).join(' & ')}
                          </span>
                        </th>
                        <th className="py-1.5 px-1 text-center min-w-[100px] sm:min-w-[120px] sticky top-0 bg-stone-100 dark:bg-slate-800 z-20">
                          <span className="text-[9px] font-extrabold block uppercase tracking-wider text-[#1e3a5f] dark:text-sky-400">
                            Éq. 2
                          </span>
                          <span className="truncate max-w-[110px] sm:max-w-[140px] font-bold block mx-auto text-[11px] text-stone-800 dark:text-slate-100">
                            {[game.players[2], game.players[3]].filter(Boolean).map(p => p.name).join(' & ')}
                          </span>
                        </th>
                      </>
                    ) : (
                      game.players.map((p) => (
                        <th key={p.id} className="py-1.5 px-0.5 text-center min-w-[50px] sm:min-w-[64px] sticky top-0 bg-stone-100 dark:bg-slate-800 z-20">
                          <span className="truncate max-w-[48px] sm:max-w-[60px] font-bold block mx-auto text-[11px]">{p.name}</span>
                        </th>
                      ))
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-slate-800/60 font-sans">
                  {game.rounds.map((round, rIdx) => {
                    const cumuls = runningTotals[rIdx] || {}
                    return (
                      <tr
                        key={rIdx}
                        className="hover:bg-stone-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-1 px-1.5 font-bold text-stone-400 dark:text-slate-500 sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-stone-100 dark:border-slate-800/60 text-[10px] text-center">
                          <div>M.{rIdx + 1}</div>
                          {round.contractId && (
                            <span className="block text-[8px] font-semibold text-[#c83b3b] uppercase">
                              {round.contractId}
                            </span>
                          )}
                          {round.isAssaf && (
                            <span className="block text-[7.5px] font-bold text-[#c83b3b] uppercase">
                              Assaf!
                            </span>
                          )}
                        </td>
                        {teamData ? (
                          (() => {
                            const p0 = game.players[0]
                            const p1 = game.players[1]
                            const p2 = game.players[2]
                            const p3 = game.players[3]
                            const isSumTeam = teamData.isSymbioseTeam || teamData.isMolkkyTeam

                            const d0 = round.delta?.[p0?.id] || 0
                            const d1 = round.delta?.[p1?.id] || 0
                            const delta1 = isSumTeam ? (d0 + d1) : (round.teamScores?.nous ?? d0)
                            const cumul1 = isSumTeam
                              ? ((cumuls[p0?.id] || 0) + (cumuls[p1?.id] || 0))
                              : (cumuls[p0?.id] || 0)

                            const d2 = round.delta?.[p2?.id] || 0
                            const d3 = round.delta?.[p3?.id] || 0
                            const delta2 = isSumTeam ? (d2 + d3) : (round.teamScores?.eux ?? d2)
                            const cumul2 = isSumTeam
                              ? ((cumuls[p2?.id] || 0) + (cumuls[p3?.id] || 0))
                              : (cumuls[p2?.id] || 0)

                            return (
                              <>
                                <td className="py-1 px-1 text-center tabular-nums border-r border-stone-100 dark:border-slate-800/40">
                                  <div className="flex flex-col items-center justify-center leading-tight">
                                    <div className="flex items-center gap-1">
                                      <span className="font-bold text-xs text-stone-800 dark:text-slate-200">
                                        {delta1 > 0 ? `+${delta1}` : delta1}
                                      </span>
                                      <span className="text-[9px] text-stone-400 dark:text-slate-500 font-medium">
                                        ({cumul1})
                                      </span>
                                    </div>
                                    {isSumTeam && (
                                      <span className="text-[8.5px] text-stone-400 dark:text-slate-500 font-medium">
                                        {d0} + {d1}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-1 px-1 text-center tabular-nums">
                                  <div className="flex flex-col items-center justify-center leading-tight">
                                    <div className="flex items-center gap-1">
                                      <span className="font-bold text-xs text-stone-800 dark:text-slate-200">
                                        {delta2 > 0 ? `+${delta2}` : delta2}
                                      </span>
                                      <span className="text-[9px] text-stone-400 dark:text-slate-500 font-medium">
                                        ({cumul2})
                                      </span>
                                    </div>
                                    {isSumTeam && (
                                      <span className="text-[8.5px] text-stone-400 dark:text-slate-500 font-medium">
                                        {d2} + {d3}
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </>
                            )
                          })()
                        ) : (
                          game.players.map(p => {
                            const delta = round.delta?.[p.id]
                            const cumul = cumuls[p.id]
                            const rep = round.reprieviews?.find(r => r.playerId === p.id) || round.reprieves?.find(r => r.playerId === p.id)
                            const isRoundLoser = round.loserId === p.id

                            return (
                              <td key={p.id} className="py-1 px-0.5 text-center tabular-nums">
                                <div className="flex flex-col items-center justify-center leading-tight">
                                  <div className="flex items-center gap-0.5">
                                    <span className={`font-bold text-xs ${
                                      isRoundLoser
                                        ? 'text-[#c83b3b]'
                                        : delta != null && delta < 0
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-stone-800 dark:text-slate-200'
                                    }`}>
                                      {delta != null ? (delta > 0 ? `+${delta}` : delta) : '—'}
                                    </span>

                                    {cumul != null && (
                                      <span className="text-[9px] text-stone-400 dark:text-slate-500 font-medium">
                                        ({cumul})
                                      </span>
                                    )}
                                  </div>

                                  {isRoundLoser && (
                                    <span className="text-[7.5px] font-bold text-[#c83b3b] bg-[#c83b3b]/10 px-1 py-0.2 rounded mt-0.5 uppercase tracking-tighter">
                                      Dourak
                                    </span>
                                  )}
                                  {rep && (
                                    <span
                                      className="text-[7.5px] font-bold text-amber-700 bg-amber-500/15 dark:text-amber-300 px-1 py-0.2 rounded mt-0.5 tracking-tighter"
                                      title={`Sursis : ${rep.original} → ${rep.reduced}`}
                                    >
                                      sursis ({rep.reduced})
                                    </span>
                                  )}
                                </div>
                              </td>
                            )
                          })
                        )}
                      </tr>
                    )
                  })}
                </tbody>
                {/* Total final sticky en bas */}
                <tfoot className="sticky bottom-0 z-20 shadow-xs">
                  <tr className="bg-stone-100 dark:bg-slate-800 border-t-2 border-stone-300 dark:border-slate-700 font-bold text-xs">
                    <td className="py-1 px-1.5 font-black text-stone-900 dark:text-slate-100 sticky bottom-0 left-0 z-30 bg-stone-100 dark:bg-slate-800 border-r border-stone-200 dark:border-slate-700 text-[10px] text-center uppercase">
                      Tot.
                    </td>
                    {teamData ? (
                      (() => {
                        const p0 = game.players[0]
                        const p1 = game.players[1]
                        const p2 = game.players[2]
                        const p3 = game.players[3]
                        const isSumTeam = teamData.isSymbioseTeam || teamData.isMolkkyTeam

                        const total1 = isSumTeam
                          ? (game.scores[p0?.id] || 0) + (game.scores[p1?.id] || 0)
                          : (game.scores[p0?.id] || 0)
                        const total2 = isSumTeam
                          ? (game.scores[p2?.id] || 0) + (game.scores[p3?.id] || 0)
                          : (game.scores[p2?.id] || 0)

                        const isFinished = game.status === 'finished'
                        const isWin1 = isFinished && (isTeamTie || (!isTeamTie && total1 > total2))
                        const isWin2 = isFinished && (isTeamTie || (!isTeamTie && total2 > total1))

                        return (
                          <>
                            <td className="py-1.5 px-1 text-center tabular-nums sticky bottom-0 bg-stone-100 dark:bg-slate-800 z-20 border-r border-stone-200/50 dark:border-slate-700/50">
                              <div className="flex items-center justify-center gap-1 leading-tight">
                                <span className={`text-xs font-black ${
                                  isWin1 ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-900 dark:text-slate-100'
                                }`}>
                                  {total1}
                                </span>
                                {isWin1 && (
                                  <span className="text-[7.5px] font-bold uppercase text-emerald-600 dark:text-emerald-400 px-1 py-0.2 rounded bg-emerald-500/15">
                                    {isTeamTie ? '1er' : 'Gagnant'}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-1.5 px-1 text-center tabular-nums sticky bottom-0 bg-stone-100 dark:bg-slate-800 z-20">
                              <div className="flex items-center justify-center gap-1 leading-tight">
                                <span className={`text-xs font-black ${
                                  isWin2 ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-900 dark:text-slate-100'
                                }`}>
                                  {total2}
                                </span>
                                {isWin2 && (
                                  <span className="text-[7.5px] font-bold uppercase text-emerald-600 dark:text-emerald-400 px-1 py-0.2 rounded bg-emerald-500/15">
                                    {isTeamTie ? '1er' : 'Gagnant'}
                                  </span>
                                )}
                              </div>
                            </td>
                          </>
                        )
                      })()
                    ) : (
                      game.players.map(p => {
                        const finalScore = game.scores[p.id] || 0
                        const isFinished = game.status === 'finished'
                        const pRank = ranking.find(r => r.id === p.id)?.rank
                        const isWin = isFinished && pRank === 1
                        return (
                          <td key={p.id} className="py-1 px-0.5 text-center tabular-nums sticky bottom-0 bg-stone-100 dark:bg-slate-800 z-20">
                            <div className="flex items-center justify-center gap-0.5 leading-tight">
                              <span className={`text-xs font-black ${
                                isWin
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : 'text-stone-900 dark:text-slate-100'
                              }`}>
                                {finalScore}
                              </span>
                              {isWin && (
                                <span className="text-[7.5px] font-bold uppercase text-emerald-600 dark:text-emerald-400 px-0.5 py-0.2 rounded bg-emerald-500/15">
                                  {isTie ? '1er' : 'Gagnant'}
                                </span>
                              )}
                            </div>
                          </td>
                        )
                      })
                    )}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Actions en bas de fiche */}
        <div className="space-y-2 pt-2">
          {game.status === 'finished' && (
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="w-full py-2.5 px-3 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-stone-800 dark:text-slate-200 font-bold text-xs hover:bg-stone-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <QrCode size={14} className="text-[#c83b3b]" />
              <span>Partager la partie (QR Code)</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            {game.status === 'active' && onResume && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onResume(game.id)
                }}
                className="flex-1 min-w-0 py-3 px-3 rounded-xl font-bold text-xs btn-margin-red flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap active:scale-[0.99] transition-all cursor-pointer"
              >
                <Play size={13} fill="currentColor" className="shrink-0" />
                <span>Reprendre la partie</span>
              </button>
            )}

            {game.status === 'finished' && onRematch && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onRematch(game)
                }}
                className="flex-1 min-w-0 py-3 px-3 rounded-xl font-bold text-xs btn-margin-red flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap active:scale-[0.99] transition-all cursor-pointer"
              >
                <RotateCcw size={13} className="shrink-0" />
                <span>Revanche</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="shrink-0 py-3 px-4 sm:px-5 rounded-xl border border-stone-300 dark:border-slate-700 text-stone-700 dark:text-slate-300 font-bold text-xs hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>

      {/* Modale de partage de match */}
      <ShareGameModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        game={game}
      />
    </BottomSheet>
  )
}
