import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  QrCode,
  Users,
  Gamepad2,
  Share2,
  TrendingUp,
  RefreshCw,
  Globe,
  MapPin,
  Smartphone,
  Flame,
  Trophy,
  Info,
} from 'lucide-react'
import { useScrollLock } from '../hooks/useScrollLock'
import { useGame } from '../context/GameContext'

/**
 * StatsModal — Dashboard d'administration caché.
 * Accès : 5 taps rapides sur le QR code dans ShareAppModal.
 * Affiche l'audience, la géolocalisation Cloudflare (villes/pays),
 * la popularité des jeux, le taux d'adoption PWA et la viralité.
 */
export function StatsModal({ isOpen, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedCity, setSelectedCity] = useState(null)
  const [activeHelp, setActiveHelp] = useState(null)

  const { players: localPlayers = [] } = useGame() || {}
  const localPlayersCount = (Array.isArray(localPlayers) ? localPlayers : []).filter(p => !p.archived).length

  useScrollLock(isOpen)

  useEffect(() => {
    if (!isOpen) {
      setActiveHelp(null)
      return
    }
    setError(null)
    setSelectedCity(null)
    setActiveHelp(null)
    loadStats()
  }, [isOpen])

  // Fermer l'infobulle d'aide au clic n'importe où ailleurs
  useEffect(() => {
    if (!activeHelp) return
    const handlePointerDown = (e) => {
      if (!e.target.closest('[data-stat-help]')) {
        setActiveHelp(null)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [activeHelp])

  async function loadStats() {
    setLoading(true)
    try {
      const res = await fetch('/api/stats')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || typeof document === 'undefined') return null

  // Métriques globales
  const qrScans = data?.totals?.qr_share_scan || 0
  const sessionJoins = data?.totals?.session_join || 0
  const shareViews = data?.totals?.share_game_view || 0
  const sessionsTotal = data?.sessions?.total || 0
  const sessionsClosed = data?.sessions?.closed || 0
  const totalParticipants = data?.sessions?.totalParticipants || 0
  const maxParticipantsLive = data?.sessions?.maxParticipantsLive || 0
  const uniquePlayersCount = data?.sessions?.uniquePlayersCount || 0
  const sharedGames = data?.sharedGames || 0

  // Géographie
  const countries = data?.geo?.countries || []
  const cities = data?.geo?.cities || []
  const cityEvents = data?.geo?.cityEvents || []

  const selectedCityEvents = selectedCity
    ? cityEvents.filter(e => (e.city || '').toLowerCase() === selectedCity.toLowerCase())
    : []

  // Jeux les plus populaires
  const gamesPopularity = data?.gamesPopularity || []

  // Appareils & PWA
  const devices = data?.devices || []
  const pwaRate = data?.pwa?.rate || 0
  const busiestDay = data?.busiestDay || null

  // Historique 30j
  const history = (data?.history || []).slice(0, 20)
  const sessionsHistory = (data?.sessionsHistory || []).slice(0, 14)

  const formatFrDate = (dateStr) => {
    if (!dateStr) return ''
    const [y, m, d] = dateStr.split('-')
    return y && m && d ? `${d}/${m}/${y}` : dateStr
  }

  const formatEventTime = (isoString) => {
    if (!isoString) return ''
    try {
      const d = new Date(isoString)
      if (isNaN(d.getTime())) return isoString
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return isoString
    }
  }

  const getEventLabel = (ev) => {
    if (ev.type === 'session_join') return 'Rejoint table en direct'
    if (ev.source === 'shared_game' || ev.type === 'share_game_view') return `Partage ${ev.type || 'partie'}`
    if (ev.type === 'qr_share_scan') return 'Scan QR installation'
    return ev.type || 'Activité'
  }

  // Anonymisation légère des joueurs : n'affiche que la 1ère lettre (initiale) de chaque joueur (ex: Arti, Julie -> A., J.)
  const formatAnonymizedPlayers = (raw) => {
    if (!raw || typeof raw !== 'string') return ''
    return raw
      .split(',')
      .map((p) => {
        const clean = p.trim().replace(/\.+$/, '')
        return clean ? `${clean.charAt(0).toUpperCase()}.` : ''
      })
      .filter(Boolean)
      .join(', ')
  }

  const StatCard = ({
    id,
    icon: Icon,
    color,
    label,
    value,
    sub,
    helpTitle,
    helpText,
    popPosition = 'bottom-left',
  }) => {
    const isHelpOpen = activeHelp === id
    const popClasses =
      popPosition === 'bottom-left'
        ? 'top-full left-0 mt-1.5'
        : popPosition === 'bottom-right'
          ? 'top-full right-0 mt-1.5'
          : popPosition === 'top-left'
            ? 'bottom-full left-0 mb-1.5'
            : 'bottom-full right-0 mb-1.5'

    return (
      <div className={`relative p-2.5 sm:p-3 rounded-xl border ${color} flex flex-col justify-between min-h-[78px] ${isHelpOpen ? 'z-30' : 'z-0'}`}>
        <div className="flex items-center justify-between gap-1.5 mb-1">
          <div className="p-1.5 rounded-lg bg-white/70 dark:bg-slate-800/70 shrink-0">
            <Icon size={15} className="text-stone-700 dark:text-slate-200" />
          </div>
          <span className="text-xl sm:text-2xl font-bold font-serif-title text-stone-900 dark:text-slate-100 leading-none">
            {value}
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-600 dark:text-slate-400 leading-tight truncate">
              {label}
            </p>
            {helpText && (
              <div data-stat-help className="relative inline-flex items-center shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveHelp(isHelpOpen ? null : id)
                  }}
                  className={`w-3.5 h-3.5 rounded-full border text-[9px] font-bold flex items-center justify-center cursor-pointer transition-colors ${
                    isHelpOpen
                      ? 'bg-stone-800 border-stone-800 text-white dark:bg-stone-200 dark:border-stone-200 dark:text-stone-900'
                      : 'border-stone-300 dark:border-slate-700 text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 hover:border-stone-400'
                  }`}
                  title={`Explication ${label}`}
                  aria-label={`Explication ${label}`}
                >
                  ?
                </button>
                {isHelpOpen && (
                  <div
                    className={`absolute ${popClasses} z-50 w-52 sm:w-60 p-2.5 rounded-xl bg-stone-900/95 dark:bg-slate-800 text-stone-100 text-[10px] leading-relaxed shadow-xl border border-stone-700 animate-in fade-in zoom-in-95`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="font-bold text-amber-300 flex items-center gap-1 truncate">
                        <Info size={11} className="shrink-0" />
                        {helpTitle || label}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveHelp(null)}
                        className="text-stone-400 hover:text-white p-0.5 cursor-pointer shrink-0"
                      >
                        <X size={11} />
                      </button>
                    </div>
                    <p className="text-stone-200 dark:text-slate-200">
                      {helpText}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          {sub && (
            <p className="text-[10px] text-stone-400 dark:text-slate-500 mt-0.5 truncate leading-tight w-full" title={sub}>
              {sub}
            </p>
          )}
        </div>
      </div>
    )
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[1060] flex items-end sm:items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panneau principal */}
      <div className="relative w-full max-w-sm sm:max-w-md school-surface text-stone-900 dark:text-slate-100 border border-stone-200/90 dark:border-slate-800/90 shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Liseré supérieur rouge signature Ardoise */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#c83b3b] to-transparent z-10" />

        {/* En-tête */}
        <div className="relative z-10 p-3.5 sm:p-4 border-b border-stone-200/70 dark:border-slate-800/70 bg-[#faf9f5]/90 dark:bg-[#151719]/90 backdrop-blur-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-xl bg-[#c83b3b]/10 dark:bg-[#c83b3b]/20 text-[#c83b3b] shrink-0">
              <TrendingUp size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold leading-snug truncate font-serif-title">
                Stats Ardoise
              </h2>
              <p className="text-[10px] text-stone-500 dark:text-slate-400 font-medium">
                Dashboard admin & audience globale
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={loadStats}
              disabled={loading}
              className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 hover:bg-stone-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer focus:outline-none disabled:opacity-40"
              title="Actualiser les statistiques"
              aria-label="Actualiser"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 hover:bg-stone-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer focus:outline-none"
              title="Fermer la fenêtre (Échap)"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Corps défilant */}
        <div className="overflow-y-auto flex-1 p-3.5 sm:p-4 space-y-4 scrollbar-hide">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-400">
              Erreur de connexion à l'API : {error}
            </div>
          )}

          {loading && !data && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <RefreshCw size={26} className="animate-spin text-[#c83b3b] mb-2" />
              <p className="text-xs text-stone-500 dark:text-slate-400">
                Chargement des données Cloudflare D1...
              </p>
            </div>
          )}

          {data && (
            <>
              {/* 1. ACQUISITION & VIRALITÉ (GRILLE 2x2) */}
              <div>
                <div className="flex items-center justify-between mb-2 px-0.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                    Acquisition & Partages
                  </p>
                  {uniquePlayersCount > 0 && (
                    <div data-stat-help className="relative inline-flex items-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveHelp(activeHelp === 'unique_players' ? null : 'unique_players')
                        }}
                        className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
                        title="Détail du nombre total de profils"
                      >
                        <Users size={12} className="shrink-0" />
                        <span>{uniquePlayersCount} profils créés au total</span>
                        <span className="w-3.5 h-3.5 rounded-full border border-emerald-300 dark:border-emerald-700/60 text-[9px] font-bold flex items-center justify-center">
                          ?
                        </span>
                      </button>
                      {activeHelp === 'unique_players' && (
                        <div
                          className="absolute right-0 top-6 z-50 w-64 p-3 rounded-xl bg-stone-900/95 dark:bg-slate-800 text-stone-100 text-[10px] leading-relaxed shadow-xl border border-stone-700 animate-in fade-in zoom-in-95"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-start justify-between gap-1 mb-1.5">
                            <span className="font-bold text-emerald-400 flex items-center gap-1 truncate">
                              <Users size={12} className="shrink-0" />
                              Profils créés au total
                            </span>
                            <button
                              type="button"
                              onClick={() => setActiveHelp(null)}
                              className="text-stone-400 hover:text-white p-0.5 cursor-pointer shrink-0"
                            >
                              <X size={11} />
                            </button>
                          </div>
                          <p className="text-stone-200 dark:text-slate-200 mb-2">
                            Il s'agit du <strong>total global</strong> de profils de joueurs uniques recensés sur toute l'application Ardoise (tous carnets cloud, tables live et partages confondus).
                          </p>
                          <div className="pt-1.5 border-t border-stone-700/70 flex items-center justify-between text-stone-400 text-[10px]">
                            <span>Dans votre carnet personnel :</span>
                            <strong className="text-stone-100 font-bold">{localPlayersCount} joueur{localPlayersCount > 1 ? 's' : ''}</strong>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <StatCard
                    id="qr"
                    icon={QrCode}
                    color="bg-blue-50/80 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/40"
                    label="Scans QR"
                    value={qrScans}
                    sub="Installation / qr"
                    helpTitle="Scans QR"
                    helpText="Nombre de personnes ayant scanné le QR code d'Ardoise (sur un autre appareil ou imprimé) pour ouvrir l'application."
                    popPosition="bottom-left"
                  />
                  <StatCard
                    id="shares"
                    icon={Share2}
                    color="bg-indigo-50/80 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/40"
                    label="Partages"
                    value={sharedGames}
                    sub={`${shareViews} vus par lien`}
                    helpTitle="Partages"
                    helpText="Nombre de partages par lien (SMS, WhatsApp...) et consultations de l'application via ces liens."
                    popPosition="bottom-right"
                  />
                  <StatCard
                    id="tables"
                    icon={Gamepad2}
                    color="bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40"
                    label="Tables Live"
                    value={sessionsTotal}
                    sub={`${sessionsClosed} closes`}
                    helpTitle="Tables Live"
                    helpText="Nombre total de tables multijoueurs créées en direct, et combien ont été clôturées avec succès."
                    popPosition="top-left"
                  />
                  <StatCard
                    id="players"
                    icon={Users}
                    color="bg-amber-50/80 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/40"
                    label="Joueurs Live"
                    value={sessionJoins || totalParticipants}
                    sub={maxParticipantsLive > 0 ? `Record : ${maxParticipantsLive} joueurs` : 'Rejoints'}
                    helpTitle="Joueurs Live"
                    helpText="Nombre de participants ayant rejoint une table en direct pour synchroniser automatiquement les scores."
                    popPosition="top-right"
                  />
                </div>
              </div>

              {/* 2. GÉOLOCALISATION CLOUDFLARE (PAYS & VILLES) */}
              <div className="p-3 rounded-2xl school-card bg-white dark:bg-slate-900/70 border border-stone-200/90 dark:border-slate-800/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Globe size={14} className="text-[#c83b3b]" />
                    <p className="text-[11px] font-bold uppercase tracking-wider text-stone-800 dark:text-slate-200">
                      Géographie
                    </p>
                  </div>
                </div>

                {/* Top Pays */}
                {countries.length > 0 ? (
                  <div className="space-y-1.5">
                    {countries.map((c) => (
                      <div key={c.code || c.name} className="flex flex-col gap-0.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium flex items-center gap-1.5 text-stone-800 dark:text-slate-200">
                            <span className="text-sm leading-none">{c.flag}</span>
                            <span className="truncate">{c.name}</span>
                          </span>
                          <span className="font-mono text-[11px] font-bold text-stone-600 dark:text-slate-300">
                            {c.count} <span className="text-stone-400 font-normal">({c.pct}%)</span>
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-stone-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#c83b3b] rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(5, Math.min(c.pct, 100))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-400 dark:text-slate-500 italic py-1">
                    En attente de premiers scans géolocalisés (FR, BE, CH...).
                  </p>
                )}

                {/* Top Villes — Pastilles interactives pour inspecter les activités */}
                {cities.length > 0 && (
                  <div className="pt-2 border-t border-stone-100 dark:border-slate-800/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 flex items-center gap-1">
                        <MapPin size={11} className="text-stone-400" />
                        Villes actives
                      </p>
                      <span className="text-[10px] text-stone-400 dark:text-slate-500 italic">
                        Cliquez pour inspecter
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {cities.map((ci, idx) => {
                        const isSelected = selectedCity === ci.city
                        return (
                          <button
                            key={`${ci.city}-${idx}`}
                            type="button"
                            onClick={() => setSelectedCity(isSelected ? null : ci.city)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium border transition-all cursor-pointer active:scale-95 ${
                              isSelected
                                ? 'bg-[#c83b3b]/15 border-[#c83b3b] text-[#c83b3b] dark:text-rose-400 font-bold shadow-2xs'
                                : 'bg-stone-100/90 dark:bg-slate-800 text-stone-800 dark:text-slate-200 border-stone-200/60 dark:border-slate-700/60 hover:border-stone-400 dark:hover:border-slate-600'
                            }`}
                            title={`Voir les activités enregistrées à ${ci.city}`}
                          >
                            <span className="text-[9px] opacity-75 shrink-0 leading-none">{ci.flag}</span>
                            <span className="leading-tight">{ci.city}</span>
                            <span className={`text-[9px] font-bold ml-0.5 leading-none ${isSelected ? 'text-[#c83b3b] dark:text-rose-400' : 'text-[#c83b3b]'}`}>
                              ({ci.count})
                            </span>
                          </button>
                        )
                      })}
                    </div>

                    {/* Fiche détaillée de la ville sélectionnée */}
                    {selectedCity && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200/80 dark:border-slate-700/80 space-y-2 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-bold text-stone-900 dark:text-slate-100 flex items-center gap-1.5">
                            <MapPin size={12} className="text-[#c83b3b]" />
                            Activités à {selectedCity} :
                          </p>
                          <button
                            type="button"
                            onClick={() => setSelectedCity(null)}
                            className="p-1 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-slate-200 hover:bg-stone-200/50 dark:hover:bg-slate-700/50 cursor-pointer"
                            aria-label="Fermer"
                          >
                            <X size={12} />
                          </button>
                        </div>

                        {selectedCityEvents.length > 0 ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5 divide-y divide-stone-150 dark:divide-slate-700/50">
                            {selectedCityEvents.map((ev, i) => (
                              <div key={`${ev.createdAt}-${i}`} className="pt-2 first:pt-0 flex items-center justify-between text-[11px] gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 font-bold text-stone-900 dark:text-slate-100 truncate">
                                    <span>{ev.gameName || 'Partie'}</span>
                                  </div>
                                  <div className="text-[10px] text-stone-500 dark:text-slate-400 truncate mt-0.5 flex items-center gap-1">
                                    {ev.players && (
                                      <span className="font-semibold text-stone-700 dark:text-slate-300 shrink-0">
                                        {formatAnonymizedPlayers(ev.players)} ·
                                      </span>
                                    )}
                                    <span>{formatEventTime(ev.createdAt)}</span>
                                    {ev.os && <span>· {ev.os}</span>}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-stone-400 italic">
                            Aucun détail supplémentaire pour cette ville.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3. PALMARÈS DES JEUX LES PLUS JOUÉS & PARTAGÉS */}
              <div className="p-3 rounded-2xl school-card bg-white dark:bg-slate-900/70 border border-stone-200/90 dark:border-slate-800/90 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Trophy size={14} className="text-amber-500" />
                    <p className="text-[11px] font-bold uppercase tracking-wider text-stone-800 dark:text-slate-200">
                      Jeux les plus populaires
                    </p>
                  </div>
                </div>

                {gamesPopularity.length > 0 ? (
                  <div className="space-y-2">
                    {gamesPopularity.map((game, i) => (
                      <div key={game.id || i} className="flex flex-col gap-0.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-stone-800 dark:text-slate-200 flex items-center gap-1.5">
                            <span className="font-serif-title font-bold text-[11px] text-stone-400">
                              #{i + 1}
                            </span>
                            <span>{game.name}</span>
                          </span>
                          <span className="font-mono text-[11px] font-bold text-stone-600 dark:text-slate-300">
                            {game.count} <span className="text-stone-400 font-normal">({game.pct}%)</span>
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-stone-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-[#c83b3b] rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(6, Math.min(game.pct, 100))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-400 dark:text-slate-500 italic py-1">
                    Les types de jeux seront calculés dès les prochains partages de parties.
                  </p>
                )}
              </div>

              {/* 4. SUPPORTS, ADOPTION PWA & JOURS D'AFFLUENCE */}
              <div className="p-3 rounded-2xl school-card bg-white dark:bg-slate-900/70 border border-stone-200/90 dark:border-slate-800/90 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Smartphone size={14} className="text-blue-500" />
                    <p className="text-[11px] font-bold uppercase tracking-wider text-stone-800 dark:text-slate-200">
                      Matériel & Adoption
                    </p>
                  </div>
                  {busiestDay && (
                    <span className="text-[10px] font-semibold text-[#c83b3b] flex items-center gap-0.5">
                      <Flame size={12} />
                      Pic : {busiestDay}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {/* Répartition OS */}
                  <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-slate-800/50 border border-stone-200/70 dark:border-slate-800">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-1">
                      Systèmes
                    </p>
                    {devices.length > 0 ? (
                      <div className="space-y-0.5 text-xs font-medium">
                        {devices.slice(0, 3).map((d) => (
                          <div key={d.os} className="flex justify-between text-[11px]">
                            <span className="text-stone-700 dark:text-slate-300">{d.os}</span>
                            <span className="font-bold text-stone-900 dark:text-slate-100">{d.pct}%</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-stone-400">Données en cours...</p>
                    )}
                  </div>

                  {/* Mode PWA */}
                  <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-slate-800/50 border border-stone-200/70 dark:border-slate-800">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-1">
                      PWA Installée
                    </p>
                    <p className="text-base font-bold font-serif-title text-[#c83b3b]">
                      {pwaRate}%
                    </p>
                    <p className="text-[10px] text-stone-500 dark:text-slate-400 mt-0.5">
                      sur écran d'accueil
                    </p>
                  </div>
                </div>
              </div>

              {/* 5. HISTORIQUE PAR JOUR (30 JOURS) */}
              {(history.length > 0 || sessionsHistory.length > 0) && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-slate-500 mb-1.5 px-0.5">
                    Activité récente (30 derniers jours)
                  </p>
                  <div className="rounded-xl border border-stone-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-[#1a1d21]/95 shadow-2xs overflow-hidden">
                    <div className="divide-y divide-stone-100 dark:divide-slate-800/60 max-h-48 overflow-y-auto">
                      {history.slice(0, 8).map((row, i) => (
                        <div key={`${row.day}-${i}`} className="flex items-center justify-between px-3 py-1.5 text-xs">
                          <span className="text-stone-600 dark:text-slate-400 font-mono text-[10px] font-medium">
                            {formatFrDate(row.day)}
                          </span>
                          <span className="text-stone-900 dark:text-slate-100 font-semibold text-[11px]">
                            {row.count} {row.event_type === 'qr_share_scan' ? 'scan QR' : row.event_type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
