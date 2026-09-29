import { useState } from 'react'
import { createPortal } from 'react-dom'
import confetti from 'canvas-confetti'
import { X, Trophy, Download, Check, Calendar, Users, Layers, Award } from 'lucide-react'
import { useScrollLock } from '../hooks/useScrollLock'
import { applyNotebook } from '../store/syncStorage'
import { Avatar } from './ui/Avatar'
import { formatDate } from '../utils/gameUtils'

export function SharedGamePreviewModal({ isOpen, onClose, game, onImported }) {
  const [imported, setImported] = useState(false)

  useScrollLock(isOpen)

  if (!isOpen || !game || typeof document === 'undefined') return null

  // Classement final des joueurs par score
  const sortedPlayers = [...(game.players || [])].sort((a, b) => {
    const isAscending = game.config?.scoringMode === 'lowest_wins' || game.type === 'caracole'
    return isAscending ? (a.score || 0) - (b.score || 0) : (b.score || 0) - (a.score || 0)
  })

  const winner = sortedPlayers[0]

  const handleImport = () => {
    try {
      applyNotebook({ games: [game], players: game.players || [] }, 'merge')
      setImported(true)
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        })
      } catch {}

      if (onImported) onImported()
    } catch (err) {
      console.error(err)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-game-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Conteneur principal */}
      <div className="relative w-full max-w-md school-surface text-stone-900 dark:text-slate-100 border border-stone-200/90 dark:border-slate-800/90 shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Liseré supérieur */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#c83b3b] dark:via-[#FFC107] to-transparent z-10" />

        {/* En-tête responsive */}
        <div className="relative z-10 p-3.5 sm:p-4 pb-3 border-b border-stone-200/70 dark:border-slate-800/70 bg-[#faf9f5]/85 dark:bg-[#151719]/85 backdrop-blur-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="p-1.5 rounded-lg bg-[#c83b3b]/10 dark:bg-[#FFC107]/10 text-[#c83b3b] dark:text-[#FFC107] shrink-0">
              <Trophy size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="preview-game-title" className="text-base font-bold font-serif-title leading-snug truncate">
                Partie partagée
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate">
                {game.name} · {formatDate(game.endedAt || game.startedAt)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-stone-200/60 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            title="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corps */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Vainqueur & Podium */}
          {winner && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-2">
              <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider">
                Vainqueur de la partie
              </span>
              <div className="flex items-center justify-center gap-3">
                <Avatar player={winner} size="md" />
                <div className="text-left">
                  <p className="font-bold font-serif-title text-base text-stone-900 dark:text-slate-100 leading-tight">
                    {winner.name}
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-bold">
                    {winner.score} points
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tableau des scores finaux */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 block px-1">
              Classement final
            </span>
            <div className="rounded-xl school-card border border-stone-200 dark:border-slate-800 divide-y divide-stone-100 dark:divide-slate-800/80 overflow-hidden">
              {sortedPlayers.map((p, idx) => (
                <div key={p.id || idx} className="p-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 text-center font-bold text-xs text-stone-400 dark:text-slate-500">
                      {idx + 1}
                    </span>
                    <Avatar player={p} size="sm" />
                    <span className="font-semibold text-xs text-stone-800 dark:text-slate-200">
                      {p.name}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-xs text-stone-900 dark:text-slate-100">
                    {p.score} pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Détails complémentaires */}
          <div className="flex items-center justify-around p-2.5 rounded-xl border border-stone-200/80 dark:border-slate-800/80 text-stone-500 dark:text-slate-400 text-xs">
            <div className="flex items-center gap-1.5">
              <Layers size={14} />
              <span>{game.rounds?.length || 0} manches</span>
            </div>
            <span>·</span>
            <div className="flex items-center gap-1.5">
              <Users size={14} />
              <span>{game.players?.length || 0} participants</span>
            </div>
          </div>
        </div>

        {/* Pied de fenêtre */}
        <div className="p-4 border-t border-stone-200/70 dark:border-slate-800/70 bg-[#faf9f5]/85 dark:bg-[#151719]/85 flex gap-2">
          {imported ? (
            <div className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5">
              <Check size={16} />
              <span>Partie ajoutée à votre carnet !</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleImport}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#c83b3b] hover:bg-[#b91c1c] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download size={15} />
              <span>Ajouter à mon carnet</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-stone-200 dark:border-slate-700 text-xs font-semibold text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
