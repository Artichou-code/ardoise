import { useTheme } from '../../context/ThemeContext'

/**
 * Logo dans la zone d'en-tête :
 * - Mode Clair : /ardoise-fav-white.svg
 * - Mode Sombre (Dark) : /ardoise-fav.svg
 */
export function AppLogo({ className = 'w-8 h-8' }) {
  const { theme } = useTheme()
  const src = theme === 'dark' ? '/ardoise-fav.svg' : '/ardoise-fav-white.svg'

  return (
    <img
      src={src}
      alt="Logo Ardoise"
      className={`${className} flex-shrink-0 select-none block`}
      draggable={false}
    />
  )
}
