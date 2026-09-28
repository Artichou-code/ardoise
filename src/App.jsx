import { useGame } from './context/GameContext'
import { HomeScreen } from './components/HomeScreen'
import { GameScreen } from './components/GameScreen'
import { VictoryScreen } from './components/VictoryScreen'
import { HistoryScreen } from './components/HistoryScreen'
import { PlayersScreen } from './components/PlayersScreen'

export default function App() {
  const { screen } = useGame()

  return (
    <>
      {screen === 'home' && <HomeScreen />}
      {screen === 'game' && <GameScreen />}
      {screen === 'victory' && <VictoryScreen />}
      {screen === 'history' && <HistoryScreen />}
      {screen === 'players' && <PlayersScreen />}
    </>
  )
}
