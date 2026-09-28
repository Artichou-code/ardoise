import { useState } from 'react'
import { BottomSheet } from '../ui/BottomSheet'
import { ScorePad } from '../ui/ScorePad'
import { Avatar } from '../ui/Avatar'
import { useGame } from '../../context/GameContext'

/**
 * Affichage des traits de pénalité d'écolier (bâtons de craie par paquets de 5).
 */
function SchoolTally({ count }) {
  if (!count || count <= 0) {
    return (
      <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
        0 défaite
      </span>
    )
  }

  const groupsOfFive = Math.floor(count / 5)
  const remainder = count % 5

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 font-mono text-xs font-black tracking-tighter text-[#c83b3b]">
        {Array.from({ length: groupsOfFive }).map((_, idx) => (
          <span key={idx} className="relative inline-block px-0.5 leading-none">
            ||||
            <span className="absolute left-0 right-0 top-1/2 h-[2px] bg-[#c83b3b] -rotate-18" />
          </span>
        ))}
        {remainder > 0 && (
          <span className="leading-none">{'|'.repeat(remainder)}</span>
        )}
      </div>
      <span className="text-[11px] font-bold text-stone-500 dark:text-slate-400 tabular-nums">
        ({count})
      </span>
    </div>
  )
}

export function DourakEngine({ game, onFinish }) {
  const { updateScores } = useGame()
  const mode = game.config?.mode || 'defeats' // 'defeats' | 'cards'
  const endCondition = game.config?.endCondition || 'limit' // 'limit' | 'rounds'
  const limit = game.config?.limit || (mode === 'cards' ? 30 : 5)

  const [loserId, setLoserId] = useState(null)
  const [cardsLeft, setCardsLeft] = useState(4)
  const [sheetOpen, setSheetOpen] = useState(false)

  const currentRoundNumber = game.rounds.length + 1

  const checkAndTriggerEnd = (newScores, nextRoundCount) => {
    if (endCondition === 'rounds' && nextRoundCount >= limit) {
      const bestPlayer = Object.entries(newScores).sort((a, b) => a[1] - b[1])[0][0]
      onFinish(bestPlayer)
      return
    }
    if (endCondition === 'limit') {
      const reached = Object.entries(newScores).find(([, s]) => s >= limit)
      if (reached) {
        const bestPlayer = Object.entries(newScores).sort((a, b) => a[1] - b[1])[0][0]
        onFinish(bestPlayer)
      }
    }
  }

  const handleSelectPlayer = (player) => {
    setLoserId(player.id)
    if (mode === 'cards') {
      setCardsLeft(4)
      setSheetOpen(true)
    }
  }

  const submitRound = () => {
    if (!loserId) return
    const penalty = mode === 'cards' ? Math.max(1, cardsLeft) : 1
    const newScores = {}
    const delta = {}

    for (const p of game.players) {
      const add = p.id === loserId ? penalty : 0
      newScores[p.id] = (game.scores[p.id] || 0) + add
      delta[p.id] = add
    }

    updateScores({
      scores: newScores,
      delta,
      loserId,
      mode,
      type: 'dourak',
    })

    const nextRoundCount = game.rounds.length + 1
    setLoserId(null)
    setSheetOpen(false)
    checkAndTriggerEnd(newScores, nextRoundCount)
  }

  const lastLoserId = game.rounds[game.rounds.length - 1]?.loserId
  const selectedPlayer = game.players.find(p => p.id === loserId)

  return (
    <div className="space-y-4 pt-2">
      {/* Bandeau d'information de manche & condition de fin */}
      <div className="flex items-center justify-between px-1 text-xs text-stone-500 dark:text-slate-400">
        <span>
          {mode === 'defeats'
            ? 'Mode classique : +1 défaite au Dourak'
            : 'Variante aux cartes : cartes restantes en main'}
        </span>
        <span className="font-bold text-stone-700 dark:text-slate-300">
          {endCondition === 'rounds'
            ? `Manche ${currentRoundNumber} / ${limit}`
            : `Arrêt à ${limit} ${mode === 'cards' ? 'cartes' : 'défaites'}`}
        </span>
      </div>

      {/* Liste des joueurs pour désigner le Dourak d'un seul tap */}
      <div className="school-card rounded-xl p-3 sm:p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-2.5">
          Qui est le Dourak de cette manche ?
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {game.players.map(p => {
            const isSelected = loserId === p.id
            const wasLastDourak = lastLoserId === p.id
            const playerScore = game.scores[p.id] || 0

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPlayer(p)}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border transition-all active:scale-[0.98] text-left ${
                  isSelected
                    ? 'border-[#c83b3b] bg-[#c83b3b]/10 ring-1 ring-[#c83b3b]/30 font-bold'
                    : 'school-subtle hover:border-[#c83b3b]/60'
                }`}
              >
                <Avatar player={p} size="xs" leader={isSelected} />
                <div className="flex-1 min-w-0">
                  {/* Ligne 1 : Nom du joueur à gauche, Badge Sortant à droite */}
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-xs truncate">
                      {p.name}
                    </span>
                    {wasLastDourak && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-800 dark:text-amber-200 shrink-0">
                        Sortant
                      </span>
                    )}
                  </div>

                  {/* Ligne 2 : Décompte/Bâtons à gauche, Désigner/+1 à droite */}
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <div className="min-w-0">
                      {mode === 'defeats' ? (
                        <SchoolTally count={playerScore} />
                      ) : (
                        <span className="text-[10px] text-stone-500 dark:text-slate-400 tabular-nums truncate block">
                          {playerScore} carte{playerScore > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    {isSelected ? (
                      <span className="px-1.5 py-0.2 rounded bg-[#c83b3b] text-white text-[10px] font-black shrink-0">
                        {mode === 'cards' ? `+${cardsLeft} c.` : '+1'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-stone-400 dark:text-slate-500 shrink-0">
                        Désigner
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={submitRound}
        disabled={!loserId}
        className="w-full py-3.5 rounded-xl font-bold text-base btn-margin-red disabled:opacity-40"
      >
        {loserId
          ? mode === 'cards'
            ? `Infliger +${cardsLeft} cartes à ${selectedPlayer?.name}`
            : `Noter +1 défaite pour ${selectedPlayer?.name}`
          : 'Sélectionnez le Dourak de la manche'}
      </button>

      {/* Bottom Sheet pour la variante pénalité aux cartes */}
      {mode === 'cards' && selectedPlayer && (
        <BottomSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title={`${selectedPlayer.name} — Cartes restantes`}
          subtitle="Nombre de cartes en main en fin de manche"
        >
          <div className="px-5 pb-6 space-y-4">
            <div className="grid grid-cols-6 gap-1.5 pt-2">
              {[2, 4, 6, 8, 10, 12].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCardsLeft(n)}
                  className={`py-2 rounded-lg text-xs font-bold border transition-colors ${
                    cardsLeft === n
                      ? 'border-[#c83b3b] bg-[#c83b3b] text-white'
                      : 'school-subtle'
                  }`}
                >
                  {n} c.
                </button>
              ))}
            </div>
            <ScorePad
              value={cardsLeft}
              onChange={v => setCardsLeft(Math.max(1, v))}
              onConfirm={() => setSheetOpen(false)}
              min={1}
            />
          </div>
        </BottomSheet>
      )}
    </div>
  )
}
