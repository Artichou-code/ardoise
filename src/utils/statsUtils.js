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

  const createPlayerStat = (pId, pName, color = null, avatar = null, registered = false, archived = false) => ({
    id: pId,
    name: pName,
    color,
    avatar,
    registered,
    archived,
    totalGames: 0,
    finishedGames: 0,
    activeGames: 0,
    wins: 0,
    podiums: 0,
    dourakLosses: 0,
    phoenixWins: 0,
    closeCallWins: 0,
    nightOwlGames: 0,
    maxGameRounds: 0,
    symbioseDuoWins: 0,
    maxSymbiosePond: 0,
    skyjoFreezerCount: 0,
    skyjoDoubledCount: 0,
    caracoleReprieveCount: 0,
    dameChelemCount: 0,
    sixTightropeCount: 0,
    bestSixTightrope: 0,
    maxSixGluttonBulls: 0,
    flip7BonusCount: 0,
    yanivAssafCount: 0,
    beloteCapotCount: 0,
    tarotPetitCount: 0,
    seasaltSirensCount: 0,
    gameBreakdown: {}, // type -> { played, wins }
    opponents: {}, // oppKey -> { id, name, count, winsAgainst }
    recentHistory: [], // { gameId, gameType, rank, isWinner, date }
  })

  // Initialiser avec les joueurs enregistrés pour conserver leurs préférences d'avatar/couleur
  safeRegisteredPlayers.forEach(p => {
    if (!p) return
    const key = p.id || normalizePlayerName(p.name)
    if (!key) return
    playerStatsMap.set(key, createPlayerStat(p.id, p.name, p.color, p.avatar, !p.archived, Boolean(p.archived)))
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
        stat = createPlayerStat(pId || key, pName, player.color, player.avatar, false, false)
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

    // Helper de recherche de joueur dans la table des statistiques
    const getStatForPlayer = (pIdOrName) => {
      if (!pIdOrName) return null
      if (playerStatsMap.has(pIdOrName)) return playerStatsMap.get(pIdOrName)
      for (const s of playerStatsMap.values()) {
        if (s.id === pIdOrName || s.name === pIdOrName || normalizePlayerName(s.name) === normalizePlayerName(pIdOrName)) {
          return s
        }
      }
      return null
    }

    const gType = game.type || 'universel'

    // --- 1. Exploits au niveau de la partie complète ---
    if (isFinished) {
      // Sur le Fil : Victoire avec seulement 1 point d'écart
      if (ranking.length >= 2) {
        const gap = Math.abs((ranking[0].score || 0) - (ranking[1].score || 0))
        if (gap === 1) {
          const wStat = getStatForPlayer(ranking[0].id) || getStatForPlayer(ranking[0].name)
          if (wStat) wStat.closeCallWins = (wStat.closeCallWins || 0) + 1
        }
      }

      // Le Phénix : Le vainqueur était dernier lors d'au moins une manche intermédiaire
      if (Array.isArray(game.rounds) && game.rounds.length >= 2 && ranking.length >= 2) {
        const winnerRef = ranking[0].id || ranking[0].name
        let wasLastDuringGame = false
        for (let rIdx = 0; rIdx < game.rounds.length - 1; rIdx++) {
          const r = game.rounds[rIdx]
          if (r && r.scores) {
            const rRanking = getRanking(r.scores, scoreDir, game)
            if (rRanking.length >= 2) {
              const lastInR = rRanking[rRanking.length - 1]
              if (lastInR && (lastInR.id === winnerRef || lastInR.name === ranking[0].name)) {
                wasLastDuringGame = true
                break
              }
            }
          }
        }
        if (wasLastDuringGame) {
          const wStat = getStatForPlayer(winnerRef) || getStatForPlayer(ranking[0].name)
          if (wStat) wStat.phoenixWins = (wStat.phoenixWins || 0) + 1
        }
      }

      // Funambule (6 qui prend) : Fini entre 55 et 65 têtes sans être éliminé
      if (gType === GAMES.SIX_QUI_PREND) {
        gamePlayers.forEach(p => {
          const pId = p.id || p
          const pName = p.name || p
          const finalScore = game.scores?.[pId] ?? game.scores?.[pName]
          if (typeof finalScore === 'number' && finalScore >= 55 && finalScore <= 65) {
            const pStat = getStatForPlayer(pId) || getStatForPlayer(pName)
            if (pStat) {
              pStat.sixTightropeCount = (pStat.sixTightropeCount || 0) + 1
              pStat.bestSixTightrope = Math.max(pStat.bestSixTightrope || 0, finalScore)
            }
          }
        })
      }

      // Duo Fusionnel (Symbiose 2v2) : Victoire en mode équipe
      if (gType === GAMES.SYMBIOSE) {
        const isTeam = game.config?.mode === 'team' || game.rounds?.some(r => r?.isTeamMode)
        if (isTeam && game.players?.length === 4 && ranking.length > 0) {
          const wId = ranking[0].id || ranking[0].name
          const wIdx = game.players.findIndex(p => p.id === wId || p.name === ranking[0].name)
          if (wIdx !== -1) {
            const winningDuo = wIdx < 2
              ? [game.players[0], game.players[1]]
              : [game.players[2], game.players[3]]
            winningDuo.forEach(tp => {
              const tpStat = getStatForPlayer(tp.id) || getStatForPlayer(tp.name)
              if (tpStat) tpStat.symbioseDuoWins = (tpStat.symbioseDuoWins || 0) + 1
            })
          }
        }
      }
    }

    // Le Marathonien : Partie disputée en 8 manches ou plus
    const totalRoundsCount = game.rounds?.length || 0
    if (totalRoundsCount >= 8) {
      gamePlayers.forEach(p => {
        const pStat = getStatForPlayer(p.id) || getStatForPlayer(p.name || p)
        if (pStat) pStat.maxGameRounds = Math.max(pStat.maxGameRounds || 0, totalRoundsCount)
      })
    }

    // Oiseau de Nuit : Partie disputée entre 00h00 et 05h00
    const gameTime = game.finishedAt || game.updatedAt || game.createdAt || game.startedAt
    if (gameTime) {
      const hour = new Date(gameTime).getHours()
      if (hour >= 0 && hour < 5) {
        gamePlayers.forEach(p => {
          const pStat = getStatForPlayer(p.id) || getStatForPlayer(p.name || p)
          if (pStat) pStat.nightOwlGames = (pStat.nightOwlGames || 0) + 1
        })
      }
    }

    // --- 2. Exploits spécifiques au niveau des manches (rounds) ---
    if (Array.isArray(game.rounds)) {
      game.rounds.forEach(round => {
        if (!round) return

        // Symbiose : Écosystème Idéal (score de mare individuel >= 35)
        if (gType === GAMES.SYMBIOSE) {
          gamePlayers.forEach(p => {
            const pId = p.id || p
            const pName = p.name || p
            let pondScore = 0
            if (round.directTotals && round.directTotals[pId] != null) {
              pondScore = Number(round.directTotals[pId]) || 0
            } else if (round.cardsByPlayer && Array.isArray(round.cardsByPlayer[pId])) {
              pondScore = round.cardsByPlayer[pId].reduce((a, b) => a + (Number(b) || 0), 0)
            } else if (round.delta && round.delta[pId] != null) {
              pondScore = Number(round.delta[pId]) || 0
            }
            if (pondScore >= 35) {
              const pStat = getStatForPlayer(pId) || getStatForPlayer(pName)
              if (pStat) pStat.maxSymbiosePond = Math.max(pStat.maxSymbiosePond || 0, pondScore)
            }
          })
        }

        // Skyjo : Le Frigo (manche <= 0) & L'Arroseur Arrosé (fermeture x2)
        if (gType === GAMES.SKYJO) {
          gamePlayers.forEach(p => {
            const pId = p.id || p
            const pName = p.name || p
            const d = round.delta?.[pId] ?? round.delta?.[pName]
            if (d !== undefined && d !== null && d <= 0) {
              const pStat = getStatForPlayer(pId) || getStatForPlayer(pName)
              if (pStat) pStat.skyjoFreezerCount = (pStat.skyjoFreezerCount || 0) + 1
            }
          })

          if (round.closerId) {
            let isCloserDoubled = round.closerDoubled === true
            if (!isCloserDoubled && round.delta && round.delta[round.closerId] > 0) {
              const closerVal = round.delta[round.closerId]
              isCloserDoubled = Object.entries(round.delta).some(([oid, val]) => oid !== round.closerId && val <= closerVal)
            }
            if (isCloserDoubled) {
              const closerStat = getStatForPlayer(round.closerId)
              if (closerStat) closerStat.skyjoDoubledCount = (closerStat.skyjoDoubledCount || 0) + 1
            }
          }
        }

        // Caracole : Sursis officiel
        if (gType === GAMES.CARACOLE && Array.isArray(round.reprieves)) {
          round.reprieves.forEach(rep => {
            if (!rep?.playerId) return
            const pStat = getStatForPlayer(rep.playerId)
            if (pStat) pStat.caracoleReprieveCount = (pStat.caracoleReprieveCount || 0) + 1
          })
        }

        // Dame de Pique : Grand Chelem (Shoot the Moon)
        if (gType === GAMES.DAME_DE_PIQUE && round.chelemWinnerId) {
          const pStat = getStatForPlayer(round.chelemWinnerId)
          if (pStat) pStat.dameChelemCount = (pStat.dameChelemCount || 0) + 1
        }

        // 6 qui prend : Goinfre de bœufs (>= 18 bœufs en 1 manche)
        if (gType === GAMES.SIX_QUI_PREND && round.delta) {
          Object.entries(round.delta).forEach(([pid, bulls]) => {
            const b = Number(bulls) || 0
            if (b >= 18) {
              const pStat = getStatForPlayer(pid)
              if (pStat) {
                pStat.maxSixGluttonBulls = Math.max(pStat.maxSixGluttonBulls || 0, b)
                pStat.sixGluttonCount = (pStat.sixGluttonCount || 0) + 1
              }
            }
          })
        }

        // Flip 7 : Bonus Flip 7
        if (gType === GAMES.FLIP_7 && round.flip7BonusPlayers) {
          Object.entries(round.flip7BonusPlayers).forEach(([pid, hasBonus]) => {
            if (hasBonus) {
              const pStat = getStatForPlayer(pid)
              if (pStat) pStat.flip7BonusCount = (pStat.flip7BonusCount || 0) + 1
            }
          })
        }

        // Yaniv : Contre-ASSAF
        if (gType === GAMES.YANIV && round.isAssaf && round.assafRivalId) {
          const pStat = getStatForPlayer(round.assafRivalId)
          if (pStat) pStat.yanivAssafCount = (pStat.yanivAssafCount || 0) + 1
        }

        // Belote : Capot (252 pts ou 162 pts de plis)
        if (gType === GAMES.BELOTE && (round.pointsTaker === 162 || round.contract === 252) && round.takerTeam) {
          const teamNous = [game.players[0], game.players[1]].filter(Boolean)
          const teamEux = [game.players[2], game.players[3]].filter(Boolean)
          const winners = round.takerTeam === 'nous' ? teamNous : teamEux
          winners.forEach(p => {
            const pStat = getStatForPlayer(p.id) || getStatForPlayer(p.name || p)
            if (pStat) pStat.beloteCapotCount = (pStat.beloteCapotCount || 0) + 1
          })
        }

        // Tarot : Petit au bout en attaque
        if (gType === GAMES.TAROT && round.petitAuBout === 'attack') {
          if (round.attackerId) {
            const aStat = getStatForPlayer(round.attackerId)
            if (aStat) aStat.tarotPetitCount = (aStat.tarotPetitCount || 0) + 1
          }
          if (round.partnerId) {
            const pStat = getStatForPlayer(round.partnerId)
            if (pStat) pStat.tarotPetitCount = (pStat.tarotPetitCount || 0) + 1
          }
        }

        // Sea Salt & Paper : 4 Sirènes
        if (gType === GAMES.SEA_SALT_PAPER && round.specialWin === 'four_sirens' && round.winnerId) {
          const pStat = getStatForPlayer(round.winnerId)
          if (pStat) pStat.seasaltSirensCount = (pStat.seasaltSirensCount || 0) + 1
        }
      })
    }
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
    [GAMES.SYMBIOSE]: {
      player: null,
      wins: 0,
      title: 'Symbiose Parfaite',
      desc: 'Maître de la Mare',
      explanation: 'Attribué au joueur ayant créé les plus beaux écosystèmes et cumulé le plus de victoires à Symbiose.',
      iconName: 'Waves',
    },
    [GAMES.MOLKKY]: {
      player: null,
      wins: 0,
      title: 'Vrai Finlandais',
      desc: 'Maître du Mölkky',
      explanation: 'Attribué au joueur ayant cumulé le plus de victoires au Mölkky en atteignant exactement 50 points.',
      iconName: 'Target',
    },
    [GAMES.YAM]: {
      player: null,
      wins: 0,
      title: 'Cinq Dés Parfaits',
      desc: 'Champion du Yam\'s',
      explanation: 'Attribué au joueur ayant cumulé le plus grand nombre de victoires au Yam\'s avec une grille de marque d\'exception.',
      iconName: 'Dices',
    },
    [GAMES.DIXIT]: {
      player: null,
      wins: 0,
      title: 'Grand Conteur',
      desc: 'Maître de Dixit',
      explanation: 'Attribué au joueur ayant cumulé le plus de victoires à Dixit grâce à son imagination et ses talents de déduction.',
      iconName: 'Eye',
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

  // Leaders pour les trophées avancés
  let phoenixLeader = null; let maxPhoenix = 0
  let chameleonLeader = null; let maxDistinctGames = 0
  let closeCallLeader = null; let maxCloseCall = 0
  let nightOwlLeader = null; let maxNightOwl = 0
  let marathonLeader = null; let maxMarathonRounds = 0

  let symbioseDuoLeader = null; let maxSymbioseDuo = 0
  let symbiosePondLeader = null; let maxSymbiosePond = 0
  let skyjoFreezerLeader = null; let maxSkyjoFreezer = 0
  let skyjoDoubledLeader = null; let maxSkyjoDoubled = 0
  let caracoleReprieveLeader = null; let maxCaracoleReprieve = 0
  let dameChelemLeader = null; let maxDameChelem = 0
  let sixTightropeLeader = null; let bestSixTightropeScore = 0
  let sixGluttonLeader = null; let maxSixGluttonBulls = 0
  let flip7BonusLeader = null; let maxFlip7Bonus = 0
  let yanivAssafLeader = null; let maxYanivAssaf = 0
  let beloteCapotLeader = null; let maxBeloteCapot = 0
  let tarotPetitLeader = null; let maxTarotPetit = 0
  let seasaltSirensLeader = null; let maxSeasaltSirens = 0

  playersStats.forEach(p => {
    // Phénix (Remontada)
    if (p.phoenixWins > maxPhoenix) {
      maxPhoenix = p.phoenixWins
      phoenixLeader = p
    }

    // Caméléon (minimum 5 jeux différents)
    const distinctCount = Object.keys(p.gameBreakdown || {}).filter(k => p.gameBreakdown[k].played >= 1).length
    p.distinctGamesCount = distinctCount
    if (distinctCount >= 5 && distinctCount > maxDistinctGames) {
      maxDistinctGames = distinctCount
      chameleonLeader = p
    }

    // Sur le Fil (victoires avec 1 pt d'écart)
    if (p.closeCallWins > maxCloseCall) {
      maxCloseCall = p.closeCallWins
      closeCallLeader = p
    }

    // Oiseau de Nuit (parties jouées entre 00h et 05h)
    if (p.nightOwlGames > maxNightOwl) {
      maxNightOwl = p.nightOwlGames
      nightOwlLeader = p
    }

    // Le Marathonien (minimum 8 manches)
    if (p.maxGameRounds >= 8 && p.maxGameRounds > maxMarathonRounds) {
      maxMarathonRounds = p.maxGameRounds
      marathonLeader = p
    }

    // Symbiose Duo Fusionnel (victoires en 2v2)
    if (p.symbioseDuoWins > maxSymbioseDuo) {
      maxSymbioseDuo = p.symbioseDuoWins
      symbioseDuoLeader = p
    }

    // Symbiose Écosystème Idéal (score de mare >= 35)
    if (p.maxSymbiosePond >= 35 && p.maxSymbiosePond > maxSymbiosePond) {
      maxSymbiosePond = p.maxSymbiosePond
      symbiosePondLeader = p
    }

    // Skyjo Le Frigo (manche <= 0)
    if (p.skyjoFreezerCount > maxSkyjoFreezer) {
      maxSkyjoFreezer = p.skyjoFreezerCount
      skyjoFreezerLeader = p
    }

    // Skyjo L'Arroseur Arrosé (fermeture x2)
    if (p.skyjoDoubledCount > maxSkyjoDoubled) {
      maxSkyjoDoubled = p.skyjoDoubledCount
      skyjoDoubledLeader = p
    }

    // Caracole Sursis
    if (p.caracoleReprieveCount > maxCaracoleReprieve) {
      maxCaracoleReprieve = p.caracoleReprieveCount
      caracoleReprieveLeader = p
    }

    // Dame de Pique Grand Chelem
    if (p.dameChelemCount > maxDameChelem) {
      maxDameChelem = p.dameChelemCount
      dameChelemLeader = p
    }

    // 6 qui prend Funambule (score entre 55 et 65 têtes)
    if (p.bestSixTightrope >= 55 && p.bestSixTightrope > bestSixTightropeScore) {
      bestSixTightropeScore = p.bestSixTightrope
      sixTightropeLeader = p
    }

    // 6 qui prend Goinfre de Bœufs (>= 18 bœufs en 1 manche)
    if (p.maxSixGluttonBulls >= 18 && p.maxSixGluttonBulls > maxSixGluttonBulls) {
      maxSixGluttonBulls = p.maxSixGluttonBulls
      sixGluttonLeader = p
    }

    // Flip 7 Septième Ciel
    if (p.flip7BonusCount > maxFlip7Bonus) {
      maxFlip7Bonus = p.flip7BonusCount
      flip7BonusLeader = p
    }

    // Yaniv Contre-ASSAF
    if (p.yanivAssafCount > maxYanivAssaf) {
      maxYanivAssaf = p.yanivAssafCount
      yanivAssafLeader = p
    }

    // Belote Le Capot Magique
    if (p.beloteCapotCount > maxBeloteCapot) {
      maxBeloteCapot = p.beloteCapotCount
      beloteCapotLeader = p
    }

    // Tarot Le Petit au Bout
    if (p.tarotPetitCount > maxTarotPetit) {
      maxTarotPetit = p.tarotPetitCount
      tarotPetitLeader = p
    }

    // Sea Salt & Paper 4 Sirènes
    if (p.seasaltSirensCount > maxSeasaltSirens) {
      maxSeasaltSirens = p.seasaltSirensCount
      seasaltSirensLeader = p
    }
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

    // Titres thématiques par jeu (Masters)
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

    // Nouveaux Trophées Généraux
    if (phoenixLeader && (p.id ? p.id === phoenixLeader.id : p.name === phoenixLeader.name) && maxPhoenix > 0) {
      p.badges.push({
        id: 'general_phoenix',
        title: 'Le Phénix',
        desc: `${p.phoenixWins} remontada${p.phoenixWins > 1 ? 's' : ''}`,
        explanation: 'Attribué pour avoir renversé une partie en étant classé dernier avant de triompher à la première place.',
        type: 'amber',
        iconName: 'TrendingUp',
      })
    }

    if (chameleonLeader && (p.id ? p.id === chameleonLeader.id : p.name === chameleonLeader.name) && maxDistinctGames >= 5) {
      p.badges.push({
        id: 'general_chameleon',
        title: 'Le Caméléon',
        desc: `${p.distinctGamesCount} jeux explorés`,
        explanation: 'Attribué au joueur le plus polyvalent ayant disputé au moins 5 jeux différents de l’Ardoise.',
        type: 'blue',
        iconName: 'Compass',
      })
    }

    if (closeCallLeader && (p.id ? p.id === closeCallLeader.id : p.name === closeCallLeader.name) && maxCloseCall > 0) {
      p.badges.push({
        id: 'general_close_call',
        title: 'Sur le Fil',
        desc: `${p.closeCallWins} vict. à 1 pt`,
        explanation: 'Attribué au joueur ayant remporté le plus de victoires à l’arraché avec seulement 1 point d’écart sur le deuxième.',
        type: 'emerald',
        iconName: 'Zap',
      })
    }

    if (nightOwlLeader && (p.id ? p.id === nightOwlLeader.id : p.name === nightOwlLeader.name) && maxNightOwl > 0) {
      p.badges.push({
        id: 'general_night_owl',
        title: 'Oiseau de Nuit',
        desc: `${p.nightOwlGames} nocturne${p.nightOwlGames > 1 ? 's' : ''}`,
        explanation: 'Attribué au joueur ayant disputé le plus de parties au cœur de la nuit (entre 0h00 et 5h00 du matin).',
        type: 'purple',
        iconName: 'Moon',
      })
    }

    if (marathonLeader && (p.id ? p.id === marathonLeader.id : p.name === marathonLeader.name) && maxMarathonRounds >= 8) {
      p.badges.push({
        id: 'general_marathon',
        title: 'Le Marathonien',
        desc: `Partie en ${p.maxGameRounds} manches`,
        explanation: 'Attribué au joueur ayant disputé la plus longue confrontation enregistrée (au moins 8 manches).',
        type: 'gold',
        iconName: 'Timer',
      })
    }

    // Nouveaux Trophées par Jeu
    if (symbioseDuoLeader && (p.id ? p.id === symbioseDuoLeader.id : p.name === symbioseDuoLeader.name) && maxSymbioseDuo > 0) {
      p.badges.push({
        id: 'symbiose_duo',
        title: 'Duo Fusionnel',
        desc: `${p.symbioseDuoWins} vict. en duo`,
        explanation: 'Attribué au joueur cumulant le plus de victoires en mode Équipe 2v2 à Symbiose.',
        type: 'rose',
        iconName: 'Users',
      })
    }

    if (symbiosePondLeader && (p.id ? p.id === symbiosePondLeader.id : p.name === symbiosePondLeader.name) && maxSymbiosePond >= 35) {
      p.badges.push({
        id: 'symbiose_master_pond',
        title: 'Écosystème Idéal',
        desc: `Record : ${p.maxSymbiosePond} pts`,
        explanation: 'Attribué pour avoir réalisé le score de Mare individuel le plus élevé sur une seule manche à Symbiose.',
        type: 'emerald',
        iconName: 'FrogFace',
      })
    }

    if (skyjoFreezerLeader && (p.id ? p.id === skyjoFreezerLeader.id : p.name === skyjoFreezerLeader.name) && maxSkyjoFreezer > 0) {
      p.badges.push({
        id: 'skyjo_freezer',
        title: 'Le Frigo',
        desc: `${p.skyjoFreezerCount} manche${p.skyjoFreezerCount > 1 ? 's' : ''} ≤ 0 pt`,
        explanation: 'Attribué pour avoir réalisé le plus grand nombre de manches parfaites à 0 point ou moins au Skyjo.',
        type: 'blue',
        iconName: 'Snowflake',
      })
    }

    if (skyjoDoubledLeader && (p.id ? p.id === skyjoDoubledLeader.id : p.name === skyjoDoubledLeader.name) && maxSkyjoDoubled > 0) {
      p.badges.push({
        id: 'skyjo_doubled',
        title: "L'Arroseur Arrosé",
        desc: `${p.skyjoDoubledCount} clôture${p.skyjoDoubledCount > 1 ? 's' : ''} doublée${p.skyjoDoubledCount > 1 ? 's' : ''}`,
        explanation: 'Attribué au joueur ayant le plus souvent subi le score doublé pour clôture hâtive au Skyjo.',
        type: 'rose',
        iconName: 'AlertTriangle',
      })
    }

    if (caracoleReprieveLeader && (p.id ? p.id === caracoleReprieveLeader.id : p.name === caracoleReprieveLeader.name) && maxCaracoleReprieve > 0) {
      p.badges.push({
        id: 'caracole_reprieve',
        title: 'Le Miraculé du Sursis',
        desc: `${p.caracoleReprieveCount} sursis obtenu${p.caracoleReprieveCount > 1 ? 's' : ''}`,
        explanation: 'Attribué au joueur ayant le plus souvent bénéficié du sursis en tombant pile sur la limite de points à la Caracole.',
        type: 'blue',
        iconName: 'ShieldAlert',
      })
    }

    if (dameChelemLeader && (p.id ? p.id === dameChelemLeader.id : p.name === dameChelemLeader.name) && maxDameChelem > 0) {
      p.badges.push({
        id: 'dame_grand_chelem',
        title: 'Grand Chelemard',
        desc: `${p.dameChelemCount} Grand${p.dameChelemCount > 1 ? 's' : ''} Chelem`,
        explanation: 'Attribué pour avoir réussi le Grand Chelem (Shoot the Moon) en prenant tous les Cœurs et la Dame de Pique.',
        type: 'purple',
        iconName: 'Target',
      })
    }

    if (sixTightropeLeader && (p.id ? p.id === sixTightropeLeader.id : p.name === sixTightropeLeader.name) && bestSixTightropeScore >= 55) {
      p.badges.push({
        id: 'six_tightrope',
        title: 'Funambule',
        desc: `Fini à ${p.bestSixTightrope} têtes`,
        explanation: 'Attribué pour avoir terminé une partie de 6 qui prend au plus près des 66 têtes de bœuf sans se faire éliminer.',
        type: 'emerald',
        iconName: 'ShieldCheck',
      })
    }

    if (sixGluttonLeader && (p.id ? p.id === sixGluttonLeader.id : p.name === sixGluttonLeader.name) && maxSixGluttonBulls >= 18) {
      p.badges.push({
        id: 'six_glutton',
        title: 'Goinfre de Bœufs',
        desc: `Record : ${p.maxSixGluttonBulls} bœufs`,
        explanation: 'Attribué pour avoir encaissé le plus grand nombre de têtes de bœuf en une seule manche à 6 qui prend.',
        type: 'rose',
        iconName: 'Skull',
      })
    }

    if (flip7BonusLeader && (p.id ? p.id === flip7BonusLeader.id : p.name === flip7BonusLeader.name) && maxFlip7Bonus > 0) {
      p.badges.push({
        id: 'flip7_bonus',
        title: 'Le Septième Ciel',
        desc: `${p.flip7BonusCount} bonus Flip 7`,
        explanation: 'Attribué pour avoir validé le plus grand nombre de bonus Flip 7 (+15 points pour 7 cartes distinctes).',
        type: 'amber',
        iconName: 'Flame',
      })
    }

    if (yanivAssafLeader && (p.id ? p.id === yanivAssafLeader.id : p.name === yanivAssafLeader.name) && maxYanivAssaf > 0) {
      p.badges.push({
        id: 'yaniv_assaf',
        title: 'Contre-ASSAF',
        desc: `${p.yanivAssafCount} contre-ASSAF`,
        explanation: 'Attribué pour avoir infligé le plus de contres ASSAF à un joueur ayant imprudemment annoncé Yaniv.',
        type: 'rose',
        iconName: 'Swords',
      })
    }

    if (beloteCapotLeader && (p.id ? p.id === beloteCapotLeader.id : p.name === beloteCapotLeader.name) && maxBeloteCapot > 0) {
      p.badges.push({
        id: 'belote_capot',
        title: 'Le Capot Magique',
        desc: `${p.beloteCapotCount} capot${p.beloteCapotCount > 1 ? 's' : ''} réussi${p.beloteCapotCount > 1 ? 's' : ''}`,
        explanation: 'Attribué pour avoir mené son camp au plus grand nombre de Capots complets à la Belote / Coinche.',
        type: 'gold',
        iconName: 'Crown',
      })
    }

    if (tarotPetitLeader && (p.id ? p.id === tarotPetitLeader.id : p.name === tarotPetitLeader.name) && maxTarotPetit > 0) {
      p.badges.push({
        id: 'tarot_petit_bout',
        title: 'Le Petit au Bout',
        desc: `${p.tarotPetitCount} Petit${p.tarotPetitCount > 1 ? 's' : ''} au bout`,
        explanation: 'Attribué pour avoir emmené le plus souvent le Petit au dernier pli en attaque au Tarot.',
        type: 'purple',
        iconName: 'Wand2',
      })
    }

    if (seasaltSirensLeader && (p.id ? p.id === seasaltSirensLeader.id : p.name === seasaltSirensLeader.name) && maxSeasaltSirens > 0) {
      p.badges.push({
        id: 'seasalt_sirens',
        title: 'Le Chant des Sirènes',
        desc: `${p.seasaltSirensCount} victoire${p.seasaltSirensCount > 1 ? 's' : ''} aux Sirènes`,
        explanation: 'Attribué pour avoir réussi la mythique victoire immédiate aux 4 Sirènes à Sea Salt & Paper.',
        type: 'blue',
        iconName: 'Anchor',
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
  {
    id: 'master_symbiose',
    gameType: GAMES.SYMBIOSE,
    title: 'Symbiose Parfaite',
    category: 'Symbiose',
    condition: 'Avoir remporté le plus grand nombre de victoires à Symbiose.',
    description: 'L’expert de la mare capable d’harmoniser animaux et saisons pour créer l’écosystème le plus florissant.',
    color: 'emerald',
    iconName: 'FrogFace',
  },
  {
    id: 'master_molkky',
    gameType: GAMES.MOLKKY,
    title: 'Vrai Finlandais',
    category: 'Mölkky',
    condition: 'Avoir remporté le plus grand nombre de victoires au Mölkky.',
    description: 'Le maître des quilles biseautées capable de viser avec une précision chirurgicale pour faire pile 50 points.',
    color: 'amber',
    iconName: 'Target',
  },
  {
    id: 'master_yam',
    gameType: GAMES.YAM,
    title: 'Cinq Dés Parfaits',
    category: "Yam's",
    condition: "Avoir remporté le plus grand nombre de victoires au Yam's.",
    description: 'L’expert des 5 dés, des combinaisons stratégiques et du mythique Yam’s à 50 points.',
    color: 'rose',
    iconName: 'Dices',
  },
  {
    id: 'master_dixit',
    gameType: GAMES.DIXIT,
    title: 'Grand Conteur',
    category: 'Dixit',
    condition: 'Avoir remporté le plus grand nombre de victoires à Dixit.',
    description: 'Le joueur poète et perspicace dont les indices équilibrés et les illustrations inspirées mènent au seuil des 30 points.',
    color: 'purple',
    iconName: 'Eye',
  },
  {
    id: 'general_phoenix',
    title: 'Le Phénix',
    category: 'Général',
    condition: 'Avoir été dernier en cours de partie (au moins 2 manches disputées) et remporter la victoire finale.',
    description: 'La consécration de la plus belle remontada : ne jamais abandonner, même au fond du gouffre.',
    color: 'amber',
    iconName: 'TrendingUp',
  },
  {
    id: 'general_chameleon',
    title: 'Le Caméléon',
    category: 'Général',
    condition: 'Avoir disputé au moins une partie sur au moins 5 jeux différents de l’Ardoise.',
    description: 'Célèbre les joueurs polyvalents et curieux capables de s’adapter à toutes les mécaniques.',
    color: 'blue',
    iconName: 'Compass',
  },
  {
    id: 'general_close_call',
    title: 'Sur le Fil',
    category: 'Général',
    condition: 'Avoir remporté une partie terminée avec exactement 1 seul point d’écart sur le deuxième.',
    description: 'Récompense le sang-froid absolu et la victoire la plus serrée dans le money-time.',
    color: 'emerald',
    iconName: 'Zap',
  },
  {
    id: 'general_night_owl',
    title: 'Oiseau de Nuit',
    category: 'Général',
    condition: 'Avoir terminé une partie enregistrée entre minuit et 5 heures du matin.',
    description: 'Clin d’œil complice aux couche-tard et aux fins de soirées mémorables autour de la table.',
    color: 'purple',
    iconName: 'Moon',
  },
  {
    id: 'general_marathon',
    title: 'Le Marathonien',
    category: 'Général',
    condition: 'Avoir disputé la plus longue partie enregistrée de la table (minimum 8 manches).',
    description: 'L’hommage à l’endurance et aux batailles acharnées qui s’étirent manche après manche.',
    color: 'gold',
    iconName: 'Timer',
  },
  {
    id: 'symbiose_duo',
    gameType: GAMES.SYMBIOSE,
    title: 'Duo Fusionnel',
    category: 'Symbiose',
    condition: 'Avoir remporté le plus grand nombre de victoires en mode Équipe 2v2 à Symbiose.',
    description: 'L’harmonie collective parfaite : synchroniser deux mares pour triompher en équipe.',
    color: 'rose',
    iconName: 'Users',
  },
  {
    id: 'symbiose_master_pond',
    gameType: GAMES.SYMBIOSE,
    title: 'Écosystème Idéal',
    category: 'Symbiose',
    condition: 'Détenir le record du score de Mare individuel sur une manche à Symbiose (minimum 35 points).',
    description: 'Une mare d’exception combinant biodiversité végétale et harmonie animale sans gaspillage.',
    color: 'emerald',
    iconName: 'FrogFace',
  },
  {
    id: 'skyjo_freezer',
    gameType: GAMES.SKYJO,
    title: 'Le Frigo',
    category: 'Skyjo',
    condition: 'Avoir réussi une manche avec un score inférieur ou égal à 0 point au Skyjo.',
    description: 'L’art du gel absolu : colonnes éliminées et cartes négatives alignées au cordeau.',
    color: 'blue',
    iconName: 'Snowflake',
  },
  {
    id: 'skyjo_doubled',
    gameType: GAMES.SKYJO,
    title: "L'Arroseur Arrosé",
    category: 'Skyjo',
    condition: 'Avoir subi le score doublé pour avoir clôturé la manche sans avoir le score le plus bas au Skyjo.',
    description: 'Un hommage bienveillant au joueur qui a voulu fermer trop vite et en a payé le prix fort.',
    color: 'rose',
    iconName: 'AlertTriangle',
  },
  {
    id: 'caracole_reprieve',
    gameType: GAMES.CARACOLE,
    title: 'Le Miraculé du Sursis',
    category: 'Caracole',
    condition: 'Avoir bénéficié du sursis officiel en tombant exactement sur la limite de points à la Caracole.',
    description: 'Sauvé in extremis des mâchoires de l’élimination pour retomber miraculeusement à 50 points.',
    color: 'blue',
    iconName: 'ShieldAlert',
  },
  {
    id: 'dame_grand_chelem',
    gameType: GAMES.DAME_DE_PIQUE,
    title: 'Grand Chelemard',
    category: 'Dame de Pique',
    condition: 'Avoir réussi le Grand Chelem (Shoot the Moon) en ramassant les 13 Cœurs et la Dame de Pique.',
    description: 'Le coup de poker ultime qui inflige 26 points de pénalité à tous les adversaires.',
    color: 'purple',
    iconName: 'Target',
  },
  {
    id: 'six_tightrope',
    gameType: GAMES.SIX_QUI_PREND,
    title: 'Funambule',
    category: '6 qui prend',
    condition: 'Avoir terminé une partie de 6 qui prend avec un score entre 55 et 65 têtes de bœuf sans sauter.',
    description: 'Marcher sur la corde raide au bord de la falaise des 66 têtes sans jamais chuter.',
    color: 'emerald',
    iconName: 'ShieldCheck',
  },
  {
    id: 'six_glutton',
    gameType: GAMES.SIX_QUI_PREND,
    title: 'Goinfre de Bœufs',
    category: '6 qui prend',
    condition: 'Avoir ramassé 18 têtes de bœuf ou plus en une seule manche à 6 qui prend.',
    description: 'Le festin indigeste qu’on aurait préféré éviter, mais dont la tablée se souviendra longtemps !',
    color: 'rose',
    iconName: 'Skull',
  },
  {
    id: 'flip7_bonus',
    gameType: GAMES.FLIP_7,
    title: 'Le Septième Ciel',
    category: 'Flip 7',
    condition: 'Avoir déclenché le bonus Flip 7 (+15 points pour 7 cartes différentes posées).',
    description: 'Le graal du stop-ou-encore : aligner 7 valeurs distinctes sans jamais piocher de doublon.',
    color: 'amber',
    iconName: 'Flame',
  },
  {
    id: 'yaniv_assaf',
    gameType: GAMES.YANIV,
    title: 'Contre-ASSAF',
    category: 'Yaniv',
    condition: 'Avoir contré un joueur ayant annoncé Yaniv et lui infliger les 30 points de pénalité ASSAF.',
    description: 'La contre-attaque cinglante qui foudroie l’adversaire persuadé d’avoir la main la plus basse.',
    color: 'rose',
    iconName: 'Swords',
  },
  {
    id: 'belote_capot',
    gameType: GAMES.BELOTE,
    title: 'Le Capot Magique',
    category: 'Belote / Coinche',
    condition: 'Avoir réussi un Capot complet (252 points ou 162 pts de plis) en tant que preneur à la Belote.',
    description: 'La domination absolue : remporter l’intégralité des 8 plis sans rien laisser aux adversaires.',
    color: 'gold',
    iconName: 'Crown',
  },
  {
    id: 'tarot_petit_bout',
    gameType: GAMES.TAROT,
    title: 'Le Petit au Bout',
    category: 'Tarot',
    condition: 'Avoir mené victorieusement le Petit au dernier pli en attaque au Tarot.',
    description: 'L’exploit aristocratique du Tarot : faire triompher le numéro 1 d’atout sur l’ultime levée.',
    color: 'purple',
    iconName: 'Wand2',
  },
  {
    id: 'seasalt_sirens',
    gameType: GAMES.SEA_SALT_PAPER,
    title: 'Le Chant des Sirènes',
    category: 'Sea Salt & Paper',
    condition: 'Avoir remporté immédiatement une manche en réunissant les 4 cartes Sirène.',
    description: 'La légende des mers : une victoire éclair foudroyante qui met fin à la manche sur le champ.',
    color: 'blue',
    iconName: 'Anchor',
  },
]
