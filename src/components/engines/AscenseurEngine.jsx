import { useState } from 'react'
import { Award, CheckCircle2, ChevronRight, AlertCircle, HelpCircle } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { Avatar } from '../ui/Avatar'

export function AscenseurEngine({ game, onFinish }) {
  const { updateScores } = useGame()

  const roundNum = (game.rounds?.length || 0) + 1
  const playerCount = game.players.length
  const maxCardsPossible = Math.min(10, Math.floor(52 / Math.max(1, playerCount)))

  // Calcul du nombre de cartes suggéré pour cette manche
  // Cycle : 1 -> maxCards -> 1
  const calculateDefaultCards = (rNum) => {
    const cycleLength = maxCardsPossible * 2 - 1
    const idx = (rNum - 1) % cycleLength
    if (idx < maxCardsPossible) {
      return idx + 1
    }
    return maxCardsPossible - (idx - maxCardsPossible + 1)
  }

  const [cardsCount, setCardsCount] = useState(() => {
    if (game.restoredRound?.cardsCount) return game.restoredRound.cardsCount
    return calculateDefaultCards(roundNum)
  })

  // Paris annoncés par les joueurs
  const [bids, setBids] = useState(() => {
    if (game.restoredRound?.bids) return game.restoredRound.bids
    return Object.fromEntries(game.players.map(p => [p.id, 0]))
  })

  // Plis effectivement réalisés
  const [tricks, setTricks] = useState(() => {
    if (game.restoredRound?.tricks) return game.restoredRound.tricks
    return Object.fromEntries(game.players.map(p => [p.id, 0]))
  })

  // Phase de manche : 'bids' (paris) puis 'tricks' (résultats)
  const [phase, setPhase] = useState(() => {
    return game.restoredRound?.phase || 'bids'
  })

  // Sommes pour contrôle de cohérence
  const totalBids = Object.values(bids).reduce((a, b) => a + b, 0)
  const totalTricks = Object.values(tricks).reduce((a, b) => a + b, 0)
  const isDealerRestricted = totalBids === cardsCount
  const isTricksExact = totalTricks === cardsCount

  // Calcul des points d'un joueur pour la manche
  const computePlayerScore = (playerId) => {
    const b = bids[playerId] ?? 0
    const t = tricks[playerId] ?? 0
    if (b === t) {
      return 10 + t
    }
    return 0
  }

  const submitRound = () => {
    const newScores = {}
    const delta = {}

    for (const p of game.players) {
      const pts = computePlayerScore(p.id)
      delta[p.id] = pts
      newScores[p.id] = (game.scores[p.id] || 0) + pts
    }

    updateScores({
      scores: newScores,
      delta,
      cardsCount,
      bids,
      tricks,
      type: 'ascenseur',
    })

    // Réinitialisation pour la prochaine manche
    const nextCards = calculateDefaultCards(roundNum + 1)
    setCardsCount(nextCards)
    setBids(Object.fromEntries(game.players.map(p => [p.id, 0])))
    setTricks(Object.fromEntries(game.players.map(p => [p.id, 0])))
    setPhase('bids')
  }

  return (
    <div className="space-y-4 pt-2">
      {/* En-tête de la manche de l'Ascenseur */}
      <div className="school-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
              Manche {roundNum} · Palier de cartes
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-serif-title font-bold text-lg text-[#c83b3b]">
                {cardsCount} carte{cardsCount > 1 ? 's' : ''} en main
              </span>
              <div className="inline-flex rounded-lg border border-stone-200 dark:border-slate-700 p-0.5 bg-stone-50 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setCardsCount(c => Math.max(1, c - 1))}
                  className="px-2 py-0.5 text-xs font-bold text-stone-600 dark:text-slate-300 hover:text-[#c83b3b] cursor-pointer"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => setCardsCount(c => Math.min(maxCardsPossible, c + 1))}
                  className="px-2 py-0.5 text-xs font-bold text-stone-600 dark:text-slate-300 hover:text-[#c83b3b] cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Bascule de phase : Annonces (Paris) / Plis réalisés */}
          <div className="flex rounded-xl p-1 bg-stone-100 dark:bg-slate-800 border border-stone-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setPhase('bids')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                phase === 'bids'
                  ? 'bg-white dark:bg-slate-900 text-stone-900 dark:text-white shadow-2xs'
                  : 'text-stone-500 dark:text-slate-400 hover:text-stone-800'
              }`}
            >
              1. Paris ({totalBids}/{cardsCount})
            </button>
            <button
              type="button"
              onClick={() => setPhase('tricks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                phase === 'tricks'
                  ? 'bg-white dark:bg-slate-900 text-stone-900 dark:text-white shadow-2xs'
                  : 'text-stone-500 dark:text-slate-400 hover:text-stone-800'
              }`}
            >
              2. Plis ({totalTricks}/{cardsCount})
            </button>
          </div>
        </div>

        {/* Message d'aide contextuel selon la phase */}
        {phase === 'bids' ? (
          <div className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between mb-3 ${
            isDealerRestricted
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200'
              : 'bg-stone-50 dark:bg-slate-800/60 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-400'
          }`}>
            <span>
              {isDealerRestricted
                ? `Attention : Total des paris = ${cardsCount} (le donneur doit faire varier le total !)`
                : `Total des annonces : ${totalBids} plis pour ${cardsCount} cartes en jeu`}
            </span>
            <button
              type="button"
              onClick={() => setPhase('tricks')}
              className="font-bold text-[#c83b3b] hover:underline flex items-center gap-0.5 ml-2 shrink-0 cursor-pointer"
            >
              Passer aux plis <ChevronRight size={13} />
            </button>
          </div>
        ) : (
          <div className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between mb-3 ${
            isTricksExact
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-200'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200'
          }`}>
            <div className="flex items-center gap-1.5">
              {isTricksExact ? (
                <>
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>Exactement {totalTricks}/{cardsCount} plis distribués</span>
                </>
              ) : (
                <>
                  <AlertCircle size={14} className="text-amber-600 shrink-0" />
                  <span>Total saisi : {totalTricks}/{cardsCount} plis</span>
                </>
              )}
            </div>
            <span className="font-bold text-[11px]">
              {isTricksExact ? 'Complet' : 'À vérifier'}
            </span>
          </div>
        )}

        {/* Liste des joueurs avec saisie des paris / plis */}
        <div className="space-y-2.5">
          {game.players.map(p => {
            const currentTotal = game.scores[p.id] || 0
            const b = bids[p.id] ?? 0
            const t = tricks[p.id] ?? 0
            const won = b === t
            const roundPts = computePlayerScore(p.id)
            const projected = currentTotal + roundPts

            return (
              <div
                key={p.id}
                className={`p-3 rounded-xl border transition-all ${
                  phase === 'tricks' && won
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'school-subtle hover:border-stone-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar player={p} size="xs" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm truncate">{p.name}</span>
                        {phase === 'tricks' && won && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                            +{roundPts} pts
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-stone-500 dark:text-slate-400 block">
                        Total : {currentTotal} pts {phase === 'tricks' && <span className="font-semibold">(= {projected})</span>}
                      </span>
                    </div>
                  </div>

                  {/* Boutons sélecteurs selon la phase active */}
                  {phase === 'bids' ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[11px] font-semibold text-stone-400 dark:text-slate-500 mr-1">
                        Pari :
                      </span>
                      {Array.from({ length: Math.min(cardsCount + 1, 8) }).map((_, val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setBids(prev => ({ ...prev, [p.id]: val }))}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                            b === val
                              ? 'bg-[#c83b3b] text-white border-[#c83b3b] shadow-2xs'
                              : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-400 hover:border-[#c83b3b]'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-stone-400 dark:text-slate-500 font-medium">
                        Parié : <strong className="text-stone-800 dark:text-slate-200">{b}</strong>
                      </span>
                      <span className="text-[11px] font-semibold text-stone-400 dark:text-slate-500">
                        Fait :
                      </span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(cardsCount + 1, 8) }).map((_, val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setTricks(prev => ({ ...prev, [p.id]: val }))}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                              t === val
                                ? b === val
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                  : 'bg-stone-800 text-white dark:bg-slate-200 dark:text-stone-900 border-stone-800'
                                : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-400 hover:border-[#c83b3b]'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Validation de la manche */}
        <div className="mt-4 pt-3 border-t border-stone-200/80 dark:border-slate-800">
          <button
            type="button"
            onClick={submitRound}
            className="w-full py-3 rounded-xl bg-[#c83b3b] hover:bg-[#b03030] text-white font-bold text-sm shadow-sm transition-all active:scale-[0.99] cursor-pointer"
          >
            Valider la manche {roundNum}
          </button>
        </div>
      </div>
    </div>
  )
}
