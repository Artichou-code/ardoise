import { useState } from 'react'
import { Award, Swords, X, BarChart3 } from 'lucide-react'
import { useGame } from '../context/GameContext'
import { GAME_META } from '../constants/games'
import { Avatar } from './ui/Avatar'
import { BottomSheet } from './ui/BottomSheet'

/**
 * Fiche détaillée d'un joueur affichée dans un BottomSheet
 * Utilisée à la fois dans StatsScreen et dans PlayersScreen (Carnet des joueurs)
 */
export function PlayerDetailSheet({ player, open, onClose }) {
  const { setScreen } = useGame()
  const [selectedBadgeId, setSelectedBadgeId] = useState(null)
  if (!player) return null

  const selectedBadge = player.badges?.find(b => b.id === selectedBadgeId) || null

  const gamesPlayedEntries = Object.entries(player.gameBreakdown || {}).filter(
    ([, data]) => data.played > 0
  )

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        setSelectedBadgeId(null)
        onClose()
      }}
      position="bottom"
      title={player.name}
      subtitle="Statistiques individuelles"
      headerAction={
        <button
          type="button"
          onClick={() => {
            setSelectedBadgeId(null)
            onClose()
            setScreen('stats')
          }}
          className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
          title="Statistiques"
          aria-label="Statistiques"
        >
          <BarChart3 size={18} className="text-stone-500 dark:text-slate-400" />
        </button>
      }
    >
      <div className="px-4 py-3 space-y-4">
        {/* En-tête profil */}
        <div className="flex items-center gap-3.5 p-3 rounded-2xl school-card">
          <Avatar player={player} size="lg" />
          <div className="flex-1 min-w-0">
            <h3 className="font-serif-title font-bold text-lg text-stone-900 dark:text-slate-100 truncate">
              {player.name}
            </h3>
            {player.badges && player.badges.length > 0 ? (
              <div className="mt-1 space-y-1.5">
                <div className="flex flex-wrap gap-1.5">
                  {player.badges.map(b => {
                    const isSelected = selectedBadgeId === b.id
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBadgeId(isSelected ? null : b.id)}
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all border ${
                          isSelected
                            ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 border-amber-400 dark:border-amber-600 shadow-xs scale-[1.02]'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100/70'
                        }`}
                        title="Toucher pour voir l'explication"
                      >
                        <Award size={12} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
                        <span>{b.title}</span>
                        <span
                          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                            isSelected
                              ? 'bg-amber-300 dark:bg-amber-700 text-amber-900 dark:text-white'
                              : 'bg-amber-200/80 dark:bg-amber-900/80 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          ?
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Volet explicatif de la distinction sélectionnée */}
                {selectedBadge && (
                  <div className="p-2.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/60 text-xs text-amber-950 dark:text-amber-200 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between font-bold mb-1">
                      <span className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                        <Award size={13} />
                        {selectedBadge.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedBadgeId(null)}
                        className="p-0.5 rounded hover:bg-amber-200/50 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400"
                        aria-label="Fermer"
                      >
                        <X size={13} />
                      </button>
                    </div>
                    <p className="text-[11px] leading-relaxed text-stone-600 dark:text-slate-300">
                      {selectedBadge.explanation || selectedBadge.desc}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-stone-500 dark:text-slate-400">
                {player.finishedGames ? `${player.finishedGames} partie${player.finishedGames > 1 ? 's' : ''} terminée${player.finishedGames > 1 ? 's' : ''}` : 'Aucune partie jouée'}
              </p>
            )}
          </div>
        </div>

        {/* Indicateurs clés du joueur */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl school-card text-center">
            <p className="text-[11px] font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wider">
              Taux
            </p>
            <p className="font-serif-title font-bold text-xl text-emerald-600 dark:text-emerald-400 mt-0.5">
              {player.winRate ?? 0}%
            </p>
            <p className="text-[10px] text-stone-400 dark:text-slate-500">
              de victoires
            </p>
          </div>

          <div className="p-3 rounded-xl school-card text-center">
            <p className="text-[11px] font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wider">
              Victoires
            </p>
            <p className="font-serif-title font-bold text-xl text-stone-900 dark:text-slate-100 mt-0.5">
              {player.wins ?? 0}
            </p>
            <p className="text-[10px] text-stone-400 dark:text-slate-500">
              sur {player.finishedGames ?? 0} p.
            </p>
          </div>

          <div className="p-3 rounded-xl school-card text-center">
            <p className="text-[11px] font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wider">
              Podiums
            </p>
            <p className="font-serif-title font-bold text-xl text-amber-600 dark:text-amber-400 mt-0.5">
              {player.podiums ?? 0}
            </p>
            <p className="text-[10px] text-stone-400 dark:text-slate-500">
              Top 3
            </p>
          </div>
        </div>

        {/* Adversaire favori */}
        {player.topOpponent && (
          <div className="flex items-center justify-between p-3 rounded-xl school-card text-xs">
            <div className="flex items-center gap-2 text-stone-600 dark:text-slate-400">
              <Swords size={16} className="text-stone-500 dark:text-slate-400" />
              <span>Adversaire le plus fréquent :</span>
            </div>
            <span className="font-semibold text-stone-900 dark:text-slate-100">
              {player.topOpponent.name} ({player.topOpponent.count} duels)
            </span>
          </div>
        )}

        {/* Répartition par jeu */}
        <div>
          <h4 className="font-serif-title font-bold text-sm text-stone-900 dark:text-slate-100 mb-2">
            Performance par jeu
          </h4>
          {gamesPlayedEntries.length === 0 ? (
            <p className="text-xs text-stone-400 dark:text-slate-500 italic">
              Aucune partie terminée pour ce joueur.
            </p>
          ) : (
            <div className="space-y-2">
              {gamesPlayedEntries.map(([type, data]) => {
                const meta = GAME_META[type]
                const rate = data.played > 0 ? Math.round((data.wins / data.played) * 100) : 0
                return (
                  <div
                    key={type}
                    className="p-2.5 rounded-xl border border-stone-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-800 dark:text-slate-200 truncate">
                          {meta?.name || type}
                        </span>
                        {meta?.categoryBadge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400">
                            {meta.categoryBadge}
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-stone-100 dark:bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {data.wins}V
                      </span>
                      <span className="text-stone-400 dark:text-slate-500 mx-1">/</span>
                      <span className="text-stone-600 dark:text-slate-400">
                        {data.played}P
                      </span>
                      <span className="text-[11px] text-stone-400 dark:text-slate-500 ml-1.5">
                        ({rate}%)
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Historique récent */}
        <div>
          <h4 className="font-serif-title font-bold text-sm text-stone-900 dark:text-slate-100 mb-2">
            Historique récent
          </h4>
          {player.recentHistory && player.recentHistory.length > 0 ? (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {player.recentHistory.slice(0, 8).map((hist, idx) => (
                <div
                  key={`${hist.gameId}-${idx}`}
                  className="flex items-center justify-between p-2 rounded-lg bg-stone-50 dark:bg-slate-900/40 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[11px] ${
                        hist.isWinner
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                          : hist.rank <= 3
                          ? 'bg-stone-200 dark:bg-slate-800 text-stone-700 dark:text-slate-300'
                          : 'bg-stone-100 dark:bg-slate-800/50 text-stone-500 dark:text-slate-400'
                      }`}
                    >
                      {hist.rank === 1 ? '1er' : `${hist.rank}e`}
                    </span>
                    <span className="text-stone-700 dark:text-slate-300 truncate">
                      {hist.gameName}
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-400 dark:text-slate-500 flex-shrink-0">
                    {hist.isWinner ? 'Victoire' : `${hist.rank}/${hist.totalPlayers}`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-400 dark:text-slate-500 italic">
              Aucune manche enregistrée.
            </p>
          )}
        </div>
      </div>
    </BottomSheet>
  )
}
