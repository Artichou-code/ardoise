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
    title: 'Caracole : Règles Officielles du Jeu de Cartes (8=0 pt, Sursis 100 pts) & Compteur — Ardoise',
    description:
      "Règles complètes du jeu de cartes Caracole (2 à 6 joueurs, 52 cartes) : poser combinaisons, piocher, valeur des cartes (le 8 vaut 0 pt), annonce Caracole (≤10 pts), pénalité de 30 pts et sursis pile à 100 pts.",
    h1: 'Caracole — Règles Officielles (52 Cartes, 8 = 0 pt) & Compteur de Points',
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
    slug: 'dame-de-pique',
    gameId: GAMES.DAME_DE_PIQUE,
    title: 'Dame de Pique : Compteur de Points en Ligne & Règles Officielles — Ardoise',
    description:
      'Compteur gratuit et sans pub pour la Dame de Pique : vérification des 26 points par manche, Cœurs (1 pt), Dame de Pique (13 pts), gestion automatique du Grand Chelem (+26 pts) et seuil à 100 points.',
    h1: 'Dame de Pique — Compteur de Points Gratuit, Grand Chelem & Règles Officielles',
  },
  {
    slug: 'flip-7',
    gameId: GAMES.FLIP_7,
    title: 'Flip 7 : Compteur de Points en Ligne & Règles du Jeu — Ardoise',
    description:
      'Feuille de score gratuite pour Flip 7 : suivi des manches vers les 200 points, gestion des éliminations (Bust) et bonus de manche Flip 7 (+15 pts).',
    h1: 'Flip 7 — Compteur de Points en Ligne Gratuit & Règles Officielles',
  },
  {
    slug: 'sea-salt-paper',
    gameId: GAMES.SEA_SALT_PAPER,
    title: 'Sea Salt & Paper : Feuille de Score en Ligne & Règles Complètes — Ardoise',
    description:
      'Compteur de points en ligne pour Sea Salt & Paper : seuils officiels (40 pts à 2j, 35 pts à 3j, 30 pts à 4j), résolution Stop et Dernière Chance, et victoire instantanée aux 4 Sirènes.',
    h1: 'Sea Salt & Paper — Compteur de Points en Ligne Gratuit & Règles Officielles',
  },
  {
    slug: 'ascenseur',
    gameId: GAMES.ASCENSEUR,
    title: "L'Ascenseur (Rikiki) : Grille de Score en Ligne & Règles du Jeu de Plis — Ardoise",
    description:
      "Feuille de score complète pour l'Ascenseur (Rikiki, Oh Hell) : calcul automatique selon le nombre de cartes en main, paris, plis réalisés, bonus de 10 points et contrôle de la règle du donneur.",
    h1: "L'Ascenseur (Rikiki) — Grille de Score en Ligne Gratuite & Règles des Paris",
  },
  {
    slug: 'rami',
    gameId: GAMES.RAMI,
    title: 'Compteur de Points Rami Gratuit & Règles Officielles — Ardoise',
    description:
      'Ardoise de score pour le Rami : calcul des pénalités de main (Figures 10, As 11, Joker 20), gestion du Rami Sec (pénalités x2) et seuil éliminatoire à 100, 250 ou 500 points.',
    h1: 'Rami — Compteur de Points Gratuit en Ligne, Rami Sec & Règles Officielles',
  },
  {
    slug: 'yaniv',
    gameId: GAMES.YANIV,
    title: 'Le Yaniv : Règles Officielles du Jeu de Cartes (≤ 5 pts, ASSAF !, Sursis 50/100) & Compteur — Ardoise',
    description:
      'Compteur de points en ligne pour le jeu de cartes Yaniv : calcul automatique des annonces (≤ 5 pts), contre ASSAF (+30 pts), règle du sursis à 50 et 100 points, et seuil éliminatoire.',
    h1: 'Le Yaniv — Règles Complètes, Contre ASSAF ! & Compteur de Points Gratuit',
  },
  {
    slug: 'le-barbu',
    gameId: GAMES.BARBU,
    title: 'Le Barbu (Le Tonton) : Règles des 7 Contrats & Feuille de Score en Ligne — Ardoise',
    description:
      'Compteur de points pour le jeu de cartes Le Barbu (Le Tonton) à 4 joueurs : Pas de plis, Pas de cœurs, Pas de dames, Le Barbu (-20 pts), 2 derniers plis, La salade (-130 pts) et Le domino (+65 pts).',
    h1: 'Le Barbu (Le Tonton) — Grille de Score Gratuite & Règles des 7 Contrats',
  },
  {
    slug: 'compteur-universel',
    gameId: GAMES.UNIVERSEL,
    title: 'Compteur de Points Universel pour Jeux de Société (Uno, Rami, Mölkky) — Ardoise',
    description:
      'Ardoise de score universelle gratuite et sans pub pour tous vos jeux de cartes et de société (Uno, Rami, Scrabble, Mölkky, Flip 7) de 2 à 12 joueurs.',
    h1: 'Compteur de Points Universel — Ardoise de Score Gratuite pour Tous vos Jeux',
  },
  {
    slug: 'uno',
    gameId: GAMES.UNO,
    title: 'Compteur de Points UNO en Ligne Gratuit & Règles Officielles — Ardoise',
    description:
      'Feuille de score et règles officielles du UNO : comptage des points des cartes restantes (Action 20 pts, Noires 50 pts), seuil officiel à 500 points ou règle maison par élimination.',
    h1: 'UNO — Compteur de Points Gratuit & Règles Officielles (Seuil 500 pts)',
  },
]

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Génère la carte visuelle d'un jeu exactement identique au rendu de HomeScreen.jsx
 * pour que le navigateur dessine le FCP et le LCP dès la réception du HTML + CSS (~0,9 s)
 * sans aucun décalage (CLS = 0) lors de l'hydratation par React.
 */
function renderVisualGameCard(meta) {
  return `
            <div class="relative flex flex-col justify-between p-4 rounded-xl school-card border-l-4 border-l-[#c83b3b]/80 shadow-2xs">
              <div>
                <div class="flex items-start justify-between gap-2">
                  <h3 class="font-serif-title font-bold text-lg leading-snug">${escapeHtml(meta.name)}</h3>
                  <span class="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/80 text-[11px] font-semibold text-stone-700 dark:text-slate-300 flex-shrink-0">
                    <span>Règles</span>
                  </span>
                </div>
                <p class="text-xs text-stone-500 dark:text-slate-400 mt-1 leading-relaxed">${escapeHtml(meta.description)}</p>
              </div>
              <div class="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-stone-100 dark:border-slate-800/70">
                <span class="text-[11px] font-semibold px-2 py-0.5 rounded bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300">${escapeHtml(meta.playersBadge)}</span>
                <span class="text-[11px] font-medium px-2 py-0.5 rounded border border-stone-200 dark:border-slate-700 text-stone-500 dark:text-slate-400">${escapeHtml(meta.categoryBadge)}</span>
                <span class="ml-auto text-xs font-bold text-[#c83b3b] flex items-center gap-0.5">Jouer ›</span>
              </div>
            </div>`
}

function renderGameArticleHtml(meta, slug) {
  const { rules } = meta
  let sectionsHtml = ''

  if (rules?.sections) {
    sectionsHtml = rules.sections
      .map((sec, idx) => {
        const cleanTitle = (sec.title || '').replace(/^\d+[\.\)]\s*/, '')
        return `
        <section>
          <h3>${idx + 1}. ${escapeHtml(cleanTitle)}</h3>
          ${sec.content ? `<p>${escapeHtml(sec.content)}</p>` : ''}
          ${
            sec.items
              ? `<ul>${sec.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
              : ''
          }
        </section>`
      })
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

function renderAppShellHtml(seoHiddenArticlesHtml) {
  const gameCardsHtml = Object.values(GAME_META).map(renderVisualGameCard).join('\n')

  return `<div id="root">
      <div class="flex flex-col h-full max-h-full overflow-hidden school-surface select-none">
        <header class="flex items-center justify-between px-4 header-safe pb-3 flex-shrink-0 border-b border-stone-200/90 dark:border-slate-800/90 bg-[#faf9f5]/90 dark:bg-[#151719]/90 backdrop-blur-xs">
          <div class="flex items-center gap-2.5">
            <button type="button" class="rounded-xl shrink-0" aria-label="Partager l'application Ardoise par QR code ou lien">
              <img src="/Ardoise_v2-white.svg" alt="Logo Ardoise" width="32" height="32" class="w-8 h-8 shadow-2xs flex-shrink-0 select-none block" />
            </button>
            <div>
              <h1 class="font-serif-title text-xl font-bold tracking-tight leading-none">Ardoise</h1>
              <p class="text-[11px] text-stone-500 dark:text-slate-400 leading-none mt-0.5">Carnet de scores &amp; règles</p>
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            <button type="button" class="p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors shrink-0" aria-label="Mode Ardoise (sombre)" title="Changer de thème">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-stone-700 dark:text-slate-200"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            </button>
            <button type="button" class="p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-700 dark:text-slate-300 transition-colors relative cursor-pointer shrink-0" aria-label="Ouvrir le menu principal" title="Menu principal">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </button>
          </div>
        </header>
        <main class="flex-1 overflow-y-auto scrollbar-hide px-4 pt-3 scroll-bottom-space">
          <section class="mt-4">
            <div class="flex items-center justify-between mb-2.5">
              <div class="flex items-center gap-2">
                <span class="w-1.5 h-3.5 rounded-full bg-[#c83b3b]"></span>
                <h2 class="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">Choisir un jeu</h2>
              </div>
              <span class="text-[11px] text-stone-400 dark:text-slate-500">${Object.keys(GAME_META).length} jeux disponibles</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              ${gameCardsHtml}
            </div>
          </section>
          <footer class="mt-4 pt-3 pb-1 border-t border-stone-200/50 dark:border-slate-800/50 flex items-center justify-center gap-2 text-center select-none">
            <div class="flex items-center gap-1.5 text-stone-600 dark:text-slate-400">
              <span class="font-serif-title font-bold text-stone-800 dark:text-slate-200 text-sm leading-none">Ardoise</span>
              <span class="font-serif italic text-stone-400 dark:text-slate-500 text-xs leading-none">by</span>
              <img src="/ART-crea.svg" alt="Logo ART-créa" width="35" height="20" class="h-[17px] w-auto object-contain inline-block align-middle select-none" />
            </div>
          </footer>
          <div class="sr-only">
            ${seoHiddenArticlesHtml}
          </div>
        </main>
      </div>
    </div>`
}

function generateSeoFiles() {
  if (!fs.existsSync(baseHtmlPath)) {
    console.error('dist/index.html introuvable. Lancez vite build avant ce script.')
    process.exit(1)
  }

  let baseHtml = fs.readFileSync(baseHtmlPath, 'utf-8')

  // Inliner le CSS principal dans <head> pour éliminer 100 % des requêtes bloquantes au rendu (FCP/LCP immédiat en 1 aller-retour)
  const cssMatch = baseHtml.match(/<link rel="stylesheet"[^>]*href="\/assets\/(index-[^"]+\.css)"[^>]*>/)
  if (cssMatch) {
    const cssFilePath = path.join(distDir, 'assets', cssMatch[1])
    if (fs.existsSync(cssFilePath)) {
      const cssContent = fs.readFileSync(cssFilePath, 'utf-8')
      baseHtml = baseHtml.replace(cssMatch[0], `<style>${cssContent}</style>`)
    }
  }

  // Action 2 : <link rel="modulepreload"> sur le chunk JS principal pour que le navigateur
  // le télécharge en parallèle du HTML (élimine la chaîne critique HTML → JS de ~240 ms).
  // Action 3 : fetchpriority="high" sur la balise <script> principale pour signaler sa priorité.
  const jsMatch = baseHtml.match(/<script type="module" crossorigin src="(\/assets\/index-[^"]+\.js)"><\/script>/)
  if (jsMatch) {
    const jsPath = jsMatch[1]
    // Inject modulepreload juste avant </head>
    baseHtml = baseHtml.replace(
      '</head>',
      `  <link rel="modulepreload" href="${jsPath}" />\n  </head>`
    )
    // Ajouter fetchpriority="high" sur la balise script
    baseHtml = baseHtml.replace(
      jsMatch[0],
      `<script type="module" crossorigin fetchpriority="high" src="${jsPath}"></script>`
    )
  }

  // 1. Enrichir dist/index.html avec l'App Shell visuel + le catalogue complet des jeux
  const allGamesArticles = SEO_PAGES.map((p) =>
    renderGameArticleHtml(GAME_META[p.gameId], p.slug)
  ).join('\n')

  const enrichedHomeHtml = baseHtml.replace(
    /<div id="root">[\s\S]*?<\/div>/,
    renderAppShellHtml(allGamesArticles)
  )
  fs.writeFileSync(baseHtmlPath, enrichedHomeHtml, 'utf-8')

  // 2. Générer une page HTML dédiée dans dist/jeux/<slug>/index.html pour chacun des jeux
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

    const seoSection = `
      <h2>${escapeHtml(page.h1)}</h2>
      ${gameArticle}
      <nav aria-label="Autres jeux disponibles sur Ardoise">
        <ul>
          <li><a href="/">Accueil Ardoise — Tous les jeux</a></li>
          ${otherLinks}
        </ul>
      </nav>`

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
      .replace(/<div id="root">[\s\S]*?<\/div>/, renderAppShellHtml(seoSection))

    const targetDir = path.join(distDir, 'jeux', page.slug)
    fs.mkdirSync(targetDir, { recursive: true })
    fs.writeFileSync(path.join(targetDir, 'index.html'), pageHtml, 'utf-8')
  }

  console.log(`✓ SEO/GEO + App Shell : dist/index.html enrichi + ${SEO_PAGES.length} pages /jeux/<slug> pré-rendues.`)
}

generateSeoFiles()
