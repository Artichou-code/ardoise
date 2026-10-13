import { useEffect } from 'react'
import {
  X,
  Scale,
  ShieldCheck,
  FileText,
  ExternalLink,
  CheckCircle2,
  Cloud,
  Radio,
  Share2,
  HardDrive,
  RefreshCw,
  Lock,
  Database,
  Info,
} from 'lucide-react'
import { useScrollLock } from '../hooks/useScrollLock'

/**
 * Hub Juridique complet pour Ardoise by ART-créa
 * Conforme LCEN, RGPD et reflétant fidèlement l'architecture :
 * - Local-first par défaut (localStorage)
 * - Sauvegarde Cloud anonyme optionnelle (SYNC-XXXX)
 * - Tables en direct éphémères (TAB-XXXX)
 * - Partage de feuilles de match (QR / liens)
 * Onglets : Mentions Légales, Confidentialité (RGPD), CGU & Modalités
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
              className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-600 dark:text-slate-300 transition-colors flex-shrink-0"
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

              {/* Hébergement & Infrastructure */}
              <div className="p-3.5 rounded-xl school-card space-y-1.5 text-xs">
                <h4 className="font-bold text-sm text-stone-900 dark:text-slate-100 flex items-center gap-1.5">
                  2. Hébergement & Infrastructure Cloud
                </h4>
                <div className="space-y-1 text-stone-600 dark:text-slate-400 pl-2 border-l-2 border-stone-300 dark:border-slate-700">
                  <p><strong className="text-stone-800 dark:text-slate-200">Hébergeur Frontend PWA :</strong> Cloudflare Pages (Cloudflare, Inc.)</p>
                  <p><strong className="text-stone-800 dark:text-slate-200">Adresse :</strong> 101 Townsend St, San Francisco, CA 94107, USA</p>
                  <p><strong className="text-stone-800 dark:text-slate-200">Site web :</strong> <a href="https://www.cloudflare.com" target="_blank" rel="noopener noreferrer" className="text-[#c83b3b] hover:underline inline-flex items-center gap-0.5 font-semibold">cloudflare.com <ExternalLink size={11} /></a></p>
                  <p><strong className="text-stone-800 dark:text-slate-200">Services Cloud & API Serverless :</strong> Cloudflare Workers et base de données Cloudflare D1 (déployés sur le réseau sécurisé mondial de Cloudflare pour assurer les Tables en direct, la synchronisation des carnets et le partage de parties).</p>
                  <p><strong className="text-stone-800 dark:text-slate-200">Sécurité des échanges :</strong> Chiffrement TLS / HTTPS 256 bits certifié de bout en bout.</p>
                </div>
              </div>

              {/* Propriété intellectuelle & Jeux */}
              <div className="p-3.5 rounded-xl school-card space-y-1.5 text-xs">
                <h4 className="font-bold text-sm text-stone-900 dark:text-slate-100">
                  3. Propriété intellectuelle & Domaine Ludique
                </h4>
                <p className="text-stone-600 dark:text-slate-400">
                  L'application <strong>Ardoise</strong>, son architecture logicielle, ses algorithmes de calcul, ses visuels, sa charte graphique et ses textes explicatifs sont la propriété intellectuelle exclusive d'<strong>ART-créa</strong>.
                </p>
                <p className="text-stone-500 dark:text-slate-500 text-[11px] leading-relaxed">
                  Les règles des jeux traditionnels répertoriés (Belote, Tarot, Coinche, Rami, Dourak, Yam's, etc.) font partie intégrante du patrimoine ludique universel et du domaine public.
                </p>
                <p className="text-stone-500 dark:text-slate-500 text-[11px] italic leading-relaxed">
                  Les noms de jeux protégés ou marques déposées éventuellement cités (ex&nbsp;: Uno, Skyjo, 6 qui prend) demeurent la propriété exclusive de leurs éditeurs et ayants droit respectifs. Ils sont mentionnés à titre purement indicatif et descriptif dans le cadre d'un usage d'arbitrage amical (fair-use / droit à l'information), sans affiliation commerciale avec ART-créa.
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
              <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                  <CheckCircle2 size={16} />
                  <span>Architecture «&nbsp;Local-First&nbsp;» & Respect Absolu de la Vie Privée</span>
                </div>
                <p className="text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed">
                  Ardoise a été pensée selon le principe du <em>Privacy by Design</em>&nbsp;: vous profitez d'une expérience complète <strong>sans aucun compte obligatoire</strong>, sans profilage publicitaire et sans revente de vos données.
                </p>
              </div>

              {/* Principe Local-First */}
              <div className="p-3.5 rounded-xl school-card space-y-2 text-xs">
                <h4 className="font-bold text-sm text-stone-900 dark:text-slate-100 flex items-center gap-2">
                  <HardDrive size={15} className="text-[#c83b3b]" />
                  <span>1. Vos données stockées localement par défaut</span>
                </h4>
                <p className="text-stone-600 dark:text-slate-400">
                  Par défaut, l'ensemble de vos données (noms et avatars des joueurs, scores, historiques de manches, durées de parties, statistiques et modèles personnalisés) est conservé <strong>exclusivement dans le stockage local de votre navigateur</strong> (<code className="px-1 py-0.5 rounded bg-stone-100 dark:bg-slate-800 text-[#c83b3b]">localStorage</code>).
                </p>
                <p className="text-stone-600 dark:text-slate-400">
                  L'application fonctionne à 100% hors-ligne. Aucun identifiant personnel nominatif (ni e-mail, ni numéro de téléphone, ni mot de passe) n'est jamais requis.
                </p>
              </div>

              {/* Fonctionnalités Connectées & Cloud */}
              <div className="p-3.5 rounded-xl school-card space-y-2.5 text-xs">
                <h4 className="font-bold text-sm text-stone-900 dark:text-slate-100 flex items-center gap-2">
                  <Cloud size={15} className="text-blue-500" />
                  <span>2. Fonctionnalités Connectées & Cloud (Optionnelles)</span>
                </h4>
                <p className="text-stone-600 dark:text-slate-400">
                  Pour faciliter le jeu à plusieurs et l'utilisation multi-écrans, Ardoise intègre trois fonctionnalités connectées reposant sur une stricte minimisation des données&nbsp;:
                </p>

                <div className="space-y-2 pt-1 border-t border-stone-200/60 dark:border-slate-800">
                  {/* A. Sauvegarde Cloud */}
                  <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-slate-800/50 space-y-1">
                    <p className="font-bold text-stone-800 dark:text-slate-200 flex items-center gap-1.5">
                      <RefreshCw size={12} className="text-blue-500" />
                      Sauvegarde & Synchronisation de Carnet (<code className="text-[#c83b3b]">SYNC-XXXX</code>)
                    </p>
                    <p className="text-stone-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      Permet de synchroniser votre carnet sur plusieurs téléphones ou ordinateurs via une clé anonyme aléatoire. Les données de votre carnet sont hébergées de manière sécurisée sur notre base Cloudflare D1 liée uniquement à cette clé technique. Aucun profil nominatif ni adresse e-mail n'y est rattaché. Vous pouvez synchroniser manuellement ou automatiquement, et écraser votre sauvegarde à votre convenance.
                    </p>
                  </div>

                  {/* B. Table en direct */}
                  <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-slate-800/50 space-y-1">
                    <p className="font-bold text-stone-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Radio size={12} className="text-emerald-500" />
                      Table en direct (<code className="text-[#c83b3b]">TAB-XXXX</code>)
                    </p>
                    <p className="text-stone-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      Permet aux joueurs réunis autour d'une même table de suivre l'évolution des scores en direct sur leurs propres smartphones via un code court ou un QR code. Les scores de la partie active sont relayés temporairement sur le serveur durant la session. Ces données sont purement fonctionnelles, éphémères et ne font l'objet d'aucun traçage commercial.
                    </p>
                  </div>

                  {/* C. Partage QR */}
                  <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-slate-800/50 space-y-1">
                    <p className="font-bold text-stone-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Share2 size={12} className="text-amber-500" />
                      Partage de feuille de match par lien ou QR code
                    </p>
                    <p className="text-stone-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      Lorsque vous partagez le résumé d'une partie avec un ami, un extrait de la feuille de match est temporairement stocké pour lui permettre de visualiser ou d'importer la partie dans son propre carnet.
                    </p>
                  </div>
                </div>
              </div>

              {/* Cookies, traceurs et télémétrie */}
              <div className="p-3.5 rounded-xl school-card space-y-2 text-xs">
                <h4 className="font-bold text-sm text-stone-900 dark:text-slate-100 flex items-center gap-2">
                  <ShieldCheck size={15} className="text-emerald-500" />
                  <span>3. Cookies, Traceurs & Télémétrie technique</span>
                </h4>
                <ul className="list-disc pl-4 space-y-1 text-stone-600 dark:text-slate-400">
                  <li><strong>Zéro cookie publicitaire</strong>&nbsp;: aucune régie publicitaire, aucune bannière promotionnelle.</li>
                  <li><strong>Zéro pixel tiers commercial</strong>&nbsp;: aucun traceur Meta, Google Ads, TikTok ou courtier en données (data broker).</li>
                  <li><strong>Stockage technique strict</strong>&nbsp;: seules vos préférences d'affichage (thème sombre/clair, son) et votre clé locale de carnet sont mémorisées.</li>
                  <li><strong>Télémétrie d'infrastructure anonymisée</strong>&nbsp;: de simples compteurs agrégés purement techniques (ex&nbsp;: type d'OS, mode PWA, localisation approximative fournie par Cloudflare) peuvent être enregistrés pour dimensionner les serveurs et prévenir les pannes, sans conservation d'adresses IP nominatives ni croisement de profil.</li>
                </ul>
              </div>

              {/* Contrôle et effacement */}
              <div className="p-3.5 rounded-xl school-card space-y-2 text-xs">
                <h4 className="font-bold text-sm text-stone-900 dark:text-slate-100 flex items-center gap-2">
                  <Lock size={15} className="text-[#c83b3b]" />
                  <span>4. Contrôle souverain, Droit à l'oubli & Export</span>
                </h4>
                <p className="text-stone-600 dark:text-slate-400">
                  Conformément au RGPD, vous disposez d'un contrôle absolu sur vos données&nbsp;:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-stone-600 dark:text-slate-400">
                  <li><strong>Suppression locale immédiate</strong>&nbsp;: vous pouvez supprimer à tout moment un joueur, une partie ou réinitialiser intégralement l'application depuis les réglages ou en vidant le cache de votre navigateur.</li>
                  <li><strong>Gestion du Cloud</strong>&nbsp;: vous pouvez délier votre clé <code className="text-[#c83b3b]">SYNC-XXXX</code>, générer une nouvelle clé ou écraser votre sauvegarde cloud à tout instant.</li>
                  <li><strong>Portabilité totale (Export JSON)</strong>&nbsp;: un bouton d'export vous permet de télécharger une copie complète de vos carnets de jeux au format standard JSON pour les archiver en toute indépendance.</li>
                </ul>
                <p className="text-stone-500 dark:text-slate-400 text-[11px] pt-1 border-t border-stone-200/60 dark:border-slate-800">
                  Pour toute question relative à la protection de vos données, vous pouvez contacter directement Artem Tchaikovski à&nbsp;: <a href="mailto:contact@art-crea.fr" className="text-[#c83b3b] hover:underline font-semibold">contact@art-crea.fr</a>.
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

              {/* Objet et Gratuité */}
              <div className="p-3.5 rounded-xl school-card space-y-2 text-xs">
                <h4 className="font-bold text-sm text-stone-900 dark:text-slate-100">
                  1. Objet et Gratuité du Service
                </h4>
                <p className="text-stone-600 dark:text-slate-400">
                  <strong>Ardoise</strong> est une application web progressive (PWA) gratuite conçue pour faciliter le décompte des points, l'arbitrage amical, la tenue des statistiques et la consultation des règles de jeux de cartes et de société entre amis et en famille.
                </p>
                <p className="text-stone-600 dark:text-slate-400">
                  L'accès est libre, sans abonnement, sans création de compte requise et sans frais cachés.
                </p>
              </div>

              {/* Services Connectés & Fair-Use */}
              <div className="p-3.5 rounded-xl school-card space-y-2 text-xs">
                <h4 className="font-bold text-sm text-stone-900 dark:text-slate-100">
                  2. Services Connectés & Usage Loyal (Fair-Use)
                </h4>
                <p className="text-stone-600 dark:text-slate-400">
                  Les fonctionnalités de synchronisation cloud (<code className="text-[#c83b3b]">SYNC-XXXX</code>), de Tables en direct (<code className="text-[#c83b3b]">TAB-XXXX</code>) et de partage de parties sont fournies gracieusement pour un usage privé et convivial.
                </p>
                <p className="text-stone-600 dark:text-slate-400">
                  L'utilisateur s'engage à une utilisation loyale du service. Sont strictement interdits&nbsp;: toute tentative de surcharge volontaire (flooding, saturation d'API), d'injection malveillante ou de détournement des serveurs Cloudflare. ART-créa se réserve le droit de restreindre temporairement l'accès à une clé ou à une session en cas d'abus caractérisé.
                </p>
              </div>

              {/* Responsabilité & Arbitrage amical */}
              <div className="p-3.5 rounded-xl school-card space-y-2 text-xs">
                <h4 className="font-bold text-sm text-stone-900 dark:text-slate-100">
                  3. Responsabilité & Arbitrage amical
                </h4>
                <p className="text-stone-600 dark:text-slate-400">
                  L'application est fournie «&nbsp;en l'état&nbsp;». ART-créa met en œuvre tous ses soins pour garantir l'exactitude des calculs de scores et la conformité des règles ludiques proposées.
                </p>
                <p className="text-stone-600 dark:text-slate-400">
                  Néanmoins, Ardoise demeure un outil d'assistance amicale&nbsp;: les joueurs autour de la table demeurent souverains dans l'adoption de variantes locales, de barèmes personnalisés ou d'accords mutuels.
                </p>
              </div>

              {/* Disponibilité et Sauvegarde des Données */}
              <div className="p-3.5 rounded-xl school-card space-y-2 text-xs">
                <h4 className="font-bold text-sm text-stone-900 dark:text-slate-100">
                  4. Disponibilité & Préservation des Données
                </h4>
                <p className="text-stone-600 dark:text-slate-400">
                  Grâce à son architecture PWA, Ardoise fonctionne en mode hors-ligne une fois installée sur votre appareil.
                </p>
                <p className="text-stone-600 dark:text-slate-400">
                  <strong>Attention au stockage du navigateur&nbsp;:</strong> l'utilisateur est informé que les données locales peuvent être effacées lors d'une réinitialisation manuelle de son navigateur ou de l'utilisation de modes de navigation privée stricts. L'utilisation de la <strong>Sauvegarde Cloud (<code className="text-[#c83b3b]">SYNC-XXXX</code>)</strong> ou de l'<strong>Export de fichier JSON</strong> régulier est vivement recommandée pour garantir la pérennité de vos historiques. ART-créa ne saurait être tenu responsable d'une perte fortuite de données résultant d'une purge locale ou d'un incident de réseau tiers.
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
