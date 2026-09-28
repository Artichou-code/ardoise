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
    { label: '0', delta: -value }, // reset à zéro
  ]

  return (
    <div className="flex flex-col gap-3">
      {label && (
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {label}
        </p>
      )}
      {/* Affichage valeur */}
      <div className="flex items-center justify-center">
        <span className="text-4xl font-black tabular-nums text-zinc-900 dark:text-zinc-100">
          {value >= 0 ? '+' : ''}{value}
        </span>
      </div>
      {/* Boutons */}
      <div className="grid grid-cols-5 gap-2">
        {buttons.map(({ label: lbl, delta }) => (
          <button
            key={lbl}
            onPointerDown={(e) => { e.preventDefault(); onChange(value + delta) }}
            className={`h-12 rounded-xl font-bold text-sm select-none transition-all active:scale-95 ${
              lbl === '+1' || lbl === '+5' || lbl === '+10'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                : lbl === '-1'
                ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                : 'border-2 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>
      {/* Bouton valider */}
      {onConfirm && (
        <button
          onClick={onConfirm}
          className="w-full py-3 rounded-xl font-bold text-[#18181b] text-base transition-all active:scale-[0.98]"
          style={{ backgroundColor: '#fcc817' }}
        >
          Valider
        </button>
      )}
    </div>
  )
}
