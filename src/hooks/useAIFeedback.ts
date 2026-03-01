import { useState, useCallback } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import { getClaudeFeedback } from '../services/claude'
import { getOpenAIFeedback } from '../services/openai'
import { getGeminiFeedback } from '../services/gemini'
import { saveSession } from '../services/db'
import { getModeById } from '../modes'
import type { PracticeContext, AIServiceRequest } from '../types/practiceMode'
import type { PronunciationResult } from '../types/pronunciation'

function computeWpm(transcript: string, durationSecs: number): number | undefined {
  if (!transcript.trim() || durationSecs <= 0) return undefined
  return Math.round((transcript.trim().split(/\s+/).length / durationSecs) * 60)
}

function buildPronunciationContext(result: PronunciationResult): string {
  const errorWords = result.words
    .filter((w) => w.errorType !== 'None')
    .map((w) => `${w.word} (${w.errorType})`)

  const lines = [
    'Pronunciation Assessment Scores:',
    `- Overall: ${Math.round(result.pronunciationScore)}/100`,
    `- Accuracy: ${Math.round(result.accuracyScore)}/100`,
    `- Fluency: ${Math.round(result.fluencyScore)}/100`,
    `- Completeness: ${Math.round(result.completenessScore)}/100`,
    `- Prosody (rhythm/intonation/stress): ${Math.round(result.prosodyScore)}/100`,
  ]
  if (errorWords.length > 0) {
    lines.push(`- Words with errors: ${errorWords.join(', ')}`)
  }
  lines.push(
    '\nPlease also provide specific feedback on the student\'s prosody, rhythm, and intonation based on these scores.'
  )
  return lines.join('\n')
}

export function extractScore(feedback: string): number | null {
  const match = feedback.match(/\*\*Overall Score\*\*[^\d]*(\d+)/i)
  return match ? parseInt(match[1], 10) : null
}

export function useAIFeedback() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const {
    aiProvider,
    anthropicKey,
    openaiKey,
    geminiKey,
    geminiModel,
    systemPrompt,
    modePrompts,
    currentModeId,
  } = useSettingsStore()
  const session = useSettingsStore((s) => s.session)
  const setSession = useSettingsStore((s) => s.setSession)

  const getFeedback = useCallback(async () => {
    const { currentImageBase64, currentImageMimeType, transcript, duration, pronunciationResult, modeState } =
      session

    const mode = getModeById(currentModeId)
    const requiresImage = mode.steps.some((s) => s.type === 'display-image')

    if (requiresImage && !currentImageBase64) {
      setError('No image loaded')
      return
    }
    if (!transcript.trim()) {
      setError('No transcript to evaluate')
      return
    }
    if (aiProvider === 'claude' && !anthropicKey) {
      setError('Anthropic API key not set in Settings')
      return
    }
    if (aiProvider === 'openai' && !openaiKey) {
      setError('OpenAI API key not set in Settings')
      return
    }
    if (aiProvider === 'gemini' && !geminiKey) {
      setError('Gemini API key not set in Settings')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const wpm = computeWpm(transcript, duration)

      const context: PracticeContext = {
        imageBase64: currentImageBase64 ?? undefined,
        imageMimeType: currentImageMimeType,
        transcript,
        duration,
        wpm,
        modeState,
      }

      // Resolve per-mode prompt: modePrompts[modeId] > mode.systemPromptTemplate > global systemPrompt
      const resolvedPrompt = modePrompts[currentModeId]
        || mode.systemPromptTemplate
        || systemPrompt

      // Build pronunciation context
      const pronContext = pronunciationResult
        ? buildPronunciationContext(pronunciationResult)
        : undefined

      const payload = mode.buildAIPayload(context, resolvedPrompt, pronContext)

      const serviceReq: AIServiceRequest = {
        apiKey: '',
        systemPrompt: payload.systemPrompt,
        userMessage: payload.userMessage,
        imageBase64: payload.imageBase64,
        imageMimeType: payload.imageMimeType,
      }

      let feedback = ''

      if (aiProvider === 'claude') {
        serviceReq.apiKey = anthropicKey
        feedback = await getClaudeFeedback(serviceReq)
      } else if (aiProvider === 'openai') {
        serviceReq.apiKey = openaiKey
        feedback = await getOpenAIFeedback(serviceReq)
      } else {
        serviceReq.apiKey = geminiKey
        feedback = await getGeminiFeedback({ ...serviceReq, model: geminiModel })
      }

      setSession({ aiFeedback: feedback })

      // Auto-save immediately so image + transcript + feedback stay in sync
      setSaved(false)
      try {
        const isRemote = session.currentImage?.startsWith('http')
        const { shadowingText, shadowingSource } = useSettingsStore.getState()
        await saveSession({
          timestamp: Date.now(),
          imageUrl: session.currentImage ?? '',
          imageBase64: isRemote ? undefined : (session.currentImageBase64 ?? undefined),
          imageMimeType: isRemote ? undefined : session.currentImageMimeType,
          recordingBlob: session.recordingBlob,
          transcript: session.transcript,
          aiFeedback: feedback,
          score: extractScore(feedback),
          duration: session.duration,
          pronunciationResult: session.pronunciationResult ?? undefined,
          modeId: currentModeId,
          metadata: session.modeState,
          ...(currentModeId === 'shadowing' && shadowingText ? {
            shadowingText,
            shadowingSource: shadowingSource ?? undefined,
          } : {}),
        })
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } catch {
        // save failure is non-fatal — feedback is still shown
      }
    } catch (err) {
      if (!navigator.onLine) {
        setError('You\'re offline. AI feedback requires an internet connection.')
      } else {
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    } finally {
      setLoading(false)
    }
  }, [
    session,
    aiProvider,
    anthropicKey,
    openaiKey,
    geminiKey,
    geminiModel,
    systemPrompt,
    modePrompts,
    currentModeId,
    setSession,
  ])

  return { loading, error, saved, getFeedback, extractScore }
}
