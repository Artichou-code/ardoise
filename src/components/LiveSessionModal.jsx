import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { QRCodeSVG } from 'qrcode.react'
import {
  X,
  Radio,
  Copy,
  Check,
  LogOut,
  ArrowRight,
  Info,
  Share2,
  CheckCircle2,
  PowerOff,
} from 'lucide-react'
import { useScrollLock } from '../hooks/useScrollLock'
import { useGame } from '../context/GameContext'
import {
  getActiveSession,
  createLiveSession,
  joinLiveSession,
  fetchLiveSession,
  closeLiveSession,
  importSessionGames,
  syncSessionGamesToLocal,
} from '../store/liveSession'
import { formatDate } from '../utils/gameUtils'
import { getGameDisplayName } from '../constants/games'

export function LiveSessionModal({ isOpen, onClose, onSessionChanged, initialJoinCode }) {
  const { games, reloadStorage } = useGame()
  const [activeSession, setActiveSession] = useState(null)
  const [sessionDetails, setSessionDetails] = useState(null)
  const [activeTab, setActiveTab] = useState(initialJoinCode ? 'join' : 'create') // 'create' | 'join'
  const [sessionName, setSessionName] = useState('')
  const [includeTodayGames, setIncludeTodayGames] = useState(true)
  const [joinCode, setJoinCode] = useState(initialJoinCode || '')

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [statusBanner, setStatusBanner] = useState(null)
  const [copied, setCopied] = useState(false)

  useScrollLock(isOpen)

  // Parties jouées aujourd'hui sur cet appareil (pour proposer de les inclure à l'ouverture de la table)
  const todayGames = useMemo(() => {
    const todayStr = new Date().toDateString()
    return (Array.isArray(games) ? games : []).filter((g) => {
      if (!g || !g.id) return false
      const ts = g.finishedAt || g.updatedAt || g.startedAt
      return ts && new Date(ts).toDateString() === todayStr
    })
  }, [games])

  // Initialisation à l'ouverture de la modale
  useEffect(() => {
    if (!isOpen) return
    const current = getActiveSession()
    setActiveSession(current)
    setError(null)
    setStatusBanner(null)
    setCopied(false)

    if (initialJoinCode) {
      setActiveTab('join')
      setJoinCode(initialJoinCode.toUpperCase())
    }

    if (current && current.code) {
      setIsLoading(true)
      fetchLiveSession(current.code)
        .then((data) => {
          setSessionDetails(data)
          syncSessionGamesToLocal(data)
          reloadStorage()
        })
        .catch(() => {})
        .finally(() => setIsLoading(false))
    }
  }, [isOpen, initialJoinCode])

  // Écouter les changements de session (ex: clôture détectée par GameContext)
  useEffect(() => {
    const handleSessionChanged = (e) => {
      const nextSession = e.detail
      setActiveSession(nextSession)
      if (!nextSession) {
        setSessionDetails(null)
      }
      if (onSessionChanged) onSessionChanged(nextSession)
    }
    window.addEventListener('ardoise-live-session-changed', handleSessionChanged)
    return () => window.removeEventListener('ardoise-live-session-changed', handleSessionChanged)
  }, [onSessionChanged])

  // Polling rapide tant que la modale est ouverte et qu'une session est active
  useEffect(() => {
    if (!isOpen || !activeSession?.code) return
    const interval = setInterval(() => {
      fetchLiveSession(activeSession.code)
        .then((data) => {
          setSessionDetails(data)
          const stats = syncSessionGamesToLocal(data)
          reloadStorage()

          if (data.closed || data.state?.closed) {
            const count = stats.syncedCount || data.state?.games?.length || 0
            setStatusBanner({
              type: 'success',
              text:
                count > 0
                  ? `La table a été clôturée par l'hôte. ${count} partie${count > 1 ? 's ont été enregistrées' : ' a été enregistrée'} dans votre carnet\u00A0!`
                  : `La table a été clôturée par l'hôte.`,
            })
            importSessionGames(activeSession.code).then(() => {
              setActiveSession(null)
              setSessionDetails(null)
              reloadStorage()
              if (onSessionChanged) onSessionChanged(null)
            })
          }
        })
        .catch(() => {})
    }, 3500)
    return () => clearInterval(interval)
  }, [isOpen, activeSession, reloadStorage, onSessionChanged])

  const shareUrl = activeSession?.code
    ? `${window.location.origin}/?session=${encodeURIComponent(activeSession.code)}`
    : ''

  const handleCopyLink = () => {
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
          url: shareUrl,
        })
      } catch {}
    } else {
      handleCopyLink()
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setStatusBanner(null)
    try {
      const defaultTitle = `Table du ${new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'short',
      }).format(new Date())}`
      const finalTitle = sessionName.trim() || defaultTitle
      const initialGames = includeTodayGames && todayGames.length > 0 ? todayGames : []

      const code = await createLiveSession(finalTitle, 'Hôte', [], initialGames)
      const current = getActiveSession()
      setActiveSession(current)
      const data = await fetchLiveSession(code)
      setSessionDetails(data)
      if (onSessionChanged) onSessionChanged(current)
    } catch (err) {
      setError(err.message || 'Impossible de créer la table en direct')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoin = async (e) => {
    e.preventDefault()
    if (!joinCode.trim()) return
    setIsLoading(true)
    setError(null)
    setStatusBanner(null)
    try {
      const data = await joinLiveSession(joinCode, '')
      reloadStorage()

      if (data.closed) {
        const count = data.importStats?.syncedCount || data.state?.games?.length || 0
        setStatusBanner({
          type: 'success',
          text:
            count > 0
              ? `Cette table est terminée\u00A0: ${count} partie${count > 1 ? 's ont été importées' : ' a été importée'} dans votre carnet\u00A0!`
              : `Cette table a déjà été clôturée (aucune partie à importer).`,
        })
        setActiveSession(null)
        setSessionDetails(null)
        if (onSessionChanged) onSessionChanged(null)
        return
      }

      const current = getActiveSession()
      setActiveSession(current)
      setSessionDetails(data)
      if (onSessionChanged) onSessionChanged(current)

      const syncedCount = data.importStats?.syncedCount || 0
      if (syncedCount > 0) {
        setStatusBanner({
          type: 'success',
          text: `Table rejointe\u00A0! ${syncedCount} partie${syncedCount > 1 ? 's déjà jouées ont été ajoutées' : ' déjà jouée a été ajoutée'} à votre carnet.`,
        })
      }
    } catch (err) {
      setError(err.message || 'Impossible de rejoindre cette table')
    } finally {
      setIsLoading(false)
    }
  }

  // Action Hôte : Clôturer la table pour tout le monde
  const handleCloseTableByHost = async () => {
    if (!activeSession?.code || isLoading) return
    setIsLoading(true)
    setError(null)
    try {
      const stats = await closeLiveSession(activeSession.code)
      reloadStorage()
      const count = stats.syncedCount || sessionDetails?.state?.games?.length || 0
      setActiveSession(null)
      setSessionDetails(null)
      if (onSessionChanged) onSessionChanged(null)
      setStatusBanner({
        type: 'success',
        text:
          count > 0
            ? `Table clôturée pour tous les participants. Les ${count} partie${count > 1 ? 's sont enregistrées' : ' est enregistrée'} dans les carnets\u00A0!`
            : `Table en direct clôturée.`,
      })
    } catch (err) {
      setError(err.message || 'Erreur lors de la clôture')
    } finally {
      setIsLoading(false)
    }
  }

  // Action Participant : Quitter la table tout en gardant les parties importées
  const handleLeaveAndKeepGames = async () => {
    if (!activeSession?.code || isLoading) return
    setIsLoading(true)
    setError(null)
    try {
      const stats = await importSessionGames(activeSession.code)
      reloadStorage()
      const count = stats.syncedCount || sessionDetails?.state?.games?.length || 0
      setActiveSession(null)
      setSessionDetails(null)
      if (onSessionChanged) onSessionChanged(null)
      setStatusBanner({
        type: 'success',
        text:
          count > 0
            ? `Vous avez quitté la table. ${count} partie${count > 1 ? 's ont été enregistrées' : ' a été enregistrée'} dans votre carnet\u00A0!`
            : `Vous avez quitté la table en direct.`,
      })
    } catch (err) {
      setError(err.message || 'Erreur lors de la déconnexion')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || typeof document === 'undefined') return null

  const sessionGames = sessionDetails?.state?.games || []
  const isHost = Boolean(activeSession?.isHost)

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="live-session-title"
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
              <Radio size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="live-session-title" className="text-base font-bold font-serif-title leading-snug truncate">
                Table en direct
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate">
                Partage automatique des parties jouées
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

        {/* Bannière d'erreur */}
        {error && (
          <div className="mx-4 mt-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-800/50 flex items-center justify-between gap-2">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} className="p-1 shrink-0">
              <X size={12} />
            </button>
          </div>
        )}

        {/* Bannière de confirmation / statut */}
        {statusBanner && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-medium border border-emerald-200 dark:border-emerald-800/50 flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{statusBanner.text}</span>
            </div>
            <button type="button" onClick={() => setStatusBanner(null)} className="p-1 shrink-0">
              <X size={12} />
            </button>
          </div>
        )}

        {/* Corps scrollable */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {activeSession ? (
            /* VUE SESSION ACTIVE */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl school-card border border-stone-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="font-bold text-sm text-stone-900 dark:text-slate-100 truncate">
                      {activeSession.name}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-xs tracking-wider px-2.5 py-0.5 rounded-lg bg-[#c83b3b]/10 text-[#c83b3b] shrink-0 select-all">
                    {activeSession.code}
                  </span>
                </div>

                {/* QR Code d'invitation */}
                <div className="flex flex-col items-center py-1.5 space-y-2">
                  <div className="p-2.5 bg-white rounded-xl shadow-xs border border-stone-200 inline-block">
                    <QRCodeSVG value={shareUrl} size={145} level="M" />
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 text-center max-w-xs leading-snug">
                    Vos amis scannent ce QR code pour recevoir et enregistrer automatiquement toutes les parties jouées sur leur Ardoise.
                  </p>
                </div>

                {/* Boutons de partage du lien */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex-1 py-2 px-3 rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-stone-50 dark:hover:bg-slate-700 font-bold text-xs text-stone-800 dark:text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    <span>{copied ? 'Lien copié\u00A0!' : 'Copier le lien'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="py-2 px-3.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#c83b3b] hover:text-[#c83b3b] font-bold text-xs text-stone-800 dark:text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Share2 size={14} />
                    <span>Inviter</span>
                  </button>
                </div>
              </div>

              {/* Statut d'enregistrement automatique */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5 text-xs">
                <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-stone-700 dark:text-slate-200 text-[11px] leading-relaxed">
                  <strong className="font-bold text-emerald-800 dark:text-emerald-300 block">
                    Synchronisation automatique activée
                  </strong>
                  Chaque partie jouée est enregistrée directement dans votre carnet et vos statistiques.
                </div>
              </div>

              {/* Parties de la session */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                    Parties synchronisées sur la table ({sessionGames.length})
                  </span>
                </div>

                {sessionGames.length > 0 ? (
                  <div className="rounded-xl school-card border border-stone-200 dark:border-slate-800 divide-y divide-stone-100 dark:divide-slate-800/80 overflow-hidden">
                    {sessionGames.map((g, idx) => (
                      <div key={g.id || idx} className="p-2.5 flex items-center justify-between gap-2 text-xs">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-stone-800 dark:text-slate-200 truncate">{getGameDisplayName(g)}</p>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                                g.status === 'finished'
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                  : 'bg-[#c83b3b]/15 text-[#c83b3b]'
                              }`}
                            >
                              {g.status === 'finished' ? 'Terminée' : `Manche ${(g.rounds?.length || 0) + 1}`}
                            </span>
                          </div>
                          <p className="text-[10px] text-stone-400 dark:text-slate-500 truncate mt-0.5">
                            {(g.players || []).map((p) => p.name).join(' · ')} · {formatDate(g.finishedAt || g.updatedAt || g.startedAt)}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg shrink-0">
                          <Check size={11} />
                          <span>Enregistrée</span>
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl border border-dashed border-stone-200 dark:border-slate-800 text-center">
                    <p className="text-[11px] text-stone-400 dark:text-slate-500">
                      Lancez une partie normalement depuis l'accueil&nbsp;: elle apparaîtra et sera enregistrée ici automatiquement.
                    </p>
                  </div>
                )}
              </div>

              {/* Bouton d'action de fin (Clôturer pour l'Hôte / Quitter en gardant les parties pour l'Invité) */}
              <div className="pt-2 border-t border-stone-200/70 dark:border-slate-800/70 space-y-2">
                {isHost ? (
                  <>
                    <button
                      type="button"
                      onClick={handleCloseTableByHost}
                      disabled={isLoading}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#c83b3b] hover:bg-[#b91c1c] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                    >
                      <PowerOff size={14} />
                      <span>Clôturer la table et sauvegarder les parties</span>
                    </button>
                    <p className="text-[10px] text-stone-500 dark:text-slate-400 text-center leading-tight">
                      Ferme la table chez tous les participants. Toutes les parties jouées restent enregistrées dans le carnet de chacun.
                    </p>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleLeaveAndKeepGames}
                      disabled={isLoading}
                      className="w-full py-2.5 px-4 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#c83b3b] hover:text-[#c83b3b] text-stone-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <LogOut size={14} />
                      <span>Quitter la table (conserver les {sessionGames.length} partie{sessionGames.length > 1 ? 's' : ''})</span>
                    </button>
                    <p className="text-[10px] text-stone-500 dark:text-slate-400 text-center leading-tight">
                      Les parties synchronisées restent définitivement enregistrées dans votre carnet et vos statistiques.
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* VUE CRÉATION / REJOINDRE */
            <div className="space-y-4">
              <div className="flex border-b border-stone-200/60 dark:border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className={`flex-1 pb-2 text-xs font-bold border-b-2 transition-colors cursor-pointer focus:outline-none ${
                    activeTab === 'create'
                      ? 'border-[#c83b3b] text-[#c83b3b]'
                      : 'border-transparent text-stone-500 hover:text-stone-700 dark:hover:text-slate-300'
                  }`}
                >
                  Ouvrir une table
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('join')}
                  className={`flex-1 pb-2 text-xs font-bold border-b-2 transition-colors cursor-pointer focus:outline-none ${
                    activeTab === 'join'
                      ? 'border-[#c83b3b] text-[#c83b3b]'
                      : 'border-transparent text-stone-500 hover:text-stone-700 dark:hover:text-slate-300'
                  }`}
                >
                  Rejoindre avec un code
                </button>
              </div>

              {activeTab === 'create' ? (
                <form onSubmit={handleCreate} className="space-y-3.5">
                  {/* Nom de la soirée (optionnel) */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-1">
                      Nom de la table <span className="font-normal lowercase opacity-75">(optionnel)</span>
                    </label>
                    <input
                      type="text"
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      placeholder="Ex : Soirée Belote & Dourak"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none focus:border-[#c83b3b]"
                    />
                  </div>

                  {/* Option pour inclure les parties déjà jouées aujourd'hui */}
                  {todayGames.length > 0 && (
                    <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-stone-200/80 dark:border-slate-800 bg-stone-50/70 dark:bg-slate-900/40 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={includeTodayGames}
                        onChange={(e) => setIncludeTodayGames(e.target.checked)}
                        className="rounded border-stone-300 text-[#c83b3b] focus:ring-[#c83b3b] accent-[#c83b3b] w-4 h-4"
                      />
                      <span className="text-xs text-stone-700 dark:text-slate-300 font-medium">
                        Inclure les <strong>{todayGames.length} partie{todayGames.length > 1 ? 's' : ''}</strong> déjà jouée{todayGames.length > 1 ? 's' : ''} aujourd'hui
                      </span>
                    </label>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#c83b3b] hover:bg-[#b91c1c] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 shadow-2xs"
                  >
                    <span>{isLoading ? 'Création du QR code…' : 'Générer le QR code de la table'}</span>
                    <ArrowRight size={14} />
                  </button>

                  {/* Micro-explication pédagogique */}
                  <div className="p-3 rounded-xl bg-stone-100/80 dark:bg-slate-800/60 border border-stone-200/70 dark:border-slate-800 text-[11px] text-stone-600 dark:text-slate-400 space-y-1">
                    <p className="font-semibold text-stone-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Info size={13} className="text-[#c83b3b] shrink-0" />
                      <span>Évitez de saisir les scores en double&nbsp;!</span>
                    </p>
                    <p className="leading-relaxed">
                      Une seule personne note les points. Les autres joueurs scannent le QR code&nbsp;: toutes les parties jouées pendant la séance s'enregistrent automatiquement dans leur propre application Ardoise.
                    </p>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleJoin} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-1">
                      Code de la table
                    </label>
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="Ex : ARD-7B92"
                      required
                      className="w-full font-mono uppercase px-3 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none focus:border-[#c83b3b]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !joinCode.trim()}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#c83b3b] hover:bg-[#b91c1c] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 shadow-2xs"
                  >
                    <span>{isLoading ? 'Connexion à la table…' : 'Rejoindre et synchroniser les parties'}</span>
                    <ArrowRight size={14} />
                  </button>

                  <div className="p-3 rounded-xl bg-stone-100/80 dark:bg-slate-800/60 border border-stone-200/70 dark:border-slate-800 text-[11px] text-stone-600 dark:text-slate-400 space-y-1">
                    <p className="font-semibold text-stone-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Info size={13} className="text-[#c83b3b] shrink-0" />
                      <span>Synchronisation automatique</span>
                    </p>
                    <p className="leading-relaxed">
                      Dès que vous rejoignez la table, toutes les parties jouées (et leurs joueurs) sont automatiquement enregistrées dans votre carnet Ardoise jusqu'à la clôture de la table.
                    </p>
                  </div>
                </form>
              )}
            </div>
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

