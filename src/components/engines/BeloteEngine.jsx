import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { useGame } from '../../context/GameContext'
import { computeBeloteScore } from '../../engines/gameEngines'
import { BELOTE_SIMPLE_CONTRACTS, COINCHE_CONTRACTS } from '../../constants/games'
import { QuickScoreBadge } from '../ui/QuickScoreBadge'
import { ScorePad } from '../ui/ScorePad'
import { BottomSheet } from '../ui/BottomSheet'

const TEAMS = ['nous', 'eux']

export function BeloteEngine({ game, onFinish }) {
  const { updateScores } = useGame()

  const variant = game.config?.variant || 'belote'
  const isCoinche = variant === 'coinche'

  const [takerTeam, setTakerTeam] = useState(() => game.restoredRound?.takerTeam || 'nous')
  const [contract, setContract] = useState(() => game.restoredRound?.contract || (isCoinche ? 80 : 82))
  const [coincheMultiplier, setCoincheMultiplier] = useState(() => game.restoredRound?.coincheMultiplier || 1)
  const [pointsTaker, setPointsTaker] = useState(() => game.restoredRound?.pointsTaker ?? (isCoinche ? 80 : 82))
  const [announcements, setAnnouncements] = useState(() => game.restoredRound?.announcements ?? 0)

  const [openTakerSheet, setOpenTakerSheet] = useState(false)
  const [openAnnoncesSheet, setOpenAnnoncesSheet] = useState(false)
  const [openContractSheet, setOpenContractSheet] = useState(false)

  const handleContractChange = (val) => {
    setContract(val)
    if (val === 252 || val === 250 || val === 500) {
      setPointsTaker(162)
    }
  }

  const nousPlayers = game.players.slice(0, 2)
  const euxPlayers = game.players.slice(2, 4)
  const nousNames = nousPlayers.map(p => p.name).join(' & ') || 'Joueurs 1 & 2'
  const euxNames = euxPlayers.map(p => p.name).join(' & ') || 'Joueurs 3 & 4'

  const submitRound = () => {
    const teamScores = computeBeloteScore({
      variant,
      contract,
      announcements,
      takerTeam,
      pointsTaker,
      coincheMultiplier,
    })
    const nousIds = nousPlayers.map(p => p.id)
    const euxIds = euxPlayers.map(p => p.id)
    const newScores = { ...game.scores }
    const delta = {}

    nousIds.forEach(id => {
      newScores[id] = (newScores[id] || 0) + teamScores['nous']
      delta[id] = teamScores['nous']
    })
    euxIds.forEach(id => {
      newScores[id] = (newScores[id] || 0) + teamScores['eux']
      delta[id] = teamScores['eux']
    })

    updateScores({
      scores: newScores,
      delta,
      teamScores,
      takerTeam,
      contract,
      pointsTaker,
      announcements,
      coincheMultiplier,
      variant,
      type: 'belote',
    })

    const limit = game.config?.limit || 1000
    if (Object.values(newScores).some(s => s >= limit)) {
      const winner = Object.entries(newScores).sort((a, b) => b[1] - a[1])[0][0]
      onFinish(winner)
    }
  }

  const currentResult = computeBeloteScore({
    variant,
    contract,
    announcements,
    takerTeam,
    pointsTaker,
    coincheMultiplier,
  })
  const isCapotContract = contract === 252 || contract === 250 || contract === 500
  const contractMade = isCoinche
    ? (isCapotContract
        ? pointsTaker === 162
        : pointsTaker >= 82 && (pointsTaker + announcements) >= contract)
    : (contract === 252
        ? pointsTaker === 162
        : pointsTaker >= 82)

  return (
    <div className="space-y-3.5 pt-1.5 select-none">
      {/* Équipes */}
      <div className="school-card rounded-xl p-3.5 space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
          Équipe preneuse
        </p>
        <div className="grid grid-cols-2 gap-2">
          {TEAMS.map(t => {
            const isSelected = takerTeam === t
            const isTeam1 = t === 'nous'
            const teamLabel = isTeam1 ? 'Équipe 1' : 'Équipe 2'
            const subLabel = isTeam1 ? nousNames : euxNames
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTakerTeam(t)}
                className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? isTeam1
                      ? 'border-[#c83b3b] bg-[#c83b3b] text-white shadow-xs'
                      : 'border-[#1e3a5f] bg-[#1e3a5f] text-white shadow-xs'
                    : isTeam1
                    ? 'school-subtle hover:border-[#c83b3b]/40 text-stone-700 dark:text-slate-200'
                    : 'school-subtle hover:border-[#1e3a5f]/40 text-stone-700 dark:text-slate-200'
                }`}
              >
                <span className="font-bold text-sm block leading-tight">{teamLabel}</span>
                <span className={`text-[10px] block truncate mt-0.5 ${isSelected ? 'text-white/80' : 'text-stone-400 dark:text-slate-400'}`}>
                  {subLabel}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Contrat / Enchère */}
      {isCoinche ? (
        <div className="school-card rounded-xl p-3.5 space-y-3">
          <div className="flex items-stretch gap-3">
            {/* Colonne gauche : Titre, sous-titre et choix manuels */}
            <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
              <button
                type="button"
                onClick={() => setOpenContractSheet(true)}
                className="text-left cursor-pointer focus:outline-none group/title"
              >
                <div className="flex items-center gap-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 leading-tight group-hover/title:text-[#c83b3b] transition-colors">
                    Enchère annoncée
                  </p>
                  <ChevronRight size={12} className="opacity-40 group-hover/title:opacity-100 group-hover/title:translate-x-0.5 transition-all text-stone-400 group-hover/title:text-[#c83b3b]" />
                </div>
                <p className="text-[11px] font-semibold text-stone-500 dark:text-slate-400 mt-0.5">
                  {contract === 250
                    ? 'Capot (250 pts)'
                    : contract === 500
                    ? 'Générale (500 pts)'
                    : `${contract} pts`}
                </p>
              </button>

              {/* Grille de 8 raccourcis manuels */}
              <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                {[
                  { val: 80, label: '80' },
                  { val: 90, label: '90' },
                  { val: 100, label: '100' },
                  { val: 110, label: '110' },
                  { val: 120, label: '120' },
                  { val: 140, label: '140' },
                  { val: 160, label: '160' },
                  { val: 250, label: 'Capot' },
                ].map(shortcut => (
                  <button
                    key={shortcut.val}
                    type="button"
                    onClick={() => handleContractChange(shortcut.val)}
                    className={`py-1 px-1 rounded-lg text-xs font-bold border text-center transition-colors cursor-pointer flex items-center justify-center min-h-[2.5rem] ${
                      contract === shortcut.val
                        ? 'bg-[#c83b3b] text-white border-[#c83b3b] shadow-2xs'
                        : 'school-subtle hover:border-[#c83b3b]/40 text-stone-700 dark:text-slate-300'
                    }`}
                  >
                    {shortcut.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Colonne droite : QuickScoreBadge */}
            <QuickScoreBadge
              value={contract}
              values={[80, 90, 100, 110, 120, 130, 140, 150, 160, 250, 500]}
              onChange={handleContractChange}
              onOpenPad={() => setOpenContractSheet(true)}
              formatDisplay={val => val}
              formatSub={val => (val === 250 ? 'Capot' : val === 500 ? 'Générale' : null)}
              showPlus={false}
              tall={true}
            />
          </div>

          {/* Sélecteur Coinche / Surcoinche */}
          <div className="pt-2.5 border-t border-stone-200/70 dark:border-slate-800/70">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                Coinche / Surcoinche
              </span>
              <span className="text-[10px] font-semibold text-stone-400 dark:text-slate-500">
                {coincheMultiplier === 1 ? 'Contrat simple' : coincheMultiplier === 2 ? 'Points ×2' : 'Points ×4'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { mult: 1, label: 'Normal', sub: '×1' },
                { mult: 2, label: 'Coinché !', sub: '×2' },
                { mult: 4, label: 'Surcoinché !', sub: '×4' },
              ].map(m => {
                const active = coincheMultiplier === m.mult
                return (
                  <button
                    key={m.mult}
                    type="button"
                    onClick={() => setCoincheMultiplier(m.mult)}
                    className={`py-2 px-1 rounded-xl text-center border font-bold text-xs transition-all cursor-pointer ${
                      active
                        ? m.mult === 4
                          ? 'border-amber-600 bg-amber-600 text-white shadow-xs'
                          : m.mult === 2
                          ? 'border-[#c83b3b] bg-[#c83b3b] text-white shadow-xs'
                          : 'border-stone-800 bg-stone-800 dark:border-slate-200 dark:bg-slate-200 text-white dark:text-stone-900 shadow-xs'
                        : 'school-subtle hover:border-stone-400 text-stone-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="block leading-tight">{m.label}</span>
                    <span className={`block text-[10px] font-normal mt-0.5 ${active ? 'opacity-85' : 'text-stone-400 dark:text-slate-500'}`}>
                      {m.sub}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="school-card rounded-xl p-3.5 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
            Contrat de la donne
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { val: 82, label: 'Prise simple', sub: '≥ 82 pts à faire' },
              { val: 252, label: 'Capot', sub: 'Tous les plis (252 pts)' },
            ].map(opt => {
              const isSelected = contract === opt.val
              return (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => handleContractChange(opt.val)}
                  className={`py-2.5 px-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#c83b3b] bg-[#c83b3b] text-white shadow-xs'
                      : 'school-subtle hover:border-[#c83b3b]/40 text-stone-700 dark:text-slate-200'
                  }`}
                >
                  <span className="font-bold text-sm block leading-tight">{opt.label}</span>
                  <span className={`text-[10px] block truncate mt-0.5 ${isSelected ? 'text-white/80' : 'text-stone-400 dark:text-slate-400'}`}>
                    {opt.sub}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Points réalisés par le preneur */}
      <div className="school-card rounded-xl p-3.5 flex items-stretch gap-3">
        {/* Colonne gauche : Titre, sous-titre et choix manuels */}
        <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
          <button
            type="button"
            onClick={() => setOpenTakerSheet(true)}
            className="text-left cursor-pointer focus:outline-none group/title"
          >
            <div className="flex items-center gap-1">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 leading-tight group-hover/title:text-[#c83b3b] transition-colors">
                Points du preneur (/ 162)
              </p>
              <ChevronRight size={12} className="opacity-40 group-hover/title:opacity-100 group-hover/title:translate-x-0.5 transition-all text-stone-400 group-hover/title:text-[#c83b3b]" />
            </div>
            <p className="text-[11px] font-semibold text-stone-500 dark:text-slate-400 mt-0.5">
              Défense : <span className="font-bold text-stone-700 dark:text-slate-300">{162 - pointsTaker} pts</span>
            </p>
          </button>

          {/* Raccourcis manuels équilibrés sur la gauche (2 lignes de 3) */}
          <div className="grid grid-cols-3 gap-1.5 pt-0.5">
            {[
              {
                val: isCoinche ? 80 : 82,
                main: isCoinche ? '80' : '82',
                sub: isCoinche ? '(min)' : '(fait 80)',
              },
              { val: 90, main: '90' },
              { val: 100, main: '100' },
              { val: 110, main: '110' },
              { val: 120, main: '120' },
              { val: 162, main: '162', sub: '(Capot)' },
            ].map(shortcut => {
              const isSelected = pointsTaker === shortcut.val
              return (
                <button
                  key={shortcut.val}
                  type="button"
                  onClick={() => setPointsTaker(shortcut.val)}
                  className={`py-1 px-1 rounded-lg border text-center transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[2.5rem] ${
                    isSelected
                      ? 'bg-[#c83b3b] text-white border-[#c83b3b] shadow-2xs'
                      : 'school-subtle hover:border-[#c83b3b]/40 text-stone-700 dark:text-slate-300'
                  }`}
                >
                  <span className="text-xs font-bold leading-none">{shortcut.main}</span>
                  {shortcut.sub && (
                    <span
                      className={`text-[10px] font-normal leading-tight mt-0.5 ${
                        isSelected ? 'text-white/80' : 'text-stone-500 dark:text-slate-400'
                      }`}
                    >
                      {shortcut.sub}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Colonne droite : Zone tactile sur toute la hauteur */}
        <QuickScoreBadge
          value={pointsTaker}
          onChange={setPointsTaker}
          onOpenPad={() => setOpenTakerSheet(true)}
          min={0}
          max={162}
          step={1}
          showPlus={false}
          tall={true}
          formatSub={val => (val === 162 ? 'Capot' : null)}
        />
      </div>

      {/* Annonces & Belote */}
      <div className="school-card rounded-xl p-3.5 flex items-stretch gap-3">
        {/* Colonne gauche : Titre, sous-titre et choix manuels */}
        <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
          <button
            type="button"
            onClick={() => setOpenAnnoncesSheet(true)}
            className="text-left cursor-pointer focus:outline-none group/title"
          >
            <div className="flex items-center gap-1">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 leading-tight group-hover/title:text-[#c83b3b] transition-colors">
                Annonces & Belote
              </p>
              <ChevronRight size={12} className="opacity-40 group-hover/title:opacity-100 group-hover/title:translate-x-0.5 transition-all text-stone-400 group-hover/title:text-[#c83b3b]" />
            </div>
            <p className="text-[11px] font-semibold text-stone-500 dark:text-slate-400 mt-0.5">
              {announcements > 0 ? `+${announcements} pts d'annonces` : 'Aucune annonce'}
            </p>
          </button>

          {/* Raccourcis manuels annonces (2 lignes de 3) */}
          <div className="grid grid-cols-3 gap-1.5 pt-0.5">
            {[
              { val: 0, main: '0' },
              { val: 20, main: '+20', sub: '(Belote)' },
              { val: 40, main: '+40' },
              { val: 50, main: '+50' },
              { val: 90, main: '+90' },
              { val: 100, main: '+100' },
            ].map(shortcut => {
              const isSelected = announcements === shortcut.val
              return (
                <button
                  key={shortcut.val}
                  type="button"
                  onClick={() => setAnnouncements(shortcut.val)}
                  className={`py-1 px-1 rounded-lg border text-center transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[2.5rem] ${
                    isSelected
                      ? 'bg-[#c83b3b] text-white border-[#c83b3b] shadow-2xs'
                      : 'school-subtle hover:border-[#c83b3b]/40 text-stone-700 dark:text-slate-300'
                  }`}
                >
                  <span className="text-xs font-bold leading-none">{shortcut.main}</span>
                  {shortcut.sub && (
                    <span
                      className={`text-[10px] font-normal leading-tight mt-0.5 ${
                        isSelected ? 'text-white/80' : 'text-stone-500 dark:text-slate-400'
                      }`}
                    >
                      {shortcut.sub}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Colonne droite : Zone tactile sur toute la hauteur */}
        <QuickScoreBadge
          value={announcements}
          onChange={setAnnouncements}
          onOpenPad={() => setOpenAnnoncesSheet(true)}
          min={0}
          max={500}
          step={10}
          showPlus={true}
          tall={true}
        />
      </div>

      {/* Aperçu répartition avec statut du contrat */}
      <div className="school-card rounded-xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
            Répartition de la donne
          </span>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            contractMade
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
              : 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30'
          }`}>
            {contractMade ? '✓ Contrat réussi' : '✗ Chute (Dedans)'}
            {isCoinche && coincheMultiplier > 1 && (
              <span className="ml-1 opacity-90">
                · {coincheMultiplier === 2 ? 'Coinché (×2)' : 'Surcoinché (×4)'}
              </span>
            )}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {TEAMS.map(t => {
            const isTaker = takerTeam === t
            const isTeam1 = t === 'nous'
            const score = currentResult[t]
            return (
              <div
                key={t}
                className={`rounded-xl p-2.5 text-center border transition-all ${
                  isTaker
                    ? isTeam1
                      ? 'border-[#c83b3b]/40 bg-[#c83b3b]/5 dark:bg-[#c83b3b]/10'
                      : 'border-[#1e3a5f]/40 bg-[#1e3a5f]/5 dark:bg-[#1e3a5f]/10'
                    : 'school-subtle'
                }`}
              >
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <p className="text-xs font-bold text-stone-600 dark:text-slate-300">
                    {isTeam1 ? 'Équipe 1' : 'Équipe 2'}
                  </p>
                  {isTaker && (
                    <span className={`text-[9px] font-bold uppercase px-1 py-0.2 rounded text-white ${isTeam1 ? 'bg-[#c83b3b]' : 'bg-[#1e3a5f]'}`}>
                      Preneur
                    </span>
                  )}
                </div>
                <p className={`text-2xl font-black tabular-nums ${isTeam1 ? 'text-[#c83b3b]' : 'text-[#1e3a5f] dark:text-sky-400'}`}>
                  +{score}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={submitRound}
        className="w-full py-3.5 rounded-xl font-bold text-base btn-margin-red shadow-sm cursor-pointer active:scale-[0.99] transition-transform"
      >
        Valider la donne
      </button>

      {/* BottomSheet tactile pour les points du preneur */}
      <BottomSheet
        open={openTakerSheet}
        onClose={() => setOpenTakerSheet(false)}
        title="Points réalisés par le preneur (sur 162)"
      >
        <div className="px-5 pt-2 pb-6">
          <ScorePad
            value={pointsTaker}
            onChange={setPointsTaker}
            onConfirm={() => setOpenTakerSheet(false)}
            min={0}
            max={162}
            step={1}
            showPlus={false}
            label={`Défense : ${162 - pointsTaker} pts`}
            presets={
              isCoinche
                ? [
                    { value: 80, label: '80 (minimum)' },
                    { value: 90, label: '90' },
                    { value: 100, label: '100' },
                    { value: 110, label: '110' },
                    { value: 120, label: '120' },
                    { value: 162, label: '162 (Capot)' },
                  ]
                : [
                    { value: 82, label: '82 (fait 80)' },
                    { value: 90, label: '90' },
                    { value: 100, label: '100' },
                    { value: 110, label: '110' },
                    { value: 120, label: '120' },
                    { value: 162, label: '162 (Capot)' },
                  ]
            }
          />
        </div>
      </BottomSheet>

      {/* BottomSheet tactile pour les annonces */}
      <BottomSheet
        open={openAnnoncesSheet}
        onClose={() => setOpenAnnoncesSheet(false)}
        title="Annonces & Belote (+20)"
      >
        <div className="px-5 pt-2 pb-6">
          <ScorePad
            value={announcements}
            onChange={setAnnouncements}
            onConfirm={() => setOpenAnnoncesSheet(false)}
            min={0}
            max={500}
            step={10}
            showPlus={true}
            presets={[
              { value: 0, label: '0 (Aucune)' },
              { value: 20, label: '+20 (Belote / Tierce)' },
              { value: 40, label: '+40' },
              { value: 50, label: '+50 (Cinquante)' },
              { value: 90, label: '+90' },
              { value: 100, label: '+100 (Cent / Carré)' },
              { value: 200, label: '+200 (Carré Valets)' },
            ]}
            customButtons={[
              { label: '+20', delta: 20, colorClass: 'bg-[#c83b3b]/15 hover:bg-[#c83b3b]/25 text-[#c83b3b] font-bold border border-[#c83b3b]/25' },
              { label: '+50', delta: 50, colorClass: 'bg-[#c83b3b]/35 hover:bg-[#c83b3b]/45 text-[#c83b3b] font-bold border border-[#c83b3b]/35' },
              { label: '+100', delta: 100, colorClass: 'bg-[#c83b3b] hover:bg-[#b03030] text-white font-bold border border-[#c83b3b] shadow-2xs' },
              { label: '-20', delta: -20, colorClass: 'bg-[#c83b3b]/8 hover:bg-[#c83b3b]/15 text-stone-700 dark:text-slate-300 border border-[#c83b3b]/15' },
              { label: '0', delta: -announcements, colorClass: 'bg-white dark:bg-slate-900 border-2 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-400' },
            ]}
          />
        </div>
      </BottomSheet>

      {/* BottomSheet tactile pour le contrat complet */}
      <BottomSheet
        open={openContractSheet}
        onClose={() => setOpenContractSheet(false)}
        title={isCoinche ? 'Enchère annoncée' : 'Contrat annoncé'}
      >
        <div className="px-5 pt-2 pb-6 space-y-3">
          <p className="text-xs text-stone-500 dark:text-slate-400 font-medium">
            {isCoinche
              ? "Sélectionnez l'enchère annoncée pour cette donne :"
              : 'Sélectionnez le contrat pour cette donne :'}
          </p>
          {isCoinche ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {COINCHE_CONTRACTS.map(c => {
                const isSelected = contract === c.value
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => {
                      handleContractChange(c.value)
                      setOpenContractSheet(false)
                    }}
                    className={`py-2.5 px-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#c83b3b] text-white border-[#c83b3b] shadow-xs'
                        : 'school-subtle hover:border-[#c83b3b]/40 text-stone-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="text-base font-black leading-tight">
                      {c.value === 250 ? 'Capot' : c.value === 500 ? 'Générale' : c.value}
                    </div>
                    <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-stone-400 dark:text-slate-400'}`}>
                      {c.value === 250 ? '250 pts' : c.value === 500 ? '500 pts' : `${c.value} pts`}
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {BELOTE_SIMPLE_CONTRACTS.map(c => {
                const isSelected = contract === c.value
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => {
                      handleContractChange(c.value)
                      setOpenContractSheet(false)
                    }}
                    className={`py-3 px-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#c83b3b] text-white border-[#c83b3b] shadow-xs'
                        : 'school-subtle hover:border-[#c83b3b]/40 text-stone-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="text-base font-black leading-tight">
                      {c.value === 252 ? 'Capot' : 'Prise simple'}
                    </div>
                    <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-stone-400 dark:text-slate-400'}`}>
                      {c.label}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </BottomSheet>
    </div>
  )
}
