import { useEffect, useState, useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useSettingsStore } from './stores/settingsStore'
import { ImageViewer } from './components/ImageViewer'
import { Recorder } from './components/Recorder'
import { Transcript } from './components/Transcript'
import { AIFeedback } from './components/AIFeedback'
import { History } from './components/History'
import { Settings } from './components/Settings'
import { Stats } from './components/Stats'
import { PronunciationScore } from './components/PronunciationScore'
import { SpeakingGuide } from './components/SpeakingGuide'
import { QuestionPrompt } from './components/QuestionPrompt'
import { DebateFlow } from './components/DebateFlow'
import { PassagePrompt } from './components/PassagePrompt'
import { useAzurePronunciation } from './hooks/useAzurePronunciation'
import { ALL_MODES, getModeById } from './modes'
import type { PracticeModeStep } from './types/practiceMode'

type Tab = 'practice' | 'history' | 'stats' | 'settings'

function renderStepContent(step: PracticeModeStep): React.ReactNode {
  switch (step.type) {
    case 'display-image':
      return <ImageViewer />
    case 'display-text':
      return null
    case 'display-question':
      return <QuestionPrompt />
    // display-passage handled separately in App body (needs isRecording state)
    default:
      return null
  }
}

export default function App() {
  const { darkMode, currentModeId, setCurrentModeId } = useSettingsStore(
    useShallow((s) => ({
      darkMode: s.darkMode,
      currentModeId: s.currentModeId,
      setCurrentModeId: s.setCurrentModeId,
    }))
  )
  const { assess, result: pronunciationResult, isAssessing, error: pronunciationError } = useAzurePronunciation()

  const [tab, setTab] = useState<Tab>('practice')
  const [transcriptOpen, setTranscriptOpen] = useState(true)
  const [pronunciationOpen, setPronunciationOpen] = useState(true)
  const [feedbackOpen, setFeedbackOpen] = useState(true)
  const [summarizeReady, setSummarizeReady] = useState(false)

  const handleRecordingComplete = useCallback(async () => {
    const { session } = useSettingsStore.getState()
    if (session.recordingBlob && session.transcript.trim()) {
      await assess(session.recordingBlob, session.transcript)
    }
  }, [assess])

  const handleDebateComplete = useCallback(async () => {
    const { session } = useSettingsStore.getState()
    if (session.recordingBlob && session.transcript.trim()) {
      await assess(session.recordingBlob, session.transcript)
    }
  }, [assess])

  const currentMode = getModeById(currentModeId)
  const enabledModes = ALL_MODES.filter((m) => m.enabled)
  const hasRecordStep = currentMode.steps.some((s) => s.type === 'record')
  const hasDebateStep = currentMode.steps.some((s) => s.type === 'display-debate-topic')
  const hasPassageStep = currentMode.steps.some((s) => s.type === 'display-passage')

  // Reset summarizeReady when mode changes
  useEffect(() => {
    setSummarizeReady(false)
  }, [currentModeId])

  // Apply dark mode class on <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const NAV_ITEMS: { id: Tab; label: string; icon: string }[] = [
    { id: 'practice', label: 'Practice', icon: '🎙' },
    { id: 'history', label: 'History', icon: '📚' },
    { id: 'stats', label: 'Stats', icon: '📊' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🗣</span>
            <span className="font-bold text-gray-800 dark:text-white text-lg">Oral Practice</span>
          </div>
          <nav className="flex gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  tab === item.id
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span>{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {tab === 'practice' && (
          <div className="flex flex-col gap-6">
            {/* Mode selector — only shown when multiple modes are available */}
            {enabledModes.length > 1 && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 shrink-0">
                  Mode:
                </span>
                <div className="flex gap-2 flex-wrap">
                  {enabledModes.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setCurrentModeId(mode.id)}
                      title={mode.description}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        currentModeId === mode.id
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-400'
                      }`}
                    >
                      <span>{mode.icon}</span>
                      <span>{mode.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic step rendering — non-record, non-debate, non-passage steps */}
            {currentMode.steps
              .filter((s) => s.type !== 'record' && s.type !== 'display-debate-topic' && s.type !== 'display-passage')
              .map((step) => {
                const content = renderStepContent(step)
                if (!content) return null
                return (
                  <section key={step.id} className="flex flex-col gap-3">
                    {content}
                    {step.type === 'display-image' && <SpeakingGuide />}
                  </section>
                )
              })}

            {/* Passage Prompt (summarize mode) */}
            {hasPassageStep && (
              <section>
                <PassagePrompt
                  onReady={() => setSummarizeReady(true)}
                  isRecording={summarizeReady}
                />
              </section>
            )}

            {/* Debate Flow (self-contained with its own recording) */}
            {hasDebateStep && (
              <section>
                <DebateFlow onRecordingComplete={handleDebateComplete} />
              </section>
            )}

            {/* Recorder — only if mode declares a 'record' step (and for passage modes, only after user is ready) */}
            {hasRecordStep && (!hasPassageStep || summarizeReady) && (
              <section className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
                <Recorder onRecordingComplete={handleRecordingComplete} />
              </section>
            )}

            {/* Transcript (collapsible) */}
            <section className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setTranscriptOpen((v) => !v)}
              >
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">Transcript</h3>
                <span className="text-gray-400 text-sm">{transcriptOpen ? '▲' : '▼'}</span>
              </div>
              {transcriptOpen && (
                <div className="mt-3">
                  <Transcript />
                </div>
              )}
            </section>

            {/* Pronunciation Assessment (visible only when Azure key is set and recording done) */}
            {(isAssessing || pronunciationResult) && (
              <section className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setPronunciationOpen((v) => !v)}
                >
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300">Pronunciation</h3>
                    {pronunciationResult && (
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold">
                        {Math.round(pronunciationResult.pronunciationScore)}/100
                      </span>
                    )}
                  </div>
                  <span className="text-gray-400 text-sm">{pronunciationOpen ? '▲' : '▼'}</span>
                </div>
                {pronunciationOpen && (
                  <div className="mt-3">
                    {isAssessing ? (
                      <div className="flex items-center justify-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 py-4">
                        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        Assessing pronunciation…
                      </div>
                    ) : pronunciationResult ? (
                      <PronunciationScore result={pronunciationResult} />
                    ) : null}
                    {pronunciationError && (
                      <p className="text-sm text-red-500 dark:text-red-400 mt-2">{pronunciationError}</p>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* AI Feedback (collapsible) */}
            <section className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setFeedbackOpen((v) => !v)}
              >
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">AI Feedback</h3>
                <span className="text-gray-400 text-sm">{feedbackOpen ? '▲' : '▼'}</span>
              </div>
              {feedbackOpen && (
                <div className="mt-3">
                  <AIFeedback />
                </div>
              )}
            </section>
          </div>
        )}

        {tab === 'history' && <History />}
        {tab === 'stats' && <Stats />}
        {tab === 'settings' && <Settings />}
      </main>
    </div>
  )
}
