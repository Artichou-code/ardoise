# Super-Prompt Clé en Main pour l'Ajout d'un Nouveau Jeu dans Ardoise

> **Mode d'emploi** : Copiez-collez ce prompt pour intégrer n'importe quel futur jeu dans Ardoise sans oublier la moindre étape technique, ergonomique ou de référencement.

```markdown
Intègre le nouveau jeu "[NOM DU JEU]" dans l'application Ardoise en respectant rigoureusement les conventions du projet et l'intégralité des étapes de la checklist ci-dessous :

### 1. Données du Jeu & Règles
- Document source / règles : [LIEN VERS PDF OU RÈGLES / EXPLICATION]
- Nombre de joueurs : [MIN à MAX]
- Direction du score : [high (plus haut score gagne) / low (plus bas score gagne)]
- Catégorie & Type de matériel :
  - `deckType` : `'classic'` (cartes classiques traditionnelles 32/52/54 cartes) OU `'dedicated'` (jeux de société ou jeux de cartes édités dédiés) OU `'any'` (universel).
  - `categoryBadge` : libellé court du badge de matériel (ex: `'Jeu de société'` pour un jeu de société édité, ou `'32 cartes'`, `'52 cartes'`, `'54 cartes'` pour les classiques).
- Variantes / Modes : [Individuel / Équipe / Duel / etc.]
- Mots-clés & Synonymes de recherche : [noms alternatifs, éditeur, auteurs, mécaniques clés, variantes populaires pour la barre de recherche]

### 2. Implémentation du Code
1. `src/constants/games.js` :
   - Ajouter la constante dans `GAMES`.
   - Rédiger les métadonnées officielles complètes dans `GAME_META` :
     - `deckType` : impérativement `'classic'` (pour cartes classiques) ou `'dedicated'` (pour jeu de société). *Attention : ne jamais mettre une autre valeur custom car les filtres de l'accueil trient sur ces deux clés exactes.*
     - `categoryBadge` : libellé du badge affiché sur la carte d'accueil et la fiche de règles (ex: `'Jeu de société'`).
     - Sections de règles détaillées, barème synthétique `summaryTable`, description concise sans émojis.
2. `src/components/HomeScreen.jsx` (Filtrage & Mots-clés de recherche) :
   - Dans le bloc de recherche `sortedGames` de `HomeScreen.jsx`, ajouter la ligne de mots-clés :
     `if (m.id === '[id]') keywords.push('[mot1]', '[mot2]', '[editeur]', '[variante]')`
   - Vérifier que le jeu remonte instantanément dans la barre de recherche et s'affiche dans le bon filtre d'accueil (**"Cartes classiques"** si `classic` ou **"Jeu de société"** si `dedicated`).
3. Configuration & Gestion du Mode Équipe (si applicable) :
   - Dans `src/components/GameSetupSheet.jsx`, ajouter la sélection du mode (ex: individuel vs équipe 2v2).
   - Dans `src/utils/gameUtils.js` :
     - Brancher `getTeamGameData(game)` pour structurer les 2 équipes (partenaires `pNous` et `pEux`, score combiné ou commun, détail de calcul `t.detail` ex: `38 + 17`, libellé `t.label` et `t.labelFull`, rangs et leaders).
     - Adapter `getRanking()` pour que les deux partenaires d'une équipe gagnante soient classés au rang 1 (indispensable pour les stats et trophées équitables).
4. `src/components/engines/[Nom]Engine.jsx` :
   - Développer le composant de saisie de manche en utilisant le scrubber tactile de score (`QuickScoreBadge`) couplé à la feuille de saisie directe (`ScorePad` et `BottomSheet`).
   - Gérer les options et variantes spécifiques (ex: seuils, bonus, pénalités).
   - **Si mode équipe** :
     - En-tête : afficher les 2 avatars des coéquipiers groupés côte à côte (`-space-x-2.5`).
     - Aperçu de manche : afficher les 2 équipes en 2 niveaux (Ligne 1 : avatars + score manche ; Ligne 2 : noms de l'équipe et calcul des points).
     - Mettre à jour `updateScores` avec deltas et totaux adaptés au mode d'équipe.
   - Intégrer la validation des scores avec boîte de dialogue de confirmation si nécessaire.
5. `src/components/GameScreen.jsx` :
   - Importer et brancher le nouveau moteur dans `ENGINE_MAP`.
6. Rendu Historique, Fiche Détail & Victoire (si mode équipe) :
   - `src/components/HistoryScreen.jsx` : s'assurer que `getTeamGameData(game)` pilote l'affichage par équipes en 2 colonnes avec avatars doubles, score centré et noms + calculs en-dessous sur toute la largeur sans coupure.
   - `src/components/GameDetailSheet.jsx` : vérifier la bannière vainqueur/leader avec doubles avatars et score d'équipe combiné, la section « CLASSEMENT DES ÉQUIPES », et les repères `Éq. 1` / `Éq. 2` dans le relevé des manches.
   - `src/components/VictoryScreen.jsx` : vérifier le podium par équipes (1er vs 2e avec doubles avatars).
   - `src/components/HomeScreen.jsx` : vérifier l'affichage `Équipe 1 vs Équipe 2` dans la liste des parties en cours.
7. `src/utils/statsUtils.js` & `src/components/ui/TrophyIcon.jsx` :
   - Ajouter le titre thématique dans `gameWinners`.
   - Ajouter le trophée officiel dans `TROPHIES_CATALOG` (`master_[id]`).
   - Assurer que l'icône Lucide correspondante est bien déclarée dans `TrophyIcon.jsx`.

### 3. Référencement SEO & Découvrabilité
1. `scripts/generate-seo-pages.mjs` :
   - Ajouter la configuration de page dans `SEO_PAGES` (slug, title accrocheur avec règles + compteur, meta description orientée intention de recherche, h1 clair).
2. `index.html` :
   - Mettre à jour la meta description générale, OpenGraph et Twitter Card.
   - Mettre à jour le JSON-LD Schema.org (`featureList` de WebApplication et `itemListElement` de ItemList).
3. `public/sitemap.xml` :
   - Ajouter l'URL canonique de la page `/jeux/[slug]`.
4. `public/llms.txt` et `public/llms-full.txt` :
   - Ajouter le résumé du jeu, son barème et son lien de documentation pour les IA et moteurs de recherche génératifs.
5. Catalogue Excel dans le dossier public (`public/games-catalog.xlsx`) :
   - Mettre à jour `scripts/generate-catalog-excel.mjs` (ou `GAME_ORDER`) pour inclure le nouveau jeu.
   - Générer le classeur Excel via `node scripts/generate-catalog-excel.mjs` (ou automatiquement au build via `npm run build`), avec la colonne `N°` en 1ère position (numérotation continue des jeux), garantissant que le fichier `public/games-catalog.xlsx` est correctement renseigné et disponible au téléchargement public (`https://ardoise.art-crea.fr/games-catalog.xlsx`). Ne JAMAIS utiliser de simple fichier .csv.

### 4. Build et Contrôle Qualité
- Lancer `npm run build` et valider qu'aucune erreur de linting ou de build ne survient, que le script pré-génère bien le fichier `dist/jeux/[slug]/index.html` et synchronise le catalogue Excel dans `public/games-catalog.xlsx` et `dist/games-catalog.xlsx`.

### 5. Consigne Stricte de Déploiement
⚠️ **CONSIGNE STRICTE DE DÉPLOIEMENT :** Ne fais AUCUN `git push` à la fin de ton intervention. Fais uniquement les commits en local. Tu ne devras pusher que lorsque je t'en donnerai l'autorisation explicite.
```
