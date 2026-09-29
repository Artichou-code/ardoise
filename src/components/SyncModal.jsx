import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Cloud,
  Download,
  Upload,
  Copy,
  Check,
  RefreshCw,
  Smartphone,
  ShieldCheck,
  FileJson,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { useScrollLock } from '../hooks/useScrollLock'
import {
  getSyncKey,
  setSyncKey,
  generateMemorableSyncKey,
  getLastSyncedAt,
  isAutoSyncEnabled,
  setAutoSyncEnabled,
  downloadNotebookBackup,
  validateNotebookPayload,
  applyNotebook,
  synchronizeNotebook,
  exportNotebookPayload,
} from '../store/syncStorage'

export function SyncModal({ isOpen, onClose, onDataUpdated }) {
  const [activeTab, setActiveTab] = useState('cloud') // 'cloud' | 'file'
  const [currentSyncKey, setCurrentSyncKey] = useState('')
  const [inputKey, setInputKey] = useState('')
  const [lastSynced, setLastSynced] = useState(null)
  const [autoSync, setAutoSync] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState(null)
  const [copied, setCopied] = useState(false)
  const [importPreview, setImportPreview] = useState(null)

  const fileInputRef = useRef(null)
  useScrollLock(isOpen)

  useEffect(() => {
    if (!isOpen) return
    let key = getSyncKey()
    if (!key) {
      key = generateMemorableSyncKey()
      setSyncKey(key)
    }
    setCurrentSyncKey(key)
    setLastSynced(getLastSyncedAt())
    setAutoSync(isAutoSyncEnabled())
    setStatusMessage(null)
    setImportPreview(null)
    setCopied(false)
  }, [isOpen])

  const handleCopyKey = () => {
    navigator.clipboard.writeText(currentSyncKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleSyncNow = async () => {
    if (isLoading) return
    setIsLoading(true)
    setStatusMessage(null)
    try {
      const result = await synchronizeNotebook(currentSyncKey)
      setLastSynced(getLastSyncedAt())
      setStatusMessage({ type: 'success', text: result.message })
      if (onDataUpdated) onDataUpdated()
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Échec de synchronisation' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLinkExistingKey = async (e) => {
    e.preventDefault()
    const cleanKey = inputKey.trim().toUpperCase()
    if (!cleanKey) return

    setIsLoading(true)
    setStatusMessage(null)
    try {
      const result = await synchronizeNotebook(cleanKey)
      setCurrentSyncKey(cleanKey)
      setInputKey('')
      setLastSynced(getLastSyncedAt())
      setStatusMessage({
        type: 'success',
        text: `Carnet lié et synchronisé ! (${result.stats.totalGames || 0} parties au total)`,
      })
      if (onDataUpdated) onDataUpdated()
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Impossible de lier ce carnet' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleAutoSync = () => {
    const nextVal = !autoSync
    setAutoSync(nextVal)
    setAutoSyncEnabled(nextVal)
  }

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const payload = JSON.parse(evt.target.result)
        const check = validateNotebookPayload(payload)
        if (!check.valid) {
          setStatusMessage({ type: 'error', text: check.error })
          return
        }
        setImportPreview(payload)
      } catch {
        setStatusMessage({ type: 'error', text: 'Fichier JSON invalide ou corrompu' })
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleConfirmImport = (mode) => {
    if (!importPreview) return
    const result = applyNotebook(importPreview, mode)
    setImportPreview(null)
    setStatusMessage({
      type: 'success',
      text:
        mode === 'replace'
          ? `Carnet restauré intégralement (${result.stats.totalGames} parties)`
          : `Fusion réussie\u00A0: +${result.stats.gamesAdded} parties, +${result.stats.playersAdded} joueurs\u00A0!`,
    })
    if (onDataUpdated) onDataUpdated()
  }

  const localPayload = exportNotebookPayload()
  const gamesCount = localPayload.games?.length || 0
  const playersCount = localPayload.players?.length || 0

  if (!isOpen || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sync-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Conteneur principal */}
      <div className="relative w-full max-w-md school-surface text-stone-900 dark:text-slate-100 border border-stone-200/90 dark:border-slate-800/90 shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Liseré supérieur rouge Ardoise */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#c83b3b] dark:via-[#FFC107] to-transparent z-10" />

        {/* En-tête responsive */}
        <div className="relative z-10 p-3.5 sm:p-4 pb-3 border-b border-stone-200/70 dark:border-slate-800/70 bg-[#faf9f5]/85 dark:bg-[#151719]/85 backdrop-blur-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="p-1.5 rounded-lg bg-[#c83b3b]/10 dark:bg-[#FFC107]/10 text-[#c83b3b] dark:text-[#FFC107] shrink-0">
              <Cloud size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="sync-modal-title" className="text-base font-bold font-serif-title leading-snug truncate">
                Sauvegarde & Sync
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate">
                Vos statistiques sur tous vos appareils
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-stone-200/60 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            title="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Onglets navigation responsive */}
        <div className="px-3 sm:px-5 pt-2.5 flex border-b border-stone-200/60 dark:border-slate-800/60 bg-[#faf9f5]/50 dark:bg-[#151719]/50">
          <button
            type="button"
            onClick={() => setActiveTab('cloud')}
            className={`pb-2 px-2.5 sm:px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'cloud'
                ? 'border-[#c83b3b] text-[#c83b3b] dark:border-[#FFC107] dark:text-[#FFC107]'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Smartphone size={13} />
            <span>Cloud (Multi-appareils)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`pb-2 px-2.5 sm:px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'file'
                ? 'border-[#c83b3b] text-[#c83b3b] dark:border-[#FFC107] dark:text-[#FFC107]'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <FileJson size={13} />
            <span>Fichier (.json)</span>
          </button>
        </div>

        {/* Message de statut / Toast */}
        {statusMessage && (
          <div
            className={`mx-4 sm:mx-5 mt-3 p-2.5 rounded-xl text-xs font-medium flex items-center justify-between gap-2 animate-in fade-in ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="p-1 text-current opacity-70 hover:opacity-100"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Corps défilant */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs leading-relaxed">
          {activeTab === 'cloud' && (
            <div className="space-y-4">
              {/* Carte Clé de Carnet */}
              <div className="p-3.5 rounded-xl school-card border border-stone-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                    Votre Clé de Carnet
                  </span>
                  <span className="text-[10px] text-stone-400 dark:text-slate-500 flex items-center gap-1">
                    <ShieldCheck size={12} className="text-emerald-500" />
                    Zéro compte requis
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 font-mono font-bold text-base tracking-widest px-3 py-2 rounded-lg bg-stone-100 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-[#c83b3b] dark:text-[#FFC107] select-all text-center">
                    {currentSyncKey}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="p-2.5 rounded-lg border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-stone-50 text-stone-700 dark:text-slate-200 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Copier la clé"
                  >
                    {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                    <span>{copied ? 'Copié' : 'Copier'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-stone-500 dark:text-slate-400">
                  Renseignez cette clé sur votre deuxième téléphone ou ordinateur pour retrouver automatiquement toutes vos parties.
                </p>

                <div className="pt-1 flex items-center justify-between border-t border-stone-100 dark:border-slate-800/80">
                  <span className="text-[11px] text-stone-400 dark:text-slate-500">
                    {lastSynced
                      ? `Synchro\u00A0: ${new Date(lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : 'Jamais synchronisé'}
                  </span>
                  <button
                    type="button"
                    onClick={handleSyncNow}
                    disabled={isLoading}
                    className="px-3 py-1.5 rounded-lg bg-[#c83b3b] hover:bg-[#b91c1c] text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                    <span>{isLoading ? 'Synchronisation…' : 'Synchroniser'}</span>
                  </button>
                </div>
              </div>

              {/* Lier un autre carnet */}
              <div className="p-3.5 rounded-xl border border-stone-200/80 dark:border-slate-800/80 bg-stone-50/70 dark:bg-slate-900/40 space-y-2">
                <span className="font-bold text-stone-700 dark:text-slate-300 block text-[11px] uppercase tracking-wider">
                  Lier un carnet existant
                </span>
                <p className="text-[11px] text-stone-500 dark:text-slate-400">
                  Vous avez déjà une clé sur votre autre appareil&nbsp;? Saisissez-la ici pour fusionner vos données&nbsp;:
                </p>
                <form onSubmit={handleLinkExistingKey} className="flex gap-2">
                  <input
                    type="text"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value.toUpperCase())}
                    placeholder="Ex: ARD-7B92"
                    maxLength={10}
                    className="flex-1 font-mono uppercase px-3 py-1.5 rounded-lg border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-stone-800 dark:text-slate-200 focus:outline-none focus:border-[#c83b3b]"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !inputKey.trim()}
                    className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-stone-100 font-semibold text-xs text-stone-800 dark:text-slate-200 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                  >
                    <span>Lier</span>
                    <ArrowRight size={13} />
                  </button>
                </form>
              </div>

              {/* Option Auto-Sync */}
              <label className="flex items-center justify-between p-3 rounded-xl border border-stone-200/70 dark:border-slate-800/70 cursor-pointer hover:bg-stone-50 dark:hover:bg-slate-900/50 transition-colors">
                <div className="pr-3">
                  <span className="font-semibold text-stone-800 dark:text-slate-200 block text-xs">
                    Synchronisation automatique
                  </span>
                  <span className="text-[10px] text-stone-500 dark:text-slate-400">
                    Met à jour le carnet Cloudflare après chaque partie terminée
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={handleToggleAutoSync}
                  className="w-4 h-4 rounded text-[#c83b3b] focus:ring-[#c83b3b] cursor-pointer"
                />
              </label>
            </div>
          )}

          {activeTab === 'file' && (
            <div className="space-y-4">
              {/* Résumé actuel */}
              <div className="p-3.5 rounded-xl school-card border border-stone-200 dark:border-slate-800 flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between">
                <div className="min-w-0">
                  <span className="font-bold text-stone-800 dark:text-slate-200 block text-xs">
                    Votre carnet local actuel
                  </span>
                  <span className="text-stone-500 dark:text-slate-400 text-[11px] block">
                    {gamesCount} parties archivées · {playersCount} joueurs enregistrés
                  </span>
                </div>
                <button
                  type="button"
                  onClick={downloadNotebookBackup}
                  className="px-3 py-2 rounded-lg bg-[#c83b3b] hover:bg-[#b91c1c] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0 self-start sm:self-auto"
                >
                  <Download size={14} />
                  <span>Télécharger (.json)</span>
                </button>
              </div>

              {/* Zone de restauration */}
              <div className="p-4 rounded-xl border-2 border-dashed border-stone-300 dark:border-slate-700 text-center space-y-2.5">
                <div className="w-9 h-9 rounded-full bg-stone-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-stone-500 dark:text-slate-400">
                  <Upload size={18} />
                </div>
                <div>
                  <span className="font-bold text-stone-800 dark:text-slate-200 block text-xs">
                    Restaurer une sauvegarde
                  </span>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5">
                    Sélectionnez un fichier <code>ardoise-sauvegarde-*.json</code> préalablement exporté.
                  </p>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelected}
                  accept=".json,application/json"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-lg border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-stone-50 font-semibold text-xs text-stone-800 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  Parcourir mes fichiers…
                </button>
              </div>

              {/* Aperçu de l'import avant validation */}
              {importPreview && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold">
                    <Sparkles size={14} />
                    <span>Sauvegarde prête à être importée</span>
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    Ce fichier contient <strong>{importPreview.games?.length || 0} parties</strong> et{' '}
                    <strong>{importPreview.players?.length || 0} joueurs</strong>. Comment souhaitez-vous l'appliquer ?
                  </p>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleConfirmImport('merge')}
                      className="flex-1 py-2 px-3 rounded-lg bg-[#c83b3b] hover:bg-[#b91c1c] text-white font-bold text-xs transition-colors cursor-pointer text-center"
                    >
                      Fusionner (Recommandé)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmImport('replace')}
                      className="py-2 px-3 rounded-lg border border-stone-300 dark:border-slate-700 text-stone-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Remplacer tout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pied de fenêtre */}
        <div className="p-3 sm:p-4 border-t border-stone-200/70 dark:border-slate-800/70 bg-[#faf9f5]/85 dark:bg-[#151719]/85 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-stone-200 dark:border-slate-700 text-xs font-semibold text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
