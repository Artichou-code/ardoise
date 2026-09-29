import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { GAME_META, GAMES } from '../src/constants/games.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '../dist')
const baseHtmlPath = path.join(distDir, 'index.html')

const SITE_URL = 'https://ardoise.art-crea.fr'

export const SEO_PAGES = [
  {
    slug: 'caracole',
    gameId: GAMES.CARACOLE,
    title: 'Caracole : Règle Officielle (Sursis 100 pts) & Compteur de Points Gratuit — Ardoise',
    description:
      'Consultez la règle officielle du jeu de cartes Caracole (4 cartes cachées, règle du sursis pile à 100 ou 50 points) et comptez les points gratuitement sans pub avec Ardoise.',
    h1: 'Caracole — Règle Officielle du Jeu de Cartes & Compteur de Points',
  },
  {
    slug: 'dourak',
    gameId: GAMES.DOURAK,
    title: "Dourak (L'Idiot) : Règles du Jeu à 36 Cartes & Compteur de Manches — Ardoise",
    description:
      "Règles officielles du Dourak (l'idiot) à 36 cartes : attaque, défense, atout (Kozyr), défausse (Otboy) et compteur gratuit de défaites et cartes restantes sur Ardoise.",
    h1: "Dourak (L'Idiot) — Règles Officielles à 36 Cartes & Compteur de Parties",
  },
  {
    slug: 'skyjo',
    gameId: GAMES.SKYJO,
    title: 'Compteur de Points Skyjo en Ligne Gratuit & Règles Officielles — Ardoise',
    description:
      'Feuille de score et règles officielles du Skyjo : calcul automatique du malus de clôture (score doublé), seuil de 100 points et suivi des manches gratuit sans publicité.',
    h1: 'Skyjo — Compteur de Points Gratuit & Règles Officielles (Seuil 100 pts)',
  },
  {
    slug: 'belote',
    gameId: GAMES.BELOTE,
    title: 'Compteur de Points Belote & Coinche Gratuit (Contrats, Capot, Règles) — Ardoise',
    description:
      "Feuille de score Belote et Coinche en ligne gratuite et sans pub : calcul des 162 points, dix de der, Belote-Rebelote (+20), contrats de 80 à Capot (252) et Générale (500).",
    h1: 'Belote & Coinche — Feuille de Score Gratuite, Contrats & Règles Officielles',
  },
  {
    slug: 'tarot',
    gameId: GAMES.TAROT,
    title: 'Calculateur de Points Tarot (3, 4 et 5 Joueurs) & Règles Officielles — Ardoise',
    description:
      'Compteur automatique de points au Tarot à 3, 4 et 5 joueurs (appel au Roi) : calcul selon les Bouts (56, 51, 41, 36 pts), Petite, Garde, Garde Sans, Garde Contre et Petit au bout.',
    h1: 'Tarot (3, 4 et 5 Joueurs) — Calculateur de Points & Règles des Bouts et Contrats',
  },
  {
    slug: 'president',
    gameId: GAMES.PRESIDENT,
    title: 'Président (Trou du Cul) : Règles Officielles & Compteur de Points — Ardoise',
    description:
      'Règles officielles du jeu de cartes Président (Trou du cul) de 3 à 8 joueurs : ordre des cartes, échanges de début de manche et compteur de rôles (Président, Vice-Président, Trou).',
    h1: 'Président (Trou du Cul) — Règles Officielles, Hiérarchie des Cartes & Compteur',
  },
  {
    slug: '6-qui-prend',
    gameId: GAMES.SIX_QUI_PREND,
    title: '6 qui prend ! : Compteur de Têtes de Bœuf & Règles Officielles — Ardoise',
    description:
      'Comptez les têtes de bœuf au 6 qui prend ! gratuitement et sans publicité : barème des cartes (55 = 7 têtes, doublons = 5 têtes), règle de la 6e carte et seuil à 66 points.',
    h1: '6 qui prend ! — Compteur de Têtes de Bœuf (Seuil 66 pts) & Règles Officielles',
  },
  {
    slug: 'compteur-universel',
    gameId: GAMES.UNIVERSEL,
    title: 'Compteur de Points Universel pour Jeux de Société (Uno, Rami, Mölkky) — Ardoise',
    description:
      'Ardoise de score universelle gratuite et sans pub pour tous vos jeux de cartes et de société (Uno, Rami, Scrabble, Mölkky, Flip 7) de 2 à 12 joueurs.',
    h1: 'Compteur de Points Universel — Ardoise de Score Gratuite pour Tous vos Jeux',
  },
]

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderGameArticleHtml(meta, slug) {
  const { rules } = meta
  let sectionsHtml = ''

  if (rules?.sections) {
    sectionsHtml = rules.sections
      .map(
        (sec) => `
        <section>
          <h3>${escapeHtml(sec.title)}</h3>
          ${sec.content ? `<p>${escapeHtml(sec.content)}</p>` : ''}
          ${
            sec.items
              ? `<ul>${sec.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
              : ''
          }
        </section>`
      )
      .join('\n')
  } else if (rules) {
    sectionsHtml = `
      <section>
        <h3>Objectif du jeu</h3>
        <p>${escapeHtml(rules.objective)}</p>
      </section>
      <section>
        <h3>Déroulement d'une manche</h3>
        <p>${escapeHtml(rules.gameplay)}</p>
      </section>
      <section>
        <h3>Comptage des points</h3>
        <p>${escapeHtml(rules.scoring)}</p>
      </section>`
  }

  const tableHtml =
    rules?.summaryTable && rules.summaryTable.length > 0
      ? `
      <table>
        <caption>Mémo barème — ${escapeHtml(meta.name)}</caption>
        <thead>
          <tr><th>Élément</th><th>Valeur / Règle</th></tr>
        </thead>
        <tbody>
          ${rules.summaryTable
            .map(
              (row) =>
                `<tr><td>${escapeHtml(row.item)}</td><td>${escapeHtml(row.value)}</td></tr>`
            )
            .join('')}
        </tbody>
      </table>`
      : ''

  return `
    <article id="jeu-${escapeHtml(slug)}">
      <h2><a href="/jeux/${escapeHtml(slug)}">${escapeHtml(meta.name)} (${escapeHtml(meta.playersBadge)} · ${escapeHtml(meta.categoryBadge)})</a></h2>
      <p>${escapeHtml(meta.description)}</p>
      ${sectionsHtml}
      ${tableHtml}
    </article>`
}

function generateSeoFiles() {
  if (!fs.existsSync(baseHtmlPath)) {
    console.error('dist/index.html introuvable. Lancez vite build avant ce script.')
    process.exit(1)
  }

  const baseHtml = fs.readFileSync(baseHtmlPath, 'utf-8')

  // 1. Enrichir dist/index.html avec le catalogue complet pré-rendu des 8 jeux
  const allGamesArticles = SEO_PAGES.map((p) =>
    renderGameArticleHtml(GAME_META[p.gameId], p.slug)
  ).join('\n')

  const homeSemanticBlock = `<div id="root">
      <main style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;">
        <h1>Ardoise — Compteur de Scores et Règles Officielles de Jeux de Cartes et de Société</h1>
        <p>Application web gratuite, sans publicité et 100 % hors-ligne créée par ART-créa pour compter les points, consulter les règles officielles et partager vos feuilles de scores en direct entre amis.</p>
        ${allGamesArticles}
      </main>
    </div>`

  const enrichedHomeHtml = baseHtml.replace(
    /<div id="root">[\s\S]*?<\/div>/,
    homeSemanticBlock
  )
  fs.writeFileSync(baseHtmlPath, enrichedHomeHtml, 'utf-8')

  // 2. Générer une page HTML dédiée dans dist/jeux/<slug>/index.html pour chacun des 8 jeux
  for (const page of SEO_PAGES) {
    const meta = GAME_META[page.gameId]
    const pageUrl = `${SITE_URL}/jeux/${page.slug}`
    const gameArticle = renderGameArticleHtml(meta, page.slug)
    const otherLinks = SEO_PAGES.filter((p) => p.slug !== page.slug)
      .map(
        (p) =>
          `<li><a href="/jeux/${escapeHtml(p.slug)}">${escapeHtml(GAME_META[p.gameId].name)} — Règles &amp; Compteur</a></li>`
      )
      .join('\n')

    const pageSemanticBlock = `<div id="root">
      <main style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;">
        <h1>${escapeHtml(page.h1)}</h1>
        ${gameArticle}
        <nav aria-label="Autres jeux disponibles sur Ardoise">
          <h2>Autres compteurs de scores et règles sur Ardoise</h2>
          <ul>
            <li><a href="/">Accueil Ardoise — Tous les jeux</a></li>
            ${otherLinks}
          </ul>
        </nav>
      </main>
    </div>`

    let pageHtml = baseHtml
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(page.title)}</title>`)
      .replace(
        /<meta name="description" content="[^"]*" \/>/,
        `<meta name="description" content="${escapeHtml(page.description)}" />`
      )
      .replace(
        /<link rel="canonical" href="[^"]*" \/>/,
        `<link rel="canonical" href="${pageUrl}" />`
      )
      .replace(
        /<meta property="og:url" content="[^"]*" \/>/,
        `<meta property="og:url" content="${pageUrl}" />`
      )
      .replace(
        /<meta property="og:title" content="[^"]*" \/>/,
        `<meta property="og:title" content="${escapeHtml(page.title)}" />`
      )
      .replace(
        /<meta property="og:description" content="[^"]*" \/>/,
        `<meta property="og:description" content="${escapeHtml(page.description)}" />`
      )
      .replace(
        /<meta name="twitter:url" content="[^"]*" \/>/,
        `<meta name="twitter:url" content="${pageUrl}" />`
      )
      .replace(
        /<meta name="twitter:title" content="[^"]*" \/>/,
        `<meta name="twitter:title" content="${escapeHtml(page.title)}" />`
      )
      .replace(
        /<meta name="twitter:description" content="[^"]*" \/>/,
        `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`
      )
      .replace(/<div id="root">[\s\S]*?<\/div>/, pageSemanticBlock)

    const targetDir = path.join(distDir, 'jeux', page.slug)
    fs.mkdirSync(targetDir, { recursive: true })
    fs.writeFileSync(path.join(targetDir, 'index.html'), pageHtml, 'utf-8')
  }

  console.log(`✓ SEO/GEO : dist/index.html enrichi + ${SEO_PAGES.length} pages /jeux/<slug> pré-rendues.`)
}

generateSeoFiles()
