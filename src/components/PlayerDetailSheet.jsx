import { useState } from 'react'
import { Award, Swords, X, BarChart3 } from 'lucide-react'
import { useGame } from '../context/GameContext'
import { GAME_META } from '../constants/games'
import { Avatar } from './ui/Avatar'
import { TrophyIcon } from './ui/TrophyIcon'
import { BottomSheet } from './ui/BottomSheet'

/**
 * Fiche détaillée d'un joueur affichée dans un BottomSheet
 * Utilisée à la fois dans StatsScreen et dans PlayersScreen (Carnet des joueurs)
 */
export function PlayerDetailSheet({ player, open, onClose }) {
  const { setScreen } = useGame()
  const [selectedBadgeId, setSelectedBadgeId] = useState(null)
  const [showAllBadges, setShowAllBadges] = useState(false)
  if (!player) return null

  const badges = player.badges || []
  const MAX_VISIBLE_BADGES = 4
  const visibleBadges = showAllBadges ? badges : badges.slice(0, MAX_VISIBLE_BADGES)
  const hiddenCount = Math.max(0, badges.length - MAX_VISIBLE_BADGES)
  const selectedBadge = badges.find(b => b && b.id === selectedBadgeId) || null

  const gamesPlayedEntries = Object.entries(player.gameBreakdown || {}).filter(
    ([, data]) => data && data.played > 0
  )

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        setSelectedBadgeId(null)
        setShowAllBadges(false)
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
            setShowAllBadges(false)
            onClose()
            setScreen('stats')
          }}
          className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Statistiques"
          aria-label="Statistiques"
        >
          <BarChart3 size={18} className="text-stone-500 dark:text-slate-400" />
        </button>
      }
    >
      <div className="px-4 py-3 space-y-4">
        {/* En-tête profil */}
        <div className="p-3.5 rounded-2xl school-card">
          <div className="flex items-center gap-3.5">
            <Avatar player={player} size="lg" />
            <div className="flex-1 min-w-0">
              <h3 className="font-serif-title font-bold text-lg text-stone-900 dark:text-slate-100 truncate">
                {player.name}
              </h3>
              <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                {player.finishedGames
                  ? `${player.finishedGames} partie${player.finishedGames > 1 ? 's' : ''} terminée${player.finishedGames > 1 ? 's' : ''}`
                  : 'Aucune partie jouée'}
                {badges.length > 0 && (
                  <span className="text-amber-700 dark:text-amber-400 font-semibold">
                    {` · ${badges.length} trophée${badges.length > 1 ? 's' : ''}`}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Trophées sur toute la largeur de la carte pour éviter tout souci de responsive */}
          {badges.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-slate-800/80 space-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {visibleBadges.map(b => {
                  const isSelected = selectedBadgeId === b.id
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBadgeId(isSelected ? null : b.id)}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all border focus:outline-none cursor-pointer ${
                        isSelected
                          ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/25 shadow-2xs'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60 hover:bg-amber-100/70'
                      }`}
                      title="Toucher pour voir l'explication"
                    >
                      <TrophyIcon name={b.iconName} size={12} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      <span className="truncate max-w-[160px]">{b.title}</span>
                      <span
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${
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

                {hiddenCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAllBadges(prev => !prev)}
                    className="inline-flex items-center px-2 py-1 rounded-lg text-[11px] font-bold bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors focus:outline-none cursor-pointer"
                  >
                    {showAllBadges ? 'Réduire' : `+${hiddenCount} autre${hiddenCount > 1 ? 's' : ''}`}
                  </button>
                )}
              </div>

              {/* Volet explicatif de la distinction sélectionnée (pleine largeur) */}
              {selectedBadge && (
                <div className="p-2.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/60 text-xs text-amber-950 dark:text-amber-200 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                      <TrophyIcon name={selectedBadge.iconName} size={13} />
                      {selectedBadge.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedBadgeId(null)}
                      className="p-0.5 rounded hover:bg-amber-200/50 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 focus:outline-none cursor-pointer"
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
          )}
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
                if (!data) return null
                const meta = GAME_META[type]
                const played = data.played || 0
                const wins = data.wins || 0
                const rate = played > 0 ? Math.round((wins / played) * 100) : 0
                return (
                  <div
                    key={type}
                    className="p-2.5 rounded-xl school-card flex items-center justify-between gap-3 text-xs"
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
                        {wins}V
                      </span>
                      <span className="text-stone-400 dark:text-slate-500 mx-1">/</span>
                      <span className="text-stone-600 dark:text-slate-400">
                        {played}P
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
              {player.recentHistory.filter(Boolean).slice(0, 8).map((hist, idx) => (
                <div
                  key={`${hist.gameId || idx}-${idx}`}
                  className="flex items-center justify-between p-2 rounded-lg school-card text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[11px] ${
                        hist.isWinner
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                          : (hist.rank || 99) <= 3
                          ? 'bg-stone-200 dark:bg-slate-800 text-stone-700 dark:text-slate-300'
                          : 'bg-stone-100 dark:bg-slate-800/50 text-stone-500 dark:text-slate-400'
                      }`}
                    >
                      {hist.rank === 1 ? '1er' : `${hist.rank || '-'}e`}
                    </span>
                    <span className="text-stone-700 dark:text-slate-300 truncate">
                      {hist.gameName || 'Partie'}
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-400 dark:text-slate-500 flex-shrink-0">
                    {hist.isWinner ? 'Victoire' : `${hist.rank || '?'}/${hist.totalPlayers || '?'}`}
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
