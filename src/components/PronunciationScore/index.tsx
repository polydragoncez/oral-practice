import { useState } from 'react'
import type { PronunciationResult, WordResult } from '../../types/pronunciation'

// ─── Circular gauge ──────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 80) return '#22c55e'   // green
  if (score >= 60) return '#eab308'   // yellow
  return '#ef4444'                    // red
}

function ScoreCircle({ score, label }: { score: number; label: string }) {
  const r = 34
  const cx = 42
  const cy = 42
  const circumference = 2 * Math.PI * r
  const filled = circumference * (score / 100)
  const color = scoreColor(score)

  return (
    <div className="flex flex-col items-center gap-1.5 min-w-0">
      <div className="relative w-[84px] h-[84px] shrink-0">
        <svg viewBox="0 0 84 84" className="w-full h-full -rotate-90">
          <circle
            cx={cx} cy={cy} r={r}
            fill="none" strokeWidth={7}
            stroke="currentColor"
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx={cx} cy={cy} r={r}
            fill="none" strokeWidth={7}
            stroke={color}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference - filled}`}
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-bold tabular-nums" style={{ color }}>
            {Math.round(score)}
          </span>
        </div>
      </div>
      <span className="text-[11px] leading-tight text-center text-gray-500 dark:text-gray-400">
        {label}
      </span>
    </div>
  )
}

// ─── Word chip ────────────────────────────────────────────────────────────────

const ERROR_STYLES: Record<string, string> = {
  None: 'text-gray-800 dark:text-gray-200',
  Mispronunciation:
    'text-red-600 dark:text-red-400 font-semibold underline decoration-red-500 decoration-wavy',
  Omission: 'text-gray-400 dark:text-gray-600 line-through',
  Insertion: 'text-orange-600 dark:text-orange-400 underline decoration-orange-400',
}

function WordChip({ word }: { word: WordResult }) {
  const errorType = word.errorType in ERROR_STYLES ? word.errorType : 'None'
  const cls = ERROR_STYLES[errorType]
  const hasError = errorType !== 'None'
  const hasProsody =
    (word.prosodyFeedback?.breakErrors?.length ?? 0) > 0 ||
    (word.prosodyFeedback?.intonationErrors?.length ?? 0) > 0

  const tooltipParts: string[] = []
  if (hasError) tooltipParts.push(errorType)
  if (hasProsody) {
    if (word.prosodyFeedback?.breakErrors?.length)
      tooltipParts.push(...word.prosodyFeedback.breakErrors)
    if (word.prosodyFeedback?.intonationErrors?.length)
      tooltipParts.push(...word.prosodyFeedback.intonationErrors)
  }

  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-sm ${cls} ${
        hasError || hasProsody ? 'cursor-help' : ''
      }`}
      title={tooltipParts.length > 0 ? tooltipParts.join(' · ') : undefined}
    >
      {word.word}
      {hasProsody && (
        <span className="text-[10px] text-purple-400 leading-none" title="Prosody issue">
          ♪
        </span>
      )}
      {word.accuracyScore > 0 && word.accuracyScore < 60 && (
        <span
          className="text-[10px] leading-none ml-0.5"
          style={{ color: scoreColor(word.accuracyScore) }}
        >
          {Math.round(word.accuracyScore)}
        </span>
      )}
    </span>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface PronunciationScoreProps {
  result: PronunciationResult
}

export function PronunciationScore({ result }: PronunciationScoreProps) {
  const [wordsOpen, setWordsOpen] = useState(true)

  // Collect all unique prosody error types
  const prosodyErrors = Array.from(
    new Set(
      result.words.flatMap((w) => [
        ...(w.prosodyFeedback?.breakErrors ?? []),
        ...(w.prosodyFeedback?.intonationErrors ?? []),
      ])
    )
  )

  const errorWords = result.words.filter((w) => w.errorType !== 'None')

  return (
    <div className="flex flex-col gap-4">
      {/* Score circles */}
      <div className="flex items-start justify-around gap-1 flex-wrap">
        <ScoreCircle score={result.pronunciationScore} label="Pronunciation" />
        <ScoreCircle score={result.accuracyScore} label="Accuracy" />
        <ScoreCircle score={result.fluencyScore} label="Fluency" />
        <ScoreCircle score={result.prosodyScore} label="Prosody" />
      </div>

      {/* Prosody flags */}
      {prosodyErrors.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {prosodyErrors.map((e) => (
            <span
              key={e}
              className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
            >
              ♪ {e}
            </span>
          ))}
        </div>
      )}

      {/* Word-by-word analysis */}
      {result.words.length > 0 && (
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setWordsOpen((v) => !v)}
            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors self-start"
          >
            <span>{wordsOpen ? '▼' : '▶'}</span>
            <span>Word Analysis</span>
            {errorWords.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full text-[10px] font-medium">
                {errorWords.length} error{errorWords.length !== 1 ? 's' : ''}
              </span>
            )}
          </button>

          {wordsOpen && (
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-x-0.5 gap-y-1 leading-relaxed">
                {result.words.map((w, i) => (
                  <WordChip key={i} word={w} />
                ))}
              </div>

              {/* Legend */}
              <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-400">
                <span className="text-red-500 underline decoration-wavy">Mispronunciation</span>
                <span className="line-through">Omission</span>
                <span className="text-orange-500 underline">Insertion</span>
                <span className="text-purple-400">♪ Prosody issue</span>
                <span className="text-red-400">score shown if &lt;60</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
