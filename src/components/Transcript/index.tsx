import { useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useSettingsStore } from '../../stores/settingsStore'

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
  const { session, setSession } = useSettingsStore(
    useShallow((s) => ({ session: s.session, setSession: s.setSession }))
  )

  const wpm = computeWpm(session.transcript, session.duration)

  const handleCopy = useCallback(() => {
    if (session.transcript) {
      navigator.clipboard.writeText(session.transcript).catch(console.error)
    }
  }, [session.transcript])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        {wpm !== null && <WpmBadge wpm={wpm} />}
        <div className="flex-1" />
        {session.transcript && (
          <button
            onClick={handleCopy}
            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded transition-colors"
          >
            📋 Copy
          </button>
        )}
      </div>

      {session.transcript ? (
        <textarea
          value={session.transcript}
          onChange={(e) => setSession({ transcript: e.target.value })}
          className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none min-h-[100px] outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="Your transcript will appear here…"
        />
      ) : (
        <div className="p-3 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 text-sm min-h-[80px] flex items-center">
          Record yourself speaking to see the transcript here
        </div>
      )}

      {!session.transcript && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Reference: Beginner 80–100 · Intermediate 120–150 · Native-like 150–180 WPM
        </p>
      )}
    </div>
  )
}
