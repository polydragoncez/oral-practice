import { useRef, useEffect, useCallback, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useSettingsStore } from '../../stores/settingsStore'
import { useRecorder } from '../../hooks/useRecorder'
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition'
import { transcribeAudio } from '../../services/whisper'

interface RecorderProps {
  onRecordingComplete?: () => void
}

export function Recorder({ onRecordingComplete }: RecorderProps) {
  const { defaultDuration, sttEngine, openaiKey, session, setSession } = useSettingsStore(
    useShallow((s) => ({
      defaultDuration: s.defaultDuration,
      sttEngine: s.sttEngine,
      openaiKey: s.openaiKey,
      session: s.session,
      setSession: s.setSession,
    }))
  )

  const [duration, setDuration] = useState(defaultDuration)
  const [transcribing, setTranscribing] = useState(false)
  const [micError, setMicError] = useState<string | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { isRecording, timeLeft, analyserData, start, stop } = useRecorder()
  const { interim, final, start: startSTT, stop: stopSTT, reset: resetSTT, isSupported } =
    useSpeechRecognition()

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0, 0, W, H)

    if (!isRecording) {
      ctx.strokeStyle = '#6366f1'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, H / 2)
      ctx.lineTo(W, H / 2)
      ctx.stroke()
      return
    }

    ctx.strokeStyle = '#6366f1'
    ctx.lineWidth = 2
    ctx.beginPath()
    const sliceWidth = W / analyserData.length
    let x = 0
    for (let i = 0; i < analyserData.length; i++) {
      const v = analyserData[i] / 128.0
      const y = (v * H) / 2
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
      x += sliceWidth
    }
    ctx.lineTo(W, H / 2)
    ctx.stroke()
  }, [analyserData, isRecording])

  const handleToggle = useCallback(async () => {
    if (isRecording) {
      stop()
      if (sttEngine === 'webSpeech') stopSTT()
    } else {
      setMicError(null)
      resetSTT()
      setSession({ transcript: '', aiFeedback: '', recordingBlob: null, pronunciationResult: null })

      try {
        const recordPromise = start(duration)

        if (sttEngine === 'webSpeech' && isSupported) {
          startSTT()
        }

        const result = await recordPromise
        setSession({ recordingBlob: result.blob, duration: result.duration })

        if (sttEngine === 'whisper') {
          if (!openaiKey) {
            setMicError('OpenAI key required for Whisper STT')
            return
          }
          setTranscribing(true)
          try {
            const text = await transcribeAudio(openaiKey, result.blob)
            setSession({ transcript: text })
          } catch (err) {
            setMicError(err instanceof Error ? err.message : 'Whisper transcription failed')
          } finally {
            setTranscribing(false)
          }
        } else {
          // Web Speech: final transcript already accumulated
        }

        onRecordingComplete?.()
      } catch (err) {
        setMicError(
          err instanceof Error && err.name === 'NotAllowedError'
            ? 'Microphone access denied'
            : 'Failed to start recording'
        )
      }
    }
  }, [
    isRecording,
    stop,
    start,
    duration,
    sttEngine,
    isSupported,
    startSTT,
    stopSTT,
    resetSTT,
    openaiKey,
    setSession,
    onRecordingComplete,
  ])

  // Sync web speech transcript to session
  useEffect(() => {
    if (sttEngine === 'webSpeech') {
      const combined = (final + interim).trim()
      if (combined) setSession({ transcript: combined })
    }
  }, [final, interim, sttEngine, setSession])

  // Stop STT when recording stops
  useEffect(() => {
    if (!isRecording && sttEngine === 'webSpeech') {
      stopSTT()
    }
  }, [isRecording, sttEngine, stopSTT])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Waveform canvas */}
      <canvas
        ref={canvasRef}
        width={600}
        height={80}
        className="w-full rounded-lg bg-gray-100 dark:bg-gray-800"
      />

      <div className="flex items-center gap-4 flex-wrap">
        {/* Record button */}
        <button
          onClick={handleToggle}
          disabled={transcribing}
          className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg transition-all ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 animate-pulse'
              : 'bg-indigo-600 hover:bg-indigo-700'
          } disabled:opacity-50`}
        >
          {isRecording ? '⏹' : '🎙'}
        </button>

        {/* Timer */}
        {isRecording && (
          <div className="text-3xl font-mono font-bold text-red-500 dark:text-red-400 tabular-nums">
            {formatTime(timeLeft)}
          </div>
        )}

        {/* Duration slider */}
        {!isRecording && (
          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <label className="text-sm text-gray-600 dark:text-gray-400">
              Duration: {formatTime(duration)}
            </label>
            <input
              type="range"
              min={10}
              max={300}
              step={10}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>10s</span>
              <span>5m</span>
            </div>
          </div>
        )}

        {transcribing && (
          <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            Transcribing…
          </div>
        )}
      </div>

      {micError && (
        <p className="text-sm text-red-500 dark:text-red-400">{micError}</p>
      )}

      {/* Playback */}
      {session.recordingBlob && !isRecording && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Playback:</span>
          <audio
            src={URL.createObjectURL(session.recordingBlob)}
            controls
            className="h-8 flex-1"
          />
        </div>
      )}
    </div>
  )
}
