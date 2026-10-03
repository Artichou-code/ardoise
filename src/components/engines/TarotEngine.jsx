import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { computeTarotScore } from '../../engines/gameEngines'
import { TAROT_CONTRACTS, TAROT_BOUTS_THRESHOLDS } from '../../constants/games'
import { Avatar } from '../ui/Avatar'
import { QuickScoreBadge } from '../ui/QuickScoreBadge'
import { BottomSheet } from '../ui/BottomSheet'
import { ScorePad } from '../ui/ScorePad'

export function TarotEngine({ game }) {
  const { updateScores } = useGame()
  const playerCount = game.players.length

  const [attackerId, setAttackerId] = useState(() => game.restoredRound?.attackerId || null)
  const [partnerId, setPartnerId] = useState(() => game.restoredRound?.partnerId || null)
  const [contract, setContract] = useState(() => game.restoredRound?.contract || 'garde')
  const [bouts, setBouts] = useState(() => game.restoredRound?.bouts ?? 2)
  const [points, setPoints] = useState(() => game.restoredRound?.points ?? 41)
  const [petitAuBout, setPetitAuBout] = useState(() => game.restoredRound?.petitAuBout || 'none')

  const [openPointsSheet, setOpenPointsSheet] = useState(false)

  const contractMeta = TAROT_CONTRACTS.find(c => c.id === contract) || TAROT_CONTRACTS[0]
  const threshold = TAROT_BOUTS_THRESHOLDS[bouts]
  const diff = points - threshold
  const won = diff >= 0

  let petitBonus = 0
  if (petitAuBout === 'attack') petitBonus = 10
  else if (petitAuBout === 'defense') petitBonus = -10

  const signedBase = (won ? 25 + Math.abs(diff) : -(25 + Math.abs(diff))) + petitBonus
  const unitScore = signedBase * contractMeta.multiplier

  // Calcul prévisionnel des points pour l'affichage en direct
  let previewAttacker = 0
  let previewPartner = 0
  let previewDefense = 0
  if (attackerId) {
    if (playerCount === 5 && partnerId && partnerId !== attackerId) {
      previewAttacker = unitScore * 2
      previewPartner = unitScore
      previewDefense = -unitScore
    } else {
      previewAttacker = unitScore * (playerCount - 1)
      previewDefense = -unitScore
    }
  }

  const submitRound = () => {
    if (!attackerId) return
    const result = computeTarotScore({
      players: game.players,
      attackerId,
      partnerId,
      contract,
      bouts,
      points,
      playerCount,
      petitAuBout,
    })
    const newScores = {}
    const delta = {}
    for (const p of game.players) {
      delta[p.id] = result.scores[p.id] || 0
      newScores[p.id] = (game.scores[p.id] || 0) + (result.scores[p.id] || 0)
    }
    updateScores({
      scores: newScores,
      delta,
      result,
      attackerId,
      partnerId,
      contract,
      bouts,
      points,
      petitAuBout,
      type: 'tarot',
    })
    setAttackerId(null)
    setPartnerId(null)
    setContract('garde')
    setBouts(2)
    setPoints(41)
    setPetitAuBout('none')
  }

  return (
    <div className="space-y-2.5 pt-0 select-none">
      {/* 1. Preneur (& Partenaire à 5 joueurs) */}
      <div className="school-card rounded-xl p-3 sm:p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
            Preneur (Attaque)
          </p>
          <span className="text-[11px] font-semibold text-stone-400 dark:text-slate-500">
            {playerCount} joueurs
          </span>
        </div>

        {/* Grille compacte des joueurs */}
        <div className={`grid ${playerCount <= 4 ? 'grid-cols-4' : 'grid-cols-5'} gap-1.5`}>
          {game.players.map(p => {
            const isSelected = attackerId === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setAttackerId(p.id)
                  if (partnerId === p.id) setPartnerId(null)
                }}
                className={`py-2 px-1 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#c83b3b] bg-[#c83b3b] text-white shadow-2xs'
                    : 'school-subtle hover:border-[#c83b3b]/40 text-stone-700 dark:text-slate-200'
                }`}
              >
                <Avatar player={p} size="xs" leader={isSelected} />
                <span className={`text-[11px] font-semibold truncate max-w-full text-center ${isSelected ? 'text-white' : ''}`}>
                  {p.name}
                </span>
              </button>
            )
          })}
        </div>

        {/* Si 5 joueurs : sélection intégrée du partenaire appelé au Roi */}
        {playerCount === 5 && (
          <div className="pt-2 border-t border-stone-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-stone-600 dark:text-slate-300">
                Partenaire appelé (au Roi) :
              </span>
              <span className="text-[10px] text-stone-400">
                {partnerId ? '2 contre 3' : 'Seul contre 4'}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              <button
                type="button"
                onClick={() => setPartnerId(null)}
                className={`py-1.5 px-1 rounded-lg border text-center text-xs font-bold transition-all cursor-pointer ${
                  !partnerId
                    ? 'border-stone-800 bg-stone-800 text-white dark:border-slate-200 dark:bg-slate-200 dark:text-stone-900 shadow-2xs'
                    : 'school-subtle text-stone-600 dark:text-slate-400'
                }`}
              >
                Seul
              </button>
              {game.players.map(p => {
                if (p.id === attackerId) return null
                const isPartner = partnerId === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPartnerId(p.id)}
                    className={`py-1.5 px-1 rounded-lg border text-center text-xs font-bold transition-all cursor-pointer truncate ${
                      isPartner
                        ? 'border-amber-600 bg-amber-600 text-white shadow-2xs'
                        : 'school-subtle text-stone-700 dark:text-slate-300'
                    }`}
                  >
                    {p.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Contrat & Petit au bout (inspiré du bloc Enchère/Coinche de Belote) */}
      <div className="school-card rounded-xl p-3 sm:p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
            Contrat & Enchère
          </p>
          <span className="text-[11px] font-bold text-[#c83b3b]">
            Multiplicateur : ×{contractMeta.multiplier}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {TAROT_CONTRACTS.map(c => {
            const isSelected = contract === c.id
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setContract(c.id)}
                className={`py-2 px-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#c83b3b] bg-[#c83b3b] text-white shadow-2xs'
                    : 'school-subtle hover:border-[#c83b3b]/40 text-stone-700 dark:text-slate-300'
                }`}
              >
                <span className="font-bold text-xs leading-none">{c.label}</span>
                <span className={`text-[11px] font-bold ${isSelected ? 'text-white/90' : 'text-[#c83b3b] dark:text-rose-400'}`}>
                  ×{c.multiplier}
                </span>
              </button>
            )
          })}
        </div>

        {/* Petit au bout */}
        <div className="pt-2 border-t border-stone-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-stone-600 dark:text-slate-300">
              Petit au bout :
            </span>
            <span className="text-[10px] text-stone-400">±10 pts × {contractMeta.multiplier}</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'none', label: 'Aucun', sub: '0 pt' },
              { id: 'attack', label: 'Attaque', sub: `+${10 * contractMeta.multiplier}` },
              { id: 'defense', label: 'Défense', sub: `-${10 * contractMeta.multiplier}` },
            ].map(opt => {
              const isSelected = petitAuBout === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPetitAuBout(opt.id)}
                  className={`py-1.5 px-1 rounded-xl text-center border font-semibold text-xs transition-all cursor-pointer ${
                    isSelected
                      ? opt.id === 'attack'
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xs'
                        : opt.id === 'defense'
                        ? 'border-[#c83b3b] bg-[#c83b3b] text-white shadow-2xs'
                        : 'border-stone-800 bg-stone-800 dark:border-slate-200 dark:bg-slate-200 text-white dark:text-stone-900 shadow-2xs'
                      : 'school-subtle text-stone-700 dark:text-slate-300'
                  }`}
                >
                  <span className="block font-bold leading-tight">{opt.label}</span>
                  <span className={`block text-[10px] ${isSelected ? 'text-white/80' : 'text-stone-400 dark:text-slate-500'}`}>
                    {opt.sub}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 3. Points réalisés & Bouts (modèle 2 colonnes Belote avec QuickScoreBadge tall) */}
      <div className="school-card rounded-xl p-3 sm:p-3.5 flex items-stretch gap-3">
        {/* Colonne gauche : Titre, sous-titre, sélecteur de bouts et raccourcis */}
        <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
          <button
            type="button"
            onClick={() => setOpenPointsSheet(true)}
            className="text-left cursor-pointer focus:outline-none group/title"
          >
            <div className="flex items-center gap-1">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 leading-tight group-hover/title:text-[#c83b3b] transition-colors">
                Points de l'attaque (/ 91)
              </p>
              <ChevronRight size={12} className="opacity-40 group-hover/title:opacity-100 group-hover/title:translate-x-0.5 transition-all text-stone-400 group-hover/title:text-[#c83b3b]" />
            </div>

            {/* Statut dynamique Réussi / Chuté avec score - strictement sur 1 ligne fixe sans wrap pour éviter tout saut de hauteur */}
            <div className="flex items-center gap-1.5 mt-0.5 whitespace-nowrap overflow-hidden min-h-[1.125rem]">
              <span className={`text-[11px] font-bold shrink-0 ${
                won ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#c83b3b]'
              }`}>
                {won ? `Réussi (+${diff} pts)` : `Chuté (${diff} pts)`}
              </span>
              <span className="text-[10px] text-stone-400 dark:text-slate-500 truncate">
                · Défense : {91 - points} pts
              </span>
            </div>
          </button>

          {/* Sélecteur de Bouts direct */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 block mb-1">
              Bouts possédés (Seuil : {threshold} pts) :
            </span>
            <div className="grid grid-cols-4 gap-1">
              {[0, 1, 2, 3].map(n => {
                const isSelected = bouts === n
                const th = TAROT_BOUTS_THRESHOLDS[n]
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      setBouts(n)
                      if (points === threshold) {
                        setPoints(th)
                      }
                    }}
                    className={`py-1.5 px-0.5 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      isSelected
                        ? 'border-[#c83b3b] bg-[#c83b3b] text-white shadow-2xs'
                        : 'school-subtle hover:border-[#c83b3b]/40 text-stone-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-xs font-black leading-none">{n} {n > 1 ? 'Bouts' : 'Bout'}</span>
                    <span className={`text-[10px] font-semibold mt-0.5 ${isSelected ? 'text-white/90' : 'text-stone-400 dark:text-slate-500'}`}>
                      {th} pts
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Colonne droite : QuickScoreBadge tactile pleine hauteur */}
        <QuickScoreBadge
          value={points}
          onChange={setPoints}
          onOpenPad={() => setOpenPointsSheet(true)}
          min={0}
          max={91}
          step={1}
          showPlus={false}
          tall={true}
          formatDisplay={val => val}
          formatSub={val => (val >= threshold ? `+${val - threshold}` : `${val - threshold}`)}
        />
      </div>

      {/* 4. Encart prévisionnel en direct (si preneur sélectionné) */}
      {attackerId && (
        <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-slate-700 flex items-center justify-between text-xs whitespace-nowrap overflow-hidden min-h-[38px]">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-bold text-stone-700 dark:text-slate-300 truncate">
              {won ? '🎯 Réussi' : '💥 Chuté'} :
            </span>
            <span className={`font-bold ${won ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#c83b3b]'}`}>
              Preneur ({previewAttacker > 0 ? `+${previewAttacker}` : previewAttacker} pts)
            </span>
            {playerCount === 5 && partnerId && (
              <span className="text-amber-600 dark:text-amber-400 font-bold truncate">
                · Partenaire ({previewPartner > 0 ? `+${previewPartner}` : previewPartner})
              </span>
            )}
          </div>
          <span className="text-[11px] font-semibold text-stone-500 dark:text-slate-400 shrink-0 ml-2">
            Défense : {previewDefense > 0 ? `+${previewDefense}` : previewDefense} ch.
          </span>
        </div>
      )}

      {/* 5. Bouton de validation */}
      <button
        type="button"
        onClick={submitRound}
        disabled={!attackerId}
        className="w-full py-2.5 rounded-xl bg-[#c83b3b] hover:bg-[#b03030] text-white font-bold text-sm shadow-sm transition-all active:scale-[0.99] disabled:opacity-40 cursor-pointer"
      >
        {attackerId ? 'Valider la donne' : 'Sélectionnez le preneur'}
      </button>

      {/* BottomSheet saisie précise de points */}
      <BottomSheet open={openPointsSheet} onClose={() => setOpenPointsSheet(false)}>
        <div className="px-4 pt-1 pb-6 space-y-3">
          {attackerId && (() => {
            const attacker = game.players.find(p => p.id === attackerId)
            return (
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-stone-100/80 dark:bg-slate-800/60 border border-stone-200/80 dark:border-slate-700/60">
                <Avatar player={attacker} size="sm" leader={true} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm truncate text-stone-900 dark:text-slate-100">
                      {attacker?.name}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#c83b3b]/15 text-[#c83b3b] dark:text-red-300 shrink-0">
                      Preneur ({contractMeta.label})
                    </span>
                  </div>
                  <span className="text-xs text-stone-500 dark:text-slate-400">
                    Objectif : {threshold} pts ({bouts} bout{bouts > 1 ? 's' : ''})
                  </span>
                </div>
              </div>
            )
          })()}

          <ScorePad
            value={Number.isFinite(points) ? points : threshold}
            onChange={v => {
              const num = Number(v)
              setPoints(Number.isFinite(num) ? Math.max(0, Math.min(91, num)) : threshold)
            }}
            onConfirm={() => setOpenPointsSheet(false)}
            confirmLabel="Valider les points"
            min={0}
            max={91}
            step={1}
            label="Points réalisés par l'attaque (sur 91)"
            subLabel={`Défense : ${91 - (Number.isFinite(points) ? points : threshold)} pts`}
            presets={[36, 41, 46, 51, 56, 91]}
            showPlus={false}
            formatDisplay={v => `${v} pts`}
            formatTotal={val => {
              const d = val - threshold
              return d >= 0
                ? `+${d} pts au contrat (Contrat réussi !)`
                : `${d} pts au contrat (Contrat chuté)`
            }}
            customButtons={[
              { main: '36', sub: '3 Bouts', value: 36 },
              { main: '41', sub: '2 Bouts', value: 41 },
              { main: '46', sub: 'Moitié', value: 46 },
              { main: '51', sub: '1 Bout', value: 51 },
              { main: '56', sub: '0 Bout', value: 56 },
              { main: '60', value: 60 },
              { main: '70', value: 70 },
              { main: '91', sub: 'Capot', value: 91 },
            ]}
          />
        </div>
      </BottomSheet>
    </div>
  )
}
