import { useState } from 'react'
import { CheckCircle2, ChevronRight, AlertCircle, Info } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { Avatar } from '../ui/Avatar'
import { Dialog } from '../ui/Dialog'

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
  const [showTricksErrorDialog, setShowTricksErrorDialog] = useState(false)
  const [showDealerRuleDialog, setShowDealerRuleDialog] = useState(false)

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

  const handleValidate = () => {
    if (phase === 'bids') {
      setPhase('tricks')
      return
    }
    if (!isTricksExact) {
      setShowTricksErrorDialog(true)
      return
    }
    submitRound()
  }

  return (
    <div className="space-y-2 pt-0">
      {/* En-tête de la manche de l'Ascenseur */}
      <div className="school-card rounded-xl p-3 sm:p-4">
        {/* Ligne 1 : Titre de manche & Nombre de cartes avec stepper */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 block truncate">
              Manche {roundNum} · Palier
            </span>
            <span className="font-serif-title font-bold text-base sm:text-lg text-[#c83b3b] block truncate">
              {cardsCount} carte{cardsCount > 1 ? 's' : ''} en main
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] text-stone-400 dark:text-slate-500 font-medium hidden xs:inline">
              Ajuster :
            </span>
            <div className="inline-flex rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 p-0.5 shadow-2xs">
              <button
                type="button"
                disabled={cardsCount <= 1}
                onClick={() => setCardsCount(c => Math.max(1, c - 1))}
                className={`w-8 h-8 flex items-center justify-center text-sm font-bold transition-all ${
                  cardsCount <= 1
                    ? 'opacity-25 text-stone-400 dark:text-slate-600 cursor-not-allowed'
                    : 'text-stone-700 dark:text-slate-200 hover:text-[#c83b3b] active:scale-95 cursor-pointer'
                }`}
                title="Diminuer d'une carte"
              >
                -
              </button>
              <div className="w-px h-4 bg-stone-200 dark:bg-slate-700 self-center" />
              <button
                type="button"
                disabled={cardsCount >= maxCardsPossible}
                onClick={() => setCardsCount(c => Math.min(maxCardsPossible, c + 1))}
                className={`w-8 h-8 flex items-center justify-center text-sm font-bold transition-all ${
                  cardsCount >= maxCardsPossible
                    ? 'opacity-25 text-stone-400 dark:text-slate-600 cursor-not-allowed'
                    : 'text-stone-700 dark:text-slate-200 hover:text-[#c83b3b] active:scale-95 cursor-pointer'
                }`}
                title="Augmenter d'une carte"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Ligne 2 : Onglets de phase en pleine largeur (très confortable sur mobile) */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-stone-100 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 mb-2">
          <button
            type="button"
            onClick={() => setPhase('bids')}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
              phase === 'bids'
                ? 'bg-white dark:bg-slate-900 text-stone-900 dark:text-white shadow-2xs'
                : 'text-stone-500 dark:text-slate-400 hover:text-stone-800'
            }`}
          >
            <span>1. Paris</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
              phase === 'bids' ? 'bg-[#c83b3b]/10 text-[#c83b3b]' : 'bg-stone-200/60 dark:bg-slate-700 text-stone-500'
            }`}>
              {totalBids}/{cardsCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setPhase('tricks')}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
              phase === 'tricks'
                ? 'bg-white dark:bg-slate-900 text-stone-900 dark:text-white shadow-2xs'
                : 'text-stone-500 dark:text-slate-400 hover:text-stone-800'
            }`}
          >
            <span>2. Plis faits</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
              phase === 'tricks' ? 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-400' : 'bg-stone-200/60 dark:bg-slate-700 text-stone-500'
            }`}>
              {totalTricks}/{cardsCount}
            </span>
          </button>
        </div>

        {/* Message d'aide contextuel selon la phase */}
        {phase === 'bids' ? (
          <button
            type="button"
            onClick={() => setShowDealerRuleDialog(true)}
            title="Cliquer pour voir l'explication de la règle du donneur"
            aria-label="Voir l'explication de la règle du donneur"
            className={`w-full text-left px-3 py-2 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 mb-2 transition-all cursor-pointer ${
              isDealerRestricted
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 hover:bg-amber-100/70 dark:hover:bg-amber-900/50 active:scale-[0.99]'
                : 'bg-stone-50 dark:bg-slate-800/60 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-400 hover:bg-stone-100/70 dark:hover:bg-slate-800 active:scale-[0.99]'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
              {isDealerRestricted ? (
                <AlertCircle size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-stone-400 dark:bg-slate-500 shrink-0" />
              )}
              <span className="whitespace-nowrap truncate">
                {isDealerRestricted
                  ? `Total des paris = ${cardsCount} plis`
                  : `Total des annonces : ${totalBids} / ${cardsCount} plis`}
              </span>
            </div>
            {isDealerRestricted ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 shrink-0">
                <span>Interdit</span>
                <Info size={11} className="opacity-75" />
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] text-stone-400 dark:text-slate-500 hover:text-stone-600 dark:hover:text-slate-300 shrink-0">
                <Info size={13} />
              </span>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (!isTricksExact) setShowTricksErrorDialog(true)
            }}
            title={!isTricksExact ? 'Cliquer pour vérifier la saisie' : undefined}
            className={`w-full text-left px-3 py-2 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 mb-2 transition-all ${
              !isTricksExact ? 'cursor-pointer hover:bg-amber-100/70 dark:hover:bg-amber-900/50 active:scale-[0.99]' : ''
            } ${
              isTricksExact
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-200'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200'
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
              {isTricksExact ? (
                <>
                  <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="whitespace-nowrap truncate">Exactement {totalTricks}/{cardsCount} plis distribués</span>
                </>
              ) : (
                <>
                  <AlertCircle size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="whitespace-nowrap truncate">Total saisi : {totalTricks}/{cardsCount} plis</span>
                </>
              )}
            </div>
            <span className={`font-bold text-[11px] px-2 py-0.5 rounded-full shrink-0 ${
              isTricksExact
                ? 'bg-emerald-200/60 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                : 'bg-amber-200/60 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 inline-flex items-center gap-1'
            }`}>
              {isTricksExact ? 'Complet' : (
                <>
                  <span>À vérifier</span>
                  <Info size={11} className="opacity-75" />
                </>
              )}
            </span>
          </button>
        )}

        {/* Liste des joueurs avec saisie des paris / plis */}
        <div className="space-y-2">
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
                className={`p-2.5 sm:p-3 rounded-xl border transition-all ${
                  phase === 'tricks' && won
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'school-subtle hover:border-stone-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Ligne 1 : Identité joueur et total cumulé */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Avatar player={p} size="xs" />
                    <span className="font-semibold text-sm truncate text-stone-900 dark:text-slate-100">
                      {p.name}
                    </span>
                  </div>

                  {/* Total des points projeté */}
                  <div className="text-xs text-right shrink-0 select-none">
                    {phase === 'tricks' ? (
                      <span className="text-stone-500 dark:text-slate-400">
                        Total : {currentTotal}{' '}
                        <strong className={`font-bold ${won ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-800 dark:text-slate-200'}`}>
                          ➔ {projected} pts
                        </strong>
                      </span>
                    ) : (
                      <span className="text-stone-500 dark:text-slate-400">
                        Total : <strong className="font-bold text-stone-800 dark:text-slate-200">{currentTotal} pts</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Ligne 2 : Résumé des paris & résultat de la manche */}
                <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                  {phase === 'bids' ? (
                    <>
                      <span className="font-medium text-stone-500 dark:text-slate-400">
                        Pari annoncé :
                      </span>
                      <span className="font-bold px-2 py-0.5 rounded-md bg-[#c83b3b]/10 text-[#c83b3b] border border-[#c83b3b]/20">
                        {b} {b > 1 ? 'plis' : 'pli'}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-stone-500 dark:text-slate-400">Parié :</span>
                        <span className="font-black px-2 py-0.5 rounded-md bg-stone-100 dark:bg-slate-800 text-stone-800 dark:text-slate-200 border border-stone-200/80 dark:border-slate-700">
                          {b} {b > 1 ? 'plis' : 'pli'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-stone-500 dark:text-slate-400">
                          Fait : <strong className="font-bold text-stone-800 dark:text-slate-200">{t} {t > 1 ? 'plis' : 'pli'}</strong>
                        </span>
                        {won ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 shrink-0">
                            +{roundPts} pts
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400 shrink-0">
                            +0 pt
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Ligne 3 : Tous les chiffres sur UNE SEULE ligne pleine largeur (aucun retour à la ligne) */}
                <div className="flex items-center gap-1 sm:gap-1.5 w-full pt-2 border-t border-stone-200/60 dark:border-slate-800 overflow-x-auto scrollbar-hide flex-nowrap">
                  {Array.from({ length: cardsCount + 1 }).map((_, val) => {
                    const isSelected = phase === 'bids' ? b === val : t === val
                    const isMatch = phase === 'tricks' && b === val
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          if (phase === 'bids') {
                            setBids(prev => ({ ...prev, [p.id]: val }))
                          } else {
                            setTricks(prev => ({ ...prev, [p.id]: val }))
                          }
                        }}
                        className={`flex-1 min-w-[24px] max-w-[38px] h-8 rounded-lg text-xs font-bold transition-all border flex items-center justify-center shrink-0 cursor-pointer select-none active:scale-95 ${
                          isSelected
                            ? phase === 'bids'
                              ? 'bg-[#c83b3b] text-white border-[#c83b3b] shadow-2xs scale-105'
                              : isMatch
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs scale-105'
                              : 'bg-stone-800 text-white dark:bg-slate-200 dark:text-stone-900 border-stone-800 scale-105'
                            : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-400 hover:border-[#c83b3b]'
                        }`}
                      >
                        {val}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Validation de la manche ou passage de phase */}
        <div className="mt-2.5 pt-2 border-t border-stone-200/80 dark:border-slate-800">
          {phase === 'bids' ? (
            <button
              type="button"
              onClick={() => setPhase('tricks')}
              className="w-full py-2.5 rounded-xl bg-stone-900 dark:bg-slate-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 font-bold text-sm shadow-sm transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Passer aux plis réalisés (Phase 2)</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleValidate}
              className={`w-full py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-[0.99] cursor-pointer ${
                isTricksExact
                  ? 'bg-[#c83b3b] hover:bg-[#b03030] text-white'
                  : 'bg-stone-200 dark:bg-slate-800 text-stone-600 dark:text-slate-300 hover:bg-stone-300 dark:hover:bg-slate-700'
              }`}
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                <span>Valider la manche {roundNum}</span>
                <span className="text-xs font-normal opacity-85">({totalTricks}/{cardsCount} plis)</span>
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Dialog d'erreur si le nombre total de plis ne correspond pas aux cartes en jeu */}
      <Dialog
        open={showTricksErrorDialog}
        onClose={() => setShowTricksErrorDialog(false)}
        title="Total des plis incorrect"
      >
        <div className="space-y-3 text-xs">
          <p className="text-stone-600 dark:text-slate-300 leading-relaxed">
            Le nombre total de plis réalisés (<strong>{totalTricks}</strong>) doit être <strong>exactement égal au nombre de cartes en jeu</strong> ({cardsCount} {cardsCount > 1 ? 'cartes' : 'carte'}).
          </p>

          <div className="p-2.5 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 space-y-1.5 font-medium">
            <div className="flex justify-between items-center">
              <span>Cartes distribuées :</span>
              <strong className="text-stone-800 dark:text-slate-200">{cardsCount} plis en jeu</strong>
            </div>
            <div className="flex justify-between items-center">
              <span>Plis attribués aux joueurs :</span>
              <strong className="text-[#c83b3b]">{totalTricks} / {cardsCount} plis</strong>
            </div>
            <div className="flex justify-between items-center">
              <span>Différence :</span>
              <strong className="text-[#c83b3b]">
                {totalTricks < cardsCount
                  ? `${cardsCount - totalTricks} pli${cardsCount - totalTricks > 1 ? 's' : ''} manquant${cardsCount - totalTricks > 1 ? 's' : ''}`
                  : `${totalTricks - cardsCount} pli${totalTricks - cardsCount > 1 ? 's' : ''} en trop`}
              </strong>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowTricksErrorDialog(false)}
              className="w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white btn-margin-red cursor-pointer shadow-xs active:scale-[0.99] transition-all"
            >
              Vérifier la saisie des plis
            </button>
          </div>
        </div>
      </Dialog>

      {/* Dialogue explicatif de la règle du donneur (concis) */}
      <Dialog
        open={showDealerRuleDialog}
        onClose={() => setShowDealerRuleDialog(false)}
        title="Règle du Donneur"
        icon={<AlertCircle size={20} className="text-amber-600 dark:text-amber-400" />}
      >
        <div className="space-y-3 text-xs">
          <p className="text-stone-600 dark:text-slate-300 leading-relaxed">
            Le <strong>donneur</strong> (dernier à parler) n'a pas le droit d'annoncer un pari qui rend le total égal au nombre de cartes ({cardsCount} {cardsCount > 1 ? 'plis' : 'pli'}).
          </p>

          <p className="text-stone-500 dark:text-slate-400 text-[11px] leading-relaxed">
            Cette règle force un déséquilibre pour qu'il y ait toujours au moins un perdant sur la manche.
          </p>

          <div className="p-2.5 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 space-y-1 font-medium text-[11px]">
            <div className="flex justify-between items-center">
              <span>Cartes / plis en jeu :</span>
              <strong className="text-stone-900 dark:text-slate-100">{cardsCount} {cardsCount > 1 ? 'plis' : 'pli'}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span>Total actuel des paris :</span>
              <strong className={isDealerRestricted ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-stone-900 dark:text-slate-100'}>
                {totalBids} {totalBids > 1 ? 'plis' : 'pli'} {isDealerRestricted ? '(interdit !)' : ''}
              </strong>
            </div>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowDealerRuleDialog(false)}
              className="w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm text-stone-800 dark:text-stone-100 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 cursor-pointer shadow-xs active:scale-[0.99] transition-all"
            >
              Compris !
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
