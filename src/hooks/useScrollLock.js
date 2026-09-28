import { useEffect, useCallback } from 'react'

/**
 * Verrouille le scroll de l'arrière-plan quand isLocked est true.
 * Obligatoire dès qu'une modale ou un bottom sheet est ouvert.
 */
export function useScrollLock(isLocked) {
  useEffect(() => {
    if (!isLocked) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isLocked])
}

/**
 * Ferme au clic sur l'overlay (backdrop).
 */
export function useBackdropClose(onClose) {
  return useCallback((e) => {
    if (e.target === e.currentTarget) onClose()
  }, [onClose])
}
