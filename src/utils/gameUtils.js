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

  // Traitement spécifique Belote / Coinche par équipe (4 joueurs = 2 équipes de 2)
  if (
    game &&
    (game.type === 'belote' || game.type === 'coinche') &&
    Array.isArray(game.players) &&
    game.players.length === 4
  ) {
    const p1 = game.players[0]
    const p2 = game.players[1]
    const p3 = game.players[2]
    const p4 = game.players[3]
    const sTeam1 = scores[p1?.id] != null ? scores[p1.id] : 0
    const sTeam2 = scores[p3?.id] != null ? scores[p3.id] : 0

    if (sTeam1 >= sTeam2) {
      const isTie = sTeam1 === sTeam2
      return [
        { id: p1.id, score: sTeam1, rank: 1 },
        { id: p2.id, score: sTeam1, rank: 1 },
        { id: p3.id, score: sTeam2, rank: isTie ? 1 : 2 },
        { id: p4.id, score: sTeam2, rank: isTie ? 1 : 2 },
      ]
    } else {
      return [
        { id: p3.id, score: sTeam2, rank: 1 },
        { id: p4.id, score: sTeam2, rank: 1 },
        { id: p1.id, score: sTeam1, rank: 2 },
        { id: p2.id, score: sTeam1, rank: 2 },
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

const MAX_GAP_MS = 15 * 60 * 1000 // 15 min — pauses au-delà ignorées

export function computePlayDuration(game) {
  const { rounds = [], startedAt, finishedAt } = game
  const end = finishedAt || Date.now()
  const hasSavedAt = rounds.length > 0 && rounds[0].savedAt != null

  if (!hasSavedAt) {
    // Fallback anciennes parties : plafond à N × 20 min
    const raw = end - startedAt
    const cap = Math.max(rounds.length, 1) * 20 * 60 * 1000
    return Math.min(raw, cap)
  }

  // Nouvelles parties : somme des gaps inter-manches écrêtés
  let total = 0
  let prev = startedAt
  for (const round of rounds) {
    total += Math.min(round.savedAt - prev, MAX_GAP_MS)
    prev = round.savedAt
  }
  if (finishedAt) total += Math.min(finishedAt - prev, MAX_GAP_MS)
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

