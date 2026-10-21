import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Camera,
  CameraOff,
  Zap,
  ZapOff,
  RotateCcw,
  Keyboard,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { useScrollLock } from '../hooks/useScrollLock'

/**
 * Composant de Scanner QR Code In-App haute performance.
 * Utilise l'API standard BarcodeDetector avec fallback dynamique vers jsQR (0 Ko au démarrage).
 */
export function QrScannerModal({
  isOpen,
  onClose,
  onScan,
  title = 'Scanner un QR code',
  subtitle = 'Pointez la caméra vers le code affiché sur l’autre écran',
}) {
  const [hasPermission, setHasPermission] = useState(null) // null = en attente, true, false
  const [errorMessage, setErrorMessage] = useState(null)
  const [torchAvailable, setTorchAvailable] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const [facingMode, setFacingMode] = useState('environment') // 'environment' | 'user'
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scanSuccess, setScanSuccess] = useState(false)

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const animFrameRef = useRef(null)
  const lastScanTimeRef = useRef(0)
  const isClosingRef = useRef(false)

  useScrollLock(isOpen)

  // Arrêter proprement tous les flux vidéo
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop()
        } catch {}
      })
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setTorchOn(false)
    setIsScanning(false)
  }, [])

  // Basculer la lampe torche si supportée
  const toggleTorch = async () => {
    if (!streamRef.current || !torchAvailable) return
    const track = streamRef.current.getVideoTracks()[0]
    if (!track) return

    try {
      const nextTorch = !torchOn
      await track.applyConstraints({
        advanced: [{ torch: nextTorch }],
      })
      setTorchOn(nextTorch)
    } catch (err) {
      console.warn('Torch toggle failed:', err)
    }
  }

  // Basculer caméra avant / arrière
  const switchCamera = () => {
    stopCamera()
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
  }

  // Déclencher le succès
  const handleSuccess = useCallback(
    (decodedText) => {
      if (isClosingRef.current) return
      isClosingRef.current = true

      // Vibration haptique discrète
      try {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([40])
        }
      } catch {}

      setScanSuccess(true)
      stopCamera()

      // Petite tempo fluide pour afficher le flash de confirmation avant fermeture
      setTimeout(() => {
        onScan(decodedText)
        onClose()
      }, 350)
    },
    [onScan, onClose, stopCamera]
  )

  // Boucle de scan continue
  const startScanLoop = useCallback(
    async (videoEl) => {
      let barcodeDetector = null
      let jsQRLib = null

      // Vérifier si le BarcodeDetector natif est disponible
      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        try {
          const supported = await window.BarcodeDetector.getSupportedFormats()
          if (supported.includes('qr_code')) {
            barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] })
          }
        } catch {}
      }

      // Si pas de BarcodeDetector, charger jsQR en arrière-plan à la volée
      if (!barcodeDetector) {
        try {
          const mod = await import('jsqr')
          jsQRLib = mod.default || mod
        } catch (err) {
          console.warn('jsQR dynamic import failed:', err)
        }
      }

      const scanFrame = async (timestamp) => {
        if (!isOpen || isClosingRef.current || !videoRef.current) return

        // Limiter à ~12 scans par seconde (toutes les 80ms) pour préserver le CPU et la batterie
        if (timestamp - lastScanTimeRef.current >= 80) {
          lastScanTimeRef.current = timestamp

          const video = videoRef.current
          if (video && video.readyState >= video.HAVE_CURRENT_DATA && video.videoWidth > 0) {
            // Moteur 1 : BarcodeDetector matériel natif (ultra rapide)
            if (barcodeDetector) {
              try {
                const barcodes = await barcodeDetector.detect(video)
                if (barcodes.length > 0 && barcodes[0].rawValue) {
                  handleSuccess(barcodes[0].rawValue)
                  return
                }
              } catch {}
            }

            // Moteur 2 : jsQR logiciel (fallback universel)
            if (jsQRLib && canvasRef.current) {
              try {
                const canvas = canvasRef.current
                const ctx = canvas.getContext('2d', { willReadFrequently: true })
                if (ctx) {
                  // Ajuster les dimensions du canvas au flux vidéo
                  if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth
                  if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight

                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                  const code = jsQRLib(imgData.data, imgData.width, imgData.height, {
                    inversionAttempts: 'dontInvert',
                  })

                  if (code && code.data) {
                    handleSuccess(code.data)
                    return
                  }
                }
              } catch {}
            }
          }
        }

        animFrameRef.current = requestAnimationFrame(scanFrame)
      }

      animFrameRef.current = requestAnimationFrame(scanFrame)
    },
    [isOpen, handleSuccess]
  )

  // Initialisation et démarrage de la caméra
  useEffect(() => {
    if (!isOpen) {
      stopCamera()
      setHasPermission(null)
      setErrorMessage(null)
      setScanSuccess(false)
      isClosingRef.current = false
      return
    }

    isClosingRef.current = false
    setScanSuccess(false)
    setErrorMessage(null)

    // Vérifier les capacités et démarrer
    const initCamera = async () => {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setHasPermission(false)
        setErrorMessage("Votre navigateur ne permet pas l'accès à la caméra pour scanner des QR codes.")
        return
      }

      try {
        // Détecter si l'appareil a plusieurs caméras
        try {
          const devices = await navigator.mediaDevices.enumerateDevices()
          const videoDevices = devices.filter((d) => d.kind === 'videoinput')
          setHasMultipleCameras(videoDevices.length > 1)
        } catch {}

        const constraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        streamRef.current = stream

        const track = stream.getVideoTracks()[0]
        if (track) {
          // Vérifier si le flash/torche est disponible
          try {
            const capabilities = track.getCapabilities ? track.getCapabilities() : {}
            setTorchAvailable(Boolean(capabilities.torch))
          } catch {
            setTorchAvailable(false)
          }
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.setAttribute('playsinline', 'true')
          videoRef.current.play().catch(() => {})

          videoRef.current.onloadedmetadata = () => {
            setIsScanning(true)
            startScanLoop(videoRef.current)
          }
        }

        setHasPermission(true)
      } catch (err) {
        console.warn('Camera access error:', err)
        setHasPermission(false)
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setErrorMessage("L'accès à la caméra a été refusé. Vous pouvez l'autoriser dans les réglages de votre navigateur ou saisir le code au clavier.")
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setErrorMessage('Aucune caméra détectée sur cet appareil.')
        } else {
          setErrorMessage('Impossible de démarrer la caméra. Vérifiez vos autorisations ou saisissez le code manuellement.')
        }
      }
    }

    initCamera()

    return () => {
      stopCamera()
    }
  }, [isOpen, facingMode, stopCamera, startScanLoop])

  if (!isOpen || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[1200] flex flex-col justify-between bg-black/95 text-white animate-in fade-in duration-200 select-none overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-scanner-title"
    >
      {/* Canvas invisible hors écran pour le décodage jsQR */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      {/* Barre supérieure : Titre et contrôles rapides */}
      <div className="relative z-20 px-4 pt-4 sm:pt-6 pb-3 flex items-center justify-between gap-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="p-2 rounded-xl bg-white/10 text-white shrink-0">
            <Camera size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="qr-scanner-title" className="text-sm sm:text-base font-bold font-serif-title leading-snug">
              {title}
            </h2>
            <p className="text-[11px] text-white/70 leading-snug mt-0.5">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Lampe torche */}
          {torchAvailable && hasPermission && (
            <button
              type="button"
              onClick={toggleTorch}
              className={`p-2.5 rounded-full transition-all cursor-pointer ${
                torchOn
                  ? 'bg-amber-400 text-stone-900 shadow-lg shadow-amber-400/30'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
              title={torchOn ? 'Éteindre la torche' : 'Allumer la torche'}
              aria-label={torchOn ? 'Éteindre la torche' : 'Allumer la torche'}
            >
              {torchOn ? <ZapOff size={18} /> : <Zap size={18} />}
            </button>
          )}

          {/* Changer de caméra avant / arrière */}
          {hasMultipleCameras && hasPermission && (
            <button
              type="button"
              onClick={switchCamera}
              className="p-2.5 rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors cursor-pointer"
              title="Changer de caméra"
              aria-label="Changer de caméra"
            >
              <RotateCcw size={18} />
            </button>
          )}

          {/* Fermer */}
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors cursor-pointer ml-1"
            title="Fermer le scanner"
            aria-label="Fermer le scanner"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Zone centrale du viseur caméra */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        {/* Flux vidéo plein format centré */}
        {hasPermission && (
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Masque assombri et réticule de ciblage */}
        {hasPermission && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 pointer-events-none">
            {/* Fenêtre de ciblage carrée */}
            <div
              className={`relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl transition-all duration-300 ${
                scanSuccess
                  ? 'border-4 border-emerald-400 shadow-[0_0_40px_rgba(52,211,153,0.6)] bg-emerald-500/20'
                  : 'border-2 border-white/40 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]'
              }`}
            >
              {/* Coins visuels stylisés */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#c83b3b] rounded-tl-2xl -mt-1 -ml-1" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#c83b3b] rounded-tr-2xl -mt-1 -mr-1" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#c83b3b] rounded-bl-2xl -mb-1 -ml-1" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#c83b3b] rounded-br-2xl -mb-1 -mr-1" />

              {/* Ligne laser de balayage animée */}
              {isScanning && !scanSuccess && (
                <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-[#c83b3b] to-transparent shadow-[0_0_8px_#c83b3b] animate-[bounce_2s_infinite]" />
              )}

              {/* Indicateur de succès */}
              {scanSuccess && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-emerald-300 animate-in zoom-in-75 duration-200">
                  <CheckCircle2 size={48} className="drop-shadow-md" />
                  <span className="font-bold text-xs mt-2 uppercase tracking-wider drop-shadow-md">
                    Code détecté\u00A0!
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-white/80 font-medium text-center mt-6 drop-shadow-md px-4">
              Cadrez le QR code dans le repère
            </p>
          </div>
        )}

        {/* Chargement initial de la caméra */}
        {hasPermission === null && (
          <div className="relative z-10 flex flex-col items-center justify-center text-center p-6 space-y-3">
            <Loader2 size={32} className="animate-spin text-[#c83b3b]" />
            <p className="text-xs font-semibold text-white/80">Activation de la caméra…</p>
          </div>
        )}

        {/* Message d'erreur / permission refusée */}
        {hasPermission === false && (
          <div className="relative z-10 max-w-sm mx-auto p-6 rounded-3xl bg-stone-900/90 border border-white/10 text-center space-y-4 m-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center mx-auto">
              <CameraOff size={24} />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif-title font-bold text-base text-white">
                Caméra inaccessible
              </h3>
              <p className="text-xs text-white/70 leading-relaxed">
                {errorMessage || "Impossible d'accéder à la caméra."}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Keyboard size={15} />
              <span>Saisir le code au clavier</span>
            </button>
          </div>
        )}
      </div>

      {/* Barre inférieure : Accès rapide au clavier ou annulation */}
      <div className="relative z-20 px-4 py-4 sm:py-6 flex items-center justify-center bg-gradient-to-t from-black/85 via-black/40 to-transparent">
        <button
          type="button"
          onClick={onClose}
          className="py-2.5 px-6 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/30 text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer backdrop-blur-md shadow-lg border border-white/10"
        >
          <Keyboard size={15} />
          <span>Saisir le code manuellement</span>
        </button>
      </div>
    </div>,
    document.body
  )
}

export default QrScannerModal
