import { BottomSheet } from './ui/BottomSheet'
import { GAME_META } from '../constants/games'
import { formatTypography } from '../utils/typography'

/**
 * Fiche mémo des règles officielles (Bottom Sheet tactile avec scroll lock).
 */
export function RulesSheet({ gameType, variant, title, onClose, onStartSetup }) {
  const meta = gameType ? GAME_META[gameType] : null
  if (!meta || !meta.rules) return null

  const { rules } = meta
  const sheetTitle = title || (gameType === 'belote' && variant === 'coinche' ? 'Règles — Coinche' : `Règles — ${meta.name}`)

  return (
    <BottomSheet
      open={!!gameType}
      onClose={onClose}
      title={formatTypography(sheetTitle)}
      subtitle={formatTypography(`${meta.playersBadge} · ${meta.categoryBadge}`)}
    >
      <div className="px-5 py-4 space-y-5">
        {/* Si le jeu définit des sections structurées (ex. Dourak, Caracole, etc.) */}
        {rules.sections ? (
          rules.sections.map((sec, idx) => {
            const cleanTitle = (sec.title || '').replace(/^\d+[\.\)]\s*/, '')
            return (
              <section key={idx}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-1.5 h-4 rounded-full bg-[#c83b3b]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#c83b3b]">
                    {idx + 1}. {formatTypography(cleanTitle)}
                  </h3>
                </div>
                {sec.content && (
                  <p className="text-sm text-stone-700 dark:text-slate-300 leading-relaxed">
                    {formatTypography(sec.content)}
                  </p>
                )}
                {sec.items && (
                  <ul className="space-y-1.5 mt-1">
                    {sec.items.map((item, i) => (
                      <li
                        key={i}
                        className="text-sm text-stone-700 dark:text-slate-300 leading-relaxed flex items-start gap-2"
                      >
                        <span className="text-[#c83b3b] font-bold select-none">•</span>
                        <span>{formatTypography(item)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )
          })
        ) : (
          <>
            {/* 1. Objectif */}
            <section>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-1.5 h-4 rounded-full bg-[#c83b3b]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#c83b3b]">
                  1. Objectif
                </h3>
              </div>
              <p className="text-sm text-stone-700 dark:text-slate-300 leading-relaxed">
                {formatTypography(rules.objective)}
              </p>
            </section>

            {/* 2. Déroulement d'une manche */}
            <section>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-1.5 h-4 rounded-full bg-[#c83b3b]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#c83b3b]">
                  2. Déroulement d'une manche
                </h3>
              </div>
              <p className="text-sm text-stone-700 dark:text-slate-300 leading-relaxed">
                {formatTypography(rules.gameplay)}
              </p>
            </section>

            {/* 3. Comptage des points */}
            <section>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-1.5 h-4 rounded-full bg-[#c83b3b]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#c83b3b]">
                  3. Comptage des points
                </h3>
              </div>
              <p className="text-sm text-stone-700 dark:text-slate-300 leading-relaxed">
                {formatTypography(rules.scoring)}
              </p>
            </section>
          </>
        )}

        {/* Tableau récapitulatif / Barème */}
        {rules.summaryTable && rules.summaryTable.length > 0 && (
          <section className="school-subtle rounded-xl p-3.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-2">
              Mémo barème
            </h4>
            <div className="divide-y divide-stone-200/70 dark:divide-slate-700/60">
              {rules.summaryTable.map((row, idx) => (
                <div key={idx} className="flex items-center justify-between py-1.5 text-xs">
                  <span className="text-stone-700 dark:text-slate-300 font-medium">{formatTypography(row.item)}</span>
                  <span className="font-bold text-stone-900 dark:text-slate-100 tabular-nums ml-3 text-right">
                    {formatTypography(row.value)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Bouton d'action */}
        <div className="pt-1 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-stone-200 dark:border-slate-700 text-sm font-semibold text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
          >
            Fermer
          </button>
          {onStartSetup && (
            <button
              type="button"
              onClick={() => {
                const target = gameType
                onClose()
                onStartSetup(target)
              }}
              className="flex-1 py-3 rounded-xl font-bold text-sm btn-margin-red"
            >
              Configurer la partie
            </button>
          )}
        </div>
      </div>
    </BottomSheet>
  )
}
