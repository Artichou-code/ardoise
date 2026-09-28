import { useTheme } from '../../context/ThemeContext'

/**
 * Logo officiel Ardoise :
 * - Mode White (clair) : /ardoise-fav-white.svg
 * - Mode Dark (sombre) : /ardoise-fav.svg
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
