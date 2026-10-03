import { useState } from 'react'
import { Anchor, Sparkles, Trophy, AlertCircle, Waves } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { Avatar } from '../ui/Avatar'
import { QuickScoreBadge } from '../ui/QuickScoreBadge'
import { BottomSheet } from '../ui/BottomSheet'
import { ScorePad } from '../ui/ScorePad'

export function SeaSaltPaperEngine({ game, onFinish }) {
  const { updateScores } = useGame()

  // Seuil automatique officiel selon le nombre de joueurs
  const defaultLimit = game.players.length === 2 ? 40 : game.players.length === 3 ? 35 : 30
  const TARGET_SCORE = game.config?.limit || defaultLimit

  const [roundScores, setRoundScores] = useState(() => {
    const initial = {}
    for (const p of game.players) {
      initial[p.id] = (game.restoredDelta && game.restoredDelta[p.id] != null)
        ? game.restoredDelta[p.id]
        : 0
    }
    return initial
  })

  // Mode de clôture : 'stop' | 'last_chance_won' | 'last_chance_lost' | 'free'
  const [closingMode, setClosingMode] = useState(() => {
    return game.restoredRound?.closingMode || 'stop'
  })

  // Qui a annoncé la fin de manche ?
  const [announcerId, setAnnouncerId] = useState(() => {
    return game.restoredRound?.announcerId || game.players[0]?.id || null
  })

  const [editingPlayer, setEditingPlayer] = useState(null)
  const [open, setOpen] = useState(false)

  // Victoire immédiate des 4 sirènes
  const handleFourSirensVictory = (playerId) => {
    const newScores = { ...game.scores, [playerId]: (game.scores[playerId] || 0) + 100 }
    updateScores({
      scores: newScores,
      delta: { [playerId]: 100 },
      specialWin: 'four_sirens',
      winnerId: playerId,
      type: 'sea_salt_paper',
    })
    onFinish(playerId)
  }

  const submitRound = () => {
    const newScores = {}
    const delta = {}

    for (const p of game.players) {
      const pts = roundScores[p.id] || 0
      delta[p.id] = pts
      newScores[p.id] = (game.scores[p.id] || 0) + pts
    }

    updateScores({
      scores: newScores,
      delta,
      closingMode,
      announcerId,
      type: 'sea_salt_paper',
    })

    setRoundScores(Object.fromEntries(game.players.map(p => [p.id, 0])))

    // Vérification de victoire par seuil
    const winners = Object.entries(newScores).filter(([, s]) => s >= TARGET_SCORE)
    if (winners.length > 0) {
      const winner = Object.entries(newScores).sort((a, b) => b[1] - a[1])[0][0]
      onFinish(winner)
    }
  }

  return (
    <div className="space-y-2 pt-0">
      {/* Sélecteur de clôture de manche */}
      <div className="school-card rounded-xl p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 flex items-center gap-1.5">
            <Waves size={14} className="text-sky-600 dark:text-sky-400" />
            Fin de manche (≥ 7 pts)
          </p>
          <span className="text-[11px] font-semibold text-stone-400 dark:text-slate-500">
            Objectif : {TARGET_SCORE} pts ({game.players.length} joueurs)
          </span>
        </div>

        {/* Choix du mode d'annonce */}
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          {[
            { id: 'stop', label: 'STOP', desc: 'Comptage normal' },
            { id: 'last_chance_won', label: 'Dernière Chance réussie', desc: 'Auteur > Rivaux' },
            { id: 'last_chance_lost', label: 'Dernière Chance ratée', desc: 'Auteur contré' },
          ].map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => setClosingMode(m.id)}
              className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                closingMode === m.id
                  ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 text-sky-950 dark:text-sky-200 ring-1 ring-sky-400/40'
                  : 'bg-stone-50 dark:bg-slate-800/60 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-400 hover:border-sky-300'
              }`}
            >
              <span className="block text-xs font-bold leading-tight">{m.label}</span>
              <span className="block text-[10px] text-stone-400 dark:text-slate-500 mt-0.5 truncate">{m.desc}</span>
            </button>
          ))}
        </div>

        {/* Si Dernière chance : sélection du joueur qui a annoncé */}
        {closingMode !== 'stop' && (
          <div className="p-2 rounded-xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/50 mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-sky-900 dark:text-sky-300">
              Annonceur de la Dernière Chance :
            </span>
            <div className="flex gap-1.5 overflow-x-auto py-0.5">
              {game.players.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setAnnouncerId(p.id)}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    announcerId === p.id
                      ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                      : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-400'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Saisie des points par joueur */}
        <div className="space-y-1.5">
          {game.players.map(p => {
            const currentTotal = game.scores[p.id] || 0
            const roundPts = roundScores[p.id] || 0
            const projected = currentTotal + roundPts
            const isNearWin = projected >= TARGET_SCORE
            const isAnnouncer = announcerId === p.id && closingMode !== 'stop'

            return (
              <div
                key={p.id}
                className={`px-3 py-2 rounded-xl border transition-all ${
                  isNearWin
                    ? 'border-emerald-400 bg-emerald-500/5'
                    : isAnnouncer
                    ? 'border-sky-300 dark:border-sky-800 bg-sky-500/5'
                    : 'school-subtle hover:border-stone-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => { setEditingPlayer(p); setOpen(true) }}
                    className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer select-none"
                  >
                    <Avatar player={p} size="xs" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm truncate">{p.name}</span>
                        {isAnnouncer && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300">
                            Annonceur
                          </span>
                        )}
                        {isNearWin && <Trophy size={13} className="text-emerald-600 shrink-0" />}
                      </div>
                      <span className="text-[11px] text-stone-500 dark:text-slate-400 block">
                        Total : {currentTotal} pts {roundPts > 0 && <span className="text-sky-600 dark:text-sky-400 font-bold">(+{roundPts} = {projected})</span>}
                      </span>
                    </div>
                  </button>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Bouton 4 Sirènes (victoire instantanée rare) */}
                    <button
                      type="button"
                      onClick={() => handleFourSirensVictory(p.id)}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 transition-colors cursor-pointer"
                      title="Déclarer une victoire instantanée avec les 4 Sirènes"
                    >
                      🧜 4 Sirènes
                    </button>

                    <QuickScoreBadge
                      value={roundPts}
                      onChange={v => setRoundScores(prev => ({ ...prev, [p.id]: Math.max(0, v) }))}
                      onOpenPad={() => { setEditingPlayer(p); setOpen(true) }}
                      min={0}
                      step={1}
                      showPlus={true}
                      formatBubble={(v) => {
                        const proj = currentTotal + v
                        if (proj >= TARGET_SCORE) {
                          return { text: `🏆 ${proj} pts (Gagné !)`, variant: 'success' }
                        }
                        return { text: `= ${proj} pts`, variant: 'default' }
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-2.5 pt-2 border-t border-stone-200/80 dark:border-slate-800">
          <button
            type="button"
            onClick={submitRound}
            className="w-full py-2.5 rounded-xl bg-[#c83b3b] hover:bg-[#b03030] text-white font-bold text-sm shadow-sm transition-all active:scale-[0.99] cursor-pointer"
          >
            Valider la manche
          </button>
        </div>
      </div>

      {/* BottomSheet saisie de score */}
      <BottomSheet open={open} onClose={() => setOpen(false)}>
        {editingPlayer && (
          <div className="p-4">
            <h3 className="font-serif-title font-bold text-lg mb-1">
              Points de {editingPlayer.name}
            </h3>
            <p className="text-xs text-stone-500 dark:text-slate-400 mb-4">
              Indiquez les points marqués lors de cette manche (cartes + bonus couleur).
            </p>
            <ScorePad
              value={roundScores[editingPlayer.id] || 0}
              onChange={v => setRoundScores(prev => ({ ...prev, [editingPlayer.id]: Math.max(0, v) }))}
              onConfirm={() => setOpen(false)}
              min={0}
              step={1}
              label="Points de la manche"
              showPlus={true}
              customButtons={[
                { label: '0 pt', value: 0 },
                { label: '+7 pts (Seuil)', value: 7 },
                { label: '+8 pts', value: 8 },
                { label: '+9 pts', value: 9 },
                { label: '+10 pts', value: 10 },
                { label: '+11 pts', value: 11 },
                { label: '+12 pts', value: 12 },
                { label: '+15 pts', value: 15 },
              ]}
            />
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
