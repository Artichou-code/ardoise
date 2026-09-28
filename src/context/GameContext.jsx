import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import {
  saveGame, loadGames, deleteGame,
  savePlayers, loadPlayers,
  saveActiveGameId, loadActiveGameId,
  generateId
} from '../store/storage'
import { GAME_META } from '../constants/games'

const GameContext = createContext(null)

export function GameProvider({ children }) {
  const [players, setPlayers] = useState(() => loadPlayers())
  const [games, setGames] = useState(() => loadGames())
  const [activeGameId, setActiveGameId] = useState(() => loadActiveGameId())
  const [screen, setScreen] = useState('home') // home | game | history | victory
  const historyRef = useRef([]) // undo stack

  const activeGame = games.find(g => g.id === activeGameId) || null

  // Sync players to storage
  useEffect(() => { savePlayers(players) }, [players])

  // Sync activeGameId to storage
  useEffect(() => { saveActiveGameId(activeGameId) }, [activeGameId])

  // Save game helper
  const persistGame = useCallback((game) => {
    saveGame(game)
    setGames(prev => {
      const idx = prev.findIndex(g => g.id === game.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = game
        return next
      }
      return [game, ...prev]
    })
  }, [])

  // Créer une nouvelle partie
  const createGame = useCallback((gameType, gamePlayers, config = {}) => {
    const meta = GAME_META[gameType]
    const game = {
      id: generateId(),
      type: gameType,
      name: meta.name,
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
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = player
        return next
      }
      return [player, ...prev]
    })
  }, [])

  const removePlayer = useCallback((id) => {
    setPlayers(prev => prev.filter(p => p.id !== id))
  }, [])

  const canUndo = historyRef.current.length > 0

  return (
    <GameContext.Provider value={{
      players, savePlayer, removePlayer,
      games, activeGame, activeGameId,
      screen, setScreen,
      createGame, updateScores, undoLastRound, canUndo,
      finishGame, rematch, exitGame, removeGame, resumeGame,
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
