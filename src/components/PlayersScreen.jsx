import { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, Plus, Pencil, Trash2, Users, Award, Search, X, Archive, ArchiveRestore } from 'lucide-react'
import { useGame } from '../context/GameContext'
import { Avatar, AvatarPicker } from './ui/Avatar'
import { BottomSheet } from './ui/BottomSheet'
import { ConfirmDialog } from './ui/Dialog'
import { PlayerDetailSheet } from './PlayerDetailSheet'
import { BurgerMenuButton } from './BurgerMenu'
import { createPlayer, getPlayerAvatarUrl } from '../utils/gameUtils'
import { computeStats, normalizePlayerName } from '../utils/statsUtils'
import { AVATAR_COLORS, PRESET_AVATARS } from '../constants/games'

function PlayerSheet({ open, onClose, initial, onSave }) {
  const [name, setName] = useState(initial?.name || '')
  const [color, setColor] = useState(initial?.color || AVATAR_COLORS[0])
  const [avatar, setAvatar] = useState(
    initial ? getPlayerAvatarUrl(initial) : PRESET_AVATARS[0]
  )

  useEffect(() => {
    setName(initial?.name || '')
    setColor(initial?.color || AVATAR_COLORS[0])
    setAvatar(
      initial
        ? getPlayerAvatarUrl(initial)
        : PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)]
    )
  }, [initial, open])

  const handleSave = () => {
    if (!name.trim()) return
    onSave(
      initial
        ? { ...initial, name: name.trim(), color, avatar }
        : createPlayer(name, color, avatar)
    )
    onClose()
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      position="top"
      title={initial ? 'Modifier le joueur' : 'Nouveau joueur'}
    >
      <div className="px-4 py-3 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar player={{ name: name || 'A', color, avatar }} size="md" />
          <input
            type="text"
            placeholder="Prénom du joueur"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-stone-900 dark:text-slate-100 placeholder-stone-400 focus:outline-none focus:border-[#c83b3b]"
            autoFocus
            maxLength={20}
          />
        </div>

        <AvatarPicker
          selectedAvatar={avatar}
          onSelectAvatar={setAvatar}
          selectedColor={color}
          onSelectColor={setColor}
        />

        <button
          type="button"
          onClick={handleSave}
          disabled={!name.trim()}
          className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-40 btn-margin-red"
        >
          {initial ? 'Enregistrer' : 'Ajouter'}
        </button>
      </div>
    </BottomSheet>
  )
}

export function PlayersScreen() {
  const { players, savePlayer, removePlayer, archivePlayer, unarchivePlayer, setScreen, games } = useGame()
  const [showCreate, setShowCreate] = useState(false)
  const [editPlayer, setEditPlayer] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [detailPlayer, setDetailPlayer] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const activePlayers = useMemo(() => {
    return (players || []).filter(p => !p.archived)
  }, [players])

  const archivedPlayers = useMemo(() => {
    return (players || []).filter(p => Boolean(p.archived))
  }, [players])

  // Réinitialiser la recherche si le nombre de joueurs repasse <= 8
  useEffect(() => {
    if (activePlayers.length <= 8 && searchQuery) {
      setSearchQuery('')
    }
  }, [activePlayers.length, searchQuery])

  // Statistiques calculées pour afficher badges et fiches
  const playerStatsMap = useMemo(() => {
    const stats = computeStats(games, 'all', players)
    const map = new Map()
    stats.playersStats.forEach(ps => {
      if (ps.id) map.set(ps.id, ps)
      map.set(normalizePlayerName(ps.name), ps)
    })
    return map
  }, [games, players])

  // Tri alphabétique strict A-Z (insensible à la casse et aux accents)
  const sortedActivePlayers = useMemo(() => {
    return [...activePlayers].sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', 'fr', { sensitivity: 'base' })
    )
  }, [activePlayers])

  const sortedArchivedPlayers = useMemo(() => {
    return [...archivedPlayers].sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', 'fr', { sensitivity: 'base' })
    )
  }, [archivedPlayers])

  // Filtrage par recherche (insensible casse et accents)
  const filterList = (list) => {
    if (!searchQuery.trim() || activePlayers.length <= 8) return list
    const query = searchQuery
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
    return list.filter(p => {
      const name = (p.name || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
      return name.includes(query)
    })
  }

  const filteredPlayers = useMemo(() => filterList(sortedActivePlayers), [sortedActivePlayers, searchQuery, activePlayers.length])
  const filteredArchivedPlayers = useMemo(() => filterList(sortedArchivedPlayers), [sortedArchivedPlayers, searchQuery, activePlayers.length])

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden school-surface select-none">
      <header className="flex items-center gap-2 px-4 header-safe pb-3 flex-shrink-0 border-b border-stone-200/90 dark:border-slate-800/90 bg-[#faf9f5]/90 dark:bg-[#151719]/90 backdrop-blur-xs">
        <button
          type="button"
          onClick={() => setScreen('home')}
          className="p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Retour"
        >
          <ArrowLeft size={18} className="text-stone-700 dark:text-slate-300" />
        </button>
        <h1 className="flex-1 font-serif-title font-bold text-lg truncate">
          Joueurs
        </h1>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs btn-margin-red cursor-pointer"
        >
          <Plus size={15} /> Ajouter
        </button>
        <BurgerMenuButton />
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-3 scroll-bottom-space">
        {/* Barre de recherche uniquement si plus de 8 joueurs enregistrés */}
        {players.length > 8 && (
          <div className="mb-3">
            <div className="relative flex items-center">
              <Search
                size={16}
                className="absolute left-3.5 text-stone-400 dark:text-slate-500 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher un joueur..."
                className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-stone-900 dark:text-slate-100 placeholder-stone-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#c83b3b] focus:ring-1 focus:ring-[#c83b3b]/30 shadow-2xs transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Effacer la recherche"
                >
                  <X size={15} />
                </button>
              )}
            </div>
            {searchQuery.trim() && (
              <div className="flex items-center justify-between px-1 mt-1.5 text-[11px] font-semibold text-stone-500 dark:text-slate-400">
                <span>
                  {filteredPlayers.length} résultat{filteredPlayers.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        )}

        {activePlayers.length === 0 && archivedPlayers.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
            <div className="w-12 h-12 rounded-2xl school-card flex items-center justify-center mb-3">
              <Users size={22} className="text-stone-400 dark:text-slate-500" />
            </div>
            <p className="font-serif-title font-bold text-base mb-1">
              Aucun joueur enregistré
            </p>
            <p className="text-stone-500 dark:text-slate-400 text-xs mb-5">
              Enregistrez vos partenaires habituels pour lancer vos parties en deux clics.
            </p>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="px-5 py-3 rounded-xl font-bold text-sm btn-margin-red cursor-pointer"
            >
              Ajouter un premier joueur
            </button>
          </div>
        ) : filteredPlayers.length === 0 && (!searchQuery || filteredArchivedPlayers.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-12 h-12 rounded-2xl school-card flex items-center justify-center mb-3">
              <Search size={22} className="text-stone-400 dark:text-slate-500" />
            </div>
            <p className="font-serif-title font-bold text-base mb-1">
              Aucun résultat
            </p>
            <p className="text-stone-500 dark:text-slate-400 text-xs mb-4">
              Aucun joueur ne correspond à « {searchQuery.trim()} »
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-stone-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Effacer la recherche
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPlayers.length > 0 && (
              <div className="grid grid-cols-1 gap-2.5">
                {filteredPlayers.map(p => {
                  const pStat = playerStatsMap.get(p.id) || playerStatsMap.get(normalizePlayerName(p.name))
                  const fullPlayerData = pStat || {
                    ...p,
                    totalGames: 0,
                    finishedGames: 0,
                    wins: 0,
                    podiums: 0,
                    winRate: 0,
                    badges: [],
                    gameBreakdown: {},
                    recentHistory: [],
                    topOpponent: null,
                  }

                  return (
                    <div
                      key={p.id}
                      onClick={() => setDetailPlayer(fullPlayerData)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl school-card cursor-pointer active:scale-[0.99] transition-all hover:border-stone-300 dark:hover:border-slate-700"
                    >
                      <Avatar player={p} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{p.name}</p>
                        {pStat?.badges && pStat.badges.length > 0 ? (
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-200/80 dark:border-amber-800/60 truncate">
                              <Award size={10} className="flex-shrink-0" />
                              <span className="truncate">{pStat.badges[0].title}</span>
                            </span>
                          </div>
                        ) : pStat?.totalGames > 0 ? (
                          <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5 truncate">
                            {pStat.wins} vict. · {pStat.winRate}% ({pStat.finishedGames} p.)
                          </p>
                        ) : (
                          <p className="text-[11px] text-stone-400 dark:text-slate-500 mt-0.5">
                            Nouvelle recrue
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditPlayer(p)
                        }}
                        className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
                        aria-label={`Modifier ${p.name}`}
                        title={`Modifier ${p.name}`}
                      >
                        <Pencil size={15} className="text-stone-500 dark:text-slate-400" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          archivePlayer(p.id)
                        }}
                        className="p-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30 text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
                        aria-label={`Archiver ${p.name}`}
                        title={`Archiver ${p.name}`}
                      >
                        <Archive size={15} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Section Joueurs Archivés */}
            {archivedPlayers.length > 0 && (
              <div className="pt-3 border-t border-stone-200/90 dark:border-slate-800/90 pb-4">
                <button
                  type="button"
                  onClick={() => setShowArchived(prev => !prev)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-stone-100/70 dark:bg-slate-800/40 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-600 dark:text-slate-400 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    <Archive size={15} className="text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-bold font-serif-title">
                      Joueurs archivés ({archivedPlayers.length})
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-stone-400 dark:text-slate-500">
                    {showArchived ? 'Masquer' : 'Afficher'}
                  </span>
                </button>

                {showArchived && (
                  <div className="mt-2.5 space-y-2">
                    <p className="text-[11px] text-stone-500 dark:text-slate-400 px-1 leading-relaxed">
                      Ces joueurs ne sont plus proposés lors de la création d'une nouvelle partie. Leurs scores et statistiques restent intacts.
                    </p>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      {filteredArchivedPlayers.map(p => {
                        const pStat = playerStatsMap.get(p.id) || playerStatsMap.get(normalizePlayerName(p.name))
                        const fullPlayerData = pStat || {
                          ...p,
                          totalGames: 0,
                          finishedGames: 0,
                          wins: 0,
                          podiums: 0,
                          winRate: 0,
                          badges: [],
                          gameBreakdown: {},
                          recentHistory: [],
                          topOpponent: null,
                        }

                        return (
                          <div
                            key={p.id}
                            onClick={() => setDetailPlayer(fullPlayerData)}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-dashed border-stone-300 dark:border-slate-700 bg-stone-50/60 dark:bg-slate-900/40 opacity-80 hover:opacity-100 transition-all cursor-pointer"
                          >
                            <Avatar player={p} size="sm" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="font-bold text-xs truncate text-stone-800 dark:text-slate-200">{p.name}</p>
                                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-stone-200/80 dark:bg-slate-800 text-stone-600 dark:text-slate-400">
                                  Archivé
                                </span>
                              </div>
                              {pStat?.finishedGames > 0 ? (
                                <p className="text-[10px] text-stone-500 dark:text-slate-400 mt-0.5 truncate">
                                  {pStat.wins} vict. · {pStat.finishedGames} partie{pStat.finishedGames > 1 ? 's' : ''}
                                </p>
                              ) : (
                                <p className="text-[10px] text-stone-400 dark:text-slate-500 mt-0.5">
                                  0 partie
                                </p>
                              )}
                            </div>

                            {/* Bouton Réactiver / Désarchiver */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                unarchivePlayer(p.id)
                              }}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer"
                              title={`Réactiver ${p.name}`}
                            >
                              <ArchiveRestore size={13} />
                              <span>Réactiver</span>
                            </button>

                            {/* Bouton Supprimer définitivement */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setConfirmDelete(p.id)
                              }}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-stone-400 hover:text-[#c83b3b] transition-colors cursor-pointer"
                              title={`Supprimer définitivement ${p.name}`}
                              aria-label={`Supprimer définitivement ${p.name}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <PlayerSheet
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSave={savePlayer}
      />
      {editPlayer && (
        <PlayerSheet
          open={!!editPlayer}
          onClose={() => setEditPlayer(null)}
          initial={editPlayer}
          onSave={(p) => { savePlayer(p); setEditPlayer(null) }}
        />
      )}
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => removePlayer(confirmDelete)}
        title="Supprimer définitivement ce joueur ?"
        message="Il sera retiré de votre bibliothèque. Les parties déjà enregistrées conserveront leurs scores passés."
        confirmLabel="Supprimer définitivement"
        danger
      />
      <PlayerDetailSheet
        player={detailPlayer}
        open={Boolean(detailPlayer)}
        onClose={() => setDetailPlayer(null)}
      />
    </div>
  )
}
