import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import {
  saveGame, loadGames, deleteGame, loadDeletedGameIds,
  savePlayers, loadPlayers, deletePlayer, untombstonePlayer,
  saveActiveGameId, loadActiveGameId,
  saveCustomPreset, deleteCustomPreset, loadCustomPresets,
  generateId
} from '../store/storage'
import {
  getSyncKey,
  isAutoSyncEnabled,
  pushNotebookToCloud,
  synchronizeNotebook
} from '../store/syncStorage'
import {
  getActiveSession,
  fetchLiveSession,
  syncSessionGamesToLocal,
  clearActiveSession,
  pushGameToLiveSession,
  removeGameFromLiveSession,
  createLiveSessionFromGame
} from '../store/liveSession'
import { GAME_META } from '../constants/games'

const GameContext = createContext(null)

const sortPlayersAlpha = (list) => {
  if (!Array.isArray(list)) return []
  return list
    .filter(p => p && typeof p === 'object' && p.name)
    .sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', 'fr', { sensitivity: 'base' })
    )
}

export function GameProvider({ children }) {
  const [players, setPlayers] = useState(() => sortPlayersAlpha(loadPlayers()))
  const [games, setGames] = useState(() => loadGames())
  const [customPresets, setCustomPresets] = useState(() => loadCustomPresets())
  const [activeGameId, setActiveGameId] = useState(() => loadActiveGameId())
  const [screen, setScreen] = useState('home') // home | game | history | victory | stats | players
  const [liveSessionNotice, setLiveSessionNotice] = useState(null)
  const historyRef = useRef([]) // undo stack
  const [, setHistoryTick] = useState(0)
  const lastSessionSignatureRef = useRef('')

  const activeGame = (Array.isArray(games) ? games : []).find(g => g && g.id === activeGameId) || null
  const activeGameRef = useRef(activeGame)
  activeGameRef.current = activeGame

  // Sync players to storage
  useEffect(() => { savePlayers(players) }, [players])

  // Synchroniser automatiquement les profils (noms, avatars, couleurs) dans toutes les parties
  useEffect(() => {
    if (!Array.isArray(games) || !Array.isArray(players) || players.length === 0) return
    const playerMap = new Map(players.map(p => [p.id, p]))

    let anyGameChanged = false
    const nextGames = games.map(g => {
      if (!g || !Array.isArray(g.players)) return g
      let gameChanged = false
      const nextPlayers = g.players.map(p => {
        const latest = playerMap.get(p.id)
        if (latest && (latest.name !== p.name || latest.avatar !== p.avatar || latest.color !== p.color)) {
          gameChanged = true
          return { ...p, name: latest.name, avatar: latest.avatar, color: latest.color }
        }
        return p
      })
      if (gameChanged) {
        anyGameChanged = true
        const updatedGame = { ...g, players: nextPlayers, updatedAt: new Date().toISOString() }
        if (g.id === activeGameId) {
          const liveSession = getActiveSession()
          if (liveSession?.code) {
            pushGameToLiveSession(liveSession.code, updatedGame).catch(() => {})
          }
        }
        return updatedGame
      }
      return g
    })

    if (anyGameChanged) {
      setGames(nextGames)
    }
  }, [players, activeGameId])

  // Sync activeGameId to storage
  useEffect(() => { saveActiveGameId(activeGameId) }, [activeGameId])

  // Recharger le state React depuis le storage après une synchronisation
  const reloadStorage = useCallback(() => {
    setPlayers(sortPlayersAlpha(loadPlayers()))
    setGames(loadGames())
    setCustomPresets(loadCustomPresets())
    setActiveGameId(loadActiveGameId())
  }, [])

  // Auto-synchronisation au démarrage
  useEffect(() => {
    const key = getSyncKey()
    if (key && isAutoSyncEnabled()) {
      synchronizeNotebook(key)
        .then(() => reloadStorage())
        .catch(() => {})
    }
  }, [reloadStorage])

  // Synchronisation automatique en arrière-plan si une Table en direct est active
  useEffect(() => {
    let isMounted = true

    const checkLiveSession = async () => {
      const current = getActiveSession()
      if (!current || !current.code) return

      try {
        const data = await fetchLiveSession(current.code)
        if (!isMounted) return
        const deletedIds = new Set(loadDeletedGameIds())
        const remoteGames = (Array.isArray(data?.state?.games) ? data.state.games : [])
          .filter(g => g && g.id && !deletedIds.has(g.id))
        const isClosed = Boolean(data?.closed || data?.state?.closed)

        const sig = `${isClosed}-${remoteGames.map(g => `${g.id}:${g.rounds?.length || 0}:${g.status}:${g.updatedAt || 0}:${JSON.stringify(g.scores || {})}`).join('|')}`
        if (sig !== lastSessionSignatureRef.current) {
          lastSessionSignatureRef.current = sig
          const stats = syncSessionGamesToLocal(data)
          reloadStorage()

          if (isClosed) {
            clearActiveSession()
            const count = stats.syncedCount || remoteGames.length
            setLiveSessionNotice(
              count > 0
                ? `La table «\u00A0${current.name}\u00A0» a été clôturée. ${count} partie${count > 1 ? 's ont été enregistrées' : ' a été enregistrée'} dans votre carnet\u00A0!`
                : `La table «\u00A0${current.name}\u00A0» a été clôturée par l'hôte.`
            )
          }
        }
      } catch {
        // Ignorer les erreurs réseau temporaires
      }
    }

    checkLiveSession()

    // Polling accéléré (1,2s) en cours de partie pour une réactivité instantanée, 3s sur les autres écrans
    const pollInterval = screen === 'game' ? 1200 : 3000
    const interval = setInterval(checkLiveSession, pollInterval)

    // Réveil immédiat au déverrouillage ou retour sur l'onglet mobile
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkLiveSession()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      isMounted = false
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [screen, reloadStorage])

  // Save game helper
  const persistGame = useCallback((game) => {
    if (!game || !game.id) return
    activeGameRef.current = game
    saveGame(game)
    setGames(prev => {
      const currentList = Array.isArray(prev) ? prev : []
      const idx = currentList.findIndex(g => g && g.id === game.id)
      if (idx >= 0) {
        const next = [...currentList]
        next[idx] = game
        return next
      }
      return [game, ...currentList]
    })
  }, [])

  // Créer une nouvelle partie
  const createGame = useCallback((gameType, gamePlayers, config = {}) => {
    const meta = GAME_META[gameType]
    const game = {
      id: generateId(),
      type: gameType,
      name: config.customGameName?.trim() || meta.name,
      players: gamePlayers,
      scores: Object.fromEntries(gamePlayers.map(p => [p.id, 0])),
      rounds: [],
      config,
      status: 'active', // active | finished
      winner: null,
      startedAt: Date.now(),
      updatedAt: Date.now(),
    }
    historyRef.current = []
    setHistoryTick(t => t + 1)
    persistGame(game)
    setActiveGameId(game.id)
    setScreen('game')

    const liveSession = getActiveSession()
    if (liveSession && liveSession.code) {
      pushGameToLiveSession(liveSession.code, game).catch(() => {})
    }

    return game
  }, [persistGame])

  // Mettre à jour les scores
  const updateScores = useCallback((roundData) => {
    const current = activeGameRef.current || activeGame
    if (!current) return
    // Snapshot pour correction éventuelle de la manche
    historyRef.current = [...historyRef.current, {
      ...current,
      restoredDelta: null,
      restoredRound: null,
      correctionBackup: null,
      isCorrection: false,
    }]
    setHistoryTick(t => t + 1)
    const updated = {
      ...current,
      scores: roundData.scores,
      rounds: [...current.rounds, { ...roundData, savedAt: Date.now() }],
      restoredDelta: null,
      restoredRound: null,
      correctionBackup: null,
      isCorrection: false,
      updatedAt: Date.now(),
    }
    persistGame(updated)

    const liveSession = getActiveSession()
    if (liveSession && liveSession.code) {
      pushGameToLiveSession(liveSession.code, updated).catch(() => {})
    }
    return updated
  }, [activeGame, persistGame])

  // Revenir sur la dernière manche pour modification (correction avec pré-remplissage)
  const undoLastRound = useCallback(() => {
    const current = activeGameRef.current || activeGame
    if (!current || (!historyRef.current.length && (!current.rounds || current.rounds.length === 0))) {
      return false
    }

    let prev = historyRef.current.length > 0 ? historyRef.current.pop() : null
    const lastRound = current.rounds[current.rounds.length - 1]
    const delta = lastRound?.delta || lastRound?.penalties || lastRound?.scores || null

    if (!prev) {
      // Reconstituer l'état précédent si l'historique en mémoire est vide (ex: après un rafraîchissement)
      const prevRounds = current.rounds.slice(0, -1)
      let prevScores = {}
      if (prevRounds.length > 0) {
        prevScores = { ...prevRounds[prevRounds.length - 1].scores }
      } else {
        prevScores = Object.fromEntries(current.players.map(p => [p.id, 0]))
      }
      prev = {
        ...current,
        rounds: prevRounds,
        scores: prevScores,
        isCorrection: false,
        restoredDelta: null,
      }
    }

    const restoredGame = {
      ...prev,
      restoredRound: lastRound || null,
      restoredDelta: delta,
      correctionBackup: {
        scores: { ...current.scores },
        rounds: [...current.rounds],
        status: current.status || 'playing',
      },
      isCorrection: true,
      updatedAt: Date.now(),
    }
    persistGame(restoredGame)
    setHistoryTick(t => t + 1)

    const liveSession = getActiveSession()
    if (liveSession && liveSession.code) {
      pushGameToLiveSession(liveSession.code, restoredGame).catch(() => {})
    }
    return true
  }, [activeGame, persistGame])

  // Annuler la modification en cours et rétablir la manche telle qu'elle était
  const cancelCorrection = useCallback(() => {
    const current = activeGameRef.current || activeGame
    if (!current || !current.isCorrection) return false

    // Remettre un snapshot dans historyRef pour pouvoir modifier à nouveau si désiré
    const historySnapshot = {
      ...current,
      scores: current.scores,
      rounds: current.rounds,
      isCorrection: false,
      restoredRound: null,
      restoredDelta: null,
      correctionBackup: null,
    }
    historyRef.current = [...historyRef.current, historySnapshot]

    let restoredScores = current.correctionBackup?.scores
    let restoredRounds = current.correctionBackup?.rounds

    // Fallback si correctionBackup n'était pas stocké
    if (!restoredRounds && current.restoredRound) {
      restoredRounds = [...current.rounds, current.restoredRound]
      restoredScores = current.restoredRound.scores || current.scores
    }

    const restoredGame = {
      ...current,
      scores: restoredScores || current.scores,
      rounds: restoredRounds || current.rounds,
      status: current.correctionBackup?.status || current.status || 'playing',
      isCorrection: false,
      restoredRound: null,
      restoredDelta: null,
      correctionBackup: null,
      updatedAt: Date.now(),
    }

    persistGame(restoredGame)
    setHistoryTick(t => t + 1)

    if (isAutoSyncEnabled() && getSyncKey()) {
      pushNotebookToCloud().catch(() => {})
    }
    const liveSession = getActiveSession()
    if (liveSession && liveSession.code) {
      pushGameToLiveSession(liveSession.code, restoredGame).catch(() => {})
    }
    return true
  }, [activeGame, persistGame])

  // Terminer la partie
  const finishGame = useCallback((winnerId) => {
    const current = activeGameRef.current || activeGame
    if (!current) return
    const updated = {
      ...current,
      status: 'finished',
      winner: winnerId,
      finishedAt: Date.now(),
    }
    persistGame(updated)
    setScreen('victory')

    // Push cloud en arrière-plan si activé
    if (isAutoSyncEnabled() && getSyncKey()) {
      pushNotebookToCloud().catch(() => {})
    }

    // Push vers la session journée en cours si active
    const liveSession = getActiveSession()
    if (liveSession && liveSession.code) {
      pushGameToLiveSession(liveSession.code, updated).catch(() => {})
    }
  }, [activeGame, persistGame])

  // Revanche
  const rematch = useCallback(() => {
    const current = activeGameRef.current || activeGame
    if (!current) return
    createGame(current.type, current.players, current.config)
  }, [activeGame, createGame])

  // Quitter la partie
  const exitGame = useCallback(() => {
    historyRef.current = []
    setHistoryTick(t => t + 1)
    setActiveGameId(null)
    setScreen('home')
  }, [])


  // Supprimer une partie de l'historique
  const removeGame = useCallback((id) => {
    deleteGame(id)
    setGames(prev => prev.filter(g => g.id !== id))
    if (activeGameId === id) {
      setActiveGameId(null)
      setScreen(prev => (prev === 'game' ? 'home' : prev))
    }

    // 1. Pousser immédiatement vers le Cloud si auto-sync activé
    if (isAutoSyncEnabled() && getSyncKey()) {
      pushNotebookToCloud().catch(() => {})
    }

    // 2. Retirer de la session en direct si active
    const liveSession = getActiveSession()
    if (liveSession && liveSession.code) {
      removeGameFromLiveSession(liveSession.code, id).catch(() => {})
    }
  }, [activeGameId])

  // Reprendre une partie
  const resumeGame = useCallback((id) => {
    historyRef.current = []
    setHistoryTick(t => t + 1)
    setActiveGameId(id)
    setScreen('game')
  }, [])

  // Gestion joueurs
  const savePlayer = useCallback((player) => {
    if (!player) return
    untombstonePlayer(player.id, player.name)
    setPlayers(prev => {
      const idx = prev.findIndex(p => p.id === player.id)
      let next
      if (idx >= 0) {
        next = [...prev]
        next[idx] = player
      } else {
        next = [...prev, player]
      }
      return sortPlayersAlpha(next)
    })

    // Mettre à jour immédiatement les parties actives et enregistrées avec le nouveau profil
    setGames(prevGames => {
      let anyChanged = false
      const nextGames = prevGames.map(g => {
        if (!g.players?.some(p => p.id === player.id)) return g
        anyChanged = true
        return {
          ...g,
          players: g.players.map(p => (p.id === player.id ? { ...p, ...player } : p)),
          updatedAt: new Date().toISOString(),
        }
      })
      return anyChanged ? nextGames : prevGames
    })

    if (isAutoSyncEnabled() && getSyncKey()) {
      pushNotebookToCloud().catch(() => {})
    }
  }, [])

  const removePlayer = useCallback((id) => {
    let deletedPlayer = null
    setPlayers(prev => {
      deletedPlayer = prev.find(p => p.id === id)
      return prev.filter(p => p.id !== id)
    })
    deletePlayer(id, deletedPlayer?.name)

    // Pousser immédiatement vers le Cloud si auto-sync activé
    if (isAutoSyncEnabled() && getSyncKey()) {
      pushNotebookToCloud().catch(() => {})
    }
  }, [])

  // Gestion modèles personnalisés
  const savePreset = useCallback((preset) => {
    const updated = saveCustomPreset(preset)
    setCustomPresets(updated)
    if (isAutoSyncEnabled() && getSyncKey()) {
      pushNotebookToCloud().catch(() => {})
    }
    return updated
  }, [])

  const deletePreset = useCallback((id) => {
    const updated = deleteCustomPreset(id)
    setCustomPresets(updated)
    if (isAutoSyncEnabled() && getSyncKey()) {
      pushNotebookToCloud().catch(() => {})
    }
    return updated
  }, [])

  // Créer et basculer instantanément en Table en direct avec la partie en cours
  const startLiveSessionForGame = useCallback(async (game) => {
    const targetGame = game || activeGameRef.current || activeGame
    if (!targetGame) throw new Error('Aucune partie active')
    const sessionCode = await createLiveSessionFromGame(targetGame)
    const current = getActiveSession()
    if (current && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ardoise-live-session-changed', { detail: current }))
    }
    return sessionCode
  }, [activeGame])

  const canUndo = Boolean(
    activeGame &&
    activeGame.rounds?.length > 0 &&
    !activeGame.isCorrection
  )

  return (
    <GameContext.Provider value={{
      players, savePlayer, removePlayer,
      games, activeGame, activeGameId,
      customPresets, savePreset, deletePreset,
      screen, setScreen,
      createGame, updateScores, undoLastRound, cancelCorrection, canUndo,
      finishGame, rematch, exitGame, removeGame, resumeGame,
      reloadStorage,
      liveSessionNotice, setLiveSessionNotice,
      startLiveSessionForGame,
    }}>
      {children}
    </GameContext.Provider>
  )
}

export const useGame = () => {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used inside GameProvider')
  return ctx
}
