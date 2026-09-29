import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  BarChart3,
  History,
  Users,
  Radio,
  Cloud,
  Scale,
  Sun,
  Moon,
  Share2,
  Trophy,
} from 'lucide-react'
import { useScrollLock } from '../hooks/useScrollLock'
import { useTheme } from '../context/ThemeContext'
import { AppLogo } from './ui/AppLogo'
import { ArtCreaLogo } from './ui/ArtCreaLogo'

export function BurgerMenu({
  isOpen,
  onClose,
  onNavigate,
  onOpenTrophies,
  onOpenLiveSession,
  onOpenShareGames,
  onOpenSync,
  onOpenRules,
  onOpenLegal,
  onOpenArtCrea,
  liveSession,
}) {
  const { theme, toggleTheme } = useTheme()
  const drawerRef = useRef(null)
  const startX = useRef(null)
  const startY = useRef(null)
  const currentDx = useRef(0)
  const isSwiping = useRef(false)

  useScrollLock(isOpen)

  const handleClose = () => {
    if (drawerRef.current && drawerRef.current.contains(document.activeElement)) {
      document.activeElement.blur()
    }
    onClose()
  }

  // Fermeture par touche Echap
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  if (typeof document === 'undefined') return null

  // Geste tactile de balayage vers la droite pour refermer
  const handleTouchStart = (e) => {
    if (!isOpen) return
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    currentDx.current = 0
    isSwiping.current = false
  }

  const handleTouchMove = (e) => {
    if (!isOpen || startX.current === null || startY.current === null) return
    const dx = e.touches[0].clientX - startX.current
    const dy = e.touches[0].clientY - startY.current

    if (!isSwiping.current && Math.abs(dy) > Math.abs(dx)) {
      return
    }

    if (dx > 5) {
      isSwiping.current = true
      currentDx.current = dx
      if (drawerRef.current) {
        drawerRef.current.style.transform = `translate3d(${dx}px, 0, 0)`
        drawerRef.current.style.transition = 'none'
      }
    }
  }

  const handleTouchEnd = () => {
    if (!isOpen || startX.current === null) return
    const dx = currentDx.current
    startX.current = null
    startY.current = null
    currentDx.current = 0
    isSwiping.current = false
    if (drawerRef.current) {
      drawerRef.current.style.transform = ''
      drawerRef.current.style.transition = ''
    }
    if (dx > 70) {
      handleClose()
    }
  }

  const handleAction = (callback) => {
    handleClose()
    if (callback) {
      setTimeout(() => callback(), 150)
    }
  }

  return createPortal(
    <div
      className={`fixed inset-0 z-[1000] flex justify-end drawer-overlay ${
        isOpen ? 'drawer-overlay-open' : 'drawer-overlay-closed'
      }`}
      role="dialog"
      aria-modal={isOpen ? "true" : undefined}
      inert={!isOpen ? true : undefined}
      aria-labelledby="burger-menu-title"
    >
      {/* Backdrop sombre avec fondu fluide */}
      <div
        className={`absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs drawer-backdrop ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Tiroir coulissant fluide à l'ouverture et à la fermeture */}
      <div
        ref={drawerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative w-full max-w-xs sm:max-w-sm h-full school-surface text-stone-900 dark:text-slate-100 border-l border-stone-200/90 dark:border-slate-800/90 shadow-2xl flex flex-col z-10 drawer-panel ${
          isOpen ? 'drawer-panel-open pointer-events-auto' : 'drawer-panel-closed pointer-events-none'
        }`}
      >
        {/* Liseré supérieur rouge signature */}
        <div className="h-1 bg-gradient-to-r from-transparent via-[#c83b3b] to-transparent shrink-0" />

        {/* En-tête du menu */}
        <div className="p-3.5 sm:p-4 border-b border-stone-200/70 dark:border-slate-800/70 bg-[#faf9f5]/85 dark:bg-[#151719]/85 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <AppLogo className="w-8 h-8 rounded-xl shadow-2xs shrink-0" />
            <div className="min-w-0">
              <h2 id="burger-menu-title" className="text-base font-bold font-serif-title leading-tight truncate">
                Menu
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate">
                Ardoise · Carnet de scores
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-stone-200/60 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            title="Fermer le menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Liste des sections de navigation */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 text-xs">
          {/* Section 1 : Carnet & Suivi */}
          <div>
            <span className="px-2 pb-1 block text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500">
              Carnet & Suivi
            </span>
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => handleAction(() => onNavigate('players'))}
                className="w-full p-2 rounded-xl flex items-center gap-3 text-left hover:bg-stone-100 dark:hover:bg-slate-800/70 transition-colors group cursor-pointer"
              >
                <span className="p-2 rounded-lg bg-[#c83b3b]/10 dark:bg-[#c83b3b]/20 text-[#c83b3b] shrink-0 group-hover:scale-105 transition-transform">
                  <Users size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-stone-800 dark:text-slate-200 text-xs">
                    Joueurs
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate">
                    Profils et avatars
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAction(() => onNavigate('history'))}
                className="w-full p-2 rounded-xl flex items-center gap-3 text-left hover:bg-stone-100 dark:hover:bg-slate-800/70 transition-colors group cursor-pointer"
              >
                <span className="p-2 rounded-lg bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 shrink-0 group-hover:scale-105 transition-transform">
                  <History size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-stone-800 dark:text-slate-200 text-xs">
                    Historique
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate">
                    Parties archivées
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAction(() => onNavigate('stats'))}
                className="w-full p-2 rounded-xl flex items-center gap-3 text-left hover:bg-stone-100 dark:hover:bg-slate-800/70 transition-colors group cursor-pointer"
              >
                <span className="p-2 rounded-lg bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 shrink-0 group-hover:scale-105 transition-transform">
                  <BarChart3 size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-stone-800 dark:text-slate-200 text-xs">
                    Statistiques
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate">
                    Podiums et records
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAction(onOpenTrophies)}
                className="w-full p-2 rounded-xl flex items-center gap-3 text-left hover:bg-stone-100 dark:hover:bg-slate-800/70 transition-colors group cursor-pointer"
              >
                <span className="p-2 rounded-lg bg-[#c83b3b]/10 dark:bg-[#c83b3b]/20 text-[#c83b3b] shrink-0 group-hover:scale-105 transition-transform">
                  <Trophy size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-stone-800 dark:text-slate-200 text-xs">
                    Trophées
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate">
                    Guide des distinctions
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Section 2 : Partage & Sauvegarde (3 actions sur la même ligne) */}
          <div>
            <span className="px-2 pb-1.5 block text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500">
              Partage & Sauvegarde
            </span>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => handleAction(onOpenLiveSession)}
                className={`p-2 rounded-xl flex flex-col items-center justify-center text-center gap-1.5 transition-colors group cursor-pointer relative ${
                  liveSession
                    ? 'bg-emerald-500/10 hover:bg-emerald-500/15'
                    : 'hover:bg-stone-100 dark:hover:bg-slate-800/70'
                }`}
              >
                {liveSession && (
                  <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
                <span className={`p-2 rounded-lg shrink-0 group-hover:scale-105 transition-transform ${
                  liveSession
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                }`}>
                  <Radio size={16} className={liveSession ? 'animate-pulse' : ''} />
                </span>
                <div className="min-w-0 w-full">
                  <p className="font-bold text-stone-800 dark:text-slate-200 text-xs leading-tight truncate">
                    En direct
                  </p>
                  <p className="text-[10px] text-stone-500 dark:text-slate-400 truncate mt-0.5">
                    {liveSession ? 'Actif' : 'Table live'}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAction(onOpenShareGames)}
                className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-slate-800/70 flex flex-col items-center justify-center text-center gap-1.5 transition-colors group cursor-pointer"
              >
                <span className="p-2 rounded-lg bg-[#c83b3b]/10 dark:bg-[#c83b3b]/20 text-[#c83b3b] shrink-0 group-hover:scale-105 transition-transform">
                  <Share2 size={16} />
                </span>
                <div className="min-w-0 w-full">
                  <p className="font-bold text-stone-800 dark:text-slate-200 text-xs leading-tight truncate">
                    Partager
                  </p>
                  <p className="text-[10px] text-stone-500 dark:text-slate-400 truncate mt-0.5">
                    QR & code
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAction(onOpenSync)}
                className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-slate-800/70 flex flex-col items-center justify-center text-center gap-1.5 transition-colors group cursor-pointer"
              >
                <span className="p-2 rounded-lg bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 shrink-0 group-hover:scale-105 transition-transform">
                  <Cloud size={16} />
                </span>
                <div className="min-w-0 w-full">
                  <p className="font-bold text-stone-800 dark:text-slate-200 text-xs leading-tight truncate">
                    Sauvegarde
                  </p>
                  <p className="text-[10px] text-stone-500 dark:text-slate-400 truncate mt-0.5">
                    Cloud & fichier
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Section 3 : Ressources & Légal */}
          <div>
            <span className="px-2 pb-1 block text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500">
              Ressources
            </span>
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => handleAction(onOpenArtCrea)}
                className="w-full p-2 rounded-xl flex items-center gap-3 text-left hover:bg-stone-100 dark:hover:bg-slate-800/70 transition-colors group cursor-pointer"
              >
                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                  <ArtCreaLogo className="h-4.5 w-auto group-hover:scale-105 transition-transform" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-stone-800 dark:text-slate-200 text-xs">
                    ART-créa
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate">
                    Webdesign & Photo
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAction(() => onOpenLegal('mentions'))}
                className="w-full p-2 rounded-xl flex items-center gap-3 text-left hover:bg-stone-100 dark:hover:bg-slate-800/70 transition-colors group cursor-pointer"
              >
                <span className="p-2 rounded-lg bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 shrink-0 group-hover:scale-105 transition-transform">
                  <Scale size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-stone-800 dark:text-slate-200 text-xs">
                    Infos légales
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate">
                    Mentions, CGU & RGPD
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Pied de menu : bascule de thème & copyright */}
        <div className="p-3 sm:p-4 border-t border-stone-200/70 dark:border-slate-800/70 bg-[#faf9f5]/85 dark:bg-[#151719]/85 backdrop-blur-md space-y-2.5 shrink-0">
          {/* Bouton de bascule de thème direct */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-full p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:bg-stone-100 dark:hover:bg-slate-800 flex items-center justify-between text-xs transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              {theme === 'dark' ? (
                <Sun size={15} className="text-[#c83b3b]" />
              ) : (
                <Moon size={15} className="text-stone-700" />
              )}
              <span className="font-semibold text-stone-700 dark:text-slate-300">
                {theme === 'dark' ? 'Mode Ardoise (Sombre)' : 'Mode Cahier (Clair)'}
              </span>
            </div>

            {/* Switch miniature DA Ardoise (toujours rouge identitaire) */}
            <div
              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                theme === 'dark' ? 'bg-[#c83b3b]' : 'bg-stone-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white dark:bg-slate-900 shadow-xs ring-0 transition-transform duration-200 ease-in-out ${
                  theme === 'dark' ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
          </button>

          <p className="text-[10px] text-stone-400 dark:text-slate-500 text-center">
            Ardoise · Gratuit, sans pub & 100% hors-ligne
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}
