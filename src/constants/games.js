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
    description:
      "Défendez-vous des attaques et débarrassez-vous vite de vos cartes. Il n'y a aucun gagnant : le dernier joueur avec des cartes en main devient le Dourak !",
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
    playersBadge: '2 à 6 j.',
    categoryBadge: '52 cartes',
    description:
      "Posez cartes ou combinaisons, piochez et annoncez « Caracole » (≤ 10 pts) pour marquer 0 pt. Le 8 vaut 0 pt, attention aux 30 pts de pénalité et au sursis pile à 100 pts !",
    minPlayers: 2,
    maxPlayers: 6,
    scoreDir: 'low',
    rules: {
      sections: [
        {
          title: '1. Informations générales',
          items: [
            'Nombre de joueurs : 2 à 6 joueurs (à partir de 6 ans).',
            'Matériel : Un jeu standard de 54 cartes dont on retire les 2 jokers (soit 52 cartes).',
            'Objectif : Avoir le plus petit nombre de points cumulés en fin de partie.',
          ],
        },
        {
          title: '2. Distribution & Mise en place',
          items: [
            '2 à 4 joueurs : 7 cartes distribuées par joueur.',
            '5 à 6 joueurs : 5 cartes distribuées par joueur.',
            'Poser le reste des cartes face cachée au centre pour former la pioche.',
            'Retourner la première carte de la pioche face visible pour entamer la défausse.',
          ],
        },
        {
          title: "3. Déroulement d'un tour",
          content:
            "À son tour, un joueur effectue deux actions obligatoires dans l'ordre :",
          items: [
            '1. Poser : Le joueur pose sur la pile visible (la défausse) soit une carte isolée, soit une combinaison valide de son choix.',
            "2. Piocher : Le joueur reprend une carte : soit la première carte de la pioche face cachée, soit la dernière carte visible de la défausse.",
            "Précision défausse : Si le joueur précédent a posé une combinaison de plusieurs cartes, le joueur actuel a le droit de choisir l'une des cartes situées aux extrémités de cette combinaison.",
            'Remarque (pioche vide) : Si la pioche est épuisée, mélanger toutes les cartes de la défausse sauf la dernière posée pour former une nouvelle pioche face cachée.',
          ],
        },
        {
          title: '4. Combinaisons possibles à poser',
          items: [
            'Paire : 2 cartes de même valeur (ex. : deux 7).',
            'Triple : 3 cartes de même valeur (ex. : trois Dames).',
            'Carré : 4 cartes de même valeur (ex. : quatre 5).',
            "Suite : 3 cartes ou plus qui se suivent et de même enseigne (Cœur, Carreau, Trèfle ou Pique ; la simple couleur rouge/noir ne suffit pas). L'As peut valoir 1 ou se placer après le Roi (ex. : Dame-Roi-As).",
          ],
        },
        {
          title: '5. Valeur des cartes (décompte)',
          items: [
            'Le 8 : 0 point (carte clé pour réduire son score !).',
            "As (1) : 1 point (peut aussi se placer après le Roi dans une suite).",
            'Cartes 2 à 10 : Valeur faciale (2 = 2 pts, 3 = 3 pts... 10 = 10 pts).',
            'Valet : 11 points.',
            'Dame : 12 points.',
            'Roi : 13 points.',
          ],
        },
        {
          title: "6. L'annonce « Caracole » & Fin de manche",
          items: [
            "Lorsqu'un joueur estime n'avoir plus que 10 points ou moins en main, il peut décider de « caracoler » en annonçant distinctement « Caracole ».",
            "Dès l'annonce : le joueur passe immédiatement son tour. Tous les autres joueurs bénéficient d'un dernier tour complet pour améliorer leur main (poser/piocher) ou choisir de passer sans jouer.",
            "Annonce réussie : Si l'annonceur a STRICTEMENT le moins de points en main, il remporte la manche et marque 0 point.",
            "Annonce échouée : Si un autre joueur a autant ou moins de points que lui, l'annonceur reçoit une pénalité et marque 30 points.",
            'Tous les autres joueurs marquent la valeur totale des cartes restantes dans leur main.',
          ],
        },
        {
          title: '7. Règle spéciale des 100 points (Sursis)',
          items: [
            "Si à la fin d'une manche le score cumulé d'un joueur atteint EXACTEMENT 100 points, son score redescend immédiatement à 50 points ! Il gagne un sursis inespéré et reste en course.",
            "En partie courte à 50 points : si un joueur atteint pile 50 points, son score retombe à 25 points (ou zéro selon option).",
          ],
        },
        {
          title: '8. Fin de partie & Désignation du vainqueur',
          items: [
            "Le premier joueur qui dépasse les 100 points perd la partie.",
            "Le vainqueur est alors le joueur qui possède le plus petit nombre de points cumulés.",
            "Variante par élimination : La partie peut continuer par élimination jusqu'à ce qu'il ne reste plus qu'un seul joueur sous la barre des 100 points.",
          ],
        },
      ],
      summaryTable: [
        { item: 'Joueurs / Cartes', value: '2 à 6 j. · 52 cartes (sans Jokers)' },
        { item: 'Distribution', value: '7 cartes (2-4 j.) · 5 cartes (5-6 j.)' },
        { item: 'Valeur du 8', value: '0 pt (clé du jeu)' },
        { item: 'As / Figures', value: 'As = 1 pt · V = 11 · D = 12 · R = 13' },
        { item: 'Annonce Caracole', value: '≤ 10 pts en main (passe son tour)' },
        { item: 'Caracole réussie', value: '0 pt (strictement le plus bas)' },
        { item: 'Caracole échouée', value: '30 pts de pénalité (égalé ou battu)' },
        { item: 'Score pile à 100 pts', value: 'Sursis divisé par 2 (→ 50 pts)' },
        { item: 'Fin de partie', value: 'Dépassement de 100 pts (min gagne)' },
      ],
    },
  },
  [GAMES.PRESIDENT]: {
    id: GAMES.PRESIDENT,
    name: 'Trou du cul (Président)',
    playersBadge: '3–8 j.',
    categoryBadge: '54 cartes',
    description:
      'Débarrassez-vous de vos cartes en montant dans les valeurs pour finir premier (Président) et dominer le perdant, qui devra vous donner ses meilleurs atouts.',
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
    description:
      "Révélez, échangez et alignez vos 12 cartes numérotées pour obtenir le total le plus bas possible. La partie s'arrête dès qu'un joueur franchit les 100 points.",
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
    description:
      "Le grand classique en 2 contre 2 : prenez l'atout, réalisez vos plis et atteignez votre contrat pour marquer les 162 points (ou réussir un Capot).",
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
    description:
      "Le Preneur défie la table : capturez les Bouts (le Petit, le 21, l'Excuse) et remportez un maximum de plis pour faire passer votre Garde face à la Défense.",
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
    description:
      "Placez vos numéros sur les rangées dans l'ordre croissant sans jamais poser la 6ᵉ carte, sous peine de ramasser toute la ligne et ses têtes de bœuf !",
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
