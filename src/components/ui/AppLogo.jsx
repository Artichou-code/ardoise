import { useTheme } from '../../context/ThemeContext'

/**
 * Logo officiel Ardoise :
 * - Mode Dark (sombre) : /logo-ardoise-noir.svg
 * - Mode White (clair) : /logo-ardoise-white.svg
 */
export function AppLogo({ className = 'w-8 h-8' }) {
  const { theme } = useTheme()
  const src = theme === 'dark' ? '/logo-ardoise-noir.svg' : '/logo-ardoise-white.svg'

  return (
    <img
      src={src}
      alt="Logo Ardoise"
      className={`${className} flex-shrink-0 select-none block`}
      draggable={false}
    />
  )
}
