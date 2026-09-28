import { AVATAR_COLORS, AVATAR_COLOR_NAMES } from '../../constants/games'
import { getPlayerInitial } from '../../utils/gameUtils'

export function Avatar({ player, size = 'md', leader = false }) {
  const sizeClass = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-9 h-9 text-sm',
    md: 'w-11 h-11 text-base',
    lg: 'w-14 h-14 text-xl',
    xl: 'w-18 h-18 text-2xl',
  }[size] || 'w-11 h-11 text-base'

  const initial = getPlayerInitial(player)
  const bgColor = player?.color || '#c83b3b'

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center flex-shrink-0 font-bold tracking-tight text-white select-none transition-all`}
      style={{
        backgroundColor: bgColor,
        boxShadow: leader ? '0 0 0 2px var(--bg-page), 0 0 0 4px #c83b3b' : undefined,
      }}
    >
      <span>{initial}</span>
    </div>
  )
}

export function AvatarColorPicker({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-4 gap-2.5">
      {AVATAR_COLORS.map(color => {
        const isSelected = selected === color
        return (
          <button
            key={color}
            type="button"
            onClick={() => onSelect(color)}
            className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-xs font-medium transition-all active:scale-95 ${
              isSelected
                ? 'border-[#c83b3b] bg-stone-100 dark:bg-slate-800 text-stone-900 dark:text-slate-100 font-bold'
                : 'border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-stone-600 dark:text-slate-400'
            }`}
          >
            <span
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="truncate">{AVATAR_COLOR_NAMES[color] || 'Teinte'}</span>
          </button>
        )
      })}
    </div>
  )
}
