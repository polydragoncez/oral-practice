import { useState, useEffect, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useSettingsStore } from '../../stores/settingsStore'
import { useRecorder } from '../../hooks/useRecorder'
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition'
import { transcribeAudio } from '../../services/whisper'
import { DEBATE_TOPICS, DEBATE_CATEGORIES } from '../../data/debateTopics'
import type { DebateTopic } from '../../data/debateTopics'

type Phase = 'setup' | 'recording-pro' | 'transition' | 'recording-con' | 'done'

interface DebateFlowProps {
  onRecordingComplete?: () => void
}

function pickRandom(topics: DebateTopic[]): DebateTopic {
  return topics[Math.floor(Math.random() * topics.length)]
}

export function DebateFlow({ onRecordingComplete }: DebateFlowProps) {
  const { defaultDuration, sttEngine, openaiKey, setSession } = useSettingsStore(
    useShallow((s) => ({
      defaultDuration: s.defaultDuration,
      sttEngine: s.sttEngine,
      openaiKey: s.openaiKey,
      setSession: s.setSession,
    }))
  )

  const [phase, setPhase] = useState<Phase>('setup')
  const [topic, setTopic] = useState<DebateTopic>(() => pickRandom(DEBATE_TOPICS))
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [customTopic, setCustomTopic] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [perSideDuration, setPerSideDuration] = useState(Math.min(defaultDuration, 120))
  const [showHints, setShowHints] = useState(false)
  const [transitionCount, setTransitionCount] = useState(3)
  const [transcribing, setTranscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const proTranscriptRef = useRef('')
  const proDurationRef = useRef(0)
  const conTranscriptRef = useRef('')
  const conDurationRef = useRef(0)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const recorder = useRecorder()
  const stt = useSpeechRecognition()

  const topicText = useCustom ? customTopic.trim() : topic.topic

  // Derive whether to use Web Speech (auto mode uses it when supported)
  const useWebSpeech = sttEngine === 'webSpeech' || (sttEngine === 'auto' && stt.isSupported)

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0, 0, W, H)

    if (!recorder.isRecording) {
      ctx.strokeStyle = '#6366f1'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, H / 2)
      ctx.lineTo(W, H / 2)
      ctx.stroke()
      return
    }

    ctx.strokeStyle = phase === 'recording-pro' ? '#22c55e' : '#ef4444'
    ctx.lineWidth = 2
    ctx.beginPath()
    const sliceWidth = W / recorder.analyserData.length
    let x = 0
    for (let i = 0; i < recorder.analyserData.length; i++) {
      const v = recorder.analyserData[i] / 128.0
      const y = (v * H) / 2
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
      x += sliceWidth
    }
    ctx.lineTo(W, H / 2)
    ctx.stroke()
  }, [recorder.analyserData, recorder.isRecording, phase])

  // Transition countdown
  useEffect(() => {
    if (phase !== 'transition') return
    if (transitionCount <= 0) {
      startConRecording()
      return
    }
    const timer = setTimeout(() => setTransitionCount((c) => c - 1), 1000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, transitionCount])

  // Sync web speech transcript to refs during recording
  useEffect(() => {
    if (!useWebSpeech) return
    const combined = (stt.final + stt.interim).trim()
    if (phase === 'recording-pro' && combined) {
      proTranscriptRef.current = combined
    } else if (phase === 'recording-con' && combined) {
      conTranscriptRef.current = combined
    }
  }, [stt.final, stt.interim, useWebSpeech, phase])

  const filteredTopics = DEBATE_TOPICS.filter(
    (t) => categoryFilter === 'all' || t.category === categoryFilter
  )

  const handleNewTopic = () => {
    const pool = filteredTopics.length > 0 ? filteredTopics : DEBATE_TOPICS
    setTopic(pickRandom(pool))
    setUseCustom(false)
  }

  const handleCustomApply = () => {
    if (!customTopic.trim()) return
    setUseCustom(true)
  }

  const handleWhisperTranscribe = async (blob: Blob): Promise<string> => {
    if (!openaiKey) throw new Error('OpenAI key required for Whisper STT')
    setTranscribing(true)
    try {
      return await transcribeAudio(openaiKey, blob)
    } finally {
      setTranscribing(false)
    }
  }

  /** Auto-fallback: wait 2s for Web Speech, then try Whisper */
  const autoFallbackTranscribe = async (
    blob: Blob,
    transcriptRef: React.MutableRefObject<string>
  ): Promise<void> => {
    stt.stop()
    await new Promise((r) => setTimeout(r, 2000))

    if (!transcriptRef.current.trim() && openaiKey) {
      setTranscribing(true)
      try {
        transcriptRef.current = await transcribeAudio(openaiKey, blob)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Whisper transcription failed')
      } finally {
        setTranscribing(false)
      }
    }
  }

  const startProRecording = async () => {
    setError(null)
    setPhase('recording-pro')
    proTranscriptRef.current = ''
    proDurationRef.current = 0

    try {
      if (useWebSpeech) {
        stt.reset()
        stt.start()
      }

      const result = await recorder.start(perSideDuration)
      proDurationRef.current = result.duration

      if (useWebSpeech) {
        if (sttEngine === 'auto') {
          await autoFallbackTranscribe(result.blob, proTranscriptRef)
        } else {
          stt.stop()
          // Give a moment for final transcript
          await new Promise((r) => setTimeout(r, 200))
        }
      } else {
        proTranscriptRef.current = await handleWhisperTranscribe(result.blob)
      }

      // Transition
      setPhase('transition')
      setTransitionCount(3)

      if (useWebSpeech) {
        stt.reset()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recording failed')
      setPhase('setup')
    }
  }

  const startConRecording = async () => {
    setPhase('recording-con')
    conTranscriptRef.current = ''
    conDurationRef.current = 0

    try {
      if (useWebSpeech) {
        stt.reset()
        stt.start()
      }

      const result = await recorder.start(perSideDuration)
      conDurationRef.current = result.duration

      if (useWebSpeech) {
        if (sttEngine === 'auto') {
          await autoFallbackTranscribe(result.blob, conTranscriptRef)
        } else {
          stt.stop()
          await new Promise((r) => setTimeout(r, 200))
        }
      } else {
        conTranscriptRef.current = await handleWhisperTranscribe(result.blob)
      }

      // Done — combine transcripts and update store
      const combinedTranscript = `[FOR] ${proTranscriptRef.current}\n\n[AGAINST] ${conTranscriptRef.current}`
      const totalDuration = proDurationRef.current + conDurationRef.current

      setSession({
        transcript: combinedTranscript,
        duration: totalDuration,
        modeState: {
          debateTopic: topicText,
          proTranscript: proTranscriptRef.current,
          conTranscript: conTranscriptRef.current,
          proDuration: proDurationRef.current,
          conDuration: conDurationRef.current,
        },
      })

      setPhase('done')
      onRecordingComplete?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recording failed')
      setPhase('setup')
    }
  }

  const handleStopCurrent = () => {
    recorder.stop()
    if (useWebSpeech) stt.stop()
  }

  const handleReset = () => {
    setPhase('setup')
    setSession({ transcript: '', aiFeedback: '', recordingBlob: null, duration: 0, modeState: {} })
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  // ─── SETUP PHASE ────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 flex flex-col gap-4">
        {/* Topic display */}
        <p className="text-xl font-semibold text-gray-800 dark:text-white leading-relaxed">
          {topicText}
        </p>

        {!useCustom && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium self-start">
            {topic.category}
          </span>
        )}

        {/* Hints */}
        {!useCustom && (
          <div>
            <button
              onClick={() => setShowHints((v) => !v)}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {showHints ? '▲ Hide hints' : '▼ Show hints'}
            </button>
            {showHints && (
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                  <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase">FOR</span>
                  <p className="text-sm text-green-800 dark:text-green-200 mt-1">{topic.proHint}</p>
                </div>
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                  <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase">AGAINST</span>
                  <p className="text-sm text-red-800 dark:text-red-200 mt-1">{topic.conHint}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Duration slider */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-600 dark:text-gray-400">
            Per side: {formatTime(perSideDuration)}
          </label>
          <input
            type="range"
            min={15}
            max={180}
            step={15}
            value={perSideDuration}
            onChange={(e) => setPerSideDuration(Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>15s</span>
            <span>3m</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={startProRecording}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Start Debate
          </button>
          <button
            onClick={handleNewTopic}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
          >
            New Topic
          </button>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
          >
            <option value="all">All Categories</option>
            {DEBATE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Custom topic */}
        <div className="flex gap-2">
          <input
            type="text"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            placeholder="Or type your own topic..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-400"
            onKeyDown={(e) => e.key === 'Enter' && handleCustomApply()}
          />
          <button
            onClick={handleCustomApply}
            disabled={!customTopic.trim()}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Use
          </button>
        </div>

        {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
      </div>
    )
  }

  // ─── RECORDING PHASE (PRO or CON) ──────────────────────────────────
  if (phase === 'recording-pro' || phase === 'recording-con') {
    const isPro = phase === 'recording-pro'
    const sideLabel = isPro ? 'FOR' : 'AGAINST'
    const sideColor = isPro ? 'green' : 'red'
    const hint = isPro ? topic.proHint : topic.conHint

    return (
      <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 flex flex-col gap-4">
        {/* Side badge */}
        <div className="flex items-center gap-3">
          <span className={`px-4 py-1.5 rounded-full text-sm font-bold text-white ${isPro ? 'bg-green-500' : 'bg-red-500'}`}>
            {sideLabel}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Argue {isPro ? 'in favor of' : 'against'} the topic
          </span>
        </div>

        {/* Topic */}
        <p className="text-lg font-medium text-gray-800 dark:text-white">{topicText}</p>

        {/* Hint */}
        {!useCustom && (
          <p className={`text-sm text-${sideColor}-600 dark:text-${sideColor}-400 italic`}>
            Hint: {hint}
          </p>
        )}

        {/* Waveform */}
        <canvas
          ref={canvasRef}
          width={600}
          height={80}
          className="w-full rounded-lg bg-gray-100 dark:bg-gray-800"
        />

        {/* Timer + stop */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleStopCurrent}
            className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl bg-red-500 hover:bg-red-600 animate-pulse shadow-lg"
          >
            ⏹
          </button>
          <div className="text-3xl font-mono font-bold text-red-500 dark:text-red-400 tabular-nums">
            {formatTime(recorder.timeLeft)}
          </div>
        </div>

        {/* Live transcript */}
        {useWebSpeech && (stt.final || stt.interim) && (
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {stt.final}
              <span className="text-gray-400">{stt.interim}</span>
            </p>
          </div>
        )}

        {transcribing && (
          <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            Transcribing…
          </div>
        )}
      </div>
    )
  }

  // ─── TRANSITION PHASE ──────────────────────────────────────────────
  if (phase === 'transition') {
    return (
      <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-8 flex flex-col items-center gap-4">
        <p className="text-lg font-semibold text-gray-800 dark:text-white">
          Now switch to the <span className="text-red-500 font-bold">AGAINST</span> side…
        </p>
        <div className="text-6xl font-mono font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
          {transitionCount}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Get ready to argue the opposite position</p>
      </div>
    )
  }

  // ─── DONE PHASE ────────────────────────────────────────────────────
  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 flex flex-col gap-4">
      <p className="text-lg font-semibold text-gray-800 dark:text-white">Debate complete!</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">{topicText}</p>

      {/* FOR transcript */}
      <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
        <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase">FOR</span>
        <p className="text-sm text-green-800 dark:text-green-200 mt-1">
          {proTranscriptRef.current || '(no transcript)'}
        </p>
      </div>

      {/* AGAINST transcript */}
      <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
        <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase">AGAINST</span>
        <p className="text-sm text-red-800 dark:text-red-200 mt-1">
          {conTranscriptRef.current || '(no transcript)'}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
        >
          New Debate
        </button>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Scroll down to get AI feedback on your arguments.
        </p>
      </div>
    </div>
  )
}
