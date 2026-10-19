import { useState, useEffect } from 'react'
import { Menu } from 'lucide-react'
import { getActiveSession } from '../store/liveSession'

export function BurgerMenuButton() {
  const [liveSession, setLiveSession] = useState(() => getActiveSession())

  useEffect(() => {
    const handleSessionChanged = (e) => setLiveSession(e.detail)
    window.addEventListener('ardoise-live-session-changed', handleSessionChanged)
    return () => window.removeEventListener('ardoise-live-session-changed', handleSessionChanged)
  }, [])

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent('ardoise-open-burger-menu'))}
      className="p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-700 dark:text-slate-300 transition-colors relative cursor-pointer shrink-0"
      aria-label="Ouvrir le menu principal"
      title="Menu principal"
    >
      <Menu size={18} />
      {liveSession && (
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
      )}
    </button>
  )
}
