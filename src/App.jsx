import { useGame } from './context/GameContext'
import { HomeScreen } from './components/HomeScreen'
import { GameScreen } from './components/GameScreen'
import { VictoryScreen } from './components/VictoryScreen'
import { HistoryScreen } from './components/HistoryScreen'
import { PlayersScreen } from './components/PlayersScreen'
import { PullToRefreshIndicator } from './components/ui/PullToRefresh'

export default function App() {
  const { screen } = useGame()

  return (
    <>
      <PullToRefreshIndicator />
      {screen === 'home' && <HomeScreen />}
      {screen === 'game' && <GameScreen />}
      {screen === 'victory' && <VictoryScreen />}
      {screen === 'history' && <HistoryScreen />}
      {screen === 'players' && <PlayersScreen />}
    </>
  )
}
