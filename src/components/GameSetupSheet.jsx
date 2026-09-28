import { useState, useEffect } from 'react'
import { Plus, X, Check } from 'lucide-react'
import { BottomSheet } from './ui/BottomSheet'
import { Avatar, AvatarColorPicker, AvatarEmojiPicker } from './ui/Avatar'
import { useGame } from '../context/GameContext'
import { GAME_META, AVATAR_COLORS, AVATAR_EMOJIS } from '../constants/games'
import { createPlayer } from '../utils/gameUtils'

function PlayerCreatorSheet({ open, onClose, onAdd }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(AVATAR_COLORS[0])
  const [emoji, setEmoji] = useState(AVATAR_EMOJIS[0])
  const [tab, setTab] = useState('emoji')

  const handleAdd = () => {
    if (!name.trim()) return
    onAdd(createPlayer(name, color, emoji))
    setName('')
    setColor(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)])
    setEmoji(AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)])
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Nouveau joueur">
      <div className="px-4 pb-4 space-y-4">
        <div className="flex items-center gap-3">
          <Avatar player={{ name, color, emoji }} size="lg" />
          <input
            type="text"
            placeholder="Prénom du joueur"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
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
          onClick={handleAdd}
          disabled={!name.trim()}
          className="w-full py-3.5 rounded-xl font-bold text-base disabled:opacity-40 transition-all active:scale-[0.98] text-[#18181b]"
          style={{ backgroundColor: '#fcc817' }}
        >
          Ajouter
        </button>
      </div>
    </BottomSheet>
  )
}

export function GameSetupSheet({ gameType, onClose }) {
  const { players: savedPlayers, savePlayer, createGame } = useGame()
  const [selectedPlayers, setSelectedPlayers] = useState([])
  const [config, setConfig] = useState({ scoreDir: 'high', limit: 100 })
  const [showCreator, setShowCreator] = useState(false)

  useEffect(() => {
    if (gameType === 'belote') {
      setConfig({ limit: 1000 })
    } else if (gameType === 'caracole') {
      setConfig({ limit: 100 })
    } else if (gameType === 'universel') {
      setConfig({ scoreDir: 'high', limit: 100 })
    } else {
      setConfig({})
    }
  }, [gameType])

  const meta = gameType ? GAME_META[gameType] : null
  if (!meta) return null

  const toggleSavedPlayer = (p) => {
    if (selectedPlayers.find(sp => sp.id === p.id)) {
      setSelectedPlayers(prev => prev.filter(sp => sp.id !== p.id))
    } else if (selectedPlayers.length < (meta.maxPlayers || 8)) {
      setSelectedPlayers(prev => [...prev, p])
    }
  }

  const handleAddNew = (player) => {
    savePlayer(player)
    if (selectedPlayers.length < (meta.maxPlayers || 8)) {
      setSelectedPlayers(prev => [...prev, player])
    }
  }

  const handleQuickBeloteTeams = () => {
    const teamNous = createPlayer('Nous', '#3b82f6', '🤝')
    const teamEux = createPlayer('Eux', '#ef4444', '👥')
    createGame(gameType, [teamNous, teamEux], config)
    onClose()
  }

  const canStart = selectedPlayers.length >= (meta.minPlayers || 2)

  const handleStart = () => {
    createGame(gameType, selectedPlayers, config)
    onClose()
  }

  return (
    <>
      <BottomSheet open={!!gameType} onClose={onClose} title={`${meta.emoji} ${meta.name}`}>
        <div className="px-4 pb-4 space-y-4">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{meta.description}</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            {meta.minPlayers} à {meta.maxPlayers} joueurs
          </p>

          {/* Raccourci 2 équipes pour Belote / Coinche */}
          {gameType === 'belote' && (
            <button
              onClick={handleQuickBeloteTeams}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm border-2 border-[#fcc817] bg-[#fcc817]/15 text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              ⚡ Lancer rapidement (Équipe Nous vs Équipe Eux)
            </button>
          )}

          {/* Joueurs sélectionnés */}
          {selectedPlayers.length > 0 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {selectedPlayers.map(p => (
                <div key={p.id} className="flex-shrink-0 flex flex-col items-center gap-1">
                  <div className="relative">
                    <Avatar player={p} size="sm" />
                    <button
                      onClick={() => setSelectedPlayers(prev => prev.filter(sp => sp.id !== p.id))}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-zinc-800 dark:bg-zinc-200 flex items-center justify-center"
                    >
                      <X size={10} className="text-white dark:text-zinc-900" />
                    </button>
                  </div>
                  <span className="text-[10px] text-zinc-600 dark:text-zinc-400 max-w-[48px] truncate">{p.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Joueurs enregistrés */}
          {savedPlayers.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
                Joueurs récents
              </p>
              <div className="space-y-1">
                {savedPlayers.map(p => {
                  const isSelected = !!selectedPlayers.find(sp => sp.id === p.id)
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleSavedPlayer(p)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                        isSelected
                          ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950'
                          : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                      style={isSelected ? { backgroundColor: '#fcc817', color: '#18181b' } : {}}
                    >
                      <Avatar player={p} size="xs" />
                      <span className="font-semibold text-sm">{p.name}</span>
                      {isSelected && <Check size={16} className="ml-auto" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Config spécifique Caracole */}
          {gameType === 'caracole' && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Palier d'élimination (points)
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[50, 100, 200].map(val => (
                  <button
                    key={val}
                    onClick={() => setConfig(c => ({ ...c, limit: val }))}
                    className={`py-2.5 rounded-xl text-sm font-bold transition-colors ${
                      (config.limit || 100) === val ? 'text-[#18181b]' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                    style={(config.limit || 100) === val ? { backgroundColor: '#fcc817' } : {}}
                  >
                    {val} pts
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Config spécifique Universel */}
          {gameType === 'universel' && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Mode de victoire</p>
              {[
                { value: 'high', label: '🏅 Le score le plus élevé gagne' },
                { value: 'low_limit', label: '💀 Le premier à X points perd' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setConfig(c => ({ ...c, scoreDir: opt.value }))}
                  className={`w-full px-4 py-3 rounded-xl text-sm font-medium text-left transition-colors ${
                    (config.scoreDir || 'high') === opt.value ? 'font-bold' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                  style={(config.scoreDir || 'high') === opt.value ? { backgroundColor: '#fcc817', color: '#18181b' } : {}}
                >
                  {opt.label}
                </button>
              ))}
              {config.scoreDir === 'low_limit' && (
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[50, 100, 150, 200].map(val => (
                    <button
                      key={val}
                      onClick={() => setConfig(c => ({ ...c, limit: val }))}
                      className={`py-2 rounded-xl text-xs font-bold transition-colors ${
                        (config.limit || 100) === val ? 'text-[#18181b]' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                      }`}
                      style={(config.limit || 100) === val ? { backgroundColor: '#fcc817' } : {}}
                    >
                      {val} pts
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => setShowCreator(true)}
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 transition-colors"
            >
              <Plus size={16} /> Nouveau joueur
            </button>
            <button
              onClick={handleStart}
              disabled={!canStart}
              className="flex-1 py-3 rounded-xl font-bold text-base disabled:opacity-40 transition-all active:scale-[0.98] text-[#18181b]"
              style={{ backgroundColor: '#fcc817' }}
            >
              Lancer ({selectedPlayers.length}/{meta.minPlayers}+)
            </button>
          </div>
        </div>
      </BottomSheet>

      <PlayerCreatorSheet
        open={showCreator}
        onClose={() => setShowCreator(false)}
        onAdd={handleAddNew}
      />
    </>
  )
}
