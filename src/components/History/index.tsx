import { useState, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { getAllSessions, deleteSession } from '../../services/db'
import type { SessionRecord } from '../../services/db'
import { PronunciationScore } from '../PronunciationScore'
import { useTTS } from '../../hooks/useTTS'
import { extractModelResponses } from '../../utils/feedback'
import { getModeById } from '../../modes'

export function History() {
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [expanded, setExpanded] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const { speak, stop: stopTTS, isPlaying } = useTTS()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const all = await getAllSessions()
      setSessions(all)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleDelete = useCallback(
    async (id: number) => {
      if (!confirm('Delete this session?')) return
      await deleteSession(id)
      setSessions((prev) => prev.filter((s) => s.id !== id))
      if (expanded === id) setExpanded(null)
    },
    [expanded]
  )

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`
  }

  const computeWpm = (transcript: string, duration: number): number | null => {
    if (!transcript.trim() || duration <= 0) return null
    return Math.round((transcript.trim().split(/\s+/).length / duration) * 60)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-2" />
        Loading…
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 dark:text-gray-500">
        <div className="text-5xl mb-3">📚</div>
        <p>No sessions yet. Complete a practice to see history here.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          History ({sessions.length})
        </h2>
        <button
          onClick={load}
          className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {sessions.map((s) => {
        const mode = s.modeId ? getModeById(s.modeId) : null
        const hasImage = !!(s.imageUrl || s.imageBase64)
        const meta = (s.metadata ?? {}) as Record<string, unknown>

        return (
          <div
            key={s.id}
            className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setExpanded((prev) => (prev === s.id ? null : s.id!))}
            >
              {hasImage ? (
                <img
                  src={s.imageUrl?.startsWith('http')
                      ? s.imageUrl
                      : s.imageBase64
                        ? `data:${s.imageMimeType ?? 'image/jpeg'};base64,${s.imageBase64}`
                        : s.imageUrl}
                  alt=""
                  className="w-16 h-12 object-cover rounded-lg flex-shrink-0"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = s.imageUrl
                  }}
                />
              ) : (
                <div className="w-16 h-12 rounded-lg flex-shrink-0 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-2xl">
                  {mode?.icon ?? '🎙'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {mode && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 font-medium">
                      {mode.icon} {mode.name}
                    </span>
                  )}
                  <span className="text-sm font-medium text-gray-800 dark:text-white">
                    {formatDate(s.timestamp)}
                  </span>
                  {s.score !== null && (
                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold">
                      {s.score}/10
                    </span>
                  )}
                  {s.pronunciationResult && (
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold">
                      P:{Math.round(s.pronunciationResult.pronunciationScore)}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{formatDuration(s.duration)}</span>
                  {(() => {
                    const wpm = computeWpm(s.transcript, s.duration)
                    return wpm ? (
                      <span className="text-xs text-gray-400">{wpm} WPM</span>
                    ) : null
                  })()}
                </div>
                {s.transcript && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {s.transcript}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(s.id!)
                  }}
                  className="text-xs px-2 py-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                >
                  🗑
                </button>
                <span className="text-gray-400 text-sm">{expanded === s.id ? '▲' : '▼'}</span>
              </div>
            </div>

            {/* Expanded content */}
            {expanded === s.id && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-4 bg-gray-50 dark:bg-gray-800/50">
                {hasImage && (
                  <img
                    src={s.imageUrl?.startsWith('http')
                      ? s.imageUrl
                      : s.imageBase64
                        ? `data:${s.imageMimeType ?? 'image/jpeg'};base64,${s.imageBase64}`
                        : s.imageUrl}
                    alt=""
                    className="w-full max-h-64 object-contain rounded-lg"
                  />
                )}

                {/* Passage metadata (summarize mode) */}
                {typeof meta.passageTitle === 'string' && typeof meta.passageText === 'string' && (
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase">
                      Original Passage: {meta.passageTitle}
                    </span>
                    <p className="text-sm text-emerald-800 dark:text-emerald-200 mt-1 leading-relaxed">
                      {meta.passageText}
                    </p>
                  </div>
                )}

                {/* Question metadata */}
                {typeof meta.questionText === 'string' && (
                  <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase">Question</span>
                    <p className="text-sm text-indigo-800 dark:text-indigo-200 mt-1 font-medium">
                      {meta.questionText}
                    </p>
                  </div>
                )}

                {/* Debate metadata */}
                {typeof meta.debateTopic === 'string' && (
                  <div className="flex flex-col gap-3">
                    <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Topic</span>
                      <p className="text-sm text-gray-800 dark:text-white mt-1 font-medium">
                        {meta.debateTopic}
                      </p>
                    </div>
                    {typeof meta.proTranscript === 'string' && (
                      <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                        <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase">FOR</span>
                        <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                          {meta.proTranscript}
                        </p>
                      </div>
                    )}
                    {typeof meta.conTranscript === 'string' && (
                      <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                        <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase">AGAINST</span>
                        <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                          {meta.conTranscript}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Shadowing text and source */}
                {s.shadowingText && (
                  <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase">
                        Reference Text
                      </span>
                      {s.shadowingSource && (() => {
                        const srcMode = getModeById(s.shadowingSource.modeId)
                        const ver = s.shadowingSource.version === 'corrected' ? 'Corrected' : 'Reference'
                        return (
                          <span className="text-xs text-violet-500 dark:text-violet-400">
                            from {srcMode.icon} {srcMode.name} — {ver}
                          </span>
                        )
                      })()}
                    </div>
                    <p className="text-sm text-violet-800 dark:text-violet-200 leading-relaxed">
                      {s.shadowingText}
                    </p>
                  </div>
                )}

                {/* Regular transcript (shown for non-debate sessions or when no debate metadata) */}
                {s.transcript && !meta.debateTopic && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Transcript
                      </h4>
                      {(() => {
                        const wpm = computeWpm(s.transcript, s.duration)
                        return wpm ? (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full">
                            {wpm} WPM
                          </span>
                        ) : null
                      })()}
                    </div>
                    <p className="text-sm text-gray-800 dark:text-white bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      {s.transcript}
                    </p>
                  </div>
                )}

                {s.recordingBlob && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Recording
                    </h4>
                    <audio
                      src={URL.createObjectURL(s.recordingBlob)}
                      controls
                      className="w-full h-10"
                    />
                  </div>
                )}

                {s.pronunciationResult && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                      Pronunciation Assessment
                    </h4>
                    <PronunciationScore result={s.pronunciationResult} />
                  </div>
                )}

                {s.aiFeedback && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      AI Feedback
                    </h4>
                    <div className="prose dark:prose-invert prose-sm max-w-none bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <ReactMarkdown>{s.aiFeedback}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Model Response cards with TTS */}
                {s.aiFeedback && (() => {
                  const { corrected, reference } = extractModelResponses(s.aiFeedback)
                  if (!corrected && !reference) return null
                  return (
                    <>
                      {corrected && (
                        <div className="p-4 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex flex-col gap-3">
                          <span className="text-xs font-semibold uppercase tracking-wide text-teal-600 dark:text-teal-400">
                            ✏️ Corrected Version
                          </span>
                          <p className="text-sm text-teal-900 dark:text-teal-100 leading-relaxed select-text">
                            {corrected}
                          </p>
                          <button
                            onClick={() => {
                              if (isPlaying) { stopTTS(); return }
                              speak(corrected)
                            }}
                            className="self-start flex items-center gap-1.5 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            {isPlaying ? '⏹️ Stop' : '🔊 Listen'}
                          </button>
                        </div>
                      )}
                      {reference && (
                        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-col gap-3">
                          <span className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                            ⭐ Reference Version
                          </span>
                          <p className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed select-text">
                            {reference}
                          </p>
                          <button
                            onClick={() => {
                              if (isPlaying) { stopTTS(); return }
                              speak(reference)
                            }}
                            className="self-start flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            {isPlaying ? '⏹️ Stop' : '🔊 Listen'}
                          </button>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
