import { useState, useEffect } from 'react'
import { X, Smartphone, ArrowUpRight, Check } from 'lucide-react'
import { AppLogo } from './AppLogo'

/**
 * AppHandoffBanner — Passerelle intelligente navigateur -> application installée.
 * Détecte si l'utilisateur arrive dans le navigateur alors que l'application
 * est déjà installée sur son smartphone, et propose un passage fluide en 1 tap.
 */
export function AppHandoffBanner() {
  const [visible, setVisible] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [showIosTip, setShowIosTip] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const isStandalone = Boolean(
      window.matchMedia?.('(display-mode: standalone)')?.matches ||
      window.navigator?.standalone
    )

    // Si on est déjà dans l'application installée, mémoriser pour les futures sessions navigateur
    if (isStandalone) {
      try {
        localStorage.setItem('ardoise_pwa_installed', 'true')
      } catch {}
      return
    }

    // Vérifier si mobile
    const ua = navigator.userAgent || ''
    const mobile = /android|iphone|ipad|ipod/i.test(ua)
    if (!mobile) return

    const ios = /iphone|ipad|ipod/i.test(ua)
    setIsIos(ios)

    // Vérifier si déjà masqué pour cette session
    try {
      if (sessionStorage.getItem('ardoise_handoff_dismissed') === 'true') {
        return
      }
    } catch {}

    // Afficher si l'utilisateur a déjà installé l'app ou s'il arrive via le scan du QR code
    const params = new URLSearchParams(window.location.search)
    const fromQr = params.get('src') === 'qr' || params.has('ref')
    const previouslyInstalled = localStorage.getItem('ardoise_pwa_installed') === 'true'

    if (fromQr || previouslyInstalled) {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  const handleDismiss = () => {
    setVisible(false)
    try {
      sessionStorage.setItem('ardoise_handoff_dismissed', 'true')
    } catch {}
  }

  const handleOpenApp = () => {
    if (isIos) {
      setShowIosTip(true)
      return
    }

    // Sur Android : déclencher l'intent pour basculer directement dans la WebAPK / fenêtre autonome
    const currentPath = window.location.pathname + window.location.search
    const intentUrl = `intent://ardoise.art-crea.fr${currentPath}#Intent;scheme=https;package=com.android.chrome;action=android.intent.action.VIEW;end;`
    window.location.href = intentUrl

    // Si après 1.5s rien n'a bougé (app non encore installée sur ce navigateur précis), masquer
    setTimeout(() => {
      setShowIosTip(true)
    }, 1500)
  }

  return (
    <div
      className="fixed top-2 sm:top-3 inset-x-2.5 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-[1150] max-w-md mx-auto animate-in fade-in slide-in-from-top-3 duration-300"
      role="banner"
      aria-label="Passerelle vers l'application installée"
    >
      <div className="relative flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl bg-stone-900/95 dark:bg-slate-900/95 text-white backdrop-blur-md border border-stone-700/80 dark:border-slate-700/80 shadow-[0_10px_30px_rgb(0,0,0,0.35)]">
        {/* Liseré supérieur signature */}
        <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#c83b3b] to-transparent rounded-t-2xl" />

        {/* Logo & Libellé */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <AppLogo className="w-8 h-8 rounded-xl shrink-0 shadow-xs" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold leading-tight truncate text-stone-100">
              {showIosTip ? "Reprendre sur l'écran d'accueil" : 'Application Ardoise'}
            </p>
            <p className="text-[11px] text-stone-300 dark:text-slate-400 leading-tight truncate">
              {showIosTip
                ? "Touchez l'icône Ardoise de votre téléphone"
                : 'Plein écran, sans pub et hors-ligne'}
            </p>
          </div>
        </div>

        {/* Bouton d'action */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!showIosTip ? (
            <button
              type="button"
              onClick={handleOpenApp}
              className="px-3 py-1.5 rounded-xl bg-[#c83b3b] hover:bg-[#b91c1c] text-white font-bold text-xs transition-colors flex items-center gap-1 shadow-xs cursor-pointer focus:outline-none"
            >
              <span>Ouvrir l'app</span>
              <ArrowUpRight size={13} />
            </button>
          ) : (
            <span className="text-[11px] font-semibold text-emerald-400 px-2 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-1">
              <Check size={12} />
              <span>Prêt</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-full text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer focus:outline-none shrink-0"
            title="Fermer"
            aria-label="Fermer la bannière"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
