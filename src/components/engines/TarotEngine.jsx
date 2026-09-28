import { useState } from 'react'
import { useGame } from '../../context/GameContext'
import { computeTarotScore } from '../../engines/gameEngines'
import { TAROT_CONTRACTS, TAROT_BOUTS_THRESHOLDS } from '../../constants/games'
import { Avatar } from '../ui/Avatar'

export function TarotEngine({ game, onFinish }) {
  const { updateScores } = useGame()
  const playerCount = game.players.length
  const [attackerId, setAttackerId] = useState(null)
  const [partnerId, setPartnerId] = useState(null)
  const [contract, setContract] = useState('petite')
  const [bouts, setBouts] = useState(0)
  const [points, setPoints] = useState(41)

  const submitRound = () => {
    if (!attackerId) return
    const result = computeTarotScore({ players: game.players, attackerId, partnerId, contract, bouts, points, playerCount })
    const newScores = {}
    const delta = {}
    for (const p of game.players) {
      delta[p.id] = result.scores[p.id] || 0
      newScores[p.id] = (game.scores[p.id] || 0) + (result.scores[p.id] || 0)
    }
    updateScores({ scores: newScores, delta, result, type: 'tarot' })
    setAttackerId(null); setPartnerId(null)
    setContract('petite'); setBouts(0); setPoints(41)
  }

  const threshold = TAROT_BOUTS_THRESHOLDS[bouts]

  return (
    <div className="space-y-4 pt-2">
      {/* Attaquant */}
      <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">Attaquant</p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {game.players.map(p => (
            <button
              key={p.id}
              onClick={() => { setAttackerId(p.id); if (partnerId === p.id) setPartnerId(null) }}
              className={`flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                attackerId === p.id ? 'ring-2 ring-[#fcc817]' : 'bg-white dark:bg-zinc-800'
              }`}
            >
              <Avatar player={p} size="xs" />
              <span className="text-[10px] font-semibold truncate max-w-[48px]">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Partenaire (5 joueurs) */}
      {playerCount === 5 && (
        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">
            Partenaire (appelé au Roi)
          </p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {game.players.filter(p => p.id !== attackerId).map(p => (
              <button
                key={p.id}
                onClick={() => setPartnerId(prev => prev === p.id ? null : p.id)}
                className={`flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                  partnerId === p.id ? 'ring-2 ring-[#fcc817]' : 'bg-white dark:bg-zinc-800'
                }`}
              >
                <Avatar player={p} size="xs" />
                <span className="text-[10px] font-semibold truncate max-w-[48px]">{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Contrat */}
      <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">Contrat</p>
        <div className="grid grid-cols-2 gap-2">
          {TAROT_CONTRACTS.map(c => (
            <button
              key={c.id}
              onClick={() => setContract(c.id)}
              className={`py-2.5 px-3 rounded-xl text-sm font-bold transition-colors ${
                contract === c.id ? 'text-[#18181b]' : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
              style={contract === c.id ? { backgroundColor: '#fcc817' } : {}}
            >
              {c.label} ×{c.multiplier}
            </button>
          ))}
        </div>
      </div>

      {/* Bouts */}
      <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">
          Nombre de bouts (seuil : {threshold} pts)
        </p>
        <div className="grid grid-cols-4 gap-2">
          {[0,1,2,3].map(n => (
            <button
              key={n}
              onClick={() => setBouts(n)}
              className={`py-3 rounded-xl font-black text-lg transition-colors ${
                bouts === n ? 'text-[#18181b]' : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
              style={bouts === n ? { backgroundColor: '#fcc817' } : {}}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Points réalisés */}
      <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
          Points réalisés (seuil : {threshold})
        </p>
        <div className="flex items-center gap-3">
          <button onClick={() => setPoints(v => Math.max(0, v - 1))} className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 text-xl font-bold">-</button>
          <span className={`flex-1 text-center text-3xl font-black tabular-nums ${points >= threshold ? 'text-green-500' : 'text-red-500'}`}>{points}</span>
          <button onClick={() => setPoints(v => Math.min(91, v + 1))} className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 text-xl font-bold">+</button>
        </div>
        <input
          type="range"
          min={0} max={91}
          value={points}
          onChange={e => setPoints(Number(e.target.value))}
          className="w-full mt-3 accent-[#fcc817]"
        />
        <p className="text-center text-xs text-zinc-400 mt-1">
          {points >= threshold ? `✅ Contrat rempli (+${points - threshold} pts)` : `❌ Contrat chuté (-${threshold - points} pts)`}
        </p>
      </div>

      <button
        onClick={submitRound}
        disabled={!attackerId}
        className="w-full py-3.5 rounded-xl font-bold text-base text-[#18181b] transition-all active:scale-[0.98] disabled:opacity-40"
        style={{ backgroundColor: '#fcc817' }}
      >
        Valider la donne
      </button>
    </div>
  )
}
