import { useState } from 'react'
import { ArrowLeft, RotateCcw, RotateCw, ChevronDown, ChevronUp, Flag, BookOpen } from 'lucide-react'
import { useGame } from '../context/GameContext'
import { BurgerMenuButton } from './BurgerMenu'
import { Avatar } from './ui/Avatar'
import { ConfirmDialog } from './ui/Dialog'
import { RulesSheet } from './RulesSheet'
import { getRanking } from '../utils/gameUtils'
import { GAME_META, GAMES } from '../constants/games'
import { DourakEngine } from './engines/DourakEngine'
import { CaracoleEngine } from './engines/CaracoleEngine'
import { SkyjoEngine } from './engines/SkyjoEngine'
import { PresidentEngine } from './engines/PresidentEngine'
import { BeloteEngine } from './engines/BeloteEngine'
import { TarotEngine } from './engines/TarotEngine'
import { SixQuiPrendEngine } from './engines/SixQuiPrendEngine'
import { UniverselEngine } from './engines/UniverselEngine'

const ENGINE_MAP = {
  [GAMES.DOURAK]: DourakEngine,
  [GAMES.CARACOLE]: CaracoleEngine,
  [GAMES.SKYJO]: SkyjoEngine,
  [GAMES.PRESIDENT]: PresidentEngine,
  [GAMES.BELOTE]: BeloteEngine,
  [GAMES.TAROT]: TarotEngine,
  [GAMES.SIX_QUI_PREND]: SixQuiPrendEngine,
  [GAMES.UNIVERSEL]: UniverselEngine,
}

export function GameScreen() {
  const { activeGame, exitGame, undoLastRound, cancelCorrection, canUndo, finishGame } = useGame()
  const [showHistory, setShowHistory] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)
  const [showUndoConfirm, setShowUndoConfirm] = useState(false)
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
    <div className="flex flex-col h-full max-h-full overflow-hidden school-surface select-none">
      {/* Header */}
      <header className="flex items-center gap-2 px-4 header-safe pb-3 flex-shrink-0 border-b border-stone-200/90 dark:border-slate-800/90 bg-[#faf9f5]/90 dark:bg-[#151719]/90 backdrop-blur-xs">
        <button
          type="button"
          onClick={() => setShowExitConfirm(true)}
          className="p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          aria-label="Quitter la partie"
        >
          <ArrowLeft size={18} className="text-stone-700 dark:text-slate-300" />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="font-serif-title font-bold text-base truncate">
            {activeGame.type === GAMES.PRESIDENT || activeGame.name?.startsWith('Trou du cul') ? 'Trou du cul' : activeGame.name}
          </span>
          <span className="text-xs font-semibold text-[#c83b3b] shrink-0 whitespace-nowrap">
            M.{activeGame.rounds.length + 1}
          </span>
          <button
            type="button"
            onClick={() => setShowRules(true)}
            className="p-1.5 rounded-lg border border-stone-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-stone-600 dark:text-slate-400 hover:text-[#c83b3b] hover:border-[#c83b3b] transition-colors shrink-0 cursor-pointer"
            title="Consulter les règles"
            aria-label="Consulter les règles"
          >
            <BookOpen size={14} />
          </button>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {activeGame.isCorrection ? (
            <button
              type="button"
              onClick={cancelCorrection}
              className="p-2 rounded-xl border border-[#c83b3b]/35 bg-[#c83b3b]/10 hover:bg-[#c83b3b]/20 dark:bg-[#c83b3b]/20 dark:border-[#c83b3b]/40 transition-colors cursor-pointer"
              title="Annuler la modification (conserver la manche)"
              aria-label="Annuler la modification"
            >
              <RotateCw size={16} className="text-[#c83b3b] dark:text-red-400" />
            </button>
          ) : canUndo ? (
            <button
              type="button"
              onClick={() => setShowUndoConfirm(true)}
              className="p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={`Corriger la manche ${activeGame.rounds.length}`}
              aria-label="Corriger la manche précédente"
            >
              <RotateCcw size={16} className="text-stone-600 dark:text-slate-400" />
            </button>
          ) : null}
          <BurgerMenuButton />
        </div>
      </header>

      {/* Tableau des scores */}
      <div className="flex-shrink-0 px-3 sm:px-4 pt-3 pb-2">
        <div className={`grid ${
          activeGame.players.length <= 2 ? 'grid-cols-2 gap-2' :
          activeGame.players.length === 3 ? 'grid-cols-3 gap-2' :
          activeGame.players.length === 4 ? 'grid-cols-4 gap-2' :
          activeGame.players.length === 5 ? 'grid-cols-5 gap-1.5' :
          activeGame.players.length === 6 ? 'grid-cols-6 gap-1' :
          'grid-cols-4 gap-1.5'
        }`}>
          {ranking.map(({ id, score, rank }) => {
            const player = activeGame.players.find(p => p.id === id)
            if (!player) return null
            const isLeader = id === leaderId
            const isCrowded = activeGame.players.length >= 5
            return (
              <div
                key={id}
                className={`flex flex-col items-center rounded-xl transition-all ${
                  isCrowded ? 'gap-0.5 p-1.5' : 'gap-1 p-2.5'
                } ${
                  isLeader
                    ? 'school-card border-[#c83b3b] ring-1 ring-[#c83b3b]/40'
                    : 'school-card'
                }`}
              >
                <div className="flex items-center justify-between w-full px-0.5">
                  <span className={`text-[9px] sm:text-[10px] font-bold uppercase ${
                    isLeader ? 'text-[#c83b3b]' : 'text-stone-400 dark:text-slate-500'
                  }`}>
                    {rank === 1 ? '1er' : `${rank}e`}
                  </span>
                  {isLeader && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c83b3b]" />
                  )}
                </div>
                <Avatar player={player} size={isCrowded ? 'xs' : 'sm'} leader={isLeader} />
                <span className="text-[11px] sm:text-xs font-semibold truncate max-w-full text-center px-0.5">
                  {player.name}
                </span>
                <span
                  className={`font-black tabular-nums ${
                    isCrowded ? 'text-base sm:text-lg' : 'text-xl'
                  } ${
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
        <div className="px-4 pt-3 scroll-bottom-space">
          <Engine
            key={`${activeGame.id}-r-${activeGame.rounds.length}-${activeGame.isCorrection ? 'corr' : 'norm'}`}
            game={activeGame}
            leaderId={leaderId}
            onFinish={finishGame}
          />

          {/* Bouton discret pour terminer la partie de façon anticipée */}
          <div className="flex justify-center pt-3 pb-2">
            <button
              type="button"
              onClick={() => setShowFinishConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-stone-500 hover:text-stone-800 dark:text-slate-400 dark:hover:text-slate-200 border border-stone-200/90 dark:border-slate-800 hover:border-stone-300 dark:hover:border-slate-700 bg-white/70 dark:bg-slate-900/70 transition-all active:scale-[0.98] shadow-2xs"
            >
              <Flag size={12} className="text-stone-400 dark:text-slate-500" />
              <span>Finir la partie plus tôt</span>
            </button>
          </div>
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
            <div className="max-h-40 overflow-y-auto scrollbar-hide overscroll-contain px-4 pb-3 space-y-1">
              {[...activeGame.rounds].reverse().map((round, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs text-stone-600 dark:text-slate-400 py-1 border-b border-stone-200/50 dark:border-slate-800/50"
                >
                  <span className="font-bold text-stone-400 dark:text-slate-500 w-12 flex-shrink-0">
                    M.{activeGame.rounds.length - i}
                  </span>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {activeGame.players.map(p => {
                      const rep = round.reprieves?.find(r => r.playerId === p.id)
                      return (
                        <span key={p.id} className="flex items-center gap-1 tabular-nums">
                          <span className="font-medium text-stone-500 dark:text-slate-400">{p.name}:</span>
                          <span className="font-bold text-stone-800 dark:text-slate-200">
                            {round.delta?.[p.id] != null ? (round.delta[p.id] >= 0 ? '+' : '') + round.delta[p.id] : '—'}
                          </span>
                          {rep && (
                            <span
                              className="text-[10px] font-bold text-[#c83b3b] bg-[#c83b3b]/10 dark:bg-[#c83b3b]/20 px-1 py-0.2 rounded"
                              title={`Sursis accordé : ${rep.original} -> ${rep.reduced} pts`}
                            >
                              sursis
                            </span>
                          )}
                        </span>
                      )
                    })}
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
        title="Finir la partie plus tôt ?"
        message="Voulez-vous clore la partie maintenant avec les scores actuels et voir le palmarès final ?"
        confirmLabel="Clôturer la partie"
      />

      {/* Confirmation modification de manche (minimaliste) */}
      <ConfirmDialog
        open={showUndoConfirm}
        onClose={() => setShowUndoConfirm(false)}
        onConfirm={undoLastRound}
        title={`Corriger la manche ${activeGame.rounds?.length || 1} ?`}
        message="Revenir à la saisie de cette manche pour modifier les scores."
        confirmLabel="Corriger"
        cancelLabel="Conserver"
      />
    </div>
  )
}
