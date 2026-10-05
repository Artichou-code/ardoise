import { generateId } from '../store/storage'
import { AVATAR_COLORS, PRESET_AVATARS } from '../constants/games'

export function createPlayer(name, color, avatar) {
  const cleanName = name.trim()
  const chosenAvatar =
    avatar !== undefined
      ? avatar
      : PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)]
  return {
    id: generateId(),
    name: cleanName,
    color: color || AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    avatar: chosenAvatar, // null si mode Initiale choisi explicitement
    createdAt: Date.now(),
  }
}

export function getPlayerInitial(player) {
  if (!player || !player.name) return '?'
  const trimmed = player.name.trim()
  return trimmed.charAt(0).toUpperCase()
}

/**
 * Formate et abrège élégamment les noms d'une équipe de plusieurs joueurs pour les cartes compactes
 * - "Player 1 & Player 3" -> "P1 & P3"
 * - Noms longs (> 5 lettres) -> "Alex. & Guil."
 */
export function formatTeamNames(players, maxLen = 8) {
  if (!players || !Array.isArray(players) || players.length === 0) return ''
  return players.map(p => {
    const name = (p?.name || '').trim()
    const match = name.match(/^(?:Player|Joueur)\s*(\d+)$/i)
    if (match) return `P${match[1]}`
    if (name.length > maxLen) return name.slice(0, maxLen - 1) + '.'
    return name
  }).join(' & ')
}

export function getPlayerAvatarUrl(player) {
  if (!player) return null
  // Si avatar explicitement mis à null (mode initiale), renvoyer null
  if (player.avatar === null) return null
  if (player.avatar) return player.avatar
  // Pour les équipes rapides Nous / Eux, garder l'initiale
  if (player.name === 'Nous' || player.name === 'Eux') return null
  // Pour les joueurs existants sans champ avatar, attribuer un avatar Arena.photo stable selon le nom
  const seed = (player.name || player.id || 'A')
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return PRESET_AVATARS[seed % PRESET_AVATARS.length]
}

export function getLeader(scores) {
  if (!scores || Object.keys(scores).length === 0) return null
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0]
}

export function getLowest(scores) {
  if (!scores || Object.keys(scores).length === 0) return null
  return Object.entries(scores).sort((a, b) => a[1] - b[1])[0][0]
}

export function getRanking(scores, direction = 'high', game = null) {
  if (!scores || Object.keys(scores).length === 0) return []

  // Traitement spécifique Belote / Coinche / Symbiose (mode équipe) (4 joueurs = 2 équipes de 2)
  if (
    game &&
    ((game.type === 'belote' || game.type === 'coinche') ||
      (game.type === 'symbiose' && (game.config?.mode === 'team' || game.mode === 'team' || game.isTeamMode === true || game.rounds?.some(r => r.isTeamMode)))) &&
    Array.isArray(game.players) &&
    game.players.length === 4
  ) {
    const p1 = game.players[0]
    const p2 = game.players[1]
    const p3 = game.players[2]
    const p4 = game.players[3]

    // À la Belote, scores[p1.id] est le score de l'équipe 1.
    // À Symbiose en mode équipe, le score de l'équipe est la somme des 2 mares des partenaires.
    const sTeam1 = game.type === 'symbiose'
      ? (scores[p1?.id] != null ? scores[p1.id] : 0) + (scores[p2?.id] != null ? scores[p2.id] : 0)
      : (scores[p1?.id] != null ? scores[p1.id] : 0)
    const sTeam2 = game.type === 'symbiose'
      ? (scores[p3?.id] != null ? scores[p3.id] : 0) + (scores[p4?.id] != null ? scores[p4.id] : 0)
      : (scores[p3?.id] != null ? scores[p3.id] : 0)

    if (sTeam1 >= sTeam2) {
      const isTie = sTeam1 === sTeam2
      return [
        { id: p1.id, score: game.type === 'symbiose' ? (scores[p1.id] || 0) : sTeam1, teamScore: sTeam1, rank: 1 },
        { id: p2.id, score: game.type === 'symbiose' ? (scores[p2.id] || 0) : sTeam1, teamScore: sTeam1, rank: 1 },
        { id: p3.id, score: game.type === 'symbiose' ? (scores[p3.id] || 0) : sTeam2, teamScore: sTeam2, rank: isTie ? 1 : 2 },
        { id: p4.id, score: game.type === 'symbiose' ? (scores[p4.id] || 0) : sTeam2, teamScore: sTeam2, rank: isTie ? 1 : 2 },
      ]
    } else {
      return [
        { id: p3.id, score: game.type === 'symbiose' ? (scores[p3.id] || 0) : sTeam2, teamScore: sTeam2, rank: 1 },
        { id: p4.id, score: game.type === 'symbiose' ? (scores[p4.id] || 0) : sTeam2, teamScore: sTeam2, rank: 1 },
        { id: p1.id, score: game.type === 'symbiose' ? (scores[p1.id] || 0) : sTeam1, teamScore: sTeam1, rank: 2 },
        { id: p2.id, score: game.type === 'symbiose' ? (scores[p2.id] || 0) : sTeam1, teamScore: sTeam1, rank: 2 },
      ]
    }
  }

  const sorted = Object.entries(scores).sort((a, b) =>
    direction === 'high' ? b[1] - a[1] : a[1] - b[1]
  )

  let currentRank = 1
  return sorted.map(([id, score], idx) => {
    if (idx > 0 && score !== sorted[idx - 1][1]) {
      currentRank = idx + 1
    }
    return { id, score, rank: currentRank }
  })
}

/**
 * Extrait et structure les données d'équipes pour Belote/Coinche et Symbiose (mode équipe)
 * Renvoie null si le jeu n'est pas un jeu en équipe à 4 joueurs.
 */
export function getTeamGameData(game) {
  if (!game || !Array.isArray(game.players) || game.players.length !== 4) return null
  const isBelote = game.type === 'belote' || game.type === 'coinche'
  const isSymbioseTeam =
    game.type === 'symbiose' &&
    (game.config?.mode === 'team' || game.mode === 'team' || game.isTeamMode === true || game.rounds?.some(r => r.isTeamMode))
  if (!isBelote && !isSymbioseTeam) return null

  const pNous = [game.players[0], game.players[1]].filter(Boolean)
  const pEux = [game.players[2], game.players[3]].filter(Boolean)
  const scores = game.scores || {}

  const p0 = scores[pNous[0]?.id] != null ? scores[pNous[0]?.id] : 0
  const p1 = scores[pNous[1]?.id] != null ? scores[pNous[1]?.id] : 0
  const p2 = scores[pEux[0]?.id] != null ? scores[pEux[0]?.id] : 0
  const p3 = scores[pEux[1]?.id] != null ? scores[pEux[1]?.id] : 0

  const scoreNous = isSymbioseTeam ? p0 + p1 : p0
  const scoreEux = isSymbioseTeam ? p2 + p3 : p2
  const hasRounds = (game.rounds?.length || 0) > 0
  const isFinished = game.status === 'finished'

  const isTie = scoreNous === scoreEux
  const rankNous = !hasRounds ? 1 : scoreNous >= scoreEux ? 1 : 2
  const rankEux = !hasRounds ? 1 : scoreEux >= scoreNous ? 1 : 2

  const teamNous = {
    id: 'nous',
    label: formatTeamNames(pNous, 12),
    labelFull: pNous.map(p => p.name).join(' & '),
    players: pNous,
    score: scoreNous,
    detail: isSymbioseTeam && hasRounds ? `${p0} + ${p1}` : null,
    rank: rankNous,
    isWinner: isFinished && (scoreNous > scoreEux || isTie),
    isLeader: hasRounds && !isFinished && (scoreNous >= scoreEux),
  }

  const teamEux = {
    id: 'eux',
    label: formatTeamNames(pEux, 12),
    labelFull: pEux.map(p => p.name).join(' & '),
    players: pEux,
    score: scoreEux,
    detail: isSymbioseTeam && hasRounds ? `${p2} + ${p3}` : null,
    rank: rankEux,
    isWinner: isFinished && (scoreEux > scoreNous || isTie),
    isLeader: hasRounds && !isFinished && (scoreEux >= scoreNous),
  }

  // Trier pour présenter l'équipe en tête à gauche
  const teams = scoreEux > scoreNous ? [teamEux, teamNous] : [teamNous, teamEux]

  return {
    isTeamGame: true,
    isSymbioseTeam,
    teams,
  }
}

const MAX_GAP_MS = 15 * 60 * 1000 // 15 min — pauses au-delà ignorées

function parseTimestamp(val) {
  if (!val) return 0
  if (typeof val === 'number') return isNaN(val) ? 0 : val
  const parsed = new Date(val).getTime()
  return isNaN(parsed) ? 0 : parsed
}

export function computePlayDuration(game) {
  if (!game) return 0
  const rounds = Array.isArray(game.rounds) ? game.rounds : []
  if (rounds.length === 0) return 0

  const startedAt = parseTimestamp(game.startedAt)
  const finishedAt = parseTimestamp(game.finishedAt)
  const end = finishedAt || parseTimestamp(game.updatedAt) || Date.now()

  const hasSavedAt = rounds[0]?.savedAt != null

  if (!hasSavedAt) {
    // Fallback anciennes parties : plafond à N × 20 min
    const raw = Math.max(0, end - (startedAt || end))
    const cap = rounds.length * 20 * 60 * 1000
    return Math.min(raw, cap)
  }

  // Nouvelles parties : somme des gaps inter-manches écrêtés
  let total = 0
  let prev = startedAt || parseTimestamp(rounds[0].savedAt)
  for (const round of rounds) {
    if (round && round.savedAt != null) {
      const rTime = parseTimestamp(round.savedAt)
      const delta = rTime - prev
      if (delta > 0) {
        total += Math.min(delta, MAX_GAP_MS)
      }
      prev = rTime
    }
  }
  if (finishedAt && finishedAt > prev) {
    total += Math.min(finishedAt - prev, MAX_GAP_MS)
  }
  return total
}

export function formatDuration(ms) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}h${String(m % 60).padStart(2, '0')}`
  return `${m}min${String(s % 60).padStart(2, '0')}`
}

export function formatDate(ts) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(ts))
}

export function formatShortDate(ts) {
  if (!ts) return ''
  const date = new Date(ts)
  const isSameYear = date.getFullYear() === new Date().getFullYear()
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    ...(isSameYear ? {} : { year: '2-digit' }),
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatGameStart(ts) {
  if (!ts) return ''
  const date = new Date(ts)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const timeStr = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)

  if (isToday) {
    return `aujourd'hui à ${timeStr}`
  }

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return `hier à ${timeStr}`
  }

  const isSameYear = date.getFullYear() === now.getFullYear()
  const dayMonth = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    ...(isSameYear ? {} : { year: 'numeric' }),
  }).format(date)

  return `le ${dayMonth} à ${timeStr}`
}

