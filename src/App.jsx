import { useState, useEffect, lazy, Suspense } from 'react'
import { useGame } from './context/GameContext'
import { HomeScreen } from './components/HomeScreen'
import { PullToRefreshIndicator } from './components/ui/PullToRefresh'
import { BurgerMenu } from './components/BurgerMenu'
import { fetchSharedGame } from './store/syncStorage'
import { getActiveSession } from './store/liveSession'

// Écrans principaux : chargement immédiat pour une navigation instantanée
import { GameScreen } from './components/GameScreen'
import { VictoryScreen } from './components/VictoryScreen'
import { HistoryScreen } from './components/HistoryScreen'
import { StatsScreen } from './components/StatsScreen'
import { PlayersScreen } from './components/PlayersScreen'
import { TrophiesScreen } from './components/TrophiesScreen'

// Modales déjà présentes dans le bundle principal (statiquement importées par d'autres écrans)
import { ShareGamesModal } from './components/ShareGamesModal'
import { SyncModal } from './components/SyncModal'

// Modales lourdes spécifiques : chargement différé (jamais visibles au 1er rendu)
const ImportGamesModal = lazy(() => import('./components/ImportGamesModal').then((m) => ({ default: m.ImportGamesModal })))
const LiveSessionModal = lazy(() => import('./components/LiveSessionModal').then((m) => ({ default: m.LiveSessionModal })))
const LegalModal = lazy(() => import('./components/LegalModal').then((m) => ({ default: m.LegalModal })))
const ArtCreaUniverseModal = lazy(() => import('./components/ArtCreaUniverseModal').then((m) => ({ default: m.ArtCreaUniverseModal })))
const ShareAppModal = lazy(() => import('./components/ShareAppModal').then((m) => ({ default: m.ShareAppModal })))

export default function App() {
  const { screen, setScreen, reloadStorage } = useGame()
  const [sharedGames, setSharedGames] = useState(null)
  const [incomingSessionCode, setIncomingSessionCode] = useState(null)

  // États globaux du menu burger et de ses modales (accessibles depuis toutes les pages)
  const [isBurgerMenuOpen, setIsBurgerMenuOpen] = useState(false)
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false)
  const [isShareGamesModalOpen, setIsShareGamesModalOpen] = useState(false)
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)
  const [legalTab, setLegalTab] = useState(null)
  const [isArtCreaModalOpen, setIsArtCreaModalOpen] = useState(false)
  const [isShareAppModalOpen, setIsShareAppModalOpen] = useState(false)
  const [liveSession, setLiveSession] = useState(() => getActiveSession())

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
      setIsLiveModalOpen(true)
    }

    const handleOpenImport = (e) => {
      if (Array.isArray(e.detail) && e.detail.length > 0) {
        setSharedGames(e.detail)
      }
    }
    const handleOpenBurger = () => setIsBurgerMenuOpen(true)
    const handleOpenShareApp = () => setIsShareAppModalOpen(true)
    const handleSessionChanged = (e) => setLiveSession(e.detail)

    window.addEventListener('ardoise-open-import-games', handleOpenImport)
    window.addEventListener('ardoise-open-burger-menu', handleOpenBurger)
    window.addEventListener('ardoise-open-share-app', handleOpenShareApp)
    window.addEventListener('ardoise-live-session-changed', handleSessionChanged)
    return () => {
      window.removeEventListener('ardoise-open-import-games', handleOpenImport)
      window.removeEventListener('ardoise-open-burger-menu', handleOpenBurger)
      window.removeEventListener('ardoise-open-share-app', handleOpenShareApp)
      window.removeEventListener('ardoise-live-session-changed', handleSessionChanged)
    }
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
    setIsLiveModalOpen(false)
    if (incomingSessionCode) {
      setIncomingSessionCode(null)
      window.history.replaceState({}, '', window.location.pathname)
    }
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
        ) : screen === 'trophies' ? (
          <TrophiesScreen />
        ) : (
          <HomeScreen />
        )}

      {/* Menu Burger global accessible depuis toutes les pages */}
      <BurgerMenu
        isOpen={isBurgerMenuOpen}
        onClose={() => setIsBurgerMenuOpen(false)}
        onNavigate={(nextScreen) => setScreen(nextScreen)}
        onOpenLiveSession={() => setIsLiveModalOpen(true)}
        onOpenShareGames={() => setIsShareGamesModalOpen(true)}
        onOpenSync={() => setIsSyncModalOpen(true)}
        onOpenLegal={(tab) => setLegalTab(tab || 'mentions')}
        onOpenArtCrea={() => setIsArtCreaModalOpen(true)}
        liveSession={liveSession}
      />

      <Suspense fallback={null}>
        {/* Modale Session Journée & Table en direct */}
        {isLiveModalOpen && (
          <LiveSessionModal
            isOpen={isLiveModalOpen}
            initialJoinCode={incomingSessionCode}
            onClose={handleCloseSessionModal}
            onSessionChanged={(s) => setLiveSession(s)}
          />
        )}

        {/* Modale de partage et d'import de lots de parties */}
        {isShareGamesModalOpen && (
          <ShareGamesModal
            isOpen={isShareGamesModalOpen}
            onClose={() => setIsShareGamesModalOpen(false)}
            onOpenImportGames={(importedGames) => {
              setSharedGames(importedGames)
            }}
          />
        )}

        {/* Modale Sauvegarde & Synchronisation */}
        {isSyncModalOpen && (
          <SyncModal
            isOpen={isSyncModalOpen}
            onClose={() => setIsSyncModalOpen(false)}
            onDataUpdated={reloadStorage}
          />
        )}

        {/* Hub Juridique */}
        {legalTab && (
          <LegalModal
            open={Boolean(legalTab)}
            onClose={() => setLegalTab(null)}
            activeTab={legalTab}
            onSelectTab={setLegalTab}
          />
        )}

        {/* Modale Univers ART-créa */}
        {isArtCreaModalOpen && (
          <ArtCreaUniverseModal
            isOpen={isArtCreaModalOpen}
            onClose={() => setIsArtCreaModalOpen(false)}
          />
        )}

        {/* Modale QR Code & Lien de partage de l'application Ardoise */}
        {isShareAppModalOpen && (
          <ShareAppModal
            isOpen={isShareAppModalOpen}
            onClose={() => setIsShareAppModalOpen(false)}
          />
        )}

        {/* Aperçu et import d'une ou plusieurs parties partagées reçues par QR code, lien ou code */}
        {sharedGames && sharedGames.length > 0 && (
          <ImportGamesModal
            isOpen={Boolean(sharedGames && sharedGames.length > 0)}
            games={sharedGames}
            onClose={handleCloseSharedModal}
            onImported={handleImportSharedGames}
          />
        )}
      </Suspense>
    </>
  )
}


