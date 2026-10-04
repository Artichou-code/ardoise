import { GAME_META, GAMES } from '../constants/games'
import { getRanking, computePlayDuration } from './gameUtils'

/**
 * Normalise un nom de joueur pour regrouper les statistiques de façon fiable
 */
export function normalizePlayerName(name) {
  if (!name) return ''
  return name.trim().toLowerCase()
}

/**
 * Détermine la direction du score d'une partie ('low' ou 'high')
 */
export function getGameScoreDirection(game) {
  const meta = GAME_META[game?.type]
  return (
    game?.config?.scoreDir === 'low' ||
    game?.config?.scoreDir === 'low_limit' ||
    meta?.scoreDir === 'low'
      ? 'low'
      : 'high'
  )
}

/**
 * Calcule l'ensemble des statistiques de jeu et de classement
 * @param {Array} games - Liste des parties
 * @param {string} selectedGameType - 'all' ou identifiant de jeu spécifique (ex: 'dourak')
 * @param {Array} registeredPlayers - Liste des joueurs enregistrés dans l'application
 * @returns {Object} Statistiques agrégées
 */
export function computeStats(games = [], selectedGameType = 'all', registeredPlayers = []) {
  const safeGames = Array.isArray(games) ? games.filter(g => g && typeof g === 'object') : []
  const safeRegisteredPlayers = Array.isArray(registeredPlayers) ? registeredPlayers.filter(p => p && typeof p === 'object' && p.name) : []

  const allFilteredGames = selectedGameType === 'all'
    ? safeGames
    : safeGames.filter(g => g && g.type === selectedGameType)

  const finishedGames = allFilteredGames.filter(g => g && g.status === 'finished')
  const activeGames = allFilteredGames.filter(g => g && g.status !== 'finished')

  // 1. Indicateurs Globaux (KPIs)
  const totalGamesCount = allFilteredGames.length
  const finishedGamesCount = finishedGames.length
  const activeGamesCount = activeGames.length

  let totalRounds = 0
  let totalPlayTimeMs = 0
  const gameTypeCounts = {}

  allFilteredGames.forEach(game => {
    if (!game) return
    totalRounds += game.rounds?.length || 0

    const duration = computePlayDuration(game)
    totalPlayTimeMs += duration

    const gType = game.type || 'universel'
    if (!gameTypeCounts[gType]) {
      gameTypeCounts[gType] = { count: 0, finished: 0, durationMs: 0 }
    }
    gameTypeCounts[gType].count += 1
    if (game.status === 'finished') {
      gameTypeCounts[gType].finished += 1
    }
    gameTypeCounts[gType].durationMs += duration
  })

  // Jeu favori (le plus joué)
  let favoriteGame = null
  let maxGameCount = 0
  Object.entries(gameTypeCounts).forEach(([type, data]) => {
    if (data.count > maxGameCount) {
      maxGameCount = data.count
      favoriteGame = {
        type,
        name: GAME_META[type]?.name || type,
        count: data.count,
        percent: totalGamesCount > 0 ? Math.round((data.count / totalGamesCount) * 100) : 0,
      }
    }
  })

  // Répartition par jeu (pour le graphique CSS)
  const gamesDistribution = Object.entries(GAME_META).map(([type, meta]) => {
    const data = gameTypeCounts[type] || { count: 0, finished: 0, durationMs: 0 }
    return {
      type,
      name: meta.name,
      categoryBadge: meta.categoryBadge,
      playersBadge: meta.playersBadge,
      count: data.count,
      finished: data.finished,
      durationMs: data.durationMs,
      percent: totalGamesCount > 0 ? Math.round((data.count / totalGamesCount) * 100) : 0,
    }
  }).sort((a, b) => b.count - a.count)

  // 2. Statistiques par Joueur
  // On crée une table d'association basée sur l'identifiant du joueur (avec fallback rétrocompatible)
  const playerStatsMap = new Map()

  // Initialiser avec les joueurs enregistrés pour conserver leurs préférences d'avatar/couleur
  safeRegisteredPlayers.forEach(p => {
    if (!p) return
    const key = p.id || normalizePlayerName(p.name)
    if (!key) return
    playerStatsMap.set(key, {
      id: p.id,
      name: p.name,
      color: p.color,
      avatar: p.avatar,
      registered: !p.archived,
      archived: Boolean(p.archived),
      totalGames: 0,
      finishedGames: 0,
      activeGames: 0,
      wins: 0,
      podiums: 0,
      dourakLosses: 0,
      gameBreakdown: {}, // type -> { played, wins }
      opponents: {}, // oppKey -> { id, name, count, winsAgainst }
      recentHistory: [], // { gameId, gameType, rank, isWinner, date }
    })
  })

  // Traiter toutes les parties filtrées
  allFilteredGames.forEach(game => {
    if (!game) return
    const isFinished = game.status === 'finished'
    const scoreDir = getGameScoreDirection(game)
    const ranking = getRanking(game.scores || {}, scoreDir, game) || []
    const gamePlayers = Array.isArray(game.players) ? game.players.filter(Boolean) : []

    // Identifier le gagnant et le dernier
    let winnerId = game.winner || null
    if (!winnerId && ranking.length > 0) {
      winnerId = ranking[0].id
    }
    const lastRankEntry = ranking.length > 0 ? ranking[ranking.length - 1] : null

    gamePlayers.forEach(player => {
      if (!player) return
      const pName = typeof player === 'string' ? player : player.name
      const pId = typeof player === 'object' && player.id ? player.id : null

      // Clé d'association : ID strict en priorité
      let key = pId
      if (!key && pName) {
        // Fallback pour les parties anciennes sans ID : associer par nom si existant
        const matched = safeRegisteredPlayers.find(rp => normalizePlayerName(rp.name) === normalizePlayerName(pName))
        key = matched ? matched.id : `legacy_${normalizePlayerName(pName)}`
      }
      if (!key) return

      let stat = playerStatsMap.get(key)
      if (!stat) {
        stat = {
          id: pId || key,
          name: pName,
          color: player.color,
          avatar: player.avatar,
          registered: false,
          archived: false,
          totalGames: 0,
          finishedGames: 0,
          activeGames: 0,
          wins: 0,
          podiums: 0,
          dourakLosses: 0,
          gameBreakdown: {},
          opponents: {},
          recentHistory: [],
        }
        playerStatsMap.set(key, stat)
      } else {
        // Mettre à jour avec l'avatar/couleur la plus récente si manquante
        if (!stat.avatar && player.avatar) stat.avatar = player.avatar
        if (!stat.color && player.color) stat.color = player.color
      }

      const gType = game.type || 'universel'
      stat.totalGames += 1

      if (!stat.gameBreakdown[gType]) {
        stat.gameBreakdown[gType] = { played: 0, wins: 0 }
      }
      stat.gameBreakdown[gType].played += 1

      if (isFinished) {
        stat.finishedGames += 1

        const rankEntry = ranking.find(r => (pId && r.id === pId) || r.id === key || r.id === pName)
        const rank = rankEntry ? rankEntry.rank : ranking.length

        const isWinner = (pId && winnerId === pId) || player.id === winnerId || pName === winnerId || rank === 1
        const isPodium = rank <= 3 && ranking.length >= 2
        const isDourakLoser = gType === GAMES.DOURAK && rankEntry && rankEntry.id === lastRankEntry?.id

        if (isWinner) {
          stat.wins += 1
          stat.gameBreakdown[gType].wins += 1
        }
        if (isPodium) {
          stat.podiums += 1
        }
        if (isDourakLoser) {
          stat.dourakLosses += 1
        }

        // Adversaires rencontrés
        gamePlayers.forEach(opp => {
          if (!opp) return
          const oppName = typeof opp === 'string' ? opp : opp.name
          const oppId = typeof opp === 'object' && opp.id ? opp.id : null
          const oppKey = oppId || (oppName ? `legacy_${normalizePlayerName(oppName)}` : null)
          if (!oppKey || oppKey === key) return

          if (!stat.opponents[oppKey]) {
            stat.opponents[oppKey] = { id: oppId, name: oppName, count: 0, winsAgainst: 0 }
          }
          stat.opponents[oppKey].count += 1
          if (isWinner) {
            stat.opponents[oppKey].winsAgainst += 1
          }
        })

        // Historique récent
        stat.recentHistory.push({
          gameId: game.id,
          gameType: gType,
          gameName: GAME_META[gType]?.name || gType,
          rank,
          totalPlayers: ranking.length,
          isWinner,
          date: game.finishedAt || game.updatedAt || game.startedAt,
        })
      } else {
        stat.activeGames += 1
      }
    })
  })

  // Conversion en tableau et calcul des ratios
  const playersStats = Array.from(playerStatsMap.values())
    .filter(p => p.totalGames > 0) // Ne garder que les joueurs ayant disputé au moins une partie
    .map(p => {
      const winRate = p.finishedGames > 0 ? Math.round((p.wins / p.finishedGames) * 100) : 0
      const podiumRate = p.finishedGames > 0 ? Math.round((p.podiums / p.finishedGames) * 100) : 0

      // Tri de l'historique récent par date décroissante
      const sortedHistory = [...p.recentHistory].sort((a, b) => (b.date || 0) - (a.date || 0))

      // Adversaire le plus fréquent
      const topOpponent = Object.values(p.opponents).sort((a, b) => b.count - a.count)[0] || null

      return {
        ...p,
        winRate,
        podiumRate,
        recentHistory: sortedHistory,
        topOpponent,
      }
    })

  // 3. Calcul des Titres et Distinctions
  let bestStrategist = null
  let maxWinRate = -1
  let mostActive = null
  let maxTotalGames = 0
  let grandDourak = null
  let maxDourakLosses = 0
  let podiumKing = null
  let maxPodiums = 0

  // Seuil pour le titre de meilleur stratège (au moins 2 parties terminées, ou 1 si aucune n'a >= 2)
  const minGamesThreshold = playersStats.some(p => p.finishedGames >= 2) ? 2 : 1

  playersStats.forEach(p => {
    // Meilleur stratège
    if (p.finishedGames >= minGamesThreshold) {
      if (p.winRate > maxWinRate || (p.winRate === maxWinRate && p.wins > (bestStrategist?.wins || 0))) {
        maxWinRate = p.winRate
        bestStrategist = p
      }
    }

    // Le plus actif
    if (p.totalGames > maxTotalGames) {
      maxTotalGames = p.totalGames
      mostActive = p
    }

    // Grand Dourak (au moins 1 défaite)
    if (p.dourakLosses > maxDourakLosses) {
      maxDourakLosses = p.dourakLosses
      grandDourak = p
    }

    // Roi du podium
    if (p.podiums > maxPodiums) {
      maxPodiums = p.podiums
      podiumKing = p
    }
  })

  // Leaders thématiques par jeu
  const gameWinners = {
    [GAMES.PRESIDENT]: {
      player: null,
      wins: 0,
      title: 'Président éternel',
      desc: 'Expert du Trou du cul',
      explanation: 'Attribué au joueur ayant terminé le plus souvent au rang suprême de Président au Trou du cul.',
      iconName: 'UserCheck',
    },
    [GAMES.CARACOLE]: {
      player: null,
      wins: 0,
      title: 'As du Sursis',
      desc: 'Maître de la Caracole',
      explanation: 'Attribué au joueur qui cumule le plus de victoires avec le score le plus faible à la Caracole.',
      iconName: 'Hourglass',
    },
    [GAMES.SKYJO]: {
      player: null,
      wins: 0,
      title: 'Zéro faute',
      desc: 'Score minimal au Skyjo',
      explanation: 'Attribué au joueur ayant dominé la grille de 12 cartes avec le plus de victoires au Skyjo.',
      iconName: 'Target',
    },
    [GAMES.BELOTE]: {
      player: null,
      wins: 0,
      title: 'Grand Preneur',
      desc: 'Champion de Belote',
      explanation: 'Attribué au joueur/équipe ayant mené son camp au plus grand nombre de victoires à la Belote / Coinche.',
      iconName: 'Layers',
    },
    [GAMES.TAROT]: {
      player: null,
      wins: 0,
      title: 'Maître du Bout',
      desc: 'As du Tarot',
      explanation: 'Attribué au joueur ayant réussi le plus grand nombre de victoires en attaque au Tarot.',
      iconName: 'Wand2',
    },
    [GAMES.SIX_QUI_PREND]: {
      player: null,
      wins: 0,
      title: 'Dompteur de taureaux',
      desc: 'Évite les bœufs',
      explanation: 'Attribué au joueur ayant esquivé les pénalités et remporté le plus de victoires à 6 qui prend.',
      iconName: 'Skull',
    },
    [GAMES.DAME_DE_PIQUE]: {
      player: null,
      wins: 0,
      title: 'Épargneur de Cœurs',
      desc: 'Évite la Dame de Pique',
      explanation: 'Attribué au joueur ayant cumulé le plus de victoires à la Dame de Pique.',
      iconName: 'HeartCrack',
    },
    [GAMES.FLIP_7]: {
      player: null,
      wins: 0,
      title: 'Série Magique',
      desc: 'Maître du Flip 7',
      explanation: 'Attribué au joueur ayant franchi le plus de fois les 200 points à Flip 7.',
      iconName: 'Zap',
    },
    [GAMES.SEA_SALT_PAPER]: {
      player: null,
      wins: 0,
      title: 'Seigneur des Mers',
      desc: 'As de Sea Salt & Paper',
      explanation: 'Attribué au joueur ayant remporté le plus de parties à Sea Salt & Paper.',
      iconName: 'Anchor',
    },
    [GAMES.ASCENSEUR]: {
      player: null,
      wins: 0,
      title: 'Oracle des Plis',
      desc: 'Expert de l’Ascenseur',
      explanation: 'Attribué au joueur ayant prédit ses plis avec la plus grande précision à l’Ascenseur.',
      iconName: 'Eye',
    },
    [GAMES.RAMI]: {
      player: null,
      wins: 0,
      title: 'Grand Défausseur',
      desc: 'As du Rami',
      explanation: 'Attribué au joueur ayant totalisé le plus de victoires au Rami.',
      iconName: 'CheckCircle2',
    },
    [GAMES.DOURAK]: {
      player: null,
      wins: 0,
      title: 'Insubmersible',
      desc: 'Maître du Dourak',
      explanation: 'Attribué au joueur ayant remporté le plus grand nombre de victoires au Dourak en esquivant toutes les attaques.',
      iconName: 'ShieldCheck',
    },
    [GAMES.YANIV]: {
      player: null,
      wins: 0,
      title: 'Invocateur d’Asaf',
      desc: 'As du Yaniv',
      explanation: 'Attribué au joueur ayant cumulé le plus de victoires à Yaniv et réussi ses annonces à 5 points.',
      iconName: 'Swords',
    },
    [GAMES.BARBU]: {
      player: null,
      wins: 0,
      title: 'Barbe d’Or',
      desc: 'Maître du Barbu',
      explanation: 'Attribué au joueur ayant remporté le plus de parties de Barbu à travers les 7 contrats.',
      iconName: 'Mustache',
    },
    [GAMES.UNO]: {
      player: null,
      wins: 0,
      title: 'Roi du UNO',
      desc: 'As du UNO',
      explanation: 'Attribué au joueur ayant cumulé le plus de victoires au UNO et terrassé ses adversaires avec les cartes Action.',
      iconName: 'Flame',
    },
    [GAMES.UNIVERSEL]: {
      player: null,
      wins: 0,
      title: 'Touche-à-tout',
      desc: 'Champion Universel',
      explanation: 'Attribué au joueur ayant remporté le plus de victoires sur les compteurs et jeux personnalisés.',
      iconName: 'Dices',
    },
  }

  playersStats.forEach(p => {
    Object.entries(gameWinners).forEach(([type, info]) => {
      const gWins = p.gameBreakdown[type]?.wins || 0
      if (gWins > info.wins && gWins >= 1) {
        info.wins = gWins
        info.player = p
      }
    })
  })

  // Titres pour chaque joueur
  playersStats.forEach(p => {
    p.badges = []

    // Invincible (100% de victoires sur au moins 3 parties)
    if (p.winRate === 100 && p.finishedGames >= 3) {
      p.badges.push({
        id: 'invincible',
        title: 'Invincible',
        desc: `${p.finishedGames} victoires d'affilée`,
        explanation: 'Attribué pour avoir réalisé un sans-faute absolu (100% de victoires sur au moins 3 parties terminées).',
        type: 'gold',
        iconName: 'Crown',
      })
    }

    if (bestStrategist && (p.id ? p.id === bestStrategist.id : p.name === bestStrategist.name) && maxWinRate > 0) {
      p.badges.push({
        id: 'strategist',
        title: 'Meilleur stratège',
        desc: `${p.winRate}% de victoires`,
        explanation: 'Attribué au joueur possédant le plus haut pourcentage de victoires de la table (minimum 2 parties disputées).',
        type: 'gold',
        iconName: 'Brain',
      })
    }

    if (grandDourak && (p.id ? p.id === grandDourak.id : p.name === grandDourak.name) && maxDourakLosses > 0) {
      p.badges.push({
        id: 'dourak',
        title: 'Grand Dourak',
        desc: `${p.dourakLosses} revers`,
        explanation: "Attribué au joueur ayant terminé le plus souvent dans le rôle de l'idiot (le dernier joueur conservant des cartes en main).",
        type: 'red',
        iconName: 'Frown',
      })
    }

    if (mostActive && (p.id ? p.id === mostActive.id : p.name === mostActive.name) && maxTotalGames >= 3) {
      p.badges.push({
        id: 'active',
        title: 'Fidèle au poste',
        desc: `${p.totalGames} parties jouées`,
        explanation: 'Attribué au joueur le plus assidu ayant disputé le plus grand nombre de parties sur l’ardoise.',
        type: 'blue',
        iconName: 'Flame',
      })
    }

    if (podiumKing && (p.id ? p.id === podiumKing.id : p.name === podiumKing.name) && maxPodiums >= 2 && (p.id ? p.id !== bestStrategist?.id : p.name !== bestStrategist?.name)) {
      p.badges.push({
        id: 'podium',
        title: 'Roi du podium',
        desc: `${p.podiums} podiums`,
        explanation: 'Attribué au joueur ayant fini le plus de fois dans le Top 3.',
        type: 'emerald',
        iconName: 'Medal',
      })
    }

    // Titres thématiques par jeu
    Object.entries(gameWinners).forEach(([type, info]) => {
      if (info.player && (p.id ? p.id === info.player.id : p.name === info.player.name) && info.wins >= 1) {
        p.badges.push({
          id: `master_${type}`,
          title: info.title,
          desc: `${info.wins} vict. ${GAME_META[type]?.name.split(' (')[0] || ''}`.trim(),
          explanation: info.explanation,
          type: 'theme',
          iconName: info.iconName || 'Award',
        })
      }
    })
  })

  return {
    kpis: {
      totalGamesCount,
      finishedGamesCount,
      activeGamesCount,
      totalRounds,
      totalPlayTimeMs,
      favoriteGame,
    },
    gamesDistribution,
    playersStats,
    titles: {
      bestStrategist,
      grandDourak,
      mostActive,
      podiumKing,
    },
  }
}

/**
 * Récupère les statistiques détaillées d'un joueur individuel
 */
export function getPlayerStats(games = [], player = null, registeredPlayers = []) {
  if (!player || (!player.id && !player.name)) return null
  const stats = computeStats(games, 'all', registeredPlayers)
  const targetId = player.id
  const targetName = normalizePlayerName(player.name)
  const found = stats.playersStats.find(p => (targetId && p.id === targetId) || normalizePlayerName(p.name) === targetName)
  if (found) return found
  return {
    id: player.id,
    name: player.name,
    color: player.color,
    avatar: player.avatar,
    totalGames: 0,
    finishedGames: 0,
    activeGames: 0,
    wins: 0,
    podiums: 0,
    winRate: 0,
    podiumRate: 0,
    badges: [],
    gameBreakdown: {},
    recentHistory: [],
    topOpponent: null,
  }
}

/**
 * Trie la liste des joueurs selon le critère choisi
 * @param {Array} players - Liste calculée des joueurs
 * @param {string} sortBy - 'winRate' (défaut) | 'wins' | 'games'
 */
export function sortPlayers(players = [], sortBy = 'winRate') {
  return [...players].sort((a, b) => {
    if (sortBy === 'winRate') {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate
      if (b.wins !== a.wins) return b.wins - a.wins
      return b.finishedGames - a.finishedGames
    }
    if (sortBy === 'wins') {
      if (b.wins !== a.wins) return b.wins - a.wins
      if (b.winRate !== a.winRate) return b.winRate - a.winRate
      return b.finishedGames - a.finishedGames
    }
    if (sortBy === 'games') {
      if (b.totalGames !== a.totalGames) return b.totalGames - a.totalGames
      return b.wins - a.wins
    }
    return (a.name || '').localeCompare(b.name || '')
  })
}

/**
 * Formate une durée en chaîne lisible concise pour les cartes
 */
export function formatStatDuration(ms) {
  if (!ms || ms <= 0) return '0 min'
  const totalMinutes = Math.round(ms / 60000)
  if (totalMinutes === 0) return '< 1 min'
  if (totalMinutes < 60) return `${totalMinutes} min`
  const hours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60
  if (remainingMinutes === 0) return `${hours} h`
  return `${hours}h ${remainingMinutes}m`
}

/**
 * Catalogue complet des trophées et distinctions
 */
export const TROPHIES_CATALOG = [
  {
    id: 'strategist',
    title: 'Meilleur stratège',
    category: 'Général',
    condition: 'Avoir le plus haut taux de victoire (%) de la table (minimum 2 parties disputées).',
    description: 'Récompense la régularité et la tactique globale sur l’ensemble des jeux.',
    color: 'gold',
    iconName: 'Brain',
  },
  {
    id: 'active',
    title: 'Fidèle au poste',
    category: 'Général',
    condition: 'Avoir disputé le plus grand nombre total de parties (minimum 3 parties).',
    description: 'Attribué au joueur le plus présent et infatigable autour de la table.',
    color: 'blue',
    iconName: 'Flame',
  },
  {
    id: 'dourak',
    title: 'Grand Dourak',
    category: 'Dourak',
    condition: 'Avoir subi le plus grand nombre de défaites au Dourak (au moins 1 revers).',
    description: "Le titre craint de tous : le joueur qui a le plus souvent conservé les cartes en main.",
    color: 'rose',
    iconName: 'Frown',
  },
  {
    id: 'podium',
    title: 'Roi du podium',
    category: 'Général',
    condition: 'Avoir terminé le plus grand nombre de fois dans le Top 3 (minimum 2 podiums).',
    description: 'Récompense la constance aux avant-postes sur les parties disputées.',
    color: 'emerald',
    iconName: 'Medal',
  },
  {
    id: 'invincible',
    title: 'Invincible',
    category: 'Prestige',
    condition: 'Réaliser 100% de victoires sur au moins 3 parties terminées.',
    description: 'L’exploit absolu : n’avoir jamais connu la défaite sur un cycle significatif.',
    color: 'purple',
    iconName: 'Crown',
  },
  {
    id: 'master_president',
    gameType: GAMES.PRESIDENT,
    title: 'Président éternel',
    category: 'Trou du cul',
    condition: 'Avoir remporté le plus grand nombre de victoires en tant que Président au Trou du cul.',
    description: 'Le monarque incontesté de la hiérarchie et des échanges de cartes.',
    color: 'gold',
    iconName: 'UserCheck',
  },
  {
    id: 'master_caracole',
    gameType: GAMES.CARACOLE,
    title: 'As du Sursis',
    category: 'Caracole',
    condition: 'Cumuler le plus grand nombre de victoires (score minimal) à la Caracole.',
    description: 'Maître du bluff, de la mémoire des cartes cachées et de la règle du sursis.',
    color: 'blue',
    iconName: 'Hourglass',
  },
  {
    id: 'master_skyjo',
    gameType: GAMES.SKYJO,
    title: 'Zéro faute',
    category: 'Skyjo',
    condition: 'Avoir remporté le plus grand nombre de victoires au Skyjo.',
    description: 'Dompteur de la grille de 12 cartes, expert des colonnes alignées à 0 point.',
    color: 'emerald',
    iconName: 'Target',
  },
  {
    id: 'master_belote',
    gameType: GAMES.BELOTE,
    title: 'Grand Preneur',
    category: 'Belote / Coinche',
    condition: 'Avoir mené son camp au plus grand nombre de victoires à la Belote.',
    description: 'Le preneur intrépide qui réussit ses contrats et capitalise sur le 10 de der.',
    color: 'rose',
    iconName: 'Layers',
  },
  {
    id: 'master_tarot',
    gameType: GAMES.TAROT,
    title: 'Maître du Bout',
    category: 'Tarot',
    condition: 'Avoir réussi le plus grand nombre de victoires au Tarot.',
    description: 'Le stratège qui maîtrise la gestion du Petit au bout, des 21 et des Excuses.',
    color: 'purple',
    iconName: 'Wand2',
  },
  {
    id: 'master_six_qui_prend',
    gameType: GAMES.SIX_QUI_PREND,
    title: 'Dompteur de taureaux',
    category: '6 qui prend',
    condition: 'Avoir remporté le plus grand nombre de victoires à 6 qui prend.',
    description: 'Le joueur qui anticipe les 6èmes cartes et évite le ramassage des bœufs.',
    color: 'gold',
    iconName: 'Skull',
  },
  {
    id: 'master_dame_de_pique',
    gameType: GAMES.DAME_DE_PIQUE,
    title: 'Épargneur de Cœurs',
    category: 'Dame de Pique',
    condition: 'Avoir cumulé le plus de victoires à la Dame de Pique.',
    description: 'Le joueur qui évite les Cœurs et la Dame de Pique ou réussit le Grand Chelem.',
    color: 'rose',
    iconName: 'HeartCrack',
  },
  {
    id: 'master_flip_7',
    gameType: GAMES.FLIP_7,
    title: 'Série Magique',
    category: 'Flip 7',
    condition: 'Avoir remporté le plus de victoires à Flip 7.',
    description: 'L’as du stop-ou-encore qui franchit les 200 points sans faire de doublons.',
    color: 'amber',
    iconName: 'Zap',
  },
  {
    id: 'master_sea_salt_paper',
    gameType: GAMES.SEA_SALT_PAPER,
    title: 'Seigneur des Mers',
    category: 'Sea Salt & Paper',
    condition: 'Avoir remporté le plus de parties à Sea Salt & Paper.',
    description: 'Le marin qui optimise ses duos origami et réussit ses Dernières Chances.',
    color: 'blue',
    iconName: 'Anchor',
  },
  {
    id: 'master_ascenseur',
    gameType: GAMES.ASCENSEUR,
    title: 'Oracle des Plis',
    category: "L'Ascenseur",
    condition: 'Avoir cumulé le plus de victoires à l’Ascenseur.',
    description: 'Le clairvoyant qui prédit avec exactitude ses plis manche après manche.',
    color: 'purple',
    iconName: 'Eye',
  },
  {
    id: 'master_rami',
    gameType: GAMES.RAMI,
    title: 'Grand Défausseur',
    category: 'Rami',
    condition: 'Avoir totalisé le plus de victoires au Rami.',
    description: 'Le maître des tierces et des brelans qui terrasse ses rivaux au Rami Sec.',
    color: 'emerald',
    iconName: 'CheckCircle2',
  },
  {
    id: 'master_dourak',
    gameType: GAMES.DOURAK,
    title: 'Insubmersible',
    category: 'Dourak',
    condition: 'Avoir remporté le plus grand nombre de victoires au Dourak.',
    description: 'Le maître des défausses qui esquive toutes les attaques et échappe au statut de Dourak.',
    color: 'emerald',
    iconName: 'ShieldCheck',
  },
  {
    id: 'master_yaniv',
    gameType: GAMES.YANIV,
    title: 'Invocateur d’Asaf',
    category: 'Yaniv',
    condition: 'Avoir cumulé le plus de victoires à Yaniv.',
    description: 'L’expert des annonces « Yaniv » à 5 points ou moins et des contre-attaques Asaf impitoyables.',
    color: 'amber',
    iconName: 'Swords',
  },
  {
    id: 'master_barbu',
    gameType: GAMES.BARBU,
    title: 'Barbe d’Or',
    category: 'Le Barbu',
    condition: 'Avoir remporté le plus grand nombre de victoires au Barbu.',
    description: 'Le grand maître des 7 contrats impitoyables et de la redoutable Salade.',
    color: 'rose',
    iconName: 'Mustache',
  },
  {
    id: 'master_uno',
    gameType: GAMES.UNO,
    title: 'Roi du UNO',
    category: 'UNO',
    condition: 'Avoir remporté le plus grand nombre de victoires au UNO.',
    description: 'Le maître des cartes Action, des contres +4 et des annonces « UNO » fulgurantes.',
    color: 'rose',
    iconName: 'Flame',
  },
  {
    id: 'master_universel',
    gameType: GAMES.UNIVERSEL,
    title: 'Touche-à-tout',
    category: 'Compteur Universel',
    condition: 'Avoir remporté le plus de victoires sur les compteurs et jeux personnalisés.',
    description: 'Le joueur caméléon capable de triompher sur n’importe quelle règle personnalisée.',
    color: 'gold',
    iconName: 'Dices',
  },
]
