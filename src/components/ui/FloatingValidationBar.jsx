import React from 'react'

/**
 * Barre d'action de validation pour les moteurs de jeu.
 * Utilise position: sticky bottom: 0 au sein du conteneur de défilement :
 * - Si le contenu tient sur l'écran (pas de défilement nécessaire), le bouton
 *   reste naturellement juste derrière le contenu du jeu, immédiatement suivi
 *   des boutons secondaires ([Supprimer] et [Finir la partie plus tôt]).
 * - Si le contenu est long (défilement nécessaire), le bouton flotte au bas de
 *   l'écran pour rester accessible, et faire défiler jusqu'en bas révèle
 *   les boutons secondaires placés après lui.
 */
export function FloatingValidationBar({ children, className = '' }) {
  return (
    <div
      className={`sticky bottom-0 z-20 pt-2 pb-1 bg-gradient-to-t from-[#faf9f5] via-[#faf9f5]/95 to-transparent dark:from-[#151719] dark:via-[#151719]/95 pointer-events-auto ${className}`}
    >
      <div className="w-full max-w-sm mx-auto">
        {children}
      </div>
    </div>
  )
}
