import { useEffect } from 'react'
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
  ChevronRight,
} from 'lucide-react'
import { useScrollLock } from '../hooks/useScrollLock'
import { useTheme } from '../context/ThemeContext'
import { AppLogo } from './ui/AppLogo'
import { ArtCreaLogo } from './ui/ArtCreaLogo'

export function BurgerMenu({
  isOpen,
  onClose,
  onNavigate,
  onOpenLiveSession,
  onOpenSync,
  onOpenRules,
  onOpenLegal,
  onOpenArtCrea,
  liveSession,
}) {
  const { theme, toggleTheme } = useTheme()
  useScrollLock(isOpen)

  // Fermeture par touche Echap
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || typeof document === 'undefined') return null

  const handleAction = (callback) => {
    onClose()
    if (callback) callback()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex justify-end animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="burger-menu-title"
    >
      {/* Backdrop sombre */}
      <div
        className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Tiroir coulissant depuis la droite */}
      <div className="relative w-full max-w-xs sm:max-w-sm h-full school-surface text-stone-900 dark:text-slate-100 border-l border-stone-200/90 dark:border-slate-800/90 shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250 ease-out">
        {/* Liseré supérieur rouge/or */}
        <div className="h-1 bg-gradient-to-r from-transparent via-[#c83b3b] dark:via-[#FFC107] to-transparent shrink-0" />

        {/* En-tête du menu */}
        <div className="p-4 border-b border-stone-200/70 dark:border-slate-800/70 bg-[#faf9f5]/85 dark:bg-[#151719]/85 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
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
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-stone-200/60 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            title="Fermer le menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Liste des sections de navigation */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 text-xs">
          {/* Section 1 : Jeu & Statistiques */}
          <div>
            <span className="px-2.5 pb-1 block text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500">
              Parties & Joueurs
            </span>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => handleAction(() => onNavigate('players'))}
                className="w-full p-2.5 rounded-xl flex items-center gap-3 text-left hover:bg-stone-100 dark:hover:bg-slate-800/70 transition-colors group cursor-pointer"
              >
                <span className="p-2 rounded-lg bg-[#c83b3b]/10 dark:bg-[#FFC107]/10 text-[#c83b3b] dark:text-[#FFC107] shrink-0 group-hover:scale-105 transition-transform">
                  <Users size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-stone-800 dark:text-slate-200 text-xs">
                    Joueurs de la table
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate">
                    Gérer les profils et avatars
                  </p>
                </div>
                <ChevronRight size={14} className="text-stone-300 dark:text-slate-600 group-hover:text-stone-600 dark:group-hover:text-slate-300 transition-colors shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => handleAction(() => onNavigate('history'))}
                className="w-full p-2.5 rounded-xl flex items-center gap-3 text-left hover:bg-stone-100 dark:hover:bg-slate-800/70 transition-colors group cursor-pointer"
              >
                <span className="p-2 rounded-lg bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 shrink-0 group-hover:scale-105 transition-transform">
                  <History size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-stone-800 dark:text-slate-200 text-xs">
                    Historique des parties
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate">
                    Consulter les feuilles passées
                  </p>
                </div>
                <ChevronRight size={14} className="text-stone-300 dark:text-slate-600 group-hover:text-stone-600 dark:group-hover:text-slate-300 transition-colors shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => handleAction(() => onNavigate('stats'))}
                className="w-full p-2.5 rounded-xl flex items-center gap-3 text-left hover:bg-stone-100 dark:hover:bg-slate-800/70 transition-colors group cursor-pointer"
              >
                <span className="p-2 rounded-lg bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 shrink-0 group-hover:scale-105 transition-transform">
                  <BarChart3 size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-stone-800 dark:text-slate-200 text-xs">
                    Statistiques
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate">
                    Podiums, records et distinctions
                  </p>
                </div>
                <ChevronRight size={14} className="text-stone-300 dark:text-slate-600 group-hover:text-stone-600 dark:group-hover:text-slate-300 transition-colors shrink-0" />
              </button>
            </div>
          </div>

          {/* Section 2 : Synchronisation & Direct */}
          <div>
            <span className="px-2.5 pb-1 block text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500">
              Synchronisation & En direct
            </span>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => handleAction(onOpenLiveSession)}
                className={`w-full p-2.5 rounded-xl flex items-center gap-3 text-left transition-colors group cursor-pointer ${
                  liveSession
                    ? 'bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/30'
                    : 'hover:bg-stone-100 dark:hover:bg-slate-800/70'
                }`}
              >
                <span className={`p-2 rounded-lg shrink-0 group-hover:scale-105 transition-transform ${
                  liveSession
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                }`}>
                  <Radio size={16} className={liveSession ? 'animate-pulse' : ''} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-stone-800 dark:text-slate-200 text-xs">
                      Table en direct
                    </p>
                    {liveSession && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate">
                    {liveSession ? `Salon : ${liveSession.name}` : 'Jouer ensemble sur plusieurs écrans'}
                  </p>
                </div>
                <ChevronRight size={14} className="text-stone-300 dark:text-slate-600 group-hover:text-stone-600 dark:group-hover:text-slate-300 transition-colors shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => handleAction(onOpenSync)}
                className="w-full p-2.5 rounded-xl flex items-center gap-3 text-left hover:bg-stone-100 dark:hover:bg-slate-800/70 transition-colors group cursor-pointer"
              >
                <span className="p-2 rounded-lg bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 shrink-0 group-hover:scale-105 transition-transform">
                  <Cloud size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-stone-800 dark:text-slate-200 text-xs">
                    Sauvegarde & Sync
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate">
                    Multi-appareils ou fichier de secours
                  </p>
                </div>
                <ChevronRight size={14} className="text-stone-300 dark:text-slate-600 group-hover:text-stone-600 dark:group-hover:text-slate-300 transition-colors shrink-0" />
              </button>
            </div>
          </div>

          {/* Section 3 : Ressources & Légal */}
          <div>
            <span className="px-2.5 pb-1 block text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500">
              Ressources
            </span>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => handleAction(onOpenArtCrea)}
                className="w-full p-2.5 rounded-xl flex items-center gap-3 text-left hover:bg-stone-100 dark:hover:bg-slate-800/70 transition-colors group cursor-pointer"
              >
                <span className="w-8 h-8 rounded-lg bg-stone-900 dark:bg-slate-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform p-1.5 shadow-2xs">
                  <ArtCreaLogo className="h-3.5 w-auto" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-stone-800 dark:text-slate-200 text-xs">
                    Univers ART-créa
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate">
                    Webdesign & Photographie
                  </p>
                </div>
                <ChevronRight size={14} className="text-stone-300 dark:text-slate-600 group-hover:text-stone-600 dark:group-hover:text-slate-300 transition-colors shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => handleAction(() => onOpenLegal('legal'))}
                className="w-full p-2.5 rounded-xl flex items-center gap-3 text-left hover:bg-stone-100 dark:hover:bg-slate-800/70 transition-colors group cursor-pointer"
              >
                <span className="p-2 rounded-lg bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 shrink-0 group-hover:scale-105 transition-transform">
                  <Scale size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-stone-800 dark:text-slate-200 text-xs">
                    Hub juridique
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate">
                    Mentions, CGU & Confidentialité
                  </p>
                </div>
                <ChevronRight size={14} className="text-stone-300 dark:text-slate-600 group-hover:text-stone-600 dark:group-hover:text-slate-300 transition-colors shrink-0" />
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
                <Sun size={15} className="text-amber-400" />
              ) : (
                <Moon size={15} className="text-stone-700" />
              )}
              <span className="font-semibold text-stone-700 dark:text-slate-300">
                {theme === 'dark' ? 'Mode Ardoise (Sombre)' : 'Mode Cahier (Clair)'}
              </span>
            </div>

            {/* Switch miniature DA Ardoise */}
            <div
              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                theme === 'dark' ? 'bg-[#FFC107]' : 'bg-[#c83b3b]'
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
