import { useState } from 'react'
import { useGame } from '../../context/GameContext'
import { computePresidentScores, getPresidentRole } from '../../engines/gameEngines'
import { Avatar } from '../ui/Avatar'
import { PRESIDENT_ROLES } from '../../constants/games'

export function PresidentEngine({ game, onFinish }) {
  const { updateScores } = useGame()
  const [order, setOrder] = useState([]) // array of player ids in finish order

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

  // Prochains rôles selon la manche précédente
  const lastRound = game.rounds[game.rounds.length - 1]

  return (
    <div className="space-y-4 pt-2">
      {lastRound && (
        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">
            Titres pour cette manche
          </p>
          <div className="space-y-1.5">
            {lastRound.order?.map((id, idx) => {
              const player = game.players.find(p => p.id === id)
              const role = getPresidentRole(idx + 1, totalPlayers)
              if (!player) return null
              return (
                <div key={id} className="flex items-center gap-2 text-sm">
                  <span>{role.emoji}</span>
                  <Avatar player={player} size="xs" />
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{player.name}</span>
                  <span className="ml-auto text-xs text-zinc-500">joue comme {role.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">
          Ordre d'arrivée — cliquer dans l'ordre de sortie
        </p>

        {/* Joueurs en attente */}
        {remaining.length > 0 && (
          <div className="space-y-2 mb-3">
            {remaining.map(p => (
              <button
                key={p.id}
                onClick={() => addToOrder(p.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 active:scale-[0.98] transition-all"
              >
                <Avatar player={p} size="xs" />
                <span className="flex-1 font-semibold text-sm text-left text-zinc-900 dark:text-zinc-100">{p.name}</span>
                <span className="text-xs text-zinc-400">Tap pour {order.length + 1}e</span>
              </button>
            ))}
          </div>
        )}

        {/* Classement construit */}
        {order.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-2">Classé :</p>
            {order.map((id, idx) => {
              const player = game.players.find(p => p.id === id)
              const role = getPresidentRole(idx + 1, totalPlayers)
              if (!player) return null
              return (
                <div key={id} className="flex items-center gap-2 text-sm px-2">
                  <span className="w-5 text-center font-bold text-zinc-400">{idx + 1}</span>
                  <span>{role.emoji}</span>
                  <Avatar player={player} size="xs" />
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{player.name}</span>
                  <span className="ml-auto text-xs font-bold" style={{ color: role.points >= 0 ? '#22c55e' : '#ef4444' }}>
                    {role.points >= 0 ? '+' : ''}{role.points}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {order.length > 0 && (
          <button onClick={resetOrder} className="mt-3 text-xs text-zinc-400 underline">
            Recommencer l'ordre
          </button>
        )}
      </div>

      <button
        onClick={submitRound}
        disabled={!isComplete}
        className="w-full py-3.5 rounded-xl font-bold text-base text-[#18181b] transition-all active:scale-[0.98] disabled:opacity-40"
        style={{ backgroundColor: '#fcc817' }}
      >
        Valider la manche
      </button>
    </div>
  )
}
