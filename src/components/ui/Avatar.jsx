import { AVATAR_COLORS, AVATAR_COLOR_NAMES, PRESET_AVATARS } from '../../constants/games'
import { getPlayerInitial, getPlayerAvatarUrl } from '../../utils/gameUtils'
import { Check } from 'lucide-react'

export function Avatar({ player, size = 'md', leader = false }) {
  const sizeClass = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-9 h-9 text-sm',
    md: 'w-11 h-11 text-base',
    lg: 'w-14 h-14 text-xl',
    xl: 'w-18 h-18 text-2xl',
  }[size] || 'w-11 h-11 text-base'

  const avatarUrl = getPlayerAvatarUrl(player)
  const initial = getPlayerInitial(player)
  const bgColor = player?.color || '#c83b3b'

  if (avatarUrl) {
    return (
      <div
        className={`${sizeClass} rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden select-none transition-all bg-stone-100 dark:bg-slate-800`}
        style={{
          boxShadow: leader ? '0 0 0 2px var(--bg-page), 0 0 0 4px #c83b3b' : undefined,
        }}
      >
        <img
          src={avatarUrl}
          alt={player?.name || 'Avatar'}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>
    )
  }

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

/**
 * Sélecteur des 9 avatars illustrés d'Arena.photo + option Initiale colorée.
 */
export function AvatarPicker({ selectedAvatar, onSelectAvatar, selectedColor, onSelectColor, playerName = 'A' }) {
  const isInitialMode = selectedAvatar === null

  return (
    <div className="space-y-3.5">
      {/* Grille des 9 avatars Arena.photo + bouton Initiale */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-2">
          Choisir un avatar
        </p>
        <div className="grid grid-cols-5 gap-2.5">
          {PRESET_AVATARS.map((src, idx) => {
            const isSelected = selectedAvatar === src
            return (
              <button
                key={src}
                type="button"
                onClick={() => onSelectAvatar(src)}
                className={`relative aspect-square rounded-2xl p-1 border-2 flex items-center justify-center transition-all active:scale-95 ${
                  isSelected
                    ? 'border-[#c83b3b] bg-[#c83b3b]/10 shadow-xs'
                    : 'border-stone-200 dark:border-slate-800 bg-stone-50/70 dark:bg-slate-900/50 hover:border-stone-300 dark:hover:border-slate-700'
                }`}
                title={`Avatar ${idx + 1}`}
              >
                <img
                  src={src}
                  alt={`Avatar ${idx + 1}`}
                  className="w-full h-full object-contain rounded-full"
                  draggable={false}
                />
                {isSelected && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#c83b3b] text-white flex items-center justify-center shadow-xs">
                    <Check size={11} strokeWidth={3} />
                  </span>
                )}
              </button>
            )
          })}

          {/* 10e case : Option Initiale */}
          <button
            type="button"
            onClick={() => onSelectAvatar(null)}
            className={`relative aspect-square rounded-2xl p-1 border-2 flex flex-col items-center justify-center transition-all active:scale-95 ${
              isInitialMode
                ? 'border-[#c83b3b] bg-[#c83b3b]/10 shadow-xs'
                : 'border-stone-200 dark:border-slate-800 bg-stone-50/70 dark:bg-slate-900/50 hover:border-stone-300 dark:hover:border-slate-700'
            }`}
            title="Utiliser l'initiale"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: selectedColor || '#c83b3b' }}
            >
              {(playerName || 'A').trim().charAt(0).toUpperCase()}
            </div>
            <span className="text-[9px] font-bold uppercase tracking-tight text-stone-500 dark:text-slate-400 mt-0.5">
              Initiale
            </span>
            {isInitialMode && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#c83b3b] text-white flex items-center justify-center shadow-xs">
                <Check size={11} strokeWidth={3} />
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Si mode Initiale actif, afficher les pastilles de couleurs de craie (sans texte tronqué) */}
      {isInitialMode && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-2">
            Couleur de l'initiale ({AVATAR_COLOR_NAMES[selectedColor] || 'Teinte'})
          </p>
          <div className="flex items-center justify-between gap-2">
            {AVATAR_COLORS.map(color => {
              const isSelected = selectedColor === color
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => onSelectColor(color)}
                  title={AVATAR_COLOR_NAMES[color]}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-90 ${
                    isSelected ? 'scale-110 ring-2 ring-offset-2 ring-[#c83b3b]' : 'opacity-85 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
