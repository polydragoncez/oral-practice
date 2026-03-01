import { useState, useEffect, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useSettingsStore } from '../../stores/settingsStore'
import { getAllSessions, type SessionRecord } from '../../services/db'

interface DayStats {
  sessions: number
  totalSeconds: number
}

type StatsMap = Map<string, DayStats>

function toDateKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

/** Monday=0 ... Sunday=6 */
function getMondayBasedDay(year: number, month: number, day: number): number {
  const d = new Date(year, month, day).getDay()
  return d === 0 ? 6 : d - 1
}

function heatColor(seconds: number): string {
  if (seconds === 0) return 'bg-gray-100 dark:bg-gray-700'
  const mins = seconds / 60
  if (mins < 5) return 'bg-green-200 dark:bg-green-900'
  if (mins < 10) return 'bg-green-400 dark:bg-green-700'
  if (mins < 20) return 'bg-green-500 dark:bg-green-600'
  return 'bg-green-700 dark:bg-green-500'
}

function computeStreaks(statsMap: StatsMap): { current: number; longest: number } {
  if (statsMap.size === 0) return { current: 0, longest: 0 }

  const sortedDates = Array.from(statsMap.keys()).sort()
  const dateSet = new Set(sortedDates)

  // Longest streak
  let longest = 0
  let run = 0
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      run = 1
    } else {
      const prev = new Date(sortedDates[i - 1])
      const curr = new Date(sortedDates[i])
      const diffMs = curr.getTime() - prev.getTime()
      if (diffMs <= 86400000 + 1000) {
        run++
      } else {
        run = 1
      }
    }
    if (run > longest) longest = run
  }

  // Current streak — count backwards from today (or yesterday if today has no practice)
  const today = toDateKey(Date.now())
  const yesterday = toDateKey(Date.now() - 86400000)
  let current = 0

  if (dateSet.has(today)) {
    current = 1
    let d = new Date()
    d.setDate(d.getDate() - 1)
    while (dateSet.has(toDateKey(d.getTime()))) {
      current++
      d.setDate(d.getDate() - 1)
    }
  } else if (dateSet.has(yesterday)) {
    current = 1
    let d = new Date()
    d.setDate(d.getDate() - 2)
    while (dateSet.has(toDateKey(d.getTime()))) {
      current++
      d.setDate(d.getDate() - 1)
    }
  }

  return { current, longest }
}

export function Stats() {
  const { dailyGoal } = useSettingsStore(
    useShallow((s) => ({ dailyGoal: s.dailyGoal }))
  )

  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [tooltip, setTooltip] = useState<{ key: string; x: number; y: number } | null>(null)

  useEffect(() => {
    getAllSessions().then((s) => {
      setSessions(s)
      setLoading(false)
    })
  }, [])

  const statsMap = useMemo<StatsMap>(() => {
    const map: StatsMap = new Map()
    for (const s of sessions) {
      const key = toDateKey(s.timestamp)
      const existing = map.get(key) || { sessions: 0, totalSeconds: 0 }
      existing.sessions++
      existing.totalSeconds += s.duration || 0
      map.set(key, existing)
    }
    return map
  }, [sessions])

  // Today
  const todayKey = toDateKey(Date.now())
  const todayStats = statsMap.get(todayKey) || { sessions: 0, totalSeconds: 0 }
  const goalSeconds = dailyGoal * 60
  const goalProgress = Math.min(todayStats.totalSeconds / goalSeconds, 1)
  const goalMet = todayStats.totalSeconds >= goalSeconds

  // Calendar
  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDayOffset = getMondayBasedDay(viewYear, viewMonth, 1)
  const monthName = new Date(viewYear, viewMonth).toLocaleString('default', { month: 'long' })
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth()

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11) }
    else setViewMonth(viewMonth - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0) }
    else setViewMonth(viewMonth + 1)
  }

  // Weekly (last 7 days)
  const weekDays = useMemo(() => {
    const days: { label: string; key: string; seconds: number; isToday: boolean }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = toDateKey(d.getTime())
      const stat = statsMap.get(key)
      days.push({
        label: d.toLocaleDateString('default', { weekday: 'short' }),
        key,
        seconds: stat?.totalSeconds || 0,
        isToday: i === 0,
      })
    }
    return days
  }, [statsMap])

  const maxWeekSeconds = Math.max(...weekDays.map((d) => d.seconds), 1)

  // All-time
  const streaks = useMemo(() => computeStreaks(statsMap), [statsMap])
  const totalSessions = sessions.length
  const totalSeconds = useMemo(() => sessions.reduce((acc, s) => acc + (s.duration || 0), 0), [sessions])
  const daysWithPractice = statsMap.size
  const avgPerDay = daysWithPractice > 0 ? Math.round(totalSeconds / daysWithPractice) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2" />
        Loading stats...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Stats</h2>

      {/* Today's Summary */}
      <section className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Today
        </h3>
        <div className="flex items-center gap-4 mb-3">
          <div className="text-2xl font-bold text-gray-800 dark:text-white">
            {formatDuration(todayStats.totalSeconds)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {todayStats.sessions} session{todayStats.sessions !== 1 ? 's' : ''}
          </div>
          {goalMet && <span className="text-lg" title="Daily goal met!">🎉</span>}
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${goalMet ? 'bg-green-500' : 'bg-indigo-500'}`}
            style={{ width: `${Math.round(goalProgress * 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-400">
          <span>{Math.round(goalProgress * 100)}%</span>
          <span>Goal: {dailyGoal}m</span>
        </div>
      </section>

      {/* Monthly Calendar */}
      <section className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 relative">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={prevMonth}
            className="px-2 py-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            ◀
          </button>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {monthName} {viewYear}
          </h3>
          <button
            onClick={nextMonth}
            className="px-2 py-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            ▶
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const key = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const stat = statsMap.get(key)
            const secs = stat?.totalSeconds || 0
            const isToday = isCurrentMonth && day === now.getDate()

            return (
              <div
                key={key}
                className={`aspect-square rounded-md flex items-center justify-center text-xs font-medium cursor-default relative
                  ${heatColor(secs)}
                  ${secs > 0 ? 'text-white dark:text-white' : 'text-gray-400 dark:text-gray-500'}
                  ${isToday ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-gray-800' : ''}
                `}
                onMouseEnter={(e) => {
                  if (stat) {
                    const rect = e.currentTarget.getBoundingClientRect()
                    setTooltip({ key, x: rect.left + rect.width / 2, y: rect.top })
                  }
                }}
                onMouseLeave={() => setTooltip(null)}
              >
                {day}
              </div>
            )
          })}
        </div>

        {/* Tooltip */}
        {tooltip && statsMap.has(tooltip.key) && (() => {
          const stat = statsMap.get(tooltip.key)!
          const [, m, d] = tooltip.key.split('-')
          const monthLabel = new Date(viewYear, parseInt(m) - 1).toLocaleString('default', { month: 'short' })
          return (
            <div
              className="fixed z-50 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg px-3 py-1.5 shadow-lg pointer-events-none -translate-x-1/2 -translate-y-full"
              style={{ left: tooltip.x, top: tooltip.y - 4 }}
            >
              {monthLabel} {parseInt(d)}: {stat.sessions} session{stat.sessions !== 1 ? 's' : ''}, {formatDuration(stat.totalSeconds)}
            </div>
          )
        })()}

        {/* Legend */}
        <div className="flex items-center justify-end gap-1 mt-3 text-xs text-gray-400">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-700" />
          <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900" />
          <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-700" />
          <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-600" />
          <div className="w-3 h-3 rounded-sm bg-green-700 dark:bg-green-500" />
          <span>More</span>
        </div>
      </section>

      {/* Weekly Stats */}
      <section className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Last 7 Days
        </h3>
        <div className="flex flex-col gap-2">
          {weekDays.map((day) => (
            <div key={day.key} className="flex items-center gap-3">
              <span className={`text-xs w-8 shrink-0 ${day.isToday ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>
                {day.label}
              </span>
              <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-4 rounded-full transition-all duration-300 ${day.isToday ? 'bg-indigo-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.max(day.seconds > 0 ? 4 : 0, (day.seconds / maxWeekSeconds) * 100)}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 w-14 text-right shrink-0">
                {day.seconds > 0 ? formatDuration(day.seconds) : '—'}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* All-time Stats */}
      <section className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          All Time
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard label="Current Streak" value={`${streaks.current}d`} />
          <StatCard label="Longest Streak" value={`${streaks.longest}d`} />
          <StatCard label="Total Sessions" value={String(totalSessions)} />
          <StatCard label="Total Time" value={formatDuration(totalSeconds)} />
          <StatCard label="Avg / Day" value={formatDuration(avgPerDay)} />
          <StatCard label="Practice Days" value={String(daysWithPractice)} />
        </div>
      </section>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-750 border border-gray-100 dark:border-gray-700">
      <span className="text-lg font-bold text-gray-800 dark:text-white">{value}</span>
      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</span>
    </div>
  )
}
