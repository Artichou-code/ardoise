import { useState } from 'react'
import { ArrowLeft, RotateCcw, ChevronDown, ChevronUp, Trophy } from 'lucide-react'
import { useGame } from '../context/GameContext'
import { ThemeToggle } from './ui/ThemeToggle'
import { Avatar } from './ui/Avatar'
import { ConfirmDialog } from './ui/Dialog'
import { getRanking, getLeader, getLowest } from '../utils/gameUtils'
import { GAME_META, GAMES } from '../constants/games'
import { CaracoleEngine } from './engines/CaracoleEngine'
import { SkyjoEngine } from './engines/SkyjoEngine'
import { PresidentEngine } from './engines/PresidentEngine'
import { BeloteEngine } from './engines/BeloteEngine'
import { TarotEngine } from './engines/TarotEngine'
import { SixQuiPrendEngine } from './engines/SixQuiPrendEngine'
import { UniverselEngine } from './engines/UniverselEngine'

const ENGINE_MAP = {
  [GAMES.CARACOLE]: CaracoleEngine,
  [GAMES.SKYJO]: SkyjoEngine,
  [GAMES.PRESIDENT]: PresidentEngine,
  [GAMES.BELOTE]: BeloteEngine,
  [GAMES.TAROT]: TarotEngine,
  [GAMES.SIX_QUI_PREND]: SixQuiPrendEngine,
  [GAMES.UNIVERSEL]: UniverselEngine,
}

export function GameScreen() {
  const { activeGame, exitGame, undoLastRound, canUndo, finishGame, setScreen } = useGame()
  const [showHistory, setShowHistory] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  if (!activeGame) {
    return null
  }

  const meta = GAME_META[activeGame.type]
  const scoreDir = activeGame.config?.scoreDir || meta?.scoreDir || 'high'
  const ranking = getRanking(activeGame.scores, scoreDir === 'low' || scoreDir === 'low_limit' ? 'low' : 'high')
  const leaderId = ranking[0]?.id

  const Engine = ENGINE_MAP[activeGame.type] || UniverselEngine

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-white dark:bg-zinc-950">
      {/* Header */}
      <header className="flex items-center gap-2 px-4 pt-safe pt-3 pb-3 flex-shrink-0 border-b border-zinc-100 dark:border-zinc-900">
        <button
          onClick={() => setShowExitConfirm(true)}
          className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft size={20} className="text-zinc-600 dark:text-zinc-400" />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xl">{meta?.emoji}</span>
          <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{activeGame.name}</span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-1">
            Manche {activeGame.rounds.length + 1}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {canUndo && (
            <button
              onClick={undoLastRound}
              className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Annuler la dernière manche"
            >
              <RotateCcw size={18} className="text-zinc-500" />
            </button>
          )}
          <ThemeToggle />
        </div>
      </header>

      {/* Scores */}
      <div className="flex-shrink-0 px-4 pt-3 pb-2">
        <div className={`grid gap-2 ${
          activeGame.players.length <= 2 ? 'grid-cols-2' :
          activeGame.players.length <= 3 ? 'grid-cols-3' :
          activeGame.players.length <= 4 ? 'grid-cols-4' :
          'grid-cols-4'
        }`}>
          {ranking.map(({ id, score, rank }) => {
            const player = activeGame.players.find(p => p.id === id)
            if (!player) return null
            const isLeader = id === leaderId
            return (
              <div
                key={id}
                className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${
                  isLeader
                    ? 'bg-[#fcc817]/10 dark:bg-[#fcc817]/10'
                    : 'bg-zinc-50 dark:bg-zinc-900'
                }`}
              >
                <Avatar player={player} size="sm" leader={isLeader} />
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate max-w-full text-center px-1">{player.name}</span>
                <span
                  className={`text-xl font-black tabular-nums ${isLeader ? '' : 'text-zinc-900 dark:text-zinc-100'}`}
                  style={isLeader ? { color: '#fcc817' } : {}}
                >
                  {score}
                </span>
                {rank === 1 && <span className="text-[10px]">👑</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Engine (saisie manche) */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="px-4 pb-4">
          <Engine game={activeGame} leaderId={leaderId} onFinish={finishGame} />
        </div>
      </div>

      {/* Historique des manches */}
      {activeGame.rounds.length > 0 && (
        <div className="flex-shrink-0 border-t border-zinc-100 dark:border-zinc-900">
          <button
            onClick={() => setShowHistory(v => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400"
          >
            <span>Historique ({activeGame.rounds.length} manche{activeGame.rounds.length > 1 ? 's' : ''})</span>
            {showHistory ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
          {showHistory && (
            <div className="max-h-40 overflow-y-auto scrollbar-hide px-4 pb-3 space-y-1">
              {[...activeGame.rounds].reverse().map((round, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 py-1 border-b border-zinc-50 dark:border-zinc-900">
                  <span className="font-semibold text-zinc-400 w-16 flex-shrink-0">
                    M.{activeGame.rounds.length - i}
                  </span>
                  {activeGame.players.map(p => (
                    <span key={p.id} className="flex items-center gap-1">
                      <span style={{ color: p.color }}>●</span>
                      <span>{round.delta?.[p.id] != null ? (round.delta[p.id] >= 0 ? '+' : '') + round.delta[p.id] : '—'}</span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirm exit */}
      <ConfirmDialog
        open={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        onConfirm={exitGame}
        title="Quitter la partie ?"
        message="La partie en cours sera sauvegardée et tu pourras la reprendre depuis l'accueil."
        confirmLabel="Quitter"
      />
    </div>
  )
}
