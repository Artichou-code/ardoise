import { useState } from 'react'
import { useGame } from '../../context/GameContext'
import { computePresidentScores, getPresidentRole } from '../../engines/gameEngines'
import { Avatar } from '../ui/Avatar'
import { PresidentReorderList } from './PresidentReorderList'
import { RotateCcw } from 'lucide-react'

export function PresidentEngine({ game }) {
  const { updateScores } = useGame()
  const totalPlayers = game.players.length

  const [order, setOrder] = useState(() => {
    if (game.restoredRound?.order && Array.isArray(game.restoredRound.order) && game.restoredRound.order.length === totalPlayers) {
      return [...game.restoredRound.order]
    }
    const last = game.rounds[game.rounds.length - 1]
    if (last?.order && Array.isArray(last.order) && last.order.length === totalPlayers) {
      return [...last.order]
    }
    return game.players.map(p => p.id)
  })

  const resetToDefault = () => {
    setOrder(game.players.map(p => p.id))
  }

  const submitRound = () => {
    if (order.length !== totalPlayers) return
    const roundScores = computePresidentScores(order)
    const newScores = {}
    const delta = {}
    for (const p of game.players) {
      delta[p.id] = roundScores[p.id] || 0
      newScores[p.id] = (game.scores[p.id] || 0) + (roundScores[p.id] || 0)
    }
    updateScores({ scores: newScores, delta, order: [...order], type: 'president' })
  }

  const lastRound = game.rounds[game.rounds.length - 1]
  const presidentPlayer = game.players.find(p => p.id === order[0])
  const trouPlayer = game.players.find(p => p.id === order[order.length - 1])

  return (
    <div className="space-y-4 pt-2">
      {/* Hiérarchie de la manche précédente pour les échanges de cartes de début de manche */}
      {lastRound && (
        <div className="school-card rounded-xl p-3 sm:p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-2">
            Hiérarchie en cours (échanges de cartes)
          </p>
          <div className="space-y-1.5">
            {lastRound.order?.map((id, idx) => {
              const player = game.players.find(p => p.id === id)
              const role = getPresidentRole(idx + 1, totalPlayers)
              if (!player) return null
              return (
                <div key={id} className="flex items-center gap-2.5 text-xs py-0.5">
                  <span className="w-5 font-bold text-stone-400 dark:text-slate-500 text-[11px]">
                    {idx + 1}e
                  </span>
                  <Avatar player={player} size="xs" leader={idx === 0} leaderColor="#10b981" crown={idx === 0} />
                  <span className="font-semibold flex-1 truncate text-stone-900 dark:text-slate-100">
                    {player.name}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-slate-800 font-bold text-stone-700 dark:text-slate-300 text-[10px]">
                    {role.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Classement interactif par Glisser - Déposer (Drag & Drop) */}
      <div className="school-card rounded-xl p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
            Ordre de sortie des joueurs
          </p>
          <button
            type="button"
            onClick={resetToDefault}
            className="text-[11px] font-semibold text-stone-500 hover:text-[#c83b3b] dark:text-slate-400 dark:hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
            title="Réinitialiser à l'ordre initial"
          >
            <RotateCcw size={11} />
            <span>Réinitialiser</span>
          </button>
        </div>

        <PresidentReorderList
          order={order}
          setOrder={setOrder}
          players={game.players}
          gameScores={game.scores}
        />
      </div>

      <button
        type="button"
        onClick={submitRound}
        disabled={order.length !== totalPlayers}
        className="w-full py-3.5 px-3 rounded-xl font-bold text-base btn-margin-red disabled:opacity-40 shadow-sm active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center"
      >
        <span>Valider la manche</span>
        {presidentPlayer && trouPlayer && (
          <span className="inline-flex items-baseline gap-1 text-sm font-normal opacity-85 truncate max-w-[200px] sm:max-w-xs">
            <span>({presidentPlayer.name} ➔ 1er)</span>
          </span>
        )}
      </button>
    </div>
  )
}

