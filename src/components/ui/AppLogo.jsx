import { useTheme } from '../../context/ThemeContext'

/**
 * Logo officiel Ardoise :
 * - Mode White (clair) : fond blanc ivoire, contour pierre, "A" gris anthracite (#1a1d21), barre rouge marge (#c83b3b)
 * - Mode Dark (sombre) : fond ardoise (#1a1d21), contour ardoise, "A" craie blanche (#f8fafc), barre rouge marge (#c83b3b)
 */
export function AppLogo({ className = 'w-8 h-8' }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const bgFill = isDark ? '#1a1d21' : '#ffffff'
  const borderStroke = isDark ? '#2e3238' : '#d6d3d1'
  const fgColor = isDark ? '#f8fafc' : '#1a1d21'
  const gridStroke = isDark ? '#ffffff' : '#1a1d21'
  const gridOpacity = isDark ? '0.04' : '0.06'

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 85.5 85.5"
      className={`${className} rounded-lg flex-shrink-0 transition-colors duration-200`}
      aria-label="Logo Ardoise"
    >
      <defs>
        <pattern
          id="ardoise-logo-grid"
          x="0"
          y="0"
          width="9"
          height="9"
          patternTransform="translate(-5827.25 -10511.2778) scale(.2812 -.2812)"
          patternUnits="userSpaceOnUse"
          viewBox="0 0 9 9"
        >
          <g>
            <rect width="9" height="9" fill="none" />
            <polyline
              points="9 9 0 9 0 0"
              fill="none"
              opacity={gridOpacity}
              stroke={gridStroke}
              strokeMiterlimit="1.12"
              strokeWidth=".28"
            />
          </g>
        </pattern>
      </defs>
      <g>
        <rect
          x="1.2"
          y="1.2"
          width="83.1"
          height="83.1"
          rx="12.37"
          ry="12.37"
          fill={bgFill}
          stroke={borderStroke}
          strokeMiterlimit="1.12"
          strokeWidth="2.2"
        />
        <path
          d="M12.94,1.12h59.62c6.52,0,11.81,5.29,11.81,11.81v59.63c0,6.52-5.29,11.81-11.81,11.81H12.94c-6.52,0-11.81-5.29-11.81-11.81V12.94C1.12,6.42,6.42,1.12,12.94,1.12Z"
          fill="url(#ardoise-logo-grid)"
          opacity=".6"
        />
        <line
          x1="42.75"
          y1="21.38"
          x2="22.78"
          y2="63.56"
          fill="none"
          stroke={fgColor}
          strokeLinecap="round"
          strokeMiterlimit="1.12"
          strokeWidth="7.31"
        />
        <line
          x1="42.75"
          y1="21.38"
          x2="62.72"
          y2="63.56"
          fill="none"
          stroke={fgColor}
          strokeLinecap="round"
          strokeMiterlimit="1.12"
          strokeWidth="7.31"
        />
        <circle cx="42.75" cy="21.38" r="3.66" fill={fgColor} />
        <line
          x1="27.56"
          y1="50.06"
          x2="57.94"
          y2="50.06"
          fill="none"
          stroke="#c83b3b"
          strokeLinecap="round"
          strokeMiterlimit="1.12"
          strokeWidth="5.62"
        />
      </g>
    </svg>
  )
}
