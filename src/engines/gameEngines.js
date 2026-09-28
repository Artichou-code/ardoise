// Moteurs de calcul pour chaque jeu

import { TAROT_BOUTS_THRESHOLDS, TAROT_CONTRACTS, PRESIDENT_ROLES } from '../constants/games'

// --- SKYJO ---
export function computeSkyjoRound(scores, roundScores, closerId) {
  // Si le fermer n'a pas le score le plus bas → son score est doublé
  const minScore = Math.min(...Object.values(roundScores))
  const closerScore = roundScores[closerId]
  const adjusted = { ...roundScores }
  if (closerScore > minScore) {
    adjusted[closerId] = closerScore * 2
  }
  // Accumuler
  const newScores = {}
  for (const id in scores) {
    newScores[id] = (scores[id] || 0) + (adjusted[id] || 0)
  }
  return { newScores, adjusted }
}

export function checkSkyjoEnd(scores) {
  return Object.entries(scores).find(([, s]) => s >= 100)
}

// --- TAROT ---
export function computeTarotScore({ players, attackerId, partnerId, contract, bouts, points, playerCount }) {
  const meta = TAROT_CONTRACTS.find(c => c.id === contract)
  const threshold = TAROT_BOUTS_THRESHOLDS[bouts]
  const diff = points - threshold
  const base = (25 + Math.abs(diff)) * meta.multiplier
  const won = diff >= 0

  // Répartition selon nombre de joueurs
  let scores = {}
  if (playerCount === 5 && partnerId) {
    const attackPoints = won ? base * 2 : -base * 2
    const defensePoints = won ? -base : base
    players.forEach(p => {
      if (p.id === attackerId) scores[p.id] = attackPoints
      else if (p.id === partnerId) scores[p.id] = attackPoints / 2
      else scores[p.id] = defensePoints
    })
  } else {
    const n = playerCount
    const attackPoints = won ? base * (n - 1) : -base * (n - 1)
    const defensePoints = won ? -base : base
    players.forEach(p => {
      if (p.id === attackerId) scores[p.id] = attackPoints
      else scores[p.id] = defensePoints
    })
  }
  return { scores, won, diff, base }
}

// --- BELOTE ---
export function computeBeloteScore({ contract, announcements, takerTeam, pointsTaker, capot = false, generale = false }) {
  const total = 162
  const contractValue = capot ? 250 : generale ? 500 : contract

  let takerScore, defenseScore

  if (generale) {
    const won = pointsTaker === total
    takerScore = won ? 500 : -500
    defenseScore = won ? -500 : 500
  } else if (capot) {
    const won = pointsTaker === total
    takerScore = won ? 250 : 0
    defenseScore = won ? 0 : 250
  } else {
    const won = pointsTaker >= contractValue
    if (won) {
      takerScore = contractValue + (announcements || 0)
      defenseScore = total - takerScore
    } else {
      defenseScore = contractValue + total - pointsTaker + (announcements || 0)
      takerScore = 0
    }
  }

  return {
    [takerTeam]: takerScore,
    [takerTeam === 'nous' ? 'eux' : 'nous']: defenseScore,
  }
}

// --- PRÉSIDENT ---
export function computePresidentScores(playerOrder) {
  // playerOrder: array of player ids in order of finish (1er = Président, dernier = Trou)
  const n = playerOrder.length
  const scores = {}
  playerOrder.forEach((id, idx) => {
    const role = PRESIDENT_ROLES[Math.min(idx, PRESIDENT_ROLES.length - 1)]
    // Plus précis : distribute roles selon N joueurs
    scores[id] = role.points
  })
  return scores
}

export function getPresidentRole(rank, total) {
  if (rank === 1) return PRESIDENT_ROLES[0]
  if (rank === 2) return PRESIDENT_ROLES[1]
  if (rank === total) return PRESIDENT_ROLES[4]
  if (rank === total - 1) return PRESIDENT_ROLES[3]
  return PRESIDENT_ROLES[2]
}
