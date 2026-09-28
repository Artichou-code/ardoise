// LocalStorage store avec persistance complète

const STORAGE_KEYS = {
  PLAYERS: 'ardoise_players',
  GAMES: 'ardoise_games',
  ACTIVE_GAME: 'ardoise_active_game',
  THEME: 'ardoise_theme',
  CUSTOM_PRESETS: 'ardoise_custom_presets',
}

// --- Joueurs ---
export const savePlayers = (players) =>
  localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players))

export const loadPlayers = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.PLAYERS))
    return Array.isArray(raw) ? raw.filter(p => p && typeof p === 'object' && p.name) : []
  } catch { return [] }
}

// --- Parties ---
export const saveGame = (game) => {
  if (!game || !game.id) return
  const games = loadGames()
  const idx = games.findIndex(g => g && g.id === game.id)
  if (idx >= 0) games[idx] = game
  else games.unshift(game)
  localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(games))
}

export const loadGames = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.GAMES))
    return Array.isArray(raw) ? raw.filter(g => g && typeof g === 'object' && g.id) : []
  } catch { return [] }
}

export const deleteGame = (id) => {
  const games = loadGames().filter(g => g && g.id !== id)
  localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(games))
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

export const loadActiveGameId = () =>
  localStorage.getItem(STORAGE_KEYS.ACTIVE_GAME)

// --- Thème ---
export const saveTheme = (theme) =>
  localStorage.setItem(STORAGE_KEYS.THEME, theme)

export const loadTheme = () =>
  localStorage.getItem(STORAGE_KEYS.THEME) || 'light'

// --- Utilitaires ---
export const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
