import { useState, useMemo, useRef } from 'react'
import { Trophy, Dices, Check, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { Avatar } from '../ui/Avatar'
import { QuickScoreBadge } from '../ui/QuickScoreBadge'
import { BottomSheet } from '../ui/BottomSheet'
import { ScorePad } from '../ui/ScorePad'
import { Dialog } from '../ui/Dialog'

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

// Composant tactile direct pour combinaisons à score fixe (Full, Suites, Yam's)
// Supporte à la fois le clic direct (cycle rapide) ET le swipe vertical (glissement haut/bas)
function FixedScoreBadge({
  value,
  fixedScore,
  onChange,
  disabled = false,
  isPast = false,
  isCurrentChoice = false,
  className = '',
}) {
  const [isDragging, setIsDragging] = useState(false)
  const dragStartXRef = useRef(0)
  const dragStartYRef = useRef(0)
  const dragStartValueRef = useRef(value)
  const currentValueRef = useRef(value)
  const hasMovedRef = useRef(false)
  const isDraggingRef = useRef(false)
  const isGestureDecidedRef = useRef(false)
  const isHorizontalScrollRef = useRef(false)

  const states = [0, null, fixedScore]

  const handlePointerDown = (e) => {
    if (disabled) return
    dragStartXRef.current = e.clientX
    dragStartYRef.current = e.clientY
    dragStartValueRef.current = value
    currentValueRef.current = value
    hasMovedRef.current = false
    isGestureDecidedRef.current = false
    isHorizontalScrollRef.current = false
    isDraggingRef.current = false
  }

  const handlePointerMove = (e) => {
    if (disabled || isHorizontalScrollRef.current) return

    const deltaX = e.clientX - dragStartXRef.current
    const totalDeltaY = dragStartYRef.current - e.clientY // Vers le haut = augmentation

    if (!isGestureDecidedRef.current) {
      const absX = Math.abs(deltaX)
      const absY = Math.abs(totalDeltaY)

      if (absX < 6 && absY < 6) return

      isGestureDecidedRef.current = true

      // Si le geste part plus horizontalement, laisser le tableau défiler
      if (absX > absY) {
        isHorizontalScrollRef.current = true
        isDraggingRef.current = false
        setIsDragging(false)
        return
      }

      // Prise en charge tactile verticale
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {}
      isDraggingRef.current = true
      setIsDragging(true)
      hasMovedRef.current = true
      try { navigator.vibrate?.(10) } catch {}
    }

    if (!isDraggingRef.current) return
    hasMovedRef.current = true

    // Calcul de l'état cible dans [0, null, fixedScore] :
    // Vers le haut (totalDeltaY > 0) -> score validé (fixedScore)
    // Au centre (totalDeltaY ≈ 0) -> sans score (null / "—")
    // Vers le bas (totalDeltaY < 0) -> zéro (0 barré)
    const startIndex = states.indexOf(dragStartValueRef.current)
    const safeIndex = startIndex !== -1 ? startIndex : 1
    const indexSteps = Math.round(totalDeltaY / 24)
    const targetIndex = Math.max(0, Math.min(states.length - 1, safeIndex + indexSteps))
    const nextVal = states[targetIndex]

    if (nextVal !== currentValueRef.current) {
      currentValueRef.current = nextVal
      onChange(nextVal)
      try { navigator.vibrate?.(10) } catch {}
    }
  }

  const handlePointerUp = (e) => {
    const wasDragging = isDraggingRef.current
    const wasHorizontal = isHorizontalScrollRef.current
    const hasMoved = hasMovedRef.current

    isDraggingRef.current = false
    setIsDragging(false)
    isGestureDecidedRef.current = false
    isHorizontalScrollRef.current = false

    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}

    if (wasDragging && hasMoved) {
      try { navigator.vibrate?.(15) } catch {}
    } else if (!wasHorizontal && !hasMoved) {
      // Tap sans glisser : cycle direct null ➔ fixedScore ➔ 0 ➔ null
      try { navigator.vibrate?.(12) } catch {}
      if (value == null) {
        onChange(fixedScore)
      } else if (value === fixedScore) {
        onChange(0)
      } else {
        onChange(null)
      }
    }
  }

  const handlePointerCancel = (e) => {
    isDraggingRef.current = false
    setIsDragging(false)
    isGestureDecidedRef.current = false
    isHorizontalScrollRef.current = false
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}
  }

  const cur = isDragging ? currentValueRef.current : value
  const isValidated = cur === fixedScore
  const isZero = cur === 0
  const isUnset = cur == null

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      style={{ touchAction: disabled ? 'auto' : 'pan-x' }}
      title={
        disabled
          ? isPast
            ? isValidated
              ? `${fixedScore} pts validés`
              : 'Case barrée (0 pt)'
            : 'Une seule case autorisée par manche'
          : isUnset
          ? `Cliquer ou glisser vers le haut (${fixedScore} pts) ou vers le bas (0 pt)`
          : isValidated
          ? `Validé (${fixedScore} pts). Glisser vers le bas pour — ou 0`
          : 'Barré (0 pt). Glisser vers le haut pour — ou valider'
      }
      className={`group relative border transition-all select-none w-full min-w-0 h-7.5 sm:h-8 px-1 sm:px-1.5 py-0.5 rounded-lg flex items-center justify-center gap-1 ${
        disabled
          ? isPast
            ? isValidated
              ? 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-extrabold cursor-default opacity-90'
              : 'bg-stone-100/70 dark:bg-slate-800/60 border-stone-200/60 text-stone-400 dark:text-slate-500 font-bold cursor-default opacity-85'
            : 'bg-stone-50/50 dark:bg-slate-900/40 border-stone-200/40 text-stone-300 dark:text-slate-600 opacity-35 cursor-not-allowed'
          : isDragging
          ? isValidated
            ? 'scale-105 border-emerald-500 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/50 shadow-md z-30 cursor-ns-resize'
            : isZero
            ? 'scale-105 border-stone-400 bg-stone-200/70 dark:bg-slate-800 text-stone-600 dark:text-slate-300 ring-2 ring-[#c83b3b]/50 shadow-md z-30 cursor-ns-resize'
            : 'scale-105 border-stone-300 bg-stone-100/70 dark:bg-slate-800/60 text-stone-400 ring-2 ring-stone-300/50 shadow-md z-30 cursor-ns-resize'
          : isCurrentChoice
          ? isValidated
            ? 'bg-emerald-500/15 dark:bg-emerald-500/25 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/60 shadow-xs cursor-pointer'
            : isZero
            ? 'bg-stone-200/60 dark:bg-slate-800 border-stone-400 text-stone-600 dark:text-slate-300 ring-2 ring-[#c83b3b]/60 shadow-xs cursor-pointer'
            : 'bg-white dark:bg-slate-900 border-stone-200 ring-2 ring-[#c83b3b]/60 shadow-xs cursor-pointer'
          : isValidated
          ? 'bg-emerald-500/12 dark:bg-emerald-500/20 border-emerald-500/50 text-emerald-700 dark:text-emerald-300 hover:border-emerald-500 shadow-2xs cursor-pointer'
          : isZero
          ? 'bg-stone-100 dark:bg-slate-800/80 border-stone-300 dark:border-slate-700 text-stone-500 dark:text-slate-400 hover:border-stone-400 shadow-2xs cursor-pointer'
          : 'bg-white/80 dark:bg-slate-900/80 border-stone-200 dark:border-slate-800 text-stone-400 dark:text-slate-500 hover:border-emerald-500/60 hover:text-emerald-600 shadow-2xs cursor-pointer'
      } ${className}`}
    >
      {isValidated && (
        <>
          <Check size={11} strokeWidth={3} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-black text-emerald-700 dark:text-emerald-300 tabular-nums leading-none">
            {fixedScore}
          </span>
        </>
      )}

      {isZero && (
        <span className="text-xs sm:text-sm font-bold line-through decoration-red-500 decoration-2 text-stone-400 dark:text-slate-500 tabular-nums leading-none">
          0
        </span>
      )}

      {isUnset && (
        <span className="text-xs sm:text-sm font-bold text-stone-300 dark:text-slate-600 tabular-nums leading-none">
          —
        </span>
      )}
    </div>
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

export function YamEngine({ game, onFinish }) {
  const { updateScores } = useGame()

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

  // Cible d'édition dans le BottomSheet ScorePad : { playerId, catId }
  const [padTarget, setPadTarget] = useState(null)
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
    const isBlocked = !isPast && !isCurrentChoice && chosenCatId != null
    return {
      isPast,
      isCurrentChoice,
      isBlocked,
      disabled: isPast || isBlocked,
    }
  }

  const currentRoundNumber = Math.min(13, (game.rounds?.length || 0) + 1)

  // Condition de validation : au moins une nouvelle case saisie/barrée en mode grille, ou au moins un score > 0 en mode direct
  const canValidate = useMemo(() => {
    if (inputMode === 'grid') {
      return newlyFilledCount > 0
    }
    return game.players.some(p => (directDelta[p.id] || 0) > 0)
  }, [inputMode, newlyFilledCount, directDelta, game.players])

  // Navigation dans le ScorePad
  const activePlayer = padTarget ? game.players.find(p => p.id === padTarget.playerId) : null
  const activePlayerIndex = activePlayer ? game.players.findIndex(p => p.id === activePlayer.id) : -1
  const activeCatIndex = padTarget?.catId ? YAM_CATEGORIES.findIndex(c => c.id === padTarget.catId) : -1

  const handlePadNext = () => {
    if (!padTarget) return
    if (inputMode === 'grid') {
      if (activeCatIndex < YAM_CATEGORIES.length - 1) {
        setPadTarget({ playerId: padTarget.playerId, catId: YAM_CATEGORIES[activeCatIndex + 1].id })
      } else if (activePlayerIndex < game.players.length - 1) {
        setPadTarget({ playerId: game.players[activePlayerIndex + 1].id, catId: YAM_CATEGORIES[0].id })
      } else {
        setPadTarget(null)
      }
    } else {
      if (activePlayerIndex < game.players.length - 1) {
        setPadTarget({ playerId: game.players[activePlayerIndex + 1].id, catId: null })
      } else {
        setPadTarget(null)
      }
    }
  }

  const handlePadPrev = () => {
    if (!padTarget) return
    if (inputMode === 'grid') {
      if (activeCatIndex > 0) {
        setPadTarget({ playerId: padTarget.playerId, catId: YAM_CATEGORIES[activeCatIndex - 1].id })
      } else if (activePlayerIndex > 0) {
        const prevP = game.players[activePlayerIndex - 1]
        setPadTarget({ playerId: prevP.id, catId: YAM_CATEGORIES[YAM_CATEGORIES.length - 1].id })
      }
    } else if (activePlayerIndex > 0) {
      const prevP = game.players[activePlayerIndex - 1]
      setPadTarget({ playerId: prevP.id, catId: null })
    }
  }

  const handleCategoryValueChange = (playerId, catId, value) => {
    setGridByPlayer(prev => {
      const current = prev[playerId] ? { ...prev[playerId] } : {}
      if (value === null || value === undefined) {
        delete current[catId]
      } else {
        current[catId] = Math.max(0, Number(value) || 0)
      }
      return { ...prev, [playerId]: current }
    })
  }

  const handleClearCategory = (playerId, catId) => {
    setGridByPlayer(prev => {
      const current = { ...(prev[playerId] || {}) }
      delete current[catId]
      return { ...prev, [playerId]: current }
    })
  }

  const handleValidate = () => {
    if (!canValidate) return
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

    updateScores({
      scores: newScores,
      delta,
      gridByPlayer,
      inputMode,
      type: 'yam',
    })

    if (allFinished && winnerId) {
      setTimeout(() => {
        onFinish?.(winnerId)
      }, 150)
    }
  }

  const activeCategory = padTarget?.catId ? YAM_CATEGORIES.find(c => c.id === padTarget.catId) : null
  const currentCategoryValue = activePlayer && activeCategory ? gridByPlayer[activePlayer.id]?.[activeCategory.id] : null

  const upperCategories = YAM_CATEGORIES.filter(c => c.section === 'upper')
  const lowerCategories = YAM_CATEGORIES.filter(c => c.section === 'lower')

  return (
    <div className="space-y-3 pb-8">
      {/* Mode Grille : Grille Croisée classique façon feuille de score papier */}
      {inputMode === 'grid' && (
        <div className="space-y-1.5">
          <div className="rounded-2xl border border-stone-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto overscroll-x-contain touch-pan-x">
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
                    return (
                      <th
                        key={p.id}
                        scope="col"
                        className="px-0.5 sm:px-1 py-1.5 text-center min-w-[60px] sm:min-w-[70px] border-r last:border-r-0 border-stone-100 dark:border-slate-800/60"
                      >
                        <div className="flex flex-col items-center justify-center gap-0.5">
                          <Avatar player={p} size={game.players.length >= 4 ? 'xs' : 'sm-compact'} />
                          <span className="font-serif-title font-bold text-[10.5px] sm:text-xs text-stone-900 dark:text-slate-100 truncate max-w-[54px] sm:max-w-[68px] block leading-tight">
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
                {/* 1. Section Supérieure (As à Six) : Juste les icônes de dés nettes, sans titres textuels */}
                {upperCategories.map((cat, idx) => (
                  <tr key={cat.id} className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td
                      className="sticky left-0 z-10 bg-white dark:bg-slate-900 px-0.5 py-1 border-r border-stone-200 dark:border-slate-800 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)] text-center"
                      title={`${cat.name} · ${cat.desc}`}
                    >
                      <div className="flex items-center justify-center">
                        <DiceFace value={idx + 1} size={24} />
                      </div>
                    </td>
                    {game.players.map((p) => {
                      const val = gridByPlayer[p.id]?.[cat.id]
                      const status = getCellStatus(p.id, cat.id)
                      return (
                        <td
                          key={p.id}
                          className="p-0.5 text-center min-w-[60px] sm:min-w-[70px] border-r last:border-r-0 border-stone-100 dark:border-slate-800/60"
                        >
                          <QuickScoreBadge
                            value={val}
                            onChange={(v) => handleCategoryValueChange(p.id, cat.id, v)}
                            onOpenPad={() => setPadTarget({ playerId: p.id, catId: cat.id })}
                            values={cat.presets}
                            min={0}
                            max={cat.max}
                            step={1}
                            compact={true}
                            allowClear={true}
                            disabled={status.disabled}
                            isPast={status.isPast}
                            isCurrentChoice={status.isCurrentChoice}
                            formatDisplay={(v) => (v != null ? `${v}` : '—')}
                            showPlus={false}
                            className="w-full"
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}

                {/* 2. Ligne SOUS-TOTAL Supérieur */}
                <tr className="bg-stone-100/75 dark:bg-slate-800/60 font-semibold border-t-2 border-stone-200 dark:border-slate-700">
                  <td className="sticky left-0 z-10 bg-stone-100 dark:bg-slate-800 px-0.5 py-1 border-r border-stone-200 dark:border-slate-800 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)] text-center">
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

                {/* 3. Ligne BONUS (+35 si >= 63) */}
                <tr className="bg-stone-50/60 dark:bg-slate-800/40">
                  <td className="sticky left-0 z-10 bg-stone-50 dark:bg-slate-800 px-0.5 py-1 border-r border-stone-200 dark:border-slate-800 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)] text-center">
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

                {/* 4. Ligne TOTAL 1 */}
                <tr className="bg-stone-200/60 dark:bg-slate-800/80 font-bold border-b border-stone-200 dark:border-slate-700">
                  <td className="sticky left-0 z-10 bg-stone-200/90 dark:bg-slate-800 px-0.5 py-1 border-r border-stone-200 dark:border-slate-800 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)] text-center">
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

                {/* 5. Section Inférieure (Brelan à Chance) */}
                {lowerCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-stone-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td
                      className="sticky left-0 z-10 bg-white dark:bg-slate-900 px-0.5 py-1 border-r border-stone-200 dark:border-slate-800 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)] text-center"
                      title={`${cat.name} · ${cat.desc}`}
                    >
                      <div className="flex flex-col items-center justify-center gap-0.5 py-0.5">
                        <span className="font-bold text-stone-800 dark:text-slate-200 text-[9px] sm:text-[9.5px] truncate max-w-[42px] sm:max-w-[48px] tracking-tight leading-none">
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
                      return (
                        <td
                          key={p.id}
                          className="p-0.5 text-center min-w-[60px] sm:min-w-[70px] border-r last:border-r-0 border-stone-100 dark:border-slate-800/60"
                        >
                          {cat.fixed ? (
                            <FixedScoreBadge
                              value={val}
                              fixedScore={cat.fixed}
                              onChange={(v) => handleCategoryValueChange(p.id, cat.id, v)}
                              disabled={status.disabled}
                              isPast={status.isPast}
                              isCurrentChoice={status.isCurrentChoice}
                            />
                          ) : (
                            <QuickScoreBadge
                              value={val}
                              onChange={(v) => handleCategoryValueChange(p.id, cat.id, v)}
                              onOpenPad={() => setPadTarget({ playerId: p.id, catId: cat.id })}
                              min={0}
                              max={cat.max}
                              step={1}
                              compact={true}
                              allowClear={true}
                              disabled={status.disabled}
                              isPast={status.isPast}
                              isCurrentChoice={status.isCurrentChoice}
                              formatDisplay={(v) => (v != null ? `${v}` : '—')}
                              showPlus={false}
                              className="w-full"
                            />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}

                {/* 6. Ligne TOTAL 2 */}
                <tr className="bg-stone-200/60 dark:bg-slate-800/80 font-bold border-t-2 border-stone-200 dark:border-slate-700">
                  <td className="sticky left-0 z-10 bg-stone-200/90 dark:bg-slate-800 px-0.5 py-1 border-r border-stone-200 dark:border-slate-800 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)] text-center">
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

                {/* 7. Ligne SCORE FINAL */}
                <tr className="bg-[#c83b3b]/10 dark:bg-[#c83b3b]/20 font-black border-t-2 border-[#c83b3b]/40">
                  <td className="sticky left-0 z-10 bg-stone-100 dark:bg-slate-900 px-0.5 py-1 border-r border-[#c83b3b]/30 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)] text-center">
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
          <span className="font-bold text-[#c83b3b] dark:text-red-400 tabular-nums">
            {newlyFilledCount}/{game.players.length} joueur{game.players.length > 1 ? 's' : ''} prêt{newlyFilledCount > 1 ? 's' : ''}
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

      {/* Bouton de validation principale */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleValidate}
          disabled={!canValidate}
          className={`w-full py-3 rounded-xl font-bold text-sm text-white shadow-sm transition-all flex items-center justify-center gap-2 select-none ${
            canValidate
              ? 'bg-[#c83b3b] hover:bg-[#b03030] cursor-pointer active:scale-[0.99]'
              : 'bg-stone-300 dark:bg-slate-700 text-stone-500 dark:text-slate-400 cursor-not-allowed opacity-60'
          }`}
        >
          <Trophy size={16} />
          <span>
            {inputMode === 'grid'
              ? newlyFilledCount >= game.players.length
                ? `Valider le tour ${currentRoundNumber} (${newlyFilledCount}/${game.players.length})`
                : `Valider la manche (${newlyFilledCount}/${game.players.length} prêt${newlyFilledCount > 1 ? 's' : ''})`
              : 'Valider les scores'}
          </span>
        </button>
        {!canValidate && (
          <p className="text-[11px] text-stone-400 dark:text-slate-500 text-center mt-1.5 font-medium">
            {inputMode === 'grid'
              ? 'Chaque joueur choisit 1 case par manche (points ou barrer avec 0)'
              : 'Saisissez au moins un score pour valider la manche'}
          </p>
        )}
      </div>

      {/* Dialog Mémo des combinaisons officielles */}
      <Dialog
        open={showRulesMemo}
        onClose={() => setShowRulesMemo(false)}
        title="Combinaisons"
      >
        <div className="space-y-2 text-xs text-stone-600 dark:text-slate-300">
          <p className="leading-relaxed font-semibold">
            Grille officielle en 13 cases :
          </p>
          <ul className="space-y-1 pl-3 list-disc text-[11px]">
            <li><strong>Cases 1 à 6 :</strong> Somme des dés du chiffre choisi. Si total &ge; 63 pts ➔ +35 pts de Bonus !</li>
            <li><strong>Brelan / Carré :</strong> 3 ou 4 dés identiques ➔ Somme des 5 dés.</li>
            <li><strong>Full :</strong> 3 dés + 2 dés ➔ 25 points fixes.</li>
            <li><strong>Petite Suite :</strong> 4 dés consécutifs ➔ 30 points fixes.</li>
            <li><strong>Grande Suite :</strong> 5 dés consécutifs ➔ 40 points fixes.</li>
            <li><strong>Yam's :</strong> 5 dés identiques ➔ 50 points fixes.</li>
            <li><strong>Chance :</strong> Somme des 5 dés.</li>
          </ul>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowRulesMemo(false)}
              className="w-full py-2 rounded-xl font-bold text-xs btn-margin-red text-white cursor-pointer"
            >
              Compris
            </button>
          </div>
        </div>
      </Dialog>

      {/* BottomSheet tactile pour saisie ergonomique sur mobile */}
      <BottomSheet open={!!padTarget} onClose={() => setPadTarget(null)}>
        {activePlayer && (
          <div className="px-4 pt-1 pb-6 space-y-3">
            {/* En-tête du BottomSheet avec informations du joueur et de la combinaison */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-stone-100/80 dark:bg-slate-800/60 border border-stone-200/80 dark:border-slate-700/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar player={activePlayer} size="sm" />
                <div className="min-w-0">
                  <span className="font-serif-title font-bold text-sm text-stone-900 dark:text-slate-100 truncate block">
                    {activePlayer.name}
                  </span>
                  <span className="text-[10px] text-stone-500 dark:text-slate-400 block truncate">
                    {activeCategory ? `${activeCategory.name} · ${activeCategory.desc}` : 'Saisie du score de manche'}
                  </span>
                </div>
              </div>

              {/* Navigation des joueurs / catégories */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handlePadPrev}
                  className="p-1.5 rounded-lg border border-stone-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 cursor-pointer text-stone-600 dark:text-slate-300"
                  title="Précédent"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={handlePadNext}
                  className="p-1.5 rounded-lg border border-stone-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 cursor-pointer text-stone-600 dark:text-slate-300"
                  title="Suivant"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Interface de saisie tactile adaptée à la combinaison */}
            {activeCategory?.fixed ? (
              <div className="space-y-4 pt-1">
                <div className="p-3 rounded-2xl bg-stone-50 dark:bg-slate-800/40 border border-stone-200/60 dark:border-slate-700/60 text-center">
                  <span className="text-xs uppercase tracking-wider font-bold text-stone-400 dark:text-slate-500 block mb-1">
                    Valeur choisie
                  </span>
                  <span className="text-3xl font-black text-stone-900 dark:text-slate-100 tabular-nums">
                    {currentCategoryValue != null
                      ? currentCategoryValue === 0
                        ? '0 (Barré)'
                        : `${currentCategoryValue} points`
                      : '— (À choisir)'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleCategoryValueChange(activePlayer.id, activeCategory.id, activeCategory.fixed)
                      try { navigator.vibrate?.(12) } catch {}
                    }}
                    className={`p-3 rounded-2xl border-2 font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-1 active:scale-95 ${
                      currentCategoryValue === activeCategory.fixed
                        ? 'bg-[#c83b3b] text-white border-[#c83b3b] shadow-md'
                        : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-700 text-stone-800 dark:text-slate-200 hover:border-[#c83b3b]/60'
                    }`}
                  >
                    <span className="text-xl sm:text-2xl">{activeCategory.fixed} pts</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">
                      Réussi
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleCategoryValueChange(activePlayer.id, activeCategory.id, 0)
                      try { navigator.vibrate?.(12) } catch {}
                    }}
                    className={`p-3 rounded-2xl border-2 font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-1 active:scale-95 ${
                      currentCategoryValue === 0
                        ? 'bg-stone-800 dark:bg-stone-700 text-white border-stone-800 dark:border-stone-600 shadow-md'
                        : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-700 text-stone-500 dark:text-slate-400 hover:border-red-400'
                    }`}
                  >
                    <span className="text-xl sm:text-2xl line-through decoration-red-500 decoration-2">0 pt</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">
                      Barrer
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleClearCategory(activePlayer.id, activeCategory.id)
                      try { navigator.vibrate?.(12) } catch {}
                    }}
                    className={`p-3 rounded-2xl border-2 font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-1 active:scale-95 ${
                      currentCategoryValue == null
                        ? 'bg-stone-800 dark:bg-stone-700 text-white border-stone-800 dark:border-stone-600 shadow-md'
                        : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-700 text-stone-400 dark:text-slate-500 hover:border-stone-400'
                    }`}
                  >
                    <span className="text-xl sm:text-2xl">—</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">
                      Sans score
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setPadTarget(null)}
                  className="w-full py-3.5 px-3 rounded-xl font-bold text-base btn-margin-red shadow-sm active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center text-center mt-2"
                >
                  Valider la case
                </button>
              </div>
            ) : (
              <div>
                <ScorePad
                  value={
                    activeCategory
                      ? (gridByPlayer[activePlayer.id]?.[activeCategory.id] ?? null)
                      : (directDelta[activePlayer.id] || 0)
                  }
                  onChange={(val) => {
                    if (activeCategory) {
                      handleCategoryValueChange(activePlayer.id, activeCategory.id, val)
                    } else {
                      setDirectDelta(prev => ({ ...prev, [activePlayer.id]: Math.max(0, Number(val) || 0) }))
                    }
                  }}
                  onConfirm={() => setPadTarget(null)}
                  confirmLabel="Valider la case"
                  label={activeCategory ? activeCategory.name : 'Score de la manche'}
                  subLabel={activeCategory ? activeCategory.desc : 'Total des points'}
                  min={0}
                  max={activeCategory ? activeCategory.max : 50}
                  step={1}
                  presets={activeCategory ? activeCategory.presets : [0, 5, 10, 15, 20, 25, 30, 35, 40, 50]}
                  customButtons={[]}
                  baseScore={0}
                  formatTotal={(val) => (val == null ? 'Sans score' : `${val} point${val > 1 ? 's' : ''}`)}
                  showPlus={false}
                  allowNull={true}
                  nullLabel="—"
                  nullText="Sans score"
                />
              </div>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
