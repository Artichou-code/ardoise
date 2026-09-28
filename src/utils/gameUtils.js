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

export function getRanking(scores, direction = 'high') {
  return Object.entries(scores)
    .sort((a, b) => direction === 'high' ? b[1] - a[1] : a[1] - b[1])
    .map(([id, score], idx) => ({ id, score, rank: idx + 1 }))
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
