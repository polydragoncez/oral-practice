import { useState, useEffect, useCallback, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useSettingsStore } from '../../stores/settingsStore'
import { useTTS } from '../../hooks/useTTS'
import { getModeById } from '../../modes'
import { AZURE_TTS_VOICES } from '../../services/azureSpeech'

const MAX_WORDS = 200

export function ShadowingPrompt({ onReady }: { onReady: () => void }) {
  const {
    shadowingText, shadowingSource, clearShadowingText,
    setSession, azureTtsVoice, setAzureTtsVoice,
  } = useSettingsStore(
    useShallow((s) => ({
      shadowingText: s.shadowingText,
      shadowingSource: s.shadowingSource,
      clearShadowingText: s.clearShadowingText,
      setSession: s.setSession,
      azureTtsVoice: s.azureTtsVoice,
      setAzureTtsVoice: s.setAzureTtsVoice,
    }))
  )

  const {
    speakAzure, stopAzure, isPlayingAzure, azureAvailable,
  } = useTTS()

  const [text, setText] = useState('')
  const [speed, setSpeed] = useState(1.0)
  const [ready, setReady] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const initializedRef = useRef(false)

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0

  // Pre-fill from cross-mode shadowing text
  useEffect(() => {
    if (shadowingText && !initializedRef.current) {
      const words = shadowingText.trim().split(/\s+/)
      setText(words.length > MAX_WORDS ? words.slice(0, MAX_WORDS).join(' ') : shadowingText)
      initializedRef.current = true
    }
  }, [shadowingText])

  // Sync text to modeState for AI feedback
  useEffect(() => {
    setSession({ modeState: { shadowingText: text } })
  }, [text, setSession])

  const handleTextChange = useCallback((val: string) => {
    const words = val.trim().split(/\s+/)
    if (!val.trim() || words.length <= MAX_WORDS) {
      setText(val)
    }
  }, [])

  const handleBrowserListen = useCallback(() => {
    if (isSpeaking) {
      speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }
    if (!text.trim()) return
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = speed
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    speechSynthesis.cancel()
    setIsSpeaking(true)
    speechSynthesis.speak(utterance)
  }, [isSpeaking, text, speed])

  const handleAzureListen = useCallback(() => {
    if (isPlayingAzure) { stopAzure(); return }
    if (!text.trim()) return
    speakAzure(text)
  }, [isPlayingAzure, stopAzure, speakAzure, text])

  const handleReady = useCallback(() => {
    if (!text.trim()) return
    setReady(true)
    const wc = text.trim().split(/\s+/).length
    const suggestedDuration = Math.max(5, Math.min(60, Math.round(wc / 2) + 3))
    setSession({ modeState: { shadowingText: text, suggestedDuration } })
    onReady()
  }, [text, setSession, onReady])

  const sourceLabel = shadowingSource
    ? (() => {
        const mode = getModeById(shadowingSource.modeId)
        const version = shadowingSource.version === 'corrected' ? 'Corrected Version' : 'Reference Version'
        return `From: ${mode.icon} ${mode.name} — ${version}`
      })()
    : null

  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <span className="text-lg">🗣️</span>
          Read Aloud
        </h3>
        {sourceLabel && (
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300">
              {sourceLabel}
            </span>
            <button
              onClick={() => {
                clearShadowingText()
                setText('')
              }}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Clear source"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Text input */}
      {!ready && (
        <>
          <div className="flex flex-col gap-1">
            <textarea
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Paste or type the text you want to read aloud..."
              className="w-full h-28 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm text-gray-800 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <div className="flex items-center justify-end">
              <span className={`text-xs ${wordCount >= MAX_WORDS ? 'text-red-500' : 'text-gray-400'}`}>
                {wordCount}/{MAX_WORDS} words
              </span>
            </div>
          </div>

          {/* TTS controls */}
          {text.trim() && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleBrowserListen}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {isSpeaking ? '⏹️ Stop' : '🔊 Listen First'}
                </button>
                {azureAvailable && (
                  <>
                    <button
                      onClick={handleAzureListen}
                      className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium transition-colors bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      {isPlayingAzure ? '⏹️ Stop' : '🎙️ Azure TTS'}
                    </button>
                    <select
                      value={azureTtsVoice}
                      onChange={(e) => setAzureTtsVoice(e.target.value)}
                      className="px-2 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                    >
                      {AZURE_TTS_VOICES.map((v) => (
                        <option key={v.name} value={v.name}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </>
                )}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 dark:text-gray-400">Speed:</label>
                  <input
                    type="range"
                    min="0.7"
                    max="1.2"
                    step="0.1"
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    className="w-24 h-1.5 accent-indigo-600"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-8">{speed}x</span>
                </div>
              </div>

              <button
                onClick={handleReady}
                className="self-start flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                🎙️ Now Your Turn
              </button>
            </div>
          )}
        </>
      )}

      {/* Read-along text shown during recording */}
      {ready && (
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Read this aloud:</p>
          <p className="text-lg leading-relaxed text-gray-800 dark:text-white select-text">
            {text}
          </p>
        </div>
      )}
    </div>
  )
}
