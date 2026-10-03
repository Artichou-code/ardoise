import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Trophy } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { Avatar } from '../ui/Avatar'
import { QuickScoreBadge } from '../ui/QuickScoreBadge'
import { BottomSheet } from '../ui/BottomSheet'
import { ScorePad } from '../ui/ScorePad'
import { Dialog } from '../ui/Dialog'

export function DameDePiqueEngine({ game, onFinish }) {
  const { updateScores } = useGame()
  const LIMIT = game.config?.limit || 100

  // État local de la manche
  const [playerHearts, setPlayerHearts] = useState(() => {
    const initial = {}
    for (const p of game.players) {
      initial[p.id] = (game.restoredDelta && game.restoredDelta[p.id] != null)
        ? Math.max(0, game.restoredDelta[p.id] % 13)
        : 0
    }
    return initial
  })

  const [queenOwnerId, setQueenOwnerId] = useState(() => {
    if (game.restoredRound?.queenOwnerId) return game.restoredRound.queenOwnerId
    if (game.restoredDelta) {
      for (const p of game.players) {
        if (game.restoredDelta[p.id] >= 13) return p.id
      }
    }
    return null
  })

  const [chelemWinnerId, setChelemWinnerId] = useState(() => {
    return game.restoredRound?.chelemWinnerId || null
  })
  const [isChelem, setIsChelem] = useState(() => {
    return !!game.restoredRound?.chelemWinnerId
  })

  const [showIncompleteDialog, setShowIncompleteDialog] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState(null)
  const [open, setOpen] = useState(false)

  // Calcul des points de la manche pour un joueur donné
  const computeRoundDelta = (playerId) => {
    if (isChelem && chelemWinnerId) {
      // Grand Chelem : le réalisateur prend 0, tous les autres prennent 26
      return chelemWinnerId === playerId ? 0 : 26
    }
    const hearts = playerHearts[playerId] || 0
    const hasQueen = queenOwnerId === playerId
    return hearts + (hasQueen ? 13 : 0)
  }

  // Somme totale des pénalités allouées dans la manche (hors chelem)
  const totalHeartsAllocated = Object.values(playerHearts).reduce((a, b) => a + b, 0)
  const totalAllocated = totalHeartsAllocated + (queenOwnerId ? 13 : 0)
  const isNormalRoundComplete = totalAllocated === 26 && queenOwnerId !== null && totalHeartsAllocated === 13

  const submitRound = () => {
    const newScores = {}
    const delta = {}

    for (const p of game.players) {
      const d = computeRoundDelta(p.id)
      delta[p.id] = d
      newScores[p.id] = (game.scores[p.id] || 0) + d
    }

    updateScores({
      scores: newScores,
      delta,
      queenOwnerId: isChelem ? null : queenOwnerId,
      chelemWinnerId: isChelem ? chelemWinnerId : null,
      type: 'dame_de_pique',
    })

    // Réinitialisation
    setPlayerHearts(Object.fromEntries(game.players.map(p => [p.id, 0])))
    setQueenOwnerId(null)
    setChelemWinnerId(null)
    setIsChelem(false)

    // Vérification de fin de partie : au moins un joueur atteint ou dépasse le seuil
    const overLimit = Object.entries(newScores).filter(([, s]) => s >= LIMIT)
    if (overLimit.length > 0) {
      const winner = Object.entries(newScores).sort((a, b) => a[1] - b[1])[0][0]
      onFinish(winner)
    }
  }

  const handleValidate = () => {
    if (isChelem) {
      if (!chelemWinnerId) {
        setShowIncompleteDialog(true)
        return
      }
    } else {
      if (!isNormalRoundComplete) {
        setShowIncompleteDialog(true)
        return
      }
    }
    submitRound()
  }

  const toggleQueen = (playerId) => {
    setQueenOwnerId(prev => (prev === playerId ? null : playerId))
  }

  return (
    <div className="space-y-2 pt-0">
      {/* Carte d'information et statut de manche */}
      <div className="school-card rounded-xl p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
            Saisie de la manche
          </p>
          <span className="text-[11px] font-semibold text-stone-400 dark:text-slate-500">
            Seuil d'arrêt : {LIMIT} pts
          </span>
        </div>

        {/* Interrupteur Grand Chelem style iOS harmonisé */}
        <button
          type="button"
          role="switch"
          aria-checked={isChelem}
          onClick={() => {
            const next = !isChelem
            setIsChelem(next)
            if (next && !chelemWinnerId) {
              setChelemWinnerId(game.players[0]?.id || null)
            } else if (!next) {
              setChelemWinnerId(null)
            }
          }}
          className={`w-full p-2.5 px-3 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer mb-2.5 select-none active:scale-[0.99] ${
            isChelem
              ? 'border-amber-600/60 bg-amber-500/10 dark:bg-amber-950/20 ring-1 ring-amber-600/30'
              : 'school-subtle text-stone-700 dark:text-slate-300 hover:border-amber-500/50'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Trophy
              size={16}
              strokeWidth={2}
              className={`shrink-0 transition-colors ${
                isChelem
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-stone-400 dark:text-slate-500'
              }`}
            />
            <div className="text-left min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs leading-tight">Grand Chelem</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded transition-colors ${
                  isChelem
                    ? 'bg-amber-600/15 text-amber-700 dark:text-amber-300'
                    : 'bg-stone-200/70 dark:bg-slate-800 text-stone-500 dark:text-slate-400'
                }`}>
                  +26 aux rivaux
                </span>
              </div>
              <span className="text-[10px] text-stone-500 dark:text-slate-400 block leading-tight mt-0.5">
                13 Cœurs + Dame de Pique ramassés
              </span>
            </div>
          </div>

          {/* Interrupteur Switch style iOS */}
          <div
            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
              isChelem ? 'bg-amber-600' : 'bg-stone-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition-transform duration-200 ease-in-out ${
                isChelem ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </div>
        </button>

        {/* Si Grand Chelem : Sélecteur du joueur qui a réussi */}
        {isChelem ? (
          <div className="mb-2 p-2.5 rounded-xl bg-amber-500/8 dark:bg-amber-950/20 border border-amber-500/30">
            <p className="text-[11px] font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider mb-2">
              Auteur du Grand Chelem (0 pt · +26 pts aux autres) :
            </p>
            <div className={`grid gap-2 ${
              game.players.length === 2 ? 'grid-cols-2' :
              game.players.length === 3 ? 'grid-cols-3' :
              'grid-cols-2 sm:grid-cols-4'
            }`}>
              {game.players.map(p => {
                const isWinner = chelemWinnerId === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setChelemWinnerId(p.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none active:scale-[0.98] ${
                      isWinner
                        ? 'border-amber-600 bg-amber-600 text-white shadow-2xs ring-1 ring-amber-600/40'
                        : 'school-subtle text-stone-700 dark:text-slate-300 hover:border-amber-400'
                    }`}
                  >
                    <Avatar player={p} size="xs" leader={isWinner} leaderColor="#d97706" crown={isWinner} />
                    <div className="text-left min-w-0 flex-1">
                      <span className={`text-xs font-bold truncate block ${isWinner ? 'text-white' : ''}`}>
                        {p.name}
                      </span>
                      <span className={`text-[10px] block font-medium truncate ${isWinner ? 'text-white/85' : 'text-stone-400 dark:text-slate-500'}`}>
                        {isWinner ? '0 pt (Chelem)' : '+26 pts'}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          /* Indicateur de vérification des 26 points en mode normal */
          <div className={`p-2 rounded-xl border text-xs font-medium flex items-center justify-between mb-2 ${
            isNormalRoundComplete
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-200'
              : 'bg-stone-50 dark:bg-slate-800/60 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-400'
          }`}>
            <div className="flex items-center gap-1.5 truncate">
              {isNormalRoundComplete ? (
                <>
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>Manche complète : 26/26 pts alloués (13 Cœurs + Q♠)</span>
                </>
              ) : (
                <span>Attribué : {totalAllocated}/26 pts ({totalHeartsAllocated}/13 Cœurs{queenOwnerId ? ' + Q♠' : ''})</span>
              )}
            </div>
            <span className="font-bold text-[11px] ml-2 shrink-0">
              {totalAllocated} pts
            </span>
          </div>
        )}

        {/* Liste des joueurs */}
        <div className="space-y-1.5 mt-2">
          {game.players.map(p => {
            const currentTotal = game.scores[p.id] || 0
            const roundDelta = computeRoundDelta(p.id)
            const projected = currentTotal + roundDelta
            const danger = currentTotal >= LIMIT - 20
            const isQueen = queenOwnerId === p.id
            const isChelemWinner = isChelem && chelemWinnerId === p.id
            const hearts = playerHearts[p.id] || 0

            return (
              <div
                key={p.id}
                className={`px-3 py-2.5 rounded-xl border transition-all ${
                  isChelemWinner
                    ? 'border-amber-400/80 bg-amber-50/40 dark:bg-amber-950/20'
                    : isQueen && !isChelem
                    ? 'border-[#c83b3b]/60 bg-[#c83b3b]/5'
                    : 'school-subtle hover:border-stone-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Ligne 1 : Nom complet et score projeté */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isChelem) {
                        setEditingPlayer(p)
                        setOpen(true)
                      }
                    }}
                    className="flex items-center gap-2 min-w-0 text-left cursor-pointer select-none"
                  >
                    <Avatar player={p} size="xs" />
                    <span className="font-semibold text-sm truncate">{p.name}</span>
                    {danger && <AlertTriangle size={13} className="text-[#c83b3b] shrink-0" />}
                  </button>

                  <div className="text-right text-xs shrink-0 select-none">
                    <span className="text-stone-500 dark:text-slate-400">Total : {currentTotal}</span>
                    {roundDelta > 0 ? (
                      <span className="text-[#c83b3b] font-bold ml-1.5">
                        ➔ {projected} pts (+{roundDelta})
                      </span>
                    ) : (
                      <span className="text-stone-400 dark:text-slate-500 ml-1.5">
                        ➔ {projected} pts
                      </span>
                    )}
                  </div>
                </div>

                {/* Ligne 2 : Actions rapides (masquées si Chelem global actif) */}
                {!isChelem && (
                  <div className="flex items-center justify-between gap-2">
                    {/* Bouton Dame de Pique (+13) */}
                    <button
                      type="button"
                      onClick={() => toggleQueen(p.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer select-none active:scale-[0.98] ${
                        isQueen
                          ? 'border-[#c83b3b] bg-[#c83b3b] text-white shadow-2xs'
                          : 'bg-white dark:bg-slate-900 text-stone-600 dark:text-slate-400 border-stone-200 dark:border-slate-700 hover:border-[#c83b3b]/60 hover:text-[#c83b3b]'
                      }`}
                      title={isQueen ? "Retirer la Dame de Pique" : "Prendre la Dame de Pique (+13 pts)"}
                    >
                      <span className="text-sm leading-none">♠</span>
                      <span>Dame (+13)</span>
                    </button>

                    {/* Roulette tactile de Cœurs */}
                    <div className="shrink-0">
                      <QuickScoreBadge
                        value={hearts}
                        onChange={v => {
                          const val = Math.max(0, Math.min(13, v))
                          setPlayerHearts(prev => ({ ...prev, [p.id]: val }))
                        }}
                        onOpenPad={() => { setEditingPlayer(p); setOpen(true) }}
                        min={0}
                        max={13}
                        showPlus={false}
                        formatDisplay={(v) => `${v} ♥`}
                        formatBubble={(v) => {
                          const d = v + (isQueen ? 13 : 0)
                          return { text: `+${d} pts (total ${currentTotal + d})`, variant: d > 10 ? 'danger' : 'default' }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Bouton Valider la manche */}
        <div className="mt-2.5 pt-2 border-t border-stone-200/80 dark:border-slate-800">
          <button
            type="button"
            onClick={handleValidate}
            className={`w-full py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-[0.99] cursor-pointer ${
              (isChelem && chelemWinnerId) || isNormalRoundComplete
                ? 'bg-[#c83b3b] hover:bg-[#b03030] text-white'
                : 'bg-stone-200 dark:bg-slate-800 text-stone-600 dark:text-slate-300 hover:bg-stone-300 dark:hover:bg-slate-700'
            }`}
          >
            {(isChelem && chelemWinnerId) || isNormalRoundComplete ? (
              <span className="inline-flex items-center justify-center gap-1.5">
                <span>Valider la manche</span>
                <span className="text-xs font-normal opacity-85">(26/26 pts)</span>
              </span>
            ) : (
              <span className="inline-flex items-center justify-center gap-1.5">
                <span>Valider la manche</span>
                <span className="text-xs font-normal opacity-85">({totalAllocated}/26 pts)</span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Dialog d'avertissement score incomplet / impossible */}
      <Dialog
        open={showIncompleteDialog}
        onClose={() => setShowIncompleteDialog(false)}
        title="Manche incomplète (26 pts requis)"
      >
        <div className="space-y-3 text-xs">
          <p className="text-stone-600 dark:text-slate-300 leading-relaxed">
            Une manche de Dame de Pique doit totaliser <strong>exactement 26 points</strong> (13 Cœurs + la Dame de Pique de 13 pts), ou un <strong>Grand Chelem</strong>.
          </p>

          <div className="p-2.5 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 space-y-1.5 font-medium">
            <div className="flex justify-between items-center">
              <span>Points alloués :</span>
              <strong className={totalAllocated === 26 ? 'text-emerald-600' : 'text-[#c83b3b]'}>
                {totalAllocated} / 26 pts
              </strong>
            </div>
            <div className="flex justify-between items-center">
              <span>Cœurs attribués :</span>
              <strong className={totalHeartsAllocated === 13 ? 'text-emerald-600' : 'text-stone-700 dark:text-slate-300'}>
                {totalHeartsAllocated} / 13 Cœurs
              </strong>
            </div>
            <div className="flex justify-between items-center">
              <span>Dame de Pique (13 pts) :</span>
              <strong className={queenOwnerId ? 'text-emerald-600' : 'text-[#c83b3b]'}>
                {queenOwnerId ? (game.players.find(p => p.id === queenOwnerId)?.name || 'Attribuée') : 'Non attribuée'}
              </strong>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowIncompleteDialog(false)}
              className="w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white btn-margin-red cursor-pointer shadow-xs active:scale-[0.99] transition-all"
            >
              Compléter la saisie
            </button>
          </div>
        </div>
      </Dialog>

      {/* BottomSheet de saisie précise de Cœurs */}
      <BottomSheet open={open} onClose={() => setOpen(false)}>
        {editingPlayer && (
          <div className="p-4">
            <h3 className="font-serif-title font-bold text-lg mb-1">
              Cœurs ramassés par {editingPlayer.name}
            </h3>
            <p className="text-xs text-stone-500 dark:text-slate-400 mb-4">
              Indiquez le nombre de Cœurs encaissés lors de cette manche (de 0 à 13).
            </p>
            <ScorePad
              value={playerHearts[editingPlayer.id] || 0}
              onChange={v => setPlayerHearts(prev => ({ ...prev, [editingPlayer.id]: Math.max(0, Math.min(13, v)) }))}
              onConfirm={() => setOpen(false)}
              min={0}
              max={13}
              step={1}
              label="Nombre de Cœurs"
              showPlus={false}
              customButtons={[
                { label: '0', value: 0 },
                { label: '1', value: 1 },
                { label: '2', value: 2 },
                { label: '3', value: 3 },
                { label: '4', value: 4 },
                { label: '5', value: 5 },
                { label: '8', value: 8 },
                { label: '13 (Tous)', value: 13 },
              ]}
            />
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
