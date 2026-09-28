import { GAME_META, GAMES } from '../constants/games'
import { getRanking } from './gameUtils'

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
  const allFilteredGames = selectedGameType === 'all'
    ? games
    : games.filter(g => g.type === selectedGameType)

  const finishedGames = allFilteredGames.filter(g => g.status === 'finished')
  const activeGames = allFilteredGames.filter(g => g.status !== 'finished')

  // 1. Indicateurs Globaux (KPIs)
  const totalGamesCount = allFilteredGames.length
  const finishedGamesCount = finishedGames.length
  const activeGamesCount = activeGames.length

  let totalRounds = 0
  let totalPlayTimeMs = 0
  const gameTypeCounts = {}

  allFilteredGames.forEach(game => {
    totalRounds += game.rounds?.length || 0

    const start = game.startedAt || 0
    const end = game.finishedAt || game.updatedAt || start
    if (end > start) {
      totalPlayTimeMs += (end - start)
    }

    if (!gameTypeCounts[game.type]) {
      gameTypeCounts[game.type] = { count: 0, finished: 0, durationMs: 0 }
    }
    gameTypeCounts[game.type].count += 1
    if (game.status === 'finished') {
      gameTypeCounts[game.type].finished += 1
    }
    if (end > start) {
      gameTypeCounts[game.type].durationMs += (end - start)
    }
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
  // On crée une table d'association basée sur le nom normalisé
  const playerStatsMap = new Map()

  // Initialiser avec les joueurs enregistrés pour conserver leurs préférences d'avatar/couleur
  registeredPlayers.forEach(p => {
    const key = normalizePlayerName(p.name)
    if (!key) return
    playerStatsMap.set(key, {
      id: p.id,
      name: p.name,
      color: p.color,
      avatar: p.avatar,
      registered: true,
      totalGames: 0,
      finishedGames: 0,
      activeGames: 0,
      wins: 0,
      podiums: 0,
      dourakLosses: 0,
      gameBreakdown: {}, // type -> { played, wins }
      opponents: {}, // normalizedName -> { name, count, winsAgainst }
      recentHistory: [], // { gameId, gameType, rank, isWinner, date }
    })
  })

  // Traiter toutes les parties filtrées
  allFilteredGames.forEach(game => {
    const isFinished = game.status === 'finished'
    const scoreDir = getGameScoreDirection(game)
    const ranking = getRanking(game.scores || {}, scoreDir)
    const gamePlayers = game.players || []

    // Identifier le gagnant et le dernier
    let winnerId = game.winner || null
    if (!winnerId && ranking.length > 0) {
      winnerId = ranking[0].id
    }
    const lastRankEntry = ranking.length > 0 ? ranking[ranking.length - 1] : null

    gamePlayers.forEach(player => {
      const key = normalizePlayerName(player.name)
      if (!key) return

      let stat = playerStatsMap.get(key)
      if (!stat) {
        stat = {
          id: player.id,
          name: player.name,
          color: player.color,
          avatar: player.avatar,
          registered: false,
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

      stat.totalGames += 1

      if (!stat.gameBreakdown[game.type]) {
        stat.gameBreakdown[game.type] = { played: 0, wins: 0 }
      }
      stat.gameBreakdown[game.type].played += 1

      if (isFinished) {
        stat.finishedGames += 1

        const rankEntry = ranking.find(r => r.id === player.id)
        const rank = rankEntry ? rankEntry.rank : ranking.length

        const isWinner = player.id === winnerId || rank === 1
        const isPodium = rank <= 3 && ranking.length >= 2
        const isDourakLoser = game.type === GAMES.DOURAK && rankEntry && rankEntry.id === lastRankEntry?.id

        if (isWinner) {
          stat.wins += 1
          stat.gameBreakdown[game.type].wins += 1
        }
        if (isPodium) {
          stat.podiums += 1
        }
        if (isDourakLoser) {
          stat.dourakLosses += 1
        }

        // Adversaires rencontrés
        gamePlayers.forEach(opp => {
          if (opp.id === player.id || normalizePlayerName(opp.name) === key) return
          const oppKey = normalizePlayerName(opp.name)
          if (!stat.opponents[oppKey]) {
            stat.opponents[oppKey] = { name: opp.name, count: 0, winsAgainst: 0 }
          }
          stat.opponents[oppKey].count += 1
          if (isWinner) {
            stat.opponents[oppKey].winsAgainst += 1
          }
        })

        // Historique récent
        stat.recentHistory.push({
          gameId: game.id,
          gameType: game.type,
          gameName: GAME_META[game.type]?.name || game.type,
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

  // Titres pour chaque joueur
  playersStats.forEach(p => {
    p.badges = []
    if (bestStrategist && p.name === bestStrategist.name && maxWinRate > 0) {
      p.badges.push({
        id: 'strategist',
        title: 'Meilleur stratège',
        desc: `${p.winRate}% de victoires`,
        type: 'gold',
      })
    }
    if (grandDourak && p.name === grandDourak.name && maxDourakLosses > 0) {
      p.badges.push({
        id: 'dourak',
        title: 'Grand Dourak',
        desc: `${p.dourakLosses} défaites`,
        type: 'red',
      })
    }
    if (mostActive && p.name === mostActive.name && maxTotalGames >= 3) {
      p.badges.push({
        id: 'active',
        title: 'Fidèle au poste',
        desc: `${p.totalGames} parties jouées`,
        type: 'blue',
      })
    }
    if (podiumKing && p.name === podiumKing.name && maxPodiums >= 2 && p.name !== bestStrategist?.name) {
      p.badges.push({
        id: 'podium',
        title: 'Roi du podium',
        desc: `${p.podiums} podiums`,
        type: 'emerald',
      })
    }
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
  if (totalMinutes < 60) return `${totalMinutes} min`
  const hours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60
  if (remainingMinutes === 0) return `${hours} h`
  return `${hours}h ${remainingMinutes}m`
}
