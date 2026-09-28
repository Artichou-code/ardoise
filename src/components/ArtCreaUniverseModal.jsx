import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ExternalLink, ArrowRight } from 'lucide-react'
import { useScrollLock } from '../hooks/useScrollLock'

const UNIVERS_CARDS = [
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
 * Inspirée de celle présente dans ARENA.photo
 */
export function ArtCreaUniverseModal({ isOpen, onClose }) {
  const cardsContainerRef = useRef(null)
  const [activeCardIndex, setActiveCardIndex] = useState(0)

  useScrollLock(isOpen)

  useEffect(() => {
    if (!isOpen) return
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
      {/* Backdrop sombre flouté */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Conteneur principal de la modale */}
      <div className="relative w-full max-w-sm sm:max-w-md md:max-w-4xl bg-[#0F0F12] text-white border border-white/[0.09] shadow-[0_20px_60px_rgba(0,0,0,0.7),0_0_40px_rgba(252,199,23,0.08)] rounded-3xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Liseré supérieur or ambré signature ART-créa */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#FFC107] to-transparent z-10" />

        {/* Halo doré d'ambiance en arrière-plan */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-40 bg-[#FFC107]/12 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 p-4 sm:p-6 pb-3 sm:pb-4 border-b border-white/[0.06] flex items-start justify-between gap-4">
          <div>
            <h2
              id="artcrea-universe-title"
              className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight font-serif-title"
            >
              L'Univers <span className="text-[#FFC107]">ART-créa</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-300/80 font-medium mt-0.5">
              Webdesign & Photographie • Toulouse
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors focus:outline-none flex-shrink-0"
            title="Fermer la fenêtre (Échap)"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corps de modale : carrousel swipe sur mobile & grille sur PC */}
        <div className="relative z-10 p-4 sm:p-6 pt-3 sm:pt-4 pb-4 sm:pb-5 overflow-y-auto scrollbar-hide">
          {/* Indicateur et tirets de pagination (visible sur mobile uniquement) */}
          <div className="flex md:hidden items-center justify-between px-1 mb-3">
            <span className="text-xs font-medium text-gray-300 flex items-center">
              <span>Au-delà d'</span>
              <span className="font-bold text-white ml-0.5 font-serif-title">Ardoise</span>
            </span>

            <div className="flex items-center gap-1.5" role="tablist" aria-label="Pagination projets">
              {UNIVERS_CARDS.map((card, i) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => scrollToCard(i)}
                  aria-label={`Projet ${card.title}`}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    activeCardIndex === i ? 'w-6 bg-[#FFC107]' : 'w-1.5 bg-white/20 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Cartes en swipe sur mobile et en grille 3 colonnes sur PC */}
          <div
            ref={cardsContainerRef}
            onScroll={handleCardsScroll}
            className="flex md:grid md:grid-cols-3 gap-3.5 sm:gap-4 md:gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none scrollbar-hide py-1.5 -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0 overscroll-x-contain"
          >
            {UNIVERS_CARDS.map((card) => (
              <a
                key={card.id}
                href={card.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-[82vw] max-w-[310px] sm:w-[320px] md:w-full md:max-w-none flex-shrink-0 snap-center flex flex-col justify-between p-4 sm:p-4.5 rounded-3xl bg-[#141417]/90 hover:bg-[#18181E] border border-white/[0.08] hover:border-[#FFC107]/50 shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_30px_rgba(255,193,7,0.14)] backdrop-blur-xl transition-all duration-300 group relative overflow-hidden select-none"
              >
                {/* Gradient d'ambiance au survol */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#FFC107]/8 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-3xl" />

                <div className="relative z-10">
                  {/* Entête de carte avec vignette et badge */}
                  <div className="flex items-start gap-3 mb-3">
                    {/* Vignette logo officielle */}
                    {card.logoType === 'artcrea' && (
                      <div className="w-12 h-10 flex-shrink-0 flex items-center justify-start select-none pt-0.5">
                        <img
                          src="/ART-crea.svg"
                          alt="Logo ART-créa"
                          className="h-7 w-auto max-w-full object-contain object-left select-none"
                          draggable={false}
                        />
                      </div>
                    )}

                    {card.logoType === 'image' && (
                      <div className="relative w-10 h-10 flex-shrink-0 select-none">
                        <img
                          src={card.logoSrc}
                          alt={card.title}
                          className="w-full h-full rounded-xl object-cover shadow-md"
                          draggable={false}
                        />
                      </div>
                    )}

                    {/* Badge et Titre */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[8px] font-black uppercase tracking-wider text-[#FFC107] px-1.5 py-0.5 rounded-full bg-[#FFC107]/10 border border-[#FFC107]/20 whitespace-nowrap">
                          {card.badge}
                        </span>
                        <ExternalLink size={12} className="text-current opacity-40 group-hover:opacity-100 group-hover:text-[#FFC107] transition-all flex-shrink-0" />
                      </div>
                      <h3 className="text-sm font-bold tracking-tight group-hover:text-[#FFC107] transition-colors leading-snug font-serif-title">
                        {card.title}
                      </h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[11px] leading-relaxed text-gray-300 mb-3 line-clamp-3">
                    {card.desc}
                  </p>
                </div>

                {/* CTA en bas */}
                <div className="relative z-10 pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs font-bold text-[#FFC107]">
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
