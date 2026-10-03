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
      <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
        0 défaite
      </span>
    )
  }

  const groupsOfFive = Math.floor(count / 5)
  const remainder = count % 5

  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap">
      <div className="flex items-center gap-1 font-mono text-xs font-black tracking-tighter text-[#c83b3b]">
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
      <span className="text-[10px] font-bold text-stone-500 dark:text-slate-400 tabular-nums">
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
      <div className="flex items-center justify-between gap-2 px-1 text-xs">
        <span className="text-stone-500 dark:text-slate-400 font-medium truncate">
          {mode === 'defeats' ? 'Mode classique' : 'Variante aux cartes'}
        </span>
        <span className="font-bold text-stone-700 dark:text-slate-200 shrink-0 text-[11px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700/80">
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
          {game.players.map((p, idx) => {
            const isSelected = loserId === p.id
            const wasLastDourak = lastLoserId === p.id
            const playerScore = game.scores[p.id] || 0
            const colSpan = game.players.length === 3 && idx === 2 ? 'col-span-2 sm:col-span-1' : ''

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPlayer(p)}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border transition-all active:scale-[0.98] text-left cursor-pointer min-h-[46px] ${colSpan} ${
                  isSelected
                    ? 'border-[#c83b3b] bg-[#c83b3b]/10 ring-1 ring-[#c83b3b]/30 font-bold'
                    : wasLastDourak
                    ? 'border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60'
                    : 'school-subtle hover:border-[#c83b3b]/60'
                }`}
              >
                <div className="flex flex-col items-center justify-center shrink-0">
                  <Avatar
                    player={p}
                    size="xs"
                    leader={isSelected}
                    ringColor={isSelected ? '#c83b3b' : wasLastDourak ? '#f59e0b' : undefined}
                  />
                  {wasLastDourak && (
                    <span className="text-[7.5px] font-black uppercase tracking-wider px-1 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-200 shrink-0 leading-none mt-1">
                      Sortant
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {/* Ligne 1 : Nom du joueur sur 100% de la largeur (zéro troncature) */}
                  <span className="font-bold text-xs truncate block text-stone-900 dark:text-slate-100 leading-tight">
                    {p.name}
                  </span>

                  {/* Ligne 2 : Décompte/Bâtons à gauche, Radio / +1 à droite (zéro chevauchement) */}
                  <div className="flex items-center justify-between gap-1 mt-0.5 min-h-[16px]">
                    <div className="min-w-0 truncate shrink-0">
                      {mode === 'defeats' ? (
                        <SchoolTally count={playerScore} />
                      ) : (
                        <span className="text-[10px] text-stone-500 dark:text-slate-400 tabular-nums truncate block">
                          {playerScore} carte{playerScore > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    {isSelected ? (
                      <span className="px-1.5 py-0.5 rounded-full bg-[#c83b3b] text-white text-[10px] font-black shrink-0 shadow-2xs leading-none">
                        {mode === 'cards' ? `+${cardsLeft} c.` : '+1'}
                      </span>
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-stone-300 dark:border-slate-600 shrink-0" />
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
        >
          <div className="px-4 pt-1 pb-6 space-y-3">
            {/* Carte du joueur actif désigné Dourak */}
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-stone-100/80 dark:bg-slate-800/60 border border-stone-200/80 dark:border-slate-700/60">
              <Avatar player={selectedPlayer} size="sm" leader={true} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm truncate text-stone-900 dark:text-slate-100">
                    {selectedPlayer.name}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#c83b3b]/15 text-[#c83b3b] dark:text-red-300 shrink-0">
                    Dourak de la manche
                  </span>
                </div>
                <span className="text-xs text-stone-500 dark:text-slate-400">
                  Total actuel : {game.scores[selectedPlayer.id] || 0} cartes
                </span>
              </div>
            </div>

            <ScorePad
              value={cardsLeft}
              onChange={v => setCardsLeft(Math.max(1, v))}
              onConfirm={() => setSheetOpen(false)}
              confirmLabel="Valider les cartes"
              min={1}
              max={36}
              step={1}
              label="Cartes restantes en main"
              subLabel={`Seuil d'arrêt : ${limit} cartes`}
              presets={[1, 2, 3, 4, 5, 6, 8, 10, 12]}
              formatDisplay={v => `${v} c.`}
              formatTotal={val => {
                const cur = game.scores[selectedPlayer.id] || 0
                const proj = cur + val
                return `+${val} cartes · Nouveau cumul : ${proj}/${limit} cartes${proj >= limit ? ' 💥 Arrêt atteint' : ''}`
              }}
              baseScore={game.scores[selectedPlayer.id] || 0}
              showPlus={false}
              customButtons={[
                { label: '1 c.', value: 1 },
                { label: '2 c.', value: 2 },
                { label: '4 c.', value: 4 },
                { label: '6 c.', value: 6 },
                { label: '8 c.', value: 8 },
              ]}
            />
          </div>
        </BottomSheet>
      )}
    </div>
  )
}
