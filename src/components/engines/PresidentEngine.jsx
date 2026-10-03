import { useState } from 'react'
import { useGame } from '../../context/GameContext'
import { computePresidentScores, getPresidentRole } from '../../engines/gameEngines'
import { Avatar } from '../ui/Avatar'
import { PresidentReorderList } from './PresidentReorderList'
import { RotateCcw, ArrowLeftRight } from 'lucide-react'

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

  // Données des échanges de cartes pour la manche en cours basés sur la manche précédente
  const lastOrder = lastRound?.order || []
  const prevPresPlayer = lastOrder.length > 0 ? game.players.find(p => p.id === lastOrder[0]) : null
  const prevTrouPlayer = lastOrder.length > 0 ? game.players.find(p => p.id === lastOrder[totalPlayers - 1]) : null
  const prevVicePresPlayer = totalPlayers >= 4 && lastOrder.length >= 4 ? game.players.find(p => p.id === lastOrder[1]) : null
  const prevViceTrouPlayer = totalPlayers >= 4 && lastOrder.length >= 4 ? game.players.find(p => p.id === lastOrder[totalPlayers - 2]) : null
  const prevNeutrals = totalPlayers >= 4 && lastOrder.length > 4
    ? lastOrder.slice(2, totalPlayers - 2).map(id => game.players.find(p => p.id === id)).filter(Boolean)
    : totalPlayers === 3 && lastOrder.length === 3
    ? [game.players.find(p => p.id === lastOrder[1])].filter(Boolean)
    : []

  return (
    <div className="space-y-4 pt-2">
      {/* Échanges de cartes de début de manche (2 colonnes & flèches directionnelles) */}
      {lastRound && prevPresPlayer && prevTrouPlayer && (
        <div className="school-card rounded-xl p-2.5 sm:p-3 space-y-2">
          {/* En-tête court et compact */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
              <ArrowLeftRight size={12} className="text-[#c83b3b] shrink-0" />
              <span className="truncate">Échanges de cartes</span>
            </p>
            <span className="text-[11px] font-semibold text-stone-500 dark:text-slate-400 shrink-0 whitespace-nowrap">
              Manche {game.rounds.length + 1}
            </span>
          </div>

          <div className="space-y-1.5">
            {/* Grand échange : Président ⇄ Trou du cul (2 cartes) */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-stone-50/70 dark:bg-slate-800/40 border border-stone-200/70 dark:border-slate-800">
              <div className="flex items-center justify-between gap-2">
                {/* Colonne Gauche : Président */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Avatar player={prevPresPlayer} size="xs" crown={true} leader={true} leaderColor="#10b981" />
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-xs truncate block text-stone-900 dark:text-slate-100 leading-none">
                      {prevPresPlayer.name}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block truncate leading-tight mt-0.5">
                      Président
                    </span>
                  </div>
                </div>

                {/* Badge central compact avec flèche */}
                <div
                  className="flex items-center justify-center shrink-0 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-stone-200/90 dark:border-slate-700 shadow-2xs"
                  title="Le Trou donne ses 2 meilleures cartes au Président ; le Président donne 2 cartes au choix au Trou"
                >
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#c83b3b]">
                    <ArrowLeftRight size={11} strokeWidth={2.5} />
                    <span className="whitespace-nowrap">2 cartes</span>
                  </span>
                </div>

                {/* Colonne Droite : Trou du cul */}
                <div className="flex items-center justify-end gap-2 min-w-0 flex-1 text-right">
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-xs truncate block text-stone-900 dark:text-slate-100 leading-none">
                      {prevTrouPlayer.name}
                    </span>
                    <span className="text-[11px] font-bold text-[#c83b3b] dark:text-red-400 block truncate leading-tight mt-0.5">
                      Trou du cul
                    </span>
                  </div>
                  <Avatar player={prevTrouPlayer} size="xs" />
                </div>
              </div>

              {/* Ligne des règles d'échange en dessous */}
              <div className="flex items-center justify-between text-[9px] text-stone-500 dark:text-slate-400 pt-1 mt-1 border-t border-stone-200/50 dark:border-slate-800/60">
                <span className="truncate">donne 2 cartes au choix ➔</span>
                <span className="truncate text-right text-[#c83b3b] dark:text-red-400 font-medium">← donne ses 2 meilleures</span>
              </div>
            </div>

            {/* Petit échange : Vice-Président ⇄ Vice-Trou (1 carte) */}
            {prevVicePresPlayer && prevViceTrouPlayer && (
              <div className="p-2 sm:p-2.5 rounded-xl bg-stone-50/70 dark:bg-slate-800/40 border border-stone-200/70 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2">
                  {/* Colonne Gauche : Vice-Président */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Avatar player={prevVicePresPlayer} size="xs" />
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-xs truncate block text-stone-900 dark:text-slate-100 leading-none">
                        {prevVicePresPlayer.name}
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block truncate leading-tight mt-0.5">
                        Vice-Président
                      </span>
                    </div>
                  </div>

                  {/* Badge central compact avec flèche */}
                  <div
                    className="flex items-center justify-center shrink-0 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-stone-200/90 dark:border-slate-700 shadow-2xs"
                    title="Le Vice-Trou donne sa meilleure carte au Vice-Président ; le Vice-Président donne 1 carte au choix au Vice-Trou"
                  >
                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#c83b3b]">
                      <ArrowLeftRight size={11} strokeWidth={2.5} />
                      <span className="whitespace-nowrap">1 carte</span>
                    </span>
                  </div>

                  {/* Colonne Droite : Vice-Trou */}
                  <div className="flex items-center justify-end gap-2 min-w-0 flex-1 text-right">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-xs truncate block text-stone-900 dark:text-slate-100 leading-none">
                        {prevViceTrouPlayer.name}
                      </span>
                      <span className="text-[11px] font-semibold text-[#c83b3b]/90 dark:text-red-400 block truncate leading-tight mt-0.5">
                        Vice-Trou
                      </span>
                    </div>
                    <Avatar player={prevViceTrouPlayer} size="xs" />
                  </div>
                </div>

                {/* Ligne des règles d'échange en dessous */}
                <div className="flex items-center justify-between text-[9px] text-stone-500 dark:text-slate-400 pt-1 mt-1 border-t border-stone-200/50 dark:border-slate-800/60">
                  <span className="truncate">donne 1 carte au choix ➔</span>
                  <span className="truncate text-right text-[#c83b3b] dark:text-red-400 font-medium">← donne sa meilleure</span>
                </div>
              </div>
            )}

            {/* Joueurs Neutres (aucun échange) */}
            {prevNeutrals.length > 0 && (
              <div className="flex items-center justify-center gap-2 py-1 text-[11px] text-stone-500 dark:text-slate-400">
                <span className="font-semibold text-stone-700 dark:text-slate-300 truncate">
                  {prevNeutrals.map(p => p.name).join(', ')}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-100 dark:bg-slate-800 text-stone-500 shrink-0">
                  Neutre{prevNeutrals.length > 1 ? 's' : ''} · Aucun échange
                </span>
              </div>
            )}
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

