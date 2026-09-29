const SESSION_KEY = 'ardoise_active_live_session'
const API_BASE = '/api'

export function getActiveSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveActiveSession(session) {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } else {
    localStorage.removeItem(SESSION_KEY)
  }
}

export function clearActiveSession() {
  localStorage.removeItem(SESSION_KEY)
}

/**
 * Crée une session de journée sur le serveur
 */
export async function createLiveSession(name, hostName, participants = []) {
  const res = await fetch(`${API_BASE}/sessions/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: name || 'Session Journée',
      host: hostName || 'Hôte',
      participants,
      state: {
        name: name || 'Session Journée',
        createdAt: new Date().toISOString(),
        host: hostName || 'Hôte',
        participants,
        games: [],
      },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Impossible de créer la session')
  }

  const data = await res.json()
  const localSession = {
    code: data.sessionCode,
    name: name || 'Session Journée',
    host: hostName || 'Hôte',
    isHost: true,
  }
  saveActiveSession(localSession)
  return data.sessionCode
}

/**
 * Récupère l'état actuel d'une session
 */
export async function fetchLiveSession(code) {
  const cleanCode = (code || '').trim().toUpperCase()
  if (!cleanCode) throw new Error('Code de session manquant')

  const res = await fetch(`${API_BASE}/sessions/${encodeURIComponent(cleanCode)}`, {
    headers: { 'Cache-Control': 'no-cache' },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Session introuvable')
  }

  return await res.json()
}

/**
 * Rejoindre une session existante
 */
export async function joinLiveSession(code, playerName) {
  const sessionData = await fetchLiveSession(code)
  const state = sessionData.state || {}
  const participants = Array.isArray(state.participants) ? [...state.participants] : []

  if (playerName && !participants.some((p) => p.name?.toLowerCase() === playerName.toLowerCase())) {
    participants.push({ name: playerName, joinedAt: new Date().toISOString() })
    state.participants = participants

    await fetch(`${API_BASE}/sessions/${encodeURIComponent(code)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state }),
    })
  }

  const localSession = {
    code: sessionData.sessionCode,
    name: state.name || 'Session Journée',
    host: sessionData.hostName,
    isHost: false,
    playerName,
  }
  saveActiveSession(localSession)
  return sessionData
}

/**
 * Met à jour les données de la session (ex: après une partie jouée)
 */
export async function pushGameToLiveSession(code, game) {
  if (!code || !game) return
  try {
    const sessionData = await fetchLiveSession(code)
    const state = sessionData.state || {}
    const games = Array.isArray(state.games) ? [...state.games] : []

    const idx = games.findIndex((g) => g.id === game.id)
    if (idx >= 0) {
      games[idx] = game
    } else {
      games.unshift(game)
    }
    state.games = games

    await fetch(`${API_BASE}/sessions/${encodeURIComponent(code)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state }),
    })
  } catch (err) {
    console.error('Erreur pushGameToLiveSession:', err)
  }
}
