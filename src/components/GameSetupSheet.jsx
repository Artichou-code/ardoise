import { useState, useEffect } from 'react'
import { Plus, X, Check, BookOpen } from 'lucide-react'
import { BottomSheet } from './ui/BottomSheet'
import { Avatar, AvatarColorPicker } from './ui/Avatar'
import { useGame } from '../context/GameContext'
import { GAME_META, AVATAR_COLORS } from '../constants/games'
import { createPlayer } from '../utils/gameUtils'

function PlayerCreatorSheet({ open, onClose, onAdd }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(AVATAR_COLORS[0])

  const handleAdd = () => {
    if (!name.trim()) return
    onAdd(createPlayer(name, color))
    setName('')
    setColor(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)])
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Nouveau joueur">
      <div className="px-5 py-4 space-y-4">
        {/* Aperçu de l'avatar à initiale + saisie du prénom */}
        <div className="flex items-center gap-3">
          <Avatar player={{ name: name || 'A', color }} size="lg" />
          <input
            type="text"
            placeholder="Prénom du joueur"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="flex-1 px-4 py-3 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-base font-semibold text-stone-900 dark:text-slate-100 placeholder-stone-400 focus:outline-none focus:border-[#c83b3b]"
            autoFocus
            maxLength={20}
          />
        </div>

        {/* Sélecteur de teintes de craies / feutres d'écolier */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400 mb-2">
            Couleur de craie / encre
          </p>
          <AvatarColorPicker selected={color} onSelect={setColor} />
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!name.trim()}
          className="w-full py-3.5 rounded-xl font-bold text-base disabled:opacity-40 btn-margin-red"
        >
          Ajouter
        </button>
      </div>
    </BottomSheet>
  )
}

export function GameSetupSheet({ gameType, onClose, onOpenRules }) {
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
    const teamNous = createPlayer('Nous', '#1e3a5f')
    const teamEux = createPlayer('Eux', '#c83b3b')
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
      <BottomSheet
        open={!!gameType}
        onClose={onClose}
        title={meta.name}
        subtitle={`${meta.playersBadge} · ${meta.categoryBadge}`}
      >
        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-stone-600 dark:text-slate-400 flex-1">
              {meta.description}
            </p>
            {onOpenRules && (
              <button
                type="button"
                onClick={() => onOpenRules(gameType)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-slate-700 text-xs font-semibold text-stone-700 dark:text-slate-300 hover:border-[#c83b3b] hover:text-[#c83b3b] transition-colors flex-shrink-0"
              >
                <BookOpen size={13} /> Règles
              </button>
            )}
          </div>

          {/* Raccourci 2 équipes pour Belote / Coinche */}
          {gameType === 'belote' && (
            <button
              type="button"
              onClick={handleQuickBeloteTeams}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs border border-[#c83b3b] bg-[#c83b3b]/10 text-[#c83b3b] dark:text-red-300 flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
            >
              Lancer directement : Équipe Nous vs Équipe Eux
            </button>
          )}

          {/* Joueurs sélectionnés */}
          {selectedPlayers.length > 0 && (
            <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
              {selectedPlayers.map(p => (
                <div key={p.id} className="flex-shrink-0 flex flex-col items-center gap-1">
                  <div className="relative">
                    <Avatar player={p} size="sm" />
                    <button
                      type="button"
                      onClick={() => setSelectedPlayers(prev => prev.filter(sp => sp.id !== p.id))}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-stone-800 dark:bg-slate-200 flex items-center justify-center"
                    >
                      <X size={10} className="text-white dark:text-slate-900" />
                    </button>
                  </div>
                  <span className="text-[11px] font-medium text-stone-700 dark:text-slate-300 max-w-[54px] truncate">
                    {p.name}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Joueurs enregistrés */}
          {savedPlayers.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 mb-2">
                Joueurs enregistrés ({selectedPlayers.length}/{meta.maxPlayers})
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-hide">
                {savedPlayers.map(p => {
                  const isSelected = !!selectedPlayers.find(sp => sp.id === p.id)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleSavedPlayer(p)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
                        isSelected
                          ? 'border-[#c83b3b] bg-[#c83b3b]/10 text-stone-900 dark:text-slate-100'
                          : 'border-stone-200 dark:border-slate-800 bg-stone-50/70 dark:bg-slate-800/40 text-stone-800 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Avatar player={p} size="xs" />
                      <span className="font-semibold text-sm">{p.name}</span>
                      {isSelected && <Check size={16} className="ml-auto text-[#c83b3b]" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Config spécifique Caracole */}
          {gameType === 'caracole' && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500">
                Seuil d'élimination
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[50, 100, 200].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setConfig(c => ({ ...c, limit: val }))}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                      (config.limit || 100) === val
                        ? 'border-[#c83b3b] bg-[#c83b3b] text-white'
                        : 'border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-800 text-stone-700 dark:text-slate-300'
                    }`}
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
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500">
                Règle de victoire
              </p>
              {[
                { value: 'high', label: 'Le score le plus élevé gagne' },
                { value: 'low_limit', label: 'Le premier à X points perd' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setConfig(c => ({ ...c, scoreDir: opt.value }))}
                  className={`w-full px-4 py-3 rounded-xl text-sm font-semibold text-left border transition-colors ${
                    (config.scoreDir || 'high') === opt.value
                      ? 'border-[#c83b3b] bg-[#c83b3b] text-white'
                      : 'border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-800 text-stone-700 dark:text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              {config.scoreDir === 'low_limit' && (
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[50, 100, 150, 200].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setConfig(c => ({ ...c, limit: val }))}
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                        (config.limit || 100) === val
                          ? 'border-[#c83b3b] bg-[#c83b3b] text-white'
                          : 'border-stone-200 dark:border-slate-800 bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300'
                      }`}
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
              type="button"
              onClick={() => setShowCreator(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-xl border border-stone-300 dark:border-slate-700 text-sm font-semibold text-stone-700 dark:text-slate-300 hover:border-[#c83b3b] transition-colors"
            >
              <Plus size={16} /> Ajouter joueur
            </button>
            <button
              type="button"
              onClick={handleStart}
              disabled={!canStart}
              className="flex-1 py-3.5 rounded-xl font-bold text-base disabled:opacity-40 btn-margin-red"
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
