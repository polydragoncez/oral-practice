import { useState, useRef, useCallback } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySpeechRecognition = any

export function useSpeechRecognition() {
  const [interim, setInterim] = useState('')
  const [final, setFinal] = useState('')
  const recognitionRef = useRef<AnySpeechRecognition>(null)
  const isActiveRef = useRef(false)

  const SR: AnySpeechRecognition =
    typeof window !== 'undefined'
      ? (window as AnySpeechRecognition).SpeechRecognition ||
        (window as AnySpeechRecognition).webkitSpeechRecognition
      : null

  const isSupported = !!SR

  const start = useCallback(() => {
    if (!SR) return

    const recognition = new SR()
    recognitionRef.current = recognition
    recognition.lang = 'en-US'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: AnySpeechRecognition) => {
      let interimText = ''
      let finalText = ''

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalText += result[0].transcript + ' '
        } else {
          interimText += result[0].transcript
        }
      }

      setFinal(finalText)
      setInterim(interimText)
    }

    recognition.onend = () => {
      if (isActiveRef.current) {
        try {
          recognition.start()
        } catch {
          // ignore
        }
      }
    }

    recognition.onerror = (e: AnySpeechRecognition) => {
      if (e.error === 'no-speech') return
      console.warn('Speech recognition error:', e.error)
    }

    isActiveRef.current = true
    setFinal('')
    setInterim('')
    try {
      recognition.start()
    } catch {
      // already started
    }
  }, [SR])

  const stop = useCallback(() => {
    isActiveRef.current = false
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // ignore
      }
      recognitionRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    setFinal('')
    setInterim('')
  }, [])

  return { interim, final, start, stop, reset, isSupported }
}
