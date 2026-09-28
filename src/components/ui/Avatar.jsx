import { AVATAR_COLORS, AVATAR_EMOJIS } from '../../constants/games'

export function Avatar({ player, size = 'md', leader = false }) {
  const sizeClass = {
    xs: 'w-7 h-7 text-sm',
    sm: 'w-9 h-9 text-base',
    md: 'w-12 h-12 text-xl',
    lg: 'w-16 h-16 text-3xl',
    xl: 'w-20 h-20 text-4xl',
  }[size] || 'w-12 h-12 text-xl'

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center flex-shrink-0 font-bold transition-all ${
        leader ? 'ring-4 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950' : ''
      }`}
      style={{
        backgroundColor: player.color,
        ringColor: leader ? '#fcc817' : undefined,
        boxShadow: leader ? `0 0 0 4px #fcc817` : undefined,
      }}
    >
      <span>{player.emoji}</span>
    </div>
  )
}

export function AvatarColorPicker({ selected, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {AVATAR_COLORS.map(color => (
        <button
          key={color}
          onClick={() => onSelect(color)}
          className={`w-8 h-8 rounded-full transition-all active:scale-90 ${
            selected === color ? 'ring-2 ring-offset-2 ring-zinc-900 dark:ring-zinc-100 scale-110' : ''
          }`}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  )
}

export function AvatarEmojiPicker({ selected, onSelect }) {
  return (
    <div className="flex flex-wrap gap-1 justify-center">
      {AVATAR_EMOJIS.map(emoji => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all active:scale-90 ${
            selected === emoji
              ? 'bg-zinc-900 dark:bg-zinc-100 scale-110'
              : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
