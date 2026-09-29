import { useState, useEffect } from 'react'
import { useGame } from './context/GameContext'
import { HomeScreen } from './components/HomeScreen'
import { GameScreen } from './components/GameScreen'
import { VictoryScreen } from './components/VictoryScreen'
import { HistoryScreen } from './components/HistoryScreen'
import { StatsScreen } from './components/StatsScreen'
import { PlayersScreen } from './components/PlayersScreen'
import { PullToRefreshIndicator } from './components/ui/PullToRefresh'
import { ImportGamesModal } from './components/ImportGamesModal'
import { LiveSessionModal } from './components/LiveSessionModal'
import { fetchSharedGame } from './store/syncStorage'

export default function App() {
  const { screen, reloadStorage } = useGame()
  const [sharedGames, setSharedGames] = useState(null)
  const [incomingSessionCode, setIncomingSessionCode] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shareCode = params.get('share') || params.get('partie')
    if (shareCode) {
      fetchSharedGame(shareCode)
        .then((data) => {
          if (data && Array.isArray(data.games) && data.games.length > 0) {
            setSharedGames(data.games)
          } else if (data && data.game) {
            setSharedGames([data.game])
          }
        })
        .catch(() => {})
    }

    const sessionCode = params.get('session')
    if (sessionCode) {
      setIncomingSessionCode(sessionCode)
    }

    const handleOpenImport = (e) => {
      if (Array.isArray(e.detail) && e.detail.length > 0) {
        setSharedGames(e.detail)
      }
    }
    window.addEventListener('ardoise-open-import-games', handleOpenImport)
    return () => window.removeEventListener('ardoise-open-import-games', handleOpenImport)
  }, [])

  const handleCloseSharedModal = () => {
    setSharedGames(null)
    window.history.replaceState({}, '', window.location.pathname)
  }

  const handleImportSharedGames = () => {
    reloadStorage()
    window.history.replaceState({}, '', window.location.pathname)
  }

  const handleCloseSessionModal = () => {
    setIncomingSessionCode(null)
    window.history.replaceState({}, '', window.location.pathname)
  }

  return (
    <>
      <PullToRefreshIndicator />
      {screen === 'game' ? (
        <GameScreen />
      ) : screen === 'victory' ? (
        <VictoryScreen />
      ) : screen === 'history' ? (
        <HistoryScreen />
      ) : screen === 'stats' ? (
        <StatsScreen />
      ) : screen === 'players' ? (
        <PlayersScreen />
      ) : (
        <HomeScreen />
      )}

      {/* Aperçu et import d'une ou plusieurs parties partagées reçues par QR code, lien ou code */}
      <ImportGamesModal
        isOpen={Boolean(sharedGames && sharedGames.length > 0)}
        games={sharedGames}
        onClose={handleCloseSharedModal}
        onImported={handleImportSharedGames}
      />

      {/* Rejoint automatique d'une Table en direct via QR code ou lien (?session=...) */}
      <LiveSessionModal
        isOpen={Boolean(incomingSessionCode)}
        initialJoinCode={incomingSessionCode}
        onClose={handleCloseSessionModal}
      />
    </>
  )
}

