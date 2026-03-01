import { useState, useCallback } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import { assessPronunciation } from '../services/azureSpeech'
import type { PronunciationResult } from '../types/pronunciation'

export interface UseAzurePronunciationReturn {
  assess: (audioBlob: Blob, transcript: string, options?: { granularity?: 'Word' | 'Phoneme' }) => Promise<void>
  result: PronunciationResult | null
  isAssessing: boolean
  error: string | null
  azureAvailable: boolean
}

export function useAzurePronunciation(): UseAzurePronunciationReturn {
  const [result, setResult] = useState<PronunciationResult | null>(null)
  const [isAssessing, setIsAssessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const azureSpeechKey = useSettingsStore((s) => s.azureSpeechKey)
  const azureSpeechRegion = useSettingsStore((s) => s.azureSpeechRegion)
  const setSession = useSettingsStore((s) => s.setSession)

  const azureAvailable = !!(azureSpeechKey && azureSpeechRegion)

  const assess = useCallback(
    async (audioBlob: Blob, transcript: string, options?: { granularity?: 'Word' | 'Phoneme' }) => {
      if (!azureSpeechKey) return
      if (!transcript.trim()) return

      setIsAssessing(true)
      setError(null)
      setResult(null)
      setSession({ pronunciationResult: null })

      try {
        const pronunciationResult = await assessPronunciation(
          azureSpeechKey,
          azureSpeechRegion,
          audioBlob,
          transcript,
          options
        )
        setResult(pronunciationResult)
        setSession({ pronunciationResult })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Pronunciation assessment failed')
      } finally {
        setIsAssessing(false)
      }
    },
    [azureSpeechKey, azureSpeechRegion, setSession]
  )

  return { assess, result, isAssessing, error, azureAvailable }
}
