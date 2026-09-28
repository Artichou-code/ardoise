// LocalStorage store avec persistance complète

const STORAGE_KEYS = {
  PLAYERS: 'ardoise_players',
  GAMES: 'ardoise_games',
  ACTIVE_GAME: 'ardoise_active_game',
  THEME: 'ardoise_theme',
}

// --- Joueurs ---
export const savePlayers = (players) =>
  localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players))

export const loadPlayers = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PLAYERS)) || []
  } catch { return [] }
}

// --- Parties ---
export const saveGame = (game) => {
  const games = loadGames()
  const idx = games.findIndex(g => g.id === game.id)
  if (idx >= 0) games[idx] = game
  else games.unshift(game)
  localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(games))
}

export const loadGames = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.GAMES)) || []
  } catch { return [] }
}

export const deleteGame = (id) => {
  const games = loadGames().filter(g => g.id !== id)
  localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(games))
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
