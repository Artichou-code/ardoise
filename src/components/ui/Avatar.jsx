import { AVATAR_COLORS, AVATAR_COLOR_NAMES, PRESET_AVATARS } from '../../constants/games'
import { getPlayerInitial, getPlayerAvatarUrl } from '../../utils/gameUtils'
import { Check } from 'lucide-react'

export function Avatar({ player, size = 'md', leader = false, leaderColor, ringColor: customRingColor }) {
  const sizeClass = {
    '2xs': 'w-5 h-5 text-[10px] m-[2.5px]',
    xs: 'w-6 h-6 text-[11px] m-[3px]',
    sm: 'w-9 h-9 text-sm',
    md: 'w-11 h-11 text-base',
    lg: 'w-13 h-13 text-xl',
    xl: 'w-16 h-16 text-2xl',
  }[size] || 'w-11 h-11 text-base'

  const avatarUrl = getPlayerAvatarUrl(player)
  const initial = getPlayerInitial(player)
  const ringColor = customRingColor || (leader ? (leaderColor || '#c83b3b') : (player?.color || '#c83b3b'))

  // Espace (gap) et anneau proportionnels à la taille de l'avatar
  const isCompact = size === '2xs' || size === 'xs'
  const floatingRingStyle = {
    boxShadow: isCompact
      ? `0 0 0 1.5px var(--bg-card, #ffffff), 0 0 0 2.75px ${ringColor}`
      : `0 0 0 2px var(--bg-card, #ffffff), 0 0 0 4px ${ringColor}`,
  }

  if (avatarUrl) {
    return (
      <div
        className={`${sizeClass} rounded-full flex items-center justify-center flex-shrink-0 select-none transition-all relative`}
        style={floatingRingStyle}
      >
        <img
          src={avatarUrl}
          alt={player?.name || 'Avatar'}
          className="w-full h-full object-cover rounded-full block"
          draggable={false}
        />
      </div>
    )
  }

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center flex-shrink-0 font-bold tracking-tight text-white select-none transition-all`}
      style={{
        backgroundColor: ringColor,
        ...floatingRingStyle,
      }}
    >
      <span>{initial}</span>
    </div>
  )
}

/**
 * Sélecteur compact des 9 avatars ronds + pastilles de couleur.
 */
export function AvatarPicker({ selectedAvatar, onSelectAvatar, selectedColor, onSelectColor }) {
  return (
    <div className="space-y-3">
      {/* 9 avatars ronds avec anneau et espace de 2px */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-2">
          Choisir un avatar
        </p>
        <div className="grid grid-cols-5 gap-2.5 place-items-center">
          {PRESET_AVATARS.map((src, idx) => {
            const isSelected = selectedAvatar === src
            return (
              <button
                key={src}
                type="button"
                onClick={() => onSelectAvatar(src)}
                className={`relative w-11 h-11 rounded-full transition-transform active:scale-90 focus:outline-none ${
                  isSelected ? 'scale-105' : 'opacity-85 hover:opacity-100'
                }`}
                style={{
                  boxShadow: isSelected
                    ? `0 0 0 2px var(--bg-card, #ffffff), 0 0 0 3.5px ${selectedColor || '#c83b3b'}`
                    : undefined,
                }}
                title={`Avatar ${idx + 1}`}
              >
                <img
                  src={src}
                  alt={`Avatar ${idx + 1}`}
                  className="w-full h-full object-cover rounded-full block"
                  draggable={false}
                />
                {isSelected && (
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white flex items-center justify-center shadow-xs"
                    style={{ backgroundColor: selectedColor || '#c83b3b' }}
                  >
                    <Check size={9} strokeWidth={3} />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Choix de la couleur du joueur (pastilles rondes avec anneau et espace de 2px) */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-2">
          Couleur du joueur ({AVATAR_COLOR_NAMES[selectedColor] || 'Teinte'})
        </p>
        <div className="flex items-center justify-between gap-1.5 px-0.5">
          {AVATAR_COLORS.map(color => {
            const isSelected = selectedColor === color
            return (
              <button
                key={color}
                type="button"
                onClick={() => onSelectColor(color)}
                title={AVATAR_COLOR_NAMES[color]}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform active:scale-90 ${
                  isSelected ? 'scale-110' : 'opacity-80 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: color,
                  boxShadow: isSelected
                    ? `0 0 0 2px var(--bg-card, #ffffff), 0 0 0 3.5px ${color}`
                    : undefined,
                }}
              >
                {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
