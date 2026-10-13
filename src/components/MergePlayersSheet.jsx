import { useState, useMemo, useEffect } from 'react'
import { GitMerge, ArrowLeftRight, Check, Search, X, Users, AlertTriangle } from 'lucide-react'
import { useGame } from '../context/GameContext'
import { BottomSheet } from './ui/BottomSheet'
import { Avatar } from './ui/Avatar'
import { computeStats, normalizePlayerName } from '../utils/statsUtils'

/**
 * Fiche modale permettant de fusionner deux profils de joueurs :
 * - Transfère l'ensemble de l'historique, scores, manches et victoires du joueur absorbé vers le joueur conservé.
 * - Supprime le profil en double / synonyme.
 * - Mémorise un alias persistant pour les futures synchronisations et tables en direct.
 */
export function MergePlayersSheet({ open, onClose, initialPlayer = null, onMerged }) {
  const { players, games, mergePlayers } = useGame()

  const [targetId, setTargetId] = useState(initialPlayer?.id || null)
  const [sourceId, setSourceId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [step, setStep] = useState('select') // 'select' | 'confirm'

  useEffect(() => {
    if (open) {
      setTargetId(initialPlayer?.id || null)
      setSourceId(null)
      setSearchQuery('')
      setStep('select')
    }
  }, [open, initialPlayer])

  const targetPlayer = useMemo(() => {
    return (players || []).find(p => p && p.id === targetId) || null
  }, [players, targetId])

  const sourcePlayer = useMemo(() => {
    return (players || []).find(p => p && p.id === sourceId) || null
  }, [players, sourceId])

  // Stats pour afficher le nombre de parties de chaque joueur
  const playerStatsMap = useMemo(() => {
    const stats = computeStats(games, 'all', players)
    const map = new Map()
    stats.playersStats.forEach(ps => {
      if (ps.id) map.set(ps.id, ps)
      map.set(normalizePlayerName(ps.name), ps)
    })
    return map
  }, [games, players])

  // Liste de tous les joueurs pour choisir la cible si non définie
  const availableTargetPlayers = useMemo(() => {
    if (!searchQuery.trim()) return players || []
    const q = searchQuery.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return (players || []).filter(p => {
      const name = (p.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      return name.includes(q)
    })
  }, [players, searchQuery])

  // Liste des joueurs disponibles pour être absorbés (tous sauf la cible)
  const availableSourcePlayers = useMemo(() => {
    const list = (players || []).filter(p => p && p.id !== targetId)
    if (!searchQuery.trim()) return list
    const q = searchQuery.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return list.filter(p => {
      const name = (p.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      return name.includes(q)
    })
  }, [players, targetId, searchQuery])

  // Inverser qui est conservé et qui est absorbé
  const handleSwap = () => {
    if (!targetId || !sourceId) return
    const oldTarget = targetId
    const oldSource = sourceId
    setTargetId(oldSource)
    setSourceId(oldTarget)
  }

  const handleConfirmMerge = () => {
    if (!targetId || !sourceId) return
    const result = mergePlayers(targetId, sourceId)
    if (result.success) {
      onMerged?.(result)
      onClose()
    }
  }

  const targetStats = targetPlayer ? (playerStatsMap.get(targetPlayer.id) || playerStatsMap.get(normalizePlayerName(targetPlayer.name))) : null
  const sourceStats = sourcePlayer ? (playerStatsMap.get(sourcePlayer.id) || playerStatsMap.get(normalizePlayerName(sourcePlayer.name))) : null

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      position="bottom"
      title="Fusionner deux joueurs"
      subtitle="Regrouper les historiques et statistiques sous un profil unique"
    >
      <div className="px-4 py-3 space-y-4 max-h-[80vh] overflow-y-auto scrollbar-hide">
        {/* En-tête visuel des deux profils */}
        <div className="p-3.5 rounded-2xl school-card space-y-3">
          <div className="flex items-center justify-between gap-2">
            {/* Profil conservé */}
            <div className="flex-1 min-w-0 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1.5">
                Profil conservé
              </span>
              {targetPlayer ? (
                <>
                  <Avatar player={targetPlayer} size="md" />
                  <span className="font-bold text-sm text-stone-900 dark:text-slate-100 truncate w-full mt-1.5">
                    {targetPlayer.name}
                  </span>
                  <span className="text-[11px] text-stone-500 dark:text-slate-400">
                    {targetStats?.finishedGames || 0} p. · {targetStats?.wins || 0} vict.
                  </span>
                </>
              ) : (
                <div className="py-3 text-xs text-stone-400 italic">
                  Aucun sélectionné
                </div>
              )}
            </div>

            {/* Bouton d'inversion si les deux sont sélectionnés */}
            {targetPlayer && sourcePlayer ? (
              <button
                type="button"
                onClick={handleSwap}
                className="p-2 rounded-full border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-stone-100 dark:hover:bg-slate-700 text-stone-600 dark:text-slate-300 transition-transform active:scale-90 cursor-pointer shadow-2xs shrink-0"
                title="Inverser les rôles (conserver l'autre joueur)"
                aria-label="Inverser"
              >
                <ArrowLeftRight size={16} />
              </button>
            ) : (
              <div className="p-2 text-stone-300 dark:text-slate-600 shrink-0">
                <GitMerge size={20} />
              </div>
            )}

            {/* Profil absorbé */}
            <div className="flex-1 min-w-0 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col items-center text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1.5">
                Profil absorbé
              </span>
              {sourcePlayer ? (
                <>
                  <Avatar player={sourcePlayer} size="md" />
                  <span className="font-bold text-sm text-stone-900 dark:text-slate-100 truncate w-full mt-1.5">
                    {sourcePlayer.name}
                  </span>
                  <span className="text-[11px] text-stone-500 dark:text-slate-400">
                    {sourceStats?.finishedGames || 0} p. · {sourceStats?.wins || 0} vict.
                  </span>
                </>
              ) : (
                <div className="py-3 text-xs text-stone-400 italic">
                  À sélectionner
                </div>
              )}
            </div>
          </div>

          {targetPlayer && sourcePlayer && (
            <button
              type="button"
              onClick={handleSwap}
              className="w-full py-1 text-center text-xs font-semibold text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-slate-200 underline decoration-dotted cursor-pointer"
            >
              Inverser : conserver « {sourcePlayer.name} » plutôt que « {targetPlayer.name} »
            </button>
          )}
        </div>

        {/* Étape 1 : Si aucun profil à conserver n'est sélectionné */}
        {!targetPlayer ? (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="font-serif-title font-bold text-sm text-stone-900 dark:text-slate-100">
                1. Choisissez le profil à conserver :
              </h4>
              <span className="text-[11px] text-stone-500 dark:text-slate-400">
                {availableTargetPlayers.length} joueur{availableTargetPlayers.length > 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-slate-400">
              Ce joueur gardera son nom, son avatar et recevra l'historique complet des parties.
            </p>

            {/* Champ de recherche si plus de 4 joueurs */}
            {(players || []).length > 4 && (
              <div className="relative flex items-center">
                <Search size={14} className="absolute left-3 text-stone-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un prénom..."
                  className="w-full pl-8 pr-8 py-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none focus:border-[#c83b3b]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 p-1 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-0.5">
              {availableTargetPlayers.map(p => {
                const stat = playerStatsMap.get(p.id) || playerStatsMap.get(normalizePlayerName(p.name))
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setTargetId(p.id)
                      setSearchQuery('')
                    }}
                    className="flex items-center gap-2.5 p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-400 dark:hover:border-emerald-500/50 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 text-left transition-all cursor-pointer group active:scale-[0.98]"
                  >
                    <Avatar player={p} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-stone-900 dark:text-slate-100 truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-stone-500 dark:text-slate-400 truncate">
                        {stat?.finishedGames || 0} partie{stat?.finishedGames > 1 ? 's' : ''}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : !sourcePlayer ? (
          /* Étape 2 : Sélection du doublon à absorber */
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="font-serif-title font-bold text-sm text-stone-900 dark:text-slate-100">
                2. Sélectionnez le doublon à absorber :
              </h4>
              <span className="text-[11px] text-stone-500 dark:text-slate-400">
                {availableSourcePlayers.length} joueur{availableSourcePlayers.length > 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-slate-400">
              Toutes les parties de ce joueur seront transférées sous le profil de <strong>{targetPlayer.name}</strong>.
            </p>

            {/* Champ de recherche si plus de 4 joueurs */}
            {(players || []).length > 4 && (
              <div className="relative flex items-center">
                <Search size={14} className="absolute left-3 text-stone-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un prénom..."
                  className="w-full pl-8 pr-8 py-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none focus:border-[#c83b3b]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 p-1 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-0.5">
              {availableSourcePlayers.map(p => {
                const stat = playerStatsMap.get(p.id) || playerStatsMap.get(normalizePlayerName(p.name))
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSourceId(p.id)
                      setSearchQuery('')
                    }}
                    className="flex items-center gap-2.5 p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-400 dark:hover:border-amber-500/50 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 text-left transition-all cursor-pointer group active:scale-[0.98]"
                  >
                    <Avatar player={p} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-stone-900 dark:text-slate-100 truncate group-hover:text-amber-700 dark:group-hover:text-amber-400">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-stone-500 dark:text-slate-400 truncate">
                        {stat?.finishedGames || 0} partie{stat?.finishedGames > 1 ? 's' : ''}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          /* Étape 3 : Confirmation détaillée et explicite */
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-stone-100/80 dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700 text-xs text-stone-700 dark:text-slate-300 space-y-2 leading-relaxed">
              <p className="font-semibold text-stone-900 dark:text-slate-100 flex items-center gap-1.5">
                <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                Conséquences de la fusion :
              </p>
              <ul className="space-y-1.5 pl-4 list-disc text-[11px]">
                <li>
                  Toutes les parties jouées sous le nom <strong>« {sourcePlayer?.name} »</strong> seront transférées à <strong>« {targetPlayer?.name} »</strong>.
                </li>
                <li>
                  Les victoires et points de <strong>« {sourcePlayer?.name} »</strong> seront cumulés dans les statistiques de <strong>« {targetPlayer?.name} »</strong>.
                </li>
                <li>
                  L'avatar et la couleur choisis pour <strong>« {targetPlayer?.name} »</strong> seront appliqués à toutes les manches.
                </li>
                <li>
                  Le profil <strong>« {sourcePlayer?.name} »</strong> sera définitivement retiré de votre carnet.
                </li>
              </ul>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSourceId(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-stone-700 dark:text-slate-300 hover:bg-stone-50 cursor-pointer"
              >
                Changer de profil absorbé
              </button>
              <button
                type="button"
                onClick={handleConfirmMerge}
                className="flex-2 py-2.5 rounded-xl font-bold text-xs text-white btn-margin-red cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
              >
                <GitMerge size={14} />
                <span>Confirmer la fusion</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  )
}
