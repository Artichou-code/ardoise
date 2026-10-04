import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, QrCode, Users, Gamepad2, Share2, TrendingUp, RefreshCw } from 'lucide-react'
import { useScrollLock } from '../hooks/useScrollLock'

/**
 * StatsModal — Dashboard d'administration caché.
 * Accès : 5 taps rapides sur le QR code dans ShareAppModal.
 */
export function StatsModal({ isOpen, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useScrollLock(isOpen)

  useEffect(() => {
    if (!isOpen) return
    setError(null)
    loadStats()
  }, [isOpen])

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

  const qrScans = data?.totals?.qr_share_scan || 0
  const sessionJoins = data?.totals?.session_join || 0
  const sessionsTotal = data?.sessions?.total || 0
  const sessionsClosed = data?.sessions?.closed || 0
  const totalParticipants = data?.sessions?.totalParticipants || 0
  const sharedGames = data?.sharedGames || 0

  // Dernier 14j d'historique par type
  const history = (data?.history || []).slice(0, 28)
  const sessionsHistory = (data?.sessionsHistory || []).slice(0, 14)

  const StatCard = ({ icon: Icon, color, label, value, sub }) => (
    <div className={`p-3 rounded-xl border ${color} flex items-start gap-3`}>
      <div className="p-1.5 rounded-lg bg-white/60 dark:bg-slate-800/60 shrink-0">
        <Icon size={16} className="text-stone-600 dark:text-slate-300" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400">{label}</p>
        <p className="text-xl font-bold text-stone-900 dark:text-slate-100 leading-tight">{value}</p>
        {sub && <p className="text-[10px] text-stone-400 dark:text-slate-500 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  )

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

      {/* Panneau */}
      <div className="relative w-full max-w-sm school-surface text-stone-900 dark:text-slate-100 border border-stone-200/90 dark:border-slate-800/90 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Liseré signature */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#c83b3b] to-transparent z-10" />

        {/* Header */}
        <div className="relative z-10 p-3.5 border-b border-stone-200/70 dark:border-slate-800/70 bg-[#faf9f5]/85 dark:bg-[#151719]/85 backdrop-blur-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <TrendingUp size={18} className="text-[#c83b3b] shrink-0" />
            <div>
              <h2 className="text-sm font-bold leading-snug">Stats Ardoise</h2>
              <p className="text-[10px] text-stone-400 dark:text-slate-500">Dashboard admin</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={loadStats}
              disabled={loading}
              className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 hover:bg-stone-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer focus:outline-none disabled:opacity-40"
              title="Actualiser"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 hover:bg-stone-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer focus:outline-none"
              title="Fermer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Corps */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-400">
              Erreur : {error}
            </div>
          )}

          {loading && !data && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw size={24} className="animate-spin text-stone-300" />
            </div>
          )}

          {data && (
            <>
              {/* Section QR / Acquisition */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-slate-500 mb-2 px-0.5">
                  Acquisition
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <StatCard
                    icon={QrCode}
                    color="bg-blue-50/80 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/40"
                    label="Scans QR"
                    value={qrScans}
                    sub="Via ardoise.art-crea.fr/qr"
                  />
                  <StatCard
                    icon={Share2}
                    color="bg-indigo-50/80 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/40"
                    label="Parties partagées"
                    value={sharedGames}
                    sub="Total exporté"
                  />
                </div>
              </div>

              {/* Section Sessions Live */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-slate-500 mb-2 px-0.5">
                  Sessions Live
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <StatCard
                    icon={Gamepad2}
                    color="bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40"
                    label="Tables créées"
                    value={sessionsTotal}
                    sub={`${sessionsClosed} clôturées`}
                  />
                  <StatCard
                    icon={Users}
                    color="bg-amber-50/80 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/40"
                    label="Joueurs rejoints"
                    value={sessionJoins || totalParticipants}
                    sub="Via QR ou code"
                  />
                </div>
              </div>

              {/* Historique 14j */}
              {history.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-slate-500 mb-2 px-0.5">
                    Historique (30 derniers jours)
                  </p>
                  <div className="rounded-xl border border-stone-200/80 dark:border-slate-800/80 overflow-hidden">
                    <div className="divide-y divide-stone-100 dark:divide-slate-800/60">
                      {/* Dédupliquer par jour */}
                      {Object.entries(
                        history.reduce((acc, row) => {
                          if (!acc[row.day]) acc[row.day] = {}
                          acc[row.day][row.event_type] = (acc[row.day][row.event_type] || 0) + row.count
                          return acc
                        }, {})
                      )
                        .sort((a, b) => b[0].localeCompare(a[0]))
                        .slice(0, 10)
                        .map(([day, counts]) => (
                          <div key={day} className="flex items-center justify-between px-3 py-2 text-xs">
                            <span className="text-stone-500 dark:text-slate-400 font-mono text-[10px]">{day}</span>
                            <div className="flex items-center gap-3">
                              {counts.qr_share_scan != null && (
                                <span className="text-blue-600 dark:text-blue-400">
                                  {counts.qr_share_scan} QR
                                </span>
                              )}
                              {counts.session_join != null && (
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  {counts.session_join} joins
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Sessions history 14j */}
              {sessionsHistory.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-slate-500 mb-2 px-0.5">
                    Tables par jour (30j)
                  </p>
                  <div className="rounded-xl border border-stone-200/80 dark:border-slate-800/80 overflow-hidden">
                    <div className="divide-y divide-stone-100 dark:divide-slate-800/60">
                      {sessionsHistory.map((row) => (
                        <div key={row.day} className="flex items-center justify-between px-3 py-2 text-xs">
                          <span className="text-stone-500 dark:text-slate-400 font-mono text-[10px]">{row.day}</span>
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">
                            {row.count} table{row.count > 1 ? 's' : ''}
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
