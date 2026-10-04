import { applyNotebook, extractCodeFromInput } from './syncStorage'
import { loadDeletedGameIds } from './storage'

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
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ardoise-live-session-changed', { detail: session || null }))
  }
}

export function clearActiveSession() {
  localStorage.removeItem(SESSION_KEY)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ardoise-live-session-changed', { detail: null }))
  }
}

/**
 * Synchronise les parties d'une session live dans le carnet local (localStorage)
 */
export function syncSessionGamesToLocal(sessionData) {
  const rawGames = Array.isArray(sessionData?.state?.games) ? sessionData.state.games : []
  const deletedIds = new Set(loadDeletedGameIds())
  const games = rawGames.filter(g => g && g.id && !deletedIds.has(g.id))
  if (games.length === 0) {
    return { syncedCount: 0, gamesAdded: 0, playersAdded: 0 }
  }
  const res = applyNotebook({ games, players: [] }, 'merge')
  return {
    syncedCount: games.length,
    gamesAdded: res.stats?.gamesAdded || 0,
    playersAdded: res.stats?.playersAdded || 0,
  }
}

/**
 * Crée une session de journée sur le serveur
 */
export async function createLiveSession(name, hostName, participants = [], initialGames = []) {
  const cleanName = (name || '').trim() || 'Table Ardoise'
  const cleanHost = (hostName || '').trim() || 'Hôte'

  const res = await fetch(`${API_BASE}/sessions/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: cleanName,
      host: cleanHost,
      participants,
      state: {
        name: cleanName,
        createdAt: new Date().toISOString(),
        host: cleanHost,
        closed: false,
        participants,
        games: Array.isArray(initialGames) ? initialGames : [],
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
    name: cleanName,
    host: cleanHost,
    isHost: true,
  }
  saveActiveSession(localSession)
  return data.sessionCode
}

/**
 * Récupère l'état actuel d'une session avec cache-busting
 */
export async function fetchLiveSession(code) {
  const cleanCode = extractCodeFromInput(code)
  if (!cleanCode) throw new Error('Code de session manquant')

  const res = await fetch(`${API_BASE}/sessions/${encodeURIComponent(cleanCode)}?_t=${Date.now()}`, {
    headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Session introuvable')
  }

  return await res.json()
}

/**
 * Rejoindre une session existante et importer immédiatement les parties déjà jouées
 */
export async function joinLiveSession(code, playerName = '') {
  const cleanCode = extractCodeFromInput(code)
  const sessionData = await fetchLiveSession(cleanCode)
  const state = sessionData.state || {}
  const isClosed = Boolean(sessionData.closed || state.closed)

  // Importer immédiatement les parties déjà présentes sur la table
  const importStats = syncSessionGamesToLocal(sessionData)

  if (isClosed) {
    clearActiveSession()
    return {
      ...sessionData,
      closed: true,
      importStats,
    }
  }

  const participants = Array.isArray(state.participants) ? [...state.participants] : []
  const cleanPlayer = (playerName || '').trim()

  if (
    cleanPlayer &&
    cleanPlayer.toLowerCase() !== (sessionData.hostName || state.host || '').trim().toLowerCase() &&
    !participants.some((p) => p.name?.trim().toLowerCase() === cleanPlayer.toLowerCase())
  ) {
    participants.push({ name: cleanPlayer, joinedAt: new Date().toISOString() })
    state.participants = participants

    await fetch(`${API_BASE}/sessions/${encodeURIComponent(cleanCode)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state }),
    }).catch(() => {})
  }

  const localSession = {
    code: sessionData.sessionCode,
    name: state.name || 'Table Ardoise',
    host: sessionData.hostName || state.host || 'Hôte',
    isHost: false,
    playerName: cleanPlayer || undefined,
  }
  saveActiveSession(localSession)

  // Tracking silencieux — compte chaque join de table live
  fetch('/api/stats/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_type: 'session_join', session_code: cleanCode }),
  }).catch(() => {})

  return {
    ...sessionData,
    importStats,
  }
}

/**
 * Clôture la session sur le serveur (action hôte) et sauvegarde localement toutes les parties
 */
export async function closeLiveSession(code) {
  const cleanCode = (code || '').trim().toUpperCase()
  let importStats = { syncedCount: 0, gamesAdded: 0, playersAdded: 0 }

  if (cleanCode) {
    try {
      const res = await fetch(`${API_BASE}/sessions/${encodeURIComponent(cleanCode)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close' }),
      })
      if (res.ok) {
        const data = await res.json().catch(() => ({}))
        if (data.state) {
          importStats = syncSessionGamesToLocal(data)
        }
      }
    } catch (err) {
      console.error('Erreur closeLiveSession:', err)
    }
  }

  clearActiveSession()
  return importStats
}

/**
 * Quitte la session (action participant) après avoir importé toutes les parties de la table
 */
export async function importSessionGames(code) {
  const cleanCode = (code || '').trim().toUpperCase()
  let importStats = { syncedCount: 0, gamesAdded: 0, playersAdded: 0 }

  if (cleanCode) {
    try {
      const sessionData = await fetchLiveSession(cleanCode)
      importStats = syncSessionGamesToLocal(sessionData)
    } catch (err) {
      console.error('Erreur importSessionGames:', err)
    }
  }

  clearActiveSession()
  return importStats
}

/**
 * Met à jour les données de la session de manière atomique et instantanée (en 1 seule requête POST)
 */
export async function pushGameToLiveSession(code, game) {
  if (!code || !game) return
  const cleanCode = extractCodeFromInput(code)
  if (!cleanCode) return

  try {
    const res = await fetch(`${API_BASE}/sessions/${encodeURIComponent(cleanCode)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'push_game', game }),
    })

    if (!res.ok) {
      // Fallback si action push_game n'était pas gérée
      const sessionData = await fetchLiveSession(cleanCode)
      if (sessionData.closed || sessionData.state?.closed) return

      const state = sessionData.state || {}
      const games = Array.isArray(state.games) ? [...state.games] : []

      const idx = games.findIndex((g) => g.id === game.id)
      if (idx >= 0) {
        games[idx] = game
      } else {
        games.unshift(game)
      }
      state.games = games

      await fetch(`${API_BASE}/sessions/${encodeURIComponent(cleanCode)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state }),
      })
    }
  } catch (err) {
    console.error('Erreur pushGameToLiveSession:', err)
  }
}

/**
 * Supprime une partie d'une session en direct active de façon atomique
 */
export async function removeGameFromLiveSession(code, gameId) {
  if (!code || !gameId) return
  const cleanCode = extractCodeFromInput(code)
  if (!cleanCode) return
  try {
    await fetch(`${API_BASE}/sessions/${encodeURIComponent(cleanCode)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove_game', gameId }),
    })
  } catch (err) {
    console.error('Erreur removeGameFromLiveSession:', err)
  }
}

/**
 * Crée instantanément une Table en direct à partir d'une partie (active ou en cours)
 */
export async function createLiveSessionFromGame(game, hostName = '') {
  if (!game) throw new Error('Partie introuvable')
  const gameName = game.name || 'Partie Ardoise'
  const sessionName = `Table ${gameName}`
  const cleanHost = (hostName || '').trim() || (game.players?.[0]?.name || 'Hôte')
  const participants = Array.isArray(game.players)
    ? game.players.map((p) => ({ name: p.name, joinedAt: new Date().toISOString() }))
    : []

  const sessionCode = await createLiveSession(sessionName, cleanHost, participants, [game])
  return sessionCode
}

