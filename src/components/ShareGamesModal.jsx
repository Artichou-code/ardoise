import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { QRCodeSVG } from 'qrcode.react'
import {
  X,
  Share2,
  QrCode,
  Copy,
  Check,
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckSquare,
  Square,
  Download,
  Trophy,
  Calendar,
} from 'lucide-react'
import { useScrollLock } from '../hooks/useScrollLock'
import { useGame } from '../context/GameContext'
import { shareGamesBatch, fetchSharedGame, extractCodeFromInput } from '../store/syncStorage'
import { Avatar } from './ui/Avatar'
import { formatShortDate } from '../utils/gameUtils'

export function ShareGamesModal({
  isOpen,
  onClose,
  onOpenImportGames,
  initialSelectedIds = null,
  autoGenerate = false,
}) {
  const { games } = useGame()
  const [activeTab, setActiveTab] = useState('send') // 'send' | 'receive'
  const [selectedIds, setSelectedIds] = useState([])
  const [shareResult, setShareResult] = useState(null) // { gameCode, count }
  const [receiveCode, setReceiveCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  useScrollLock(isOpen)

  // Trier toutes les parties de la plus récente à la plus ancienne
  const sortedGames = useMemo(() => {
    return [...(Array.isArray(games) ? games : [])]
      .filter((g) => g && g.id)
      .sort(
        (a, b) =>
          (b.finishedAt || b.updatedAt || b.startedAt || 0) -
          (a.finishedAt || a.updatedAt || a.startedAt || 0)
      )
  }, [games])

  // Parties jouées aujourd'hui
  const todayIds = useMemo(() => {
    const todayStr = new Date().toDateString()
    return sortedGames
      .filter((g) => {
        const ts = g.finishedAt || g.updatedAt || g.startedAt
        return ts && new Date(ts).toDateString() === todayStr
      })
      .map((g) => g.id)
  }, [sortedGames])

  // Initialiser la sélection à l'ouverture
  useEffect(() => {
    if (!isOpen) return
    setError(null)
    setCopied(false)
    setShareResult(null)
    setReceiveCode('')
    setActiveTab('send')

    let startIds = []
    if (Array.isArray(initialSelectedIds) && initialSelectedIds.length > 0) {
      startIds = initialSelectedIds
    } else if (todayIds.length > 0) {
      startIds = todayIds
    } else if (sortedGames.length > 0) {
      startIds = [sortedGames[0].id]
    }
    setSelectedIds(startIds)

    if (autoGenerate && startIds.length > 0) {
      const chosenGames = sortedGames.filter((g) => startIds.includes(g.id))
      if (chosenGames.length > 0) {
        setIsLoading(true)
        shareGamesBatch(chosenGames)
          .then((data) => {
            setShareResult({
              gameCode: data.gameCode,
              count: chosenGames.length,
            })
          })
          .catch((err) => {
            setError(err.message || 'Impossible de générer le lien de partage')
          })
          .finally(() => {
            setIsLoading(false)
          })
      }
    }
  }, [isOpen, initialSelectedIds, autoGenerate])

  const toggleGame = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedIds.length === sortedGames.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(sortedGames.map((g) => g.id))
    }
  }

  const handleSelectToday = () => {
    setSelectedIds(todayIds)
  }

  const handleGenerateShare = async () => {
    const chosenGames = sortedGames.filter((g) => selectedIds.includes(g.id))
    if (chosenGames.length === 0 || isLoading) return

    setIsLoading(true)
    setError(null)
    setCopied(false)
    try {
      const data = await shareGamesBatch(chosenGames)
      setShareResult({
        gameCode: data.gameCode,
        count: chosenGames.length,
      })
    } catch (err) {
      setError(err.message || 'Impossible de générer le lien de partage')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFetchByCode = async (e) => {
    e.preventDefault()
    const clean = extractCodeFromInput(receiveCode)
    if (!clean || isLoading) return

    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchSharedGame(clean)
      if (data && Array.isArray(data.games) && data.games.length > 0) {
        onClose()
        if (onOpenImportGames) {
          onOpenImportGames(data.games)
        }
      } else {
        setError('Aucune partie trouvée pour ce code')
      }
    } catch (err) {
      setError(err.message || 'Code de partage introuvable')
    } finally {
      setIsLoading(false)
    }
  }

  const shareUrl = shareResult?.gameCode
    ? `${window.location.origin}/?share=${encodeURIComponent(shareResult.gameCode)}`
    : ''

  const handleCopy = () => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleNativeShare = async () => {
    if (!shareUrl) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Parties Ardoise (${shareResult.count})`,
          text: `Importe nos ${shareResult.count} partie${shareResult.count > 1 ? 's' : ''} et les scores directement dans ton application Ardoise\u00A0:`,
          url: shareUrl,
        })
      } catch {}
    } else {
      handleCopy()
    }
  }

  if (!isOpen || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-games-modal-title"
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

        {/* En-tête */}
        <div className="relative z-10 p-3.5 sm:p-4 pb-3 border-b border-stone-200/70 dark:border-slate-800/70 bg-[#faf9f5]/85 dark:bg-[#151719]/85 backdrop-blur-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="p-1.5 rounded-lg bg-[#c83b3b]/10 dark:bg-[#c83b3b]/20 text-[#c83b3b] shrink-0">
              <Share2 size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="share-games-modal-title" className="text-base font-bold font-serif-title leading-snug truncate">
                Partager des parties
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate">
                Envoyer ou recevoir un lot de parties par QR code
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

        {/* Onglets Envoyer / Recevoir */}
        <div className="px-4 pt-2 flex border-b border-stone-200/60 dark:border-slate-800/60 bg-[#faf9f5]/50 dark:bg-[#151719]/50">
          <button
            type="button"
            onClick={() => {
              setActiveTab('send')
              setError(null)
            }}
            className={`flex-1 pb-2 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus:outline-none ${
              activeTab === 'send'
                ? 'border-[#c83b3b] text-[#c83b3b]'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <QrCode size={14} />
            <span>Envoyer des parties</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('receive')
              setError(null)
            }}
            className={`flex-1 pb-2 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer focus:outline-none ${
              activeTab === 'receive'
                ? 'border-[#c83b3b] text-[#c83b3b]'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Download size={14} />
            <span>Saisir un code reçu</span>
          </button>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mx-4 mt-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-800/50 flex items-center justify-between gap-2">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} className="p-1 shrink-0">
              <X size={12} />
            </button>
          </div>
        )}

        {/* Corps scrollable */}
        <div className="p-3.5 sm:p-4 overflow-y-auto space-y-3 flex-1">
          {activeTab === 'send' ? (
            shareResult ? (
              /* VUE QR CODE GÉNÉRÉ */
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                  <Check size={14} />
                  <span>
                    Lot prêt\u00A0: {shareResult.count} partie{shareResult.count > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-2xl shadow-sm border border-stone-200 inline-block">
                  <QRCodeSVG value={shareUrl} size={175} level="M" marginSize={1} />
                </div>

                <div>
                  <span className="text-[10px] text-stone-400 dark:text-slate-500 uppercase tracking-widest font-semibold block">
                    Code de partage
                  </span>
                  <span className="font-mono font-bold text-lg tracking-widest text-[#c83b3b] select-all">
                    {shareResult.gameCode}
                  </span>
                </div>

                <p className="text-xs text-stone-500 dark:text-slate-400 max-w-xs leading-relaxed">
                  Votre ami peut scanner ce QR code ou entrer le code <strong>{shareResult.gameCode}</strong> pour importer ces parties et leurs joueurs dans son carnet.
                </p>

                <div className="w-full flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-stone-50 font-bold text-xs text-stone-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    <span>{copied ? 'Lien copié\u00A0!' : 'Copier le lien'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="py-2.5 px-4 rounded-xl bg-[#c83b3b] hover:bg-[#b91c1c] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Share2 size={14} />
                    <span>Envoyer</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShareResult(null)}
                  className="text-xs font-semibold text-stone-500 hover:text-stone-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer pt-1"
                >
                  <ArrowLeft size={13} />
                  <span>Modifier la sélection des parties</span>
                </button>
              </div>
            ) : sortedGames.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <p className="font-serif-title font-bold text-sm text-stone-700 dark:text-slate-300">
                  Aucune partie enregistrée
                </p>
                <p className="text-xs text-stone-500 dark:text-slate-400">
                  Jouez une première partie pour pouvoir la partager avec vos amis.
                </p>
              </div>
            ) : (
              /* SÉLECTION MULTI-PARTIES */
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 px-0.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 whitespace-nowrap">
                    Parties ({selectedIds.length}/{sortedGames.length})
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {todayIds.length > 0 && todayIds.length < sortedGames.length && (
                      <button
                        type="button"
                        onClick={handleSelectToday}
                        className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-stone-200/70 dark:bg-slate-800 text-stone-700 dark:text-slate-300 hover:text-[#c83b3b] transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Aujourd'hui ({todayIds.length})
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-[11px] font-bold text-[#c83b3b] hover:underline cursor-pointer whitespace-nowrap"
                    >
                      {selectedIds.length === sortedGames.length ? 'Tout décocher' : 'Tout cocher'}
                    </button>
                  </div>
                </div>

                <div className="max-h-[48vh] overflow-y-auto space-y-1.5 pr-0.5">
                  {sortedGames.map((g) => {
                    const isSelected = selectedIds.includes(g.id)
                    const winner = (g.players || []).find(
                      (p) => p.id === (g.winner?.id || g.winner)
                    )
                    return (
                      <div
                        key={g.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleGame(g.id)}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault()
                            toggleGame(g.id)
                          }
                        }}
                        className={`px-2.5 py-2 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer select-none ${
                          isSelected
                            ? 'border-[#c83b3b] bg-[#c83b3b]/5 dark:bg-[#c83b3b]/10 shadow-2xs'
                            : 'school-card border-stone-200 dark:border-slate-800 hover:border-stone-300'
                        }`}
                      >
                        <div className="text-[#c83b3b] shrink-0">
                          {isSelected ? (
                            <CheckSquare size={16} />
                          ) : (
                            <Square size={16} className="text-stone-400 dark:text-slate-600" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-serif-title font-bold text-xs sm:text-[13px] text-stone-900 dark:text-slate-100 truncate">
                                {g.name}
                              </span>
                              <span className="text-[10px] font-medium text-stone-400 shrink-0 whitespace-nowrap">
                                · {g.rounds?.length || 0} m.
                              </span>
                            </div>

                            {winner && (
                              <div className="flex items-center gap-1 shrink-0 bg-stone-100/90 dark:bg-slate-800/90 pl-1 pr-2 py-0.5 rounded-full">
                                <Avatar player={winner} size="2xs" />
                                <span className="text-[10px] font-bold text-stone-700 dark:text-slate-300 max-w-[76px] truncate">
                                  {winner.name}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-baseline justify-between gap-2">
                            <p className="text-[11px] text-stone-600 dark:text-slate-300 leading-snug">
                              {(g.players || []).map((p) => p.name).join(' · ')}
                            </p>
                            <span className="text-[10px] text-stone-400 dark:text-slate-500 shrink-0 whitespace-nowrap">
                              {formatShortDate(g.finishedAt || g.startedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleGenerateShare}
                  disabled={selectedIds.length === 0 || isLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#c83b3b] hover:bg-[#b91c1c] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 shadow-2xs"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Création du lien…</span>
                    </>
                  ) : (
                    <>
                      <QrCode size={14} />
                      <span>
                        Partager {selectedIds.length} partie{selectedIds.length > 1 ? 's' : ''} (QR Code & Lien)
                      </span>
                    </>
                  )}
                </button>
              </div>
            )
          ) : (
            /* ONGLET RECEVOIR UN CODE OU LIEN */
            <form onSubmit={handleFetchByCode} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-1">
                  Code ou lien de partage reçu
                </label>
                <input
                  type="text"
                  value={receiveCode}
                  onChange={(e) => setReceiveCode(e.target.value)}
                  placeholder="Ex : ARD-4F8K ou lien https://..."
                  required
                  className="w-full font-mono px-3 py-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none focus:border-[#c83b3b]"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !receiveCode.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-[#c83b3b] hover:bg-[#b91c1c] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 shadow-2xs"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Recherche du partage…</span>
                  </>
                ) : (
                  <>
                    <span>Vérifier et importer les parties</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>

              <p className="text-[11px] text-stone-500 dark:text-slate-400 leading-relaxed">
                Collez le lien reçu ou entrez le code affiché sur le téléphone de votre ami (ex. ARD-4F8K) pour récupérer ses parties et fusionner les statistiques.
              </p>
            </form>
          )}
        </div>

        {/* Pied */}
        <div className="p-3 sm:p-4 border-t border-stone-200/70 dark:border-slate-800/70 bg-[#faf9f5]/85 dark:bg-[#151719]/85 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-stone-200 dark:border-slate-700 text-xs font-semibold text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
