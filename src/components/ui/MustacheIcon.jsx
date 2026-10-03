/**
 * Icône Mustache au tracé officiel Lucide Lab.
 * Conçue pour une grille 24x24 avec trait vectoriel stroke=2 et bords arrondis.
 */
export function MustacheIcon({ size = 24, strokeWidth = 2, className = '', ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M18.2 8.6a3.9 3.9 0 0 0-6.2-.2a3.75 3.75 0 0 0-6.2.2l-.6.8C4.5 10.4 3.3 11 2 11a5.55 5.55 0 0 0 10 3.2A5.45 5.45 0 0 0 22 11c-1.3 0-2.5-.6-3.2-1.6Z" />
    </svg>
  )
}

export const Mustache = MustacheIcon
