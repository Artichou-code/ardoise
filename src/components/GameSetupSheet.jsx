import { useState, useEffect, useMemo } from 'react'
import { Plus, X, Check, BookOpen, Bookmark, BookmarkPlus, Sparkles, ArrowLeftRight, Search, ChevronDown, ChevronUp, Radio } from 'lucide-react'
import { BottomSheet } from './ui/BottomSheet'
import { Avatar, AvatarPicker } from './ui/Avatar'
import { useGame } from '../context/GameContext'
import { GAME_META, AVATAR_COLORS, PRESET_AVATARS } from '../constants/games'
import { createPlayer } from '../utils/gameUtils'
import { normalizePlayerName } from '../utils/statsUtils'

function PlayerCreatorSheet({ open, onClose, onAdd }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(AVATAR_COLORS[0])
  const [avatar, setAvatar] = useState(PRESET_AVATARS[0])

  useEffect(() => {
    if (open) {
      setAvatar(PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)])
    }
  }, [open])

  const handleAdd = () => {
    if (!name.trim()) return
    onAdd(createPlayer(name, color, avatar))
    setName('')
    setColor(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)])
    setAvatar(PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)])
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} position="top" title="Nouveau joueur">
      <div className="px-4 py-3 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar player={{ name: name || 'A', color, avatar }} size="md" />
          <input
            type="text"
            placeholder="Prénom du joueur"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
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
          onClick={handleAdd}
          disabled={!name.trim()}
          className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-40 btn-margin-red"
        >
          Ajouter
        </button>
      </div>
    </BottomSheet>
  )
}

export function GameSetupSheet({ gameType, initialPreset, onClose, onOpenRules }) {
  const { players: savedPlayers, games, savePlayer, createGame, customPresets, savePreset, deletePreset, startLiveSessionForGame } = useGame()
  const [launchAsLiveTable, setLaunchAsLiveTable] = useState(false)
  const [selectedPlayers, setSelectedPlayers] = useState([])
  const [config, setConfig] = useState({ scoreDir: 'high', limit: 100 })
  const [customGameName, setCustomGameName] = useState('')
  const [beloteVariant, setBeloteVariant] = useState('belote')
  const [targetTeam, setTargetTeam] = useState(1) // 1 = Équipe 1, 2 = Équipe 2
  const [savedSuccessMsg, setSavedSuccessMsg] = useState(null)
  const [showCreator, setShowCreator] = useState(false)
  const [playerSearchQuery, setPlayerSearchQuery] = useState('')
  const [showAllPlayers, setShowAllPlayers] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [playerToReplaceCandidate, setPlayerToReplaceCandidate] = useState(null)

  // Statistiques d'activité des joueurs (spécifique à ce jeu et globale)
  const playerActivityMap = useMemo(() => {
    const map = new Map()
    const safeGames = Array.isArray(games) ? games : []

    for (const g of safeGames) {
      if (!g || !Array.isArray(g.players)) continue
      const isThisGame = g.type === gameType
      const playedAt = g.finishedAt || g.updatedAt || g.startedAt || 0

      for (const gp of g.players) {
        if (!gp || !gp.name) continue
        const key = normalizePlayerName(gp.name)
        const entry = map.get(key) || { thisGameCount: 0, totalGamesCount: 0, lastPlayedAt: 0 }
        entry.totalGamesCount += 1
        if (isThisGame) {
          entry.thisGameCount += 1
        }
        entry.lastPlayedAt = Math.max(entry.lastPlayedAt, playedAt)
        map.set(key, entry)
      }
    }
    return map
  }, [games, gameType])

  // Tri intelligent :
  // 1. Joueurs sélectionnés (toujours visibles en tête)
  // 2. Joueurs ayant déjà joué à ce jeu en priorité (par nombre de parties)
  // 3. Joueurs les plus actifs globalement (si nouveau jeu ou pour compléter)
  // Tri intelligent et stable (aucune permutation lors de la sélection) :
  // 1. Joueurs ayant déjà joué à ce jeu en priorité (par nombre de parties)
  // 2. Joueurs les plus actifs globalement (si nouveau jeu ou pour compléter)
  // 3. Par récence de jeu, puis ordre alphabétique
  const sortedSavedPlayers = useMemo(() => {
    return [...savedPlayers].sort((a, b) => {
      const statA = playerActivityMap.get(normalizePlayerName(a.name)) || { thisGameCount: 0, totalGamesCount: 0, lastPlayedAt: 0 }
      const statB = playerActivityMap.get(normalizePlayerName(b.name)) || { thisGameCount: 0, totalGamesCount: 0, lastPlayedAt: 0 }

      if (statA.thisGameCount !== statB.thisGameCount) {
        return statB.thisGameCount - statA.thisGameCount
      }

      if (statA.totalGamesCount !== statB.totalGamesCount) {
        return statB.totalGamesCount - statA.totalGamesCount
      }

      if (statA.lastPlayedAt !== statB.lastPlayedAt) {
        return statB.lastPlayedAt - statA.lastPlayedAt
      }

      return (a.name || '').localeCompare(b.name || '', 'fr', { sensitivity: 'base' })
    })
  }, [savedPlayers, playerActivityMap])

  // Top 4 joueurs de base (par activité ou sélection), les autres accessibles via "Voir les autres" ou recherche
  const top4Players = useMemo(() => {
    return sortedSavedPlayers.slice(0, 4)
  }, [sortedSavedPlayers])

  const remainingPlayers = useMemo(() => {
    return sortedSavedPlayers.slice(4)
  }, [sortedSavedPlayers])

  const hiddenCount = Math.max(0, sortedSavedPlayers.length - 4)

  const searchQueryTrimmed = playerSearchQuery.trim().toLowerCase()

  const searchResults = useMemo(() => {
    if (!searchQueryTrimmed) return []
    return sortedSavedPlayers.filter(p =>
      (p.name || '').toLowerCase().includes(searchQueryTrimmed)
    )
  }, [sortedSavedPlayers, searchQueryTrimmed])

  // Composition des équipes à la Belote (Équipe 1 = index 0 & 1, Équipe 2 = index 2 & 3)
  const team1Players = useMemo(() => {
    if (gameType !== 'belote') return []
    return selectedPlayers.slice(0, 2)
  }, [gameType, selectedPlayers])

  const team2Players = useMemo(() => {
    if (gameType !== 'belote') return []
    return selectedPlayers.slice(2, 4)
  }, [gameType, selectedPlayers])

  const cycleBelotePairings = () => {
    if (selectedPlayers.length === 4) {
      const [a, b, c, d] = selectedPlayers
      // Rotation cyclique des 3 combinaisons de partenaires (b -> c -> d -> b)
      setSelectedPlayers([a, c, d, b])
      return
    }
    if (selectedPlayers.length >= 2) {
      const t1 = selectedPlayers.slice(0, 2)
      const t2 = selectedPlayers.slice(2, 4)
      setSelectedPlayers([...t2, ...t1])
    }
  }

  const handleCreateDemoPlayers = () => {
    const p1 = createPlayer('Alex', AVATAR_COLORS[0], PRESET_AVATARS[0])
    const p2 = createPlayer('François', AVATAR_COLORS[1], PRESET_AVATARS[1])
    const p3 = createPlayer('Sophie', AVATAR_COLORS[2], PRESET_AVATARS[2])
    const p4 = createPlayer('Pierre', AVATAR_COLORS[3], PRESET_AVATARS[3])
    const demo = [p1, p2, p3, p4]
    demo.forEach(p => savePlayer(p))
    if (gameType === 'belote') {
      setSelectedPlayers(demo)
      setTargetTeam(2)
      setShowAllPlayers(false)
      setShowSearch(false)
      setPlayerSearchQuery('')
    }
  }

  useEffect(() => {
    if (initialPreset) {
      setCustomGameName(initialPreset.name || '')
      setConfig({
        scoreDir: initialPreset.scoreDir || 'high',
        limit: initialPreset.limit || 100,
        specialRule: initialPreset.specialRule || { enabled: false, target: 100, action: 'divide', value: 2 },
      })
      setSavedSuccessMsg(null)
      return
    }

    if (gameType === 'dourak') {
      setConfig({
        scoreDir: 'low',
        mode: 'defeats',
        endCondition: 'limit',
        limit: 5,
      })
      setCustomGameName('')
    } else if (gameType === 'belote') {
      setConfig({ limit: 1000, variant: 'belote' })
      setBeloteVariant('belote')
      setCustomGameName('')
    } else if (gameType === 'caracole') {
      setConfig({ limit: 100, sursis: true, sursisType: 'half' })
      setCustomGameName('')
    } else if (gameType === 'universel') {
      setConfig({
        scoreDir: 'high',
        limit: 100,
        specialRule: { enabled: false, target: 100, action: 'divide', value: 2 },
      })
      setCustomGameName('')
    } else {
      setConfig({})
      setCustomGameName('')
    }
    setSavedSuccessMsg(null)
  }, [gameType, initialPreset])

  const meta = gameType ? GAME_META[gameType] : null
  if (!meta) return null

  const toggleSavedPlayer = (p) => {
    if (selectedPlayers.find(sp => sp.id === p.id)) {
      setSelectedPlayers(prev => prev.filter(sp => sp.id !== p.id))
      if (gameType === 'belote') {
        if (team1Players.some(sp => sp.id === p.id)) {
          setTargetTeam(1)
        } else {
          setTargetTeam(2)
        }
      }
    } else {
      if (gameType === 'belote') {
        if (targetTeam === 1 && team1Players.length < 2) {
          const nextT1 = [...team1Players, p]
          setSelectedPlayers([...nextT1, ...team2Players])
          if (nextT1.length === 2 && team2Players.length < 2) {
            setTargetTeam(2)
          }
          if (nextT1.length === 2 && team2Players.length === 2) {
            setShowAllPlayers(false)
            setShowSearch(false)
            setPlayerSearchQuery('')
          }
        } else if (team2Players.length < 2) {
          const nextT2 = [...team2Players, p]
          setSelectedPlayers([...team1Players, ...nextT2])
          if (nextT2.length === 2 && team1Players.length < 2) {
            setTargetTeam(1)
          }
          if (nextT2.length === 2 && team1Players.length === 2) {
            setShowAllPlayers(false)
            setShowSearch(false)
            setPlayerSearchQuery('')
          }
        } else if (team1Players.length < 2) {
          const nextT1 = [...team1Players, p]
          setSelectedPlayers([...nextT1, ...team2Players])
          if (nextT1.length === 2 && team2Players.length === 2) {
            setShowAllPlayers(false)
            setShowSearch(false)
            setPlayerSearchQuery('')
          }
        } else {
          // Équipes complètes à la Belote (2 dans chaque équipe) -> demande qui remplacer
          setPlayerToReplaceCandidate(p)
        }
      } else {
        if (selectedPlayers.length < (meta.maxPlayers || 8)) {
          const nextCount = selectedPlayers.length + 1
          setSelectedPlayers(prev => [...prev, p])
          if (nextCount >= (meta.maxPlayers || 8)) {
            setShowAllPlayers(false)
            setShowSearch(false)
            setPlayerSearchQuery('')
          }
        } else {
          // Nombre max de joueurs atteint -> demande qui remplacer
          setPlayerToReplaceCandidate(p)
        }
      }
    }
  }

  const handleReplacePlayer = (playerToReplace, candidate) => {
    setSelectedPlayers(prev => prev.map(p => p.id === playerToReplace.id ? candidate : p))
    setPlayerToReplaceCandidate(null)
    setShowSearch(false)
    setShowAllPlayers(false)
    setPlayerSearchQuery('')
  }

  const handleSelectFromSearch = (p) => {
    const isAlreadySelected = selectedPlayers.some(sp => sp.id === p.id)
    const isFull = gameType === 'belote'
      ? (team1Players.length >= 2 && team2Players.length >= 2)
      : (selectedPlayers.length >= (meta?.maxPlayers || 8))

    toggleSavedPlayer(p)
    if (isAlreadySelected || !isFull) {
      setShowSearch(false)
      setPlayerSearchQuery('')
    }
  }

  const renderPlayerCard = (p, onClickCustom) => {
    const isSelected = !!selectedPlayers.find(sp => sp.id === p.id)
    const inTeam1 = gameType === 'belote' && team1Players.some(sp => sp.id === p.id)
    const inTeam2 = gameType === 'belote' && team2Players.some(sp => sp.id === p.id)
    const act = playerActivityMap.get(normalizePlayerName(p.name))

    return (
      <button
        key={p.id}
        type="button"
        onClick={() => {
          if (onClickCustom) {
            onClickCustom(p)
          } else {
            toggleSavedPlayer(p)
          }
        }}
        className={`flex items-center gap-2 px-2 py-1.5 rounded-xl border text-left transition-all focus:outline-none cursor-pointer min-h-[42px] ${
          isSelected
            ? inTeam1
              ? 'border-[#c83b3b] bg-[#c83b3b]/10 text-stone-900 dark:text-slate-100 ring-1 ring-[#c83b3b]/30 font-bold'
              : 'border-[#1e3a5f] bg-[#1e3a5f]/10 text-stone-900 dark:text-slate-100 ring-1 ring-[#1e3a5f]/30 font-bold'
            : 'border-stone-200 dark:border-slate-800 bg-white/85 dark:bg-slate-800/50 text-stone-800 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800'
        }`}
      >
        <Avatar player={p} size="xs" />
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-xs truncate block leading-tight">
            {p.name}
          </span>
          {gameType === 'belote' && (inTeam1 || inTeam2) ? (
            <span className={`text-[9px] font-bold block ${inTeam1 ? 'text-[#c83b3b] dark:text-rose-400' : 'text-[#1e3a5f] dark:text-sky-400'}`}>
              {inTeam1 ? 'Équipe 1' : 'Équipe 2'}
            </span>
          ) : (
            act && (act.thisGameCount > 0 || act.totalGamesCount > 0) && (
              <span className="text-[9px] text-stone-400 dark:text-slate-500 block truncate leading-none mt-0.5">
                {act.thisGameCount > 0
                  ? `${act.thisGameCount} p. à ce jeu`
                  : `${act.totalGamesCount} p. au total`}
              </span>
            )
          )}
        </div>
        {isSelected ? (
          <Check size={13} className={inTeam1 ? 'text-[#c83b3b] flex-shrink-0' : 'text-[#1e3a5f] flex-shrink-0'} />
        ) : (
          <span className="w-3.5 h-3.5 rounded-full border border-stone-300 dark:border-slate-600 flex-shrink-0" />
        )}
      </button>
    )
  }

  const handleAddNew = (player) => {
    savePlayer(player)
    if (gameType === 'belote') {
      if (targetTeam === 1 && team1Players.length < 2) {
        const nextT1 = [...team1Players, player]
        setSelectedPlayers([...nextT1, ...team2Players])
        if (nextT1.length === 2 && team2Players.length < 2) {
          setTargetTeam(2)
        }
        if (nextT1.length === 2 && team2Players.length === 2) {
          setShowAllPlayers(false)
          setShowSearch(false)
          setPlayerSearchQuery('')
        }
      } else if (team2Players.length < 2) {
        const nextT2 = [...team2Players, player]
        setSelectedPlayers([...team1Players, ...nextT2])
        if (nextT2.length === 2 && team1Players.length < 2) {
          setTargetTeam(1)
        }
        if (nextT2.length === 2 && team1Players.length === 2) {
          setShowAllPlayers(false)
          setShowSearch(false)
          setPlayerSearchQuery('')
        }
      } else if (team1Players.length < 2) {
        const nextT1 = [...team1Players, player]
        setSelectedPlayers([...nextT1, ...team2Players])
        if (nextT1.length === 2 && team2Players.length === 2) {
          setShowAllPlayers(false)
          setShowSearch(false)
          setPlayerSearchQuery('')
        }
      } else {
        setPlayerToReplaceCandidate(player)
      }
    } else {
      if (selectedPlayers.length < (meta.maxPlayers || 8)) {
        const nextCount = selectedPlayers.length + 1
        setSelectedPlayers(prev => [...prev, player])
        if (nextCount >= (meta.maxPlayers || 8)) {
          setShowAllPlayers(false)
          setShowSearch(false)
          setPlayerSearchQuery('')
        }
      } else {
        setPlayerToReplaceCandidate(player)
      }
    }
  }

  const loadPresetIntoConfig = (preset) => {
    setCustomGameName(preset.name || '')
    setConfig({
      scoreDir: preset.scoreDir || 'high',
      limit: preset.limit || 100,
      specialRule: preset.specialRule || { enabled: false, target: 100, action: 'divide', value: 2 },
    })
    setSavedSuccessMsg(`Modèle « ${preset.name} » chargé`)
    setTimeout(() => setSavedSuccessMsg(null), 2500)
  }

  const handleSaveCurrentAsPreset = () => {
    const name = customGameName.trim() || 'Mon Jeu'
    const newPreset = {
      id: initialPreset?.id || Date.now().toString(),
      name,
      scoreDir: config.scoreDir || 'high',
      limit: config.limit || 100,
      specialRule: config.specialRule || { enabled: false, target: 100, action: 'divide', value: 2 },
      updatedAt: Date.now(),
    }
    savePreset(newPreset)
    setCustomGameName(name)
    setSavedSuccessMsg(`Modèle « ${name} » enregistré !`)
    setTimeout(() => setSavedSuccessMsg(null), 3000)
  }

  const canStart = gameType === 'belote'
    ? selectedPlayers.length === 4
    : selectedPlayers.length >= (meta.minPlayers || 2)

  const handleStart = async () => {
    const finalConfig = {
      ...config,
      variant: gameType === 'belote' ? beloteVariant : undefined,
      customGameName: gameType === 'universel'
        ? (customGameName.trim() || undefined)
        : gameType === 'belote'
        ? (beloteVariant === 'coinche' ? 'Coinche' : 'Belote')
        : undefined,
    }
    const newGame = createGame(gameType, selectedPlayers, finalConfig)
    if (launchAsLiveTable && newGame) {
      try {
        await startLiveSessionForGame(newGame)
        window.dispatchEvent(new CustomEvent('ardoise-open-live-session'))
      } catch (err) {
        console.error('Erreur lancement table en direct:', err)
      }
    }
    onClose()
  }

  const sheetTitle = gameType === 'universel' && customGameName.trim()
    ? customGameName.trim()
    : gameType === 'belote'
    ? (beloteVariant === 'coinche' ? 'Coinche' : 'Belote')
    : meta.name

  const sheetSubtitle = gameType === 'universel' && customGameName.trim()
    ? `Modèle personnalisé · ${meta.playersBadge}`
    : gameType === 'belote'
    ? (beloteVariant === 'coinche' ? '2 éq. (4 j.) · Enchères & Coinche' : '2 éq. (4 j.) · Prise classique 32 cartes')
    : `${meta.playersBadge} · ${meta.categoryBadge}`

  return (
    <>
      <BottomSheet
        open={!!gameType}
        onClose={onClose}
        title={sheetTitle}
        subtitle={sheetSubtitle}
        headerAction={
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setLaunchAsLiveTable(v => !v)}
              className={`p-2 rounded-full transition-all cursor-pointer ${
                launchAsLiveTable
                  ? 'bg-[#c83b3b]/15 text-[#c83b3b] ring-1 ring-[#c83b3b]/40'
                  : 'hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-500 dark:text-slate-400 hover:text-[#c83b3b]'
              }`}
              title={launchAsLiveTable ? "Mode Table en direct activé (cliquez pour désactiver)" : "Lancer sur une Table en direct (partager avec des amis)"}
              aria-label="Table en direct"
            >
              <Radio size={18} className={launchAsLiveTable ? 'animate-pulse' : ''} />
            </button>
            {onOpenRules ? (
              <button
                type="button"
                onClick={() => onOpenRules(gameType)}
                className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-500 dark:text-slate-400 hover:text-[#c83b3b] transition-colors cursor-pointer"
                title="Consulter les règles"
                aria-label="Règles"
              >
                <BookOpen size={18} />
              </button>
            ) : null}
          </div>
        }
      >
        <div className="px-4 sm:px-5 pt-2.5 pb-4 space-y-3.5">
          {/* Bannière d'indication Table en direct si activée */}
          {launchAsLiveTable && (
            <div className="p-2.5 rounded-xl bg-[#c83b3b]/10 border border-[#c83b3b]/25 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Radio size={14} className="text-[#c83b3b] shrink-0 animate-pulse" />
                <span className="text-[11px] font-semibold text-stone-700 dark:text-slate-300 truncate">
                  Cette partie créera une <strong>Table en direct</strong> avec QR code.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLaunchAsLiveTable(false)}
                className="text-[10px] font-bold text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 shrink-0 cursor-pointer"
              >
                Désactiver
              </button>
            </div>
          )}
          {/* Sélecteur de variante Belote vs Coinche */}
          {gameType === 'belote' && (
            <div className="grid grid-cols-2 p-1 bg-stone-100 dark:bg-slate-800 rounded-xl gap-1 border border-stone-200/70 dark:border-slate-700/70">
              <button
                type="button"
                onClick={() => {
                  setBeloteVariant('belote')
                  setConfig(c => ({ ...c, variant: 'belote' }))
                }}
                className={`py-2 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer text-center ${
                  beloteVariant === 'belote'
                    ? 'bg-white dark:bg-slate-700 text-[#c83b3b] shadow-xs'
                    : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                Belote classique
              </button>
              <button
                type="button"
                onClick={() => {
                  setBeloteVariant('coinche')
                  setConfig(c => ({ ...c, variant: 'coinche' }))
                }}
                className={`py-2 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer text-center ${
                  beloteVariant === 'coinche'
                    ? 'bg-white dark:bg-slate-700 text-[#c83b3b] shadow-xs'
                    : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                Coinche (Contrée)
              </button>
            </div>
          )}

          {/* Affichage des joueurs sélectionnés / Composition des équipes */}
          <div className="min-w-0 w-full">
            {gameType === 'belote' ? (
              <div className="flex items-center gap-1.5">
                  {/* Équipe 1 (Rouge) */}
                  <div
                    onClick={() => setTargetTeam(1)}
                    className={`flex-1 min-w-0 p-2 rounded-xl border transition-all cursor-pointer school-card space-y-1.5 ${
                      targetTeam === 1 && team1Players.length < 2
                        ? 'border-[#c83b3b] ring-2 ring-[#c83b3b]/25 bg-[#c83b3b]/5'
                        : 'border-stone-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-[#c83b3b] dark:text-rose-400 uppercase tracking-wider flex items-center gap-1 truncate">
                        Équipe 1
                        {targetTeam === 1 && team1Players.length < 2 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#c83b3b] dark:bg-rose-400 animate-pulse shrink-0" />
                        )}
                      </span>
                      <span className="text-[10px] font-semibold text-stone-400 dark:text-slate-500 shrink-0">
                        {team1Players.length}/2
                      </span>
                    </div>
                    <div className="flex items-center justify-around gap-2 min-h-[46px] w-full px-1">
                      {team1Players.map(p => (
                        <div key={p.id} className="relative group shrink-0 flex flex-col items-center">
                          <Avatar player={p} size="sm" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedPlayers(prev => prev.filter(sp => sp.id !== p.id))
                            }}
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-stone-800 text-white hover:bg-[#c83b3b] flex items-center justify-center text-[9px] shadow-xs cursor-pointer transition-colors"
                            title={`Retirer ${p.name}`}
                            aria-label={`Retirer ${p.name}`}
                          >
                            <X size={9} strokeWidth={2.5} />
                          </button>
                          <span className="text-[10px] font-semibold text-stone-700 dark:text-slate-300 max-w-[54px] truncate text-center mt-0.5">
                            {p.name}
                          </span>
                        </div>
                      ))}
                      {Array.from({ length: 2 - team1Players.length }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setTargetTeam(1)
                              if (sortedSavedPlayers.length === 0) {
                                setShowCreator(true)
                              }
                            }}
                            className="flex items-center justify-center w-9 h-9 rounded-full border border-dashed border-stone-300 dark:border-slate-700 hover:border-[#c83b3b] hover:bg-[#c83b3b]/10 text-stone-400 hover:text-[#c83b3b] dark:text-slate-600 dark:hover:text-rose-400 text-sm font-bold transition-colors cursor-pointer"
                            title="Cliquer pour ajouter à l'Équipe 1"
                          >
                            +
                          </button>
                          <span className="text-[10px] text-transparent select-none mt-0.5">·</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bouton Permuter entre Équipe 1 et Équipe 2 */}
                  <button
                    type="button"
                    onClick={cycleBelotePairings}
                    disabled={selectedPlayers.length < 2}
                    className={`shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-90 ${
                      selectedPlayers.length >= 2
                        ? 'border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#c83b3b] hover:bg-[#c83b3b]/10 text-stone-600 dark:text-slate-300 hover:text-[#c83b3b]'
                        : 'border-stone-200 dark:border-slate-800/60 bg-stone-100/60 dark:bg-slate-900/60 text-stone-300 dark:text-slate-700 pointer-events-none'
                    }`}
                    title={
                      selectedPlayers.length === 4
                        ? 'Permuter les partenaires des équipes'
                        : 'Échanger Équipe 1 et Équipe 2'
                    }
                    aria-label="Permuter les équipes"
                  >
                    <ArrowLeftRight size={13} />
                  </button>

                  {/* Équipe 2 (Bleu) */}
                  <div
                    onClick={() => setTargetTeam(2)}
                    className={`flex-1 min-w-0 p-2 rounded-xl border transition-all cursor-pointer school-card space-y-1.5 ${
                      targetTeam === 2 && team2Players.length < 2
                        ? 'border-[#1e3a5f] ring-2 ring-[#1e3a5f]/25 bg-[#1e3a5f]/5'
                        : 'border-stone-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-[#1e3a5f] dark:text-sky-400 uppercase tracking-wider flex items-center gap-1 truncate">
                        Équipe 2
                        {targetTeam === 2 && team2Players.length < 2 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1e3a5f] dark:bg-sky-400 animate-pulse shrink-0" />
                        )}
                      </span>
                      <span className="text-[10px] font-semibold text-stone-400 dark:text-slate-500 shrink-0">
                        {team2Players.length}/2
                      </span>
                    </div>
                    <div className="flex items-center justify-around gap-2 min-h-[46px] w-full px-1">
                      {team2Players.map(p => (
                        <div key={p.id} className="relative group shrink-0 flex flex-col items-center">
                          <Avatar player={p} size="sm" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedPlayers(prev => prev.filter(sp => sp.id !== p.id))
                            }}
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-stone-800 text-white hover:bg-[#c83b3b] flex items-center justify-center text-[9px] shadow-xs cursor-pointer transition-colors"
                            title={`Retirer ${p.name}`}
                            aria-label={`Retirer ${p.name}`}
                          >
                            <X size={9} strokeWidth={2.5} />
                          </button>
                          <span className="text-[10px] font-semibold text-stone-700 dark:text-slate-300 max-w-[54px] truncate text-center mt-0.5">
                            {p.name}
                          </span>
                        </div>
                      ))}
                      {Array.from({ length: 2 - team2Players.length }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setTargetTeam(2)
                              if (sortedSavedPlayers.length === 0) {
                                setShowCreator(true)
                              }
                            }}
                            className="flex items-center justify-center w-9 h-9 rounded-full border border-dashed border-stone-300 dark:border-slate-700 hover:border-[#1e3a5f] hover:bg-[#1e3a5f]/10 text-stone-400 hover:text-[#1e3a5f] dark:text-slate-600 dark:hover:text-sky-400 text-sm font-bold transition-colors cursor-pointer"
                            title="Cliquer pour ajouter à l'Équipe 2"
                          >
                            +
                          </button>
                          <span className="text-[10px] text-transparent select-none mt-0.5">·</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
            ) : selectedPlayers.length === 0 ? (
              <p className="text-xs text-stone-600 dark:text-slate-400 leading-relaxed">
                {meta.description}
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 py-0.5">
                {selectedPlayers.map(p => (
                  <div key={p.id} className="shrink-0 flex flex-col items-center gap-0.5">
                    <div className="relative p-0.5">
                      <Avatar player={p} size="sm-compact" />
                      <button
                        type="button"
                        onClick={() => setSelectedPlayers(prev => prev.filter(sp => sp.id !== p.id))}
                        className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-stone-800 dark:bg-slate-200 text-white dark:text-slate-900 flex items-center justify-center shadow-xs hover:bg-[#c83b3b] dark:hover:bg-[#c83b3b] hover:text-white transition-colors cursor-pointer"
                        title={`Retirer ${p.name}`}
                        aria-label={`Retirer ${p.name}`}
                      >
                        <X size={9} strokeWidth={2.5} />
                      </button>
                    </div>
                    <span className="text-[10px] font-semibold text-stone-700 dark:text-slate-300 max-w-[48px] truncate text-center">
                      {p.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Joueurs enregistrés */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500">
                {sortedSavedPlayers.length > 4 && !showAllPlayers && !showSearch
                  ? `Joueurs suggérés (${Math.min(4, sortedSavedPlayers.length)}/${sortedSavedPlayers.length})`
                  : `Joueurs enregistrés (${selectedPlayers.length}/${meta.maxPlayers || 8})`}
              </p>
              {selectedPlayers.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedPlayers([])}
                  className="text-[11px] font-semibold text-stone-500 hover:text-[#c83b3b] transition-colors cursor-pointer"
                >
                  Désélectionner tout
                </button>
              )}
            </div>

            {sortedSavedPlayers.length === 0 ? (
              <div className="p-3.5 rounded-xl border border-dashed border-stone-300 dark:border-slate-700 bg-stone-50/70 dark:bg-slate-800/40 text-center space-y-2.5">
                <p className="text-xs text-stone-600 dark:text-slate-300 font-medium">
                  Aucun joueur enregistré sur cet appareil.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreator(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 dark:bg-slate-200 text-white dark:text-stone-900 font-bold text-xs hover:bg-[#c83b3b] dark:hover:bg-[#c83b3b] dark:hover:text-white transition-colors cursor-pointer shadow-2xs"
                  >
                    <Plus size={14} /> Créer un joueur
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateDemoPlayers}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#c83b3b]/40 bg-[#c83b3b]/10 text-[#c83b3b] dark:text-red-400 font-bold text-xs hover:bg-[#c83b3b]/20 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Sparkles size={14} /> Ajouter 4 joueurs démo
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Grille principale : les 4 joueurs de base */}
                <div className="grid grid-cols-2 gap-1.5 p-0.5">
                  {top4Players.map(p => renderPlayerCard(p))}
                </div>

                {/* Si des joueurs supplémentaires existent : ligne avec 'Voir les autres' et loupe */}
                {hiddenCount > 0 && (
                  <div className="pt-1.5 space-y-1.5">
                    {/* Même ligne : Voir les autres (X) + Bouton recherche qui s'étire directement */}
                    <div className="flex items-center justify-between gap-1.5 px-0.5 min-h-[32px]">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAllPlayers(prev => !prev)
                          if (!showAllPlayers) {
                            setShowSearch(false)
                            setPlayerSearchQuery('')
                          }
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-600 dark:text-slate-400 hover:text-[#c83b3b] dark:hover:text-rose-400 transition-colors cursor-pointer py-1 px-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 shrink-0"
                      >
                        <span>
                          {showAllPlayers
                            ? 'Masquer les autres'
                            : `Voir les autres (${hiddenCount})`}
                        </span>
                        {showAllPlayers ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>

                      {/* Zone bouton recherche qui s'étire directement sur la même ligne */}
                      {!showSearch ? (
                        <button
                          type="button"
                          onClick={() => {
                            setShowSearch(true)
                            setShowAllPlayers(false)
                          }}
                          className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border border-stone-200 dark:border-slate-800 text-stone-600 dark:text-slate-400 hover:border-stone-300 dark:hover:border-slate-700 bg-white/70 dark:bg-slate-800/60 hover:text-stone-900 dark:hover:text-white shrink-0"
                          title="Rechercher parmi les autres joueurs"
                          aria-label="Rechercher"
                        >
                          <Search size={12} strokeWidth={2.5} />
                          <span>Rechercher</span>
                        </button>
                      ) : (
                        <div className="flex-1 min-w-0 relative flex items-center animate-fade-in">
                          <Search size={12} strokeWidth={2.5} className="absolute left-2.5 text-stone-400 dark:text-slate-500 pointer-events-none" />
                          <input
                            type="text"
                            autoFocus
                            placeholder="Rechercher..."
                            value={playerSearchQuery}
                            onChange={e => setPlayerSearchQuery(e.target.value)}
                            className="w-full pl-7 pr-6 py-1 text-xs font-medium rounded-lg border border-[#c83b3b] bg-white dark:bg-slate-900 text-stone-900 dark:text-slate-100 placeholder-stone-400 dark:placeholder-slate-500 focus:outline-none ring-1 ring-[#c83b3b]/30 shadow-2xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setShowSearch(false)
                              setPlayerSearchQuery('')
                            }}
                            className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 cursor-pointer"
                            aria-label="Fermer la recherche"
                          >
                            <X size={12} strokeWidth={2.5} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Résultats de recherche uniquement si une saisie est en cours */}
                    {showSearch && searchQueryTrimmed && (
                      <div className="space-y-1 pt-0.5">
                        {searchResults.length > 0 ? (
                          <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto scrollbar-hide p-0.5">
                            {searchResults.map(p => renderPlayerCard(p, handleSelectFromSearch))}
                          </div>
                        ) : (
                          <div className="p-2.5 text-center text-xs text-stone-500 dark:text-slate-400 bg-stone-50/70 dark:bg-slate-800/40 rounded-xl border border-stone-200 dark:border-slate-800 space-y-1.5">
                            <p>Aucun joueur trouvé pour « {playerSearchQuery} »</p>
                            <button
                              type="button"
                              onClick={() => {
                                const newP = createPlayer(playerSearchQuery.trim(), AVATAR_COLORS[savedPlayers.length % AVATAR_COLORS.length])
                                handleAddNew(newP)
                                setShowSearch(false)
                                setPlayerSearchQuery('')
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#c83b3b] text-white text-xs font-bold shadow-2xs hover:bg-[#b03333] transition-colors cursor-pointer"
                            >
                              <Plus size={12} /> Créer « {playerSearchQuery.trim()} »
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Joueurs masqués déroulés via 'Voir les autres' */}
                    {showAllPlayers && !showSearch && (
                      <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto scrollbar-hide p-0.5 animate-fadeIn">
                        {remainingPlayers.map(p => renderPlayerCard(p))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Config spécifique Dourak */}
          {gameType === 'dourak' && (
            <div className="space-y-4 pt-2 border-t border-stone-200/70 dark:border-slate-800/70">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 mb-2">
                  Mode de comptage
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'defeats', label: 'Classique (+1 défaite)', defaultLimit: 5 },
                    { id: 'cards', label: 'Pénalité aux cartes', defaultLimit: 30 },
                  ].map(opt => {
                    const active = (config.mode || 'defeats') === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setConfig(c => ({
                            ...c,
                            mode: opt.id,
                            limit: c.endCondition === 'rounds' ? c.limit : opt.defaultLimit,
                          }))
                        }
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-colors focus:outline-none cursor-pointer ${
                          active
                            ? 'border-[#c83b3b] bg-[#c83b3b] text-white'
                            : 'school-subtle'
                        }`}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 mb-2">
                  Condition de fin de partie
                </p>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {[
                    {
                      id: 'limit',
                      label:
                        config.mode === 'cards'
                          ? 'Seuil de cartes'
                          : 'Seuil de défaites',
                      defaultVal: config.mode === 'cards' ? 30 : 5,
                    },
                    { id: 'rounds', label: 'Nombre de manches', defaultVal: 10 },
                  ].map(cond => {
                    const active = (config.endCondition || 'limit') === cond.id
                    return (
                      <button
                        key={cond.id}
                        type="button"
                        onClick={() =>
                          setConfig(c => ({
                            ...c,
                            endCondition: cond.id,
                            limit: cond.defaultVal,
                          }))
                        }
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors focus:outline-none cursor-pointer ${
                          active
                            ? 'border-[#c83b3b] bg-[#c83b3b] text-white'
                            : 'school-subtle'
                        }`}
                      >
                        {cond.label}
                      </button>
                    )
                  })}
                </div>

                {/* Choix du palier */}
                <div className="grid grid-cols-3 gap-2">
                  {(config.endCondition === 'rounds'
                    ? [5, 10, 15]
                    : config.mode === 'cards'
                    ? [20, 30, 50]
                    : [3, 5, 10]
                  ).map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setConfig(c => ({ ...c, limit: val }))}
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors focus:outline-none cursor-pointer ${
                        config.limit === val
                          ? 'border-[#c83b3b] bg-[#c83b3b]/15 text-[#c83b3b]'
                          : 'school-subtle'
                      }`}
                    >
                      {val}{' '}
                      {config.endCondition === 'rounds'
                        ? 'manches'
                        : config.mode === 'cards'
                        ? 'cartes'
                        : 'défaites'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Config spécifique Caracole */}
          {gameType === 'caracole' && (
            <div className="space-y-4 pt-2 border-t border-stone-200/70 dark:border-slate-800/70">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 mb-2">
                  Seuil d'élimination
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 50, title: '50 pts', sub: '(Courte)' },
                    { val: 100, title: '100 pts', sub: '(Classique)' },
                    { val: 200, title: '200 pts', sub: '(Longue)' },
                  ].map(({ val, title, sub }) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setConfig(c => ({ ...c, limit: val }))}
                      className={`py-2 px-1 rounded-xl text-center border transition-colors focus:outline-none cursor-pointer ${
                        (config.limit || 100) === val
                          ? 'border-[#c83b3b] bg-[#c83b3b] text-white'
                          : 'school-subtle'
                      }`}
                    >
                      <span className="block font-bold text-xs">{title}</span>
                      <span className="block text-[10px] font-semibold opacity-85 mt-0.5">{sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 mb-2">
                  Règle du sursis (pile au seuil)
                </p>
                <div className={`grid ${config.limit === 50 ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
                  {[
                    {
                      id: 'half',
                      title: 'Divisé par 2',
                      sub: `(→ ${Math.floor((config.limit || 100) / 2)} pts)`,
                    },
                    ...(config.limit === 50
                      ? [{ id: 'zero', title: 'Remis à 0', sub: '(0 pt)' }]
                      : []),
                    { id: 'none', title: 'Sans sursis' },
                  ].map(opt => {
                    const active =
                      (config.sursis !== false && (config.sursisType || 'half') === opt.id) ||
                      (config.sursis === false && opt.id === 'none')
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setConfig(c => ({
                            ...c,
                            sursis: opt.id !== 'none',
                            sursisType: opt.id === 'none' ? 'none' : opt.id,
                          }))
                        }
                        className={`py-2 px-1 text-center rounded-xl border transition-colors focus:outline-none cursor-pointer ${
                          active
                            ? 'border-[#c83b3b] bg-[#c83b3b]/15 text-[#c83b3b]'
                            : 'school-subtle'
                        }`}
                      >
                        <span className="block font-bold text-xs leading-tight">{opt.title}</span>
                        {opt.sub && (
                          <span className="block text-[10px] font-semibold opacity-85 leading-tight mt-0.5">
                            {opt.sub}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
                <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-2 leading-relaxed">
                  {config.sursis !== false
                    ? `Si un joueur atteint exactement ${config.limit || 100} pts, son score retombe à ${
                        config.sursisType === 'zero' ? 0 : Math.floor((config.limit || 100) / 2)
                      } pts au lieu d'être éliminé.`
                    : "Aucun sursis : atteindre ou dépasser le seuil élimine le joueur."}
                </p>
              </div>
            </div>
          )}

          {/* Config spécifique Universel */}
          {gameType === 'universel' && (
            <div className="space-y-4 pt-2 border-t border-stone-200/70 dark:border-slate-800/70">
              {/* Modèles personnalisés sauvegardés */}
              {customPresets && customPresets.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 mb-2 flex items-center gap-1.5">
                    <Bookmark size={13} className="text-[#c83b3b]" /> Vos modèles enregistrés
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {customPresets.map(preset => (
                      <div
                        key={preset.id}
                        className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/80 text-xs font-semibold hover:border-[#c83b3b] transition-all group"
                      >
                        <button
                          type="button"
                          onClick={() => loadPresetIntoConfig(preset)}
                          className="text-stone-800 dark:text-slate-200 hover:text-[#c83b3b] transition-colors cursor-pointer"
                        >
                          {preset.name}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            deletePreset(preset.id)
                          }}
                          title="Supprimer ce modèle"
                          className="p-1 rounded-full text-stone-400 hover:text-red-500 hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Champ Nom du jeu */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 mb-2 block">
                  Nom du jeu
                </label>
                <input
                  type="text"
                  placeholder="Ex: Cabo, Tamalou, Golf, Skyjo..."
                  value={customGameName}
                  onChange={(e) => setCustomGameName(e.target.value)}
                  maxLength={30}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-stone-900 dark:text-slate-100 placeholder-stone-400 focus:outline-none focus:border-[#c83b3b]"
                />
              </div>

              {/* Règle de victoire */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 mb-2">
                  Règle de victoire
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { value: 'high', label: 'Score le plus élevé gagne' },
                    { value: 'low_limit', label: 'Le premier à X points perd (seuil)' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setConfig(c => ({ ...c, scoreDir: opt.value }))}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold text-left border transition-colors focus:outline-none cursor-pointer ${
                        (config.scoreDir || 'high') === opt.value
                          ? 'border-[#c83b3b] bg-[#c83b3b] text-white font-bold'
                          : 'school-subtle'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Seuil si low_limit */}
              {config.scoreDir === 'low_limit' && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 mb-2">
                    Seuil de fin de partie
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {[50, 100, 150, 200].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setConfig(c => ({ ...c, limit: val }))}
                        className={`py-2 rounded-xl text-xs font-bold border transition-colors focus:outline-none cursor-pointer ${
                          (config.limit || 100) === val
                            ? 'border-[#c83b3b] bg-[#c83b3b] text-white'
                            : 'school-subtle'
                        }`}
                      >
                        {val} pts
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Règle spécifique de palier modulable (Cabo / Tamalou / etc.) */}
              <div className="pt-2 border-t border-stone-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={15} className="text-[#c83b3b]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-slate-300">
                      Règle de palier spécifique
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setConfig(c => {
                        const currentRule = c.specialRule || { enabled: false, target: c.limit || 100, action: 'divide', value: 2 }
                        return {
                          ...c,
                          specialRule: {
                            ...currentRule,
                            enabled: !currentRule.enabled,
                            target: currentRule.target || c.limit || 100,
                          }
                        }
                      })
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                      config.specialRule?.enabled
                        ? 'bg-[#c83b3b] text-white border-[#c83b3b]'
                        : 'border-stone-300 dark:border-slate-700 text-stone-500 dark:text-slate-400 hover:border-stone-400'
                    }`}
                  >
                    {config.specialRule?.enabled ? 'Activée' : 'Désactivée'}
                  </button>
                </div>

                {config.specialRule?.enabled && (
                  <div className="p-3 rounded-xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-slate-700/80 space-y-3">
                    {/* Score cible */}
                    <div>
                      <label className="text-[11px] font-bold text-stone-600 dark:text-slate-300 uppercase tracking-wide block mb-1">
                        Si un joueur atteint exactement :
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex gap-1.5">
                          {[50, 100, 150, 200].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setConfig(c => ({
                                ...c,
                                specialRule: { ...c.specialRule, target: val }
                              }))}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                (config.specialRule?.target ?? 100) === val
                                  ? 'border-[#c83b3b] bg-[#c83b3b] text-white'
                                  : 'border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-700 dark:text-slate-300'
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 w-20">
                          <input
                            type="number"
                            min="1"
                            max="9999"
                            value={config.specialRule?.target ?? 100}
                            onChange={e => {
                              const val = parseInt(e.target.value, 10)
                              setConfig(c => ({
                                ...c,
                                specialRule: { ...c.specialRule, target: isNaN(val) ? '' : val }
                              }))
                            }}
                            className="w-full px-2 py-1.5 text-center text-xs font-bold rounded-lg border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-slate-100 focus:outline-none focus:border-[#c83b3b]"
                          />
                          <span className="text-[11px] font-semibold text-stone-400">pts</span>
                        </div>
                      </div>
                    </div>

                    {/* Action */}
                    <div>
                      <label className="text-[11px] font-bold text-stone-600 dark:text-slate-300 uppercase tracking-wide block mb-1">
                        Effet sur ses points :
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: 'divide', label: 'Diviser par', icon: '÷' },
                          { id: 'multiply', label: 'Multiplier par', icon: '×' },
                          { id: 'set', label: 'Ramener à', icon: '=' },
                        ].map(act => (
                          <button
                            key={act.id}
                            type="button"
                            onClick={() => setConfig(c => {
                              const currentAction = c.specialRule?.action || 'divide'
                              let defVal = c.specialRule?.value ?? 2
                              if (act.id === 'set' && currentAction !== 'set') defVal = 0
                              if (act.id !== 'set' && currentAction === 'set') defVal = 2
                              return {
                                ...c,
                                specialRule: { ...c.specialRule, action: act.id, value: defVal }
                              }
                            })}
                            className={`py-2 px-1 text-center rounded-lg text-xs font-bold border transition-colors ${
                              (config.specialRule?.action || 'divide') === act.id
                                ? 'border-[#c83b3b] bg-[#c83b3b]/15 text-[#c83b3b] dark:text-red-300 font-extrabold'
                                : 'border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-700 dark:text-slate-300'
                            }`}
                          >
                            <span className="block text-sm leading-none mb-0.5">{act.icon}</span>
                            <span className="block text-[11px] leading-tight">{act.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Valeur de l'effet */}
                    <div>
                      <label className="text-[11px] font-bold text-stone-600 dark:text-slate-300 uppercase tracking-wide block mb-1">
                        {config.specialRule?.action === 'divide' && 'Diviseur :'}
                        {config.specialRule?.action === 'multiply' && 'Multiplicateur :'}
                        {config.specialRule?.action === 'set' && 'Nouveau score fixe :'}
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex gap-1.5">
                          {(config.specialRule?.action === 'divide' ? [2, 3, 4] :
                            config.specialRule?.action === 'multiply' ? [2, 3, 5] :
                            [0, 25, 50]
                          ).map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setConfig(c => ({
                                ...c,
                                specialRule: { ...c.specialRule, value: val }
                              }))}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                (config.specialRule?.value ?? (config.specialRule?.action === 'set' ? 0 : 2)) === val
                                  ? 'border-[#c83b3b] bg-[#c83b3b] text-white'
                                  : 'border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-700 dark:text-slate-300'
                              }`}
                            >
                              {config.specialRule?.action === 'divide' ? `÷${val}` :
                               config.specialRule?.action === 'multiply' ? `×${val}` :
                               `${val} pts`}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 w-20">
                          <input
                            type="number"
                            min="0"
                            max="9999"
                            value={config.specialRule?.value ?? (config.specialRule?.action === 'set' ? 0 : 2)}
                            onChange={e => {
                              const val = parseInt(e.target.value, 10)
                              setConfig(c => ({
                                ...c,
                                specialRule: { ...c.specialRule, value: isNaN(val) ? '' : val }
                              }))
                            }}
                            className="w-full px-2 py-1.5 text-center text-xs font-bold rounded-lg border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-slate-100 focus:outline-none focus:border-[#c83b3b]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Aperçu dynamique */}
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] leading-relaxed text-amber-900 dark:text-amber-200">
                      <span className="font-bold">Effet en jeu : </span>
                      {(() => {
                        const tgt = config.specialRule?.target || 100
                        const act = config.specialRule?.action || 'divide'
                        const val = config.specialRule?.value ?? (act === 'set' ? 0 : 2)
                        let result = tgt
                        if (act === 'divide') result = Math.floor(tgt / (val || 1))
                        if (act === 'multiply') result = tgt * val
                        if (act === 'set') result = val
                        return `Si un joueur atteint exactement ${tgt} pts, ses points deviennent ${result} pts !`
                      })()}
                    </div>
                  </div>
                )}

                {/* Bouton pour enregistrer le modèle */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleSaveCurrentAsPreset}
                    className="w-full py-2.5 px-3 rounded-xl border border-stone-300 dark:border-slate-700 hover:border-[#c83b3b] dark:hover:border-[#c83b3b] text-stone-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-all bg-white dark:bg-slate-800"
                  >
                    <BookmarkPlus size={15} className="text-[#c83b3b]" />
                    Enregistrer ces règles comme modèle
                  </button>

                  {savedSuccessMsg && (
                    <div className="mt-2 p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold text-center flex items-center justify-center gap-1.5 animate-fadeIn">
                      <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                      {savedSuccessMsg}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Config spécifique Belote / Coinche */}
          {gameType === 'belote' && (
            <div className="space-y-4 pt-2 border-t border-stone-200/70 dark:border-slate-800/70">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 mb-2">
                  Objectif de points pour la victoire
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {[500, 1000, 1500, 2000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setConfig(c => ({ ...c, limit: val }))}
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors focus:outline-none cursor-pointer ${
                        (config.limit || 1000) === val
                          ? 'border-[#c83b3b] bg-[#c83b3b] text-white'
                          : 'school-subtle'
                      }`}
                    >
                      {val} pts
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setShowCreator(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl border border-stone-300 dark:border-slate-700 text-xs sm:text-sm font-semibold text-stone-700 dark:text-slate-300 hover:border-[#c83b3b] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus size={15} /> Ajouter
            </button>
            <button
              type="button"
              onClick={handleStart}
              disabled={!canStart}
              className="flex-1 py-3 px-2 rounded-xl font-bold disabled:opacity-40 btn-margin-red flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[46px]"
            >
              {launchAsLiveTable && (
                <Radio size={15} className="animate-pulse shrink-0" />
              )}
              {gameType === 'belote' ? (
                selectedPlayers.length === 4 ? (
                  <>
                    <span className="text-xs sm:text-sm font-bold truncate">
                      {launchAsLiveTable
                        ? (beloteVariant === 'coinche' ? 'Lancer en direct (Coinche)' : 'Lancer en direct (Belote)')
                        : (beloteVariant === 'coinche' ? 'Lancer la Coinche' : 'Lancer la Belote')}
                    </span>
                    <span className="text-[11px] font-semibold opacity-85 shrink-0">
                      (2 éq.)
                    </span>
                  </>
                ) : (
                  <span className="text-xs sm:text-sm font-bold truncate">
                    4 joueurs requis ({selectedPlayers.length}/4)
                  </span>
                )
              ) : (
                <span className="text-xs sm:text-sm font-bold truncate">
                  {launchAsLiveTable ? 'Lancer en direct' : 'Lancer'} ({selectedPlayers.length}/{meta.minPlayers}+)
                </span>
              )}
            </button>
          </div>
        </div>
      </BottomSheet>

      <PlayerCreatorSheet
        open={showCreator}
        onClose={() => setShowCreator(false)}
        onAdd={handleAddNew}
      />

      {/* Modale de remplacement quand les équipes sont complètes */}
      {playerToReplaceCandidate && (
        <div
          className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPlayerToReplaceCandidate(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-[#faf9f5] dark:bg-[#1d2024] border border-stone-200 dark:border-slate-800 shadow-2xl p-4 sm:p-5 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            {/* En-tête */}
            <div className="flex items-center justify-between pb-1 border-b border-stone-200/80 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#c83b3b]/10 flex items-center justify-center text-[#c83b3b]">
                  <ArrowLeftRight size={15} />
                </div>
                <div>
                  <h3 className="font-serif-title text-base font-bold text-stone-900 dark:text-slate-100 leading-tight">
                    {gameType === 'belote' ? 'Équipes complètes' : 'Nombre max atteint'}
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400">
                    Qui voulez-vous remplacer ?
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPlayerToReplaceCandidate(null)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Nouveau joueur entrant */}
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700/60 shadow-2xs">
              <Avatar player={playerToReplaceCandidate} size="sm" />
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-stone-400 dark:text-slate-500 block">
                  Nouveau joueur entrant
                </span>
                <span className="text-xs sm:text-sm font-bold text-stone-900 dark:text-slate-100 truncate block">
                  {playerToReplaceCandidate.name}
                </span>
              </div>
            </div>

            {/* Choix du joueur à remplacer */}
            {gameType === 'belote' ? (
              <div className="space-y-3">
                {/* Équipe 1 (Rouge) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#c83b3b] dark:text-rose-400 flex items-center gap-1">
                      Équipe 1 (Rouge)
                    </span>
                    <span className="text-[10px] text-stone-400">2 joueurs</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {team1Players.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleReplacePlayer(p, playerToReplaceCandidate)}
                        className="flex items-center gap-2 p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/90 dark:bg-slate-800/60 hover:border-[#c83b3b] hover:bg-[#c83b3b]/10 text-stone-900 dark:text-slate-100 text-left transition-all cursor-pointer group active:scale-95 shadow-2xs"
                      >
                        <Avatar player={p} size="xs" />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold truncate block group-hover:text-[#c83b3b] dark:group-hover:text-rose-400">
                            {p.name}
                          </span>
                          <span className="text-[9px] text-stone-400 group-hover:text-[#c83b3b]/80">
                            Remplacer
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Équipe 2 (Bleu) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1e3a5f] dark:text-sky-400 flex items-center gap-1">
                      Équipe 2 (Bleu)
                    </span>
                    <span className="text-[10px] text-stone-400">2 joueurs</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {team2Players.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleReplacePlayer(p, playerToReplaceCandidate)}
                        className="flex items-center gap-2 p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/90 dark:bg-slate-800/60 hover:border-[#1e3a5f] hover:bg-[#1e3a5f]/10 text-stone-900 dark:text-slate-100 text-left transition-all cursor-pointer group active:scale-95 shadow-2xs"
                      >
                        <Avatar player={p} size="xs" />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold truncate block group-hover:text-[#1e3a5f] dark:group-hover:text-sky-400">
                            {p.name}
                          </span>
                          <span className="text-[9px] text-stone-400 group-hover:text-[#1e3a5f]/80">
                            Remplacer
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 dark:text-slate-500">
                  Joueur à remplacer
                </span>
                <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto scrollbar-hide p-0.5">
                  {selectedPlayers.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleReplacePlayer(p, playerToReplaceCandidate)}
                      className="flex items-center gap-2 p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/90 dark:bg-slate-800/60 hover:border-[#c83b3b] hover:bg-[#c83b3b]/10 text-stone-900 dark:text-slate-100 text-left transition-all cursor-pointer group active:scale-95 shadow-2xs"
                    >
                      <Avatar player={p} size="xs" />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold truncate block group-hover:text-[#c83b3b]">
                          {p.name}
                        </span>
                        <span className="text-[9px] text-stone-400 group-hover:text-[#c83b3b]/80">
                          Remplacer
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bouton Annuler */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setPlayerToReplaceCandidate(null)}
                className="w-full py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-xs font-bold text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
