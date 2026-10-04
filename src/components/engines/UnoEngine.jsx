import { useState } from 'react'
import { Trophy, Check, AlertTriangle, ChevronLeft, ChevronRight, Flame } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { Avatar } from '../ui/Avatar'
import { QuickScoreBadge } from '../ui/QuickScoreBadge'
import { BottomSheet } from '../ui/BottomSheet'
import { ScorePad } from '../ui/ScorePad'
import { Dialog } from '../ui/Dialog'

export function UnoEngine({ game, onFinish }) {
  const { updateScores } = useGame()
  const LIMIT = game.config?.limit || 500
  const isHouseMode = game.config?.mode === 'house'

  // Gagnant de la manche (celui qui s'est débarrassé de toutes ses cartes)
  const [winnerId, setWinnerId] = useState(() => {
    return game.restoredRound?.winnerId || game.players[0]?.id || null
  })

  // Valeur des cartes restant dans la main de chaque joueur
  const [handPenalties, setHandPenalties] = useState(() => {
    const initial = {}
    for (const p of game.players) {
      if (game.restoredRound?.handPenalties && game.restoredRound.handPenalties[p.id] != null) {
        initial[p.id] = game.restoredRound.handPenalties[p.id]
      } else if (game.restoredDelta && game.restoredDelta[p.id] != null) {
        initial[p.id] = game.restoredDelta[p.id]
      } else {
        initial[p.id] = 0
      }
    }
    return initial
  })

  const [editingPlayer, setEditingPlayer] = useState(null)
  const [open, setOpen] = useState(false)
  const [showZeroConfirm, setShowZeroConfirm] = useState(false)

  // Navigation séquentielle entre les adversaires dans le ScorePad
  const opponents = game.players.filter(p => p.id !== winnerId)
  const currentOpponentIndex = editingPlayer ? opponents.findIndex(p => p.id === editingPlayer.id) : -1
  const hasPrevOpponent = currentOpponentIndex > 0
  const hasNextOpponent = currentOpponentIndex >= 0 && currentOpponentIndex < opponents.length - 1
  const prevOpponent = hasPrevOpponent ? opponents[currentOpponentIndex - 1] : null
  const nextOpponent = hasNextOpponent ? opponents[currentOpponentIndex + 1] : null

  const handleConfirmPad = () => {
    if (hasNextOpponent && nextOpponent) {
      setEditingPlayer(nextOpponent)
    } else {
      setOpen(false)
    }
  }

  const confirmLabel = hasNextOpponent && nextOpponent ? (
    <span className="inline-flex items-baseline justify-center gap-1.5 max-w-full">
      <span className="shrink-0">Valider & Suivant</span>
      <span className="font-normal opacity-85 truncate min-w-0">({nextOpponent.name})</span>
    </span>
  ) : (
    <span>Valider et terminer</span>
  )

  const handleToggleWinner = (id) => {
    setWinnerId(id)
    // Le vainqueur a nécessairement 0 point en main
    setHandPenalties(prev => ({ ...prev, [id]: 0 }))
  }

  const handleAddCards = (playerId, amount) => {
    setHandPenalties(prev => ({
      ...prev,
      [playerId]: Math.max(0, (prev[playerId] || 0) + amount),
    }))
  }

  // Calcul du pot total des cartes adverses (règle officielle)
  const totalOpponentPts = opponents.reduce((sum, p) => sum + (handPenalties[p.id] || 0), 0)

  // Score projeté du vainqueur de manche (en mode officiel)
  const winnerPlayer = game.players.find(p => p.id === winnerId)
  const winnerCurrentScore = (winnerId && game.scores[winnerId]) || 0
  const winnerProjectedScore = !isHouseMode ? winnerCurrentScore + totalOpponentPts : winnerCurrentScore
  const isWinnerReachingLimit = !isHouseMode && winnerProjectedScore >= LIMIT

  // Vérifier si un joueur atteint ou dépasse le seuil éliminatoire en mode maison
  const houseEliminatedPlayers = isHouseMode
    ? opponents.filter(p => (game.scores[p.id] || 0) + (handPenalties[p.id] || 0) >= LIMIT)
    : []

  const submitRound = () => {
    const newScores = {}
    const delta = {}

    for (const p of game.players) {
      if (!isHouseMode) {
        // Règle officielle : le vainqueur empoche la totalité des cartes des adversaires
        if (p.id === winnerId) {
          delta[p.id] = totalOpponentPts
          newScores[p.id] = (game.scores[p.id] || 0) + totalOpponentPts
        } else {
          delta[p.id] = 0
          newScores[p.id] = game.scores[p.id] || 0
        }
      } else {
        // Règle maison : chacun marque ses propres pénalités, vainqueur = 0
        const pts = p.id === winnerId ? 0 : (handPenalties[p.id] || 0)
        delta[p.id] = pts
        newScores[p.id] = (game.scores[p.id] || 0) + pts
      }
    }

    updateScores({
      scores: newScores,
      delta,
      winnerId,
      handPenalties,
      type: 'uno',
      mode: isHouseMode ? 'house' : 'official',
    })

    // Réinitialisation
    setHandPenalties(Object.fromEntries(game.players.map(p => [p.id, 0])))

    // Vérification de victoire / fin de partie
    if (!isHouseMode) {
      // Règle officielle : premier joueur à atteindre LIMIT (500 pts) gagne
      const overLimit = Object.entries(newScores).filter(([, s]) => s >= LIMIT)
      if (overLimit.length > 0) {
        const finalWinner = Object.entries(newScores).sort((a, b) => b[1] - a[1])[0][0]
        onFinish(finalWinner)
      }
    } else {
      // Règle maison : un joueur atteint LIMIT (500 pts) -> partie finie, le score le plus bas l'emporte
      const overLimit = Object.entries(newScores).filter(([, s]) => s >= LIMIT)
      if (overLimit.length > 0) {
        const finalWinner = Object.entries(newScores).sort((a, b) => a[1] - b[1])[0][0]
        onFinish(finalWinner)
      }
    }
  }

  const handleValidate = () => {
    if (totalOpponentPts === 0) {
      setShowZeroConfirm(true)
      return
    }
    submitRound()
  }

  // Boutons rapides adaptés aux cartes UNO pour le ScorePad
  const currentEditingScore = editingPlayer ? (handPenalties[editingPlayer.id] || 0) : 0
  const unoScorePadButtons = [
    {
      label: '+1',
      delta: 1,
      colorClass: 'bg-[#c83b3b]/15 hover:bg-[#c83b3b]/25 dark:bg-[#c83b3b]/20 text-[#c83b3b] dark:text-red-300 border border-[#c83b3b]/25',
    },
    {
      label: '+5',
      delta: 5,
      colorClass: 'bg-[#c83b3b]/25 hover:bg-[#c83b3b]/35 dark:bg-[#c83b3b]/30 text-[#c83b3b] dark:text-red-200 border border-[#c83b3b]/30',
    },
    {
      label: '+20 (Action)',
      delta: 20,
      colorClass: 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-200 border border-amber-500/35 font-bold',
    },
    {
      label: '+50 (Joker/+4)',
      delta: 50,
      colorClass: 'bg-[#c83b3b] hover:bg-[#b03030] text-white border border-[#c83b3b] shadow-2xs font-bold',
    },
    {
      label: '-1',
      delta: -1,
      colorClass: 'bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 text-stone-600 dark:text-slate-400 border border-stone-200 dark:border-slate-700',
    },
    {
      label: '0 pt',
      delta: -currentEditingScore,
      colorClass: 'bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-700 hover:border-[#c83b3b]/40 text-stone-600 dark:text-slate-400',
    },
  ]

  return (
    <div className="space-y-2 pt-0 select-none">
      <div className="school-card rounded-xl p-3 sm:p-4">
        {/* En-tête */}
        <div className="flex items-center justify-between gap-1.5 mb-2">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 flex items-center gap-1.5 shrink-0">
            <Trophy size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="whitespace-nowrap">Vainqueur de la manche</span>
          </p>
          <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 whitespace-nowrap shrink-0 border border-stone-200 dark:border-slate-700">
            <span className="hidden sm:inline">{isHouseMode ? 'Règle Maison · ' : 'Règle Officielle · '}</span>Seuil : {LIMIT} pts
          </span>
        </div>

        {/* Grille sélecteur du joueur qui s'est débarrassé de ses cartes en premier */}
        <div className={`grid gap-1 sm:gap-1.5 mb-2 ${
          game.players.length === 2 ? 'grid-cols-2' :
          game.players.length === 3 ? 'grid-cols-3' :
          game.players.length <= 4 ? 'grid-cols-2 sm:grid-cols-4' :
          'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
        }`}>
          {game.players.map(p => {
            const isWinner = winnerId === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleToggleWinner(p.id)}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border transition-all cursor-pointer select-none active:scale-[0.98] ${
                  isWinner
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xs ring-1 ring-emerald-600/40'
                    : 'school-subtle text-stone-700 dark:text-slate-300 hover:border-stone-400'
                }`}
              >
                <Avatar player={p} size="xs" leader={isWinner} leaderColor="#10b981" crown={isWinner} />
                <span className={`text-xs font-bold truncate flex-1 text-left ${isWinner ? 'text-white' : ''}`}>
                  {p.name}
                </span>
                {isWinner ? (
                  <Check size={13} className="text-white shrink-0" />
                ) : (
                  <span className="text-[10px] text-stone-400 dark:text-slate-500 shrink-0">0c</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Encadré dynamique récapitulatif du gagnant */}
        {!isHouseMode ? (
          <div className="mb-2 p-2 sm:p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/20 transition-all">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200 truncate">
                  Pot de la manche · {winnerPlayer?.name || 'Vainqueur'}
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                  Total : {winnerCurrentScore} <strong className="font-extrabold text-emerald-900 dark:text-emerald-100">➔ {winnerProjectedScore}</strong> / {LIMIT} pts
                </p>
              </div>

              <div className="flex flex-col items-end shrink-0">
                <span className="text-xs sm:text-sm font-black text-emerald-700 dark:text-emerald-300 tabular-nums px-2 py-0.5 rounded-lg bg-emerald-600/15 border border-emerald-600/30 whitespace-nowrap shadow-2xs">
                  +{totalOpponentPts} pts
                </span>
                <span className="text-[9px] font-semibold text-emerald-600/80 dark:text-emerald-400/80 mt-0.5 tabular-nums">
                  {Math.round((winnerProjectedScore / LIMIT) * 100)}%
                </span>
              </div>
            </div>

            {/* Barre de progression vers les 500 points */}
            <div className="mt-1.5 w-full bg-emerald-900/15 dark:bg-emerald-900/30 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-300 min-w-[4px]"
                style={{ width: `${Math.min(100, Math.max(0, Math.round((winnerProjectedScore / LIMIT) * 100)))}%` }}
              />
            </div>

            {isWinnerReachingLimit && (
              <div className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-200">
                <Flame size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Seuil de victoire des {LIMIT} points atteint !</span>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-2 p-2 rounded-xl border border-stone-200 dark:border-slate-800 school-subtle text-xs text-stone-600 dark:text-slate-400 flex items-center justify-between gap-2">
            <span className="truncate">Règle Maison : {winnerPlayer?.name} marque 0 pt, chacun ajoute ses pénalités.</span>
            <span className="font-bold text-stone-800 dark:text-slate-200 tabular-nums shrink-0">
              Seuil : {LIMIT} pts
            </span>
          </div>
        )}

        {/* Cartes restantes des adversaires */}
        <div className="pt-2 border-t border-stone-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 shrink-0">
              {!isHouseMode ? 'Cartes des adversaires' : 'Pénalités de la manche'}
            </p>
            <span className="text-[10px] text-stone-400 dark:text-slate-500 truncate text-right">
              0–9: Chiffre · Act: 20 · Joker: 50
            </span>
          </div>

          <div className="space-y-1.5">
            {(!isHouseMode ? opponents : game.players).map(p => {
              const isWinner = winnerId === p.id
              const currentTotal = game.scores[p.id] || 0
              const rawPts = handPenalties[p.id] || 0
              const projected = !isHouseMode ? currentTotal : currentTotal + rawPts
              const danger = isHouseMode && projected >= LIMIT

              if (isWinner && isHouseMode) {
                return (
                  <div
                    key={p.id}
                    className="px-2.5 py-1.5 rounded-xl border border-emerald-300/80 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar player={p} size="xs" leader leaderColor="#059669" crown />
                      <span className="font-semibold text-xs truncate block">{p.name}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-600/15 text-emerald-800 dark:text-emerald-300 border border-emerald-600/30 whitespace-nowrap shrink-0">
                      0 pt (Vainqueur)
                    </span>
                  </div>
                )
              }

              return (
                <div
                  key={p.id}
                  className="px-2.5 py-1.5 rounded-xl border school-subtle hover:border-stone-300 dark:hover:border-slate-700 flex items-center justify-between gap-2"
                >
                  <button
                    type="button"
                    onClick={() => { setEditingPlayer(p); setOpen(true) }}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer select-none"
                  >
                    <Avatar player={p} size="xs" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-xs truncate">{p.name}</span>
                        {danger && <AlertTriangle size={12} className="text-[#c83b3b] shrink-0" />}
                      </div>
                      <span className="text-[10px] text-stone-400 dark:text-slate-500 block truncate">
                        {isHouseMode && rawPts > 0 ? (
                          <span>{currentTotal} <strong className="text-[#c83b3b] font-bold">➔ {projected} pts</strong></span>
                        ) : (
                          `${currentTotal} pts`
                        )}
                      </span>
                    </div>
                  </button>

                  {/* Contrôles de score : Boutons rapides d'actions UNO + Roulette/ScorePad sur UNE SEULE LIGNE */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleAddCards(p.id, 20)}
                      className="px-1.5 py-1 rounded-md text-[10px] font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-200 border border-amber-500/30 transition-colors cursor-pointer"
                      title="Carte Action (+20 pts)"
                    >
                      +20
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddCards(p.id, 50)}
                      className="px-1.5 py-1 rounded-md text-[10px] font-bold bg-[#c83b3b]/15 hover:bg-[#c83b3b]/25 text-[#c83b3b] dark:text-rose-300 border border-[#c83b3b]/30 transition-colors cursor-pointer"
                      title="Carte Noire / +4 (+50 pts)"
                    >
                      +50
                    </button>

                    <QuickScoreBadge
                      value={rawPts}
                      onChange={v => setHandPenalties(prev => ({ ...prev, [p.id]: Math.max(0, v) }))}
                      onOpenPad={() => { setEditingPlayer(p); setOpen(true) }}
                      min={0}
                      step={1}
                      showPlus={true}
                      formatDisplay={(v) => `${v} pts`}
                      formatBubble={(v) => ({
                        text: `+${v} pts`,
                        variant: isHouseMode && projected >= LIMIT ? 'danger' : 'default',
                      })}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bouton de validation de la manche */}
        <div className="mt-4 pt-3 border-t border-stone-200/80 dark:border-slate-800">
          <button
            type="button"
            onClick={handleValidate}
            className="w-full py-2.5 sm:py-3 px-4 rounded-xl font-bold text-sm text-white bg-[#c83b3b] hover:bg-[#b03030] active:bg-[#9a2828] transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-2 select-none"
          >
            <Check size={16} className="shrink-0" />
            <span className="inline-flex items-baseline justify-center gap-1.5 flex-wrap text-center">
              <span>Valider la manche</span>
              {!isHouseMode && (
                <span className="text-[11px] font-normal text-white/85">
                  (+{totalOpponentPts} pts pour {winnerPlayer?.name || 'le gagnant'})
                </span>
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Feuille de saisie ScorePad dédiée */}
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title={editingPlayer ? `Cartes en main · ${editingPlayer.name}` : 'Cartes restantes'}
        subtitle="Saisie des cartes restantes pour le décompte"
      >
        {editingPlayer && (
          <div className="px-4 py-3 space-y-3">
            <div className="flex items-center justify-between p-2 rounded-xl bg-stone-100 dark:bg-slate-800/60 text-xs">
              <div className="flex items-center gap-2">
                <Avatar player={editingPlayer} size="xs" />
                <span className="font-bold text-stone-800 dark:text-slate-200">{editingPlayer.name}</span>
              </div>
              <span className="text-stone-500 dark:text-slate-400">
                Score actuel : <strong>{game.scores[editingPlayer.id] || 0} pts</strong>
              </span>
            </div>

            <div className="text-[11px] text-stone-500 dark:text-slate-400 bg-stone-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-stone-200/60 dark:border-slate-800 leading-snug">
              <strong className="text-stone-700 dark:text-slate-300">Rappel du barème officiel :</strong>
              <div className="grid grid-cols-3 gap-1 mt-1 text-center font-medium">
                <span className="p-1 rounded bg-stone-200/60 dark:bg-slate-800">0 à 9 : Valeur</span>
                <span className="p-1 rounded bg-amber-500/15 text-amber-800 dark:text-amber-200">Actions : 20 pts</span>
                <span className="p-1 rounded bg-[#c83b3b]/15 text-[#c83b3b] dark:text-rose-200">Noires : 50 pts</span>
              </div>
            </div>

            <ScorePad
              value={handPenalties[editingPlayer.id] || 0}
              onChange={val => setHandPenalties(prev => ({ ...prev, [editingPlayer.id]: Math.max(0, val) }))}
              onConfirm={handleConfirmPad}
              confirmLabel={confirmLabel}
              customButtons={unoScorePadButtons}
              min={0}
              step={1}
            />

            {/* Navigation rapide entre adversaires */}
            {opponents.length > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-stone-200/60 dark:border-slate-800 text-xs">
                <button
                  type="button"
                  disabled={!hasPrevOpponent}
                  onClick={() => prevOpponent && setEditingPlayer(prevOpponent)}
                  className="flex items-center gap-1 font-semibold text-stone-500 disabled:opacity-30 hover:text-stone-900 dark:hover:text-slate-200 cursor-pointer"
                >
                  <ChevronLeft size={14} />
                  <span>Précédent</span>
                </button>
                <span className="text-[11px] text-stone-400">
                  {currentOpponentIndex + 1} / {opponents.length}
                </span>
                <button
                  type="button"
                  disabled={!hasNextOpponent}
                  onClick={() => nextOpponent && setEditingPlayer(nextOpponent)}
                  className="flex items-center gap-1 font-semibold text-stone-500 disabled:opacity-30 hover:text-stone-900 dark:hover:text-slate-200 cursor-pointer"
                >
                  <span>Suivant</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </BottomSheet>

      {/* Confirmation si 0 point saisi pour tous les adversaires */}
      <Dialog
        open={showZeroConfirm}
        onClose={() => setShowZeroConfirm(false)}
        title="Aucun point restant ?"
        message="Tous les adversaires ont 0 point de cartes restantes. Confirmez-vous la manche avec 0 point marqué ?"
        confirmLabel="Valider quand même"
        cancelLabel="Vérifier les cartes"
        onConfirm={() => {
          setShowZeroConfirm(false)
          submitRound()
        }}
      />
    </div>
  )
}
