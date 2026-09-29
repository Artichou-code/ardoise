import { useEffect } from 'react'
import { X, Scale, ShieldCheck, FileText, ExternalLink, CheckCircle2 } from 'lucide-react'
import { useScrollLock } from '../hooks/useScrollLock'

/**
 * Hub Juridique complet pour Ardoise by ART-créa
 * Inspiré de l'architecture LegalModal de ART-crea_v2
 * Onglets : Mentions Légales, Confidentialité (RGPD), CGU & Propriété
 */
export function LegalModal({ open, onClose, activeTab = 'mentions', onSelectTab }) {
  useScrollLock(open)

  // Fermeture par la touche Échap
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  const validTabs = ['mentions', 'confidentialite', 'cgu']
  const currentTab = validTabs.includes(activeTab) ? activeTab : 'mentions'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90dvh] flex flex-col rounded-2xl sm:rounded-3xl school-card shadow-2xl border border-stone-200/90 dark:border-slate-800/90 overflow-hidden bg-[#faf9f5] dark:bg-[#151719]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-hub-title"
      >
        {/* En-tête du Hub Juridique */}
        <div className="p-4 sm:p-5 border-b border-stone-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#c83b3b]/10 text-[#c83b3b] dark:bg-[#c83b3b]/20 flex items-center justify-center flex-shrink-0">
                <Scale size={17} />
              </div>
              <div className="min-w-0">
                <h2
                  id="legal-hub-title"
                  className="font-serif-title text-base sm:text-lg font-bold text-stone-900 dark:text-slate-100 leading-tight"
                >
                  Hub Juridique & Règlements
                </h2>
                <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate">
                  Ardoise by ART-créa · Artem Tchaikovski
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-500 dark:text-slate-400 transition-colors flex-shrink-0"
              aria-label="Fermer la fenêtre juridique"
            >
              <X size={18} />
            </button>
          </div>

          {/* Onglets 3 colonnes responsive */}
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-stone-200/70 dark:bg-slate-800/80 text-xs font-semibold text-center">
            <button
              type="button"
              onClick={() => onSelectTab('mentions')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all text-[11px] sm:text-xs truncate ${
                currentTab === 'mentions'
                  ? 'bg-white dark:bg-slate-700 text-stone-900 dark:text-slate-100 shadow-xs font-bold'
                  : 'text-stone-600 dark:text-slate-400 hover:text-stone-900'
              }`}
            >
              <Scale size={13} className="flex-shrink-0 hidden xs:inline" />
              <span className="truncate">Mentions</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('confidentialite')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all text-[11px] sm:text-xs truncate ${
                currentTab === 'confidentialite'
                  ? 'bg-white dark:bg-slate-700 text-stone-900 dark:text-slate-100 shadow-xs font-bold'
                  : 'text-stone-600 dark:text-slate-400 hover:text-stone-900'
              }`}
            >
              <ShieldCheck size={13} className="flex-shrink-0 hidden xs:inline" />
              <span className="truncate">Confidentialité</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('cgu')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all text-[11px] sm:text-xs truncate ${
                currentTab === 'cgu'
                  ? 'bg-white dark:bg-slate-700 text-stone-900 dark:text-slate-100 shadow-xs font-bold'
                  : 'text-stone-600 dark:text-slate-400 hover:text-stone-900'
              }`}
            >
              <FileText size={13} className="flex-shrink-0 hidden xs:inline" />
              <span className="truncate">CGU</span>
            </button>
          </div>
        </div>

        {/* Corps de texte défilable */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 sm:p-6 space-y-5 text-xs sm:text-sm leading-relaxed text-stone-700 dark:text-slate-300">
          {/* ONGLET 1 : MENTIONS LÉGALES */}
          {currentTab === 'mentions' && (
            <div className="space-y-4">
              <div className="border-b border-stone-200/80 dark:border-slate-800 pb-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#c83b3b]">
                  Loi n° 2004-575 du 21 juin 2004 (LCEN)
                </span>
                <h3 className="font-serif-title text-base sm:text-lg font-bold text-stone-900 dark:text-slate-100 mt-0.5">
                  Mentions Légales — Ardoise by ART-créa
                </h3>
              </div>

              {/* Éditeur */}
              <div className="p-3.5 rounded-xl school-card space-y-1.5 text-xs">
                <h4 className="font-bold text-sm text-stone-900 dark:text-slate-100 flex items-center gap-1.5">
                  1. Éditeur de l'application
                </h4>
                <div className="space-y-1 text-stone-600 dark:text-slate-400 pl-2 border-l-2 border-[#c83b3b]/60">
                  <p><strong className="text-stone-800 dark:text-slate-200">Dénomination :</strong> ART-créa</p>
                  <p><strong className="text-stone-800 dark:text-slate-200">Créateur & Concepteur :</strong> Artem Tchaikovski</p>
                  <p><strong className="text-stone-800 dark:text-slate-200">Statut :</strong> Artisan Créateur Web & Photographe indépendant (Entrepreneur individuel)</p>
                  <p><strong className="text-stone-800 dark:text-slate-200">SIRET :</strong> 522 095 413 00038</p>
                  <p><strong className="text-stone-800 dark:text-slate-200">Siège social :</strong> 4 rue Hubertine Auclert, 31400 Toulouse, France</p>
                  <p><strong className="text-stone-800 dark:text-slate-200">Contact e-mail :</strong> <a href="mailto:contact@art-crea.fr" className="text-[#c83b3b] hover:underline font-semibold">contact@art-crea.fr</a></p>
                  <p><strong className="text-stone-800 dark:text-slate-200">Directeur de la publication :</strong> Artem Tchaikovski</p>
                  <p><strong className="text-stone-800 dark:text-slate-200">Site officiel de l'agence :</strong> <a href="https://art-crea.fr" target="_blank" rel="noopener noreferrer" className="text-[#c83b3b] hover:underline inline-flex items-center gap-0.5 font-semibold">art-crea.fr <ExternalLink size={11} /></a></p>
                </div>
              </div>

              {/* Hébergement */}
              <div className="p-3.5 rounded-xl school-card space-y-1.5 text-xs">
                <h4 className="font-bold text-sm text-stone-900 dark:text-slate-100 flex items-center gap-1.5">
                  2. Hébergement & Réseau
                </h4>
                <div className="space-y-1 text-stone-600 dark:text-slate-400 pl-2 border-l-2 border-stone-300 dark:border-slate-700">
                  <p><strong className="text-stone-800 dark:text-slate-200">Hébergeur :</strong> Cloudflare, Inc.</p>
                  <p><strong className="text-stone-800 dark:text-slate-200">Adresse :</strong> 101 Townsend St, San Francisco, CA 94107, USA</p>
                  <p><strong className="text-stone-800 dark:text-slate-200">Site web :</strong> <a href="https://www.cloudflare.com" target="_blank" rel="noopener noreferrer" className="text-[#c83b3b] hover:underline inline-flex items-center gap-0.5 font-semibold">cloudflare.com <ExternalLink size={11} /></a></p>
                  <p><strong className="text-stone-800 dark:text-slate-200">Sécurité :</strong> Chiffrement TLS 256 bits certifié, réseau de distribution mondial sécurisé.</p>
                </div>
              </div>

              {/* Propriété intellectuelle */}
              <div className="p-3.5 rounded-xl school-card space-y-1.5 text-xs">
                <h4 className="font-bold text-sm text-stone-900 dark:text-slate-100">
                  3. Propriété intellectuelle
                </h4>
                <p className="text-stone-600 dark:text-slate-400">
                  L'application <strong>Ardoise</strong>, son architecture logicielle, ses logos, sa charte graphique et ses textes explicatifs sont la propriété intellectuelle exclusive d'<strong>ART-créa</strong>.
                </p>
                <p className="text-stone-500 dark:text-slate-500 text-[11px] italic">
                  Les règles des jeux traditionnels répertoriés (Dourak, Belote, Tarot, Trou du cul, Skyjo, etc.) font partie du patrimoine ludique et du domaine public.
                </p>
              </div>
            </div>
          )}

          {/* ONGLET 2 : CONFIDENTIALITÉ & RGPD */}
          {currentTab === 'confidentialite' && (
            <div className="space-y-4">
              <div className="border-b border-stone-200/80 dark:border-slate-800 pb-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400">
                  Règlement Général sur la Protection des Données (RGPD)
                </span>
                <h3 className="font-serif-title text-base sm:text-lg font-bold text-stone-900 dark:text-slate-100 mt-0.5">
                  Politique de Confidentialité — Ardoise
                </h3>
              </div>

              {/* Badge d'engagement fort */}
              <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                  <CheckCircle2 size={16} />
                  <span>Engagement 100% Local & Zéro Traçage</span>
                </div>
                <p className="text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed">
                  Contrairement à la majorité des applications mobiles, <strong>Ardoise</strong> a été bâtie selon le principe fondamental du <em>Privacy by Design</em>.
                </p>
              </div>

              {/* Stockage local */}
              <div className="p-3.5 rounded-xl school-card space-y-2 text-xs">
                <h4 className="font-bold text-sm text-stone-900 dark:text-slate-100">
                  1. Vos données restent sur votre appareil
                </h4>
                <p className="text-stone-600 dark:text-slate-400">
                  Les noms de vos joueurs, les scores, les durées de parties, les modèles personnalisés et les statistiques sont enregistrés <strong>exclusivement dans le stockage local de votre navigateur</strong> (<code className="px-1 py-0.5 rounded bg-stone-100 dark:bg-slate-800 text-[#c83b3b]">localStorage</code>).
                </p>
                <p className="text-stone-600 dark:text-slate-400">
                  Aucun compte n'est obligatoire, et <strong>aucun serveur distant ne collecte, n'analyse ni ne revend vos historiques de jeux</strong>.
                </p>
              </div>

              {/* Cookies */}
              <div className="p-3.5 rounded-xl school-card space-y-2 text-xs">
                <h4 className="font-bold text-sm text-stone-900 dark:text-slate-100">
                  2. Cookies & Traceurs
                </h4>
                <ul className="list-disc pl-4 space-y-1 text-stone-600 dark:text-slate-400">
                  <li><strong>Zéro cookie publicitaire</strong> : aucune régie ou bannière intrusive.</li>
                  <li><strong>Zéro traceur tiers</strong> : pas de pixels Google Analytics, Facebook ou TikTok.</li>
                  <li><strong>Cookies techniques stricts</strong> : seules vos préférences d'affichage (mode sombre/clair) et vos parties locales sont conservées.</li>
                </ul>
              </div>

              {/* Contrôle et effacement */}
              <div className="p-3.5 rounded-xl school-card space-y-2 text-xs">
                <h4 className="font-bold text-sm text-stone-900 dark:text-slate-100">
                  3. Contrôle absolu et Droit à l'oubli
                </h4>
                <p className="text-stone-600 dark:text-slate-400">
                  Vous conservez la pleine maîtrise de vos données. Vous pouvez à tout instant supprimer un joueur ou une partie individuellement, ou vider intégralement la mémoire de l'application en nettoyant le cache de votre navigateur.
                </p>
              </div>
            </div>
          )}

          {/* ONGLET 3 : CONDITIONS GÉNÉRALES D'UTILISATION */}
          {currentTab === 'cgu' && (
            <div className="space-y-4">
              <div className="border-b border-stone-200/80 dark:border-slate-800 pb-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#1e3a5f] dark:text-blue-400">
                  Conditions d'accès et d'arbitrage
                </span>
                <h3 className="font-serif-title text-base sm:text-lg font-bold text-stone-900 dark:text-slate-100 mt-0.5">
                  Conditions Générales d'Utilisation (CGU)
                </h3>
              </div>

              <div className="p-3.5 rounded-xl school-card space-y-2 text-xs">
                <h4 className="font-bold text-sm text-stone-900 dark:text-slate-100">
                  1. Objet et Gratuité du Service
                </h4>
                <p className="text-stone-600 dark:text-slate-400">
                  <strong>Ardoise</strong> est une application web progressive (PWA) gratuite conçue pour faciliter le décompte des points, l'arbitrage amical et la consultation des règles de jeux de cartes et de société entre amis et en famille.
                </p>
                <p className="text-stone-600 dark:text-slate-400">
                  L'accès est libre, sans abonnement, sans création de compte requise et sans frais cachés.
                </p>
              </div>

              <div className="p-3.5 rounded-xl school-card space-y-2 text-xs">
                <h4 className="font-bold text-sm text-stone-900 dark:text-slate-100">
                  2. Responsabilité & Arbitrage amical
                </h4>
                <p className="text-stone-600 dark:text-slate-400">
                  L'application est fournie « en l'état ». ART-créa met en œuvre tous ses soins pour garantir la fiabilité des calculs de scores et des règles fournies. Toutefois, Ardoise est un outil d'assistance amicale : les joueurs demeurent souverains dans l'application de leurs variantes locales de jeu.
                </p>
              </div>

              <div className="p-3.5 rounded-xl school-card space-y-2 text-xs">
                <h4 className="font-bold text-sm text-stone-900 dark:text-slate-100">
                  3. Disponibilité
                </h4>
                <p className="text-stone-600 dark:text-slate-400">
                  Grâce à son statut de Progressive Web App (PWA), Ardoise fonctionne même sans connexion internet une fois installée sur votre écran d'accueil. ART-créa ne saurait être tenu responsable d'une éventuelle perte de données résultant de la réinitialisation manuelle de votre navigateur par l'utilisateur.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Pied de la modale */}
        <div className="p-3.5 sm:p-4 border-t border-stone-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 flex items-center justify-between text-xs flex-shrink-0">
          <span className="text-[11px] text-stone-400 dark:text-slate-500">
            © {new Date().getFullYear()} ART-créa · Tous droits réservés
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs hover:bg-stone-800 dark:hover:bg-white transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
