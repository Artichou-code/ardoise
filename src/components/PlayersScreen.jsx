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
  const [isArchiveView, setIsArchiveView] = useState(false)
  const [archiveSearchQuery, setArchiveSearchQuery] = useState('')

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

  // Filtrage par recherche active (insensible casse et accents)
  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim() || activePlayers.length <= 8) return sortedActivePlayers
    const query = searchQuery
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
    return sortedActivePlayers.filter(p => {
      const name = (p.name || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
      return name.includes(query)
    })
  }, [sortedActivePlayers, searchQuery, activePlayers.length])

  // Filtrage par recherche archives
  const filteredArchivedPlayers = useMemo(() => {
    if (!archiveSearchQuery.trim()) return sortedArchivedPlayers
    const query = archiveSearchQuery
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
    return sortedArchivedPlayers.filter(p => {
      const name = (p.name || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
      return name.includes(query)
    })
  }, [sortedArchivedPlayers, archiveSearchQuery])

  // Données complètes pour la fiche détaillée
  const getFullPlayerData = (p) => {
    const pStat = playerStatsMap.get(p.id) || playerStatsMap.get(normalizePlayerName(p.name))
    return {
      ...p,
      ...(pStat || {}),
      id: p.id,
      name: p.name,
      color: p.color,
      avatar: p.avatar,
      archived: Boolean(p.archived),
      totalGames: pStat?.totalGames || 0,
      finishedGames: pStat?.finishedGames || 0,
      wins: pStat?.wins || 0,
      podiums: pStat?.podiums || 0,
      winRate: pStat?.winRate || 0,
      badges: pStat?.badges || [],
      gameBreakdown: pStat?.gameBreakdown || {},
      recentHistory: pStat?.recentHistory || [],
      topOpponent: pStat?.topOpponent || null,
    }
  }

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden school-surface select-none">
      {isArchiveView ? (
        /* Header vue Archives */
        <header className="flex items-center gap-2 px-4 header-safe pb-3 flex-shrink-0 border-b border-stone-200/90 dark:border-slate-800/90 bg-[#faf9f5]/90 dark:bg-[#151719]/90 backdrop-blur-xs">
          <button
            type="button"
            onClick={() => setIsArchiveView(false)}
            className="p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Retour aux joueurs"
          >
            <ArrowLeft size={18} className="text-stone-700 dark:text-slate-300" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-serif-title font-bold text-lg truncate">
              Joueurs archivés
            </h1>
            <p className="text-[11px] text-stone-500 dark:text-slate-400 -mt-0.5 truncate">
              {archivedPlayers.length} joueur{archivedPlayers.length > 1 ? 's' : ''}
            </p>
          </div>
          <BurgerMenuButton />
        </header>
      ) : (
        /* Header vue Joueurs actifs */
        <header className="flex items-center gap-2 px-4 header-safe pb-3 flex-shrink-0 border-b border-stone-200/90 dark:border-slate-800/90 bg-[#faf9f5]/90 dark:bg-[#151719]/90 backdrop-blur-xs">
          <button
            type="button"
            onClick={() => setScreen('home')}
            className="p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs btn-margin-red cursor-pointer shrink-0"
          >
            <Plus size={15} /> Ajouter
          </button>
          <button
            type="button"
            onClick={() => setIsArchiveView(true)}
            className="p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-700 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
            title="Joueurs archivés"
            aria-label="Joueurs archivés"
          >
            <Archive size={17} />
          </button>
          <BurgerMenuButton />
        </header>
      )}

      {isArchiveView ? (
        /* ================= VUE JOUEURS ARCHIVÉS ================= */
        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-3 scroll-bottom-space">
          {archivedPlayers.length > 0 && (
            <p className="text-[11px] text-stone-500 dark:text-slate-400 mb-3 px-1 leading-relaxed">
              Ces joueurs ne sont plus proposés lors de la création d'une partie. Leurs statistiques et historiques restent intacts.
            </p>
          )}

          {/* Barre de recherche dans les archives */}
          {archivedPlayers.length > 0 && (
            <div className="mb-3">
              <div className="relative flex items-center">
                <Search
                  size={16}
                  className="absolute left-3.5 text-stone-400 dark:text-slate-500 pointer-events-none"
                />
                <input
                  type="text"
                  value={archiveSearchQuery}
                  onChange={e => setArchiveSearchQuery(e.target.value)}
                  placeholder="Rechercher dans les archives..."
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-stone-900 dark:text-slate-100 placeholder-stone-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#c83b3b] focus:ring-1 focus:ring-[#c83b3b]/30 shadow-2xs transition-all"
                />
                {archiveSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setArchiveSearchQuery('')}
                    className="absolute right-2.5 p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    aria-label="Effacer la recherche"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
              {archiveSearchQuery.trim() && (
                <div className="flex items-center justify-between px-1 mt-1.5 text-[11px] font-semibold text-stone-500 dark:text-slate-400">
                  <span>
                    {filteredArchivedPlayers.length} résultat{filteredArchivedPlayers.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          )}

          {archivedPlayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-6">
              <div className="w-12 h-12 rounded-2xl school-card flex items-center justify-center mb-3 text-stone-400 dark:text-slate-500">
                <Archive size={22} />
              </div>
              <p className="font-serif-title font-bold text-base mb-1">
                Aucun joueur archivé
              </p>
              <p className="text-stone-500 dark:text-slate-400 text-xs max-w-xs leading-relaxed mb-4">
                Vous pouvez archiver des joueurs occasionnels depuis la liste principale pour ne plus les voir lors de la création d'une partie tout en conservant leur historique.
              </p>
              <button
                type="button"
                onClick={() => setIsArchiveView(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-stone-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Retour aux joueurs
              </button>
            </div>
          ) : filteredArchivedPlayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="w-12 h-12 rounded-2xl school-card flex items-center justify-center mb-3">
                <Search size={22} className="text-stone-400 dark:text-slate-500" />
              </div>
              <p className="font-serif-title font-bold text-base mb-1">
                Aucun résultat
              </p>
              <p className="text-stone-500 dark:text-slate-400 text-xs mb-4">
                Aucun joueur archivé ne correspond à « {archiveSearchQuery.trim()} »
              </p>
              <button
                type="button"
                onClick={() => setArchiveSearchQuery('')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-stone-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Effacer la recherche
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {filteredArchivedPlayers.map(p => {
                const fullPlayerData = getFullPlayerData(p)
                const pStat = playerStatsMap.get(p.id) || playerStatsMap.get(normalizePlayerName(p.name))

                return (
                  <div
                    key={p.id}
                    onClick={() => setDetailPlayer(fullPlayerData)}
                    className="flex flex-col items-center p-3 rounded-2xl school-card relative hover:border-stone-300 dark:hover:border-slate-700 transition-all cursor-pointer group active:scale-[0.98]"
                  >
                    {/* Bouton de suppression définitive en haut à droite */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setConfirmDelete(p.id)
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg text-stone-400 hover:text-[#c83b3b] hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                      title={`Supprimer définitivement ${p.name}`}
                      aria-label={`Supprimer définitivement ${p.name}`}
                    >
                      <Trash2 size={13} />
                    </button>

                    {/* Avatar et Infos Joueur */}
                    <div className="mt-1 mb-2">
                      <Avatar player={p} size="md" />
                    </div>

                    <p className="font-serif-title font-bold text-sm text-stone-900 dark:text-slate-100 truncate w-full text-center">
                      {p.name}
                    </p>

                    {/* Stats abrégées */}
                    {pStat?.finishedGames > 0 ? (
                      <p className="text-[11px] text-stone-500 dark:text-slate-400 text-center truncate w-full mt-0.5">
                        {pStat.wins} vict. · {pStat.finishedGames} p.
                      </p>
                    ) : (
                      <p className="text-[11px] text-stone-400 dark:text-slate-500 text-center mt-0.5">
                        0 partie
                      </p>
                    )}

                    {/* Bouton Réactiver */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        unarchivePlayer(p.id)
                      }}
                      className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer"
                      title={`Réactiver ${p.name}`}
                    >
                      <ArchiveRestore size={13} />
                      <span>Réactiver</span>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* ================= VUE JOUEURS ACTIFS ================= */
        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-3 scroll-bottom-space">
          {/* Barre de recherche uniquement si plus de 8 joueurs actifs enregistrés */}
          {activePlayers.length > 8 && (
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
          ) : activePlayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-6">
              <div className="w-12 h-12 rounded-2xl school-card flex items-center justify-center mb-3">
                <Users size={22} className="text-stone-400 dark:text-slate-500" />
              </div>
              <p className="font-serif-title font-bold text-base mb-1">
                Aucun joueur actif
              </p>
              <p className="text-stone-500 dark:text-slate-400 text-xs mb-4">
                Tous vos joueurs sont actuellement dans les archives ({archivedPlayers.length}).
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsArchiveView(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-stone-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Voir les archives ({archivedPlayers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold btn-margin-red cursor-pointer"
                >
                  Ajouter un joueur
                </button>
              </div>
            </div>
          ) : filteredPlayers.length === 0 ? (
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
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {filteredPlayers.map(p => {
                const fullPlayerData = getFullPlayerData(p)
                const pStat = playerStatsMap.get(p.id) || playerStatsMap.get(normalizePlayerName(p.name))

                return (
                  <div
                    key={p.id}
                    onClick={() => setDetailPlayer(fullPlayerData)}
                    className="flex flex-col items-center p-3 rounded-2xl school-card relative hover:border-stone-300 dark:hover:border-slate-700 transition-all cursor-pointer group active:scale-[0.98]"
                  >
                    {/* Bouton Modifier en haut à gauche */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditPlayer(p)
                      }}
                      className="absolute top-2 left-2 p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      aria-label={`Modifier ${p.name}`}
                      title={`Modifier ${p.name}`}
                    >
                      <Pencil size={13} />
                    </button>

                    {/* Bouton Archiver en haut à droite */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        archivePlayer(p.id)
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors cursor-pointer"
                      aria-label={`Archiver ${p.name}`}
                      title={`Archiver ${p.name}`}
                    >
                      <Archive size={13} />
                    </button>

                    {/* Avatar */}
                    <div className="mt-1 mb-1.5">
                      <Avatar player={p} size="md" />
                    </div>

                    {/* Nom du joueur */}
                    <p className="font-serif-title font-bold text-sm text-stone-900 dark:text-slate-100 truncate w-full text-center">
                      {p.name}
                    </p>

                    {/* Stats et/ou Badge */}
                    {pStat?.badges && pStat.badges.length > 0 ? (
                      <div className="flex flex-col items-center gap-0.5 mt-1 w-full">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#c83b3b] dark:text-rose-300 bg-[#c83b3b]/10 dark:bg-[#c83b3b]/20 px-1.5 py-0.5 rounded border border-[#c83b3b]/25 dark:border-[#c83b3b]/40 truncate max-w-full">
                          <Award size={10} className="shrink-0 text-[#c83b3b] dark:text-rose-400" />
                          <span className="truncate">{pStat.badges[0].title}</span>
                        </span>
                        <p className="text-[10px] text-stone-500 dark:text-slate-400 text-center truncate w-full">
                          {pStat.wins} vict. · {pStat.finishedGames} p.
                        </p>
                      </div>
                    ) : pStat?.finishedGames > 0 ? (
                      <p className="text-[11px] text-stone-500 dark:text-slate-400 text-center truncate w-full mt-1">
                        {pStat.wins} vict. · {pStat.finishedGames} p.
                      </p>
                    ) : (
                      <p className="text-[11px] text-stone-400 dark:text-slate-500 text-center mt-1">
                        Nouvelle recrue
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

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
