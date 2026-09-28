/**
 * Pavé de saisie rapide pour scores.
 * Permet la saisie d'une seule main sans déclencher le clavier système.
 */
export function ScorePad({ value = 0, onChange, onConfirm, label }) {
  const buttons = [
    { label: '+1', delta: 1 },
    { label: '+5', delta: 5 },
    { label: '+10', delta: 10 },
    { label: '-1', delta: -1 },
    { label: '0', delta: -value }, // remise à zéro
  ]

  return (
    <div className="flex flex-col gap-3 pt-2">
      {label && (
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400">
          {label}
        </p>
      )}
      {/* Affichage valeur */}
      <div className="flex items-center justify-center py-2">
        <span className="text-4xl font-black tabular-nums">
          {value >= 0 ? '+' : ''}{value}
        </span>
      </div>
      {/* Boutons incrémentaux */}
      <div className="grid grid-cols-5 gap-2">
        {buttons.map(({ label: lbl, delta }) => (
          <button
            key={lbl}
            type="button"
            onPointerDown={(e) => { e.preventDefault(); onChange(value + delta) }}
            className={`h-12 rounded-xl font-bold text-sm select-none transition-all active:scale-95 ${
              lbl === '+1' || lbl === '+5' || lbl === '+10'
                ? 'bg-stone-900 dark:bg-slate-100 text-white dark:text-slate-900'
                : lbl === '-1'
                ? 'bg-stone-200 dark:bg-slate-800 text-stone-800 dark:text-slate-200'
                : 'border border-stone-300 dark:border-slate-700 text-stone-600 dark:text-slate-400'
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>
      {/* Bouton valider */}
      {onConfirm && (
        <button
          type="button"
          onClick={onConfirm}
          className="w-full py-3.5 rounded-xl font-bold text-base btn-margin-red mt-1"
        >
          Valider
        </button>
      )}
    </div>
  )
}
