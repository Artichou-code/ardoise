import {
  loadPlayers,
  savePlayers,
  loadGames,
  loadCustomPresets,
  saveCustomPresets,
  loadTheme,
  saveTheme,
  loadDeletedGameIds,
  saveDeletedGameIds,
  loadDeletedPlayerIds,
  saveDeletedPlayerIds,
  loadActiveGameId,
  saveActiveGameId,
  loadPlayerAliases,
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
/**
 * Extrait un code (ex: SYNC-R4RT, TAB-5RQK, ARD-R4RT) à partir d'une saisie brute qui peut être
 * un code seul, une URL complète ou un texte partagé.
 * @param {string} rawInput
 * @param {'SYNC' | 'TAB' | ''} defaultPrefix
 */
export function extractCodeFromInput(rawInput, defaultPrefix = '') {
  let str = (rawInput || '').trim()
  if (!str) return ''

  // 1. Paramètre d'URL ?share=..., ?game=..., ?session=..., ?sync=...
  const paramMatch = str.match(/[?&](?:share|game|session|sync)=([A-Za-z0-9_-]+)/i)
  if (paramMatch && paramMatch[1]) {
    str = decodeURIComponent(paramMatch[1]).trim()
  } else if (/^https?:\/\//i.test(str)) {
    // Si c'est une URL de type .../share/CODE ou .../sessions/CODE ou .../sync/CODE
    try {
      const url = new URL(str)
      const segments = url.pathname.split('/').filter(Boolean)
      if (segments.length > 0) {
        str = decodeURIComponent(segments[segments.length - 1]).trim()
      }
    } catch {}
  }

  const upper = str.toUpperCase().trim()

  // 2. Préfixes explicites reconnus : SYNC-, TAB-, TABLE-, ARD-
  const syncMatch = upper.match(/\bSYNC[-_\s]?([A-Z0-9]{3,12})\b/i) || upper.match(/^SYNC[-_\s]?([A-Z0-9]{3,12})$/i)
  if (syncMatch && syncMatch[1]) {
    return `SYNC-${syncMatch[1]}`
  }

  const tabMatch = upper.match(/\b(?:TAB|TABLE)[-_\s]?([A-Z0-9]{3,12})\b/i) || upper.match(/^(?:TAB|TABLE)[-_\s]?([A-Z0-9]{3,12})$/i)
  if (tabMatch && tabMatch[1]) {
    return `TAB-${tabMatch[1]}`
  }

  const ardMatch = upper.match(/\bARD[-_\s]?([A-Z0-9]{3,12})\b/i) || upper.match(/^ARD[-_\s]?([A-Z0-9]{3,12})$/i)
  if (ardMatch && ardMatch[1]) {
    return `ARD-${ardMatch[1]}`
  }

  // 3. Si l'utilisateur a tapé uniquement les 4 caractères sans préfixe (ex: "44D7" ou "R4RT")
  const compact = upper.replace(/[^A-Z0-9]/g, '')
  if (/^[A-Z0-9]{4}$/.test(compact)) {
    const pfx = (defaultPrefix || 'SYNC').toUpperCase()
    return `${pfx}-${compact}`
  }

  return upper
}

/**
 * Valide si le format correspond à un code de carnet autorisé (SYNC-XXXX ou ARD-XXXX)
 */
export function isValidSyncKeyFormat(key) {
  if (!key || typeof key !== 'string') return false
  return /^(SYNC|ARD)-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/i.test(key.trim())
}

/**
 * Valide si le format correspond à un code de Table en direct autorisé (TAB-XXXX, TABLE-XXXX ou ARD-XXXX)
 */
export function isValidLiveSessionCodeFormat(code) {
  if (!code || typeof code !== 'string') return false
  return /^(TAB|TABLE|ARD)-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/i.test(code.trim())
}

/**
 * Génère un identifiant de synchronisation mémorisable (ex: SYNC-7B92)
 */
export function generateMemorableSyncKey() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ' // Sans 0, 1, I, O pour éviter les confusions
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `SYNC-${code}`
}

export function getSyncKey() {
  const raw = localStorage.getItem(SYNC_KEYS.SYNC_KEY) || ''
  if (!raw) return ''
  const clean = extractCodeFromInput(raw, 'SYNC')
  if (clean && clean !== raw) {
    localStorage.setItem(SYNC_KEYS.SYNC_KEY, clean)
  }
  return clean || raw
}

export function setSyncKey(key) {
  const clean = extractCodeFromInput(key, 'SYNC')
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

/**
 * Formate un horodatage de synchronisation pour l'affichage utilisateur.
 * Gère les chaînes ISO-8601 ("2026-10-13T14:58:00.000Z") et les horodatages SQLite UTC ("2026-10-13 14:58:00")
 * en appliquant toujours le fuseau horaire local de l'utilisateur.
 */
export function formatSyncTimestamp(timestamp) {
  if (!timestamp) return null
  let str = String(timestamp).trim()
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/.test(str)) {
    str = str.replace(' ', 'T') + 'Z'
  }
  const d = new Date(str)
  if (isNaN(d.getTime())) return null
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
    deletedGameIds: loadDeletedGameIds(),
    deletedPlayerIds: loadDeletedPlayerIds(),
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

  // 0. Consolidation et persistance des tombstones (parties et joueurs supprimés)
  const allDeletedGameIds = new Set([
    ...loadDeletedGameIds(),
    ...(Array.isArray(localNotebook.deletedGameIds) ? localNotebook.deletedGameIds : []),
    ...(Array.isArray(incomingNotebook.deletedGameIds) ? incomingNotebook.deletedGameIds : []),
  ])

  const allDeletedPlayerIds = new Set([
    ...loadDeletedPlayerIds(),
    ...(Array.isArray(localNotebook.deletedPlayerIds) ? localNotebook.deletedPlayerIds : []),
    ...(Array.isArray(incomingNotebook.deletedPlayerIds) ? incomingNotebook.deletedPlayerIds : []),
  ])

  saveDeletedGameIds(Array.from(allDeletedGameIds))
  saveDeletedPlayerIds(Array.from(allDeletedPlayerIds))

  let gamesAdded = 0
  let playersAdded = 0
  let presetsAdded = 0

  // 1. Fusion des parties par ID (avec mise à jour si la partie distante a plus de manches)
  const gamesMap = new Map()
  for (const g of localGames) {
    if (g && g.id && !allDeletedGameIds.has(g.id)) gamesMap.set(g.id, g)
  }

  for (const g of incomingGames) {
    if (!g || !g.id || allDeletedGameIds.has(g.id) || g.status === 'template') continue
    if (!gamesMap.has(g.id)) {
      gamesMap.set(g.id, g)
      gamesAdded++
    } else {
      const existing = gamesMap.get(g.id)
      const existingRounds = Array.isArray(existing.rounds) ? existing.rounds.length : 0
      const newRounds = Array.isArray(g.rounds) ? g.rounds.length : 0
      const toTimestamp = (v) => {
        if (typeof v === 'number') return v
        if (!v) return 0
        const t = new Date(v).getTime()
        return isNaN(t) ? 0 : t
      }
      const existingUpdated = Math.max(toTimestamp(existing.updatedAt), toTimestamp(existing.finishedAt), toTimestamp(existing.startedAt))
      const newUpdated = Math.max(toTimestamp(g.updatedAt), toTimestamp(g.finishedAt), toTimestamp(g.startedAt))

      // Mettre à jour si la version entrante est plus récente, a plus de manches, est terminée, a des scores modifiés ou un brouillon (draft) mis à jour
      const isNewer = newUpdated > existingUpdated
      const hasMoreRounds = newRounds > existingRounds
      const isNewlyFinished = g.status === 'finished' && existing.status !== 'finished'
      const isContentChanged = newRounds === existingRounds && JSON.stringify(g.scores) !== JSON.stringify(existing.scores)
      const isDraftChanged = JSON.stringify(g.draft || null) !== JSON.stringify(existing.draft || null)

      if (isNewer || hasMoreRounds || isNewlyFinished || isContentChanged || isDraftChanged) {
        gamesMap.set(g.id, { ...existing, ...g })
      }
    }
  }

  // 2. Fusion des joueurs par nom normalisé (inclut les joueurs présents dans les parties importées)
  const playersMap = new Map()
  for (const p of localPlayers) {
    if (p && p.name) {
      const norm = p.name.trim().toLowerCase()
      if (!allDeletedPlayerIds.has(p.id) && !allDeletedPlayerIds.has(norm)) {
        playersMap.set(norm, p)
      }
    }
  }

  const allIncomingPlayers = [...incomingPlayers]
  for (const g of incomingGames) {
    if (g && g.status !== 'template' && Array.isArray(g.players) && !allDeletedGameIds.has(g.id)) {
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

  const aliases = loadPlayerAliases()

  for (const p of allIncomingPlayers) {
    if (!p || !p.name) continue
    const key = p.name.trim().toLowerCase()
    if (key === 'nous' || key === 'eux') continue
    if (allDeletedPlayerIds.has(p.id) || allDeletedPlayerIds.has(key)) continue
    // Si ce joueur est un alias fusionné vers un autre profil local, ne pas le recréer
    if (aliases[p.id] || aliases[key]) continue

    if (!playersMap.has(key)) {
      playersMap.set(key, {
        id: p.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: p.name.trim(),
        color: p.color || '#c83b3b',
        avatar: p.avatar !== undefined ? p.avatar : null,
        createdAt: p.createdAt || Date.now(),
        updatedAt: p.updatedAt || p.createdAt || Date.now(),
      })
      playersAdded++
    } else {
      const existing = playersMap.get(key)
      const toTime = (item) => {
        if (!item) return 0
        const t = Number(item.updatedAt) || Number(item.createdAt) || 0
        if (t) return t
        const isoT = new Date(item.updatedAt || item.createdAt).getTime()
        return isNaN(isoT) ? 0 : isoT
      }
      const existingTime = toTime(existing)
      const incomingTime = toTime(p)
      const useIncoming = incomingTime > existingTime

      playersMap.set(key, {
        ...existing,
        ...p,
        id: existing.id,
        name: existing.name,
        color: useIncoming ? (p.color || existing.color) : (existing.color || p.color),
        avatar: useIncoming
          ? (p.avatar !== undefined ? p.avatar : existing.avatar)
          : (existing.avatar !== undefined ? existing.avatar : p.avatar),
        updatedAt: Math.max(existingTime, incomingTime, Date.now()),
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

  // Extraire également les modèles personnalisés présents dans les parties entrantes
  for (const g of incomingGames) {
    if (g && g.type === 'universel' && (g.config?.customGameName || (g.name && g.name !== 'Compteur Universel'))) {
      const presetName = (g.config?.customGameName || g.name || '').trim()
      if (presetName) {
        const alreadyExists = Array.from(presetsMap.values()).some(
          p => p.name?.trim().toLowerCase() === presetName.toLowerCase()
        )
        if (!alreadyExists) {
          const newPreset = {
            id: `preset_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name: presetName,
            scoreDir: g.config?.scoreDir || 'high',
            limit: g.config?.limit || g.config?.targetScore || 100,
            specialRule: g.config?.specialRule || { enabled: false, target: 100, action: 'divide', value: 2 },
            updatedAt: Date.now(),
          }
          presetsMap.set(newPreset.id, newPreset)
          presetsAdded++
        }
      }
    }
  }

  // Aligner les avatars et noms des joueurs dans les parties sur les profils locaux et alias
  for (const g of gamesMap.values()) {
    if (g && Array.isArray(g.players)) {
      let gChanged = false
      const updatedPlayers = g.players.map(gp => {
        if (!gp || !gp.name) return gp
        const norm = gp.name.trim().toLowerCase()
        const aliasTargetId = aliases[gp.id] || aliases[norm]
        let localP = null
        if (aliasTargetId) {
          localP = Array.from(playersMap.values()).find(lp => lp.id === aliasTargetId)
        }
        if (!localP) {
          localP = playersMap.get(norm)
        }
        if (localP) {
          const targetName = aliasTargetId ? localP.name : gp.name
          if (localP.avatar !== gp.avatar || localP.color !== gp.color || (aliasTargetId && targetName !== gp.name)) {
            gChanged = true
            return {
              ...gp,
              name: targetName,
              avatar: localP.avatar,
              color: localP.color,
            }
          }
        }
        return gp
      })
      if (gChanged) {
        g.players = updatedPlayers
      }
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
      deletedGameIds: Array.from(allDeletedGameIds),
      deletedPlayerIds: Array.from(allDeletedPlayerIds),
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
  const localById = new Map()
  for (const lp of localPlayers) {
    if (lp && lp.name) {
      localByName.set(lp.name.trim().toLowerCase(), lp)
      if (lp.id) localById.set(lp.id, lp)
    }
  }

  const conflictsMap = new Map()
  const newPlayersMap = new Map()

  for (const g of incomingGames) {
    if (!g || g.status === 'template' || !Array.isArray(g.players)) continue
    for (const gp of g.players) {
      if (!gp || !gp.name) continue
      const key = gp.name.trim().toLowerCase()
      if (key === 'nous' || key === 'eux') continue

      // Si l'identifiant distant est déjà exactement attribué à un joueur local (ex: Alex J.), aucun conflit !
      if (gp.id && localById.has(gp.id)) {
        continue
      }

      if (localByName.has(key)) {
        const localPlayer = localByName.get(key)
        if (!conflictsMap.has(key)) {
          conflictsMap.set(key, {
            key,
            name: gp.name.trim(),
            incomingPlayer: gp,
            localPlayer,
            isArchived: Boolean(localPlayer.archived),
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
 * @param {Object} customNames - Map { [normalizedName]: string } noms personnalisés saisis par l'utilisateur
 */
export function importGamesWithResolution(incomingGames = [], resolutions = {}, customNames = {}) {
  const local = exportNotebookPayload()
  const localPlayers = Array.isArray(local.players) ? [...local.players] : []
  const existingNames = new Set(localPlayers.map(p => p.name?.trim().toLowerCase()).filter(Boolean))

  const renameMap = new Map() // key -> nouveau nom distinct
  const idMap = new Map() // key -> ID cible
  const extraPlayersToCreate = []

  for (const [key, choice] of Object.entries(resolutions)) {
    // Trouver le joueur entrant correspondant
    let samplePlayer = null
    for (const g of incomingGames) {
      const found = (g?.players || []).find(p => p?.name?.trim().toLowerCase() === key)
      if (found) {
        samplePlayer = found
        break
      }
    }

    if (choice === 'separate') {
      if (samplePlayer) {
        const userCustomName = (customNames[key] || '').trim()
        const baseName = userCustomName || samplePlayer.name.trim()
        let candidateName = baseName
        let suffix = 2
        // Si aucun nom personnalisé n'a été tapé et qu'il y a collision, ajouter suffixe (2)
        if (!userCustomName && existingNames.has(candidateName.toLowerCase())) {
          candidateName = `${baseName} (${suffix})`
          while (existingNames.has(candidateName.toLowerCase())) {
            suffix++
            candidateName = `${baseName} (${suffix})`
          }
        }
        existingNames.add(candidateName.toLowerCase())
        renameMap.set(key, candidateName)

        // Réutiliser l'ID du joueur entrant pour le reconnaître automatiquement lors des futures tables
        const newPlayerId = samplePlayer.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        idMap.set(key, newPlayerId)

        extraPlayersToCreate.push({
          ...samplePlayer,
          id: newPlayerId,
          name: candidateName,
          archived: false,
        })
      }
    } else if (choice === 'merge') {
      // Trouver le joueur local correspondant
      const localP = localPlayers.find(p => p.name?.trim().toLowerCase() === key)
      if (localP) {
        idMap.set(key, localP.id)
        // Réactiver si archivé
        if (localP.archived) {
          localP.archived = false
        }
      }
    }
  }

  // Sauvegarder les joueurs locaux mis à jour (dé-archivages éventuels)
  if (localPlayers.some(p => !p.archived)) {
    savePlayers(localPlayers)
  }

  // Adapter les parties entrantes
  const processedGames = incomingGames.map(g => {
    if (!g || !Array.isArray(g.players)) return g
    const updatedPlayers = g.players.map(p => {
      if (!p || !p.name) return p
      const key = p.name.trim().toLowerCase()
      const newName = renameMap.has(key) ? renameMap.get(key) : p.name
      const newId = idMap.has(key) ? idMap.get(key) : p.id
      return { ...p, id: newId, name: newName }
    })

    // Réaligner les clés de scores et manches si des IDs ont été réassignés
    let updatedScores = { ...(g.scores || {}) }
    let updatedRounds = Array.isArray(g.rounds) ? [...g.rounds] : []
    g.players.forEach(p => {
      if (!p || !p.name) return
      const key = p.name.trim().toLowerCase()
      const newId = idMap.has(key) ? idMap.get(key) : p.id
      if (p.id && newId && p.id !== newId) {
        if (updatedScores[p.id] !== undefined) {
          updatedScores[newId] = updatedScores[p.id]
          delete updatedScores[p.id]
        }
        updatedRounds = updatedRounds.map(r => {
          if (!r?.scores) return r
          const rScores = { ...r.scores }
          if (rScores[p.id] !== undefined) {
            rScores[newId] = rScores[p.id]
            delete rScores[p.id]
          }
          return { ...r, scores: rScores }
        })
      }
    })

    return {
      ...g,
      players: updatedPlayers,
      scores: updatedScores,
      rounds: updatedRounds,
    }
  })

  // Dé-tombstoner les parties explicitement importées par l'utilisateur
  try {
    const deleted = loadDeletedGameIds()
    const importedIds = new Set(processedGames.map(g => g && g.id).filter(Boolean))
    const filteredDeleted = deleted.filter(id => !importedIds.has(id))
    if (filteredDeleted.length !== deleted.length) {
      localStorage.setItem('ardoise_deleted_games', JSON.stringify(filteredDeleted))
    }
  } catch {}

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
    const incomingGames = Array.isArray(incoming.games) ? incoming.games : []
    const incomingPlayers = Array.isArray(incoming.players) ? incoming.players : []

    // Conserver les tombstones distants ou explicites
    const incomingDeletedGames = Array.isArray(incoming.deletedGameIds) ? incoming.deletedGameIds : []
    const incomingDeletedPlayers = Array.isArray(incoming.deletedPlayerIds) ? incoming.deletedPlayerIds : []

    saveDeletedGameIds(incomingDeletedGames)
    saveDeletedPlayerIds(incomingDeletedPlayers)

    if (Array.isArray(incoming.players)) savePlayers(incomingPlayers)
    localStorage.setItem('ardoise_games', JSON.stringify(incomingGames))
    if (Array.isArray(incoming.customPresets)) saveCustomPresets(incoming.customPresets)
    if (incoming.theme) saveTheme(incoming.theme)

    loadActiveGameId()

    return {
      success: true,
      mode: 'replace',
      stats: {
        totalGames: incomingGames.length,
        totalPlayers: incoming.players?.length || 0,
      },
    }
  }

  // Mode fusion
  const { mergedNotebook, stats } = mergeNotebooks(local, incoming)
  // Aligner les profils des joueurs à l'intérieur des parties avec les profils fusionnés
  const playersLookup = new Map(mergedNotebook.players.map(p => [p.id, p]))
  const updatedGames = mergedNotebook.games.map(g => {
    if (!g || !Array.isArray(g.players)) return g
    let changed = false
    const alignedPlayers = g.players.map(p => {
      const up = playersLookup.get(p.id)
      if (up && (p.avatar !== up.avatar || p.color !== up.color || p.name !== up.name)) {
        changed = true
        return { ...p, name: up.name, color: up.color, avatar: up.avatar }
      }
      return p
    })
    return changed ? { ...g, players: alignedPlayers } : g
  })

  savePlayers(mergedNotebook.players)
  localStorage.setItem('ardoise_games', JSON.stringify(updatedGames))
  saveCustomPresets(mergedNotebook.customPresets)
  if (mergedNotebook.theme) saveTheme(mergedNotebook.theme)

  loadActiveGameId()

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
  setLastSyncedAt(new Date().toISOString())
  return data
}

/**
 * Synchronisation bidirectionnelle automatique complète avec le Cloud
 */
export async function synchronizeNotebook(syncKey, options = {}) {
  const key = extractCodeFromInput(syncKey || getSyncKey())
  if (!key) throw new Error('Clé manquante')

  // 1. Tenter de récupérer le carnet distant
  const remote = await fetchRemoteNotebook(key)

  if (!remote.found || !remote.payload) {
    if (options.requireExisting) {
      throw new Error(`Aucun carnet trouvé pour le code ${key}. Vérifiez le code sur votre autre appareil.`)
    }
    // Si c'est un nouveau carnet, on associe la clé et on pousse notre carnet local pour l'initialiser
    setSyncKey(key)
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

  // Si trouvé, on associe définitivement la clé
  setSyncKey(key)

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


