import { useState } from 'react'
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { Avatar } from '../ui/Avatar'
import { BottomSheet } from '../ui/BottomSheet'
import { ScorePad } from '../ui/ScorePad'
import { QuickScoreBadge } from '../ui/QuickScoreBadge'
import { Dialog } from '../ui/Dialog'

export function SixQuiPrendEngine({ game, onFinish }) {
  const { updateScores } = useGame()
  const [roundScores, setRoundScores] = useState(() => {
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

  const ELIMINATION_SCORE = 66

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

  const submitRound = () => {
    const newScores = {}
    const delta = {}
    for (const p of game.players) {
      const heads = roundScores[p.id] || 0
      newScores[p.id] = (game.scores[p.id] || 0) + heads
      delta[p.id] = heads
    }
    updateScores({ scores: newScores, delta, type: 'six_qui_prend' })
    setRoundScores(Object.fromEntries(game.players.map(p => [p.id, 0])))

    const eliminated = Object.entries(newScores).filter(([, s]) => s >= ELIMINATION_SCORE)
    if (eliminated.length > 0) {
      const winner = Object.entries(newScores).sort((a, b) => a[1] - b[1])[0][0]
      onFinish(winner)
    }
  }

  const handleValidate = () => {
    const totalHeads = Object.values(roundScores).reduce((a, b) => a + b, 0)
    if (totalHeads === 0) {
      setShowZeroConfirm(true)
      return
    }
    submitRound()
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="school-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
            Têtes de bœuf ramassées
          </p>
          <span className="text-[11px] font-semibold text-stone-400 dark:text-slate-500">
            Arrêt à 66 têtes
          </span>
        </div>
        <div className="space-y-2">
          {game.players.map(p => {
            const total = game.scores[p.id] || 0
            const danger = total >= 50
            const heads = roundScores[p.id] || 0
            return (
              <div
                key={p.id}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl school-subtle hover:border-[#c83b3b]/60 transition-all"
              >
                <button
                  type="button"
                  onClick={() => { setEditingPlayer(p); setOpen(true) }}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer focus:outline-none select-none active:opacity-80 transition-opacity"
                >
                  <Avatar player={p} size="xs" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm truncate">
                        {p.name}
                      </span>
                      {danger && <AlertTriangle size={13} className="text-[#c83b3b] shrink-0" />}
                    </div>
                    <span className="text-[11px] font-medium text-stone-500 dark:text-slate-400 block mt-0.5">
                      {heads > 0 ? (
                        <>Total : {total} <strong className="text-[#c83b3b] font-bold">➔ {total + heads}</strong>/66 🐮</>
                      ) : (
                        `Cumul : ${total}/66 🐮`
                      )}
                    </span>
                  </div>
                </button>
                <QuickScoreBadge
                  value={heads}
                  onChange={v => setRoundScores(prev => ({ ...prev, [p.id]: Math.max(0, v) }))}
                  onOpenPad={() => { setEditingPlayer(p); setOpen(true) }}
                  min={0}
                  showPlus={true}
                  formatBubble={(val) => {
                    const current = game.scores[p.id] || 0
                    const proj = current + val
                    if (proj >= 66) {
                      return { text: `💥 ${proj}/66 🐮`, variant: 'danger' }
                    }
                    return { text: `= ${proj} 🐮`, variant: 'default' }
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

      {/* Dialog d'avertissement si 0 tête saisie */}
      <Dialog
        open={showZeroConfirm}
        onClose={() => setShowZeroConfirm(false)}
        title="Aucune tête de bœuf saisie"
      >
        <div className="space-y-3 text-xs">
          <p className="text-stone-600 dark:text-slate-300 leading-relaxed">
            Tous les joueurs ont <strong>0 tête de bœuf</strong> sur cette manche.
          </p>
          <p className="text-stone-500 dark:text-slate-400">
            À 6 qui prend !, les joueurs ramassent inévitablement des bœufs lors des défausses de rangée. Avez-vous bien comptabilisé les têtes de bœuf ramassées ?
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowZeroConfirm(false)}
              className="w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white btn-margin-red cursor-pointer shadow-xs active:scale-[0.99] transition-all"
            >
              Saisir les têtes de bœuf
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
                    {(game.scores[editingPlayer.id] || 0) >= 50 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#c83b3b]/15 text-[#c83b3b] dark:text-red-300 shrink-0">
                        En danger
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-stone-500 dark:text-slate-400">
                    Cumul actuel : {game.scores[editingPlayer.id] || 0} / 66 🐮
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
              value={roundScores[editingPlayer.id] || 0}
              onChange={v => setRoundScores(prev => ({ ...prev, [editingPlayer.id]: Math.max(0, v) }))}
              onConfirm={handleConfirmPad}
              confirmLabel={confirmLabel}
              min={0}
              max={66}
              step={1}
              label="Têtes de bœuf ramassées"
              subLabel="Seuil d'élimination : 66 🐮"
              presets={[0, 1, 2, 3, 5, 7, 10, 14, 20]}
              formatDisplay={v => `${v} 🐮`}
              formatTotal={(val) => {
                const cur = game.scores[editingPlayer.id] || 0
                const proj = cur + val
                return `+${val} 🐮 · Nouveau cumul : ${proj}/66 🐮${proj >= 66 ? ' 💥 Éliminé' : proj >= 50 ? ' ⚠️ En danger' : ''}`
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
