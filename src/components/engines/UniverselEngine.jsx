import { useState } from 'react'
import { Shield, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { Avatar } from '../ui/Avatar'
import { BottomSheet } from '../ui/BottomSheet'
import { ScorePad } from '../ui/ScorePad'
import { QuickScoreBadge } from '../ui/QuickScoreBadge'

export function UniverselEngine({ game, onFinish }) {
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
  const [reprieveNotice, setReprieveNotice] = useState(null)

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

  const scoreDir = game.config?.scoreDir || 'high'
  const limit = game.config?.limit || null

  // Règle spéciale modulable ou sursis classique
  const specialRule = game.config?.specialRule
  const isSpecialActive = !!(specialRule?.enabled && specialRule.target != null)
  const targetScore = isSpecialActive
    ? Number(specialRule.target)
    : (game.config?.sursis ? (limit || 100) : null)
  const ruleAction = isSpecialActive
    ? specialRule.action // 'divide' | 'multiply' | 'set'
    : (game.config?.sursisType === 'zero' ? 'set' : 'divide')
  const ruleValue = isSpecialActive
    ? Number(specialRule.value)
    : (ruleAction === 'set' ? 0 : 2)
  const isRuleActive = isSpecialActive || (game.config?.sursis && scoreDir === 'low_limit' && limit != null)

  const getTransformedScore = (score) => {
    if (ruleAction === 'divide') {
      const div = ruleValue || 2
      return Math.floor(score / div)
    }
    if (ruleAction === 'multiply') {
      const mul = ruleValue || 2
      return score * mul
    }
    if (ruleAction === 'set') {
      return ruleValue != null ? ruleValue : 0
    }
    return score
  }

  const getActionLabel = () => {
    if (ruleAction === 'divide') return `divisé par ${ruleValue || 2}`
    if (ruleAction === 'multiply') return `multiplié par ${ruleValue || 2}`
    if (ruleAction === 'set') return `ramené à ${ruleValue || 0} pt`
    return 'règle spéciale'
  }

  const getShortActionLabel = () => {
    if (ruleAction === 'divide') return `÷${ruleValue || 2}`
    if (ruleAction === 'multiply') return `×${ruleValue || 2}`
    if (ruleAction === 'set') return `→ ${ruleValue || 0}`
    return 'règle'
  }

  const submitRound = () => {
    const newScores = {}
    const delta = {}
    const reprieves = []

    for (const p of game.players) {
      const pts = roundScores[p.id] || 0
      const current = game.scores[p.id] || 0
      const projected = current + pts
      delta[p.id] = pts

      if (isRuleActive && targetScore != null && projected === targetScore) {
        const transformed = getTransformedScore(projected)
        reprieves.push({
          playerId: p.id,
          name: p.name,
          original: projected,
          reduced: transformed,
          actionLabel: getActionLabel(),
          shortLabel: getShortActionLabel(),
        })
        newScores[p.id] = transformed
      } else {
        newScores[p.id] = projected
      }
    }

    updateScores({
      scores: newScores,
      delta,
      type: 'universel',
      reprieves: reprieves.map(r => ({
        playerId: r.playerId,
        original: r.original,
        reduced: r.reduced,
        actionLabel: r.actionLabel,
        shortLabel: r.shortLabel,
      })),
    })

    setRoundScores(Object.fromEntries(game.players.map(p => [p.id, 0])))
    setOpen(false)

    if (reprieves.length > 0) {
      const msg = reprieves
        .map(r => `${r.name} : pile ${r.original} pts (${r.actionLabel}) → score : ${r.reduced} pts !`)
        .join(' · ')
      setReprieveNotice(msg)
    } else {
      setReprieveNotice(null)
    }

    if (scoreDir === 'low_limit' && limit) {
      const eliminated = Object.entries(newScores).find(([, s]) => s >= limit)
      if (eliminated) {
        const winner = Object.entries(newScores).sort((a, b) => a[1] - b[1])[0][0]
        onFinish(winner)
      }
    }
  }

  return (
    <div className="space-y-4 pt-2">
      {/* Bannière de notification en cas de règle spéciale / sursis */}
      {reprieveNotice && (
        <div className="p-3 rounded-xl border border-[#c83b3b] bg-[#c83b3b]/10 dark:bg-[#c83b3b]/20 flex items-start gap-2.5">
          <Shield size={16} className="text-[#c83b3b] mt-0.5 flex-shrink-0" />
          <div className="flex-1 text-xs">
            <span className="font-bold text-[#c83b3b] block">Règle de palier appliquée !</span>
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
            Points de la manche
          </p>
          <span className="text-[11px] font-semibold text-stone-400 dark:text-slate-500">
            {scoreDir === 'high'
              ? (isRuleActive && targetScore != null ? `Cumul libre · Palier ${targetScore} (${getShortActionLabel()})` : 'Score élevé gagne')
              : `Seuil : ${limit} pts${isRuleActive && targetScore != null ? ` · Palier ${targetScore} (${getShortActionLabel()})` : ''}`}
          </span>
        </div>
        <div className="space-y-2">
          {game.players.map(p => {
            const current = game.scores[p.id] || 0
            const pts = roundScores[p.id] || 0
            const projected = current + pts
            const isSpecial = isRuleActive && targetScore != null && projected === targetScore
            const transformed = isSpecial ? getTransformedScore(projected) : projected
            const isEliminated = scoreDir === 'low_limit' && limit && transformed >= limit && !isSpecial

            return (
              <div
                key={p.id}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                  isSpecial
                    ? 'border-[#c83b3b] bg-[#c83b3b]/10 ring-1 ring-[#c83b3b]/40'
                    : isEliminated
                    ? 'border-red-400/80 bg-red-500/10'
                    : 'school-subtle hover:border-[#c83b3b]'
                }`}
              >
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
                    <span className="font-semibold text-sm truncate block">
                      {p.name}
                    </span>
                    <span className="text-[11px] font-medium text-stone-500 dark:text-slate-400">
                      {pts !== 0 ? (
                        isSpecial ? (
                          <span className="text-[#c83b3b] font-bold">
                            {projected} → {transformed} pts ({getShortActionLabel()})
                          </span>
                        ) : (
                          scoreDir === 'low_limit' && limit
                            ? `${current} + ${pts} = ${projected}/${limit}`
                            : `${current} + ${pts} = ${projected} pts`
                        )
                      ) : (
                        scoreDir === 'low_limit' && limit ? (
                          `${current}/${limit} pts`
                        ) : (
                          `${current} pts`
                        )
                      )}
                    </span>
                  </div>
                </button>
                <QuickScoreBadge
                  value={pts}
                  onChange={v => setRoundScores(prev => ({ ...prev, [p.id]: v }))}
                  onOpenPad={() => {
                    setEditingPlayer(p)
                    setOpen(true)
                  }}
                  showPlus={true}
                  formatBubble={(val) => {
                    const proj = current + val
                    const isSpec = isRuleActive && targetScore != null && proj === targetScore
                    const trans = isSpec ? getTransformedScore(proj) : proj
                    if (isSpec) {
                      return { text: `🎯 ${trans}`, variant: 'sursis' }
                    }
                    if (scoreDir === 'low_limit' && limit && trans >= limit) {
                      return { text: `💥 ${trans}/${limit}`, variant: 'danger' }
                    }
                    return { text: `= ${trans}`, variant: 'default' }
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
                  </div>
                  <span className="text-xs text-stone-500 dark:text-slate-400 block whitespace-nowrap truncate mt-0.5">
                    Total actuel : {game.scores[editingPlayer.id] || 0} pts
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 shrink-0">
                {scoreDir === 'low_limit' && limit && (game.scores[editingPlayer.id] || 0) >= limit * 0.75 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap bg-[#c83b3b]/15 text-[#c83b3b] dark:text-red-300 shrink-0">
                    En danger
                  </span>
                )}
                <div className="flex items-center gap-1">
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
            </div>

            <ScorePad
              key={editingPlayer.id}
              value={roundScores[editingPlayer.id] || 0}
              onChange={v => setRoundScores(prev => ({ ...prev, [editingPlayer.id]: v }))}
              onConfirm={handleConfirmPad}
              confirmLabel={confirmLabel}
              baseScore={game.scores[editingPlayer.id] || 0}
              label="Points de la manche"
              subLabel={limit ? `Objectif / Limite : ${limit} pts` : undefined}
              presets={[0, 1, 2, 5, 10, 15, 20, 25, 50, 100]}
              formatDisplay={v => `${v > 0 ? '+' : ''}${v} pts`}
              formatTotal={(val) => {
                const curScore = game.scores[editingPlayer.id] || 0
                const proj = curScore + val
                const isSpec = isRuleActive && targetScore != null && proj === targetScore
                const trans = isSpec ? getTransformedScore(proj) : proj
                const prefix = val !== 0 ? `${val > 0 ? `+${val}` : val} pts · ` : ''
                if (isSpec) return `${prefix}Palier atteint (${getActionLabel()}) ➔ ${trans} pts`
                if (scoreDir === 'low_limit' && limit && trans >= limit) return `${prefix}Nouveau total : ${trans}/${limit} pts 💥 Éliminé`
                if (scoreDir === 'low_limit' && limit) return `${prefix}Nouveau total : ${trans}/${limit} pts`
                return `${prefix}Nouveau total : ${trans} pts`
              }}
              showPlus={true}
            />
          </div>
        </BottomSheet>
      )}
    </div>
  )
}
