import { useState } from 'react'
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react'
import { useGame } from '../context/GameContext'
import { Avatar, AvatarColorPicker, AvatarEmojiPicker } from './ui/Avatar'
import { BottomSheet } from './ui/BottomSheet'
import { ConfirmDialog } from './ui/Dialog'
import { ThemeToggle } from './ui/ThemeToggle'
import { createPlayer } from '../utils/gameUtils'
import { AVATAR_COLORS, AVATAR_EMOJIS } from '../constants/games'

function PlayerSheet({ open, onClose, initial, onSave }) {
  const [name, setName] = useState(initial?.name || '')
  const [color, setColor] = useState(initial?.color || AVATAR_COLORS[0])
  const [emoji, setEmoji] = useState(initial?.emoji || AVATAR_EMOJIS[0])
  const [tab, setTab] = useState('emoji')

  const handleSave = () => {
    if (!name.trim()) return
    onSave(initial
      ? { ...initial, name: name.trim(), color, emoji }
      : createPlayer(name, color, emoji)
    )
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={initial ? 'Modifier le joueur' : 'Nouveau joueur'}>
      <div className="px-4 pb-4 space-y-4">
        <div className="flex items-center gap-3">
          <Avatar player={{ name, color, emoji }} size="lg" />
          <input
            type="text"
            placeholder="Prénom"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            className="flex-1 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-base font-semibold text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#fcc817]"
            autoFocus
            maxLength={20}
          />
        </div>
        <div className="flex gap-2">
          {[['emoji', 'Emoji'], ['color', 'Couleur']].map(([id, lbl]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                tab === id ? 'text-[#18181b]' : 'text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800'
              }`}
              style={tab === id ? { backgroundColor: '#fcc817' } : {}}
            >
              {lbl}
            </button>
          ))}
        </div>
        {tab === 'emoji'
          ? <AvatarEmojiPicker selected={emoji} onSelect={setEmoji} />
          : <AvatarColorPicker selected={color} onSelect={setColor} />
        }
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="w-full py-3.5 rounded-xl font-bold text-base disabled:opacity-40 text-[#18181b]"
          style={{ backgroundColor: '#fcc817' }}
        >
          {initial ? 'Enregistrer' : 'Ajouter'}
        </button>
      </div>
    </BottomSheet>
  )
}

export function PlayersScreen() {
  const { players, savePlayer, removePlayer, setScreen } = useGame()
  const [showCreate, setShowCreate] = useState(false)
  const [editPlayer, setEditPlayer] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-white dark:bg-zinc-950">
      <header className="flex items-center gap-2 px-4 pt-safe pt-4 pb-3 flex-shrink-0 border-b border-zinc-100 dark:border-zinc-900">
        <button onClick={() => setScreen('home')} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          <ArrowLeft size={20} className="text-zinc-600 dark:text-zinc-400" />
        </button>
        <h1 className="flex-1 font-black text-zinc-900 dark:text-zinc-100 text-lg">Joueurs</h1>
        <ThemeToggle />
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs text-[#18181b] ml-1"
          style={{ backgroundColor: '#fcc817' }}
        >
          <Plus size={16} /> Nouveau
        </button>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-6">
        {players.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="text-5xl mb-4">👥</span>
            <p className="text-zinc-400 dark:text-zinc-500 text-sm mb-4">Aucun joueur enregistré</p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-6 py-3 rounded-xl font-bold text-[#18181b]"
              style={{ backgroundColor: '#fcc817' }}
            >
              Créer mon premier joueur
            </button>
          </div>
        ) : (
          <div className="space-y-2 mt-4">
            {players.map(p => (
              <div
                key={p.id}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
              >
                <Avatar player={p} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">{p.name}</p>
                </div>
                <button
                  onClick={() => setEditPlayer(p)}
                  className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Pencil size={16} className="text-zinc-500" />
                </button>
                <button
                  onClick={() => setConfirmDelete(p.id)}
                  className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  <Trash2 size={16} className="text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <PlayerSheet open={showCreate} onClose={() => setShowCreate(false)} onSave={savePlayer} />
      {editPlayer && (
        <PlayerSheet
          open={!!editPlayer}
          onClose={() => setEditPlayer(null)}
          initial={editPlayer}
          onSave={(p) => { savePlayer(p); setEditPlayer(null) }}
        />
      )}
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => removePlayer(confirmDelete)}
        title="Supprimer ce joueur ?"
        message="Il sera retiré de votre bibliothèque (les parties existantes ne sont pas affectées)."
        confirmLabel="Supprimer"
        danger
      />
    </div>
  )
}
