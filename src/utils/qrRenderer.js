import QRCode from 'qrcode'

export const DEFAULT_QR_SETTINGS = {
  fg_color: '#000000',
  bg_color: '#ffffff',
  style: 'pixel',
  ecc: 'M',
  logo_data: null,
}

/**
 * Détecte si une couleur est claire pour adapter le contraste
 */
export function isColorLight(hexColor) {
  if (!hexColor || hexColor === 'transparent') return false
  const hex = hexColor.replace('#', '').trim()
  if (hex.length !== 3 && hex.length !== 6) return false
  const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.slice(0, 2), 16)
  const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.slice(2, 4), 16)
  const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.slice(4, 6), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return false
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 180
}

/**
 * Assainit et valide les paramètres de style reçus
 */
export function sanitizeQrSettings(raw) {
  if (!raw || typeof raw !== 'object') return DEFAULT_QR_SETTINGS
  const hexColorRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/
  const validStyles = ['pixel', 'dots', 'rounded', 'square']
  const validEccs = ['L', 'M', 'Q', 'H']

  const fg_color = (typeof raw.fg_color === 'string' && hexColorRegex.test(raw.fg_color))
    ? raw.fg_color
    : DEFAULT_QR_SETTINGS.fg_color

  const bg_color = (raw.bg_color === 'transparent' || (typeof raw.bg_color === 'string' && hexColorRegex.test(raw.bg_color)))
    ? raw.bg_color
    : DEFAULT_QR_SETTINGS.bg_color

  const style = (typeof raw.style === 'string' && validStyles.includes(raw.style))
    ? raw.style
    : DEFAULT_QR_SETTINGS.style

  const ecc = (typeof raw.ecc === 'string' && validEccs.includes(raw.ecc))
    ? raw.ecc
    : DEFAULT_QR_SETTINGS.ecc

  let logo_data = null
  if (typeof raw.logo_data === 'string' && raw.logo_data.startsWith('data:image/')) {
    logo_data = raw.logo_data
  }

  return { fg_color, bg_color, style, ecc, logo_data }
}

/**
 * Génère la matrice de modules booléens selon la norme ISO/IEC 18004
 */
export function generateQrMatrix(text, eccLevel = 'M', hasLogo = false) {
  try {
    if (!text || typeof text !== 'string' || text.trim() === '') return []
    const effectiveEcc = hasLogo ? 'H' : (eccLevel || 'M')
    const qr = QRCode.create(text, { errorCorrectionLevel: effectiveEcc })
    const size = qr.modules.size
    const data = qr.modules.data
    const matrix = []
    for (let r = 0; r < size; r++) {
      const row = []
      for (let c = 0; c < size; c++) {
        row.push(data[r * size + c] === 1)
      }
      matrix.push(row)
    }
    return matrix
  } catch (err) {
    console.error('Erreur génération matrice QR:', err)
    return []
  }
}

/**
 * Rendu SVG vectoriel dynamique (pixel art, dots, rounded, square)
 * avec quiet-zone protégée pour le logo central.
 */
export function renderQrSvg(matrix, settings = DEFAULT_QR_SETTINGS, options = {}) {
  if (!matrix || matrix.length === 0) return ''

  const { size = 200, margin = 2 } = options
  const { fg_color = '#000000', bg_color = '#ffffff', style = 'pixel', logo_data } = settings
  const matrixSize = matrix.length
  const viewBoxSize = matrixSize + margin * 2

  const hasLogo = Boolean(logo_data && typeof logo_data === 'string' && logo_data.trim() !== '')
  let logoModules = 0
  let startC = 0, endC = 0, startR = 0, endR = 0

  if (hasLogo) {
    logoModules = Math.max(5, Math.floor(matrixSize * 0.26))
    const center = matrixSize / 2
    startC = Math.floor(center - logoModules / 2)
    endC = startC + logoModules
    startR = Math.floor(center - logoModules / 2)
    endR = startR + logoModules
  }

  let pathD = ''

  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (hasLogo && r >= startR && r < endR && c >= startC && c < endC) {
        continue
      }

      if (matrix[r][c]) {
        const x = c + margin
        const y = r + margin

        if (style === 'dots') {
          const cx = x + 0.5
          const cy = y + 0.5
          pathD += `M${cx},${cy - 0.42}a0.42,0.42 0 1,0 0.001,0Z `
        } else if (style === 'pixel') {
          // Pixel Art rétro gaming 8-bit avec finders solides nets
          const isFinder = (r < 7 && c < 7) || (r < 7 && c >= matrixSize - 7) || (r >= matrixSize - 7 && c < 7)
          if (isFinder) {
            pathD += `M${x},${y}h1v1h-1Z `
          } else {
            const px = +(x + 0.09).toFixed(2)
            const py = +(y + 0.09).toFixed(2)
            pathD += `M${px},${py}h0.82v0.82h-0.82Z `
          }
        } else if (style === 'rounded') {
          const px = +(x + 0.05).toFixed(2)
          const py = +(y + 0.05).toFixed(2)
          pathD += `M${px + 0.32},${py}h0.26a0.32,0.32 0 0 1 0.32,0.32v0.26a0.32,0.32 0 0 1 -0.32,0.32h-0.26a0.32,0.32 0 0 1 -0.32,-0.32v-0.26a0.32,0.32 0 0 1 0.32,-0.32Z `
        } else {
          pathD += `M${x},${y}h1v1h-1Z `
        }
      }
    }
  }

  const bgRect = bg_color && bg_color !== 'transparent'
    ? `<rect width="${viewBoxSize}" height="${viewBoxSize}" fill="${bg_color}" />`
    : ''

  let logoSvg = ''
  if (hasLogo && logo_data) {
    const bgX = startC + margin
    const bgY = startR + margin
    const bgW = logoModules
    const bgH = logoModules

    const innerPadding = 0.35
    const imgX = bgX + innerPadding
    const imgY = bgY + innerPadding
    const imgW = Math.max(0.1, logoModules - innerPadding * 2)
    const imgH = Math.max(0.1, logoModules - innerPadding * 2)

    const customBgRect = bg_color && bg_color !== 'transparent'
      ? `<rect x="${bgX}" y="${bgY}" width="${bgW}" height="${bgH}" fill="${bg_color}" />`
      : ''

    logoSvg = `
      ${customBgRect}
      <image href="${logo_data}" x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}" preserveAspectRatio="xMidYMid meet" />
    `
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" width="${size}" height="${size}" shape-rendering="geometricPrecision">
  ${bgRect}
  <path d="${pathD.trim()}" fill="${fg_color}" />
  ${logoSvg}
</svg>`
}
