import { useState, useEffect, lazy, Suspense } from 'react'
import { ArrowLeft, RotateCcw, RotateCw, ChevronDown, ChevronUp, Flag, BookOpen, Radio, Trash2 } from 'lucide-react'
import { useGame } from '../context/GameContext'
import { getActiveSession } from '../store/liveSession'
import { BurgerMenuButton } from './BurgerMenu'
import { Avatar } from './ui/Avatar'
import { ConfirmDialog } from './ui/Dialog'
import { RulesSheet } from './RulesSheet'
import { getRanking } from '../utils/gameUtils'
import { GAME_META, GAMES, getGameDisplayName } from '../constants/games'
import { DourakEngine } from './engines/DourakEngine'
import { CaracoleEngine } from './engines/CaracoleEngine'
import { SkyjoEngine } from './engines/SkyjoEngine'
import { PresidentEngine } from './engines/PresidentEngine'
import { BeloteEngine } from './engines/BeloteEngine'
import { TarotEngine } from './engines/TarotEngine'
import { SixQuiPrendEngine } from './engines/SixQuiPrendEngine'
import { DameDePiqueEngine } from './engines/DameDePiqueEngine'
import { Flip7Engine } from './engines/Flip7Engine'
import { SeaSaltPaperEngine } from './engines/SeaSaltPaperEngine'
import { AscenseurEngine } from './engines/AscenseurEngine'
import { RamiEngine } from './engines/RamiEngine'
import { YanivEngine } from './engines/YanivEngine'
import { BarbuEngine } from './engines/BarbuEngine'
import { UniverselEngine } from './engines/UniverselEngine'

const LiveSessionModal = lazy(() => import('./LiveSessionModal').then((m) => ({ default: m.LiveSessionModal })))

const ENGINE_MAP = {
  [GAMES.DOURAK]: DourakEngine,
  [GAMES.CARACOLE]: CaracoleEngine,
  [GAMES.SKYJO]: SkyjoEngine,
  [GAMES.PRESIDENT]: PresidentEngine,
  [GAMES.BELOTE]: BeloteEngine,
  [GAMES.TAROT]: TarotEngine,
  [GAMES.SIX_QUI_PREND]: SixQuiPrendEngine,
  [GAMES.DAME_DE_PIQUE]: DameDePiqueEngine,
  [GAMES.FLIP_7]: Flip7Engine,
  [GAMES.SEA_SALT_PAPER]: SeaSaltPaperEngine,
  [GAMES.ASCENSEUR]: AscenseurEngine,
  [GAMES.RAMI]: RamiEngine,
  [GAMES.YANIV]: YanivEngine,
  [GAMES.BARBU]: BarbuEngine,
  [GAMES.UNIVERSEL]: UniverselEngine,
}

export function GameScreen() {
  const { activeGame, exitGame, undoLastRound, cancelCorrection, canUndo, finishGame, startLiveSessionForGame, removeGame } = useGame()
  const [showHistory, setShowHistory] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showUndoConfirm, setShowUndoConfirm] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [liveSession, setLiveSession] = useState(() => getActiveSession())
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false)
  const [isCreatingLive, setIsCreatingLive] = useState(false)

  useEffect(() => {
    const handleSessionChanged = (e) => setLiveSession(e.detail)
    window.addEventListener('ardoise-live-session-changed', handleSessionChanged)
    return () => window.removeEventListener('ardoise-live-session-changed', handleSessionChanged)
  }, [])

  const handleGoLive = async () => {
    if (isCreatingLive || !activeGame) return
    setIsCreatingLive(true)
    try {
      await startLiveSessionForGame(activeGame)
      setIsLiveModalOpen(true)
    } catch (err) {
      console.error('Erreur passage en direct:', err)
    } finally {
      setIsCreatingLive(false)
    }
  }

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
            {getGameDisplayName(activeGame)}
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
          {/* Bouton discret Table en direct dans le header (rond) */}
          {liveSession ? (
            <button
              type="button"
              onClick={() => setIsLiveModalOpen(true)}
              className="w-7 h-7 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors shrink-0 cursor-pointer flex items-center justify-center"
              title={`Table en direct active (${liveSession.code}) — Afficher le QR code et le code`}
              aria-label="Table en direct"
            >
              <Radio size={14} className="animate-pulse" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGoLive}
              disabled={isCreatingLive}
              className="w-7 h-7 rounded-full border border-stone-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-600 dark:text-slate-400 hover:text-[#c83b3b] dark:hover:text-rose-400 transition-colors shrink-0 cursor-pointer flex items-center justify-center"
              title="Passer cette partie sur une Table en direct (partager avec des amis)"
              aria-label="Passer en direct"
            >
              <Radio size={14} className={isCreatingLive ? 'animate-spin' : ''} />
            </button>
          )}

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
      <div className="flex-shrink-0 px-3 sm:px-4 pt-1.5 pb-1">
        {activeGame.type === GAMES.BELOTE && activeGame.players.length === 4 ? (
          <div className="grid grid-cols-2 gap-2">
            {(() => {
              const pNous = [activeGame.players[0], activeGame.players[1]].filter(Boolean)
              const pEux = [activeGame.players[2], activeGame.players[3]].filter(Boolean)
              const scoreNous = activeGame.scores[pNous[0]?.id] || 0
              const scoreEux = activeGame.scores[pEux[0]?.id] || 0
              const isNousLeader = scoreNous >= scoreEux
              const isEuxLeader = scoreEux >= scoreNous
              const isTie = scoreNous === scoreEux

              const teams = [
                {
                  id: 'nous',
                  label: 'Équipe 1',
                  players: pNous,
                  score: scoreNous,
                  isLeader: isNousLeader,
                  rank: scoreNous > scoreEux ? 1 : isTie ? 1 : 2,
                },
                {
                  id: 'eux',
                  label: 'Équipe 2',
                  players: pEux,
                  score: scoreEux,
                  isLeader: isEuxLeader,
                  rank: scoreEux > scoreNous ? 1 : isTie ? 1 : 2,
                },
              ]

              return teams.map(t => (
                <div
                  key={t.id}
                  className={`flex flex-col justify-between rounded-xl py-1.5 px-2.5 transition-all ${
                    t.isLeader
                      ? 'school-card border-[#c83b3b] ring-1 ring-[#c83b3b]/40'
                      : 'school-card'
                  }`}
                >
                  {/* Ligne 1 : Rang + Noms des joueurs uniquement */}
                  <div className="flex items-center justify-between w-full leading-none mb-1 gap-1">
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 min-w-0">
                      <span className={`shrink-0 ${t.isLeader ? 'text-[#c83b3b]' : 'text-stone-400 dark:text-slate-500'}`}>
                        {t.rank === 1 ? '1er' : '2e'} ·
                      </span>
                      <span className={`truncate font-extrabold ${t.id === 'nous' ? 'text-[#c83b3b] dark:text-rose-400' : 'text-[#1e3a5f] dark:text-sky-400'}`}>
                        {t.players.map(p => p.name).join(' & ')}
                      </span>
                    </span>
                    {t.isLeader && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#c83b3b] shrink-0" />
                    )}
                  </div>

                  {/* Ligne 2 : Avatars à gauche + Score centré dans l'espace disponible */}
                  <div className="flex items-center w-full py-0.5">
                    <div className="flex items-center gap-1 shrink-0">
                      {t.players.map(p => (
                        <Avatar key={p.id} player={p} size="sm-compact" leader={t.isLeader} />
                      ))}
                    </div>
                    <div className="flex-1 flex items-center justify-center min-w-0">
                      <span
                        className={`font-black tabular-nums leading-none text-2xl sm:text-3xl text-center ${
                          t.isLeader ? 'text-[#c83b3b]' : 'text-stone-900 dark:text-slate-100'
                        }`}
                      >
                        {t.score}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            })()}
          </div>
        ) : (
          <div className={`grid ${
            activeGame.players.length <= 2 ? 'grid-cols-2 gap-1.5' :
            activeGame.players.length === 3 ? 'grid-cols-3 gap-1.5' :
            activeGame.players.length === 4 ? 'grid-cols-4 gap-1.5' :
            activeGame.players.length === 5 ? 'grid-cols-5 gap-1' :
            activeGame.players.length === 6 ? 'grid-cols-6 gap-1' :
            'grid-cols-4 gap-1'
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
                    isCrowded ? 'gap-0.5 py-1 px-1' : 'gap-0.5 py-1.5 px-1.5'
                  } ${
                    isLeader
                      ? 'school-card border-[#c83b3b] ring-1 ring-[#c83b3b]/40'
                      : 'school-card'
                  }`}
                >
                  <div className="flex items-center justify-between w-full px-0.5 leading-none">
                    <span className={`text-[9px] font-bold uppercase ${
                      isLeader ? 'text-[#c83b3b]' : 'text-stone-400 dark:text-slate-500'
                    }`}>
                      {rank === 1 ? '1er' : `${rank}e`}
                    </span>
                    {isLeader && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#c83b3b]" />
                    )}
                  </div>
                  <Avatar player={player} size={isCrowded ? 'xs' : 'sm-compact'} leader={isLeader} />
                  <span className="text-[11px] font-semibold truncate max-w-full text-center px-0.5 leading-tight">
                    {player.name}
                  </span>
                  <span
                    className={`font-black tabular-nums leading-none ${
                      isCrowded ? 'text-sm' : 'text-base'
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
        )}
      </div>

      {/* Moteur de saisie de manche */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="px-4 pt-1 pb-8 pb-safe">
          <Engine
            key={`${activeGame.id}-r-${activeGame.rounds.length}-${activeGame.isCorrection ? 'corr' : 'norm'}`}
            game={activeGame}
            leaderId={leaderId}
            onFinish={finishGame}
          />

          {/* Actions secondaires sur la même ligne (espacement généreux avec le bas) */}
          <div className="flex items-center gap-2 pt-3 pb-3 mb-2 w-full max-w-sm mx-auto px-1">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all active:scale-[0.98] shadow-2xs cursor-pointer whitespace-nowrap"
            >
              <Trash2 size={12} className="text-rose-600 dark:text-rose-400 shrink-0" />
              <span>Supprimer</span>
            </button>
            <button
              type="button"
              onClick={() => setShowFinishConfirm(true)}
              className="flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-stone-500 hover:text-stone-800 dark:text-slate-400 dark:hover:text-slate-200 border border-stone-200/90 dark:border-slate-800 hover:border-stone-300 dark:hover:border-slate-700 bg-white/70 dark:bg-slate-900/70 hover:bg-stone-50/60 dark:hover:bg-slate-800/60 transition-all active:scale-[0.98] shadow-2xs cursor-pointer whitespace-nowrap"
            >
              <Flag size={12} className="text-stone-400 dark:text-slate-500 shrink-0" />
              <span className="whitespace-nowrap">Finir la partie plus tôt</span>
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
                    {activeGame.type === GAMES.BELOTE && activeGame.players.length === 4 ? (
                      <>
                        <span className="flex items-center gap-1 tabular-nums">
                          <span className="font-semibold text-stone-700 dark:text-slate-300">Éq. 1:</span>
                          <span className="font-bold text-[#c83b3b]">
                            +{round.teamScores?.nous ?? round.delta?.[activeGame.players[0]?.id] ?? 0}
                          </span>
                        </span>
                        <span className="flex items-center gap-1 tabular-nums">
                          <span className="font-semibold text-stone-700 dark:text-slate-300">Éq. 2:</span>
                          <span className="font-bold text-[#c83b3b]">
                            +{round.teamScores?.eux ?? round.delta?.[activeGame.players[2]?.id] ?? 0}
                          </span>
                        </span>
                      </>
                    ) : (
                      activeGame.players.map(p => {
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
                      })
                    )}
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
        variant={activeGame.config?.variant}
        title={activeGame.type === GAMES.BELOTE ? (activeGame.config?.variant === 'coinche' ? 'Règles — Coinche' : 'Règles — Belote') : undefined}
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

      {/* Confirmation suppression de partie */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => removeGame(activeGame.id)}
        title="Supprimer la partie ?"
        message="Cette partie sera définitivement effacée et ne figurera pas dans l'historique."
        confirmLabel="Supprimer"
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

      {/* Modale Session Journée & Table en direct */}
      {isLiveModalOpen && (
        <Suspense fallback={null}>
          <LiveSessionModal
            isOpen={isLiveModalOpen}
            onClose={() => setIsLiveModalOpen(false)}
            onSessionChanged={(s) => setLiveSession(s)}
          />
        </Suspense>
      )}
    </div>
  )
}
