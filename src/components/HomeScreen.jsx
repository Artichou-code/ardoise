import { useState, useMemo } from 'react'
import { History, Users, ChevronRight, BookOpen, Play, Bookmark, Trash2, Clock, Trophy, Scale, Cloud, Radio } from 'lucide-react'
import { useGame } from '../context/GameContext'
import { GAME_META } from '../constants/games'
import { ThemeToggle } from './ui/ThemeToggle'
import { AppLogo } from './ui/AppLogo'
import { GameSetupSheet } from './GameSetupSheet'
import { RulesSheet } from './RulesSheet'
import { GameDetailSheet } from './GameDetailSheet'
import { LegalModal } from './LegalModal'
import { SyncModal } from './SyncModal'
import { LiveSessionModal } from './LiveSessionModal'
import { ArtCreaLogo } from './ui/ArtCreaLogo'
import { ArtCreaUniverseModal } from './ArtCreaUniverseModal'
import { formatDate, formatGameStart } from '../utils/gameUtils'
import { Avatar } from './ui/Avatar'
import { formatTypography } from '../utils/typography'
import { getActiveSession } from '../store/liveSession'

export function HomeScreen() {
  const { games, setScreen, resumeGame, customPresets, deletePreset, createGame, reloadStorage } = useGame()
  const [setupGame, setSetupGame] = useState(null)
  const [setupPreset, setSetupPreset] = useState(null)
  const [rulesGame, setRulesGame] = useState(null)
  const [detailGame, setDetailGame] = useState(null)
  const [legalTab, setLegalTab] = useState(null)
  const [isArtCreaModalOpen, setIsArtCreaModalOpen] = useState(false)
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false)
  const [liveSession, setLiveSession] = useState(() => getActiveSession())

  const activeGames = games.filter(g => g.status === 'active')
  const finishedGames = games.filter(g => g.status === 'finished').slice(0, 3)

  // Nombre de fois où chaque jeu a été joué (parties en cours + terminées)
  const gamePlayCounts = useMemo(() => {
    const counts = {}
    games.forEach(g => {
      if (g.type) counts[g.type] = (counts[g.type] || 0) + 1
    })
    return counts
  }, [games])

  // Tri dynamique : les jeux les plus joués se placent automatiquement en premier
  const sortedGames = useMemo(() => {
    const list = Object.values(GAME_META)
    const initialIndex = list.reduce((acc, m, i) => {
      acc[m.id] = i
      return acc
    }, {})

    return [...list].sort((a, b) => {
      const countA = gamePlayCounts[a.id] || 0
      const countB = gamePlayCounts[b.id] || 0
      if (countB !== countA) return countB - countA
      return initialIndex[a.id] - initialIndex[b.id]
    })
  }, [gamePlayCounts])

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden school-surface select-none">
      {/* Header style cahier d'écolier / ardoise */}
      <header className="flex items-center justify-between px-4 header-safe pb-3 flex-shrink-0 border-b border-stone-200/90 dark:border-slate-800/90 bg-[#faf9f5]/90 dark:bg-[#151719]/90 backdrop-blur-xs">
        <div className="flex items-center gap-2.5">
          <AppLogo className="w-8 h-8 shadow-2xs" />
          <div>
            <h1 className="font-serif-title text-xl font-bold tracking-tight leading-none">
              Ardoise
            </h1>
            <p className="text-[11px] text-stone-500 dark:text-slate-400 leading-none mt-0.5">
              Carnet de scores & règles
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsLiveModalOpen(true)}
            className={`p-2 rounded-xl border transition-colors relative ${
              liveSession
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-700 dark:text-slate-300'
            }`}
            aria-label="Table en direct"
            title={liveSession ? `Session active : ${liveSession.name}` : "Table en direct"}
          >
            <Radio size={18} className={liveSession ? 'animate-pulse' : ''} />
            {liveSession && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setIsSyncModalOpen(true)}
            className="p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Sauvegarde et synchronisation multi-appareils"
            title="Sauvegarde & Sync"
          >
            <Cloud size={18} className="text-stone-700 dark:text-slate-300" />
          </button>
          <button
            type="button"
            onClick={() => setScreen('history')}
            className="p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Historique des parties"
            title="Historique"
          >
            <History size={18} className="text-stone-700 dark:text-slate-300" />
          </button>
          <button
            type="button"
            onClick={() => setScreen('players')}
            className="p-2 rounded-xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Bibliothèque de joueurs"
            title="Joueurs"
          >
            <Users size={18} className="text-stone-700 dark:text-slate-300" />
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* Corps scrollable */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-3 scroll-bottom-space">
        {/* Bannière Session Journée Active */}
        {liveSession && (
          <div
            onClick={() => setIsLiveModalOpen(true)}
            className="mb-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between cursor-pointer hover:bg-emerald-500/15 transition-all shadow-2xs group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200 truncate">
                  Session en direct : {liveSession.name}
                </p>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 truncate">
                  Code salon : <strong className="font-mono tracking-wider">{liveSession.code}</strong> · Table connectée
                </p>
              </div>
            </div>
            <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] group-hover:scale-105 transition-transform flex-shrink-0">
              Voir la table ›
            </span>
          </div>
        )}
        {/* Parties en cours */}
        {activeGames.length > 0 && (
          <section className="mt-4">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="w-1.5 h-3.5 rounded-full bg-[#c83b3b]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                Parties en cours
              </h2>
            </div>
            <div className="space-y-2">
              {activeGames.map(game => (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => resumeGame(game.id)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl school-card hover:border-[#c83b3b] transition-all active:scale-[0.99] text-left shadow-2xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-serif-title font-bold text-base leading-tight">
                        {game.name}
                      </p>
                      <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-400">
                        Manche {game.rounds.length + 1}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-slate-400 truncate mt-1">
                      {game.players.map(p => p.name).join(' · ')}
                    </p>
                    {game.startedAt && (
                      <p className="text-[11px] text-stone-400 dark:text-slate-500 flex items-center gap-1 mt-1">
                        <Clock size={11} className="opacity-70 shrink-0" />
                        <span>Lancée {formatGameStart(game.startedAt)}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-[#c83b3b] text-white shrink-0">
                    <Play size={12} fill="currentColor" /> Reprendre
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Jeux personnalisés enregistrés */}
        {customPresets && customPresets.length > 0 && (
          <section className="mt-4">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-3.5 rounded-full bg-amber-500" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                  Mes jeux enregistrés
                </h2>
              </div>
              <span className="text-[11px] text-stone-400 dark:text-slate-500">
                {customPresets.length} modèle{customPresets.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {customPresets.map(preset => {
                const isSpecial = preset.specialRule?.enabled
                const ruleDesc = isSpecial
                  ? `Si ${preset.specialRule.target} pts → ${
                      preset.specialRule.action === 'divide'
                        ? `÷${preset.specialRule.value || 2}`
                        : preset.specialRule.action === 'multiply'
                        ? `×${preset.specialRule.value || 2}`
                        : `${preset.specialRule.value || 0} pts`
                    }`
                  : (preset.scoreDir === 'low_limit' ? `Seuil de ${preset.limit || 100} pts` : 'Score le plus élevé')

                return (
                  <div
                    key={preset.id}
                    onClick={() => {
                      setSetupPreset(preset)
                      setSetupGame('universel')
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setSetupPreset(preset)
                        setSetupGame('universel')
                      }
                    }}
                    className="relative flex flex-col justify-between p-3.5 rounded-xl school-card hover:border-amber-500 transition-all active:scale-[0.99] cursor-pointer shadow-2xs border-l-4 border-l-amber-500"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Bookmark size={15} className="text-amber-500 shrink-0" />
                          <h3 className="font-serif-title font-bold text-base leading-snug truncate">
                            {preset.name}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            deletePreset(preset.id)
                          }}
                          className="p-1 rounded-lg text-stone-400 hover:text-red-500 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                          title="Supprimer ce modèle"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <p className="text-xs text-stone-500 dark:text-slate-400 truncate mt-1">
                        {ruleDesc}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-stone-100 dark:border-slate-800/70">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                        {preset.scoreDir === 'low_limit' ? `Seuil ${preset.limit || 100} pts` : 'Score max'}
                      </span>
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                        Lancer <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Grille des jeux (Zéro émoji, style Cahier & Ardoise) */}
        <section className="mt-4">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-3.5 rounded-full bg-[#c83b3b]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                Choisir un jeu
              </h2>
            </div>
            <span className="text-[11px] text-stone-400 dark:text-slate-500">
              {Object.keys(GAME_META).length} jeux disponibles
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {sortedGames.map(meta => {
              const playCount = gamePlayCounts[meta.id] || 0
              return (
                <div
                  key={meta.id}
                  onClick={() => setSetupGame(meta.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setSetupGame(meta.id)}
                  className="relative flex flex-col justify-between p-4 rounded-xl school-card hover:border-[#c83b3b] transition-all active:scale-[0.99] cursor-pointer shadow-2xs border-l-4 border-l-[#c83b3b]/80"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-serif-title font-bold text-lg leading-snug">
                        {formatTypography(meta.name)}
                      </h3>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setRulesGame(meta.id)
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800/80 text-[11px] font-semibold text-stone-700 dark:text-slate-300 hover:border-[#c83b3b] hover:text-[#c83b3b] transition-colors flex-shrink-0"
                        title={`Lire les règles de ${meta.name}`}
                      >
                        <BookOpen size={12} />
                        <span>Règles</span>
                      </button>
                    </div>

                    <p className="text-xs text-stone-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {formatTypography(meta.description)}
                    </p>
                  </div>

                  {/* Badges discrets d'écolier */}
                  <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-stone-100 dark:border-slate-800/70">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300">
                      {meta.playersBadge}
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded border border-stone-200 dark:border-slate-700 text-stone-500 dark:text-slate-400">
                      {meta.categoryBadge}
                    </span>
                    {playCount > 0 && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#c83b3b]/10 text-[#c83b3b] border border-[#c83b3b]/20">
                        {playCount} partie{playCount > 1 ? 's' : ''}
                      </span>
                    )}
                    <span className="ml-auto text-xs font-bold text-[#c83b3b] flex items-center gap-0.5">
                      Jouer <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Dernières parties terminées */}
        {finishedGames.length > 0 && (
          <section className="mt-6">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-3.5 rounded-full bg-stone-400 dark:bg-slate-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-slate-400">
                  Dernières parties
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setScreen('history')}
                className="text-xs font-semibold text-[#c83b3b] flex items-center gap-0.5"
              >
                Tout voir <ChevronRight size={14} />
              </button>
            </div>
            <div className="space-y-2">
              {finishedGames.map(game => {
                const winner = game.players.find(p => p.id === (game.winner?.id || game.winner))
                return (
                  <div
                    key={game.id}
                    onClick={() => setDetailGame(game)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setDetailGame(game)}
                    className="flex items-center gap-3 p-3 rounded-xl school-card cursor-pointer hover:border-[#c83b3b]/60 transition-all active:scale-[0.99] group shadow-2xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-serif-title font-bold text-sm truncate">
                          {game.name}
                        </p>
                        <span className="text-[10px] font-semibold text-stone-400 group-hover:text-[#c83b3b] transition-colors">
                          · {game.rounds.length} m.
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-slate-400">
                        {formatDate(game.finishedAt || game.startedAt)}
                      </p>
                    </div>
                    {winner && (
                      <div className="flex flex-col items-center shrink-0 min-w-[56px] pt-1">
                        <div className="relative">
                          <Avatar player={winner} size="xs" leader leaderColor="#10b981" />
                          <span
                            className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-2xs ring-1 ring-white dark:ring-slate-900"
                            title="Vainqueur"
                          >
                            <Trophy size={8} strokeWidth={2.5} />
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-stone-700 dark:text-slate-300 truncate max-w-[64px] text-center leading-none mt-2">
                          {winner.name}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Footer institutionnel & Hub Juridique minimaliste sur une seule ligne */}
        <footer className="mt-4 pt-3 pb-1 border-t border-stone-200/50 dark:border-slate-800/50 flex items-center justify-center gap-2 text-center select-none">
          <div className="flex items-center gap-1.5 text-stone-600 dark:text-slate-400">
            <span className="font-serif-title font-bold text-stone-800 dark:text-slate-200 text-sm leading-none">
              Ardoise
            </span>
            <span className="font-serif italic text-stone-400 dark:text-slate-500 text-xs leading-none">by</span>
            <button
              type="button"
              onClick={() => setIsArtCreaModalOpen(true)}
              className="inline-flex items-center cursor-pointer hover:scale-105 active:scale-95 transition-transform focus:outline-none"
              title="Découvrir l'univers ART-créa"
              aria-label="Découvrir l'univers ART-créa"
            >
              <ArtCreaLogo className="h-[17px] self-center" />
            </button>
          </div>

          <span className="text-stone-300 dark:text-slate-700 select-none">·</span>

          <button
            type="button"
            onClick={() => setLegalTab('mentions')}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer group"
            title="Ouvrir le Hub juridique (Mentions légales, Confidentialité, CGU)"
          >
            <Scale size={12} className="text-[#c83b3b] group-hover:scale-110 transition-transform" />
            <span className="underline underline-offset-2 decoration-stone-300 dark:decoration-slate-700 group-hover:decoration-current">
              Hub juridique
            </span>
          </button>

          <span className="text-stone-300 dark:text-slate-700 select-none">·</span>

          <button
            type="button"
            onClick={() => setIsSyncModalOpen(true)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer group"
            title="Sauvegarde et synchronisation multi-appareils"
          >
            <Cloud size={12} className="text-[#c83b3b] group-hover:scale-110 transition-transform" />
            <span className="underline underline-offset-2 decoration-stone-300 dark:decoration-slate-700 group-hover:decoration-current">
              Sauvegarde & Sync
            </span>
          </button>

          <span className="text-stone-300 dark:text-slate-700 select-none">·</span>

          <button
            type="button"
            onClick={() => setIsLiveModalOpen(true)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer group"
            title="Table en direct"
          >
            <Radio size={12} className={liveSession ? "text-emerald-500 animate-pulse" : "text-[#c83b3b] group-hover:scale-110 transition-transform"} />
            <span className="underline underline-offset-2 decoration-stone-300 dark:decoration-slate-700 group-hover:decoration-current">
              Table en direct
            </span>
          </button>
        </footer>
      </div>

      {/* Feuille de détails et déroulement complet */}
      <GameDetailSheet
        game={detailGame}
        open={!!detailGame}
        onClose={() => setDetailGame(null)}
        onResume={(id) => {
          setDetailGame(null)
          resumeGame(id)
        }}
        onRematch={(g) => {
          setDetailGame(null)
          createGame(g.type, g.players, g.config)
        }}
      />

      {/* Modale de préparation de partie */}
      <GameSetupSheet
        gameType={setupGame}
        initialPreset={setupPreset}
        onClose={() => {
          setSetupGame(null)
          setSetupPreset(null)
        }}
        onOpenRules={(type) => setRulesGame(type)}
      />

      {/* Bottom Sheet de consultation des Règles Officielles */}
      <RulesSheet
        gameType={rulesGame}
        onClose={() => setRulesGame(null)}
        onStartSetup={(type) => setSetupGame(type)}
      />

      {/* Hub Juridique (Mentions Légales, Confidentialité RGPD, CGU) */}
      <LegalModal
        open={Boolean(legalTab)}
        onClose={() => setLegalTab(null)}
        activeTab={legalTab}
        onSelectTab={setLegalTab}
      />

      {/* Modale interactive : Univers ART-créa */}
      <ArtCreaUniverseModal
        isOpen={isArtCreaModalOpen}
        onClose={() => setIsArtCreaModalOpen(false)}
      />

      {/* Modale Sauvegarde & Synchronisation (Multi-appareils / Fichier) */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onDataUpdated={reloadStorage}
      />

      {/* Modale Session Journée & Table en direct */}
      <LiveSessionModal
        isOpen={isLiveModalOpen}
        onClose={() => setIsLiveModalOpen(false)}
        onSessionChanged={(s) => setLiveSession(s)}
      />
    </div>
  )
}
