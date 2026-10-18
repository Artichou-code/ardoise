import { useState, useEffect, useMemo } from 'react'
import { generateQrMatrix, renderQrSvg, sanitizeQrSettings, DEFAULT_QR_SETTINGS } from '../../utils/qrRenderer'

const LOCAL_STORAGE_KEY_PREFIX = 'ardoise_dynamic_qr_'

/**
 * Initialise les réglages depuis le cache localStorage (PWA Offline-First)
 */
function getCachedData(qrId, fallbackUrl) {
  if (typeof window === 'undefined') {
    return { shortUrl: fallbackUrl, qrSettings: DEFAULT_QR_SETTINGS }
  }
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${qrId}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        shortUrl: parsed.shortUrl || fallbackUrl,
        qrSettings: sanitizeQrSettings(parsed.qrSettings),
      }
    }
  } catch {
    // Échec de lecture silencieux
  }
  return { shortUrl: fallbackUrl, qrSettings: DEFAULT_QR_SETTINGS }
}

export function DynamicQrCode({
  qrId = 'Wamz',
  fallbackUrl = 'https://link.art-crea.fr/go/Wamz',
  size = 190,
  className = '',
  onTap = undefined,
}) {
  const [data, setData] = useState(() => getCachedData(qrId, fallbackUrl))

  // Synchronisation dynamique avec LINK Worker
  useEffect(() => {
    let isMounted = true

    async function syncWithLink() {
      try {
        const res = await fetch(`https://link.art-crea.fr/api/public/qr/${qrId}`, {
          cache: 'no-cache',
        })
        if (!res.ok) return
        const json = await res.json()
        if (json.success && json.link && isMounted) {
          const freshShortUrl = json.link.shortUrl || fallbackUrl
          const freshQrSettings = sanitizeQrSettings(json.link.qrSettings)

          setData((prev) => {
            const hasChanged =
              prev.shortUrl !== freshShortUrl ||
              JSON.stringify(prev.qrSettings) !== JSON.stringify(freshQrSettings)

            if (hasChanged) {
              try {
                localStorage.setItem(
                  `${LOCAL_STORAGE_KEY_PREFIX}${qrId}`,
                  JSON.stringify({ shortUrl: freshShortUrl, qrSettings: freshQrSettings })
                )
              } catch {
                // Quota localStorage dépassé ou indisponible
              }
              return { shortUrl: freshShortUrl, qrSettings: freshQrSettings }
            }
            return prev
          })
        }
      } catch {
        // En mode hors-ligne, on conserve la version du cache sans lever d'erreur
      }
    }

    syncWithLink()

    return () => {
      isMounted = false
    }
  }, [qrId, fallbackUrl])

  // Génération de la matrice et du SVG vectoriel mémoïsée
  const svgContent = useMemo(() => {
    const hasLogo = Boolean(data.qrSettings?.logo_data)
    const matrix = generateQrMatrix(data.shortUrl, data.qrSettings?.ecc || 'M', hasLogo)
    return renderQrSvg(matrix, data.qrSettings, { size, margin: 2 })
  }, [data.shortUrl, data.qrSettings, size])

  return (
    <div
      onClick={onTap}
      className={`inline-block select-none cursor-pointer ${className}`}
      title="QR code"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  )
}
