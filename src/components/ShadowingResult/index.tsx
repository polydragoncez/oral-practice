import { useState } from 'react'
import type { PronunciationResult, WordResult } from '../../types/pronunciation'

// ─── Circular gauge (reused pattern) ─────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 90) return '#22c55e'   // green
  if (score >= 70) return '#eab308'   // yellow
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

// ─── Word token with interactive expand ──────────────────────────────────────

function WordToken({
  word,
  isExpanded,
  onClick,
}: {
  word: WordResult
  isExpanded: boolean
  onClick: () => void
}) {
  const score = word.accuracyScore
  const errorType = word.errorType

  // Color based on score
  let bgClass = 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
  let borderClass = 'border-green-200 dark:border-green-800'
  if (errorType === 'Omission') {
    bgClass = 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 line-through'
    borderClass = 'border-gray-300 dark:border-gray-700'
  } else if (errorType === 'Insertion') {
    bgClass = 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
    borderClass = 'border-purple-300 dark:border-purple-700'
  } else if (score < 70) {
    bgClass = 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
    borderClass = 'border-red-200 dark:border-red-800'
  } else if (score < 90) {
    bgClass = 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200'
    borderClass = 'border-amber-200 dark:border-amber-800'
  }

  const label = errorType === 'Omission' ? 'Skipped'
    : errorType === 'Insertion' ? 'Extra'
    : errorType === 'Mispronunciation' ? 'Mispron.'
    : null

  return (
    <div className="inline-flex flex-col items-center">
      <button
        onClick={onClick}
        className={`px-2 py-1 rounded-lg border text-sm font-medium transition-all cursor-pointer hover:shadow-sm ${bgClass} ${borderClass} ${isExpanded ? 'ring-2 ring-indigo-400' : ''}`}
        title={`${word.word}: ${Math.round(score)}/100${label ? ` (${label})` : ''}`}
      >
        {word.word}
      </button>
      <span className="text-[10px] tabular-nums mt-0.5" style={{ color: scoreColor(score) }}>
        {errorType === 'Omission' ? '—' : Math.round(score)}
      </span>
      {label && (
        <span className={`text-[9px] mt-0.5 ${
          errorType === 'Omission' ? 'text-gray-400' :
          errorType === 'Insertion' ? 'text-purple-500' :
          'text-red-500'
        }`}>
          {label}
        </span>
      )}

      {/* Phoneme expansion */}
      {isExpanded && word.phonemes && word.phonemes.length > 0 && (
        <div className="mt-1 p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg text-xs min-w-[120px]">
          <div className="font-medium text-gray-600 dark:text-gray-400 mb-1">Phonemes:</div>
          <div className="flex flex-wrap gap-1">
            {word.phonemes.map((p, i) => (
              <span
                key={i}
                className={`px-1.5 py-0.5 rounded font-mono ${
                  p.accuracyScore >= 90 ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' :
                  p.accuracyScore >= 70 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' :
                  'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-bold'
                }`}
              >
                /{p.phoneme}/ {Math.round(p.accuracyScore)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

interface ShadowingResultProps {
  result: PronunciationResult
  onTryAgain: () => void
  onListenAgain: () => void
}

export function ShadowingResult({ result, onTryAgain, onListenAgain }: ShadowingResultProps) {
  const [expandedWord, setExpandedWord] = useState<number | null>(null)

  const problemWords = result.words.filter(
    (w) => w.errorType !== 'None' || w.accuracyScore < 70
  )

  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <h3 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
        <span className="text-lg">📊</span>
        Pronunciation Results
      </h3>

      {/* Score circles — 5 metrics */}
      <div className="flex items-start justify-around gap-1 flex-wrap">
        <ScoreCircle score={result.pronunciationScore} label="Overall" />
        <ScoreCircle score={result.accuracyScore} label="Accuracy" />
        <ScoreCircle score={result.fluencyScore} label="Fluency" />
        <ScoreCircle score={result.completenessScore} label="Completeness" />
        <ScoreCircle score={result.prosodyScore} label="Prosody" />
      </div>

      {/* Word-by-word interactive display */}
      {result.words.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Word-by-Word Scores
            <span className="text-xs text-gray-400 ml-2">(tap a word for details)</span>
          </h4>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2 items-start">
              {result.words.map((w, i) => (
                <WordToken
                  key={i}
                  word={w}
                  isExpanded={expandedWord === i}
                  onClick={() => setExpandedWord(expandedWord === i ? null : i)}
                />
              ))}
            </div>

            {/* Legend */}
            <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />90-100</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />70-89</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />0-69</span>
              <span className="line-through">Skipped</span>
              <span className="text-purple-500">Extra</span>
            </div>
          </div>
        </div>
      )}

      {/* Problem areas summary */}
      {problemWords.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <h4 className="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <span>⚠️</span> Words to Practice
          </h4>
          <div className="flex flex-col gap-1 pl-2">
            {problemWords.map((w, i) => {
              const lowPhonemes = (w.phonemes ?? []).filter((p) => p.accuracyScore < 70)
              return (
                <div key={i} className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-gray-800 dark:text-gray-200">"{w.word}"</span>
                  <span className="ml-1">({Math.round(w.accuracyScore)}/100)</span>
                  {w.errorType !== 'None' && (
                    <span className="ml-1 text-red-500">— {w.errorType}</span>
                  )}
                  {lowPhonemes.length > 0 && (
                    <span className="ml-1 text-amber-600 dark:text-amber-400">
                      — Watch: {lowPhonemes.map((p) => `/${p.phoneme}/`).join(', ')}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onTryAgain}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          🔄 Try Again
        </button>
        <button
          onClick={onListenAgain}
          className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          🔊 Listen Again
        </button>
      </div>
    </div>
  )
}
