import { useState, useMemo, useRef } from 'react'
import {
  Layers,
  Heart,
  Crown,
  Clock,
  Leaf,
  Trophy,
  RotateCw,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Mustache } from '../ui/MustacheIcon'
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

  const contractButtonRefs = useRef({})
  const handleSelectContract = (id) => {
    setSelectedContract(id)
    const el = contractButtonRefs.current[id]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }

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
  const [showBarbuErrorDialog, setShowBarbuErrorDialog] = useState(false)

  const handleOpenPad = (player) => {
    setEditingPlayer(player)
    setOpenPad(true)
  }

  // Navigation séquentielle et validation entre joueurs dans le ScorePad
  const currentEditingIndex = useMemo(() => {
    if (!editingPlayer) return -1
    return game.players.findIndex(p => p.id === editingPlayer.id)
  }, [editingPlayer, game.players])

  const hasNextPlayer = currentEditingIndex >= 0 && currentEditingIndex < game.players.length - 1
  const nextPlayer = hasNextPlayer ? game.players[currentEditingIndex + 1] : null
  const hasPrevPlayer = currentEditingIndex > 0
  const prevPlayer = hasPrevPlayer ? game.players[currentEditingIndex - 1] : null

  const handleConfirmPad = () => {
    if (hasNextPlayer && nextPlayer) {
      setEditingPlayer(nextPlayer)
    } else {
      setOpenPad(false)
    }
  }

  const confirmLabel = hasNextPlayer && nextPlayer
    ? `Valider & Suivant (${nextPlayer.name})`
    : 'Valider et terminer'

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

  // Configuration dynamique et réactive du ScorePad selon le contrat actif et le joueur sélectionné
  const currentPadProps = useMemo(() => {
    if (!editingPlayer) return {}
    const pId = editingPlayer.id
    const currentBase = game.scores[pId] || 0

    switch (selectedContract) {
      case 'plis': {
        return {
          min: 0,
          max: 13,
          step: 1,
          showPlus: false,
          label: 'Nombre de plis réalisés',
          subLabel: '-2 pts / pli',
          presets: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
          customButtons: [],
          formatDisplay: v => `${v} pli${v > 1 ? 's' : ''}`,
          formatTotal: v => {
            const delta = v * -2
            const newTot = currentBase + delta
            return `${delta} pts · Nouveau total : ${newTot} pts`
          },
          value: tricksCount[pId] || 0,
          onChange: val => {
            const clamped = Math.max(0, Math.min(13, val))
            setTricksCount(prev => ({ ...prev, [pId]: clamped }))
          },
        }
      }
      case 'coeurs': {
        const hasAce = aceOfHeartsPlayerId === pId
        return {
          min: 0,
          max: 12,
          step: 1,
          showPlus: false,
          label: 'Cœurs ramassés (hors As)',
          subLabel: '-2 pts / ♥',
          presets: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          customButtons: [],
          formatDisplay: v => `${v} ♥`,
          formatTotal: v => {
            const delta = (v * -2) + (hasAce ? -6 : 0)
            const newTot = currentBase + delta
            return `${delta} pts ${hasAce ? '(avec As -6)' : ''} · Nouveau total : ${newTot} pts`
          },
          value: heartsCount[pId] || 0,
          onChange: val => {
            const clamped = Math.max(0, Math.min(12, val))
            setHeartsCount(prev => ({ ...prev, [pId]: clamped }))
          },
        }
      }
      case 'dames': {
        return {
          min: 0,
          max: 4,
          step: 1,
          showPlus: false,
          label: 'Dames ramassées',
          subLabel: '-6 pts / Dame',
          presets: [
            { value: 0, label: '0 Dame' },
            { value: 1, label: '1 ♛' },
            { value: 2, label: '2 ♛' },
            { value: 3, label: '3 ♛' },
            { value: 4, label: '4 ♛' },
          ],
          customButtons: [],
          formatDisplay: v => `${v} ♛`,
          formatTotal: v => {
            const delta = v * -6
            const newTot = currentBase + delta
            return `${delta} pts · Nouveau total : ${newTot} pts`
          },
          value: queensCount[pId] || 0,
          onChange: val => {
            const clamped = Math.max(0, Math.min(4, val))
            setQueensCount(prev => ({ ...prev, [pId]: clamped }))
          },
        }
      }
      case 'salade': {
        return {
          min: -130,
          max: 0,
          step: 2,
          showPlus: false,
          label: 'Pénalités de la Salade',
          subLabel: 'Tous malus (-130 total)',
          presets: [0, -10, -20, -26, -30, -50, -70, -130],
          customButtons: [
            { label: '-2', delta: -2, sub: 'Pli' },
            { label: '-6', delta: -6, sub: 'Dame' },
            { label: '-10', delta: -10, sub: '12e' },
            { label: '-20', delta: -20, sub: 'Barbu/13e' },
            { label: '0', value: 0, sub: 'Reset' },
          ],
          formatDisplay: v => `${v} pts`,
          formatTotal: v => {
            const newTot = currentBase + v
            return `Pénalité : ${v} pts · Nouveau total : ${newTot} pts`
          },
          value: saladeScores[pId] || 0,
          onChange: val => {
            const clamped = Math.max(-130, Math.min(0, val))
            setSaladeScores(prev => ({ ...prev, [pId]: clamped }))
          },
        }
      }
      default: {
        return {
          min: -130,
          max: 45,
          step: 1,
          showPlus: true,
          label: 'Score',
          presets: [],
          value: playerDeltas[pId] || 0,
          onChange: () => {},
        }
      }
    }
  }, [
    editingPlayer,
    selectedContract,
    game.scores,
    tricksCount,
    heartsCount,
    queensCount,
    saladeScores,
    aceOfHeartsPlayerId,
    playerDeltas,
  ])

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
      case 'barbu': return <Mustache size={size} />
      case 'derniers': return <Clock size={size} />
      case 'salade': return <Leaf size={size} />
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

        {/* Sélecteur des 7 Contrats en pastilles défilantes (Slider / Scroll horizontal façon statistiques) */}
        <div className="mb-2.5">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 truncate">
              Choix du Contrat ({contractsPlayedByDealer[currentDealer?.id]?.size || 0}/7)
            </span>
            {targetContract && (
              <span className="text-[11px] font-semibold text-[#c83b3b] whitespace-nowrap shrink-0">
                {targetContract.totalPoints > 0 ? `+${targetContract.totalPoints}` : targetContract.totalPoints} pts total
              </span>
            )}
          </div>

          {/* Pastilles avec scroll horizontal (façon statistiques) */}
          <div className="overflow-x-auto scrollbar-hide py-1 -mx-3 px-3 sm:-mx-4 sm:px-4">
            <div className="flex items-center gap-1.5 w-max">
              {BARBU_CONTRACTS.map(contract => {
                const isSelected = selectedContract === contract.id
                const hasBeenPlayedByDealer = contractsPlayedByDealer[currentDealer?.id]?.has(contract.id)

                return (
                  <button
                    key={contract.id}
                    ref={el => { if (el) contractButtonRefs.current[contract.id] = el }}
                    type="button"
                    onClick={() => handleSelectContract(contract.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer select-none active:scale-95 ${
                      isSelected
                        ? 'btn-margin-red text-white shadow-xs'
                        : hasBeenPlayedByDealer
                        ? 'bg-stone-100/60 dark:bg-slate-800/40 opacity-60 text-stone-400 dark:text-slate-500 border border-dashed border-stone-200/80 dark:border-slate-700/60'
                        : 'bg-white dark:bg-slate-800 text-stone-700 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white border border-stone-200 dark:border-slate-700 hover:border-stone-400 shadow-2xs'
                    }`}
                  >
                    <span className={isSelected ? 'text-white' : 'text-[#c83b3b]'}>
                      {renderContractIcon(contract.id, 13)}
                    </span>
                    <span>{contract.short}</span>
                    {hasBeenPlayedByDealer && !isSelected && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-stone-200/80 dark:bg-slate-700 text-stone-500 dark:text-slate-400 font-bold">
                        Fait
                      </span>
                    )}
                    {isSelected && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-white font-bold">
                        {contract.totalPoints > 0 ? `+${contract.totalPoints}` : contract.totalPoints}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Règle et description du contrat sélectionné */}
          {targetContract && (
            <div className="flex items-center gap-1.5 mt-1.5 px-2.5 py-1.5 rounded-xl bg-stone-100/80 dark:bg-slate-800/60 border border-stone-200/60 dark:border-slate-700/50 text-[11px] leading-snug">
              <span className="text-[#c83b3b] shrink-0">
                {renderContractIcon(targetContract.id, 13)}
              </span>
              <span className="font-bold text-stone-800 dark:text-slate-200 shrink-0">
                {targetContract.label} :
              </span>
              <span className="text-stone-600 dark:text-slate-300 min-w-0 flex-1">
                {targetContract.rule}
              </span>
            </div>
          )}
        </div>

        {/* Formulaire de saisie spécifique selon le contrat sélectionné */}
        <div className="pt-2 border-t border-stone-200/80 dark:border-slate-800 space-y-3">
          {/* CAS 1 : PAS DE PLIS */}
          {selectedContract === 'plis' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                  Plis réalisés
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  Object.values(tricksCount).reduce((a, b) => a + b, 0) === 13
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-stone-100 text-stone-600 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {Object.values(tricksCount).reduce((a, b) => a + b, 0)} / 13 plis
                </span>
              </div>

              <div className="space-y-1.5">
                {game.players.map(p => {
                  const tricks = tricksCount[p.id] || 0
                  const delta = tricks * -2
                  const currentTotal = game.scores[p.id] || 0
                  const projectedTotal = currentTotal + delta

                  return (
                    <div
                      key={p.id}
                      className="px-3 py-2.5 rounded-xl border school-subtle flex items-center justify-between gap-2 hover:border-[#c83b3b]/40 transition-all"
                    >
                      <button
                        type="button"
                        onClick={() => handleOpenPad(p)}
                        className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer select-none active:opacity-80 transition-opacity"
                      >
                        <Avatar player={p} size="xs" />
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-xs truncate block text-stone-900 dark:text-slate-100">
                            {p.name}
                          </span>
                          <span className="text-[10px] text-stone-400 dark:text-slate-500 block">
                            {delta < 0 ? (
                              <>Total : {currentTotal} <strong className="font-bold text-[#c83b3b] dark:text-red-300">➔ {projectedTotal} pts</strong></>
                            ) : (
                              `Total : ${currentTotal} pts`
                            )}
                          </span>
                        </div>
                      </button>

                      <QuickScoreBadge
                        value={tricks}
                        onChange={v => {
                          const val = Math.max(0, Math.min(13, v))
                          setTricksCount(prev => ({ ...prev, [p.id]: val }))
                        }}
                        onOpenPad={() => handleOpenPad(p)}
                        min={0}
                        max={13}
                        step={1}
                        showPlus={false}
                        formatDisplay={v => `${v} pli${v > 1 ? 's' : ''}`}
                        formatSub={v => `${v * -2} pts`}
                        formatBubble={v => {
                          const d = v * -2
                          const proj = currentTotal + d
                          return { text: `${d} pts (total ${proj})`, variant: v > 0 ? 'danger' : 'default' }
                        }}
                      />
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
                  Cœurs ramassés
                </span>
                <span className="text-[10px] text-stone-500 dark:text-slate-400 font-semibold">
                  12 cœurs (-2) + As (-6)
                </span>
              </div>

              <div className="space-y-1.5">
                {game.players.map(p => {
                  const hCount = heartsCount[p.id] || 0
                  const hasAce = aceOfHeartsPlayerId === p.id
                  const delta = (hCount * -2) + (hasAce ? -6 : 0)
                  const currentTotal = game.scores[p.id] || 0
                  const projectedTotal = currentTotal + delta

                  return (
                    <div
                      key={p.id}
                      className="px-3 py-2.5 rounded-xl border school-subtle hover:border-[#c83b3b]/40 transition-all"
                    >
                      {/* Ligne 1 : Nom du joueur à gauche + Pastille As de Cœur à droite */}
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenPad(p)}
                          className="flex items-center gap-2 min-w-0 text-left cursor-pointer select-none active:opacity-80 transition-opacity"
                        >
                          <Avatar player={p} size="xs" />
                          <span className="font-semibold text-xs truncate text-stone-900 dark:text-slate-100">
                            {p.name}
                          </span>
                        </button>

                        {/* Pastille As de Cœur à sa place en haut à droite */}
                        <button
                          type="button"
                          onClick={() => setAceOfHeartsPlayerId(prev => prev === p.id ? null : p.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer select-none active:scale-95 shrink-0 ${
                            hasAce
                              ? 'border-[#c83b3b] bg-[#c83b3b] text-white shadow-2xs'
                              : 'border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-600 dark:text-slate-300 hover:border-[#c83b3b]/60 hover:text-[#c83b3b]'
                          }`}
                        >
                          ♥ As (-6 pts)
                        </button>
                      </div>

                      {/* Ligne 2 : Total avec évolution en bas à gauche + Roulette tactile de Cœurs à droite */}
                      <div className="flex items-center justify-between gap-2 pt-2 mt-2 border-t border-stone-200/50 dark:border-slate-800/60">
                        <button
                          type="button"
                          onClick={() => handleOpenPad(p)}
                          className="text-left text-xs shrink-0 select-none cursor-pointer active:opacity-80 transition-opacity min-w-0 truncate"
                        >
                          <span className="text-stone-500 dark:text-slate-400">Total : {currentTotal}</span>
                          {delta < 0 ? (
                            <span className="text-[#c83b3b] dark:text-red-300 font-bold ml-1.5">
                              ➔ {projectedTotal} pts <span className="opacity-75">({delta} pts)</span>
                            </span>
                          ) : (
                            <span className="text-stone-400 dark:text-slate-500 ml-1.5">
                              ➔ {projectedTotal} pts
                            </span>
                          )}
                        </button>

                        {/* Roulette tactile de Cœurs ordinaires */}
                        <QuickScoreBadge
                          value={hCount}
                          onChange={v => {
                            const val = Math.max(0, Math.min(12, v))
                            setHeartsCount(prev => ({ ...prev, [p.id]: val }))
                          }}
                          onOpenPad={() => handleOpenPad(p)}
                          min={0}
                          max={12}
                          step={1}
                          showPlus={false}
                          formatDisplay={v => `${v} ♥`}
                          formatBubble={v => {
                            const d = (v * -2) + (hasAce ? -6 : 0)
                            const proj = currentTotal + d
                            return { text: `${d} pts (total ${proj})`, variant: d < 0 ? 'danger' : 'default' }
                          }}
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
                  Dames ramassées
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  Object.values(queensCount).reduce((a, b) => a + b, 0) === 4
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-stone-100 text-stone-600 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {Object.values(queensCount).reduce((a, b) => a + b, 0)} / 4 Dames
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
                      className="px-3 py-2 rounded-xl border school-subtle"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenPad(p)}
                          className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer select-none active:opacity-80 transition-opacity"
                        >
                          <Avatar player={p} size="xs" />
                          <div className="min-w-0">
                            <span className="font-semibold text-xs truncate block text-stone-900 dark:text-slate-100">{p.name}</span>
                            <span className="text-[10px] text-stone-400 dark:text-slate-500">
                              {delta < 0 ? (
                                <>Total : {game.scores[p.id] || 0} <strong className="font-bold text-[#c83b3b] dark:text-red-300">➔ {total} pts</strong></>
                              ) : (
                                `Total : ${total} pts`
                              )}
                            </span>
                          </div>
                        </button>

                        <span className={`min-w-14 text-center px-2 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                          delta < 0
                            ? 'bg-[#c83b3b]/10 dark:bg-[#c83b3b]/20 text-[#c83b3b] dark:text-red-300'
                            : 'bg-stone-100 dark:bg-slate-800 text-stone-500'
                        }`}>
                          {delta} pts
                        </span>
                      </div>

                      <div className="pt-1.5 mt-1.5 border-t border-stone-200/50 dark:border-slate-800/60">
                        <div className="grid grid-cols-5 gap-1.5">
                          {[0, 1, 2, 3, 4].map(num => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setQueensCount(prev => ({ ...prev, [p.id]: num }))}
                              className={`py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center justify-center active:scale-95 ${
                                qCount === num
                                  ? 'border-[#c83b3b] bg-[#c83b3b] text-white shadow-2xs'
                                  : 'border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-600 dark:text-slate-300 hover:border-stone-400'
                              }`}
                            >
                              {num === 0 ? '0' : `${num} ♛`}
                            </button>
                          ))}
                        </div>
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
                  Roi de Cœur
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  barbuTakerId
                    ? 'bg-[#c83b3b]/15 text-[#c83b3b] dark:text-red-300'
                    : 'bg-stone-100 text-stone-600 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {barbuTakerId ? 'Preneur désigné' : 'À désigner'}
                </span>
              </div>

              <div className="space-y-1.5">
                {game.players.map(p => {
                  const isTaker = barbuTakerId === p.id
                  const delta = isTaker ? -20 : 0
                  const total = (game.scores[p.id] || 0) + delta

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setBarbuTakerId(prev => prev === p.id ? null : p.id)}
                      className={`w-full px-3 py-2 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer select-none active:scale-[0.99] ${
                        isTaker
                          ? 'border-[#c83b3b] bg-[#c83b3b]/10 dark:bg-[#c83b3b]/20 text-[#c83b3b] dark:text-red-200 ring-2 ring-[#c83b3b]/30'
                          : 'school-subtle text-stone-700 dark:text-slate-300 hover:border-[#c83b3b]/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar player={p} size="xs" />
                        <div className="text-left min-w-0">
                          <span className="font-semibold text-xs truncate block">{p.name}</span>
                          <span className="text-[10px] text-stone-400 dark:text-slate-500">
                            Total : {total}
                          </span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                        isTaker ? 'bg-[#c83b3b] text-white shadow-2xs' : 'bg-stone-100 dark:bg-slate-800 text-stone-500'
                      }`}>
                        {isTaker ? '♥ Le Barbu (-20)' : 'Évité (0 pt)'}
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
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                  Attribution des 2 derniers plis
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  trick12PlayerId && trick13PlayerId
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-stone-100 text-stone-600 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {[trick12PlayerId, trick13PlayerId].filter(Boolean).length} / 2 plis
                </span>
              </div>

              {/* 12e Pli (-10 pts) */}
              <div className="p-2.5 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs font-bold text-stone-800 dark:text-slate-200 whitespace-nowrap">
                      12ᵉ pli <span className="font-normal text-stone-500 dark:text-slate-400 text-[11px]">(avant-dernier)</span>
                    </span>
                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-[#c83b3b]/10 dark:bg-[#c83b3b]/20 text-[#c83b3b] dark:text-red-300 shrink-0 whitespace-nowrap">
                      -10 pts
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
                    trick12PlayerId
                      ? 'bg-[#c83b3b]/15 text-[#c83b3b] dark:text-red-300'
                      : 'bg-stone-100 text-stone-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {trick12PlayerId ? (game.players.find(p => p.id === trick12PlayerId)?.name || 'Désigné') : 'À désigner'}
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
                        className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none active:scale-95 ${
                          isSelected
                            ? 'border-[#c83b3b] bg-[#c83b3b] text-white shadow-2xs'
                            : 'border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-stone-700 dark:text-slate-300 hover:border-[#c83b3b]/50'
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
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs font-bold text-stone-800 dark:text-slate-200 whitespace-nowrap">
                      13ᵉ pli <span className="font-normal text-stone-500 dark:text-slate-400 text-[11px]">(dernier)</span>
                    </span>
                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-[#c83b3b]/10 dark:bg-[#c83b3b]/20 text-[#c83b3b] dark:text-red-300 shrink-0 whitespace-nowrap">
                      -20 pts
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
                    trick13PlayerId
                      ? 'bg-[#c83b3b]/15 text-[#c83b3b] dark:text-red-300'
                      : 'bg-stone-100 text-stone-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {trick13PlayerId ? (game.players.find(p => p.id === trick13PlayerId)?.name || 'Désigné') : 'À désigner'}
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
                        className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none active:scale-95 ${
                          isSelected
                            ? 'border-[#c83b3b] bg-[#c83b3b] text-white shadow-2xs'
                            : 'border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-stone-700 dark:text-slate-300 hover:border-[#c83b3b]/50'
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
                  Total distribué
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  Object.values(saladeScores).reduce((a, b) => a + b, 0) === -130
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-stone-100 text-stone-600 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {Object.values(saladeScores).reduce((a, b) => a + b, 0)} / -130 pts
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
                        onClick={() => handleOpenPad(p)}
                        className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer select-none flex-1 active:opacity-80 transition-opacity"
                      >
                        <Avatar player={p} size="xs" />
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-xs truncate block text-stone-900 dark:text-slate-100">{p.name}</span>
                          <span className="text-[10px] text-stone-400 dark:text-slate-500">
                            {score < 0 ? (
                              <>Total : {game.scores[p.id] || 0} <strong className="font-bold text-[#c83b3b] dark:text-red-300">➔ {total} pts</strong></>
                            ) : (
                              `Total : ${game.scores[p.id] || 0} pts`
                            )}
                          </span>
                        </div>
                      </button>

                      <QuickScoreBadge
                        value={score}
                        onChange={v => setSaladeScores(prev => ({ ...prev, [p.id]: v }))}
                        onOpenPad={() => handleOpenPad(p)}
                        min={-130}
                        max={0}
                        step={2}
                        showPlus={false}
                        formatDisplay={v => `${v} pts`}
                        formatBubble={v => {
                          const proj = (game.scores[p.id] || 0) + v
                          return { text: `${v} pts (total ${proj})`, variant: v < 0 ? 'danger' : 'default' }
                        }}
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
                  Classement d'arrivée
                </span>
                <span className="text-[10px] text-stone-400 dark:text-slate-500">
                  Ordre décroissant
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
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          index === 0 ? 'bg-emerald-600 text-white' : 'bg-stone-200 dark:bg-slate-700 text-stone-700 dark:text-slate-300'
                        }`}>
                          {index + 1}
                        </span>
                        <Avatar player={p} size="xs" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-semibold text-xs truncate">{p.name}</span>
                            <span className="text-[10px] text-stone-400 dark:text-slate-500 whitespace-nowrap shrink-0">
                              · Total : {(game.scores[p.id] || 0) + points}
                            </span>
                          </div>
                          <span className="text-[10px] text-stone-500 dark:text-slate-400 block truncate">
                            {rankLabels[index]}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
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
            <button
              type="button"
              onClick={handleValidate}
              className={`w-full py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-[0.99] cursor-pointer ${
                isContractTotalValid
                  ? 'bg-[#c83b3b] hover:bg-[#b03030] text-white'
                  : 'bg-stone-200 dark:bg-slate-800 text-stone-600 dark:text-slate-300 hover:bg-stone-300 dark:hover:bg-slate-700'
              }`}
            >
              {isContractTotalValid ? (
                <span className="inline-flex items-center justify-center gap-1.5">
                  <span>Valider la donne {roundCount}</span>
                  {targetContract?.label && (
                    <span className="text-xs font-normal opacity-85">({targetContract.label})</span>
                  )}
                </span>
              ) : (
                <span className="inline-flex items-center justify-center gap-1.5">
                  <span>Valider la donne {roundCount}</span>
                  <span className="text-xs font-normal opacity-85">({currentTotalAllocated}/{targetContract?.totalPoints} pts)</span>
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Dialog d'avertissement total incorrect pour le contrat */}
      <Dialog
        open={showBarbuErrorDialog}
        onClose={() => setShowBarbuErrorDialog(false)}
        title={`Total incorrect (${targetContract?.label})`}
      >
        <div className="space-y-3 text-xs">
          <p className="text-stone-600 dark:text-slate-300 leading-relaxed">
            Le total des points saisis (<strong>{currentTotalAllocated} pts</strong>) ne correspond pas au total réglementaire du contrat <strong>{targetContract?.label}</strong> (<strong>{targetContract?.totalPoints} pts</strong>).
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

      {/* BottomSheet de saisie précise de points via ScorePad */}
      <BottomSheet
        open={openPad}
        onClose={() => setOpenPad(false)}
        title={editingPlayer ? `Saisie pour ${editingPlayer.name}` : 'Saisie du score'}
        subtitle={`Contrat : ${targetContract?.label || ''}`}
      >
        {editingPlayer && (
          <div className="p-4 space-y-3">
            {/* Sélecteur rapide des joueurs (pastilles tactiles) */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-0.5 -mx-1 px-1">
              {game.players.map((p, idx) => {
                const isSelected = p.id === editingPlayer.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setEditingPlayer(p)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer select-none active:scale-95 ${
                      isSelected
                        ? 'btn-margin-red text-white shadow-xs'
                        : 'bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 hover:bg-stone-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Avatar player={p} size="2xs" />
                    <span className="truncate max-w-[80px]">{p.name}</span>
                    <span className={`text-[10px] font-bold px-1 rounded ${
                      isSelected ? 'bg-white/20 text-white' : 'text-stone-400 dark:text-slate-500'
                    }`}>
                      {idx + 1}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* En-tête joueur avec total et chevrons précédent / suivant */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 dark:bg-slate-800/50 border border-stone-200/70 dark:border-slate-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar player={editingPlayer} size="md" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base truncate block text-stone-900 dark:text-slate-100">
                      {editingPlayer.name}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-stone-200/80 dark:bg-slate-700 text-stone-600 dark:text-slate-300 shrink-0">
                      {currentEditingIndex + 1} / {game.players.length}
                    </span>
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

            {/* Pour le contrat Pas de Cœurs : interrupteur As de Cœur (-6 pts) */}
            {selectedContract === 'coeurs' && (
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200/80 dark:border-slate-800 bg-stone-50/60 dark:bg-slate-800/40">
                <div className="flex items-center gap-2">
                  <Heart size={16} className="text-[#c83b3b]" fill="currentColor" />
                  <span className="text-xs font-bold text-stone-800 dark:text-slate-200">As de Cœur</span>
                  <span className="text-[11px] text-[#c83b3b] font-semibold">(-6 pts)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAceOfHeartsPlayerId(prev => prev === editingPlayer.id ? null : editingPlayer.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    aceOfHeartsPlayerId === editingPlayer.id
                      ? 'border-[#c83b3b] bg-[#c83b3b] text-white shadow-2xs'
                      : 'border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-600 dark:text-slate-300 hover:border-[#c83b3b]/60 hover:text-[#c83b3b]'
                  }`}
                >
                  {aceOfHeartsPlayerId === editingPlayer.id ? '✓ A pris l\'As (-6 pts)' : 'N\'a pas l\'As'}
                </button>
              </div>
            )}

            <ScorePad
              key={editingPlayer.id}
              value={currentPadProps.value}
              onChange={currentPadProps.onChange}
              onConfirm={handleConfirmPad}
              confirmLabel={confirmLabel}
              min={currentPadProps.min}
              max={currentPadProps.max}
              step={currentPadProps.step}
              label={currentPadProps.label}
              subLabel={currentPadProps.subLabel}
              presets={currentPadProps.presets}
              customButtons={currentPadProps.customButtons}
              formatDisplay={currentPadProps.formatDisplay}
              formatTotal={currentPadProps.formatTotal}
              showPlus={currentPadProps.showPlus ?? false}
            />
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
