import { useState, useEffect } from 'react'

export function UpdatePrompt() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handler = () => setShow(true)
    window.addEventListener('sw-updated', handler)
    return () => window.removeEventListener('sw-updated', handler)
  }, [])

  if (!show) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-teal-600 text-white text-sm text-center py-2 px-4 flex items-center justify-center gap-3">
      <span>🔄 A new version is available.</span>
      <button
        onClick={() => window.location.reload()}
        className="px-3 py-0.5 bg-white text-teal-700 font-medium rounded-lg hover:bg-teal-50 transition-colors"
      >
        Refresh
      </button>
    </div>
  )
}
