import { useState, useEffect } from 'react'
import { X, ArrowUpRight } from 'lucide-react'
import { AppLogo } from './AppLogo'

/**
 * AppHandoffBanner — Passerelle intelligente navigateur -> application installée.
 * Détecte si l'utilisateur arrive dans le navigateur alors que l'application
 * est déjà installée sur son smartphone, et propose un passage fluide en 1 tap.
 */
export function AppHandoffBanner() {
  const [visible, setVisible] = useState(false)

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
    // Sur iOS, Apple interdit strictement à Safari de basculer vers un WebClip d'écran d'accueil.
    // On ne pollue pas l'écran avec un faux bouton "Ouvrir l'app" qui ne peut pas s'exécuter.
    if (ios) return

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

  const currentPath = typeof window !== 'undefined'
    ? (window.location.pathname || '/') + (window.location.search || '')
    : '/'
  const cleanPath = currentPath.startsWith('/') ? currentPath : `/${currentPath}`
  const targetUrl = `https://ardoise.art-crea.fr${cleanPath}`
  // Sur Android : déclencher l'intent sans restreindre au package Chrome pour cibler directement la WebAPK installée
  const intentUrl = `intent://ardoise.art-crea.fr${cleanPath}#Intent;scheme=https;S.browser_fallback_url=${encodeURIComponent(targetUrl)};end;`

  return (
    <div
      className="fixed top-2 sm:top-3 inset-x-2.5 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-[1150] max-w-md mx-auto animate-in fade-in slide-in-from-top-3 duration-300"
      role="banner"
      aria-label="Passerelle vers l'application installée"
    >
      <div className="relative flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl bg-stone-900/95 dark:bg-slate-900/95 text-white backdrop-blur-md border border-stone-700/80 dark:border-slate-700/80 shadow-[0_10px_30px_rgb(0,0,0,0.35)]">
        {/* Liseré supérieur signature */}
        <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#c83b3b] to-transparent rounded-t-2xl" />

        {/* Logo & Libellé compact non tronqué */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <AppLogo className="w-8 h-8 rounded-xl shrink-0 shadow-xs" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold leading-tight truncate text-stone-100">
              Application Ardoise
            </p>
            <p className="text-[11px] text-stone-300 dark:text-slate-400 leading-tight">
              Mode plein écran
            </p>
          </div>
        </div>

        {/* Bouton d'action natif */}
        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={intentUrl}
            onClick={() => {
              setTimeout(() => {
                handleDismiss()
              }, 800)
            }}
            className="px-3 py-1.5 rounded-xl bg-[#c83b3b] hover:bg-[#b91c1c] text-white font-bold text-xs transition-colors flex items-center gap-1 shadow-xs cursor-pointer focus:outline-none"
          >
            <span>Ouvrir</span>
            <ArrowUpRight size={13} />
          </a>

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
