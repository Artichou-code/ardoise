import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { QRCodeSVG } from 'qrcode.react'
import { X, Share2, Copy, Check } from 'lucide-react'
import { useScrollLock } from '../hooks/useScrollLock'
import { AppLogo } from './ui/AppLogo'
import { StatsModal } from './StatsModal'

const APP_SHARE_URL = 'https://ardoise.art-crea.fr/qr'
const APP_HOME_URL = 'https://ardoise.art-crea.fr/'

export function ShareAppModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const tapCountRef = useRef(0)
  const tapTimerRef = useRef(null)

  const handleQrTap = useCallback(() => {
    tapCountRef.current += 1
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current)
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0
      setShowStats(true)
      return
    }
    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0
    }, 2000)
  }, [])


  useScrollLock(isOpen)

  useEffect(() => {
    if (!isOpen) return
    setCopied(false)
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleCopy = () => {
    navigator.clipboard.writeText(APP_HOME_URL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        // Partager uniquement l'URL permet à WhatsApp, iMessage, Telegram et Discord
        // de générer automatiquement la carte d'aperçu Open Graph (image + titre + description).
        await navigator.share({
          url: APP_HOME_URL,
        })
      } catch {
        // Annulé par l'utilisateur
      }
    } else {
      handleCopy()
    }
  }

  // StatsModal peut être affiché même si la share modal vient de se fermer
  if (!isOpen && !showStats) return null
  if (typeof document === 'undefined') return null

  const sharePortal = isOpen ? createPortal(
    <div
      className="fixed inset-0 z-[1050] flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-app-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Conteneur principal */}
      <div className="relative w-full max-w-sm school-surface text-stone-900 dark:text-slate-100 border border-stone-200/90 dark:border-slate-800/90 shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden isolate flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Liseré supérieur signature */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#c83b3b] to-transparent z-20 rounded-t-2xl sm:rounded-t-3xl" />

        {/* En-tête */}
        <div className="relative z-10 p-3.5 sm:p-4 pb-3 border-b border-stone-200/70 dark:border-slate-800/70 bg-[#faf9f5] dark:bg-[#151719] rounded-t-2xl sm:rounded-t-3xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <AppLogo className="w-8 h-8 rounded-xl shadow-2xs shrink-0" />
            <div className="min-w-0 flex-1">
              <h2 id="share-app-title" className="text-base font-bold font-serif-title leading-snug truncate">
                Partager Ardoise
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate">
                Carnet de scores & règles de jeux
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-stone-200/60 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer focus:outline-none"
            title="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corps */}
        <div className="p-5 flex flex-col items-center text-center space-y-4">
          {/* QR Code de l'application — 5 taps rapides → dashboard stats */}
          <div
            className="p-3.5 bg-white rounded-2xl shadow-md border border-stone-200 inline-block cursor-pointer select-none"
            onClick={handleQrTap}
            title="QR code"
          >
            <QRCodeSVG
              value={APP_SHARE_URL}
              size={190}
              level="M"
              marginSize={1}
            />
          </div>

          {/* Lien cliquable / copiable */}
          <button
            type="button"
            onClick={handleCopy}
            className="px-3.5 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-stone-200/90 dark:border-slate-700/80 hover:border-[#c83b3b]/50 transition-colors cursor-pointer focus:outline-none group"
            title="Copier l'adresse de l'application"
          >
            <span className="text-[10px] text-stone-400 dark:text-slate-500 uppercase tracking-widest font-semibold block">
              Lien de l'application
            </span>
            <span className="font-mono font-bold text-sm text-[#c83b3b] group-hover:underline">
              ardoise.art-crea.fr
            </span>
          </button>

          <p className="text-xs text-stone-500 dark:text-slate-400 max-w-xs leading-relaxed">
            Faites scanner ce QR code ou envoyez le lien à vos amis pour qu'ils ouvrent <strong>Ardoise</strong> sur leur téléphone (gratuit, sans pub et hors-ligne).
          </p>

          {/* Actions de partage */}
          <div className="w-full flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 py-2.5 px-3 rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-stone-50 dark:hover:bg-slate-700/70 font-bold text-xs text-stone-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span>{copied ? 'Lien copié\u00A0!' : 'Copier le lien'}</span>
            </button>

            <button
              type="button"
              onClick={handleNativeShare}
              className="py-2.5 px-4 rounded-xl bg-[#c83b3b] hover:bg-[#b91c1c] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs focus:outline-none"
            >
              <Share2 size={14} />
              <span>Partager</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  ) : null

  return (
    <>
      {sharePortal}
      <StatsModal isOpen={showStats} onClose={() => setShowStats(false)} />
    </>
  )
}
