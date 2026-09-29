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
 * Extrait un code (ex: ARD-R4RT) à partir d'une saisie brute qui peut être
 * un code seul, une URL complète (https://.../?share=ARD-R4RT) ou un texte partagé.
 */
export function extractCodeFromInput(rawInput) {
  const str = (rawInput || '').trim()
  if (!str) return ''

  // 1. Paramètre d'URL ?share=..., ?game=..., ?session=..., ?sync=...
  const paramMatch = str.match(/[?&](?:share|game|session|sync)=([A-Za-z0-9_-]+)/i)
  if (paramMatch && paramMatch[1]) {
    return decodeURIComponent(paramMatch[1]).trim().toUpperCase()
  }

  // 2. Motif explicite ARD-XXXX n'importe où dans le texte ou l'URL
  const ardMatch = str.match(/\b(ARD-[A-Za-z0-9]{3,12})\b/i)
  if (ardMatch && ardMatch[1]) {
    return ardMatch[1].toUpperCase()
  }

  // 3. Si c'est une URL de type .../share/CODE ou .../sessions/CODE
  if (/^https?:\/\//i.test(str)) {
    try {
      const url = new URL(str)
      const segments = url.pathname.split('/').filter(Boolean)
      if (segments.length > 0) {
        return decodeURIComponent(segments[segments.length - 1]).trim().toUpperCase()
      }
    } catch {}
  }

  // 4. Si l'utilisateur a tapé uniquement les 4 caractères sans "ARD-" (ex: "R4RT")
  const upper = str.toUpperCase()
  if (/^[A-Z0-9]{4}$/.test(upper)) {
    return `ARD-${upper}`
  }

  return upper
}

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
  const clean = extractCodeFromInput(key)
  if (clean) {
    localStorage.setItem(SYNC_KEYS.SYNC_KEY, clean)
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

  // 2. Fusion des joueurs par nom normalisé (inclut les joueurs présents dans les parties importées)
  const playersMap = new Map()
  for (const p of localPlayers) {
    if (p && p.name) playersMap.set(p.name.trim().toLowerCase(), p)
  }

  const allIncomingPlayers = [...incomingPlayers]
  for (const g of incomingGames) {
    if (g && Array.isArray(g.players)) {
      for (const gp of g.players) {
        if (gp && gp.name) {
          const norm = gp.name.trim().toLowerCase()
          if (norm !== 'nous' && norm !== 'eux') {
            allIncomingPlayers.push(gp)
          }
        }
      }
    }
  }

  for (const p of allIncomingPlayers) {
    if (!p || !p.name) continue
    const key = p.name.trim().toLowerCase()
    if (key === 'nous' || key === 'eux') continue
    if (!playersMap.has(key)) {
      playersMap.set(key, {
        id: p.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: p.name.trim(),
        color: p.color || '#c83b3b',
        avatar: p.avatar !== undefined ? p.avatar : null,
        createdAt: p.createdAt || Date.now(),
      })
      playersAdded++
    } else {
      // Conserver la couleur et l'avatar du joueur importé
      const existing = playersMap.get(key)
      playersMap.set(key, {
        ...existing,
        ...p,
        id: existing.id,
        name: existing.name,
        color: p.color || existing.color,
        avatar: p.avatar !== undefined ? p.avatar : existing.avatar,
      })
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
    const timeA = new Date(a.finishedAt || a.endedAt || a.startedAt || 0).getTime()
    const timeB = new Date(b.finishedAt || b.endedAt || b.startedAt || 0).getTime()
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
 * Détecte les joueurs des parties entrantes qui portent le même prénom qu'un joueur local
 */
export function detectPlayerConflicts(incomingGames = []) {
  const localPlayers = loadPlayers()
  const localByName = new Map()
  for (const lp of localPlayers) {
    if (lp && lp.name) {
      localByName.set(lp.name.trim().toLowerCase(), lp)
    }
  }

  const conflictsMap = new Map()
  const newPlayersMap = new Map()

  for (const g of incomingGames) {
    if (!g || !Array.isArray(g.players)) continue
    for (const gp of g.players) {
      if (!gp || !gp.name) continue
      const key = gp.name.trim().toLowerCase()
      if (key === 'nous' || key === 'eux') continue

      if (localByName.has(key)) {
        const localPlayer = localByName.get(key)
        if (!conflictsMap.has(key)) {
          conflictsMap.set(key, {
            key,
            name: gp.name.trim(),
            incomingPlayer: gp,
            localPlayer,
          })
        }
      } else if (!newPlayersMap.has(key)) {
        newPlayersMap.set(key, gp)
      }
    }
  }

  return {
    conflicts: Array.from(conflictsMap.values()),
    newPlayers: Array.from(newPlayersMap.values()),
  }
}

/**
 * Importe une liste de parties en appliquant les choix de résolution de doublons de joueurs
 * @param {Array} incomingGames - Parties à importer
 * @param {Object} resolutions - Map { [normalizedName]: 'merge' | 'separate' }
 */
export function importGamesWithResolution(incomingGames = [], resolutions = {}) {
  const local = exportNotebookPayload()
  const localPlayers = Array.isArray(local.players) ? [...local.players] : []
  const existingNames = new Set(localPlayers.map(p => p.name?.trim().toLowerCase()).filter(Boolean))

  // Préparer la table de renommage si l'utilisateur a choisi 'separate' pour certains doublons
  const renameMap = new Map() // key -> nouveau nom distinct
  const extraPlayersToCreate = []

  for (const [key, choice] of Object.entries(resolutions)) {
    if (choice === 'separate') {
      // Trouver le joueur entrant correspondant
      let samplePlayer = null
      for (const g of incomingGames) {
        const found = (g?.players || []).find(p => p?.name?.trim().toLowerCase() === key)
        if (found) {
          samplePlayer = found
          break
        }
      }
      if (samplePlayer) {
        const baseName = samplePlayer.name.trim()
        let suffix = 2
        let candidateName = `${baseName} (${suffix})`
        while (existingNames.has(candidateName.toLowerCase())) {
          suffix++
          candidateName = `${baseName} (${suffix})`
        }
        existingNames.add(candidateName.toLowerCase())
        renameMap.set(key, candidateName)
        extraPlayersToCreate.push({
          ...samplePlayer,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: candidateName,
        })
      }
    }
  }

  // Adapter les parties entrantes si certains joueurs ont été séparés
  const processedGames = incomingGames.map(g => {
    if (!g || !Array.isArray(g.players)) return g
    const updatedPlayers = g.players.map(p => {
      if (!p || !p.name) return p
      const key = p.name.trim().toLowerCase()
      if (renameMap.has(key)) {
        return { ...p, name: renameMap.get(key) }
      }
      return p
    })
    return { ...g, players: updatedPlayers }
  })

  const { mergedNotebook, stats } = mergeNotebooks(local, {
    games: processedGames,
    players: extraPlayersToCreate,
  })

  savePlayers(mergedNotebook.players)
  localStorage.setItem('ardoise_games', JSON.stringify(mergedNotebook.games))
  saveCustomPresets(mergedNotebook.customPresets)

  return {
    success: true,
    stats,
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
  const cleanKey = extractCodeFromInput(syncKey || getSyncKey())
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
  const cleanKey = extractCodeFromInput(syncKey || getSyncKey())
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
  const key = extractCodeFromInput(syncKey || getSyncKey())
  if (!key) throw new Error('Clé manquante')

  setSyncKey(key)

  // 1. Tenter de récupérer le carnet distant
  const remote = await fetchRemoteNotebook(key)

  if (!remote.found || !remote.payload) {
    // Si c'est un nouveau carnet, on pousse notre carnet local pour l'initialiser
    const pushResult = await pushNotebookToCloud(key)
    const local = exportNotebookPayload()
    return {
      status: 'created',
      message: 'Carnet initialisé et synchronisé sur le Cloud\u00A0!',
      version: pushResult.version,
      stats: {
        gamesAdded: 0,
        playersAdded: 0,
        totalGames: local.games?.length || 0,
        totalPlayers: local.players?.length || 0,
      },
    }
  }

  // 2. Fusionner le distant avec le local
  const applyResult = applyNotebook(remote.payload, 'merge')

  // 3. Pousser le carnet fusionné vers le cloud
  await pushNotebookToCloud(key)

  return {
    status: 'synced',
    message: 'Carnet synchronisé avec succès\u00A0!',
    stats: applyResult.stats,
  }
}

/**
 * Partage une feuille de match terminée et retourne un code unique
 */
export async function shareGame(game) {
  if (!game || !game.id) throw new Error('Partie invalide')
  return await shareGamesBatch([game])
}

/**
 * Partage un lot d'une ou plusieurs parties et retourne un code unique
 */
export async function shareGamesBatch(games = []) {
  const validGames = (Array.isArray(games) ? games : []).filter(g => g && g.id)
  if (validGames.length === 0) throw new Error('Aucune partie sélectionnée')

  const playersMap = new Map()
  for (const g of validGames) {
    for (const p of g.players || []) {
      if (p && p.name) {
        playersMap.set(p.name.trim().toLowerCase(), p)
      }
    }
  }

  const res = await fetch(`${API_BASE}/games/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      games: validGames,
      game: validGames[0],
      players: Array.from(playersMap.values()),
    }),
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.error || `Erreur de partage (${res.status})`)
  }

  return await res.json() // { success: true, gameId, gameCode, count }
}

/**
 * Récupère une ou plusieurs feuilles de match partagées par code, lien ou ID
 */
export async function fetchSharedGame(codeOrId) {
  const clean = extractCodeFromInput(codeOrId)
  if (!clean) throw new Error('Code de match manquant')

  const res = await fetch(`${API_BASE}/games/share/${encodeURIComponent(clean)}`)
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.error || `Partage introuvable (${res.status})`)
  }

  const data = await res.json()
  const games = Array.isArray(data.games)
    ? data.games
    : data.game
    ? [data.game]
    : []

  return {
    ...data,
    games,
    game: games[0] || null,
  }
}


