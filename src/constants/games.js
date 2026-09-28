// Constantes pour tous les jeux intégrés

export const GAMES = {
  CARACOLE: 'caracole',
  PRESIDENT: 'president',
  SKYJO: 'skyjo',
  BELOTE: 'belote',
  TAROT: 'tarot',
  SIX_QUI_PREND: 'six_qui_prend',
  UNIVERSEL: 'universel',
}

export const GAME_META = {
  [GAMES.CARACOLE]: {
    id: GAMES.CARACOLE,
    name: 'Caracole',
    emoji: '🃏',
    description: 'Pénalités par cartes restantes en main',
    minPlayers: 2,
    maxPlayers: 8,
    scoreDir: 'low', // le plus bas gagne
  },
  [GAMES.PRESIDENT]: {
    id: GAMES.PRESIDENT,
    name: 'Trou du cul (Président)',
    emoji: '👑',
    description: 'Rangs et rôles par manche',
    minPlayers: 3,
    maxPlayers: 8,
    scoreDir: 'high',
  },
  [GAMES.SKYJO]: {
    id: GAMES.SKYJO,
    name: 'Skyjo',
    emoji: '☁️',
    description: 'Accumulation de manches, fin à 100 pts',
    minPlayers: 2,
    maxPlayers: 8,
    scoreDir: 'low',
    endScore: 100,
  },
  [GAMES.BELOTE]: {
    id: GAMES.BELOTE,
    name: 'Belote / Coinche',
    emoji: '♠️',
    description: '2 équipes (Nous / Eux), 162 pts à répartir',
    minPlayers: 2,
    maxPlayers: 4,
    scoreDir: 'high',
    teams: true,
  },
  [GAMES.TAROT]: {
    id: GAMES.TAROT,
    name: 'Tarot',
    emoji: '🔮',
    description: '3 à 5 joueurs, contrats et multiplicateurs',
    minPlayers: 3,
    maxPlayers: 5,
    scoreDir: 'high',
  },
  [GAMES.SIX_QUI_PREND]: {
    id: GAMES.SIX_QUI_PREND,
    name: '6 qui prend !',
    emoji: '🐂',
    description: 'Décompte de têtes de bœuf, élimination à 66',
    minPlayers: 2,
    maxPlayers: 10,
    scoreDir: 'low',
    eliminationScore: 66,
  },
  [GAMES.UNIVERSEL]: {
    id: GAMES.UNIVERSEL,
    name: 'Compteur Universel',
    emoji: '🎲',
    description: 'Partie libre configurable',
    minPlayers: 2,
    maxPlayers: 12,
    scoreDir: 'configurable',
  },
}

export const PRESIDENT_ROLES = [
  { id: 'president', label: 'Président', points: 2, emoji: '👑' },
  { id: 'vice_president', label: 'Vice-P.', points: 1, emoji: '🥈' },
  { id: 'neutre', label: 'Neutre', points: 0, emoji: '😐' },
  { id: 'vice_trou', label: 'Vice-Trou', points: -1, emoji: '😕' },
  { id: 'trou', label: 'Trou du cul', points: -2, emoji: '💩' },
]

export const TAROT_CONTRACTS = [
  { id: 'petite', label: 'Petite', multiplier: 1 },
  { id: 'garde', label: 'Garde', multiplier: 2 },
  { id: 'garde_sans', label: 'Garde Sans', multiplier: 4 },
  { id: 'garde_contre', label: 'Garde Contre', multiplier: 6 },
]

export const TAROT_BOUTS_THRESHOLDS = [56, 51, 41, 36] // 0,1,2,3 bouts

export const BELOTE_CONTRACTS = [
  { value: 80, label: '80' }, { value: 90, label: '90' },
  { value: 100, label: '100' }, { value: 110, label: '110' },
  { value: 120, label: '120' }, { value: 130, label: '130' },
  { value: 140, label: '140' }, { value: 150, label: '150' },
  { value: 160, label: '160' }, { value: 252, label: 'Capot (252)' },
  { value: 500, label: 'Générale (500)' },
]

export const AVATAR_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
  '#6366f1', '#10b981', '#f59e0b', '#84cc16',
]

export const AVATAR_EMOJIS = ['😀','😎','🥳','🤩','😈','👾','🦊','🐯','🦁','🐸','🤖','👻','🎭','🦄','🐲','🎸']
