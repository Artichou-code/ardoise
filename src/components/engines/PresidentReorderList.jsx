import { useState, useRef, useEffect } from 'react'
import { ChevronUp, ChevronDown, GripVertical, Crown } from 'lucide-react'
import { Avatar } from '../ui/Avatar'
import { getPresidentRole } from '../../engines/gameEngines'

/**
 * Composant de classement par Drag & Drop tactile animé pour Trou du cul (Président).
 * - Glisser-déposer fluide au doigt et à la souris avec translation continue (60fps)
 * - Animation fluide de déplacement des cartes voisines
 * - Mise à jour dynamique des rôles (Président, Vice-P., Neutre, Vice-Trou, Trou) et des points en direct
 * - Boutons flèches chevron conservés en alternative accessible
 * - Retour haptique lors du changement de position
 */
export function PresidentReorderList({
  order,
  setOrder,
  players,
  gameScores,
}) {
  const [draggingIndex, setDraggingIndex] = useState(null)
  const [overIndex, setOverIndex] = useState(null)
  const [dragOffsetY, setDragOffsetY] = useState(0)
  const [isDropping, setIsDropping] = useState(false)

  const cardRefs = useRef([])
  const startYRef = useRef(0)
  const lastOverIndexRef = useRef(null)
  const itemHeightRef = useRef(60)
  const isDraggingRef = useRef(false)
  const dropTimeoutRef = useRef(null)

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      isDraggingRef.current = false
      if (dropTimeoutRef.current) clearTimeout(dropTimeoutRef.current)
    }
  }, [])

  // Mesure dynamique de la hauteur d'un élément
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
    return 60
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
    const h = itemHeightRef.current || 60
    const totalCount = order.length

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
      if (Math.abs(dragOffsetY) > 2) {
        setIsDropping(true)
        setDragOffsetY(0)
        dropTimeoutRef.current = setTimeout(() => {
          setDraggingIndex(null)
          setOverIndex(null)
          setIsDropping(false)
        }, 180)
        return
      }
      setDraggingIndex(null)
      setOverIndex(null)
      setDragOffsetY(0)
      setIsDropping(false)
      return
    }

    // Animation de placement douce : glisse précisément vers le slot cible
    setIsDropping(true)
    const h = itemHeightRef.current || 60
    setDragOffsetY((to - from) * h)

    try {
      navigator.vibrate?.(16)
    } catch {}

    dropTimeoutRef.current = setTimeout(() => {
      setOrder(prev => {
        const arr = [...prev]
        const [moved] = arr.splice(from, 1)
        arr.splice(to, 0, moved)
        return arr
      })
      // Réinitialisation avec transition: none pour éviter tout saut brutal de repositionnement
      setDraggingIndex(null)
      setOverIndex(null)
      setDragOffsetY(0)
      setIsDropping(false)
    }, 230)
  }

  // Échange manuel par boutons flèches
  const moveItem = (index, direction) => {
    const target = index + direction
    if (target < 0 || target >= order.length) return
    setOrder(prev => {
      const arr = [...prev]
      const temp = arr[target]
      arr[target] = arr[index]
      arr[index] = temp
      return arr
    })
    try {
      navigator.vibrate?.(10)
    } catch {}
  }

  const totalPlayers = order.length

  return (
    <div className="space-y-1.5 relative select-none">
      {order.map((pId, index) => {
        const p = players.find(pl => pl.id === pId)
        if (!p) return null

        const isBeingDragged = draggingIndex === index
        const isDragActive = draggingIndex !== null

        // Calcul du rang effectif projeté pendant le déplacement
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

        const role = getPresidentRole(effectiveIndex + 1, totalPlayers)
        const rankNum = effectiveIndex + 1
        const isPresident = rankNum === 1
        const isVicePresident = totalPlayers >= 4 && rankNum === 2
        const isTrou = rankNum === totalPlayers
        const isViceTrou = totalPlayers >= 4 && rankNum === totalPlayers - 1

        // Déplacement CSS (transform translateY)
        const h = itemHeightRef.current || 60
        let translateY = 0
        let transition = 'background-color 200ms ease, border-color 200ms ease'

        if (isBeingDragged) {
          translateY = dragOffsetY
          transition = isDropping
            ? 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 220ms ease, background-color 200ms ease, border-color 200ms ease'
            : 'box-shadow 150ms ease, background-color 200ms ease, border-color 200ms ease'
        } else if (isDragActive && overIndex !== null) {
          transition = 'transform 200ms cubic-bezier(0.2, 0, 0, 1), background-color 200ms ease, border-color 200ms ease'
          if (draggingIndex < overIndex && index > draggingIndex && index <= overIndex) {
            translateY = -h
          } else if (draggingIndex > overIndex && index >= overIndex && index < draggingIndex) {
            translateY = h
          }
        }

        // Thème dynamique du rang projeté
        const themeClass = isPresident
          ? 'border-emerald-500/80 bg-emerald-50/60 dark:bg-emerald-950/25 ring-1 ring-emerald-500/20'
          : isVicePresident
          ? 'border-emerald-400/60 bg-emerald-50/30 dark:bg-emerald-950/15'
          : isTrou
          ? 'border-[#c83b3b]/60 bg-[#c83b3b]/8 dark:bg-[#c83b3b]/15 ring-1 ring-[#c83b3b]/20'
          : isViceTrou
          ? 'border-[#c83b3b]/40 bg-[#c83b3b]/5 dark:bg-[#c83b3b]/10'
          : 'school-subtle'

        const elevationClass = isBeingDragged
          ? isDropping
            ? 'shadow-md z-30 ring-1 ring-stone-900/10 dark:ring-white/15'
            : 'shadow-2xl z-40 ring-1 ring-stone-900/15 dark:ring-white/20'
          : ''

        const currentTotal = gameScores[p.id] || 0
        const projectedTotal = currentTotal + role.points

        return (
          <div
            key={p.id}
            ref={el => { if (el) cardRefs.current[index] = el }}
            onPointerDown={(e) => startDrag(e, index)}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            style={{
              transform: `translateY(${translateY}px) ${isBeingDragged && !isDropping ? 'scale(1.025)' : 'scale(1)'}`,
              transition,
              zIndex: isBeingDragged ? 40 : 1,
            }}
            className={`px-2.5 sm:px-3 py-2 rounded-xl border flex items-center justify-between gap-2 touch-none cursor-grab active:cursor-grabbing ${themeClass} ${elevationClass}`}
          >
            {/* Poignée de drag & drop visuelle */}
            <div
              className="text-stone-300 dark:text-slate-600 hover:text-stone-500 dark:hover:text-slate-400 p-0.5 shrink-0 transition-colors"
              title="Glisser pour modifier le classement"
              aria-hidden="true"
            >
              <GripVertical size={14} />
            </div>

            {/* Rang + Avatar + Nom + Rôle & Total */}
            <div className="flex items-center gap-2 min-w-0 flex-1 pointer-events-none">
              <span className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-all ${
                isPresident
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : isVicePresident
                  ? 'bg-emerald-500/80 text-white shadow-2xs'
                  : isTrou
                  ? 'bg-[#c83b3b] text-white shadow-2xs'
                  : isViceTrou
                  ? 'bg-[#c83b3b]/80 text-white shadow-2xs'
                  : 'bg-stone-200 dark:bg-slate-700 text-stone-700 dark:text-slate-300'
              }`}>
                {rankNum}
              </span>

              <Avatar
                player={p}
                size="xs"
                leader={isPresident}
                leaderColor="#10b981"
                crown={isPresident}
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-xs truncate text-stone-900 dark:text-slate-100">
                    {p.name}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                    isPresident
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                      : isVicePresident
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                      : isTrou
                      ? 'bg-red-100 dark:bg-red-950/60 text-[#c83b3b] dark:text-red-300'
                      : isViceTrou
                      ? 'bg-red-50 dark:bg-red-950/40 text-[#c83b3b] dark:text-red-300'
                      : 'bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-400'
                  }`}>
                    {role.label}
                  </span>
                </div>

                <span className="text-[10px] text-stone-500 dark:text-slate-400 block whitespace-nowrap mt-0.5">
                  {role.points !== 0 ? (
                    <>Total : {currentTotal} ➔ <strong className={`font-bold ${role.points > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-[#c83b3b] dark:text-red-400'}`}>{projectedTotal} pts</strong></>
                  ) : (
                    `Total : ${currentTotal} pts`
                  )}
                </span>
              </div>
            </div>

            {/* Actions : Flèches haut/bas empilées + Badge de points */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex flex-col gap-0.5 shrink-0">
                <button
                  type="button"
                  disabled={effectiveIndex === 0 || isDragActive}
                  onClick={(e) => {
                    e.stopPropagation()
                    moveItem(index, -1)
                  }}
                  className="w-6 h-3.5 rounded flex items-center justify-center border border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none active:scale-90"
                  title="Monter d'une place"
                  aria-label="Monter d'une place"
                >
                  <ChevronUp size={11} />
                </button>
                <button
                  type="button"
                  disabled={effectiveIndex === order.length - 1 || isDragActive}
                  onClick={(e) => {
                    e.stopPropagation()
                    moveItem(index, 1)
                  }}
                  className="w-6 h-3.5 rounded flex items-center justify-center border border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none active:scale-90"
                  title="Descendre d'une place"
                  aria-label="Descendre d'une place"
                >
                  <ChevronDown size={11} />
                </button>
              </div>

              <span className={`min-w-[48px] text-center px-1.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                role.points > 0
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : role.points < 0
                  ? 'bg-[#c83b3b] text-white shadow-2xs'
                  : 'bg-stone-200 dark:bg-slate-700 text-stone-700 dark:text-slate-300'
              }`}>
                {role.points > 0 ? `+${role.points}` : role.points} pts
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
