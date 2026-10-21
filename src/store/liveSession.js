import { applyNotebook, extractCodeFromInput } from './syncStorage'
import { loadDeletedGameIds, getDefaultMyProfile, setDefaultMyProfile } from './storage'

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

const PREFERRED_CITY_KEY = 'ardoise_preferred_city'

export function getPreferredCity() {
  try {
    return localStorage.getItem(PREFERRED_CITY_KEY) || ''
  } catch {
    return ''
  }
}

export function setPreferredCity(city) {
  try {
    if (city && city.trim()) {
      localStorage.setItem(PREFERRED_CITY_KEY, city.trim())
    } else {
      localStorage.removeItem(PREFERRED_CITY_KEY)
    }
  } catch {}
}

/**
 * Crée une session de journée sur le serveur
 */
export async function createLiveSession(name, hostName, participants = [], initialGames = [], customCity = null) {
  const cleanName = (name || '').trim() || 'Table Ardoise'
  const cleanHost = (hostName || '').trim() || 'Hôte'
  const cityToSend = customCity !== null ? customCity : getPreferredCity()
  const isPwa = typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator?.standalone === true) ? 1 : 0

  const res = await fetch(`${API_BASE}/sessions/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: cleanName,
      host: cleanHost,
      participants,
      customCity: cityToSend || undefined,
      is_pwa: isPwa,
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
    city: data.city || data.detectedCity || null,
    detectedCity: data.detectedCity || null,
    customCity: cityToSend || null,
  }
  saveActiveSession(localSession)

  if (cleanHost && Array.isArray(initialGames)) {
    for (const g of initialGames) {
      const match = g?.players?.find(p => p.name?.trim().toLowerCase() === cleanHost.toLowerCase())
      if (match) {
        setMyPlayerIdForSession(data.sessionCode, match.id)
        break
      }
    }
  }

  return data.sessionCode
}

/**
 * Met à jour la ville de la table en direct (action hôte)
 */
export async function updateLiveSessionCity(code, newCity) {
  const cleanCode = extractCodeFromInput(code, 'TAB')
  if (!cleanCode) throw new Error('Code de session manquant')

  const cleanCity = (newCity || '').trim()

  const res = await fetch(`${API_BASE}/sessions/${encodeURIComponent(cleanCode)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update_city', city: cleanCity }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Impossible de mettre à jour la ville')
  }

  const data = await res.json()

  if (cleanCity) {
    setPreferredCity(cleanCity)
  }

  const active = getActiveSession()
  if (active && active.code === cleanCode) {
    saveActiveSession({
      ...active,
      city: data.city || cleanCity,
      customCity: cleanCity || null,
    })
  }

  return data
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
    city: sessionData.city || state.city || null,
    playerName: cleanPlayer || undefined,
  }
  saveActiveSession(localSession)

  if (cleanPlayer && Array.isArray(state.games)) {
    for (const g of state.games) {
      const match = g?.players?.find(p => p.name?.trim().toLowerCase() === cleanPlayer.toLowerCase())
      if (match) {
        setMyPlayerIdForSession(sessionData.sessionCode, match.id)
        break
      }
    }
  }

  // Tracking silencieux — compte chaque join de table live
  const isPwa = typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator?.standalone === true) ? 1 : 0
  fetch('/api/stats/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_type: 'session_join', session_code: cleanCode, is_pwa: isPwa }),
  }).catch(() => {})

  return {
    ...sessionData,
    importStats,
  }
}

/**
 * Annule et supprime la session sur le serveur (action hôte) sans laisser de trace
 */
export async function cancelLiveSession(code) {
  const cleanCode = (code || '').trim().toUpperCase()
  if (cleanCode) {
    try {
      await fetch(`${API_BASE}/sessions/${encodeURIComponent(cleanCode)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      })
    } catch (err) {
      console.error('Erreur cancelLiveSession:', err)
    }
  }
  clearActiveSession()
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

/**
 * Clé pour stocker le joueur associé à cet appareil pour une table en direct donnée
 */
function getMyPlayerKey(sessionCode) {
  return `ardoise_live_my_player_${(sessionCode || '').toUpperCase()}`
}

export function getMyPlayerIdForSession(sessionCode, game = null) {
  try {
    if (sessionCode) {
      const specific = localStorage.getItem(getMyPlayerKey(sessionCode))
      if (specific) return specific
    }

    // Fallback automatique sur le profil global de l'appareil ("Moi")
    const def = getDefaultMyProfile()
    if (!def) return null

    // Si on a un objet partie passé en argument, chercher la correspondance par id ou par nom
    const playersList = game?.players || []
    if (Array.isArray(playersList) && playersList.length > 0) {
      const match = playersList.find(p =>
        (def.id && p.id === def.id) ||
        (def.name && p.name?.trim().toLowerCase() === def.name.trim().toLowerCase())
      )
      if (match) return match.id
    }

    return def.id || null
  } catch {
    return null
  }
}

export function setMyPlayerIdForSession(sessionCode, playerId, playerName = null) {
  try {
    if (sessionCode) {
      if (playerId) {
        localStorage.setItem(getMyPlayerKey(sessionCode), playerId)
      } else {
        localStorage.removeItem(getMyPlayerKey(sessionCode))
      }
    }

    // Mémoriser également au niveau global sur cet appareil
    if (playerId) {
      setDefaultMyProfile({ id: playerId, name: playerName || '' })
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ardoise-live-my-player-changed', {
        detail: { sessionCode, playerId: playerId || null },
      }))
    }
  } catch {}
}

// Timer pour debouncer les envois rapides de draft
const draftDebounceTimers = new Map()

/**
 * Pousse en direct le brouillon (sélection/score temporaire) d'un joueur sur le serveur
 */
export async function pushLiveSessionDraft(code, gameId, playerId, data, roundIndex, debounceMs = 250, game = null) {
  if (!code || !gameId) return
  const cleanCode = extractCodeFromInput(code)
  if (!cleanCode) return

  const send = async () => {
    try {
      await fetch(`${API_BASE}/sessions/${encodeURIComponent(cleanCode)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_draft',
          gameId,
          playerId,
          data,
          roundIndex,
          game: game || undefined,
        }),
      })
    } catch (err) {
      console.warn('Erreur pushLiveSessionDraft:', err)
    }
  }

  const key = `${cleanCode}_${gameId}_${playerId}`
  if (draftDebounceTimers.has(key)) {
    clearTimeout(draftDebounceTimers.get(key))
  }

  if (debounceMs <= 0) {
    await send()
  } else {
    draftDebounceTimers.set(
      key,
      setTimeout(() => {
        draftDebounceTimers.delete(key)
        send()
      }, debounceMs)
    )
  }
}

/**
 * Valide une manche sur la Table Live avec protection optimiste anti-collision (OCC)
 */
export async function commitLiveSessionRound(code, gameId, roundIndex, roundData, extra = {}, game = null) {
  if (!code || !gameId || !roundData) return null
  const cleanCode = extractCodeFromInput(code)
  if (!cleanCode) return null

  try {
    const res = await fetch(`${API_BASE}/sessions/${encodeURIComponent(cleanCode)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'commit_round',
        gameId,
        roundIndex,
        roundData,
        status: extra.status,
        winner: extra.winner,
        game: game || undefined,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Erreur lors de la validation')
    }

    return await res.json()
  } catch (err) {
    console.error('Erreur commitLiveSessionRound:', err)
    throw err
  }
}

