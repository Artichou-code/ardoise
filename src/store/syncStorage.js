import {
  loadPlayers,
  savePlayers,
  loadGames,
  loadCustomPresets,
  saveCustomPresets,
  loadTheme,
  saveTheme,
} from './storage'

const SYNC_KEYS = {
  SYNC_KEY: 'ardoise_sync_key',
  LAST_SYNCED: 'ardoise_last_synced_at',
  AUTO_SYNC: 'ardoise_auto_sync_enabled',
}

const API_BASE = '/api'

/**
 * Génère un identifiant de synchronisation mémorisable (ex: ARD-7B92)
 */
export function generateMemorableSyncKey() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ' // Sans 0, 1, I, O pour éviter les confusions
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `ARD-${code}`
}

export function getSyncKey() {
  return localStorage.getItem(SYNC_KEYS.SYNC_KEY) || ''
}

export function setSyncKey(key) {
  if (key) {
    localStorage.setItem(SYNC_KEYS.SYNC_KEY, key.trim().toUpperCase())
  } else {
    localStorage.removeItem(SYNC_KEYS.SYNC_KEY)
  }
}

export function getLastSyncedAt() {
  return localStorage.getItem(SYNC_KEYS.LAST_SYNCED) || null
}

export function setLastSyncedAt(isoString) {
  if (isoString) {
    localStorage.setItem(SYNC_KEYS.LAST_SYNCED, isoString)
  } else {
    localStorage.removeItem(SYNC_KEYS.LAST_SYNCED)
  }
}

export function isAutoSyncEnabled() {
  const val = localStorage.getItem(SYNC_KEYS.AUTO_SYNC)
  return val === null ? true : val === 'true'
}

export function setAutoSyncEnabled(enabled) {
  localStorage.setItem(SYNC_KEYS.AUTO_SYNC, enabled ? 'true' : 'false')
}

/**
 * Construit l'objet complet de sauvegarde locale du carnet
 */
export function exportNotebookPayload() {
  return {
    app: 'Ardoise by ART-créa',
    version: 1,
    exportedAt: new Date().toISOString(),
    theme: loadTheme(),
    players: loadPlayers(),
    games: loadGames(),
    customPresets: loadCustomPresets(),
  }
}

/**
 * Télécharge la sauvegarde sous forme de fichier JSON sur le terminal
 */
export function downloadNotebookBackup() {
  const payload = exportNotebookPayload()
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2))
  const downloadAnchor = document.createElement('a')
  const dateStr = new Date().toISOString().slice(0, 10)
  downloadAnchor.setAttribute('href', dataStr)
  downloadAnchor.setAttribute('download', `ardoise-sauvegarde-${dateStr}.json`)
  document.body.appendChild(downloadAnchor)
  downloadAnchor.click()
  downloadAnchor.remove()
}

/**
 * Valide le schéma d'un carnet importé
 */
export function validateNotebookPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Format JSON invalide' }
  }
  if (!Array.isArray(payload.games) && !Array.isArray(payload.players)) {
    return { valid: false, error: 'Le fichier ne contient ni parties ni joueurs' }
  }
  return { valid: true }
}

/**
 * Fusionne intelligemment deux carnets (local et entrant) sans doublon
 */
export function mergeNotebooks(localNotebook, incomingNotebook) {
  const localGames = Array.isArray(localNotebook.games) ? localNotebook.games : []
  const incomingGames = Array.isArray(incomingNotebook.games) ? incomingNotebook.games : []

  const localPlayers = Array.isArray(localNotebook.players) ? localNotebook.players : []
  const incomingPlayers = Array.isArray(incomingNotebook.players) ? incomingNotebook.players : []

  const localPresets = Array.isArray(localNotebook.customPresets) ? localNotebook.customPresets : []
  const incomingPresets = Array.isArray(incomingNotebook.customPresets) ? incomingNotebook.customPresets : []

  let gamesAdded = 0
  let playersAdded = 0
  let presetsAdded = 0

  // 1. Fusion des parties par ID (avec mise à jour si la partie distante a plus de manches)
  const gamesMap = new Map()
  for (const g of localGames) {
    if (g && g.id) gamesMap.set(g.id, g)
  }

  for (const g of incomingGames) {
    if (!g || !g.id) continue
    if (!gamesMap.has(g.id)) {
      gamesMap.set(g.id, g)
      gamesAdded++
    } else {
      const existing = gamesMap.get(g.id)
      const existingRounds = Array.isArray(existing.rounds) ? existing.rounds.length : 0
      const newRounds = Array.isArray(g.rounds) ? g.rounds.length : 0
      // Garder la version la plus complète ou terminée
      if (newRounds > existingRounds || (g.status === 'finished' && existing.status !== 'finished')) {
        gamesMap.set(g.id, { ...existing, ...g })
      }
    }
  }

  // 2. Fusion des joueurs par ID ou nom normalisé
  const playersMap = new Map()
  for (const p of localPlayers) {
    if (p && p.name) playersMap.set(p.name.trim().toLowerCase(), p)
  }

  for (const p of incomingPlayers) {
    if (!p || !p.name) continue
    const key = p.name.trim().toLowerCase()
    if (!playersMap.has(key)) {
      playersMap.set(key, p)
      playersAdded++
    } else {
      // Conserver les détails enrichis (avatar, couleur)
      const existing = playersMap.get(key)
      playersMap.set(key, { ...p, ...existing })
    }
  }

  // 3. Fusion des modèles personnalisés
  const presetsMap = new Map()
  for (const pr of localPresets) {
    if (pr && pr.id) presetsMap.set(pr.id, pr)
  }
  for (const pr of incomingPresets) {
    if (!pr || !pr.id) continue
    if (!presetsMap.has(pr.id)) {
      presetsMap.set(pr.id, pr)
      presetsAdded++
    }
  }

  const mergedGames = Array.from(gamesMap.values()).sort((a, b) => {
    const timeA = new Date(a.endedAt || a.startedAt || 0).getTime()
    const timeB = new Date(b.endedAt || b.startedAt || 0).getTime()
    return timeB - timeA
  })

  const mergedPlayers = Array.from(playersMap.values())
  const mergedPresets = Array.from(presetsMap.values())

  return {
    mergedNotebook: {
      players: mergedPlayers,
      games: mergedGames,
      customPresets: mergedPresets,
      theme: incomingNotebook.theme || localNotebook.theme,
    },
    stats: {
      gamesAdded,
      playersAdded,
      presetsAdded,
      totalGames: mergedGames.length,
      totalPlayers: mergedPlayers.length,
    },
  }
}

/**
 * Applique un carnet dans le localStorage
 */
export function applyNotebook(incoming, mode = 'merge') {
  const local = exportNotebookPayload()

  if (mode === 'replace') {
    if (Array.isArray(incoming.players)) savePlayers(incoming.players)
    if (Array.isArray(incoming.games)) {
      localStorage.setItem('ardoise_games', JSON.stringify(incoming.games))
    }
    if (Array.isArray(incoming.customPresets)) saveCustomPresets(incoming.customPresets)
    if (incoming.theme) saveTheme(incoming.theme)

    return {
      success: true,
      mode: 'replace',
      stats: {
        totalGames: incoming.games?.length || 0,
        totalPlayers: incoming.players?.length || 0,
      },
    }
  }

  // Mode fusion
  const { mergedNotebook, stats } = mergeNotebooks(local, incoming)
  savePlayers(mergedNotebook.players)
  localStorage.setItem('ardoise_games', JSON.stringify(mergedNotebook.games))
  saveCustomPresets(mergedNotebook.customPresets)

  return {
    success: true,
    mode: 'merge',
    stats,
  }
}

/**
 * Appels réseau Cloudflare Sync API
 */

export async function fetchRemoteNotebook(syncKey) {
  const cleanKey = (syncKey || getSyncKey()).trim().toUpperCase()
  if (!cleanKey) throw new Error('Aucune clé de synchronisation renseignée.')

  const res = await fetch(`${API_BASE}/sync/${encodeURIComponent(cleanKey)}`, {
    headers: { 'Cache-Control': 'no-cache' },
  })

  if (res.status === 404) {
    return { found: false }
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.error || `Erreur serveur (${res.status})`)
  }

  return await res.json()
}

export async function pushNotebookToCloud(syncKey) {
  const cleanKey = (syncKey || getSyncKey()).trim().toUpperCase()
  if (!cleanKey) throw new Error('Aucune clé de synchronisation renseignée.')

  const payload = exportNotebookPayload()
  const res = await fetch(`${API_BASE}/sync/${encodeURIComponent(cleanKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload }),
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.error || `Erreur d'envoi (${res.status})`)
  }

  const data = await res.json()
  setLastSyncedAt(data.updatedAt || new Date().toISOString())
  return data
}

/**
 * Synchronisation bidirectionnelle automatique complète avec le Cloud
 */
export async function synchronizeNotebook(syncKey) {
  const key = (syncKey || getSyncKey()).trim().toUpperCase()
  if (!key) throw new Error('Clé manquante')

  setSyncKey(key)

  // 1. Tenter de récupérer le carnet distant
  const remote = await fetchRemoteNotebook(key)

  if (!remote.found || !remote.payload) {
    // Si c'est un nouveau carnet, on pousse notre carnet local pour l'initialiser
    const pushResult = await pushNotebookToCloud(key)
    return {
      status: 'created',
      message: 'Carnet initialisé et synchronisé sur le Cloud !',
      version: pushResult.version,
      stats: { gamesAdded: 0, playersAdded: 0 },
    }
  }

  // 2. Fusionner le distant avec le local
  const applyResult = applyNotebook(remote.payload, 'merge')

  // 3. Pousser le carnet fusionné vers le cloud
  await pushNotebookToCloud(key)

  return {
    status: 'synced',
    message: 'Carnet synchronisé avec succès !',
    stats: applyResult.stats,
  }
}
