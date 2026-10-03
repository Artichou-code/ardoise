import { useState } from 'react'
import { AlertTriangle, Shield, Check, Flame, Trophy, X } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { Avatar } from '../ui/Avatar'
import { QuickScoreBadge } from '../ui/QuickScoreBadge'
import { BottomSheet } from '../ui/BottomSheet'
import { ScorePad } from '../ui/ScorePad'

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
  const [reprieveNotice, setReprieveNotice] = useState(null)

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
                <Avatar player={p} size="xs" leader={isCaller} />
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
          onClick={() => setIsAssaf(v => !v)}
          className={`w-full p-2.5 px-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer mb-3 select-none active:scale-[0.99] ${
            isAssaf
              ? 'border-[#c83b3b] bg-[#c83b3b]/10 text-stone-900 dark:text-slate-100 ring-1 ring-[#c83b3b]/30'
              : 'school-subtle text-stone-600 dark:text-slate-400 hover:border-[#c83b3b]/50'
          }`}
        >
          <div className="text-left min-w-0 pr-2">
            <div className="flex items-center gap-1.5">
              <Flame size={14} className={isAssaf ? 'text-[#c83b3b]' : 'text-stone-400 dark:text-slate-500'} />
              <span className="font-bold text-xs leading-tight">Contre « ASSAF ! » (adversaire ≤ annonceur)</span>
            </div>
            <span className="text-[10px] text-stone-500 dark:text-slate-400 block mt-0.5 pl-[20px] truncate">
              {isAssaf
                ? 'Annonceur subit +30 pts de malus · Le contreur marque 0 pt'
                : 'Activer si un adversaire a égalé ou battu l’annonceur'}
            </span>
          </div>
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all shrink-0 ${
            isAssaf ? 'bg-[#c83b3b] text-white shadow-2xs' : 'bg-stone-200/80 dark:bg-slate-700/80 text-stone-600 dark:text-slate-300'
          }`}>
            {isAssaf ? 'ASSAF ! (+30)' : 'Non'}
          </span>
        </button>

        {/* Si ASSAF : Sélecteur du contreur qui a le score le plus bas et marque 0 pt */}
        {isAssaf && (
          <div className="mb-3 p-2.5 rounded-xl border border-amber-300/80 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-1.5">
              <Check size={13} className="text-amber-600 dark:text-amber-400" />
              Qui a contré avec le score le plus bas (marque 0 pt) ?
            </p>
            <div className="flex flex-wrap gap-1.5">
              {game.players.filter(p => p.id !== callerId).map(p => {
                const isRival = assafRivalId === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setAssafRivalId(p.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      isRival
                        ? 'border-amber-600 bg-amber-600 text-white shadow-2xs'
                        : 'border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-stone-700 dark:text-slate-300 hover:border-amber-500'
                    }`}
                  >
                    <Avatar player={p} size="2xs" />
                    <span>{p.name}</span>
                    {isRival && <Check size={12} className="text-white ml-0.5" />}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Liste des points de main par joueur */}
        <div className="pt-2 border-t border-stone-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 shrink-0">
              Valeur des cartes en main
            </p>
            <span className="text-[10px] text-stone-400 dark:text-slate-500 truncate text-right">
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
                const label = !isAssaf ? 'Yaniv' : 'Assaf'
                return (
                  <div
                    key={p.id}
                    className="px-3 py-2 rounded-xl border border-emerald-300/80 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar player={p} size="xs" leader />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm truncate">{p.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white whitespace-nowrap">
                            {label}
                          </span>
                        </div>
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium truncate block">
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
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm truncate">{p.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#c83b3b] text-white whitespace-nowrap">
                            Assaf (+30)
                          </span>
                          {danger && <AlertTriangle size={13} className="text-[#c83b3b] shrink-0" />}
                        </div>
                        <span className="text-[11px] text-stone-500 dark:text-slate-400 block truncate">
                          Total : {currentTotal} pts · <strong className="text-[#c83b3b]">+{delta} pts</strong> ({rawPts}+30)
                          {sursisVal !== null && (
                            <span className="ml-1 text-emerald-600 dark:text-emerald-400 font-bold">
                              ➔ Sursis : {sursisVal} pts !
                            </span>
                          )}
                        </span>
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
                      <span className="text-[11px] text-stone-500 dark:text-slate-400 block truncate">
                        Total : {currentTotal} pts {delta > 0 && (
                          <span className="text-[#c83b3b] font-bold">
                            (+{delta} = {projected})
                            {sursisVal !== null && (
                              <span className="ml-1 text-emerald-600 dark:text-emerald-400 font-bold">
                                ➔ Sursis : {sursisVal} pts !
                              </span>
                            )}
                          </span>
                        )}
                      </span>
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
            onClick={submitRound}
            className="w-full py-2.5 rounded-xl bg-[#c83b3b] hover:bg-[#b03030] text-white font-bold text-sm shadow-sm transition-all active:scale-[0.99] cursor-pointer"
          >
            Valider la manche
          </button>
        </div>
      </div>

      {/* BottomSheet de saisie précise de la main */}
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title={editingPlayer ? `Points en main de ${editingPlayer.name}` : 'Points en main'}
        subtitle="Joker (0 pt) · As (1 pt) · 2 à 10 (valeur faciale) · Figures (10 pts)"
      >
        {editingPlayer && (
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Avatar player={editingPlayer} size="md" />
              <div>
                <span className="font-bold text-base block">{editingPlayer.name}</span>
                <span className="text-xs text-stone-500 dark:text-slate-400">
                  Total actuel : {game.scores[editingPlayer.id] || 0} pts
                </span>
              </div>
            </div>

            <ScorePad
              value={handPoints[editingPlayer.id] || 0}
              onChange={v => setHandPoints(prev => ({ ...prev, [editingPlayer.id]: Math.max(0, v) }))}
              onConfirm={() => setOpen(false)}
              min={0}
              max={100}
              presets={[0, 1, 2, 3, 4, 5, 10, 15, 20, 25, 30]}
            />
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
