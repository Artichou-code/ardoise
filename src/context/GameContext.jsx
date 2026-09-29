import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import {
  saveGame, loadGames, deleteGame,
  savePlayers, loadPlayers,
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
  pushGameToLiveSession
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
  const lastSessionSignatureRef = useRef('')

  const activeGame = (Array.isArray(games) ? games : []).find(g => g && g.id === activeGameId) || null

  // Sync players to storage
  useEffect(() => { savePlayers(players) }, [players])

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
    const checkLiveSession = async () => {
      const current = getActiveSession()
      if (!current || !current.code) return

      try {
        const data = await fetchLiveSession(current.code)
        const remoteGames = Array.isArray(data?.state?.games) ? data.state.games : []
        const isClosed = Boolean(data?.closed || data?.state?.closed)

        const sig = `${isClosed}-${remoteGames.map(g => `${g.id}:${g.rounds?.length || 0}:${g.status}`).join(',')}`
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
    const interval = setInterval(checkLiveSession, 4500)
    return () => clearInterval(interval)
  }, [reloadStorage])

  // Save game helper
  const persistGame = useCallback((game) => {
    if (!game || !game.id) return
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
    persistGame(game)
    setActiveGameId(game.id)
    setScreen('game')

    const liveSession = getActiveSession()
    if (liveSession && liveSession.code) {
      pushGameToLiveSession(liveSession.code, game).catch(() => {})
    }

    return game
  }, [persistGame])

  // Mettre à jour les scores (avec undo)
  const updateScores = useCallback((roundData) => {
    if (!activeGame) return
    // Snapshot pour undo
    historyRef.current = [...historyRef.current, { ...activeGame }]
    const updated = {
      ...activeGame,
      scores: roundData.scores,
      rounds: [...activeGame.rounds, roundData],
      updatedAt: Date.now(),
    }
    persistGame(updated)

    const liveSession = getActiveSession()
    if (liveSession && liveSession.code) {
      pushGameToLiveSession(liveSession.code, updated).catch(() => {})
    }
  }, [activeGame, persistGame])

  // Undo
  const undoLastRound = useCallback(() => {
    if (!historyRef.current.length) return false
    const prev = historyRef.current.pop()
    persistGame(prev)
    return true
  }, [persistGame])

  // Terminer la partie
  const finishGame = useCallback((winnerId) => {
    if (!activeGame) return
    const updated = {
      ...activeGame,
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
    if (!activeGame) return
    createGame(activeGame.type, activeGame.players, activeGame.config)
  }, [activeGame, createGame])

  // Quitter la partie
  const exitGame = useCallback(() => {
    setActiveGameId(null)
    setScreen('home')
  }, [])

  // Supprimer une partie de l'historique
  const removeGame = useCallback((id) => {
    deleteGame(id)
    setGames(prev => prev.filter(g => g.id !== id))
    if (activeGameId === id) {
      setActiveGameId(null)
      setScreen('home')
    }
  }, [activeGameId])

  // Reprendre une partie
  const resumeGame = useCallback((id) => {
    setActiveGameId(id)
    setScreen('game')
  }, [])

  // Gestion joueurs
  const savePlayer = useCallback((player) => {
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
  }, [])

  const removePlayer = useCallback((id) => {
    setPlayers(prev => prev.filter(p => p.id !== id))
  }, [])

  // Gestion modèles personnalisés
  const savePreset = useCallback((preset) => {
    const updated = saveCustomPreset(preset)
    setCustomPresets(updated)
    return updated
  }, [])

  const deletePreset = useCallback((id) => {
    const updated = deleteCustomPreset(id)
    setCustomPresets(updated)
    return updated
  }, [])

  const canUndo = historyRef.current.length > 0

  return (
    <GameContext.Provider value={{
      players, savePlayer, removePlayer,
      games, activeGame, activeGameId,
      customPresets, savePreset, deletePreset,
      screen, setScreen,
      createGame, updateScores, undoLastRound, canUndo,
      finishGame, rematch, exitGame, removeGame, resumeGame,
      reloadStorage,
      liveSessionNotice, setLiveSessionNotice,
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
