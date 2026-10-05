import { useState, useMemo } from 'react'
import { Trophy, Users, LayoutGrid, Hash, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react'
import { FrogFace } from '../ui/FrogFaceIcon'
import { useGame } from '../../context/GameContext'
import { Avatar } from '../ui/Avatar'
import { QuickScoreBadge } from '../ui/QuickScoreBadge'
import { BottomSheet } from '../ui/BottomSheet'
import { ScorePad } from '../ui/ScorePad'
import { Dialog } from '../ui/Dialog'
import { formatTeamNames } from '../../utils/gameUtils'

// Métadonnées d'aide pour les 4 colonnes de la Mare de 8 cartes (2x4)
const COLUMN_METAS = [
  { label: 'Gauche', sub: 'vs Voisin Gauche', color: 'text-amber-600 dark:text-amber-400' },
  { label: 'Centre 1', sub: 'vs Votre Mare', color: 'text-stone-600 dark:text-slate-400' },
  { label: 'Centre 2', sub: 'vs Votre Mare', color: 'text-stone-600 dark:text-slate-400' },
  { label: 'Droite', sub: 'vs Voisin Droite', color: 'text-emerald-600 dark:text-emerald-400' },
]

export function SymbioseEngine({ game }) {
  const { updateScores } = useGame()
  const isTeamMode = game.config?.mode === 'team' && game.players.length === 4
  const isDuelMode = game.players.length === 2

  // Mode de saisie : 'grid' (grille 8 cartes détaillée officielle) ou 'direct' (total direct)
  const [inputMode, setInputMode] = useState('grid')

  // État des 8 cartes de la Mare pour chaque joueur : { [playerId]: [c0, c1, c2, c3, c4, c5, c6, c7] }
  const [cardsByPlayer, setCardsByPlayer] = useState(() => {
    const init = {}
    for (const p of game.players) {
      if (game.restoredRound?.cardsByPlayer?.[p.id]) {
        init[p.id] = [...game.restoredRound.cardsByPlayer[p.id]]
      } else {
        init[p.id] = [0, 0, 0, 0, 0, 0, 0, 0]
      }
    }
    return init
  })

  // Scores totaux directs (utilisés si inputMode === 'direct')
  const [directTotals, setDirectTotals] = useState(() => {
    const init = {}
    for (const p of game.players) {
      init[p.id] = game.restoredDelta?.[p.id] != null ? game.restoredDelta[p.id] : 0
    }
    return init
  })

  // État du modal ScorePad : { playerId, cardIndex: number | null }
  const [padTarget, setPadTarget] = useState(null)
  const [showZeroConfirm, setShowZeroConfirm] = useState(false)
  const [showRulesMemo, setShowRulesMemo] = useState(false)

  // Calcul du total pour un joueur selon le mode
  const getPlayerTotal = (playerId) => {
    if (inputMode === 'direct') {
      return directTotals[playerId] || 0
    }
    const cards = cardsByPlayer[playerId] || [0, 0, 0, 0, 0, 0, 0, 0]
    return cards.reduce((sum, v) => sum + (Number(v) || 0), 0)
  }

  // Calcul des scores d'équipe si applicable (Équipe 1 = P0 + P1, Équipe 2 = P2 + P3)
  const teamTotals = useMemo(() => {
    if (!isTeamMode) return null
    const t1 = getPlayerTotal(game.players[0]?.id) + getPlayerTotal(game.players[1]?.id)
    const t2 = getPlayerTotal(game.players[2]?.id) + getPlayerTotal(game.players[3]?.id)
    return { team1: t1, team2: t2 }
  }, [cardsByPlayer, directTotals, inputMode, isTeamMode, game.players])

  const currentRoundNum = (game.rounds?.length || 0) + 1
  const prevScoreT1 = (game.scores?.[game.players[0]?.id] || 0) + (game.scores?.[game.players[1]?.id] || 0)
  const prevScoreT2 = (game.scores?.[game.players[2]?.id] || 0) + (game.scores?.[game.players[3]?.id] || 0)
  const newScoreT1 = prevScoreT1 + (teamTotals?.team1 || 0)
  const newScoreT2 = prevScoreT2 + (teamTotals?.team2 || 0)

  // Gestion des changements de score
  const handleCardScoreChange = (playerId, cardIndex, value) => {
    const clamped = Math.max(0, Number(value) || 0)
    setCardsByPlayer(prev => {
      const current = prev[playerId] ? [...prev[playerId]] : [0, 0, 0, 0, 0, 0, 0, 0]
      current[cardIndex] = clamped
      return { ...prev, [playerId]: current }
    })
  }

  const handleDirectTotalChange = (playerId, value) => {
    const clamped = Math.max(0, Number(value) || 0)
    setDirectTotals(prev => ({ ...prev, [playerId]: clamped }))
  }

  // Navigation dans le ScorePad (carte suivante / joueur suivant)
  const activePlayer = padTarget ? game.players.find(p => p.id === padTarget.playerId) : null
  const activePlayerIndex = activePlayer ? game.players.findIndex(p => p.id === activePlayer.id) : -1

  const hasNextPadTarget = inputMode === 'grid'
    ? ((padTarget?.cardIndex ?? 0) < 7 || activePlayerIndex < game.players.length - 1)
    : activePlayerIndex < game.players.length - 1

  const hasPrevPadTarget = inputMode === 'grid'
    ? ((padTarget?.cardIndex ?? 0) > 0 || activePlayerIndex > 0)
    : activePlayerIndex > 0

  const handlePadNext = () => {
    if (!padTarget) return
    if (inputMode === 'grid') {
      if (padTarget.cardIndex < 7) {
        // Carte suivante pour le même joueur
        setPadTarget({ playerId: padTarget.playerId, cardIndex: padTarget.cardIndex + 1 })
      } else if (activePlayerIndex < game.players.length - 1) {
        // 1ère carte du joueur suivant
        setPadTarget({ playerId: game.players[activePlayerIndex + 1].id, cardIndex: 0 })
      } else {
        setPadTarget(null)
      }
    } else {
      // Joueur suivant en mode direct
      if (activePlayerIndex < game.players.length - 1) {
        setPadTarget({ playerId: game.players[activePlayerIndex + 1].id, cardIndex: null })
      } else {
        setPadTarget(null)
      }
    }
  }

  const handlePadPrev = () => {
    if (!padTarget) return
    if (inputMode === 'grid') {
      if (padTarget.cardIndex > 0) {
        setPadTarget({ playerId: padTarget.playerId, cardIndex: padTarget.cardIndex - 1 })
      } else if (activePlayerIndex > 0) {
        const prevP = game.players[activePlayerIndex - 1]
        setPadTarget({ playerId: prevP.id, cardIndex: 7 })
      }
    } else if (activePlayerIndex > 0) {
      const prevP = game.players[activePlayerIndex - 1]
      setPadTarget({ playerId: prevP.id, cardIndex: null })
    }
  }

  const padConfirmLabel = useMemo(() => {
    if (!activePlayer) return 'Valider'
    const nextPlayer = activePlayerIndex < game.players.length - 1 ? game.players[activePlayerIndex + 1] : null

    if (inputMode === 'grid') {
      const cardIdx = padTarget?.cardIndex ?? 0
      if (cardIdx < 7) {
        return `Carte suivante (${cardIdx + 2}/8)`
      }
      if (nextPlayer) {
        return `Valider & Joueur suivant (${nextPlayer.name})`
      }
      return 'Valider et terminer'
    } else {
      if (nextPlayer) {
        return `Valider & Joueur suivant (${nextPlayer.name})`
      }
      return 'Valider et terminer'
    }
  }, [activePlayer, activePlayerIndex, game.players, inputMode, padTarget?.cardIndex])

  const handleValidate = () => {
    const allZero = game.players.every(p => getPlayerTotal(p.id) === 0)
    if (allZero) {
      setShowZeroConfirm(true)
      return
    }
    submitScores()
  }

  const submitScores = () => {
    const newScores = {}
    const delta = {}

    game.players.forEach(p => {
      const roundPts = getPlayerTotal(p.id)
      delta[p.id] = roundPts
      newScores[p.id] = (game.scores?.[p.id] || 0) + roundPts
    })

    const roundData = {
      cardsByPlayer,
      directTotals,
      inputMode,
      isTeamMode,
      isDuelMode,
    }

    updateScores({
      scores: newScores,
      delta,
      ...roundData,
      type: 'symbiose',
    })
  }

  return (
    <div className="space-y-3 pb-8">
      {/* Barre d'en-tête : Modes de jeu & Bascule Grille / Direct */}
      <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl school-card border border-stone-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          <span className="p-1.5 rounded-xl bg-[#c83b3b]/10 text-[#c83b3b] shrink-0">
            {isTeamMode ? <Users size={16} /> : <FrogFace size={16} />}
          </span>
          <div className="min-w-0">
            <h3 className="font-serif-title font-bold text-xs sm:text-sm text-stone-900 dark:text-slate-100 truncate">
              {isTeamMode ? 'Mode Équipe 2 vs 2' : isDuelMode ? 'Mode Duel (1 vs 1)' : 'Symbiose (Individuel)'}
            </h3>
            <p className="text-[10px] text-stone-500 dark:text-slate-400 truncate">
              {isTeamMode
                ? 'Addition des 2 Mares par équipe'
                : isDuelMode
                ? 'Rivière de 8 cartes'
                : 'La Mare de 8 cartes (grille 2×4)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowRulesMemo(true)}
            className="p-1.5 rounded-xl border border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-500 dark:text-slate-400 transition-colors"
            title="Aide au barème des colonnes"
          >
            <HelpCircle size={15} />
          </button>

          {/* Commutateur Grille 2x4 vs Total direct */}
          <div className="flex items-center p-0.5 bg-stone-100 dark:bg-slate-800 rounded-xl border border-stone-200/80 dark:border-slate-700/80">
            <button
              type="button"
              onClick={() => setInputMode('grid')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                inputMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-[#c83b3b] shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800 dark:text-slate-400'
              }`}
              title="Grille officielle des 8 cartes"
            >
              <LayoutGrid size={12} />
              <span className="hidden sm:inline">8 cartes</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode('direct')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                inputMode === 'direct'
                  ? 'bg-white dark:bg-slate-700 text-[#c83b3b] shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800 dark:text-slate-400'
              }`}
              title="Saisie directe du total"
            >
              <Hash size={12} />
              <span className="hidden sm:inline">Total</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cartes de saisie des joueurs */}
      <div className="space-y-3">
        {game.players.map((p, pIdx) => {
          const currentTotal = getPlayerTotal(p.id)
          const cumulatedTotal = (game.scores?.[p.id] || 0) + currentTotal
          const pCards = cardsByPlayer[p.id] || [0, 0, 0, 0, 0, 0, 0, 0]

          return (
            <div
              key={p.id}
              className="p-3 sm:p-3.5 rounded-2xl school-card border border-stone-200/90 dark:border-slate-800 space-y-2.5"
            >
              {/* Entête du joueur : Avatar, Nom, et Total */}
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
                      Total cumulé : {cumulatedTotal} pts
                    </span>
                  </div>
                </div>

                {/* Badge total du joueur */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-bold text-stone-400 dark:text-slate-500">Mare :</span>
                  <span className="font-serif-title font-extrabold text-base text-[#c83b3b] dark:text-rose-400">
                    {currentTotal} pts
                  </span>
                </div>
              </div>

              {/* Mode 1 : Grille officielle 2x4 (8 cartes) */}
              {inputMode === 'grid' ? (
                <div className="space-y-1.5">
                  {/* Légende discrète des colonnes de la Mare */}
                  <div className="grid grid-cols-4 gap-1 sm:gap-1.5 text-center">
                    {COLUMN_METAS.map((col, idx) => (
                      <div key={idx} className="text-[9px] font-semibold text-stone-400 dark:text-slate-500 truncate">
                        {col.label}
                      </div>
                    ))}
                  </div>

                  {/* Ligne 1 : Cartes 0, 1, 2, 3 */}
                  <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
                    {[0, 1, 2, 3].map((cardIdx) => (
                      <div key={cardIdx} className="flex flex-col items-center">
                        <QuickScoreBadge
                          value={pCards[cardIdx]}
                          onChange={(v) => handleCardScoreChange(p.id, cardIdx, v)}
                          onOpenPad={() => setPadTarget({ playerId: p.id, cardIndex: cardIdx })}
                          min={0}
                          max={99}
                          step={1}
                          showPlus={false}
                          className="w-full text-center"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Ligne 2 : Cartes 4, 5, 6, 7 */}
                  <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
                    {[4, 5, 6, 7].map((cardIdx) => (
                      <div key={cardIdx} className="flex flex-col items-center">
                        <QuickScoreBadge
                          value={pCards[cardIdx]}
                          onChange={(v) => handleCardScoreChange(p.id, cardIdx, v)}
                          onOpenPad={() => setPadTarget({ playerId: p.id, cardIndex: cardIdx })}
                          min={0}
                          max={99}
                          step={1}
                          showPlus={false}
                          className="w-full text-center"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Mode 2 : Saisie Directe du score total */
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-xs text-stone-600 dark:text-slate-400 font-medium min-w-0 truncate">
                    Score total de la Mare :
                  </span>
                  <QuickScoreBadge
                    value={directTotals[p.id] || 0}
                    onChange={(v) => handleDirectTotalChange(p.id, v)}
                    onOpenPad={() => setPadTarget({ playerId: p.id, cardIndex: null })}
                    min={0}
                    max={200}
                    step={1}
                    showPlus={true}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Aperçu de la manche par équipe avant validation (affichage direct sans bento imbriqué) */}
      {isTeamMode && teamTotals && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between px-1">
            <span className="font-serif-title font-bold text-xs text-stone-700 dark:text-slate-300 flex items-center gap-1.5">
              <Users size={13} className="text-[#c83b3b]" />
              Aperçu — Manche {currentRoundNum}
            </span>
            <span className="text-[10px] text-stone-400 dark:text-slate-500 font-medium">
              Points de la manche
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Équipe 1 */}
            <div className="flex flex-col justify-between rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 transition-all min-h-[54px] school-card border-[#c83b3b]/30 bg-[#c83b3b]/5 dark:bg-[#c83b3b]/10">
              {/* Ligne 1 : Avatars superposés à gauche (comme dans le header) et Score manche à droite */}
              <div className="flex items-center justify-between w-full">
                <div className="shrink-0 relative inline-flex items-center">
                  <div className="flex items-center -space-x-2.5">
                    <div className="relative rounded-full">
                      <Avatar player={game.players[0]} size="sm-compact" />
                    </div>
                    <div className="relative rounded-full">
                      <Avatar player={game.players[1]} size="sm-compact" />
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-w-0 flex items-center justify-end pl-1">
                  <span className="font-black tabular-nums leading-none text-2xl sm:text-3xl text-[#c83b3b] text-right">
                    +{teamTotals.team1}
                    <span className="text-xs font-sans font-bold text-[#c83b3b]/70 ml-0.5">pts</span>
                  </span>
                </div>
              </div>

              {/* Ligne 2 : Noms de l'équipe et calcul des mares regroupés avec ":" */}
              <div className="w-full mt-1 min-w-0">
                <div className="flex items-center gap-1 min-w-0 text-[10px] sm:text-[11px]">
                  <span className="font-bold text-[#c83b3b] dark:text-red-400 truncate leading-tight">
                    {formatTeamNames([game.players[0], game.players[1]], 8)}
                  </span>
                  <span className="font-bold text-stone-400 dark:text-slate-500 shrink-0">
                    :
                  </span>
                  <span className="font-semibold text-stone-500 dark:text-slate-400 shrink-0 tabular-nums">
                    {getPlayerTotal(game.players[0]?.id)} + {getPlayerTotal(game.players[1]?.id)}
                  </span>
                </div>
              </div>
            </div>

            {/* Équipe 2 */}
            <div className="flex flex-col justify-between rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 transition-all min-h-[54px] school-card border-[#1e3a5f]/30 bg-[#1e3a5f]/5 dark:bg-[#1e3a5f]/10">
              {/* Ligne 1 : Avatars superposés à gauche (comme dans le header) et Score manche à droite */}
              <div className="flex items-center justify-between w-full">
                <div className="shrink-0 relative inline-flex items-center">
                  <div className="flex items-center -space-x-2.5">
                    <div className="relative rounded-full">
                      <Avatar player={game.players[2]} size="sm-compact" />
                    </div>
                    <div className="relative rounded-full">
                      <Avatar player={game.players[3]} size="sm-compact" />
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-w-0 flex items-center justify-end pl-1">
                  <span className="font-black tabular-nums leading-none text-2xl sm:text-3xl text-[#1e3a5f] dark:text-sky-400 text-right">
                    +{teamTotals.team2}
                    <span className="text-xs font-sans font-bold text-[#1e3a5f]/70 dark:text-sky-400/70 ml-0.5">pts</span>
                  </span>
                </div>
              </div>

              {/* Ligne 2 : Noms de l'équipe et calcul des mares regroupés avec ":" */}
              <div className="w-full mt-1 min-w-0">
                <div className="flex items-center gap-1 min-w-0 text-[10px] sm:text-[11px]">
                  <span className="font-bold text-[#1e3a5f] dark:text-sky-400 truncate leading-tight">
                    {formatTeamNames([game.players[2], game.players[3]], 8)}
                  </span>
                  <span className="font-bold text-stone-400 dark:text-slate-500 shrink-0">
                    :
                  </span>
                  <span className="font-semibold text-stone-500 dark:text-slate-400 shrink-0 tabular-nums">
                    {getPlayerTotal(game.players[2]?.id)} + {getPlayerTotal(game.players[3]?.id)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bouton de validation principale */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleValidate}
          className="w-full py-3 rounded-xl bg-[#c83b3b] hover:bg-[#b03030] text-white font-bold text-sm shadow-sm transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
        >
          <Trophy size={16} />
          <span>Valider les scores</span>
        </button>
      </div>

      {/* Dialog d'avertissement scores à 0 */}
      <Dialog
        open={showZeroConfirm}
        onClose={() => setShowZeroConfirm(false)}
        title="Aucun score renseigné"
      >
        <div className="space-y-3 text-xs">
          <p className="text-stone-600 dark:text-slate-300 leading-relaxed">
            Tous les joueurs ont un score de <strong>0 point</strong> sur cette manche.
          </p>
          <p className="text-stone-500 dark:text-slate-400">
            Dans Symbiose, chaque joueur marque les points de ses 8 cartes (points fixes et combinaisons d'animaux/saisons).
          </p>
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setShowZeroConfirm(false)}
              className="flex-1 py-2.5 rounded-xl font-bold text-xs btn-margin-red text-white cursor-pointer"
            >
              Saisir les points
            </button>
            <button
              type="button"
              onClick={() => {
                setShowZeroConfirm(false)
                submitScores()
              }}
              className="py-2.5 px-3 rounded-xl font-semibold text-xs border border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-400 hover:bg-stone-100 cursor-pointer"
            >
              Valider 0 pt
            </button>
          </div>
        </div>
      </Dialog>

      {/* Dialog Mémo des colonnes de la Mare */}
      <Dialog
        open={showRulesMemo}
        onClose={() => setShowRulesMemo(false)}
        title="Comptage de la Mare (8 cartes)"
      >
        <div className="space-y-2.5 text-xs text-stone-600 dark:text-slate-300">
          <p className="leading-relaxed">
            Votre Mare est organisée en <strong>2 lignes de 4 colonnes</strong> :
          </p>
          <ul className="space-y-1.5 pl-3 list-disc">
            <li>
              <strong>Colonne de gauche (2 cartes) :</strong> Marque par rapport à toute la Mare du voisin à votre gauche (ou vis-à-vis en équipe).
            </li>
            <li>
              <strong>Colonnes centrales (4 cartes) :</strong> Marquent par rapport à toute votre propre Mare.
            </li>
            <li>
              <strong>Colonne de droite (2 cartes) :</strong> Marque par rapport à toute la Mare du voisin à votre droite (ou Rivière en Duel).
            </li>
            <li>
              <strong>Points fixes :</strong> Rapportent leurs points sans condition d'emplacement.
            </li>
          </ul>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowRulesMemo(false)}
              className="w-full py-2.5 rounded-xl font-bold text-xs btn-margin-red text-white cursor-pointer"
            >
              Compris
            </button>
          </div>
        </div>
      </Dialog>

      {/* BottomSheet avec ScorePad pour saisie tactile au pavé numérique */}
      <BottomSheet open={!!padTarget} onClose={() => setPadTarget(null)}>
        {activePlayer && (
          <div className="px-4 pt-1 pb-6 space-y-3">
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-stone-100/80 dark:bg-slate-800/60 border border-stone-200/80 dark:border-slate-700/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar player={activePlayer} size="sm" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-serif-title font-bold text-sm text-stone-900 dark:text-slate-100 truncate">
                      {activePlayer.name}
                    </span>
                    {isTeamMode && (
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md ${
                        activePlayerIndex < 2
                          ? 'bg-[#c83b3b]/15 text-[#c83b3b]'
                          : 'bg-[#1e3a5f]/15 text-[#1e3a5f] dark:text-sky-400'
                      }`}>
                        Éq. {activePlayerIndex < 2 ? '1' : '2'}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-stone-500 dark:text-slate-400 block truncate">
                    {inputMode === 'grid'
                      ? `Carte ${(padTarget.cardIndex ?? 0) + 1}/8 · Colonne ${COLUMN_METAS[(padTarget.cardIndex ?? 0) % 4]?.label}`
                      : `Score total de la Mare · Cumul actuel : ${game.scores?.[activePlayer.id] || 0} pts`}
                  </span>
                </div>
              </div>

              {/* Navigation précédente / suivante */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePadPrev}
                  disabled={!hasPrevPadTarget}
                  className="p-1.5 rounded-lg border border-stone-200 dark:border-slate-700 disabled:opacity-30 disabled:pointer-events-none hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
                  title="Précédent"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (hasNextPadTarget) {
                      if (inputMode === 'grid') {
                        if (padTarget.cardIndex < 7) {
                          setPadTarget({ playerId: padTarget.playerId, cardIndex: padTarget.cardIndex + 1 })
                        } else if (activePlayerIndex < game.players.length - 1) {
                          setPadTarget({ playerId: game.players[activePlayerIndex + 1].id, cardIndex: 0 })
                        }
                      } else if (activePlayerIndex < game.players.length - 1) {
                        setPadTarget({ playerId: game.players[activePlayerIndex + 1].id, cardIndex: null })
                      }
                    }
                  }}
                  disabled={!hasNextPadTarget}
                  className="p-1.5 rounded-lg border border-stone-200 dark:border-slate-700 disabled:opacity-30 disabled:pointer-events-none hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
                  title="Suivant"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Pavé de saisie tactile ScorePad */}
            <ScorePad
              key={`${activePlayer.id}-${inputMode}-${padTarget.cardIndex ?? 'direct'}`}
              value={
                inputMode === 'grid'
                  ? cardsByPlayer[activePlayer.id]?.[padTarget.cardIndex] || 0
                  : directTotals[activePlayer.id] || 0
              }
              onChange={(val) => {
                if (inputMode === 'grid') {
                  handleCardScoreChange(activePlayer.id, padTarget.cardIndex, val)
                } else {
                  handleDirectTotalChange(activePlayer.id, val)
                }
              }}
              onConfirm={handlePadNext}
              confirmLabel={padConfirmLabel}
              label={
                inputMode === 'grid'
                  ? `Points Carte ${(padTarget.cardIndex ?? 0) + 1}/8`
                  : 'Score total de la Mare'
              }
              subLabel={
                inputMode === 'grid'
                  ? COLUMN_METAS[(padTarget.cardIndex ?? 0) % 4]?.sub
                  : 'Somme des 8 cartes de la Mare'
              }
              min={0}
              max={inputMode === 'grid' ? 50 : 250}
              step={1}
              presets={
                inputMode === 'grid'
                  ? [0, 1, 2, 3, 4, 5, 6, 8]
                  : [0, 10, 15, 20, 25, 30, 35, 40]
              }
              baseScore={
                inputMode === 'grid'
                  ? (cardsByPlayer[activePlayer.id] || []).reduce((sum, c, i) => i === padTarget.cardIndex ? sum : sum + (c || 0), 0)
                  : game.scores?.[activePlayer.id] || 0
              }
              formatTotal={
                inputMode === 'grid'
                  ? (val) => {
                      const otherSum = (cardsByPlayer[activePlayer.id] || []).reduce(
                        (sum, c, i) => (i === padTarget.cardIndex ? sum : sum + (c || 0)),
                        0
                      )
                      return `Mare de ${activePlayer.name} : ${otherSum + val} pts`
                    }
                  : (val) => {
                      const cumul = game.scores?.[activePlayer.id] || 0
                      return `+${val} pts · Nouveau cumul : ${cumul + val} pts`
                    }
              }
              showPlus={inputMode !== 'grid'}
            />
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
