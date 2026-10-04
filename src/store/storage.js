// LocalStorage store avec persistance complète

const STORAGE_KEYS = {
  PLAYERS: 'ardoise_players',
  DELETED_PLAYERS: 'ardoise_deleted_players',
  GAMES: 'ardoise_games',
  DELETED_GAMES: 'ardoise_deleted_games',
  ACTIVE_GAME: 'ardoise_active_game',
  THEME: 'ardoise_theme',
  CUSTOM_PRESETS: 'ardoise_custom_presets',
}

// --- Joueurs ---
export const loadDeletedPlayerIds = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.DELETED_PLAYERS))
    return Array.isArray(raw) ? raw : []
  } catch { return [] }
}

export const saveDeletedPlayerIds = (ids) => {
  try {
    const list = Array.isArray(ids) ? Array.from(new Set(ids)).slice(-500) : []
    localStorage.setItem(STORAGE_KEYS.DELETED_PLAYERS, JSON.stringify(list))
  } catch {}
}


export const untombstonePlayer = (id) => {
  try {
    if (!id) return
    const deleted = loadDeletedPlayerIds()
    const filtered = deleted.filter(item => item !== id)
    if (filtered.length !== deleted.length) {
      localStorage.setItem(STORAGE_KEYS.DELETED_PLAYERS, JSON.stringify(filtered))
    }
  } catch {}
}

export const savePlayers = (players) =>
  localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players))

export const loadPlayers = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.PLAYERS))
    const deletedIds = new Set(loadDeletedPlayerIds())
    return Array.isArray(raw)
      ? raw.filter(p => p && typeof p === 'object' && p.id && !deletedIds.has(p.id))
      : []
  } catch { return [] }
}

export const deletePlayer = (id) => {
  if (!id) return
  // 1. Ajouter l'ID à la liste des tombstones
  try {
    const deleted = loadDeletedPlayerIds()
    if (!deleted.includes(id)) {
      deleted.push(id)
      localStorage.setItem(STORAGE_KEYS.DELETED_PLAYERS, JSON.stringify(deleted.slice(-500)))
    }
  } catch {}

  // 2. Retirer du localStorage
  const players = loadPlayers().filter(p => p && p.id !== id)
  savePlayers(players)
}

// --- Parties ---
export const saveGame = (game) => {
  if (!game || !game.id) return

  // Si cette partie avait été supprimée précédemment, on la retire des tombstones
  try {
    const deleted = loadDeletedGameIds()
    if (deleted.includes(game.id)) {
      const filtered = deleted.filter(id => id !== game.id)
      localStorage.setItem(STORAGE_KEYS.DELETED_GAMES, JSON.stringify(filtered))
    }
  } catch {}

  const games = loadGames()
  const idx = games.findIndex(g => g && g.id === game.id)
  if (idx >= 0) games[idx] = game
  else games.unshift(game)
  localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(games))
}

export const loadGames = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.GAMES))
    const deletedIds = new Set(loadDeletedGameIds())
    return Array.isArray(raw)
      ? raw.filter(g => g && typeof g === 'object' && g.id && !deletedIds.has(g.id))
      : []
  } catch { return [] }
}

export const loadDeletedGameIds = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.DELETED_GAMES))
    return Array.isArray(raw) ? raw : []
  } catch { return [] }
}

export const saveDeletedGameIds = (ids) => {
  try {
    const list = Array.isArray(ids) ? Array.from(new Set(ids)).slice(-500) : []
    localStorage.setItem(STORAGE_KEYS.DELETED_GAMES, JSON.stringify(list))
  } catch {}
}


export const deleteGame = (id) => {
  if (!id) return
  // 1. Ajouter l'ID à la liste des parties supprimées (tombstone)
  try {
    const deleted = loadDeletedGameIds()
    if (!deleted.includes(id)) {
      deleted.push(id)
      localStorage.setItem(STORAGE_KEYS.DELETED_GAMES, JSON.stringify(deleted.slice(-500)))
    }
  } catch {}

  // 2. Retirer la partie du tableau des parties
  const games = loadGames().filter(g => g && g.id !== id)
  localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(games))

  // 3. Si la partie supprimée était la partie active, vider l'active game
  if (loadActiveGameId() === id) {
    saveActiveGameId(null)
  }
}

// --- Modèles de jeux personnalisés ---
export const saveCustomPresets = (presets) =>
  localStorage.setItem(STORAGE_KEYS.CUSTOM_PRESETS, JSON.stringify(presets))

export const loadCustomPresets = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_PRESETS))
    return Array.isArray(raw) ? raw.filter(p => p && typeof p === 'object' && p.id) : []
  } catch { return [] }
}

export const saveCustomPreset = (preset) => {
  const presets = loadCustomPresets()
  const idx = presets.findIndex(p => p.id === preset.id)
  if (idx >= 0) presets[idx] = preset
  else presets.unshift(preset)
  saveCustomPresets(presets)
  return presets
}

export const deleteCustomPreset = (id) => {
  const presets = loadCustomPresets().filter(p => p.id !== id)
  saveCustomPresets(presets)
  return presets
}

// --- Partie active ---
export const saveActiveGameId = (id) =>
  id
    ? localStorage.setItem(STORAGE_KEYS.ACTIVE_GAME, id)
    : localStorage.removeItem(STORAGE_KEYS.ACTIVE_GAME)

export const loadActiveGameId = () => {
  const id = localStorage.getItem(STORAGE_KEYS.ACTIVE_GAME)
  if (!id) return null
  try {
    const deletedIds = new Set(loadDeletedGameIds())
    if (deletedIds.has(id)) {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_GAME)
      return null
    }
  } catch {}
  return id
}


// --- Thème ---
export const saveTheme = (theme) =>
  localStorage.setItem(STORAGE_KEYS.THEME, theme)

export const loadTheme = () =>
  localStorage.getItem(STORAGE_KEYS.THEME) || 'light'

// --- Utilitaires ---
export const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
