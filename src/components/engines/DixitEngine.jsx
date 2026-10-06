import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Trophy,
  VenetianMask,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  HelpCircle,
  ArrowLeftRight,
  GripVertical
} from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { Avatar } from '../ui/Avatar'
import { QuickScoreBadge } from '../ui/QuickScoreBadge'
import { BottomSheet } from '../ui/BottomSheet'
import { ScorePad } from '../ui/ScorePad'
import { Dialog } from '../ui/Dialog'

/**
 * Feuille de réglage tactile de l'ordre du tour pour Dixit :
 * - Définit qui commence la partie (1er conteur) et l'ordre des conteurs suivants
 * - Drag & drop fluide à 60fps avec translation continue au doigt et à la souris
 * - Boutons flèches chevron pour monter/descendre en un clic
 * - Retour haptique lors du changement de position
 */
function DixitOrderSheet({ open, onClose, players, onReorder, currentStorytellerId, roundNum }) {
  const [localPlayers, setLocalPlayers] = useState(players)
  const [draggingIndex, setDraggingIndex] = useState(null)
  const [overIndex, setOverIndex] = useState(null)
  const [dragOffsetY, setDragOffsetY] = useState(0)
  const [isDropping, setIsDropping] = useState(false)

  const cardRefs = useRef([])
  const startYRef = useRef(0)
  const lastOverIndexRef = useRef(null)
  const itemHeightRef = useRef(62)
  const isDraggingRef = useRef(false)
  const dropTimeoutRef = useRef(null)

  useEffect(() => {
    setLocalPlayers(players)
  }, [players, open])

  useEffect(() => {
    return () => {
      isDraggingRef.current = false
      if (dropTimeoutRef.current) clearTimeout(dropTimeoutRef.current)
    }
  }, [])

  const measureItemHeight = () => {
    if (cardRefs.current[0] && cardRefs.current[1]) {
      const r0 = cardRefs.current[0].getBoundingClientRect()
      const r1 = cardRefs.current[1].getBoundingClientRect()
      const diff = r1.top - r0.top
      if (diff > 20 && diff < 150) return diff
    }
    if (cardRefs.current[0]) {
      const height = cardRefs.current[0].getBoundingClientRect().height
      if (height > 20 && height < 150) return height + 6
    }
    return 62
  }

  const startDrag = (e, index) => {
    if (isDropping) return
    if (e.button !== 0 && e.pointerType === 'mouse') return
    if (e.target.closest('button')) return

    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}

    const h = measureItemHeight()
    itemHeightRef.current = h
    startYRef.current = e.clientY
    lastOverIndexRef.current = index
    isDraggingRef.current = true

    setDraggingIndex(index)
    setOverIndex(index)
    setDragOffsetY(0)
    setIsDropping(false)

    try {
      navigator.vibrate?.(10)
    } catch {}
  }

  const onPointerMove = (e) => {
    if (draggingIndex === null || isDropping || !isDraggingRef.current) return

    const dy = e.clientY - startYRef.current
    const h = itemHeightRef.current || 62
    const totalCount = localPlayers.length

    const minDy = -draggingIndex * h
    const maxDy = (totalCount - 1 - draggingIndex) * h
    const clampedDy = Math.max(minDy - 20, Math.min(maxDy + 20, dy))
    setDragOffsetY(clampedDy)

    const target = Math.max(0, Math.min(totalCount - 1, draggingIndex + Math.round(dy / h)))
    if (target !== overIndex) {
      setOverIndex(target)
      if (lastOverIndexRef.current !== target) {
        lastOverIndexRef.current = target
        try {
          navigator.vibrate?.(12)
        } catch {}
      }
    }
  }

  const endDrag = (e) => {
    if (draggingIndex === null || !isDraggingRef.current) return
    isDraggingRef.current = false
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}

    const from = draggingIndex
    const to = overIndex !== null ? overIndex : draggingIndex

    if (from === to) {
      setDraggingIndex(null)
      setOverIndex(null)
      setDragOffsetY(0)
      setIsDropping(false)
      return
    }

    setIsDropping(true)
    const h = itemHeightRef.current || 62
    setDragOffsetY((to - from) * h)

    try {
      navigator.vibrate?.(16)
    } catch {}

    dropTimeoutRef.current = setTimeout(() => {
      const arr = [...localPlayers]
      const [moved] = arr.splice(from, 1)
      arr.splice(to, 0, moved)
      setLocalPlayers(arr)
      onReorder(arr)

      setDraggingIndex(null)
      setOverIndex(null)
      setDragOffsetY(0)
      setIsDropping(false)
    }, 220)
  }

  const movePlayer = (index, dir) => {
    const target = index + dir
    if (target < 0 || target >= localPlayers.length) return
    const arr = [...localPlayers]
    const temp = arr[target]
    arr[target] = arr[index]
    arr[index] = temp
    setLocalPlayers(arr)
    onReorder(arr)
    try {
      navigator.vibrate?.(10)
    } catch {}
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Ordre du tour (qui commence)">
      <div className="px-4 pt-1 pb-6 space-y-3">
        <div className="p-2.5 rounded-xl bg-stone-100/80 dark:bg-slate-800/60 border border-stone-200/80 dark:border-slate-700/60 text-xs text-stone-600 dark:text-slate-300 space-y-1">
          <p className="font-semibold text-stone-800 dark:text-slate-200">
            Qui commence et rotation des conteurs :
          </p>
          <p className="text-[11px] leading-relaxed text-stone-500 dark:text-slate-400">
            Le joueur <strong>1er</strong> commence la partie (Manche 1). Les suivants prendront la main dans l&apos;ordre de la liste.
            Glissez-déposez ou utilisez les flèches pour réorganiser les positions.
          </p>
        </div>

        <div className="space-y-1.5 relative select-none">
          {localPlayers.map((p, index) => {
            const isBeingDragged = draggingIndex === index
            const isDragActive = draggingIndex !== null

            let effectiveIndex = index
            if (isDragActive && overIndex !== null) {
              if (isBeingDragged) {
                effectiveIndex = overIndex
              } else if (draggingIndex < overIndex) {
                if (index > draggingIndex && index <= overIndex) {
                  effectiveIndex = index - 1
                }
              } else if (draggingIndex > overIndex) {
                if (index >= overIndex && index < draggingIndex) {
                  effectiveIndex = index + 1
                }
              }
            }

            const isFirst = effectiveIndex === 0
            const isCurrentStoryteller = p.id === currentStorytellerId

            let transform = 'translateY(0px)'
            let zIndex = 1
            let transition = 'transform 200ms ease, box-shadow 200ms ease'

            if (isBeingDragged) {
              transform = `translateY(${dragOffsetY}px) scale(1.02)`
              zIndex = 50
              transition = isDropping ? 'transform 200ms cubic-bezier(0.2, 0, 0, 1)' : 'none'
            } else if (isDragActive && overIndex !== null) {
              const h = itemHeightRef.current || 62
              if (draggingIndex < overIndex && index > draggingIndex && index <= overIndex) {
                transform = `translateY(${-h}px)`
              } else if (draggingIndex > overIndex && index >= overIndex && index < draggingIndex) {
                transform = `translateY(${h}px)`
              }
            }

            return (
              <div
                key={p.id}
                ref={el => { cardRefs.current[index] = el }}
                onPointerDown={e => startDrag(e, index)}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                style={{ transform, zIndex, transition, touchAction: 'none' }}
                className={`relative flex items-center justify-between gap-2.5 p-2.5 rounded-xl border transition-colors cursor-grab active:cursor-grabbing select-none ${
                  isBeingDragged
                    ? 'border-[#c83b3b] bg-white dark:bg-slate-800 shadow-lg ring-2 ring-[#c83b3b]/30'
                    : isCurrentStoryteller
                    ? 'border-[#c83b3b]/60 bg-[#c83b3b]/5 dark:bg-[#c83b3b]/10'
                    : 'border-stone-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-800/80 hover:border-stone-300'
                }`}
              >
                {/* Gauche : Rang + Avatar + Nom */}
                <div className="flex items-center gap-2.5 min-w-0 pointer-events-none">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                    isFirst
                      ? 'bg-[#c83b3b] text-white shadow-2xs'
                      : 'bg-stone-200/90 dark:bg-slate-700 text-stone-700 dark:text-slate-300'
                  }`}>
                    {effectiveIndex + 1}
                  </span>

                  <Avatar player={p} size="xs" />

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 leading-tight">
                      <span className="font-serif-title font-bold text-xs sm:text-sm text-stone-900 dark:text-slate-100 truncate">
                        {p.name}
                      </span>
                      {isFirst && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#c83b3b] text-white shrink-0">
                          Commence
                        </span>
                      )}
                      {isCurrentStoryteller && !isFirst && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-stone-700 dark:bg-slate-600 text-white shrink-0">
                          Conteur M.{roundNum}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-stone-400 dark:text-slate-500 block truncate">
                      {isFirst ? 'Manche 1' : `Manche ${effectiveIndex + 1}`} · tour {effectiveIndex + 1}/{localPlayers.length}
                    </span>
                  </div>
                </div>

                {/* Droite : Flèches haut/bas + poignée */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => movePlayer(index, -1)}
                    disabled={index === 0}
                    className="p-1 rounded-md border border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-700 text-stone-600 dark:text-slate-300 disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                    title="Monter d'une position"
                  >
                    <ChevronUp size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => movePlayer(index, 1)}
                    disabled={index === localPlayers.length - 1}
                    className="p-1 rounded-md border border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-700 text-stone-600 dark:text-slate-300 disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                    title="Descendre d'une position"
                  >
                    <ChevronDown size={13} />
                  </button>
                  <div
                    className="p-1 text-stone-400 dark:text-slate-500 hover:text-stone-700 dark:hover:text-slate-300 cursor-grab active:cursor-grabbing"
                    title="Glisser-déposer pour réorganiser"
                  >
                    <GripVertical size={15} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl font-bold text-xs bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 cursor-pointer shadow-sm hover:opacity-95 transition-opacity"
          >
            Terminé
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}

export function DixitEngine({ game, onFinish }) {
  const { updateScores, reorderGamePlayers } = useGame()
  const roundNum = (game.rounds?.length || 0) + 1
  const WIN_SCORE = game.config?.limit || 30

  // Conteur de la manche : par défaut, rotation selon le numéro de manche
  const [storytellerId, setStorytellerId] = useState(() => {
    if (game.restoredRound?.storytellerId) return game.restoredRound.storytellerId
    const defaultIdx = (game.rounds?.length || 0) % game.players.length
    return game.players[defaultIdx]?.id || game.players[0]?.id
  })

  // Points marqués dans cette manche par chaque joueur
  const [roundPoints, setRoundPoints] = useState(() => {
    const init = {}
    for (const p of game.players) {
      if (game.restoredRound?.roundPoints?.[p.id] != null) {
        init[p.id] = game.restoredRound.roundPoints[p.id]
      } else if (game.restoredDelta?.[p.id] != null) {
        init[p.id] = game.restoredDelta[p.id]
      } else {
        init[p.id] = 0
      }
    }
    return init
  })

  const [editingPlayer, setEditingPlayer] = useState(null)
  const [showRulesMemo, setShowRulesMemo] = useState(false)
  const [showOrderSheet, setShowOrderSheet] = useState(false)

  // Drag & drop desktop dans le carousel horizontal
  const [draggedPlayerIdx, setDraggedPlayerIdx] = useState(null)
  const [dragOverPlayerIdx, setDragOverPlayerIdx] = useState(null)

  // Refs pour le centrage magnétique du carousel
  const carouselRef = useRef(null)
  const itemRefs = useRef({})

  // Fonction de centrage magnétique fluide
  const scrollToPlayer = (id, smooth = true) => {
    const el = itemRefs.current[id]
    const container = carouselRef.current
    if (!el || !container) return
    const containerRect = container.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    const elCenter = elRect.left + (elRect.width / 2)
    const containerCenter = containerRect.left + (containerRect.width / 2)
    const diff = elCenter - containerCenter
    if (Math.abs(diff) < 2) return

    container.scrollTo({
      left: container.scrollLeft + diff,
      behavior: smooth ? 'smooth' : 'auto',
    })
  }

  // Centrage magnétique automatique à chaque changement de conteur ou au chargement
  useEffect(() => {
    const t1 = setTimeout(() => scrollToPlayer(storytellerId, true), 60)
    const t2 = setTimeout(() => scrollToPlayer(storytellerId, true), 220)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [storytellerId])

  // Détection du changement de manche pour rotation automatique et centrage
  const prevRoundsLenRef = useRef(game.rounds?.length || 0)
  useEffect(() => {
    if (game.rounds?.length !== prevRoundsLenRef.current) {
      prevRoundsLenRef.current = game.rounds?.length || 0
      const nextIdx = (game.rounds?.length || 0) % game.players.length
      const nextId = game.players[nextIdx]?.id || game.players[0]?.id
      if (nextId) {
        setStorytellerId(nextId)
        setRoundPoints(Object.fromEntries(game.players.map(p => [p.id, 0])))
      }
    }
  }, [game.rounds?.length, game.players])

  // Sélection manuelle au clic avec magnétisme immédiat
  const handleSelectStoryteller = (pId) => {
    setStorytellerId(pId)
    scrollToPlayer(pId, true)
    try {
      navigator.vibrate?.(8)
    } catch {}
  }

  // Réordonner les joueurs (ordre qui commence et les suivants)
  const handleReorder = (newPlayers) => {
    reorderGamePlayers?.(newPlayers)
    const defaultIdx = (game.rounds?.length || 0) % newPlayers.length
    const nextStoryteller = newPlayers[defaultIdx]?.id
    if (nextStoryteller) {
      setStorytellerId(nextStoryteller)
      setTimeout(() => scrollToPlayer(nextStoryteller, true), 60)
    }
  }

  const handleCarouselDrop = (targetIdx) => {
    if (draggedPlayerIdx === null || draggedPlayerIdx === targetIdx) {
      setDraggedPlayerIdx(null)
      setDragOverPlayerIdx(null)
      return
    }
    const newPlayers = [...game.players]
    const [moved] = newPlayers.splice(draggedPlayerIdx, 1)
    newPlayers.splice(targetIdx, 0, moved)
    handleReorder(newPlayers)
    setDraggedPlayerIdx(null)
    setDragOverPlayerIdx(null)
  }

  // Calcul du score maximum théorique par manche selon les règles officielles Dixit :
  // - Conteur : 0 pt ou 3 pts (max 3)
  // - Devins : 3 pts (si trouvé) + 1 pt par vote de bluff reçu sur sa carte.
  //   Nombre max de votants = nombre de joueurs - 2 (le conteur ne vote pas, on ne vote pas pour soi).
  //   En règles officielles (notamment Dixit Odyssey), le bluff est plafonné à 3 pts max.
  const playerCount = game.players?.length || 4
  const maxBluff = playerCount <= 5 ? Math.max(1, playerCount - 2) : 3
  const maxGuesserPoints = 3 + maxBluff // 5 pts à 4 joueurs, 6 pts à 5+ joueurs
  const guesserValues = Array.from({ length: maxGuesserPoints + 1 }, (_, i) => i)

  // Navigation dans le ScorePad
  const activeIndex = editingPlayer ? game.players.findIndex(p => p.id === editingPlayer.id) : -1
  const hasNextPlayer = activeIndex >= 0 && activeIndex < game.players.length - 1
  const hasPrevPlayer = activeIndex > 0
  const nextPlayer = hasNextPlayer ? game.players[activeIndex + 1] : null
  const prevPlayer = hasPrevPlayer ? game.players[activeIndex - 1] : null

  const handleNextInPad = () => {
    if (hasNextPlayer && nextPlayer) {
      setEditingPlayer(nextPlayer)
    } else {
      setEditingPlayer(null)
    }
  }

  const handlePrevInPad = () => {
    if (hasPrevPlayer && prevPlayer) {
      setEditingPlayer(prevPlayer)
    }
  }

  // État des raccourcis officiels
  const isConteurApplied = roundPoints[storytellerId] === 3
  const isAllOrNoneApplied =
    roundPoints[storytellerId] === 0 &&
    game.players.length > 1 &&
    game.players.filter(p => p.id !== storytellerId).every(p => roundPoints[p.id] === 2)

  // Raccourcis officiels en un clic avec bascule intelligente
  const applyBalancedClueBase = () => {
    // Indice réussi de base : Conteur = 3 pts (ou réinitialise à 0 si déjà actif)
    setRoundPoints(prev => ({
      ...prev,
      [storytellerId]: prev[storytellerId] === 3 ? 0 : 3,
    }))
  }

  const applyAllOrNoneFound = () => {
    // Tous ou aucun ont trouvé : Conteur = 0, Autres = 2 pts (ou réinitialise si déjà actif)
    setRoundPoints(prev => {
      const already =
        prev[storytellerId] === 0 &&
        game.players.filter(p => p.id !== storytellerId).every(p => prev[p.id] === 2)

      const next = { ...prev }
      for (const p of game.players) {
        next[p.id] = already ? 0 : (p.id === storytellerId ? 0 : 2)
      }
      return next
    })
  }

  // Calcul des nouveaux scores et détection de victoire
  const calculatedResult = useMemo(() => {
    const currentScores = game.scores || {}
    const newScores = {}
    const deltas = {}
    let highestScore = -1
    let winnerId = null
    let hasWinner = false

    for (const p of game.players) {
      const pts = roundPoints[p.id] || 0
      const total = (currentScores[p.id] || 0) + pts
      newScores[p.id] = total
      deltas[p.id] = pts

      if (total >= WIN_SCORE) {
        hasWinner = true
      }
      if (total > highestScore) {
        highestScore = total
        winnerId = p.id
      }
    }

    return {
      newScores,
      deltas,
      hasWinner,
      winnerId,
    }
  }, [game.scores, game.players, roundPoints, WIN_SCORE])

  const handleValidate = () => {
    const { newScores, deltas, hasWinner, winnerId } = calculatedResult

    updateScores({
      scores: newScores,
      delta: deltas,
      roundPoints,
      storytellerId,
      type: 'dixit',
    })

    if (hasWinner && winnerId) {
      setTimeout(() => {
        onFinish?.(winnerId)
      }, 150)
    }
  }

  return (
    <div className="space-y-3 pb-8">
      {/* Sélection du Conteur de la manche avec centrage magnétique & réorganisation de l'ordre */}
      <div className="p-3 rounded-2xl school-card border border-stone-200/80 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-slate-300 min-w-0">
            <VenetianMask size={14} className="text-[#c83b3b] shrink-0" />
            <span className="truncate">Conteur de la manche :</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowOrderSheet(true)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-600 dark:text-slate-300 text-[10px] font-bold transition-colors cursor-pointer"
              title="Modifier qui commence et l'ordre des conteurs suivants"
            >
              <ArrowLeftRight size={11} className="text-[#c83b3b]" />
              <span>Ordre du tour</span>
            </button>
            <button
              type="button"
              onClick={() => setShowRulesMemo(true)}
              className="p-1 rounded-lg border border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-500 dark:text-slate-400 transition-colors shrink-0 cursor-pointer"
              title="Rappel du barème officiel"
            >
              <HelpCircle size={13} />
            </button>
          </div>
        </div>

        {/* Carousel horizontal magnétique défilant avec snap et drag & drop */}
        <div
          ref={carouselRef}
          className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-2 scroll-smooth select-none relative"
          style={{
            paddingLeft: 'calc(50% - 38px)',
            paddingRight: 'calc(50% - 38px)',
            scrollSnapType: draggedPlayerIdx !== null ? 'none' : 'x proximity',
          }}
        >
          {game.players.map((p, idx) => {
            const isStoryteller = p.id === storytellerId
            const isFirst = idx === 0
            const isDragging = draggedPlayerIdx === idx
            const isDragOver = dragOverPlayerIdx === idx

            return (
              <button
                key={p.id}
                ref={el => { itemRefs.current[p.id] = el }}
                type="button"
                onClick={() => handleSelectStoryteller(p.id)}
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', String(idx))
                  setDraggedPlayerIdx(idx)
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                  if (dragOverPlayerIdx !== idx) setDragOverPlayerIdx(idx)
                }}
                onDragLeave={() => {
                  if (dragOverPlayerIdx === idx) setDragOverPlayerIdx(null)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  handleCarouselDrop(idx)
                }}
                onDragEnd={() => {
                  setDraggedPlayerIdx(null)
                  setDragOverPlayerIdx(null)
                }}
                className={`relative flex flex-col items-center justify-center gap-1 py-1.5 px-2 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer border select-none shrink-0 min-w-[70px] max-w-[82px] snap-center active:scale-95 ${
                  isDragging ? 'opacity-30 scale-90 border-dashed border-[#c83b3b]' : ''
                } ${
                  isDragOver ? 'ring-2 ring-[#c83b3b] ring-offset-2 scale-105' : ''
                } ${
                  isStoryteller
                    ? 'border-[#c83b3b] bg-[#c83b3b] text-white shadow-md scale-105 z-10'
                    : 'border-stone-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 text-stone-700 dark:text-slate-300 hover:border-stone-300 opacity-90 hover:opacity-100'
                }`}
                title={`Tour ${idx + 1} : ${p.name}${isFirst ? ' (Commence la partie)' : ''}`}
              >
                {/* Pastille discrète d'ordre du tour */}
                <span className={`absolute -top-1.5 -left-1 px-1.5 py-0.2 rounded-full text-[8px] font-black leading-tight shadow-2xs z-20 ${
                  isFirst
                    ? isStoryteller ? 'bg-white text-[#c83b3b]' : 'bg-[#c83b3b] text-white'
                    : isStoryteller ? 'bg-white/90 text-stone-800' : 'bg-stone-200/90 dark:bg-slate-700 text-stone-600 dark:text-slate-300'
                }`}>
                  {isFirst ? '1er' : `${idx + 1}e`}
                </span>

                <div className="relative shrink-0">
                  <Avatar player={p} size="xs" />
                </div>
                <span className={`text-[11px] font-semibold truncate w-full text-center leading-tight ${isStoryteller ? 'text-white' : ''}`}>
                  {p.name}
                </span>
                {isStoryteller && (
                  <span className="text-[8px] font-extrabold uppercase tracking-wide px-1 rounded bg-white/20 text-white leading-tight">
                    Conteur
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Raccourcis officiels rapides (sortis du conteneur pour maximiser la largeur et aérer l'interface) */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={applyBalancedClueBase}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer border active:scale-[0.98] select-none whitespace-nowrap shadow-2xs ${
            isConteurApplied
              ? 'bg-[#c83b3b] text-white border-[#c83b3b] shadow-xs'
              : 'bg-[#c83b3b]/10 dark:bg-[#c83b3b]/20 hover:bg-[#c83b3b]/15 text-[#c83b3b] dark:text-red-300 border border-[#c83b3b]/35'
          }`}
          title="Donne 3 points au conteur (indice réussi)"
        >
          {isConteurApplied && <Check size={13} className="shrink-0 stroke-[3]" />}
          <span className="whitespace-nowrap">Conteur +3 pts</span>
        </button>

        <button
          type="button"
          onClick={applyAllOrNoneFound}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer border active:scale-[0.98] select-none whitespace-nowrap shadow-2xs ${
            isAllOrNoneApplied
              ? 'bg-stone-800 dark:bg-slate-200 text-white dark:text-slate-900 border-stone-800 dark:border-slate-200 shadow-xs'
              : 'bg-white dark:bg-slate-800/80 hover:bg-stone-50 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 border border-stone-200 dark:border-slate-700'
          }`}
          title="Le conteur n'a trouvé personne ou a fait l'unanimité : Conteur 0 pt, Autres 2 pts"
        >
          {isAllOrNoneApplied && <Check size={13} className="shrink-0 stroke-[3]" />}
          <span className="whitespace-nowrap">Tous ou aucun (2 pts)</span>
        </button>
      </div>

      {/* Cartes de saisie des joueurs */}
      <div className="space-y-2.5">
        {game.players.map((p) => {
          const isStoryteller = p.id === storytellerId
          const currentTotal = game.scores?.[p.id] || 0
          const pts = roundPoints[p.id] || 0
          const projected = currentTotal + pts
          const willWin = projected >= WIN_SCORE

          return (
            <div
              key={p.id}
              className={`p-3 rounded-2xl school-card border transition-all ${
                willWin
                  ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/40'
                  : isStoryteller
                  ? 'border-[#c83b3b]/40 bg-[#c83b3b]/5 dark:bg-[#c83b3b]/10'
                  : 'border-stone-200/90 dark:border-slate-800'
              }`}
            >
              {/* Entête et saisie du joueur */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar player={p} size="sm" />
                  <div className="min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 leading-tight">
                      <span className="font-serif-title font-bold text-sm text-stone-900 dark:text-slate-100 truncate leading-tight">
                        {p.name}
                      </span>
                      {isStoryteller && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#c83b3b] text-white leading-none shrink-0">
                          Conteur
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-stone-400 dark:text-slate-500 leading-tight mt-0.5 truncate block">
                      Total cumulé : {projected} / {WIN_SCORE} pts
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <QuickScoreBadge
                    value={pts}
                    onChange={(val) => setRoundPoints(prev => ({ ...prev, [p.id]: Math.max(0, Number(val) || 0) }))}
                    onOpenPad={() => setEditingPlayer(p)}
                    min={0}
                    max={isStoryteller ? 3 : maxGuesserPoints}
                    step={1}
                    values={isStoryteller ? [0, 1, 2, 3] : guesserValues}
                    showPlus={true}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bouton de validation principale */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleValidate}
          className="w-full py-3 rounded-xl font-bold text-sm text-white shadow-sm transition-all flex items-center justify-center gap-2 select-none bg-[#c83b3b] hover:bg-[#b03030] cursor-pointer active:scale-[0.99]"
        >
          <Trophy size={16} />
          <span>Valider la manche</span>
        </button>
      </div>

      {/* Dialog Mémo du barème officiel */}
      <Dialog
        open={showRulesMemo}
        onClose={() => setShowRulesMemo(false)}
        title="Barème officiel de Dixit"
      >
        <div className="space-y-2 text-xs text-stone-600 dark:text-slate-300">
          <p className="leading-relaxed font-semibold">
            Attribution des points à chaque manche :
          </p>
          <ul className="space-y-1.5 pl-3 list-disc text-[11px]">
            <li>
              <strong>Tous ou Aucun ne trouvent la carte :</strong> Le conteur marque <strong>0 pt</strong>, tous les autres joueurs marquent <strong>2 pts</strong>.
            </li>
            <li>
              <strong>Au moins un joueur (mais pas tous) trouve :</strong> Le conteur marque <strong>3 pts</strong>, et chaque joueur ayant trouvé marque <strong>3 pts</strong>.
            </li>
            <li>
              <strong>Bonus de tromperie (Bluff) :</strong> Chaque joueur (hormis le conteur) marque <strong>+1 pt</strong> pour chaque vote reçu sur sa propre carte (max <strong>+{maxBluff} pts</strong> à {playerCount} joueurs, plafonné à 3 pts en règles Odyssey).
            </li>
            <li>
              <strong>Fin de partie :</strong> Le premier joueur à atteindre ou dépasser <strong>30 points</strong> remporte la partie.
            </li>
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

      {/* BottomSheet de réorganisation de l'ordre du tour */}
      <DixitOrderSheet
        open={showOrderSheet}
        onClose={() => setShowOrderSheet(false)}
        players={game.players}
        onReorder={handleReorder}
        currentStorytellerId={storytellerId}
        roundNum={roundNum}
      />

      {/* BottomSheet avec ScorePad pour saisie tactile au pavé numérique */}
      <BottomSheet open={!!editingPlayer} onClose={() => setEditingPlayer(null)}>
        {editingPlayer && (() => {
          const editingIsStoryteller = editingPlayer.id === storytellerId
          const padMax = editingIsStoryteller ? 3 : maxGuesserPoints
          const padPresets = editingIsStoryteller ? [0, 1, 2, 3] : guesserValues
          const padSubLabel = editingIsStoryteller
            ? 'Conteur : 0 pt ou 3 pts'
            : `Trouvé (+3) · Bluff (max +${maxBluff})`

          return (
            <div className="px-4 pt-1 pb-6 space-y-3">
              <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-stone-100/80 dark:bg-slate-800/60 border border-stone-200/80 dark:border-slate-700/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar player={editingPlayer} size="sm" />
                  <div className="min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 leading-tight">
                      <span className="font-serif-title font-bold text-sm text-stone-900 dark:text-slate-100 truncate leading-tight">
                        {editingPlayer.name}
                      </span>
                      {editingPlayer.id === storytellerId && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#c83b3b] text-white leading-none shrink-0">
                          Conteur
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-stone-500 dark:text-slate-400 block truncate leading-tight mt-0.5">
                      Score cumulé actuel : {game.scores?.[editingPlayer.id] || 0} pts
                    </span>
                  </div>
                </div>

                {/* Navigation précédente / suivante */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrevInPad}
                    disabled={!hasPrevPlayer}
                    className="p-1.5 rounded-lg border border-stone-200 dark:border-slate-700 disabled:opacity-30 disabled:pointer-events-none hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
                    title="Précédent"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextInPad}
                    disabled={!hasNextPlayer}
                    className="p-1.5 rounded-lg border border-stone-200 dark:border-slate-700 disabled:opacity-30 disabled:pointer-events-none hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
                    title="Suivant"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              <ScorePad
                value={roundPoints[editingPlayer.id] || 0}
                onChange={(val) => setRoundPoints(prev => ({ ...prev, [editingPlayer.id]: Math.max(0, Number(val) || 0) }))}
                onConfirm={handleNextInPad}
                confirmLabel={hasNextPlayer && nextPlayer ? `Valider & Suivant (${nextPlayer.name})` : 'Valider'}
                label="Points de la manche"
                subLabel={padSubLabel}
                min={0}
                max={padMax}
                step={1}
                presets={padPresets}
                customButtons={[]}
                baseScore={game.scores?.[editingPlayer.id] || 0}
                formatTotal={(val) => {
                  const cur = game.scores?.[editingPlayer.id] || 0
                  return `+${val} pts · Nouveau total : ${cur + val} / ${WIN_SCORE} pts`
                }}
                showPlus={true}
              />
            </div>
          )
        })()}
      </BottomSheet>
    </div>
  )
}
