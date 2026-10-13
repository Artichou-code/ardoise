import { useState, useEffect, useMemo, useRef } from 'react'
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
  Pencil,
  MapPin,
  Maximize2,
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
  saveActiveSession,
  updateLiveSessionCity,
} from '../store/liveSession'
import { isValidLiveSessionCodeFormat, extractCodeFromInput } from '../store/syncStorage'
import { formatDate } from '../utils/gameUtils'
import { getGameDisplayName } from '../constants/games'

export function LiveSessionModal({ isOpen, onClose, onSessionChanged, initialJoinCode }) {
  const { games, reloadStorage } = useGame()
  const [activeSession, setActiveSession] = useState(null)
  const [sessionDetails, setSessionDetails] = useState(null)
  const [activeTab, setActiveTab] = useState(initialJoinCode ? 'join' : 'create') // 'create' | 'join'
  const [sessionName, setSessionName] = useState('')
  const [includeTodayGames, setIncludeTodayGames] = useState(false)
  const [joinCode, setJoinCode] = useState(initialJoinCode ? initialJoinCode.toUpperCase() : 'TAB-')

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [statusBanner, setStatusBanner] = useState(null)
  const [closedSummary, setClosedSummary] = useState(null)
  const [copied, setCopied] = useState(false)
  const [justJoined, setJustJoined] = useState(false)

  const [isEditingName, setIsEditingName] = useState(false)
  const [editingNameValue, setEditingNameValue] = useState('')

  const [isEditingCity, setIsEditingCity] = useState(false)
  const [editingCityValue, setEditingCityValue] = useState('')
  const [showCityHelp, setShowCityHelp] = useState(false)
  const [showGeneralHelp, setShowGeneralHelp] = useState(false)
  const [isFullscreenQr, setIsFullscreenQr] = useState(false)

  const lastSigRef = useRef('')
  const generalHelpRef = useRef(null)
  const cityHelpRef = useRef(null)

  // Fermer les infobulles d'aide en cliquant n'importe où ailleurs
  useEffect(() => {
    if (!showGeneralHelp && !showCityHelp) return
    const handlePointerDown = (e) => {
      if (generalHelpRef.current && !generalHelpRef.current.contains(e.target)) {
        setShowGeneralHelp(false)
      }
      if (cityHelpRef.current && !cityHelpRef.current.contains(e.target)) {
        setShowCityHelp(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [showGeneralHelp, showCityHelp])

  // Mode QR code plein écran avec luminosité maximale (fond blanc pur, WakeLock anti-veille, Fullscreen API)
  useEffect(() => {
    if (!isFullscreenQr) return
    let wakeLock = null
    const requestLock = async () => {
      try {
        if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen')
        }
      } catch {}
    }
    requestLock()

    try {
      if (typeof document !== 'undefined' && document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {})
      }
    } catch {}

    return () => {
      if (wakeLock) {
        wakeLock.release().catch(() => {})
        wakeLock = null
      }
      try {
        if (typeof document !== 'undefined' && document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {})
        }
      } catch {}
    }
  }, [isFullscreenQr])

  useScrollLock(isOpen)

  // Parties jouées aujourd'hui sur cet appareil (proposées à l'ouverture de la table)
  const todayGames = useMemo(() => {
    const todayStr = new Date().toDateString()
    return (Array.isArray(games) ? games : []).filter((g) => {
      if (!g || !g.id) return false
      const ts = g.finishedAt || g.updatedAt || g.startedAt
      return ts && new Date(ts).toDateString() === todayStr
    })
  }, [games])

  // Initialisation à l'ouverture de la modale (stable, sans boucle de rechargement)
  useEffect(() => {
    if (!isOpen) {
      setClosedSummary(null)
      setJustJoined(false)
      setIsEditingName(false)
      setIsEditingCity(false)
      setShowCityHelp(false)
      setShowGeneralHelp(false)
      setIsFullscreenQr(false)
      setIsLoading(false)
      return
    }

    const current = getActiveSession()
    setActiveSession(current)
    setError(null)
    setStatusBanner(null)
    setCopied(false)
    setIsLoading(false)
    lastSigRef.current = ''

    if (initialJoinCode) {
      setActiveTab('join')
      setJoinCode(initialJoinCode.toUpperCase())
      return
    }

    if (current && current.code) {
      setActiveTab('create')
      fetchLiveSession(current.code)
        .then((data) => {
          if (data) {
            setSessionDetails(data)
            syncSessionGamesToLocal(data)
          }
        })
        .catch(() => {})
    } else {
      setActiveTab('create')
      // Auto-création immédiate pour afficher directement le QR code de base dès l'ouverture
      const defaultTitle = `Table du ${new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'short',
      }).format(new Date())}`
      setIsLoading(true)
      createLiveSession(defaultTitle, 'Hôte', [], [])
        .then((code) => {
          const newSession = getActiveSession()
          setActiveSession(newSession)
          if (onSessionChanged) onSessionChanged(newSession)
          return fetchLiveSession(code)
        })
        .then((data) => {
          if (data) setSessionDetails(data)
        })
        .catch((err) => {
          setError(err.message || 'Impossible de créer la table en direct')
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [isOpen, initialJoinCode])

  // Écouter les changements externes de session
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

  // Polling silencieux intelligent : ne déclenche un re-render QUE si les données ont réellement changé
  useEffect(() => {
    if (!isOpen || !activeSession?.code) return

    const interval = setInterval(() => {
      fetchLiveSession(activeSession.code)
        .then((data) => {
          if (!data) return
          const sig = `${data.closed || false}-${(data.state?.games || []).length}-${(data.state?.participants || []).length}-${data.state?.name || ''}-${(data.state?.games || []).map(g => `${g.id}:${g.status}:${g.updatedAt || ''}`).join('|')}`

          if (sig !== lastSigRef.current) {
            lastSigRef.current = sig
            setSessionDetails(data)
            syncSessionGamesToLocal(data)
            reloadStorage()
          }

          if (data.closed || data.state?.closed) {
            const currentGames = data.state?.games || []
            const gameNames = [...new Set(currentGames.map((g) => getGameDisplayName(g)).filter(Boolean))]
            const count = currentGames.length || 0
            const closedTableName = activeSession.name || 'Table en direct'
            importSessionGames(activeSession.code).then(() => {
              setActiveSession(null)
              setSessionDetails(null)
              reloadStorage()
              if (onSessionChanged) onSessionChanged(null)
              setClosedSummary({
                role: 'guest',
                tableName: closedTableName,
                count,
                gameNames,
                wasClosedByHost: true,
              })
            })
          }
        })
        .catch(() => {})
    }, 2500)

    return () => clearInterval(interval)
  }, [isOpen, activeSession?.code, activeSession?.name, reloadStorage, onSessionChanged])

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

  // Renommer la table en direct
  const handleSaveSessionName = async () => {
    setIsEditingName(false)
    const newName = (editingNameValue || '').trim()
    if (!newName || !activeSession?.code || newName === activeSession.name) return
    const updated = { ...activeSession, name: newName }
    saveActiveSession(updated)
    setActiveSession(updated)
    if (onSessionChanged) onSessionChanged(updated)
    try {
      const nextState = { ...(sessionDetails?.state || {}), name: newName }
      await fetch(`/api/sessions/${encodeURIComponent(activeSession.code)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: nextState }),
      })
    } catch {}
  }

  // Ville affichée pour la table (priorité au choix manuel de l'hôte, sinon détection IP)
  const currentCityDisplay = useMemo(() => {
    if (activeSession?.customCity) return activeSession.customCity
    if (sessionDetails?.state?.customCity) return sessionDetails.state.customCity
    if (sessionDetails?.customCity) return sessionDetails.customCity
    if (activeSession?.city) return activeSession.city
    if (sessionDetails?.state?.city) return sessionDetails.state.city
    if (sessionDetails?.city) return sessionDetails.city
    if (sessionDetails?.detectedCity) return sessionDetails.detectedCity
    if (activeSession?.detectedCity) return activeSession.detectedCity
    return ''
  }, [activeSession, sessionDetails])

  const isAutoCity = useMemo(() => {
    const hasCustom = Boolean(activeSession?.customCity || sessionDetails?.state?.customCity || sessionDetails?.customCity)
    return !hasCustom && Boolean(currentCityDisplay)
  }, [activeSession, sessionDetails, currentCityDisplay])

  // Corriger ou modifier manuellement la ville de la table
  const handleSaveCity = async () => {
    if (!activeSession?.code) return
    const newCity = (editingCityValue || '').trim()
    setIsEditingCity(false)
    try {
      await updateLiveSessionCity(activeSession.code, newCity)
      const current = getActiveSession()
      setActiveSession(current)
      if (sessionDetails) {
        setSessionDetails((prev) => ({
          ...prev,
          city: newCity || prev?.detectedCity || null,
          customCity: newCity || null,
          state: {
            ...prev?.state,
            city: newCity || prev?.state?.detectedCity || null,
            customCity: newCity || null,
          },
        }))
      }
      setStatusBanner({
        type: 'success',
        text: newCity
          ? `Ville de la table mise à jour : ${newCity}`
          : 'Ville réinitialisée sur la détection automatique.',
      })
    } catch (err) {
      setError(err.message || 'Impossible de mettre à jour la ville')
    }
  }

  // Synchroniser la case à cocher avec la présence effective des parties du jour sur la table
  useEffect(() => {
    if (sessionDetails?.state?.games && todayGames.length > 0) {
      const liveIds = new Set((sessionDetails.state.games || []).map((g) => g.id))
      const allIncluded = todayGames.every((g) => liveIds.has(g.id))
      setIncludeTodayGames(allIncluded)
    } else {
      setIncludeTodayGames(false)
    }
  }, [sessionDetails, todayGames])

  // Coche / décocher pour inclure ou retirer les parties jouées aujourd'hui
  const handleToggleIncludeTodayGames = async (e) => {
    const nextVal = e.target.checked
    setIncludeTodayGames(nextVal)
    if (!activeSession?.code) return

    try {
      const currentDetails = sessionDetails || (await fetchLiveSession(activeSession.code))
      const currentGames = Array.isArray(currentDetails.state?.games) ? [...currentDetails.state.games] : []

      let nextGames = []
      if (nextVal) {
        const currentIds = new Set(currentGames.map((g) => g.id))
        const toAdd = todayGames.filter((g) => !currentIds.has(g.id))
        nextGames = [...toAdd, ...currentGames]
      } else {
        const todayIds = new Set(todayGames.map((g) => g.id))
        nextGames = currentGames.filter((g) => !todayIds.has(g.id))
      }

      const nextState = { ...(currentDetails.state || {}), games: nextGames }
      await fetch(`/api/sessions/${encodeURIComponent(activeSession.code)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: nextState }),
      })

      setSessionDetails((prev) => ({
        ...prev,
        state: nextState,
      }))
      setStatusBanner({
        type: 'success',
        text: nextVal
          ? `${todayGames.length} partie${todayGames.length > 1 ? 's' : ''} ajoutée${todayGames.length > 1 ? 's' : ''} à la table en direct.`
          : 'Parties du jour retirées de la table en direct.',
      })
    } catch (err) {
      setError(err.message || 'Impossible de mettre à jour les parties de la table')
    }
  }

  // Clic sur l'onglet "Ouvrir une table" : auto-création si aucune table active
  const handleSelectCreateTab = () => {
    setActiveTab('create')
    const current = getActiveSession()
    if (!current && !isLoading) {
      const defaultTitle = `Table du ${new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'short',
      }).format(new Date())}`
      setIsLoading(true)
      createLiveSession(defaultTitle, 'Hôte', [], [])
        .then((code) => {
          const newSession = getActiveSession()
          setActiveSession(newSession)
          if (onSessionChanged) onSessionChanged(newSession)
          return fetchLiveSession(code)
        })
        .then((data) => {
          if (data) setSessionDetails(data)
        })
        .catch((err) => {
          setError(err.message || 'Impossible de créer la table en direct')
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }

  // Création explicite d'une nouvelle table par l'hôte
  const handleCreate = async (e) => {
    if (e) e.preventDefault()
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
      setActiveTab('create')
      if (onSessionChanged) onSessionChanged(current)
    } catch (err) {
      setError(err.message || 'Impossible de créer la table en direct')
    } finally {
      setIsLoading(false)
    }
  }

  // Rejoindre une table avec un code
  const handleJoin = async (e) => {
    e.preventDefault()
    const raw = (joinCode || '').trim().toUpperCase()
    if (!raw) return

    // Détection croisée protectrice si code de Sauvegarde carnet
    if (raw.startsWith('SYNC-') || /^SYNC[A-Z0-9]/i.test(raw)) {
      setError('Ce code commence par SYNC- : c’est un code de Carnet de Sauvegarde, pas de Table en direct. Pour restaurer vos données, ouvrez le Menu ☰ > Sauvegarde & Sync.')
      return
    }

    const cleanCode = extractCodeFromInput(raw, 'TAB')
    if (!isValidLiveSessionCodeFormat(cleanCode)) {
      setError('Format invalide. Le code doit être composé de TAB- suivi de 4 caractères (ex : TAB-7B92) ou ARD-XXXX.')
      return
    }

    setIsLoading(true)
    setError(null)
    setStatusBanner(null)
    try {
      const data = await joinLiveSession(cleanCode, '')
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
      setJustJoined(true)
      setActiveTab('create')
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
      const currentGames = sessionDetails?.state?.games || []
      const gameNames = [...new Set(currentGames.map((g) => getGameDisplayName(g)).filter(Boolean))]
      const closedTableName = activeSession.name || 'Table en direct'
      const stats = await closeLiveSession(activeSession.code)
      reloadStorage()
      const count = stats.syncedCount || currentGames.length || 0
      setActiveSession(null)
      setSessionDetails(null)
      if (onSessionChanged) onSessionChanged(null)
      setClosedSummary({
        role: 'host',
        tableName: closedTableName,
        count,
        gameNames,
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
      const currentGames = sessionDetails?.state?.games || []
      const gameNames = [...new Set(currentGames.map((g) => getGameDisplayName(g)).filter(Boolean))]
      const closedTableName = activeSession.name || 'Table en direct'
      const stats = await importSessionGames(activeSession.code)
      reloadStorage()
      const count = stats.syncedCount || currentGames.length || 0
      setActiveSession(null)
      setSessionDetails(null)
      if (onSessionChanged) onSessionChanged(null)
      setClosedSummary({
        role: 'guest',
        tableName: closedTableName,
        count,
        gameNames,
      })
    } catch (err) {
      setError(err.message || 'Erreur lors de la déconnexion')
    } finally {
      setIsLoading(false)
    }
  }

  // Action Hôte : Annuler la table en direct (ferme la session et quitte la modale)
  const handleCancelLiveSession = async () => {
    if (!activeSession?.code || isLoading) return
    setIsLoading(true)
    setError(null)
    try {
      await closeLiveSession(activeSession.code)
      reloadStorage()
      setActiveSession(null)
      setSessionDetails(null)
      if (onSessionChanged) onSessionChanged(null)
      onClose()
    } catch (err) {
      console.error('Erreur annulation table:', err)
      setActiveSession(null)
      if (onSessionChanged) onSessionChanged(null)
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || typeof document === 'undefined') return null

  const sessionGames = sessionDetails?.state?.games || []
  const isHost = Boolean(activeSession?.isHost ?? true)

  return createPortal(
    <>
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
            <span className="p-1.5 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Radio size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h2 id="live-session-title" className="text-base font-bold font-serif-title leading-snug truncate">
                  {closedSummary ? 'Table terminée' : 'Table en direct'}
                </h2>
                {!closedSummary && (
                  <div ref={generalHelpRef} className="relative inline-flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowGeneralHelp((prev) => !prev)}
                      className="w-4 h-4 rounded-full border border-stone-300 dark:border-slate-700 text-stone-400 hover:text-[#c83b3b] hover:border-[#c83b3b] dark:hover:text-[#c83b3b] flex items-center justify-center text-[10px] font-bold cursor-pointer transition-colors shrink-0"
                      title="Comment fonctionne la table en direct ?"
                      aria-label="Comment fonctionne la table en direct ?"
                    >
                      ?
                    </button>
                    {showGeneralHelp && (
                      <div className="absolute top-6 left-1/2 -translate-x-1/2 sm:-translate-x-1/4 w-64 sm:w-72 max-w-[calc(100vw-2.5rem)] p-3 rounded-xl bg-stone-900/95 dark:bg-slate-800 text-stone-100 text-[11px] leading-relaxed shadow-xl border border-stone-700 z-50 animate-in fade-in zoom-in-95">
                        <div className="flex items-start justify-between gap-1 mb-1.5">
                          <span className="font-bold text-amber-300 flex items-center gap-1.5 truncate">
                            <Info size={12} className="shrink-0" />
                            Partage automatique
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowGeneralHelp(false)}
                            className="text-stone-400 hover:text-white p-0.5 cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        </div>
                        <p>
                          Une seule personne note les points. Les autres joueurs scannent le QR code : toutes les parties de la séance s'enregistrent automatiquement dans leur carnet.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate">
                {closedSummary ? 'Récapitulatif de clôture' : 'Partage en direct des parties'}
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

        {/* Onglets Ouvrir / Rejoindre (visibles sauf en récapitulatif ou vue d'accueil invité immédiate) */}
        {!closedSummary && (!justJoined || isHost) && (
          <div className="px-4 sm:px-5 pt-3 pb-0 flex border-b border-stone-200/60 dark:border-slate-800/60 bg-[#faf9f5]/50 dark:bg-[#151719]/50">
            <button
              type="button"
              onClick={handleSelectCreateTab}
              className={`flex-1 pb-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer focus:outline-none ${
                activeTab === 'create'
                  ? 'border-[#c83b3b] text-[#c83b3b]'
                  : 'border-transparent text-stone-500 hover:text-stone-700 dark:hover:text-slate-300'
              }`}
            >
              {activeSession ? (isHost ? 'Ma table en direct' : 'Table active') : 'Ouvrir une table'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('join')}
              className={`flex-1 pb-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer focus:outline-none ${
                activeTab === 'join'
                  ? 'border-[#c83b3b] text-[#c83b3b]'
                  : 'border-transparent text-stone-500 hover:text-stone-700 dark:hover:text-slate-300'
              }`}
            >
              Rejoindre avec un code
            </button>
          </div>
        )}

        {/* Bannière d'erreur */}
        {error && !closedSummary && (
          <div className="mx-4 mt-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-800/50 flex items-center justify-between gap-2">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} className="p-1 shrink-0">
              <X size={12} />
            </button>
          </div>
        )}

        {/* Bannière de confirmation / statut */}
        {statusBanner && !closedSummary && (
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
          {closedSummary ? (
            /* VUE DE CONFIRMATION / RÉSUMÉ APRÈS CLÔTURE OU SORTIE */
            <div className="py-6 px-2 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 size={26} />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-serif-title font-bold text-lg text-stone-900 dark:text-slate-100">
                  {closedSummary.role === 'host' ? 'Table clôturée' : 'Table quittée'}
                </h3>
                <p className="text-xs text-stone-600 dark:text-slate-300 max-w-xs mx-auto leading-relaxed">
                  {closedSummary.role === 'host' ? (
                    closedSummary.count > 0 ? (
                      <>
                        Table fermée pour tous les participants. <span className="font-semibold text-stone-900 dark:text-slate-100">{closedSummary.count === 1 ? '1 partie a été enregistrée' : `${closedSummary.count} parties ont été enregistrées`}</span> dans le carnet de chaque joueur.
                      </>
                    ) : (
                      <>Table fermée pour tous les participants. Aucune partie n'a été jouée.</>
                    )
                  ) : (
                    closedSummary.count > 0 ? (
                      <>
                        {closedSummary.wasClosedByHost ? "L'hôte a clôturé la table." : 'Vous avez quitté la table.'}{' '}
                        <span className="font-semibold text-stone-900 dark:text-slate-100">
                          {closedSummary.count === 1 ? '1 partie reste enregistrée' : `${closedSummary.count} parties restent enregistrées`}
                        </span>{' '}
                        dans votre carnet.
                      </>
                    ) : (
                      <>{closedSummary.wasClosedByHost ? "L'hôte a clôturé la table en direct." : 'Vous avez quitté la table en direct.'}</>
                    )
                  )}
                </p>
              </div>

              {closedSummary.gameNames && closedSummary.gameNames.length > 0 && (
                <div className="p-3 rounded-xl bg-stone-100/70 dark:bg-slate-800/60 border border-stone-200/60 dark:border-slate-700/60 text-left max-w-xs mx-auto space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500">
                    {closedSummary.count === 1 ? 'Partie enregistrée' : 'Parties enregistrées'}
                  </span>
                  <div className="text-xs font-semibold text-stone-800 dark:text-slate-200 flex flex-wrap gap-1.5">
                    {closedSummary.gameNames.map((name, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex flex-col gap-2 max-w-xs mx-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#c83b3b] hover:bg-[#b03030] text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setClosedSummary(null)
                    setActiveTab('create')
                  }}
                  className="text-[11px] text-stone-400 hover:text-stone-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors py-1 cursor-pointer"
                >
                  Ouvrir ou rejoindre une autre table
                </button>
              </div>
            </div>
          ) : activeTab === 'join' ? (
            /* VUE REJOINDRE AVEC UN CODE */
            <form onSubmit={handleJoin} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-1">
                  Code de la table
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onFocus={(e) => {
                    if (e.target.value === 'TAB-') {
                      e.target.setSelectionRange(4, 4)
                    }
                  }}
                  onChange={(e) => {
                    let val = e.target.value.toUpperCase().replace(/\s+/g, '')
                    if (!val || val === 'TAB' || val === 'TA' || val === 'T') {
                      setJoinCode('TAB-')
                      return
                    }
                    if (val.includes('HTTP') || val.includes('SESSION=') || val.includes('TABLE=')) {
                      const extracted = extractCodeFromInput(val, 'TAB')
                      if (extracted) {
                        setJoinCode(extracted)
                        return
                      }
                    }
                    if (/^[A-Z0-9]{1,4}$/.test(val) && !val.startsWith('TAB-') && !val.startsWith('ARD-')) {
                      val = 'TAB-' + val
                    } else if (/^TAB[A-Z0-9]/.test(val) && !val.startsWith('TAB-')) {
                      val = 'TAB-' + val.slice(3)
                    } else if (/^ARD[A-Z0-9]/.test(val) && !val.startsWith('ARD-')) {
                      val = 'ARD-' + val.slice(3)
                    }
                    setJoinCode(val)
                  }}
                  placeholder="TAB-XXXX"
                  required
                  className="w-full font-mono uppercase px-3 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-none focus:border-[#c83b3b]"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !joinCode.trim() || joinCode.trim() === 'TAB-' || joinCode.trim().length < 5}
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
          ) : activeSession ? (
            justJoined && !isHost ? (
              /* VUE ÉPURÉE D'ACCUEIL POUR LE PARTICIPANT QUI VIENT DE REJOINDRE */
              <div className="py-3 px-1 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-13 h-13 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs border border-emerald-200 dark:border-emerald-800/60">
                  <CheckCircle2 size={30} />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Table rejointe avec succès
                  </span>
                  <h3 className="font-serif-title font-bold text-lg text-stone-900 dark:text-slate-100">
                    {activeSession.name}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Vous êtes connecté à la table. Toutes les parties de la session s'enregistrent automatiquement dans votre carnet.
                  </p>
                </div>

                {/* Badge code de session */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700/80 text-xs font-mono font-bold text-stone-700 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Table {activeSession.code}</span>
                </div>

                {/* Parties de la session déjà synchronisées */}
                {sessionGames.length > 0 ? (
                  <div className="p-3 rounded-xl school-card border border-stone-200 dark:border-slate-800 text-left max-w-xs mx-auto space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500">
                      Parties synchronisées ({sessionGames.length})
                    </span>
                    <div className="text-xs font-semibold text-stone-800 dark:text-slate-200 flex flex-wrap gap-1.5">
                      {sessionGames.map((g, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700">
                          {getGameDisplayName(g)}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl border border-dashed border-stone-200 dark:border-slate-800 text-center max-w-xs mx-auto">
                    <p className="text-[11px] text-stone-400 dark:text-slate-500">
                      En attente des parties lancées par la table…
                    </p>
                  </div>
                )}

                {/* Bouton pour aller jouer directement */}
                <div className="pt-2 max-w-xs mx-auto w-full space-y-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-3 px-4 rounded-xl bg-[#c83b3b] hover:bg-[#b03030] text-white font-bold text-sm transition-all shadow-md active:scale-[0.98] cursor-pointer"
                  >
                    C'est parti !
                  </button>
                  <p className="text-[10px] text-stone-400 dark:text-slate-500">
                    Vous pourrez retrouver cette table et ses options à tout moment via le menu ☰
                  </p>
                </div>
              </div>
            ) : !isHost ? (
              /* VUE PARTICIPANT QUI RÉOUVRE LA TABLE : SANS QR CODE, SANS BOUTONS SUPERFLUS */
              <div className="space-y-4">
                <div className="p-4 rounded-2xl school-card border border-stone-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span className="font-bold text-sm text-stone-900 dark:text-slate-100 truncate">
                        {activeSession.name}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-xs tracking-wider px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shrink-0">
                      {activeSession.code}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5 text-xs">
                    <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-stone-700 dark:text-slate-200 text-[11px] leading-relaxed">
                      <strong className="font-bold text-emerald-800 dark:text-emerald-300 block">
                        Connecté à la table de l'hôte
                      </strong>
                      Toutes les parties jouées pendant cette séance s'enregistrent automatiquement dans votre carnet personnel.
                    </div>
                  </div>
                </div>

                {/* Parties de la session */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 block px-1">
                    Parties synchronisées sur la table ({sessionGames.length})
                  </span>

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
                        En attente des parties enregistrées par l'hôte…
                      </p>
                    </div>
                  )}
                </div>

                {/* Quitter la table en conservant les parties */}
                <div className="pt-2 border-t border-stone-200/70 dark:border-slate-800/70 space-y-2">
                  <button
                    type="button"
                    onClick={handleLeaveAndKeepGames}
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                  >
                    <LogOut size={14} />
                    <span>Sauvegarder et quitter la table</span>
                  </button>
                  <p className="text-[10px] text-stone-500 dark:text-slate-400 text-center leading-tight">
                    Les parties synchronisées restent définitivement enregistrées dans votre carnet et vos statistiques.
                  </p>
                </div>
              </div>
            ) : (
              /* VUE HÔTE COMPLÈTE : QR CODE CENTRAL + BOUTONS INVITER & ANNULER */
              <div className="space-y-4">
                <div className="p-4 rounded-2xl school-card border border-stone-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      {isEditingName ? (
                        <input
                          type="text"
                          value={editingNameValue}
                          onChange={(e) => setEditingNameValue(e.target.value)}
                          onBlur={handleSaveSessionName}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveSessionName()}
                          autoFocus
                          className="text-xs font-bold px-2 py-0.5 rounded border border-[#c83b3b] bg-white dark:bg-slate-900 focus:outline-none flex-1 min-w-0"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNameValue(activeSession.name)
                            setIsEditingName(true)
                          }}
                          className="font-bold text-sm text-stone-900 dark:text-slate-100 truncate text-left hover:underline flex items-center gap-1.5 cursor-pointer min-w-0"
                          title="Cliquer pour renommer la table"
                        >
                          <span className="truncate">{activeSession.name}</span>
                          <Pencil size={11} className="text-stone-400 opacity-60 hover:opacity-100 shrink-0" />
                        </button>
                      )}
                    </div>
                    <span className="font-mono font-bold text-xs tracking-wider px-2.5 py-0.5 rounded-lg bg-[#c83b3b]/10 text-[#c83b3b] shrink-0 select-all">
                      {activeSession.code}
                    </span>
                  </div>

                  {/* Layout compact 2 colonnes : QR Code à gauche + Actions et Ville à droite */}
                  <div className="flex items-stretch gap-3">
                    {/* Colonne gauche : QR Code compact (cliquable pour plein écran) */}
                    <button
                      type="button"
                      onClick={() => setIsFullscreenQr(true)}
                      className="relative group shrink-0 p-1.5 bg-white rounded-xl shadow-2xs border border-stone-200/90 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:border-[#c83b3b] hover:shadow-md transition-all active:scale-[0.98]"
                      title="Agrandir en plein écran (luminosité max)"
                      aria-label="Afficher le QR code en plein écran"
                    >
                      <QRCodeSVG value={shareUrl} size={104} level="M" />
                      <span className="absolute bottom-1 right-1 p-0.5 rounded-md bg-stone-900/60 text-white flex items-center justify-center pointer-events-none group-hover:bg-[#c83b3b] transition-colors shadow-xs" title="Plein écran">
                        <Maximize2 size={10} />
                      </span>
                    </button>

                    {/* Colonne droite : Boutons copier / inviter sur deux lignes + ligne Ville */}
                    <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                      <div className="flex flex-col gap-1.5">
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="w-full py-1.5 px-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-stone-50 dark:hover:bg-slate-700 font-bold text-xs text-stone-800 dark:text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                          title="Copier le lien"
                        >
                          {copied ? <Check size={13} className="text-emerald-500 shrink-0" /> : <Copy size={13} className="shrink-0" />}
                          <span className="truncate">{copied ? 'Lien copié\u00A0!' : 'Copier le lien'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleNativeShare}
                          className="w-full py-1.5 px-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#c83b3b] hover:text-[#c83b3b] font-bold text-xs text-stone-800 dark:text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                          title="Inviter via application"
                        >
                          <Share2 size={13} className="shrink-0" />
                          <span className="truncate">Inviter</span>
                        </button>
                      </div>

                      {/* Ligne Ville compacte */}
                      <div className="pt-1.5 border-t border-stone-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-stone-600 dark:text-slate-400">
                        <div className="flex items-center gap-1 min-w-0 flex-1">
                          <MapPin size={11} className="text-[#c83b3b] shrink-0" />
                          {isEditingCity ? (
                            <div className="flex items-center gap-1 flex-1 min-w-0">
                              <input
                                type="text"
                                value={editingCityValue}
                                onChange={(e) => setEditingCityValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveCity()
                                  if (e.key === 'Escape') setIsEditingCity(false)
                                }}
                                autoFocus
                                placeholder="Ex : Toulouse"
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#c83b3b] bg-white dark:bg-slate-900 text-stone-800 dark:text-slate-200 focus:outline-none flex-1 min-w-0"
                              />
                              <button
                                type="button"
                                onClick={handleSaveCity}
                                className="px-1.5 py-0.5 rounded bg-[#c83b3b] text-white text-[9px] font-bold shrink-0 cursor-pointer hover:bg-[#b03030]"
                              >
                                OK
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsEditingCity(false)}
                                className="p-0.5 text-stone-400 hover:text-stone-600 dark:hover:text-slate-200 shrink-0 cursor-pointer"
                                title="Annuler"
                              >
                                <X size={11} />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCityValue(currentCityDisplay || '')
                                setIsEditingCity(true)
                              }}
                              className="font-medium text-stone-800 dark:text-slate-200 hover:text-[#c83b3b] dark:hover:text-[#c83b3b] flex items-center gap-1 truncate cursor-pointer group text-left min-w-0"
                              title="Cliquer pour corriger la ville"
                            >
                              <span className="truncate">{currentCityDisplay || 'Détection…'}</span>
                              {isAutoCity && (
                                <span className="text-[9px] font-normal text-stone-400 dark:text-slate-500 shrink-0">(auto)</span>
                              )}
                              <Pencil size={9} className="text-stone-400 group-hover:text-[#c83b3b] shrink-0 opacity-70" />
                            </button>
                          )}
                        </div>

                        {/* Infobulle explicative (?) */}
                        <div ref={cityHelpRef} className="relative shrink-0 ml-1.5">
                          <button
                            type="button"
                            onClick={() => setShowCityHelp((prev) => !prev)}
                            className="w-3.5 h-3.5 rounded-full border border-stone-300 dark:border-slate-700 text-stone-400 hover:text-stone-600 dark:hover:text-slate-300 hover:border-stone-400 flex items-center justify-center text-[9px] font-bold cursor-pointer transition-colors"
                            title="Informations sur la géolocalisation"
                            aria-label="Informations sur la géolocalisation"
                          >
                            ?
                          </button>
                          {showCityHelp && (
                            <div className="absolute bottom-5 right-0 w-60 max-w-[calc(100vw-3rem)] p-2.5 rounded-xl bg-stone-900/95 dark:bg-slate-800 text-stone-100 text-[10px] leading-relaxed shadow-xl border border-stone-700 z-50 animate-in fade-in zoom-in-95">
                              <div className="flex items-start justify-between gap-1 mb-1">
                                <span className="font-bold text-amber-300 flex items-center gap-1 text-[10px]">
                                  <MapPin size={10} />
                                  Statistiques générales
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setShowCityHelp(false)}
                                  className="text-stone-400 hover:text-white p-0.5 cursor-pointer"
                                >
                                  <X size={10} />
                                </button>
                              </div>
                              <p>
                                Ville purement indicative pour le classement général. Aucune position GPS collectée. 100% facultatif.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Option pour inclure ou non les parties déjà jouées aujourd'hui (compacte, décoché de base) */}
                {todayGames.length > 0 && (
                  <label className="flex items-center gap-2 p-2 rounded-xl border border-stone-200/80 dark:border-slate-800 bg-stone-50/70 dark:bg-slate-900/40 hover:bg-stone-100/70 dark:hover:bg-slate-800/60 cursor-pointer select-none transition-colors">
                    <input
                      type="checkbox"
                      checked={includeTodayGames}
                      onChange={handleToggleIncludeTodayGames}
                      className="rounded border-stone-300 text-[#c83b3b] focus:ring-[#c83b3b] accent-[#c83b3b] w-3.5 h-3.5 cursor-pointer shrink-0"
                    />
                    <span className="text-[11px] text-stone-700 dark:text-slate-300 font-medium truncate">
                      Inclure les <strong>{todayGames.length} partie{todayGames.length > 1 ? 's' : ''}</strong> jouée{todayGames.length > 1 ? 's' : ''} aujourd'hui
                    </span>
                  </label>
                )}

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

                {/* Clôturer et sauvegarder les parties */}
                <div className="pt-2 border-t border-stone-200/70 dark:border-slate-800/70 space-y-2">
                  <button
                    type="button"
                    onClick={handleCloseTableByHost}
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                  >
                    <PowerOff size={14} />
                    <span>Sauvegarder et quitter la table</span>
                  </button>
                  <p className="text-[10px] text-stone-500 dark:text-slate-400 text-center leading-tight">
                    Ferme la table chez tous les participants. Toutes les parties jouées restent enregistrées dans le carnet de chacun.
                  </p>
                </div>
              </div>
            )
          ) : (
            /* CHARGEMENT / INITIALISATION AUTOMATIQUE DE LA TABLE */
            <div className="py-12 px-4 text-center space-y-3 animate-in fade-in duration-200">
              <div className="w-12 h-12 rounded-2xl bg-[#c83b3b]/10 text-[#c83b3b] flex items-center justify-center mx-auto">
                <Radio size={24} className="animate-pulse text-[#c83b3b]" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-stone-700 dark:text-slate-300">
                  Ouverture de la table en direct…
                </p>
                <p className="text-[11px] text-stone-400 dark:text-slate-500">
                  Génération du QR code et du code de table en cours…
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Pied de la modale */}
        {!closedSummary && (!justJoined || isHost) && (
          <div className="p-3 sm:p-4 border-t border-stone-200/70 dark:border-slate-800/70 bg-[#faf9f5]/85 dark:bg-[#151719]/85 flex items-center justify-between">
            {activeSession && isHost && activeTab === 'create' ? (
              <button
                type="button"
                onClick={handleCancelLiveSession}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/40 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
              >
                Annuler la table
              </button>
            ) : (
              <div />
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-200 dark:border-slate-700 text-xs font-semibold text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>

    {/* Modale Plein Écran pour le QR Code (Luminosité maximale, fond blanc pur & WakeLock) */}
    {isFullscreenQr && (
      <div
        className="fixed inset-0 z-[2000] bg-white text-stone-900 flex flex-col justify-between p-6 sm:p-10 select-none animate-in fade-in duration-200"
        onClick={() => setIsFullscreenQr(false)}
        role="dialog"
        aria-modal="true"
        aria-label="QR Code plein écran"
      >
        {/* En-tête : Table et bouton fermer */}
        <div className="w-full max-w-sm mx-auto flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
              Table en direct
            </span>
            <h3 className="font-serif-title font-bold text-base text-stone-900 truncate">
              {activeSession?.name || 'Table Ardoise'}
            </h3>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIsFullscreenQr(false)
            }}
            className="p-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer shrink-0"
            title="Fermer le plein écran"
            aria-label="Fermer le plein écran"
          >
            <X size={22} />
          </button>
        </div>

        {/* QR Code géant éclatant pour scan instantané */}
        <div className="flex flex-col items-center justify-center my-auto space-y-6">
          <div className="p-4 bg-white rounded-3xl shadow-2xl border-2 border-stone-200 flex items-center justify-center">
            <QRCodeSVG value={shareUrl} size={270} level="H" />
          </div>

          <div className="text-center space-y-2">
            <div className="inline-block px-5 py-2 rounded-2xl bg-stone-100 border border-stone-200 shadow-xs">
              <span className="font-mono font-bold text-2xl tracking-widest text-stone-900">
                {activeSession?.code}
              </span>
            </div>
            <p className="text-xs font-semibold text-stone-500">
              Scannez pour rejoindre la table
            </p>
          </div>
        </div>

        {/* Pied : Consigne tactile */}
        <div className="w-full max-w-sm mx-auto text-center">
          <p className="text-xs text-stone-400 font-medium">
            Toucher n'importe où pour quitter le plein écran
          </p>
        </div>
      </div>
    )}
  </>,
  document.body
)
}
