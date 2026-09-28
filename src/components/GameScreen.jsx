import { useState } from 'react'
import { ArrowLeft, RotateCcw, ChevronDown, ChevronUp, Award, BookOpen } from 'lucide-react'
import { useGame } from '../context/GameContext'
import { ThemeToggle } from './ui/ThemeToggle'
import { Avatar } from './ui/Avatar'
import { ConfirmDialog } from './ui/Dialog'
import { RulesSheet } from './RulesSheet'
import { getRanking } from '../utils/gameUtils'
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
  const { activeGame, exitGame, undoLastRound, canUndo, finishGame } = useGame()
  const [showHistory, setShowHistory] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)
  const [showRules, setShowRules] = useState(false)

  if (!activeGame) {
    return null
  }

  const meta = GAME_META[activeGame.type]
  const scoreDir = activeGame.config?.scoreDir || meta?.scoreDir || 'high'
  const ranking = getRanking(activeGame.scores, scoreDir === 'low' || scoreDir === 'low_limit' ? 'low' : 'high')
  const leaderId = ranking[0]?.id

  const Engine = ENGINE_MAP[activeGame.type] || UniverselEngine

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden school-surface">
      {/* Header */}
      <header className="flex items-center gap-2 px-4 pt-safe pt-3 pb-2.5 flex-shrink-0 border-b border-stone-200/90 dark:border-slate-800/90 bg-[#faf9f5]/90 dark:bg-[#151719]/90 backdrop-blur-xs">
        <button
          type="button"
          onClick={() => setShowExitConfirm(true)}
          className="p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Quitter la partie"
        >
          <ArrowLeft size={18} className="text-stone-700 dark:text-slate-300" />
        </button>
        <div className="flex items-baseline gap-2 flex-1 min-w-0">
          <span className="font-serif-title font-bold text-base truncate">
            {activeGame.name}
          </span>
          <span className="text-xs font-semibold text-[#c83b3b] flex-shrink-0">
            M.{activeGame.rounds.length + 1}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowRules(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-xs font-semibold text-stone-700 dark:text-slate-300 hover:border-[#c83b3b] transition-colors"
            title="Consulter les règles"
          >
            <BookOpen size={14} />
            <span className="hidden xs:inline">Règles</span>
          </button>
          {canUndo && (
            <button
              type="button"
              onClick={undoLastRound}
              className="p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
              title="Annuler la dernière manche"
              aria-label="Annuler la dernière manche"
            >
              <RotateCcw size={16} className="text-stone-600 dark:text-slate-400" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowFinishConfirm(true)}
            className="p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:border-[#c83b3b] transition-colors"
            title="Terminer la partie"
            aria-label="Terminer la partie"
          >
            <Award size={16} className="text-[#c83b3b]" />
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* Tableau des scores */}
      <div className="flex-shrink-0 px-4 pt-3 pb-2">
        <div className={`grid gap-2 ${
          activeGame.players.length <= 2 ? 'grid-cols-2' :
          activeGame.players.length <= 3 ? 'grid-cols-3' :
          'grid-cols-4'
        }`}>
          {ranking.map(({ id, score, rank }) => {
            const player = activeGame.players.find(p => p.id === id)
            if (!player) return null
            const isLeader = id === leaderId
            return (
              <div
                key={id}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all ${
                  isLeader
                    ? 'school-card border-[#c83b3b] ring-1 ring-[#c83b3b]/40'
                    : 'school-card'
                }`}
              >
                <div className="flex items-center justify-between w-full px-0.5">
                  <span className={`text-[10px] font-bold uppercase ${
                    isLeader ? 'text-[#c83b3b]' : 'text-stone-400 dark:text-slate-500'
                  }`}>
                    {rank === 1 ? '1er' : `${rank}e`}
                  </span>
                  {isLeader && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c83b3b]" />
                  )}
                </div>
                <Avatar player={player} size="sm" leader={isLeader} />
                <span className="text-xs font-semibold truncate max-w-full text-center px-1">
                  {player.name}
                </span>
                <span
                  className={`text-xl font-black tabular-nums ${
                    isLeader ? 'text-[#c83b3b]' : ''
                  }`}
                >
                  {score}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Moteur de saisie de manche */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="px-4 pb-4">
          <Engine game={activeGame} leaderId={leaderId} onFinish={finishGame} />
        </div>
      </div>

      {/* Historique des manches déroulable */}
      {activeGame.rounds.length > 0 && (
        <div className="flex-shrink-0 border-t border-stone-200 dark:border-slate-800 bg-[#faf9f5]/95 dark:bg-[#151719]/95">
          <button
            type="button"
            onClick={() => setShowHistory(v => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-stone-600 dark:text-slate-400"
          >
            <span>Relevé des manches ({activeGame.rounds.length})</span>
            {showHistory ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </button>
          {showHistory && (
            <div className="max-h-40 overflow-y-auto scrollbar-hide px-4 pb-3 space-y-1">
              {[...activeGame.rounds].reverse().map((round, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs text-stone-600 dark:text-slate-400 py-1 border-b border-stone-200/50 dark:border-slate-800/50"
                >
                  <span className="font-bold text-stone-400 dark:text-slate-500 w-12 flex-shrink-0">
                    M.{activeGame.rounds.length - i}
                  </span>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {activeGame.players.map(p => (
                      <span key={p.id} className="flex items-center gap-1 tabular-nums">
                        <span className="font-medium text-stone-500 dark:text-slate-400">{p.name}:</span>
                        <span className="font-bold text-stone-800 dark:text-slate-200">
                          {round.delta?.[p.id] != null ? (round.delta[p.id] >= 0 ? '+' : '') + round.delta[p.id] : '—'}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Règles officielles */}
      <RulesSheet
        gameType={showRules ? activeGame.type : null}
        onClose={() => setShowRules(false)}
      />

      {/* Confirmation sortie */}
      <ConfirmDialog
        open={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        onConfirm={exitGame}
        title="Quitter la partie ?"
        message="La partie en cours est automatiquement sauvegardée et pourra être reprise depuis l'accueil."
        confirmLabel="Quitter"
      />

      {/* Confirmation fin de partie */}
      <ConfirmDialog
        open={showFinishConfirm}
        onClose={() => setShowFinishConfirm(false)}
        onConfirm={() => finishGame(leaderId)}
        title="Clôturer la partie ?"
        message="Terminer la partie et afficher le palmarès final ?"
        confirmLabel="Voir le palmarès"
      />
    </div>
  )
}
