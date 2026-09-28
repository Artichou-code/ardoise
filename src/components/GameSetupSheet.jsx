import { useState, useEffect, useMemo } from 'react'
import { Plus, X, Check, BookOpen, Bookmark, BookmarkPlus, Sparkles } from 'lucide-react'
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

export function GameSetupSheet({ gameType, initialPreset, onClose, onOpenRules }) {
  const { players: savedPlayers, savePlayer, createGame, customPresets, savePreset, deletePreset } = useGame()
  const [selectedPlayers, setSelectedPlayers] = useState([])
  const [config, setConfig] = useState({ scoreDir: 'high', limit: 100 })
  const [customGameName, setCustomGameName] = useState('')
  const [savedSuccessMsg, setSavedSuccessMsg] = useState(null)
  const [showCreator, setShowCreator] = useState(false)

  // Tri alphabétique strict A-Z (insensible à la casse et aux accents)
  const sortedSavedPlayers = useMemo(() => {
    return [...savedPlayers].sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', 'fr', { sensitivity: 'base' })
    )
  }, [savedPlayers])

  useEffect(() => {
    if (initialPreset) {
      setCustomGameName(initialPreset.name || '')
      setConfig({
        scoreDir: initialPreset.scoreDir || 'high',
        limit: initialPreset.limit || 100,
        specialRule: initialPreset.specialRule || { enabled: false, target: 100, action: 'divide', value: 2 },
      })
      setSavedSuccessMsg(null)
      return
    }

    if (gameType === 'dourak') {
      setConfig({
        scoreDir: 'low',
        mode: 'defeats',
        endCondition: 'limit',
        limit: 5,
      })
      setCustomGameName('')
    } else if (gameType === 'belote') {
      setConfig({ limit: 1000 })
      setCustomGameName('')
    } else if (gameType === 'caracole') {
      setConfig({ limit: 100, sursis: true, sursisType: 'half' })
      setCustomGameName('')
    } else if (gameType === 'universel') {
      setConfig({
        scoreDir: 'high',
        limit: 100,
        specialRule: { enabled: false, target: 100, action: 'divide', value: 2 },
      })
      setCustomGameName('')
    } else {
      setConfig({})
      setCustomGameName('')
    }
    setSavedSuccessMsg(null)
  }, [gameType, initialPreset])

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

  const loadPresetIntoConfig = (preset) => {
    setCustomGameName(preset.name || '')
    setConfig({
      scoreDir: preset.scoreDir || 'high',
      limit: preset.limit || 100,
      specialRule: preset.specialRule || { enabled: false, target: 100, action: 'divide', value: 2 },
    })
    setSavedSuccessMsg(`Modèle « ${preset.name} » chargé`)
    setTimeout(() => setSavedSuccessMsg(null), 2500)
  }

  const handleSaveCurrentAsPreset = () => {
    const name = customGameName.trim() || 'Mon Jeu'
    const newPreset = {
      id: initialPreset?.id || Date.now().toString(),
      name,
      scoreDir: config.scoreDir || 'high',
      limit: config.limit || 100,
      specialRule: config.specialRule || { enabled: false, target: 100, action: 'divide', value: 2 },
      updatedAt: Date.now(),
    }
    savePreset(newPreset)
    setCustomGameName(name)
    setSavedSuccessMsg(`Modèle « ${name} » enregistré !`)
    setTimeout(() => setSavedSuccessMsg(null), 3000)
  }

  const canStart = selectedPlayers.length >= (meta.minPlayers || 2)

  const handleStart = () => {
    const finalConfig = {
      ...config,
      customGameName: gameType === 'universel' ? (customGameName.trim() || undefined) : undefined,
    }
    createGame(gameType, selectedPlayers, finalConfig)
    onClose()
  }

  const sheetTitle = gameType === 'universel' && customGameName.trim() ? customGameName.trim() : meta.name
  const sheetSubtitle = gameType === 'universel' && customGameName.trim()
    ? `Modèle personnalisé · ${meta.playersBadge}`
    : `${meta.playersBadge} · ${meta.categoryBadge}`

  return (
    <>
      <BottomSheet
        open={!!gameType}
        onClose={onClose}
        title={sheetTitle}
        subtitle={sheetSubtitle}
      >
        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center justify-between gap-2.5 min-h-[38px]">
            {selectedPlayers.length === 0 ? (
              <p className="text-xs text-stone-600 dark:text-slate-400 flex-1 leading-relaxed">
                {meta.description}
              </p>
            ) : (
              <div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide py-1">
                <div className="flex items-center gap-2.5">
                  {selectedPlayers.map(p => (
                    <div key={p.id} className="shrink-0 flex flex-col items-center gap-0.5">
                      <div className="relative p-0.5">
                        <Avatar player={p} size="sm" />
                        <button
                          type="button"
                          onClick={() => setSelectedPlayers(prev => prev.filter(sp => sp.id !== p.id))}
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-stone-800 dark:bg-slate-200 text-white dark:text-slate-900 flex items-center justify-center shadow-xs hover:bg-[#c83b3b] dark:hover:bg-[#c83b3b] hover:text-white transition-colors"
                          title={`Retirer ${p.name}`}
                          aria-label={`Retirer ${p.name}`}
                        >
                          <X size={10} strokeWidth={2.5} />
                        </button>
                      </div>
                      <span className="text-[10px] font-semibold text-stone-700 dark:text-slate-300 max-w-[52px] truncate text-center">
                        {p.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {onOpenRules && (
              <button
                type="button"
                onClick={() => onOpenRules(gameType)}
                className="w-8 h-8 rounded-xl border border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-400 hover:border-[#c83b3b] hover:text-[#c83b3b] flex items-center justify-center transition-colors shrink-0"
                title="Consulter les règles"
                aria-label="Règles"
              >
                <BookOpen size={16} />
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
                    { val: 50, title: '50 pts', sub: '(Courte)' },
                    { val: 100, title: '100 pts', sub: '(Classique)' },
                    { val: 200, title: '200 pts', sub: '(Longue)' },
                  ].map(({ val, title, sub }) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setConfig(c => ({ ...c, limit: val }))}
                      className={`py-2 px-1 rounded-xl text-center border transition-colors ${
                        (config.limit || 100) === val
                          ? 'border-[#c83b3b] bg-[#c83b3b] text-white'
                          : 'school-subtle'
                      }`}
                    >
                      <span className="block font-bold text-xs">{title}</span>
                      <span className="block text-[10px] font-semibold opacity-85 mt-0.5">{sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 mb-1.5">
                  Règle du sursis (pile au seuil)
                </p>
                <div className={`grid ${config.limit === 50 ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
                  {[
                    {
                      id: 'half',
                      title: 'Divisé par 2',
                      sub: `(→ ${Math.floor((config.limit || 100) / 2)} pts)`,
                    },
                    ...(config.limit === 50
                      ? [{ id: 'zero', title: 'Remis à 0', sub: '(0 pt)' }]
                      : []),
                    { id: 'none', title: 'Sans sursis' },
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
                        className={`py-2 px-1 text-center rounded-xl border transition-colors ${
                          active
                            ? 'border-[#c83b3b] bg-[#c83b3b]/15 text-[#c83b3b]'
                            : 'school-subtle'
                        }`}
                      >
                        <span className="block font-bold text-xs leading-tight">{opt.title}</span>
                        {opt.sub && (
                          <span className="block text-[10px] font-semibold opacity-85 leading-tight mt-0.5">
                            {opt.sub}
                          </span>
                        )}
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
            <div className="space-y-3.5 pt-1">
              {/* Modèles personnalisés sauvegardés */}
              {customPresets && customPresets.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 mb-1.5 flex items-center gap-1.5">
                    <Bookmark size={13} className="text-[#c83b3b]" /> Vos modèles enregistrés
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {customPresets.map(preset => (
                      <div
                        key={preset.id}
                        className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/80 text-xs font-semibold hover:border-[#c83b3b] transition-all group"
                      >
                        <button
                          type="button"
                          onClick={() => loadPresetIntoConfig(preset)}
                          className="text-stone-800 dark:text-slate-200 hover:text-[#c83b3b] transition-colors"
                        >
                          {preset.name}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            deletePreset(preset.id)
                          }}
                          title="Supprimer ce modèle"
                          className="p-1 rounded-full text-stone-400 hover:text-red-500 hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Champ Nom du jeu */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 mb-1.5 block">
                  Nom du jeu
                </label>
                <input
                  type="text"
                  placeholder="Ex: Cabo, Tamalou, Golf, Skyjo..."
                  value={customGameName}
                  onChange={(e) => setCustomGameName(e.target.value)}
                  maxLength={30}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-stone-900 dark:text-slate-100 placeholder-stone-400 focus:outline-none focus:border-[#c83b3b]"
                />
              </div>

              {/* Règle de victoire */}
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

              {/* Seuil si low_limit */}
              {config.scoreDir === 'low_limit' && (
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
              )}

              {/* Règle spécifique de palier modulable (Cabo / Tamalou / etc.) */}
              <div className="pt-2 border-t border-stone-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={15} className="text-[#c83b3b]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-slate-300">
                      Règle de palier spécifique
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setConfig(c => {
                        const currentRule = c.specialRule || { enabled: false, target: c.limit || 100, action: 'divide', value: 2 }
                        return {
                          ...c,
                          specialRule: {
                            ...currentRule,
                            enabled: !currentRule.enabled,
                            target: currentRule.target || c.limit || 100,
                          }
                        }
                      })
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                      config.specialRule?.enabled
                        ? 'bg-[#c83b3b] text-white border-[#c83b3b]'
                        : 'border-stone-300 dark:border-slate-700 text-stone-500 dark:text-slate-400 hover:border-stone-400'
                    }`}
                  >
                    {config.specialRule?.enabled ? 'Activée' : 'Désactivée'}
                  </button>
                </div>

                {config.specialRule?.enabled && (
                  <div className="p-3 rounded-xl bg-stone-50 dark:bg-slate-800/60 border border-stone-200 dark:border-slate-700/80 space-y-3">
                    {/* Score cible */}
                    <div>
                      <label className="text-[11px] font-bold text-stone-600 dark:text-slate-300 uppercase tracking-wide block mb-1">
                        Si un joueur atteint exactement :
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex gap-1.5">
                          {[50, 100, 150, 200].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setConfig(c => ({
                                ...c,
                                specialRule: { ...c.specialRule, target: val }
                              }))}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                (config.specialRule?.target ?? 100) === val
                                  ? 'border-[#c83b3b] bg-[#c83b3b] text-white'
                                  : 'border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-700 dark:text-slate-300'
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 w-20">
                          <input
                            type="number"
                            min="1"
                            max="9999"
                            value={config.specialRule?.target ?? 100}
                            onChange={e => {
                              const val = parseInt(e.target.value, 10)
                              setConfig(c => ({
                                ...c,
                                specialRule: { ...c.specialRule, target: isNaN(val) ? '' : val }
                              }))
                            }}
                            className="w-full px-2 py-1.5 text-center text-xs font-bold rounded-lg border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-slate-100 focus:outline-none focus:border-[#c83b3b]"
                          />
                          <span className="text-[11px] font-semibold text-stone-400">pts</span>
                        </div>
                      </div>
                    </div>

                    {/* Action */}
                    <div>
                      <label className="text-[11px] font-bold text-stone-600 dark:text-slate-300 uppercase tracking-wide block mb-1">
                        Effet sur ses points :
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: 'divide', label: 'Diviser par', icon: '÷' },
                          { id: 'multiply', label: 'Multiplier par', icon: '×' },
                          { id: 'set', label: 'Ramener à', icon: '=' },
                        ].map(act => (
                          <button
                            key={act.id}
                            type="button"
                            onClick={() => setConfig(c => {
                              const currentAction = c.specialRule?.action || 'divide'
                              let defVal = c.specialRule?.value ?? 2
                              if (act.id === 'set' && currentAction !== 'set') defVal = 0
                              if (act.id !== 'set' && currentAction === 'set') defVal = 2
                              return {
                                ...c,
                                specialRule: { ...c.specialRule, action: act.id, value: defVal }
                              }
                            })}
                            className={`py-2 px-1 text-center rounded-lg text-xs font-bold border transition-colors ${
                              (config.specialRule?.action || 'divide') === act.id
                                ? 'border-[#c83b3b] bg-[#c83b3b]/15 text-[#c83b3b] dark:text-red-300 font-extrabold'
                                : 'border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-700 dark:text-slate-300'
                            }`}
                          >
                            <span className="block text-sm leading-none mb-0.5">{act.icon}</span>
                            <span className="block text-[11px] leading-tight">{act.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Valeur de l'effet */}
                    <div>
                      <label className="text-[11px] font-bold text-stone-600 dark:text-slate-300 uppercase tracking-wide block mb-1">
                        {config.specialRule?.action === 'divide' && 'Diviseur :'}
                        {config.specialRule?.action === 'multiply' && 'Multiplicateur :'}
                        {config.specialRule?.action === 'set' && 'Nouveau score fixe :'}
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex gap-1.5">
                          {(config.specialRule?.action === 'divide' ? [2, 3, 4] :
                            config.specialRule?.action === 'multiply' ? [2, 3, 5] :
                            [0, 25, 50]
                          ).map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setConfig(c => ({
                                ...c,
                                specialRule: { ...c.specialRule, value: val }
                              }))}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                (config.specialRule?.value ?? (config.specialRule?.action === 'set' ? 0 : 2)) === val
                                  ? 'border-[#c83b3b] bg-[#c83b3b] text-white'
                                  : 'border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-700 dark:text-slate-300'
                              }`}
                            >
                              {config.specialRule?.action === 'divide' ? `÷${val}` :
                               config.specialRule?.action === 'multiply' ? `×${val}` :
                               `${val} pts`}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 w-20">
                          <input
                            type="number"
                            min="0"
                            max="9999"
                            value={config.specialRule?.value ?? (config.specialRule?.action === 'set' ? 0 : 2)}
                            onChange={e => {
                              const val = parseInt(e.target.value, 10)
                              setConfig(c => ({
                                ...c,
                                specialRule: { ...c.specialRule, value: isNaN(val) ? '' : val }
                              }))
                            }}
                            className="w-full px-2 py-1.5 text-center text-xs font-bold rounded-lg border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-slate-100 focus:outline-none focus:border-[#c83b3b]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Aperçu dynamique */}
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] leading-relaxed text-amber-900 dark:text-amber-200">
                      <span className="font-bold">Effet en jeu : </span>
                      {(() => {
                        const tgt = config.specialRule?.target || 100
                        const act = config.specialRule?.action || 'divide'
                        const val = config.specialRule?.value ?? (act === 'set' ? 0 : 2)
                        let result = tgt
                        if (act === 'divide') result = Math.floor(tgt / (val || 1))
                        if (act === 'multiply') result = tgt * val
                        if (act === 'set') result = val
                        return `Si un joueur atteint exactement ${tgt} pts, ses points deviennent ${result} pts !`
                      })()}
                    </div>
                  </div>
                )}

                {/* Bouton pour enregistrer le modèle */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleSaveCurrentAsPreset}
                    className="w-full py-2.5 px-3 rounded-xl border border-stone-300 dark:border-slate-700 hover:border-[#c83b3b] dark:hover:border-[#c83b3b] text-stone-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-all bg-white dark:bg-slate-800"
                  >
                    <BookmarkPlus size={15} className="text-[#c83b3b]" />
                    Enregistrer ces règles comme modèle
                  </button>

                  {savedSuccessMsg && (
                    <div className="mt-2 p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold text-center flex items-center justify-center gap-1.5 animate-fadeIn">
                      <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                      {savedSuccessMsg}
                    </div>
                  )}
                </div>
              </div>
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
