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
    // Mapper équipes → joueurs (2 par équipe)
    const nous = game.players.filter((_, i) => i % 2 === 0).map(p => p.id)
    const eux = game.players.filter((_, i) => i % 2 !== 0).map(p => p.id)
    const newScores = { ...game.scores }
    const delta = {}
    nous.forEach(id => { newScores[id] = (newScores[id] || 0) + teamScores['nous']; delta[id] = teamScores['nous'] })
    eux.forEach(id => { newScores[id] = (newScores[id] || 0) + teamScores['eux']; delta[id] = teamScores['eux'] })
    updateScores({ scores: newScores, delta, teamScores, type: 'belote' })

    // Fin à 3000 (standard) ou configurable
    const limit = game.config?.limit || 3000
    if (Object.values(newScores).some(s => s >= limit)) {
      const winner = Object.entries(newScores).sort((a, b) => b[1] - a[1])[0][0]
      onFinish(winner)
    }
  }

  const currentResult = computeBeloteScore({ contract, announcements, takerTeam, pointsTaker })

  return (
    <div className="space-y-4 pt-2">
      {/* Équipes */}
      <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">Preneur</p>
        <div className="grid grid-cols-2 gap-2">
          {TEAMS.map(t => (
            <button
              key={t}
              onClick={() => setTakerTeam(t)}
              className={`py-3 rounded-xl font-bold text-sm transition-colors ${
                takerTeam === t ? 'text-[#18181b]' : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
              style={takerTeam === t ? { backgroundColor: '#fcc817' } : {}}
            >
              {t === 'nous' ? '🤝 Nous' : '👥 Eux'}
            </button>
          ))}
        </div>
      </div>

      {/* Contrat */}
      <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">Contrat</p>
        <div className="flex flex-wrap gap-2">
          {BELOTE_CONTRACTS.map(c => (
            <button
              key={c.value}
              onClick={() => setContract(c.value)}
              className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                contract === c.value ? 'text-[#18181b]' : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
              style={contract === c.value ? { backgroundColor: '#fcc817' } : {}}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Points réalisés */}
      <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3">
          Points du preneur (/ 162)
        </p>
        <div className="flex items-center gap-3">
          <button onClick={() => setPointsTaker(v => Math.max(0, v - 1))} className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 text-lg font-bold">-</button>
          <span className="flex-1 text-center text-3xl font-black tabular-nums">{pointsTaker}</span>
          <button onClick={() => setPointsTaker(v => Math.min(162, v + 1))} className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 text-lg font-bold">+</button>
        </div>
        <input
          type="range"
          min={0} max={162}
          value={pointsTaker}
          onChange={e => setPointsTaker(Number(e.target.value))}
          className="w-full mt-3 accent-[#fcc817]"
        />
      </div>

      {/* Annonces */}
      <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">Annonces</p>
        <div className="flex items-center gap-3">
          <button onClick={() => setAnnouncements(v => Math.max(0, v - 20))} className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 text-lg font-bold">-</button>
          <span className="flex-1 text-center text-2xl font-black">{announcements}</span>
          <button onClick={() => setAnnouncements(v => v + 20)} className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 text-lg font-bold">+</button>
        </div>
      </div>

      {/* Résultat preview */}
      <div className="flex gap-3">
        {TEAMS.map(t => (
          <div key={t} className={`flex-1 p-3 rounded-xl text-center ${currentResult[t] >= 0 ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
            <p className="text-xs text-zinc-500 mb-1">{t === 'nous' ? 'Nous' : 'Eux'}</p>
            <p className={`text-xl font-black ${currentResult[t] >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {currentResult[t] >= 0 ? '+' : ''}{currentResult[t]}
            </p>
          </div>
        ))}
      </div>

      <button
        onClick={submitRound}
        className="w-full py-3.5 rounded-xl font-bold text-base text-[#18181b] transition-all active:scale-[0.98]"
        style={{ backgroundColor: '#fcc817' }}
      >
        Valider la donne
      </button>
    </div>
  )
}
