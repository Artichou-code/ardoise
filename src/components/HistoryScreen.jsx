import { useState } from 'react'
import { ArrowLeft, Trash2, Play } from 'lucide-react'
import { useGame } from '../context/GameContext'
import { GAME_META } from '../constants/games'
import { Avatar } from './ui/Avatar'
import { ThemeToggle } from './ui/ThemeToggle'
import { ConfirmDialog } from './ui/Dialog'
import { getRanking, formatDate, formatDuration } from '../utils/gameUtils'

export function HistoryScreen() {
  const { games, setScreen, removeGame, resumeGame } = useGame()
  const [confirmDelete, setConfirmDelete] = useState(null)

  const sorted = [...games].sort((a, b) => (b.updatedAt || b.startedAt) - (a.updatedAt || a.startedAt))

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-white dark:bg-zinc-950">
      <header className="flex items-center gap-2 px-4 pt-safe pt-4 pb-3 flex-shrink-0 border-b border-zinc-100 dark:border-zinc-900">
        <button
          onClick={() => setScreen('home')}
          className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft size={20} className="text-zinc-600 dark:text-zinc-400" />
        </button>
        <h1 className="flex-1 font-black text-zinc-900 dark:text-zinc-100 text-lg">Historique</h1>
        <ThemeToggle />
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-6">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="text-5xl mb-4">🃏</span>
            <p className="text-zinc-400 dark:text-zinc-500 text-sm">Aucune partie enregistrée</p>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {sorted.map(game => {
              const meta = GAME_META[game.type]
              const ranking = getRanking(game.scores, meta?.scoreDir === 'low' ? 'low' : 'high')
              const winner = game.players.find(p => p.id === game.winner)
              const duration = game.finishedAt
                ? formatDuration(game.finishedAt - game.startedAt)
                : null

              return (
                <div
                  key={game.id}
                  className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="text-2xl">{meta?.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{game.name}</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">
                        {formatDate(game.startedAt)}
                        {duration ? ` · ${duration}` : ''}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                      game.status === 'active'
                        ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                    }`}>
                      {game.status === 'active' ? 'En cours' : 'Terminée'}
                    </span>
                  </div>

                  {/* Scores */}
                  <div className="px-4 py-3 space-y-1.5">
                    {ranking.map(({ id, score, rank }) => {
                      const player = game.players.find(p => p.id === id)
                      if (!player) return null
                      return (
                        <div key={id} className="flex items-center gap-2.5">
                          <span className="w-5 text-center text-sm">
                            {rank === 1 && game.status === 'finished' ? '🥇' : rank}
                          </span>
                          <Avatar player={player} size="xs" />
                          <span className="flex-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200">{player.name}</span>
                          <span className="font-black tabular-nums text-sm" style={rank === 1 && game.status === 'finished' ? { color: '#fcc817' } : {}}>
                            {score}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex border-t border-zinc-100 dark:border-zinc-800">
                    <button
                      onClick={() => setConfirmDelete(game.id)}
                      className="flex items-center justify-center gap-1.5 flex-1 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    >
                      <Trash2 size={14} /> Supprimer
                    </button>
                    {game.status === 'active' && (
                      <button
                        onClick={() => resumeGame(game.id)}
                        className="flex items-center justify-center gap-1.5 flex-1 py-2.5 text-xs font-bold border-l border-zinc-100 dark:border-zinc-800 transition-colors"
                        style={{ color: '#fcc817' }}
                      >
                        <Play size={14} /> Reprendre
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => removeGame(confirmDelete)}
        title="Supprimer la partie ?"
        message="Cette action est irréversible."
        confirmLabel="Supprimer"
        danger
      />
    </div>
  )
}
