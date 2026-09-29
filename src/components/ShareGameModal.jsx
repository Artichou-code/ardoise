import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { QRCodeSVG } from 'qrcode.react'
import { X, QrCode, Share2, Copy, Check, Loader2, Sparkles } from 'lucide-react'
import { useScrollLock } from '../hooks/useScrollLock'
import { shareGame } from '../store/syncStorage'

export function ShareGameModal({ isOpen, onClose, game }) {
  const [gameCode, setGameCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  useScrollLock(isOpen)

  const shareUrl = gameCode
    ? `${window.location.origin}/?partie=${encodeURIComponent(gameCode)}`
    : ''

  useEffect(() => {
    if (!isOpen || !game) return
    setIsLoading(true)
    setError(null)
    setCopied(false)

    shareGame(game)
      .then((data) => {
        setGameCode(data.gameCode || game.id)
      })
      .catch((err) => {
        setError(err.message || 'Impossible de générer le partage')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [isOpen, game])

  const handleCopy = () => {
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
          title: `Feuille de match Ardoise : ${game?.name || 'Partie'}`,
          text: `Découvre le résultat et la feuille de score de notre partie de ${game?.name || 'cartes'} sur Ardoise :`,
          url: shareUrl,
        })
      } catch {
        // Annulé par l'utilisateur
      }
    } else {
      handleCopy()
    }
  }

  if (!isOpen || !game || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-game-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Conteneur principal */}
      <div className="relative w-full max-w-sm school-surface text-stone-900 dark:text-slate-100 border border-stone-200/90 dark:border-slate-800/90 shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Liseré supérieur */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#c83b3b] dark:via-[#FFC107] to-transparent z-10" />

        {/* En-tête */}
        <div className="relative z-10 p-4 pb-3 border-b border-stone-200/70 dark:border-slate-800/70 bg-[#faf9f5]/85 dark:bg-[#151719]/85 backdrop-blur-md flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#c83b3b]/10 dark:bg-[#FFC107]/10 text-[#c83b3b] dark:text-[#FFC107]">
              <QrCode size={18} />
            </span>
            <div>
              <h2 id="share-game-title" className="text-base font-bold font-serif-title leading-tight">
                Partager la feuille de match
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-slate-400">
                {game.name} · {game.players?.length || 0} joueurs
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-stone-200/60 dark:hover:bg-slate-800 transition-colors flex-shrink-0 cursor-pointer"
            title="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corps */}
        <div className="p-5 flex flex-col items-center text-center space-y-4">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2 text-stone-500 dark:text-slate-400">
              <Loader2 size={28} className="animate-spin text-[#c83b3b] dark:text-[#FFC107]" />
              <p className="text-xs">Génération du QR code…</p>
            </div>
          ) : error ? (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs border border-rose-200">
              {error}
            </div>
          ) : (
            <>
              {/* Carré QR Code avec contraste optimal */}
              <div className="p-3 bg-white rounded-2xl shadow-md border border-stone-200 inline-block">
                <QRCodeSVG
                  value={shareUrl}
                  size={190}
                  level="M"
                  marginSize={1}
                />
              </div>

              {/* Code textuel */}
              <div>
                <span className="text-[10px] text-stone-400 dark:text-slate-500 uppercase tracking-widest font-semibold block">
                  Code de match
                </span>
                <span className="font-mono font-bold text-lg tracking-widest text-[#c83b3b] dark:text-[#FFC107]">
                  {gameCode}
                </span>
              </div>

              <p className="text-xs text-stone-500 dark:text-slate-400 max-w-xs leading-relaxed">
                Vos amis peuvent scanner ce QR code avec leur appareil photo pour consulter la feuille de match et l'ajouter à leur historique personnel.
              </p>

              {/* Actions de partage */}
              <div className="w-full flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex-1 py-2 px-3 rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-stone-50 font-bold text-xs text-stone-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  <span>{copied ? 'Lien copié !' : 'Copier le lien'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="py-2 px-4 rounded-xl bg-[#c83b3b] hover:bg-[#b91c1c] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Share2 size={14} />
                  <span>Partager</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
