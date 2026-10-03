import { useState } from 'react'
import { AlertTriangle, Shield, Check, Flame, Trophy, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { Avatar } from '../ui/Avatar'
import { QuickScoreBadge } from '../ui/QuickScoreBadge'
import { BottomSheet } from '../ui/BottomSheet'
import { ScorePad } from '../ui/ScorePad'
import { Dialog } from '../ui/Dialog'

export function YanivEngine({ game, onFinish }) {
  const { updateScores } = useGame()
  const LIMIT = game.config?.limit || 100
  const sursisEnabled = game.config?.sursis !== false

  // Joueur ayant annoncé « Yaniv »
  const [callerId, setCallerId] = useState(() => {
    return game.restoredRound?.callerId || game.players[0]?.id || null
  })

  // Y a-t-il eu un contre « ASSAF ! » ?
  const [isAssaf, setIsAssaf] = useState(() => {
    return game.restoredRound?.isAssaf || false
  })

  // En cas d'Assaf, qui a contré (a le score le plus bas et marque 0 pt) ?
  const [assafRivalId, setAssafRivalId] = useState(() => {
    return game.restoredRound?.assafRivalId || (game.players.find(p => p.id !== callerId)?.id || game.players[1]?.id || null)
  })

  // Valeur des cartes en main de chaque joueur
  const [handPoints, setHandPoints] = useState(() => {
    const initial = {}
    for (const p of game.players) {
      initial[p.id] = (game.restoredDelta && game.restoredDelta[p.id] != null)
        ? game.restoredDelta[p.id]
        : 0
    }
    return initial
  })

  const [editingPlayer, setEditingPlayer] = useState(null)
  const [open, setOpen] = useState(false)
  const [showZeroConfirm, setShowZeroConfirm] = useState(false)
  const [reprieveNotice, setReprieveNotice] = useState(null)

  // Navigation séquentielle entre joueurs dans le ScorePad
  const currentEditingIndex = editingPlayer ? game.players.findIndex(p => p.id === editingPlayer.id) : -1
  const hasPrevPlayer = currentEditingIndex > 0
  const hasNextPlayer = currentEditingIndex >= 0 && currentEditingIndex < game.players.length - 1
  const prevPlayer = hasPrevPlayer ? game.players[currentEditingIndex - 1] : null
  const nextPlayer = hasNextPlayer ? game.players[currentEditingIndex + 1] : null

  const handleConfirmPad = () => {
    if (hasNextPlayer) {
      setEditingPlayer(nextPlayer)
    } else {
      setOpen(false)
    }
  }

  const confirmLabel = hasNextPlayer && nextPlayer ? (
    <span className="inline-flex items-baseline justify-center gap-1.5 max-w-full">
      <span className="shrink-0">Valider & Suivant</span>
      <span className="font-normal opacity-85 truncate min-w-0">({nextPlayer.name})</span>
    </span>
  ) : (
    <span>Valider et terminer</span>
  )

  // Calcul du delta de points de manche pour un joueur
  const computeDelta = (playerId) => {
    const raw = handPoints[playerId] || 0

    if (!isAssaf) {
      // Yaniv réussi : l'annonceur marque 0 pt, les autres marquent leur main
      if (playerId === callerId) return 0
      return raw
    } else {
      // ASSAF ! :
      // - L'annonceur prend sa main + 30 points de pénalité !
      // - Le contreur (score le plus bas) marque 0 pt
      // - Les autres marquent leur main
      if (playerId === callerId) return raw + 30
      if (playerId === assafRivalId) return 0
      return raw
    }
  }

  // Calcul du sursis Yaniv (paliers à 50 et 100 pts)
  const checkSursis = (projected) => {
    if (!sursisEnabled) return null
    if (projected === 50) return 25
    if (projected === 100) return 50
    if (LIMIT > 100 && projected === 150) return 75
    if (LIMIT > 100 && projected === 200) return 100
    return null
  }

  const submitRound = () => {
    const newScores = {}
    const delta = {}
    const reprieves = []

    for (const p of game.players) {
      const d = computeDelta(p.id)
      const current = game.scores[p.id] || 0
      const projected = current + d
      delta[p.id] = d

      const reduced = checkSursis(projected)
      if (reduced !== null) {
        reprieves.push({
          playerId: p.id,
          name: p.name,
          original: projected,
          reduced,
        })
        newScores[p.id] = reduced
      } else {
        newScores[p.id] = projected
      }
    }

    updateScores({
      scores: newScores,
      delta,
      callerId,
      isAssaf,
      assafRivalId: isAssaf ? assafRivalId : null,
      reprieves: reprieves.map(r => ({
        playerId: r.playerId,
        original: r.original,
        reduced: r.reduced,
      })),
      type: 'yaniv',
    })

    // Réinitialisation
    setHandPoints(Object.fromEntries(game.players.map(p => [p.id, 0])))
    setIsAssaf(false)
    setOpen(false)

    if (reprieves.length > 0) {
      const msg = reprieves
        .map(r => `${r.name} : pile ${r.original} pts ➔ retombe à ${r.reduced} pts !`)
        .join(' · ')
      setReprieveNotice(msg)
    } else {
      setReprieveNotice(null)
    }

    // Vérification d'élimination
    const overLimit = Object.entries(newScores).filter(([, s]) => s >= LIMIT)
    if (overLimit.length > 0) {
      const finalWinner = Object.entries(newScores).sort((a, b) => a[1] - b[1])[0][0]
      onFinish(finalWinner)
    }
  }

  const handleValidate = () => {
    // Si c'est un Yaniv classique (pas d'Assaf), l'annonceur est à 0 pt
    // Les adversaires doivent compter leurs points de main
    if (!isAssaf) {
      const totalOpponentPts = game.players
        .filter(p => p.id !== callerId)
        .reduce((sum, p) => sum + (handPoints[p.id] || 0), 0)

      if (totalOpponentPts === 0) {
        setShowZeroConfirm(true)
        return
      }
    }

    submitRound()
  }

  return (
    <div className="space-y-2 pt-0">
      {/* Bannière de notification en cas de sursis */}
      {reprieveNotice && (
        <div className="p-3 rounded-xl border border-[#c83b3b] bg-[#c83b3b]/10 dark:bg-[#c83b3b]/20 flex items-start gap-2.5">
          <Shield size={16} className="text-[#c83b3b] mt-0.5 flex-shrink-0" />
          <div className="flex-1 text-xs">
            <span className="font-bold text-[#c83b3b] block">Sursis Yaniv accordé !</span>
            <span className="text-stone-700 dark:text-slate-300 font-medium leading-relaxed">
              {reprieveNotice}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setReprieveNotice(null)}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-slate-200 cursor-pointer"
            aria-label="Fermer la notification"
          >
            <X size={15} />
          </button>
        </div>
      )}

      <div className="school-card rounded-xl p-3 sm:p-4">
        {/* En-tête */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 flex items-center gap-1.5 min-w-0">
            <Trophy size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">Annonceur « Yaniv » (≤ 5 pts)</span>
          </p>
          <span className="text-[11px] font-semibold text-stone-400 dark:text-slate-500 whitespace-nowrap shrink-0">
            Seuil : {LIMIT} pts
          </span>
        </div>

        {/* Grille sélecteur du joueur ayant annoncé Yaniv */}
        <div className={`grid gap-2 mb-3 ${
          game.players.length === 2 ? 'grid-cols-2' :
          game.players.length === 3 ? 'grid-cols-3' :
          'grid-cols-2 sm:grid-cols-4'
        }`}>
          {game.players.map(p => {
            const isCaller = callerId === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setCallerId(p.id)
                  if (assafRivalId === p.id) {
                    const other = game.players.find(o => o.id !== p.id)
                    if (other) setAssafRivalId(other.id)
                  }
                }}
                className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none active:scale-[0.98] ${
                  isCaller
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xs ring-1 ring-emerald-600/40'
                    : 'school-subtle text-stone-700 dark:text-slate-300 hover:border-stone-400'
                }`}
              >
                <Avatar player={p} size="xs" leader={isCaller} leaderColor="#10b981" crown={isCaller && !isAssaf} />
                <div className="text-left min-w-0 flex-1">
                  <span className={`text-xs font-bold truncate block ${isCaller ? 'text-white' : ''}`}>
                    {p.name}
                  </span>
                  <span className={`text-[10px] block font-medium truncate ${isCaller ? 'text-white/85' : 'text-stone-400 dark:text-slate-500'}`}>
                    {isCaller ? 'A dit « Yaniv »' : 'Joueur'}
                  </span>
                </div>
                {isCaller && <Check size={14} className="text-white shrink-0" />}
              </button>
            )
          })}
        </div>

        {/* Toggle Contre « ASSAF ! » */}
        <button
          type="button"
          role="switch"
          aria-checked={isAssaf}
          onClick={() => setIsAssaf(v => !v)}
          className={`w-full p-2.5 px-3 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer mb-3 select-none active:scale-[0.99] ${
            isAssaf
              ? 'border-[#c83b3b]/60 bg-[#c83b3b]/8 dark:bg-[#c83b3b]/15 ring-1 ring-[#c83b3b]/30'
              : 'school-subtle text-stone-700 dark:text-slate-300 hover:border-[#c83b3b]/50'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Flame
              size={16}
              strokeWidth={2}
              className={`shrink-0 transition-colors ${
                isAssaf
                  ? 'text-[#c83b3b]'
                  : 'text-stone-400 dark:text-slate-500'
              }`}
            />
            <div className="text-left min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs leading-tight">Contre « ASSAF ! »</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded transition-colors ${
                  isAssaf
                    ? 'bg-[#c83b3b]/20 text-[#c83b3b] dark:text-rose-300'
                    : 'bg-stone-200/70 dark:bg-slate-800 text-stone-500 dark:text-slate-400'
                }`}>
                  +30 pts
                </span>
              </div>
              <span className="text-[10px] text-stone-500 dark:text-slate-400 block truncate mt-0.5">
                {isAssaf ? 'Annonceur malus +30 · Contreur 0 pt' : 'Un adversaire a un score ≤ à l’annonceur'}
              </span>
            </div>
          </div>

          {/* Interrupteur Switch style iOS */}
          <div
            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
              isAssaf ? 'bg-[#c83b3b]' : 'bg-stone-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition-transform duration-200 ease-in-out ${
                isAssaf ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </div>
        </button>

        {/* Si ASSAF : Sélecteur du contreur qui a le score le plus bas et marque 0 pt */}
        {isAssaf && (
          <div className="mb-3 p-2.5 rounded-xl border border-amber-300/80 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20">
            <div className="flex items-center justify-between gap-1.5 mb-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5 min-w-0">
                <Check size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="truncate">Contreur gagnant</span>
              </p>
              <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold shrink-0">
                Score le plus bas · 0 pt
              </span>
            </div>
            <div className={`grid gap-1.5 ${
              game.players.length === 3 ? 'grid-cols-2' :
              game.players.length === 4 ? 'grid-cols-3' :
              'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
            }`}>
              {game.players.filter(p => p.id !== callerId).map(p => {
                const isRival = assafRivalId === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setAssafRivalId(p.id)}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none active:scale-[0.98] min-w-0 ${
                      isRival
                        ? 'border-amber-600 bg-amber-600 text-white shadow-2xs ring-1 ring-amber-600/40'
                        : 'school-card text-stone-700 dark:text-slate-300 hover:border-amber-500'
                    }`}
                  >
                    <div className="relative mb-0.5">
                      <Avatar player={p} size="xs" leader={isRival} crown={isRival} />
                    </div>
                    <span className={`truncate w-full text-center px-0.5 leading-tight ${isRival ? 'text-white' : ''}`}>
                      {p.name}
                    </span>
                    <span className={`text-[10px] font-semibold mt-0.5 px-1.5 py-0.2 rounded-full inline-block leading-tight ${
                      isRival ? 'bg-white/20 text-white' : 'text-stone-400 dark:text-slate-500'
                    }`}>
                      0 pt
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Liste des points de main par joueur */}
        <div className="pt-2 border-t border-stone-200/80 dark:border-slate-800">
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 shrink-0">
              Valeur des mains
            </p>
            <span className="text-[10px] text-stone-400 dark:text-slate-500 text-right shrink-0">
              Joker 0 · As 1 · Figures 10
            </span>
          </div>

          <div className="space-y-1.5">
            {game.players.map(p => {
              const isCaller = callerId === p.id
              const isRival = isAssaf && assafRivalId === p.id
              const currentTotal = game.scores[p.id] || 0
              const delta = computeDelta(p.id)
              const projected = currentTotal + delta
              const sursisVal = checkSursis(projected)
              const danger = (sursisVal === null) && (projected >= LIMIT)
              const rawPts = handPoints[p.id] || 0

              // Cas 1 : Gagnant à 0 pt (Yaniv réussi ou Contreur Assaf)
              if ((!isAssaf && isCaller) || isRival) {
                return (
                  <div
                    key={p.id}
                    className="px-3 py-2 rounded-xl border border-emerald-300/80 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar player={p} size="xs" leader leaderColor="#059669" crown />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm truncate">{p.name}</span>
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-600/10 dark:bg-emerald-500/20 px-1.5 py-0.2 rounded shrink-0">
                            {isAssaf ? 'Contreur' : 'Yaniv'}
                          </span>
                        </div>
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium truncate block whitespace-nowrap">
                          Total : {currentTotal} pts
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600/15 text-emerald-800 dark:text-emerald-300 border border-emerald-600/30 whitespace-nowrap shrink-0">
                      0 pt
                    </span>
                  </div>
                )
              }

              // Cas 2 : Annonceur en échec d'Assaf (prend sa main + 30 pts)
              if (isAssaf && isCaller) {
                return (
                  <div
                    key={p.id}
                    className="px-3 py-2 rounded-xl border border-[#c83b3b]/60 bg-[#c83b3b]/5 dark:bg-[#c83b3b]/15 flex items-center justify-between gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => { setEditingPlayer(p); setOpen(true) }}
                      className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer select-none"
                    >
                      <Avatar player={p} size="xs" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm truncate">{p.name}</span>
                          <span className="text-[10px] font-bold text-[#c83b3b] bg-[#c83b3b]/15 dark:bg-[#c83b3b]/25 px-1.5 py-0.2 rounded shrink-0">
                            Assaf
                          </span>
                          {danger && <AlertTriangle size={13} className="text-[#c83b3b] shrink-0" />}
                        </div>
                        <div className="text-[11px] text-stone-500 dark:text-slate-400 flex items-center gap-1.5 min-w-0 mt-0.5">
                          <span className="truncate whitespace-nowrap block">
                            Total : {currentTotal} <strong className="text-[#c83b3b] font-bold">➔ {sursisVal !== null ? sursisVal : projected} pts</strong>
                          </span>
                          {sursisVal !== null && (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded whitespace-nowrap shrink-0">
                              Sursis {sursisVal}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>

                    <QuickScoreBadge
                      value={rawPts}
                      onChange={v => setHandPoints(prev => ({ ...prev, [p.id]: Math.max(0, v) }))}
                      onOpenPad={() => { setEditingPlayer(p); setOpen(true) }}
                      min={0}
                      step={1}
                      showPlus={true}
                      formatDisplay={(v) => `+${v + 30} pts`}
                      formatBubble={(v) => {
                        const d = v + 30
                        const proj = currentTotal + d
                        const s = checkSursis(proj)
                        return {
                          text: `+${d} pts (total ${s !== null ? `${s} sursis` : proj})`,
                          variant: proj >= LIMIT && s === null ? 'danger' : 'default',
                        }
                      }}
                    />
                  </div>
                )
              }

              // Cas 3 : Joueurs normaux (encaissent la valeur de leur main)
              return (
                <div
                  key={p.id}
                  className="px-3 py-2 rounded-xl border school-subtle hover:border-stone-300 dark:hover:border-slate-700 flex items-center justify-between gap-3"
                >
                  <button
                    type="button"
                    onClick={() => { setEditingPlayer(p); setOpen(true) }}
                    className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer select-none"
                  >
                    <Avatar player={p} size="xs" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm truncate">{p.name}</span>
                        {danger && <AlertTriangle size={13} className="text-[#c83b3b] shrink-0" />}
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-slate-400 flex items-center gap-1.5 min-w-0">
                        {delta > 0 ? (
                          <>
                            <span className="truncate">
                              Total : {currentTotal} <strong className="text-[#c83b3b] font-bold">➔ {sursisVal !== null ? sursisVal : projected} pts</strong>
                            </span>
                            {sursisVal !== null && (
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded whitespace-nowrap shrink-0">
                                Sursis {sursisVal}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="truncate">Total : {currentTotal} pts</span>
                        )}
                      </div>
                    </div>
                  </button>

                  <QuickScoreBadge
                    value={rawPts}
                    onChange={v => setHandPoints(prev => ({ ...prev, [p.id]: Math.max(0, v) }))}
                    onOpenPad={() => { setEditingPlayer(p); setOpen(true) }}
                    min={0}
                    step={1}
                    showPlus={true}
                    formatDisplay={(v) => `${v} pts`}
                    formatBubble={(v) => {
                      const proj = currentTotal + v
                      const s = checkSursis(proj)
                      return {
                        text: `+${v} pts (total ${s !== null ? `${s} sursis` : proj})`,
                        variant: proj >= LIMIT && s === null ? 'danger' : 'default',
                      }
                    }}
                  />
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-stone-200/80 dark:border-slate-800">
          <button
            type="button"
            onClick={handleValidate}
            className="w-full py-2.5 rounded-xl bg-[#c83b3b] hover:bg-[#b03030] text-white font-bold text-sm shadow-sm transition-all active:scale-[0.99] cursor-pointer"
          >
            Valider la manche
          </button>
        </div>
      </div>

      {/* Dialogue de confirmation bienveillant si aucun adversaire n'a de points de main */}
      <Dialog
        open={showZeroConfirm}
        onClose={() => setShowZeroConfirm(false)}
        title="Cartes des adversaires"
        subtitle="Yaniv · Manche en cours"
        icon={(
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle size={17} />
          </div>
        )}
      >
        <div className="space-y-3 pt-1">
          <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-amber-950/25 border border-amber-500/25 text-xs leading-relaxed">
            <p className="font-semibold text-amber-900 dark:text-amber-200 mb-1">
              Tous les adversaires sont à 0 point.
            </p>
            <p className="text-stone-600 dark:text-slate-300">
              Au Yaniv, l'annonceur victorieux marque 0 pt. Les adversaires doivent compter la valeur des cartes qui leur restent en main.
            </p>
          </div>

          <div className="px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-slate-800/80 text-[11px] text-stone-500 dark:text-slate-400 flex justify-between items-center">
            <span>Barème :</span>
            <span className="font-semibold text-stone-700 dark:text-slate-300">As 1 · Figures 10 · Joker 0</span>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowZeroConfirm(false)}
              className="w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white btn-margin-red cursor-pointer shadow-xs active:scale-[0.99] transition-all"
            >
              Saisir les points des adversaires
            </button>
          </div>
        </div>
      </Dialog>

      {/* BottomSheet de saisie précise de la main */}
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
      >
        {editingPlayer && (
          <div className="px-4 pt-1 pb-6 space-y-3">
            {/* Carte du joueur actif & Navigation Joueur précédent / Joueur suivant */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-stone-100/80 dark:bg-slate-800/60 border border-stone-200/80 dark:border-slate-700/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar
                  player={editingPlayer}
                  size="sm"
                  leader={callerId === editingPlayer.id || (isAssaf && assafRivalId === editingPlayer.id)}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm truncate text-stone-900 dark:text-slate-100">
                      {editingPlayer.name}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-stone-200/80 dark:bg-slate-700 text-stone-600 dark:text-slate-300 shrink-0">
                      {currentEditingIndex + 1}/{game.players.length}
                    </span>
                    {callerId === editingPlayer.id && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#c83b3b]/15 text-[#c83b3b] dark:text-red-300 shrink-0">
                        Annonceur Yaniv
                      </span>
                    )}
                    {isAssaf && assafRivalId === editingPlayer.id && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shrink-0">
                        Contreur Assaf
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-stone-500 dark:text-slate-400">
                    Total actuel : {game.scores[editingPlayer.id] || 0} pts
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={!hasPrevPlayer}
                  onClick={() => prevPlayer && setEditingPlayer(prevPlayer)}
                  className="p-1.5 rounded-lg border border-stone-200 dark:border-slate-700 disabled:opacity-25 disabled:pointer-events-none hover:bg-white dark:hover:bg-slate-700 text-stone-600 dark:text-slate-300 transition-all cursor-pointer active:scale-95"
                  title={prevPlayer ? `Précédent : ${prevPlayer.name}` : undefined}
                  aria-label="Joueur précédent"
                >
                  <ChevronLeft size={17} />
                </button>
                <button
                  type="button"
                  disabled={!hasNextPlayer}
                  onClick={() => nextPlayer && setEditingPlayer(nextPlayer)}
                  className="p-1.5 rounded-lg border border-stone-200 dark:border-slate-700 disabled:opacity-25 disabled:pointer-events-none hover:bg-white dark:hover:bg-slate-700 text-stone-600 dark:text-slate-300 transition-all cursor-pointer active:scale-95"
                  title={nextPlayer ? `Suivant : ${nextPlayer.name}` : undefined}
                  aria-label="Joueur suivant"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>

            <ScorePad
              key={editingPlayer.id}
              value={handPoints[editingPlayer.id] || 0}
              onChange={v => setHandPoints(prev => ({ ...prev, [editingPlayer.id]: Math.max(0, v) }))}
              onConfirm={handleConfirmPad}
              confirmLabel={confirmLabel}
              min={0}
              max={100}
              label="Points de la main"
              subLabel="Joker 0 · As 1 · Figures 10"
              presets={[0, 1, 2, 3, 4, 5, 10, 15, 20, 25, 30]}
              formatDisplay={v => `${v} pts`}
              formatTotal={v => {
                const isCaller = callerId === editingPlayer.id
                const isContreur = isAssaf && assafRivalId === editingPlayer.id
                let roundPts = v
                let note = ''
                if (!isAssaf && isCaller) {
                  roundPts = 0
                  note = ' (0 pt Yaniv réussi)'
                } else if (isAssaf && isCaller) {
                  roundPts = v + 30
                  note = ' (avec pénalité Assaf +30)'
                } else if (isAssaf && isContreur) {
                  roundPts = 0
                  note = ' (0 pt Contreur vainqueur)'
                }

                const cur = game.scores[editingPlayer.id] || 0
                const proj = cur + roundPts
                const sursis = checkSursis(proj)
                const finalProj = sursis !== null ? sursis : proj

                return `+${roundPts} pts${note} · Total : ${finalProj}/${LIMIT} pts${sursis !== null ? ` (Sursis retombe à ${sursis}!)` : ''}${finalProj >= LIMIT ? ' 💥 Éliminé' : ''}`
              }}
              baseScore={game.scores[editingPlayer.id] || 0}
              showPlus={false}
            />
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
