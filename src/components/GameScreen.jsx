import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import confetti from 'canvas-confetti'
import { ArrowLeft, RotateCcw, RotateCw, ChevronDown, ChevronUp, Flag, BookOpen, Radio, Trash2, Crown } from 'lucide-react'
import { useGame } from '../context/GameContext'
import { getActiveSession } from '../store/liveSession'
import { BurgerMenuButton } from './BurgerMenu'
import { Avatar } from './ui/Avatar'
import { ConfirmDialog } from './ui/Dialog'
import { RulesSheet } from './RulesSheet'
import { getRanking, formatTeamNames } from '../utils/gameUtils'
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
import { UnoEngine } from './engines/UnoEngine'

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
  [GAMES.UNO]: UnoEngine,
}

function AnimatedRoundIndicator({ roundNumber }) {
  const [current, setCurrent] = useState(roundNumber)
  const [prev, setPrev] = useState(null)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (roundNumber !== current) {
      setPrev(current)
      setCurrent(roundNumber)
      setAnimating(true)
      const timer = setTimeout(() => {
        setAnimating(false)
        setPrev(null)
      }, 520)
      return () => clearTimeout(timer)
    }
  }, [roundNumber, current])

  if (!animating || prev === null) {
    return (
      <span className="text-xs font-semibold text-[#c83b3b] shrink-0 whitespace-nowrap px-0.5">
        M.{current}
      </span>
    )
  }

  const maxWidthLabel = `M.${Math.max(Number(prev) || 0, Number(current) || 0)}`

  return (
    <span className="relative inline-flex items-center justify-center h-4.5 px-0.5 overflow-hidden shrink-0 whitespace-nowrap align-middle">
      {/* Élément invisible pour réserver exactement la largeur max et éviter tout clipping */}
      <span className="invisible text-xs font-semibold select-none pointer-events-none opacity-0" aria-hidden="true">
        {maxWidthLabel}
      </span>
      {/* Ancien numéro qui défile vers le haut */}
      <span className="absolute inset-0 inline-flex items-center justify-center text-xs font-semibold text-stone-400 dark:text-slate-500 animate-round-roll-out">
        M.{prev}
      </span>
      {/* Nouveau numéro qui arrive par le bas avec rebond */}
      <span className="absolute inset-0 inline-flex items-center justify-center text-xs font-bold text-[#c83b3b] animate-round-roll-in">
        M.{current}
      </span>
    </span>
  )
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
  const [isScoresCollapsed, setIsScoresCollapsed] = useState(() => {
    try {
      return localStorage.getItem('ardoise_scoreboard_collapsed') === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('ardoise_scoreboard_collapsed', String(isScoresCollapsed))
    } catch {}
  }, [isScoresCollapsed])
  const prevRoundsLengthRef = useRef(activeGame?.rounds?.length ?? 0)

  useEffect(() => {
    if (!activeGame) return
    const currentLength = activeGame.rounds?.length ?? 0
    if (currentLength > prevRoundsLengthRef.current) {
      // 1. Retour tactile haptique
      try {
        navigator.vibrate?.([25, 35, 25])
      } catch {}

      // 2. Mini célébration visuelle festive (confettis discrets à chaque manche)
      try {
        confetti({
          particleCount: 22,
          spread: 55,
          startVelocity: 26,
          origin: { x: 0.5, y: 0.65 },
          colors: ['#c83b3b', '#059669', '#d97706', '#2563eb'],
          scalar: 0.75,
          ticks: 75,
          disableForReducedMotion: true,
        })
      } catch {}
    }
    prevRoundsLengthRef.current = currentLength
  }, [activeGame?.rounds?.length])

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
  const ranking = getRanking(
    activeGame.scores,
    scoreDir === 'low' || scoreDir === 'low_limit' ? 'low' : 'high',
    activeGame
  )
  const hasStarted = (activeGame.rounds?.length ?? 0) > 0
  const leaderId = hasStarted ? ranking[0]?.id : null

  const Engine = ENGINE_MAP[activeGame.type] || UniverselEngine

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden school-surface select-none">
      {/* Header */}
      <header className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 header-safe pb-2.5 sm:pb-3 flex-shrink-0 border-b border-stone-200/90 dark:border-slate-800/90 bg-[#faf9f5]/90 dark:bg-[#151719]/90 backdrop-blur-xs">
        <button
          type="button"
          onClick={() => setShowExitConfirm(true)}
          className="p-1.5 sm:p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          aria-label="Quitter la partie"
        >
          <ArrowLeft size={16} className="text-stone-700 dark:text-slate-300 sm:w-[18px] sm:h-[18px]" />
        </button>
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="font-serif-title font-bold text-sm sm:text-base truncate">
            {getGameDisplayName(activeGame)}
          </span>
          <AnimatedRoundIndicator roundNumber={activeGame.rounds.length + 1} />
          {/* Bouton Règles du jeu sur le côté gauche */}
          <button
            type="button"
            onClick={() => setShowRules(true)}
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg border border-stone-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-stone-600 dark:text-slate-400 hover:text-[#c83b3b] hover:border-[#c83b3b] transition-colors shrink-0 cursor-pointer flex items-center justify-center"
            title="Consulter les règles"
            aria-label="Consulter les règles"
          >
            <BookOpen size={12} className="sm:w-[13px] sm:h-[13px]" />
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
              className="w-7 h-7 rounded-full border border-stone-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-600 dark:text-slate-400 hover:text-[#c83b3b] dark:hover:text-[#c83b3b] transition-colors shrink-0 cursor-pointer flex items-center justify-center"
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
        {isScoresCollapsed ? (
          <button
            type="button"
            onClick={() => setIsScoresCollapsed(false)}
            className="w-full flex items-center justify-between gap-1.5 px-3 pt-2.5 pb-1.5 rounded-xl school-card border border-stone-200/90 dark:border-slate-800 hover:border-[#c83b3b]/40 transition-all cursor-pointer group active:scale-[0.99] select-none shadow-2xs"
            title="Afficher les scores de tous les joueurs"
            aria-label="Afficher les scores"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {/* Pile d'avatars superposés, le premier avec la couronne */}
              <div
                className={`flex items-center ${
                  ranking.length > 6 ? '-space-x-3' : ranking.length > 4 ? '-space-x-2.5' : '-space-x-2'
                } shrink-0 pl-1 pt-1 pb-0.5`}
              >
                {ranking.map(({ id, rank }, idx) => {
                  const p = activeGame.players.find(pl => pl.id === id)
                  if (!p) return null
                  const isLeader = hasStarted && rank === 1
                  return (
                    <div
                      key={id}
                      className="relative rounded-full ring-2 ring-white dark:ring-slate-900 transition-transform group-hover:scale-105"
                      style={{ zIndex: ranking.length - idx }}
                    >
                      <Avatar
                        player={p}
                        size="xs"
                        leader={isLeader}
                        crown={hasStarted && idx === 0}
                        crownClassName="absolute -top-2 left-0.5 -rotate-12 origin-bottom text-amber-500 fill-amber-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] z-30 pointer-events-none"
                      />
                    </div>
                  )
                })}
              </div>

              {/* Leader actuel (individuel ou équipe) et son score */}
              <div className="flex items-center gap-1.5 min-w-0 text-left overflow-hidden">
                {(() => {
                  const isBelote4 = activeGame.type === GAMES.BELOTE && activeGame.players.length === 4
                  const hasManyPlayers = ranking.length > 6

                  if (isBelote4) {
                    const pNous = [activeGame.players[0], activeGame.players[1]].filter(Boolean)
                    const pEux = [activeGame.players[2], activeGame.players[3]].filter(Boolean)
                    const scoreNous = activeGame.scores[pNous[0]?.id] || 0
                    const scoreEux = activeGame.scores[pEux[0]?.id] || 0
                    const leadTeamPlayers = scoreNous >= scoreEux ? pNous : pEux
                    const leadScore = scoreNous >= scoreEux ? scoreNous : scoreEux
                    return (
                      <>
                        <span className="text-xs font-bold text-stone-800 dark:text-slate-200 truncate max-w-[110px] sm:max-w-[180px]">
                          {formatTeamNames(leadTeamPlayers)}
                        </span>
                        <span className="text-xs font-black text-[#c83b3b] tabular-nums shrink-0 whitespace-nowrap">
                          {leadScore} pts
                        </span>
                      </>
                    )
                  }

                  const leadPlayer = ranking[0] ? activeGame.players.find(p => p.id === ranking[0].id) : activeGame.players[0]
                  const leadScore = hasStarted ? (ranking[0]?.score ?? 0) : 0

                  return (
                    <>
                      {!hasManyPlayers && leadPlayer?.name && (
                        <span className="text-xs font-bold text-stone-800 dark:text-slate-200 truncate max-w-[95px] sm:max-w-[160px]">
                          {leadPlayer.name}
                        </span>
                      )}
                      <span className="text-xs font-black text-[#c83b3b] tabular-nums shrink-0 whitespace-nowrap">
                        {leadScore} pt{Math.abs(leadScore) > 1 ? 's' : ''}
                      </span>
                    </>
                  )
                })()}
              </div>
            </div>

            {/* Indicateur de déploiement */}
            <div className="flex items-center gap-1 text-[11px] font-semibold text-stone-400 dark:text-slate-500 group-hover:text-[#c83b3b] transition-colors shrink-0 whitespace-nowrap pl-1">
              <span>Scores</span>
              <ChevronDown size={14} className="transition-transform group-hover:translate-y-0.5" />
            </div>
          </button>
        ) : (
          <div className="relative group">
            {/* Contenu cliquable pour replier la section */}
            <div
              onClick={() => setIsScoresCollapsed(true)}
              className="cursor-pointer transition-opacity active:opacity-90"
              title="Cliquer sur la section pour masquer les scores"
            >
              {activeGame.type === GAMES.BELOTE && activeGame.players.length === 4 ? (
          <div className="grid grid-cols-2 gap-2">
            {(() => {
              const pNous = [activeGame.players[0], activeGame.players[1]].filter(Boolean)
              const pEux = [activeGame.players[2], activeGame.players[3]].filter(Boolean)
              const scoreNous = activeGame.scores[pNous[0]?.id] || 0
              const scoreEux = activeGame.scores[pEux[0]?.id] || 0
              const isNousLeader = hasStarted && scoreNous > scoreEux
              const isEuxLeader = hasStarted && scoreEux > scoreNous
              const isTie = scoreNous === scoreEux

              const teams = [
                {
                  id: 'nous',
                  label: 'Équipe 1',
                  players: pNous,
                  score: scoreNous,
                  isLeader: isNousLeader,
                  rank: !hasStarted ? null : (scoreNous > scoreEux ? 1 : isTie ? 1 : 2),
                },
                {
                  id: 'eux',
                  label: 'Équipe 2',
                  players: pEux,
                  score: scoreEux,
                  isLeader: isEuxLeader,
                  rank: !hasStarted ? null : (scoreEux > scoreNous ? 1 : isTie ? 1 : 2),
                },
              ]

              return teams.map(t => (
                <div
                  key={t.id}
                  className={`flex flex-col justify-between rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 transition-all min-h-[54px] ${
                    t.isLeader
                      ? 'school-card border-[#c83b3b] ring-1 ring-[#c83b3b]/40'
                      : 'school-card'
                  }`}
                >
                  {/* Ligne 1 : Avatars à gauche (couronne penchée sur le 1er avatar) et Score centré dans la zone droite */}
                  <div className="flex items-center justify-between w-full">
                    <div className="shrink-0 relative inline-flex items-center">
                      <div className="flex items-center -space-x-2.5">
                        {t.players.map((p, pIdx) => (
                          <div key={p.id} className="relative rounded-full">
                            <Avatar
                              player={p}
                              size="sm-compact"
                              leader={t.isLeader}
                              crown={hasStarted && pIdx === 0 && (t.isLeader || t.rank === 1)}
                              crownClassName="absolute -top-2.5 left-0.5 -rotate-14 origin-bottom text-amber-500 fill-amber-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] z-20 pointer-events-none"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Pastille 2e si non-leader, positionnée sur le 1er avatar */}
                      {hasStarted && t.rank > 1 && !t.isLeader && (
                        <span
                          className="absolute top-0.5 -left-2 px-1 min-w-[15px] h-3.5 rounded-full flex items-center justify-center text-[8px] font-black leading-none shadow-2xs ring-1 ring-white dark:ring-slate-900 bg-stone-500/90 dark:bg-slate-600 text-white z-20 pointer-events-none select-none"
                        >
                          {t.rank}e
                        </span>
                      )}
                    </div>

                    {/* Score centré dans l'espace restant à droite, légèrement descendu */}
                    <div className="flex-1 min-w-0 flex items-center justify-center pl-1 pt-1">
                      <span
                        className={`font-black tabular-nums leading-none text-3xl sm:text-4xl text-center translate-y-0.5 ${
                          t.isLeader ? 'text-[#c83b3b]' : 'text-stone-900 dark:text-slate-100'
                        }`}
                      >
                        {t.score}
                      </span>
                    </div>
                  </div>

                  {/* Ligne 2 : Noms de l'équipe sur toute la largeur disponible de la carte */}
                  <div className="w-full mt-1 min-w-0">
                    <span
                      className={`text-[10px] sm:text-[11px] font-bold truncate max-w-full block leading-tight ${
                        t.id === 'nous' ? 'text-[#c83b3b] dark:text-red-400' : 'text-[#1e3a5f] dark:text-sky-400'
                      }`}
                    >
                      {formatTeamNames(t.players, 8)}
                    </span>
                  </div>
                </div>
              ))
            })()}
          </div>
        ) : (
          (() => {
            const count = activeGame.players.length

            // Détermination de la grille : max 3 colonnes sur mobile pour que les noms restent lisibles !
            const gridClass =
              count <= 2 ? 'grid grid-cols-2 gap-1.5' :
              count === 3 ? 'grid grid-cols-3 gap-1' :
              count === 4 ? 'grid grid-cols-2 gap-1.5' :
              count === 5 ? 'grid grid-cols-6 gap-1' :
              count === 6 ? 'grid grid-cols-3 gap-1' :
              'grid grid-cols-3 sm:grid-cols-4 gap-1'

            return (
              <div className={gridClass}>
                {ranking.map(({ id, score, rank }, idx) => {
                  const player = activeGame.players.find(p => p.id === id)
                  if (!player) return null
                  const isLeader = hasStarted && id === leaderId

                  const colSpan =
                    count === 5 ? (idx < 3 ? 'col-span-2' : 'col-span-3') : ''

                  // Cartes larges (50% de largeur) : 2 joueurs, 4 joueurs (grille 2x2) ou 2e ligne de 5 joueurs
                  const isCardWide = count <= 2 || count === 4 || (count === 5 && idx >= 3)

                  return (
                    <div
                      key={id}
                      className={`relative flex ${
                        isCardWide ? 'items-center justify-between' : 'flex-col justify-between'
                      } rounded-xl ${
                        isCardWide ? (count <= 2 ? 'px-3 py-2' : 'px-3 py-1.5') : 'px-2 py-1.5'
                      } transition-all min-h-[46px] ${colSpan} ${
                        isLeader
                          ? 'school-card border-[#c83b3b] ring-1 ring-[#c83b3b]/40'
                          : 'school-card'
                      }`}
                    >
                      {isCardWide ? (
                        <>
                          {/* Zone gauche : Avatar centré par rapport au nom */}
                          <div className="flex-1 flex flex-col items-center justify-center min-w-0">
                            <div className="relative inline-flex items-center justify-center">
                              <Avatar
                                player={player}
                                size={count <= 2 ? 'sm-compact' : 'xs'}
                                leader={isLeader}
                                crown={hasStarted && (isLeader || rank === 1)}
                              />

                              {/* Pastille de rang 2e, 3e, etc. */}
                              {hasStarted && rank > 1 && (
                                <span className="absolute top-0.5 -left-2.5 px-1 min-w-[15px] h-3.5 rounded-full flex items-center justify-center text-[8px] font-black leading-none shadow-2xs ring-1 ring-white dark:ring-slate-900 bg-stone-500/90 dark:bg-slate-600 text-white z-10 pointer-events-none select-none">
                                  {rank}e
                                </span>
                              )}
                            </div>

                            <span className="text-[10px] sm:text-[11px] font-bold truncate max-w-full text-center leading-tight mt-0.5 text-stone-900 dark:text-slate-100 block">
                              {player.name}
                            </span>
                          </div>

                          {/* Zone droite restante : Score centré */}
                          <div className="flex-1 min-w-0 flex items-center justify-center">
                            <span className={`font-black tabular-nums leading-none ${
                              count <= 2 ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
                            } ${
                              isLeader ? 'text-[#c83b3b]' : 'text-stone-900 dark:text-slate-100'
                            }`}>
                              {score}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Ligne 1 : Avatar à gauche + Score à droite */}
                          <div className="flex items-center justify-between w-full">
                            <div className="relative inline-flex items-center">
                              <Avatar
                                player={player}
                                size="xs"
                                leader={isLeader}
                                crown={hasStarted && (isLeader || rank === 1)}
                              />
                              {hasStarted && rank > 1 && (
                                <span className="absolute top-0.5 -left-2 px-1 min-w-[14px] h-3.5 rounded-full flex items-center justify-center text-[8px] font-black leading-none shadow-2xs ring-1 ring-white dark:ring-slate-900 bg-stone-500/90 dark:bg-slate-600 text-white z-10 pointer-events-none select-none">
                                  {rank}e
                                </span>
                              )}
                            </div>
                            <span className={`font-black tabular-nums leading-none text-base sm:text-lg ${
                              isLeader ? 'text-[#c83b3b]' : 'text-stone-900 dark:text-slate-100'
                            }`}>
                              {score}
                            </span>
                          </div>

                          {/* Ligne 2 : Nom du joueur sur TOUTE la largeur de la carte */}
                          <span className="text-[10px] sm:text-[11px] font-bold truncate w-full block text-left leading-tight mt-1 text-stone-900 dark:text-slate-100">
                            {player.name}
                          </span>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })()
        )}
            </div>

            {/* Bouton indicateur de repli discret sous la grille */}
            <div className="flex justify-center -mt-0.5 pt-0.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsScoresCollapsed(true)
                }}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium text-stone-400 hover:text-stone-700 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none"
                title="Masquer les scores pour gagner de la place"
              >
                <span>Masquer les scores</span>
                <ChevronUp size={11} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Moteur de saisie de manche */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="px-4 pt-1 pb-8 pb-safe">
          <div
            key={`${activeGame.id}-r-${activeGame.rounds.length}-${activeGame.isCorrection ? 'corr' : 'norm'}`}
            className="animate-round-slide-in"
          >
            <Engine
              game={activeGame}
              leaderId={leaderId}
              onFinish={finishGame}
            />
          </div>

          {/* Actions secondaires sur la même ligne (espacement généreux avec le bas) */}
          <div className="flex items-center gap-2 pt-3 pb-3 mb-2 w-full max-w-sm mx-auto px-1">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-stone-500 hover:text-[#c83b3b] dark:text-slate-400 dark:hover:text-[#c83b3b] border border-stone-200/90 dark:border-slate-800 hover:border-[#c83b3b]/40 dark:hover:border-[#c83b3b]/40 bg-white/70 dark:bg-slate-900/70 hover:bg-stone-50/60 dark:hover:bg-slate-800/60 transition-all active:scale-[0.98] shadow-2xs cursor-pointer whitespace-nowrap group"
            >
              <Trash2 size={12} className="text-stone-400 dark:text-slate-500 group-hover:text-[#c83b3b] shrink-0 transition-colors" />
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
