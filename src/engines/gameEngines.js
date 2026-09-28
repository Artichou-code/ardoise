// Moteurs de calcul pour chaque jeu

import { TAROT_BOUTS_THRESHOLDS, TAROT_CONTRACTS, PRESIDENT_ROLES } from '../constants/games'

// --- SKYJO ---
export function isSkyjoScoreDoubled(roundScores, closerId) {
  if (!closerId || roundScores[closerId] == null) return false
  const closerScore = roundScores[closerId]
  if (closerScore <= 0) return false
  const otherScores = Object.entries(roundScores)
    .filter(([id]) => id !== closerId)
    .map(([, s]) => s)
  // Doublé s'il n'a pas le score strictement le plus bas
  return otherScores.some(s => s <= closerScore)
}

export function computeSkyjoRound(scores, roundScores, closerId) {
  const adjusted = { ...roundScores }
  if (isSkyjoScoreDoubled(roundScores, closerId)) {
    adjusted[closerId] = roundScores[closerId] * 2
  }
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

  let scores = {}
  if (playerCount === 5 && partnerId && partnerId !== attackerId) {
    const attackPoints = won ? base * 2 : -base * 2
    const partnerPoints = won ? base : -base
    const defensePoints = won ? -base : base
    players.forEach(p => {
      if (p.id === attackerId) scores[p.id] = attackPoints
      else if (p.id === partnerId) scores[p.id] = partnerPoints
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

// --- BELOTE / COINCHE ---
export function computeBeloteScore({ contract, announcements, takerTeam, pointsTaker }) {
  const total = 162
  const ann = announcements || 0
  let takerScore = 0
  let defenseScore = 0

  if (contract === 500) {
    // Générale
    const won = pointsTaker === total
    takerScore = won ? 500 + ann : 0
    defenseScore = won ? 0 : 500 + ann
  } else if (contract === 252) {
    // Capot
    const won = pointsTaker === total
    takerScore = won ? 252 + ann : 0
    defenseScore = won ? 0 : 252 + ann
  } else {
    const won = pointsTaker >= 82 && (pointsTaker + ann) >= contract
    if (won) {
      takerScore = pointsTaker + contract + ann
      defenseScore = total - pointsTaker
    } else {
      takerScore = 0
      defenseScore = total + contract + ann
    }
  }

  return {
    [takerTeam]: takerScore,
    [takerTeam === 'nous' ? 'eux' : 'nous']: defenseScore,
  }
}

// --- PRÉSIDENT (Trou du cul) ---
export function getPresidentRole(rank, total) {
  if (rank === 1) return PRESIDENT_ROLES[0] // Président (+2)
  if (rank === total) return PRESIDENT_ROLES[4] // Trou du cul (-2)
  if (total >= 4 && rank === 2) return PRESIDENT_ROLES[1] // Vice-Président (+1)
  if (total >= 4 && rank === total - 1) return PRESIDENT_ROLES[3] // Vice-Trou (-1)
  return PRESIDENT_ROLES[2] // Neutre (0)
}

export function computePresidentScores(playerOrder) {
  const n = playerOrder.length
  const scores = {}
  playerOrder.forEach((id, idx) => {
    const role = getPresidentRole(idx + 1, n)
    scores[id] = role.points
  })
  return scores
}
