import { useState, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useSettingsStore } from '../../stores/settingsStore'
import { PASSAGES, PASSAGE_CATEGORIES, PASSAGE_DIFFICULTIES } from '../../data/passages'
import type { Passage } from '../../data/passages'

function pickRandom(passages: Passage[]): Passage {
  return passages[Math.floor(Math.random() * passages.length)]
}

interface PassagePromptProps {
  /** Called when user clicks "I'm ready to summarize" */
  onReady: () => void
  /** True once user has entered recording phase */
  isRecording: boolean
}

export function PassagePrompt({ onReady, isRecording }: PassagePromptProps) {
  const setSession = useSettingsStore((s) => s.setSession)
  const sessionModeState = useSettingsStore(
    useShallow((s) => s.session.modeState)
  )

  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [passage, setPassage] = useState<Passage | null>(null)
  const [customText, setCustomText] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [readingSeconds, setReadingSeconds] = useState(0)
  const [readingStarted, setReadingStarted] = useState(false)
  const [showOriginal, setShowOriginal] = useState(true)

  // Restore from modeState if already set (e.g. coming back)
  const alreadyReady = !!sessionModeState?.passageText

  const filteredPassages = PASSAGES.filter((p) => {
    if (difficultyFilter !== 'all' && p.difficulty !== difficultyFilter) return false
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false
    return true
  })

  const pickNew = () => {
    const pool = filteredPassages.length > 0 ? filteredPassages : PASSAGES
    const p = pickRandom(pool)
    setPassage(p)
    setUseCustom(false)
    setReadingSeconds(0)
    setReadingStarted(false)
    setSession({
      modeState: {},
      transcript: '',
      aiFeedback: '',
      recordingBlob: null,
      duration: 0,
    })
  }

  // Pick initial passage
  useEffect(() => {
    if (!passage && !useCustom && !alreadyReady) pickNew()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reading timer
  useEffect(() => {
    if (!readingStarted || isRecording || alreadyReady) return
    const timer = setInterval(() => setReadingSeconds((s) => s + 1), 1000)
    return () => clearInterval(timer)
  }, [readingStarted, isRecording, alreadyReady])

  // Auto-start reading timer when passage is displayed
  useEffect(() => {
    if ((passage || useCustom) && !readingStarted && !alreadyReady) {
      setReadingStarted(true)
    }
  }, [passage, useCustom, readingStarted, alreadyReady])

  const handleCustomApply = () => {
    if (!customText.trim()) return
    setUseCustom(true)
    setPassage(null)
    setReadingSeconds(0)
    setReadingStarted(true)
    setSession({ modeState: {} })
  }

  const handleReady = () => {
    const text = useCustom ? customText.trim() : passage?.text ?? ''
    const title = useCustom ? 'Custom Passage' : passage?.title ?? ''
    const wordCount = text.split(/\s+/).length
    const keyPoints = useCustom ? [] : (passage?.keyPoints ?? [])

    setSession({
      modeState: {
        passageId: useCustom ? 'custom' : passage?.id,
        passageTitle: title,
        passageText: text,
        passageWordCount: wordCount,
        passageKeyPoints: keyPoints,
      },
    })
    onReady()
  }

  const currentText = useCustom ? customText.trim() : passage?.text ?? ''
  const currentWordCount = currentText ? currentText.split(/\s+/).length : 0
  const suggestedReadTime = Math.ceil((currentWordCount / 200) * 60)

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const difficultyColor =
    passage?.difficulty === 'beginner'
      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      : passage?.difficulty === 'intermediate'
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
      : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'

  // ─── Recording phase: faded/hidden passage ─────────────────────────
  if (isRecording || alreadyReady) {
    const savedText = (sessionModeState?.passageText as string) ?? currentText
    const savedTitle = (sessionModeState?.passageTitle as string) ?? (useCustom ? 'Custom Passage' : passage?.title ?? '')

    return (
      <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Original Passage: {savedTitle}
          </h3>
          <button
            onClick={() => setShowOriginal((v) => !v)}
            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded transition-colors"
          >
            {showOriginal ? '🙈 Hide' : '👁 Show'}
          </button>
        </div>
        <div className={`transition-opacity duration-300 ${showOriginal ? 'opacity-25' : 'opacity-0 h-0 overflow-hidden'}`}>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed select-none">
            {savedText}
          </p>
        </div>
        {!showOriginal && (
          <p className="text-xs text-gray-400 dark:text-gray-500 italic">
            Original text hidden. Summarize from memory!
          </p>
        )}
      </div>
    )
  }

  // ─── Reading phase ─────────────────────────────────────────────────
  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 flex flex-col gap-4">
      {/* Passage display */}
      {currentText && (
        <div className="flex flex-col gap-3">
          {!useCustom && passage && (
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                {passage.title}
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColor}`}>
                {passage.difficulty}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium">
                {passage.category}
              </span>
              <span className="text-xs text-gray-400">
                {currentWordCount} words
              </span>
            </div>
          )}
          {useCustom && (
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-medium">
                Custom
              </span>
              <span className="text-xs text-gray-400">{currentWordCount} words</span>
            </div>
          )}

          <p className="text-base text-gray-700 dark:text-gray-200 leading-relaxed">
            {currentText}
          </p>

          {/* Reading info */}
          <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
            <span>Suggested read time: ~{suggestedReadTime}s</span>
            {readingStarted && (
              <span className="font-mono tabular-nums">
                Reading: {formatTime(readingSeconds)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Ready button */}
      {currentText && (
        <button
          onClick={handleReady}
          className="self-start px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          ✅ I'm ready to summarize
        </button>
      )}

      {/* Filters + New Passage */}
      <div className="flex items-center gap-2 flex-wrap border-t border-gray-100 dark:border-gray-700 pt-4">
        <button
          onClick={pickNew}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          🔀 New Passage
        </button>

        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
        >
          <option value="all">All Levels</option>
          {PASSAGE_DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
        >
          <option value="all">All Categories</option>
          {PASSAGE_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Custom passage */}
      <div className="flex flex-col gap-2">
        <textarea
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="Or paste your own passage here..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white resize-y outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          onClick={handleCustomApply}
          disabled={!customText.trim()}
          className="self-start px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Use Custom Text
        </button>
      </div>
    </div>
  )
}
