import { useState, useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useSettingsStore } from '../../stores/settingsStore'
import { useAIFeedback, extractScore } from '../../hooks/useAIFeedback'
import { useTTS } from '../../hooks/useTTS'
import { extractModelResponses } from '../../utils/feedback'
import { getModeById } from '../../modes'

// ─── Inline markdown renderer (bold + code only) ─────────────────────────────

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/)
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**'))
          return <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>
        if (p.startsWith('`') && p.endsWith('`'))
          return (
            <code key={i} className="text-xs bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded font-mono">
              {p.slice(1, -1)}
            </code>
          )
        return <span key={i}>{p}</span>
      })}
    </>
  )
}

// ─── Structured feedback renderer ────────────────────────────────────────────

function FeedbackRenderer({ markdown }: { markdown: string }) {
  const lines = markdown.split('\n')
  const items: React.ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim()
    if (!t) continue

    // **N. Category** — verdict  (section header)
    if (/^\*\*\d+\.\s[^*]+\*\*/.test(t)) {
      items.push(
        <div key={i} className="flex items-start mt-4 first:mt-0 pl-2 border-l-[3px] border-indigo-400 dark:border-indigo-500">
          <span className="text-sm text-gray-800 dark:text-gray-100 leading-snug">
            {renderInline(t)}
          </span>
        </div>
      )
      continue
    }

    // - ✅ strength
    if (t.startsWith('- ✅') || t.startsWith('- ✔')) {
      items.push(
        <div key={i} className="flex items-start gap-2 ml-5 text-green-700 dark:text-green-400 text-sm">
          <span className="shrink-0 mt-px">✅</span>
          <span>{renderInline(t.replace(/^- [✅✔]\s*/, ''))}</span>
        </div>
      )
      continue
    }

    // - 💡 improvement
    if (t.startsWith('- 💡') || t.startsWith('- 🔸')) {
      items.push(
        <div key={i} className="flex items-start gap-2 ml-5 text-amber-700 dark:text-amber-400 text-sm">
          <span className="shrink-0 mt-px">💡</span>
          <span>{renderInline(t.replace(/^- [💡🔸]\s*/, ''))}</span>
        </div>
      )
      continue
    }

    // - generic list item
    if (t.startsWith('- ')) {
      items.push(
        <div key={i} className="flex items-start gap-2 ml-5 text-gray-600 dark:text-gray-400 text-sm">
          <span className="shrink-0 mt-1.5 w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500" />
          <span>{renderInline(t.slice(2))}</span>
        </div>
      )
      continue
    }

    // **Overall Score**: X/10
    if (/^\*\*Overall Score\*\*/i.test(t)) {
      const scoreMatch = t.match(/(\d+)\s*\/\s*(\d+)/)
      items.push(
        <div key={i} className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600 flex items-baseline justify-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Overall Score</span>
          {scoreMatch && (
            <>
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {scoreMatch[1]}
              </span>
              <span className="text-sm text-gray-400">/ {scoreMatch[2]}</span>
            </>
          )}
        </div>
      )
      continue
    }

    // Skip Model Response sections — rendered separately in cards below
    if (/^\*\*(?:\d+\.\s*)?Model (?:Response|Description|Story|Answer|Argument|Summary)/i.test(t)) {
      while (i + 1 < lines.length) {
        const next = lines[i + 1].trim()
        if (!next || /^\*\*\d+\./.test(next) || /^\*\*Overall Score\*\*/i.test(next) || /^\*\*(?:\d+\.\s*)?Model Response/i.test(next)) break
        i++
      }
      continue
    }

    // Fallback
    items.push(
      <div key={i} className="text-sm text-gray-700 dark:text-gray-300 ml-1">
        {renderInline(t)}
      </div>
    )
  }

  return <div className="flex flex-col gap-0.5">{items}</div>
}

// ─── Model Response TTS Card ─────────────────────────────────────────────────

const FRAMEWORK_NAMES: Record<string, string> = {
  'image-describe': 'DLASS',
  'pro-con-debate': 'PEE',
  'random-question': 'PREP',
  'summarize': 'MKCO',
}

function ModelResponseCard({
  type,
  text,
  framework,
  speak,
  stopTTS,
  isPlaying,
  speakAzure,
  stopAzure,
  isPlayingAzure,
  azureAvailable,
  voices,
  selectedVoice,
  setSelectedVoice,
}: {
  type: 'corrected' | 'reference'
  text: string
  framework?: string
  speak: (text: string) => void
  stopTTS: () => void
  isPlaying: boolean
  speakAzure: (text: string) => void
  stopAzure: () => void
  isPlayingAzure: boolean
  azureAvailable: boolean
  voices: { name: string; label: string }[]
  selectedVoice: string
  setSelectedVoice: (v: string) => void
}) {
  const [collapsed, setCollapsed] = useState(false)

  const isCorrected = type === 'corrected'
  const bgClass = isCorrected
    ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800'
    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
  const titleColor = isCorrected
    ? 'text-teal-600 dark:text-teal-400'
    : 'text-amber-600 dark:text-amber-400'
  const textColor = isCorrected
    ? 'text-teal-900 dark:text-teal-100'
    : 'text-amber-900 dark:text-amber-100'
  const btnClass = isCorrected
    ? 'bg-teal-600 hover:bg-teal-700'
    : 'bg-amber-600 hover:bg-amber-700'
  const btnBorderClass = isCorrected
    ? 'border-teal-300 dark:border-teal-700'
    : 'border-amber-300 dark:border-amber-700'

  const title = isCorrected ? '✏️ Corrected Version' : '⭐ Reference Version'
  const subtitle = isCorrected
    ? 'Your response, polished — minimal corrections applied'
    : `Model answer following ${framework ?? 'recommended'} framework`

  const handleListen = useCallback(() => {
    if (isPlaying) { stopTTS(); return }
    speak(text)
  }, [isPlaying, stopTTS, speak, text])

  const handleAzureListen = useCallback(() => {
    if (isPlayingAzure) { stopAzure(); return }
    speakAzure(text)
  }, [isPlayingAzure, stopAzure, speakAzure, text])

  return (
    <div className={`p-4 rounded-lg border flex flex-col gap-2 ${bgClass}`}>
      <div className="flex items-center justify-between">
        <div>
          <span className={`text-xs font-semibold uppercase tracking-wide ${titleColor}`}>
            {title}
          </span>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
        </div>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          {collapsed ? '▼' : '▲'}
        </button>
      </div>

      {!collapsed && (
        <>
          <p className={`text-sm leading-relaxed select-text ${textColor}`}>
            {text}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleListen}
              className={`flex items-center gap-1.5 px-4 py-1.5 ${btnClass} text-white rounded-lg text-sm font-medium transition-colors`}
            >
              {isPlaying ? '⏹️ Stop' : '🔊 Listen'}
            </button>
            {azureAvailable && (
              <button
                onClick={handleAzureListen}
                className={`flex items-center gap-1.5 px-3 py-1.5 border ${btnBorderClass} rounded-lg text-sm font-medium transition-colors bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700`}
              >
                {isPlayingAzure ? '⏹️ Stop' : '🎙️ Azure TTS'}
              </button>
            )}
            {voices.length > 0 && (
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className={`px-3 py-1.5 border ${btnBorderClass} rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white`}
              >
                {voices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.label ?? v.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AIFeedback() {
  const { session, aiProvider, currentModeId } = useSettingsStore(
    useShallow((s) => ({
      session: s.session,
      aiProvider: s.aiProvider,
      currentModeId: s.currentModeId,
    }))
  )
  const { loading, error, saved, getFeedback } = useAIFeedback()
  const {
    speak, stop: stopTTS, isPlaying,
    speakAzure, stopAzure, isPlayingAzure, azureAvailable,
    voices, selectedVoice, setSelectedVoice,
  } = useTTS()
  const [collapsed, setCollapsed] = useState(false)

  const currentMode = getModeById(currentModeId)
  const requiresImage = currentMode.steps.some((s) => s.type === 'display-image')
  const framework = FRAMEWORK_NAMES[currentModeId]

  const responses = session.aiFeedback
    ? extractModelResponses(session.aiFeedback)
    : { corrected: null, reference: null }

  const score = session.aiFeedback ? extractScore(session.aiFeedback) : null

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300">AI Feedback</h3>
          {score !== null && (
            <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold">
              {score}/10
            </span>
          )}
          <span className="text-xs text-gray-400 capitalize">({aiProvider})</span>
          {saved && (
            <span className="text-xs text-green-500 dark:text-green-400">✓ Saved</span>
          )}
        </div>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded transition-colors"
        >
          {collapsed ? '▼ Show' : '▲ Hide'}
        </button>
      </div>

      {!collapsed && (
        <>
          <button
            onClick={getFeedback}
            disabled={loading || (requiresImage && !session.currentImageBase64) || !session.transcript}
            className="self-start px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyzing…
              </>
            ) : (
              '✨ Get Feedback'
            )}
          </button>

          {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

          {session.aiFeedback ? (
            <div className="flex flex-col gap-3">
              {/* Structured coaching feedback */}
              <div className="px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <FeedbackRenderer markdown={session.aiFeedback} />
              </div>

              {/* Corrected Version card */}
              {responses.corrected && (
                <ModelResponseCard
                  type="corrected"
                  text={responses.corrected}
                  framework={framework}
                  speak={speak}
                  stopTTS={stopTTS}
                  isPlaying={isPlaying}
                  speakAzure={speakAzure}
                  stopAzure={stopAzure}
                  isPlayingAzure={isPlayingAzure}
                  azureAvailable={azureAvailable}
                  voices={voices}
                  selectedVoice={selectedVoice}
                  setSelectedVoice={setSelectedVoice}
                />
              )}

              {/* Reference Version card */}
              {responses.reference && (
                <ModelResponseCard
                  type="reference"
                  text={responses.reference}
                  framework={framework}
                  speak={speak}
                  stopTTS={stopTTS}
                  isPlaying={isPlaying}
                  speakAzure={speakAzure}
                  stopAzure={stopAzure}
                  isPlayingAzure={isPlayingAzure}
                  azureAvailable={azureAvailable}
                  voices={voices}
                  selectedVoice={selectedVoice}
                  setSelectedVoice={setSelectedVoice}
                />
              )}
            </div>
          ) : (
            <div className="p-4 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 text-sm">
              Click "Get Feedback" to receive AI coaching on your response
            </div>
          )}
        </>
      )}
    </div>
  )
}
