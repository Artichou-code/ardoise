/**
 * Logo officiel Ardoise (version V2 blanche avec feuillet, petits carreaux et bâtons de comptage)
 */
export function AppLogo({ className = 'w-8 h-8' }) {
  return (
    <img
      src="/Ardoise_v2-white.svg"
      alt="Logo Ardoise"
      className={`${className} flex-shrink-0 select-none block`}
      draggable={false}
    />
  )
}
