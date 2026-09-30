// Moteurs de calcul officiels pour chaque jeu

import { TAROT_BOUTS_THRESHOLDS, TAROT_CONTRACTS, PRESIDENT_ROLES } from '../constants/games'

// --- SKYJO ---
export function isSkyjoScoreDoubled(roundScores, closerId) {
  if (!closerId || roundScores[closerId] == null) return false
  const closerScore = roundScores[closerId]
  if (closerScore <= 0) return false
  const otherScores = Object.entries(roundScores)
    .filter(([id]) => id !== closerId)
    .map(([, s]) => s)
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
export function computeTarotScore({
  players,
  attackerId,
  partnerId,
  contract,
  bouts,
  points,
  playerCount,
  petitAuBout = 'none', // 'none' | 'attack' | 'defense'
}) {
  const meta = TAROT_CONTRACTS.find(c => c.id === contract)
  const threshold = TAROT_BOUTS_THRESHOLDS[bouts]
  const diff = points - threshold
  const won = diff >= 0

  let petitBonus = 0
  if (petitAuBout === 'attack') petitBonus = 10
  else if (petitAuBout === 'defense') petitBonus = -10

  // Base signée du point de vue de l'attaque avant multiplicateur
  const signedBase = (won ? 25 + Math.abs(diff) : -(25 + Math.abs(diff))) + petitBonus
  const unitScore = signedBase * meta.multiplier

  const scores = {}
  if (playerCount === 5 && partnerId && partnerId !== attackerId) {
    // 2 contre 3 (attaquant 2 parts, partenaire 1 part, 3 défenseurs -1 part chacun)
    players.forEach(p => {
      if (p.id === attackerId) scores[p.id] = unitScore * 2
      else if (p.id === partnerId) scores[p.id] = unitScore
      else scores[p.id] = -unitScore
    })
  } else {
    // 1 contre (N - 1)
    const n = playerCount
    players.forEach(p => {
      if (p.id === attackerId) scores[p.id] = unitScore * (n - 1)
      else scores[p.id] = -unitScore
    })
  }
  return { scores, won, diff, base: Math.abs(unitScore) }
}

// --- BELOTE / COINCHE ---
export function computeBeloteScore({
  variant = 'belote',
  contract = 82,
  announcements = 0,
  takerTeam = 'nous',
  pointsTaker = 82,
  coincheMultiplier = 1,
}) {
  const total = 162
  const ann = announcements || 0
  const mult = coincheMultiplier || 1
  let takerScore = 0
  let defenseScore = 0

  if (variant === 'coinche') {
    // Mode COINCHE (enchères 80-160, Capot, Générale + Coinche x2/x4)
    if (contract === 500) {
      // Générale
      const won = pointsTaker === total
      takerScore = won ? 500 * mult + 162 + ann : 0
      defenseScore = won ? 0 : 162 + 500 * mult + ann
    } else if (contract === 250 || contract === 252) {
      // Capot
      const won = pointsTaker === total
      takerScore = won ? 250 * mult + 162 + ann : 0
      defenseScore = won ? 0 : 162 + 250 * mult + ann
    } else {
      // Enchère chiffrée
      const won = (pointsTaker + ann) >= contract && pointsTaker >= 82
      if (won) {
        takerScore = (contract * mult) + pointsTaker + ann
        defenseScore = total - pointsTaker
      } else {
        takerScore = 0
        defenseScore = total + (contract * mult) + ann
      }
    }
  } else {
    // Mode BELOTE CLASSIQUE (Prise simple ≥ 82 pts ou Capot 252 pts)
    if (contract === 252 || contract === 250) {
      const won = pointsTaker === total
      takerScore = won ? 252 + ann : 0
      defenseScore = won ? 0 : 162 + 252 + ann
    } else {
      // Prise standard
      const won = pointsTaker >= 82
      if (won) {
        takerScore = pointsTaker + ann
        defenseScore = total - pointsTaker
      } else {
        takerScore = 0
        defenseScore = total + ann
      }
    }
  }

  return {
    [takerTeam]: takerScore,
    [takerTeam === 'nous' ? 'eux' : 'nous']: defenseScore,
  }
}

// --- PRÉSIDENT (Trou du cul) ---
export function getPresidentRole(rank, total) {
  if (rank === 1) return PRESIDENT_ROLES[0]
  if (rank === total) return PRESIDENT_ROLES[4]
  if (total >= 4 && rank === 2) return PRESIDENT_ROLES[1]
  if (total >= 4 && rank === total - 1) return PRESIDENT_ROLES[3]
  return PRESIDENT_ROLES[2]
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
