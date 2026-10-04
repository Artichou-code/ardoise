import { useState, useRef } from 'react'
import {
  ArrowLeft,
  Trash2,
  Play,
  History,
  FileText,
  ChevronRight,
  BarChart3,
  Share2,
  CheckSquare,
  Square,
  X,
  QrCode,
} from 'lucide-react'
import { useGame } from '../context/GameContext'
import { GAME_META, getGameDisplayName } from '../constants/games'
import { Avatar } from './ui/Avatar'
import { ConfirmDialog } from './ui/Dialog'
import { GameDetailSheet } from './GameDetailSheet'
import { ShareGamesModal } from './ShareGamesModal'
import { BurgerMenuButton } from './BurgerMenu'
import { getRanking, formatDate, formatDuration, computePlayDuration } from '../utils/gameUtils'

export function HistoryScreen() {
  const { games, setScreen, removeGame, resumeGame, createGame } = useGame()
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [detailGame, setDetailGame] = useState(null)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [autoGenerateShare, setAutoGenerateShare] = useState(false)

  // Mode sélection multiple (activé par appui long sur une carte)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])

  const longPressTimerRef = useRef(null)
  const longPressTriggeredRef = useRef(false)
  const touchStartPosRef = useRef(null)

  const sorted = [...games].sort(
    (a, b) => (b.updatedAt || b.startedAt) - (a.updatedAt || a.startedAt)
  )

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const triggerLongPress = (gameId) => {
    longPressTriggeredRef.current = true
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(25)
      } catch {}
    }
    setIsSelectionMode(true)
    setSelectedIds((prev) => (prev.includes(gameId) ? prev : [...prev, gameId]))
  }

  const handlePointerDown = (gameId, e) => {
    // Toujours réinitialiser au début d'un nouvel appui (corrige le bug du double clic après un appui long)
    longPressTriggeredRef.current = false
    if (isSelectionMode) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    touchStartPosRef.current = { x: e.clientX, y: e.clientY }
    clearLongPressTimer()
    longPressTimerRef.current = setTimeout(() => {
      triggerLongPress(gameId)
    }, 420)
  }

  const handlePointerMove = (e) => {
    if (!touchStartPosRef.current || !longPressTimerRef.current) return
    const dx = Math.abs(e.clientX - touchStartPosRef.current.x)
    const dy = Math.abs(e.clientY - touchStartPosRef.current.y)
    if (dx > 10 || dy > 10) {
      clearLongPressTimer()
    }
  }

  const handlePointerEnd = () => {
    clearLongPressTimer()
  }

  const toggleSelectGame = (gameId) => {
    setSelectedIds((prev) => {
      const next = prev.includes(gameId)
        ? prev.filter((id) => id !== gameId)
        : [...prev, gameId]
      if (next.length === 0) {
        setIsSelectionMode(false)
      }
      return next
    })
  }

  const handleCardClick = (game) => {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false
      return
    }
    if (isSelectionMode) {
      toggleSelectGame(game.id)
    } else {
      setDetailGame(game)
    }
  }

  const handleExitSelectionMode = () => {
    setIsSelectionMode(false)
    setSelectedIds([])
  }

  const handleSelectAll = () => {
    if (selectedIds.length === sorted.length) {
      setSelectedIds([])
      setIsSelectionMode(false)
    } else {
      setSelectedIds(sorted.map((g) => g.id))
      setIsSelectionMode(true)
    }
  }

  const handleShareSelected = () => {
    if (selectedIds.length === 0) return
    setAutoGenerateShare(true)
    setIsShareModalOpen(true)
  }

  const handleHeaderShareClick = () => {
    if (isSelectionMode && selectedIds.length > 0) {
      handleShareSelected()
    } else {
      setAutoGenerateShare(false)
      setIsShareModalOpen(true)
    }
  }

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden school-surface select-none">
      <header className="flex items-center gap-2 px-4 header-safe pb-3 flex-shrink-0 border-b border-stone-200/90 dark:border-slate-800/90 bg-[#faf9f5]/90 dark:bg-[#151719]/90 backdrop-blur-xs">
        <button
          type="button"
          onClick={() => (isSelectionMode ? handleExitSelectionMode() : setScreen('home'))}
          className="p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Retour"
        >
          {isSelectionMode ? (
            <X size={18} className="text-stone-700 dark:text-slate-300" />
          ) : (
            <ArrowLeft size={18} className="text-stone-700 dark:text-slate-300" />
          )}
        </button>

        <h1 className="flex-1 font-serif-title font-bold text-lg truncate">
          {isSelectionMode
            ? `${selectedIds.length} sélectionnée${selectedIds.length > 1 ? 's' : ''}`
            : 'Historique'}
        </h1>

        {isSelectionMode ? (
          <button
            type="button"
            onClick={handleSelectAll}
            className="px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-xs font-bold text-[#c83b3b] transition-colors cursor-pointer"
          >
            {selectedIds.length === sorted.length ? 'Tout décocher' : 'Tout cocher'}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleHeaderShareClick}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:border-[#c83b3b] hover:text-[#c83b3b] text-xs font-bold text-stone-700 dark:text-slate-300 transition-colors cursor-pointer"
              title="Partager ou importer des parties"
            >
              <Share2 size={15} className="text-[#c83b3b]" />
              <span className="hidden sm:inline">Partager</span>
            </button>
            <button
              type="button"
              onClick={() => setScreen('stats')}
              className="p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Statistiques"
              aria-label="Statistiques"
            >
              <BarChart3 size={18} className="text-stone-700 dark:text-slate-300" />
            </button>
            <BurgerMenuButton />
          </>
        )}
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-3 scroll-bottom-space">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
            <div className="w-12 h-12 rounded-2xl school-card flex items-center justify-center mb-3">
              <History size={22} className="text-stone-400 dark:text-slate-500" />
            </div>
            <p className="font-serif-title font-bold text-base mb-1">
              Aucune partie archivée
            </p>
            <p className="text-stone-500 dark:text-slate-400 text-xs">
              Vos parties en cours et terminées apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="space-y-3 pb-16">
            {/* Indication discrète pour l'appui long */}
            {!isSelectionMode && sorted.length > 1 && (
              <p className="text-[11px] text-stone-400 dark:text-slate-500 text-center whitespace-nowrap">
                Appui long pour sélectionner plusieurs parties
              </p>
            )}

            {sorted.map((game) => {
              const meta = GAME_META[game.type]
              const scoreDir =
                game.config?.scoreDir === 'low' ||
                game.config?.scoreDir === 'low_limit' ||
                meta?.scoreDir === 'low'
                  ? 'low'
                  : 'high'
              const ranking = getRanking(game.scores, scoreDir, game)
              const duration = game.finishedAt
                ? formatDuration(computePlayDuration(game))
                : null
              const isSelected = selectedIds.includes(game.id)

              return (
                <div
                  key={game.id}
                  onPointerDown={(e) => handlePointerDown(game.id, e)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerEnd}
                  onPointerCancel={handlePointerEnd}
                  onPointerLeave={handlePointerEnd}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    if (!isSelectionMode) {
                      triggerLongPress(game.id)
                    }
                  }}
                  onClick={() => handleCardClick(game)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleCardClick(game)}
                  className={`rounded-xl overflow-hidden cursor-pointer transition-all active:scale-[0.99] shadow-2xs group ${
                    isSelected
                      ? 'border-2 border-[#c83b3b] ring-2 ring-[#c83b3b]/15 bg-white dark:bg-slate-900'
                      : game.status === 'active'
                      ? 'bg-[#c83b3b]/[0.04] dark:bg-[#c83b3b]/[0.08] border border-[#c83b3b]/35 dark:border-[#c83b3b]/45 hover:border-[#c83b3b]'
                      : 'school-card hover:border-[#c83b3b]/60'
                  }`}
                >
                  {/* Header */}
                  <div className={`flex items-center justify-between gap-3 px-4 py-3 border-b ${
                    game.status === 'active'
                      ? 'border-[#c83b3b]/15 dark:border-[#c83b3b]/25'
                      : 'border-stone-100 dark:border-slate-800'
                  }`}>
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {isSelectionMode && (
                        <div className="text-[#c83b3b] shrink-0">
                          {isSelected ? (
                            <CheckSquare size={18} />
                          ) : (
                            <Square size={18} className="text-stone-400 dark:text-slate-500" />
                          )}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-serif-title font-bold text-base truncate">
                            {getGameDisplayName(game)}
                          </p>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap ${
                              game.status === 'active'
                                ? 'bg-[#c83b3b]/15 text-[#c83b3b]'
                                : 'bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-400'
                            }`}
                          >
                            {game.status === 'active' ? 'En cours' : 'Terminée'}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5">
                          {formatDate(game.startedAt)}
                          {duration ? ` · ${duration}` : ''}
                          {` · ${game.rounds.length} manche${game.rounds.length > 1 ? 's' : ''}`}
                        </p>
                      </div>
                    </div>

                    {!isSelectionMode && (
                      <div className="flex items-center gap-1 text-xs font-semibold text-stone-400 group-hover:text-[#c83b3b] transition-colors shrink-0">
                        <span>Détails</span>
                        <ChevronRight size={14} />
                      </div>
                    )}
                  </div>

                  {/* Scores */}
                  <div className="px-3.5 py-2.5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {ranking.map(({ id, score, rank }) => {
                        const player = game.players.find((p) => p.id === id)
                        if (!player) return null
                        const isWinner = rank === 1 && game.status === 'finished'
                        return (
                          <div
                            key={id}
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
                              isWinner
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-stone-900 dark:text-slate-100 font-bold'
                                : 'bg-stone-50/60 dark:bg-slate-800/40 border-stone-200/60 dark:border-slate-800 text-stone-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="relative shrink-0">
                              <Avatar
                                player={player}
                                size="xs"
                                leader={isWinner}
                                leaderColor="#10b981"
                                crown={rank === 1}
                              />
                              {rank > 1 && (
                                <span
                                  className="absolute -top-1.5 -left-1 px-1 min-w-[15px] h-3.5 rounded-full flex items-center justify-center text-[8px] font-black leading-none shadow-2xs ring-1 ring-white dark:ring-slate-900 bg-stone-500/90 dark:bg-slate-600 text-white"
                                >
                                  {`${rank}e`}
                                </span>
                              )}
                            </div>
                            <span className="flex-1 truncate font-semibold text-xs min-w-0">
                              {player.name}
                            </span>
                            <span
                              className={`font-black tabular-nums text-xs shrink-0 ${
                                isWinner ? 'text-emerald-700 dark:text-emerald-400' : ''
                              }`}
                            >
                              {score}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Actions (masquées pendant la sélection multiple pour éviter les faux clics) */}
                  {!isSelectionMode && (
                    <div className={`flex border-t ${
                      game.status === 'active'
                        ? 'border-[#c83b3b]/15 dark:border-[#c83b3b]/25 bg-black/[0.015] dark:bg-white/[0.015]'
                        : 'border-stone-100 dark:border-slate-800'
                    }`}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setConfirmDelete(game.id)
                        }}
                        className="flex items-center justify-center gap-1.5 flex-1 py-2.5 text-xs font-semibold text-stone-500 dark:text-slate-400 hover:text-[#c83b3b] hover:bg-stone-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} /> Supprimer
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDetailGame(game)
                        }}
                        className={`flex items-center justify-center gap-1.5 flex-1 py-2.5 text-xs font-bold border-l text-stone-700 dark:text-slate-200 hover:text-[#c83b3b] hover:bg-stone-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                          game.status === 'active'
                            ? 'border-[#c83b3b]/15 dark:border-[#c83b3b]/25'
                            : 'border-stone-100 dark:border-slate-800'
                        }`}
                      >
                        <FileText size={13} className="text-[#c83b3b]" /> Déroulement
                      </button>
                      {game.status === 'active' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            resumeGame(game.id)
                          }}
                          className={`flex items-center justify-center gap-1.5 flex-1 py-2.5 text-xs font-bold border-l text-[#c83b3b] hover:bg-[#c83b3b]/10 transition-colors cursor-pointer ${
                            game.status === 'active'
                              ? 'border-[#c83b3b]/15 dark:border-[#c83b3b]/25'
                              : 'border-stone-100 dark:border-slate-800'
                          }`}
                        >
                          <Play size={13} /> Reprendre
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Barre flottante en bas quand des parties sont sélectionnées par appui long */}
      {isSelectionMode && selectedIds.length > 0 && (
        <div className="fixed bottom-4 inset-x-4 z-40 max-w-md mx-auto flex items-center gap-2 p-2.5 rounded-2xl bg-[#faf9f5]/95 dark:bg-[#151719]/95 border border-stone-300 dark:border-slate-700 shadow-2xl backdrop-blur-md animate-in fade-in">
          <button
            type="button"
            onClick={handleExitSelectionMode}
            className="px-3 py-2.5 rounded-xl border border-stone-200 dark:border-slate-700 text-xs font-semibold text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleShareSelected}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#c83b3b] hover:bg-[#b91c1c] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <QrCode size={15} />
            <span>
              Partager {selectedIds.length} partie{selectedIds.length > 1 ? 's' : ''}
            </span>
          </button>
        </div>
      )}

      {/* Feuille de détails et déroulement complet */}
      <GameDetailSheet
        game={detailGame}
        open={!!detailGame}
        onClose={() => setDetailGame(null)}
        onResume={(id) => {
          setDetailGame(null)
          resumeGame(id)
        }}
        onRematch={(g) => {
          setDetailGame(null)
          createGame(g.type, g.players, g.config)
        }}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => removeGame(confirmDelete)}
        title="Supprimer la partie ?"
        message="Cette action supprimera définitivement cette feuille de score."
        confirmLabel="Supprimer"
        danger
      />

      <ShareGamesModal
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false)
          setAutoGenerateShare(false)
          if (isSelectionMode) {
            setIsSelectionMode(false)
            setSelectedIds([])
          }
        }}
        initialSelectedIds={selectedIds.length > 0 ? selectedIds : null}
        autoGenerate={autoGenerateShare}
        onOpenImportGames={(importedGames) => {
          window.dispatchEvent(new CustomEvent('ardoise-open-import-games', { detail: importedGames }))
        }}
      />
    </div>
  )
}

