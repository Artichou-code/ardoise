import { useScrollLock, useBackdropClose } from '../../hooks/useScrollLock'

/**
 * Dialog modale centrée avec backdrop-blur.
 * Remplace window.alert / window.confirm.
 */
export function Dialog({ open, onClose, title, children, className = '' }) {
  useScrollLock(open)
  const handleBackdrop = useBackdropClose(onClose)

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div
        className={`relative w-full max-w-sm school-card rounded-2xl shadow-xl p-6 ${className}`}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <h2 className="font-serif-title text-xl font-bold mb-3">{title}</h2>
        )}
        {children}
      </div>
    </div>
  )
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
