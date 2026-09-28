import { Award, Swords } from 'lucide-react'
import { GAME_META } from '../constants/games'
import { Avatar } from './ui/Avatar'
import { BottomSheet } from './ui/BottomSheet'

/**
 * Fiche détaillée d'un joueur affichée dans un BottomSheet
 * Utilisée à la fois dans StatsScreen et dans PlayersScreen (Carnet des joueurs)
 */
export function PlayerDetailSheet({ player, open, onClose }) {
  if (!player) return null

  const gamesPlayedEntries = Object.entries(player.gameBreakdown || {}).filter(
    ([, data]) => data.played > 0
  )

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      position="bottom"
      title={player.name}
      subtitle="Statistiques individuelles"
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
              <div className="flex flex-wrap gap-1.5 mt-1">
                {player.badges.map(b => (
                  <span
                    key={b.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60"
                  >
                    <Award size={12} />
                    {b.title}
                  </span>
                ))}
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
