import { useTheme } from '../../context/ThemeContext'

/**
 * Logo officiel Ardoise dans l'en-tête :
 * - Mode Sombre : /Ardoise_v2-dark.svg
 * - Mode Clair  : /Ardoise_v2-white.svg
 */
export function AppLogo({ className = 'w-8 h-8' }) {
  const { theme } = useTheme()
  const src = theme === 'dark' ? '/Ardoise_v2-dark.svg' : '/Ardoise_v2-white.svg'

  return (
    <img
      src={src}
      alt="Logo Ardoise"
      width="32"
      height="32"
      className={`${className} flex-shrink-0 select-none block`}
      draggable={false}
    />
  )
}
