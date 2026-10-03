import { useState } from 'react'
import { useGame } from '../../context/GameContext'
import { computePresidentScores, getPresidentRole } from '../../engines/gameEngines'
import { Avatar } from '../ui/Avatar'

export function PresidentEngine({ game }) {
  const { updateScores } = useGame()
  const [order, setOrder] = useState([])

  const remaining = game.players.filter(p => !order.includes(p.id))
  const totalPlayers = game.players.length

  const addToOrder = (id) => setOrder(prev => [...prev, id])
  const resetOrder = () => setOrder([])

  const submitRound = () => {
    const roundScores = computePresidentScores(order)
    const newScores = {}
    const delta = {}
    for (const p of game.players) {
      delta[p.id] = roundScores[p.id] || 0
      newScores[p.id] = (game.scores[p.id] || 0) + (roundScores[p.id] || 0)
    }
    updateScores({ scores: newScores, delta, order: [...order], type: 'president' })
    setOrder([])
  }

  const isComplete = order.length === totalPlayers
  const lastRound = game.rounds[game.rounds.length - 1]

  return (
    <div className="space-y-4 pt-2">
      {lastRound && (
        <div className="school-card rounded-xl p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-2.5">
            Hiérarchie en cours (échanges de cartes)
          </p>
          <div className="space-y-1.5">
            {lastRound.order?.map((id, idx) => {
              const player = game.players.find(p => p.id === id)
              const role = getPresidentRole(idx + 1, totalPlayers)
              if (!player) return null
              return (
                <div key={id} className="flex items-center gap-2.5 text-xs py-0.5">
                  <span className="w-6 font-bold text-stone-400 dark:text-slate-500">
                    {idx + 1}e
                  </span>
                  <Avatar player={player} size="xs" leader={idx === 0} leaderColor="#10b981" crown={idx === 0} />
                  <span className="font-semibold flex-1 truncate">{player.name}</span>
                  <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-slate-800 font-bold text-stone-700 dark:text-slate-300">
                    {role.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="school-card rounded-xl p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-3">
          Ordre de sortie des joueurs
        </p>

        {/* Joueurs encore en main */}
        {remaining.length > 0 && (
          <div className="space-y-2 mb-3">
            {remaining.map(p => {
              const nextRole = getPresidentRole(order.length + 1, totalPlayers)
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addToOrder(p.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl school-subtle hover:border-[#c83b3b] active:scale-[0.99] transition-all"
                >
                  <Avatar player={p} size="xs" />
                  <span className="flex-1 font-semibold text-sm text-left truncate">
                    {p.name}
                  </span>
                  <span className="text-xs font-semibold text-[#c83b3b]">
                    Classer {order.length + 1}e ({nextRole.short})
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Classement enregistré */}
        {order.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 mb-1.5">
              Ordre validé :
            </p>
            {order.map((id, idx) => {
              const player = game.players.find(p => p.id === id)
              const role = getPresidentRole(idx + 1, totalPlayers)
              if (!player) return null
              return (
                <div key={id} className="flex items-center gap-2.5 text-sm px-2 py-1 rounded-lg school-subtle">
                  <span className="w-6 text-xs font-bold text-stone-400 dark:text-slate-500">
                    {idx + 1}e
                  </span>
                  <Avatar player={player} size="xs" leader={idx === 0} leaderColor="#10b981" crown={idx === 0} />
                  <span className="font-semibold flex-1 truncate">{player.name}</span>
                  <span className="text-xs text-stone-500 dark:text-slate-400">{role.label}</span>
                  <span className={`text-xs font-black tabular-nums ${
                    role.points > 0 ? 'text-emerald-700 dark:text-emerald-400' : role.points < 0 ? 'text-[#c83b3b]' : 'text-stone-500'
                  }`}>
                    {role.points >= 0 ? '+' : ''}{role.points}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {order.length > 0 && (
          <button
            type="button"
            onClick={resetOrder}
            className="mt-3 text-xs font-semibold text-[#c83b3b] underline"
          >
            Réinitialiser l'ordre de sortie
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={submitRound}
        disabled={!isComplete}
        className="w-full py-3.5 rounded-xl font-bold text-base btn-margin-red disabled:opacity-40"
      >
        Valider la manche
      </button>
    </div>
  )
}
