import { useState, useEffect, useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useSettingsStore } from '../../stores/settingsStore'
import { QUESTIONS, CATEGORIES, DIFFICULTIES } from '../../data/questions'
import type { Question } from '../../data/questions'

function pickRandom(questions: Question[]): Question {
  return questions[Math.floor(Math.random() * questions.length)]
}

export function QuestionPrompt() {
  const { thinkTime, setSession } = useSettingsStore(
    useShallow((s) => ({
      thinkTime: s.thinkTime,
      setSession: s.setSession,
    }))
  )

  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [customQuestion, setCustomQuestion] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [question, setQuestion] = useState<Question | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [ready, setReady] = useState(false)

  const filteredQuestions = QUESTIONS.filter((q) => {
    if (difficultyFilter !== 'all' && q.difficulty !== difficultyFilter) return false
    if (categoryFilter !== 'all' && q.category !== categoryFilter) return false
    return true
  })

  const pickNewQuestion = useCallback(() => {
    const pool = filteredQuestions.length > 0 ? filteredQuestions : QUESTIONS
    const q = pickRandom(pool)
    setQuestion(q)
    setUseCustom(false)
    setReady(false)
    setCountdown(thinkTime > 0 ? thinkTime : null)
    setSession({
      modeState: { questionText: q.question, difficulty: q.difficulty, category: q.category, followUp: q.followUp },
    })
  }, [filteredQuestions, thinkTime, setSession])

  // Pick initial question
  useEffect(() => {
    if (!question && !useCustom) pickNewQuestion()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Think time countdown
  useEffect(() => {
    if (countdown === null || countdown <= 0) {
      if (countdown === 0) setReady(true)
      return
    }
    const timer = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const handleCustomApply = () => {
    if (!customQuestion.trim()) return
    setUseCustom(true)
    setQuestion(null)
    setReady(false)
    setCountdown(thinkTime > 0 ? thinkTime : null)
    setSession({
      modeState: { questionText: customQuestion.trim(), difficulty: 'custom', category: 'Custom' },
    })
  }

  const handleReady = () => {
    setCountdown(null)
    setReady(true)
  }

  const currentQuestionText = useCustom ? customQuestion.trim() : question?.question ?? ''
  const difficultyColor =
    question?.difficulty === 'beginner'
      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      : question?.difficulty === 'intermediate'
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
      : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'

  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 flex flex-col gap-4">
      {/* Question display */}
      {currentQuestionText && (
        <div className="flex flex-col gap-3">
          <p className="text-xl font-semibold text-gray-800 dark:text-white leading-relaxed">
            {currentQuestionText}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {question && !useCustom && (
              <>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColor}`}>
                  {question.difficulty}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium">
                  {question.category}
                </span>
              </>
            )}
            {useCustom && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-medium">
                Custom
              </span>
            )}
          </div>
          {question?.followUp && !useCustom && (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              Follow-up: {question.followUp}
            </p>
          )}
        </div>
      )}

      {/* Think time countdown */}
      {countdown !== null && countdown > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
          <div className="text-3xl font-mono font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
            {countdown}s
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Think time...</p>
            <p className="text-xs text-indigo-500 dark:text-indigo-400">Organize your thoughts before speaking</p>
          </div>
          <button
            onClick={handleReady}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            I'm ready
          </button>
        </div>
      )}

      {ready && (
        <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-center">
          <p className="text-sm font-medium text-green-700 dark:text-green-300">Ready! Start recording your answer below.</p>
        </div>
      )}

      {/* Filters + New Question */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={pickNewQuestion}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          🔀 New Question
        </button>

        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
        >
          <option value="all">All Levels</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Custom question */}
      <div className="flex gap-2">
        <input
          type="text"
          value={customQuestion}
          onChange={(e) => setCustomQuestion(e.target.value)}
          placeholder="Or type your own question..."
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-400"
          onKeyDown={(e) => e.key === 'Enter' && handleCustomApply()}
        />
        <button
          onClick={handleCustomApply}
          disabled={!customQuestion.trim()}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Use
        </button>
      </div>
    </div>
  )
}
