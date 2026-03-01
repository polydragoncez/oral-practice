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
import { ShadowingPrompt } from './components/ShadowingPrompt'
import { ShadowingResult } from './components/ShadowingResult'
import { WelcomeModal } from './components/WelcomeModal'
import { About } from './components/About'
import { InstallPrompt } from './components/InstallPrompt'
import { UpdatePrompt } from './components/UpdatePrompt'
import { useAzurePronunciation } from './hooks/useAzurePronunciation'
import { ALL_MODES, getModeById } from './modes'
import type { PracticeModeStep } from './types/practiceMode'

type Tab = 'practice' | 'history' | 'stats' | 'settings' | 'about'

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
  const { assess, reset: resetPronunciation, result: pronunciationResult, isAssessing, error: pronunciationError, azureAvailable } = useAzurePronunciation()
  const resetSession = useSettingsStore((s) => s.resetSession)

  const [tab, setTab] = useState<Tab>('practice')
  const [transcriptOpen, setTranscriptOpen] = useState(true)
  const [pronunciationOpen, setPronunciationOpen] = useState(true)
  const [feedbackOpen, setFeedbackOpen] = useState(true)
  const [summarizeReady, setSummarizeReady] = useState(false)
  const [shadowingReady, setShadowingReady] = useState(false)

  const setSession = useSettingsStore((s) => s.setSession)

  /** After Azure assess, backfill transcript from pronunciation words if still empty */
  const backfillTranscriptFromAzure = useCallback(() => {
    const { session } = useSettingsStore.getState()
    if (session.transcript.trim() || !session.pronunciationResult?.words.length) return

    const azureTranscript = session.pronunciationResult.words
      .filter((w) => w.errorType !== 'Insertion')
      .map((w) => w.word)
      .join(' ')

    if (azureTranscript) {
      setSession({ transcript: azureTranscript, transcriptSource: 'azure' })
    }
  }, [setSession])

  const handleRecordingComplete = useCallback(async () => {
    const { session, currentModeId: modeId } = useSettingsStore.getState()
    if (!session.recordingBlob) return

    if (modeId === 'shadowing') {
      // Shadowing mode: use phoneme granularity with the reference text
      const refText = (session.modeState?.shadowingText as string) || session.transcript
      if (refText) {
        await assess(session.recordingBlob, refText, { granularity: 'Phoneme' })
      }
    } else {
      // Other modes: use transcript if available, unscripted if not
      await assess(session.recordingBlob, session.transcript || undefined)
    }

    backfillTranscriptFromAzure()
  }, [assess, backfillTranscriptFromAzure])

  const handleDebateComplete = useCallback(async () => {
    const { session } = useSettingsStore.getState()
    if (!session.recordingBlob) return
    // Use transcript if available, unscripted if not
    await assess(session.recordingBlob, session.transcript || undefined)
    backfillTranscriptFromAzure()
  }, [assess, backfillTranscriptFromAzure])

  const currentMode = getModeById(currentModeId)
  const enabledModes = ALL_MODES.filter((m) => m.enabled)
  const hasRecordStep = currentMode.steps.some((s) => s.type === 'record')
  const hasDebateStep = currentMode.steps.some((s) => s.type === 'display-debate-topic')
  const hasPassageStep = currentMode.steps.some((s) => s.type === 'display-passage')
  const hasShadowingStep = currentMode.steps.some((s) => s.type === 'display-shadowing-text')

  // Reset all session state when mode changes
  useEffect(() => {
    resetSession()
    resetPronunciation()
    setSummarizeReady(false)
    setShadowingReady(false)
  }, [currentModeId, resetSession, resetPronunciation])

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
      <WelcomeModal />
      <UpdatePrompt />
      <InstallPrompt />
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
                      title={`${mode.name}: ${mode.description}`}
                      className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        currentModeId === mode.id
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-400'
                      }`}
                    >
                      <span>{mode.icon}</span>
                      <span className="hidden sm:inline text-xs">{mode.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic step rendering — non-record, non-debate, non-passage, non-shadowing steps */}
            {currentMode.steps
              .filter((s) => s.type !== 'record' && s.type !== 'display-debate-topic' && s.type !== 'display-passage' && s.type !== 'display-shadowing-text')
              .map((step) => {
                const content = renderStepContent(step)
                if (!content) return null
                return (
                  <section key={step.id} className="flex flex-col gap-3">
                    {content}
                    <SpeakingGuide modeId={currentModeId} />
                  </section>
                )
              })}

            {/* Passage Prompt (summarize mode) */}
            {hasPassageStep && (
              <section className="flex flex-col gap-3">
                <PassagePrompt
                  onReady={() => setSummarizeReady(true)}
                  isRecording={summarizeReady}
                />
                <SpeakingGuide modeId={currentModeId} />
              </section>
            )}

            {/* Debate Flow (self-contained with its own recording) */}
            {hasDebateStep && (
              <section className="flex flex-col gap-3">
                <DebateFlow onRecordingComplete={handleDebateComplete} />
                <SpeakingGuide modeId={currentModeId} />
              </section>
            )}

            {/* Shadowing / Read Aloud */}
            {hasShadowingStep && (
              <section className="flex flex-col gap-3">
                <ShadowingPrompt onReady={() => setShadowingReady(true)} />
                {!azureAvailable && !shadowingReady && (
                  <div className="px-4 py-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 text-sm text-blue-700 dark:text-blue-300">
                    📌 Add an Azure Speech key in Settings to unlock detailed word-by-word pronunciation scoring for this mode.
                  </div>
                )}
                <SpeakingGuide modeId={currentModeId} />
              </section>
            )}

            {/* Recorder — only if mode declares a 'record' step (and for passage/shadowing modes, only after user is ready) */}
            {hasRecordStep && (!hasPassageStep || summarizeReady) && (!hasShadowingStep || shadowingReady) && (
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

            {/* Shadowing Result (shadowing mode only — detailed word-by-word) */}
            {hasShadowingStep && (isAssessing || pronunciationResult) && (
              <section>
                {isAssessing ? (
                  <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 py-4">
                      <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      Assessing pronunciation…
                    </div>
                  </div>
                ) : pronunciationResult ? (
                  <ShadowingResult
                    result={pronunciationResult}
                    onTryAgain={() => setShadowingReady(true)}
                    onListenAgain={() => {
                      const text = (useSettingsStore.getState().session.modeState?.shadowingText as string) || ''
                      if (text) {
                        const u = new SpeechSynthesisUtterance(text)
                        u.lang = 'en-US'
                        speechSynthesis.cancel()
                        speechSynthesis.speak(u)
                      }
                    }}
                  />
                ) : null}
                {pronunciationError && (
                  <p className="text-sm text-red-500 dark:text-red-400 mt-2">{pronunciationError}</p>
                )}
              </section>
            )}

            {/* Pronunciation Assessment (non-shadowing modes) */}
            {!hasShadowingStep && (isAssessing || pronunciationResult) && (
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
                  <AIFeedback onNavigateToShadowing={() => setTab('practice')} />
                </div>
              )}
            </section>
          </div>
        )}

        {tab === 'history' && <History />}
        {tab === 'stats' && <Stats />}
        {tab === 'settings' && <Settings />}
        {tab === 'about' && <About />}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 mt-8">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500">
          <button
            onClick={() => setTab('about')}
            className="hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
          >
            Oral Speak Practice Feedback &middot; About & Privacy
          </button>
          <span>&middot;</span>
          <a
            href="https://github.com/polydragoncez/oral-practice"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  )
}
