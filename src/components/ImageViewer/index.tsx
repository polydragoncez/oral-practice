import { useState, useRef, useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useSettingsStore } from '../../stores/settingsStore'
import {
  fetchRandomByTopic,
  searchPhotos,
  getPicsumUrl,
  urlToBase64,
  fileToBase64,
} from '../../services/unsplash'

export function ImageViewer() {
  const { unsplashKey, unsplashTopic, session, setSession } = useSettingsStore(
    useShallow((s) => ({
      unsplashKey: s.unsplashKey,
      unsplashTopic: s.unsplashTopic,
      session: s.session,
      setSession: s.setSession,
    }))
  )

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<
    { id: string; url: string; alt: string }[]
  >([])
  const [showSearch, setShowSearch] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadImage = useCallback(
    async (url: string) => {
      setLoading(true)
      setError(null)
      try {
        const { base64, mimeType, finalUrl } = await urlToBase64(url)
        setSession({
          currentImage: finalUrl,   // use resolved URL so <img> and AI see same image
          currentImageBase64: base64,
          currentImageMimeType: mimeType,
        })
      } catch {
        setError('Failed to load image')
      } finally {
        setLoading(false)
      }
    },
    [setSession]
  )

  const handlePicsum = useCallback(async () => {
    setLoading(true)
    setError(null)
    setShowSearch(false)
    try {
      const url = getPicsumUrl()
      await loadImage(url)
    } catch {
      setError('Failed to fetch image')
      setLoading(false)
    }
  }, [loadImage])

  const handleUnsplash = useCallback(async () => {
    if (!unsplashKey) return
    setLoading(true)
    setError(null)
    setShowSearch(false)
    try {
      const photo = await fetchRandomByTopic(unsplashKey, unsplashTopic)
      await loadImage(photo.urls.regular)
    } catch {
      setError('Failed to fetch image')
      setLoading(false)
    }
  }, [unsplashKey, unsplashTopic, loadImage])

  const handleSearch = useCallback(async () => {
    if (!unsplashKey || !searchQuery.trim()) return
    setLoading(true)
    setError(null)
    try {
      const results = await searchPhotos(unsplashKey, searchQuery)
      setSearchResults(
        results.map((p) => ({ id: p.id, url: p.urls.regular, alt: p.alt_description || '' }))
      )
      setShowSearch(true)
    } catch {
      setError('Search failed')
    } finally {
      setLoading(false)
    }
  }, [unsplashKey, searchQuery])

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      setLoading(true)
      setError(null)
      try {
        const { base64, mimeType } = await fileToBase64(file)
        const objectUrl = URL.createObjectURL(file)
        setSession({
          currentImage: objectUrl,
          currentImageBase64: base64,
          currentImageMimeType: mimeType,
        })
      } catch {
        setError('Failed to load file')
      } finally {
        setLoading(false)
      }
    },
    [setSession]
  )

  return (
    <div className="flex flex-col gap-3">
      {/* Image display */}
      <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 min-h-[300px] flex items-center justify-center">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
            <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {session.currentImage ? (
          <img
            src={session.currentImage}
            alt="Practice image"
            className="w-full object-contain max-h-[400px]"
          />
        ) : (
          <div className="text-center text-gray-400 dark:text-gray-500 p-8">
            <div className="text-5xl mb-3">🖼️</div>
            <p className="text-sm">Load an image to start practicing</p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}

      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handlePicsum}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          🎲 Picsum
        </button>

        {unsplashKey && (
          <button
            onClick={handleUnsplash}
            disabled={loading}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
          >
            <span>🔍 Unsplash</span>
            <span className="text-xs bg-emerald-500/50 px-1.5 py-0.5 rounded">{unsplashTopic}</span>
          </button>
        )}

        {unsplashKey && (
          <button
            onClick={() => setShowSearch((v) => !v)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            🔍 Search
          </button>
        )}

        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg text-sm font-medium transition-colors"
        >
          📁 Upload
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {/* Search panel */}
      {showSearch && unsplashKey && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search images..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-400"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Search
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {searchResults.map((r) => (
                <img
                  key={r.id}
                  src={r.url}
                  alt={r.alt}
                  className="w-full h-24 object-cover rounded-lg cursor-pointer hover:ring-2 hover:ring-purple-400 transition-all"
                  onClick={() => {
                    setShowSearch(false)
                    loadImage(r.url)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
