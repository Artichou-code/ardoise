import { useState } from 'react'
import { Shield, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { BottomSheet } from '../ui/BottomSheet'
import { ScorePad } from '../ui/ScorePad'
import { QuickScoreBadge } from '../ui/QuickScoreBadge'
import { Avatar } from '../ui/Avatar'
import { Dialog } from '../ui/Dialog'
import { useGame } from '../../context/GameContext'

export function CaracoleEngine({ game, onFinish }) {
  const { updateScores } = useGame()
  const [open, setOpen] = useState(false)
  const [showZeroConfirm, setShowZeroConfirm] = useState(false)
  const [roundPenalties, setRoundPenalties] = useState(() => {
    const initial = {}
    for (const p of game.players) {
      initial[p.id] = (game.restoredDelta && game.restoredDelta[p.id] != null)
        ? game.restoredDelta[p.id]
        : 0
    }
    return initial
  })
  const [editingPlayer, setEditingPlayer] = useState(null)
  const [reprieveNotice, setReprieveNotice] = useState(null)

  const limit = game.config?.limit || 100
  const sursisEnabled = game.config?.sursis !== false
  const sursisTarget = game.config?.sursisType === 'zero' ? 0 : Math.floor(limit / 2)

  // Navigation séquentielle entre joueurs dans le ScorePad
  const currentEditingIndex = editingPlayer ? game.players.findIndex(p => p.id === editingPlayer.id) : -1
  const hasPrevPlayer = currentEditingIndex > 0
  const hasNextPlayer = currentEditingIndex >= 0 && currentEditingIndex < game.players.length - 1
  const prevPlayer = hasPrevPlayer ? game.players[currentEditingIndex - 1] : null
  const nextPlayer = hasNextPlayer ? game.players[currentEditingIndex + 1] : null

  const handleConfirmPad = () => {
    if (hasNextPlayer) {
      setEditingPlayer(nextPlayer)
    } else {
      setOpen(false)
    }
  }

  const confirmLabel = hasNextPlayer && nextPlayer ? (
    <span className="inline-flex items-baseline justify-center gap-1.5 max-w-full">
      <span className="shrink-0">Valider & Suivant</span>
      <span className="font-normal opacity-85 truncate min-w-0">({nextPlayer.name})</span>
    </span>
  ) : (
    <span>Valider et terminer</span>
  )

  const setPenalty = (id, val) => {
    setRoundPenalties(prev => ({ ...prev, [id]: Math.max(0, val) }))
  }

  const handleValidate = () => {
    const allZero = Object.values(roundPenalties).every(v => v === 0)
    if (allZero) {
      setShowZeroConfirm(true)
      return
    }
    submitRound()
  }

  const submitRound = () => {
    const newScores = {}
    const delta = {}
    const reprieves = []

    for (const p of game.players) {
      const pen = roundPenalties[p.id] || 0
      const current = game.scores[p.id] || 0
      const projected = current + pen
      delta[p.id] = pen

      if (sursisEnabled && projected === limit) {
        reprieves.push({
          playerId: p.id,
          name: p.name,
          original: projected,
          reduced: sursisTarget,
        })
        newScores[p.id] = sursisTarget
      } else {
        newScores[p.id] = projected
      }
    }

    updateScores({
      scores: newScores,
      delta,
      type: 'caracole',
      reprieves: reprieves.map(r => ({
        playerId: r.playerId,
        original: r.original,
        reduced: r.reduced,
      })),
    })

    setRoundPenalties(Object.fromEntries(game.players.map(p => [p.id, 0])))
    setOpen(false)

    if (reprieves.length > 0) {
      const msg = reprieves
        .map(r => `${r.name} : pile ${r.original} pts -> retombe à ${r.reduced} pts !`)
        .join(' · ')
      setReprieveNotice(msg)
    } else {
      setReprieveNotice(null)
    }

    const eliminated = Object.entries(newScores).find(([, s]) => s >= limit)
    if (eliminated) {
      const winner = Object.entries(newScores).sort((a, b) => a[1] - b[1])[0][0]
      onFinish(winner)
    }
  }

  return (
    <div className="space-y-4 pt-2">
      {/* Bannière de notification en cas de sursis */}
      {reprieveNotice && (
        <div className="p-3 rounded-xl border border-[#c83b3b] bg-[#c83b3b]/10 dark:bg-[#c83b3b]/20 flex items-start gap-2.5">
          <Shield size={16} className="text-[#c83b3b] mt-0.5 flex-shrink-0" />
          <div className="flex-1 text-xs">
            <span className="font-bold text-[#c83b3b] block">Sursis accordé !</span>
            <span className="text-stone-700 dark:text-slate-300 font-medium leading-relaxed">
              {reprieveNotice}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setReprieveNotice(null)}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-slate-200"
            aria-label="Fermer la notification"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="school-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
            Pénalités de la manche (cartes en main)
          </p>
          <span className="text-[11px] font-semibold text-stone-400 dark:text-slate-500">
            Seuil : {limit} pts {sursisEnabled ? `(sursis : ${sursisTarget} pts)` : ''}
          </span>
        </div>
        <div className="space-y-2">
          {game.players.map(p => {
            const current = game.scores[p.id] || 0
            const pen = roundPenalties[p.id] || 0
            const projected = current + pen
            const isReprieve = sursisEnabled && projected === limit
            const isEliminated = projected >= limit && !isReprieve

            return (
              <div
                key={p.id}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                  isReprieve
                    ? 'border-[#c83b3b] bg-[#c83b3b]/10 ring-1 ring-[#c83b3b]/40'
                    : isEliminated
                    ? 'border-red-400/80 bg-red-500/10'
                    : 'school-subtle hover:border-[#c83b3b]/60'
                }`}
              >
                {/* Zone clic joueur (nom + avatar + calculs) -> ouvre la modale complète */}
                <button
                  type="button"
                  onClick={() => {
                    setEditingPlayer(p)
                    setOpen(true)
                  }}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer focus:outline-none select-none active:opacity-80 transition-opacity"
                >
                  <Avatar player={p} size="xs" />
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm truncate block text-stone-900 dark:text-slate-100">
                      {p.name}
                    </span>
                    <span className="text-[11px] font-medium text-stone-500 dark:text-slate-400 block mt-0.5">
                      {pen > 0 ? (
                        isReprieve ? (
                          <span className="text-[#c83b3b] font-bold">
                            Total : {current} ➔ {sursisTarget} pts (sursis !)
                          </span>
                        ) : (
                          <>Total : {current} <strong className="text-[#c83b3b] font-bold">➔ {projected} pts</strong> (+{pen})</>
                        )
                      ) : (
                        `Total : ${current} pts`
                      )}
                    </span>
                  </div>
                </button>

                {/* Zone roulette tactile compacte (glissement vertical haut/bas ou clic) */}
                <QuickScoreBadge
                  value={pen}
                  onChange={v => setPenalty(p.id, v)}
                  onOpenPad={() => {
                    setEditingPlayer(p)
                    setOpen(true)
                  }}
                  min={0}
                  showPlus={true}
                  formatBubble={(val) => {
                    const proj = current + val
                    if (sursisEnabled && proj === limit) {
                      return { text: `🎯 ${sursisTarget}`, variant: 'sursis' }
                    }
                    if (limit && proj >= limit) {
                      return { text: `💥 ${proj}`, variant: 'danger' }
                    }
                    return { text: `= ${proj}`, variant: 'default' }
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={handleValidate}
        className="w-full py-3.5 rounded-xl font-bold text-base btn-margin-red cursor-pointer active:scale-[0.99] transition-all"
      >
        Valider la manche
      </button>

      {/* Dialog d'avertissement 0 pénalité saisie */}
      <Dialog
        open={showZeroConfirm}
        onClose={() => setShowZeroConfirm(false)}
        title="Aucune pénalité saisie"
      >
        <div className="space-y-3 text-xs">
          <p className="text-stone-600 dark:text-slate-300 leading-relaxed">
            Tous les joueurs ont <strong>0 point de pénalité</strong> sur cette manche.
          </p>
          <p className="text-stone-500 dark:text-slate-400">
            À la Caracole, les perdants de la manche additionnent les points des cartes restant dans leur main. Avez-vous bien renseigné les pénalités de chacun ?
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowZeroConfirm(false)}
              className="w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white btn-margin-red cursor-pointer shadow-xs active:scale-[0.99] transition-all"
            >
              Saisir les pénalités
            </button>
          </div>
        </div>
      </Dialog>

      {editingPlayer && (
        <BottomSheet
          open={open}
          onClose={() => setOpen(false)}
        >
          <div className="px-4 pt-1 pb-6 space-y-3">
            {/* Carte du joueur actif & Navigation Joueur précédent / Joueur suivant */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-stone-100/80 dark:bg-slate-800/60 border border-stone-200/80 dark:border-slate-700/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar player={editingPlayer} size="sm" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm truncate text-stone-900 dark:text-slate-100">
                      {editingPlayer.name}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-stone-200/80 dark:bg-slate-700 text-stone-600 dark:text-slate-300 shrink-0">
                      {currentEditingIndex + 1}/{game.players.length}
                    </span>
                    {(game.scores[editingPlayer.id] || 0) >= limit * 0.75 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#c83b3b]/15 text-[#c83b3b] dark:text-red-300 shrink-0">
                        En danger
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-stone-500 dark:text-slate-400">
                    Cumul actuel : {game.scores[editingPlayer.id] || 0} / {limit} pts
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

            <ScorePad
              key={editingPlayer.id}
              value={roundPenalties[editingPlayer.id] || 0}
              onChange={v => setPenalty(editingPlayer.id, v)}
              onConfirm={handleConfirmPad}
              confirmLabel={confirmLabel}
              min={0}
              max={limit}
              step={1}
              label="Pénalités de la manche"
              subLabel={`Seuil : ${limit} pts${sursisEnabled ? ` · Sursis à ${sursisTarget}` : ''}`}
              presets={[0, 5, 10, 15, 20, 25, 30, 40]}
              formatDisplay={v => `${v} pts`}
              formatTotal={(val) => {
                const curScore = game.scores[editingPlayer.id] || 0
                const proj = curScore + val
                if (sursisEnabled && proj === limit) return `+${val} pts · Sursis accordé : retombe à ${sursisTarget} pts !`
                if (limit && proj >= limit) return `+${val} pts · Nouveau cumul : ${proj}/${limit} pts 💥 Éliminé`
                return `+${val} pts · Nouveau cumul : ${proj}/${limit} pts`
              }}
              baseScore={game.scores[editingPlayer.id] || 0}
              showPlus={false}
            />
          </div>
        </BottomSheet>
      )}
    </div>
  )
}
