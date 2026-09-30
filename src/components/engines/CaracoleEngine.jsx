import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { BottomSheet } from '../ui/BottomSheet'
import { ScorePad } from '../ui/ScorePad'
import { QuickScoreBadge } from '../ui/QuickScoreBadge'
import { Avatar } from '../ui/Avatar'
import { useGame } from '../../context/GameContext'

export function CaracoleEngine({ game, onFinish }) {
  const { updateScores } = useGame()
  const [open, setOpen] = useState(false)
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

  const setPenalty = (id, val) => {
    setRoundPenalties(prev => ({ ...prev, [id]: Math.max(0, val) }))
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
          <Sparkles size={16} className="text-[#c83b3b] mt-0.5 flex-shrink-0" />
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
                            {projected} → {sursisTarget} pts (sursis !)
                          </span>
                        ) : (
                          `${current} + ${pen} = ${projected} pts`
                        )
                      ) : (
                        `${current} pts`
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
        onClick={submitRound}
        className="w-full py-3.5 rounded-xl font-bold text-base btn-margin-red"
      >
        Valider la manche
      </button>

      {editingPlayer && (
        <BottomSheet
          open={open}
          onClose={() => setOpen(false)}
          title={`${editingPlayer.name} — Points de pénalité`}
        >
          <div className="px-5 pt-2 pb-6">
            <ScorePad
              value={roundPenalties[editingPlayer.id] || 0}
              onChange={v => setPenalty(editingPlayer.id, v)}
              onConfirm={() => setOpen(false)}
              min={0}
              baseScore={game.scores[editingPlayer.id] || 0}
              formatTotal={(val) => {
                const curScore = game.scores[editingPlayer.id] || 0
                const proj = curScore + val
                if (sursisEnabled && proj === limit) return `🎯 ${sursisTarget}`
                if (limit && proj >= limit) return `💥 ${proj}`
                return `= ${proj}`
              }}
            />
          </div>
        </BottomSheet>
      )}
    </div>
  )
}
