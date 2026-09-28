/**
 * Utilitaire de respect strict des règles typographiques françaises :
 * - Empêche tout signe de ponctuation (!, ?, :, ;, %, €, ») d'être rejeté seul à la ligne.
 * - Remplace systématiquement les espaces sécables par des espaces insécables (\u00A0).
 * - Empêche les orphelines (mots ou symboles isolés en bout de paragraphe).
 */

const NBSP = '\u00A0'

export function formatTypography(text) {
  if (!text || typeof text !== 'string') return text

  return text
    // Espace insécable devant les ponctuations doubles et symboles
    .replace(/\s+([!?:;%€»])/g, `${NBSP}$1`)
    // Espace insécable après les guillemets ouvrants
    .replace(/([«])\s+/g, `$1${NBSP}`)
    // Évite qu'une ponctuation collée à un espace ne saute seule
    .replace(/\s+(\.)/g, `$1`)
}

export function preventOrphanPunctuation(str) {
  return formatTypography(str)
}
