import { useState } from 'react'
import { Anchor, Trophy, AlertCircle, Waves, ChevronLeft, ChevronRight } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { Avatar } from '../ui/Avatar'
import { QuickScoreBadge } from '../ui/QuickScoreBadge'
import { BottomSheet } from '../ui/BottomSheet'
import { ScorePad } from '../ui/ScorePad'
import { Dialog } from '../ui/Dialog'

export function SeaSaltPaperEngine({ game, onFinish }) {
  const { updateScores } = useGame()

  // Seuil automatique officiel selon le nombre de joueurs
  const defaultLimit = game.players.length === 2 ? 40 : game.players.length === 3 ? 35 : 30
  const TARGET_SCORE = game.config?.limit || defaultLimit

  const [roundScores, setRoundScores] = useState(() => {
    const initial = {}
    for (const p of game.players) {
      initial[p.id] = (game.restoredDelta && game.restoredDelta[p.id] != null)
        ? game.restoredDelta[p.id]
        : 0
    }
    return initial
  })

  // Mode de clôture : 'stop' | 'last_chance_won' | 'last_chance_lost' | 'free'
  const [closingMode, setClosingMode] = useState(() => {
    return game.restoredRound?.closingMode || 'stop'
  })

  // Qui a annoncé la fin de manche ?
  const [announcerId, setAnnouncerId] = useState(() => {
    return game.restoredRound?.announcerId || game.players[0]?.id || null
  })

  const [editingPlayer, setEditingPlayer] = useState(null)
  const [open, setOpen] = useState(false)
  const [validationError, setValidationError] = useState(null)
  const [sirensConfirmPlayer, setSirensConfirmPlayer] = useState(null)
  const [sirensSelectorOpen, setSirensSelectorOpen] = useState(false)

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

  // Victoire immédiate des 4 sirènes
  const handleFourSirensVictory = (playerId) => {
    const newScores = { ...game.scores, [playerId]: (game.scores[playerId] || 0) + 100 }
    updateScores({
      scores: newScores,
      delta: { [playerId]: 100 },
      specialWin: 'four_sirens',
      winnerId: playerId,
      type: 'sea_salt_paper',
    })
    onFinish(playerId)
  }

  const submitRound = () => {
    const newScores = {}
    const delta = {}

    for (const p of game.players) {
      const pts = roundScores[p.id] || 0
      delta[p.id] = pts
      newScores[p.id] = (game.scores[p.id] || 0) + pts
    }

    updateScores({
      scores: newScores,
      delta,
      closingMode,
      announcerId,
      type: 'sea_salt_paper',
    })

    setRoundScores(Object.fromEntries(game.players.map(p => [p.id, 0])))

    // Vérification de victoire par seuil
    const winners = Object.entries(newScores).filter(([, s]) => s >= TARGET_SCORE)
    if (winners.length > 0) {
      const winner = Object.entries(newScores).sort((a, b) => b[1] - a[1])[0][0]
      onFinish(winner)
    }
  }

  const handleValidate = () => {
    const allZero = Object.values(roundScores).every(v => v === 0)
    if (allZero) {
      setValidationError({
        title: "Scores à 0 point",
        message: "Tous les joueurs ont un score de 0 point sur cette manche. Avez-vous bien compté les points des cartes de chaque joueur ?",
      })
      return
    }

    if (closingMode !== 'stop') {
      const announcerPts = roundScores[announcerId] || 0
      if (announcerPts < 7) {
        const announcer = game.players.find(p => p.id === announcerId)
        setValidationError({
          title: "Annonce impossible (< 7 pts)",
          message: `À Sea Salt & Paper, l'annonceur (${announcer?.name || 'sélectionné'}) doit posséder au moins 7 points dans sa main pour tenter une Dernière Chance (score actuel : ${announcerPts} pts).`,
        })
        return
      }
    } else {
      const maxPts = Math.max(...Object.values(roundScores))
      if (maxPts < 7) {
        setValidationError({
          title: "Clôture impossible (< 7 pts)",
          message: "Pour clore la manche (STOP), au moins un joueur doit posséder au moins 7 points dans sa main.",
        })
        return
      }
    }

    submitRound()
  }

  return (
    <div className="space-y-2 pt-0">
      {/* Sélecteur de clôture de manche */}
      <div className="school-card rounded-xl p-3 sm:p-4">
        <div className="flex items-center justify-between gap-1.5 mb-2">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 flex items-center gap-1.5 min-w-0">
            <Waves size={14} className="text-sky-600 dark:text-sky-400 shrink-0" />
            <span className="truncate">Fin de manche (≥ 7 pts)</span>
          </p>
          <span className="text-[11px] font-semibold text-stone-400 dark:text-slate-500 shrink-0">
            Objectif : {TARGET_SCORE} pts
          </span>
        </div>

        {/* Choix du mode d'annonce */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-2">
          {/* Bouton STOP : Pleine largeur sur mobile, 1 colonne sur tablette/PC */}
          <button
            type="button"
            onClick={() => setClosingMode('stop')}
            className={`col-span-2 sm:col-span-1 p-2 rounded-xl text-left border transition-all cursor-pointer select-none active:scale-[0.99] flex items-center justify-between sm:block ${
              closingMode === 'stop'
                ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 text-sky-950 dark:text-sky-200 ring-1 ring-sky-400/40 shadow-2xs'
                : 'bg-stone-50 dark:bg-slate-800/60 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-400 hover:border-sky-300'
            }`}
          >
            <div>
              <span className="block text-xs font-bold leading-tight">STOP</span>
              <span className="block text-[10px] text-stone-400 dark:text-slate-500 mt-0.5">Comptage normal</span>
            </div>
            {closingMode === 'stop' && (
              <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 sm:hidden">Actif</span>
            )}
          </button>

          {/* Bouton Dernière Chance réussie */}
          <button
            type="button"
            onClick={() => setClosingMode('last_chance_won')}
            className={`col-span-1 p-2 rounded-xl text-left border transition-all cursor-pointer select-none active:scale-[0.99] ${
              closingMode === 'last_chance_won'
                ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 text-sky-950 dark:text-sky-200 ring-1 ring-sky-400/40 shadow-2xs'
                : 'bg-stone-50 dark:bg-slate-800/60 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-400 hover:border-sky-300'
            }`}
          >
            <span className="block text-xs font-bold leading-tight truncate">
              D. Chance <span className="text-emerald-600 dark:text-emerald-400">réussie</span>
            </span>
            <span className="block text-[10px] text-stone-400 dark:text-slate-500 mt-0.5 truncate">
              Auteur &gt; Rivaux
            </span>
          </button>

          {/* Bouton Dernière Chance ratée */}
          <button
            type="button"
            onClick={() => setClosingMode('last_chance_lost')}
            className={`col-span-1 p-2 rounded-xl text-left border transition-all cursor-pointer select-none active:scale-[0.99] ${
              closingMode === 'last_chance_lost'
                ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 text-sky-950 dark:text-sky-200 ring-1 ring-sky-400/40 shadow-2xs'
                : 'bg-stone-50 dark:bg-slate-800/60 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-400 hover:border-sky-300'
            }`}
          >
            <span className="block text-xs font-bold leading-tight truncate">
              D. Chance <span className="text-[#c83b3b] dark:text-red-400">ratée</span>
            </span>
            <span className="block text-[10px] text-stone-400 dark:text-slate-500 mt-0.5 truncate">
              Auteur contré
            </span>
          </button>
        </div>

        {/* Si Dernière chance : sélection du joueur qui a annoncé */}
        {closingMode !== 'stop' && (
          <div className="p-2.5 rounded-xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/50 mb-2">
            <div className="flex items-center justify-between gap-1.5 mb-2">
              <span className="text-xs font-bold text-sky-900 dark:text-sky-300 flex items-center gap-1.5 min-w-0">
                <span className="truncate">Annonceur Dernière Chance :</span>
              </span>
              <span className="text-[10px] text-sky-700 dark:text-sky-300 font-semibold shrink-0">
                Min. 7 pts
              </span>
            </div>
            <div className={`grid gap-1.5 ${
              game.players.length === 2 ? 'grid-cols-2' :
              game.players.length === 3 ? 'grid-cols-3' :
              'grid-cols-2 sm:grid-cols-4'
            }`}>
              {game.players.map(p => {
                const isAnnouncer = announcerId === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setAnnouncerId(p.id)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none active:scale-[0.98] min-w-0 ${
                      isAnnouncer
                        ? 'bg-sky-600 text-white border-sky-600 shadow-2xs ring-1 ring-sky-500/40'
                        : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-300 hover:border-sky-300'
                    }`}
                  >
                    <Avatar player={p} size="xs" leader={isAnnouncer} leaderColor="#0284c7" />
                    <span className="truncate">{p.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Saisie des points par joueur */}
        <div className="space-y-1.5">
          {game.players.map(p => {
            const currentTotal = game.scores[p.id] || 0
            const roundPts = roundScores[p.id] || 0
            const projected = currentTotal + roundPts
            const isNearWin = projected >= TARGET_SCORE
            const isAnnouncer = announcerId === p.id && closingMode !== 'stop'

            return (
              <div
                key={p.id}
                className={`px-3 py-2 rounded-xl border transition-all ${
                  isNearWin
                    ? 'border-emerald-400 bg-emerald-500/5'
                    : isAnnouncer
                    ? 'border-sky-300 dark:border-sky-800 bg-sky-500/5'
                    : 'school-subtle hover:border-stone-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => { setEditingPlayer(p); setOpen(true) }}
                    className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer select-none"
                  >
                    <Avatar player={p} size="xs" leader={isAnnouncer} leaderColor="#0284c7" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm truncate">{p.name}</span>
                        {isAnnouncer && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 shrink-0">
                            Annonceur
                          </span>
                        )}
                        {isNearWin && <Trophy size={13} className="text-emerald-600 shrink-0" />}
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-slate-400 flex items-center gap-1 min-w-0">
                        {roundPts > 0 ? (
                          <span className="truncate">
                            Total : {currentTotal} <strong className="text-sky-600 dark:text-sky-400 font-bold whitespace-nowrap">➔ {projected} pts</strong>
                          </span>
                        ) : (
                          <span className="truncate">Total : {currentTotal} pts</span>
                        )}
                      </div>
                    </div>
                  </button>

                  <QuickScoreBadge
                    value={roundPts}
                    onChange={v => setRoundScores(prev => ({ ...prev, [p.id]: Math.max(0, v) }))}
                    onOpenPad={() => { setEditingPlayer(p); setOpen(true) }}
                    min={0}
                    step={1}
                    showPlus={true}
                    formatBubble={(v) => {
                      const proj = currentTotal + v
                      if (proj >= TARGET_SCORE) {
                        return { text: `🏆 ${proj} pts (Gagné !)`, variant: 'success' }
                      }
                      return { text: `= ${proj} pts`, variant: 'default' }
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Action exceptionnelle : Victoire immédiate des 4 Sirènes */}
        <div className="pt-2 flex justify-center">
          <button
            type="button"
            onClick={() => setSirensSelectorOpen(true)}
            className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 py-1.5 px-3 rounded-full border border-amber-300/80 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/25 hover:bg-amber-100/80 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
            title="Déclarer une victoire instantanée d'un joueur qui possède les 4 cartes Sirènes"
          >
            <span>🧜</span>
            <span>Déclarer une victoire des 4 Sirènes</span>
          </button>
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

      {/* Dialog d'erreur de validation (score impossible ou < 7 pts) */}
      <Dialog
        open={!!validationError}
        onClose={() => setValidationError(null)}
        title={validationError?.title || "Score impossible"}
      >
        <div className="space-y-3 text-xs">
          <p className="text-stone-600 dark:text-slate-300 leading-relaxed">
            {validationError?.message}
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setValidationError(null)}
              className="w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white btn-margin-red cursor-pointer shadow-xs active:scale-[0.99] transition-all"
            >
              Ajuster les scores
            </button>
          </div>
        </div>
      </Dialog>

      {/* Dialog de sélection du joueur pour les 4 Sirènes */}
      <Dialog
        open={sirensSelectorOpen}
        onClose={() => setSirensSelectorOpen(false)}
        title="Victoire immédiate des 4 Sirènes"
      >
        <div className="space-y-3 text-xs">
          <p className="text-stone-600 dark:text-slate-300 leading-relaxed">
            Quel joueur possède les <strong>4 cartes Sirènes</strong> en main ?
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {game.players.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSirensSelectorOpen(false)
                  setSirensConfirmPlayer(p)
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-amber-300/80 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/25 hover:bg-amber-100 font-bold text-xs text-stone-800 dark:text-slate-200 cursor-pointer transition-all active:scale-95 text-left min-w-0"
              >
                <Avatar player={p} size="xs" />
                <span className="truncate">{p.name}</span>
              </button>
            ))}
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/50 text-amber-900 dark:text-amber-200 text-[11px] leading-relaxed">
            Cette combinaison mythique met <strong>fin immédiatement à la partie</strong> et octroie la victoire à son détenteur !
          </div>
        </div>
      </Dialog>

      {/* Dialog de confirmation pour la victoire des 4 Sirènes */}
      <Dialog
        open={!!sirensConfirmPlayer}
        onClose={() => setSirensConfirmPlayer(null)}
        title="Victoire immédiate des 4 Sirènes"
      >
        <div className="space-y-3 text-xs">
          <p className="text-stone-600 dark:text-slate-300 leading-relaxed">
            Confirmer que <strong>{sirensConfirmPlayer?.name}</strong> possède les <strong>4 cartes Sirènes</strong> ?
          </p>
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/50 text-amber-900 dark:text-amber-200">
            Cette combinaison mythique met <strong>fin immédiatement à la partie</strong> et octroie la victoire à son détenteur !
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSirensConfirmPlayer(null)}
              className="flex-1 py-2 rounded-xl font-semibold border border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => {
                const p = sirensConfirmPlayer
                setSirensConfirmPlayer(null)
                if (p) handleFourSirensVictory(p.id)
              }}
              className="flex-1 py-2 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-xs cursor-pointer"
            >
              Confirmer la victoire
            </button>
          </div>
        </div>
      </Dialog>

      {/* BottomSheet saisie de score */}
      <BottomSheet open={open} onClose={() => setOpen(false)}>
        {editingPlayer && (
          <div className="px-4 pt-1 pb-6 space-y-3">
            {/* Carte du joueur actif & Navigation Joueur précédent / Joueur suivant */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-stone-100/80 dark:bg-slate-800/60 border border-stone-200/80 dark:border-slate-700/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar
                  player={editingPlayer}
                  size="sm"
                  leader={announcerId === editingPlayer.id}
                  leaderColor="#0284c7"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm truncate text-stone-900 dark:text-slate-100">
                      {editingPlayer.name}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-stone-200/80 dark:bg-slate-700 text-stone-600 dark:text-slate-300 shrink-0">
                      {currentEditingIndex + 1}/{game.players.length}
                    </span>
                  </div>
                  <span className="text-xs text-stone-500 dark:text-slate-400 block whitespace-nowrap truncate mt-0.5">
                    Total actuel : {game.scores[editingPlayer.id] || 0} pts
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 shrink-0">
                {announcerId === editingPlayer.id ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-400/30">
                    Annonceur (≥ 7 pts)
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAnnouncerId(editingPlayer.id)}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-sky-300 dark:border-sky-700 bg-sky-50/50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 hover:bg-sky-100 transition-colors cursor-pointer whitespace-nowrap"
                    title="Désigner ce joueur comme annonceur"
                  >
                    Définir annonceur
                  </button>
                )}

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={!hasPrevPlayer}
                    onClick={() => prevPlayer && setEditingPlayer(prevPlayer)}
                    className="p-1.5 rounded-lg border border-stone-200 dark:border-slate-700 disabled:opacity-25 disabled:pointer-events-none hover:bg-white dark:hover:bg-slate-700 text-stone-600 dark:text-slate-300 transition-all cursor-pointer active:scale-95"
                    title={prevPlayer ? `Précédent : ${prevPlayer.name}` : undefined}
                    aria-label="Joueur précédent"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    disabled={!hasNextPlayer}
                    onClick={() => nextPlayer && setEditingPlayer(nextPlayer)}
                    className="p-1.5 rounded-lg border border-stone-200 dark:border-slate-700 disabled:opacity-25 disabled:pointer-events-none hover:bg-white dark:hover:bg-slate-700 text-stone-600 dark:text-slate-300 transition-all cursor-pointer active:scale-95"
                    title={nextPlayer ? `Suivant : ${nextPlayer.name}` : undefined}
                    aria-label="Joueur suivant"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            <ScorePad
              key={editingPlayer.id}
              value={roundScores[editingPlayer.id] || 0}
              onChange={v => setRoundScores(prev => ({ ...prev, [editingPlayer.id]: Math.max(0, v) }))}
              onConfirm={handleConfirmPad}
              confirmLabel={confirmLabel}
              min={0}
              step={1}
              label="Points de la manche"
              subLabel={`Objectif : ${TARGET_SCORE} pts`}
              presets={[0, 7, 8, 9, 10, 11, 12, 13, 14, 15]}
              formatDisplay={v => `${v} pts`}
              formatTotal={val => {
                const isAnnouncer = announcerId === editingPlayer.id
                const cur = game.scores[editingPlayer.id] || 0
                const proj = cur + val
                const isWin = proj >= TARGET_SCORE
                if (isAnnouncer && val < 7) {
                  return {
                    text: `+${val} pts (Min. 7 pts) · Total : ${proj}/${TARGET_SCORE} pts`,
                    variant: 'danger',
                  }
                }
                return {
                  text: `+${val} pts · Total : ${proj}/${TARGET_SCORE} pts${isWin ? ' (Gagné !)' : ''}`,
                  variant: 'default',
                }
              }}
              baseScore={game.scores[editingPlayer.id] || 0}
              showPlus={false}
              customButtons={[
                { label: '0', delta: -(roundScores[editingPlayer.id] || 0) },
                { label: '+1', delta: 1 },
                { label: '+5', delta: 5 },
                { label: '+7 (Seuil)', delta: 7 },
                { label: '+10', delta: 10 },
              ]}
            />

            {/* Déclarer les 4 Sirènes pour le joueur actif */}
            <div className="pt-1 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  setSirensConfirmPlayer(editingPlayer)
                }}
                className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 py-1 px-3 rounded-full border border-amber-300/80 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/25 hover:bg-amber-100/80 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
              >
                <span>🧜</span>
                <span>Déclarer une victoire des 4 Sirènes pour {editingPlayer.name}</span>
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
