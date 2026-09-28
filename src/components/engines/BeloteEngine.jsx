import { useState } from 'react'
import { useGame } from '../../context/GameContext'
import { computeBeloteScore } from '../../engines/gameEngines'
import { BELOTE_CONTRACTS } from '../../constants/games'

const TEAMS = ['nous', 'eux']

export function BeloteEngine({ game, onFinish }) {
  const { updateScores } = useGame()
  const [takerTeam, setTakerTeam] = useState('nous')
  const [contract, setContract] = useState(80)
  const [pointsTaker, setPointsTaker] = useState(82)
  const [announcements, setAnnouncements] = useState(0)

  const submitRound = () => {
    const teamScores = computeBeloteScore({ contract, announcements, takerTeam, pointsTaker })
    const nous = game.players.filter((_, i) => i % 2 === 0).map(p => p.id)
    const eux = game.players.filter((_, i) => i % 2 !== 0).map(p => p.id)
    const newScores = { ...game.scores }
    const delta = {}
    nous.forEach(id => {
      newScores[id] = (newScores[id] || 0) + teamScores['nous']
      delta[id] = teamScores['nous']
    })
    eux.forEach(id => {
      newScores[id] = (newScores[id] || 0) + teamScores['eux']
      delta[id] = teamScores['eux']
    })
    updateScores({ scores: newScores, delta, teamScores, type: 'belote' })

    const limit = game.config?.limit || 1000
    if (Object.values(newScores).some(s => s >= limit)) {
      const winner = Object.entries(newScores).sort((a, b) => b[1] - a[1])[0][0]
      onFinish(winner)
    }
  }

  const currentResult = computeBeloteScore({ contract, announcements, takerTeam, pointsTaker })

  return (
    <div className="space-y-4 pt-2">
      {/* Équipes */}
      <div className="school-card rounded-xl p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-2.5">
          Équipe preneuse
        </p>
        <div className="grid grid-cols-2 gap-2">
          {TEAMS.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTakerTeam(t)}
              className={`py-2.5 rounded-xl font-bold text-sm border transition-colors ${
                takerTeam === t
                  ? 'border-[#c83b3b] bg-[#c83b3b] text-white'
                  : 'school-subtle'
              }`}
            >
              {t === 'nous' ? 'Équipe Nous' : 'Équipe Eux'}
            </button>
          ))}
        </div>
      </div>

      {/* Contrat */}
      <div className="school-card rounded-xl p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-2.5">
          Contrat annoncé
        </p>
        <div className="flex flex-wrap gap-1.5">
          {BELOTE_CONTRACTS.map(c => (
            <button
              key={c.value}
              type="button"
              onClick={() => {
                setContract(c.value)
                if (c.value === 252 || c.value === 500) setPointsTaker(162)
              }}
              className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${
                contract === c.value
                  ? 'border-[#c83b3b] bg-[#c83b3b] text-white'
                  : 'school-subtle'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Points réalisés */}
      <div className="school-card rounded-xl p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-2">
          Points réalisés par le preneur (/ 162)
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPointsTaker(v => Math.max(0, v - 1))}
            className="w-10 h-10 rounded-xl school-subtle text-lg font-bold"
          >
            -
          </button>
          <div className="flex-1 text-center">
            <span className="text-3xl font-black tabular-nums">{pointsTaker}</span>
            <span className="text-xs text-stone-400 dark:text-slate-500 block">
              Défense : {162 - pointsTaker} pts
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPointsTaker(v => Math.min(162, v + 1))}
            className="w-10 h-10 rounded-xl school-subtle text-lg font-bold"
          >
            +
          </button>
        </div>
        <input
          type="range"
          min={0}
          max={162}
          value={pointsTaker}
          onChange={e => setPointsTaker(Number(e.target.value))}
          className="w-full mt-3 accent-[#c83b3b]"
        />
      </div>

      {/* Annonces */}
      <div className="school-card rounded-xl p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-2">
          Annonces & Belote (+20)
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAnnouncements(v => Math.max(0, v - 20))}
            className="w-10 h-10 rounded-xl school-subtle text-lg font-bold"
          >
            -
          </button>
          <span className="flex-1 text-center text-2xl font-black tabular-nums">
            +{announcements}
          </span>
          <button
            type="button"
            onClick={() => setAnnouncements(v => v + 20)}
            className="w-10 h-10 rounded-xl school-subtle text-lg font-bold"
          >
            +
          </button>
        </div>
      </div>

      {/* Aperçu répartition */}
      <div className="grid grid-cols-2 gap-3">
        {TEAMS.map(t => (
          <div key={t} className="school-card rounded-xl p-3 text-center">
            <p className="text-xs font-semibold text-stone-500 dark:text-slate-400 mb-0.5">
              {t === 'nous' ? 'Nous' : 'Eux'}
            </p>
            <p className="text-xl font-black tabular-nums text-[#c83b3b]">
              +{currentResult[t]}
            </p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={submitRound}
        className="w-full py-3.5 rounded-xl font-bold text-base btn-margin-red"
      >
        Valider la donne
      </button>
    </div>
  )
}
