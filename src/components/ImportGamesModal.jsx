import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import confetti from 'canvas-confetti'
import {
  X,
  Trophy,
  Download,
  Check,
  Users,
  Layers,
  UserPlus,
  GitMerge,
  Calendar,
  CheckSquare,
  Square,
} from 'lucide-react'
import { useScrollLock } from '../hooks/useScrollLock'
import { detectPlayerConflicts, importGamesWithResolution } from '../store/syncStorage'
import { Avatar } from './ui/Avatar'
import { formatDate, formatShortDate } from '../utils/gameUtils'

export function ImportGamesModal({ isOpen, onClose, games: rawGames, game: singleGame, onImported }) {
  const [importedResult, setImportedResult] = useState(null)
  const [selectedGameIds, setSelectedGameIds] = useState([])
  const [resolutions, setResolutions] = useState({}) // { [normalizedKey]: 'merge' | 'separate' }

  useScrollLock(isOpen)

  const allIncomingGames = useMemo(() => {
    if (Array.isArray(rawGames) && rawGames.length > 0) return rawGames.filter(Boolean)
    if (singleGame && singleGame.id) return [singleGame]
    return []
  }, [rawGames, singleGame])

  useEffect(() => {
    if (!isOpen || allIncomingGames.length === 0) return
    setImportedResult(null)
    setSelectedGameIds(allIncomingGames.map((g) => g.id))

    const { conflicts } = detectPlayerConflicts(allIncomingGames)
    const initialRes = {}
    conflicts.forEach((c) => {
      initialRes[c.key] = 'merge'
    })
    setResolutions(initialRes)
  }, [isOpen, allIncomingGames])

  const gamesToImport = useMemo(() => {
    return allIncomingGames.filter((g) => selectedGameIds.includes(g.id))
  }, [allIncomingGames, selectedGameIds])

  const { conflicts, newPlayers } = useMemo(() => {
    return detectPlayerConflicts(gamesToImport)
  }, [gamesToImport])

  if (!isOpen || allIncomingGames.length === 0 || typeof document === 'undefined') return null

  const isSingle = allIncomingGames.length === 1
  const firstGame = allIncomingGames[0]

  // Classement si partie unique
  const sortedSinglePlayers = isSingle
    ? [...(firstGame.players || [])].sort((a, b) => {
        const scoreA = firstGame.scores?.[a.id] ?? a.score ?? 0
        const scoreB = firstGame.scores?.[b.id] ?? b.score ?? 0
        const isLow =
          firstGame.config?.scoreDir === 'low' ||
          firstGame.config?.scoreDir === 'low_limit' ||
          firstGame.type === 'caracole' ||
          firstGame.type === 'dourak'
        return isLow ? scoreA - scoreB : scoreB - scoreA
      })
    : []

  const singleWinner = sortedSinglePlayers[0]

  const toggleGameSelection = (id) => {
    setSelectedGameIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleSetResolution = (key, choice) => {
    setResolutions((prev) => ({ ...prev, [key]: choice }))
  }

  const handleImport = () => {
    if (gamesToImport.length === 0) return
    try {
      const result = importGamesWithResolution(gamesToImport, resolutions)
      setImportedResult({
        gamesCount: gamesToImport.length,
        gamesAdded: result.stats?.gamesAdded || 0,
        playersAdded: result.stats?.playersAdded || 0,
        mergedCount: Object.values(resolutions).filter((v) => v === 'merge').length,
      })

      try {
        confetti({
          particleCount: 55,
          spread: 65,
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
      aria-labelledby="import-games-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Conteneur principal */}
      <div className="relative w-full max-w-md school-surface text-stone-900 dark:text-slate-100 border border-stone-200/90 dark:border-slate-800/90 shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Liseré supérieur rouge signature */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#c83b3b] to-transparent z-10" />

        {/* En-tête responsive */}
        <div className="relative z-10 p-3.5 sm:p-4 pb-3 border-b border-stone-200/70 dark:border-slate-800/70 bg-[#faf9f5]/85 dark:bg-[#151719]/85 backdrop-blur-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="p-1.5 rounded-lg bg-[#c83b3b]/10 dark:bg-[#c83b3b]/20 text-[#c83b3b] shrink-0">
              <Trophy size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="import-games-title" className="text-base font-bold font-serif-title leading-snug truncate">
                {isSingle ? 'Partie partagée' : `Lot de ${allIncomingGames.length} parties partagées`}
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate">
                {isSingle
                  ? `${firstGame.name} · ${formatDate(firstGame.finishedAt || firstGame.endedAt || firstGame.startedAt)}`
                  : 'Sélectionnez les parties et vérifiez les joueurs à importer'}
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

        {/* Corps scrollable */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {isSingle ? (
            /* APERÇU PARTIE UNIQUE */
            <>
              {singleWinner && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-center space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 tracking-wider">
                    En tête de la partie
                  </span>
                  <div className="flex items-center justify-center gap-3">
                    <Avatar player={singleWinner} size="md" />
                    <div className="text-left">
                      <p className="font-bold font-serif-title text-base text-stone-900 dark:text-slate-100 leading-tight">
                        {singleWinner.name}
                      </p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                        {firstGame.scores?.[singleWinner.id] ?? singleWinner.score ?? 0} pts
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 block px-1">
                  Classement et scores
                </span>
                <div className="rounded-xl school-card border border-stone-200 dark:border-slate-800 divide-y divide-stone-100 dark:divide-slate-800/80 overflow-hidden">
                  {sortedSinglePlayers.map((p, idx) => {
                    const pScore = firstGame.scores?.[p.id] ?? p.score ?? 0
                    return (
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
                          {pScore} pts
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center justify-around p-2.5 rounded-xl border border-stone-200/80 dark:border-slate-800/80 text-stone-500 dark:text-slate-400 text-xs">
                <div className="flex items-center gap-1.5">
                  <Layers size={14} />
                  <span>{firstGame.rounds?.length || 0} manches</span>
                </div>
                <span>·</span>
                <div className="flex items-center gap-1.5">
                  <Users size={14} />
                  <span>{firstGame.players?.length || 0} joueurs</span>
                </div>
              </div>
            </>
          ) : (
            /* APERÇU MULTI-PARTIES */
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                  Parties incluses ({selectedGameIds.length}/{allIncomingGames.length})
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-0.5">
                {allIncomingGames.map((g) => {
                  const isSelected = selectedGameIds.includes(g.id)
                  return (
                    <div
                      key={g.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleGameSelection(g.id)}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault()
                          toggleGameSelection(g.id)
                        }
                      }}
                      className={`px-2.5 py-2 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer select-none ${
                        isSelected
                          ? 'border-[#c83b3b] bg-[#c83b3b]/5 dark:bg-[#c83b3b]/10'
                          : 'school-card border-stone-200 dark:border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="text-[#c83b3b] shrink-0">
                        {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-serif-title font-bold text-xs text-stone-900 dark:text-slate-100 truncate">
                            {g.name}
                          </span>
                          <span className="text-[10px] font-mono text-stone-400 shrink-0 whitespace-nowrap">
                            {g.rounds?.length || 0} m. · {formatShortDate(g.finishedAt || g.endedAt || g.startedAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 dark:text-slate-300 leading-snug">
                          {(g.players || []).map((p) => p.name).join(' · ')}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* NOUVEAUX JOUEURS CRÉÉS AUTOMATIQUEMENT */}
          {newPlayers.length > 0 && !importedResult && (
            <div className="p-3 rounded-xl border border-stone-200/80 dark:border-slate-800 bg-stone-50/70 dark:bg-slate-900/40 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-slate-300">
                <UserPlus size={14} className="text-[#c83b3b]" />
                <span>
                  {newPlayers.length} nouveau{newPlayers.length > 1 ? 'x' : ''} joueur
                  {newPlayers.length > 1 ? 's' : ''} ajouté{newPlayers.length > 1 ? 's' : ''} à votre carnet
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {newPlayers.map((np, i) => (
                  <span
                    key={np.id || i}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-xs font-semibold text-stone-800 dark:text-slate-200"
                  >
                    <Avatar player={np} size="2xs" />
                    <span>{np.name}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* RÉSOLUTION DES DOUBLONS DE PRÉNOMS */}
          {conflicts.length > 0 && !importedResult && (
            <div className="p-3.5 rounded-2xl border border-[#c83b3b]/30 bg-[#c83b3b]/5 dark:bg-[#c83b3b]/10 space-y-3">
              <div className="flex items-start gap-2">
                <GitMerge size={15} className="text-[#c83b3b] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-stone-900 dark:text-slate-100">
                    Même prénom détecté dans votre carnet
                  </p>
                  <p className="text-[11px] text-stone-600 dark:text-slate-400 leading-snug mt-0.5">
                    Confirmez s'il s'agit des mêmes joueurs pour fusionner leurs statistiques (l'avatar et la couleur importés seront conservés)&nbsp;:
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {conflicts.map((c) => {
                  const currentChoice = resolutions[c.key] || 'merge'
                  return (
                    <div
                      key={c.key}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar player={c.incomingPlayer} size="xs" />
                          <span className="font-bold text-xs text-stone-900 dark:text-slate-100 truncate">
                            {c.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-stone-400 dark:text-slate-500">
                          Déjà présent dans votre carnet
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSetResolution(c.key, 'merge')}
                          className={`py-1.5 px-2 rounded-lg border text-[11px] font-bold transition-all cursor-pointer text-center ${
                            currentChoice === 'merge'
                              ? 'border-[#c83b3b] bg-[#c83b3b] text-white shadow-2xs'
                              : 'border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-400 hover:bg-stone-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          Même joueur (Fusionner)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetResolution(c.key, 'separate')}
                          className={`py-1.5 px-2 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer text-center ${
                            currentChoice === 'separate'
                              ? 'border-[#c83b3b] bg-[#c83b3b] text-white shadow-2xs'
                              : 'border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-400 hover:bg-stone-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          Autre ({c.name} 2)
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Pied de fenêtre */}
        <div className="p-4 border-t border-stone-200/70 dark:border-slate-800/70 bg-[#faf9f5]/85 dark:bg-[#151719]/85 flex gap-2">
          {importedResult ? (
            <div className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5">
              <Check size={16} />
              <span>
                {importedResult.gamesCount} partie{importedResult.gamesCount > 1 ? 's' : ''} enregistrée
                {importedResult.gamesCount > 1 ? 's' : ''} dans votre carnet&nbsp;!
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleImport}
              disabled={gamesToImport.length === 0}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#c83b3b] hover:bg-[#b91c1c] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-2xs"
            >
              <Download size={15} />
              <span>
                Importer {gamesToImport.length} partie{gamesToImport.length > 1 ? 's' : ''} dans mon carnet
              </span>
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
