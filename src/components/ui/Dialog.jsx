import { createPortal } from 'react-dom'
import { useScrollLock, useBackdropClose } from '../../hooks/useScrollLock'
import { X } from 'lucide-react'

/**
 * Dialog modale centrée avec backdrop-blur et portail vers document.body.
 * Remplace window.alert / window.confirm.
 */
export function Dialog({ open, onClose, title, subtitle, icon, children, className = '', showClose = true }) {
  useScrollLock(open)
  const handleBackdrop = useBackdropClose(onClose)

  if (!open) return null

  const content = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fade-in"
      onClick={handleBackdrop}
    >
      <div
        className={`relative w-full max-w-sm school-card rounded-2xl shadow-2xl p-5 border border-stone-200/90 dark:border-slate-800 transition-all ${className}`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {(title || icon || (showClose && onClose)) && (
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {icon && (
                <div className="shrink-0">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                {title && (
                  <h2 className="font-serif-title text-lg font-bold leading-tight truncate">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            {showClose && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors -mr-1 -mt-1 cursor-pointer shrink-0"
                aria-label="Fermer"
              >
                <X size={17} />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  )

  if (typeof document !== 'undefined') {
    return createPortal(content, document.body)
  }

  return content
}

/**
 * Confirm dialog – remplace window.confirm.
 */
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirmer', cancelLabel = 'Annuler', danger = false }) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <p className="text-sm text-stone-600 dark:text-slate-400 mb-6 leading-relaxed">{message}</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-slate-700 text-sm font-medium text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={() => { onConfirm(); onClose() }}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white btn-margin-red"
        >
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  )
}
