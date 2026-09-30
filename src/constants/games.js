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
    name: 'Belote / Coinche',
    playersBadge: '2 éq. (4 j.)',
    categoryBadge: '32 cartes',
    description:
      "Le grand classique en 2 contre 2 : prenez l'atout, réalisez vos plis et atteignez votre contrat pour marquer les 162 points (ou réussir un Capot).",
    minPlayers: 2,
    maxPlayers: 4,
    scoreDir: 'high',
    teams: true,
    rules: {
      sections: [
        {
          title: 'Informations générales & Équipes',
          items: [
            'Nombre de joueurs : 4 joueurs répartis en 2 équipes de 2 partenaires assis face à face (Nous vs Eux).',
            'Matériel : Un jeu de 32 cartes (du 7 à l’As).',
            'Objectif : Remplir les contrats annoncés en cumulant au fil des donnes le plus grand nombre de points (souvent jusqu’à 1000 ou 1500 points).',
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
          title: 'Prise et Contrats (Belote vs Coinche)',
          items: [
            'Belote classique : Une carte est retournée au centre. Les joueurs choisissent tour à tour de la prendre (la couleur devient l’atout) ou de passer. Contrat minimal : réaliser au moins 82 points.',
            'Coinche : Les joueurs enchérissent par paliers de 10 points (de 80 à 160) en annonçant la couleur d’atout. Possibilité de Contrer (« Coincher ») pour doubler les points, ou « Surcoincher » pour quadrupler.',
            'Capot : Réaliser les 8 plis de la donne (vaut 252 points).',
            'Générale (Coinche) : Un seul joueur réalise les 8 plis à lui tout seul (vaut 500 points).',
          ],
        },
        {
          title: 'Annonces spéciales (Belote-Rebelote)',
          items: [
            'Belote et Rebelote (+20 pts) : Accordé au joueur possédant le Roi et la Dame d’atout. Il annonce « Belote » en posant la première carte, puis « Rebelote » en posant la seconde.',
            'Ces 20 points sont inviolables : ils restent acquis même si l’équipe preneuse chute son contrat.',
          ],
        },
        {
          title: 'Décompte des points & Chute (Dedans)',
          items: [
            'Contrat réussi : L’équipe preneuse marque ses points réalisés + le montant de son contrat + annonces. La défense marque ses points faits.',
            'Chute (« Dedans ») : Si les preneurs font moins de 82 points (ou moins que leur enchère), ils ne marquent rien (sauf Belote éventuelle). La défense empoche les 162 points + le contrat + annonces.',
          ],
        },
      ],
      summaryTable: [
        { item: 'Total des plis (avec 10 de der)', value: '162 pts' },
        { item: 'Belote + Rebelote (Roi & Dame atout)', value: '+20 pts inviolables' },
        { item: 'Contrat minimum (Belote classique)', value: '82 pts' },
        { item: 'Capot (tous les 8 plis)', value: '252 pts' },
        { item: 'Générale (Coinche)', value: '500 pts' },
        { item: 'Chute (« Dedans »)', value: 'Défense prend les 162 pts + contrat' },
      ],
    },
  },
  [GAMES.TAROT]: {
    id: GAMES.TAROT,
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

/**
 * Renvoie le titre affiché d'une partie en nettoyant les variantes historiques (ex: Président -> Trou du cul)
 */
export function getGameDisplayName(game) {
  if (!game) return ''
  if (game.type === GAMES.PRESIDENT || game.name?.includes('Trou du cul') || game.name?.includes('Président')) {
    return 'Trou du cul'
  }
  return game.name
}

