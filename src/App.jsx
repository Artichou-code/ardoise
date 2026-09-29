import { useState, useEffect } from 'react'
import { useGame } from './context/GameContext'
import { HomeScreen } from './components/HomeScreen'
import { GameScreen } from './components/GameScreen'
import { VictoryScreen } from './components/VictoryScreen'
import { HistoryScreen } from './components/HistoryScreen'
import { StatsScreen } from './components/StatsScreen'
import { PlayersScreen } from './components/PlayersScreen'
import { PullToRefreshIndicator } from './components/ui/PullToRefresh'
import { SharedGamePreviewModal } from './components/SharedGamePreviewModal'
import { LiveSessionModal } from './components/LiveSessionModal'
import { fetchSharedGame } from './store/syncStorage'

export default function App() {
  const { screen, reloadStorage } = useGame()
  const [sharedGame, setSharedGame] = useState(null)
  const [incomingSessionCode, setIncomingSessionCode] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shareCode = params.get('partie')
    if (shareCode) {
      fetchSharedGame(shareCode)
        .then((data) => {
          if (data && data.game) {
            setSharedGame(data.game)
          }
        })
        .catch(() => {})
    }

    const sessionCode = params.get('session')
    if (sessionCode) {
      setIncomingSessionCode(sessionCode)
    }
  }, [])

  const handleCloseSharedModal = () => {
    setSharedGame(null)
    window.history.replaceState({}, '', window.location.pathname)
  }

  const handleImportSharedGame = () => {
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

      {/* Aperçu d'une partie partagée reçue par QR code ou lien */}
      <SharedGamePreviewModal
        isOpen={Boolean(sharedGame)}
        game={sharedGame}
        onClose={handleCloseSharedModal}
        onImported={handleImportSharedGame}
      />

      {/* Rejoint automatique d'un salon journée via QR code ou lien (?session=...) */}
      <LiveSessionModal
        isOpen={Boolean(incomingSessionCode)}
        initialJoinCode={incomingSessionCode}
        onClose={handleCloseSessionModal}
      />
    </>
  )
}
