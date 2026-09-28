// Constantes et règles officielles pour tous les jeux intégrés (Zéro émoji)

export const GAMES = {
  DOURAK: 'dourak',
  CARACOLE: 'caracole',
  PRESIDENT: 'president',
  SKYJO: 'skyjo',
  BELOTE: 'belote',
  TAROT: 'tarot',
  SIX_QUI_PREND: 'six_qui_prend',
  UNIVERSEL: 'universel',
}

export const GAME_META = {
  [GAMES.DOURAK]: {
    id: GAMES.DOURAK,
    name: "Dourak (l'idiot)",
    playersBadge: '2 à 6 j.',
    categoryBadge: '36 cartes',
    description: 'Pas de vainqueur, le dernier joueur en main est le Dourak.',
    minPlayers: 2,
    maxPlayers: 6,
    scoreDir: 'low',
    rules: {
      sections: [
        {
          title: 'Le But',
          content:
            "Se défausser de toutes ses cartes. Il n'y a pas de gagnant à proprement parler : le dernier joueur ayant encore des cartes en main devient le « Dourak » (l'idiot).",
        },
        {
          title: 'Préparation',
          items: [
            'Paquet de 36 cartes (du 6 à l’As).',
            '6 cartes distribuées à chaque joueur.',
            "La carte suivante est retournée visible sous la pioche : sa couleur détermine l'Atout (Kozyr) pour toute la manche.",
          ],
        },
        {
          title: "Déroulement d'un tour",
          items: [
            "Le joueur ayant le plus petit atout commence en tant qu'Attaquant.",
            'Le joueur situé à sa gauche est le Défenseur.',
            "L'attaquant pose une carte. Le défenseur doit la battre avec une carte plus forte de la même couleur, ou avec un atout. Si l'attaque est un atout, seul un atout supérieur peut la battre.",
            "Les autres joueurs (ou l'attaquant) peuvent ajouter des cartes de même valeur que celles déjà posées sur la table (limité à 6 cartes max ou au nombre de cartes en main du défenseur).",
          ],
        },
        {
          title: 'Résolution du tour',
          items: [
            "Défense réussie : toutes les cartes jouées sont écartées à la défausse (Otboy). Le défenseur devient le nouvel attaquant.",
            "Défense échouée (Abandon) : le défenseur ramasse toutes les cartes posées sur la table et passe son tour d'attaque (le joueur à sa gauche attaque).",
          ],
        },
        {
          title: 'Recharge & Fin de manche',
          items: [
            "Recharge : après chaque pli, tout le monde repioche pour remonter à 6 cartes en main (dans l'ordre : attaquant principal, autres attaquants, puis défenseur).",
            "Fin de manche : lorsque la pioche est épuisée, on joue jusqu'à épuisement des mains. Le dernier joueur qui conserve des cartes est déclaré Dourak.",
          ],
        },
      ],
      summaryTable: [
        { item: 'Paquet utilisé', value: '36 cartes (6 à As)' },
        { item: 'Main de départ / Recharge', value: '6 cartes' },
        { item: 'Limite par assaut', value: '6 cartes max.' },
        { item: 'Perdant de la manche', value: '+1 Dourak (ou cartes restantes)' },
      ],
    },
  },
  [GAMES.CARACOLE]: {
    id: GAMES.CARACOLE,
    name: 'Caracole',
    playersBadge: '2–8 j.',
    categoryBadge: '54 cartes',
    description: 'Objectif score minimal, cartes cachées et règle du sursis.',
    minPlayers: 2,
    maxPlayers: 8,
    scoreDir: 'low',
    rules: {
      sections: [
        {
          title: 'Objectif & Seuil',
          content:
            "Avoir le total de points le plus bas possible. La partie se joue habituellement jusqu'à 100 points (ou 50 points en partie rapide/courte). Dès qu'un joueur dépasse le seuil éliminatoire, la partie s'arrête et le joueur au score le plus bas l'emporte.",
        },
        {
          title: "Déroulement d'une manche",
          items: [
            "Chaque joueur dispose de 4 cartes face cachée devant lui disposées en carré. Au début de la manche, chacun mémorise secrètement 2 de ses 4 cartes.",
            "À son tour, on pioche une carte (depuis la pioche ou la défausse) : on peut l'échanger avec l'une de ses cartes cachées, ou la défausser directement pour activer son effet (regarder une de ses cartes, espionner une carte adverse, échanger deux cartes).",
            "Dès qu'un joueur estime avoir la plus petite valeur totale en main, il crie « Caracole ! ». Les autres joueurs jouent alors un dernier tour.",
          ],
        },
        {
          title: 'Comptage des pénalités',
          items: [
            "Toutes les cartes de la table sont révélées. Chaque joueur additionne la valeur faciale de ses cartes restantes (As = 1 pt, 2 à 10 = valeur faciale, Valet/Dame = 10 pts, Rois rouges = 0 ou -1 pt selon variantes).",
            "Si l'annonceur a effectivement le score strictement le plus faible, il marque 0 point. S'il est battu ou égalé, il encaisse la valeur de ses cartes plus une pénalité (+10 ou +20 pts selon la table).",
          ],
        },
        {
          title: 'Règle spéciale du Sursis (pile à 100 ou 50 pts)',
          items: [
            "Si à la fin d'une manche un joueur atteint EXACTEMENT 100 points, son score est automatiquement divisé par deux et retombe à 50 points ! Il gagne un sursis inespéré et reste en course au lieu d'être éliminé.",
            "En partie courte à 50 points : si un joueur atteint pile 50 points, son score retombe à 25 points (ou est remis à zéro selon la variante locale choisie).",
            "Tout score qui dépasse strictement le seuil (ex: 101 pts à 100, ou 51 pts à 50) élimine le joueur et déclenche la fin de la partie.",
          ],
        },
      ],
      summaryTable: [
        { item: 'Score pile à 100 pts', value: 'Divisé par 2 (→ 50 pts)' },
        { item: 'Score pile à 50 pts (partie courte)', value: 'Divisé par 2 (→ 25 pts)' },
        { item: 'Dépassement du seuil (> seuil)', value: 'Fin de partie / Élimination' },
        { item: 'Vainqueur final', value: 'Score le plus bas' },
      ],
    },
  },
  [GAMES.PRESIDENT]: {
    id: GAMES.PRESIDENT,
    name: 'Trou du cul (Président)',
    playersBadge: '3–8 j.',
    categoryBadge: '54 cartes',
    description: 'Hiérarchie des rôles et échanges de cartes.',
    minPlayers: 3,
    maxPlayers: 8,
    scoreDir: 'high',
    rules: {
      objective:
        "Être le premier à vider sa main pour devenir Président et accumuler le plus de points au fil des manches.",
      gameplay:
        "Ordre des cartes (de la plus faible à la plus forte) : 3, 4, 5, 6, 7, 8, 9, 10, Valet, Dame, Roi, As, et le 2 (qui coupe le pli). On pose des cartes simples, paires, brelans ou carrés de valeur supérieure ou égale. Avant chaque nouvelle manche, le Trou du cul donne ses 2 meilleures cartes au Président (qui lui rend 2 cartes de son choix) ; le Vice-Trou échange 1 carte avec le Vice-Président.",
      scoring:
        "Les rôles et points sont attribués dans l'ordre de sortie : Président (+2 pts), Vice-Président (+1 pt), Neutre (0 pt), Vice-Trou (-1 pt), Trou du cul (-2 pts).",
      summaryTable: [
        { item: '1er — Président', value: '+2 pts (reçoit 2 cartes)' },
        { item: '2e — Vice-Président', value: '+1 pt (reçoit 1 carte)' },
        { item: 'Milieu — Neutre', value: '0 pt' },
        { item: 'Avant-dernier — Vice-Trou', value: '-1 pt (donne 1 carte)' },
        { item: 'Dernier — Trou du cul', value: '-2 pts (donne 2 meilleures)' },
      ],
    },
  },
  [GAMES.SKYJO]: {
    id: GAMES.SKYJO,
    name: 'Skyjo',
    playersBadge: '2–8 j.',
    categoryBadge: 'Jeu Skyjo',
    description: 'Cumul minimal sur 12 cartes, arrêt à 100 points.',
    minPlayers: 2,
    maxPlayers: 8,
    scoreDir: 'low',
    endScore: 100,
    rules: {
      objective:
        "Avoir le total de points le plus faible possible à la fin de la partie, qui s'arrête dès qu'un joueur atteint ou dépasse 100 points.",
      gameplay:
        "Chaque joueur dispose de 12 cartes face cachée en grille de 4 colonnes × 3 lignes (valeurs de -2 à 12). À son tour, on pioche (pioche ou défausse) pour remplacer une carte ou retourner une carte cachée. Si les 3 cartes d'une même colonne sont visibles et strictement identiques, toute la colonne est défaussée (0 pt).",
      scoring:
        "Dès qu'un joueur retourne sa dernière carte, les autres jouent un dernier tour puis on additionne les cartes. Attention : le joueur qui a clôturé la manche doit avoir le score strictement le plus bas de la table ; sinon (même en cas d'égalité), son score de manche (s'il est positif) est doublé !",
      summaryTable: [
        { item: 'Colonne de 3 cartes identiques', value: 'Défaussée (0 pt)' },
        { item: 'Clôtureur avec score strictement min.', value: 'Score normal' },
        { item: 'Clôtureur battu ou égalé (score > 0)', value: 'Score × 2 (malus)' },
        { item: 'Seuil de fin de partie', value: '100 points' },
      ],
    },
  },
  [GAMES.BELOTE]: {
    id: GAMES.BELOTE,
    name: 'Belote / Coinche',
    playersBadge: '2 éq. (4 j.)',
    categoryBadge: '32 cartes',
    description: 'Duel Nous contre Eux sur 162 points et contrats.',
    minPlayers: 2,
    maxPlayers: 4,
    scoreDir: 'high',
    teams: true,
    rules: {
      objective:
        "En équipe (Nous vs Eux), remplir les contrats annoncés en réalisant au moins 82 points sur les 162 points de la donne.",
      gameplay:
        "À l'atout : Valet (20 pts), 9 (14 pts), As (11 pts), 10 (10 pts), Roi (4 pts), Dame (3 pts). Hors atout : As (11 pts), 10 (10 pts), Roi (4 pts), Dame (3 pts), Valet (2 pts). Le dernier pli rapporte 10 pts (« dix de der »), soit un total de 162 points hors annonces.",
      scoring:
        "Si le preneur remplit son contrat (≥ 82 pts et ≥ contrat), l'équipe marque ses points + le contrat + les annonces (Belote-Rebelote +20). En cas de chute (« dedans »), la défense marque les 162 points + le contrat + les annonces. Capot (tous les plis) = 252 pts ; Générale (tous les plis par un seul joueur) = 500 pts.",
      summaryTable: [
        { item: 'Total des plis (avec 10 de der)', value: '162 pts' },
        { item: 'Belote + Rebelote (Roi & Dame atout)', value: '+20 pts' },
        { item: 'Capot (8 plis réalisés)', value: '252 pts' },
        { item: 'Générale (8 plis d’une main)', value: '500 pts' },
      ],
    },
  },
  [GAMES.TAROT]: {
    id: GAMES.TAROT,
    name: 'Tarot',
    playersBadge: '3–5 j.',
    categoryBadge: '78 cartes',
    description: 'Attaque contre défense, bouts et multiplicateurs.',
    minPlayers: 3,
    maxPlayers: 5,
    scoreDir: 'high',
    rules: {
      objective:
        "Le preneur (seul à 3 ou 4 joueurs, ou avec un partenaire appelé au Roi à 5 joueurs) doit atteindre un seuil de points dépendant du nombre de Bouts (21, Petit, Excuse) dans ses plis.",
      gameplay:
        "Le jeu totalise 91 points. Le seuil à atteindre par l'attaque dépend des Bouts : 0 bout = 56 pts, 1 bout = 51 pts, 2 bouts = 41 pts, 3 bouts = 36 pts. Les enchères déterminent le coefficient : Petite (×1), Garde (×2), Garde Sans le chien (×4), Garde Contre le chien (×6).",
      scoring:
        "Score de base = (25 + écart au seuil) × coefficient du contrat. Si le Petit est mené au bout (dernier pli), bonus/malus de 10 × coefficient. Chaque défenseur donne (ou reçoit en cas de chute) ce total au preneur (à somme nulle).",
      summaryTable: [
        { item: 'Seuils (0 / 1 / 2 / 3 Bouts)', value: '56 / 51 / 41 / 36 pts' },
        { item: 'Petite / Garde', value: '×1 / ×2' },
        { item: 'Garde Sans / Garde Contre', value: '×4 / ×6' },
        { item: 'Petit au bout (1er atout au 18e pli)', value: '±10 pts × coeff.' },
      ],
    },
  },
  [GAMES.SIX_QUI_PREND]: {
    id: GAMES.SIX_QUI_PREND,
    name: '6 qui prend !',
    playersBadge: '2–10 j.',
    categoryBadge: 'Jeu 6 qui prend',
    description: 'Décompte des têtes de bœuf, arrêt à 66 têtes.',
    minPlayers: 2,
    maxPlayers: 10,
    scoreDir: 'low',
    eliminationScore: 66,
    rules: {
      objective:
        "Récolter le moins de têtes de bœuf (points de pénalité) possible. La partie prend fin dès qu'un joueur atteint ou dépasse 66 têtes de bœuf.",
      gameplay:
        "10 cartes par joueur, 4 rangées au centre. À chaque tour, tous choisissent une carte simultanément et les placent par ordre croissant sur la rangée dont la dernière carte est inférieure avec le plus petit écart. Si un joueur pose la 6e carte d'une rangée (ou une carte plus faible que toutes les rangées), il ramasse les cartes de la rangée et sa carte en devient la première.",
      scoring:
        "Chaque carte ramassée vaut un nombre de têtes de bœuf : Carte 55 = 7 têtes ; Doublons (11, 22, 33...) = 5 têtes ; Multiples de 10 (10, 20, 30...) = 3 têtes ; Multiples de 5 (5, 15, 25...) = 2 têtes ; Autres cartes = 1 tête.",
      summaryTable: [
        { item: 'Carte 55', value: '7 têtes' },
        { item: 'Doublons (11, 22, 33, 44…)', value: '5 têtes' },
        { item: 'Multiples de 10 (10, 20, 30…)', value: '3 têtes' },
        { item: 'Multiples de 5 (5, 15, 25…)', value: '2 têtes' },
        { item: 'Autres cartes / Fin de partie', value: '1 tête / 66 têtes' },
      ],
    },
  },
  [GAMES.UNIVERSEL]: {
    id: GAMES.UNIVERSEL,
    name: 'Compteur Universel',
    playersBadge: '2–12 j.',
    categoryBadge: 'Tous jeux',
    description: 'Ardoise libre adaptée à tous vos jeux de société.',
    minPlayers: 2,
    maxPlayers: 12,
    scoreDir: 'configurable',
    rules: {
      objective:
        "Noter librement les points manche après manche pour n'importe quel jeu de cartes ou de société (Uno, Rami, Scrabble, Molky, Flip 7, etc.).",
      gameplay:
        "Choisissez à la création de la partie entre deux règles de classement : soit le score le plus élevé l'emporte, soit le score le plus faible gagne avec un seuil d'élimination paramétrable (50, 100, 150 ou 200 pts).",
      scoring:
        "Utilisez le pavé tactile rapide (+1, +5, +10, -1, 0) pour saisir les points de chaque joueur d'une seule main à la fin de chaque manche.",
      summaryTable: [
        { item: 'Mode Score élevé', value: 'Le plus grand total gagne' },
        { item: 'Mode Seuil éliminatoire', value: 'Le plus petit total gagne' },
      ],
    },
  },
}

export const PRESIDENT_ROLES = [
  { id: 'president', label: 'Président', short: 'Prés.', points: 2 },
  { id: 'vice_president', label: 'Vice-Président', short: 'Vice-P.', points: 1 },
  { id: 'neutre', label: 'Neutre', short: 'Neutre', points: 0 },
  { id: 'vice_trou', label: 'Vice-Trou', short: 'Vice-T.', points: -1 },
  { id: 'trou', label: 'Trou du cul', short: 'Trou', points: -2 },
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

// Avatars illustrés (10 avatars complétant la grille 5x2)
export const PRESET_AVATARS = Array.from(
  { length: 10 },
  (_, i) => `/avatar/Fichier ${i + 1}.png`
)

// Palette craies & feutres d'écolier (pour l'option initiale)
export const AVATAR_COLORS = [
  '#c83b3b', // Rouge marge / maîtresse
  '#1e3a5f', // Bleu marine / encre
  '#1f5c43', // Vert tableau
  '#b47b18', // Ocre jaune
  '#5b3256', // Prune d'encre
  '#9c4221', // Terre de Sienne
  '#334e68', // Bleu ardoise
  '#475569', // Gris graphite
]

export const AVATAR_COLOR_NAMES = {
  '#c83b3b': 'Rouge marge',
  '#1e3a5f': 'Bleu encre',
  '#1f5c43': 'Vert tableau',
  '#b47b18': 'Ocre',
  '#5b3256': 'Prune',
  '#9c4221': 'Terre cuite',
  '#334e68': 'Ardoise',
  '#475569': 'Graphite',
}
