import { useState, useEffect, useMemo } from 'react'
import { Plus, X, Check, BookOpen } from 'lucide-react'
import { BottomSheet } from './ui/BottomSheet'
import { Avatar, AvatarPicker } from './ui/Avatar'
import { useGame } from '../context/GameContext'
import { GAME_META, AVATAR_COLORS, PRESET_AVATARS } from '../constants/games'
import { createPlayer } from '../utils/gameUtils'

function PlayerCreatorSheet({ open, onClose, onAdd }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(AVATAR_COLORS[0])
  const [avatar, setAvatar] = useState(PRESET_AVATARS[0])

  useEffect(() => {
    if (open) {
      setAvatar(PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)])
    }
  }, [open])

  const handleAdd = () => {
    if (!name.trim()) return
    onAdd(createPlayer(name, color, avatar))
    setName('')
    setColor(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)])
    setAvatar(PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)])
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} position="top" title="Nouveau joueur">
      <div className="px-4 py-3 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar player={{ name: name || 'A', color, avatar }} size="md" />
          <input
            type="text"
            placeholder="Prénom du joueur"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-stone-900 dark:text-slate-100 placeholder-stone-400 focus:outline-none focus:border-[#c83b3b]"
            autoFocus
            maxLength={20}
          />
        </div>

        <AvatarPicker
          selectedAvatar={avatar}
          onSelectAvatar={setAvatar}
          selectedColor={color}
          onSelectColor={setColor}
        />

        <button
          type="button"
          onClick={handleAdd}
          disabled={!name.trim()}
          className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-40 btn-margin-red"
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

  // Tri alphabétique strict A-Z (insensible à la casse et aux accents)
  const sortedSavedPlayers = useMemo(() => {
    return [...savedPlayers].sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', 'fr', { sensitivity: 'base' })
    )
  }, [savedPlayers])

  useEffect(() => {
    if (gameType === 'dourak') {
      setConfig({
        scoreDir: 'low',
        mode: 'defeats',
        endCondition: 'limit',
        limit: 5,
      })
    } else if (gameType === 'belote') {
      setConfig({ limit: 1000 })
    } else if (gameType === 'caracole') {
      setConfig({ limit: 100, sursis: true, sursisType: 'half' })
    } else if (gameType === 'universel') {
      setConfig({ scoreDir: 'high', limit: 100, sursis: false, sursisType: 'half' })
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
          {sortedSavedPlayers.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500">
                  Joueurs enregistrés ({selectedPlayers.length}/{meta.maxPlayers})
                </p>
                {selectedPlayers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedPlayers([])}
                    className="text-[11px] font-semibold text-stone-500 hover:text-[#c83b3b] transition-colors"
                  >
                    Désélectionner
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto scrollbar-hide p-0.5">
                {sortedSavedPlayers.map(p => {
                  const isSelected = !!selectedPlayers.find(sp => sp.id === p.id)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleSavedPlayer(p)}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-[#c83b3b] bg-[#c83b3b]/10 text-stone-900 dark:text-slate-100 ring-1 ring-[#c83b3b]/30 font-bold'
                          : 'border-stone-200 dark:border-slate-800 bg-stone-50/70 dark:bg-slate-800/40 text-stone-800 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Avatar player={p} size="xs" />
                      <span className="font-semibold text-xs truncate flex-1 min-w-0">
                        {p.name}
                      </span>
                      {isSelected ? (
                        <Check size={14} className="text-[#c83b3b] flex-shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-stone-300 dark:border-slate-600 flex-shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Config spécifique Dourak */}
          {gameType === 'dourak' && (
            <div className="space-y-3 pt-1">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 mb-1.5">
                  Mode de comptage
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'defeats', label: 'Classique (+1 défaite)', defaultLimit: 5 },
                    { id: 'cards', label: 'Pénalité aux cartes', defaultLimit: 30 },
                  ].map(opt => {
                    const active = (config.mode || 'defeats') === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setConfig(c => ({
                            ...c,
                            mode: opt.id,
                            limit: c.endCondition === 'rounds' ? c.limit : opt.defaultLimit,
                          }))
                        }
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-colors ${
                          active
                            ? 'border-[#c83b3b] bg-[#c83b3b] text-white'
                            : 'school-subtle'
                        }`}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 mb-1.5">
                  Condition de fin de partie
                </p>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {[
                    {
                      id: 'limit',
                      label:
                        config.mode === 'cards'
                          ? 'Seuil de cartes'
                          : 'Seuil de défaites',
                      defaultVal: config.mode === 'cards' ? 30 : 5,
                    },
                    { id: 'rounds', label: 'Nombre de manches', defaultVal: 10 },
                  ].map(cond => {
                    const active = (config.endCondition || 'limit') === cond.id
                    return (
                      <button
                        key={cond.id}
                        type="button"
                        onClick={() =>
                          setConfig(c => ({
                            ...c,
                            endCondition: cond.id,
                            limit: cond.defaultVal,
                          }))
                        }
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                          active
                            ? 'border-[#c83b3b] bg-[#c83b3b] text-white'
                            : 'school-subtle'
                        }`}
                      >
                        {cond.label}
                      </button>
                    )
                  })}
                </div>

                {/* Choix du palier */}
                <div className="grid grid-cols-3 gap-2">
                  {(config.endCondition === 'rounds'
                    ? [5, 10, 15]
                    : config.mode === 'cards'
                    ? [20, 30, 50]
                    : [3, 5, 10]
                  ).map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setConfig(c => ({ ...c, limit: val }))}
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                        config.limit === val
                          ? 'border-[#c83b3b] bg-[#c83b3b]/15 text-[#c83b3b]'
                          : 'school-subtle'
                      }`}
                    >
                      {val}{' '}
                      {config.endCondition === 'rounds'
                        ? 'manches'
                        : config.mode === 'cards'
                        ? 'cartes'
                        : 'défaites'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Config spécifique Caracole */}
          {gameType === 'caracole' && (
            <div className="space-y-3 pt-1">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 mb-1.5">
                  Seuil d'élimination
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 50, label: '50 pts (Courte)' },
                    { val: 100, label: '100 pts (Classique)' },
                    { val: 200, label: '200 pts (Longue)' },
                  ].map(({ val, label }) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setConfig(c => ({ ...c, limit: val }))}
                      className={`py-2.5 px-1 rounded-xl text-xs font-bold border transition-colors ${
                        (config.limit || 100) === val
                          ? 'border-[#c83b3b] bg-[#c83b3b] text-white'
                          : 'school-subtle'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 mb-1.5">
                  Règle du sursis (pile au seuil)
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      id: 'half',
                      label: `Divisé par 2 (→ ${Math.floor((config.limit || 100) / 2)} pts)`,
                    },
                    ...(config.limit === 50
                      ? [{ id: 'zero', label: 'Remis à 0 pt' }]
                      : []),
                    { id: 'none', label: 'Sans sursis' },
                  ].map(opt => {
                    const active =
                      (config.sursis !== false && (config.sursisType || 'half') === opt.id) ||
                      (config.sursis === false && opt.id === 'none')
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setConfig(c => ({
                            ...c,
                            sursis: opt.id !== 'none',
                            sursisType: opt.id === 'none' ? 'none' : opt.id,
                          }))
                        }
                        className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-colors ${
                          active
                            ? 'border-[#c83b3b] bg-[#c83b3b]/15 text-[#c83b3b]'
                            : 'school-subtle'
                        }`}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
                <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-1">
                  {config.sursis !== false
                    ? `Si un joueur atteint exactement ${config.limit || 100} pts, son score retombe à ${
                        config.sursisType === 'zero' ? 0 : Math.floor((config.limit || 100) / 2)
                      } pts au lieu d'être éliminé.`
                    : "Aucun sursis : atteindre ou dépasser le seuil élimine le joueur."}
                </p>
              </div>
            </div>
          )}

          {/* Config spécifique Universel */}
          {gameType === 'universel' && (
            <div className="space-y-3 pt-1">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 mb-1.5">
                  Règle de victoire
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { value: 'high', label: 'Score le plus élevé gagne' },
                    { value: 'low_limit', label: 'Le premier à X points perd (seuil)' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setConfig(c => ({ ...c, scoreDir: opt.value }))}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold text-left border transition-colors ${
                        (config.scoreDir || 'high') === opt.value
                          ? 'border-[#c83b3b] bg-[#c83b3b] text-white font-bold'
                          : 'school-subtle'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {config.scoreDir === 'low_limit' && (
                <>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 mb-1.5">
                      Seuil de fin de partie
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {[50, 100, 150, 200].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setConfig(c => ({ ...c, limit: val }))}
                          className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                            (config.limit || 100) === val
                              ? 'border-[#c83b3b] bg-[#c83b3b] text-white'
                              : 'school-subtle'
                          }`}
                        >
                          {val} pts
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 mb-1.5">
                      Règle du sursis (pile au seuil)
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'half', label: 'Divisé par 2 (÷2)' },
                        { id: 'zero', label: 'Remis à 0' },
                        { id: 'none', label: 'Désactivé' },
                      ].map(opt => {
                        const active =
                          (config.sursis && (config.sursisType || 'half') === opt.id) ||
                          (!config.sursis && opt.id === 'none')
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() =>
                              setConfig(c => ({
                                ...c,
                                sursis: opt.id !== 'none',
                                sursisType: opt.id === 'none' ? 'none' : opt.id,
                              }))
                            }
                            className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-colors ${
                              active
                                ? 'border-[#c83b3b] bg-[#c83b3b]/15 text-[#c83b3b]'
                                : 'school-subtle'
                            }`}
                          >
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-1">
                      {config.sursis && config.sursisType !== 'none'
                        ? `Si un joueur atteint exactement ${config.limit || 100} pts, son score retombe à ${
                            config.sursisType === 'zero' ? 0 : Math.floor((config.limit || 100) / 2)
                          } pts (sursis style Cabo / Tamalou).`
                        : "Le premier joueur qui atteint ou dépasse le seuil est éliminé."}
                    </p>
                  </div>
                </>
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
