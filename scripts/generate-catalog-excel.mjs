import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as XLSX from 'xlsx'
import { GAME_META, GAMES } from '../src/constants/games.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const publicDir = path.join(rootDir, 'public')
const distDir = path.join(rootDir, 'dist')

const SITE_URL = 'https://ardoise.art-crea.fr'

const SLUG_BY_GAME_ID = {
  [GAMES.CARACOLE]: 'caracole',
  [GAMES.DOURAK]: 'dourak',
  [GAMES.SKYJO]: 'skyjo',
  [GAMES.BELOTE]: 'belote',
  [GAMES.TAROT]: 'tarot',
  [GAMES.PRESIDENT]: 'president',
  [GAMES.SIX_QUI_PREND]: '6-qui-prend',
  [GAMES.DAME_DE_PIQUE]: 'dame-de-pique',
  [GAMES.FLIP_7]: 'flip-7',
  [GAMES.SEA_SALT_PAPER]: 'sea-salt-paper',
  [GAMES.ASCENSEUR]: 'ascenseur',
  [GAMES.RAMI]: 'rami',
  [GAMES.YANIV]: 'yaniv',
  [GAMES.BARBU]: 'le-barbu',
  [GAMES.UNIVERSEL]: 'compteur-universel',
  [GAMES.UNO]: 'uno',
  [GAMES.SYMBIOSE]: 'symbiose',
}

// Ordre d'affichage des jeux dans le catalogue
const GAME_ORDER = [
  GAMES.UNO,
  GAMES.CARACOLE,
  GAMES.DOURAK,
  GAMES.SKYJO,
  GAMES.BELOTE,
  GAMES.TAROT,
  GAMES.PRESIDENT,
  GAMES.SIX_QUI_PREND,
  GAMES.DAME_DE_PIQUE,
  GAMES.FLIP_7,
  GAMES.SEA_SALT_PAPER,
  GAMES.ASCENSEUR,
  GAMES.RAMI,
  GAMES.YANIV,
  GAMES.BARBU,
  GAMES.SYMBIOSE,
  GAMES.UNIVERSEL,
]

export function generateCatalogExcel() {
  const rows = []
  let index = 1

  for (const gameId of GAME_ORDER) {
    const meta = GAME_META[gameId]
    if (!meta) continue
    const slug = SLUG_BY_GAME_ID[gameId] || gameId

    rows.push({
      'N°': index++,
      Nom: meta.name,
      'Description courte': meta.description,
      'URL dédiée': `${SITE_URL}/jeux/${slug}`,
      Matériel: meta.categoryBadge || '',
      'Joueurs min': meta.minPlayers || 2,
      'Joueurs max': meta.maxPlayers || 8,
      Slug: slug,
    })
  }

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows, {
    header: ['N°', 'Nom', 'Description courte', 'URL dédiée', 'Matériel', 'Joueurs min', 'Joueurs max', 'Slug'],
  })

  // Largeurs optimisées des colonnes pour lecture directe dans Excel
  ws['!cols'] = [
    { wch: 6 },  // N°
    { wch: 24 }, // Nom
    { wch: 85 }, // Description courte
    { wch: 45 }, // URL dédiée
    { wch: 18 }, // Matériel
    { wch: 13 }, // Joueurs min
    { wch: 13 }, // Joueurs max
    { wch: 20 }, // Slug
  ]

  // Filtre automatique Excel sur la ligne d'en-tête (colonnes A à H)
  ws['!autofilter'] = { ref: `A1:H${rows.length + 1}` }

  XLSX.utils.book_append_sheet(wb, ws, 'Catalogue Jeux Ardoise')

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
  }

  const publicExcelPath = path.join(publicDir, 'games-catalog.xlsx')

  const writeSafe = (filePath, label) => {
    try {
      XLSX.writeFile(wb, filePath)
      console.log(`✓ Catalogue Excel synchronisé : ${filePath} (${rows.length} jeux)`)
    } catch (err) {
      if (err.code === 'EBUSY') {
        console.warn(`⚠️ [EBUSY] Le fichier ${label} est actuellement ouvert dans un programme (ex: Excel). Écriture temporairement ignorée sans bloquer le build.`)
      } else {
        throw err
      }
    }
  }

  writeSafe(publicExcelPath, 'public/games-catalog.xlsx')

  // Si le dossier dist existe (pendant le build), synchroniser également
  if (fs.existsSync(distDir)) {
    const distExcelPath = path.join(distDir, 'games-catalog.xlsx')
    writeSafe(distExcelPath, 'dist/games-catalog.xlsx')
  }

  return { rowsCount: rows.length, publicExcelPath }
}

// Exécution directe si appelé via CLI (node scripts/generate-catalog-excel.mjs)
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  generateCatalogExcel()
}
