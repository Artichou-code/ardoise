import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ExternalLink, ArrowRight } from 'lucide-react'
import { useScrollLock } from '../hooks/useScrollLock'

const UNIVERS_CARDS = [
  {
    id: 'arena-photo',
    badge: "EXPÉRIENCE INTERACTIVE",
    title: "ARENA.photo",
    desc: "Collectez facilement toutes les photos de vos invités lors d'un mariage ou événement. Une expérience ludique avec tournois photo en direct et classement !",
    url: "https://arena.photo.art-crea.fr/",
    logoType: 'image',
    logoSrc: "/images/VS-192px.png",
    ctaText: "Découvrir ARENA.photo",
  },
  {
    id: 'webdesign',
    badge: "1\u00A0000€ HT • SITE CLÉ EN MAIN",
    title: "ART-créa Web-Design",
    desc: "Création de sites internet sur-mesure. Un modèle artisanal sans industrialisation : projets sélectionnés au coup de cœur sur liste d'attente.",
    url: "https://art-crea.fr/",
    logoType: 'artcrea',
    ctaText: "Découvrir l'offre ART-créa",
  },
  {
    id: 'photo',
    badge: "+15 ANS D'EXPERTISE",
    title: "PHOTO.ART-CREA.FR",
    desc: "Reportages d'artisans, portraits de caractère et mise en valeur de votre savoir-faire. Des photographies authentiques créées sur-mesure, sans banques d'images.",
    url: "https://photo.art-crea.fr/",
    logoType: 'image',
    logoSrc: "/images/artem-portrait.jpg",
    ctaText: "Voir photo.ART-crea",
  },
]

/**
 * Modale de présentation de l'Univers ART-créa
 * Adaptée à la charte graphique d'Ardoise (papier chaud écru & ardoise sombre)
 */
export function ArtCreaUniverseModal({ isOpen, onClose }) {
  const cardsContainerRef = useRef(null)
  const [activeCardIndex, setActiveCardIndex] = useState(0)

  useScrollLock(isOpen)

  useEffect(() => {
    if (!isOpen) return
    setActiveCardIndex(0)
    if (cardsContainerRef.current) {
      cardsContainerRef.current.scrollLeft = 0
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleCardsScroll = () => {
    const el = cardsContainerRef.current
    if (!el) return
    const firstCard = el.querySelector('a')
    const cardWidth = firstCard ? firstCard.offsetWidth + 14 : 320
    const newIndex = Math.round(el.scrollLeft / cardWidth)
    if (newIndex !== activeCardIndex && newIndex >= 0 && newIndex < UNIVERS_CARDS.length) {
      setActiveCardIndex(newIndex)
    }
  }

  const scrollToCard = (index) => {
    const el = cardsContainerRef.current
    if (!el) return
    const firstCard = el.querySelector('a')
    const cardWidth = firstCard ? firstCard.offsetWidth + 14 : 320
    el.scrollTo({ left: index * cardWidth, behavior: 'smooth' })
    setActiveCardIndex(index)
  }

  if (!isOpen || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-5 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="artcrea-universe-title"
    >
      {/* Backdrop sombre avec flou doux */}
      <div
        className="absolute inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Conteneur principal adapté à la DA Ardoise (cahier d'écolier avec petits carreaux) */}
      <div className="relative w-full max-w-sm sm:max-w-md md:max-w-4xl school-surface text-stone-900 dark:text-slate-100 border border-stone-200/90 dark:border-slate-800/90 shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Liseré supérieur rouge signature Ardoise / or en dark */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#c83b3b] dark:via-[#FFC107] to-transparent z-10" />

        {/* Halo d'ambiance en arrière-plan */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-40 bg-[#c83b3b]/10 dark:bg-[#FFC107]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header de la modale */}
        <div className="relative z-10 p-4 sm:p-5 pb-3 border-b border-stone-200/70 dark:border-slate-800/70 bg-[#faf9f5]/85 dark:bg-[#151719]/85 backdrop-blur-md flex items-start justify-between gap-4">
          <div>
            <h2
              id="artcrea-universe-title"
              className="text-lg sm:text-xl font-bold tracking-tight leading-tight font-serif-title text-stone-900 dark:text-slate-100"
            >
              L'Univers <span className="text-[#c83b3b] dark:text-[#FFC107]">ART-créa</span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-slate-400 font-medium mt-0.5">
              Webdesign & Photographie • Toulouse
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-stone-200/60 dark:hover:bg-slate-800 transition-colors focus:outline-none flex-shrink-0 cursor-pointer"
            title="Fermer la fenêtre (Échap)"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corps de modale : carrousel swipe sur mobile & grille sur PC */}
        <div className="relative z-10 p-4 sm:p-5 pt-3 pb-4 sm:pb-5 overflow-y-auto scrollbar-hide">
          {/* Indicateur et tirets de pagination (visible sur mobile uniquement) */}
          <div className="flex md:hidden items-center justify-between px-1 mb-2.5">
            <span className="text-xs font-medium text-stone-600 dark:text-slate-400 flex items-center">
              <span>Les autres sites d'</span>
              <span className="font-bold text-stone-900 dark:text-slate-100 ml-0.5">ART-créa</span>
            </span>

            <div className="flex items-center gap-1.5" role="tablist" aria-label="Pagination projets">
              {UNIVERS_CARDS.map((card, i) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => scrollToCard(i)}
                  aria-label={`Projet ${card.title}`}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    activeCardIndex === i
                      ? 'w-6 bg-[#c83b3b] dark:bg-[#FFC107]'
                      : 'w-1.5 bg-stone-300 dark:bg-slate-700 hover:bg-stone-400'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Cartes en swipe sur mobile et en grille 3 colonnes sur PC */}
          <div
            ref={cardsContainerRef}
            onScroll={handleCardsScroll}
            className="flex md:grid md:grid-cols-3 gap-3 sm:gap-4 md:gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none scrollbar-hide py-1 -mx-4 px-4 sm:-mx-5 sm:px-5 md:mx-0 md:px-0 overscroll-x-contain"
          >
            {UNIVERS_CARDS.map((card) => (
              <a
                key={card.id}
                href={card.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-[82vw] max-w-[310px] sm:w-[320px] md:w-full md:max-w-none flex-shrink-0 snap-center flex flex-col justify-between p-4 rounded-2xl school-card bg-white dark:bg-slate-900/90 border border-stone-200/80 dark:border-slate-800 hover:border-[#c83b3b]/70 dark:hover:border-amber-400/70 shadow-2xs hover:shadow-md transition-all duration-200 group relative overflow-hidden select-none cursor-pointer"
              >
                <div className="relative z-10">
                  {/* Entête de carte avec vignette et badge */}
                  <div className="flex items-start gap-3 mb-2.5">
                    {/* Vignette logo officielle */}
                    {card.logoType === 'artcrea' && (
                      <div className="w-12 h-10 flex-shrink-0 flex items-center justify-start select-none pt-0.5">
                        <img
                          src="/ART-crea.svg"
                          alt="Logo ART-créa"
                          className="h-6.5 w-auto max-w-full object-contain object-left select-none"
                          draggable={false}
                        />
                      </div>
                    )}

                    {card.logoType === 'image' && (
                      <div className="relative w-10 h-10 flex-shrink-0 select-none">
                        <img
                          src={card.logoSrc}
                          alt={card.title}
                          className="w-full h-full rounded-xl object-cover shadow-2xs"
                          draggable={false}
                        />
                      </div>
                    )}

                    {/* Badge et Titre */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[8px] font-bold uppercase tracking-wider text-[#c83b3b] dark:text-[#FFC107] px-1.5 py-0.5 rounded-full bg-[#c83b3b]/10 dark:bg-amber-950/40 border border-[#c83b3b]/25 dark:border-amber-800/60 whitespace-nowrap">
                          {card.badge}
                        </span>
                        <ExternalLink size={12} className="text-stone-400 group-hover:text-[#c83b3b] dark:group-hover:text-[#FFC107] transition-all flex-shrink-0" />
                      </div>
                      <h3 className="text-sm font-bold tracking-tight group-hover:text-[#c83b3b] dark:group-hover:text-[#FFC107] transition-colors leading-snug font-serif-title text-stone-900 dark:text-slate-100">
                        {card.title}
                      </h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[11px] leading-relaxed text-stone-600 dark:text-slate-400 mb-3 line-clamp-3">
                    {card.desc}
                  </p>
                </div>

                {/* CTA en bas */}
                <div className="relative z-10 pt-2 border-t border-stone-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-[#c83b3b] dark:text-[#FFC107]">
                  <span className="text-[11px]">{card.ctaText}</span>
                  <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
