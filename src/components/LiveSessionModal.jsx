import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { QRCodeSVG } from 'qrcode.react'
import {
  X,
  Radio,
  Copy,
  Check,
  LogOut,
  ArrowRight,
  Crown,
  Info,
} from 'lucide-react'
import { useScrollLock } from '../hooks/useScrollLock'
import {
  getActiveSession,
  createLiveSession,
  joinLiveSession,
  fetchLiveSession,
  clearActiveSession,
} from '../store/liveSession'
import { formatDate } from '../utils/gameUtils'

export function LiveSessionModal({ isOpen, onClose, onSessionChanged, initialJoinCode }) {
  const [activeSession, setActiveSession] = useState(null)
  const [sessionDetails, setSessionDetails] = useState(null)
  const [activeTab, setActiveTab] = useState(initialJoinCode ? 'join' : 'create') // 'create' | 'join'
  const [sessionName, setSessionName] = useState('')
  const [hostName, setHostName] = useState('')
  const [joinCode, setJoinCode] = useState(initialJoinCode || '')
  const [joinPlayerName, setJoinPlayerName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  useScrollLock(isOpen)

  useEffect(() => {
    if (!isOpen) return
    const current = getActiveSession()
    setActiveSession(current)
    setError(null)
    setCopied(false)

    if (initialJoinCode) {
      setActiveTab('join')
      setJoinCode(initialJoinCode.toUpperCase())
    }

    if (current && current.code) {
      setIsLoading(true)
      fetchLiveSession(current.code)
        .then((data) => setSessionDetails(data))
        .catch(() => {})
        .finally(() => setIsLoading(false))
    }
  }, [isOpen, initialJoinCode])

  // Polling si une session est active
  useEffect(() => {
    if (!isOpen || !activeSession?.code) return
    const interval = setInterval(() => {
      fetchLiveSession(activeSession.code)
        .then((data) => setSessionDetails(data))
        .catch(() => {})
    }, 4000)
    return () => clearInterval(interval)
  }, [isOpen, activeSession])

  const shareUrl = activeSession?.code
    ? `${window.location.origin}/?session=${encodeURIComponent(activeSession.code)}`
    : ''

  const handleCopyLink = () => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const code = await createLiveSession(sessionName, hostName)
      const current = getActiveSession()
      setActiveSession(current)
      const data = await fetchLiveSession(code)
      setSessionDetails(data)
      if (onSessionChanged) onSessionChanged(current)
    } catch (err) {
      setError(err.message || 'Impossible de créer la session')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const data = await joinLiveSession(joinCode, joinPlayerName)
      const current = getActiveSession()
      setActiveSession(current)
      setSessionDetails(data)
      if (onSessionChanged) onSessionChanged(current)
    } catch (err) {
      setError(err.message || 'Impossible de rejoindre ce salon')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLeave = () => {
    clearActiveSession()
    setActiveSession(null)
    setSessionDetails(null)
    if (onSessionChanged) onSessionChanged(null)
  }

  if (!isOpen || typeof document === 'undefined') return null

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
        {/* Liseré supérieur */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent z-10" />

        {/* En-tête responsive */}
        <div className="relative z-10 p-3.5 sm:p-4 pb-3 border-b border-stone-200/70 dark:border-slate-800/70 bg-[#faf9f5]/85 dark:bg-[#151719]/85 backdrop-blur-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Radio size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="live-session-title" className="text-base font-bold font-serif-title leading-snug truncate">
                Table en direct
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate">
                Session partagée entre tous les joueurs
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

        {/* Message d'erreur */}
        {error && (
          <div className="mx-4 mt-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs border border-rose-200 flex items-center justify-between">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} className="p-1">
              <X size={12} />
            </button>
          </div>
        )}

        {/* Corps */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {activeSession ? (
            /* Vue Session Active */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl school-card border border-stone-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold text-sm text-stone-900 dark:text-slate-100">
                      {activeSession.name}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-xs tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                    {activeSession.code}
                  </span>
                </div>

                <div className="flex flex-col items-center py-2 space-y-2">
                  <div className="p-2.5 bg-white rounded-xl shadow-xs border border-stone-200 inline-block">
                    <QRCodeSVG value={shareUrl} size={150} level="M" />
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 text-center">
                    Scannez pour rejoindre la table en direct
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex-1 py-2 px-3 rounded-lg border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-stone-50 font-bold text-xs text-stone-800 dark:text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    <span>{copied ? 'Lien copié' : 'Copier le lien'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLeave}
                    className="py-2 px-3 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut size={14} />
                    <span>Quitter</span>
                  </button>
                </div>
              </div>

              {/* Participants */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 block px-1">
                  Joueurs autour de la table ({sessionDetails?.state?.participants?.length || 1})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-slate-800 text-xs font-semibold text-stone-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Crown size={12} className="text-amber-500 shrink-0" />
                    <span>{sessionDetails?.hostName || activeSession.host}</span>
                  </span>
                  {sessionDetails?.state?.participants?.map((p, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-slate-800 text-xs font-semibold text-stone-700 dark:text-slate-300"
                    >
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Parties de la session */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 block px-1">
                  Parties jouées aujourd'hui ({sessionDetails?.state?.games?.length || 0})
                </span>
                {sessionDetails?.state?.games?.length > 0 ? (
                  <div className="rounded-xl school-card border border-stone-200 dark:border-slate-800 divide-y divide-stone-100 dark:divide-slate-800/80 overflow-hidden">
                    {sessionDetails.state.games.map((g, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-stone-800 dark:text-slate-200">{g.name}</p>
                          <p className="text-[10px] text-stone-400">{formatDate(g.endedAt || g.startedAt)}</p>
                        </div>
                        <span className="font-mono text-[11px] text-stone-500">
                          {g.players?.length || 0} joueurs
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-stone-400 dark:text-slate-500 italic px-1">
                    Les parties terminées s'afficheront ici en direct.
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Vue Création / Rejoindre */
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
                  Créer la session
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
                  Rejoindre un salon
                </button>
              </div>

              {activeTab === 'create' ? (
                <form onSubmit={handleCreate} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                      Nom de la journée / soirée
                    </label>
                    <input
                      type="text"
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      placeholder="Ex: Après-midi Belote & Tarot"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none focus:border-[#c83b3b]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                      Votre prénom (Hôte)
                    </label>
                    <input
                      type="text"
                      value={hostName}
                      onChange={(e) => setHostName(e.target.value)}
                      placeholder="Ex&nbsp;: Alex"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none focus:border-[#c83b3b]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !sessionName.trim() || !hostName.trim()}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#c83b3b] hover:bg-[#b91c1c] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 shadow-2xs"
                  >
                    <span>Lancer la table en direct</span>
                    <ArrowRight size={14} />
                  </button>

                  {/* Micro-explication avec exemple concret */}
                  <div className="p-3 rounded-xl bg-stone-100/80 dark:bg-slate-800/60 border border-stone-200/70 dark:border-slate-800 text-[11px] text-stone-600 dark:text-slate-400 space-y-1">
                    <p className="font-semibold text-stone-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Info size={13} className="text-[#c83b3b] shrink-0" />
                      <span>Comment ça marche&nbsp;?</span>
                    </p>
                    <p className="leading-relaxed">
                      Lancez la session sur votre tablette ou PC, puis partagez le QR code à vos amis pour qu'ils suivent les scores en temps réel sur leur téléphone (aucun compte requis).
                    </p>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleJoin} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                      Code du salon
                    </label>
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="Ex&nbsp;: ARD-7B92"
                      required
                      className="w-full font-mono uppercase px-3 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none focus:border-[#c83b3b]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                      Votre prénom
                    </label>
                    <input
                      type="text"
                      value={joinPlayerName}
                      onChange={(e) => setJoinPlayerName(e.target.value)}
                      placeholder="Ex&nbsp;: Julien"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none focus:border-[#c83b3b]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !joinCode.trim() || !joinPlayerName.trim()}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#c83b3b] hover:bg-[#b91c1c] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 shadow-2xs"
                  >
                    <span>Rejoindre la table</span>
                    <ArrowRight size={14} />
                  </button>

                  {/* Micro-explication avec exemple concret */}
                  <div className="p-3 rounded-xl bg-stone-100/80 dark:bg-slate-800/60 border border-stone-200/70 dark:border-slate-800 text-[11px] text-stone-600 dark:text-slate-400 space-y-1">
                    <p className="font-semibold text-stone-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Info size={13} className="text-[#c83b3b] shrink-0" />
                      <span>Comment rejoindre&nbsp;?</span>
                    </p>
                    <p className="leading-relaxed">
                      Scannez le QR code affiché sur l'écran de l'hôte ou tapez le code du salon (ex.&nbsp;: ARD-7B92) pour suivre les points en direct.
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
