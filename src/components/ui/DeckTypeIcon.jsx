import { Dices } from 'lucide-react'

/**
 * Icône visuelle du type de matériel (cartes classiques vs jeux de société)
 * Calquée exactement sur le filtre de l'accueil d'Ardoise :
 * - classic : Carte à jouer 🂱
 * - dedicated / any : Dés Lucide (Dices)
 */
export function DeckTypeIcon({ deckType, className = '', size = 12 }) {
  if (deckType === 'classic') {
    return (
      <span
        className={`inline-block leading-none select-none text-[13px] text-stone-700 dark:text-slate-300 ${className}`}
        aria-hidden="true"
      >
        🂱
      </span>
    )
  }

  return (
    <Dices
      size={size}
      className={`shrink-0 text-stone-500 dark:text-slate-400 ${className}`}
      aria-hidden="true"
    />
  )
}
