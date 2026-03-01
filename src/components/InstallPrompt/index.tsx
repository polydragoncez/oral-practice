import { useState, useEffect, useRef } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'dismissedInstallPrompt'

export function InstallPrompt() {
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) return
    // User already dismissed
    if (localStorage.getItem(DISMISSED_KEY)) return

    // Detect iOS (no beforeinstallprompt support)
    const ua = navigator.userAgent
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    if (ios && !('standalone' in navigator && (navigator as Record<string, unknown>).standalone)) {
      setIsIOS(true)
      setShow(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt.current = e as BeforeInstallPromptEvent
      setShow(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!show) return null

  const handleInstall = async () => {
    if (deferredPrompt.current) {
      await deferredPrompt.current.prompt()
      deferredPrompt.current = null
    }
    setShow(false)
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true')
    setShow(false)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="max-w-3xl mx-auto flex items-center gap-3">
        <span className="text-2xl shrink-0">📱</span>
        <p className="flex-1 text-sm text-gray-700 dark:text-gray-300">
          {isIOS
            ? <>Tap the <strong>share button</strong> and <strong>"Add to Home Screen"</strong> to install this app.</>
            : <>Install as app for a better experience.</>}
        </p>
        <div className="flex gap-2 shrink-0">
          {!isIOS && (
            <button
              onClick={handleInstall}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Install
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}
