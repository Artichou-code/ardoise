import { useState, useMemo } from 'react'
import {
  Layers,
  Heart,
  Crown,
  Shield,
  Clock,
  Flame,
  Trophy,
  RotateCw,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { Avatar } from '../ui/Avatar'
import { QuickScoreBadge } from '../ui/QuickScoreBadge'
import { BottomSheet } from '../ui/BottomSheet'
import { ScorePad } from '../ui/ScorePad'
import { Dialog } from '../ui/Dialog'
import { BARBU_CONTRACTS } from '../../constants/games'

export function BarbuEngine({ game, onFinish }) {
  const { updateScores } = useGame()
  const roundCount = (game.rounds?.length || 0) + 1
  const TOTAL_ROUNDS = game.config?.rounds || (game.players.length * 7)

  // Donneur actuel (rotation automatique à chaque manche)
  const [dealerIndex, setDealerIndex] = useState(() => {
    return (roundCount - 1) % game.players.length
  })
  const currentDealer = game.players[dealerIndex] || game.players[0]

  // Contrats déjà joués par chaque donneur
  const contractsPlayedByDealer = useMemo(() => {
    const map = {}
    for (const p of game.players) {
      map[p.id] = new Set()
    }
    if (Array.isArray(game.rounds)) {
      for (const r of game.rounds) {
        if (r.dealerId && r.contractId && map[r.dealerId]) {
          map[r.dealerId].add(r.contractId)
        }
      }
    }
    return map
  }, [game.rounds, game.players])

  // Contrat sélectionné pour cette manche
  const [selectedContract, setSelectedContract] = useState(() => {
    // Proposer le premier contrat non encore joué par le donneur actuel
    const played = contractsPlayedByDealer[currentDealer?.id] || new Set()
    const available = BARBU_CONTRACTS.find(c => !played.has(c.id))
    return available ? available.id : 'plis'
  })

  // Saisie spécifique par contrat :
  // 1. Plis : nombre de plis (0..13) par joueur
  const [tricksCount, setTricksCount] = useState(() => {
    return Object.fromEntries(game.players.map(p => [p.id, 0]))
  })

  // 2. Cœurs : nombre de cœurs standard (0..12) + qui a pris l'As de Cœur (-6)
  const [heartsCount, setHeartsCount] = useState(() => {
    return Object.fromEntries(game.players.map(p => [p.id, 0]))
  })
  const [aceOfHeartsPlayerId, setAceOfHeartsPlayerId] = useState(null)

  // 3. Dames : nombre de dames (0..4) par joueur
  const [queensCount, setQueensCount] = useState(() => {
    return Object.fromEntries(game.players.map(p => [p.id, 0]))
  })

  // 4. Barbu : qui a pris le Roi de Cœur (-20 pts)
  const [barbuTakerId, setBarbuTakerId] = useState(null)

  // 5. Deux derniers plis : qui a fait le 12e pli (-10) et le 13e pli (-20)
  const [trick12PlayerId, setTrick12PlayerId] = useState(null)
  const [trick13PlayerId, setTrick13PlayerId] = useState(null)

  // 6. La Salade : score direct par joueur (doit faire -130 au total)
  const [saladeScores, setSaladeScores] = useState(() => {
    return Object.fromEntries(game.players.map(p => [p.id, 0]))
  })

  // 7. Domino : classement d'arrivée (1er: +45, 2e: +20, 3e: +5, 4e: -5)
  // Liste ordonnée des player IDs
  const [dominoRanks, setDominoRanks] = useState(() => {
    return game.players.map(p => p.id)
  })

  // Édition via ScorePad
  const [editingPlayer, setEditingPlayer] = useState(null)
  const [openPad, setOpenPad] = useState(false)
  const [padConfig, setPadConfig] = useState({ min: -130, max: 45, presets: [] })
  const [showBarbuErrorDialog, setShowBarbuErrorDialog] = useState(false)

  // Calcul du delta de manche pour chaque joueur selon le contrat actif
  const playerDeltas = useMemo(() => {
    const deltas = {}

    switch (selectedContract) {
      case 'plis': {
        for (const p of game.players) {
          deltas[p.id] = (tricksCount[p.id] || 0) * -2
        }
        break
      }
      case 'coeurs': {
        for (const p of game.players) {
          const normalHearts = (heartsCount[p.id] || 0) * -2
          const acePenalty = aceOfHeartsPlayerId === p.id ? -6 : 0
          deltas[p.id] = normalHearts + acePenalty
        }
        break
      }
      case 'dames': {
        for (const p of game.players) {
          deltas[p.id] = (queensCount[p.id] || 0) * -6
        }
        break
      }
      case 'barbu': {
        for (const p of game.players) {
          deltas[p.id] = barbuTakerId === p.id ? -20 : 0
        }
        break
      }
      case 'derniers': {
        for (const p of game.players) {
          let score = 0
          if (trick12PlayerId === p.id) score -= 10
          if (trick13PlayerId === p.id) score -= 20
          deltas[p.id] = score
        }
        break
      }
      case 'salade': {
        for (const p of game.players) {
          deltas[p.id] = saladeScores[p.id] || 0
        }
        break
      }
      case 'domino': {
        const DOMINO_POINTS = [45, 20, 5, -5]
        for (let i = 0; i < dominoRanks.length; i++) {
          const pId = dominoRanks[i]
          deltas[pId] = DOMINO_POINTS[i] != null ? DOMINO_POINTS[i] : 0
        }
        break
      }
      default: {
        for (const p of game.players) {
          deltas[p.id] = 0
        }
      }
    }

    return deltas
  }, [
    selectedContract,
    tricksCount,
    heartsCount,
    aceOfHeartsPlayerId,
    queensCount,
    barbuTakerId,
    trick12PlayerId,
    trick13PlayerId,
    saladeScores,
    dominoRanks,
    game.players,
  ])

  // Total de points distribués sur la manche actuelle
  const currentTotalAllocated = useMemo(() => {
    return Object.values(playerDeltas).reduce((sum, v) => sum + v, 0)
  }, [playerDeltas])

  const targetContract = BARBU_CONTRACTS.find(c => c.id === selectedContract)
  const isContractTotalValid = targetContract ? currentTotalAllocated === targetContract.totalPoints : true

  // Validation et enregistrement de la manche
  const submitRound = () => {
    const newScores = {}
    const delta = {}

    for (const p of game.players) {
      const d = playerDeltas[p.id] || 0
      delta[p.id] = d
      newScores[p.id] = (game.scores[p.id] || 0) + d
    }

    updateScores({
      scores: newScores,
      delta,
      contractId: selectedContract,
      dealerId: currentDealer.id,
      type: 'barbu',
    })

    // Réinitialisation des états pour la donne suivante
    setTricksCount(Object.fromEntries(game.players.map(p => [p.id, 0])))
    setHeartsCount(Object.fromEntries(game.players.map(p => [p.id, 0])))
    setAceOfHeartsPlayerId(null)
    setQueensCount(Object.fromEntries(game.players.map(p => [p.id, 0])))
    setBarbuTakerId(null)
    setTrick12PlayerId(null)
    setTrick13PlayerId(null)
    setSaladeScores(Object.fromEntries(game.players.map(p => [p.id, 0])))
    setDominoRanks(game.players.map(p => p.id))

    // Rotation du donneur
    const nextDealerIdx = (dealerIndex + 1) % game.players.length
    setDealerIndex(nextDealerIdx)

    // Suggérer le premier contrat disponible pour le nouveau donneur
    const nextDealer = game.players[nextDealerIdx]
    const nextPlayed = new Set(contractsPlayedByDealer[nextDealer?.id] || [])
    if (nextDealer?.id === currentDealer?.id) {
      nextPlayed.add(selectedContract)
    }
    const nextAvailable = BARBU_CONTRACTS.find(c => !nextPlayed.has(c.id))
    if (nextAvailable) {
      setSelectedContract(nextAvailable.id)
    }

    // Fin de partie si toutes les donnes sont terminées
    if (roundCount >= TOTAL_ROUNDS) {
      const winner = Object.entries(newScores).sort((a, b) => b[1] - a[1])[0][0]
      onFinish(winner)
    }
  }

  const handleValidate = () => {
    if (!isContractTotalValid) {
      setShowBarbuErrorDialog(true)
      return
    }
    submitRound()
  }

  // Rendu de l'icône du contrat
  const renderContractIcon = (id, size = 15) => {
    switch (id) {
      case 'plis': return <Layers size={size} />
      case 'coeurs': return <Heart size={size} />
      case 'dames': return <Crown size={size} />
      case 'barbu': return <Shield size={size} />
      case 'derniers': return <Clock size={size} />
      case 'salade': return <Flame size={size} />
      case 'domino': return <Trophy size={size} />
      default: return <HelpCircle size={size} />
    }
  }

  return (
    <div className="space-y-2 pt-0 select-none">
      <div className="school-card rounded-xl p-3 sm:p-4">
        {/* Bandeau Donneur & Progression des donnes */}
        <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-stone-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 whitespace-nowrap shrink-0">
              Donne {roundCount}/{TOTAL_ROUNDS}
            </span>
            <span className="text-stone-300 dark:text-slate-700 select-none">·</span>
            <div className="flex items-center gap-1.5 min-w-0">
              <Avatar player={currentDealer} size="2xs" />
              <span className="text-xs font-bold text-stone-800 dark:text-slate-200 truncate">
                Donneur : {currentDealer.name}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDealerIndex(idx => (idx + 1) % game.players.length)}
            className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-400 hover:text-stone-600 dark:hover:text-slate-300 transition-colors shrink-0"
            title="Changer de donneur manuellement"
            aria-label="Changer de donneur"
          >
            <RotateCw size={13} />
          </button>
        </div>

        {/* Sélecteur des 7 Contrats */}
        <div className="mb-3">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 truncate">
              Choix du Contrat ({contractsPlayedByDealer[currentDealer?.id]?.size || 0}/7)
            </span>
            {targetContract && (
              <span className="text-[11px] font-semibold text-[#c83b3b] whitespace-nowrap shrink-0">
                {targetContract.totalPoints > 0 ? `+${targetContract.totalPoints}` : targetContract.totalPoints} pts total
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {BARBU_CONTRACTS.map(contract => {
              const isSelected = selectedContract === contract.id
              const hasBeenPlayedByDealer = contractsPlayedByDealer[currentDealer?.id]?.has(contract.id)

              return (
                <button
                  key={contract.id}
                  type="button"
                  onClick={() => setSelectedContract(contract.id)}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer relative active:scale-[0.98] ${
                    isSelected
                      ? 'border-[#c83b3b] bg-[#c83b3b] text-white shadow-2xs'
                      : hasBeenPlayedByDealer
                      ? 'school-subtle opacity-50 border-dashed text-stone-500 dark:text-slate-500'
                      : 'school-subtle text-stone-700 dark:text-slate-300 hover:border-stone-400'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className={isSelected ? 'text-white' : 'text-[#c83b3b]'}>
                        {renderContractIcon(contract.id, 14)}
                      </span>
                      <span className="font-bold text-xs truncate">
                        {contract.short}
                      </span>
                    </div>
                    {hasBeenPlayedByDealer && !isSelected && (
                      <span className="text-[9px] px-1 rounded bg-stone-200/70 dark:bg-slate-700 text-stone-600 dark:text-slate-400 font-semibold">
                        Fait
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] block mt-0.5 truncate ${
                    isSelected ? 'text-white/85' : 'text-stone-400 dark:text-slate-500'
                  }`}>
                    {contract.rule}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Formulaire de saisie spécifique selon le contrat sélectionné */}
        <div className="pt-2 border-t border-stone-200/80 dark:border-slate-800 space-y-3">
          {/* CAS 1 : PAS DE PLIS */}
          {selectedContract === 'plis' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                  Nombre de plis réalisés (-2 pts / pli)
                </span>
                <span className={`text-[11px] font-semibold ${
                  Object.values(tricksCount).reduce((a, b) => a + b, 0) === 13 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#c83b3b]'
                }`}>
                  Total : {Object.values(tricksCount).reduce((a, b) => a + b, 0)} / 13 plis
                </span>
              </div>

              <div className="space-y-1.5">
                {game.players.map(p => {
                  const tricks = tricksCount[p.id] || 0
                  const delta = tricks * -2
                  const total = (game.scores[p.id] || 0) + delta

                  return (
                    <div
                      key={p.id}
                      className="px-3 py-2 rounded-xl border school-subtle flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar player={p} size="xs" />
                        <div className="min-w-0">
                          <span className="font-semibold text-xs truncate block">{p.name}</span>
                          <span className="text-[10px] text-stone-400 dark:text-slate-500">
                            {tricks} pli{tricks > 1 ? 's' : ''} ({delta} pts) · Total : {total}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 ml-auto">
                        <div className="flex items-center border border-stone-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                          <button
                            type="button"
                            onClick={() => setTricksCount(prev => ({ ...prev, [p.id]: Math.max(0, (prev[p.id] || 0) - 1) }))}
                            className="w-7 h-7 flex items-center justify-center font-bold text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-stone-900 dark:text-slate-100">
                            {tricks}
                          </span>
                          <button
                            type="button"
                            onClick={() => setTricksCount(prev => ({ ...prev, [p.id]: Math.min(13, (prev[p.id] || 0) + 1) }))}
                            className="w-7 h-7 flex items-center justify-center font-bold text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800"
                          >
                            +
                          </button>
                        </div>

                        <QuickScoreBadge
                          value={delta}
                          onChange={v => setTricksCount(prev => ({ ...prev, [p.id]: Math.round(Math.abs(v) / 2) }))}
                          onOpenPad={() => {
                            setEditingPlayer(p)
                            setPadConfig({ min: -26, max: 0, presets: [0, -2, -4, -6, -8, -10, -12, -26] })
                            setOpenPad(true)
                          }}
                          min={-26}
                          max={0}
                          step={2}
                          formatDisplay={v => `${v} pts`}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* CAS 2 : PAS DE CŒURS */}
          {selectedContract === 'coeurs' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                  Cartes de Cœur ramassées
                </span>
                <span className="text-[10px] text-stone-400 dark:text-slate-500">
                  12 Cœurs (-2) + As de Cœur (-6) = -30 pts
                </span>
              </div>

              <div className="space-y-1.5">
                {game.players.map(p => {
                  const hCount = heartsCount[p.id] || 0
                  const hasAce = aceOfHeartsPlayerId === p.id
                  const delta = (hCount * -2) + (hasAce ? -6 : 0)
                  const total = (game.scores[p.id] || 0) + delta

                  return (
                    <div
                      key={p.id}
                      className="px-3 py-2 rounded-xl border school-subtle flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar player={p} size="xs" />
                        <div className="min-w-0">
                          <span className="font-semibold text-xs truncate block">{p.name}</span>
                          <span className="text-[10px] text-stone-400 dark:text-slate-500">
                            {delta} pts · Total : {total}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-auto">
                        {/* Bouton As de Cœur */}
                        <button
                          type="button"
                          onClick={() => setAceOfHeartsPlayerId(prev => prev === p.id ? null : p.id)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                            hasAce
                              ? 'border-red-600 bg-red-600 text-white shadow-2xs'
                              : 'border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-600 dark:text-slate-400 hover:border-red-400'
                          }`}
                        >
                          ♥ As (-6)
                        </button>

                        {/* Compteur de Cœurs ordinaires */}
                        <div className="flex items-center border border-stone-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                          <button
                            type="button"
                            onClick={() => setHeartsCount(prev => ({ ...prev, [p.id]: Math.max(0, (prev[p.id] || 0) - 1) }))}
                            className="w-7 h-7 flex items-center justify-center font-bold text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-stone-900 dark:text-slate-100">
                            {hCount}
                          </span>
                          <button
                            type="button"
                            onClick={() => setHeartsCount(prev => ({ ...prev, [p.id]: Math.min(12, (prev[p.id] || 0) + 1) }))}
                            className="w-7 h-7 flex items-center justify-center font-bold text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800"
                          >
                            +
                          </button>
                        </div>

                        <QuickScoreBadge
                          value={delta}
                          onChange={v => {
                            const withoutAce = hasAce ? v + 6 : v
                            setHeartsCount(prev => ({ ...prev, [p.id]: Math.round(Math.abs(withoutAce) / 2) }))
                          }}
                          onOpenPad={() => {
                            setEditingPlayer(p)
                            setPadConfig({ min: -30, max: 0, presets: [0, -2, -4, -6, -8, -12, -30] })
                            setOpenPad(true)
                          }}
                          min={-30}
                          max={0}
                          step={2}
                          formatDisplay={v => `${v} pts`}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* CAS 3 : PAS DE DAMES */}
          {selectedContract === 'dames' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                  Dames ramassées (-6 pts / Dame)
                </span>
                <span className={`text-[11px] font-semibold ${
                  Object.values(queensCount).reduce((a, b) => a + b, 0) === 4 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#c83b3b]'
                }`}>
                  Total : {Object.values(queensCount).reduce((a, b) => a + b, 0)} / 4 Dames
                </span>
              </div>

              <div className="space-y-1.5">
                {game.players.map(p => {
                  const qCount = queensCount[p.id] || 0
                  const delta = qCount * -6
                  const total = (game.scores[p.id] || 0) + delta

                  return (
                    <div
                      key={p.id}
                      className="px-3 py-2 rounded-xl border school-subtle flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar player={p} size="xs" />
                        <div className="min-w-0">
                          <span className="font-semibold text-xs truncate block">{p.name}</span>
                          <span className="text-[10px] text-stone-400 dark:text-slate-500">
                            {qCount} Dame{qCount > 1 ? 's' : ''} ({delta} pts) · Total : {total}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-auto">
                        <div className="flex items-center gap-1">
                          {[0, 1, 2, 3, 4].map(num => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setQueensCount(prev => ({ ...prev, [p.id]: num }))}
                              className={`w-7 h-7 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                qCount === num
                                  ? 'border-[#c83b3b] bg-[#c83b3b] text-white shadow-2xs'
                                  : 'border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-600 dark:text-slate-300'
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>

                        <QuickScoreBadge
                          value={delta}
                          onChange={v => setQueensCount(prev => ({ ...prev, [p.id]: Math.round(Math.abs(v) / 6) }))}
                          onOpenPad={() => {
                            setEditingPlayer(p)
                            setPadConfig({ min: -24, max: 0, presets: [0, -6, -12, -18, -24] })
                            setOpenPad(true)
                          }}
                          min={-24}
                          max={0}
                          step={6}
                          formatDisplay={v => `${v} pts`}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* CAS 4 : LE BARBU (ROI DE CŒUR) */}
          {selectedContract === 'barbu' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                  Qui a ramassé le Roi de Cœur (-20 pts) ?
                </span>
                <span className="text-[10px] text-red-600 dark:text-red-400 font-bold">
                  ♥ Roi = -20 pts
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {game.players.map(p => {
                  const isTaker = barbuTakerId === p.id
                  const delta = isTaker ? -20 : 0
                  const total = (game.scores[p.id] || 0) + delta

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setBarbuTakerId(prev => prev === p.id ? null : p.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer select-none active:scale-[0.98] ${
                        isTaker
                          ? 'border-red-600 bg-red-600/10 dark:bg-red-950/30 text-red-950 dark:text-red-200 ring-2 ring-red-500'
                          : 'school-subtle text-stone-700 dark:text-slate-300 hover:border-red-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar player={p} size="xs" />
                        <div className="text-left min-w-0">
                          <span className="font-bold text-xs truncate block">{p.name}</span>
                          <span className="text-[10px] text-stone-400 dark:text-slate-500">
                            {isTaker ? '-20 pts' : '0 pt'} · Total : {total}
                          </span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                        isTaker ? 'bg-red-600 text-white shadow-2xs' : 'bg-stone-100 dark:bg-slate-800 text-stone-500'
                      }`}>
                        {isTaker ? 'Le Barbu !' : 'Évité'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* CAS 5 : DEUX DERNIERS PLIS */}
          {selectedContract === 'derniers' && (
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 block mb-1">
                Attribution des 2 derniers plis
              </span>

              {/* 12e Pli (-10 pts) */}
              <div className="p-2.5 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-stone-800 dark:text-slate-200">
                    12e Pli (avant-dernier) : -10 pts
                  </span>
                  <span className="text-[10px] text-stone-400 dark:text-slate-500 font-semibold">
                    Sélectionner le preneur
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {game.players.map(p => {
                    const isSelected = trick12PlayerId === p.id
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setTrick12PlayerId(prev => prev === p.id ? null : p.id)}
                        className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-amber-600 bg-amber-600 text-white shadow-2xs'
                            : 'border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-stone-700 dark:text-slate-300'
                        }`}
                      >
                        <Avatar player={p} size="2xs" />
                        <span className="truncate">{p.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 13e Pli (-20 pts) */}
              <div className="p-2.5 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-stone-800 dark:text-slate-200">
                    13e Pli (dernier) : -20 pts
                  </span>
                  <span className="text-[10px] text-stone-400 dark:text-slate-500 font-semibold">
                    Sélectionner le preneur
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {game.players.map(p => {
                    const isSelected = trick13PlayerId === p.id
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setTrick13PlayerId(prev => prev === p.id ? null : p.id)}
                        className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-red-600 bg-red-600 text-white shadow-2xs'
                            : 'border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-stone-700 dark:text-slate-300'
                        }`}
                      >
                        <Avatar player={p} size="2xs" />
                        <span className="truncate">{p.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* CAS 6 : LA SALADE */}
          {selectedContract === 'salade' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                  Tous les malus combinés (Total de la donne = -130 pts)
                </span>
                <span className={`text-[11px] font-semibold ${
                  Object.values(saladeScores).reduce((a, b) => a + b, 0) === -130 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#c83b3b]'
                }`}>
                  Distribué : {Object.values(saladeScores).reduce((a, b) => a + b, 0)} / -130 pts
                </span>
              </div>

              <div className="space-y-1.5">
                {game.players.map(p => {
                  const score = saladeScores[p.id] || 0
                  const total = (game.scores[p.id] || 0) + score

                  return (
                    <div
                      key={p.id}
                      className="px-3 py-2 rounded-xl border school-subtle flex items-center justify-between gap-2"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPlayer(p)
                          setPadConfig({ min: -130, max: 0, presets: [0, -10, -20, -30, -40, -50, -60, -70, -130] })
                          setOpenPad(true)
                        }}
                        className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer select-none flex-1"
                      >
                        <Avatar player={p} size="xs" />
                        <div className="min-w-0">
                          <span className="font-semibold text-xs truncate block">{p.name}</span>
                          <span className="text-[10px] text-stone-400 dark:text-slate-500">
                            Pénalité Salade : {score} pts · Total : {total}
                          </span>
                        </div>
                      </button>

                      <QuickScoreBadge
                        value={score}
                        onChange={v => setSaladeScores(prev => ({ ...prev, [p.id]: v }))}
                        onOpenPad={() => {
                          setEditingPlayer(p)
                          setPadConfig({ min: -130, max: 0, presets: [0, -10, -20, -30, -40, -50, -60, -70, -130] })
                          setOpenPad(true)
                        }}
                        min={-130}
                        max={0}
                        step={2}
                        formatDisplay={v => `${v} pts`}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* CAS 7 : LE DOMINO */}
          {selectedContract === 'domino' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                  Classement d'arrivée au Domino
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  1er +45 · 2e +20 · 3e +5 · 4e -5
                </span>
              </div>

              <div className="space-y-1.5">
                {dominoRanks.map((pId, index) => {
                  const p = game.players.find(pl => pl.id === pId)
                  if (!p) return null
                  const points = [45, 20, 5, -5][index]
                  const rankLabels = ['1er (Gagnant)', '2e place', '3e place', '4e (Dernier)']

                  return (
                    <div
                      key={p.id}
                      className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                        index === 0
                          ? 'border-emerald-500/80 bg-emerald-50/50 dark:bg-emerald-950/20'
                          : index === 3
                          ? 'border-[#c83b3b]/60 bg-[#c83b3b]/5 dark:bg-[#c83b3b]/15'
                          : 'school-subtle'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-emerald-600 text-white' : 'bg-stone-200 dark:bg-slate-700 text-stone-700 dark:text-slate-300'
                        }`}>
                          {index + 1}
                        </span>
                        <Avatar player={p} size="xs" />
                        <div className="min-w-0">
                          <span className="font-semibold text-xs truncate block">{p.name}</span>
                          <span className="text-[10px] text-stone-400 dark:text-slate-500">
                            {rankLabels[index]} · Total : {(game.scores[p.id] || 0) + points}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Flèches pour monter ou descendre dans le classement */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => {
                              if (index === 0) return
                              setDominoRanks(prev => {
                                const arr = [...prev]
                                const temp = arr[index - 1]
                                arr[index - 1] = arr[index]
                                arr[index] = temp
                                return arr
                              })
                            }}
                            className="w-7 h-7 rounded-lg border border-stone-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs disabled:opacity-30 hover:bg-stone-100 dark:hover:bg-slate-800"
                            title="Monter d'une place"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            disabled={index === dominoRanks.length - 1}
                            onClick={() => {
                              if (index === dominoRanks.length - 1) return
                              setDominoRanks(prev => {
                                const arr = [...prev]
                                const temp = arr[index + 1]
                                arr[index + 1] = arr[index]
                                arr[index] = temp
                                return arr
                              })
                            }}
                            className="w-7 h-7 rounded-lg border border-stone-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs disabled:opacity-30 hover:bg-stone-100 dark:hover:bg-slate-800"
                            title="Descendre d'une place"
                          >
                            ▼
                          </button>
                        </div>

                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          points > 0
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-[#c83b3b] text-white shadow-2xs'
                        }`}>
                          {points > 0 ? `+${points}` : points} pts
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Récapitulatif & Bouton de validation */}
          <div className="pt-2 border-t border-stone-200/80 dark:border-slate-800">
            {!isContractTotalValid && (
              <div className="flex items-center gap-1.5 text-xs text-[#c83b3b] font-medium mb-2 p-2 rounded-lg bg-[#c83b3b]/10 border border-[#c83b3b]/20">
                <AlertCircle size={14} className="shrink-0" />
                <span>
                  Attention : le total des points saisis ({currentTotalAllocated} pts) ne correspond pas au total théorique du contrat ({targetContract?.totalPoints} pts).
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleValidate}
              className={`w-full py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-[0.99] cursor-pointer ${
                isContractTotalValid
                  ? 'bg-[#c83b3b] hover:bg-[#b03030] text-white'
                  : 'bg-stone-200 dark:bg-slate-800 text-stone-600 dark:text-slate-300 hover:bg-stone-300 dark:hover:bg-slate-700'
              }`}
            >
              {isContractTotalValid
                ? `Valider la donne ${roundCount} (${targetContract?.name})`
                : `Valider la donne ${roundCount} (${currentTotalAllocated}/${targetContract?.totalPoints} pts)`}
            </button>
          </div>
        </div>
      </div>

      {/* Dialog d'avertissement total incorrect pour le contrat */}
      <Dialog
        open={showBarbuErrorDialog}
        onClose={() => setShowBarbuErrorDialog(false)}
        title={`Total incorrect (${targetContract?.name})`}
      >
        <div className="space-y-3 text-xs">
          <p className="text-stone-600 dark:text-slate-300 leading-relaxed">
            Le total des points saisis (<strong>{currentTotalAllocated} pts</strong>) ne correspond pas au total réglementaire du contrat <strong>{targetContract?.name}</strong> (<strong>{targetContract?.totalPoints} pts</strong>).
          </p>

          <div className="p-2.5 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 space-y-1.5 font-medium">
            <div className="flex justify-between items-center">
              <span>Total attendu :</span>
              <strong className="text-stone-800 dark:text-slate-200">{targetContract?.totalPoints} pts</strong>
            </div>
            <div className="flex justify-between items-center">
              <span>Total saisi actuellement :</span>
              <strong className="text-[#c83b3b]">{currentTotalAllocated} pts</strong>
            </div>
            <div className="flex justify-between items-center">
              <span>Écart :</span>
              <strong className="text-[#c83b3b]">
                {Math.abs(currentTotalAllocated - (targetContract?.totalPoints || 0))} pts {currentTotalAllocated > (targetContract?.totalPoints || 0) ? 'en trop' : 'manquants'}
              </strong>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowBarbuErrorDialog(false)}
              className="w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white btn-margin-red cursor-pointer shadow-xs active:scale-[0.99] transition-all"
            >
              Ajuster les points
            </button>
          </div>
        </div>
      </Dialog>

      {/* BottomSheet de saisie précise de points si besoin */}
      <BottomSheet
        open={openPad}
        onClose={() => setOpenPad(false)}
        title={editingPlayer ? `Pénalité de ${editingPlayer.name}` : 'Saisie du score'}
        subtitle={`Contrat : ${targetContract?.name}`}
      >
        {editingPlayer && (
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Avatar player={editingPlayer} size="md" />
              <div>
                <span className="font-bold text-base block">{editingPlayer.name}</span>
                <span className="text-xs text-stone-500 dark:text-slate-400">
                  Total actuel : {game.scores[editingPlayer.id] || 0} pts
                </span>
              </div>
            </div>

            <ScorePad
              value={playerDeltas[editingPlayer.id] || 0}
              onChange={val => {
                if (selectedContract === 'salade') {
                  setSaladeScores(prev => ({ ...prev, [editingPlayer.id]: val }))
                }
              }}
              onConfirm={() => setOpenPad(false)}
              min={padConfig.min}
              max={padConfig.max}
              presets={padConfig.presets}
            />
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
