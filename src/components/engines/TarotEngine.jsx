import { useState } from 'react'
import { useGame } from '../../context/GameContext'
import { computeTarotScore } from '../../engines/gameEngines'
import { TAROT_CONTRACTS, TAROT_BOUTS_THRESHOLDS } from '../../constants/games'
import { Avatar } from '../ui/Avatar'

export function TarotEngine({ game }) {
  const { updateScores } = useGame()
  const playerCount = game.players.length
  const [attackerId, setAttackerId] = useState(null)
  const [partnerId, setPartnerId] = useState(null)
  const [contract, setContract] = useState('petite')
  const [bouts, setBouts] = useState(0)
  const [points, setPoints] = useState(41)
  const [petitAuBout, setPetitAuBout] = useState('none')

  const submitRound = () => {
    if (!attackerId) return
    const result = computeTarotScore({
      players: game.players,
      attackerId,
      partnerId,
      contract,
      bouts,
      points,
      playerCount,
      petitAuBout,
    })
    const newScores = {}
    const delta = {}
    for (const p of game.players) {
      delta[p.id] = result.scores[p.id] || 0
      newScores[p.id] = (game.scores[p.id] || 0) + (result.scores[p.id] || 0)
    }
    updateScores({ scores: newScores, delta, result, type: 'tarot' })
    setAttackerId(null)
    setPartnerId(null)
    setContract('petite')
    setBouts(0)
    setPoints(41)
    setPetitAuBout('none')
  }

  const threshold = TAROT_BOUTS_THRESHOLDS[bouts]

  return (
    <div className="space-y-4 pt-2">
      {/* Preneur */}
      <div className="school-card rounded-xl p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-2.5">
          Preneur (Attaque)
        </p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {game.players.map(p => {
            const isSelected = attackerId === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setAttackerId(p.id)
                  if (partnerId === p.id) setPartnerId(null)
                }}
                className={`flex-shrink-0 flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all ${
                  isSelected ? 'border-[#c83b3b] bg-[#c83b3b]/10' : 'school-subtle'
                }`}
              >
                <Avatar player={p} size="xs" leader={isSelected} />
                <span className="text-[11px] font-semibold truncate max-w-[54px]">{p.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Partenaire (5 joueurs) */}
      {playerCount === 5 && (
        <div className="school-card rounded-xl p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-2.5">
            Partenaire appelé au Roi
          </p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {game.players.filter(p => p.id !== attackerId).map(p => {
              const isSelected = partnerId === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPartnerId(prev => (prev === p.id ? null : p.id))}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all ${
                    isSelected ? 'border-[#c83b3b] bg-[#c83b3b]/10' : 'school-subtle'
                  }`}
                >
                  <Avatar player={p} size="xs" leader={isSelected} />
                  <span className="text-[11px] font-semibold truncate max-w-[54px]">{p.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Contrat */}
      <div className="school-card rounded-xl p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-2.5">
          Contrat
        </p>
        <div className="grid grid-cols-2 gap-2">
          {TAROT_CONTRACTS.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => setContract(c.id)}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-colors ${
                contract === c.id
                  ? 'border-[#c83b3b] bg-[#c83b3b] text-white'
                  : 'school-subtle'
              }`}
            >
              {c.label} (×{c.multiplier})
            </button>
          ))}
        </div>
      </div>

      {/* Bouts */}
      <div className="school-card rounded-xl p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-2.5">
          Nombre de Bouts (seuil : {threshold} pts)
        </p>
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setBouts(n)}
              className={`py-2.5 rounded-xl font-black text-base border transition-colors ${
                bouts === n
                  ? 'border-[#c83b3b] bg-[#c83b3b] text-white'
                  : 'school-subtle'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Points réalisés */}
      <div className="school-card rounded-xl p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-2">
          Points réalisés par l'attaque (seuil : {threshold})
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPoints(v => Math.max(0, v - 1))}
            className="w-10 h-10 rounded-xl school-subtle text-xl font-bold"
          >
            -
          </button>
          <span
            className={`flex-1 text-center text-3xl font-black tabular-nums ${
              points >= threshold ? 'text-emerald-700 dark:text-emerald-400' : 'text-[#c83b3b]'
            }`}
          >
            {points}
          </span>
          <button
            type="button"
            onClick={() => setPoints(v => Math.min(91, v + 1))}
            className="w-10 h-10 rounded-xl school-subtle text-xl font-bold"
          >
            +
          </button>
        </div>
        <input
          type="range"
          min={0}
          max={91}
          value={points}
          onChange={e => setPoints(Number(e.target.value))}
          className="w-full mt-3 accent-[#c83b3b]"
        />
        <p className="text-center text-xs font-semibold text-stone-500 dark:text-slate-400 mt-1">
          {points >= threshold
            ? `Contrat réussi (+${points - threshold} pts)`
            : `Contrat chuté (-${threshold - points} pts)`}
        </p>
      </div>

      {/* Petit au bout */}
      <div className="school-card rounded-xl p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-2.5">
          Petit au bout (±10 pts × coeff.)
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'none', label: 'Aucun' },
            { id: 'attack', label: 'Attaque (+10)' },
            { id: 'defense', label: 'Défense (-10)' },
          ].map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPetitAuBout(opt.id)}
              className={`py-2 px-2 rounded-xl text-xs font-bold border transition-colors ${
                petitAuBout === opt.id
                  ? 'border-[#c83b3b] bg-[#c83b3b] text-white'
                  : 'school-subtle'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={submitRound}
        disabled={!attackerId}
        className="w-full py-3.5 rounded-xl font-bold text-base btn-margin-red disabled:opacity-40"
      >
        Valider la donne
      </button>
    </div>
  )
}
