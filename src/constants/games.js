// Constantes et règles officielles pour tous les jeux intégrés (Zéro émoji)

export const GAMES = {
  DOURAK: 'dourak',
  CARACOLE: 'caracole',
  PRESIDENT: 'president',
  SKYJO: 'skyjo',
  BELOTE: 'belote',
  TAROT: 'tarot',
  SIX_QUI_PREND: 'six_qui_prend',
  DAME_DE_PIQUE: 'dame_de_pique',
  FLIP_7: 'flip_7',
  SEA_SALT_PAPER: 'sea_salt_paper',
  ASCENSEUR: 'ascenseur',
  RAMI: 'rami',
  YANIV: 'yaniv',
  BARBU: 'barbu',
  UNIVERSEL: 'universel',
}

export const GAME_META = {
  [GAMES.DOURAK]: {
    id: GAMES.DOURAK,
    deckType: 'classic',
    name: 'Dourak',
    playersBadge: '2 à 6 j.',
    categoryBadge: '36 cartes',
    description:
      "Défendez-vous des attaques et débarrassez-vous vite de vos cartes. Il n'y a aucun gagnant : le dernier joueur avec des cartes en main devient le Dourak !",
    minPlayers: 2,
    maxPlayers: 6,
    scoreDir: 'low',
    rules: {
      sections: [
        {
          title: 'Informations générales & But',
          items: [
            'Nombre de joueurs : 2 à 6 joueurs.',
            'Matériel : Paquet de 36 cartes (du 6 à l’As).',
            "Objectif : Se débarrasser de toutes ses cartes au plus vite. Il n'y a pas de gagnant : le dernier joueur conservant des cartes en main est déclaré « Dourak » (l'idiot).",
          ],
        },
        {
          title: 'Préparation & Atout (Kozyr)',
          items: [
            'Distribuer 6 cartes à chaque joueur.',
            "La carte suivante est retournée face visible sous la pioche : sa couleur détermine l'Atout (Kozyr) pour toute la manche.",
            "Le joueur détenant le plus petit atout commence en tant qu'Attaquant initial.",
          ],
        },
        {
          title: "Déroulement de l'Attaque & Défense",
          items: [
            "Le joueur situé à gauche de l'attaquant est le Défenseur.",
            "L'attaquant pose une ou plusieurs cartes de même valeur faciale.",
            "Le défenseur doit battre chaque carte attaquante : soit par une carte supérieure de la même couleur, soit par un atout (un atout ne peut être battu que par un atout supérieur).",
            "Les autres joueurs (ou l'attaquant) peuvent ajouter de nouvelles cartes d'attaque, à condition qu'elles soient de même valeur qu'une carte déjà posée sur la table lors de ce pli (limité à 6 cartes max ou au nombre de cartes en main du défenseur).",
          ],
        },
        {
          title: "Variante d'attaque : Simple vs Transfert (Perevodnoy)",
          items: [
            "Dourak simple (Podkidnoy) : Le défenseur doit impérativement contrer toutes les cartes ou abandonner.",
            "Dourak avec transfert (Perevodnoy) : Avant de poser la moindre carte de défense, si le défenseur possède une carte de même valeur que l'attaque, il peut la poser pour transférer l'attaque complète au joueur à sa gauche, qui devient le nouveau défenseur.",
          ],
        },
        {
          title: 'Résolution du pli & Recharge',
          items: [
            "Défense réussie : Toutes les cartes jouées sont écartées définitivement à la défausse (Otboy). Le défenseur devient le nouvel attaquant.",
            "Défense échouée (Abandon) : Le défenseur ramasse toutes les cartes posées sur la table et passe son tour d'attaque (le joueur à sa gauche attaque).",
            "Recharge : Tant que la pioche n'est pas vide, chaque joueur repioche pour remonter à 6 cartes en main (dans l'ordre : attaquant principal, autres attaquants, puis défenseur).",
          ],
        },
        {
          title: 'Les 2 Modes de Comptage dans Ardoise',
          items: [
            "Mode Classique (+1 défaite) : Le Dourak de la manche reçoit 1 défaite (symbolisée par les bâtons de craie d'écolier). Le premier joueur à atteindre la limite fixée (ex: 5 défaites) perd la partie.",
            "Mode Pénalité aux cartes : À la fin de la manche, le Dourak encaisse autant de points de pénalité qu'il lui reste de cartes en main (1 à 6 cartes). Le premier à atteindre le seuil éliminatoire (ex: 30 cartes) est le perdant.",
          ],
        },
      ],
      summaryTable: [
        { item: 'Paquet utilisé', value: '36 cartes (6 à As)' },
        { item: 'Main de départ / Recharge', value: '6 cartes' },
        { item: 'Limite par assaut', value: '6 cartes max.' },
        { item: 'Mode Classique', value: '+1 défaite au Dourak (bâtons)' },
        { item: 'Mode Pénalité cartes', value: '+1 pt par carte restante' },
        { item: 'Fin de partie', value: 'Seuil atteint (min gagne)' },
      ],
    },
  },
  [GAMES.CARACOLE]: {
    id: GAMES.CARACOLE,
    deckType: 'classic',
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
          title: 'Informations générales',
          items: [
            'Nombre de joueurs : 2 à 6 joueurs (à partir de 6 ans).',
            'Matériel : Un jeu standard de 54 cartes dont on retire les 2 jokers (soit 52 cartes).',
            'Objectif : Avoir le plus petit nombre de points cumulés en fin de partie.',
          ],
        },
        {
          title: 'Distribution & Mise en place',
          items: [
            '2 à 4 joueurs : 7 cartes distribuées par joueur.',
            '5 à 6 joueurs : 5 cartes distribuées par joueur.',
            'Poser le reste des cartes face cachée au centre pour former la pioche.',
            'Retourner la première carte de la pioche face visible pour entamer la défausse.',
          ],
        },
        {
          title: "Déroulement d'un tour",
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
          title: 'Combinaisons possibles à poser',
          items: [
            'Paire : 2 cartes de même valeur (ex. : deux 7).',
            'Triple : 3 cartes de même valeur (ex. : trois Dames).',
            'Carré : 4 cartes de même valeur (ex. : quatre 5).',
            "Suite : 3 cartes ou plus qui se suivent et de même enseigne (Cœur, Carreau, Trèfle ou Pique ; la simple couleur rouge/noir ne suffit pas). L'As peut valoir 1 ou se placer après le Roi (ex. : Dame-Roi-As).",
          ],
        },
        {
          title: 'Valeur des cartes (décompte)',
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
          title: "L'annonce « Caracole » & Fin de manche",
          items: [
            "Lorsqu'un joueur estime n'avoir plus que 10 points ou moins en main, il peut décider de « caracoler » en annonçant distinctement « Caracole ».",
            "Dès l'annonce : le joueur passe immédiatement son tour. Tous les autres joueurs bénéficient d'un dernier tour complet pour améliorer leur main (poser/piocher) ou choisir de passer sans jouer.",
            "Annonce réussie : Si l'annonceur a STRICTEMENT le moins de points en main, il remporte la manche et marque 0 point.",
            "Annonce échouée : Si un autre joueur a autant ou moins de points que lui, l'annonceur reçoit une pénalité et marque 30 points.",
            'Tous les autres joueurs marquent la valeur totale des cartes restantes dans leur main.',
          ],
        },
        {
          title: 'Règle spéciale des 100 points (Sursis)',
          items: [
            "Si à la fin d'une manche le score cumulé d'un joueur atteint EXACTEMENT 100 points, son score redescend immédiatement à 50 points ! Il gagne un sursis inespéré et reste en course.",
            "En partie courte à 50 points : si un joueur atteint pile 50 points, son score retombe à 25 points (ou zéro selon option).",
          ],
        },
        {
          title: 'Fin de partie & Désignation du vainqueur',
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
    deckType: 'classic',
    name: 'Trou du cul',
    playersBadge: '3–8 j.',
    categoryBadge: '54 cartes',
    description:
      'Débarrassez-vous de vos cartes en montant dans les valeurs pour finir premier (Président) et dominer le perdant, qui devra vous donner ses meilleurs atouts.',
    minPlayers: 3,
    maxPlayers: 8,
    scoreDir: 'high',
    rules: {
      sections: [
        {
          title: 'Informations générales & But',
          items: [
            'Nombre de joueurs : 3 à 8 joueurs (idéal à 4-6 joueurs).',
            'Matériel : Un jeu de 54 cartes standard (avec ou sans Jokers).',
            'Objectif : Être le premier à vider sa main pour devenir Président et accumuler le plus de points au fil des manches.',
          ],
        },
        {
          title: 'Hiérarchie des cartes',
          items: [
            'Ordre croissant : 3 (plus faible), 4, 5, 6, 7, 8, 9, 10, Valet, Dame, Roi, As.',
            "Le 2 : Carte maîtresse absolue qui bat n'importe quelle carte et coupe immédiatement le pli.",
          ],
        },
        {
          title: "Déroulement d'un tour",
          items: [
            'Le joueur qui a la main pose une carte simple, une paire, un brelan ou un carré.',
            'Les joueurs suivants doivent poser le même nombre de cartes, avec une valeur égale ou supérieure (ex. : une paire supérieure sur une paire).',
            "Passer son tour : Un joueur peut passer à tout moment même s'il peut jouer. Quand tous les joueurs passent consécutivement, le pli est vidé et le dernier joueur à avoir posé ouvre le nouveau pli.",
          ],
        },
        {
          title: 'Règles spéciales : Le 2 et la Révolution',
          items: [
            "Le 2 : Poser un 2 (ou une paire de 2) coupe immédiatement le tour. Les cartes vont à la défausse et le joueur rejoue aussitôt ce qu'il souhaite.",
            "Révolution (Carré de 4 cartes identiques) : Inverse la hiérarchie pour le reste de la manche ! Le 3 devient la carte la plus forte et l'As la plus faible (le 2 conserve généralement son pouvoir de coupe). Une seconde révolution remet l'ordre à l'endroit.",
          ],
        },
        {
          title: 'Rôles et Échanges de début de manche',
          items: [
            'Les joueurs reçoivent leur rôle selon leur ordre de sortie lors de la manche précédente :',
            '1er — Président : Reçoit les 2 meilleures cartes du Trou du cul et lui donne 2 cartes de son choix.',
            '2e — Vice-Président : Reçoit la meilleure carte du Vice-Trou et lui donne 1 carte de son choix.',
            'Milieu — Neutres : Aucun échange de cartes.',
            'Avant-dernier — Vice-Trou : Donne obligatoirement sa meilleure carte au Vice-Président.',
            'Dernier — Trou du cul : Donne obligatoirement ses 2 meilleures cartes au Président.',
          ],
        },
        {
          title: 'Comptage des points dans Ardoise',
          items: [
            'Président : +2 points par manche.',
            'Vice-Président : +1 point par manche.',
            'Neutre : 0 point.',
            'Vice-Trou : -1 point par manche.',
            'Trou du cul : -2 points par manche.',
          ],
        },
      ],
      summaryTable: [
        { item: '1er — Président', value: '+2 pts (reçoit 2 cartes)' },
        { item: '2e — Vice-Président', value: '+1 pt (reçoit 1 carte)' },
        { item: 'Milieu — Neutre', value: '0 pt' },
        { item: 'Avant-dernier — Vice-Trou', value: '-1 pt (donne 1 carte)' },
        { item: 'Dernier — Trou du cul', value: '-2 pts (donne 2 meilleures)' },
        { item: 'Le 2 / Carré', value: 'Coupe le pli / Révolution' },
      ],
    },
  },
  [GAMES.SKYJO]: {
    id: GAMES.SKYJO,
    deckType: 'dedicated',
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
      sections: [
        {
          title: 'Informations générales & Objectif',
          items: [
            'Nombre de joueurs : 2 à 8 joueurs.',
            'Matériel : 150 cartes Skyjo numérotées de -2 à 12.',
            'Objectif : Obtenir le total de points le plus bas possible au fil des manches. La partie s’arrête dès qu’un joueur atteint ou dépasse 100 points.',
          ],
        },
        {
          title: 'Mise en place & Révélation initiale',
          items: [
            'Chaque joueur reçoit 12 cartes face cachée qu’il dispose devant lui en une grille de 4 colonnes × 3 lignes.',
            'Le reste des cartes forme la pioche face cachée au centre, avec une première carte retournée pour ouvrir la défausse.',
            'Tous les joueurs retournent 2 cartes de leur choix face visible. Le joueur ayant la somme la plus élevée commence la partie.',
          ],
        },
        {
          title: "Déroulement d'un tour",
          content:
            "À son tour, le joueur choisit obligatoirement entre piocher dans la pioche cachée ou dans la défausse visible :",
          items: [
            'Option Pioche cachée : Le joueur regarde la carte. Il peut soit l’échanger avec l’une des 12 cartes de sa grille (face visible ou cachée), soit la défausser directement pour retourner l’une de ses cartes cachées face visible.',
            'Option Défausse visible : Le joueur prend la carte visible et l’échange obligatoirement avec une carte de sa grille.',
          ],
        },
        {
          title: 'Règle des colonnes identiques (Défausse complète)',
          items: [
            'Dès qu’une colonne verticale de 3 cartes comporte 3 cartes face visible strictement identiques (ex. : trois cartes 8), cette colonne est immédiatement retirée du jeu et envoyée à la défausse.',
            'Avantage clé : Cela élimine 3 cartes de sa grille et retire tous leurs points de son décompte final !',
          ],
        },
        {
          title: 'Fin de manche & Règle clé du clôtureur',
          items: [
            'Dès qu’un joueur a révélé toutes ses 12 cartes (le Clôtureur), les autres joueurs disposent d’un ultime tour de jeu.',
            'Chacun dévoile ensuite ses cartes cachées restantes et additionne tous les points de sa grille.',
            'Malus du Clôtureur : Le joueur ayant fini en premier doit avoir STRICTEMENT le score le plus faible de la manche. S’il est égalé ou battu par un autre joueur, son score positif est automatiquement multiplié par 2 !',
          ],
        },
        {
          title: 'Fin de partie & Vainqueur',
          items: [
            'Les points de chaque manche sont cumulés manche après manche.',
            'Dès qu’un joueur atteint ou dépasse 100 points, la partie prend fin.',
            'Le vainqueur est le joueur possédant le plus petit score cumulé.',
          ],
        },
      ],
      summaryTable: [
        { item: 'Grille de départ', value: '12 cartes (4 colonnes × 3 lignes)' },
        { item: 'Colonne de 3 identiques', value: 'Défaussée (0 pt)' },
        { item: 'Clôtureur avec score min. strict', value: 'Score normal' },
        { item: 'Clôtureur battu ou égalé (score > 0)', value: 'Score × 2 (malus)' },
        { item: 'Seuil de fin de partie', value: '100 points (le plus bas gagne)' },
      ],
    },
  },
  [GAMES.BELOTE]: {
    id: GAMES.BELOTE,
    deckType: 'classic',
    name: 'Belote / Coinche',
    playersBadge: '2 éq. (4 j.)',
    categoryBadge: '32 cartes',
    description:
      "Le grand classique en 2 contre 2 : jouez à la Belote classique ou à la Coinche (enchères, coinché, surcoinché) et marquez les points par équipes !",
    minPlayers: 4,
    maxPlayers: 4,
    scoreDir: 'high',
    teams: true,
    rules: {
      sections: [
        {
          title: 'Informations générales & Équipes',
          items: [
            'Nombre de joueurs : Exactement 4 joueurs, répartis en 2 équipes de 2 partenaires assis face à face (Nous vs Eux).',
            'Matériel : Un jeu de 32 cartes (du 7 à l’As).',
            'Objectif : Remplir les contrats annoncés en cumulant au fil des donnes le plus grand nombre de points (généralement 1 000 ou 1 500 points).',
          ],
        },
        {
          title: 'Ordre et Valeur des cartes (162 pts)',
          items: [
            'À l’Atout : Valet (20 pts), 9 (14 pts), As (11 pts), 10 (10 pts), Roi (4 pts), Dame (3 pts), 8 et 7 (0 pt).',
            'Hors Atout : As (11 pts), 10 (10 pts), Roi (4 pts), Dame (3 pts), Valet (2 pts), 9, 8 et 7 (0 pt).',
            'Dix de der : 10 points bonus attribués à l’équipe qui remporte le 8e et dernier pli.',
            'Total des levées : 152 points de cartes + 10 pts de der = exactement 162 points.',
          ],
        },
        {
          title: 'Variante 1 : Belote classique',
          items: [
            'Prise à la retourne : Chaque joueur reçoit 5 cartes. Une carte est retournée au centre. Les joueurs choisissent tour à tour de la prendre (sa couleur devient l’atout) ou de passer (2 tours possibles).',
            'Distribution finale : Une fois l’atout choisi, le preneur reçoit 2 cartes supplémentaires et les autres 3 cartes (8 cartes en main chacun).',
            'Contrat minimal : Le camp preneur s’engage à réaliser au moins 82 points (la moitié de 162 + 1) pour réussir sa prise.',
            'Capot : Remporter l’intégralité des 8 plis rapporte 252 points.',
          ],
        },
        {
          title: 'Variante 2 : Coinche (Contrée)',
          items: [
            'Distribution totale : Toutes les cartes sont distribuées dès le départ (8 cartes chacun, sans retourne).',
            'Enchères chiffrées : Les joueurs annoncent tour à tour un contrat de 80 à 160 points (par paliers de 10) en désignant la couleur d’atout, ou passent.',
            'Coincher (Contre) : L’équipe adverse peut à tout moment « Coincher » l’annonce adverse pour doubler les points (×2) si elle pense que le preneur va chuter.',
            'Surcoincher (Surcontre) : L’équipe attaquante peut répliquer en « Surcoinchant » pour quadrupler la valeur de la donne (×4).',
            'Capot (250 pts) & Générale (500 pts) : Annonces ultimes pour remporter tous les plis à 2 ou en solitaire.',
          ],
        },
        {
          title: 'Annonces spéciales & Belote-Rebelote',
          items: [
            'Belote et Rebelote (+20 pts) : Détenues par le joueur qui possède le Roi et la Dame d’atout. Il annonce « Belote » en jouant la 1re, puis « Rebelote » en jouant la 2de.',
            'Inviolabilité : Les 20 points de Belote-Rebelote restent acquis même si l’équipe preneuse chute son contrat.',
            'Autres annonces éventuelles : Tierce (+20 pts, suite de 3 cartes), Cinquante (+50 pts, suite de 4), Carré (+100 pts, ou 4 Valets = +200 pts).',
          ],
        },
        {
          title: 'Décompte des points & Chute (Dedans)',
          items: [
            'Contrat réussi : Le preneur marque ses points réalisés + son contrat (multiplié par 2 si coinché, par 4 si surcoinché) + annonces. La défense marque ses points faits.',
            'Chute (« Dedans ») : Si les preneurs ne font pas leur contrat, ils ne marquent rien (sauf Belote). La défense empoche les 162 points + le contrat (multiplié si coinché) + toutes les annonces.',
            'Litige (Belote classique) : En cas de stricte égalité 81-81, la défense marque ses 81 points et les 81 points du preneur sont remis en jeu pour le vainqueur de la donne suivante.',
          ],
        },
      ],
      summaryTable: [
        { item: 'Joueurs / Équipes', value: '4 joueurs en 2 équipes fixes (Nous vs Eux)' },
        { item: 'Total des plis (avec 10 de der)', value: '162 pts' },
        { item: 'Belote + Rebelote (Roi & Dame atout)', value: '+20 pts inviolables' },
        { item: 'Contrat Belote classique', value: '≥ 82 pts (ou Capot 252 pts)' },
        { item: 'Enchères Coinche', value: '80 à 160 pts (paliers de 10)' },
        { item: 'Coinche / Surcoinche', value: 'Coefficients ×2 et ×4' },
        { item: 'Capot / Générale', value: '250 / 252 pts · 500 pts' },
        { item: 'Chute (« Dedans »)', value: 'Défense empoche 162 pts + contrat' },
      ],
    },
  },
  [GAMES.TAROT]: {
    id: GAMES.TAROT,
    deckType: 'dedicated',
    name: 'Tarot',
    playersBadge: '3–5 j.',
    categoryBadge: '78 cartes',
    description:
      "Le Preneur défie la table : capturez les Bouts (le Petit, le 21, l'Excuse) et remportez un maximum de plis pour faire passer votre Garde face à la Défense.",
    minPlayers: 3,
    maxPlayers: 5,
    scoreDir: 'high',
    rules: {
      sections: [
        {
          title: 'Matériel & Total des points',
          items: [
            'Nombre de joueurs : 3, 4 ou 5 joueurs (seul contre tous à 3 ou 4 j. ; preneur avec partenaire appelé au Roi à 5 j.).',
            'Matériel : Un jeu de 78 cartes comprenant 21 atouts numérotés, l’Excuse, et 4 couleurs de 14 cartes (Roi, Dame, Cavalier, Valet, 10 à As).',
            'Total des levées : 91 points au total sur l’ensemble de la donne.',
          ],
        },
        {
          title: 'Les 3 Bouts (Oudlers) et Seuils à atteindre',
          items: [
            'Les Bouts : Le 21 d’atout, le Petit (1 d’atout) et l’Excuse valent 4,5 points chacun.',
            'Le seuil minimal à atteindre par l’Attaque dépend du nombre de Bouts dans ses levées :',
            '3 Bouts : 36 points nécessaires.',
            '2 Bouts : 41 points nécessaires.',
            '1 Bout : 51 points nécessaires.',
            '0 Bout : 56 points nécessaires.',
          ],
        },
        {
          title: 'Les Enchères et Coefficients',
          items: [
            'Petite : Coefficient ×1 (avec Chien incorporé).',
            'Garde : Coefficient ×2 (avec Chien incorporé).',
            'Garde Sans le chien : Coefficient ×4 (Chien acquis au preneur sans être regardé ni échangé).',
            'Garde Contre le chien : Coefficient ×6 (Chien laissé à la Défense).',
          ],
        },
        {
          title: 'Primes : Petit au bout, Poignées & Chelem',
          items: [
            'Petit au bout (±10 pts × coef) : Accordé au camp qui remporte le 18e et dernier pli de la donne avec le Petit (1 d’atout).',
            'Poignées : Annoncées au 1er tour par un joueur détenant 10 atouts (Simple = 20 pts), 13 atouts (Double = 30 pts) ou 15 atouts (Triple = 40 pts).',
            'Chelem : Réaliser tous les plis de la donne (prime de 200 à 400 pts).',
          ],
        },
        {
          title: 'Calcul officiel des scores (Somme nulle)',
          items: [
            'Formule : Score = (25 + |Points faits - Seuil|) × Coeff + Prime Petit au bout.',
            'À 3 ou 4 joueurs : Le Preneur gagne (ou perd) ce score multiplié par le nombre de défenseurs, chaque défenseur recevant (ou donnant) le score de base.',
            'À 5 joueurs (Appel au Roi) : Le Preneur marque ×2, son Partenaire secret marque ×1, et les 3 Défenseurs marquent -1 chacun.',
          ],
        },
      ],
      summaryTable: [
        { item: 'Seuils (0 / 1 / 2 / 3 Bouts)', value: '56 / 51 / 41 / 36 pts' },
        { item: 'Petite / Garde', value: '×1 / ×2' },
        { item: 'Garde Sans / Garde Contre', value: '×4 / ×6' },
        { item: 'Petit au bout (au 18e pli)', value: '±10 pts × coeff.' },
        { item: 'Total des points en jeu', value: '91 points (somme nulle)' },
      ],
    },
  },
  [GAMES.SIX_QUI_PREND]: {
    id: GAMES.SIX_QUI_PREND,
    deckType: 'dedicated',
    name: '6 qui prend !',
    playersBadge: '2–10 j.',
    categoryBadge: 'Jeu 6 qui prend',
    description:
      "Placez vos numéros sur les rangées dans l'ordre croissant sans jamais poser la 6ᵉ carte, sous peine de ramasser toute la ligne et ses têtes de bœuf !",
    minPlayers: 2,
    maxPlayers: 10,
    scoreDir: 'low',
    eliminationScore: 66,
    rules: {
      sections: [
        {
          title: 'Informations générales & But',
          items: [
            'Nombre de joueurs : 2 à 10 joueurs.',
            'Matériel : 104 cartes numérotées de 1 à 104 comportant des têtes de bœuf (points de pénalité).',
            'Objectif : Récolter le moins de têtes de bœuf possible. La partie s’arrête dès qu’un joueur atteint ou dépasse 66 points.',
          ],
        },
        {
          title: 'Mise en place & Choix simultané',
          items: [
            'Chaque joueur reçoit 10 cartes en main.',
            '4 cartes sont tirées de la pioche et disposées face visible au centre de la table pour démarrer 4 rangées distinctes.',
            'À chaque tour, tous les joueurs choisissent simultanément une carte de leur main et la posent face cachée devant eux.',
            'Une fois tout le monde prêt, les cartes sont révélées en même temps.',
          ],
        },
        {
          title: 'Ordre de pose sur les rangées',
          items: [
            'Les cartes révélées sont jouées dans l’ordre numérique croissant (de la plus petite à la plus grande valeur).',
            'Chaque carte doit être placée sur la rangée dont la dernière carte est inférieure avec la plus petite différence de valeur.',
          ],
        },
        {
          title: 'Règle de la 6e carte & Carte trop basse',
          items: [
            'La 6e carte (Ramassage) : Une rangée ne peut contenir que 5 cartes maximum. Si un joueur doit poser la 6e carte d’une rangée, il ramasse obligatoirement les 5 cartes de la rangée (qui forment son tas de pénalités) et sa carte devient la 1re de la nouvelle rangée !',
            'Carte inférieure à toutes les rangées : Si la carte d’un joueur est plus petite que la dernière carte de chacune des 4 rangées, il doit choisir librement l’une des 4 rangées, en ramasser toutes les cartes, et placer sa carte à la place.',
          ],
        },
        {
          title: 'Barème des têtes de bœuf',
          items: [
            'Carte 55 : 7 têtes de bœuf (la plus redoutable !).',
            'Doublons (11, 22, 33, 44, 66, 77, 88, 99) : 5 têtes de bœuf.',
            'Multiples de 10 (10, 20, 30, 40, 50, 60, 70, 80, 90, 100) : 3 têtes de bœuf.',
            'Multiples de 5 (5, 15, 25, 35, 45, 65, 75, 85, 95) : 2 têtes de bœuf.',
            'Toutes les autres cartes : 1 tête de bœuf.',
          ],
        },
        {
          title: 'Fin de manche & Vainqueur',
          items: [
            'Une manche dure 10 tours (jusqu’à épuisement des mains). Chacun compte ses têtes de bœuf ramassées.',
            'Dès qu’un joueur atteint ou dépasse le seuil éliminatoire de 66 têtes de bœuf, la partie prend fin.',
            'Le vainqueur est le joueur qui a cumulé le plus petit total de têtes de bœuf.',
          ],
        },
      ],
      summaryTable: [
        { item: 'Carte 55', value: '7 têtes de bœuf' },
        { item: 'Doublons (11, 22, 33, 44…)', value: '5 têtes' },
        { item: 'Multiples de 10 (10, 20…)', value: '3 têtes' },
        { item: 'Multiples de 5 (5, 15…)', value: '2 têtes' },
        { item: 'Autres cartes', value: '1 tête' },
        { item: 'Seuil de fin de partie', value: '66 têtes (le plus bas gagne)' },
      ],
    },
  },
  [GAMES.DAME_DE_PIQUE]: {
    id: GAMES.DAME_DE_PIQUE,
    deckType: 'classic',
    name: 'Dame de Pique',
    playersBadge: '3 à 5 j.',
    categoryBadge: '52 cartes',
    description:
      "Évitez les Cœurs et la redoutable Dame de Pique, ou tentez le spectaculaire Grand Chelem pour infliger 26 points à tous vos adversaires !",
    minPlayers: 3,
    maxPlayers: 5,
    scoreDir: 'low',
    rules: {
      sections: [
        {
          title: 'Présentation & But du jeu',
          items: [
            'Nombre de joueurs : 4 joueurs idéalement (variantes à 3 ou 5 joueurs possibles).',
            'Matériel : Un jeu classique de 52 cartes (sans jokers). L’ordre des cartes est décroissant : As, Roi, Dame, Valet, 10... jusqu’au 2.',
            'Objectif : Avoir le score le plus faible possible en évitant d’encaisser des plis contenant des Cœurs ou la Dame de Pique.',
          ],
        },
        {
          title: 'Valeur des pénalités',
          items: [
            'Chaque carte de Cœur ramassée : 1 point de pénalité (soit 13 points de Cœur au total).',
            'La Dame de Pique (Q♠) : 13 points de pénalité à elle seule.',
            'Total d’une manche normale : 13 + 13 = 26 points de pénalité répartis entre les joueurs.',
          ],
        },
        {
          title: 'Le Grand Chelem (Déménagement / Shoot the Moon)',
          items: [
            'Si un joueur réussit l’exploit de ramasser TOUS les 13 Cœurs ET la Dame de Pique lors de la même manche (les 26 points complets) :',
            'Il marque 0 point, et TOUS les autres joueurs reçoivent immédiatement 26 points de pénalité chacun !',
          ],
        },
        {
          title: 'Déroulement de la manche & Plis',
          items: [
            'Échange initial : En début de manche, chaque joueur choisit 3 cartes de sa main et les transmet à son voisin (1re manche à gauche, 2e à droite, 3e en face, 4e manche sans échange).',
            'Entame : Le joueur qui possède le 2 de Trèfle pose obligatoirement cette carte pour lancer le premier pli.',
            'Fournir la couleur : Chaque joueur doit obligatoirement fournir la couleur demandée. S’il n’en a pas, il peut défausser n’importe quelle carte.',
            'Règle du premier pli : Il est formellement interdit de se défausser d’un Cœur ou de la Dame de Pique lors du tout premier pli.',
            'Casser le Cœur : Il est interdit d’entamer un pli avec un Cœur tant qu’aucun Cœur n’a encore été défaussé au cours de la manche.',
          ],
        },
        {
          title: 'Fin de partie & Vainqueur',
          items: [
            'Dès qu’un joueur atteint ou dépasse le seuil éliminatoire (100 points en partie standard, ou 50 points en partie express) :',
            'La partie s’arrête immédiatement. Le joueur affichant le score le plus bas est sacré vainqueur !',
          ],
        },
      ],
      summaryTable: [
        { item: 'Chaque carte de Cœur', value: '1 pt de pénalité' },
        { item: 'Dame de Pique', value: '13 pts de pénalité' },
        { item: 'Total par manche normale', value: '26 points' },
        { item: 'Grand Chelem (26 pts raflés)', value: '0 pt et +26 pts à tous les autres' },
        { item: 'Seuil d’élimination', value: '100 points (le plus bas gagne)' },
      ],
    },
  },
  [GAMES.FLIP_7]: {
    id: GAMES.FLIP_7,
    deckType: 'dedicated',
    name: 'Flip 7',
    playersBadge: '2 à 10 j.',
    categoryBadge: 'Jeu Flip 7',
    description:
      "Tirez des cartes et constituez votre série sans jamais répéter de valeur. Encaissez vos points au bon moment ou tentez le mythique Flip 7 !",
    minPlayers: 2,
    maxPlayers: 10,
    scoreDir: 'high',
    rules: {
      sections: [
        {
          title: 'Présentation & But du jeu',
          items: [
            'Nombre de joueurs : 2 à 10 joueurs.',
            'Matériel : Jeu de cartes Flip 7 composé de cartes numérotées de 0 à 12, de cartes d’actions et de cartes modificateurs.',
            'Objectif : Être le premier joueur à franchir le cap des 200 points en accumulant le plus de points manche après manche.',
          ],
        },
        {
          title: 'Déroulement du tour : Tirer ou S’arrêter',
          items: [
            'À chaque tour, le joueur actif a le choix :',
            '1. Tirer (Flip) : Révéler la première carte de la pioche et l’ajouter face visible dans sa ligne.',
            '2. S’arrêter (Stay / Bank) : Sécuriser sa main pour la manche en cours. Le joueur ne piochera plus et comptera ses points à la fin du tour.',
          ],
        },
        {
          title: 'Doublon & Élimination (Bust)',
          items: [
            'Si un joueur tire une carte numérique dont la valeur est DÉJÀ présente dans sa ligne en cours, il fait « Bust » !',
            'Il perd immédiatement toutes ses cartes de la manche et marque un score de 0 point.',
            'Exception : Si le joueur possède une carte Seconde Chance devant lui, celle-ci s’active pour défausser le doublon et lui sauver la mise.',
          ],
        },
        {
          title: 'Cartes spéciales & Modificateurs',
          items: [
            'Cartes d’action : « Freeze » (gèle un adversaire pour le forcer à s’arrêter), « Flip Three » (oblige à révéler 3 cartes consécutives).',
            'Modificateurs : Les cartes bonus (+2, +4, +6) s’ajoutent au total de la main, tandis que la carte x2 double l’ensemble des points de la manche.',
          ],
        },
        {
          title: 'Le Grand Coup « Flip 7 ! »',
          items: [
            'Si un joueur réussit à aligner 7 cartes numériques différentes dans sa ligne sans jamais faire de doublon :',
            'La manche prend fin instantanément pour tous les joueurs !',
            'Le réalisateur valide l’ensemble de ses points et reçoit un bonus exceptionnel de +15 points.',
          ],
        },
        {
          title: 'Fin de partie',
          items: [
            'La partie se termine à l’issue de la manche où un joueur atteint ou dépasse 200 points.',
            'Le joueur ayant cumulé le score le plus élevé l’emporte !',
          ],
        },
      ],
      summaryTable: [
        { item: 'Arrêt volontaire', value: 'Cumul des cartes et bonus validé' },
        { item: 'Doublon pioché (Bust)', value: '0 pt pour la manche' },
        { item: 'Flip 7 (7 cartes uniques)', value: 'Fin immédiate + 15 pts bonus' },
        { item: 'Seuil de victoire', value: '200 points (le plus haut gagne)' },
      ],
    },
  },
  [GAMES.SEA_SALT_PAPER]: {
    id: GAMES.SEA_SALT_PAPER,
    deckType: 'dedicated',
    name: 'Sea Salt & Paper',
    playersBadge: '2 à 4 j.',
    categoryBadge: 'Jeu Bombyx',
    description:
      "Plongez dans l'origami marin, activez des effets de duos et pariez sur votre avance avec la Dernière Chance pour rafler les bonus !",
    minPlayers: 2,
    maxPlayers: 4,
    scoreDir: 'high',
    rules: {
      sections: [
        {
          title: 'Présentation & But du jeu',
          items: [
            'Nombre de joueurs : 2 à 4 joueurs.',
            'Matériel : 64 cartes origami maritimes (duos d’action, collections, multiplicateurs et cartes Sirène).',
            'Objectif : Atteindre le premier le seuil de points requis (40 pts à 2 j., 35 pts à 3 j., 30 pts à 4 j.) en optimisant ses combinaisons.',
          ],
        },
        {
          title: 'Tour de jeu & Duos',
          items: [
            'À son tour, on commence par piocher 2 cartes et en garder 1 (l’autre va à la défausse), OU prendre la carte du sommet de l’une des 2 défausses.',
            'On peut ensuite poser devant soi une ou plusieurs paires de cartes « Duo » pour activer leur effet : Crabe (fouiller une défausse), Bateau (rejouer immédiatement), Poisson (piocher 1 carte), Nageur + Requin (voler 1 carte au hasard dans la main d’un rival).',
          ],
        },
        {
          title: 'Clôture de la manche : STOP ou DERNIÈRE CHANCE',
          items: [
            'Dès qu’un joueur totalise au moins 7 points (cartes posées + cartes en main) :',
            '1. Annoncer STOP : La manche s’arrête immédiatement. Tous les joueurs comptabilisent leurs points (sans bonus de couleur).',
            '2. Annoncer DERNIÈRE CHANCE : Chaque adversaire dispose d’un tout dernier tour de jeu. Le pari commence !',
          ],
        },
        {
          title: 'Résolution de la Dernière Chance',
          items: [
            'Pari réussi : Si le joueur qui a annoncé Dernière Chance a STRICTEMENT plus de points que chaque autre joueur :',
            'Il marque l’intégralité de ses points + son Bonus de Couleur (1 pt par carte de sa couleur majoritaire). Ses adversaires ne marquent QUE leur bonus de couleur respectif !',
            'Pari échoué : Si un adversaire a un total supérieur ou égal :',
            'Le déclencheur ne marque QUE son bonus de couleur ! Tous les autres joueurs marquent la totalité de leurs points normaux.',
          ],
        },
        {
          title: 'Victoire instantanée des 4 Sirènes',
          items: [
            'Chaque carte Sirène rapporte 1 pt par carte de la couleur la plus représentée dans votre jeu.',
            'Un joueur qui réussit à rassembler les 4 cartes Sirène remporte IMMÉDIATEMENT la partie, sans tenir compte des points !',
          ],
        },
      ],
      summaryTable: [
        { item: 'Condition d’annonce', value: 'Minimum 7 points' },
        { item: 'Annonce Stop', value: 'Tous comptent leurs points normaux' },
        { item: 'Dernière Chance réussie', value: 'Auteur = Total + Couleur / Rivaux = Couleur seule' },
        { item: 'Dernière Chance échouée', value: 'Auteur = Couleur seule / Rivaux = Total' },
        { item: '4 Sirènes réunies', value: 'Victoire instantanée' },
        { item: 'Seuil 2 joueurs', value: '40 points' },
        { item: 'Seuil 3 joueurs', value: '35 points' },
        { item: 'Seuil 4 joueurs', value: '30 points' },
      ],
    },
  },
  [GAMES.ASCENSEUR]: {
    id: GAMES.ASCENSEUR,
    deckType: 'classic',
    name: 'Ascenseur',
    playersBadge: '3 à 8 j.',
    categoryBadge: '52 cartes',
    description:
      "Prédisez au pli près votre résultat lors de manches à nombre de cartes variable. Bonus de 10 points si le pari est respecté !",
    minPlayers: 3,
    maxPlayers: 8,
    scoreDir: 'high',
    rules: {
      sections: [
        {
          title: 'Présentation & Principe',
          items: [
            'Nombre de joueurs : 3 à 8 joueurs.',
            'Matériel : Un paquet classique de 52 cartes (sans jokers).',
            'Mécanique : La partie suit une montée puis une descente du nombre de cartes distribuées (ex. : de 1 à 10 cartes, puis de 10 à 1 carte).',
            'Objectif : Prédire avec une précision chirurgicale le nombre exact de plis que l’on va réaliser à chaque manche.',
          ],
        },
        {
          title: 'Distribution & Atout',
          items: [
            'À chaque manche, on distribue le nombre de cartes prévu par le palier.',
            'La carte suivante du talon est retournée : sa couleur fixe l’Atout pour toute la manche (aux manches où toutes les cartes sont distribuées, on joue sans atout).',
          ],
        },
        {
          title: 'Les Annonces (les paris)',
          items: [
            'Chaque joueur, à tour de rôle en commençant à gauche du donneur, annonce le nombre de plis qu’il pense remporter (de 0 jusqu’au nombre de cartes en main).',
            'Règle d’or du Donneur : Le donneur (dernier à parler) n’a PAS le droit d’annoncer un chiffre qui rendrait la somme des annonces égale au nombre total de cartes de la manche. Il y a donc obligatoirement un ou plusieurs déçus à chaque manche !',
          ],
        },
        {
          title: 'Le Jeu de la carte',
          items: [
            'On doit obligatoirement fournir à la couleur demandée.',
            'Si l’on ne possède pas de carte de la couleur demandée, on peut couper à l’atout ou se défausser.',
            'Le plus fort atout joué, ou à défaut la plus forte carte dans la couleur d’entame, remporte le pli.',
          ],
        },
        {
          title: 'Décompte des points',
          items: [
            'Contrat exact respecté (plis faits = annonce) : 10 points de prime de réussite + 1 point par pli réalisé (ex. : annonce 0 et fait 0 = 10 pts ; annonce 3 et fait 3 = 13 pts).',
            'Contrat manqué : 0 point marqué pour la manche.',
          ],
        },
      ],
      summaryTable: [
        { item: 'Contrat exact respecté', value: '10 pts + 1 pt par pli' },
        { item: 'Pari 0 pli réussi', value: '10 points' },
        { item: 'Contrat non respecté', value: '0 point' },
        { item: 'Règle du donneur', value: 'Somme des paris ≠ nombre de cartes' },
        { item: 'Vainqueur', value: 'Score le plus élevé à la fin du cycle' },
      ],
    },
  },
  [GAMES.RAMI]: {
    id: GAMES.RAMI,
    deckType: 'classic',
    name: 'Rami',
    playersBadge: '2 à 6 j.',
    categoryBadge: '52/104 cartes',
    description:
      "Formez tierces, suites et brelans pour vous débarrasser de vos cartes. Attention aux pénalités restantes et au redoutable Rami Sec !",
    minPlayers: 2,
    maxPlayers: 6,
    scoreDir: 'low',
    rules: {
      sections: [
        {
          title: 'Présentation & But du jeu',
          items: [
            'Nombre de joueurs : 2 à 6 joueurs.',
            'Matériel : 2 jeux de 54 cartes (avec jokers) ou 1 jeu de 52 cartes pour les parties à 2 joueurs.',
            'Objectif : Poser l’ensemble de ses cartes en combinaisons valides et défausser sa dernière carte pour marquer 0 pt et infliger des pénalités aux adversaires.',
          ],
        },
        {
          title: 'Combinaisons autorisées',
          items: [
            'Brelan : 3 cartes de même valeur faciale et de couleurs différentes (ex. : 8♠ 8♥ 8♦).',
            'Carré : 4 cartes de même valeur faciale de couleurs distinctes.',
            'Séquence (ou tierce) : Au moins 3 cartes consécutives de la même couleur (ex. : 5♥ 6♥ 7♥). L’As peut valoir 1 (avant le 2) ou après le Roi.',
          ],
        },
        {
          title: 'Déroulement du tour',
          items: [
            '1. Piocher la première carte du talon OU la dernière carte de la défausse.',
            '2. Poser des combinaisons sur la table (au moins 51 points avec tierce franche sans joker lors de la toute première pose).',
            '3. Jeter obligatoirement 1 carte sur la défausse pour clore son tour.',
          ],
        },
        {
          title: 'Comptage des pénalités',
          items: [
            'Le joueur qui clôt la manche marque 0 point.',
            'Tous les autres joueurs additionnent la valeur des cartes restantes dans leur main :',
            'Cartes de 2 à 10 : Leur valeur numérique (2 à 10 pts).',
            'Valet, Dame, Roi : 10 points chacun.',
            'As : 11 points (ou 1 point s’il était combinable en début de suite).',
            'Joker non posé : 20 points de pénalité.',
          ],
        },
        {
          title: 'Coup de maître : Rami Sec',
          items: [
            'Si un joueur pose l’intégralité de son jeu en un seul tour sans avoir jamais rien posé auparavant :',
            'Il réalise un « Rami Sec » : les pénalités de TOUS ses adversaires sont doublées pour cette manche !',
          ],
        },
        {
          title: 'Fin de partie',
          items: [
            'Dès qu’un joueur franchit le seuil éliminatoire (100, 250 ou 500 points selon configuration) :',
            'La partie prend fin. Le joueur avec le plus faible total de pénalités est déclaré vainqueur !',
          ],
        },
      ],
      summaryTable: [
        { item: 'Vainqueur de la manche', value: '0 point' },
        { item: 'Cartes 2 à 10', value: 'Valeur faciale' },
        { item: 'Figures (V, D, R)', value: '10 points' },
        { item: 'As', value: '11 points' },
        { item: 'Joker en main', value: '20 points' },
        { item: 'Rami Sec', value: 'Pénalités des adversaires doublées (x2)' },
        { item: 'Seuil d’élimination', value: '100 / 250 / 500 pts (le plus bas gagne)' },
      ],
    },
  },
  [GAMES.YANIV]: {
    id: GAMES.YANIV,
    deckType: 'classic',
    name: 'Yaniv',
    playersBadge: '2 à 6 j.',
    categoryBadge: '54 cartes',
    description:
      "Allégez votre main et annoncez « Yaniv » (≤ 5 pts) pour marquer 0 pt. Attention au contre « ASSAF ! » (+30 pts) et aux précieux sursis à 50 et 100 pts !",
    minPlayers: 2,
    maxPlayers: 6,
    scoreDir: 'low',
    rules: {
      sections: [
        {
          title: 'Présentation & But du jeu',
          items: [
            'Nombre de joueurs : 2 à 6 joueurs.',
            'Matériel : 1 jeu de 54 cartes (52 cartes standard + 2 Jokers).',
            'Objectif : Avoir le plus petit total de points de pénalité. La partie prend fin dès qu’un joueur atteint ou dépasse 100 points (ou 200 points).',
          ],
        },
        {
          title: 'Distribution & Déroulement du tour',
          items: [
            'Chaque joueur reçoit 5 cartes face cachée. Le reste forme la pioche et la première carte est retournée pour entamer la défausse.',
            'À son tour, un joueur a le choix entre :',
            '1. Annoncer « Yaniv ! » s’il estime que la somme de ses cartes en main est inférieure ou égale à 5 points (met fin au tour).',
            '2. Défausser 1 carte ou 1 combinaison valide (paire, brelan, carré ou suite de 3+ cartes de même couleur), puis piocher 1 carte (au talon ou aux extrémités de la défausse).',
          ],
        },
        {
          title: 'Valeur des cartes en main',
          items: [
            'Jokers : 0 point (clés pour réduire son total).',
            'As : 1 point.',
            'Cartes 2 à 10 : Valeur faciale (2 à 10 points).',
            'Figures (Valet, Dame, Roi) : 10 points chacune.',
          ],
        },
        {
          title: 'Résolution de la manche : Yaniv vs ASSAF !',
          items: [
            'Yaniv Réussi : Si l’annonceur a STRICTEMENT le score le plus faible de la table, il marque 0 point. Tous les adversaires marquent la valeur exacte de leur main.',
            'ASSAF ! (Le Contre) : Si un adversaire a un score inférieur OU ÉGAL à l’annonceur, il crie « ASSAF ! ». L’adversaire avec le score le plus bas marque 0 point. L’annonceur encaisse alors 30 points de pénalité en PLUS de sa propre main ! Les autres joueurs marquent normalement leur main.',
          ],
        },
        {
          title: 'Règle du Sursis (Halving / Coup de Palier)',
          items: [
            'Si à la fin d’une manche, le score cumulé d’un joueur tombe EXACTEMENT à 50 points, son score retombe à 25 points !',
            'S’il atteint EXACTEMENT 100 points, son score retombe à 50 points !',
          ],
        },
        {
          title: 'Fin de partie & Vainqueur',
          items: [
            'Dès qu’un joueur franchit le seuil éliminatoire (100 points par défaut) sans bénéficier d’un sursis, la partie prend fin.',
            'Le joueur avec le total le plus bas remporte la victoire !',
          ],
        },
      ],
      summaryTable: [
        { item: 'Main de départ', value: '5 cartes' },
        { item: 'Seuil d’annonce Yaniv', value: 'Main ≤ 5 points' },
        { item: 'Yaniv réussi', value: 'Annonceur = 0 pt, autres = valeur main' },
        { item: 'Contre « ASSAF ! »', value: 'Annonceur = main + 30 pts, rival = 0 pt' },
        { item: 'Jokers / As / Figures', value: 'Joker = 0 pt, As = 1 pt, Figures = 10 pts' },
        { item: 'Sursis à 50 / 100 pts', value: 'Score divisé par 2 (50 ➔ 25, 100 ➔ 50)' },
        { item: 'Seuil éliminatoire', value: '100 points (le plus bas gagne)' },
      ],
    },
  },
  [GAMES.BARBU]: {
    id: GAMES.BARBU,
    deckType: 'classic',
    name: 'Barbu',
    playersBadge: '4 j.',
    categoryBadge: '52 cartes',
    description:
      "Le grand classique français de plis à contrat ! 7 contrats impitoyables : Pas de plis, Pas de cœurs, Pas de dames, Le Barbu, 2 derniers plis, La salade et Le domino.",
    minPlayers: 4,
    maxPlayers: 4,
    scoreDir: 'high',
    rules: {
      sections: [
        {
          title: 'Présentation & Organisation',
          items: [
            'Nombre de joueurs : Exactement 4 joueurs.',
            'Matériel : Un jeu de 52 cartes (sans jokers). Chaque joueur reçoit 13 cartes par donne.',
            'Principe : Une partie complète comprend 28 donnes (chaque joueur est donneur 7 fois et choisit un contrat différent à chaque tour).',
            'Ordre des cartes : As > Roi > Dame > Valet > 10 > 9 > 8 > 7 > 6 > 5 > 4 > 3 > 2. Aucun atout (sauf Domino). On doit obligatoirement fournir la couleur demandée.',
          ],
        },
        {
          title: 'Les 5 Contrats Négatifs Simples',
          items: [
            '1. Pas de Plis : Chaque pli ramassé coûte -2 points (13 plis = -26 points au total).',
            '2. Pas de Cœurs : Chaque carte de Cœur coûte -2 points, sauf l’As de Cœur qui coûte -6 points (total = -30 points). Interdiction d’entamer Cœur tant qu’on a une autre couleur.',
            '3. Pas de Dames : Chaque Dame ramassée coûte -6 points (4 Dames = -24 points au total).',
            '4. Le Barbu (Roi de Cœur) : Le joueur qui ramasse le Roi de Cœur encaisse -20 points. Interdiction d’entamer Cœur au 1er pli et interdiction de jeter le Roi de Cœur si on a la couleur demandée.',
            '5. Deux Derniers Plis : Le 12e pli coûte -10 points, le 13e pli (dernier) coûte -20 points (total = -30 points).',
          ],
        },
        {
          title: 'Le 6e Contrat : La Salade',
          items: [
            'La Salade cumule TOUS les malus des 5 contrats précédents en une seule donne dantesque :',
            'Plis (-2 pts chacun = -26 pts) + Cœurs (-2 pts chacun, As = -6 pts = -30 pts) + Dames (-6 pts chacune = -24 pts) + Barbu (-20 pts) + 2 Derniers Plis (-10 et -20 pts = -30 pts).',
            'Total de la Salade : -130 points répartis entre les joueurs !',
          ],
        },
        {
          title: 'Le 7e Contrat : Le Domino (La Réussite)',
          items: [
            'Contrat positif sans levées ! Les joueurs posent les 7 au centre puis montent ou descendent dans la couleur.',
            '1er joueur débarrassé de ses cartes : +45 points.',
            '2e joueur débarrassé : +20 points.',
            '3e joueur : +5 points.',
            '4e joueur (dernier restant) : -5 points.',
            'Total distribué au Domino : +65 points.',
          ],
        },
        {
          title: 'Fin de partie & Classement',
          items: [
            'La partie se termine après les 28 donnes (ou le nombre de tours convenu).',
            'Le joueur ayant cumulé le total de points le plus élevé (le moins négatif ou le plus positif) remporte la victoire !',
          ],
        },
      ],
      summaryTable: [
        { item: 'Joueurs & Cartes', value: '4 joueurs, 52 cartes (13 par joueur)' },
        { item: 'Pas de Plis', value: '-2 pts / pli (-26 pts total)' },
        { item: 'Pas de Cœurs', value: '-2 pts / cœur, As = -6 pts (-30 pts total)' },
        { item: 'Pas de Dames', value: '-6 pts / Dame (-24 pts total)' },
        { item: 'Le Barbu (Roi ♥)', value: '-20 pts pour le preneur' },
        { item: 'Deux Derniers Plis', value: '12e = -10 pts, 13e = -20 pts (-30 pts total)' },
        { item: 'La Salade', value: 'Tous les malus combinés (-130 pts total)' },
        { item: 'Le Domino', value: '1er: +45, 2e: +20, 3e: +5, 4e: -5 pts' },
        { item: 'Vainqueur', value: 'Score le plus élevé à l’issue des donnes' },
      ],
    },
  },
  [GAMES.UNIVERSEL]: {
    id: GAMES.UNIVERSEL,
    deckType: 'any',
    name: 'Compteur Universel',
    playersBadge: '2–12 j.',
    categoryBadge: 'Tous jeux',
    description: 'Ardoise libre adaptée à tous vos jeux de société.',
    minPlayers: 2,
    maxPlayers: 12,
    scoreDir: 'configurable',
    rules: {
      sections: [
        {
          title: 'Présentation & Polyvalence',
          items: [
            'Ardoise de score universelle tout-terrain pour tous vos jeux de société et de cartes : Uno, Rami, Scrabble, Mölkky, Flip 7, Qwirkle, Mille Bornes, 1000 Bornes, etc.',
            'Permet d’accueillir de 2 à 12 joueurs avec leurs avatars personnalisés.',
          ],
        },
        {
          title: 'Choix du mode de décompte',
          items: [
            'Mode Score Élevé (Course aux points) : Les points s’additionnent et le total le plus haut l’emporte (ex. : Scrabble, Rami, Belote libre).',
            'Mode Seuil Éliminatoire (Pénalités) : Chaque manche ajoute des pénalités. Le premier joueur à franchir le seuil paramétré (50, 100, 150 ou 200 pts) est éliminé ou met fin à la partie. Le score le plus bas l’emporte (ex. : Uno).',
          ],
        },
        {
          title: 'Option de Règle Spéciale (Sursis personnalisé)',
          items: [
            'Division par 2 au seuil : Si un joueur atteint EXACTEMENT le seuil fixé, son score est divisé par 2 (style Caracole).',
            'Remise à zéro : Si un joueur atteint pile le seuil, son score retombe à zéro.',
            'Dépassement strict : Tout score supérieur au seuil entraîne la défaite.',
          ],
        },
        {
          title: 'Modèles de jeux enregistrés',
          items: [
            'Vous pouvez nommer et enregistrer vos configurations de jeux favorites (nom du jeu, seuil, règles).',
            'Vos modèles sauvegardés apparaissent directement sur l’accueil pour relancer une partie en un seul tap.',
          ],
        },
      ],
      summaryTable: [
        { item: 'Mode Score élevé', value: 'Le plus grand total gagne' },
        { item: 'Mode Seuil éliminatoire', value: 'Le plus petit total gagne' },
        { item: 'Règle spéciale de sursis', value: 'Divisé par 2 ou remise à 0 au seuil' },
        { item: 'Modèles personnalisés', value: 'Sauvegarde réutilisable en 1 clic' },
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

export const BELOTE_SIMPLE_CONTRACTS = [
  { value: 82, label: 'Prise simple (≥ 82 pts)' },
  { value: 252, label: 'Capot (252 pts)' },
]

export const COINCHE_CONTRACTS = [
  { value: 80, label: '80' }, { value: 90, label: '90' },
  { value: 100, label: '100' }, { value: 110, label: '110' },
  { value: 120, label: '120' }, { value: 130, label: '130' },
  { value: 140, label: '140' }, { value: 150, label: '150' },
  { value: 160, label: '160' }, { value: 250, label: 'Capot (250)' },
  { value: 500, label: 'Générale (500)' },
]

export const BELOTE_CONTRACTS = COINCHE_CONTRACTS

export const BARBU_CONTRACTS = [
  { id: 'plis', label: 'Pas de Plis', short: 'Plis', icon: 'Layers', totalPoints: -26, rule: '-2 pts / pli' },
  { id: 'coeurs', label: 'Pas de Cœurs', short: 'Cœurs', icon: 'Heart', totalPoints: -30, rule: '-2 pts / ♥, As -6 pts' },
  { id: 'dames', label: 'Pas de Dames', short: 'Dames', icon: 'Crown', totalPoints: -24, rule: '-6 pts / Dame' },
  { id: 'barbu', label: 'Le Barbu', short: 'Barbu', icon: 'Shield', totalPoints: -20, rule: 'Roi de Cœur = -20 pts' },
  { id: 'derniers', label: '2 Derniers Plis', short: '2 Der.', icon: 'Clock', totalPoints: -30, rule: '12e = -10, 13e = -20 pts' },
  { id: 'salade', label: 'La Salade', short: 'Salade', icon: 'Flame', totalPoints: -130, rule: 'Tous malus combinés' },
  { id: 'domino', label: 'Le Domino', short: 'Domino', icon: 'Trophy', totalPoints: 65, rule: '1er +45, 2e +20, 3e +5, 4e -5 pts' },
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

/**
 * Renvoie le titre affiché d'une partie en nettoyant les variantes historiques (ex: Président -> Trou du cul, Belote/Coinche -> Belote ou Coinche)
 */
export function getGameDisplayName(game) {
  if (!game) return ''
  const typeLower = (game.type || '').toLowerCase()
  const nameLower = (game.name || '').toLowerCase()

  if (typeLower === GAMES.ASCENSEUR || nameLower.includes('ascenseur') || nameLower.includes('rikiki')) {
    return 'Ascenseur'
  }
  if (typeLower === GAMES.DOURAK || nameLower.includes('dourak')) {
    return 'Dourak'
  }
  if (typeLower === GAMES.BARBU || nameLower.includes('barbu') || nameLower.includes('tonton')) {
    return 'Barbu'
  }
  if (typeLower === GAMES.YANIV || nameLower.includes('yaniv')) {
    return 'Yaniv'
  }
  if (typeLower === GAMES.PRESIDENT || nameLower.includes('trou du cul') || nameLower.includes('président') || nameLower.includes('president')) {
    return 'Trou du cul'
  }
  if (typeLower === GAMES.BELOTE || nameLower.includes('belote') || nameLower.includes('coinche')) {
    if (game.config?.variant === 'coinche' || (nameLower.includes('coinche') && !nameLower.includes('belote'))) {
      return 'Coinche'
    }
    return 'Belote'
  }
  // Pour tout jeu, ne garder qu'un seul nom sans parenthèses alternatives ni slashs (ex: "Nom (Alias)" -> "Nom")
  if (game.name) {
    const cleaned = game.name.replace(/\s*\([^)]*\)/g, '').replace(/\s*\/.*$/, '').trim()
    return cleaned || game.name
  }
  return game.name || ''
}

