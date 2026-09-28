import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { Avatar } from '../ui/Avatar'
import { BottomSheet } from '../ui/BottomSheet'
import { ScorePad } from '../ui/ScorePad'

export function UniverselEngine({ game, onFinish }) {
  const { updateScores } = useGame()
  const [roundScores, setRoundScores] = useState(
    Object.fromEntries(game.players.map(p => [p.id, 0]))
  )
  const [editingPlayer, setEditingPlayer] = useState(null)
  const [open, setOpen] = useState(false)
  const [reprieveNotice, setReprieveNotice] = useState(null)

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
          <Sparkles size={16} className="text-[#c83b3b] mt-0.5 flex-shrink-0" />
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
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setEditingPlayer(p)
                  setOpen(true)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all active:scale-[0.99] ${
                  isSpecial
                    ? 'border-[#c83b3b] bg-[#c83b3b]/10 ring-1 ring-[#c83b3b]/40'
                    : isEliminated
                    ? 'border-red-400/80 bg-red-500/10'
                    : 'school-subtle hover:border-[#c83b3b]'
                }`}
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
                <span className="text-lg font-black tabular-nums">
                  {pts >= 0 ? '+' : ''}{pts}
                </span>
              </button>
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
          title={`${editingPlayer.name} — Points manche`}
        >
          <div className="px-5 pb-6">
            <ScorePad
              value={roundScores[editingPlayer.id] || 0}
              onChange={v => setRoundScores(prev => ({ ...prev, [editingPlayer.id]: v }))}
              onConfirm={() => setOpen(false)}
            />
          </div>
        </BottomSheet>
      )}
    </div>
  )
}
