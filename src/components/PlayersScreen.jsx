import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Pencil, Trash2, Users } from 'lucide-react'
import { useGame } from '../context/GameContext'
import { Avatar, AvatarPicker } from './ui/Avatar'
import { BottomSheet } from './ui/BottomSheet'
import { ConfirmDialog } from './ui/Dialog'
import { ThemeToggle } from './ui/ThemeToggle'
import { createPlayer, getPlayerAvatarUrl } from '../utils/gameUtils'
import { AVATAR_COLORS, PRESET_AVATARS } from '../constants/games'

function PlayerSheet({ open, onClose, initial, onSave }) {
  const [name, setName] = useState(initial?.name || '')
  const [color, setColor] = useState(initial?.color || AVATAR_COLORS[0])
  const [avatar, setAvatar] = useState(
    initial ? getPlayerAvatarUrl(initial) : PRESET_AVATARS[0]
  )

  useEffect(() => {
    setName(initial?.name || '')
    setColor(initial?.color || AVATAR_COLORS[0])
    setAvatar(
      initial
        ? getPlayerAvatarUrl(initial)
        : PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)]
    )
  }, [initial, open])

  const handleSave = () => {
    if (!name.trim()) return
    onSave(
      initial
        ? { ...initial, name: name.trim(), color, avatar }
        : createPlayer(name, color, avatar)
    )
    onClose()
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={initial ? 'Modifier le joueur' : 'Nouveau joueur'}
    >
      <div className="px-5 py-4 space-y-4">
        <div className="flex items-center gap-3">
          <Avatar player={{ name: name || 'A', color, avatar }} size="lg" />
          <input
            type="text"
            placeholder="Prénom du joueur"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            className="flex-1 px-4 py-3 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-base font-semibold text-stone-900 dark:text-slate-100 placeholder-stone-400 focus:outline-none focus:border-[#c83b3b]"
            autoFocus
            maxLength={20}
          />
        </div>

        <AvatarPicker
          selectedAvatar={avatar}
          onSelectAvatar={setAvatar}
          selectedColor={color}
          onSelectColor={setColor}
          playerName={name || 'A'}
        />

        <button
          type="button"
          onClick={handleSave}
          disabled={!name.trim()}
          className="w-full py-3.5 rounded-xl font-bold text-base disabled:opacity-40 btn-margin-red"
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
    <div className="flex flex-col h-[100dvh] overflow-hidden school-surface">
      <header className="flex items-center gap-2 px-4 pt-safe pt-3.5 pb-3 flex-shrink-0 border-b border-stone-200/90 dark:border-slate-800/90 bg-[#faf9f5]/90 dark:bg-[#151719]/90 backdrop-blur-xs">
        <button
          type="button"
          onClick={() => setScreen('home')}
          className="p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Retour"
        >
          <ArrowLeft size={18} className="text-stone-700 dark:text-slate-300" />
        </button>
        <h1 className="flex-1 font-serif-title font-bold text-lg">
          Carnet de joueurs
        </h1>
        <ThemeToggle />
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs btn-margin-red"
        >
          <Plus size={15} /> Ajouter
        </button>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-6">
        {players.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-12 h-12 rounded-2xl school-card flex items-center justify-center mb-3">
              <Users size={22} className="text-stone-400 dark:text-slate-500" />
            </div>
            <p className="font-serif-title font-bold text-base mb-1">
              Aucun joueur enregistré
            </p>
            <p className="text-stone-500 dark:text-slate-400 text-xs mb-5">
              Enregistrez vos partenaires habituels pour lancer vos parties en deux clics.
            </p>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="px-5 py-3 rounded-xl font-bold text-sm btn-margin-red"
            >
              Ajouter un premier joueur
            </button>
          </div>
        ) : (
          <div className="space-y-2 mt-4">
            {players.map(p => (
              <div
                key={p.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl school-card"
              >
                <Avatar player={p} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{p.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditPlayer(p)}
                  className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label={`Modifier ${p.name}`}
                >
                  <Pencil size={15} className="text-stone-500 dark:text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(p.id)}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  aria-label={`Supprimer ${p.name}`}
                >
                  <Trash2 size={15} className="text-[#c83b3b]" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <PlayerSheet
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSave={savePlayer}
      />
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
        message="Il sera retiré de votre bibliothèque (les parties archivées ne sont pas affectées)."
        confirmLabel="Supprimer"
        danger
      />
    </div>
  )
}
