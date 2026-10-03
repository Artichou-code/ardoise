import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Trophy, Heart } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { Avatar } from '../ui/Avatar'
import { QuickScoreBadge } from '../ui/QuickScoreBadge'
import { BottomSheet } from '../ui/BottomSheet'
import { ScorePad } from '../ui/ScorePad'

export function DameDePiqueEngine({ game, onFinish }) {
  const { updateScores } = useGame()
  const LIMIT = game.config?.limit || 100

  // État local de la manche
  const [playerHearts, setPlayerHearts] = useState(() => {
    const initial = {}
    for (const p of game.players) {
      initial[p.id] = (game.restoredDelta && game.restoredDelta[p.id] != null)
        ? Math.max(0, game.restoredDelta[p.id] % 13)
        : 0
    }
    return initial
  })

  const [queenOwnerId, setQueenOwnerId] = useState(() => {
    if (game.restoredRound?.queenOwnerId) return game.restoredRound.queenOwnerId
    if (game.restoredDelta) {
      for (const p of game.players) {
        if (game.restoredDelta[p.id] >= 13) return p.id
      }
    }
    return null
  })

  const [chelemWinnerId, setChelemWinnerId] = useState(() => {
    return game.restoredRound?.chelemWinnerId || null
  })

  const [editingPlayer, setEditingPlayer] = useState(null)
  const [open, setOpen] = useState(false)

  // Calcul des points de la manche pour un joueur donné
  const computeRoundDelta = (playerId) => {
    if (chelemWinnerId) {
      // Grand Chelem : le réalisateur prend 0, tous les autres prennent 26
      return chelemWinnerId === playerId ? 0 : 26
    }
    const hearts = playerHearts[playerId] || 0
    const hasQueen = queenOwnerId === playerId
    return hearts + (hasQueen ? 13 : 0)
  }

  // Somme totale des pénalités allouées dans la manche (hors chelem)
  const totalHeartsAllocated = Object.values(playerHearts).reduce((a, b) => a + b, 0)
  const totalAllocated = totalHeartsAllocated + (queenOwnerId ? 13 : 0)
  const isNormalRoundComplete = totalAllocated === 26 && queenOwnerId !== null && totalHeartsAllocated === 13

  const submitRound = () => {
    const newScores = {}
    const delta = {}

    for (const p of game.players) {
      const d = computeRoundDelta(p.id)
      delta[p.id] = d
      newScores[p.id] = (game.scores[p.id] || 0) + d
    }

    updateScores({
      scores: newScores,
      delta,
      queenOwnerId,
      chelemWinnerId,
      type: 'dame_de_pique',
    })

    // Réinitialisation
    setPlayerHearts(Object.fromEntries(game.players.map(p => [p.id, 0])))
    setQueenOwnerId(null)
    setChelemWinnerId(null)

    // Vérification de fin de partie : au moins un joueur atteint ou dépasse le seuil
    const overLimit = Object.entries(newScores).filter(([, s]) => s >= LIMIT)
    if (overLimit.length > 0) {
      const winner = Object.entries(newScores).sort((a, b) => a[1] - b[1])[0][0]
      onFinish(winner)
    }
  }

  const toggleQueen = (playerId) => {
    if (chelemWinnerId) setChelemWinnerId(null)
    setQueenOwnerId(prev => (prev === playerId ? null : playerId))
  }

  const toggleChelem = (playerId) => {
    setChelemWinnerId(prev => {
      if (prev === playerId) {
        return null
      }
      setQueenOwnerId(playerId)
      setPlayerHearts(Object.fromEntries(game.players.map(p => [p.id, p.id === playerId ? 13 : 0])))
      return playerId
    })
  }

  return (
    <div className="space-y-2 pt-0">
      {/* Carte d'information et statut de manche */}
      <div className="school-card rounded-xl p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
            Saisie de la manche
          </p>
          <span className="text-[11px] font-semibold text-stone-400 dark:text-slate-500">
            Seuil d'arrêt : {LIMIT} pts
          </span>
        </div>

        {/* Indicateur de vérification des 26 points */}
        <div className={`p-2 rounded-xl border text-xs font-medium flex items-center justify-between ${
          chelemWinnerId
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200'
            : isNormalRoundComplete
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-200'
            : 'bg-stone-50 dark:bg-slate-800/60 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-400'
        }`}>
          <div className="flex items-center gap-1.5 truncate">
            {chelemWinnerId ? (
              <>
                <Trophy size={14} className="text-amber-600 shrink-0" />
                <span className="font-bold">Grand Chelem actif (+26 pts aux rivaux)</span>
              </>
            ) : isNormalRoundComplete ? (
              <>
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span>Manche complète : 26/26 pts alloués (13 Cœurs + Q♠)</span>
              </>
            ) : (
              <span>Attribué : {totalAllocated}/26 pts ({totalHeartsAllocated}/13 Cœurs{queenOwnerId ? ' + Q♠' : ''})</span>
            )}
          </div>
          <span className="font-bold text-[11px] ml-2 shrink-0">
            {chelemWinnerId ? 'Chelem' : `${totalAllocated} pts`}
          </span>
        </div>

        {/* Liste des joueurs */}
        <div className="space-y-1.5 mt-2.5">
          {game.players.map(p => {
            const currentTotal = game.scores[p.id] || 0
            const roundDelta = computeRoundDelta(p.id)
            const projected = currentTotal + roundDelta
            const danger = currentTotal >= LIMIT - 20
            const isQueen = queenOwnerId === p.id
            const isChelem = chelemWinnerId === p.id
            const hearts = playerHearts[p.id] || 0

            return (
              <div
                key={p.id}
                className={`px-3 py-2 rounded-xl border transition-all ${
                  isChelem
                    ? 'border-amber-400/80 bg-amber-50/40 dark:bg-amber-950/20'
                    : isQueen
                    ? 'border-[#c83b3b]/60 bg-[#c83b3b]/5'
                    : 'school-subtle hover:border-stone-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  {/* Info joueur (clic pour ouvrir le pavé numérique) */}
                  <button
                    type="button"
                    onClick={() => { setEditingPlayer(p); setOpen(true) }}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer select-none"
                  >
                    <Avatar player={p} size="xs" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm truncate">{p.name}</span>
                        {danger && <AlertTriangle size={13} className="text-[#c83b3b] shrink-0" />}
                      </div>
                      <span className="text-[11px] text-stone-500 dark:text-slate-400 block truncate">
                        Score : {currentTotal} pts {roundDelta > 0 && <span className="text-[#c83b3b] font-bold">(+{roundDelta} = {projected})</span>}
                      </span>
                    </div>
                  </button>

                  {/* Actions pénalités compactes sur une seule ligne */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Bouton Dame de Pique (+13) */}
                    <button
                      type="button"
                      onClick={() => toggleQueen(p.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer select-none ${
                        isQueen
                          ? 'border-[#c83b3b] bg-[#c83b3b] text-white shadow-2xs'
                          : 'school-subtle text-stone-600 dark:text-slate-400 hover:border-[#c83b3b]/60 hover:text-[#c83b3b]'
                      }`}
                      title={isQueen ? "Retirer la Dame de Pique" : "Prendre la Dame de Pique (+13 pts)"}
                    >
                      <span className="text-sm leading-none">♠</span>
                      <span>Dame</span>
                    </button>

                    {/* Sélecteur de Cœurs avec roulette rapide */}
                    <QuickScoreBadge
                      value={hearts}
                      onChange={v => {
                        const val = Math.max(0, Math.min(13, v))
                        setPlayerHearts(prev => ({ ...prev, [p.id]: val }))
                      }}
                      onOpenPad={() => { setEditingPlayer(p); setOpen(true) }}
                      min={0}
                      max={13}
                      showPlus={false}
                      formatDisplay={(v) => `${v} ♥`}
                      formatBubble={(v) => {
                        const d = v + (isQueen ? 13 : 0)
                        return { text: `+${d} pts (total ${currentTotal + d})`, variant: d > 10 ? 'danger' : 'default' }
                      }}
                    />

                    {/* Bouton Grand Chelem */}
                    <button
                      type="button"
                      onClick={() => toggleChelem(p.id)}
                      className={`px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border cursor-pointer select-none ${
                        isChelem
                          ? 'border-amber-600 bg-amber-600 text-white shadow-2xs'
                          : 'school-subtle text-stone-500 dark:text-slate-400 hover:border-amber-400 hover:text-amber-600'
                      }`}
                      title="Grand Chelem (tous les Cœurs + Dame de Pique)"
                    >
                      Chelem
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bouton Valider la manche */}
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

      {/* BottomSheet de saisie précise de Cœurs */}
      <BottomSheet open={open} onClose={() => setOpen(false)}>
        {editingPlayer && (
          <div className="p-4">
            <h3 className="font-serif-title font-bold text-lg mb-1">
              Cœurs ramassés par {editingPlayer.name}
            </h3>
            <p className="text-xs text-stone-500 dark:text-slate-400 mb-4">
              Indiquez le nombre de Cœurs encaissés lors de cette manche (de 0 à 13).
            </p>
            <ScorePad
              value={playerHearts[editingPlayer.id] || 0}
              onChange={v => setPlayerHearts(prev => ({ ...prev, [editingPlayer.id]: Math.max(0, Math.min(13, v)) }))}
              onConfirm={() => setOpen(false)}
              min={0}
              max={13}
              step={1}
              label="Nombre de Cœurs"
              showPlus={false}
              customButtons={[
                { label: '0', value: 0 },
                { label: '1', value: 1 },
                { label: '2', value: 2 },
                { label: '3', value: 3 },
                { label: '4', value: 4 },
                { label: '5', value: 5 },
                { label: '8', value: 8 },
                { label: '13 (Tous)', value: 13 },
              ]}
            />
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
