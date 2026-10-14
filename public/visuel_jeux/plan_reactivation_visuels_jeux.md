# Plan de Réactivation des Visuels de Jeux (Ardoise)

Ce document récapitule l'ensemble du travail d'intégration graphique des visuels de jeux façon craie blanche sur ardoise, et explique comment **réactiver immédiatement** l'affichage ou **mettre à jour** les visuels.

---

## 1. Interrupteur Rapide (Réactivation en 1 seconde)

Dans le fichier [**`src/components/HomeScreen.jsx`**](file:///f:/Web-design/APP_builder/Antigravity/Ardoise/src/components/HomeScreen.jsx#L25-L27) :

```javascript
// Ligne 26 de src/components/HomeScreen.jsx :
const SHOW_GAME_ILLUSTRATIONS = false // <-- Passer à true pour réactiver l'affichage des visuels
```

* **Quand `false` (état actuel)** : La vue originale épurée est restituée à 100% (paragraphe standard `mt-1 leading-relaxed`, aucun conteneur flottant, aucune charge réseau supplémentaire).
* **Quand `true`** : L'habillage flottant à droite avec détourage fluide du texte en arc de cercle (`shape-outside`) s'active automatiquement pour chaque jeu configuré.

---

## 2. Inventaire des Fichiers & Dossiers Sauvegardés

Tous les visuels, fichiers sources et calques ont été organisés et conservés :

### A. Visuels Web Optimisés (256 px - WebP & PNG)
Dossier : [**`public/visuel_jeux/`**](file:///f:/Web-design/APP_builder/Antigravity/Ardoise/public/visuel_jeux/)
* `dourak.webp` & `dourak.png` (242 × 256 px)
* `six_qui_prend.webp` & `six_qui_prend.png` (244 × 256 px)
* `skyjo.webp` & `skyjo.png` (245 × 256 px)
* `uno.webp` & `uno.png` (244 × 256 px)
* `yam.webp` & `yam.png` (242 × 256 px)

### B. Sources Haute Définition (HD & PSD)
Dossier : [**`public/visuel_jeux/hd/`**](file:///f:/Web-design/APP_builder/Antigravity/Ardoise/public/visuel_jeux/hd/)
* `dourak.psd`, `dourak.png`, `dourak copie.png`
* `six_qui_prend.png`
* `skyjo.png`
* `uno.png`, `uno copie.png`
* `yam.png`, `yam copie.png`, `yam.psd`

### C. Fonds Craie Isolés (Calques pour Photoshop / Photopea)
Dossier : [**`public/visuel_jeux/fond_craie/`**](file:///f:/Web-design/APP_builder/Antigravity/Ardoise/public/visuel_jeux/fond_craie/)
* `fond_craie_universel.png` (840 × 880, transparent RGBA avec grain organique et halo doux)
* `fond_craie_universel_1024.png` (1024 × 1024, version master HD)
* `fond_craie_ardoise_noire.png` (840 × 880, fond ardoise noire `#151719` pour fusion en mode *Superposition*)
* Halos adaptés par jeu : `fond_craie_yam.png`, `fond_craie_uno.png`, `fond_craie_skyjo.png`, `fond_craie_dourak.png`, `fond_craie_six_qui_prend.png`

---

## 3. Détails Techniques d'Intégration UI/UX

### Habillage en Arc de Cercle (`shape-outside`)
Dans [**`src/components/HomeScreen.jsx`**](file:///f:/Web-design/APP_builder/Antigravity/Ardoise/src/components/HomeScreen.jsx#L628-L644) :
```jsx
<div className="mt-1.5 flow-root">
  <img
    src={GAME_ILLUSTRATIONS[meta.id]}
    alt={`${meta.name} illustration craie`}
    className="float-right w-[84px] sm:w-[92px] h-auto ml-2.5 mb-0.5 mt-1.5 object-contain pointer-events-none select-none"
    style={{
      shapeOutside: 'circle(48% at 52% 48%)',
      shapeMargin: '4px',
    }}
    loading="lazy"
  />
  <p className="text-xs text-stone-600 dark:text-slate-300 leading-[1.45]">
    {formatTypography(meta.description)}
  </p>
</div>
```
* **`flow-root`** : Crée un contexte de formatage de bloc évitant tout débordement du `float-right` sur les badges ou cartes voisines.
* **`mt-1.5`** : Donne ~12px d'espace sous le bouton "Règles" pour éviter que l'image ne colle au haut de la carte.
* **`leading-[1.45]`** : Interlignage calibré au millimètre pour que le texte épouse harmonieusement la courbure de l'illustration sans sauts de ligne intempestifs.

---

## 4. Procédure pour Mettre à Jour ou Ajouter des Jeux

1. **Préparer le visuel HD** :
   * Déposer l'image dans `public/visuel_jeux/hd/<id_jeu>.png`.
   * Si besoin de texture craie, glisser `public/visuel_jeux/fond_craie/fond_craie_universel.png` sous le dessin.
2. **Régénérer les miniatures WebP & PNG 256px** via PowerShell :
   ```powershell
   cmd /c "python -c \"import os; from PIL import Image; src = r'public/visuel_jeux/hd/<id_jeu>.png'; img = Image.open(src).convert('RGBA'); img.thumbnail((256, 256), Image.Resampling.LANCZOS); img.save(r'public/visuel_jeux/<id_jeu>.webp', 'WEBP', quality=90); img.save(r'public/visuel_jeux/<id_jeu>.png', 'PNG')\""
   ```
3. **Déclarer le jeu dans la table** :
   Dans `src/components/HomeScreen.jsx` :
   ```javascript
   const GAME_ILLUSTRATIONS = {
     // ...
     [GAMES.VOTRE_JEU]: '/visuel_jeux/votre_jeu.webp',
   }
   ```
4. **Activer l'affichage** :
   Passer `const SHOW_GAME_ILLUSTRATIONS = true`.
