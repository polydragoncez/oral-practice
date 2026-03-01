import { useState, useRef, useEffect, useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useSettingsStore } from '../stores/settingsStore'
import { generateTTS } from '../services/openai'
import { generateAzureTTS, AZURE_TTS_VOICES } from '../services/azureSpeech'

export interface VoiceOption {
  name: string
  label: string
}

export function useTTS() {
  const { ttsEngine, openaiKey, azureSpeechKey, azureSpeechRegion } = useSettingsStore(
    useShallow((s) => ({
      ttsEngine: s.ttsEngine,
      openaiKey: s.openaiKey,
      azureSpeechKey: s.azureSpeechKey,
      azureSpeechRegion: s.azureSpeechRegion,
    }))
  )

  const [isPlaying, setIsPlaying] = useState(false)
  const [browserVoices, setBrowserVoices] = useState<VoiceOption[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string>('')

  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Browser voices
  useEffect(() => {
    if (ttsEngine !== 'browser') return
    const loadVoices = () => {
      const available = speechSynthesis
        .getVoices()
        .filter((v) => v.lang.startsWith('en'))
        .map((v) => ({ name: v.name, label: v.name }))
      setBrowserVoices(available)
      if (available.length > 0 && !selectedVoice) {
        setSelectedVoice(available[0].name)
      }
    }
    loadVoices()
    speechSynthesis.addEventListener('voiceschanged', loadVoices)
    return () => speechSynthesis.removeEventListener('voiceschanged', loadVoices)
  }, [ttsEngine, selectedVoice])

  // Set default Azure voice when switching to azure
  useEffect(() => {
    if (ttsEngine === 'azure' && !selectedVoice) {
      setSelectedVoice(AZURE_TTS_VOICES[0].name)
    }
  }, [ttsEngine, selectedVoice])

  const voices: VoiceOption[] =
    ttsEngine === 'browser' ? browserVoices
    : ttsEngine === 'azure'  ? AZURE_TTS_VOICES
    : []  // openai — no selection needed

  const stopSpeaking = useCallback(() => {
    if (ttsEngine === 'browser') {
      speechSynthesis.cancel()
    } else if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setIsPlaying(false)
  }, [ttsEngine])

  const playBlob = useCallback(async (blobPromise: Promise<Blob>) => {
    setIsPlaying(true)
    try {
      const blob = await blobPromise
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => { setIsPlaying(false); URL.revokeObjectURL(url) }
      audio.onerror = () => { setIsPlaying(false); URL.revokeObjectURL(url) }
      audio.play()
    } catch (err) {
      console.error('TTS error:', err)
      setIsPlaying(false)
    }
  }, [])

  const speak = useCallback(
    async (text: string) => {
      stopSpeaking()

      if (ttsEngine === 'browser') {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'en-US'
        const voice = speechSynthesis.getVoices().find((v) => v.name === selectedVoice)
        if (voice) utterance.voice = voice
        utterance.onstart = () => setIsPlaying(true)
        utterance.onend = () => setIsPlaying(false)
        utterance.onerror = () => setIsPlaying(false)
        setIsPlaying(true)
        speechSynthesis.speak(utterance)
      } else if (ttsEngine === 'openai') {
        if (!openaiKey) { console.error('OpenAI key not set'); return }
        await playBlob(generateTTS(openaiKey, text))
      } else if (ttsEngine === 'azure') {
        if (!azureSpeechKey) { console.error('Azure key not set'); return }
        await playBlob(generateAzureTTS(azureSpeechKey, azureSpeechRegion, text, selectedVoice || AZURE_TTS_VOICES[0].name))
      }
    },
    [ttsEngine, openaiKey, azureSpeechKey, azureSpeechRegion, selectedVoice, stopSpeaking, playBlob]
  )

  return { speak, stop: stopSpeaking, isPlaying, voices, selectedVoice, setSelectedVoice }
}
