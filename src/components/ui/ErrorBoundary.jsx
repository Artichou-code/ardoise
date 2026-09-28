import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#faf8f5] dark:bg-slate-950 text-stone-800 dark:text-slate-100 font-sans">
          <div className="w-14 h-14 rounded-2xl bg-[#c83b3b]/10 text-[#c83b3b] flex items-center justify-center mb-4 text-2xl font-black">
            !
          </div>
          <h1 className="text-lg font-bold font-serif-title mb-2">
            Une erreur inattendue est survenue
          </h1>
          <p className="text-xs text-stone-500 dark:text-slate-400 max-w-xs mb-5">
            L'ardoise a rencontré une anomalie d'affichage. Vos données enregistrées sont en sécurité.
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false })
              window.location.reload()
            }}
            className="px-5 py-2.5 rounded-xl bg-[#c83b3b] text-white font-bold text-xs shadow-md hover:bg-[#b03030] transition-colors"
          >
            Recharger l'application
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
