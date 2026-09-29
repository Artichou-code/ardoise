import { useState } from 'react'
import { ArrowLeft, Trash2, Play, History, FileText, ChevronRight, BarChart3, Share2 } from 'lucide-react'
import { useGame } from '../context/GameContext'
import { GAME_META } from '../constants/games'
import { Avatar } from './ui/Avatar'
import { ThemeToggle } from './ui/ThemeToggle'
import { ConfirmDialog } from './ui/Dialog'
import { GameDetailSheet } from './GameDetailSheet'
import { ShareGamesModal } from './ShareGamesModal'
import { getRanking, formatDate, formatDuration } from '../utils/gameUtils'

export function HistoryScreen() {
  const { games, setScreen, removeGame, resumeGame, createGame } = useGame()
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [detailGame, setDetailGame] = useState(null)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  const sorted = [...games].sort((a, b) => (b.updatedAt || b.startedAt) - (a.updatedAt || a.startedAt))

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden school-surface select-none">
      <header className="flex items-center gap-2 px-4 header-safe pb-3 flex-shrink-0 border-b border-stone-200/90 dark:border-slate-800/90 bg-[#faf9f5]/90 dark:bg-[#151719]/90 backdrop-blur-xs">
        <button
          type="button"
          onClick={() => setScreen('home')}
          className="p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Retour"
        >
          <ArrowLeft size={18} className="text-stone-700 dark:text-slate-300" />
        </button>
        <h1 className="flex-1 font-serif-title font-bold text-lg truncate">
          Archives des parties
        </h1>
        <button
          type="button"
          onClick={() => setIsShareModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:border-[#c83b3b] hover:text-[#c83b3b] text-xs font-bold text-stone-700 dark:text-slate-300 transition-colors cursor-pointer"
          title="Partager ou importer des parties"
        >
          <Share2 size={15} className="text-[#c83b3b]" />
          <span className="hidden sm:inline">Partager</span>
        </button>
        <button
          type="button"
          onClick={() => setScreen('stats')}
          className="p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
          title="Statistiques"
          aria-label="Statistiques"
        >
          <BarChart3 size={18} className="text-stone-700 dark:text-slate-300" />
        </button>
        <ThemeToggle />
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
          <div className="space-y-3">
            {sorted.map(game => {
              const meta = GAME_META[game.type]
              const scoreDir = game.config?.scoreDir === 'low' || game.config?.scoreDir === 'low_limit' || meta?.scoreDir === 'low' ? 'low' : 'high'
              const ranking = getRanking(game.scores, scoreDir)
              const duration = game.finishedAt
                ? formatDuration(game.finishedAt - game.startedAt)
                : null

              return (
                <div
                  key={game.id}
                  onClick={() => setDetailGame(game)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setDetailGame(game)}
                  className="school-card rounded-xl overflow-hidden cursor-pointer hover:border-[#c83b3b]/60 transition-all active:scale-[0.99] shadow-2xs group"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-stone-100 dark:border-slate-800">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-serif-title font-bold text-base truncate">
                          {game.name}
                        </p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          game.status === 'active'
                            ? 'bg-[#c83b3b]/15 text-[#c83b3b]'
                            : 'bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-400'
                        }`}>
                          {game.status === 'active' ? 'En cours' : 'Terminée'}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5">
                        {formatDate(game.startedAt)}
                        {duration ? ` · ${duration}` : ''}
                        {` · ${game.rounds.length} manche${game.rounds.length > 1 ? 's' : ''}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-semibold text-stone-400 group-hover:text-[#c83b3b] transition-colors shrink-0">
                      <span>Détails</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>

                  {/* Scores */}
                  <div className="px-3.5 py-2.5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {ranking.map(({ id, score, rank }) => {
                        const player = game.players.find(p => p.id === id)
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
                            <span className={`text-[10px] font-extrabold tabular-nums shrink-0 ${
                              isWinner ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-400 dark:text-slate-500'
                            }`}>
                              {rank === 1 ? '1er' : `${rank}e`}
                            </span>
                            <Avatar player={player} size="xs" leader={isWinner} leaderColor="#10b981" />
                            <span className="flex-1 truncate font-semibold text-xs min-w-0">
                              {player.name}
                            </span>
                            <span className={`font-black tabular-nums text-xs shrink-0 ${
                              isWinner ? 'text-emerald-700 dark:text-emerald-400' : ''
                            }`}>
                              {score}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex border-t border-stone-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setConfirmDelete(game.id)
                      }}
                      className="flex items-center justify-center gap-1.5 flex-1 py-2.5 text-xs font-semibold text-stone-500 dark:text-slate-400 hover:text-[#c83b3b] hover:bg-stone-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <Trash2 size={13} /> Supprimer
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDetailGame(game)
                      }}
                      className="flex items-center justify-center gap-1.5 flex-1 py-2.5 text-xs font-bold border-l border-stone-100 dark:border-slate-800 text-stone-700 dark:text-slate-200 hover:text-[#c83b3b] hover:bg-stone-50 dark:hover:bg-slate-800/50 transition-colors"
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
                        className="flex items-center justify-center gap-1.5 flex-1 py-2.5 text-xs font-bold border-l border-stone-100 dark:border-slate-800 text-[#c83b3b] hover:bg-[#c83b3b]/5 transition-colors"
                      >
                        <Play size={13} /> Reprendre
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

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
        onClose={() => setIsShareModalOpen(false)}
        onOpenImportGames={(importedGames) => {
          window.dispatchEvent(new CustomEvent('ardoise-open-import-games', { detail: importedGames }))
        }}
      />
    </div>
  )
}
