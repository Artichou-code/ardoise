import { useState, useMemo } from 'react'
import { Trophy, VenetianMask, Check, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { Avatar } from '../ui/Avatar'
import { QuickScoreBadge } from '../ui/QuickScoreBadge'
import { BottomSheet } from '../ui/BottomSheet'
import { ScorePad } from '../ui/ScorePad'
import { Dialog } from '../ui/Dialog'

export function DixitEngine({ game, onFinish }) {
  const { updateScores } = useGame()
  const roundNum = (game.rounds?.length || 0) + 1
  const WIN_SCORE = game.config?.limit || 30

  // Conteur de la manche : par défaut, rotation selon le numéro de manche
  const [storytellerId, setStorytellerId] = useState(() => {
    if (game.restoredRound?.storytellerId) return game.restoredRound.storytellerId
    const defaultIdx = (game.rounds?.length || 0) % game.players.length
    return game.players[defaultIdx]?.id || game.players[0]?.id
  })

  // Points marqués dans cette manche par chaque joueur
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

  const [editingPlayer, setEditingPlayer] = useState(null)
  const [showRulesMemo, setShowRulesMemo] = useState(false)

  // Calcul du score maximum théorique par manche selon les règles officielles Dixit :
  // - Conteur : 0 pt ou 3 pts (max 3)
  // - Devins : 3 pts (si trouvé) + 1 pt par vote de bluff reçu sur sa carte.
  //   Nombre max de votants = nombre de joueurs - 2 (le conteur ne vote pas, on ne vote pas pour soi).
  //   En règles officielles (notamment Dixit Odyssey), le bluff est plafonné à 3 pts max.
  const playerCount = game.players?.length || 4
  const maxBluff = playerCount <= 5 ? Math.max(1, playerCount - 2) : 3
  const maxGuesserPoints = 3 + maxBluff // 5 pts à 4 joueurs, 6 pts à 5+ joueurs
  const guesserValues = Array.from({ length: maxGuesserPoints + 1 }, (_, i) => i)

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

  // Raccourcis officiels en un clic
  const applyAllOrNoneFound = () => {
    // Tous ou aucun ont trouvé : Conteur = 0, Autres = 2 pts
    setRoundPoints(prev => {
      const next = { ...prev }
      for (const p of game.players) {
        next[p.id] = p.id === storytellerId ? 0 : 2
      }
      return next
    })
  }

  const applyBalancedClueBase = () => {
    // Indice réussi de base : Conteur = 3 pts
    setRoundPoints(prev => ({
      ...prev,
      [storytellerId]: 3,
    }))
  }

  // Calcul des nouveaux scores et détection de victoire
  const calculatedResult = useMemo(() => {
    const currentScores = game.scores || {}
    const newScores = {}
    const deltas = {}
    let highestScore = -1
    let winnerId = null
    let hasWinner = false

    for (const p of game.players) {
      const pts = roundPoints[p.id] || 0
      const total = (currentScores[p.id] || 0) + pts
      newScores[p.id] = total
      deltas[p.id] = pts

      if (total >= WIN_SCORE) {
        hasWinner = true
      }
      if (total > highestScore) {
        highestScore = total
        winnerId = p.id
      }
    }

    return {
      newScores,
      deltas,
      hasWinner,
      winnerId,
    }
  }, [game.scores, game.players, roundPoints, WIN_SCORE])

  const handleValidate = () => {
    const { newScores, deltas, hasWinner, winnerId } = calculatedResult

    updateScores({
      scores: newScores,
      delta: deltas,
      roundPoints,
      storytellerId,
      type: 'dixit',
    })

    if (hasWinner && winnerId) {
      setTimeout(() => {
        onFinish?.(winnerId)
      }, 150)
    }
  }

  const activeStoryteller = game.players.find(p => p.id === storytellerId)

  return (
    <div className="space-y-3 pb-8">
      {/* Sélection du Conteur de la manche */}
      <div className="p-3 rounded-2xl school-card border border-stone-200/80 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-slate-300">
            <VenetianMask size={14} className="text-[#c83b3b]" />
            <span>Conteur de la manche :</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-stone-400 dark:text-slate-500 font-medium">
              (Tap pour changer)
            </span>
            <button
              type="button"
              onClick={() => setShowRulesMemo(true)}
              className="p-1 rounded-lg border border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-500 dark:text-slate-400 transition-colors shrink-0 cursor-pointer"
              title="Rappel du barème officiel"
            >
              <HelpCircle size={13} />
            </button>
          </div>
        </div>

        <div
          className={`py-1 ${
            game.players.length <= 5
              ? 'grid gap-1.5'
              : 'flex items-center gap-1.5 overflow-x-auto scrollbar-hide'
          }`}
          style={game.players.length <= 5 ? { gridTemplateColumns: `repeat(${game.players.length}, minmax(0, 1fr))` } : {}}
        >
          {game.players.map((p) => {
            const isStoryteller = p.id === storytellerId
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setStorytellerId(p.id)}
                className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer border active:scale-[0.98] ${
                  game.players.length > 5 ? 'shrink-0 min-w-[58px] max-w-[76px]' : 'min-w-0 w-full'
                } ${
                  isStoryteller
                    ? 'border-[#c83b3b] bg-[#c83b3b] text-white shadow-2xs'
                    : 'border-stone-200/80 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-stone-700 dark:text-slate-300 hover:border-stone-300'
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar player={p} size="xs" />
                  {isStoryteller && (
                    <span className="absolute -top-1 -right-1 text-[9px] leading-none text-white drop-shadow-xs">★</span>
                  )}
                </div>
                <span className={`text-[11px] font-semibold truncate w-full text-center leading-tight ${isStoryteller ? 'text-white' : ''}`}>
                  {p.name}
                </span>
              </button>
            )
          })}
        </div>

        {/* Raccourcis officiels rapides */}
        <div className="flex items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={applyAllOrNoneFound}
            className="flex-1 py-1.5 px-2 rounded-lg text-[10px] font-semibold bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 text-stone-600 dark:text-slate-400 transition-colors cursor-pointer text-center whitespace-nowrap truncate"
            title="Le conteur n'a trouvé personne ou a fait l'unanimité : Conteur 0 pt, Autres 2 pts"
          >
            Tous ou aucun (2 pts)
          </button>
          <button
            type="button"
            onClick={applyBalancedClueBase}
            className="py-1.5 px-2.5 rounded-lg text-[10px] font-semibold bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 text-stone-600 dark:text-slate-400 transition-colors cursor-pointer text-center whitespace-nowrap shrink-0"
            title="Donne 3 points au conteur"
          >
            Conteur +3 pts
          </button>
        </div>
      </div>

      {/* Cartes de saisie des joueurs */}
      <div className="space-y-2.5">
        {game.players.map((p) => {
          const isStoryteller = p.id === storytellerId
          const currentTotal = game.scores?.[p.id] || 0
          const pts = roundPoints[p.id] || 0
          const projected = currentTotal + pts
          const willWin = projected >= WIN_SCORE

          return (
            <div
              key={p.id}
              className={`p-3 rounded-2xl school-card border transition-all ${
                willWin
                  ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/40'
                  : isStoryteller
                  ? 'border-[#c83b3b]/40 bg-[#c83b3b]/5 dark:bg-[#c83b3b]/10'
                  : 'border-stone-200/90 dark:border-slate-800'
              }`}
            >
              {/* Entête et saisie du joueur */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar player={p} size="sm" />
                  <div className="min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 leading-tight">
                      <span className="font-serif-title font-bold text-sm text-stone-900 dark:text-slate-100 truncate leading-tight">
                        {p.name}
                      </span>
                      {isStoryteller && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#c83b3b] text-white leading-none shrink-0">
                          Conteur
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-stone-400 dark:text-slate-500 leading-tight mt-0.5 truncate block">
                      Total cumulé : {projected} / {WIN_SCORE} pts
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <QuickScoreBadge
                    value={pts}
                    onChange={(val) => setRoundPoints(prev => ({ ...prev, [p.id]: Math.max(0, Number(val) || 0) }))}
                    onOpenPad={() => setEditingPlayer(p)}
                    min={0}
                    max={isStoryteller ? 3 : maxGuesserPoints}
                    step={1}
                    values={isStoryteller ? [0, 1, 2, 3] : guesserValues}
                    showPlus={true}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

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

      {/* Dialog Mémo du barème officiel */}
      <Dialog
        open={showRulesMemo}
        onClose={() => setShowRulesMemo(false)}
        title="Barème officiel de Dixit"
      >
        <div className="space-y-2 text-xs text-stone-600 dark:text-slate-300">
          <p className="leading-relaxed font-semibold">
            Attribution des points à chaque manche :
          </p>
          <ul className="space-y-1.5 pl-3 list-disc text-[11px]">
            <li>
              <strong>Tous ou Aucun ne trouvent la carte :</strong> Le conteur marque <strong>0 pt</strong>, tous les autres joueurs marquent <strong>2 pts</strong>.
            </li>
            <li>
              <strong>Au moins un joueur (mais pas tous) trouve :</strong> Le conteur marque <strong>3 pts</strong>, et chaque joueur ayant trouvé marque <strong>3 pts</strong>.
            </li>
            <li>
              <strong>Bonus de tromperie (Bluff) :</strong> Chaque joueur (hormis le conteur) marque <strong>+1 pt</strong> pour chaque vote reçu sur sa propre carte.
            </li>
            <li>
              <strong>Fin de partie :</strong> Le premier joueur à atteindre ou dépasser <strong>30 points</strong> remporte la partie.
            </li>
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

      {/* BottomSheet avec ScorePad pour saisie tactile au pavé numérique */}
      <BottomSheet open={!!editingPlayer} onClose={() => setEditingPlayer(null)}>
        {editingPlayer && (() => {
          const editingIsStoryteller = editingPlayer.id === storytellerId
          const padMax = editingIsStoryteller ? 3 : maxGuesserPoints
          const padPresets = editingIsStoryteller ? [0, 1, 2, 3] : guesserValues
          const padSubLabel = editingIsStoryteller
            ? 'Conteur : 0 pt ou 3 pts'
            : `Trouvé (+3) · Bluff (max +${maxBluff})`

          return (
            <div className="px-4 pt-1 pb-6 space-y-3">
              <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-stone-100/80 dark:bg-slate-800/60 border border-stone-200/80 dark:border-slate-700/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar player={editingPlayer} size="sm" />
                  <div className="min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 leading-tight">
                      <span className="font-serif-title font-bold text-sm text-stone-900 dark:text-slate-100 truncate leading-tight">
                        {editingPlayer.name}
                      </span>
                      {editingPlayer.id === storytellerId && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#c83b3b] text-white leading-none shrink-0">
                          Conteur
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-stone-500 dark:text-slate-400 block truncate leading-tight mt-0.5">
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
                    title="Précédent"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextInPad}
                    disabled={!hasNextPlayer}
                    className="p-1.5 rounded-lg border border-stone-200 dark:border-slate-700 disabled:opacity-30 disabled:pointer-events-none hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
                    title="Suivant"
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
                label="Points de la manche"
                subLabel={padSubLabel}
                min={0}
                max={padMax}
                step={1}
                presets={padPresets}
                customButtons={[]}
                baseScore={game.scores?.[editingPlayer.id] || 0}
                formatTotal={(val) => {
                  const cur = game.scores?.[editingPlayer.id] || 0
                  return `+${val} pts · Nouveau total : ${cur + val} / ${WIN_SCORE} pts`
                }}
                showPlus={true}
              />
            </div>
          )
        })()}
      </BottomSheet>
    </div>
  )
}
