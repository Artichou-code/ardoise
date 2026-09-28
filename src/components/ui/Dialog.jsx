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
        className={`relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-6 ${className}`}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <h2 className="text-lg font-bold mb-4 text-zinc-900 dark:text-zinc-100">{title}</h2>
        )}
        {children}
      </div>
    </div>
  )
}

/**
 * Confirm dialog – remplace window.confirm.
 */
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirmer', danger = false }) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">{message}</p>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={() => { onConfirm(); onClose() }}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
            danger
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-accent hover:bg-accent-hover text-accent-text'
          }`}
          style={!danger ? { backgroundColor: '#fcc817', color: '#18181b' } : {}}
        >
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  )
}
