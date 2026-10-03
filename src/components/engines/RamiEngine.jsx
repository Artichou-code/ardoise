import { useState } from 'react'
import { AlertTriangle, Zap, Check, Trophy } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { Avatar } from '../ui/Avatar'
import { QuickScoreBadge } from '../ui/QuickScoreBadge'
import { BottomSheet } from '../ui/BottomSheet'
import { ScorePad } from '../ui/ScorePad'
import { Dialog } from '../ui/Dialog'

export function RamiEngine({ game, onFinish }) {
  const { updateScores } = useGame()
  const LIMIT = game.config?.limit || 100

  // Gagnant de la manche (celui qui s'est défaussé de toutes ses cartes = 0 pt)
  const [winnerId, setWinnerId] = useState(() => {
    return game.restoredRound?.winnerId || game.players[0]?.id || null
  })

  // Est-ce un Rami Sec ? (pose d'un coup sans avoir rien posé avant -> x2 aux adversaires)
  const [isRamiSec, setIsRamiSec] = useState(() => {
    return game.restoredRound?.isRamiSec || false
  })

  // Pénalités de cartes restant en main pour chaque joueur
  const [handPenalties, setHandPenalties] = useState(() => {
    const initial = {}
    for (const p of game.players) {
      initial[p.id] = (game.restoredDelta && game.restoredDelta[p.id] != null)
        ? game.restoredDelta[p.id]
        : 0
    }
    return initial
  })

  const [editingPlayer, setEditingPlayer] = useState(null)
  const [open, setOpen] = useState(false)
  const [showZeroConfirm, setShowZeroConfirm] = useState(false)

  // Calcul du delta de manche pour chaque joueur
  const computePlayerDelta = (playerId) => {
    if (playerId === winnerId) return 0
    const raw = handPenalties[playerId] || 0
    return isRamiSec ? raw * 2 : raw
  }

  const submitRound = () => {
    const newScores = {}
    const delta = {}

    for (const p of game.players) {
      const d = computePlayerDelta(p.id)
      delta[p.id] = d
      newScores[p.id] = (game.scores[p.id] || 0) + d
    }

    updateScores({
      scores: newScores,
      delta,
      winnerId,
      isRamiSec,
      type: 'rami',
    })

    // Réinitialisation
    setHandPenalties(Object.fromEntries(game.players.map(p => [p.id, 0])))
    setIsRamiSec(false)

    // Vérification d'élimination
    const overLimit = Object.entries(newScores).filter(([, s]) => s >= LIMIT)
    if (overLimit.length > 0) {
      const finalWinner = Object.entries(newScores).sort((a, b) => a[1] - b[1])[0][0]
      onFinish(finalWinner)
    }
  }

  const handleValidate = () => {
    // Calcul des pénalités des adversaires
    const totalOpponentPts = game.players
      .filter(p => p.id !== winnerId)
      .reduce((sum, p) => sum + (handPenalties[p.id] || 0), 0)

    if (totalOpponentPts === 0) {
      setShowZeroConfirm(true)
      return
    }

    submitRound()
  }

  return (
    <div className="space-y-2 pt-0">
      <div className="school-card rounded-xl p-3 sm:p-4">
        {/* En-tête */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 flex items-center gap-1.5 min-w-0">
            <Trophy size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">Vainqueur (0 pt)</span>
          </p>
          <span className="text-[11px] font-semibold text-stone-400 dark:text-slate-500 whitespace-nowrap shrink-0">
            Seuil : {LIMIT} pts
          </span>
        </div>

        {/* Grille sélecteur de vainqueur (celui qui a posé toutes ses cartes) */}
        <div className={`grid gap-2 mb-3 ${
          game.players.length === 2 ? 'grid-cols-2' :
          game.players.length === 3 ? 'grid-cols-3' :
          'grid-cols-2 sm:grid-cols-4'
        }`}>
          {game.players.map(p => {
            const isWinner = winnerId === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setWinnerId(p.id)}
                className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none active:scale-[0.98] ${
                  isWinner
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xs ring-1 ring-emerald-600/40'
                    : 'school-subtle text-stone-700 dark:text-slate-300 hover:border-stone-400'
                }`}
              >
                <Avatar player={p} size="xs" leader={isWinner} leaderColor="#10b981" crown={isWinner} />
                <div className="text-left min-w-0 flex-1">
                  <span className={`text-xs font-bold truncate block ${isWinner ? 'text-white' : ''}`}>
                    {p.name}
                  </span>
                  <span className={`text-[10px] block font-medium truncate ${isWinner ? 'text-white/85' : 'text-stone-400 dark:text-slate-500'}`}>
                    {isWinner ? 'A posé (0 pt)' : 'Adversaire'}
                  </span>
                </div>
                {isWinner && <Check size={14} className="text-white shrink-0" />}
              </button>
            )
          })}
        </div>

        {/* Option Rami Sec (posé d'un coup) */}
        <button
          type="button"
          role="switch"
          aria-checked={isRamiSec}
          onClick={() => setIsRamiSec(v => !v)}
          className={`w-full p-2.5 px-3 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer mb-3 select-none active:scale-[0.99] ${
            isRamiSec
              ? 'border-[#c83b3b]/60 bg-[#c83b3b]/8 dark:bg-[#c83b3b]/15 ring-1 ring-[#c83b3b]/30'
              : 'school-subtle text-stone-700 dark:text-slate-300 hover:border-[#c83b3b]/50'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Zap
              size={16}
              strokeWidth={2}
              className={`shrink-0 transition-colors ${
                isRamiSec
                  ? 'text-[#c83b3b] dark:text-rose-400'
                  : 'text-stone-400 dark:text-slate-500'
              }`}
            />
            <div className="text-left min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs leading-tight">Rami Sec (posé d'un coup)</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded transition-colors ${
                  isRamiSec
                    ? 'bg-[#c83b3b]/15 text-[#c83b3b] dark:text-rose-300'
                    : 'bg-stone-200/70 dark:bg-slate-800 text-stone-500 dark:text-slate-400'
                }`}>
                  ×2
                </span>
              </div>
              <span className="text-[10px] text-stone-500 dark:text-slate-400 block truncate mt-0.5">
                Pénalités des adversaires doublées
              </span>
            </div>
          </div>

          {/* Interrupteur Switch style iOS (Rouge identitaire Ardoise) */}
          <div
            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
              isRamiSec ? 'bg-[#c83b3b]' : 'bg-stone-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition-transform duration-200 ease-in-out ${
                isRamiSec ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </div>
        </button>

        {/* Liste des pénalités des adversaires */}
        <div className="pt-2 border-t border-stone-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 shrink-0">
              Pénalités de manche
            </p>
            <span className="text-[10px] text-stone-400 dark:text-slate-500 truncate text-right">
              Figures 10 · As 11 · Joker 20
            </span>
          </div>

          <div className="space-y-1.5">
            {game.players.map(p => {
              const isWinner = winnerId === p.id
              const currentTotal = game.scores[p.id] || 0
              const delta = computePlayerDelta(p.id)
              const projected = currentTotal + delta
              const danger = projected >= LIMIT
              const rawPts = handPenalties[p.id] || 0

              if (isWinner) {
                return (
                  <div
                    key={p.id}
                    className="px-3 py-2 rounded-xl border border-emerald-300/80 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar player={p} size="xs" leader leaderColor="#059669" crown />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm truncate">{p.name}</span>
                        </div>
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium truncate block">
                          Total : {currentTotal} pts
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600/15 text-emerald-800 dark:text-emerald-300 border border-emerald-600/30 whitespace-nowrap shrink-0">
                      0 pt
                    </span>
                  </div>
                )
              }

              return (
                <div
                  key={p.id}
                  className="px-3 py-2 rounded-xl border school-subtle hover:border-stone-300 dark:hover:border-slate-700 flex items-center justify-between gap-3"
                >
                  <button
                    type="button"
                    onClick={() => { setEditingPlayer(p); setOpen(true) }}
                    className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer select-none"
                  >
                    <Avatar player={p} size="xs" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm truncate">{p.name}</span>
                        {danger && <AlertTriangle size={13} className="text-[#c83b3b] shrink-0" />}
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-slate-400 flex items-center gap-1.5 min-w-0">
                        {delta > 0 ? (
                          <>
                            <span className="truncate">
                              Total : {currentTotal} <strong className="text-[#c83b3b] font-bold">➔ {projected} pts</strong>
                            </span>
                            {isRamiSec && (
                              <span className="text-[10px] text-[#c83b3b] dark:text-rose-400 font-semibold px-1 py-0.2 rounded bg-[#c83b3b]/10 whitespace-nowrap shrink-0">
                                ×2
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="truncate">Total : {currentTotal} pts</span>
                        )}
                      </div>
                    </div>
                  </button>

                  <QuickScoreBadge
                    value={rawPts}
                    onChange={v => setHandPenalties(prev => ({ ...prev, [p.id]: Math.max(0, v) }))}
                    onOpenPad={() => { setEditingPlayer(p); setOpen(true) }}
                    min={0}
                    step={1}
                    showPlus={true}
                    formatDisplay={(v) => `${isRamiSec ? v * 2 : v} pts`}
                    formatBubble={(v) => {
                      const d = isRamiSec ? v * 2 : v
                      const proj = currentTotal + d
                      return {
                        text: `+${d} pts (total ${proj})`,
                        variant: proj >= LIMIT ? 'danger' : 'default',
                      }
                    }}
                  />
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-stone-200/80 dark:border-slate-800">
          <button
            type="button"
            onClick={handleValidate}
            className="w-full py-2.5 rounded-xl bg-[#c83b3b] hover:bg-[#b03030] text-white font-bold text-sm shadow-sm transition-all active:scale-[0.99] cursor-pointer"
          >
            Valider la manche
          </button>
        </div>
      </div>

      {/* Dialogue de confirmation bienveillant si aucun adversaire n'a de pénalité */}
      <Dialog
        open={showZeroConfirm}
        onClose={() => setShowZeroConfirm(false)}
        title="Cartes des adversaires"
        subtitle="Rami · Manche en cours"
        icon={(
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle size={17} />
          </div>
        )}
      >
        <div className="space-y-3 pt-1">
          <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-950/25 border border-amber-500/25 text-xs leading-relaxed">
            <p className="font-semibold text-amber-900 dark:text-amber-200 mb-1">
              Tous les adversaires sont à 0 point.
            </p>
            <p className="text-stone-600 dark:text-slate-300">
              Au Rami, seul le vainqueur pose toutes ses cartes (0 pt). Les autres joueurs additionnent la valeur des cartes restant dans leur main.
            </p>
          </div>

          <div className="px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-slate-800/80 text-[11px] text-stone-500 dark:text-slate-400 flex justify-between items-center">
            <span>Barème :</span>
            <span className="font-semibold text-stone-700 dark:text-slate-300">Figures 10 · As 11 · Joker 20</span>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowZeroConfirm(false)}
              className="w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white btn-margin-red cursor-pointer shadow-xs active:scale-[0.99] transition-all"
            >
              Saisir les points des adversaires
            </button>
          </div>
        </div>
      </Dialog>

      {/* BottomSheet saisie de pénalités de main */}
      <BottomSheet open={open} onClose={() => setOpen(false)}>
        {editingPlayer && (
          <div className="p-4">
            <h3 className="font-serif-title font-bold text-lg mb-1">
              Cartes en main de {editingPlayer.name}
            </h3>
            <p className="text-xs text-stone-500 dark:text-slate-400 mb-3">
              Additionnez les points des cartes restantes (Figures = 10, As = 11, Joker = 20).
            </p>
            {isRamiSec && (
              <div className="mb-3 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-400/50 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center gap-1.5">
                <Zap size={13} className="text-amber-600 shrink-0" />
                <span>Rami Sec actif : ces pénalités seront doublées (×2).</span>
              </div>
            )}
            <ScorePad
              value={handPenalties[editingPlayer.id] || 0}
              onChange={v => setHandPenalties(prev => ({ ...prev, [editingPlayer.id]: Math.max(0, v) }))}
              onConfirm={() => setOpen(false)}
              min={0}
              step={1}
              label="Pénalités de main"
              showPlus={true}
              customButtons={[
                { label: '0 pt', value: 0 },
                { label: '+10 (Figure)', value: (handPenalties[editingPlayer.id] || 0) + 10 },
                { label: '+11 (As)', value: (handPenalties[editingPlayer.id] || 0) + 11 },
                { label: '+20 (Joker)', value: (handPenalties[editingPlayer.id] || 0) + 20 },
                { label: '+25', value: (handPenalties[editingPlayer.id] || 0) + 25 },
                { label: '+30', value: (handPenalties[editingPlayer.id] || 0) + 30 },
              ]}
            />
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
