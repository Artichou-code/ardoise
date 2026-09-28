import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
      aria-label={theme === 'dark' ? 'Passer en mode Cahier (clair)' : 'Passer en mode Ardoise (sombre)'}
      title={theme === 'dark' ? 'Mode Cahier (clair)' : 'Mode Ardoise (sombre)'}
    >
      {theme === 'dark'
        ? <Sun size={18} className="text-slate-200" />
        : <Moon size={18} className="text-stone-700" />
      }
    </button>
  )
}
