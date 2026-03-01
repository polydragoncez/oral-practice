import { useCallback, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useSettingsStore } from '../../stores/settingsStore'
import { transcribeAudio } from '../../services/whisper'

function computeWpm(transcript: string, durationSecs: number): number | null {
  if (!transcript.trim() || durationSecs <= 0) return null
  return Math.round((transcript.trim().split(/\s+/).length / durationSecs) * 60)
}

function WpmBadge({ wpm }: { wpm: number }) {
  let level: string
  let colors: string
  if (wpm < 80) {
    level = 'Slow'
    colors = 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300'
  } else if (wpm < 120) {
    level = 'Beginner'
    colors = 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'
  } else if (wpm < 150) {
    level = 'Intermediate'
    colors = 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
  } else if (wpm < 180) {
    level = 'Native-like'
    colors = 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
  } else {
    level = 'Fast'
    colors = 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${colors}`}
      title="Beginner: 80–100 WPM · Intermediate: 120–150 WPM · Native-like: 150–180 WPM"
    >
      <span className="font-bold">{wpm} WPM</span>
      <span className="opacity-70">· {level}</span>
    </span>
  )
}

export function Transcript() {
  const { session, setSession, openaiKey } = useSettingsStore(
    useShallow((s) => ({ session: s.session, setSession: s.setSession, openaiKey: s.openaiKey }))
  )

  const [whisperTranscribing, setWhisperTranscribing] = useState(false)
  const [whisperError, setWhisperError] = useState<string | null>(null)

  const wpm = computeWpm(session.transcript, session.duration)

  const handleCopy = useCallback(() => {
    if (session.transcript) {
      navigator.clipboard.writeText(session.transcript).catch(console.error)
    }
  }, [session.transcript])

  const handleManualWhisper = useCallback(async () => {
    if (!session.recordingBlob || !openaiKey) return
    setWhisperTranscribing(true)
    setWhisperError(null)
    try {
      const text = await transcribeAudio(openaiKey, session.recordingBlob)
      setSession({ transcript: text })
    } catch (err) {
      setWhisperError(err instanceof Error ? err.message : 'Whisper transcription failed')
    } finally {
      setWhisperTranscribing(false)
    }
  }, [session.recordingBlob, openaiKey, setSession])

  const showManualWhisper = !session.transcript && session.recordingBlob && openaiKey
  const showEmptyHint = !session.transcript && session.recordingBlob && !openaiKey

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        {wpm !== null && <WpmBadge wpm={wpm} />}
        <div className="flex-1" />
        {showManualWhisper && (
          <button
            onClick={handleManualWhisper}
            disabled={whisperTranscribing}
            className="text-xs px-2 py-1 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 dark:hover:bg-indigo-800 text-indigo-700 dark:text-indigo-300 rounded transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            {whisperTranscribing ? (
              <>
                <span className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin inline-block" />
                Transcribing…
              </>
            ) : (
              'Transcribe with Whisper'
            )}
          </button>
        )}
        {session.transcript && (
          <button
            onClick={handleCopy}
            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded transition-colors"
          >
            Copy
          </button>
        )}
      </div>

      {session.transcriptSource === 'azure' && session.transcript && (
        <p className="text-xs text-blue-600 dark:text-blue-400">
          Transcript extracted from pronunciation assessment
        </p>
      )}

      {session.transcript ? (
        <textarea
          value={session.transcript}
          onChange={(e) => setSession({ transcript: e.target.value, transcriptSource: null })}
          className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none min-h-[100px] outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="Your transcript will appear here…"
        />
      ) : session.recordingBlob ? (
        <textarea
          value=""
          onChange={(e) => setSession({ transcript: e.target.value })}
          className="w-full p-3 rounded-lg border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20 text-gray-900 dark:text-white text-sm resize-none min-h-[100px] outline-none focus:ring-2 focus:ring-amber-400"
          placeholder="Speech recognition returned empty — type your transcript here..."
        />
      ) : (
        <div className="p-3 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 text-sm min-h-[80px] flex items-center">
          Record yourself speaking to see the transcript here
        </div>
      )}

      {whisperError && (
        <p className="text-xs text-red-500 dark:text-red-400">{whisperError}</p>
      )}

      {showEmptyHint && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Add an OpenAI key in Settings to enable Whisper transcription as a fallback.
        </p>
      )}

      {!session.transcript && !session.recordingBlob && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Reference: Beginner 80–100 · Intermediate 120–150 · Native-like 150–180 WPM
        </p>
      )}
    </div>
  )
}
