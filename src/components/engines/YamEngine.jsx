import { useState, useMemo, useEffect } from 'react'
import { Trophy, Dices, Check, HelpCircle } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { getActiveSession, getMyPlayerIdForSession, setMyPlayerIdForSession } from '../../store/liveSession'
import { Avatar } from '../ui/Avatar'
import { QuickScoreBadge } from '../ui/QuickScoreBadge'
import { Dialog } from '../ui/Dialog'
import { FloatingValidationBar } from '../ui/FloatingValidationBar'
import { YamCellPopover } from './YamCellPopover'

// Composant SVG d'une face de dé net, moderne et parfaitement lisible
function DiceFace({ value, size = 28, className = '' }) {
  const dotsByValue = {
    1: [{ cx: 12, cy: 12, r: 2.8 }],
    2: [
      { cx: 7.5, cy: 7.5, r: 2.3 },
      { cx: 16.5, cy: 16.5, r: 2.3 },
    ],
    3: [
      { cx: 7, cy: 7, r: 2.3 },
      { cx: 12, cy: 12, r: 2.3 },
      { cx: 17, cy: 17, r: 2.3 },
    ],
    4: [
      { cx: 7.5, cy: 7.5, r: 2.3 },
      { cx: 16.5, cy: 7.5, r: 2.3 },
      { cx: 7.5, cy: 16.5, r: 2.3 },
      { cx: 16.5, cy: 16.5, r: 2.3 },
    ],
    5: [
      { cx: 7.5, cy: 7.5, r: 2.3 },
      { cx: 16.5, cy: 7.5, r: 2.3 },
      { cx: 12, cy: 12, r: 2.4 },
      { cx: 7.5, cy: 16.5, r: 2.3 },
      { cx: 16.5, cy: 16.5, r: 2.3 },
    ],
    6: [
      { cx: 7.5, cy: 6.5, r: 2.2 },
      { cx: 7.5, cy: 12, r: 2.2 },
      { cx: 7.5, cy: 17.5, r: 2.2 },
      { cx: 16.5, cy: 6.5, r: 2.2 },
      { cx: 16.5, cy: 12, r: 2.2 },
      { cx: 16.5, cy: 17.5, r: 2.2 },
    ],
  }

  const dots = dotsByValue[value] || []

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`shrink-0 drop-shadow-2xs select-none ${className}`}
      aria-label={`Dé ${value}`}
    >
      <rect
        x="1.5"
        y="1.5"
        width="21"
        height="21"
        rx="5.5"
        ry="5.5"
        className="fill-stone-100 dark:fill-slate-800 stroke-stone-300 dark:stroke-slate-600"
        strokeWidth="1.5"
      />
      {dots.map((dot, idx) => (
        <circle
          key={idx}
          cx={dot.cx}
          cy={dot.cy}
          r={dot.r}
          className="fill-stone-900 dark:fill-slate-100"
        />
      ))}
    </svg>
  )
}

// Composant de case de grille Yam's épuré, tactile et réactif (tap direct)
function YamCellBadge({
  value,
  isFixed = false,
  isActive = false,
  disabled = false,
  isPast = false,
  isCurrentChoice = false,
  isOtherChoice = false,
  onClick,
}) {
  const isZero = value === 0
  const isUnset = value == null
  const isFilled = !isUnset && !isZero

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`w-full min-w-0 h-7.5 sm:h-8 px-1 sm:px-1.5 py-0.5 rounded-lg border transition-all flex items-center justify-center gap-1 select-none text-xs sm:text-sm font-black tabular-nums cursor-pointer ${
        disabled
          ? isPast
            ? isFilled
              ? isFixed
                ? 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-extrabold cursor-default opacity-90'
                : 'bg-stone-100/80 dark:bg-slate-800/70 border-stone-200/80 dark:border-slate-800 text-stone-800 dark:text-slate-200 font-extrabold cursor-default opacity-90'
              : 'bg-stone-100/70 dark:bg-slate-800/60 border-stone-200/60 text-stone-400 dark:text-slate-500 font-bold cursor-default opacity-85'
            : 'bg-stone-50/50 dark:bg-slate-900/40 border-stone-200/40 text-stone-300 dark:text-slate-600 opacity-35 cursor-not-allowed'
          : isActive
          ? 'bg-[#c83b3b]/15 dark:bg-[#c83b3b]/25 border-[#c83b3b] text-[#c83b3b] dark:text-red-300 ring-2 ring-[#c83b3b] shadow-sm scale-102 z-10'
          : isCurrentChoice
          ? isFixed
            ? 'bg-emerald-500/15 dark:bg-emerald-500/25 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/50 shadow-2xs'
            : isZero
            ? 'bg-stone-100 dark:bg-slate-800 border-stone-400 text-stone-600 dark:text-slate-300 ring-2 ring-stone-400/50 shadow-2xs'
            : 'bg-[#c83b3b]/10 dark:bg-[#c83b3b]/20 border-[#c83b3b] text-[#c83b3b] dark:text-red-300 ring-2 ring-[#c83b3b]/60 shadow-2xs'
          : isOtherChoice
          ? 'bg-stone-100/70 dark:bg-slate-900/60 border-stone-200/50 dark:border-slate-800/50 text-stone-300 dark:text-slate-600 opacity-40 hover:opacity-100 hover:border-stone-400 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-800 hover:text-stone-600 transition-all cursor-pointer'
          : isFilled
          ? isFixed
            ? 'bg-emerald-500/12 dark:bg-emerald-500/20 border-emerald-500/50 text-emerald-700 dark:text-emerald-300 hover:border-emerald-500 shadow-2xs'
            : 'bg-[#c83b3b]/8 dark:bg-[#c83b3b]/15 border-[#c83b3b]/35 text-[#c83b3b] dark:text-red-300 hover:border-[#c83b3b] shadow-2xs'
          : isZero
          ? 'bg-stone-100 dark:bg-slate-800/80 border-stone-300 dark:border-slate-700 text-stone-500 dark:text-slate-400 hover:border-stone-400 shadow-2xs'
          : 'bg-white/80 dark:bg-slate-900/80 border-stone-200 dark:border-slate-800 text-stone-400 dark:text-slate-500 hover:border-[#c83b3b]/60 hover:text-[#c83b3b] shadow-2xs'
      }`}
    >
      {isFilled && isFixed && (
        <Check size={11} strokeWidth={3} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
      )}
      {isFilled ? (
        <span>{value}</span>
      ) : isZero ? (
        <span className="line-through decoration-red-500 decoration-2 text-stone-400 dark:text-slate-500">
          0
        </span>
      ) : (
        <span className="text-stone-300 dark:text-slate-600 font-bold">—</span>
      )}
    </button>
  )
}
// Définition des 13 catégories officielles de la feuille de marque du Yam's
export const YAM_CATEGORIES = [
  // Section Supérieure
  { id: 'ones', name: 'As (1)', section: 'upper', desc: 'Somme des dés 1', max: 5, presets: [0, 1, 2, 3, 4, 5], diceValue: 1 },
  { id: 'twos', name: 'Deux (2)', section: 'upper', desc: 'Somme des dés 2', max: 10, presets: [0, 2, 4, 6, 8, 10], diceValue: 2 },
  { id: 'threes', name: 'Trois (3)', section: 'upper', desc: 'Somme des dés 3', max: 15, presets: [0, 3, 6, 9, 12, 15], diceValue: 3 },
  { id: 'fours', name: 'Quatre (4)', section: 'upper', desc: 'Somme des dés 4', max: 20, presets: [0, 4, 8, 12, 16, 20], diceValue: 4 },
  { id: 'fives', name: 'Cinq (5)', section: 'upper', desc: 'Somme des dés 5', max: 25, presets: [0, 5, 10, 15, 20, 25], diceValue: 5 },
  { id: 'sixes', name: 'Six (6)', section: 'upper', desc: 'Somme des dés 6', max: 30, presets: [0, 6, 12, 18, 24, 30], diceValue: 6 },

  // Section Inférieure
  { id: 'three_kind', name: 'Brelan', section: 'lower', desc: '3 dés identiques (Somme des 5 dés)', max: 30, presets: [0, 15, 18, 20, 24, 28] },
  { id: 'four_kind', name: 'Carré', section: 'lower', desc: '4 dés identiques (Somme des 5 dés)', max: 30, presets: [0, 16, 20, 24, 28] },
  { id: 'full', name: 'Full', section: 'lower', desc: '3 + 2 dés identiques (25 pts fixes)', fixed: 25, max: 25, presets: [0, 25] },
  { id: 'small_straight', name: 'Petite Suite', section: 'lower', desc: '4 dés consécutifs (30 pts fixes)', fixed: 30, max: 30, presets: [0, 30] },
  { id: 'large_straight', name: 'Grande Suite', section: 'lower', desc: '5 dés consécutifs (40 pts fixes)', fixed: 40, max: 40, presets: [0, 40] },
  { id: 'yam', name: "Yam's", section: 'lower', desc: '5 dés identiques (50 pts fixes)', fixed: 50, max: 50, presets: [0, 50] },
  { id: 'chance', name: 'Chance', section: 'lower', desc: 'Somme totale des 5 dés', max: 30, presets: [0, 15, 20, 22, 25, 28] },
]

// Dictionnaire pédagogique complet des règles et calculs pour chaque case de la feuille de marque
export const YAM_RULES_EXPLANATIONS = {
  ones: {
    title: 'As (Dé 1)',
    subtitle: 'Section Supérieure',
    points: 'Max 5 pts',
    condition: 'Ne retenir que les dés affichant la face 1.',
    calc: 'Somme des dés 1 obtenus (les autres dés sont ignorés).',
    example: 'Trois dés 1 ➔ 1 + 1 + 1 = 3 points (0 pt si aucun 1 ou case barrée).',
    tip: 'Objectif Bonus : viser au moins 3 dés de 1 (3 pts).',
  },
  twos: {
    title: 'Deux (Dé 2)',
    subtitle: 'Section Supérieure',
    points: 'Max 10 pts',
    condition: 'Ne retenir que les dés affichant la face 2.',
    calc: 'Somme des dés 2 obtenus (les autres dés sont ignorés).',
    example: 'Trois dés 2 ➔ 2 + 2 + 2 = 6 points.',
    tip: 'Objectif Bonus : viser au moins 3 dés de 2 (6 pts).',
  },
  threes: {
    title: 'Trois (Dé 3)',
    subtitle: 'Section Supérieure',
    points: 'Max 15 pts',
    condition: 'Ne retenir que les dés affichant la face 3.',
    calc: 'Somme des dés 3 obtenus (les autres dés sont ignorés).',
    example: 'Trois dés 3 ➔ 3 + 3 + 3 = 9 points.',
    tip: 'Objectif Bonus : viser au moins 3 dés de 3 (9 pts).',
  },
  fours: {
    title: 'Quatre (Dé 4)',
    subtitle: 'Section Supérieure',
    points: 'Max 20 pts',
    condition: 'Ne retenir que les dés affichant la face 4.',
    calc: 'Somme des dés 4 obtenus (les autres dés sont ignorés).',
    example: 'Trois dés 4 ➔ 4 + 4 + 4 = 12 points.',
    tip: 'Objectif Bonus : viser au moins 3 dés de 4 (12 pts).',
  },
  fives: {
    title: 'Cinq (Dé 5)',
    subtitle: 'Section Supérieure',
    points: 'Max 25 pts',
    condition: 'Ne retenir que les dés affichant la face 5.',
    calc: 'Somme des dés 5 obtenus (les autres dés sont ignorés).',
    example: 'Trois dés 5 ➔ 5 + 5 + 5 = 15 points.',
    tip: 'Objectif Bonus : viser au moins 3 dés de 5 (15 pts).',
  },
  sixes: {
    title: 'Six (Dé 6)',
    subtitle: 'Section Supérieure',
    points: 'Max 30 pts',
    condition: 'Ne retenir que les dés affichant la face 6.',
    calc: 'Somme des dés 6 obtenus (les autres dés sont ignorés).',
    example: 'Trois dés 6 ➔ 6 + 6 + 6 = 18 points.',
    tip: 'Objectif Bonus : viser au moins 3 dés de 6 (18 pts). Un 4e Six apporte immédiatement +6 pts d’avance sur le bonus !',
  },
  upper_subtotal: {
    title: 'Sous-Total Supérieur (TOT. /63)',
    subtitle: 'Palier du Bonus',
    points: 'Objectif ≥ 63 pts',
    condition: 'Addition des points obtenus sur les cases As à Six (1 à 6).',
    calc: 'Si ce total atteint 63 points ou plus, vous débloquez automatiquement les +35 points de Bonus.',
    example: '3 + 6 + 9 + 12 + 15 + 18 = 63 points pile !',
    tip: 'Le seuil de 63 correspond exactement à une moyenne de 3 dés réussis par chiffre.',
  },
  bonus: {
    title: 'Bonus (+35 points)',
    subtitle: 'Comment l\'obtenir ?',
    points: '+35 pts ou 0 pt',
    condition: 'Le total des cases 1 à 6 doit atteindre au moins 63 points.',
    calc: 'Si Total 1 à 6 ≥ 63 pts ➔ +35 points ajoutés au Total 1. Si < 63 pts ➔ 0 pt de bonus.',
    example: 'Pour l\'obtenir facilement : il suffit d\'obtenir en moyenne 3 dés identiques sur chaque chiffre (3×1 + 3×2 + 3×3 + 3×4 + 3×5 + 3×6 = 63).',
    tip: 'Tout 4e dé réussi (ex. quatre 5 ou quatre 6) compense un éventuel retard ou une case barrée sur un autre chiffre !',
  },
  total1: {
    title: 'Total 1 (T.1)',
    subtitle: 'Sous-Total Supérieur avec Bonus',
    points: 'Sous-total + Bonus',
    condition: 'Addition du sous-total supérieur (cases 1 à 6) et du bonus de 35 points (si débloqué).',
    calc: 'Total des cases 1 à 6 + 35 pts (si total ≥ 63).',
    example: 'Exemple : 65 pts + 35 pts (bonus) = 100 points au Total 1.',
  },
  three_kind: {
    title: 'Brelan',
    subtitle: 'Section Inférieure',
    points: 'Max 30 pts',
    condition: 'Obtenir au moins 3 dés identiques parmi les 5 dés du lancer.',
    calc: 'SOMME DES 5 DÉS DU LANCER (les 3 dés identiques + les 2 autres dés !).',
    example: 'Lancer : 4 - 4 - 4 - 2 - 6 ➔ 3 dés de 4 + un 2 + un 6 = 20 points.',
    tip: 'Règle essentielle : On n\'additionne pas seulement les 3 dés identiques, mais bien la totalité des 5 dés lancés !',
  },
  four_kind: {
    title: 'Carré',
    subtitle: 'Section Inférieure',
    points: 'Max 30 pts',
    condition: 'Obtenir au moins 4 dés identiques parmi les 5 dés du lancer.',
    calc: 'SOMME DES 5 DÉS DU LANCER (les 4 dés identiques + le 5e dé !).',
    example: 'Lancer : 5 - 5 - 5 - 5 - 3 ➔ 4 dés de 5 + le dé 3 = 23 points.',
    tip: 'Règle essentielle : Tout comme le Brelan, on additionne la totalité des 5 dés lancés !',
  },
  full: {
    title: 'Full (25 points fixes)',
    subtitle: 'Section Inférieure',
    points: '25 pts fixes',
    condition: 'Obtenir 3 dés d\'une même valeur et 2 dés d\'une autre valeur (un Brelan + une Paire).',
    calc: '25 points fixes, quelle que soit la valeur faciale des dés.',
    example: 'Valide : 3 - 3 - 3 - 6 - 6 OU 2 - 2 - 5 - 5 - 5 ➔ 25 points.',
    tip: 'Un Yam\'s (5 dés identiques) peut également être comptabilisé comme un Full si votre case Yam\'s est déjà prise.',
  },
  small_straight: {
    title: 'Petite Suite (30 points fixes)',
    subtitle: 'Section Inférieure',
    points: '30 pts fixes',
    condition: 'Obtenir 4 dés consécutifs qui se suivent (1-2-3-4, 2-3-4-5 ou 3-4-5-6).',
    calc: '30 points fixes. Le 5e dé peut avoir n\'importe quelle valeur.',
    example: 'Lancer : 1 - 2 - 3 - 4 - 6 ➔ les dés 1, 2, 3, 4 se suivent ➔ 30 points.',
    tip: 'Une Grande Suite valide également d\'office une Petite Suite si votre case Grande Suite est déjà remplie.',
  },
  large_straight: {
    title: 'Grande Suite (40 points fixes)',
    subtitle: 'Section Inférieure',
    points: '40 pts fixes',
    condition: 'Obtenir 5 dés consécutifs qui se suivent (1-2-3-4-5 ou 2-3-4-5-6).',
    calc: '40 points fixes. Aucun doublon n\'est permis.',
    example: 'Deux combinaisons possibles : 1-2-3-4-5 OU 2-3-4-5-6 ➔ 40 points.',
    tip: 'Combinaison majeure à haute valeur. Ne la sacrifiez pas dans une Petite Suite si vous pouvez encore relancer !',
  },
  yam: {
    title: 'Yam\'s (50 points fixes)',
    subtitle: 'La combinaison suprême',
    points: '50 pts fixes',
    condition: 'Obtenir les 5 dés strictement identiques !',
    calc: '50 points fixes, quel que soit le chiffre (cinq 1 ou cinq 6 valent 50 points).',
    example: 'Lancer : 6 - 6 - 6 - 6 - 6 ➔ 50 points !',
    tip: 'Le coup légendaire du jeu qui fait très souvent la différence pour la victoire finale.',
  },
  chance: {
    title: 'Chance',
    subtitle: 'Section Inférieure (Joker)',
    points: 'Max 30 pts',
    condition: 'Aucune combinaison exigée : n\'importe quel lancer de 5 dés est accepté.',
    calc: 'Somme totale des 5 dés obtenus.',
    example: 'Lancer : 6 - 6 - 5 - 5 - 4 ➔ 6 + 6 + 5 + 5 + 4 = 26 points.',
    tip: 'Case de secours idéale pour sauver un lancer raté à forte valeur (dés 5 et 6).',
  },
  total2: {
    title: 'Total 2 (T.2)',
    subtitle: 'Sous-Total Inférieur',
    points: 'Somme des 7 contrats',
    condition: 'Addition des 7 combinaisons de la section inférieure.',
    calc: 'Brelan + Carré + Full + Petite Suite + Grande Suite + Yam\'s + Chance.',
  },
  grand_total: {
    title: 'Score Général (TOTAL)',
    subtitle: 'Score final de la partie',
    points: 'Total 1 + Total 2',
    condition: 'Total 1 (avec Bonus éventuel de +35) + Total 2.',
    calc: 'Le total cumulé de l\'ensemble de la grille en 13 cases.',
    tip: 'Le joueur qui cumule le total le plus élevé remporte la partie de Yam\'s !',
  },
}

export function YamEngine({ game, onFinish }) {
  const { updateScores, commitRound, updateLiveDraft } = useGame()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [myPlayerId, setMyPlayerId] = useState(() => {
    const session = getActiveSession()
    return getMyPlayerIdForSession(session?.code, game)
  })

  useEffect(() => {
    const update = () => {
      const session = getActiveSession()
      setMyPlayerId(getMyPlayerIdForSession(session?.code, game))
    }
    const handleMyPlayerChanged = (e) => {
      setMyPlayerId(e.detail?.playerId || null)
    }
    window.addEventListener('ardoise-live-my-player-changed', handleMyPlayerChanged)
    window.addEventListener('ardoise-default-my-profile-changed', update)
    return () => {
      window.removeEventListener('ardoise-live-my-player-changed', handleMyPlayerChanged)
      window.removeEventListener('ardoise-default-my-profile-changed', update)
    }
  }, [game])

  // Mode de saisie : 'grid' (grille croisée officielle) ou 'direct' (score direct par manche)
  const [inputMode, setInputMode] = useState('grid')

  // État de la grille pour chaque joueur : { [playerId]: { [catId]: number | null } }
  const [gridByPlayer, setGridByPlayer] = useState(() => {
    const init = {}
    for (const p of game.players) {
      if (game.restoredRound?.gridByPlayer?.[p.id]) {
        init[p.id] = { ...game.restoredRound.gridByPlayer[p.id] }
      } else {
        // Récupérer l'état accumulé depuis les manches passées si disponible
        const accum = {}
        const rounds = Array.isArray(game.rounds) ? game.rounds : []
        for (const round of rounds) {
          if (round?.gridByPlayer?.[p.id]) {
            Object.assign(accum, round.gridByPlayer[p.id])
          }
        }
        // Prendre en compte un éventuel brouillon existant sur la table
        if (game.draft?.byPlayer?.[p.id]?.catId != null) {
          accum[game.draft.byPlayer[p.id].catId] = game.draft.byPlayer[p.id].value
        }
        init[p.id] = accum
      }
    }
    return init
  })

  // Deltas directs si mode direct
  const [directDelta, setDirectDelta] = useState(() => {
    const init = {}
    for (const p of game.players) {
      init[p.id] = game.restoredDelta?.[p.id] != null ? game.restoredDelta[p.id] : 0
    }
    return init
  })

  // Popover rectangulaire centré au milieu de l'écran : { playerId, catId }
  const [activePopover, setActivePopover] = useState(null)

  // Modale d'explication de règle pour une case (clic sur la colonne de gauche)
  const [selectedCategoryRule, setSelectedCategoryRule] = useState(null)

  const handleCellClick = (playerId, catId) => {
    const status = getCellStatus(playerId, catId)
    if (status.disabled) return

    if (activePopover?.playerId === playerId && activePopover?.catId === catId) {
      setActivePopover(null)
      return
    }

    setActivePopover({ playerId, catId })
  }
  const [showRulesMemo, setShowRulesMemo] = useState(false)

  // Calcul des scores de la grille d'un joueur
  const getPlayerGridScores = (playerId) => {
    const playerGrid = gridByPlayer[playerId] || {}
    let upperSubtotal = 0
    let upperFilledCount = 0

    const upperCats = YAM_CATEGORIES.filter(c => c.section === 'upper')
    for (const cat of upperCats) {
      if (playerGrid[cat.id] != null) {
        upperSubtotal += Number(playerGrid[cat.id]) || 0
        upperFilledCount++
      }
    }

    const hasBonus = upperSubtotal >= 63
    const bonusPoints = hasBonus ? 35 : 0

    let lowerSubtotal = 0
    let lowerFilledCount = 0
    const lowerCats = YAM_CATEGORIES.filter(c => c.section === 'lower')
    for (const cat of lowerCats) {
      if (playerGrid[cat.id] != null) {
        lowerSubtotal += Number(playerGrid[cat.id]) || 0
        lowerFilledCount++
      }
    }

    const total1 = upperSubtotal + bonusPoints
    const grandTotal = total1 + lowerSubtotal
    const filledTotal = upperFilledCount + lowerFilledCount

    return {
      upperSubtotal,
      hasBonus,
      bonusPoints,
      total1,
      lowerSubtotal,
      grandTotal,
      filledTotal,
      isComplete: filledTotal === 13,
    }
  }

  // Grille enregistrée lors des manches précédentes (pour détecter les nouveautés de cette manche)
  const previousGrid = useMemo(() => {
    const accum = {}
    const rounds = Array.isArray(game.rounds) ? game.rounds : []
    for (const p of game.players) {
      accum[p.id] = {}
      for (const round of rounds) {
        if (round?.gridByPlayer?.[p.id]) {
          Object.assign(accum[p.id], round.gridByPlayer[p.id])
        }
      }
    }
    return accum
  }, [game.rounds, game.players])

  // Synchroniser le brouillon (draft) provenant des autres appareils en Table Live
  useEffect(() => {
    if (!game?.draft?.byPlayer) return
    setGridByPlayer(prev => {
      let changed = false
      const next = { ...prev }
      for (const p of game.players) {
        const remotePlayerDraft = game.draft.byPlayer[p.id]
        const currentPGrid = next[p.id] ? { ...next[p.id] } : {}
        const prevPGrid = previousGrid[p.id] || {}

        if (remotePlayerDraft && remotePlayerDraft.catId != null) {
          const { catId, value } = remotePlayerDraft
          for (const c of YAM_CATEGORIES) {
            if (c.id !== catId && prevPGrid[c.id] == null && currentPGrid[c.id] != null) {
              delete currentPGrid[c.id]
              changed = true
            }
          }
          if (currentPGrid[catId] !== value) {
            currentPGrid[catId] = value
            changed = true
          }
          next[p.id] = currentPGrid
        } else if (remotePlayerDraft === null && currentPGrid) {
          for (const c of YAM_CATEGORIES) {
            if (prevPGrid[c.id] == null && currentPGrid[c.id] != null) {
              delete currentPGrid[c.id]
              changed = true
            }
          }
        }
      }
      return changed ? next : prev
    })
  }, [game?.draft, game.players, previousGrid])

  // Nombre de cases nouvellement saisies ou modifiées dans cette manche
  const newlyFilledCount = useMemo(() => {
    let count = 0
    for (const p of game.players) {
      const pGrid = gridByPlayer[p.id] || {}
      const prevPGrid = previousGrid[p.id] || {}
      for (const cat of YAM_CATEGORIES) {
        if (pGrid[cat.id] != null && (prevPGrid[cat.id] == null || pGrid[cat.id] !== prevPGrid[cat.id])) {
          count++
        }
      }
    }
    return count
  }, [gridByPlayer, previousGrid, game.players])

  // Catégorie choisie par chaque joueur pour la manche en cours (règle officielle : 1 seule case par manche)
  const currentRoundCatByPlayer = useMemo(() => {
    const map = {}
    for (const p of game.players) {
      const pGrid = gridByPlayer[p.id] || {}
      const prevPGrid = previousGrid[p.id] || {}
      const chosen = YAM_CATEGORIES.find(
        cat => pGrid[cat.id] != null && prevPGrid[cat.id] == null
      )
      map[p.id] = chosen ? chosen.id : null
    }
    return map
  }, [gridByPlayer, previousGrid, game.players])

  // Détermine le statut d'une cellule pour l'interaction, le verrouillage et le style
  const getCellStatus = (playerId, catId) => {
    const isPast = previousGrid[playerId]?.[catId] != null
    const chosenCatId = currentRoundCatByPlayer[playerId]
    const isCurrentChoice = chosenCatId === catId
    const isOtherChoice = !isPast && !isCurrentChoice && chosenCatId != null
    return {
      isPast,
      isCurrentChoice,
      isOtherChoice,
      disabled: isPast,
    }
  }

  // Numéro du tour actuel (1 à 13)
  const currentRoundNumber = Math.min(13, (game.rounds?.length || 0) + 1)

  // Nombre de joueurs prêts dans cette manche (ayant choisi leur case ou ayant déjà rempli leurs 13 cases)
  const readyPlayersCount = useMemo(() => {
    return game.players.filter(p => {
      const pGrid = gridByPlayer[p.id] || {}
      const filledTotal = YAM_CATEGORIES.filter(c => pGrid[c.id] != null).length
      return currentRoundCatByPlayer[p.id] != null || filledTotal >= 13
    }).length
  }, [game.players, currentRoundCatByPlayer, gridByPlayer])

  const allPlayersReady = readyPlayersCount === game.players.length && game.players.length > 0

  // Condition de validation : TOUS les joueurs doivent avoir choisi leur case du tour pour valider la manche
  const canValidate = useMemo(() => {
    if (inputMode === 'grid') {
      return allPlayersReady
    }
    return game.players.some(p => (directDelta[p.id] || 0) > 0)
  }, [inputMode, allPlayersReady, directDelta, game.players])

  

  const handleCategoryValueChange = (playerId, catId, value) => {
    const cleanVal = (value === null || value === undefined) ? null : Math.max(0, Number(value) || 0)
    setGridByPlayer(prev => {
      const current = prev[playerId] ? { ...prev[playerId] } : {}
      if (cleanVal === null) {
        delete current[catId]
      } else {
        const prevPGrid = previousGrid[playerId] || {}
        // Règle 1 case par manche : si on renseigne une nouvelle case dans cette manche,
        // effacer toute autre case renseignée dans cette manche pour ce joueur
        if (prevPGrid[catId] == null) {
          for (const c of YAM_CATEGORIES) {
            if (c.id !== catId && prevPGrid[c.id] == null && current[c.id] != null) {
              delete current[c.id]
            }
          }
        }
        current[catId] = cleanVal
      }
      return { ...prev, [playerId]: current }
    })

    // Pousser immédiatement le changement vers la Table Live (visible en direct sur tous les écrans connectés)
    if (updateLiveDraft) {
      if (cleanVal === null) {
        updateLiveDraft(playerId, null)
      } else {
        updateLiveDraft(playerId, { catId, value: cleanVal })
      }
    }
  }

  const handleClearCategory = (playerId, catId) => {
    setGridByPlayer(prev => {
      const current = { ...(prev[playerId] || {}) }
      delete current[catId]
      return { ...prev, [playerId]: current }
    })
    if (updateLiveDraft) {
      updateLiveDraft(playerId, null)
    }
  }

  const handleValidate = async () => {
    if (!canValidate || isSubmitting) return
    setIsSubmitting(true)
    const newScores = {}
    const delta = {}
    let allFinished = true
    let highestScore = -1
    let winnerId = null

    if (inputMode === 'grid') {
      for (const p of game.players) {
        const stats = getPlayerGridScores(p.id)
        const oldScore = game.scores?.[p.id] || 0
        newScores[p.id] = stats.grandTotal
        delta[p.id] = stats.grandTotal - oldScore

        if (!stats.isComplete) {
          allFinished = false
        }
        if (stats.grandTotal > highestScore) {
          highestScore = stats.grandTotal
          winnerId = p.id
        }
      }
    } else {
      allFinished = false
      for (const p of game.players) {
        const d = directDelta[p.id] || 0
        delta[p.id] = d
        newScores[p.id] = (game.scores?.[p.id] || 0) + d
      }
    }

    try {
      const commitFn = commitRound || updateScores
      await commitFn(
        {
          scores: newScores,
          delta,
          gridByPlayer,
          inputMode,
          type: 'yam',
        },
        {
          status: allFinished ? 'finished' : 'active',
          winner: allFinished ? winnerId : null,
        }
      )

      if (allFinished && winnerId) {
        setTimeout(() => {
          onFinish?.(winnerId)
        }, 150)
      }
    } catch (err) {
      console.error('Erreur validation manche Yam:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  
  const upperCategories = YAM_CATEGORIES.filter(c => c.section === 'upper')
  const lowerCategories = YAM_CATEGORIES.filter(c => c.section === 'lower')

  return (
    <div className="space-y-3 pt-1">
      {/* Mode Grille : Grille Croisée classique façon feuille de score papier */}
      {inputMode === 'grid' && (
        <div className="space-y-1.5">
          <div className="rounded-2xl border border-stone-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto overscroll-x-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full border-collapse text-left text-xs min-w-full">
              <thead>
                <tr className="border-b border-stone-200 dark:border-slate-800 bg-stone-50/95 dark:bg-slate-900/95 backdrop-blur-xs">
                  {/* Cellule d'en-tête supérieure gauche : bouton rond avec icône de dés & badge (?) */}
                  <th
                    scope="col"
                    className="sticky left-0 z-20 bg-stone-50 dark:bg-slate-900 p-1 w-11 sm:w-13 min-w-[42px] sm:min-w-[48px] border-r border-stone-200 dark:border-slate-800 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)] text-center"
                  >
                    <button
                      type="button"
                      onClick={() => setShowRulesMemo(true)}
                      className="w-8 h-8 rounded-full border border-stone-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#c83b3b]/50 text-[#c83b3b] dark:text-red-400 flex items-center justify-center relative mx-auto transition-all cursor-pointer shadow-2xs active:scale-95"
                      title="Mini-règles & Aide aux combinaisons"
                      aria-label="Mini-règles et aide aux combinaisons"
                    >
                      <Dices size={16} />
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#c83b3b] text-white text-[8px] font-black flex items-center justify-center shadow-xs">
                        ?
                      </span>
                    </button>
                  </th>
                  {/* Colonnes des joueurs */}
                  {game.players.map((p) => {
                    const stats = getPlayerGridScores(p.id)
                    const isReady = currentRoundCatByPlayer[p.id] != null || stats.filledTotal >= 13
                    return (
                      <th
                        key={p.id}
                        scope="col"
                        onClick={() => {
                          const session = getActiveSession()
                          const nextId = myPlayerId === p.id ? null : p.id
                          setMyPlayerIdForSession(session?.code || null, nextId, p.name)
                          setMyPlayerId(nextId)
                        }}
                        title={p.id === myPlayerId ? "Vous êtes associé à ce joueur (Cliquer pour dissocier)" : `Cliquer pour vous associer à ${p.name}`}
                        className={`px-0.5 sm:px-1 py-1.5 text-center min-w-[60px] sm:min-w-[70px] border-r last:border-r-0 border-stone-100 dark:border-slate-800/60 transition-colors cursor-pointer select-none active:scale-[0.98] group/colheader ${
                          isReady ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''
                        } ${p.id === myPlayerId ? 'bg-amber-500/5 dark:bg-amber-400/5 ring-1 ring-inset ring-emerald-500/30' : ''}`}
                      >
                        <div className="flex flex-col items-center justify-center gap-0.5 group-hover/colheader:scale-102 transition-transform">
                          <div className="relative inline-block">
                            <Avatar player={p} size={game.players.length >= 4 ? 'xs' : 'sm-compact'} />
                            {isReady && (
                              <span
                                className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 text-white flex items-center justify-center text-[8px] font-black shadow-2xs z-20 pointer-events-none"
                                title="Case choisie pour ce tour"
                              >
                                ✓
                              </span>
                            )}
                            {p.id === myPlayerId && (
                              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full text-[6.5px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-2xs ring-1 ring-white dark:ring-slate-900 pointer-events-none select-none z-10">
                                Moi
                              </span>
                            )}
                          </div>
                          <span
                            className={`font-serif-title font-bold text-[10.5px] sm:text-xs truncate block leading-tight max-w-[56px] sm:max-w-[72px] ${
                              isReady ? 'text-emerald-700 dark:text-emerald-300' : 'text-stone-900 dark:text-slate-100'
                            }`}
                          >
                            {p.name}
                          </span>
                          <span className="text-[8px] sm:text-[8.5px] font-semibold text-stone-400 dark:text-slate-500 tabular-nums">
                            {stats.filledTotal}/13
                          </span>
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100 dark:divide-slate-800/60">
                {/* 1. Section Supérieure (As à Six) : Clic sur le dé affiche la règle exacte */}
                {upperCategories.map((cat, idx) => (
                  <tr key={cat.id} className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td
                      className="sticky left-0 z-10 bg-white dark:bg-slate-900 px-0.5 py-1 border-r border-stone-200 dark:border-slate-800 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)] text-center cursor-pointer hover:bg-stone-100 dark:hover:bg-slate-800 active:scale-95 transition-all group"
                      title={`${cat.name} · ${cat.desc} (Cliquer pour voir la règle)`}
                      onClick={() => setSelectedCategoryRule(cat.id)}
                    >
                      <div className="flex items-center justify-center group-hover:scale-105 transition-transform">
                        <DiceFace value={idx + 1} size={24} />
                      </div>
                    </td>
                    {game.players.map((p) => {
                      const val = gridByPlayer[p.id]?.[cat.id]
                      const status = getCellStatus(p.id, cat.id)
                      const isCellActive = activePopover?.playerId === p.id && activePopover?.catId === cat.id
                      return (
                        <td
                          key={p.id}
                          className="p-0.5 text-center min-w-[60px] sm:min-w-[70px] border-r last:border-r-0 border-stone-100 dark:border-slate-800/60"
                        >
                          <YamCellBadge
                            value={val}
                            isActive={isCellActive}
                            disabled={status.disabled}
                            isPast={status.isPast}
                            isCurrentChoice={status.isCurrentChoice}
                            isOtherChoice={status.isOtherChoice}
                            onClick={() => handleCellClick(p.id, cat.id)}
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}

                {/* 2. Ligne SOUS-TOTAL Supérieur : Clic affiche l'explication du palier 63 */}
                <tr className="bg-stone-100/75 dark:bg-slate-800/60 font-semibold border-t-2 border-stone-200 dark:border-slate-700">
                  <td
                    className="sticky left-0 z-10 bg-stone-100 dark:bg-slate-800 px-0.5 py-1 border-r border-stone-200 dark:border-slate-800 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)] text-center cursor-pointer hover:bg-stone-200/80 dark:hover:bg-slate-700/80 active:scale-95 transition-all"
                    title="Sous-Total Supérieur (Cliquer pour voir la règle)"
                    onClick={() => setSelectedCategoryRule('upper_subtotal')}
                  >
                    <div className="flex flex-col items-center justify-center gap-0.5 py-0.5">
                      <span className="text-[8.5px] font-black text-stone-700 dark:text-slate-300 leading-none">TOT.</span>
                      <span className="text-[7.5px] font-semibold text-stone-400 dark:text-slate-500 leading-none">/63</span>
                    </div>
                  </td>
                  {game.players.map((p) => {
                    const stats = getPlayerGridScores(p.id)
                    return (
                      <td key={p.id} className="p-1 sm:p-1.5 text-center border-r last:border-r-0 border-stone-200/50 dark:border-slate-700/50">
                        <span className="font-extrabold text-[11px] sm:text-xs text-stone-800 dark:text-slate-200 tabular-nums">
                          {stats.upperSubtotal}
                        </span>
                      </td>
                    )
                  })}
                </tr>

                {/* 3. Ligne BONUS (+35 si >= 63) : Clic affiche la règle exacte pour obtenir le Bonus */}
                <tr className="bg-stone-50/60 dark:bg-slate-800/40">
                  <td
                    className="sticky left-0 z-10 bg-stone-50 dark:bg-slate-800 px-0.5 py-1 border-r border-stone-200 dark:border-slate-800 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)] text-center cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/40 active:scale-95 transition-all"
                    title="Bonus +35 points (Cliquer pour voir comment l'obtenir)"
                    onClick={() => setSelectedCategoryRule('bonus')}
                  >
                    <div className="flex flex-col items-center justify-center gap-0.5 py-0.5">
                      <span className="text-[8px] font-black text-stone-600 dark:text-slate-400 leading-none">BONUS</span>
                      <span className="text-[7.5px] font-bold text-emerald-600 dark:text-emerald-400 leading-none">+35</span>
                    </div>
                  </td>
                  {game.players.map((p) => {
                    const stats = getPlayerGridScores(p.id)
                    return (
                      <td key={p.id} className="p-1 sm:p-1.5 text-center border-r last:border-r-0 border-stone-100 dark:border-slate-800/60">
                        {stats.hasBonus ? (
                          <span className="inline-block px-1 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black text-[10.5px] sm:text-xs tabular-nums">
                            +35
                          </span>
                        ) : (
                          <span className="text-stone-400 dark:text-slate-500 text-[11px] sm:text-xs font-semibold tabular-nums">
                            0
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>

                {/* 4. Ligne TOTAL 1 : Clic affiche l'explication */}
                <tr className="bg-stone-200/60 dark:bg-slate-800/80 font-bold border-b border-stone-200 dark:border-slate-700">
                  <td
                    className="sticky left-0 z-10 bg-stone-200/90 dark:bg-slate-800 px-0.5 py-1 border-r border-stone-200 dark:border-slate-800 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)] text-center cursor-pointer hover:bg-stone-300/80 dark:hover:bg-slate-700/80 active:scale-95 transition-all"
                    title="Total 1 (Cliquer pour voir la règle)"
                    onClick={() => setSelectedCategoryRule('total1')}
                  >
                    <span className="text-[8.5px] font-black text-stone-900 dark:text-slate-100 uppercase tracking-tight">
                      T.1
                    </span>
                  </td>
                  {game.players.map((p) => {
                    const stats = getPlayerGridScores(p.id)
                    return (
                      <td key={p.id} className="p-1 sm:p-1.5 text-center border-r last:border-r-0 border-stone-200/50 dark:border-slate-700/50">
                        <span className="font-black text-[11px] sm:text-xs text-stone-900 dark:text-slate-100 tabular-nums">
                          {stats.total1}
                        </span>
                      </td>
                    )
                  })}
                </tr>

                {/* 5. Section Inférieure (Brelan à Chance) : Clic affiche la règle exacte */}
                {lowerCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td
                      className="sticky left-0 z-10 bg-white dark:bg-slate-900 px-0.5 py-1 border-r border-stone-200 dark:border-slate-800 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)] text-center cursor-pointer hover:bg-stone-100 dark:hover:bg-slate-800 active:scale-95 transition-all group"
                      title={`${cat.name} · ${cat.desc} (Cliquer pour voir la règle)`}
                      onClick={() => setSelectedCategoryRule(cat.id)}
                    >
                      <div className="flex flex-col items-center justify-center gap-0.5 py-0.5">
                        <span className="font-bold text-stone-800 dark:text-slate-200 text-[9px] sm:text-[9.5px] truncate max-w-[42px] sm:max-w-[48px] tracking-tight leading-none group-hover:text-[#c83b3b] transition-colors">
                          {cat.id === 'small_straight'
                            ? 'P.Suite'
                            : cat.id === 'large_straight'
                            ? 'G.Suite'
                            : cat.name}
                        </span>
                        {cat.fixed && (
                          <span className="text-[7.5px] font-extrabold text-stone-400 dark:text-slate-500 tabular-nums leading-none">
                            {cat.fixed}
                          </span>
                        )}
                      </div>
                    </td>
                    {game.players.map((p) => {
                      const val = gridByPlayer[p.id]?.[cat.id]
                      const status = getCellStatus(p.id, cat.id)
                      const isCellActive = activePopover?.playerId === p.id && activePopover?.catId === cat.id
                      return (
                        <td
                          key={p.id}
                          className="p-0.5 text-center min-w-[60px] sm:min-w-[70px] border-r last:border-r-0 border-stone-100 dark:border-slate-800/60"
                        >
                          <YamCellBadge
                            value={val}
                            isFixed={!!cat.fixed}
                            isActive={isCellActive}
                            disabled={status.disabled}
                            isPast={status.isPast}
                            isCurrentChoice={status.isCurrentChoice}
                            isOtherChoice={status.isOtherChoice}
                            onClick={() => handleCellClick(p.id, cat.id)}
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}

                {/* 6. Ligne TOTAL 2 : Clic affiche l'explication */}
                <tr className="bg-stone-200/60 dark:bg-slate-800/80 font-bold border-t-2 border-stone-200 dark:border-slate-700">
                  <td
                    className="sticky left-0 z-10 bg-stone-200/90 dark:bg-slate-800 px-0.5 py-1 border-r border-stone-200 dark:border-slate-800 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)] text-center cursor-pointer hover:bg-stone-300/80 dark:hover:bg-slate-700/80 active:scale-95 transition-all"
                    title="Total 2 (Cliquer pour voir la règle)"
                    onClick={() => setSelectedCategoryRule('total2')}
                  >
                    <span className="text-[8.5px] font-black text-stone-900 dark:text-slate-100 uppercase tracking-tight">
                      T.2
                    </span>
                  </td>
                  {game.players.map((p) => {
                    const stats = getPlayerGridScores(p.id)
                    return (
                      <td key={p.id} className="p-1 sm:p-1.5 text-center border-r last:border-r-0 border-stone-200/50 dark:border-slate-700/50">
                        <span className="font-black text-[11px] sm:text-xs text-stone-900 dark:text-slate-100 tabular-nums">
                          {stats.lowerSubtotal}
                        </span>
                      </td>
                    )
                  })}
                </tr>

                {/* 7. Ligne SCORE FINAL : Clic affiche l'explication du score total */}
                <tr className="bg-[#c83b3b]/10 dark:bg-[#c83b3b]/20 font-black border-t-2 border-[#c83b3b]/40">
                  <td
                    className="sticky left-0 z-10 bg-stone-100 dark:bg-slate-900 px-0.5 py-1 border-r border-[#c83b3b]/30 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)] text-center cursor-pointer hover:bg-[#c83b3b]/20 active:scale-95 transition-all"
                    title="Score Final (Cliquer pour voir la règle)"
                    onClick={() => setSelectedCategoryRule('grand_total')}
                  >
                    <div className="flex flex-col items-center justify-center gap-0.5 text-[#c83b3b] dark:text-red-400">
                      <Trophy size={12} className="shrink-0" />
                      <span className="text-[8px] font-black uppercase tracking-tight">
                        SCORE
                      </span>
                    </div>
                  </td>
                  {game.players.map((p) => {
                    const stats = getPlayerGridScores(p.id)
                    return (
                      <td key={p.id} className="p-1 sm:p-1.5 text-center border-r last:border-r-0 border-[#c83b3b]/20">
                        <span className="font-black text-xs sm:text-sm text-[#c83b3b] dark:text-red-400 tabular-nums">
                          {stats.grandTotal}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Résumé de manche & règle officielle */}
        <div className="flex items-center justify-between px-1.5 text-[11px] text-stone-500 dark:text-slate-400 font-medium">
          <span className="flex items-center gap-1">
            <span className="font-bold text-stone-800 dark:text-slate-200">
              Tour {currentRoundNumber}/13
            </span>
            <span>· 1 case par joueur</span>
          </span>
          <span className={`font-bold tabular-nums ${allPlayersReady ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#c83b3b] dark:text-red-400'}`}>
            {readyPlayersCount}/{game.players.length} joueur{game.players.length > 1 ? 's' : ''} prêt{readyPlayersCount > 1 ? 's' : ''}
          </span>
        </div>
      </div>
      )}

      {/* Mode Direct : Saisie simplifiée des totaux par manche */}
      {inputMode === 'direct' && (
        <div className="space-y-3">
          {game.players.map((p) => (
            <div
              key={p.id}
              className="p-3 sm:p-3.5 rounded-2xl school-card border border-stone-200/90 dark:border-slate-800 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar player={p} size="sm" />
                <div className="min-w-0">
                  <span className="font-serif-title font-bold text-sm text-stone-900 dark:text-slate-100 truncate block">
                    {p.name}
                  </span>
                  <span className="text-[10px] text-stone-400 dark:text-slate-500">
                    Score actuel : {game.scores?.[p.id] || 0} pts
                  </span>
                </div>
              </div>

              <QuickScoreBadge
                value={directDelta[p.id] || 0}
                onChange={(v) => setDirectDelta(prev => ({ ...prev, [p.id]: Math.max(0, Number(v) || 0) }))}
                onOpenPad={() => setPadTarget({ playerId: p.id, catId: null })}
                min={0}
                max={50}
                step={1}
                showPlus={true}
              />
            </div>
          ))}
        </div>
      )}

      {/* Bouton de validation principale (flottant bas d'écran) */}
      <FloatingValidationBar>
        <button
          type="button"
          onClick={handleValidate}
          disabled={!canValidate || isSubmitting}
          className={`w-full py-3.5 rounded-xl font-bold text-base text-white shadow-md transition-all flex items-center justify-center gap-2 select-none ${
            isSubmitting
              ? 'bg-[#c83b3b]/70 dark:bg-[#c83b3b]/60 cursor-wait opacity-80'
              : canValidate
              ? 'bg-[#c83b3b] hover:bg-[#b03030] cursor-pointer active:scale-[0.99]'
              : 'bg-stone-300 dark:bg-slate-700 text-stone-500 dark:text-slate-400 cursor-not-allowed opacity-60'
          }`}
        >
          <Trophy size={18} />
          <span>
            {isSubmitting
              ? 'Validation en cours...'
              : inputMode === 'grid'
              ? allPlayersReady
                ? `Valider le tour ${currentRoundNumber} (${readyPlayersCount}/${game.players.length})`
                : `En attente des joueurs (${readyPlayersCount}/${game.players.length} prêt${readyPlayersCount > 1 ? 's' : ''})`
              : 'Valider les scores'}
          </span>
        </button>
        {!canValidate && inputMode === 'direct' && (
          <p className="text-[11px] text-stone-400 dark:text-slate-500 text-center mt-1.5 font-medium">
            Saisissez au moins un score pour valider la manche
          </p>
        )}
      </FloatingValidationBar>

      {/* Dialog Mémo des combinaisons officielles */}
      <Dialog
        open={showRulesMemo}
        onClose={() => setShowRulesMemo(false)}
        title="Combinaisons"
      >
        <div className="space-y-3 text-xs text-stone-600 dark:text-slate-300">
          <p className="leading-relaxed font-semibold text-stone-900 dark:text-slate-100">
            Grille officielle en 13 cases :
          </p>

          <ul className="space-y-1.5 pl-3 list-disc text-[11px] leading-relaxed">
            <li>
              <strong>Cases 1 à 6 :</strong> Somme des dés du chiffre choisi (les autres dés sont ignorés).
            </li>
            <li>
              <strong>Bonus +35 pts :</strong> Accordé si le total des cases 1 à 6 atteint <strong>au moins 63 pts</strong> (soit en moyenne 3 dés de chaque chiffre).
            </li>
            <li>
              <strong>Brelan :</strong> Au moins 3 dés identiques ➔ <strong>Somme des 5 dés du lancer</strong> (ex. 4-4-4-2-6 = 20 pts).
            </li>
            <li>
              <strong>Carré :</strong> Au moins 4 dés identiques ➔ <strong>Somme des 5 dés du lancer</strong> (ex. 5-5-5-5-3 = 23 pts).
            </li>
            <li>
              <strong>Full :</strong> 3 dés d'une valeur + 2 dés d'une autre valeur ➔ <strong>25 points fixes</strong>.
            </li>
            <li>
              <strong>Petite Suite :</strong> 4 dés consécutifs (1-2-3-4, 2-3-4-5 ou 3-4-5-6) ➔ <strong>30 points fixes</strong>.
            </li>
            <li>
              <strong>Grande Suite :</strong> 5 dés consécutifs (1-2-3-4-5 ou 2-3-4-5-6) ➔ <strong>40 points fixes</strong>.
            </li>
            <li>
              <strong>Yam's :</strong> 5 dés identiques ➔ <strong>50 points fixes</strong>.
            </li>
            <li>
              <strong>Chance :</strong> Somme de n'importe quel lancer ➔ <strong>Somme des 5 dés</strong>.
            </li>
          </ul>

          <p className="text-[10px] text-stone-400 dark:text-slate-500 italic">
            Astuce : Vous pouvez aussi toucher n'importe quelle case de la colonne de gauche sur la feuille de score pour consulter sa règle détaillée.
          </p>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowRulesMemo(false)}
              className="w-full py-2.5 rounded-xl font-bold text-xs btn-margin-red text-white cursor-pointer"
            >
              Compris
            </button>
          </div>
        </div>
      </Dialog>

      {/* Dialog d'explication détaillée d'une case (clic sur la colonne de gauche) */}
      <Dialog
        open={Boolean(selectedCategoryRule)}
        onClose={() => setSelectedCategoryRule(null)}
        title={selectedCategoryRule ? YAM_RULES_EXPLANATIONS[selectedCategoryRule]?.title || 'Règle' : 'Règle'}
      >
        {selectedCategoryRule && (() => {
          const rule = YAM_RULES_EXPLANATIONS[selectedCategoryRule]
          if (!rule) return null
          return (
            <div className="space-y-2.5 text-xs text-stone-700 dark:text-slate-200">
              {/* Badge d'en-tête */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 border border-stone-200/80 dark:border-slate-700/60">
                  {rule.subtitle}
                </span>
                {rule.points && (
                  <span className="font-extrabold text-[11px] text-[#c83b3b] dark:text-red-400">
                    {rule.points}
                  </span>
                )}
              </div>

              {/* Condition requise */}
              {rule.condition && (
                <div className="p-2.5 rounded-xl bg-stone-100/90 dark:bg-slate-800/70 border border-stone-200/80 dark:border-slate-700/60 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 block">
                    Condition requise
                  </span>
                  <p className="font-bold text-stone-900 dark:text-slate-100 text-[12px] leading-snug">
                    {rule.condition}
                  </p>
                </div>
              )}

              {/* Calcul des points */}
              {rule.calc && (
                <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-slate-800/40 border border-stone-200/60 dark:border-slate-700/50 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 block">
                    Calcul des points
                  </span>
                  <p className="text-[11.5px] leading-relaxed text-stone-800 dark:text-slate-200">
                    {rule.calc}
                  </p>
                </div>
              )}

              {/* Exemple concret */}
              {rule.example && (
                <div className="p-2.5 rounded-xl bg-stone-100/70 dark:bg-slate-900/60 border border-stone-200/60 dark:border-slate-800 text-[11px] space-y-0.5">
                  <span className="font-semibold text-stone-400 dark:text-slate-500 block text-[10px] uppercase tracking-wider">
                    Exemple
                  </span>
                  <p className="font-medium text-stone-800 dark:text-slate-200 leading-snug">
                    {rule.example}
                  </p>
                </div>
              )}

              {/* Remarque ou astuce à retenir */}
              {rule.tip && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-[11px] text-amber-900 dark:text-amber-200 font-medium leading-snug">
                  <strong className="block text-[10px] uppercase tracking-wider text-amber-800 dark:text-amber-300 font-bold mb-0.5">
                    À retenir
                  </strong>
                  {rule.tip}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryRule(null)}
                  className="w-full py-2.5 rounded-xl font-bold text-xs btn-margin-red text-white cursor-pointer"
                >
                  Compris
                </button>
              </div>
            </div>
          )
        })()}
      </Dialog>

      {/* Popover rectangulaire centré au milieu de l'écran pour la case sélectionnée */}
      {activePopover && (() => {
        const p = game.players.find(pl => pl.id === activePopover.playerId)
        const cat = YAM_CATEGORIES.find(c => c.id === activePopover.catId)
        const val = p && cat ? gridByPlayer[p.id]?.[cat.id] : null
        return (
          <YamCellPopover
            player={p}
            category={cat}
            currentValue={val}
            onSelect={(v) => handleCategoryValueChange(p.id, cat.id, v)}
            onClear={() => handleClearCategory(p.id, cat.id)}
            onClose={() => setActivePopover(null)}
          />
        )
      })()}
    </div>
  )
}
