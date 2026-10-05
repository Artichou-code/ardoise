import { useState, useMemo } from 'react'
import { Trophy, Dices, LayoutGrid, Hash, Check, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { Avatar } from '../ui/Avatar'
import { QuickScoreBadge } from '../ui/QuickScoreBadge'
import { BottomSheet } from '../ui/BottomSheet'
import { ScorePad } from '../ui/ScorePad'
import { Dialog } from '../ui/Dialog'

// Définition des 13 catégories officielles de la feuille de marque du Yam's
export const YAM_CATEGORIES = [
  // Section Supérieure
  { id: 'ones', name: 'As (1)', section: 'upper', desc: 'Somme des dés 1', max: 5, presets: [0, 1, 2, 3, 4, 5] },
  { id: 'twos', name: 'Deux (2)', section: 'upper', desc: 'Somme des dés 2', max: 10, presets: [0, 2, 4, 6, 8, 10] },
  { id: 'threes', name: 'Trois (3)', section: 'upper', desc: 'Somme des dés 3', max: 15, presets: [0, 3, 6, 9, 12, 15] },
  { id: 'fours', name: 'Quatre (4)', section: 'upper', desc: 'Somme des dés 4', max: 20, presets: [0, 4, 8, 12, 16, 20] },
  { id: 'fives', name: 'Cinq (5)', section: 'upper', desc: 'Somme des dés 5', max: 25, presets: [0, 5, 10, 15, 20, 25] },
  { id: 'sixes', name: 'Six (6)', section: 'upper', desc: 'Somme des dés 6', max: 30, presets: [0, 6, 12, 18, 24, 30] },

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

  // Mode de saisie : 'grid' (grille officielle des 13 cases) ou 'direct' (score direct par manche)
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

    const grandTotal = upperSubtotal + bonusPoints + lowerSubtotal
    const filledTotal = upperFilledCount + lowerFilledCount

    return {
      upperSubtotal,
      hasBonus,
      bonusPoints,
      lowerSubtotal,
      grandTotal,
      filledTotal,
      isComplete: filledTotal === 13,
    }
  }

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
      current[catId] = Math.max(0, Number(value) || 0)
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

  return (
    <div className="space-y-3 pb-8">
      {/* Barre d'en-tête du jeu & bascule Grille / Direct */}
      <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl school-card border border-stone-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          <span className="p-1.5 rounded-xl bg-[#c83b3b]/10 text-[#c83b3b] shrink-0">
            <Dices size={16} />
          </span>
          <div className="min-w-0">
            <h3 className="font-serif-title font-bold text-xs sm:text-sm text-stone-900 dark:text-slate-100 truncate">
              Yam's
            </h3>
            <p className="text-[10px] text-stone-500 dark:text-slate-400 leading-snug">
              Grille de 13 cases · Bonus de 35 pts si section sup &ge; 63
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowRulesMemo(true)}
            className="p-1.5 rounded-xl border border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-500 dark:text-slate-400 transition-colors"
            title="Aide aux combinaisons"
          >
            <HelpCircle size={15} />
          </button>

          {/* Commutateur Grille 13 cases vs Total direct */}
          <div className="flex items-center p-0.5 bg-stone-100 dark:bg-slate-800 rounded-xl border border-stone-200/80 dark:border-slate-700/80">
            <button
              type="button"
              onClick={() => setInputMode('grid')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                inputMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-[#c83b3b] shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800 dark:text-slate-400'
              }`}
              title="Grille officielle des 13 cases"
            >
              <LayoutGrid size={12} />
              <span className="hidden sm:inline">Grille</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode('direct')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                inputMode === 'direct'
                  ? 'bg-white dark:bg-slate-700 text-[#c83b3b] shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800 dark:text-slate-400'
              }`}
              title="Saisie directe par manche"
            >
              <Hash size={12} />
              <span className="hidden sm:inline">Total</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cartes de saisie des joueurs */}
      <div className="space-y-3">
        {game.players.map((p) => {
          const stats = getPlayerGridScores(p.id)
          const pGrid = gridByPlayer[p.id] || {}

          return (
            <div
              key={p.id}
              className="p-3 sm:p-3.5 rounded-2xl school-card border border-stone-200/90 dark:border-slate-800 space-y-2.5"
            >
              {/* Entête du joueur : Avatar, Nom, Total général et statut Bonus */}
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar player={p} size="sm" />
                  <div className="min-w-0">
                    <span className="font-serif-title font-bold text-sm text-stone-900 dark:text-slate-100 truncate block">
                      {p.name}
                    </span>
                    <span className="text-[10px] text-stone-400 dark:text-slate-500">
                      {inputMode === 'grid'
                        ? `${stats.filledTotal}/13 cases remplies`
                        : `Score actuel : ${game.scores?.[p.id] || 0} pts`}
                    </span>
                  </div>
                </div>

                {/* Score total calculé et badge bonus */}
                <div className="flex items-center gap-2 shrink-0">
                  {inputMode === 'grid' && (
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-black text-[#c83b3b] tabular-nums">
                        {stats.grandTotal} pts
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        stats.hasBonus
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400'
                      }`}>
                        {stats.hasBonus ? '+35 Bonus' : `${stats.upperSubtotal}/63`}
                      </span>
                    </div>
                  )}

                  {inputMode === 'direct' && (
                    <QuickScoreBadge
                      value={directDelta[p.id] || 0}
                      onChange={(v) => setDirectDelta(prev => ({ ...prev, [p.id]: Math.max(0, Number(v) || 0) }))}
                      onOpenPad={() => setPadTarget({ playerId: p.id, catId: null })}
                      min={0}
                      max={50}
                      step={1}
                      showPlus={true}
                    />
                  )}
                </div>
              </div>

              {/* Mode Grille : Affichage des 13 cases organisées en 2 sections */}
              {inputMode === 'grid' && (
                <div className="space-y-3 pt-1">
                  {/* Section Supérieure */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-stone-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                      <span>Section Supérieure (1 à 6)</span>
                      <span>{stats.upperSubtotal}/63 pts</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                      {YAM_CATEGORIES.filter(c => c.section === 'upper').map((cat) => {
                        const val = pGrid[cat.id]
                        const isSet = val != null

                        return (
                          <div
                            key={cat.id}
                            className={`p-2 rounded-xl border flex flex-col justify-between gap-1.5 transition-all ${
                              isSet
                                ? 'border-[#c83b3b]/35 bg-[#c83b3b]/5 dark:bg-[#c83b3b]/10'
                                : 'border-stone-200/80 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-900/30'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full px-0.5">
                              <span className="text-[11px] font-bold text-stone-700 dark:text-slate-300 truncate">
                                {cat.name}
                              </span>
                              {isSet && (
                                <span className="text-[8px] font-black text-[#c83b3b]">
                                  ●
                                </span>
                              )}
                            </div>

                            <QuickScoreBadge
                              value={val}
                              onChange={(v) => handleCategoryValueChange(p.id, cat.id, v)}
                              onOpenPad={() => setPadTarget({ playerId: p.id, catId: cat.id })}
                              values={cat.presets}
                              min={0}
                              max={cat.max}
                              step={1}
                              compact={true}
                              formatDisplay={(v) => (v != null ? `${v}` : '—')}
                              showPlus={false}
                              className="w-full"
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Section Inférieure */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-stone-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                      <span>Section Inférieure (Combinaisons)</span>
                      <span>{stats.lowerSubtotal} pts</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
                      {YAM_CATEGORIES.filter(c => c.section === 'lower').map((cat) => {
                        const val = pGrid[cat.id]
                        const isSet = val != null

                        return (
                          <div
                            key={cat.id}
                            className={`p-2 rounded-xl border flex flex-col justify-between gap-1.5 transition-all ${
                              isSet
                                ? 'border-[#c83b3b]/35 bg-[#c83b3b]/5 dark:bg-[#c83b3b]/10'
                                : 'border-stone-200/80 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-900/30'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full px-0.5">
                              <span className="text-[11px] font-bold text-stone-700 dark:text-slate-300 truncate">
                                {cat.name}
                              </span>
                              {isSet && (
                                <span className="text-[8px] font-black text-[#c83b3b]">
                                  ●
                                </span>
                              )}
                            </div>

                            <QuickScoreBadge
                              value={val}
                              onChange={(v) => handleCategoryValueChange(p.id, cat.id, v)}
                              onOpenPad={() => setPadTarget({ playerId: p.id, catId: cat.id })}
                              values={cat.fixed ? cat.presets : undefined}
                              min={0}
                              max={cat.max}
                              step={1}
                              compact={true}
                              formatDisplay={(v) => (v != null ? `${v}` : '—')}
                              showPlus={false}
                              className="w-full"
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
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
          <span>Valider les scores</span>
        </button>
      </div>

      {/* Dialog Mémo des combinaisons officielles */}
      <Dialog
        open={showRulesMemo}
        onClose={() => setShowRulesMemo(false)}
        title="Combinaisons du Yam's (Hasbro / Classique)"
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

      {/* BottomSheet avec ScorePad pour saisie tactile au pavé numérique */}
      <BottomSheet open={!!padTarget} onClose={() => setPadTarget(null)}>
        {activePlayer && (
          <div className="px-4 pt-1 pb-6 space-y-3">
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

              {/* Navigation et actions */}
              <div className="flex items-center gap-1.5">
                {activeCategory && gridByPlayer[activePlayer.id]?.[activeCategory.id] != null && (
                  <button
                    type="button"
                    onClick={() => {
                      handleClearCategory(activePlayer.id, activeCategory.id)
                      setPadTarget(null)
                    }}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold text-stone-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-stone-200 dark:border-slate-700 transition-colors cursor-pointer"
                    title="Effacer et réinitialiser cette case"
                  >
                    Effacer
                  </button>
                )}
                <button
                  type="button"
                  onClick={handlePadPrev}
                  className="p-1.5 rounded-lg border border-stone-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
                  title="Précédent"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={handlePadNext}
                  className="p-1.5 rounded-lg border border-stone-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
                  title="Suivant"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            <ScorePad
              value={
                activeCategory
                  ? (gridByPlayer[activePlayer.id]?.[activeCategory.id] ?? 0)
                  : (directDelta[activePlayer.id] || 0)
              }
              onChange={(val) => {
                if (activeCategory) {
                  handleCategoryValueChange(activePlayer.id, activeCategory.id, val)
                } else {
                  setDirectDelta(prev => ({ ...prev, [activePlayer.id]: Math.max(0, Number(val) || 0) }))
                }
              }}
              onConfirm={handlePadNext}
              confirmLabel="Valider la case"
              label={activeCategory ? activeCategory.name : 'Score de la manche'}
              subLabel={activeCategory ? activeCategory.desc : 'Total des points'}
              min={0}
              max={activeCategory ? activeCategory.max : 50}
              step={1}
              presets={activeCategory ? activeCategory.presets : [0, 5, 10, 15, 20, 25, 30, 35, 40, 50]}
              baseScore={0}
              formatTotal={(val) => `${val} point${val > 1 ? 's' : ''}`}
              showPlus={false}
            />
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
