import { useState, useMemo } from 'react'
import { Play, RotateCcw, FileText, QrCode } from 'lucide-react'
import { BottomSheet } from './ui/BottomSheet'
import { Avatar } from './ui/Avatar'
import { GAME_META, GAMES, getGameDisplayName } from '../constants/games'
import { getRanking, formatDate, formatDuration, computePlayDuration } from '../utils/gameUtils'
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

  const winner = useMemo(() => {
    if (!game) return null
    return (
      game.players.find(p => p.id === game.winner) ||
      game.players.find(p => p.id === ranking[0]?.id) ||
      null
    )
  }, [game, ranking])

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
        <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200/80 dark:border-slate-700/80">
          <div className="flex items-center gap-2.5 min-w-0">
            {winner && <Avatar player={winner} size="sm" leader={game.status === 'finished'} leaderColor="#10b981" crown={game.status === 'finished'} />}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  game.status === 'finished'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-[#c83b3b]/15 text-[#c83b3b] border border-[#c83b3b]/30'
                }`}>
                  {game.status === 'finished' ? 'Partie terminée' : 'En cours'}
                </span>
              </div>
              <p className="font-serif-title font-bold text-sm truncate mt-1">
                {game.status === 'finished' && winner ? (
                  isDourak ? `${winner.name} invaincu` : `${winner.name} l'emporte`
                ) : (
                  `Leader actuel : ${winner?.name || '—'}`
                )}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs font-bold text-stone-500 dark:text-slate-400 block">
              Score vainqueur
            </span>
            <span className="font-black text-base text-emerald-700 dark:text-emerald-400 tabular-nums">
              {winner ? game.scores[winner.id] || 0 : 0} {scoreUnit}
            </span>
          </div>
        </div>

        {/* Classement des joueurs */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 mb-2">
            Classement des joueurs
          </p>
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
                    {game.players.map(p => (
                      <th key={p.id} className="py-1.5 px-0.5 text-center min-w-[50px] sm:min-w-[64px] sticky top-0 bg-stone-100 dark:bg-slate-800 z-20">
                        <span className="truncate max-w-[48px] sm:max-w-[60px] font-bold block mx-auto text-[11px]">{p.name}</span>
                      </th>
                    ))}
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
                        {game.players.map(p => {
                          const delta = round.delta?.[p.id]
                          const cumul = cumuls[p.id]
                          const rep = round.reprieves?.find(r => r.playerId === p.id)
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
                        })}
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
                    {game.players.map(p => {
                      const finalScore = game.scores[p.id] || 0
                      const isWin = p.id === winner?.id
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
                                Gagnant
                              </span>
                            )}
                          </div>
                        </td>
                      )
                    })}
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

          <div className="flex gap-2.5">
            {game.status === 'active' && onResume && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onResume(game.id)
                }}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs btn-margin-red flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Play size={14} fill="currentColor" /> Reprendre la partie
              </button>
            )}

            {game.status === 'finished' && onRematch && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onRematch(game)
                }}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs btn-margin-red flex items-center justify-center gap-1.5 shadow-sm"
              >
                <RotateCcw size={14} /> Revanche
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-stone-300 dark:border-slate-700 text-stone-700 dark:text-slate-300 font-bold text-xs hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
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
