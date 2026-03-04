import { useState, useCallback } from 'react'
import { useSettingsStore } from '../../stores/settingsStore'
import { getClaudeFeedback } from '../../services/claude'
import { getOpenAIFeedback } from '../../services/openai'
import { getGeminiFeedback } from '../../services/gemini'
import type { AIServiceRequest } from '../../types/practiceMode'

interface VocabHints {
  nouns: string[]
  adjectives: string[]
  actions: string[]
  phrases: string[]
}

const VOCAB_SYSTEM_PROMPT = `You are a vocabulary assistant for an English speaking practice app.

The user will describe this image out loud. Generate helpful vocabulary they might need.

Respond in EXACTLY this format (no other text):

Nouns: cabin, pathway, pine trees, mountain range, mist, sunrise
Adjectives: serene, misty, rustic, snow-capped, lush, remote
Actions: overlooking, surrounded by, nestled in, stretching across, covered with
Phrases: In the foreground|The scene gives off a ... atmosphere|It appears to be|What stands out most is

Rules:
- Each category: 4-6 items, separated by commas
- Phrases: separated by | (pipe), use ... for where user fills in their own words
- Only vocabulary relevant to THIS specific image
- Mix common words and slightly advanced ones (B1-B2 level)
- Actions should be in -ing form or past participle for easy use
- Do NOT write full sentences, only words and short phrases`

function extractCategory(lines: string[], label: string): string[] {
  const line = lines.find((l) => l.toLowerCase().startsWith(label.toLowerCase() + ':'))
  if (!line) return []
  const content = line.slice(line.indexOf(':') + 1).trim()
  return content.split(',').map((s) => s.trim()).filter(Boolean)
}

function extractPhrases(lines: string[]): string[] {
  const line = lines.find((l) => l.toLowerCase().startsWith('phrases:'))
  if (!line) return []
  const content = line.slice(line.indexOf(':') + 1).trim()
  return content.split('|').map((s) => s.trim()).filter(Boolean)
}

function parseVocabHints(response: string): VocabHints | null {
  const lines = response.split('\n').filter((l) => l.trim())
  const nouns = extractCategory(lines, 'Nouns')
  const adjectives = extractCategory(lines, 'Adjectives')
  const actions = extractCategory(lines, 'Actions')
  const phrases = extractPhrases(lines)

  if (nouns.length === 0 && adjectives.length === 0 && actions.length === 0 && phrases.length === 0) {
    return null
  }

  return { nouns, adjectives, actions, phrases }
}

interface VocabHintsProps {
  imageBase64: string | null
  mimeType: string
}

export function VocabHints({ imageBase64, mimeType }: VocabHintsProps) {
  const [hints, setHints] = useState<VocabHints | null>(null)
  const [rawResponse, setRawResponse] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const aiProvider = useSettingsStore((s) => s.aiProvider)
  const anthropicKey = useSettingsStore((s) => s.anthropicKey)
  const openaiKey = useSettingsStore((s) => s.openaiKey)
  const geminiKey = useSettingsStore((s) => s.geminiKey)
  const geminiModel = useSettingsStore((s) => s.geminiModel)

  const generate = useCallback(async () => {
    if (!imageBase64) {
      setError('No image loaded')
      return
    }

    const keyMap = { claude: anthropicKey, openai: openaiKey, gemini: geminiKey }
    const apiKey = keyMap[aiProvider]
    if (!apiKey) {
      setError(`${aiProvider === 'claude' ? 'Anthropic' : aiProvider === 'openai' ? 'OpenAI' : 'Gemini'} API key not set in Settings`)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const serviceReq: AIServiceRequest = {
        apiKey,
        systemPrompt: VOCAB_SYSTEM_PROMPT,
        userMessage: 'Generate vocabulary hints for this image.',
        imageBase64,
        imageMimeType: mimeType,
      }

      let response = ''
      if (aiProvider === 'claude') {
        response = await getClaudeFeedback(serviceReq)
      } else if (aiProvider === 'openai') {
        response = await getOpenAIFeedback(serviceReq)
      } else {
        response = await getGeminiFeedback({ ...serviceReq, model: geminiModel })
      }

      const parsed = parseVocabHints(response)
      setHints(parsed)
      setRawResponse(parsed ? null : response)
      setIsVisible(true)
    } catch (err) {
      if (!navigator.onLine) {
        setError('You\'re offline. Vocabulary hints require an internet connection.')
      } else {
        setError(err instanceof Error ? err.message : 'Failed to generate vocabulary hints')
      }
    } finally {
      setIsLoading(false)
    }
  }, [imageBase64, mimeType, aiProvider, anthropicKey, openaiKey, geminiKey, geminiModel])

  // Not yet generated — show trigger button
  if (!hints && !rawResponse && !isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <button
          onClick={generate}
          disabled={!imageBase64}
          className="self-start px-4 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          Get Vocabulary Hints
        </button>
        {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
      </div>
    )
  }

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 py-3">
        <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
        Generating vocabulary hints…
      </div>
    )
  }

  // Generated — show hints
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsVisible((v) => !v)}
          className="text-sm font-medium text-amber-700 dark:text-amber-300 hover:underline"
        >
          {isVisible ? '▲ Vocabulary Hints' : '▼ Vocabulary Hints'}
        </button>
        <div className="flex-1" />
        <button
          onClick={generate}
          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded transition-colors"
        >
          Regenerate
        </button>
        <button
          onClick={() => setIsVisible((v) => !v)}
          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded transition-colors"
        >
          {isVisible ? 'Hide' : 'Show'}
        </button>
      </div>

      {isVisible && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-4 flex flex-col gap-3">
          {hints ? (
            <>
              {hints.nouns.length > 0 && (
                <CategoryRow icon="🏷️" label="Nouns" items={hints.nouns} />
              )}
              {hints.adjectives.length > 0 && (
                <CategoryRow icon="🎨" label="Adjectives" items={hints.adjectives} />
              )}
              {hints.actions.length > 0 && (
                <CategoryRow icon="🏃" label="Actions" items={hints.actions} />
              )}
              {hints.phrases.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    💬 Useful Phrases
                  </span>
                  <ul className="mt-1 flex flex-col gap-0.5">
                    {hints.phrases.map((phrase, i) => (
                      <li key={i} className="text-sm text-gray-700 dark:text-gray-300">
                        • "{phrase}"
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : rawResponse ? (
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{rawResponse}</p>
          ) : null}
        </div>
      )}

      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  )
}

function CategoryRow({ icon, label, items }: { icon: string; label: string; items: string[] }) {
  return (
    <div>
      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
        {icon} {label}
      </span>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span
            key={i}
            className="px-2 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-sm text-gray-700 dark:text-gray-300"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
